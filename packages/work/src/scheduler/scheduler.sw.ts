/**
 * 调度器 Service Worker —— 浏览器后台周期任务
 *
 * 注册后由主线程通过 postMessage 下发任务，Worker 在后台独立运行 setInterval，
 * 到点通过 clients 向所有受控页面广播 tick。
 *
 * 消息协议：
 *   主线程 → SW：{ type: "start", name, interval } | { type: "stop", name }
 *   SW → 页面：{ type: "tick", name }
 *
 * 注意：此文件需通过 new URL("./scheduler.sw.ts", import.meta.url) 注册，
 * 由 Vite 编译为独立 chunk，浏览器通过 HTTPS 加载。
 */
type TaskMap = Map<string, ReturnType<typeof setInterval>>;
const tasks: TaskMap = new Map();

function notifyTick(name: string): void {
  void clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    list.forEach((client) => client.postMessage({ type: "tick", name }));
  });
}

function startTask(name: string, interval: number): void {
  stopTask(name);
  const safe = Math.max(1000, Number(interval) || 3600000);
  const timer = setInterval(() => notifyTick(name), safe);
  tasks.set(name, timer);
}

function stopTask(name: string): void {
  const timer = tasks.get(name);
  if (timer) {
    clearInterval(timer);
    tasks.delete(name);
  }
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "start" && msg.name) {
    startTask(msg.name, msg.interval);
  } else if (msg.type === "stop" && msg.name) {
    stopTask(msg.name);
  }
});