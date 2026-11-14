import fs from "node:fs";
import { isAddress, getAddress } from "ethers";
const [address, block] = process.argv.slice(2);
if (
  !isAddress(address) ||
  /^0x0{40}$/i.test(address) ||
  !/^\d+$/.test(block || "") ||
  !Number.isSafeInteger(Number(block))
) {
  console.error(
    "Usage: node scripts/publish-config.mjs 0xContractAddress deploymentBlock",
  );
  process.exit(1);
}
const config = {
  chainId: 11155111,
  contractAddress: getAddress(address),
  deploymentBlock: Number(block),
  explorerUrl: "https://sepolia.etherscan.io",
};
fs.writeFileSync(
  new URL("../public/config.json", import.meta.url),
  JSON.stringify(config, null, 2) + "\n",
);
console.log(
  "Updated public/config.json. Run npm run build; then deploy GitHub Pages.",
);
