/**
 * Socket 公共工具函数
 *
 * @author CH
 * @version 2.0.0
 * @since 2024-12-25
 */

import { sm2 } from "sm-crypto";

/**
 * Socket消息数据结构
 * 后端发送的数据格式
 */
export interface SocketMessageWrapper {
  data: string;
  encrypted: boolean;
  timestamp: string;
  uuid?: string;
  dataId?: string | number;
  requestId?: string | number;
}

type SocketComparableField = "dataId" | "requestId";

const SOCKET_ENCRYPTED_PREFIX = "02";
const SOCKET_STATUS_SEGMENT_LENGTH = 3;
const SOCKET_SUFFIX_LENGTH = 4;

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const SOCKET_FIELD_ALIASES: Record<SocketComparableField, string[]> = {
  dataId: ["dataId", "dataID", "data_id"],
  requestId: ["requestId", "requestID", "request_id", "reqId"],
};

function readSocketComparableValue(
  source: unknown,
  field: SocketComparableField,
): string | number | undefined {
  if (!isRecord(source)) {
    return undefined;
  }

  for (const key of SOCKET_FIELD_ALIASES[field]) {
    const directValue = source[key];
    if (typeof directValue === "string" || typeof directValue === "number") {
      return directValue;
    }
  }

  const nestedData = source.data;
  if (isRecord(nestedData)) {
    for (const key of SOCKET_FIELD_ALIASES[field]) {
      const nestedValue = nestedData[key];
      if (typeof nestedValue === "string" || typeof nestedValue === "number") {
        return nestedValue;
      }
    }
  }

  return undefined;
}

function enrichParsedSocketPayload(
  payload: unknown,
  wrapper: SocketMessageWrapper,
): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const nextPayload = { ...payload };
  const dataId =
    readSocketComparableValue(nextPayload, "dataId") ?? wrapper.dataId;
  const requestId =
    readSocketComparableValue(nextPayload, "requestId") ?? wrapper.requestId;

  if (dataId !== undefined && nextPayload.dataId === undefined) {
    nextPayload.dataId = dataId;
  }
  if (requestId !== undefined && nextPayload.requestId === undefined) {
    nextPayload.requestId = requestId;
  }
  if (wrapper.uuid !== undefined && nextPayload.uuid === undefined) {
    nextPayload.uuid = wrapper.uuid;
  }
  if (wrapper.timestamp !== undefined && nextPayload.timestamp === undefined) {
    nextPayload.timestamp = wrapper.timestamp;
  }

  return nextPayload;
}

function decodeEncryptedSocketMessage(wrapper: SocketMessageWrapper): unknown {
  if (typeof wrapper.data !== "string") {
    return wrapper;
  }

  const payload = wrapper.data;
  if (!payload.startsWith(SOCKET_ENCRYPTED_PREFIX)) {
    return tryParseJson(payload);
  }

  const keyLength = Number.parseInt(String(wrapper.timestamp || ""), 10);
  const minPayloadLength =
    SOCKET_ENCRYPTED_PREFIX.length +
    keyLength +
    SOCKET_STATUS_SEGMENT_LENGTH +
    SOCKET_SUFFIX_LENGTH;
  if (
    !Number.isFinite(keyLength) ||
    keyLength <= 0 ||
    payload.length < minPayloadLength
  ) {
    return wrapper;
  }

  const transportKey = payload.substring(
    SOCKET_ENCRYPTED_PREFIX.length,
    SOCKET_ENCRYPTED_PREFIX.length + keyLength,
  );
  const encryptedSegment = payload.substring(
    SOCKET_ENCRYPTED_PREFIX.length + keyLength + SOCKET_STATUS_SEGMENT_LENGTH,
    payload.length - SOCKET_SUFFIX_LENGTH,
  );
  const cipherText =
    encryptedSegment.length > 2
      ? encryptedSegment.substring(2)
      : encryptedSegment;

  try {
    const plainText = sm2.doDecrypt(cipherText, transportKey, 0);
    return tryParseJson(plainText);
  } catch (error) {
    console.warn("[SocketUtils] 解密 Socket 消息失败:", error);
    return wrapper;
  }
}

const SOCKET_WILDCARD_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

