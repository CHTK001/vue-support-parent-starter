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
}

export function usePerfMonitor() {
  const data = reactive<PerfData>({
    fps: 0, fpsHistory: [],
    memUsed: 0, memTotal: 0, cpu: 0,
    batteryLevel: 0, batteryCharging: false,
    btAvailable: false,
    screenW: 0, screenH: 0,
    domNodes: 0,
    deviceMemory: 0,
    networkStatus: navigator.onLine,
  });

  let worker: Worker | null = null;
  let rafId: number | null = null;
  let memTimer: ReturnType<typeof setInterval> | null = null;
  let domTimer: ReturnType<typeof setInterval> | null = null;
  let netTimer: ReturnType<typeof setInterval> | null = null;
  let screenHandler: (() => void) | null = null;
  let batteryManager: any = null;
  let batteryHandler: (() => void) | null = null;

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
    worker?.postMessage({ type: "heartbeat" });
    const tick = () => {
      const now = performance.now();
      if (lastFrame > 0) {
        const frameDelta = now - lastFrame;
        // 60fps = 16.67ms; 30fps = 33.33ms. Delta > 16.67 = main thread busy.
        const load = Math.min(100, Math.max(0, Math.round((frameDelta - 16.67) / 16.67 * 100)));
        // 平滑：30% 当前 + 70% 历史，避免跳变
        data.cpu = Math.round(data.cpu * 0.7 + load * 0.3);
        worker?.postMessage({ type: "cpu", value: data.cpu });
      }
      lastFrame = now;
      worker?.postMessage({ type: "tick" });
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

  function startAll() {
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

  function stopAll() {
    stopFpsLoop();
    stopMemMonitor();
    stopScreenMonitor();
    stopDomMonitor();
    stopNetMonitor();
    stopBatteryMonitor();
    destroyWorker();
  }

  onBeforeUnmount(() => { stopAll(); });

  return { data, startAll, stopAll };
}