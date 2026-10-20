import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { A as fetchNacosServices, D as fetchNacosConfigDetail, E as fetchNacosClusterNodes, H as saveNacosConfig, O as fetchNacosConfigs, W as testNacosConnection, k as fetchNacosNamespaces, u as deleteNacosConfig } from "./manageConsoles-BaCEHWGA.js";
import { f as ReOption } from "./ReKit-CFSh6vls.js";
import { M as view_default, d as copy_document_default, f as delete_default, m as edit_default, p as download_default } from "./dist-Axt1Prff.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as DsmContextMenu_default } from "./DsmContextMenu-BEoagIWo.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
import { c as updateNacosNamespace, i as fetchNacosInstances, n as deleteNacosNamespace, s as updateNacosInstance, t as createNacosNamespace } from "./zkNacosApi-BVVbKaSO.js";
//#region ../../pages/datasource/src/views/console/NacosManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm-toolbar re-surface" };
var _hoisted_2 = { class: "dsm-toolbar-left" };
var _hoisted_3 = { class: "dsm-toolbar-right" };
var _hoisted_4 = { class: "dsm-body" };
var _hoisted_5 = { class: "dsm-search-section" };
var _hoisted_6 = { class: "dsm-view-bar" };
var _hoisted_7 = { class: "dsm-view-count" };
var _hoisted_8 = { class: "dsm-key-list" };
var _hoisted_9 = { class: "dsm-tree" };
var _hoisted_10 = { class: "dsm-tree-label" };
var _hoisted_11 = {
	key: 0,
	class: "dsm-tree-children"
};
var _hoisted_12 = { class: "dsm-tree-count" };
var _hoisted_13 = {
	key: 0,
	class: "dsm-tree-children"
};
var _hoisted_14 = ["onClick", "onContextmenu"];
var _hoisted_15 = { class: "dsm-tree-label" };
var _hoisted_16 = { class: "dsm-tree-count" };
var _hoisted_17 = {
	key: 0,
	class: "dsm-tree-node dsm-leaf-node"
};
var _hoisted_18 = { class: "dsm-tree-label" };
var _hoisted_19 = { class: "dsm-tree-count" };
var _hoisted_20 = { class: "dsm-tree-count" };
var _hoisted_21 = { class: "dsm-content" };
var _hoisted_22 = { class: "dsm-info-card re-surface" };
var _hoisted_23 = { class: "dsm-info-row" };
var _hoisted_24 = { class: "dsm-info-value" };
var _hoisted_25 = { class: "dsm-info-row" };
var _hoisted_26 = { class: "dsm-info-value mono" };
var _hoisted_27 = { class: "dsm-info-row" };
var _hoisted_28 = { class: "dsm-info-value" };
var _hoisted_29 = { class: "dsm-info-row" };
var _hoisted_30 = { class: "dsm-info-status" };
var _hoisted_31 = { class: "dsm-info-sub" };
var _hoisted_32 = {
	key: 0,
	class: "dsm-section"
};
var _hoisted_33 = { class: "dsm-section-title" };
var _hoisted_34 = { class: "dsm-section-actions" };
var _hoisted_35 = {
	key: 1,
	class: "dsm-section"
};
var _hoisted_36 = {
	key: 2,
	class: "dsm-section"
};
var _hoisted_37 = { key: 1 };
var _hoisted_38 = { class: "dsm-config-form" };
var _hoisted_39 = { class: "dsm-form-row" };
var _hoisted_40 = { class: "dsm-form-item" };
var _hoisted_41 = { class: "dsm-form-item" };
var _hoisted_42 = { class: "dsm-form-item" };
var _hoisted_43 = { class: "dsm-form-item" };
var _hoisted_44 = ["disabled", "placeholder"];
var _hoisted_45 = {
	key: 0,
	class: "dsm-form-item"
};
var _hoisted_46 = { class: "dsm-config-form" };
var _hoisted_47 = { class: "dsm-form-item" };
var _hoisted_48 = { class: "dsm-form-item" };
var _hoisted_49 = { class: "dsm-form-item" };
var LEFT_WIDTH_KEY = "nacos-side-width";
//#endregion
//#region ../../pages/datasource/src/views/console/NacosManageView.vue
var NacosManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NacosManageView",
	setup(__props) {
		/**
		* Nacos 配置中心管理页
		*
		* <p>基于「数据源管理」登记的 nacos 数据源，通过后端 nacos 管理接口读取真实的命名空间、配置、
		* 服务与集群节点，配置的查看/新建/编辑/删除/克隆/导出走同一组接口；接口缺失或连接失败时只展示
		* 失败原因，不回落任何演示数据。</p>
		* @author CH
		* @since 4.0.0
		*/
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		/** 侧栏根节点名称：真实数据源名 */
		const connectionName = computed(() => source.value ? source.value.name : "Nacos 配置中心");
		const expandedNodes = ref(/* @__PURE__ */ new Set(["root", "ns"]));
		/** 选中的命名空间 ID（public 为默认命名空间） */
		const activeNs = ref("public");
		const activeView = ref("configs");
		const loading = ref(false);
		/** 侧栏宽度持久化键（nacos 独立于 redis/etcd 等控制台） */
		const leftWidth = ref(Math.min(560, Math.max(260, Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340)));
		/** 是否正在拖拽（拖拽中禁用文本选择） */
		const resizing = ref(false);
		/**
		* 开始拖拽调节左侧宽度（Redis 同形态）。
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
		const saving = ref(false);
		const testing = ref(false);
		/** 测试连接探测到的 Nacos 版本，未探测为空串 */
		const nacosVersion = ref("");
		const searchKeyword = ref("");
		/** 命名空间行 */
		const namespaces = ref([]);
		/** 侧栏搜索词：仅过滤命名空间树（配置列表另有 Data ID 过滤框，互不干扰） */
		const sidebarKeyword = ref("");
		const filteredNamespaces = computed(() => {
			const kw = sidebarKeyword.value.trim().toLowerCase();
			if (!kw) return namespaces.value;
			return namespaces.value.filter((ns) => String(ns.name || "").toLowerCase().includes(kw) || String(ns.id || "").toLowerCase().includes(kw));
		});
		const configs = ref([]);
		const services = ref([]);
		const clusters = ref([]);
		const configTotal = ref(0);
		const configPage = ref(1);
		const configPageSize = ref(10);
		const configColumns = [
			{
				prop: "dataId",
				label: "Data ID",
				minWidth: 200
			},
			{
				prop: "group",
				label: "Group",
				width: 140
			},
			{
				prop: "format",
				label: "格式",
				width: 100
			},
			{
				prop: "updatedAt",
				label: "更新时间",
				width: 180
			},
			{
				prop: "actions",
				label: "操作",
				width: 180,
				fixed: "right",
				slot: "actions"
			}
		];
		const serviceColumns = [
			{
				prop: "name",
				label: "服务名",
				minWidth: 180,
				slot: "name"
			},
			{
				prop: "clusterCount",
				label: "集群数",
				width: 100
			},
			{
				prop: "healthyInstanceCount",
				label: "健康实例",
				width: 110
			},
			{
				prop: "unhealthyInstanceCount",
				label: "不健康实例",
				width: 120
			},
			{
				prop: "triggerFlag",
				label: "健康检查",
				width: 110
			}
		];
		const clusterColumns = [
			{
				prop: "ip",
				label: "节点地址",
				minWidth: 170
			},
			{
				prop: "port",
				label: "端口",
				width: 90
			},
			{
				prop: "status",
				label: "状态",
				width: 100,
				slot: "status"
			},
			{
				prop: "role",
				label: "角色",
				width: 110,
				slot: "role"
			},
			{
				prop: "leader",
				label: "Leader",
				width: 100,
				slot: "leader"
			},
			{
				prop: "weight",
				label: "权重",
				width: 90
			}
		];
		const activeNsName = computed(() => namespaces.value.find((n) => n.id === activeNs.value)?.name || activeNs.value || "public");
		/** 配置行右键菜单，由 ReTable 内置菜单渲染（第九批统一 zk 样式 + 逐项图标） */
		const configMenu = [
			{
				key: "view",
				label: "查看配置",
				icon: view_default
			},
			{
				key: "edit",
				label: "编辑配置",
				icon: edit_default
			},
			{
				key: "clone",
				label: "克隆配置",
				icon: copy_document_default
			},
			{
				key: "export",
				label: "导出配置",
				icon: download_default
			},
			{
				key: "delete",
				label: "删除配置",
				icon: delete_default,
				divided: true
			}
		];
		const configVisible = ref(false);
		const dialogMode = ref("view");
		const dialogTitle = computed(() => dialogMode.value === "create" ? "新建配置" : dialogMode.value === "edit" ? "编辑配置" : "查看配置");
		const contentHint = ref("");
		const form = reactive({
			dataId: "",
			group: "DEFAULT_GROUP",
			format: "yaml",
			content: "",
			betaIps: ""
		});
		/** 命名空间新建/编辑弹窗状态 */
		const nsDialogVisible = ref(false);
		const nsDialogMode = ref("create");
		const nsSaving = ref(false);
		const nsForm = reactive({
			namespaceId: "",
			namespaceName: "",
			namespaceDesc: ""
		});
		/** 命名空间行右键菜单（第九批统一 zk 模板） */
		const nsMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			key: ""
		});
		const nsMenuItems = computed(() => [
			{
				key: "copy",
				label: "复制命名空间 ID",
				icon: "Document"
			},
			{
				key: "edit",
				label: "编辑命名空间",
				icon: "Edit"
			},
			{
				key: "delete",
				label: "删除命名空间",
				icon: "Delete",
				danger: true,
				divided: true,
				disabled: !nsMenu.key || nsMenu.key === "public"
			}
		]);
		/** 打开命名空间行右键菜单 */
		function onNsContextMenu(e, id) {
			Object.assign(nsMenu, {
				visible: true,
				x: e.clientX,
				y: e.clientY,
				key: id
			});
		}
		/** 菜单动作分发 */
		async function onNsMenuSelect(key) {
			const id = nsMenu.key;
			if (!id) return;
			if (key === "copy") {
				if (await copyToClipboard(id)) message.success("已复制命名空间 ID");
				else message.error("复制失败");
				return;
			}
			activeNs.value = id;
			if (key === "edit") openNamespaceDialog("edit");
			if (key === "delete") removeNamespace();
		}
		/** 公有命名空间不可编辑/删除 */
		const canEditNamespace = computed(() => {
			const id = activeNs.value;
			return !!id && id !== "public" && id !== "";
		});
		/** 实例管理弹窗状态 */
		const instanceVisible = ref(false);
		const instanceLoading = ref(false);
		const instances = ref([]);
		const currentService = ref(null);
		const instanceColumns = [
			{
				prop: "ip",
				label: "IP",
				minWidth: 130
			},
			{
				prop: "port",
				label: "端口",
				width: 80
			},
			{
				prop: "weight",
				label: "权重",
				width: 80
			},
			{
				prop: "healthy",
				label: "健康",
				width: 90,
				slot: "healthy"
			},
			{
				prop: "enabled",
				label: "状态",
				width: 90,
				slot: "enabled"
			},
			{
				prop: "ephemeral",
				label: "临时",
				width: 80
			},
			{
				prop: "clusterName",
				label: "集群",
				width: 110
			},
			{
				prop: "actions",
				label: "操作",
				width: 220,
				fixed: "right",
				slot: "actions"
			}
		];
		/**
		* 加载命名空间列表
		*/
		async function loadNamespaces() {
			try {
				const data = await fetchNacosNamespaces(datasourceId.value);
				namespaces.value = (data || []).map((n) => ({
					id: n.id || n.namespace || "public",
					name: n.name || n.namespace || "public",
					configCount: n.configCount ?? 0
				}));
				if (namespaces.value.length > 0 && !namespaces.value.some((n) => n.id === activeNs.value)) activeNs.value = namespaces.value[0].id;
				ready();
			} catch (e) {
				namespaces.value = [];
				fail(e, "/ms/monitor/nacos/namespaces");
			}
		}
		/**
		* 分页加载当前命名空间下的配置列表
		*/
		async function loadConfigs() {
			loading.value = true;
			try {
				const data = await fetchNacosConfigs({
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					dataId: searchKeyword.value || void 0,
					page: configPage.value,
					pageSize: configPageSize.value
				});
				configs.value = data?.list || [];
				configTotal.value = data?.total ?? configs.value.length;
				ready();
			} catch (e) {
				configs.value = [];
				configTotal.value = 0;
				fail(e, "/ms/monitor/nacos/configs");
			} finally {
				loading.value = false;
			}
		}
		/**
		* 加载当前命名空间下的服务列表
		*/
		async function loadServices() {
			if (!datasourceId.value) return;
			try {
				services.value = await fetchNacosServices(datasourceId.value, activeNs.value) || [];
				ready();
			} catch (e) {
				services.value = [];
				fail(e, "/ms/monitor/nacos/services");
			}
		}
		/**
		* 加载集群节点列表
		*/
		async function loadClusters() {
			if (!datasourceId.value) return;
			try {
				clusters.value = await fetchNacosClusterNodes(datasourceId.value) || [];
				ready();
			} catch (e) {
				clusters.value = [];
				fail(e, "/ms/monitor/nacos/cluster/nodes");
			}
		}
		/**
		* 重新加载本页全部数据
		*/
		async function reloadAll() {
			if (!source.value) {
				await bind("nacos");
				if (!source.value) return;
			}
			await Promise.all([
				loadNamespaces(),
				loadConfigs(),
				loadServices(),
				loadClusters()
			]);
		}
		/**
		* 探测当前数据源的 Nacos 连通性并显示版本
		*/
		async function testConnection() {
			testing.value = true;
			try {
				const result = await testNacosConnection({ datasourceId: datasourceId.value });
				if (result?.connected) {
					nacosVersion.value = result.version || "";
					ready();
					message.success(result.version ? `连接成功 · Nacos ${result.version}` : "连接成功");
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				fail(e, "/ms/monitor/nacos/test");
			} finally {
				testing.value = false;
			}
		}
		/**
		* 展开/收起侧栏树节点
		* @param key 节点键
		*/
		function toggleNode(key) {
			if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
			else expandedNodes.value.add(key);
		}
		/**
		* 切换命名空间
		* @param id 命名空间 ID
		*/
		function selectNs(id) {
			activeNs.value = id;
			configPage.value = 1;
			loadConfigs();
			loadServices();
		}
		/**
		* 读取配置详情并打开弹窗
		* @param row 配置行
		* @param mode 弹窗模式
		*/
		async function openConfigDialog(row, mode) {
			dialogMode.value = mode;
			Object.assign(form, {
				dataId: row.dataId,
				group: row.group,
				format: row.format || "yaml",
				content: "",
				betaIps: ""
			});
			contentHint.value = "正在读取配置内容…";
			configVisible.value = true;
			try {
				const detail = await fetchNacosConfigDetail(row.dataId, {
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					group: row.group
				});
				form.content = detail?.content ?? "";
				form.format = detail?.format || form.format;
				contentHint.value = "";
				ready();
			} catch (e) {
				contentHint.value = `配置内容读取失败：${String(e?.message ?? e)}`;
				fail(e, `/ms/monitor/nacos/config?dataId=${row.dataId}`);
			}
		}
		/**
		* 查看配置
		* @param row 配置行
		*/
		function viewConfig(row) {
			openConfigDialog(row, "view");
		}
		/**
		* 编辑配置
		* @param row 配置行
		*/
		function editConfig(row) {
			openConfigDialog(row, "edit");
		}
		/**
		* 打开新建配置弹窗
		*/
		function openCreate() {
			dialogMode.value = "create";
			Object.assign(form, {
				dataId: "",
				group: "DEFAULT_GROUP",
				format: "yaml",
				content: "",
				betaIps: ""
			});
			contentHint.value = "";
			configVisible.value = true;
		}
		/**
		* 发布配置（新建或更新）
		*/
		async function saveConfig() {
			if (!form.dataId.trim()) {
				message.warning("Data ID 不能为空");
				return;
			}
			if (!form.content.trim()) {
				message.warning("配置内容不能为空");
				return;
			}
			saving.value = true;
			try {
				await saveNacosConfig({
					datasourceId: datasourceId.value,
					dataId: form.dataId.trim(),
					group: form.group,
					format: form.format,
					namespace: activeNs.value,
					content: form.content,
					betaIps: form.betaIps.trim() || void 0
				});
				message.success(form.betaIps.trim() ? "Beta 发布完成" : dialogMode.value === "create" ? "配置已创建" : "配置已发布");
				configVisible.value = false;
				ready();
				await Promise.all([loadConfigs(), loadNamespaces()]);
			} catch (e) {
				fail(e, "/ms/monitor/nacos/config");
			} finally {
				saving.value = false;
			}
		}
		/**
		* 删除配置
		* @param row 配置行
		*/
		async function deleteConfig(row) {
			try {
				await ElMessageBox.confirm(`确定删除配置 ${row.dataId}（${row.group}）吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deleteNacosConfig(row.dataId, {
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					group: row.group
				});
				message.success("配置已删除");
				ready();
				await Promise.all([loadConfigs(), loadNamespaces()]);
			} catch (e) {
				fail(e, `/ms/monitor/nacos/config?dataId=${row.dataId}`);
			}
		}
		/**
		* 打开新建/编辑命名空间弹窗
		* @param mode 弹窗模式
		*/
		function openNamespaceDialog(mode) {
			nsDialogMode.value = mode;
			if (mode === "create") Object.assign(nsForm, {
				namespaceId: "",
				namespaceName: "",
				namespaceDesc: ""
			});
			else {
				const ns = namespaces.value.find((n) => n.id === activeNs.value);
				Object.assign(nsForm, {
					namespaceId: activeNs.value,
					namespaceName: ns?.name || "",
					namespaceDesc: ""
				});
			}
			nsDialogVisible.value = true;
		}
		/**
		* 保存命名空间（新建或编辑）
		*/
		async function saveNamespace() {
			if (!nsForm.namespaceName.trim()) {
				message.warning("命名空间名称不能为空");
				return;
			}
			nsSaving.value = true;
			try {
				const payload = {
					datasourceId: datasourceId.value,
					namespaceId: nsForm.namespaceId.trim() || void 0,
					namespaceName: nsForm.namespaceName.trim(),
					namespaceDesc: nsForm.namespaceDesc.trim()
				};
				if (nsDialogMode.value === "create") {
					await createNacosNamespace(payload);
					message.success("命名空间已创建");
				} else {
					await updateNacosNamespace(payload);
					message.success("命名空间已更新");
				}
				nsDialogVisible.value = false;
				ready();
				await loadNamespaces();
			} catch (e) {
				fail(e, "/ms/monitor/nacos/namespace");
			} finally {
				nsSaving.value = false;
			}
		}
		/**
		* 删除当前命名空间（二次确认）
		*/
		async function removeNamespace() {
			const id = activeNs.value;
			if (!id || id === "public") return;
			try {
				await ElMessageBox.confirm(`确定删除命名空间 ${id} 吗？其下配置将一并删除，不可恢复！`, "删除命名空间", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deleteNacosNamespace(id, datasourceId.value);
				message.success("命名空间已删除");
				ready();
				activeNs.value = "public";
				await loadNamespaces();
				await Promise.all([loadConfigs(), loadServices()]);
			} catch (e) {
				fail(e, "/ms/monitor/nacos/namespace");
			}
		}
		/**
		* 打开服务实例弹窗并加载实例列表
		* @param service 服务行
		*/
		async function openInstances(service) {
			currentService.value = service;
			instanceVisible.value = true;
			instances.value = [];
			instanceLoading.value = true;
			try {
				instances.value = await fetchNacosInstances({
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					serviceName: service.name
				}) || [];
				ready();
			} catch (e) {
				instances.value = [];
				fail(e, "/ms/monitor/nacos/service/instances");
			} finally {
				instanceLoading.value = false;
			}
		}
		/**
		* 上下线实例
		* @param inst 实例行
		*/
		async function toggleInstance(inst) {
			try {
				await updateNacosInstance({
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					serviceName: currentService.value?.name || "",
					ip: inst.ip,
					port: inst.port,
					enabled: !inst.enabled
				});
				message.success(inst.enabled ? "实例已下线" : "实例已上线");
				ready();
				await openInstances(currentService.value);
				await loadServices();
			} catch (e) {
				fail(e, "/ms/monitor/nacos/service/instance");
			}
		}
		/**
		* 弹窗修改实例权重
		* @param inst 实例行
		*/
		async function editWeight(inst) {
			let weight = String(inst.weight ?? 1);
			try {
				const input = await ElMessageBox.prompt(`修改 ${inst.ip}:${inst.port} 的权重（0-10000）`, "修改权重", {
					inputValue: weight,
					inputValidator: (v) => {
						const n = Number(v);
						return Number.isFinite(n) && n >= 0 && n <= 1e4 ? true : "权重需为 0-10000 的数字";
					}
				});
				weight = String(input.value || "");
			} catch {
				return;
			}
			try {
				await updateNacosInstance({
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					serviceName: currentService.value?.name || "",
					ip: inst.ip,
					port: inst.port,
					weight: Number(weight)
				});
				message.success("权重已更新");
				ready();
				await openInstances(currentService.value);
			} catch (e) {
				fail(e, "/ms/monitor/nacos/service/instance");
			}
		}
		/**
		* 查看实例元数据
		* @param inst 实例行
		*/
		function viewMetadata(inst) {
			const meta = inst.metadata || {};
			const text = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "(无元数据)";
			ElMessageBox.alert(`<pre style="max-height:300px;overflow:auto">${text}</pre>`, `元数据 - ${inst.ip}:${inst.port}`, {
				dangerouslyUseHTMLString: true,
				confirmButtonText: "关闭"
			});
		}
		/**
		* 克隆配置：读取源内容后以新的 Data ID 发布
		* @param row 源配置行
		*/
		async function cloneConfig(row) {
			let newDataId = "";
			try {
				const input = await ElMessageBox.prompt("请输入克隆后的 Data ID", "克隆配置", {
					inputValue: `${row.dataId}_copy`,
					inputValidator: (v) => v && v.trim() ? true : "Data ID 不能为空"
				});
				newDataId = String(input.value || "").trim();
			} catch {
				return;
			}
			if (!newDataId || newDataId === row.dataId) return;
			try {
				const detail = await fetchNacosConfigDetail(row.dataId, {
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					group: row.group
				});
				await saveNacosConfig({
					datasourceId: datasourceId.value,
					dataId: newDataId,
					group: detail?.group || row.group,
					format: detail?.format || row.format,
					namespace: activeNs.value,
					content: detail?.content ?? ""
				});
				message.success(`已克隆为 ${newDataId}`);
				ready();
				await loadConfigs();
			} catch (e) {
				fail(e, "/ms/monitor/nacos/config");
			}
		}
		/**
		* 导出配置内容到本地文件
		* @param row 配置行
		*/
		async function exportConfig(row) {
			let content = "";
			try {
				content = (await fetchNacosConfigDetail(row.dataId, {
					datasourceId: datasourceId.value,
					namespace: activeNs.value,
					group: row.group
				}))?.content ?? "";
				ready();
			} catch (e) {
				fail(e, `/ms/monitor/nacos/config?dataId=${row.dataId}`);
				return;
			}
			const extMap = {
				yaml: "yml",
				properties: "properties",
				json: "json",
				xml: "xml"
			};
			const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = `nacos-${row.group}-${row.dataId}.${extMap[row.format || ""] || "txt"}`;
			link.click();
			URL.revokeObjectURL(link.href);
			message.success("导出成功");
		}
		/**
		* 右键菜单动作分发
		* @param item 菜单项
		* @param ctx 菜单上下文
		*/
		function onMenuSelect(item, ctx) {
			const row = ctx.row;
			if (item.key === "view") viewConfig(row);
			else if (item.key === "edit") editConfig(row);
			else if (item.key === "clone") cloneConfig(row);
			else if (item.key === "export") exportConfig(row);
			else if (item.key === "delete") deleteConfig(row);
		}
		let searchTimer = null;
		watch(searchKeyword, () => {
			if (searchTimer) clearTimeout(searchTimer);
			searchTimer = setTimeout(() => {
				configPage.value = 1;
				loadConfigs();
			}, 300);
		});
		watch([configPage, configPageSize], () => {
			loadConfigs();
		});
		onMounted(async () => {
			await bind("nacos");
			if (source.value) await reloadAll();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["dsm tel-page", { resizing: resizing.value }]) }, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(unref(component$1), {
					name: "Setting",
					size: 18,
					class: "dsm-title-icon dsm-nacos-icon"
				}), _cache[25] || (_cache[25] = createBaseVNode("span", { class: "dsm-title" }, "Nacos 配置中心管理", -1))]), createBaseVNode("div", _hoisted_3, [
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
						icon: "Refresh",
						tip: "刷新",
						"data-testid": "dsm-btn-refresh",
						loading: loading.value,
						onClick: reloadAll
					}, null, 8, ["loading"]),
					createVNode(unref(ReButton_default), {
						layout: "square",
						type: "primary",
						icon: "Plus",
						tip: "新建配置",
						"data-testid": "dsm-btn-create",
						disabled: !unref(source),
						onClick: openCreate
					}, null, 8, ["disabled"])
				])]),
				createVNode(MiddlewareGap_default, {
					text: unref(gap),
					onRetry: reloadAll
				}, null, 8, ["text"]),
				createBaseVNode("div", _hoisted_4, [
					createBaseVNode("div", {
						class: "dsm-sidebar",
						style: normalizeStyle({ width: leftWidth.value + "px" })
					}, [
						createBaseVNode("div", _hoisted_5, [createVNode(unref(ReInput_default), {
							modelValue: sidebarKeyword.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => sidebarKeyword.value = $event),
							placeholder: "过滤命名空间",
							onKeyup: withKeys(reloadAll, ["enter"])
						}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: loading.value,
							onClick: reloadAll
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Search",
								size: "12"
							})]),
							default: withCtx(() => [_cache[26] || (_cache[26] = createTextVNode("查询", -1))]),
							_: 1
						}, 8, ["loading"])]),
						createBaseVNode("div", _hoisted_6, [
							createBaseVNode("span", _hoisted_7, toDisplayString(filteredNamespaces.value.length) + " 命名空间 · " + toDisplayString(services.value.length) + " 服务", 1),
							_cache[27] || (_cache[27] = createBaseVNode("span", { class: "dsm-view-spacer" }, null, -1)),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Refresh",
								tip: "刷新",
								"data-testid": "dsm-view-refresh",
								loading: loading.value,
								onClick: reloadAll
							}, null, 8, ["loading"])
						]),
						createBaseVNode("div", _hoisted_8, [createBaseVNode("div", {
							class: normalizeClass(["dsm-scan-bar", { "is-active": loading.value }]),
							"data-testid": "dsm-scan-bar"
						}, [..._cache[28] || (_cache[28] = [createBaseVNode("span", null, null, -1)])], 2), createBaseVNode("div", _hoisted_9, [createBaseVNode("div", {
							class: "dsm-tree-node dsm-tree-root",
							onClick: _cache[1] || (_cache[1] = ($event) => toggleNode("root"))
						}, [
							createVNode(unref(component$1), {
								name: expandedNodes.value.has("root") ? "ArrowDown" : "ArrowRight",
								size: "12"
							}, null, 8, ["name"]),
							createVNode(unref(component$1), {
								name: "Setting",
								size: "14",
								class: "dsm-tree-icon dsm-nacos-icon"
							}),
							createBaseVNode("span", _hoisted_10, toDisplayString(connectionName.value), 1)
						]), expandedNodes.value.has("root") ? (openBlock(), createElementBlock("div", _hoisted_11, [
							createBaseVNode("div", {
								class: "dsm-tree-node",
								onClick: _cache[5] || (_cache[5] = ($event) => toggleNode("ns"))
							}, [
								createVNode(unref(component$1), {
									name: expandedNodes.value.has("ns") ? "ArrowDown" : "ArrowRight",
									size: "12"
								}, null, 8, ["name"]),
								createVNode(unref(component$1), {
									name: "FolderOpened",
									size: "14",
									class: "dsm-tree-icon"
								}),
								_cache[29] || (_cache[29] = createBaseVNode("span", { class: "dsm-tree-label" }, "命名空间", -1)),
								createBaseVNode("span", _hoisted_12, toDisplayString(namespaces.value.length), 1),
								createBaseVNode("span", {
									class: "dsm-tree-actions",
									"data-testid": "dsm-tree-actions",
									onClick: _cache[4] || (_cache[4] = withModifiers(() => {}, ["stop"]))
								}, [
									createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "Plus",
										tip: "新建命名空间",
										"data-testid": "dsm-ns-create",
										onClick: _cache[2] || (_cache[2] = ($event) => openNamespaceDialog("create"))
									}),
									createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										icon: "Edit",
										tip: "编辑命名空间",
										"data-testid": "dsm-ns-edit",
										disabled: !canEditNamespace.value,
										onClick: _cache[3] || (_cache[3] = ($event) => openNamespaceDialog("edit"))
									}, null, 8, ["disabled"]),
									createVNode(unref(ReButton_default), {
										layout: "square",
										size: "small",
										type: "danger",
										icon: "Delete",
										tip: "删除命名空间",
										"data-testid": "dsm-ns-delete",
										disabled: !canEditNamespace.value,
										onClick: removeNamespace
									}, null, 8, ["disabled"])
								])
							]),
							expandedNodes.value.has("ns") ? (openBlock(), createElementBlock("div", _hoisted_13, [(openBlock(true), createElementBlock(Fragment, null, renderList(filteredNamespaces.value, (ns) => {
								return openBlock(), createElementBlock("div", {
									key: ns.id,
									class: normalizeClass(["dsm-tree-node dsm-leaf-node", { active: activeNs.value === ns.id }]),
									onClick: ($event) => selectNs(ns.id),
									onContextmenu: withModifiers(($event) => onNsContextMenu($event, ns.id), ["prevent"])
								}, [
									createVNode(unref(component$1), {
										name: "Folder",
										size: "12",
										class: "dsm-tree-icon"
									}),
									createBaseVNode("span", _hoisted_15, toDisplayString(ns.name), 1),
									createBaseVNode("span", _hoisted_16, toDisplayString(ns.configCount), 1)
								], 42, _hoisted_14);
							}), 128)), filteredNamespaces.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_17, [createBaseVNode("span", _hoisted_18, toDisplayString(unref(gap) ? "未读取到命名空间" : sidebarKeyword.value ? "无匹配命名空间" : "暂无命名空间"), 1)])) : createCommentVNode("", true)])) : createCommentVNode("", true),
							createBaseVNode("div", {
								class: normalizeClass(["dsm-tree-node", { active: activeView.value === "services" }]),
								onClick: _cache[6] || (_cache[6] = ($event) => activeView.value = "services")
							}, [
								createVNode(unref(component$1), {
									name: "Connection",
									size: "14",
									class: "dsm-tree-icon"
								}),
								_cache[30] || (_cache[30] = createBaseVNode("span", { class: "dsm-tree-label" }, "服务列表", -1)),
								createBaseVNode("span", _hoisted_19, toDisplayString(services.value.length), 1)
							], 2),
							createBaseVNode("div", {
								class: normalizeClass(["dsm-tree-node", { active: activeView.value === "clusters" }]),
								onClick: _cache[7] || (_cache[7] = ($event) => activeView.value = "clusters")
							}, [
								createVNode(unref(component$1), {
									name: "OfficeBuilding",
									size: "14",
									class: "dsm-tree-icon"
								}),
								_cache[31] || (_cache[31] = createBaseVNode("span", { class: "dsm-tree-label" }, "集群管理", -1)),
								createBaseVNode("span", _hoisted_20, toDisplayString(clusters.value.length), 1)
							], 2)
						])) : createCommentVNode("", true)])])
					], 4),
					createBaseVNode("div", {
						class: normalizeClass(["dsm-split", { active: resizing.value }]),
						title: "拖拽调节宽度",
						onMousedown: withModifiers(startResize, ["prevent"])
					}, null, 34),
					createBaseVNode("div", _hoisted_21, [
						createBaseVNode("div", _hoisted_22, [
							createBaseVNode("div", _hoisted_23, [_cache[32] || (_cache[32] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_24, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
							createBaseVNode("div", _hoisted_25, [_cache[33] || (_cache[33] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_26, toDisplayString(unref(source) ? `${unref(source).host}:${unref(source).port || 8848}` : "—"), 1)]),
							createBaseVNode("div", _hoisted_27, [_cache[34] || (_cache[34] = createBaseVNode("span", { class: "dsm-info-label" }, "命名空间", -1)), createBaseVNode("span", _hoisted_28, toDisplayString(activeNsName.value), 1)]),
							createBaseVNode("div", _hoisted_29, [_cache[35] || (_cache[35] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createBaseVNode("div", _hoisted_30, [createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
								_: 1
							}, 8, ["type"]), createBaseVNode("span", _hoisted_31, "服务版本 " + toDisplayString(nacosVersion.value || "未探测"), 1)])])
						]),
						activeView.value === "configs" ? (openBlock(), createElementBlock("div", _hoisted_32, [createBaseVNode("div", _hoisted_33, [_cache[36] || (_cache[36] = createTextVNode(" 配置列表 ", -1)), createBaseVNode("div", _hoisted_34, [createVNode(unref(ReInput_default), {
							modelValue: searchKeyword.value,
							"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => searchKeyword.value = $event),
							placeholder: "按 Data ID 过滤",
							style: { "width": "200px" },
							clearable: ""
						}, null, 8, ["modelValue"])])]), createVNode(unref(ReTable_default), {
							page: configPage.value,
							"onUpdate:page": _cache[9] || (_cache[9] = ($event) => configPage.value = $event),
							"page-size": configPageSize.value,
							"onUpdate:pageSize": _cache[10] || (_cache[10] = ($event) => configPageSize.value = $event),
							data: configs.value,
							columns: configColumns,
							loading: loading.value,
							total: configTotal.value,
							"context-menu": configMenu,
							stripe: "",
							border: "",
							height: "400px",
							onContextMenuSelect: onMenuSelect
						}, {
							"col-actions": withCtx(({ row }) => [
								createVNode(unref(ReButton_default), {
									text: "",
									onClick: ($event) => viewConfig(row)
								}, {
									default: withCtx(() => [..._cache[37] || (_cache[37] = [createTextVNode("查看", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									text: "",
									type: "primary",
									onClick: ($event) => editConfig(row)
								}, {
									default: withCtx(() => [..._cache[38] || (_cache[38] = [createTextVNode("编辑", -1)])]),
									_: 1
								}, 8, ["onClick"]),
								createVNode(unref(ReButton_default), {
									text: "",
									type: "danger",
									onClick: ($event) => deleteConfig(row)
								}, {
									default: withCtx(() => [..._cache[39] || (_cache[39] = [createTextVNode("删除", -1)])]),
									_: 1
								}, 8, ["onClick"])
							]),
							_: 1
						}, 8, [
							"page",
							"page-size",
							"data",
							"loading",
							"total"
						])])) : createCommentVNode("", true),
						activeView.value === "services" ? (openBlock(), createElementBlock("div", _hoisted_35, [_cache[40] || (_cache[40] = createBaseVNode("div", { class: "dsm-section-title" }, [createTextVNode("服务列表"), createBaseVNode("span", { class: "dsm-section-hint" }, "点击服务名查看实例")], -1)), createVNode(unref(ReTable_default), {
							data: services.value,
							columns: serviceColumns,
							loading: loading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "400px"
						}, {
							"col-name": withCtx(({ row }) => [createVNode(unref(ReButton_default), {
								text: "",
								type: "primary",
								onClick: ($event) => openInstances(row)
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.name), 1)]),
								_: 2
							}, 1032, ["onClick"])]),
							_: 1
						}, 8, ["data", "loading"])])) : createCommentVNode("", true),
						activeView.value === "clusters" ? (openBlock(), createElementBlock("div", _hoisted_36, [_cache[42] || (_cache[42] = createBaseVNode("div", { class: "dsm-section-title" }, "集群节点", -1)), createVNode(unref(ReTable_default), {
							data: clusters.value,
							columns: clusterColumns,
							loading: loading.value,
							pagination: false,
							stripe: "",
							border: "",
							height: "400px"
						}, {
							"col-role": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.role === "LEADER" ? "warning" : "info" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.role || "—"), 1)]),
								_: 2
							}, 1032, ["type"])]),
							"col-status": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.status === "UP" ? "success" : "danger" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.status || "—"), 1)]),
								_: 2
							}, 1032, ["type"])]),
							"col-leader": withCtx(({ row }) => [row.leader ? (openBlock(), createBlock(unref(component$2), {
								key: 0,
								type: "warning"
							}, {
								default: withCtx(() => [createVNode(unref(component$1), {
									name: "Star",
									size: "11"
								}), _cache[41] || (_cache[41] = createTextVNode(" Leader", -1))]),
								_: 1
							})) : (openBlock(), createElementBlock("span", _hoisted_37, "—"))]),
							_: 1
						}, 8, ["data", "loading"])])) : createCommentVNode("", true)
					])
				]),
				createVNode(unref(component), {
					modelValue: configVisible.value,
					"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => configVisible.value = $event),
					title: dialogTitle.value,
					width: "700px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[16] || (_cache[16] = ($event) => configVisible.value = false) }, {
						default: withCtx(() => [..._cache[48] || (_cache[48] = [createTextVNode("关闭", -1)])]),
						_: 1
					}), dialogMode.value !== "view" ? (openBlock(), createBlock(unref(ReButton_default), {
						key: 0,
						type: "primary",
						loading: saving.value,
						onClick: saveConfig
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [createTextVNode(toDisplayString(dialogMode.value === "create" ? "创建并发布" : "保存并发布"), 1)]),
						_: 1
					}, 8, ["loading"])) : createCommentVNode("", true)]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_38, [
						createBaseVNode("div", _hoisted_39, [createBaseVNode("div", _hoisted_40, [_cache[43] || (_cache[43] = createBaseVNode("label", null, "Data ID", -1)), createVNode(unref(ReInput_default), {
							modelValue: form.dataId,
							"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => form.dataId = $event),
							disabled: dialogMode.value === "view"
						}, null, 8, ["modelValue", "disabled"])]), createBaseVNode("div", _hoisted_41, [_cache[44] || (_cache[44] = createBaseVNode("label", null, "Group", -1)), createVNode(unref(ReInput_default), {
							modelValue: form.group,
							"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => form.group = $event),
							disabled: dialogMode.value === "view"
						}, null, 8, ["modelValue", "disabled"])])]),
						createBaseVNode("div", _hoisted_42, [_cache[45] || (_cache[45] = createBaseVNode("label", null, "配置格式", -1)), createVNode(unref(ReSelect_default), {
							modelValue: form.format,
							"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => form.format = $event),
							style: { "width": "200px" },
							disabled: dialogMode.value === "view"
						}, {
							default: withCtx(() => [
								createVNode(unref(ReOption), {
									label: "YAML",
									value: "yaml"
								}),
								createVNode(unref(ReOption), {
									label: "Properties",
									value: "properties"
								}),
								createVNode(unref(ReOption), {
									label: "JSON",
									value: "json"
								}),
								createVNode(unref(ReOption), {
									label: "XML",
									value: "xml"
								})
							]),
							_: 1
						}, 8, ["modelValue", "disabled"])]),
						createBaseVNode("div", _hoisted_43, [_cache[46] || (_cache[46] = createBaseVNode("label", null, "配置内容", -1)), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => form.content = $event),
							class: "dsm-config-content",
							rows: "12",
							disabled: dialogMode.value === "view",
							placeholder: contentHint.value
						}, null, 8, _hoisted_44), [[vModelText, form.content]])]),
						dialogMode.value !== "view" ? (openBlock(), createElementBlock("div", _hoisted_45, [_cache[47] || (_cache[47] = createBaseVNode("label", null, "Beta 发布目标 IP（留空为全量发布，多个用逗号分隔）", -1)), createVNode(unref(ReInput_default), {
							modelValue: form.betaIps,
							"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => form.betaIps = $event),
							placeholder: "例如 192.168.1.10,192.168.1.11"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true)
					])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: nsDialogVisible.value,
					"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => nsDialogVisible.value = $event),
					title: nsDialogMode.value === "create" ? "新建命名空间" : "编辑命名空间",
					width: "520px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[21] || (_cache[21] = ($event) => nsDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[52] || (_cache[52] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: nsSaving.value,
						onClick: saveNamespace
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [_cache[53] || (_cache[53] = createTextVNode("保存 ", -1))]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_46, [
						createBaseVNode("div", _hoisted_47, [_cache[49] || (_cache[49] = createBaseVNode("label", null, "命名空间 ID（新建可留空自动生成）", -1)), createVNode(unref(ReInput_default), {
							modelValue: nsForm.namespaceId,
							"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => nsForm.namespaceId = $event),
							disabled: nsDialogMode.value === "edit",
							placeholder: "留空自动生成"
						}, null, 8, ["modelValue", "disabled"])]),
						createBaseVNode("div", _hoisted_48, [_cache[50] || (_cache[50] = createBaseVNode("label", null, "命名空间名称", -1)), createVNode(unref(ReInput_default), {
							modelValue: nsForm.namespaceName,
							"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => nsForm.namespaceName = $event),
							placeholder: "例如 生产环境"
						}, null, 8, ["modelValue"])]),
						createBaseVNode("div", _hoisted_49, [_cache[51] || (_cache[51] = createBaseVNode("label", null, "描述", -1)), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => nsForm.namespaceDesc = $event),
							class: "dsm-config-content",
							rows: "2",
							placeholder: "可选"
						}, null, 512), [[vModelText, nsForm.namespaceDesc]])])
					])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: instanceVisible.value,
					"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => instanceVisible.value = $event),
					title: `服务实例 - ${currentService.value?.name || ""}`,
					width: "860px"
				}, {
					default: withCtx(() => [createVNode(unref(ReTable_default), {
						data: instances.value,
						columns: instanceColumns,
						loading: instanceLoading.value,
						pagination: false,
						stripe: "",
						border: ""
					}, {
						"col-healthy": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.healthy ? "success" : "danger" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(row.healthy ? "健康" : "不健康"), 1)]),
							_: 2
						}, 1032, ["type"])]),
						"col-enabled": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.enabled ? "success" : "warning" }, {
							default: withCtx(() => [createTextVNode(toDisplayString(row.enabled ? "上线" : "下线"), 1)]),
							_: 2
						}, 1032, ["type"])]),
						"col-actions": withCtx(({ row }) => [
							createVNode(unref(ReButton_default), {
								text: "",
								type: row.enabled ? "warning" : "success",
								onClick: ($event) => toggleInstance(row)
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(row.enabled ? "下线" : "上线"), 1)]),
								_: 2
							}, 1032, ["type", "onClick"]),
							createVNode(unref(ReButton_default), {
								text: "",
								type: "primary",
								onClick: ($event) => editWeight(row)
							}, {
								default: withCtx(() => [..._cache[54] || (_cache[54] = [createTextVNode("改权重", -1)])]),
								_: 1
							}, 8, ["onClick"]),
							createVNode(unref(ReButton_default), {
								text: "",
								onClick: ($event) => viewMetadata(row)
							}, {
								default: withCtx(() => [..._cache[55] || (_cache[55] = [createTextVNode("元数据", -1)])]),
								_: 1
							}, 8, ["onClick"])
						]),
						_: 1
					}, 8, ["data", "loading"])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(DsmContextMenu_default, {
					visible: nsMenu.visible,
					"onUpdate:visible": _cache[24] || (_cache[24] = ($event) => nsMenu.visible = $event),
					x: nsMenu.x,
					y: nsMenu.y,
					items: nsMenuItems.value,
					onSelect: onNsMenuSelect
				}, null, 8, [
					"visible",
					"x",
					"y",
					"items"
				])
			], 2);
		};
	}
}), [["__scopeId", "data-v-c008f8af"]]);
//#endregion
export { NacosManageView_default as default };
