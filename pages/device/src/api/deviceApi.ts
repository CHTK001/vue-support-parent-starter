/**
 * 设备管理 API 封装
 *
 * 与设备后端服务对接：设备/通道增删改查、视频拉流 URL、云台控制、门禁、事件、Excel 导出等。
 * 统一走 `@repo/core` 的 `createModuleHttp('device')`，复用框架注入的加密/签名/401/重试拦截器；
 * baseUrl 由 app.yaml 的 `httpConfig.moduleBaseUrl.device` 决定，未配置时回退 `http.baseUrl`。
 * 返回值 Promise 直接 resolve 业务负载（已剥离 AxiosResponse 与 `{code,msg,data}` 信封）。
 *
 * @author CH
 * @since 4.0.0.42
 */

import { createModuleHttp } from "@repo/core";
import type { DevicePageQuery, PageResult, DeviceInfo, DeviceVendorDescriptor } from '@pages/device/src/types/device'

<<<<<<< HEAD
/** 设备模块 Http 客户端（baseUrl 由配置 httpConfig.moduleBaseUrl.device 决定） */
/**
 * 设备模块 Http 客户端（懒创建）。
 * 模块可能在 createApp() 注入全局 http 之前被静态导入，因此延迟到首次调用时创建。
 */
let httpClient: ReturnType<typeof createModuleHttp> | undefined
const http = new Proxy({} as ReturnType<typeof createModuleHttp>, {
  get(_target, prop) {
    httpClient ??= createModuleHttp("device")
    const value = Reflect.get(httpClient as object, prop)
    return typeof value === "function" ? value.bind(httpClient) : value
  }
});
=======
/**
 * 设备模块 Http 客户端（baseUrl 由配置 httpConfig.moduleBaseUrl.device 决定）。
 *
 * <p>懒建：{@link createModuleHttp} 内部会立刻取 {@code getApiHttp()} 的 axios 实例，
 * 而该实例要到 createContextApp 启动阶段才 setApiHttp。本文件是被
 * {@code @pages/device} 入口**同步 re-export** 的，若在模块求值时建连，
 * 应用一启动就抛「[api] http 未注入」，页面白屏。因此推迟到首次调用时再建。</p>
 */
let httpClient: ReturnType<typeof createModuleHttp> | null = null;
function client(): ReturnType<typeof createModuleHttp> {
  if (!httpClient) httpClient = createModuleHttp("device");
  return httpClient;
}
>>>>>>> feat/device-stream

/**
 * 解包业务负载，兼容「已剥离 / 未剥离 AxiosResponse 外壳」两种层级。
 *
 * <p>框架拦截器只负责加密/签名/401/重试，不剥离 AxiosResponse 外壳，
 * 因此 `.then()` 收到的是 `{ status, data: { code, msg, data } }`。
 * 这里统一取出业务信封的 `data` 层；若剥不出 data 层则按原样返回。</p>
 *
 * @param r 请求返回值
 * @returns 业务负载
 */
function unwrap<T>(r: { data?: { data?: T } | T }): T {
  const body = (r?.data ?? r) as { data?: unknown; code?: unknown; msg?: unknown; message?: unknown } | undefined
  const hasCode = !!body && typeof body === "object" && "code" in (body as object)
  if (hasCode) {
    const code = String((body as { code?: unknown }).code ?? "")
    const ok = code === "00000" || code === "0" || code === "200"
    if (!ok) {
      const msg = (body as { msg?: unknown }).msg ?? (body as { message?: unknown }).message ?? `请求失败（${code}）`
      throw new Error(String(msg))
    }
  }
  const looksLikeEnvelope = !!body && typeof body === "object" && "data" in (body as object)
  return ((looksLikeEnvelope ? (body as { data?: unknown }).data : body) ?? body) as T
}

