/**
 * 加载页逻辑 composable
 * @description 管理加载页的时钟动画、加载状态等
 */
import { computed, ref, onUnmounted } from "vue";
import { getConfig } from "@repo/config";
import { useConfigStore } from "@repo/core";

export function useLoadingPage() {
  // 加载状态管理（默认为 true，不显示加载遮罩）
  const isConfigLoaded = ref(true);

  // 是否首次加载（用于显示不同的加载文字）
  const isFirstLoad = ref(!sessionStorage.getItem("_app_loaded"));

  // 加载页面风格（从配置读取，默认简约风格）
  const loadingStyle = computed(() => getConfig().LoadingPageStyle || "minimal");

  // 时钟相关状态
  const currentTime = ref(new Date());
  const clockTimer = ref<number | null>(null);

  // 时钟指针角度计算
  const secondRotation = computed(() => {
    return currentTime.value.getSeconds() * 6; // 每秒6度
  });

  const minuteRotation = computed(() => {
    const minutes = currentTime.value.getMinutes();
    const seconds = currentTime.value.getSeconds();
    return minutes * 6 + seconds * 0.1; // 每分钟6度，秒针带动分针微动
  });

  const hourRotation = computed(() => {
    const hours = currentTime.value.getHours() % 12;
    const minutes = currentTime.value.getMinutes();
    return hours * 30 + minutes * 0.5; // 每小时30度，分针带动时针微动
  });

  // 启动时钟
  const startClock = () => {
    clockTimer.value = window.setInterval(() => {
      currentTime.value = new Date();
    }, 1000);
  };

  // 停止时钟
  const stopClock = () => {
    if (clockTimer.value) {
      clearInterval(clockTimer.value);
      clockTimer.value = null;
    }
  };

  /**
   * 加载系统配置
   * @param onWatermarkInit 水印初始化回调
   */
  const loadConfig = async (onWatermarkInit?: () => void) => {
    try {
      await useConfigStore().load();
      isConfigLoaded.value = true;
      // 标记已加载过，下次刷新不显示"初始化"
      sessionStorage.setItem("_app_loaded", "1");
      
      // 加载完成后立即停止时钟定时器，避免不必要的性能开销
      stopClock();
      
      // 执行水印初始化回调
      onWatermarkInit?.();
    } catch (error) {
      console.warn("Failed to load config:", error);
      // 根据配置决定是否保持加载页面
      if (!getConfig().BlockOnConfigLoadFail) {
        isConfigLoaded.value = true;
        sessionStorage.setItem("_app_loaded", "1");
        // 配置加载失败但允许继续时也停止时钟
        stopClock();
      }
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    stopClock();
  });

  return {
    // 状态
    isConfigLoaded,
    isFirstLoad,
    loadingStyle,
    currentTime,
    // 时钟角度
    secondRotation,
    minuteRotation,
    hourRotation,
    // 方法
    startClock,
    stopClock,
    loadConfig,
  };
}
