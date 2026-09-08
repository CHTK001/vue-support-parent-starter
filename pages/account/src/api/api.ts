import { getApiHttp } from "@repo/core";

const http = getApiHttp();

export interface Account {
  id: string
  platformType: string
  email: string
  password: string
  token: string
  active: boolean
  createdAt: number
  lastUsedAt?: number
}

export interface PoolStats {
  total: number
  active: number
  inactive: number
}

export const accountApi = {
  register(platformType: string, emailProvider?: string, proxy?: string) {
    return http.post(`/api/account/register/${platformType}`, null, { params: { emailProvider, proxy } })
  },
  registerBatch(platformType: string, count: number, emailProvider?: string) {
    return http.post(`/api/account/register-batch/${platformType}`, null, { params: { count, emailProvider } })
  },
  acquire(platformType: string) {
    return http.get(`/api/account/acquire/${platformType}`)
  },
  list(platformType: string) {
    return http.get(`/api/account/list/${platformType}`)
  },
  release(platformType: string, accountId: string) {
    return http.post(`/api/account/release/${platformType}/${accountId}`)
  },
  delete(platformType: string, accountId: string) {
    return http.delete(`/api/account/${platformType}/${accountId}`)
  },
  clearPool(platformType: string) {
    return http.delete(`/api/account/pool/${platformType}`)
  },
  stats() {
    return http.get('/api/account/stats')
  },
  replenish(platformType: string, count = 1) {
    return http.post(`/api/account/replenish/${platformType}`, null, { params: { count } })
  },
  getSettings() {
    return http.get('/api/account/settings')
  },
  saveSettings(data: Record<string, any>) {
    return http.post('/api/account/settings', data)
  }
}
