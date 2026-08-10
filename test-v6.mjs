import { chromium } from 'playwright';
import fs from 'fs';
const dir = 'G:/work/test-shots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page.goto('http://localhost:7788', { timeout: 20000, waitUntil: 'networkidle' });
    await page.screenshot({ path: dir+'/01-home.png' });
    await page.waitForSelector('.koi-card', { timeout: 15000 });
    await page.screenshot({ path: dir+'/02-form.png' });
    await page.click('text=自定义模式');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: dir+'/03-custom.png' });
    // wait for custom tab inputs to be visible
    await page.waitForSelector('input[placeholder="192.168.1.100"]:not([style*="display: none"])', { timeout: 5000 }).catch(()=>{});
    // select SSH protocol
    const sel = await page.$('.el-select');
    if (sel) { await sel.click(); await page.waitForTimeout(500); const ssh = await page.$('.el-select-dropdown__item:has-text("SSH")'); if (ssh) await ssh.click(); await page.waitForTimeout(300); }
    await page.fill('input[placeholder="192.168.1.100"]', '127.0.0.1');
    await page.fill('input[type="number"]', '2222');
    await page.fill('input[placeholder="admin / root"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.screenshot({ path: dir+'/04-filled.png' });
    const btns = await page.$$('.el-button:has-text("连接")');
    if (btns.length > 1) await btns[1].click(); else await page.click('.el-button:has-text("连接")');
    // 等待 SSH viewer 出现（authenticate 需 ~10s SSH 超时）
    try {
      await page.waitForSelector('.xterm', { timeout: 25000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: dir+'/06-ssh-viewer.png' });
    } catch {
      const alert = await page.$('.el-alert--error');
      if (alert) { await page.screenshot({ path: dir+'/06-error-alert.png' }); } else { await page.screenshot({ path: dir+'/06-no-alert.png' }); }
    }
    await page.click('text=Key 模式');
    await page.screenshot({ path: dir+'/07-keymode.png' });
    const disconnectBtn = await page.$('.el-button:has-text("断开")');
    if (disconnectBtn) { await disconnectBtn.click(); await page.waitForTimeout(1000); await page.screenshot({ path: dir+'/08-disconnect.png' }); }
    await page.click('text=自定义模式');
    await page.waitForTimeout(1500);
    await page.fill('input[placeholder="192.168.1.100"]', 'invalid');
    const btns2 = await page.$$('.el-button:has-text("连接")');
    if (btns2.length > 1) await btns2[1].click(); else await page.click('.el-button:has-text("连接")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: dir+'/09-error-state.png' });
  } catch (e) { console.error('FAIL:', e.message); } finally { await browser.close(); }
})();