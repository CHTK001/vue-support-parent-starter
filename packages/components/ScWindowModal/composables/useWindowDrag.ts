import { computed, ref } from "vue";
import type { WindowInstance } from "../types";

/**
 * 窗口拖拽功能组合式函数
 * @author CH
 * @version 1.0.0
 * @created 2024-01-15
 */
export function useWindowDrag() {
  const isDragging = ref(false);
  const dragStartPos = ref({ x: 0, y: 0 });
  const dragStartWindowPos = ref({ x: 0, y: 0 });
  const currentDragWindow = ref<WindowInstance | null>(null);
  const gridSize = ref(20); // 网格大小
  const isGridMode = ref(false); // 是否启用网格模式
  const magneticThreshold = ref(10); // 磁吸阈值
  const isMagneticMode = ref(true); // 是否启用磁吸模式

  /**
   * 开始拖拽窗口
   * @param event 鼠标事件
   * @param window 窗口实例
   */
  const startDrag = (event: MouseEvent, window: WindowInstance) => {
    if (window.maximized) return; // 最大化状态下不允许拖拽

    event.preventDefault();
    isDragging.value = true;
    currentDragWindow.value = window;

    dragStartPos.value = {
      x: event.clientX,
      y: event.clientY
    };

    dragStartWindowPos.value = {
      x: window.x,
      y: window.y
    };

    // 添加全局事件监听
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", stopDrag);

    // 防止文本选择
    document.body.style.userSelect = "none";
    document.body.style.cursor = "move";
  };

  /**
   * 处理拖拽过程
   * @param event 鼠标事件
   */
  const handleDrag = (event: MouseEvent) => {
    if (!isDragging.value || !currentDragWindow.value) return;

    const deltaX = event.clientX - dragStartPos.value.x;
    const deltaY = event.clientY - dragStartPos.value.y;

    let newX = dragStartWindowPos.value.x + deltaX;
    let newY = dragStartWindowPos.value.y + deltaY;

    // 网格模式处理
    if (isGridMode.value) {
      newX = Math.round(newX / gridSize.value) * gridSize.value;
      newY = Math.round(newY / gridSize.value) * gridSize.value;
    }

    // 磁吸模式处理
    if (isMagneticMode.value) {
      const magneticResult = applyMagneticEffect(newX, newY, currentDragWindow.value);
      newX = magneticResult.x;
      newY = magneticResult.y;
    }

    // 边界检测
    const boundaryResult = applyBoundaryConstraints(newX, newY, currentDragWindow.value);
    newX = boundaryResult.x;
    newY = boundaryResult.y;

    // 更新窗口位置
    currentDragWindow.value.x = newX;
    currentDragWindow.value.y = newY;
  };

  /**
   * 停止拖拽
   */
  const stopDrag = () => {
    isDragging.value = false;
    currentDragWindow.value = null;

    // 移除全局事件监听
    document.removeEventListener("mousemove", handleDrag);
    document.removeEventListener("mouseup", stopDrag);

    // 恢复样式
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  /**
   * 应用磁吸效果
   * @param x 目标X坐标
   * @param y 目标Y坐标
   * @param window 当前窗口
   */
  const applyMagneticEffect = (x: number, y: number, window: WindowInstance) => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    let newX = x;
    let newY = y;

    // 左边缘磁吸
    if (Math.abs(newX) < magneticThreshold.value) {
      newX = 0;
    }

    // 右边缘磁吸
    if (Math.abs(newX + window.width - viewportWidth) < magneticThreshold.value) {
      newX = viewportWidth - window.width;
    }

    // 顶部边缘磁吸
    if (Math.abs(newY) < magneticThreshold.value) {
      newY = 0;
    }

    // 底部边缘磁吸（考虑任务栏高度）
    const taskbarHeight = 40;
    if (Math.abs(newY + window.height - (viewportHeight - taskbarHeight)) < magneticThreshold.value) {
      newY = viewportHeight - window.height - taskbarHeight;
    }

    return { x: newX, y: newY };
  };

  /**
   * 应用边界约束
   * @param x 目标X坐标
   * @param y 目标Y坐标
   * @param window 当前窗口
   */
  const applyBoundaryConstraints = (x: number, y: number, window: WindowInstance) => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const taskbarHeight = 40;

    let newX = x;
    let newY = y;

    // 限制窗口不能完全移出可视区域
    const minVisibleSize = 50; // 最小可见尺寸

    // 左边界约束
    if (newX + window.width < minVisibleSize) {
      newX = minVisibleSize - window.width;
    }

    // 右边界约束
    if (newX > viewportWidth - minVisibleSize) {
      newX = viewportWidth - minVisibleSize;
    }

    // 顶部边界约束
    if (newY < 0) {
      newY = 0;
    }

    // 底部边界约束
    if (newY + window.height > viewportHeight - taskbarHeight) {
      newY = viewportHeight - window.height - taskbarHeight;
    }

    return { x: newX, y: newY };
  };

  /**
   * 切换网格模式
   */
  const toggleGridMode = () => {
    isGridMode.value = !isGridMode.value;
  };

  /**
   * 切换磁吸模式
   */
  const toggleMagneticMode = () => {
    isMagneticMode.value = !isMagneticMode.value;
  };

  /**
   * 设置网格大小
   * @param size 网格大小
   */
  const setGridSize = (size: number) => {
    gridSize.value = Math.max(10, Math.min(50, size)); // 限制在10-50之间
  };

  /**
   * 设置磁吸阈值
   * @param threshold 磁吸阈值
   */
  const setMagneticThreshold = (threshold: number) => {
    magneticThreshold.value = Math.max(5, Math.min(30, threshold)); // 限制在5-30之间
  };

  return {
    // 状态
    isDragging: computed(() => isDragging.value),
    isGridMode: computed(() => isGridMode.value),
    isMagneticMode: computed(() => isMagneticMode.value),
    gridSize: computed(() => gridSize.value),
    magneticThreshold: computed(() => magneticThreshold.value),

    // 方法
    startDrag,
    stopDrag,
    toggleGridMode,
    toggleMagneticMode,
    setGridSize,
    setMagneticThreshold
  };
}
