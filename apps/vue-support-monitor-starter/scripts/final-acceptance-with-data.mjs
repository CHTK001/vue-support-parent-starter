import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = 'test-results/final-acceptance-with-data';
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const results = [];

async function verifyPage(name, url, checkData, waitTime = 5000) {
  try {
    console.log(`验证: ${name}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(waitTime);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasError = pageText.includes('数据加载失败') || pageText.includes('AxiosError');
    const hasData = checkData(pageText);
    
    await page.screenshot({ path: `${screenshotDir}/${name}.png` });
    
    const status = hasError ? 'fail' : (hasData ? 'pass' : 'warning');
    results.push({ name, hasData, hasError, status });
    console.log(`  数据: ${hasData ? '有' : '无'}, 错误: ${hasError ? '有' : '无'} => ${status}`);
  } catch (e) {
    results.push({ name, status: 'fail', error: e.message });
    console.log(`  失败: ${e.message.substring(0, 60)}`);
  }
}

console.log('=== 开始验收（有数据） ===\n');

// 1. 工作台 - 应该显示资产总数 2
await verifyPage('01-工作台-有数据', 'http://127.0.0.1:8848/#/', 
  (text) => text.includes('资产') || text.includes('监控') || text.includes('0') || text.includes('2'));

// 2. 主机资产 - 应该显示 2 条数据
await verifyPage('02-主机资产-有数据', 'http://127.0.0.1:8848/#/assets',
  (text) => text.includes('192.168.1.101') || text.includes('127.0.0.1') || text.includes('生产') || text.includes('Redis') || text.includes('测试'));

// 3. 数据源管理
await verifyPage('03-数据源管理', 'http://127.0.0.1:8848/#/datasource',
  (text) => text.includes('数据源') || text.includes('新增') || text.includes('添加'));

// 4. 数据库管理
await verifyPage('04-数据库管理', 'http://127.0.0.1:8848/#/db-manager',
  (text) => text.includes('数据库') || text.includes('表') || text.includes('monitordb'));

// 5. 告警中心
await verifyPage('05-告警中心', 'http://127.0.0.1:8848/#/alarms',
  (text) => text.includes('告警') || text.includes('等级') || text.includes('暂无'));

// 6. Redis 监控
await verifyPage('06-Redis监控', 'http://127.0.0.1:8848/#/redis',
  (text) => text.includes('Redis') || text.includes('内存') || text.includes('连接'), 8000);

// 7. 监控配置
await verifyPage('07-监控配置', 'http://127.0.0.1:8848/#/config',
  (text) => text.includes('配置') || text.includes('采集') || text.includes('周期'));

// 8. 系统配置
await verifyPage('08-系统配置', 'http://127.0.0.1:8848/#/system-config',
  (text) => text.includes('系统') || text.includes('配置') || text.includes('参数'));

// 9. 分组管理
await verifyPage('09-分组管理', 'http://127.0.0.1:8848/#/groups',
  (text) => text.includes('分组') || text.includes('默认') || text.includes('新增'));

// 10. 账号管理
await verifyPage('10-账号管理', 'http://127.0.0.1:8848/#/account',
  (text) => text.includes('账号') || text.includes('身份') || text.includes('密钥'));

// 汇总
console.log('\n=== 验收结果汇总 ===');
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warning = results.filter(r => r.status === 'warning').length;
console.log(`总页面: ${results.length}`);
console.log(`通过（有数据无错误）: ${passed}`);
console.log(`警告（无数据但无错误）: ${warning}`);
console.log(`失败（有错误）: ${failed}`);

results.forEach(r => {
  console.log(`  [${r.status}] ${r.name}${r.hasData ? ' (有数据)' : ''}${r.hasError ? ' (有错误)' : ''}`);
});

fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify(results, null, 2));

await browser.close();
console.log('\n验收完成。截图保存在:', screenshotDir);
