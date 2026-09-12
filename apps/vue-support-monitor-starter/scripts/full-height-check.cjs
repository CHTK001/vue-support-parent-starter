const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const outputDir = path.join(__dirname, "..", "test-results", "full-height-check");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pages = [
    { id: "01-workbench", name: "工作台", path: "#/" },
    { id: "02-alarms", name: "告警中心", path: "#/alarms" },
    { id: "03-redis", name: "Redis监控", path: "#/redis" },
    { id: "04-tshark", name: "抓包分析", path: "#/tshark" },
    { id: "05-assets", name: "主机资产", path: "#/assets" },
    { id: "06-datasource", name: "数据源管理", path: "#/datasource" },
    { id: "07-db-manager", name: "数据库管理", path: "#/db-manager" },
    { id: "08-influxdb", name: "InfluxDB管理", path: "#/influxdb" },
    { id: "09-neo4j", name: "Neo4j管理", path: "#/neo4j" },
    { id: "10-nacos", name: "Nacos管理", path: "#/nacos" },
    { id: "11-zookeeper", name: "ZooKeeper管理", path: "#/zookeeper" },
    { id: "12-terminal", name: "远程控制", path: "#/terminal" },
    { id: "13-project", name: "发布项目管理", path: "#/project" },
    { id: "14-config", name: "监控配置", path: "#/config" },
    { id: "15-proxy", name: "代理管理", path: "#/proxy" },
    { id: "16-system-config", name: "系统配置", path: "#/system-config" },
    { id: "17-groups", name: "分组管理", path: "#/groups" },
    { id: "18-account", name: "账号管理", path: "#/account" },
  ];

  const results = [];

  for (const p of pages) {
    console.log(`\n=== ${p.name} ===`);
    try {
      await page.goto(`http://127.0.0.1:8848/${p.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);

      const heights = await page.evaluate(() => {
        const elMain = document.querySelector(".el-main");
        const rootDiv = elMain ? elMain.querySelector(":scope > div") : null;
        const telPage = document.querySelector(".tel-page");
        return {
          elMainHeight: elMain ? elMain.offsetHeight : 0,
          rootDivHeight: rootDiv ? rootDiv.offsetHeight : 0,
          rootDivClass: rootDiv ? rootDiv.className : "not found",
          telPageHeight: telPage ? telPage.offsetHeight : 0,
          telPageClass: telPage ? telPage.className : "not found",
          hasTelPage: !!telPage,
          windowHeight: window.innerHeight,
        };
      });

      const heightOk = heights.elMainHeight > 800;
      const hasTelPage = heights.hasTelPage;

      console.log(`elMain: ${heights.elMainHeight}px, rootDiv: ${heights.rootDivHeight}px, telPage: ${heights.telPageHeight}px, hasTelPage: ${hasTelPage}`);
      console.log(`高度OK: ${heightOk}, 主题OK: ${hasTelPage}`);

      await page.screenshot({
        path: path.join(outputDir, `${p.id}.png`),
        fullPage: false,
      });

      results.push({
        ...p,
        ...heights,
        heightOk,
        hasTelPage,
        status: heightOk && hasTelPage ? "通过" : "需修复",
      });
    } catch (e) {
      console.log(`错误: ${e.message}`);
      results.push({ ...p, error: e.message, status: "错误" });
    }
  }

  // 统计
  const passed = results.filter((r) => r.status === "通过").length;
  const needFix = results.filter((r) => r.status === "需修复").length;
  const errors = results.filter((r) => r.status === "错误").length;

  console.log("\n========================================");
  console.log("  全量高度检查结果");
  console.log("========================================");
  console.log(`总页面数: ${results.length}`);
  console.log(`通过: ${passed}`);
  console.log(`需修复: ${needFix}`);
  console.log(`错误: ${errors}`);
  console.log("========================================");

  // 保存结果
  fs.writeFileSync(
    path.join(outputDir, "height-check-results.json"),
    JSON.stringify(results, null, 2),
    "utf-8"
  );

  await browser.close();
})();
