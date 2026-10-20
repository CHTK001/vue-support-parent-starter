import { $n as normalizeClass, An as NOOP, D as createVNode, Ht as watch, Jn as isString, On as unref, Yt as withDirectives, b as createElementBlock, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, pt as onUpdated, qt as withCtx, v as createBlock, vn as ref, w as createSlots, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, n as getEventCode, r as getEventKey } from "./event-BIZRdi1l.js";
import { n as INPUT_EVENT, r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { _ as isNil, a as throwError, c as definePropType, f as isNumber, h as isUndefined, i as debugWarn, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { Et as plus_default, _t as minus_default, o as arrow_up_default, r as arrow_down_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as useFormItem } from "./use-form-item-D-dEMqBj.js";
import { t as vRepeatClick } from "./repeat-click-BFYhYwtQ.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/input-number/src/input-number.mjs
/**
* @deprecated Removed after 3.0.0, Use `InputNumberProps` instead.
*/
var inputNumberProps = buildProps({
	/**
	* @description same as `id` in native input
	*/
	id: {
		type: String,
		default: void 0
	},
	/**
	* @description incremental step
	*/
	step: {
		type: Number,
		default: 1
	},
	/**
	* @description whether input value can only be multiple of step
	*/
	stepStrictly: Boolean,
	/**
	* @description the maximum allowed value
	*/
	max: {
		type: Number,
		default: Number.MAX_SAFE_INTEGER
	},
	/**
	* @description the minimum allowed value
	*/
	min: {
		type: Number,
		default: Number.MIN_SAFE_INTEGER
	},
	/**
	* @description binding value
	*/
	modelValue: { type: [Number, null] },
	/**
	* @description same as `readonly` in native input
	*/
	readonly: Boolean,
	/**
	* @description whether the component is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description size of the component
	*/
	size: useSizeProp,
	/**
	* @description whether to enable the control buttons
	*/
	controls: {
		type: Boolean,
		default: true
	},
	/**
	* @description position of the control buttons
	*/
	controlsPosition: {
		type: String,
		default: "",
		values: ["", "right"]
	},
	/**
	* @description value should be set when input box is cleared
	*/
	valueOnClear: {
		type: definePropType([
			String,
			Number,
			null
		]),
		validator: (val) => val === null || isNumber(val) || ["min", "max"].includes(val),
		default: null
	},
	/**
	* @description same as `name` in native input
	*/
	name: String,
	/**
	* @description same as `placeholder` in native input
	*/
	placeholder: String,
	/**
	* @description precision of input value
	*/
	precision: {
		type: Number,
		validator: (val) => val >= 0 && val === Number.parseInt(`${val}`, 10)
	},
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	...useAriaProps(["ariaLabel"]),
	/**
	* @description native input mode for virtual keyboards
	*/
	inputmode: {
		type: definePropType(String),
		default: void 0
	},
	/**
	* @description alignment for the inner input text
	*/
	align: {
		type: definePropType(String),
		default: "center"
	},
	/**
	* @description whether to disable scientific notation input (e.g. 'e', 'E')
	*/
	disabledScientific: Boolean,
	/**
	* @description specifies the format of the value presented in the input
	*/
	formatter: { type: Function },
	/**
	* @description specifies the value extracted from the formatted input
	*/
	parser: { type: Function },
	/**
	* @description same as `tabindex` in native input
	*/
	tabindex: {
		type: [String, Number],
		default: 0
	}
});
var inputNumberEmits = {
	[CHANGE_EVENT]: (cur, prev) => prev !== cur,
	blur: (e) => e instanceof FocusEvent,
	focus: (e) => e instanceof FocusEvent,
	[INPUT_EVENT]: (val) => isNumber(val) || isNil(val),
	[UPDATE_MODEL_EVENT]: (val) => isNumber(val) || isNil(val)
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/input-number/src/input-number.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["aria-label"];
var _hoisted_2 = ["aria-label"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/input-number/index.mjs
var ElInputNumber = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElInputNumber",
	__name: "input-number",
	props: inputNumberProps,
	emits: inputNumberEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { t } = useLocale();
		const ns = useNamespace("input-number");
		const input = ref();
		const data = reactive({
			currentValue: props.modelValue,
			userInput: null
		});
		const { formItem } = useFormItem();
		const minDisabled = computed(() => isNumber(props.modelValue) && props.modelValue <= props.min);
		const maxDisabled = computed(() => isNumber(props.modelValue) && props.modelValue >= props.max);
		const numPrecision = computed(() => {
			const stepPrecision = getPrecision(props.step);
			if (!isUndefined(props.precision)) {
				if (stepPrecision > props.precision) debugWarn("InputNumber", "precision should not be less than the decimal places of step");
				return props.precision;
			} else return Math.max(getPrecision(props.modelValue), stepPrecision);
		});
		const controlsAtRight = computed(() => {
			return props.controls && props.controlsPosition === "right";
		});
		const inputNumberSize = useFormSize();
		const inputNumberDisabled = useFormDisabled();
		const displayValue = computed(() => {
			if (data.userInput !== null) return data.userInput;
			let currentValue = data.currentValue;
			if (isNil(currentValue)) return "";
			if (isNumber(currentValue)) {
				if (Number.isNaN(currentValue)) return "";
				if (!isUndefined(props.precision)) currentValue = currentValue.toFixed(props.precision);
			}
			return currentValue;
		});
		const toPrecision = (num, pre) => {
			if (isUndefined(pre)) pre = numPrecision.value;
			if (pre === 0) return Math.round(num);
			let snum = String(num);
			const pointPos = snum.indexOf(".");
			if (pointPos === -1) return num;
			if (!snum.replace(".", "").split("")[pointPos + pre]) return num;
			const length = snum.length;
			if (snum.charAt(length - 1) === "5") snum = `${snum.slice(0, Math.max(0, length - 1))}6`;
			return Number.parseFloat(Number(snum).toFixed(pre));
		};
		const getPrecision = (value) => {
			if (isNil(value)) return 0;
			const valueString = value.toString();
			const dotPosition = valueString.indexOf(".");
			let precision = 0;
			if (dotPosition !== -1) precision = valueString.length - dotPosition - 1;
			return precision;
		};
		const ensurePrecision = (val, coefficient = 1) => {
			if (!isNumber(val)) return data.currentValue;
			if (val >= Number.MAX_SAFE_INTEGER && coefficient === 1) {
				debugWarn("InputNumber", "The value has reached the maximum safe integer limit.");
				return val;
			} else if (val <= Number.MIN_SAFE_INTEGER && coefficient === -1) {
				debugWarn("InputNumber", "The value has reached the minimum safe integer limit.");
				return val;
			}
			return toPrecision(val + props.step * coefficient);
		};
		const handleKeydown = (event) => {
			const code = getEventCode(event);
			const key = getEventKey(event);
			if (props.disabledScientific && ["e", "E"].includes(key)) {
				event.preventDefault();
				return;
			}
			switch (code) {
				case EVENT_CODE.up:
					event.preventDefault();
					increase();
					break;
				case EVENT_CODE.down:
					event.preventDefault();
					decrease();
			}
		};
		const increase = () => {
			if (props.readonly || inputNumberDisabled.value || maxDisabled.value) return;
			setCurrentValue(ensurePrecision(Number(displayValue.value) || 0));
			emit(INPUT_EVENT, data.currentValue);
			setCurrentValueToModelValue();
		};
		const decrease = () => {
			if (props.readonly || inputNumberDisabled.value || minDisabled.value) return;
			setCurrentValue(ensurePrecision(Number(displayValue.value) || 0, -1));
			emit(INPUT_EVENT, data.currentValue);
			setCurrentValueToModelValue();
		};
		const verifyValue = (value, update) => {
			const { max, min, step, precision, stepStrictly, valueOnClear } = props;
			if (max < min) throwError("InputNumber", "min should not be greater than max.");
			let newVal = !value ? Number(value) : Number.parseFloat(String(value));
			if (isNil(value) || Number.isNaN(newVal)) return null;
			if (value === "") {
				if (valueOnClear === null) return null;
				newVal = isString(valueOnClear) ? {
					min,
					max
				}[valueOnClear] : valueOnClear;
			}
			if (stepStrictly) {
				newVal = toPrecision(Math.round(toPrecision(newVal / step)) * step, precision);
				if (newVal !== value) update && emit("update:modelValue", newVal);
			}
			if (!isUndefined(precision)) newVal = toPrecision(newVal, precision);
			if (newVal > max || newVal < min) {
				newVal = newVal > max ? max : min;
				update && emit("update:modelValue", newVal);
			}
			return newVal;
		};
		const setCurrentValue = (value, emitChange = true) => {
			const oldVal = data.currentValue;
			const newVal = verifyValue(value);
			if (!emitChange) {
				emit(UPDATE_MODEL_EVENT, newVal);
				return;
			}
			data.userInput = null;
			if (oldVal === newVal && value) return;
			emit(UPDATE_MODEL_EVENT, newVal);
			if (oldVal !== newVal) emit(CHANGE_EVENT, newVal, oldVal);
			if (props.validateEvent) formItem?.validate?.("change").catch(NOOP);
			data.currentValue = newVal;
		};
		const handleInput = (value) => {
			data.userInput = value;
			let newVal = value === "" ? null : Number.parseFloat(value);
			if (Number.isNaN(newVal)) newVal = null;
			emit(INPUT_EVENT, newVal);
			setCurrentValue(newVal, false);
		};
		const handleInputChange = (value) => {
			const newVal = value !== "" ? Number.parseFloat(value) : "";
			if (isNumber(newVal) && !Number.isNaN(newVal) || props.formatter && Number.isNaN(newVal) || newVal === "") setCurrentValue(newVal);
			setCurrentValueToModelValue();
			data.userInput = null;
		};
		const focus = () => {
			input.value?.focus?.();
		};
		const blur = () => {
			input.value?.blur?.();
		};
		const handleFocus = (event) => {
			emit("focus", event);
		};
		const handleBlur = (event) => {
			data.userInput = null;
			if (data.currentValue === null && input.value?.input) input.value.input.value = props.formatter?.("") ?? "";
			emit("blur", event);
			if (props.validateEvent) formItem?.validate?.("blur").catch(NOOP);
		};
		const setCurrentValueToModelValue = () => {
			if (data.currentValue !== props.modelValue) data.currentValue = props.modelValue;
		};
		const handleWheel = (e) => {
			if (document.activeElement === e.target) e.preventDefault();
		};
		watch(() => props.modelValue, (value, oldValue) => {
			const newValue = verifyValue(value, true);
			if (data.userInput === null && newValue !== oldValue) data.currentValue = newValue;
		}, { immediate: true });
		watch(() => props.precision, () => {
			data.currentValue = verifyValue(props.modelValue);
		});
		onMounted(() => {
			const { min, max, modelValue } = props;
			const innerInput = input.value?.input;
			innerInput.setAttribute("role", "spinbutton");
			if (Number.isFinite(max)) innerInput.setAttribute("aria-valuemax", String(max));
			else innerInput.removeAttribute("aria-valuemax");
			if (Number.isFinite(min)) innerInput.setAttribute("aria-valuemin", String(min));
			else innerInput.removeAttribute("aria-valuemin");
			innerInput.setAttribute("aria-valuenow", data.currentValue || data.currentValue === 0 ? String(data.currentValue) : "");
			innerInput.setAttribute("aria-disabled", String(inputNumberDisabled.value));
			if (!isNumber(modelValue) && modelValue != null) {
				let val = Number(modelValue);
				if (Number.isNaN(val)) val = null;
				emit(UPDATE_MODEL_EVENT, val);
			}
			innerInput.addEventListener("wheel", handleWheel, { passive: false });
		});
		onUpdated(() => {
			(input.value?.input)?.setAttribute("aria-valuenow", `${data.currentValue ?? ""}`);
		});
		__expose({
			/** @description get focus the input component */
			focus,
			/** @description remove focus the input component */
			blur
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([
					unref(ns).b(),
					unref(ns).m(unref(inputNumberSize)),
					unref(ns).is("disabled", unref(inputNumberDisabled)),
					unref(ns).is("without-controls", !__props.controls),
					unref(ns).is("controls-right", controlsAtRight.value),
					unref(ns).is(__props.align, !!__props.align)
				]),
				onDragstart: _cache[0] || (_cache[0] = withModifiers(() => {}, ["prevent"]))
			}, [
				__props.controls ? withDirectives((openBlock(), createElementBlock("span", {
					key: 0,
					role: "button",
					"aria-label": unref(t)("el.inputNumber.decrease"),
					class: normalizeClass([unref(ns).e("decrease"), unref(ns).is("disabled", minDisabled.value)]),
					onKeydown: withKeys(decrease, ["enter"])
				}, [renderSlot(_ctx.$slots, "decrease-icon", {}, () => [createVNode(unref(ElIcon), null, {
					default: withCtx(() => [controlsAtRight.value ? (openBlock(), createBlock(unref(arrow_down_default), { key: 0 })) : (openBlock(), createBlock(unref(minus_default), { key: 1 }))]),
					_: 1
				})])], 42, _hoisted_1)), [[unref(vRepeatClick), decrease]]) : createCommentVNode("v-if", true),
				__props.controls ? withDirectives((openBlock(), createElementBlock("span", {
					key: 1,
					role: "button",
					"aria-label": unref(t)("el.inputNumber.increase"),
					class: normalizeClass([unref(ns).e("increase"), unref(ns).is("disabled", maxDisabled.value)]),
					onKeydown: withKeys(increase, ["enter"])
				}, [renderSlot(_ctx.$slots, "increase-icon", {}, () => [createVNode(unref(ElIcon), null, {
					default: withCtx(() => [controlsAtRight.value ? (openBlock(), createBlock(unref(arrow_up_default), { key: 0 })) : (openBlock(), createBlock(unref(plus_default), { key: 1 }))]),
					_: 1
				})])], 42, _hoisted_2)), [[unref(vRepeatClick), increase]]) : createCommentVNode("v-if", true),
				createVNode(unref(ElInput), {
					id: __props.id,
					ref_key: "input",
					ref: input,
					type: __props.formatter ? "text" : "number",
					step: __props.step,
					"model-value": displayValue.value,
					placeholder: __props.placeholder,
					readonly: __props.readonly,
					disabled: unref(inputNumberDisabled),
					size: unref(inputNumberSize),
					max: __props.max,
					min: __props.min,
					name: __props.name,
					"aria-label": __props.ariaLabel,
					"validate-event": false,
					inputmode: __props.inputmode,
					formatter: __props.formatter,
					parser: __props.parser,
					tabindex: __props.tabindex,
					onKeydown: handleKeydown,
					onBlur: handleBlur,
					onFocus: handleFocus,
					onInput: handleInput,
					onChange: handleInputChange
				}, createSlots({ _: 2 }, [_ctx.$slots.prefix ? {
					name: "prefix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "prefix")]),
					key: "0"
				} : void 0, _ctx.$slots.suffix ? {
					name: "suffix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "suffix")]),
					key: "1"
				} : void 0]), 1032, [
					"id",
					"type",
					"step",
					"model-value",
					"placeholder",
					"readonly",
					"disabled",
					"size",
					"max",
					"min",
					"name",
					"aria-label",
					"inputmode",
					"formatter",
					"parser",
					"tabindex"
				])
			], 34);
		};
	}
}));
//#endregion
export { ElInputNumber as t };
