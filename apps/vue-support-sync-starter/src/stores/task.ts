import { defineStore } from 'pinia';
import { ref } from 'vue';
import { taskApi, type SyncTask, type TaskQuery } from '../api/task';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<SyncTask[]>([]);
  const currentTask = ref<SyncTask | null>(null);
  const loading = ref(false);
  const total = ref(0);

  const fetchTasks = async (query: TaskQuery) => {
    loading.value = true;
    try {
      const res = await taskApi.list(query);
      if (res.code === 200) {
        tasks.value = res.data.records || [];
        total.value = res.data.total || 0;
      }
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (task: SyncTask) => {
    const res = await taskApi.create(task);
    if (res.code === 200) {
      return res.data;
    }
    throw new Error(res.message);
  };

  const updateTask = async (task: SyncTask) => {
    const res = await taskApi.update(task);
    if (res.code === 200) {
      return true;
    }
    throw new Error(res.message);
  };

  const deleteTask = async (taskId: number) => {
    const res = await taskApi.delete(taskId);
    if (res.code === 200) {
      tasks.value = tasks.value.filter(t => t.syncTaskId !== taskId);
      return true;
    }
    throw new Error(res.message);
  };

  const startTask = async (taskId: number) => {
    const res = await taskApi.start(taskId);
    return res.code === 200;
  };

  const stopTask = async (taskId: number) => {
    const res = await taskApi.stop(taskId);
    return res.code === 200;
  };

  return {
    tasks,
    currentTask,
    loading,
    total,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    startTask,
    stopTask,
  };
});
