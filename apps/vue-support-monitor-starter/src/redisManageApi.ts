import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

/**
 * 数据源级 Redis 管理 API（/ms/monitor/redis-manage）
 *
 * <p>与 monitorApi.ts 中的系统 Redis（应用自身 Redis）相互独立：这里操作任意已登记的
 * type=redis 数据源，每次调用都带 datasourceId 与 db。</p>
 *
 * <p><strong>为什么 key 走查询参数而不是路径参数</strong>：Redis 键名允许出现 `/`
 * （如 {@code user:1/profile}）。放在路径里时，编码后的 {@code %2F} 会被 Tomcat 默认拒绝
 * （HTTP 400），未编码的 `/` 又被当成路径分隔符（404）——结果是这类键能建、能列出，
 * 但看不了也改不了。改成 {@code /key?key=...} 后任意键名都能正常寻址。</p>
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
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名（走查询参数，允许含 / 等任意字符）
 */
export const getRedisKeyDetail = (datasourceId: number, db: number, key: string) =>
  http()
    .get("/ms/monitor/redis-manage/key")
    .query({ datasourceId, db, key })
    .then(r => unwrap<RedisManageKeyDetail>(r));

/**
 * 新增键
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param body         键定义
 */
export const createRedisKey = (datasourceId: number, db: number, body: RedisCreateKeyBody) =>
  http()
    .post("/ms/monitor/redis-manage/key")
    .query({ datasourceId, db })
    .data(body)
    .then(r => unwrap<boolean>(r));

/**
 * 覆盖 STRING 值
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param value        新值
 */
export const setRedisString = (datasourceId: number, db: number, key: string, value: string) =>
  http()
    .put("/ms/monitor/redis-manage/key")
    .query({ datasourceId, db, key })
    .data({ value })
    .then(r => unwrap<boolean>(r));

/**
 * 删除键
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param keys         待删除键名
 */
export const deleteRedisKeys = (datasourceId: number, db: number, keys: string[]) =>
  http()
    .delete("/ms/monitor/redis-manage/key")
    .query({ datasourceId, db })
    .data({ keys })
    .then(r => unwrap<number>(r));

/**
 * 设置 TTL（秒，-1 永久）
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param ttl          过期秒数
 */
export const expireRedisKey = (datasourceId: number, db: number, key: string, ttl: number) =>
  http()
    .post("/ms/monitor/redis-manage/key/expire")
    .query({ datasourceId, db, key, ttl })
    .then(r => unwrap<boolean>(r));

/**
 * 重命名键
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          原键名
 * @param newKey       新键名
 */
export const renameRedisKey = (datasourceId: number, db: number, key: string, newKey: string) =>
  http()
    .post("/ms/monitor/redis-manage/key/rename")
    .query({ datasourceId, db, key, newKey })
    .then(r => unwrap<boolean>(r));

// ==================== 服务信息 / 库 ====================

/**
 * Redis INFO 关键字段
 * @param datasourceId 数据源 ID
 */
export const fetchRedisInfo = (datasourceId: number) =>
  http()
    .get("/ms/monitor/redis-manage/info")
    .query({ datasourceId })
    .then(r => unwrap<Record<string, string>>(r));

/**
 * 库列表及键数
 * @param datasourceId 数据源 ID
 */
export const fetchRedisDatabases = (datasourceId: number) =>
  http()
    .get("/ms/monitor/redis-manage/databases")
    .query({ datasourceId })
    .then(r => unwrap<RedisManageDatabase[]>(r));

// ==================== 元素级操作 ====================

/**
 * HSET
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param field        字段名
 * @param value        字段值
 */
export const redisHashSet = (datasourceId: number, db: number, key: string, field: string, value: string) =>
  http()
    .post("/ms/monitor/redis-manage/key/hash")
    .query({ datasourceId, db, key })
    .data({ field, value })
    .then(r => unwrap<boolean>(r));

/**
 * HDEL
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param field        字段名
 */
export const redisHashDel = (datasourceId: number, db: number, key: string, field: string) =>
  http()
    .delete("/ms/monitor/redis-manage/key/hash")
    .query({ datasourceId, db, key, field })
    .then(r => unwrap<number>(r));

/**
 * RPUSH
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param value        元素
 */
export const redisListPush = (datasourceId: number, db: number, key: string, value: string) =>
  http()
    .post("/ms/monitor/redis-manage/key/list")
    .query({ datasourceId, db, key })
    .data({ value })
    .then(r => unwrap<number>(r));

/**
 * LSET
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param index        下标
 * @param value        新值
 */
export const redisListSet = (datasourceId: number, db: number, key: string, index: number, value: string) =>
  http()
    .put("/ms/monitor/redis-manage/key/list")
    .query({ datasourceId, db, key })
    .data({ index, value })
    .then(r => unwrap<boolean>(r));

/**
 * LREM by index
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param index        下标
 */
export const redisListRem = (datasourceId: number, db: number, key: string, index: number) =>
  http()
    .delete("/ms/monitor/redis-manage/key/list")
    .query({ datasourceId, db, key, index })
    .then(r => unwrap<number>(r));

/**
 * SADD
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param member       成员
 */
export const redisSetAdd = (datasourceId: number, db: number, key: string, member: string) =>
  http()
    .post("/ms/monitor/redis-manage/key/set")
    .query({ datasourceId, db, key })
    .data({ value: member })
    .then(r => unwrap<boolean>(r));

/**
 * SREM
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param member       成员
 */
export const redisSetRem = (datasourceId: number, db: number, key: string, member: string) =>
  http()
    .delete("/ms/monitor/redis-manage/key/set")
    .query({ datasourceId, db, key, member })
    .then(r => unwrap<number>(r));

/**
 * ZADD
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param member       成员
 * @param score        分值
 */
export const redisZsetAdd = (datasourceId: number, db: number, key: string, member: string, score: number) =>
  http()
    .post("/ms/monitor/redis-manage/key/zset")
    .query({ datasourceId, db, key })
    .data({ member, score })
    .then(r => unwrap<boolean>(r));

/**
 * ZREM
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param member       成员
 */
export const redisZsetRem = (datasourceId: number, db: number, key: string, member: string) =>
  http()
    .delete("/ms/monitor/redis-manage/key/zset")
    .query({ datasourceId, db, key, member })
    .then(r => unwrap<number>(r));

/**
 * XADD
 * @param datasourceId 数据源 ID
 * @param db           逻辑库
 * @param key          键名
 * @param fields       消息字段
 */
export const redisStreamAdd = (datasourceId: number, db: number, key: string, fields: RedisField[]) =>
  http()
    .post("/ms/monitor/redis-manage/key/stream")
    .query({ datasourceId, db, key })
    .data({ fields })
    .then(r => unwrap<string>(r));
