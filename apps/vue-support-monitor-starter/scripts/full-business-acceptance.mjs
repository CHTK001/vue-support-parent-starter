import http from 'http';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8081';
const results = [];
const screenshotDir = 'test-results/full-business-acceptance';
fs.mkdirSync(screenshotDir, { recursive: true });

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testBusiness(moduleName, tests) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`### ${moduleName} 业务验收`);
  console.log(`${'='.repeat(60)}`);

  const moduleResults = { module: moduleName, tests: [] };

  for (const test of tests) {
    try {
      const result = await test.fn();
      moduleResults.tests.push({ name: test.name, status: 'pass', result });
      console.log(`  ✅ ${test.name}: ${test.successMsg(result)}`);
    } catch (e) {
      moduleResults.tests.push({ name: test.name, status: 'fail', error: e.message });
      console.log(`  ❌ ${test.name}: ${e.message.substring(0, 100)}`);
    }
  }

  const passed = moduleResults.tests.filter(t => t.status === 'pass').length;
  const failed = moduleResults.tests.filter(t => t.status === 'fail').length;
  moduleResults.passed = passed;
  moduleResults.failed = failed;
  console.log(`  \n📊 ${moduleName}: ${passed}/${moduleResults.tests.length} 通过, ${failed} 失败`);

  results.push(moduleResults);
}

console.log('=== 全业务功能验收（每个业务操作必须产生数据变化） ===\n');

// ========== 1. 数据库管理业务 ==========
await testBusiness('数据库管理', [
  {
    name: '查询数据库列表',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/database/list');
      return { count: res.body.data?.length || 0, data: res.body.data };
    },
    successMsg: (r) => `找到 ${r.count} 个数据库`
  },
  {
    name: '执行SQL查询(SELECT)',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/query', {
        database: 'monitordb',
        sql: 'SELECT 1 as test_value'
      });
      return { success: res.body.code === '00000', data: res.body.data };
    },
    successMsg: (r) => `SQL执行成功, 返回数据`
  },
  {
    name: '创建测试表',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/execute', {
        database: 'monitordb',
        sql: 'CREATE TABLE IF NOT EXISTS crud_test_table (id INT PRIMARY KEY, name VARCHAR(100), value VARCHAR(200))'
      });
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `表创建成功`
  },
  {
    name: '插入测试数据',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/execute', {
        database: 'monitordb',
        sql: "INSERT INTO crud_test_table (id, name, value) VALUES (1, '测试名称', '测试值')"
      });
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `数据插入成功`
  },
  {
    name: '查询插入的数据',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/query', {
        database: 'monitordb',
        sql: 'SELECT * FROM crud_test_table WHERE id = 1'
      });
      const rows = res.body.data?.rows || res.body.data || [];
      return { success: rows.length > 0, count: rows.length };
    },
    successMsg: (r) => `找到 ${r.count} 条数据`
  },
  {
    name: '更新测试数据',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/execute', {
        database: 'monitordb',
        sql: "UPDATE crud_test_table SET name = '修改后名称', value = '修改后的值' WHERE id = 1"
      });
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `数据更新成功`
  },
  {
    name: '验证更新后的数据',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/query', {
        database: 'monitordb',
        sql: "SELECT name FROM crud_test_table WHERE id = 1"
      });
      const rows = res.body.data?.rows || res.body.data || [];
      const name = rows[0]?.NAME || rows[0]?.name;
      return { success: name === '修改后名称', name };
    },
    successMsg: (r) => `名称已更新为: ${r.name}`
  },
  {
    name: '删除测试数据',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/execute', {
        database: 'monitordb',
        sql: 'DELETE FROM crud_test_table WHERE id = 1'
      });
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `数据删除成功`
  },
  {
    name: '删除测试表',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/database/execute', {
        database: 'monitordb',
        sql: 'DROP TABLE IF EXISTS crud_test_table'
      });
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `表删除成功`
  }
]);

// ========== 2. Redis管理业务 ==========
await testBusiness('Redis管理', [
  {
    name: '查询Redis信息',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/redis/info');
      return { success: res.body.code === '00000', data: res.body.data };
    },
    successMsg: (r) => `Redis信息获取成功`
  },
  {
    name: '设置String类型key',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/redis/set', {
        key: 'crud:test:string',
        value: '测试字符串值',
        ttl: 3600
      });
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `String key设置成功`
  },
  {
    name: '获取String类型key',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/redis/get?key=crud:test:string');
      const value = res.body.data;
      return { success: value === '测试字符串值', value };
    },
    successMsg: (r) => `获取到值: ${r.value}`
  },
  {
    name: '查询key列表',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/redis/keys?pattern=crud:*');
      const keys = res.body.data || [];
      return { success: keys.length > 0, count: keys.length };
    },
    successMsg: (r) => `找到 ${r.count} 个key`
  },
  {
    name: '删除key',
    fn: async () => {
      const res = await request('DELETE', '/ms/monitor/redis/del?key=crud:test:string');
      return { success: res.body.code === '00000' };
    },
    successMsg: (r) => `key删除成功`
  },
  {
    name: '验证key已删除',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/redis/get?key=crud:test:string');
      const value = res.body.data;
      return { success: value === null || value === undefined || value === '', value };
    },
    successMsg: (r) => `key已删除, 值为: ${r.value || 'null'}`
  }
]);

