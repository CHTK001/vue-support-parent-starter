import { http, type ReturnResult } from "@repo/utils";

/** 订阅器信息 */
export interface SubscriberInfo {
  protocol: string;
  port: number;
  running: boolean;
}

/** 客户端订阅详情 */
export interface ClientSubscription {
  pipelineId: string;
  topics: string[];
  pending: number;
}

/** 订阅器列表 */
export const fetchSubscriberList = () =>
  http.request<ReturnResult<SubscriberInfo[]>>("get", "/v2/datalake/subscriber/list");

/** 已连接客户端列表 */
export const fetchSubscriberClients = () =>
  http.request<ReturnResult<Record<string, string[] | ClientSubscription[]>>>("get", "/v2/datalake/subscriber/clients");