/**
 * 终验：浏览器开 /tshark + socket 推送链路（服务已由 schtasks 独立运行，此脚本只读/触发）
 */
import { chromium } from "playwright-core";
import { io } from "file:///D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter/node_modules/@repo/core/node_modules/socket.io-client/build/esm/index.js";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const PROXY = "http://127.0.0.1:8848";

// [1] Node 订阅者
const nodeSocket = io(PROXY, { path: "/socket.io", transports: ["websocket"], reconnection: false });
const received = [];
nodeSocket.on("message", (raw) => {
  try { received.push(JSON.parse(raw)); } catch { received.push({ raw: String(raw).slice(0, 120) }); }
});
const connOk = await new Promise((res) => { const t = setTimeout(() => res(false), 8000); nodeSocket.on("connect", () => { clearTimeout(t); res(true); }); });
console.log("[1] Node socket.io:", connOk ? "OK" : "FAIL");

// [2] 浏览器
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 150)));
await page.goto(PROXY + "/#/tshark", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(5000);
const browserSocket = await page.evaluate(() => { const s = window.__GLOBAL_SOCKET_SERVICE__; return s ? { exists: true, connected: s.isConnected } : { exists: false }; });
const pageOk = await page.evaluate(() => ({
  sessions: document.body.innerText.includes("抓包会话"),
  pill: document.querySelectorAll(".status-pill").length > 0,
  empty: document.querySelectorAll(".empty-detail").length > 0,
}));
console.log("[2] 浏览器 socket:", JSON.stringify(browserSocket), "| 页面:", JSON.stringify(pageOk));

await page.evaluate(() => {
  window.__CNT__ = 0;
  const s = window.__GLOBAL_SOCKET_SERVICE__;
  if (s) s.subscribe("monitor", "metric", () => window.__CNT__++);
});

// [3] 触发推送（取/建带 agentKey 资产）
const http = (url, opt, tries = 3) => new Promise(async (resolve) => {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(PROXY + url, opt); const b = await r.text(); resolve({ status: r.status, body: b }); return; }
    catch (e) { if (i === tries - 1) resolve({ status: 0, body: String(e) }); await new Promise(r => setTimeout(r, 500)); }
  }
});
let agentKey = "";
const list = await http("/ms/monitor");
try { const arr = JSON.parse(list.body)?.data; const hit = (Array.isArray(arr) ? arr : []).find(m => m.monitorAgentKey); agentKey = hit?.monitorAgentKey || ""; } catch {}
if (!agentKey) {
  const created = await http("/ms/monitor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monitorName: "e2e-" + Date.now(), monitorHost: "127.0.0.1", serviceType: "SERVER", monitorAgentKey: "key-" + Date.now() }) });
  try { const id = JSON.parse(created.body)?.data?.id; if (id != null) { const got = await http("/ms/monitor/" + id); agentKey = JSON.parse(got.body)?.data?.monitorAgentKey || ""; } } catch {}
}
const push = agentKey ? await http("/ms/monitor/agent/metrics", { method: "POST", headers: { "Content-Type": "application/json", "X-Agent-Key": agentKey }, body: JSON.stringify({ points: [{ metricName: "cpu_usage", value: 77.7, unit: "%" }] }) }) : { status: 0 };
console.log("[3] agentKey:", agentKey ? "OK" : "无", "| push HTTP:", push.status);
await new Promise(r => setTimeout(r, 4000));

// [4] 断言
const browserCnt = await page.evaluate(() => window.__CNT__);
console.log("[4] Node 收到:", received.length, "条 | 浏览器收到 metric:", browserCnt, "次");
console.log("    Node 消息样本:", JSON.stringify(received[0] || null).slice(0, 200));

await page.screenshot({ path: "e2e-final.png", fullPage: true });
console.log("[5] 截图: e2e-final.png");
nodeSocket.disconnect();
await browser.close();

const pass = connOk && browserSocket.connected && pageOk.sessions && received.length > 0 && browserCnt > 0;
console.log("\n==== 端到端:", pass ? "PASS ✅✅✅" : "FAIL ❌", "====");
process.exit(pass ? 0 : 1);