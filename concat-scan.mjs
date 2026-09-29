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
files.sort();

// 累加拼接，定位第一次失败的位置
let acc = "";
for (let i = 0; i < files.length; i++) {
  acc += readFileSync(files[i], "utf8");
  try {
    transform({ filename: "acc", code: Buffer.from(acc), minify: true });
  } catch (e) {
    const loc = e.loc ? `L${e.loc.line} C${e.loc.column}` : "无loc";
    console.log("首次失败于第 " + (i + 1) + " 个文件加入后: " + files[i].replace(base + "/", ""));
    console.log("  " + loc + "  ->  " + String(e.message).split("\n")[0]);
    // 打印失败点附近的原文
    const lines = acc.split("\n");
    const ln = e.loc ? e.loc.line : 1;
    for (let k = Math.max(0, ln - 4); k < Math.min(lines.length, ln + 2); k++) {
      console.log("  " + (k + 1) + ": " + lines[k].slice(0, 160));
    }
    process.exit(0);
  }
}
console.log("累加全部 " + files.length + " 个文件后仍可压缩 -> 不是简单拼接边界问题");
