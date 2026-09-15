import http from 'http';

const BASE = 'http://127.0.0.1:8081';
const results = [];

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

async function step(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    const result = await fn();
    results.push({ step: name, status: 'pass', result });
    console.log(`  ✅ 完成`);
    return result;
  } catch (e) {
    results.push({ step: name, status: 'fail', error: e.message });
    console.log(`  ❌ 失败: ${e.message.substring(0, 100)}`);
    return null;
  }
}

console.log('=== API 级别 CRUD 操作验收（每个操作必须产生数据变化） ===\n');

// ========== 1. 主机资产 CRUD ==========
console.log('\n########## 1. 主机资产 CRUD ##########');

let hostId = null;

// 1.1 查询初始数量
const initialHosts = await step('1.1 查询初始主机列表', async () => {
  const res = await request('GET', '/ms/server/host');
  const count = res.body.data?.length || 0;
  console.log(`  初始主机数量: ${count}`);
  return count;
});

// 1.2 新增主机
const newHost = await step('1.2 新增主机（CRUD测试-API验收001）', async () => {
  const res = await request('POST', '/ms/server/host', {
    serverHostName: 'CRUD测试-API验收001',
    serverHostAddress: '10.0.0.100',
    serverHostPort: 22,
    serverHostOsType: 'Linux',
    serverHostStatus: 1,
    serverHostOnline: 1,
    serverHostDescription: 'API验收测试创建的主机',
    serverHostCpuCores: 4,
    serverHostMemoryMb: 8192,
    serverHostDiskGb: 200,
    serverHostCollectEnabled: 1,
    serverHostAgentEnabled: 1,
    serverHostRemoteEnabled: 1
  });
  console.log(`  响应码: ${res.body.code}, 消息: ${res.body.msg}`);
  return res.body;
});

// 1.3 验证新增成功
const afterAddHosts = await step('1.3 验证新增成功（查询列表）', async () => {
  const res = await request('GET', '/ms/server/host');
  const hosts = res.body.data || [];
  const found = hosts.find(h => h.serverHostName === 'CRUD测试-API验收001');
  hostId = found?.id;
  console.log(`  当前主机数量: ${hosts.length}, 新增主机存在: ${found ? '✅ 是' : '❌ 否'}, ID: ${hostId}`);
  if (!found) throw new Error('新增主机未在列表中找到');
  return { count: hosts.length, found: !!found, id: hostId };
});

