/**
 * 调试模式 composable
 * @description 管理调试控制台的显示/隐藏逻辑
 */
import { ref, nextTick, onUnmounted, type Ref } from "vue";
import { emitter } from "@repo/core";
import { useGlobal } from "@pureadmin/utils";

export function useDebugMode() {
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  
  // 调试模式状态
  const debugMode = ref($storage?.configure?.debugMode ?? false);
  
  // 调试控制台引用（由外部组件传入）
  let debugConsoleRef: Ref<{ show: () => void; handleClose: () => void } | null> | null = null;

  /**
   * 设置调试控制台引用
   */
  function setDebugConsoleRef(ref: Ref<{ show: () => void; handleClose: () => void } | null>) {
    debugConsoleRef = ref;
  }

  /**
   * 处理调试模式变更事件
   */
  function handleDebugModeChange(enabled: boolean) {
    debugMode.value = enabled;
    if (enabled) {
      nextTick(() => {
        debugConsoleRef?.value?.show();
      });
    } else {
      debugConsoleRef?.value?.handleClose();
    }
  }

  /**
   * 调试控制台关闭回调
   */
  function handleDebugConsoleClose() {
    debugMode.value = false;
    emitter.emit("debugModeChanged", false);
  }

  // 监听调试模式变更事件
  emitter.on("debugModeChange", handleDebugModeChange);

  // 组件卸载时取消监听
  onUnmounted(() => {
    emitter.off("debugModeChange", handleDebugModeChange);
  });

  return {
    debugMode,
    setDebugConsoleRef,
    handleDebugConsoleClose,
  };
}
