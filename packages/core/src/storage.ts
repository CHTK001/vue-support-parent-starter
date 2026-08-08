/**
 * 全局 storage 访问器（@repo/core）
 *
 * 由 createApp 构建后通过 setAppStorage 注入带 AES 加密的 StorageWrapper。
 * 业务组件可用 getAppStorage() 读取，保证与 app 存储一致的加密/命名空间。
 */
import type { StorageWrapper } from "@repo/utils";

let storageInstance: StorageWrapper | null = null;

/** 注入 storage 实例（createApp 构建后调用） */
export function setAppStorage(storage: StorageWrapper): void {
  storageInstance = storage;
}

/** 获取 storage 实例；未注入时抛错 */
export function getAppStorage(): StorageWrapper {
  if (!storageInstance) {
    throw new Error("[core] storage 未注入，请先调用 setAppStorage()");
  }
  return storageInstance;
}

/** 简写别名 */
export function storage(): StorageWrapper {
  return getAppStorage();
}