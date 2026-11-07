/**
 * IndexedDB 存储工具 —— 轻量 Promise 封装
 *
 * 与 storage.ts 的 StorageWrapper 保持类似的 key-value 风格 API。
 * 持久化能力通常用作较大或长期保留的数据（日历事件、离线草稿等）。
 *
 * 数据库模型：
 *   - 默认数据库：koi-home-db
 *   - 内部按「store 名」分表（createObjectStore）
 *   - 每个 store 的主键默认 "id"（调用方在 put 时提供）
 *
 * 特性：
 *   - 自动处理浏览器兼容（不存在 indexedDB 时返回 noop stub）
 *   - 同一 store 共享一个连接（重入时复用）
 *   - 提供 Promise 风格的 get / set / remove / keys / clear
 */
export interface IndexedDBLike {
  open(
    name: string,
    version?: number,
  ): IDBOpenDBRequest;
  deleteDatabase(name: string): void;
}

export interface IndexedDBStoreOptions {
  /** 数据库名，默认 koi-home-db */
  dbName?: string;
  /** Object store 名，默认 "default" */
  storeName?: string;
  /** 主键字段名，默认 "id" */
  keyPath?: string;
  /** 首次创建时的初始版本（用于 store 建表） */
  version?: number;
}

/**
 * 记录约束：只要求有主键字段。
 *
 * <p>此前这里带了一个索引签名 {@code [key: string]: unknown}，但它并不被任何实现用到
 * —— {@link IndexedDBStore.put} / {@link IndexedDBStore.putAll} 都是把值原样交给原生
 * {@code store.put()}（形参类型 any），{@code get/getAll} 只是把 T 当取值泛型。</p>
 *
 * <p>索引签名放在泛型约束上是 TS 反模式：它要求所有实现者都能当
 * {@code Record<string, unknown>} 用，于是 home 模块的 5 个模型
 * （Alarm / Bookmark / CalendarEvent / Note / QuickItem）虽然都有 id，却因为没有索引签名
 * 而全部不满足约束，凭空报出 12 个 "does not satisfy the constraint 'WithId'"。约束只需主键。*/
interface WithId {
  id: string | number;
}

const DEFAULT_DB = "koi-home-db";
const DEFAULT_STORE = "default";

/** 全局连接缓存 */
const connectionCache = new Map<string, Promise<IDBDatabase>>();

function getIndexedDB(): IndexedDBLike | null {
  if (typeof window === "undefined") return null;
  return window.indexedDB ?? null;
}

function openDb(dbName: string, storeName: string, keyPath: string, version: number): Promise<IDBDatabase> {
  const cacheKey = `${dbName}@${storeName}@${keyPath}@${version}`;
  const cached = connectionCache.get(cacheKey);
  if (cached) return cached;

  const idb = getIndexedDB();
  if (!idb) {
    return Promise.reject(new Error("[idb] IndexedDB not available"));
  }

  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = idb.open(dbName, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("[idb] open failed"));
  });

  connectionCache.set(cacheKey, promise);
  promise.catch(() => connectionCache.delete(cacheKey));
  return promise;
}

function tx<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const out = fn(store);
      if (out instanceof Promise) {
        out.then(resolve, reject);
        return;
      }
      out.onsuccess = () => resolve(out.result);
      out.onerror = () => reject(out.error ?? new Error("[idb] tx failed"));
    } catch (e) {
      reject(e);
    }
  });
}

/** 通用 IndexedDB 存储（基于 Object Store） */
export class IndexedDBStore {
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly keyPath: string;
  private readonly version: number;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(options: IndexedDBStoreOptions = {}) {
    this.dbName = options.dbName ?? DEFAULT_DB;
    this.storeName = options.storeName ?? DEFAULT_STORE;
    this.keyPath = options.keyPath ?? "id";
    this.version = options.version ?? 1;
  }

  // 暂态故障：第一次打开可能因为索引 DB 被另一个版本变更请求（或删除）挂起而报错
  // `UnknownError: Internal error`。此时必须关掉旧连接、清空共享缓存，否则下一轮
  // `ready()` 直接返回同一个 rejected promise，熔断就成永久故障了。重试机制给三次机会，
  // 每次递增退避，让浏览器有时间恢复。
  private async ready(): Promise<IDBDatabase> {
    let attempt = 0;
    while (true) {
      if (this.dbPromise) return this.dbPromise;
      const cacheKey = `${this.dbName}@${this.storeName}@${this.keyPath}@${this.version}`;
      try {
        this.dbPromise = openDb(this.dbName, this.storeName, this.keyPath, this.version);
        return await this.dbPromise;
      } catch (err) {
        this.dbPromise = null;
        connectionCache.delete(cacheKey);
        if (++attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  /** 写入一条记录（按 keyPath 主键 upsert） */
  async put<T extends WithId>(value: T): Promise<IDBValidKey> {
    const db = await this.ready();
    return tx(db, this.storeName, "readwrite", (store) => store.put(value));
  }

  /** 批量写入 */
  async putAll<T extends WithId>(values: T[]): Promise<void> {
    const db = await this.ready();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(this.storeName, "readwrite");
      const store = transaction.objectStore(this.storeName);
      values.forEach((v) => store.put(v));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("[idb] bulk put failed"));
    });
  }

  /** 按主键读取 */
  async get<T extends WithId = WithId>(id: string | number): Promise<T | null> {
    const db = await this.ready();
    const result = await tx<T | undefined>(db, this.storeName, "readonly", (store) => store.get(id) as IDBRequest<T | undefined>);
    return result ?? null;
  }

  /** 读取全部记录 */
  async getAll<T extends WithId = WithId>(): Promise<T[]> {
    const db = await this.ready();
    return tx<T[]>(db, this.storeName, "readonly", (store) => store.getAll() as IDBRequest<T[]>);
  }

  /** 按主键删除 */
  async remove(id: string | number): Promise<void> {
    const db = await this.ready();
    await tx(db, this.storeName, "readwrite", (store) => store.delete(id));
  }

  /** 清空当前 store */
  async clear(): Promise<void> {
    const db = await this.ready();
    await tx(db, this.storeName, "readwrite", (store) => store.clear());
  }

  /** 当前 store 主键列表 */
  async keys(): Promise<IDBValidKey[]> {
    const db = await this.ready();
    return tx<IDBValidKey[]>(db, this.storeName, "readonly", (store) => store.getAllKeys() as IDBRequest<IDBValidKey[]>);
  }

  /** 关闭并清空连接缓存（要求重新 open） */
  close(): void {
    if (this.dbPromise) {
      this.dbPromise.then((db) => db.close()).catch(() => undefined);
      this.dbPromise = null;
    }
  }
}

/** 便捷工厂：按用户 ID 隔离的日历存储（每个用户独立数据库） */
export function createCalendarStore(userId: string): IndexedDBStore {
  return new IndexedDBStore({
    dbName: `koi-home-calendar-${userId || "anonymous"}`,
    storeName: "events",
    keyPath: "id",
    version: 1,
  });
}

/** 便捷工厂：按用户 ID 隔离的便签存储（每个用户独立数据库） */
export function createNoteStore(userId: string): IndexedDBStore {
  return new IndexedDBStore({
    dbName: `koi-home-note-${userId || "anonymous"}`,
    storeName: "notes",
    keyPath: "id",
    version: 1,
  });
}
