// 查两个内置示例流程用到的 parserType，决定「删多余类型」会牵连到什么。
const API = "http://192.168.50.198:18190/collect/api";
const login = await (await fetch(`${API}/v2/user/login`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "123456" }),
})).json();
const H = { Authorization: "Bearer " + login.data.accessToken };
const flows = (await (await fetch(`${API}/v2/collect/flow/list`, { headers: H })).json()).data ?? [];
for (const f of flows) {
  const d = (await (await fetch(`${API}/v2/collect/flow/detail?flowId=${f.collectFlowId}`, { headers: H })).json()).data;
  const counts = {};
  for (const n of d.dsl?.nodes ?? []) {
    for (const fld of n.fields ?? []) {
      const t = String(fld.parserType ?? "(空)").toUpperCase();
      counts[t] = (counts[t] || 0) + 1;
    }
    // 数据库/SQL 节点里也可能有 parserType（字段映射不是，但 SQL 出参可能是）
  }
  console.log(`流程 ${f.collectFlowId} 「${f.collectFlowName}」 字段类型统计: ${JSON.stringify(counts)}`);
  for (const n of d.dsl?.nodes ?? []) {
    if ((n.fields ?? []).length) {
      console.log(`   ${n.id}(${n.shape}) ${n.fields.length} 个字段: ` + n.fields.map((x) => `${x.name}=${x.parserType}`).join(", ").slice(0, 200));
    }
  }
}
console.log("\n后端支持的解析器类型（来自 CollectExtractExecutor）:");
console.log("  CSS / REGEX / JSON / JSONPATH / XPATH / TEXT / HTML（前端 PARSER_TYPES 与之一致）");
