import { Ct as resolveDirective, D as createVNode, E as createTextVNode, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { _ as getGroups, a as delGroup, g as getGroupTree, j as saveGroup } from "./api-CRz4q4qT.js";
//#region ../../pages/server/src/views/ScGroupTree.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "group-tree sc-page" };
var _hoisted_2 = { class: "group-layout" };
var _hoisted_3 = { class: "tree-header" };
var _hoisted_4 = { class: "tree-search" };
var _hoisted_5 = { class: "tree-label" };
var _hoisted_6 = {
	key: 1,
	class: "color-dot color-dot--default"
};
var _hoisted_7 = { class: "node-name" };
var _hoisted_8 = {
	key: 2,
	class: "node-badge"
};
var _hoisted_9 = {
	key: 0,
	class: "detail-content"
};
var _hoisted_10 = { class: "detail-header" };
var _hoisted_11 = { class: "detail-title-area" };
var _hoisted_12 = { class: "detail-title" };
var _hoisted_13 = { class: "detail-desc" };
var _hoisted_14 = { class: "detail-actions" };
var _hoisted_15 = { class: "info-grid" };
var _hoisted_16 = { class: "info-card" };
var _hoisted_17 = { class: "info-value" };
var _hoisted_18 = { class: "info-card" };
var _hoisted_19 = { class: "info-value info-value--success" };
var _hoisted_20 = { class: "info-card" };
var _hoisted_21 = { class: "info-value" };
var _hoisted_22 = { class: "detail-section" };
var _hoisted_23 = { class: "detail-body" };
var _hoisted_24 = { class: "detail-item" };
var _hoisted_25 = { class: "detail-value" };
var _hoisted_26 = { class: "detail-item" };
var _hoisted_27 = { class: "detail-value" };
var _hoisted_28 = { class: "detail-item" };
var _hoisted_29 = { class: "detail-value" };
var _hoisted_30 = { class: "detail-item" };
var _hoisted_31 = { class: "detail-value" };
var _hoisted_32 = { key: 1 };
var _hoisted_33 = { class: "detail-item detail-item--full" };
var _hoisted_34 = { class: "detail-value" };
var _hoisted_35 = { class: "detail-section" };
var _hoisted_36 = {
	key: 1,
	class: "host-list"
};
var _hoisted_37 = { class: "host-name" };
var _hoisted_38 = { class: "host-ip" };
var _hoisted_39 = { class: "color-field" };
//#endregion
//#region ../../pages/server/src/views/ScGroupTree.vue
var ScGroupTree_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ScGroupTree",
	setup(__props) {
		const loading = ref(false);
		/** 保存分组中：提交按钮 loading，防重复提交 */
		const saving = ref(false);
		const treeData = ref([]);
		const flatGroups = ref([]);
		const searchKeyword = ref("");
		const formVisible = ref(false);
		const currentNode = ref(null);
		const editingId = ref(null);
		const form = ref({
			msServerGroupName: "",
			msServerGroupParentId: null,
			msServerGroupSort: 0,
			msServerGroupRemark: "",
			msServerGroupColor: ""
		});
		/** 预设分组色板 */
		const colorPresets = [
			"#6d5dfc",
			"#4f8ff7",
			"#22b895",
			"#f7b500",
			"#fb6f5b",
			"#f74f87",
			"#8a6de6",
			"#0ea5e9"
		];
		const totalGroups = computed(() => flatGroups.value.length);
		const rootGroups = computed(() => treeData.value.length);
		computed(() => totalGroups.value - rootGroups.value);
		/** 过滤后的树数据 */
		const filteredTreeData = computed(() => {
			if (!searchKeyword.value) return treeData.value;
			function filterNodes(nodes) {
				return nodes.map((node) => {
					const children = node.children ? filterNodes(node.children) : [];
					if (node.name.includes(searchKeyword.value) || children.length) return {
						...node,
						children
					};
					return null;
				}).filter(Boolean);
			}
			return filterNodes(treeData.value);
		});
		/** 统计分组下的主机数 */
		function hostCount(node) {
			return flatGroups.value.find((x) => x.id === node.id)?.msServerHostCount ?? 0;
		}
		/** 统计在线主机数 */
		function onlineHostCount(node) {
			return flatGroups.value.find((x) => x.id === node.id)?.msServerHostOnlineCount ?? 0;
		}
		/** 获取子分组数 */
		function subGroupCount(node) {
			return node.children?.length || 0;
		}
		onMounted(refresh);
		async function refresh() {
			loading.value = true;
			try {
				const [tree, flat] = await Promise.all([getGroupTree().catch(() => []), getGroups().catch(() => [])]);
				treeData.value = Array.isArray(tree) ? tree : [];
				flatGroups.value = Array.isArray(flat) ? flat : [];
			} catch (e) {
				message.error(e.message);
			} finally {
				loading.value = false;
			}
		}
		function onNodeClick(node) {
			currentNode.value = node;
		}
		function openCreate(parentId = 0) {
			editingId.value = null;
			form.value = {
				msServerGroupName: "",
				msServerGroupParentId: parentId || null,
				msServerGroupSort: 0,
				msServerGroupRemark: "",
				msServerGroupColor: ""
			};
			formVisible.value = true;
		}
		function openEdit(node) {
			editingId.value = node.id;
			const anyNode = node;
			form.value = {
				msServerGroupName: node.name,
				msServerGroupParentId: node.parentId || null,
				msServerGroupSort: node.sort,
				msServerGroupRemark: node.remark || "",
				msServerGroupColor: String(anyNode.msServerGroupColor ?? anyNode.color ?? "")
			};
			formVisible.value = true;
		}
		async function submitForm() {
			if (!form.value.msServerGroupName.trim()) {
				message.warning("分组名称不能为空");
				return;
			}
			if (saving.value) return;
			const payload = {
				...form.value,
				msServerGroupParentId: form.value.msServerGroupParentId ?? 0
			};
			saving.value = true;
			try {
				await saveGroup(editingId.value, payload);
				message.success("已保存");
				formVisible.value = false;
				refresh();
			} finally {
				saving.value = false;
			}
		}
		async function removeGroup(node) {
			await message.confirm(`确认删除分组 ${node.name}? 若存在子分组或主机将拒绝删除`, "删除");
			await delGroup(node.id);
			message.success("已删除");
			refresh();
		}
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_FolderOpened = resolveComponent("FolderOpened");
			const _component_ReEmptyState = resolveComponent("ReEmptyState");
			const _component_ReTree = resolveComponent("ReTree");
			const _component_ReCard = resolveComponent("ReCard");
			const _component_ReFormItem = resolveComponent("ReFormItem");
			const _component_ReTreeSelect = resolveComponent("ReTreeSelect");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_el_color_picker = resolveComponent("el-color-picker");
			const _component_ReForm = resolveComponent("ReForm");
			const _component_ReDialog = resolveComponent("ReDialog");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [withDirectives((openBlock(), createBlock(_component_ReCard, { class: "tree-card" }, {
				default: withCtx(() => [
					createBaseVNode("div", _hoisted_3, [_cache[13] || (_cache[13] = createBaseVNode("span", { class: "tree-title" }, "分组列表", -1)), createVNode(_component_ReButton, {
						icon: "Plus",
						layout: "square",
						tip: "新建分组",
						onClick: _cache[0] || (_cache[0] = ($event) => openCreate())
					})]),
					createBaseVNode("div", _hoisted_4, [createVNode(_component_ReInput, {
						modelValue: searchKeyword.value,
						"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => searchKeyword.value = $event),
						placeholder: "搜索分组...",
						clearable: ""
					}, {
						prefix: withCtx(() => [createVNode(_component_ReIcon, { icon: "Search" })]),
						_: 1
					}, 8, ["modelValue"])]),
					!loading.value && filteredTreeData.value.length === 0 ? (openBlock(), createBlock(_component_ReEmptyState, {
						key: 0,
						title: "暂无分组",
						description: "点击右上角「新建根分组」创建第一个分组",
						size: "compact"
					}, {
						icon: withCtx(() => [createVNode(_component_FolderOpened)]),
						_: 1
					})) : (openBlock(), createBlock(_component_ReTree, {
						key: 1,
						data: filteredTreeData.value,
						"node-key": "id",
						props: {
							children: "children",
							label: "name"
						},
						"default-expand-all": "",
						"highlight-current": "",
						onNodeClick
					}, {
						label: withCtx(({ node }) => [createBaseVNode("span", _hoisted_5, [
							node?.color ? (openBlock(), createElementBlock("span", {
								key: 0,
								class: "color-dot",
								style: normalizeStyle({ background: node.color })
							}, null, 4)) : (openBlock(), createElementBlock("span", _hoisted_6)),
							createBaseVNode("span", _hoisted_7, toDisplayString(node?.name), 1),
							hostCount(node) > 0 ? (openBlock(), createElementBlock("span", _hoisted_8, toDisplayString(hostCount(node)), 1)) : createCommentVNode("", true)
						])]),
						_: 1
					}, 8, ["data"]))
				]),
				_: 1
			})), [[_directive_loading, loading.value]]), createVNode(_component_ReCard, { class: "detail-card" }, {
				default: withCtx(() => [currentNode.value ? (openBlock(), createElementBlock("div", _hoisted_9, [
					createBaseVNode("div", _hoisted_10, [createBaseVNode("div", _hoisted_11, [createBaseVNode("h2", _hoisted_12, toDisplayString(currentNode.value.name), 1), createBaseVNode("p", _hoisted_13, toDisplayString(currentNode.value.remark || "暂无描述"), 1)]), createBaseVNode("div", _hoisted_14, [
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Plus",
							onClick: _cache[2] || (_cache[2] = ($event) => openCreate(currentNode.value.id))
						}, {
							default: withCtx(() => [..._cache[14] || (_cache[14] = [createTextVNode("添加子分组", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "EditPen",
							onClick: _cache[3] || (_cache[3] = ($event) => openEdit(currentNode.value))
						}, {
							default: withCtx(() => [..._cache[15] || (_cache[15] = [createTextVNode("编辑", -1)])]),
							_: 1
						}),
						createVNode(_component_ReButton, {
							"show-text": "",
							icon: "Delete",
							type: "danger",
							onClick: _cache[4] || (_cache[4] = ($event) => removeGroup(currentNode.value))
						}, {
							default: withCtx(() => [..._cache[16] || (_cache[16] = [createTextVNode("删除", -1)])]),
							_: 1
						})
					])]),
					createBaseVNode("div", _hoisted_15, [
						createBaseVNode("div", _hoisted_16, [_cache[17] || (_cache[17] = createBaseVNode("div", { class: "info-label" }, "主机总数", -1)), createBaseVNode("div", _hoisted_17, toDisplayString(hostCount(currentNode.value)), 1)]),
						createBaseVNode("div", _hoisted_18, [_cache[18] || (_cache[18] = createBaseVNode("div", { class: "info-label" }, "在线主机", -1)), createBaseVNode("div", _hoisted_19, toDisplayString(onlineHostCount(currentNode.value)), 1)]),
						createBaseVNode("div", _hoisted_20, [_cache[19] || (_cache[19] = createBaseVNode("div", { class: "info-label" }, "子分组", -1)), createBaseVNode("div", _hoisted_21, toDisplayString(subGroupCount(currentNode.value)), 1)])
					]),
					createBaseVNode("div", _hoisted_22, [_cache[25] || (_cache[25] = createBaseVNode("h3", { class: "section-title" }, "分组信息", -1)), createBaseVNode("div", _hoisted_23, [
						createBaseVNode("div", _hoisted_24, [_cache[20] || (_cache[20] = createBaseVNode("div", { class: "detail-label" }, "分组 ID", -1)), createBaseVNode("div", _hoisted_25, toDisplayString(currentNode.value.id), 1)]),
						createBaseVNode("div", _hoisted_26, [_cache[21] || (_cache[21] = createBaseVNode("div", { class: "detail-label" }, "分组名称", -1)), createBaseVNode("div", _hoisted_27, toDisplayString(currentNode.value.name), 1)]),
						createBaseVNode("div", _hoisted_28, [_cache[22] || (_cache[22] = createBaseVNode("div", { class: "detail-label" }, "排序", -1)), createBaseVNode("div", _hoisted_29, toDisplayString(currentNode.value.sort || 0), 1)]),
						createBaseVNode("div", _hoisted_30, [_cache[23] || (_cache[23] = createBaseVNode("div", { class: "detail-label" }, "颜色", -1)), createBaseVNode("div", _hoisted_31, [currentNode.value.color ? (openBlock(), createElementBlock("span", {
							key: 0,
							class: "color-dot",
							style: normalizeStyle({ background: currentNode.value.color })
						}, null, 4)) : (openBlock(), createElementBlock("span", _hoisted_32, "默认"))])]),
						createBaseVNode("div", _hoisted_33, [_cache[24] || (_cache[24] = createBaseVNode("div", { class: "detail-label" }, "备注", -1)), createBaseVNode("div", _hoisted_34, toDisplayString(currentNode.value.remark || "无"), 1)])
					])]),
					createBaseVNode("div", _hoisted_35, [_cache[28] || (_cache[28] = createBaseVNode("h3", { class: "section-title" }, "关联主机", -1)), hostCount(currentNode.value) === 0 ? (openBlock(), createBlock(_component_ReEmptyState, {
						key: 0,
						title: "暂无关联主机",
						description: "该分组下暂无主机",
						size: "compact"
					})) : (openBlock(), createElementBlock("div", _hoisted_36, [(openBlock(true), createElementBlock(Fragment, null, renderList(hostCount(currentNode.value), (i) => {
						return openBlock(), createElementBlock("div", {
							class: "host-item",
							key: i
						}, [
							_cache[26] || (_cache[26] = createBaseVNode("div", { class: "host-status host-status--online" }, null, -1)),
							createBaseVNode("span", _hoisted_37, "主机 " + toDisplayString(i), 1),
							createBaseVNode("span", _hoisted_38, "192.168.1." + toDisplayString(i), 1),
							_cache[27] || (_cache[27] = createBaseVNode("span", { class: "host-os" }, "Linux", -1))
						]);
					}), 128))]))])
				])) : (openBlock(), createBlock(_component_ReEmptyState, {
					key: 1,
					title: "选择分组查看详情",
					description: "点击左侧分组查看详细信息",
					size: "compact"
				}, {
					icon: withCtx(() => [createVNode(_component_FolderOpened)]),
					_: 1
				}))]),
				_: 1
			})]), createVNode(_component_ReDialog, {
				modelValue: formVisible.value,
				"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => formVisible.value = $event),
				title: editingId.value ? "编辑分组" : "新建分组",
				width: "480",
				height: 380,
				"close-on-click-modal": false
			}, {
				footer: withCtx(() => [createVNode(_component_ReButton, { onClick: _cache[11] || (_cache[11] = ($event) => formVisible.value = false) }, {
					default: withCtx(() => [..._cache[29] || (_cache[29] = [createTextVNode("取消", -1)])]),
					_: 1
				}), createVNode(_component_ReButton, {
					type: "primary",
					loading: saving.value,
					icon: "Check",
					"show-text": true,
					onClick: submitForm
				}, {
					default: withCtx(() => [..._cache[30] || (_cache[30] = [createTextVNode("保存", -1)])]),
					_: 1
				}, 8, ["loading"])]),
				default: withCtx(() => [createVNode(_component_ReForm, {
					"label-width": "80px",
					"label-position": "right"
				}, {
					default: withCtx(() => [
						createVNode(_component_ReFormItem, {
							label: "名称",
							required: ""
						}, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.value.msServerGroupName,
								"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.value.msServerGroupName = $event),
								placeholder: "分组名称"
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, { label: "父分组" }, {
							default: withCtx(() => [createVNode(_component_ReTreeSelect, {
								modelValue: form.value.msServerGroupParentId,
								"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.value.msServerGroupParentId = $event),
								data: treeData.value,
								props: {
									children: "children",
									label: "name",
									value: "id"
								},
								placeholder: "根分组",
								clearable: "",
								filterable: "",
								style: { "width": "100%" }
							}, null, 8, ["modelValue", "data"])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, { label: "排序" }, {
							default: withCtx(() => [createVNode(_component_ReInputNumber, {
								modelValue: form.value.msServerGroupSort,
								"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => form.value.msServerGroupSort = $event),
								min: 0,
								style: { "width": "100%" }
							}, null, 8, ["modelValue"])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, { label: "颜色" }, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_39, [createVNode(_component_el_color_picker, {
								modelValue: form.value.msServerGroupColor,
								"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.value.msServerGroupColor = $event),
								predefine: colorPresets
							}, null, 8, ["modelValue"]), createVNode(_component_ReInput, {
								modelValue: form.value.msServerGroupColor,
								"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => form.value.msServerGroupColor = $event),
								placeholder: "可选，如 #6d5dfc",
								clearable: "",
								style: { "flex": "1" }
							}, null, 8, ["modelValue"])])]),
							_: 1
						}),
						createVNode(_component_ReFormItem, { label: "备注" }, {
							default: withCtx(() => [createVNode(_component_ReInput, {
								modelValue: form.value.msServerGroupRemark,
								"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => form.value.msServerGroupRemark = $event),
								type: "textarea",
								rows: 2
							}, null, 8, ["modelValue"])]),
							_: 1
						})
					]),
					_: 1
				})]),
				_: 1
			}, 8, ["modelValue", "title"])]);
		};
	}
}), [["__scopeId", "data-v-211d094e"]]);
//#endregion
export { ScGroupTree_default as default };
