import { getConfig } from "@repo/config";
import {
  generateNonce as generateNonceWasm,
  md5Hash as md5HashWasm,
} from "@repo/codec-wasm";
import type { PureHttpRequestConfig } from "../http/types";

/** 生成随机 nonce（必须由 WASM 生成） */
export const generateNonce = (): string => {
  return generateNonceWasm();
};

/** 需排除的请求参数字段（如 file 等二进制） */
const EXCLUDED_PARAM_KEYS = new Set(["file", "files"]);

/** 收集用于签名的请求参数 */
export function collectParams(
  config: PureHttpRequestConfig,
): Record<string, string> {
  const collected: Record<string, string[]> = {};

  const pushValue = (key: string, raw: unknown) => {
    if (!key) {
      return;
    }
    if (EXCLUDED_PARAM_KEYS.has(key.toLowerCase())) {
      return;
    }
    if (raw === null || raw === undefined || typeof raw === "function") {
      return;
    }
    if (raw instanceof File || raw instanceof Blob) {
      return;
    }
    if (typeof raw === "object") {
      return;
    }
    if (!collected[key]) {
      collected[key] = [];
    }
    collected[key].push(String(raw));
  };

  const add = (key: string, value: unknown) => {
    if (Array.isArray(value)) {
      for (const v of value) {
        pushValue(key, v);
      }
      return;
    }
    pushValue(key, value);
  };

  const params = config.params ?? {};
  for (const key of Object.keys(params)) {
    add(key, (params as Record<string, unknown>)[key]);
  }

  const headers = config.headers ?? {};
  const contentType = String(
    headers["Content-Type"] ?? headers["content-type"] ?? "",
  ).toLowerCase();
  const isFormLike =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  const data = config.data as any;
  if (data instanceof FormData) {
    for (const [key, value] of (data as any).entries()) {
      add(key, value);
    }
  } else if (
    typeof URLSearchParams !== "undefined" &&
    data instanceof URLSearchParams
  ) {
    const tmp: Record<string, string[]> = {};
    for (const [key, value] of data.entries()) {
      if (!tmp[key]) {
        tmp[key] = [];
      }
      tmp[key].push(value);
    }
    for (const key of Object.keys(tmp)) {
      add(key, tmp[key]);
    }
  } else if (isFormLike && data && typeof data === "object") {
    for (const key of Object.keys(data)) {
      add(key, (data as Record<string, unknown>)[key]);
    }
  }

  const filteredParams: Record<string, string> = {};
  for (const key of Object.keys(collected)) {
    filteredParams[key] = collected[key].join(",");
  }
  return filteredParams;
}

/** 默认签名密钥，需与后端 NonceSignProperties.DEFAULT_SECRET 保持一致 */
const DEFAULT_SECRET_KEY = "aP9xL3sV7mQ2zT5kB8nR1cY4wH6eD0fJ";

/** 解析 secretKey（前端从 Request.secretKey 统一读取） */
const resolveSecretKey = (): string => {
  const requestSecret = getConfig("Request.secretKey");
  return (requestSecret as string) || DEFAULT_SECRET_KEY;
};

/** 生成 x-sign（必须由 WASM md5Hash 生成） */
export const generateSign = (
  config: PureHttpRequestConfig,
  timestamp: number,
  nonce: string,
  fingerprint: string,
): string => {
  const filteredParams = collectParams(config);
  const paramPairs = Object.keys(filteredParams)
    .sort()
    .map((k) => `${k}=${filteredParams[k]}`);
  const paramsString = paramPairs.join("&");
  const paramsMd5 = md5HashWasm(paramsString);
  const secretKey = resolveSecretKey();
  const signInput = nonce + fingerprint + timestamp + paramsMd5 + secretKey;
  return md5HashWasm(signInput);
};
