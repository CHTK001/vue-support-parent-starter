const fs = require('fs');
const path = require('path');
function walk(d, out = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
for (const f of walk('D:\\ch\\project\\vue-support-parent-starter\\packages', [])) {
  if (f.includes('node_modules')) continue;
  if (!(f.endsWith('.vue') || f.endsWith('.js') || f.endsWith('.ts'))) continue;
  let c;
  try { c = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (/addEventListener\s*\(\s*('mousemove'|"mousemove'|keyboard|layerInstall)/.test(c) ||
      /addEventListener\(new Event/.test(c) ||
      /item\.index|item\.visible|\.dirty|requestAnimationFrame/.test(c)) {
    console.log('===', f);
  }
}
console.log('done');
