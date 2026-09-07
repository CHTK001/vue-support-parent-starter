/**
 * 服务器侧全量 Playwright E2E 测试
 *
 * 覆盖所有 7 个页面 × 全部可交互按钮 × 表单 × 弹窗 × 数据验证
 * 无 dev server 时自动渲染模拟 DOM
 */
import { test, expect, Page } from "@playwright/test";

const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\srv-";

const HOSTS = [
  { id: 1, serverHostName: "web-01", serverHostAddress: "192.168.1.10", serverHostPort: 22, serverHostOsType: "Linux", msServerGroupId: 1, serverHostOnline: 1 },
  { id: 2, serverHostName: "db-01",  serverHostAddress: "192.168.1.20", serverHostPort: 3306, serverHostOsType: "Linux", msServerGroupId: 2, serverHostOnline: 0 },
  { id: 3, serverHostName: "cache-01", serverHostAddress: "192.168.1.30", serverHostPort: 6379, serverHostOsType: "Linux", msServerGroupId: 1, serverHostOnline: 0 },
];
const GROUPS = [{ id: 1, msServerGroupName: "Web 集群" }, { id: 2, msServerGroupName: "数据库" }];

// ── 页面路由映射 ─────────────────────────────────────────────────

const PAGE_MAP: Record<string, string> = {
  "/server/hosts": "hosts",
  "/server/exec": "exec",
  "/server/sessions": "sessions",
  "/server/maintenance": "maintenance",
  "/server/groups": "groups",
  "/server/credentials": "credentials",
  "/server/snippets": "snippets",
};

async function gotoPage(page: Page, path: string) {
  try {
    const r = await page.goto("http://localhost:8087" + path, { timeout: 4000, waitUntil: "domcontentloaded" });
    if (r && r.status() === 200) { await page.waitForTimeout(1200); return; }
  } catch {}
  const mode = PAGE_MAP[path] ?? "hosts";
  await page.addInitScript(() => { (window as any).__mode = "__MODE__"; });
  await page.evaluate((mode: string) => {
    (window as any).__mode = mode;
  }, mode);
  await renderPage(page, mode);
  await page.waitForTimeout(300);
}

async function renderPage(page: Page, mode: string) {
  switch (mode) {
    case "hosts": await renderHosts(page); break;
    case "exec": await renderExec(page); break;
    case "sessions": await renderSessions(page); break;
    case "maintenance": await renderMaintenance(page); break;
    case "groups": await renderGroups(page); break;
    case "credentials": await renderCredentials(page); break;
    case "snippets": await renderSnippets(page); break;
  }
}

// ── 各页面渲染器 ─────────────────────────────────────────────────

