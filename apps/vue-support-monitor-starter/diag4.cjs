const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://127.0.0.1:8848/#/project", { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(8000);
  const info = await page.evaluate(() => {
    const main = document.querySelector(".main, main, [class*=content], [class*=page]");
    const portal = document.querySelector(".project-portal, .portal-grid, .sc-page");
    return {
      bodyHasPortal: document.body.innerText.includes("发布项目管理"),
      mainTag: !!document.querySelector("main"),
      mainClass: document.querySelector("main")?.className || "no <main>",
      hasDotMain: document.querySelectorAll(".main").length,
      portalFound: !!portal,
      portalClass: portal ? portal.className : "no portal",
      rootChildren: document.getElementById("app") ? Array.from(document.getElementById("app").children).map(c => c.tagName + "." + (typeof c.className === "string" ? c.className.slice(0, 40) : "")) : [],
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();