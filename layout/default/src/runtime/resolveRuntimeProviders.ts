import {
  SocketTemplateKey,
  createNamedSocketService,
  getGlobalSocketConfig,
  getGlobalSocketService,
  type SocketTemplate,
} from "@repo/core";
import { message } from "@repo/utils";
import { getCurrentInstance, inject } from "vue";
import {
  taskCenterProvider,
  tryUseTaskCenter,
  type TaskCenterProvider,
} from "../components/lay-task-center/provider";
import {
  tryUseMessageCenter,
  type MessageCenterProvider,
} from "../components/lay-message/provider";
import { ensureStandaloneOverlayHost } from "./ensureStandaloneOverlayHost";

export type RuntimeProviderSource =
  | "lay-xx"
  | "@repo/core"
  | "@repo/core-named"
  | "fallback";

export interface RuntimeProviderLog {
  module?: string;
  socketSource: RuntimeProviderSource;
  messageSource: RuntimeProviderSource;
  taskSource: RuntimeProviderSource;
}

export interface RuntimeProviderResolverOptions {
  module?: string;
  log?: boolean;
  socketName?: string;
  createSocketIfMissing?: boolean;
  ensureStandaloneOverlayHost?: boolean;
}

export interface RuntimeProviders {
  socket: {
    source: RuntimeProviderSource;
    provider: SocketTemplate | null;
  };
  message: {
    source: RuntimeProviderSource;
    provider: MessageCenterProvider;
  };
  task: {
    source: RuntimeProviderSource;
    provider: TaskCenterProvider;
  };
  log: RuntimeProviderLog;
}

const createFallbackMessageProvider = (): MessageCenterProvider => ({
  notify(input) {
    message(input.content, { type: input.level || "info" });
  },
  success(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "success",
    });
  },
  warning(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "warning",
    });
  },
  info(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "info",
    });
  },
  error(content, input = {}) {
    this.notify({
      ...input,
      content,
      level: "error",
    });
  },
});

/**
 * 统一解析运行时 Provider：
 * lay-xx provider -> @repo/core -> 本地兜底。
 */
export const resolveRuntimeProviders = (
  options: RuntimeProviderResolverOptions = {},
): RuntimeProviders => {
  const currentInstance = getCurrentInstance();
  const socketName = options.socketName || "runtime-fallback";

  const injectedSocket = inject<SocketTemplate | null>(SocketTemplateKey, null);
  const globalSocket = getGlobalSocketService();
  let socketProvider = injectedSocket || globalSocket;
  let socketSource: RuntimeProviderSource = injectedSocket
    ? "lay-xx"
    : globalSocket
      ? "@repo/core"
      : "fallback";

  // 没有可用 socket 时，尝试使用 @repo/core 创建命名实例兜底。
  if (!socketProvider && options.createSocketIfMissing !== false) {
    const config = getGlobalSocketConfig();
    if (config.urls.length) {
      socketProvider = createNamedSocketService(socketName, {
        protocol: config.protocol,
        urls: config.urls,
        context: config.context,
        autoConnect: false,
      });
      socketSource = "@repo/core-named";
    }
  }

  const injectedMessage = tryUseMessageCenter();
  const messageProvider = injectedMessage || createFallbackMessageProvider();
  const messageSource: RuntimeProviderSource = injectedMessage
    ? "lay-xx"
    : "fallback";

  const injectedTask = tryUseTaskCenter();
  const taskProvider = injectedTask || taskCenterProvider;
  const taskSource: RuntimeProviderSource = injectedTask ? "lay-xx" : "fallback";

  if (!injectedTask && options.ensureStandaloneOverlayHost !== false) {
    ensureStandaloneOverlayHost(currentInstance?.appContext || null);
  }

  const runtimeLog: RuntimeProviderLog = {
    module: options.module,
    socketSource,
    messageSource,
    taskSource,
  };

  if (options.log !== false) {
    console.info(
      `[RuntimeProviders] module=${runtimeLog.module || "-"} socket=${socketSource} message=${messageSource} task=${taskSource}`,
    );
  }

  return {
    socket: {
      source: socketSource,
      provider: socketProvider,
    },
    message: {
      source: messageSource,
      provider: messageProvider,
    },
    task: {
      source: taskSource,
      provider: taskProvider,
    },
    log: runtimeLog,
  };
};
