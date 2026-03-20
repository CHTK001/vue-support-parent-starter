import api from './sync';

export const monitorApi = {
  getRealtimeData: (taskId: number) => api.get(`/monitor/realtime/${taskId}`),
  getMetrics: (taskId: number, startTime: string, endTime: string) => 
    api.get(`/monitor/metrics/${taskId}`, { params: { startTime, endTime } }),
  getTrend: (taskId: number, days: number = 7) => 
    api.get(`/monitor/trend/${taskId}`, { params: { days } }),
  listAlerts: (taskId?: number, level?: string, resolved?: boolean) => 
    api.get('/monitor/alerts', { params: { taskId, level, resolved } }),
  resolveAlert: (alertId: number) => api.put(`/monitor/alerts/${alertId}/resolve`),
};
