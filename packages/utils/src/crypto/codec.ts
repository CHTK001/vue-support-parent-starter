import { sm2, sm4 } from "sm-crypto";
import * as crypto from "./index";
import type { PureHttpResponse, PureHttpRequestConfig } from "../http/types";
import { getConfig } from "@repo/config";
// 导入WASM版本的函数
import { uu2_wasm, uu1_wasm, uu3_wasm, uu4_wasm, initWasm, isWasmLoaded } from "@repo/codec-wasm";

// OTK存储接口
interface OtkEntry {
  key: string;
  createTime: number;
  used: boolean;
}

// OTK存储管理
class OtkManager {
  private static instance: OtkManager;
  private otkStore: Map<string, OtkEntry> = new Map();
  private readonly OTK_TTL_MS = 5 * 60 * 1000; // 5分钟
  private readonly MAX_OTK_SIZE = 1000;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): OtkManager {
    if (!OtkManager.instance) {
      OtkManager.instance = new OtkManager();
    }
    return OtkManager.instance;
  }

  // 验证并使用OTK
  validateAndUseOtk(otkId: string, key: string): boolean {
    try {
      const entry = this.otkStore.get(otkId);
      
      if (!entry) {
        console.warn('OTK validation failed: OTK not found', { otkId });
        return false;
      }
      
      if (entry.used) {
        console.warn('OTK validation failed: OTK already used', { otkId, createTime: entry.createTime });
        return false;
      }
      
      const now = Date.now();
      const age = now - entry.createTime;
      
      if (age > this.OTK_TTL_MS) {
        console.warn('OTK validation failed: OTK expired', { 
          otkId, 
          age: `${Math.round(age / 1000)}s`,
          ttl: `${this.OTK_TTL_MS / 1000}s`
        });
        this.otkStore.delete(otkId);
        return false;
      }
      
      if (entry.key !== key) {
        console.error('OTK validation failed: Key mismatch', { 
          otkId,
          expectedLength: key?.length || 0,
          actualLength: entry.key?.length || 0
        });
        return false;
      }
      
      // 标记为已使用
      entry.used = true;
      console.info('OTK validated and consumed successfully', { 
        otkId, 
        age: `${Math.round(age / 1000)}s`,
        remainingOtks: this.otkStore.size - 1
      });
      return true;
    } catch (error) {
      console.error('OTK validation error:', error, { otkId });
      return false;
    }
  }

  // 存储OTK（用于测试或特殊场景）
  storeOtk(otkId: string, key: string): void {
    this.otkStore.set(otkId, {
      key,
      createTime: Date.now(),
      used: false
    });

    // 如果超过最大限制，清理最旧的
    if (this.otkStore.size > this.MAX_OTK_SIZE) {
      const oldestEntry = Array.from(this.otkStore.entries())
        .sort(([, a], [, b]) => a.createTime - b.createTime)[0];
      if (oldestEntry) {
        this.otkStore.delete(oldestEntry[0]);
      }
    }
  }

  // 清理过期的OTK
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [otkId, entry] of this.otkStore.entries()) {
      if (now - entry.createTime > this.OTK_TTL_MS) {
        this.otkStore.delete(otkId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.debug(`Cleaned ${cleanedCount} expired OTKs, remaining: ${this.otkStore.size}`);
    }
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    // 每2.5分钟清理一次过期的OTK
    this.cleanupTimer = setInterval(() => this.cleanup(), this.OTK_TTL_MS / 2);
  }

  // 检查OTK是否过期
  private isExpired(entry: OtkEntry): boolean {
    return Date.now() - entry.createTime > this.OTK_TTL_MS;
  }

  // 强制清理所有过期OTK
  forceCleanup(): number {
    const beforeSize = this.otkStore.size;
    this.cleanup();
    const afterSize = this.otkStore.size;
    return beforeSize - afterSize;
  }

  // 获取即将过期的OTK数量（1分钟内过期）
  getExpiringCount(): number {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    let expiringCount = 0;

    for (const entry of this.otkStore.values()) {
      const timeLeft = this.OTK_TTL_MS - (now - entry.createTime);
      if (timeLeft > 0 && timeLeft <= oneMinute) {
        expiringCount++;
      }
    }

    return expiringCount;
  }

  // 获取存储状态（用于调试）
  getStats(): { total: number; used: number; expired: number } {
    const now = Date.now();
    let used = 0;
    let expired = 0;

    for (const entry of this.otkStore.values()) {
      if (entry.used) used++;
      if (now - entry.createTime > this.OTK_TTL_MS) expired++;
    }

    return {
      total: this.otkStore.size,
      used,
      expired
    };
  }
}

