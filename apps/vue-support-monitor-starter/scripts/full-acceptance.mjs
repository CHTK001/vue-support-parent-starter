import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('test-results/full-acceptance');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const PAGES = [
  { name: '01-workbench', url: 'http://127.0.0.1:8848/#/', title: '工作台/监控概览' },
  { name: '02-alarms', url: 'http://127.0.0.1:8848/#/alarms', title: '告警中心' },
  { name: '03-redis', url: 'http://127.0.0.1:8848/#/redis', title: 'Redis监控' },
  { name: '04-tshark', url: 'http://127.0.0.1:8848/#/tshark', title: '抓包分析' },
  { name: '05-assets', url: 'http://127.0.0.1:8848/#/assets', title: '主机资产' },
  { name: '06-datasource', url: 'http://127.0.0.1:8848/#/datasource', title: '数据源管理' },
  { name: '07-db-manager', url: 'http://127.0.0.1:8848/#/db-manager', title: '数据库管理' },
  { name: '08-influxdb', url: 'http://127.0.0.1:8848/#/influxdb', title: 'InfluxDB管理' },
  { name: '09-neo4j', url: 'http://127.0.0.1:8848/#/neo4j', title: 'Neo4j管理' },
  { name: '10-nacos', url: 'http://127.0.0.1:8848/#/nacos', title: 'Nacos管理' },
  { name: '11-zookeeper', url: 'http://127.0.0.1:8848/#/zookeeper', title: 'ZooKeeper管理' },
  { name: '12-terminal', url: 'http://127.0.0.1:8848/#/terminal', title: '远程控制' },
  { name: '13-project', url: 'http://127.0.0.1:8848/#/project', title: '发布项目管理' },
  { name: '14-config', url: 'http://127.0.0.1:8848/#/config', title: '监控配置' },
  { name: '15-proxy', url: 'http://127.0.0.1:8848/#/proxy', title: '代理管理' },
  { name: '16-system-config', url: 'http://127.0.0.1:8848/#/system-config', title: '系统配置' },
  { name: '17-groups', url: 'http://127.0.0.1:8848/#/groups', title: '分组管理' },
  { name: '18-account', url: 'http://127.0.0.1:8848/#/account', title: '账号管理' },
];

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
});

const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  ignoreHTTPSErrors: true,
});

const page = await context.newPage();

// 收集控制台错误
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

// 收集页面错误
const pageErrors = [];
page.on('pageerror', err => {
  pageErrors.push(err.message);
});

const results = [];

for (const p of PAGES) {
  console.log(`\n=== 验收: ${p.title} (${p.name}) ===`);
  console.log(`URL: ${p.url}`);
  
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // 等待数据加载
    
    // 检查页面内容
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasError = bodyText.includes('错误') || bodyText.includes('Error') || bodyText.includes('失败') || bodyText.includes('500') || bodyText.includes('404');
    const hasLoading = bodyText.includes('加载中') || bodyText.includes('Loading') || bodyText.includes('loading');
    const hasEmpty = bodyText.includes('暂无数据') || bodyText.includes('No Data') || bodyText.includes('空');
    
    // 检查 .tel-page 高度
    const telPageHeight = await page.evaluate(() => {
      const el = document.querySelector('.tel-page');
      return el ? el.offsetHeight : 0;
    });
    
    // 截图
    const screenshotPath = path.join(OUTPUT_DIR, `${p.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    const result = {
      name: p.name,
      title: p.title,
      url: p.url,
      status: 'success',
      telPageHeight,
      hasError,
      hasLoading,
      hasEmpty,
      consoleErrors: consoleErrors.slice(-5),
      pageErrors: pageErrors.slice(-5),
      screenshot: screenshotPath,
    };
    
    results.push(result);
    console.log(`状态: 成功, 高度: ${telPageHeight}px, 错误: ${hasError}, 加载中: ${hasLoading}, 空数据: ${hasEmpty}`);
    if (consoleErrors.length > 0) console.log(`控制台错误: ${consoleErrors.slice(-3).join('; ')}`);
    if (pageErrors.length > 0) console.log(`页面错误: ${pageErrors.slice(-3).join('; ')}`);
    
    // 重置错误收集
    consoleErrors.length = 0;
    pageErrors.length = 0;
    
  } catch (err) {
    const result = {
      name: p.name,
      title: p.title,
      url: p.url,
      status: 'failed',
      error: err.message,
      screenshot: null,
    };
    results.push(result);
    console.log(`状态: 失败, 错误: ${err.message}`);
  }
}

// 保存验收报告
const reportPath = path.join(OUTPUT_DIR, 'acceptance-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');

console.log(`\n\n=== 全量验收完成 ===`);
console.log(`总页面数: ${results.length}`);
console.log(`成功: ${results.filter(r => r.status === 'success').length}`);
console.log(`失败: ${results.filter(r => r.status === 'failed').length}`);
console.log(`有错误: ${results.filter(r => r.hasError).length}`);
console.log(`空数据: ${results.filter(r => r.hasEmpty).length}`);
console.log(`报告保存: ${reportPath}`);
console.log(`截图保存: ${OUTPUT_DIR}`);

await browser.close();
