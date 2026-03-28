import { ref, type App } from "vue";
import { getConfig } from "@repo/config";
import {
  GlobalSocketKey,
  getGlobalSocketConfig,
  initGlobalSocketService,
  provideGlobalSocketService,
  getGlobalSocketService,
  useConfigStoreHook,
  type GlobalSocketService,
  type SocketTemplate,
  type SocketTemplateListenOptions,
  type WsMessage,
} from "@repo/core";
import { resolveMonitorGlobalSocketStartupOptions } from "./globalSocket.options";

type MonitorGlobalSocketBridge = SocketTemplate & GlobalSocketService;
type MonitorSocketServiceConfig = {
  protocol: GlobalSocketService["protocol"];
  urls: string[];
  context?: string;
};

interface MonitorGlobalSocketBridgeDeps {
  getGlobalSocketConfig: typeof getGlobalSocketConfig;
  getGlobalSocketService: typeof getGlobalSocketService;
  initGlobalSocketService: typeof initGlobalSocketService;
  getLocalConfig: () => Record<string, any> | null | undefined;
  loadConfig: () => Promise<unknown>;
  onError: (error: unknown) => void;
}

const defaultBridgeDeps = (): MonitorGlobalSocketBridgeDeps => ({
  getGlobalSocketConfig,
  getGlobalSocketService,
  initGlobalSocketService,
  getLocalConfig: () => getConfig(),
  loadConfig: () => useConfigStoreHook().load(),
  onError: (error: unknown) => {
    console.warn(
      "[MonitorGlobalSocketPlugin] 预加载远程 Socket 配置失败",
      error,
    );
  },
});

export const createMonitorGlobalSocketBridge = (
  overrides: Partial<MonitorGlobalSocketBridgeDeps> = {},
): MonitorGlobalSocketBridge => {
  const deps = {
    ...defaultBridgeDeps(),
    ...overrides,
  } satisfies MonitorGlobalSocketBridgeDeps;
  const disconnected = ref(false);
  let bootPromise: Promise<void> | null = null;
  let bridge: MonitorGlobalSocketBridge;
  let pendingTaskId = 0;
  const pendingTasks = new Map<number, (service: SocketTemplate) => void>();
  let allowLocalFallback = deps.getLocalConfig()?.OpenSetting === false;

  const resolveCurrentService = (): SocketTemplate | null => {
    const service = deps.getGlobalSocketService();
    if (!service || service === bridge) {
      return null;
    }
    return service;
  };

  const resolveServiceConfig = (): MonitorSocketServiceConfig | null => {
    const runtimeConfig = deps.getGlobalSocketConfig();
    if (runtimeConfig?.urls?.length) {
      return {
        protocol: runtimeConfig.protocol,
        urls: runtimeConfig.urls,
        context: runtimeConfig.context,
      };
    }

    if (!allowLocalFallback) {
      return null;
    }

    const localOptions = resolveMonitorGlobalSocketStartupOptions(
      deps.getLocalConfig(),
    );
    if (!localOptions.enabled || localOptions.urls.length === 0) {
      return null;
    }

    return {
      protocol: localOptions.protocol,
      urls: localOptions.urls,
      context: localOptions.context,
    };
  };

  const ensureServiceFromConfig = (): SocketTemplate | null => {
    const current = resolveCurrentService();
    if (current) {
      return current;
    }

    const config = resolveServiceConfig();
    if (!config) {
      return null;
    }

    return deps.initGlobalSocketService({
      protocol: config.protocol,
      urls: config.urls,
      context: config.context,
      autoConnect: false,
    });
  };

  const flushPendingTasks = (): void => {
    const service = resolveCurrentService() ?? ensureServiceFromConfig();
    if (!service || pendingTasks.size === 0) {
      return;
    }

    const tasks = Array.from(pendingTasks.values());
    pendingTasks.clear();
    tasks.forEach((task) => task(service));
  };

  const ensureBootstrapped = (): void => {
    if (bootPromise) {
      return;
    }

    bootPromise = Promise.resolve(deps.loadConfig())
      .catch((error) => {
        allowLocalFallback = true;
        deps.onError(error);
      })
      .finally(() => {
        bootPromise = null;
        flushPendingTasks();
      });
  };

  const withService = (
    action: (service: SocketTemplate) => void,
    queueWhenMissing = true,
  ): (() => void) => {
    const service = resolveCurrentService() ?? ensureServiceFromConfig();
    if (service) {
      action(service);
      return () => {};
    }

    ensureBootstrapped();
    if (!queueWhenMissing) {
      return () => {};
    }

    const taskId = ++pendingTaskId;
    pendingTasks.set(taskId, action);
    return () => {
      pendingTasks.delete(taskId);
    };
  };

  bridge = {
    get protocol() {
      return (
        resolveCurrentService()?.protocol ||
        deps.getGlobalSocketConfig().protocol ||
        "socketio"
      );
    },
    get socket() {
      return resolveCurrentService()?.socket ?? null;
    },
    get isConnected() {
      return resolveCurrentService()?.isConnected ?? false;
    },
    get connected() {
      return resolveCurrentService()?.connected ?? disconnected;
    },
    connect() {
      withService((service) => {
        service.connect();
      });
    },
    disconnect() {
      resolveCurrentService()?.disconnect();
    },
    on(
      event: string,
      callback: (data: unknown) => void,
      options?: SocketTemplateListenOptions,
    ) {
      withService((service) => {
        service.on(event, callback, options);
      });
    },
    off(event: string) {
      resolveCurrentService()?.off(event);
    },
    emit(event: string, data?: unknown) {
      withService((service) => {
        service.emit(event, data);
      });
    },
    close() {
      resolveCurrentService()?.close();
    },
    subscribe(module: string, event: string, handler: (msg: WsMessage) => void) {
      let unsubscribe = () => {};
      const cancelPending = withService((service) => {
        unsubscribe = service.subscribe(module, event, handler);
      });

      return () => {
        cancelPending();
        unsubscribe();
      };
    },
  };

  return bridge;
};

export const MonitorGlobalSocketPlugin = {
  install(app: App) {
    const socketService = createMonitorGlobalSocketBridge();
    provideGlobalSocketService(app, socketService);
    app.provide(GlobalSocketKey, socketService);
    void useConfigStoreHook().load();
  },
};
