import {
  buildFrontendSystemConfigOverrides,
  getFrontendSystemConfig,
  getInitialConfig,
  isDevEnvironment,
  isDebugBypassActive,
  setConfig,
  type FrontendSystemConfig,
  type PlatformConfigs,
} from "@repo/config";
import {
  crashDebugger,
  loopDebugger,
  redirectDebugger,
  stopCrashDebugger,
  stopLoopDebugger,
  stopRedirectDebugger,
} from "@repo/utils";

const resolveFontEncryptionOptions = (config: FrontendSystemConfig) => {
  return {
    enabled: config.fontEncryptionEnabled,
    applyGlobal: config.fontEncryptionApplyGlobal,
    disableCopy: config.fontEncryptionDisableCopy,
    ocrNoise: config.fontEncryptionOcrNoise
      ? { level: config.fontEncryptionOcrNoiseLevel }
      : false,
  };
};

export const getFrontendSystemRuntimeConfig = (
  baseConfig: Partial<PlatformConfigs> = getInitialConfig(),
): FrontendSystemConfig => {
  return getFrontendSystemConfig(baseConfig);
};

export const getFrontendFontEncryptionOptions = (
  baseConfig: Partial<PlatformConfigs> = getInitialConfig(),
) => {
  return resolveFontEncryptionOptions(getFrontendSystemRuntimeConfig(baseConfig));
};

export const syncFrontendSystemRuntime = async (
  baseConfig: Partial<PlatformConfigs> = getInitialConfig(),
): Promise<FrontendSystemConfig> => {
  const frontendSystemConfig = getFrontendSystemRuntimeConfig(baseConfig);
  const overrides = buildFrontendSystemConfigOverrides(frontendSystemConfig);
  const shouldEnableDebugProtection =
    !isDevEnvironment() &&
    frontendSystemConfig.debugProtectionEnabled &&
    !isDebugBypassActive(frontendSystemConfig);

  setConfig(overrides);

  stopCrashDebugger();
  stopLoopDebugger();
  stopRedirectDebugger();

  if (shouldEnableDebugProtection) {
    if (frontendSystemConfig.crashPageOpen) {
      crashDebugger();
    } else if (frontendSystemConfig.loopDebuggerOpen) {
      loopDebugger();
    } else if (frontendSystemConfig.debugOverlayOpen) {
      redirectDebugger();
    }
  }

  const { initFontEncryption } = await import("@layout/default");
  initFontEncryption(resolveFontEncryptionOptions(frontendSystemConfig));

  return frontendSystemConfig;
};