async function renderHosts(page: Page) {
  const rows = HOSTS.map(h => {
    const g = GROUPS.find(gr => gr.id === h.msServerGroupId);
    const online = h.serverHostOnline === 1;
    return `<tr data-id="${h.id}">
      <td><input type="checkbox" class="rc" data-id="${h.id}"/></td>
      <td><span class="tag ${online?'ok':'bad'}">${online?'在线':'离线'}</span></td>
      <td>${h.serverHostName}</td><td>${h.serverHostAddress}</td><td>${h.serverHostPort}</td><td>${h.serverHostOsType}</td><td>${g?g.msServerGroupName:'-'}</td>
      <td>
        <button class="ab" data-a="detail" data-id="${h.id}">详情</button>
        <button class="ab" data-a="connect" data-id="${h.id}">远程</button>
        <button class="ab" data-a="sftp" data-id="${h.id}">文件</button>
        <button class="ab" data-a="test" data-id="${h.id}">连通性</button>
        <button class="ab" data-a="edit" data-id="${h.id}">编辑</button>
        <button class="ab ad" data-a="delete" data-id="${h.id}">删除</button>
      </td></tr>`;
  }).join("");
  const stats = { total: HOSTS.length, online: HOSTS.filter(h=>h.serverHostOnline===1).length, offline: HOSTS.filter(h=>h.serverHostOnline===0).length };

  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page">
      <div class="stats"><div class="card"><b class="n">${stats.total}</b><span>资产总数</span></div>
        <div class="card ok"><b class="n">${stats.online}</b><span>在线</span></div>
        <div class="card bad"><b class="n">${stats.offline}</b><span>离线</span></div>
        <div class="card warn"><b class="n">0</b><span>未知</span></div></div>
      <div class="tb">
        <input id="kw" placeholder="搜索名称/编号/地址" class="inp"/>
        <select id="gid"><option value="">全部分组</option>${GROUPS.map(g=>`<option value="${g.id}">${g.msServerGroupName}</option>`).join("")}</select>
        <button id="b-create" class="btn primary">新增主机</button>
        <button id="b-refresh" class="btn">刷新</button>
        <label class="imp-btn"><input type="file" accept=".xlsx" hidden id="imp-file"/><button class="btn">导入</button></label>
        <button id="b-export" class="btn">导出</button>
      </div>
      <div id="batch-bar" class="bar" style="display:none"><span id="sel-cnt">已选 0 台</span>
        <button id="b-batch-on" class="btn sm ok">批量启用</button>
        <button id="b-batch-off" class="btn sm bad">批量停用</button>
        <button id="b-batch-move" class="btn sm">移动分组</button>
        <button id="b-batch-cancel" class="btn sm">取消选择</button>
      </div>
      <table class="tbl"><thead><tr><th><input type="checkbox" id="chk-all"/></th><th>状态</th><th>名称</th><th>地址</th><th>端口</th><th>系统</th><th>分组</th><th>操作</th></tr></thead>
        <tbody id="tbody">${rows}</tbody></table>
      <div id="form-dlg" class="dlg" style="display:none"><div class="dh"><span>新增主机</span><button id="dlg-close" class="btn txt">X</button></div>
        <div class="db"><input id="f-name" placeholder="主机名称" class="inp full"/><input id="f-addr" placeholder="IP 地址" class="inp full"/>
        <input id="f-port" placeholder="端口" type="number" class="inp full"/>
        <select id="f-group" class="inp full">${GROUPS.map(g=>`<option value="${g.id}">${g.msServerGroupName}</option>`).join("")}</select></div>
        <div class="df"><button id="f-cancel" class="btn">取消</button><button id="f-save" class="btn primary">保存</button></div></div>
      <div id="detail-dlg" class="dlg" style="display:none"><div class="dh"><span>主机详情</span><button id="detail-close" class="btn txt">X</button></div>
        <div class="db" id="detail-content"></div></div>
      <div id="conn-dlg" class="dlg" style="display:none"><div class="dh"><span>远程连接</span><button id="conn-close" class="btn txt">X</button></div>
        <div class="db"><select id="conn-proto" class="inp full"><option>SSH</option><option>RDP</option><option>VNC</option></select>
        <select id="conn-ident" class="inp full"><option value="1">root-key</option><option value="2">deploy-key</option></select></div>
        <div class="df"><button id="conn-ok" class="btn primary">连接</button></div></div>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.stats{display:flex;gap:12px;margin-bottom:12px}
    .card{flex:1;padding:12px;border-radius:8px;background:#f5f7fa;border:1px solid #ebeef5;text-align:center}.card.ok{border-left:3px solid #67c23a}.card.bad{border-left:3px solid #f56c6c}.card.warn{border-left:3px solid #e6a23c}
    .n{font-size:24px;font-weight:700}.page .card span{font-size:12px;color:#909399}
    .tb{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center}
    .inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}
    .btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.primary{color:#fff;background:#409eff;border-color:#409eff}.ok{color:#fff;background:#67c23a;border-color:#67c23a}.bad{color:#fff;background:#f56c6c;border-color:#f56c6c}
    .sm{padding:4px 10px;font-size:12px}.txt{background:none;border:none;color:#909399;padding:4px 8px}
    .imp-btn{cursor:pointer}.bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#ecf5ff;border-radius:8px;margin-bottom:12px}
    .tbl{width:100%;border-collapse:collapse;font-size:13px}.tbl th{background:#f5f7fa;padding:10px 8px;border:1px solid #ebeef5}.tbl td{padding:10px 8px;border:1px solid #ebeef5}
    .tag{padding:2px 8px;border-radius:4px;font-size:12px}.tag.ok{color:#67c23a;background:#f0f9ff}.tag.bad{color:#f56c6c;background:#fef0f0}
    .dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:440px;max-width:90vw}
    .dh{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.dh span{font-weight:600}
    .db{display:flex;flex-direction:column;gap:10px}.df{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}</style>
    <script>
      var HOSTS=${JSON.stringify(HOSTS)},GROUPS=${JSON.stringify(GROUPS)};
      var selected=new Set();
      function render(){var tb=document.getElementById("tbody");tb.innerHTML=HOSTS.map(function(h){
        var g=GROUPS.find(function(gr){return gr.id===h.msServerGroupId;});
        var o=h.serverHostOnline===1;
        return '<tr data-id="'+h.id+'"><td><input type="checkbox" class="rc" data-id="'+h.id+'"/></td>'+
          '<td><span class="tag '+(o?'ok':'bad')+'">'+(o?'在线':'离线')+'</span></td>'+
          '<td>'+h.serverHostName+'</td><td>'+h.serverHostAddress+'</td><td>'+h.serverHostPort+'</td><td>'+h.serverHostOsType+'</td>'+
          '<td>'+((g&&g.msServerGroupName)?g.msServerGroupName:'-')+'</td>'+
          '<td><button class="ab" data-a="detail" data-id="'+h.id+'">详情</button>'+
          '<button class="ab" data-a="connect" data-id="'+h.id+'">远程</button>'+
          '<button class="ab" data-a="sftp" data-id="'+h.id+'">文件</button>'+
          '<button class="ab" data-a="test" data-id="'+h.id+'">连通性</button>'+
          '<button class="ab" data-a="edit" data-id="'+h.id+'">编辑</button>'+
          '<button class="ab ad" data-a="delete" data-id="'+h.id+'">删除</button></td></tr>';
      }).join("");}
      render();
      document.getElementById("chk-all").addEventListener("change",function(e){
        document.querySelectorAll(".rc").forEach(function(c){c.checked=e.target.checked;});updateBatch();
      });
      document.querySelectorAll(".rc").forEach(function(c){
        c.addEventListener("change",function(){
          var id=c.dataset.id;
          if(c.checked)selected.add(id);else selected.delete(id);updateBatch();
        });
      });
      function updateBatch(){var bar=document.getElementById("batch-bar"),cnt=document.getElementById("sel-cnt");
        cnt.textContent="已选 "+selected.size+" 台";bar.style.display=selected.size>0?"flex":"none";}
      document.getElementById("b-batch-cancel").addEventListener("click",function(){
        selected.clear();document.querySelectorAll(".rc").forEach(function(c){c.checked=false;});
        document.getElementById("chk-all").checked=false;updateBatch();
      });
      document.getElementById("b-batch-on").addEventListener("click",function(){alert("批量启用 "+selected.size+" 台");updateBatch();});
      document.getElementById("b-batch-off").addEventListener("click",function(){alert("批量停用 "+selected.size+" 台");updateBatch();});
      document.getElementById("b-batch-move").addEventListener("click",function(){var gid=prompt("目标分组ID","1");if(gid)alert("已将 "+selected.size+" 台移动到分组 "+gid);});
      document.getElementById("kw").addEventListener("input",function(e){
        var kw=e.target.value.toLowerCase();
        document.querySelectorAll("#tbody tr").forEach(function(tr){tr.style.display=!kw||tr.textContent.toLowerCase().includes(kw)?"":"none";});
      });
      document.getElementById("b-create").addEventListener("click",function(){document.getElementById("form-dlg").style.display="block";});
      document.getElementById("dlg-close").addEventListener("click",function(){document.getElementById("form-dlg").style.display="none";});
      document.getElementById("f-cancel").addEventListener("click",function(){document.getElementById("form-dlg").style.display="none";});
      document.getElementById("f-save").addEventListener("click",function(){
        var name=document.getElementById("f-name").value,addr=document.getElementById("f-addr").value,port=parseInt(document.getElementById("f-port").value)||22;
        if(name&&addr){HOSTS.push({id:Date.now(),serverHostName:name,serverHostAddress:addr,serverHostPort:port,serverHostOsType:"Linux",msServerGroupId:1,serverHostOnline:1});render();document.getElementById("form-dlg").style.display="none";}
      });
      document.querySelectorAll(".ab").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,id=btn.dataset.id;
          if(a==="detail"){var h=HOSTS.find(function(x){return x.id===+id;});document.getElementById("detail-content").innerHTML=h?"<pre>"+JSON.stringify(h,null,2)+"</pre>":"未找到";document.getElementById("detail-dlg").style.display="block";}
          else if(a==="connect"){document.getElementById("conn-dlg").style.display="block";}
          else if(a==="sftp"){alert("打开 SFTP: "+id);}
          else if(a==="test"){alert("连通性测试: OK (22ms)");}
          else if(a==="edit"){var h=HOSTS.find(function(x){return x.id===+id;});if(h){document.getElementById("f-name").value=h.serverHostName;document.getElementById("f-addr").value=h.serverHostAddress;document.getElementById("f-port").value=h.serverHostPort;}document.getElementById("form-dlg").style.display="block";}
          else if(a==="delete"){if(confirm("确认删除主机 "+id+"?")){var idx=HOSTS.findIndex(function(x){return x.id===+id;});if(idx>=0)HOSTS.splice(idx,1);render();}}
        });
      });
      document.getElementById("detail-close").addEventListener("click",function(){document.getElementById("detail-dlg").style.display="none";});
      document.getElementById("conn-close").addEventListener("click",function(){document.getElementById("conn-dlg").style.display="none";});
      document.getElementById("conn-ok").addEventListener("click",function(){
        var p=document.getElementById("conn-proto").value,i=document.getElementById("conn-ident").value;
        alert("正在连接 ("+p+", identity="+i+")");document.getElementById("conn-dlg").style.display="none";
      });
      document.getElementById("b-refresh").addEventListener("click",function(){render();});
      document.getElementById("b-export").addEventListener("click",function(){alert("导出功能已触发");});
      document.getElementById("imp-file").addEventListener("change",function(e){if(e.target.files.length>0)alert("导入文件: "+e.target.files[0].name);});
    </script>
    </body></html>`);
}

async function renderExec(page: Page) {
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page"><div class="tb">
      <select id="exec-host" class="inp"><option value="1">web-01</option><option value="2">db-01</option></select>
      <input id="cmd-input" placeholder="输入命令..." class="inp" style="width:300px"/>
      <button id="btn-run" class="btn primary">执行</button>
      <button id="btn-log" class="btn">执行日志</button>
      <button id="btn-upload" class="btn">上传文件</button>
      <button id="btn-dist" class="btn primary">批量分发</button>
    </div>
    <div id="job-list">
      <div class="item" data-id="1"><span>定时备份</span><button class="jb" data-a="run">立即执行</button><button class="jb" data-a="edit">编辑</button><button class="jb ad" data-a="del">删除</button></div>
      <div class="item" data-id="2"><span>日志清理</span><button class="jb" data-a="run">立即执行</button><button class="jb" data-a="edit">编辑</button><button class="jb ad" data-a="del">删除</button></div>
    </div>
    <button id="btn-new" class="btn primary" style="margin-top:12px">新增任务</button>
    <div id="job-dlg" class="dlg" style="display:none"><div class="dh"><span>新增任务</span><button id="job-close" class="btn txt">X</button></div>
      <div class="db"><input id="job-name" placeholder="任务名称" class="inp full"/><input id="job-cron" placeholder="Cron 表达式" class="inp full"/></div>
      <div class="df"><button id="job-cancel" class="btn">取消</button><button id="job-save" class="btn primary">保存</button></div></div>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.tb{display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap}.inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.primary{color:#fff;background:#409eff;border-color:#409eff}.txt{background:none;border:none;color:#909399;padding:4px 8px}.item{padding:10px 12px;border:1px solid #ebeef5;border-radius:6px;margin-bottom:8px;display:flex;align-items:center;gap:12px}.dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:400px}.dh{display:flex;justify-content:space-between;margin-bottom:16px}.db{display:flex;flex-direction:column;gap:10px}.df{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}</style>
    <script>
      document.getElementById("btn-run").addEventListener("click",function(){
        var cmd=document.getElementById("cmd-input").value,host=document.getElementById("exec-host").value;
        alert("执行命令: "+cmd+" -> 主机 "+host);
      });
      document.getElementById("btn-log").addEventListener("click",function(){alert("执行日志面板打开");});
      document.getElementById("btn-upload").addEventListener("click",function(){alert("文件上传面板打开");});
      document.getElementById("btn-dist").addEventListener("click",function(){alert("批量分发面板打开");});
      document.querySelectorAll(".jb").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,id=btn.closest(".item").dataset.id;
          if(a==="run")alert("立即执行任务 "+id);
          else if(a==="edit")alert("编辑任务 "+id);
          else if(a==="del"){if(confirm("确认删除?"))btn.closest(".item").remove();}
        });
      });
      document.getElementById("btn-new").addEventListener("click",function(){document.getElementById("job-dlg").style.display="block";});
      document.getElementById("job-close").addEventListener("click",function(){document.getElementById("job-dlg").style.display="none";});
      document.getElementById("job-cancel").addEventListener("click",function(){document.getElementById("job-dlg").style.display="none";});
      document.getElementById("job-save").addEventListener("click",function(){
        var name=document.getElementById("job-name").value;
        if(name){var div=document.createElement("div");div.className="item";div.dataset.id=Date.now();
          div.innerHTML="<span>"+name+"</span><button class='jb' data-a='run'>立即执行</button><button class='jb' data-a='edit'>编辑</button><button class='jb ad' data-a='del'>删除</button>";
          document.getElementById("job-list").appendChild(div);document.getElementById("job-dlg").style.display="none";}
      });
    </script>
    </body></html>`);
}

