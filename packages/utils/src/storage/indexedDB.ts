import { ProxyStorage } from "@pureadmin/utils";
import { responsiveStorageNameSpace } from "@repo/config";
import { getConfig } from "@repo/config";
import * as CryptoJs from "../crypto";
const config = getConfig();

/**
 * IndexedDB存储操作封装，支持异步操作
 */
class IndexedDBStorage {
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly version: number;
  private db: IDBDatabase | null = null;
  private isReady: boolean = false;
  private readyPromise: Promise<void>;
  private readyResolve: () => void;
  private readyReject: (error: Error) => void;

  constructor(dbName: string = 'appDatabase', storeName: string = 'appStore', version: number = 1) {
    this.dbName = getConfig().SystemCode + dbName;
    this.storeName = storeName;
    this.version = version;
    
    // 创建一个Promise，用于表示数据库是否已经准备好
    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    
    // 初始化数据库
    this.init();
  }

  /**
   * 初始化数据库
   */
  private init(): void {
    try {
      // 使用全局window.indexedDB而不是本地变量
      const request = window.indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('IndexedDB打开失败:', event);
        this.readyReject(new Error('无法打开IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isReady = true;
        this.readyResolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 如果存储对象不存在，则创建
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    } catch (error) {
      console.error('IndexedDB初始化失败:', error);
      this.readyReject(error as Error);
    }
  }

  /**
   * 等待数据库准备好
   */
  async waitForReady(): Promise<void> {
    if (this.isReady) return;
    return this.readyPromise;
  }

  /**
   * 获取一个值
   * @param key 键
   * @returns 返回Promise，包含存储的值
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      await this.waitForReady();
      
      if (!key) return null;
      
      const newKey = key.startsWith(responsiveStorageNameSpace()) 
        ? key 
        : getConfig().SystemCode + key;

      return new Promise<T | null>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('数据库未初始化'));
          return;
        }

        const transaction = this.db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(newKey);

        request.onerror = () => {
          reject(new Error(`获取键"${newKey}"失败`));
        };

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          let value = result.value;

          // 解密处理
          if (config.StorageEncode && !newKey.startsWith(responsiveStorageNameSpace())) {
            try {
              value = JSON.parse(CryptoJs.default.AES.decrypt(value, config.StorageKey));
            } catch (error) {
              console.error('解密失败:', error);
            }
          }

          resolve(value as T);
        };
      });
    } catch (error) {
      console.error('获取数据失败:', error);
      return null;
    }
  }

  /**
   * 设置一个值
   * @param key 键
   * @param value 值
   * @returns 返回Promise，表示操作是否成功
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await this.waitForReady();
      
      if (!key) return;
      
      const newKey = key.startsWith(responsiveStorageNameSpace()) 
        ? key 
        : getConfig().SystemCode + key;

      let valueToStore = value;
      
      // 加密处理
      if (config.StorageEncode && !newKey.startsWith(responsiveStorageNameSpace())) {
        valueToStore = CryptoJs.default.AES.encrypt(JSON.stringify(value), config.StorageKey) as any;
      }

      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('数据库未初始化'));
          return;
        }

        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({ key: newKey, value: valueToStore });

        request.onerror = () => {
          reject(new Error(`设置键"${newKey}"失败`));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('设置数据失败:', error);
    }
  }

  /**
   * 删除一个值
   * @param key 键
   * @returns 返回Promise，表示操作是否成功
   */
  async removeItem(key: string): Promise<void> {
    try {
      await this.waitForReady();
      
      if (!key) return;
      
      const newKey = key.startsWith(responsiveStorageNameSpace()) 
        ? key 
        : getConfig().SystemCode + key;

      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('数据库未初始化'));
          return;
        }

        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(newKey);

        request.onerror = () => {
          reject(new Error(`删除键"${newKey}"失败`));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('删除数据失败:', error);
    }
  }

  /**
   * 清空所有值
   * @returns 返回Promise，表示操作是否成功
   */
  async clear(): Promise<void> {
    try {
      await this.waitForReady();

      return new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('数据库未初始化'));
          return;
        }

        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => {
          reject(new Error('清空存储失败'));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('清空数据失败:', error);
    }
  }

  /**
   * 获取所有键值对
   * @returns 返回Promise，包含所有键值对
   */
  async getAll(): Promise<Record<string, any>> {
    try {
      await this.waitForReady();

      return new Promise<Record<string, any>>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('数据库未初始化'));
          return;
        }

        const transaction = this.db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onerror = () => {
          reject(new Error('获取所有数据失败'));
        };

        request.onsuccess = () => {
          const result: Record<string, any> = {};
          
          for (const item of request.result) {
            let value = item.value;
            
            // 解密处理
            if (config.StorageEncode && !item.key.startsWith(responsiveStorageNameSpace())) {
              try {
                value = JSON.parse(CryptoJs.default.AES.decrypt(value, config.StorageKey));
              } catch (error) {
                console.error('解密失败:', error);
              }
            }
            
            result[item.key] = value;
          }
          
          resolve(result);
        };
      });
    } catch (error) {
      console.error('获取所有数据失败:', error);
      return {};
    }
  }
}

/**
 * IndexedDB存储操作封装的代理类，提供与localStorage类似的同步接口
 * 但内部使用Promise进行异步操作
 */
