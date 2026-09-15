import http from 'http';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8081';
const results = [];
const screenshotDir = 'test-results/full-crud-acceptance';
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

async function crudTest(moduleName, config) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`### ${moduleName} CRUD 验收`);
  console.log(`${'='.repeat(60)}`);

  const moduleResults = { module: moduleName, steps: [] };

  // 1. 查询初始数据
  try {
    const res = await request('GET', config.listPath);
    const initialCount = config.getCount(res.body);
    moduleResults.steps.push({ step: '查询初始列表', status: 'pass', count: initialCount });
    console.log(`  ✅ 查询初始列表: ${initialCount} 条`);
  } catch (e) {
    moduleResults.steps.push({ step: '查询初始列表', status: 'fail', error: e.message });
    console.log(`  ❌ 查询初始列表失败: ${e.message.substring(0, 80)}`);
    results.push(moduleResults);
    return;
  }

  // 2. 新增数据
  let newId = null;
  try {
    const res = await request('POST', config.createPath, config.createData);
    const code = res.body.code || res.body.status;
    moduleResults.steps.push({ step: '新增数据', status: 'pass', code });
    console.log(`  ✅ 新增数据: 响应码=${code}`);
  } catch (e) {
    moduleResults.steps.push({ step: '新增数据', status: 'fail', error: e.message });
    console.log(`  ❌ 新增数据失败: ${e.message.substring(0, 80)}`);
    results.push(moduleResults);
    return;
  }

  // 3. 验证新增成功
  try {
    const res = await request('GET', config.listPath);
    const afterAddCount = config.getCount(res.body);
    const found = config.findItem(res.body, config.createData);
    newId = config.getId(found);
    const addSuccess = afterAddCount > moduleResults.steps[0].count && found;
    moduleResults.steps.push({ step: '验证新增成功', status: addSuccess ? 'pass' : 'fail', count: afterAddCount, found: !!found, id: newId });
    console.log(`  ${addSuccess ? '✅' : '❌'} 验证新增成功: 数量=${afterAddCount}, 找到=${found ? '是' : '否'}, ID=${newId}`);
    if (!addSuccess) throw new Error('新增验证失败');
  } catch (e) {
    moduleResults.steps.push({ step: '验证新增成功', status: 'fail', error: e.message });
    console.log(`  ❌ 验证新增成功失败: ${e.message.substring(0, 80)}`);
  }

  // 4. 编辑数据
  if (newId && config.updatePath) {
    try {
      const updatePath = config.updatePath.replace('{id}', newId);
      const res = await request('PUT', updatePath, config.updateData(newId));
      const code = res.body.code || res.body.status;
      moduleResults.steps.push({ step: '编辑数据', status: 'pass', code });
      console.log(`  ✅ 编辑数据: 响应码=${code}`);
    } catch (e) {
      moduleResults.steps.push({ step: '编辑数据', status: 'fail', error: e.message });
      console.log(`  ❌ 编辑数据失败: ${e.message.substring(0, 80)}`);
    }
  }

  // 5. 验证编辑成功
  if (newId && config.updatePath) {
    try {
      const res = await request('GET', config.listPath);
      const found = config.findItem(res.body, config.updateData(newId));
      moduleResults.steps.push({ step: '验证编辑成功', status: found ? 'pass' : 'fail', found: !!found });
      console.log(`  ${found ? '✅' : '❌'} 验证编辑成功: 找到=${found ? '是' : '否'}`);
    } catch (e) {
      moduleResults.steps.push({ step: '验证编辑成功', status: 'fail', error: e.message });
      console.log(`  ❌ 验证编辑成功失败: ${e.message.substring(0, 80)}`);
    }
  }

  // 6. 删除数据
  if (newId && config.deletePath) {
    try {
      const deletePath = config.deletePath.replace('{id}', newId);
      const res = await request('DELETE', deletePath);
      const code = res.body.code || res.body.status;
      moduleResults.steps.push({ step: '删除数据', status: 'pass', code });
      console.log(`  ✅ 删除数据: 响应码=${code}`);
    } catch (e) {
      moduleResults.steps.push({ step: '删除数据', status: 'fail', error: e.message });
      console.log(`  ❌ 删除数据失败: ${e.message.substring(0, 80)}`);
    }
  }

  // 7. 验证删除成功
  if (newId && config.deletePath) {
    try {
      const res = await request('GET', config.listPath);
      const afterDeleteCount = config.getCount(res.body);
      const found = config.findItem(res.body, config.createData);
      const deleteSuccess = !found;
      moduleResults.steps.push({ step: '验证删除成功', status: deleteSuccess ? 'pass' : 'fail', count: afterDeleteCount, found: !!found });
      console.log(`  ${deleteSuccess ? '✅' : '❌'} 验证删除成功: 数量=${afterDeleteCount}, 找到=${found ? '是（未删除）' : '否（已删除）'}`);
    } catch (e) {
      moduleResults.steps.push({ step: '验证删除成功', status: 'fail', error: e.message });
      console.log(`  ❌ 验证删除成功失败: ${e.message.substring(0, 80)}`);
    }
  }

  const passed = moduleResults.steps.filter(s => s.status === 'pass').length;
  const failed = moduleResults.steps.filter(s => s.status === 'fail').length;
  moduleResults.passed = passed;
  moduleResults.failed = failed;
  console.log(`  \n📊 ${moduleName}: ${passed}/${moduleResults.steps.length} 通过, ${failed} 失败`);

  results.push(moduleResults);
}

