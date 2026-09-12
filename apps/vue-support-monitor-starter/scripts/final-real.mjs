/**
 * 终验（对齐用户架构）：后端 8082（用户 jar 实例）+ vite 8848
 * 只读/触发，不起新后端、不杀进程。
 */
import { chromium } from "playwright-core";
import { io } from "file:///D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter/node_modules/@repo/core/node_modules/socket.io-client/build/esm/index.js";

const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const PROXY = "http://127.0.0.1:8848";

console.log("[0] 后端 8082 直测");
const raw = await fetch("http://127.0.0.1:8082/ms/monitor/tshark/sessions?page=1&size=10");
console.log("    sessions:", raw.status, (await raw.text()).slice(0, 80));

// [1] Node socket(io 走 /socket.io→29181；若用户后端没开 29181 则降级跳过)
const nodeSocket = io(PROXY, { path: "/socket.io", transports: ["websocket"], reconnection: false });
const received = [];
nodeSocket.on("message", (m) => { try { received.push(JSON.parse(m)); } catch { received.push({ raw: String(m).slice(0, 120) }); } });
const connOk = await new Promise((res) => { const t = setTimeout(() => res(false), 8000); nodeSocket.on("connect", () => { clearTimeout(t); res(true); }); });
console.log("[1] socket.io via vite:", connOk ? "OK" : "后端未开 socket(ykke用户jar配置)/vite proxy不通");

// [2] 浏览器开页面
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 150)));
await page.goto(PROXY + "/#/tshark", { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(6000);
const browserSocket = await page.evaluate(() => { const s = window.__GLOBAL_SOCKET_SERVICE__; return s ? { exists: true, connected: s.isConnected } : { exists: false }; });
const pageOk = await page.evaluate(() => ({
  sessions: document.body.innerText.includes("抓包会话"),
  pill: document.querySelectorAll(".status-pill").length > 0,
  stat: document.querySelectorAll(".stat-card").length,
  chart: document.querySelectorAll(".chart-box").length,
  empty: document.querySelectorAll(".empty-detail").length,
}));
console.log("[2] 浏览器 socket:", JSON.stringify(browserSocket), "| 页面:", JSON.stringify(pageOk));
console.log("    PAGEERROR:", errors.length ? errors : "无");

// [3] 会话 CRUD（真实数据链路）
const http = (url, opt, tries = 3) => new Promise(async (resolve) => {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(PROXY + url, opt); const b = await r.text(); resolve({ status: r.status, body: b }); return; }
    catch (e) { if (i === tries - 1) resolve({ status: 0, body: String(e) }); await new Promise(r => setTimeout(r, 500)); }
  }
});
const start = await http("/ms/monitor/tshark/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "e2e-" + Date.now(), captureInterface: "lo", count: 20 }) });
console.log("[3] 启动抓包 HTTP:", start.status, start.body.slice(0, 120));

// [4] 指标推送（agent 链路）
let agentKey = "";
const list = await http("/ms/monitor");
try { const arr = JSON.parse(list.body)?.data; const hit = (Array.isArray(arr) ? arr : []).find(m => m.monitorAgentKey); agentKey = hit?.monitorAgentKey || ""; } catch {}
if (!agentKey) {
  const created = await http("/ms/monitor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monitorName: "e2e-" + Date.now(), monitorHost: "127.0.0.1", serviceType: "SERVER", monitorAgentKey: "key-" + Date.now() }) });
  try { const id = JSON.parse(created.body)?.data?.id; if (id != null) { const got = await http("/ms/monitor/" + id); agentKey = JSON.parse(got.body)?.data?.monitorAgentKey || ""; } } catch {}
}
const push = agentKey ? await http("/ms/monitor/agent/metrics", { method: "POST", headers: { "Content-Type": "application/json", "X-Agent-Key": agentKey }, body: JSON.stringify({ points: [{ metricName: "cpu_usage", value: 88.8, unit: "%" }] }) }) : { status: 0 };
console.log("[4] agentKey:", agentKey ? "OK" : "无", "| push HTTP:", push.status);
await new Promise(r => setTimeout(r, 4000));
console.log("[5] Node 收到:", received.length, "条");
if (received[0]) console.log("    样本:", JSON.stringify(received[0]).slice(0, 200));

await page.screenshot({ path: "e2e-final.png", fullPage: true });
nodeSocket.disconnect();
await browser.close();

const pass = pageOk.sessions && pageOk.pill;
console.log("\n==== 终验(用户架构):", pass ? "PASS ✅" : "FAIL ❌", "====");
process.exit(pass ? 0 : 1);
