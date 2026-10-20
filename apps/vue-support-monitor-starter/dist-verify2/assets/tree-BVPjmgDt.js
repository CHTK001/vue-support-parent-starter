import { $n as normalizeClass, An as NOOP, B as h, Bn as isFunction, D as createVNode, Hn as isObject, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Pn as hasOwn, Rn as isArray, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, pt as onUpdated, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { _ as isNil, c as definePropType, h as isUndefined, i as debugWarn, l as isBoolean, p as isPropAbsent, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { u as useEventListener } from "./dist-Clzx2YUA.js";
import { a as removeClass, t as addClass } from "./style-D30oR_2q.js";
import { n as _plugin_vue_export_helper_default } from "./focus-trap-B31xXeBw.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { dt as loading_default, p as caret_right_default } from "./dist-DogtK295.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { n as formItemContextKey } from "./constants-ntbKDiND.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { t as ElCollapseTransition } from "./collapse-transition-DDU8UXTW.js";
import { t as ElText } from "./text-Dt3_J0ai.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tokens.mjs
var ROOT_TREE_INJECTION_KEY = "RootTree";
var NODE_INSTANCE_INJECTION_KEY = "NodeInstance";
var TREE_NODE_MAP_INJECTION_KEY = "TreeNodeMap";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tree.mjs
var treeProps = buildProps({
	data: {
		type: definePropType(Array),
		default: () => []
	},
	emptyText: { type: String },
	renderAfterExpand: {
		type: Boolean,
		default: true
	},
	nodeKey: String,
	checkStrictly: Boolean,
	defaultExpandAll: Boolean,
	expandOnClickNode: {
		type: Boolean,
		default: true
	},
	checkOnClickNode: Boolean,
	checkOnClickLeaf: {
		type: Boolean,
		default: true
	},
	checkDescendants: Boolean,
	autoExpandParent: {
		type: Boolean,
		default: true
	},
	defaultCheckedKeys: { type: Array },
	defaultExpandedKeys: { type: Array },
	currentNodeKey: { type: [String, Number] },
	renderContent: { type: definePropType(Function) },
	showCheckbox: Boolean,
	draggable: Boolean,
	allowDrag: { type: definePropType(Function) },
	allowDrop: { type: definePropType(Function) },
	props: {
		type: Object,
		default: () => ({
			children: "children",
			label: "label",
			disabled: "disabled"
		})
	},
	lazy: Boolean,
	highlightCurrent: Boolean,
	load: { type: Function },
	filterNodeMethod: { type: Function },
	accordion: Boolean,
	indent: {
		type: Number,
		default: 18
	},
	icon: { type: iconPropType }
});
var treeEmits = {
	"check-change": (data, checked, indeterminate) => data && isBoolean(checked) && isBoolean(indeterminate),
	"current-change": (data, node) => true,
	"node-click": (data, node, nodeInstance, evt) => data && node && evt instanceof Event,
	"node-contextmenu": (evt, data, node, nodeInstance) => evt instanceof Event && data && node,
	"node-collapse": (data, node, nodeInstance) => data && node,
	"node-expand": (data, node, nodeInstance) => data && node,
	check: (data, checkedInfo) => data && checkedInfo,
	"node-drag-start": (node, evt) => node && evt,
	"node-drag-end": (draggingNode, dropNode, dropType, evt) => draggingNode && evt,
	"node-drop": (draggingNode, dropNode, dropType, evt) => draggingNode && dropNode && evt,
	"node-drag-leave": (draggingNode, oldDropNode, evt) => draggingNode && oldDropNode && evt,
	"node-drag-enter": (draggingNode, dropNode, evt) => draggingNode && dropNode && evt,
	"node-drag-over": (draggingNode, dropNode, evt) => draggingNode && dropNode && evt
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/model/util.mjs
var NODE_KEY = "$treeNodeId";
var markNodeData = function(node, data) {
	if (!data || data["$treeNodeId"]) return;
	Object.defineProperty(data, NODE_KEY, {
		value: node.id,
		enumerable: false,
		configurable: false,
		writable: false
	});
};
var getNodeKey = (key, data) => data?.[key || "$treeNodeId"];
var handleCurrentChange = (store, emit, setCurrent) => {
	const preCurrentNode = store.value.currentNode;
	setCurrent();
	const currentNode = store.value.currentNode;
	if (preCurrentNode === currentNode) return;
	emit("current-change", currentNode ? currentNode.data : null, currentNode);
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/model/node.mjs
var getChildState = (node) => {
	let all = true;
	let none = true;
	let allWithoutDisable = true;
	let isEffectivelyChecked = true;
	for (let i = 0, j = node.length; i < j; i++) {
		const n = node[i];
		if (n.checked !== true || n.indeterminate) {
			all = false;
			if (!n.disabled) allWithoutDisable = false;
		}
		if (n.checked !== false || n.indeterminate) none = false;
		if (!n.isEffectivelyChecked) isEffectivelyChecked = false;
	}
	return {
		all,
		none,
		allWithoutDisable,
		half: !all && !none,
		isEffectivelyChecked
	};
};
var reInitChecked = function(node) {
	if (node.childNodes.length === 0 || node.loading) {
		node.isEffectivelyChecked = node.disabled || node.checked;
		return;
	}
	const { all, none, half, isEffectivelyChecked } = getChildState(node.childNodes);
	node.isEffectivelyChecked = isEffectivelyChecked;
	if (all) {
		node.checked = true;
		node.indeterminate = false;
	} else if (half) {
		node.checked = false;
		node.indeterminate = true;
	} else if (none) {
		node.checked = false;
		node.indeterminate = false;
	}
	const parent = node.parent;
	if (!parent || parent.level === 0) return;
	if (!node.store.checkStrictly) reInitChecked(parent);
};
var getPropertyFromData = function(node, prop) {
	const props = node.store.props;
	const data = node.data || {};
	const config = props[prop];
	if (isFunction(config)) return config(data, node);
	else if (isString(config)) return data[config];
	else if (isUndefined(config)) {
		const dataProp = data[prop];
		return isUndefined(dataProp) ? "" : dataProp;
	}
};
var setCanFocus = function(childNodes, focus) {
	childNodes.forEach((item) => {
		item.canFocus = focus;
		setCanFocus(item.childNodes, focus);
	});
};
var nodeIdSeed = 0;
var Node = class Node {
	constructor(options) {
		this.isLeafByUser = void 0;
		this.isLeaf = void 0;
		this.isEffectivelyChecked = false;
		this.id = nodeIdSeed++;
		this.text = null;
		this.checked = false;
		this.indeterminate = false;
		this.data = null;
		this.expanded = false;
		this.parent = null;
		this.visible = true;
		this.isCurrent = false;
		this.canFocus = false;
		for (const name in options) if (hasOwn(options, name)) this[name] = options[name];
		this.level = 0;
		this.loaded = false;
		this.childNodes = [];
		this.loading = false;
		if (this.parent) this.level = this.parent.level + 1;
	}
	initialize() {
		const store = this.store;
		if (!store) throw new Error("[Node]store is required!");
		store.registerNode(this);
		const props = store.props;
		if (props && typeof props.isLeaf !== "undefined") {
			const isLeaf = getPropertyFromData(this, "isLeaf");
			if (isBoolean(isLeaf)) this.isLeafByUser = isLeaf;
		}
		if (store.lazy !== true && this.data) {
			this.setData(this.data);
			if (store.defaultExpandAll) {
				this.expanded = true;
				this.canFocus = true;
			}
		} else if (this.level > 0 && store.lazy && store.defaultExpandAll && !this.isLeafByUser) this.expand();
		if (!isArray(this.data)) markNodeData(this, this.data);
		if (!this.data) return;
		const defaultExpandedKeys = store.defaultExpandedKeys;
		const key = store.key;
		if (key && !isNil(this.key) && defaultExpandedKeys && defaultExpandedKeys.includes(this.key)) this.expand(null, store.autoExpandParent);
		if (key && store.currentNodeKey !== void 0 && this.key === store.currentNodeKey) {
			store.currentNode && (store.currentNode.isCurrent = false);
			store.currentNode = this;
			store.currentNode.isCurrent = true;
		}
		if (store.lazy) store._initDefaultCheckedNode(this);
		this.updateLeafState();
		if (this.level === 1 || this.parent?.expanded === true) this.canFocus = true;
	}
	setData(data) {
		if (!isArray(data)) markNodeData(this, data);
		this.data = data;
		this.childNodes = [];
		let children;
		if (this.level === 0 && isArray(this.data)) children = this.data;
		else children = getPropertyFromData(this, "children") || [];
		for (let i = 0, j = children.length; i < j; i++) this.insertChild({ data: children[i] });
	}
	get label() {
		return getPropertyFromData(this, "label");
	}
	get key() {
		const nodeKey = this.store.key;
		if (this.data) return this.data[nodeKey];
		return null;
	}
	get disabled() {
		return getPropertyFromData(this, "disabled");
	}
	get nextSibling() {
		const parent = this.parent;
		if (parent) {
			const index = parent.childNodes.indexOf(this);
			if (index > -1) return parent.childNodes[index + 1];
		}
		return null;
	}
	get previousSibling() {
		const parent = this.parent;
		if (parent) {
			const index = parent.childNodes.indexOf(this);
			if (index > -1) return index > 0 ? parent.childNodes[index - 1] : null;
		}
		return null;
	}
	contains(target, deep = true) {
		return (this.childNodes || []).some((child) => child === target || deep && child.contains(target));
	}
	remove() {
		const parent = this.parent;
		if (parent) parent.removeChild(this);
	}
	insertChild(child, index, batch) {
		if (!child) throw new Error("InsertChild error: child is required.");
		if (!(child instanceof Node)) {
			if (!batch) {
				const children = this.getChildren(true);
				if (!children?.includes(child.data)) if (isUndefined(index) || index < 0) children?.push(child.data);
				else children?.splice(index, 0, child.data);
			}
			Object.assign(child, {
				parent: this,
				store: this.store
			});
			child = reactive(new Node(child));
			if (child instanceof Node) child.initialize();
		}
		child.level = this.level + 1;
		if (isUndefined(index) || index < 0) this.childNodes.push(child);
		else this.childNodes.splice(index, 0, child);
		this.updateLeafState();
	}
	insertBefore(child, ref) {
		let index;
		if (ref) index = this.childNodes.indexOf(ref);
		this.insertChild(child, index);
	}
	insertAfter(child, ref) {
		let index;
		if (ref) {
			index = this.childNodes.indexOf(ref);
			if (index !== -1) index += 1;
		}
		this.insertChild(child, index);
	}
	removeChild(child) {
		const children = this.getChildren() || [];
		const dataIndex = children.indexOf(child.data);
		if (dataIndex > -1) children.splice(dataIndex, 1);
		const index = this.childNodes.indexOf(child);
		if (index > -1) {
			this.store && this.store.deregisterNode(child);
			child.parent = null;
			this.childNodes.splice(index, 1);
		}
		this.updateLeafState();
	}
	removeChildByData(data) {
		const targetNode = this.childNodes.find((child) => child.data === data);
		if (targetNode) this.removeChild(targetNode);
	}
	expand(callback, expandParent) {
		const done = () => {
			if (expandParent) {
				let parent = this.parent;
				while (parent && parent.level > 0) {
					parent.expanded = true;
					parent = parent.parent;
				}
			}
			this.expanded = true;
			if (callback) callback();
			setCanFocus(this.childNodes, true);
		};
		if (this.shouldLoadData()) this.loadData((data) => {
			if (isArray(data)) {
				if (!this.store.checkStrictly) if (this.checked) this.setChecked(true, true);
				else reInitChecked(this);
				done();
			}
		});
		else done();
	}
	doCreateChildren(array, defaultProps = {}) {
		array.forEach((item) => {
			this.insertChild(Object.assign({ data: item }, defaultProps), void 0, true);
		});
	}
	collapse() {
		this.expanded = false;
		setCanFocus(this.childNodes, false);
	}
	shouldLoadData() {
		return Boolean(this.store.lazy === true && this.store.load && !this.loaded);
	}
	updateLeafState() {
		if (this.store.lazy === true && this.loaded !== true && typeof this.isLeafByUser !== "undefined") {
			this.isLeaf = this.isLeafByUser;
			this.isEffectivelyChecked = this.isLeaf && this.disabled;
			return;
		}
		const childNodes = this.childNodes;
		if (!this.store.lazy || this.store.lazy === true && this.loaded === true) {
			this.isLeaf = !childNodes || childNodes.length === 0;
			this.isEffectivelyChecked = this.isLeaf && this.disabled;
			return;
		}
		this.isLeaf = false;
	}
	setChecked(value, deep, recursion, passValue) {
		this.indeterminate = value === "half";
		this.checked = value === true;
		this.isEffectivelyChecked = !this.childNodes.length && (this.disabled || this.checked);
		if (this.store.checkStrictly && !deep) return;
		if (!(this.shouldLoadData() && !this.store.checkDescendants)) {
			const handleDescendants = () => {
				if (deep) {
					const childNodes = this.childNodes;
					for (let i = 0, j = childNodes.length; i < j; i++) {
						const child = childNodes[i];
						passValue = passValue || value !== false;
						const isCheck = child.disabled && child.isLeaf ? child.checked : passValue;
						child.setChecked(isCheck, deep, true, passValue);
					}
					const { half, all, isEffectivelyChecked } = getChildState(childNodes);
					if (!all) {
						this.checked = all;
						this.indeterminate = half;
					}
					this.isEffectivelyChecked = !this.childNodes.length ? this.disabled || this.checked : isEffectivelyChecked;
				}
			};
			if (this.shouldLoadData()) {
				this.loadData(() => {
					handleDescendants();
					reInitChecked(this);
				}, { checked: value !== false });
				return;
			} else handleDescendants();
		}
		const parent = this.parent;
		if (!parent || parent.level === 0) return;
		if (!recursion && !this.store.checkStrictly) reInitChecked(parent);
	}
	getChildren(forceInit = false) {
		if (this.level === 0) return this.data;
		const data = this.data;
		if (!data) return null;
		const props = this.store.props;
		let children = "children";
		if (props) children = props.children || "children";
		if (isUndefined(data[children])) data[children] = null;
		if (forceInit && !data[children]) data[children] = [];
		return data[children];
	}
	updateChildren() {
		const newData = this.getChildren() || [];
		const oldData = this.childNodes.map((node) => node.data);
		const newDataMap = {};
		const newNodes = [];
		newData.forEach((item, index) => {
			const key = item[NODE_KEY];
			if (!!key && oldData.some((data) => data?.["$treeNodeId"] === key)) newDataMap[key] = {
				index,
				data: item
			};
			else newNodes.push({
				index,
				data: item
			});
		});
		if (!this.store.lazy) oldData.forEach((item) => {
			if (!newDataMap[item?.["$treeNodeId"]]) this.removeChildByData(item);
		});
		newNodes.forEach(({ index, data }) => {
			this.insertChild({ data }, index);
		});
		this.updateLeafState();
	}
	loadData(callback, defaultProps = {}) {
		if (this.store.lazy === true && this.store.load && !this.loaded && (!this.loading || Object.keys(defaultProps).length)) {
			this.loading = true;
			const resolve = (children) => {
				this.childNodes = [];
				this.doCreateChildren(children, defaultProps);
				this.loaded = true;
				this.loading = false;
				this.updateLeafState();
				if (callback) callback.call(this, children);
			};
			const reject = () => {
				this.loading = false;
			};
			this.store.load(this, resolve, reject);
		} else if (callback) callback.call(this);
	}
	eachNode(callback) {
		const arr = [this];
		while (arr.length) {
			const node = arr.shift();
			arr.unshift(...node.childNodes);
			callback(node);
		}
	}
	reInitChecked() {
		if (this.store.checkStrictly) return;
		reInitChecked(this);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/model/tree-store.mjs
var TreeStore = class {
	constructor(options) {
		this.lazy = false;
		this.checkStrictly = false;
		this.autoExpandParent = false;
		this.defaultExpandAll = false;
		this.checkDescendants = false;
		this.currentNode = null;
		this.currentNodeKey = null;
		for (const option in options) if (hasOwn(options, option)) this[option] = options[option];
		this.nodesMap = {};
	}
	initialize() {
		this.root = new Node({
			data: this.data,
			store: this
		});
		this.root.initialize();
		if (this.lazy && this.load) {
			const loadFn = this.load;
			loadFn(this.root, (data) => {
				this.root.doCreateChildren(data);
				this._initDefaultCheckedNodes();
			}, NOOP);
		} else this._initDefaultCheckedNodes();
	}
	filter(value) {
		const filterNodeMethod = this.filterNodeMethod;
		const lazy = this.lazy;
		const traverse = async function(node) {
			const childNodes = node.root ? node.root.childNodes : node.childNodes;
			for (const [index, child] of childNodes.entries()) {
				child.visible = !!filterNodeMethod?.call(child, value, child.data, child);
				if (index % 80 === 0 && index > 0) await nextTick();
				await traverse(child);
			}
			if (!node.visible && childNodes.length) {
				let allHidden = true;
				allHidden = !childNodes.some((child) => child.visible);
				if (node.root) node.root.visible = allHidden === false;
				else node.visible = allHidden === false;
			}
			if (!value) return;
			if (node.visible && !node.isLeaf) {
				if (!lazy || node.loaded) node.expand();
			}
		};
		traverse(this);
	}
	setData(newVal) {
		if (newVal !== this.root.data) {
			this.nodesMap = {};
			this.root.setData(newVal);
			this._initDefaultCheckedNodes();
			this.setCurrentNodeKey(this.currentNodeKey);
		} else this.root.updateChildren();
	}
	getNode(data) {
		if (data instanceof Node) return data;
		const key = isObject(data) ? getNodeKey(this.key, data) : data;
		return this.nodesMap[key] || null;
	}
	insertBefore(data, refData) {
		const refNode = this.getNode(refData);
		refNode.parent?.insertBefore({ data }, refNode);
	}
	insertAfter(data, refData) {
		const refNode = this.getNode(refData);
		refNode.parent?.insertAfter({ data }, refNode);
	}
	remove(data) {
		const node = this.getNode(data);
		if (node && node.parent) {
			if (node === this.currentNode) this.currentNode = null;
			node.parent.removeChild(node);
		}
	}
	append(data, parentData) {
		const parentNode = !isPropAbsent(parentData) ? this.getNode(parentData) : this.root;
		if (parentNode) parentNode.insertChild({ data });
	}
	_initDefaultCheckedNodes() {
		const defaultCheckedKeys = this.defaultCheckedKeys || [];
		const nodesMap = this.nodesMap;
		defaultCheckedKeys.forEach((checkedKey) => {
			const node = nodesMap[checkedKey];
			if (node) node.setChecked(true, !this.checkStrictly);
		});
	}
	_initDefaultCheckedNode(node) {
		const defaultCheckedKeys = this.defaultCheckedKeys || [];
		if (!isNil(node.key) && defaultCheckedKeys.includes(node.key)) node.setChecked(true, !this.checkStrictly);
	}
	setDefaultCheckedKey(newVal) {
		if (newVal !== this.defaultCheckedKeys) {
			this.defaultCheckedKeys = newVal;
			this._initDefaultCheckedNodes();
		}
	}
	registerNode(node) {
		const key = this.key;
		if (!node || !node.data) return;
		if (!key) this.nodesMap[node.id] = node;
		else {
			const nodeKey = node.key;
			if (!isNil(nodeKey)) this.nodesMap[nodeKey] = node;
		}
	}
	deregisterNode(node) {
		if (!this.key || !node || !node.data) return;
		node.childNodes.forEach((child) => {
			this.deregisterNode(child);
		});
		delete this.nodesMap[node.key];
	}
	getCheckedNodes(leafOnly = false, includeHalfChecked = false) {
		const checkedNodes = [];
		const traverse = function(node) {
			(node.root ? node.root.childNodes : node.childNodes).forEach((child) => {
				if ((child.checked || includeHalfChecked && child.indeterminate) && (!leafOnly || leafOnly && child.isLeaf)) checkedNodes.push(child.data);
				traverse(child);
			});
		};
		traverse(this);
		return checkedNodes;
	}
	getCheckedKeys(leafOnly = false) {
		return this.getCheckedNodes(leafOnly).map((data) => (data || {})[this.key]);
	}
	getHalfCheckedNodes() {
		const nodes = [];
		const traverse = function(node) {
			(node.root ? node.root.childNodes : node.childNodes).forEach((child) => {
				if (child.indeterminate) nodes.push(child.data);
				traverse(child);
			});
		};
		traverse(this);
		return nodes;
	}
	getHalfCheckedKeys() {
		return this.getHalfCheckedNodes().map((data) => (data || {})[this.key]);
	}
	_getAllNodes() {
		const allNodes = [];
		const nodesMap = this.nodesMap;
		for (const nodeKey in nodesMap) if (hasOwn(nodesMap, nodeKey)) allNodes.push(nodesMap[nodeKey]);
		return allNodes;
	}
	updateChildren(key, data) {
		const node = this.nodesMap[key];
		if (!node) return;
		const childNodes = node.childNodes;
		for (let i = childNodes.length - 1; i >= 0; i--) {
			const child = childNodes[i];
			this.remove(child.data);
		}
		for (let i = 0, j = data.length; i < j; i++) {
			const child = data[i];
			this.append(child, node.data);
		}
	}
	_setCheckedKeys(key, leafOnly = false, checkedKeys) {
		const allNodes = this._getAllNodes().sort((a, b) => a.level - b.level);
		const cache = Object.create(null);
		const keys = Object.keys(checkedKeys);
		allNodes.forEach((node) => node.setChecked(false, false));
		const cacheCheckedChild = (node) => {
			node.childNodes.forEach((child) => {
				cache[child.data[key]] = true;
				if (child.childNodes?.length) cacheCheckedChild(child);
			});
		};
		for (let i = 0, j = allNodes.length; i < j; i++) {
			const node = allNodes[i];
			const nodeKey = node.data[key].toString();
			if (!keys.includes(nodeKey)) {
				if (node.checked && !cache[nodeKey]) node.setChecked(false, false);
				continue;
			}
			if (node.childNodes.length) cacheCheckedChild(node);
			if (node.isLeaf || this.checkStrictly) {
				node.setChecked(true, false);
				continue;
			}
			node.setChecked(true, true);
			if (leafOnly) {
				node.setChecked(false, false, true);
				const traverse = function(node) {
					node.childNodes.forEach((child) => {
						if (!child.isLeaf) child.setChecked(false, false, true);
						traverse(child);
					});
					node.reInitChecked();
				};
				traverse(node);
			}
		}
	}
	setCheckedNodes(array, leafOnly = false) {
		const key = this.key;
		const checkedKeys = {};
		array.forEach((item) => {
			checkedKeys[(item || {})[key]] = true;
		});
		this._setCheckedKeys(key, leafOnly, checkedKeys);
	}
	setCheckedKeys(keys, leafOnly = false) {
		this.defaultCheckedKeys = keys;
		const key = this.key;
		const checkedKeys = {};
		keys.forEach((key) => {
			checkedKeys[key] = true;
		});
		this._setCheckedKeys(key, leafOnly, checkedKeys);
	}
	setDefaultExpandedKeys(keys) {
		keys = keys || [];
		this.defaultExpandedKeys = keys;
		keys.forEach((key) => {
			const node = this.getNode(key);
			if (node) node.expand(null, this.autoExpandParent);
		});
	}
	setChecked(data, checked, deep) {
		const node = this.getNode(data);
		if (node) node.setChecked(!!checked, deep);
	}
	getCurrentNode() {
		return this.currentNode;
	}
	setCurrentNode(currentNode) {
		const prevCurrentNode = this.currentNode;
		if (prevCurrentNode) prevCurrentNode.isCurrent = false;
		this.currentNode = currentNode;
		this.currentNode.isCurrent = true;
	}
	setUserCurrentNode(node, shouldAutoExpandParent = true) {
		const key = node[this.key];
		const currNode = this.nodesMap[key];
		this.setCurrentNode(currNode);
		if (shouldAutoExpandParent && this.currentNode && this.currentNode.level > 1) this.currentNode.parent?.expand(null, true);
	}
	setCurrentNodeKey(key, shouldAutoExpandParent = true) {
		this.currentNodeKey = key;
		if (isPropAbsent(key)) {
			this.currentNode && (this.currentNode.isCurrent = false);
			this.currentNode = null;
			return;
		}
		const node = this.getNode(key);
		if (node) {
			this.setCurrentNode(node);
			if (shouldAutoExpandParent && this.currentNode && this.currentNode.level > 1) this.currentNode.parent?.expand(null, true);
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/model/useNodeExpandEventBroadcast.mjs
function useNodeExpandEventBroadcast(props) {
	const parentNodeMap = inject(TREE_NODE_MAP_INJECTION_KEY, null);
	let currentNodeMap = {
		treeNodeExpand: (node) => {
			if (props.node !== node) props.node?.collapse();
		},
		children: /* @__PURE__ */ new Set()
	};
	if (parentNodeMap) parentNodeMap.children.add(currentNodeMap);
	onBeforeUnmount(() => {
		if (parentNodeMap) parentNodeMap.children.delete(currentNodeMap);
		currentNodeMap = null;
	});
	provide(TREE_NODE_MAP_INJECTION_KEY, currentNodeMap);
	return { broadcastExpanded: (node) => {
		if (!props.accordion) return;
		for (const childNode of currentNodeMap.children) childNode.treeNodeExpand(node);
	} };
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/model/useDragNode.mjs
var dragEventsKey = Symbol("dragEvents");
function useDragNodeHandler({ props, ctx, el$, dropIndicator$, store }) {
	const ns = useNamespace("tree");
	const dragState = ref({
		showDropIndicator: false,
		draggingNode: null,
		dropNode: null,
		allowDrop: true,
		dropType: null
	});
	const treeNodeDragStart = ({ event, treeNode }) => {
		if (!event.dataTransfer) return;
		if (isFunction(props.allowDrag) && !props.allowDrag(treeNode.node)) {
			event.preventDefault();
			return false;
		}
		event.dataTransfer.effectAllowed = "move";
		try {
			event.dataTransfer.setData("text/plain", "");
		} catch {}
		dragState.value.draggingNode = treeNode;
		ctx.emit("node-drag-start", treeNode.node, event);
	};
	const treeNodeDragOver = ({ event, treeNode }) => {
		if (!event.dataTransfer) return;
		const dropNode = treeNode;
		const oldDropNode = dragState.value.dropNode;
		if (oldDropNode && oldDropNode.node.id !== dropNode.node.id) removeClass(oldDropNode.$el, ns.is("drop-inner"));
		const draggingNode = dragState.value.draggingNode;
		if (!draggingNode || !dropNode) return;
		let dropPrev = true;
		let dropInner = true;
		let dropNext = true;
		let userAllowDropInner = true;
		if (isFunction(props.allowDrop)) {
			dropPrev = props.allowDrop(draggingNode.node, dropNode.node, "prev");
			userAllowDropInner = dropInner = props.allowDrop(draggingNode.node, dropNode.node, "inner");
			dropNext = props.allowDrop(draggingNode.node, dropNode.node, "next");
		}
		event.dataTransfer.dropEffect = dropInner || dropPrev || dropNext ? "move" : "none";
		if ((dropPrev || dropInner || dropNext) && oldDropNode?.node.id !== dropNode.node.id) {
			if (oldDropNode) ctx.emit("node-drag-leave", draggingNode.node, oldDropNode.node, event);
			ctx.emit("node-drag-enter", draggingNode.node, dropNode.node, event);
		}
		if (dropPrev || dropInner || dropNext) dragState.value.dropNode = dropNode;
		else dragState.value.dropNode = null;
		if (dropNode.node.nextSibling === draggingNode.node) dropNext = false;
		if (dropNode.node.previousSibling === draggingNode.node) dropPrev = false;
		if (dropNode.node.contains(draggingNode.node, false)) dropInner = false;
		if (draggingNode.node === dropNode.node || draggingNode.node.contains(dropNode.node)) {
			dropPrev = false;
			dropInner = false;
			dropNext = false;
		}
		const dropEl = dropNode.$el;
		const targetPosition = dropEl.querySelector(`.${ns.be("node", "content")}`).getBoundingClientRect();
		const treePosition = el$.value.getBoundingClientRect();
		const treeScrollTop = el$.value.scrollTop;
		let dropType;
		const prevPercent = dropPrev ? dropInner ? .25 : dropNext ? .45 : 1 : Number.NEGATIVE_INFINITY;
		const nextPercent = dropNext ? dropInner ? .75 : dropPrev ? .55 : 0 : Number.POSITIVE_INFINITY;
		let indicatorTop = -9999;
		const distance = event.clientY - targetPosition.top;
		if (distance < targetPosition.height * prevPercent) dropType = "before";
		else if (distance > targetPosition.height * nextPercent) dropType = "after";
		else if (dropInner) dropType = "inner";
		else dropType = "none";
		const iconPosition = dropEl.querySelector(`.${ns.be("node", "expand-icon")}`).getBoundingClientRect();
		const dropIndicator = dropIndicator$.value;
		if (dropType === "before") indicatorTop = iconPosition.top - treePosition.top + treeScrollTop;
		else if (dropType === "after") indicatorTop = iconPosition.bottom - treePosition.top + treeScrollTop;
		dropIndicator.style.top = `${indicatorTop}px`;
		dropIndicator.style.left = `${iconPosition.right - treePosition.left}px`;
		if (dropType === "inner") addClass(dropEl, ns.is("drop-inner"));
		else removeClass(dropEl, ns.is("drop-inner"));
		dragState.value.showDropIndicator = dropType === "before" || dropType === "after";
		dragState.value.allowDrop = dragState.value.showDropIndicator || userAllowDropInner;
		dragState.value.dropType = dropType;
		ctx.emit("node-drag-over", draggingNode.node, dropNode.node, event);
	};
	const treeNodeDragEnd = (event) => {
		const { draggingNode, dropType, dropNode } = dragState.value;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
		if (draggingNode?.node.data && dropNode) {
			const draggingNodeCopy = { data: draggingNode.node.data };
			if (dropType !== "none") draggingNode.node.remove();
			if (dropType === "before") dropNode.node.parent?.insertBefore(draggingNodeCopy, dropNode.node);
			else if (dropType === "after") dropNode.node.parent?.insertAfter(draggingNodeCopy, dropNode.node);
			else if (dropType === "inner") dropNode.node.insertChild(draggingNodeCopy);
			if (dropType !== "none") {
				store.value.registerNode(draggingNodeCopy);
				if (store.value.key) draggingNode.node.eachNode((node) => {
					store.value.nodesMap[node.data[store.value.key]]?.setChecked(node.checked, !store.value.checkStrictly);
				});
			}
			removeClass(dropNode.$el, ns.is("drop-inner"));
			ctx.emit("node-drag-end", draggingNode.node, dropNode.node, dropType, event);
			if (dropType !== "none") ctx.emit("node-drop", draggingNode.node, dropNode.node, dropType, event);
		}
		if (draggingNode && !dropNode) ctx.emit("node-drag-end", draggingNode.node, null, dropType, event);
		dragState.value.showDropIndicator = false;
		dragState.value.draggingNode = null;
		dragState.value.dropNode = null;
		dragState.value.allowDrop = true;
	};
	provide(dragEventsKey, {
		treeNodeDragStart,
		treeNodeDragOver,
		treeNodeDragEnd
	});
	return { dragState };
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tree-node-content.mjs
var tree_node_content_default = defineComponent({
	name: "ElTreeNodeContent",
	props: {
		node: {
			type: Object,
			required: true
		},
		renderContent: Function
	},
	setup(props) {
		const ns = useNamespace("tree");
		const nodeInstance = inject(NODE_INSTANCE_INJECTION_KEY);
		const tree = inject(ROOT_TREE_INJECTION_KEY);
		return () => {
			const node = props.node;
			const { data, store } = node;
			return props.renderContent ? props.renderContent(h, {
				_self: nodeInstance,
				node,
				data,
				store
			}) : renderSlot(tree.ctx.slots, "default", {
				node,
				data
			}, () => [h(ElText, {
				tag: "span",
				truncated: true,
				class: ns.be("node", "label")
			}, () => [node.label])]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tree-node.vue_vue_type_script_lang.mjs
var tree_node_vue_vue_type_script_lang_default = defineComponent({
	name: "ElTreeNode",
	components: {
		ElCollapseTransition,
		ElCheckbox,
		NodeContent: tree_node_content_default,
		ElIcon,
		Loading: loading_default
	},
	props: {
		node: {
			type: Node,
			default: () => ({})
		},
		props: {
			type: Object,
			default: () => ({})
		},
		accordion: Boolean,
		renderContent: Function,
		renderAfterExpand: Boolean,
		showCheckbox: Boolean
	},
	emits: ["node-expand"],
	setup(props, ctx) {
		const ns = useNamespace("tree");
		const { broadcastExpanded } = useNodeExpandEventBroadcast(props);
		const tree = inject(ROOT_TREE_INJECTION_KEY);
		const expanded = ref(false);
		const childNodeRendered = ref(false);
		const oldChecked = ref();
		const oldIndeterminate = ref();
		const node$ = ref();
		const dragEvents = inject(dragEventsKey);
		const instance = getCurrentInstance();
		provide(NODE_INSTANCE_INJECTION_KEY, instance);
		if (!tree) debugWarn("Tree", "Can not find node's tree.");
		if (props.node.expanded) {
			expanded.value = true;
			childNodeRendered.value = true;
		}
		const childrenKey = tree.props.props["children"] || "children";
		watch(() => {
			const children = props.node.data?.[childrenKey];
			return children && [...children];
		}, () => {
			props.node.updateChildren();
		});
		watch(() => props.node.indeterminate, (val) => {
			handleSelectChange(props.node.checked, val);
		});
		watch(() => props.node.checked, (val) => {
			handleSelectChange(val, props.node.indeterminate);
		});
		watch(() => props.node.childNodes.length, () => props.node.reInitChecked());
		watch(() => props.node.expanded, (val) => {
			nextTick(() => expanded.value = val);
			if (val) childNodeRendered.value = true;
		});
		const getNodeKey$1 = (node) => {
			return tree.props.nodeKey ? getNodeKey(tree.props.nodeKey, node.data) : node.id;
		};
		const getNodeClass = (node) => {
			const nodeClassFunc = props.props.class;
			if (!nodeClassFunc) return {};
			let className;
			if (isFunction(nodeClassFunc)) {
				const { data } = node;
				className = nodeClassFunc(data, node);
			} else className = nodeClassFunc;
			if (isString(className)) return { [className]: true };
			else return className;
		};
		const handleSelectChange = (checked, indeterminate) => {
			if (oldChecked.value !== checked || oldIndeterminate.value !== indeterminate) tree.ctx.emit("check-change", props.node.data, checked, indeterminate);
			oldChecked.value = checked;
			oldIndeterminate.value = indeterminate;
		};
		const handleClick = (e) => {
			handleCurrentChange(tree.store, tree.ctx.emit, () => {
				if (tree?.props?.nodeKey) {
					const curNodeKey = getNodeKey$1(props.node);
					tree.store.value.setCurrentNodeKey(curNodeKey);
				} else tree.store.value.setCurrentNode(props.node);
			});
			tree.currentNode.value = props.node;
			if (tree.props.expandOnClickNode) handleExpandIconClick();
			if ((tree.props.checkOnClickNode || props.node.isLeaf && tree.props.checkOnClickLeaf && props.showCheckbox) && !props.node.disabled) handleCheckChange(!props.node.checked);
			tree.ctx.emit("node-click", props.node.data, props.node, instance, e);
		};
		const handleContextMenu = (event) => {
			if (tree.instance.vnode.props?.["onNodeContextmenu"]) {
				event.stopPropagation();
				event.preventDefault();
			}
			tree.ctx.emit("node-contextmenu", event, props.node.data, props.node, instance);
		};
		const handleExpandIconClick = () => {
			if (props.node.isLeaf) return;
			if (expanded.value) {
				tree.ctx.emit("node-collapse", props.node.data, props.node, instance);
				props.node.collapse();
			} else props.node.expand(() => {
				ctx.emit("node-expand", props.node.data, props.node, instance);
			});
		};
		const handleCheckChange = (value) => {
			const checkStrictly = tree?.props.checkStrictly;
			const childNodes = props.node.childNodes;
			if (!checkStrictly && childNodes.length) value = childNodes.some((node) => !node.isEffectivelyChecked);
			props.node.setChecked(value, !checkStrictly);
			nextTick(() => {
				const store = tree.store.value;
				tree.ctx.emit("check", props.node.data, {
					checkedNodes: store.getCheckedNodes(),
					checkedKeys: store.getCheckedKeys(),
					halfCheckedNodes: store.getHalfCheckedNodes(),
					halfCheckedKeys: store.getHalfCheckedKeys()
				});
			});
		};
		const handleChildNodeExpand = (nodeData, node, instance) => {
			broadcastExpanded(node);
			tree.ctx.emit("node-expand", nodeData, node, instance);
		};
		const handleDragStart = (event) => {
			if (!tree.props.draggable) return;
			dragEvents.treeNodeDragStart({
				event,
				treeNode: props
			});
		};
		const handleDragOver = (event) => {
			event.preventDefault();
			if (!tree.props.draggable) return;
			dragEvents.treeNodeDragOver({
				event,
				treeNode: {
					$el: node$.value,
					node: props.node
				}
			});
		};
		const handleDrop = (event) => {
			event.preventDefault();
		};
		const handleDragEnd = (event) => {
			if (!tree.props.draggable) return;
			dragEvents.treeNodeDragEnd(event);
		};
		return {
			ns,
			node$,
			tree,
			expanded,
			childNodeRendered,
			oldChecked,
			oldIndeterminate,
			getNodeKey: getNodeKey$1,
			getNodeClass,
			handleSelectChange,
			handleClick,
			handleContextMenu,
			handleExpandIconClick,
			handleCheckChange,
			handleChildNodeExpand,
			handleDragStart,
			handleDragOver,
			handleDrop,
			handleDragEnd,
			CaretRight: caret_right_default
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tree-node.mjs
var _hoisted_1 = [
	"aria-expanded",
	"aria-disabled",
	"aria-checked",
	"draggable",
	"data-key"
];
var _hoisted_2 = ["aria-expanded"];
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_icon = resolveComponent("el-icon");
	const _component_el_checkbox = resolveComponent("el-checkbox");
	const _component_loading = resolveComponent("loading");
	const _component_node_content = resolveComponent("node-content");
	const _component_el_tree_node = resolveComponent("el-tree-node");
	const _component_el_collapse_transition = resolveComponent("el-collapse-transition");
	return withDirectives((openBlock(), createElementBlock("div", {
		ref: "node$",
		class: normalizeClass([
			_ctx.ns.b("node"),
			_ctx.ns.is("expanded", _ctx.expanded),
			_ctx.ns.is("current", _ctx.node.isCurrent),
			_ctx.ns.is("hidden", !_ctx.node.visible),
			_ctx.ns.is("focusable", !_ctx.node.disabled),
			_ctx.ns.is("checked", !_ctx.node.disabled && _ctx.node.checked),
			_ctx.getNodeClass(_ctx.node)
		]),
		role: "treeitem",
		tabindex: "-1",
		"aria-expanded": _ctx.expanded,
		"aria-disabled": _ctx.node.disabled,
		"aria-checked": _ctx.node.checked,
		draggable: _ctx.tree.props.draggable,
		"data-key": _ctx.getNodeKey(_ctx.node),
		onClick: _cache[2] || (_cache[2] = withModifiers((...args) => _ctx.handleClick && _ctx.handleClick(...args), ["stop"])),
		onContextmenu: _cache[3] || (_cache[3] = (...args) => _ctx.handleContextMenu && _ctx.handleContextMenu(...args)),
		onDragstart: _cache[4] || (_cache[4] = withModifiers((...args) => _ctx.handleDragStart && _ctx.handleDragStart(...args), ["stop"])),
		onDragover: _cache[5] || (_cache[5] = withModifiers((...args) => _ctx.handleDragOver && _ctx.handleDragOver(...args), ["stop"])),
		onDragend: _cache[6] || (_cache[6] = withModifiers((...args) => _ctx.handleDragEnd && _ctx.handleDragEnd(...args), ["stop"])),
		onDrop: _cache[7] || (_cache[7] = withModifiers((...args) => _ctx.handleDrop && _ctx.handleDrop(...args), ["stop"]))
	}, [createBaseVNode("div", {
		class: normalizeClass(_ctx.ns.be("node", "content")),
		style: normalizeStyle({ paddingLeft: (_ctx.node.level - 1) * _ctx.tree.props.indent + "px" })
	}, [
		_ctx.tree.props.icon || _ctx.CaretRight ? (openBlock(), createBlock(_component_el_icon, {
			key: 0,
			class: normalizeClass([
				_ctx.ns.be("node", "expand-icon"),
				_ctx.ns.is("leaf", _ctx.node.isLeaf),
				{ expanded: !_ctx.node.isLeaf && _ctx.expanded }
			]),
			onClick: withModifiers(_ctx.handleExpandIconClick, ["stop"])
		}, {
			default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.tree.props.icon || _ctx.CaretRight)))]),
			_: 1
		}, 8, ["class", "onClick"])) : createCommentVNode("v-if", true),
		_ctx.showCheckbox ? (openBlock(), createBlock(_component_el_checkbox, {
			key: 1,
			"model-value": _ctx.node.checked,
			indeterminate: _ctx.node.indeterminate,
			disabled: !!_ctx.node.disabled,
			onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"])),
			onChange: _ctx.handleCheckChange
		}, null, 8, [
			"model-value",
			"indeterminate",
			"disabled",
			"onChange"
		])) : createCommentVNode("v-if", true),
		_ctx.node.loading ? (openBlock(), createBlock(_component_el_icon, {
			key: 2,
			class: normalizeClass([_ctx.ns.be("node", "loading-icon"), _ctx.ns.is("loading")])
		}, {
			default: withCtx(() => [createVNode(_component_loading)]),
			_: 1
		}, 8, ["class"])) : createCommentVNode("v-if", true),
		createVNode(_component_node_content, {
			node: _ctx.node,
			"render-content": _ctx.renderContent
		}, null, 8, ["node", "render-content"])
	], 6), createVNode(_component_el_collapse_transition, null, {
		default: withCtx(() => [!_ctx.renderAfterExpand || _ctx.childNodeRendered ? withDirectives((openBlock(), createElementBlock("div", {
			key: 0,
			class: normalizeClass(_ctx.ns.be("node", "children")),
			role: "group",
			"aria-expanded": _ctx.expanded,
			onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
		}, [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.node.childNodes, (child) => {
			return openBlock(), createBlock(_component_el_tree_node, {
				key: _ctx.getNodeKey(child),
				"render-content": _ctx.renderContent,
				"render-after-expand": _ctx.renderAfterExpand,
				"show-checkbox": _ctx.showCheckbox,
				node: child,
				accordion: _ctx.accordion,
				props: _ctx.props,
				onNodeExpand: _ctx.handleChildNodeExpand
			}, null, 8, [
				"render-content",
				"render-after-expand",
				"show-checkbox",
				"node",
				"accordion",
				"props",
				"onNodeExpand"
			]);
		}), 128))], 10, _hoisted_2)), [[vShow, _ctx.expanded]]) : createCommentVNode("v-if", true)]),
		_: 1
	})], 42, _hoisted_1)), [[vShow, _ctx.node.visible]]);
}
var tree_node_default = /* @__PURE__ */ _plugin_vue_export_helper_default(tree_node_vue_vue_type_script_lang_default, [["render", _sfc_render$1]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/model/useKeydown.mjs
function useKeydown({ el$ }, store) {
	const ns = useNamespace("tree");
	onMounted(() => {
		initTabIndex();
	});
	onUpdated(() => {
		el$.value?.querySelectorAll("input[type=checkbox]").forEach((checkbox) => {
			checkbox.setAttribute("tabindex", "-1");
		});
	});
	function canNodeFocus(treeItems, nextIndex) {
		const currentNode = store.value.getNode(treeItems[nextIndex].dataset.key);
		return currentNode.canFocus && currentNode.visible && (currentNode.parent?.expanded || currentNode.parent?.level === 0);
	}
	const handleKeydown = (ev) => {
		const currentItem = ev.target;
		if (!currentItem.className.includes(ns.b("node"))) return;
		const code = getEventCode(ev);
		const treeItems = Array.from(el$.value.querySelectorAll(`.${ns.is("focusable")}[role=treeitem]`));
		const currentIndex = treeItems.indexOf(currentItem);
		let nextIndex;
		if ([EVENT_CODE.up, EVENT_CODE.down].includes(code)) {
			ev.preventDefault();
			if (code === EVENT_CODE.up) {
				nextIndex = currentIndex === -1 ? 0 : currentIndex !== 0 ? currentIndex - 1 : treeItems.length - 1;
				const startIndex = nextIndex;
				while (true) {
					if (canNodeFocus(treeItems, nextIndex)) break;
					nextIndex--;
					if (nextIndex === startIndex) {
						nextIndex = -1;
						break;
					}
					if (nextIndex < 0) nextIndex = treeItems.length - 1;
				}
			} else {
				nextIndex = currentIndex === -1 ? 0 : currentIndex < treeItems.length - 1 ? currentIndex + 1 : 0;
				const startIndex = nextIndex;
				while (true) {
					if (canNodeFocus(treeItems, nextIndex)) break;
					nextIndex++;
					if (nextIndex === startIndex) {
						nextIndex = -1;
						break;
					}
					if (nextIndex >= treeItems.length) nextIndex = 0;
				}
			}
			nextIndex !== -1 && treeItems[nextIndex].focus();
		}
		if ([EVENT_CODE.left, EVENT_CODE.right].includes(code)) {
			ev.preventDefault();
			currentItem.click();
		}
		const hasInput = currentItem.querySelector("[type=\"checkbox\"]");
		if ([
			EVENT_CODE.enter,
			EVENT_CODE.numpadEnter,
			EVENT_CODE.space
		].includes(code) && hasInput) {
			ev.preventDefault();
			hasInput.click();
		}
	};
	useEventListener(el$, "keydown", handleKeydown);
	const initTabIndex = () => {
		if (!el$.value) return;
		const treeItems = Array.from(el$.value.querySelectorAll(`.${ns.is("focusable")}[role=treeitem]`));
		Array.from(el$.value.querySelectorAll("input[type=checkbox]")).forEach((checkbox) => {
			checkbox.setAttribute("tabindex", "-1");
		});
		const checkedItem = el$.value.querySelectorAll(`.${ns.is("checked")}[role=treeitem]`);
		if (checkedItem.length) {
			checkedItem[0].setAttribute("tabindex", "0");
			return;
		}
		treeItems[0]?.setAttribute("tabindex", "0");
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tree.vue_vue_type_script_lang.mjs
var tree_vue_vue_type_script_lang_default = defineComponent({
	name: "ElTree",
	components: { ElTreeNode: tree_node_default },
	props: treeProps,
	emits: treeEmits,
	setup(props, ctx) {
		const { t } = useLocale();
		const ns = useNamespace("tree");
		const store = ref(new TreeStore({
			key: props.nodeKey,
			data: props.data,
			lazy: props.lazy,
			props: props.props,
			load: props.load,
			currentNodeKey: props.currentNodeKey,
			checkStrictly: props.checkStrictly,
			checkDescendants: props.checkDescendants,
			defaultCheckedKeys: props.defaultCheckedKeys,
			defaultExpandedKeys: props.defaultExpandedKeys,
			autoExpandParent: props.autoExpandParent,
			defaultExpandAll: props.defaultExpandAll,
			filterNodeMethod: props.filterNodeMethod
		}));
		store.value.initialize();
		const root = ref(store.value.root);
		const currentNode = ref(null);
		const el$ = ref(null);
		const dropIndicator$ = ref(null);
		const { broadcastExpanded } = useNodeExpandEventBroadcast(props);
		const { dragState } = useDragNodeHandler({
			props,
			ctx,
			el$,
			dropIndicator$,
			store
		});
		useKeydown({ el$ }, store);
		const instance = getCurrentInstance();
		const isSelectTree = computed(() => {
			let parent = instance?.parent;
			while (parent) {
				if (parent.type.name === "ElTreeSelect") return true;
				parent = parent.parent;
			}
			return false;
		});
		const isEmpty = computed(() => {
			const { childNodes } = root.value;
			return (!childNodes || childNodes.length === 0 || childNodes.every(({ visible }) => !visible)) && !isSelectTree.value;
		});
		watch(() => props.currentNodeKey, (newVal) => {
			store.value.setCurrentNodeKey(newVal ?? null);
		});
		watch(() => props.defaultCheckedKeys, (newVal, oldVal) => {
			if (isEqual(newVal, oldVal)) return;
			store.value.setDefaultCheckedKey(newVal ?? []);
		});
		watch(() => props.defaultExpandedKeys, (newVal) => {
			store.value.setDefaultExpandedKeys(newVal ?? []);
		});
		watch(() => props.data, (newVal) => {
			store.value.setData(newVal);
		}, { deep: true });
		watch(() => props.checkStrictly, (newVal) => {
			store.value.checkStrictly = newVal;
		});
		const filter = (value) => {
			if (!props.filterNodeMethod) throw new Error("[Tree] filterNodeMethod is required when filter");
			store.value.filter(value);
		};
		const getNodeKey$1 = (node) => {
			return props.nodeKey ? getNodeKey(props.nodeKey, node.data) : node.id;
		};
		const requireNodeKey = (methodName) => {
			if (!props.nodeKey) throw new Error(`[Tree] nodeKey is required in ${methodName}`);
		};
		const getNodePath = (data) => {
			requireNodeKey("getNodePath");
			const node = store.value.getNode(data);
			if (!node) return [];
			const path = [node.data];
			let parent = node.parent;
			while (parent && parent !== root.value) {
				path.push(parent.data);
				parent = parent.parent;
			}
			return path.reverse();
		};
		const getCheckedNodes = (leafOnly, includeHalfChecked) => {
			return store.value.getCheckedNodes(leafOnly, includeHalfChecked);
		};
		const getCheckedKeys = (leafOnly) => {
			return store.value.getCheckedKeys(leafOnly);
		};
		const getCurrentNode = () => {
			const currentNode = store.value.getCurrentNode();
			return currentNode ? currentNode.data : null;
		};
		const getCurrentKey = () => {
			requireNodeKey("getCurrentKey");
			const currentNode = getCurrentNode();
			return currentNode ? currentNode[props.nodeKey] : null;
		};
		const setCheckedNodes = (nodes, leafOnly) => {
			requireNodeKey("setCheckedNodes");
			store.value.setCheckedNodes(nodes, leafOnly);
		};
		const setCheckedKeys = (keys, leafOnly) => {
			requireNodeKey("setCheckedKeys");
			store.value.setCheckedKeys(keys, leafOnly);
		};
		const setChecked = (data, checked, deep = false) => {
			store.value.setChecked(data, checked, deep);
		};
		const getHalfCheckedNodes = () => {
			return store.value.getHalfCheckedNodes();
		};
		const getHalfCheckedKeys = () => {
			return store.value.getHalfCheckedKeys();
		};
		const setCurrentNode = (node, shouldAutoExpandParent = true) => {
			requireNodeKey("setCurrentNode");
			handleCurrentChange(store, ctx.emit, () => {
				broadcastExpanded(node);
				store.value.setUserCurrentNode(node, shouldAutoExpandParent);
			});
		};
		const setCurrentKey = (key = null, shouldAutoExpandParent = true) => {
			requireNodeKey("setCurrentKey");
			handleCurrentChange(store, ctx.emit, () => {
				broadcastExpanded();
				store.value.setCurrentNodeKey(key, shouldAutoExpandParent);
			});
		};
		const getNode = (data) => {
			return store.value.getNode(data);
		};
		const remove = (data) => {
			store.value.remove(data);
		};
		const append = (data, parentNode) => {
			store.value.append(data, parentNode);
		};
		const insertBefore = (data, refNode) => {
			store.value.insertBefore(data, refNode);
		};
		const insertAfter = (data, refNode) => {
			store.value.insertAfter(data, refNode);
		};
		const handleNodeExpand = (nodeData, node, instance) => {
			broadcastExpanded(node);
			ctx.emit("node-expand", nodeData, node, instance);
		};
		const updateKeyChildren = (key, data) => {
			requireNodeKey("updateKeyChildren");
			store.value.updateChildren(key, data);
		};
		provide(ROOT_TREE_INJECTION_KEY, {
			ctx,
			props,
			store,
			root,
			currentNode,
			instance
		});
		provide(formItemContextKey, void 0);
		return {
			ns,
			store,
			root,
			currentNode,
			dragState,
			el$,
			dropIndicator$,
			isEmpty,
			filter,
			getNodeKey: getNodeKey$1,
			getNodePath,
			getCheckedNodes,
			getCheckedKeys,
			getCurrentNode,
			getCurrentKey,
			setCheckedNodes,
			setCheckedKeys,
			setChecked,
			getHalfCheckedNodes,
			getHalfCheckedKeys,
			setCurrentNode,
			setCurrentKey,
			t,
			getNode,
			remove,
			append,
			insertBefore,
			insertAfter,
			handleNodeExpand,
			updateKeyChildren
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/src/tree2.mjs
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_tree_node = resolveComponent("el-tree-node");
	return openBlock(), createElementBlock("div", {
		ref: "el$",
		class: normalizeClass([
			_ctx.ns.b(),
			_ctx.ns.is("dragging", !!_ctx.dragState.draggingNode),
			_ctx.ns.is("drop-not-allow", !_ctx.dragState.allowDrop),
			_ctx.ns.is("drop-inner", _ctx.dragState.dropType === "inner"),
			{ [_ctx.ns.m("highlight-current")]: _ctx.highlightCurrent }
		]),
		role: "tree"
	}, [
		(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.root.childNodes, (child) => {
			return openBlock(), createBlock(_component_el_tree_node, {
				key: _ctx.getNodeKey(child),
				node: child,
				props: _ctx.props,
				accordion: _ctx.accordion,
				"render-after-expand": _ctx.renderAfterExpand,
				"show-checkbox": _ctx.showCheckbox,
				"render-content": _ctx.renderContent,
				onNodeExpand: _ctx.handleNodeExpand
			}, null, 8, [
				"node",
				"props",
				"accordion",
				"render-after-expand",
				"show-checkbox",
				"render-content",
				"onNodeExpand"
			]);
		}), 128)),
		_ctx.isEmpty ? (openBlock(), createElementBlock("div", {
			key: 0,
			class: normalizeClass(_ctx.ns.e("empty-block"))
		}, [renderSlot(_ctx.$slots, "empty", {}, () => [createBaseVNode("span", { class: normalizeClass(_ctx.ns.e("empty-text")) }, toDisplayString(_ctx.emptyText ?? _ctx.t("el.tree.emptyText")), 3)])], 2)) : createCommentVNode("v-if", true),
		withDirectives(createBaseVNode("div", {
			ref: "dropIndicator$",
			class: normalizeClass(_ctx.ns.e("drop-indicator"))
		}, null, 2), [[vShow, _ctx.dragState.showDropIndicator]])
	], 2);
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree/index.mjs
var ElTree = withInstall(/* @__PURE__ */ _plugin_vue_export_helper_default(tree_vue_vue_type_script_lang_default, [["render", _sfc_render]]));
//#endregion
export { treeProps as n, ElTree as t };
