/**
 * HTTP 请求加密 / 签名拦截器
 *
 * 所有加密/签名/解密算法已迁移至 wasm（CryptoModule）：
 *  - generateNonce()     → wasm 生成 anti-replay nonce
 *  - signRequest()       → wasm 拼接 nonce+fingerprint+timestamp+paramsMd5+secret
 *  - encryptBody()       → wasm 生成 AES key + 加密 + base64 编码 key
 *  - decodeBody()        → wasm 剔除噪声 + AES 解密 + JSON 识别
 *  TS 侧仅保留编排逻辑（读响应头、写 axios config、loading 控制、重试）。
 */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { CryptoModule } from "./crypto/types";
import { getAccessToken } from "@repo/utils";
import { startLoading, doneLoading } from "./progress";
import { upgrade } from "@repo/config";

/** 后端配置版本响应头：配置变更时后端返回新版本号，前端据此触发热重载 */
const CONFIG_VERSION_HEADER = "x-response-version";

/** 加密标记头：值为 "1" 表示请求体已加密 */
export const ENCRYPT_HEADER = "x-ec";
/** 随机 AES key 头（base64） */
export const KEY_HEADER = "x-ck";
/** 冗余等级头：值为 1/2/3，等级越高密文前后噪声越多 */
export const NOISE_LEVEL_HEADER = "x-ot";

/** x-sign 相关头名（与后端 NonceUtils 保持一致） */
export const SIGN_NONCE_HEADER = "x-nonce";
export const SIGN_TIMESTAMP_HEADER = "x-timestamp";
export const SIGN_FINGERPRINT_HEADER = "x-req-fingerprint";
export const SIGN_HEADER = "x-sign";

/** 幂等方法白名单：默认仅这些方法自动失败重试（避免非幂等写操作被重复执行） */
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

/** 请求加密配置 */
export interface HttpCryptoOptions {
  /** wasm 加密模块 */
  crypto: CryptoModule;
  /** 是否启用请求加密 */
  encrypt: boolean;
  /** 是否启用 x-sign 签名 */
  sign: boolean;
  /** 签名密钥（与后端 NonceSignProperties.secretKey 一致） */
  signSecret: string;
  /** 默认是否显示 loading（请求未显式指定时生效） */
  showLoading: boolean;
  /** 失败重试次数（5xx/网络错误时指数退避重试），默认 0 不重试。
   *  仅幂等方法（GET/HEAD/OPTIONS/PUT/DELETE）默认自动重试，POST/PATCH 需链式 .retry(true) 显式开启 */
  retryCount?: number;
  /** 重试间隔基数（毫秒），指数退避：base * 2^attempt（attempt 从 0 开始） */
  retryDelay?: number;
}

/** 单个请求的加密标记（由 axios 链式调用注入） */
export interface HttpCryptoConfig {
  /** 是否加密该请求体（覆盖全局 encrypt） */
  encrypt?: boolean;
  /** 是否显示 loading（覆盖全局 showLoading） */
  showLoading?: boolean;
  /** 是否允许失败重试（覆盖方法白名单；POST/PATCH 等非幂等方法按需显式开启） */
  retry?: boolean;
}

/** base64 转 Uint8Array（仅响应解密读取响应头 key 时使用） */
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 生成设备指纹（首次生成后持久化，避免每次变化导致后端缓存膨胀） */
let cachedFingerprint: string | null = null;
function generateFingerprint(): string {
  if (cachedFingerprint) return cachedFingerprint;
  const key = "x-req-fingerprint";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(key, fp);
  }
  cachedFingerprint = fp;
  return fp;
}

/** 收集 query + body 参数（与后端 NonceUtils.collectParams 语义一致） */
function collectParams(config: InternalAxiosRequestConfig): Record<string, string> {
  const result: Record<string, string> = {};

  const collect = (obj: unknown): void => {
    if (obj == null || typeof obj !== "object") return;
    if (obj instanceof URLSearchParams) {
      obj.forEach((value, key) => {
        if (!/^file$/i.test(key)) result[key] = value;
      });
      return;
    }
    if (obj instanceof FormData) {
      obj.forEach((value, key) => {
        if (!/^file$/i.test(key) && typeof value === "string") result[key] = value;
      });
      return;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (value == null || /^file$/i.test(key)) continue;
      result[key] = String(value);
    }
  };

  collect(config.params);
  collect(config.data);
  return result;
}

