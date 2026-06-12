import { ref, onUnmounted, watch, type Ref } from "vue";
import type { DataBindingConfig } from "../types/widget";

export function useDataBinding(binding: Ref<DataBindingConfig | undefined>) {
  const data = ref<unknown>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function fetchData(): Promise<void> {
    const cfg = binding.value;
    if (!cfg?.apiUrl) return;

    loading.value = true;
    error.value = null;

    try {
      const opts: RequestInit = {
        method: cfg.method || "GET",
        headers: cfg.headers,
      };
      if (cfg.body && cfg.method === "POST") {
        opts.body = cfg.body;
      }
      const resp = await fetch(cfg.apiUrl, opts);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      let result: unknown = await resp.json();

      if (cfg.dataPath) {
        const parts = cfg.dataPath.split(".");
        for (const part of parts) {
          if (result && typeof result === "object") {
            result = (result as Record<string, unknown>)[part];
          } else {
            break;
          }
        }
      }
      data.value = result;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  function startPolling(): void {
    stopPolling();
    const cfg = binding.value;
    if (!cfg?.apiUrl || !cfg.refreshInterval || cfg.refreshInterval <= 0) {
      if (cfg?.apiUrl) fetchData();
      return;
    }
    fetchData();
    timer = setInterval(fetchData, cfg.refreshInterval);
  }

  function stopPolling(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  watch(
    () => binding.value?.apiUrl,
    () => {
      if (binding.value?.apiUrl) {
        startPolling();
      } else {
        stopPolling();
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    stopPolling();
  });

  return { data, loading, error, fetchData, startPolling, stopPolling };
}
