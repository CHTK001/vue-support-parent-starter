import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/**
 * 数据源级 Redis 管理 API（/ms/monitor/redis-manage）
 *
 * <p>与 monitorApi.ts 中的系统 Redis（应用自身 Redis）相互独立：这里操作任意已登记的
 * type=redis 数据源，每次调用都带 datasourceId 与 db。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */

// ==================== 类型定义 ====================

/** 键浏览器列表项 */
export type RedisManageKeyItem = {
  key: string;
  type: string;
  ttl: number;
};

/** SCAN 结果 */
export type RedisManageScanResult = {
  keys: RedisManageKeyItem[];
  nextCursor: string;
  total: number;
};

/** 哈希字段 / 流消息字段 */
export type RedisField = { field: string; value: string };

/** 有序集合成员 */
export type RedisMemberScore = { member: string; score: number };

/** 流消息 */
export type RedisStreamMsg = { id: string; fields: RedisField[] };

/** 键详情（value 随类型变化） */
export type RedisManageKeyDetail = {
  key: string;
  type: string;
  ttl: number;
  size: number;
  value:
    | string
    | string[]
    | Record<string, string>
    | RedisMemberScore[]
    | RedisStreamMsg[]
    | null;
};

/** 库键统计 */
export type RedisManageDatabase = { db: number; keys: number; expires: number };

/** 新增键请求体 */
export type RedisCreateKeyBody = {
  key: string;
  type: string;
  value?: string;
  ttl: number;
  hashFields?: RedisField[];
  listItems?: string[];
  setItems?: string[];
  zsetMembers?: RedisMemberScore[];
};

// ==================== 键浏览 ====================

/**
 * SCAN 键列表
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param pattern      匹配模式
 * @param cursor       游标
 * @param count        每批数量
 */
export const scanRedisKeys = (
  datasourceId: number,
  db: number,
  pattern: string,
  cursor: string,
  count = 100
) =>
  http()
    .get("/ms/monitor/redis-manage/keys")
    .query({ datasourceId, db, pattern, cursor, count })
    .then(r => unwrap<RedisManageScanResult>(r));

/**
 * 读取键详情
 */
export const getRedisKeyDetail = (datasourceId: number, db: number, key: string) =>
  http()
    .get(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}`)
    .query({ datasourceId, db })
    .then(r => unwrap<RedisManageKeyDetail>(r));

/**
 * 新增键
 */
export const createRedisKey = (datasourceId: number, db: number, body: RedisCreateKeyBody) =>
  http()
    .post("/ms/monitor/redis-manage/key")
    .query({ datasourceId, db })
    .data(body)
    .then(r => unwrap<boolean>(r));

/**
 * 覆盖 STRING 值
 */
export const setRedisString = (datasourceId: number, db: number, key: string, value: string) =>
  http()
    .put(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}`)
    .query({ datasourceId, db })
    .data({ value })
    .then(r => unwrap<boolean>(r));

/**
 * 删除键
 */
export const deleteRedisKeys = (datasourceId: number, db: number, keys: string[]) =>
  http()
    .delete("/ms/monitor/redis-manage/key")
    .query({ datasourceId, db })
    .data({ keys })
    .then(r => unwrap<number>(r));

/**
 * 设置 TTL（秒，-1 永久）
 */
export const expireRedisKey = (datasourceId: number, db: number, key: string, ttl: number) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/expire`)
    .query({ datasourceId, db, ttl })
    .then(r => unwrap<boolean>(r));

/**
 * 重命名键
 */
export const renameRedisKey = (datasourceId: number, db: number, key: string, newKey: string) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/rename`)
    .query({ datasourceId, db, newKey })
    .then(r => unwrap<boolean>(r));

// ==================== 服务信息 / 库 ====================

/**
 * Redis INFO 关键字段
 */
export const fetchRedisInfo = (datasourceId: number) =>
  http()
    .get("/ms/monitor/redis-manage/info")
    .query({ datasourceId })
    .then(r => unwrap<Record<string, string>>(r));

/**
 * 库列表及键数
 */
export const fetchRedisDatabases = (datasourceId: number) =>
  http()
    .get("/ms/monitor/redis-manage/databases")
    .query({ datasourceId })
    .then(r => unwrap<RedisManageDatabase[]>(r));

// ==================== 元素级操作 ====================

/** HSET */
export const redisHashSet = (datasourceId: number, db: number, key: string, field: string, value: string) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/hash`)
    .query({ datasourceId, db })
    .data({ field, value })
    .then(r => unwrap<boolean>(r));

/** HDEL */
export const redisHashDel = (datasourceId: number, db: number, key: string, field: string) =>
  http()
    .delete(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/hash`)
    .query({ datasourceId, db, field })
    .then(r => unwrap<number>(r));

/** RPUSH */
export const redisListPush = (datasourceId: number, db: number, key: string, value: string) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/list`)
    .query({ datasourceId, db })
    .data({ value })
    .then(r => unwrap<number>(r));

/** LSET */
export const redisListSet = (datasourceId: number, db: number, key: string, index: number, value: string) =>
  http()
    .put(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/list`)
    .query({ datasourceId, db })
    .data({ index, value })
    .then(r => unwrap<boolean>(r));

/** LREM by index */
export const redisListRem = (datasourceId: number, db: number, key: string, index: number) =>
  http()
    .delete(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/list`)
    .query({ datasourceId, db, index })
    .then(r => unwrap<number>(r));

/** SADD */
export const redisSetAdd = (datasourceId: number, db: number, key: string, member: string) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/set`)
    .query({ datasourceId, db })
    .data({ value: member })
    .then(r => unwrap<boolean>(r));

/** SREM */
export const redisSetRem = (datasourceId: number, db: number, key: string, member: string) =>
  http()
    .delete(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/set`)
    .query({ datasourceId, db, member })
    .then(r => unwrap<number>(r));

/** ZADD */
export const redisZsetAdd = (datasourceId: number, db: number, key: string, member: string, score: number) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/zset`)
    .query({ datasourceId, db })
    .data({ member, score })
    .then(r => unwrap<boolean>(r));

/** ZREM */
export const redisZsetRem = (datasourceId: number, db: number, key: string, member: string) =>
  http()
    .delete(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/zset`)
    .query({ datasourceId, db, member })
    .then(r => unwrap<number>(r));

/** XADD */
export const redisStreamAdd = (datasourceId: number, db: number, key: string, fields: RedisField[]) =>
  http()
    .post(`/ms/monitor/redis-manage/key/${encodeURIComponent(key)}/stream`)
    .query({ datasourceId, db })
    .data({ fields })
    .then(r => unwrap<string>(r));
