import { B as h, Bn as isFunction, Ht as watch, J as inject, L as getCurrentInstance, Rn as isArray, Tn as toRefs, ct as onMounted, g as computed, gn as reactive, k as defineComponent, tt as nextTick, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { i as selectProps, r as ElSelect, s as selectKey, t as ElOption } from "./select-0mzxLp1O.js";
import { _ as isNil, d as isEmpty, r as useNamespace } from "./use-namespace-BksmY6RT.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { t as pick } from "./pick-BwGnaelS.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { u as useEventListener } from "./dist-Clzx2YUA.js";
import { s as escapeStringRegexp } from "./vnode-6UdpuL7k.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { n as treeProps, t as ElTree } from "./tree-BVPjmgDt.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/src/select.mjs
var useSelect = (props, { attrs, emit }, { select, tree, key }) => {
	const ns = useNamespace("tree-select");
	watch(() => props.data, () => {
		if (props.filterable) nextTick(() => {
			tree.value?.filter(select.value?.states.inputValue);
		});
	}, { flush: "post" });
	const focusLastNode = (listNode) => {
		const lastNode = listNode.at(-1);
		if (lastNode.expanded && lastNode.childNodes.at(-1)) focusLastNode([lastNode.childNodes.at(-1)]);
		else {
			(tree.value.el$?.querySelector(`[data-key="${listNode.at(-1).key}"]`))?.focus({ preventScroll: true });
			return;
		}
	};
	onMounted(() => {
		useEventListener(() => select.value?.$el, "keydown", async (evt) => {
			const code = getEventCode(evt);
			const { dropdownMenuVisible } = select.value;
			if ([EVENT_CODE.down, EVENT_CODE.up].includes(code) && dropdownMenuVisible) {
				await nextTick();
				setTimeout(() => {
					if (EVENT_CODE.up === code) {
						const listNode = tree.value.store.root.childNodes;
						focusLastNode(listNode);
						return;
					}
					select.value.optionsArray[select.value.states.hoveringIndex].$el?.parentNode?.parentNode?.focus({ preventScroll: true });
				});
			}
		}, { capture: true });
	});
	return {
		...pick(toRefs(props), Object.keys(ElSelect.props)),
		...attrs,
		class: computed(() => attrs.class),
		style: computed(() => attrs.style),
		"onUpdate:modelValue": (value) => emit(UPDATE_MODEL_EVENT, value),
		valueKey: key,
		popperClass: computed(() => {
			const classes = [ns.e("popper")];
			if (props.popperClass) classes.push(props.popperClass);
			return classes.join(" ");
		}),
		filterMethod: (keyword = "") => {
			if (props.filterMethod) props.filterMethod(keyword);
			else if (props.remoteMethod) props.remoteMethod(keyword);
			else tree.value?.filter(keyword);
		}
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/src/tree-select-option.mjs
var component = defineComponent({
	extends: ElOption,
	setup(props, ctx) {
		const result = ElOption.setup(props, ctx);
		delete result.selectOptionClick;
		const vm = getCurrentInstance().proxy;
		nextTick(() => {
			if (!result.select.states.cachedOptions.get(vm.value)) result.select.onOptionCreate(vm);
		});
		watch(() => ctx.attrs.visible, (val) => {
			nextTick(() => {
				result.states.visible = val;
			});
		}, { immediate: true });
		return result;
	},
	methods: { selectOptionClick() {
		this.$el.parentElement.click();
	} }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/src/utils.mjs
function isValidValue(val) {
	return val || val === 0;
}
function isValidArray(val) {
	return isArray(val) && val.length;
}
function toValidArray(val) {
	return isArray(val) ? val : isValidValue(val) ? [val] : [];
}
function treeFind(treeData, findCallback, getChildren, resultCallback, parent) {
	for (let i = 0; i < treeData.length; i++) {
		const data = treeData[i];
		if (findCallback(data, i, treeData, parent)) return resultCallback ? resultCallback(data, i, treeData, parent) : data;
		else {
			const children = getChildren(data);
			if (isValidArray(children)) {
				const find = treeFind(children, findCallback, getChildren, resultCallback, data);
				if (find) return find;
			}
		}
	}
}
function treeEach(treeData, callback, getChildren, parent) {
	for (let i = 0; i < treeData.length; i++) {
		const data = treeData[i];
		callback(data, i, treeData, parent);
		const children = getChildren(data);
		if (isValidArray(children)) treeEach(children, callback, getChildren, data);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/src/tree.mjs
var useTree = (props, { attrs, slots, emit }, { select, tree, key }) => {
	watch([() => props.modelValue, tree], () => {
		if (props.showCheckbox) nextTick(() => {
			const treeInstance = tree.value;
			if (treeInstance && !isEqual(treeInstance.getCheckedKeys(), toValidArray(props.modelValue))) treeInstance.setCheckedKeys(toValidArray(props.modelValue));
		});
	}, {
		immediate: true,
		deep: true
	});
	const propsMap = computed(() => ({
		value: key.value,
		label: "label",
		children: "children",
		disabled: "disabled",
		isLeaf: "isLeaf",
		...props.props
	}));
	const getNodeValByProp = (prop, data) => {
		const propVal = propsMap.value[prop];
		if (isFunction(propVal)) return propVal(data, tree.value?.getNode(getNodeValByProp("value", data)));
		else return data[propVal];
	};
	const defaultExpandedParentKeys = toValidArray(props.modelValue).map((value) => {
		return treeFind(props.data || [], (data) => getNodeValByProp("value", data) === value, (data) => getNodeValByProp("children", data), (data, index, array, parent) => parent && getNodeValByProp("value", parent));
	}).filter((item) => isValidValue(item));
	const cacheOptions = computed(() => {
		if (!props.renderAfterExpand && !props.lazy) return [];
		const options = [];
		treeEach(props.data.concat(props.cacheData), (node) => {
			const value = getNodeValByProp("value", node);
			options.push({
				value,
				currentLabel: getNodeValByProp("label", node),
				isDisabled: getNodeValByProp("disabled", node)
			});
		}, (data) => getNodeValByProp("children", data));
		return options;
	});
	const getChildCheckedKeys = () => {
		return tree.value?.getCheckedKeys().filter((checkedKey) => {
			const node = tree.value?.getNode(checkedKey);
			return !isNil(node) && isEmpty(node.childNodes);
		});
	};
	const emitChange = (val) => {
		if (!isEqual(props.modelValue, val)) emit(CHANGE_EVENT, val);
	};
	function update(val) {
		emit(UPDATE_MODEL_EVENT, val);
		emitChange(val);
	}
	return {
		...pick(toRefs(props), Object.keys(ElTree.props)),
		...attrs,
		nodeKey: key,
		expandOnClickNode: computed(() => {
			return !props.checkStrictly && props.expandOnClickNode;
		}),
		defaultExpandedKeys: computed(() => {
			return props.defaultExpandedKeys ? props.defaultExpandedKeys.concat(defaultExpandedParentKeys) : defaultExpandedParentKeys;
		}),
		renderContent: (h, { node, data, store }) => {
			return h(component, {
				value: getNodeValByProp("value", data),
				label: getNodeValByProp("label", data),
				disabled: getNodeValByProp("disabled", data),
				visible: node.visible
			}, props.renderContent ? () => props.renderContent(h, {
				node,
				data,
				store
			}) : slots.default ? () => slots.default({
				node,
				data,
				store
			}) : void 0);
		},
		filterNodeMethod: (value, data, node) => {
			if (props.filterNodeMethod) return props.filterNodeMethod(value, data, node);
			if (!value) return true;
			return new RegExp(escapeStringRegexp(value), "i").test(getNodeValByProp("label", data) || "");
		},
		onNodeClick: (data, node, e) => {
			attrs.onNodeClick?.(data, node, e);
			if (props.showCheckbox && props.checkOnClickNode) return;
			if (!props.showCheckbox && (props.checkStrictly || node.isLeaf)) {
				if (!getNodeValByProp("disabled", data)) {
					const option = select.value?.states.options.get(getNodeValByProp("value", data));
					select.value?.handleOptionSelect(option);
				}
			} else if (props.expandOnClickNode) e.proxy.handleExpandIconClick();
		},
		onCheck: (data, params) => {
			if (!props.showCheckbox) return;
			const dataValue = getNodeValByProp("value", data);
			const dataMap = {};
			treeEach([tree.value.store.root], (node) => dataMap[node.key] = node, (node) => node.childNodes);
			const uncachedCheckedKeys = params.checkedKeys;
			const cachedKeys = props.multiple ? toValidArray(props.modelValue).filter((item) => !(item in dataMap) && !uncachedCheckedKeys.includes(item)) : [];
			const checkedKeys = cachedKeys.concat(uncachedCheckedKeys);
			if (props.checkStrictly) update(props.multiple ? checkedKeys : checkedKeys.includes(dataValue) ? dataValue : void 0);
			else if (props.multiple) {
				const childKeys = getChildCheckedKeys();
				update(cachedKeys.concat(childKeys));
			} else {
				const firstLeaf = treeFind([data], (data) => !isValidArray(getNodeValByProp("children", data)) && !getNodeValByProp("disabled", data), (data) => getNodeValByProp("children", data));
				const firstLeafKey = firstLeaf ? getNodeValByProp("value", firstLeaf) : void 0;
				const hasCheckedChild = isValidValue(props.modelValue) && !!treeFind([data], (data) => getNodeValByProp("value", data) === props.modelValue, (data) => getNodeValByProp("children", data));
				update(firstLeafKey === props.modelValue || hasCheckedChild ? void 0 : firstLeafKey);
			}
			nextTick(() => {
				const checkedKeys = toValidArray(props.modelValue);
				tree.value.setCheckedKeys(checkedKeys);
				attrs.onCheck?.(data, {
					checkedKeys: tree.value.getCheckedKeys(),
					checkedNodes: tree.value.getCheckedNodes(),
					halfCheckedKeys: tree.value.getHalfCheckedKeys(),
					halfCheckedNodes: tree.value.getHalfCheckedNodes()
				});
			});
			select.value?.focus();
		},
		onNodeExpand: (data, node, e) => {
			attrs.onNodeExpand?.(data, node, e);
			nextTick(() => {
				if (!props.checkStrictly && props.lazy && props.multiple && node.checked) {
					const dataMap = {};
					const uncachedCheckedKeys = tree.value.getCheckedKeys();
					treeEach([tree.value.store.root], (node) => dataMap[node.key] = node, (node) => node.childNodes);
					const cachedKeys = toValidArray(props.modelValue).filter((item) => !(item in dataMap) && !uncachedCheckedKeys.includes(item));
					const childKeys = getChildCheckedKeys();
					update(cachedKeys.concat(childKeys));
				}
			});
		},
		cacheOptions
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/src/cache-options.mjs
var cache_options_default = defineComponent({
	props: { data: {
		type: Array,
		default: () => []
	} },
	setup(props) {
		const select = inject(selectKey);
		watch(() => props.data, () => {
			props.data.forEach((item) => {
				if (!select.states.cachedOptions.has(item.value)) select.states.cachedOptions.set(item.value, item);
			});
			const inputs = select.selectRef?.querySelectorAll("input") || [];
			if (isClient && !Array.from(inputs).includes(document.activeElement)) select.setSelected();
		}, {
			flush: "post",
			immediate: true
		});
		return () => void 0;
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/src/tree-select.mjs
var tree_select_default = defineComponent({
	name: "ElTreeSelect",
	inheritAttrs: false,
	props: {
		...selectProps,
		...treeProps,
		/**
		* @description The cached data of the lazy node, the structure is the same as the data, used to get the label of the unloaded data
		*/
		cacheData: {
			type: Array,
			default: () => []
		}
	},
	setup(props, context) {
		const { slots, expose, emit, attrs } = context;
		const childAttrs = {
			...attrs,
			onChange: void 0
		};
		const select = ref();
		const tree = ref();
		const key = computed(() => props.nodeKey || props.valueKey || "value");
		const selectProps = useSelect(props, {
			attrs,
			emit
		}, {
			select,
			tree,
			key
		});
		const { cacheOptions, ...treeProps } = useTree(props, {
			attrs: childAttrs,
			slots,
			emit
		}, {
			select,
			tree,
			key
		});
		const methods = reactive({});
		expose(methods);
		onMounted(() => {
			Object.assign(methods, {
				...pick(tree.value, [
					"filter",
					"updateKeyChildren",
					"getCheckedNodes",
					"setCheckedNodes",
					"getCheckedKeys",
					"setCheckedKeys",
					"setChecked",
					"getHalfCheckedNodes",
					"getHalfCheckedKeys",
					"getCurrentKey",
					"getCurrentNode",
					"setCurrentKey",
					"setCurrentNode",
					"getNode",
					"remove",
					"append",
					"insertBefore",
					"insertAfter"
				]),
				...pick(select.value, [
					"focus",
					"blur",
					"selectedLabel"
				]),
				treeRef: tree.value,
				selectRef: select.value
			});
		});
		return () => h(
			ElSelect,
			/**
			* 1. The `props` is processed into `Refs`, but `v-bind` and
			* render function props cannot read `Refs`, so use `reactive`
			* unwrap the `Refs` and keep reactive.
			* 2. The keyword `ref` requires `Ref`, but `reactive` broke it,
			* so use function.
			*/
			reactive({
				...selectProps,
				ref: (ref) => select.value = ref
			}),
			{
				...slots,
				default: () => [h(cache_options_default, { data: cacheOptions.value }), h(ElTree, reactive({
					...treeProps,
					ref: (ref) => tree.value = ref
				}))]
			}
		);
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/tree-select/index.mjs
var ElTreeSelect = withInstall(tree_select_default);
//#endregion
export { ElTreeSelect as t };
