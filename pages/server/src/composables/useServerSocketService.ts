import { computed, onUnmounted, ref } from "vue";
import { getConfig } from "@repo/config";
import {
  closeNamedSocketService,
  createNamedSocketService,
  getGlobalSocketService,
  getGlobalSocketConfig,
  getNamedSocketService,
  type SocketTemplate,
  type WsMessage,
} from "@repo/core";

const SERVER_SOCKET_NAME = "server";

const splitUrls = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
};

const resolveOrigin = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL(value, window.location.origin).origin;
    }
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const resolveServerSocketConfig = () => {
  const runtime = getGlobalSocketConfig();
  const config = getConfig() || {};
  const explicitUrls = splitUrls(config.SocketUrl);
  if (explicitUrls.length > 0) {
    return {
      protocol: runtime.protocol || "socketio",
      urls: explicitUrls,
      context: config.SocketPath || runtime.context || "/socket.io",
    };
  }

  if (runtime.urls.length > 0) {
    return runtime;
  }

  const baseUrl =
    resolveOrigin(config.BaseUrl) ||
    resolveOrigin(config.Request?.baseURL) ||
    (typeof window !== "undefined" ? window.location.origin : null);

  return {
    protocol:
      typeof config.SocketProtocol === "string" && config.SocketProtocol.trim()
        ? config.SocketProtocol.trim().toLowerCase()
        : runtime.protocol || "socketio",
    urls: baseUrl ? [baseUrl] : [],
    context: config.SocketPath || runtime.context || "/socket.io",
  };
};

export function useServerSocketService() {
  const state = ref({
    connected: false,
    error: null as string | null,
  });
  const subscriptions: Array<() => void> = [];

  const getService = (): SocketTemplate | null => {
    const globalService = getGlobalSocketService();
    if (globalService) {
      state.value.connected = globalService.isConnected;
      state.value.error = null;
      return globalService;
    }

    const existing = getNamedSocketService(SERVER_SOCKET_NAME);
    if (existing) {
      state.value.connected = existing.isConnected;
      state.value.error = null;
      return existing;
    }

    const config = resolveServerSocketConfig();
    if (!config.urls.length) {
      state.value.error = "未解析到可用的 Socket 地址";
      return null;
    }

    const service = createNamedSocketService(SERVER_SOCKET_NAME, {
      protocol: config.protocol,
      urls: config.urls,
      context: config.context,
      autoConnect: false,
    });
    state.value.connected = service.isConnected;
    state.value.error = null;
    return service;
  };

  const ensureConnected = (): SocketTemplate | null => {
    const service = getService();
    if (!service) {
      return null;
    }
    if (!service.isConnected) {
      service.connect();
    }
    state.value.connected = service.isConnected || state.value.connected;
    return service;
  };

  const subscribe = (
    module: string,
    event: string,
    handler: (message: WsMessage) => void,
  ) => {
    const service = ensureConnected();
    if (!service) {
      return () => {};
    }
    const unsubscribe = service.subscribe(module, event, handler);
    subscriptions.push(unsubscribe);
    return () => {
      unsubscribe();
      const index = subscriptions.indexOf(unsubscribe);
      if (index >= 0) {
        subscriptions.splice(index, 1);
      }
    };
  };

  const clearSubscriptions = () => {
    while (subscriptions.length) {
      subscriptions.pop()?.();
    }
  };

  onUnmounted(() => {
    clearSubscriptions();
    const service = getNamedSocketService(SERVER_SOCKET_NAME);
    if (service && !service.isConnected) {
      closeNamedSocketService(SERVER_SOCKET_NAME);
    }
  });

  return {
    state: computed(() => state.value),
    getService,
    ensureConnected,
    subscribe,
    clearSubscriptions,
  };
}
