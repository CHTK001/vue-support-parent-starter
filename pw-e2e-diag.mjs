// 诊断：界面上点「运行」到底提交了没有。用已验证过的双层信封解包。
const API = "http://192.168.50.198:18190/collect/api";
const login = await (await fetch(`${API}/v2/user/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "123456" }),
})).json();
const H = { Authorization: "Bearer " + login.data.accessToken };
const page = await (await fetch(`${API}/v2/collect/task/page?pageNum=1&pageSize=20`, { headers: H })).json();
console.log("响应顶层键: " + Object.keys(page).join(","));
console.log("data 键: " + Object.keys(page.data ?? {}).join(","));
console.log("data.data 类型: " + (Array.isArray(page.data?.data) ? "array(" + page.data.data.length + ")" : typeof page.data?.data));
const rows = page.data?.data?.data ?? page.data?.data ?? page.data?.records ?? [];
console.log("解包后任务数: " + (Array.isArray(rows) ? rows.length : "(非数组)"));
for (const r of (Array.isArray(rows) ? rows : []).slice(0, 8)) {
  console.log(`  id=${r.collectTaskId} flow=${r.collectTaskFlowName} status=${r.collectTaskStatus} 触发=${r.collectTaskTriggerType} ${r.collectTaskBeginTime} 节点=${r.collectTaskNodeCount} 抓取=${r.collectTaskRequestCount} 记录=${r.collectTaskRecordCount}`);
}
const zz = (Array.isArray(rows) ? rows : []).filter((r) => String(r.collectTaskFlowName || "").includes("ZZ-E2E"));
console.log("ZZ-E2E 任务数: " + zz.length);
for (const r of zz) {
  const d = (await (await fetch(`${API}/v2/collect/task/detail?taskId=${r.collectTaskId}`, { headers: H })).json()).data;
  console.log(`  详情: status=${d?.collectTaskStatus} 记录=${d?.collectTaskRecordCount}`);
  const logs = (await (await fetch(`${API}/v2/collect/task/logs?taskId=${r.collectTaskId}`, { headers: H })).json()).data ?? [];
  for (const l of logs) console.log(`     | ${l.collectTaskLogNodeId} ${l.collectTaskLogNodeShape} ${l.collectTaskLogStatus} ${String(l.collectTaskLogMessage ?? "").replace(/\s+/g, " ").slice(0, 150)}`);
}
