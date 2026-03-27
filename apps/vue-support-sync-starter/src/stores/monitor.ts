import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { monitorApi } from "../api/monitor";

const resolveWsUrl = () => {
  const configuredUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (configuredUrl) {
    if (
      configuredUrl.startsWith("ws://") ||
      configuredUrl.startsWith("wss://")
    ) {
      return configuredUrl;
    }
    if (configuredUrl.startsWith("/")) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}${configuredUrl}`;
    }
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/sync/progress`;
};

const normalizeWebSocketPayload = (raw: any): any => {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  if (raw.data && typeof raw.data === "object" && raw.messageType) {
    return {
      ...raw.data,
      messageType: raw.messageType,
      timestamp: raw.timestamp,
    };
  }

  return raw;
};

export const useMonitorStore = defineStore("monitor", () => {
  const realtimeData = ref<any>(null);
  const metrics = ref<any>(null);
  const alerts = ref<any[]>([]);
  const ws = ref<WebSocket | null>(null);
  const currentTaskId = ref<number | undefined>(undefined);

  const isConnected = computed(() => ws.value?.readyState === WebSocket.OPEN);

  const fetchRealtimeData = async (taskId: number) => {
    const res = await monitorApi.getRealtimeData(taskId);
    realtimeData.value = res.data ?? null;
    return realtimeData.value;
  };

  const fetchMetrics = async (
    taskId: number,
    startTime: string,
    endTime: string,
  ) => {
    const res = await monitorApi.getMetrics(taskId, startTime, endTime);
    metrics.value = res.data ?? null;
    return metrics.value;
  };

  const fetchAlerts = async (
    taskId?: number,
    level?: string,
    resolved?: boolean,
  ) => {
    const res = await monitorApi.listAlerts(taskId, level, resolved);
    alerts.value = Array.isArray(res.data) ? res.data : [];
    return alerts.value;
  };

  const resolveAlert = async (alertId: number) => {
    await monitorApi.resolveAlert(alertId);
    alerts.value = alerts.value.map((alert) =>
      alert.alertId === alertId ? { ...alert, isResolved: 1 } : alert,
    );
    return true;
  };

  const disconnectWebSocket = () => {
    if (!ws.value) {
      return;
    }

    if (
      ws.value.readyState === WebSocket.OPEN &&
      currentTaskId.value !== undefined
    ) {
      ws.value.send(
        JSON.stringify({
          action: "unsubscribe",
          taskId: currentTaskId.value,
        }),
      );
    }

    ws.value.close();
    ws.value = null;
    currentTaskId.value = undefined;
  };

  const connectWebSocket = (taskId: number, onMessage: (data: any) => void) => {
    if (!taskId || taskId <= 0) {
      return;
    }

    if (
      currentTaskId.value === taskId &&
      ws.value &&
      (ws.value.readyState === WebSocket.OPEN ||
        ws.value.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    disconnectWebSocket();

    const socket = new WebSocket(resolveWsUrl());
    ws.value = socket;
    currentTaskId.value = taskId;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          action: "subscribe",
          taskId,
        }),
      );
    };

    socket.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const data = normalizeWebSocketPayload(raw);
        onMessage(data);
      } catch (error) {
        console.error("Failed to parse sync websocket message", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Sync websocket error", error);
    };

    socket.onclose = () => {
      if (ws.value === socket) {
        ws.value = null;
      }
    };
  };

  return {
    realtimeData,
    metrics,
    alerts,
    isConnected,
    fetchRealtimeData,
    fetchMetrics,
    fetchAlerts,
    resolveAlert,
    connectWebSocket,
    disconnectWebSocket,
  };
});
