const p = require('./node_modules/playwright-core');
console.log('exports:', Object.keys(p));
console.log('chromium:', typeof p.chromium);
if (p.chromium) console.log('chromium methods:', Object.keys(p.chromium));
console.log('connectOverCdp via main:', typeof p.connectOverCdp);
