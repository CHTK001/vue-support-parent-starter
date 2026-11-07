/**
 * Widget 全局刷新调度器（Worker）
 *
 * 首页 widget 所有的后台轮询统一由本文件驱动：
 *   - start({interval})   启动 tick 循环（单位 ms）
 *   - pause() / resume()   暂停 / 恢复 tick
 *
 * 主线程（home 页面）控制何时暂停：编辑模式、设置弹窗、保存布局期间向 worker 发
 * `pause`，退出时发 `resume`，避免后台轮询拖拽编辑期的页面资源。
 * 每个 tick 到达后，tick 的分发交给主线程（见 {@link ./refreshRegistry.refreshTick}），
 * 由各个 widget 按自己的 type 与频率认领。
 */

/** 默认 tick 循环周期（30 s）：各 type 的频率在此之上自行节流 */
const DEFAULT_INTERVAL = 30_000;

let interval = DEFAULT_INTERVAL;
let paused = false;
let timer: ReturnType<typeof setInterval> | null = null;

self.addEventListener("message", (e: MessageEvent): void => {
  const msg = e.data;
  if (msg?.type === "start") {
    interval = msg.interval ?? DEFAULT_INTERVAL;
    paused = false;
    start();
  } else if (msg?.type === "pause") {
    paused = true;
    stop();
  } else if (msg?.type === "resume") {
    paused = false;
    start();
  }
});

function start(): void {
  if (timer) return;
  timer = setInterval(() => {
    if (paused) return;
    self.postMessage({ type: "tick", ts: Date.now() });
  }, interval);
}

function stop(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
