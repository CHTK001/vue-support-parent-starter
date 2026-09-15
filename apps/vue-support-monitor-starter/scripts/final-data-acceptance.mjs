import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = 'test-results/final-data-acceptance';
fs.mkdirSync(screenshotDir, { recursive: true });

// 通过 API 创建测试数据
async function createTestData() {
  console.log('=== 通过 API 创建测试数据 ===');
  
  // 1. 创建主机资产
  try {
    const response = await fetch('http://127.0.0.1:8081/ms/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '测试主机-生产服务器01',
        address: '192.168.1.101',
        port: 22,
        protocol: 'SSH',
        osType: 'Linux',
        description: '生产环境应用服务器',
        cpuCores: 8,
        memoryMb: 16384,
        diskGb: 500,
        status: 1,
        online: 1
      })
    });
    const data = await response.json();
    console.log('创建主机资产1:', data.code === '00000' ? '成功' : '失败', data.msg || '');
  } catch (e) {
    console.log('创建主机资产1失败:', e.message);
  }

  // 2. 创建第二个主机资产
  try {
    const response = await fetch('http://127.0.0.1:8081/ms/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '测试主机-数据库服务器02',
        address: '192.168.1.102',
        port: 3306,
        protocol: 'JDBC',
        osType: 'Linux',
        description: '生产环境 MySQL 数据库服务器',
        cpuCores: 16,
        memoryMb: 32768,
        diskGb: 2000,
        status: 1,
        online: 1
      })
    });
    const data = await response.json();
    console.log('创建主机资产2:', data.code === '00000' ? '成功' : '失败', data.msg || '');
  } catch (e) {
    console.log('创建主机资产2失败:', e.message);
  }

  // 3. 创建数据源
  try {
    const response = await fetch('http://127.0.0.1:8081/ms/monitor/datasource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '测试数据源-MySQL主库',
        type: 'jdbc',
        driver: 'com.mysql.cj.jdbc.Driver',
        url: 'jdbc:mysql://192.168.1.102:3306/monitor?useSSL=false',
        username: 'root',
        password: '123456',
        remark: '生产环境 MySQL 主数据源'
      })
    });
    const data = await response.json();
    console.log('创建数据源:', data.code === '00000' ? '成功' : '失败', data.msg || '');
  } catch (e) {
    console.log('创建数据源失败:', e.message);
  }

  // 4. 创建 Redis 数据源
  try {
    const response = await fetch('http://127.0.0.1:8081/ms/monitor/datasource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '测试数据源-Redis缓存',
        type: 'redis',
        host: '127.0.0.1',
        port: 6379,
        password: '',
        database: 0,
        remark: '本地 Redis 缓存数据源'
      })
    });
    const data = await response.json();
    console.log('创建Redis数据源:', data.code === '00000' ? '成功' : '失败', data.msg || '');
  } catch (e) {
    console.log('创建Redis数据源失败:', e.message);
  }

  console.log('测试数据创建完成\n');
}

await createTestData();

// 启动浏览器验证
const browser = await chromium.launch({
  executablePath: 'C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe',
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const results = [];

async function verifyPage(name, url, waitTime = 5000) {
  try {
    console.log(`验证: ${name}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(waitTime);
    
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasData = pageText.length > 100;
    const hasError = pageText.includes('数据加载失败') || pageText.includes('AxiosError');
    
    await page.screenshot({ path: `${screenshotDir}/${name}.png` });
    
    results.push({ name, hasData, hasError, status: hasError ? 'fail' : 'pass' });
    console.log(`  数据: ${hasData ? '有' : '无'}, 错误: ${hasError ? '有' : '无'}`);
  } catch (e) {
    results.push({ name, status: 'fail', error: e.message });
    console.log(`  失败: ${e.message.substring(0, 80)}`);
  }
}

console.log('=== 验证页面数据显示 ===\n');
await verifyPage('01-工作台-监控概览', 'http://127.0.0.1:8848/#/');
await verifyPage('02-主机资产列表', 'http://127.0.0.1:8848/#/assets');
await verifyPage('03-数据源管理', 'http://127.0.0.1:8848/#/datasource');
await verifyPage('04-数据库管理', 'http://127.0.0.1:8848/#/db-manager');
await verifyPage('05-告警中心', 'http://127.0.0.1:8848/#/alarms');
await verifyPage('06-Redis监控', 'http://127.0.0.1:8848/#/redis', 8000);
await verifyPage('07-监控配置', 'http://127.0.0.1:8848/#/config');
await verifyPage('08-系统配置', 'http://127.0.0.1:8848/#/system-config');
await verifyPage('09-分组管理', 'http://127.0.0.1:8848/#/groups');
await verifyPage('10-账号管理', 'http://127.0.0.1:8848/#/account');

// 汇总
console.log('\n=== 验收结果汇总 ===');
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
console.log(`总页面: ${results.length}`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);

fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify(results, null, 2));

await browser.close();
console.log('\n完成。截图保存在:', screenshotDir);
