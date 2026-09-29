import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const base = "D:/ch/project/vue-support-parent-starter";
const pnpm = base + "/node_modules/.pnpm";
const dir = readdirSync(pnpm).find((d) => d.startsWith("lightningcss@"));
const require = createRequire(base + "/index.cjs");
const lc = require(pnpm + "/" + dir + "/node_modules/lightningcss");
const transform = lc.transform || (lc.default && lc.default.transform);

const vueFiles = execSync('git ls-files "*.vue"', { encoding: "utf8", cwd: base })
  .trim().split("\n").filter(Boolean);

for (const f of vueFiles) {
  const src = readFileSync(base + "/" + f, "utf8");
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
  let m, i = 0;
  while ((m = re.exec(src))) {
    i++;
    const code = m[1].trim();
    if (!code) continue;
    try {
      transform({ filename: f + "#style" + i, code: Buffer.from(code), minify: true });
    } catch (e) {
      const msg = String(e.message).split("\n")[0];
      if (!msg.includes("Semicolon")) continue;
      // 计算 style 块在文件中的起始行，便于直接定位
      const startLine = src.slice(0, m.index).split("\n").length;
      const loc = e.loc ? `style内 L${e.loc.line} C${e.loc.column}` : "无loc";
      console.log(`FAIL ${f} (style#${i}, 文件起始行≈${startLine})  ${loc}  ->  ${msg}`);
    }
  }
}
console.log("done");
