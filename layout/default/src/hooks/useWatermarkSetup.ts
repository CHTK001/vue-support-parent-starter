/**
 * 水印功能 composable
 * @description 管理防删除水印的初始化和清理
 */
import { type Ref, onUnmounted } from "vue";
import { useWatermark } from "@pureadmin/utils";
import { useConfigStore } from "@repo/core";

export function useWatermarkSetup(containerRef: Ref<HTMLElement | undefined>) {
  const { setWatermark, clear: clearWatermark } = useWatermark(containerRef);

  /**
   * 初始化防删除水印
   */
  function initWatermark() {
    const watermarkConfig = useConfigStore().getWatermarkConfig();
    if (watermarkConfig.enabled && watermarkConfig.text) {
      setWatermark(watermarkConfig.text, {
        forever: true,
        width: 200,
        height: 100,
        rotate: watermarkConfig.rotate,
        globalAlpha: watermarkConfig.globalAlpha,
        color: watermarkConfig.color,
      });
    }
  }

  // 组件卸载时清理水印
  onUnmounted(() => {
    clearWatermark();
  });

  return {
    initWatermark,
    clearWatermark,
  };
}
