import { computed, ref } from "vue";
import type { WindowInstance, WindowOptions } from "../types";
import { useWindowDrag } from "./useWindowDrag";
import { useWindowResize } from "./useWindowResize";

/**
 * 窗口管理器组合式函数
 * @author CH
 * @version 1.0.0
 * @created 2024-01-15
 */
export function useWindowManager() {
  // 窗口存储
  const windowInstances = ref<WindowInstance[]>([]);
  const activeWindowId = ref<string | null>(null);
  const nextZIndex = ref(1000);
  const windowIdCounter = ref(0);

  // 引入拖拽和缩放功能
  const dragComposable = useWindowDrag();
  const resizeComposable = useWindowResize();

  /**
   * 计算属性：可见窗口列表
   */
  const visibleWindows = computed(() => {
    return windowInstances.value.filter(window => window.visible && !window.minimized).sort((a, b) => a.zIndex - b.zIndex);
  });

  /**
   * 计算属性：最小化窗口列表
   */
  const minimizedWindows = computed(() => {
    return windowInstances.value.filter(window => window.minimized);
  });

  /**
   * 计算属性：活动窗口
   */
  const activeWindow = computed(() => {
    return windowInstances.value.find(window => window.id === activeWindowId.value) || null;
  });

  /**
   * 计算属性：是否有窗口
   */
  const hasWindows = computed(() => {
    return windowInstances.value.length > 0;
  });

  /**
   * 生成唯一窗口ID
   */
  const generateWindowId = (): string => {
    return `window_${++windowIdCounter.value}_${Date.now()}`;
  };

  /**
   * 创建新窗口
   * @param options 窗口选项
   */
  const createWindow = (options: WindowOptions): WindowInstance => {
    const defaultOptions: Partial<WindowOptions> = {
      title: "新窗口",
      width: 800,
      height: 600,
      x: 100 + windowInstances.value.length * 30, // 层叠效果
      y: 100 + windowInstances.value.length * 30,
      resizable: true,
      draggable: true,
      closable: true,
      maximizable: true,
      minimizable: true,
      modal: false,
      icon: "ri:window-line"
    };

    const windowInstance: WindowInstance = {
      id: generateWindowId(),
      ...defaultOptions,
      ...options,
      // 必需属性
      minWidth: options.minWidth || 200,
      minHeight: options.minHeight || 150,
      gridMode: options.gridMode || false,
      gridSize: options.gridSize || 20,
      magneticEnabled: options.magneticEnabled || false,
      magneticDistance: options.magneticDistance || 20,
      // 状态属性
      visible: true,
      minimized: false,
      maximized: false,
      zIndex: nextZIndex.value++,
      restorePosition: null,
      restoreSize: null,
      // 动画状态
      opening: true,
      closing: false,
      dragging: false,
      resizing: false,
      // 时间戳
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    windowInstances.value.push(windowInstance);
    setActiveWindow(windowInstance.id);

    // 窗口打开动画
    setTimeout(() => {
      const window = windowInstances.value.find(w => w.id === windowInstance.id);
      if (window) {
        window.opening = false;
      }
    }, 300);

    return windowInstance;
  };

  /**
   * 关闭窗口
   * @param windowOrId 窗口实例或窗口ID
   */
  const closeWindow = (windowOrId: WindowInstance | string) => {
    const windowId = typeof windowOrId === "string" ? windowOrId : windowOrId.id;
    const windowIndex = windowInstances.value.findIndex(w => w.id === windowId);

    if (windowIndex !== -1) {
      const window = windowInstances.value[windowIndex];

      // 触发关闭前回调
      if (window.onBeforeClose) {
        const shouldClose = window.onBeforeClose(window);
        if (shouldClose === false) return false;
      }

      // 设置关闭动画状态
      window.closing = true;

      // 延迟移除窗口以显示关闭动画
      setTimeout(() => {
        const currentIndex = windowInstances.value.findIndex(w => w.id === windowId);
        if (currentIndex !== -1) {
          // 移除窗口
          windowInstances.value.splice(currentIndex, 1);

          // 如果关闭的是活动窗口，激活下一个窗口
          if (activeWindowId.value === windowId) {
            const nextWindow = getTopMostWindow();
            setActiveWindow(nextWindow?.id || null);
          }

          // 触发关闭后回调
          if (window.onClosed) {
            window.onClosed(window);
          }
        }
      }, 200);

      return true;
    }

    return false;
  };

  /**
   * 设置活动窗口
   * @param windowId 窗口ID
   */
  const setActiveWindow = (windowId: string | null) => {
    if (windowId) {
      const window = windowInstances.value.find(w => w.id === windowId);
      if (window && window.visible && !window.minimized) {
        activeWindowId.value = windowId;
        bringToFront(window);
      }
    } else {
      activeWindowId.value = null;
    }
  };

  /**
   * 将窗口置于最前
   * @param window 窗口实例
   */
  const bringToFront = (window: WindowInstance) => {
    if (window.zIndex < nextZIndex.value - 1) {
      window.zIndex = nextZIndex.value++;
    }
  };

  /**
   * 获取最顶层窗口
   */
  const getTopMostWindow = (): WindowInstance | null => {
    const visibleWindowList = visibleWindows.value;
    return visibleWindowList.length > 0 ? visibleWindowList[visibleWindowList.length - 1] : null;
  };

  /**
   * 最小化窗口
   * @param window 窗口实例
   */
  const minimizeWindow = (window: WindowInstance) => {
    resizeComposable.minimizeWindow(window);

    // 如果最小化的是活动窗口，激活下一个窗口
    if (activeWindowId.value === window.id) {
      const nextWindow = getTopMostWindow();
      setActiveWindow(nextWindow?.id || null);
    }
  };

  /**
   * 恢复最小化的窗口
   * @param window 窗口实例
   */
  const restoreWindow = (window: WindowInstance) => {
    resizeComposable.restoreWindow(window);
    setActiveWindow(window.id);
  };

  /**
   * 切换窗口最大化状态
   * @param window 窗口实例
   */
  const toggleMaximize = (window: WindowInstance) => {
    resizeComposable.maximizeWindow(window);
  };

  /**
   * 开始拖拽窗口
   * @param event 鼠标事件
   * @param window 窗口实例
   */
  const startDrag = (event: MouseEvent, window: WindowInstance) => {
    setActiveWindow(window.id);
    window.dragging = true;
    dragComposable.startDrag(event, window);
  };

  /**
   * 结束拖拽窗口
   * @param window 窗口实例
   */
  const endDrag = (window: WindowInstance) => {
    window.dragging = false;
  };

  /**
   * 开始缩放窗口
   * @param event 鼠标事件
   * @param window 窗口实例
   * @param handle 缩放手柄
   */
  const startResize = (event: MouseEvent, window: WindowInstance, handle: any) => {
    setActiveWindow(window.id);
    window.resizing = true;
    resizeComposable.startResize(event, window, handle);
  };

  /**
   * 结束缩放窗口
   * @param window 窗口实例
   */
  const endResize = (window: WindowInstance) => {
    window.resizing = false;
  };

  /**
   * 关闭所有窗口
   */
  const closeAllWindows = () => {
    const windowsToClose = [...windowInstances.value];
    windowsToClose.forEach(window => {
      closeWindow(window.id);
    });
  };

  /**
   * 最小化所有窗口
   */
  const minimizeAllWindows = () => {
    visibleWindows.value.forEach(window => {
      minimizeWindow(window);
    });
  };

  /**
   * 恢复所有最小化的窗口
   */
  const restoreAllWindows = () => {
    minimizedWindows.value.forEach(window => {
      restoreWindow(window);
    });
  };

  /**
   * 根据ID查找窗口
   * @param windowId 窗口ID
   */
  const findWindow = (windowId: string): WindowInstance | null => {
    return windowInstances.value.find(w => w.id === windowId) || null;
  };

  /**
   * 更新窗口属性
   * @param windowId 窗口ID
   * @param updates 更新的属性
   */
  const updateWindow = (windowId: string, updates: Partial<WindowInstance>) => {
    const window = findWindow(windowId);
    if (window) {
      Object.assign(window, updates);
    }
  };

  /**
   * 获取窗口统计信息
   */
  const getWindowStats = () => {
    return {
      total: windowInstances.value.length,
      visible: visibleWindows.value.length,
      minimized: minimizedWindows.value.length,
      maximized: windowInstances.value.filter(w => w.maximized).length
    };
  };

  /**
   * 层叠排列窗口
   */
  const cascadeWindows = () => {
    const visibleWindowList = visibleWindows.value;
    const offset = 30;

    visibleWindowList.forEach((window, index) => {
      if (!window.maximized) {
        window.x = 100 + index * offset;
        window.y = 100 + index * offset;
        window.width = 800;
        window.height = 600;
      }
    });
  };

  /**
   * 平铺排列窗口
   */
  const tileWindows = () => {
    const visibleWindowList = visibleWindows.value.filter(w => !w.maximized);
    const count = visibleWindowList.length;

    if (count === 0) return;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const taskbarHeight = 40;

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const windowWidth = Math.floor(viewportWidth / cols);
    const windowHeight = Math.floor((viewportHeight - taskbarHeight) / rows);

    visibleWindowList.forEach((window, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      window.x = col * windowWidth;
      window.y = row * windowHeight;
      window.width = windowWidth;
      window.height = windowHeight;
    });
  };

  return {
    // 状态
    windowInstances: computed(() => windowInstances.value),
    visibleWindows,
    minimizedWindows,
    activeWindow,
    activeWindowId: computed(() => activeWindowId.value),
    hasWindows,

    // 拖拽相关
    ...dragComposable,

    // 缩放相关
    ...resizeComposable,

    // 窗口管理方法
    createWindow,
    closeWindow,
    setActiveWindow,
    bringToFront,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    startDrag,
    endDrag,
    startResize,
    endResize,

    // 批量操作
    closeAllWindows,
    minimizeAllWindows,
    restoreAllWindows,

    // 工具方法
    findWindow,
    updateWindow,
    getWindowStats,
    cascadeWindows,
    tileWindows
  };
}

// 创建全局窗口管理器实例
export const windowManagerStore = useWindowManager();
