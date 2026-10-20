import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { t as ReTable_default } from "./ReTable-BO1ac7-i.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
import { I as fetchZkChildren, K as testZookeeperConnection, L as fetchZkNodeDetail, R as fetchZkTree, a as createZkNode, d as deleteZkNode, q as updateZkNode } from "./manageConsoles-BaCEHWGA.js";
import { t as ReEmpty_default } from "./ReEmpty-DzxmsI1k.js";
import { t as component$1 } from "./ReIcon-By12b2Y9.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as ReSwitch_default } from "./ReSwitch-B3yMYGw4.js";
import { t as component$2 } from "./ReTag-D5UpQULZ.js";
import { t as component$3 } from "./ReRelationGraph-TK3CtGll.js";
import "./surface-Bdspw2jE.js";
import { n as MiddlewareGap_default, t as useMiddlewareSource } from "./middlewareSource-BjMz9rOx.js";
import { t as copyToClipboard } from "./clipboard-Cx2N7jRl.js";
import { a as fetchZkCluster, o as fetchZkNodeAcl, r as deleteZkNodeRecursive } from "./zkNacosApi-BVVbKaSO.js";
//#region ../../pages/datasource/src/views/console/ZookeeperManageView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dsm-toolbar re-surface" };
var _hoisted_2 = { class: "dsm-toolbar-left" };
var _hoisted_3 = { class: "dsm-toolbar-right" };
var _hoisted_4 = { class: "dsm-body" };
var _hoisted_5 = { class: "dsm-search-section" };
var _hoisted_6 = { class: "dsm-view-bar" };
var _hoisted_7 = { class: "dsm-view-count" };
var _hoisted_8 = { class: "dsm-key-list" };
var _hoisted_9 = { class: "dsm-tree" };
var _hoisted_10 = {
	key: 0,
	class: "dsm-tree-children dsm-tree-flat"
};
var _hoisted_11 = ["onClick", "onContextmenu"];
var _hoisted_12 = { class: "dsm-tree-label" };
var _hoisted_13 = {
	key: 0,
	class: "dsm-tree-count"
};
var _hoisted_14 = {
	key: 1,
	class: "dsm-ephemeral-tag"
};
var _hoisted_15 = {
	key: 0,
	class: "dsm-tree-node"
};
var _hoisted_16 = { class: "dsm-tree-label" };
var _hoisted_17 = { class: "dsm-content" };
var _hoisted_18 = { class: "dsm-info-card re-surface" };
var _hoisted_19 = { class: "dsm-info-row" };
var _hoisted_20 = { class: "dsm-info-value" };
var _hoisted_21 = { class: "dsm-info-row" };
var _hoisted_22 = { class: "dsm-info-value mono" };
var _hoisted_23 = { class: "dsm-info-row" };
var _hoisted_24 = { class: "dsm-info-value mono" };
var _hoisted_25 = { class: "dsm-info-row" };
var _hoisted_26 = { class: "dsm-info-row" };
var _hoisted_27 = { class: "dsm-info-value mono" };
var _hoisted_28 = { class: "dsm-info-row" };
var _hoisted_29 = { class: "dsm-info-value mono" };
var _hoisted_30 = {
	key: 0,
	class: "dsm-section"
};
var _hoisted_31 = { class: "dsm-section-title" };
var _hoisted_32 = { class: "dsm-section-actions" };
var _hoisted_33 = { class: "dsm-node-detail" };
var _hoisted_34 = { class: "dsm-detail-row" };
var _hoisted_35 = { class: "dsm-detail-value mono" };
var _hoisted_36 = { class: "dsm-detail-row" };
var _hoisted_37 = { class: "dsm-detail-row" };
var _hoisted_38 = { class: "dsm-detail-value" };
var _hoisted_39 = { class: "dsm-detail-row" };
var _hoisted_40 = { class: "dsm-detail-value" };
var _hoisted_41 = { class: "dsm-detail-row" };
var _hoisted_42 = { class: "dsm-detail-value" };
var _hoisted_43 = { class: "dsm-detail-row" };
var _hoisted_44 = { class: "dsm-detail-value" };
var _hoisted_45 = { class: "dsm-detail-row" };
var _hoisted_46 = { class: "dsm-detail-value" };
var _hoisted_47 = { class: "dsm-detail-row" };
var _hoisted_48 = { class: "dsm-detail-value" };
var _hoisted_49 = { class: "dsm-detail-row" };
var _hoisted_50 = { class: "dsm-detail-value" };
var _hoisted_51 = { class: "dsm-detail-row" };
var _hoisted_52 = { class: "dsm-detail-value mono" };
var _hoisted_53 = { class: "dsm-detail-row" };
var _hoisted_54 = { class: "dsm-detail-value mono" };
var _hoisted_55 = { class: "dsm-detail-row" };
var _hoisted_56 = { class: "dsm-detail-value mono" };
var _hoisted_57 = { class: "dsm-detail-row" };
var _hoisted_58 = { class: "dsm-detail-value mono" };
var _hoisted_59 = { class: "dsm-data-section" };
var _hoisted_60 = { class: "dsm-tabs" };
var _hoisted_61 = {
	key: 0,
	class: "dsm-data-block"
};
var _hoisted_62 = { class: "dsm-data-title" };
var _hoisted_63 = ["value"];
var _hoisted_64 = {
	key: 1,
	class: "dsm-data-block"
};
var _hoisted_65 = {
	key: 1,
	class: "dsm-data-section"
};
var _hoisted_66 = {
	key: 2,
	class: "dsm-children-section"
};
var _hoisted_67 = {
	key: 1,
	class: "dsm-empty"
};
var _hoisted_68 = { class: "dsm-node-form" };
var _hoisted_69 = {
	key: 0,
	class: "dsm-form-item"
};
var _hoisted_70 = { class: "dsm-form-item" };
var _hoisted_71 = {
	key: 1,
	class: "dsm-form-item"
};
var _hoisted_72 = {
	key: 0,
	class: "dsm-form-hint"
};
var _hoisted_73 = { class: "zk-cluster" };
var _hoisted_74 = { class: "zk-cluster__tip-title" };
var _hoisted_75 = { class: "zk-cluster__tip-row" };
var _hoisted_76 = { class: "zk-cluster__tip-row" };
var _hoisted_77 = { class: "zk-cluster__tip-row" };
var _hoisted_78 = { class: "zk-cluster__detail" };
var _hoisted_79 = { class: "zk-cluster__detail-head" };
var _hoisted_80 = { class: "zk-cluster__grid" };
var _hoisted_81 = { class: "zk-cluster__label" };
var _hoisted_82 = { class: "zk-cluster__value mono" };
var _hoisted_83 = {
	key: 1,
	class: "zk-cluster__hint"
};
var LEFT_WIDTH_KEY = "zk-side-width";
//#endregion
//#region ../../pages/datasource/src/views/console/ZookeeperManageView.vue
var ZookeeperManageView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ZookeeperManageView",
	setup(__props) {
		/**
		* ZooKeeper 管理页
		*
		* <p>基于「数据源管理」登记的 zookeeper 数据源，通过后端 zookeeper 管理接口按需展开真实节点树，
		* 查看节点详情/子节点并支持创建、改数据、删除与递归删除；接口缺失或连接失败时只展示失败原因，
		* 不回落任何演示数据。</p>
		* @author CH
		* @since 4.0.0
		*/
		const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();
		const rootExpanded = ref(false);
		const treeNodes = ref([]);
		/** 侧栏过滤词：只过滤已加载的扁平节点，不影响服务端读取 */
		const nodeFilter = ref("");
		const filteredTreeNodes = computed(() => {
			const kw = nodeFilter.value.trim().toLowerCase();
			if (!kw) return treeNodes.value;
			return treeNodes.value.filter((n) => n.path.toLowerCase().includes(kw) || n.name.toLowerCase().includes(kw));
		});
		const activePath = ref("");
		const loading = ref(false);
		/** 侧栏宽度持久化键（zk 独立于 redis/nacos 等控制台） */
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
		const testing = ref(false);
		const nodeLoading = ref(false);
		const childLoading = ref(false);
		const saving = ref(false);
		const zkVersion = ref("");
		const sessionId = ref("");
		const nodeDetail = ref(null);
		const children = ref([]);
		/** 详情页签：数据 / ACL */
		const detailTab = ref("data");
		const aclList = ref([]);
		const aclLoading = ref(false);
		/** 集群信息弹窗 */
		const clusterVisible = ref(false);
		const clusterLoading = ref(false);
		const clusterList = ref([]);
		/**
		* 鼠标经过 / 点击某个集群节点时展示的 mntr 详情。
		*
		* <p>经过是「临时看」，点击是「钉住看」——两者共用同一份字段渲染，
		* 避免两套展示口径不一致。</p>
		*/
		const clusterActive = ref(null);
		/** mntr 详情行：label 与取值 key 一一对应（无值的行不渲染） */
		const clusterDetailRows = computed(() => {
			const r = clusterActive.value;
			if (!r) return [];
			const rows = [
				{
					label: "节点",
					value: r.host || "—"
				},
				{
					label: "角色",
					value: r.zkServerState || "—"
				},
				{
					label: "版本",
					value: r.zkVersion || "—"
				},
				{
					label: "平均延迟",
					value: r.zkAvgLatency != null ? `${r.zkAvgLatency} ms` : "—"
				},
				{
					label: "最大延迟",
					value: r.zkMaxLatency != null ? `${r.zkMaxLatency} ms` : "—"
				},
				{
					label: "连接数",
					value: r.zkNumAliveConnections != null ? String(r.zkNumAliveConnections) : "—"
				},
				{
					label: "堆积请求",
					value: r.zkOutstandingRequests != null ? String(r.zkOutstandingRequests) : "—"
				},
				{
					label: "Znode 数",
					value: r.zkZnodeCount != null ? String(r.zkZnodeCount) : "—"
				},
				{
					label: "Watch 数",
					value: r.zkWatchCount != null ? String(r.zkWatchCount) : "—"
				},
				{
					label: "数据量",
					value: r.zkApproximateDataSize != null ? `${r.zkApproximateDataSize} B` : "—"
				},
				{
					label: "打开句柄",
					value: r.zkOpenFileDescriptorCount != null ? String(r.zkOpenFileDescriptorCount) : "—"
				},
				{
					label: "收发包",
					value: r.zkPacketsReceived != null ? `${r.zkPacketsReceived} / ${r.zkPacketsSent}` : "—"
				}
			];
			if (r.error) rows.push({
				label: "错误",
				value: r.error
			});
			return rows;
		});
		/**
		* 集群拓扑 -> ReRelationGraph 数据。
		*
		* <p>中心是当前数据源，成员按角色着色并作为分组；有 leader 时额外画
		* leader→follower 的同步边（动态虚线），让「谁同步给谁」一眼可见。</p>
		*/
		const clusterGraph = computed(() => {
			const rows = clusterList.value || [];
			const centerId = "__cluster__";
			const nodes = [{
				id: centerId,
				label: source.value?.name || "ZooKeeper 集群",
				size: 56,
				group: "cluster",
				style: {
					fill: "#6d5dfc",
					stroke: "#8f83fd"
				},
				data: {
					kind: "cluster",
					count: rows.length,
					host: source.value?.host
				}
			}];
			const edges = [];
			rows.forEach((r, i) => {
				const id = r.host || `node-${i}`;
				const role = r.zkServerState || "unknown";
				const fill = role === "leader" ? "#f59e0b" : role === "follower" ? "#2992ff" : "#10b981";
				nodes.push({
					id,
					label: r.host || id,
					size: role === "leader" ? 46 : 38,
					group: role,
					style: {
						fill,
						stroke: fill
					},
					data: {
						...r,
						kind: "server",
						role
					}
				});
				edges.push({
					id: `${centerId}->${id}`,
					source: centerId,
					target: id,
					label: role,
					directed: false,
					data: { kind: "member" }
				});
			});
			const leader = rows.find((r) => r.zkServerState === "leader");
			if (leader?.host) rows.filter((r) => r.host && r.host !== leader.host).forEach((r) => {
				edges.push({
					id: `${leader.host}->${r.host}`,
					source: leader.host,
					target: r.host,
					label: "sync",
					directed: true,
					animated: true,
					data: { kind: "replication" }
				});
			});
			return {
				nodes,
				edges
			};
		});
		/** 点击节点：把 mntr 原始行钉到详情面板 */
		const onClusterNodeClick = (node) => {
			clusterActive.value = node?.data?.kind === "server" ? node.data : null;
		};
		/** 鼠标经过节点：临时显示详情（离开时若没点选则清空） */
		const onClusterNodeHover = (node) => {
			if (node?.data?.kind === "server") clusterActive.value = node.data;
		};
		/** ACL 表格列 */
		const aclColumns = [
			{
				prop: "scheme",
				label: "Scheme",
				width: 140
			},
			{
				prop: "id",
				label: "ID",
				minWidth: 180
			},
			{
				prop: "permsText",
				label: "权限",
				width: 220,
				slot: "perms"
			}
		];
		/** 节点数据是否为 JSON */
		const isJsonData = computed(() => {
			const raw = (nodeDetail.value?.data || "").trim();
			if (!raw) return false;
			return raw.startsWith("{") && raw.endsWith("}") || raw.startsWith("[") && raw.endsWith("]");
		});
		/** JSON 格式化结果，解析失败时回退原文 */
		const formattedJson = computed(() => {
			const raw = nodeDetail.value?.data || "";
			if (!isJsonData.value) return raw;
			try {
				return JSON.stringify(JSON.parse(raw), null, 2);
			} catch {
				return raw;
			}
		});
		const childColumns = [
			{
				prop: "name",
				label: "子节点名称",
				minWidth: 200
			},
			{
				prop: "ephemeral",
				label: "类型",
				width: 120,
				slot: "type"
			},
			{
				prop: "data",
				label: "数据",
				minWidth: 200
			}
		];
		const nodeDialogVisible = ref(false);
		const editing = ref(false);
		const nodeForm = reactive({
			path: "",
			data: "",
			ephemeral: false
		});
		/**
		* 拼子节点绝对路径
		* @param parent 父路径
		* @param name 子节点名
		* @returns 绝对路径
		*/
		function childPath(parent, name) {
			if (parent === "/") return `/${name}`;
			return `${parent}/${name}`;
		}
		/**
		* 加载根节点的直接子节点
		*/
		async function loadRootChildren() {
			loading.value = true;
			try {
				const nodes = await fetchZkTree(datasourceId.value, "/") || [];
				treeNodes.value = nodes.map((n) => ({
					path: n.path || childPath("/", n.name),
					name: n.name,
					ephemeral: !!n.ephemeral,
					depth: 1,
					childCount: n.childrenCount ?? 0,
					expanded: false,
					loaded: false
				}));
				rootExpanded.value = true;
				ready();
			} catch (e) {
				treeNodes.value = [];
				fail(e, "/ms/monitor/zookeeper/tree");
			} finally {
				loading.value = false;
			}
		}
		/**
		* 展开/收起根节点
		*/
		function toggleRoot() {
			if (rootExpanded.value) {
				rootExpanded.value = false;
				return;
			}
			loadRootChildren();
		}
		/**
		* 展开/收起树节点，首次展开时按需拉取子节点
		* @param node 树节点
		*/
		async function toggleNode(node) {
			if (node.expanded) {
				collapse(node);
				return;
			}
			if (!node.loaded) try {
				const nodes = await fetchZkTree(datasourceId.value, node.path) || [];
				node.loaded = true;
				const idx = treeNodes.value.indexOf(node);
				treeNodes.value.splice(idx + 1, 0, ...nodes.map((child) => ({
					path: child.path || childPath(node.path, child.name),
					name: child.name,
					ephemeral: !!child.ephemeral,
					depth: node.depth + 1,
					childCount: child.childrenCount ?? 0,
					expanded: false,
					loaded: false
				})));
				ready();
			} catch (e) {
				fail(e, "/ms/monitor/zookeeper/tree");
				return;
			}
			node.expanded = true;
		}
		/**
		* 收起节点，移除其下所有可见行
		* @param node 树节点
		*/
		function collapse(node) {
			const idx = treeNodes.value.indexOf(node);
			let end = idx + 1;
			while (end < treeNodes.value.length && treeNodes.value[end].depth > node.depth) end++;
			treeNodes.value.splice(idx + 1, end - idx - 1);
			node.expanded = false;
		}
		/**
		* 选中节点并加载详情与子节点
		* @param path 节点路径
		*/
		async function selectNode(path) {
			activePath.value = path;
			detailTab.value = "data";
			aclList.value = [];
			loadNodeDetail();
			loadChildren();
		}
		/**
		* 加载当前节点详情
		*/
		async function loadNodeDetail() {
			if (!activePath.value) return;
			nodeLoading.value = true;
			try {
				nodeDetail.value = await fetchZkNodeDetail(activePath.value, datasourceId.value);
				ready();
			} catch (e) {
				nodeDetail.value = null;
				fail(e, "/ms/monitor/zookeeper/node");
			} finally {
				nodeLoading.value = false;
			}
		}
		/**
		* 加载当前节点的子节点列表
		*/
		async function loadChildren() {
			if (!activePath.value) return;
			childLoading.value = true;
			try {
				children.value = await fetchZkChildren(activePath.value, datasourceId.value) || [];
				ready();
			} catch (e) {
				children.value = [];
				fail(e, "/ms/monitor/zookeeper/children");
			} finally {
				childLoading.value = false;
			}
		}
		/**
		* 打开集群信息弹窗并采集 mntr 指标
		*/
		async function openCluster() {
			clusterVisible.value = true;
			clusterLoading.value = true;
			clusterList.value = [];
			try {
				clusterList.value = await fetchZkCluster(datasourceId.value) || [];
				ready();
			} catch (e) {
				clusterList.value = [];
				fail(e, "/ms/monitor/zookeeper/cluster");
			} finally {
				clusterLoading.value = false;
			}
		}
		/**
		* 打开 ACL 页签并加载节点 ACL 列表
		*/
		async function openAcl() {
			detailTab.value = "acl";
			if (!activePath.value) return;
			aclLoading.value = true;
			aclList.value = [];
			try {
				aclList.value = await fetchZkNodeAcl(activePath.value, datasourceId.value) || [];
				ready();
			} catch (e) {
				aclList.value = [];
				fail(e, "/ms/monitor/zookeeper/node/acl");
			} finally {
				aclLoading.value = false;
			}
		}
		/**
		* 重新加载数据源、树与当前节点
		*/
		async function refresh() {
			if (!source.value) {
				await bind("zookeeper");
				if (!source.value) return;
			}
			await loadRootChildren();
			if (activePath.value) await Promise.all([loadNodeDetail(), loadChildren()]);
		}
		/**
		* 探测当前数据源的 ZooKeeper 连通性，回填服务端版本与会话 ID
		*/
		async function testConnection() {
			testing.value = true;
			try {
				const result = await testZookeeperConnection({ datasourceId: datasourceId.value });
				if (result?.connected) {
					zkVersion.value = result.version || "";
					sessionId.value = result.sessionId || "";
					ready();
					message.success(result.version ? `连接成功 · ZooKeeper ${result.version}` : "连接成功");
				} else message.error(result?.message || "连接失败");
			} catch (e) {
				fail(e, "/ms/monitor/zookeeper/test");
			} finally {
				testing.value = false;
			}
		}
		/**
		* 打开新建节点弹窗
		*/
		function openCreate() {
			editing.value = false;
			Object.assign(nodeForm, {
				path: "",
				data: "",
				ephemeral: false
			});
			nodeDialogVisible.value = true;
		}
		/**
		* 打开新建子节点弹窗
		* @param parentPath 父路径
		*/
		function openCreateChild(parentPath) {
			editing.value = false;
			Object.assign(nodeForm, {
				path: childPath(parentPath, "new-node"),
				data: "",
				ephemeral: false
			});
			nodeDialogVisible.value = true;
		}
		/**
		* 进入编辑数据态
		*/
		function editNode() {
			if (!nodeDetail.value) return;
			editing.value = true;
			Object.assign(nodeForm, {
				path: nodeDetail.value.path,
				data: nodeDetail.value.data || "",
				ephemeral: nodeDetail.value.ephemeral
			});
			nodeDialogVisible.value = true;
		}
		/**
		* 保存节点（创建或改数据）
		*/
		async function saveNode() {
			const path = nodeForm.path.trim();
			if (!path || editing.value === false && !path.startsWith("/")) {
				message.warning("节点路径需以 / 开头");
				return;
			}
			saving.value = true;
			try {
				if (editing.value) {
					await updateZkNode({
						path,
						data: nodeForm.data,
						datasourceId: datasourceId.value
					});
					message.success("节点数据已更新");
				} else {
					await createZkNode({
						path,
						data: nodeForm.data,
						ephemeral: nodeForm.ephemeral,
						datasourceId: datasourceId.value
					});
					message.success("节点已创建");
				}
				nodeDialogVisible.value = false;
				ready();
				activePath.value = path;
				await Promise.all([
					refresh(),
					loadNodeDetail(),
					loadChildren()
				]);
			} catch (e) {
				fail(e, "/ms/monitor/zookeeper/node");
			} finally {
				saving.value = false;
			}
		}
		/**
		* 删除节点
		* @param path 节点路径，缺省为当前选中节点
		*/
		async function deleteNode(path = activePath.value) {
			if (!path) return;
			try {
				await ElMessageBox.confirm(`确定删除节点 ${path} 吗？`, "删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deleteZkNode(path, datasourceId.value);
				message.success("节点已删除");
				ready();
				if (activePath.value === path) {
					activePath.value = "";
					nodeDetail.value = null;
					children.value = [];
				}
				await loadRootChildren();
			} catch (e) {
				fail(e, "/ms/monitor/zookeeper/node");
			}
		}
		/**
		* 递归删除节点及其子节点（后端一次性递归删除）
		* @param path 节点路径
		*/
		async function deleteRecursive(path) {
			try {
				await ElMessageBox.confirm(`确定递归删除节点 ${path} 及其所有子孙节点吗？此操作不可恢复！`, "递归删除确认", { type: "warning" });
			} catch {
				return;
			}
			try {
				await deleteZkNodeRecursive(path, datasourceId.value, true);
				message.success("递归删除完成");
				ready();
				if (activePath.value === path) {
					activePath.value = "";
					nodeDetail.value = null;
					children.value = [];
				}
				await loadRootChildren();
			} catch (e) {
				fail(e, "/ms/monitor/zookeeper/node");
			}
		}
		/**
		* 导出节点详情与子节点
		* @param path 节点路径
		*/
		async function exportNode(path) {
			try {
				const detail = await fetchZkNodeDetail(path, datasourceId.value);
				const list = await fetchZkChildren(path, datasourceId.value) || [];
				const payload = {
					path,
					datasource: source.value?.name ?? "",
					datasourceId: datasourceId.value,
					detail,
					children: list.map((c) => ({
						name: c.name,
						path: c.path || childPath(path, c.name),
						ephemeral: c.ephemeral,
						data: c.data
					})),
					exportTime: (/* @__PURE__ */ new Date()).toISOString()
				};
				ready();
				const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
				const link = document.createElement("a");
				link.href = URL.createObjectURL(blob);
				link.download = `zk-${path.replace(/[^a-zA-Z0-9]/g, "_") || "root"}-${Date.now()}.json`;
				link.click();
				URL.revokeObjectURL(link.href);
				message.success("导出成功");
			} catch (e) {
				fail(e, "/ms/monitor/zookeeper/node");
			}
		}
		const nodeContextMenu = reactive({
			visible: false,
			x: 0,
			y: 0,
			path: ""
		});
		/**
		* 打开右键菜单
		* @param event 原生事件
		* @param path 节点路径
		*/
		function onNodeContextMenu(event, path) {
			event.preventDefault();
			Object.assign(nodeContextMenu, {
				visible: true,
				x: event.clientX,
				y: event.clientY,
				path
			});
		}
		/**
		* 关闭右键菜单
		*/
		function closeMenu() {
			nodeContextMenu.visible = false;
		}
		/**
		* 行悬停「复制路径」：复用右键菜单 copy 分发逻辑
		* @param path 节点路径
		*/
		function copyRowPath(path) {
			Object.assign(nodeContextMenu, { path });
			menuSelect("copy");
		}
		/**
		* 菜单动作分发
		* @param action 动作键
		*/
		function menuSelect(action) {
			const path = nodeContextMenu.path;
			closeMenu();
			if (!path) return;
			if (action === "detail") {
				selectNode(path);
				return;
			}
			if (action === "copy") {
				copyToClipboard(path).then((ok) => ok ? message.success("已复制路径") : message.error("复制失败"));
				return;
			}
			if (action === "edit") {
				selectNode(path);
				editNode();
				return;
			}
			if (action === "child") openCreateChild(path);
			else if (action === "export") exportNode(path);
			else if (action === "delete") deleteNode(path);
			else if (action === "delete-tree") deleteRecursive(path);
			else if (action === "refresh") refresh();
		}
		onMounted(async () => {
			window.addEventListener("click", closeMenu);
			await bind("zookeeper");
			if (source.value) {
				await refresh();
				selectNode("/");
			}
		});
		return (_ctx, _cache) => {
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock(Fragment, null, [createBaseVNode("div", { class: normalizeClass(["dsm tel-page", { resizing: resizing.value }]) }, [
				createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createVNode(unref(component$1), {
					name: "Share",
					size: 18,
					class: "dsm-title-icon dsm-zk-icon"
				}), _cache[20] || (_cache[20] = createBaseVNode("span", { class: "dsm-title" }, "ZooKeeper 注册中心管理", -1))]), createBaseVNode("div", _hoisted_3, [
					createVNode(unref(ReButton_default), {
						layout: "square",
						tip: "集群信息",
						icon: "Monitor",
						"data-testid": "dsm-btn-cluster",
						disabled: !unref(source),
						loading: clusterLoading.value,
						onClick: openCluster
					}, null, 8, ["disabled", "loading"]),
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
						type: "primary",
						tip: "新建节点",
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
							modelValue: nodeFilter.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => nodeFilter.value = $event),
							placeholder: "过滤节点路径",
							onKeyup: withKeys(refresh, ["enter"])
						}, null, 8, ["modelValue"]), createVNode(unref(ReButton_default), {
							type: "primary",
							loading: loading.value,
							onClick: refresh
						}, {
							icon: withCtx(() => [createVNode(unref(component$1), {
								name: "Search",
								size: "12"
							})]),
							default: withCtx(() => [_cache[21] || (_cache[21] = createTextVNode("查询", -1))]),
							_: 1
						}, 8, ["loading"])]),
						createBaseVNode("div", _hoisted_6, [
							createBaseVNode("span", _hoisted_7, toDisplayString(filteredTreeNodes.value.length) + " 节点", 1),
							_cache[22] || (_cache[22] = createBaseVNode("span", { class: "dsm-view-spacer" }, null, -1)),
							createVNode(unref(ReButton_default), {
								layout: "square",
								icon: "Refresh",
								tip: "刷新",
								"data-testid": "dsm-view-refresh",
								loading: loading.value,
								onClick: refresh
							}, null, 8, ["loading"])
						]),
						createBaseVNode("div", _hoisted_8, [createBaseVNode("div", {
							class: normalizeClass(["dsm-scan-bar", { "is-active": loading.value }]),
							"data-testid": "dsm-scan-bar"
						}, [..._cache[23] || (_cache[23] = [createBaseVNode("span", null, null, -1)])], 2), createBaseVNode("div", _hoisted_9, [createBaseVNode("div", {
							class: normalizeClass(["dsm-tree-node dsm-tree-root", { active: activePath.value === "/" }]),
							onClick: _cache[1] || (_cache[1] = ($event) => selectNode("/")),
							onContextmenu: _cache[2] || (_cache[2] = withModifiers(($event) => onNodeContextMenu($event, "/"), ["prevent"]))
						}, [
							createVNode(unref(component$1), {
								name: rootExpanded.value ? "ArrowDown" : "ArrowRight",
								size: "12",
								onClick: withModifiers(toggleRoot, ["stop"])
							}, null, 8, ["name"]),
							createVNode(unref(component$1), {
								name: "FolderOpened",
								size: "14",
								class: "dsm-tree-icon"
							}),
							_cache[24] || (_cache[24] = createBaseVNode("span", { class: "dsm-tree-label" }, "/ (根节点)", -1))
						], 34), rootExpanded.value ? (openBlock(), createElementBlock("div", _hoisted_10, [(openBlock(true), createElementBlock(Fragment, null, renderList(filteredTreeNodes.value, (node) => {
							return openBlock(), createElementBlock("div", {
								key: node.path,
								class: normalizeClass(["dsm-tree-node", { active: activePath.value === node.path }]),
								style: normalizeStyle({ paddingLeft: `${(node.depth - 1) * 14}px` }),
								onClick: ($event) => selectNode(node.path),
								onContextmenu: withModifiers(($event) => onNodeContextMenu($event, node.path), ["prevent"])
							}, [
								createVNode(unref(component$1), {
									name: node.childCount > 0 ? node.expanded ? "ArrowDown" : "ArrowRight" : "MoreFilled",
									size: "12",
									onClick: withModifiers(($event) => toggleNode(node), ["stop"])
								}, null, 8, ["name", "onClick"]),
								createVNode(unref(component$1), {
									name: node.ephemeral ? "Lock" : "Folder",
									size: "14",
									class: normalizeClass(["dsm-tree-icon", { "dsm-ephemeral": node.ephemeral }])
								}, null, 8, ["name", "class"]),
								createBaseVNode("span", _hoisted_12, toDisplayString(node.name), 1),
								node.childCount > 0 ? (openBlock(), createElementBlock("span", _hoisted_13, toDisplayString(node.childCount), 1)) : createCommentVNode("", true),
								node.ephemeral ? (openBlock(), createElementBlock("span", _hoisted_14, "E")) : createCommentVNode("", true),
								createBaseVNode("span", {
									class: "dsm-row-actions",
									"data-testid": "dsm-row-actions",
									onClick: _cache[3] || (_cache[3] = withModifiers(() => {}, ["stop"]))
								}, [createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									icon: "CopyDocument",
									tip: "复制路径",
									"data-testid": "dsm-row-copy",
									onClick: ($event) => copyRowPath(node.path)
								}, null, 8, ["onClick"]), createVNode(unref(ReButton_default), {
									layout: "square",
									size: "small",
									type: "danger",
									icon: "Delete",
									tip: "删除节点",
									"data-testid": "dsm-row-delete",
									onClick: ($event) => deleteNode(node.path)
								}, null, 8, ["onClick"])])
							], 46, _hoisted_11);
						}), 128)), filteredTreeNodes.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_15, [createBaseVNode("span", _hoisted_16, toDisplayString(unref(gap) ? "未读取到子节点" : nodeFilter.value ? "无匹配节点" : "根节点下暂无子节点"), 1)])) : createCommentVNode("", true)])) : createCommentVNode("", true)])])
					], 4),
					createBaseVNode("div", {
						class: normalizeClass(["dsm-split", { active: resizing.value }]),
						title: "拖拽调节宽度",
						onMousedown: withModifiers(startResize, ["prevent"])
					}, null, 34),
					createBaseVNode("div", _hoisted_17, [
						createBaseVNode("div", _hoisted_18, [
							createBaseVNode("div", _hoisted_19, [_cache[25] || (_cache[25] = createBaseVNode("span", { class: "dsm-info-label" }, "数据源", -1)), createBaseVNode("span", _hoisted_20, toDisplayString(unref(source) ? unref(source).name : "未选择"), 1)]),
							createBaseVNode("div", _hoisted_21, [_cache[26] || (_cache[26] = createBaseVNode("span", { class: "dsm-info-label" }, "连接地址", -1)), createBaseVNode("span", _hoisted_22, toDisplayString(unref(source) ? `${unref(source).host}:${unref(source).port || 2181}` : "—"), 1)]),
							createBaseVNode("div", _hoisted_23, [_cache[27] || (_cache[27] = createBaseVNode("span", { class: "dsm-info-label" }, "当前路径", -1)), createBaseVNode("span", _hoisted_24, toDisplayString(activePath.value || "—"), 1)]),
							createBaseVNode("div", _hoisted_25, [_cache[28] || (_cache[28] = createBaseVNode("span", { class: "dsm-info-label" }, "状态", -1)), createVNode(unref(component$2), { type: unref(gap) ? "danger" : "success" }, {
								default: withCtx(() => [createTextVNode(toDisplayString(unref(gap) ? "读取失败" : "正常"), 1)]),
								_: 1
							}, 8, ["type"])]),
							createBaseVNode("div", _hoisted_26, [_cache[29] || (_cache[29] = createBaseVNode("span", { class: "dsm-info-label" }, "服务端版本", -1)), createBaseVNode("span", _hoisted_27, toDisplayString(zkVersion.value || "未探测"), 1)]),
							createBaseVNode("div", _hoisted_28, [_cache[30] || (_cache[30] = createBaseVNode("span", { class: "dsm-info-label" }, "会话 ID", -1)), createBaseVNode("span", _hoisted_29, toDisplayString(sessionId.value || "未探测"), 1)])
						]),
						activePath.value ? (openBlock(), createElementBlock("div", _hoisted_30, [
							createBaseVNode("div", _hoisted_31, [createTextVNode(" 节点详情 - " + toDisplayString(activePath.value) + " ", 1), createBaseVNode("div", _hoisted_32, [
								createVNode(unref(ReButton_default), {
									text: "",
									onClick: loadNodeDetail
								}, {
									icon: withCtx(() => [createVNode(unref(component$1), {
										name: "Refresh",
										size: "12"
									})]),
									default: withCtx(() => [_cache[31] || (_cache[31] = createTextVNode("刷新", -1))]),
									_: 1
								}),
								createVNode(unref(ReButton_default), {
									text: "",
									type: "primary",
									disabled: !nodeDetail.value,
									onClick: editNode
								}, {
									icon: withCtx(() => [createVNode(unref(component$1), {
										name: "Edit",
										size: "12"
									})]),
									default: withCtx(() => [_cache[32] || (_cache[32] = createTextVNode("编辑数据", -1))]),
									_: 1
								}, 8, ["disabled"]),
								createVNode(unref(ReButton_default), {
									text: "",
									type: "danger",
									disabled: !nodeDetail.value,
									onClick: _cache[4] || (_cache[4] = ($event) => deleteNode())
								}, {
									icon: withCtx(() => [createVNode(unref(component$1), {
										name: "Delete",
										size: "12"
									})]),
									default: withCtx(() => [_cache[33] || (_cache[33] = createTextVNode("删除", -1))]),
									_: 1
								}, 8, ["disabled"])
							])]),
							nodeDetail.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_33, [
								createBaseVNode("div", _hoisted_34, [_cache[34] || (_cache[34] = createBaseVNode("span", { class: "dsm-detail-label" }, "节点路径", -1)), createBaseVNode("span", _hoisted_35, toDisplayString(nodeDetail.value.path), 1)]),
								createBaseVNode("div", _hoisted_36, [_cache[35] || (_cache[35] = createBaseVNode("span", { class: "dsm-detail-label" }, "节点类型", -1)), createVNode(unref(component$2), { type: nodeDetail.value.ephemeral ? "warning" : "info" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(nodeDetail.value.ephemeral ? "临时节点 (Ephemeral)" : "持久节点 (Persistent)"), 1)]),
									_: 1
								}, 8, ["type"])]),
								createBaseVNode("div", _hoisted_37, [_cache[36] || (_cache[36] = createBaseVNode("span", { class: "dsm-detail-label" }, "创建时间 (ctime)", -1)), createBaseVNode("span", _hoisted_38, toDisplayString(nodeDetail.value.createdAt || "—"), 1)]),
								createBaseVNode("div", _hoisted_39, [_cache[37] || (_cache[37] = createBaseVNode("span", { class: "dsm-detail-label" }, "修改时间 (mtime)", -1)), createBaseVNode("span", _hoisted_40, toDisplayString(nodeDetail.value.updatedAt || "—"), 1)]),
								createBaseVNode("div", _hoisted_41, [_cache[38] || (_cache[38] = createBaseVNode("span", { class: "dsm-detail-label" }, "数据版本 (version)", -1)), createBaseVNode("span", _hoisted_42, toDisplayString(nodeDetail.value.version), 1)]),
								createBaseVNode("div", _hoisted_43, [_cache[39] || (_cache[39] = createBaseVNode("span", { class: "dsm-detail-label" }, "子节点版本 (cversion)", -1)), createBaseVNode("span", _hoisted_44, toDisplayString(nodeDetail.value.cversion ?? 0), 1)]),
								createBaseVNode("div", _hoisted_45, [_cache[40] || (_cache[40] = createBaseVNode("span", { class: "dsm-detail-label" }, "ACL 版本 (aversion)", -1)), createBaseVNode("span", _hoisted_46, toDisplayString(nodeDetail.value.aversion ?? 0), 1)]),
								createBaseVNode("div", _hoisted_47, [_cache[41] || (_cache[41] = createBaseVNode("span", { class: "dsm-detail-label" }, "子节点数 (numChildren)", -1)), createBaseVNode("span", _hoisted_48, toDisplayString(nodeDetail.value.numChildren), 1)]),
								createBaseVNode("div", _hoisted_49, [_cache[42] || (_cache[42] = createBaseVNode("span", { class: "dsm-detail-label" }, "数据长度 (dataLength)", -1)), createBaseVNode("span", _hoisted_50, toDisplayString(nodeDetail.value.dataLength), 1)]),
								createBaseVNode("div", _hoisted_51, [_cache[43] || (_cache[43] = createBaseVNode("span", { class: "dsm-detail-label" }, "创建 zxid (czxid)", -1)), createBaseVNode("span", _hoisted_52, toDisplayString(nodeDetail.value.czxid ?? "—"), 1)]),
								createBaseVNode("div", _hoisted_53, [_cache[44] || (_cache[44] = createBaseVNode("span", { class: "dsm-detail-label" }, "修改 zxid (mzxid)", -1)), createBaseVNode("span", _hoisted_54, toDisplayString(nodeDetail.value.mzxid ?? "—"), 1)]),
								createBaseVNode("div", _hoisted_55, [_cache[45] || (_cache[45] = createBaseVNode("span", { class: "dsm-detail-label" }, "子节点 zxid (pzxid)", -1)), createBaseVNode("span", _hoisted_56, toDisplayString(nodeDetail.value.pzxid ?? "—"), 1)]),
								createBaseVNode("div", _hoisted_57, [_cache[46] || (_cache[46] = createBaseVNode("span", { class: "dsm-detail-label" }, "临时节点会话 (ephemeralOwner)", -1)), createBaseVNode("span", _hoisted_58, toDisplayString(nodeDetail.value.ephemeral ? nodeDetail.value.ephemeralOwner ?? "—" : "0 (持久)"), 1)])
							]), createBaseVNode("div", _hoisted_59, [createBaseVNode("div", _hoisted_60, [createBaseVNode("div", {
								class: normalizeClass(["dsm-tab", { active: detailTab.value === "data" }]),
								onClick: _cache[5] || (_cache[5] = ($event) => detailTab.value = "data")
							}, "节点数据", 2), createBaseVNode("div", {
								class: normalizeClass(["dsm-tab", { active: detailTab.value === "acl" }]),
								onClick: openAcl
							}, "ACL", 2)]), detailTab.value === "data" ? (openBlock(), createElementBlock("div", _hoisted_61, [createBaseVNode("div", _hoisted_62, toDisplayString(isJsonData.value ? "JSON 格式化" : "节点数据 (Data)"), 1), createBaseVNode("textarea", {
								class: "dsm-data-readonly mono",
								readonly: "",
								value: isJsonData.value ? formattedJson.value : nodeDetail.value.data || "(空)",
								rows: "8"
							}, null, 8, _hoisted_63)])) : (openBlock(), createElementBlock("div", _hoisted_64, [_cache[47] || (_cache[47] = createBaseVNode("div", { class: "dsm-data-title" }, "ACL 列表", -1)), createVNode(unref(ReTable_default), {
								data: aclList.value,
								columns: aclColumns,
								loading: aclLoading.value,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-perms": withCtx(({ row }) => [createVNode(unref(component$2), { type: "info" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(row.permsText), 1)]),
									_: 2
								}, 1024)]),
								_: 1
							}, 8, ["data", "loading"])]))])], 64)) : (openBlock(), createElementBlock("div", _hoisted_65, [createVNode(unref(ReEmpty_default), { description: nodeLoading.value ? "正在读取节点详情…" : unref(gap) || "未读取到节点详情" }, null, 8, ["description"])])),
							children.value.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_66, [_cache[48] || (_cache[48] = createBaseVNode("div", { class: "dsm-data-title" }, "子节点列表", -1)), createVNode(unref(ReTable_default), {
								data: children.value,
								columns: childColumns,
								loading: childLoading.value,
								pagination: false,
								stripe: "",
								border: ""
							}, {
								"col-type": withCtx(({ row }) => [createVNode(unref(component$2), { type: row.ephemeral ? "warning" : "info" }, {
									default: withCtx(() => [createTextVNode(toDisplayString(row.ephemeral ? "临时" : "持久"), 1)]),
									_: 2
								}, 1032, ["type"])]),
								_: 1
							}, 8, ["data", "loading"])])) : createCommentVNode("", true)
						])) : createCommentVNode("", true),
						!activePath.value ? (openBlock(), createElementBlock("div", _hoisted_67, [createVNode(unref(component$1), {
							name: "FolderOpened",
							size: "48",
							class: "dsm-empty-icon"
						}), _cache[49] || (_cache[49] = createBaseVNode("p", null, "从左侧选择节点查看详情", -1))])) : createCommentVNode("", true)
					])
				]),
				createVNode(unref(component), {
					modelValue: nodeDialogVisible.value,
					"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => nodeDialogVisible.value = $event),
					title: editing.value ? "编辑节点数据" : "新建节点",
					width: "600px"
				}, {
					footer: withCtx(() => [createVNode(unref(ReButton_default), { onClick: _cache[9] || (_cache[9] = ($event) => nodeDialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[53] || (_cache[53] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ReButton_default), {
						type: "primary",
						loading: saving.value,
						onClick: saveNode
					}, {
						icon: withCtx(() => [createVNode(unref(component$1), { name: "Check" })]),
						default: withCtx(() => [createTextVNode(toDisplayString(editing.value ? "保存" : "创建"), 1)]),
						_: 1
					}, 8, ["loading"])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_68, [
						!editing.value ? (openBlock(), createElementBlock("div", _hoisted_69, [_cache[50] || (_cache[50] = createBaseVNode("label", null, "节点路径", -1)), createVNode(unref(ReInput_default), {
							modelValue: nodeForm.path,
							"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => nodeForm.path = $event),
							placeholder: "/services/my-service"
						}, null, 8, ["modelValue"])])) : createCommentVNode("", true),
						createBaseVNode("div", _hoisted_70, [_cache[51] || (_cache[51] = createBaseVNode("label", null, "节点数据", -1)), withDirectives(createBaseVNode("textarea", {
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => nodeForm.data = $event),
							class: "dsm-node-data",
							rows: "8",
							placeholder: "输入节点数据..."
						}, null, 512), [[vModelText, nodeForm.data]])]),
						!editing.value ? (openBlock(), createElementBlock("div", _hoisted_71, [
							_cache[52] || (_cache[52] = createBaseVNode("label", null, "节点类型", -1)),
							createVNode(unref(ReSwitch_default), {
								modelValue: nodeForm.ephemeral,
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => nodeForm.ephemeral = $event),
								"aria-label": nodeForm.ephemeral ? "节点类型：临时节点" : "节点类型：持久节点",
								"active-text": "临时节点",
								"inactive-text": "持久节点"
							}, null, 8, ["modelValue", "aria-label"]),
							nodeForm.ephemeral ? (openBlock(), createElementBlock("span", _hoisted_72, " 临时节点只在管理端复用的那条 ZooKeeper 会话内存活，页面空闲约五分钟后会话回收，节点会随之消失。 ")) : createCommentVNode("", true)
						])) : createCommentVNode("", true)
					])]),
					_: 1
				}, 8, ["modelValue", "title"]),
				createVNode(unref(component), {
					modelValue: clusterVisible.value,
					"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => clusterVisible.value = $event),
					title: "ZooKeeper 集群拓扑（mntr）",
					width: "960px"
				}, {
					default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", _hoisted_73, [createVNode(unref(component$3), {
						nodes: clusterGraph.value.nodes,
						edges: clusterGraph.value.edges,
						layout: "radial",
						height: "360px",
						highlight: "group",
						minimap: clusterGraph.value.nodes.length > 2,
						"node-size": 38,
						"empty-text": "未取到集群节点（检查 4lw.commands.whitelist 是否放开 mntr）",
						onNodeClick: onClusterNodeClick,
						onNodeHover: onClusterNodeHover
					}, {
						hover: withCtx(({ node }) => [
							createBaseVNode("div", _hoisted_74, toDisplayString(node.label), 1),
							createBaseVNode("div", _hoisted_75, "角色：" + toDisplayString(node.data?.role || "—"), 1),
							createBaseVNode("div", _hoisted_76, "版本：" + toDisplayString(node.data?.zkVersion || "—"), 1),
							createBaseVNode("div", _hoisted_77, " 延迟：" + toDisplayString(node.data?.zkAvgLatency ?? "—") + " / " + toDisplayString(node.data?.zkMaxLatency ?? "—") + " ms ", 1)
						]),
						_: 1
					}, 8, [
						"nodes",
						"edges",
						"minimap"
					]), createBaseVNode("div", _hoisted_78, [clusterActive.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_79, [createBaseVNode("span", null, "mntr 详情 · " + toDisplayString(clusterActive.value.host), 1), createVNode(unref(component$2), { type: clusterActive.value.zkServerState === "leader" ? "warning" : "info" }, {
						default: withCtx(() => [createTextVNode(toDisplayString(clusterActive.value.zkServerState || "—"), 1)]),
						_: 1
					}, 8, ["type"])]), createBaseVNode("div", _hoisted_80, [(openBlock(true), createElementBlock(Fragment, null, renderList(clusterDetailRows.value, (row) => {
						return openBlock(), createElementBlock("div", {
							key: row.label,
							class: "zk-cluster__cell"
						}, [createBaseVNode("span", _hoisted_81, toDisplayString(row.label), 1), createBaseVNode("span", _hoisted_82, toDisplayString(row.value), 1)]);
					}), 128))])], 64)) : (openBlock(), createElementBlock("div", _hoisted_83, "鼠标经过或点击上方节点，查看该节点的 mntr 详情"))])])), [[_directive_loading, clusterLoading.value]]), _cache[54] || (_cache[54] = createBaseVNode("div", {
						class: "dsm-form-hint",
						style: { "margin-top": "8px" }
					}, " 四字命令 mntr 需在服务端 4lw.commands.whitelist 中放开；leader → follower 的同步边为动态虚线。 ", -1))]),
					_: 1
				}, 8, ["modelValue"])
			], 2), nodeContextMenu.visible ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: "zk-context-menu",
				style: normalizeStyle({
					left: nodeContextMenu.x + "px",
					top: nodeContextMenu.y + "px"
				})
			}, [
				createBaseVNode("div", {
					class: "zkm-item",
					onClick: _cache[12] || (_cache[12] = ($event) => menuSelect("detail"))
				}, [createVNode(unref(component$1), {
					name: "View",
					size: "14"
				}), _cache[55] || (_cache[55] = createTextVNode("查看详情", -1))]),
				createBaseVNode("div", {
					class: "zkm-item",
					onClick: _cache[13] || (_cache[13] = ($event) => menuSelect("copy"))
				}, [createVNode(unref(component$1), {
					name: "Copy",
					size: "14"
				}), _cache[56] || (_cache[56] = createTextVNode("复制路径", -1))]),
				createBaseVNode("div", {
					class: "zkm-item",
					onClick: _cache[14] || (_cache[14] = ($event) => menuSelect("edit"))
				}, [createVNode(unref(component$1), {
					name: "Edit",
					size: "14"
				}), _cache[57] || (_cache[57] = createTextVNode("编辑数据", -1))]),
				createBaseVNode("div", {
					class: "zkm-item",
					onClick: _cache[15] || (_cache[15] = ($event) => menuSelect("child"))
				}, [createVNode(unref(component$1), {
					name: "Plus",
					size: "14"
				}), _cache[58] || (_cache[58] = createTextVNode("新建子节点", -1))]),
				createBaseVNode("div", {
					class: "zkm-item",
					onClick: _cache[16] || (_cache[16] = ($event) => menuSelect("export"))
				}, [createVNode(unref(component$1), {
					name: "Download",
					size: "14"
				}), _cache[59] || (_cache[59] = createTextVNode("导出节点", -1))]),
				_cache[63] || (_cache[63] = createBaseVNode("div", { class: "zkm-divider" }, null, -1)),
				createBaseVNode("div", {
					class: "zkm-item zkm-danger",
					onClick: _cache[17] || (_cache[17] = ($event) => menuSelect("delete"))
				}, [createVNode(unref(component$1), {
					name: "Delete",
					size: "14"
				}), _cache[60] || (_cache[60] = createTextVNode("删除节点", -1))]),
				createBaseVNode("div", {
					class: "zkm-item zkm-warning",
					onClick: _cache[18] || (_cache[18] = ($event) => menuSelect("delete-tree"))
				}, [createVNode(unref(component$1), {
					name: "Delete",
					size: "14"
				}), _cache[61] || (_cache[61] = createTextVNode("递归删除（含子节点）", -1))]),
				_cache[64] || (_cache[64] = createBaseVNode("div", { class: "zkm-divider" }, null, -1)),
				createBaseVNode("div", {
					class: "zkm-item",
					onClick: _cache[19] || (_cache[19] = ($event) => menuSelect("refresh"))
				}, [createVNode(unref(component$1), {
					name: "Refresh",
					size: "14"
				}), _cache[62] || (_cache[62] = createTextVNode("刷新", -1))])
			], 4)) : createCommentVNode("", true)], 64);
		};
	}
}), [["__scopeId", "data-v-9306beea"]]);
//#endregion
export { ZookeeperManageView_default as default };
