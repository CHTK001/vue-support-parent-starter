/**
 * 全局性能监控服务（单例）
 *
 * 整个应用只维护一个 perf.worker 与一套监控循环（rAF / setInterval），
 * 所有调用方（布局常驻浮窗 PerfMonitor、首页 widget 等）共享同一份响应式 PerfData。
 *
 * 生命周期通过引用计数管理：
 *   - 第一个调用方 startAll() 时真正启动 worker 与各监控；
 *   - 最后一个调用方 stopAll() 时真正停止并销毁，避免重复创建 worker。
 */
import { reactive, onBeforeUnmount } from "vue";

export interface PerfData {
  fps: number;
  fpsHistory: number[];
  memUsed: number;
  memTotal: number;
  cpu: number;
  batteryLevel: number;
  batteryCharging: boolean;
  btAvailable: boolean;
  screenW: number;
  screenH: number;
  domNodes: number;
  deviceMemory: number;
  networkStatus: boolean;
  /** worker 是否存活（worker 上线后置 true，用于界面提示） */
  workerAlive: boolean;
}

/** 模块级单例状态：所有调用方共享 */
let worker: Worker | null = null;
let rafId: number | null = null;
let memTimer: ReturnType<typeof setInterval> | null = null;
let domTimer: ReturnType<typeof setInterval> | null = null;
let netTimer: ReturnType<typeof setInterval> | null = null;
let screenHandler: (() => void) | null = null;
let batteryManager: any = null;
let batteryHandler: (() => void) | null = null;
let refCount = 0;

const data = reactive<PerfData>({
  fps: 0, fpsHistory: [],
  memUsed: 0, memTotal: 0, cpu: 0,
  batteryLevel: 0, batteryCharging: false,
  btAvailable: false,
  screenW: 0, screenH: 0,
  domNodes: 0,
  deviceMemory: 0,
  networkStatus: navigator.onLine,
  workerAlive: false,
});

function createWorker() {
  if (worker) return;
  worker = new Worker(new URL("./perf.worker.ts", import.meta.url));
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data;
    if (msg.type === "fps") {
      data.fps = msg.value;
      data.fpsHistory = [...data.fpsHistory.slice(-19), msg.value];
    } else if (msg.type === "memory") {
      data.memUsed = msg.used;
      data.memTotal = msg.total;
    } else if (msg.type === "cpu") {
      data.cpu = msg.value;
    } else if (msg.type === "battery") {
      data.batteryLevel = msg.level;
      data.batteryCharging = msg.charging;
    } else if (msg.type === "bluetooth") data.btAvailable = msg.available;
    else if (msg.type === "screen") {
      data.screenW = msg.w;
      data.screenH = msg.h;
    } else if (msg.type === "ping") {
      data.workerAlive = true;
    }
  };
}

function destroyWorker() {
  if (worker) { worker.terminate(); worker = null; }
}

