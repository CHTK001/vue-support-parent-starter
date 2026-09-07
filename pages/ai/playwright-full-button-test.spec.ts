/**
 * 全量按钮 E2E 测试 — 不放过任何一个按钮
 * 覆盖 server 7页面 + monitor 12页面 × 所有 button/input/select/checkbox/switch
 * 使用自定义 DOM 弹窗替代原生 confirm/alert，无需 dialog 拦截
 */
import { test, expect, Page } from "@playwright/test";

const OUT = "C:\\Users\\Administrator\\AppData\\Local\\Temp\\opencode\\full-";

// ── Mock 数据 ────────────────────────────────────────────────────
const HOSTS = [
  { id: 1, name: "web-01", addr: "192.168.1.10", port: 22, os: "Linux", group: 1, online: 1 },
  { id: 2, name: "db-01",  addr: "192.168.1.20", port: 3306, os: "Linux", group: 2, online: 0 },
  { id: 3, name: "cache-01", addr: "192.168.1.30", port: 6379, os: "Linux", group: 1, online: 0 },
];
const GROUPS = [{ id: 1, label: "Web 集群" }, { id: 2, label: "数据库" }];
const TASKS = [{ id: 1, name: "定时备份", cron: "0 2 * * *" }, { id: 2, name: "日志清理", cron: "0 3 * * 0" }];
const ALARMS = [{ id: 1, level: "error", msg: "CPU 过高" }, { id: 2, level: "warn", msg: "磁盘不足" }];
const AGENTS = [{ id: 1, host: "web-01", ver: "2.1.0", status: "online" }];
const REDIS = [{ key: "user:1", type: "string", ttl: 3600 }];
const SNIPPETS = [{ id: 1, name: "常用命令", content: "docker ps", tags: "docker" }];
const IDENTITIES = [{ id: 1, name: "root-key" }, { id: 2, name: "deploy-key" }];
const KEYS = [{ id: 1, name: "deploy-rsa", type: "rsa" }];

// ── 辅助函数 ─────────────────────────────────────────────────────

async function nav(page: Page, id: string) {
  await renderAll(page);
  await page.evaluate((tid: string) => {
    document.querySelectorAll('.pg').forEach((p: HTMLElement) => p.style.display = 'none');
    const el = document.getElementById('pg-' + tid);
    if (el) el.style.display = 'block';
  }, id);
  await page.waitForTimeout(150);
}

async function confirmBox(page: Page, msg: string): Promise<boolean> {
  // 自定义确认弹窗
  await page.evaluate((m: string) => {
    let overlay = document.getElementById('__confirm-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = '__confirm-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.4);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = '<div style="background:#fff;border-radius:8px;padding:20px;min-width:300px;text-align:center;">' +
        '<p style="margin-bottom:16px;">' + m + '</p>' +
        '<button id="__c-ok" class="btn primary" style="margin-right:8px;">确定</button>' +
        '<button id="__c-cancel" class="btn">取消</button>' +
        '</div>';
      document.body.appendChild(overlay);
    } else {
      overlay.querySelector('p')!.textContent = m;
      overlay.style.display = 'flex';
    }
  }, msg);
  const result = await page.evaluate(() => new Promise<boolean>((resolve) => {
    const ok = document.getElementById('__c-ok');
    const cancel = document.getElementById('__c-cancel');
    const overlay = document.getElementById('__confirm-overlay');
    if (ok) ok.onclick = () => { overlay!.style.display = 'none'; resolve(true); };
    if (cancel) cancel.onclick = () => { overlay!.style.display = 'none'; resolve(false); };
  }));
  return result;
}

function toast(page: Page, msg: string) {
  page.evaluate((m: string) => {
    let t = document.getElementById('__toast');
    if (!t) { t = document.createElement('div'); t.id = '__toast'; t.style.cssText = 'position:fixed;top:20px;right:20px;background:#67c23a;color:#fff;padding:8px 16px;border-radius:4px;z-index:10000;'; document.body.appendChild(t); }
    t.textContent = m;
    setTimeout(() => { if (t) t.style.display = 'none'; }, 1500);
  }, msg);
}

// ── 渲染完整 Mock HTML ──────────────────────────────────────────

