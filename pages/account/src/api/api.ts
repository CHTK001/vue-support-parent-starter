import request from '@repo/utils'

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
    return request.post(`/api/account/register/${platformType}`, null, { params: { emailProvider, proxy } })
  },
  registerBatch(platformType: string, count: number, emailProvider?: string) {
    return request.post(`/api/account/register-batch/${platformType}?count=${count}${emailProvider ? '&emailProvider=' + emailProvider : ''}`)
  },
  acquire(platformType: string) {
    return request.get(`/api/account/acquire/${platformType}`)
  },
  list(platformType: string) {
    return request.get(`/api/account/list/${platformType}`)
  },
  release(platformType: string, accountId: string) {
    return request.post(`/api/account/release/${platformType}/${accountId}`)
  },
  delete(platformType: string, accountId: string) {
    return request.delete(`/api/account/${platformType}/${accountId}`)
  },
  clearPool(platformType: string) {
    return request.delete(`/api/account/pool/${platformType}`)
  },
  stats() {
    return request.get('/api/account/stats')
  },
  replenish(platformType: string, count = 1) {
    return request.post(`/api/account/replenish/${platformType}?count=${count}`)
  },
  getSettings() {
    return request.get('/api/account/settings')
  },
  saveSettings(data: Record<string, any>) {
    return request.post('/api/account/settings', data)
  }
}
