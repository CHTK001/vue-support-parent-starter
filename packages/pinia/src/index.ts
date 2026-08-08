/**
 * 通用 pinia 实例（@repo/pinia）
 *
 * 创建 pinia 并启用持久化插件，支持 AES 加密存储。
 * 复用 @repo/utils 的 StorageWrapper（加密 + 命名空间 + 用户隔离），
 * 作为 pinia persist 的全局 storage，调用方无需感知加密。
 */
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { getConfig, getCurrentUserId } from "@repo/config";
import { createStorage, browserLocalStorage } from "@repo/utils";

const cfg = getConfig();
const piniaStorage = createStorage(browserLocalStorage, {
  prefix: cfg.storage?.prefix || cfg.app?.systemCode || "system",
  userScopeKeys: cfg.storage?.userScopeKeys,
  resolveUserId: getCurrentUserId,
});

const pinia = createPinia();
pinia.use(createPersistedState({ storage: piniaStorage }));

export default pinia;

export * from "./init";
export * from "./menuResolver";
export * from "./staticMenu";
export * from "./authRouter";
export { default as useGlobalStore } from "./modules/global";
export { default as useUserStore } from "./modules/user";
export { default as useKeepAliveStore } from "./modules/keepAlive";
export { default as useTabsStore } from "./modules/tabs";
export { default as useAuthStore } from "./modules/auth";
export { default as useMessageStore } from "./modules/message";
export { bindStationMessageSocket } from "./messageSocket";
export type { LanguageType } from "./interface";
