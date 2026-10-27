const http = require('http');
http.get('http://127.0.0.1:8096/system/', (res) => { console.log('dev up, status=' + res.statusCode); process.exit(0); }).on('error', () => { console.log('dev down'); process.exit(1); });
