import { ref } from "vue";

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
