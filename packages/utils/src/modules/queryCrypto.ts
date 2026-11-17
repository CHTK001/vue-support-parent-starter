/**
 * 地址栏查询参数加密 / 脱敏（URL hash query）
 *
 * 收口点：vue-router 的 {@link createRouter} options {@link parseQuery} /
 * {@link stringifyQuery}（在 packages/core/src/router 的 createAppRouter 里注入）。
 *
 * 约定：页面 / 组件读 route.query 永远拿到明文；触发导航、点链接、
 * 新窗口打开时由路由层统一加密，地址栏里只出现密文（`enc1~<hex>`）；
 * 旧链接（明文）不改动也能正常解析（解密失败时原样返回）。
 *
 * 算法与后端 {@code AesCbcCodec} 完全一致：key/iv 均由 SHA-256(口令) 派生，
 * AES-256-CBC + PKCS7，线上载荷为 hex。与 {@link encodeRequestBody} 复用
 * 同一套加密实现（相当于把 `plaintext` 视为单个请求体字段）。
 *
 * 前缀 {@link QUERY_CIPHER_PREFIX}：`~` 属于 RFC3986 unreserved 字符，不会被
 * URL 编码改写，用它来区分「本模块加密的密文」与历史明文。
 *
 * 注意：这是「地址栏可读性降级」，不是身份认证。如需防篡改请依赖后端接口。
 */
import { encodeRequestBody, decryptAesHex } from "./codec";
import type { LocationQueryRaw, LocationQueryValueRaw } from "vue-router";

/** 密文前缀：`enc1~<hex>`。`~` 是 URL unreserved 字符，不会被二次转义 */
export const QUERY_CIPHER_PREFIX = "enc1~";

/** 默认口令：未在配置里指定时使用。仅用于地址栏脱敏，不能替代真实密钥。 */
export const DEFAULT_QUERY_CRYPTO_KEY = "chua.web.url.query.v1";

/** 地址栏加密配置 */
export interface QueryCryptoOptions {
  /** 是否开启（默认 true） */
  enabled?: boolean;
  /** 口令（默认见 {@link DEFAULT_QUERY_CRYPTO_KEY}；建议在 app.yaml 的
   *  `route.queryCrypto.key` 覆盖） */
  key?: string;
  /** 保持明文的参数名：这些参数经过路由层时不作加密也不作解密 */
  plainKeys?: string[];
}

/** 默认不加密的参数：外部回跳、第三方 OAuth、Apm 页签、手工操作 location 的场景 */
export const DEFAULT_QUERY_PLAIN_KEYS: readonly string[] = [
  // 三方回跳参数快照（见 packages/core/src/thirdCallback.ts）：启动期直接读
  // location.search / location.hash，必须明文到达（外部 302 下发）
  "redirectParam",
  "thirdMsg",
  "redirect",
  // OAuth 回调标准参数：第三方服务直发，用途由服务端定义
  "code",
  "state",
  "error",
  "error_description",
  "error_uri",
  "scope",
  // Apm 工作台：页签名 / 弹窗标记由组件内 replaceState 手工写 hash，不走路由层
  "tab",
  "popout",
  // 文件管理：分发 / 预览标记由页面直接读写 location（search 与 hash），必须明文
  "distribute",
  "preview",
];

/** query 单值 / 多值类型（与 vue-router 的 LocationQueryRaw 对齐） */
type QueryValueRaw = LocationQueryValueRaw | LocationQueryValueRaw[];

/** 从配置里解析出最终口令 */
export function resolveQueryCryptoKey(options: QueryCryptoOptions): string {
  return options?.key ?? DEFAULT_QUERY_CRYPTO_KEY;
}

/** 判断某个参数是否应该保持明文 */
function isPlainKey(key: string, plainKeys: readonly string[]): boolean {
  return plainKeys.includes(key);
}

