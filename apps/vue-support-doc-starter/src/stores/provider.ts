import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { listProviders, saveProvider, deleteProvider, type ProviderData } from "@/services";

export type ProviderProtocol = "openai" | "claude" | "gemini";

export interface ModelEntry {
  id: string;
  displayName: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  apiBase: string;
  apiKey?: string;
  models: string[];
  modelLabels?: Record<string, string>;
  isActive: boolean;
  protocol: ProviderProtocol;
  clientId?: string;
}

export function getModelEntries(provider: ModelProvider): ModelEntry[] {
  return provider.models.map((m) => ({
    id: m,
    displayName: provider.modelLabels?.[m] || m,
  }));
}

export function setModelsFromEntries(provider: ModelProvider, entries: ModelEntry[]): void {
  provider.models = entries.map((e) => e.id);
  const labels: Record<string, string> = {};
  for (const e of entries) {
    if (e.displayName && e.displayName !== e.id) labels[e.id] = e.displayName;
  }
  provider.modelLabels = Object.keys(labels).length ? labels : undefined;
}

const STORAGE_KEY = "mcp-manager-providers";

export const useProviderStore = defineStore("provider", () => {
  const providers = ref<ModelProvider[]>([]);
  const activeProviderId = ref<string>(localStorage.getItem("active-provider") || "");
  const loaded = ref(false);

  // Load from backend on init
  async function init() {
    try {
      const data = await listProviders();
      if (data && data.length > 0) {
        providers.value = data.map((p) => ({
          ...p,
          protocol: (p as any).protocol || "openai"
        }));
      }
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) providers.value = JSON.parse(saved);
    }
    if (!activeProviderId.value && providers.value.length > 0) {
      activeProviderId.value = providers.value[0].id;
    }
    loaded.value = true;
  }

  // Sync to backend on changes
  watch(providers, async (val) => {
    if (!loaded.value) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    // Persist to backend
    for (const p of val) {
      try { await saveProvider(p as any); } catch {}
    }
  }, { deep: true });

  const activeProvider = computed(() => {
    return providers.value.find((p) => p.id === activeProviderId.value);
  });

  const allModels = computed(() => {
    return providers.value
      .filter((p) => p.isActive && p.apiKey)
      .flatMap((p) =>
        p.models.map((m) => ({
          provider: p.name,
          model: m,
          fullId: `${p.id}/${m}`,
          protocol: p.protocol
        }))
      );
  });

  function addProvider(provider: ModelProvider) {
    providers.value.push(provider);
  }

  function updateProvider(id: string, updates: Partial<ModelProvider>) {
    const idx = providers.value.findIndex((p) => p.id === id);
    if (idx >= 0) providers.value[idx] = { ...providers.value[idx], ...updates };
  }

  async function removeProvider(id: string) {
    providers.value = providers.value.filter((p) => p.id !== id);
    try { await deleteProvider(id); } catch {}
  }

  function setActiveProvider(id: string) {
    activeProviderId.value = id;
    localStorage.setItem("active-provider", id);
  }

  function toggleProvider(id: string) {
    const p = providers.value.find((x) => x.id === id);
    if (p) p.isActive = !p.isActive;
  }

  function getDefaultProviders(): ModelProvider[] {
    return [
      { id: "openai", name: "OpenAI", apiBase: "https://api.openai.com/v1", models: [], isActive: true, protocol: "openai" },
      { id: "anthropic", name: "Anthropic", apiBase: "https://api.anthropic.com", models: [], isActive: true, protocol: "claude" },
      { id: "google", name: "Google AI", apiBase: "https://generativelanguage.googleapis.com/v1", models: [], isActive: true, protocol: "gemini" }
    ];
  }

  return {
    providers, activeProviderId, activeProvider, allModels, loaded,
    init, addProvider, updateProvider, removeProvider, setActiveProvider, toggleProvider
  };
});
