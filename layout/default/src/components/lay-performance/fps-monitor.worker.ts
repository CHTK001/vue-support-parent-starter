import {
  applyMonitorTick,
  createMonitorRuntimeState,
  createMonitorSnapshot,
  type MonitorMemorySnapshot,
  type MonitorSnapshot,
} from "./monitor-core";

interface MonitorWorkerInput {
  type: "init" | "tick";
  historyLength?: number;
  initialFps?: number;
  now?: number;
  frameDuration?: number;
  memory?: MonitorMemorySnapshot | null;
}

let runtimeState = createMonitorRuntimeState();

const emitSnapshot = (snapshot: MonitorSnapshot) => {
  self.postMessage(snapshot);
};

self.onmessage = (event: MessageEvent<MonitorWorkerInput>) => {
  const { data } = event;

  if (data.type === "init") {
    runtimeState = createMonitorRuntimeState(
      data.historyLength || 20,
      data.initialFps || 60,
    );
    emitSnapshot(createMonitorSnapshot(runtimeState));
    return;
  }

  if (
    data.type !== "tick" ||
    typeof data.now !== "number" ||
    typeof data.frameDuration !== "number"
  ) {
    return;
  }

  const snapshot = applyMonitorTick(runtimeState, {
    now: data.now,
    frameDuration: data.frameDuration,
    memory: data.memory,
  });
  if (!snapshot) {
    return;
  }

  emitSnapshot(snapshot);
};
