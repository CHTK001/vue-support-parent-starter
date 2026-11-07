const fs = require('fs');
const path = require('path');
for (const p of ['D:\\ch\\project\\vue-support-parent-starter\\node_modules\\playwright-core', 'D:\\ch\\project\\node_modules\\playwright-core', 'D:\\ch\\project\\node_modules\\playwright']) {
  console.log(p, fs.existsSync(p) ? 'EXISTS' : 'MISSING', '->', fs.existsSync(path.join(p, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8')).version : '-');
}
