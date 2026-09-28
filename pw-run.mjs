// 一次性编排器：起 dev server -> 等端口 -> 跑验收脚本 -> 收服务。
//
// 为什么需要它：根因未查明的 dev server 反复静默退出（exit code 1，stderr 无输出），
// 单独把 vite 放后台再另起一条命令跑 Playwright，中间存在被杀的时间窗。
// 放进同一条命令里就没有这个窗口了。
//
// 用法：node pw-run.mjs <验收脚本名> [更多脚本...]
//   例：node pw-run.mjs pw-card-node.mjs pw-dag-practice.mjs
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createConnection } from "node:net";

const APP_DIR = "apps/vue-support-collect-scheduler-starter";
const PORT = 19096;
const scripts = process.argv.slice(2);
if (!scripts.length) {
  console.error("用法: node pw-run.mjs <脚本> [更多脚本...]");
  process.exit(2);
}

const env = {
  ...process.env,
  COLLECT_API_TARGET: "http://192.168.50.198:18190",
  COLLECT_SCHEDULER_TARGET: "http://192.168.50.198:18190",
  FORCE_COLOR: "0",
};

console.log(`[run] 启动 dev server（${APP_DIR}，配置端口 ${PORT}）...`);
const vite = spawn("pnpm", ["exec", "vite"], {
  cwd: APP_DIR,
  env,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});
// 应用的 vite.config 里 strictPort:false，端口被占时会自动顺延。所以不能假定一定是 19096，
// 必须从 stdout 里把 vite 实际报的端口抠出来，通过 PW_BASE 传给验收脚本 ——
// 否则脚本会打到别人的旧实例上（实测踩过：vite 顺延到 19097、脚本仍打 19096，
// 命中的是上一个残留实例，直接报「设计器已挂载」失败）。
// vite 输出带 ANSI 颜色码，URL 里也一样（localhost:\x1b[36m19096\x1b[39m/），
// 不先剥掉色码就永远匹配不到端口号。
const ANSI = /\x1b\[[0-9;]*m/g;
let actualPort = null;
const viteTag = (raw) => {
  const s = raw.replace(ANSI, "");
  const m = s.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)\//);
  if (m && !actualPort) actualPort = Number(m[1]);
  process.stdout.write(`[vite] ${s}\n`);
};
vite.stdout.on("data", (b) => b.toString().split("\n").filter(Boolean).forEach(viteTag));
vite.stderr.on("data", (b) => b.toString().split("\n").filter(Boolean).forEach(viteTag));
let viteExited = null;
vite.on("exit", (code, sig) => { viteExited = `code=${code} sig=${sig}`; });

env.PW_BASE = "http://localhost:19096";

function portOpen(port) {
  return new Promise((res) => {
    const s = createConnection({ port, host: "127.0.0.1" });
    const done = (v) => { s.destroy(); res(v); };
    s.once("connect", () => done(true));
    s.once("error", () => done(false));
    setTimeout(() => done(false), 1500);
  });
}

async function waitPort(timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (viteExited) throw new Error(`dev server 提前退出 (${viteExited})`);
    if (actualPort && await portOpen(actualPort)) return actualPort;
    await new Promise((r) => setTimeout(r, 400));
  }
  return null;
}

function killVite() {
  if (viteExited) return;
  // pnpm 走 shell 会多一层，tree 杀才连 vite 本体一起收掉，否则端口会被占住
  try {
    spawn("taskkill", ["/pid", String(vite.pid), "/t", "/f"], { stdio: "ignore" });
  } catch { /* 忽略：进程可能已自行退出 */ }
}

let failed = 0;
try {
  const ready = await waitPort(150000);
  if (!ready) throw new Error(`150s 内 dev server 未就绪（${viteExited || "仍在启动"}）`);
  env.PW_BASE = `http://localhost:${ready}`;
  console.log(`[run] dev server 就绪：${env.PW_BASE}（配置端口 ${PORT}${ready === PORT ? "" : "，实际已顺延"}）`);
  console.log(`[run] 开始跑验收\n`);
  for (const s of scripts) {
    console.log(`\n${"=".repeat(70)}\n[run] ===== ${s} =====\n${"=".repeat(70)}`);
    const p = spawn("node", [s], { env, shell: false, stdio: "inherit" });
    const [code] = await once(p, "exit");
    if (code !== 0) failed += 1;
  }
} catch (e) {
  console.error("[run] 失败: " + e.message);
  failed += 1;
} finally {
  killVite();
  await new Promise((r) => setTimeout(r, 800));
}

console.log(`\n[run] 收尾：${failed === 0 ? "全部脚本通过" : failed + " 个脚本未通过"}`);
process.exit(failed ? 1 : 0);