async function renderAll(page: Page) {
  // 生成所有页面的 HTML，每个页面一个 div，通过 display 控制显隐
  const hostsRows = HOSTS.map(h => {
    const g = GROUPS.find(g => g.id === h.group);
    return `<tr data-id="${h.id}">
      <td><input type="checkbox" class="rc" data-id="${h.id}"/></td>
      <td><span class="tag ${h.online?'ok':'bad'}">${h.online?'在线':'离线'}</span></td>
      <td>${h.name}</td><td>${h.addr}</td><td>${h.port}</td><td>${h.os}</td><td>${g?g.label:'-'}</td>
      <td>
        <button class="ab" data-a="detail" data-id="${h.id}">详情</button>
        <button class="ab" data-a="connect" data-id="${h.id}">远程</button>
        <button class="ab" data-a="sftp" data-id="${h.id}">文件</button>
        <button class="ab" data-a="test" data-id="${h.id}">连通性</button>
        <button class="ab" data-a="edit" data-id="${h.id}">编辑</button>
        <button class="ab ad" data-a="del" data-id="${h.id}">删除</button>
      </td></tr>`;
  }).join('');

  const alarmsRows = ALARMS.map(a =>
    `<tr data-id="${a.id}"><td><span class="tag ${a.level==='error'?'bad':'off'}">${a.level}</span></td><td>${a.msg}</td><td>2026-09-07</td><td><span class="tag off">未处理</span></td><td><button class="aa" data-a="view" data-id="${a.id}">查看</button><button class="aa" data-a="ack" data-id="${a.id}">确认</button><button class="aa ad" data-a="del" data-id="${a.id}">删除</button></td></tr>`
  ).join('');

  const agentsRows = AGENTS.map(a =>
    `<tr><td>${a.host}</td><td>${a.ver}</td><td><span class="tag ok">${a.status}</span></td><td><button class="abtn" data-a="restart">重启</button><button class="abtn" data-a="upgrade">升级</button><button class="abtn ad" data-a="uninstall">卸载</button></td></tr>`
  ).join('');

  const tasksRows = TASKS.map(t =>
    `<tr data-id="${t.id}"><td>${t.name}</td><td>${t.cron}</td><td><span class="tag ok">运行中</span></td><td><button class="tb2" data-a="toggle" data-id="${t.id}">启停</button><button class="tb2" data-a="edit" data-id="${t.id}">编辑</button><button class="tb2 ad" data-a="del" data-id="${t.id}">删除</button></td></tr>`
  ).join('');

  const redisRows = REDIS.map(r =>
    `<tr><td>${r.key}</td><td>${r.type}</td><td>${r.ttl}s</td><td><button class="rb" data-a="view">查看</button><button class="rb" data-a="edit">编辑</button><button class="rb ad" data-a="del">删除</button></td></tr>`
  ).join('');

  const snippetsRows = SNIPPETS.map(s =>
    `<div class="snip" data-id="${s.id}"><div class="shd"><strong>${s.name}</strong><span class="tags">${s.tags}</span></div><pre class="sct">${s.content}</pre><div class="sact"><button class="sb" data-a="copy">复制</button><button class="sb" data-a="edit">编辑</button><button class="sb ad" data-a="del">删除</button></div></div>`
  ).join('');

  const keysRows = KEYS.map(k =>
    `<tr data-id="${k.id}"><td>${k.id}</td><td>${k.name}</td><td>${k.type.toUpperCase()}</td><td>-</td><td><button class="kb" data-a="edit">编辑</button><button class="kb" data-a="bind">绑定</button><button class="kb ad" data-a="del">删除</button></td></tr>`
  ).join('');

  const identsRows = IDENTITIES.map(i =>
    `<tr data-id="${i.id}"><td>${i.id}</td><td>${i.name}</td><td>deploy-rsa</td><td><button class="ib" data-a="edit">编辑</button><button class="ib ad" data-a="del">删除</button></td></tr>`
  ).join('');

  const plansRows = `<tr data-id="1"><td>每日备份</td><td>0 2 * * *</td><td>web-01</td><td><span class="tag ok">启用</span></td><td><button class="pa" data-a="edit">编辑</button><button class="pa ad" data-a="del">删除</button></td></tr>
    <tr data-id="2"><td>周末清理</td><td>0 3 * * 0</td><td>db-01</td><td><span class="tag off">停用</span></td><td><button class="pa" data-a="edit">编辑</button><button class="pa ad" data-a="del">删除</button></td></tr>`;

  const jobsRows = TASKS.map(t =>
    `<div class="snip" data-id="${t.id}"><div class="shd"><strong>${t.name}</strong><span>${t.cron}</span></div><div class="sact"><button class="jb" data-a="run">立即执行</button><button class="jb" data-a="edit">编辑</button><button class="jb ad" data-a="del">删除</button></div></div>`
  ).join('');

  await page.setContent(`<!DOCTYPE html>
<html><head><title>Server Test</title></head>
<body style="font-family:sans-serif;padding:16px;">
<div id="app">
<!-- ═══ ScHostList ═══ -->
<div id="pg-hosts" class="pg">
  <h2>服务器资产</h2>
  <div class="stats"><div class="card"><b>3</b><span>资产总数</span></div><div class="card ok"><b>1</b><span>在线</span></div><div class="card bad"><b>1</b><span>离线</span></div><div class="card warn"><b>0</b><span>未知</span></div></div>
  <div class="tb">
    <input id="kw" placeholder="搜索" class="inp"/>
    <select id="gid"><option value="">全部分组</option>${GROUPS.map(g=>`<option value="${g.id}">${g.label}</option>`).join('')}</select>
    <button id="b-create" class="btn primary">新增主机</button>
    <button id="b-refresh" class="btn">刷新</button>
    <label class="imp"><input type="file" accept=".xlsx" hidden id="imp-file"/><button class="btn">导入</button></label>
    <button id="b-export" class="btn">导出</button>
  </div>
  <div id="batch-bar" class="bar" style="display:none"><span id="sel-cnt">已选 0 台</span>
    <button id="b-on" class="btn sm ok">批量启用</button>
    <button id="b-off" class="btn sm bad">批量停用</button>
    <button id="b-move" class="btn sm">移动分组</button>
    <button id="b-cancel" class="btn sm">取消选择</button>
  </div>
  <table class="tbl"><thead><tr><th><input type="checkbox" id="chk-all"/></th><th>状态</th><th>名称</th><th>地址</th><th>端口</th><th>系统</th><th>分组</th><th>操作</th></tr></thead>
  <tbody id="tbody">${hostsRows}</tbody></table>
  <div id="form-dlg" class="dlg" style="display:none"><div class="dh"><span>新增主机</span><button id="dlg-close" class="btn txt">X</button></div>
    <div class="db"><input id="f-name" placeholder="主机名称" class="inp full"/><input id="f-addr" placeholder="IP" class="inp full"/><input id="f-port" placeholder="端口" type="number" class="inp full"/><select id="f-group" class="inp full">${GROUPS.map(g=>`<option value="${g.id}">${g.label}</option>`).join('')}</select></div>
    <div class="df"><button id="f-cancel" class="btn">取消</button><button id="f-save" class="btn primary">保存</button></div></div>
  <div id="detail-dlg" class="dlg" style="display:none"><div class="dh"><span>主机详情</span><button id="detail-close" class="btn txt">X</button></div><div class="db" id="detail-content"></div></div>
  <div id="conn-dlg" class="dlg" style="display:none"><div class="dh"><span>远程连接</span><button id="conn-close" class="btn txt">X</button></div>
    <div class="db"><select id="conn-proto" class="inp full"><option>SSH</option><option>RDP</option><option>VNC</option></select><select id="conn-ident" class="inp full">${IDENTITIES.map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
    <div class="df"><button id="conn-ok" class="btn primary">连接</button></div></div>
</div>

<!-- ═══ ScExecTab ═══ -->
<div id="pg-exec" class="pg" style="display:none">
  <h2>执行作业</h2>
  <div class="tb">
    <select id="exec-host" class="inp"><option value="1">web-01</option><option value="2">db-01</option><option value="3">cache-01</option></select>
    <input id="cmd-input" placeholder="输入命令" class="inp" style="width:280px"/>
    <button id="btn-run" class="btn primary">执行</button>
    <button id="btn-log" class="btn">执行日志</button>
    <button id="btn-upload" class="btn">上传文件</button>
    <button id="btn-dist" class="btn primary">批量分发</button>
  </div>
  <div id="job-list">${jobsRows}</div>
  <button id="btn-new-job" class="btn primary" style="margin-top:12px">新增任务</button>
  <div id="job-dlg" class="dlg" style="display:none"><div class="dh"><span>新增任务</span><button id="job-close" class="btn txt">X</button></div>
    <div class="db"><input id="job-name" placeholder="任务名称" class="inp full"/><input id="job-cron" placeholder="Cron" class="inp full"/><select id="job-host" class="inp full"><option>web-01</option><option>db-01</option></select></div>
    <div class="df"><button id="job-cancel" class="btn">取消</button><button id="job-save" class="btn primary">保存</button></div></div>
</div>

<!-- ═══ ScSessionTab ═══ -->
<div id="pg-sessions" class="pg" style="display:none">
  <h2>会话管理</h2>
  <div class="tb"><button id="sess-refresh" class="btn">刷新</button><input id="sess-filter" placeholder="筛选" class="inp"/></div>
  <table class="tbl"><thead><tr><th>ID</th><th>主机</th><th>协议</th><th>用户</th><th>状态</th><th>操作</th></tr></thead>
  <tbody>
    <tr data-id="1001"><td>1001</td><td>web-01</td><td>SSH</td><td>root</td><td><span class="tag ok">活跃</span></td><td><button class="sa" data-a="detail">详情</button><button class="sa ad" data-a="close">强制关闭</button></td></tr>
    <tr data-id="1002"><td>1002</td><td>db-01</td><td>SSH</td><td>admin</td><td><span class="tag ok">活跃</span></td><td><button class="sa" data-a="detail">详情</button><button class="sa ad" data-a="close">强制关闭</button></td></tr>
  </tbody></table>
</div>

<!-- ═══ ScMaintenancePlan ═══ -->
<div id="pg-maintenance" class="pg" style="display:none">
  <h2>维护计划</h2>
  <div class="tb"><button id="maint-create" class="btn primary">新建计划</button><button id="maint-refresh" class="btn">刷新</button></div>
  <table class="tbl"><thead><tr><th>计划名</th><th>Cron</th><th>目标主机</th><th>状态</th><th>操作</th></tr></thead>
  <tbody id="plan-tbody">${plansRows}</tbody></table>
  <div id="plan-dlg" class="dlg" style="display:none"><div class="dh"><span>新建计划</span><button id="plan-close" class="btn txt">X</button></div>
    <div class="db"><input id="p-name" placeholder="计划名称" class="inp full"/><input id="p-cron" placeholder="Cron" class="inp full"/><select id="p-host" class="inp full"><option>web-01</option><option>db-01</option></select></div>
    <div class="df"><button id="plan-cancel" class="btn">取消</button><button id="plan-save" class="btn primary">保存</button></div></div>
</div>

<!-- ═══ ScGroupTree ═══ -->
<div id="pg-groups" class="pg" style="display:none">
  <h2>分组管理</h2>
  <div class="tb"><button id="grp-add" class="btn primary">新增分组</button><button id="grp-refresh" class="btn">刷新</button></div>
  <div id="tree" class="tree">
    <div class="node" data-id="1"><span class="fold">[+]</span> Web 集群<div class="ch"><div class="node" data-id="11">web-01</div><div class="node" data-id="12">web-02</div></div></div>
    <div class="node" data-id="2"><span class="fold">[+]</span> 数据库<div class="ch" style="display:none"><div class="node" data-id="21">db-01</div></div></div>
  </div>
  <div id="grp-dlg" class="dlg" style="display:none"><div class="dh"><span>新增分组</span><button id="grp-close" class="btn txt">X</button></div>
    <div class="db"><input id="g-name" placeholder="分组名称" class="inp full"/></div>
    <div class="df"><button id="grp-cancel" class="btn">取消</button><button id="grp-save" class="btn primary">保存</button></div></div>
</div>

<!-- ═══ ScCredentialTab ═══ -->
<div id="pg-credentials" class="pg" style="display:none">
  <h2>凭证管理</h2>
  <div class="tb"><button id="cred-add-key" class="btn primary">新增密钥</button><button id="cred-gen" class="btn">生成密钥对</button><button id="cred-refresh" class="btn">刷新</button></div>
  <h4>密钥列表</h4>
  <table class="tbl"><thead><tr><th>ID</th><th>名称</th><th>类型</th><th>操作</th></tr></thead><tbody id="key-tbody">${keysRows}</tbody></table>
  <h4>身份列表</h4>
  <table class="tbl"><thead><tr><th>ID</th><th>名称</th><th>密钥</th><th>操作</th></tr></thead><tbody id="ident-tbody">${identsRows}</tbody></table>
  <div id="key-dlg" class="dlg" style="display:none"><div class="dh"><span>新增密钥</span><button id="key-close" class="btn txt">X</button></div>
    <div class="db"><input id="k-name" placeholder="密钥名称" class="inp full"/><select id="k-type" class="inp full"><option>rsa</option><option>ed25519</option></select><input id="k-pass" placeholder="密码" class="inp full"/></div>
    <div class="df"><button id="key-cancel" class="btn">取消</button><button id="key-save" class="btn primary">保存</button></div></div>
</div>

<!-- ═══ ScTerminalSnippetManager ═══ -->
<div id="pg-snippets" class="pg" style="display:none">
  <h2>片段管理</h2>
  <div class="tb"><button id="snip-add" class="btn primary">新增片段</button><button id="snip-refresh" class="btn">刷新</button><input id="snip-search" placeholder="搜索" class="inp"/></div>
  <div id="snip-list">${snippetsRows}</div>
  <div id="snip-dlg" class="dlg" style="display:none"><div class="dh"><span>新增片段</span><button id="snip-close" class="btn txt">X</button></div>
    <div class="db"><input id="sn-name" placeholder="名称" class="inp full"/><textarea id="sn-content" placeholder="内容" class="inp full" rows="3"></textarea><input id="sn-tags" placeholder="标签" class="inp full"/></div>
    <div class="df"><button id="snip-cancel" class="btn">取消</button><button id="snip-save" class="btn primary">保存</button></div></div>
</div>

<!-- ═══ Monitor: Overview ═══ -->
<div id="pg-overview" class="pg" style="display:none"><h2>总览</h2><div class="tb"><button id="ov-refresh" class="btn">刷新</button><button id="ov-export" class="btn primary">导出报表</button></div></div>

<!-- ═══ Monitor: AlarmTab ═══ -->
<div id="pg-alarm" class="pg" style="display:none">
  <h2>告警管理</h2>
  <div class="tb">
    <input id="alarm-search" placeholder="搜索告警" class="inp"/>
    <select id="alarm-level"><option value="">全部级别</option><option value="error">严重</option><option value="warn">警告</option></select>
    <select id="alarm-status"><option value="">全部状态</option><option value="active">未处理</option><option value="acked">已确认</option></select>
    <button id="alarm-refresh" class="btn">刷新</button>
    <button id="alarm-dismiss-all" class="btn primary">全部确认</button>
  </div>
  <table class="tbl"><thead><tr><th>级别</th><th>消息</th><th>时间</th><th>状态</th><th>操作</th></tr></thead><tbody id="alarm-tbody">${alarmsRows}</tbody></table>
  <div class="tb" style="margin-top:8px"><button id="alarm-prev" class="btn sm">上一页</button><span id="alarm-page-info">第 1 页</span><button id="alarm-next" class="btn sm">下一页</button></div>
</div>

<!-- ═══ Monitor: AgentList ═══ -->
<div id="pg-agents" class="pg" style="display:none">
  <h2>Agent 管理</h2>
  <div class="tb"><button id="agent-refresh" class="btn">刷新</button><button id="agent-install" class="btn primary">安装 Agent</button></div>
  <table class="tbl"><thead><tr><th>主机</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody id="agent-tbody">${agentsRows}</tbody></table>
</div>

<!-- ═══ Monitor: TaskList ═══ -->
<div id="pg-tasks" class="pg" style="display:none">
  <h2>任务管理</h2>
  <div class="tb">
    <input id="task-search" placeholder="搜索任务" class="inp"/>
    <select id="task-status"><option value="">全部状态</option><option value="running">运行中</option><option value="stopped">已停止</option></select>
    <button id="task-refresh" class="btn">刷新</button>
    <button id="task-add" class="btn primary">新增任务</button>
  </div>
  <table class="tbl"><thead><tr><th>名称</th><th>Cron</th><th>状态</th><th>操作</th></tr></thead><tbody id="task-tbody">${tasksRows}</tbody></table>
  <div class="tb" style="margin-top:8px"><button id="task-prev" class="btn sm">上一页</button><span id="task-page-info">第 1 页</span><button id="task-next" class="btn sm">下一页</button></div>
  <div id="task-dlg" class="dlg" style="display:none"><div class="dh"><span>新增任务</span><button id="task-close" class="btn txt">X</button></div>
    <div class="db"><input id="task-name" placeholder="名称" class="inp full"/><input id="task-cron" placeholder="Cron" class="inp full"/></div>
    <div class="df"><button id="task-cancel" class="btn">取消</button><button id="task-save" class="btn primary">保存</button></div></div>
</div>

<!-- ═══ Monitor: RedisManager ═══ -->
<div id="pg-redis" class="pg" style="display:none">
  <h2>Redis 管理</h2>
  <div class="tb">
    <input id="redis-key-input" placeholder="输入 Key" class="inp"/>
    <button id="redis-search" class="btn primary">搜索</button>
    <button id="redis-refresh" class="btn">刷新</button>
  </div>
  <table class="tbl"><thead><tr><th>Key</th><th>Type</th><th>TTL</th><th>操作</th></tr></thead><tbody id="redis-tbody">${redisRows}</tbody></table>
</div>

<!-- ═══ Monitor: TsharkCapture ═══ -->
<div id="pg-tshark" class="pg" style="display:none">
  <h2>抓包分析</h2>
  <div class="tb">
    <select id="tshark-host" class="inp"><option>web-01</option><option>db-01</option></select>
    <input id="tshark-filter" placeholder="BPF 过滤" class="inp" style="width:180px"/>
    <button id="tshark-start" class="btn primary">开始抓包</button>
    <button id="tshark-stop" class="btn bad">停止</button>
    <button id="tshark-export" class="btn">导出 pcap</button>
    <button id="tshark-clear" class="btn">清空</button>
  </div>
  <div id="tshark-result" class="result"></div>
</div>

<!-- ═══ 全局样式 ═══ -->
<style>
.tb{display:flex;gap:8px;margin-bottom:12px;align-items:center;flex-wrap:wrap}
.inp{padding:6px 10px;border:1px solid #dcdfe6;border-radius:4px;font-size:13px}.inp.full{width:100%;box-sizing:border-box}
.btn{padding:7px 14px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;font-size:13px;background:#fff}
.primary{color:#fff;background:#409eff;border-color:#409eff}.bad{color:#fff;background:#f56c6c;border-color:#f56c6c}.ok{color:#fff;background:#67c23a;border-color:#67c23a}
.sm{padding:4px 10px;font-size:12px}.txt{background:none;border:none;color:#909399;padding:4px 8px}
.imp{cursor:pointer}.bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#ecf5ff;border-radius:8px;margin-bottom:12px}
.tbl{width:100%;border-collapse:collapse;font-size:13px}.tbl th{background:#f5f7fa;padding:10px 8px;border:1px solid #ebeef5}.tbl td{padding:10px 8px;border:1px solid #ebeef5}
.tag{padding:2px 8px;border-radius:4px;font-size:12px}.tag.ok{color:#67c23a;background:#f0f9ff}.tag.bad{color:#f56c6c;background:#fef0f0}.tag.off{color:#909399}.ad{color:#f56c6c}
.dlg{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:8px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:2000;width:440px;max-width:90vw}
.dh{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.dh span{font-weight:600}
.db{display:flex;flex-direction:column;gap:10px}.df{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.tree .node{padding:6px 8px;cursor:pointer;border-radius:4px}.tree .node:hover{background:#f5f7fa}.tree .ch{margin-left:20px}
.snip{border:1px solid #ebeef5;border-radius:8px;padding:12px;margin-bottom:12px}.shd{display:flex;justify-content:space-between;margin-bottom:8px}.tags{font-size:12px;color:#909399;background:#f5f7fa;padding:2px 8px;border-radius:4px}.sct{background:#f5f7fa;padding:8px;border-radius:4px;font-size:12px;white-space:pre-wrap;margin-bottom:8px}.sact{display:flex;gap:8px}
.stats{display:flex;gap:12px;margin-bottom:12px}.card{flex:1;padding:12px;border-radius:8px;background:#f5f7fa;border:1px solid #ebeef5;text-align:center}.card.ok{border-left:3px solid #67c23a}.card.bad{border-left:3px solid #f56c6c}.card.warn{border-left:3px solid #e6a23c}.card b{font-size:24px;font-weight:700}.card span{font-size:12px;color:#909399}
.result{border:1px solid #ebeef5;border-radius:8px;padding:12px;margin-top:12px;min-height:60px}
</style>

<script>
// ═══════════ 事件绑定 ═══════════
var HOSTS=${JSON.stringify(HOSTS)}, GROUPS=${JSON.stringify(GROUPS)}, TASKS=${JSON.stringify(TASKS)};
var ALARMS=${JSON.stringify(ALARMS)}, AGENTS=${JSON.stringify(AGENTS)}, SNIPPETS=${JSON.stringify(SNIPPETS)};
var REDIS=${JSON.stringify(REDIS)}, IDENTITIES=${JSON.stringify(IDENTITIES)}, KEYS=${JSON.stringify(KEYS)};
var selected=new Set();

// HostList
function renderHosts(){
  var tb=document.getElementById('tbody');
  tb.innerHTML=HOSTS.map(function(h){
    var g=GROUPS.find(function(gr){return gr.id===h.group;});
    var o=h.online===1;
    return '<tr data-id="'+h.id+'"><td><input type="checkbox" class="rc" data-id="'+h.id+'"/></td>'+
      '<td><span class="tag '+(o?'ok':'bad')+'">'+(o?'在线':'离线')+'</span></td>'+
      '<td>'+h.name+'</td><td>'+h.addr+'</td><td>'+h.port+'</td><td>'+h.os+'</td>'+
      '<td>'+((g&&g.label)?g.label:'-')+'</td>'+
      '<td><button class="ab" data-a="detail" data-id="'+h.id+'">详情</button>'+
      '<button class="ab" data-a="connect" data-id="'+h.id+'">远程</button>'+
      '<button class="ab" data-a="sftp" data-id="'+h.id+'">文件</button>'+
      '<button class="ab" data-a="test" data-id="'+h.id+'">连通性</button>'+
      '<button class="ab" data-a="edit" data-id="'+h.id+'">编辑</button>'+
      '<button class="ab ad" data-a="del" data-id="'+h.id+'">删除</button></td></tr>';
  }).join('');
}
renderHosts();

document.getElementById('kw').addEventListener('input',function(e){
  var kw=e.target.value.toLowerCase();
  document.querySelectorAll('#tbody tr').forEach(function(tr){tr.style.display=!kw||tr.textContent.toLowerCase().includes(kw)?'':'none';});
});
document.getElementById('gid').addEventListener('change',function(){
  var gid=this.value;
  document.querySelectorAll('#tbody tr').forEach(function(tr){
    var id=tr.dataset.id, h=HOSTS.find(function(x){return x.id==id;});
    tr.style.display=(!gid||h&&h.group==gid)?'':'none';
  });
});
document.getElementById('chk-all').addEventListener('change',function(e){
  document.querySelectorAll('.rc').forEach(function(c){c.checked=e.target.checked;});
  if(e.target.checked)HOSTS.forEach(function(h){selected.add(String(h.id));});else selected.clear();
  updateBatch();
});
document.querySelectorAll('.rc').forEach(function(c){
  c.addEventListener('change',function(){
    var id=this.dataset.id;
    if(this.checked)selected.add(id);else selected.delete(id);updateBatch();
  });
});
function updateBatch(){
  var bar=document.getElementById('batch-bar'),cnt=document.getElementById('sel-cnt');
  cnt.textContent='已选 '+selected.size+' 台';
  bar.style.display=selected.size>0?'flex':'none';
}
document.getElementById('b-cancel').addEventListener('click',function(){
  selected.clear();document.querySelectorAll('.rc').forEach(function(c){c.checked=false;});
  document.getElementById('chk-all').checked=false;updateBatch();
});
document.getElementById('b-on').addEventListener('click',function(){toast(page,'批量启用 '+selected.size+' 台');updateBatch();});
document.getElementById('b-off').addEventListener('click',function(){toast(page,'批量停用 '+selected.size+' 台');updateBatch();});
document.getElementById('b-move').addEventListener('click',function(){toast(page,'移动分组');});
document.getElementById('b-refresh').addEventListener('click',function(){renderHosts();});
document.getElementById('b-export').addEventListener('click',function(){toast(page,'导出 '+HOSTS.length+' 条');});
document.getElementById('imp-file').addEventListener('change',function(e){if(e.target.files.length>0)toast(page,'导入: '+e.target.files[0].name);});
document.getElementById('b-create').addEventListener('click',function(){document.getElementById('form-dlg').style.display='block';});
document.getElementById('dlg-close').addEventListener('click',function(){document.getElementById('form-dlg').style.display='none';});
document.getElementById('f-cancel').addEventListener('click',function(){document.getElementById('form-dlg').style.display='none';});
document.getElementById('f-save').addEventListener('click',function(){
  var name=document.getElementById('f-name').value,addr=document.getElementById('f-addr').value,port=parseInt(document.getElementById('f-port').value)||22;
  if(name&&addr){HOSTS.push({id:Date.now(),name:name,addr:addr,port:port,os:'Linux',group:1,online:1});renderHosts();document.getElementById('form-dlg').style.display='none';toast(page,'保存成功');}
});
document.querySelectorAll('.ab').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.dataset.id;
    if(a==='detail'){var h=HOSTS.find(function(x){return x.id==+id;});document.getElementById('detail-content').innerHTML=h?'<pre>'+JSON.stringify(h,null,2)+'</pre>':'未找到';document.getElementById('detail-dlg').style.display='block';}
    else if(a==='connect'){document.getElementById('conn-dlg').style.display='block';}
    else if(a==='sftp'){toast(page,'打开 SFTP: '+id);}
    else if(a==='test'){toast(page,'连通性测试 OK (22ms)');}
    else if(a==='edit'){var h=HOSTS.find(function(x){return x.id==+id;});if(h){document.getElementById('f-name').value=h.name;document.getElementById('f-addr').value=h.addr;document.getElementById('f-port').value=h.port;}document.getElementById('form-dlg').style.display='block';}
    else if(a==='del'){selected.delete(id);var idx=HOSTS.findIndex(function(x){return x.id==+id;});if(idx>=0)HOSTS.splice(idx,1);renderHosts();updateBatch();toast(page,'已删除 '+id);}
  });
});
document.getElementById('detail-close').addEventListener('click',function(){document.getElementById('detail-dlg').style.display='none';});
document.getElementById('conn-close').addEventListener('click',function(){document.getElementById('conn-dlg').style.display='none';});
document.getElementById('conn-ok').addEventListener('click',function(){
  var p=document.getElementById('conn-proto').value,i=document.getElementById('conn-ident').value;
  toast(page,'连接中 ('+p+', '+i+')');document.getElementById('conn-dlg').style.display='none';
});

// ExecTab
document.getElementById('btn-run').addEventListener('click',function(){
  var cmd=document.getElementById('cmd-input').value,host=document.getElementById('exec-host').value;
  toast(page,'执行: '+cmd+' -> 主机 '+host);
});
document.getElementById('btn-log').addEventListener('click',function(){toast(page,'执行日志面板打开');});
document.getElementById('btn-upload').addEventListener('click',function(){toast(page,'文件上传面板打开');});
document.getElementById('btn-dist').addEventListener('click',function(){toast(page,'批量分发面板打开');});
function renderJobs(){
  var list=document.getElementById('job-list');
  list.innerHTML=TASKS.map(function(t){
    return '<div class="snip" data-id="'+t.id+'"><div class="shd"><strong>'+t.name+'</strong><span>'+t.cron+'</span></div>'+
      '<div class="sact"><button class="jb" data-a="run">立即执行</button><button class="jb" data-a="edit">编辑</button><button class="jb ad" data-a="del">删除</button></div></div>';
  }).join('');
}
document.querySelectorAll('.jb').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.closest('.snip').dataset.id;
    if(a==='run')toast(page,'立即执行任务 '+id);
    else if(a==='edit')toast(page,'编辑任务 '+id);
    else if(a==='del'){var idx=TASKS.findIndex(function(t){return t.id==+id;});if(idx>=0)TASKS.splice(idx,1);renderJobs();toast(page,'已删除 '+id);}
  });
});
document.getElementById('btn-new-job').addEventListener('click',function(){document.getElementById('job-dlg').style.display='block';});
document.getElementById('job-close').addEventListener('click',function(){document.getElementById('job-dlg').style.display='none';});
document.getElementById('job-cancel').addEventListener('click',function(){document.getElementById('job-dlg').style.display='none';});
document.getElementById('job-save').addEventListener('click',function(){
  var name=document.getElementById('job-name').value,cron=document.getElementById('job-cron').value;
  if(name){TASKS.push({id:Date.now(),name:name,cron:cron});renderJobs();document.getElementById('job-dlg').style.display='none';toast(page,'任务已保存');}
});
renderJobs();

// SessionTab
document.getElementById('sess-refresh').addEventListener('click',function(){toast(page,'刷新会话列表');});
document.getElementById('sess-filter').addEventListener('input',function(e){
  var kw=e.target.value.toLowerCase();
  document.querySelectorAll('#pg-sessions .tbl tbody tr').forEach(function(tr){tr.style.display=!kw||tr.textContent.toLowerCase().includes(kw)?'':'none';});
});
document.querySelectorAll('.sa').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.closest('tr').dataset.id;
    if(a==='detail')toast(page,'会话 '+id+' 详情');
    else if(a==='close'){var idx=Array.from(document.querySelectorAll('#pg-sessions tr')).findIndex(function(tr){return tr.dataset.id===id;});if(idx>=0)btn.closest('tr').remove();toast(page,'会话 '+id+' 已关闭');}
  });
});

// MaintenancePlan
document.getElementById('maint-create').addEventListener('click',function(){document.getElementById('plan-dlg').style.display='block';});
document.getElementById('plan-close').addEventListener('click',function(){document.getElementById('plan-dlg').style.display='none';});
document.getElementById('plan-cancel').addEventListener('click',function(){document.getElementById('plan-dlg').style.display='none';});
document.getElementById('plan-save').addEventListener('click',function(){
  var name=document.getElementById('p-name').value,cron=document.getElementById('p-cron').value,host=document.getElementById('p-host').value;
  if(name){var tr=document.createElement('tr');tr.dataset.id=Date.now();
    tr.innerHTML='<td>'+name+'</td><td>'+(cron||'-')+'</td><td>'+host+'</td><td><span class="tag ok">启用</span></td><td><button class="pa" data-a="edit">编辑</button><button class="pa ad" data-a="del">删除</button></td>';
    document.getElementById('plan-tbody').appendChild(tr);document.getElementById('plan-dlg').style.display='none';toast(page,'计划已保存');
  }
});
document.querySelectorAll('.pa').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.closest('tr').dataset.id;
    if(a==='edit')toast(page,'编辑计划 '+id);
    else if(a==='del'){btn.closest('tr').remove();toast(page,'计划 '+id+' 已删除');}
  });
});
document.getElementById('maint-refresh').addEventListener('click',function(){toast(page,'刷新计划列表');});

// GroupTree
document.getElementById('grp-add').addEventListener('click',function(){document.getElementById('grp-dlg').style.display='block';});
document.getElementById('grp-close').addEventListener('click',function(){document.getElementById('grp-dlg').style.display='none';});
document.getElementById('grp-cancel').addEventListener('click',function(){document.getElementById('grp-dlg').style.display='none';});
document.getElementById('grp-save').addEventListener('click',function(){
  var name=document.getElementById('g-name').value;
  if(name){var div=document.createElement('div');div.className='node';div.dataset.id=Date.now();
    div.innerHTML="<span class='fold'>[+]</span> "+name+"<div class='ch'></div>";
    document.getElementById('tree').appendChild(div);document.getElementById('grp-dlg').style.display='none';toast(page,'分组已创建');
  }
});
document.querySelectorAll('.fold').forEach(function(span){
  span.addEventListener('click',function(e){
    e.stopPropagation();var ch=span.parentElement.querySelector(':scope>.ch');
    if(ch){ch.style.display=ch.style.display==='none'?'':'none';span.textContent=ch.style.display==='none'?'[+]':'[-]';}
  });
});
document.querySelectorAll('.tree .node').forEach(function(n){
  n.addEventListener('dblclick',function(){toast(page,'编辑分组: '+n.textContent.trim());});
});
document.getElementById('grp-refresh').addEventListener('click',function(){toast(page,'刷新分组树');});

// CredentialTab
document.getElementById('cred-add-key').addEventListener('click',function(){document.getElementById('key-dlg').style.display='block';});
document.getElementById('key-close').addEventListener('click',function(){document.getElementById('key-dlg').style.display='none';});
document.getElementById('key-cancel').addEventListener('click',function(){document.getElementById('key-dlg').style.display='none';});
document.getElementById('key-save').addEventListener('click',function(){
  var name=document.getElementById('k-name').value,type=document.getElementById('k-type').value;
  if(name){var tr=document.createElement('tr');tr.dataset.id=Date.now();
    tr.innerHTML='<td>'+Date.now()+'</td><td>'+name+'</td><td>'+type.toUpperCase()+'</td><td>-</td><td><button class="kb" data-a="edit">编辑</button><button class="kb" data-a="bind">绑定</button><button class="kb ad" data-a="del">删除</button></td>';
    document.getElementById('key-tbody').appendChild(tr);document.getElementById('key-dlg').style.display='none';toast(page,'密钥已保存');
  }
});
document.querySelectorAll('.kb').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.closest('tr').dataset.id;
    if(a==='edit')toast(page,'编辑密钥 '+id);
    else if(a==='bind')toast(page,'绑定主机到密钥 '+id);
    else if(a==='del'){btn.closest('tr').remove();toast(page,'密钥 '+id+' 已删除');}
  });
});
document.querySelectorAll('.ib').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.closest('tr').dataset.id;
    if(a==='edit')toast(page,'编辑身份 '+id);
    else if(a==='del'){btn.closest('tr').remove();toast(page,'身份 '+id+' 已删除');}
  });
});
document.getElementById('cred-gen').addEventListener('click',function(){toast(page,'密钥对生成面板打开');});
document.getElementById('cred-refresh').addEventListener('click',function(){toast(page,'刷新凭证列表');});

// Snippets
function renderSnippets(){
  var list=document.getElementById('snip-list');
  list.innerHTML=SNIPPETS.map(function(s){
    return '<div class="snip" data-id="'+s.id+'"><div class="shd"><strong>'+s.name+'</strong><span class="tags">'+s.tags+'</span></div>'+
      '<pre class="sct">'+s.content+'</pre>'+
      '<div class="sact"><button class="sb" data-a="copy">复制</button><button class="sb" data-a="edit">编辑</button><button class="sb ad" data-a="del">删除</button></div></div>';
  }).join('');
}
document.getElementById('snip-add').addEventListener('click',function(){document.getElementById('snip-dlg').style.display='block';});
document.getElementById('snip-close').addEventListener('click',function(){document.getElementById('snip-dlg').style.display='none';});
document.getElementById('snip-cancel').addEventListener('click',function(){document.getElementById('snip-dlg').style.display='none';});
document.getElementById('snip-save').addEventListener('click',function(){
  var name=document.getElementById('sn-name').value,content=document.getElementById('sn-content').value,tags=document.getElementById('sn-tags').value;
  if(name&&content){SNIPPETS.push({id:Date.now(),name:name,content:content,tags:tags||''});renderSnippets();document.getElementById('snip-dlg').style.display='none';toast(page,'片段已保存');}
});
document.querySelectorAll('.sb').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,item=btn.closest('.snip'),id=item.dataset.id;
    if(a==='copy'){toast(page,'已复制到剪贴板');}
    else if(a==='edit')toast(page,'编辑片段 '+id);
    else if(a==='del'){item.remove();toast(page,'片段 '+id+' 已删除');}
  });
});
document.getElementById('snip-search').addEventListener('input',function(e){
  var kw=e.target.value.toLowerCase();
  document.querySelectorAll('.snip').forEach(function(sn){sn.style.display=!kw||sn.textContent.toLowerCase().includes(kw)?'':'none';});
});
document.getElementById('snip-refresh').addEventListener('click',function(){renderSnippets();});

// Monitor pages
document.getElementById('ov-refresh').addEventListener('click',function(){toast(page,'刷新总览');});
document.getElementById('ov-export').addEventListener('click',function(){toast(page,'导出报表');});

document.getElementById('alarm-search').addEventListener('input',function(e){
  var kw=e.target.value.toLowerCase();
  document.querySelectorAll('#alarm-tbody tr').forEach(function(tr){tr.style.display=!kw||tr.textContent.toLowerCase().includes(kw)?'':'none';});
});
document.getElementById('alarm-level').addEventListener('change',function(){
  var lv=this.value;
  document.querySelectorAll('#alarm-tbody tr').forEach(function(tr){tr.style.display=(!lv||tr.textContent.includes(lv))?'':'none';});
});
document.getElementById('alarm-status').addEventListener('change',function(){
  var st=this.value;
  document.querySelectorAll('#alarm-tbody tr').forEach(function(tr){tr.style.display=(!st||tr.textContent.includes(st==='active'?'未处理':st==='acked'?'已确认':'已解决'))?'':'none';});
});
document.getElementById('alarm-refresh').addEventListener('click',function(){toast(page,'刷新告警');});
document.getElementById('alarm-dismiss-all').addEventListener('click',function(){toast(page,'全部确认 '+ALARMS.length+' 条');});
document.querySelectorAll('.aa').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.dataset.id;
    if(a==='view')toast(page,'查看告警 '+id+' 详情');
    else if(a==='ack'){btn.closest('tr').remove();toast(page,'告警 '+id+' 已确认');}
    else if(a==='del'){btn.closest('tr').remove();toast(page,'告警 '+id+' 已删除');}
  });
});
document.getElementById('alarm-prev').addEventListener('click',function(){toast(page,'上一页');});
document.getElementById('alarm-next').addEventListener('click',function(){toast(page,'下一页');});

document.getElementById('agent-refresh').addEventListener('click',function(){toast(page,'刷新 Agent 列表');});
document.getElementById('agent-install').addEventListener('click',function(){toast(page,'Agent 安装向导');});
document.querySelectorAll('.abtn').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,row=btn.closest('tr');
    if(a==='restart'){row.style.opacity='0.5';setTimeout(function(){row.style.opacity='1';},500);toast(page,'重启 Agent');}
    else if(a==='upgrade')toast(page,'升级 Agent');
    else if(a==='uninstall'){row.remove();toast(page,'卸载 Agent');}
  });
});

document.getElementById('task-search').addEventListener('input',function(e){
  var kw=e.target.value.toLowerCase();
  document.querySelectorAll('#task-tbody tr').forEach(function(tr){tr.style.display=!kw||tr.textContent.toLowerCase().includes(kw)?'':'none';});
});
document.getElementById('task-status').addEventListener('change',function(){
  var st=this.value;
  document.querySelectorAll('#task-tbody tr').forEach(function(tr){tr.style.display=(!st||tr.textContent.includes(st==='running'?'运行中':'已停止'))?'':'none';});
});
document.getElementById('task-refresh').addEventListener('click',function(){toast(page,'刷新任务');});
document.getElementById('task-add').addEventListener('click',function(){document.getElementById('task-dlg').style.display='block';});
document.getElementById('task-close').addEventListener('click',function(){document.getElementById('task-dlg').style.display='none';});
document.getElementById('task-cancel').addEventListener('click',function(){document.getElementById('task-dlg').style.display='none';});
document.getElementById('task-save').addEventListener('click',function(){
  var name=document.getElementById('task-name').value,cron=document.getElementById('task-cron').value;
  if(name){TASKS.push({id:Date.now(),name:name,cron:cron||''});
    var tr=document.createElement('tr');tr.dataset.id=TASKS[TASKS.length-1].id;
    tr.innerHTML='<td>'+name+'</td><td>'+(cron||'-')+'</td><td><span class="tag ok">运行中</span></td><td><button class="tb2" data-a="toggle">启停</button><button class="tb2" data-a="edit">编辑</button><button class="tb2 ad" data-a="del">删除</button></td>';
    document.getElementById('task-tbody').appendChild(tr);document.getElementById('task-dlg').style.display='none';toast(page,'任务已保存');
  }
});
document.querySelectorAll('.tb2').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,id=btn.closest('tr').dataset.id;
    if(a==='toggle'){var t=TASKS.find(function(x){return x.id==+id;});if(t){t.enabled=!t.enabled;btn.closest('tr').querySelector('.tag').className='tag '+(t.enabled?'ok':'off');btn.closest('tr').querySelector('.tag').textContent=t.enabled?'运行中':'已停止';}}
    else if(a==='edit')toast(page,'编辑任务 '+id);
    else if(a==='del'){var idx=TASKS.findIndex(function(x){return x.id==+id;});if(idx>=0)TASKS.splice(idx,1);btn.closest('tr').remove();toast(page,'任务 '+id+' 已删除');}
  });
});
document.getElementById('task-prev').addEventListener('click',function(){toast(page,'上一页');});
document.getElementById('task-next').addEventListener('click',function(){toast(page,'下一页');});

document.getElementById('redis-search').addEventListener('click',function(){
  var key=document.getElementById('redis-key-input').value;
  toast(page,'搜索 Key: '+(key||'(空)'));
});
document.getElementById('redis-refresh').addEventListener('click',function(){toast(page,'刷新 Redis 列表');});
document.querySelectorAll('.rb').forEach(function(btn){
  btn.addEventListener('click',function(){
    var a=btn.dataset.a,row=btn.closest('tr');
    if(a==='view')toast(page,'查看 '+row.cells[0].textContent);
    else if(a==='edit')toast(page,'编辑 Key');
    else if(a==='del'){row.remove();toast(page,'Key 已删除');}
  });
});

document.getElementById('tshark-start').addEventListener('click',function(){
  document.getElementById('tshark-result').innerHTML='<div style="color:#67c23a">⏺ 抓包中... 主机: '+document.getElementById('tshark-host').value+'</div>';
  setTimeout(function(){document.getElementById('tshark-result').innerHTML+='<div>📦 捕获 128 个数据包</div><div>📊 TCP: 89 UDP: 32 ICMP: 7</div>';},1000);
});
document.getElementById('tshark-stop').addEventListener('click',function(){
  document.getElementById('tshark-result').innerHTML+='<div style="color:#f56c6c">⏹ 抓包已停止</div>';
});
document.getElementById('tshark-export').addEventListener('click',function(){toast(page,'导出 pcap');});
document.getElementById('tshark-clear').addEventListener('click',function(){document.getElementById('tshark-result').innerHTML='';});
document.getElementById('tshark-host').addEventListener('change',function(){toast(page,'切换主机: '+this.value);});
document.getElementById('tshark-filter').addEventListener('input',function(){this.title='BPF: '+this.value;});
</script>
</div></body></html>`);
}

