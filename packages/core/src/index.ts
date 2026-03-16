import type { App } from "vue";
import { createPinia } from "pinia";
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };

// 应用启动器（含 createStandardApp，原 standard-app.ts 已合并至此）
export {
  createAppBootstrap,
  quickBootstrap,
  AppBootstrap,
  createStandardApp,
} from "./app-bootstrap";
export type {
  BootstrapOptions,
  StandardAppOptions,
  FontEncryptionOptions,
  WasmMode,
} from "./app-bootstrap";

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