function startFpsLoop() {
  if (rafId) return;
  let lastFrame = 0;
  let frames = 0;
  let windowStart = performance.now();
  worker?.postMessage({ type: "heartbeat" });
  const tick = (now: number) => {
    if (lastFrame > 0) {
      const frameDelta = now - lastFrame;
      // 60fps = 16.67ms; 30fps = 33.33ms. Delta > 16.67 = main thread busy.
      const load = Math.min(100, Math.max(0, Math.round((frameDelta - 16.67) / 16.67 * 100)));
      // 平滑：30% 当前 + 70% 历史，避免跳变
      data.cpu = Math.round(data.cpu * 0.7 + load * 0.3);
    }
    lastFrame = now;

    // rAF 口径：每秒统计真实回调次数，fps = frames * 1000 / 实际耗时。
    // 不按固定 60 帧折算，也不经过 worker 往返（后台标签页恢复时按窗口重置）。
    frames += 1;
    const elapsed = now - windowStart;
    if (elapsed >= 1000) {
      if (elapsed <= 2000) {
        const fps = Math.max(0, Math.min(240, Math.round((frames * 1000) / elapsed)));
        data.fps = fps;
        data.fpsHistory = [...data.fpsHistory.slice(-19), fps];
      }
      frames = 0;
      windowStart = now;
    }

    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopFpsLoop() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  data.fps = 0;
  data.fpsHistory = [];
  data.cpu = 0;
}

function startMemMonitor() {
  if (memTimer) return;
  const read = () => {
    const mem = (performance as any).memory;
    if (mem) {
      worker?.postMessage({
        type: "memory",
        used: Math.round(mem.usedJSHeapSize / 1048576),
        total: Math.round(mem.jsHeapSizeLimit / 1048576),
      });
    }
  };
  read();
  memTimer = setInterval(read, 2000);
}

function stopMemMonitor() {
  if (memTimer) { clearInterval(memTimer); memTimer = null; }
  data.memUsed = 0;
  data.memTotal = 0;
}

function startBatteryMonitor() {
  if (batteryManager || !("getBattery" in navigator)) return;
  (navigator as any).getBattery().then((battery: any) => {
    batteryManager = battery;
    batteryHandler = () => {
      worker?.postMessage({ type: "battery", level: battery.level, charging: battery.charging });
    };
    batteryHandler();
    battery.addEventListener("levelchange", batteryHandler);
    battery.addEventListener("chargingchange", batteryHandler);
  });
}

function stopBatteryMonitor() {
  if (batteryManager) {
    batteryManager.removeEventListener("levelchange", batteryHandler);
    batteryManager.removeEventListener("chargingchange", batteryHandler);
    batteryManager = null;
    batteryHandler = null;
  }
}

function startBtMonitor() {
  try {
    (navigator as any).bluetooth?.getAvailability?.().then((avail: boolean) => {
      worker?.postMessage({ type: "bluetooth", available: avail });
    });
  } catch { /* not supported */ }
}

function startScreenMonitor() {
  worker?.postMessage({ type: "screen", w: screen.width, h: screen.height });
  if (screenHandler) return;
  screenHandler = () => {
    worker?.postMessage({ type: "screen", w: screen.width, h: screen.height });
  };
  window.addEventListener("resize", screenHandler);
}

function stopScreenMonitor() {
  if (screenHandler) {
    window.removeEventListener("resize", screenHandler);
    screenHandler = null;
  }
}

function startDomMonitor() {
  if (domTimer) return;
  const count = () => {
    data.domNodes = document.querySelectorAll("*").length;
  };
  count();
  domTimer = setInterval(count, 3000);
}

function stopDomMonitor() {
  if (domTimer) { clearInterval(domTimer); domTimer = null; }
  data.domNodes = 0;
}

function startNetMonitor() {
  if (netTimer) return;
  const check = () => {
    data.networkStatus = navigator.onLine;
  };
  check();
  netTimer = setInterval(check, 2000);
  window.addEventListener("online", check);
  window.addEventListener("offline", check);
}

function stopNetMonitor() {
  if (netTimer) { clearInterval(netTimer); netTimer = null; }
  data.networkStatus = false;
}

function startDeviceMemory() {
  if ("deviceMemory" in navigator) {
    data.deviceMemory = (navigator as any).deviceMemory;
  }
}

/** 真正启动全部监控（仅当第一个调用方注册时触发） */
function startAllInternal() {
  createWorker();
  startFpsLoop();
  startMemMonitor();
  startBatteryMonitor();
  startBtMonitor();
  startScreenMonitor();
  startDomMonitor();
  startNetMonitor();
  startDeviceMemory();
}

/** 真正停止全部监控并销毁 worker（仅当最后一个调用方注销时触发） */
function stopAllInternal() {
  stopFpsLoop();
  stopMemMonitor();
  stopScreenMonitor();
  stopDomMonitor();
  stopNetMonitor();
  stopBatteryMonitor();
  destroyWorker();
}

/**
 * 组合式：注册为一个监控消费方。
 *
 * 返回共享的响应式 data 与启停方法：
 *   - startAll()：引用计数 +1，首个消费方触发真正启动；
 *   - stopAll()：引用计数 -1，归零时真正停止并销毁 worker。
 */
export function usePerfMonitor() {
  function startAll() {
    refCount++;
    if (refCount === 1) startAllInternal();
  }

  function stopAll() {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) stopAllInternal();
  }

  onBeforeUnmount(() => { stopAll(); });

  return { data, startAll, stopAll };
}