/**
 * 加载页逻辑 composable
 * @description 管理加载页的加载状态等
 */
import { ref } from "vue";
import { getConfig } from "@repo/config";
import { useConfigStore } from "@repo/core";

export function useLoadingPage() {
  // 加载状态管理（默认为 true，不显示加载遮罩）
  const isConfigLoaded = ref(true);

  // 是否首次加载（用于显示不同的加载文字）
  const isFirstLoad = ref(!sessionStorage.getItem("_app_loaded"));

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
      
      // 执行水印初始化回调
      onWatermarkInit?.();
    } catch (error) {
      console.warn("Failed to load config:", error);
      // 根据配置决定是否保持加载页面
      if (!getConfig().BlockOnConfigLoadFail) {
        isConfigLoaded.value = true;
        sessionStorage.setItem("_app_loaded", "1");
      }
    }
  };

  return {
    // 状态
    isConfigLoaded,
    isFirstLoad,
    // 方法
    loadConfig,
  };
}
