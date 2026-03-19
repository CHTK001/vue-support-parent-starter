import { defineStore } from 'pinia';
import { ref } from 'vue';
import { monitorApi } from '../api/monitor';
import { isApiSuccess } from '../api/sync';

export const useMonitorStore = defineStore('monitor', () => {
  const realtimeData = ref<any>(null);
  const metrics = ref<any>(null);
  const alerts = ref<any[]>([]);
  const ws = ref<WebSocket | null>(null);

  const fetchRealtimeData = async (taskId: number) => {
    const res = await monitorApi.getRealtimeData(taskId);
    if (isApiSuccess(res.code)) {
      realtimeData.value = res.data;
    }
  };

  const fetchMetrics = async (taskId: number, startTime: string, endTime: string) => {
    const res = await monitorApi.getMetrics(taskId, startTime, endTime);
    if (isApiSuccess(res.code)) {
      metrics.value = res.data;
    }
  };

  const fetchAlerts = async (taskId?: number, level?: string, resolved?: boolean) => {
    const res = await monitorApi.listAlerts(taskId, level, resolved);
    if (isApiSuccess(res.code)) {
      alerts.value = res.data || [];
    }
  };

  const resolveAlert = async (alertId: number) => {
    const res = await monitorApi.resolveAlert(alertId);
    if (isApiSuccess(res.code)) {
      alerts.value = alerts.value.map(a => 
        a.alertId === alertId ? { ...a, isResolved: 1 } : a
      );
    }
  };

  const connectWebSocket = (taskId: number, onMessage: (data: any) => void) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/sync/progress';
    ws.value = new WebSocket(wsUrl);
    
    ws.value.onopen = () => {
      ws.value?.send(JSON.stringify({ taskId }));
    };
    
    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const disconnectWebSocket = () => {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  };

  return {
    realtimeData,
    metrics,
    alerts,
    fetchRealtimeData,
    fetchMetrics,
    fetchAlerts,
    resolveAlert,
    connectWebSocket,
    disconnectWebSocket,
  };
});
