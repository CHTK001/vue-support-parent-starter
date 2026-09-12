const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const pages = [
    { id: "tshark", name: "抓包分析", path: "#/tshark" },
    { id: "project", name: "发布项目管理", path: "#/project" },
    { id: "groups", name: "分组管理", path: "#/groups" },
  ];

  for (const p of pages) {
    console.log(`\n=== ${p.name} ===`);
    await page.goto(`http://127.0.0.1:8848/${p.path}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    const rootInfo = await page.evaluate(() => {
      const elMain = document.querySelector(".el-main");
      if (!elMain) return { error: "no .el-main" };
      const rootDiv = elMain.querySelector(":scope > div");
      if (!rootDiv) return { error: "no root div" };
      // 获取所有子元素的类名
      const children = [];
      for (const child of rootDiv.children) {
        children.push({
          tag: child.tagName,
          class: child.className,
          height: child.offsetHeight,
        });
      }
      return {
        rootClass: rootDiv.className,
        rootHeight: rootDiv.offsetHeight,
        rootChildren: children,
        backgroundColor: window.getComputedStyle(rootDiv).backgroundColor,
        color: window.getComputedStyle(rootDiv).color,
      };
    });

    console.log(JSON.stringify(rootInfo, null, 2));
  }

  await browser.close();
})();
