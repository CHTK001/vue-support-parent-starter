// 按采集顺序打印指定路由的元素状态，定位「点不动」的连锁起点。
const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', '..', '.ui-click-sweep', 'report.json');
const rep = JSON.parse(fs.readFileSync(base, 'utf8'));
const want = process.argv[2] || 'Chat';
const R = (rep.routes || rep.results || []).find((r) => r.route === want || r.name === want);
if (!R) { console.log('route not found:', want, rep.results.map((r) => r.route).join(',')); process.exit(1); }
console.log('route=', R.route, 'total=', R.total, 'failed=', R.failed, 'elements=', R.elements.length);
for (const e of R.elements) {
  const mark = ['click-error', 'not-clickable'].includes(e.state) ? '  <<<< ' : '      ';
  console.log(
    mark + e.id + ' ' + String(e.state).padEnd(16)
    + (e.extra ? 'extra ' : '      ') + (e.inChrome ? 'chrome ' : '      ')
    + (e.name || '').slice(0, 40).replace(/\s+/g, ' ')
    + (e.err ? '   ERR:' + String(e.err).slice(0, 100) : ''),
  );
}
