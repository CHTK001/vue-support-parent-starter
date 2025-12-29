/**
 * useDialogInteract - 对话框 interact.js 拖拽/缩放 composable
 * 封装 interact.js 的拖拽和缩放功能
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, onUnmounted, type Ref } from 'vue';
import interact from 'interactjs';

/** 尺寸限制 */
export interface SizeConstraints {
  width: number;
  height: number;
}

/** 对齐吸附信息 */
export interface SnapInfo {
  x: number;
  y: number;
  snapped: boolean;
}

/** 拖拽/缩放配置选项 */
export interface DialogInteractOptions {
  /** 是否启用拖拽 */
  draggable?: boolean;
  /** 是否启用缩放 */
  resizable?: boolean;
  /** 拖拽触发区域选择器 */
  dragHandle?: string;
  /** 最小尺寸 */
  minSize?: SizeConstraints;
  /** 最大尺寸 */
  maxSize?: SizeConstraints;
  /** 是否允许拖出视口边界 */
  dragOutside?: boolean;
  /** 吸附到其他对话框阈值 */
  snapThreshold?: number;
  /** 获取其他对话框位置的函数 */
  getOtherDialogsRects?: () => DOMRect[];
  /** 拖拽开始回调 */
  onDragStart?: () => void;
  /** 拖拽移动回调 */
  onDragMove?: (x: number, y: number) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (event: { target: HTMLElement; client: { x: number; y: number } }) => void;
  /** 缩放开始回调 */
  onResizeStart?: () => void;
  /** 缩放移动回调 */
  onResizeMove?: (width: number, height: number) => void;
  /** 缩放结束回调 */
  onResizeEnd?: () => void;
}

/** 拖拽/缩放返回值 */
export interface DialogInteractReturn {
  /** 是否正在拖拽 */
  isDragging: Ref<boolean>;
  /** 是否正在缩放 */
  isResizing: Ref<boolean>;
  /** 初始化 interact.js */
  initInteract: (element: HTMLElement) => void;
  /** 销毁 interact.js */
  destroyInteract: () => void;
  /** 计算吸附位置 */
  calculateSnap: (x: number, y: number, width: number, height: number) => SnapInfo;
  /** 更新位置 */
  updatePosition: (element: HTMLElement, x: number, y: number) => void;
  /** 更新尺寸 */
  updateSize: (element: HTMLElement, width: number, height: number) => void;
  /** 获取当前位置 */
  getPosition: (element: HTMLElement) => { x: number; y: number };
}

/**
 * 对话框 interact.js 拖拽/缩放 composable
 * @param options 配置选项
 * @returns DialogInteractReturn
 */
