/**
 * ReStatCard 紧凑档验收（监控概览 /workbench + 数据源中心 概览）。
 *
 * 断言口径：
 *   1. 两个页面的概览卡都显式带 compact 档，且卡片确实变小（有上限阈值）；
 *   2. 同排卡片等高 —— 栅格行高由最高的一张决定，一张折行会顶高整排；
 *   3. 数值不得被省略号截断 —— 靠丢信息换来的"变小"不算通过；
 *   4. 数据源概览的 4 张卡用的是 `icon` prop（应有 32px 图标圆）。
 *
 * 默认档（未传 size）是否被改动，不在这里断言 —— 那是 CSS 层面的问题，
 * 由 `git diff` 逐条核对「新增声明是否全部落在 .re-stat-card--compact 下」证明。
 */
import { chromium } from "playwright";

const MAX_H = 100;
let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}${detail ? `  -> ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const measure = async (url, sel) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(sel, { timeout: 90000 });
  await page.waitForTimeout(4500);
  return page.evaluate(() =>
    [...document.querySelectorAll(".re-stat-card")].map(c => {
      const r = c.getBoundingClientRect();
      const v = c.querySelector(".re-stat-card__value");
      const vr = v ? v.getBoundingClientRect() : null;
      const lh = v ? parseFloat(getComputedStyle(v).lineHeight) : 0;
      const ic = c.querySelector(".re-stat-card__icon");
      return {
        title: c.querySelector(".re-stat-card__title")?.textContent?.trim(),
        value: v?.textContent?.trim(),
        compact: c.classList.contains("re-stat-card--compact"),
        w: Math.round(r.width),
        h: Math.round(r.height),
        lines: vr && lh ? Math.round(vr.height / lh) : 0,
        clipped: v ? v.scrollWidth > v.clientWidth + 1 : false,
        iconW: ic ? Math.round(ic.getBoundingClientRect().width) : 0,
      };
    }),
  );
};

// ---------------- 监控概览 ----------------
console.log("=== 监控概览 /workbench ===");
const wb = await measure("http://localhost:8848/#/workbench", "text=资产总数");
console.log(`  卡片: ${wb.map(c => `${c.title}=${c.w}x${c.h}`).join("  ")}`);
check("四张 KPI 卡都在", wb.length === 4, `实际 ${wb.length}`);
check("全部走紧凑档", wb.every(c => c.compact), wb.filter(c => !c.compact).map(c => c.title).join(","));
check(`卡片高度 <= ${MAX_H}px`, wb.every(c => c.h <= MAX_H), `最高 ${Math.max(...wb.map(c => c.h))}px`);
check("四张等高", new Set(wb.map(c => c.h)).size === 1, [...new Set(wb.map(c => c.h))].join(","));
check("数值未被截断", wb.every(c => !c.clipped), wb.filter(c => c.clipped).map(c => c.title).join(","));
check("数值单行显示", wb.every(c => c.lines === 1), wb.filter(c => c.lines !== 1).map(c => `${c.title}:${c.lines}行`).join(","));

// ---------------- 数据源中心 概览 ----------------
console.log("=== 数据源中心 概览 ===");
const ds = await measure("http://localhost:8848/#/datasource", ".ds-stats");
console.log(`  卡片: ${ds.map(c => `${c.title}=${c.w}x${c.h}`).join("  ")}`);
check("四张统计卡都在", ds.length === 4, `实际 ${ds.length}`);
check("全部走紧凑档", ds.every(c => c.compact), ds.filter(c => !c.compact).map(c => c.title).join(","));
check(`卡片高度 <= ${MAX_H}px`, ds.every(c => c.h <= MAX_H), `最高 ${Math.max(...ds.map(c => c.h))}px`);
check("四张等高", new Set(ds.map(c => c.h)).size === 1, [...new Set(ds.map(c => c.h))].join(","));
check("数值未被截断（时间戳不能变省略号）", ds.every(c => !c.clipped),
  ds.filter(c => c.clipped).map(c => `${c.title}="${c.value}"`).join(","));
check("图标圆 32px", ds.every(c => c.iconW === 32), ds.map(c => `${c.title}:${c.iconW}`).join(","));
const lastTest = ds.find(c => c.title === "最后检测");
check("最后检测展示了完整时间戳（含秒）", !!lastTest && /:\d{2}:\d{2}$/.test(lastTest.value || ""),
  lastTest ? `"${lastTest.value}"` : "未找到");
check("长值折行而非截断（行数<=2）", (lastTest?.lines ?? 9) <= 2, `行数=${lastTest?.lines}`);

await browser.close();
console.log();
console.log(fail === 0 ? `STATCARD_COMPACT_ALL_PASS (${pass})` : `STATCARD_COMPACT_FAIL=${fail} (pass=${pass})`);
process.exit(fail === 0 ? 0 : 1);
