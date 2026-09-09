const ws = new WebSocket("ws://127.0.0.1:9003/ws/vnc/agent-linux-001");
const frames = [];
ws.onopen = () => {
  console.log("[open] vnc connected");
  ws.send(JSON.stringify({ action: "vnc", vncAction: "start", sessionId: "vnc-test-1" }));
  setTimeout(() => {
    console.log("[stop] stopping vnc session");
    ws.send(JSON.stringify({ action: "vnc", vncAction: "stop", sessionId: "vnc-test-1" }));
    setTimeout(() => {
      console.log("=== VNC FRAME SUMMARY ===");
      const binaryFrames = frames.filter((f) => f.isBinary).length;
      const textFrames = frames.filter((f) => !f.isBinary).length;
      console.log(`total=${frames.length} binary=${binaryFrames} text=${textFrames}`);
      frames.filter((f) => !f.isBinary).slice(0, 5).forEach((f) => console.log("[text]", f.text));
      if (binaryFrames > 0) {
        const lastBinary = frames.filter((f) => f.isBinary).pop();
        console.log(`lastBinary: size=${lastBinary.size} magic=${lastBinary.magic}`);
      }
      ws.close();
      process.exit(0);
    }, 1000);
  }, 6000);
};
ws.onmessage = (ev) => {
  if (typeof ev.data === "string") {
    frames.push({ isBinary: false, text: String(ev.data).substring(0, 120) });
  } else {
    const buf = Buffer.from(ev.data);
    const magic = buf.length > 2 ? `0x${buf[0].toString(16)}${buf[1].toString(16)}` : "?";
    frames.push({ isBinary: true, size: buf.length, magic });
  }
};
ws.onerror = (e) => { console.log("[error]", e.message || e); };
