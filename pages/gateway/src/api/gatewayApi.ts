/**
 * 网关 API 封装
 *
 * 通过 @repo/core 的 http 实例（由 createApp 注入）请求网关后端。
 * 单请求 .loading(false) 关闭 nprogress，避免小请求闪烁。
 */
import { getApiHttp } from "@repo/core";
import type { GatewayInfo } from "./types";

/** 网关状态接口（健康/控制端/被控端/令牌 汇总） */
export function fetchGatewayInfo() {
  return getApiHttp()
    .get("/admin/api/gateway/info")
    .loading(false)
    .then<{ status: number; code: number; msg?: string; data?: GatewayInfo }>((r) => r.data);
}

/** 踢出控制端 */
export function kickController(id: string) {
  return getApiHttp()
    .post("/admin/api/gateway/kick")
    .data({ id })
    .loading(false)
    .then<{ status: number; code: number; msg?: string }>((r) => r.data);
}

/** 列出在线 Agent 的可连接 Targets */
export function fetchTargets() {
  return getApiHttp()
    .get("/admin/api/gateway/targets")
    .loading(false)
    .then<{ status: number; code: number; msg?: string; data?: unknown[] }>((r) => r.data);
}

/** 创建远程控制会话（WebSocket 建连前的鉴权） */
export function startRemoteSession(payload: Record<string, unknown>) {
  return getApiHttp()
    .post("/api/remote/session")
    .data(payload)
    .then<{ status: number; code: number; msg?: string; data?: Record<string, unknown> }>((r) => r.data);
}