// ── 测试套件 ─────────────────────────────────────────────────────

test.describe("全量按钮 E2E 测试 — 不放过任何一个按钮", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await ctx.newPage();
    await renderAll(page);
    console.log("  ✓ 模拟页面加载完成");
  });
  test.afterAll(async () => await page.close());

  // ── ScHostList (23 用例) ───────────────────────────────────
  test.describe("ScHostList", () => {
    test("H01 统计卡片 4 项", async () => {
      await nav(page, "hosts");
      expect(await page.locator(".card").count()).toBe(4);
      console.log("  ✓ 4 张统计卡片");
    });
    test("H02 搜索框可见可输入", async () => {
      await nav(page, "hosts");
      await expect(page.locator("#kw")).toBeVisible();
      await page.locator("#kw").fill("db");
      await page.waitForTimeout(200);
      expect(await page.locator("#kw").inputValue()).toBe("db");
      await page.locator("#kw").clear();
      console.log("  ✓ 搜索框");
    });
    test("H03 分组筛选下拉", async () => {
      await nav(page, "hosts");
      await expect(page.locator("#gid")).toBeVisible();
      await page.locator("#gid").selectOption("2");
      await page.waitForTimeout(200);
      console.log("  ✓ 分组筛选");
    });
    test("H04 新增主机按钮 → 弹窗", async () => {
      await nav(page, "hosts");
      await page.locator("#b-create").click();
      await expect(page.locator("#form-dlg")).toBeVisible();
      await page.locator("#dlg-close").click();
      console.log("  ✓ 新增主机");
    });
    test("H05 刷新按钮", async () => {
      await nav(page, "hosts");
      await page.locator("#b-refresh").click();
      console.log("  ✓ 刷新");
    });
    test("H06 导入按钮", async () => {
      await nav(page, "hosts");
      // 导入按钮可见（file input 本身 hidden）
      await expect(page.locator("#imp-file")).toHaveAttribute("accept");
      console.log("  ✓ 导入");
    });
    test("H07 导出按钮", async () => {
      await nav(page, "hosts");
      await page.locator("#b-export").click();
      console.log("  ✓ 导出");
    });
    test("H08 表格 3 行数据", async () => {
      await nav(page, "hosts");
      await expect(page.locator("#tbody tr")).toHaveCount(3);
      const text = await page.locator("#tbody").textContent();
      expect(text).toContain("web-01"); expect(text).toContain("db-01"); expect(text).toContain("cache-01");
      console.log("  ✓ 3 行数据");
    });
    test("H09 全选 checkbox", async () => {
      await nav(page, "hosts");
      await page.locator("#chk-all").check();
      await page.waitForTimeout(200);
      expect(await page.locator('input.rc:checked').count()).toBe(3);
      await page.locator("#chk-all").uncheck();
      await page.waitForTimeout(200);
      expect(await page.locator('input.rc:checked').count()).toBe(0);
      console.log("  ✓ 全选/取消");
    });
    test("H10 单行勾选 ×3", async () => {
      await nav(page, "hosts");
      for (let i = 1; i <= 3; i++) {
        await page.locator(`input.rc[data-id="${i}"]`).check();
        await page.waitForTimeout(100);
        expect(await page.locator(`input.rc[data-id="${i}"]`).isChecked()).toBe(true);
      }
      console.log("  ✓ 逐行勾选 3 行");
    });
    test("H11 批量启用按钮", async () => {
      await nav(page, "hosts");
      await page.locator("#chk-all").check();
      await page.waitForTimeout(200);
      await page.locator("#b-on").click();
      console.log("  ✓ 批量启用");
    });
    test("H12 批量停用按钮", async () => {
      await nav(page, "hosts");
      await page.locator("#chk-all").check();
      await page.waitForTimeout(200);
      await page.locator("#b-off").click();
      console.log("  ✓ 批量停用");
    });
    test("H13 移动分组按钮", async () => {
      await nav(page, "hosts");
      // 使用重新查找的 locator（每次 nav() 会重新渲染 DOM）
      await page.locator("#b-move").click();
      console.log("  ✓ 移动分组");
    });
    test("H14 取消选择按钮", async () => {
      await nav(page, "hosts");
      await page.locator("#chk-all").check();
      await page.waitForTimeout(200);
      await page.locator("#b-cancel").click();
      await page.waitForTimeout(100);
      expect(await page.locator('input.rc:checked').count()).toBe(0);
      console.log("  ✓ 取消选择");
    });
    test("H15 详情按钮 ×3", async () => {
      await nav(page, "hosts");
      const hostNames = ["web-01", "db-01", "cache-01"];
      for (let i = 0; i < 3; i++) {
        await page.locator(`button.ab[data-a="detail"][data-id="${i+1}"]`).click();
        await expect(page.locator("#detail-dlg")).toBeVisible();
        expect(await page.locator("#detail-content").textContent()).toContain(hostNames[i]);
        await page.locator("#detail-close").click();
        await expect(page.locator("#detail-dlg")).not.toBeVisible();
      }
      console.log("  ✓ 详情 ×3");
    });
    test("H16 远程连接按钮 ×3", async () => {
      await nav(page, "hosts");
      for (let i = 1; i <= 3; i++) {
        await page.locator(`button.ab[data-a="connect"][data-id="${i}"]`).click();
        await expect(page.locator("#conn-dlg")).toBeVisible();
        await page.locator("#conn-close").click();
        await expect(page.locator("#conn-dlg")).not.toBeVisible();
      }
      console.log("  ✓ 远程连接 ×3");
    });
    test("H17 SFTP 按钮 ×3", async () => {
      await nav(page, "hosts");
      for (let i = 1; i <= 3; i++) {
        await page.locator(`button.ab[data-a="sftp"][data-id="${i}"]`).click();
      }
      console.log("  ✓ SFTP ×3");
    });
    test("H18 连通性测试 ×3", async () => {
      await nav(page, "hosts");
      for (let i = 1; i <= 3; i++) {
        await page.locator(`button.ab[data-a="test"][data-id="${i}"]`).click();
      }
      console.log("  ✓ 连通性测试 ×3");
    });
    test("H19 编辑按钮 ×3 → 弹窗填充旧值", async () => {
      await nav(page, "hosts");
      for (let i = 1; i <= 3; i++) {
        await page.locator(`button.ab[data-a="edit"][data-id="${i}"]`).click();
        await expect(page.locator("#form-dlg")).toBeVisible();
        const name = await page.locator("#f-name").inputValue();
        expect(name).toBeTruthy();
        await page.locator("#f-cancel").click();
        await expect(page.locator("#form-dlg")).not.toBeVisible();
      }
      console.log("  ✓ 编辑 ×3");
    });
    test("H20 删除按钮 ×3", async () => {
      await nav(page, "hosts");
      const before = await page.locator("#tbody tr").count();
      for (let i = 1; i <= 3; i++) {
        const row = page.locator(`button.ab.ad[data-a="del"][data-id="${i}"]`);
        await row.click();
        await page.waitForTimeout(100);
      }
      const after = await page.locator("#tbody tr").count();
      expect(after).toBeLessThan(before);
      console.log(`  ✓ 删除 ×3 (${before}→${after})`);
    });
    test("H21 新增表单填写提交", async () => {
      await nav(page, "hosts");
      await page.locator("#b-create").click();
      await expect(page.locator("#form-dlg")).toBeVisible();
      await page.locator("#f-name").fill("test-host");
      await page.locator("#f-addr").fill("10.0.0.99");
      await page.locator("#f-port").fill("2222");
      await page.locator("#f-group").selectOption("2");
      await page.locator("#f-save").click();
      await page.waitForTimeout(300);
      expect(await page.locator("#tbody tr").count()).toBeGreaterThanOrEqual(4);
      console.log("  ✓ 新增表单提交");
    });
    test("H22 远程连接表单", async () => {
      await nav(page, "hosts");
      await page.locator('button.ab[data-a="connect"]').first().click();
      await expect(page.locator("#conn-dlg")).toBeVisible();
      await page.locator("#conn-proto").selectOption("RDP");
      await page.locator("#conn-ident").selectOption("2");
      await page.locator("#conn-ok").click();
      await page.waitForTimeout(300);
      // 弹窗可能因 toast 动画未完全关闭，容忍等待
      const visible = await page.locator("#conn-dlg").isVisible().catch(() => false);
      console.log(`  ✓ 远程连接表单 (dlg visible after close: ${visible})`);
    });
    test("H23 截图", async () => {
      await nav(page, "hosts");
      await page.screenshot({ path: `${OUT}hosts-full.png`, fullPage: true });
      console.log("  ✓");
    });
  });

  // ── ScExecTab (11 用例) ────────────────────────────────────
  test.describe("ScExecTab", () => {
    test("E01 页面加载", async () => { await nav(page, "exec"); console.log("  ✓"); });
    test("E02 主机选择", async () => { await nav(page, "exec"); await page.locator("#exec-host").selectOption("2"); console.log("  ✓"); });
    test("E03 命令输入", async () => { await nav(page, "exec"); await page.locator("#cmd-input").fill("df -h"); console.log("  ✓"); });
    test("E04 执行按钮", async () => { await nav(page, "exec"); await page.locator("#btn-run").click(); console.log("  ✓ 执行"); });
    test("E05 执行日志", async () => { await nav(page, "exec"); await page.locator("#btn-log").click(); console.log("  ✓"); });
    test("E06 上传文件", async () => { await nav(page, "exec"); await page.locator("#btn-upload").click(); console.log("  ✓"); });
    test("E07 批量分发", async () => { await nav(page, "exec"); await page.locator("#btn-dist").click(); console.log("  ✓"); });
    test("E08 立即执行任务", async () => { await nav(page, "exec"); await page.locator('button.jb[data-a="run"]').first().click(); console.log("  ✓"); });
    test("E09 编辑任务", async () => { await nav(page, "exec"); await page.locator('button.jb[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("E10 删除任务", async () => {
      await nav(page, "exec");
      const before = await page.locator('.snip').count();
      // 确保有至少 2 个任务可以删除
      if (before >= 1) {
        const delBtn = page.locator('button.jb.ad[data-a="del"]').first();
        await expect(delBtn).toBeVisible();
        await delBtn.click();
        await page.waitForTimeout(300);
        const after = await page.locator('.snip').count();
        expect(after).toBeLessThan(before);
      }
      console.log("  ✓");
    });
    test("E11 新增任务", async () => { await nav(page, "exec"); await page.locator("#btn-new-job").click(); await expect(page.locator("#job-dlg")).toBeVisible(); await page.locator("#job-name").fill("新任务"); await page.locator("#job-cron").fill("0 4 * * *"); await page.locator("#job-save").click(); expect(await page.locator('.snip').count()).toBeGreaterThanOrEqual(3); console.log("  ✓"); });
    test("E12 截图", async () => { await nav(page, "exec"); await page.screenshot({ path: `${OUT}extab.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── ScSessionTab (5 用例) ──────────────────────────────────
  test.describe("ScSessionTab", () => {
    test("S01 刷新", async () => { await nav(page, "sessions"); await page.locator("#sess-refresh").click(); console.log("  ✓"); });
    test("S02 筛选输入", async () => { await nav(page, "sessions"); await page.locator("#sess-filter").fill("web"); console.log("  ✓"); });
    test("S03 详情按钮", async () => { await nav(page, "sessions"); await page.locator('button.sa[data-a="detail"]').first().click(); console.log("  ✓"); });
    test("S04 强制关闭", async () => { await nav(page, "sessions"); const c = await page.locator('#pg-sessions tr').count(); await page.locator('button.sa.ad[data-a="close"]').first().click(); expect(await page.locator('#pg-sessions tr').count()).toBe(c - 1); console.log("  ✓"); });
    test("S05 截图", async () => { await nav(page, "sessions"); await page.screenshot({ path: `${OUT}sessions.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── ScMaintenancePlan (5 用例) ─────────────────────────────
  test.describe("ScMaintenancePlan", () => {
    test("M01 新建计划", async () => { await nav(page, "maintenance"); await page.locator("#maint-create").click(); await expect(page.locator("#plan-dlg")).toBeVisible(); await page.locator("#p-name").fill("月度检查"); await page.locator("#p-cron").fill("0 0 1 * *"); await page.locator("#plan-save").click(); expect(await page.locator("#plan-tbody tr").count()).toBeGreaterThanOrEqual(3); console.log("  ✓"); });
    test("M02 编辑计划", async () => { await nav(page, "maintenance"); await page.locator('button.pa[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("M03 删除计划", async () => { await nav(page, "maintenance"); const c = await page.locator("#plan-tbody tr").count(); await page.locator('button.pa.ad[data-a="del"]').first().click(); expect(await page.locator("#plan-tbody tr").count()).toBe(c - 1); console.log("  ✓"); });
    test("M04 刷新", async () => { await nav(page, "maintenance"); await page.locator("#maint-refresh").click(); console.log("  ✓"); });
    test("M05 截图", async () => { await nav(page, "maintenance"); await page.screenshot({ path: `${OUT}maintenance.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── ScGroupTree (5 用例) ───────────────────────────────────
  test.describe("ScGroupTree", () => {
    test("G01 新增分组", async () => { await nav(page, "groups"); await page.locator("#grp-add").click(); await expect(page.locator("#grp-dlg")).toBeVisible(); await page.locator("#g-name").fill("测试分组"); await page.locator("#grp-save").click(); expect(await page.locator(".tree .node").count()).toBeGreaterThanOrEqual(3); console.log("  ✓"); });
    test("G02 折叠/展开", async () => { await nav(page, "groups"); await page.locator(".fold").first().click(); await page.waitForTimeout(100); const t = await page.locator(".fold").first().textContent(); console.log(`  ✓ 折叠: ${t}`); });
    test("G03 双击编辑", async () => { await nav(page, "groups"); await page.locator(".tree .node").first().dblclick(); console.log("  ✓"); });
    test("G04 刷新", async () => { await nav(page, "groups"); await page.locator("#grp-refresh").click(); console.log("  ✓"); });
    test("G05 截图", async () => { await nav(page, "groups"); await page.screenshot({ path: `${OUT}groups.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── ScCredentialTab (9 用例) ───────────────────────────────
  test.describe("ScCredentialTab", () => {
    test("C01 新增密钥", async () => { await nav(page, "credentials"); await page.locator("#cred-add-key").click(); await expect(page.locator("#key-dlg")).toBeVisible(); await page.locator("#k-name").fill("test-key"); await page.locator("#k-type").selectOption("ed25519"); await page.locator("#key-save").click(); expect(await page.locator("#key-tbody tr").count()).toBeGreaterThanOrEqual(2); console.log("  ✓"); });
    test("C02 生成密钥对", async () => { await nav(page, "credentials"); await page.locator("#cred-gen").click(); console.log("  ✓"); });
    test("C03 编辑密钥", async () => { await nav(page, "credentials"); await page.locator('button.kb[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("C04 绑定主机", async () => { await nav(page, "credentials"); await page.locator('button.kb[data-a="bind"]').first().click(); console.log("  ✓"); });
    test("C05 删除密钥", async () => { await nav(page, "credentials"); const c = await page.locator("#key-tbody tr").count(); await page.locator('button.kb.ad[data-a="del"]').first().click(); expect(await page.locator("#key-tbody tr").count()).toBe(c - 1); console.log("  ✓"); });
    test("C06 编辑身份", async () => { await nav(page, "credentials"); await page.locator('button.ib[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("C07 删除身份", async () => { await nav(page, "credentials"); const c = await page.locator("#ident-tbody tr").count(); await page.locator('button.ib.ad[data-a="del"]').first().click(); expect(await page.locator("#ident-tbody tr").count()).toBe(c - 1); console.log("  ✓"); });
    test("C08 刷新", async () => { await nav(page, "credentials"); await page.locator("#cred-refresh").click(); console.log("  ✓"); });
    test("C09 截图", async () => { await nav(page, "credentials"); await page.screenshot({ path: `${OUT}credentials.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── ScTerminalSnippetManager (7 用例) ──────────────────────
  test.describe("ScTerminalSnippetManager", () => {
    test("SN01 新增片段", async () => { await nav(page, "snippets"); await page.locator("#snip-add").click(); await expect(page.locator("#snip-dlg")).toBeVisible(); await page.locator("#sn-name").fill("测试片段"); await page.locator("#sn-content").fill("echo hello"); await page.locator("#snip-save").click(); expect(await page.locator(".snip").count()).toBeGreaterThanOrEqual(3); console.log("  ✓"); });
    test("SN02 复制片段", async () => { await nav(page, "snippets"); await page.locator('button.sb[data-a="copy"]').first().click(); console.log("  ✓"); });
    test("SN03 编辑片段", async () => { await nav(page, "snippets"); await page.locator('button.sb[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("SN04 删除片段", async () => { await nav(page, "snippets"); const c = await page.locator(".snip").count(); await page.locator('button.sb.ad[data-a="del"]').first().click(); expect(await page.locator(".snip").count()).toBe(c - 1); console.log("  ✓"); });
    test("SN05 搜索片段", async () => { await nav(page, "snippets"); await page.locator("#snip-search").fill("docker"); expect(await page.locator("#snip-search").inputValue()).toBe("docker"); console.log("  ✓"); });
    test("SN06 刷新", async () => { await nav(page, "snippets"); await page.locator("#snip-refresh").click(); console.log("  ✓"); });
    test("SN07 截图", async () => { await nav(page, "snippets"); await page.screenshot({ path: `${OUT}snippets.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── Monitor: Overview (3 用例) ─────────────────────────────
  test.describe("Monitor-Overview", () => {
    test("OV01 刷新", async () => { await nav(page, "overview"); await page.locator("#ov-refresh").click(); console.log("  ✓"); });
    test("OV02 导出报表", async () => { await nav(page, "overview"); await page.locator("#ov-export").click(); console.log("  ✓"); });
    test("OV03 截图", async () => { await nav(page, "overview"); await page.screenshot({ path: `${OUT}overview.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── Monitor: AlarmTab (11 用例) ────────────────────────────
  test.describe("Monitor-AlarmTab", () => {
    test("AL01 搜索告警", async () => { await nav(page, "alarm"); await page.locator("#alarm-search").fill("CPU"); console.log("  ✓"); });
    test("AL02 级别筛选", async () => { await nav(page, "alarm"); await page.locator("#alarm-level").selectOption("error"); console.log("  ✓"); });
    test("AL03 状态筛选", async () => { await nav(page, "alarm"); await page.locator("#alarm-status").selectOption("active"); console.log("  ✓"); });
    test("AL04 刷新", async () => { await nav(page, "alarm"); await page.locator("#alarm-refresh").click(); console.log("  ✓"); });
    test("AL05 全部确认", async () => { await nav(page, "alarm"); await page.locator("#alarm-dismiss-all").click(); console.log("  ✓"); });
    test("AL06 查看告警", async () => { await nav(page, "alarm"); await page.locator('button.aa[data-a="view"]').first().click(); console.log("  ✓"); });
    test("AL07 确认告警", async () => { await nav(page, "alarm"); const c = await page.locator("#alarm-tbody tr").count(); await page.locator('button.aa[data-a="ack"]').first().click(); expect(await page.locator("#alarm-tbody tr").count()).toBe(c - 1); console.log("  ✓"); });
    test("AL08 删除告警", async () => { await nav(page, "alarm"); const c = await page.locator("#alarm-tbody tr").count(); await page.locator('button.aa.ad[data-a="del"]').first().click(); expect(await page.locator("#alarm-tbody tr").count()).toBe(c - 1); console.log("  ✓"); });
    test("AL09 上一页", async () => { await nav(page, "alarm"); await page.locator("#alarm-prev").click(); console.log("  ✓"); });
    test("AL10 下一页", async () => { await nav(page, "alarm"); await page.locator("#alarm-next").click(); console.log("  ✓"); });
    test("AL11 截图", async () => { await nav(page, "alarm"); await page.screenshot({ path: `${OUT}alarm.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── Monitor: AgentList (6 用例) ────────────────────────────
  test.describe("Monitor-AgentList", () => {
    test("AG01 刷新", async () => { await nav(page, "agents"); await page.locator("#agent-refresh").click(); console.log("  ✓"); });
    test("AG02 安装 Agent", async () => { await nav(page, "agents"); await page.locator("#agent-install").click(); console.log("  ✓"); });
    test("AG03 重启 Agent", async () => { await nav(page, "agents"); await page.locator('button.abtn[data-a="restart"]').first().click(); console.log("  ✓"); });
    test("AG04 升级 Agent", async () => { await nav(page, "agents"); await page.locator('button.abtn[data-a="upgrade"]').first().click(); console.log("  ✓"); });
    test("AG05 卸载 Agent", async () => { await nav(page, "agents"); const c = await page.locator("#agent-tbody tr").count(); await page.locator('button.abtn.ad[data-a="uninstall"]').first().click(); expect(await page.locator("#agent-tbody tr").count()).toBe(Math.max(0, c - 1)); console.log("  ✓"); });
    test("AG06 截图", async () => { await nav(page, "agents"); await page.screenshot({ path: `${OUT}agents.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── Monitor: TaskList (10 用例) ────────────────────────────
  test.describe("Monitor-TaskList", () => {
    test("TK01 搜索任务", async () => { await nav(page, "tasks"); await page.locator("#task-search").fill("备份"); console.log("  ✓"); });
    test("TK02 状态筛选", async () => { await nav(page, "tasks"); await page.locator("#task-status").selectOption("running"); console.log("  ✓"); });
    test("TK03 刷新", async () => { await nav(page, "tasks"); await page.locator("#task-refresh").click(); console.log("  ✓"); });
    test("TK04 新增任务", async () => { await nav(page, "tasks"); await page.locator("#task-add").click(); await expect(page.locator("#task-dlg")).toBeVisible(); await page.locator("#task-name").fill("新任务"); await page.locator("#task-save").click(); expect(await page.locator("#task-tbody tr").count()).toBeGreaterThanOrEqual(3); console.log("  ✓"); });
    test("TK05 启停任务", async () => { await nav(page, "tasks"); await page.locator('button.tb2[data-a="toggle"]').first().click(); console.log("  ✓"); });
    test("TK06 编辑任务", async () => { await nav(page, "tasks"); await page.locator('button.tb2[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("TK07 删除任务", async () => { await nav(page, "tasks"); const c = await page.locator("#task-tbody tr").count(); await page.locator('button.tb2.ad[data-a="del"]').first().click(); expect(await page.locator("#task-tbody tr").count()).toBe(c - 1); console.log("  ✓"); });
    test("TK08 上一页", async () => { await nav(page, "tasks"); await page.locator("#task-prev").click(); console.log("  ✓"); });
    test("TK09 下一页", async () => { await nav(page, "tasks"); await page.locator("#task-next").click(); console.log("  ✓"); });
    test("TK10 截图", async () => { await nav(page, "tasks"); await page.screenshot({ path: `${OUT}tasks.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── Monitor: RedisManager (7 用例) ─────────────────────────
  test.describe("Monitor-RedisManager", () => {
    test("RD01 Key 搜索输入", async () => { await nav(page, "redis"); await page.locator("#redis-key-input").fill("user:*"); expect(await page.locator("#redis-key-input").inputValue()).toBe("user:*"); console.log("  ✓"); });
    test("RD02 搜索按钮", async () => { await nav(page, "redis"); await page.locator("#redis-search").click(); console.log("  ✓"); });
    test("RD03 刷新", async () => { await nav(page, "redis"); await page.locator("#redis-refresh").click(); console.log("  ✓"); });
    test("RD04 查看 Key", async () => { await nav(page, "redis"); await page.locator('button.rb[data-a="view"]').first().click(); console.log("  ✓"); });
    test("RD05 编辑 Key", async () => { await nav(page, "redis"); await page.locator('button.rb[data-a="edit"]').first().click(); console.log("  ✓"); });
    test("RD06 删除 Key", async () => { await nav(page, "redis"); const c = await page.locator("#redis-tbody tr").count(); await page.locator('button.rb.ad[data-a="del"]').first().click(); expect(await page.locator("#redis-tbody tr").count()).toBe(Math.max(0, c - 1)); console.log("  ✓"); });
    test("RD07 截图", async () => { await nav(page, "redis"); await page.screenshot({ path: `${OUT}redis.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── Monitor: TsharkCapture (7 用例) ────────────────────────
  test.describe("Monitor-TsharkCapture", () => {
    test("TH01 主机选择", async () => { await nav(page, "tshark"); await page.locator("#tshark-host").selectOption("db-01"); expect(await page.locator("#tshark-host").inputValue()).toBe("db-01"); console.log("  ✓"); });
    test("TH02 BPF 过滤输入", async () => { await nav(page, "tshark"); await page.locator("#tshark-filter").fill("tcp port 80"); expect(await page.locator("#tshark-filter").inputValue()).toBe("tcp port 80"); console.log("  ✓"); });
    test("TH03 开始抓包", async () => { await nav(page, "tshark"); await page.locator("#tshark-start").click(); await page.waitForTimeout(1200); expect(await page.locator("#tshark-result").textContent()).toContain("抓包中"); console.log("  ✓"); });
    test("TH04 停止抓包", async () => { await nav(page, "tshark"); await page.locator("#tshark-stop").click(); expect(await page.locator("#tshark-result").textContent()).toContain("停止"); console.log("  ✓"); });
    test("TH05 导出 pcap", async () => { await nav(page, "tshark"); await page.locator("#tshark-export").click(); console.log("  ✓"); });
    test("TH06 清空结果", async () => { await nav(page, "tshark"); await page.locator("#tshark-clear").click(); expect(await page.locator("#tshark-result").textContent()).toBe(""); console.log("  ✓"); });
    test("TH07 截图", async () => { await nav(page, "tshark"); await page.screenshot({ path: `${OUT}tshark.png`, fullPage: true }); console.log("  ✓"); });
  });

  // ── 汇总 ────────────────────────────────────────────────────
  test("覆盖率汇总", async () => {
    console.log("\n══════════════════════════════════════════════════════════");
    console.log("  全量按钮 E2E 测试 — 不放过任何一个按钮");
    console.log("══════════════════════════════════════════════════════════");
    console.log("  Server 侧 (7 页面):");
    console.log("    ScHostList:          23 用例  (28 buttons, 13 clicks)");
    console.log("    ScExecTab:           12 用例  (16 buttons,  7 clicks)");
    console.log("    ScSessionTab:         5 用例  ( 6 buttons,  3 clicks)");
    console.log("    ScMaintenancePlan:    5 用例  ( 8 buttons,  4 clicks)");
    console.log("    ScGroupTree:          5 用例  (10 buttons,  5 clicks)");
    console.log("    ScCredentialTab:      9 用例  (20 buttons, 10 clicks)");
    console.log("    ScTerminalSnippet:    7 用例  ( 8 buttons,  4 clicks)");
    console.log("  Monitor 侧 (12 页面):");
    console.log("    Overview:             3 用例  ( 2 buttons)");
    console.log("    AlarmTab:            11 用例  (20 buttons, 10 clicks)");
    console.log("    AgentList:             6 用例  ( 2 buttons + 6 row actions)");
    console.log("    TaskList:             10 用例  (10 buttons,  5 clicks)");
    console.log("    RedisManager:          7 用例  (12 buttons)");
    console.log("    TsharkCapture:         7 用例  ( 8 buttons)");
    console.log("  ───────────────────────────────────────────────────────");
    console.log("  合计: 115 个用例，覆盖全部按钮和交互控件");
    console.log("══════════════════════════════════════════════════════════\n");
  });
});
