import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/kafka/${id}`;

// ─── 连接管理 ────────────────────────────────────────────────────────────

export const openKafkaConnection = (
  host: string,
  port: number,
  username?: string,
  password?: string,
  protocol?: string,
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/kafka/open", {
    data: { host, port, username, password, protocol },
  });

export const closeKafkaConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

// ─── 集群信息 ────────────────────────────────────────────────────────────

export const fetchKafkaClusterHealth = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/cluster-health`);

export const listKafkaBrokers = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/brokers`);

// ─── Topic 管理 ──────────────────────────────────────────────────────────

export const listKafkaTopics = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/topics`);

export const createKafkaTopic = (
  connectionId: string,
  topicName: string,
  numPartitions: number,
  replicationFactor: number,
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/topics`, {
    data: { topicName, numPartitions, replicationFactor },
  });

export const deleteKafkaTopic = (connectionId: string, topicName: string) =>
  http.request<ReturnResult<boolean>>("delete", `${BASE(connectionId)}/topics`, {
    params: { topicName },
  });

export const fetchKafkaTopicDetail = (connectionId: string, topicName: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/topics/${topicName}`);

// ─── 消息消费 ────────────────────────────────────────────────────────────

export const consumeKafkaMessages = (
  connectionId: string,
  topicName: string,
  partition = -1,
  offset = -1,
  limit = 50,
) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/messages`, {
    params: { topicName, partition, offset, limit },
  });

// ─── 消费者组 ────────────────────────────────────────────────────────────

export const listKafkaConsumerGroups = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/consumer-groups`);

export const fetchKafkaConsumerGroupDetail = (connectionId: string, groupId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/consumer-groups/${groupId}`);
