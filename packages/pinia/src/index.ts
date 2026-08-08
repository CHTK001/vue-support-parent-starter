/**
 * 通用 pinia 实例（@repo/pinia）
 *
 * 创建 pinia 并启用持久化插件，支持 AES 加密存储。
 * 复用 @repo/utils 的 StorageWrapper（加密 + 命名空间 + 用户隔离），
 * 作为 pinia persist 的全局 storage，调用方无需感知加密。
 *
 * encode / encodeFn / decodeFn 由 StorageWrapper 内部实时从 getConfig() 读取，
 * 所以该模块被顶层 import 时（cfg 还是默认值）也无所谓：loadConfig 完成后
 * 后续所有 set/get 都自动走 yaml 里配置的最新 encode 规则。
 */
import { createPinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import { getConfig, getCurrentUserId } from "@repo/config";
import { createStorage, browserLocalStorage } from "@repo/utils";

const piniaStorage = createStorage(browserLocalStorage, {
  prefix: getConfig().storage?.prefix || getConfig().app?.systemCode || "system",
  userScopeKeys: getConfig().storage?.userScopeKeys,
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