// 常量定义
const ORIGIN_KEY_HEADER = 'access-control-origin-key';
const TIMESTAMP_HEADER = 'access-control-timestamp-user';
const OTK_ID_HEADER = 'access-control-otk-id';
const NONCE_HEADER = 'access-control-nonce';
const ENCRYPTED_PREFIX = '02';
const PREFIX_LENGTH = 8;
const SUFFIX_LENGTH = 4;
const SUCCESS_STATUS = 200;
const DATA_FIELD = 'data';
const STRING_TYPE = 'string';
const OBJECT_TYPE = 'object';
const SETTING_PATH = '/v2/setting';
const DEFAULT_AES_KEY = '1234567890Oil#@1';
const REQUEST_CODEC_CONFIG = 'requestCodecOpen';
const CODEC_REQUEST_KEY_CONFIG = 'codecRequestKey';

// 反重放攻击保护
class AntiReplayManager {
  private static instance: AntiReplayManager;
  private requestStore: Map<string, number> = new Map();
  private readonly REQUEST_TTL_MS = 5 * 60 * 1000; // 5分钟
  private readonly MAX_REQUEST_SIZE = 10000;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanupTimer();
  }

  static getInstance(): AntiReplayManager {
    if (!AntiReplayManager.instance) {
      AntiReplayManager.instance = new AntiReplayManager();
    }
    return AntiReplayManager.instance;
  }

  // 验证请求唯一性
  validateRequest(timestamp: number, nonce: string): boolean {
    const now = Date.now();
    
    // 检查时间戳是否在合理范围内
    if (Math.abs(now - timestamp) > this.REQUEST_TTL_MS) {
      console.debug('Request timestamp out of range:', timestamp);
      return false;
    }

    // 生成请求唯一标识
    const requestId = `${timestamp}_${nonce}`;
    
    // 检查是否已存在
    if (this.requestStore.has(requestId)) {
      console.debug('Duplicate request detected:', requestId);
      return false;
    }

    // 存储请求记录
    this.requestStore.set(requestId, timestamp);

    // 如果超过最大限制，清理最旧的记录
    if (this.requestStore.size > this.MAX_REQUEST_SIZE) {
      const oldestEntry = Array.from(this.requestStore.entries())
        .sort(([, a], [, b]) => a - b)[0];
      if (oldestEntry) {
        this.requestStore.delete(oldestEntry[0]);
      }
    }

    return true;
  }

  // 生成随机nonce
  generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 清理过期的请求记录
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [requestId, timestamp] of this.requestStore.entries()) {
      if (now - timestamp > this.REQUEST_TTL_MS) {
        this.requestStore.delete(requestId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.debug(`Cleaned ${cleanedCount} expired request records, remaining: ${this.requestStore.size}`);
    }
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => this.cleanup(), this.REQUEST_TTL_MS / 2);
  }

  // 获取存储状态（用于调试）
  getStats(): { total: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const timestamp of this.requestStore.values()) {
      if (now - timestamp > this.REQUEST_TTL_MS) expired++;
    }

    return {
      total: this.requestStore.size,
      expired
    };
  }
}