console.log('=== 全功能 CRUD 操作验收（每个操作必须产生数据变化） ===\n');

// ========== 1. 主机资产 CRUD ==========
await crudTest('主机资产', {
  listPath: '/ms/server/host',
  createPath: '/ms/server/host',
  updatePath: '/ms/server/host/{id}',
  deletePath: '/ms/server/host/{id}',
  createData: {
    serverHostName: '全功能验收-主机001',
    serverHostAddress: '10.0.1.100',
    serverHostPort: 22,
    serverHostOsType: 'Linux',
    serverHostStatus: 1,
    serverHostOnline: 1,
    serverHostDescription: '全功能验收测试主机',
    serverHostCpuCores: 4,
    serverHostMemoryMb: 8192,
    serverHostDiskGb: 200,
    serverHostCollectEnabled: 1,
    serverHostAgentEnabled: 1,
    serverHostRemoteEnabled: 1
  },
  updateData: (id) => ({
    id,
    serverHostName: '全功能验收-主机已修改001',
    serverHostAddress: '10.0.1.100',
    serverHostPort: 22,
    serverHostDescription: '全功能验收测试修改后的主机'
  }),
  getCount: (body) => body.data?.length || 0,
  findItem: (body, data) => body.data?.find(h => h.serverHostName === data.serverHostName),
  getId: (item) => item?.id
});

// ========== 2. 数据源管理 CRUD ==========
await crudTest('数据源管理', {
  listPath: '/ms/monitor/datasource/list',
  createPath: '/ms/monitor/datasource',
  updatePath: '/ms/monitor/datasource/{id}',
  deletePath: '/ms/monitor/datasource/{id}',
  createData: {
    name: '全功能验收-数据源001',
    type: 'redis',
    host: '127.0.0.1',
    port: 6379,
    password: '',
    database: 0,
    remark: '全功能验收测试数据源'
  },
  updateData: (id) => ({
    id,
    name: '全功能验收-数据源已修改001',
    type: 'redis',
    host: '127.0.0.1',
    port: 6380,
    remark: '全功能验收测试修改后的数据源'
  }),
  getCount: (body) => body.data?.length || 0,
  findItem: (body, data) => body.data?.find(d => d.name === data.name),
  getId: (item) => item?.id
});

// ========== 3. 监控配置 CRUD ==========
await crudTest('监控配置', {
  listPath: '/ms/monitor/config',
  createPath: '/ms/monitor/config',
  updatePath: '/ms/monitor/config',
  deletePath: '/ms/monitor/config/{key}',
  createData: {
    configKey: 'full.crud.test.key',
    configValue: 'initial123',
    configDesc: '全功能验收测试配置'
  },
  updateData: () => ({
    configKey: 'full.crud.test.key',
    configValue: 'modified456',
    configDesc: '全功能验收测试修改后的配置'
  }),
  getCount: (body) => Object.keys(body.data || {}).length,
  findItem: (body, data) => {
    const map = body.data || {};
    return map[data.configKey] !== undefined ? { configKey: data.configKey, configValue: map[data.configKey] } : null;
  },
  getId: (item) => item?.configKey
});

// ========== 4. 系统配置 CRUD ==========
await crudTest('系统配置', {
  listPath: '/ms/system/config',
  createPath: '/ms/system/config',
  updatePath: '/ms/system/config/{id}',
  deletePath: '/ms/system/config/{id}',
  createData: {
    configKey: 'system.full.crud.test',
    configValue: 'sys123',
    configDesc: '全功能验收系统配置'
  },
  updateData: (id) => ({
    id,
    configKey: 'system.full.crud.test',
    configValue: 'sys456',
    configDesc: '全功能验收修改后的系统配置'
  }),
  getCount: (body) => body.data?.length || 0,
  findItem: (body, data) => body.data?.find(c => c.configKey === data.configKey),
  getId: (item) => item?.id
});

