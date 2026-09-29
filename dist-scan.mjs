import { createRequire } from "node:module";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const base = "D:/ch/project/vue-support-parent-starter";
const pnpm = base + "/node_modules/.pnpm";
const dir = readdirSync(pnpm).find((d) => d.startsWith("lightningcss@"));
const require = createRequire(base + "/index.cjs");
const lc = require(pnpm + "/" + dir + "/node_modules/lightningcss");
const transform = lc.transform || (lc.default && lc.default.transform);

const root = base + "/apps/vue-support-system-starter/dist";
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n.endsWith(".css")) files.push(p);
  }
})(root);

console.log("dist css 文件数=" + files.length);
let bad = 0;
for (const f of files) {
  try {
    transform({ filename: f, code: readFileSync(f), minify: true });
  } catch (e) {
    bad++;
    const loc = e.loc ? `L${e.loc.line} C${e.loc.column}` : "无loc";
    console.log("FAIL " + f.replace(base + "/", "") + "  " + loc + "  ->  " + String(e.message).split("\n")[0]);
  }
}
console.log("failed=" + bad);
