/**
 * 设备管理 API 封装
 *
 * 与后端 spring-support-device-starter 对接：
 *   设备/通道增删改查、视频拉流 URL、云台控制、门禁、事件、Excel 导出、地图位置等。
 *
 * @author CH
 * @since 4.0.0.42
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

/** 后端基础地址（Vite proxy 将 /api/device/** 代理到 spring-support-device-starter） */
const BASE_URL = '/api/device'

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
})

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[deviceApi]', error?.message)
    return Promise.reject(error)
  }
)

function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return instance.get(url, config) as unknown as Promise<T>
}

function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return instance.post(url, data, config) as unknown as Promise<T>
}

function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return instance.put(url, data, config) as unknown as Promise<T>
}

function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return instance.delete(url, config) as unknown as Promise<T>
}

/**
 * 设备模块接口封装
 */
export const deviceApi = {
  // —— 设备 ——
  list: (orgId?: string) => get('/list', { params: { orgId } }),
  listByCategory: (category: string) => get(`/category/${category}`),
  get: (id: string) => get(`/${id}`),
  add: (info: any) => post('/add', info),
  update: (id: string, info: any) => put(`/${id}`, info),
  remove: (id: string) => del(`/${id}`),

  // —— 状态 ——
  reconnect: (id: string) => post(`/${id}/reconnect`),
  refreshStatus: (id: string) => post(`/${id}/refresh-status`),
  testConnection: (info: any) => post('/test-connection', info),

  // —— 组织 ——
  syncOrg: () => post('/org/sync'),
  getOrgTree: (vendor?: string) => get('/org/tree', { params: { vendor } }),

  // —— Excel 导出 ——
  exportDevices: (orgId?: string) =>
    get('/export', { params: { orgId }, responseType: 'blob' }),

  // —— 视频 ——
  getVideoStream: (deviceId: string, channel: number, protocol = 'hls') =>
    get('/video/stream', { params: { deviceId, channel, protocol } }),
  getPlaybackUrl: (deviceId: string, channel: number, start: string, end: string) =>
    get('/video/playback', { params: { deviceId, channel, start, end } }),
  queryVideoRecords: (deviceId: string, channel: number, start: string, end: string) =>
    get('/video/records', { params: { deviceId, channel, start, end } }),

  // —— 云台 ——
  ptzControl: (deviceId: string, cmd: string, speed = 0.5) =>
    post(`/ptz/control?deviceId=${deviceId}&cmd=${cmd}&speed=${speed}`),
  setPreset: (deviceId: string, presetId: number, name: string) =>
    post(`/ptz/preset?deviceId=${deviceId}&presetId=${presetId}&name=${encodeURIComponent(name)}`),
  callPreset: (deviceId: string, presetId: number) =>
    post(`/ptz/preset/call?deviceId=${deviceId}&presetId=${presetId}`),
  deletePreset: (deviceId: string, presetId: number) =>
    del(`/ptz/preset?deviceId=${deviceId}&presetId=${presetId}`),
  listPresets: (deviceId: string) => get(`/ptz/preset/list?deviceId=${deviceId}`),

  // —— 门禁 ——
  unlock: (deviceId: string, doorId: number) =>
    post(`/access/unlock?deviceId=${deviceId}&doorId=${doorId}`),
  queryAccessRecords: (deviceId: string, start: string, end: string) =>
    get(`/access/records?deviceId=${deviceId}&start=${start}&end=${end}`),

  // —— 事件 ——
  queryEvents: (params: { deviceId: string; type?: string; start?: string; end?: string }) =>
    get('/events', { params }),

  // —— 通道 ——
  addChannel: (channel: any) => post('/channel', channel),
  updateChannel: (id: string, channel: any) => put(`/channel/${id}`, channel),
  deleteChannel: (id: string) => del(`/channel/${id}`),
  getChannel: (id: string) => get(`/channel/${id}`),
  listChannels: (deviceId: string) => get('/channel/list', { params: { deviceId } }),
  toggleChannelStatus: (id: string, status: string) =>
    put(`/channel/${id}/status?status=${status}`),

  // —— 提供商配置 ——
  listProviderConfigs: () => get('/provider-config'),
  updateProviderConfig: (vendor: string, threshold: number) =>
    put(`/provider-config/${vendor}?threshold=${threshold}`),

  // —— 设备离线阈值 ——
  updateOfflineThreshold: (deviceId: string, threshold: number) =>
    put(`/${deviceId}/offline-threshold?threshold=${threshold}`)
}

export default deviceApi
