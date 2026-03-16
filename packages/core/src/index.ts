import type { App } from "vue";
import { createPinia } from "pinia";
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };

// 应用启动器
export {
  createAppBootstrap,
  quickBootstrap,
  AppBootstrap,
} from "./app-bootstrap";
export type { BootstrapOptions } from "./app-bootstrap";

// 标准应用启动器（依赖较多，建议按需引入）
export { createStandardApp } from "./standard-app";
export type { StandardAppOptions, FontEncryptionOptions } from "./standard-app";

// Socket 服务
export {
  createSocketService,
  createWebSocketService,
  createSocketIOService,
  createRSocketService,
  createSseService,
  initGlobalSocketService,
  getGlobalSocketService,
  useSocketService,
  closeGlobalSocketService,
  createNamedSocketService,
  getNamedSocketService,
  closeNamedSocketService,
  setGlobalSocketConfig,
  getGlobalSocketConfig,
} from "./config/socketService";
export type {
  SocketServiceConfig,
  ProtocolType,
} from "./config/socketService";
export type { SocketTemplate, SocketMessage, WsMessage } from "./config/socketTemplate";
