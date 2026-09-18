/**
 * Socket 公共工具函数
 *
 * 提供消息解析（JSON / 后端包装格式）、URL 规范化、鉴权 URL 构建等，
 * 供各协议实现复用。加密消息解密通过 setSocketDecryptor 注入（默认原样返回）。
 *
 * 用法：
 *   setSocketTokenProvider(() => token.getAccessToken());
 *   parseSocketMessage(raw);          // 解析后端推送的 socket 消息
 *   toWebSocketUrl("http://x/ws");    // http → ws 协议
 */
import type { ProtocolType, SocketMessage, SocketTemplateListenOptions } from "./socketTemplate";
import { log } from "@repo/utils";

/** Socket 消息包装结构（后端推送的数据格式） */
export interface SocketMessageWrapper {
  data: string;
  encrypted: boolean;
  timestamp: string;
  uuid?: string;
  dataId?: string | number;
  requestId?: string | number;
}

/** socket 鉴权 token 获取函数（createApp 装配时注入） */
let socketTokenProvider: () => string = () => "";

/** 注入 socket 鉴权 token 获取函数 */
export function setSocketTokenProvider(provider: () => string): void {
  socketTokenProvider = provider;
}

/** 读取当前 socket 鉴权 token */
export function getSocketToken(): string {
  return socketTokenProvider();
}

/** 加密消息解密函数（返回解析后的明文） */
type SocketDecryptor = (wrapper: SocketMessageWrapper) => unknown;

/** 加密消息解密器（默认空：不额外处理，直接返回 wrapper） */
let socketDecryptor: SocketDecryptor | null = null;

/** 注入加密消息解密器（后端 socket 消息若走 sm2/aes 加密，由业务方注入） */
export function setSocketDecryptor(decryptor: SocketDecryptor | null): void {
  socketDecryptor = decryptor;
}

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

const SOCKET_FIELD_ALIASES: Record<string, string[]> = {
  dataId: ["dataId", "dataID", "data_id"],
  requestId: ["requestId", "requestID", "request_id", "reqId"],
};

function readSocketComparableValue(
  source: unknown,
  field: string,
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
  if (socketDecryptor) {
    try {
      return socketDecryptor(wrapper);
    } catch (error) {
      log.warn(`[SocketUtils] 解密 Socket 消息失败:`, error);
      return wrapper;
    }
  }
  // 未注入解密器时原样返回（保留加密字段，由业务方处理）
  return wrapper;
}

/** 判断 Socket 消息是否可比较（dataId/requestId 过滤用） */
export function matchesSocketListenOptions(
  parsedData: unknown,
  options?: SocketTemplateListenOptions,
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
 * 解析 Socket 消息数据
 * 处理后端推送的加密/非加密数据格式，返回解析后的数据对象
 *
 * @param rawData 原始数据
 * @returns 解析后的数据对象
 */
export function parseSocketMessage(rawData: unknown): unknown {
  try {
    if (rawData === null || rawData === undefined || rawData === "") {
      return rawData;
    }

    // 字符串先尝试解析为对象
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

    // 新格式（包含 encrypted 字段）
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
    log.error(`[SocketUtils] 解析Socket消息失败:`, error);
    return rawData;
  }
}

/** 不可路由的主机（后端可能下发 0.0.0.0，需替换为当前页面主机） */
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
 *
 * @param rawUrl 原始地址
 * @param runtimeHostname 运行时主机名（缺省取当前页面）
 * @returns 规范化后的地址
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

/**
 * 从 URL 中提取协议类型（用于前端根据 URL 自动识别协议）
 * 支持: sse://, socket://, ws://, wss://, http://, https://
 */
export function extractProtocolType(url: string | undefined | null): ProtocolType {
  if (!url) {
    return "sse";
  }
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("sse://")) {
    return "sse";
  }
  if (trimmed.startsWith("socket://")) {
    return "socketio";
  }
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return "websocket";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return "sse";
  }
  return "sse";
}


/** 批量规范化地址列表 */
export function normalizeSocketUrls(
  urls: string[],
  runtimeHostname?: string,
): string[] {
  return urls
    .map((item) => normalizeSocketUrl(item, runtimeHostname))
    .filter(Boolean);
}

/**
 * 构建带认证的 URL
 *
 * @param baseUrl 基础 URL
 * @param token 访问令牌
 * @param query 额外查询参数
 * @returns 完整 URL
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
 * 将 HTTP URL 转换为 WebSocket URL
 *
 * @param httpUrl HTTP URL
 * @returns WebSocket URL
 */
export function toWebSocketUrl(httpUrl: string): string {
  return normalizeSocketUrl(httpUrl).replace(/^http/, "ws");
}
