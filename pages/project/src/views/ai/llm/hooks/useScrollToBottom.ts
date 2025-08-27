import { onMounted, onUnmounted, ref } from "vue";

export default function useScrollToBottom() {
  // 对话框滚动容器
  const scrollContainer = ref<HTMLElement | null>(null);
  // 记录上一次滚动高度
  let previousScrollHeight = 0;
  // 高度观察器
  let observer: MutationObserver | null = null;
  // 距离底部的阈值
  const bottomThreshold = 150;

  // 滚动到底部
  const scrollToBottom = () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight;
    }
  };

  // 检查用户是否在底部
  const isAtBottom = () => {
    if (!scrollContainer.value) return false;
    return scrollContainer.value.scrollTop + scrollContainer.value.clientHeight + bottomThreshold >= scrollContainer.value.scrollHeight;
  };

  // 初始化高度观察器
  const initHeightObserver = () => {
    if (!scrollContainer.value) return;
    observer = new MutationObserver(() => {
      const newHeight = scrollContainer.value!.scrollHeight;
      if (isAtBottom() && newHeight > previousScrollHeight) {
        scrollToBottom();
      }
      previousScrollHeight = newHeight;
    });

    observer.observe(scrollContainer.value, { childList: true, subtree: true });
  };

  // 挂载时初始化高度观察器
  onMounted(() => {
    initHeightObserver();
  });

  // 卸载时销毁观察器
  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
    }
  });

  return { scrollContainer };
}
