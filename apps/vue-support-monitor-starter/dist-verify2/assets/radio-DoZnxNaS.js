import { $n as normalizeClass, An as NOOP, E as createTextVNode, Ht as watch, J as inject, Jn as isString, On as unref, Tn as toRefs, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, gn as reactive, gt as provide, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, tt as nextTick, un as isRef, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers, y as vModelRadio } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { c as definePropType, f as isNumber, l as isBoolean, p as isPropAbsent, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as omit } from "./omit-nJwLfQRJ.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { t as useDeprecated } from "./use-deprecated-qam6HGto.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { n as useFormItemInputId, t as useFormItem } from "./use-form-item-D-dEMqBj.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio.mjs
/**
* @deprecated Removed after 3.0.0, Use `RadioPropsBase` instead.
*/
var radioPropsBase = buildProps({
	/**
	* @description binding value
	*/
	modelValue: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	/**
	* @description size of the Radio
	*/
	size: useSizeProp,
	/**
	* @description whether Radio is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description the label of Radio
	*/
	label: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	/**
	* @description the value of Radio
	*/
	value: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	/**
	* @description native `name` attribute
	*/
	name: {
		type: String,
		default: void 0
	}
});
/**
* @deprecated Removed after 3.0.0, Use `RadioProps` instead.
*/
var radioProps = buildProps({
	...radioPropsBase,
	/**
	* @description whether to add a border around Radio
	*/
	border: Boolean
});
var radioEmits = {
	[UPDATE_MODEL_EVENT]: (val) => isString(val) || isNumber(val) || isBoolean(val),
	[CHANGE_EVENT]: (val) => isString(val) || isNumber(val) || isBoolean(val)
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/constants.mjs
var radioGroupKey = Symbol("radioGroupKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio-button.mjs
/**
* @deprecated Removed after 3.0.0, Use `RadioButtonProps` instead.
*/
var radioButtonProps = buildProps({ ...radioPropsBase });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio-group.mjs
var radioDefaultProps = {
	label: "label",
	value: "value",
	disabled: "disabled"
};
/**
* @deprecated Removed after 3.0.0, Use `RadioGroupProps` instead.
*/
var radioGroupProps = buildProps({
	/**
	* @description native `id` attribute
	*/
	id: {
		type: String,
		default: void 0
	},
	/**
	* @description the size of radio buttons or bordered radios
	*/
	size: useSizeProp,
	/**
	* @description whether the nesting radios are disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description binding value
	*/
	modelValue: {
		type: [
			String,
			Number,
			Boolean
		],
		default: void 0
	},
	/**
	* @description border and background color when button is active
	*/
	fill: {
		type: String,
		default: ""
	},
	/**
	* @description font color when button is active
	*/
	textColor: {
		type: String,
		default: ""
	},
	/**
	* @description native `name` attribute
	*/
	name: {
		type: String,
		default: void 0
	},
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	options: { type: definePropType(Array) },
	props: {
		type: definePropType(Object),
		default: () => radioDefaultProps
	},
	type: {
		type: String,
		values: ["radio", "button"],
		default: "radio"
	},
	...useAriaProps(["ariaLabel"])
});
var radioGroupEmits = radioEmits;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/use-radio.mjs
var useRadio = (props, emit) => {
	const radioRef = ref();
	const radioGroup = inject(radioGroupKey, void 0);
	const isGroup = computed(() => !!radioGroup);
	const actualValue = computed(() => {
		if (!isPropAbsent(props.value)) return props.value;
		return props.label;
	});
	const modelValue = computed({
		get() {
			return isGroup.value ? radioGroup.modelValue : props.modelValue;
		},
		set(val) {
			if (isGroup.value) radioGroup.changeEvent(val);
			else emit && emit("update:modelValue", val);
			radioRef.value.checked = props.modelValue === actualValue.value;
		}
	});
	const size = useFormSize(computed(() => radioGroup?.size));
	const disabled = useFormDisabled(computed(() => radioGroup?.disabled));
	const focus = ref(false);
	const tabIndex = computed(() => {
		return disabled.value || isGroup.value && modelValue.value !== actualValue.value ? -1 : 0;
	});
	useDeprecated({
		from: "label act as value",
		replacement: "value",
		version: "3.0.0",
		scope: "el-radio",
		ref: "https://element-plus.org/en-US/component/radio.html"
	}, computed(() => isGroup.value && isPropAbsent(props.value)));
	return {
		radioRef,
		isGroup,
		radioGroup,
		focus,
		size,
		disabled,
		tabIndex,
		modelValue,
		actualValue
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$2 = [
	"value",
	"name",
	"disabled",
	"checked"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio2.mjs
var radio_default = /* @__PURE__ */ defineComponent({
	name: "ElRadio",
	__name: "radio",
	props: radioProps,
	emits: radioEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("radio");
		const { radioRef, radioGroup, focus, size, disabled, modelValue, actualValue } = useRadio(props, emit);
		function handleChange() {
			nextTick(() => emit(CHANGE_EVENT, modelValue.value));
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("label", { class: normalizeClass([
				unref(ns).b(),
				unref(ns).is("disabled", unref(disabled)),
				unref(ns).is("focus", unref(focus)),
				unref(ns).is("bordered", __props.border),
				unref(ns).is("checked", unref(modelValue) === unref(actualValue)),
				unref(ns).m(unref(size))
			]) }, [createBaseVNode("span", { class: normalizeClass([
				unref(ns).e("input"),
				unref(ns).is("disabled", unref(disabled)),
				unref(ns).is("checked", unref(modelValue) === unref(actualValue))
			]) }, [withDirectives(createBaseVNode("input", {
				ref_key: "radioRef",
				ref: radioRef,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => isRef(modelValue) ? modelValue.value = $event : null),
				class: normalizeClass(unref(ns).e("original")),
				value: unref(actualValue),
				name: __props.name || unref(radioGroup)?.name,
				disabled: unref(disabled),
				checked: unref(modelValue) === unref(actualValue),
				type: "radio",
				onFocus: _cache[1] || (_cache[1] = ($event) => focus.value = true),
				onBlur: _cache[2] || (_cache[2] = ($event) => focus.value = false),
				onChange: handleChange,
				onClick: _cache[3] || (_cache[3] = withModifiers(() => {}, ["stop"]))
			}, null, 42, _hoisted_1$2), [[vModelRadio, unref(modelValue)]]), createBaseVNode("span", { class: normalizeClass(unref(ns).e("inner")) }, null, 2)], 2), createBaseVNode("span", {
				class: normalizeClass(unref(ns).e("label")),
				onKeydown: _cache[4] || (_cache[4] = withModifiers(() => {}, ["stop"]))
			}, [renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(__props.label), 1)])], 34)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio-button.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = [
	"value",
	"name",
	"disabled"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio-button2.mjs
var radio_button_default = /* @__PURE__ */ defineComponent({
	name: "ElRadioButton",
	__name: "radio-button",
	props: radioButtonProps,
	setup(__props) {
		const props = __props;
		const ns = useNamespace("radio");
		const { radioRef, focus, size, disabled, modelValue, radioGroup, actualValue } = useRadio(props);
		const activeStyle = computed(() => {
			return {
				backgroundColor: radioGroup?.fill || "",
				borderColor: radioGroup?.fill || "",
				boxShadow: radioGroup?.fill ? `-1px 0 0 0 ${radioGroup.fill}` : "",
				color: radioGroup?.textColor || ""
			};
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("label", { class: normalizeClass([
				unref(ns).b("button"),
				unref(ns).is("active", unref(modelValue) === unref(actualValue)),
				unref(ns).is("disabled", unref(disabled)),
				unref(ns).is("focus", unref(focus)),
				unref(ns).bm("button", unref(size))
			]) }, [withDirectives(createBaseVNode("input", {
				ref_key: "radioRef",
				ref: radioRef,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => isRef(modelValue) ? modelValue.value = $event : null),
				class: normalizeClass(unref(ns).be("button", "original-radio")),
				value: unref(actualValue),
				type: "radio",
				name: __props.name || unref(radioGroup)?.name,
				disabled: unref(disabled),
				onFocus: _cache[1] || (_cache[1] = ($event) => focus.value = true),
				onBlur: _cache[2] || (_cache[2] = ($event) => focus.value = false),
				onClick: _cache[3] || (_cache[3] = withModifiers(() => {}, ["stop"]))
			}, null, 42, _hoisted_1$1), [[vModelRadio, unref(modelValue)]]), createBaseVNode("span", {
				class: normalizeClass(unref(ns).be("button", "inner")),
				style: normalizeStyle(unref(modelValue) === unref(actualValue) ? activeStyle.value : {}),
				onKeydown: _cache[4] || (_cache[4] = withModifiers(() => {}, ["stop"]))
			}, [renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(__props.label), 1)])], 38)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio-group.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"id",
	"aria-label",
	"aria-labelledby"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/src/radio-group2.mjs
var radio_group_default = /* @__PURE__ */ defineComponent({
	name: "ElRadioGroup",
	__name: "radio-group",
	props: radioGroupProps,
	emits: radioGroupEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("radio");
		const radioId = useId();
		const radioGroupRef = ref();
		const { formItem } = useFormItem();
		const { inputId: groupId, isLabeledByFormItem } = useFormItemInputId(props, { formItemContext: formItem });
		const changeEvent = (value) => {
			emit(UPDATE_MODEL_EVENT, value);
			nextTick(() => emit(CHANGE_EVENT, value));
		};
		onMounted(() => {
			const radios = radioGroupRef.value.querySelectorAll("[type=radio]");
			const firstLabel = radios[0];
			if (!Array.from(radios).some((radio) => radio.checked) && firstLabel) firstLabel.tabIndex = 0;
		});
		const name = computed(() => {
			return props.name || radioId.value;
		});
		const aliasProps = computed(() => ({
			...radioDefaultProps,
			...props.props
		}));
		const getOptionProps = (option) => {
			const { label, value, disabled } = aliasProps.value;
			const base = {
				label: option[label],
				value: option[value],
				disabled: option[disabled]
			};
			return {
				...omit(option, [
					label,
					value,
					disabled
				]),
				...base
			};
		};
		const optionComponent = computed(() => props.type === "button" ? radio_button_default : radio_default);
		provide(radioGroupKey, reactive({
			...toRefs(props),
			changeEvent,
			name
		}));
		watch(() => props.modelValue, (newVal, oldValue) => {
			if (props.validateEvent && !isEqual(newVal, oldValue)) formItem?.validate("change").catch(NOOP);
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				id: unref(groupId),
				ref_key: "radioGroupRef",
				ref: radioGroupRef,
				class: normalizeClass(unref(ns).b("group")),
				role: "radiogroup",
				"aria-label": !unref(isLabeledByFormItem) ? __props.ariaLabel || "radio-group" : void 0,
				"aria-labelledby": unref(isLabeledByFormItem) ? unref(formItem).labelId : void 0
			}, [renderSlot(_ctx.$slots, "default", {}, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.options, (item, index) => {
				return openBlock(), createBlock(resolveDynamicComponent(optionComponent.value), mergeProps({ key: index }, { ref_for: true }, getOptionProps(item)), null, 16);
			}), 128))])], 10, _hoisted_1);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/radio/index.mjs
var ElRadio = withInstall(radio_default, {
	RadioButton: radio_button_default,
	RadioGroup: radio_group_default
});
var ElRadioGroup = withNoopInstall(radio_group_default);
var ElRadioButton = withNoopInstall(radio_button_default);
//#endregion
export { ElRadioButton as n, ElRadioGroup as r, ElRadio as t };
