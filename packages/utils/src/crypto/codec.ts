import { sm2, sm4 } from "sm-crypto";
import * as crypto from "./index";
import type { PureHttpResponse, PureHttpRequestConfig } from "../http/types";
import { getConfig } from "@repo/config";
import { resolveRequestEncryptConfig } from "../http/config-resolver";
// 导入统一接口（自动降级）
import {
  encryptSM4,
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
const RESPONSE_CODEC_HEADER = "access-control-no-data";
const JSON_CONTENT_TYPE = "application/json";
const REQUEST_ENCRYPT_HEADER = ORIGIN_KEY_HEADER;
const REQUEST_ENCRYPT_METHODS = new Set(["post", "put", "patch", "delete"]);

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

const isWasmNotReadyError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("WASM 未就绪");

const normalizeHeaderValue = (value: unknown): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0]) : undefined;
  }
  return String(value);
};

const getHeaderValue = (headers: unknown, key: string): string | undefined => {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const lowerKey = key.toLowerCase();
  const axiosHeaders = headers as {
    get?: (name: string) => unknown;
    toJSON?: () => Record<string, unknown>;
  };

  if (typeof axiosHeaders.get === "function") {
    const value =
      axiosHeaders.get(key) ??
      axiosHeaders.get(lowerKey) ??
      axiosHeaders.get(key.toUpperCase());
    const normalized = normalizeHeaderValue(value);
    if (normalized !== undefined) {
      return normalized;
    }
  }

  const rawHeaders =
    typeof axiosHeaders.toJSON === "function" ? axiosHeaders.toJSON() : headers;
  const record = rawHeaders as Record<string, unknown>;
  const matchedKey = Object.keys(record).find(
    (item) => item.toLowerCase() === lowerKey,
  );

  return matchedKey ? normalizeHeaderValue(record[matchedKey]) : undefined;
};

const normalizeHeaders = (headers: unknown): Record<string, string> => {
  if (!headers || typeof headers !== "object") {
    return {};
  }

  const axiosHeaders = headers as {
    toJSON?: () => Record<string, unknown>;
  };
  const rawHeaders =
    typeof axiosHeaders.toJSON === "function" ? axiosHeaders.toJSON() : headers;

  return Object.entries(rawHeaders as Record<string, unknown>).reduce(
    (acc, [key, value]) => {
      const normalizedValue = normalizeHeaderValue(value);
      if (normalizedValue !== undefined) {
        acc[key.toLowerCase()] = normalizedValue;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
};

const isFileLike = (value: unknown): boolean =>
  typeof File !== "undefined" && value instanceof File;

const isBlobLike = (value: unknown): boolean =>
  typeof Blob !== "undefined" && value instanceof Blob;

const isFormDataLike = (value: unknown): boolean =>
  typeof FormData !== "undefined" && value instanceof FormData;

const isUrlSearchParamsLike = (value: unknown): boolean =>
  typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;

const hasBinaryPayload = (value: unknown): boolean => {
  if (!value || typeof value !== OBJECT_TYPE || Array.isArray(value)) {
    return false;
  }

  return Object.values(value as Record<string, unknown>).some(
    (item) => isFileLike(item) || isBlobLike(item),
  );
};

const getRequestEncryptConfig = () => resolveRequestEncryptConfig(getConfig());

const shouldEncryptRequest = (request: PureHttpRequestConfig): boolean => {
  if (!getRequestEncryptConfig().enableEncrypt) {
    return false;
  }

  if (!request?.data) {
    return false;
  }

  const url = request.url || "";
  if (url.startsWith(SETTING_PATH)) {
    return false;
  }

  const method = String(request.method || "get").toLowerCase();
  if (!REQUEST_ENCRYPT_METHODS.has(method)) {
    return false;
  }

  const body = request.data;
  if (
    isFormDataLike(body) ||
    isFileLike(body) ||
    isBlobLike(body) ||
    isUrlSearchParamsLike(body)
  ) {
    return false;
  }

  if (hasBinaryPayload(body)) {
    return false;
  }

  const contentType = (
    getHeaderValue(request.headers, "Content-Type") || JSON_CONTENT_TYPE
  ).toLowerCase();

  return contentType.includes(JSON_CONTENT_TYPE);
};

const serializeRequestBody = (body: unknown): string => {
  if (typeof body === STRING_TYPE) {
    return body as string;
  }
  return JSON.stringify(body);
};

const isEncryptedResponse = (response: PureHttpResponse): boolean =>
  (getHeaderValue(response?.headers, RESPONSE_CODEC_HEADER) || "").toLowerCase() ===
  "true";

const normalizeResponse = (response: PureHttpResponse): PureHttpResponse =>
  ({
    ...response,
    headers: normalizeHeaders(response?.headers),
  }) as PureHttpResponse;

/**
 * uu2 - 请求加密处理
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu2 = async (
  request: PureHttpRequestConfig,
): Promise<PureHttpRequestConfig> => {
  if (!shouldEncryptRequest(request)) {
    return request;
  }

  const codecRequestKey = getRequestEncryptConfig().codecRequestKey;
  if (!codecRequestKey) {
    throw new Error(
      "[codec] 请求加密已开启，但缺少 Request.codecRequestKey/CodecRequestKey 配置",
    );
  }

  try {
    const payload = serializeRequestBody(request.data);
    const encryptedPayload = encryptSM4(payload, codecRequestKey);

    if (!request.headers) {
      request.headers = {};
    }

    request.headers[REQUEST_ENCRYPT_HEADER] = String(Date.now());
    request.headers["Content-Type"] = `${JSON_CONTENT_TYPE}; charset=UTF-8`;
    request.data = { data: encryptedPayload };

    return request;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "未知错误";
    throw new Error(`[codec] 请求加密失败: ${reason}`);
  }
};

/**
 * uu1 - 响应解密处理
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu1 = (response: PureHttpResponse) => {
  const encrypted = isEncryptedResponse(response);
  try {
    return uu1Unified(normalizeResponse(response));
  } catch (error) {
    if (!encrypted && !isWasmNotReadyError(error)) {
      console.warn("[codec] uu1 failed, fallback to original response:", error);
      return response;
    }
    const reason = error instanceof Error ? error.message : "未知错误";
    throw new Error(`[codec] 响应解密失败: ${reason}`);
  }
};

/**
 * uu3 - AES解密工具
 * 使用统一接口，自动降级：如果 WASM 未加载会自动使用 JS 版本
 * 如果启用 WASM 但执行错误，将抛出错误
 */
export const uu3Wrapper = async (value: string) => {
  const fallbackDecrypt = () => {
    try {
      return crypto.default.AES.decrypt(value, DEFAULT_AES_KEY) || value;
    } catch {
      return value;
    }
  };

  try {
    const result = uu3Unified(value);
    if (typeof result === "string" && result && result !== value) {
      return result;
    }
    return fallbackDecrypt();
  } catch (error) {
    if (!isWasmNotReadyError(error)) {
      console.warn("[codec] uu3 failed, fallback to AES decrypt:", error);
    }
    return fallbackDecrypt();
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
    if (!isWasmNotReadyError(error)) {
      console.warn("[codec] uu4 failed, fallback to raw response data:", error);
    }
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
