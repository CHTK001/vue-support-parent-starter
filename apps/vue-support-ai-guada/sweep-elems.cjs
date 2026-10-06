const fs = require('fs');
const r = JSON.parse(fs.readFileSync('./.ui-click-sweep/report.json', 'utf8'));
for (const x of r.routes) {
  if (!/Agents|Skills/.test(x.name)) continue;
  console.log('=== ' + x.name + ' total=' + x.total + ' notes=' + JSON.stringify(x.notes));
  for (const e of x.elements) {
    console.log('  [' + e.state + '] ' + (e.name || '').slice(0, 30) + ' | ' + e.tag + ' | ' + (e.cls || '').slice(0, 50));
  }
}
