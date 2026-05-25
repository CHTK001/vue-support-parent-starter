import { http, type ReturnResult } from "@repo/utils";
import type { Subscription, SubscriptionConfig } from "../types";

/** 订阅列表 */
export const fetchSubscriptionList = () =>
  http.request<ReturnResult<Subscription[]>>("get", "/v2/datalake/subscription/list");

/** 创建订阅 */
export const fetchCreateSubscription = (data: SubscriptionConfig) =>
  http.request<ReturnResult<Subscription>>("post", "/v2/datalake/subscription", { data });

/** 取消订阅 */
export const fetchCancelSubscription = (id: string) =>
  http.request<ReturnResult<boolean>>("delete", `/v2/datalake/subscription/${id}`);
