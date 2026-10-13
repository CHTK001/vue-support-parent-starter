import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== Redis 控制台 API（/ms/monitor/redis-manage） ====================

/**
 * SCAN 键列表行
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisKeyItem {
  [key: string]: unknown;
  key: string;
  type: string;
  ttl: number;
}

/**
 * SCAN 结果（游标分页）
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisScanResult {
  keys: RedisKeyItem[];
  nextCursor: string;
  total: number;
}

/**
 * 哈希字段
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisHashField {
  [key: string]: unknown;
  field: string;
  value: string;
}

/**
 * 列表元素（下标 + 值）
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisListElement {
  index: number;
  value: string;
}

/**
 * 有序集合成员（成员 + 分值）
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisMemberScore {
  member: string;
  score: number;
}

/**
 * 流消息
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisStreamEntry {
  [key: string]: unknown;
  id: string;
  fields: RedisHashField[];
}

/**
 * 键详情（value 形态随 type 变化）：
 * STRING → string；HASH → Record&lt;string, string&gt;；LIST/SET → string[]；
 * ZSET → RedisMemberScore[]；STREAM → RedisStreamEntry[]
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisKeyDetail {
  key: string;
  type: string;
  /** -1 = 永不过期 */
  ttl: number;
  value: unknown;
  /** 元素个数（STRING 为字符数） */
  size: number;
}

/**
 * 逻辑库统计
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisDatabase {
  db: number;
  keys: number;
  expires: number;
}

/**
 * 新增键入参（type 为 STRING/HASH/LIST/SET/ZSET）
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisCreateKeyPayload {
  [key: string]: unknown;
  datasourceId?: number;
  key: string;
  type: string;
  value?: string;
  ttl?: number;
  hashFields?: RedisHashField[];
  listItems?: string[];
  setItems?: string[];
  zsetMembers?: RedisMemberScore[];
}

/**
 * SCAN 键列表（游标分页）
 * @param params 数据源 / 库 / 模式 / 游标 / 每批数量
 */
export const scanRedisKeys = (params: {
  datasourceId?: number;
  db?: number;
  pattern?: string;
  cursor?: string;
  count?: number;
}) => http().get("/ms/monitor/redis-manage/keys").query(params).then(r => unwrap<RedisScanResult>(r));

/**
 * 读取键详情
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 */
export const fetchRedisKey = (datasourceId: number | undefined, db: number, key: string) =>
  http().get("/ms/monitor/redis-manage/key").query({ datasourceId, db, key }).then(r => unwrap<RedisKeyDetail>(r));

/**
 * 新增键（type 为 STRING/HASH/LIST/SET/ZSET）
 * @param params 见 {@link RedisCreateKeyPayload}
 * @param db 逻辑库序号
 */
export const createRedisKey = (params: RedisCreateKeyPayload, db: number) =>
  http().post("/ms/monitor/redis-manage/key").query({ datasourceId: params.datasourceId, db }).data(params).then(r => unwrap<boolean>(r));

/**
 * 覆盖写 STRING 值
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param value 新值
 */
export const setRedisString = (datasourceId: number | undefined, db: number, key: string, value: string) =>
  http().put("/ms/monitor/redis-manage/key").query({ datasourceId, db, key }).data({ value }).then(r => unwrap<boolean>(r));

/**
 * 批量删除键
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param keys 键名列表
 */
export const deleteRedisKeys = (datasourceId: number | undefined, db: number, keys: string[]) =>
  http().delete("/ms/monitor/redis-manage/key").query({ datasourceId, db }).data({ keys }).then(r => unwrap<number>(r));

/**
 * 设置 TTL（-1 永久）
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param ttl 过期秒数
 */
export const expireRedisKey = (datasourceId: number | undefined, db: number, key: string, ttl: number) =>
  http().post("/ms/monitor/redis-manage/key/expire").query({ datasourceId, db, key, ttl }).then(r => unwrap<boolean>(r));

/**
 * 重命名键
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 原键名
 * @param newKey 新键名
 */
export const renameRedisKey = (datasourceId: number | undefined, db: number, key: string, newKey: string) =>
  http().post("/ms/monitor/redis-manage/key/rename").query({ datasourceId, db, key, newKey }).then(r => unwrap<boolean>(r));

/**
 * 读取 INFO 关键字段
 * @param datasourceId 数据源 ID
 */
export const fetchRedisInfo = (datasourceId?: number) =>
  http().get("/ms/monitor/redis-manage/info").query({ datasourceId }).then(r => unwrap<Record<string, string>>(r));

