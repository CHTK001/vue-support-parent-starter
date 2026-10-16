/**
 * 把各分片日志归并成一份最终汇总。
 *
 * <p>坑都是实测踩出来的，写在这里免得再踩：</p>
 *
 * <ol>
 *   <li><b>日志的编码是「UTF-16LE 里装着二次乱码」</b>：Node 的 stdout 是 UTF-8，
 *       PowerShell 按控制台代码页（本机 GBK）把它解成乱码字符串，再以 UTF-16LE 落盘。
 *       于是按 UTF-8 读全是乱码、按 UTF-16LE 读也是乱码。</li>
 *   <li><b>但结论仍然可读</b>：页名（{@code ReButton}）、数字、判定
 *       （{@code PASS}/{@code FAIL}/{@code ok}）<b>全是 ASCII，一个字节都没坏</b>。
 *       所以要取的是「哪个组件页 / 几个可点元素 / 什么判定」，完全可以只靠 ASCII 结构解析，
 *       不必去还原中文 —— 少做一步不可靠的编码逆变换。</li>
 * </ol>
 *
 * <p>归并规则：同一页跑过多次时记录**历史结论集合**，并取最新一次为「当前结论」。
 * 「偶发失败」与「稳定通过」必须区分开，否则会把环境抖动读成产品结论。</p>
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
/** 可选：只看文件名以此开头的日志（例如 F-S，用于只看某一轮最终验证的分片） */
const prefix = process.argv[3] || "";

/** 按 BOM 嗅探编码读取（PowerShell 重定向给的是 UTF-16LE） */
function readLog(p) {
  const buf = readFileSync(p);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString("utf16le").replace(/^\uFEFF/, "");
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.slice(3).toString("utf8");
  return buf.toString("utf8");
}

const files = readdirSync(dir)
  .filter(f => f.endsWith(".log") && f.startsWith(prefix))
  .map(f => ({ f, p: path.join(dir, f), t: statSync(path.join(dir, f)).mtimeMs }))
  .sort((a, b) => a.t - b.t);

/* 全部只用 ASCII 结构匹配，中文部分一律用 \D*? 跳过 */
/** 判据行：[PASS] ReXxx：N 个可点元素都合契约 */
const CHECK = /\[(PASS|FAIL)\]\s+(Re[A-Z][\w]*)\D*?(\d+)/;
/** 逐页明细行：  ReXxx  <中文>  N  <判定> */
const ROW = /^\s{2}(Re[A-Z][\w]*)\s+\D*?(\d+)\s+(\S+)/;

const byPage = new Map();
let logsWithRows = 0;

for (const { f, p } of files) {
  const text = readLog(p);
  let sawAny = false;
  for (const line of text.split(/\r?\n/)) {
    const c = line.match(CHECK);
    if (c) {
      const [, verdict, name, n] = c;
      const prev = byPage.get(name);
      const marks = prev ? prev.marks : new Set();
      marks.add(verdict === "PASS" ? "ok" : "fail");
      byPage.set(name, {
        n: Number(n),
        mark: verdict === "PASS" ? "ok" : "fail",
        runs: (prev?.runs ?? 0) + 1,
        marks,
        lastFile: f,
      });
      sawAny = true;
      continue;
    }
    const r = line.match(ROW);
    if (r) {
      const [, name, n, mark] = r;
      const prev = byPage.get(name);
      const marks = prev ? prev.marks : new Set();
      marks.add(mark);
      byPage.set(name, {
        n: Number(n),
        mark,
        runs: Math.max(prev?.runs ?? 1, 1),
        marks,
        lastFile: f,
      });
      sawAny = true;
    }
  }
  if (sawAny) logsWithRows++;
}

const pages = [...byPage.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const latestOk = pages.filter(([, v]) => v.mark === "ok");
const latestNotOk = pages.filter(([, v]) => v.mark !== "ok");
const flaky = pages.filter(([, v]) => v.marks.size > 1);

console.log(`扫描日志 ${files.length} 个，其中含可解析行的 ${logsWithRows} 个`);
console.log(`归并到的组件页数：${pages.length}`);
console.log("");
/* 覆盖口径：以「历史结论里出现过 ok」为准。
   只看「最新一次」会因日志跨轮次而失真 —— 同一页这一次因机器内存受限记了
   TIMEOUT(未验证)，并不推翻它此前被真实验证通过的事实。两类都必须报出来。 */
const everOk = pages.filter(([, v]) => v.marks.has("ok"));
console.log(`曾验证通过（历史结论含 ok）的页数：${everOk.length}`);
console.log(`这些页确认过的可点元素合计：${everOk.reduce((s, [, v]) => s + v.n, 0)}`);
console.log(`最新结论 = ok 的页数：${latestOk.length}（受本轮机器内存状况影响，见下）`);
if (latestNotOk.length) {
  console.log(`最新结论 != ok 的：${latestNotOk.length}`);
  for (const [n, v] of latestNotOk) console.log(`  - ${n.padEnd(20)} ${v.mark}  (最近来自 ${v.lastFile})`);
}
const neverOk = pages.filter(([, v]) => !v.marks.has("ok"));
if (neverOk.length) {
  console.log(`从未验证通过的页：${neverOk.length}（必须列为未达成）`);
  for (const [n, v] of neverOk) console.log(`  - ${n.padEnd(20)} 历史结论：${[...v.marks].join(" / ")}`);
} else {
  console.log("从未验证通过的页：0");
}
if (flaky.length) {
  console.log(`多次运行结论不一致（须人工定性）：${flaky.length}`);
  for (const [n, v] of flaky) console.log(`  - ${n.padEnd(20)} 历史结论：${[...v.marks].join(" / ")}`);
}
console.log("");
console.log("逐页（名称 / 最新可点 / 最新结论 / 历史结论）");
for (const [n, v] of pages) console.log(`  ${n.padEnd(20)} ${String(v.n).padStart(3)}  ${v.mark.padEnd(6)} ${[...v.marks].join(",")}`);