export const deviceApi = {
  // ==================== 设备 ====================
  list: (orgId?: string) =>
<<<<<<< HEAD
    http.get("/list").query({ orgId }).then(unwrap) as Promise<DeviceInfo[]>,
  /** 服务端分页（列表页使用） */
  page: (params: DevicePageQuery) =>
    http.get("/page").query(params as unknown as Record<string, unknown>).then(unwrap) as Promise<PageResult<DeviceInfo>>,
  /** 台账统计（列表顶部卡片） */
  stats: (params: { orgId?: string; vendor?: string }) =>
    http.get("/stats").query(params).then(unwrap) as Promise<{
      total: number
      online: number
      offline: number
      noLocation: number
    }>,
  listByCategory: (category: string) =>
    http.get(`/category/${category}`).then(unwrap) as Promise<DeviceInfo[]>,
  get: (id: string) => http.get(`/${id}`).then(unwrap) as Promise<DeviceInfo>,
  add: (info: Record<string, any>) => http.post("/add").data(info).then(unwrap) as Promise<DeviceInfo>,
  update: (id: string, info: Record<string, any>) => http.put(`/${id}`).data(info).then(unwrap),
  remove: (id: string) => http.delete(`/${id}`).then(unwrap),

  // ==================== 状态 ====================
  reconnect: (id: string) => http.post(`/${id}/reconnect`).then(unwrap),
  refreshStatus: (id: string) => http.post(`/${id}/refresh-status`).then(unwrap),
  testConnection: (info: Record<string, any>) => http.post("/test-connection").data(info).then(unwrap) as Promise<boolean>,

  // ==================== 组织 ====================
  syncOrg: () => http.post("/org/sync").then(unwrap),
  getOrgTree: (vendor?: string) =>
    http.get("/org/tree").query({ vendor }).then(unwrap) as Promise<import('@pages/device/src/types/device').OrgNode[]>,
=======
    client().get("/list").query({ orgId }).then(unwrap),
  pageDevices: (params: {
    pageNo: number;
    pageSize: number;
    orgId?: string;
    keyword?: string;
    category?: string;
    online?: boolean;
  }) => client().get("/page").query(params).then(unwrap),
  listByCategory: (category: string) =>
    client().get(`/category/${category}`).then(unwrap),
  get: (id: string) => client().get(`/${id}`).then(unwrap),
  add: (info: any) => client().post("/add").data(info).then(unwrap),
  update: (id: string, info: any) => client().put(`/${id}`).data(info).then(unwrap),
  remove: (id: string) => client().delete(`/${id}`).then(unwrap),

  // —— 状态 ——
  reconnect: (id: string) => client().post(`/${id}/reconnect`).then(unwrap),
  refreshStatus: (id: string) => client().post(`/${id}/refresh-status`).then(unwrap),
  testConnection: (info: any) => client().post("/test-connection").data(info).then(unwrap),

  // —— 组织 ——
  syncOrg: () => client().post("/org/sync").then(unwrap),
  getOrgTree: (vendor?: string) =>
    client().get("/org/tree").query({ vendor }).then(unwrap),
>>>>>>> feat/device-stream

  // ==================== Excel 导出 ====================
  exportDevices: (orgId?: string) =>
    client().get("/export").query({ orgId }).responseType("blob").then(unwrap),

<<<<<<< HEAD
  // ==================== 视频 ====================
  getVideoStream: (deviceId: string, channel: number, protocol = 'hls', streamType: 'main' | 'sub' = 'main') =>
    http.get("/video/stream").query({ deviceId, channel, protocol, streamType }).then(unwrap) as Promise<string>,
  getPlaybackUrl: (deviceId: string, channel: number, start: string, end: string) =>
    http.get("/video/playback").query({ deviceId, channel, start, end }).then(unwrap) as Promise<string>,
=======
  // —— 视频 ——
  // streamType: main=主码流 / sub=副码流（后端按需下发给设备；不认的设备走默认主码流）
  getVideoStream: (deviceId: string, channel: number, protocol = 'hls', streamType = 'main') =>
    client().get("/video/stream").query({ deviceId, channel, protocol, streamType }).then(unwrap),
  getPlaybackUrl: (deviceId: string, channel: number, start: string, end: string) =>
    client().get("/video/playback").query({ deviceId, channel, start, end }).then(unwrap),
>>>>>>> feat/device-stream
  queryVideoRecords: (deviceId: string, channel: number, start: string, end: string) =>
    client().get("/video/records").query({ deviceId, channel, start, end }).then(unwrap),

  // ==================== 云台 ====================
  ptzControl: (deviceId: string, cmd: string, speed = 0.5) =>
    client().post(`/ptz/control?deviceId=${deviceId}&cmd=${cmd}&speed=${speed}`).then(unwrap),
  setPreset: (deviceId: string, presetId: number, name: string) =>
    client().post(`/ptz/preset?deviceId=${deviceId}&presetId=${presetId}&name=${encodeURIComponent(name)}`).then(unwrap),
  callPreset: (deviceId: string, presetId: number) =>
    client().post(`/ptz/preset/call?deviceId=${deviceId}&presetId=${presetId}`).then(unwrap),
  deletePreset: (deviceId: string, presetId: number) =>
    client().delete(`/ptz/preset?deviceId=${deviceId}&presetId=${presetId}`).then(unwrap),
  listPresets: (deviceId: string) =>
    client().get(`/ptz/preset/list?deviceId=${deviceId}`).then(unwrap),

  // ==================== 门禁 ====================
  unlock: (deviceId: string, doorId: number) =>
    client().post(`/access/unlock?deviceId=${deviceId}&doorId=${doorId}`).then(unwrap),
  queryAccessRecords: (deviceId: string, start: string, end: string) =>
    client().get(`/access/records?deviceId=${deviceId}&start=${start}&end=${end}`).then(unwrap),

  // ==================== 事件 ====================
  queryEvents: (params: { deviceId: string; type?: string; start?: string; end?: string }) =>
    client().get("/events").query(params).then(unwrap),

<<<<<<< HEAD
  // ==================== 通道 ====================
  addChannel: (channel: Record<string, any>) => http.post("/channel").data(channel).then(unwrap),
  updateChannel: (id: string, channel: Record<string, any>) => http.put(`/channel/${id}`).data(channel).then(unwrap),
  deleteChannel: (id: string) => http.delete(`/channel/${id}`).then(unwrap),
  getChannel: (id: string) => http.get(`/channel/${id}`).then(unwrap),
=======
  // —— 通道 ——
  addChannel: (channel: any) => client().post("/channel").data(channel).then(unwrap),
  updateChannel: (id: string, channel: any) => client().put(`/channel/${id}`).data(channel).then(unwrap),
  deleteChannel: (id: string) => client().delete(`/channel/${id}`).then(unwrap),
  getChannel: (id: string) => client().get(`/channel/${id}`).then(unwrap),
>>>>>>> feat/device-stream
  listChannels: (deviceId: string) =>
    client().get("/channel/list").query({ deviceId }).then(unwrap),
  toggleChannelStatus: (id: string, status: string) =>
    client().put(`/channel/${id}/status?status=${status}`).then(unwrap),

<<<<<<< HEAD
  // ==================== 提供商配置（离线阈值） ====================
  listProviderConfigs: () => http.get("/provider-config").then(unwrap) as Promise<Record<string, number>>,
=======
  // —— 提供商配置（离线阈值，已落库 device_provider_credential） ——
  listProviderConfigs: () => client().get("/provider-config").then(unwrap),
>>>>>>> feat/device-stream
  updateProviderConfig: (vendor: string, threshold: number) =>
    client().put(`/provider-config/${vendor}?threshold=${threshold}`).then(unwrap),

  // ==================== 提供商凭据（厂商自定义的 AK/SK 等） ====================
  // 同一 (厂商, 平台类型) 可登记多套，如多个海康账号分属不同区域。
  listCredentials: (vendor?: string) =>
<<<<<<< HEAD
    http.get("/provider-credential/list").query({ vendor }).then(unwrap),
  getCredential: (id: string) => http.get(`/provider-credential/${id}`).then(unwrap),
  createCredential: (credential: Record<string, any>) =>
    http.post("/provider-credential").data(credential).then(unwrap),
  updateCredential: (id: string, credential: Record<string, any>) =>
    http.put(`/provider-credential/${id}`).data(credential).then(unwrap),
  deleteCredential: (id: string) => http.delete(`/provider-credential/${id}`).then(unwrap),
  testCredential: (id: string) => http.post(`/provider-credential/${id}/test`).then(unwrap) as Promise<boolean>,
  syncDevices: (vendor?: string) =>
    http.post("/sync").query({ vendor }).then(unwrap) as Promise<{ created: number; updated: number; skipped: number }>,
=======
    client().get("/provider-credential/list").query({ vendor }).then(unwrap),
  getCredential: (id: string) => client().get(`/provider-credential/${id}`).then(unwrap),
  createCredential: (credential: any) =>
    client().post("/provider-credential").data(credential).then(unwrap),
  updateCredential: (id: string, credential: any) =>
    client().put(`/provider-credential/${id}`).data(credential).then(unwrap),
  updateCredentialEnabled: (id: string, enabled: boolean) =>
    client().put(`/provider-credential/${id}/enabled?enabled=${enabled}`).then(unwrap),
  deleteCredential: (id: string) => client().delete(`/provider-credential/${id}`).then(unwrap),
>>>>>>> feat/device-stream

  // ==================== 厂商描述符：支持的厂商/平台/能力位由后端 SPI 决定 ====================
  listVendors: () =>
    http.get("/provider/vendors").then(unwrap) as Promise<DeviceVendorDescriptor[]>,
  getVendor: (vendor: string) =>
    http.get(`/provider/vendors/${vendor}`).then(unwrap) as Promise<DeviceVendorDescriptor>,

  // ==================== 设备离线阈值 ====================
  updateOfflineThreshold: (deviceId: string, threshold: number) =>
    client().put(`/${deviceId}/offline-threshold?threshold=${threshold}`).then(unwrap)
}

export default deviceApi
