import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { M as view_default, d as copy_document_default, f as delete_default, h as edit_pen_default } from "./dist-Axt1Prff.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as DsmContextMenu_default } from "./DsmContextMenu-BEoagIWo.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
//#region ../../pages/datasource/src/api/etcdManageApi.ts
var unwrap = (res) => unwrapResult(res);
/**
* 测试 etcd 连通性（带凭据校验）
* @param datasourceId 数据源 ID（可选）
*/
var testEtcdConnection = (datasourceId) => http().post("/ms/monitor/etcd/test").data({ datasourceId }).then((r) => unwrapResult(r));
/**
* 读取 etcd 服务端状态
* @param datasourceId 数据源 ID（可选）
*/
var fetchEtcdStatus = (datasourceId) => http().get("/ms/monitor/etcd/status").query({ datasourceId }).then((r) => unwrap(r));
/**
* 按前缀列举键
* @param params 数据源 / 前缀 / 条数上限 / 是否只取键名
*/
var fetchEtcdKeys = (params) => http().get("/ms/monitor/etcd/keys").query(params).then((r) => unwrap(r));
/**
* 读取键详情
* @param key 键名
* @param datasourceId 数据源 ID（可选）
*/
var fetchEtcdKey = (key, datasourceId) => http().get("/ms/monitor/etcd/key").query({
	key,
	datasourceId
}).then((r) => unwrap(r));
/**
* 写入键（新增或覆盖）
* @param payload 数据源 / 键名 / 值 / 租约
*/
var saveEtcdKey = (payload) => http().put("/ms/monitor/etcd/key").data(payload).then((r) => unwrap(r));
/**
* 删除键
* @param key 键名
* @param datasourceId 数据源 ID（可选）
* @param prefix 为真时按前缀删除
*/
var deleteEtcdKey = (key, datasourceId, prefix = false) => http().delete("/ms/monitor/etcd/key").query({
	key,
	datasourceId,
	prefix
}).then((r) => unwrap(r));
/**
* 列举租约
* @param datasourceId 数据源 ID（可选）
*/
var fetchEtcdLeases = (datasourceId) => http().get("/ms/monitor/etcd/leases").query({ datasourceId }).then((r) => unwrap(r));
/**
* 授予租约
* @param payload 数据源 / TTL 秒数
*/
var grantEtcdLease = (payload) => http().post("/ms/monitor/etcd/lease").data(payload).then((r) => unwrap(r));
/**
* 撤销租约（绑定的键会一并删除）
* @param leaseId 租约 ID
* @param datasourceId 数据源 ID（可选）
*/
var revokeEtcdLease = (leaseId, datasourceId) => http().delete("/ms/monitor/etcd/lease").query({
	leaseId,
	datasourceId
}).then((r) => unwrap(r));
/**
* 查询集群成员与健康
* @param datasourceId 数据源 ID（可选）
*/
var fetchEtcdMembers = (datasourceId) => http().get("/ms/monitor/etcd/members").query({ datasourceId }).then((r) => unwrap(r));
//#endregion
//#region ../../pages/datasource/src/views/console/EtcdManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm-toolbar re-surface" };
var _hoisted_2 = { class: "dsm-toolbar-left" };
var _hoisted_3 = { class: "dsm-toolbar-right" };
var _hoisted_4 = { class: "dsm-body" };
var _hoisted_5 = { class: "dsm-search-section" };
var _hoisted_6 = { class: "dsm-view-bar" };
var _hoisted_7 = { class: "dsm-view-count" };
var _hoisted_8 = { class: "dsm-key-list" };
var _hoisted_9 = { class: "dsm-tree" };
var _hoisted_10 = { class: "dsm-tree-branch" };
var _hoisted_11 = ["onClick"];
var _hoisted_12 = { class: "dsm-tree-label" };
var _hoisted_13 = { class: "dsm-tree-count" };
var _hoisted_14 = ["onClick", "onContextmenu"];
var _hoisted_15 = { class: "dsm-tree-label" };
var _hoisted_16 = ["title"];
var _hoisted_17 = {
	key: 0,
	class: "dsm-tree-node"
};
var _hoisted_18 = { class: "dsm-tree-label" };
var _hoisted_19 = { class: "dsm-content" };
var _hoisted_20 = { class: "dsm-info-card re-surface" };
var _hoisted_21 = { class: "dsm-info-row" };
var _hoisted_22 = { class: "dsm-info-value" };
var _hoisted_23 = { class: "dsm-info-row" };
var _hoisted_24 = { class: "dsm-info-value mono" };
var _hoisted_25 = { class: "dsm-info-row" };
var _hoisted_26 = { class: "dsm-info-value mono" };
var _hoisted_27 = { class: "dsm-info-row" };
var _hoisted_28 = { class: "dsm-info-row" };
var _hoisted_29 = { class: "dsm-info-value mono" };
var _hoisted_30 = { class: "dsm-info-row" };
var _hoisted_31 = { class: "dsm-info-value mono" };
var _hoisted_32 = { class: "dsm-tabs" };
var _hoisted_33 = {
	key: 0,
	class: "dsm-section"
};
var _hoisted_34 = { class: "dsm-section-title" };
var _hoisted_35 = { class: "dsm-section-actions" };
var _hoisted_36 = { key: 1 };
var _hoisted_37 = {
	key: 1,
	class: "dsm-section"
};
var _hoisted_38 = { class: "dsm-section-title" };
var _hoisted_39 = { class: "dsm-section-actions" };
var _hoisted_40 = { class: "dsm-node-detail" };
var _hoisted_41 = { class: "dsm-detail-row" };
var _hoisted_42 = { class: "dsm-detail-value mono" };
var _hoisted_43 = { class: "dsm-detail-row" };
var _hoisted_44 = { class: "dsm-detail-value mono" };
var _hoisted_45 = { class: "dsm-detail-row" };
var _hoisted_46 = { class: "dsm-detail-value mono" };
var _hoisted_47 = { class: "dsm-detail-row" };
var _hoisted_48 = { class: "dsm-detail-value mono" };
var _hoisted_49 = { class: "dsm-detail-row" };
var _hoisted_50 = { class: "dsm-detail-value mono" };
var _hoisted_51 = { class: "dsm-detail-row" };
var _hoisted_52 = { class: "dsm-detail-value mono" };
var _hoisted_53 = { class: "dsm-data-section" };
var _hoisted_54 = { class: "dsm-data-title" };
var _hoisted_55 = { class: "dsm-data-content" };
var _hoisted_56 = {
	key: 1,
	class: "dsm-empty-inline"
};
var _hoisted_57 = {
	key: 2,
	class: "dsm-section"
};
var _hoisted_58 = { class: "dsm-section-title" };
var _hoisted_59 = { class: "dsm-section-actions" };
var _hoisted_60 = { class: "mono" };
var _hoisted_61 = {
	key: 3,
	class: "dsm-section"
};
var _hoisted_62 = { class: "dsm-section-title" };
var _hoisted_63 = { class: "dsm-section-actions" };
var _hoisted_64 = { class: "mono" };
var _hoisted_65 = { key: 1 };
var _hoisted_66 = { class: "dsm-member-detail" };
var _hoisted_67 = { class: "dsm-detail-row" };
var _hoisted_68 = { class: "dsm-detail-value mono" };
var _hoisted_69 = { class: "dsm-detail-row" };
var _hoisted_70 = { class: "dsm-detail-value mono" };
var _hoisted_71 = { class: "dsm-detail-row" };
var _hoisted_72 = { class: "dsm-detail-value mono" };
var _hoisted_73 = { class: "dsm-detail-row" };
var _hoisted_74 = { class: "dsm-detail-value mono" };
var _hoisted_75 = { class: "dsm-detail-row" };
var _hoisted_76 = { class: "dsm-detail-value mono" };
var _hoisted_77 = { class: "dsm-node-form" };
var _hoisted_78 = { class: "dsm-form-item" };
var _hoisted_79 = { class: "dsm-form-item" };
var _hoisted_80 = ["disabled"];
var _hoisted_81 = { class: "dsm-form-item" };
var _hoisted_82 = { class: "dsm-node-form" };
var _hoisted_83 = { class: "dsm-form-item" };
var LEFT_WIDTH_KEY = "etcd-side-width";
//#endregion
//#region ../../pages/datasource/src/views/console/EtcdManageView.vue
var EtcdManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "EtcdManageView",
	__name: "EtcdManageView",
	setup(__props) {
		/**
		* etcd 配置中心管理页
		*
		* <p>基于「数据源管理」登记的 etcd 数据源，读取真实键/租约/集群成员，
		* 走 /ms/monitor/etcd/** 一组接口；接口缺失或连接失败时只展示失败原因，不回落演示数据。</p>
		*
		* <p>键按**前缀**分层浏览：etcd 没有目录概念，这里的"文件夹"是从键名里推导出来的下一级片段，
		* 只为浏览方便，不改变任何键。</p>
		*
		* @author CH
		* @since 4.0.0.43
		*/
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		/** 键列表行（附推导出的显示名） */
		const loading = ref(false);
		const testing = ref(false);
		const saving = ref(false);
		const activeTab = ref("keys");
		/** 当前浏览前缀，空串表示根 */
		const activePrefix = ref("");
		/** 侧栏目录/键名本地过滤（etcd 按前缀读取，过滤不改变后端查询范围） */
		const prefixFilter = ref("");
		/** 左侧栏宽度持久化键，避免与 Redis 等控制台冲突 */
		const leftWidth = ref(Math.min(560, Math.max(260, Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340)));
		/** 是否正在拖拽侧栏分隔条 */
		const resizing = ref(false);
		const activeKey = ref("");
		const keys = ref([]);
		const detail = ref(null);
		const leases = ref([]);
		const members = ref([]);
		const status = ref({});
		const keyVisible = ref(false);
		const keyDialogMode = ref("create");
		const leaseVisible = ref(false);
		const leaseTtl = ref("300");
		const form = reactive({
			key: "",
			value: "",
			lease: ""
		});
		const keyColumns = [
			{
				prop: "key",
				label: "键",
				minWidth: 260,
				slot: "col-key"
			},
			{
				prop: "version",
				label: "版本",
				width: 80
			},
			{
				prop: "modRevision",
				label: "修订号",
				width: 100
			},
			{
				prop: "lease",
				label: "租约",
				width: 120,
				slot: "col-lease"
			},
			{
				prop: "actions",
				label: "操作",
				width: 190,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const leaseColumns = [
			{
				prop: "id",
				label: "租约 ID",
				minWidth: 220,
				slot: "col-leaseId"
			},
			{
				prop: "ttl",
				label: "剩余 / 授予 TTL",
				width: 190,
				slot: "col-ttl"
			},
			{
				prop: "keyCount",
				label: "绑定键数",
				width: 110
			},
			{
				prop: "actions",
				label: "操作",
				width: 190,
				fixed: "right",
				slot: "col-actions"
			}
		];
		const memberColumns = [
			{
				prop: "id",
				label: "成员 ID",
				minWidth: 180,
				slot: "col-memberId"
			},
			{
				prop: "name",
				label: "名称",
				width: 140
			},
			{
				prop: "role",
				label: "角色",
				width: 120,
				slot: "col-role"
			},
			{
				prop: "healthy",
				label: "健康",
				width: 110,
				slot: "col-healthy"
			},
			{
				prop: "version",
				label: "版本",
				width: 110
			},
			{
				prop: "dbSize",
				label: "数据大小(字节)",
				width: 140
			},
			{
				prop: "error",
				label: "失败原因",
				minWidth: 180
			}
		];
		/** 当前前缀下的键行（显示名 = 前缀之后的第一段） */
		const keyRows = computed(() => keys.value.map((k) => ({
			...k,
			name: displayName(k.key)
		})));
		/** 由键名推导出的下一级"文件夹" */
		const folders = computed(() => {
			const map = /* @__PURE__ */ new Map();
			const base = activePrefix.value || "/";
			keys.value.forEach((k) => {
				const rest = stripPrefix(k.key);
				const idx = rest.indexOf("/");
				if (idx >= 0) {
					const seg = rest.slice(0, idx + 1);
					const path = base.endsWith("/") ? base + seg : base + "/" + seg;
					map.set(path, (map.get(path) || 0) + 1);
				}
			});
			return Array.from(map.entries()).map(([path, count]) => ({
				path,
				name: path.replace(base, ""),
				count
			}));
		});
		/** 当前前缀下的叶子键（不再分层） */
		const leafKeys = computed(() => keyRows.value.filter((r) => !stripPrefix(r.key).includes("/")));
		/** 目录过滤（过滤词不匹配目录名时隐藏，展示条数由计数条给出） */
		const filteredFolders = computed(() => {
			const kw = prefixFilter.value.trim().toLowerCase();
			return kw ? folders.value.filter((f) => f.name.toLowerCase().includes(kw)) : folders.value;
		});
		/** 叶子键过滤 */
		const filteredLeaves = computed(() => {
			const kw = prefixFilter.value.trim().toLowerCase();
			return kw ? leafKeys.value.filter((r) => r.name.toLowerCase().includes(kw)) : leafKeys.value;
		});
		/**
		* 开始拖拽侧栏分隔条（Redis 同形态）。
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
		/** 键行右键菜单（第九批统一 zk 模板）：侧栏叶子行 + 键列表表格共用一套动作 */
		const keyMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			key: ""
		});
		const keyMenuItems = [
			{
				key: "view",
				label: "查看详情",
				icon: "View"
			},
			{
				key: "edit",
				label: "编辑",
				icon: "Edit"
			},
			{
				key: "copy",
				label: "复制键名",
				icon: "CopyDocument"
			},
			{
				key: "delete",
				label: "删除",
				icon: "Delete",
				danger: true,
				divided: true
			}
		];
		/** 表格行右键（ReTable 内置菜单，图标为组件引用） */
		const keyTableMenu = [
			{
				key: "view",
				label: "查看详情",
				icon: view_default
			},
			{
				key: "edit",
				label: "编辑",
				icon: edit_pen_default
			},
			{
				key: "copy",
				label: "复制键名",
				icon: copy_document_default
			},
			{
				key: "delete",
				label: "删除",
				icon: delete_default,
				divided: true
			}
		];
		/** 打开侧栏键行右键菜单 */
		function onKeyContextMenu(e, key) {
			Object.assign(keyMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				key
			});
		}
		/** 复制文本到剪贴板（菜单动作共用） */
		function copyKeyText(key) {
			copyToClipboard(key).then((ok) => ok ? message.success("已复制键名") : message.error("复制失败"));
		}
		/** 侧栏菜单分发 */
		function onKeyMenuSelect(action) {
			const key = keyMenu.key;
			if (!key) return;
			if (action === "view") openDetail(key);
			else if (action === "edit") openEdit(key);
			else if (action === "copy") copyKeyText(key);
			else if (action === "delete") confirmDelete(key);
		}
		/** 表格菜单分发 */
		function onKeyTableMenuSelect(item, ctx) {
			const key = String(ctx.row.key ?? "");
			if (!key) return;
			if (item.key === "view") openDetail(key);
			else if (item.key === "edit") openEdit(key);
			else if (item.key === "copy") copyKeyText(key);
			else if (item.key === "delete") confirmDelete(key);
		}
		/**
		* 去掉当前前缀，得到剩余部分。
		*
		* <p>前缀为空（或前缀不以 {@code /} 结尾）时，剩余部分会以 {@code /} 开头；直接
		* {@code indexOf("/")} 会得到 0，于是"第一级文件夹"被算成 {@code /}，侧栏会显示成一个
		* 孤零零的斜杠而不是真实的第一段名字（验收时抓到的真 bug）。这里统一先去掉一个前导斜杠。</p>
		*
		* @param key 完整键名
		* @returns 剩余部分（去掉一个前导斜杠）
		*/
		function stripPrefix(key) {
			const prefix = activePrefix.value;
			const rest = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
			return rest.startsWith("/") ? rest.slice(1) : rest;
		}
		/**
		* 键在列表里的显示名。
		*
		* @param key 完整键名
		* @returns 显示名
		*/
		function displayName(key) {
			const rest = stripPrefix(key);
			const idx = rest.indexOf("/");
			return idx >= 0 ? rest.slice(0, idx + 1) : rest;
		}
		/**
		* 取键的父前缀。
		*
		* @param prefix 当前前缀
		* @returns 父前缀，根返回空串
		*/
		function parentOf(prefix) {
			if (!prefix) return "";
			const trimmed = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
			const idx = trimmed.lastIndexOf("/");
			return idx <= 0 ? "" : trimmed.slice(0, idx + 1);
		}
		/**
		* 加载当前前缀下的键。
		*/
		async function loadKeys() {
			if (!datasourceId.value) return;
			loading.value = true;
			try {
				keys.value = await fetchEtcdKeys({
					datasourceId: datasourceId.value,
					prefix: activePrefix.value,
					limit: 500,
					keysOnly: true
				}) || [];
				ready();
			} catch (e) {
				keys.value = [];
				fail(e, "/ms/monitor/etcd/keys");
			} finally {
				loading.value = false;
			}
		}
		/**
		* 加载服务端状态。
		*/
		async function loadStatus() {
			if (!datasourceId.value) return;
			try {
				status.value = await fetchEtcdStatus(datasourceId.value) || {};
			} catch (e) {
				fail(e, "/ms/monitor/etcd/status");
			}
		}
		/**
		* 加载租约列表。
		*/
		async function loadLeases() {
			if (!datasourceId.value) return;
			loading.value = true;
			try {
				leases.value = await fetchEtcdLeases(datasourceId.value) || [];
				ready();
			} catch (e) {
				leases.value = [];
				fail(e, "/ms/monitor/etcd/leases");
			} finally {
				loading.value = false;
			}
		}
		/**
		* 加载集群成员。
		*/
		async function loadMembers() {
			if (!datasourceId.value) return;
			loading.value = true;
			try {
				members.value = await fetchEtcdMembers(datasourceId.value) || [];
				ready();
			} catch (e) {
				members.value = [];
				fail(e, "/ms/monitor/etcd/members");
			} finally {
				loading.value = false;
			}
		}
		/**
		* 进入某个前缀。
		*
		* @param prefix 目标前缀
		*/
		async function enterPrefix(prefix) {
			activePrefix.value = prefix;
			activeKey.value = "";
			detail.value = null;
			await loadKeys();
		}
		/**
		* 选中一个键并读取详情。
		*
		* @param key 键名
		*/
		async function selectKey(key) {
			activeKey.value = key;
			detail.value = null;
			try {
				detail.value = await fetchEtcdKey(key, datasourceId.value);
				ready();
			} catch (e) {
				fail(e, `/ms/monitor/etcd/key?key=${key}`);
			}
		}
		/**
		* 切换页签并按需加载。
		*
		* @param tab 目标页签
		*/
		async function switchTab(tab) {
			activeTab.value = tab;
			if (tab === "leases") await loadLeases();
			else if (tab === "cluster") {
				await loadMembers();
				await loadStatus();
			}
		}
		/** 打开新建键弹窗 */
		function openCreate() {
			keyDialogMode.value = "create";
			Object.assign(form, {
				key: activePrefix.value,
				value: "",
				lease: ""
			});
			keyVisible.value = true;
		}
		/**
		* 打开编辑键弹窗。
		*
		* @param key 键名
		*/
		async function openEdit(key) {
			keyDialogMode.value = "edit";
			try {
				const d = await fetchEtcdKey(key, datasourceId.value);
				Object.assign(form, {
					key,
					value: d.value,
					lease: d.lease ? String(d.lease) : ""
				});
				keyVisible.value = true;
			} catch (e) {
				fail(e, `/ms/monitor/etcd/key?key=${key}`);
			}
		}
		/**
		* 打开只读详情弹窗。
		*
		* @param key 键名
		*/
		async function openDetail(key) {
			keyDialogMode.value = "view";
			try {
				const d = await fetchEtcdKey(key, datasourceId.value);
				Object.assign(form, {
					key,
					value: d.value,
					lease: d.lease ? String(d.lease) : ""
				});
				keyVisible.value = true;
			} catch (e) {
				fail(e, `/ms/monitor/etcd/key?key=${key}`);
			}
		}
		/** 提交键写入 */
		async function submitKey() {
			const key = form.key.trim();
			if (!key) {
				message.warning("键名不能为空");
				return;
			}
			const lease = Number(form.lease.trim());
			saving.value = true;
			try {
				await saveEtcdKey({
					datasourceId: datasourceId.value,
					key,
					value: form.value,
					lease: Number.isFinite(lease) && lease > 0 ? lease : void 0
				});
				message.success(keyDialogMode.value === "create" ? "键已创建" : "键已保存");
				keyVisible.value = false;
				ready();
				await loadKeys();
				if (activeKey.value === key) await selectKey(key);
			} catch (e) {
				fail(e, "/ms/monitor/etcd/key");
			} finally {
				saving.value = false;
			}
		}
		/**
		* 确认并删除键。
		*
		* @param key 键名
		*/
		async function confirmDelete(key) {
			try {
				await ElMessageBox.confirm(`确定删除键 ${key} 吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				const deleted = await deleteEtcdKey(key, datasourceId.value, false);
				message.success(`已删除（${deleted} 个）`);
				if (activeKey.value === key) {
					activeKey.value = "";
					detail.value = null;
				}
				ready();
				await loadKeys();
			} catch (e) {
				fail(e, `/ms/monitor/etcd/key?key=${key}`);
			}
		}
		/**
		* 确认并删除目录（前缀）下全部键。
		*
		* <p>对应 etcd 的 DeleteRange：后端按前缀删除，目录下的键一次性清空；删除目录就是删除
		* 其前缀下的所有键。删除后若当前选中的键落在该前缀内，需要清掉详情避免展示已删数据。</p>
		*
		* @param path 目录绝对前缀
		* @param count 目录下的键数量（仅用于确认文案）
		*/
		async function confirmDeletePrefix(path, count) {
			try {
				await ElMessageBox.confirm(`确定删除目录 ${path} 下全部 ${count} 个键吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				const deleted = await deleteEtcdKey(path, datasourceId.value, true);
				message.success(`已删除（${deleted} 个）`);
				if (activeKey.value.startsWith(path)) {
					activeKey.value = "";
					detail.value = null;
				}
				ready();
				await loadKeys();
			} catch (e) {
				fail(e, "/ms/monitor/etcd/key?prefix=true");
			}
		}
		/** 打开授予租约弹窗 */
		function openLeaseDialog() {
			leaseTtl.value = "300";
			leaseVisible.value = true;
		}
		/** 提交授予租约 */
		async function submitLease() {
			const ttl = Number(leaseTtl.value.trim());
			if (!Number.isFinite(ttl) || ttl <= 0) {
				message.warning("TTL 必须为正整数秒");
				return;
			}
			saving.value = true;
			try {
				const created = await grantEtcdLease({
					datasourceId: datasourceId.value,
					ttl
				});
				message.success(`租约已授予：${created?.id}`);
				leaseVisible.value = false;
				await switchTab("leases");
			} catch (e) {
				fail(e, "/ms/monitor/etcd/lease");
			} finally {
				saving.value = false;
			}
		}
		/**
		* 确认并撤销租约。
		*
		* @param lease 租约行
		*/
		async function confirmRevoke(lease) {
			try {
				await ElMessageBox.confirm(`确定撤销租约 ${lease.id} 吗？绑定的键会被一并删除。`, "撤销确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await revokeEtcdLease(lease.id, datasourceId.value);
				message.success("租约已撤销");
				await loadLeases();
			} catch (e) {
				fail(e, "/ms/monitor/etcd/lease");
			}
		}
		/**
		* 查看租约绑定的键。
		*
		* @param lease 租约行
		*/
		function showLeaseKeys(lease) {
			message.info(lease.keyCount ? `该租约绑定了 ${lease.keyCount} 个键` : "该租约当前没有绑定键");
		}
		/** 测试连接 */
		async function testConnection() {
			testing.value = true;
			try {
				const result = await testEtcdConnection(datasourceId.value);
				if (result?.connected) message.success(`连接成功（etcd ${result.version || "未知版本"}）`);
				else message.error(result?.message || "连接失败");
				ready();
				await loadStatus();
			} catch (e) {
				fail(e, "/ms/monitor/etcd/test");
			} finally {
				testing.value = false;
			}
		}
		/** 全量刷新 */
		async function refresh() {
			await bind("etcd");
			if (!source.value) return;
			await loadKeys();
			await loadStatus();
			if (activeTab.value === "leases") await loadLeases();
			else if (activeTab.value === "cluster") await loadMembers();
		}
		/**
		* 十六进制 ID 缩写（集群 ID 很长，页面只展示前 12 位）。
		*
		* @param id 完整 ID
		* @returns 缩写
		*/
		function shortId(id) {
			const text = String(id || "");
			return text.length > 12 ? `${text.slice(0, 12)}…` : text;
		}
		/**
		* 字节数格式化。
		*
		* @param bytes 字节
		* @returns 可读文本
		*/
		function formatBytes(bytes) {
			if (bytes == null) return "—";
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
		}
		onMounted(refresh);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["dsm tel-page", { resizing: resizing.value }]) }, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(unref(component$1), {
					name: "Coin",
					size: 18,
					class: "dsm-title-icon dsm-etcd-icon"
				}), _cache[19] || (_cache[19] = createBaseVNode("span", { class: "dsm-title" }, "etcd 配置中心管理", -1))]), createBaseVNode("div", _hoisted_3, [
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "测试连接",
						icon: "Connection",
						"data-testid": "dsm-btn-test",
						disabled: !unref(source),
						loading: testing.value,
						onClick: testConnection
					}, null, 8, ["disabled", "loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "刷新",
						icon: "Refresh",
						"data-testid": "dsm-btn-refresh",
						loading: loading.value,
						onClick: refresh
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "新建租约",
						icon: "Timer",
						"data-testid": "dsm-btn-lease",
						disabled: !unref(source),
						onClick: openLeaseDialog
					}, null, 8, ["disabled"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						tip: "新建键",
						icon: "Plus",
						"data-testid": "dsm-btn-create",
						disabled: !unref(source),
						onClick: openCreate
					}, null, 8, ["disabled"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: refresh
				}, null, 8, ["text"]),
				createBaseVNode("div", _hoisted_4, [
					createBaseVNode("div", {
						class: "dsm-sidebar",
						style: normalizeStyle({ width: leftWidth.value + "px" })
					}, [
						createBaseVNode("div", _hoisted_5, [createVNode(unref(ReInput_default), {
							modelValue: prefixFilter.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => prefixFilter.value = $event),
							placeholder: "过滤目录/键名",
							clearable: "",
							onKeyup: withKeys(loadKeys, ["enter"])
						}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: loading.value,
							onClick: loadKeys
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Search",
								size: "12"
							})]),
							default: withCtx(() => [_cache[20] || (_cache[20] = createTextVNode("查询", -1))]),
							_: 1
						}, 8, ["loading"])]),
						createBaseVNode("div", _hoisted_6, [
							createBaseVNode("span", _hoisted_7, toDisplayString(filteredFolders.value.length) + " 目录 · " + toDisplayString(filteredLeaves.value.length) + " 键", 1),
							_cache[21] || (_cache[21] = createBaseVNode("span", { class: "dsm-view-spacer" }, null, -1)),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Refresh",
								tip: "刷新",
								"data-testid": "dsm-view-refresh",
								loading: loading.value,
								onClick: loadKeys
							}, null, 8, ["loading"])
						]),
						createBaseVNode("div", _hoisted_8, [createBaseVNode("div", {
							class: normalizeClass(["dsm-scan-bar", { "is-active": loading.value }]),
							"data-testid": "dsm-scan-bar"
						}, [..._cache[22] || (_cache[22] = [createBaseVNode("span", null, null, -1)])], 2), createBaseVNode("div", _hoisted_9, [
							createBaseVNode("div", {
								class: normalizeClass(["dsm-tree-node dsm-tree-root", { active: activePrefix.value === "" }]),
								onClick: _cache[1] || (_cache[1] = ($event) => enterPrefix(""))
							}, [createVNode(unref(component$1), {
								name: "FolderOpened",
								size: "14",
								class: "dsm-tree-icon"
							}), _cache[23] || (_cache[23] = createBaseVNode("span", { class: "dsm-tree-label" }, "/ (根)", -1))], 2),
							createBaseVNode("div", _hoisted_10, toDisplayString(activePrefix.value || "/"), 1),
							(openBlock(true), createElementBlock(Fragment, null, renderList(filteredFolders.value, (folder) => {
								return openBlock(), createElementBlock("div", {
									key: "d:" + folder.path,
									class: normalizeClass(["dsm-tree-node", { active: activePrefix.value === folder.path }]),
									onClick: ($event) => enterPrefix(folder.path)
								}, [
									createVNode(unref(component$1), {
										name: "Folder",
										size: "14",
										class: "dsm-tree-icon dsm-tree-folder"
									}),
									createBaseVNode("span", _hoisted_12, toDisplayString(folder.name), 1),
									createBaseVNode("span", _hoisted_13, toDisplayString(folder.count), 1),
									createBaseVNode("div", {
										class: "dsm-row-actions",
										"data-testid": "dsm-row-actions",
										onClick: _cache[2] || (_cache[2] = withModifiers(() => {}, ["stop"]))
									}, [createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "CopyDocument",
										tip: "复制前缀",
										"data-testid": "dsm-row-copy",
										onClick: ($event) => copyKeyText(folder.path)
									}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										type: "danger",
										icon: "Delete",
										tip: "删除目录下全部键",
										"data-testid": "dsm-row-delete-dir",
										onClick: ($event) => confirmDeletePrefix(folder.path, folder.count)
									}, null, 8, ["onClick"])])
								], 10, _hoisted_11);
							}), 128)),
							(openBlock(true), createElementBlock(Fragment, null, renderList(filteredLeaves.value, (row) => {
								return openBlock(), createElementBlock("div", {
									key: "k:" + row.key,
									class: normalizeClass(["dsm-tree-node", { active: activeKey.value === row.key }]),
									onClick: ($event) => selectKey(row.key),
									onContextmenu: withModifiers(($event) => onKeyContextMenu($event, row.key), ["prevent"])
								}, [
									createVNode(unref(component$1), {
										name: "Document",
										size: "13",
										class: "dsm-tree-icon"
									}),
									createBaseVNode("span", _hoisted_15, toDisplayString(row.name), 1),
									row.lease ? (openBlock(), createElementBlock("span", {
										key: 0,
										class: "dsm-lease-tag",
										title: `绑定租约 ${row.lease}`
									}, "TTL", 8, _hoisted_16)) : createCommentVNode("", true),
									createBaseVNode("div", {
										class: "dsm-row-actions",
										"data-testid": "dsm-row-actions",
										onClick: _cache[3] || (_cache[3] = withModifiers(() => {}, ["stop"]))
									}, [createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "CopyDocument",
										tip: "复制键名",
										"data-testid": "dsm-row-copy",
										onClick: ($event) => copyKeyText(row.key)
									}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "Delete",
										tip: "删除键",
										"data-testid": "dsm-row-delete",
										onClick: ($event) => confirmDelete(row.key)
									}, null, 8, ["onClick"])])
								], 42, _hoisted_14);
							}), 128)),
							filteredFolders.value.length === 0 && filteredLeaves.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_17, [createBaseVNode("span", _hoisted_18, toDisplayString(unref(gap) ? "未读取到键" : prefixFilter.value ? "无匹配目录/键" : "该前缀下暂无键"), 1)])) : createCommentVNode("", true)
						])])
					], 4),
					createBaseVNode("div", {
						class: normalizeClass(["dsm-split", { active: resizing.value }]),
						title: "拖拽调节宽度",
						onMousedown: withModifiers(startResize, ["prevent"])
					}, null, 34),
					createBaseVNode("div", _hoisted_19, [
						createBaseVNode("div", _hoisted_20, [
							createBaseVNode("div", _hoisted_21, [_cache[24] || (_cache[24] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_22, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
							createBaseVNode("div", _hoisted_23, [_cache[25] || (_cache[25] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_24, toDisplayString(unref(source) ? `${unref(source).host}:${unref(source).port || 2379}` : "—"), 1)]),
							createBaseVNode("div", _hoisted_25, [_cache[26] || (_cache[26] = createBaseVNode("span", { class: "dsm-info-label" }, "当前前缀", -1)), createBaseVNode("span", _hoisted_26, toDisplayString(activePrefix.value || "/"), 1)]),
							createBaseVNode("div", _hoisted_27, [_cache[27] || (_cache[27] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
								_: 1
							}, 8, ["type"])]),
							createBaseVNode("div", _hoisted_28, [_cache[28] || (_cache[28] = createBaseVNode("span", { class: "dsm-info-label" }, "服务端版本", -1)), createBaseVNode("span", _hoisted_29, toDisplayString(status.value.version || "未探测"), 1)]),
							createBaseVNode("div", _hoisted_30, [_cache[29] || (_cache[29] = createBaseVNode("span", { class: "dsm-info-label" }, "当前 revision", -1)), createBaseVNode("span", _hoisted_31, toDisplayString(status.value.revision ?? "—"), 1)])
						]),
						createBaseVNode("div", _hoisted_32, [
							createBaseVNode("div", {
								class: normalizeClass(["dsm-tab", { active: activeTab.value === "keys" }]),
								onClick: _cache[4] || (_cache[4] = ($event) => activeTab.value = "keys")
							}, "键", 2),
							createBaseVNode("div", {
								class: normalizeClass(["dsm-tab", { active: activeTab.value === "leases" }]),
								onClick: _cache[5] || (_cache[5] = ($event) => switchTab("leases"))
							}, "租约", 2),
							createBaseVNode("div", {
								class: normalizeClass(["dsm-tab", { active: activeTab.value === "cluster" }]),
								onClick: _cache[6] || (_cache[6] = ($event) => switchTab("cluster"))
							}, "集群", 2)
						]),
						activeTab.value === "keys" ? (openBlock(), createElementBlock("div", _hoisted_33, [createBaseVNode("div", _hoisted_34, [createTextVNode(" 键列表 - " + toDisplayString(activePrefix.value || "/") + "（" + toDisplayString(keys.value.length) + "） ", 1), createBaseVNode("div", _hoisted_35, [activePrefix.value ? (openBlock(), createBlock(unref(ReButton_default), {
							key: 0,
							text: "",
							onClick: _cache[7] || (_cache[7] = ($event) => enterPrefix(parentOf(activePrefix.value)))
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "ArrowUp",
								size: "12"
							})]),
							default: withCtx(() => [_cache[30] || (_cache[30] = createTextVNode("上一层", -1))]),
							_: 1
						})) : createCommentVNode("", true), createVNode(unref(ReButton_default), {
							text: "",
							onClick: loadKeys
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Refresh",
								size: "12"
							})]),
							default: withCtx(() => [_cache[31] || (_cache[31] = createTextVNode("刷新", -1))]),
							_: 1
						})])]), createVNode(unref(ReTable_default), {
							data: keyRows.value,
							columns: keyColumns,
							loading: loading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "360px",
							"context-menu": keyTableMenu,
							onContextMenuSelect: onKeyTableMenuSelect
						}, {
							"col-key": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
								text: "",
								type: "primary",
								onClick: ($event) => selectKey(row.key)
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.key), 1)]),
								_: 2
							}, 1032, ["onClick"])]),
							"col-lease": withCtx(({ row }) => [row.lease ? (openBlock(), createBlock(unref(component$2), {
								key: 0,
								type: "warning"
							}, {
								default: withCtx(() => [createTextVNode("TTL " + toDisplayString(row.lease), 1)]),
								_: 2
							}, 1024)) : (openBlock(), createElementBlock("span", _hoisted_36, "—"))]),
							"col-actions": withCtx(({ row }) => [
								createVNode(unref(ReButton_default), {
									text: "",
									onClick: ($event) => openDetail(row.key)
								}, {
									default: withCtx(() => [..._cache[32] || (_cache[32] = [createTextVNode("查看", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									text: "",
									type: "primary",
									onClick: ($event) => openEdit(row.key)
								}, {
									default: withCtx(() => [..._cache[33] || (_cache[33] = [createTextVNode("编辑", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									text: "",
									type: "danger",
									onClick: ($event) => confirmDelete(row.key)
								}, {
									default: withCtx(() => [..._cache[34] || (_cache[34] = [createTextVNode("删除", -1)])]),
									_: 1
								}, 8, ["onClick"])
							]),
							_: 1
						}, 8, ["data", "loading"])])) : createCommentVNode("", true),
						activeTab.value === "keys" && activeKey.value ? (openBlock(), createElementBlock("div", _hoisted_37, [createBaseVNode("div", _hoisted_38, [createTextVNode(" 键详情 - " + toDisplayString(activeKey.value) + " ", 1), createBaseVNode("div", _hoisted_39, [createVNode(unref(ReButton_default), {
							text: "",
							type: "primary",
							disabled: !detail.value,
							onClick: _cache[8] || (_cache[8] = ($event) => openEdit(activeKey.value))
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Edit",
								size: "12"
							})]),
							default: withCtx(() => [_cache[35] || (_cache[35] = createTextVNode("编辑", -1))]),
							_: 1
						}, 8, ["disabled"]), createVNode(unref(ReButton_default), {
							text: "",
							type: "danger",
							disabled: !detail.value,
							onClick: _cache[9] || (_cache[9] = ($event) => confirmDelete(activeKey.value))
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Delete",
								size: "12"
							})]),
							default: withCtx(() => [_cache[36] || (_cache[36] = createTextVNode("删除", -1))]),
							_: 1
						}, 8, ["disabled"])])]), detail.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_40, [
							createBaseVNode("div", _hoisted_41, [_cache[37] || (_cache[37] = createBaseVNode("span", { class: "dsm-detail-label" }, "创建 revision", -1)), createBaseVNode("span", _hoisted_42, toDisplayString(detail.value.createRevision ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_43, [_cache[38] || (_cache[38] = createBaseVNode("span", { class: "dsm-detail-label" }, "修改 revision", -1)), createBaseVNode("span", _hoisted_44, toDisplayString(detail.value.modRevision ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_45, [_cache[39] || (_cache[39] = createBaseVNode("span", { class: "dsm-detail-label" }, "键版本 (version)", -1)), createBaseVNode("span", _hoisted_46, toDisplayString(detail.value.version ?? "—"), 1)]),
							createBaseVNode("div", _hoisted_47, [_cache[40] || (_cache[40] = createBaseVNode("span", { class: "dsm-detail-label" }, "绑定租约", -1)), createBaseVNode("span", _hoisted_48, toDisplayString(detail.value.lease || "未绑定"), 1)]),
							createBaseVNode("div", _hoisted_49, [_cache[41] || (_cache[41] = createBaseVNode("span", { class: "dsm-detail-label" }, "剩余 TTL", -1)), createBaseVNode("span", _hoisted_50, toDisplayString(detail.value.ttlSeconds == null ? "—" : detail.value.ttlSeconds + " 秒"), 1)]),
							createBaseVNode("div", _hoisted_51, [_cache[42] || (_cache[42] = createBaseVNode("span", { class: "dsm-detail-label" }, "值长度", -1)), createBaseVNode("span", _hoisted_52, toDisplayString(detail.value.valueLength) + " 字节", 1)])
						]), createBaseVNode("div", _hoisted_53, [createBaseVNode("div", _hoisted_54, "值" + toDisplayString(detail.value.binary ? "（二进制）" : ""), 1), createBaseVNode("pre", _hoisted_55, toDisplayString(detail.value.value), 1)])], 64)) : (openBlock(), createElementBlock("div", _hoisted_56, "正在读取…"))])) : createCommentVNode("", true),
						activeTab.value === "leases" ? (openBlock(), createElementBlock("div", _hoisted_57, [createBaseVNode("div", _hoisted_58, [createTextVNode(" 租约（" + toDisplayString(leases.value.length) + "） ", 1), createBaseVNode("div", _hoisted_59, [createVNode(unref(ReButton_default), {
							text: "",
							onClick: loadLeases
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Refresh",
								size: "12"
							})]),
							default: withCtx(() => [_cache[43] || (_cache[43] = createTextVNode("刷新", -1))]),
							_: 1
						})])]), createVNode(unref(ReTable_default), {
							data: leases.value,
							columns: leaseColumns,
							loading: loading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "360px"
						}, {
							"col-leaseId": withCtx(({ row }) => [createBaseVNode("span", _hoisted_60, toDisplayString(row.id), 1)]),
							"col-ttl": withCtx(({ row }) => [createVNode(unref(component$2), { type: "warning" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.ttl ?? "—") + " / " + toDisplayString(row.grantedTtl ?? "—") + " 秒", 1)]),
								_: 2
							}, 1024)]),
							"col-actions": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
								text: "",
								onClick: ($event) => showLeaseKeys(row)
							}, {
								default: withCtx(() => [..._cache[44] || (_cache[44] = [createTextVNode("查看键", -1)])]),
								_: 1
							}, 8, ["onClick"]), createVNode(unref(ReButton_default), {
								text: "",
								type: "danger",
								onClick: ($event) => confirmRevoke(row)
							}, {
								default: withCtx(() => [..._cache[45] || (_cache[45] = [createTextVNode("撤销", -1)])]),
								_: 1
							}, 8, ["onClick"])]),
							_: 1
						}, 8, ["data", "loading"])])) : createCommentVNode("", true),
						activeTab.value === "cluster" ? (openBlock(), createElementBlock("div", _hoisted_61, [
							createBaseVNode("div", _hoisted_62, [createTextVNode(" 集群成员（" + toDisplayString(members.value.length) + "） ", 1), createBaseVNode("div", _hoisted_63, [createVNode(unref(ReButton_default), {
								text: "",
								onClick: loadMembers
							}, {
								icon: withCtx(() => [createVNode(unref(component$1), {
									name: "Refresh",
									size: "12"
								})]),
								default: withCtx(() => [_cache[46] || (_cache[46] = createTextVNode("刷新", -1))]),
								_: 1
							})])]),
							createVNode(unref(ReTable_default), {
								data: members.value,
								columns: memberColumns,
								loading: loading.value,
								pagination: false,
								stripe: "",
								border: "",
								height: "260px"
							}, {
								"col-memberId": withCtx(({ row }) => [createBaseVNode("span", _hoisted_64, toDisplayString(shortId(row.id)), 1)]),
								"col-role": withCtx(({ row }) => [row.leader ? (openBlock(), createBlock(unref(component$2), {
									key: 0,
									type: "warning"
								}, {
									default: withCtx(() => [..._cache[47] || (_cache[47] = [createTextVNode("Leader", -1)])]),
									_: 1
								})) : (openBlock(), createElementBlock("span", _hoisted_65, "Follower"))]),
								"col-healthy": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.healthy ? "success" : "danger" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(row.healthy ? "健康" : "不可达"), 1)]),
									_: 2
								}, 1032, ["type"])]),
								_: 1
							}, 8, ["data", "loading"]),
							createBaseVNode("div", _hoisted_66, [
								createBaseVNode("div", _hoisted_67, [_cache[48] || (_cache[48] = createBaseVNode("span", { class: "dsm-detail-label" }, "etcd 版本", -1)), createBaseVNode("span", _hoisted_68, toDisplayString(status.value.version || "—"), 1)]),
								createBaseVNode("div", _hoisted_69, [_cache[49] || (_cache[49] = createBaseVNode("span", { class: "dsm-detail-label" }, "leader", -1)), createBaseVNode("span", _hoisted_70, toDisplayString(shortId(status.value.leader) || "—"), 1)]),
								createBaseVNode("div", _hoisted_71, [_cache[50] || (_cache[50] = createBaseVNode("span", { class: "dsm-detail-label" }, "数据文件大小", -1)), createBaseVNode("span", _hoisted_72, toDisplayString(formatBytes(status.value.dbSize)), 1)]),
								createBaseVNode("div", _hoisted_73, [_cache[51] || (_cache[51] = createBaseVNode("span", { class: "dsm-detail-label" }, "实际使用", -1)), createBaseVNode("span", _hoisted_74, toDisplayString(formatBytes(status.value.dbSizeInUse)), 1)]),
								createBaseVNode("div", _hoisted_75, [_cache[52] || (_cache[52] = createBaseVNode("span", { class: "dsm-detail-label" }, "raft index / term", -1)), createBaseVNode("span", _hoisted_76, toDisplayString(status.value.raftIndex ?? "—") + " / " + toDisplayString(status.value.raftTerm ?? "—"), 1)])
							])
						])) : createCommentVNode("", true)
					])
				]),
				createVNode(unref(component), {
					modelValue: keyVisible.value,
					"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => keyVisible.value = $event),
					title: keyDialogMode.value === "create" ? "新建键" : keyDialogMode.value === "edit" ? "编辑键" : "键详情",
					width: "680px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[13] || (_cache[13] = ($event) => keyVisible.value = false) }, {
						default: withCtx(() => [createTextVNode(toDisplayString(keyDialogMode.value === "view" ? "关闭" : "取消"), 1)]),
						_: 1
					}), keyDialogMode.value !== "view" ? (openBlock(), createBlock(unref(ReButton_default), {
						key: 0,
						type: "primary",
						loading: saving.value,
						onClick: submitKey
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [createTextVNode(toDisplayString(keyDialogMode.value === "create" ? "创建" : "保存"), 1)]),
						_: 1
					}, 8, ["loading"])) : createCommentVNode("", true)]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_77, [
						createBaseVNode("div", _hoisted_78, [
							_cache[53] || (_cache[53] = createBaseVNode("label", null, "键名", -1)),
							createVNode(unref(ReInput_default), {
								modelValue: form.key,
								"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.key = $event),
								disabled: keyDialogMode.value !== "create",
								placeholder: "如 /config/app/name"
							}, null, 8, ["modelValue", "disabled"]),
							_cache[54] || (_cache[54] = createBaseVNode("span", { class: "dsm-form-hint" }, "etcd 的键用 / 分层，请填完整键名（不是前缀）", -1))
						]),
						createBaseVNode("div", _hoisted_79, [_cache[55] || (_cache[55] = createBaseVNode("label", null, "值", -1)), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.value = $event),
							class: "dsm-node-data",
							rows: "10",
							disabled: keyDialogMode.value === "view",
							placeholder: "UTF-8 文本"
						}, null, 8, _hoisted_80), [[vModelText, form.value]])]),
						createBaseVNode("div", _hoisted_81, [
							_cache[56] || (_cache[56] = createBaseVNode("label", null, "绑定租约（可选）", -1)),
							createVNode(unref(ReInput_default), {
								modelValue: form.lease,
								"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.lease = $event),
								disabled: keyDialogMode.value === "view",
								placeholder: "租约 ID；留空表示不绑定"
							}, null, 8, ["modelValue", "disabled"]),
							_cache[57] || (_cache[57] = createBaseVNode("span", { class: "dsm-form-hint" }, "绑定租约的键会在租约到期时被自动删除（相当于 ZooKeeper 的临时节点）", -1))
						])
					])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: leaseVisible.value,
					"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => leaseVisible.value = $event),
					title: "新建租约",
					width: "440px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[16] || (_cache[16] = ($event) => leaseVisible.value = false) }, {
						default: withCtx(() => [..._cache[60] || (_cache[60] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: saving.value,
						onClick: submitLease
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [_cache[61] || (_cache[61] = createTextVNode("授予", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_82, [createBaseVNode("div", _hoisted_83, [
						_cache[58] || (_cache[58] = createBaseVNode("label", null, "TTL（秒）", -1)),
						createVNode(unref(ReInput_default), {
							modelValue: leaseTtl.value,
							"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => leaseTtl.value = $event),
							placeholder: "如 300"
						}, null, 8, ["modelValue"]),
						_cache[59] || (_cache[59] = createBaseVNode("span", { class: "dsm-form-hint" }, "授予后可用租约 ID 绑定键；到期键自动删除", -1))
					])])]),
					_: 1
				}, 8, ["modelValue"]),
				createVNode(DsmContextMenu_default, {
					visible: keyMenu.visible,
					"onUpdate:visible": _cache[18] || (_cache[18] = ($event) => keyMenu.visible = $event),
					x: keyMenu.x,
					y: keyMenu.y,
					items: keyMenuItems,
					onSelect: onKeyMenuSelect
				}, null, 8, [
					"visible",
					"x",
					"y"
				])
			], 2);
		};
	}
}), [["__scopeId", "data-v-dbe15e47"]]);
//#endregion
export { EtcdManageView_default as default };
