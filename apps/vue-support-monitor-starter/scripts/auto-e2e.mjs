/**
 * 全自动：spawn 后端 → 等就绪 → 浏览器验证 → socket 推送 → 收尾
 * 全部在一个 node 进程内（Job Object 只在该命令存活期间有效，命令退出后进程清理）
 * 前端 8848 已由外部独立运行。
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { io } from "../node_modules/@repo/core/node_modules/socket.io-client/build/esm/index.js";

const WORKDIR = "D:\\ch\\project\\spring-support-parent-starter\\spring-support-monitor-starter";
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const PROXY = "http://127.0.0.1:8848";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 清理占用 8081/29181 的残留
import { execSync } from "node:child_process";
try {
  const out = execSync('netstat -ano | findstr "LISTENING" | findstr ":8081 :29181"', { encoding: "utf8", windowsHide: true });
  const pids = [...new Set(out.split(/\r?\n/).map(l => l.trim().split(/\s+/).pop()).filter(p => p && p !== "0"))];
  for (const pid of pids) { try { execSync(`taskkill /F /PID ${pid}`); } catch {} }
} catch {}

// [0] 启动后端（node spawn 直连，绕开 cmd 8191 限制；fd 重定向日志）
const cp = readFileSync(`${WORKDIR}/classpath.txt`, "utf8").trim();
const { openSync } = await import("node:fs");
const outFd = openSync(`${WORKDIR}/backend-auto.log`, "w");
const errFd = openSync(`${WORKDIR}/backend-auto.err.log`, "w");
const backend = spawn("java", ["-cp", `target\\classes;${cp}`, "com.chua.starter.monitor.support.MonitorApplication", "--server.port=8081"], {
  cwd: WORKDIR, detached: true, stdio: ["ignore", outFd, errFd],
});
backend.unref();
console.log("[0] backend pid=" + backend.pid);

// [1] 等就绪
let ready = false;
for (let i = 0; i < 50; i++) {
  await sleep(2000);
  try { const r = await fetch("http://127.0.0.1:8081/ms/monitor/tshark/check"); if (r.status === 200) { ready = true; break; } } catch {}
}
console.log("[1] 8081 就绪:", ready ? "OK" : "FAIL (err log tail: " + readFileSync(`${WORKDIR}/backend-auto.err.log`, "utf8").slice(-300) + ")");

// [2] Node socket 订阅（经 vite 代理）
const nodeSocket = io(PROXY, { path: "/socket.io", transports: ["websocket"], reconnection: false });
const received = [];
nodeSocket.on("message", (raw) => { try { received.push(JSON.parse(raw)); } catch { received.push({ raw: String(raw).slice(0, 150) }); } });
const connOk = await new Promise((res) => { const t = setTimeout(() => res(false), 8000); nodeSocket.on("connect", () => { clearTimeout(t); res(true); }); });
console.log("[2] Node socket.io via vite:", connOk ? "OK" : "FAIL");

// [3] 浏览器
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
  table: document.querySelectorAll(".packet-card").length,
  empty: document.querySelectorAll(".empty-detail").length,
}));
console.log("[3] 浏览器 socket:", JSON.stringify(browserSocket), "| 页面:", JSON.stringify(pageOk));

// [4] 触发推送
const http = (url, opt, tries = 3) => new Promise(async (resolve) => {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(PROXY + url, opt); const b = await r.text(); resolve({ status: r.status, body: b }); return; }
    catch (e) { if (i === tries - 1) resolve({ status: 0, body: String(e) }); await sleep(500); }
  }
});
let agentKey = "";
const list = await http("/ms/monitor");
try { const arr = JSON.parse(list.body)?.data; const hit = (Array.isArray(arr) ? arr : []).find(m => m.monitorAgentKey); agentKey = hit?.monitorAgentKey || ""; } catch {}
if (!agentKey) {
  const created = await http("/ms/monitor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monitorName: "e2e-" + Date.now(), monitorHost: "127.0.0.1", serviceType: "SERVER", monitorAgentKey: "key-" + Date.now() }) });
  try { const id = JSON.parse(created.body)?.data?.id; if (id != null) { const got = await http("/ms/monitor/" + id); agentKey = JSON.parse(got.body)?.data?.monitorAgentKey || ""; } } catch {}
}
const push = agentKey ? await http("/ms/monitor/agent/metrics", { method: "POST", headers: { "Content-Type": "application/json", "X-Agent-Key": agentKey }, body: JSON.stringify({ points: [{ metricName: "cpu_usage", value: 88.8, unit: "%" }] }) }) : { status: 0 };
console.log("[4] agentKey:", agentKey ? "OK" : "无", "| push HTTP:", push.status);
await sleep(4000);
console.log("[5] Node 收到:", received.length, "条");
if (received[0]) console.log("    Node 消息:", JSON.stringify(received[0]).slice(0, 200));

await page.screenshot({ path: "e2e-final.png", fullPage: true });
nodeSocket.disconnect();
await browser.close();
backend.kill();
console.log("[6] 收尾，后端已回收");

const pass = ready && connOk && browserSocket.connected && pageOk.sessions && received.length > 0;
console.log("\n==== 端到端:", pass ? "PASS ✅✅✅" : "FAIL ❌", "====");
process.exit(pass ? 0 : 1);
