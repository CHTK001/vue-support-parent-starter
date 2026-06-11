/**
 * 主动采集器 API
 */
import { datalakeRequest } from "./request";

const BASE_URL = "/v2/datalake/active-collector";

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

export interface ActiveCollectorStatsPayload {
  activeCollectors: ActiveCollectorStats[];
  count: number;
  mappings: MappingInfo[];
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

export async function fetchActiveCollectorStats(): Promise<ActiveCollectorStatsPayload | any> {
  return datalakeRequest("get", `${BASE_URL}/stats`);
}

export async function registerMapping(data: MappingRequest): Promise<any> {
  return datalakeRequest("post", `${BASE_URL}/mapping`, { data });
}

export async function unregisterMapping(params: {
  protocol: string;
  topic: string;
}): Promise<any> {
  return datalakeRequest("delete", `${BASE_URL}/mapping`, { params });
}

export async function listActiveCollectors(): Promise<any> {
  return datalakeRequest("get", `${BASE_URL}/stats`);
}
