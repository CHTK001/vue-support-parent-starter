/**
 * IndexedDB 存储工具
 * 用于持久化 API 文档相关配置和数据
 */

const DB_NAME = "api_doc_storage";
const DB_VERSION = 1;

// 存储表名
export const STORE_NAMES = {
  /** 全局配置 */
  CONFIG: "config",
  /** 请求历史 */
  HISTORY: "history",
  /** 全局请求头 */
  HEADERS: "headers",
  /** 收藏的 API */
  FAVORITES: "favorites",
  /** Mock 规则 */
  MOCK_RULES: "mock_rules",
} as const;

/** 请求历史记录 */
export interface ApiHistoryRecord {
  id?: number;
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** 请求 URL */
  url: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数 */
  params?: Record<string, string>;
  /** 请求体 */
  requestBody?: string;
  /** 响应状态码 */
  statusCode?: number;
  /** 响应数据 */
  responseData?: any;
  /** 请求耗时 */
  duration?: number;
  /** 创建时间 */
  createdAt: number;
}

/** 配置项 */
export interface ConfigItem {
  key: string;
  value: any;
  updatedAt: number;
}

/** Mock 规则 */
export interface MockRule {
  id?: number;
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** 是否启用 */
  enabled: boolean;
  /** 响应状态码 */
  statusCode: number;
  /** 响应延迟(ms) */
  delay: number;
  /** Mock 数据 */
  responseData: any;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * 打开数据库连接
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建配置存储
      if (!db.objectStoreNames.contains(STORE_NAMES.CONFIG)) {
        db.createObjectStore(STORE_NAMES.CONFIG, { keyPath: "key" });
      }

      // 创建历史记录存储
      if (!db.objectStoreNames.contains(STORE_NAMES.HISTORY)) {
        const historyStore = db.createObjectStore(STORE_NAMES.HISTORY, {
          keyPath: "id",
          autoIncrement: true,
        });
        historyStore.createIndex("path", "path", { unique: false });
        historyStore.createIndex("method", "method", { unique: false });
        historyStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // 创建请求头存储
      if (!db.objectStoreNames.contains(STORE_NAMES.HEADERS)) {
        db.createObjectStore(STORE_NAMES.HEADERS, { keyPath: "key" });
      }

      // 创建收藏存储
      if (!db.objectStoreNames.contains(STORE_NAMES.FAVORITES)) {
        const favStore = db.createObjectStore(STORE_NAMES.FAVORITES, {
          keyPath: "id",
          autoIncrement: true,
        });
        favStore.createIndex("path_method", ["path", "method"], { unique: true });
      }

      // 创建 Mock 规则存储
      if (!db.objectStoreNames.contains(STORE_NAMES.MOCK_RULES)) {
        const mockStore = db.createObjectStore(STORE_NAMES.MOCK_RULES, {
          keyPath: "id",
          autoIncrement: true,
        });
        mockStore.createIndex("path_method", ["path", "method"], { unique: true });
      }
    };
  });
};

/**
 * 获取事务
 */
