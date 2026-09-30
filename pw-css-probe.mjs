// CSS 抽取链路的定性实验。
//
// 背景：端到端闭环里 XPath 字段取到了值、同一个 extract 里的 CSS 字段（h1 + attribute=text）却是 NULL，
// 换源（resp → respDoc）也一样。拾取器给出的主产物正是 CSS 选择器，所以这条必须定性。
//
// 做法：一个 extract 放 7 个字段，覆盖 CSS 的各种取法与 XPath 对照，落草表后读回：
//   css_body_text / css_h1_text / css_h1_html / css_a_text / css_a_href(attribute=attr) / xp_h1_text / xp_a_href
// 判定：
//   若 CSS 全 NULL 而 XPath 有值 → CSS 抽取链路缺陷（拾取器产物不可用）
//   若部分 CSS 有值 → 是我上一轮字段配置的问题，并据此订正用法说明
import { spawn } from "node:child_process";

const API = "http://192.168.50.198:18190/collect/api";
const PLINK = "C:\\Program Files\\PuTTY\\plink.exe";
const HK = "ssh-ed25519 255 SHA256:+1fng3xnq68Cacd77WZi7mZD6mn12lRQdH7dpvgdwrk";
const TABLE = "zz_css_probe";

function remoteBash(script) {
  return new Promise((resolve) => {
    const p = spawn(PLINK, ["-batch", "-no-antispoof", "-hostkey", HK, "-pw", "kali",
      "kali@192.168.50.198", "sudo -S bash -s"], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", () => resolve(out + (err.trim() ? "\n[stderr] " + err.trim() : "")));
    p.stdin.write("kali\n" + script);
    p.stdin.end();
  });
}
const mysql = (sql) => remoteBash(`sudo -n mysql collect -e ${JSON.stringify(sql)} 2>&1\n`);
async function api(path, init = {}) {
  const r = await fetch(API + path, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) }, signal: AbortSignal.timeout(60000) });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { raw: t, status: r.status }; }
}
const login = await api("/v2/user/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "123456" }) });
const H = { Authorization: "Bearer " + login.data.accessToken };

console.log(await mysql(`drop table if exists ${TABLE}`));
console.log(await mysql(`create table ${TABLE} (id int primary key, css_body_text text, css_h1_text text, css_h1_html text, css_a_text text, css_a_href text, xp_h1_text text, xp_a_href text)`));

const p = (name, value) => ({ name, value });
const FIELDS = [
  { name: "css_body_text", parserType: "CSS", expression: "body", attribute: "text" },
  { name: "css_h1_text", parserType: "CSS", expression: "h1", attribute: "text" },
  { name: "css_h1_html", parserType: "CSS", expression: "h1", attribute: "html" },
  { name: "css_a_text", parserType: "CSS", expression: "a", attribute: "text" },
  { name: "css_a_href", parserType: "CSS", expression: "a", attribute: "attr", attrName: "href" },
  { name: "xp_h1_text", parserType: "XPATH", expression: "//h1/text()" },
  { name: "xp_a_href", parserType: "XPATH", expression: "/html[1]/body[1]/a[1]/@href" },
];
const dsl = {
  name: "ZZ-CSS-PROBE", threadCount: 1, headers: [], cookies: [], variables: [],
  nodes: [
    { id: "n1", shape: "start", name: "起点", x: 60, y: 120, params: [p("urls", "https://example.com/")], fields: [] },
    { id: "n2", shape: "request", name: "抓取", x: 220, y: 120, params: [p("url", "${url}"), p("method", "GET"), p("outputVariable", "resp")], fields: [] },
    { id: "n3", shape: "extract", name: "多取法对照", x: 380, y: 120, params: [p("source", "${resp}"), p("mode", "single"), p("outputVariable", "rows")], fields: FIELDS },
    { id: "n4", shape: "database", name: "写探针表", x: 540, y: 120, params: [
      p("source", "${rows}"), p("table", TABLE), p("mode", "update"), p("batchSize", "200"),
      p("column:id", "1"),
      ...FIELDS.map((f) => p(`column:${f.name}`, "${" + f.name + "}")),
      p("key:id", "1"),
    ], fields: [] },
    { id: "n5", shape: "end", name: "结束", x: 700, y: 120, params: [], fields: [] },
  ],
  edges: [
    { id: "e1", from: "n1", to: "n2", condition: "", exceptionFlow: "" },
    { id: "e2", from: "n2", to: "n3", condition: "", exceptionFlow: "" },
    { id: "e3", from: "n3", to: "n4", condition: "", exceptionFlow: "" },
    { id: "e4", from: "n4", to: "n5", condition: "", exceptionFlow: "" },
  ],
};

console.log("=== 提交（dry-run）===");
const run = await api("/v2/collect/execution/dry-run", { method: "POST", headers: H, body: JSON.stringify(dsl) });
console.log("  success=" + run?.success + " msg=" + run?.msg + " taskId=" + run?.data?.collectTaskId);
if (run?.data?.collectTaskId) {
  let d = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((s) => setTimeout(s, 2000));
    d = (await api(`/v2/collect/task/detail?taskId=${run.data.collectTaskId}`, { headers: H }))?.data;
    if (d && /SUCCESS|FAIL|STOP/i.test(String(d.collectTaskStatus))) break;
  }
  console.log("  任务状态=" + d?.collectTaskStatus);
  const logs = (await api(`/v2/collect/task/logs?taskId=${run.data.collectTaskId}`, { headers: H }))?.data ?? [];
  for (const l of logs) console.log(`     | ${l.collectTaskLogNodeId} ${l.collectTaskLogNodeShape} ${l.collectTaskLogStatus} ${String(l.collectTaskLogMessage ?? "").replace(/\s+/g, " ").slice(0, 200)}`);
  await api(`/v2/collect/task/delete?taskId=${run.data.collectTaskId}`, { method: "DELETE", headers: H });
}

console.log("\n=== 探针表内容（NULL 即没抽到）===");
const rows = await mysql(`select * from ${TABLE}\\G`);
console.log(rows.split("\n").filter((l) => l.trim() && !l.includes("***") && !l.includes("ERROR")).join("\n"));

console.log("\n=== 判定 ---");
const rowText = rows;
const cssGot = ["css_body_text", "css_h1_text", "css_h1_html", "css_a_text", "css_a_href"].some((c) => {
  const m = rowText.match(new RegExp(c + ":\\s*(.*)"));
  return m && m[1].trim() && m[1].trim() !== "NULL";
});
const xpGot = /xp_a_href:\s*https?:\/\//.test(rowText);
console.log("  CSS 组是否取到任意值: " + cssGot);
console.log("  XPath 对照组是否取到值: " + xpGot);
console.log("  => " + (cssGot ? "CSS 链路可用，上一轮是字段配置问题" : (xpGot ? "**CSS 链路缺陷**：XPath 有值而 CSS 全 NULL" : "两者都没取到，需再查源")));
console.log("\n=== 清理 ===");
console.log(await mysql(`drop table if exists ${TABLE}`));
