// 采集前端验收编排器：起本地 vite（不打包）+ 跑指定浏览器脚本 + 收尾。
//
// 位置说明：原先放在 Temp/opencode/，但那个目录是跨会话共享的，2026-09-30 被别的会话整体清空
// （0 文件），连同设计契约与全部 accept-* 一起丢了。改放 vue 仓根，与本目录其它 pw-*.mjs 同处。
//
// 关键点：
//   - 后台在 192.168.50.198:18190，本机不启后台；
//   - 起 vite 前先清掉占用 19096-19100 的残留进程：残留实例没有本轮环境变量，
//     代理会回落到 127.0.0.1:18190 并返回 502，而探针只看「端口通不通」，会把 502 误判成后台故障；
//   - 代理自测若得 502 直接判硬错并说明成因，不继续跑（否则浏览器里全是登录失败噪声）。
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const ROOT = "D:/ch/project/vue-support-parent-starter";
const VITE_DIR = `${ROOT}/apps/vue-support-collect-scheduler-starter`;
const API_TARGET = process.env.COLLECT_API_TARGET || "http://192.168.50.198:18190";
const SCHED_TARGET = process.env.COLLECT_SCHEDULER_TARGET || "http://192.168.50.198:18191";

const procs = [];
function killAll() {
  for (const p of procs) {
    if (!p || p.killed) continue;
    try {
      spawn("taskkill", ["/pid", String(p.pid), "/t", "/f"], { stdio: "ignore", shell: false });
    } catch { /* ignore */ }
  }
}
async function portOpen(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1500) });
    return r.status > 0;
  } catch {
    return false;
  }
}

try {
  console.log(`[orch] 后台目标 = ${API_TARGET}`);
  let beOk = false;
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${API_TARGET}/collect/api/v2/collect/designer/metas`, { signal: AbortSignal.timeout(4000) });
      console.log(`[orch] 后台探测 = HTTP ${r.status}`);
      beOk = r.status > 0;
      break;
    } catch {
      await sleep(2000);
    }
  }
  if (!beOk) throw new Error(`后台 ${API_TARGET} 不可达`);

  const freed = await new Promise((resolve) => {
    const ps = spawn("powershell", ["-NoProfile", "-Command",
      "$p=@(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -ge 19096 -and $_.LocalPort -le 19100 } | Select-Object -ExpandProperty OwningProcess -Unique); " +
      "foreach($x in $p){ taskkill /pid $x /t /f | Out-Null }; $p.Count"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    ps.stdout.on("data", (d) => (out += d));
    ps.on("close", () => resolve(String(out).trim()));
  });
  console.log(`[orch] 清掉占用 19096-19100 的残留进程数 = ${freed}`);
  if (freed !== "0") await sleep(2500);

  console.log("[orch] 启动 vite ...");
  const vite = spawn("cmd", ["/c", "pnpm exec vite"], {
    cwd: VITE_DIR,
    stdio: ["ignore", "ignore", "ignore"],
    detached: true,
    env: { ...process.env, COLLECT_API_TARGET: API_TARGET, COLLECT_SCHEDULER_TARGET: SCHED_TARGET },
  });
  procs.push(vite);
  vite.unref();

  let port = null;
  const candidates = [19096, 19097, 19098, 19099, 19100];
  for (let i = 0; i < 90 && !port; i++) {
    await sleep(1000);
    for (const p of candidates) {
      if (await portOpen(p)) { port = p; break; }
    }
  }
  console.log(`[orch] vite 端口 = ${port}`);
  if (!port) throw new Error("vite 未就绪");
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (r.status > 0) break;
    } catch { /* retry */ }
  }

  const viaVite = await fetch(`http://127.0.0.1:${port}/collect/api/v2/collect/designer/metas`, { signal: AbortSignal.timeout(8000) });
  const body = (await viaVite.text()).slice(0, 160);
  console.log(`[orch] vite 代理 -> 后台 = HTTP ${viaVite.status}  ${body.replace(/\s+/g, " ")}`);
  if (viaVite.status === 502) {
    throw new Error(`vite 代理 502（端口 ${port} 上可能是无环境变量的残留实例，目标回落到了 127.0.0.1:18190）`);
  }

  const script = process.argv[2] || "pw-picker.mjs";
  console.log(`[orch] 跑浏览器验证：${script} ...\n`);
  const rc = await new Promise((resolve) => {
    const pw = spawn("node", [script], {
      cwd: ROOT,
      env: { ...process.env, PW_BASE: `http://localhost:${port}`, API_TARGET },
      shell: false,
      stdio: "inherit",
    });
    pw.on("exit", (code) => resolve(code ?? 1));
  });
  console.log(`\n[orch] 验证退出码 = ${rc}`);
  killAll();
  await sleep(2500);
  process.exit(rc);
} catch (e) {
  console.log("[orch] 失败: " + e.message);
  killAll();
  await sleep(2000);
  process.exit(1);
}
