import { D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElMessage } from "./message-BQI5cdKE.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-C2rq-Voy.js";
import { t as ReButton_default } from "./ReButton-owxlNwDO.js";
import { t as component } from "./ReStatCard-BGjVHdD2.js";
import { D as share_default, j as video_camera_default, o as chat_dot_round_default, t as alarm_clock_default, w as position_default, x as office_building_default, y as lock_default } from "./dist-Axt1Prff.js";
import { t as ReInput_default } from "./ReInput-CGHpe202.js";
import { t as component$1 } from "./ReTag-D5UpQULZ.js";
import { t as deviceApi } from "./deviceApi-Dqp1FtpS.js";
//#region ../../pages/device/src/views/DeviceOrganizationView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "dor" };
var _hoisted_2 = { class: "dor-kpis" };
var _hoisted_3 = { class: "dor-filter" };
var _hoisted_4 = { class: "dor-field dor-field--search" };
var _hoisted_5 = { class: "dor-field" };
var _hoisted_6 = { class: "dor-filter__meta" };
var _hoisted_7 = { class: "dor-ops" };
var _hoisted_8 = { class: "dor-body" };
var _hoisted_9 = { class: "dor-panel dor-panel--fill dor-tree" };
var _hoisted_10 = { class: "dor-panel__head" };
var _hoisted_11 = { class: "dor-panel__count" };
var _hoisted_12 = {
	key: 0,
	class: "dor-error"
};
var _hoisted_13 = { class: "dor-node" };
var _hoisted_14 = { class: "dor-node__name" };
var _hoisted_15 = {
	key: 0,
	class: "dor-node__count"
};
var _hoisted_16 = {
	key: 2,
	class: "dor-ghost"
};
var _hoisted_17 = { class: "dor-ghost__icon" };
var _hoisted_18 = { class: "dor-panel dor-panel--fill dor-detail" };
var _hoisted_19 = { class: "dor-panel__head" };
var _hoisted_20 = {
	key: 0,
	class: "dor-panel__count"
};
var _hoisted_21 = { class: "dor-meta" };
var _hoisted_22 = { class: "dor-meta__item" };
var _hoisted_23 = { class: "dor-meta__value" };
var _hoisted_24 = { class: "dor-meta__item" };
var _hoisted_25 = { class: "dor-meta__value dor-mono" };
var _hoisted_26 = { class: "dor-meta__item" };
var _hoisted_27 = { class: "dor-meta__value" };
var _hoisted_28 = { class: "dor-meta__item" };
var _hoisted_29 = { class: "dor-meta__value" };
var _hoisted_30 = { class: "dor-meta__item" };
var _hoisted_31 = { class: "dor-meta__value" };
var _hoisted_32 = { class: "dor-meta__item" };
var _hoisted_33 = { class: "dor-meta__value" };
var _hoisted_34 = { class: "dor-devices" };
var _hoisted_35 = {
	key: 0,
	class: "dor-devices__list"
};
var _hoisted_36 = { class: "dor-device__icon" };
var _hoisted_37 = { class: "dor-device__text" };
var _hoisted_38 = { class: "dor-device__name" };
var _hoisted_39 = { class: "dor-device__meta" };
var _hoisted_40 = {
	key: 1,
	class: "dor-devices__none"
};
var _hoisted_41 = {
	key: 1,
	class: "dor-ghost dor-ghost--small"
};
var _hoisted_42 = { class: "dor-ghost__icon" };
//#endregion
//#region ../../pages/device/src/views/DeviceOrganizationView.vue
var DeviceOrganizationView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "DeviceOrganizationView",
	setup(__props) {
		/**
		* 设备组织 —— 厂商侧组织架构与组织内设备。
		*
		* 数据来自 device-starter 的 `/api/device`：
		*   - GET  /org/tree?vendor=  组织树（扁平节点，parentId 建树）
		*   - POST /org/sync          触发厂商侧组织同步
		*   - GET  /list?orgId=       设备台账（按 deviceInfoOrgId 归属统计）
		*
		* 组织由厂商侧下发，本页只读：建树、按名称检索、统计每级设备数，
		* 不做增删改（后端也确实没有组织 CRUD）。
		*
		* @author CH
		* @since 4.0.0.42
		*/
		const TREE_PROPS = {
			children: "children",
			label: "deviceOrganizationName"
		};
		/** 大类 → 图标 */
		const CATEGORY_ICONS = {
			camera: video_camera_default,
			accessControl: lock_default,
			alarm: alarm_clock_default,
			intercom: chat_dot_round_default
		};
		const orgs = ref([]);
		const devices = ref([]);
		const tree = ref([]);
		const loading = ref(false);
		const syncing = ref(false);
		const loadError = ref("");
		const expandAll = ref(true);
		const keyword = ref("");
		const filters = reactive({ vendor: "" });
		const current = ref(null);
		const treeRef = ref(null);
		const vendorOptions = computed(() => {
			const set = /* @__PURE__ */ new Set();
			orgs.value.forEach((o) => o.deviceOrganizationVendor && set.add(o.deviceOrganizationVendor));
			return [...set].sort().map((v) => ({
				value: v,
				label: v
			}));
		});
		/** 各节点（含下级）的设备数 */
		const deviceCountByOrg = computed(() => {
			const direct = /* @__PURE__ */ new Map();
			devices.value.forEach((d) => {
				if (!d.deviceInfoOrgId) return;
				direct.set(d.deviceInfoOrgId, (direct.get(d.deviceInfoOrgId) || 0) + 1);
			});
			const total = /* @__PURE__ */ new Map();
			const walk = (n) => {
				const n_ = direct.get(n.deviceOrganizationId) || 0;
				const sum = (n.children || []).reduce((acc, c) => acc + walk(c), n_);
				total.set(n.deviceOrganizationId, sum);
				return sum;
			};
			tree.value.forEach(walk);
			return total;
		});
		const rootCount = computed(() => tree.value.length);
		const leafCount = computed(() => {
			let n = 0;
			const walk = (list) => {
				list.forEach((x) => x.children?.length ? walk(x.children) : n += 1);
			};
			walk(tree.value);
			return n;
		});
		const maxDepth = computed(() => {
			const depth = (n) => 1 + (n.children?.length ? Math.max(...n.children.map(depth)) : 0);
			return tree.value.length ? Math.max(...tree.value.map(depth)) : 0;
		});
		const childrenCount = computed(() => current.value?.children?.length || 0);
		/** 选中节点及其下级的设备 */
		const subtreeDevices = computed(() => {
			if (!current.value) return [];
			const ids = /* @__PURE__ */ new Set();
			const walk = (n) => {
				ids.add(n.deviceOrganizationId);
				(n.children || []).forEach(walk);
			};
			walk(current.value);
			return devices.value.filter((d) => ids.has(d.deviceInfoOrgId));
		});
		const kpis = computed(() => [
			{
				key: "total",
				title: "组织节点",
				value: orgs.value.length,
				desc: `根节点 ${rootCount.value} 个`,
				icon: office_building_default,
				iconColor: "var(--el-color-primary)"
			},
			{
				key: "vendor",
				title: "接入厂商",
				value: vendorOptions.value.length,
				desc: vendorOptions.value.map((v) => v.value).join(" / ") || "—",
				icon: share_default,
				iconColor: "var(--el-color-info)"
			},
			{
				key: "leaf",
				title: "末级节点",
				value: leafCount.value,
				desc: `最大层级 ${maxDepth.value} 层`,
				icon: position_default,
				iconColor: "var(--el-color-success)"
			},
			{
				key: "device",
				title: "纳入设备",
				value: devices.value.length,
				desc: "按组织归属统计",
				icon: video_camera_default,
				iconColor: "var(--metric-disk, var(--el-color-warning))"
			}
		]);
		function categoryIcon(category) {
			return CATEGORY_ICONS[category || ""] || video_camera_default;
		}
		function deviceCountOf(node) {
			return deviceCountByOrg.value.get(node.deviceOrganizationId) || 0;
		}
		/** 扁平列表 → 树。parentId 指向不存在的节点（厂商脏数据）时挂到根，避免整支丢失 */
		function buildTree(list) {
			const nodes = /* @__PURE__ */ new Map();
			list.forEach((o) => {
				nodes.set(o.deviceOrganizationId, {
					...o,
					deviceOrganizationName: o.deviceOrganizationName || o.deviceOrganizationId,
					searchText: "",
					children: []
				});
			});
			const roots = [];
			list.forEach((o) => {
				const node = nodes.get(o.deviceOrganizationId);
				const parent = o.deviceOrganizationParentId ? nodes.get(o.deviceOrganizationParentId) : void 0;
				if (parent && parent !== node) parent.children.push(node);
				else roots.push(node);
			});
			const collect = (n) => {
				const kids = n.children.map(collect).join(" ");
				n.searchText = `${n.deviceOrganizationName} ${kids}`;
				return n.searchText;
			};
			roots.forEach(collect);
			return roots;
		}
		function filterNode(value, data) {
			if (!value) return true;
			return data.searchText.toLowerCase().includes(value.toLowerCase());
		}
		async function fetchTree() {
			loading.value = true;
			loadError.value = "";
			try {
				const [orgList, deviceList] = await Promise.all([deviceApi.getOrgTree(filters.vendor || void 0), deviceApi.list()]);
				orgs.value = orgList || [];
				devices.value = deviceList || [];
				tree.value = buildTree(orgs.value);
				const keepId = current.value?.deviceOrganizationId;
				current.value = keepId ? findNode(tree.value, keepId) : tree.value[0] ?? null;
				if (current.value) treeRef.value?.setCurrentKey(current.value.deviceOrganizationId);
				if (keyword.value) treeRef.value?.filter(keyword.value);
			} catch (e) {
				orgs.value = [];
				devices.value = [];
				tree.value = [];
				current.value = null;
				loadError.value = errText(e);
				ElMessage.error(`组织架构加载失败：${loadError.value}`);
			} finally {
				loading.value = false;
			}
		}
		function findNode(list, id) {
			for (const n of list) {
				if (n.deviceOrganizationId === id) return n;
				const hit = findNode(n.children, id);
				if (hit) return hit;
			}
			return null;
		}
		/** 触发厂商侧组织同步 */
		async function onSync() {
			syncing.value = true;
			try {
				await deviceApi.syncOrg();
				ElMessage.success("组织同步已触发");
				await fetchTree();
			} catch (e) {
				ElMessage.error(`组织同步失败：${errText(e)}`);
			} finally {
				syncing.value = false;
			}
		}
		function onSelectNode(data) {
			current.value = data;
		}
		function toggleExpand() {
			expandAll.value = !expandAll.value;
			nextTick(() => {
				if (current.value) treeRef.value?.setCurrentKey(current.value.deviceOrganizationId);
				if (keyword.value) treeRef.value?.filter(keyword.value);
			});
		}
		function errText(e) {
			return e?.msg || (e instanceof Error ? e.message : String(e));
		}
		watch(keyword, (v) => treeRef.value?.filter(v));
		onMounted(fetchTree);
		return (_ctx, _cache) => {
			const _component_el_tree = resolveComponent("el-tree");
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("section", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(kpis.value, (k) => {
					return openBlock(), createBlock(unref(component), {
						key: k.key,
						size: "compact",
						title: k.title,
						value: k.value,
						desc: k.desc,
						icon: k.icon,
						"icon-color": k.iconColor
					}, null, 8, [
						"title",
						"value",
						"desc",
						"icon",
						"icon-color"
					]);
				}), 128))]),
				createBaseVNode("section", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createVNode(unref(ReInput_default), {
						modelValue: keyword.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event),
						placeholder: "搜索组织名称...",
						clearable: "",
						"prefix-icon": "Search"
					}, null, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_5, [createVNode(unref(ReSelect_default), {
						modelValue: filters.vendor,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => filters.vendor = $event),
						placeholder: "全部厂商",
						clearable: "",
						options: vendorOptions.value,
						onChange: fetchTree
					}, null, 8, ["modelValue", "options"])]),
					createBaseVNode("span", _hoisted_6, toDisplayString(orgs.value.length) + " 个节点 · " + toDisplayString(devices.value.length) + " 台设备 ", 1),
					createBaseVNode("div", _hoisted_7, [
						createVNode(unref(ReButton_default), {
							icon: "Sort",
							layout: "square",
							tip: expandAll.value ? "全部收起" : "全部展开",
							onClick: toggleExpand
						}, null, 8, ["tip"]),
						createVNode(unref(ReButton_default), {
							icon: "RefreshRight",
							layout: "square",
							tip: "刷新组织",
							loading: loading.value,
							onClick: fetchTree
						}, null, 8, ["loading"]),
						createVNode(unref(ReButton_default), {
							icon: "Share",
							"show-text": true,
							type: "primary",
							loading: syncing.value,
							onClick: onSync
						}, {
							default: withCtx(() => [..._cache[2] || (_cache[2] = [createTextVNode(" 同步组织 ", -1)])]),
							_: 1
						}, 8, ["loading"])
					])
				]),
				createBaseVNode("div", _hoisted_8, [createBaseVNode("section", _hoisted_9, [
					createBaseVNode("header", _hoisted_10, [
						_cache[3] || (_cache[3] = createBaseVNode("span", { class: "dor-panel__bar" }, null, -1)),
						_cache[4] || (_cache[4] = createBaseVNode("span", null, "组织架构", -1)),
						createBaseVNode("span", _hoisted_11, toDisplayString(rootCount.value) + " 个根节点", 1)
					]),
					loadError.value ? (openBlock(), createElementBlock("div", _hoisted_12, [createBaseVNode("span", null, toDisplayString(loadError.value), 1), createVNode(unref(ReButton_default), {
						icon: "RefreshRight",
						layout: "square",
						tip: "重试",
						loading: loading.value,
						onClick: fetchTree
					}, null, 8, ["loading"])])) : createCommentVNode("", true),
					tree.value.length ? (openBlock(), createBlock(_component_el_tree, {
						ref_key: "treeRef",
						ref: treeRef,
						key: `org-tree-${expandAll.value}`,
						data: tree.value,
						props: TREE_PROPS,
						"node-key": "deviceOrganizationId",
						"filter-node-method": filterNode,
						"default-expand-all": expandAll.value,
						"expand-on-click-node": false,
						"highlight-current": "",
						class: "dor-tree__el",
						onNodeClick: onSelectNode
					}, {
						default: withCtx(({ data }) => [createBaseVNode("span", _hoisted_13, [createBaseVNode("span", _hoisted_14, toDisplayString(data.deviceOrganizationName), 1), deviceCountOf(data) ? (openBlock(), createElementBlock("span", _hoisted_15, toDisplayString(deviceCountOf(data)), 1)) : createCommentVNode("", true)])]),
						_: 1
					}, 8, ["data", "default-expand-all"])) : (openBlock(), createElementBlock("article", _hoisted_16, [
						createBaseVNode("span", _hoisted_17, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(office_building_default))]),
							_: 1
						})]),
						_cache[5] || (_cache[5] = createBaseVNode("p", { class: "dor-ghost__title" }, "暂无组织节点", -1)),
						_cache[6] || (_cache[6] = createBaseVNode("p", { class: "dor-ghost__desc" }, " 组织由厂商侧下发，点「同步组织」把厂商的组织架构拉过来；没接平台账号时该列表为空。 ", -1))
					]))
				]), createBaseVNode("section", _hoisted_18, [createBaseVNode("header", _hoisted_19, [
					_cache[7] || (_cache[7] = createBaseVNode("span", { class: "dor-panel__bar" }, null, -1)),
					_cache[8] || (_cache[8] = createBaseVNode("span", null, "节点详情", -1)),
					current.value ? (openBlock(), createElementBlock("span", _hoisted_20, toDisplayString(current.value.deviceOrganizationName), 1)) : createCommentVNode("", true)
				]), current.value ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_21, [
					createBaseVNode("div", _hoisted_22, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "dor-meta__label" }, "厂商", -1)), createBaseVNode("span", _hoisted_23, toDisplayString(current.value.deviceOrganizationVendor || "—"), 1)]),
					createBaseVNode("div", _hoisted_24, [_cache[10] || (_cache[10] = createBaseVNode("span", { class: "dor-meta__label" }, "节点 ID", -1)), createBaseVNode("span", _hoisted_25, toDisplayString(current.value.deviceOrganizationId), 1)]),
					createBaseVNode("div", _hoisted_26, [_cache[11] || (_cache[11] = createBaseVNode("span", { class: "dor-meta__label" }, "上级节点", -1)), createBaseVNode("span", _hoisted_27, toDisplayString(current.value.deviceOrganizationParentId || "（根节点）"), 1)]),
					createBaseVNode("div", _hoisted_28, [_cache[12] || (_cache[12] = createBaseVNode("span", { class: "dor-meta__label" }, "组织路径", -1)), createBaseVNode("span", _hoisted_29, toDisplayString(current.value.deviceOrganizationPath || "—"), 1)]),
					createBaseVNode("div", _hoisted_30, [_cache[13] || (_cache[13] = createBaseVNode("span", { class: "dor-meta__label" }, "下级节点", -1)), createBaseVNode("span", _hoisted_31, toDisplayString(childrenCount.value) + " 个", 1)]),
					createBaseVNode("div", _hoisted_32, [_cache[14] || (_cache[14] = createBaseVNode("span", { class: "dor-meta__label" }, "含下级设备", -1)), createBaseVNode("span", _hoisted_33, toDisplayString(subtreeDevices.value.length) + " 台", 1)])
				]), createBaseVNode("div", _hoisted_34, [_cache[15] || (_cache[15] = createBaseVNode("span", { class: "dor-devices__title" }, "该节点（含下级）的设备", -1)), subtreeDevices.value.length ? (openBlock(), createElementBlock("div", _hoisted_35, [(openBlock(true), createElementBlock(Fragment, null, renderList(subtreeDevices.value, (d) => {
					return openBlock(), createElementBlock("article", {
						key: d.deviceInfoId,
						class: "dor-device"
					}, [
						createBaseVNode("span", _hoisted_36, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(categoryIcon(d.deviceInfoCategory))))]),
							_: 2
						}, 1024)]),
						createBaseVNode("div", _hoisted_37, [createBaseVNode("span", _hoisted_38, toDisplayString(d.deviceInfoName || d.deviceInfoId), 1), createBaseVNode("span", _hoisted_39, toDisplayString(d.deviceInfoIp || "无 IP") + " · " + toDisplayString(d.deviceInfoVendor || "未知厂商"), 1)]),
						createVNode(unref(component$1), {
							type: d.deviceInfoOnline ? "success" : "info",
							size: "small",
							effect: "plain"
						}, {
							default: withCtx(() => [createTextVNode(toDisplayString(d.deviceInfoOnline ? "在线" : "离线"), 1)]),
							_: 2
						}, 1032, ["type"])
					]);
				}), 128))])) : (openBlock(), createElementBlock("span", _hoisted_40, "该组织下暂无设备"))])], 64)) : (openBlock(), createElementBlock("article", _hoisted_41, [
					createBaseVNode("span", _hoisted_42, [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(position_default))]),
						_: 1
					})]),
					_cache[16] || (_cache[16] = createBaseVNode("p", { class: "dor-ghost__title" }, "选中左侧节点查看详情", -1)),
					_cache[17] || (_cache[17] = createBaseVNode("p", { class: "dor-ghost__desc" }, "节点下的设备按组织归属统计，只读展示。", -1))
				]))])])
			]);
		};
	}
}), [["__scopeId", "data-v-718ba70d"]]);
//#endregion
export { DeviceOrganizationView_default as default };
