const http = require('http');
const API = 'http://127.0.0.1:8787';
let P = 0, F = 0;
async function test(n, fn) { try { await fn(); console.log('  ✓ ' + n); P++; } catch(e) { console.log('  ✗ ' + n + ': ' + e.message.substring(0,100)); F++; } }
function get(path) { return new Promise((r,j)=>{ const req=http.get(API+path,{timeout:10000},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{r({s:res.statusCode,j:JSON.parse(d)})}catch(e){r({s:res.statusCode,e:e.message})}})}); req.on('error',j); req.on('timeout',()=>{req.destroy();j(new Error('timeout'))})}); }
function post(path,body) { return new Promise((r,j)=>{ const p=new URL(API+path); const req=http.request({hostname:p.hostname,port:p.port,path:p.pathname,method:'POST',headers:{'Content-Type':'application/json'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{r({s:res.statusCode,j:JSON.parse(d)})}catch{r({s:res.statusCode,t:d.substring(0,100)})}})}); req.on('error',j); req.setTimeout(10000,()=>{req.destroy();j(new Error('timeout'))}); req.write(JSON.stringify(body)); req.end(); }); }

(async () => {
  console.log('\n=== Fix #1: /api/requirements/tag-bindings (新增端点) ===');
  await test('GET /api/requirements/tag-bindings returns success', async () => {
    const {s,j}=await get('/api/requirements/tag-bindings');
    if(s!==200) throw new Error('HTTP '+s);
    if(!j.success) throw new Error('success=false');
    if(!Array.isArray(j.data)) throw new Error('data not array');
  });

  console.log('\n=== Fix #2: /api/knowledge/binding (query params for slashes) ===');
  await test('workpath with slashes via query param', async () => {
    const {s,j}=await get('/api/knowledge/binding?kind=workpath&target_id=D:/ch/project/.local-run');
    if(s!==200) throw new Error('HTTP '+s);
    if(!j.success) throw new Error('success=false');
    if(j.data.target_id!=='D:/ch/project/.local-run') throw new Error('target_id wrong');
  });
  await test('simple workpath', async () => {
    const {s,j}=await get('/api/knowledge/binding?kind=workpath&target_id=test');
    if(s!==200) throw new Error('HTTP '+s);
    if(j.data.target_id!=='test') throw new Error('target_id wrong');
  });
  await test('conversation binding', async () => {
    const {s,j}=await get('/api/knowledge/binding?kind=conversation&target_id=abc');
    if(s!==200) throw new Error('HTTP '+s);
    if(j.data.target_kind!=='conversation') throw new Error('wrong target_kind');
  });

  console.log('\n=== Fix #3: tag-bindings persistence ===');
  await test('autowork set + tag-bindings reflects it', async () => {
    await post('/api/requirements/autowork', { kind:'conversation', target_id:'e2e-verify', enabled:true, tag:'verify-tag' });
    const {j}=await get('/api/requirements/tag-bindings');
    if(!j.data.some(g=>g.tag==='verify-tag')) throw new Error('tag not found');
  });

  console.log('\n=== Fix #4: models/capabilities ===');
  await test('returns capability groups', async () => {
    const {s,j}=await get('/v2/ai/models/capabilities');
    if(s!==200) throw new Error('HTTP '+s);
    if(!j.data.ocr || !j.data.enhance) throw new Error('missing groups');
  });

  console.log('\n=== Fix #5: config endpoints ===');
  await test('GET /v2/ocr/config', async () => { const {j}=await get('/v2/ocr/config'); if(!j.data?.length) throw new Error('empty'); });
  await test('GET /v2/face/config', async () => { const {j}=await get('/v2/face/config'); if(!j.data?.length) throw new Error('empty'); });
  await test('GET /v2/layout/config', async () => { const {j}=await get('/v2/layout/config'); if(!j.data?.length) throw new Error('empty'); });
  await test('GET /v2/image-recognition/config', async () => { const {j}=await get('/v2/image-recognition/config'); if(!j.data?.length) throw new Error('empty'); });

  console.log('\n=== Fix #6: /api/fs/metadata ===');
  await test('POST /api/fs/metadata', async () => {
    const {j}=await post('/api/fs/metadata',{path:'/tmp',workspace:''});
    if(!j.success && !j.data?.success) throw new Error('unexpected');
  });

  console.log('\n=== Fix #7: tauriShell zoom guard (code review) ===');
  await test('tauriShell.ts has metadata guard', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('D:/ch/project/vue-support-parent-starter/pages/ai/src/common/adapter/tauriShell.ts','utf8');
    if(!code.includes('metadata') || !code.includes('return factor')) throw new Error('guard missing');
  });

  console.log('\n=== Fix #8: UsageLibraryPage dayjs fix (code review) ===');
  await test('UsageLibraryPage.tsx uses dayjs()', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('D:/ch/project/vue-support-parent-starter/pages/ai/src/renderer/pages/settings/UsageLibraryPage.tsx','utf8');
    if(!code.includes('dayjs(v[0])')) throw new Error('fix missing');
  });

  console.log('\n=== Fix #9: ipcBridge query param for binding ===');
  await test('ipcBridge.ts uses query param for binding', async () => {
    const fs = require('fs');
    const code = fs.readFileSync('D:/ch/project/vue-support-parent-starter/pages/ai/src/common/adapter/ipcBridge.ts','utf8');
    if(!code.includes('target_id=$')) throw new Error('query param missing');
  });

  console.log('\n=== Results: '+P+' passed, '+F+' failed ===');
  process.exit(F>0?1:0);
})();
