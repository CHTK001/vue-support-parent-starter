const ws = new WebSocket("ws://127.0.0.1:9003/ws/ssh/agent-linux-001");
const msgs = [];
ws.onopen = () => {
  console.log("[open] connected");
  ws.send(JSON.stringify({ action: "ssh", sshAction: "start", sessionId: "t1", host: "local", cols: 80, rows: 24 }));
  setTimeout(() => {
    console.log("[input] hostname");
    ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: "t1", data: Buffer.from("hostname\r").toString("base64") }));
  }, 2000);
  setTimeout(() => {
    console.log("[stop]");
    ws.send(JSON.stringify({ action: "ssh", sshAction: "stop", sessionId: "t1" }));
    setTimeout(() => {
      console.log("=== ALL MESSAGES ===");
      msgs.forEach((m, i) => console.log(`[${i}] ${m}`));
      ws.close();
      process.exit(0);
    }, 2000);
  }, 6000);
};
ws.onmessage = (ev) => {
  const s = String(ev.data);
  console.log("[recv]", s.substring(0, 200));
  msgs.push(s);
};
ws.onerror = (e) => { console.log("[error]", e.message || e); };
