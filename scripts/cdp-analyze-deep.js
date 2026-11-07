/**
 * 从已保存的 trace 里还原「一次鼠标移动」的完整时间线。
 *
 * 目的：找出拖拽时单次 mousemove 里 8.7ms 花在哪，
 * 以及 UpdateLayoutTree 元素=100 的那两次是谁触发的（栈里是 es-xxx.js）。
 */
const fs = require("fs");
const file = process.argv[2] || "D:\\ch\\.trace\\deep-frame-fixed.json";
const raw = JSON.parse(fs.readFileSync(file, "utf8"));
const ev = raw.traceEvents || raw;

const X = ev.filter((e) => e.ph === "X" && typeof e.dur === "number");
const B = ev.filter((e) => e.ph === "B");
const E = ev.filter((e) => e.ph === "E");

// 1. 最长的一次 EventDispatch(mousemove)
const mm = X.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove").sort((a, b) => b.dur - a.dur);
console.log("=== mousemove EventDispatch 耗时 TOP 5 ===");
mm.slice(0, 5).forEach((e, i) => console.log(`  #${i + 1} ${(e.dur / 1000).toFixed(2)}ms  ts=${e.ts}  tid=${e.tid}`));

const worst = mm[0];
if (!worst) process.exit(0);

// 2. 该事件时间窗内（同线程）所有嵌套事件
const win = X.filter((x) => x.tid === worst.tid && x.ts >= worst.ts && x.ts + x.dur <= worst.ts + worst.dur)
  .sort((a, b) => a.ts - b.ts);
console.log(`\n=== 最长那次 mousemove（${(worst.dur / 1000).toFixed(2)}ms）内部事件 ===`);
console.log("  偏移ms  耗时ms  事件名");
win.forEach((x) => {
  const off = ((x.ts - worst.ts) / 1000).toFixed(2);
  const d = (x.dur / 1000).toFixed(2);
  if (x.dur > 100) console.log(`  ${off.padStart(7)} ${d.padStart(7)}  ${x.name}`);
});

// 3. 用 B/E 区间还原完整调用栈（含非 X 事件的嵌套）
const be = ev.filter((e) => (e.ph === "B" || e.ph === "E") && e.tid === worst.tid).sort((a, b) => a.ts - b.ts);
console.log(`\n=== 同线程 B/E 区间时长 TOP 12（整段录制期间）===`);
const stack = [];
const durations = [];
for (const e of be) {
  if (e.ph === "B") {
    stack.push({ name: e.name, ts: e.ts, depth: stack.length });
  } else {
    const open = stack.pop();
    if (!open) continue;
    durations.push({ name: open.name, dur: e.ts - open.ts, depth: open.depth, ts: open.ts });
  }
}
durations.sort((a, b) => b.dur - a.dur);
durations.slice(0, 12).forEach((d) => {
  console.log(`  ${(d.dur / 1000).toFixed(2).padStart(8)}ms  depth=${d.depth}  ${d.name}`);
});

// 4. UpdateLayoutTree 元素=100 的那几次，找同时刻的 JS 栈
const big = X.filter((e) => e.name === "UpdateLayoutTree" && (e.args?.elementCount || 0) >= 100);
console.log(`\n=== UpdateLayoutTree 元素>=100 共 ${big.length} 次 ===`);
big.slice(0, 3).forEach((e, i) => {
  console.log(`  #${i + 1} ${(e.dur / 1000).toFixed(2)}ms 元素=${e.args.elementCount}`);
  const st = e.args?.beginData?.stackTrace;
  if (st) st.slice(0, 6).forEach((f) => console.log(`      ${f.functionName || "(anon)"} @ ${(f.url || "").split("/").slice(-2).join("/")}:${f.lineNumber}`));
  // 同时刻附近有没有 JS 任务
  const near = X.filter((x) => x.tid === e.tid && Math.abs(x.ts - e.ts) < 3000 && ["FunctionCall", "EvaluateScript", "TimerFire", "EventDispatch"].includes(x.name));
  near.slice(0, 3).forEach((n) => {
    const s2 = n.args?.beginData?.stackTrace || n.args?.data?.stackTrace;
    const top = s2 && s2[0] ? `${s2[0].functionName || "(anon)"} @ ${(s2[0].url || "").split("/").slice(-2).join("/")}:${s2[0].lineNumber}` : "-";
    console.log(`      附近: ${n.name} (${(n.dur / 1000).toFixed(2)}ms) ${top}`);
  });
});

// 5. JS 执行总账
const js = X.filter((e) => ["FunctionCall", "EvaluateScript", "v8.compile"].includes(e.name));
console.log(`\n=== JS 执行 ===`);
console.log(`  FunctionCall/EvaluateScript 共 ${js.length} 次 / ${(js.reduce((s, e) => s + e.dur, 0) / 1000).toFixed(1)}ms`);
const longJs = js.filter((e) => e.dur > 500).sort((a, b) => b.dur - a.dur);
console.log(`  单次 >0.5ms 的 ${longJs.length} 次，最长: ` + longJs.slice(0, 5).map((e) => (e.dur / 1000).toFixed(2) + "ms").join(", "));
longJs.slice(0, 3).forEach((e, i) => {
  const st = e.args?.beginData?.stackTrace || e.args?.data?.stackTrace;
  console.log(`  #${i + 1} ${(e.dur / 1000).toFixed(2)}ms`);
  if (st) st.slice(0, 5).forEach((f) => console.log(`      ${f.functionName || "(anon)"} @ ${(f.url || "").split("/").slice(-2).join("/")}:${f.lineNumber}`));
});
