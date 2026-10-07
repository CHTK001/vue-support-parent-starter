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
import { getAccessToken, clearAllAuthData } from "@repo/utils";
import { getRouter, hasRouter } from "./router/inject";
import { startLoading, doneLoading } from "./progress";
import { upgrade, getStorageKey, getConfig, LOGIN_URL } from "@repo/config";
import { msgError, setSuppressNextMsg } from "./msg";
import {
  SESSION_EPOCH_FIELD,
  isSessionAborted,
  isStaleEpoch,
  markSessionAborted,
  sessionEpoch,
  sessionSignal,
} from "./session-scope";
import i18n from "@repo/languages";
import { ElMessageBox } from "element-plus";

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

/**
 * 需要重新登录的业务码：令牌失效、账号被禁用/锁定/过期、密码过期
 * 不含 A0403S0001（仅本次操作无权限，会话仍然有效）
 */
const RELOGIN_CODES = new Set([
  "A0403S0000",
  "A0403S0002",
  "A0403S0003",
  "A0403S0004",
  "A0403S0005",
]);

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
  /** 静默失败提示（单请求禁用 toast，仍 reject） */
  noToast?: boolean;
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

/**
 * 生成随机十六进制串。
 *
 * <p>这里刻意不直接用 {@code crypto.randomUUID()}：它只在**安全上下文**可用
 * （HTTPS，或 localhost）。用「局域网 IP + 明文 HTTP」打开应用时（例如
 * {@code http://192.168.50.101:8848}）它是 {@code undefined}，会让
 * {@link generateFingerprint} 抛「crypto.randomUUID is not a function」，
 * 整条请求链路（含设备指纹签名）在发出前就中断，页面表现为所有接口静默失败。</p>
 *
 * <p>{@code crypto.getRandomValues} 挂在 {@code Crypto} 而非
 * {@code SubtleCrypto} 上，**不受安全上下文限制**，作为主路径；
 * 再兜一层 {@code Math.random} 应付连 {@code crypto} 都不存在的环境。</p>
 *
 * @param byteLength 随机字节数，返回的十六进制串长度为 byteLength * 2
 * @return 小写十六进制随机串
 */
function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  const c: Crypto | undefined = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/** 生成设备指纹（首次生成后持久化，避免每次变化导致后端缓存膨胀；按 app 命名空间隔离） */
let cachedFingerprint: string | null = null;
function generateFingerprint(): string {
  if (cachedFingerprint) return cachedFingerprint;
  const key = getStorageKey("x-req-fingerprint");
  let fp = localStorage.getItem(key);
  if (!fp) {
    // 32 个十六进制字符 = 128 bit，与去掉连字符的 UUID v4 同等强度
    fp = randomHex(16);
    localStorage.setItem(key, fp);
  }
  cachedFingerprint = fp;
  return fp;
}

/**
 * API 响应体结构（后端统一返回）
 */
interface ApiResponseBody {
  code?: string;
  msg?: string;
  message?: string;
  success?: boolean;
  ok?: boolean;
  [key: string]: unknown;
}

/** 判断响应是否为失败状态（不满足成功码 / success=false / ok=false） */
function isApiError(data: unknown): data is ApiResponseBody {
  if (!data || typeof data !== "object") return false;
  const d = data as ApiResponseBody;
  if (d.success === false || d.ok === false) return true;
  const cfg = getConfig();
  const successCode = cfg.http?.toast?.successCode ?? "00000";
  // 兼容多成功码（与 request.ts unwrap 语义一致）：00000 / 200 / 0 / success / ok
  const SUCCESS_CODES = new Set(["00000", "200", "0", "success", "ok", "true", "1"]);
  if (d.code && !SUCCESS_CODES.has(String(d.code).toLowerCase()) && String(d.code) !== String(successCode)) {
    return true;
  }
  return false;
}

