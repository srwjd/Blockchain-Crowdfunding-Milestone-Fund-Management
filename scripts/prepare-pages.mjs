import fs from "node:fs";
const root = new URL("../", import.meta.url);
if (!fs.existsSync(new URL("dist/index.html", root)))
  throw Error("Run npm run build first");
fs.rmSync(new URL("docs", root), { recursive: true, force: true });
fs.cpSync(new URL("dist", root), new URL("docs", root), { recursive: true });
fs.writeFileSync(new URL("docs/.nojekyll", root), "");
console.log("GitHub Pages branch output prepared in docs/.");