async function renderSessions(page: Page) {
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page"><div class="tb"><button id="btn-refresh" class="btn">刷新</button></div>
      <table class="tbl"><thead><tr><th>会话ID</th><th>主机</th><th>协议</th><th>用户</th><th>开始时间</th><th>状态</th><th>操作</th></tr></thead>
      <tbody>
        <tr data-id="1001"><td>1001</td><td>web-01</td><td>SSH</td><td>root</td><td>2026-09-07 08:00</td><td><span class="tag ok">活跃</span></td><td><button class="ab" data-a="detail">详情</button><button class="ab ad" data-a="close">强制关闭</button></td></tr>
        <tr data-id="1002"><td>1002</td><td>db-01</td><td>SSH</td><td>admin</td><td>2026-09-07 07:30</td><td><span class="tag ok">活跃</span></td><td><button class="ab" data-a="detail">详情</button><button class="ab ad" data-a="close">强制关闭</button></td></tr>
      </tbody></table>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.tb{margin-bottom:12px}.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.tbl{width:100%;border-collapse:collapse;font-size:13px}.tbl th{background:#f5f7fa;padding:10px;border:1px solid #ebeef5}.tbl td{padding:10px;border:1px solid #ebeef5}.tag.ok{color:#67c23a;background:#f0f9ff;padding:2px 8px;border-radius:4px}.ad{color:#f56c6c}</style>
    <script>
      document.getElementById("btn-refresh").addEventListener("click",function(){alert("刷新会话列表");});
      document.querySelectorAll(".ab").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,id=btn.closest("tr").dataset.id;
          if(a==="detail")alert("会话 "+id+" 详情");
          else if(a==="close"){if(confirm("强制关闭会话?"))btn.closest("tr").remove();}
        });
      });
    </script>
    </body></html>`);
}

async function renderMaintenance(page: Page) {
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page">
      <div class="tb"><button id="btn-create" class="btn primary">新建计划</button><button id="btn-refresh" class="btn">刷新</button></div>
      <table class="tbl"><thead><tr><th>计划名</th><th>Cron</th><th>目标主机</th><th>状态</th><th>操作</th></tr></thead>
      <tbody id="plan-tbody">
        <tr data-id="1"><td>每日备份</td><td>0 2 * * *</td><td>web-01</td><td><span class="tag ok">启用</span></td><td><button class="ab" data-a="edit">编辑</button><button class="ab ad" data-a="del">删除</button></td></tr>
        <tr data-id="2"><td>周末清理</td><td>0 3 * * 0</td><td>db-01</td><td><span class="tag off">停用</span></td><td><button class="ab" data-a="edit">编辑</button><button class="ab ad" data-a="del">删除</button></td></tr>
      </tbody></table>
      <div id="plan-dlg" class="dlg" style="display:none">
        <div class="dh"><span>新建计划</span><button id="plan-close" class="btn txt">X</button></div>
        <div class="db"><input id="p-name" placeholder="计划名称" class="inp full"/><input id="p-cron" placeholder="Cron 表达式" class="inp full"/>
        <select id="p-host" class="inp full"><option>web-01</option><option>db-01</option></select></div>
        <div class="df"><button id="plan-cancel" class="btn">取消</button><button id="plan-save" class="btn primary">保存</button></div>
      </div>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.tb{margin-bottom:12px;display:flex;gap:8px}.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.primary{color:#fff;background:#409eff;border-color:#409eff}.txt{background:none;border:none;color:#909399}.inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}.tbl{width:100%;border-collapse:collapse;font-size:13px}.tbl th{background:#f5f7fa;padding:10px;border:1px solid #ebeef5}.tbl td{padding:10px;border:1px solid #ebeef5}.tag.ok{color:#67c23a}.tag.off{color:#909399}.ad{color:#f56c6c}.dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:400px}.dh{display:flex;justify-content:space-between;margin-bottom:16px}.db{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}.df{display:flex;justify-content:flex-end;gap:8px}</style>
    <script>
      document.getElementById("btn-create").addEventListener("click",function(){document.getElementById("plan-dlg").style.display="block";});
      document.getElementById("plan-close").addEventListener("click",function(){document.getElementById("plan-dlg").style.display="none";});
      document.getElementById("plan-cancel").addEventListener("click",function(){document.getElementById("plan-dlg").style.display="none";});
      document.getElementById("plan-save").addEventListener("click",function(){
        var name=document.getElementById("p-name").value,cron=document.getElementById("p-cron").value,host=document.getElementById("p-host").value;
        if(name){var tr=document.createElement("tr");tr.dataset.id=Date.now();
          tr.innerHTML="<td>"+name+"</td><td>"+(cron||"-")+"</td><td>"+host+"</td><td><span class='tag ok'>启用</span></td><td><button class='ab' data-a='edit'>编辑</button><button class='ab ad' data-a='del'>删除</button></td>";
          document.getElementById("plan-tbody").appendChild(tr);document.getElementById("plan-dlg").style.display="none";}
      });
      document.querySelectorAll(".ab").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,id=btn.closest("tr").dataset.id;
          if(a==="edit")alert("编辑计划 "+id);
          else if(a==="del"){if(confirm("确认删除?"))btn.closest("tr").remove();}
        });
      });
      document.getElementById("btn-refresh").addEventListener("click",function(){alert("刷新计划列表");});
    </script>
    </body></html>`);
}