/** 判断失败响应是否应静默处理（不弹提示但仍 reject） */
function isSilentError(data: ApiResponseBody): boolean {
  const cfg = getConfig();
  const skip = cfg.http?.toast?.skipCodeList ?? [];
  return skip.includes(data.code ?? "");
}

/** 相同错误文案的合并窗口（毫秒） */
const RECENT_ERROR_MS = 1500;
const recentErrorToast = new Map<string, number>();

/**
 * 认领一次错误提示：同一文案在窗口期内只允许第一次通过
 *
 * 一次页面刷新往往并发多个请求，同一后端故障会返回完全相同的 msg，
 * 不去重就会叠出 N 条一样的红条。调用方拿到 false 时应完全静默（连带跳过抑制标记）。
 */
function claimErrorToast(msg: string): boolean {
  const now = Date.now();
  for (const [key, at] of recentErrorToast) {
    if (now - at > RECENT_ERROR_MS) recentErrorToast.delete(key);
  }
  if (recentErrorToast.has(msg)) return false;
  recentErrorToast.set(msg, now);
  return true;
}

/** 统一响应校验：失败时弹提示 + reject，成功时透传 */
function checkApiResponse(
  response: AxiosResponse<unknown>,
  noToast: boolean,
): AxiosResponse<unknown> | Promise<AxiosResponse<unknown>> {
  const data = response.data;
  if (isApiError(data)) {
    const cfg = getConfig();
    const toastEnable = cfg.http?.toast?.enable ?? true;
    const rawMsg = data.msg || data.message;
    if (toastEnable && !noToast && !isSilentError(data)) {
      const msg = rawMsg || i18n.global.t("msg.requestFailed");
      if (claimErrorToast(msg)) msgError(msg);
    }
    // 这里必须 reject 一个**真正的 Error**。
    // 早前是 `Promise.reject({ code, msg, message, success, ok })` —— 一个裸对象，
    // 于是所有 `e instanceof Error ? e.message : String(e)` 的调用方（本仓几十处）
    // 都拿到 `String(Object)` = "[object Object]"，把后端提示整段吞掉：
    // 实测学生登录页密码框下方那行红字就是它，而接口其实返回的是
    // 「学号或家长手机号不存在，还剩 N 次尝试机会」。
    // 用 Object.assign 把原有字段挂回 Error 实例，`err.code / err.msg / err.success / err.ok`
    // 的既有调用方无需改动；同时 `e.message` 也有了可读文案。
    const err = new Error(rawMsg || i18n.global.t("msg.requestFailed")) as Error & {
      code?: unknown;
      msg?: string;
      success?: boolean;
      ok?: boolean;
    };
    err.code = data.code;
    err.msg = rawMsg;
    err.success = data.success;
    err.ok = data.ok;
    return Promise.reject(err);
  }
  // 解内层业务包装：后端分页接口返回 {code:"00000", data:{code:0, data:{total,data}}}，
  // 把内层 {code:0, data:{...}} 展平为 {code:"00000", data:{...}}，让业务侧 res.data 直接拿到业务数据。
  try {
    if (data && typeof data === "object" && "data" in data &&
        data.data && typeof data.data === "object" && "code" in data.data) {
      const inner = data.data as Record<string, unknown>;
      if (inner.code === 0 || inner.code === "0" || inner.code === 200 || inner.code === "200") {
        data.data = inner.data;
      }
    }
  } catch { /* ignore */ }
  return response;
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

    // 会话作用域：挂上当前 signal（登出时一次性中断所有在途请求），
    // 并记下发起时的世代号，响应回来时可判断「这属于上一个会话」。
    // 调用方若已自带 signal / signal 支持 abort，则保留调用方的意图。
    const internal = config as InternalAxiosRequestConfig & Record<string, unknown>;
    if (!internal.signal) {
      internal.signal = sessionSignal();
    }
    if (internal[SESSION_EPOCH_FIELD] === undefined) {
      internal[SESSION_EPOCH_FIELD] = sessionEpoch();
    }

    if (showLoading) {
      startLoading();
    }

    // 默认从框架 storage 读取 token 并注入 Authorization（已有则保留）。
    //
    // 但**调用方已自带 x-oauth-token 时不再注入**：文件存储网关（独立端口 18080）
    // 的令牌入口就是 x-oauth-token，而服务端解析顺序是
    // 「自定义头 -> Authorization Bearer -> 查询参数 -> Cookie」，任一命中即通过。
    // 两个都发等于把同一份令牌重复传输两遍：请求头更大、
    // CORS 预检的 Access-Control-Request-Headers 列表更长，两处不一致时还难排查。
    // 其它客户端（不设 x-oauth-token）行为不变，仍走 Authorization。
    if (!config.headers.has("Authorization") && !config.headers.has("x-oauth-token")) {
      const token = getAccessToken();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // 设备指纹：独立于签名开关，所有请求都注入稳定指纹，供登录日志/系统日志关联浏览器
    const fingerprint = generateFingerprint();
    if (!config.headers.has(SIGN_FINGERPRINT_HEADER)) {
      config.headers.set(SIGN_FINGERPRINT_HEADER, fingerprint);
    }

    // 重试请求：跳过重新签名/加密，直接复用首次生成的密文与签名头
    const isRetry = ((config as InternalAxiosRequestConfig & { __retryCount?: number }).__retryCount ?? 0) > 0;

    // ── 可选 x-sign 防重放签名（算法在 wasm 内） ──
    if (!isRetry && options.sign && options.signSecret && config.method !== "get") {
      const nonce = crypto.generateNonce();
      const timestamp = String(Date.now());
      const sorted = sortParams(collectParams(config));
      const sign = crypto.signRequest(sorted, nonce, fingerprint, timestamp, options.signSecret);
      config.headers.set(SIGN_NONCE_HEADER, nonce);
      config.headers.set(SIGN_TIMESTAMP_HEADER, timestamp);
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

      // 统一响应校验：失败弹提示 + reject，成功透传
      const hc = (response.config as InternalAxiosRequestConfig & { hc?: HttpCryptoConfig })?.hc;
      const noToast = hc?.noToast ?? false;
      return checkApiResponse(response, noToast);
    },
    (error) => {
      if (shouldLoading(error.config)) {
        doneLoading();
      }

      // ── 会话已作废（登出 / 换人登录）导致的取消：静默处理 ──
      // 这批请求带着旧令牌发出，401 / 取消都属于「预期之内」。若走下面的通用分支，
      // 会连着弹出 N 个「登录已失效」确认框，并调 clearAllAuthData() 把用户
      // 刚刚登录好的新会话一起清掉（表现为登录后立刻又被踢回登录页）。
      const errorConfig = (error?.config ?? undefined) as (Record<string, unknown> | undefined);
      if (
        isSessionAborted(error) ||
        isStaleEpoch(errorConfig?.[SESSION_EPOCH_FIELD] as number | undefined)
      ) {
        return Promise.reject(markSessionAborted(error));
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
      const hc = (retryConfig?.hc ?? {}) as HttpCryptoConfig;
      const hcRetry = hc.retry;
      const explicitRetry = hcRetry === true;
      const explicitNoRetry = hcRetry === false;
      const retryCount = options.retryCount ?? 0;
      const attempt = retryConfig?.__retryCount ?? 0;
      const noToast = hc.noToast ?? false;
      const toastEnable = getConfig().http?.toast?.enable ?? true;
      const willRetry =
        retryConfig &&
        !canceled &&
        !signed &&
        !explicitNoRetry &&
        (idempotent || explicitRetry) &&
        retryCount > 0 &&
        attempt < retryCount &&
        (status === undefined || status >= 500);

      // 502/5xx 错误提示：仅在不再重试时显示（重试期间不弹，避免重复打扰）
      if (!willRetry && !canceled && !noToast && toastEnable) {
        const msg = (() => {
          if (status === 502) return i18n.global.t("msg.http.serverBusy");
          if (status === 503) return i18n.global.t("msg.http.serverUnavailable");
          if (status === 504) return i18n.global.t("msg.http.serverTimeout");
          if (status >= 500) return i18n.global.t("msg.http.serverError");
          if (error?.code === "ERR_NETWORK" || /network/i.test(error?.message ?? "")) return i18n.global.t("msg.http.networkError");
          return "";
        })();
        if (msg) {
          if (claimErrorToast(msg)) {
            setSuppressNextMsg(true);
            msgError(msg);
          }
          if (error) {
            error.__toasted = true;
            // 清除原始错误信息，防止调用方 ElMessage.error 直接展示原始错误
            (error as any).message = undefined;
          }
        }
      }

      // 401/403 未授权/无权限：跳转登录页，加锁防止重复弹窗
      const bizCode = (error?.response?.data as { code?: string } | undefined)?.code;
      // 只有会话失效才需要重新登录：401，或后端明确给出重新登录业务码；
      // 其余 403 是「越权/无权限」，登录态仍然有效，交给调用方按普通业务错误提示
      const sessionExpired = status === 401 || Boolean(bizCode && RELOGIN_CODES.has(bizCode));
      if ((status === 401 || status === 403) && sessionExpired) {
        const loginUrl = getConfig().route?.loginPath || LOGIN_URL || "/login";
        const action = getConfig().http?.authFailAction || "confirm";
        // 应用部署在子路径时，登录页要拼上 base，否则跳出应用
        const loginHref = (import.meta.env.BASE_URL || "/") + loginUrl.replace(/^\//, "");
        // 会话已失效：清掉本地令牌，否则守卫会凭旧令牌把用户弹回首页反复 403
        clearAllAuthData();
        // 去登录页：优先走已注入的 vue-router。hash 模式（#/login）下直接改 pathname
        // 会丢掉 hash，SPA 只会落回首页而到不了登录页；无 router（React / 尚未挂载）时
        // 才退化为整页 replace，拼接 base 保证子路径部署不跳出应用。
        const gotoLogin = (): void => {
          if (hasRouter()) {
            const router = getRouter();
            // 已在登录页时跳过重复导航（幂等），避免 NavigationDuplicated 与死循环
            if (router.currentRoute.value.path !== loginUrl) {
              void router.replace(loginUrl).catch(() => {
                /* 并发 401 导致的重复/取消导航，忽略即可 */
              });
            }
            return;
          }
          window.location.replace(loginHref);
        };
        // 如果当前已经在登录页，就不弹了（精确匹配登录页完整路径，
        // 不能用 includes("/login")，否则会误匹配业务路由，如 /system/manage/login）
        const currentPath = window.location.pathname;
        const __baseNoSlash = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
        const __loginFullPath = __baseNoSlash + "/" + loginUrl.replace(/^\//, "");
        const isOnLoginPage =
          currentPath === __loginFullPath || currentPath === __loginFullPath + "/";
        if (action === "redirect") {
          gotoLogin();
        } else if (!isOnLoginPage && !getAccessToken()) {
          // 本地压根没有令牌：属于未登录访客，弹窗只会反复打扰，直接静默去登录页
          gotoLogin();
        } else if (!isOnLoginPage) {
          // 防止多个请求同时 403 导致弹窗叠在一起
          if (!(window as any).__authDialogOpen) {
            (window as any).__authDialogOpen = true;
            ElMessageBox.confirm(
              status === 401 ? "登录已过期，请重新登录" : "当前操作没有权限，请重新登录",
              "提示",
              {
                confirmButtonText: "重新登录",
                showCancelButton: false,
                closeOnClickModal: false,
                type: "warning",
              }
            ).then(() => {
              gotoLogin();
            }).finally(() => {
              (window as any).__authDialogOpen = false;
            });
          }
        }
        return Promise.reject(error);
      }

      if (willRetry) {
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