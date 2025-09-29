import { sm2, sm4 } from "sm-crypto";
import * as crypto from "./index";
import type { PureHttpResponse, PureHttpRequestConfig } from "../http/types";
import { getConfig } from "@repo/config";
// 导入WASM版本的函数
import { uu2_wasm, uu1_wasm, uu3_wasm, uu4_wasm, initWasm, isWasmLoaded, generateNonce as generateNonceWasm, processRequest, processResponse } from "@repo/codec-wasm";

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

  // 生成随机nonce（直接调用WASM版本，同步方式）
  generateNonce(): string {
    try {
      // 直接调用WASM版本的generateNonce函数（同步方式）
      return generateNonceWasm();
    } catch (error) {
      console.error('Failed to generate nonce using WASM:', error);
      // 如果WASM失败，提供一个备用实现
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
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

/** uu2 - 请求加密处理（直接调用WASM版本，同步方式） */
export const uu2 = (request: PureHttpRequestConfig) => {
  try {
    // 将请求对象转换为函数传递给WASM
    const requestFunc = (key: string) => {
      switch (key) {
        case 'data':
          return typeof request.data === 'string' ? request.data : JSON.stringify(request.data);
        case 'url':
          return request.url || '';
        default:
          return '';
      }
    };
    // 直接调用WASM版本，传递requestFunc函数和getConfig函数（同步方式）
    return uu2_wasm(requestFunc, getConfig);
  } catch (error) {
    console.error('Failed to process request with WASM:', error);
    // 如果WASM失败，直接返回原始请求
    return request;
  }
};

/** uu1 - 响应解密处理（直接调用WASM版本，同步方式） */
export const uu1 = (response: PureHttpResponse) => {
  try {
    // 将响应对象转换为函数传递给WASM
    const responseFunc = (key: string) => {
      switch (key) {
        case 'status':
          return response.status?.toString() || '0';
        case 'data':
          return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        case 'headers':
          return JSON.stringify(response.headers || {});
        default:
          return '';
      }
    };
    // 直接调用WASM版本，传递responseFunc函数（同步方式）
    return uu1_wasm(responseFunc);
  } catch (error) {
    console.error('Failed to process response with WASM:', error);
    // 如果WASM失败，直接返回原始响应
    return response;
  }
};

/** uu3 - AES解密工具（直接调用WASM版本，同步方式） */
export const uu3 = (value: string) => {
  try {
    // 直接调用WASM版本，传递getConfig函数（同步方式）
    return uu3_wasm(value, getConfig);
  } catch (error) {
    console.error('Failed to decrypt with WASM:', error);
    // 如果WASM失败，直接返回原始值
    return value;
  }
};

/** uu4 - 特殊响应解密处理（直接调用WASM版本，同步方式） */
export const uu4 = (response) => {
  try {
    // 将响应对象转换为函数传递给WASM
    const responseFunc = (key: string) => {
      switch (key) {
        case 'data':
          return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        case 'uuid':
          return response.uuid || '';
        case 'timestamp':
          return response.timestamp || '';
        default:
          return '';
      }
    };
    // 直接调用WASM版本，传递responseFunc函数（同步方式）
    const result = uu4_wasm(responseFunc);
    
    // 如果结果是JSON字符串，尝试解析它
    if (typeof result === 'string' && result.length > 0) {
      // 如果是空对象字符串，直接返回空对象
      if (result === '{}' || result === '""') {
        return {};
      }
      
      // 尝试解析JSON
      try {
        return JSON.parse(result);
      } catch (parseError) {
        // 如果解析失败，返回原始结果
        return result;
      }
    }
    
    // 如果结果不是字符串，直接返回
    return result;
  } catch (error) {
    console.error('Failed to process special response with WASM:', error);
    // 如果WASM失败，直接返回原始响应
    return response;
  }
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
