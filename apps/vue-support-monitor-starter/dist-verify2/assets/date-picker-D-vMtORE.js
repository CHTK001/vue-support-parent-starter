import { o as __toESM, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { $n as normalizeClass, An as NOOP, Bn as isFunction, D as createVNode, E as createTextVNode, En as toValue, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Lt as useSlots, Nt as useAttrs, On as unref, Rn as isArray, Tn as toRefs, Yt as withDirectives, Z as isVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, wn as toRef, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode, zn as isDate } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { n as flatten } from "./_flatRest-CP5Zoeqo.js";
import { t as debounce } from "./debounce-DfrQLO3V.js";
import { c as definePropType, d as isEmpty, f as isNumber, h as isUndefined, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as omit } from "./omit-nJwLfQRJ.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { r as useAttrs$1, t as ElInput } from "./input-Bbhiel27.js";
import { r as unrefElement, t as onClickOutside } from "./dist-Clzx2YUA.js";
import { i as hasClass, r as getStyle } from "./style-D30oR_2q.js";
import { n as rAF } from "./raf-Ck-OXP6t.js";
import { a as castArray, o as extractFirst, r as useTooltipContentProps, t as ElTooltip, u as Ee } from "./tooltip-DEX5DBfd.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { n as useFocusController } from "./use-composition-BHiYKdrO.js";
import { n as useEmptyValues, r as useEmptyValuesProps } from "./use-empty-values-B_20a6o3.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { M as d_arrow_right_default, S as clock_default, a as arrow_right_default, b as circle_close_default, d as calendar_default, i as arrow_left_default, j as d_arrow_left_default, o as arrow_up_default, r as arrow_down_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { n as useFormItemInputId, t as useFormItem } from "./use-form-item-D-dEMqBj.js";
import { t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as require_dayjs_min } from "./dayjs.min-DeZMAZuH.js";
import { t as ClickOutside } from "./click-outside-B3b0egMR.js";
import { t as vRepeatClick } from "./repeat-click-BFYhYwtQ.js";
import { n as require_customParseFormat, t as require_advancedFormat } from "./advancedFormat-Cu6D3d9S.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/constants/date.mjs
var datePickTypes = [
	"year",
	"years",
	"month",
	"months",
	"date",
	"dates",
	"week",
	"datetime",
	"datetimerange",
	"daterange",
	"monthrange",
	"yearrange"
];
var WEEK_DAYS = [
	"sun",
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/constants.mjs
var timeUnits = [
	"hours",
	"minutes",
	"seconds"
];
var PICKER_BASE_INJECTION_KEY = "EP_PICKER_BASE";
var PICKER_POPPER_OPTIONS_INJECTION_KEY = "ElPopperOptions";
var ROOT_COMMON_PICKER_INJECTION_KEY = Symbol("commonPickerContextKey");
var DEFAULT_FORMATS_TIME = "HH:mm:ss";
var DEFAULT_FORMATS_DATE = "YYYY-MM-DD";
var DEFAULT_FORMATS_DATEPICKER = {
	date: DEFAULT_FORMATS_DATE,
	dates: DEFAULT_FORMATS_DATE,
	week: "gggg[w]ww",
	year: "YYYY",
	years: "YYYY",
	month: "YYYY-MM",
	months: "YYYY-MM",
	datetime: `${DEFAULT_FORMATS_DATE} ${DEFAULT_FORMATS_TIME}`,
	monthrange: "YYYY-MM",
	yearrange: "YYYY",
	daterange: DEFAULT_FORMATS_DATE,
	datetimerange: `${DEFAULT_FORMATS_DATE} ${DEFAULT_FORMATS_TIME}`
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/utils.mjs
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min(), 1);
var buildTimeList = (value, bound) => {
	return [
		value > 0 ? value - 1 : void 0,
		value,
		value < bound ? value + 1 : void 0
	];
};
var rangeArr = (n) => Array.from(Array.from({ length: n }).keys());
var extractDateFormat = (format) => {
	return format.replace(/\W?m{1,2}|\W?ZZ/g, "").replace(/\W?h{1,2}|\W?s{1,3}|\W?a/gi, "").trim();
};
var extractTimeFormat = (format) => {
	return format.replace(/\W?D{1,2}|\W?Do|\W?d{1,4}|\W?M{1,4}|\W?Y{2,4}/g, "").trim();
};
var dateEquals = function(a, b) {
	const aIsDate = isDate(a);
	const bIsDate = isDate(b);
	if (aIsDate && bIsDate) return a.getTime() === b.getTime();
	if (!aIsDate && !bIsDate) return a === b;
	return false;
};
var valueEquals = function(a, b) {
	const aIsArray = isArray(a);
	const bIsArray = isArray(b);
	if (aIsArray && bIsArray) {
		if (a.length !== b.length) return false;
		return a.every((item, index) => dateEquals(item, b[index]));
	}
	if (!aIsArray && !bIsArray) return dateEquals(a, b);
	return false;
};
var parseDate = function(date, format, lang) {
	const day = isEmpty(format) || format === "x" ? (0, import_dayjs_min.default)(date).locale(lang) : (0, import_dayjs_min.default)(date, format).locale(lang);
	return day.isValid() ? day : void 0;
};
var formatter = function(date, format, lang) {
	if (isEmpty(format)) return date;
	if (format === "x") return +date;
	return (0, import_dayjs_min.default)(date).locale(lang).format(format);
};
var makeList = (total, method) => {
	const arr = [];
	const disabledArr = method?.();
	for (let i = 0; i < total; i++) arr.push(disabledArr?.includes(i) ?? false);
	return arr;
};
var dayOrDaysToDate = (dayOrDays) => {
	return isArray(dayOrDays) ? dayOrDays.map((d) => d.toDate()) : dayOrDays.toDate();
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/props/shared.mjs
var disabledTimeListsProps = buildProps({
	/**
	* @description To specify the array of hours that cannot be selected
	*/
	disabledHours: { type: definePropType(Function) },
	/**
	* @description To specify the array of minutes that cannot be selected
	*/
	disabledMinutes: { type: definePropType(Function) },
	/**
	* @description To specify the array of seconds that cannot be selected
	*/
	disabledSeconds: { type: definePropType(Function) }
});
var timePanelSharedProps = buildProps({
	visible: Boolean,
	actualVisible: {
		type: Boolean,
		default: void 0
	},
	format: {
		type: String,
		default: ""
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/common/props.mjs
var timePickerDefaultProps = buildProps({
	/**
	* @description this prop decides if the date picker panel pops up when the input is focused
	*/
	automaticDropdown: {
		type: Boolean,
		default: true
	},
	/**
	* @description same as `id` in native input
	*/
	id: { type: definePropType([Array, String]) },
	/**
	* @description same as `name` in native input
	*/
	name: { type: definePropType([Array, String]) },
	/**
	* @description custom class name for TimePicker's dropdown
	*/
	popperClass: useTooltipContentProps.popperClass,
	/**
	* @description custom style for TimePicker's dropdown
	*/
	popperStyle: useTooltipContentProps.popperStyle,
	/**
	* @description format of the displayed value in the input box
	*/
	format: String,
	/**
	* @description optional, format of binding value. If not specified, the binding value will be a Date object
	*/
	valueFormat: String,
	/**
	* @description optional, format of the date displayed in input's inner panel
	*/
	dateFormat: String,
	/**
	* @description optional, format of the time displayed in input's inner panel
	*/
	timeFormat: String,
	/**
	* @description type of the picker
	*/
	type: {
		type: String,
		default: ""
	},
	/**
	* @description whether to show clear button
	*/
	clearable: {
		type: Boolean,
		default: true
	},
	/**
	* @description Custom clear icon component
	*/
	clearIcon: {
		type: definePropType([String, Object]),
		default: circle_close_default
	},
	/**
	* @description whether the input is editable
	*/
	editable: {
		type: Boolean,
		default: true
	},
	/**
	* @description Whether to auto-fill the input with the current time on focus when no value is selected.
	*/
	saveOnBlur: {
		type: Boolean,
		default: true
	},
	/**
	* @description Custom prefix icon component
	*/
	prefixIcon: {
		type: definePropType([String, Object]),
		default: ""
	},
	/**
	* @description size of Input
	*/
	size: useSizeProp,
	/**
	* @description whether TimePicker is read only
	*/
	readonly: Boolean,
	/**
	* @description whether TimePicker is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description placeholder in non-range mode
	*/
	placeholder: {
		type: String,
		default: ""
	},
	/**
	* @description [popper.js](https://popper.js.org/docs/v2/) parameters
	*/
	popperOptions: {
		type: definePropType(Object),
		default: () => ({})
	},
	/**
	* @description binding value, if it is an array, the length should be 2
	*/
	modelValue: {
		type: definePropType([
			Date,
			Array,
			String,
			Number
		]),
		default: ""
	},
	/**
	* @description range separator
	*/
	rangeSeparator: {
		type: String,
		default: "-"
	},
	/**
	* @description placeholder for the start date in range mode
	*/
	startPlaceholder: String,
	/**
	* @description placeholder for the end date in range mode
	*/
	endPlaceholder: String,
	/**
	* @description optional, default date of the calendar
	*/
	defaultValue: { type: definePropType([Date, Array]) },
	/**
	* @description optional, the time value to use when selecting date range
	*/
	defaultTime: { type: definePropType([Date, Array]) },
	/**
	* @description whether to pick a time range
	*/
	isRange: Boolean,
	...disabledTimeListsProps,
	/**
	* @description a function determining if a date is disabled with that date as its parameter. Should return a Boolean
	*/
	disabledDate: { type: Function },
	/**
	* @description set custom className
	*/
	cellClassName: { type: Function },
	/**
	* @description an object array to set shortcut options
	*/
	shortcuts: {
		type: Array,
		default: () => []
	},
	/**
	* @description whether to pick time using arrow buttons
	*/
	arrowControl: Boolean,
	/**
	* @description input tabindex
	*/
	tabindex: {
		type: definePropType([String, Number]),
		default: 0
	},
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	/**
	* @description unlink two date-panels in range-picker
	*/
	unlinkPanels: Boolean,
	/**
	* @description show only one panel in range-picker
	*/
	singlePanel: Boolean,
	/**
	* @description position of dropdown
	*/
	placement: {
		type: definePropType(String),
		values: Ee,
		default: "bottom"
	},
	/**
	* @description list of possible positions for dropdown
	*/
	fallbackPlacements: {
		type: definePropType(Array),
		default: [
			"bottom",
			"top",
			"right",
			"left"
		]
	},
	...useEmptyValuesProps,
	...useAriaProps(["ariaLabel"]),
	/**
	* @description whether to show the now button
	*/
	showNow: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to show footer
	*/
	showConfirm: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to show footer
	*/
	showFooter: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to show the number of the calendar week
	*/
	showWeekNumber: Boolean
});
var timePickerRangeTriggerProps = buildProps({
	id: { type: definePropType(Array) },
	name: { type: definePropType(Array) },
	modelValue: { type: definePropType([Array, String]) },
	startPlaceholder: String,
	endPlaceholder: String,
	disabled: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/composables/use-common-picker.mjs
var useCommonPicker = (props, emit) => {
	const { lang } = useLocale();
	const pickerVisible = ref(false);
	const pickerActualVisible = ref(false);
	const userInput = ref(null);
	const valueIsEmpty = computed(() => {
		const { modelValue } = props;
		return !modelValue || isArray(modelValue) && !modelValue.filter(Boolean).length;
	});
	const emitInput = (input) => {
		if (!valueEquals(props.modelValue, input)) {
			let formatted;
			if (isArray(input)) formatted = input.map((item) => formatter(item, props.valueFormat, lang.value));
			else if (input) formatted = formatter(input, props.valueFormat, lang.value);
			emit(UPDATE_MODEL_EVENT, input ? formatted : input, lang.value);
		}
	};
	const parsedValue = computed(() => {
		let dayOrDays;
		if (valueIsEmpty.value) {
			if (pickerOptions.value.getDefaultValue) dayOrDays = pickerOptions.value.getDefaultValue();
		} else if (isArray(props.modelValue)) dayOrDays = props.modelValue.map((d) => parseDate(d, props.valueFormat, lang.value));
		else dayOrDays = parseDate(props.modelValue ?? "", props.valueFormat, lang.value);
		if (pickerOptions.value.getRangeAvailableTime) {
			const availableResult = pickerOptions.value.getRangeAvailableTime(dayOrDays);
			if (!isEqual(availableResult, dayOrDays)) {
				dayOrDays = availableResult;
				if (!valueIsEmpty.value) emitInput(dayOrDaysToDate(dayOrDays));
			}
		}
		if (isArray(dayOrDays) && dayOrDays.some((day) => !day)) dayOrDays = [];
		return dayOrDays;
	});
	const pickerOptions = ref({});
	const onSetPickerOption = (e) => {
		pickerOptions.value[e[0]] = e[1];
		pickerOptions.value.panelReady = true;
	};
	const onCalendarChange = (e) => {
		emit("calendar-change", e);
	};
	const onPanelChange = (value, mode, view) => {
		emit("panel-change", value, mode, view);
	};
	const onPick = (date = "", visible = false) => {
		pickerVisible.value = visible;
		let result;
		if (isArray(date)) result = date.map((_) => _.toDate());
		else result = date ? date.toDate() : date;
		userInput.value = null;
		emitInput(result);
	};
	return {
		parsedValue,
		pickerActualVisible,
		pickerOptions,
		pickerVisible,
		userInput,
		valueIsEmpty,
		emitInput,
		onCalendarChange,
		onPanelChange,
		onPick,
		onSetPickerOption
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/common/picker-range-trigger.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$8 = [
	"id",
	"name",
	"placeholder",
	"value",
	"disabled"
];
var _hoisted_2$8 = [
	"id",
	"name",
	"placeholder",
	"value",
	"disabled"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/common/picker-range-trigger.mjs
var picker_range_trigger_default = /* @__PURE__ */ defineComponent({
	name: "PickerRangeTrigger",
	inheritAttrs: false,
	__name: "picker-range-trigger",
	props: timePickerRangeTriggerProps,
	emits: [
		"mouseenter",
		"mouseleave",
		"click",
		"touchstart",
		"focus",
		"blur",
		"startInput",
		"endInput",
		"startChange",
		"endChange"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { formItem } = useFormItem();
		const { inputId } = useFormItemInputId(reactive({ id: computed(() => props.id?.[0]) }), { formItemContext: formItem });
		const attrs = useAttrs$1();
		const nsDate = useNamespace("date");
		const nsRange = useNamespace("range");
		const inputRef = ref();
		const endInputRef = ref();
		const { wrapperRef, isFocused } = useFocusController(inputRef, { disabled: computed(() => props.disabled) });
		const handleClick = (evt) => {
			emit("click", evt);
		};
		const handleMouseEnter = (evt) => {
			emit("mouseenter", evt);
		};
		const handleMouseLeave = (evt) => {
			emit("mouseleave", evt);
		};
		const handleTouchStart = (evt) => {
			emit("touchstart", evt);
		};
		const handleStartInput = (evt) => {
			emit("startInput", evt);
		};
		const handleEndInput = (evt) => {
			emit("endInput", evt);
		};
		const handleStartChange = (evt) => {
			emit("startChange", evt);
		};
		const handleEndChange = (evt) => {
			emit("endChange", evt);
		};
		const focus = () => {
			inputRef.value?.focus();
		};
		const blur = () => {
			inputRef.value?.blur();
			endInputRef.value?.blur();
		};
		__expose({
			focus,
			blur
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "wrapperRef",
				ref: wrapperRef,
				class: normalizeClass([unref(nsDate).is("active", unref(isFocused)), _ctx.$attrs.class]),
				style: normalizeStyle(_ctx.$attrs.style),
				onClick: handleClick,
				onMouseenter: handleMouseEnter,
				onMouseleave: handleMouseLeave,
				onTouchstartPassive: handleTouchStart
			}, [
				renderSlot(_ctx.$slots, "prefix"),
				createBaseVNode("input", mergeProps(unref(attrs), {
					id: unref(inputId),
					ref_key: "inputRef",
					ref: inputRef,
					name: _ctx.name && _ctx.name[0],
					placeholder: _ctx.startPlaceholder,
					value: _ctx.modelValue && _ctx.modelValue[0],
					class: unref(nsRange).b("input"),
					disabled: _ctx.disabled,
					onInput: handleStartInput,
					onChange: handleStartChange
				}), null, 16, _hoisted_1$8),
				renderSlot(_ctx.$slots, "range-separator"),
				createBaseVNode("input", mergeProps(unref(attrs), {
					id: _ctx.id && _ctx.id[1],
					ref_key: "endInputRef",
					ref: endInputRef,
					name: _ctx.name && _ctx.name[1],
					placeholder: _ctx.endPlaceholder,
					value: _ctx.modelValue && _ctx.modelValue[1],
					class: unref(nsRange).b("input"),
					disabled: _ctx.disabled,
					onInput: handleEndInput,
					onChange: handleEndChange
				}), null, 16, _hoisted_2$8),
				renderSlot(_ctx.$slots, "suffix")
			], 38);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/common/picker.mjs
var picker_default = /* @__PURE__ */ defineComponent({
	name: "Picker",
	__name: "picker",
	props: timePickerDefaultProps,
	emits: [
		UPDATE_MODEL_EVENT,
		CHANGE_EVENT,
		"focus",
		"blur",
		"clear",
		"calendar-change",
		"panel-change",
		"visible-change",
		"keydown"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const attrs = useAttrs();
		const nsDate = useNamespace("date");
		const nsInput = useNamespace("input");
		const nsRange = useNamespace("range");
		const { formItem } = useFormItem();
		const elPopperOptions = inject(PICKER_POPPER_OPTIONS_INJECTION_KEY, {});
		const emptyValues = useEmptyValues(props, null);
		const refPopper = ref();
		const inputRef = ref();
		const valueOnOpen = ref(null);
		let hasJustTabExitedInput = false;
		const pickerDisabled = useFormDisabled();
		const commonPicker = useCommonPicker(props, emit);
		const { parsedValue, pickerActualVisible, userInput, pickerVisible, pickerOptions, valueIsEmpty, emitInput, onPick, onSetPickerOption, onCalendarChange, onPanelChange } = commonPicker;
		const { isFocused, handleFocus, handleBlur } = useFocusController(inputRef, {
			disabled: pickerDisabled,
			beforeFocus() {
				return props.readonly;
			},
			afterFocus() {
				if (!props.automaticDropdown) return;
				pickerVisible.value = true;
			},
			beforeBlur(event) {
				return !hasJustTabExitedInput && refPopper.value?.isFocusInsideContent(event);
			},
			afterBlur() {
				if (isTimePicker.value && !props.saveOnBlur) {
					if (!valueIsEmpty.value) pickerOptions.value.handleCancel?.();
				} else handleChange();
				pickerVisible.value = false;
				hasJustTabExitedInput = false;
				props.validateEvent && formItem?.validate("blur").catch(NOOP);
			}
		});
		const hovering = ref(false);
		const rangeInputKls = computed(() => [
			nsDate.b("editor"),
			nsDate.bm("editor", props.type),
			nsInput.e("wrapper"),
			nsDate.is("disabled", pickerDisabled.value),
			nsDate.is("active", pickerVisible.value),
			nsRange.b("editor"),
			pickerSize ? nsRange.bm("editor", pickerSize.value) : "",
			attrs.class
		]);
		const clearIconKls = computed(() => [
			nsInput.e("icon"),
			nsRange.e("close-icon"),
			!showClearBtn.value ? nsRange.em("close-icon", "hidden") : ""
		]);
		watch(pickerVisible, (val) => {
			if (!val) {
				userInput.value = null;
				nextTick(() => {
					emitChange(props.modelValue);
				});
			} else nextTick(() => {
				if (val) valueOnOpen.value = props.modelValue;
			});
		});
		const emitChange = (val, isClear) => {
			if (isClear || !valueEquals(val, valueOnOpen.value)) {
				emit(CHANGE_EVENT, val);
				isClear && (valueOnOpen.value = val);
				props.validateEvent && formItem?.validate("change").catch(NOOP);
			}
		};
		const emitKeydown = (e) => {
			emit("keydown", e);
		};
		const refInput = computed(() => {
			if (inputRef.value) return Array.from(inputRef.value.$el.querySelectorAll("input"));
			return [];
		});
		const setSelectionRange = (start, end, pos) => {
			const _inputs = refInput.value;
			if (!_inputs.length) return;
			if (!pos || pos === "min") {
				_inputs[0].setSelectionRange(start, end);
				_inputs[0].focus();
			} else if (pos === "max") {
				_inputs[1].setSelectionRange(start, end);
				_inputs[1].focus();
			}
		};
		const onBeforeShow = () => {
			pickerActualVisible.value = true;
		};
		const onShow = () => {
			emit("visible-change", true);
		};
		const onHide = () => {
			pickerActualVisible.value = false;
			pickerVisible.value = false;
			emit("visible-change", false);
		};
		const handleOpen = () => {
			pickerVisible.value = true;
		};
		const handleClose = () => {
			pickerVisible.value = false;
		};
		const displayValue = computed(() => {
			const formattedValue = formatToString(parsedValue.value);
			if (isArray(userInput.value)) return [userInput.value[0] ?? (formattedValue && formattedValue[0]) ?? "", userInput.value[1] ?? (formattedValue && formattedValue[1]) ?? ""];
			else if (userInput.value !== null) return userInput.value;
			if (isTimePicker.value && valueIsEmpty.value && !props.saveOnBlur) return "";
			if (!isTimePicker.value && valueIsEmpty.value) return "";
			if (!pickerVisible.value && valueIsEmpty.value) return "";
			if (formattedValue) return isDatesPicker.value || isMonthsPicker.value || isYearsPicker.value ? formattedValue.join(", ") : formattedValue;
			return "";
		});
		const isTimeLikePicker = computed(() => props.type.includes("time"));
		const isTimePicker = computed(() => props.type.startsWith("time"));
		const isDatesPicker = computed(() => props.type === "dates");
		const isMonthsPicker = computed(() => props.type === "months");
		const isYearsPicker = computed(() => props.type === "years");
		const triggerIcon = computed(() => props.prefixIcon || (isTimeLikePicker.value ? clock_default : calendar_default));
		const showClearBtn = computed(() => props.clearable && !pickerDisabled.value && !props.readonly && !valueIsEmpty.value && (hovering.value || isFocused.value));
		const onClear = (event) => {
			if (props.readonly || pickerDisabled.value) return;
			if (showClearBtn.value) {
				event?.stopPropagation();
				if (pickerOptions.value.handleClear) pickerOptions.value.handleClear();
				else emitInput(emptyValues.valueOnClear.value);
				emitChange(emptyValues.valueOnClear.value, true);
				onHide();
			}
			emit("clear");
		};
		const onMouseDownInput = async (event) => {
			if (props.readonly || pickerDisabled.value) return;
			if (event.target?.tagName !== "INPUT" || isFocused.value || !props.automaticDropdown) pickerVisible.value = true;
		};
		const onMouseEnter = () => {
			if (props.readonly || pickerDisabled.value) return;
			if (!valueIsEmpty.value && props.clearable) hovering.value = true;
		};
		const onMouseLeave = () => {
			hovering.value = false;
		};
		const onTouchStartInput = (event) => {
			if (props.readonly || pickerDisabled.value) return;
			if (event.touches[0].target?.tagName !== "INPUT" || isFocused.value || !props.automaticDropdown) pickerVisible.value = true;
		};
		const isRangeInput = computed(() => {
			return props.type.includes("range");
		});
		const pickerSize = useFormSize();
		const popperEl = computed(() => unref(refPopper)?.popperRef?.contentRef);
		const stophandle = onClickOutside(inputRef, (e) => {
			const unrefedPopperEl = unref(popperEl);
			const inputEl = unrefElement(inputRef);
			if (unrefedPopperEl && (e.target === unrefedPopperEl || e.composedPath().includes(unrefedPopperEl)) || e.target === inputEl || inputEl && e.composedPath().includes(inputEl)) return;
			pickerVisible.value = false;
		});
		onBeforeUnmount(() => {
			stophandle?.();
		});
		const handleChange = () => {
			if (isTimePicker.value && !props.saveOnBlur) return;
			const isRangeEmpty = isArray(userInput.value) && userInput.value.every((v) => v === "");
			if (userInput.value && !isRangeEmpty) {
				const value = parseUserInputToDayjs(displayValue.value);
				if (value) {
					if (isValidValue(value)) emitInput(dayOrDaysToDate(value));
					userInput.value = null;
				}
			}
			if (userInput.value === "" || isRangeEmpty) {
				emitInput(emptyValues.valueOnClear.value);
				emitChange(emptyValues.valueOnClear.value, true);
				userInput.value = null;
			}
		};
		const parseUserInputToDayjs = (value) => {
			if (!value) return null;
			return pickerOptions.value.parseUserInput(value);
		};
		const formatToString = (value) => {
			if (!value) return null;
			return isArray(value) ? value.map((_) => _.format(props.format)) : value.format(props.format);
		};
		const isValidValue = (value) => {
			return pickerOptions.value.isValidValue(value);
		};
		const handleKeydownInput = async (event) => {
			if (props.readonly || pickerDisabled.value) return;
			const code = getEventCode(event);
			emitKeydown(event);
			if (code === EVENT_CODE.esc) {
				if (pickerVisible.value === true) {
					pickerVisible.value = false;
					event.preventDefault();
					event.stopPropagation();
				}
				return;
			}
			if (code === EVENT_CODE.down) {
				if (pickerOptions.value.handleFocusPicker) {
					event.preventDefault();
					event.stopPropagation();
				}
				if (pickerVisible.value === false) {
					pickerVisible.value = true;
					await nextTick();
				}
				if (pickerOptions.value.handleFocusPicker) {
					pickerOptions.value.handleFocusPicker();
					return;
				}
			}
			if (code === EVENT_CODE.tab) {
				hasJustTabExitedInput = true;
				return;
			}
			if (code === EVENT_CODE.enter || code === EVENT_CODE.numpadEnter) {
				if (!pickerVisible.value) pickerVisible.value = true;
				else if (userInput.value === null || userInput.value === "" || isValidValue(parseUserInputToDayjs(displayValue.value))) {
					handleChange();
					pickerVisible.value = false;
				}
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if (userInput.value) {
				event.stopPropagation();
				return;
			}
			if (pickerOptions.value.handleKeydownInput) pickerOptions.value.handleKeydownInput(event);
		};
		const onUserInput = (e) => {
			userInput.value = e;
			if (!pickerVisible.value) pickerVisible.value = true;
		};
		const handleStartInput = (event) => {
			const target = event.target;
			if (userInput.value) userInput.value = [target.value, userInput.value[1]];
			else userInput.value = [target.value, null];
		};
		const handleEndInput = (event) => {
			const target = event.target;
			if (userInput.value) userInput.value = [userInput.value[0], target.value];
			else userInput.value = [null, target.value];
		};
		const handleStartChange = () => {
			const values = userInput.value;
			const value = parseUserInputToDayjs(values && values[0]);
			const parsedVal = unref(parsedValue);
			if (value && value.isValid()) {
				userInput.value = [formatToString(value), displayValue.value?.[1] || null];
				const newValue = [value, parsedVal && (parsedVal[1] || null)];
				if (isValidValue(newValue)) {
					emitInput(dayOrDaysToDate(newValue));
					userInput.value = null;
				}
			}
		};
		const handleEndChange = () => {
			const values = unref(userInput);
			const value = parseUserInputToDayjs(values && values[1]);
			const parsedVal = unref(parsedValue);
			if (value && value.isValid()) {
				userInput.value = [unref(displayValue)?.[0] || null, formatToString(value)];
				const newValue = [parsedVal && parsedVal[0], value];
				if (isValidValue(newValue)) {
					emitInput(dayOrDaysToDate(newValue));
					userInput.value = null;
				}
			}
		};
		const focus = () => {
			inputRef.value?.focus();
		};
		const blur = () => {
			inputRef.value?.blur();
		};
		provide(PICKER_BASE_INJECTION_KEY, {
			props,
			emptyValues
		});
		provide(ROOT_COMMON_PICKER_INJECTION_KEY, commonPicker);
		__expose({
			/**
			* @description focus input box.
			*/
			focus,
			/**
			* @description blur input box.
			*/
			blur,
			/**
			* @description opens picker
			*/
			handleOpen,
			/**
			* @description closes picker
			*/
			handleClose,
			/**
			* @description pick item manually
			*/
			onPick
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElTooltip), mergeProps({
				ref_key: "refPopper",
				ref: refPopper,
				visible: unref(pickerVisible),
				effect: "light",
				pure: "",
				trigger: "click"
			}, _ctx.$attrs, {
				role: "dialog",
				teleported: "",
				transition: `${unref(nsDate).namespace.value}-zoom-in-top`,
				"popper-class": [`${unref(nsDate).namespace.value}-picker__popper`, _ctx.popperClass],
				"popper-style": _ctx.popperStyle,
				"popper-options": unref(elPopperOptions),
				"fallback-placements": _ctx.fallbackPlacements,
				"gpu-acceleration": false,
				placement: _ctx.placement,
				"stop-popper-mouse-event": false,
				"hide-after": 0,
				persistent: "",
				onBeforeShow,
				onShow,
				onHide
			}), {
				default: withCtx(() => [!isRangeInput.value ? (openBlock(), createBlock(unref(ElInput), {
					key: 0,
					id: _ctx.id,
					ref_key: "inputRef",
					ref: inputRef,
					"container-role": "combobox",
					"model-value": displayValue.value,
					name: _ctx.name,
					size: unref(pickerSize),
					disabled: unref(pickerDisabled),
					placeholder: _ctx.placeholder,
					class: normalizeClass([
						unref(nsDate).b("editor"),
						unref(nsDate).bm("editor", _ctx.type),
						unref(nsDate).is("focus", unref(pickerVisible)),
						_ctx.$attrs.class
					]),
					style: normalizeStyle(_ctx.$attrs.style),
					readonly: !_ctx.editable || _ctx.readonly || isDatesPicker.value || isMonthsPicker.value || isYearsPicker.value || _ctx.type === "week",
					"aria-label": _ctx.ariaLabel,
					tabindex: _ctx.tabindex,
					"validate-event": false,
					onInput: onUserInput,
					onFocus: unref(handleFocus),
					onBlur: unref(handleBlur),
					onKeydown: handleKeydownInput,
					onChange: handleChange,
					onMousedown: onMouseDownInput,
					onMouseenter: onMouseEnter,
					onMouseleave: onMouseLeave,
					onTouchstartPassive: onTouchStartInput,
					onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
				}, {
					prefix: withCtx(() => [triggerIcon.value ? (openBlock(), createBlock(unref(ElIcon), {
						key: 0,
						class: normalizeClass(unref(nsInput).e("icon")),
						onMousedown: withModifiers(onMouseDownInput, ["prevent"]),
						onTouchstartPassive: onTouchStartInput
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(triggerIcon.value)))]),
						_: 1
					}, 8, ["class"])) : createCommentVNode("v-if", true)]),
					suffix: withCtx(() => [showClearBtn.value && _ctx.clearIcon ? (openBlock(), createBlock(unref(ElIcon), {
						key: 0,
						class: normalizeClass(`${unref(nsInput).e("icon")} clear-icon`),
						onMousedown: withModifiers(unref(NOOP), ["prevent"]),
						onClick: onClear
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.clearIcon)))]),
						_: 1
					}, 8, ["class", "onMousedown"])) : createCommentVNode("v-if", true)]),
					_: 1
				}, 8, [
					"id",
					"model-value",
					"name",
					"size",
					"disabled",
					"placeholder",
					"class",
					"style",
					"readonly",
					"aria-label",
					"tabindex",
					"onFocus",
					"onBlur"
				])) : (openBlock(), createBlock(picker_range_trigger_default, {
					key: 1,
					id: _ctx.id,
					ref_key: "inputRef",
					ref: inputRef,
					"model-value": displayValue.value,
					name: _ctx.name,
					disabled: unref(pickerDisabled),
					readonly: !_ctx.editable || _ctx.readonly,
					"start-placeholder": _ctx.startPlaceholder,
					"end-placeholder": _ctx.endPlaceholder,
					class: normalizeClass(rangeInputKls.value),
					style: normalizeStyle(_ctx.$attrs.style),
					"aria-label": _ctx.ariaLabel,
					tabindex: _ctx.tabindex,
					autocomplete: "off",
					role: "combobox",
					onClick: onMouseDownInput,
					onFocus: unref(handleFocus),
					onBlur: unref(handleBlur),
					onStartInput: handleStartInput,
					onStartChange: handleStartChange,
					onEndInput: handleEndInput,
					onEndChange: handleEndChange,
					onMousedown: onMouseDownInput,
					onMouseenter: onMouseEnter,
					onMouseleave: onMouseLeave,
					onTouchstartPassive: onTouchStartInput,
					onKeydown: handleKeydownInput
				}, {
					prefix: withCtx(() => [triggerIcon.value ? (openBlock(), createBlock(unref(ElIcon), {
						key: 0,
						class: normalizeClass([unref(nsInput).e("icon"), unref(nsRange).e("icon")])
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(triggerIcon.value)))]),
						_: 1
					}, 8, ["class"])) : createCommentVNode("v-if", true)]),
					"range-separator": withCtx(() => [renderSlot(_ctx.$slots, "range-separator", {}, () => [createBaseVNode("span", { class: normalizeClass(unref(nsRange).b("separator")) }, toDisplayString(_ctx.rangeSeparator), 3)])]),
					suffix: withCtx(() => [_ctx.clearIcon ? (openBlock(), createBlock(unref(ElIcon), {
						key: 0,
						class: normalizeClass(clearIconKls.value),
						onMousedown: withModifiers(unref(NOOP), ["prevent"]),
						onClick: onClear
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.clearIcon)))]),
						_: 1
					}, 8, ["class", "onMousedown"])) : createCommentVNode("v-if", true)]),
					_: 3
				}, 8, [
					"id",
					"model-value",
					"name",
					"disabled",
					"readonly",
					"start-placeholder",
					"end-placeholder",
					"class",
					"style",
					"aria-label",
					"tabindex",
					"onFocus",
					"onBlur"
				]))]),
				content: withCtx(() => [renderSlot(_ctx.$slots, "default", {
					visible: unref(pickerVisible),
					actualVisible: unref(pickerActualVisible),
					parsedValue: unref(parsedValue),
					format: _ctx.format,
					dateFormat: _ctx.dateFormat,
					timeFormat: _ctx.timeFormat,
					unlinkPanels: _ctx.unlinkPanels,
					type: _ctx.type,
					defaultValue: _ctx.defaultValue,
					showNow: _ctx.showNow,
					showConfirm: _ctx.showConfirm,
					showFooter: _ctx.showFooter,
					showWeekNumber: _ctx.showWeekNumber,
					singlePanel: _ctx.singlePanel,
					onPick: _cache[1] || (_cache[1] = (...args) => unref(onPick) && unref(onPick)(...args)),
					onSelectRange: setSelectionRange,
					onSetPickerOption: _cache[2] || (_cache[2] = (...args) => unref(onSetPickerOption) && unref(onSetPickerOption)(...args)),
					onCalendarChange: _cache[3] || (_cache[3] = (...args) => unref(onCalendarChange) && unref(onCalendarChange)(...args)),
					onClear,
					onPanelChange: _cache[4] || (_cache[4] = (...args) => unref(onPanelChange) && unref(onPanelChange)(...args)),
					onMousedown: _cache[5] || (_cache[5] = withModifiers(() => {}, ["stop"]))
				})]),
				_: 3
			}, 16, [
				"visible",
				"transition",
				"popper-class",
				"popper-style",
				"popper-options",
				"fallback-placements",
				"placement"
			]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/props/panel-time-picker.mjs
var panelTimePickerProps = buildProps({
	...timePanelSharedProps,
	datetimeRole: String,
	parsedValue: { type: definePropType(Object) }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/composables/use-time-panel.mjs
var useTimePanel = ({ getAvailableHours, getAvailableMinutes, getAvailableSeconds }) => {
	const getAvailableTime = (date, role, first, compareDate) => {
		const availableTimeGetters = {
			hour: getAvailableHours,
			minute: getAvailableMinutes,
			second: getAvailableSeconds
		};
		let result = date;
		[
			"hour",
			"minute",
			"second"
		].forEach((type) => {
			if (availableTimeGetters[type]) {
				let availableTimeSlots;
				const method = availableTimeGetters[type];
				switch (type) {
					case "minute":
						availableTimeSlots = method(result.hour(), role, compareDate);
						break;
					case "second":
						availableTimeSlots = method(result.hour(), result.minute(), role, compareDate);
						break;
					default: availableTimeSlots = method(role, compareDate);
				}
				if (availableTimeSlots?.length && !availableTimeSlots.includes(result[type]())) {
					const pos = first ? 0 : availableTimeSlots.length - 1;
					result = result[type](availableTimeSlots[pos]);
				}
			}
		});
		return result;
	};
	const timePickerOptions = {};
	const onSetOption = ([key, val]) => {
		timePickerOptions[key] = val;
	};
	return {
		timePickerOptions,
		getAvailableTime,
		onSetOption
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/composables/use-time-picker.mjs
var makeAvailableArr = (disabledList) => {
	const trueOrNumber = (isDisabled, index) => isDisabled || index;
	const getNumber = (predicate) => predicate !== true;
	return disabledList.map(trueOrNumber).filter(getNumber);
};
var getTimeLists = (disabledHours, disabledMinutes, disabledSeconds) => {
	const getHoursList = (role, compare) => {
		return makeList(24, disabledHours && (() => disabledHours?.(role, compare)));
	};
	const getMinutesList = (hour, role, compare) => {
		return makeList(60, disabledMinutes && (() => disabledMinutes?.(hour, role, compare)));
	};
	const getSecondsList = (hour, minute, role, compare) => {
		return makeList(60, disabledSeconds && (() => disabledSeconds?.(hour, minute, role, compare)));
	};
	return {
		getHoursList,
		getMinutesList,
		getSecondsList
	};
};
var buildAvailableTimeSlotGetter = (disabledHours, disabledMinutes, disabledSeconds) => {
	const { getHoursList, getMinutesList, getSecondsList } = getTimeLists(disabledHours, disabledMinutes, disabledSeconds);
	const getAvailableHours = (role, compare) => {
		return makeAvailableArr(getHoursList(role, compare));
	};
	const getAvailableMinutes = (hour, role, compare) => {
		return makeAvailableArr(getMinutesList(hour, role, compare));
	};
	const getAvailableSeconds = (hour, minute, role, compare) => {
		return makeAvailableArr(getSecondsList(hour, minute, role, compare));
	};
	return {
		getAvailableHours,
		getAvailableMinutes,
		getAvailableSeconds
	};
};
var useOldValue = (props, options) => {
	const oldValue = ref(props.parsedValue);
	watch(() => props.visible, (val) => {
		const modelValue = toValue(options.modelValue);
		const valueOnClear = toValue(options.valueOnClear);
		if (val && modelValue === valueOnClear) {
			oldValue.value = valueOnClear;
			return;
		}
		if (!val) oldValue.value = props.parsedValue;
	});
	return oldValue;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/props/basic-time-spinner.mjs
var basicTimeSpinnerProps = buildProps({
	role: {
		type: String,
		required: true
	},
	spinnerDate: {
		type: definePropType(Object),
		required: true
	},
	showSeconds: {
		type: Boolean,
		default: true
	},
	arrowControl: Boolean,
	amPmMode: {
		type: definePropType(String),
		default: ""
	},
	...disabledTimeListsProps
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/time-picker-com/basic-time-spinner.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$7 = ["onClick"];
var _hoisted_2$7 = ["onMouseenter"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/time-picker-com/basic-time-spinner.mjs
var basic_time_spinner_default = /* @__PURE__ */ defineComponent({
	__name: "basic-time-spinner",
	props: basicTimeSpinnerProps,
	emits: [
		CHANGE_EVENT,
		"select-range",
		"set-option"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const { isRange, format, saveOnBlur } = inject(PICKER_BASE_INJECTION_KEY).props;
		const emit = __emit;
		const ns = useNamespace("time");
		const { getHoursList, getMinutesList, getSecondsList } = getTimeLists(props.disabledHours, props.disabledMinutes, props.disabledSeconds);
		let isScrolling = false;
		const ignoreScroll = {
			hours: false,
			minutes: false,
			seconds: false
		};
		const currentScrollbar = ref();
		const listRefsMap = {
			hours: ref(),
			minutes: ref(),
			seconds: ref()
		};
		const spinnerItems = computed(() => {
			return props.showSeconds ? timeUnits : timeUnits.slice(0, 2);
		});
		const timePartials = computed(() => {
			const { spinnerDate } = props;
			return {
				hours: spinnerDate.hour(),
				minutes: spinnerDate.minute(),
				seconds: spinnerDate.second()
			};
		});
		const timeList = computed(() => {
			const { hours, minutes } = unref(timePartials);
			const { role, spinnerDate } = props;
			const compare = !isRange ? spinnerDate : void 0;
			return {
				hours: getHoursList(role, compare),
				minutes: getMinutesList(hours, role, compare),
				seconds: getSecondsList(hours, minutes, role, compare)
			};
		});
		const arrowControlTimeList = computed(() => {
			const { hours, minutes, seconds } = unref(timePartials);
			return {
				hours: buildTimeList(hours, 23),
				minutes: buildTimeList(minutes, 59),
				seconds: buildTimeList(seconds, 59)
			};
		});
		const debouncedResetScroll = debounce((type) => {
			isScrolling = false;
			adjustCurrentSpinner(type);
		}, 200);
		const getAmPmFlag = (hour) => {
			if (!!!props.amPmMode) return "";
			const isCapital = props.amPmMode === "A";
			let content = hour < 12 ? " am" : " pm";
			if (isCapital) content = content.toUpperCase();
			return content;
		};
		const emitSelectRange = (type) => {
			let range = [0, 0];
			const actualFormat = format || "HH:mm:ss";
			const hourIndex = actualFormat.indexOf("HH");
			const minuteIndex = actualFormat.indexOf("mm");
			const secondIndex = actualFormat.indexOf("ss");
			switch (type) {
				case "hours":
					if (hourIndex !== -1) range = [hourIndex, hourIndex + 2];
					break;
				case "minutes":
					if (minuteIndex !== -1) range = [minuteIndex, minuteIndex + 2];
					break;
				case "seconds": if (secondIndex !== -1) range = [secondIndex, secondIndex + 2];
			}
			const [left, right] = range;
			emit("select-range", left, right);
			currentScrollbar.value = type;
		};
		const adjustCurrentSpinner = (type) => {
			adjustSpinner(type, unref(timePartials)[type]);
		};
		const adjustSpinners = () => {
			adjustCurrentSpinner("hours");
			adjustCurrentSpinner("minutes");
			adjustCurrentSpinner("seconds");
		};
		const getScrollbarElement = (el) => el.querySelector(`.${ns.namespace.value}-scrollbar__wrap`);
		const adjustSpinner = (type, value) => {
			if (props.arrowControl) return;
			const scrollbar = unref(listRefsMap[type]);
			if (scrollbar && scrollbar.$el) {
				if (!saveOnBlur) {
					ignoreScroll[type] = true;
					rAF(() => {
						ignoreScroll[type] = false;
					});
				}
				getScrollbarElement(scrollbar.$el).scrollTop = Math.max(0, value * typeItemHeight(type));
			}
		};
		const typeItemHeight = (type) => {
			const listItem = unref(listRefsMap[type])?.$el.querySelector("li");
			if (listItem) return Number.parseFloat(getStyle(listItem, "height")) || 0;
			return 0;
		};
		const onIncrement = () => {
			scrollDown(1);
		};
		const onDecrement = () => {
			scrollDown(-1);
		};
		const scrollDown = (step) => {
			if (!currentScrollbar.value) emitSelectRange("hours");
			const label = currentScrollbar.value;
			const now = unref(timePartials)[label];
			const next = findNextUnDisabled(label, now, step, currentScrollbar.value === "hours" ? 24 : 60);
			modifyDateField(label, next);
			adjustSpinner(label, next);
			nextTick(() => emitSelectRange(label));
		};
		const findNextUnDisabled = (type, now, step, total) => {
			let next = (now + step + total) % total;
			const list = unref(timeList)[type];
			while (list[next] && next !== now) next = (next + step + total) % total;
			return next;
		};
		const modifyDateField = (type, value) => {
			if (unref(timeList)[type][value]) return;
			const { hours, minutes, seconds } = unref(timePartials);
			let changeTo;
			switch (type) {
				case "hours":
					changeTo = props.spinnerDate.hour(value).minute(minutes).second(seconds);
					break;
				case "minutes":
					changeTo = props.spinnerDate.hour(hours).minute(value).second(seconds);
					break;
				case "seconds": changeTo = props.spinnerDate.hour(hours).minute(minutes).second(value);
			}
			emit(CHANGE_EVENT, changeTo);
		};
		const handleClick = (type, { value, disabled }) => {
			if (!disabled) {
				modifyDateField(type, value);
				emitSelectRange(type);
				adjustSpinner(type, value);
			}
		};
		const handleScroll = (type) => {
			if (!saveOnBlur && ignoreScroll[type]) return;
			const scrollbar = unref(listRefsMap[type]);
			if (!scrollbar) return;
			isScrolling = true;
			debouncedResetScroll(type);
			modifyDateField(type, Math.min(Math.round((getScrollbarElement(scrollbar.$el).scrollTop - (scrollBarHeight(type) * .5 - 10) / typeItemHeight(type) + 3) / typeItemHeight(type)), type === "hours" ? 23 : 59));
		};
		const scrollBarHeight = (type) => {
			return unref(listRefsMap[type]).$el.offsetHeight;
		};
		const bindScrollEvent = () => {
			const bindFunction = (type) => {
				const scrollbar = unref(listRefsMap[type]);
				if (scrollbar && scrollbar.$el) getScrollbarElement(scrollbar.$el).onscroll = () => {
					handleScroll(type);
				};
			};
			bindFunction("hours");
			bindFunction("minutes");
			bindFunction("seconds");
		};
		onMounted(() => {
			nextTick(() => {
				!props.arrowControl && bindScrollEvent();
				adjustSpinners();
				if (props.role === "start") emitSelectRange("hours");
			});
		});
		const setRef = (scrollbar, type) => {
			listRefsMap[type].value = scrollbar ?? void 0;
		};
		emit("set-option", [`${props.role}_scrollDown`, scrollDown]);
		emit("set-option", [`${props.role}_emitSelectRange`, emitSelectRange]);
		watch(() => props.spinnerDate, () => {
			if (isScrolling) return;
			adjustSpinners();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass([unref(ns).b("spinner"), { "has-seconds": _ctx.showSeconds }]) }, [!_ctx.arrowControl ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(spinnerItems.value, (item) => {
				return openBlock(), createBlock(unref(ElScrollbar), {
					key: item,
					ref_for: true,
					ref: (scrollbar) => setRef(scrollbar, item),
					class: normalizeClass(unref(ns).be("spinner", "wrapper")),
					"wrap-style": "max-height: inherit;",
					"view-class": unref(ns).be("spinner", "list"),
					noresize: "",
					tag: "ul",
					onMouseenter: ($event) => emitSelectRange(item),
					onMousemove: ($event) => adjustCurrentSpinner(item)
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(timeList.value[item], (disabled, key) => {
						return openBlock(), createElementBlock("li", {
							key,
							class: normalizeClass([
								unref(ns).be("spinner", "item"),
								unref(ns).is("active", key === timePartials.value[item]),
								unref(ns).is("disabled", disabled)
							]),
							onClick: ($event) => handleClick(item, {
								value: key,
								disabled
							})
						}, [item === "hours" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(toDisplayString(("0" + (_ctx.amPmMode ? key % 12 || 12 : key)).slice(-2)) + toDisplayString(getAmPmFlag(key)), 1)], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(("0" + key).slice(-2)), 1)], 64))], 10, _hoisted_1$7);
					}), 128))]),
					_: 2
				}, 1032, [
					"class",
					"view-class",
					"onMouseenter",
					"onMousemove"
				]);
			}), 128)) : createCommentVNode("v-if", true), _ctx.arrowControl ? (openBlock(true), createElementBlock(Fragment, { key: 1 }, renderList(spinnerItems.value, (item) => {
				return openBlock(), createElementBlock("div", {
					key: item,
					class: normalizeClass([unref(ns).be("spinner", "wrapper"), unref(ns).is("arrow")]),
					onMouseenter: ($event) => emitSelectRange(item)
				}, [
					withDirectives((openBlock(), createBlock(unref(ElIcon), { class: normalizeClass(["arrow-up", unref(ns).be("spinner", "arrow")]) }, {
						default: withCtx(() => [createVNode(unref(arrow_up_default))]),
						_: 1
					}, 8, ["class"])), [[unref(vRepeatClick), onDecrement]]),
					withDirectives((openBlock(), createBlock(unref(ElIcon), { class: normalizeClass(["arrow-down", unref(ns).be("spinner", "arrow")]) }, {
						default: withCtx(() => [createVNode(unref(arrow_down_default))]),
						_: 1
					}, 8, ["class"])), [[unref(vRepeatClick), onIncrement]]),
					createBaseVNode("ul", { class: normalizeClass(unref(ns).be("spinner", "list")) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(arrowControlTimeList.value[item], (time, key) => {
						return openBlock(), createElementBlock("li", {
							key,
							class: normalizeClass([
								unref(ns).be("spinner", "item"),
								unref(ns).is("active", time === timePartials.value[item]),
								unref(ns).is("disabled", timeList.value[item][time])
							])
						}, [unref(isNumber)(time) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [item === "hours" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createTextVNode(toDisplayString(("0" + (_ctx.amPmMode ? time % 12 || 12 : time)).slice(-2)) + toDisplayString(getAmPmFlag(time)), 1)], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createTextVNode(toDisplayString(("0" + time).slice(-2)), 1)], 64))], 64)) : createCommentVNode("v-if", true)], 2);
					}), 128))], 2)
				], 42, _hoisted_2$7);
			}), 128)) : createCommentVNode("v-if", true)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/time-picker-com/panel-time-pick.mjs
