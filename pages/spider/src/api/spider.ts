import type { ApiResult, DashboardSummary, SpiderDefinition, SpiderExecution } from "../types/spider"

const BASE = "/spider"

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  const json: ApiResult<T> = await res.json()
  if (json.code !== "00000") throw new Error(json.msg || "请求失败")
  return json.data
}

export function fetchDefinitions(): Promise<SpiderDefinition[]> {
  return request(`${BASE}/definitions`)
}

export function fetchDefinitionDetail(spiderCode: string): Promise<SpiderDefinition> {
  return request(`${BASE}/definitions/detail?spiderCode=${encodeURIComponent(spiderCode)}`)
}

export function saveDefinition(def: SpiderDefinition): Promise<SpiderDefinition> {
  return request(`${BASE}/definitions/save`, {
    method: "POST",
    body: JSON.stringify(def),
  })
}

export function updateDefinition(def: SpiderDefinition): Promise<SpiderDefinition> {
  return request(`${BASE}/definitions/update`, {
    method: "POST",
    body: JSON.stringify(def),
  })
}

export function deleteDefinition(spiderCode: string): Promise<boolean> {
  return request(`${BASE}/definitions/delete?spiderCode=${encodeURIComponent(spiderCode)}`, {
    method: "POST",
  })
}

export function updateDefinitionStatus(spiderCode: string, spiderStatus: number): Promise<SpiderDefinition> {
  return request(`${BASE}/definitions/status`, {
    method: "POST",
    body: JSON.stringify({ spiderCode, spiderStatus }),
  })
}

export function fetchExecutions(spiderDefinitionCode: string, limit?: number): Promise<SpiderExecution[]> {
  let url = `${BASE}/executions/list?spiderDefinitionCode=${encodeURIComponent(spiderDefinitionCode)}`
  if (limit != null) url += `&limit=${limit}`
  return request(url)
}

export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return request(`${BASE}/dashboard/summary`)
}
