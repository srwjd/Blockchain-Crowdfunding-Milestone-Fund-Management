import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Compass,
  FolderKanban,
  HeartHandshake,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Wallet,
  Search,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Clock,
  Users,
  Check,
  CheckCircle2,
  ExternalLink,
  Leaf,
  Activity,
  Radio,
  Blocks,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpLeft,
  X,
  Menu,
  LoaderCircle,
  Copy,
  Vote,
  RefreshCw,
  FileCheck2,
  LogOut,
  Info,
  Download,
} from "lucide-react";
import { parseEther, formatEther, isAddress } from "ethers";
import {
  OWNER,
  DONOR,
  eth,
  wei,
  short,
  same,
  now,
  status,
  statusNames,
  percent,
  loadDemo,
  actDemo,
  eventNames,
  seed,
} from "./data";
import {
  DEFAULT_CONFIG,
  validateConfig,
  connect,
  loadChain,
  writeChain,
  friendlyError,
} from "./chain";
const icons = {
  all: Compass,
  "IoT & เทคโนโลยี": Radio,
  "AI & นวัตกรรม": Activity,
  เพื่อสังคม: Leaf,
};
const categories = [
  "ทั้งหมด",
  "IoT & เทคโนโลยี",
  "AI & นวัตกรรม",
  "เพื่อสังคม",
];
const sum = (items, key) =>
  items.reduce((s, c) => s + BigInt(c[key] || 0), 0n).toString();
