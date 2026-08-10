import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  p.on('console', msg => console.log(msg.type(), msg.text().slice(0, 200)));
  await p.goto('http://localhost:7788', { timeout: 20000, waitUntil: 'networkidle' });
  await p.waitForSelector('.connection-form', { timeout: 15000 });
  await p.waitForTimeout(2000);
  // check if virtual:uno.css was loaded
  const hasUno = await p.evaluate(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    return Array.from(links).map(l => l.href);
  });
  console.log('CSS links:', hasUno);
  const styles = await p.evaluate(() => {
    return Array.from(document.styleSheets).map(s => {
      try { return { href: s.href, rules: s.cssRules.length }; } catch(e) { return { href: s.href, error: e.message }; }
    });
  });
  console.log('Style sheets:', JSON.stringify(styles, null, 2));
  await b.close();
})();