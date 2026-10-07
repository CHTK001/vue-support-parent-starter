import { http, unwrapResult } from "@repo/utils";

const unwrap = <T>(res: any): T => unwrapResult<T>(res);

// ==================== ZooKeeper 增强（集群 mntr / ACL / 递归删除 / 完整 Stat） ====================

/**
 * ZooKeeper 集群节点运行指标（四字命令 mntr 解析结果）
 * @author CH
 * @since 4.0.0.43
 */
export interface ZkClusterNode {
  host: string;
  zkVersion?: string;
  zkAvgLatency?: number;
  zkMinLatency?: number;
  zkMaxLatency?: number;
  zkPacketsReceived?: number;
  zkPacketsSent?: number;
  zkNumAliveConnections?: number;
  zkOutstandingRequests?: number;
  zkZnodeCount?: number;
  zkWatchCount?: number;
  zkApproximateDataSize?: number;
  zkOpenFileDescriptorCount?: number;
  /** leader / follower / standalone */
  zkServerState?: string;
  zkPeerState?: string;
  /** 四字命令失败原因，成功为 null */
  error?: string | null;
}

/**
 * ZooKeeper 节点 ACL 条目
 * @author CH
 * @since 4.0.0.43
 */
export interface ZkNodeAcl {
  [key: string]: unknown;
  scheme: string;
  id: string;
  perms: number;
  permsText: string;
}

/**
 * ZooKeeper 节点详情（在原有字段上补全 Stat 原始字段）
 * @author CH
 * @since 4.0.0.43
 */
export interface ZkNodeDetailFull {
  path: string;
  ephemeral: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  numChildren: number;
  dataLength: number;
  data: string;
  czxid?: number;
  mzxid?: number;
  pzxid?: number;
  cversion?: number;
  aversion?: number;
  ephemeralOwner?: number;
}

/**
 * 采集 ZooKeeper 集群各节点运行指标（mntr，可能较慢，需 loading）
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkCluster = (datasourceId?: number) =>
  http()
    .get("/ms/monitor/zookeeper/cluster")
    .query({ datasourceId })
    .timeout(15_000)
    .then(r => unwrap<ZkClusterNode[]>(r));

/**
 * 读取 ZooKeeper 节点 ACL 列表
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 */
export const fetchZkNodeAcl = (path: string, datasourceId?: number) =>
  http()
    .get("/ms/monitor/zookeeper/node/acl")
    .query({ path, datasourceId })
    .then(r => unwrap<ZkNodeAcl[]>(r));

/**
 * 删除 ZooKeeper 节点（recursive=true 时递归删除所有子孙节点）
 * @param path 节点路径
 * @param datasourceId 数据源 ID（可选）
 * @param recursive 是否递归删除
 */
export const deleteZkNodeRecursive = (path: string, datasourceId?: number, recursive = false) =>
  http()
    .delete("/ms/monitor/zookeeper/node")
    .query({ path, datasourceId, recursive })
    .then(r => unwrap<boolean>(r));

// ==================== Nacos 增强（命名空间 CRUD / 实例管理 / beta 发布 / 集群健康） ====================

/**
 * Nacos 服务实例
 * @author CH
 * @since 4.0.0.43
 */
export interface NacosInstance {
  ip: string;
  port: number;
  weight: number;
  healthy: boolean;
  enabled: boolean;
  ephemeral: boolean;
  clusterName?: string;
  metadata?: Record<string, string>;
}

/**
 * Nacos 命名空间编辑载荷
 * @author CH
 * @since 4.0.0.43
 */
export type NacosNamespacePayload = {
  datasourceId?: number;
  namespaceId?: string;
  namespaceName: string;
  namespaceDesc?: string;
};

/**
 * Nacos 实例更新载荷（上下线与改权重共用）
 * @author CH
 * @since 4.0.0.43
 */
export type NacosInstanceUpdatePayload = {
  datasourceId?: number;
  namespace?: string;
  serviceName: string;
  groupName?: string;
  ip: string;
  port: number;
  weight?: number;
  enabled?: boolean;
};

/**
 * 新建 Nacos 命名空间
 * @param payload 命名空间载荷
 */
export const createNacosNamespace = (payload: NacosNamespacePayload) =>
  http().post("/ms/monitor/nacos/namespace").data(payload).then(r => unwrap<boolean>(r));

/**
 * 编辑 Nacos 命名空间
 * @param payload 命名空间载荷
 */
export const updateNacosNamespace = (payload: NacosNamespacePayload) =>
  http().put("/ms/monitor/nacos/namespace").data(payload).then(r => unwrap<boolean>(r));

/**
 * 删除 Nacos 命名空间
 * @param namespaceId 命名空间 ID
 * @param datasourceId 数据源 ID（可选）
 */
export const deleteNacosNamespace = (namespaceId: string, datasourceId?: number) =>
  http().delete("/ms/monitor/nacos/namespace").query({ namespaceId, datasourceId }).then(r => unwrap<boolean>(r));

/**
 * 查询 Nacos 服务实例列表
 * @param params 数据源/命名空间/服务名/分组
 */
export const fetchNacosInstances = (params: {
  datasourceId?: number;
  namespace?: string;
  serviceName: string;
  groupName?: string;
}) =>
  http()
    .get("/ms/monitor/nacos/service/instances")
    .query(params)
    .then(r => unwrap<NacosInstance[]>(r));

/**
 * 更新 Nacos 实例（上下线或改权重）
 * @param payload 实例更新载荷
 */
export const updateNacosInstance = (payload: NacosInstanceUpdatePayload) =>
  http().put("/ms/monitor/nacos/service/instance").data(payload).then(r => unwrap<boolean>(r));

/**
 * Nacos 集群节点（补全 leader 标记）
 * @author CH
 * @since 4.0.0.43
 */
export interface NacosClusterNodeFull {
  ip: string;
  port: number;
  status: string;
  role: string;
  weight: number;
  leader?: boolean;
}
