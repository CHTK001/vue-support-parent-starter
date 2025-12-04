import { ref, onUnmounted } from "vue";

/**
 * 组合式函数：通用轮询
 * @param task 轮询任务（返回 Promise），抛错将被吞掉
 * @param intervalMs 间隔毫秒，默认 3000
 * @returns start/stop/isRunning
 */
export function usePolling(task: () => Promise<void>, intervalMs = 3000) {
  const timer = ref<number | null>(null);
  const isRunning = ref(false);

  const start = () => {
    stop();
    isRunning.value = true;
    const id = window.setInterval(async () => {
      try {
        await task();
      } catch (e) {
        // ignore polling errors
      }
    }, intervalMs);
    timer.value = id as unknown as number;
  };

  const stop = () => {
    if (timer.value !== null) {
      clearInterval(timer.value);
      timer.value = null;
    }
    isRunning.value = false;
  };

  onUnmounted(stop);

  return { start, stop, isRunning };
}

