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

/** 设备模块 Http 客户端（baseUrl 由配置 httpConfig.moduleBaseUrl.device 决定） */
const http = createModuleHttp("device");

/** 解包 { code, msg, data } 为 data */
function unwrap<T>(r: { data?: T }): T {
  return r.data as T;
}

export const deviceApi = {
  // —— 设备 ——
  list: (orgId?: string) =>
    http.get("/list").query({ orgId }).then(unwrap),
  listByCategory: (category: string) =>
    http.get(`/category/${category}`).then(unwrap),
  get: (id: string) => http.get(`/${id}`).then(unwrap),
  add: (info: any) => http.post("/add").data(info).then(unwrap),
  update: (id: string, info: any) => http.put(`/${id}`).data(info).then(unwrap),
  remove: (id: string) => http.delete(`/${id}`).then(unwrap),

  // —— 状态 ——
  reconnect: (id: string) => http.post(`/${id}/reconnect`).then(unwrap),
  refreshStatus: (id: string) => http.post(`/${id}/refresh-status`).then(unwrap),
  testConnection: (info: any) => http.post("/test-connection").data(info).then(unwrap),

  // —— 组织 ——
  syncOrg: () => http.post("/org/sync").then(unwrap),
  getOrgTree: (vendor?: string) =>
    http.get("/org/tree").query({ vendor }).then(unwrap),

  // —— Excel 导出 ——
  exportDevices: (orgId?: string) =>
    http.get("/export").query({ orgId }).responseType("blob").then(unwrap),

  // —— 视频 ——
  getVideoStream: (deviceId: string, channel: number, protocol = 'hls') =>
    http.get("/video/stream").query({ deviceId, channel, protocol }).then(unwrap),
  getPlaybackUrl: (deviceId: string, channel: number, start: string, end: string) =>
    http.get("/video/playback").query({ deviceId, channel, start, end }).then(unwrap),
  queryVideoRecords: (deviceId: string, channel: number, start: string, end: string) =>
    http.get("/video/records").query({ deviceId, channel, start, end }).then(unwrap),

  // —— 云台 ——
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

  // —— 门禁 ——
  unlock: (deviceId: string, doorId: number) =>
    http.post(`/access/unlock?deviceId=${deviceId}&doorId=${doorId}`).then(unwrap),
  queryAccessRecords: (deviceId: string, start: string, end: string) =>
    http.get(`/access/records?deviceId=${deviceId}&start=${start}&end=${end}`).then(unwrap),

  // —— 事件 ——
  queryEvents: (params: { deviceId: string; type?: string; start?: string; end?: string }) =>
    http.get("/events").query(params).then(unwrap),

  // —— 通道 ——
  addChannel: (channel: any) => http.post("/channel").data(channel).then(unwrap),
  updateChannel: (id: string, channel: any) => http.put(`/channel/${id}`).data(channel).then(unwrap),
  deleteChannel: (id: string) => http.delete(`/channel/${id}`).then(unwrap),
  getChannel: (id: string) => http.get(`/channel/${id}`).then(unwrap),
  listChannels: (deviceId: string) =>
    http.get("/channel/list").query({ deviceId }).then(unwrap),
  toggleChannelStatus: (id: string, status: string) =>
    http.put(`/channel/${id}/status?status=${status}`).then(unwrap),

  // —— 提供商配置 ——
  listProviderConfigs: () => http.get("/provider-config").then(unwrap),
  updateProviderConfig: (vendor: string, threshold: number) =>
    http.put(`/provider-config/${vendor}?threshold=${threshold}`).then(unwrap),

  // —— 设备离线阈值 ——
  updateOfflineThreshold: (deviceId: string, threshold: number) =>
    http.put(`/${deviceId}/offline-threshold?threshold=${threshold}`).then(unwrap)
}

export default deviceApi
