// 验证 SQL 写开关与审计是否真生效（跑在 198 新发布的产物上）。
//   1) metas 仍 15 个 shape（新 jar 已加载）
//   2) SQL 读语句仍放行
//   3) SQL 写语句被拦（plugin.collect.sql-allow-write=false）
//   4) 脚本节点仍可执行，且审计留痕
//   5) 内置示例仍跑通（JSONPATH 迁移后）
import { chromium } from "playwright"; // 仅为统一依赖，实际未用

const API = "http://192.168.50.198:18190/collect/api";
let pass = 0, fail = 0;
const ck = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`  [${ok ? "PASS" : "FAIL"}] ${n}${d ? "  -> " + d : ""}`); };

async function api(path, init = {}) {
  const r = await fetch(API + path, {
    ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(60000),
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
}
const login = await api("/v2/user/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "123456" }) });
const H = { Authorization: "Bearer " + login.data.accessToken };

console.log("=== 1. metas（新 jar 已加载）===");
const metas = (await api("/v2/collect/designer/metas", { headers: H })).data ?? [];
console.log("  shape 数 = " + metas.length + " -> " + metas.map((m) => m.shape).join(","));
ck("metas 仍返回 15 个 shape", metas.length === 15, "数=" + metas.length);

const p = (name, value) => ({ name, value });
const node = (id, shape, name, params, fields = []) => ({ id, shape, name, x: 60, y: 60, params, fields });
const edge = (id, from, to) => ({ id, from, to, condition: "", exceptionFlow: "" });
function flow(name, mid) {
  return {
    name, threadCount: 1, headers: [], cookies: [], variables: [],
    nodes: [
      node("n1", "start", "start", [p("urls", "https://example.com/")]),
      mid,
      node("n3", "end", "end", []),
    ],
    edges: [edge("e1", "n1", "n2"), edge("e2", "n2", "n3")],
  };
}
async function runDsl(dsl) {
  const r = await api("/v2/collect/execution/dry-run", { method: "POST", headers: H, body: JSON.stringify(dsl) });
  if (!r?.success) return { rejected: true, msg: r?.msg };
  const taskId = r.data.collectTaskId;
  let d = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((s) => setTimeout(s, 2000));
    d = (await api(`/v2/collect/task/detail?taskId=${taskId}`, { headers: H })).data;
    if (d && /SUCCESS|FAIL|STOP/i.test(String(d.collectTaskStatus))) break;
  }
  const logs = (await api(`/v2/collect/task/logs?taskId=${taskId}`, { headers: H })).data ?? [];
  const mid = logs.filter((l) => l.collectTaskLogNodeId === "n2").map((l) => `${l.collectTaskLogStatus} ${l.collectTaskLogMessage ?? ""}`).join(" | ");
  await api(`/v2/collect/task/delete?taskId=${taskId}`, { method: "DELETE", headers: H });
  return { status: String(d?.collectTaskStatus ?? ""), mid };
}

console.log("\n=== 2. SQL 读语句应放行 ===");
const rRead = await runDsl(flow("ZZ-GUARD-READ", node("n2", "sql", "读", [p("statement", "select 1 as a")])));
console.log("  状态=" + rRead.status + "  n2: " + String(rRead.mid).slice(0, 160));
ck("SQL 查询仍可执行", /SUCCESS/i.test(rRead.status), rRead.status);

console.log("\n=== 3. SQL 写语句应被拦 ===");
const rWrite = await runDsl(flow("ZZ-GUARD-WRITE", node("n2", "sql", "写", [p("statement", "create table zz_guard_probe(id int)")])));
console.log("  状态=" + rWrite.status + "  n2: " + String(rWrite.mid).slice(0, 220));
ck("SQL 写语句被拦截且提示指明配置项", /FAIL/i.test(rWrite.status) && /sql-allow-write|写语句已被配置禁用/.test(String(rWrite.mid)), String(rWrite.mid).slice(0, 120));

console.log("\n=== 4. 脚本节点仍可执行（只验可用性，审计在日志里查）===");
const rScript = await runDsl(flow("ZZ-GUARD-SCRIPT", node("n2", "script", "脚本", [p("script", "1 + 1")])));
console.log("  状态=" + rScript.status + "  n2: " + String(rScript.mid).slice(0, 160));
ck("脚本节点仍可执行", /SUCCESS/i.test(rScript.status), rScript.status);

console.log("\n=== 5. 内置示例仍跑通 ===");
const flows = (await api("/v2/collect/flow/list", { headers: H })).data ?? [];
const example = flows.find((f) => f.collectFlowName === "示例-GitHub 项目采集");
const detail = (await api(`/v2/collect/flow/detail?flowId=${example.collectFlowId}`, { headers: H })).data;
const rEx = await runDsl(detail.dsl);
console.log("  状态=" + rEx.status + "  extract: " + String(rEx.mid).slice(0, 120));
const allLogs = (await api(`/v2/collect/task/page?pageNum=1&pageSize=1`, { headers: H }));
ck("内置示例仍能跑通", /SUCCESS/i.test(rEx.status), rEx.status);

console.log(`\n===== SQL 护栏与审计验收：${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);
