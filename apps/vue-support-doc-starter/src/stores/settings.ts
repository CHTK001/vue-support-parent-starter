import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { getClientConfig, saveClientConfig } from "@/services";

const STORAGE_KEY = "mcp-manager-settings";

interface SettingsState {
  appName: string;
  autoScan: boolean;
  defaultClient: string;
  backupPath: string;
  webAutoStart: boolean;
  webServerPort: number;
  dataDir: string;
}

function loadSettings(): SettingsState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultSettings(), ...JSON.parse(saved) };
  } catch {}
  return defaultSettings();
}

function defaultSettings(): SettingsState {
  return {
    appName: "MCP Manager",
    autoScan: true,
    defaultClient: "",
    backupPath: "",
    webAutoStart: true,
    webServerPort: 3721,
    dataDir: "",
  };
}

export const useSettingsStore = defineStore("settings", () => {
  const state = ref<SettingsState>(loadSettings());

  watch(
    state,
    (val) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      persistToBackend(val);
    },
    { deep: true }
  );

  async function persistToBackend(settings: SettingsState) {
    const now = new Date().toISOString();
    const existing = await getClientConfig("app-settings");
    const config = {
      id: "app-settings",
      name: settings.appName,
      mcpJson: JSON.stringify({
        defaultClient: settings.defaultClient,
        webAutoStart: settings.webAutoStart,
        webServerPort: settings.webServerPort,
        dataDir: settings.dataDir,
      }),
      skillsJson: "{}",
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await saveClientConfig(config);
  }

  function setDefaultClient(clientId: string) {
    state.value.defaultClient = clientId;
  }
  function updateSettings(partial: Partial<SettingsState>) {
    Object.assign(state.value, partial);
  }

  async function initFromBackend() {
    const config = await getClientConfig("app-settings");
    if (config) {
      try {
        const mcpData = JSON.parse(config.mcpJson);
        if (mcpData.defaultClient) state.value.defaultClient = mcpData.defaultClient;
        if (mcpData.webAutoStart !== undefined)
          state.value.webAutoStart = mcpData.webAutoStart;
        if (mcpData.webServerPort) state.value.webServerPort = mcpData.webServerPort;
        if (mcpData.dataDir) state.value.dataDir = mcpData.dataDir;
      } catch {}
    }
  }

  return {
    state,
    setDefaultClient,
    updateSettings,
    initFromBackend,
  };
});