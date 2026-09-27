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

/**
 * 真正的加密存储实例，首次读写时才构造。
 *
 * 不能在模块顶层直接调用 createStorage：@repo/utils/storage.ts 静态依赖 @repo/config，
 * 而 config 与 pinia 会被打进同一个 chunk，形成 utils ↔ config-pinia 的静态循环。
 * 生产构建下 pinia 的模块体可能先于 utils 里 `class StorageWrapper` 的求值执行，
 * 此时模块顶层的 createStorage(...) 里 `new StorageWrapper(...)` 会拿到未初始化的类并抛
 *   TypeError: StorageWrapper is not a constructor
 * 开发环境不打包、模块按需逐个求值，顺序恰好正常，所以只在构建产物里复现，
 * 表现为「请求全部 200、没有任何显式报错、页面就是不挂载」。
 */
let realStorage: ReturnType<typeof createStorage> | undefined;

/**
 * 取（并缓存）真正的加密存储实例。
 *
 * 推迟到首次读写时构造，那时所有模块都已求值完毕，不再依赖求值顺序。
 *
 * @returns StorageWrapper 实例
 */
function getPiniaStorage(): ReturnType<typeof createStorage> {
  if (!realStorage) {
    realStorage = createStorage(browserLocalStorage, {
      prefix: getConfig().storage?.prefix || getConfig().app?.systemCode || "system",
      userScopeKeys: getConfig().storage?.userScopeKeys,
      resolveUserId: getCurrentUserId,
    });
  }
  return realStorage;
}

/**
 * 交给 pinia 持久化插件的存储壳：只做转发，模块顶层不触碰 StorageWrapper。
 */
const piniaStorage = {
  /**
   * 读取并解密
   *
   * @param key 键名
   * @returns 明文；不存在时返回 null
   */
  getItem(key: string): string | null {
    return getPiniaStorage().getItem(key);
  },
  /**
   * 加密并写入
   *
   * @param key 键名
   * @param value 明文
   * @returns 无返回值
   */
  setItem(key: string, value: string): void {
    getPiniaStorage().setItem(key, value);
  },
  /**
   * 删除
   *
   * @param key 键名
   * @returns 无返回值
   */
  removeItem(key: string): void {
    getPiniaStorage().removeItem(key);
  },
};

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