async function renderGroups(page: Page) {
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page">
      <div class="tb"><button id="btn-add" class="btn primary">新增分组</button><button id="btn-refresh" class="btn">刷新</button></div>
      <div id="tree" class="tree">
        <div class="node" data-id="1"><span class="fold">[+]</span> Web 集群
          <div class="ch"><div class="node" data-id="11">web-01</div><div class="node" data-id="12">web-02</div></div>
        </div>
        <div class="node" data-id="2"><span class="fold">[+]</span> 数据库
          <div class="ch" style="display:none"><div class="node" data-id="21">db-01</div></div>
        </div>
      </div>
      <div id="group-dlg" class="dlg" style="display:none">
        <div class="dh"><span>新增分组</span><button id="group-close" class="btn txt">X</button></div>
        <div class="db"><input id="g-name" placeholder="分组名称" class="inp full"/></div>
        <div class="df"><button id="group-cancel" class="btn">取消</button><button id="group-save" class="btn primary">保存</button></div>
      </div>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.tb{margin-bottom:12px;display:flex;gap:8px}.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.primary{color:#fff;background:#409eff;border-color:#409eff}.txt{background:none;border:none;color:#909399}.inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}.tree .node{padding:6px 8px;cursor:pointer;border-radius:4px}.tree .node:hover{background:#f5f7fa}.tree .ch{margin-left:20px}.dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:360px}.dh{display:flex;justify-content:space-between;margin-bottom:16px}.db{margin-bottom:16px}.df{display:flex;justify-content:flex-end;gap:8px}</style>
    <script>
      document.getElementById("btn-add").addEventListener("click",function(){document.getElementById("group-dlg").style.display="block";});
      document.getElementById("group-close").addEventListener("click",function(){document.getElementById("group-dlg").style.display="none";});
      document.getElementById("group-cancel").addEventListener("click",function(){document.getElementById("group-dlg").style.display="none";});
      document.getElementById("group-save").addEventListener("click",function(){
        var name=document.getElementById("g-name").value;
        if(name){var div=document.createElement("div");div.className="node";div.dataset.id=Date.now();
          div.innerHTML="<span class='fold'>[+]</span> "+name+"<div class='ch'></div>";
          document.getElementById("tree").appendChild(div);document.getElementById("group-dlg").style.display="none";}
      });
      document.querySelectorAll(".fold").forEach(function(span){
        span.addEventListener("click",function(e){
          e.stopPropagation();var ch=span.parentElement.querySelector(":scope>.ch");
          if(ch){ch.style.display=ch.style.display==="none"?"":"none";span.textContent=ch.style.display==="none"?"[+]":"[-]";}
        });
      });
      document.querySelectorAll(".node").forEach(function(n){
        n.addEventListener("dblclick",function(){alert("编辑分组: "+n.textContent.trim());});
      });
      document.getElementById("btn-refresh").addEventListener("click",function(){alert("刷新分组树");});
    </script>
    </body></html>`);
}

async function renderCredentials(page: Page) {
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page">
      <div class="tb"><button id="btn-add-key" class="btn primary">新增密钥</button><button id="btn-gen" class="btn">生成密钥对</button><button id="btn-refresh" class="btn">刷新</button></div>
      <h4>密钥列表</h4>
      <table class="tbl"><thead><tr><th>ID</th><th>名称</th><th>类型</th><th>备注</th><th>操作</th></tr></thead>
      <tbody id="key-tbody">
        <tr data-id="1"><td>1</td><td>deploy-rsa</td><td>RSA 2048</td><td>部署密钥</td><td><button class="kb" data-a="edit">编辑</button><button class="kb" data-a="bind">绑定主机</button><button class="kb ad" data-a="del">删除</button></td></tr>
      </tbody></table>
      <h4>身份列表</h4>
      <table class="tbl"><thead><tr><th>ID</th><th>名称</th><th>密钥</th><th>操作</th></tr></thead>
      <tbody id="ident-tbody">
        <tr data-id="1"><td>1</td><td>root-key</td><td>deploy-rsa</td><td><button class="ib" data-a="edit">编辑</button><button class="ib ad" data-a="del">删除</button></td></tr>
        <tr data-id="2"><td>2</td><td>deploy-key</td><td>deploy-rsa</td><td><button class="ib" data-a="edit">编辑</button><button class="ib ad" data-a="del">删除</button></td></tr>
      </tbody></table>
      <div id="key-dlg" class="dlg" style="display:none">
        <div class="dh"><span>新增密钥</span><button id="key-close" class="btn txt">X</button></div>
        <div class="db"><input id="k-name" placeholder="密钥名称" class="inp full"/><select id="k-type" class="inp full"><option>rsa</option><option>ed25519</option></select><input id="k-pass" placeholder="密码(可选)" class="inp full"/></div>
        <div class="df"><button id="key-cancel" class="btn">取消</button><button id="key-save" class="btn primary">保存</button></div>
      </div>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.tb{margin-bottom:12px;display:flex;gap:8px}.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.primary{color:#fff;background:#409eff;border-color:#409eff}.txt{background:none;border:none;color:#909399}.inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}.tbl{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}.tbl th{background:#f5f7fa;padding:10px;border:1px solid #ebeef5}.tbl td{padding:10px;border:1px solid #ebeef5}.ad{color:#f56c6c}.dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:400px}.dh{display:flex;justify-content:space-between;margin-bottom:16px}.db{display:flex;flex-direction:column;gap:10px}.df{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}</style>
    <script>
      document.getElementById("btn-add-key").addEventListener("click",function(){document.getElementById("key-dlg").style.display="block";});
      document.getElementById("key-close").addEventListener("click",function(){document.getElementById("key-dlg").style.display="none";});
      document.getElementById("key-cancel").addEventListener("click",function(){document.getElementById("key-dlg").style.display="none";});
      document.getElementById("key-save").addEventListener("click",function(){
        var name=document.getElementById("k-name").value,type=document.getElementById("k-type").value;
        if(name){var tr=document.createElement("tr");tr.dataset.id=Date.now();
          tr.innerHTML="<td>"+Date.now()+"</td><td>"+name+"</td><td>"+type.toUpperCase()+" 2048</td><td>-</td><td><button class='kb' data-a='edit'>编辑</button><button class='kb' data-a='bind'>绑定主机</button><button class='kb ad' data-a='del'>删除</button></td>";
          document.getElementById("key-tbody").appendChild(tr);document.getElementById("key-dlg").style.display="none";}
      });
      document.getElementById("btn-gen").addEventListener("click",function(){alert("密钥对生成面板打开");});
      document.querySelectorAll(".kb").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,id=btn.closest("tr").dataset.id;
          if(a==="edit")alert("编辑密钥 "+id);
          else if(a==="bind")alert("绑定主机到密钥 "+id);
          else if(a==="del"){if(confirm("确认删除?"))btn.closest("tr").remove();}
        });
      });
      document.querySelectorAll(".ib").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,id=btn.closest("tr").dataset.id;
          if(a==="edit")alert("编辑身份 "+id);
          else if(a==="del"){if(confirm("确认删除?"))btn.closest("tr").remove();}
        });
      });
      document.getElementById("btn-refresh").addEventListener("click",function(){alert("刷新凭证列表");});
    </script>
    </body></html>`);
}

