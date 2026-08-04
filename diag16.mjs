import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
await page.waitForTimeout(2500);
// 展开工具栏
await page.click(".toolbar-toggle");
await page.waitForTimeout(500);
// 点主题设置入口
await page.click("[class*=koi-setting]");
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const drawer = document.querySelector(".theme-config-drawer, .koi-drawer-shell");
  if (!drawer) return { drawer: false };
  // tabs
  const tabs = [...document.querySelectorAll(".theme-config-tabs .re-tab-capsule__item")].map(el => el.textContent.trim());
  // 主题颜色网格
  const colorGrid = document.querySelector(".theme-colors-grid");
  const colorDots = colorGrid ? colorGrid.querySelectorAll(".color-dot").length : 0;
  // section cards
  const cards = document.querySelectorAll(".section-card").length;
  // login style selector
  const loginSel = document.querySelector(".koi-login-style-selector");
  const loginOpts = loginSel ? loginSel.querySelectorAll(".style-option").length : 0;
  // active color
  const activeDot = colorGrid ? colorGrid.querySelector(".theme-color-item.active .color-dot") : null;
  return {
    drawer: true,
    tabs,
    colorDots,
    activeDotColor: activeDot ? getComputedStyle(activeDot).backgroundColor : null,
    sectionCards: cards,
    loginSelector: !!loginSel,
    loginOptions: loginOpts,
  };
});
console.log(JSON.stringify({ ...info, errs }, null, 2));
await browser.close();
