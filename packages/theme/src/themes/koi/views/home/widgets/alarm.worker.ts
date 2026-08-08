let alarms: Array<{
  id: string;
  hour: number;
  minute: number;
  repeat: string;
  enabled: boolean;
  fired: boolean;
  repeatCount: number;
}> = [];
let ticker = 0;
let lastMinuteKey = "";
let firedCounts: Record<string, number> = {};

addEventListener("message", (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "sync") {
    alarms = msg.list ?? [];
  } else if (msg.type === "start") {
    ticker = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const dow = now.getDay();
      const isWeekday = dow >= 1 && dow <= 5;
      const sec = now.getSeconds();
      const minuteKey = h + ":" + m;

      // 进入新的一分钟，重置已触发计数
      if (minuteKey !== lastMinuteKey) {
        lastMinuteKey = minuteKey;
        firedCounts = {};
      }

      for (const a of alarms) {
        if (!a.enabled) continue;
        if (a.hour !== h || a.minute !== m) continue;
        if (a.repeat === "weekday" && !isWeekday) continue;
        if (a.repeat === "once" && a.fired) continue;

        // 触发节拍：每 10 秒一个触发点（0/10/20/30/40/50）
        if (sec % 10 !== 0) continue;

        const times = a.repeatCount || 1;
        const count = firedCounts[a.id] ?? 0;
        if (count >= times) continue;

        firedCounts[a.id] = count + 1;
        postMessage({ type: "fire", id: a.id, title: a.title, hour: a.hour, minute: a.minute });
      }
    }, 1000);
  } else if (msg.type === "stop") {
    if (ticker) { clearInterval(ticker); ticker = 0; }
  }
});