var panel_time_pick_default = /* @__PURE__ */ defineComponent({
	__name: "panel-time-pick",
	props: panelTimePickerProps,
	emits: [
		"pick",
		"select-range",
		"set-picker-option"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const pickerBase = inject(PICKER_BASE_INJECTION_KEY);
		const { arrowControl, disabledHours, disabledMinutes, disabledSeconds, defaultValue } = pickerBase.props;
		const { getAvailableHours, getAvailableMinutes, getAvailableSeconds } = buildAvailableTimeSlotGetter(disabledHours, disabledMinutes, disabledSeconds);
		const ns = useNamespace("time");
		const { t, lang } = useLocale();
		const selectionRange = ref([0, 2]);
		const oldValue = useOldValue(props, {
			modelValue: computed(() => pickerBase.props.modelValue),
			valueOnClear: computed(() => pickerBase?.emptyValues ? pickerBase.emptyValues.valueOnClear.value : null)
		});
		const transitionName = computed(() => {
			return isUndefined(props.actualVisible) ? `${ns.namespace.value}-zoom-in-top` : "";
		});
		const showSeconds = computed(() => {
			return props.format.includes("ss");
		});
		const amPmMode = computed(() => {
			if (props.format.includes("A")) return "A";
			if (props.format.includes("a")) return "a";
			return "";
		});
		const isValidValue = (_date) => {
			const parsedDate = (0, import_dayjs_min.default)(_date).locale(lang.value);
			const result = getRangeAvailableTime(parsedDate);
			return parsedDate.isSame(result);
		};
		const handleCancel = () => {
			const old = oldValue.value;
			emit("pick", old, false);
			nextTick(() => {
				oldValue.value = old;
			});
		};
		const handleConfirm = (visible = false, first = false) => {
			if (first) return;
			emit("pick", props.parsedValue, visible);
		};
		const handleChange = (_date) => {
			if (!props.visible) return;
			emit("pick", getRangeAvailableTime(_date).millisecond(0), true);
		};
		const setSelectionRange = (start, end) => {
			emit("select-range", start, end);
			selectionRange.value = [start, end];
		};
		const changeSelectionRange = (step) => {
			const actualFormat = props.format;
			const hourIndex = actualFormat.indexOf("HH");
			const minuteIndex = actualFormat.indexOf("mm");
			const secondIndex = actualFormat.indexOf("ss");
			const list = [];
			const mapping = [];
			if (hourIndex !== -1) {
				list.push(hourIndex);
				mapping.push("hours");
			}
			if (minuteIndex !== -1) {
				list.push(minuteIndex);
				mapping.push("minutes");
			}
			if (secondIndex !== -1 && showSeconds.value) {
				list.push(secondIndex);
				mapping.push("seconds");
			}
			const next = (list.indexOf(selectionRange.value[0]) + step + list.length) % list.length;
			timePickerOptions["start_emitSelectRange"](mapping[next]);
		};
		const handleKeydown = (event) => {
			const code = getEventCode(event);
			const { left, right, up, down } = EVENT_CODE;
			if ([left, right].includes(code)) {
				changeSelectionRange(code === left ? -1 : 1);
				event.preventDefault();
				return;
			}
			if ([up, down].includes(code)) {
				const step = code === up ? -1 : 1;
				timePickerOptions["start_scrollDown"](step);
				event.preventDefault();
				return;
			}
		};
		const { timePickerOptions, onSetOption, getAvailableTime } = useTimePanel({
			getAvailableHours,
			getAvailableMinutes,
			getAvailableSeconds
		});
		const getRangeAvailableTime = (date) => {
			return getAvailableTime(date, props.datetimeRole || "", true);
		};
		const parseUserInput = (value) => {
			if (!value) return null;
			return (0, import_dayjs_min.default)(value, props.format).locale(lang.value);
		};
		const getDefaultValue = () => {
			return (0, import_dayjs_min.default)(defaultValue).locale(lang.value);
		};
		emit("set-picker-option", ["isValidValue", isValidValue]);
		emit("set-picker-option", ["parseUserInput", parseUserInput]);
		emit("set-picker-option", ["handleKeydownInput", handleKeydown]);
		emit("set-picker-option", ["getRangeAvailableTime", getRangeAvailableTime]);
		emit("set-picker-option", ["getDefaultValue", getDefaultValue]);
		emit("set-picker-option", ["handleCancel", handleCancel]);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Transition, { name: transitionName.value }, {
				default: withCtx(() => [_ctx.actualVisible || _ctx.visible ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ns).b("panel"))
				}, [createBaseVNode("div", { class: normalizeClass([unref(ns).be("panel", "content"), { "has-seconds": showSeconds.value }]) }, [createVNode(basic_time_spinner_default, {
					ref: "spinner",
					role: _ctx.datetimeRole || "start",
					"arrow-control": unref(arrowControl),
					"show-seconds": showSeconds.value,
					"am-pm-mode": amPmMode.value,
					"spinner-date": _ctx.parsedValue,
					"disabled-hours": unref(disabledHours),
					"disabled-minutes": unref(disabledMinutes),
					"disabled-seconds": unref(disabledSeconds),
					onChange: handleChange,
					onSetOption: unref(onSetOption),
					onSelectRange: setSelectionRange
				}, null, 8, [
					"role",
					"arrow-control",
					"show-seconds",
					"am-pm-mode",
					"spinner-date",
					"disabled-hours",
					"disabled-minutes",
					"disabled-seconds",
					"onSetOption"
				])], 2), createBaseVNode("div", { class: normalizeClass(unref(ns).be("panel", "footer")) }, [createBaseVNode("button", {
					type: "button",
					class: normalizeClass([unref(ns).be("panel", "btn"), "cancel"]),
					onClick: handleCancel
				}, toDisplayString(unref(t)("el.datepicker.cancel")), 3), createBaseVNode("button", {
					type: "button",
					class: normalizeClass([unref(ns).be("panel", "btn"), "confirm"]),
					onClick: _cache[0] || (_cache[0] = ($event) => handleConfirm())
				}, toDisplayString(unref(t)("el.datepicker.confirm")), 3)], 2)], 2)) : createCommentVNode("v-if", true)]),
				_: 1
			}, 8, ["name"]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/localeData.js
