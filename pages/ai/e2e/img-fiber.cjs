const { chromium } = require('playwright');
const BROWSER = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: BROWSER });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/settings/image-recognition', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(8000);

  // Use React fiber to inspect the CapabilityConfigForm state
  const fiberInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root || !root._reactRootContainer) return { error: 'no fiber root' };
    // Walk the fiber tree to find CapabilityConfigForm
    function findComponent(fiber, name, depth = 0) {
      if (!fiber || depth > 60) return null;
      if (fiber.type && typeof fiber.type === 'function' && fiber.type.name === name) return fiber;
      let result = null;
      const child = fiber.child;
      let cur = child;
      while (cur && !result) {
        result = findComponent(cur, name, depth + 1);
        cur = cur.sibling;
      }
      return result;
    }
    const props = root._reactRootContainer._internalRoot?.current;
    const formFiber = findComponent(props, 'CapabilityConfigForm');
    if (!formFiber) return { error: 'CapabilityConfigForm not found' };
    const memo = formFiber.memoizedState;
    // memoizedState is a linked list of hooks
    const states = [];
    let h = memo;
    while (h) {
      states.push({ type: typeof h.memoizedState, sample: JSON.stringify(h.memoizedState)?.substring(0, 150) });
      h = h.next;
    }
    return {
      modelCapabilitiesProp: formFiber.memoizedProps.modelCapabilities,
      hookStates: states,
    };
  });
  console.log('Fiber info:', JSON.stringify(fiberInfo, null, 2));
  await browser.close();
})();