import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/mqtt/${id}`;

// ─── 连接管理 ────────────────────────────────────────────────────────────

export const openMqttConnection = (
  host: string,
  port: number,
  username?: string,
  password?: string,
  clientId?: string,
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/mqtt/open", {
    data: { host, port, username: username || "", password: password || "", clientId: clientId || "" },
  });

export const closeMqttConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

// ─── Broker 信息 ──────────────────────────────────────────────────────────

export const fetchMqttBrokerInfo = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/info`);

// ─── 发布消息 ─────────────────────────────────────────────────────────────

export const publishMqttMessage = (
  connectionId: string,
  topic: string,
  payload: string,
  qos = 0,
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/publish`, {
    data: { topic, payload, qos },
  });

// ─── 订阅管理 ─────────────────────────────────────────────────────────────

export const subscribeMqttTopic = (connectionId: string, topic: string, qos = 1) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/subscribe`, {
    data: { topic, qos },
  });

export const unsubscribeMqttTopic = (connectionId: string, topic: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/subscribe/${encodeURIComponent(topic)}`,
  );

export const listMqttSubscriptions = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/subscriptions`);

// ─── 消息历史 ─────────────────────────────────────────────────────────────

export const fetchMqttMessages = (connectionId: string, topic?: string, limit = 50) => {
  const params = new URLSearchParams();
  if (topic) params.set("topic", topic);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/messages${qs ? "?" + qs : ""}`);
};
