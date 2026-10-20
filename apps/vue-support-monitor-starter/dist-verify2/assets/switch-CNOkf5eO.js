import { $n as normalizeClass, An as NOOP, D as createVNode, Gn as isPromise, Ht as watch, Jn as isString, On as unref, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as INPUT_EVENT, r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { a as throwError, c as definePropType, f as isNumber, i as debugWarn, l as isBoolean, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { dt as loading_default } from "./dist-DogtK295.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { n as useFormItemInputId, t as useFormItem } from "./use-form-item-D-dEMqBj.js";
import { t as isValidComponentSize } from "./validator-PIu3bjQD.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/switch/src/switch.mjs
/**
* @deprecated Removed after 3.0.0, Use `SwitchProps` instead.
*/
var switchProps = buildProps({
	/**
	* @description binding value, it should be equivalent to either `active-value` or `inactive-value`, by default it's `boolean` type
	*/
	modelValue: {
		type: [
			Boolean,
			String,
			Number
		],
		default: false
	},
	/**
	* @description whether Switch is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether Switch is in loading state
	*/
	loading: Boolean,
	/**
	* @description size of Switch
	*/
	size: {
		type: String,
		validator: isValidComponentSize
	},
	/**
	* @description width of Switch
	*/
	width: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description whether icon or text is displayed inside dot, only the first character will be rendered for text
	*/
	inlinePrompt: Boolean,
	/**
	* @description component of the icon displayed in action when in `off` state
	*/
	inactiveActionIcon: { type: iconPropType },
	/**
	* @description component of the icon displayed in action when in `on` state
	*/
	activeActionIcon: { type: iconPropType },
	/**
	* @description component of the icon displayed when in `on` state, overrides `active-text`
	*/
	activeIcon: { type: iconPropType },
	/**
	* @description component of the icon displayed when in `off` state, overrides `inactive-text`
	*/
	inactiveIcon: { type: iconPropType },
	/**
	* @description text displayed when in `on` state
	*/
	activeText: {
		type: String,
		default: ""
	},
	/**
	* @description text displayed when in `off` state
	*/
	inactiveText: {
		type: String,
		default: ""
	},
	/**
	* @description switch value when in `on` state
	*/
	activeValue: {
		type: [
			Boolean,
			String,
			Number
		],
		default: true
	},
	/**
	* @description switch value when in `off` state
	*/
	inactiveValue: {
		type: [
			Boolean,
			String,
			Number
		],
		default: false
	},
	/**
	* @description input name of Switch
	*/
	name: {
		type: String,
		default: ""
	},
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	/**
	* @description before-change hook before the switch state changes. If `false` is returned or a `Promise` is returned and then is rejected, will stop switching
	*/
	beforeChange: { type: definePropType(Function) },
	/**
	* @description id for input
	*/
	id: String,
	/**
	* @description tabindex for input
	*/
	tabindex: { type: [String, Number] },
	...useAriaProps(["ariaLabel"])
});
var switchEmits = {
	[UPDATE_MODEL_EVENT]: (val) => isBoolean(val) || isString(val) || isNumber(val),
	[CHANGE_EVENT]: (val) => isBoolean(val) || isString(val) || isNumber(val),
	[INPUT_EVENT]: (val) => isBoolean(val) || isString(val) || isNumber(val)
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/switch/src/switch.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"id",
	"aria-checked",
	"aria-disabled",
	"aria-label",
	"name",
	"true-value",
	"false-value",
	"disabled",
	"tabindex"
];
var _hoisted_2 = ["aria-hidden"];
var _hoisted_3 = { key: 1 };
var _hoisted_4 = { key: 1 };
var _hoisted_5 = ["aria-hidden"];
var COMPONENT_NAME = "ElSwitch";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/switch/index.mjs
var ElSwitch = withInstall(/* @__PURE__ */ defineComponent({
	name: COMPONENT_NAME,
	__name: "switch",
	props: switchProps,
	emits: switchEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { formItem } = useFormItem();
		const switchSize = useFormSize();
		const ns = useNamespace("switch");
		const { inputId } = useFormItemInputId(props, { formItemContext: formItem });
		const switchDisabled = useFormDisabled(computed(() => {
			if (props.loading) return true;
		}));
		const isControlled = ref(props.modelValue !== false);
		const input = shallowRef();
		const switchKls = computed(() => [
			ns.b(),
			ns.m(switchSize.value),
			ns.is("disabled", switchDisabled.value),
			ns.is("checked", checked.value)
		]);
		const labelLeftKls = computed(() => [
			ns.e("label"),
			ns.em("label", "left"),
			ns.is("active", !checked.value)
		]);
		const labelRightKls = computed(() => [
			ns.e("label"),
			ns.em("label", "right"),
			ns.is("active", checked.value)
		]);
		const coreStyle = computed(() => ({ width: addUnit(props.width) }));
		watch(() => props.modelValue, () => {
			isControlled.value = true;
		});
		const actualValue = computed(() => {
			return isControlled.value ? props.modelValue : false;
		});
		const checked = computed(() => actualValue.value === props.activeValue);
		if (![props.activeValue, props.inactiveValue].includes(actualValue.value)) {
			debugWarn(COMPONENT_NAME, "model-value must be active-value or inactive-value");
			emit(UPDATE_MODEL_EVENT, props.inactiveValue);
			emit(CHANGE_EVENT, props.inactiveValue);
			emit(INPUT_EVENT, props.inactiveValue);
		}
		watch(checked, (val) => {
			input.value.checked = val;
			if (props.validateEvent) formItem?.validate?.("change").catch(NOOP);
		});
		const handleChange = () => {
			const val = checked.value ? props.inactiveValue : props.activeValue;
			emit(UPDATE_MODEL_EVENT, val);
			emit(CHANGE_EVENT, val);
			emit(INPUT_EVENT, val);
			nextTick(() => {
				input.value.checked = checked.value;
			});
		};
		const switchValue = () => {
			if (switchDisabled.value) return;
			const { beforeChange } = props;
			if (!beforeChange) {
				handleChange();
				return;
			}
			const shouldChange = beforeChange();
			if (![isPromise(shouldChange), isBoolean(shouldChange)].includes(true)) throwError(COMPONENT_NAME, "beforeChange must return type `Promise<boolean>` or `boolean`");
			if (isPromise(shouldChange)) shouldChange.then((result) => {
				if (result) handleChange();
			}).catch((e) => {
				debugWarn(COMPONENT_NAME, `some error occurred: ${e}`);
			});
			else if (shouldChange) handleChange();
		};
		const focus = () => {
			input.value?.focus?.();
		};
		onMounted(() => {
			input.value.checked = checked.value;
		});
		__expose({
			/**
			*  @description manual focus to the switch component
			**/
			focus,
			/**
			* @description whether Switch is checked
			*/
			checked
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(switchKls.value),
				onClick: withModifiers(switchValue, ["prevent"])
			}, [
				createBaseVNode("input", {
					id: unref(inputId),
					ref_key: "input",
					ref: input,
					class: normalizeClass(unref(ns).e("input")),
					type: "checkbox",
					role: "switch",
					"aria-checked": checked.value,
					"aria-disabled": unref(switchDisabled),
					"aria-label": __props.ariaLabel,
					name: __props.name,
					"true-value": __props.activeValue,
					"false-value": __props.inactiveValue,
					disabled: unref(switchDisabled),
					tabindex: __props.tabindex,
					onChange: handleChange,
					onKeydown: withKeys(switchValue, ["enter"])
				}, null, 42, _hoisted_1),
				!__props.inlinePrompt && (__props.inactiveIcon || __props.inactiveText || _ctx.$slots.inactive) ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: normalizeClass(labelLeftKls.value)
				}, [renderSlot(_ctx.$slots, "inactive", {}, () => [__props.inactiveIcon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.inactiveIcon)))]),
					_: 1
				})) : createCommentVNode("v-if", true), !__props.inactiveIcon && __props.inactiveText ? (openBlock(), createElementBlock("span", {
					key: 1,
					"aria-hidden": checked.value
				}, toDisplayString(__props.inactiveText), 9, _hoisted_2)) : createCommentVNode("v-if", true)])], 2)) : createCommentVNode("v-if", true),
				createBaseVNode("span", {
					class: normalizeClass(unref(ns).e("core")),
					style: normalizeStyle(coreStyle.value)
				}, [__props.inlinePrompt ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ns).e("inner"))
				}, [!checked.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ns).e("inner-wrapper"))
				}, [renderSlot(_ctx.$slots, "inactive", {}, () => [__props.inactiveIcon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.inactiveIcon)))]),
					_: 1
				})) : createCommentVNode("v-if", true), !__props.inactiveIcon && __props.inactiveText ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(__props.inactiveText), 1)) : createCommentVNode("v-if", true)])], 2)) : (openBlock(), createElementBlock("div", {
					key: 1,
					class: normalizeClass(unref(ns).e("inner-wrapper"))
				}, [renderSlot(_ctx.$slots, "active", {}, () => [__props.activeIcon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.activeIcon)))]),
					_: 1
				})) : createCommentVNode("v-if", true), !__props.activeIcon && __props.activeText ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(__props.activeText), 1)) : createCommentVNode("v-if", true)])], 2))], 2)) : createCommentVNode("v-if", true), createBaseVNode("div", { class: normalizeClass(unref(ns).e("action")) }, [__props.loading ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: normalizeClass(unref(ns).is("loading"))
				}, {
					default: withCtx(() => [createVNode(unref(loading_default))]),
					_: 1
				}, 8, ["class"])) : checked.value ? renderSlot(_ctx.$slots, "active-action", { key: 1 }, () => [__props.activeActionIcon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.activeActionIcon)))]),
					_: 1
				})) : createCommentVNode("v-if", true)]) : !checked.value ? renderSlot(_ctx.$slots, "inactive-action", { key: 2 }, () => [__props.inactiveActionIcon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.inactiveActionIcon)))]),
					_: 1
				})) : createCommentVNode("v-if", true)]) : createCommentVNode("v-if", true)], 2)], 6),
				!__props.inlinePrompt && (__props.activeIcon || __props.activeText || _ctx.$slots.active) ? (openBlock(), createElementBlock("span", {
					key: 1,
					class: normalizeClass(labelRightKls.value)
				}, [renderSlot(_ctx.$slots, "active", {}, () => [__props.activeIcon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.activeIcon)))]),
					_: 1
				})) : createCommentVNode("v-if", true), !__props.activeIcon && __props.activeText ? (openBlock(), createElementBlock("span", {
					key: 1,
					"aria-hidden": !checked.value
				}, toDisplayString(__props.activeText), 9, _hoisted_5)) : createCommentVNode("v-if", true)])], 2)) : createCommentVNode("v-if", true)
			], 2);
		};
	}
}));
//#endregion
export { ElSwitch as t };
