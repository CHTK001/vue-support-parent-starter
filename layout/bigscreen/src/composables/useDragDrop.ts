/**
 * 拖拽状态管理
 * 使用模块级变量确保 palette → canvas 的 drag type 可靠传递，
 * 避免浏览器 dataTransfer 跨事件不稳定的问题。
 */
import { ref } from "vue";

/** 当前正在拖拽的 widget type */
const _dragType = ref<string | null>(null);

export function useDragDrop() {
  function startDrag(type: string) {
    _dragType.value = type;
  }

  function clearDrag() {
    _dragType.value = null;
  }

  function getDragType(): string | null {
    return _dragType.value;
  }

  return { startDrag, clearDrag, getDragType };
}
