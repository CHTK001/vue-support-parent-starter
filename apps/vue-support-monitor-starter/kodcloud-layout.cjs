const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://demo.kodcloud.com/#project", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  console.log("TITLE:", await page.title());

  // 提取页面主要容器结构
  const layout = await page.evaluate(() => {
    const pick = (el) => {
      if (!el) return null;
      const c = (el.className && typeof el.className === "string") ? el.className.split(" ").slice(0, 4).join(".") : "";
      return { tag: el.tagName.toLowerCase(), cls: c, id: el.id || "" };
    };
    // 顶部/左侧/主区域
    const header = document.querySelector("header, .header, .top-bar, .app-header, #top");
    const sidebar = document.querySelector("aside, .sidebar, .menu, .left, #nav");
    const main = document.querySelector("main, .main, .content, .page, #main, #content");
    const navItems = header ? Array.from(header.querySelectorAll("a, li, button, span")).slice(0, 40).map(e => (e.textContent || "").trim()).filter(Boolean).slice(0, 25) : [];
    return {
      header: pick(header),
      sidebar: pick(sidebar),
      main: pick(main),
      headerNav: navItems,
      bodyClasses: document.body.className,
    };
  });
  console.log("LAYOUT:", JSON.stringify(layout, null, 2));

  await browser.close();
})();