var require_localeData = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(n, e) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : (n = "undefined" != typeof globalThis ? globalThis : n || self).dayjs_plugin_localeData = e();
	})(exports, (function() {
		"use strict";
		return function(n, e, t) {
			var r = e.prototype, o = function(n) {
				return n && (n.indexOf ? n : n.s);
			}, u = function(n, e, t, r, u) {
				var i = n.name ? n : n.$locale(), a = o(i[e]), s = o(i[t]), f = a || s.map((function(n) {
					return n.slice(0, r);
				}));
				if (!u) return f;
				var d = i.weekStart;
				return f.map((function(n, e) {
					return f[(e + (d || 0)) % 7];
				}));
			}, i = function() {
				return t.Ls[t.locale()];
			}, a = function(n, e) {
				return n.formats[e] || function(n) {
					return n.replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, (function(n, e, t) {
						return e || t.slice(1);
					}));
				}(n.formats[e.toUpperCase()]);
			}, s = function() {
				var n = this;
				return {
					months: function(e) {
						return e ? e.format("MMMM") : u(n, "months");
					},
					monthsShort: function(e) {
						return e ? e.format("MMM") : u(n, "monthsShort", "months", 3);
					},
					firstDayOfWeek: function() {
						return n.$locale().weekStart || 0;
					},
					weekdays: function(e) {
						return e ? e.format("dddd") : u(n, "weekdays");
					},
					weekdaysMin: function(e) {
						return e ? e.format("dd") : u(n, "weekdaysMin", "weekdays", 2);
					},
					weekdaysShort: function(e) {
						return e ? e.format("ddd") : u(n, "weekdaysShort", "weekdays", 3);
					},
					longDateFormat: function(e) {
						return a(n.$locale(), e);
					},
					meridiem: this.$locale().meridiem,
					ordinal: this.$locale().ordinal
				};
			};
			r.localeData = function() {
				return s.bind(this)();
			}, t.localeData = function() {
				var n = i();
				return {
					firstDayOfWeek: function() {
						return n.weekStart || 0;
					},
					weekdays: function() {
						return t.weekdays();
					},
					weekdaysShort: function() {
						return t.weekdaysShort();
					},
					weekdaysMin: function() {
						return t.weekdaysMin();
					},
					months: function() {
						return t.months();
					},
					monthsShort: function() {
						return t.monthsShort();
					},
					longDateFormat: function(e) {
						return a(n, e);
					},
					meridiem: n.meridiem,
					ordinal: n.ordinal
				};
			}, t.months = function() {
				return u(i(), "months");
			}, t.monthsShort = function() {
				return u(i(), "monthsShort", "months", 3);
			}, t.weekdays = function(n) {
				return u(i(), "weekdays", null, null, n);
			}, t.weekdaysShort = function(n) {
				return u(i(), "weekdaysShort", "weekdays", 3, n);
			}, t.weekdaysMin = function(n) {
				return u(i(), "weekdaysMin", "weekdays", 2, n);
			};
		};
	}));
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/date-picker-panel.mjs
var datePickerPanelProps = buildProps({
	/**
	* @description optional, format of binding value. If not specified, the binding value will be a Date object
	*/
	valueFormat: String,
	/**
	* @description optional, format of the date displayed in input's inner panel
	*/
	dateFormat: String,
	/**
	* @description optional, format of the time displayed in input's inner panel
	*/
	timeFormat: String,
	/**
	* @description whether picker is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description binding value, if it is an array, the length should be 2
	*/
	modelValue: {
		type: definePropType([
			Date,
			Array,
			String,
			Number
		]),
		default: ""
	},
	/**
	* @description optional, default date of the calendar
	*/
	defaultValue: { type: definePropType([Date, Array]) },
	/**
	* @description optional, the time value to use when selecting date range
	*/
	defaultTime: { type: definePropType([Date, Array]) },
	/**
	* @description whether to pick a time range
	*/
	isRange: Boolean,
	...disabledTimeListsProps,
	/**
	* @description a function determining if a date is disabled with that date as its parameter. Should return a Boolean
	*/
	disabledDate: { type: Function },
	/**
	* @description set custom className
	*/
	cellClassName: { type: Function },
	/**
	* @description an object array to set shortcut options
	*/
	shortcuts: {
		type: Array,
		default: () => []
	},
	/**
	* @description whether to pick time using arrow buttons
	*/
	arrowControl: Boolean,
	/**
	* @description unlink two date-panels in range-picker
	*/
	unlinkPanels: Boolean,
	/**
	* @description whether to show the now button
	*/
	showNow: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to show the confirm button
	*/
	showConfirm: Boolean,
	/**
	* @description whether to show footer
	*/
	showFooter: Boolean,
	/**
	* @description whether to show the number of the calendar week
	*/
	showWeekNumber: Boolean,
	/**
	* @description type of the picker
	*/
	type: {
		type: definePropType(String),
		default: "date"
	},
	/**
	* @description whether to show clear button in range mode
	*/
	clearable: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether the date picker is bordered
	*/
	border: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether the input is editable
	*/
	editable: {
		type: Boolean,
		default: true
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/constants.mjs
var ROOT_PICKER_INJECTION_KEY = Symbol("rootPickerContextKey");
var ROOT_PICKER_IS_DEFAULT_FORMAT_INJECTION_KEY = "ElIsDefaultFormat";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/shared.mjs
var selectionModes = [
	"date",
	"dates",
	"year",
	"years",
	"month",
	"months",
	"week",
	"range"
];
var datePickerSharedProps = buildProps({
	cellClassName: { type: definePropType(Function) },
	disabledDate: { type: definePropType(Function) },
	date: {
		type: definePropType(Object),
		required: true
	},
	minDate: { type: definePropType(Object) },
	maxDate: { type: definePropType(Object) },
	parsedValue: { type: definePropType([Object, Array]) },
	rangeState: {
		type: definePropType(Object),
		default: () => ({
			endDate: null,
			selecting: false
		})
	},
	disabled: Boolean
});
var panelSharedProps = buildProps({
	type: {
		type: definePropType(String),
		required: true,
		values: datePickTypes
	},
	dateFormat: String,
	timeFormat: String,
	showNow: {
		type: Boolean,
		default: true
	},
	showConfirm: Boolean,
	showFooter: {
		type: Boolean,
		default: true
	},
	showWeekNumber: Boolean,
	border: Boolean,
	disabled: Boolean,
	editable: {
		type: Boolean,
		default: true
	}
});
var panelRangeSharedProps = buildProps({
	unlinkPanels: Boolean,
	visible: {
		type: Boolean,
		default: true
	},
	showConfirm: Boolean,
	showFooter: {
		type: Boolean,
		default: true
	},
	border: Boolean,
	disabled: Boolean,
	parsedValue: { type: definePropType(Array) },
	singlePanel: Boolean
});
var selectionModeWithDefault = (mode) => {
	return {
		type: String,
		values: selectionModes,
		default: mode
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/panel-date-pick.mjs
var panelDatePickProps = buildProps({
	...panelSharedProps,
	parsedValue: { type: definePropType([Object, Array]) },
	visible: {
		type: Boolean,
		default: true
	},
	format: {
		type: String,
		default: ""
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/utils.mjs
var isValidRange = (range) => {
	if (!isArray(range)) return false;
	const [left, right] = range;
	return import_dayjs_min.default.isDayjs(left) && import_dayjs_min.default.isDayjs(right) && (0, import_dayjs_min.default)(left).isValid() && (0, import_dayjs_min.default)(right).isValid() && left.isSameOrBefore(right);
};
var getDefaultValue = (defaultValue, { lang, step = 1, unit, unlinkPanels }) => {
	let start;
	if (isArray(defaultValue)) {
		let [left, right] = defaultValue.map((d) => (0, import_dayjs_min.default)(d).locale(lang));
		if (!unlinkPanels) right = left.add(step, unit);
		return [left, right];
	} else if (defaultValue) start = (0, import_dayjs_min.default)(defaultValue);
	else start = (0, import_dayjs_min.default)();
	start = start.locale(lang);
	return [start, start.add(step, unit)];
};
var buildPickerTable = (dimension, rows, { columnIndexOffset, startDate, nextEndDate, now, unit, relativeDateGetter, setCellMetadata, setRowMetadata }) => {
	for (let rowIndex = 0; rowIndex < dimension.row; rowIndex++) {
		const row = rows[rowIndex];
		for (let columnIndex = 0; columnIndex < dimension.column; columnIndex++) {
			let cell = row[columnIndex + columnIndexOffset];
			if (!cell) cell = {
				row: rowIndex,
				column: columnIndex,
				type: "normal",
				inRange: false,
				start: false,
				end: false
			};
			const nextStartDate = relativeDateGetter(rowIndex * dimension.column + columnIndex);
			cell.dayjs = nextStartDate;
			cell.date = nextStartDate.toDate();
			cell.timestamp = nextStartDate.valueOf();
			cell.type = "normal";
			cell.inRange = !!(startDate && nextStartDate.isSameOrAfter(startDate, unit) && nextEndDate && nextStartDate.isSameOrBefore(nextEndDate, unit)) || !!(startDate && nextStartDate.isSameOrBefore(startDate, unit) && nextEndDate && nextStartDate.isSameOrAfter(nextEndDate, unit));
			if (startDate?.isSameOrAfter(nextEndDate)) {
				cell.start = !!nextEndDate && nextStartDate.isSame(nextEndDate, unit);
				cell.end = startDate && nextStartDate.isSame(startDate, unit);
			} else {
				cell.start = !!startDate && nextStartDate.isSame(startDate, unit);
				cell.end = !!nextEndDate && nextStartDate.isSame(nextEndDate, unit);
			}
			if (nextStartDate.isSame(now, unit)) cell.type = "today";
			setCellMetadata?.(cell, {
				rowIndex,
				columnIndex
			});
			row[columnIndex + columnIndexOffset] = cell;
		}
		setRowMetadata?.(row);
	}
};
var datesInMonth = (date, year, month, lang) => {
	const firstDay = (0, import_dayjs_min.default)().locale(lang).startOf("month").month(month).year(year).hour(date.hour()).minute(date.minute()).second(date.second());
	return rangeArr(firstDay.daysInMonth()).map((n) => firstDay.add(n, "day").toDate());
};
var getValidDateOfMonth = (date, year, month, lang, disabledDate) => {
	const _value = (0, import_dayjs_min.default)().year(year).month(month).startOf("month").hour(date.hour()).minute(date.minute()).second(date.second());
	const _date = datesInMonth(date, year, month, lang).find((date) => {
		return !disabledDate?.(date);
	});
	if (_date) return (0, import_dayjs_min.default)(_date).locale(lang);
	return _value.locale(lang);
};
var getValidDateOfYear = (value, lang, disabledDate) => {
	const year = value.year();
	if (!disabledDate?.(value.toDate())) return value.locale(lang);
	const month = value.month();
	if (!datesInMonth(value, year, month, lang).every(disabledDate)) return getValidDateOfMonth(value, year, month, lang, disabledDate);
	for (let i = 0; i < 12; i++) if (!datesInMonth(value, year, i, lang).every(disabledDate)) return getValidDateOfMonth(value, year, i, lang, disabledDate);
	return value;
};
var correctlyParseUserInput = (value, format, lang, defaultFormat) => {
	if (isArray(value)) return value.map((v) => correctlyParseUserInput(v, format, lang, defaultFormat));
	if (isString(value)) {
		const dayjsValue = defaultFormat?.value ? (0, import_dayjs_min.default)(value) : (0, import_dayjs_min.default)(value, format);
		if (!dayjsValue.isValid()) return dayjsValue;
	}
	return (0, import_dayjs_min.default)(value, format).locale(lang);
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/basic-date-table.mjs
var basicDateTableProps = buildProps({
	...datePickerSharedProps,
	showWeekNumber: Boolean,
	selectionMode: selectionModeWithDefault("date")
});
var basicDateTableEmits = [
	"changerange",
	"pick",
	"select"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/composables/use-basic-date-table.mjs
var isNormalDay = (type = "") => {
	return ["normal", "today"].includes(type);
};
var useBasicDateTable = (props, emit) => {
	const { lang } = useLocale();
	const tbodyRef = ref();
	const currentCellRef = ref();
	const lastRow = ref();
	const lastColumn = ref();
	const tableRows = ref([
		[],
		[],
		[],
		[],
		[],
		[]
	]);
	let focusWithClick = false;
	const firstDayOfWeek = props.date.$locale().weekStart || 7;
	const WEEKS_CONSTANT = props.date.locale("en").localeData().weekdaysShort().map((_) => _.toLowerCase());
	const offsetDay = computed(() => {
		return firstDayOfWeek > 3 ? 7 - firstDayOfWeek : -firstDayOfWeek;
	});
	const startDate = computed(() => {
		const startDayOfMonth = props.date.startOf("month");
		return startDayOfMonth.subtract(startDayOfMonth.day() || 7, "day");
	});
	const WEEKS = computed(() => {
		return WEEKS_CONSTANT.concat(WEEKS_CONSTANT).slice(firstDayOfWeek, firstDayOfWeek + 7);
	});
	const hasCurrent = computed(() => {
		return flatten(unref(rows)).some((row) => {
			return row.isCurrent;
		});
	});
	const days = computed(() => {
		const startOfMonth = props.date.startOf("month");
		return {
			startOfMonthDay: startOfMonth.day() || 7,
			dateCountOfMonth: startOfMonth.daysInMonth(),
			dateCountOfLastMonth: startOfMonth.subtract(1, "month").daysInMonth()
		};
	});
	const selectedDate = computed(() => {
		return props.selectionMode === "dates" ? castArray(props.parsedValue) : [];
	});
	const setDateText = (cell, { count, rowIndex, columnIndex }) => {
		const { startOfMonthDay, dateCountOfMonth, dateCountOfLastMonth } = unref(days);
		const offset = unref(offsetDay);
		if (rowIndex >= 0 && rowIndex <= 1) {
			const numberOfDaysFromPreviousMonth = startOfMonthDay + offset < 0 ? 7 + startOfMonthDay + offset : startOfMonthDay + offset;
			if (columnIndex + rowIndex * 7 >= numberOfDaysFromPreviousMonth) {
				cell.text = count;
				return true;
			} else {
				cell.text = dateCountOfLastMonth - (numberOfDaysFromPreviousMonth - columnIndex % 7) + 1 + rowIndex * 7;
				cell.type = "prev-month";
			}
		} else {
			if (count <= dateCountOfMonth) cell.text = count;
			else {
				cell.text = count - dateCountOfMonth;
				cell.type = "next-month";
			}
			return true;
		}
		return false;
	};
	const setCellMetadata = (cell, { columnIndex, rowIndex }, count) => {
		const { disabledDate, cellClassName } = props;
		const _selectedDate = unref(selectedDate);
		const shouldIncrement = setDateText(cell, {
			count,
			rowIndex,
			columnIndex
		});
		const cellDate = cell.dayjs.toDate();
		cell.selected = _selectedDate.find((d) => d.isSame(cell.dayjs, "day"));
		cell.isSelected = !!cell.selected;
		cell.isCurrent = isCurrent(cell);
		cell.disabled = disabledDate?.(cellDate);
		cell.customClass = cellClassName?.(cellDate);
		return shouldIncrement;
	};
	const setRowMetadata = (row) => {
		if (props.selectionMode === "week") {
			const [start, end] = props.showWeekNumber ? [1, 7] : [0, 6];
			const isActive = isWeekActive(row[start + 1]);
			row[start].inRange = isActive;
			row[start].start = isActive;
			row[end].inRange = isActive;
			row[end].end = isActive;
		}
	};
	const rows = computed(() => {
		const { minDate, maxDate, rangeState, showWeekNumber } = props;
		const offset = unref(offsetDay);
		const rows_ = unref(tableRows);
		const dateUnit = "day";
		let count = 1;
		buildPickerTable({
			row: 6,
			column: 7
		}, rows_, {
			startDate: minDate,
			columnIndexOffset: showWeekNumber ? 1 : 0,
			nextEndDate: rangeState.endDate || maxDate || rangeState.selecting && minDate || null,
			now: (0, import_dayjs_min.default)().locale(unref(lang)).startOf(dateUnit),
			unit: dateUnit,
			relativeDateGetter: (idx) => unref(startDate).add(idx - offset, dateUnit),
			setCellMetadata: (...args) => {
				if (setCellMetadata(...args, count)) count += 1;
			},
			setRowMetadata
		});
		if (showWeekNumber) {
			for (let rowIndex = 0; rowIndex < 6; rowIndex++) if (rows_[rowIndex][1].dayjs) rows_[rowIndex][0] = {
				type: "week",
				text: rows_[rowIndex][1].dayjs.week()
			};
		}
		return rows_;
	});
	watch(() => props.date, async () => {
		if (unref(tbodyRef)?.contains(document.activeElement)) {
			await nextTick();
			await focus();
		}
	});
	const focus = async () => unref(currentCellRef)?.focus();
	const isCurrent = (cell) => {
		return props.selectionMode === "date" && isNormalDay(cell.type) && cellMatchesDate(cell, props.parsedValue);
	};
	const cellMatchesDate = (cell, date) => {
		if (!date) return false;
		return (0, import_dayjs_min.default)(date).locale(unref(lang)).isSame(props.date.date(Number(cell.text)), "day");
	};
	const getDateOfCell = (row, column) => {
		const startOfMonthDay = unref(days).startOfMonthDay;
		const offset = unref(offsetDay);
		const numberOfDaysFromPreviousMonth = startOfMonthDay + offset < 0 ? 7 + startOfMonthDay + offset : startOfMonthDay + offset;
		const offsetFromStart = row * 7 + (column - (props.showWeekNumber ? 1 : 0));
		return props.date.startOf("month").subtract(numberOfDaysFromPreviousMonth, "day").add(offsetFromStart, "day");
	};
	const handleMouseMove = (event) => {
		if (!props.rangeState.selecting) return;
		let target = event.target;
		if (target.tagName === "SPAN") target = target.parentNode?.parentNode;
		if (target.tagName === "DIV") target = target.parentNode;
		if (target.tagName !== "TD") return;
		const row = target.parentNode.rowIndex - 1;
		const column = target.cellIndex;
		if (unref(rows)[row][column].disabled) return;
		if (row !== unref(lastRow) || column !== unref(lastColumn)) {
			lastRow.value = row;
			lastColumn.value = column;
			emit("changerange", {
				selecting: true,
				endDate: getDateOfCell(row, column)
			});
		}
	};
	const isSelectedCell = (cell) => {
		return !unref(hasCurrent) && cell?.text === 1 && isNormalDay(cell.type) || cell.isCurrent;
	};
	const handleFocus = (event) => {
		if (focusWithClick || unref(hasCurrent) || props.selectionMode !== "date") return;
		handlePickDate(event, true);
	};
	const handleMouseDown = (event) => {
		if (!event.target.closest("td")) return;
		focusWithClick = true;
	};
	const handleMouseUp = (event) => {
		if (!event.target.closest("td")) return;
		focusWithClick = false;
	};
	const handleRangePick = (newDate) => {
		if (!props.rangeState.selecting || !props.minDate) {
			emit("pick", {
				minDate: newDate,
				maxDate: null
			});
			emit("select", true);
		} else {
			if (newDate >= props.minDate) emit("pick", {
				minDate: props.minDate,
				maxDate: newDate
			});
			else emit("pick", {
				minDate: newDate,
				maxDate: props.minDate
			});
			emit("select", false);
		}
	};
	const handleWeekPick = (newDate) => {
		const weekNumber = newDate.week();
		const value = `${newDate.year()}w${weekNumber}`;
		emit("pick", {
			year: newDate.year(),
			week: weekNumber,
			value,
			date: newDate.startOf("week")
		});
	};
	const handleDatesPick = (newDate, selected) => {
		emit("pick", selected ? castArray(props.parsedValue).filter((d) => d?.valueOf() !== newDate.valueOf()) : castArray(props.parsedValue).concat([newDate]));
	};
	const handlePickDate = (event, isKeyboardMovement = false) => {
		if (props.disabled) return;
		const target = event.target.closest("td");
		if (!target) return;
		const row = target.parentNode.rowIndex - 1;
		const column = target.cellIndex;
		const cell = unref(rows)[row][column];
		if (cell.disabled || cell.type === "week") return;
		const newDate = getDateOfCell(row, column);
		switch (props.selectionMode) {
			case "range":
				handleRangePick(newDate);
				break;
			case "date":
				emit("pick", newDate, isKeyboardMovement);
				break;
			case "week":
				handleWeekPick(newDate);
				break;
			case "dates": handleDatesPick(newDate, !!cell.selected);
		}
	};
	const isWeekActive = (cell) => {
		if (props.selectionMode !== "week") return false;
		let newDate = props.date.startOf("day");
		if (cell.type === "prev-month") newDate = newDate.subtract(1, "month");
		if (cell.type === "next-month") newDate = newDate.add(1, "month");
		newDate = newDate.date(Number.parseInt(cell.text, 10));
		if (props.parsedValue && !isArray(props.parsedValue)) {
			const dayOffset = (props.parsedValue.day() - firstDayOfWeek + 7) % 7 - 1;
			return props.parsedValue.subtract(dayOffset, "day").isSame(newDate, "day");
		}
		return false;
	};
	return {
		WEEKS,
		rows,
		tbodyRef,
		currentCellRef,
		focus,
		isCurrent,
		isWeekActive,
		isSelectedCell,
		handlePickDate,
		handleMouseUp,
		handleMouseDown,
		handleMouseMove,
		handleFocus
	};
};
var useBasicDateTableDOM = (props, { isCurrent, isWeekActive }) => {
	const ns = useNamespace("date-table");
	const { t } = useLocale();
	const tableKls = computed(() => [ns.b(), ns.is("week-mode", props.selectionMode === "week" && !props.disabled)]);
	const tableLabel = computed(() => t("el.datepicker.dateTablePrompt"));
	const getCellClasses = (cell) => {
		const classes = [];
		if (isNormalDay(cell.type) && !cell.disabled) {
			classes.push("available");
			if (cell.type === "today") classes.push("today");
		} else classes.push(cell.type);
		if (isCurrent(cell)) classes.push("current");
		if (cell.inRange && (isNormalDay(cell.type) || props.selectionMode === "week")) {
			classes.push("in-range");
			if (cell.start) classes.push("start-date");
			if (cell.end) classes.push("end-date");
		}
		if (cell.disabled || props.disabled) classes.push("disabled");
		if (cell.selected) classes.push("selected");
		if (cell.customClass) classes.push(cell.customClass);
		return classes.join(" ");
	};
	const getRowKls = (cell) => [ns.e("row"), { current: isWeekActive(cell) }];
	return {
		tableKls,
		tableLabel,
		weekHeaderClass: ns.e("week-header"),
		getCellClasses,
		getRowKls,
		t
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/basic-cell.mjs
var basicCellProps = buildProps({ cell: { type: definePropType(Object) } });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-cell-render.mjs
var basic_cell_render_default = /* @__PURE__ */ defineComponent({
	name: "ElDatePickerCell",
	props: basicCellProps,
	setup(props) {
		const ns = useNamespace("date-table-cell");
		const { slots } = inject(ROOT_PICKER_INJECTION_KEY);
		return () => {
			const { cell } = props;
			return renderSlot(slots, "default", { ...cell }, () => [createVNode("div", { "class": ns.b() }, [createVNode("span", { "class": ns.e("text") }, [cell?.renderText ?? cell?.text])])]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-date-table.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$6 = ["aria-label"];
var _hoisted_2$6 = ["aria-label"];
var _hoisted_3$4 = [
	"aria-current",
	"aria-selected",
	"tabindex",
	"aria-disabled"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-date-table.mjs
var basic_date_table_default = /* @__PURE__ */ defineComponent({
	__name: "basic-date-table",
	props: basicDateTableProps,
	emits: basicDateTableEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const { WEEKS, rows, tbodyRef, currentCellRef, focus, isCurrent, isWeekActive, isSelectedCell, handlePickDate, handleMouseUp, handleMouseDown, handleMouseMove, handleFocus } = useBasicDateTable(props, __emit);
		const { tableLabel, tableKls, getCellClasses, getRowKls, weekHeaderClass, t } = useBasicDateTableDOM(props, {
			isCurrent,
			isWeekActive
		});
		let isUnmounting = false;
		onBeforeUnmount(() => {
			isUnmounting = true;
		});
		__expose({ 
		/**
		* @description focus on current cell
		*/
focus });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("table", {
				"aria-label": unref(tableLabel),
				class: normalizeClass(unref(tableKls)),
				cellspacing: "0",
				cellpadding: "0",
				role: "grid",
				onClick: _cache[1] || (_cache[1] = (...args) => unref(handlePickDate) && unref(handlePickDate)(...args)),
				onMousemove: _cache[2] || (_cache[2] = (...args) => unref(handleMouseMove) && unref(handleMouseMove)(...args)),
				onMousedown: _cache[3] || (_cache[3] = (...args) => unref(handleMouseDown) && unref(handleMouseDown)(...args)),
				onMouseup: _cache[4] || (_cache[4] = (...args) => unref(handleMouseUp) && unref(handleMouseUp)(...args))
			}, [createBaseVNode("tbody", {
				ref_key: "tbodyRef",
				ref: tbodyRef
			}, [createBaseVNode("tr", null, [_ctx.showWeekNumber ? (openBlock(), createElementBlock("th", {
				key: 0,
				scope: "col",
				class: normalizeClass(unref(weekHeaderClass))
			}, null, 2)) : createCommentVNode("v-if", true), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(WEEKS), (week, key) => {
				return openBlock(), createElementBlock("th", {
					key,
					"aria-label": unref(t)("el.datepicker.weeksFull." + week),
					scope: "col"
				}, toDisplayString(unref(t)("el.datepicker.weeks." + week)), 9, _hoisted_2$6);
			}), 128))]), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(rows), (row, rowKey) => {
				return openBlock(), createElementBlock("tr", {
					key: rowKey,
					class: normalizeClass(unref(getRowKls)(_ctx.showWeekNumber ? row[2] : row[1]))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(row, (cell, columnKey) => {
					return openBlock(), createElementBlock("td", {
						key: `${rowKey}.${columnKey}`,
						ref_for: true,
						ref: (el) => !unref(isUnmounting) && unref(isSelectedCell)(cell) && (currentCellRef.value = el),
						class: normalizeClass(unref(getCellClasses)(cell)),
						"aria-current": cell.isCurrent ? "date" : void 0,
						"aria-selected": cell.isCurrent,
						tabindex: _ctx.disabled ? void 0 : unref(isSelectedCell)(cell) ? 0 : -1,
						"aria-disabled": _ctx.disabled,
						onFocus: _cache[0] || (_cache[0] = (...args) => unref(handleFocus) && unref(handleFocus)(...args))
					}, [createVNode(unref(basic_cell_render_default), { cell }, null, 8, ["cell"])], 42, _hoisted_3$4);
				}), 128))], 2);
			}), 128))], 512)], 42, _hoisted_1$6);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/basic-month-table.mjs
var basicMonthTableProps = buildProps({
	...datePickerSharedProps,
	selectionMode: selectionModeWithDefault("month")
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-month-table.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$5 = ["aria-label"];
var _hoisted_2$5 = [
	"aria-selected",
	"aria-label",
	"tabindex",
	"onKeydown"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-month-table.mjs
var basic_month_table_default = /* @__PURE__ */ defineComponent({
	__name: "basic-month-table",
	props: basicMonthTableProps,
	emits: [
		"changerange",
		"pick",
		"select"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("month-table");
		const { t, lang } = useLocale();
		const tbodyRef = ref();
		const currentCellRef = ref();
		const months = ref(props.date.locale("en").localeData().monthsShort().map((_) => _.toLowerCase()));
		const tableRows = ref([
			[],
			[],
			[]
		]);
		const lastRow = ref();
		const lastColumn = ref();
		const rows = computed(() => {
			const rows = tableRows.value;
			const now = (0, import_dayjs_min.default)().locale(lang.value).startOf("month");
			for (let i = 0; i < 3; i++) {
				const row = rows[i];
				for (let j = 0; j < 4; j++) {
					const cell = row[j] ||= {
						row: i,
						column: j,
						type: "normal",
						inRange: false,
						start: false,
						end: false,
						text: -1,
						disabled: false,
						isSelected: false,
						customClass: void 0,
						date: void 0,
						dayjs: void 0,
						isCurrent: void 0,
						selected: void 0,
						renderText: void 0,
						timestamp: void 0
					};
					cell.type = "normal";
					const index = i * 4 + j;
					const calTime = props.date.startOf("year").month(index);
					const calEndDate = props.rangeState.endDate || props.maxDate || props.rangeState.selecting && props.minDate || null;
					cell.inRange = !!(props.minDate && calTime.isSameOrAfter(props.minDate, "month") && calEndDate && calTime.isSameOrBefore(calEndDate, "month")) || !!(props.minDate && calTime.isSameOrBefore(props.minDate, "month") && calEndDate && calTime.isSameOrAfter(calEndDate, "month"));
					if (props.minDate?.isSameOrAfter(calEndDate)) {
						cell.start = !!(calEndDate && calTime.isSame(calEndDate, "month"));
						cell.end = props.minDate && calTime.isSame(props.minDate, "month");
					} else {
						cell.start = !!(props.minDate && calTime.isSame(props.minDate, "month"));
						cell.end = !!(calEndDate && calTime.isSame(calEndDate, "month"));
					}
					if (now.isSame(calTime)) cell.type = "today";
					const cellDate = calTime.toDate();
					cell.text = index;
					cell.disabled = props.disabledDate?.(cellDate) || false;
					cell.date = cellDate;
					cell.customClass = props.cellClassName?.(cellDate);
					cell.dayjs = calTime;
					cell.timestamp = calTime.valueOf();
					cell.isSelected = isSelectedCell(cell);
				}
			}
			return rows;
		});
		const focus = () => {
			currentCellRef.value?.focus();
		};
		const getCellStyle = (cell) => {
			const style = {};
			const year = props.date.year();
			const today = /* @__PURE__ */ new Date();
			const month = cell.text;
			style.disabled = props.disabled || (props.disabledDate ? datesInMonth(props.date, year, month, lang.value).every(props.disabledDate) : false);
			style.current = castArray(props.parsedValue).some((date) => import_dayjs_min.default.isDayjs(date) && date.year() === year && date.month() === month);
			style.today = today.getFullYear() === year && today.getMonth() === month;
			if (cell.customClass) style[cell.customClass] = true;
			if (cell.inRange) {
				style["in-range"] = true;
				if (cell.start) style["start-date"] = true;
				if (cell.end) style["end-date"] = true;
			}
			return style;
		};
		const isSelectedCell = (cell) => {
			const year = props.date.year();
			const month = cell.text;
			return castArray(props.date).some((date) => date.year() === year && date.month() === month);
		};
		const handleMouseMove = (event) => {
			if (!props.rangeState.selecting) return;
			let target = event.target;
			if (target.tagName === "SPAN") target = target.parentNode?.parentNode;
			if (target.tagName === "DIV") target = target.parentNode;
			if (target.tagName !== "TD") return;
			const row = target.parentNode.rowIndex;
			const column = target.cellIndex;
			if (rows.value[row][column].disabled) return;
			if (row !== lastRow.value || column !== lastColumn.value) {
				lastRow.value = row;
				lastColumn.value = column;
				emit("changerange", {
					selecting: true,
					endDate: props.date.startOf("year").month(row * 4 + column)
				});
			}
		};
		const handleMonthTableClick = (event) => {
			if (props.disabled) return;
			const target = event.target?.closest("td");
			if (target?.tagName !== "TD") return;
			if (hasClass(target, "disabled")) return;
			const column = target.cellIndex;
			const month = target.parentNode.rowIndex * 4 + column;
			const newDate = props.date.startOf("year").month(month);
			if (props.selectionMode === "months") {
				if (event.type === "keydown") {
					emit("pick", castArray(props.parsedValue), false);
					return;
				}
				const newMonth = getValidDateOfMonth(props.date, props.date.year(), month, lang.value, props.disabledDate);
				emit("pick", hasClass(target, "current") ? castArray(props.parsedValue).filter((d) => d?.year() !== newMonth.year() || d?.month() !== newMonth.month()) : castArray(props.parsedValue).concat([(0, import_dayjs_min.default)(newMonth)]));
			} else if (props.selectionMode === "range") if (!props.rangeState.selecting) {
				emit("pick", {
					minDate: newDate,
					maxDate: null
				});
				emit("select", true);
			} else {
				if (props.minDate && newDate >= props.minDate) emit("pick", {
					minDate: props.minDate,
					maxDate: newDate
				});
				else emit("pick", {
					minDate: newDate,
					maxDate: props.minDate
				});
				emit("select", false);
			}
			else emit("pick", month);
		};
		watch(() => props.date, async () => {
			if (tbodyRef.value?.contains(document.activeElement)) {
				await nextTick();
				currentCellRef.value?.focus();
			}
		});
		__expose({ 
		/**
		* @description focus current cell
		*/
focus });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("table", {
				role: "grid",
				"aria-label": unref(t)("el.datepicker.monthTablePrompt"),
				class: normalizeClass(unref(ns).b()),
				onClick: handleMonthTableClick,
				onMousemove: handleMouseMove
			}, [createBaseVNode("tbody", {
				ref_key: "tbodyRef",
				ref: tbodyRef
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(rows.value, (row, key) => {
				return openBlock(), createElementBlock("tr", { key }, [(openBlock(true), createElementBlock(Fragment, null, renderList(row, (cell, key_) => {
					return openBlock(), createElementBlock("td", {
						key: key_,
						ref_for: true,
						ref: (el) => cell.isSelected && (currentCellRef.value = el),
						class: normalizeClass(getCellStyle(cell)),
						"aria-selected": !!cell.isSelected,
						"aria-label": unref(t)(`el.datepicker.month${+cell.text + 1}`),
						tabindex: cell.isSelected ? 0 : -1,
						onKeydown: [withKeys(withModifiers(handleMonthTableClick, ["prevent", "stop"]), ["space"]), withKeys(withModifiers(handleMonthTableClick, ["prevent", "stop"]), ["enter"])]
					}, [createVNode(unref(basic_cell_render_default), { cell: {
						...cell,
						renderText: unref(t)("el.datepicker.months." + months.value[cell.text])
					} }, null, 8, ["cell"])], 42, _hoisted_2$5);
				}), 128))]);
			}), 128))], 512)], 42, _hoisted_1$5);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/basic-year-table.mjs
var basicYearTableProps = buildProps({
	...datePickerSharedProps,
	selectionMode: selectionModeWithDefault("year")
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-year-table.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$4 = ["aria-label"];
var _hoisted_2$4 = [
	"aria-selected",
	"aria-label",
	"tabindex",
	"onKeydown"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/basic-year-table.mjs
var basic_year_table_default = /* @__PURE__ */ defineComponent({
	__name: "basic-year-table",
	props: basicYearTableProps,
	emits: [
		"changerange",
		"pick",
		"select"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		const datesInYear = (year, lang) => {
			const firstDay = (0, import_dayjs_min.default)(String(year)).locale(lang).startOf("year");
			return rangeArr(firstDay.endOf("year").dayOfYear()).map((n) => firstDay.add(n, "day").toDate());
		};
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("year-table");
		const { t, lang } = useLocale();
		const tbodyRef = ref();
		const currentCellRef = ref();
		const startYear = computed(() => {
			return Math.floor(props.date.year() / 10) * 10;
		});
		const tableRows = ref([
			[],
			[],
			[]
		]);
		const lastRow = ref();
		const lastColumn = ref();
		const rows = computed(() => {
			const rows = tableRows.value;
			const now = (0, import_dayjs_min.default)().locale(lang.value).startOf("year");
			for (let i = 0; i < 3; i++) {
				const row = rows[i];
				for (let j = 0; j < 4; j++) {
					if (i * 4 + j >= 10) break;
					let cell = row[j];
					if (!cell) cell = {
						row: i,
						column: j,
						type: "normal",
						inRange: false,
						start: false,
						end: false,
						text: -1,
						disabled: false,
						isSelected: false,
						customClass: void 0,
						date: void 0,
						dayjs: void 0,
						isCurrent: void 0,
						selected: void 0,
						renderText: void 0,
						timestamp: void 0
					};
					cell.type = "normal";
					const index = i * 4 + j + startYear.value;
					const calTime = (0, import_dayjs_min.default)().year(index);
					const calEndDate = props.rangeState.endDate || props.maxDate || props.rangeState.selecting && props.minDate || null;
					cell.inRange = !!(props.minDate && calTime.isSameOrAfter(props.minDate, "year") && calEndDate && calTime.isSameOrBefore(calEndDate, "year")) || !!(props.minDate && calTime.isSameOrBefore(props.minDate, "year") && calEndDate && calTime.isSameOrAfter(calEndDate, "year"));
					if (props.minDate?.isSameOrAfter(calEndDate)) {
						cell.start = !!(calEndDate && calTime.isSame(calEndDate, "year"));
						cell.end = !!(props.minDate && calTime.isSame(props.minDate, "year"));
					} else {
						cell.start = !!(props.minDate && calTime.isSame(props.minDate, "year"));
						cell.end = !!(calEndDate && calTime.isSame(calEndDate, "year"));
					}
					if (now.isSame(calTime)) cell.type = "today";
					cell.text = index;
					const cellDate = calTime.toDate();
					cell.disabled = props.disabledDate?.(cellDate) || false;
					cell.date = cellDate;
					cell.customClass = props.cellClassName?.(cellDate);
					cell.dayjs = calTime;
					cell.timestamp = calTime.valueOf();
					cell.isSelected = isSelectedCell(cell);
					row[j] = cell;
				}
			}
			return rows;
		});
		const focus = () => {
			currentCellRef.value?.focus();
		};
		const getCellKls = (cell) => {
			const kls = {};
			const today = (0, import_dayjs_min.default)().locale(lang.value);
			const year = cell.text;
			kls.disabled = props.disabled || (props.disabledDate ? datesInYear(year, lang.value).every(props.disabledDate) : false);
			kls.today = today.year() === year;
			kls.current = castArray(props.parsedValue).some((d) => d.year() === year);
			if (cell.customClass) kls[cell.customClass] = true;
			if (cell.inRange) {
				kls["in-range"] = true;
				if (cell.start) kls["start-date"] = true;
				if (cell.end) kls["end-date"] = true;
			}
			return kls;
		};
		const isSelectedCell = (cell) => {
			const year = cell.text;
			return castArray(props.date).some((date) => date.year() === year);
		};
		const handleYearTableClick = (event) => {
			if (props.disabled) return;
			const target = event.target?.closest("td");
			if (!target || !target.textContent || hasClass(target, "disabled")) return;
			const column = target.cellIndex;
			const selectedYear = target.parentNode.rowIndex * 4 + column + startYear.value;
			const newDate = (0, import_dayjs_min.default)().year(selectedYear);
			if (props.selectionMode === "range") if (!props.rangeState.selecting) {
				emit("pick", {
					minDate: newDate,
					maxDate: null
				});
				emit("select", true);
			} else {
				if (props.minDate && newDate >= props.minDate) emit("pick", {
					minDate: props.minDate,
					maxDate: newDate
				});
				else emit("pick", {
					minDate: newDate,
					maxDate: props.minDate
				});
				emit("select", false);
			}
			else if (props.selectionMode === "years") {
				if (event.type === "keydown") {
					emit("pick", castArray(props.parsedValue), false);
					return;
				}
				const vaildYear = getValidDateOfYear(newDate.startOf("year"), lang.value, props.disabledDate);
				emit("pick", hasClass(target, "current") ? castArray(props.parsedValue).filter((d) => d?.year() !== selectedYear) : castArray(props.parsedValue).concat([vaildYear]));
			} else emit("pick", selectedYear);
		};
		const handleMouseMove = (event) => {
			if (!props.rangeState.selecting) return;
			const target = event.target?.closest("td");
			if (!target) return;
			const row = target.parentNode.rowIndex;
			const column = target.cellIndex;
			if (rows.value[row][column].disabled) return;
			if (row !== lastRow.value || column !== lastColumn.value) {
				lastRow.value = row;
				lastColumn.value = column;
				emit("changerange", {
					selecting: true,
					endDate: (0, import_dayjs_min.default)().year(startYear.value).add(row * 4 + column, "year")
				});
			}
		};
		watch(() => props.date, async () => {
			if (tbodyRef.value?.contains(document.activeElement)) {
				await nextTick();
				currentCellRef.value?.focus();
			}
		});
		__expose({ 
		/**
		* @description focus on the current cell
		*/
focus });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("table", {
				role: "grid",
				"aria-label": unref(t)("el.datepicker.yearTablePrompt"),
				class: normalizeClass(unref(ns).b()),
				onClick: handleYearTableClick,
				onMousemove: handleMouseMove
			}, [createBaseVNode("tbody", {
				ref_key: "tbodyRef",
				ref: tbodyRef
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(rows.value, (row, rowKey) => {
				return openBlock(), createElementBlock("tr", { key: rowKey }, [(openBlock(true), createElementBlock(Fragment, null, renderList(row, (cell, cellKey) => {
					return openBlock(), createElementBlock("td", {
						key: `${rowKey}_${cellKey}`,
						ref_for: true,
						ref: (el) => cell.isSelected && (currentCellRef.value = el),
						class: normalizeClass(["available", getCellKls(cell)]),
						"aria-selected": cell.isSelected,
						"aria-label": String(cell.text),
						tabindex: cell.isSelected ? 0 : -1,
						onKeydown: [withKeys(withModifiers(handleYearTableClick, ["prevent", "stop"]), ["space"]), withKeys(withModifiers(handleYearTableClick, ["prevent", "stop"]), ["enter"])]
					}, [createVNode(unref(basic_cell_render_default), { cell }, null, 8, ["cell"])], 42, _hoisted_2$4);
				}), 128))]);
			}), 128))], 512)], 42, _hoisted_1$4);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-date-pick.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$3 = ["disabled", "onClick"];
var _hoisted_2$3 = ["aria-label", "disabled"];
var _hoisted_3$3 = ["aria-label", "disabled"];
var _hoisted_4$3 = ["tabindex", "aria-disabled"];
var _hoisted_5$3 = ["tabindex", "aria-disabled"];
var _hoisted_6$1 = ["aria-label", "disabled"];
var _hoisted_7$1 = ["aria-label", "disabled"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-date-pick.mjs
var panel_date_pick_default = /* @__PURE__ */ defineComponent({
	__name: "panel-date-pick",
	props: panelDatePickProps,
	emits: [
		"pick",
		"set-picker-option",
		"panel-change"
	],
	setup(__props, { emit: __emit }) {
		const timeWithinRange = (_, __, ___) => true;
		const props = __props;
		const contextEmit = __emit;
		const ppNs = useNamespace("picker-panel");
		const dpNs = useNamespace("date-picker");
		const attrs = useAttrs();
		const slots = useSlots();
		const { t, lang } = useLocale();
		const pickerBase = inject(PICKER_BASE_INJECTION_KEY);
		const isDefaultFormat = inject(ROOT_PICKER_IS_DEFAULT_FORMAT_INJECTION_KEY, void 0);
		const { shortcuts, disabledDate, cellClassName, defaultTime } = pickerBase.props;
		const defaultValue = toRef(pickerBase.props, "defaultValue");
		const currentViewRef = ref();
		const innerDate = ref((0, import_dayjs_min.default)().locale(lang.value));
		const isChangeToNow = ref(false);
		let isShortcut = false;
		const defaultTimeD = computed(() => {
			return (0, import_dayjs_min.default)(defaultTime).locale(lang.value);
		});
		const month = computed(() => {
			return innerDate.value.month();
		});
		const year = computed(() => {
			return innerDate.value.year();
		});
		const selectableRange = ref([]);
		const userInputDate = ref(null);
		const userInputTime = ref(null);
		const checkDateWithinRange = (date) => {
			return selectableRange.value.length > 0 ? timeWithinRange(date, selectableRange.value, props.format || "HH:mm:ss") : true;
		};
		const formatEmit = (emitDayjs) => {
			if (defaultTime && !visibleTime.value && !isChangeToNow.value && !isShortcut) return defaultTimeD.value.year(emitDayjs.year()).month(emitDayjs.month()).date(emitDayjs.date());
			if (showTime.value) return emitDayjs.millisecond(0);
			return emitDayjs.startOf("day");
		};
		const emit = (value, ...args) => {
			if (!value) contextEmit("pick", value, ...args);
			else if (isArray(value)) contextEmit("pick", value.map(formatEmit), ...args);
			else contextEmit("pick", formatEmit(value), ...args);
			userInputDate.value = null;
			userInputTime.value = null;
			isChangeToNow.value = false;
			isShortcut = false;
		};
		const handleDatePick = async (value, keepOpen) => {
			if (selectionMode.value === "date" && import_dayjs_min.default.isDayjs(value)) {
				const parsedDateValue = extractFirst(props.parsedValue);
				let newDate = parsedDateValue ? parsedDateValue.year(value.year()).month(value.month()).date(value.date()) : value;
				if (!checkDateWithinRange(newDate)) newDate = selectableRange.value[0][0].year(value.year()).month(value.month()).date(value.date());
				innerDate.value = newDate;
				emit(newDate, showTime.value || keepOpen);
			} else if (selectionMode.value === "week") emit(value.date);
			else if (selectionMode.value === "dates") emit(value, true);
		};
		const moveByMonth = (forward) => {
			const action = forward ? "add" : "subtract";
			innerDate.value = innerDate.value[action](1, "month");
			handlePanelChange("month");
		};
		const moveByYear = (forward) => {
			const currentDate = innerDate.value;
			const action = forward ? "add" : "subtract";
			innerDate.value = currentView.value === "year" ? currentDate[action](10, "year") : currentDate[action](1, "year");
			handlePanelChange("year");
		};
		const currentView = ref("date");
		const yearLabel = computed(() => {
			const yearTranslation = t("el.datepicker.year");
			if (currentView.value === "year") {
				const startYear = Math.floor(year.value / 10) * 10;
				if (yearTranslation) return `${startYear} ${yearTranslation} - ${startYear + 9} ${yearTranslation}`;
				return `${startYear} - ${startYear + 9}`;
			}
			return `${year.value} ${yearTranslation}`;
		});
		const handleShortcutClick = (shortcut) => {
			const shortcutValue = isFunction(shortcut.value) ? shortcut.value() : shortcut.value;
			if (shortcutValue) {
				isShortcut = true;
				emit((0, import_dayjs_min.default)(shortcutValue).locale(lang.value));
				return;
			}
			if (shortcut.onClick) shortcut.onClick({
				attrs,
				slots,
				emit: contextEmit
			});
		};
		const selectionMode = computed(() => {
			const { type } = props;
			if ([
				"week",
				"month",
				"months",
				"year",
				"years",
				"dates"
			].includes(type)) return type;
			return "date";
		});
		const isMultipleType = computed(() => {
			return selectionMode.value === "dates" || selectionMode.value === "months" || selectionMode.value === "years";
		});
		const keyboardMode = computed(() => {
			return selectionMode.value === "date" ? currentView.value : selectionMode.value;
		});
		const hasShortcuts = computed(() => !!shortcuts.length);
		const handleMonthPick = async (month, keepOpen) => {
			if (selectionMode.value === "month") {
				innerDate.value = getValidDateOfMonth(innerDate.value, innerDate.value.year(), month, lang.value, disabledDate);
				emit(innerDate.value, false);
			} else if (selectionMode.value === "months") emit(month, keepOpen ?? true);
			else {
				innerDate.value = getValidDateOfMonth(innerDate.value, innerDate.value.year(), month, lang.value, disabledDate);
				currentView.value = "date";
				if ([
					"month",
					"year",
					"date",
					"week"
				].includes(selectionMode.value)) {
					emit(innerDate.value, true);
					await nextTick();
					handleFocusPicker();
				}
			}
			handlePanelChange("month");
		};
		const handleYearPick = async (year, keepOpen) => {
			if (selectionMode.value === "year") {
				innerDate.value = getValidDateOfYear(innerDate.value.startOf("year").year(year), lang.value, disabledDate);
				emit(innerDate.value, false);
			} else if (selectionMode.value === "years") emit(year, keepOpen ?? true);
			else {
				innerDate.value = getValidDateOfYear(innerDate.value.year(year), lang.value, disabledDate);
				currentView.value = "month";
				if ([
					"month",
					"year",
					"date",
					"week"
				].includes(selectionMode.value)) {
					emit(innerDate.value, true);
					await nextTick();
					handleFocusPicker();
				}
			}
			handlePanelChange("year");
		};
		const dateDisabled = useFormDisabled();
		const showPicker = async (view) => {
			if (dateDisabled.value) return;
			currentView.value = view;
			await nextTick();
			handleFocusPicker();
		};
		const showTime = computed(() => props.type === "datetime" || props.type === "datetimerange");
		const footerVisible = computed(() => {
			const showDateFooter = showTime.value || selectionMode.value === "dates";
			const showYearFooter = selectionMode.value === "years";
			const showMonthFooter = selectionMode.value === "months";
			const isDateView = currentView.value === "date";
			const isYearView = currentView.value === "year";
			const isMonthView = currentView.value === "month";
			return showDateFooter && isDateView || showYearFooter && isYearView || showMonthFooter && isMonthView;
		});
		const footerFilled = computed(() => !isMultipleType.value && props.showNow || props.showConfirm);
		const disabledConfirm = computed(() => {
			if (!disabledDate) return false;
			if (!props.parsedValue) return true;
			if (isArray(props.parsedValue)) return disabledDate(props.parsedValue[0].toDate());
			return disabledDate(props.parsedValue.toDate());
		});
		const onConfirm = () => {
			if (isMultipleType.value) emit(props.parsedValue);
			else {
				let result = extractFirst(props.parsedValue);
				if (!result) {
					const defaultTimeD = (0, import_dayjs_min.default)(defaultTime).locale(lang.value);
					const defaultValueD = getDefaultValue();
					result = defaultTimeD.year(defaultValueD.year()).month(defaultValueD.month()).date(defaultValueD.date());
				}
				innerDate.value = result;
				emit(result);
			}
		};
		const disabledNow = computed(() => {
			if (!disabledDate) return false;
			return disabledDate((0, import_dayjs_min.default)().locale(lang.value).toDate());
		});
		const changeToNow = () => {
			const nowDate = (0, import_dayjs_min.default)().locale(lang.value).toDate();
			isChangeToNow.value = true;
			if ((!disabledDate || !disabledDate(nowDate)) && checkDateWithinRange(nowDate)) {
				innerDate.value = (0, import_dayjs_min.default)().locale(lang.value);
				emit(innerDate.value);
			}
		};
		const timeFormat = computed(() => {
			return props.timeFormat || extractTimeFormat(props.format) || "HH:mm:ss";
		});
		const dateFormat = computed(() => {
			return props.dateFormat || extractDateFormat(props.format) || "YYYY-MM-DD";
		});
		const visibleTime = computed(() => {
			if (userInputTime.value) return userInputTime.value;
			if (!props.parsedValue && !defaultValue.value) return;
			return (extractFirst(props.parsedValue) || innerDate.value).format(timeFormat.value);
		});
		const visibleDate = computed(() => {
			if (userInputDate.value) return userInputDate.value;
			if (!props.parsedValue && !defaultValue.value) return;
			return (extractFirst(props.parsedValue) || innerDate.value).format(dateFormat.value);
		});
		const timePickerVisible = ref(false);
		const onTimePickerInputFocus = () => {
			timePickerVisible.value = true;
		};
		const handleTimePickClose = () => {
			timePickerVisible.value = false;
		};
		const getUnits = (date) => {
			return {
				hour: date.hour(),
				minute: date.minute(),
				second: date.second(),
				year: date.year(),
				month: date.month(),
				date: date.date()
			};
		};
		const handleTimePick = (value, visible, first) => {
			const { hour, minute, second } = getUnits(value);
			const parsedDateValue = extractFirst(props.parsedValue);
			innerDate.value = parsedDateValue ? parsedDateValue.hour(hour).minute(minute).second(second) : value;
			emit(innerDate.value, true);
			if (!first) timePickerVisible.value = visible;
		};
		const handleVisibleTimeChange = (value) => {
			const newDate = (0, import_dayjs_min.default)(value, timeFormat.value).locale(lang.value);
			if (newDate.isValid() && checkDateWithinRange(newDate)) {
				const { year, month, date } = getUnits(innerDate.value);
				innerDate.value = newDate.year(year).month(month).date(date);
				userInputTime.value = null;
				timePickerVisible.value = false;
				emit(innerDate.value, true);
			}
		};
		const handleVisibleDateChange = (value) => {
			const newDate = correctlyParseUserInput(value, dateFormat.value, lang.value, isDefaultFormat);
			if (newDate.isValid()) {
				if (disabledDate && disabledDate(newDate.toDate())) return;
				const { hour, minute, second } = getUnits(innerDate.value);
				innerDate.value = newDate.hour(hour).minute(minute).second(second);
				userInputDate.value = null;
				emit(innerDate.value, true);
			}
		};
		const isValidValue = (date) => {
			return import_dayjs_min.default.isDayjs(date) && date.isValid() && (disabledDate ? !disabledDate(date.toDate()) : true);
		};
		const parseUserInput = (value) => {
			return correctlyParseUserInput(value, props.format, lang.value, isDefaultFormat);
		};
		const getDefaultValue = () => {
			const parseDate = (0, import_dayjs_min.default)(defaultValue.value).locale(lang.value);
			if (!defaultValue.value) {
				const defaultTimeDValue = defaultTimeD.value;
				return (0, import_dayjs_min.default)().hour(defaultTimeDValue.hour()).minute(defaultTimeDValue.minute()).second(defaultTimeDValue.second()).locale(lang.value);
			}
			return parseDate;
		};
		const handleFocusPicker = () => {
			if ([
				"week",
				"month",
				"year",
				"date"
			].includes(selectionMode.value)) currentViewRef.value?.focus();
		};
		const _handleFocusPicker = () => {
			handleFocusPicker();
			if (selectionMode.value === "week") handleKeyControl(EVENT_CODE.down);
		};
		const handleKeydownTable = (event) => {
			const code = getEventCode(event);
			if ([
				EVENT_CODE.up,
				EVENT_CODE.down,
				EVENT_CODE.left,
				EVENT_CODE.right,
				EVENT_CODE.home,
				EVENT_CODE.end,
				EVENT_CODE.pageUp,
				EVENT_CODE.pageDown
			].includes(code)) {
				handleKeyControl(code);
				event.stopPropagation();
				event.preventDefault();
			}
			if ([
				EVENT_CODE.enter,
				EVENT_CODE.space,
				EVENT_CODE.numpadEnter
			].includes(code) && userInputDate.value === null && userInputTime.value === null) {
				event.preventDefault();
				emit(innerDate.value, false);
			}
		};
		const handleKeyControl = (code) => {
			const { up, down, left, right, home, end, pageUp, pageDown } = EVENT_CODE;
			const mapping = {
				year: {
					[up]: -4,
					[down]: 4,
					[left]: -1,
					[right]: 1,
					offset: (date, step) => date.setFullYear(date.getFullYear() + step)
				},
				month: {
					[up]: -4,
					[down]: 4,
					[left]: -1,
					[right]: 1,
					offset: (date, step) => date.setMonth(date.getMonth() + step)
				},
				week: {
					[up]: -1,
					[down]: 1,
					[left]: -1,
					[right]: 1,
					offset: (date, step) => date.setDate(date.getDate() + step * 7)
				},
				date: {
					[up]: -7,
					[down]: 7,
					[left]: -1,
					[right]: 1,
					[home]: (date) => -date.getDay(),
					[end]: (date) => -date.getDay() + 6,
					[pageUp]: (date) => -new Date(date.getFullYear(), date.getMonth(), 0).getDate(),
					[pageDown]: (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
					offset: (date, step) => date.setDate(date.getDate() + step)
				}
			};
			const newDate = innerDate.value.toDate();
			while (Math.abs(innerDate.value.diff(newDate, "year", true)) < 1) {
				const map = mapping[keyboardMode.value];
				if (!map) return;
				map.offset(newDate, isFunction(map[code]) ? map[code](newDate) : map[code] ?? 0);
				if (disabledDate && disabledDate(newDate)) break;
				const result = (0, import_dayjs_min.default)(newDate).locale(lang.value);
				innerDate.value = result;
				contextEmit("pick", result, true);
				break;
			}
		};
		const handlePanelChange = (mode) => {
			contextEmit("panel-change", innerDate.value.toDate(), mode, currentView.value);
		};
		watch(() => selectionMode.value, (val) => {
			if (["month", "year"].includes(val)) {
				currentView.value = val;
				return;
			} else if (val === "years") {
				currentView.value = "year";
				return;
			} else if (val === "months") {
				currentView.value = "month";
				return;
			}
			currentView.value = "date";
		}, { immediate: true });
		watch(() => defaultValue.value, (val) => {
			if (val) innerDate.value = getDefaultValue();
		}, { immediate: true });
		watch(() => props.parsedValue, (val) => {
			if (val) {
				if (isMultipleType.value) return;
				if (isArray(val)) return;
				innerDate.value = val;
			} else innerDate.value = getDefaultValue();
		}, { immediate: true });
		contextEmit("set-picker-option", ["isValidValue", isValidValue]);
		contextEmit("set-picker-option", ["parseUserInput", parseUserInput]);
		contextEmit("set-picker-option", ["handleFocusPicker", _handleFocusPicker]);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass([
				unref(ppNs).b(),
				unref(dpNs).b(),
				unref(ppNs).is("border", _ctx.border),
				unref(ppNs).is("disabled", unref(dateDisabled)),
				{
					"has-sidebar": _ctx.$slots.sidebar || hasShortcuts.value,
					"has-time": showTime.value
				}
			]) }, [createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body-wrapper")) }, [
				renderSlot(_ctx.$slots, "sidebar", { class: normalizeClass(unref(ppNs).e("sidebar")) }),
				hasShortcuts.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ppNs).e("sidebar"))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(shortcuts), (shortcut, key) => {
					return openBlock(), createElementBlock("button", {
						key,
						type: "button",
						disabled: unref(dateDisabled),
						class: normalizeClass(unref(ppNs).e("shortcut")),
						onClick: ($event) => handleShortcutClick(shortcut)
					}, toDisplayString(shortcut.text), 11, _hoisted_1$3);
				}), 128))], 2)) : createCommentVNode("v-if", true),
				createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body")) }, [
					showTime.value ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(unref(dpNs).e("time-header"))
					}, [createBaseVNode("span", { class: normalizeClass(unref(dpNs).e("editor-wrap")) }, [createVNode(unref(ElInput), {
						placeholder: unref(t)("el.datepicker.selectDate"),
						"model-value": visibleDate.value,
						size: "small",
						"validate-event": false,
						disabled: unref(dateDisabled),
						readonly: !_ctx.editable,
						onInput: _cache[0] || (_cache[0] = (val) => userInputDate.value = val),
						onChange: handleVisibleDateChange
					}, null, 8, [
						"placeholder",
						"model-value",
						"disabled",
						"readonly"
					])], 2), withDirectives((openBlock(), createElementBlock("span", { class: normalizeClass(unref(dpNs).e("editor-wrap")) }, [createVNode(unref(ElInput), {
						placeholder: unref(t)("el.datepicker.selectTime"),
						"model-value": visibleTime.value,
						size: "small",
						"validate-event": false,
						disabled: unref(dateDisabled),
						readonly: !_ctx.editable,
						onFocus: onTimePickerInputFocus,
						onInput: _cache[1] || (_cache[1] = (val) => userInputTime.value = val),
						onChange: handleVisibleTimeChange
					}, null, 8, [
						"placeholder",
						"model-value",
						"disabled",
						"readonly"
					]), createVNode(unref(panel_time_pick_default), {
						visible: timePickerVisible.value,
						format: timeFormat.value,
						"parsed-value": innerDate.value,
						onPick: handleTimePick
					}, null, 8, [
						"visible",
						"format",
						"parsed-value"
					])], 2)), [[unref(ClickOutside), handleTimePickClose]])], 2)) : createCommentVNode("v-if", true),
					withDirectives(createBaseVNode("div", { class: normalizeClass([unref(dpNs).e("header"), (currentView.value === "year" || currentView.value === "month") && unref(dpNs).em("header", "bordered")]) }, [
						createBaseVNode("span", { class: normalizeClass(unref(dpNs).e("prev-btn")) }, [createBaseVNode("button", {
							type: "button",
							"aria-label": unref(t)(`el.datepicker.prevYear`),
							class: normalizeClass(["d-arrow-left", unref(ppNs).e("icon-btn")]),
							disabled: unref(dateDisabled),
							onClick: _cache[2] || (_cache[2] = ($event) => moveByYear(false))
						}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
							default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
							_: 1
						})])], 10, _hoisted_2$3), withDirectives(createBaseVNode("button", {
							type: "button",
							"aria-label": unref(t)(`el.datepicker.prevMonth`),
							class: normalizeClass([unref(ppNs).e("icon-btn"), "arrow-left"]),
							disabled: unref(dateDisabled),
							onClick: _cache[3] || (_cache[3] = ($event) => moveByMonth(false))
						}, [renderSlot(_ctx.$slots, "prev-month", {}, () => [createVNode(unref(ElIcon), null, {
							default: withCtx(() => [createVNode(unref(arrow_left_default))]),
							_: 1
						})])], 10, _hoisted_3$3), [[vShow, currentView.value === "date"]])], 2),
						createBaseVNode("span", {
							role: "button",
							class: normalizeClass(unref(dpNs).e("header-label")),
							"aria-live": "polite",
							tabindex: _ctx.disabled ? void 0 : 0,
							"aria-disabled": _ctx.disabled,
							onKeydown: _cache[4] || (_cache[4] = withKeys(($event) => showPicker("year"), ["enter"])),
							onClick: _cache[5] || (_cache[5] = ($event) => showPicker("year"))
						}, toDisplayString(yearLabel.value), 43, _hoisted_4$3),
						withDirectives(createBaseVNode("span", {
							role: "button",
							"aria-live": "polite",
							tabindex: _ctx.disabled ? void 0 : 0,
							"aria-disabled": _ctx.disabled,
							class: normalizeClass([unref(dpNs).e("header-label"), { active: currentView.value === "month" }]),
							onKeydown: _cache[6] || (_cache[6] = withKeys(($event) => showPicker("month"), ["enter"])),
							onClick: _cache[7] || (_cache[7] = ($event) => showPicker("month"))
						}, toDisplayString(unref(t)(`el.datepicker.month${month.value + 1}`)), 43, _hoisted_5$3), [[vShow, currentView.value === "date"]]),
						createBaseVNode("span", { class: normalizeClass(unref(dpNs).e("next-btn")) }, [withDirectives(createBaseVNode("button", {
							type: "button",
							"aria-label": unref(t)(`el.datepicker.nextMonth`),
							class: normalizeClass([unref(ppNs).e("icon-btn"), "arrow-right"]),
							disabled: unref(dateDisabled),
							onClick: _cache[8] || (_cache[8] = ($event) => moveByMonth(true))
						}, [renderSlot(_ctx.$slots, "next-month", {}, () => [createVNode(unref(ElIcon), null, {
							default: withCtx(() => [createVNode(unref(arrow_right_default))]),
							_: 1
						})])], 10, _hoisted_6$1), [[vShow, currentView.value === "date"]]), createBaseVNode("button", {
							type: "button",
							"aria-label": unref(t)(`el.datepicker.nextYear`),
							class: normalizeClass([unref(ppNs).e("icon-btn"), "d-arrow-right"]),
							disabled: unref(dateDisabled),
							onClick: _cache[9] || (_cache[9] = ($event) => moveByYear(true))
						}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
							default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
							_: 1
						})])], 10, _hoisted_7$1)], 2)
					], 2), [[vShow, currentView.value !== "time"]]),
					createBaseVNode("div", {
						class: normalizeClass(unref(ppNs).e("content")),
						onKeydown: handleKeydownTable
					}, [
						currentView.value === "date" ? (openBlock(), createBlock(basic_date_table_default, {
							key: 0,
							ref_key: "currentViewRef",
							ref: currentViewRef,
							"selection-mode": selectionMode.value,
							date: innerDate.value,
							"parsed-value": _ctx.parsedValue,
							"disabled-date": unref(disabledDate),
							disabled: unref(dateDisabled),
							"cell-class-name": unref(cellClassName),
							"show-week-number": _ctx.showWeekNumber,
							onPick: handleDatePick
						}, null, 8, [
							"selection-mode",
							"date",
							"parsed-value",
							"disabled-date",
							"disabled",
							"cell-class-name",
							"show-week-number"
						])) : createCommentVNode("v-if", true),
						currentView.value === "year" ? (openBlock(), createBlock(basic_year_table_default, {
							key: 1,
							ref_key: "currentViewRef",
							ref: currentViewRef,
							"selection-mode": selectionMode.value,
							date: innerDate.value,
							"disabled-date": unref(disabledDate),
							disabled: unref(dateDisabled),
							"parsed-value": _ctx.parsedValue,
							"cell-class-name": unref(cellClassName),
							onPick: handleYearPick
						}, null, 8, [
							"selection-mode",
							"date",
							"disabled-date",
							"disabled",
							"parsed-value",
							"cell-class-name"
						])) : createCommentVNode("v-if", true),
						currentView.value === "month" ? (openBlock(), createBlock(basic_month_table_default, {
							key: 2,
							ref_key: "currentViewRef",
							ref: currentViewRef,
							"selection-mode": selectionMode.value,
							date: innerDate.value,
							"parsed-value": _ctx.parsedValue,
							"disabled-date": unref(disabledDate),
							disabled: unref(dateDisabled),
							"cell-class-name": unref(cellClassName),
							onPick: handleMonthPick
						}, null, 8, [
							"selection-mode",
							"date",
							"parsed-value",
							"disabled-date",
							"disabled",
							"cell-class-name"
						])) : createCommentVNode("v-if", true)
					], 34)
				], 2)
			], 2), _ctx.showFooter && footerVisible.value && footerFilled.value ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(unref(ppNs).e("footer"))
			}, [withDirectives(createVNode(unref(ElButton), {
				text: "",
				size: "small",
				class: normalizeClass(unref(ppNs).e("link-btn")),
				disabled: disabledNow.value,
				onClick: changeToNow
			}, {
				default: withCtx(() => [createTextVNode(toDisplayString(unref(t)("el.datepicker.now")), 1)]),
				_: 1
			}, 8, ["class", "disabled"]), [[vShow, !isMultipleType.value && _ctx.showNow]]), _ctx.showConfirm ? (openBlock(), createBlock(unref(ElButton), {
				key: 0,
				plain: "",
				size: "small",
				class: normalizeClass(unref(ppNs).e("link-btn")),
				disabled: disabledConfirm.value,
				onClick: onConfirm
			}, {
				default: withCtx(() => [createTextVNode(toDisplayString(unref(t)("el.datepicker.confirm")), 1)]),
				_: 1
			}, 8, ["class", "disabled"])) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/panel-date-range.mjs
var panelDateRangeProps = buildProps({
	...panelSharedProps,
	...panelRangeSharedProps
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/composables/use-shortcut.mjs
var useShortcut = (lang) => {
	const { emit } = getCurrentInstance();
	const attrs = useAttrs();
	const slots = useSlots();
	const handleShortcutClick = (shortcut) => {
		const shortcutValues = isFunction(shortcut.value) ? shortcut.value() : shortcut.value;
		if (shortcutValues) {
			emit("pick", [(0, import_dayjs_min.default)(shortcutValues[0]).locale(lang.value), (0, import_dayjs_min.default)(shortcutValues[1]).locale(lang.value)]);
			return;
		}
		if (shortcut.onClick) shortcut.onClick({
			attrs,
			slots,
			emit
		});
	};
	return handleShortcutClick;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/composables/use-range-picker.mjs
var useRangePicker = (props, { defaultValue, defaultTime, leftDate, rightDate, step, unit, sortDates }) => {
	const { emit } = getCurrentInstance();
	const { pickerNs } = inject(ROOT_PICKER_INJECTION_KEY);
	const drpNs = useNamespace("date-range-picker");
	const { t, lang } = useLocale();
	const handleShortcutClick = useShortcut(lang);
	const minDate = ref();
	const maxDate = ref();
	const rangeState = ref({
		endDate: null,
		selecting: false
	});
	const handleChangeRange = (val) => {
		rangeState.value = val;
	};
	const handleRangeConfirm = (visible = false) => {
		const _minDate = unref(minDate);
		const _maxDate = unref(maxDate);
		if (isValidRange([_minDate, _maxDate])) emit("pick", [_minDate, _maxDate], visible);
	};
	const onSelect = (selecting) => {
		rangeState.value.selecting = selecting;
		if (!selecting) rangeState.value.endDate = null;
	};
	const parseValue = (parsedValue) => {
		if (isArray(parsedValue) && parsedValue.length === 2) {
			const [start, end] = parsedValue;
			minDate.value = start;
			leftDate.value = start;
			maxDate.value = end;
			sortDates(unref(minDate), unref(maxDate));
		} else restoreDefault();
	};
	const restoreDefault = () => {
		let [start, end] = getDefaultValue(unref(defaultValue), {
			lang: unref(lang),
			step,
			unit,
			unlinkPanels: props.unlinkPanels
		});
		const getShift = (day) => {
			return day.diff(day.startOf("d"), "ms");
		};
		const maybeTimes = unref(defaultTime);
		if (maybeTimes) {
			let leftShift = 0;
			let rightShift = 0;
			if (isArray(maybeTimes)) {
				const [timeStart, timeEnd] = maybeTimes.map(import_dayjs_min.default);
				leftShift = getShift(timeStart);
				rightShift = getShift(timeEnd);
			} else {
				const shift = getShift((0, import_dayjs_min.default)(maybeTimes));
				leftShift = shift;
				rightShift = shift;
			}
			start = start.startOf("d").add(leftShift, "ms");
			end = end.startOf("d").add(rightShift, "ms");
		}
		minDate.value = void 0;
		maxDate.value = void 0;
		leftDate.value = start;
		rightDate.value = end;
	};
	watch(defaultValue, (val) => {
		if (val) restoreDefault();
	}, { immediate: true });
	watch(() => props.parsedValue, (parsedValue) => {
		if (!parsedValue?.length || !isEqual(parsedValue, [minDate.value, maxDate.value])) parseValue(parsedValue);
	}, { immediate: true });
	watch(() => props.visible, () => {
		if (props.visible) parseValue(props.parsedValue);
	}, { immediate: true });
	return {
		minDate,
		maxDate,
		rangeState,
		lang,
		ppNs: pickerNs,
		drpNs,
		handleChangeRange,
		handleRangeConfirm,
		handleShortcutClick,
		onSelect,
		parseValue,
		t
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/composables/use-panel-date-range.mjs
var usePanelDateRange = (props, emit, leftDate, rightDate) => {
	const leftCurrentView = ref("date");
	const leftCurrentViewRef = ref();
	const rightCurrentView = ref("date");
	const rightCurrentViewRef = ref();
	const { disabledDate } = inject(PICKER_BASE_INJECTION_KEY).props;
	const { t, lang } = useLocale();
	const leftYear = computed(() => {
		return leftDate.value.year();
	});
	const leftMonth = computed(() => {
		return leftDate.value.month();
	});
	const rightYear = computed(() => {
		return rightDate.value.year();
	});
	const rightMonth = computed(() => {
		return rightDate.value.month();
	});
	function computedYearLabel(currentView, yearValue) {
		const yearTranslation = t("el.datepicker.year");
		if (currentView.value === "year") {
			const startYear = Math.floor(yearValue.value / 10) * 10;
			return yearTranslation ? `${startYear} ${yearTranslation} - ${startYear + 9} ${yearTranslation}` : `${startYear} - ${startYear + 9}`;
		}
		return `${yearValue.value} ${yearTranslation}`;
	}
	function focusPicker(currentViewRef) {
		currentViewRef?.focus();
	}
	async function showPicker(pickerType, view) {
		if (props.disabled) return;
		const currentView = pickerType === "left" ? leftCurrentView : rightCurrentView;
		const currentViewRef = pickerType === "left" ? leftCurrentViewRef : rightCurrentViewRef;
		currentView.value = view;
		await nextTick();
		focusPicker(currentViewRef.value);
	}
	async function handlePick(mode, pickerType, value) {
		if (props.disabled) return;
		const isLeftPicker = pickerType === "left";
		const startDate = isLeftPicker ? leftDate : rightDate;
		const endDate = isLeftPicker ? rightDate : leftDate;
		const currentView = isLeftPicker ? leftCurrentView : rightCurrentView;
		const currentViewRef = isLeftPicker ? leftCurrentViewRef : rightCurrentViewRef;
		if (mode === "year") startDate.value = getValidDateOfYear(startDate.value.year(value), lang.value, disabledDate);
		if (mode === "month") startDate.value = getValidDateOfMonth(startDate.value, startDate.value.year(), value, lang.value, disabledDate);
		if (!props.unlinkPanels) endDate.value = pickerType === "left" ? startDate.value.add(1, "month") : startDate.value.subtract(1, "month");
		currentView.value = mode === "year" ? "month" : "date";
		await nextTick();
		focusPicker(currentViewRef.value);
		handlePanelChange(mode);
	}
	function handlePanelChange(mode) {
		emit("panel-change", [leftDate.value.toDate(), rightDate.value.toDate()], mode);
	}
	function adjustDateByView(currentView, date, forward) {
		const action = forward ? "add" : "subtract";
		return currentView === "year" ? date[action](10, "year") : date[action](1, "year");
	}
	return {
		leftCurrentView,
		rightCurrentView,
		leftCurrentViewRef,
		rightCurrentViewRef,
		leftYear,
		rightYear,
		leftMonth,
		rightMonth,
		leftYearLabel: computed(() => computedYearLabel(leftCurrentView, leftYear)),
		rightYearLabel: computed(() => computedYearLabel(rightCurrentView, rightYear)),
		showLeftPicker: (view) => showPicker("left", view),
		showRightPicker: (view) => showPicker("right", view),
		handleLeftYearPick: (year) => handlePick("year", "left", year),
		handleRightYearPick: (year) => handlePick("year", "right", year),
		handleLeftMonthPick: (month) => handlePick("month", "left", month),
		handleRightMonthPick: (month) => handlePick("month", "right", month),
		handlePanelChange,
		adjustDateByView
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-date-range.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$2 = ["disabled", "onClick"];
var _hoisted_2$2 = ["aria-label", "disabled"];
var _hoisted_3$2 = ["aria-label", "disabled"];
var _hoisted_4$2 = ["disabled", "aria-label"];
var _hoisted_5$2 = ["disabled", "aria-label"];
var _hoisted_6 = ["tabindex", "aria-disabled"];
var _hoisted_7 = ["tabindex", "aria-disabled"];
var _hoisted_8 = ["disabled", "aria-label"];
var _hoisted_9 = ["disabled", "aria-label"];
var _hoisted_10 = ["aria-label", "disabled"];
var _hoisted_11 = ["disabled", "aria-label"];
var _hoisted_12 = ["tabindex", "aria-disabled"];
var _hoisted_13 = ["tabindex", "aria-disabled"];
var unit$2 = "month";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-date-range.mjs
var panel_date_range_default = /* @__PURE__ */ defineComponent({
	__name: "panel-date-range",
	props: panelDateRangeProps,
	emits: [
		"pick",
		"set-picker-option",
		"calendar-change",
		"panel-change",
		"clear"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const pickerBase = inject(PICKER_BASE_INJECTION_KEY);
		const isDefaultFormat = inject(ROOT_PICKER_IS_DEFAULT_FORMAT_INJECTION_KEY, void 0);
		const { disabledDate, cellClassName, defaultTime, clearable } = pickerBase.props;
		const format = toRef(pickerBase.props, "format");
		const shortcuts = toRef(pickerBase.props, "shortcuts");
		const defaultValue = toRef(pickerBase.props, "defaultValue");
		const { lang } = useLocale();
		const leftDate = ref((0, import_dayjs_min.default)().locale(lang.value));
		const rightDate = ref((0, import_dayjs_min.default)().locale(lang.value).add(1, unit$2));
		const { minDate, maxDate, rangeState, ppNs, drpNs, handleChangeRange, handleRangeConfirm, handleShortcutClick, onSelect, parseValue, t } = useRangePicker(props, {
			defaultValue,
			defaultTime,
			leftDate,
			rightDate,
			unit: unit$2,
			sortDates
		});
		watch(() => props.visible, (visible) => {
			if (!visible && rangeState.value.selecting) {
				parseValue(props.parsedValue);
				onSelect(false);
			}
		});
		const dateUserInput = ref({
			min: null,
			max: null
		});
		const timeUserInput = ref({
			min: null,
			max: null
		});
		const { leftCurrentView, rightCurrentView, leftCurrentViewRef, rightCurrentViewRef, leftYear, rightYear, leftMonth, rightMonth, leftYearLabel, rightYearLabel, showLeftPicker, showRightPicker, handleLeftYearPick, handleRightYearPick, handleLeftMonthPick, handleRightMonthPick, handlePanelChange, adjustDateByView } = usePanelDateRange(props, emit, leftDate, rightDate);
		const hasShortcuts = computed(() => !!shortcuts.value.length);
		const minVisibleDate = computed(() => {
			if (dateUserInput.value.min !== null) return dateUserInput.value.min;
			if (minDate.value) return minDate.value.format(dateFormat.value);
			return "";
		});
		const maxVisibleDate = computed(() => {
			if (dateUserInput.value.max !== null) return dateUserInput.value.max;
			if (maxDate.value || minDate.value) return (maxDate.value || minDate.value).format(dateFormat.value);
			return "";
		});
		const minVisibleTime = computed(() => {
			if (timeUserInput.value.min !== null) return timeUserInput.value.min;
			if (minDate.value) return minDate.value.format(timeFormat.value);
			return "";
		});
		const maxVisibleTime = computed(() => {
			if (timeUserInput.value.max !== null) return timeUserInput.value.max;
			if (maxDate.value || minDate.value) return (maxDate.value || minDate.value).format(timeFormat.value);
			return "";
		});
		const timeFormat = computed(() => {
			return props.timeFormat || extractTimeFormat(format.value || "") || "HH:mm:ss";
		});
		const dateFormat = computed(() => {
			return props.dateFormat || extractDateFormat(format.value || "") || "YYYY-MM-DD";
		});
		const isValidValue = (date) => {
			return isValidRange(date) && (disabledDate ? !disabledDate(date[0].toDate()) && !disabledDate(date[1].toDate()) : true);
		};
		const leftPrevYear = () => {
			leftDate.value = adjustDateByView(leftCurrentView.value, leftDate.value, false);
			if (!props.unlinkPanels) rightDate.value = leftDate.value.add(1, "month");
			handlePanelChange("year");
		};
		const leftPrevMonth = () => {
			leftDate.value = leftDate.value.subtract(1, "month");
			if (!props.unlinkPanels) rightDate.value = leftDate.value.add(1, "month");
			handlePanelChange("month");
		};
		const rightNextYear = () => {
			if (!props.unlinkPanels) {
				leftDate.value = adjustDateByView(rightCurrentView.value, leftDate.value, true);
				rightDate.value = leftDate.value.add(1, "month");
			} else rightDate.value = adjustDateByView(rightCurrentView.value, rightDate.value, true);
			handlePanelChange("year");
		};
		const rightNextMonth = () => {
			if (!props.unlinkPanels) {
				leftDate.value = leftDate.value.add(1, "month");
				rightDate.value = leftDate.value.add(1, "month");
			} else rightDate.value = rightDate.value.add(1, "month");
			handlePanelChange("month");
		};
		const leftNextYear = () => {
			leftDate.value = adjustDateByView(leftCurrentView.value, leftDate.value, true);
			handlePanelChange("year");
		};
		const leftNextMonth = () => {
			leftDate.value = leftDate.value.add(1, "month");
			handlePanelChange("month");
		};
		const rightPrevYear = () => {
			rightDate.value = adjustDateByView(rightCurrentView.value, rightDate.value, false);
			handlePanelChange("year");
		};
		const rightPrevMonth = () => {
			rightDate.value = rightDate.value.subtract(1, "month");
			handlePanelChange("month");
		};
		const enableMonthArrow = computed(() => {
			const nextMonth = (leftMonth.value + 1) % 12;
			const yearOffset = leftMonth.value + 1 >= 12 ? 1 : 0;
			return props.singlePanel || props.unlinkPanels && new Date(leftYear.value + yearOffset, nextMonth) < new Date(rightYear.value, rightMonth.value);
		});
		const enableYearArrow = computed(() => {
			return props.singlePanel || props.unlinkPanels && rightYear.value * 12 + rightMonth.value - (leftYear.value * 12 + leftMonth.value + 1) >= 12;
		});
		const dateRangeDisabled = useFormDisabled();
		const btnDisabled = computed(() => {
			return !(minDate.value && maxDate.value && !rangeState.value.selecting && isValidRange([minDate.value, maxDate.value]) && !dateRangeDisabled.value);
		});
		const showTime = computed(() => props.type === "datetime" || props.type === "datetimerange");
		const formatEmit = (emitDayjs, index) => {
			if (!emitDayjs) return;
			if (defaultTime) return (0, import_dayjs_min.default)(defaultTime[index] || defaultTime).locale(lang.value).year(emitDayjs.year()).month(emitDayjs.month()).date(emitDayjs.date());
			return emitDayjs;
		};
		const handleRangePick = (val, close = true) => {
			const min_ = val.minDate;
			const max_ = val.maxDate;
			const minDate_ = formatEmit(min_, 0);
			const maxDate_ = formatEmit(max_, 1);
			if (maxDate.value === maxDate_ && minDate.value === minDate_) return;
			emit("calendar-change", [min_.toDate(), max_ && max_.toDate()]);
			maxDate.value = maxDate_;
			minDate.value = minDate_;
			if (!showTime.value && close) close = !minDate_ || !maxDate_;
			handleRangeConfirm(close);
		};
		const minTimePickerVisible = ref(false);
		const maxTimePickerVisible = ref(false);
		const handleMinTimeClose = () => {
			minTimePickerVisible.value = false;
		};
		const handleMaxTimeClose = () => {
			maxTimePickerVisible.value = false;
		};
		const findValidDateToward = (from, toward) => {
			if (!disabledDate || !disabledDate(from.toDate())) return from;
			const forward = from.isBefore(toward);
			let cursor = from;
			while (forward ? cursor.isBefore(toward) : cursor.isAfter(toward)) {
				cursor = forward ? cursor.add(1, "day") : cursor.subtract(1, "day");
				if (!disabledDate(cursor.toDate())) return cursor;
			}
			return from;
		};
		const handleDateInput = (value, type) => {
			dateUserInput.value[type] = value;
			const parsedValueD = (0, import_dayjs_min.default)(value, dateFormat.value).locale(lang.value);
			if (parsedValueD.isValid()) {
				if (disabledDate && disabledDate(parsedValueD.toDate())) return;
				if (type === "min") {
					leftDate.value = parsedValueD;
					minDate.value = (minDate.value || leftDate.value).year(parsedValueD.year()).month(parsedValueD.month()).date(parsedValueD.date());
					if (!props.unlinkPanels && !maxDate.value) {
						const adjustedMax = findValidDateToward(minDate.value.add(1, "month"), minDate.value);
						rightDate.value = adjustedMax;
						maxDate.value = adjustedMax;
					}
				} else {
					rightDate.value = parsedValueD;
					maxDate.value = (maxDate.value || rightDate.value).year(parsedValueD.year()).month(parsedValueD.month()).date(parsedValueD.date());
					if (!props.unlinkPanels && !minDate.value) {
						const adjustedMin = findValidDateToward(maxDate.value.subtract(1, "month"), maxDate.value);
						leftDate.value = adjustedMin;
						minDate.value = adjustedMin;
					}
				}
				sortDates(minDate.value, maxDate.value);
				handleRangeConfirm(true);
			}
		};
		const handleDateChange = (_, type) => {
			dateUserInput.value[type] = null;
			if (type === "min") {
				if (!props.unlinkPanels && maxDate.value && minDate.value && maxDate.value.isBefore(minDate.value)) {
					const adjustedMax = findValidDateToward(minDate.value.add(1, "month"), minDate.value);
					rightDate.value = adjustedMax;
					maxDate.value = adjustedMax;
				}
			} else if (!props.unlinkPanels && minDate.value && maxDate.value && minDate.value.isAfter(maxDate.value)) {
				const adjustedMin = findValidDateToward(maxDate.value.subtract(1, "month"), maxDate.value);
				leftDate.value = adjustedMin;
				minDate.value = adjustedMin;
			}
			sortDates(minDate.value, maxDate.value);
			handleRangeConfirm(true);
		};
		const handleTimeInput = (value, type) => {
			timeUserInput.value[type] = value;
			const parsedValueD = (0, import_dayjs_min.default)(value, timeFormat.value).locale(lang.value);
			if (parsedValueD.isValid()) if (type === "min") {
				minTimePickerVisible.value = true;
				minDate.value = (minDate.value || leftDate.value).hour(parsedValueD.hour()).minute(parsedValueD.minute()).second(parsedValueD.second());
				leftDate.value = minDate.value;
			} else {
				maxTimePickerVisible.value = true;
				maxDate.value = (maxDate.value || rightDate.value).hour(parsedValueD.hour()).minute(parsedValueD.minute()).second(parsedValueD.second());
				rightDate.value = maxDate.value;
			}
		};
		const handleTimeChange = (_value, type) => {
			timeUserInput.value[type] = null;
			if (type === "min") {
				leftDate.value = minDate.value;
				minTimePickerVisible.value = false;
				if (!maxDate.value || maxDate.value.isBefore(minDate.value)) maxDate.value = minDate.value;
			} else {
				rightDate.value = maxDate.value;
				maxTimePickerVisible.value = false;
				if (maxDate.value && maxDate.value.isBefore(minDate.value)) minDate.value = maxDate.value;
			}
			handleRangeConfirm(true);
		};
		const handleMinTimePick = (value, visible, first) => {
			if (timeUserInput.value.min) return;
			if (value) minDate.value = (minDate.value || leftDate.value).hour(value.hour()).minute(value.minute()).second(value.second());
			if (!first) minTimePickerVisible.value = visible;
			if (!maxDate.value || maxDate.value.isBefore(minDate.value)) {
				maxDate.value = minDate.value;
				rightDate.value = value;
				nextTick(() => {
					parseValue(props.parsedValue);
				});
			}
			handleRangeConfirm(true);
		};
		const handleMaxTimePick = (value, visible, first) => {
			if (timeUserInput.value.max) return;
			if (value) maxDate.value = (maxDate.value || rightDate.value).hour(value.hour()).minute(value.minute()).second(value.second());
			if (!first) maxTimePickerVisible.value = visible;
			if (maxDate.value && maxDate.value.isBefore(minDate.value)) minDate.value = maxDate.value;
			handleRangeConfirm(true);
		};
		const onClear = () => {
			handleClear();
			emit("clear");
		};
		const handleClear = () => {
			let valueOnClear = null;
			if (pickerBase?.emptyValues) valueOnClear = pickerBase.emptyValues.valueOnClear.value;
			leftDate.value = getDefaultValue(unref(defaultValue), {
				lang: unref(lang),
				unit: "month",
				unlinkPanels: props.unlinkPanels
			})[0];
			rightDate.value = leftDate.value.add(1, "month");
			maxDate.value = void 0;
			minDate.value = void 0;
			handleRangeConfirm(true);
			emit("pick", valueOnClear);
		};
		const parseUserInput = (value) => {
			return correctlyParseUserInput(value, format.value || "", lang.value, isDefaultFormat);
		};
		function sortDates(minDate, maxDate) {
			if (props.unlinkPanels && maxDate) {
				const minDateYear = minDate?.year() || 0;
				const minDateMonth = minDate?.month() || 0;
				const maxDateYear = maxDate.year();
				const maxDateMonth = maxDate.month();
				rightDate.value = minDateYear === maxDateYear && minDateMonth === maxDateMonth ? maxDate.add(1, unit$2) : maxDate;
			} else {
				rightDate.value = leftDate.value.add(1, unit$2);
				if (maxDate) rightDate.value = rightDate.value.hour(maxDate.hour()).minute(maxDate.minute()).second(maxDate.second());
			}
		}
		emit("set-picker-option", ["isValidValue", isValidValue]);
		emit("set-picker-option", ["parseUserInput", parseUserInput]);
		emit("set-picker-option", ["handleClear", handleClear]);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass([
				unref(ppNs).b(),
				unref(drpNs).b(),
				unref(ppNs).is("border", _ctx.border),
				unref(ppNs).is("disabled", unref(dateRangeDisabled)),
				{
					"has-sidebar": _ctx.$slots.sidebar || hasShortcuts.value,
					"has-time": showTime.value,
					"single-panel": _ctx.singlePanel
				}
			]) }, [createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body-wrapper")) }, [
				renderSlot(_ctx.$slots, "sidebar", { class: normalizeClass(unref(ppNs).e("sidebar")) }),
				hasShortcuts.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ppNs).e("sidebar"))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(shortcuts.value, (shortcut, key) => {
					return openBlock(), createElementBlock("button", {
						key,
						type: "button",
						disabled: unref(dateRangeDisabled),
						class: normalizeClass(unref(ppNs).e("shortcut")),
						onClick: ($event) => unref(handleShortcutClick)(shortcut)
					}, toDisplayString(shortcut.text), 11, _hoisted_1$2);
				}), 128))], 2)) : createCommentVNode("v-if", true),
				createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body")) }, [
					showTime.value ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(unref(drpNs).e("time-header"))
					}, [
						createBaseVNode("span", { class: normalizeClass(unref(drpNs).e("editors-wrap")) }, [createBaseVNode("span", { class: normalizeClass(unref(drpNs).e("time-picker-wrap")) }, [createVNode(unref(ElInput), {
							size: "small",
							disabled: unref(rangeState).selecting || unref(dateRangeDisabled),
							placeholder: unref(t)("el.datepicker.startDate"),
							class: normalizeClass(unref(drpNs).e("editor")),
							"model-value": minVisibleDate.value,
							"validate-event": false,
							readonly: !_ctx.editable,
							onInput: _cache[0] || (_cache[0] = (val) => handleDateInput(val, "min")),
							onChange: _cache[1] || (_cache[1] = (val) => handleDateChange(val, "min"))
						}, null, 8, [
							"disabled",
							"placeholder",
							"class",
							"model-value",
							"readonly"
						])], 2), withDirectives((openBlock(), createElementBlock("span", { class: normalizeClass(unref(drpNs).e("time-picker-wrap")) }, [createVNode(unref(ElInput), {
							size: "small",
							class: normalizeClass(unref(drpNs).e("editor")),
							disabled: unref(rangeState).selecting || unref(dateRangeDisabled),
							placeholder: unref(t)("el.datepicker.startTime"),
							"model-value": minVisibleTime.value,
							"validate-event": false,
							readonly: !_ctx.editable,
							onFocus: _cache[2] || (_cache[2] = ($event) => minTimePickerVisible.value = true),
							onInput: _cache[3] || (_cache[3] = (val) => handleTimeInput(val, "min")),
							onChange: _cache[4] || (_cache[4] = (val) => handleTimeChange(val, "min"))
						}, null, 8, [
							"class",
							"disabled",
							"placeholder",
							"model-value",
							"readonly"
						]), createVNode(unref(panel_time_pick_default), {
							visible: minTimePickerVisible.value,
							format: timeFormat.value,
							"datetime-role": "start",
							"parsed-value": unref(minDate) || leftDate.value,
							onPick: handleMinTimePick
						}, null, 8, [
							"visible",
							"format",
							"parsed-value"
						])], 2)), [[unref(ClickOutside), handleMinTimeClose]])], 2),
						createBaseVNode("span", null, [createVNode(unref(ElIcon), null, {
							default: withCtx(() => [createVNode(unref(arrow_right_default))]),
							_: 1
						})]),
						createBaseVNode("span", { class: normalizeClass([unref(drpNs).e("editors-wrap"), "is-right"]) }, [createBaseVNode("span", { class: normalizeClass(unref(drpNs).e("time-picker-wrap")) }, [createVNode(unref(ElInput), {
							size: "small",
							class: normalizeClass(unref(drpNs).e("editor")),
							disabled: unref(rangeState).selecting || unref(dateRangeDisabled),
							placeholder: unref(t)("el.datepicker.endDate"),
							"model-value": maxVisibleDate.value,
							readonly: !unref(minDate) || !_ctx.editable,
							"validate-event": false,
							onInput: _cache[5] || (_cache[5] = (val) => handleDateInput(val, "max")),
							onChange: _cache[6] || (_cache[6] = (val) => handleDateChange(val, "max"))
						}, null, 8, [
							"class",
							"disabled",
							"placeholder",
							"model-value",
							"readonly"
						])], 2), withDirectives((openBlock(), createElementBlock("span", { class: normalizeClass(unref(drpNs).e("time-picker-wrap")) }, [createVNode(unref(ElInput), {
							size: "small",
							class: normalizeClass(unref(drpNs).e("editor")),
							disabled: unref(rangeState).selecting || unref(dateRangeDisabled),
							placeholder: unref(t)("el.datepicker.endTime"),
							"model-value": maxVisibleTime.value,
							readonly: !unref(minDate) || !_ctx.editable,
							"validate-event": false,
							onFocus: _cache[7] || (_cache[7] = ($event) => unref(minDate) && (maxTimePickerVisible.value = true)),
							onInput: _cache[8] || (_cache[8] = (val) => handleTimeInput(val, "max")),
							onChange: _cache[9] || (_cache[9] = (val) => handleTimeChange(val, "max"))
						}, null, 8, [
							"class",
							"disabled",
							"placeholder",
							"model-value",
							"readonly"
						]), createVNode(unref(panel_time_pick_default), {
							"datetime-role": "end",
							visible: maxTimePickerVisible.value,
							format: timeFormat.value,
							"parsed-value": unref(maxDate) || rightDate.value,
							onPick: handleMaxTimePick
						}, null, 8, [
							"visible",
							"format",
							"parsed-value"
						])], 2)), [[unref(ClickOutside), handleMaxTimeClose]])], 2)
					], 2)) : createCommentVNode("v-if", true),
					createBaseVNode("div", { class: normalizeClass([
						unref(ppNs).e("content"),
						unref(drpNs).e("content"),
						unref(drpNs).is("left", !_ctx.singlePanel)
					]) }, [
						createBaseVNode("div", { class: normalizeClass(unref(drpNs).e("header")) }, [
							createBaseVNode("button", {
								type: "button",
								class: normalizeClass([unref(ppNs).e("icon-btn"), "d-arrow-left"]),
								"aria-label": unref(t)(`el.datepicker.prevYear`),
								disabled: unref(dateRangeDisabled),
								onClick: leftPrevYear
							}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
								_: 1
							})])], 10, _hoisted_2$2),
							withDirectives(createBaseVNode("button", {
								type: "button",
								class: normalizeClass([unref(ppNs).e("icon-btn"), "arrow-left"]),
								"aria-label": unref(t)(`el.datepicker.prevMonth`),
								disabled: unref(dateRangeDisabled),
								onClick: leftPrevMonth
							}, [renderSlot(_ctx.$slots, "prev-month", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(arrow_left_default))]),
								_: 1
							})])], 10, _hoisted_3$2), [[vShow, unref(leftCurrentView) === "date"]]),
							_ctx.unlinkPanels || _ctx.singlePanel ? (openBlock(), createElementBlock("button", {
								key: 0,
								type: "button",
								disabled: !enableYearArrow.value || unref(dateRangeDisabled),
								class: normalizeClass([[unref(ppNs).e("icon-btn"), unref(ppNs).is("disabled", !enableYearArrow.value || unref(dateRangeDisabled))], "d-arrow-right"]),
								"aria-label": unref(t)(`el.datepicker.nextYear`),
								onClick: leftNextYear
							}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
								_: 1
							})])], 10, _hoisted_4$2)) : createCommentVNode("v-if", true),
							_ctx.unlinkPanels && unref(leftCurrentView) === "date" || _ctx.singlePanel ? (openBlock(), createElementBlock("button", {
								key: 1,
								type: "button",
								disabled: !enableMonthArrow.value || unref(dateRangeDisabled),
								class: normalizeClass([[unref(ppNs).e("icon-btn"), unref(ppNs).is("disabled", !enableMonthArrow.value || unref(dateRangeDisabled))], "arrow-right"]),
								"aria-label": unref(t)(`el.datepicker.nextMonth`),
								onClick: leftNextMonth
							}, [renderSlot(_ctx.$slots, "next-month", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(arrow_right_default))]),
								_: 1
							})])], 10, _hoisted_5$2)) : createCommentVNode("v-if", true),
							createBaseVNode("div", null, [createBaseVNode("span", {
								role: "button",
								class: normalizeClass(unref(drpNs).e("header-label")),
								"aria-live": "polite",
								tabindex: _ctx.disabled ? void 0 : 0,
								"aria-disabled": _ctx.disabled,
								onKeydown: _cache[10] || (_cache[10] = withKeys(($event) => unref(showLeftPicker)("year"), ["enter"])),
								onClick: _cache[11] || (_cache[11] = ($event) => unref(showLeftPicker)("year"))
							}, toDisplayString(unref(leftYearLabel)), 43, _hoisted_6), withDirectives(createBaseVNode("span", {
								role: "button",
								"aria-live": "polite",
								tabindex: _ctx.disabled ? void 0 : 0,
								"aria-disabled": _ctx.disabled,
								class: normalizeClass([unref(drpNs).e("header-label"), { active: unref(leftCurrentView) === "month" }]),
								onKeydown: _cache[12] || (_cache[12] = withKeys(($event) => unref(showLeftPicker)("month"), ["enter"])),
								onClick: _cache[13] || (_cache[13] = ($event) => unref(showLeftPicker)("month"))
							}, toDisplayString(unref(t)(`el.datepicker.month${leftDate.value.month() + 1}`)), 43, _hoisted_7), [[vShow, unref(leftCurrentView) === "date"]])])
						], 2),
						unref(leftCurrentView) === "date" ? (openBlock(), createBlock(basic_date_table_default, {
							key: 0,
							ref_key: "leftCurrentViewRef",
							ref: leftCurrentViewRef,
							"selection-mode": "range",
							date: leftDate.value,
							"min-date": unref(minDate),
							"max-date": unref(maxDate),
							"range-state": unref(rangeState),
							"disabled-date": unref(disabledDate),
							"cell-class-name": unref(cellClassName),
							"show-week-number": _ctx.showWeekNumber,
							disabled: unref(dateRangeDisabled),
							onChangerange: unref(handleChangeRange),
							onPick: handleRangePick,
							onSelect: unref(onSelect)
						}, null, 8, [
							"date",
							"min-date",
							"max-date",
							"range-state",
							"disabled-date",
							"cell-class-name",
							"show-week-number",
							"disabled",
							"onChangerange",
							"onSelect"
						])) : createCommentVNode("v-if", true),
						unref(leftCurrentView) === "year" ? (openBlock(), createBlock(basic_year_table_default, {
							key: 1,
							ref_key: "leftCurrentViewRef",
							ref: leftCurrentViewRef,
							"selection-mode": "year",
							date: leftDate.value,
							"disabled-date": unref(disabledDate),
							"parsed-value": _ctx.parsedValue,
							disabled: unref(dateRangeDisabled),
							onPick: unref(handleLeftYearPick)
						}, null, 8, [
							"date",
							"disabled-date",
							"parsed-value",
							"disabled",
							"onPick"
						])) : createCommentVNode("v-if", true),
						unref(leftCurrentView) === "month" ? (openBlock(), createBlock(basic_month_table_default, {
							key: 2,
							ref_key: "leftCurrentViewRef",
							ref: leftCurrentViewRef,
							"selection-mode": "month",
							date: leftDate.value,
							"parsed-value": _ctx.parsedValue,
							"disabled-date": unref(disabledDate),
							disabled: unref(dateRangeDisabled),
							onPick: unref(handleLeftMonthPick)
						}, null, 8, [
							"date",
							"parsed-value",
							"disabled-date",
							"disabled",
							"onPick"
						])) : createCommentVNode("v-if", true)
					], 2),
					!_ctx.singlePanel ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass([[unref(ppNs).e("content"), unref(drpNs).e("content")], "is-right"])
					}, [
						createBaseVNode("div", { class: normalizeClass(unref(drpNs).e("header")) }, [
							_ctx.unlinkPanels ? (openBlock(), createElementBlock("button", {
								key: 0,
								type: "button",
								disabled: !enableYearArrow.value || unref(dateRangeDisabled),
								class: normalizeClass([[unref(ppNs).e("icon-btn"), unref(ppNs).is("disabled", !enableYearArrow.value || unref(dateRangeDisabled))], "d-arrow-left"]),
								"aria-label": unref(t)(`el.datepicker.prevYear`),
								onClick: rightPrevYear
							}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
								_: 1
							})])], 10, _hoisted_8)) : createCommentVNode("v-if", true),
							_ctx.unlinkPanels && unref(rightCurrentView) === "date" ? (openBlock(), createElementBlock("button", {
								key: 1,
								type: "button",
								disabled: !enableMonthArrow.value || unref(dateRangeDisabled),
								class: normalizeClass([[unref(ppNs).e("icon-btn"), unref(ppNs).is("disabled", !enableMonthArrow.value || unref(dateRangeDisabled))], "arrow-left"]),
								"aria-label": unref(t)(`el.datepicker.prevMonth`),
								onClick: rightPrevMonth
							}, [renderSlot(_ctx.$slots, "prev-month", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(arrow_left_default))]),
								_: 1
							})])], 10, _hoisted_9)) : createCommentVNode("v-if", true),
							createBaseVNode("button", {
								type: "button",
								"aria-label": unref(t)(`el.datepicker.nextYear`),
								class: normalizeClass([unref(ppNs).e("icon-btn"), "d-arrow-right"]),
								disabled: unref(dateRangeDisabled),
								onClick: rightNextYear
							}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
								_: 1
							})])], 10, _hoisted_10),
							withDirectives(createBaseVNode("button", {
								type: "button",
								class: normalizeClass([unref(ppNs).e("icon-btn"), "arrow-right"]),
								disabled: unref(dateRangeDisabled),
								"aria-label": unref(t)(`el.datepicker.nextMonth`),
								onClick: rightNextMonth
							}, [renderSlot(_ctx.$slots, "next-month", {}, () => [createVNode(unref(ElIcon), null, {
								default: withCtx(() => [createVNode(unref(arrow_right_default))]),
								_: 1
							})])], 10, _hoisted_11), [[vShow, unref(rightCurrentView) === "date"]]),
							createBaseVNode("div", null, [createBaseVNode("span", {
								role: "button",
								class: normalizeClass(unref(drpNs).e("header-label")),
								"aria-live": "polite",
								tabindex: _ctx.disabled ? void 0 : 0,
								"aria-disabled": _ctx.disabled,
								onKeydown: _cache[14] || (_cache[14] = withKeys(($event) => unref(showRightPicker)("year"), ["enter"])),
								onClick: _cache[15] || (_cache[15] = ($event) => unref(showRightPicker)("year"))
							}, toDisplayString(unref(rightYearLabel)), 43, _hoisted_12), withDirectives(createBaseVNode("span", {
								role: "button",
								"aria-live": "polite",
								tabindex: _ctx.disabled ? void 0 : 0,
								"aria-disabled": _ctx.disabled,
								class: normalizeClass([unref(drpNs).e("header-label"), { active: unref(rightCurrentView) === "month" }]),
								onKeydown: _cache[16] || (_cache[16] = withKeys(($event) => unref(showRightPicker)("month"), ["enter"])),
								onClick: _cache[17] || (_cache[17] = ($event) => unref(showRightPicker)("month"))
							}, toDisplayString(unref(t)(`el.datepicker.month${rightDate.value.month() + 1}`)), 43, _hoisted_13), [[vShow, unref(rightCurrentView) === "date"]])])
						], 2),
						unref(rightCurrentView) === "date" ? (openBlock(), createBlock(basic_date_table_default, {
							key: 0,
							ref_key: "rightCurrentViewRef",
							ref: rightCurrentViewRef,
							"selection-mode": "range",
							date: rightDate.value,
							"min-date": unref(minDate),
							"max-date": unref(maxDate),
							"range-state": unref(rangeState),
							"disabled-date": unref(disabledDate),
							"cell-class-name": unref(cellClassName),
							"show-week-number": _ctx.showWeekNumber,
							disabled: unref(dateRangeDisabled),
							onChangerange: unref(handleChangeRange),
							onPick: handleRangePick,
							onSelect: unref(onSelect)
						}, null, 8, [
							"date",
							"min-date",
							"max-date",
							"range-state",
							"disabled-date",
							"cell-class-name",
							"show-week-number",
							"disabled",
							"onChangerange",
							"onSelect"
						])) : createCommentVNode("v-if", true),
						unref(rightCurrentView) === "year" ? (openBlock(), createBlock(basic_year_table_default, {
							key: 1,
							ref_key: "rightCurrentViewRef",
							ref: rightCurrentViewRef,
							"selection-mode": "year",
							date: rightDate.value,
							"disabled-date": unref(disabledDate),
							"parsed-value": _ctx.parsedValue,
							disabled: unref(dateRangeDisabled),
							onPick: unref(handleRightYearPick)
						}, null, 8, [
							"date",
							"disabled-date",
							"parsed-value",
							"disabled",
							"onPick"
						])) : createCommentVNode("v-if", true),
						unref(rightCurrentView) === "month" ? (openBlock(), createBlock(basic_month_table_default, {
							key: 2,
							ref_key: "rightCurrentViewRef",
							ref: rightCurrentViewRef,
							"selection-mode": "month",
							date: rightDate.value,
							"parsed-value": _ctx.parsedValue,
							"disabled-date": unref(disabledDate),
							disabled: unref(dateRangeDisabled),
							onPick: unref(handleRightMonthPick)
						}, null, 8, [
							"date",
							"parsed-value",
							"disabled-date",
							"disabled",
							"onPick"
						])) : createCommentVNode("v-if", true)
					], 2)) : createCommentVNode("v-if", true)
				], 2)
			], 2), _ctx.showFooter && showTime.value && (_ctx.showConfirm || unref(clearable)) ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(unref(ppNs).e("footer"))
			}, [unref(clearable) ? (openBlock(), createBlock(unref(ElButton), {
				key: 0,
				text: "",
				size: "small",
				class: normalizeClass(unref(ppNs).e("link-btn")),
				onClick: onClear
			}, {
				default: withCtx(() => [createTextVNode(toDisplayString(unref(t)("el.datepicker.clear")), 1)]),
				_: 1
			}, 8, ["class"])) : createCommentVNode("v-if", true), _ctx.showConfirm ? (openBlock(), createBlock(unref(ElButton), {
				key: 1,
				plain: "",
				size: "small",
				class: normalizeClass(unref(ppNs).e("link-btn")),
				disabled: btnDisabled.value,
				onClick: _cache[18] || (_cache[18] = ($event) => unref(handleRangeConfirm)(false))
			}, {
				default: withCtx(() => [createTextVNode(toDisplayString(unref(t)("el.datepicker.confirm")), 1)]),
				_: 1
			}, 8, ["class", "disabled"])) : createCommentVNode("v-if", true)], 2)) : createCommentVNode("v-if", true)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/panel-month-range.mjs