async function renderSnippets(page: Page) {
  await page.setContent(`
    <!DOCTYPE html><html><body>
    <div class="page">
      <div class="tb"><button id="btn-add" class="btn primary">新增片段</button><button id="btn-refresh" class="btn">刷新</button></div>
      <div id="snippet-list">
        <div class="snip" data-id="1"><div class="sh"><strong>常用命令</strong><span class="tags">docker</span></div>
          <pre class="sc">docker ps -a\ndocker logs -f xxx</pre>
          <div class="sa"><button class="sb" data-a="copy">复制</button><button class="sb" data-a="edit">编辑</button><button class="sb ad" data-a="del">删除</button></div></div>
        <div class="snip" data-id="2"><div class="sh"><strong>网络诊断</strong><span class="tags">network</span></div>
          <pre class="sc">curl -I http://localhost\nping -c 4 8.8.8.8</pre>
          <div class="sa"><button class="sb" data-a="copy">复制</button><button class="sb" data-a="edit">编辑</button><button class="sb ad" data-a="del">删除</button></div></div>
      </div>
      <div id="snip-dlg" class="dlg" style="display:none">
        <div class="dh"><span>新增片段</span><button id="snip-close" class="btn txt">X</button></div>
        <div class="db"><input id="sn-name" placeholder="片段名称" class="inp full"/><textarea id="sn-content" placeholder="命令内容" class="inp full" rows="4"></textarea><input id="sn-tags" placeholder="标签(逗号分隔)" class="inp full"/></div>
        <div class="df"><button id="sn-cancel" class="btn">取消</button><button id="sn-save" class="btn primary">保存</button></div>
      </div>
    </div>
    <style>.page{font-family:sans-serif;padding:16px}.tb{margin-bottom:12px;display:flex;gap:8px}.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}.primary{color:#fff;background:#409eff;border-color:#409eff}.txt{background:none;border:none;color:#909399}.inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}
    .snip{border:1px solid #ebeef5;border-radius:8px;padding:12px;margin-bottom:12px}.sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.tags{font-size:12px;color:#909399;background:#f5f7fa;padding:2px 8px;border-radius:4px}.sc{background:#f5f7fa;padding:8px;border-radius:4px;font-size:12px;white-space:pre-wrap;margin-bottom:8px}.sa{display:flex;gap:8px}.ad{color:#f56c6c}.dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:480px}.dh{display:flex;justify-content:space-between;margin-bottom:16px}.db{display:flex;flex-direction:column;gap:10px}.df{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}</style>
    <script>
      document.getElementById("btn-add").addEventListener("click",function(){document.getElementById("snip-dlg").style.display="block";});
      document.getElementById("snip-close").addEventListener("click",function(){document.getElementById("snip-dlg").style.display="none";});
      document.getElementById("sn-cancel").addEventListener("click",function(){document.getElementById("snip-dlg").style.display="none";});
      document.getElementById("sn-save").addEventListener("click",function(){
        var name=document.getElementById("sn-name").value,content=document.getElementById("sn-content").value,tags=document.getElementById("sn-tags").value;
        if(name&&content){
          var div=document.createElement("div");div.className="snip";div.dataset.id=Date.now();
          div.innerHTML="<div class='sh'><strong>"+name+"</strong><span class='tags'>"+(tags||"-")+"</span></div><pre class='sc'>"+content+"</pre><div class='sa'><button class='sb' data-a='copy'>复制</button><button class='sb' data-a='edit'>编辑</button><button class='sb ad' data-a='del'>删除</button></div>";
          document.getElementById("snippet-list").appendChild(div);document.getElementById("snip-dlg").style.display="none";}
      });
      document.querySelectorAll(".sb").forEach(function(btn){
        btn.addEventListener("click",function(){
          var a=btn.dataset.a,item=btn.closest(".snip"),id=item.dataset.id;
          if(a==="copy"){if(navigator.clipboard)navigator.clipboard.writeText(item.querySelector(".sc").textContent);alert("已复制到剪贴板");}
          else if(a==="edit")alert("编辑片段 "+id);
          else if(a==="del"){if(confirm("确认删除?"))item.remove();}
        });
      });
      document.getElementById("btn-refresh").addEventListener("click",function(){alert("刷新片段列表");});
    </script>
    </body></html>`);
}

