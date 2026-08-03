/**
 * 通用 pinia 实例（@repo/pinia）
 *
 * 创建 pinia 并启用持久化插件，供应用或主题框架统一安装。
 * 迁移自 koi/stores/index.ts，通用化后任何应用 / 主题都可复用。
 */
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

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
