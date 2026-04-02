import type { PlatformConfigs } from "./types/config";

export type FontEncryptionNoiseLevel = "low" | "medium" | "high";

export interface FrontendSystemConfig {
  themeSkinEnabled: boolean;
  themeManagementEnabled: boolean;
  loginThemeSwitcherEnabled: boolean;
  debugProtectionEnabled: boolean;
  crashPageOpen: boolean;
  loopDebuggerOpen: boolean;
  debugOverlayOpen: boolean;
  debugBypassEnabled: boolean;
  debugBypassParamName: string;
  debugBypassSecret: string;
  storageEncode: boolean;
  fontEncryptionEnabled: boolean;
  fontEncryptionApplyGlobal: boolean;
  fontEncryptionDisableCopy: boolean;
  fontEncryptionOcrNoise: boolean;
  fontEncryptionOcrNoiseLevel: FontEncryptionNoiseLevel;
}

const STORAGE_KEY = "frontend-system-config";
const STORAGE_CHANGE_EVENT = "repo:frontend-system-config-change";
const DEFAULT_DEBUG_PARAM_NAME = "sk";
const DEFAULT_FONT_NOISE_LEVEL: FontEncryptionNoiseLevel = "low";
const THEME_SKIN_CONFIG_KEYS = [
  "EnableThemeSkinFeature",
  "EnableThemeManagement",
  "EnableLoginThemeSwitcher",
] as const;

const DEBUG_CONFIG_KEYS = [
  "DebugProtectionOpen",
  "CrashPageOpen",
  "LoopDebuggerOpen",
  "DebugOverlayOpen",
  "DebugBypassEnabled",
  "DebugBypassParamName",
  "DebugBypassSecret",
] as const;

const FONT_CONFIG_KEYS = [
  "FontEncryptionEnabled",
  "FontEncryptionApplyGlobal",
  "FontEncryptionDisableCopy",
  "FontEncryptionOcrNoise",
  "FontEncryptionOcrNoiseLevel",
] as const;

const normalizeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }

  return fallback;
};

const normalizeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized || fallback;
  }

  return fallback;
};

const normalizeNoiseLevel = (
  value: unknown,
  fallback: FontEncryptionNoiseLevel = DEFAULT_FONT_NOISE_LEVEL,
): FontEncryptionNoiseLevel => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }

  return fallback;
};

const normalizeDebugProtectionPriority = <
  T extends Pick<
    FrontendSystemConfig,
    "crashPageOpen" | "loopDebuggerOpen" | "debugOverlayOpen"
  >,
>(
  value: T,
): T => {
  if (value.crashPageOpen) {
    return {
      ...value,
      crashPageOpen: true,
      loopDebuggerOpen: false,
      debugOverlayOpen: false,
    };
  }

  if (value.loopDebuggerOpen) {
    return {
      ...value,
      crashPageOpen: false,
      loopDebuggerOpen: true,
      debugOverlayOpen: false,
    };
  }

  if (value.debugOverlayOpen) {
    return {
      ...value,
      crashPageOpen: false,
      loopDebuggerOpen: false,
      debugOverlayOpen: true,
    };
  }

  return {
    ...value,
    crashPageOpen: false,
    loopDebuggerOpen: false,
    debugOverlayOpen: false,
  };
};

const readStoredObject = (): Record<string, unknown> => {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const emitFrontendSystemConfigChange = (config: FrontendSystemConfig): void => {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(STORAGE_CHANGE_EVENT, {
      detail: { config },
    }),
  );
};

