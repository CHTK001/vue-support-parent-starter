import { http, type ReturnResult } from "@repo/utils";

/** 采集器客户端信息（注册上来的数据采集器） */
export interface CollectorClientInfo {
  clientId: string;
  pipelineId?: string;
  topics?: string[];
  tags?: string[];
  type?: string;
  status: string; // "ONLINE" | "OFFLINE"
  sourceIp?: string;
  lastHeartbeat: number;
}

/** 采集器客户端列表 */
export const fetchCollectorList = () =>
  http.request<ReturnResult<CollectorClientInfo[]>>("get", "/v2/datalake/collector/list");