const getTransaction = async (
  storeName: string,
  mode: IDBTransactionMode = "readonly"
): Promise<IDBObjectStore> => {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

/**
 * 存储工具类
 */
export const DocStorage = {
  // ========== 节点隔离存储 ==========

  /**
   * 获取节点隔离的存储键
   */
  getNodeKey(nodeId: string, key: string): string {
    return `node_${nodeId}_${key}`;
  },

  /**
   * 获取节点配置
   */
  async getNodeConfig<T = any>(nodeId: string, key: string): Promise<T | null> {
    return this.getConfig<T>(this.getNodeKey(nodeId, key));
  },

  /**
   * 设置节点配置
   */
  async setNodeConfig(nodeId: string, key: string, value: any): Promise<void> {
    return this.setConfig(this.getNodeKey(nodeId, key), value);
  },

  /**
   * 删除节点配置
   */
  async deleteNodeConfig(nodeId: string, key: string): Promise<void> {
    return this.deleteConfig(this.getNodeKey(nodeId, key));
  },

  /**
   * 获取节点的全局请求头
   */
  async getNodeHeaders(nodeId: string): Promise<Record<string, string>> {
    return this.getNodeConfig<Record<string, string>>(nodeId, "headers") || {};
  },

  /**
   * 保存节点的全局请求头
   */
  async saveNodeHeaders(nodeId: string, headers: Record<string, string>): Promise<void> {
    return this.setNodeConfig(nodeId, "headers", headers);
  },

  /**
   * 获取节点的历史记录
   */
  async getNodeHistory(nodeId: string, limit = 100): Promise<ApiHistoryRecord[]> {
    const allHistory = await this.getHistoryList(limit * 2);
    return allHistory.filter((h) => h.url?.includes(nodeId) || true).slice(0, limit);
  },

  // ========== 配置操作 ==========

  /**
   * 获取配置
   */
  async getConfig<T = any>(key: string): Promise<T | null> {
    try {
      const store = await getTransaction(STORE_NAMES.CONFIG);
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          resolve(request.result?.value ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get config:", error);
      return null;
    }
  },

  /**
   * 设置配置
   */
  async setConfig(key: string, value: any): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.CONFIG, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.put({
          key,
          value,
          updatedAt: Date.now(),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to set config:", error);
    }
  },

  /**
   * 删除配置
   */
  async deleteConfig(key: string): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.CONFIG, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to delete config:", error);
    }
  },

  // ========== 历史记录操作 ==========

  /**
   * 添加历史记录
   */
  async addHistory(record: Omit<ApiHistoryRecord, "id">): Promise<number> {
    try {
      const store = await getTransaction(STORE_NAMES.HISTORY, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.add({
          ...record,
          createdAt: record.createdAt || Date.now(),
        });
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to add history:", error);
      return -1;
    }
  },

  /**
   * 获取历史记录列表
   */
  async getHistoryList(limit = 100): Promise<ApiHistoryRecord[]> {
    try {
      const store = await getTransaction(STORE_NAMES.HISTORY);
      return new Promise((resolve, reject) => {
        const index = store.index("createdAt");
        const request = index.openCursor(null, "prev");
        const results: ApiHistoryRecord[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get history list:", error);
      return [];
    }
  },

  /**
   * 按路径搜索历史记录
   */
  async searchHistory(path: string, limit = 20): Promise<ApiHistoryRecord[]> {
    try {
      const store = await getTransaction(STORE_NAMES.HISTORY);
      return new Promise((resolve, reject) => {
        const index = store.index("path");
        const range = IDBKeyRange.only(path);
        const request = index.openCursor(range, "prev");
        const results: ApiHistoryRecord[] = [];

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to search history:", error);
      return [];
    }
  },

  /**
   * 删除历史记录
   */
  async deleteHistory(id: number): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.HISTORY, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to delete history:", error);
    }
  },

  /**
   * 清空历史记录
   */
  async clearHistory(): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.HISTORY, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  },

  // ========== 全局请求头操作 ==========

  /**
   * 获取全局请求头
   */
  async getGlobalHeaders(): Promise<Record<string, string>> {
    try {
      const store = await getTransaction(STORE_NAMES.HEADERS);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const headers: Record<string, string> = {};
          request.result.forEach((item: any) => {
            if (item.enabled !== false) {
              headers[item.key] = item.value;
            }
          });
          resolve(headers);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get global headers:", error);
      return {};
    }
  },

  /**
   * 获取全局请求头列表（包含启用状态）
   */
  async getGlobalHeadersList(): Promise<Array<{ key: string; value: string; enabled: boolean }>> {
    try {
      const store = await getTransaction(STORE_NAMES.HEADERS);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(
            request.result.map((item: any) => ({
              key: item.key,
              value: item.value,
              enabled: item.enabled !== false,
            }))
          );
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get global headers list:", error);
      return [];
    }
  },

  /**
   * 设置全局请求头
   */
  async setGlobalHeader(key: string, value: string, enabled = true): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.HEADERS, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.put({ key, value, enabled, updatedAt: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to set global header:", error);
    }
  },

  /**
   * 批量保存全局请求头
   */
  async saveGlobalHeaders(
    headers: Array<{ key: string; value: string; enabled?: boolean }>
  ): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.HEADERS, "readwrite");
      // 先清空
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });
      // 再添加
      for (const header of headers) {
        if (header.key) {
          store.put({
            key: header.key,
            value: header.value,
            enabled: header.enabled !== false,
            updatedAt: Date.now(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to save global headers:", error);
    }
  },

  /**
   * 删除全局请求头
   */
  async deleteGlobalHeader(key: string): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.HEADERS, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to delete global header:", error);
    }
  },

  // ========== Mock 规则操作 ==========

  /**
   * 获取 Mock 规则列表
   */
  async getMockRules(): Promise<MockRule[]> {
    try {
      const store = await getTransaction(STORE_NAMES.MOCK_RULES);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get mock rules:", error);
      return [];
    }
  },

  /**
   * 获取单个 Mock 规则
   */
  async getMockRule(path: string, method: string): Promise<MockRule | null> {
    try {
      const store = await getTransaction(STORE_NAMES.MOCK_RULES);
      return new Promise((resolve, reject) => {
        const index = store.index("path_method");
        const request = index.get([path, method]);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get mock rule:", error);
      return null;
    }
  },

  /**
   * 保存 Mock 规则
   */
  async saveMockRule(rule: Omit<MockRule, "id" | "createdAt" | "updatedAt">): Promise<number> {
    try {
      const store = await getTransaction(STORE_NAMES.MOCK_RULES, "readwrite");
      const now = Date.now();

      // 检查是否已存在
      const existing = await this.getMockRule(rule.path, rule.method);

      return new Promise((resolve, reject) => {
        const data = {
          ...rule,
          id: existing?.id,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };

        const request = existing ? store.put(data) : store.add(data);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to save mock rule:", error);
      return -1;
    }
  },

  /**
   * 删除 Mock 规则
   */
  async deleteMockRule(id: number): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.MOCK_RULES, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to delete mock rule:", error);
    }
  },

  /**
   * 切换 Mock 规则启用状态
   */
  async toggleMockRule(id: number, enabled: boolean): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.MOCK_RULES, "readwrite");
      return new Promise((resolve, reject) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const data = { ...getRequest.result, enabled, updatedAt: Date.now() };
            const putRequest = store.put(data);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error("Failed to toggle mock rule:", error);
    }
  },

  // ========== 收藏操作 ==========

  /**
   * 获取收藏列表
   */
  async getFavorites(): Promise<Array<{ path: string; method: string; name?: string }>> {
    try {
      const store = await getTransaction(STORE_NAMES.FAVORITES);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get favorites:", error);
      return [];
    }
  },

  /**
   * 添加收藏
   */
  async addFavorite(path: string, method: string, name?: string): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.FAVORITES, "readwrite");
      return new Promise((resolve, reject) => {
        const request = store.add({ path, method, name, createdAt: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => {
          // 可能已存在，忽略错误
          resolve();
        };
      });
    } catch (error) {
      console.error("Failed to add favorite:", error);
    }
  },

  /**
   * 移除收藏
   */
  async removeFavorite(path: string, method: string): Promise<void> {
    try {
      const store = await getTransaction(STORE_NAMES.FAVORITES, "readwrite");
      const index = store.index("path_method");
      return new Promise((resolve, reject) => {
        const getRequest = index.getKey([path, method]);
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            const deleteRequest = store.delete(getRequest.result);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          } else {
            resolve();
          }
        };
        getRequest.onerror = () => reject(getRequest.error);
      });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  },

  /**
   * 检查是否已收藏
   */
  async isFavorite(path: string, method: string): Promise<boolean> {
    try {
      const store = await getTransaction(STORE_NAMES.FAVORITES);
      const index = store.index("path_method");
      return new Promise((resolve, reject) => {
        const request = index.get([path, method]);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to check favorite:", error);
      return false;
    }
  },
};

export default DocStorage;