// ========== 5. 分组管理 CRUD ==========
await crudTest('分组管理', {
  listPath: '/ms/server/group/tree',
  createPath: '/ms/server/group',
  updatePath: '/ms/server/group/{id}',
  deletePath: '/ms/server/group/{id}',
  createData: {
    groupName: '全功能验收-分组001',
    groupCode: 'full_crud_group_001',
    groupDesc: '全功能验收测试分组',
    parentId: 0
  },
  updateData: (id) => ({
    id,
    groupName: '全功能验收-分组已修改001',
    groupCode: 'full_crud_group_001',
    groupDesc: '全功能验收测试修改后的分组'
  }),
  getCount: (body) => {
    const data = body.data;
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object') return Object.keys(data).length;
    return 0;
  },
  findItem: (body, data) => {
    const list = Array.isArray(body.data) ? body.data : (body.data?.list || body.data?.children || []);
    return list.find(g => g.groupName === data.groupName || g.groupCode === data.groupCode);
  },
  getId: (item) => item?.id || item?.groupId
});

// ========== 6. 账号管理-身份 CRUD ==========
await crudTest('账号管理-身份', {
  listPath: '/ms/server/identity',
  createPath: '/ms/server/identity',
  updatePath: '/ms/server/identity/{id}',
  deletePath: '/ms/server/identity/{id}',
  createData: {
    identityName: '全功能验收-身份001',
    identityType: 'ssh',
    username: 'testuser',
    password: 'testpass123',
    identityDesc: '全功能验收测试身份'
  },
  updateData: (id) => ({
    id,
    identityName: '全功能验收-身份已修改001',
    identityType: 'ssh',
    username: 'testuser_modified',
    identityDesc: '全功能验收测试修改后的身份'
  }),
  getCount: (body) => body.data?.length || 0,
  findItem: (body, data) => body.data?.find(i => i.identityName === data.identityName),
  getId: (item) => item?.id || item?.identityId
});

// ========== 7. 代理管理 CRUD ==========
await crudTest('代理管理', {
  listPath: '/ms/monitor/proxy',
  createPath: '/ms/monitor/proxy',
  updatePath: '/ms/monitor/proxy/{id}',
  deletePath: '/ms/monitor/proxy/{id}',
  createData: {
    proxyName: '全功能验收-代理001',
    proxyType: 'http',
    proxyHost: '127.0.0.1',
    proxyPort: 8080,
    proxyDesc: '全功能验收测试代理'
  },
  updateData: (id) => ({
    id,
    proxyName: '全功能验收-代理已修改001',
    proxyType: 'socks5',
    proxyHost: '127.0.0.1',
    proxyPort: 1080,
    proxyDesc: '全功能验收测试修改后的代理'
  }),
  getCount: (body) => body.data?.length || 0,
  findItem: (body, data) => body.data?.find(p => p.proxyName === data.proxyName),
  getId: (item) => item?.id || item?.proxyId
});

// ========== 汇总 ==========
console.log('\n\n' + '='.repeat(60));
console.log('### 全功能 CRUD 验收结果汇总');
console.log('='.repeat(60));

let totalPassed = 0;
let totalFailed = 0;
let totalSteps = 0;

results.forEach(r => {
  const icon = r.failed === 0 ? '✅' : '⚠️';
  console.log(`\n${icon} ${r.module}: ${r.passed}/${r.steps.length} 通过, ${r.failed} 失败`);
  r.steps.forEach(s => {
    const stepIcon = s.status === 'pass' ? '  ✅' : '  ❌';
    console.log(`${stepIcon} ${s.step}${s.count !== undefined ? ` (数量: ${s.count})` : ''}${s.found !== undefined ? ` (找到: ${s.found ? '是' : '否'})` : ''}`);
  });
  totalPassed += r.passed;
  totalFailed += r.failed;
  totalSteps += r.steps.length;
});

console.log(`\n\n📊 总计: ${totalSteps} 步骤, ${totalPassed} 通过, ${totalFailed} 失败`);
console.log(`🎯 通过率: ${((totalPassed / totalSteps) * 100).toFixed(1)}%`);

fs.writeFileSync(`${screenshotDir}/results.json`, JSON.stringify({
  total: totalSteps,
  passed: totalPassed,
  failed: totalFailed,
  passRate: ((totalPassed / totalSteps) * 100).toFixed(1),
  modules: results
}, null, 2));

console.log('\n结果已保存到 test-results/full-crud-acceptance/results.json');
