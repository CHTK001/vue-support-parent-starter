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
import type { DevicePageQuery, PageResult, DeviceInfo, DeviceVendorDescriptor, SyncResult, TopologyNode, TopologyEdge } from '@pages/device/src/types/device'

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

  // ==================== Excel 导出 ====================
  exportDevices: (orgId?: string) =>
    http.get("/export").query({ orgId }).responseType("blob").then(unwrap),

  // ==================== 视频 ====================
  getVideoStream: (deviceId: string, channel: number, protocol = 'hls', streamType: 'main' | 'sub' = 'main') =>
    http.get("/video/stream").query({ deviceId, channel, protocol, streamType }).then(unwrap) as Promise<string>,
  getPlaybackUrl: (deviceId: string, channel: number, start: string, end: string) =>
    http.get("/video/playback").query({ deviceId, channel, start, end }).then(unwrap) as Promise<string>,
  queryVideoRecords: (deviceId: string, channel: number, start: string, end: string) =>
    http.get("/video/records").query({ deviceId, channel, start, end }).then(unwrap),

  // ==================== 云台 ====================
  ptzControl: (deviceId: string, cmd: string, speed = 0.5) =>
    http.post(`/ptz/control?deviceId=${deviceId}&cmd=${cmd}&speed=${speed}`).then(unwrap),
  setPreset: (deviceId: string, presetId: number, name: string) =>
    http.post(`/ptz/preset?deviceId=${deviceId}&presetId=${presetId}&name=${encodeURIComponent(name)}`).then(unwrap),
  callPreset: (deviceId: string, presetId: number) =>
    http.post(`/ptz/preset/call?deviceId=${deviceId}&presetId=${presetId}`).then(unwrap),
  deletePreset: (deviceId: string, presetId: number) =>
    http.delete(`/ptz/preset?deviceId=${deviceId}&presetId=${presetId}`).then(unwrap),
  listPresets: (deviceId: string) =>
    http.get(`/ptz/preset/list?deviceId=${deviceId}`).then(unwrap),

  // ==================== 门禁 ====================
  unlock: (deviceId: string, doorId: number) =>
    http.post(`/access/unlock?deviceId=${deviceId}&doorId=${doorId}`).then(unwrap),
  queryAccessRecords: (deviceId: string, start: string, end: string) =>
    http.get(`/access/records?deviceId=${deviceId}&start=${start}&end=${end}`).then(unwrap),

  // ==================== 事件 ====================
  queryEvents: (params: { deviceId: string; type?: string; start?: string; end?: string }) =>
    http.get("/events").query(params).then(unwrap),

  // ==================== 通道 ====================
  addChannel: (channel: Record<string, any>) => http.post("/channel").data(channel).then(unwrap),
  updateChannel: (id: string, channel: Record<string, any>) => http.put(`/channel/${id}`).data(channel).then(unwrap),
  deleteChannel: (id: string) => http.delete(`/channel/${id}`).then(unwrap),
  getChannel: (id: string) => http.get(`/channel/${id}`).then(unwrap),
  listChannels: (deviceId: string) =>
    http.get("/channel/list").query({ deviceId }).then(unwrap),
  toggleChannelStatus: (id: string, status: string) =>
    http.put(`/channel/${id}/status?status=${status}`).then(unwrap),

  // ==================== 提供商配置（离线阈值） ====================
  listProviderConfigs: () => http.get("/provider-config").then(unwrap) as Promise<Record<string, number>>,
  updateProviderConfig: (vendor: string, threshold: number) =>
    http.put(`/provider-config/${vendor}?threshold=${threshold}`).then(unwrap),

  // ==================== 提供商凭据（厂商自定义的 AK/SK 等） ====================
  // 同一 (厂商, 平台类型) 可登记多套，如多个海康账号分属不同区域。
  listCredentials: (vendor?: string) =>
    http.get("/provider-credential/list").query({ vendor }).then(unwrap),
  getCredential: (id: string) => http.get(`/provider-credential/${id}`).then(unwrap),
  createCredential: (credential: Record<string, any>) =>
    http.post("/provider-credential").data(credential).then(unwrap),
  updateCredential: (id: string, credential: Record<string, any>) =>
    http.put(`/provider-credential/${id}`).data(credential).then(unwrap),
  deleteCredential: (id: string) => http.delete(`/provider-credential/${id}`).then(unwrap),
  testCredential: (id: string) => http.post(`/provider-credential/${id}/test`).then(unwrap) as Promise<boolean>,
  /** 按厂商同步设备目录（拉取方向；未指定 vendor 则同步全部厂商） */
  syncDevices: (vendor?: string) =>
    http.post("/sync").query({ vendor }).then(unwrap) as Promise<SyncResult>,
  // ==================== 凭据维度同步（按 AK/SK 平台的厂商侧账本） ====================
  /** 按凭据 ID 同步设备目录（落库 device_info，台账行回写 deviceInfoCredentialId） */
  syncDevicesByCredential: (id: string) =>
    http.post(`/provider-credential/${id}/sync/devices`).then(unwrap) as Promise<SyncResult>,
  /** 按凭据 ID 同步组织树 */
  syncOrgByCredential: (id: string) =>
    http.post(`/provider-credential/${id}/sync/org`).then(unwrap) as Promise<SyncResult>,
  /** 按凭据 ID 同步人员列表 */
  syncPersonsByCredential: (id: string) =>
    http.post(`/provider-credential/${id}/sync/persons`).then(unwrap) as Promise<SyncResult>,
  /** 按凭据 ID 全量同步（设备 + 组织 + 人员） */
  syncCredential: (id: string) =>
    http.post(`/provider-credential/${id}/sync`).then(unwrap) as Promise<SyncResult[]>,

  // ==================== 机房拓扑 ====================
  /** 机房拓扑：根据设备的 IP 网段与区域生成（楼层/区域 → 网段 → 设备 → 通道） */
  topology: () =>
    http.get("/topology").then(unwrap) as Promise<{ nodes: TopologyNode[]; edges: TopologyEdge[] }>,

  // ==================== 时间轮 ====================
  /** 立即执行一个时间轮任务（支持凭据级任务名，如 offlineDetect_{credId}） */
  runTask: (taskName: string) =>
    http.post(`/tasks/${encodeURIComponent(taskName)}/run`).then(unwrap) as Promise<boolean>,

  // ==================== 定时任务状态 ====================
  /** 全部时间轮任务状态（interval / running / lastRunAt） */
  listTaskStates: () =>
    http.get("/tasks/list").then(unwrap) as Promise<Array<{
      deviceTaskStateId: string
      deviceTaskStateName: string
      deviceTaskStateRunning: boolean
      deviceTaskStateLastRunAt?: string
      deviceTaskStateInterval?: number
      deviceTaskStateDescription?: string
    }>>,
  /** 更新任务运行间隔（秒） */
  updateTaskInterval: (taskName: string, interval: number) =>
    http.put(`/tasks/${encodeURIComponent(taskName)}/interval?interval=${interval}`).then(unwrap),

  // ==================== 厂商设备目录同步（写回方向） ====================
  /** 把本地设备写回厂商侧（仅厂商实现写回 SPI 生效） */
  pushDevice: (deviceId: string) =>
    http.post(`/sync/${deviceId}/push`).then(unwrap) as Promise<boolean>,
  /** 删除厂商侧设备（按 externalId） */
  removeRemoteDevice: (deviceId: string) =>
    http.delete(`/sync/${deviceId}/remote`).then(unwrap) as Promise<boolean>,

  // ==================== 厂商描述符：支持的厂商/平台/能力位由后端 SPI 决定 ====================
  listVendors: () =>
    http.get("/provider/vendors").then(unwrap) as Promise<DeviceVendorDescriptor[]>,
  getVendor: (vendor: string) =>
    http.get(`/provider/vendors/${vendor}`).then(unwrap) as Promise<DeviceVendorDescriptor>,

  // ==================== 设备离线阈值 ====================
  updateOfflineThreshold: (deviceId: string, threshold: number) =>
    http.put(`/${deviceId}/offline-threshold?threshold=${threshold}`).then(unwrap),

  // ==================== 设备分组 ====================
  /** 分组树（含每个分组的直接设备数） */
  groupTree: () => http.get("/group/tree").then(unwrap) as Promise<import('@pages/device/src/types/device').DeviceGroupNode[]>,
  createGroup: (req: Record<string, any>) =>
    http.post("/group").data(req).then(unwrap),
  updateGroup: (groupId: string, req: Record<string, any>) =>
    http.put(`/group/${groupId}`).data(req).then(unwrap),
  deleteGroup: (groupId: string) => http.delete(`/group/${groupId}`).then(unwrap),
  /** 分组下的设备 */
  groupDevices: (groupId: string) =>
    http.get(`/group/${groupId}/devices`).then(unwrap) as Promise<DeviceInfo[]>,
  /** 分配设备到分组（全量替换） */
  assignGroupDevices: (groupId: string, deviceIds: string[]) =>
    http.put(`/group/${groupId}/devices`).data(deviceIds).then(unwrap),
  /** 设备所属分组ID */
  deviceGroups: (deviceId: string) =>
    http.get(`/group/device/${deviceId}/groups`).then(unwrap) as Promise<string[]>,
  /** 设置设备所属分组（全量替换该设备的关联） */
  assignDeviceGroups: (deviceId: string, groupIds: string[]) =>
    http.put(`/group/device/${deviceId}/groups`).data(groupIds).then(unwrap),
  /** 所有设备-分组关联（列表批量回显） */
  groupAssignments: () =>
    http.get("/group/assignments").then(unwrap) as Promise<Array<{ deviceId: string; groupId: string }>>
}

export default deviceApi