var panelMonthRangeProps = buildProps({ ...panelRangeSharedProps });
var panelMonthRangeEmits = [
	"pick",
	"set-picker-option",
	"calendar-change"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/composables/use-month-range-header.mjs
var useMonthRangeHeader = ({ unlinkPanels, leftDate, rightDate }) => {
	const { t } = useLocale();
	const leftPrevYear = () => {
		leftDate.value = leftDate.value.subtract(1, "year");
		if (!unlinkPanels.value) rightDate.value = rightDate.value.subtract(1, "year");
	};
	const rightNextYear = () => {
		if (!unlinkPanels.value) leftDate.value = leftDate.value.add(1, "year");
		rightDate.value = rightDate.value.add(1, "year");
	};
	const leftNextYear = () => {
		leftDate.value = leftDate.value.add(1, "year");
	};
	const rightPrevYear = () => {
		rightDate.value = rightDate.value.subtract(1, "year");
	};
	return {
		leftPrevYear,
		rightNextYear,
		leftNextYear,
		rightPrevYear,
		leftLabel: computed(() => {
			return `${leftDate.value.year()} ${t("el.datepicker.year")}`;
		}),
		rightLabel: computed(() => {
			return `${rightDate.value.year()} ${t("el.datepicker.year")}`;
		}),
		leftYear: computed(() => {
			return leftDate.value.year();
		}),
		rightYear: computed(() => {
			return rightDate.value.year() === leftDate.value.year() ? leftDate.value.year() + 1 : rightDate.value.year();
		})
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-month-range.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = ["disabled", "onClick"];
var _hoisted_2$1 = ["disabled"];
var _hoisted_3$1 = ["disabled"];
var _hoisted_4$1 = ["disabled"];
var _hoisted_5$1 = ["disabled"];
var unit$1 = "year";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-month-range.mjs
var panel_month_range_default = /* @__PURE__ */ defineComponent({
	name: "DatePickerMonthRange",
	__name: "panel-month-range",
	props: panelMonthRangeProps,
	emits: panelMonthRangeEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { lang } = useLocale();
		const pickerBase = inject(PICKER_BASE_INJECTION_KEY);
		const isDefaultFormat = inject(ROOT_PICKER_IS_DEFAULT_FORMAT_INJECTION_KEY, void 0);
		const { shortcuts, disabledDate, cellClassName } = pickerBase.props;
		const format = toRef(pickerBase.props, "format");
		const defaultValue = toRef(pickerBase.props, "defaultValue");
		const leftDate = ref((0, import_dayjs_min.default)().locale(lang.value));
		const rightDate = ref((0, import_dayjs_min.default)().locale(lang.value).add(1, unit$1));
		const { minDate, maxDate, rangeState, ppNs, drpNs, handleChangeRange, handleRangeConfirm, handleShortcutClick, onSelect, parseValue } = useRangePicker(props, {
			defaultValue,
			leftDate,
			rightDate,
			unit: unit$1,
			sortDates
		});
		const hasShortcuts = computed(() => !!shortcuts.length);
		const { leftPrevYear, rightNextYear, leftNextYear, rightPrevYear, leftLabel, rightLabel, leftYear, rightYear } = useMonthRangeHeader({
			unlinkPanels: toRef(props, "unlinkPanels"),
			leftDate,
			rightDate
		});
		const enableYearArrow = computed(() => {
			return props.singlePanel || props.unlinkPanels && rightYear.value > leftYear.value + 1;
		});
		const handleRangePick = (val, close = true) => {
			const minDate_ = val.minDate;
			const maxDate_ = val.maxDate;
			if (maxDate.value === maxDate_ && minDate.value === minDate_) return;
			emit("calendar-change", [minDate_.toDate(), maxDate_ && maxDate_.toDate()]);
			maxDate.value = maxDate_;
			minDate.value = minDate_;
			if (!close) return;
			handleRangeConfirm();
		};
		const handleClear = () => {
			let valueOnClear = null;
			if (pickerBase?.emptyValues) valueOnClear = pickerBase.emptyValues.valueOnClear.value;
			leftDate.value = getDefaultValue(unref(defaultValue), {
				lang: unref(lang),
				unit: "year",
				unlinkPanels: props.unlinkPanels
			})[0];
			rightDate.value = leftDate.value.add(1, "year");
			emit("pick", valueOnClear);
		};
		const parseUserInput = (value) => {
			return correctlyParseUserInput(value, format.value, lang.value, isDefaultFormat);
		};
		function sortDates(minDate, maxDate) {
			if (props.unlinkPanels && maxDate) rightDate.value = (minDate?.year() || 0) === maxDate.year() ? maxDate.add(1, unit$1) : maxDate;
			else rightDate.value = leftDate.value.add(1, unit$1);
		}
		const monthRangeDisabled = useFormDisabled();
		watch(() => props.visible, (visible) => {
			if (!visible && rangeState.value.selecting) {
				parseValue(props.parsedValue);
				onSelect(false);
			}
		});
		emit("set-picker-option", ["isValidValue", isValidRange]);
		emit("set-picker-option", ["parseUserInput", parseUserInput]);
		emit("set-picker-option", ["handleClear", handleClear]);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass([
				unref(ppNs).b(),
				unref(drpNs).b(),
				unref(ppNs).is("border", _ctx.border),
				unref(ppNs).is("disabled", unref(monthRangeDisabled)),
				{
					"has-sidebar": Boolean(_ctx.$slots.sidebar) || hasShortcuts.value,
					"single-panel": _ctx.singlePanel
				}
			]) }, [createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body-wrapper")) }, [
				renderSlot(_ctx.$slots, "sidebar", { class: normalizeClass(unref(ppNs).e("sidebar")) }),
				hasShortcuts.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ppNs).e("sidebar"))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(shortcuts), (shortcut, key) => {
					return openBlock(), createElementBlock("button", {
						key,
						type: "button",
						class: normalizeClass(unref(ppNs).e("shortcut")),
						disabled: unref(monthRangeDisabled),
						onClick: ($event) => unref(handleShortcutClick)(shortcut)
					}, toDisplayString(shortcut.text), 11, _hoisted_1$1);
				}), 128))], 2)) : createCommentVNode("v-if", true),
				createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body")) }, [createBaseVNode("div", { class: normalizeClass([
					unref(ppNs).e("content"),
					unref(drpNs).e("content"),
					unref(drpNs).is("left", !_ctx.singlePanel)
				]) }, [createBaseVNode("div", { class: normalizeClass(unref(drpNs).e("header")) }, [
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass([unref(ppNs).e("icon-btn"), "d-arrow-left"]),
						disabled: unref(monthRangeDisabled),
						onClick: _cache[0] || (_cache[0] = (...args) => unref(leftPrevYear) && unref(leftPrevYear)(...args))
					}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
						_: 1
					})])], 10, _hoisted_2$1),
					_ctx.unlinkPanels || _ctx.singlePanel ? (openBlock(), createElementBlock("button", {
						key: 0,
						type: "button",
						disabled: !enableYearArrow.value || unref(monthRangeDisabled),
						class: normalizeClass([[unref(ppNs).e("icon-btn"), unref(ppNs).is("disabled", !enableYearArrow.value || unref(monthRangeDisabled))], "d-arrow-right"]),
						onClick: _cache[1] || (_cache[1] = (...args) => unref(leftNextYear) && unref(leftNextYear)(...args))
					}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
						_: 1
					})])], 10, _hoisted_3$1)) : createCommentVNode("v-if", true),
					createBaseVNode("div", null, toDisplayString(unref(leftLabel)), 1)
				], 2), createVNode(basic_month_table_default, {
					"selection-mode": "range",
					date: leftDate.value,
					"min-date": unref(minDate),
					"max-date": unref(maxDate),
					"range-state": unref(rangeState),
					"disabled-date": unref(disabledDate),
					disabled: unref(monthRangeDisabled),
					"cell-class-name": unref(cellClassName),
					onChangerange: unref(handleChangeRange),
					onPick: handleRangePick,
					onSelect: unref(onSelect)
				}, null, 8, [
					"date",
					"min-date",
					"max-date",
					"range-state",
					"disabled-date",
					"disabled",
					"cell-class-name",
					"onChangerange",
					"onSelect"
				])], 2), !_ctx.singlePanel ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass([[unref(ppNs).e("content"), unref(drpNs).e("content")], "is-right"])
				}, [createBaseVNode("div", { class: normalizeClass(unref(drpNs).e("header")) }, [
					_ctx.unlinkPanels ? (openBlock(), createElementBlock("button", {
						key: 0,
						type: "button",
						disabled: !enableYearArrow.value || unref(monthRangeDisabled),
						class: normalizeClass([[unref(ppNs).e("icon-btn"), unref(ppNs).is("disabled", !enableYearArrow.value || unref(monthRangeDisabled))], "d-arrow-left"]),
						onClick: _cache[2] || (_cache[2] = (...args) => unref(rightPrevYear) && unref(rightPrevYear)(...args))
					}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
						_: 1
					})])], 10, _hoisted_4$1)) : createCommentVNode("v-if", true),
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass([unref(ppNs).e("icon-btn"), "d-arrow-right"]),
						disabled: unref(monthRangeDisabled),
						onClick: _cache[3] || (_cache[3] = (...args) => unref(rightNextYear) && unref(rightNextYear)(...args))
					}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
						_: 1
					})])], 10, _hoisted_5$1),
					createBaseVNode("div", null, toDisplayString(unref(rightLabel)), 1)
				], 2), createVNode(basic_month_table_default, {
					"selection-mode": "range",
					date: rightDate.value,
					"min-date": unref(minDate),
					"max-date": unref(maxDate),
					"range-state": unref(rangeState),
					"disabled-date": unref(disabledDate),
					disabled: unref(monthRangeDisabled),
					"cell-class-name": unref(cellClassName),
					onChangerange: unref(handleChangeRange),
					onPick: handleRangePick,
					onSelect: unref(onSelect)
				}, null, 8, [
					"date",
					"min-date",
					"max-date",
					"range-state",
					"disabled-date",
					"disabled",
					"cell-class-name",
					"onChangerange",
					"onSelect"
				])], 2)) : createCommentVNode("v-if", true)], 2)
			], 2)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/props/panel-year-range.mjs
