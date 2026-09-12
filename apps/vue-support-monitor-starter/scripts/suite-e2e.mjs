/**
 * 全链路验证（单命令完成，不依赖跨命令服务存活）：
 *  - spawn 后端 8082（匹配 vite.config 代理）
 *  - spawn vite 8848
 *  - 等双就绪 → 浏览器 /tshark → socket 推送 → 断言 → 收尾杀双进程
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, openSync } from "node:fs";
import { chromium } from "playwright-core";
import { io } from "file:///D:/ch/project/vue-support-parent-starter/apps/vue-support-monitor-starter/node_modules/@repo/core/node_modules/socket.io-client/build/esm/index.js";

const BK_WORKDIR = "D:\\ch\\project\\spring-support-parent-starter\\spring-support-monitor-starter";
const VITE_WORKDIR = "D:\\ch\\project\\vue-support-parent-starter\\apps\\vue-support-monitor-starter";
const CHROME = "C:\\Users\\Administrator\\.agent-browser\\browsers\\chrome-153.0.8010.36\\chrome.exe";
const PROXY = "http://127.0.0.1:8848";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 清理占用端口残留
import { execSync } from "node:child_process";
try {
  const out = execSync('netstat -ano | findstr "LISTENING" | findstr ":8082 :8081 :29181 :8848"', { encoding: "utf8", windowsHide: true });
  const pids = [...new Set(out.split(/\r?\n/).map(l => l.trim().split(/\s+/).pop()).filter(p => p && p !== "0"))];
  for (const pid of pids) { try { execSync(`taskkill /F /PID ${pid} 2>nul`); } catch {} }
} catch {}
await sleep(2000);

// [0] spawn 后端 8082
const cp = readFileSync(`${BK_WORKDIR}/classpath.txt`, "utf8").trim();
const bkOut = openSync(`${BK_WORKDIR}/bk-suite.log`, "w");
const bkErr = openSync(`${BK_WORKDIR}/bk-suite.err.log`, "w");
// 用 CLASSPATH 环境变量传 classpath（CreateProcess 命令行 32767 限制，32K classpath 会截断命令行）
const backend = spawn("java", ["com.chua.starter.monitor.support.MonitorApplication", "--server.port=8082"], {
  cwd: BK_WORKDIR, stdio: ["ignore", bkOut, bkErr],
  env: { ...process.env, CLASSPATH: `target\\classes;${cp}` },
});
console.log("[0] backend spawned pid=" + backend.pid);

// [1] spawn vite 8848
const vite = spawn("node", ["node_modules/vite/bin/vite.js", "--port", "8848", "--strictPort"], {
  cwd: VITE_WORKDIR, stdio: ["ignore", "ignore", "ignore"], windowsHide: true,
});
console.log("[1] vite spawned pid=" + vite.pid);

// [2] 等双就绪
let bkReady = false, viteReady = false;
for (let i = 0; i < 60; i++) {
  await sleep(2000);
  if (!bkReady) { try { const r = await fetch("http://127.0.0.1:8082/ms/monitor/tshark/check"); bkReady = r.status === 200; } catch {} }
  if (!viteReady) { try { const r = await fetch("http://127.0.0.1:8848/"); viteReady = r.status === 200; } catch {} }
  if (bkReady && viteReady) break;
}
console.log("[2] 后端:", bkReady ? "OK" : "FAIL", "| vite:", viteReady ? "OK" : "FAIL");
if (!bkReady || !viteReady) {
  if (!bkReady) console.log("    backend err tail:", readFileSync(`${BK_WORKDIR}/bk-suite.err.log`, "utf8").slice(-400));
  backend.kill(); vite.kill(); process.exit(1);
}

// [3] Node socket 订阅
const nodeSocket = io(PROXY, { path: "/socket.io", transports: ["websocket"], reconnection: false });
const received = [];
nodeSocket.on("message", (m) => { try { received.push(JSON.parse(m)); } catch { received.push({ raw: String(m).slice(0, 150) }); } });
const connOk = await new Promise((res) => { const t = setTimeout(() => res(false), 8000); nodeSocket.on("connect", () => { clearTimeout(t); res(true); }); });
console.log("[3] socket.io via vite:", connOk ? "OK" : "FAIL(后端可能未启 socketio)");

// [4] 浏览器
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
console.log("[4] 浏览器 socket:", JSON.stringify(browserSocket), "| 页面:", JSON.stringify(pageOk));
console.log("    PAGEERROR:", errors.length ? errors : "无");

// [5] 推送
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
console.log("[5] agentKey:", agentKey ? "OK" : "无", "| push HTTP:", push.status);
await sleep(4000);
console.log("[6] Node 收到:", received.length, "条");
if (received[0]) console.log("    样本:", JSON.stringify(received[0]).slice(0, 220));

await page.screenshot({ path: "e2e-final.png", fullPage: true });
nodeSocket.disconnect();
await browser.close();
backend.kill();
vite.kill();
console.log("[7] 收尾完成");

const pass = bkReady && viteReady && connOk && browserSocket.connected && pageOk.sessions && pageOk.pill && received.length > 0;
console.log("\n==== 全链路:", pass ? "PASS ✅✅✅" : "FAIL ❌", "====");
process.exit(pass ? 0 : 1);