// 检查是否启用WASM
const isWasmEnabled = () => {
  // 可以通过配置控制是否启用WASM
  return getConfig('codecWasmEnabled') === true;
};

/** uu2 - 请求加密处理 */
export const uu2 = (request: PureHttpRequestConfig) => {
  // 如果启用了WASM且WASM已加载，则使用WASM版本
  if (isWasmEnabled() && isWasmLoaded()) {
    // 注意：这里为了保持接口一致性，我们仍然使用同步版本
    // 在实际项目中，可能需要调整调用方式
    return uu2_js(request); // 暂时回退到JavaScript版本
  }
  
  return uu2_js(request);
};

/** uu2的JavaScript实现 */
const uu2_js = (request: PureHttpRequestConfig) => {
  const requestData = request[DATA_FIELD];
  const requestUrl = request.url;
  if (requestUrl.startsWith(SETTING_PATH)) {
    return request;
  }
  if (!requestData) {
    return request;
  }

  if (!getConfig(REQUEST_CODEC_CONFIG) || !getConfig(CODEC_REQUEST_KEY_CONFIG)) {
    return request;
  }

  const isArray = requestData instanceof Array;
  if (!isArray) {
    const dataKeys = Object.keys(requestData);
    if (
      dataKeys.filter((key) => {
        const value = requestData[key];
        if (value instanceof File) {
          return true;
        }

        if (value instanceof Blob) {
          return true;
        }

        return false;
      }).length > 0
    ) {
      return request;
    }
  }
  
  // 生成反重放攻击保护参数
  const antiReplayManager = AntiReplayManager.getInstance();
  const timestamp = Date.now();
  const nonce = antiReplayManager.generateNonce();
  
  // 验证请求唯一性
  if (!antiReplayManager.validateRequest(timestamp, nonce)) {
    console.error('Request encryption failed: Anti-replay validation failed', {
      timestamp,
      nonce,
      url: requestUrl,
      antiReplayStats: antiReplayManager.getStats()
    });
    throw new Error('Anti-replay validation failed');
  }
  
  var jsonData = JSON.stringify(requestData);
  try {
    const encryptedData = sm4.encrypt(jsonData, getConfig(CODEC_REQUEST_KEY_CONFIG));
    request[DATA_FIELD] = isArray ? [{ [DATA_FIELD]: encryptedData }] : { [DATA_FIELD]: encryptedData };
    
    // 确保headers存在
    if (!request.headers) {
      request.headers = {};
    }
    
    request.headers[ORIGIN_KEY_HEADER] = new Date().getTime();
    request.headers[TIMESTAMP_HEADER] = timestamp.toString();
    request.headers[NONCE_HEADER] = nonce;
    
    console.info('Request encrypted successfully with anti-replay protection', {
      timestamp,
      nonce,
      url: requestUrl,
      dataSize: jsonData.length,
      antiReplayStats: antiReplayManager.getStats()
    });
    
    return request;
  } catch (error) {
    console.error('Request encryption failed:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      hasData: !!request.data,
      dataKeys: request.data ? Object.keys(request.data) : []
    });
    
    // 在加密失败时，返回原始请求以保证功能可用性
    return request;
  }
};

/** uu1 - 响应解密处理（增强版） */
export const uu1 = (response: PureHttpResponse) => {
  // 如果启用了WASM且WASM已加载，则使用WASM版本
  if (isWasmEnabled() && isWasmLoaded()) {
    return uu1_js(response); // 暂时回退到JavaScript版本
  }
  
  return uu1_js(response);
};

/** uu1的JavaScript实现 */
const uu1_js = (response: PureHttpResponse) => {
  // 添加响应状态验证
  if (!response || typeof response !== OBJECT_TYPE) {
    return response;
  }
  
  // 添加状态码检查
  if (response.status !== SUCCESS_STATUS) {
    return response;
  }
  
  // 添加数据完整性检查
  if (!response[DATA_FIELD] && !response[DATA_FIELD]?.[DATA_FIELD]) {
    return response;
  }
  
  try {
    return decryptResponseCore(sm2, response);
  } catch (error) {
    // 解密失败时返回原始响应
    console.warn('Response decryption failed:', error.message);
    return response;
  }
};

