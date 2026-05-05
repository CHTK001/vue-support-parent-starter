import { ref } from "vue";

export function usePaymentDetail<T>() {
  const currentItem = ref<T | null>(null);
  const detailVisible = ref(false);

  function showDetail(row: T) {
    currentItem.value = row;
    detailVisible.value = true;
  }

  function closeDetail() {
    detailVisible.value = false;
    currentItem.value = null;
  }

  return { currentItem, detailVisible, showDetail, closeDetail };
}
