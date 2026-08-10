/**
 * 调度器 Worker —— 独立线程周期任务
 *
 * 同时兼容 Web Worker 与 Service Worker 两种上下文：
 *  - Web Worker：主线程 postMessage 下发 start/stop，到点 postMessage 回传 tick。
 *  - Service Worker：除 postMessage 外，还通过 clients 向所有受控页面广播 tick，
 *    使后台刷新对页面可见。
 *
 * 消息协议：
 *   主线程 → Worker：{ type: "start", interval } | { type: "stop" }
 *   Worker → 主线程：{ type: "tick" }
 */
const ctx: Worker | ServiceWorkerGlobalScope = self as unknown as Worker | ServiceWorkerGlobalScope;

let timer: ReturnType<typeof setInterval> | null = null;

/** 向受控客户端广播（Service Worker 用；Web Worker 下无 clients，直接 postMessage） */
function notifyTick(): void {
  const isSw = typeof (self as unknown as ServiceWorkerGlobalScope).clients !== "undefined";
  if (isSw) {
    void (self as unknown as ServiceWorkerGlobalScope).clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach((client) => client.postMessage({ type: "tick" }));
      });
    return;
  }
  ctx.postMessage({ type: "tick" });
}

function start(interval: number): void {
  if (timer) clearInterval(timer);
  const safe = Math.max(1000, Number(interval) || 3600000);
  timer = setInterval(notifyTick, safe);
}

function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

ctx.addEventListener("message", (event: MessageEvent) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "start") start(msg.interval);
  else if (msg.type === "stop") stop();
});

// 通知主线程 Worker 已就绪
ctx.postMessage({ type: "ready" });