var panelYearRangeProps = buildProps({ ...panelRangeSharedProps });
var panelYearRangeEmits = [
	"pick",
	"set-picker-option",
	"calendar-change"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/composables/use-year-range-header.mjs
var useYearRangeHeader = ({ unlinkPanels, leftDate, rightDate }) => {
	const leftPrevYear = () => {
		leftDate.value = leftDate.value.subtract(10, "year");
		if (!unlinkPanels.value) rightDate.value = rightDate.value.subtract(10, "year");
	};
	const rightNextYear = () => {
		if (!unlinkPanels.value) leftDate.value = leftDate.value.add(10, "year");
		rightDate.value = rightDate.value.add(10, "year");
	};
	const leftNextYear = () => {
		leftDate.value = leftDate.value.add(10, "year");
	};
	const rightPrevYear = () => {
		rightDate.value = rightDate.value.subtract(10, "year");
	};
	return {
		leftPrevYear,
		rightNextYear,
		leftNextYear,
		rightPrevYear,
		leftLabel: computed(() => {
			const leftStartDate = Math.floor(leftDate.value.year() / 10) * 10;
			return `${leftStartDate}-${leftStartDate + 9}`;
		}),
		rightLabel: computed(() => {
			const rightStartDate = Math.floor(rightDate.value.year() / 10) * 10;
			return `${rightStartDate}-${rightStartDate + 9}`;
		}),
		leftYear: computed(() => {
			return Math.floor(leftDate.value.year() / 10) * 10 + 9;
		}),
		rightYear: computed(() => {
			return Math.floor(rightDate.value.year() / 10) * 10;
		})
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-year-range.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["disabled", "onClick"];
var _hoisted_2 = ["disabled"];
var _hoisted_3 = ["disabled"];
var _hoisted_4 = ["disabled"];
var _hoisted_5 = ["disabled"];
var step = 10;
var unit = "year";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-com/panel-year-range.mjs
var panel_year_range_default = /* @__PURE__ */ defineComponent({
	name: "DatePickerYearRange",
	__name: "panel-year-range",
	props: panelYearRangeProps,
	emits: panelYearRangeEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { lang } = useLocale();
		const leftDate = ref((0, import_dayjs_min.default)().locale(lang.value));
		const rightDate = ref((0, import_dayjs_min.default)().locale(lang.value).add(step, unit));
		const isDefaultFormat = inject(ROOT_PICKER_IS_DEFAULT_FORMAT_INJECTION_KEY, void 0);
		const pickerBase = inject(PICKER_BASE_INJECTION_KEY);
		const { shortcuts, disabledDate, cellClassName } = pickerBase.props;
		const format = toRef(pickerBase.props, "format");
		const defaultValue = toRef(pickerBase.props, "defaultValue");
		const { minDate, maxDate, rangeState, ppNs, drpNs, handleChangeRange, handleRangeConfirm, handleShortcutClick, onSelect, parseValue } = useRangePicker(props, {
			defaultValue,
			leftDate,
			rightDate,
			step,
			unit,
			sortDates
		});
		const { leftPrevYear, rightNextYear, leftNextYear, rightPrevYear, leftLabel, rightLabel, leftYear, rightYear } = useYearRangeHeader({
			unlinkPanels: toRef(props, "unlinkPanels"),
			leftDate,
			rightDate
		});
		const yearRangeDisabled = useFormDisabled();
		const hasShortcuts = computed(() => !!shortcuts.length);
		const panelKls = computed(() => [
			ppNs.b(),
			drpNs.b(),
			ppNs.is("border", props.border),
			ppNs.is("disabled", yearRangeDisabled.value),
			{
				"has-sidebar": Boolean(useSlots().sidebar) || hasShortcuts.value,
				"single-panel": props.singlePanel
			}
		]);
		const leftPanelKls = computed(() => {
			return {
				content: [
					ppNs.e("content"),
					drpNs.e("content"),
					drpNs.is("left", !props.singlePanel)
				],
				arrowLeftBtn: [ppNs.e("icon-btn"), "d-arrow-left"],
				arrowRightBtn: [
					ppNs.e("icon-btn"),
					ppNs.is("disabled", !enableYearArrow.value || yearRangeDisabled.value),
					"d-arrow-right"
				]
			};
		});
		const rightPanelKls = computed(() => {
			return {
				content: [
					ppNs.e("content"),
					drpNs.e("content"),
					"is-right"
				],
				arrowLeftBtn: [
					ppNs.e("icon-btn"),
					ppNs.is("disabled", !enableYearArrow.value || yearRangeDisabled.value),
					"d-arrow-left"
				],
				arrowRightBtn: [ppNs.e("icon-btn"), "d-arrow-right"]
			};
		});
		const enableYearArrow = computed(() => {
			return props.singlePanel || props.unlinkPanels && rightYear.value > leftYear.value + 1;
		});
		const handleRangePick = (val, close = true) => {
			const minDate_ = val.minDate;
			const maxDate_ = val.maxDate;
			if (maxDate.value === maxDate_ && minDate.value === minDate_) return;
			emit("calendar-change", [minDate_.toDate(), maxDate_ && maxDate_.toDate()]);
			maxDate.value = maxDate_;
			minDate.value = minDate_;
			if (!close) return;
			handleRangeConfirm();
		};
		const parseUserInput = (value) => {
			return correctlyParseUserInput(value, format.value, lang.value, isDefaultFormat);
		};
		const isValidValue = (date) => {
			return isValidRange(date) && (disabledDate ? !disabledDate(date[0].toDate()) && !disabledDate(date[1].toDate()) : true);
		};
		const handleClear = () => {
			let valueOnClear = null;
			if (pickerBase?.emptyValues) valueOnClear = pickerBase.emptyValues.valueOnClear.value;
			const defaultArr = getDefaultValue(unref(defaultValue), {
				lang: unref(lang),
				step,
				unit,
				unlinkPanels: props.unlinkPanels
			});
			leftDate.value = defaultArr[0];
			rightDate.value = defaultArr[1];
			emit("pick", valueOnClear);
		};
		function sortDates(minDate, maxDate) {
			if (props.unlinkPanels && maxDate) {
				const minDateYear = minDate?.year() || 0;
				const maxDateYear = maxDate.year();
				rightDate.value = minDateYear + step > maxDateYear ? maxDate.add(step, unit) : maxDate;
			} else rightDate.value = leftDate.value.add(step, unit);
		}
		watch(() => props.visible, (visible) => {
			if (!visible && rangeState.value.selecting) {
				parseValue(props.parsedValue);
				onSelect(false);
			}
		});
		emit("set-picker-option", ["isValidValue", isValidValue]);
		emit("set-picker-option", ["parseUserInput", parseUserInput]);
		emit("set-picker-option", ["handleClear", handleClear]);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(panelKls.value) }, [createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body-wrapper")) }, [
				renderSlot(_ctx.$slots, "sidebar", { class: normalizeClass(unref(ppNs).e("sidebar")) }),
				hasShortcuts.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ppNs).e("sidebar"))
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(shortcuts), (shortcut, key) => {
					return openBlock(), createElementBlock("button", {
						key,
						type: "button",
						class: normalizeClass(unref(ppNs).e("shortcut")),
						disabled: unref(yearRangeDisabled),
						onClick: ($event) => unref(handleShortcutClick)(shortcut)
					}, toDisplayString(shortcut.text), 11, _hoisted_1);
				}), 128))], 2)) : createCommentVNode("v-if", true),
				createBaseVNode("div", { class: normalizeClass(unref(ppNs).e("body")) }, [createBaseVNode("div", { class: normalizeClass(leftPanelKls.value.content) }, [createBaseVNode("div", { class: normalizeClass(unref(drpNs).e("header")) }, [
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass(leftPanelKls.value.arrowLeftBtn),
						disabled: unref(yearRangeDisabled),
						onClick: _cache[0] || (_cache[0] = (...args) => unref(leftPrevYear) && unref(leftPrevYear)(...args))
					}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
						_: 1
					})])], 10, _hoisted_2),
					_ctx.unlinkPanels || _ctx.singlePanel ? (openBlock(), createElementBlock("button", {
						key: 0,
						type: "button",
						disabled: !enableYearArrow.value || unref(yearRangeDisabled),
						class: normalizeClass(leftPanelKls.value.arrowRightBtn),
						onClick: _cache[1] || (_cache[1] = (...args) => unref(leftNextYear) && unref(leftNextYear)(...args))
					}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
						_: 1
					})])], 10, _hoisted_3)) : createCommentVNode("v-if", true),
					createBaseVNode("div", null, toDisplayString(unref(leftLabel)), 1)
				], 2), createVNode(basic_year_table_default, {
					"selection-mode": "range",
					date: leftDate.value,
					"min-date": unref(minDate),
					"max-date": unref(maxDate),
					"range-state": unref(rangeState),
					"disabled-date": unref(disabledDate),
					disabled: unref(yearRangeDisabled),
					"cell-class-name": unref(cellClassName),
					onChangerange: unref(handleChangeRange),
					onPick: handleRangePick,
					onSelect: unref(onSelect)
				}, null, 8, [
					"date",
					"min-date",
					"max-date",
					"range-state",
					"disabled-date",
					"disabled",
					"cell-class-name",
					"onChangerange",
					"onSelect"
				])], 2), !_ctx.singlePanel ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(rightPanelKls.value.content)
				}, [createBaseVNode("div", { class: normalizeClass(unref(drpNs).e("header")) }, [
					_ctx.unlinkPanels ? (openBlock(), createElementBlock("button", {
						key: 0,
						type: "button",
						disabled: !enableYearArrow.value || unref(yearRangeDisabled),
						class: normalizeClass(rightPanelKls.value.arrowLeftBtn),
						onClick: _cache[2] || (_cache[2] = (...args) => unref(rightPrevYear) && unref(rightPrevYear)(...args))
					}, [renderSlot(_ctx.$slots, "prev-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_left_default))]),
						_: 1
					})])], 10, _hoisted_4)) : createCommentVNode("v-if", true),
					createBaseVNode("button", {
						type: "button",
						class: normalizeClass(rightPanelKls.value.arrowRightBtn),
						disabled: unref(yearRangeDisabled),
						onClick: _cache[3] || (_cache[3] = (...args) => unref(rightNextYear) && unref(rightNextYear)(...args))
					}, [renderSlot(_ctx.$slots, "next-year", {}, () => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(d_arrow_right_default))]),
						_: 1
					})])], 10, _hoisted_5),
					createBaseVNode("div", null, toDisplayString(unref(rightLabel)), 1)
				], 2), createVNode(basic_year_table_default, {
					"selection-mode": "range",
					date: rightDate.value,
					"min-date": unref(minDate),
					"max-date": unref(maxDate),
					"range-state": unref(rangeState),
					"disabled-date": unref(disabledDate),
					disabled: unref(yearRangeDisabled),
					"cell-class-name": unref(cellClassName),
					onChangerange: unref(handleChangeRange),
					onPick: handleRangePick,
					onSelect: unref(onSelect)
				}, null, 8, [
					"date",
					"min-date",
					"max-date",
					"range-state",
					"disabled-date",
					"disabled",
					"cell-class-name",
					"onChangerange",
					"onSelect"
				])], 2)) : createCommentVNode("v-if", true)], 2)
			], 2)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/panel-utils.mjs
