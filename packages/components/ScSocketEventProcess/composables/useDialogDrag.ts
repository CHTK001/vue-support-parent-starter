import { ref } from "vue";

export interface UseDialogDragOptions {
  onDragEnd?: () => void;
}

export function useDialogDrag(options: UseDialogDragOptions = {}) {
  const { onDragEnd } = options;

  const isDragging = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const dialogX = ref(0);
  const dialogY = ref(0);

  // 开始拖拽
  const onDragStart = (e: MouseEvent) => {
    isDragging.value = true;
    dragStartX.value = e.clientX - dialogX.value;
    dragStartY.value = e.clientY - dialogY.value;

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEndHandler);
  };

  // 拖拽移动
  const onDragMove = (e: MouseEvent) => {
    if (!isDragging.value) return;

    dialogX.value = e.clientX - dragStartX.value;
    dialogY.value = e.clientY - dragStartY.value;
  };

  // 结束拖拽
  const onDragEndHandler = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEndHandler);

    // 触发回调
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // 重置位置
  const resetPosition = () => {
    dialogX.value = 0;
    dialogY.value = 0;
  };

  // 设置位置
  const setPosition = (x: number, y: number) => {
    dialogX.value = x;
    dialogY.value = y;
  };

  return {
    // 状态
    isDragging,
    dialogX,
    dialogY,

    // 方法
    onDragStart,
    resetPosition,
    setPosition
  };
}
