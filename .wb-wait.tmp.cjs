const http = require('http');
function probe(retries) {
  http.get('http://127.0.0.1:8096/system/', (res) => {
    console.log('READY status=' + res.statusCode);
    process.exit(0);
  }).on('error', () => {
    if (retries > 0) { setTimeout(() => probe(retries - 1), 5000); }
    else { console.log('NOT READY'); process.exit(1); }
  });
}
probe(30);
