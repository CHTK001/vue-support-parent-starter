import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { y as testDataSource } from "./src-DW2Ffr17.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import "./surface-Bdspw2jE.js";
import { t as DbSqlEditor_default } from "./DbSqlEditor-Byd806o1.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
//#region ../../pages/datasource/src/api/redisManageApi.ts
var unwrap = (res) => unwrapResult(res);
/**
* SCAN 键列表（游标分页）
* @param params 数据源 / 库 / 模式 / 游标 / 每批数量
*/
var scanRedisKeys = (params) => http().get("/ms/monitor/redis-manage/keys").query(params).then((r) => unwrap(r));
/**
* 读取键详情
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
*/
var fetchRedisKey = (datasourceId, db, key) => http().get("/ms/monitor/redis-manage/key").query({
	datasourceId,
	db,
	key
}).then((r) => unwrap(r));
/**
* 新增键（type 为 STRING/HASH/LIST/SET/ZSET）
* @param params 见 {@link RedisCreateKeyPayload}
* @param db 逻辑库序号
*/
var createRedisKey = (params, db) => http().post("/ms/monitor/redis-manage/key").query({
	datasourceId: params.datasourceId,
	db
}).data(params).then((r) => unwrap(r));
/**
* 覆盖写 STRING 值
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param value 新值
*/
var setRedisString = (datasourceId, db, key, value) => http().put("/ms/monitor/redis-manage/key").query({
	datasourceId,
	db,
	key
}).data({ value }).then((r) => unwrap(r));
/**
* 批量删除键
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param keys 键名列表
*/
var deleteRedisKeys = (datasourceId, db, keys) => http().delete("/ms/monitor/redis-manage/key").query({
	datasourceId,
	db
}).data({ keys }).then((r) => unwrap(r));
/**
* 设置 TTL（-1 永久）
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param ttl 过期秒数
*/
var expireRedisKey = (datasourceId, db, key, ttl) => http().post("/ms/monitor/redis-manage/key/expire").query({
	datasourceId,
	db,
	key,
	ttl
}).then((r) => unwrap(r));
/**
* 读取 INFO 关键字段
* @param datasourceId 数据源 ID
*/
var fetchRedisInfo = (datasourceId) => http().get("/ms/monitor/redis-manage/info").query({ datasourceId }).then((r) => unwrap(r));
/**
* 库列表及键统计
* @param datasourceId 数据源 ID
*/
var fetchRedisDatabases = (datasourceId) => http().get("/ms/monitor/redis-manage/databases").query({ datasourceId }).then((r) => unwrap(r));
/**
* HSET 写入哈希字段
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param field 字段
*/
var hsetRedisField = (datasourceId, db, key, field) => http().post("/ms/monitor/redis-manage/key/hash").query({
	datasourceId,
	db,
	key
}).data(field).then((r) => unwrap(r));
/**
* HDEL 删除哈希字段
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param field 字段名
*/
var hdelRedisField = (datasourceId, db, key, field) => http().delete("/ms/monitor/redis-manage/key/hash").query({
	datasourceId,
	db,
	key,
	field
}).then((r) => unwrap(r));
/**
* RPUSH 追加列表元素
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param value 元素
*/
var rpushRedisElement = (datasourceId, db, key, value) => http().post("/ms/monitor/redis-manage/key/list").query({
	datasourceId,
	db,
	key
}).data({ value }).then((r) => unwrap(r));
/**
* LSET 覆盖列表元素
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param index 下标
* @param value 新值
*/
var lsetRedisElement = (datasourceId, db, key, index, value) => http().put("/ms/monitor/redis-manage/key/list").query({
	datasourceId,
	db,
	key
}).data({
	index,
	value
}).then((r) => unwrap(r));
/**
* 按下标删除列表元素
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param index 下标
*/
var lremRedisIndex = (datasourceId, db, key, index) => http().delete("/ms/monitor/redis-manage/key/list").query({
	datasourceId,
	db,
	key,
	index
}).then((r) => unwrap(r));
/**
* SADD 添加集合成员
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param value 成员
*/
var saddRedisMember = (datasourceId, db, key, value) => http().post("/ms/monitor/redis-manage/key/set").query({
	datasourceId,
	db,
	key
}).data({ value }).then((r) => unwrap(r));
/**
* SREM 删除集合成员
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param member 成员
*/
var sremRedisMember = (datasourceId, db, key, member) => http().delete("/ms/monitor/redis-manage/key/set").query({
	datasourceId,
	db,
	key,
	member
}).then((r) => unwrap(r));
/**
* ZADD 写入有序集合成员
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param member 成员
* @param score 分值
*/
var zaddRedisMember = (datasourceId, db, key, member, score) => http().post("/ms/monitor/redis-manage/key/zset").query({
	datasourceId,
	db,
	key
}).data({
	member,
	score
}).then((r) => unwrap(r));
/**
* ZREM 删除有序集合成员
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param member 成员
*/
var zremRedisMember = (datasourceId, db, key, member) => http().delete("/ms/monitor/redis-manage/key/zset").query({
	datasourceId,
	db,
	key,
	member
}).then((r) => unwrap(r));
/**
* XADD 追加流消息
* @param datasourceId 数据源 ID
* @param db 逻辑库序号
* @param key 键名
* @param fields 消息字段
*/
var xaddRedisStream = (datasourceId, db, key, fields) => http().post("/ms/monitor/redis-manage/key/stream").query({
	datasourceId,
	db,
	key
}).data({
	id: "",
	fields
}).then((r) => unwrap(r));
/**
* 执行任意 Redis 命令（命令控制台通用通道）
* @param params 数据源 / 库 / 命令整行（支持引号包裹含空格的参数）
*/
var executeRedisCommand = (params) => http().post("/ms/monitor/redis-manage/command").data(params).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/views/console/RedisManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm-toolbar re-surface" };
var _hoisted_2 = { class: "dsm-toolbar-left" };
var _hoisted_3 = { class: "dsm-toolbar-right" };
var _hoisted_4 = {
	class: "dsm-db-select",
	"data-testid": "dsm-db-select"
};
var _hoisted_5 = { class: "dsm-body" };
var _hoisted_6 = { class: "dsm-search-section" };
var _hoisted_7 = { class: "dsm-view-bar" };
var _hoisted_8 = { class: "dsm-view-count" };
var _hoisted_9 = { class: "dsm-key-list" };
var _hoisted_10 = ["onClick"];
var _hoisted_11 = ["title"];
var _hoisted_12 = ["onClick"];
var _hoisted_13 = ["title"];
var _hoisted_14 = {
	key: 2,
	class: "dsm-tree-node"
};
var _hoisted_15 = { class: "dsm-tree-label" };
var _hoisted_16 = {
	key: 3,
	class: "dsm-load-more"
};
var _hoisted_17 = { class: "dsm-content" };
var _hoisted_18 = { class: "dsm-content-bar" };
var _hoisted_19 = {
	class: "dsm-seg",
	"data-testid": "dsm-console-views",
	role: "group",
	"aria-label": "工作区"
};
var _hoisted_20 = {
	key: 0,
	class: "dsm-command-panel",
	"data-testid": "dsm-command-panel"
};
var _hoisted_21 = { class: "dsm-command-actions" };
var _hoisted_22 = {
	key: 0,
	class: "dsm-command-error",
	"data-testid": "dsm-command-error"
};
var _hoisted_23 = {
	key: 1,
	class: "dsm-command-result",
	"data-testid": "dsm-command-result"
};
var _hoisted_24 = { class: "dsm-data-title" };
var _hoisted_25 = { class: "dsm-section-actions" };
var _hoisted_26 = {
	key: 0,
	class: "dsm-reply-pre"
};
var _hoisted_27 = {
	key: 1,
	class: "dsm-reply-pre",
	"data-testid": "dsm-reply-json"
};
var _hoisted_28 = {
	key: 2,
	class: "dsm-reply-nil",
	"data-testid": "dsm-reply-nil"
};
var _hoisted_29 = {
	key: 3,
	class: "dsm-table-wrap"
};
var _hoisted_30 = { class: "dsm-info-card re-surface" };
var _hoisted_31 = { class: "dsm-info-row" };
var _hoisted_32 = { class: "dsm-info-value" };
var _hoisted_33 = { class: "dsm-info-row" };
var _hoisted_34 = { class: "dsm-info-value mono" };
var _hoisted_35 = { class: "dsm-info-row" };
var _hoisted_36 = { class: "dsm-info-value mono" };
var _hoisted_37 = { class: "dsm-info-row" };
var _hoisted_38 = { class: "dsm-info-value mono" };
var _hoisted_39 = { class: "dsm-info-row" };
var _hoisted_40 = { class: "dsm-info-row" };
var _hoisted_41 = { class: "dsm-info-value mono" };
var _hoisted_42 = {
	key: 0,
	class: "dsm-section dsm-value-empty",
	"data-testid": "dsm-value-empty"
};
var _hoisted_43 = {
	key: 1,
	class: "dsm-section"
};
var _hoisted_44 = { class: "dsm-section-title" };
var _hoisted_45 = { class: "dsm-section-actions" };
var _hoisted_46 = { class: "dsm-node-detail" };
var _hoisted_47 = { class: "dsm-detail-row" };
var _hoisted_48 = { class: "dsm-detail-value mono" };
var _hoisted_49 = { class: "dsm-detail-row" };
var _hoisted_50 = { class: "dsm-detail-row" };
var _hoisted_51 = {
	class: "dsm-detail-value mono",
	"data-testid": "dsm-detail-ttl"
};
var _hoisted_52 = { class: "dsm-detail-row" };
var _hoisted_53 = { class: "dsm-detail-label" };
var _hoisted_54 = { class: "dsm-detail-value mono" };
var _hoisted_55 = {
	key: 0,
	class: "dsm-data-section"
};
var _hoisted_56 = { class: "dsm-data-title" };
var _hoisted_57 = { class: "dsm-section-actions" };
var _hoisted_58 = {
	class: "dsm-seg",
	"data-testid": "dsm-string-views"
};
var _hoisted_59 = {
	key: 1,
	class: "dsm-data-content dsm-value-view dsm-fill",
	"data-testid": "dsm-value-hex"
};
var _hoisted_60 = {
	key: 2,
	class: "dsm-json-editor dsm-fill",
	"data-testid": "dsm-value-json"
};
var _hoisted_61 = ["innerHTML"];
var _hoisted_62 = {
	key: 1,
	class: "dsm-data-section"
};
var _hoisted_63 = { class: "dsm-data-title" };
var _hoisted_64 = { class: "dsm-add-row" };
var _hoisted_65 = { class: "dsm-table-wrap" };
var _hoisted_66 = { class: "dsm-cell-actions" };
var _hoisted_67 = {
	key: 2,
	class: "dsm-data-section"
};
var _hoisted_68 = { class: "dsm-data-title" };
var _hoisted_69 = { class: "dsm-add-row" };
var _hoisted_70 = { class: "dsm-table-wrap" };
var _hoisted_71 = { class: "dsm-cell-actions" };
var _hoisted_72 = {
	key: 3,
	class: "dsm-data-section"
};
var _hoisted_73 = { class: "dsm-data-title" };
var _hoisted_74 = { class: "dsm-add-row" };
var _hoisted_75 = { class: "dsm-table-wrap" };
var _hoisted_76 = { class: "mono" };
var _hoisted_77 = { class: "dsm-cell-actions" };
var _hoisted_78 = {
	key: 4,
	class: "dsm-data-section"
};
var _hoisted_79 = { class: "dsm-data-title" };
var _hoisted_80 = { class: "dsm-add-row" };
var _hoisted_81 = { class: "dsm-table-wrap" };
var _hoisted_82 = { class: "mono" };
var _hoisted_83 = { class: "dsm-cell-actions" };
var _hoisted_84 = {
	key: 5,
	class: "dsm-data-section"
};
var _hoisted_85 = { class: "dsm-data-title" };
var _hoisted_86 = { class: "dsm-add-row" };
var _hoisted_87 = { class: "dsm-table-wrap" };
var _hoisted_88 = { class: "mono" };
var _hoisted_89 = { class: "mono" };
var _hoisted_90 = {
	key: 6,
	class: "dsm-data-section"
};
var _hoisted_91 = { class: "dsm-data-content dsm-fill" };
var _hoisted_92 = {
	key: 1,
	class: "dsm-empty-inline"
};
var _hoisted_93 = { class: "dsm-node-form" };
var _hoisted_94 = { class: "dsm-form-item" };
var _hoisted_95 = { class: "dsm-form-item" };
var _hoisted_96 = { class: "dsm-form-item" };
var _hoisted_97 = { class: "dsm-form-item" };
var _hoisted_98 = ["placeholder"];
var _hoisted_99 = { class: "dsm-form-hint" };
var _hoisted_100 = { class: "dsm-node-form" };
var _hoisted_101 = { class: "dsm-form-item" };
var LEFT_WIDTH_KEY = "redis-left-width";
//#endregion
//#region ../../pages/datasource/src/views/console/RedisManageView.vue
var RedisManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "RedisManageView",
	__name: "RedisManageView",
	setup(__props) {
		/**
		* Redis 数据源管理页（datasourceId 版控制台）。
		*
		* <p>只读取与操作「数据源管理」里登记的 Redis 数据源（type=redis），
		* 后端走 {@code /ms/monitor/redis-manage}，每次请求临时建连。与应用自身
		* Redis（{@code /ms/monitor/system/redis}）无关，也不依赖任何演示数据。</p>
		*
		* <p>旧的 {@code /redis} 监控页已退役，本页路由为 {@code /redis-manage}。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		/** 新建键类型下拉选项（ReSelect 统一控件） */
		const KEY_TYPE_OPTIONS = [
			"STRING",
			"HASH",
			"LIST",
			"SET",
			"ZSET"
		].map((t) => ({
			label: t,
			value: t
		}));
		/** LIST 表行 */
		const loading = ref(false);
		const testing = ref(false);
		const saving = ref(false);
		const activeDb = ref(0);
		const activeKey = ref("");
		const pattern = ref("*");
		const keys = ref([]);
		/** SCAN 游标，"0" 表示扫完 */
		const nextCursor = ref("0");
		/** 键列表视图：平铺 / 树形（沿用旧 /redis 页的 localStorage 键） */
		/** 视图模式：每次进入控制台默认平铺（不恢复上次树形，2026-10-07 需求） */
		const viewMode = ref("flat");
		/** 侧栏宽度持久化键（沿用旧 /redis 页） */
		const leftWidth = ref(Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340);
		/** 是否正在拖拽（拖拽中禁用文本选择） */
		const resizing = ref(false);
		/**
		* 开始拖拽调节左侧宽度。
		*
		* @param e 鼠标按下事件
		*/
		function startResize(e) {
			resizing.value = true;
			const startX = e.clientX;
			const startWidth = leftWidth.value;
			const onMove = (ev) => {
				leftWidth.value = Math.min(560, Math.max(260, startWidth + ev.clientX - startX));
			};
			const onUp = () => {
				resizing.value = false;
				localStorage.setItem(LEFT_WIDTH_KEY, String(leftWidth.value));
				window.removeEventListener("mousemove", onMove);
				window.removeEventListener("mouseup", onUp);
			};
			window.addEventListener("mousemove", onMove);
			window.addEventListener("mouseup", onUp);
		}
		const databases = ref([]);
		/** 逻辑库下拉选项（label 带键数；ReSelect 统一控件） */
		const dbOptions = computed(() => databases.value.map((d) => ({
			label: `db${d.db}（${d.keys} 键）`,
			value: d.db
		})));
		const info = ref({});
		const infoVisible = ref(false);
		const infoLoading = ref(false);
		const detail = ref(null);
		/** STRING 编辑缓冲 */
		const stringValue = ref("");
		/** STRING 值视图：字符串（可编辑）/ HEX（字节只读）/ JSON（可编辑，高亮叠加） */
		const stringView = ref("text");
		/** JSON 视图编辑缓冲：进入 JSON 视图时初始化为美化文本，保存时写回 stringValue */
		const jsonEdit = ref("");
		/** TTL 逐秒倒计时（null = 非倒计时态：永久/不存在/未加载）；配合 ttlTimer 使用 */
		const ttlCountdown = ref(null);
		/** TTL 倒计时定时器句柄；切键/卸载/改 TTL 时必须清理，防止泄漏 */
		let ttlTimer = null;
		/** HASH 添加行 */
		const newHashField = ref("");
		const newHashValue = ref("");
		/** LIST 追加行 */
		const newListValue = ref("");
		/** SET 添加行 */
		const newSetMember = ref("");
		/** ZSET 添加行 */
		const newZsetMember = ref("");
		const newZsetScore = ref("");
		/** STREAM 追加行 */
		const newStreamField = ref("");
		const newStreamValue = ref("");
		const createVisible = ref(false);
		const ttlVisible = ref(false);
		const ttlValue = ref("");
		const createForm = reactive({
			key: "",
			type: "STRING",
			ttl: "",
			value: ""
		});
		const hashColumns = [
			{
				prop: "field",
				label: "字段",
				minWidth: 200
			},
			{
				prop: "value",
				label: "值",
				minWidth: 300
			},
			{
				prop: "actions",
				label: "操作",
				width: 100,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const listColumns = [
			{
				prop: "index",
				label: "下标",
				width: 80
			},
			{
				prop: "value",
				label: "值",
				minWidth: 360
			},
			{
				prop: "actions",
				label: "操作",
				width: 100,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const memberColumns = [{
			prop: "member",
			label: "成员",
			minWidth: 320,
			slot: "col-member"
		}, {
			prop: "actions",
			label: "操作",
			width: 100,
			fixed: "right",
			slot: "col-actions"
		}];
		const zsetColumns = [
			{
				prop: "member",
				label: "成员",
				minWidth: 260
			},
			{
				prop: "score",
				label: "分值",
				width: 120,
				slot: "col-score"
			},
			{
				prop: "actions",
				label: "操作",
				width: 100,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const streamColumns = [{
			prop: "id",
			label: "消息 ID",
			width: 200,
			slot: "col-id"
		}, {
			prop: "fields",
			label: "字段",
			minWidth: 360,
			slot: "col-fields"
		}];
		const infoColumns = [{
			prop: "field",
			label: "字段",
			width: 240
		}, {
			prop: "value",
			label: "值",
			minWidth: 360
		}];
		/** 工作区视图：键详情 / 命令控制台 */
		const consoleMode = ref("detail");
		/** 命令编辑器文本 */
		const commandText = ref("");
		/** 命令执行中 */
		const commandRunning = ref(false);
		/** 最近一次命令执行结果 */
		const commandResult = ref(null);
		/** 最近一次命令错误（服务端拒绝/网络错误） */
		const commandError = ref("");
		/** 命令结果表格列 */
		const READ_ONLY_COMMAND_HEADS = /* @__PURE__ */ new Set([
			"PING",
			"ECHO",
			"GET",
			"MGET",
			"STRLEN",
			"EXISTS",
			"TYPE",
			"TTL",
			"PTTL",
			"KEYS",
			"SCAN",
			"DBSIZE",
			"INFO",
			"TIME",
			"LASTSAVE",
			"COMMAND",
			"CONFIG",
			"CLIENT",
			"MEMORY",
			"OBJECT",
			"DUMP",
			"RANDOMKEY",
			"HGET",
			"HMGET",
			"HGETALL",
			"HKEYS",
			"HVALS",
			"HLEN",
			"HEXISTS",
			"HSTRLEN",
			"LRANGE",
			"LINDEX",
			"LLEN",
			"SMEMBERS",
			"SISMEMBER",
			"SMISMEMBER",
			"SCARD",
			"SRANDMEMBER",
			"SUNION",
			"SINTER",
			"SDIFF",
			"ZRANGE",
			"ZREVRANGE",
			"ZRANGEBYSCORE",
			"ZSCORE",
			"ZMSCORE",
			"ZCARD",
			"ZCOUNT",
			"ZRANK",
			"ZREVRANK",
			"ZRANDMEMBER",
			"ZUNION",
			"ZINTER",
			"ZDIFF",
			"XRANGE",
			"XREVRANGE",
			"XLEN",
			"XPENDING",
			"XINFO",
			"GEODIST",
			"GEOPOS",
			"GEOHASH",
			"GEORADIUS",
			"GEORADIUSBYMEMBER",
			"GEOSEARCH",
			"JSON.GET",
			"JSON.TYPE",
			"JSON.OBJKEYS",
			"JSON.OBJLEN",
			"JSON.STRLEN",
			"JSON.ARRLEN",
			"JSON.ARRINDEX",
			"JSON.RESP",
			"TS.GET",
			"TS.RANGE",
			"TS.REVRANGE",
			"TS.INFO",
			"TS.MGET",
			"TS.MRANGE",
			"TS.QUERYINDEX",
			"FT.SEARCH",
			"FT.AGGREGATE",
			"FT.INFO",
			"FT.SUGGET",
			"FT.SYNDUMP",
			"VEMB",
			"VCARD",
			"VDIM",
			"VGETATTR",
			"VINFO",
			"VISMEMBER",
			"VLINKS",
			"VRANDMEMBER",
			"VSIM"
		]);
		/** 命令头（首词大写） */
		function commandHead(command) {
			const m = command.trim().match(/^([A-Za-z.]+)/);
			return m ? m[1].toUpperCase() : "";
		}
		/** 单元格标量化：对象/数组转 JSON 文本，其余原样 */
		function cellScalar(value) {
			if (value === null || value === void 0) return "";
			if (typeof value === "object") try {
				return JSON.stringify(value);
			} catch {
				return String(value);
			}
			return value;
		}
		/**
		* 命令回复 → 渲染形态。
		*
		* <p>HGETALL 平铺数组配对为 字段/值 行；TS.RANGE/TS.REVRANGE 数组对配对为
		* 时间戳/值 行；JSON.GET 尝试解析后美化；对象数组按并集列渲染、数组数组按
		* 通用列渲染、标量数组单列渲染、Map 转键值对、标量直出。</p>
		*/
		const resultView = computed(() => {
			const empty = {
				kind: "nil",
				columns: [],
				rows: []
			};
			const result = commandResult.value;
			const reply = result?.reply;
			if (reply === null || reply === void 0) return empty;
			const head = result ? commandHead(result.command) : "";
			if (head === "HGETALL" && Array.isArray(reply) && reply.length % 2 === 0 && reply.every((x) => typeof x === "string")) {
				const rows = [];
				for (let i = 0; i < reply.length; i += 2) rows.push({
					field: reply[i],
					value: reply[i + 1]
				});
				return {
					kind: "rows",
					columns: [{
						prop: "field",
						label: "字段",
						minWidth: 240
					}, {
						prop: "value",
						label: "值",
						minWidth: 360
					}],
					rows
				};
			}
			if ((head === "TS.RANGE" || head === "TS.REVRANGE") && Array.isArray(reply) && reply.every((x) => Array.isArray(x) && x.length >= 2)) return {
				kind: "rows",
				columns: [{
					prop: "timestamp",
					label: "时间戳",
					width: 220
				}, {
					prop: "value",
					label: "值",
					minWidth: 360
				}],
				rows: reply.map((pair) => ({
					timestamp: cellScalar(pair[0]),
					value: cellScalar(pair[1])
				}))
			};
			if (head === "JSON.GET" && typeof reply === "string") try {
				return {
					kind: "json",
					text: JSON.stringify(JSON.parse(reply), null, 2),
					columns: [],
					rows: []
				};
			} catch {
				return {
					kind: "scalar",
					text: reply,
					columns: [],
					rows: []
				};
			}
			if (Array.isArray(reply)) {
				if (reply.length > 0 && reply.every((x) => x !== null && typeof x === "object" && !Array.isArray(x))) {
					const props = [];
					for (const item of reply) for (const key of Object.keys(item)) if (!props.includes(key)) props.push(key);
					return {
						kind: "rows",
						columns: props.map((p) => ({
							prop: p,
							label: p,
							minWidth: 180
						})),
						rows: reply.map((item) => {
							const row = {};
							for (const p of props) row[p] = cellScalar(item[p]);
							return row;
						})
					};
				}
				if (reply.length > 0 && reply.every((x) => Array.isArray(x))) {
					const width = Math.max(...reply.map((r) => r.length));
					return {
						kind: "rows",
						columns: Array.from({ length: width }, (_, i) => ({
							prop: `c${i}`,
							label: `列${i + 1}`,
							minWidth: 180
						})),
						rows: reply.map((arr) => {
							const row = {};
							for (let i = 0; i < width; i++) row[`c${i}`] = cellScalar(arr[i]);
							return row;
						})
					};
				}
				return {
					kind: "rows",
					columns: [{
						prop: "value",
						label: "值",
						minWidth: 360
					}],
					rows: reply.map((x) => ({ value: cellScalar(x) }))
				};
			}
			if (typeof reply === "object") return {
				kind: "rows",
				columns: [{
					prop: "field",
					label: "字段",
					minWidth: 240
				}, {
					prop: "value",
					label: "值",
					minWidth: 360
				}],
				rows: Object.entries(reply).map(([field, value]) => ({
					field,
					value: cellScalar(value)
				}))
			};
			return {
				kind: "scalar",
				text: String(reply),
				columns: [],
				rows: []
			};
		});
		/** 执行命令控制台命令 */
		async function runCommand() {
			const command = commandText.value.trim();
			if (!command) {
				message.warning("请输入命令");
				return;
			}
			commandRunning.value = true;
			commandError.value = "";
			commandResult.value = null;
			try {
				commandResult.value = await executeRedisCommand({
					datasourceId: datasourceId.value,
					db: activeDb.value,
					command
				});
				if (source.value && !READ_ONLY_COMMAND_HEADS.has(commandHead(command))) await refresh();
			} catch (e) {
				commandResult.value = null;
				commandError.value = e instanceof Error ? e.message : String(e);
			} finally {
				commandRunning.value = false;
			}
		}
		/** 清空命令编辑器与结果 */
		function clearCommand() {
			commandText.value = "";
			commandResult.value = null;
			commandError.value = "";
		}
		/** 复制结果（表格 → TSV，其余 → 原文本） */
		async function copyResult() {
			const view = resultView.value;
			let text = "";
			if (view.kind === "rows") text = `${view.columns.map((c) => c.label).join("	")}\n${view.rows.map((row) => view.columns.map((c) => String(row[c.prop] ?? "")).join("	")).join("\n")}`;
			else if (view.text !== void 0) text = view.text;
			if (await copyToClipboard(text)) message.success("结果已复制");
			else message.warning("复制失败");
		}
		/** 详情 value → HASH 字段数组（detail.value 是信封 {key,type,ttl,value,size}，字段在嵌套 value 里） */
		const hashFields = computed(() => {
			const v = detail.value;
			if (!v || v.type !== "HASH") return [];
			const payload = v.value;
			if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
			return Object.entries(payload).map(([field, value]) => ({
				field,
				value: String(value ?? "")
			}));
		});
		/** 详情 value → LIST 元素行（带下标） */
		const listRows = computed(() => {
			const v = detail.value;
			if (!v || v.type !== "LIST" || !Array.isArray(v.value)) return [];
			return v.value.map((x, index) => ({
				index,
				value: String(x ?? "")
			}));
		});
		/** 详情 value → SET 成员行 */
		const setRows = computed(() => {
			const v = detail.value;
			if (!v || v.type !== "SET" || !Array.isArray(v.value)) return [];
			return v.value.map((x) => ({ member: String(x ?? "") }));
		});
		/** 详情 value → ZSET 成员行 */
		const zsetRows = computed(() => {
			const v = detail.value;
			if (!v || v.type !== "ZSET" || !Array.isArray(v.value)) return [];
			return v.value.map((m) => ({
				member: String(m?.member ?? ""),
				score: Number(m?.score ?? 0)
			}));
		});
		/** 详情 value → STREAM 消息 */
		const streamEntries = computed(() => {
			const v = detail.value;
			if (!v || v.type !== "STREAM" || !Array.isArray(v.value)) return [];
			return v.value;
		});
		/** INFO 弹窗行数据 */
		const infoRows = computed(() => Object.entries(info.value).map(([field, value]) => ({
			field,
			value
		})));
		/** 树形视图行 */
		const collapsedDirs = ref([]);
		/** 折叠 / 展开目录 */
		function toggleTreeDir(path) {
			const idx = collapsedDirs.value.indexOf(path);
			if (idx >= 0) collapsedDirs.value.splice(idx, 1);
			else collapsedDirs.value.push(path);
		}
		/** 树形行点击：目录=折叠/展开，叶子=选中键 */
		function onTreeRowClick(row) {
			if (row.kind === "dir") toggleTreeDir(row.path);
			else selectKey(row.path);
		}
		/**
		* 树形视图行：按 `:` 分层的 DFS 展开。
		*
		* <p>2026-10-07 修复：旧实现先平铺全部目录再平铺全部叶子，导致所有叶子都挂到
		* 最后一个目录节点下面。现在构建 trie 后按 DFS 输出：进入目录行 → 递归输出该目录
		* 的直接子目录与直接子叶（同层按名字混排，同名时叶子在前，避免 leaf/dir 同 path
		* 的 v-for key 冲突），折叠的目录直接不再下钻。</p>
		*/
		const treeRows = computed(() => {
			const newNode = () => ({
				dirs: /* @__PURE__ */ new Map(),
				leaves: []
			});
			const root = newNode();
			for (const item of keys.value) {
				const segs = item.key.split(":");
				let node = root;
				for (let i = 0; i < segs.length - 1; i++) {
					const seg = segs[i];
					let child = node.dirs.get(seg);
					if (!child) {
						child = newNode();
						node.dirs.set(seg, child);
					}
					node = child;
				}
				node.leaves.push(item);
			}
			const rows = [];
			const visit = (node, parentPath, depth) => {
				const entries = [];
				for (const [name, child] of node.dirs) entries.push({
					isDir: true,
					name,
					path: parentPath ? `${parentPath}:${name}` : name,
					child
				});
				for (const item of node.leaves) {
					const name = item.key.split(":").pop() || item.key;
					entries.push({
						isDir: false,
						name,
						path: item.key,
						item
					});
				}
				entries.sort((a, b) => a.name.localeCompare(b.name) || (a.isDir === b.isDir ? 0 : a.isDir ? 1 : -1));
				for (const entry of entries) if (entry.isDir && entry.child) {
					const collapsed = collapsedDirs.value.includes(entry.path);
					rows.push({
						kind: "dir",
						path: entry.path,
						name: entry.name,
						depth,
						expanded: !collapsed
					});
					if (!collapsed) visit(entry.child, entry.path, depth + 1);
				} else if (entry.item) rows.push({
					kind: "leaf",
					path: entry.path,
					name: entry.name,
					depth,
					expanded: true,
					item: entry.item
				});
			};
			visit(root, "", 0);
			return rows;
		});
		/** 新建弹窗：按类型给不同标签/占位/提示 */
		const createValueLabel = computed(() => {
			switch (createForm.type) {
				case "HASH": return "初始字段（每行 field=value）";
				case "LIST": return "初始元素（每行一个）";
				case "SET": return "初始成员（每行一个）";
				case "ZSET": return "初始成员（每行 member=score）";
				default: return "值";
			}
		});
		const createValuePlaceholder = computed(() => {
			switch (createForm.type) {
				case "HASH": return "name=张三\nrole=admin";
				case "LIST": return "第一行\n第二行";
				case "SET": return "member-a\nmember-b";
				case "ZSET": return "alice=100\nbob=95.5";
				default: return "UTF-8 文本";
			}
		});
		const createValueHint = computed(() => {
			switch (createForm.type) {
				case "HASH":
				case "LIST":
				case "SET":
				case "ZSET": return "非 STRING 类型至少要有一行初始数据（Redis 无法创建空的集合键）";
				default: return "留空则创建空字符串键";
			}
		});
		/**
		* 类型 → 标签颜色。
		*
		* @param type 键类型
		* @returns ReTag 类型
		*/
		function typeTagType(type) {
			switch ((type || "").toUpperCase()) {
				case "STRING": return "success";
				case "HASH": return "warning";
				case "LIST": return "primary";
				case "SET": return "info";
				case "ZSET": return "danger";
				default: return "info";
			}
		}
		/**
		* TTL 展示。
		*
		* @param ttl 后端返回的 TTL（-1 永久 / -2 键不存在）
		* @returns 展示文本
		*/
		function formatTtl(ttl) {
			if (ttl === -1) return "永久";
			if (ttl === -2) return "键不存在";
			return `${ttl} 秒`;
		}
		/**
		* 非结构化值的兜底展示。
		*
		* @param value 任意值
		* @returns 文本
		*/
		function formatPlainValue(value) {
			if (value == null) return "";
			if (typeof value === "string") return value;
			try {
				return JSON.stringify(value, null, 2);
			} catch {
				return String(value);
			}
		}
		/** JSON 视图文本：合法 JSON 美化展示，否则原样输出 */
		const jsonViewText = computed(() => {
			const raw = stringValue.value;
			if (!raw) return "";
			try {
				return JSON.stringify(JSON.parse(raw), null, 2);
			} catch {
				return raw;
			}
		});
		/**
		* JSON 视图高亮 HTML：先整体转义（&lt;&gt;&amp;）防注入，再对 token 包 span。
		* 数据源是 jsonEdit（编辑缓冲），与透明编辑层 textarea 同源 → 高亮随输入实时更新；
		* 非法 JSON（parse 失败）只转义不高亮，保持原样展示。
		* token 顺序：键（字符串+冒号）→ 字符串 → 数字 → true/false/null → 结构符号。
		*/
		const jsonHtml = computed(() => {
			const text = jsonEdit.value;
			const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
			try {
				JSON.parse(text);
			} catch {
				return esc;
			}
			return esc.replace(/("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g, (_m, keyStr, colon, str, num, lit, punct) => {
				if (keyStr !== void 0) return `<span class="dsm-json-key">${keyStr}</span>${colon}`;
				if (str !== void 0) return `<span class="dsm-json-str">${str}</span>`;
				if (num !== void 0) return `<span class="dsm-json-num">${num}</span>`;
				if (lit !== void 0) return `<span class="dsm-json-lit">${lit}</span>`;
				return `<span class="dsm-json-punct">${punct}</span>`;
			});
		});
		/** HEX 视图文本：UTF-8 字节 16 字节/行，`偏移 hex |ascii|` */
		const hexViewText = computed(() => {
			const raw = stringValue.value;
			if (!raw) return "";
			const bytes = Array.from(new TextEncoder().encode(raw));
			const lines = [];
			for (let i = 0; i < bytes.length; i += 16) {
				const chunk = bytes.slice(i, i + 16);
				const hex = chunk.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
				const ascii = chunk.map((b) => b >= 32 && b < 127 ? String.fromCharCode(b) : ".").join("");
				lines.push(`${i.toString(16).padStart(8, "0")}  ${hex}  |${ascii}|`);
			}
			return lines.join("\n");
		});
		/**
		* 扫描当前库的键（reset=true 从游标 0 开始）。
		*
		* @param reset 是否重置游标与已加载列表
		*/
		async function scanKeys(reset) {
			if (!datasourceId.value) return;
			if (reset) {
				nextCursor.value = "0";
				keys.value = [];
			}
			loading.value = true;
			try {
				const res = await scanRedisKeys({
					datasourceId: datasourceId.value,
					db: activeDb.value,
					pattern: pattern.value.trim() || "*",
					cursor: nextCursor.value,
					count: 200
				});
				const list = res?.keys || [];
				const seen = new Set(keys.value.map((k) => k.key));
				keys.value = keys.value.concat(list.filter((k) => !seen.has(k.key)));
				nextCursor.value = String(res?.nextCursor ?? "0");
				ready();
			} catch (e) {
				if (reset) keys.value = [];
				fail(e, "/ms/monitor/redis-manage/keys");
			} finally {
				loading.value = false;
			}
		}
		/** 搜索框回车/点查询：重置并扫描 */
		async function reloadKeys() {
			await scanKeys(true);
		}
		/** 加载更多（游标续扫） */
		async function loadMore() {
			await scanKeys(false);
		}
		/**
		* 读取键详情。
		*
		* @param key 键名
		*/
		async function selectKey(key) {
			activeKey.value = key;
			detail.value = null;
			stopTtlCountdown();
			try {
				detail.value = await fetchRedisKey(datasourceId.value, activeDb.value, key);
				stringValue.value = detail.value?.type === "STRING" ? String(detail.value.value ?? "") : "";
				jsonEdit.value = "";
				stringView.value = "text";
				startTtlCountdown(detail.value?.ttl ?? -1);
				ready();
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key");
			}
		}
		/** 逻辑库 ReSelect change → 切库（v-model 已落 activeDb，这里只做切库副作用） */
		function onDbChange(value) {
			if (value === "" || value == null) return;
			switchDb(Number(value));
		}
		/** 切换逻辑库（v-model 已更新 activeDb，此处重置选中与详情并重扫） */
		async function switchDb(db) {
			activeDb.value = db;
			activeKey.value = "";
			detail.value = null;
			stopTtlCountdown();
			await scanKeys(true);
		}
		/** 加载库列表与 INFO（不整页 loading，避免遮挡） */
		async function loadSideData() {
			if (!datasourceId.value) return;
			try {
				databases.value = await fetchRedisDatabases(datasourceId.value) || [];
			} catch (e) {
				databases.value = [];
				fail(e, "/ms/monitor/redis-manage/databases");
			}
			try {
				info.value = await fetchRedisInfo(datasourceId.value) || {};
			} catch (e) {
				info.value = {};
				fail(e, "/ms/monitor/redis-manage/info");
			}
		}
		/** 测试连接（走数据源中心统一探测） */
		async function testConnection() {
			if (!datasourceId.value) return;
			testing.value = true;
			try {
				const result = await testDataSource(datasourceId.value);
				if (result?.success) {
					message.success(`连接成功${result.version ? `（redis ${result.version}）` : ""}`);
					ready();
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				fail(e, "/ms/datasource/{id}/test");
			} finally {
				testing.value = false;
			}
		}
		/** 全量刷新 */
		async function refresh() {
			await bind("redis");
			if (!source.value) return;
			await loadSideData();
			await scanKeys(true);
		}
		/** 打开服务器信息弹窗 */
		async function openInfo() {
			infoVisible.value = true;
			await reloadInfo();
		}
		/** 弹窗内刷新 INFO */
		async function reloadInfo() {
			if (!datasourceId.value) return;
			infoLoading.value = true;
			try {
				info.value = await fetchRedisInfo(datasourceId.value) || {};
				ready();
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/info");
			} finally {
				infoLoading.value = false;
			}
		}
		/** 打开新建键弹窗 */
		function openCreate() {
			Object.assign(createForm, {
				key: "",
				type: "STRING",
				ttl: "",
				value: ""
			});
			createVisible.value = true;
		}
		/** 提交新建键 */
		async function submitCreate() {
			const key = createForm.key.trim();
			if (!key) {
				message.warning("键名不能为空");
				return;
			}
			const type = createForm.type;
			const raw = createForm.value;
			const payload = {};
			if (type === "STRING") payload.value = raw;
			else {
				const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
				if (lines.length === 0) {
					message.warning(`${type} 类型至少需要一行初始数据`);
					return;
				}
				if (type === "HASH") {
					const fields = lines.map((l) => {
						const idx = l.indexOf("=");
						return {
							field: idx >= 0 ? l.slice(0, idx) : l,
							value: idx >= 0 ? l.slice(idx + 1) : ""
						};
					}).filter((f) => f.field.trim() !== "");
					if (fields.length === 0) {
						message.warning("至少一行 field=value");
						return;
					}
					payload.hashFields = fields;
				} else if (type === "LIST") {
					const items = raw.split("\n").map((l) => l.replace(/\r$/, ""));
					while (items.length > 0 && items[items.length - 1].trim() === "") items.pop();
					payload.listItems = items;
				} else if (type === "SET") payload.setItems = lines;
				else if (type === "ZSET") {
					const members = lines.map((l) => {
						const idx = l.lastIndexOf("=");
						const member = idx >= 0 ? l.slice(0, idx) : l;
						const score = idx >= 0 ? Number(l.slice(idx + 1)) : NaN;
						return {
							member,
							score: Number.isFinite(score) ? score : 0
						};
					}).filter((m) => m.member.trim() !== "");
					if (members.length === 0) {
						message.warning("至少一行 member=score");
						return;
					}
					payload.zsetMembers = members;
				}
			}
			const ttl = Number(String(createForm.ttl).trim() || "0");
			saving.value = true;
			try {
				await createRedisKey({
					datasourceId: datasourceId.value,
					key,
					type,
					ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : -1,
					...payload
				}, activeDb.value);
				message.success("键已创建");
				createVisible.value = false;
				await loadSideData();
				await scanKeys(true);
				await selectKey(key);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key");
			} finally {
				saving.value = false;
			}
		}
		/** 保存 STRING 值（字符串视图写 stringValue；JSON 视图先校验编辑缓冲再回写） */
		async function saveStringValue() {
			if (!activeKey.value) return;
			if (stringView.value === "json") {
				try {
					JSON.parse(jsonEdit.value);
				} catch {
					message.warning("JSON 编辑内容不是合法 JSON，无法保存");
					return;
				}
				stringValue.value = jsonEdit.value;
			}
			saving.value = true;
			try {
				await setRedisString(datasourceId.value, activeDb.value, activeKey.value, stringValue.value);
				message.success("值已保存");
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key");
			} finally {
				saving.value = false;
			}
		}
		/** 打开设置 TTL 弹窗 */
		function openExpire() {
			ttlValue.value = detail.value ? String(detail.value.ttl) : "";
			ttlVisible.value = true;
		}
		/** 提交 TTL 设置 */
		async function submitExpire() {
			const ttl = Number(ttlValue.value.trim());
			if (!Number.isFinite(ttl)) {
				message.warning("TTL 必须是数字");
				return;
			}
			saving.value = true;
			try {
				await expireRedisKey(datasourceId.value, activeDb.value, activeKey.value, ttl);
				message.success(ttl === -1 ? "已设置为永久" : `TTL 已设置为 ${ttl} 秒`);
				ttlVisible.value = false;
				ready();
				await scanKeys(false);
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/expire");
			} finally {
				saving.value = false;
			}
		}
		/**
		* 切换 STRING 值视图（字符串 / HEX / JSON）。
		*
		* <p>进入 JSON 视图时把编辑缓冲初始化为当前值的美化文本，高亮层与编辑层同源；
		* 回到字符串视图不回写（jsonEdit 仅在点「保存值」时落库）。</p>
		*
		* @param view 目标视图
		*/
		function setStringView(view) {
			if (view === "json") jsonEdit.value = jsonViewText.value;
			stringView.value = view;
		}
		/**
		* JSON 编辑层滚动 → 同步高亮层滚动（两层同尺寸叠放，保证行对齐）。
		*
		* @param e 滚动事件
		*/
		function syncJsonScroll(e) {
			const target = e.target;
			const hl = document.querySelectorAll(".dsm-json-editor .dsm-json-hl")[0];
			if (hl) {
				hl.scrollTop = target.scrollTop;
				hl.scrollLeft = target.scrollLeft;
			}
		}
		/** 停掉 TTL 倒计时并清空显示态（切键、改 TTL、卸载时调用，防定时器泄漏） */
		function stopTtlCountdown() {
			if (ttlTimer !== null) {
				clearInterval(ttlTimer);
				ttlTimer = null;
			}
			ttlCountdown.value = null;
		}
		/**
		* 按详情 TTL 启动逐秒倒计时（仅 ttl > 0 时）。
		*
		* <p>ttl ≤ 0（永久 -1 / 不存在 -2）走 formatTtl 展示，不启用定时器。
		* 启动前先 stop，保证同一时刻至多一个倒计时器。</p>
		*
		* @param ttl 详情返回的 TTL 秒数
		*/
		function startTtlCountdown(ttl) {
			stopTtlCountdown();
			if (!Number.isFinite(ttl) || ttl <= 0) return;
			ttlCountdown.value = Math.floor(ttl);
			ttlTimer = setInterval(() => {
				if (ttlCountdown.value === null) {
					stopTtlCountdown();
					return;
				}
				if (ttlCountdown.value <= 1) {
					stopTtlCountdown();
					scanKeys(false);
					return;
				}
				ttlCountdown.value -= 1;
			}, 1e3);
		}
		/**
		* 删除键（单个，带确认）。
		*
		* @param key 键名
		*/
		async function confirmDeleteKey(key) {
			try {
				await ElMessageBox.confirm(`确定删除键 ${key} 吗？该操作不可恢复。`, "删除确认", {
					type: "warning",
					confirmButtonText: "删除"
				});
			} catch {
				return;
			}
			try {
				await deleteRedisKeys(datasourceId.value, activeDb.value, [key]);
				message.success("键已删除");
				activeKey.value = "";
				detail.value = null;
				ready();
				await loadSideData();
				await scanKeys(true);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key");
			}
		}
		/**
		* 复制键名到剪贴板（键列表悬停工具条）。
		*
		* @param key 键名
		*/
		async function copyKeyName(key) {
			if (await copyToClipboard(key)) message.success("键名已复制");
			else message.warning("复制失败，浏览器拒绝了剪贴板访问");
		}
		/**
		* 删除目录：扫描该前缀下全部键（含未加载批次）后一次确认、批量删除。
		* 目录 = 前缀 `dir:` 下的所有键；与树形「目录」行的语义一致（2026-10-07 需求）。
		*
		* @param dir 目录路径（如 `user:profile`）
		*/
		async function confirmDeleteDir(dir) {
			const prefix = `${dir}:`;
			const found = [];
			let cursor = "0";
			let guard = 0;
			try {
				do {
					const res = await scanRedisKeys({
						datasourceId: datasourceId.value,
						db: activeDb.value,
						pattern: `${prefix}*`,
						cursor,
						count: 500
					});
					found.push(...(res?.keys || []).map((k) => k.key));
					cursor = String(res?.nextCursor ?? "0");
					guard += 1;
				} while (cursor !== "0" && guard < 200);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/keys");
				return;
			}
			if (found.length === 0) {
				message.info("目录下没有键");
				return;
			}
			try {
				await ElMessageBox.confirm(`确定删除目录 ${dir} 下全部 ${found.length} 个键吗？该操作不可恢复。`, "删除确认", {
					type: "warning",
					confirmButtonText: "删除"
				});
			} catch {
				return;
			}
			try {
				await deleteRedisKeys(datasourceId.value, activeDb.value, found);
				message.success(`已删除目录下 ${found.length} 个键`);
				if (activeKey.value.startsWith(prefix)) {
					activeKey.value = "";
					detail.value = null;
				}
				ready();
				await loadSideData();
				await scanKeys(true);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key");
			}
		}
		/** HASH 添加字段 */
		async function addHashField() {
			const field = newHashField.value.trim();
			if (!field) {
				message.warning("字段名不能为空");
				return;
			}
			saving.value = true;
			try {
				await hsetRedisField(datasourceId.value, activeDb.value, activeKey.value, {
					field,
					value: newHashValue.value
				});
				newHashField.value = "";
				newHashValue.value = "";
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/hash");
			} finally {
				saving.value = false;
			}
		}
		/**
		* 删除类操作后的回拉：删空后 Redis 会自动删除整个键 → 清空选中并静默重扫
		* 左侧键列表（顶部扫描条 `.dsm-scan-bar` 随 loading 动画）；未删空则只刷新详情。
		*
		* @param keyGone 是否已删空（键已被 Redis 自动删除）
		*/
		async function reloadAfterRemoval(keyGone) {
			if (keyGone) {
				activeKey.value = "";
				detail.value = null;
				stopTtlCountdown();
				await scanKeys(true);
				return;
			}
			await selectKey(activeKey.value);
		}
		/**
		* HASH 编辑字段（同字段名 HSET 覆盖）。
		*
		* @param field 字段名
		* @param value 当前值
		*/
		async function editHashField(field, value) {
			let next;
			try {
				next = (await ElMessageBox.prompt(`修改字段 ${field}`, "编辑字段", {
					inputValue: value,
					inputPattern: /^[\s\S]*$/,
					inputErrorMessage: "值不能为空"
				})).value;
			} catch {
				return;
			}
			saving.value = true;
			try {
				await hsetRedisField(datasourceId.value, activeDb.value, activeKey.value, {
					field,
					value: next
				});
				message.success("字段已更新");
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/hash");
			} finally {
				saving.value = false;
			}
		}
		/**
		* HASH 删除字段。
		*
		* @param field 字段名
		*/
		async function removeHashField(field) {
			try {
				await ElMessageBox.confirm(`确定删除字段 ${field} 吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			const wasLast = hashFields.value.length <= 1;
			try {
				await hdelRedisField(datasourceId.value, activeDb.value, activeKey.value, field);
				message.success(wasLast ? "字段已删除（键已删空，列表已刷新）" : "字段已删除");
				ready();
				await reloadAfterRemoval(wasLast);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/hash");
			}
		}
		/** LIST 追加元素 */
		async function pushListElement() {
			if (!newListValue.value) {
				message.warning("元素值不能为空");
				return;
			}
			saving.value = true;
			try {
				await rpushRedisElement(datasourceId.value, activeDb.value, activeKey.value, newListValue.value);
				newListValue.value = "";
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/list");
			} finally {
				saving.value = false;
			}
		}
		/**
		* LIST 编辑元素（弹输入框）。
		*
		* @param index 下标
		* @param value 当前值
		*/
		async function editListElement(index, value) {
			let next;
			try {
				next = (await ElMessageBox.prompt(`修改下标 ${index} 的元素`, "编辑元素", {
					inputValue: value,
					inputPattern: /^[\s\S]*$/,
					inputErrorMessage: "值不能为空"
				})).value;
			} catch {
				return;
			}
			saving.value = true;
			try {
				await lsetRedisElement(datasourceId.value, activeDb.value, activeKey.value, index, next);
				message.success("元素已更新");
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/list");
			} finally {
				saving.value = false;
			}
		}
		/**
		* LIST 删除元素。
		*
		* @param index 下标
		*/
		async function removeListElement(index) {
			try {
				await ElMessageBox.confirm(`确定删除下标 ${index} 的元素吗？删除后后续元素前移。`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			const wasLast = listRows.value.length <= 1;
			try {
				await lremRedisIndex(datasourceId.value, activeDb.value, activeKey.value, index);
				message.success(wasLast ? "元素已删除（键已删空，列表已刷新）" : "元素已删除");
				ready();
				await reloadAfterRemoval(wasLast);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/list");
			}
		}
		/** SET 添加成员 */
		async function addSetMember() {
			const member = newSetMember.value.trim();
			if (!member) {
				message.warning("成员不能为空");
				return;
			}
			saving.value = true;
			try {
				const added = await saddRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
				newSetMember.value = "";
				ready();
				message.success(added ? "成员已添加" : "成员已存在，未重复添加");
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/set");
			} finally {
				saving.value = false;
			}
		}
		/**
		* SET 编辑成员（改名 = SADD 新成员 + SREM 旧成员）。
		*
		* @param member 当前成员
		*/
		async function editSetMember(member) {
			let next;
			try {
				next = (await ElMessageBox.prompt("修改成员（集合不支持原地改名，保存时新增新值并移除旧值）", "编辑成员", {
					inputValue: member,
					inputPattern: /\S+/,
					inputErrorMessage: "成员不能为空"
				})).value.trim();
			} catch {
				return;
			}
			if (next === member) return;
			saving.value = true;
			try {
				await saddRedisMember(datasourceId.value, activeDb.value, activeKey.value, next);
				await sremRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
				message.success("成员已更新");
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/set");
			} finally {
				saving.value = false;
			}
		}
		/**
		* SET 删除成员。
		*
		* @param member 成员
		*/
		async function removeSetMember(member) {
			try {
				await ElMessageBox.confirm(`确定删除成员 ${member} 吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			const wasLast = setRows.value.length <= 1;
			try {
				await sremRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
				message.success(wasLast ? "成员已删除（键已删空，列表已刷新）" : "成员已删除");
				ready();
				await reloadAfterRemoval(wasLast);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/set");
			}
		}
		/** ZSET 添加成员 */
		async function addZsetMember() {
			const member = newZsetMember.value.trim();
			if (!member) {
				message.warning("成员不能为空");
				return;
			}
			const score = Number(newZsetScore.value.trim());
			if (!Number.isFinite(score)) {
				message.warning("分值必须是数字");
				return;
			}
			saving.value = true;
			try {
				await zaddRedisMember(datasourceId.value, activeDb.value, activeKey.value, member, score);
				newZsetMember.value = "";
				newZsetScore.value = "";
				ready();
				message.success("成员已写入");
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/zset");
			} finally {
				saving.value = false;
			}
		}
		/**
		* ZSET 编辑分值（同成员 ZADD 覆盖 score）。
		*
		* @param member 成员
		* @param score 当前分值
		*/
		async function editZsetScore(member, score) {
			let next;
			try {
				next = (await ElMessageBox.prompt(`修改成员 ${member} 的分值`, "编辑分值", {
					inputValue: String(score),
					inputPattern: /^-?\d+(\.\d+)?$/,
					inputErrorMessage: "分值必须是数字"
				})).value;
			} catch {
				return;
			}
			const num = Number(next);
			if (!Number.isFinite(num)) {
				message.warning("分值必须是数字");
				return;
			}
			saving.value = true;
			try {
				await zaddRedisMember(datasourceId.value, activeDb.value, activeKey.value, member, num);
				message.success("分值已更新");
				ready();
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/zset");
			} finally {
				saving.value = false;
			}
		}
		/**
		* ZSET 删除成员。
		*
		* @param member 成员
		*/
		async function removeZsetMember(member) {
			try {
				await ElMessageBox.confirm(`确定删除成员 ${member} 吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			const wasLast = zsetRows.value.length <= 1;
			try {
				await zremRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
				message.success(wasLast ? "成员已删除（键已删空，列表已刷新）" : "成员已删除");
				ready();
				await reloadAfterRemoval(wasLast);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/zset");
			}
		}
		/** STREAM 追加消息 */
		async function appendStreamEntry() {
			const field = newStreamField.value.trim();
			if (!field) {
				message.warning("字段名不能为空");
				return;
			}
			saving.value = true;
			try {
				await xaddRedisStream(datasourceId.value, activeDb.value, activeKey.value, [{
					field,
					value: newStreamValue.value
				}]);
				newStreamField.value = "";
				newStreamValue.value = "";
				ready();
				message.success("消息已追加");
				await selectKey(activeKey.value);
			} catch (e) {
				fail(e, "/ms/monitor/redis-manage/key/stream");
			} finally {
				saving.value = false;
			}
		}
		onMounted(refresh);
		onBeforeUnmount(stopTtlCountdown);
		return (_ctx, _cache) => {
			const _component_el_empty = resolveComponent("el-empty");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["dsm tel-page", { resizing: resizing.value }]) }, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(unref(component$1), {
					name: "Coin",
					size: 18,
					class: "dsm-title-icon dsm-redis-icon"
				}), _cache[33] || (_cache[33] = createBaseVNode("span", { class: "dsm-title" }, "Redis 缓存管理", -1))]), createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createVNode(unref(ReSelect_default), {
						modelValue: activeDb.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeDb.value = $event),
						options: dbOptions.value,
						disabled: databases.value.length === 0,
						placeholder: databases.value.length ? "选择逻辑库" : unref(gap) ? "未读取到库" : "—",
						filterable: "",
						onChange: onDbChange
					}, null, 8, [
						"modelValue",
						"options",
						"disabled",
						"placeholder"
					])]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Connection",
						tip: "测试连接",
						"data-testid": "dsm-btn-test",
						disabled: !unref(source),
						loading: testing.value,
						onClick: testConnection
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "InfoFilled",
						tip: "服务器信息",
						"data-testid": "dsm-btn-info",
						disabled: !unref(source),
						onClick: openInfo
					}, null, 8, ["disabled"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						icon: "Refresh",
						tip: "刷新",
						"data-testid": "dsm-btn-refresh",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						icon: "Plus",
						tip: "新建键",
						"data-testid": "dsm-btn-create",
						disabled: !unref(source),
						onClick: openCreate
					}, null, 8, ["disabled"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				createBaseVNode("div", _hoisted_5, [
					createBaseVNode("div", {
						class: "dsm-sidebar",
						style: normalizeStyle({ width: leftWidth.value + "px" })
					}, [
						createBaseVNode("div", _hoisted_6, [createVNode(unref(ReInput_default), {
							modelValue: pattern.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => pattern.value = $event),
							placeholder: "匹配模式，如 user:*",
							onKeyup: withKeys(reloadKeys, ["enter"])
						}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: loading.value,
							onClick: reloadKeys
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Search",
								size: "12"
							})]),
							default: withCtx(() => [_cache[34] || (_cache[34] = createTextVNode("查询", -1))]),
							_: 1
						}, 8, ["loading"])]),
						createBaseVNode("div", _hoisted_7, [
							createBaseVNode("span", _hoisted_8, toDisplayString(keys.value.length) + " 键", 1),
							_cache[35] || (_cache[35] = createBaseVNode("span", { class: "dsm-view-spacer" }, null, -1)),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Grid",
								tip: "平铺",
								"data-testid": "dsm-view-flat",
								type: viewMode.value === "flat" ? "primary" : "",
								onClick: _cache[2] || (_cache[2] = ($event) => viewMode.value = "flat")
							}, null, 8, ["type"]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Share",
								tip: "树形",
								"data-testid": "dsm-view-tree",
								type: viewMode.value === "tree" ? "primary" : "",
								onClick: _cache[3] || (_cache[3] = ($event) => viewMode.value = "tree")
							}, null, 8, ["type"])
						]),
						createBaseVNode("div", _hoisted_9, [
							createBaseVNode("div", {
								class: normalizeClass(["dsm-scan-bar", { "is-active": loading.value }]),
								"data-testid": "dsm-scan-bar"
							}, [..._cache[36] || (_cache[36] = [createBaseVNode("span", null, null, -1)])], 2),
							viewMode.value === "flat" ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(keys.value, (row) => {
								return openBlock(), createElementBlock("div", {
									key: "k:" + row.key,
									class: normalizeClass(["dsm-tree-node", { active: activeKey.value === row.key }]),
									onClick: ($event) => selectKey(row.key)
								}, [
									createVNode(unref(component$1), {
										name: "Document",
										size: "13",
										class: "dsm-tree-icon"
									}),
									createBaseVNode("span", {
										class: "dsm-tree-label",
										title: row.key
									}, toDisplayString(row.key), 9, _hoisted_11),
									createVNode(unref(component$2), { type: typeTagType(row.type) }, {
										default: withCtx(() => [createTextVNode(toDisplayString(row.type), 1)]),
										_: 2
									}, 1032, ["type"]),
									createBaseVNode("div", {
										class: "dsm-row-actions",
										"data-testid": "dsm-row-actions",
										onClick: _cache[4] || (_cache[4] = withModifiers(() => {}, ["stop"]))
									}, [createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "CopyDocument",
										tip: "复制键名",
										"data-testid": "dsm-row-copy",
										onClick: ($event) => copyKeyName(row.key)
									}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "Delete",
										tip: "删除",
										"data-testid": "dsm-row-delete",
										onClick: ($event) => confirmDeleteKey(row.key)
									}, null, 8, ["onClick"])])
								], 10, _hoisted_10);
							}), 128)) : (openBlock(true), createElementBlock(Fragment, { key: 1 }, renderList(treeRows.value, (row) => {
								return openBlock(), createElementBlock("div", {
									key: "tr:" + row.kind + ":" + row.path,
									class: normalizeClass(["dsm-tree-node", {
										"is-dir": row.kind === "dir",
										active: row.kind === "leaf" && activeKey.value === row.path
									}]),
									style: normalizeStyle({ paddingLeft: `${12 + row.depth * 14}px` }),
									onClick: ($event) => onTreeRowClick(row)
								}, [
									row.kind === "dir" ? (openBlock(), createBlock(unref(component$1), {
										key: 0,
										name: row.expanded ? "ArrowDown" : "ArrowRight",
										size: "12",
										class: "dsm-tree-icon dsm-tree-caret"
									}, null, 8, ["name"])) : createCommentVNode("", true),
									row.kind === "dir" ? (openBlock(), createBlock(unref(component$1), {
										key: 1,
										name: row.expanded ? "FolderOpened" : "Folder",
										size: "13",
										class: "dsm-tree-icon dsm-tree-folder"
									}, null, 8, ["name"])) : (openBlock(), createBlock(unref(component$1), {
										key: 2,
										name: "Document",
										size: "13",
										class: "dsm-tree-icon"
									})),
									createBaseVNode("span", {
										class: "dsm-tree-label",
										title: row.path
									}, toDisplayString(row.name), 9, _hoisted_13),
									row.kind === "leaf" && row.item ? (openBlock(), createBlock(unref(component$2), {
										key: 3,
										type: typeTagType(row.item.type)
									}, {
										default: withCtx(() => [createTextVNode(toDisplayString(row.item.type), 1)]),
										_: 2
									}, 1032, ["type"])) : createCommentVNode("", true),
									createBaseVNode("div", {
										class: "dsm-row-actions",
										"data-testid": "dsm-row-actions",
										onClick: _cache[5] || (_cache[5] = withModifiers(() => {}, ["stop"]))
									}, [row.kind === "dir" ? (openBlock(), createBlock(unref(ReButton_default), {
										key: 0,
										layout: "square",
										size: "small",
										type: "danger",
										icon: "Delete",
										tip: "删除目录下全部键",
										"data-testid": "dsm-row-delete-dir",
										onClick: ($event) => confirmDeleteDir(row.path)
									}, null, 8, ["onClick"])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "CopyDocument",
										tip: "复制键名",
										"data-testid": "dsm-row-copy",
										onClick: ($event) => copyKeyName(row.path)
									}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "Delete",
										tip: "删除",
										"data-testid": "dsm-row-delete",
										onClick: ($event) => confirmDeleteKey(row.path)
									}, null, 8, ["onClick"])], 64))])
								], 14, _hoisted_12);
							}), 128)),
							keys.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_14, [createBaseVNode("span", _hoisted_15, toDisplayString(unref(gap) ? "未读取到键" : "该模式下暂无键"), 1)])) : createCommentVNode("", true),
							nextCursor.value !== "0" ? (openBlock(), createElementBlock("div", _hoisted_16, [createVNode(unref(ReButton_default), {
								text: "",
								loading: loading.value,
								onClick: loadMore
							}, {
								icon: withCtx(() => [createVNode(unref(component$1), {
									name: "ArrowDown",
									size: "12"
								})]),
								default: withCtx(() => [createTextVNode("加载更多（已加载 " + toDisplayString(keys.value.length) + "）", 1)]),
								_: 1
							}, 8, ["loading"])])) : createCommentVNode("", true)
						])
					], 4),
					createBaseVNode("div", {
						class: normalizeClass(["dsm-split", { active: resizing.value }]),
						title: "拖拽调节宽度",
						onMousedown: withModifiers(startResize, ["prevent"])
					}, null, 34),
					createBaseVNode("div", _hoisted_17, [createBaseVNode("div", _hoisted_18, [createBaseVNode("div", _hoisted_19, [createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": consoleMode.value === "detail" }),
						"data-testid": "dsm-console-detail",
						onClick: _cache[6] || (_cache[6] = ($event) => consoleMode.value = "detail")
					}, [createVNode(unref(component$1), {
						name: "Document",
						size: "12"
					}), _cache[37] || (_cache[37] = createTextVNode("键详情 ", -1))], 2), createBaseVNode("button", {
						type: "button",
						class: normalizeClass({ "is-active": consoleMode.value === "command" }),
						"data-testid": "dsm-console-command",
						onClick: _cache[7] || (_cache[7] = ($event) => consoleMode.value = "command")
					}, [createVNode(unref(component$1), {
						name: "Terminal",
						size: "12"
					}), _cache[38] || (_cache[38] = createTextVNode("命令控制台 ", -1))], 2)])]), consoleMode.value === "command" ? (openBlock(), createElementBlock("div", _hoisted_20, [
						createBaseVNode("div", _hoisted_21, [
							createVNode(unref(ReButton_default), {
								type: "primary",
								icon: "VideoPlay",
								tip: "执行（Ctrl+Enter）",
								"data-testid": "dsm-btn-run-command",
								disabled: !unref(source) || !commandText.value.trim(),
								loading: commandRunning.value,
								onClick: runCommand
							}, null, 8, ["disabled", "loading"]),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Delete",
								tip: "清空编辑器",
								"data-testid": "dsm-btn-clear-command",
								disabled: !commandText.value,
								onClick: clearCommand
							}, null, 8, ["disabled"]),
							_cache[39] || (_cache[39] = createBaseVNode("span", { class: "dsm-command-hint" }, "支持任意命令：JSON.GET / TS.RANGE / GEOSEARCH 等；危险命令由服务端拒绝", -1))
						]),
						createVNode(DbSqlEditor_default, {
							modelValue: commandText.value,
							"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => commandText.value = $event),
							language: "redis",
							"data-testid": "dsm-redis-editor",
							onExecute: runCommand
						}, null, 8, ["modelValue"]),
						commandError.value ? (openBlock(), createElementBlock("div", _hoisted_22, toDisplayString(commandError.value), 1)) : createCommentVNode("", true),
						commandResult.value ? (openBlock(), createElementBlock("div", _hoisted_23, [createBaseVNode("div", _hoisted_24, [_cache[40] || (_cache[40] = createTextVNode(" 执行结果 ", -1)), createBaseVNode("div", _hoisted_25, [createVNode(unref(ReButton_default), {
							layout: "square",
							icon: "CopyDocument",
							tip: "复制结果",
							"data-testid": "dsm-btn-copy-result",
							onClick: copyResult
						})])]), resultView.value.kind === "scalar" ? (openBlock(), createElementBlock("pre", _hoisted_26, toDisplayString(resultView.value.text), 1)) : resultView.value.kind === "json" ? (openBlock(), createElementBlock("pre", _hoisted_27, toDisplayString(resultView.value.text), 1)) : resultView.value.kind === "nil" ? (openBlock(), createElementBlock("div", _hoisted_28, "nil")) : (openBlock(), createElementBlock("div", _hoisted_29, [createVNode(unref(ReTable_default), {
							data: resultView.value.rows,
							columns: resultView.value.columns,
							pagination: false,
							stripe: "",
							border: "",
							height: "240px"
						}, null, 8, ["data", "columns"])]))])) : createCommentVNode("", true)
					])) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
						createBaseVNode("div", _hoisted_30, [
							createBaseVNode("div", _hoisted_31, [_cache[41] || (_cache[41] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_32, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
							createBaseVNode("div", _hoisted_33, [_cache[42] || (_cache[42] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_34, toDisplayString(unref(source) ? `${unref(source).host || "127.0.0.1"}:${unref(source).port || 6379}` : "—"), 1)]),
							createBaseVNode("div", _hoisted_35, [_cache[43] || (_cache[43] = createBaseVNode("span", { class: "dsm-info-label" }, "当前库", -1)), createBaseVNode("span", _hoisted_36, "db" + toDisplayString(activeDb.value), 1)]),
							createBaseVNode("div", _hoisted_37, [_cache[44] || (_cache[44] = createBaseVNode("span", { class: "dsm-info-label" }, "本批键数", -1)), createBaseVNode("span", _hoisted_38, toDisplayString(keys.value.length) + toDisplayString(nextCursor.value !== "0" ? "（还有更多）" : ""), 1)]),
							createBaseVNode("div", _hoisted_39, [_cache[45] || (_cache[45] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
								_: 1
							}, 8, ["type"])]),
							createBaseVNode("div", _hoisted_40, [_cache[46] || (_cache[46] = createBaseVNode("span", { class: "dsm-info-label" }, "服务端版本", -1)), createBaseVNode("span", _hoisted_41, toDisplayString(info.value.redis_version || "未探测"), 1)])
						]),
						!activeKey.value ? (openBlock(), createElementBlock("div", _hoisted_42, [createVNode(_component_el_empty, {
							description: "暂无数据",
							"image-size": 72
						})])) : createCommentVNode("", true),
						activeKey.value ? (openBlock(), createElementBlock("div", _hoisted_43, [createBaseVNode("div", _hoisted_44, [createTextVNode(" 键详情 - " + toDisplayString(activeKey.value) + " ", 1), createBaseVNode("div", _hoisted_45, [createVNode(unref(ReButton_default), {
							text: "",
							onClick: openExpire
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Timer",
								size: "12"
							})]),
							default: withCtx(() => [_cache[47] || (_cache[47] = createTextVNode("设置 TTL", -1))]),
							_: 1
						})])]), detail.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_46, [
							createBaseVNode("div", _hoisted_47, [_cache[48] || (_cache[48] = createBaseVNode("span", { class: "dsm-detail-label" }, "键名", -1)), createBaseVNode("span", _hoisted_48, toDisplayString(detail.value.key), 1)]),
							createBaseVNode("div", _hoisted_49, [_cache[49] || (_cache[49] = createBaseVNode("span", { class: "dsm-detail-label" }, "类型", -1)), createVNode(unref(component$2), { type: typeTagType(detail.value.type) }, {
								default: withCtx(() => [createTextVNode(toDisplayString(detail.value.type), 1)]),
								_: 1
							}, 8, ["type"])]),
							createBaseVNode("div", _hoisted_50, [_cache[50] || (_cache[50] = createBaseVNode("span", { class: "dsm-detail-label" }, "TTL", -1)), createBaseVNode("span", _hoisted_51, toDisplayString(ttlCountdown.value !== null ? `${ttlCountdown.value} 秒` : formatTtl(detail.value.ttl)), 1)]),
							createBaseVNode("div", _hoisted_52, [createBaseVNode("span", _hoisted_53, toDisplayString(detail.value.type === "STRING" ? "字符数" : "元素数"), 1), createBaseVNode("span", _hoisted_54, toDisplayString(detail.value.size), 1)])
						]), detail.value.type === "STRING" ? (openBlock(), createElementBlock("div", _hoisted_55, [createBaseVNode("div", _hoisted_56, [_cache[54] || (_cache[54] = createTextVNode(" 值 ", -1)), createBaseVNode("div", _hoisted_57, [createBaseVNode("div", _hoisted_58, [
							createBaseVNode("button", {
								type: "button",
								class: normalizeClass({ "is-active": stringView.value === "text" }),
								"data-testid": "dsm-view-text",
								onClick: _cache[9] || (_cache[9] = ($event) => setStringView("text"))
							}, [createVNode(unref(component$1), {
								name: "Document",
								size: "12"
							}), _cache[51] || (_cache[51] = createTextVNode("字符串 ", -1))], 2),
							createBaseVNode("button", {
								type: "button",
								class: normalizeClass({ "is-active": stringView.value === "hex" }),
								"data-testid": "dsm-view-hex",
								onClick: _cache[10] || (_cache[10] = ($event) => setStringView("hex"))
							}, [createVNode(unref(component$1), {
								name: "Coin",
								size: "12"
							}), _cache[52] || (_cache[52] = createTextVNode("HEX ", -1))], 2),
							createBaseVNode("button", {
								type: "button",
								class: normalizeClass({ "is-active": stringView.value === "json" }),
								"data-testid": "dsm-view-json",
								onClick: _cache[11] || (_cache[11] = ($event) => setStringView("json"))
							}, [createVNode(unref(component$1), {
								name: "Files",
								size: "12"
							}), _cache[53] || (_cache[53] = createTextVNode("JSON ", -1))], 2)
						]), stringView.value !== "hex" ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							layout: "square",
							icon: "Check",
							tip: "保存值",
							type: "primary",
							loading: saving.value,
							"data-testid": "dsm-btn-save",
							onClick: saveStringValue
						}, null, 8, ["loading"])) : createCommentVNode("", true)])]), stringView.value === "text" ? withDirectives((openBlock(), createElementBlock("textarea", {
							key: 0,
							"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => stringValue.value = $event),
							class: "dsm-node-data dsm-fill",
							rows: "8",
							placeholder: "UTF-8 文本",
							"data-testid": "dsm-input-string"
						}, null, 512)), [[vModelText, stringValue.value]]) : stringView.value === "hex" ? (openBlock(), createElementBlock("pre", _hoisted_59, toDisplayString(hexViewText.value), 1)) : (openBlock(), createElementBlock("div", _hoisted_60, [createBaseVNode("pre", {
							class: "dsm-json-hl dsm-value-view",
							"data-testid": "dsm-json-hl",
							"aria-hidden": "true",
							innerHTML: jsonHtml.value
						}, null, 8, _hoisted_61), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => jsonEdit.value = $event),
							class: "dsm-node-data dsm-json-input",
							rows: "8",
							spellcheck: "false",
							"data-testid": "dsm-input-json",
							onScroll: syncJsonScroll
						}, null, 544), [[vModelText, jsonEdit.value]])]))])) : detail.value.type === "HASH" ? (openBlock(), createElementBlock("div", _hoisted_62, [
							createBaseVNode("div", _hoisted_63, "字段（" + toDisplayString(hashFields.value.length) + "）", 1),
							createBaseVNode("div", _hoisted_64, [
								createVNode(unref(ReInput_default), {
									modelValue: newHashField.value,
									"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => newHashField.value = $event),
									placeholder: "字段名"
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReInput_default), {
									modelValue: newHashValue.value,
									"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => newHashValue.value = $event),
									placeholder: "值"
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReButton_default), {
									type: "primary",
									loading: saving.value,
									onClick: addHashField
								}, {
									icon: withCtx(() => [createVNode(unref(component$1), {
										name: "Plus",
										size: "12"
									})]),
									default: withCtx(() => [_cache[55] || (_cache[55] = createTextVNode("添加字段", -1))]),
									_: 1
								}, 8, ["loading"])
							]),
							createBaseVNode("div", _hoisted_65, [createVNode(unref(ReTable_default), {
								data: hashFields.value,
								columns: hashColumns,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_66, [createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Edit",
									tip: "编辑字段",
									"data-testid": "dsm-cell-edit",
									onClick: ($event) => editHashField(row.field, row.value)
								}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Delete",
									tip: "删除字段",
									"data-testid": "dsm-cell-del",
									onClick: ($event) => removeHashField(row.field)
								}, null, 8, ["onClick"])])]),
								_: 1
							}, 8, ["data"])])
						])) : detail.value.type === "LIST" ? (openBlock(), createElementBlock("div", _hoisted_67, [
							createBaseVNode("div", _hoisted_68, "元素（" + toDisplayString(listRows.value.length) + "）", 1),
							createBaseVNode("div", _hoisted_69, [createVNode(unref(ReInput_default), {
								modelValue: newListValue.value,
								"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => newListValue.value = $event),
								placeholder: "新元素",
								class: "dsm-add-grow"
							}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
								type: "primary",
								loading: saving.value,
								onClick: pushListElement
							}, {
								icon: withCtx(() => [createVNode(unref(component$1), {
									name: "Plus",
									size: "12"
								})]),
								default: withCtx(() => [_cache[56] || (_cache[56] = createTextVNode("追加元素", -1))]),
								_: 1
							}, 8, ["loading"])]),
							createBaseVNode("div", _hoisted_70, [createVNode(unref(ReTable_default), {
								data: listRows.value,
								columns: listColumns,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_71, [createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Edit",
									tip: "编辑元素",
									"data-testid": "dsm-cell-edit",
									onClick: ($event) => editListElement(row.index, row.value)
								}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Delete",
									tip: "删除元素",
									"data-testid": "dsm-cell-del",
									onClick: ($event) => removeListElement(row.index)
								}, null, 8, ["onClick"])])]),
								_: 1
							}, 8, ["data"])])
						])) : detail.value.type === "SET" ? (openBlock(), createElementBlock("div", _hoisted_72, [
							createBaseVNode("div", _hoisted_73, "成员（" + toDisplayString(setRows.value.length) + "）", 1),
							createBaseVNode("div", _hoisted_74, [createVNode(unref(ReInput_default), {
								modelValue: newSetMember.value,
								"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => newSetMember.value = $event),
								placeholder: "新成员",
								class: "dsm-add-grow"
							}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
								type: "primary",
								loading: saving.value,
								onClick: addSetMember
							}, {
								icon: withCtx(() => [createVNode(unref(component$1), {
									name: "Plus",
									size: "12"
								})]),
								default: withCtx(() => [_cache[57] || (_cache[57] = createTextVNode("添加成员", -1))]),
								_: 1
							}, 8, ["loading"])]),
							createBaseVNode("div", _hoisted_75, [createVNode(unref(ReTable_default), {
								data: setRows.value,
								columns: memberColumns,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-member": withCtx(({ row }) => [createBaseVNode("span", _hoisted_76, toDisplayString(row.member), 1)]),
								"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_77, [createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Edit",
									tip: "编辑成员",
									"data-testid": "dsm-cell-edit",
									onClick: ($event) => editSetMember(row.member)
								}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Delete",
									tip: "删除成员",
									"data-testid": "dsm-cell-del",
									onClick: ($event) => removeSetMember(row.member)
								}, null, 8, ["onClick"])])]),
								_: 1
							}, 8, ["data"])])
						])) : detail.value.type === "ZSET" ? (openBlock(), createElementBlock("div", _hoisted_78, [
							createBaseVNode("div", _hoisted_79, "成员（" + toDisplayString(zsetRows.value.length) + "）", 1),
							createBaseVNode("div", _hoisted_80, [
								createVNode(unref(ReInput_default), {
									modelValue: newZsetMember.value,
									"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => newZsetMember.value = $event),
									placeholder: "成员"
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReInput_default), {
									modelValue: newZsetScore.value,
									"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => newZsetScore.value = $event),
									placeholder: "分值，如 1",
									class: "dsm-add-narrow"
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReButton_default), {
									type: "primary",
									loading: saving.value,
									onClick: addZsetMember
								}, {
									icon: withCtx(() => [createVNode(unref(component$1), {
										name: "Plus",
										size: "12"
									})]),
									default: withCtx(() => [_cache[58] || (_cache[58] = createTextVNode("添加成员", -1))]),
									_: 1
								}, 8, ["loading"])
							]),
							createBaseVNode("div", _hoisted_81, [createVNode(unref(ReTable_default), {
								data: zsetRows.value,
								columns: zsetColumns,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-score": withCtx(({ row }) => [createBaseVNode("span", _hoisted_82, toDisplayString(row.score), 1)]),
								"col-actions": withCtx(({ row }) => [createBaseVNode("div", _hoisted_83, [createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Edit",
									tip: "编辑分值",
									"data-testid": "dsm-cell-edit",
									onClick: ($event) => editZsetScore(row.member, row.score ?? 0)
								}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "Delete",
									tip: "删除成员",
									"data-testid": "dsm-cell-del",
									onClick: ($event) => removeZsetMember(row.member)
								}, null, 8, ["onClick"])])]),
								_: 1
							}, 8, ["data"])])
						])) : detail.value.type === "STREAM" ? (openBlock(), createElementBlock("div", _hoisted_84, [
							createBaseVNode("div", _hoisted_85, "消息（" + toDisplayString(streamEntries.value.length) + "）", 1),
							createBaseVNode("div", _hoisted_86, [
								createVNode(unref(ReInput_default), {
									modelValue: newStreamField.value,
									"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => newStreamField.value = $event),
									placeholder: "字段名"
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReInput_default), {
									modelValue: newStreamValue.value,
									"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => newStreamValue.value = $event),
									placeholder: "值"
								}, null, 8, ["modelValue"]),
								createVNode(unref(ReButton_default), {
									type: "primary",
									loading: saving.value,
									onClick: appendStreamEntry
								}, {
									icon: withCtx(() => [createVNode(unref(component$1), {
										name: "Plus",
										size: "12"
									})]),
									default: withCtx(() => [_cache[59] || (_cache[59] = createTextVNode("追加消息", -1))]),
									_: 1
								}, 8, ["loading"])
							]),
							createBaseVNode("div", _hoisted_87, [createVNode(unref(ReTable_default), {
								data: streamEntries.value,
								columns: streamColumns,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-id": withCtx(({ row }) => [createBaseVNode("span", _hoisted_88, toDisplayString(row.id), 1)]),
								"col-fields": withCtx(({ row }) => [(openBlock(true), createElementBlock(Fragment, null, renderList(row.fields, (f, fi) => {
									return openBlock(), createElementBlock("span", {
										key: fi,
										class: "dsm-stream-field"
									}, [createVNode(unref(component$2), { type: "info" }, {
										default: withCtx(() => [createTextVNode(toDisplayString(f.field), 1)]),
										_: 2
									}, 1024), createBaseVNode("span", _hoisted_89, toDisplayString(f.value), 1)]);
								}), 128))]),
								_: 1
							}, 8, ["data"])])
						])) : (openBlock(), createElementBlock("div", _hoisted_90, [_cache[60] || (_cache[60] = createBaseVNode("div", { class: "dsm-data-title" }, "值", -1)), createBaseVNode("pre", _hoisted_91, toDisplayString(formatPlainValue(detail.value.value)), 1)]))], 64)) : (openBlock(), createElementBlock("div", _hoisted_92, "正在读取…"))])) : createCommentVNode("", true)
					], 64))])
				]),
				createVNode(unref(component), {
					modelValue: createVisible.value,
					"onUpdate:modelValue": _cache[27] || (_cache[27] = ($event) => createVisible.value = $event),
					title: "新建键",
					width: "620px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[26] || (_cache[26] = ($event) => createVisible.value = false) }, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Close",
							size: "12"
						})]),
						default: withCtx(() => [_cache[64] || (_cache[64] = createTextVNode("取消", -1))]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: saving.value,
						onClick: submitCreate
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [_cache[65] || (_cache[65] = createTextVNode("创建", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_93, [
						createBaseVNode("div", _hoisted_94, [_cache[61] || (_cache[61] = createBaseVNode("label", null, "键名", -1)), createVNode(unref(ReInput_default), {
							modelValue: createForm.key,
							"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => createForm.key = $event),
							placeholder: "如 user:1001"
						}, null, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_95, [_cache[62] || (_cache[62] = createBaseVNode("label", null, "类型", -1)), createVNode(unref(ReSelect_default), {
							modelValue: createForm.type,
							"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => createForm.type = $event),
							options: unref(KEY_TYPE_OPTIONS),
							"data-testid": "dsm-create-type",
							style: { "width": "100%" }
						}, null, 8, ["modelValue", "options"])]),
						createBaseVNode("div", _hoisted_96, [_cache[63] || (_cache[63] = createBaseVNode("label", null, "TTL（秒，0 或留空表示永久）", -1)), createVNode(unref(ReInput_default), {
							modelValue: createForm.ttl,
							"onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => createForm.ttl = $event),
							placeholder: "0 = 永久"
						}, null, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_97, [
							createBaseVNode("label", null, toDisplayString(createValueLabel.value), 1),
							withDirectives(createBaseVNode("textarea", {
								"onUpdate:modelValue": _cache[25] || (_cache[25] = ($event) => createForm.value = $event),
								class: "dsm-node-data",
								rows: "8",
								placeholder: createValuePlaceholder.value
							}, null, 8, _hoisted_98), [[vModelText, createForm.value]]),
							createBaseVNode("span", _hoisted_99, toDisplayString(createValueHint.value), 1)
						])
					])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: infoVisible.value,
					"onUpdate:modelValue": _cache[29] || (_cache[29] = ($event) => infoVisible.value = $event),
					title: "Redis 服务器信息",
					width: "720px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[28] || (_cache[28] = ($event) => infoVisible.value = false) }, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Close",
							size: "12"
						})]),
						default: withCtx(() => [_cache[66] || (_cache[66] = createTextVNode("关闭", -1))]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: infoLoading.value,
						onClick: reloadInfo
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Refresh" })]),
						default: withCtx(() => [_cache[67] || (_cache[67] = createTextVNode("刷新", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createVNode(unref(ReTable_default), {
						data: infoRows.value,
						columns: infoColumns,
						pagination: false,
						stripe: "",
						border: "",
						height: "420px"
					}, null, 8, ["data"])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(unref(component), {
					modelValue: ttlVisible.value,
					"onUpdate:modelValue": _cache[32] || (_cache[32] = ($event) => ttlVisible.value = $event),
					title: "设置 TTL",
					width: "440px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[31] || (_cache[31] = ($event) => ttlVisible.value = false) }, {
						icon: withCtx(() => [createVNode(unref(component$1), {
							name: "Close",
							size: "12"
						})]),
						default: withCtx(() => [_cache[69] || (_cache[69] = createTextVNode("取消", -1))]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: saving.value,
						onClick: submitExpire
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [_cache[70] || (_cache[70] = createTextVNode("设置", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_100, [createBaseVNode("div", _hoisted_101, [_cache[68] || (_cache[68] = createBaseVNode("label", null, "过期秒数（-1 永久）", -1)), createVNode(unref(ReInput_default), {
						modelValue: ttlValue.value,
						"onUpdate:modelValue": _cache[30] || (_cache[30] = ($event) => ttlValue.value = $event),
						placeholder: "如 300；-1 表示永久"
					}, null, 8, ["modelValue"])])])]),
					_: 1
				}, 8, ["modelValue"])
			], 2);
		};
	}
}), [["__scopeId", "data-v-8f45174a"]]);
//#endregion
export { RedisManageView_default as default };
