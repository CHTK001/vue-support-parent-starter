const ws = new WebSocket("ws://127.0.0.1:9003/ws/ssh/agent-linux-001");
ws.onopen = () => {
  console.log("WS OPEN - sending start");
  ws.send(JSON.stringify({ action: "ssh", sshAction: "start", sessionId: "test-1", host: "local", cols: 80, rows: 24 }));
  setTimeout(() => {
    console.log("Sending input: dir /b");
    ws.send(JSON.stringify({ action: "ssh", sshAction: "input", sessionId: "test-1", data: Buffer.from("dir /b\r").toString("base64") }));
  }, 1000);
  setTimeout(() => {
    console.log("Stopping...");
    ws.send(JSON.stringify({ action: "ssh", sshAction: "stop", sessionId: "test-1" }));
    setTimeout(() => { ws.close(); process.exit(0); }, 500);
  }, 5000);
};
ws.onmessage = (ev) => {
  const msg = JSON.parse(String(ev.data));
  console.log("RECV:", JSON.stringify(msg));
};
ws.onerror = (e) => { console.log("WS ERROR:", e.message || e); process.exit(1); };
