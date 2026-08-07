/**
 * ReTable 列配置存储适配器
 *
 * 默认实现：localStorage，业务可通过 ReTable props.storage 注入自定义。
 * 注入方式：
 *   <ReTable :storage="myAdapter" />
 *   或全局：app.provide(RE_TABLE_STORAGE_KEY, myAdapter)
 */
import type { ReTableColumnState } from "./types";
import { getStorageKey } from "@repo/config";

/** 存储适配器接口 */
export interface ReTableColumnStorage {
  /** 按 key 读取配置；不存在时返回 undefined */
  get(key: string): ReTableColumnState | undefined;
  /** 写入配置；key 与 tableId 对应 */
  set(key: string, state: ReTableColumnState): void;
  /** 删除配置（用于重置） */
  remove(key: string): void;
}

/** localStorage 默认实现：key 由 getStorageKey 加前缀，避免多 app 串数据 */
function tableKey(tableId: string): string {
  return getStorageKey(`re-table:${tableId}`);
}

/** localStorage 默认实现：读取失败时返回 undefined */
export const localColumnStorage: ReTableColumnStorage = {
  get(key) {
    if (typeof localStorage === "undefined") return undefined;
    try {
      const raw = localStorage.getItem(tableKey(key));
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as ReTableColumnState;
      // 简单校验
      if (!parsed || !Array.isArray(parsed.order)) return undefined;
      return parsed;
    } catch {
      return undefined;
    }
  },
  set(key, state) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(tableKey(key), JSON.stringify(state));
    } catch {
      /* 容量已满或被禁用，忽略 */
    }
  },
  remove(key) {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(tableKey(key));
    } catch {
      /* ignore */
    }
  },
};

/** sessionStorage 实现：会话级存储（同样走统一前缀） */
export const sessionColumnStorage: ReTableColumnStorage = {
  get(key) {
    if (typeof sessionStorage === "undefined") return undefined;
    try {
      const raw = sessionStorage.getItem(tableKey(key));
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as ReTableColumnState;
      if (!parsed || !Array.isArray(parsed.order)) return undefined;
      return parsed;
    } catch {
      return undefined;
    }
  },
  set(key, state) {
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.setItem(tableKey(key), JSON.stringify(state));
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    if (typeof sessionStorage === "undefined") return;
    try {
      sessionStorage.removeItem(tableKey(key));
    } catch {
      /* ignore */
    }
  },
};