import { getConfig } from "@repo/config";
import { useGlobal } from "@pureadmin/utils";
import { inject, provide, type InjectionKey } from "vue";
import { emitter } from "@repo/core";
import { useLayoutConfig } from "../../hooks/useLayoutConfig";

export type AiSupportSource =
  | "provider"
  | "browser"
  | "backend"
  | "settings";

export interface AiSupportResult {
  available: boolean;
  source: AiSupportSource;
  reason: string;
  browserSupported: boolean;
  backendUrl?: string;
}

export interface AiSupportProvider {
  resolveAvailability(): Promise<AiSupportResult>;
  openSettings(): void;
  updateBrowserSupport(supported: boolean): void;
}

export const AiSupportProviderKey: InjectionKey<AiSupportProvider> =
  Symbol("AiSupportProvider");

const resolveBaseUrl = () =>
  String(getConfig("ApiAddress") || getConfig("BaseUrl") || "").replace(/\/$/, "");

const createAiSupportProvider = (): AiSupportProvider => {
  const { $storage } = useGlobal<GlobalPropertiesApi>();
  const { updateConfig } = useLayoutConfig();

  const updateBrowserSupport = (supported: boolean) => {
    updateConfig("browserAiSupported", supported);
  };

  const openSettings = () => {
    emitter.emit("openPanel");
  };

  const resolveStoredSettings = (): AiSupportResult => {
    const configure = $storage?.configure || {};
    const aiEnabled = configure.aiChatEnabled !== false;
    const aiMode = String(configure.aiChatMode || "").trim() || "vendor";
    const aiUrl = String(configure.aiChatApiUrl || "").trim();
    const browserAiAvailable =
      aiMode === "chrome"
        ? Boolean((window as any).ai?.languageModel)
        : aiMode === "webllm"
          ? true
          : Boolean(aiEnabled && aiUrl);

    if (browserAiAvailable) {
      return {
        available: true,
        source: aiMode === "vendor" ? "settings" : "provider",
        reason: "",
        browserSupported: true,
      };
    }

    return {
      available: false,
      source: "settings",
      reason:
        configure.aiChatEnabled === false
          ? "系统设置中的 AI 能力未开启"
          : aiMode === "vendor"
            ? "系统设置未配置 AI 服务器地址"
            : "当前浏览器未提供可用 AI 能力",
      browserSupported: false,
    };
  };

  const probeBackend = async (): Promise<AiSupportResult | null> => {
    const baseUrl = resolveBaseUrl();
    if (!baseUrl) {
      return null;
    }
    try {
      const response = await fetch(`${baseUrl}/server/capabilities`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        return null;
      }
      const payload = await response.json().catch(() => ({}));
      const data =
        payload && typeof payload === "object" && "data" in payload
          ? (payload.data as Record<string, unknown>)
          : (payload as Record<string, unknown>);
      if (!data?.aiEnabled) {
        return null;
      }
      updateBrowserSupport(true);
      return {
        available: true,
        source: "backend",
        reason: "",
        browserSupported: true,
        backendUrl: baseUrl,
      };
    } catch {
      return null;
    }
  };

  return {
    async resolveAvailability() {
      const stored = resolveStoredSettings();
      if (stored.available) {
        updateBrowserSupport(true);
        return stored;
      }
      const backend = await probeBackend();
      if (backend) {
        return backend;
      }
      updateBrowserSupport(false);
      return stored;
    },
    openSettings,
    updateBrowserSupport,
  };
};

export const provideAiSupport = () => {
  const provider = createAiSupportProvider();
  provide(AiSupportProviderKey, provider);
  return provider;
};

export const useAiSupport = () =>
  inject(AiSupportProviderKey, createAiSupportProvider());