/**
 * 加密单个值：明文为空不加密（URL 空值可省略）；已是密文直接返回（幂等）。
 * 供非路由层的 URL 拼接场景复用（如 window.open 的手工拼参）。
 */
export function encryptQueryValue(value: string, options: QueryCryptoOptions = {}): string {
  const text = String(value ?? "");
  if (!text) return text;
  if (text.startsWith(QUERY_CIPHER_PREFIX)) return text;
  return QUERY_CIPHER_PREFIX + encodeRequestBody(text, { type: "aes", key: resolveQueryCryptoKey(options) });
}

/**
 * 解密地址栏值：有前缀才尝试解密；解不开或空值返回原值（兼容历史明文链接）。
 */
export function decryptQueryValue(value: string, options: QueryCryptoOptions = {}): string {
  const text = String(value ?? "");
  if (!text.startsWith(QUERY_CIPHER_PREFIX)) return text;
  const plain = decryptAesHex(text.slice(QUERY_CIPHER_PREFIX.length), resolveQueryCryptoKey(options));
  return plain || text;
}

/**
 * 路由 query 对象 → 地址栏可见的密文对象（只加密业务 id 类参数）。
 *
 * @example
 * ```ts
 * // 路由侧：stringifyQuery 收到 { releaseId: "5", tab: "logs" }
 * // 输出：{ releaseId: "enc1~abc123...", tab: "logs" }
 * ```
 */
export function encodeQueryObject(
  query: LocationQueryRaw | undefined,
  options: QueryCryptoOptions = {},
): LocationQueryRaw {
  const keyText = resolveQueryCryptoKey(options);
  const plainKeys = options.plainKeys ?? DEFAULT_QUERY_PLAIN_KEYS;
  const out: LocationQueryRaw = {};
  for (const [k, v] of Object.entries(query ?? {})) {
    out[k] = encodeValue(k, v, keyText, plainKeys);
  }
  return out;
}

/**
 * 路由可读的明文对象：带密文前缀的参数解密（失败原样返回），白名单参数不动。
 */
export function decodeQueryObject(
  query: LocationQueryRaw | undefined,
  options: QueryCryptoOptions = {},
): LocationQueryRaw {
  const keyText = resolveQueryCryptoKey(options);
  const out: LocationQueryRaw = {};
  for (const [k, v] of Object.entries(query ?? {})) {
    out[k] = decodeValue(v, keyText);
  }
  return out;
}

/** 加密单个标量值：白名单保持明文，已有密文前缀的直接返回（幂等） */
function encodeSingle(key: string, value: unknown, keyText: string, plainKeys: readonly string[]): LocationQueryValueRaw {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : String(value);
  if (!text) return text;
  if (isPlainKey(key, plainKeys)) return text;
  if (text.startsWith(QUERY_CIPHER_PREFIX)) return text;
  return QUERY_CIPHER_PREFIX + encodeRequestBody(text, { type: "aes", key: keyText });
}

/** 加密单个键值：数组值逐项加密 */
function encodeValue(key: string, value: unknown, keyText: string, plainKeys: readonly string[]): QueryValueRaw {
  if (Array.isArray(value)) {
    return value.map((item) => encodeSingle(key, item, keyText, plainKeys));
  }
  return encodeSingle(key, value, keyText, plainKeys);
}

/** 解密单个标量值：带前缀才尝试，解不开原样返回（兼容历史明文） */
function decodeSingle(value: unknown, keyText: string): LocationQueryValueRaw {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : String(value);
  if (text.startsWith(QUERY_CIPHER_PREFIX)) {
    const plain = decryptAesHex(text.slice(QUERY_CIPHER_PREFIX.length), keyText);
    if (plain) return plain;
  }
  return text;
}

/** 解密单个键值：数组值逐项解密 */
function decodeValue(value: unknown, keyText: string): QueryValueRaw {
  if (Array.isArray(value)) {
    return value.map((item) => decodeSingle(item, keyText));
  }
  return decodeSingle(value, keyText);
}
