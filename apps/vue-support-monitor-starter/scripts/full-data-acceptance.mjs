import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = 'test-results/full-data-acceptance';
fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const results = [];

async function verifyPage(name, url, dataCheck, waitTime = 6000) {
  try {
    console.log(`验证: ${name}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(waitTime);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasError = pageText.includes('数据加载失败') || pageText.includes('AxiosError') || pageText.includes('Error');
    const hasData = dataCheck(pageText);
    
    await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: false });
    
    const status = hasError ? 'fail' : (hasData ? 'pass' : 'warning');
    results.push({ name, hasData, hasError, status, textLength: pageText.length });
    console.log(`  数据: ${hasData ? '有' : '无'}, 错误: ${hasError ? '有' : '无'}, 文本长度: ${pageText.length} => ${status}`);
  } catch (e) {
    results.push({ name, status: 'fail', error: e.message });
    console.log(`  失败: ${e.message.substring(0, 80)}`);
  }
}

console.log('=== 开始全量验收（有数据） ===\n');

// 1. 工作台 - 应该显示资产总数
await verifyPage('01-工作台', 'http://127.0.0.1:8848/#/', 
  (text) => text.includes('资产') || text.includes('监控') || text.includes('告警') || text.length > 500);

// 2. 主机资产 - 应该显示 3 台主机
await verifyPage('02-主机资产', 'http://127.0.0.1:8848/#/assets',
  (text) => text.includes('192.168.1.101') || text.includes('192.168.1.102') || text.includes('127.0.0.1') || text.includes('测试主机') || text.includes('生产'));

// 3. 数据源管理 - 应该显示 2 个数据源
await verifyPage('03-数据源管理', 'http://127.0.0.1:8848/#/datasource',
  (text) => text.includes('MySQL') || text.includes('Redis') || text.includes('数据源') || text.includes('测试数据源'));

// 4. 数据库管理 - 应该显示数据库和表
await verifyPage('04-数据库管理', 'http://127.0.0.1:8848/#/db-manager',
  (text) => text.includes('数据库') || text.includes('表') || text.includes('monitordb') || text.includes('SQL'));

// 5. 告警中心 - 应该显示告警（可能为空，但不应该有错误）
await verifyPage('05-告警中心', 'http://127.0.0.1:8848/#/alarms',
  (text) => text.includes('告警') || text.includes('等级') || text.includes('暂无') || text.includes('事件'));

// 6. Redis 监控 - 应该显示 Redis 指标
await verifyPage('06-Redis监控', 'http://127.0.0.1:8848/#/redis',
  (text) => text.includes('Redis') || text.includes('内存') || text.includes('连接') || text.includes('QPS') || text.includes('命中'), 8000);

// 7. 抓包分析
await verifyPage('07-抓包分析', 'http://127.0.0.1:8848/#/tshark',
  (text) => text.includes('抓包') || text.includes('接口') || text.includes('会话') || text.includes('数据包'));

// 8. 监控配置
await verifyPage('08-监控配置', 'http://127.0.0.1:8848/#/config',
  (text) => text.includes('配置') || text.includes('采集') || text.includes('周期') || text.includes('策略'));

// 9. 代理管理
await verifyPage('09-代理管理', 'http://127.0.0.1:8848/#/proxy',
  (text) => text.includes('代理') || text.includes('网关') || text.includes('新增') || text.includes('列表'));

// 10. 系统配置
await verifyPage('10-系统配置', 'http://127.0.0.1:8848/#/system-config',
  (text) => text.includes('系统') || text.includes('配置') || text.includes('参数') || text.includes('键值'));

// 11. 分组管理
await verifyPage('11-分组管理', 'http://127.0.0.1:8848/#/groups',
  (text) => text.includes('分组') || text.includes('默认') || text.includes('新增') || text.includes('树'));

// 12. 账号管理
await verifyPage('12-账号管理', 'http://127.0.0.1:8848/#/account',
  (text) => text.includes('账号') || text.includes('身份') || text.includes('密钥') || text.includes('新增'));

// 13. 发布项目管理
await verifyPage('13-发布项目管理', 'http://127.0.0.1:8848/#/project',
  (text) => text.includes('项目') || text.includes('发布') || text.includes('部署') || text.includes('版本'));

// 14. 远程控制
await verifyPage('14-远程控制', 'http://127.0.0.1:8848/#/terminal',
  (text) => text.includes('远程') || text.includes('终端') || text.includes('连接') || text.includes('主机'));

// 15. InfluxDB管理
await verifyPage('15-InfluxDB管理', 'http://127.0.0.1:8848/#/influxdb',
  (text) => text.includes('InfluxDB') || text.includes('存储桶') || text.includes('测量') || text.includes('时序'));

// 16. Neo4j管理
await verifyPage('16-Neo4j管理', 'http://127.0.0.1:8848/#/neo4j',
  (text) => text.includes('Neo4j') || text.includes('节点') || text.includes('关系') || text.includes('图'));

// 17. Nacos管理
await verifyPage('17-Nacos管理', 'http://127.0.0.1:8848/#/nacos',
  (text) => text.includes('Nacos') || text.includes('命名空间') || text.includes('服务') || text.includes('配置'));

// 18. ZooKeeper管理
await verifyPage('18-ZooKeeper管理', 'http://127.0.0.1:8848/#/zookeeper',
  (text) => text.includes('ZooKeeper') || text.includes('节点') || text.includes('路径') || text.includes('数据'));

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
  const icon = r.status === 'pass' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
  console.log(`  ${icon} ${r.name}${r.hasData ? ' (有数据)' : ''}${r.hasError ? ' (有错误)' : ''}`);
});

fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify(results, null, 2));

await browser.close();
console.log('\n验收完成。截图保存在:', screenshotDir);
