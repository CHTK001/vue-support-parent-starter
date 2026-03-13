import api from './sync';

export interface SyncTask {
  syncTaskId?: number;
  syncTaskName: string;
  syncTaskDesc?: string;
  syncTaskStatus?: string;
  syncTaskCron?: string;
  syncTaskLastRunTime?: string;
  syncTaskNextRunTime?: string;
  syncTaskDesign?: string;
  syncTaskTransformConfig?: string;
  syncTaskFilterConfig?: string;
  syncTaskSyncMode?: 'FULL' | 'INCREMENTAL' | 'BIDIRECTIONAL';
  syncTaskIncrementalField?: string;
  syncTaskConflictStrategy?: 'OVERWRITE' | 'SKIP' | 'MERGE';
  syncTaskMaxMemoryMb?: number;
  syncTaskThreadPoolSize?: number;
}

export interface TaskQuery {
  page?: number;
  size?: number;
  syncTaskName?: string;
  syncTaskStatus?: string;
}

export const taskApi = {
  list: (query: TaskQuery) => api.get('/task/list', { params: query }),
  create: (task: SyncTask) => api.post('/task/create', task),
  update: (task: SyncTask) => api.put('/task/update', task),
  delete: (taskId: number) => api.delete(`/task/delete/${taskId}`),
  start: (taskId: number) => api.post(`/task/start/${taskId}`),
  stop: (taskId: number) => api.post(`/task/stop/${taskId}`),
  executeOnce: (taskId: number) => api.post(`/task/execute/${taskId}`),
  getDesign: (taskId: number) => api.get(`/task/design/${taskId}`),
  saveDesign: (taskId: number, design: any) => api.post(`/task/design/${taskId}`, design),
  getLogs: (taskId: number, page: number, size: number) => 
    api.get(`/task/logs/${taskId}`, { params: { page, size } }),
  batchOperation: (taskIds: number[], operation: string) => 
    api.post('/task/batch', null, { params: { taskIds, operation } }),
  exportTask: (taskId: number) => api.get(`/task/export/${taskId}`),
  importTask: (taskJson: string) => api.post('/task/import', taskJson),
  listTemplates: () => api.get('/task/templates'),
};
