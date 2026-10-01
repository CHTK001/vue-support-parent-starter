import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== etcd 控制台 API ====================

/**
 * etcd 键列表项（不含值）
 * @author CH
 * @since 4.0.0.43
 */
export interface EtcdKey {
  key: string;
  createRevision?: number;
  modRevision?: number;
  version?: number;
  lease?: number;
}

/**
 * etcd 键详情（含值）
 * @author CH
 * @since 4.0.0.43
 */
export interface EtcdKeyDetail {
  key: string;
  value: string;
  binary: boolean;
  valueLength: number;
  createRevision?: number;
  modRevision?: number;
  version?: number;
  lease?: number;
  /** 绑定租约时的剩余 TTL 秒数 */
  ttlSeconds?: number | null;
}

/**
 * etcd 服务端状态
 * @author CH
 * @since 4.0.0.43
 */
export interface EtcdStatus {
  version?: string;
  leader?: string;
  dbSize?: number | null;
  dbSizeInUse?: number | null;
  raftIndex?: number | null;
  raftTerm?: number | null;
  revision?: number | null;
}

/**
 * etcd 租约
 * @author CH
 * @since 4.0.0.43
 */
export interface EtcdLease {
  id: number;
  ttl?: number | null;
  grantedTtl?: number | null;
  keyCount?: number | null;
}

/**
 * etcd 集群成员
 * @author CH
 * @since 4.0.0.43
 */
export interface EtcdMember {
  id: string;
  name?: string;
  peerUrls?: string;
  clientUrls?: string;
  leader: boolean;
  healthy: boolean;
  version?: string | null;
  dbSize?: number | null;
  error?: string | null;
}

/**
 * etcd 连通性测试结果
 * @author CH
 * @since 4.0.0.43
 */
export interface EtcdTestResult {
  connected: boolean;
  version?: string | null;
  leader?: string | null;
  message: string;
}

/**
 * 测试 etcd 连通性（带凭据校验）
 * @param datasourceId 数据源 ID（可选）
 */
export const testEtcdConnection = (datasourceId?: number) =>
  http().post("/ms/monitor/etcd/test").data({ datasourceId }).then(r => unwrapResult<EtcdTestResult>(r));

/**
 * 读取 etcd 服务端状态
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchEtcdStatus = (datasourceId?: number) =>
  http().get("/ms/monitor/etcd/status").query({ datasourceId }).then(r => unwrap<EtcdStatus>(r));

/**
 * 按前缀列举键
 * @param params 数据源 / 前缀 / 条数上限 / 是否只取键名
 */
export const fetchEtcdKeys = (params: {
  datasourceId?: number;
  prefix?: string;
  limit?: number;
  keysOnly?: boolean;
}) => http().get("/ms/monitor/etcd/keys").query(params).then(r => unwrap<EtcdKey[]>(r));

/**
 * 读取键详情
 * @param key 键名
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchEtcdKey = (key: string, datasourceId?: number) =>
  http().get("/ms/monitor/etcd/key").query({ key, datasourceId }).then(r => unwrap<EtcdKeyDetail>(r));

/**
 * 写入键（新增或覆盖）
 * @param payload 数据源 / 键名 / 值 / 租约
 */
export const saveEtcdKey = (payload: {
  datasourceId?: number;
  key: string;
  value: string;
  lease?: number;
}) => http().put("/ms/monitor/etcd/key").data(payload).then(r => unwrap<boolean>(r));

/**
 * 删除键
 * @param key 键名
 * @param datasourceId 数据源 ID（可选）
 * @param prefix 为真时按前缀删除
 */
export const deleteEtcdKey = (key: string, datasourceId?: number, prefix = false) =>
  http().delete("/ms/monitor/etcd/key").query({ key, datasourceId, prefix }).then(r => unwrap<number>(r));

/**
 * 列举租约
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchEtcdLeases = (datasourceId?: number) =>
  http().get("/ms/monitor/etcd/leases").query({ datasourceId }).then(r => unwrap<EtcdLease[]>(r));

/**
 * 授予租约
 * @param payload 数据源 / TTL 秒数
 */
export const grantEtcdLease = (payload: { datasourceId?: number; ttl: number }) =>
  http().post("/ms/monitor/etcd/lease").data(payload).then(r => unwrap<EtcdLease>(r));

/**
 * 撤销租约（绑定的键会一并删除）
 * @param leaseId 租约 ID
 * @param datasourceId 数据源 ID（可选）
 */
export const revokeEtcdLease = (leaseId: number, datasourceId?: number) =>
  http().delete("/ms/monitor/etcd/lease").query({ leaseId, datasourceId }).then(r => unwrap<boolean>(r));

/**
 * 查询集群成员与健康
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchEtcdMembers = (datasourceId?: number) =>
  http().get("/ms/monitor/etcd/members").query({ datasourceId }).then(r => unwrap<EtcdMember[]>(r));
