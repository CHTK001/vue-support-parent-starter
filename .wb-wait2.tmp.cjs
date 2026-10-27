const http = require('http');
function probe(n) {
  http.get('http://127.0.0.1:8096/system/#/login', (res) => { console.log('READY ' + res.statusCode); process.exit(0); })
    .on('error', () => { if (n > 0) setTimeout(() => probe(n - 1), 5000); else { console.log('TIMEOUT'); process.exit(1); } });
}
probe(24);