function getSocketRuntimeHostname(explicitHostname?: string): string | null {
  if (explicitHostname?.trim()) {
    return explicitHostname.trim();
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.location.hostname || null;
}

/**
 * 将不可路由的 Socket 地址主机替换为当前页面主机，避免服务端下发 0.0.0.0
 */
export function normalizeSocketUrl(
  rawUrl: string,
  runtimeHostname?: string,
): string {
  const urlText = rawUrl?.trim();
  if (!urlText) {
    return rawUrl;
  }

  const baseOrigin =
    typeof window !== "undefined" ? window.location.origin : undefined;

  try {
    const url = baseOrigin ? new URL(urlText, baseOrigin) : new URL(urlText);
    if (!SOCKET_WILDCARD_HOSTS.has(url.hostname)) {
      return url.toString();
    }

    const resolvedHostname = getSocketRuntimeHostname(runtimeHostname);
    if (!resolvedHostname) {
      return url.toString();
    }

    url.hostname = resolvedHostname;
    return url.toString();
  } catch {
    return urlText;
  }
}

export function normalizeSocketUrls(
  urls: string[],
  runtimeHostname?: string,
): string[] {
  return urls
    .map((item) => normalizeSocketUrl(item, runtimeHostname))
    .filter(Boolean);
}

/**
 * 解析Socket消息数据
 * 处理后端发送的加密/非加密数据格式
 *
 * @param rawData 原始数据
 * @returns 解析后的数据对象
 */
export function parseSocketMessage(rawData: unknown): unknown {
  try {
    // 如果是空值或空字符串，直接返回
    if (rawData === null || rawData === undefined || rawData === "") {
      return rawData;
    }

    // 如果是字符串，先解析为对象
    const wrapper: SocketMessageWrapper | string =
      typeof rawData === "string"
        ? (() => {
            try {
              return JSON.parse(rawData) as SocketMessageWrapper;
            } catch {
              return rawData;
            }
          })()
        : (rawData as SocketMessageWrapper);

    if (typeof wrapper === "string") {
      return wrapper;
    }

    // 检查是否为新格式（包含 encrypted 字段）
    if (wrapper && typeof wrapper.encrypted === "boolean") {
      if (wrapper.encrypted) {
        return enrichParsedSocketPayload(
          decodeEncryptedSocketMessage(wrapper),
          wrapper,
        );
      } else {
        // 非加密数据，解析 data 字段
        if (typeof wrapper.data === "string") {
          return enrichParsedSocketPayload(tryParseJson(wrapper.data), wrapper);
        }
        return enrichParsedSocketPayload(wrapper.data, wrapper);
      }
    }

    // 兼容旧格式，直接返回
    return wrapper;
  } catch (error) {
    console.error("[SocketUtils] 解析Socket消息失败:", error);
    return rawData;
  }
}

export function matchesSocketListenOptions(
  parsedData: unknown,
  options?: {
    dataId?: string | number;
    requestId?: string | number;
  },
  rawData?: unknown,
): boolean {
  if (!options) {
    return true;
  }

  if (options.dataId !== undefined) {
    const dataId =
      readSocketComparableValue(parsedData, "dataId") ??
      readSocketComparableValue(rawData, "dataId");
    if (String(dataId) !== String(options.dataId)) {
      return false;
    }
  }

  if (options.requestId !== undefined) {
    const requestId =
      readSocketComparableValue(parsedData, "requestId") ??
      readSocketComparableValue(rawData, "requestId");
    if (String(requestId) !== String(options.requestId)) {
      return false;
    }
  }

  return true;
}

/**
 * 构建带认证的URL
 *
 * @param baseUrl 基础URL
 * @param token 访问令牌
 * @param query 额外查询参数
 * @returns 完整URL
 */
export function buildAuthUrl(
  baseUrl: string,
  token?: string,
  query?: Record<string, string>,
): string {
  const url = new URL(baseUrl);
  if (token) {
    url.searchParams.set("x-oauth-token", token);
  }
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

/**
 * 将HTTP URL转换为WebSocket URL
 *
 * @param httpUrl HTTP URL
 * @returns WebSocket URL
 */
export function toWebSocketUrl(httpUrl: string): string {
  return normalizeSocketUrl(httpUrl).replace(/^http/, "ws");
}
