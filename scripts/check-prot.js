const fs = require('fs');
const path = require('path');
const p = require('playwright-core');
// check all documented methods on chromium prototype
const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(p.chromium));
console.log('chromium instance methods:', keys.join(', '));
console.log('p.connectOverCdp:', typeof p.connectOverCdp);
console.log('p.connect:', typeof p.connect);
console.log('raw keys on p:', Object.keys(p).join(','));
