import type { Scheduler, SchedulerOptions, SchedulerStrategy } from "./types";

/**
 * Service Worker 策略 —— 浏览器后台任务（最优先）。
 *
 * 优势：即使页面后台化 / 关闭，SW 仍可独立运行 setInterval 并向受控页面广播，
 * 适合长期周期刷新（天气 / 台风 / 定位）。
 *
 * 兼容性：仅 HTTPS（或 localhost）+ 现代浏览器支持。不支持时返回 null，
 * 由调度器降级到 Web Worker / setInterval。
 */
export function createServiceWorkerScheduler(options: SchedulerOptions): Scheduler | null {
  const isSecure = typeof window !== "undefined" && window.isSecureContext;
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator && isSecure;
  if (!supported) return null;

  let started = false;
  let registration: ServiceWorkerRegistration | null = null;
  let controller: ServiceWorker | null | undefined = null;
  let bound = false;

  /** 发送指令到当前 controller（未激活则等待 ready） */
  function post(msg: { type: string; name?: string; interval?: number }): void {
    const sw = navigator.serviceWorker.controller;
    if (sw) {
      sw.postMessage({ ...msg, name: options.name });
      return;
    }
    // controller 尚未就绪（首次注册）：ready 后补发
    void navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ ...msg, name: options.name });
    });
  }

  function bindMessages(): void {
    if (bound) return;
    bound = true;
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
      const data = event.data;
      if (data?.type === "tick" && data.name === options.name) {
        void options.onTick();
      }
    });
  }

  async function ensureRegistered(): Promise<boolean> {
    if (registration) return true;
    try {
      const swUrl = new URL("./scheduler.sw.ts", import.meta.url).href;
      registration = await navigator.serviceWorker.register(swUrl, { type: "module" });
      controller = registration.active ?? registration.installing ?? registration.waiting;
      return true;
    } catch {
      return false;
    }
  }

  async function start(): Promise<void> {
    if (started) return;
    bindMessages();
    const ok = await ensureRegistered();
    if (!ok) return;
    started = true;
    post({ type: "start", interval: options.interval });
    if (options.immediate) {
      void options.onTick();
    }
  }

  function stop(): void {
    if (!started) return;
    started = false;
    post({ type: "stop" });
  }

  function destroy(): void {
    stop();
    // 不注销 SW（避免影响其它调度任务），仅停止本任务
  }

  return { start, stop, destroy, strategy: "service-worker" as SchedulerStrategy };
}