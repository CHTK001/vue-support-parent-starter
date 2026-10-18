/**
 * 设备管理 API 封装
 *
 * 与设备后端服务对接：
 *   设备/通道增删改查、视频拉流 URL、云台控制、门禁、事件、Excel 导出、地图位置等。
 *
 * 统一走 @repo/core 的 createModuleHttp('device')：
 * 复用框架注入的加密/签名/401/重试拦截器；baseUrl 由 app.yaml 的
 * httpConfig.moduleBaseUrl.device 配置，未配置时回退 http.baseUrl。
 * 返回的 Promise 直接 resolve 到 data 字段（业务负载）。
 *
 * @author CH
 * @since 4.0.0.42
 */

import { createModuleHttp } from "@repo/core";

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

/**
 * 解包业务负载，兼容「已剥离 / 未剥离 AxiosResponse 外壳」两种层级。
 *
 * <p>为什么必须多剥一层：{@link createModuleHttp} 复用框架注入的 axios 实例，
 * 那些拦截器只负责**加密 / 签名 / 401 / 重试**，并不剥离 AxiosResponse 外壳，
 * 所以 `.then()` 收到的是 `{ status, data: { code, msg, data } }`。
 * 原来这里直接 `return r.data`，等于把整个业务信封 `{code,msg,data}` 当成业务负载返回：
 * `deviceApi.list()` 于是给回一个**对象**而不是数组，视图里
 * `devices.value.filter(...)` 直接抛
 * `devices.value.filter is not a function`（设备资产 / 设备通道 / 设备事件三页均复现，
 * 见交付验收的 click-error 记录）；`deleteChannel` 之类拿到的也是信封而非布尔。</p>
 *
 * <p>刻意<b>不</b>改用 {@link unwrapResult}：那个helper 在业务码非成功时会抛错，
 * 会把本模块 17 处调用点的错误语义从「静默拿到信封」一次性改成 reject，
 * 风险面远超本次修复。失败路径的行为保持原样，只修正成功路径剥壳。</p>
 *
 * @param r 请求返回值（AxiosResponse 或已被拦截器剥壳的业务信封）
 * @returns 业务负载；剥不出 data 层时按原样返回，不改变既有失败语义
 */
function unwrap<T>(r: { data?: { data?: T } | T }): T {
  // res.data 是 AxiosResponse 的 body（业务信封）；若上游已剥壳则 res 本身就是信封。
  const body = (r?.data ?? r) as { data?: unknown } | undefined;
  // 只在「像业务信封」时才取 data 层，避免把业务数据本身是对象的情况误剥一层。
  const looksLikeEnvelope = !!body && typeof body === "object" && "data" in (body as object);
  return ((looksLikeEnvelope ? (body as { data?: unknown }).data : body) ?? body) as T;
}

export const deviceApi = {
  // —— 设备 ——
  list: (orgId?: string) =>
    client().get("/list").query({ orgId }).then(unwrap),
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

  // —— Excel 导出 ——
  exportDevices: (orgId?: string) =>
    client().get("/export").query({ orgId }).responseType("blob").then(unwrap),

  // —— 视频 ——
  // streamType: main=主码流 / sub=副码流（后端按需下发给设备；不认的设备走默认主码流）
  getVideoStream: (deviceId: string, channel: number, protocol = 'hls', streamType = 'main') =>
    client().get("/video/stream").query({ deviceId, channel, protocol, streamType }).then(unwrap),
  getPlaybackUrl: (deviceId: string, channel: number, start: string, end: string) =>
    client().get("/video/playback").query({ deviceId, channel, start, end }).then(unwrap),
  queryVideoRecords: (deviceId: string, channel: number, start: string, end: string) =>
    client().get("/video/records").query({ deviceId, channel, start, end }).then(unwrap),

  // —— 云台 ——
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

  // —— 门禁 ——
  unlock: (deviceId: string, doorId: number) =>
    client().post(`/access/unlock?deviceId=${deviceId}&doorId=${doorId}`).then(unwrap),
  queryAccessRecords: (deviceId: string, start: string, end: string) =>
    client().get(`/access/records?deviceId=${deviceId}&start=${start}&end=${end}`).then(unwrap),

  // —— 事件 ——
  queryEvents: (params: { deviceId: string; type?: string; start?: string; end?: string }) =>
    client().get("/events").query(params).then(unwrap),

  // —— 通道 ——
  addChannel: (channel: any) => client().post("/channel").data(channel).then(unwrap),
  updateChannel: (id: string, channel: any) => client().put(`/channel/${id}`).data(channel).then(unwrap),
  deleteChannel: (id: string) => client().delete(`/channel/${id}`).then(unwrap),
  getChannel: (id: string) => client().get(`/channel/${id}`).then(unwrap),
  listChannels: (deviceId: string) =>
    client().get("/channel/list").query({ deviceId }).then(unwrap),
  toggleChannelStatus: (id: string, status: string) =>
    client().put(`/channel/${id}/status?status=${status}`).then(unwrap),

  // —— 提供商配置（离线阈值，已落库 device_provider_credential） ——
  listProviderConfigs: () => client().get("/provider-config").then(unwrap),
  updateProviderConfig: (vendor: string, threshold: number) =>
    client().put(`/provider-config/${vendor}?threshold=${threshold}`).then(unwrap),

  // —— 提供商凭据（厂商自定义的 AK/SK 等接入参数） ——
  // 同一 (厂商, 平台类型) 可登记多套，如多个海康账号分属不同区域。
  listCredentials: (vendor?: string) =>
    client().get("/provider-credential/list").query({ vendor }).then(unwrap),
  getCredential: (id: string) => client().get(`/provider-credential/${id}`).then(unwrap),
  createCredential: (credential: any) =>
    client().post("/provider-credential").data(credential).then(unwrap),
  updateCredential: (id: string, credential: any) =>
    client().put(`/provider-credential/${id}`).data(credential).then(unwrap),
  deleteCredential: (id: string) => client().delete(`/provider-credential/${id}`).then(unwrap),

  // —— 设备离线阈值 ——
  updateOfflineThreshold: (deviceId: string, threshold: number) =>
    client().put(`/${deviceId}/offline-threshold?threshold=${threshold}`).then(unwrap)
}

export default deviceApi
