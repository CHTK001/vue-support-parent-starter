const WebSocket = require("ws");
const ws = new WebSocket("ws://127.0.0.1:9003/ws/ssh/agent-linux-001");
ws.on("open", () => {
  console.log("WS OPEN");
  ws.send(JSON.stringify({ action: "ssh", sshAction: "start", sessionId: "test-1", host: "local", cols: 80, rows: 24 }));
  setTimeout(() => {
    ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: "test-1", data: Buffer.from("echo Hello World\r").toString("base64") }));
  }, 500);
  setTimeout(() => {
    ws.send(JSON.stringify({ action: "ssh", sshAction: "stop", sessionId: "test-1" }));
    ws.close();
    process.exit(0);
  }, 3000);
});
ws.on("message", (msg) => {
  console.log("RECV:", msg.toString().substring(0, 300));
});
ws.on("error", (e) => { console.log("WS ERROR:", e.message); process.exit(1); });
