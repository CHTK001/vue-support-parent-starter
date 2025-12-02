/**
 * interact.js 集成组合式函数
 * 提供拖拽、缩放、吸附功能
 * @author CH
 * @date 2025-12-02
 */

import { ref, onMounted, onUnmounted, Ref, watch, nextTick } from "vue";
import interact from "interactjs";

/** 边缘类型 */
export type EdgeType = "left" | "right" | "top" | "bottom" | null;

/**
 * Interact 配置选项
 */
export interface InteractOptions {
  /** 目标元素引用 */
  targetRef: Ref<HTMLElement | null>;
  /** 是否启用拖拽 */
  draggable?: boolean;
  /** 是否启用缩放 */
  resizable?: boolean;
  /** 拖拽限制边界 */
  boundary?: string | HTMLElement | "parent" | "window" | null;
  /** 是否启用惯性 */
  inertia?: boolean;
  /** 最小尺寸 */
  minSize?: { width: number; height: number };
  /** 最大尺寸 */
  maxSize?: { width: number; height: number };
  /** 缩放边缘 */
  resizeEdges?: { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean };
  /** 是否启用网格吸附 */
  snapToGrid?: boolean;
  /** 网格大小 */
  gridSize?: number;
  /** 是否启用边缘吸附 */
  snapToEdge?: boolean;
  /** 边缘吸附阈值 */
  edgeThreshold?: number;
  /** 拖拽手柄选择器 */
  dragHandle?: string;
  /** 初始位置 */
  initialPosition?: { x: number; y: number };
  /** 初始尺寸 */
  initialSize?: { width: number; height: number };
  /** 是否禁用（动态控制） */
  disabled?: Ref<boolean>;
  /** 拖拽开始回调 */
  onDragStart?: () => void;
  /** 拖拽移动回调 */
  onDragMove?: (x: number, y: number) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (x: number, y: number, snappedEdge: EdgeType) => void;
  /** 缩放回调 */
  onResize?: (width: number, height: number) => void;
  /** 边缘吸附回调 */
  onEdgeSnap?: (edge: EdgeType) => void;
}

/**
 * Interact 返回值
 */
export interface InteractReturn {
  /** 当前位置 */
  position: Ref<{ x: number; y: number }>;
  /** 当前尺寸 */
  size: Ref<{ width: number; height: number }>;
  /** 是否正在拖拽 */
  isDragging: Ref<boolean>;
  /** 是否正在缩放 */
  isResizing: Ref<boolean>;
  /** 是否吸附到边缘 */
  isSnappedToEdge: Ref<boolean>;
  /** 吸附的边缘 */
  snappedEdge: Ref<"left" | "right" | "top" | "bottom" | null>;
  /** 设置位置 */
  setPosition: (x: number, y: number) => void;
  /** 设置尺寸 */
  setSize: (width: number, height: number) => void;
  /** 重置位置 */
  resetPosition: () => void;
  /** 销毁实例 */
  destroy: () => void;
}

/**
 * 使用 interact.js 实现拖拽、缩放、吸附
 * @param options 配置选项
 * @returns 交互功能和状态
 */
