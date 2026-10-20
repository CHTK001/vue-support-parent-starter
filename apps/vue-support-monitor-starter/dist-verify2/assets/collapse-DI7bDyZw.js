import { $n as normalizeClass, D as createVNode, E as createTextVNode, Gn as isPromise, Ht as watch, J as inject, Jn as isString, On as unref, Rn as isArray, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, g as computed, gt as provide, k as defineComponent, mt as openBlock, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { t as castArray } from "./castArray-DkZAeVfZ.js";
import { a as throwError, c as definePropType, f as isNumber, i as debugWarn, l as isBoolean, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as useIdInjection } from "./use-id-C2v-tXFq.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { a as arrow_right_default } from "./dist-DogtK295.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as mutable } from "./typescript-CMUKtCBO.js";
import { t as ElCollapseTransition } from "./collapse-transition-DDU8UXTW.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/collapse.mjs
var emitChangeFn = (value) => isNumber(value) || isString(value) || isArray(value);
/**
* @deprecated Removed after 3.0.0, Use `CollapseProps` instead.
*/
var collapseProps = buildProps({
	/**
	* @description whether to activate accordion mode
	*/
	accordion: Boolean,
	/**
	* @description currently active panel, the type is `string` in accordion mode, otherwise it is `array`
	*/
	modelValue: {
		type: definePropType([
			Array,
			String,
			Number
		]),
		default: () => mutable([])
	},
	/**
	* @description set expand icon position
	*/
	expandIconPosition: {
		type: definePropType([String]),
		default: "right"
	},
	/**
	* @description before-collapse hook before the collapse state changes. If `false` is returned or a `Promise` is returned and then is rejected, will stop collapsing
	*/
	beforeCollapse: { type: definePropType(Function) }
});
var collapseEmits = {
	[UPDATE_MODEL_EVENT]: emitChangeFn,
	[CHANGE_EVENT]: emitChangeFn
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/constants.mjs
var collapseContextKey = Symbol("collapseContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/collapse-item.mjs
/**
* @deprecated Removed after 3.0.0, Use `CollapseItemProps` instead.
*/
var collapseItemProps = buildProps({
	/**
	* @description title of the panel
	*/
	title: {
		type: String,
		default: ""
	},
	/**
	* @description unique identification of the panel
	*/
	name: {
		type: definePropType([String, Number]),
		default: void 0
	},
	/**
	* @description icon of the collapse item
	*/
	icon: {
		type: iconPropType,
		default: arrow_right_default
	},
	/**
	* @description disable the collapse item
	*/
	disabled: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/use-collapse.mjs
var SCOPE = "ElCollapse";
var useCollapse = (props, emit) => {
	const activeNames = ref(castArray(props.modelValue));
	const setActiveNames = (_activeNames) => {
		activeNames.value = _activeNames;
		const value = props.accordion ? activeNames.value[0] : activeNames.value;
		emit(UPDATE_MODEL_EVENT, value);
		emit(CHANGE_EVENT, value);
	};
	const handleChange = (name) => {
		if (props.accordion) setActiveNames([activeNames.value[0] === name ? "" : name]);
		else {
			const _activeNames = [...activeNames.value];
			const index = _activeNames.indexOf(name);
			if (index > -1) _activeNames.splice(index, 1);
			else _activeNames.push(name);
			setActiveNames(_activeNames);
		}
	};
	const handleItemClick = async (name) => {
		const { beforeCollapse } = props;
		if (!beforeCollapse) {
			handleChange(name);
			return;
		}
		const shouldChange = beforeCollapse(name);
		if (![isPromise(shouldChange), isBoolean(shouldChange)].includes(true)) throwError(SCOPE, "beforeCollapse must return type `Promise<boolean>` or `boolean`");
		if (isPromise(shouldChange)) shouldChange.then((result) => {
			if (result !== false) handleChange(name);
		}).catch((e) => {
			debugWarn(SCOPE, `some error occurred: ${e}`);
		});
		else if (shouldChange) handleChange(name);
	};
	watch(() => props.modelValue, () => activeNames.value = castArray(props.modelValue), { deep: true });
	provide(collapseContextKey, {
		activeNames,
		handleItemClick
	});
	return {
		activeNames,
		setActiveNames
	};
};
var useCollapseDOM = (props) => {
	const ns = useNamespace("collapse");
	return { rootKls: computed(() => [ns.b(), ns.b(`icon-position-${props.expandIconPosition}`)]) };
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/collapse2.mjs
var collapse_default = /* @__PURE__ */ defineComponent({
	name: "ElCollapse",
	__name: "collapse",
	props: collapseProps,
	emits: collapseEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const { activeNames, setActiveNames } = useCollapse(props, __emit);
		const { rootKls } = useCollapseDOM(props);
		__expose({
			/** @description active names */
			activeNames,
			/** @description set active names */
			setActiveNames
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(unref(rootKls)) }, [renderSlot(_ctx.$slots, "default")], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/use-collapse-item.mjs
var useCollapseItem = (props) => {
	const collapse = inject(collapseContextKey);
	const { namespace } = useNamespace("collapse");
	const focusing = ref(false);
	const isClick = ref(false);
	const idInjection = useIdInjection();
	const id = computed(() => idInjection.current++);
	const name = computed(() => {
		return props.name ?? `${namespace.value}-id-${idInjection.prefix}-${unref(id)}`;
	});
	const isActive = computed(() => collapse?.activeNames.value.includes(unref(name)));
	const handleFocus = () => {
		setTimeout(() => {
			if (!isClick.value) focusing.value = true;
			else isClick.value = false;
		}, 50);
	};
	const handleHeaderClick = (e) => {
		if (props.disabled) return;
		if (e.target?.closest("input, textarea, select")) return;
		collapse?.handleItemClick(unref(name));
		focusing.value = false;
		isClick.value = true;
	};
	const handleEnterClick = (e) => {
		if (e.target?.closest("input, textarea, select")) return;
		e.preventDefault();
		collapse?.handleItemClick(unref(name));
	};
	return {
		focusing,
		id,
		isActive,
		handleFocus,
		handleHeaderClick,
		handleEnterClick
	};
};
var useCollapseItemDOM = (props, { focusing, isActive, id }) => {
	const ns = useNamespace("collapse");
	const rootKls = computed(() => [
		ns.b("item"),
		ns.is("active", unref(isActive)),
		ns.is("disabled", props.disabled)
	]);
	const headKls = computed(() => [
		ns.be("item", "header"),
		ns.is("active", unref(isActive)),
		{ focusing: unref(focusing) && !props.disabled }
	]);
	const arrowKls = computed(() => [ns.be("item", "arrow"), ns.is("active", unref(isActive))]);
	return {
		itemTitleKls: computed(() => [ns.be("item", "title")]),
		arrowKls,
		headKls,
		rootKls,
		itemWrapperKls: computed(() => ns.be("item", "wrap")),
		itemContentKls: computed(() => ns.be("item", "content")),
		scopedContentId: computed(() => ns.b(`content-${unref(id)}`)),
		scopedHeadId: computed(() => ns.b(`head-${unref(id)}`))
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/collapse-item.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"id",
	"aria-expanded",
	"aria-controls",
	"aria-describedby",
	"tabindex",
	"aria-disabled"
];
var _hoisted_2 = [
	"id",
	"aria-hidden",
	"aria-labelledby"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/src/collapse-item2.mjs
var collapse_item_default = /* @__PURE__ */ defineComponent({
	name: "ElCollapseItem",
	__name: "collapse-item",
	props: collapseItemProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const { focusing, id, isActive, handleFocus, handleHeaderClick, handleEnterClick } = useCollapseItem(props);
		const { arrowKls, headKls, rootKls, itemTitleKls, itemWrapperKls, itemContentKls, scopedContentId, scopedHeadId } = useCollapseItemDOM(props, {
			focusing,
			isActive,
			id
		});
		__expose({ 
		/** @description current collapse-item whether active */
isActive });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(unref(rootKls)) }, [createBaseVNode("div", {
				id: unref(scopedHeadId),
				class: normalizeClass(unref(headKls)),
				"aria-expanded": unref(isActive),
				"aria-controls": unref(scopedContentId),
				"aria-describedby": unref(scopedContentId),
				tabindex: __props.disabled ? void 0 : 0,
				"aria-disabled": __props.disabled,
				role: "button",
				onClick: _cache[0] || (_cache[0] = (...args) => unref(handleHeaderClick) && unref(handleHeaderClick)(...args)),
				onKeydown: _cache[1] || (_cache[1] = withKeys(withModifiers((...args) => unref(handleEnterClick) && unref(handleEnterClick)(...args), ["stop"]), ["space", "enter"])),
				onFocus: _cache[2] || (_cache[2] = (...args) => unref(handleFocus) && unref(handleFocus)(...args)),
				onBlur: _cache[3] || (_cache[3] = ($event) => focusing.value = false)
			}, [createBaseVNode("span", { class: normalizeClass(unref(itemTitleKls)) }, [renderSlot(_ctx.$slots, "title", { isActive: unref(isActive) }, () => [createTextVNode(toDisplayString(__props.title), 1)])], 2), renderSlot(_ctx.$slots, "icon", { isActive: unref(isActive) }, () => [createVNode(unref(ElIcon), { class: normalizeClass(unref(arrowKls)) }, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
				_: 1
			}, 8, ["class"])])], 42, _hoisted_1), createVNode(unref(ElCollapseTransition), null, {
				default: withCtx(() => [withDirectives(createBaseVNode("div", {
					id: unref(scopedContentId),
					role: "region",
					class: normalizeClass(unref(itemWrapperKls)),
					"aria-hidden": !unref(isActive),
					"aria-labelledby": unref(scopedHeadId)
				}, [createBaseVNode("div", { class: normalizeClass(unref(itemContentKls)) }, [renderSlot(_ctx.$slots, "default")], 2)], 10, _hoisted_2), [[vShow, unref(isActive)]])]),
				_: 3
			})], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/collapse/index.mjs
var ElCollapse = withInstall(collapse_default, { CollapseItem: collapse_item_default });
var ElCollapseItem = withNoopInstall(collapse_item_default);
//#endregion
export { ElCollapseItem as n, ElCollapse as t };
