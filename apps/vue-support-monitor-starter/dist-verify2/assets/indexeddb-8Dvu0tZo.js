//#region ../../packages/utils/src/indexeddb.ts
var DEFAULT_DB = "koi-home-db";
var DEFAULT_STORE = "default";
/** 全局连接缓存 */
var connectionCache = /* @__PURE__ */ new Map();
function getIndexedDB() {
	if (typeof window === "undefined") return null;
	return window.indexedDB ?? null;
}
function openDb(dbName, storeName, keyPath, version) {
	const cacheKey = `${dbName}@${storeName}@${keyPath}@${version}`;
	const cached = connectionCache.get(cacheKey);
	if (cached) return cached;
	const idb = getIndexedDB();
	if (!idb) return Promise.reject(/* @__PURE__ */ new Error("[idb] IndexedDB not available"));
	const promise = new Promise((resolve, reject) => {
		const req = idb.open(dbName, version);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error ?? /* @__PURE__ */ new Error("[idb] open failed"));
	});
	connectionCache.set(cacheKey, promise);
	promise.catch(() => connectionCache.delete(cacheKey));
	return promise;
}
function tx(db, storeName, mode, fn) {
	return new Promise((resolve, reject) => {
		try {
			const out = fn(db.transaction(storeName, mode).objectStore(storeName));
			if (out instanceof Promise) {
				out.then(resolve, reject);
				return;
			}
			out.onsuccess = () => resolve(out.result);
			out.onerror = () => reject(out.error ?? /* @__PURE__ */ new Error("[idb] tx failed"));
		} catch (e) {
			reject(e);
		}
	});
}
/** 通用 IndexedDB 存储（基于 Object Store） */
var IndexedDBStore = class {
	dbName;
	storeName;
	keyPath;
	version;
	dbPromise = null;
	constructor(options = {}) {
		this.dbName = options.dbName ?? DEFAULT_DB;
		this.storeName = options.storeName ?? DEFAULT_STORE;
		this.keyPath = options.keyPath ?? "id";
		this.version = options.version ?? 1;
	}
	ready() {
		if (this.dbPromise) return this.dbPromise;
		this.dbPromise = openDb(this.dbName, this.storeName, this.keyPath, this.version);
		return this.dbPromise;
	}
	/** 写入一条记录（按 keyPath 主键 upsert） */
	async put(value) {
		return tx(await this.ready(), this.storeName, "readwrite", (store) => store.put(value));
	}
	/** 批量写入 */
	async putAll(values) {
		const db = await this.ready();
		await new Promise((resolve, reject) => {
			const transaction = db.transaction(this.storeName, "readwrite");
			const store = transaction.objectStore(this.storeName);
			values.forEach((v) => store.put(v));
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error ?? /* @__PURE__ */ new Error("[idb] bulk put failed"));
		});
	}
	/** 按主键读取 */
	async get(id) {
		return await tx(await this.ready(), this.storeName, "readonly", (store) => store.get(id)) ?? null;
	}
	/** 读取全部记录 */
	async getAll() {
		return tx(await this.ready(), this.storeName, "readonly", (store) => store.getAll());
	}
	/** 按主键删除 */
	async remove(id) {
		await tx(await this.ready(), this.storeName, "readwrite", (store) => store.delete(id));
	}
	/** 清空当前 store */
	async clear() {
		await tx(await this.ready(), this.storeName, "readwrite", (store) => store.clear());
	}
	/** 当前 store 主键列表 */
	async keys() {
		return tx(await this.ready(), this.storeName, "readonly", (store) => store.getAllKeys());
	}
	/** 关闭并清空连接缓存（要求重新 open） */
	close() {
		if (this.dbPromise) {
			this.dbPromise.then((db) => db.close()).catch(() => void 0);
			this.dbPromise = null;
		}
	}
};
/** 便捷工厂：按用户 ID 隔离的日历存储（每个用户独立数据库） */
function createCalendarStore(userId) {
	return new IndexedDBStore({
		dbName: `koi-home-calendar-${userId || "anonymous"}`,
		storeName: "events",
		keyPath: "id",
		version: 1
	});
}
/** 便捷工厂：按用户 ID 隔离的便签存储（每个用户独立数据库） */
function createNoteStore(userId) {
	return new IndexedDBStore({
		dbName: `koi-home-note-${userId || "anonymous"}`,
		storeName: "notes",
		keyPath: "id",
		version: 1
	});
}
//#endregion
export { createCalendarStore as n, createNoteStore as r, IndexedDBStore as t };