function Art({ category, small = false }) {
  const kind = category?.includes("AI")
    ? "ai"
    : category?.includes("IoT")
      ? "iot"
      : "green";
  return (
    <div
      className={`project-art ${kind} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      <span className="art-grid" />
      <span className="orb orb-one" />
      <span className="orb orb-two" />
      {kind === "iot" ? (
        <>
          <div className="sensor">
            <Radio size={37} />
            <span>SMART FARM</span>
            <i />
            <i />
            <i />
          </div>
          <div className="plant plant-one">
            <span />
            <span />
            <b />
          </div>
          <div className="plant plant-two">
            <span />
            <span />
            <b />
          </div>
          <div className="art-chip">
            <Activity size={13} /> SOIL HEALTH <b>98%</b>
          </div>
        </>
      ) : kind === "ai" ? (
        <>
          <div className="health-disc">
            <HeartHandshake size={70} strokeWidth={1.2} />
          </div>
          <svg className="pulse" viewBox="0 0 300 90">
            <path d="M0 47H65L80 24L95 70L115 9L139 66L157 47H300" />
          </svg>
          <div className="art-chip">
            <Activity size={13} /> CARE, CONNECTED
          </div>
        </>
      ) : (
        <>
          <div className="earth">
            <Leaf size={83} strokeWidth={1} />
          </div>
          <div className="orbit" />
          <div className="art-chip">
            <Leaf size={13} /> A BETTER TOMORROW
          </div>
        </>
      )}
      <span className="art-label">INNOVATION FOR GOOD ↗</span>
    </div>
  );
}
function App() {
  const [demo, setDemo] = useState(loadDemo);
  const [mode, setMode] = useState("demo");
  const [role, setRole] = useState("supporter");
  const [session, setSession] = useState(null);
  const [chain, setChain] = useState({ campaigns: [], events: [] });
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configReady, setConfigReady] = useState(false);
  const [route, setRoute] = useState(
    () => location.hash.slice(1) || "dashboard",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [, tick] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const operation = useRef(false);
  const sessionVersion = useRef(0);
  const account =
    mode === "demo" ? (role === "owner" ? OWNER : DONOR) : session?.account;
  const data = mode === "demo" ? demo : chain;
  const campaigns = data.campaigns;
  const navigate = (path) => {
    location.hash = path;
    setMobile(false);
    setSearch("");
    setFilter("all");
  };
  useEffect(() => {
    const handler = () => {
      setRoute(location.hash.slice(1) || "dashboard");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handler);
    const timer = setInterval(() => tick((t) => t + 1), 30000);
    return () => {
      window.removeEventListener("hashchange", handler);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("innovatefund-demo-v1", JSON.stringify(demo));
    } catch {}
  }, [demo]);
  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.BASE_URL}config.json`)
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .catch(() => DEFAULT_CONFIG)
      .then((c) => {
        let local = {};
        try {
          local = JSON.parse(
            localStorage.getItem("innovatefund-config") || "{}",
          );
        } catch {}
        if (active) {
          setConfig({ ...DEFAULT_CONFIG, ...c, ...local });
          setConfigReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 9000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!window.ethereum) return;
    const reset = () => {
      sessionVersion.current++;
      setSession(null);
      setChain({ campaigns: [], events: [] });
      setToast({
        error: true,
        text: "บัญชีหรือเครือข่ายเปลี่ยนแล้ว กรุณาเชื่อมต่อ Wallet อีกครั้ง",
      });
    };
    window.ethereum.on?.("accountsChanged", reset);
    window.ethereum.on?.("chainChanged", reset);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", reset);
      window.ethereum.removeListener?.("chainChanged", reset);
    };
  }, []);
  async function refresh(s = session, cfg = config) {
    if (!s) return;
    const version = sessionVersion.current;
    setRefreshing(true);
    try {
      const d = await loadChain(cfg, s.provider, s.account);
      if (version === sessionVersion.current) setChain(d);
    } catch (e) {
      setToast({ error: true, text: friendlyError(e) });
    } finally {
      setRefreshing(false);
    }
  }
  async function connectWallet() {
    if (operation.current) return;
    if (!config.contractAddress) {
      navigate("settings");
      setToast({
        error: true,
        text: "ตั้งค่า Contract Address หลัง deploy ใน Remix IDE ก่อนเชื่อมต่อ",
      });
      return;
    }
    operation.current = true;
    setBusy(true);
    try {
      const cfg = validateConfig(config);
      const s = await connect(cfg);
      const version = ++sessionVersion.current;
      const d = await loadChain(cfg, s.provider, s.account);
      if (version === sessionVersion.current) {
        setSession(s);
        setChain(d);
        setMode("chain");
        setToast({ text: "เชื่อมต่อ Sepolia สำเร็จแล้ว" });
      }
    } catch (e) {
      setToast({ error: true, text: friendlyError(e) });
    } finally {
      setBusy(false);
      operation.current = false;
    }
  }
  async function execute(action) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      if (mode === "demo") {
        setDemo(actDemo(demo, action, account));
        setToast({ text: "บันทึกในโหมดสาธิตแล้ว • ไม่มีการใช้ ETH จริง" });
      } else {
        const version = sessionVersion.current;
        const hash = await writeChain(config, session, action, campaigns);
        setToast({ text: "ธุรกรรมยืนยันบน Sepolia แล้ว", hash });
        if (version === sessionVersion.current) await refresh();
      }
      setModal(null);
      if (action.type === "create") navigate("manage");
    } catch (e) {
      setToast({ error: true, text: friendlyError(e) });
    } finally {
      setBusy(false);
      operation.current = false;
    }
  }
  const selected = route.startsWith("campaign/")
    ? campaigns.find((c) => c.id === Number(route.split("/")[1]))
    : null;
  const nav = [
    ["dashboard", LayoutDashboard, "ภาพรวม"],
    ["explore", Compass, "สำรวจโครงการ"],
    ["manage", FolderKanban, "โครงการของฉัน"],
    ["contributions", HeartHandshake, "การสนับสนุนของฉัน"],
    ["transparency", ChartNoAxesCombined, "ความโปร่งใส"],
  ];
  const totals = {
    raised: sum(campaigns, "raised"),
    escrow: sum(campaigns, "escrow"),
    released: sum(campaigns, "released"),
    refunded: sum(campaigns, "refunded"),
  };
  const mine = campaigns.filter((c) => same(c.owner, account));
  const supporting = campaigns.filter(
    (c) => BigInt(c.contributions[account] || 0) > 0n,
  );
  const pageTitle =
    route === "create"
      ? "สร้างโครงการใหม่"
      : route === "settings"
        ? "การเชื่อมต่อระบบ"
        : selected
          ? "รายละเอียดโครงการ"
          : nav.find((n) => n[0] === route)?.[2] || "ภาพรวม";
  function card(c) {
    const p = percent(c.raised, c.goal),
      s = status(c);
    return (
      <article className="project-card" key={c.id}>
        <button
          className="art-button"
          onClick={() => navigate(`campaign/${c.id}`)}
          aria-label={`ดูรายละเอียด ${c.title}`}
        >
          <Art category={c.category} />
          <span className={`status-tag ${s}`}>
            <i />
            {statusNames[s]}
          </span>
        </button>
        <div className="card-body">
          <span className="category-label">{c.category}</span>
          <h3>
            <button onClick={() => navigate(`campaign/${c.id}`)}>
              {c.title}
            </button>
          </h3>
          <p>{c.description}</p>
          <div className="card-owner">
            <span className="mini-avatar">{c.title.slice(0, 1)}</span>โดย{" "}
            {short(c.owner)}
            <ShieldCheck size={13} />
          </div>
          <div className="progress-row">
            <strong>
              {eth(c.raised)} <span>ETH</span>
            </strong>
            <span>{p.toFixed(0)}%</span>
          </div>
          <div className="progress">
            <span style={{ width: p + "%" }} />
          </div>
          <div className="goal-row">
            จากเป้าหมาย {eth(c.goal)} ETH{" "}
            <span>
              {c.milestones.filter((m) => m.paid).length}/{c.milestones.length}{" "}
              Milestones
            </span>
          </div>
          <div className="card-foot">
            <span>
              <Users size={14} />
              {c.supporterCount} ผู้สนับสนุน
            </span>
            <span>
              <Clock size={14} />
              {s === "active"
                ? `${Math.max(1, Math.ceil((c.deadline - now()) / 86400))} วัน`
                : "ปิดระดมทุน"}
            </span>
            <button
              onClick={() => navigate(`campaign/${c.id}`)}
              aria-label="ดูโครงการ"
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
        </div>
      </article>
    );
  }
  function listing(list) {
    let filtered = list.filter(
      (c) =>
        (category === "ทั้งหมด" || c.category === category) &&
        `${c.title} ${c.description}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "all" || status(c) === filter),
    );
    filtered = [...filtered].sort((a, b) =>
      sort === "progress"
        ? percent(b.raised, b.goal) - percent(a.raised, a.goal)
        : sort === "ending"
          ? a.deadline - b.deadline
          : b.id - a.id,
    );
    if (route === "dashboard" && sort === "newest")
      filtered.sort((a, b) => a.id - b.id);
    return (
      <>
        <div className="list-toolbar">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={category === cat ? "active" : ""}
                onClick={() => setCategory(cat)}
              >
                {cat === "ทั้งหมด" ? (
                  <Compass size={15} />
                ) : (
                  React.createElement(icons[cat], { size: 15 })
                )}
                {cat}
              </button>
            ))}
          </div>
          <select
            aria-label="เรียงโครงการ"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">โครงการล่าสุด</option>
            <option value="progress">ยอดระดมทุนสูงสุด (%)</option>
            <option value="ending">ใกล้สิ้นสุด</option>
          </select>
        </div>
        {filtered.length ? (
          <div className="project-grid">{filtered.map(card)}</div>
        ) : (
          <Empty
            title="ยังไม่มีโครงการในรายการนี้"
            text={
              mode === "chain" && !session
                ? "เชื่อมต่อ Wallet เพื่อโหลดโครงการจาก Sepolia"
                : "ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ หรือสร้างโครงการใหม่ได้เลย"
            }
            action={() => navigate("create")}
            label="สร้างโครงการ"
          />
        )}
      </>
    );
  }
  function ledger(events, compact = false) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>รายการ / โครงการ</th>
              <th>ผู้ทำรายการ</th>
              <th>จำนวน ETH</th>
              <th>{compact ? "สถานะ" : "วันที่ / ธุรกรรม"}</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, compact ? 5 : 200).map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="transaction-name">
                    <span
                      className={`transaction-icon ${e.type === "FundsReleased" || e.type === "Refunded" ? "out" : ""}`}
                    >
                      {e.type === "Contributed" ? (
                        <ArrowDownLeft size={18} />
                      ) : e.type === "FundsReleased" ||
                        e.type === "Refunded" ? (
                        <ArrowUpRight size={18} />
                      ) : (
                        <FileCheck2 size={18} />
                      )}
                    </span>
                    <span>
                      <b>{eventNames[e.type]}</b>
                      <small>
                        {campaigns.find((c) => c.id === e.campaignId)?.title ||
                          `โครงการ #${e.campaignId}`}
                      </small>
                    </span>
                  </div>
                </td>
                <td className="mono">
                  {e.account ? short(e.account) : "Smart Contract"}
                </td>
                <td className="amount">
                  {BigInt(e.amount || 0) > 0n
                    ? `${e.type === "Contributed" ? "+" : "−"}${eth(e.amount)}`
                    : "—"}
                </td>
                <td>
                  {compact ? (
                    <span className="confirmed">
                      <CheckCircle2 size={13} />
                      {mode === "demo" ? "สาธิต" : "ยืนยันแล้ว"}
                    </span>
                  ) : (
                    <>
                      <span className="date">
                        {new Date(e.time * 1000).toLocaleString("th-TH", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {e.hash ? (
                        <a
                          href={`${DEFAULT_CONFIG.explorerUrl}/tx/${e.hash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(e.hash)} <ExternalLink size={11} />
                        </a>
                      ) : (
                        <small>ข้อมูลสาธิต</small>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length && (
          <div className="empty-inline">
            ยังไม่มีรายการ{" "}
            {mode === "chain" ? "หรือ RPC ยังไม่ส่งประวัติกลับมา" : ""}
          </div>
        )}
        {!compact && events.length > 200 && (
          <p className="hint">
            แสดง 200 รายการล่าสุด ดาวน์โหลด CSV เพื่อดูรายการที่โหลดมาทั้งหมด
          </p>
        )}
      </div>
    );
  }
  function exportCsv() {
    const rows = [
      [
        "type",
        "campaignId",
        "account",
        "amountETH",
        "timeUTC",
        "transactionHash",
      ],
      ...data.events.map((e) => [
        e.type,
        e.campaignId,
        e.account,
        eth(e.amount),
        new Date(e.time * 1000).toISOString(),
        e.hash || "DEMO",
      ]),
    ];
    const blob = new Blob(
      [
        "\uFEFF" +
          rows
            .map((r) =>
              r
                .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
                .join(","),
            )
            .join("\n"),
      ],
      { type: "text/csv;charset=utf-8;" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `innovatefund-${mode}-transactions.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const availableRoutes = [
    "dashboard",
    "explore",
    "manage",
    "contributions",
    "transparency",
    "settings",
    "create",
  ];
  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop ${mobile ? "show" : ""}`}
        onClick={() => setMobile(false)}
      />
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <button className="brand" onClick={() => navigate("dashboard")}>
          <span className="brand-mark">
            <ChartNoAxesCombined size={24} />
          </span>
          <span>
            Innovate<span className="brand-fund">Fund</span>
            <small>IDEAS INTO IMPACT</small>
          </span>
        </button>
        <div className="workspace-label">
          WORKSPACE <span>ETHEREUM</span>
        </div>
        <nav>
          {nav.map(([path, Icon, label]) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={route === path ? "selected" : ""}
            >
              <Icon size={19} />
              {label}
              {path === "manage" && mine.length > 0 && (
                <span className="nav-count">{mine.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-box">
            <div className="trust-symbol">
              <ShieldCheck size={25} />
              <span className="tiny-spark">✦</span>
            </div>
            <h4>ทุกการสนับสนุนมีความหมาย</h4>
            <p>
              เงินทุนปลอดภัยใน Smart Contract
              <br />
              จ่ายเมื่อสำเร็จและผ่านการอนุมัติ
            </p>
            <button onClick={() => navigate("transparency")}>
              ดูความโปร่งใส <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className={`settings-nav ${route === "settings" ? "selected" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings size={18} />
            การเชื่อมต่อระบบ
          </button>
          <div className="network-status">
            <i />
            <span>
              {mode === "demo" ? "Demo workspace" : "Sepolia Testnet"}
            </span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="เปิดเมนู"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <b>{pageTitle}</b>
          </div>
          <div className="top-actions">
            {mode === "chain" && session && (
              <button
                className="refresh-button"
                aria-label="รีเฟรชข้อมูลจาก Blockchain"
                disabled={busy || refreshing}
                onClick={() => refresh()}
              >
                <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              </button>
            )}
            <span className={`network-pill ${mode}`}>
              <i />
              {mode === "demo" ? "โหมดสาธิต" : "Sepolia"}
            </span>
            <button
              className="wallet-button"
              onClick={connectWallet}
              disabled={busy || !configReady}
            >
              <Wallet size={16} />
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : mode === "chain" && session ? (
                short(account)
              ) : (
                "เชื่อมต่อ Wallet"
              )}
              {mode === "chain" && session && <span className="wallet-dot" />}
            </button>
          </div>
        </header>
        <main>
          <div className="demo-bar">
            <span>
              <Info size={15} />
              {mode === "demo"
                ? "กำลังใช้ข้อมูลสาธิต • ทดลองได้ทุกขั้นตอนโดยไม่ใช้เงินจริง"
                : "ข้อมูลจาก Smart Contract บน Sepolia • ใช้ ETH ทดสอบเท่านั้น"}
            </span>
            {mode === "demo" ? (
              <label>
                ทดลองเป็น
                <select
                  value={role}
                  disabled={busy}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="supporter">ผู้สนับสนุน</option>
                  <option value="owner">เจ้าของโครงการ</option>
                </select>
                <ChevronDown size={13} />
              </label>
            ) : (
              <button
                disabled={busy}
                onClick={() => {
                  sessionVersion.current++;
                  setMode("demo");
                  setSession(null);
                }}
              >
                กลับโหมดสาธิต <LogOut size={13} />
              </button>
            )}
          </div>
          {["dashboard", "explore"].includes(route) && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">BUILD SOMETHING THAT MATTERS</span>
                  <h1>
                    {route === "dashboard"
                      ? "ร่วมสร้างอนาคต เริ่มต้นที่นี่"
                      : "ค้นหาไอเดียที่คุณเชื่อมั่น"}
                    <span className="orange">.</span>
                  </h1>
                  <p>
                    สนับสนุนไอเดียที่เชื่อมั่น ติดตามทุกความสำเร็จอย่างโปร่งใส
                  </p>
                </div>
                <button className="primary" onClick={() => navigate("create")}>
                  <Plus size={17} />
                  สร้างโครงการ
                </button>
              </div>
              {route === "dashboard" && (
                <section className="hero">
                  <div className="hero-copy">
                    <span className="hero-kicker">
                      <span /> POWERED BY ETHEREUM
                    </span>
                    <h2>
                      ไอเดียที่ดี สมควรได้รับ
                      <br />
                      โอกาสที่<span>เป็นจริง</span>
                      <span className="hero-star">✳</span>
                    </h2>
                    <p>
                      ระดมทุนอย่างมั่นใจด้วย Smart Contract
                      <br />
                      ปลดล็อกเงินทุนทีละก้าว เมื่อทุกคนเห็นความสำเร็จ
                    </p>
                    <button
                      onClick={() => {
                        document
                          .getElementById("projects")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      ค้นพบโครงการ <ArrowUpRight size={18} />
                    </button>
                    <div className="hero-trust">
                      <ShieldCheck size={14} />
                      เงินทุนในสัญญา • ผู้สนับสนุนร่วมตัดสินใจ
                    </div>
                  </div>
                  <div className="hero-visual" aria-hidden="true">
                    <div className="hero-orbit orbit-a" />
                    <div className="hero-orbit orbit-b" />
                    <span className="float-spark spark-a">✦</span>
                    <span className="float-spark spark-b">✳</span>
                    <div className="floating-pill pill-top">
                      <span className="pill-icon">
                        <ShieldCheck size={20} />
                      </span>
                      <span>
                        Smart Contract<small>โปร่งใส ตรวจสอบได้</small>
                      </span>
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="ethereum-token">
                      <svg viewBox="0 0 80 130">
                        <path d="M40 3L4 66L40 86L76 66Z" fill="#fff8ef" />
                        <path d="M40 3V86L76 66Z" fill="#efcfad" />
                        <path d="M4 74L40 127L76 74L40 95Z" fill="#fff8ef" />
                        <path d="M40 95V127L76 74Z" fill="#efcfad" />
                      </svg>
                    </div>
                    <div className="floating-pill pill-bottom">
                      <span className="pill-icon">
                        <TrendingUp size={20} />
                      </span>
                      <span>
                        Milestone unlocked
                        <small>ทุกความสำเร็จ มีความหมาย</small>
                      </span>
                      <span className="green-check">✓</span>
                    </div>
                    <div className="step-dots">
                      <i className="done" />
                      <span />
                      <i className="done" />
                      <span />
                      <i />
                    </div>
                  </div>
                </section>
              )}
              <div className="stats-grid">
                <Stat
                  icon={Wallet}
                  label="เงินระดมทุนสะสม"
                  value={eth(totals.raised)}
                  unit="ETH"
                  detail={`${campaigns.length} โครงการบนแพลตฟอร์ม`}
                  color="orange"
                />
                <Stat
                  icon={ShieldCheck}
                  label="เงินทุนใน Smart Contract"
                  value={eth(totals.escrow)}
                  unit="ETH"
                  detail="รอการอนุมัติตามความสำเร็จ"
                  color="blue"
                />
                <Stat
                  icon={FolderKanban}
                  label="โครงการที่กำลังระดมทุน"
                  value={campaigns.filter((c) => status(c) === "active").length}
                  unit="โครงการ"
                  detail="ร่วมเป็นส่วนหนึ่งของไอเดียใหม่"
                  color="purple"
                />
                <Stat
                  icon={CheckCircle2}
                  label="Milestone ที่จ่ายเงินแล้ว"
                  value={campaigns.reduce(
                    (n, c) => n + c.milestones.filter((m) => m.paid).length,
                    0,
                  )}
                  unit="Milestones"
                  detail={`ปลดล็อกเงินทุนแล้ว ${eth(totals.released)} ETH`}
                  color="green"
                />
              </div>
              <section id="projects">
                <div className="section-heading">
                  <div>
                    <h2>
                      {route === "dashboard"
                        ? "โครงการที่น่าจับตา"
                        : "สำรวจทุกโครงการ"}{" "}
                      <span className="count-chip">{campaigns.length}</span>
                    </h2>
                    <p>ไอเดียใหม่ ความเป็นไปได้ใหม่ รอให้คุณเป็นส่วนหนึ่ง</p>
                  </div>
                  <div className="section-tools">
                    <label className="search-box">
                      <Search size={16} />
                      <input
                        aria-label="ค้นหาโครงการ"
                        placeholder="ค้นหาโครงการ..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    {route === "dashboard" && (
                      <button
                        className="text-button"
                        onClick={() => navigate("explore")}
                      >
                        ดูทั้งหมด <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </div>
                {listing(campaigns)}
              </section>
              {route === "dashboard" && (
                <section className="activity-section">
                  <div className="section-heading">
                    <div>
                      <h2>ความเคลื่อนไหวล่าสุด</h2>
                      <p>ทุกธุรกรรม ตรวจสอบได้เสมอ</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("transparency")}
                    >
                      ดูประวัติทั้งหมด <ArrowRight size={15} />
                    </button>
                  </div>
                  {ledger(data.events, true)}
                </section>
              )}
            </>
          )}
          {route === "manage" && (
            <>
              <PageHeading
                eyebrow="YOUR IDEAS, YOUR IMPACT"
                title="โครงการของฉัน"
                description="จัดการโครงการ ส่งหลักฐาน และติดตามการอนุมัติเงินทุน"
                action={
                  <button
                    className="primary"
                    onClick={() => navigate("create")}
                  >
                    <Plus size={16} />
                    สร้างโครงการ
                  </button>
                }
              />
              <div className="info-panel">
                <ShieldCheck size={20} />
                <span>
                  การจ่ายเงินเป็นไปตาม Smart Contract
                  เจ้าของโครงการส่งหลักฐานได้เมื่อระดมทุนครบเป้า
                  และต้องรอเสียงอนุมัติเกิน 50% ของเงินสนับสนุนทั้งหมด
                </span>
              </div>
              {listing(mine)}
            </>
          )}
          {route === "contributions" && (
            <>
              <PageHeading
                eyebrow="MAKE CHANGE HAPPEN"
                title="การสนับสนุนของฉัน"
                description="ติดตามเงินสนับสนุน ลงคะแนน Milestone และขอคืนเงิน"
              />
              <div className="stats-grid three">
                <Stat
                  icon={HeartHandshake}
                  label="ยอดสนับสนุนคงสิทธิ์"
                  value={eth(
                    supporting
                      .reduce(
                        (s, c) => s + BigInt(c.contributions[account] || 0),
                        0n,
                      )
                      .toString(),
                  )}
                  unit="ETH"
                  detail="ยอดสนับสนุนที่ยังไม่ขอคืน"
                />
                <Stat
                  icon={Vote}
                  label="Milestone รอลงคะแนน"
                  value={supporting.reduce(
                    (n, c) =>
                      n +
                      c.milestones.filter(
                        (m) =>
                          m.requested && !m.paid && !m.votes.includes(account),
                      ).length,
                    0,
                  )}
                  unit="รายการ"
                  detail="ตรวจสอบหลักฐานก่อนอนุมัติ"
                  color="blue"
                />
                <Stat
                  icon={RefreshCw}
                  label="ยอดที่ขอคืนได้"
                  value={eth(
                    supporting
                      .filter((c) => status(c) === "failed")
                      .reduce(
                        (n, c) => n + BigInt(c.contributions[account] || 0),
                        0n,
                      )
                      .toString(),
                  )}
                  unit="ETH"
                  detail="โครงการที่ไม่ถึงเป้าหมาย"
                  color="green"
                />
              </div>
              {listing(supporting)}
              <div className="section-heading">
                <h2>ประวัติการสนับสนุนของคุณ</h2>
              </div>
              {ledger(
                data.events.filter(
                  (e) =>
                    same(e.account, account) &&
                    ["Contributed", "Refunded", "MilestoneApproved"].includes(
                      e.type,
                    ),
                ),
              )}
            </>
          )}
          {route === "transparency" && (
            <>
              <PageHeading
                eyebrow="TRUST, VERIFIED ON CHAIN"
                title="ความโปร่งใสทางการเงิน"
                description="เงินทุก ETH มีที่มา และทุกการจ่ายมีความสำเร็จรองรับ"
                action={
                  <button className="secondary" onClick={exportCsv}>
                    <Download size={16} />
                    ดาวน์โหลด CSV
                  </button>
                }
              />
              <div className="stats-grid">
                <Stat
                  icon={ArrowDownLeft}
                  label="เงินเข้าสะสม"
                  value={eth(totals.raised)}
                  unit="ETH"
                  detail="จากผู้สนับสนุนทั้งหมด"
                />
                <Stat
                  icon={ShieldCheck}
                  label="เงินคงเหลือในสัญญา"
                  value={eth(totals.escrow)}
                  unit="ETH"
                  detail="แยกบัญชีรายโครงการ"
                  color="blue"
                />
                <Stat
                  icon={ArrowUpRight}
                  label="เงินจ่ายตาม Milestone"
                  value={eth(totals.released)}
                  unit="ETH"
                  detail="ผ่านการอนุมัติแล้ว"
                  color="green"
                />
                <Stat
                  icon={RefreshCw}
                  label="เงินคืนสะสม"
                  value={eth(totals.refunded)}
                  unit="ETH"
                  detail="คืนให้ผู้สนับสนุน"
                  color="purple"
                />
              </div>
              <div className="info-panel">
                <ShieldCheck size={22} />
                <span>
                  เงินเข้าสะสม = เงินคงเหลือในสัญญา + เงินจ่ายตาม Milestone +
                  เงินคืนสะสม
                  <br />
                  <b>
                    {eth(totals.raised)} = {eth(totals.escrow)} +{" "}
                    {eth(totals.released)} + {eth(totals.refunded)} ETH
                  </b>
                </span>
              </div>
              <div className="section-heading">
                <h2>สถานะ Milestone ทุกโครงการ</h2>
                {mode === "chain" && (
                  <button
                    className="text-button"
                    disabled={refreshing}
                    onClick={() => refresh()}
                  >
                    <RefreshCw size={14} className={refreshing ? "spin" : ""} />
                    รีเฟรชข้อมูล
                  </button>
                )}
              </div>
              <div className="milestone-overview">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`campaign/${c.id}`)}
                  >
                    <span>
                      <b>{c.title}</b>
                      <small>
                        {c.milestones.filter((m) => m.paid).length}/
                        {c.milestones.length} Milestones • จ่ายแล้ว{" "}
                        {eth(c.released)} ETH
                      </small>
                    </span>
                    <span className="mini-steps">
                      {c.milestones.map((m, i) => (
                        <span
                          key={i}
                          className={
                            m.paid ? "paid" : m.requested ? "requested" : ""
                          }
                        >
                          {m.paid ? <Check size={12} /> : i + 1}
                        </span>
                      ))}
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
              <div className="section-heading">
                <h2>ประวัติธุรกรรม</h2>
                <select
                  aria-label="กรองธุรกรรม"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">ทุกรายการ</option>
                  {Object.entries(eventNames).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              {chain.eventError && mode === "chain" && (
                <div className="notice">
                  {chain.eventError}{" "}
                  <a
                    href={`${DEFAULT_CONFIG.explorerUrl}/address/${config.contractAddress}#events`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิด Etherscan ↗
                  </a>
                </div>
              )}
              {ledger(
                data.events.filter(
                  (e) => filter === "all" || e.type === filter,
                ),
              )}
            </>
          )}
          {route === "create" && (
            <>
              <PageHeading
                eyebrow="FROM IDEA TO IMPACT"
                title="เริ่มต้นโครงการของคุณ"
                description="บอกเล่าไอเดีย วางแผนความสำเร็จ และสร้างความเชื่อมั่นให้ผู้สนับสนุน"
              />
              <CreateForm
                busy={busy}
                mode={mode}
                account={account}
                onCreate={(payload) => execute({ type: "create", payload })}
                cancel={() => navigate("manage")}
              />
            </>
          )}
          {route === "settings" && (
            <>
              <PageHeading
                eyebrow="CONNECT YOUR WORKSPACE"
                title="การเชื่อมต่อระบบ"
                description="ตั้งค่า Smart Contract ที่ deploy ด้วย Remix IDE บน Sepolia"
              />
              <SettingsForm
                key={JSON.stringify(config)}
                config={config}
                busy={busy}
                save={(next) => {
                  if (busy) return;
                  try {
                    const valid = validateConfig(next);
                    localStorage.setItem(
                      "innovatefund-config",
                      JSON.stringify(valid),
                    );
                    sessionVersion.current++;
                    setSession(null);
                    setChain({ campaigns: [], events: [] });
                    setMode("demo");
                    setConfig(valid);
                    setToast({
                      text: "บันทึกแล้ว กดเชื่อมต่อ Wallet เพื่อใช้ Sepolia",
                    });
                  } catch (e) {
                    setToast({ error: true, text: friendlyError(e) });
                  }
                }}
                connectWallet={connectWallet}
              />
              <div className="panel reset-panel">
                <div>
                  <h3>ข้อมูลสาธิต</h3>
                  <p>เริ่มทดลองใหม่ด้วยตัวอย่างโครงการทั้ง 3 สถานะ</p>
                </div>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => setConfirmReset(true)}
                >
                  <RefreshCw size={15} />
                  รีเซ็ตโหมดสาธิต
                </button>
              </div>
            </>
          )}
          {route.startsWith("campaign/") &&
            (selected ? (
              <>
                <button
                  className="back-link"
                  onClick={() => navigate("explore")}
                >
                  ← กลับไปสำรวจโครงการ
                </button>
                <div className="detail-layout">
                  <div>
                    <div className="detail-art">
                      <Art category={selected.category} />
                    </div>
                    <span className="eyebrow">{selected.category}</span>
                    <h1 className="detail-title">{selected.title}</h1>
                    <div className="detail-meta">
                      <span className="mini-avatar">
                        {selected.title.slice(0, 1)}
                      </span>
                      โดย {short(selected.owner)} <ShieldCheck size={15} />
                      <span className={`status-tag inline ${status(selected)}`}>
                        {statusNames[status(selected)]}
                      </span>
                    </div>
                    <section className="panel story-panel">
                      <h2>เกี่ยวกับโครงการ</h2>
                      <p>
                        {selected.description ||
                          "เจ้าของโครงการยังไม่ได้เพิ่มรายละเอียด"}
                      </p>
                    </section>
                    <div className="section-heading">
                      <div>
                        <h2>แผนงานและการเบิกเงิน</h2>
                        <p>อนุมัติทีละขั้น เงินถึงมือเมื่อเห็นความสำเร็จ</p>
                      </div>
                      <span className="count-chip">
                        {selected.milestones.length} Milestones
                      </span>
                    </div>
                    <div className="milestone-list">
                      {selected.milestones.map((m, i) => {
                        const canVote =
                          m.requested &&
                          !m.paid &&
                          BigInt(selected.contributions[account] || 0) > 0n &&
                          !m.votes.includes(account);
                        return (
                          <div
                            key={i}
                            className={`milestone-card ${m.paid ? "paid" : m.requested ? "requested" : ""}`}
                          >
                            <div className="milestone-heading">
                              <span className="milestone-number">
                                {m.paid ? (
                                  <Check size={19} />
                                ) : (
                                  String(i + 1).padStart(2, "0")
                                )}
                              </span>
                              <div>
                                <span className="eyebrow">
                                  MILESTONE {i + 1}
                                </span>
                                <h3>{m.title}</h3>
                              </div>
                              <strong>
                                {eth(m.amount)} <small>ETH</small>
                              </strong>
                            </div>
                            <div className="milestone-state">
                              <span>
                                {m.paid
                                  ? "จ่ายเงินสำเร็จ"
                                  : m.requested
                                    ? "รอผู้สนับสนุนอนุมัติ"
                                    : "ยังไม่ขอเบิกเงิน"}
                              </span>
                              <b>
                                {percent(
                                  m.approvalWeight,
                                  selected.raised,
                                ).toFixed(1)}
                                % เห็นชอบ
                              </b>
                            </div>
                            {m.requested && (
                              <>
                                <div className="progress">
                                  <span
                                    style={{
                                      width:
                                        percent(
                                          m.approvalWeight,
                                          selected.raised,
                                        ) + "%",
                                    }}
                                  />
                                </div>
                                <div className="evidence">
                                  <FileCheck2 size={16} />
                                  <div>
                                    <b>หลักฐานความสำเร็จ</b>
                                    <p>{m.evidence}</p>
                                    {/^https?:\/\/\S+$/i.test(m.evidence) && (
                                      <a
                                        href={m.evidence}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        เปิดหลักฐาน <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                            {canVote && (
                              <button
                                className="primary vote-button"
                                disabled={busy}
                                onClick={() =>
                                  setModal({
                                    type: "approve",
                                    campaign: selected,
                                    index: i,
                                  })
                                }
                              >
                                <Vote size={16} />
                                ตรวจสอบและอนุมัติ Milestone
                              </button>
                            )}
                            {m.votes.includes(account) && !m.paid && (
                              <p className="voted">
                                <CheckCircle2 size={14} />
                                คุณลงคะแนนแล้ว รอผู้สนับสนุนท่านอื่น
                              </p>
                            )}
                            {same(selected.owner, account) &&
                              status(selected) === "funded" &&
                              i === selected.nextMilestone &&
                              !m.requested && (
                                <button
                                  className="primary"
                                  disabled={busy}
                                  onClick={() =>
                                    setModal({
                                      type: "request",
                                      campaign: selected,
                                    })
                                  }
                                >
                                  <FileCheck2 size={16} />
                                  ส่งหลักฐานเพื่อขอเบิกเงิน
                                </button>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <aside className="detail-sidebar">
                    <div className="panel funding-panel">
                      <span className="eyebrow">ร่วมขับเคลื่อนไอเดียนี้</span>
                      <div className="funding-amount">
                        {eth(selected.raised)} <span>ETH</span>
                      </div>
                      <p>
                        จากเป้าหมาย {eth(selected.goal)} ETH{" "}
                        <b>
                          {percent(selected.raised, selected.goal).toFixed(0)}%
                        </b>
                      </p>
                      <div className="progress">
                        <span
                          style={{
                            width:
                              percent(selected.raised, selected.goal) + "%",
                          }}
                        />
                      </div>
                      <div className="funding-facts">
                        <div>
                          <Users size={17} />
                          <strong>{selected.supporterCount}</strong>
                          <span>ผู้สนับสนุน</span>
                        </div>
                        <div>
                          <Clock size={17} />
                          <strong>
                            {status(selected) === "active"
                              ? Math.max(
                                  1,
                                  Math.ceil(
                                    (selected.deadline - now()) / 86400,
                                  ),
                                )
                              : "—"}
                          </strong>
                          <span>วันที่เหลือ</span>
                        </div>
                      </div>
                      <p className="deadline">
                        ครบกำหนด{" "}
                        {new Date(selected.deadline * 1000).toLocaleString(
                          "th-TH",
                        )}
                      </p>
                      {status(selected) === "active" ? (
                        <button
                          className="primary full"
                          disabled={busy || same(selected.owner, account)}
                          onClick={() =>
                            setModal({ type: "contribute", campaign: selected })
                          }
                        >
                          <HeartHandshake size={17} />
                          {same(selected.owner, account)
                            ? "คุณเป็นเจ้าของโครงการ"
                            : "สนับสนุนโครงการนี้"}
                        </button>
                      ) : (
                        <div className="funding-closed">
                          <CheckCircle2 size={17} />
                          {statusNames[status(selected)]}
                        </div>
                      )}
                      {status(selected) === "failed" &&
                        BigInt(selected.contributions[account] || 0) > 0n && (
                          <button
                            className="primary full"
                            disabled={busy}
                            onClick={() =>
                              setModal({ type: "refund", campaign: selected })
                            }
                          >
                            <RefreshCw size={16} />
                            ขอคืนเงิน {eth(selected.contributions[account])} ETH
                          </button>
                        )}
                      <div className="safe-note">
                        <ShieldCheck size={17} />
                        <span>
                          เงินของคุณเก็บใน Smart Contract
                          <br />
                          ผู้สนับสนุนอนุมัติก่อนการจ่ายเงิน
                        </span>
                      </div>
                    </div>
                    <div className="panel accounting-panel">
                      <h3>ภาพรวมเงินทุน</h3>
                      <div>
                        <span>เงินในสัญญา</span>
                        <b>{eth(selected.escrow)} ETH</b>
                      </div>
                      <div>
                        <span>จ่ายตาม Milestone แล้ว</span>
                        <b>{eth(selected.released)} ETH</b>
                      </div>
                      <div>
                        <span>คืนผู้สนับสนุนแล้ว</span>
                        <b>{eth(selected.refunded)} ETH</b>
                      </div>
                      <div>
                        <span>คุณสนับสนุน</span>
                        <b>{eth(selected.contributions[account] || "0")} ETH</b>
                      </div>
                    </div>
                    <div className="voting-note">
                      <Vote size={23} />
                      <h4>เสียงของคุณมีความหมาย</h4>
                      <p>
                        น้ำหนักเสียงตาม ETH ที่สนับสนุน ต้องเห็นชอบมากกว่า 50%
                        ของยอดระดมทุน จึงจ่ายงบ Milestone อัตโนมัติ
                      </p>
                    </div>
                  </aside>
                </div>
                <section className="activity-section">
                  <div className="section-heading">
                    <h2>ประวัติโครงการนี้</h2>
                  </div>
                  {ledger(
                    data.events.filter((e) => e.campaignId === selected.id),
                  )}
                </section>
              </>
            ) : (
              <Empty
                title="ยังไม่พบโครงการนี้"
                text={
                  mode === "chain"
                    ? "เชื่อมต่อ Wallet หรือรีเฟรชข้อมูลเพื่อโหลดโครงการ"
                    : "โครงการอาจอยู่ในโหมดข้อมูลอื่น"
                }
                action={() => navigate("explore")}
                label="ดูโครงการทั้งหมด"
              />
            ))}
          {!availableRoutes.includes(route) &&
            !route.startsWith("campaign/") && (
              <Empty
                title="ไม่พบหน้านี้"
                text="กลับไปดูโครงการและไอเดียใหม่ ๆ บน InnovateFund"
                action={() => navigate("dashboard")}
                label="กลับหน้าภาพรวม"
              />
            )}
          <footer>
            <span>
              © {new Date().getFullYear()} InnovateFund{" "}
              <span className="footer-dot">·</span> Ideas into impact.
            </span>
            <span>
              <ShieldCheck size={13} /> Built on Ethereum{" "}
              <span className="footer-dot">·</span>
              <a
                href="https://github.com/srwjd/Blockchain-Crowdfunding-Milestone-Fund-Management"
                target="_blank"
                rel="noreferrer"
              >
                Source code <ArrowUpRight size={12} />
              </a>
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <Info size={19} /> : <CheckCircle2 size={19} />}
          <div>
            {toast.text}
            {toast.hash && (
              <a
                href={`${DEFAULT_CONFIG.explorerUrl}/tx/${toast.hash}`}
                target="_blank"
                rel="noreferrer"
              >
                ดูธุรกรรม <ExternalLink size={12} />
              </a>
            )}
          </div>
          <button onClick={() => setToast(null)} aria-label="ปิดข้อความ">
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <ActionModal
          modal={modal}
          busy={busy}
          mode={mode}
          account={account}
          onClose={() => !busy && setModal(null)}
          onSubmit={execute}
        />
      )}
      {confirmReset && (
        <Modal
          title="เริ่มโหมดสาธิตใหม่?"
          onClose={() => setConfirmReset(false)}
        >
          <p>ล้างรายการที่ทดลองไว้และคืนโครงการตัวอย่าง 3 โครงการ</p>
          <div className="modal-actions">
            <button
              className="secondary"
              onClick={() => setConfirmReset(false)}
            >
              ยกเลิก
            </button>
            <button
              className="primary"
              onClick={() => {
                setDemo(seed());
                setConfirmReset(false);
                setToast({ text: "รีเซ็ตข้อมูลสาธิตแล้ว" });
              }}
            >
              รีเซ็ตข้อมูล
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Stat({ icon: Icon, label, value, unit, detail, color = "orange" }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={18} />
        </span>
      </div>
      <div className="stat-value">
        {value} <span>{unit}</span>
      </div>
      <p>{detail}</p>
    </div>
  );
}
function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>
          {title}
          <span className="orange">.</span>
        </h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Empty({ title, text, action, label }) {
  return (
    <div className="empty-state">
      <Compass size={38} />
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="secondary" onClick={action}>
        {label}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  const box = useRef();
  useEffect(() => {
    const prev = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.querySelector("input,button,textarea")?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [
          ...box.current.querySelectorAll(
            "button,input,textarea,select,a[href]",
          ),
        ].filter((el) => !el.disabled);
        if (!els.length) return;
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button aria-label="ปิดหน้าต่าง" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function ActionModal({ modal, busy, mode, account, onClose, onSubmit }) {
  const { type, campaign: c, index } = modal;
  const [amount, setAmount] = useState("0.1");
  const [evidence, setEvidence] = useState("");
  const [ack, setAck] = useState(false);
  const [error, setError] = useState("");
  const titles = {
    contribute: "ร่วมสนับสนุนโครงการ",
    request: "ส่งหลักฐานความสำเร็จ",
    approve: "อนุมัติการจ่ายเงิน Milestone",
    refund: "ขอรับเงินสนับสนุนคืน",
  };
  function submit(e) {
    e.preventDefault();
    try {
      if (type === "contribute") {
        const n = parseEther(amount);
        if (n <= 0n || n > BigInt(c.goal) - BigInt(c.raised))
          throw Error("จำนวน ETH ต้องมากกว่า 0 และไม่เกินยอดที่เหลือ");
      }
      if (
        type === "request" &&
        (!evidence.trim() ||
          new TextEncoder().encode(evidence.trim()).length > 2048)
      )
        throw Error("หลักฐานต้องมีขนาด 1–2,048 bytes");
      if (type === "approve" && !ack)
        throw Error("กรุณายืนยันการตรวจสอบหลักฐาน");
      setError("");
      onSubmit({ type, id: c.id, index, amount, evidence });
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  return (
    <Modal title={titles[type]} onClose={onClose}>
      <form onSubmit={submit}>
        <p className="modal-campaign">{c.title}</p>
        {type === "contribute" && (
          <>
            <label className="field">
              จำนวนเงินสนับสนุน (ETH)
              <div className="input-unit">
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <span>ETH</span>
              </div>
            </label>
            <div className="amount-presets">
              {["0.01", "0.1", "0.5"].map((n) => (
                <button key={n} type="button" onClick={() => setAmount(n)}>
                  {n} ETH
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setAmount(formatEther(BigInt(c.goal) - BigInt(c.raised)))
                }
              >
                เต็มเป้า
              </button>
            </div>
            <p className="hint">
              เหลืออีก {eth(BigInt(c.goal) - BigInt(c.raised))} ETH • ค่า Gas
              คิดแยกโดย Wallet
            </p>
          </>
        )}
        {type === "request" && (
          <>
            <div className="info-panel">
              <FileCheck2 size={20} />
              <span>
                {c.milestones[c.nextMilestone].title}
                <br />
                <b>งบ {eth(c.milestones[c.nextMilestone].amount)} ETH</b>
              </span>
            </div>
            <label className="field">
              ลิงก์หลักฐานหรือรายงานผล
              <textarea
                rows={5}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="https://... หรือรายละเอียดผลสำเร็จที่ตรวจสอบได้"
                required
                maxLength={2048}
              />
            </label>
            <p className="hint">
              หลักฐานจะบันทึกบน Blockchain และเปิดให้ทุกคนอ่านได้
            </p>
          </>
        )}
        {type === "approve" && (
          <>
            <div className="evidence">
              <FileCheck2 size={18} />
              <div>
                <b>{c.milestones[index].title}</b>
                <p>{c.milestones[index].evidence}</p>
                {/^https?:\/\/\S+$/i.test(c.milestones[index].evidence) && (
                  <a
                    href={c.milestones[index].evidence}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิดหลักฐาน ↗
                  </a>
                )}
              </div>
            </div>
            <p>
              งบที่จะจ่าย <b>{eth(c.milestones[index].amount)} ETH</b>
              <br />
              น้ำหนักเสียงของคุณ{" "}
              <b>
                {percent(c.contributions[account] || "0", c.raised).toFixed(1)}%
              </b>
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                required
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              ฉันตรวจสอบหลักฐานแล้ว และยินยอมให้จ่ายเงินเมื่อเสียงอนุมัติเกิน
              50%
            </label>
          </>
        )}
        {type === "refund" && (
          <>
            <div className="refund-amount">
              {eth(c.contributions[account] || "0")} <small>ETH</small>
            </div>
            <p>
              โครงการครบกำหนดโดยยอดระดมทุนไม่ถึงเป้า เงินสนับสนุนจะคืนไปยัง
              Wallet ของคุณเต็มจำนวน โดยคุณชำระค่า Gas แยกต่างหาก
            </p>
          </>
        )}
        <div className="mode-notice">
          <ShieldCheck size={15} />
          {mode === "demo"
            ? "รายการนี้เป็นการสาธิต ไม่มีการใช้ ETH จริง"
            : "รายการนี้ต้องยืนยันด้วย Wallet บน Sepolia"}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            className="secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            ยกเลิก
          </button>
          <button className="primary" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Check size={17} />
            )}
            ยืนยัน{type === "approve" ? "การอนุมัติ" : "รายการ"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function CreateForm({ busy, mode, account, onCreate, cancel }) {
  const [p, setP] = useState({
    title: "",
    description: "",
    category: "IoT & เทคโนโลยี",
    goal: "",
    days: "30",
    milestones: [
      { title: "", amount: "" },
      { title: "", amount: "" },
    ],
  });
  const [error, setError] = useState("");
  const update = (k, v) => setP((s) => ({ ...s, [k]: v }));
  function updateM(i, k, v) {
    setP((s) => ({
      ...s,
      milestones: s.milestones.map((m, j) => (j === i ? { ...m, [k]: v } : m)),
    }));
  }
  let allocation = 0n;
  try {
    allocation = p.milestones.reduce(
      (n, m) => n + parseEther(m.amount || "0"),
      0n,
    );
  } catch {}
  function submit(e) {
    e.preventDefault();
    try {
      if (!account) throw Error("กรุณาเชื่อมต่อ Wallet ก่อน");
      if (
        !p.title.trim() ||
        new TextEncoder().encode(p.title.trim()).length > 300
      )
        throw Error("ชื่อโครงการต้องมีขนาด 1–300 bytes");
      if (new TextEncoder().encode(p.description.trim()).length > 6000)
        throw Error("รายละเอียดต้องไม่เกิน 6,000 bytes");
      if (parseEther(p.goal) <= 0n) throw Error("เป้าหมายต้องมากกว่า 0");
      if (
        !Number.isInteger(Number(p.days)) ||
        Number(p.days) < 1 ||
        Number(p.days) > 365
      )
        throw Error("ระยะเวลา 1–365 วัน");
      let total = 0n;
      for (const m of p.milestones) {
        if (
          !m.title.trim() ||
          new TextEncoder().encode(m.title.trim()).length > 300 ||
          parseEther(m.amount) <= 0n
        )
          throw Error(
            "กรุณาระบุชื่อและงบ Milestone ให้ครบ (ชื่อไม่เกิน 300 bytes)",
          );
        total += parseEther(m.amount);
      }
      if (total !== parseEther(p.goal))
        throw Error("งบ Milestone รวมต้องเท่ากับเป้าหมายระดมทุน");
      setError("");
      onCreate(p);
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  return (
    <form className="create-layout" onSubmit={submit}>
      <div className="panel form-panel">
        <div className="form-section-title">
          <span>01</span>
          <div>
            <h2>ไอเดียของคุณ</h2>
            <p>รายละเอียดที่ชัดเจนช่วยให้ผู้สนับสนุนตัดสินใจได้</p>
          </div>
        </div>
        <label className="field">
          ชื่อโครงการ
          <input
            value={p.title}
            onChange={(e) => update("title", e.target.value)}
            required
            maxLength={100}
            placeholder="โครงการของคุณจะสร้างการเปลี่ยนแปลงอย่างไร"
          />
        </label>
        <label className="field">
          รายละเอียดโครงการ
          <textarea
            rows={5}
            value={p.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={2000}
            placeholder="ปัญหาที่ต้องการแก้ไข สิ่งที่คุณจะสร้าง และผลลัพธ์ที่คาดหวัง"
          />
        </label>
        <label className="field">
          หมวดหมู่
          <select
            value={p.category}
            onChange={(e) => update("category", e.target.value)}
          >
            {categories.slice(1).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <div className="field-grid">
          <label className="field">
            เป้าหมายระดมทุน (ETH)
            <input
              required
              inputMode="decimal"
              value={p.goal}
              onChange={(e) => update("goal", e.target.value)}
              placeholder="เช่น 1.0"
            />
          </label>
          <label className="field">
            ระยะเวลาระดมทุน (วัน)
            <input
              required
              type="number"
              min="1"
              max="365"
              value={p.days}
              onChange={(e) => update("days", e.target.value)}
            />
          </label>
        </div>
        <div className="form-section-title second">
          <span>02</span>
          <div>
            <h2>วางแผน Milestone</h2>
            <p>แบ่งงบให้ตรงกับความสำเร็จแต่ละระยะ (สูงสุด 12 ระยะ)</p>
          </div>
        </div>
        {p.milestones.map((m, i) => (
          <div className="milestone-input" key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <label className="field">
              ชื่อระยะงาน
              <input
                required
                value={m.title}
                onChange={(e) => updateM(i, "title", e.target.value)}
                maxLength={100}
                placeholder="เช่น พัฒนาต้นแบบ"
              />
            </label>
            <label className="field amount-field">
              งบ (ETH)
              <input
                required
                inputMode="decimal"
                value={m.amount}
                onChange={(e) => updateM(i, "amount", e.target.value)}
                placeholder="0.0"
              />
            </label>
            <button
              type="button"
              aria-label={`ลบระยะงาน ${i + 1}`}
              disabled={p.milestones.length === 1}
              onClick={() =>
                update(
                  "milestones",
                  p.milestones.filter((_, j) => j !== i),
                )
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          className="add-milestone"
          disabled={p.milestones.length >= 12}
          type="button"
          onClick={() =>
            update("milestones", [...p.milestones, { title: "", amount: "" }])
          }
        >
          <Plus size={15} />
          เพิ่ม Milestone
        </button>
        <div className="allocation">
          <span>งบจัดสรรรวม</span>
          <b>
            {eth(allocation)} / {p.goal || "0"} ETH
          </b>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="secondary" type="button" onClick={cancel}>
            ยกเลิก
          </button>
          <button className="primary" disabled={busy || !account}>
            {busy ? (
              <LoaderCircle size={16} className="spin" />
            ) : (
              <Plus size={16} />
            )}
            สร้างโครงการ{mode === "demo" ? "สาธิต" : ""}
          </button>
        </div>
      </div>
      <aside>
        <div className="voting-note">
          <ShieldCheck size={27} />
          <h3>สร้างความเชื่อมั่นตั้งแต่วันแรก</h3>
          <p>
            เงินทุนเก็บใน Smart Contract จนถึงเป้าหมาย
            คุณจึงส่งหลักฐานขอเบิกตามลำดับ Milestone ได้
          </p>
          <ul>
            <li>งบทุก Milestone รวมเท่ากับเป้าหมาย</li>
            <li>ผู้สนับสนุนอนุมัติเกิน 50% ตามจำนวน ETH</li>
            <li>คืนเงินได้เมื่อหมดเวลาและไม่ถึงเป้า</li>
            <li>เจ้าของโครงการสนับสนุนโครงการตัวเองไม่ได้</li>
          </ul>
        </div>
        <div className="mode-notice">
          <Info size={16} />
          {mode === "demo"
            ? "คุณกำลังสร้างข้อมูลในโหมดสาธิต"
            : "ข้อมูลโครงการและหลักฐานจะเป็นสาธารณะบน Blockchain"}
        </div>
      </aside>
    </form>
  );
}
function SettingsForm({ config, busy, save, connectWallet }) {
  const [c, setC] = useState(config);
  return (
    <div className="settings-layout">
      <div className="panel form-panel">
        <div className="form-section-title">
          <span>
            <Blocks size={21} />
          </span>
          <div>
            <h2>Smart Contract</h2>
            <p>เครือข่าย Ethereum Sepolia Testnet</p>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(c);
          }}
        >
          <label className="field">
            Contract Address
            <input
              className="mono"
              required
              placeholder="0x..."
              value={c.contractAddress}
              onChange={(e) =>
                setC({ ...c, contractAddress: e.target.value.trim() })
              }
            />
          </label>
          <label className="field">
            Deployment Block
            <input
              type="number"
              min="0"
              required
              value={c.deploymentBlock}
              onChange={(e) =>
                setC({ ...c, deploymentBlock: Number(e.target.value) })
              }
            />
          </label>
          <p className="hint">
            เลขบล็อกจากธุรกรรม deploy บน Etherscan
            เพื่อเริ่มอ่านประวัติให้ตรงจุด
          </p>
          <div className="config-network">
            <i />
            Sepolia <span>Chain ID: 11155111</span>
          </div>
          <button className="primary" disabled={busy}>
            <Check size={16} />
            บันทึกการตั้งค่า
          </button>
        </form>
        <p className="hint">
          ตั้งค่านี้มีผลกับเบราว์เซอร์นี้ หากต้องการใช้กับทุกคน ให้แก้ไฟล์
          public/config.json ใน GitHub แล้ว deploy ใหม่
        </p>
        {isAddress(config.contractAddress) && (
          <a
            className="text-button"
            href={`${DEFAULT_CONFIG.explorerUrl}/address/${config.contractAddress}`}
            target="_blank"
            rel="noreferrer"
          >
            ตรวจสอบ Contract บน Etherscan <ExternalLink size={14} />
          </a>
        )}
      </div>
      <div className="panel guide-panel">
        <h2>เริ่มต้นด้วย Remix IDE</h2>
        <ol>
          <li>
            <b>เปิดไฟล์ Smart Contract</b>
            <p>นำ contracts/InnovateFund.sol จาก GitHub ไปเปิดใน Remix IDE</p>
          </li>
          <li>
            <b>Compile และ Deploy</b>
            <p>
              ใช้ Solidity 0.8.30 เปิด optimizer 200 runs, EVM Paris แล้วเลือก
              Injected Provider – MetaMask บน Sepolia
            </p>
          </li>
          <li>
            <b>บันทึก Address ที่ได้</b>
            <p>
              นำ Contract Address และ Deployment Block มาใส่ด้านซ้าย
              จากนั้นเชื่อมต่อ Wallet
            </p>
          </li>
        </ol>
        <a
          className="text-button"
          href={`${import.meta.env.BASE_URL}InnovateFund.sol`}
          download
        >
          ดาวน์โหลด Smart Contract <Download size={14} />
        </a>
        <a
          className="secondary"
          href="https://remix.ethereum.org"
          target="_blank"
          rel="noreferrer"
        >
          เปิด Remix IDE <ArrowUpRight size={15} />
        </a>
        <a
          className="text-button"
          href="https://github.com/srwjd/Blockchain-Crowdfunding-Milestone-Fund-Management/blob/main/README.md"
          target="_blank"
          rel="noreferrer"
        >
          คู่มือติดตั้งแบบละเอียด <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
export default App;
