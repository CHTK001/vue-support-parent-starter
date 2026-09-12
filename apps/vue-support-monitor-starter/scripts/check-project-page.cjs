const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // 收集控制台错误
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  console.log("=== 发布项目管理 ===");
  try {
    await page.goto("http://127.0.0.1:8848/#/project", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(3000);

    const pageInfo = await page.evaluate(() => {
      const body = document.body;
      const app = document.querySelector("#app");
      const elMain = document.querySelector(".el-main");
      const allDivs = document.querySelectorAll("div");
      // 找到可能的根容器
      const rootCandidates = [];
      for (const div of allDivs) {
        if (div.offsetHeight > 500 && div.children.length > 0) {
          rootCandidates.push({
            class: div.className,
            height: div.offsetHeight,
            top: div.offsetTop,
            childCount: div.children.length,
          });
        }
      }
      return {
        bodyHeight: body.offsetHeight,
        appHeight: app ? app.offsetHeight : 0,
        elMainExists: !!elMain,
        elMainHeight: elMain ? elMain.offsetHeight : 0,
        rootCandidates: rootCandidates.slice(0, 10),
        pageTitle: document.title,
        url: window.location.href,
      };
    });

    console.log(JSON.stringify(pageInfo, null, 2));
    console.log("控制台错误:", errors);
  } catch (e) {
    console.log("错误:", e.message);
    console.log("控制台错误:", errors);
  }

  await browser.close();
})();
