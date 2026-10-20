import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
//#region ../../pages/datasource/src/api/zkNacosApi.ts
var unwrap = (res) => unwrapResult(res);
/**
* 采集 ZooKeeper 集群各节点运行指标（mntr，可能较慢，需 loading）
* @param datasourceId 数据源 ID（可选）
*/
var fetchZkCluster = (datasourceId) => http().get("/ms/monitor/zookeeper/cluster").query({ datasourceId }).timeout(15e3).then((r) => unwrap(r));
/**
* 读取 ZooKeeper 节点 ACL 列表
* @param path 节点路径
* @param datasourceId 数据源 ID（可选）
*/
var fetchZkNodeAcl = (path, datasourceId) => http().get("/ms/monitor/zookeeper/node/acl").query({
	path,
	datasourceId
}).then((r) => unwrap(r));
/**
* 删除 ZooKeeper 节点（recursive=true 时递归删除所有子孙节点）
* @param path 节点路径
* @param datasourceId 数据源 ID（可选）
* @param recursive 是否递归删除
*/
var deleteZkNodeRecursive = (path, datasourceId, recursive = false) => http().delete("/ms/monitor/zookeeper/node").query({
	path,
	datasourceId,
	recursive
}).then((r) => unwrap(r));
/**
* 新建 Nacos 命名空间
* @param payload 命名空间载荷
*/
var createNacosNamespace = (payload) => http().post("/ms/monitor/nacos/namespace").data(payload).then((r) => unwrap(r));
/**
* 编辑 Nacos 命名空间
* @param payload 命名空间载荷
*/
var updateNacosNamespace = (payload) => http().put("/ms/monitor/nacos/namespace").data(payload).then((r) => unwrap(r));
/**
* 删除 Nacos 命名空间
* @param namespaceId 命名空间 ID
* @param datasourceId 数据源 ID（可选）
*/
var deleteNacosNamespace = (namespaceId, datasourceId) => http().delete("/ms/monitor/nacos/namespace").query({
	namespaceId,
	datasourceId
}).then((r) => unwrap(r));
/**
* 查询 Nacos 服务实例列表
* @param params 数据源/命名空间/服务名/分组
*/
var fetchNacosInstances = (params) => http().get("/ms/monitor/nacos/service/instances").query(params).then((r) => unwrap(r));
/**
* 更新 Nacos 实例（上下线或改权重）
* @param payload 实例更新载荷
*/
var updateNacosInstance = (payload) => http().put("/ms/monitor/nacos/service/instance").data(payload).then((r) => unwrap(r));
//#endregion
export { fetchZkCluster as a, updateNacosNamespace as c, fetchNacosInstances as i, deleteNacosNamespace as n, fetchZkNodeAcl as o, deleteZkNodeRecursive as r, updateNacosInstance as s, createNacosNamespace as t };
