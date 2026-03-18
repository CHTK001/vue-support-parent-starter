import type { App } from "vue";
import { createPinia } from "pinia";
const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);
}

export { store };

// Socket 服务
export * from "./config/socket";
export * from "./config/socketService";
export * from "./config/socketTemplate";
export * from "./config/socketTopics";

// 路由
export * from "./router";
export * from "./router/utils";

// Store
export * from "./store";
export * from "./store/modules/AppStore";
export * from "./store/modules/ConfigStore";
export * from "./store/modules/EpThemeStore";
export * from "./store/modules/MultiTagsStore";
export * from "./store/modules/PermissionStore";
export * from "./store/modules/LayoutLayoutStore";
export * from "./store/modules/LayoutStore";
export * from "./store/modules/SettingStore";
export * from "./store/modules/UserStore";
export * from "./store/modules/MessageStore";

// Utils
export * from "./utils/auth";
export * from "./utils/mitt";
export * from "./utils/fingerprintjs2";
export * from "./utils/compatibility";
export * from "./utils/propTypes";

// Directives
export * from "./directives";

// App bootstrap
export * from "./app-bootstrap";

// API
export * from "./api/common/sfc";
export * from "./api/common/user";
export * from "./api/common/dict";
export * from "./api/common/sms";
export * from "./api/common/big-model";
export * from "./api/common/user-log";
export * from "./api/common/totp";
export * from "./api/common/project";
export * from "./api/common/common";
export * from "./api/message";

// Types
export type * from "./utils/propTypes";
export type * from "./types";
export type * from "./store/types";
export type * from "./api/common/user";
export type * from "./api/common/user-log";
export type * from "./api/common/sfc";
