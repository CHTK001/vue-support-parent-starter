import { sm2, sm4 } from "sm-crypto";
import * as crypto from "./index";
import type { PureHttpResponse, PureHttpRequestConfig } from "../http/types";
import { getConfig } from "@repo/config";
// 导入 WASM 版本的函数
import { 
  uu2_wasm, 
  uu1_wasm, 
  uu3_wasm, 
  uu4_wasm, 
  isWasmLoaded, 
  generateNonce as generateNonceWasm 
} from "@repo/codec-wasm";
// 导入 JS/TS 版本的函数
import { 
  jsUu1, 
  jsUu2, 
  jsUu3, 
  jsUu4, 
  jsGenerateNonce 
} from "@repo/codec-wasm";

// 常量定义
const ORIGIN_KEY_HEADER = 'access-control-origin-key';
const TIMESTAMP_HEADER = 'access-control-timestamp-user';
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
      // 确保WASM已加载
      if (!isWasmLoaded()) {
        console.warn('WASM not loaded, using fallback nonce generation');
        // 如果WASM未加载，提供一个备用实现
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
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

// 检查是否启用 WASM。默认为 true，除非显式设置为 false
const isWasmEnabled = (): boolean => {
  const config = getConfig('wasmEnable');
  // 默认启用 WASM，除非显式设置为 false
  return config !== false;
};

/** 
 * uu2 - 请求加密处理
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
export const uu2 = async (request: PureHttpRequestConfig): Promise<PureHttpRequestConfig> => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    const result = await uu2_wasm(request);
    return result as PureHttpRequestConfig;
  } else {
    // 使用 JS/TS 版本
    return jsUu2(request);
  }
};

/** 
 * uu1 - 响应解密处理
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
export const uu1 = (response: PureHttpResponse) => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    return uu1_wasm(response);
  } else {
    // 使用 JS/TS 版本
    return jsUu1(response);
  }
};

/** 
 * uu3 - AES解密工具
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
export const uu3 = async (value: string) => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    return uu3_wasm(value);
  } else {
    // 使用 JS/TS 版本
    return jsUu3(value);
  }
};

/** 
 * uu4 - 特殊响应解密处理
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
export const uu4 = async (response: any) => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    const result = uu4_wasm(response);
    
    // 如果结果是 JSON 字符串，尝试解析它
    if (typeof result === 'string' && result.length > 0) {
      if (result === '{}' || result === '""') {
        return {};
      }
      try {
        return JSON.parse(result);
      } catch (parseError) {
        return result;
      }
    }
    return result;
  } else {
    // 使用 JS/TS 版本
    return jsUu4(response);
  }
};

/**
 * 生成 Nonce
 * 根据 wasmEnable 配置决定使用 WASM 或 JS/TS 实现
 * 不会降级：如果启用 WASM 但加载失败，将抛出错误
 */
export const generateNonce = (): string => {
  if (isWasmEnabled()) {
    // 使用 WASM 版本，不降级
    return generateNonceWasm();
  } else {
    // 使用 JS/TS 版本
    return jsGenerateNonce();
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
  }
};

// 导出工具函数
export const codecUtilities = codecUtils;

// 导出 WASM 相关函数
export { uu2_wasm, uu3_wasm, uu4_wasm, isWasmLoaded };

// 导出配置检查函数
export { isWasmEnabled };
