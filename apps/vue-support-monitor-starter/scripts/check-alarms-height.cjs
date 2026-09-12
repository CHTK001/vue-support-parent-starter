const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  console.log("=== 告警中心 ===");
  await page.goto("http://127.0.0.1:8848/#/alarms", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const pageInfo = await page.evaluate(() => {
    const elMain = document.querySelector(".el-main");
    const elContainer = document.querySelector(".el-container");
    const elContainerVertical = document.querySelector(".el-container.is-vertical");
    return {
      elMainHeight: elMain ? elMain.offsetHeight : 0,
      elMainDisplay: elMain ? window.getComputedStyle(elMain).display : "not found",
      elMainFlex: elMain ? window.getComputedStyle(elMain).flex : "not found",
      elContainerHeight: elContainer ? elContainer.offsetHeight : 0,
      elContainerFlexDirection: elContainer ? window.getComputedStyle(elContainer).flexDirection : "not found",
      elContainerVerticalHeight: elContainerVertical ? elContainerVertical.offsetHeight : 0,
      elContainerVerticalTop: elContainerVertical ? elContainerVertical.offsetTop : 0,
      elContainerVerticalFlexDirection: elContainerVertical ? window.getComputedStyle(elContainerVertical).flexDirection : "not found",
      // 检查 .el-container.is-vertical 的子元素
      elContainerVerticalChildren: elContainerVertical ? Array.from(elContainerVertical.children).map((c) => ({
        tag: c.tagName,
        class: c.className,
        height: c.offsetHeight,
        top: c.offsetTop,
      })) : [],
    };
  });

  console.log(JSON.stringify(pageInfo, null, 2));
  console.log("控制台错误:", errors.slice(0, 5));

  await browser.close();
})();
