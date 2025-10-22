import { ref } from "vue";

export interface UseDialogResizeOptions {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onResizeEnd?: () => void;
}

export function useDialogResize(options: UseDialogResizeOptions = {}) {
  const { initialWidth = 400, initialHeight = 300, minWidth = 300, minHeight = 200, onResizeEnd } = options;

  const isResizing = ref(false);
  const resizeDirection = ref("");
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const dialogWidth = ref(initialWidth);
  const dialogHeight = ref(initialHeight);
  const dialogX = ref(0);
  const dialogY = ref(0);

  // 开始缩放
  const onResizeStart = (e: MouseEvent, direction: string) => {
    isResizing.value = true;
    resizeDirection.value = direction;
    dragStartX.value = e.clientX;
    dragStartY.value = e.clientY;

    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeEndHandler);
  };

  // 缩放移动
  const onResizeMove = (e: MouseEvent) => {
    if (!isResizing.value) return;

    const deltaX = e.clientX - dragStartX.value;
    const deltaY = e.clientY - dragStartY.value;

    const direction = resizeDirection.value;

    // 根据方向调整大小和位置
    if (direction.includes("right")) {
      dialogWidth.value = Math.max(minWidth, dialogWidth.value + deltaX);
    }
    if (direction.includes("left")) {
      const newWidth = Math.max(minWidth, dialogWidth.value - deltaX);
      if (newWidth > minWidth) {
        dialogX.value += deltaX;
        dialogWidth.value = newWidth;
      }
    }
    if (direction.includes("bottom")) {
      dialogHeight.value = Math.max(minHeight, dialogHeight.value + deltaY);
    }
    if (direction.includes("top")) {
      const newHeight = Math.max(minHeight, dialogHeight.value - deltaY);
      if (newHeight > minHeight) {
        dialogY.value += deltaY;
        dialogHeight.value = newHeight;
      }
    }

    dragStartX.value = e.clientX;
    dragStartY.value = e.clientY;
  };

  // 结束缩放
  const onResizeEndHandler = () => {
    isResizing.value = false;
    resizeDirection.value = "";
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeEndHandler);

    // 触发回调
    if (onResizeEnd) {
      onResizeEnd();
    }
  };

  // 重置尺寸
  const resetSize = () => {
    dialogWidth.value = initialWidth;
    dialogHeight.value = initialHeight;
  };

  // 设置尺寸
  const setSize = (width: number, height: number) => {
    dialogWidth.value = width;
    dialogHeight.value = height;
  };

  // 设置位置（用于与拖拽集成）
  const setPosition = (x: number, y: number) => {
    dialogX.value = x;
    dialogY.value = y;
  };

  return {
    // 状态
    isResizing,
    dialogWidth,
    dialogHeight,
    dialogX,
    dialogY,

    // 方法
    onResizeStart,
    resetSize,
    setSize,
    setPosition
  };
}
