import { ref } from "vue";

export function usePaymentDialog<T = unknown>() {
  const dialogVisible = ref(false);
  const editingItem = ref<T | null>(null);
  const isEdit = ref(false);

  function openCreate() {
    isEdit.value = false;
    editingItem.value = null;
    dialogVisible.value = true;
  }

  function openEdit(item: T) {
    isEdit.value = true;
    editingItem.value = item;
    dialogVisible.value = true;
  }

  function closeDialog() {
    dialogVisible.value = false;
    editingItem.value = null;
    isEdit.value = false;
  }

  return { dialogVisible, editingItem, isEdit, openCreate, openEdit, closeDialog };
}
