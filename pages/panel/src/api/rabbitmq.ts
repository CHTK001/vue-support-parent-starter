import { http, type ReturnResult } from "@repo/utils";

const BASE = (id: string) => `/v1/panel/rabbitmq/${id}`;

// ─── 连接管理 ────────────────────────────────────────────────────────────

export const openRabbitMQConnection = (
  host: string,
  port: number,
  username: string,
  password: string,
  managementPort?: number,
) =>
  http.request<ReturnResult<string>>("post", "/v1/panel/rabbitmq/open", {
    data: { host, port, username, password, managementPort: managementPort || port + 10000 },
  });

export const closeRabbitMQConnection = (connectionId: string) =>
  http.request<ReturnResult<void>>("delete", BASE(connectionId));

// ─── 集群信息 ────────────────────────────────────────────────────────────

export const fetchRabbitMQOverview = (connectionId: string) =>
  http.request<ReturnResult<Record<string, any>>>("get", `${BASE(connectionId)}/overview`);

export const listRabbitMQNodes = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/nodes`);

// ─── 队列管理 ────────────────────────────────────────────────────────────

export const listRabbitMQQueues = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/queues`);

export const fetchRabbitMQQueueDetail = (connectionId: string, queueName: string) =>
  http.request<ReturnResult<Record<string, any>>>(
    "get",
    `${BASE(connectionId)}/queues/${encodeURIComponent(queueName)}`,
  );

export const deleteRabbitMQQueue = (connectionId: string, queueName: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/queues/${encodeURIComponent(queueName)}`,
  );

export const purgeRabbitMQQueue = (connectionId: string, queueName: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/queues/${encodeURIComponent(queueName)}/contents`,
  );

// ─── 交换机管理 ──────────────────────────────────────────────────────────

export const listRabbitMQExchanges = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/exchanges`);

export const fetchRabbitMQExchangeDetail = (connectionId: string, exchangeName: string) =>
  http.request<ReturnResult<Record<string, any>>>(
    "get",
    `${BASE(connectionId)}/exchanges/${encodeURIComponent(exchangeName)}`,
  );

// ─── 绑定 / 连接 / Channel ───────────────────────────────────────────────

export const listRabbitMQBindings = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/bindings`);

export const listRabbitMQConnections = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/connections`);

export const listRabbitMQChannels = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/channels`);

// ─── 消息操作 ────────────────────────────────────────────────────────────

export const publishRabbitMQMessage = (
  connectionId: string,
  exchange: string,
  routingKey: string,
  payload: string,
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/publish`, {
    data: { exchange, routingKey, payload },
  });

export const getRabbitMQMessages = (
  connectionId: string,
  queueName: string,
  count = 10,
  ackMode = "ack_requeue_true",
) =>
  http.request<ReturnResult<any[]>>("post", `${BASE(connectionId)}/queues/${encodeURIComponent(queueName)}/get`, {
    data: { count, ackMode },
  });

// ─── 管理操作 ────────────────────────────────────────────────────────────

export const createRabbitMQQueue = (
  connectionId: string,
  name: string,
  durable = true,
  autoDelete = false,
  args?: Record<string, any>,
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/queues`, {
    data: { name, durable, autoDelete, arguments: args },
  });

export const createRabbitMQExchange = (
  connectionId: string,
  name: string,
  type = "direct",
  durable = true,
  autoDelete = false,
  internal = false,
  args?: Record<string, any>,
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/exchanges`, {
    data: { name, type, durable, autoDelete, internal, arguments: args },
  });

export const deleteRabbitMQExchange = (connectionId: string, exchangeName: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/exchanges/${encodeURIComponent(exchangeName)}`,
  );

export const createRabbitMQBinding = (
  connectionId: string,
  exchange: string,
  queue: string,
  routingKey: string,
  args?: Record<string, any>,
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/bindings`, {
    data: { exchange, queue, routingKey, arguments: args },
  });

// ─── 用户管理 ────────────────────────────────────────────────────────────

export const listRabbitMQUsers = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/users`);

export const fetchRabbitMQUserDetail = (connectionId: string, username: string) =>
  http.request<ReturnResult<Record<string, any>>>(
    "get",
    `${BASE(connectionId)}/users/${encodeURIComponent(username)}`,
  );

export const createRabbitMQUser = (
  connectionId: string,
  username: string,
  password: string,
  tags = "",
) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/users`, {
    data: { username, password, tags },
  });

export const deleteRabbitMQUser = (connectionId: string, username: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/users/${encodeURIComponent(username)}`,
  );

export const fetchRabbitMQUserPermissions = (connectionId: string, username: string) =>
  http.request<ReturnResult<any[]>>(
    "get",
    `${BASE(connectionId)}/users/${encodeURIComponent(username)}/permissions`,
  );

export const setRabbitMQUserPermissions = (
  connectionId: string,
  username: string,
  vhost: string,
  configure: string,
  write: string,
  read: string,
) =>
  http.request<ReturnResult<boolean>>(
    "post",
    `${BASE(connectionId)}/users/${encodeURIComponent(username)}/permissions`,
    { data: { vhost, configure, write, read } },
  );

// ─── 虚拟主机管理 ────────────────────────────────────────────────────────

export const listRabbitMQVhosts = (connectionId: string) =>
  http.request<ReturnResult<any[]>>("get", `${BASE(connectionId)}/vhosts`);

export const fetchRabbitMQVhostDetail = (connectionId: string, vhostName: string) =>
  http.request<ReturnResult<Record<string, any>>>(
    "get",
    `${BASE(connectionId)}/vhosts/${encodeURIComponent(vhostName)}`,
  );

export const createRabbitMQVhost = (connectionId: string, name: string) =>
  http.request<ReturnResult<boolean>>("post", `${BASE(connectionId)}/vhosts`, {
    data: { name },
  });

export const deleteRabbitMQVhost = (connectionId: string, vhostName: string) =>
  http.request<ReturnResult<boolean>>(
    "delete",
    `${BASE(connectionId)}/vhosts/${encodeURIComponent(vhostName)}`,
  );
