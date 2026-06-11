import type { ReturnResult } from "@repo/utils";
import { datalakeRequest } from "./request";

/** 订阅器信息 */
export interface SubscriberInfo {
  name?: string;
  label?: string;
  protocol: string;
  port: number;
  running: boolean;
  topics?: string[];
  tags?: string[];
  callbackUrl?: string;
}

/** 客户端订阅详情 */
export interface ClientSubscriptionInfo {
  clientId?: string;
  protocol?: string;
  pipelineId?: string;
  topics?: string[];
  tags?: string[];
  filter?: Record<string, any>;
  callbackUrl?: string;
  pending?: number;
  clientIp?: string;
  sourceIp?: string;
  userAgent?: string;
  endpoint?: string;
  registeredAt?: number;
  lastSeenAt?: number;
}

/** 客户端订阅映射 */
export type SubscriberClientMap = Record<string, Record<string, ClientSubscriptionInfo> | ClientSubscriptionInfo[]>;

/** 订阅器列表 */
export const fetchSubscriberList = () =>
  datalakeRequest<ReturnResult<SubscriberInfo[]>>("get", "/v2/datalake/subscriber/list");

/** 已连接客户端列表 */
export const fetchSubscriberClients = () =>
  datalakeRequest<ReturnResult<SubscriberClientMap>>("get", "/v2/datalake/subscriber/clients");
