import { onUnmounted, ref } from "vue";

export function usePaymentAutoRefresh(callback: () => void, defaultSeconds = 60) {
  const refreshSeconds = ref(defaultSeconds);
  let timer: ReturnType<typeof setInterval> | null = null;

  function startRefresh(seconds?: number) {
    stopRefresh();
    const interval = (seconds ?? refreshSeconds.value) * 1000;
    timer = setInterval(callback, interval);
  }

  function stopRefresh() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  onUnmounted(stopRefresh);

  return { refreshSeconds, startRefresh, stopRefresh };
}