class IndexedDBStorageProxy implements ProxyStorage {
  private db: IndexedDBStorage;
  private cache: Map<string, any> = new Map();
  private initialized: boolean = false;
  private initializePromise: Promise<void>;
  private loadingKeys: Set<string> = new Set(); // 跟踪正在加载的键，避免重复请求

  constructor(dbName?: string, storeName?: string, version?: number) {
    this.db = new IndexedDBStorage(dbName, storeName, version);
    
    // 初始化缓存
    this.initializePromise = this.initialize();
  }

  /**
   * 初始化操作，预加载所有数据到缓存
   */
  private async initialize(): Promise<void> {
    try {
      const allData = await this.db.getAll();
      for (const [key, value] of Object.entries(allData)) {
        this.cache.set(key, value);
      }
      this.initialized = true;
    } catch (error) {
      console.error('初始化IndexedDB缓存失败:', error);
    }
  }

  /**
   * 获取值（同步方法）
   * 会尝试从缓存获取，如果缓存中没有则异步从IndexedDB加载并更新缓存
   * 注意：首次访问可能返回null，但会触发异步加载，后续访问可以获取到数据
   */
  getItem<T>(key: string): T {
    if (!key) return null as T;
    
    const newKey = key.startsWith(responsiveStorageNameSpace()) 
      ? key 
      : getConfig().SystemCode + key;
      
    // 从缓存中获取
    const cachedValue = this.cache.get(newKey);
    if (cachedValue !== undefined) {
      return cachedValue as T;
    }
    
    // 如果缓存中没有且没有正在加载，则异步从IndexedDB加载
    if (!this.loadingKeys.has(newKey)) {
      this.loadingKeys.add(newKey);
      
      this.db.getItem<T>(key).then(value => {
        if (value !== null) {
          this.cache.set(newKey, value);
        }
        this.loadingKeys.delete(newKey);
      }).catch(error => {
        console.error(`从IndexedDB获取键"${key}"失败:`, error);
        this.loadingKeys.delete(newKey);
      });
    }
    
    // 当前返回null，但已触发异步加载（如果需要）
    return null as T;
  }

  /**
   * 设置值（同步方法，但异步写入IndexedDB）
   */
  setItem<T>(key: string, value: T) {
    if (!key) return;
    
    const newKey = key.startsWith(responsiveStorageNameSpace()) 
      ? key 
      : getConfig().SystemCode + key;
      
    // 更新缓存
    this.cache.set(newKey, value);
    
    // 异步写入数据库
    this.db.setItem(key, value).catch(error => {
      console.error(`设置IndexedDB键"${key}"失败:`, error);
    });
  }

  /**
   * 删除值（同步方法，但异步从IndexedDB删除）
   */
  removeItem(key: string) {
    if (!key) return;
    
    const newKey = key.startsWith(responsiveStorageNameSpace()) 
      ? key 
      : getConfig().SystemCode + key;
      
    // 从缓存中删除
    this.cache.delete(newKey);
    
    // 异步从数据库中删除
    this.db.removeItem(key).catch(error => {
      console.error(`删除IndexedDB键"${key}"失败:`, error);
    });
  }

  /**
   * 清空所有值（同步方法，但异步清空IndexedDB）
   */
  clear() {
    // 清空缓存
    this.cache.clear();
    
    // 异步清空数据库
    this.db.clear().catch(error => {
      console.error('清空IndexedDB失败:', error);
    });
  }

  /**
   * 获取一个异步版本的IndexedDB实例，用于需要确保数据已读取/写入的场景
   */
  getAsyncStorage(): IndexedDBStorage {
    return this.db;
  }

  /**
   * 等待初始化完成
   * 可以在应用启动时调用此方法确保缓存已加载
   */
  async waitForInitialization(): Promise<void> {
    if (this.initialized) return;
    return this.initializePromise;
  }

  /**
   * 异步获取值，确保在初始化完成后获取
   * 适用于需要确保能获取到缓存数据的场景（如页面刷新后）
   */
  async getItemAsync<T>(key: string): Promise<T> {
    if (!key) return null as T;
    
    // 等待初始化完成
    await this.waitForInitialization();
    
    // 初始化完成后，直接从缓存获取
    return this.getItem<T>(key);
  }

  /**
   * 同步获取值，如果初始化未完成则等待
   * 这是一个阻塞方法，会等待初始化完成后再返回结果
   * 适用于应用启动时需要立即获取缓存数据的场景
   */
  getItemSync<T>(key: string): T {
    if (!key) return null as T;
    
    const newKey = key.startsWith(responsiveStorageNameSpace()) 
      ? key 
      : getConfig().SystemCode + key;
    
    // 如果已经初始化，直接从缓存获取
    if (this.initialized) {
      return this.cache.get(newKey) ?? null as T;
    }
    
    // 如果未初始化，这里只能返回null
    // 建议使用getItemAsync方法来确保获取到数据
    console.warn(`getItemSync: 初始化未完成，建议使用getItemAsync方法获取键"${key}"`);
    return null as T;
  }
}

// 创建IndexedDB代理实例，重命名变量以避免与全局indexedDB冲突
const idbProxy = new IndexedDBStorageProxy();

// 导出同步类似localStorage的接口
export const indexedDBProxy = () => idbProxy;

// 导出异步版本的IndexedDB接口，用于需要确保数据操作完成的场景
export const asyncIndexedDB = () => idbProxy.getAsyncStorage();