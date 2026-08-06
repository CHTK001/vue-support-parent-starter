import http from "node:http";

const PORT = 3000;

const agents = [
  {
    agentId: "test-agent-rustdesk",
    verifyCode: "123456",
    online: true,
    protocols: ["RUSTDESK", "SSH", "DESKTOP"],
    capabilities: {
      rustdesk_id: "123456789",
      rustdesk_password: "tempPass123",
      rustdesk_port: "21116",
    },
  },
];

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "UP", agents: agents.length }));
    return;
  }

  // GET /admin/api/agents
  if (url.pathname === "/admin/api/agents" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(agents));
    return;
  }

  // GET /api/agents
  if (url.pathname === "/api/agents" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(agents));
    return;
  }

  // PUT /admin/api/agents/:id/disable
  const disableMatch = url.pathname.match(/^\/admin\/api\/agents\/(.+)\/disable$/);
  if (disableMatch && req.method === "PUT") {
    const id = disableMatch[1];
    const agent = agents.find((a) => a.agentId === id);
    if (agent) {
      agent.online = false;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
    return;
  }

  // PUT /admin/api/agents/:id/enable
  const enableMatch = url.pathname.match(/^\/admin\/api\/agents\/(.+)\/enable$/);
  if (enableMatch && req.method === "PUT") {
    const id = enableMatch[1];
    const agent = agents.find((a) => a.agentId === id);
    if (agent) {
      agent.online = true;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
    return;
  }

  // POST /admin/api/token/verify
  if (url.pathname === "/admin/api/token/verify" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ valid: true }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
  console.log(`  GET /health`);
  console.log(`  GET /admin/api/agents`);
  console.log(`  GET /api/agents`);
});