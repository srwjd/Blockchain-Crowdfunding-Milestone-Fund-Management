import {
  BrowserProvider,
  Contract,
  isAddress,
  parseEther,
  getAddress,
} from "ethers";
import abi from "./abi.json";
export const DEFAULT_CONFIG = {
  chainId: 11155111,
  contractAddress: "",
  deploymentBlock: 0,
  explorerUrl: "https://sepolia.etherscan.io",
};
export function validateConfig(config) {
  if (Number(config.chainId) !== 11155111)
    throw Error("เวอร์ชันนี้รองรับเครือข่าย Sepolia (11155111)");
  if (
    !isAddress(config.contractAddress) ||
    /^0x0{40}$/i.test(config.contractAddress)
  )
    throw Error("Contract Address ไม่ถูกต้อง");
  if (
    !Number.isSafeInteger(Number(config.deploymentBlock)) ||
    Number(config.deploymentBlock) < 0
  )
    throw Error("Deployment block ต้องเป็นจำนวนเต็มตั้งแต่ 0");
  return {
    ...DEFAULT_CONFIG,
    ...config,
    contractAddress: getAddress(config.contractAddress),
    deploymentBlock: Number(config.deploymentBlock),
    chainId: 11155111,
    explorerUrl: DEFAULT_CONFIG.explorerUrl,
  };
}
export async function connect(config) {
  if (!window.ethereum)
    throw Error(
      "ไม่พบ Wallet กรุณาติดตั้ง MetaMask หรือเปิดเว็บผ่านเบราว์เซอร์ใน Wallet",
    );
  await window.ethereum.request({ method: "eth_requestAccounts" });
  const provider = new BrowserProvider(window.ethereum);
  if (Number((await provider.getNetwork()).chainId) !== config.chainId) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (e) {
      throw Error(
        e.code === 4001
          ? "คุณยกเลิกการเปลี่ยนเครือข่าย"
          : "กรุณาเพิ่มเครือข่าย Sepolia ใน Wallet แล้วลองใหม่",
      );
    }
  }
  const fresh = new BrowserProvider(window.ethereum);
  const signer = await fresh.getSigner();
  return { provider: fresh, signer, account: await signer.getAddress() };
}
export async function loadChain(config, provider, account) {
  const valid = validateConfig(config);
  if (Number((await provider.getNetwork()).chainId) !== valid.chainId)
    throw Error("กรุณาเปลี่ยน Wallet ไปเครือข่าย Sepolia");
  if ((await provider.getCode(valid.contractAddress)) === "0x")
    throw Error("ไม่พบ Smart Contract ที่ Address นี้บน Sepolia");
  const contract = new Contract(valid.contractAddress, abi, provider),
    count = Number(await contract.campaignCount());
  const campaigns = [];
  for (let id = 0; id < count; id++) {
    const c = await contract.getCampaign(id);
    const milestones = [];
    for (let i = 0; i < Number(c.milestoneCount); i++) {
      const m = await contract.getMilestone(id, i);
      milestones.push({
        title: m.title,
        amount: m.amount.toString(),
        evidence: m.evidence,
        approvalWeight: m.approvalWeight.toString(),
        requested: m.requested,
        paid: m.paid,
        votes:
          account && (await contract.hasVoted(id, i, account)) ? [account] : [],
      });
    }
    campaigns.push({
      id,
      owner: c.owner,
      title: c.title,
      description: c.description,
      category: c.category,
      goal: c.goal.toString(),
      deadline: Number(c.deadline),
      raised: c.raised.toString(),
      escrow: c.escrow.toString(),
      released: c.released.toString(),
      refunded: c.refunded.toString(),
      supporterCount: Number(c.supporterCount),
      nextMilestone: Number(c.nextMilestone),
      milestones,
      contributions: account
        ? { [account]: (await contract.contributions(id, account)).toString() }
        : {},
    });
  }
  const events = [];
  let eventError = "";
  try {
    const latest = await provider.getBlockNumber();
    // Bounded requests work with wallet RPC providers that limit eth_getLogs ranges.
    const from = Math.max(valid.deploymentBlock, latest - 49999);
    const blocks = new Map();
    for (let start = from; start <= latest; start += 2000) {
      const logs = await provider.getLogs({
        address: valid.contractAddress,
        fromBlock: start,
        toBlock: Math.min(start + 1999, latest),
      });
      for (const log of logs) {
        const parsed = contract.interface.parseLog(log);
        if (!parsed) continue;
        const a = parsed.args;
        if (!blocks.has(log.blockNumber))
          blocks.set(
            log.blockNumber,
            (await provider.getBlock(log.blockNumber)).timestamp,
          );
        events.push({
          id: log.transactionHash + "-" + log.index,
          campaignId: Number(a.campaignId),
          type: parsed.name,
          account: a.supporter || a.owner || "",
          amount: (a.amount || 0n).toString(),
          time: blocks.get(log.blockNumber),
          hash: log.transactionHash,
          block: log.blockNumber,
          index: log.index,
        });
      }
    }
    events.sort((a, b) => b.block - a.block || b.index - a.index);
    if (from > valid.deploymentBlock)
      eventError =
        "แสดงประวัติ 50,000 บล็อกล่าสุด ดูประวัติก่อนหน้านี้ได้ที่ Etherscan";
  } catch {
    eventError =
      "โหลดประวัติจาก RPC ไม่สำเร็จ ยอดเงินและสถานะอ่านจาก Contract แล้ว ดูรายการทั้งหมดได้ที่ Etherscan";
  }
  return { campaigns, events, eventError };
}
export async function writeChain(config, session, action, campaigns) {
  if (!session) throw Error("กรุณาเชื่อมต่อ Wallet ก่อน");
  if (Number((await session.provider.getNetwork()).chainId) !== config.chainId)
    throw Error("กรุณาเชื่อมต่อใหม่บน Sepolia");
  const c = new Contract(config.contractAddress, abi, session.signer);
  let tx;
  if (action.type === "create") {
    const p = action.payload;
    tx = await c.createCampaign(
      p.title.trim(),
      p.description.trim(),
      p.category,
      parseEther(p.goal),
      Number(p.days),
      p.milestones.map((m) => m.title.trim()),
      p.milestones.map((m) => parseEther(m.amount)),
    );
  } else if (action.type === "contribute")
    tx = await c.contribute(action.id, { value: parseEther(action.amount) });
  else if (action.type === "request")
    tx = await c.requestMilestone(
      action.id,
      campaigns.find((c) => c.id === action.id).nextMilestone,
      action.evidence.trim(),
    );
  else if (action.type === "approve")
    tx = await c.approveMilestone(action.id, action.index);
  else if (action.type === "refund") tx = await c.refund(action.id);
  else throw Error("Unknown action");
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw Error("ธุรกรรมไม่สำเร็จ");
  return tx.hash;
}
export function friendlyError(e) {
  if (e.code === 4001 || e.code === "ACTION_REJECTED")
    return "คุณยกเลิกรายการใน Wallet";
  if (e.code === "INSUFFICIENT_FUNDS")
    return "ETH ไม่เพียงพอสำหรับยอดสนับสนุนและค่า Gas";
  return (
    e.reason || e.shortMessage || e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่"
  );
}
