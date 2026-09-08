const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Try to access React fiber via various mechanisms
  const fiber = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return { error: 'no root' };
    // React 19 attaches __reactContainer$ keys to DOM nodes
    const keys = Object.keys(root).filter(k => k.startsWith('__reactContainer'));
    if (keys.length === 0) {
      // Try on first child
      const first = root.firstElementChild;
      const childKeys = first ? Object.keys(first).filter(k => k.includes('react') || k.includes('Props') || k.includes('Fiber')) : [];
      return { error: 'no container', childKeys };
    }
    const container = root[keys[0]];
    // Walk to find the CapabilityConfigForm
    let result = null;
    function walk(fiber, depth) {
      if (!fiber || depth > 80 || result) return;
      if (fiber.memoizedProps && fiber.memoizedProps.endpoint) {
        result = {
          endpoint: fiber.memoizedProps.endpoint,
          modelCapabilities: fiber.memoizedProps.modelCapabilities,
          // hooks: fiber.memoizedState
        };
        // collect hook states
        const hooks = [];
        let h = fiber.memoizedState;
        while (h) {
          try {
            hooks.push(JSON.stringify(h.memoizedState)?.substring(0, 100));
          } catch { hooks.push('[circular]'); }
          h = h.next;
        }
        result.hooks = hooks;
        return;
      }
      let child = fiber.child;
      while (child) {
        walk(child, depth + 1);
        child = child.sibling;
      }
    }
    walk(container, 0);
    return result || { error: 'CapabilityConfigForm not found' };
  });
  console.log('Fiber:', JSON.stringify(fiber, null, 2));
  await browser.close();
})();