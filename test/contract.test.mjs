import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ganache from "ganache";
import { BrowserProvider, ContractFactory, parseEther } from "ethers";
import solc from "solc";
const artifact = JSON.parse(
  fs.readFileSync(new URL("../artifacts/InnovateFund.json", import.meta.url)),
);
const eth = parseEther;
let rpc, provider, owner, alice, bob, outsider, fund;
const create = (
  contract = fund,
  goal = "1",
  days = 1,
  amounts = ["0.4", "0.6"],
) =>
  contract.createCampaign(
    "Smart Farm",
    "IoT for growers",
    "IoT",
    eth(goal),
    days,
    ["Prototype", "Launch"].slice(0, amounts.length),
    amounts.map(eth),
  );
async function rejected(fn, reason) {
  await assert.rejects(
    fn,
    reason
      ? (e) =>
          [
            e.reason,
            e.message,
            e.info?.error?.data?.reason,
            e.info?.error?.message,
          ].some((v) => String(v).includes(reason))
      : undefined,
  );
}
async function contribute(signer, amount, id = 0) {
  await (
    await fund.connect(signer).contribute(id, { value: eth(amount) })
  ).wait();
}
async function request(index = 0) {
  await (
    await fund.requestMilestone(0, index, "https://example.org/report")
  ).wait();
}
async function approve(signer, index = 0) {
  await (await fund.connect(signer).approveMilestone(0, index)).wait();
}
async function audit(id = 0) {
  const c = await fund.getCampaign(id);
  assert.equal(c.raised, c.escrow + c.released + c.refunded);
  return c;
}
describe("InnovateFund escrow and milestone governance", () => {
  before(async () => {
    rpc = ganache.provider({
      logging: { quiet: true },
      wallet: { totalAccounts: 6 },
      chain: { hardfork: "shanghai" },
    });
    provider = new BrowserProvider(rpc);
    provider.pollingInterval = 10;
    [owner, alice, bob, outsider] = await Promise.all(
      [0, 1, 2, 3].map((i) => provider.getSigner(i)),
    );
  });
  after(async () => {
    await rpc.disconnect();
  });
  beforeEach(async () => {
    fund = await new ContractFactory(
      artifact.abi,
      artifact.bytecode,
      owner,
    ).deploy();
    await fund.waitForDeployment();
  });
  it("validates budgets, duration and campaign bounds", async () => {
    await rejected(
      () => create(fund, "1", 1, ["0.3", "0.6"]),
      "Allocation must equal goal",
    );
    await rejected(() => create(fund, "1", 0), "Duration 1-365 days");
    await rejected(() => create(fund, "1", 366), "Duration 1-365 days");
    await rejected(() => create(fund, "1", 1, ["0", "1"]), "Zero allocation");
    await (await create()).wait();
    assert.equal(await fund.campaignCount(), 1n);
    const c = await fund.getCampaign(0);
    assert.equal(c.owner, await owner.getAddress());
    assert.equal(c.milestoneCount, 2n);
    await rejected(() => fund.getCampaign(99), "Campaign not found");
    await rejected(() => fund.getMilestone(0, 2), "Milestone not found");
  });
  it("tracks contributions, caps the goal and excludes the owner", async () => {
    await (await create()).wait();
    await rejected(
      () => fund.contribute.staticCall(0, { value: eth("0.1") }),
      "Owner cannot contribute",
    );
    await rejected(
      () => fund.connect(alice).contribute.staticCall(0, { value: 0 }),
      "Invalid contribution",
    );
    await contribute(alice, "0.3");
    await contribute(alice, "0.2");
    await contribute(bob, "0.5");
    const c = await audit();
    assert.equal(c.supporterCount, 2n);
    assert.equal(c.raised, eth("1"));
    assert.equal(await provider.getBalance(await fund.getAddress()), eth("1"));
    assert.equal(
      await fund.contributions(0, await alice.getAddress()),
      eth("0.5"),
    );
    await rejected(
      () => fund.connect(outsider).contribute.staticCall(0, { value: 1 }),
      "goal exceeded",
    );
  });
  it("requires owner, full funding, evidence and sequential requests", async () => {
    await (await create()).wait();
    await rejected(
      () => fund.requestMilestone.staticCall(0, 0, "report"),
      "Goal not reached",
    );
    await contribute(alice, "1");
    await rejected(
      () => fund.connect(alice).requestMilestone.staticCall(0, 0, "report"),
      "Owner only",
    );
    await rejected(
      () => fund.requestMilestone.staticCall(0, 1, "report"),
      "Wrong milestone order",
    );
    await rejected(
      () => fund.requestMilestone.staticCall(0, 0, ""),
      "Evidence required",
    );
    await request();
    await rejected(
      () => fund.requestMilestone.staticCall(0, 0, "again"),
      "Already requested",
    );
  });
  it("does not pay at exactly 50%; pays allocated funds once when over 50%", async () => {
    await (await create()).wait();
    await contribute(alice, "0.5");
    await contribute(bob, "0.5");
    await request();
    await approve(alice);
    assert.equal((await fund.getMilestone(0, 0)).paid, false);
    assert.equal((await audit()).escrow, eth("1"));
    await rejected(
      () => fund.connect(alice).approveMilestone.staticCall(0, 0),
      "Already voted",
    );
    await rejected(
      () => fund.connect(outsider).approveMilestone.staticCall(0, 0),
      "Supporters only",
    );
    const beforeBalance = BigInt(
      await rpc.request({
        method: "eth_getBalance",
        params: [await owner.getAddress(), "latest"],
      }),
    );
    const receipt = await (
      await fund.connect(bob).approveMilestone(0, 0)
    ).wait();
    const afterBalance = BigInt(
      await rpc.request({
        method: "eth_getBalance",
        params: [await owner.getAddress(), "latest"],
      }),
    );
    assert.equal(afterBalance - beforeBalance, eth("0.4"));
    assert.ok(
      receipt.logs.some((log) => {
        try {
          return fund.interface.parseLog(log)?.name === "FundsReleased";
        } catch {
          return false;
        }
      }),
    );
    const c = await audit();
    assert.equal(c.released, eth("0.4"));
    assert.equal(c.escrow, eth("0.6"));
    assert.equal(c.nextMilestone, 1n);
    await rejected(
      () => fund.connect(bob).approveMilestone.staticCall(0, 0),
      "Wrong milestone order",
    );
    await request(1);
    await approve(alice, 1);
    await approve(bob, 1);
    const done = await audit();
    assert.equal(done.escrow, 0n);
    assert.equal(done.released, eth("1"));
  });
  it("counts multiple contributions once with their entire voting weight", async () => {
    await (await create()).wait();
    await contribute(alice, "0.3");
    await contribute(alice, "0.3");
    await contribute(bob, "0.4");
    await request();
    await approve(alice);
    const m = await fund.getMilestone(0, 0);
    assert.equal(m.approvalWeight, eth("0.6"));
    assert.equal(m.paid, true);
    await audit();
  });
  it("refunds only after failure, only the original amount and only once", async () => {
    await (await create()).wait();
    await contribute(alice, "0.2");
    await contribute(bob, "0.3");
    await rejected(
      () => fund.connect(alice).refund.staticCall(0),
      "Refund unavailable",
    );
    await rpc.request({ method: "evm_increaseTime", params: [86401] });
    await rpc.request({ method: "evm_mine", params: [] });
    await rejected(
      () =>
        fund.connect(outsider).contribute.staticCall(0, { value: eth("0.1") }),
      "Funding ended",
    );
    await rejected(
      () => fund.requestMilestone.staticCall(0, 0, "report"),
      "Goal not reached",
    );
    await (await fund.connect(alice).refund(0)).wait();
    let c = await audit();
    assert.equal(c.refunded, eth("0.2"));
    assert.equal(c.escrow, eth("0.3"));
    assert.equal(await fund.contributions(0, await alice.getAddress()), 0n);
    await rejected(
      () => fund.connect(alice).refund.staticCall(0),
      "Nothing to refund",
    );
    await rejected(
      () => fund.connect(outsider).refund.staticCall(0),
      "Nothing to refund",
    );
    await (await fund.connect(bob).refund(0)).wait();
    c = await audit();
    assert.equal(c.escrow, 0n);
    assert.equal(c.refunded, eth("0.5"));
  });
  it("never refunds a fully funded campaign, including after its deadline", async () => {
    await (await create()).wait();
    await contribute(alice, "1");
    await rpc.request({ method: "evm_increaseTime", params: [86401] });
    await rpc.request({ method: "evm_mine", params: [] });
    await rejected(
      () => fund.connect(alice).refund.staticCall(0),
      "Refund unavailable",
    );
    await request();
    await approve(alice);
    await audit();
  });
  it("isolates escrow for different campaigns", async () => {
    await (await create()).wait();
    await (await create(fund, "2", 1, ["0.8", "1.2"])).wait();
    await contribute(alice, "1");
    await contribute(bob, "0.5", 1);
    await request();
    await approve(alice);
    assert.equal((await audit(0)).escrow, eth("0.6"));
    assert.equal((await audit(1)).escrow, eth("0.5"));
    assert.equal(
      await provider.getBalance(await fund.getAddress()),
      eth("1.1"),
    );
  });
  it("prevents a recipient from recursively refunding and preserves other funds", async () => {
    const source = `pragma solidity ^0.8.24; interface I {function contribute(uint256) external payable; function refund(uint256) external;} contract Attacker {I target; bool public blocked; constructor(address a){target=I(a);} function fund() external payable {target.contribute{value:msg.value}(0);} function claim() external {target.refund(0);} receive() external payable {(bool ok,)=address(target).call(abi.encodeWithSignature("refund(uint256)",0));blocked=!ok;}}`;
    const output = JSON.parse(
      solc.compile(
        JSON.stringify({
          language: "Solidity",
          sources: { "A.sol": { content: source } },
          settings: {
            evmVersion: "paris",
            outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
          },
        }),
      ),
    );
    const a = output.contracts["A.sol"].Attacker;
    const attacker = await new ContractFactory(
      a.abi,
      "0x" + a.evm.bytecode.object,
      outsider,
    ).deploy(await fund.getAddress());
    await attacker.waitForDeployment();
    await (await create()).wait();
    await (await attacker.fund({ value: eth("0.2") })).wait();
    await contribute(alice, "0.3");
    await rpc.request({ method: "evm_increaseTime", params: [86401] });
    await rpc.request({ method: "evm_mine", params: [] });
    await (await attacker.claim()).wait();
    assert.equal(await attacker.blocked(), true);
    assert.equal(
      await provider.getBalance(await attacker.getAddress()),
      eth("0.2"),
    );
    const c = await audit();
    assert.equal(c.escrow, eth("0.3"));
  });
});
