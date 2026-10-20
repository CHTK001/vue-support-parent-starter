import { $n as normalizeClass, An as NOOP, Cn as toRaw, E as createTextVNode, Hn as isObject, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Lt as useSlots, On as unref, Rn as isArray, Tn as toRefs, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, et as mergeProps, g as computed, gt as provide, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, un as isRef, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { _ as vModelCheckbox, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { c as definePropType, f as isNumber, h as isUndefined, l as isBoolean, p as isPropAbsent, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as omit } from "./omit-nJwLfQRJ.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { t as pick } from "./pick-BwGnaelS.js";
import { t as useDeprecated } from "./use-deprecated-qam6HGto.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { t as formContextKey } from "./constants-ntbKDiND.js";
import { n as useFormItemInputId, t as useFormItem } from "./use-form-item-D-dEMqBj.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox.mjs
/**
* @deprecated Removed after 3.0.0, Use `CheckboxProps` instead.
*/
var checkboxProps = {
	/**
	* @description binding value
	*/
	modelValue: {
		type: [
			Number,
			String,
			Boolean
		],
		default: void 0
	},
	/**
	* @description label of the Checkbox when used inside a `checkbox-group`
	*/
	label: {
		type: [
			String,
			Boolean,
			Number,
			Object
		],
		default: void 0
	},
	/**
	* @description value of the Checkbox when used inside a `checkbox-group`
	*/
	value: {
		type: [
			String,
			Boolean,
			Number,
			Object
		],
		default: void 0
	},
	/**
	* @description Set indeterminate state, only responsible for style control
	*/
	indeterminate: Boolean,
	/**
	* @description whether the Checkbox is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description if the Checkbox is checked
	*/
	checked: Boolean,
	/**
	* @description native 'name' attribute
	*/
	name: {
		type: String,
		default: void 0
	},
	/**
	* @description value of the Checkbox if it's checked
	*/
	trueValue: {
		type: [String, Number],
		default: void 0
	},
	/**
	* @description value of the Checkbox if it's not checked
	*/
	falseValue: {
		type: [String, Number],
		default: void 0
	},
	/**
	* @deprecated use `trueValue` instead
	* @description value of the Checkbox if it's checked
	*/
	trueLabel: {
		type: [String, Number],
		default: void 0
	},
	/**
	* @deprecated use `falseValue` instead
	* @description value of the Checkbox if it's not checked
	*/
	falseLabel: {
		type: [String, Number],
		default: void 0
	},
	/**
	* @description input id
	*/
	id: {
		type: String,
		default: void 0
	},
	/**
	* @description whether to add a border around Checkbox
	*/
	border: Boolean,
	/**
	* @description size of the Checkbox
	*/
	size: useSizeProp,
	/**
	* @description input tabindex
	*/
	tabindex: [String, Number],
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	ariaLabel: String,
	...useAriaProps(["ariaControls"])
};
var checkboxEmits = {
	[UPDATE_MODEL_EVENT]: (val) => isString(val) || isNumber(val) || isBoolean(val),
	change: (val) => isString(val) || isNumber(val) || isBoolean(val)
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/constants.mjs
var checkboxGroupContextKey = Symbol("checkboxGroupContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox-group.mjs
/**
* @deprecated Removed after 3.0.0, Use `CheckboxGroupProps` instead.
*/
var checkboxGroupProps = buildProps({
	/**
	* @description binding value
	*/
	modelValue: {
		type: definePropType(Array),
		default: () => []
	},
	/**
	* @description whether the nesting checkboxes are disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description minimum number of checkbox checked
	*/
	min: Number,
	/**
	* @description maximum number of checkbox checked
	*/
	max: Number,
	/**
	* @description size of checkbox
	*/
	size: useSizeProp,
	/**
	* @description border and background color when button is active
	*/
	fill: String,
	/**
	* @description font color when button is active
	*/
	textColor: String,
	/**
	* @description element tag of the checkbox group
	*/
	tag: {
		type: String,
		default: "div"
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
		default: () => checkboxDefaultProps
	},
	type: {
		type: String,
		values: ["checkbox", "button"],
		default: "checkbox"
	},
	...useAriaProps(["ariaLabel"])
});
var checkboxGroupEmits = {
	[UPDATE_MODEL_EVENT]: (val) => isArray(val),
	change: (val) => isArray(val)
};
var checkboxDefaultProps = {
	label: "label",
	value: "value",
	disabled: "disabled"
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/composables/use-checkbox-disabled.mjs
var useCheckboxDisabled = ({ model, isChecked }) => {
	const checkboxGroup = inject(checkboxGroupContextKey, void 0);
	const formContext = inject(formContextKey, void 0);
	const isLimitDisabled = computed(() => {
		const max = checkboxGroup?.max?.value;
		const min = checkboxGroup?.min?.value;
		return !isUndefined(max) && model.value.length >= max && !isChecked.value || !isUndefined(min) && model.value.length <= min && isChecked.value;
	});
	return {
		isDisabled: useFormDisabled(computed(() => {
			if (checkboxGroup === void 0) return formContext?.disabled ?? isLimitDisabled.value;
			else return checkboxGroup.disabled?.value || isLimitDisabled.value;
		})),
		isLimitDisabled
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/composables/use-checkbox-event.mjs
var useCheckboxEvent = (props, { model, isLimitExceeded, hasOwnLabel, isDisabled, isLabeledByFormItem }) => {
	const checkboxGroup = inject(checkboxGroupContextKey, void 0);
	const { formItem } = useFormItem();
	const { emit } = getCurrentInstance();
	function getLabeledValue(value) {
		return [
			true,
			props.trueValue,
			props.trueLabel
		].includes(value) ? props.trueValue ?? props.trueLabel ?? true : props.falseValue ?? props.falseLabel ?? false;
	}
	function emitChangeEvent(checked, e) {
		emit(CHANGE_EVENT, getLabeledValue(checked), e);
	}
	function handleChange(e) {
		if (isLimitExceeded.value) return;
		const target = e.target;
		emit(CHANGE_EVENT, getLabeledValue(target.checked), e);
	}
	async function onClickRoot(e) {
		if (isLimitExceeded.value) return;
		if (!hasOwnLabel.value && !isDisabled.value && isLabeledByFormItem.value) {
			if (!e.composedPath().some((item) => item.tagName === "LABEL")) {
				model.value = getLabeledValue([
					false,
					props.falseValue,
					props.falseLabel
				].includes(model.value));
				await nextTick();
				emitChangeEvent(model.value, e);
			}
		}
	}
	const validateEvent = computed(() => checkboxGroup?.validateEvent || props.validateEvent);
	watch(() => props.modelValue, () => {
		if (validateEvent.value) formItem?.validate("change").catch(NOOP);
	});
	return {
		handleChange,
		onClickRoot
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/composables/use-checkbox-model.mjs
var useCheckboxModel = (props) => {
	const selfModel = ref(false);
	const { emit, vnode } = getCurrentInstance();
	const checkboxGroup = inject(checkboxGroupContextKey, void 0);
	const isGroup = computed(() => isUndefined(checkboxGroup) === false);
	const isLimitExceeded = ref(false);
	const isControlled = computed(() => {
		const rawProps = vnode.props ?? {};
		return "modelValue" in rawProps || "model-value" in rawProps;
	});
	const model = computed({
		get() {
			return isGroup.value ? checkboxGroup?.modelValue?.value : !isControlled.value ? selfModel.value : props.modelValue;
		},
		set(val) {
			if (isGroup.value && isArray(val)) {
				isLimitExceeded.value = checkboxGroup?.max?.value !== void 0 && val.length > checkboxGroup?.max.value && val.length > model.value.length;
				isLimitExceeded.value === false && checkboxGroup?.changeEvent?.(val);
			} else {
				emit(UPDATE_MODEL_EVENT, val);
				selfModel.value = val;
			}
		}
	});
	return {
		model,
		isGroup,
		isLimitExceeded
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/composables/use-checkbox-status.mjs
var useCheckboxStatus = (props, slots, { model }) => {
	const checkboxGroup = inject(checkboxGroupContextKey, void 0);
	const isFocused = ref(false);
	const actualValue = computed(() => {
		if (!isPropAbsent(props.value)) return props.value;
		return props.label;
	});
	const isChecked = computed(() => {
		const value = model.value;
		if (isBoolean(value)) return value;
		else if (isArray(value)) if (isObject(actualValue.value)) return value.map(toRaw).some((o) => isEqual(o, actualValue.value));
		else return value.map(toRaw).includes(actualValue.value);
		else if (value !== null && value !== void 0) return value === props.trueValue || value === props.trueLabel;
		else return !!value;
	});
	return {
		checkboxButtonSize: useFormSize(computed(() => checkboxGroup?.size?.value), { prop: true }),
		isChecked,
		isFocused,
		checkboxSize: useFormSize(computed(() => checkboxGroup?.size?.value)),
		hasOwnLabel: computed(() => {
			return !!slots.default || !isPropAbsent(actualValue.value);
		}),
		actualValue
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/composables/use-checkbox.mjs
var useCheckbox = (props, slots) => {
	const { formItem: elFormItem } = useFormItem();
	const { model, isGroup, isLimitExceeded } = useCheckboxModel(props);
	const { isFocused, isChecked, checkboxButtonSize, checkboxSize, hasOwnLabel, actualValue } = useCheckboxStatus(props, slots, { model });
	const { isDisabled } = useCheckboxDisabled({
		model,
		isChecked
	});
	const { inputId, isLabeledByFormItem } = useFormItemInputId(props, {
		formItemContext: elFormItem,
		disableIdGeneration: hasOwnLabel,
		disableIdManagement: isGroup
	});
	const { handleChange, onClickRoot } = useCheckboxEvent(props, {
		model,
		isLimitExceeded,
		hasOwnLabel,
		isDisabled,
		isLabeledByFormItem
	});
	const setStoreValue = () => {
		function addToStore() {
			if (isArray(model.value) && !model.value.includes(actualValue.value)) model.value.push(actualValue.value);
			else model.value = props.trueValue ?? props.trueLabel ?? true;
		}
		props.checked && addToStore();
	};
	setStoreValue();
	useDeprecated({
		from: "label act as value",
		replacement: "value",
		version: "3.0.0",
		scope: "el-checkbox",
		ref: "https://element-plus.org/en-US/component/checkbox.html"
	}, computed(() => isGroup.value && isPropAbsent(props.value)));
	useDeprecated({
		from: "true-label",
		replacement: "true-value",
		version: "3.0.0",
		scope: "el-checkbox",
		ref: "https://element-plus.org/en-US/component/checkbox.html"
	}, computed(() => !!props.trueLabel));
	useDeprecated({
		from: "false-label",
		replacement: "false-value",
		version: "3.0.0",
		scope: "el-checkbox",
		ref: "https://element-plus.org/en-US/component/checkbox.html"
	}, computed(() => !!props.falseLabel));
	return {
		inputId,
		isLabeledByFormItem,
		isChecked,
		isDisabled,
		isFocused,
		checkboxButtonSize,
		checkboxSize,
		hasOwnLabel,
		model,
		actualValue,
		handleChange,
		onClickRoot
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = [
	"id",
	"indeterminate",
	"name",
	"tabindex",
	"disabled"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox2.mjs
var checkbox_default = /* @__PURE__ */ defineComponent({
	name: "ElCheckbox",
	__name: "checkbox",
	props: checkboxProps,
	emits: checkboxEmits,
	setup(__props) {
		const props = __props;
		const { inputId, isLabeledByFormItem, isChecked, isDisabled, isFocused, checkboxSize, hasOwnLabel, model, actualValue, handleChange, onClickRoot } = useCheckbox(props, useSlots());
		const inputBindings = computed(() => {
			if (props.trueValue || props.falseValue || props.trueLabel || props.falseLabel) return {
				"true-value": props.trueValue ?? props.trueLabel ?? true,
				"false-value": props.falseValue ?? props.falseLabel ?? false
			};
			return { value: actualValue.value };
		});
		const ns = useNamespace("checkbox");
		const compKls = computed(() => {
			return [
				ns.b(),
				ns.m(checkboxSize.value),
				ns.is("disabled", isDisabled.value),
				ns.is("bordered", props.border),
				ns.is("checked", isChecked.value)
			];
		});
		const spanKls = computed(() => {
			return [
				ns.e("input"),
				ns.is("disabled", isDisabled.value),
				ns.is("checked", isChecked.value),
				ns.is("indeterminate", props.indeterminate),
				ns.is("focus", isFocused.value)
			];
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(!unref(hasOwnLabel) && unref(isLabeledByFormItem) ? "span" : "label"), {
				for: !unref(hasOwnLabel) && unref(isLabeledByFormItem) ? null : unref(inputId),
				class: normalizeClass(compKls.value),
				"aria-controls": __props.indeterminate ? __props.ariaControls : null,
				"aria-checked": __props.indeterminate ? "mixed" : void 0,
				"aria-label": __props.ariaLabel,
				onClick: unref(onClickRoot)
			}, {
				default: withCtx(() => [createBaseVNode("span", { class: normalizeClass(spanKls.value) }, [withDirectives(createBaseVNode("input", mergeProps({
					id: unref(inputId),
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => isRef(model) ? model.value = $event : null),
					class: unref(ns).e("original"),
					type: "checkbox",
					indeterminate: __props.indeterminate,
					name: __props.name,
					tabindex: __props.tabindex,
					disabled: unref(isDisabled)
				}, inputBindings.value, {
					onChange: _cache[1] || (_cache[1] = (...args) => unref(handleChange) && unref(handleChange)(...args)),
					onFocus: _cache[2] || (_cache[2] = ($event) => isFocused.value = true),
					onBlur: _cache[3] || (_cache[3] = ($event) => isFocused.value = false),
					onClick: _cache[4] || (_cache[4] = withModifiers(() => {}, ["stop"]))
				}), null, 16, _hoisted_1$1), [[vModelCheckbox, unref(model)]]), createBaseVNode("span", { class: normalizeClass(unref(ns).e("inner")) }, null, 2)], 2), unref(hasOwnLabel) ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: normalizeClass(unref(ns).e("label"))
				}, [renderSlot(_ctx.$slots, "default"), !_ctx.$slots.default ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(toDisplayString(__props.label), 1)], 64)) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true)]),
				_: 3
			}, 8, [
				"for",
				"class",
				"aria-controls",
				"aria-checked",
				"aria-label",
				"onClick"
			]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox-button.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"name",
	"tabindex",
	"disabled"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox-button.mjs
var checkbox_button_default = /* @__PURE__ */ defineComponent({
	name: "ElCheckboxButton",
	__name: "checkbox-button",
	props: checkboxProps,
	emits: checkboxEmits,
	setup(__props) {
		const props = __props;
		const { isFocused, isChecked, isDisabled, checkboxButtonSize, model, actualValue, handleChange } = useCheckbox(props, useSlots());
		const inputBindings = computed(() => {
			if (props.trueValue || props.falseValue || props.trueLabel || props.falseLabel) return {
				"true-value": props.trueValue ?? props.trueLabel ?? true,
				"false-value": props.falseValue ?? props.falseLabel ?? false
			};
			return { value: actualValue.value };
		});
		const checkboxGroup = inject(checkboxGroupContextKey, void 0);
		const ns = useNamespace("checkbox");
		const activeStyle = computed(() => {
			const fillValue = checkboxGroup?.fill?.value ?? "";
			return {
				backgroundColor: fillValue,
				borderColor: fillValue,
				color: checkboxGroup?.textColor?.value ?? "",
				boxShadow: fillValue ? `-1px 0 0 0 ${fillValue}` : void 0
			};
		});
		const labelKls = computed(() => {
			return [
				ns.b("button"),
				ns.bm("button", checkboxButtonSize.value),
				ns.is("disabled", isDisabled.value),
				ns.is("checked", isChecked.value),
				ns.is("focus", isFocused.value)
			];
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("label", { class: normalizeClass(labelKls.value) }, [withDirectives(createBaseVNode("input", mergeProps({
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => isRef(model) ? model.value = $event : null),
				class: unref(ns).be("button", "original"),
				type: "checkbox",
				name: __props.name,
				tabindex: __props.tabindex,
				disabled: unref(isDisabled)
			}, inputBindings.value, {
				onChange: _cache[1] || (_cache[1] = (...args) => unref(handleChange) && unref(handleChange)(...args)),
				onFocus: _cache[2] || (_cache[2] = ($event) => isFocused.value = true),
				onBlur: _cache[3] || (_cache[3] = ($event) => isFocused.value = false),
				onClick: _cache[4] || (_cache[4] = withModifiers(() => {}, ["stop"]))
			}), null, 16, _hoisted_1), [[vModelCheckbox, unref(model)]]), _ctx.$slots.default || __props.label ? (openBlock(), createElementBlock("span", {
				key: 0,
				class: normalizeClass(unref(ns).be("button", "inner")),
				style: normalizeStyle(unref(isChecked) ? activeStyle.value : void 0)
			}, [renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(__props.label), 1)])], 6)) : createCommentVNode("v-if", true)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/src/checkbox-group2.mjs
var checkbox_group_default = /* @__PURE__ */ defineComponent({
	name: "ElCheckboxGroup",
	__name: "checkbox-group",
	props: checkboxGroupProps,
	emits: checkboxGroupEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("checkbox");
		const checkboxDisabled = useFormDisabled();
		const { formItem } = useFormItem();
		const { inputId: groupId, isLabeledByFormItem } = useFormItemInputId(props, { formItemContext: formItem });
		const changeEvent = async (value) => {
			emit(UPDATE_MODEL_EVENT, value);
			await nextTick();
			emit(CHANGE_EVENT, value);
		};
		const modelValue = computed({
			get() {
				return props.modelValue;
			},
			set(val) {
				changeEvent(val);
			}
		});
		const aliasProps = computed(() => ({
			...checkboxDefaultProps,
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
		const optionComponent = computed(() => props.type === "button" ? checkbox_button_default : checkbox_default);
		provide(checkboxGroupContextKey, {
			...pick(toRefs(props), [
				"size",
				"min",
				"max",
				"validateEvent",
				"fill",
				"textColor"
			]),
			disabled: checkboxDisabled,
			modelValue,
			changeEvent
		});
		watch(() => props.modelValue, (newVal, oldValue) => {
			if (props.validateEvent && !isEqual(newVal, oldValue)) formItem?.validate("change").catch(NOOP);
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
				id: unref(groupId),
				class: normalizeClass(unref(ns).b("group")),
				role: "group",
				"aria-label": !unref(isLabeledByFormItem) ? __props.ariaLabel || "checkbox-group" : void 0,
				"aria-labelledby": unref(isLabeledByFormItem) ? unref(formItem)?.labelId : void 0
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.options, (item, index) => {
					return openBlock(), createBlock(resolveDynamicComponent(optionComponent.value), mergeProps({ key: index }, { ref_for: true }, getOptionProps(item)), null, 16);
				}), 128))])]),
				_: 3
			}, 8, [
				"id",
				"class",
				"aria-label",
				"aria-labelledby"
			]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/checkbox/index.mjs
var ElCheckbox = withInstall(checkbox_default, {
	CheckboxButton: checkbox_button_default,
	CheckboxGroup: checkbox_group_default
});
var ElCheckboxButton = withNoopInstall(checkbox_button_default);
var ElCheckboxGroup = withNoopInstall(checkbox_group_default);
//#endregion
export { ElCheckboxButton as n, ElCheckboxGroup as r, ElCheckbox as t };
