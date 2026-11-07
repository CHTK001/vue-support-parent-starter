const fs = require('fs');
const path = require('path');

function walk(d, out = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// 1. 找 ReDialog 到底是哪个包
const dirs = walk('D:\\ch\\project\\vue-support-parent-starter\\packages');
for (const d of dirs) {
  if (d.includes('node_modules')) continue;
  const pkg = path.join(d, 'package.json');
  if (!fs.existsSync(pkg)) continue;
  let c;
  try { c = fs.readFileSync(pkg, 'utf8'); } catch (e) { continue; }
  if (c.includes('ui')) console.log('[pkg]', d, require('fs').readFileSync(pkg, 'utf8').split('\n')[0]);
}

// 2. 找所有 ReDialog*.vue / dialog 组件
for (const f of walk('D:\\ch\\project\\vue-support-parent-starter\\packages', [])) {
  if (!/dialog/i.test(f)) continue;
  if (!(f.endsWith('.vue') || f.endsWith('.js') || f.endsWith('.ts'))) continue;
  if (f.includes('node_modules')) continue;
  console.log('[file]', f);
}
