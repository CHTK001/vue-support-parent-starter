/**
 * HTTP 请求加密 / 签名拦截器
 *
 * 全部加解密与签名计算都放在 wasm（CryptoModule）内完成，JS 侧仅做薄封装：
 *  - 请求体（text/*）用随机 AES key 加密后转为二进制，携带 x-ec / x-ck 头
 *  - 可选 x-sign 防重放签名（未配置 signSecret 或 sign=false 时自动跳过）
 *  - 响应若携带 x-ec / x-ck 则用 x-ck 解密还原
 *
 * 用法：
 *   const instance = setupHttpCryptoInterceptor({ crypto, config });
 *   instance.post(...) / instance.request({ ... })
 */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type { CryptoModule } from "./crypto/types";
import NProgress from "./progress";

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
}

/** 单个请求的加密标记（由 axios 链式调用注入） */
export interface HttpCryptoConfig {
  /** 是否加密该请求体（覆盖全局 encrypt） */
  encrypt?: boolean;
  /** 是否显示 loading（覆盖全局 showLoading） */
  showLoading?: boolean;
}

/** 从请求头读取 base64 并转为 Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Uint8Array 转 base64 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** 生成随机 AES key（16 字节） */
function randomKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
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

/** 将请求体序列化为字节（对象转 JSON 字符串） */
function serializeBody(data: unknown): Uint8Array {
  const text =
    typeof data === "string" ? data : JSON.stringify(data);
  return new TextEncoder().encode(text);
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

/** 生成 32 位以上复杂 nonce（与后端 NonceUtils.generateNonce 思路一致） */
function generateNonce(): string {
  const timestamp = Date.now();
  const random = crypto.getRandomValues(new Uint32Array(4));
  const parts = [
    timestamp.toString(36),
    random[0].toString(36),
    random[1].toString(36),
    random[2].toString(36),
    random[3].toString(36),
  ];
  let nonce = parts.join("");
  while (nonce.length < 48) {
    nonce += Math.floor(Math.random() * 36).toString(36);
  }
  return nonce.slice(0, 128);
}

/** 生成设备指纹（首次生成后持久化，避免每次变化导致后端缓存膨胀） */
function generateFingerprint(): string {
  const key = "x-req-fingerprint";
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(key, fp);
  }
  return fp;
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

  instance.interceptors.request.use(async (config) => {
    const hc = (config as InternalAxiosRequestConfig & { hc?: HttpCryptoConfig }).hc;
    const encrypt = hc?.encrypt ?? options.encrypt;
    const showLoading = hc?.showLoading ?? options.showLoading;

    if (showLoading) {
      // 动画开关：showLoading 为 true 时驱动全局 nprogress
      NProgress.start();
    }

    // ── 可选 x-sign 防重放签名 ──
    if (options.sign && options.signSecret && config.method !== "get") {
      const nonce = generateNonce();
      const timestamp = String(Date.now());
      const fingerprint = generateFingerprint();
      const paramsMd5 = options.crypto.md5(
        new TextEncoder().encode(sortParams(collectParams(config))),
      );
      const signInput = `${nonce}${fingerprint}${timestamp}${paramsMd5}${options.signSecret}`;
      const sign = options.crypto.md5(new TextEncoder().encode(signInput));
      config.headers.set(SIGN_NONCE_HEADER, nonce);
      config.headers.set(SIGN_TIMESTAMP_HEADER, timestamp);
      config.headers.set(SIGN_FINGERPRINT_HEADER, fingerprint);
      config.headers.set(SIGN_HEADER, sign);
    }

    // ── 请求体加密：text/* → 二进制 + x-ec / x-ck ──
    if (encrypt && isEncryptable(config.data)) {
      const key = randomKey();
      const cipher = options.crypto.aesEncrypt(serializeBody(config.data), key);
      config.data = cipher;
      config.headers.set(ENCRYPT_HEADER, "1");
      config.headers.set(KEY_HEADER, bytesToBase64(key));
      config.headers.set("Content-Type", "application/octet-stream");
    }

    return config;
  });

  /** 该请求是否显示 loading（请求拦截器已 start，响应需对称 done） */
  const shouldLoading = (config?: InternalAxiosRequestConfig): boolean => {
    const hc = (config as InternalAxiosRequestConfig & { hc?: HttpCryptoConfig } | undefined)?.hc;
    return hc?.showLoading ?? options.showLoading;
  };

  instance.interceptors.response.use(
    async (response) => {
      if (shouldLoading(response.config)) {
        NProgress.done();
      }

      const encryptHeader = response.headers[ENCRYPT_HEADER];
      const keyHeader = response.headers[KEY_HEADER];
      if (encryptHeader === "1" && keyHeader && response.data) {
        let data =
          typeof response.data === "string"
            ? base64ToBytes(response.data)
            : (response.data as Uint8Array);

        // 按 x-ot 冗余等级剔除密文前后噪声
        const noiseLevel = Number(response.headers[NOISE_LEVEL_HEADER] ?? 0);
        if (noiseLevel > 0) {
          data = data.slice(noiseLevel, data.length - noiseLevel);
        }

        const plain = options.crypto.aesDecrypt(data, base64ToBytes(keyHeader));
        try {
          response.data = JSON.parse(new TextDecoder().decode(plain));
        } catch {
          response.data = new TextDecoder().decode(plain);
        }
      }
      return response;
    },
    (error) => {
      if (shouldLoading(error.config)) {
        NProgress.done();
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export type { AxiosRequestConfig, AxiosResponse };
