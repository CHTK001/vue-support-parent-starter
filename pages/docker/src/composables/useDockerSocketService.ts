import { computed, getCurrentScope, onScopeDispose, ref } from "vue";
import { getConfig } from "@repo/config";
import {
  closeNamedSocketService,
  createNamedSocketService,
  getGlobalSocketConfig,
  getNamedSocketService,
  useSocketService,
  type SocketTemplate,
  type WsMessage,
} from "@repo/core";

const DOCKER_SOCKET_NAME = "docker-page-global";

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

const resolveDockerSocketConfig = () => {
  const runtime = getGlobalSocketConfig();
  if (runtime.urls.length > 0) {
    return runtime;
  }

  const config = getConfig() || {};
  const explicitUrls = splitUrls(config.SocketUrl);
  if (explicitUrls.length > 0) {
    return {
      protocol: runtime.protocol || "socketio",
      urls: explicitUrls,
      context: config.SocketPath || runtime.context || "/socket.io",
    };
  }

  const baseUrl =
    resolveOrigin(config.BaseUrl) ||
    resolveOrigin(config.Request?.baseURL);

  return {
    protocol:
      typeof config.SocketProtocol === "string" && config.SocketProtocol.trim()
        ? config.SocketProtocol.trim().toLowerCase()
        : runtime.protocol || "socketio",
    urls: baseUrl ? [baseUrl] : [],
    context: config.SocketPath || runtime.context || "/socket.io",
  };
};

export function useDockerSocketService(preferredSocket?: SocketTemplate | null) {
  const state = ref({
    usingPreferred: Boolean(preferredSocket),
    connected: false,
    error: null as string | null,
  });
  const subscriptions: Array<() => void> = [];

  const getService = (): SocketTemplate | null => {
    if (preferredSocket) {
      state.value.usingPreferred = true;
      state.value.connected = preferredSocket.isConnected;
      state.value.error = null;
      return preferredSocket;
    }

    const globalService = useSocketService();
    if (globalService) {
      state.value.usingPreferred = false;
      state.value.connected = globalService.isConnected;
      state.value.error = null;
      return globalService;
    }

    const existing = getNamedSocketService(DOCKER_SOCKET_NAME);
    if (existing) {
      state.value.usingPreferred = false;
      state.value.connected = existing.isConnected;
      state.value.error = null;
      return existing;
    }

    const config = resolveDockerSocketConfig();
    if (!config.urls.length) {
      state.value.error = "未解析到可用的 Docker Socket 地址";
      return null;
    }

    const service = createNamedSocketService(DOCKER_SOCKET_NAME, {
      protocol: config.protocol,
      urls: config.urls,
      context: config.context,
      autoConnect: false,
    });
    state.value.usingPreferred = false;
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

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearSubscriptions();
      if (!preferredSocket) {
        const named = getNamedSocketService(DOCKER_SOCKET_NAME);
        if (named && !named.isConnected) {
          closeNamedSocketService(DOCKER_SOCKET_NAME);
        }
      }
    });
  }

  return {
    state: computed(() => state.value),
    getService,
    ensureConnected,
    subscribe,
    clearSubscriptions,
  };
}
