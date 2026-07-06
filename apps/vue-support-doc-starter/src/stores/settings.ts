import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { getClientConfig, saveClientConfig } from "@/services";

const STORAGE_KEY = "mcp-manager-settings";

interface SettingsState {
  appName: string;
  autoScan: boolean;
  defaultClient: string;
  defaultProvider: string;
  defaultModel: string;
  backupPath: string;
  webAutoStart: boolean;
  webServerPort: number;
  dataDir: string;
aiProvider: string;
  aiModel: string;
  syncCcswitch: boolean;
  syncCcswitchUrl: string;
  syncZcode: boolean;
  syncZcodeUrl: string;
  syncCursorByok: boolean;
  syncCursorByokUrl: string;
  syncIntervalMinutes: number;
  syncAutoImport: boolean;
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
    defaultProvider: "",
    defaultModel: "",
    backupPath: "",
    webAutoStart: true,
    webServerPort: 3721,
    dataDir: "",
aiProvider: "",
    aiModel: "",
    syncCcswitch: false,
    syncCcswitchUrl: "",
    syncZcode: false,
    syncZcodeUrl: "",
    syncCursorByok: false,
    syncCursorByokUrl: "",
    syncIntervalMinutes: 1,
    syncAutoImport: true,
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
        defaultProvider: settings.defaultProvider,
        defaultModel: settings.defaultModel,
        webAutoStart: settings.webAutoStart,
        webServerPort: settings.webServerPort,
        dataDir: settings.dataDir,
        syncCcswitch: settings.syncCcswitch,
        syncCcswitchUrl: settings.syncCcswitchUrl,
        syncZcode: settings.syncZcode,
        syncZcodeUrl: settings.syncZcodeUrl,
        syncCursorByok: settings.syncCursorByok,
        syncCursorByokUrl: settings.syncCursorByokUrl,
        syncIntervalMinutes: settings.syncIntervalMinutes,
        syncAutoImport: settings.syncAutoImport,
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
        if (mcpData.defaultProvider) state.value.defaultProvider = mcpData.defaultProvider;
        if (mcpData.defaultModel) state.value.defaultModel = mcpData.defaultModel;
        if (mcpData.webAutoStart !== undefined) state.value.webAutoStart = mcpData.webAutoStart;
        if (mcpData.webServerPort) state.value.webServerPort = mcpData.webServerPort;
        if (mcpData.dataDir) state.value.dataDir = mcpData.dataDir;
        if (mcpData.syncCcswitch !== undefined) state.value.syncCcswitch = mcpData.syncCcswitch;
        if (mcpData.syncCcswitchUrl) state.value.syncCcswitchUrl = mcpData.syncCcswitchUrl;
        if (mcpData.syncZcode !== undefined) state.value.syncZcode = mcpData.syncZcode;
        if (mcpData.syncZcodeUrl) state.value.syncZcodeUrl = mcpData.syncZcodeUrl;
        if (mcpData.syncCursorByok !== undefined) state.value.syncCursorByok = mcpData.syncCursorByok;
        if (mcpData.syncCursorByokUrl) state.value.syncCursorByokUrl = mcpData.syncCursorByokUrl;
        if (mcpData.syncIntervalMinutes) state.value.syncIntervalMinutes = mcpData.syncIntervalMinutes;
        if (mcpData.syncAutoImport !== undefined) state.value.syncAutoImport = mcpData.syncAutoImport;
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