/**
 * 分析已抓到的 trace：找出 UpdateLayoutTree 的调用者链。
 */
const fs = require("fs");
const path = require("path");

const file = process.argv[2] || "D:\\ch\\.trace\\drag-trace-re.json";
const { traceEvents } = JSON.parse(fs.readFileSync(file, "utf8"));
console.log("事件总数:", traceEvents.length);

const xs = traceEvents.filter((e) => e.ph === "X" && typeof e.dur === "number");

// ---------- 1. UpdateLayoutTree 的父事件统计 ----------
// 用 ts 包含关系找父：父的开始 <= 子的开始 且 父的结束 >= 子的结束，取最小的那个
const layoutTree = xs.filter((e) => e.name === "UpdateLayoutTree");
console.log("\nUpdateLayoutTree 次数:", layoutTree.length);

// 建立按时间排序的 X 事件索引
const sorted = xs.slice().sort((a, b) => a.ts - b.ts || b.dur - a.dur);

function findParents(target) {
  const t0 = target.ts;
  const t1 = target.ts + target.dur;
  const parents = [];
  for (const e of sorted) {
    if (e === target) continue;
    if (e.ts <= t0 && e.ts + e.dur >= t1 && e.dur > target.dur) {
      parents.push(e);
    }
    if (e.ts > t0) break;
  }
  // 越小的父越靠近
  parents.sort((a, b) => a.dur - b.dur);
  return parents;
}

// 统计每个 UpdateLayoutTree 的直接父
const parentCount = new Map();
const parentChain = new Map();
for (const e of layoutTree.slice(0, 200)) {
  const ps = findParents(e);
  if (!ps.length) continue;
  const direct = ps[0].name;
  parentCount.set(direct, (parentCount.get(direct) || 0) + 1);
  // 往上追两三层
  const chain = ps.slice(0, 4).map((p) => p.name).join(" < ");
  parentChain.set(chain, (parentChain.get(chain) || 0) + 1);
}

console.log("\n=== UpdateLayoutTree 的直接父事件 ===");
[...parentCount.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

console.log("\n=== 调用链（4 层） ===");
[...parentChain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

// ---------- 2. 样式重算时，有多少元素被重算 ----------
const withData = layoutTree.filter((e) => e.args && e.args.beginData);
console.log("\n带 beginData 的 UpdateLayoutTree:", withData.length);
if (withData.length) {
  const elemCounts = withData.map((e) => ({
    elements: e.args.beginData.dirtyObjects || e.args.beginData.elementCount || 0,
    dur: e.dur,
  }));
  const avgEl = elemCounts.reduce((a, b) => a + b.elements, 0) / elemCounts.length;
  const maxEl = Math.max(...elemCounts.map((e) => e.elements));
  console.log(`  平均每次重算元素数: ${avgEl.toFixed(1)}`);
  console.log(`  单次最大重算元素数: ${maxEl}`);
  // 采样几个
  elemCounts.slice(0, 5).forEach((e, i) => console.log(`  样本${i + 1}: ${e.elements} 个元素, ${(e.dur / 1000).toFixed(2)}ms`));
}

// ---------- 3. 找 mousemove 事件的处理耗时 ----------
const mouseMoves = xs.filter((e) => e.name === "EventDispatch" && e.args?.data?.type === "mousemove");
console.log("\nmousemove 事件处理:", mouseMoves.length, "次");
const mmDur = mouseMoves.map((e) => e.dur / 1000);
if (mmDur.length) {
  const s = mmDur.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
  console.log(`  平均 ${(mmDur.reduce((a, b) => a + b, 0) / mmDur.length).toFixed(3)}ms  p50=${q(0.5).toFixed(3)} p95=${q(0.95).toFixed(3)} max=${s[s.length - 1].toFixed(3)}ms`);
}

// ---------- 4. 整个拖拽期间主线程总忙时 ----------
const runTasks = xs.filter((e) => e.name === "RunTask");
if (runTasks.length) {
  const total = runTasks.reduce((a, e) => a + e.dur, 0) / 1000;
  const span = Math.max(...runTasks.map((e) => e.ts + e.dur)) - Math.min(...runTasks.map((e) => e.ts));
  console.log(`\n主线程 RunTask: ${runTasks.length} 次, 总 ${total.toFixed(0)}ms, 覆盖 ${(span / 1000).toFixed(0)}ms, 占用率 ${((total / (span / 1000)) * 100).toFixed(1)}%`);
}

// ---------- 5. FunctionCall 中最耗时的 JS 函数 ----------
const funcs = xs.filter((e) => e.name === "FunctionCall" && e.args?.data?.functionName);
const fAgg = new Map();
for (const e of funcs) {
  const n = e.args.data.functionName;
  const cur = fAgg.get(n) || { dur: 0, count: 0 };
  cur.dur += e.dur;
  cur.count++;
  fAgg.set(n, cur);
}
console.log("\n=== JS 函数耗时排行 ===");
[...fAgg.entries()]
  .sort((a, b) => b[1].dur - a[1].dur)
  .slice(0, 20)
  .forEach(([n, v]) =>
    console.log(`  ${(v.dur / 1000).toFixed(1).padStart(8)}ms  ${String(v.count).padStart(5)} 次  ${n.slice(0, 60)}`)
  );
