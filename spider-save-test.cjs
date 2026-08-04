// 测试创建爬虫定义
const http = require('http');

const data = JSON.stringify({
  spiderCode: 'test_cn_1',
  spiderName: '测试爬虫',
  spiderEntryUrl: 'http://example.com',
  spiderMaxDepth: 2,
  spiderMaxPages: 3,
  spiderStatus: 1,
});

const options = {
  hostname: 'localhost',
  port: 19091,
  path: '/spider-api/spider/definitions/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});

req.on('error', (e) => console.error('Err:', e));
req.write(data);
req.end();
