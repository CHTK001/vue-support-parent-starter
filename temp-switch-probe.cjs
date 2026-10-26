/**
 * ReSwitch 调试页实测
 *   - 各布局是否渲染 sub / tip / description（1.1）
 *   - card 布局「隐藏开关」是否生效（1.2）
 *   - square 布局默认两态图标是否不同（1）
 */
const { chromium } = require("playwright");
const URL = "http://localhost:8090/#/debug/ReSwitch";

const probe = (page) =>
  page.evaluate(() => {
    const scope = document.querySelector(".debug__preview-body") || document;
    const root =
      scope.querySelector(".re-switch-card") ||
      scope.querySelector(".re-switch-square-wrap") ||
      scope.querySelector(".re-switch-default");
    if (!root) return { found: false };
    const txt = (root.textContent || "").replace(/\s+/g, " ").trim();
    const label = root.querySelector(".re-switch-square__label");
    return {
      found: true,
      rootClass: String(root.className).split(" ")[0],
      text: txt.slice(0, 90),
      hasSub: txt.includes("顶部标签栏"),
      hasDesc: txt.includes("主内容区顶部多标签导航"),
      hasTipIcon: !!root.querySelector(".re-switch-label__tip, .re-switch-card__tip"),
      hasSwitch: !!root.querySelector(".el-switch"),
      iconSig: label ? label.innerHTML.replace(/\s+/g, " ").trim().slice(0, 140) : null,
      squareActive: !!root.querySelector(".re-switch-square--active"),
    };
  });

/** 点布局选项（ReSelect square 是内联选项，title 形如 "square（正方形）"） */
async function pickLayout(page, value) {
  const item = page.locator(`.re-select-square__item[title^="${value}"]`).first();
  if ((await item.count()) === 0) return false;
  await item.click({ force: true });
  await page.waitForTimeout(1100);
  return true;
}

/** 点击左侧布尔字段对应的方形开关 */
async function togglePanelSwitch(page, labelText) {
  const item = page.locator(".el-form-item", { hasText: labelText }).first();
  const btn = item.locator(".re-switch-square").first();
  await btn.click({ force: true });
  await page.waitForTimeout(700);
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 160)));

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(13000);

  const out = { errors: errs };
  out.defaultLayout = await probe(page);

  out.layoutCard = await pickLayout(page, "card");
  out.cardLayout = await probe(page);

  await togglePanelSwitch(page, "隐藏开关");
  out.cardHideSwitchOn = await probe(page);
  await togglePanelSwitch(page, "隐藏开关");

  await pickLayout(page, "square");
  out.squareInactive = await probe(page);
  // 必须限定预览区：左侧参数面板的布尔字段本身就是方形开关
  const btn = page.locator(".debug__preview-body .re-switch-square").first();
  await btn.click({ force: true });
  await page.waitForTimeout(900);
  out.squareActive = await probe(page);

  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => {
  console.error("FATAL " + e.message);
  process.exit(2);
});
