import { parseEther, formatEther } from "ethers";
export const OWNER = "0x1111111111111111111111111111111111111111";
export const DONOR = "0x2222222222222222222222222222222222222222";
const OTHER = "0x3333333333333333333333333333333333333333";
export const wei = (n) => parseEther(String(n)).toString();
export const eth = (n) =>
  Number(formatEther(n || "0")).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
export const short = (a) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "ยังไม่ได้เชื่อมต่อ";
export const same = (a, b) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export const now = () => Math.floor(Date.now() / 1000);
export function status(c) {
  return BigInt(c.released) === BigInt(c.goal)
    ? "completed"
    : BigInt(c.raised) >= BigInt(c.goal)
      ? "funded"
      : now() >= c.deadline
        ? "failed"
        : "active";
}
export const statusNames = {
  active: "กำลังระดมทุน",
  funded: "ดำเนินโครงการ",
  completed: "สำเร็จแล้ว",
  failed: "ขอคืนเงินได้",
};
export const percent = (a, b) =>
  !BigInt(b)
    ? 0
    : Math.min(100, Number((BigInt(a) * 10000n) / BigInt(b)) / 100);
const milestone = (title, amount, extra = {}) => ({
  title,
  amount: wei(amount),
  evidence: "",
  approvalWeight: "0",
  requested: false,
  paid: false,
  votes: [],
  ...extra,
});
export function seed() {
  const time = now();
  const base = { owner: OWNER, released: "0", refunded: "0", nextMilestone: 0 };
  const campaigns = [
    {
      ...base,
      id: 0,
      title: "Smart Farm เซนเซอร์เพื่อเกษตรกรไทย",
      description:
        "เปลี่ยนแปลงการเกษตรด้วยข้อมูลที่เข้าถึงได้ พัฒนาเซนเซอร์ IoT ตรวจวัดความชื้นและสภาพดินแบบเรียลไทม์ พร้อมแอปพลิเคชันภาษาไทย เพื่อช่วยเกษตรกรลดการใช้น้ำและเพิ่มผลผลิต เริ่มทดสอบกับชุมชนเกษตรกร 20 ครัวเรือน",
      category: "IoT & เทคโนโลยี",
      goal: wei(10),
      raised: wei(6.4),
      escrow: wei(6.4),
      deadline: time + 18 * 86400,
      supporterCount: 24,
      contributions: { [DONOR]: wei(0.5), [OTHER]: wei(5.9) },
      milestones: [
        milestone("ออกแบบและพัฒนาต้นแบบ", 3),
        milestone("ทดสอบกับเกษตรกร 20 ครัวเรือน", 4),
        milestone("ผลิตและส่งมอบอุปกรณ์", 3),
      ],
    },
    {
      ...base,
      id: 1,
      title: "AI Care ผู้ช่วยสุขภาพสำหรับทุกคน",
      description:
        "ผู้ช่วยอัจฉริยะสำหรับดูแลสุขภาพประจำวัน ช่วยบันทึกอาการ เตือนเวลาทานยา และเชื่อมต่อผู้สูงอายุกับครอบครัว พัฒนาร่วมกับอาสาสมัครสาธารณสุขเพื่อให้ใช้งานง่ายและเหมาะกับคนไทย",
      category: "AI & นวัตกรรม",
      goal: wei(5),
      raised: wei(5),
      escrow: wei(5),
      deadline: time + 8 * 86400,
      supporterCount: 16,
      contributions: { [DONOR]: wei(2.8), [OTHER]: wei(2.2) },
      milestones: [
        milestone("ต้นแบบ AI และรายงานทดสอบ", 2, {
          requested: true,
          evidence:
            "รายงานต้นแบบ: ทดสอบระบบเตือนทานยาและบันทึกอาการกับอาสาสมัครครบ 30 คน พร้อมสรุปผลการใช้งานเวอร์ชันแรก",
        }),
        milestone("พัฒนาแอปและเปิดทดลองใช้งาน", 3),
      ],
    },
    {
      ...base,
      id: 2,
      title: "Green Loop เปลี่ยนขยะให้มีคุณค่า",
      description:
        "จุดรับขยะรีไซเคิลอัจฉริยะในชุมชน พร้อมระบบสะสมแต้มเพื่อสร้างแรงจูงใจในการคัดแยกขยะ โครงการนี้ครบกำหนดระดมทุนแล้วโดยยังไม่ถึงเป้าหมาย ผู้สนับสนุนสามารถขอรับ ETH คืนได้เต็มจำนวน",
      category: "เพื่อสังคม",
      goal: wei(3),
      raised: wei(1.2),
      escrow: wei(1.2),
      deadline: time - 86400,
      supporterCount: 9,
      contributions: { [DONOR]: wei(0.4), [OTHER]: wei(0.8) },
      milestones: [
        milestone("สร้างจุดรับขยะต้นแบบ", 1),
        milestone("ติดตั้งและทดสอบในชุมชน", 2),
      ],
    },
  ];
  const events = campaigns.flatMap((c) =>
    Object.entries(c.contributions).map(([account, amount], i) => ({
      id: `seed-${c.id}-${i}`,
      campaignId: c.id,
      type: "Contributed",
      account,
      amount,
      time: time - (c.id + 1) * 8600 - i * 3600,
      hash: null,
    })),
  );
  return { campaigns, events };
}
export function loadDemo() {
  try {
    const d = JSON.parse(localStorage.getItem("innovatefund-demo-v1"));
    if (d?.campaigns && d?.events) return d;
  } catch {}
  return seed();
}
export function actDemo(data, action, account) {
  const next = structuredClone(data),
    time = now();
  const record = (type, campaignId, amount = "0") =>
    next.events.unshift({
      id: crypto.randomUUID(),
      campaignId,
      type,
      account,
      amount,
      time,
      hash: null,
    });
  if (action.type === "create") {
    const p = action.payload;
    const goal = wei(p.goal);
    if (
      !p.title.trim() ||
      BigInt(goal) <= 0n ||
      !Number.isInteger(Number(p.days)) ||
      Number(p.days) < 1 ||
      Number(p.days) > 365
    )
      throw Error("กรุณาตรวจสอบชื่อ เป้าหมาย และระยะเวลา");
    const milestones = p.milestones.map((m) =>
      milestone(m.title.trim(), m.amount),
    );
    if (
      !milestones.length ||
      milestones.length > 12 ||
      milestones.some((m) => !m.title || BigInt(m.amount) <= 0n) ||
      milestones.reduce((s, m) => s + BigInt(m.amount), 0n) !== BigInt(goal)
    )
      throw Error("งบ Milestone รวมต้องเท่ากับเป้าหมาย");
    const id = next.campaigns.length;
    next.campaigns.push({
      id,
      owner: account,
      title: p.title.trim(),
      description: p.description.trim(),
      category: p.category,
      goal,
      deadline: time + Number(p.days) * 86400,
      raised: "0",
      escrow: "0",
      released: "0",
      refunded: "0",
      supporterCount: 0,
      nextMilestone: 0,
      milestones,
      contributions: {},
    });
    record("CampaignCreated", id);
    return next;
  }
  const c = next.campaigns.find((c) => c.id === action.id);
  if (!c) throw Error("ไม่พบโครงการ");
  if (action.type === "contribute") {
    const amount = BigInt(wei(action.amount));
    if (
      status(c) !== "active" ||
      same(c.owner, account) ||
      amount <= 0n ||
      BigInt(c.raised) + amount > BigInt(c.goal)
    )
      throw Error("ไม่สามารถสนับสนุนได้ กรุณาตรวจสอบจำนวนเงินและสถานะโครงการ");
    if (!BigInt(c.contributions[account] || 0)) c.supporterCount++;
    c.contributions[account] = (
      BigInt(c.contributions[account] || 0) + amount
    ).toString();
    c.raised = (BigInt(c.raised) + amount).toString();
    c.escrow = (BigInt(c.escrow) + amount).toString();
    record("Contributed", c.id, amount.toString());
  } else if (action.type === "request") {
    const m = c.milestones[c.nextMilestone];
    if (
      !same(c.owner, account) ||
      status(c) !== "funded" ||
      !m ||
      m.requested ||
      !action.evidence.trim()
    )
      throw Error("ยังไม่สามารถขอเบิก Milestone นี้ได้");
    m.requested = true;
    m.evidence = action.evidence.trim();
    record("MilestoneRequested", c.id);
  } else if (action.type === "approve") {
    const m = c.milestones[action.index],
      weight = c.contributions[account] || "0";
    if (
      action.index !== c.nextMilestone ||
      !m?.requested ||
      m.paid ||
      !BigInt(weight) ||
      m.votes.includes(account)
    )
      throw Error("ไม่มีสิทธิ์ลงคะแนน หรือได้ลงคะแนนไปแล้ว");
    m.votes.push(account);
    m.approvalWeight = (BigInt(m.approvalWeight) + BigInt(weight)).toString();
    record("MilestoneApproved", c.id);
    if (BigInt(m.approvalWeight) > BigInt(c.raised) / 2n) {
      m.paid = true;
      c.nextMilestone++;
      c.released = (BigInt(c.released) + BigInt(m.amount)).toString();
      c.escrow = (BigInt(c.escrow) - BigInt(m.amount)).toString();
      record("FundsReleased", c.id, m.amount);
    }
  } else if (action.type === "refund") {
    const amount = c.contributions[account] || "0";
    if (status(c) !== "failed" || !BigInt(amount))
      throw Error("ไม่มียอดเงินที่สามารถขอคืนได้");
    c.contributions[account] = "0";
    c.escrow = (BigInt(c.escrow) - BigInt(amount)).toString();
    c.refunded = (BigInt(c.refunded) + BigInt(amount)).toString();
    record("Refunded", c.id, amount);
  }
  return next;
}
export const eventNames = {
  CampaignCreated: "สร้างโครงการ",
  Contributed: "สนับสนุนเงินทุน",
  MilestoneRequested: "ส่งหลักฐาน Milestone",
  MilestoneApproved: "ลงคะแนนอนุมัติ",
  FundsReleased: "จ่ายเงินตาม Milestone",
  Refunded: "คืนเงินผู้สนับสนุน",
};
