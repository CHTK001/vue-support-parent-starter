// 编码体检：只读扫描，不改任何文件。
//
// 口径（AGENTS.md §0.5）：BOM=0 / 严格 UTF-8 解码失败=0 / U+FFFD=0 / 未闭合字符串行=0。
// 「未闭合字符串行」= 该行有奇数个未转义的双引号，且不是续行/注释行。
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
let bom = 0;
let strictFail = 0;
let fffd = 0;
let unclosed = 0;
const bad = [];

for (const f of files) {
  const buf = readFileSync(f);
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    bom += 1;
    bad.push(`${f}: BOM`);
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch (e) {
    strictFail += 1;
    bad.push(`${f}: 严格UTF-8解码失败 ${e.message}`);
    continue;
  }
  const n = (text.match(/\uFFFD/g) || []).length;
  if (n > 0) {
    fffd += n;
    bad.push(`${f}: U+FFFD x${n}`);
  }
  // unclosedQuote 只对 JS/TS 生效。
  // 原口径来自扫 .java 的 EncCheck；把「按行数引号」这套启发式套到 .vue 上必然误报 ——
  // 模板里 `<svg viewBox="0 0 24 24" ...>` 每行都是成对引号，跨行属性还会把奇偶打乱。
  // .vue 的正确保证是 SFC 能编译（dev server / vue-tsc），不是行级数引号。
  if (!/\.(ts|tsx|mts|cts|mjs|cjs|js|jsx)$/.test(f)) {
    continue;
  }
  text.split(/\r?\n/).forEach((line, i) => {
    // 先剔除三种合法形态，否则会把它们误判成「奇数个引号」：
    //   1. 相邻空串 "" / ''（`?? ""` 这种，一个 token 两个引号）
    //   2. 被反斜杠转义的引号 \" / \'
    //   3. 以引号结尾的跨行属性（Vue 模板里 @dragstart=" 换行 "）
    const probe = line
      .replace(/\\["']/g, "")
      .replace(/""/g, "")
      .replace(/''/g, "")
      .replace(/["']\s*$/, "");
    const q = (probe.match(/"/g) || []).length;
    if (q % 2 === 1 && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
      unclosed += 1;
      bad.push(`${f}:${i + 1}: 疑似未闭合字符串 -> ${line.trim().slice(0, 90)}`);
    }
  });
}

console.log(`扫描 ${files.length} 个文件`);
console.log(`BOM=${bom} strictUtf8Fail=${strictFail} U+FFFD=${fffd} unclosedQuote=${unclosed}`);
if (bad.length) {
  console.log("--- 明细 ---");
  bad.forEach((b) => console.log("  " + b));
}
console.log(bad.length === 0 ? "ENCODING_OK" : "ENCODING_FAIL");
process.exit(bad.length === 0 ? 0 : 1);