export function useDialogInteract(options: DialogInteractOptions = {}): DialogInteractReturn {
  const {
    draggable = true,
    resizable = false,
    dragHandle = '.sc-dialog__header',
    minSize = { width: 300, height: 200 },
    maxSize = { width: Infinity, height: Infinity },
    dragOutside = false,
    snapThreshold = 10,
    getOtherDialogsRects,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
  } = options;

  const isDragging = ref(false);
  const isResizing = ref(false);
  
  let interactInstance: ReturnType<typeof interact> | null = null;

  /**
   * 计算吸附到其他对话框的位置
   */
  const calculateSnap = (x: number, y: number, width: number, height: number): SnapInfo => {
    if (!getOtherDialogsRects) return { x, y, snapped: false };

    const otherRects = getOtherDialogsRects();
    let snappedX = x;
    let snappedY = y;
    let snapped = false;

    const currentRight = x + width;
    const currentBottom = y + height;

    otherRects.forEach(rect => {
      // 左边缘吸附
      if (Math.abs(x - rect.left) < snapThreshold) {
        snappedX = rect.left;
        snapped = true;
      } else if (Math.abs(x - rect.right) < snapThreshold) {
        snappedX = rect.right;
        snapped = true;
      } else if (Math.abs(currentRight - rect.left) < snapThreshold) {
        snappedX = rect.left - width;
        snapped = true;
      } else if (Math.abs(currentRight - rect.right) < snapThreshold) {
        snappedX = rect.right - width;
        snapped = true;
      }

      // 上边缘吸附
      if (Math.abs(y - rect.top) < snapThreshold) {
        snappedY = rect.top;
        snapped = true;
      } else if (Math.abs(y - rect.bottom) < snapThreshold) {
        snappedY = rect.bottom;
        snapped = true;
      } else if (Math.abs(currentBottom - rect.top) < snapThreshold) {
        snappedY = rect.top - height;
        snapped = true;
      } else if (Math.abs(currentBottom - rect.bottom) < snapThreshold) {
        snappedY = rect.bottom - height;
        snapped = true;
      }
    });

    return { x: snappedX, y: snappedY, snapped };
  };

  /**
   * 更新元素位置
   */
  const updatePosition = (element: HTMLElement, x: number, y: number): void => {
    element.style.transform = `translate(${x}px, ${y}px)`;
    element.setAttribute('data-x', String(x));
    element.setAttribute('data-y', String(y));
  };

  /**
   * 更新元素尺寸
   */
  const updateSize = (element: HTMLElement, width: number, height: number): void => {
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  };

  /**
   * 获取当前位置
   */
  const getPosition = (element: HTMLElement): { x: number; y: number } => {
    return {
      x: parseFloat(element.getAttribute('data-x') || '0') || 0,
      y: parseFloat(element.getAttribute('data-y') || '0') || 0,
    };
  };

  /**
   * 初始化 interact.js
   */
  const initInteract = (element: HTMLElement): void => {
    if (!element) return;

    destroyInteract();

    interactInstance = interact(element);

    // 配置拖拽
    if (draggable) {
      interactInstance.draggable({
        allowFrom: dragHandle,
        inertia: false,
        listeners: {
          start: () => {
            isDragging.value = true;
            onDragStart?.();
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            let x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx;
            let y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy;

            // 边界限制
            if (!dragOutside) {
              const rect = target.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;

              const newLeft = rect.left + event.dx;
              const newTop = rect.top + event.dy;
              const newRight = newLeft + rect.width;
              const newBottom = newTop + rect.height;

              if (newTop < 0) y -= newTop;
              if (newLeft < 0) x -= newLeft;
              if (newRight > viewportWidth) x -= newRight - viewportWidth;
              if (newBottom > viewportHeight) y -= newBottom - viewportHeight;
            }

            updatePosition(target, x, y);
            onDragMove?.(x, y);
          },
          end: (event) => {
            isDragging.value = false;
            onDragEnd?.({
              target: event.target as HTMLElement,
              client: { x: event.client.x, y: event.client.y },
            });
          },
        },
      });
    }

    // 配置缩放
    if (resizable) {
      interactInstance.resizable({
        edges: { left: true, right: true, bottom: true, top: false },
        modifiers: [
          interact.modifiers.restrictSize({
            min: minSize,
            max: maxSize,
          }),
        ],
        listeners: {
          start: (event) => {
            isResizing.value = true;
            document.body.style.userSelect = 'none';
            // 禁用过渡，避免缩放卡顿
            const target = event.target as HTMLElement;
            if (target) {
              target.style.transition = 'none';
            }
            onResizeStart?.();
          },
          move: (event) => {
            const target = event.target as HTMLElement;
            const { width, height } = event.rect;
            const { left, top } = event.deltaRect;

            updateSize(target, width, height);

            const x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + left;
            const y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + top;
            updatePosition(target, x, y);

            onResizeMove?.(width, height);
          },
          end: (event) => {
            isResizing.value = false;
            document.body.style.userSelect = '';
            // 恢复过渡
            const target = event.target as HTMLElement;
            if (target) {
              target.style.transition = '';
            }
            onResizeEnd?.();
          },
        },
      });
    }
  };

  /**
   * 销毁 interact.js
   */
  const destroyInteract = (): void => {
    if (interactInstance) {
      interactInstance.unset();
      interactInstance = null;
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    destroyInteract();
  });

  return {
    isDragging,
    isResizing,
    initInteract,
    destroyInteract,
    calculateSnap,
    updatePosition,
    updateSize,
    getPosition,
  };
}

export default useDialogInteract;