export function useInteract(options: InteractOptions): InteractReturn {
  const {
    targetRef,
    draggable = true,
    resizable = false,
    boundary = "parent",
    inertia = true,
    minSize = { width: 200, height: 150 },
    maxSize = { width: Infinity, height: Infinity },
    resizeEdges = { left: true, right: true, bottom: true, top: false },
    snapToGrid = false,
    gridSize = 20,
    snapToEdge = false,
    edgeThreshold = 50,
    dragHandle,
    initialPosition = { x: 0, y: 0 },
    initialSize = { width: 400, height: 300 }
  } = options;

  // 状态
  const position = ref({ ...initialPosition });
  const size = ref({ ...initialSize });
  const isDragging = ref(false);
  const isResizing = ref(false);
  const isSnappedToEdge = ref(false);
  const snappedEdge = ref<"left" | "right" | "top" | "bottom" | null>(null);

  let interactInstance: ReturnType<typeof interact> | null = null;

  /**
   * 设置位置
   */
  const setPosition = (x: number, y: number): void => {
    position.value = { x, y };
    if (targetRef.value) {
      targetRef.value.style.transform = `translate(${x}px, ${y}px)`;
      targetRef.value.setAttribute("data-x", String(x));
      targetRef.value.setAttribute("data-y", String(y));
    }
  };

  /**
   * 设置尺寸
   */
  const setSize = (width: number, height: number): void => {
    size.value = { width, height };
    if (targetRef.value) {
      targetRef.value.style.width = `${width}px`;
      targetRef.value.style.height = `${height}px`;
    }
  };

  /**
   * 重置位置
   */
  const resetPosition = (): void => {
    setPosition(initialPosition.x, initialPosition.y);
  };

  /**
   * 检测边缘吸附
   */
  const checkEdgeSnap = (x: number, y: number, rect: DOMRect, boundaryRect: DOMRect): void => {
    if (!snapToEdge) return;

    const leftDist = x - boundaryRect.left;
    const rightDist = boundaryRect.right - (x + rect.width);
    const topDist = y - boundaryRect.top;
    const bottomDist = boundaryRect.bottom - (y + rect.height);

    if (leftDist <= edgeThreshold) {
      isSnappedToEdge.value = true;
      snappedEdge.value = "left";
    } else if (rightDist <= edgeThreshold) {
      isSnappedToEdge.value = true;
      snappedEdge.value = "right";
    } else if (topDist <= edgeThreshold) {
      isSnappedToEdge.value = true;
      snappedEdge.value = "top";
    } else if (bottomDist <= edgeThreshold) {
      isSnappedToEdge.value = true;
      snappedEdge.value = "bottom";
    } else {
      isSnappedToEdge.value = false;
      snappedEdge.value = null;
    }
  };

  /**
   * 初始化 interact
   */
  const initInteract = (): void => {
    if (!targetRef.value) return;

    const target = dragHandle ? `${dragHandle}` : targetRef.value;

    // 配置修改器
    const modifiers: ReturnType<typeof interact.modifiers.restrict>[] = [];

    // 边界限制
    if (boundary) {
      modifiers.push(
        interact.modifiers.restrict({
          restriction: boundary === "window" ? "body" : boundary,
          endOnly: false,
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        })
      );
    }

    // 网格吸附
    if (snapToGrid) {
      modifiers.push(
        interact.modifiers.snap({
          targets: [interact.snappers.grid({ x: gridSize, y: gridSize })],
          range: Infinity,
          relativePoints: [{ x: 0, y: 0 }]
        })
      );
    }

    // 创建交互实例
    interactInstance = interact(targetRef.value);

    // 配置拖拽
    if (draggable) {
      interactInstance.draggable({
        allowFrom: dragHandle || undefined,
        inertia: inertia
          ? {
              resistance: 15,
              minSpeed: 200,
              endSpeed: 10
            }
          : false,
        modifiers,
        autoScroll: true,
        listeners: {
          start: () => {
            isDragging.value = true;
            // 阻止文字选择
            document.body.style.userSelect = "none";
            options.onDragStart?.();
          },
          move: event => {
            const target = event.target as HTMLElement;
            // 使用 data 属性存储位置，避免与其他样式冲突
            const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
            const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;

            // 更新元素位置
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute("data-x", String(x));
            target.setAttribute("data-y", String(y));

            position.value = { x, y };
            options.onDragMove?.(x, y);

            // 检测边缘吸附
            if (snapToEdge && boundary !== "window") {
              const rect = target.getBoundingClientRect();
              const parent = typeof boundary === "string" ? document.querySelector(boundary) : boundary === "parent" ? target.parentElement : boundary;

              if (parent) {
                const boundaryRect = (parent as HTMLElement).getBoundingClientRect();
                checkEdgeSnap(rect.left, rect.top, rect, boundaryRect);
              }
            }
          },
          end: () => {
            isDragging.value = false;
            // 恢复文字选择
            document.body.style.userSelect = "";
            options.onDragEnd?.(position.value.x, position.value.y, snappedEdge.value);
          }
        }
      });
    }

    // 配置缩放
    if (resizable) {
      interactInstance.resizable({
        edges: resizeEdges,
        inertia: inertia,
        modifiers: [
          interact.modifiers.restrictSize({
            min: minSize,
            max: maxSize
          }),
          ...(snapToGrid
            ? [
                interact.modifiers.snap({
                  targets: [interact.snappers.grid({ x: gridSize, y: gridSize })],
                  range: Infinity,
                  relativePoints: [{ x: 0, y: 0 }]
                })
              ]
            : [])
        ],
        listeners: {
          start: () => {
            isResizing.value = true;
            document.body.style.userSelect = "none";
          },
          move: event => {
            const target = event.target as HTMLElement;
            const { width, height } = event.rect;
            const { left, top } = event.deltaRect;

            // 更新尺寸
            size.value = { width, height };
            target.style.width = `${width}px`;
            target.style.height = `${height}px`;

            // 更新位置（处理从左侧或顶部缩放）
            const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + left;
            const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + top;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute("data-x", String(x));
            target.setAttribute("data-y", String(y));

            position.value = { x, y };
            options.onResize?.(width, height);
          },
          end: () => {
            isResizing.value = false;
            document.body.style.userSelect = "";
          }
        }
      });
    }

    // 设置初始样式
    setPosition(initialPosition.x, initialPosition.y);
    if (resizable) {
      setSize(initialSize.width, initialSize.height);
    }
  };

  /**
   * 销毁实例
   */
  const destroy = (): void => {
    if (interactInstance) {
      interactInstance.unset();
      interactInstance = null;
    }
  };

  // 监听目标元素变化
  watch(targetRef, newVal => {
    if (newVal) {
      destroy();
      initInteract();
    }
  });

  // 生命周期
  onMounted(() => {
    if (targetRef.value) {
      initInteract();
    }
  });

  onUnmounted(() => {
    destroy();
  });

  return {
    position,
    size,
    isDragging,
    isResizing,
    isSnappedToEdge,
    snappedEdge,
    setPosition,
    setSize,
    resetPosition,
    destroy
  };
}
