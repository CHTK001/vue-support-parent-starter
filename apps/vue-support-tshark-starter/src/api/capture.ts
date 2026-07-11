const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export interface CaptureSession {
  id: number
  sessionName: string
  interfaceName: string
  filterExpression: string
  status: string
  startTime: string
  endTime: string
  packetCount: number
  createdAt: string
}

export interface PacketCapture {
  id: number
  sessionId: number
  packetNumber: number
  timestamp: string
  sourceIp: string
  destinationIp: string
  sourcePort: number
  destinationPort: number
  protocol: string
  length: number
  info: string
  rawData: string
  lifecycle: string
}

export interface PacketListResponse {
  total: number
  offset: number
  limit: number
  data: PacketCapture[]
}

export interface CaptureStats {
  total: number
  protocols: Array<{ protocol: string; count: number }>
}

export interface CaptureStatus {
  running: boolean
  status: string
  sessionId: number | null
}

export const captureApi = {
  listSessions: () => request<CaptureSession[]>('/capture/sessions'),

  startCapture: (data: { name?: string; interface: string; filter?: string }) =>
    request<CaptureSession>('/capture/start', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  pauseCapture: () =>
    request<{ success: boolean }>('/capture/pause', { method: 'POST' }),

  resumeCapture: () =>
    request<{ success: boolean }>('/capture/resume', { method: 'POST' }),

  stopCapture: () =>
    request<{ success: boolean }>('/capture/stop', { method: 'POST' }),

  getStatus: () => request<CaptureStatus>('/capture/status'),

  listInterfaces: () => request<string[]>('/capture/interfaces'),

  importPcap: (data: { name?: string; file: string; filename?: string }) =>
    request<CaptureSession>('/capture/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSession: (id: number) =>
    request<{ success: boolean }>(`/capture/sessions/${id}`, { method: 'DELETE' }),

  listPackets: (sessionId: number, offset = 0, limit = 100) =>
    request<PacketListResponse>(`/capture/packets?sessionId=${sessionId}&offset=${offset}&limit=${limit}`),

  getPacket: (id: number) => request<PacketCapture>(`/capture/packets/${id}`),

  getStats: (sessionId: number) =>
    request<CaptureStats>(`/capture/stats?sessionId=${sessionId}`),

  exportSessions: () =>
    request<any>('/export'),
}
