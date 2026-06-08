/**
 * 主动采集器 API
 */
import { request } from "@repo/utils";

const BASE_URL = "/api/active-collector";

export interface ActiveCollectorStats {
  protocol: string;
  running: boolean;
  mappings: number;
  topics?: string[];
  host?: string;
  port?: number;
  messagesReceived?: number;
  messagesProcessed?: number;
}

export interface MappingInfo {
  protocol: string;
  topic: string;
  pipelineId: string;
}

export interface MappingRequest {
  protocol: string;
  topic: string;
  pipelineId: string;
}

export async function fetchActiveCollectorStats(): Promise<any> {
  return request.get(`${BASE_URL}/stats`);
}

export async function registerMapping(data: MappingRequest): Promise<any> {
  return request.post(`${BASE_URL}/mapping`, data);
}

export async function unregisterMapping(params: {
  protocol: string;
  topic: string;
}): Promise<any> {
  return request.delete(`${BASE_URL}/mapping`, { params });
}

export async function listActiveCollectors(): Promise<any> {
  return request.get(`${BASE_URL}/stats`);
}