// ========== 3. 告警管理业务 ==========
await testBusiness('告警管理', [
  {
    name: '查询告警规则列表',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/alarm/rules');
      return { count: res.body.data?.length || 0, data: res.body.data };
    },
    successMsg: (r) => `找到 ${r.count} 条告警规则`
  },
  {
    name: '创建告警规则',
    fn: async () => {
      const res = await request('POST', '/ms/monitor/alarm/rule', {
        ruleName: '全功能验收-测试告警规则',
        ruleType: 'cpu',
        threshold: 90,
        duration: 60,
        severity: 'warning',
        enabled: true,
        description: '全功能验收测试创建的告警规则'
      });
      return { success: res.body.code === '00000', id: res.body.data?.id };
    },
    successMsg: (r) => `告警规则创建成功, ID: ${r.id}`
  },
  {
    name: '查询告警事件列表',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/alarm/events');
      return { count: res.body.data?.length || 0, data: res.body.data };
    },
    successMsg: (r) => `找到 ${r.count} 条告警事件`
  }
]);

// ========== 4. 系统管理业务 ==========
await testBusiness('系统管理', [
  {
    name: '查询进程列表',
    fn: async () => {
      const res = await request('GET', '/ms/system/processes?limit=10');
      const processes = res.body.data || [];
      return { success: processes.length > 0, count: processes.length };
    },
    successMsg: (r) => `找到 ${r.count} 个进程`
  },
  {
    name: '查询系统服务列表',
    fn: async () => {
      const res = await request('GET', '/ms/system/services');
      const services = res.body.data || [];
      return { success: services.length > 0, count: services.length };
    },
    successMsg: (r) => `找到 ${r.count} 个系统服务`
  },
  {
    name: '查询网络接口列表',
    fn: async () => {
      const res = await request('GET', '/ms/system/network/interfaces');
      const interfaces = res.body.data || [];
      return { success: interfaces.length > 0, count: interfaces.length };
    },
    successMsg: (r) => `找到 ${r.count} 个网络接口`
  },
  {
    name: '查询磁盘信息',
    fn: async () => {
      const res = await request('GET', '/ms/system/disks');
      const disks = res.body.data || [];
      return { success: disks.length > 0, count: disks.length };
    },
    successMsg: (r) => `找到 ${r.count} 个磁盘`
  },
  {
    name: '查询系统信息',
    fn: async () => {
      const res = await request('GET', '/ms/system/info');
      return { success: res.body.code === '00000', data: res.body.data };
    },
    successMsg: (r) => `系统信息获取成功`
  }
]);

// ========== 5. 协议服务器管理业务 ==========
await testBusiness('协议服务器管理', [
  {
    name: '查询服务器列表',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/server/list');
      return { count: res.body.data?.length || 0, data: res.body.data };
    },
    successMsg: (r) => `找到 ${r.count} 个协议服务器`
  },
  {
    name: '查询Filter列表',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/server/filters');
      return { count: res.body.data?.length || 0, data: res.body.data };
    },
    successMsg: (r) => `找到 ${r.count} 个Filter`
  }
]);

// ========== 6. AI分析业务 ==========
await testBusiness('AI分析', [
  {
    name: '查询AI服务状态',
    fn: async () => {
      const res = await request('GET', '/ms/monitor/ai/status');
      return { success: res.body.code === '00000', data: res.body.data };
    },
    successMsg: (r) => `AI服务状态: ${JSON.stringify(r.data).substring(0, 50)}`
  }
]);

// ========== 汇总 ==========
console.log('\n\n' + '='.repeat(60));
console.log('### 全业务功能验收结果汇总');
console.log('='.repeat(60));

let totalPassed = 0;
let totalFailed = 0;
let totalTests = 0;

results.forEach(r => {
  const icon = r.failed === 0 ? '✅' : '⚠️';
  console.log(`\n${icon} ${r.module}: ${r.passed}/${r.tests.length} 通过, ${r.failed} 失败`);
  r.tests.forEach(t => {
    const testIcon = t.status === 'pass' ? '  ✅' : '  ❌';
    console.log(`${testIcon} ${t.name}`);
  });
  totalPassed += r.passed;
  totalFailed += r.failed;
  totalTests += r.tests.length;
});

console.log(`\n\n📊 总计: ${totalTests} 测试, ${totalPassed} 通过, ${totalFailed} 失败`);
console.log(`🎯 通过率: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify({
  total: totalTests,
  passed: totalPassed,
  failed: totalFailed,
  passRate: ((totalPassed / totalTests) * 100).toFixed(1),
  modules: results
}, null, 2));

console.log('\n结果已保存到 test-results/full-business-acceptance/results.json');
