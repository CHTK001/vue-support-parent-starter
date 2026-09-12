const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const outputDir = path.join(__dirname, "..", "test-results", "final-acceptance");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pages = [
    { id: "01-workbench", name: "工作台", path: "#/" },
    { id: "02-assets", name: "主机资产", path: "#/assets" },
    { id: "03-host-detail", name: "主机指标", path: "#/host/1" },
    { id: "04-datasource", name: "数据源管理", path: "#/datasource" },
    { id: "05-db-manager", name: "数据库管理", path: "#/db-manager" },
    { id: "06-redis", name: "Redis监控", path: "#/redis" },
    { id: "07-influxdb", name: "InfluxDB管理", path: "#/influxdb" },
    { id: "08-neo4j", name: "Neo4j管理", path: "#/neo4j" },
    { id: "09-nacos", name: "Nacos管理", path: "#/nacos" },
    { id: "10-zookeeper", name: "ZooKeeper管理", path: "#/zookeeper" },
    { id: "11-terminal", name: "远程控制", path: "#/terminal" },
    { id: "12-alarms", name: "告警中心", path: "#/alarms" },
  ];

  for (const p of pages) {
    console.log(`截图: ${p.name}`);
    try {
      await page.goto(`http://127.0.0.1:8848/${p.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(outputDir, `${p.id}.png`),
        fullPage: false,
      });
    } catch (e) {
      console.log(`  错误: ${e.message}`);
    }
  }

  await browser.close();
  console.log("\n最终验收截图完成");
})();
