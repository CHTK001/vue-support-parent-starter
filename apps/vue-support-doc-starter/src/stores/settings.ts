import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { getClientConfig, saveClientConfig } from "@/services";

const STORAGE_KEY = "mcp-manager-settings";

interface SettingsState {
  appName: string;
  defaultClient: string;
  defaultProvider: string;
  defaultModel: string;
  backupPath: string;
  webAutoStart: boolean;
  webServerPort: number;
  dataDir: string;
  apiPort: string;
aiProvider: string;
  aiModel: string;
  syncCcswitch: boolean;
  syncCcswitchUrl: string;
  syncCcswitchInterval: number;
  syncZcode: boolean;
  syncZcodeUrl: string;
  syncZcodeInterval: number;
  syncCursorByok: boolean;
  syncCursorByokUrl: string;
  syncCursorByokInterval: number;
  syncMcp: boolean;
  syncSkills: boolean;
  syncMcpInterval: number;
  syncSkillsInterval: number;
  syncUsage: boolean;
  syncUsageInterval: number;
  syncIntervalMinutes: number;
  syncAutoImport: boolean;
  webdavUrl: string;
  webdavUser: string;
  webdavPass: string;
  webdavAutoUpload: boolean;
  webdavAutoUploadInterval: number;
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
    defaultClient: "",
    defaultProvider: "",
    defaultModel: "",
    backupPath: "",
    webAutoStart: true,
    webServerPort: 3721,
    dataDir: "",
    apiPort: "8080",
aiProvider: "",
    aiModel: "",
    syncCcswitch: true,
    syncCcswitchUrl: "",
    syncCcswitchInterval: 20,
    syncZcode: true,
    syncZcodeUrl: "",
    syncZcodeInterval: 20,
    syncCursorByok: true,
    syncCursorByokUrl: "",
    syncCursorByokInterval: 20,
    syncMcp: true,
    syncSkills: true,
    syncMcpInterval: 20,
    syncSkillsInterval: 20,
    syncUsage: true,
    syncUsageInterval: 60,
    syncIntervalMinutes: 1,
    syncAutoImport: true,
    webdavUrl: "",
    webdavUser: "",
    webdavPass: "",
    webdavAutoUpload: false,
    webdavAutoUploadInterval: 300,
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
        apiPort: settings.apiPort,
        syncCcswitch: settings.syncCcswitch,
        syncCcswitchUrl: settings.syncCcswitchUrl,
        syncCcswitchInterval: settings.syncCcswitchInterval,
        syncZcode: settings.syncZcode,
        syncZcodeUrl: settings.syncZcodeUrl,
        syncZcodeInterval: settings.syncZcodeInterval,
        syncCursorByok: settings.syncCursorByok,
        syncCursorByokUrl: settings.syncCursorByokUrl,
        syncCursorByokInterval: settings.syncCursorByokInterval,
        syncMcp: settings.syncMcp,
        syncSkills: settings.syncSkills,
        syncMcpInterval: settings.syncMcpInterval,
        syncSkillsInterval: settings.syncSkillsInterval,
        syncUsage: settings.syncUsage,
        syncUsageInterval: settings.syncUsageInterval,
        syncIntervalMinutes: settings.syncIntervalMinutes,
        syncAutoImport: settings.syncAutoImport,
        webdavUrl: settings.webdavUrl,
        webdavUser: settings.webdavUser,
        webdavPass: settings.webdavPass,
        webdavAutoUpload: settings.webdavAutoUpload,
        webdavAutoUploadInterval: settings.webdavAutoUploadInterval,
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
        if (mcpData.apiPort) state.value.apiPort = mcpData.apiPort;
        if (mcpData.syncCcswitch !== undefined) state.value.syncCcswitch = mcpData.syncCcswitch;
        if (mcpData.syncCcswitchUrl) state.value.syncCcswitchUrl = mcpData.syncCcswitchUrl;
        if (mcpData.syncCcswitchInterval) state.value.syncCcswitchInterval = mcpData.syncCcswitchInterval;
        if (mcpData.syncZcode !== undefined) state.value.syncZcode = mcpData.syncZcode;
        if (mcpData.syncZcodeUrl) state.value.syncZcodeUrl = mcpData.syncZcodeUrl;
        if (mcpData.syncZcodeInterval) state.value.syncZcodeInterval = mcpData.syncZcodeInterval;
        if (mcpData.syncCursorByok !== undefined) state.value.syncCursorByok = mcpData.syncCursorByok;
        if (mcpData.syncCursorByokUrl) state.value.syncCursorByokUrl = mcpData.syncCursorByokUrl;
        if (mcpData.syncCursorByokInterval) state.value.syncCursorByokInterval = mcpData.syncCursorByokInterval;
        if (mcpData.syncMcp !== undefined) state.value.syncMcp = mcpData.syncMcp;
        if (mcpData.syncSkills !== undefined) state.value.syncSkills = mcpData.syncSkills;
        if (mcpData.syncMcpInterval) state.value.syncMcpInterval = mcpData.syncMcpInterval;
        if (mcpData.syncSkillsInterval) state.value.syncSkillsInterval = mcpData.syncSkillsInterval;
        if (mcpData.syncUsage !== undefined) state.value.syncUsage = mcpData.syncUsage;
        if (mcpData.syncUsageInterval) state.value.syncUsageInterval = mcpData.syncUsageInterval;
        if (mcpData.syncIntervalMinutes) state.value.syncIntervalMinutes = mcpData.syncIntervalMinutes;
        if (mcpData.syncAutoImport !== undefined) state.value.syncAutoImport = mcpData.syncAutoImport;
        if (mcpData.webdavUrl) state.value.webdavUrl = mcpData.webdavUrl;
        if (mcpData.webdavUser) state.value.webdavUser = mcpData.webdavUser;
        if (mcpData.webdavPass) state.value.webdavPass = mcpData.webdavPass;
        if (mcpData.webdavAutoUpload !== undefined) state.value.webdavAutoUpload = mcpData.webdavAutoUpload;
        if (mcpData.webdavAutoUploadInterval) state.value.webdavAutoUploadInterval = mcpData.webdavAutoUploadInterval;
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