import { getConfig } from "@repo/config";
import {
  generateNonce as generateNonceWasm,
  md5Hash as md5HashWasm,
} from "@repo/codec-wasm";
import CryptoJS from "crypto-js";
import type { PureHttpRequestConfig } from "../http/types";
import { resolveRequestSecretKey } from "./config-resolver";

const jsMd5Hash = (value: string): string => CryptoJS.MD5(value).toString();

const jsGenerateNonce = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }

  let nonce = "";
  while (nonce.length < 32) {
    nonce += Math.random().toString(36).slice(2);
  }
  return nonce.slice(0, 32);
};

const isWasmNotReadyError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("WASM 未就绪");

const safeMd5Hash = (value: string): string => {
  try {
    return md5HashWasm(value);
  } catch (error) {
    if (!isWasmNotReadyError(error)) {
      console.warn("[http-sign] md5HashWasm failed, fallback to JS md5:", error);
    }
    return jsMd5Hash(value);
  }
};

/** 生成随机 nonce（必须由 WASM 生成） */
export const generateNonce = (): string => {
  try {
    return generateNonceWasm();
  } catch (error) {
    if (!isWasmNotReadyError(error)) {
      console.warn("[http-sign] generateNonceWasm failed, fallback to JS nonce:", error);
    }
    return jsGenerateNonce();
  }
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

/** 解析 secretKey（优先 Request.secretKey，其次兼容旧版 top-level secretKey） */
const resolveSecretKey = (): string => {
  return resolveRequestSecretKey(getConfig(), DEFAULT_SECRET_KEY);
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
  const paramsMd5 = safeMd5Hash(paramsString);
  const secretKey = resolveSecretKey();
  const signInput = nonce + fingerprint + timestamp + paramsMd5 + secretKey;
  return safeMd5Hash(signInput);
};
