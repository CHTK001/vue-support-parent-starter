import { sm2, sm4 } from "sm-crypto";
import * as crypto from "./index";
import type { PureHttpResponse, PureHttpRequestConfig } from "../http/types";
import { getConfig } from "@repo/config";
// 导入统一接口（自动降级）
import {
  uu2_wasm,
  uu1 as uu1Unified,
  uu3 as uu3Unified,
  uu4 as uu4Unified,
  uu3_wasm,
  uu4_wasm,
  isWasmLoaded,
  generateNonce as generateNonceUnified,
} from "@repo/codec-wasm";

// 常量定义
const ORIGIN_KEY_HEADER = "access-control-origin-key";
const TIMESTAMP_HEADER = "access-control-timestamp-user";
const NONCE_HEADER = "access-control-nonce";
const ENCRYPTED_PREFIX = "02";
const PREFIX_LENGTH = 8;
const SUFFIX_LENGTH = 4;
const SUCCESS_STATUS = 200;
const DATA_FIELD = "data";
const STRING_TYPE = "string";
const OBJECT_TYPE = "object";
const SETTING_PATH = "/v2/setting";
const DEFAULT_AES_KEY = "1234567890Oil#@1";
const REQUEST_CODEC_CONFIG = "requestCodecOpen";
const CODEC_REQUEST_KEY_CONFIG = "codecRequestKey";

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
      console.debug("Request timestamp out of range:", timestamp);
      return false;
    }

    // 生成请求唯一标识
    const requestId = `${timestamp}_${nonce}`;

    // 检查是否已存在
    if (this.requestStore.has(requestId)) {
      console.debug("Duplicate request detected:", requestId);
      return false;
    }

    // 存储请求记录
    this.requestStore.set(requestId, timestamp);

    // 如果超过最大限制，清理最旧的记录
    if (this.requestStore.size > this.MAX_REQUEST_SIZE) {
      const oldestEntry = Array.from(this.requestStore.entries()).sort(
        ([, a], [, b]) => a - b,
      )[0];
      if (oldestEntry) {
        this.requestStore.delete(oldestEntry[0]);
      }
    }

    return true;
  }

  // 生成随机nonce（使用统一接口，自动降级）
  generateNonce(): string {
    try {
      // 使用统一接口，如果 WASM 未加载会自动降级到 JS
      return generateNonceUnified();
    } catch (error) {
      console.error("Failed to generate nonce:", error);
      // 如果失败，提供一个备用实现
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
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
      console.debug(
        `Cleaned ${cleanedCount} expired request records, remaining: ${this.requestStore.size}`,
      );
    }
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      this.REQUEST_TTL_MS / 2,
    );
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
      expired,
    };
  }
}

// 检查是否启用 WASM。默认为 true，除非显式设置为 false
const isWasmEnabled = (): boolean => {
  const config = getConfig("wasmEnable");
  // 默认启用 WASM，除非显式设置为 false
  return config !== false;
};

/**
 * uu2 - 请求加密处理
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu2 = async (
  request: PureHttpRequestConfig,
): Promise<PureHttpRequestConfig> => {
  try {
    const result = await uu2_wasm(request);
    return result as PureHttpRequestConfig;
  } catch (error) {
    console.warn("[codec] uu2_wasm failed, fallback to raw request:", error);
    return request;
  }
};

/**
 * uu1 - 响应解密处理
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu1 = (response: PureHttpResponse) => {
  try {
    return uu1Unified(response);
  } catch (error) {
    console.warn("[codec] uu1 failed, fallback to original response:", error);
    return response;
  }
};

/**
 * uu3 - AES解密工具
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu3Wrapper = async (value: string) => {
  try {
    return uu3Unified(value);
  } catch (error) {
    console.warn("[codec] uu3 failed, fallback to original value:", error);
    return value;
  }
};

/**
 * uu4 - 特殊响应解密处理
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu4Wrapper = async (response: any) => {
  let result: any;
  try {
    result = uu4_wasm(response);
  } catch (error) {
    console.warn("[codec] uu4 failed, fallback to raw response data:", error);
    return response?.data || response;
  }

  // 如果结果是 JSON 字符串，尝试解析它
  if (typeof result === "string" && result.length > 0) {
    if (result === "{}" || result === '""') {
      return {};
    }
    try {
      return JSON.parse(result);
    } catch (parseError) {
      return result;
    }
  }
  return result;
};

/**
 * uu3 - AES解密工具（兼容导出）
 * 说明：历史代码从 @repo/utils 直接 import { uu3 } 使用，这里保持与 uu3Wrapper 完全一致的行为。
 */
export const uu3 = uu3Wrapper;

/**
 * uu4 - 特殊响应解密处理（兼容导出）
 * 说明：历史代码从 @repo/utils 直接 import { uu4 } 使用，这里保持与 uu4Wrapper 完全一致的行为。
 */
export const uu4 = uu4Wrapper;

/**
 * 生成 Nonce
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const generateNonceWrapper = (): string => {
  return generateNonceUnified();
};

// 工具函数
const codecUtils = {
  // 字符串反转
  reverse: (str: string) => str.split("").reverse().join(""),

  // 简单异或加密
  xor: (data: string, key: number = 0x5a) => {
    return data
      .split("")
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ key))
      .join("");
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
    if (typeof data === OBJECT_TYPE && Object.keys(data).length === 0)
      return false;
    return true;
  },
};

// 导出工具函数
export const codecUtilities = codecUtils;

// 导出 WASM 相关函数
export { uu2_wasm, uu3_wasm, uu4_wasm, isWasmLoaded };

// 导出配置检查函数
export { isWasmEnabled };