/**
 * 库列表及键统计
 * @param datasourceId 数据源 ID
 */
export const fetchRedisDatabases = (datasourceId?: number) =>
  http().get("/ms/monitor/redis-manage/databases").query({ datasourceId }).then(r => unwrap<RedisDatabase[]>(r));

/**
 * HSET 写入哈希字段
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param field 字段
 */
export const hsetRedisField = (datasourceId: number | undefined, db: number, key: string, field: RedisHashField) =>
  http().post("/ms/monitor/redis-manage/key/hash").query({ datasourceId, db, key }).data(field).then(r => unwrap<boolean>(r));

/**
 * HDEL 删除哈希字段
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param field 字段名
 */
export const hdelRedisField = (datasourceId: number | undefined, db: number, key: string, field: string) =>
  http().delete("/ms/monitor/redis-manage/key/hash").query({ datasourceId, db, key, field }).then(r => unwrap<number>(r));

/**
 * RPUSH 追加列表元素
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param value 元素
 */
export const rpushRedisElement = (datasourceId: number | undefined, db: number, key: string, value: string) =>
  http().post("/ms/monitor/redis-manage/key/list").query({ datasourceId, db, key }).data({ value }).then(r => unwrap<number>(r));

/**
 * LSET 覆盖列表元素
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param index 下标
 * @param value 新值
 */
export const lsetRedisElement = (datasourceId: number | undefined, db: number, key: string, index: number, value: string) =>
  http().put("/ms/monitor/redis-manage/key/list").query({ datasourceId, db, key }).data({ index, value }).then(r => unwrap<boolean>(r));

/**
 * 按下标删除列表元素
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param index 下标
 */
export const lremRedisIndex = (datasourceId: number | undefined, db: number, key: string, index: number) =>
  http().delete("/ms/monitor/redis-manage/key/list").query({ datasourceId, db, key, index }).then(r => unwrap<number>(r));

/**
 * SADD 添加集合成员
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param value 成员
 */
export const saddRedisMember = (datasourceId: number | undefined, db: number, key: string, value: string) =>
  http().post("/ms/monitor/redis-manage/key/set").query({ datasourceId, db, key }).data({ value }).then(r => unwrap<boolean>(r));

/**
 * SREM 删除集合成员
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param member 成员
 */
export const sremRedisMember = (datasourceId: number | undefined, db: number, key: string, member: string) =>
  http().delete("/ms/monitor/redis-manage/key/set").query({ datasourceId, db, key, member }).then(r => unwrap<number>(r));

/**
 * ZADD 写入有序集合成员
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param member 成员
 * @param score 分值
 */
export const zaddRedisMember = (datasourceId: number | undefined, db: number, key: string, member: string, score: number) =>
  http().post("/ms/monitor/redis-manage/key/zset").query({ datasourceId, db, key }).data({ member, score }).then(r => unwrap<boolean>(r));

/**
 * ZREM 删除有序集合成员
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param member 成员
 */
export const zremRedisMember = (datasourceId: number | undefined, db: number, key: string, member: string) =>
  http().delete("/ms/monitor/redis-manage/key/zset").query({ datasourceId, db, key, member }).then(r => unwrap<number>(r));

/**
 * XADD 追加流消息
 * @param datasourceId 数据源 ID
 * @param db 逻辑库序号
 * @param key 键名
 * @param fields 消息字段
 */
export const xaddRedisStream = (datasourceId: number | undefined, db: number, key: string, fields: RedisHashField[]) =>
  http().post("/ms/monitor/redis-manage/key/stream").query({ datasourceId, db, key }).data({ id: "", fields }).then(r => unwrap<string>(r));

/**
 * 命令执行结果（reply 为归一化 RESP 结构：
 * 字符串/整数/数组/嵌套对象，nil 为 null）
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisCommandResult {
  /** 实际执行的命令（分词后以空格重连） */
  command: string;
  /** 归一化后的回复 */
  reply: unknown;
}

/**
 * 通用命令执行入参
 * @author CH
 * @since 4.0.0.43
 */
export interface RedisCommandPayload {
  [key: string]: unknown;
  datasourceId?: number;
  db?: number;
  command: string;
}

/**
 * 执行任意 Redis 命令（命令控制台通用通道）
 * @param params 数据源 / 库 / 命令整行（支持引号包裹含空格的参数）
 */
export const executeRedisCommand = (params: RedisCommandPayload) =>
  http().post("/ms/monitor/redis-manage/command").data(params).then(r => unwrap<RedisCommandResult>(r));
