/**
 * @pages/tunnel 内网穿透统一接口（{@code /ms/tunnel}）
 *
 * <p>改造前 ngrok 与 Cloudflare Tunnel 各有一套路由（{@code /ms/tunnel/ngrok}、
 * {@code /ms/tunnel/cloudflared}），前端因此也维护了两套函数族，任一处改名都要
 * 改两遍。现在后端只有一个控制器、一套路由：</p>
 * <ul>
 *   <li>{@code GET  /ms/tunnel/providers} —— 提供方清单（含能力、支持模式、可用性）；</li>
 *   <li>{@code GET  /ms/tunnel?provider=} —— 映射列表，不带参数即全部提供方；</li>
 *   <li>{@code GET  /ms/tunnel/{id}} —— 详情；</li>
 *   <li>{@code POST /ms/tunnel} —— 新建（请求体的 {@code provider} 决定归属）；</li>
 *   <li>{@code PUT  /ms/tunnel/{id}} —— 更新（运行中会按新配置重启）；</li>
 *   <li>{@code DELETE /ms/tunnel/{id}} —— 删除；</li>
 *   <li>{@code POST /ms/tunnel/{id}/start} / {@code /stop} —— 启停；</li>
 *   <li>{@code GET  /ms/tunnel/stream} —— SSE 实时状态（本页面不订阅，留给需要推送的宿主）。</li>
 * </ul>
 *
 * <p>除 {@code providers} 与列表筛选外，所有接口只按映射 {@code id} 操作 ——
 * id 是全局唯一 UUID，因此不需要 provider 前缀，新增一种提供方也不必改本文件。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { http, unwrapResult } from "@repo/utils";
import type { TunnelProvider, TunnelProviderInfo, TunnelRecord, TunnelView } from "./types";

/** 后端统一接口根路径 */
const B = "/ms/tunnel";

/* ==================== 类型转发 ==================== */

/** Provider 标识 */
export type { TunnelProvider };

/** 隧道模式 */
export type { TunnelMode } from "./types";

/** 隧道记录（持久化到 JSON 文件） */
export type { TunnelRecord };

/** 隧道台账 + 运行状态 */
export type { TunnelView };

/** 提供方描述 */
export type { TunnelProviderInfo };

/* ==================== 实时状态 ==================== */

/**
 * SSE 实时状态流地址。
 *
 * <p>页面当前用「操作后重新拉列表」的朴素方式，不订阅这条流；保留导出是因为
 * 宿主若需要多页签联动（一个标签页启停，其它标签页跟着变），接上即可。</p>
 *
 * @returns SSE 地址
 */
export function tunnelStreamUrl(): string {
  return `${B}/stream`;
}

/* ==================== 提供方 ==================== */

/**
 * 已注册的提供方清单。
 *
 * @returns 提供方描述数组（顺序即后端注册顺序，页面下拉直接沿用）
 */
export const listTunnelProviders = () =>
  http().get(`${B}/providers`).then((r) => unwrapResult<TunnelProviderInfo[]>(r));

/* ==================== 映射 ==================== */

/**
 * 映射列表（含运行态）。
 *
 * @param provider 只看某个提供方；不传返回全部
 * @returns 映射列表
 */
export const listTunnels = (provider?: string) => {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  return http().get(`${B}${query}`).then((r) => unwrapResult<TunnelView[]>(r));
};

/**
 * 单条映射。
 *
 * @param id 映射标识
 * @returns 映射
 */
export const getTunnel = (id: string) =>
  http().get(`${B}/${id}`).then((r) => unwrapResult<TunnelView>(r));

/**
 * 新建映射。
 *
 * @param draft 配置（{@code provider} 必填，除非后端只注册了一个实现）
 * @returns 保存后的映射
 */
export const createTunnel = (draft: TunnelRecord) =>
  http().post(B).data(draft as unknown as Record<string, unknown>).then((r) => unwrapResult<TunnelView>(r));

/**
 * 更新映射。
 *
 * @param id    映射标识
 * @param draft 新配置
 * @returns 保存后的映射
 */
export const updateTunnel = (id: string, draft: TunnelRecord) =>
  http()
    .put(`${B}/${id}`)
    .data(draft as unknown as Record<string, unknown>)
    .then((r) => unwrapResult<TunnelView>(r));

/**
 * 删除映射。
 *
 * @param id 映射标识
 * @returns 是否删除
 */
export const deleteTunnel = (id: string) =>
  http().delete(`${B}/${id}`).then((r) => unwrapResult<boolean>(r));

/**
 * 启动映射。
 *
 * @param id 映射标识
 * @returns 启动后的映射
 */
export const startTunnel = (id: string) =>
  http().post(`${B}/${id}/start`).then((r) => unwrapResult<TunnelView>(r));

/**
 * 停止映射。
 *
 * @param id 映射标识
 * @returns 停止后的映射
 */
export const stopTunnel = (id: string) =>
  http().post(`${B}/${id}/stop`).then((r) => unwrapResult<TunnelView>(r));
