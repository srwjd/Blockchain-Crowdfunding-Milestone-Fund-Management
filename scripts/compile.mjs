import fs from "node:fs";
import solc from "solc";
const source = fs.readFileSync(
  new URL("../contracts/InnovateFund.sol", import.meta.url),
  "utf8",
);
const input = {
  language: "Solidity",
  sources: { "InnovateFund.sol": { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "paris",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};
const output = JSON.parse(solc.compile(JSON.stringify(input)));
for (const e of output.errors || []) {
  console[e.severity === "error" ? "error" : "warn"](e.formattedMessage);
}
if (output.errors?.some((e) => e.severity === "error")) process.exit(1);
const artifact = output.contracts["InnovateFund.sol"].InnovateFund;
fs.writeFileSync(
  new URL("../src/abi.json", import.meta.url),
  JSON.stringify(artifact.abi, null, 2) + "\n",
);
fs.mkdirSync(new URL("../artifacts/", import.meta.url), { recursive: true });
fs.writeFileSync(
  new URL("../artifacts/InnovateFund.json", import.meta.url),
  JSON.stringify(
    {
      contractName: "InnovateFund",
      compiler: solc.version(),
      abi: artifact.abi,
      bytecode: "0x" + artifact.evm.bytecode.object,
    },
    null,
    2,
  ) + "\n",
);
fs.copyFileSync(
  new URL("../contracts/InnovateFund.sol", import.meta.url),
  new URL("../public/InnovateFund.sol", import.meta.url),
);
console.log("Compiled InnovateFund; ABI and deployable bytecode generated.");
