/**
 * 网关 Mock 后端 —— 用于联调测试 vue-support-gateway-starter
 * 监听 18300，提供 /gateway/api/v2/setting/default 和 /admin/api/gateway/info 接口
 *
 * 启动：node apps/vue-support-gateway-starter/mock-server/server.mjs
 */
import { createServer } from "node:http";

const PORT = 18300;

const MOCK_INFO = {
  code: 0,
  msg: "ok",
  data: {
    health: { status: "UP", agents: 3, targets: 5 },
    controllers: [
      { id: "c-001", type: "web", ipAddress: "127.0.0.1", connectedAt: Date.now() - 60000 },
      { id: "c-002", type: "desktop", ipAddress: "192.168.1.10", connectedAt: Date.now() - 300000 },
    ],
    agents: [
      {
        agentId: "agent-001",
        agentType: "java",
        verifyCode: "847291",
        ipAddress: "192.168.1.20",
        remotePort: 8080,
        protocols: ["SSH", "DESKTOP"],
        codecs: ["H264", "JPEG"],
        capabilities: { "os.name": "Linux", "os.arch": "amd64", "os.version": "5.15.0" },
        targets: [
          { targetId: "t-001-ssh", protocol: "SSH", online: true },
          { targetId: "t-001-desktop", protocol: "DESKTOP", online: true, transport: "TCP" },
        ],
      },
      {
        agentId: "agent-002",
        agentType: "rust",
        verifyCode: "193847",
        ipAddress: "192.168.1.21",
        protocols: ["DESKTOP"],
        codecs: ["H264"],
        capabilities: { "os.name": "macOS", "os.arch": "arm64" },
        targets: [{ targetId: "t-002-desktop", protocol: "DESKTOP", online: true }],
        temporary: true,
      },
      {
        agentId: "agent-003",
        agentType: "java",
        verifyCode: "562910",
        ipAddress: "192.168.1.22",
        protocols: ["SSH"],
        codecs: [],
        capabilities: { "os.name": "Windows", "os.arch": "amd64" },
        targets: [{ targetId: "t-003-ssh", protocol: "SSH", online: false }],
      },
    ],
    tokens: [
      { token: "tk-abc123def456", agentId: "agent-001", createdAt: Date.now() - 86400000, expiresAt: Date.now() + 86400000 },
    ],
  },
};

const MOCK_DEFAULT_SETTING = { code: 0, msg: "ok", data: [] };

const server = createServer((req, res) => {
  console.log(`[mock] ${req.method} ${req.url}`);

  // 允许跨域（vite dev server 自身有 CORS，这里兜底）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-ec, x-ck, x-response-version, x-sign, x-sign-timestamp, x-sign-nonce, x-sign-fingerprint");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  res.setHeader("Content-Type", "application/json");

  if (req.url?.startsWith("/gateway/api/gateway/info") || req.url?.startsWith("/admin/api/gateway/info")) {
    res.writeHead(200);
    res.end(JSON.stringify(MOCK_INFO));
    return;
  }

  if (req.url?.startsWith("/gateway/api/v2/setting/default")) {
    res.writeHead(200);
    res.end(JSON.stringify(MOCK_DEFAULT_SETTING));
    return;
  }

if (req.url?.startsWith("/gateway/api/gateway/kick") || req.url?.startsWith("/admin/api/gateway/kick")) {
    res.writeHead(200);
    res.end(JSON.stringify({ code: 0, msg: "kicked" }));
    return;
  }

  if (req.url?.startsWith("/gateway/api/gateway/targets") || req.url?.startsWith("/admin/api/gateway/targets")) {
    res.writeHead(200);
    res.end(JSON.stringify({
      code: 0,
      msg: "ok",
      data: [
        { targetId: "t-001-ssh", protocol: "SSH", online: true },
        { targetId: "t-001-desktop", protocol: "DESKTOP", online: true },
        { targetId: "t-002-desktop", protocol: "DESKTOP", online: true },
        { targetId: "t-003-ssh", protocol: "SSH", online: false },
      ],
    }));
    return;
  }

  if (req.url?.startsWith("/gateway/api/remote/session") || req.url?.startsWith("/api/remote/session")) {
    res.writeHead(200);
    res.end(JSON.stringify({
      code: 0,
      msg: "ok",
      data: { sessionId: "sess-" + Date.now(), createdAt: Date.now() },
    }));
    return;
  }

  // 兜底
  res.writeHead(404);
  res.end(JSON.stringify({ code: 404, msg: "not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[mock] gateway backend listening on http://127.0.0.1:${PORT}`);
  console.log(`[mock] GET /admin/api/gateway/info`);
  console.log(`[mock] GET /gateway/api/v2/setting/default`);
});
