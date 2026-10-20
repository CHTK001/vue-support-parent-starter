import { $n as normalizeClass, An as NOOP, Bn as isFunction, Cn as toRaw, Ct as resolveDirective, D as createVNode, E as createTextVNode, Hn as isObject, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Lt as useSlots, On as unref, Rn as isArray, St as resolveComponent, Tn as toRefs, Ut as watchEffect, Wn as isPlainObject, Yt as withDirectives, Z as isVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, gn as reactive, gt as provide, ir as toHandlerKey, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { t as toInteger } from "./toInteger-DwissHgA.js";
import { r as baseFindIndex, t as baseIteratee } from "./_baseIteratee-0zvAcVIj.js";
import { t as get } from "./get-cR0zxN0m.js";
import { t as castArray } from "./castArray-DkZAeVfZ.js";
import { t as clamp } from "./clamp--xaQdoQg.js";
import { _ as isNil, a as throwError, c as definePropType, d as isEmpty, f as isNumber, h as isUndefined, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { a as isClient, s as isIOS, v as useDebounceFn } from "./dist-DI3cGDuP.js";
import { h as useResizeObserver, m as useMutationObserver } from "./dist-Clzx2YUA.js";
import { i as isFocusable } from "./aria-DKP9Ei-1.js";
import { s as escapeStringRegexp, t as flattedChildren } from "./vnode-6UdpuL7k.js";
import { o as scrollIntoView } from "./scroll-CaaKdoVq.js";
import { r as useTooltipContentProps, t as ElTooltip, u as Ee } from "./tooltip-DEX5DBfd.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { n as _plugin_vue_export_helper_default } from "./focus-trap-B31xXeBw.js";
import { n as useFocusController, t as useComposition } from "./use-composition-BHiYKdrO.js";
import { n as useEmptyValues, r as useEmptyValuesProps } from "./use-empty-values-B_20a6o3.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { b as circle_close_default, r as arrow_down_default } from "./dist-DogtK295.js";
import { a as iconPropType, i as ValidateComponentsMap } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { n as useFormItemInputId, t as useFormItem } from "./use-form-item-D-dEMqBj.js";
import { r as scrollbarEmits, t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as ClickOutside } from "./click-outside-B3b0egMR.js";
import { n as tagProps, t as ElTag } from "./tag-CqzZCxmq.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/findLastIndex.js
var nativeMax = Math.max;
var nativeMin = Math.min;
/**
* This method is like `_.findIndex` except that it iterates over elements
* of `collection` from right to left.
*
* @static
* @memberOf _
* @since 2.0.0
* @category Array
* @param {Array} array The array to inspect.
* @param {Function} [predicate=_.identity] The function invoked per iteration.
* @param {number} [fromIndex=array.length-1] The index to search from.
* @returns {number} Returns the index of the found element, else `-1`.
* @example
*
* var users = [
*   { 'user': 'barney',  'active': true },
*   { 'user': 'fred',    'active': false },
*   { 'user': 'pebbles', 'active': false }
* ];
*
* _.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
* // => 2
*
* // The `_.matches` iteratee shorthand.
* _.findLastIndex(users, { 'user': 'barney', 'active': true });
* // => 0
*
* // The `_.matchesProperty` iteratee shorthand.
* _.findLastIndex(users, ['active', false]);
* // => 2
*
* // The `_.property` iteratee shorthand.
* _.findLastIndex(users, 'active');
* // => 0
*/
function findLastIndex(array, predicate, fromIndex) {
	var length = array == null ? 0 : array.length;
	if (!length) return -1;
	var index = length - 1;
	if (fromIndex !== void 0) {
		index = toInteger(fromIndex);
		index = fromIndex < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
	}
	return baseFindIndex(array, baseIteratee(predicate, 3), index, true);
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-calc-input-width/index.mjs
function useCalcInputWidth() {
	const calculatorRef = shallowRef();
	const calculatorWidth = ref(0);
	const inputStyle = computed(() => ({ minWidth: `${Math.max(calculatorWidth.value, 11)}px` }));
	const resetCalculatorWidth = () => {
		calculatorWidth.value = calculatorRef.value?.getBoundingClientRect().width ?? 0;
	};
	useResizeObserver(calculatorRef, resetCalculatorWidth);
	return {
		calculatorRef,
		calculatorWidth,
		inputStyle
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/token.mjs
var selectGroupKey = Symbol("ElSelectGroup");
var selectKey = Symbol("ElSelect");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select-v2/src/useProps.mjs
var defaultProps = {
	label: "label",
	value: "value",
	disabled: "disabled",
	options: "options"
};
function useProps(props) {
	const aliasProps = ref({
		...defaultProps,
		...props.props
	});
	let cache = { ...props.props };
	watch(() => props.props, (val) => {
		if (!isEqual(val, cache)) {
			aliasProps.value = {
				...defaultProps,
				...val
			};
			cache = { ...val };
		}
	}, { deep: true });
	const getLabel = (option) => get(option, aliasProps.value.label);
	const getValue = (option) => get(option, aliasProps.value.value);
	const getDisabled = (option) => get(option, aliasProps.value.disabled);
	const getOptions = (option) => get(option, aliasProps.value.options);
	return {
		aliasProps,
		getLabel,
		getValue,
		getDisabled,
		getOptions
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/select.mjs
var selectProps = buildProps({
	/**
	* @description the name attribute of select input
	*/
	name: String,
	/**
	* @description native input id
	*/
	id: String,
	/**
	* @description binding value
	*/
	modelValue: {
		type: definePropType([
			Array,
			String,
			Number,
			Boolean,
			Object
		]),
		default: void 0
	},
	/**
	* @description the autocomplete attribute of select input
	*/
	autocomplete: {
		type: String,
		default: "off"
	},
	/**
	* @description for non-filterable Select, this prop decides if the option menu pops up when the input is focused
	*/
	automaticDropdown: Boolean,
	/**
	* @description size of Input
	*/
	size: useSizeProp,
	/**
	* @description tooltip theme, built-in theme: `dark` / `light`
	*/
	effect: {
		type: definePropType(String),
		default: "light"
	},
	/**
	* @description whether Select is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether select can be cleared
	*/
	clearable: Boolean,
	/**
	* @description whether Select is filterable
	*/
	filterable: Boolean,
	/**
	* @description whether creating new items is allowed. To use this, `filterable` must be true
	*/
	allowCreate: Boolean,
	/**
	* @description whether Select is loading data from server
	*/
	loading: Boolean,
	/**
	* @description custom class name for Select's dropdown
	*/
	popperClass: {
		type: String,
		default: ""
	},
	/**
	* @description custom style for Select's dropdown
	*/
	popperStyle: { type: definePropType([String, Object]) },
	/**
	* @description [popper.js](https://popper.js.org/docs/v2/) parameters
	*/
	popperOptions: {
		type: definePropType(Object),
		default: () => ({})
	},
	/**
	* @description whether options are loaded from server
	*/
	remote: Boolean,
	/**
	* @description debounce delay during remote search, in milliseconds
	*/
	debounce: {
		type: Number,
		default: 300
	},
	/**
	* @description displayed text while loading data from server, default is 'Loading'
	*/
	loadingText: String,
	/**
	* @description displayed text when no data matches the filtering query, you can also use slot `empty`, default is 'No matching data'
	*/
	noMatchText: String,
	/**
	* @description displayed text when there is no options, you can also use slot `empty`, default is 'No data'
	*/
	noDataText: String,
	/**
	* @description function that gets called when the input value changes. Its parameter is the current input value. To use this, `filterable` must be true
	*/
	remoteMethod: { type: definePropType(Function) },
	/**
	* @description custom filter method, the first parameter is the current input value. To use this, `filterable` must be true
	*/
	filterMethod: { type: definePropType(Function) },
	/**
	* @description whether multiple-select is activated
	*/
	multiple: Boolean,
	/**
	* @description maximum number of options user can select when `multiple` is `true`. No limit when set to 0
	*/
	multipleLimit: {
		type: Number,
		default: 0
	},
	/**
	* @description placeholder, default is 'Select'
	*/
	placeholder: { type: String },
	/**
	* @description select first matching option on enter key. Use with `filterable` or `remote`
	*/
	defaultFirstOption: Boolean,
	/**
	* @description when `multiple` and `filter` is true, whether to reserve current keyword after selecting an option
	*/
	reserveKeyword: {
		type: Boolean,
		default: true
	},
	/**
	* @description unique identity key name for value, required when value is an object
	*/
	valueKey: {
		type: String,
		default: "value"
	},
	/**
	* @description whether to collapse tags to a text when multiple selecting
	*/
	collapseTags: Boolean,
	/**
	* @description whether show all selected tags when mouse hover text of collapse-tags. To use this, `collapse-tags` must be true
	*/
	collapseTagsTooltip: Boolean,
	/**
	* @description configuration object for the collapse-tags tooltip. To use this, `collapse-tags` and `collapse-tags-tooltip` must be true
	*/
	tagTooltip: {
		type: definePropType(Object),
		default: () => ({})
	},
	/**
	* @description the max tags number to be shown. To use this, `collapse-tags` must be true
	*/
	maxCollapseTags: {
		type: Number,
		default: 1
	},
	/**
	* @description whether select dropdown is teleported, if `true` it will be teleported to where `append-to` sets
	*/
	teleported: useTooltipContentProps.teleported,
	/**
	* @description when select dropdown is inactive and `persistent` is `false`, select dropdown will be destroyed
	*/
	persistent: {
		type: Boolean,
		default: true
	},
	/**
	* @description custom clear icon component
	*/
	clearIcon: {
		type: iconPropType,
		default: circle_close_default
	},
	/**
	* @description whether the width of the dropdown is the same as the input
	*/
	fitInputWidth: Boolean,
	/**
	* @description custom suffix icon component
	*/
	suffixIcon: {
		type: iconPropType,
		default: arrow_down_default
	},
	/**
	* @description tag type
	*/
	tagType: {
		...tagProps.type,
		default: "info"
	},
	/**
	* @description tag effect
	*/
	tagEffect: {
		...tagProps.effect,
		default: "light"
	},
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	/**
	* @description in remote search method show suffix icon
	*/
	remoteShowSuffix: Boolean,
	/**
	* @description determines whether the arrow is displayed
	*/
	showArrow: {
		type: Boolean,
		default: true
	},
	/**
	* @description offset of the dropdown
	*/
	offset: {
		type: Number,
		default: 12
	},
	/**
	* @description position of dropdown
	*/
	placement: {
		type: definePropType(String),
		values: Ee,
		default: "bottom-start"
	},
	/**
	* @description list of possible positions for dropdown
	*/
	fallbackPlacements: {
		type: definePropType(Array),
		default: [
			"bottom-start",
			"top-start",
			"right",
			"left"
		]
	},
	/**
	* @description tabindex for input
	*/
	tabindex: {
		type: [String, Number],
		default: 0
	},
	/**
	* @description which element the selection dropdown appends to
	*/
	appendTo: useTooltipContentProps.appendTo,
	options: { type: definePropType(Array) },
	props: {
		type: definePropType(Object),
		default: () => defaultProps
	},
	...useEmptyValuesProps,
	...useAriaProps(["ariaLabel"])
});
var selectEmits = {
	[UPDATE_MODEL_EVENT]: (val) => true,
	[CHANGE_EVENT]: (val) => true,
	"popup-scroll": scrollbarEmits.scroll,
	"end-reached": scrollbarEmits["end-reached"],
	"remove-tag": (val) => true,
	"visible-change": (visible) => true,
	focus: (evt) => evt instanceof FocusEvent,
	blur: (evt) => evt instanceof FocusEvent,
	clear: () => true
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/option.mjs
var COMPONENT_NAME$1 = "ElOption";
var optionProps = buildProps({
	/**
	* @description value of option
	*/
	value: {
		type: [
			String,
			Number,
			Boolean,
			Object
		],
		required: true
	},
	/**
	* @description label of option, same as `value` if omitted
	*/
	label: { type: [String, Number] },
	created: Boolean,
	/**
	* @description whether option is disabled
	*/
	disabled: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/useOption.mjs
function useOption(props, states) {
	const select = inject(selectKey);
	if (!select) throwError(COMPONENT_NAME$1, "usage: <el-select><el-option /></el-select/>");
	const selectGroup = inject(selectGroupKey, { disabled: false });
	const itemSelected = computed(() => {
		return contains(castArray(select.props.modelValue), props.value);
	});
	const limitReached = computed(() => {
		if (select.props.multiple) {
			const modelValue = castArray(select.props.modelValue ?? []);
			return !itemSelected.value && modelValue.length >= select.props.multipleLimit && select.props.multipleLimit > 0;
		} else return false;
	});
	const currentLabel = computed(() => {
		return props.label ?? (isObject(props.value) ? "" : props.value);
	});
	const currentValue = computed(() => {
		return props.value || props.label || "";
	});
	const isDisabled = computed(() => {
		return props.disabled || states.groupDisabled || limitReached.value;
	});
	const instance = getCurrentInstance();
	const contains = (arr = [], target) => {
		if (!isObject(props.value)) return arr && arr.includes(target);
		else {
			const valueKey = select.props.valueKey;
			return arr && arr.some((item) => {
				return toRaw(get(item, valueKey)) === get(target, valueKey);
			});
		}
	};
	const hoverItem = () => {
		if (!isDisabled.value) select.states.hoveringIndex = select.optionsArray.indexOf(instance.proxy);
	};
	const updateOption = (query) => {
		states.visible = new RegExp(escapeStringRegexp(query), "i").test(String(currentLabel.value)) || props.created;
	};
	watch(() => currentLabel.value, () => {
		if (!props.created && !select.props.remote) select.setSelected();
	});
	watch(() => props.value, (val, oldVal) => {
		const { remote, valueKey } = select.props;
		if (remote ? val !== oldVal : !isEqual(val, oldVal)) {
			select.onOptionDestroy(oldVal, instance.proxy);
			select.onOptionCreate(instance.proxy);
		}
		if (!props.created && !remote) {
			if (valueKey && isObject(val) && isObject(oldVal) && val[valueKey] === oldVal[valueKey]) return;
			select.setSelected();
		}
	});
	watch(() => selectGroup.disabled, () => {
		states.groupDisabled = selectGroup.disabled;
	}, { immediate: true });
	return {
		select,
		currentLabel,
		currentValue,
		itemSelected,
		isDisabled,
		hoverItem,
		updateOption
	};
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/option.vue_vue_type_script_lang.mjs
var option_vue_vue_type_script_lang_default = defineComponent({
	name: COMPONENT_NAME$1,
	componentName: COMPONENT_NAME$1,
	props: optionProps,
	setup(props) {
		const ns = useNamespace("select");
		const id = useId();
		const containerKls = computed(() => [
			ns.be("dropdown", "item"),
			ns.is("disabled", unref(isDisabled)),
			ns.is("selected", unref(itemSelected)),
			ns.is("hovering", unref(hover))
		]);
		const states = reactive({
			index: -1,
			groupDisabled: false,
			visible: true,
			hover: false
		});
		const mouseMoveEventName = isIOS ? null : "mousemove";
		const { currentLabel, itemSelected, isDisabled, select, hoverItem, updateOption } = useOption(props, states);
		const { visible, hover } = toRefs(states);
		const vm = getCurrentInstance().proxy;
		select.onOptionCreate(vm);
		onBeforeUnmount(() => {
			const key = vm.value;
			nextTick(() => {
				const { selected: selectedOptions } = select.states;
				const doesSelected = selectedOptions.some((item) => {
					return item.value === vm.value;
				});
				if (select.states.cachedOptions.get(key) === vm && !doesSelected) select.states.cachedOptions.delete(key);
			});
			select.onOptionDestroy(key, vm);
		});
		function selectOptionClick() {
			if (!isDisabled.value) select.handleOptionSelect(vm);
		}
		const handleMousedown = (event) => {
			let target = event.target;
			const currentTarget = event.currentTarget;
			while (target && target !== currentTarget) {
				if (isFocusable(target)) return;
				target = target.parentElement;
			}
			event.preventDefault();
		};
		return {
			ns,
			id,
			containerKls,
			currentLabel,
			itemSelected,
			isDisabled,
			select,
			visible,
			hover,
			states,
			mouseMoveEventName,
			hoverItem,
			handleMousedown,
			updateOption,
			selectOptionClick
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/option2.mjs
var _hoisted_1$1 = [
	"id",
	"aria-disabled",
	"aria-selected"
];
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
	return withDirectives((openBlock(), createElementBlock("li", mergeProps({
		id: _ctx.id,
		class: _ctx.containerKls,
		role: "option",
		"aria-disabled": _ctx.isDisabled || void 0,
		"aria-selected": _ctx.itemSelected
	}, { [toHandlerKey(_ctx.mouseMoveEventName)]: _cache[0] || (_cache[0] = (...args) => _ctx.hoverItem && _ctx.hoverItem(...args)) }, {
		onMousedown: _cache[1] || (_cache[1] = (...args) => _ctx.handleMousedown && _ctx.handleMousedown(...args)),
		onClick: _cache[2] || (_cache[2] = withModifiers((...args) => _ctx.selectOptionClick && _ctx.selectOptionClick(...args), ["stop"]))
	}), [renderSlot(_ctx.$slots, "default", {}, () => [createBaseVNode("span", null, toDisplayString(_ctx.currentLabel), 1)])], 16, _hoisted_1$1)), [[vShow, _ctx.visible]]);
}
var option_default = /* @__PURE__ */ _plugin_vue_export_helper_default(option_vue_vue_type_script_lang_default, [["render", _sfc_render$3]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/option-group.vue_vue_type_script_lang.mjs
var option_group_vue_vue_type_script_lang_default = defineComponent({
	name: "ElOptionGroup",
	componentName: "ElOptionGroup",
	props: {
		/**
		* @description name of the group
		*/
		label: String,
		/**
		* @description whether to disable all options in this group
		*/
		disabled: Boolean
	},
	setup(props) {
		const ns = useNamespace("select");
		const groupRef = ref();
		const instance = getCurrentInstance();
		const children = ref([]);
		provide(selectGroupKey, reactive({ ...toRefs(props) }));
		const visible = computed(() => children.value.some((option) => option.visible === true));
		const isOption = (node) => node.type.name === "ElOption" && !!node.component?.proxy;
		const flattedChildren = (node) => {
			const nodes = castArray(node);
			const children = [];
			nodes.forEach((child) => {
				if (!isVNode(child)) return;
				if (isOption(child)) children.push(child.component.proxy);
				else if (isArray(child.children) && child.children.length) children.push(...flattedChildren(child.children));
				else if (child.component?.subTree) children.push(...flattedChildren(child.component.subTree));
			});
			return children;
		};
		const updateChildren = () => {
			children.value = flattedChildren(instance.subTree);
		};
		onMounted(() => {
			updateChildren();
		});
		useMutationObserver(groupRef, updateChildren, {
			attributes: true,
			subtree: true,
			childList: true
		});
		return {
			groupRef,
			visible,
			ns
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/option-group.mjs
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
	return withDirectives((openBlock(), createElementBlock("ul", {
		ref: "groupRef",
		class: normalizeClass(_ctx.ns.be("group", "wrap"))
	}, [createBaseVNode("li", { class: normalizeClass(_ctx.ns.be("group", "title")) }, toDisplayString(_ctx.label), 3), createBaseVNode("li", null, [createBaseVNode("ul", { class: normalizeClass(_ctx.ns.b("group")) }, [renderSlot(_ctx.$slots, "default")], 2)])], 2)), [[vShow, _ctx.visible]]);
}
var option_group_default = /* @__PURE__ */ _plugin_vue_export_helper_default(option_group_vue_vue_type_script_lang_default, [["render", _sfc_render$2]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/select-dropdown.vue_vue_type_script_lang.mjs
var select_dropdown_vue_vue_type_script_lang_default = defineComponent({
	name: "ElSelectDropdown",
	componentName: "ElSelectDropdown",
	setup() {
		const select = inject(selectKey);
		const ns = useNamespace("select");
		const popperClass = computed(() => select.props.popperClass);
		const isMultiple = computed(() => select.props.multiple);
		const isFitInputWidth = computed(() => select.props.fitInputWidth);
		const minWidth = ref("");
		function updateMinWidth() {
			const offsetWidth = select.selectRef?.offsetWidth;
			if (offsetWidth) minWidth.value = `${offsetWidth - 2}px`;
			else minWidth.value = "";
		}
		onMounted(() => {
			updateMinWidth();
			useResizeObserver(select.selectRef, updateMinWidth);
		});
		return {
			ns,
			minWidth,
			popperClass,
			isMultiple,
			isFitInputWidth
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/select-dropdown.mjs
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
	return openBlock(), createElementBlock("div", {
		class: normalizeClass([
			_ctx.ns.b("dropdown"),
			_ctx.ns.is("multiple", _ctx.isMultiple),
			_ctx.popperClass
		]),
		style: normalizeStyle({ [_ctx.isFitInputWidth ? "width" : "minWidth"]: _ctx.minWidth })
	}, [
		_ctx.$slots.header ? (openBlock(), createElementBlock("div", {
			key: 0,
			class: normalizeClass(_ctx.ns.be("dropdown", "header"))
		}, [renderSlot(_ctx.$slots, "header")], 2)) : createCommentVNode("v-if", true),
		renderSlot(_ctx.$slots, "default"),
		_ctx.$slots.footer ? (openBlock(), createElementBlock("div", {
			key: 1,
			class: normalizeClass(_ctx.ns.be("dropdown", "footer"))
		}, [renderSlot(_ctx.$slots, "footer")], 2)) : createCommentVNode("v-if", true)
	], 6);
}
var select_dropdown_default = /* @__PURE__ */ _plugin_vue_export_helper_default(select_dropdown_vue_vue_type_script_lang_default, [["render", _sfc_render$1]]);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/useSelect.mjs
var useSelect = (props, emit) => {
	const { t } = useLocale();
	const slots = useSlots();
	const contentId = useId();
	const nsSelect = useNamespace("select");
	const nsInput = useNamespace("input");
	const states = reactive({
		inputValue: "",
		options: /* @__PURE__ */ new Map(),
		cachedOptions: /* @__PURE__ */ new Map(),
		optionValues: [],
		selected: [],
		selectionWidth: 0,
		collapseItemWidth: 0,
		selectedLabel: "",
		hoveringIndex: -1,
		previousQuery: null,
		inputHovering: false,
		menuVisibleOnFocus: false,
		isBeforeHide: false
	});
	const selectRef = ref();
	const selectionRef = ref();
	const tooltipRef = ref();
	const tagTooltipRef = ref();
	const inputRef = ref();
	const prefixRef = ref();
	const suffixRef = ref();
	const menuRef = ref();
	const tagMenuRef = ref();
	const collapseItemRef = ref();
	const scrollbarRef = ref();
	const expanded = ref(false);
	const hoverOption = ref();
	const debouncing = ref(false);
	const { form, formItem } = useFormItem();
	const { inputId } = useFormItemInputId(props, { formItemContext: formItem });
	const { valueOnClear, isEmptyValue } = useEmptyValues(props);
	const { isComposing, handleCompositionStart, handleCompositionUpdate, handleCompositionEnd } = useComposition({ afterComposition: (e) => onInput(e) });
	const selectDisabled = useFormDisabled();
	const { wrapperRef, isFocused, handleBlur } = useFocusController(inputRef, {
		disabled: selectDisabled,
		afterFocus() {
			if (props.automaticDropdown && !expanded.value) {
				expanded.value = true;
				states.menuVisibleOnFocus = true;
			}
		},
		beforeBlur(event) {
			return tooltipRef.value?.isFocusInsideContent(event) || tagTooltipRef.value?.isFocusInsideContent(event);
		},
		afterBlur() {
			expanded.value = false;
			states.menuVisibleOnFocus = false;
			if (props.validateEvent) formItem?.validate?.("blur").catch(NOOP);
		}
	});
	const hasModelValue = computed(() => {
		return isArray(props.modelValue) ? props.modelValue.length > 0 : !isEmptyValue(props.modelValue);
	});
	const needStatusIcon = computed(() => form?.statusIcon ?? false);
	const showClearBtn = computed(() => {
		return props.clearable && !selectDisabled.value && hasModelValue.value && (isFocused.value || states.inputHovering);
	});
	const iconComponent = computed(() => props.remote && props.filterable && !props.remoteShowSuffix ? "" : props.suffixIcon);
	const iconReverse = computed(() => nsSelect.is("reverse", !!(iconComponent.value && expanded.value)));
	const validateState = computed(() => formItem?.validateState || "");
	const validateIcon = computed(() => validateState.value && ValidateComponentsMap[validateState.value]);
	const debounce = computed(() => props.remote ? props.debounce : 0);
	const isRemoteSearchEmpty = computed(() => props.remote && !states.inputValue && states.options.size === 0);
	const emptyText = computed(() => {
		if (props.loading) return props.loadingText || t("el.select.loading");
		else {
			if (props.filterable && states.inputValue && states.options.size > 0 && filteredOptionsCount.value === 0) return props.noMatchText || t("el.select.noMatch");
			if (states.options.size === 0) return props.noDataText || t("el.select.noData");
		}
		return null;
	});
	const filteredOptionsCount = computed(() => optionsArray.value.filter((option) => option.visible).length);
	const optionsArray = computed(() => {
		const list = Array.from(states.options.values());
		const newList = [];
		states.optionValues.forEach((item) => {
			const index = list.findIndex((i) => i.value === item);
			if (index > -1) newList.push(list[index]);
		});
		return newList.length >= list.length ? newList : list;
	});
	const cachedOptionsArray = computed(() => Array.from(states.cachedOptions.values()));
	const showNewOption = computed(() => {
		const hasExistingOption = optionsArray.value.filter((option) => {
			return !option.created;
		}).some((option) => {
			return option.currentLabel === states.inputValue;
		});
		return props.filterable && props.allowCreate && states.inputValue !== "" && !hasExistingOption;
	});
	const updateOptions = () => {
		if (props.filterable && isFunction(props.filterMethod)) return;
		if (props.filterable && props.remote && isFunction(props.remoteMethod)) return;
		optionsArray.value.forEach((option) => {
			option.updateOption?.(states.inputValue);
		});
	};
	const selectSize = useFormSize();
	const collapseTagSize = computed(() => ["small"].includes(selectSize.value) ? "small" : "default");
	const dropdownMenuVisible = computed({
		get() {
			return expanded.value && (props.loading || !isRemoteSearchEmpty.value || props.remote && !!slots.empty) && (!debouncing.value || !isEmpty(states.previousQuery) || states.options.size > 0);
		},
		set(val) {
			expanded.value = val;
		}
	});
	const shouldShowPlaceholder = computed(() => {
		if (props.multiple && !isUndefined(props.modelValue)) return castArray(props.modelValue).length === 0 && !states.inputValue;
		const value = isArray(props.modelValue) ? props.modelValue[0] : props.modelValue;
		return props.filterable || isUndefined(value) ? !states.inputValue : true;
	});
	const currentPlaceholder = computed(() => {
		const _placeholder = props.placeholder ?? t("el.select.placeholder");
		return props.multiple || !hasModelValue.value ? _placeholder : states.selectedLabel;
	});
	const mouseEnterEventName = isIOS ? null : "mouseenter";
	watch(() => props.modelValue, (val, oldVal) => {
		if (props.multiple) {
			if (props.filterable && !props.reserveKeyword) {
				states.inputValue = "";
				handleQueryChange("");
			}
		}
		setSelected();
		if (!isEqual(val, oldVal) && props.validateEvent) formItem?.validate("change").catch(NOOP);
	}, {
		flush: "post",
		deep: true
	});
	watch(() => expanded.value, (val) => {
		if (val) handleQueryChange(states.inputValue);
		else {
			states.inputValue = "";
			states.previousQuery = null;
			states.isBeforeHide = true;
			states.menuVisibleOnFocus = false;
		}
	});
	watch(() => states.options.entries(), () => {
		if (!isClient) return;
		setSelected();
		if (props.defaultFirstOption && (props.filterable || props.remote) && filteredOptionsCount.value) checkDefaultFirstOption();
	}, { flush: "post" });
	watch([() => states.hoveringIndex, optionsArray], ([val]) => {
		if (isNumber(val) && val > -1) hoverOption.value = optionsArray.value[val] || {};
		else hoverOption.value = {};
		optionsArray.value.forEach((option) => {
			option.hover = hoverOption.value === option;
		});
	});
	watchEffect(() => {
		if (states.isBeforeHide) return;
		updateOptions();
	});
	const handleQueryChange = (val) => {
		if (states.previousQuery === val || isComposing.value) return;
		states.previousQuery = val;
		if (props.filterable && isFunction(props.filterMethod)) props.filterMethod(val);
		else if (props.filterable && props.remote && isFunction(props.remoteMethod)) props.remoteMethod(val);
		if (props.defaultFirstOption && (props.filterable || props.remote) && filteredOptionsCount.value) nextTick(checkDefaultFirstOption);
		else nextTick(updateHoveringIndex);
	};
	/**
	* find and highlight first option as default selected
	* @remark
	* - if the first option in dropdown list is user-created,
	*   it would be at the end of the optionsArray
	*   so find it and set hover.
	*   (NOTE: there must be only one user-created option in dropdown list with query)
	* - if there's no user-created option in list, just find the first one as usual
	*   (NOTE: exclude options that are disabled or in disabled-group)
	*/
	const checkDefaultFirstOption = () => {
		const optionsInDropdown = optionsArray.value.filter((n) => n.visible && !n.disabled && !n.states.groupDisabled);
		const userCreatedOption = optionsInDropdown.find((n) => n.created);
		const firstOriginOption = optionsInDropdown[0];
		states.hoveringIndex = getValueIndex(optionsArray.value.map((item) => item.value), userCreatedOption || firstOriginOption);
	};
	const setSelected = () => {
		if (!props.multiple) {
			const option = getOption(isArray(props.modelValue) ? props.modelValue[0] : props.modelValue);
			states.selectedLabel = option.currentLabel;
			states.selected = [option];
			return;
		} else states.selectedLabel = "";
		const result = [];
		if (!isUndefined(props.modelValue)) castArray(props.modelValue).forEach((value) => {
			result.push(getOption(value));
		});
		states.selected = result;
	};
	const getOption = (value) => {
		let option;
		const isObjectValue = isPlainObject(value);
		for (let i = states.cachedOptions.size - 1; i >= 0; i--) {
			const cachedOption = cachedOptionsArray.value[i];
			if (isObjectValue ? get(cachedOption.value, props.valueKey) === get(value, props.valueKey) : cachedOption.value === value) {
				option = {
					index: optionsArray.value.filter((opt) => !opt.created).indexOf(cachedOption),
					value,
					currentLabel: cachedOption.currentLabel,
					get isDisabled() {
						return cachedOption.isDisabled;
					}
				};
				break;
			}
		}
		if (option) return option;
		const existingSelected = states.selected.find((item) => isObjectValue ? get(item.value, props.valueKey) === get(value, props.valueKey) : item.value === value);
		return {
			index: -1,
			value,
			currentLabel: isObjectValue ? value.label : existingSelected ? existingSelected.currentLabel : value ?? ""
		};
	};
	const updateHoveringIndex = () => {
		const length = states.selected.length;
		if (length > 0) {
			const lastOption = states.selected[length - 1];
			states.hoveringIndex = optionsArray.value.findIndex((item) => getValueKey(lastOption) === getValueKey(item));
		} else states.hoveringIndex = -1;
	};
	const resetSelectionWidth = () => {
		states.selectionWidth = Number.parseFloat(window.getComputedStyle(selectionRef.value).width);
	};
	const resetCollapseItemWidth = () => {
		states.collapseItemWidth = collapseItemRef.value.getBoundingClientRect().width;
	};
	const updateTooltip = () => {
		tooltipRef.value?.updatePopper?.();
	};
	const updateTagTooltip = () => {
		tagTooltipRef.value?.updatePopper?.();
	};
	const onInputChange = () => {
		if (states.inputValue.length > 0 && !expanded.value) expanded.value = true;
		handleQueryChange(states.inputValue);
	};
	const onInput = (event) => {
		states.inputValue = event.target.value;
		if (props.remote) {
			debouncing.value = true;
			debouncedOnInputChange();
		} else return onInputChange();
	};
	const debouncedOnInputChange = useDebounceFn(() => {
		onInputChange();
		debouncing.value = false;
	}, debounce);
	const emitChange = (val) => {
		if (!isEqual(props.modelValue, val)) emit(CHANGE_EVENT, val);
	};
	const getLastNotDisabledIndex = (value) => findLastIndex(value, (it) => {
		const option = states.cachedOptions.get(it);
		return !option?.disabled && !option?.states.groupDisabled;
	});
	const deletePrevTag = (e) => {
		const code = getEventCode(e);
		if (!props.multiple) return;
		if (code === EVENT_CODE.delete) return;
		if (e.target.value.length <= 0) {
			const value = castArray(props.modelValue).slice();
			const lastNotDisabledIndex = getLastNotDisabledIndex(value);
			if (lastNotDisabledIndex < 0) return;
			const removeTagValue = value[lastNotDisabledIndex];
			value.splice(lastNotDisabledIndex, 1);
			emit(UPDATE_MODEL_EVENT, value);
			emitChange(value);
			emit("remove-tag", removeTagValue);
		}
	};
	const deleteTag = (event, tag) => {
		const index = states.selected.indexOf(tag);
		if (index > -1 && !selectDisabled.value) {
			const value = castArray(props.modelValue).slice();
			value.splice(index, 1);
			emit(UPDATE_MODEL_EVENT, value);
			emitChange(value);
			emit("remove-tag", tag.value);
		}
		event.stopPropagation();
		focus();
	};
	const deleteSelected = (event) => {
		event.stopPropagation();
		const value = props.multiple ? [] : valueOnClear.value;
		if (props.multiple) {
			for (const item of states.selected) if (item.isDisabled) value.push(item.value);
		}
		emit(UPDATE_MODEL_EVENT, value);
		emitChange(value);
		states.hoveringIndex = -1;
		expanded.value = false;
		emit("clear");
		focus();
	};
	const handleOptionSelect = (option) => {
		if (props.multiple) {
			const value = castArray(props.modelValue ?? []).slice();
			const optionIndex = getValueIndex(value, option);
			if (optionIndex > -1) value.splice(optionIndex, 1);
			else if (props.multipleLimit <= 0 || value.length < props.multipleLimit) value.push(option.value);
			emit(UPDATE_MODEL_EVENT, value);
			emitChange(value);
			if (option.created) handleQueryChange("");
			if (props.filterable && (option.created || !props.reserveKeyword)) states.inputValue = "";
		} else {
			!isEqual(props.modelValue, option.value) && emit("update:modelValue", option.value);
			emitChange(option.value);
			expanded.value = false;
		}
		focus();
		if (expanded.value) return;
		nextTick(() => {
			scrollToOption(option);
		});
	};
	const getValueIndex = (arr, option) => {
		if (isUndefined(option)) return -1;
		if (!isObject(option.value)) return arr.indexOf(option.value);
		return arr.findIndex((item) => {
			return isEqual(get(item, props.valueKey), getValueKey(option));
		});
	};
	const scrollToOption = (option) => {
		const targetOption = isArray(option) ? option[option.length - 1] : option;
		let target = null;
		if (!isNil(targetOption?.value)) {
			const options = optionsArray.value.filter((item) => item.value === targetOption.value);
			if (options.length > 0) target = options[0].$el;
		}
		if (tooltipRef.value && target) {
			const menu = tooltipRef.value?.popperRef?.contentRef?.querySelector?.(`.${nsSelect.be("dropdown", "wrap")}`);
			if (menu) scrollIntoView(menu, target);
		}
		scrollbarRef.value?.handleScroll();
	};
	const onOptionCreate = (vm) => {
		states.options.set(vm.value, vm);
		states.cachedOptions.set(vm.value, vm);
	};
	const onOptionDestroy = (key, vm) => {
		if (states.options.get(key) === vm) states.options.delete(key);
	};
	const popperRef = computed(() => {
		return tooltipRef.value?.popperRef?.contentRef;
	});
	const handleMenuEnter = () => {
		states.isBeforeHide = false;
		nextTick(() => {
			scrollbarRef.value?.update();
			scrollToOption(states.selected);
		});
	};
	const focus = () => {
		inputRef.value?.focus();
	};
	const blur = () => {
		if (expanded.value) {
			expanded.value = false;
			nextTick(() => inputRef.value?.blur());
			return;
		}
		inputRef.value?.blur();
	};
	const handleClearClick = (event) => {
		deleteSelected(event);
	};
	const handleClickOutside = (event) => {
		expanded.value = false;
		if (isFocused.value) {
			const _event = new FocusEvent("blur", event);
			nextTick(() => handleBlur(_event));
		}
	};
	const handleEsc = () => {
		if (states.inputValue.length > 0) states.inputValue = "";
		else expanded.value = false;
	};
	const toggleMenu = (event) => {
		if (selectDisabled.value || props.filterable && expanded.value && event && !suffixRef.value?.contains(event.target)) return;
		if (isIOS) states.inputHovering = true;
		if (states.menuVisibleOnFocus) states.menuVisibleOnFocus = false;
		else expanded.value = !expanded.value;
	};
	const selectOption = () => {
		if (!expanded.value) toggleMenu();
		else {
			const option = optionsArray.value[states.hoveringIndex];
			if (option && !option.isDisabled) handleOptionSelect(option);
		}
	};
	const getValueKey = (item) => {
		return isObject(item.value) ? get(item.value, props.valueKey) : item.value;
	};
	const optionsAllDisabled = computed(() => optionsArray.value.filter((option) => option.visible).every((option) => option.isDisabled));
	const showTagList = computed(() => {
		if (!props.multiple) return [];
		return props.collapseTags ? states.selected.slice(0, props.maxCollapseTags) : states.selected;
	});
	const collapseTagList = computed(() => {
		if (!props.multiple) return [];
		return props.collapseTags ? states.selected.slice(props.maxCollapseTags) : [];
	});
	const navigateOptions = (direction) => {
		if (!expanded.value) {
			expanded.value = true;
			return;
		}
		if (states.options.size === 0 || filteredOptionsCount.value === 0 || isComposing.value) return;
		if (!optionsAllDisabled.value) {
			if (direction === "next") {
				states.hoveringIndex++;
				if (states.hoveringIndex === states.options.size) states.hoveringIndex = 0;
			} else if (direction === "prev") {
				states.hoveringIndex--;
				if (states.hoveringIndex < 0) states.hoveringIndex = states.options.size - 1;
			}
			const option = optionsArray.value[states.hoveringIndex];
			if (option.isDisabled || !option.visible) navigateOptions(direction);
			nextTick(() => scrollToOption(hoverOption.value));
		}
	};
	const findFocusableIndex = (arr, start, step, len) => {
		for (let i = start; i >= 0 && i < len; i += step) {
			const obj = arr[i];
			if (!obj?.isDisabled && obj?.visible) return i;
		}
		return null;
	};
	const focusOption = (targetIndex, mode) => {
		const len = states.options.size;
		if (len === 0) return;
		const start = clamp(targetIndex, 0, len - 1);
		const options = optionsArray.value;
		const direction = mode === "up" ? -1 : 1;
		const newIndex = findFocusableIndex(options, start, direction, len) ?? findFocusableIndex(options, start - direction, -direction, len);
		if (newIndex != null) {
			states.hoveringIndex = newIndex;
			nextTick(() => scrollToOption(hoverOption.value));
		}
	};
	const handleKeydown = (e) => {
		const code = getEventCode(e);
		let isPreventDefault = true;
		switch (code) {
			case EVENT_CODE.up:
				navigateOptions("prev");
				break;
			case EVENT_CODE.down:
				navigateOptions("next");
				break;
			case EVENT_CODE.enter:
			case EVENT_CODE.numpadEnter:
				if (!isComposing.value) selectOption();
				break;
			case EVENT_CODE.esc:
				handleEsc();
				break;
			case EVENT_CODE.backspace:
				isPreventDefault = false;
				deletePrevTag(e);
				return;
			case EVENT_CODE.home:
				if (!expanded.value) return;
				focusOption(0, "down");
				break;
			case EVENT_CODE.end:
				if (!expanded.value) return;
				focusOption(states.options.size - 1, "up");
				break;
			case EVENT_CODE.pageUp:
				if (!expanded.value) return;
				focusOption(states.hoveringIndex - 10, "up");
				break;
			case EVENT_CODE.pageDown:
				if (!expanded.value) return;
				focusOption(states.hoveringIndex + 10, "down");
				break;
			default: isPreventDefault = false;
		}
		if (isPreventDefault) {
			e.preventDefault();
			e.stopPropagation();
		}
	};
	const getGapWidth = () => {
		if (!selectionRef.value) return 0;
		const style = window.getComputedStyle(selectionRef.value);
		return Number.parseFloat(style.gap || "6px");
	};
	const tagStyle = computed(() => {
		const gapWidth = getGapWidth();
		const inputSlotWidth = props.filterable ? gapWidth + 11 : 0;
		return { maxWidth: `${collapseItemRef.value && props.maxCollapseTags === 1 ? states.selectionWidth - states.collapseItemWidth - gapWidth - inputSlotWidth : states.selectionWidth - inputSlotWidth}px` };
	});
	const collapseTagStyle = computed(() => {
		return { maxWidth: `${states.selectionWidth}px` };
	});
	const popupScroll = (data) => {
		emit("popup-scroll", data);
	};
	const endReached = (direction) => {
		emit("end-reached", direction);
	};
	useResizeObserver(selectionRef, resetSelectionWidth);
	useResizeObserver(wrapperRef, updateTooltip);
	useResizeObserver(tagMenuRef, updateTagTooltip);
	useResizeObserver(collapseItemRef, resetCollapseItemWidth);
	let stop;
	watch(() => dropdownMenuVisible.value, (newVal) => {
		if (newVal) stop = useResizeObserver(menuRef, updateTooltip).stop;
		else {
			stop?.();
			stop = void 0;
		}
		emit("visible-change", newVal);
	});
	onMounted(() => {
		setSelected();
	});
	return {
		inputId,
		contentId,
		nsSelect,
		nsInput,
		states,
		isFocused,
		expanded,
		optionsArray,
		hoverOption,
		selectSize,
		filteredOptionsCount,
		updateTooltip,
		updateTagTooltip,
		debouncedOnInputChange,
		onInput,
		deletePrevTag,
		deleteTag,
		deleteSelected,
		handleOptionSelect,
		scrollToOption,
		hasModelValue,
		shouldShowPlaceholder,
		currentPlaceholder,
		mouseEnterEventName,
		needStatusIcon,
		showClearBtn,
		iconComponent,
		iconReverse,
		validateState,
		validateIcon,
		showNewOption,
		updateOptions,
		collapseTagSize,
		setSelected,
		selectDisabled,
		emptyText,
		handleCompositionStart,
		handleCompositionUpdate,
		handleCompositionEnd,
		handleKeydown,
		onOptionCreate,
		onOptionDestroy,
		handleMenuEnter,
		focus,
		blur,
		handleClearClick,
		handleClickOutside,
		handleEsc,
		toggleMenu,
		selectOption,
		getValueKey,
		navigateOptions,
		dropdownMenuVisible,
		showTagList,
		collapseTagList,
		popupScroll,
		getOption,
		endReached,
		tagStyle,
		collapseTagStyle,
		popperRef,
		inputRef,
		tooltipRef,
		tagTooltipRef,
		prefixRef,
		suffixRef,
		selectRef,
		wrapperRef,
		selectionRef,
		scrollbarRef,
		menuRef,
		tagMenuRef,
		collapseItemRef
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/options.mjs
var options_default = defineComponent({
	name: "ElOptions",
	setup(_, { slots }) {
		const select = inject(selectKey);
		let cachedValueList = [];
		return () => {
			const children = slots.default?.();
			const valueList = [];
			function filterOptions(children) {
				if (!isArray(children)) return;
				children.forEach((item) => {
					const name = (item?.type || {})?.name;
					if (name === "ElOptionGroup") filterOptions(!isString(item.children) && !isArray(item.children) && isFunction(item.children?.default) ? item.children?.default() : item.children);
					else if (name === "ElOption") valueList.push(item.props?.value);
					else if (isArray(item.children)) filterOptions(item.children);
				});
			}
			if (children.length) filterOptions(children[0]?.children);
			if (!isEqual(valueList, cachedValueList)) {
				cachedValueList = valueList;
				if (select) select.states.optionValues = valueList;
			}
			return children;
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/select.vue_vue_type_script_lang.mjs
var COMPONENT_NAME = "ElSelect";
var warnHandlerMap = /* @__PURE__ */ new WeakMap();
var createSelectWarnHandler = (appContext) => {
	return (...args) => {
		const message = args[0];
		if (!message || message.includes("Slot \"default\" invoked outside of the render function") && args[2]?.includes("ElTreeSelect")) return;
		const original = warnHandlerMap.get(appContext)?.originalWarnHandler;
		if (original) {
			original(...args);
			return;
		}
		console.warn(...args);
	};
};
var getWarnHandlerRecord = (appContext) => {
	let record = warnHandlerMap.get(appContext);
	if (!record) {
		record = {
			originalWarnHandler: appContext.config.warnHandler,
			handler: createSelectWarnHandler(appContext),
			count: 0
		};
		warnHandlerMap.set(appContext, record);
	}
	return record;
};
var select_vue_vue_type_script_lang_default = defineComponent({
	name: COMPONENT_NAME,
	componentName: COMPONENT_NAME,
	components: {
		ElSelectMenu: select_dropdown_default,
		ElOption: option_default,
		ElOptions: options_default,
		ElOptionGroup: option_group_default,
		ElTag,
		ElScrollbar,
		ElTooltip,
		ElIcon
	},
	directives: { ClickOutside },
	props: selectProps,
	emits: selectEmits,
	setup(props, { emit, slots }) {
		const instance = getCurrentInstance();
		const warnRecord = getWarnHandlerRecord(instance.appContext);
		warnRecord.count += 1;
		instance.appContext.config.warnHandler = warnRecord.handler;
		const modelValue = computed(() => {
			const { modelValue: rawModelValue, multiple } = props;
			const fallback = multiple ? [] : void 0;
			if (isArray(rawModelValue)) return multiple ? rawModelValue : fallback;
			return multiple ? fallback : rawModelValue;
		});
		const _props = reactive({
			...toRefs(props),
			modelValue
		});
		const API = useSelect(_props, emit);
		const { calculatorRef, inputStyle } = useCalcInputWidth();
		const { getLabel, getValue, getOptions, getDisabled } = useProps(props);
		const getOptionProps = (option) => ({
			label: getLabel(option),
			value: getValue(option),
			disabled: getDisabled(option)
		});
		const flatTreeSelectData = (data) => {
			return data.reduce((acc, item) => {
				acc.push(item);
				if (item.children && item.children.length > 0) acc.push(...flatTreeSelectData(item.children));
				return acc;
			}, []);
		};
		const manuallyRenderSlots = (vnodes) => {
			flattedChildren(vnodes || []).forEach((item) => {
				if (isObject(item) && (item.type.name === "ElOption" || item.type.name === "ElTree")) {
					const _name = item.type.name;
					if (_name === "ElTree") flatTreeSelectData(item.props?.data || []).forEach((treeItem) => {
						treeItem.currentLabel = treeItem.label ?? (isObject(treeItem.value) ? "" : treeItem.value);
						API.onOptionCreate(treeItem);
					});
					else if (_name === "ElOption") {
						const obj = { ...item.props };
						obj.currentLabel = obj.label ?? (isObject(obj.value) ? "" : obj.value);
						API.onOptionCreate(obj);
					}
				}
			});
		};
		watch(() => [props.persistent || API.expanded.value || !slots.default ? void 0 : slots.default?.(), modelValue.value], () => {
			if (props.persistent || API.expanded.value) return;
			if (!slots.default) return;
			API.states.options.clear();
			manuallyRenderSlots(slots.default?.());
		}, { immediate: true });
		provide(selectKey, reactive({
			props: _props,
			states: API.states,
			selectRef: API.selectRef,
			optionsArray: API.optionsArray,
			setSelected: API.setSelected,
			handleOptionSelect: API.handleOptionSelect,
			onOptionCreate: API.onOptionCreate,
			onOptionDestroy: API.onOptionDestroy
		}));
		const selectedLabel = computed(() => {
			if (!props.multiple) return API.states.selectedLabel;
			return API.states.selected.map((i) => i.currentLabel);
		});
		onBeforeUnmount(() => {
			const record = warnHandlerMap.get(instance.appContext);
			if (!record) return;
			record.count -= 1;
			if (record.count <= 0) {
				instance.appContext.config.warnHandler = record.originalWarnHandler;
				warnHandlerMap.delete(instance.appContext);
			}
		});
		return {
			...API,
			modelValue,
			selectedLabel,
			calculatorRef,
			inputStyle,
			getLabel,
			getValue,
			getOptions,
			getDisabled,
			getOptionProps
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/src/select2.mjs
var _hoisted_1 = [
	"id",
	"value",
	"name",
	"disabled",
	"autocomplete",
	"tabindex",
	"readonly",
	"aria-activedescendant",
	"aria-controls",
	"aria-expanded",
	"aria-label"
];
var _hoisted_2 = ["textContent"];
var _hoisted_3 = { key: 1 };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
	const _component_el_tag = resolveComponent("el-tag");
	const _component_el_tooltip = resolveComponent("el-tooltip");
	const _component_el_icon = resolveComponent("el-icon");
	const _component_el_option = resolveComponent("el-option");
	const _component_el_option_group = resolveComponent("el-option-group");
	const _component_el_options = resolveComponent("el-options");
	const _component_el_scrollbar = resolveComponent("el-scrollbar");
	const _component_el_select_menu = resolveComponent("el-select-menu");
	const _directive_click_outside = resolveDirective("click-outside");
	return withDirectives((openBlock(), createElementBlock("div", mergeProps({
		ref: "selectRef",
		class: [_ctx.nsSelect.b(), _ctx.nsSelect.m(_ctx.selectSize)]
	}, { [toHandlerKey(_ctx.mouseEnterEventName)]: _cache[11] || (_cache[11] = ($event) => _ctx.states.inputHovering = true) }, { onMouseleave: _cache[12] || (_cache[12] = ($event) => _ctx.states.inputHovering = false) }), [createVNode(_component_el_tooltip, {
		ref: "tooltipRef",
		visible: _ctx.dropdownMenuVisible,
		placement: _ctx.placement,
		teleported: _ctx.teleported,
		"popper-class": [_ctx.nsSelect.e("popper"), _ctx.popperClass],
		"popper-style": _ctx.popperStyle,
		"popper-options": _ctx.popperOptions,
		"fallback-placements": _ctx.fallbackPlacements,
		effect: _ctx.effect,
		pure: "",
		trigger: "click",
		transition: `${_ctx.nsSelect.namespace.value}-zoom-in-top`,
		"stop-popper-mouse-event": false,
		"gpu-acceleration": false,
		persistent: _ctx.persistent,
		"append-to": _ctx.appendTo,
		"show-arrow": _ctx.showArrow,
		offset: _ctx.offset,
		onBeforeShow: _ctx.handleMenuEnter,
		onHide: _cache[10] || (_cache[10] = ($event) => _ctx.states.isBeforeHide = false)
	}, {
		default: withCtx(() => [createBaseVNode("div", {
			ref: "wrapperRef",
			class: normalizeClass([
				_ctx.nsSelect.e("wrapper"),
				_ctx.nsSelect.is("focused", _ctx.isFocused),
				_ctx.nsSelect.is("hovering", _ctx.states.inputHovering),
				_ctx.nsSelect.is("filterable", _ctx.filterable),
				_ctx.nsSelect.is("disabled", _ctx.selectDisabled)
			]),
			onClick: _cache[7] || (_cache[7] = withModifiers((...args) => _ctx.toggleMenu && _ctx.toggleMenu(...args), ["prevent"]))
		}, [
			_ctx.$slots.prefix ? (openBlock(), createElementBlock("div", {
				key: 0,
				ref: "prefixRef",
				class: normalizeClass(_ctx.nsSelect.e("prefix"))
			}, [renderSlot(_ctx.$slots, "prefix")], 2)) : createCommentVNode("v-if", true),
			createBaseVNode("div", {
				ref: "selectionRef",
				class: normalizeClass([_ctx.nsSelect.e("selection"), _ctx.nsSelect.is("near", _ctx.multiple && !_ctx.$slots.prefix && !!_ctx.states.selected.length)])
			}, [
				_ctx.multiple ? renderSlot(_ctx.$slots, "tag", {
					key: 0,
					data: _ctx.states.selected,
					deleteTag: _ctx.deleteTag,
					selectDisabled: _ctx.selectDisabled
				}, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.showTagList, (item) => {
					return openBlock(), createElementBlock("div", {
						key: _ctx.getValueKey(item),
						class: normalizeClass(_ctx.nsSelect.e("selected-item"))
					}, [createVNode(_component_el_tag, {
						closable: !_ctx.selectDisabled && !item.isDisabled,
						size: _ctx.collapseTagSize,
						type: _ctx.tagType,
						effect: _ctx.tagEffect,
						"disable-transitions": "",
						style: normalizeStyle(_ctx.tagStyle),
						onClose: ($event) => _ctx.deleteTag($event, item)
					}, {
						default: withCtx(() => [createBaseVNode("span", { class: normalizeClass(_ctx.nsSelect.e("tags-text")) }, [renderSlot(_ctx.$slots, "label", {
							index: item.index,
							label: item.currentLabel,
							value: item.value
						}, () => [createTextVNode(toDisplayString(item.currentLabel), 1)])], 2)]),
						_: 2
					}, 1032, [
						"closable",
						"size",
						"type",
						"effect",
						"style",
						"onClose"
					])], 2);
				}), 128)), _ctx.collapseTags && _ctx.states.selected.length > _ctx.maxCollapseTags ? (openBlock(), createBlock(_component_el_tooltip, {
					key: 0,
					ref: "tagTooltipRef",
					disabled: _ctx.dropdownMenuVisible || !_ctx.collapseTagsTooltip,
					"fallback-placements": _ctx.tagTooltip?.fallbackPlacements ?? [
						"bottom",
						"top",
						"right",
						"left"
					],
					effect: _ctx.tagTooltip?.effect ?? _ctx.effect,
					placement: _ctx.tagTooltip?.placement ?? "bottom",
					"popper-class": _ctx.tagTooltip?.popperClass ?? _ctx.popperClass,
					"popper-style": _ctx.tagTooltip?.popperStyle ?? _ctx.popperStyle,
					teleported: _ctx.tagTooltip?.teleported ?? _ctx.teleported,
					"append-to": _ctx.tagTooltip?.appendTo ?? _ctx.appendTo,
					"popper-options": _ctx.tagTooltip?.popperOptions ?? _ctx.popperOptions,
					transition: _ctx.tagTooltip?.transition,
					"show-after": _ctx.tagTooltip?.showAfter,
					"hide-after": _ctx.tagTooltip?.hideAfter,
					"auto-close": _ctx.tagTooltip?.autoClose,
					offset: _ctx.tagTooltip?.offset
				}, {
					default: withCtx(() => [createBaseVNode("div", {
						ref: "collapseItemRef",
						class: normalizeClass(_ctx.nsSelect.e("selected-item"))
					}, [createVNode(_component_el_tag, {
						closable: false,
						size: _ctx.collapseTagSize,
						type: _ctx.tagType,
						effect: _ctx.tagEffect,
						"disable-transitions": "",
						style: normalizeStyle(_ctx.collapseTagStyle)
					}, {
						default: withCtx(() => [createBaseVNode("span", { class: normalizeClass(_ctx.nsSelect.e("tags-text")) }, " + " + toDisplayString(_ctx.states.selected.length - _ctx.maxCollapseTags), 3)]),
						_: 1
					}, 8, [
						"size",
						"type",
						"effect",
						"style"
					])], 2)]),
					content: withCtx(() => [createBaseVNode("div", {
						ref: "tagMenuRef",
						class: normalizeClass(_ctx.nsSelect.e("selection"))
					}, [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.collapseTagList, (item) => {
						return openBlock(), createElementBlock("div", {
							key: _ctx.getValueKey(item),
							class: normalizeClass(_ctx.nsSelect.e("selected-item"))
						}, [createVNode(_component_el_tag, {
							class: "in-tooltip",
							closable: !_ctx.selectDisabled && !item.isDisabled,
							size: _ctx.collapseTagSize,
							type: _ctx.tagType,
							effect: _ctx.tagEffect,
							"disable-transitions": "",
							onClose: ($event) => _ctx.deleteTag($event, item)
						}, {
							default: withCtx(() => [createBaseVNode("span", { class: normalizeClass(_ctx.nsSelect.e("tags-text")) }, [renderSlot(_ctx.$slots, "label", {
								index: item.index,
								label: item.currentLabel,
								value: item.value
							}, () => [createTextVNode(toDisplayString(item.currentLabel), 1)])], 2)]),
							_: 2
						}, 1032, [
							"closable",
							"size",
							"type",
							"effect",
							"onClose"
						])], 2);
					}), 128))], 2)]),
					_: 3
				}, 8, [
					"disabled",
					"fallback-placements",
					"effect",
					"placement",
					"popper-class",
					"popper-style",
					"teleported",
					"append-to",
					"popper-options",
					"transition",
					"show-after",
					"hide-after",
					"auto-close",
					"offset"
				])) : createCommentVNode("v-if", true)]) : createCommentVNode("v-if", true),
				createBaseVNode("div", { class: normalizeClass([
					_ctx.nsSelect.e("selected-item"),
					_ctx.nsSelect.e("input-wrapper"),
					_ctx.nsSelect.is("hidden", !_ctx.filterable || _ctx.selectDisabled || _ctx.multiple && !_ctx.states.inputValue && !_ctx.isFocused)
				]) }, [createBaseVNode("input", {
					id: _ctx.inputId,
					ref: "inputRef",
					value: _ctx.states.inputValue,
					type: "text",
					name: _ctx.name,
					class: normalizeClass([_ctx.nsSelect.e("input"), _ctx.nsSelect.is(_ctx.selectSize)]),
					disabled: _ctx.selectDisabled,
					autocomplete: _ctx.autocomplete,
					style: normalizeStyle(_ctx.inputStyle),
					tabindex: _ctx.tabindex,
					role: "combobox",
					readonly: !_ctx.filterable,
					spellcheck: "false",
					"aria-activedescendant": _ctx.hoverOption?.id || "",
					"aria-controls": _ctx.contentId,
					"aria-expanded": _ctx.dropdownMenuVisible,
					"aria-label": _ctx.ariaLabel,
					"aria-autocomplete": "none",
					"aria-haspopup": "listbox",
					onKeydown: _cache[0] || (_cache[0] = (...args) => _ctx.handleKeydown && _ctx.handleKeydown(...args)),
					onCompositionstart: _cache[1] || (_cache[1] = (...args) => _ctx.handleCompositionStart && _ctx.handleCompositionStart(...args)),
					onCompositionupdate: _cache[2] || (_cache[2] = (...args) => _ctx.handleCompositionUpdate && _ctx.handleCompositionUpdate(...args)),
					onCompositionend: _cache[3] || (_cache[3] = (...args) => _ctx.handleCompositionEnd && _ctx.handleCompositionEnd(...args)),
					onInput: _cache[4] || (_cache[4] = (...args) => _ctx.onInput && _ctx.onInput(...args)),
					onChange: _cache[5] || (_cache[5] = withModifiers(() => {}, ["stop"])),
					onClick: _cache[6] || (_cache[6] = withModifiers((...args) => _ctx.toggleMenu && _ctx.toggleMenu(...args), ["stop"]))
				}, null, 46, _hoisted_1), _ctx.filterable ? (openBlock(), createElementBlock("span", {
					key: 0,
					ref: "calculatorRef",
					"aria-hidden": "true",
					class: normalizeClass(_ctx.nsSelect.e("input-calculator")),
					textContent: toDisplayString(_ctx.states.inputValue)
				}, null, 10, _hoisted_2)) : createCommentVNode("v-if", true)], 2),
				_ctx.shouldShowPlaceholder ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: normalizeClass([
						_ctx.nsSelect.e("selected-item"),
						_ctx.nsSelect.e("placeholder"),
						_ctx.nsSelect.is("transparent", !_ctx.hasModelValue || _ctx.expanded && !_ctx.states.inputValue)
					])
				}, [_ctx.hasModelValue ? renderSlot(_ctx.$slots, "label", {
					key: 0,
					index: _ctx.getOption(_ctx.modelValue).index,
					label: _ctx.currentPlaceholder,
					value: _ctx.modelValue
				}, () => [createBaseVNode("span", null, toDisplayString(_ctx.currentPlaceholder), 1)]) : (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(_ctx.currentPlaceholder), 1))], 2)) : createCommentVNode("v-if", true)
			], 2),
			createBaseVNode("div", {
				ref: "suffixRef",
				class: normalizeClass(_ctx.nsSelect.e("suffix"))
			}, [
				_ctx.iconComponent && !_ctx.showClearBtn ? (openBlock(), createBlock(_component_el_icon, {
					key: 0,
					class: normalizeClass([
						_ctx.nsSelect.e("caret"),
						_ctx.nsSelect.e("icon"),
						_ctx.iconReverse
					])
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.iconComponent)))]),
					_: 1
				}, 8, ["class"])) : createCommentVNode("v-if", true),
				_ctx.showClearBtn && _ctx.clearIcon ? (openBlock(), createBlock(_component_el_icon, {
					key: 1,
					class: normalizeClass([
						_ctx.nsSelect.e("caret"),
						_ctx.nsSelect.e("icon"),
						_ctx.nsSelect.e("clear")
					]),
					onClick: _ctx.handleClearClick
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.clearIcon)))]),
					_: 1
				}, 8, ["class", "onClick"])) : createCommentVNode("v-if", true),
				_ctx.validateState && _ctx.validateIcon && _ctx.needStatusIcon ? (openBlock(), createBlock(_component_el_icon, {
					key: 2,
					class: normalizeClass([
						_ctx.nsInput.e("icon"),
						_ctx.nsInput.e("validateIcon"),
						_ctx.nsInput.is("loading", _ctx.validateState === "validating")
					])
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.validateIcon)))]),
					_: 1
				}, 8, ["class"])) : createCommentVNode("v-if", true)
			], 2)
		], 2)]),
		content: withCtx(() => [createVNode(_component_el_select_menu, { ref: "menuRef" }, {
			default: withCtx(() => [
				_ctx.$slots.header ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(_ctx.nsSelect.be("dropdown", "header")),
					onClick: _cache[8] || (_cache[8] = withModifiers(() => {}, ["stop"]))
				}, [renderSlot(_ctx.$slots, "header")], 2)) : createCommentVNode("v-if", true),
				withDirectives(createVNode(_component_el_scrollbar, {
					id: _ctx.contentId,
					ref: "scrollbarRef",
					tag: "ul",
					"wrap-class": _ctx.nsSelect.be("dropdown", "wrap"),
					"view-class": _ctx.nsSelect.be("dropdown", "list"),
					class: normalizeClass([_ctx.nsSelect.is("empty", _ctx.filteredOptionsCount === 0)]),
					role: "listbox",
					"aria-label": _ctx.ariaLabel,
					"aria-orientation": "vertical",
					onScroll: _ctx.popupScroll,
					onEndReached: _ctx.endReached
				}, {
					default: withCtx(() => [_ctx.showNewOption ? (openBlock(), createBlock(_component_el_option, {
						key: 0,
						value: _ctx.states.inputValue,
						created: true
					}, null, 8, ["value"])) : createCommentVNode("v-if", true), createVNode(_component_el_options, null, {
						default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.options, (option, index) => {
							return openBlock(), createElementBlock(Fragment, { key: index }, [_ctx.getOptions(option)?.length ? (openBlock(), createBlock(_component_el_option_group, {
								key: 0,
								label: _ctx.getLabel(option),
								disabled: _ctx.getDisabled(option)
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.getOptions(option), (item) => {
									return openBlock(), createBlock(_component_el_option, mergeProps({ key: _ctx.getValue(item) }, { ref_for: true }, _ctx.getOptionProps(item)), null, 16);
								}), 128))]),
								_: 2
							}, 1032, ["label", "disabled"])) : (openBlock(), createBlock(_component_el_option, mergeProps({
								key: 1,
								ref_for: true
							}, _ctx.getOptionProps(option)), null, 16))], 64);
						}), 128))])]),
						_: 3
					})]),
					_: 3
				}, 8, [
					"id",
					"wrap-class",
					"view-class",
					"class",
					"aria-label",
					"onScroll",
					"onEndReached"
				]), [[vShow, _ctx.states.options.size > 0 && !_ctx.loading]]),
				_ctx.$slots.loading && _ctx.loading ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: normalizeClass(_ctx.nsSelect.be("dropdown", "loading"))
				}, [renderSlot(_ctx.$slots, "loading")], 2)) : _ctx.loading || _ctx.filteredOptionsCount === 0 ? (openBlock(), createElementBlock("div", {
					key: 2,
					class: normalizeClass(_ctx.nsSelect.be("dropdown", "empty"))
				}, [renderSlot(_ctx.$slots, "empty", {}, () => [createBaseVNode("span", null, toDisplayString(_ctx.emptyText), 1)])], 2)) : createCommentVNode("v-if", true),
				_ctx.$slots.footer ? (openBlock(), createElementBlock("div", {
					key: 3,
					class: normalizeClass(_ctx.nsSelect.be("dropdown", "footer")),
					onClick: _cache[9] || (_cache[9] = withModifiers(() => {}, ["stop"]))
				}, [renderSlot(_ctx.$slots, "footer")], 2)) : createCommentVNode("v-if", true)
			]),
			_: 3
		}, 512)]),
		_: 3
	}, 8, [
		"visible",
		"placement",
		"teleported",
		"popper-class",
		"popper-style",
		"popper-options",
		"fallback-placements",
		"effect",
		"transition",
		"persistent",
		"append-to",
		"show-arrow",
		"offset",
		"onBeforeShow"
	])], 16)), [[
		_directive_click_outside,
		_ctx.handleClickOutside,
		_ctx.popperRef
	]]);
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/select/index.mjs
var ElSelect = withInstall(/* @__PURE__ */ _plugin_vue_export_helper_default(select_vue_vue_type_script_lang_default, [["render", _sfc_render]]), {
	Option: option_default,
	OptionGroup: option_group_default
});
var ElOption = withNoopInstall(option_default);
var ElOptionGroup = withNoopInstall(option_group_default);
//#endregion
export { defaultProps as a, useCalcInputWidth as c, selectProps as i, findLastIndex as l, ElOptionGroup as n, useProps as o, ElSelect as r, selectKey as s, ElOption as t };
