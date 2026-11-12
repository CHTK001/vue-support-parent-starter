/**
 * 后端 codec 开关的前端运行时状态。
 *
 * <p>系统配置页里的 {@code CodecRequestOpen} / {@code CodecResponseOpen} 是后端
 * 全局设置；前端不能再把它们当成“只读的后端配置”。本模块把这两个开关和
 * {@code CodecRequestKey} 收拢成一份运行时状态，供 HTTP 拦截器在每个请求上读取。</p>
 *
 * <p>默认值刻意保持全关：没有拉到设置、或旧后端没有返回这三个字段时，前端行为
 * 与改造前完全一致，不会因为升级前端而突然加密所有请求。</p>
 */
import type { SettingItem } from "./api";

/** 前端 codec 运行时配置 */
export interface HttpCodecRuntime {
  /** 请求体加密开关（后端 CodecRequestOpen） */
  requestOpen: boolean;
  /** 响应体解密开关（后端 CodecResponseOpen） */
  responseOpen: boolean;
  /** 请求/响应共用的 codec 密钥（后端 CodecRequestKey） */
  key: string;
  /** codec 类型；含 aes 时走 AES-256-CBC，其余为兼容 hex */
  type: string;
}

const DEFAULT_RUNTIME: HttpCodecRuntime = {
  requestOpen: false,
  responseOpen: false,
  key: "",
  type: "aes",
};

let runtime: HttpCodecRuntime = { ...DEFAULT_RUNTIME };

/** 读取当前运行时配置（只读快照，调用方不要直接改对象） */
export function getHttpCodecRuntime(): Readonly<HttpCodecRuntime> {
  return runtime;
}

/** 覆盖运行时配置；缺省字段保持不变。 */
export function setHttpCodecRuntime(patch: Partial<HttpCodecRuntime>): void {
  runtime = { ...runtime, ...patch };
}

/** 恢复默认全关状态（登出/测试用）。 */
export function resetHttpCodecRuntime(): void {
  runtime = { ...DEFAULT_RUNTIME };
}

function asBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "true" || text === "1") return true;
  if (text === "false" || text === "0" || text === "") return false;
  return undefined;
}

/**
 * 从后端设置列表吸收 codec 开关。
 *
 * <p>兼容两种返回形态：设置名在 {@code sysSettingName}，或已被后端映射成
 * {@code sysSettingCode}。只认三个明确的名字，避免把同组其它配置误当开关。</p>
 */
export function applyHttpCodecSettings(items: readonly SettingItem[] | null | undefined): void {
  if (!Array.isArray(items)) return;
  const patch: Partial<HttpCodecRuntime> = {};
  for (const item of items) {
    const name = String(item?.sysSettingName ?? item?.sysSettingCode ?? "").trim();
    if (!name) continue;
    if (name === "CodecRequestOpen") {
      const value = asBool(item.sysSettingValue);
      if (value !== undefined) patch.requestOpen = value;
    } else if (name === "CodecResponseOpen") {
      const value = asBool(item.sysSettingValue);
      if (value !== undefined) patch.responseOpen = value;
    } else if (name === "CodecRequestKey") {
      const value = String(item.sysSettingValue ?? "").trim();
      // 后端敏感字段可能返回掩码；掩码不能拿来当密钥
      if (value && !/^\*+$/.test(value)) patch.key = value;
    }
  }
  if (Object.keys(patch).length > 0) {
    runtime = { ...runtime, ...patch };
  }
}

/**
 * 自动 codec 不处理的路径。
 *
 * <p>登录/登出发生在拿到配置之前；设置接口本身如果被自动加密，会把
 * “刷新设置”变成“先有密钥才能刷新密钥”的循环。显式 {@code .codec(true)}
 * 的请求仍由调用方自行负责。</p>
 */
export function isCodecRequestExcluded(url: string | undefined): boolean {
  const path = String(url ?? "");
  return /\/v2\/user\/(login|logout)(?:[?#]|$)/.test(path)
    || /\/v2\/setting(?:\/|[?#]|$)/.test(path);
}
