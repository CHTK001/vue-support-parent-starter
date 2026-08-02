/**
 * 用量定时拉取 composable
 *
 * 定时从后端拉取最新用量数据，与 ai-starter SysAiUsageService 对接。
 * 用量分析开关由全局配置 useGlobalSettings 控制。
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { usageApi } from '@/api';

export function useUsagePolling(intervalSec: number = 30) {
  const stats = ref({
    totalChats: 0,
    totalTokens: 0,
    totalImages: 0,
    totalVideos: 0,
  });
  const recent = ref<any[]>([]);
  const loading = ref(false);
  const lastUpdated = ref<Date | null>(null);

  let timer: number | null = null;

  const fetchUsage = async () => {
    loading.value = true;
    try {
      const data = await usageApi.get();
      // 处理后端返回格式：{ stats: ..., recent: [...] }
      if ((data as any).stats) {
        stats.value = (data as any).stats;
      }
      if (Array.isArray((data as any).recent)) {
        recent.value = (data as any).recent;
      }
      // 如果返回的是数组本身，直接赋值
      if (Array.isArray(data) && !(data as any).stats) {
        recent.value = data;
      }
      lastUpdated.value = new Date();
    } catch (e) {
      // 忽略离线错误
    } finally {
      loading.value = false;
    }
  };

  const start = () => {
    stop();
    fetchUsage();
    timer = window.setInterval(fetchUsage, intervalSec * 1000);
  };

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  onMounted(() => {
    start();
  });

  onUnmounted(() => {
    stop();
  });

  return {
    stats,
    recent,
    loading,
    lastUpdated,
    refresh: fetchUsage,
    start,
    stop,
  };
}