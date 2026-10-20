/**
 * report 客户端注册模拟器（TCP sync 协议）。
 *
 * <p>按 report-client 的真实线上行为连接 monitor 的 sync 服务端：
 * 1) 发送 {@code register:<clientId>}，等待 {@code registered:<clientId>}；
 * 2) 发送 {@code sync/client/register:<json>}（客户端注册）；
 * 3) 发送 {@code monitor/app/report:<json>}（应用信息，每 30s 一次，这里周期发送）。
 *
 * <p>用于在浏览器验收中驱动真实后端（不是 mock 接口）。</p>
 *
 * 用法：
 *   $env:SYNC_PORT="19380"
 *   node scripts/report-node-sim.mjs
 *
 * 环境变量：
 *   SYNC_HOST  默认 127.0.0.1
 *   SYNC_PORT  默认 19380
 *   NODES      JSON 数组，覆盖默认节点
 *   DROP_AFTER 毫秒；到点后关闭最后一个节点连接（用于验证离线）
 */
import net from "node:net";

const HOST = process.env.SYNC_HOST || "127.0.0.1";
const PORT = Number(process.env.SYNC_PORT || 19380);
const DROP_AFTER = Number(process.env.DROP_AFTER || 0);

const DEFAULT_NODES = [
  { clientId: "node-order-01", appName: "order-service", ip: "10.0.0.11", port: 8080, env: "prod", hostname: "node-a" },
  { clientId: "node-user-01", appName: "user-service", ip: "10.0.0.12", port: 8080, env: "prod", hostname: "node-b" },
  { clientId: "node-report-01", appName: "report-service", ip: "10.0.0.13", port: 9000, env: "test", hostname: "node-c" },
];

const nodes = process.env.NODES ? JSON.parse(process.env.NODES) : DEFAULT_NODES;
const sockets = [];

function reportPayload(n) {
  const now = Date.now();
  return {
    applicationName: n.appName,
    activeProfiles: n.env,
    contextPath: "/",
    ipAddress: n.ip,
    hostname: n.hostname,
    serverPort: n.port,
    serviceUrl: `http://${n.ip}:${n.port}`,
    jvmName: "OpenJDK 64-Bit Server VM",
    jvmVersion: "25+36",
    javaVersion: "25",
    pid: 10000 + n.port,
    startTime: now - 3_600_000,
    uptime: 3_600_000,
    timestamp: now,
    osName: "Linux",
    osVersion: "5.15.0",
    osArch: "amd64",
    heapUsed: 268_435_456,
    heapMax: 1_073_741_824,
    threadCount: 42,
  };
}

function connectNode(n) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: HOST, port: PORT }, () => {
      sock.write(`register:${n.clientId}\n`);
    });
    let buf = "";
    let registered = false;
    const timer = setTimeout(() => {
      if (!registered) reject(new Error(`节点 ${n.clientId} 注册超时`));
    }, 8_000);

    sock.on("data", (d) => {
      buf += d.toString("utf8");
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.startsWith("registered:")) {
          registered = true;
          clearTimeout(timer);
          const reg = {
            clientId: n.clientId,
            clientApplicationName: n.appName,
            clientIpAddress: n.ip,
            clientPort: n.port,
            clientMetadata: { env: n.env, hostname: n.hostname },
          };
          sock.write(`sync/client/register:${JSON.stringify(reg)}\n`);
          sock.write(`monitor/app/report:${JSON.stringify(reportPayload(n))}\n`);
          resolve({ sock, node: n });
        }
      }
    });
    sock.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
}

const started = [];
for (const n of nodes) {
  try {
    const r = await connectNode(n);
    started.push(r);
    sockets.push(r.sock);
    console.log(`[sim] registered ${n.clientId} (${n.appName})`);
  } catch (e) {
    console.error(`[sim] ${n.clientId} failed: ${e.message}`);
  }
}

// 周期重发应用信息，模拟 AppRegisterReporter（30s 一次）
const reportTimer = setInterval(() => {
  for (const r of started) {
    if (!r.sock.destroyed) {
      r.sock.write(`monitor/app/report:${JSON.stringify(reportPayload(r.node))}\n`);
    }
  }
}, 30_000);

if (DROP_AFTER > 0 && sockets.length) {
  setTimeout(() => {
    const last = sockets[sockets.length - 1];
    if (last && !last.destroyed) {
      last.destroy();
      console.log(`[sim] dropped ${started[started.length - 1].node.clientId} -> offline`);
    }
  }, DROP_AFTER);
}

console.log(`[sim] READY ${started.length}/${nodes.length}`);

function shutdown() {
  clearInterval(reportTimer);
  for (const s of sockets) {
    try { s.destroy(); } catch { /* ignore */ }
  }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
