/**
 * 深挖「每次 mousemove 触发一次全文档样式重算」。
 *
 * 输出：
 *   1. UpdateLayoutTree / recalcStyle 的父子链
 *   2. mousemove 事件处理链里每一步的耗时（谁调用了 HandleInputEvent）
 *   3. 重算时 dirty 的来源：是 style 属性写入？是 :hover 命中？还是别的
 *   4. 对比：拖动"弹窗" vs 拖动"透明遮罩外"，判断是否与弹窗元素自身有关
 *
 * 用法：node scripts/analyze-recalc.js D:\ch\.trace\real-alarm.json
 */
const fs = require("fs");

const file = process.argv[2] || "D:\\ch\\.trace\\real-alarm.json";
const { traceEvents } = JSON.parse(fs.readFileSync(file, "utf8"));
console.log("文件:", file, " 事件数:", traceEvents.length);

const xs = traceEvents.filter((e) => e.ph === "X" && typeof e.dur === "number");
const sorted = xs.slice().sort((a, b) => a.ts - b.ts || b.dur - a.dur);

/** 找 [ts, ts+dur] 完全包含目标事件、且比它大的最近父事件 */
function parentsOf(target, maxUp = 5) {
  const t0 = target.ts;
  const t1 = target.ts + target.dur;
  const res = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const e = sorted[i];
    if (e.ts > t0) continue;
    if (e === target) continue;
    if (e.ts + e.dur >= t1 && e.dur > target.dur) res.push(e);
  }
  res.sort((a, b) => a.dur - b.dur);
  // 去重同名相邻
  const out = [];
  for (const e of res) {
    const n = e.name;
    if (n.includes("RunTask") || n.includes("Edge_RunTask") || n.includes("ThreadControllerImpl")) {
      out.push(e);
      if (out.length >= 2) break;
      continue;
    }
    out.push(e);
    if (out.length >= maxUp) break;
  }
  return out;
}

// ---------- 1. recalcStyle 的父链 ----------
const recalc = xs.filter((e) => e.name === "Document::recalcStyle");
console.log(`\n=== Document::recalcStyle: ${recalc.length} 次 ===`);
const chainMap = new Map();
for (const e of recalc.slice(0, 120)) {
  const ps = parentsOf(e, 4);
  const chain = ps.map((p) => p.name).join(" < ");
  chainMap.set(chain, (chainMap.get(chain) || 0) + 1);
}
[...chainMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log(`  ${String(v).padStart(4)}  ${k}`));

// ---------- 2. mousemove 处理链耗时 ----------
const mm = xs.filter((e) => e.name === "WidgetBaseInputHandler::OnHandleInputEvent");
console.log(`\n=== 鼠标输入处理: ${mm.length} 次 ===`);
if (mm.length) {
  const d = mm.map((e) => e.dur / 1000).sort((a, b) => a - b);
  const q = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
  console.log(`  总 ${d.reduce((a, b) => a + b, 0).toFixed(1)}ms  平均 ${(d.reduce((a, b) => a + b, 0) / d.length).toFixed(2)}ms  p50=${q(0.5).toFixed(2)} p95=${q(0.95).toFixed(2)} max=${d[d.length - 1].toFixed(2)}ms`);

  // 一次输入处理里各步占比
  const first = mm[5] || mm[0];
  const inside = xs.filter((e) => e.ts >= first.ts && e.ts + e.dur <= first.ts + first.dur && e !== first);
  const byName = new Map();
  for (const e of inside) {
    const cur = byName.get(e.name) || { dur: 0, n: 0 };
    cur.dur += e.dur;
    cur.n++;
    byName.set(e.name, cur);
  }
  console.log(`  单次输入处理(${first.dur / 1000}ms)内部构成:`);
  [...byName.entries()]
    .sort((a, b) => b[1].dur - a[1].dur)
    .slice(0, 12)
    .forEach(([n, v]) => console.log(`    ${(v.dur / 1000).toFixed(2).padStart(7)}ms ×${String(v.n).padStart(3)}  ${n}`));
}

// ---------- 3. 样式重算单次耗时分布 ----------
const ult = xs.filter((e) => e.name === "UpdateLayoutTree");
if (ult.length) {
  const d = ult.map((e) => e.dur / 1000).sort((a, b) => a - b);
  const q = (p) => d[Math.min(d.length - 1, Math.floor(d.length * p))];
  console.log(`\n=== UpdateLayoutTree: ${ult.length} 次, 总 ${d.reduce((a, b) => a + b, 0).toFixed(1)}ms ===`);
  console.log(`  单次 p50=${q(0.5).toFixed(3)} p95=${q(0.95).toFixed(3)} max=${d[d.length - 1].toFixed(3)}ms`);
  // beginData: 有多少元素被重算
  const withData = ult.filter((e) => e.args && e.args.beginData);
  if (withData.length) {
    const sample = withData.slice(0, 5).map((e) => JSON.stringify(e.args.beginData));
    console.log("  beginData 样本:", sample.join(" | "));
    const counts = withData.map((e) => e.args.beginData.elementCount ?? e.args.beginData.dirtyObjects ?? -1);
    const valid = counts.filter((c) => c >= 0);
    if (valid.length) console.log(`  重算元素数: 平均 ${(valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)}  最大 ${Math.max(...valid)}`);
  }
}

// ---------- 4. 命中测试 ----------
const hit = xs.filter((e) => /HitTest/i.test(e.name));
console.log(`\n=== 命中测试事件: ${hit.length} 次 ===`);
const hitAgg = new Map();
for (const e of hit) hitAgg.set(e.name, (hitAgg.get(e.name) || 0) + 1);
[...hitAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([n, c]) => console.log(`  ${String(c).padStart(4)}  ${n}`));

// ---------- 5. 提交/光栅 ----------
["Commit", "RasterTask", "Paint", "CompositeLayers", "UpdateLayerTree"].forEach((n) => {
  const list = xs.filter((e) => e.name === n);
  if (!list.length) return;
  const total = list.reduce((a, e) => a + e.dur, 0) / 1000;
  console.log(`${n.padEnd(16)} ${String(list.length).padStart(5)} 次  合计 ${total.toFixed(1)}ms`);
});
