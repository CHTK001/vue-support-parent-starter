let alarms: Array<{
  id: string;
  hour: number;
  minute: number;
  repeat: string;
  enabled: boolean;
  fired: boolean;
  repeatCount: number;
  firedCount?: number;
  title: string;
}> = [];
let ticker: ReturnType<typeof setInterval> | 0 = 0;
let lastMinuteKey = "";
let firedCounts: Record<string, number> = {};
let totalFired: Record<string, number> = {};

addEventListener("message", (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "sync") {
    alarms = msg.list ?? [];
    firedCounts = {};
    for (const a of alarms) {
      if (totalFired[a.id] === undefined && a.firedCount && a.firedCount > 0) {
        totalFired[a.id] = a.firedCount;
      }
    }
  } else if (msg.type === "start") {
    ticker = setInterval(() => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const dow = now.getDay();
      const isWeekday = dow >= 1 && dow <= 5;
      const sec = now.getSeconds();
      const minuteKey = h + ":" + m;

      if (minuteKey !== lastMinuteKey) {
        lastMinuteKey = minuteKey;
        firedCounts = {};
      }

      for (const a of alarms) {
        if (!a.enabled) continue;
        if (a.hour !== h || a.minute !== m) continue;
        if (a.repeat === "weekday" && !isWeekday) continue;
        if (a.repeat === "once" && a.fired) continue;

        if (sec % 10 !== 0) continue;

        const times = a.repeatCount || 1;
        const count = firedCounts[a.id] ?? 0;
        if (count >= times) continue;

        firedCounts[a.id] = count + 1;

        const total = (totalFired[a.id] ?? 0) + 1;
        totalFired[a.id] = total;

        if (a.repeat === "once") {
          alarms = alarms.filter((x) => x.id !== a.id);
          postMessage({ type: "delete", id: a.id, firedCount: total });
        } else if (times > 0 && total >= times) {
          const idx = alarms.findIndex((x) => x.id === a.id);
          if (idx >= 0) alarms[idx] = { ...alarms[idx], enabled: false };
          postMessage({ type: "disable", id: a.id, firedCount: total });
        } else {
          postMessage({ type: "fire", id: a.id, title: a.title, hour: a.hour, minute: a.minute, firedCount: total });
        }
      }
    }, 1000);
  } else if (msg.type === "stop") {
    if (ticker) { clearInterval(ticker); ticker = 0; }
  }
});