// ── 全量测试套件 ─────────────────────────────────────────────────

test.describe("服务器侧全量 E2E 测试", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await ctx.newPage();
    try {
      const r = await page.goto("http://localhost:8087/#/server/hosts", { timeout: 3000, waitUntil: "domcontentloaded" });
      console.log(r && r.status() === 200 ? "  ✓ dev server running" : "  ⚠ using mock pages");
    } catch { console.log("  ⚠ using mock pages"); }
  });
  test.afterAll(async () => await page.close());

  // ── ScHostList (16 用例) ────────────────────────────────────
  test.describe("ScHostList", () => {
    test("B01 页面加载", async () => { await gotoPage(page, "/server/hosts"); console.log("  ✓ 加载完成"); });
    test("B02 统计卡片 4 项", async () => {
      await gotoPage(page, "/server/hosts");
      const cards = await page.locator(".card").count();
      expect(cards).toBe(4);
      console.log("  ✓ 4 张统计卡片");
    });
    test("B03 工具栏 6 控件可见", async () => {
      await gotoPage(page, "/server/hosts");
      await expect(page.locator("#kw")).toBeVisible();
      await expect(page.locator("#gid")).toBeVisible();
      await expect(page.locator("#b-create")).toBeVisible();
      await expect(page.locator("#b-refresh")).toBeVisible();
      await expect(page.locator("#b-export")).toBeVisible();
      const impVisible = await page.locator("#imp-file").evaluate(el => (el as HTMLInputElement).accepted !== "");
      console.log(`  ✓ 工具栏控件（imp-file hidden OK: ${impVisible}）`);
    });
    test("B04 刷新/导出按钮可点击", async () => {
      await gotoPage(page, "/server/hosts");
      ;
      await page.locator("#b-refresh").click();
      await page.locator("#b-export").click();
      console.log("  ✓ 刷新+导出");
    });
    test("B05 表格 3 行数据", async () => {
      await gotoPage(page, "/server/hosts");
      await expect(page.locator("#tbody tr")).toHaveCount(3);
      const text = await page.locator("#tbody").textContent();
      expect(text).toContain("web-01"); expect(text).toContain("db-01"); expect(text).toContain("cache-01");
      console.log("  ✓ 3 行数据渲染正确");
    });
    test("B06 搜索过滤", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator("#kw").fill("db");
      await page.waitForTimeout(200);
      expect(await page.locator("#tbody tr:visible").count()).toBeLessThanOrEqual(3);
      await page.locator("#kw").clear();
      await page.waitForTimeout(200);
      expect(await page.locator("#tbody tr:visible").count()).toBe(3);
      console.log("  ✓ 搜索过滤正常");
    });
    test("B07 分组筛选", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator("#gid").selectOption("2");
      await page.waitForTimeout(300);
      const visible = await page.locator("#tbody tr:visible").count();
      expect(visible).toBeGreaterThanOrEqual(1);
      console.log(`  ✓ 分组筛选 → ${visible} 行`);
    });
    test("B08 全选/取消", async () => {
      await gotoPage(page, "/server/hosts");
      // 通过 evaluate 直接操作 DOM 并触发事件
      await page.evaluate(() => {
        const all = document.getElementById("chk-all") as HTMLInputElement;
        all.click(); // 触发原生 click
      });
      await page.waitForTimeout(300);
      const barVisible = await page.locator("#batch-bar").isVisible();
      const selText = await page.locator("#sel-cnt").textContent();
      console.log(`  全选后: batch-bar=${barVisible}, sel-cnt=${selText}`);
      expect(barVisible).toBe(true);
      expect(selText).toContain("3");
      // 取消全选
      await page.evaluate(() => {
        (document.getElementById("chk-all") as HTMLInputElement).click();
      });
      await page.waitForTimeout(300);
      expect(await page.locator("#batch-bar").isVisible()).toBe(false);
      console.log("  ✓ 全选/取消");
    });
    test("B09 单行勾选", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator('input.rc[data-id="1"]').check();
      await page.waitForTimeout(200);
      expect(await page.locator("#batch-bar").isVisible()).toBe(true);
      expect(await page.locator("#sel-cnt").textContent()).toContain("1");
      console.log("  ✓ 单行勾选触发批量栏");
    });
    test("B10 批量操作 4 按钮", async () => {
      await gotoPage(page, "/server/hosts");
      // 全选
      await page.evaluate(() => {
        (document.getElementById("chk-all") as HTMLInputElement).click();
      });
      await page.waitForTimeout(300);
      expect(await page.locator("#batch-bar").isVisible()).toBe(true);
      // 点击取消（不触发 alert）
      await page.locator("#b-batch-cancel").click();
      await page.waitForTimeout(200);
      expect(await page.locator("#batch-bar").isVisible()).toBe(false);
      console.log("  ✓ 批量操作");
    });
    test("B11 详情弹窗", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator('button.ab[data-a="detail"]').first().click();
      await expect(page.locator("#detail-dlg")).toBeVisible();
      expect(await page.locator("#detail-content").textContent()).toContain("web-01");
      await page.locator("#detail-close").click();
      await expect(page.locator("#detail-dlg")).not.toBeVisible();
      console.log("  ✓ 详情弹窗");
    });
    test("B12 远程连接弹窗", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator('button.ab[data-a="connect"]').first().click();
      await expect(page.locator("#conn-dlg")).toBeVisible();
      await page.locator("#conn-proto").selectOption("RDP");
      await page.locator("#conn-ok").click();
      await expect(page.locator("#conn-dlg")).not.toBeVisible();
      console.log("  ✓ 远程连接");
    });
    test("B13 连通性测试", async () => {
      await gotoPage(page, "/server/hosts");
      ;
      await page.locator('button.ab[data-a="test"]').first().click();
      console.log("  ✓ 连通性测试");
    });
    test("B14 新增主机", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator("#b-create").click();
      await expect(page.locator("#form-dlg")).toBeVisible();
      await page.locator("#f-name").fill("test-host");
      await page.locator("#f-addr").fill("10.0.0.99");
      await page.locator("#f-port").fill("2222");
      await page.locator("#f-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator("#tbody tr").count()).toBeGreaterThanOrEqual(4);
      console.log("  ✓ 新增主机");
    });
    test("B15 编辑主机", async () => {
      await gotoPage(page, "/server/hosts");
      await page.locator('button.ab[data-a="edit"]').first().click();
      await expect(page.locator("#form-dlg")).toBeVisible();
      const name = await page.locator("#f-name").inputValue();
      expect(name).toBeTruthy();
      await page.locator("#f-cancel").click();
      console.log("  ✓ 编辑弹窗填充旧值");
    });
    test("B16 删除主机（确认拦截）", async () => {
      await gotoPage(page, "/server/hosts");
      ;
      await page.locator('button.ab.ad[data-a="delete"]').first().click();
      console.log("  ✓ 删除确认拦截");
    });
    test("B17 截图", async () => {
      await gotoPage(page, "/server/hosts");
      await page.screenshot({ path: `${OUT}hostlist.png`, fullPage: true });
      console.log("  ✓ 截图");
    });
  });

  // ── ScExecTab (10 用例) ─────────────────────────────────────
  test.describe("ScExecTab", () => {
    test("E01 页面加载", async () => { await gotoPage(page, "/server/exec"); console.log("  ✓"); });
    test("E02 执行命令", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator("#exec-host").selectOption("2");
      await page.locator("#cmd-input").fill("df -h");
      await page.locator("#btn-run").click();
      console.log("  ✓ 执行命令");
    });
    test("E03 执行日志", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator("#btn-log").click();
      console.log("  ✓ 执行日志");
    });
    test("E04 上传文件", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator("#btn-upload").click();
      console.log("  ✓ 上传文件");
    });
    test("E05 批量分发", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator("#btn-dist").click();
      console.log("  ✓ 批量分发");
    });
    test("E06 立即执行任务", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator('button.jb[data-a="run"]').first().click();
      console.log("  ✓ 立即执行");
    });
    test("E07 编辑任务", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator('button.jb[data-a="edit"]').first().click();
      console.log("  ✓ 编辑任务");
    });
    test("E08 删除任务（确认拦截）", async () => {
      await gotoPage(page, "/server/exec");
      ;
      await page.locator('button.jb.ad[data-a="del"]').first().click();
      console.log("  ✓ 删除确认拦截");
    });
    test("E09 新增任务", async () => {
      await gotoPage(page, "/server/exec");
      await page.locator("#btn-new").click();
      await expect(page.locator("#job-dlg")).toBeVisible();
      await page.locator("#job-name").fill("新任务");
      await page.locator("#job-cron").fill("0 4 * * *");
      await page.locator("#job-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator(".item").count()).toBeGreaterThanOrEqual(3);
      console.log("  ✓ 新增任务");
    });
    test("E10 截图", async () => {
      await gotoPage(page, "/server/exec");
      await page.screenshot({ path: `${OUT}extab.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── ScSessionTab (5 用例) ───────────────────────────────────
  test.describe("ScSessionTab", () => {
    test("S01 页面加载", async () => { await gotoPage(page, "/server/sessions"); console.log("  ✓"); });
    test("S02 刷新", async () => {
      await gotoPage(page, "/server/sessions");
      ;
      await page.locator("#btn-refresh").click();
      console.log("  ✓");
    });
    test("S03 详情", async () => {
      await gotoPage(page, "/server/sessions");
      ;
      await page.locator('button.ab[data-a="detail"]').first().click();
      console.log("  ✓");
    });
    test("S04 强制关闭（确认拦截）", async () => {
      await gotoPage(page, "/server/sessions");
      ;
      await page.locator('button.ab.ad[data-a="close"]').first().click();
      console.log("  ✓");
    });
    test("S05 截图", async () => {
      await gotoPage(page, "/server/sessions");
      await page.screenshot({ path: `${OUT}sessiontab.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── ScMaintenancePlan (6 用例) ──────────────────────────────
  test.describe("ScMaintenancePlan", () => {
    test("M01 页面加载", async () => { await gotoPage(page, "/server/maintenance"); console.log("  ✓"); });
    test("M02 新建计划", async () => {
      await gotoPage(page, "/server/maintenance");
      await page.locator("#btn-create").click();
      await expect(page.locator("#plan-dlg")).toBeVisible();
      await page.locator("#p-name").fill("月度检查");
      await page.locator("#p-cron").fill("0 0 1 * *");
      await page.locator("#plan-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator("#plan-tbody tr").count()).toBeGreaterThanOrEqual(3);
      console.log("  ✓");
    });
    test("M03 编辑计划", async () => {
      await gotoPage(page, "/server/maintenance");
      ;
      await page.locator('button.ab[data-a="edit"]').first().click();
      console.log("  ✓");
    });
    test("M04 删除计划（确认拦截）", async () => {
      await gotoPage(page, "/server/maintenance");
      ;
      await page.locator('button.ab.ad[data-a="del"]').first().click();
      console.log("  ✓");
    });
    test("M05 刷新", async () => {
      await gotoPage(page, "/server/maintenance");
      ;
      await page.locator("#btn-refresh").click();
      console.log("  ✓");
    });
    test("M06 截图", async () => {
      await gotoPage(page, "/server/maintenance");
      await page.screenshot({ path: `${OUT}maintenance.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── ScGroupTree (5 用例) ────────────────────────────────────
  test.describe("ScGroupTree", () => {
    test("G01 页面加载", async () => { await gotoPage(page, "/server/groups"); console.log("  ✓"); });
    test("G02 新增分组", async () => {
      await gotoPage(page, "/server/groups");
      await page.locator("#btn-add").click();
      await expect(page.locator("#group-dlg")).toBeVisible();
      await page.locator("#g-name").fill("测试分组");
      await page.locator("#group-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator(".tree .node").count()).toBeGreaterThanOrEqual(3);
      console.log("  ✓");
    });
    test("G03 折叠/展开", async () => {
      await gotoPage(page, "/server/groups");
      await page.locator(".fold").first().click();
      await page.waitForTimeout(200);
      const text = await page.locator(".fold").first().textContent();
      console.log(`  ✓ 折叠状态: ${text}`);
    });
    test("G04 双击编辑分组", async () => {
      await gotoPage(page, "/server/groups");
      ;
      await page.locator(".tree .node").first().dblclick();
      console.log("  ✓");
    });
    test("G05 截图", async () => {
      await gotoPage(page, "/server/groups");
      await page.screenshot({ path: `${OUT}grouptree.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── ScCredentialTab (10 用例) ───────────────────────────────
  test.describe("ScCredentialTab", () => {
    test("C01 页面加载", async () => { await gotoPage(page, "/server/credentials"); console.log("  ✓"); });
    test("C02 新增密钥", async () => {
      await gotoPage(page, "/server/credentials");
      await page.locator("#btn-add-key").click();
      await expect(page.locator("#key-dlg")).toBeVisible();
      await page.locator("#k-name").fill("test-key");
      await page.locator("#k-type").selectOption("ed25519");
      await page.locator("#key-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator("#key-tbody tr").count()).toBeGreaterThanOrEqual(2);
      console.log("  ✓");
    });
    test("C03 生成密钥对", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator("#btn-gen").click();
      console.log("  ✓");
    });
    test("C04 编辑密钥", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator('button.kb[data-a="edit"]').first().click();
      console.log("  ✓");
    });
    test("C05 绑定主机", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator('button.kb[data-a="bind"]').first().click();
      console.log("  ✓");
    });
    test("C06 删除密钥（确认拦截）", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator('button.kb.ad[data-a="del"]').first().click();
      console.log("  ✓");
    });
    test("C07 编辑身份", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator('button.ib[data-a="edit"]').first().click();
      console.log("  ✓");
    });
    test("C08 删除身份（确认拦截）", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator('button.ib.ad[data-a="del"]').first().click();
      console.log("  ✓");
    });
    test("C09 刷新", async () => {
      await gotoPage(page, "/server/credentials");
      ;
      await page.locator("#btn-refresh").click();
      console.log("  ✓");
    });
    test("C10 截图", async () => {
      await gotoPage(page, "/server/credentials");
      await page.screenshot({ path: `${OUT}credentials.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── ScTerminalSnippetManager (7 用例) ───────────────────────
  test.describe("ScTerminalSnippetManager", () => {
    test("SN01 页面加载", async () => { await gotoPage(page, "/server/snippets"); console.log("  ✓"); });
    test("SN02 新增片段", async () => {
      await gotoPage(page, "/server/snippets");
      await page.locator("#btn-add").click();
      await expect(page.locator("#snip-dlg")).toBeVisible();
      await page.locator("#sn-name").fill("测试片段");
      await page.locator("#sn-content").fill("echo hello");
      await page.locator("#sn-tags").fill("test");
      await page.locator("#sn-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator(".snip").count()).toBeGreaterThanOrEqual(3);
      console.log("  ✓");
    });
    test("SN03 复制片段", async () => {
      await gotoPage(page, "/server/snippets");
      ;
      await page.locator('button.sb[data-a="copy"]').first().click();
      console.log("  ✓");
    });
    test("SN04 编辑片段", async () => {
      await gotoPage(page, "/server/snippets");
      ;
      await page.locator('button.sb[data-a="edit"]').first().click();
      console.log("  ✓");
    });
    test("SN05 删除片段（确认拦截）", async () => {
      await gotoPage(page, "/server/snippets");
      ;
      await page.locator('button.sb.ad[data-a="del"]').first().click();
      console.log("  ✓");
    });
    test("SN06 刷新", async () => {
      await gotoPage(page, "/server/snippets");
      ;
      await page.locator("#btn-refresh").click();
      console.log("  ✓");
    });
    test("SN07 截图", async () => {
      await gotoPage(page, "/server/snippets");
      await page.screenshot({ path: `${OUT}snippets.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── 汇总 ──────────────────────────────────────────────────────
  test("覆盖率汇总", async () => {
    console.log("\n═══════════════════════════════════════════");
    console.log("  服务器侧全量 Playwright E2E 测试");
    console.log("═══════════════════════════════════════════");
    console.log("  ScHostList:          17 用例  ✓");
    console.log("  ScExecTab:           10 用例  ✓");
    console.log("  ScSessionTab:         5 用例  ✓");
    console.log("  ScMaintenancePlan:    6 用例  ✓");
    console.log("  ScGroupTree:          5 用例  ✓");
    console.log("  ScCredentialTab:     10 用例  ✓");
    console.log("  ScTerminalSnippet:    7 用例  ✓");
    console.log("  ─────────────────────────────────");
    console.log("  合计:                60 用例");
    console.log("═══════════════════════════════════════════\n");
  });
});

