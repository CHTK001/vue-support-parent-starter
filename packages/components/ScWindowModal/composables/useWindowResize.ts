import { computed, ref } from "vue";
import type { ResizeHandle, WindowInstance } from "../types";

/**
 * 窗口缩放功能组合式函数
 * @author CH
 * @version 1.0.0
 * @created 2024-01-15
 */
export function useWindowResize() {
  const isResizing = ref(false);
  const resizeStartPos = ref({ x: 0, y: 0 });
  const resizeStartSize = ref({ width: 0, height: 0 });
  const resizeStartPosition = ref({ x: 0, y: 0 });
  const currentResizeWindow = ref<WindowInstance | null>(null);
  const currentResizeHandle = ref<ResizeHandle | null>(null);
  const minWindowSize = ref({ width: 300, height: 200 });
  const maxWindowSize = ref({ width: 1920, height: 1080 });

  /**
   * 开始缩放窗口
   * @param event 鼠标事件
   * @param window 窗口实例
   * @param handle 缩放手柄类型
   */
  const startResize = (event: MouseEvent, window: WindowInstance, handle: ResizeHandle) => {
    if (window.maximized) return; // 最大化状态下不允许缩放

    event.preventDefault();
    event.stopPropagation();

    isResizing.value = true;
    currentResizeWindow.value = window;
    currentResizeHandle.value = handle;

    resizeStartPos.value = {
      x: event.clientX,
      y: event.clientY
    };

    resizeStartSize.value = {
      width: window.width,
      height: window.height
    };

    resizeStartPosition.value = {
      x: window.x,
      y: window.y
    };

    // 添加全局事件监听
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);

    // 防止文本选择
    document.body.style.userSelect = "none";
    document.body.style.cursor = getResizeCursor(handle);
  };

  /**
   * 处理缩放过程
   * @param event 鼠标事件
   */
  const handleResize = (event: MouseEvent) => {
    if (!isResizing.value || !currentResizeWindow.value || !currentResizeHandle.value) return;

    const deltaX = event.clientX - resizeStartPos.value.x;
    const deltaY = event.clientY - resizeStartPos.value.y;

    const window = currentResizeWindow.value;
    const handle = currentResizeHandle.value;

    let newWidth = resizeStartSize.value.width;
    let newHeight = resizeStartSize.value.height;
    let newX = resizeStartPosition.value.x;
    let newY = resizeStartPosition.value.y;

    // 根据缩放手柄类型计算新的尺寸和位置
    switch (handle) {
      case "n": // 北
        newHeight = resizeStartSize.value.height - deltaY;
        newY = resizeStartPosition.value.y + deltaY;
        break;
      case "s": // 南
        newHeight = resizeStartSize.value.height + deltaY;
        break;
      case "w": // 西
        newWidth = resizeStartSize.value.width - deltaX;
        newX = resizeStartPosition.value.x + deltaX;
        break;
      case "e": // 东
        newWidth = resizeStartSize.value.width + deltaX;
        break;
      case "nw": // 西北
        newWidth = resizeStartSize.value.width - deltaX;
        newHeight = resizeStartSize.value.height - deltaY;
        newX = resizeStartPosition.value.x + deltaX;
        newY = resizeStartPosition.value.y + deltaY;
        break;
      case "ne": // 东北
        newWidth = resizeStartSize.value.width + deltaX;
        newHeight = resizeStartSize.value.height - deltaY;
        newY = resizeStartPosition.value.y + deltaY;
        break;
      case "sw": // 西南
        newWidth = resizeStartSize.value.width - deltaX;
        newHeight = resizeStartSize.value.height + deltaY;
        newX = resizeStartPosition.value.x + deltaX;
        break;
      case "se": // 东南
        newWidth = resizeStartSize.value.width + deltaX;
        newHeight = resizeStartSize.value.height + deltaY;
        break;
    }

    // 应用尺寸约束
    const constrainedSize = applySizeConstraints(newWidth, newHeight, newX, newY);

    // 更新窗口属性
    window.width = constrainedSize.width;
    window.height = constrainedSize.height;
    window.x = constrainedSize.x;
    window.y = constrainedSize.y;
  };

  /**
   * 停止缩放
   */
  const stopResize = () => {
    isResizing.value = false;
    currentResizeWindow.value = null;
    currentResizeHandle.value = null;

    // 移除全局事件监听
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);

    // 恢复样式
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  /**
   * 最大化窗口
   * @param window 窗口实例
   */
  const maximizeWindow = (window: WindowInstance) => {
    if (window.maximized) {
      // 恢复窗口
      window.x = window.restorePosition?.x || 100;
      window.y = window.restorePosition?.y || 100;
      window.width = window.restoreSize?.width || 800;
      window.height = window.restoreSize?.height || 600;
      window.maximized = false;
    } else {
      // 保存当前状态
      window.restorePosition = { x: window.x, y: window.y };
      window.restoreSize = { width: window.width, height: window.height };

      // 最大化
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const taskbarHeight = 40;

      window.x = 0;
      window.y = 0;
      window.width = viewportWidth;
      window.height = viewportHeight - taskbarHeight;
      window.maximized = true;
    }
  };

  /**
   * 最小化窗口
   * @param window 窗口实例
   */
  const minimizeWindow = (window: WindowInstance) => {
    window.minimized = true;
    window.visible = false;
  };

  /**
   * 恢复最小化的窗口
   * @param window 窗口实例
   */
  const restoreWindow = (window: WindowInstance) => {
    window.minimized = false;
    window.visible = true;

    // 将窗口置于最前
    bringToFront(window);
  };

  /**
   * 将窗口置于最前
   * @param window 窗口实例
   */
  const bringToFront = (window: WindowInstance) => {
    // 这个方法需要在窗口管理器中实现
    // 这里只是占位符
  };

  /**
   * 应用尺寸约束
   * @param width 宽度
   * @param height 高度
   * @param x X坐标
   * @param y Y坐标
   */
  const applySizeConstraints = (width: number, height: number, x: number, y: number) => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    let constrainedWidth = Math.max(minWindowSize.value.width, Math.min(maxWindowSize.value.width, width));
    let constrainedHeight = Math.max(minWindowSize.value.height, Math.min(maxWindowSize.value.height, height));
    let constrainedX = x;
    let constrainedY = y;

    // 确保窗口不会超出视口边界
    if (constrainedX + constrainedWidth > viewportWidth) {
      constrainedX = viewportWidth - constrainedWidth;
    }
    if (constrainedY + constrainedHeight > viewportHeight - 40) {
      // 考虑任务栏高度
      constrainedY = viewportHeight - constrainedHeight - 40;
    }

    // 确保窗口不会移到负坐标
    constrainedX = Math.max(0, constrainedX);
    constrainedY = Math.max(0, constrainedY);

    return {
      width: constrainedWidth,
      height: constrainedHeight,
      x: constrainedX,
      y: constrainedY
    };
  };

  /**
   * 获取缩放光标样式
   * @param handle 缩放手柄类型
   */
  const getResizeCursor = (handle: ResizeHandle): string => {
    const cursorMap: Record<ResizeHandle, string> = {
      n: "n-resize",
      s: "s-resize",
      w: "w-resize",
      e: "e-resize",
      nw: "nw-resize",
      ne: "ne-resize",
      sw: "sw-resize",
      se: "se-resize"
    };
    return cursorMap[handle] || "default";
  };

  /**
   * 设置最小窗口尺寸
   * @param width 最小宽度
   * @param height 最小高度
   */
  const setMinWindowSize = (width: number, height: number) => {
    minWindowSize.value = { width, height };
  };

  /**
   * 设置最大窗口尺寸
   * @param width 最大宽度
   * @param height 最大高度
   */
  const setMaxWindowSize = (width: number, height: number) => {
    maxWindowSize.value = { width, height };
  };

  return {
    // 状态
    isResizing: computed(() => isResizing.value),
    minWindowSize: computed(() => minWindowSize.value),
    maxWindowSize: computed(() => maxWindowSize.value),

    // 方法
    startResize,
    stopResize,
    maximizeWindow,
    minimizeWindow,
    restoreWindow,
    bringToFront,
    setMinWindowSize,
    setMaxWindowSize,
    getResizeCursor
  };
}
