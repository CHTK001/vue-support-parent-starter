import { L as getAccessToken, w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
//#region ../../pages/datasource/src/api/manageConsoles.ts
/**
* 数据源控制台 API（@pages/datasource）
*
* <p>从监控应用 monitorApi.ts 搬运：数据库 web 管理器段 + 外部服务管理段
* （InfluxDB / Neo4j / Nacos / ZooKeeper）。请求走 @repo/utils 的 http 管线，
* 返回已解包的业务数据。</p>
*
* @author CH
* @since 4.0.0
*/
var unwrap = (res) => unwrapResult(res);
/**
* 获取数据库列表
* @param datasourceId 数据源 ID（可选）
* @returns 数据库名列表
*/
var fetchDbDatabases = (datasourceId) => http().get("/ms/monitor/db/databases").noToast(true).query({ datasourceId }).then((r) => unwrap(r));
/**
* 获取数据库表列表
* @param datasourceId 数据源 ID（可选）
* @param database 数据库名（可选）
* @returns 表信息列表
*/
var fetchDbTables = (datasourceId, database) => http().get("/ms/monitor/db/tables").noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 获取表结构
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 数据库名（可选）
* @returns 列信息列表
*/
var fetchTableColumns = (tableName, datasourceId, database) => http().get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/columns`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 获取表数据（分页）
* @param tableName 表名
* @param page 页码，默认 1
* @param pageSize 每页条数，默认 50
* @param orderBy 排序列（可选）
* @param orderDir 排序方向（可选）
* @param datasourceId 数据源 ID（可选）
* @param database 数据库名（可选）
* @param countTotal 是否统计总数（false 跳过大表 COUNT，total 返回 -1 表示未知）
* @param where WHERE 过滤条件（Navicat 式自由条件，可选）
* @param filters 结构化筛选条件（高级筛选，可选；与 where 同时给出时按 AND 组合）
* @returns 表数据分页结果
*/
var fetchTableData = (tableName, page = 1, pageSize = 50, orderBy, orderDir, datasourceId, database, countTotal = true, where, filters) => http().get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/data`).noToast(true).query({
	page,
	pageSize,
	orderBy,
	orderDir: orderBy ? orderDir || "ASC" : void 0,
	datasourceId,
	database,
	count: countTotal,
	where: where?.trim() ? where.trim() : void 0,
	filters: filters && filters.length > 0 ? JSON.stringify(filters) : void 0
}).then((r) => unwrap(r));
/** 高级筛选支持的运算符（与后端 DbFilter.operators 同口径） */
var DB_FILTER_OPS = [
	"=",
	"<>",
	">",
	">=",
	"<",
	"<=",
	"LIKE",
	"NOT LIKE",
	"IS NULL",
	"IS NOT NULL",
	"IN",
	"NOT IN",
	"BETWEEN"
];
/**
* 该运算符是否需要第二个值（BETWEEN 的上界）
* @param op 运算符
* @returns true=需要 value2
*/
var dbFilterNeedsValue2 = (op) => op === "BETWEEN";
/**
* 该运算符是否不接受任何值（IS NULL / IS NOT NULL）
* @param op 运算符
* @returns true=无值
*/
var dbFilterTakesNoValue = (op) => op === "IS NULL" || op === "IS NOT NULL";
/**
* 该运算符是否接受逗号分隔的多值（IN / NOT IN）
* @param op 运算符
* @returns true=多值
*/
var dbFilterTakesMultipleValues = (op) => op === "IN" || op === "NOT IN";
/**
* 获取表的建表语句（DDL）
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 数据库名（可选）
* @returns 建表语句
*/
var fetchTableDdl = (tableName, datasourceId, database) => http().get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/ddl`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 获取表的外键列表
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 数据库名（可选）
* @returns 外键列表
*/
var fetchForeignKeys = (tableName, datasourceId, database) => http().get(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/foreign-keys`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 执行 SQL（支持 SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/DROP）
* @param sql SQL 语句
* @param datasourceId 数据源 ID（可选）
* @param database 目标库名（可选，为空用连接默认库）
* @param txId 显式事务 ID（可选）；传了就在该事务的连接上执行
* @param timeoutMs 请求超时毫秒（可选；第九批 8.1 执行超时可配）。
*                  不传用全局默认 10s；传 0 = 不设上限（axios 约定）
* @returns SQL 执行结果
*/
var executeDbSql = (sql, datasourceId, database, txId, timeoutMs) => {
	const req = http().post("/ms/monitor/db/execute").noToast(true).data({
		sql,
		datasourceId,
		database,
		txId
	});
	return (timeoutMs === void 0 ? req : req.timeout(timeoutMs)).then((r) => unwrap(r));
};
/**
* 探测 text2sql 是否可用。
*
* <p><b>失败不抛</b>：后端未部署（404）或探测接口异常一律归一为「不可用」，
* 让入口保持隐藏 —— 「有整个功能才显示 text2sql」；错误也只留 reason 不弹 toast。</p>
*
* @returns 可用状态（永不 reject）
*/
var fetchDbAiStatus = async () => {
	try {
		return await http().get("/ms/monitor/db/ai/status").noToast(true).then((r) => unwrap(r));
	} catch (e) {
		return {
			available: false,
			reason: e?.message || "AI 状态探测失败（后端未集成或不可达）"
		};
	}
};
/**
* 自然语言 → SQL。
*
* <p>生成**不执行**：结果只回给编辑器，是否执行始终由用户显式点击。</p>
*
* @param text 查询需求（必填，非空由后端校验）
* @param context 结构上下文（可选，如已加载的表清单；注入系统提示词提升准确率）
* @param datasourceId 目标数据源 ID（可选）
* @returns 生成的 SQL 与模型名
*/
var requestDbText2Sql = (text, context, datasourceId) => http().post("/ms/monitor/db/ai/text2sql").noToast(true).timeout(12e4).data({
	text,
	context,
	datasourceId
}).then((r) => unwrap(r));
/**
* 读取库级 ER 图元数据（表清单 + 全部外键）。
*
* <p>一次往返拿完整库。前端逐表调外键端点在 40 表规模上是 40 次请求，
* 每次都要重新连库、切库，ER 图这种「整体视图」会明显卡住。</p>
*
* @param tables 表名过滤（LIKE 模式，可为空表示全部）
* @param datasourceId 数据源 ID（可选）
* @param database 目标库名（可选）
* @returns ER 图元数据
*/
var fetchErDiagram = (tables, datasourceId, database) => http().get("/ms/monitor/db/er-diagram").noToast(true).query({
	datasourceId,
	database,
	tables
}).then((r) => unwrap(r));
/**
* 比较两个库的结构，返回差异清单（源 → 目标，单向）。
*
* <p>只生成脚本、不代执行：清单里含 `DROP INDEX` / `MODIFY COLUMN`
* 这类不可逆语句，是否执行由用户看过脚本后决定。</p>
*
* @param payload 源/目标数据源与库
* @returns 差异清单
*/
var compareDbStructure = (payload) => http().post("/ms/monitor/db/structure-diff").noToast(true).data({ ...payload }).then((r) => unwrap(r));
/**
* 新建表（跨方言）
* @param payload 表名、列定义、可选注释与目标库
* @returns 是否创建成功
*/
var createDbTable = (payload) => http().post("/ms/monitor/db/table").noToast(true).data({ ...payload }).then((r) => unwrap(r));
/**
* 重命名表（跨方言）
*
* <p>不要在前端拼 `ALTER TABLE \`a\` RENAME TO \`b\``：反引号只对 MySQL 成立，
* H2/PostgreSQL 上会直接语法错。引号与候选写法交后端按内核选。</p>
*
* @param tableName 原表名
* @param newName 新表名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库名（可选）
* @returns 是否成功
*/
var renameDbTable = (tableName, newName, datasourceId, database) => http().put(`/ms/monitor/db/table/${encodeURIComponent(tableName)}/name`).noToast(true).query({
	newName,
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 删除表
* @param tableName 表名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库名（可选）
* @returns 删除结果
*/
var dropDbTable = (tableName, datasourceId, database) => http().delete(`/ms/monitor/db/table/${encodeURIComponent(tableName)}`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 删除视图
*
* <p>视图不能走 {@link dropDbTable}：后端那条是 `DROP TABLE`，MySQL 会拒绝成
* `'x' is a view`，界面上表现为「删除表」点在视图节点上必然失败。</p>
*
* @param viewName 视图名
* @param datasourceId 数据源 ID（可选）
* @param database 目标库名（可选）
* @returns 删除结果
*/
var dropDbView = (viewName, datasourceId, database) => http().delete(`/ms/monitor/db/view/${encodeURIComponent(viewName)}`).noToast(true).query({
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 新建数据库（后端按内核选择 DATABASE / SCHEMA 语法）
* @param payload 库名、数据源与可选字符集
* @returns 创建结果
*/
var createDbDatabase = (payload) => http().post("/ms/monitor/db/database").noToast(true).data(payload).then((r) => unwrap(r));
/**
* 删除数据库
* @param name 数据库名
* @param datasourceId 数据源 ID（可选）
* @returns 删除结果
*/
var dropDbDatabase = (name, datasourceId) => http().delete("/ms/monitor/db/database").noToast(true).query({
	name,
	datasourceId
}).then((r) => unwrap(r));
/**
* 查询可用的文档导出格式与模板
*
* <p>按 classpath 上的 DocumentProvider SPI 实际探测：宿主没引 word/pdf 模块时
* 那两项不会出现在清单里，前端据此只渲染装了的选项，而不是给一个点了就报错的按钮。</p>
*
* @returns 能力清单
*/
var dbDocumentFormats = () => http().get("/ms/monitor/db/document/formats").noToast(true).then((r) => unwrap(r));
/** 从 Content-Disposition 里取文件名（优先 RFC 5987 的 filename*，回退 ASCII 的 filename） */
function filenameFromDisposition(disposition, fallback) {
	if (!disposition) return fallback;
	const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
	if (star?.[1]) try {
		return decodeURIComponent(star[1].trim());
	} catch {}
	return /filename="?([^";]+)"?/i.exec(disposition)?.[1]?.trim() || fallback;
}
/**
* 导出数据库设计文档并下载
*
* <p>刻意不走 `http()` 管线：那条管线按 JSON 解析响应，而这里是二进制流
* （word 是 zip、pdf 是二进制），走管线会得到一段乱码字符串。</p>
*
* @param params 数据源、库名、格式、模板与可选的表名白名单
* @returns 文档二进制与后端给出的文件名
* @author CH
* @since 4.0.0.43
*/
async function downloadDbDocument(params) {
	const query = new URLSearchParams();
	query.set("datasourceId", String(params.datasourceId));
	if (params.database) query.set("database", params.database);
	query.set("format", params.format);
	if (params.template) query.set("template", params.template);
	if (params.tables) query.set("tables", params.tables);
	const token = getAccessToken();
	const response = await fetch(`/ms/monitor/db/document/export?${query.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
	if (!response.ok) throw new Error(await response.text() || `导出失败（HTTP ${response.status}）`);
	return {
		blob: await response.blob(),
		filename: filenameFromDisposition(response.headers.get("Content-Disposition"), `database-doc.${params.format === "markdown" ? "md" : params.format}`)
	};
}
/**
* 文档预览：调用与 downloadDbDocument 相同的后端端点，返回文本内容而非文件
*
* @param params 同 downloadDbDocument
* @returns 文档文本，可直接用于 <pre> 或 Markdown 渲染
* @since 4.0.0.44
*/
async function previewDbDocument(params) {
	const query = new URLSearchParams();
	query.set("datasourceId", String(params.datasourceId));
	if (params.database) query.set("database", params.database);
	if (params.format) query.set("format", params.format);
	if (params.template) query.set("template", params.template);
	if (params.tables) query.set("tables", params.tables);
	const token = getAccessToken();
	const response = await fetch(`/ms/monitor/db/document/export?${query.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
	if (!response.ok) throw new Error(await response.text() || `预览失败（HTTP ${response.status}）`);
	return response.text();
}
/**
* 测试 InfluxDB 连接
* @param config 连接配置
*/
var testInfluxdbConnection = (config) => http().post("/ms/monitor/influxdb/test").data(config).then((r) => unwrap(r));
/**
* 获取 InfluxDB Bucket 列表
* @param datasourceId 数据源 ID（可选）
*/
var fetchInfluxdbBuckets = (datasourceId) => http().get("/ms/monitor/influxdb/buckets").query({ datasourceId }).then((r) => unwrap(r));
/**
* 获取 InfluxDB 度量列表
* @param datasourceId 数据源 ID（可选）
* @param bucket Bucket 名（可选）
*/
var fetchInfluxdbMeasurements = (datasourceId, bucket) => http().get("/ms/monitor/influxdb/measurements").query({
	datasourceId,
	bucket
}).then((r) => unwrap(r));
/**
* 执行 InfluxDB 查询
* @param flux 查询语句：v2 为 Flux，v3 为 SQL
* @param datasourceId 数据源 ID（可选）
* @param database v3 目标数据库（可选，空由服务端取第一个数据库；v2 忽略）
*/
var executeInfluxdbQuery = (flux, datasourceId, database) => http().post("/ms/monitor/influxdb/query").data({
	flux,
	datasourceId,
	database
}).then((r) => unwrap(r));
/**
* 测试 Neo4j 连接
* @param config 连接配置
*/
var testNeo4jConnection = (config) => http().post("/ms/monitor/neo4j/test").data(config).then((r) => unwrap(r));
/**
* 获取 Neo4j 标签列表
* @param datasourceId 数据源 ID（可选）
*/
var fetchNeo4jLabels = (datasourceId) => http().get("/ms/monitor/neo4j/labels").query({ datasourceId }).then((r) => unwrap(r));
/**
* 获取 Neo4j 关系类型列表
* @param datasourceId 数据源 ID（可选）
*/
var fetchNeo4jRelationships = (datasourceId) => http().get("/ms/monitor/neo4j/relationships").query({ datasourceId }).then((r) => unwrap(r));
/**
* 执行 Neo4j Cypher 查询
* @param cypher Cypher 查询语句
* @param datasourceId 数据源 ID（可选）
*/
var executeNeo4jQuery = (cypher, datasourceId) => http().post("/ms/monitor/neo4j/query").data({
	cypher,
	datasourceId
}).then((r) => unwrap(r));
/**
* 测试 Nacos 连接
* @param config 连接配置
*/
var testNacosConnection = (config) => http().post("/ms/monitor/nacos/test").data(config).then((r) => unwrap(r));
/**
* 获取 Nacos 命名空间列表
* @param datasourceId 数据源 ID（可选）
*/
var fetchNacosNamespaces = (datasourceId) => http().get("/ms/monitor/nacos/namespaces").query({ datasourceId }).then((r) => unwrap(r));
/**
* 分页获取 Nacos 配置列表
* @param params 查询参数（命名空间/分组/dataId/分页）
*/
var fetchNacosConfigs = (params) => http().get("/ms/monitor/nacos/configs").query(params).then((r) => unwrap(r));
/**
* 获取 Nacos 配置详情
*
* <p>dataId 走**查询参数**：放在路径里时含 `/` 的 dataId 会被 Tomcat 拒绝编码斜杠（400）。</p>
*
* @param dataId 配置 dataId
* @param params 数据源/命名空间/分组
*/
var fetchNacosConfigDetail = (dataId, params) => http().get("/ms/monitor/nacos/config").query({
	...params,
	dataId
}).then((r) => unwrap(r));
/**
* 保存 Nacos 配置
* @param config 配置内容（含目标数据源）
*/
var saveNacosConfig = (config) => http().post("/ms/monitor/nacos/config").data(config).then((r) => unwrap(r));
/**
* 删除 Nacos 配置
*
* <p>dataId 走**查询参数**（同详情接口，避免含 `/` 的 dataId 被拒）。</p>
*
* @param dataId 配置 dataId
* @param params 数据源/命名空间/分组
*/
var deleteNacosConfig = (dataId, params) => http().delete("/ms/monitor/nacos/config").query({
	...params,
	dataId
}).then((r) => unwrap(r));
/**
* 获取 Nacos 服务列表
* @param datasourceId 数据源 ID（可选）
* @param namespace 命名空间（可选）
*/
var fetchNacosServices = (datasourceId, namespace) => http().get("/ms/monitor/nacos/services").query({
	datasourceId,
	namespace
}).then((r) => unwrap(r));
/**
* 获取 Nacos 集群节点列表
* @param datasourceId 数据源 ID（可选）
*/
var fetchNacosClusterNodes = (datasourceId) => http().get("/ms/monitor/nacos/cluster/nodes").query({ datasourceId }).then((r) => unwrap(r));
/**
* 测试 ZooKeeper 连接
* @param config 连接配置
*/
var testZookeeperConnection = (config) => http().post("/ms/monitor/zookeeper/test").data(config).then((r) => unwrap(r));
/**
* 获取 ZooKeeper 节点树
* @param datasourceId 数据源 ID（可选）
* @param path 节点路径
*/
var fetchZkTree = (datasourceId, path = "/") => http().get("/ms/monitor/zookeeper/tree").query({
	datasourceId,
	path
}).then((r) => unwrap(r));
/**
* 获取 ZooKeeper 节点详情
* @param path 节点路径
* @param datasourceId 数据源 ID（可选）
*/
var fetchZkNodeDetail = (path, datasourceId) => http().get("/ms/monitor/zookeeper/node").query({
	path,
	datasourceId
}).then((r) => unwrap(r));
/**
* 获取 ZooKeeper 子节点列表
* @param path 节点路径
* @param datasourceId 数据源 ID（可选）
*/
var fetchZkChildren = (path, datasourceId) => http().get("/ms/monitor/zookeeper/children").query({
	path,
	datasourceId
}).then((r) => unwrap(r));
/**
* 创建 ZooKeeper 节点
* @param request 节点请求
* @param datasourceId 数据源 ID
*/
var createZkNode = (request) => http().post("/ms/monitor/zookeeper/node").data(request).then((r) => unwrap(r));
/**
* 更新 ZooKeeper 节点数据
* @param request 节点请求
* @param datasourceId 数据源 ID
*/
var updateZkNode = (request) => http().put("/ms/monitor/zookeeper/node").data(request).then((r) => unwrap(r));
/**
* 删除 ZooKeeper 节点
* @param path 节点路径
* @param datasourceId 数据源 ID（可选）
*/
var deleteZkNode = (path, datasourceId) => http().delete("/ms/monitor/zookeeper/node").query({
	path,
	datasourceId
}).then((r) => unwrap(r));
//#endregion
export { fetchNacosServices as A, renameDbTable as B, fetchForeignKeys as C, fetchNacosConfigDetail as D, fetchNacosClusterNodes as E, fetchTableDdl as F, testNeo4jConnection as G, saveNacosConfig as H, fetchZkChildren as I, testZookeeperConnection as K, fetchZkNodeDetail as L, fetchNeo4jRelationships as M, fetchTableColumns as N, fetchNacosConfigs as O, fetchTableData as P, fetchZkTree as R, fetchErDiagram as S, fetchInfluxdbMeasurements as T, testInfluxdbConnection as U, requestDbText2Sql as V, testNacosConnection as W, executeInfluxdbQuery as _, createZkNode as a, fetchDbDatabases as b, dbFilterTakesMultipleValues as c, deleteZkNode as d, downloadDbDocument as f, executeDbSql as g, dropDbView as h, createDbTable as i, fetchNeo4jLabels as j, fetchNacosNamespaces as k, dbFilterTakesNoValue as l, dropDbTable as m, compareDbStructure as n, dbDocumentFormats as o, dropDbDatabase as p, updateZkNode as q, createDbDatabase as r, dbFilterNeedsValue2 as s, DB_FILTER_OPS as t, deleteNacosConfig as u, executeNeo4jQuery as v, fetchInfluxdbBuckets as w, fetchDbTables as x, fetchDbAiStatus as y, previewDbDocument as z };
