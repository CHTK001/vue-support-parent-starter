addEventListener("message", (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "start") {
    const interval = msg.interval ?? 3600000;
    setInterval(() => {
      postMessage({ type: "tick" });
    }, interval);
  }
});