var getPanel = function(type) {
	switch (type) {
		case "daterange":
		case "datetimerange": return panel_date_range_default;
		case "monthrange": return panel_month_range_default;
		case "yearrange": return panel_year_range_default;
		default: return panel_date_pick_default;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/weekOfYear.js
var require_weekOfYear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, t) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_weekOfYear = t();
	})(exports, (function() {
		"use strict";
		var e = "week", t = "year";
		return function(i, n, r) {
			var f = n.prototype;
			f.week = function(i) {
				if (void 0 === i && (i = null), null !== i) return this.add(7 * (i - this.week()), "day");
				var n = this.$locale().yearStart || 1;
				if (11 === this.month() && this.date() > 25) {
					var f = r(this).startOf(t).add(1, t).date(n), s = r(this).endOf(e);
					if (f.isBefore(s)) return 1;
				}
				var a = r(this).startOf(t).date(n).startOf(e).subtract(1, "millisecond"), o = this.diff(a, e, !0);
				return o < 0 ? r(this).startOf("week").week() : Math.ceil(o);
			}, f.weeks = function(e) {
				return void 0 === e && (e = null), this.week(e);
			};
		};
	}));
}));
//#endregion
//#region ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/weekYear.js
var require_weekYear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, t) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_weekYear = t();
	})(exports, (function() {
		"use strict";
		return function(e, t) {
			t.prototype.weekYear = function() {
				var e = this.month(), t = this.week(), n = this.year();
				return 1 === t && 11 === e ? n + 1 : 0 === e && t >= 52 ? n - 1 : n;
			};
		};
	}));
}));
//#endregion
//#region ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/dayOfYear.js
var require_dayOfYear = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, t) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_dayOfYear = t();
	})(exports, (function() {
		"use strict";
		return function(e, t, n) {
			t.prototype.dayOfYear = function(e) {
				var t = Math.round((n(this).startOf("day") - n(this).startOf("year")) / 864e5) + 1;
				return null == e ? t : this.add(e - t, "day");
			};
		};
	}));
}));
//#endregion
//#region ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/isSameOrAfter.js
var require_isSameOrAfter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, t) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_isSameOrAfter = t();
	})(exports, (function() {
		"use strict";
		return function(e, t) {
			t.prototype.isSameOrAfter = function(e, t) {
				return this.isSame(e, t) || this.isAfter(e, t);
			};
		};
	}));
}));
//#endregion
//#region ../../node_modules/.pnpm/dayjs@1.11.21/node_modules/dayjs/plugin/isSameOrBefore.js
var require_isSameOrBefore = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(e, i) {
		"object" == typeof exports && "undefined" != typeof module ? module.exports = i() : "function" == typeof define && define.amd ? define(i) : (e = "undefined" != typeof globalThis ? globalThis : e || self).dayjs_plugin_isSameOrBefore = i();
	})(exports, (function() {
		"use strict";
		return function(e, i) {
			i.prototype.isSameOrBefore = function(e, i) {
				return this.isSame(e, i) || this.isBefore(e, i);
			};
		};
	}));
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/src/date-picker-panel.mjs
var import_customParseFormat = /* @__PURE__ */ __toESM(require_customParseFormat(), 1);
var import_localeData = /* @__PURE__ */ __toESM(require_localeData(), 1);
var import_advancedFormat = /* @__PURE__ */ __toESM(require_advancedFormat(), 1);
var import_weekOfYear = /* @__PURE__ */ __toESM(require_weekOfYear(), 1);
var import_weekYear = /* @__PURE__ */ __toESM(require_weekYear(), 1);
var import_dayOfYear = /* @__PURE__ */ __toESM(require_dayOfYear(), 1);
var import_isSameOrAfter = /* @__PURE__ */ __toESM(require_isSameOrAfter(), 1);
var import_isSameOrBefore = /* @__PURE__ */ __toESM(require_isSameOrBefore(), 1);
function _isSlot$1(s) {
	return typeof s === "function" || Object.prototype.toString.call(s) === "[object Object]" && !isVNode(s);
}
import_dayjs_min.default.extend(import_localeData.default);
import_dayjs_min.default.extend(import_advancedFormat.default);
import_dayjs_min.default.extend(import_customParseFormat.default);
import_dayjs_min.default.extend(import_weekOfYear.default);
import_dayjs_min.default.extend(import_weekYear.default);
import_dayjs_min.default.extend(import_dayOfYear.default);
import_dayjs_min.default.extend(import_isSameOrAfter.default);
import_dayjs_min.default.extend(import_isSameOrBefore.default);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker-panel/index.mjs
var ElDatePickerPanel = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElDatePickerPanel",
	install: null,
	inheritAttrs: false,
	props: datePickerPanelProps,
	emits: [
		UPDATE_MODEL_EVENT,
		"calendar-change",
		"panel-change",
		"visible-change",
		"clear"
	],
	setup(props, { slots, emit, attrs }) {
		const ns = useNamespace("picker-panel");
		if (isUndefined(inject("EP_PICKER_BASE", void 0))) provide(PICKER_BASE_INJECTION_KEY, { props: reactive({ ...toRefs(props) }) });
		provide(ROOT_PICKER_INJECTION_KEY, {
			slots,
			pickerNs: ns
		});
		const { parsedValue, onCalendarChange, onPanelChange, onSetPickerOption, onPick } = inject(ROOT_COMMON_PICKER_INJECTION_KEY, () => useCommonPicker(props, emit), true);
		return () => {
			return createVNode(getPanel(props.type), mergeProps(omit(attrs, "onPick"), props, {
				"parsedValue": parsedValue.value,
				"onSet-picker-option": onSetPickerOption,
				"onCalendar-change": onCalendarChange,
				"onPanel-change": onPanelChange,
				"onClear": () => emit("clear"),
				"onPick": onPick
			}), _isSlot$1(slots) ? slots : { default: () => [slots] });
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker/src/props.mjs
var datePickerProps = buildProps({
	...timePickerDefaultProps,
	/**
	* @description type of the picker
	*/
	type: {
		type: definePropType(String),
		default: "date"
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker/src/date-picker.mjs
function _isSlot(s) {
	return typeof s === "function" || Object.prototype.toString.call(s) === "[object Object]" && !isVNode(s);
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/date-picker/index.mjs
var ElDatePicker = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElDatePicker",
	install: null,
	props: datePickerProps,
	emits: [UPDATE_MODEL_EVENT],
	setup(props, { expose, emit, slots }) {
		provide(ROOT_PICKER_IS_DEFAULT_FORMAT_INJECTION_KEY, computed(() => {
			return !props.format;
		}));
		provide(PICKER_POPPER_OPTIONS_INJECTION_KEY, reactive(toRef(props, "popperOptions")));
		const commonPicker = ref();
		expose({
			focus: () => {
				commonPicker.value?.focus();
			},
			blur: () => {
				commonPicker.value?.blur();
			},
			handleOpen: () => {
				commonPicker.value?.handleOpen();
			},
			handleClose: () => {
				commonPicker.value?.handleClose();
			}
		});
		const onModelValueUpdated = (val) => {
			emit(UPDATE_MODEL_EVENT, val);
		};
		return () => {
			return createVNode(picker_default, mergeProps(props, {
				"format": props.format ?? (DEFAULT_FORMATS_DATEPICKER[props.type] || "YYYY-MM-DD"),
				"type": props.type,
				"ref": commonPicker,
				"onUpdate:modelValue": onModelValueUpdated
			}), {
				default: (scopedProps) => createVNode(ElDatePickerPanel, mergeProps({
					"disabled": props.disabled,
					"editable": props.editable,
					"border": false
				}, scopedProps), _isSlot(slots) ? slots : { default: () => [slots] }),
				"range-separator": slots["range-separator"]
			});
		};
	}
}));
//#endregion
export { basic_time_spinner_default as a, useTimePanel as c, timePanelSharedProps as d, rangeArr as f, WEEK_DAYS as g, PICKER_POPPER_OPTIONS_INJECTION_KEY as h, panel_time_pick_default as i, picker_default as l, PICKER_BASE_INJECTION_KEY as m, ElDatePickerPanel as n, buildAvailableTimeSlotGetter as o, DEFAULT_FORMATS_DATE as p, require_localeData as r, useOldValue as s, ElDatePicker as t, timePickerDefaultProps as u };