/** decryptResponseCore - 核心解密逻辑（支持OTK） */
const decryptResponseCore = (sm2Engine, response: PureHttpResponse) => {
  if (response.status == SUCCESS_STATUS) {
    var rawData = response[DATA_FIELD]?.[DATA_FIELD] || response[DATA_FIELD];
    
    // 数据类型验证和提取
    if (typeof rawData !== STRING_TYPE) {
      if (typeof rawData === OBJECT_TYPE) {
        if (!rawData?.[DATA_FIELD] || typeof rawData[DATA_FIELD] !== STRING_TYPE) {
          return response;
        }
        rawData = rawData[DATA_FIELD];
      } else {
        return response;
      }
    }
    
    // 检查加密数据标识
    if (!rawData.startsWith(ENCRYPTED_PREFIX)) {
      return response;
    }
    
    // 获取解密密钥和OTK ID
    var originKey = response?.headers?.[ORIGIN_KEY_HEADER];
    var otkId = response?.headers?.[OTK_ID_HEADER];
    
    if (originKey) {
      const timestamp = response?.headers?.[TIMESTAMP_HEADER];
      try {
        // 数据切片和解密
        const encryptedPart = rawData.substring(PREFIX_LENGTH, rawData.length - SUFFIX_LENGTH);
        const decryptKey = crypto.default.AES.decrypt(originKey, timestamp);
        
        // OTK验证逻辑
        if (otkId) {
          const otkManager = OtkManager.getInstance();
          
          console.info('Processing response with OTK', {
            otkId,
            url: response.config?.url,
            status: response.status
          });
          
          // 验证OTK格式
          if (!codecUtilities.otk.validateOtkId(otkId)) {
            console.error('Response decryption failed: Invalid OTK ID format', {
              otkId,
              url: response.config?.url
            });
            return response;
          }
          
          // 检查OTK是否过期
          const otkTimestamp = codecUtilities.otk.extractTimestamp(otkId);
          if (codecUtilities.otk.isExpired(otkId)) {
            console.warn('Response decryption failed: OTK expired', {
              otkId,
              timestamp: otkTimestamp ? new Date(otkTimestamp).toISOString() : 'unknown',
              age: otkTimestamp ? `${Math.round((Date.now() - otkTimestamp) / 1000)}s` : 'unknown',
              url: response.config?.url
            });
            return response;
          }
          
          // 验证并使用OTK
          if (!otkManager.validateAndUseOtk(otkId, decryptKey)) {
            console.error('Response decryption failed: OTK validation failed', {
              otkId,
              url: response.config?.url,
              otkStats: otkManager.getStats()
            });
            return response;
          }
          
          console.info('OTK validation successful', {
            otkId,
            url: response.config?.url,
            remainingOtks: otkManager.getStats().total
          });
        } else {
          console.warn('Response decryption: No OTK ID found in response headers', {
            url: response.config?.url,
            status: response.status,
            availableHeaders: Object.keys(response.headers || {})
          });
        }
        
        const decryptedData = sm2Engine.doDecrypt(encryptedPart, decryptKey, 0);
        
        // 验证解密结果
        if (decryptedData) {
          response[DATA_FIELD] = JSON.parse(decryptedData);
          
          if (otkId) {
            console.debug('Response decrypted successfully with OTK:', otkId);
          }
        }
      } catch (decryptError) {
        // 静默处理解密错误
        console.debug('Decryption process failed:', decryptError);
        
        // 如果是OTK相关错误，记录详细信息
        if (otkId) {
          console.debug('OTK decryption failed for:', otkId, decryptError);
        }
      }
    }
  }
  return response;
};