/** 自然排序（字典序，与后端 TreeMap/TreeSet 一致） */
function sortParams(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

/**
 * 注册 HTTP 加密/签名拦截器
 * 拦截器返回标准 AxiosInstance，用户始终操作 axios 请求对象。
 */
export function setupHttpCryptoInterceptor(options: HttpCryptoOptions): AxiosInstance {
  const instance = axios.create();
  const crypto = options.crypto;

  instance.interceptors.request.use(async (config) => {
    const hc = (config as InternalAxiosRequestConfig & { hc?: HttpCryptoConfig }).hc;
    const encrypt = hc?.encrypt ?? options.encrypt;
    const showLoading = hc?.showLoading ?? options.showLoading;

    if (showLoading) {
      startLoading();
    }

    // 默认从框架 storage 读取 token 并注入 Authorization（已有则保留）
    if (!config.headers.has("Authorization")) {
      const token = getAccessToken();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // 重试请求：跳过重新签名/加密，直接复用首次生成的密文与签名头
    const isRetry = ((config as InternalAxiosRequestConfig & { __retryCount?: number }).__retryCount ?? 0) > 0;

    // ── 可选 x-sign 防重放签名（算法在 wasm 内） ──
    if (!isRetry && options.sign && options.signSecret && config.method !== "get") {
      const nonce = crypto.generateNonce();
      const timestamp = String(Date.now());
      const fingerprint = generateFingerprint();
      const sorted = sortParams(collectParams(config));
      const sign = crypto.signRequest(sorted, nonce, fingerprint, timestamp, options.signSecret);
      config.headers.set(SIGN_NONCE_HEADER, nonce);
      config.headers.set(SIGN_TIMESTAMP_HEADER, timestamp);
      config.headers.set(SIGN_FINGERPRINT_HEADER, fingerprint);
      config.headers.set(SIGN_HEADER, sign);
    }

    // ── 请求体加密（算法在 wasm 内） ──
    if (!isRetry && encrypt && isEncryptable(config.data)) {
      const bodyText = typeof config.data === "string"
        ? config.data
        : JSON.stringify(config.data);
      const { cipher, keyB64 } = crypto.encryptBody(bodyText);
      config.data = cipher;
      config.headers.set(ENCRYPT_HEADER, "1");
      config.headers.set(KEY_HEADER, keyB64);
      config.headers.set("Content-Type", "application/octet-stream");
    }

    return config;
  });

  /** 该请求是否显示 loading */
  const shouldLoading = (config?: InternalAxiosRequestConfig): boolean => {
    const hc = (config as InternalAxiosRequestConfig & { hc?: HttpCryptoConfig } | undefined)?.hc;
    return hc?.showLoading ?? options.showLoading;
  };

  instance.interceptors.response.use(
    async (response) => {
      if (shouldLoading(response.config)) {
        doneLoading();
      }

      const resVersion = response.headers[CONFIG_VERSION_HEADER];
      if (resVersion) {
        upgrade(String(resVersion));
      }

      const encryptHeader = response.headers[ENCRYPT_HEADER];
      const keyHeader = response.headers[KEY_HEADER];
      if (encryptHeader === "1" && keyHeader && response.data) {
        const rawData =
          typeof response.data === "string"
            ? base64ToBytes(response.data)
            : (response.data as Uint8Array);
        const noiseLevel = Number(response.headers[NOISE_LEVEL_HEADER] ?? 0);
        const { plainText, isJson } = crypto.decodeBody(rawData, keyHeader, noiseLevel);
        response.data = isJson ? JSON.parse(plainText) : plainText;
      }
      return response;
    },
    (error) => {
      if (shouldLoading(error.config)) {
        doneLoading();
      }

      // ── 失败重试：5xx / 网络错误时指数退避重试 ──
      const retryConfig = error?.config as
        | (InternalAxiosRequestConfig & { __retryCount?: number; hc?: HttpCryptoConfig })
        | undefined;
      const status = error?.response?.status;
      const canceled = error?.code === "ERR_CANCELED" || error?.name === "CanceledError";
      const method = (retryConfig?.method ?? "get").toUpperCase();
      const signed = Boolean(options.sign && options.signSecret) && method !== "GET";
      const idempotent = IDEMPOTENT_METHODS.has(method);
      const explicitRetry = Boolean(retryConfig?.hc?.retry);
      const retryCount = options.retryCount ?? 0;
      const attempt = retryConfig?.__retryCount ?? 0;

      if (
        retryConfig &&
        !canceled &&
        !signed &&
        (idempotent || explicitRetry) &&
        retryCount > 0 &&
        attempt < retryCount &&
        (status === undefined || status >= 500)
      ) {
        retryConfig.__retryCount = attempt + 1;
        const retryDelay = options.retryDelay ?? 1000;
        const delay = retryDelay * Math.pow(2, attempt);
        return new Promise<AxiosResponse>((resolve, reject) => {
          setTimeout(() => {
            void instance.request(retryConfig).then(resolve, reject);
          }, delay);
        });
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

/** 判断请求体是否属于需要加密的 text/* 内容 */
function isEncryptable(data: unknown): boolean {
  if (data == null) return false;
  if (typeof data === "string") return true;
  if (data instanceof FormData) return false;
  if (data instanceof URLSearchParams) return true;
  if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) return false;
  if (typeof data === "object") return true;
  return false;
}

export type { AxiosRequestConfig, AxiosResponse };