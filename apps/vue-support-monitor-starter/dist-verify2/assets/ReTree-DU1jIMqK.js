import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { n as ElFormItem, t as ElForm } from "./form-lTIDC--y.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElTree } from "./tree-BVPjmgDt.js";
import { in as http, t as useDataSource } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/ui/src/components/ReTree/ReTree.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-tree__toolbar"
};
var _hoisted_2 = { class: "re-tree__node-label" };
//#endregion
//#region ../../packages/ui/src/components/ReTree/ReTree.vue
var ReTree_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReTree",
	props: {
		data: {
			type: [Array, Function],
			default: void 0
		},
		url: { default: void 0 },
		loader: {
			type: Function,
			default: void 0
		},
		defaultExpandedKeys: { default: () => [] },
		nodeKey: { default: "id" },
		emptyText: { default: "暂无数据" },
		renderAfterExpand: {
			type: Boolean,
			default: true
		},
		checkStrictly: {
			type: Boolean,
			default: false
		},
		defaultExpandAll: {
			type: Boolean,
			default: false
		},
		expandOnClickNode: {
			type: Boolean,
			default: true
		},
		checkOnClickNode: {
			type: Boolean,
			default: false
		},
		checkDescendants: {
			type: Boolean,
			default: false
		},
		autoExpandParent: {
			type: Boolean,
			default: true
		},
		defaultCheckedKeys: { default: () => [] },
		currentNodeKey: {},
		showCheckbox: {
			type: Boolean,
			default: false
		},
		draggable: {
			type: Boolean,
			default: false
		},
		allowDrag: {
			type: Function,
			default: void 0
		},
		allowDrop: {
			type: Function,
			default: void 0
		},
		props: { default: void 0 },
		lazy: {
			type: Boolean,
			default: true
		},
		highlightCurrent: {
			type: Boolean,
			default: false
		},
		load: {
			type: Function,
			default: void 0
		},
		filterNodeMethod: {
			type: Function,
			default: void 0
		},
		accordion: {
			type: Boolean,
			default: false
		},
		indent: { default: 16 },
		icon: { default: void 0 },
		highlightClass: { default: "" },
		editable: {
			type: Boolean,
			default: false
		},
		showToolbar: {
			type: Boolean,
			default: false
		},
		enableAdd: {
			type: Boolean,
			default: false
		},
		enableEdit: {
			type: Boolean,
			default: false
		},
		enableRemove: {
			type: Boolean,
			default: false
		},
		enableExpandAll: {
			type: Boolean,
			default: false
		},
		enableCollapseAll: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"node-click",
		"node-contextmenu",
		"check-change",
		"check",
		"current-change",
		"node-expand",
		"node-collapse",
		"node-drag-start",
		"node-drag-enter",
		"node-drag-leave",
		"node-drag-over",
		"node-drag-end",
		"node-drop",
		"re-edit",
		"re-remove",
		"re-add",
		"update:data"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		/** el-tree 公开方法类型契约（本地宽松声明，规避官方类型与 ReTreeItem 的差异） */
		const treeRef = ref(null);
		/**
		* 数据源类型：data 传数组 = local；data 传函数等价于 loader；url = url；loader = loader。
		* 优先级 data(函数) &gt; loader &gt; url，与 ReSelect / ReTable 的 data+loader 口径一致。
		*/
		const sourceType = computed(() => {
			if (typeof props.data === "function") return "loader";
			if (Array.isArray(props.data)) return "local";
			if (typeof props.loader === "function") return "loader";
			if (props.url !== void 0) return "url";
			return "local";
		});
		/** 生效的远程加载器：data 传函数优先，其次 loader */
		const activeLoader = computed(() => typeof props.data === "function" ? props.data : props.loader);
		const treeData = ref(Array.isArray(props.data) ? props.data : []);
		const { loading: rootLoading, data: rootData, reload: rootReload } = useDataSource(() => {
			if (sourceType.value === "url") return http().get(props.url).then((r) => {
				const data = r.data;
				return Array.isArray(data) ? data : data.data ?? [];
			}).catch(() => []);
			if (sourceType.value === "loader") {
				if (typeof activeLoader.value === "function") return activeLoader.value(null) ?? [];
				return [];
			}
			return Array.isArray(props.data) ? props.data : [];
		});
		watch(rootData, (v) => {
			if (v) {
				treeData.value = v;
				emit("update:data", v);
			}
		}, { immediate: true });
		watch(() => props.data, (v) => {
			if (sourceType.value === "local" && Array.isArray(v)) treeData.value = v;
		});
		const loadFunction = (node, resolve) => {
			if (sourceType.value === "local") {
				const children = node.data.children;
				resolve(children ?? []);
				return;
			}
			const parentId = node.key;
			if (props.url && parentId) {
				const fullUrl = `${props.url}${props.url.includes("?") ? "&" : "?"}parentId=${encodeURIComponent(parentId)}`;
				http().get(fullUrl).then((r) => {
					const data = r.data;
					resolve(Array.isArray(data) ? data : data.data ?? []);
				}).catch(() => resolve([]));
				return;
			}
			if (activeLoader.value && parentId) {
				Promise.resolve(activeLoader.value(node.data)).then(resolve).catch(() => resolve([]));
				return;
			}
			resolve([]);
		};
		const lazyComputed = computed(() => sourceType.value !== "local" && !!props.lazy);
		const options = computed(() => props.props || {
			children: "children",
			label: "label",
			disabled: "disabled"
		});
		/** 当前 label 字段名（供表单 v-model 使用） */
		const labelKey = computed(() => getLabelKey());
		/**
		* 弹窗「名称」输入框的绑定值。
		*
		* <p>原来这里写的是 {@code v-model="(formData[labelKey] as string)"} —— 用 `as` 把类型
		* 直接糊过去。本仓对同一处问题（`ReTree/index.vue`）采用的是可写 computed 收口，
		* 这里与之一致：读时把非字符串按显示需要转成字符串，写时只改 {@link labelKey} 这一个字段，
		* 读写落在同一处，运行时行为和原先完全一致，同时不再靠 `as` 绕过类型检查。</p>
		*
		* <p>与 `CytoscapeGraph.vue` 里「宁可删掉调了不存在 API 的那行、也不用 `as any` 糊」
		* 是同一口径：`as` 只让检查闭嘴，不会让代码变对。</p>
		*/
		const labelInput = computed({
			get() {
				const v = formData.value[labelKey.value];
				if (typeof v === "string") return v;
				return v === void 0 || v === null ? "" : String(v);
			},
			set(v) {
				formData.value = {
					...formData.value,
					[labelKey.value]: v
				};
			}
		});
		const resolvedProps = computed(() => ({
			children: options.value.children || "children",
			label: options.value.label || "label",
			disabled: options.value.disabled || "disabled",
			isLeaf: options.value.isLeaf,
			class: options.value.class
		}));
		const draggableComputed = computed(() => props.draggable);
		const dialogVisible = ref(false);
		const dialogTitle = ref("");
		const editingNode = ref(null);
		const editingNodeData = ref(null);
		const editingParentNode = ref(null);
		const isEditing = ref(false);
		const formData = ref({});
		function getLabelKey() {
			return options.value.label || "label";
		}
		function onNodeClick(data, node, ..._rest) {
			emit("node-click", data, node, _rest[0]);
		}
		function onNodeContextmenu(event, data, node) {
			emit("node-contextmenu", event, data, node);
		}
		function onCheckChange(data, checked, indeterminate) {
			emit("check-change", data, checked, indeterminate);
		}
		function onCheck(data, checkedInfo) {
			emit("check", data, checkedInfo);
		}
		function onCurrentChange(data, node) {
			emit("current-change", data, node);
		}
		function onNodeExpand(data, node) {
			emit("node-expand", data, node);
		}
		function onNodeCollapse(data, node) {
			emit("node-collapse", data, node);
		}
		function onNodeDragStart(node, event) {
			emit("node-drag-start", node, event);
		}
		function onNodeDragEnter(draggingNode, dropNode, event) {
			emit("node-drag-enter", draggingNode, dropNode, event);
		}
		function onNodeDragLeave(draggingNode, dropNode, event) {
			emit("node-drag-leave", draggingNode, dropNode, event);
		}
		function onNodeDragOver(draggingNode, dropNode, event) {
			emit("node-drag-over", draggingNode, dropNode, event);
		}
		function onNodeDragEnd(draggingNode, dropNode, dropType, event) {
			emit("node-drag-end", draggingNode, dropNode, dropType, event);
		}
		function onNodeDrop(draggingNode, dropNode, dropType, event) {
			emit("node-drop", draggingNode, dropNode, dropType, event);
		}
		function handleAdd(node, data) {
			dialogTitle.value = `添加子节点到 "${node.label}"`;
			editingNode.value = node;
			editingNodeData.value = data;
			editingParentNode.value = node;
			isEditing.value = false;
			const labelKey = getLabelKey();
			formData.value = { [labelKey]: "" };
			dialogVisible.value = true;
		}
		function handleEdit(node, data) {
			dialogTitle.value = `编辑 "${node.label}"`;
			editingNode.value = node;
			editingNodeData.value = data;
			editingParentNode.value = node.parent;
			isEditing.value = true;
			formData.value = { ...data };
			dialogVisible.value = true;
		}
		/**
		* 删除一个节点。
		*
		* <p>踩过的坑：不能只用 {@code node.parent} 判断「有没有父节点」。el-tree 会给
		* **根层节点**也挂一个 parent —— 那是它内部的**虚拟根**，`level` 为 0，且它的 `data`
		* 是**整棵树的数组**而不是某个节点对象（见 element-plus `model/node.mjs` 里
		* `if (this.level === 0 && isArray(this.data)) children = this.data`）。
		* 于是 `parent.data[childrenKey]` 会算出 `undefined`，紧接着 `siblings.indexOf(data)`
		* 抛 `TypeError: Cannot read properties of undefined (reading 'indexOf')`；
		* 该异常被 Vue 的事件错误处理吞进 console，外层只表现为「点删除毫无反应」。
		*
		* <p>所以真正的判别式是 **{@code parent.level === 0}**（虚拟根），而不是 parent 是否存在：
		* 根层节点要落到 {@code treeData} 上删，其余节点删它真实的同级列表。
		*/
		function handleRemove(node, data) {
			const parent = node.parent;
			const childrenKey = options.value.children || "children";
			const rawSiblings = parent && parent.level > 0 ? parent.data[childrenKey] : treeData.value;
			const siblings = Array.isArray(rawSiblings) ? rawSiblings : void 0;
			if (siblings) {
				const idx = siblings.indexOf(data);
				if (idx > -1) siblings.splice(idx, 1);
			}
			treeData.value = [...treeData.value];
			emit("re-remove", {
				item: data,
				tree: treeData.value
			});
			emit("update:data", treeData.value);
		}
		function addRoot() {
			dialogTitle.value = "添加根节点";
			editingNode.value = null;
			editingNodeData.value = null;
			editingParentNode.value = null;
			isEditing.value = false;
			const labelKey = getLabelKey();
			formData.value = { [labelKey]: "" };
			dialogVisible.value = true;
		}
		function confirmDialog() {
			const childrenKey = options.value.children || "children";
			getLabelKey();
			if (isEditing.value && editingNodeData.value) {
				Object.assign(editingNodeData.value, formData.value);
				emit("re-edit", {
					item: editingNodeData.value,
					tree: treeData.value
				});
			} else if (editingParentNode.value) {
				const newNode = {
					...formData.value,
					[childrenKey]: []
				};
				const parentData = editingParentNode.value.data;
				const siblings = parentData[childrenKey] || [];
				siblings.push(newNode);
				parentData[childrenKey] = siblings;
				if (editingParentNode.value) editingParentNode.value.expand();
				emit("re-add", {
					item: newNode,
					tree: treeData.value
				});
			} else {
				const newNode = {
					...formData.value,
					[childrenKey]: []
				};
				treeData.value.push(newNode);
				treeData.value = [...treeData.value];
				emit("re-add", {
					item: newNode,
					tree: treeData.value
				});
			}
			emit("update:data", treeData.value);
			dialogVisible.value = false;
		}
		function filter(value) {
			treeRef.value?.filter(value);
		}
		/** 展开全部节点（工具栏按钮调用） */
		function expandAll() {
			treeRef.value?.expandAll();
		}
		/** 收起全部节点（工具栏按钮调用） */
		function collapseAll() {
			treeRef.value?.collapseAll();
		}
		function getCheckedNodes(leafOnly) {
			return treeRef.value?.getCheckedNodes(leafOnly) ?? [];
		}
		function getCheckedKeys(leafOnly) {
			return treeRef.value?.getCheckedKeys(leafOnly) ?? [];
		}
		function setCheckedKeys(keys, leafOnly) {
			treeRef.value?.setCheckedKeys(keys, leafOnly);
		}
		function setChecked(data, checked, deep) {
			treeRef.value?.setChecked(data, checked, deep);
		}
		function getHalfCheckedNodes() {
			return treeRef.value?.getHalfCheckedNodes() ?? [];
		}
		function getHalfCheckedKeys() {
			return treeRef.value?.getHalfCheckedKeys() ?? [];
		}
		function getCurrentKey() {
			const key = treeRef.value?.getCurrentKey();
			return key == null ? void 0 : key;
		}
		function getCurrentNode() {
			return treeRef.value?.getCurrentNode();
		}
		function setCurrentKey(key) {
			treeRef.value?.setCurrentKey(key);
		}
		function setCurrentNode(node) {
			treeRef.value?.setCurrentNode(node);
		}
		function getNode(data) {
			return treeRef.value?.getNode(data);
		}
		function remove(data) {
			treeRef.value?.remove(data);
		}
		function append(data, parent) {
			const parentData = typeof parent === "object" ? parent : void 0;
			treeRef.value?.append(data, parentData);
		}
		function insertBefore(data, ref) {
			const refData = typeof ref === "object" ? ref : void 0;
			treeRef.value?.insertBefore(data, refData);
		}
		function insertAfter(data, ref) {
			const refData = typeof ref === "object" ? ref : void 0;
			treeRef.value?.insertAfter(data, refData);
		}
		function updateKey(oldKey, newKey) {
			treeRef.value?.updateKeyChildren(oldKey, []);
		}
		function updateKeyChildren(key, data) {
			treeRef.value?.updateKeyChildren(key, data);
		}
		function filterNodeMethodWrapper(value, data, node) {
			if (props.filterNodeMethod) return props.filterNodeMethod(value, data, node);
			return true;
		}
		__expose({
			filter,
			getCheckedNodes,
			getCheckedKeys,
			setCheckedKeys,
			setChecked,
			getHalfCheckedNodes,
			getHalfCheckedKeys,
			getCurrentKey,
			getCurrentNode,
			setCurrentKey,
			setCurrentNode,
			getNode,
			remove,
			append,
			insertBefore,
			insertAfter,
			updateKey,
			updateKeyChildren,
			filterNodeMethod: filterNodeMethodWrapper,
			reload: rootReload
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-tree", { "re-tree--toolbar-visible": __props.showToolbar }]) }, [
				__props.showToolbar ? (openBlock(), createElementBlock("div", _hoisted_1, [
					__props.enableAdd ? (openBlock(), createBlock(unref(ElButton), {
						key: 0,
						plain: "",
						onClick: addRoot
					}, {
						default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode("添加根节点", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					__props.enableExpandAll ? (openBlock(), createBlock(unref(ElButton), {
						key: 1,
						plain: "",
						onClick: expandAll
					}, {
						default: withCtx(() => [..._cache[5] || (_cache[5] = [createTextVNode("展开全部", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					__props.enableCollapseAll ? (openBlock(), createBlock(unref(ElButton), {
						key: 2,
						plain: "",
						onClick: collapseAll
					}, {
						default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("收起全部", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "toolbar-extra", {}, void 0, true)
				])) : createCommentVNode("", true),
				createVNode(unref(ElTree), {
					ref_key: "treeRef",
					ref: treeRef,
					data: treeData.value,
					props: resolvedProps.value,
					"node-key": __props.nodeKey,
					"empty-text": __props.emptyText,
					"render-after-expand": __props.renderAfterExpand,
					"check-strictly": __props.checkStrictly,
					"default-expand-all": __props.defaultExpandAll,
					"expand-on-click-node": __props.expandOnClickNode,
					"check-on-click-node": __props.checkOnClickNode,
					"check-descendants": __props.checkDescendants,
					"auto-expand-parent": __props.autoExpandParent,
					"default-checked-keys": __props.defaultCheckedKeys,
					"default-expanded-keys": __props.defaultExpandedKeys,
					"current-node-key": __props.currentNodeKey,
					"show-checkbox": __props.showCheckbox,
					draggable: draggableComputed.value,
					"allow-drag": __props.allowDrag,
					"allow-drop": __props.allowDrop,
					lazy: lazyComputed.value,
					"highlight-current": __props.highlightCurrent,
					load: loadFunction,
					"filter-node-method": __props.filterNodeMethod,
					accordion: __props.accordion,
					indent: __props.indent,
					icon: __props.icon,
					"highlight-class": __props.highlightClass,
					onNodeClick,
					onNodeContextmenu,
					onCheckChange,
					onCheck,
					onCurrentChange,
					onNodeExpand,
					onNodeCollapse,
					onNodeDragStart,
					onNodeDragEnter,
					onNodeDragLeave,
					onNodeDragOver,
					onNodeDragEnd,
					onNodeDrop
				}, {
					default: withCtx(({ node, data }) => [createBaseVNode("div", {
						class: "re-tree__custom-node",
						style: normalizeStyle(data.bgColor ? { backgroundColor: data.bgColor } : void 0)
					}, [createBaseVNode("span", _hoisted_2, [renderSlot(_ctx.$slots, "label", {
						node: data,
						elNode: node
					}, () => [createTextVNode(toDisplayString(node.label), 1)], true)]), __props.editable || _ctx.$slots.actions ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "re-tree__node-actions",
						onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
					}, [renderSlot(_ctx.$slots, "actions", {
						node: data,
						elNode: node,
						edit: () => handleEdit(node, data),
						remove: () => handleRemove(node, data),
						add: () => handleAdd(node, data)
					}, () => [
						__props.enableAdd ? (openBlock(), createBlock(unref(ElButton), {
							key: 0,
							link: "",
							type: "primary",
							onClick: withModifiers(($event) => handleAdd(node, data), ["stop"])
						}, {
							default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("添加", -1)])]),
							_: 1
						}, 8, ["onClick"])) : createCommentVNode("", true),
						__props.enableEdit ? (openBlock(), createBlock(unref(ElButton), {
							key: 1,
							link: "",
							type: "primary",
							onClick: withModifiers(($event) => handleEdit(node, data), ["stop"])
						}, {
							default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("编辑", -1)])]),
							_: 1
						}, 8, ["onClick"])) : createCommentVNode("", true),
						__props.enableRemove ? (openBlock(), createBlock(unref(ElButton), {
							key: 2,
							link: "",
							type: "danger",
							onClick: withModifiers(($event) => handleRemove(node, data), ["stop"])
						}, {
							default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("删除", -1)])]),
							_: 1
						}, 8, ["onClick"])) : createCommentVNode("", true)
					], true)])) : createCommentVNode("", true)], 4)]),
					_: 3
				}, 8, [
					"data",
					"props",
					"node-key",
					"empty-text",
					"render-after-expand",
					"check-strictly",
					"default-expand-all",
					"expand-on-click-node",
					"check-on-click-node",
					"check-descendants",
					"auto-expand-parent",
					"default-checked-keys",
					"default-expanded-keys",
					"current-node-key",
					"show-checkbox",
					"draggable",
					"allow-drag",
					"allow-drop",
					"lazy",
					"highlight-current",
					"filter-node-method",
					"accordion",
					"indent",
					"icon",
					"highlight-class"
				]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => dialogVisible.value = $event),
					title: dialogTitle.value,
					width: "400px"
				}, {
					footer: withCtx(() => [createVNode(unref(ElButton), { onClick: _cache[2] || (_cache[2] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(unref(ElButton), {
						type: "primary",
						onClick: confirmDialog
					}, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("确定", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(unref(ElForm), {
						model: formData.value,
						"label-width": "80px"
					}, {
						default: withCtx(() => [createVNode(unref(ElFormItem), { label: "名称" }, {
							default: withCtx(() => [createVNode(unref(ElInput), {
								modelValue: labelInput.value,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => labelInput.value = $event)
							}, null, 8, ["modelValue"])]),
							_: 1
						}), renderSlot(_ctx.$slots, "dialog-form", {
							form: formData.value,
							node: editingNodeData.value
						}, void 0, true)]),
						_: 3
					}, 8, ["model"])]),
					_: 3
				}, 8, ["modelValue", "title"])
			], 2);
		};
	}
}), [["__scopeId", "data-v-a910cf88"]]);
//#endregion
//#region ../../packages/ui/src/components/ReTree/index.ts
var plugin = { install(app) {
	app.component("ReTree", ReTree_default$1);
} };
var ReTree_default = ReTree_default$1;
//#endregion
export { ReTree_default as default, plugin as install };