/** uu3 - AES解密工具 */
export const uu3 = (value: string) => {
  // 如果启用了WASM且WASM已加载，则使用WASM版本
  if (isWasmEnabled() && isWasmLoaded()) {
    return uu3_js(value); // 暂时回退到JavaScript版本
  }
  
  return uu3_js(value);
};

/** uu3的JavaScript实现 */
const uu3_js = (value: string) => {
  if (!value || typeof value !== STRING_TYPE) {
    return value;
  }
  try {
    return crypto.default.AES.decrypt(value, DEFAULT_AES_KEY);
  } catch (error) {
    console.debug('AES decryption failed:', error);
    return value;
  }
};

/** uu4 - 特殊响应解密处理 */
export const uu4 = (response) => {
  // 如果启用了WASM且WASM已加载，则使用WASM版本
  if (isWasmEnabled() && isWasmLoaded()) {
    return uu4_js(response); // 暂时回退到JavaScript版本
  }
  
  return uu4_js(response);
};

/** uu4的JavaScript实现 */
const uu4_js = (response) => {
  if (!response || typeof response !== OBJECT_TYPE) {
    return {};
  }
  
  var data = response?.[DATA_FIELD];
  if (!data || typeof data !== STRING_TYPE) {
    return response;
  }
  
  if (!data.startsWith(ENCRYPTED_PREFIX)) {
    return response;
  }
  
  var uuid = response?.uuid;
  if (uuid) {
    const timestamp = response?.timestamp;
    try {
      const encryptedSegment = data.substring(PREFIX_LENGTH, data.length - SUFFIX_LENGTH);
      const key = crypto.default.AES.decrypt(uuid, timestamp);
      const decrypted = sm2.doDecrypt(encryptedSegment, key, 0);
      
      if (decrypted) {
        return JSON.parse(decrypted);
      }
    } catch (error) {
      console.debug('uu4 decryption failed:', error);
    }
  }
  return {};
};

// 工具函数
const codecUtils = {
  // 字符串反转
  reverse: (str: string) => str.split('').reverse().join(''),
  
  // 简单异或加密
  xor: (data: string, key: number = 0x5A) => {
    return data.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ key)
    ).join('');
  },
  
  // 时间戳验证
  validateTimestamp: (timestamp: number, tolerance: number = 300000) => {
    const now = new Date().getTime();
    return Math.abs(now - timestamp) <= tolerance;
  },
  
  // 数据完整性校验
  validateIntegrity: (data: any) => {
    if (!data) return false;
    if (typeof data === STRING_TYPE && data.length === 0) return false;
    if (typeof data === OBJECT_TYPE && Object.keys(data).length === 0) return false;
    return true;
  },
  
  // OTK相关工具函数
  otk: {
    // 验证OTK ID格式
    validateOtkId: (otkId: string) => {
      if (!otkId || typeof otkId !== STRING_TYPE) return false;
      // OTK ID应该以OTK_前缀开头，后跟时间戳和随机字符
      return /^OTK_\d{13}_[A-F0-9]{16}$/.test(otkId);
    },
    
    // 从OTK ID中提取时间戳
    extractTimestamp: (otkId: string) => {
      if (!codecUtils.otk.validateOtkId(otkId)) return null;
      const parts = otkId.split('_');
      return parts.length >= 2 ? parseInt(parts[1]) : null;
    },
    
    // 检查OTK是否过期
    isExpired: (otkId: string, ttlMs: number = 300000) => {
      const timestamp = codecUtils.otk.extractTimestamp(otkId);
      if (!timestamp) return true;
      return Date.now() - timestamp > ttlMs;
    }
  }
};

// 导出工具函数
export const codecUtilities = codecUtils;

// 导出WASM相关函数
export { uu2_wasm, uu1_wasm, uu3_wasm, uu4_wasm, initWasm, isWasmLoaded };
