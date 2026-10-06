const fs = require('fs');
const r = JSON.parse(fs.readFileSync('./.ui-click-sweep/report.json', 'utf8'));
console.log('routes=' + r.routes.length);
for (const x of r.routes) {
  console.log(x.name + ' total=' + x.total + ' elems=' + x.elements.length + ' notes=' + JSON.stringify(x.notes).slice(0, 140));
}