// 1.4 编辑主机
const editedHost = await step('1.4 编辑主机（改名为CRUD测试-已修改001）', async () => {
  if (!hostId) throw new Error('没有主机ID');
  const res = await request('PUT', `/ms/server/host/${hostId}`, {
    serverHostId: hostId,
    serverHostName: 'CRUD测试-已修改001',
    serverHostAddress: '10.0.0.100',
    serverHostPort: 22,
    serverHostDescription: 'API验收测试修改后的主机'
  });
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 1.5 验证编辑成功
const afterEditHosts = await step('1.5 验证编辑成功', async () => {
  const res = await request('GET', '/ms/server/host');
  const hosts = res.body.data || [];
  const found = hosts.find(h => h.serverHostName === 'CRUD测试-已修改001');
  const oldFound = hosts.find(h => h.serverHostName === 'CRUD测试-API验收001');
  console.log(`  修改后主机存在: ${found ? '✅ 是' : '❌ 否'}, 旧名称存在: ${oldFound ? '❌ 是（未修改）' : '✅ 否（已修改）'}`);
  if (!found) throw new Error('修改后的主机未找到');
  if (oldFound) throw new Error('旧名称主机仍然存在，修改未生效');
  return { found: !!found };
});

// 1.6 删除主机
const deletedHost = await step('1.6 删除主机', async () => {
  if (!hostId) throw new Error('没有主机ID');
  const res = await request('DELETE', `/ms/server/host/${hostId}`);
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 1.7 验证删除成功
const afterDeleteHosts = await step('1.7 验证删除成功', async () => {
  const res = await request('GET', '/ms/server/host');
  const hosts = res.body.data || [];
  const found = hosts.find(h => h.serverHostName === 'CRUD测试-已修改001');
  console.log(`  删除后主机存在: ${found ? '❌ 是（未删除）' : '✅ 否（已删除）'}, 当前数量: ${hosts.length}`);
  if (found) throw new Error('删除后的主机仍然存在');
  return { count: hosts.length, deleted: !found };
});

// ========== 2. 数据源管理 CRUD ==========
console.log('\n########## 2. 数据源管理 CRUD ##########');

let dsId = null;

// 2.1 查询初始数量
const initialDs = await step('2.1 查询初始数据源列表', async () => {
  const res = await request('GET', '/ms/monitor/datasource/list');
  const count = res.body.data?.length || 0;
  console.log(`  初始数据源数量: ${count}`);
  return count;
});

// 2.2 新增数据源
const newDs = await step('2.2 新增数据源（CRUD测试-API验收数据源）', async () => {
  const res = await request('POST', '/ms/monitor/datasource', {
    name: 'CRUD测试-API验收数据源',
    type: 'redis',
    host: '127.0.0.1',
    port: 6379,
    password: '',
    database: 0,
    remark: 'API验收测试创建的数据源'
  });
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 2.3 验证新增成功
const afterAddDs = await step('2.3 验证新增成功', async () => {
  const res = await request('GET', '/ms/monitor/datasource/list');
  const list = res.body.data || [];
  const found = list.find(d => d.name === 'CRUD测试-API验收数据源');
  dsId = found?.id;
  console.log(`  当前数据源数量: ${list.length}, 新增数据源存在: ${found ? '✅ 是' : '❌ 否'}, ID: ${dsId}`);
  if (!found) throw new Error('新增数据源未在列表中找到');
  return { count: list.length, found: !!found, id: dsId };
});

// 2.4 编辑数据源
const editedDs = await step('2.4 编辑数据源（改名为CRUD测试-已修改数据源）', async () => {
  if (!dsId) throw new Error('没有数据源ID');
  const res = await request('PUT', `/ms/monitor/datasource/${dsId}`, {
    id: dsId,
    name: 'CRUD测试-已修改数据源',
    type: 'redis',
    host: '127.0.0.1',
    port: 6380,
    remark: 'API验收测试修改后的数据源'
  });
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 2.5 验证编辑成功
const afterEditDs = await step('2.5 验证编辑成功', async () => {
  const res = await request('GET', '/ms/monitor/datasource/list');
  const list = res.body.data || [];
  const found = list.find(d => d.name === 'CRUD测试-已修改数据源');
  const oldFound = list.find(d => d.name === 'CRUD测试-API验收数据源');
  console.log(`  修改后数据源存在: ${found ? '✅ 是' : '❌ 否'}, 旧名称存在: ${oldFound ? '❌ 是（未修改）' : '✅ 否（已修改）'}`);
  if (!found) throw new Error('修改后的数据源未找到');
  return { found: !!found };
});

// 2.6 删除数据源
const deletedDs = await step('2.6 删除数据源', async () => {
  if (!dsId) throw new Error('没有数据源ID');
  const res = await request('DELETE', `/ms/monitor/datasource/${dsId}`);
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 2.7 验证删除成功
const afterDeleteDs = await step('2.7 验证删除成功', async () => {
  const res = await request('GET', '/ms/monitor/datasource/list');
  const list = res.body.data || [];
  const found = list.find(d => d.name === 'CRUD测试-已修改数据源');
  console.log(`  删除后数据源存在: ${found ? '❌ 是（未删除）' : '✅ 否（已删除）'}, 当前数量: ${list.length}`);
  if (found) throw new Error('删除后的数据源仍然存在');
  return { count: list.length, deleted: !found };
});

// ========== 3. 监控配置 CRUD ==========
console.log('\n########## 3. 监控配置 CRUD ##########');

let cfgId = null;

// 3.1 新增配置
const newCfg = await step('3.1 新增配置（crud.test.api.key=test123）', async () => {
  const res = await request('POST', '/ms/monitor/config', {
    configKey: 'crud.test.api.key',
    configValue: 'test123',
    configDesc: 'API验收测试配置'
  });
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 3.2 验证新增成功
const afterAddCfg = await step('3.2 验证新增成功', async () => {
  const res = await request('GET', '/ms/monitor/config');
  const configMap = res.body.data || {};
  const value = configMap['crud.test.api.key'];
  console.log(`  配置存在: ${value !== undefined ? '✅ 是' : '❌ 否'}, 值: ${value}`);
  if (value === undefined) throw new Error('新增配置未找到');
  if (value !== 'test123') throw new Error('配置值不正确');
  return { found: value !== undefined, value };
});

// 3.3 编辑配置
const editedCfg = await step('3.3 编辑配置（值改为modified456）', async () => {
  const res = await request('PUT', '/ms/monitor/config', {
    configKey: 'crud.test.api.key',
    configValue: 'modified456',
    configDesc: 'API验收测试修改后的配置'
  });
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 3.4 验证编辑成功
const afterEditCfg = await step('3.4 验证编辑成功', async () => {
  const res = await request('GET', '/ms/monitor/config');
  const configMap = res.body.data || {};
  const value = configMap['crud.test.api.key'];
  console.log(`  配置值: ${value}, 期望: modified456`);
  if (value === undefined) throw new Error('配置未找到');
  if (value !== 'modified456') throw new Error('配置值未修改');
  return { found: value !== undefined, value };
});

// 3.5 删除配置
const deletedCfg = await step('3.5 删除配置', async () => {
  const res = await request('DELETE', '/ms/monitor/config/crud.test.api.key');
  console.log(`  响应码: ${res.body.code}`);
  return res.body;
});

// 3.6 验证删除成功
const afterDeleteCfg = await step('3.6 验证删除成功', async () => {
  const res = await request('GET', '/ms/monitor/config');
  const configMap = res.body.data || {};
  const value = configMap['crud.test.api.key'];
  console.log(`  删除后配置存在: ${value !== undefined ? '❌ 是（未删除）' : '✅ 否（已删除）'}`);
  if (value !== undefined) throw new Error('删除后的配置仍然存在');
  return { deleted: value === undefined };
});

// ========== 汇总 ==========
console.log('\n\n========== API CRUD 验收结果汇总 ==========');
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
console.log(`总步骤: ${results.length}`);
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`\n各步骤详情:`);
results.forEach((r, i) => {
  const icon = r.status === 'pass' ? '✅' : '❌';
  console.log(`  ${icon} ${r.step}`);
});

console.log(`\n${failed === 0 ? '🎉 所有 CRUD 操作验收通过！每个操作都产生了实际数据变化。' : '⚠️ 有部分操作失败，请检查。'}`);

import fs from 'fs';
fs.writeFileSync('test-results/api-crud-results.json', JSON.stringify({
  total: results.length,
  passed,
  failed,
  results
}, null, 2));
console.log('\n结果已保存到 test-results/api-crud-results.json');