export const isDevEnvironment = (): boolean => {
  try {
    if (Boolean(import.meta.env?.DEV)) {
      return true;
    }

    if (String(import.meta.env?.MODE || "").toLowerCase() === "development") {
      return true;
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    const hostname = String(window.location.hostname || "").toLowerCase();
    return (
      hostname === "127.0.0.1" ||
      hostname === "localhost" ||
      hostname.endsWith(".local")
    );
  }

  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

export const resolveFrontendSystemDefaults = (
  source: Partial<PlatformConfigs> = {},
): FrontendSystemConfig => {
  const themeSkinEnabled = normalizeBoolean(
    (source as any).EnableThemeSkinFeature ??
      source.EnableThemeManagement ??
      source.EnableLoginThemeSwitcher,
    true,
  );

  return normalizeDebugProtectionPriority({
    themeSkinEnabled,
    themeManagementEnabled: normalizeBoolean(
      source.EnableThemeManagement,
      themeSkinEnabled,
    ),
    loginThemeSwitcherEnabled: normalizeBoolean(
      source.EnableLoginThemeSwitcher,
      themeSkinEnabled,
    ),
    debugProtectionEnabled: normalizeBoolean(
      (source as any).DebugProtectionOpen ?? source.CrashPageOpen,
      true,
    ),
    crashPageOpen: normalizeBoolean((source as any).CrashPageOpen, false),
    loopDebuggerOpen: normalizeBoolean((source as any).LoopDebuggerOpen, false),
    debugOverlayOpen: normalizeBoolean(
      (source as any).DebugOverlayOpen,
      false,
    ),
    debugBypassEnabled: normalizeBoolean(
      (source as any).DebugBypassEnabled,
      true,
    ),
    debugBypassParamName: normalizeString(
      (source as any).DebugBypassParamName,
      DEFAULT_DEBUG_PARAM_NAME,
    ),
    debugBypassSecret: normalizeString((source as any).DebugBypassSecret, ""),
    storageEncode: normalizeBoolean(source.StorageEncode, true),
    fontEncryptionEnabled: normalizeBoolean(
      (source as any).FontEncryptionEnabled,
      false,
    ),
    fontEncryptionApplyGlobal: normalizeBoolean(
      (source as any).FontEncryptionApplyGlobal,
      false,
    ),
    fontEncryptionDisableCopy: normalizeBoolean(
      (source as any).FontEncryptionDisableCopy,
      false,
    ),
    fontEncryptionOcrNoise: normalizeBoolean(
      (source as any).FontEncryptionOcrNoise,
      false,
    ),
    fontEncryptionOcrNoiseLevel: normalizeNoiseLevel(
      (source as any).FontEncryptionOcrNoiseLevel,
    ),
  });
};

export const normalizeFrontendSystemConfig = (
  value: Partial<FrontendSystemConfig> | Record<string, unknown> | undefined,
  baseConfig: Partial<PlatformConfigs> = {},
): FrontendSystemConfig => {
  const defaults = resolveFrontendSystemDefaults(baseConfig);
  const source = value ?? {};

  return normalizeDebugProtectionPriority({
    themeSkinEnabled: normalizeBoolean(source.themeSkinEnabled, defaults.themeSkinEnabled),
    themeManagementEnabled: normalizeBoolean(
      source.themeManagementEnabled,
      defaults.themeManagementEnabled,
    ),
    loginThemeSwitcherEnabled: normalizeBoolean(
      source.loginThemeSwitcherEnabled,
      defaults.loginThemeSwitcherEnabled,
    ),
    debugProtectionEnabled: normalizeBoolean(
      source.debugProtectionEnabled,
      defaults.debugProtectionEnabled,
    ),
    crashPageOpen: normalizeBoolean(source.crashPageOpen, defaults.crashPageOpen),
    loopDebuggerOpen: normalizeBoolean(
      source.loopDebuggerOpen,
      defaults.loopDebuggerOpen,
    ),
    debugOverlayOpen: normalizeBoolean(
      source.debugOverlayOpen,
      defaults.debugOverlayOpen,
    ),
    debugBypassEnabled: normalizeBoolean(
      source.debugBypassEnabled,
      defaults.debugBypassEnabled,
    ),
    debugBypassParamName: normalizeString(
      source.debugBypassParamName,
      defaults.debugBypassParamName,
    ),
    debugBypassSecret: normalizeString(
      source.debugBypassSecret,
      defaults.debugBypassSecret,
    ),
    storageEncode: normalizeBoolean(source.storageEncode, defaults.storageEncode),
    fontEncryptionEnabled: normalizeBoolean(
      source.fontEncryptionEnabled,
      defaults.fontEncryptionEnabled,
    ),
    fontEncryptionApplyGlobal: normalizeBoolean(
      source.fontEncryptionApplyGlobal,
      defaults.fontEncryptionApplyGlobal,
    ),
    fontEncryptionDisableCopy: normalizeBoolean(
      source.fontEncryptionDisableCopy,
      defaults.fontEncryptionDisableCopy,
    ),
    fontEncryptionOcrNoise: normalizeBoolean(
      source.fontEncryptionOcrNoise,
      defaults.fontEncryptionOcrNoise,
    ),
    fontEncryptionOcrNoiseLevel: normalizeNoiseLevel(
      source.fontEncryptionOcrNoiseLevel,
      defaults.fontEncryptionOcrNoiseLevel,
    ),
  });
};

export const getFrontendSystemConfig = (
  baseConfig: Partial<PlatformConfigs> = {},
): FrontendSystemConfig => {
  return normalizeFrontendSystemConfig(readStoredObject(), baseConfig);
};

export const saveFrontendSystemConfig = (
  value: Partial<FrontendSystemConfig>,
  baseConfig: Partial<PlatformConfigs> = {},
): FrontendSystemConfig => {
  const nextConfig = normalizeFrontendSystemConfig(
    {
      ...getFrontendSystemConfig(baseConfig),
      ...value,
    },
    baseConfig,
  );

  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
  }

  emitFrontendSystemConfigChange(nextConfig);

  return nextConfig;
};

export const resetFrontendSystemConfig = (
  baseConfig: Partial<PlatformConfigs> = {},
): FrontendSystemConfig => {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const nextConfig = resolveFrontendSystemDefaults(baseConfig);
  emitFrontendSystemConfigChange(nextConfig);
  return nextConfig;
};

export const buildFrontendSystemConfigOverrides = (
  value: FrontendSystemConfig,
): Record<string, unknown> => {
  return {
    EnableThemeSkinFeature: value.themeSkinEnabled,
    EnableThemeManagement: value.themeManagementEnabled,
    EnableLoginThemeSwitcher: value.loginThemeSwitcherEnabled,
    DebugProtectionOpen: value.debugProtectionEnabled,
    CrashPageOpen: value.crashPageOpen,
    LoopDebuggerOpen: value.loopDebuggerOpen,
    DebugOverlayOpen: value.debugOverlayOpen,
    DebugBypassEnabled: value.debugBypassEnabled,
    DebugBypassParamName: value.debugBypassParamName,
    DebugBypassSecret: value.debugBypassSecret,
    StorageEncode: value.storageEncode,
    FontEncryptionEnabled: value.fontEncryptionEnabled,
    FontEncryptionApplyGlobal: value.fontEncryptionApplyGlobal,
    FontEncryptionDisableCopy: value.fontEncryptionDisableCopy,
    FontEncryptionOcrNoise: value.fontEncryptionOcrNoise,
    FontEncryptionOcrNoiseLevel: value.fontEncryptionOcrNoiseLevel,
  };
};

export const applyFrontendSystemConfigOverrides = (
  applyConfig: (value: Record<string, unknown>) => void,
  baseConfig: Partial<PlatformConfigs> = {},
): FrontendSystemConfig => {
  const frontendSystemConfig = getFrontendSystemConfig(baseConfig);
  applyConfig(buildFrontendSystemConfigOverrides(frontendSystemConfig));
  return frontendSystemConfig;
};

export const isThemeSkinFeatureVisible = (
  value: FrontendSystemConfig,
): boolean => {
  return isDevEnvironment() || value.themeSkinEnabled;
};

export const isThemeManagementVisible = (
  value: FrontendSystemConfig,
): boolean => {
  return isDevEnvironment() || (value.themeSkinEnabled && value.themeManagementEnabled);
};

export const isLoginThemeSwitcherVisible = (
  value: FrontendSystemConfig,
): boolean => {
  return isDevEnvironment() || (value.themeSkinEnabled && value.loginThemeSwitcherEnabled);
};

export const canManageFrontendSystemConfig = (
  roles: Array<string> = [],
): boolean => {
  if (isDevEnvironment()) {
    return true;
  }

  return roles.some((role) => {
    const normalized = String(role || "").trim().toLowerCase();
    return normalized === "super_admin" || normalized === "superadmin";
  });
};

export const isDebugBypassActive = (
  value: FrontendSystemConfig,
  search = typeof window !== "undefined" ? window.location.search : "",
): boolean => {
  if (!value.debugBypassEnabled) {
    return false;
  }

  try {
    const params = new URLSearchParams(search || "");
    const currentValue = params.get(value.debugBypassParamName);
    if (currentValue == null) {
      return false;
    }

    if (!value.debugBypassSecret) {
      return true;
    }

    return currentValue === value.debugBypassSecret;
  } catch {
    return false;
  }
};

export const FRONTEND_SYSTEM_STORAGE_KEY = STORAGE_KEY;
export const FRONTEND_SYSTEM_CONFIG_CHANGE_EVENT = STORAGE_CHANGE_EVENT;
export const FRONTEND_THEME_CONFIG_KEYS = THEME_SKIN_CONFIG_KEYS;
export const FRONTEND_DEBUG_CONFIG_KEYS = DEBUG_CONFIG_KEYS;
export const FRONTEND_FONT_CONFIG_KEYS = FONT_CONFIG_KEYS;
