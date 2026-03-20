import { defineStore } from "pinia";
import { ref } from "vue";
import {
  listSyncTasks,
  createSyncTask,
  updateSyncTask,
  deleteSyncTask,
  startSyncTask,
  stopSyncTask,
  type SyncTask,
  type SyncTaskQuery,
} from "../api/sync";

export const useTaskStore = defineStore("task", () => {
  const tasks = ref<SyncTask[]>([]);
  const currentTask = ref<SyncTask | null>(null);
  const loading = ref(false);
  const total = ref(0);

  const fetchTasks = async (query: SyncTaskQuery = {}) => {
    loading.value = true;
    try {
      const res = await listSyncTasks(query);
      tasks.value = res.data?.records ?? [];
      total.value = res.data?.total ?? 0;
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (task: SyncTask) => {
    const res = await createSyncTask(task);
    currentTask.value = res.data ?? null;
    return res.data as SyncTask;
  };

  const updateTask = async (task: SyncTask) => {
    await updateSyncTask(task);
    if (currentTask.value?.syncTaskId === task.syncTaskId) {
      currentTask.value = {
        ...currentTask.value,
        ...task,
      };
    }
    return true;
  };

  const deleteTask = async (taskId: number) => {
    await deleteSyncTask(taskId);
    tasks.value = tasks.value.filter((task) => task.syncTaskId !== taskId);
    if (currentTask.value?.syncTaskId === taskId) {
      currentTask.value = null;
    }
    return true;
  };

  const startTask = async (taskId: number) => {
    await startSyncTask(taskId);
    return true;
  };

  const stopTask = async (taskId: number) => {
    await stopSyncTask(taskId);
    return true;
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
