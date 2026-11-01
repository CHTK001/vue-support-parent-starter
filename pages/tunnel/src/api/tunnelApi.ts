/**
 * @pages/tunnel 外网穿透隧道 REST + SSE 接口
 *
 * <p>ngrok / Cloudflare Tunnel 两种 Provider 共用同一套数据模型：**配置持久化到 JSON 文件**（
 * 后端 {@code spring-support-common-starter} 中的 {@code TunnelFileStore} 管理），
 * 状态通过 SSE 实时推送 {@code GET /ms/tunnel/{ngrok|cloudflared}/stream}，
 * 接口请求 {@code @repo/utils} 的 {@code http} + {@link unwrapResult}，携带审计 Header；</p>
 *
 * <p>REST 接口 {@code /ms/tunnel/ngrok}：GET 列表 / GET /{id} 详情 / POST 创建 / PUT /{id} 更新 /
 * DELETE /{id} 删除 / POST /{id}/start 启动 / POST /{id}/stop 停止。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { http, unwrapResult } from "@repo/utils";
import type { TunnelProvider, TunnelRecord, TunnelView } from "./types";

/** 后端 API 根路径 */
const B = "/ms/tunnel";

/* ==================== 公共 ==================== */

/** 隧道 Provider */
export type { TunnelProvider };

/** 隧道记录（持久化到 JSON 文件） */
export type { TunnelRecord };

/** 隧道台账 + 运行状态 */
export type { TunnelView };

/** 后端 @PreDestroy 关闭后释放的 SSE 子接口路径 */
export function ngrokStreamUrl(): string {
  return `${B}/ngrok/stream`;
}

/** 后端 @PreDestroy 关闭后释放的 SSE 子接口路径 */
export function cloudflaredStreamUrl(): string {
  return `${B}/cloudflared/stream`;
}

/* ==================== ngrok ==================== */

/** 列表（台账 + 运行状态） */
export const ngrokList = () => http().get(`${B}/ngrok`).then((r) => unwrapResult<TunnelView[]>(r));

/** 详情 */
export const ngrokDetail = (id: string) =>
  http().get(`${B}/ngrok/${id}`).then((r) => unwrapResult<TunnelView>(r));

/** 创建 */
export const ngrokCreate = (d: TunnelRecord) =>
  http().post(`${B}/ngrok`).data(d as unknown as Record<string, unknown>).then((r) => unwrapResult<TunnelView>(r));

/** 更新 */
export const ngrokUpdate = (id: string, d: TunnelRecord) =>
  http().put(`${B}/ngrok/${id}`).data(d as unknown as Record<string, unknown>).then((r) => unwrapResult<TunnelView>(r));

/** 删除 */
export const ngrokDelete = (id: string) =>
  http().delete(`${B}/ngrok/${id}`).then((r) => unwrapResult<boolean>(r));

/** 启动 */
export const ngrokStart = (id: string) =>
  http().post(`${B}/ngrok/${id}/start`).then((r) => unwrapResult<TunnelView>(r));

/** 停止 */
export const ngrokStop = (id: string) =>
  http().post(`${B}/ngrok/${id}/stop`).then((r) => unwrapResult<TunnelView>(r));

/** 能力 */
export const ngrokCapabilities = () =>
  http().get(`${B}/ngrok/capabilities`).then((r) => unwrapResult<Record<string, unknown>>(r));

/* ==================== cloudflared ==================== */

/** 列表（台账 + 运行状态） */
export const cloudflaredList = () =>
  http().get(`${B}/cloudflared`).then((r) => unwrapResult<TunnelView[]>(r));

/** 详情 */
export const cloudflaredDetail = (id: string) =>
  http().get(`${B}/cloudflared/${id}`).then((r) => unwrapResult<TunnelView>(r));

/** 创建 */
export const cloudflaredCreate = (d: TunnelRecord) =>
  http().post(`${B}/cloudflared`).data(d as unknown as Record<string, unknown>).then((r) => unwrapResult<TunnelView>(r));

/** 更新 */
export const cloudflaredUpdate = (id: string, d: TunnelRecord) =>
  http().put(`${B}/cloudflared/${id}`).data(d as unknown as Record<string, unknown>).then((r) => unwrapResult<TunnelView>(r));

/** 删除 */
export const cloudflaredDelete = (id: string) =>
  http().delete(`${B}/cloudflared/${id}`).then((r) => unwrapResult<boolean>(r));

/** 启动 */
export const cloudflaredStart = (id: string) =>
  http().post(`${B}/cloudflared/${id}/start`).then((r) => unwrapResult<TunnelView>(r));

/** 停止 */
export const cloudflaredStop = (id: string) =>
  http().post(`${B}/cloudflared/${id}/stop`).then((r) => unwrapResult<TunnelView>(r));
