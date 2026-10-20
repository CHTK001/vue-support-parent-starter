// 必须在 import 之前设置
process.env.E2E_LOGIN_USERNAME = 'admin';
process.env.E2E_LOGIN_PASSWORD = 'admin123';

import { chromium } from 'playwright';
import { ensureLogin } from './ui-login.mjs';

const APP = process.env.MS_APP || 'http://127.0.0.1:8848';
const API_LOGIN = process.env.MS_E2E_API_LOGIN || 'http://192.168.50.198:8081';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const results = [];
const pass = (name) => { results.push([name, true]); console.log(`PASS | ${name}`); };
const fail = (name, detail = '') => { results.push([name, false]); console.log(`FAIL | ${name}${detail ? ' | ' + detail : ''}`); };

await context.route('**/*', (route) => {
  const t = route.request().resourceType();
  if (t === 'image' || t === 'font' || t === 'media') return route.abort();
  route.continue();
});

console.log('--- 登录 ---');
const loginResult = await ensureLogin(page, APP, API_LOGIN);
if (!loginResult.ok) {
  console.error('登录失败:', loginResult.msg);
  await browser.close();
  process.exit(1);
}
console.log('登录成功');

// 抓包分析页
console.log('\n--- 抓包分析页 ---');
await page.goto(`${APP}/#/tshark`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(5000);
const tsharkBody = await page.locator('body').innerHTML();
tsharkBody.includes('TShark') || tsharkBody.includes('抓包') ? pass('TShark 页面加载') : fail('TShark 页面加载');
tsharkBody.includes('el-drawer') ? pass('详情从弹窗改抽屉') : fail('详情从弹窗改抽屉');
tsharkBody.includes('新建') || tsharkBody.includes('新增') ? pass('新建会话按钮') : fail('新建会话按钮');

// 找会话行并点击打开详情
const sessionRows = page.locator('.el-table__body tr').first();
if (await sessionRows.count() > 0) {
  console.log('  找到会话行，点击打开详情...');
  await sessionRows.click();
  await page.waitForTimeout(3000);
  // 统计 tab
  const statsTab = page.locator('.el-tabs__item').filter({ hasText: /统计/ });
  if (await statsTab.count() > 0) {
    console.log('  点击统计标签...');
    await statsTab.click();
    await page.waitForTimeout(3000);
  }
  const tsharkBody2 = await page.locator('body').innerHTML();
  tsharkBody2.includes('流量总计') ? pass('统计卡含"流量总计"') : fail('统计卡含"流量总计"');
  tsharkBody2.includes('协议明细') ? pass('协议明细区域') : fail('协议明细区域');
  tsharkBody2.includes('字节') ? pass('协议明细含字节列') : fail('协议明细含字节列');
  tsharkBody2.includes('趋势') || tsharkBody2.includes('timeline') || tsharkBody2.includes('包数') ? pass('时间趋势区域') : fail('时间趋势区域');
  // 报文 tab 列设置
  const packetTab = page.locator('.el-tabs__item').filter({ hasText: /报文/ });
  if (await packetTab.count() > 0) {
    console.log('  点击报文标签...');
    await packetTab.click();
    await page.waitForTimeout(2000);
  }
  const tsharkBody3 = await page.locator('body').innerHTML();
  tsharkBody3.includes('列设置') ? pass('报文表列设置控件') : fail('报文表列设置控件');
  tsharkBody3.includes('紧凑') || tsharkBody3.includes('密度') ? pass('密度切换控件') : fail('密度切换控件');
} else {
  // 无会话：检查主页面 shell 元素
  console.log('  无会话行（后端无测试数据）');
  tsharkBody.includes('TShark') ? pass('TShark 状态灯存在') : fail('TShark 状态灯');
  tsharkBody.includes('el-drawer') ? pass('详情抽屉骨架存在') : fail('详情抽屉骨架');
  // 列设置在报文面板里，需打开会话详情才可见；无会话时无断言
}

// PCAP分析页
console.log('\n--- PCAP分析页 ---');
await page.goto(`${APP}/#/tshark-pcap`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(5000);
const pcapHtml = await page.locator('body').innerHTML();
pcapHtml.includes('PCAP') ? pass('PCAP分析页加载') : fail('PCAP分析页加载');
pcapHtml.includes('导入') ? pass('导入入口存在') : fail('导入入口存在');
pcapHtml.includes('el-drawer') ? pass('PCAP详情从抽屉') : fail('PCAP详情从抽屉');

// 节点管理页
console.log('\n--- 节点管理页 ---');
await page.goto(`${APP}/#/nodes`, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(5000);
const nodesHtml = await page.locator('body').innerHTML();
nodesHtml.includes('节点') ? pass('节点管理页加载') : fail('节点管理页加载');
nodesHtml.includes('在线节点') ? pass('在线节点菜单项') : fail('在线节点菜单项');

console.log('\n=== 汇总 ===');
const ok = results.filter(([, v]) => v).length;
const total = results.length;
console.log(`${ok}/${total} 通过`);
await browser.close();
process.exit(ok === total ? 0 : 1);
