import { chromium } from 'playwright';
const dir = 'G:/work/test-shots';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', msg => { if (['error','warning'].includes(msg.type())) console.log('['+msg.type()+']', msg.text().slice(0,200)); });
  page.on('request', req => { 
    if (req.url().includes('authenticate') || req.url().includes('/api/')) 
      console.log('[request]', req.method(), req.url(), req.headers()['content-type']); 
  });
  page.on('response', res => { 
    if (res.url().includes('authenticate') || res.url().includes('/api/')) 
      console.log('[response]', res.status(), res.url());
      if (res.url().includes('authenticate')) {
        res.text().then(t => console.log('[authenticate body]', t.slice(0,200)));
      }
  });
  page.on('pageerror', err => console.log('[pageerror]', err.message.slice(0,300)));
  await page.goto('http://localhost:7788', { timeout: 20000, waitUntil: 'networkidle' });
  await page.waitForSelector('.connection-form', { timeout: 15000 });
  await page.click('text=自定义模式');
  await page.waitForTimeout(1500);
  await page.fill('input[placeholder="192.168.1.100"]', '127.0.0.1');
  await page.fill('input[type="number"]', '2222');
  await page.fill('input[placeholder="admin / root"]', 'testuser');
  await page.fill('input[type="password"]', 'testpass');
  const btns = await page.$$('.el-button:has-text("连接")');
  console.log('[buttons] count:', btns.length);
  if (btns.length > 1) {
    await btns[1].click();
    console.log('[clicked] custom connect button');
  } else {
    await page.click('.el-button:has-text("连接")');
    console.log('[clicked] single connect button');
  }
  await page.waitForTimeout(20000);
  const xterm = await page.$('.xterm');
  const alert = await page.$('.el-alert--error');
  console.log('[xterm]', !!xterm);
  console.log('[alert]', !!alert);
  if (alert) {
    const alertText = await page.$eval('.el-alert--error', el => el.textContent);
    console.log('[alert text]', alertText);
  }
  if (xterm) { await page.screenshot({ path: dir+'/10-ssh-viewer.png' }); }
  else if (alert) { await page.screenshot({ path: dir+'/11-error-alert.png' }); }
  await browser.close();
})();