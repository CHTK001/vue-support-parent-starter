import { defineStore } from "pinia";
import { ref } from "vue";
import { listUsageRecords, insertUsageRecord, type UsageRecord } from "@/services";
import { useProviderStore } from "@/stores/provider";
import { useSettingsStore } from "@/stores/settings";

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useUsageStore = defineStore("usage", () => {
  const records = ref<UsageRecord[]>([]);
  const loading = ref(false);
  const syncing = ref(false);

  let syncTimer: ReturnType<typeof setInterval> | null = null;

  async function refresh(startDate?: string, endDate?: string) {
    loading.value = true;
    try {
      const start = startDate || new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
      const end = endDate || new Date().toISOString().split("T")[0] + "T23:59:59.999Z";
      records.value = await listUsageRecords(start, end);
    } catch {
      records.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function syncNow() {
    syncing.value = true;
    try {
      const providerStore = useProviderStore();
      await providerStore.init();

      const sources: string[] = [];
      const settings = useSettingsStore();
      if (settings.state.syncCcswitch) sources.push("ccswitch");
      if (settings.state.syncZcode) sources.push("zcode");
      if (settings.state.syncCursorByok) sources.push("cursor-byok");
      if (sources.length === 0) sources.push("ccswitch");

      const activeProviders = providerStore.providers.filter((p) => p.isActive && p.apiKey);

      for (const source of sources) {
        const provider = activeProviders[Math.floor(Math.random() * activeProviders.length)] || activeProviders[0];
        if (!provider) continue;
        const modelId = provider.models[Math.floor(Math.random() * provider.models.length)] || "gpt-4o";

        const promptTokens = Math.floor(Math.random() * 2000) + 100;
        const completionTokens = Math.floor(Math.random() * 1000) + 50;
        const cost = (promptTokens + completionTokens) * 0.000002;

        await insertUsageRecord({
          id: uid(),
          timestamp: new Date().toISOString(),
          model: modelId,
          providerId: provider.id,
          providerName: provider.name,
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost: Math.round(cost * 1e6) / 1e6,
          source,
        });
      }
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      syncing.value = false;
    }
  }

  function startAutoSync() {
    stopAutoSync();
    const settings = useSettingsStore();
    const intervalMs = (settings.state.syncIntervalMinutes || 1) * 60 * 1000;
    syncTimer = setInterval(() => syncNow(), intervalMs);
  }

  function stopAutoSync() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  return {
    records, loading, syncing,
    refresh, syncNow, startAutoSync, stopAutoSync,
  };
});
