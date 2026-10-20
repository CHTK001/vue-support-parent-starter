import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $n as normalizeClass, An as NOOP, B as h, Bn as isFunction, D as createVNode, E as createTextVNode, Gn as isPromise, Hn as isObject, Ht as watch, J as inject, Jn as isString, L as getCurrentInstance, Lt as useSlots, Nt as useAttrs, On as unref, Pn as hasOwn, Rn as isArray, Tn as toRefs, Ut as watchEffect, Yt as withDirectives, _ as createBaseVNode, at as onBeforeUpdate, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, fn as markRaw, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, nt as onActivated, o as Fragment, pt as onUpdated, qt as withCtx, r as Comment, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, w as createSlots, wt as resolveDynamicComponent, xn as shallowRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { a as EVENT_CODE, n as getEventCode } from "./event-BIZRdi1l.js";
import { a as basic_time_spinner_default, c as useTimePanel, d as timePanelSharedProps, h as PICKER_POPPER_OPTIONS_INJECTION_KEY, i as panel_time_pick_default, l as picker_default, m as PICKER_BASE_INJECTION_KEY, o as buildAvailableTimeSlotGetter, s as useOldValue, u as timePickerDefaultProps } from "./date-picker-D-vMtORE.js";
import { n as INPUT_EVENT, r as UPDATE_MODEL_EVENT, t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { a as memoize } from "./_baseGet-DmmfCxUg.js";
import { t as baseFlatten } from "./_baseFlatten-D6objHuc.js";
import { t as union } from "./union-CKG0-ouI.js";
import { t as clamp } from "./clamp--xaQdoQg.js";
import { t as cloneDeep } from "./cloneDeep-BJ4zGpri.js";
import { t as debounce } from "./debounce-DfrQLO3V.js";
import { r as ElSelect } from "./select-0mzxLp1O.js";
import { _ as isNil, a as throwError, c as definePropType, d as isEmpty, f as isNumber, h as isUndefined, i as debugWarn, l as isBoolean, o as buildProp, p as isPropAbsent, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as isEqual$1 } from "./isEqual-BgqgQyvI.js";
import { t as pick } from "./pick-BwGnaelS.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { a as isClient, f as reactiveComputed, t as clamp$1, v as useDebounceFn } from "./dist-DI3cGDuP.js";
import { h as useResizeObserver, o as useCssVar, u as useEventListener } from "./dist-Clzx2YUA.js";
import { a as isLeaf, n as focusNode, r as getSibling } from "./aria-DKP9Ei-1.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { o as scrollIntoView } from "./scroll-CaaKdoVq.js";
import { n as rAF, t as cAF } from "./raf-Ck-OXP6t.js";
import { a as castArray, r as useTooltipContentProps, s as unique, t as ElTooltip, u as Ee } from "./tooltip-DEX5DBfd.js";
import { n as useFormSize, t as useFormDisabled } from "./use-form-common-props-DzQ9ZY64.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { a as useWheel, r as getClientXY } from "./tabs-BrnjuAVT.js";
import { n as useFocusController, t as useComposition } from "./use-composition-BHiYKdrO.js";
import { n as useEmptyValues, r as useEmptyValuesProps } from "./use-empty-values-B_20a6o3.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { Jt as star_filled_default, S as clock_default, _ as check_default, a as arrow_right_default, b as circle_close_default, dt as loading_default, qt as star_default, r as arrow_down_default, w as close_default } from "./dist-DogtK295.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { n as formItemContextKey } from "./constants-ntbKDiND.js";
import { n as useFormItemInputId, t as useFormItem } from "./use-form-item-D-dEMqBj.js";
import { t as mutable } from "./typescript-CMUKtCBO.js";
import { n as BAR_MAP, t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as isGreaterThan } from "./numbers-I--Pu7qj.js";
import { r as TinyColor, t as ElButton } from "./button-CLXz94Uh.js";
import { t as require_dayjs_min } from "./dayjs.min-DeZMAZuH.js";
import { t as ClickOutside } from "./click-outside-B3b0egMR.js";
import { n as require_customParseFormat } from "./advancedFormat-Cu6D3d9S.js";
import { n as tagProps, t as ElTag } from "./tag-CqzZCxmq.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { t as ElRadio } from "./radio-DoZnxNaS.js";
import { t as ElInputNumber } from "./input-number-C5-G8rpP.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/flattenDeep.js
/** Used as references for various `Number` constants. */
var INFINITY = Infinity;
/**
* Recursively flattens `array`.
*
* @static
* @memberOf _
* @since 3.0.0
* @category Array
* @param {Array} array The array to flatten.
* @returns {Array} Returns the new flattened array.
* @example
*
* _.flattenDeep([1, [2, [3, [4]], 5]]);
* // => [1, 2, 3, 4, 5]
*/
function flattenDeep(array) {
	return (array == null ? 0 : array.length) ? baseFlatten(array, INFINITY) : [];
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/props/panel-time-range.mjs
var panelTimeRangeProps = buildProps({
	...timePanelSharedProps,
	parsedValue: { type: definePropType(Array) }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/time-picker-com/panel-time-range.vue_vue_type_script_setup_true_lang.mjs
var import_dayjs_min = /* @__PURE__ */ __toESM(require_dayjs_min(), 1);
var _hoisted_1$10 = ["disabled"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/time-picker-com/panel-time-range.mjs
var panel_time_range_default = /* @__PURE__ */ defineComponent({
	__name: "panel-time-range",
	props: panelTimeRangeProps,
	emits: [
		"pick",
		"select-range",
		"set-picker-option"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const makeSelectRange = (start, end) => {
			const result = [];
			for (let i = start; i <= end; i++) result.push(i);
			return result;
		};
		const { t, lang } = useLocale();
		const nsTime = useNamespace("time");
		const nsPicker = useNamespace("picker");
		const pickerBase = inject(PICKER_BASE_INJECTION_KEY);
		const { arrowControl, disabledHours, disabledMinutes, disabledSeconds, defaultValue } = pickerBase.props;
		const startContainerKls = computed(() => [
			nsTime.be("range-picker", "body"),
			nsTime.be("panel", "content"),
			nsTime.is("arrow", arrowControl),
			showSeconds.value ? "has-seconds" : ""
		]);
		const endContainerKls = computed(() => [
			nsTime.be("range-picker", "body"),
			nsTime.be("panel", "content"),
			nsTime.is("arrow", arrowControl),
			showSeconds.value ? "has-seconds" : ""
		]);
		const startTime = computed(() => props.parsedValue[0]);
		const endTime = computed(() => props.parsedValue[1]);
		const oldValue = useOldValue(props, {
			modelValue: computed(() => pickerBase.props.modelValue),
			valueOnClear: computed(() => pickerBase?.emptyValues ? pickerBase.emptyValues.valueOnClear.value : null)
		});
		const handleCancel = () => {
			const old = oldValue.value;
			emit("pick", old, false);
			nextTick(() => {
				oldValue.value = old;
			});
		};
		const showSeconds = computed(() => {
			return props.format.includes("ss");
		});
		const amPmMode = computed(() => {
			if (props.format.includes("A")) return "A";
			if (props.format.includes("a")) return "a";
			return "";
		});
		const handleConfirm = (visible = false) => {
			emit("pick", [startTime.value, endTime.value], visible);
		};
		const handleMinChange = (date) => {
			handleChange(date.millisecond(0), endTime.value);
		};
		const handleMaxChange = (date) => {
			handleChange(startTime.value, date.millisecond(0));
		};
		const isValidValue = (_date) => {
			const parsedDate = _date.map((_) => (0, import_dayjs_min.default)(_).locale(lang.value));
			const result = getRangeAvailableTime(parsedDate);
			return parsedDate[0].isSame(result[0]) && parsedDate[1].isSame(result[1]);
		};
		const handleChange = (start, end) => {
			if (!props.visible) return;
			emit("pick", [start, end], true);
		};
		const btnConfirmDisabled = computed(() => {
			return startTime.value > endTime.value;
		});
		const selectionRange = ref([0, 2]);
		const setMinSelectionRange = (start, end) => {
			emit("select-range", start, end, "min");
			selectionRange.value = [start, end];
		};
		const offset = computed(() => showSeconds.value ? 11 : 8);
		const setMaxSelectionRange = (start, end) => {
			emit("select-range", start, end, "max");
			const _offset = unref(offset);
			selectionRange.value = [start + _offset, end + _offset];
		};
		const changeSelectionRange = (step) => {
			const list = showSeconds.value ? [
				0,
				3,
				6,
				11,
				14,
				17
			] : [
				0,
				3,
				8,
				11
			];
			const mapping = ["hours", "minutes"].concat(showSeconds.value ? ["seconds"] : []);
			const next = (list.indexOf(selectionRange.value[0]) + step + list.length) % list.length;
			const half = list.length / 2;
			if (next < half) timePickerOptions["start_emitSelectRange"](mapping[next]);
			else timePickerOptions["end_emitSelectRange"](mapping[next - half]);
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
				timePickerOptions[`${selectionRange.value[0] < offset.value ? "start" : "end"}_scrollDown`](step);
				event.preventDefault();
				return;
			}
		};
		const disabledHours_ = (role, compare) => {
			const defaultDisable = disabledHours ? disabledHours(role) : [];
			const isStart = role === "start";
			const compareHour = (compare || (isStart ? endTime.value : startTime.value)).hour();
			return union(defaultDisable, isStart ? makeSelectRange(compareHour + 1, 23) : makeSelectRange(0, compareHour - 1));
		};
		const disabledMinutes_ = (hour, role, compare) => {
			const defaultDisable = disabledMinutes ? disabledMinutes(hour, role) : [];
			const isStart = role === "start";
			const compareDate = compare || (isStart ? endTime.value : startTime.value);
			if (hour !== compareDate.hour()) return defaultDisable;
			const compareMinute = compareDate.minute();
			return union(defaultDisable, isStart ? makeSelectRange(compareMinute + 1, 59) : makeSelectRange(0, compareMinute - 1));
		};
		const disabledSeconds_ = (hour, minute, role, compare) => {
			const defaultDisable = disabledSeconds ? disabledSeconds(hour, minute, role) : [];
			const isStart = role === "start";
			const compareDate = compare || (isStart ? endTime.value : startTime.value);
			const compareHour = compareDate.hour();
			const compareMinute = compareDate.minute();
			if (hour !== compareHour || minute !== compareMinute) return defaultDisable;
			const compareSecond = compareDate.second();
			return union(defaultDisable, isStart ? makeSelectRange(compareSecond + 1, 59) : makeSelectRange(0, compareSecond - 1));
		};
		const getRangeAvailableTime = ([start, end]) => {
			return [getAvailableTime(start, "start", true, end), getAvailableTime(end, "end", false, start)];
		};
		const { getAvailableHours, getAvailableMinutes, getAvailableSeconds } = buildAvailableTimeSlotGetter(disabledHours_, disabledMinutes_, disabledSeconds_);
		const { timePickerOptions, getAvailableTime, onSetOption } = useTimePanel({
			getAvailableHours,
			getAvailableMinutes,
			getAvailableSeconds
		});
		const parseUserInput = (days) => {
			if (!days) return null;
			if (isArray(days)) return days.map((d) => (0, import_dayjs_min.default)(d, props.format).locale(lang.value));
			return (0, import_dayjs_min.default)(days, props.format).locale(lang.value);
		};
		const getDefaultValue = () => {
			if (isArray(defaultValue)) return defaultValue.map((d) => (0, import_dayjs_min.default)(d).locale(lang.value));
			const defaultDay = (0, import_dayjs_min.default)(defaultValue).locale(lang.value);
			return [defaultDay, defaultDay.add(60, "m")];
		};
		emit("set-picker-option", ["parseUserInput", parseUserInput]);
		emit("set-picker-option", ["isValidValue", isValidValue]);
		emit("set-picker-option", ["handleKeydownInput", handleKeydown]);
		emit("set-picker-option", ["getDefaultValue", getDefaultValue]);
		emit("set-picker-option", ["getRangeAvailableTime", getRangeAvailableTime]);
		emit("set-picker-option", ["handleCancel", handleCancel]);
		return (_ctx, _cache) => {
			return _ctx.actualVisible ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass([unref(nsTime).b("range-picker"), unref(nsPicker).b("panel")])
			}, [createBaseVNode("div", { class: normalizeClass(unref(nsTime).be("range-picker", "content")) }, [createBaseVNode("div", { class: normalizeClass(unref(nsTime).be("range-picker", "cell")) }, [createBaseVNode("div", { class: normalizeClass(unref(nsTime).be("range-picker", "header")) }, toDisplayString(unref(t)("el.datepicker.startTime")), 3), createBaseVNode("div", { class: normalizeClass(startContainerKls.value) }, [createVNode(basic_time_spinner_default, {
				ref: "minSpinner",
				role: "start",
				"show-seconds": showSeconds.value,
				"am-pm-mode": amPmMode.value,
				"arrow-control": unref(arrowControl),
				"spinner-date": startTime.value,
				"disabled-hours": disabledHours_,
				"disabled-minutes": disabledMinutes_,
				"disabled-seconds": disabledSeconds_,
				onChange: handleMinChange,
				onSetOption: unref(onSetOption),
				onSelectRange: setMinSelectionRange
			}, null, 8, [
				"show-seconds",
				"am-pm-mode",
				"arrow-control",
				"spinner-date",
				"onSetOption"
			])], 2)], 2), createBaseVNode("div", { class: normalizeClass(unref(nsTime).be("range-picker", "cell")) }, [createBaseVNode("div", { class: normalizeClass(unref(nsTime).be("range-picker", "header")) }, toDisplayString(unref(t)("el.datepicker.endTime")), 3), createBaseVNode("div", { class: normalizeClass(endContainerKls.value) }, [createVNode(basic_time_spinner_default, {
				ref: "maxSpinner",
				role: "end",
				"show-seconds": showSeconds.value,
				"am-pm-mode": amPmMode.value,
				"arrow-control": unref(arrowControl),
				"spinner-date": endTime.value,
				"disabled-hours": disabledHours_,
				"disabled-minutes": disabledMinutes_,
				"disabled-seconds": disabledSeconds_,
				onChange: handleMaxChange,
				onSetOption: unref(onSetOption),
				onSelectRange: setMaxSelectionRange
			}, null, 8, [
				"show-seconds",
				"am-pm-mode",
				"arrow-control",
				"spinner-date",
				"onSetOption"
			])], 2)], 2)], 2), createBaseVNode("div", { class: normalizeClass(unref(nsTime).be("panel", "footer")) }, [createBaseVNode("button", {
				type: "button",
				class: normalizeClass([unref(nsTime).be("panel", "btn"), "cancel"]),
				onClick: _cache[0] || (_cache[0] = ($event) => handleCancel())
			}, toDisplayString(unref(t)("el.datepicker.cancel")), 3), createBaseVNode("button", {
				type: "button",
				class: normalizeClass([unref(nsTime).be("panel", "btn"), "confirm"]),
				disabled: btnConfirmDisabled.value,
				onClick: _cache[1] || (_cache[1] = ($event) => handleConfirm())
			}, toDisplayString(unref(t)("el.datepicker.confirm")), 11, _hoisted_1$10)], 2)], 2)) : createCommentVNode("v-if", true);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/src/time-picker.mjs
var import_customParseFormat = /* @__PURE__ */ __toESM(require_customParseFormat(), 1);
import_dayjs_min.default.extend(import_customParseFormat.default);
var time_picker_default = /* @__PURE__ */ defineComponent({
	name: "ElTimePicker",
	install: null,
	props: {
		...timePickerDefaultProps,
		/**
		* @description whether to pick a time range
		*/
		isRange: Boolean
	},
	emits: [UPDATE_MODEL_EVENT],
	setup(props, ctx) {
		const commonPicker = ref();
		const [type, Panel] = props.isRange ? ["timerange", panel_time_range_default] : ["time", panel_time_pick_default];
		const modelUpdater = (value) => ctx.emit(UPDATE_MODEL_EVENT, value);
		provide(PICKER_POPPER_OPTIONS_INJECTION_KEY, props.popperOptions);
		ctx.expose({
			/**
			* @description focus the Input component
			*/
			focus: () => {
				commonPicker.value?.focus();
			},
			/**
			* @description blur the Input component
			*/
			blur: () => {
				commonPicker.value?.blur();
			},
			/**
			* @description open the TimePicker popper
			*/
			handleOpen: () => {
				commonPicker.value?.handleOpen();
			},
			/**
			* @description close the TimePicker popper
			*/
			handleClose: () => {
				commonPicker.value?.handleClose();
			}
		});
		return () => {
			return createVNode(picker_default, mergeProps(props, {
				"ref": commonPicker,
				"type": type,
				"format": props.format ?? "HH:mm:ss",
				"onUpdate:modelValue": modelUpdater
			}), { default: (props) => createVNode(Panel, props, null) });
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-picker/index.mjs
var ElTimePicker = withInstall(time_picker_default);
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/config.mjs
var CommonProps = buildProps({
	/**
	* @description specify which key of node object is used as the node's value
	*/
	modelValue: { type: definePropType([
		Number,
		String,
		Array,
		Object
	]) },
	/**
	* @description data of the options, the key of `value` and `label` can be customize by `CascaderProps`.
	*/
	options: {
		type: definePropType(Array),
		default: () => []
	},
	/**
	* @description configuration options, see the following `CascaderProps` table.
	*/
	props: {
		type: definePropType(Object),
		default: () => ({})
	},
	/**
	* @description whether to enable virtual scrolling
	*/
	virtualScroll: Boolean,
	/**
	* @description node height for virtual scrolling
	*/
	itemSize: {
		type: Number,
		default: 34
	},
	/**
	* @description menu height for virtual scrolling
	*/
	height: {
		type: Number,
		default: 204
	}
});
var DefaultProps = {
	/**
	* @description trigger mode of expanding options
	*/
	expandTrigger: "click",
	/**
	* @description whether multiple selection is enabled
	*/
	multiple: false,
	/**
	* @description whether checked state of a node not affects its parent and child nodes
	*/
	checkStrictly: false,
	/**
	* @description when checked nodes change, whether to emit an array of node's path, if false, only emit the value of node.
	*/
	emitPath: true,
	/**
	* @description whether to dynamic load child nodes, use with `lazyload` attribute
	*/
	lazy: false,
	/**
	* @description method for loading child nodes data, only works when `lazy` is true
	*/
	lazyLoad: NOOP,
	/**
	* @description specify which key of node object is used as the node's value
	*/
	value: "value",
	/**
	* @description specify which key of node object is used as the node's label
	*/
	label: "label",
	/**
	* @description specify which key of node object is used as the node's children
	*/
	children: "children",
	/**
	* @description specify which key of node object is used as the node's leaf
	*/
	leaf: "leaf",
	/**
	* @description specify which key of node object is used as the node's disabled
	*/
	disabled: "disabled",
	/**
	* @description hover threshold of expanding options
	*/
	hoverThreshold: 500,
	/**
	* @description whether to check or uncheck node when clicking on the node
	*/
	checkOnClickNode: false,
	/**
	* @description whether to check or uncheck node when clicking on leaf node (last children).
	*/
	checkOnClickLeaf: true,
	/**
	* @description whether to show the radio or checkbox prefix
	*/
	showPrefix: true
};
/**
* @deprecated Removed after 3.0.0, Use `CascaderPanelProps` instead.
*/
var cascaderPanelProps = buildProps({
	...CommonProps,
	border: {
		type: Boolean,
		default: true
	},
	renderLabel: { type: Function }
});
var emitChangeFn$1 = (value) => true;
var cascaderPanelEmits = {
	[UPDATE_MODEL_EVENT]: emitChangeFn$1,
	[CHANGE_EVENT]: emitChangeFn$1,
	close: () => true,
	"expand-change": (value) => value
};
var useCascaderConfig = (props) => {
	return computed(() => ({
		...DefaultProps,
		...props.props
	}));
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/defaults.mjs
var ITEM_RENDER_EVT = "itemRendered";
var SCROLL_EVT = "scroll";
var END_REACHED_EVT = "end-reached";
var FORWARD = "forward";
var BACKWARD = "backward";
var AUTO_ALIGNMENT = "auto";
var START_ALIGNMENT = "start";
var CENTERED_ALIGNMENT = "center";
var HORIZONTAL = "horizontal";
var VERTICAL = "vertical";
var RTL_OFFSET_NAG = "negative";
var RTL_OFFSET_POS_ASC = "positive-ascending";
var RTL_OFFSET_POS_DESC = "positive-descending";
var ScrollbarDirKey = {
	[HORIZONTAL]: "left",
	[VERTICAL]: "top"
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/props.mjs
var itemSize = buildProp({
	type: definePropType([Number, Function]),
	required: true
});
var estimatedItemSize = buildProp({ type: Number });
var cache = buildProp({
	type: Number,
	default: 2
});
var direction = buildProp({
	type: String,
	values: ["ltr", "rtl"],
	default: "ltr"
});
var initScrollOffset = buildProp({
	type: Number,
	default: 0
});
var total = buildProp({
	type: Number,
	required: true
});
var layout = buildProp({
	type: String,
	values: ["horizontal", "vertical"],
	default: VERTICAL
});
var virtualizedProps = buildProps({
	className: {
		type: String,
		default: ""
	},
	containerElement: {
		type: definePropType([String, Object]),
		default: "div"
	},
	data: {
		type: definePropType(Array),
		default: () => mutable([])
	},
	/**
	* @description controls the horizontal direction.
	*/
	direction,
	height: {
		type: [String, Number],
		required: true
	},
	innerElement: {
		type: [String, Object],
		default: "div"
	},
	innerProps: {
		type: definePropType(Object),
		default: () => ({})
	},
	style: {
		type: definePropType([
			Object,
			String,
			Array,
			Boolean
		]),
		default: void 0
	},
	useIsScrolling: Boolean,
	width: {
		type: [Number, String],
		required: false
	},
	innerWidth: {
		type: [Number, String],
		required: false
	},
	perfMode: {
		type: Boolean,
		default: true
	},
	scrollbarAlwaysOn: Boolean
});
var virtualizedListProps = buildProps({
	/**
	* @description describes how many items should be pre rendered to the head
	* and the tail of the window
	*/
	cache,
	estimatedItemSize,
	/**
	* @description controls the list's orientation
	*/
	layout,
	initScrollOffset,
	/**
	* @description describes the total number of the list.
	*/
	total,
	itemSize,
	...virtualizedProps
});
var scrollbarSize = {
	type: Number,
	default: 6
};
var startGap = {
	type: Number,
	default: 0
};
var endGap = {
	type: Number,
	default: 2
};
var virtualizedGridProps = buildProps({
	columnCache: cache,
	columnWidth: itemSize,
	estimatedColumnWidth: estimatedItemSize,
	estimatedRowHeight: estimatedItemSize,
	initScrollLeft: initScrollOffset,
	initScrollTop: initScrollOffset,
	itemKey: {
		type: definePropType(Function),
		default: ({ columnIndex, rowIndex }) => `${rowIndex}:${columnIndex}`
	},
	rowCache: cache,
	rowHeight: itemSize,
	totalColumn: total,
	totalRow: total,
	hScrollbarSize: scrollbarSize,
	vScrollbarSize: scrollbarSize,
	scrollbarStartGap: startGap,
	scrollbarEndGap: endGap,
	role: String,
	...virtualizedProps
});
var virtualizedScrollbarProps = buildProps({
	alwaysOn: Boolean,
	class: String,
	layout,
	total,
	ratio: {
		type: Number,
		required: true
	},
	clientSize: {
		type: Number,
		required: true
	},
	scrollFrom: {
		type: Number,
		required: true
	},
	scrollbarSize,
	startGap,
	endGap,
	visible: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/utils.mjs
var getScrollDir = (prev, cur) => prev < cur ? FORWARD : BACKWARD;
var isHorizontal = (dir) => dir === "ltr" || dir === "rtl" || dir === "horizontal";
var isRTL = (dir) => dir === "rtl";
var cachedRTLResult = null;
function getRTLOffsetType(recalculate = false) {
	if (cachedRTLResult === null || recalculate) {
		const outerDiv = document.createElement("div");
		const outerStyle = outerDiv.style;
		outerStyle.width = "50px";
		outerStyle.height = "50px";
		outerStyle.overflow = "scroll";
		outerStyle.direction = "rtl";
		const innerDiv = document.createElement("div");
		const innerStyle = innerDiv.style;
		innerStyle.width = "100px";
		innerStyle.height = "100px";
		outerDiv.appendChild(innerDiv);
		document.body.appendChild(outerDiv);
		if (outerDiv.scrollLeft > 0) cachedRTLResult = RTL_OFFSET_POS_DESC;
		else {
			outerDiv.scrollLeft = 1;
			if (outerDiv.scrollLeft === 0) cachedRTLResult = RTL_OFFSET_NAG;
			else cachedRTLResult = RTL_OFFSET_POS_ASC;
		}
		document.body.removeChild(outerDiv);
		return cachedRTLResult;
	}
	return cachedRTLResult;
}
function renderThumbStyle({ move, size, bar }, layout) {
	const style = {};
	const translate = `translate${bar.axis}(${move}px)`;
	style[bar.size] = size;
	style.transform = translate;
	if (layout === "horizontal") style.height = "100%";
	else style.width = "100%";
	return style;
}
//#endregion
//#region ../../node_modules/.pnpm/memoize-one@6.0.0/node_modules/memoize-one/dist/memoize-one.esm.js
var safeIsNaN = Number.isNaN || function ponyfill(value) {
	return typeof value === "number" && value !== value;
};
function isEqual(first, second) {
	if (first === second) return true;
	if (safeIsNaN(first) && safeIsNaN(second)) return true;
	return false;
}
function areInputsEqual(newInputs, lastInputs) {
	if (newInputs.length !== lastInputs.length) return false;
	for (var i = 0; i < newInputs.length; i++) if (!isEqual(newInputs[i], lastInputs[i])) return false;
	return true;
}
function memoizeOne(resultFn, isEqual) {
	if (isEqual === void 0) isEqual = areInputsEqual;
	var cache = null;
	function memoized() {
		var newArgs = [];
		for (var _i = 0; _i < arguments.length; _i++) newArgs[_i] = arguments[_i];
		if (cache && cache.lastThis === this && isEqual(newArgs, cache.lastArgs)) return cache.lastResult;
		var lastResult = resultFn.apply(this, newArgs);
		cache = {
			lastResult,
			lastArgs: newArgs,
			lastThis: this
		};
		return lastResult;
	}
	memoized.clear = function clear() {
		cache = null;
	};
	return memoized;
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/hooks/use-cache.mjs
var useCache = () => {
	const props = getCurrentInstance().proxy.$props;
	return computed(() => {
		const _getItemStyleCache = (_, __, ___) => ({});
		return props.perfMode ? memoize(_getItemStyleCache) : memoizeOne(_getItemStyleCache);
	});
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/components/scrollbar.mjs
var ScrollBar = defineComponent({
	name: "ElVirtualScrollBar",
	props: virtualizedScrollbarProps,
	emits: [
		"scroll",
		"start-move",
		"stop-move"
	],
	setup(props, { emit }) {
		const GAP = computed(() => props.startGap + props.endGap);
		const nsVirtualScrollbar = useNamespace("virtual-scrollbar");
		const nsScrollbar = useNamespace("scrollbar");
		const trackRef = ref();
		const thumbRef = ref();
		let frameHandle = null;
		let onselectstartStore = null;
		const state = reactive({
			isDragging: false,
			traveled: 0
		});
		const bar = computed(() => BAR_MAP[props.layout]);
		const trackSize = computed(() => props.clientSize - unref(GAP));
		const trackStyle = computed(() => ({
			position: "absolute",
			width: `${"horizontal" === props.layout ? trackSize.value : props.scrollbarSize}px`,
			height: `${"horizontal" === props.layout ? props.scrollbarSize : trackSize.value}px`,
			[ScrollbarDirKey[props.layout]]: "2px",
			right: "2px",
			bottom: "2px",
			borderRadius: "4px"
		}));
		const thumbSize = computed(() => {
			const ratio = props.ratio;
			if (ratio >= 100) return Number.POSITIVE_INFINITY;
			if (ratio >= 50) return ratio * trackSize.value / 100;
			const SCROLLBAR_MAX_SIZE = trackSize.value / 3;
			return Math.floor(Math.min(Math.max(ratio * trackSize.value / 100, 20), SCROLLBAR_MAX_SIZE));
		});
		const thumbStyle = computed(() => {
			if (!Number.isFinite(thumbSize.value)) return { display: "none" };
			const thumb = `${thumbSize.value}px`;
			return renderThumbStyle({
				bar: bar.value,
				size: thumb,
				move: state.traveled
			}, props.layout);
		});
		const totalSteps = computed(() => Math.ceil(props.clientSize - thumbSize.value - unref(GAP)));
		const attachEvents = () => {
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
			const thumbEl = unref(thumbRef);
			if (!thumbEl) return;
			onselectstartStore = document.onselectstart;
			document.onselectstart = () => false;
			thumbEl.addEventListener("touchmove", onMouseMove, { passive: true });
			thumbEl.addEventListener("touchend", onMouseUp);
		};
		const detachEvents = () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
			document.onselectstart = onselectstartStore;
			onselectstartStore = null;
			const thumbEl = unref(thumbRef);
			if (!thumbEl) return;
			thumbEl.removeEventListener("touchmove", onMouseMove);
			thumbEl.removeEventListener("touchend", onMouseUp);
		};
		const onThumbMouseDown = (e) => {
			e.stopImmediatePropagation();
			if (e.ctrlKey || [1, 2].includes(e.button)) return;
			state.isDragging = true;
			state[bar.value.axis] = e.currentTarget[bar.value.offset] - (e[bar.value.client] - e.currentTarget.getBoundingClientRect()[bar.value.direction]);
			emit("start-move");
			attachEvents();
		};
		const onMouseUp = () => {
			state.isDragging = false;
			state[bar.value.axis] = 0;
			emit("stop-move");
			detachEvents();
		};
		const onMouseMove = (e) => {
			const { isDragging } = state;
			if (!isDragging) return;
			if (!thumbRef.value || !trackRef.value) return;
			const prevPage = state[bar.value.axis];
			if (!prevPage) return;
			cAF(frameHandle);
			/**
			*  +--------------+                                   +--------------+
			*  |              -  <--------- thumb.offsetTop       |              |
			*  |             |+|             <--+                 |              |
			*  |              -                 |                 |              |
			*  |   Content    |                 |                 |              |
			*  |              |                 |                 |              |
			*  |              |                 |                 |              |
			*  |              |                 |                 |              -
			*  |              |                 +-->              |             |+|
			*  |              |                                   |              -
			*  +--------------+                                   +--------------+
			*/
			const distance = (trackRef.value.getBoundingClientRect()[bar.value.direction] - e[bar.value.client]) * -1 - (thumbRef.value[bar.value.offset] - prevPage);
			frameHandle = rAF(() => {
				state.traveled = Math.max(0, Math.min(distance, totalSteps.value));
				emit("scroll", distance, totalSteps.value);
			});
		};
		const clickTrackHandler = (e) => {
			const distance = Math.abs(e.target.getBoundingClientRect()[bar.value.direction] - e[bar.value.client]) - thumbRef.value[bar.value.offset] / 2;
			state.traveled = Math.max(0, Math.min(distance, totalSteps.value));
			emit("scroll", distance, totalSteps.value);
		};
		watch(() => props.scrollFrom, (v) => {
			if (state.isDragging) return;
			/**
			*  this is simply mapping the current scrollbar offset
			*
			*  formula 1:
			*    v = scrollOffset / (estimatedTotalSize - clientSize)
			*    traveled = v * (clientSize - thumbSize - GAP) --> v * totalSteps
			*
			*  formula 2:
			*    traveled = (v * clientSize) / (clientSize / totalSteps) --> (v * clientSize) * (totalSteps / clientSize) --> v * totalSteps
			*/
			state.traveled = Math.ceil(v * totalSteps.value);
		});
		onBeforeUnmount(() => {
			detachEvents();
		});
		return () => {
			return h("div", {
				role: "presentation",
				ref: trackRef,
				class: [
					nsVirtualScrollbar.b(),
					props.class,
					(props.alwaysOn || state.isDragging) && "always-on"
				],
				style: trackStyle.value,
				onMousedown: withModifiers(clickTrackHandler, ["stop", "prevent"]),
				onTouchstartPrevent: onThumbMouseDown
			}, h("div", {
				ref: thumbRef,
				class: nsScrollbar.e("thumb"),
				style: thumbStyle.value,
				onMousedown: onThumbMouseDown
			}, []));
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/builders/build-list.mjs
var createList = ({ name, getOffset, getItemSize, getItemOffset, getEstimatedTotalSize, getStartIndexForOffset, getStopIndexForStartIndex, initCache, clearCache, validateProps }) => {
	return defineComponent({
		name: name ?? "ElVirtualList",
		props: virtualizedListProps,
		emits: [
			ITEM_RENDER_EVT,
			SCROLL_EVT,
			END_REACHED_EVT
		],
		setup(props, { emit, expose }) {
			validateProps(props);
			const instance = getCurrentInstance();
			const ns = useNamespace("vl");
			const dynamicSizeCache = ref(initCache(props, instance));
			const getItemStyleCache = useCache();
			const windowRef = ref();
			const innerRef = ref();
			const scrollbarRef = ref();
			const states = ref({
				isScrolling: false,
				scrollDir: FORWARD,
				scrollOffset: isNumber(props.initScrollOffset) ? props.initScrollOffset : 0,
				updateRequested: false,
				isScrollbarDragging: false
			});
			const itemsToRender = computed(() => {
				const { total, cache } = props;
				const { isScrolling, scrollDir, scrollOffset } = unref(states);
				if (total === 0) return [
					0,
					0,
					0,
					0
				];
				const startIndex = getStartIndexForOffset(props, scrollOffset, unref(dynamicSizeCache));
				const stopIndex = getStopIndexForStartIndex(props, startIndex, scrollOffset, unref(dynamicSizeCache));
				const cacheBackward = !isScrolling || scrollDir === "backward" ? Math.max(1, cache) : 1;
				const cacheForward = !isScrolling || scrollDir === "forward" ? Math.max(1, cache) : 1;
				return [
					Math.max(0, startIndex - cacheBackward),
					Math.max(0, Math.min(total - 1, stopIndex + cacheForward)),
					startIndex,
					stopIndex
				];
			});
			const estimatedTotalSize = computed(() => getEstimatedTotalSize(props, unref(dynamicSizeCache)));
			const _isHorizontal = computed(() => isHorizontal(props.layout));
			const windowStyle = computed(() => [
				{
					position: "relative",
					[`overflow-${_isHorizontal.value ? "x" : "y"}`]: "scroll",
					WebkitOverflowScrolling: "touch",
					willChange: "transform"
				},
				{
					direction: props.direction,
					height: isNumber(props.height) ? `${props.height}px` : props.height,
					width: isNumber(props.width) ? `${props.width}px` : props.width
				},
				props.style
			]);
			const innerStyle = computed(() => {
				const size = unref(estimatedTotalSize);
				const horizontal = unref(_isHorizontal);
				const innerWidth = props.innerWidth;
				return {
					height: horizontal ? "100%" : `${size}px`,
					pointerEvents: unref(states).isScrolling ? "none" : void 0,
					width: horizontal ? `${size}px` : innerWidth !== void 0 ? isNumber(innerWidth) ? `${innerWidth}px` : innerWidth : "100%",
					margin: 0,
					boxSizing: "border-box"
				};
			});
			const clientSize = computed(() => _isHorizontal.value ? props.width : props.height);
			const maxOffset = computed(() => Math.max(0, estimatedTotalSize.value - clientSize.value));
			const normalizeOffset = (offset) => clamp$1(offset, 0, maxOffset.value);
			const EDGE_TOLERANCE = 1;
			const getEdgeState = (normalizedOffset) => ({
				start: !isGreaterThan(normalizedOffset, 0, EDGE_TOLERANCE),
				end: !isGreaterThan(maxOffset.value, normalizedOffset, EDGE_TOLERANCE)
			});
			const normalizedScrollOffset = computed(() => normalizeOffset(states.value.scrollOffset));
			const currentEdgeState = computed(() => getEdgeState(normalizedScrollOffset.value));
			let edgeState = currentEdgeState.value;
			const { onWheel } = useWheel({
				atStartEdge: computed(() => currentEdgeState.value.start),
				atEndEdge: computed(() => currentEdgeState.value.end),
				layout: computed(() => props.layout)
			}, (offset) => {
				scrollbarRef.value.onMouseUp?.();
				scrollTo(Math.min(states.value.scrollOffset + offset, maxOffset.value));
			});
			useEventListener(windowRef, "wheel", onWheel, { passive: false });
			const emitEvents = () => {
				const { total } = props;
				if (total > 0) {
					const [cacheStart, cacheEnd, visibleStart, visibleEnd] = unref(itemsToRender);
					emit(ITEM_RENDER_EVT, cacheStart, cacheEnd, visibleStart, visibleEnd);
				}
				const { scrollDir, scrollOffset, updateRequested } = unref(states);
				emit(SCROLL_EVT, scrollDir, scrollOffset, updateRequested);
			};
			const emitEndReached = (direction, offset) => {
				const nextEdgeState = getEdgeState(offset);
				const horizontalEnd = props.direction === "rtl" ? "left" : "right";
				const horizontalStart = props.direction === "rtl" ? "right" : "left";
				if (direction === "forward" && nextEdgeState.end && !edgeState.end) emit(END_REACHED_EVT, _isHorizontal.value ? horizontalEnd : "bottom");
				if (direction === "backward" && nextEdgeState.start && !edgeState.start) emit(END_REACHED_EVT, _isHorizontal.value ? horizontalStart : "top");
				edgeState = nextEdgeState;
			};
			const updateScrollOffset = (offset, { isScrolling, updateRequested }) => {
				const currentState = unref(states);
				const nextOffset = Math.max(offset, 0);
				if (nextOffset === currentState.scrollOffset) return;
				const scrollDir = getScrollDir(currentState.scrollOffset, nextOffset);
				states.value = {
					...currentState,
					isScrolling,
					scrollDir,
					scrollOffset: nextOffset,
					updateRequested
				};
				emitEndReached(scrollDir, normalizeOffset(nextOffset));
				nextTick(resetIsScrolling);
			};
			const scrollVertically = (e) => {
				const { clientHeight, scrollHeight, scrollTop } = e.currentTarget;
				if (unref(states).scrollOffset === scrollTop) return;
				updateScrollOffset(Math.min(scrollTop, scrollHeight - clientHeight), {
					isScrolling: true,
					updateRequested: false
				});
			};
			const scrollHorizontally = (e) => {
				const { clientWidth, scrollLeft, scrollWidth } = e.currentTarget;
				if (unref(states).scrollOffset === scrollLeft) return;
				const { direction } = props;
				let scrollOffset = scrollLeft;
				if (direction === "rtl") switch (getRTLOffsetType()) {
					case RTL_OFFSET_NAG:
						scrollOffset = -scrollLeft;
						break;
					case RTL_OFFSET_POS_DESC:
						scrollOffset = scrollWidth - clientWidth - scrollLeft;
						break;
				}
				updateScrollOffset(Math.min(scrollOffset, scrollWidth - clientWidth), {
					isScrolling: true,
					updateRequested: false
				});
			};
			const onScroll = (e) => {
				unref(_isHorizontal) ? scrollHorizontally(e) : scrollVertically(e);
				emitEvents();
			};
			const onScrollbarScroll = (distanceToGo, totalSteps) => {
				const offset = maxOffset.value / totalSteps * distanceToGo;
				scrollTo(Math.min(maxOffset.value, offset));
			};
			const scrollTo = (offset) => {
				updateScrollOffset(offset, {
					isScrolling: unref(states).isScrolling,
					updateRequested: true
				});
			};
			const scrollToItem = (idx, alignment = AUTO_ALIGNMENT) => {
				const { scrollOffset } = unref(states);
				idx = Math.max(0, Math.min(idx, props.total - 1));
				scrollTo(getOffset(props, idx, alignment, scrollOffset, unref(dynamicSizeCache)));
			};
			const getItemStyle = (idx) => {
				const { direction, itemSize, layout } = props;
				const itemStyleCache = getItemStyleCache.value(clearCache && itemSize, clearCache && layout, clearCache && direction);
				let style;
				if (hasOwn(itemStyleCache, String(idx))) style = itemStyleCache[idx];
				else {
					const offset = getItemOffset(props, idx, unref(dynamicSizeCache));
					const size = getItemSize(props, idx, unref(dynamicSizeCache));
					const horizontal = unref(_isHorizontal);
					const isRtl = direction === "rtl";
					const offsetHorizontal = horizontal ? offset : 0;
					itemStyleCache[idx] = style = {
						position: "absolute",
						left: isRtl ? void 0 : `${offsetHorizontal}px`,
						right: isRtl ? `${offsetHorizontal}px` : void 0,
						top: !horizontal ? `${offset}px` : 0,
						height: !horizontal ? `${size}px` : "100%",
						width: horizontal ? `${size}px` : "100%"
					};
				}
				return style;
			};
			const resetIsScrolling = () => {
				states.value.isScrolling = false;
				nextTick(() => {
					getItemStyleCache.value(-1, null, null);
				});
			};
			const resetScrollTop = () => {
				const window = windowRef.value;
				if (window) window.scrollTop = 0;
			};
			onMounted(() => {
				if (!isClient) return;
				const { initScrollOffset } = props;
				const windowElement = unref(windowRef);
				if (isNumber(initScrollOffset) && windowElement) if (unref(_isHorizontal)) windowElement.scrollLeft = initScrollOffset;
				else windowElement.scrollTop = initScrollOffset;
				emitEvents();
			});
			onUpdated(() => {
				const { direction, layout } = props;
				const { scrollOffset, updateRequested } = unref(states);
				const windowElement = unref(windowRef);
				if (updateRequested && windowElement) if (layout === "horizontal") if (direction === "rtl") switch (getRTLOffsetType()) {
					case RTL_OFFSET_NAG:
						windowElement.scrollLeft = -scrollOffset;
						break;
					case RTL_OFFSET_POS_ASC:
						windowElement.scrollLeft = scrollOffset;
						break;
					default: {
						const { clientWidth, scrollWidth } = windowElement;
						windowElement.scrollLeft = scrollWidth - clientWidth - scrollOffset;
						break;
					}
				}
				else windowElement.scrollLeft = scrollOffset;
				else windowElement.scrollTop = scrollOffset;
			});
			onActivated(() => {
				unref(windowRef).scrollTop = unref(states).scrollOffset;
			});
			watch(maxOffset, () => {
				edgeState = currentEdgeState.value;
			});
			const api = {
				ns,
				clientSize,
				estimatedTotalSize,
				windowStyle,
				windowRef,
				innerRef,
				innerStyle,
				itemsToRender,
				scrollbarRef,
				states,
				getItemStyle,
				onScroll,
				onScrollbarScroll,
				onWheel,
				scrollTo,
				scrollToItem,
				resetScrollTop
			};
			expose({
				windowRef,
				innerRef,
				getItemStyleCache,
				scrollTo,
				scrollToItem,
				resetScrollTop,
				states
			});
			return api;
		},
		render(ctx) {
			const { $slots, className, clientSize, containerElement, data, getItemStyle, innerElement, itemsToRender, innerStyle, layout, scrollbarAlwaysOn, total, onScroll, onScrollbarScroll, states, useIsScrolling, windowStyle, ns } = ctx;
			const [start, end] = itemsToRender;
			const Container = resolveDynamicComponent(containerElement);
			const Inner = resolveDynamicComponent(innerElement);
			const children = [];
			if (total > 0) for (let i = start; i <= end; i++) children.push(h(Fragment, { key: i }, $slots.default?.({
				data,
				index: i,
				isScrolling: useIsScrolling ? states.isScrolling : void 0,
				style: getItemStyle(i)
			})));
			const InnerNode = [h(Inner, mergeProps(ctx.innerProps, {
				style: innerStyle,
				ref: "innerRef"
			}), !isString(Inner) ? { default: () => children } : children)];
			const scrollbar = h(ScrollBar, {
				ref: "scrollbarRef",
				clientSize,
				layout,
				onScroll: onScrollbarScroll,
				ratio: clientSize * 100 / this.estimatedTotalSize,
				scrollFrom: states.scrollOffset / (this.estimatedTotalSize - clientSize),
				total,
				alwaysOn: scrollbarAlwaysOn
			});
			const listContainer = h(Container, {
				class: [ns.e("window"), className],
				style: windowStyle,
				onScroll,
				ref: "windowRef",
				key: 0
			}, !isString(Container) ? { default: () => [InnerNode] } : [InnerNode]);
			return h("div", {
				key: 0,
				class: [ns.e("wrapper"), scrollbarAlwaysOn ? "always-on" : ""]
			}, [listContainer, scrollbar]);
		}
	});
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/virtual-list/src/components/fixed-size-list.mjs
var FixedSizeList = createList({
	name: "ElFixedSizeList",
	getItemOffset: ({ itemSize }, index) => index * itemSize,
	getItemSize: ({ itemSize }) => itemSize,
	getEstimatedTotalSize: ({ total, itemSize }) => itemSize * total,
	getOffset: ({ height, total, itemSize, layout, width }, index, alignment, scrollOffset) => {
		const size = isHorizontal(layout) ? width : height;
		if (isString(size)) throwError("[ElVirtualList]", `
        You should set
          width/height
        to number when your layout is
          horizontal/vertical
      `);
		const lastItemOffset = Math.max(0, total * itemSize - size);
		const maxOffset = Math.min(lastItemOffset, index * itemSize);
		const minOffset = Math.max(0, (index + 1) * itemSize - size);
		if (alignment === "smart") if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) alignment = AUTO_ALIGNMENT;
		else alignment = CENTERED_ALIGNMENT;
		switch (alignment) {
			case START_ALIGNMENT: return maxOffset;
			case "end": return minOffset;
			case CENTERED_ALIGNMENT: {
				const middleOffset = Math.round(minOffset + (maxOffset - minOffset) / 2);
				if (middleOffset < Math.ceil(size / 2)) return 0;
				else if (middleOffset > lastItemOffset + Math.floor(size / 2)) return lastItemOffset;
				else return middleOffset;
			}
			case AUTO_ALIGNMENT:
			default: if (scrollOffset >= minOffset && scrollOffset <= maxOffset) return scrollOffset;
			else if (scrollOffset < minOffset) return minOffset;
			else return maxOffset;
		}
	},
	getStartIndexForOffset: ({ total, itemSize }, offset) => Math.max(0, Math.min(total - 1, Math.floor(offset / itemSize))),
	getStopIndexForStartIndex: ({ height, total, itemSize, layout, width }, startIndex, scrollOffset) => {
		const offset = startIndex * itemSize;
		const size = isHorizontal(layout) ? width : height;
		const numVisibleItems = Math.ceil((size + scrollOffset - offset) / itemSize);
		return Math.max(0, Math.min(total - 1, startIndex + numVisibleItems - 1));
	},
	/**
	* Fixed size list does not need this cache
	* Using any to bypass it, TODO: Using type inference to fix this.
	*/
	initCache() {},
	clearCache: true,
	validateProps() {}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/types.mjs
var CASCADER_PANEL_INJECTION_KEY = Symbol();
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/node-content.mjs
function isVNodeEmpty(vnodes) {
	return !!(isArray(vnodes) ? vnodes.every(({ type }) => type === Comment) : vnodes?.type === Comment);
}
var node_content_default = /* @__PURE__ */ defineComponent({
	name: "NodeContent",
	props: { node: {
		type: Object,
		required: true
	} },
	setup(props) {
		const ns = useNamespace("cascader-node");
		const { renderLabelFn } = inject(CASCADER_PANEL_INJECTION_KEY);
		const { node } = props;
		const { data, label: nodeLabel } = node;
		const label = () => {
			const renderLabel = renderLabelFn?.({
				node,
				data
			});
			return isVNodeEmpty(renderLabel) ? nodeLabel : renderLabel ?? nodeLabel;
		};
		return () => createVNode("span", { "class": ns.e("label") }, [label()]);
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/node.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$9 = [
	"id",
	"aria-haspopup",
	"aria-owns",
	"aria-expanded",
	"tabindex"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/node2.mjs
var node_default = /* @__PURE__ */ defineComponent({
	name: "ElCascaderNode",
	__name: "node",
	props: {
		node: {
			type: Object,
			required: true
		},
		menuId: {
			type: String,
			required: false
		}
	},
	emits: ["expand"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const panel = inject(CASCADER_PANEL_INJECTION_KEY);
		const ns = useNamespace("cascader-node");
		const isHoverMenu = computed(() => panel.isHoverMenu);
		const multiple = computed(() => panel.config.multiple);
		const checkStrictly = computed(() => panel.config.checkStrictly);
		const showPrefix = computed(() => panel.config.showPrefix);
		const checkedNodeId = computed(() => panel.checkedNodes[0]?.uid);
		const isDisabled = computed(() => props.node.isDisabled);
		const isLeaf = computed(() => props.node.isLeaf);
		const expandable = computed(() => checkStrictly.value && !isLeaf.value || !isDisabled.value);
		const inExpandingPath = computed(() => isInPath(panel.expandingNode));
		const inCheckedPath = computed(() => checkStrictly.value && panel.checkedNodes.some(isInPath));
		const isInPath = (node) => {
			const { level, uid } = props.node;
			return node?.pathNodes[level - 1]?.uid === uid;
		};
		const doExpand = () => {
			if (inExpandingPath.value) return;
			panel.expandNode(props.node);
		};
		const doCheck = (checked) => {
			const { node } = props;
			if (checked === node.checked) return;
			panel.handleCheckChange(node, checked);
		};
		const doLoad = () => {
			panel.lazyLoad(props.node, () => {
				if (!isLeaf.value) doExpand();
			});
		};
		const handleHoverExpand = (e) => {
			if (!isHoverMenu.value) return;
			handleExpand();
			!isLeaf.value && emit("expand", e);
		};
		const handleExpand = () => {
			const { node } = props;
			if (!expandable.value || node.loading) return;
			node.loaded ? doExpand() : doLoad();
		};
		const handleClick = () => {
			if (isLeaf.value && !isDisabled.value && !checkStrictly.value && !multiple.value) handleCheck(true);
			else if ((panel.config.checkOnClickNode && (multiple.value || checkStrictly.value) || isLeaf.value && panel.config.checkOnClickLeaf) && !isDisabled.value) handleSelectCheck(!props.node.checked);
			else if (!isHoverMenu.value) handleExpand();
		};
		const handleSelectCheck = (checked) => {
			if (checkStrictly.value) {
				doCheck(checked);
				if (props.node.loaded) doExpand();
			} else handleCheck(checked);
		};
		const handleCheck = (checked) => {
			if (!props.node.loaded) doLoad();
			else {
				doCheck(checked);
				!checkStrictly.value && doExpand();
			}
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("li", {
				id: `${__props.menuId}-${__props.node.uid}`,
				role: "menuitem",
				"aria-haspopup": !isLeaf.value,
				"aria-owns": isLeaf.value ? void 0 : __props.menuId,
				"aria-expanded": inExpandingPath.value,
				tabindex: expandable.value ? -1 : void 0,
				class: normalizeClass([
					unref(ns).b(),
					unref(ns).is("selectable", checkStrictly.value),
					unref(ns).is("active", __props.node.checked),
					unref(ns).is("disabled", !expandable.value),
					inExpandingPath.value && "in-active-path",
					inCheckedPath.value && "in-checked-path"
				]),
				onMouseenter: handleHoverExpand,
				onFocus: handleHoverExpand,
				onClick: handleClick
			}, [
				createCommentVNode(" prefix "),
				multiple.value && showPrefix.value ? (openBlock(), createBlock(unref(ElCheckbox), {
					key: 0,
					"model-value": __props.node.checked,
					indeterminate: __props.node.indeterminate,
					disabled: isDisabled.value,
					onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"])),
					"onUpdate:modelValue": handleSelectCheck
				}, null, 8, [
					"model-value",
					"indeterminate",
					"disabled"
				])) : checkStrictly.value && showPrefix.value ? (openBlock(), createBlock(unref(ElRadio), {
					key: 1,
					"model-value": checkedNodeId.value,
					label: __props.node.uid,
					disabled: isDisabled.value,
					"onUpdate:modelValue": handleSelectCheck,
					onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
				}, {
					default: withCtx(() => [createCommentVNode("\n        Add an empty element to avoid render label,\n        do not use empty fragment here for https://github.com/vuejs/vue-next/pull/2485\n      "), _cache[2] || (_cache[2] = createBaseVNode("span", null, null, -1))]),
					_: 1
				}, 8, [
					"model-value",
					"label",
					"disabled"
				])) : isLeaf.value && __props.node.checked ? (openBlock(), createBlock(unref(ElIcon), {
					key: 2,
					class: normalizeClass(unref(ns).e("prefix"))
				}, {
					default: withCtx(() => [createVNode(unref(check_default))]),
					_: 1
				}, 8, ["class"])) : createCommentVNode("v-if", true),
				createCommentVNode(" content "),
				createVNode(unref(node_content_default), { node: __props.node }, null, 8, ["node"]),
				createCommentVNode(" postfix "),
				!isLeaf.value ? (openBlock(), createElementBlock(Fragment, { key: 3 }, [__props.node.loading ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: normalizeClass([unref(ns).is("loading"), unref(ns).e("postfix")])
				}, {
					default: withCtx(() => [createVNode(unref(loading_default))]),
					_: 1
				}, 8, ["class"])) : (openBlock(), createBlock(unref(ElIcon), {
					key: 1,
					class: normalizeClass(["arrow-right", unref(ns).e("postfix")])
				}, {
					default: withCtx(() => [createVNode(unref(arrow_right_default))]),
					_: 1
				}, 8, ["class"]))], 64)) : createCommentVNode("v-if", true)
			], 42, _hoisted_1$9);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/menu.mjs
var menu_default = /* @__PURE__ */ defineComponent({
	name: "ElCascaderMenu",
	__name: "menu",
	props: {
		nodes: {
			type: Array,
			required: true
		},
		index: {
			type: Number,
			required: true
		},
		virtualScroll: {
			type: Boolean,
			required: false,
			default: false
		},
		itemSize: {
			type: Number,
			required: false,
			default: 34
		},
		height: {
			type: Number,
			required: false,
			default: 204
		}
	},
	setup(__props, { expose: __expose }) {
		const props = __props;
		const instance = getCurrentInstance();
		const ns = useNamespace("cascader-menu");
		const { t } = useLocale();
		const id = useId();
		let activeNode;
		let hoverTimer;
		const panel = inject(CASCADER_PANEL_INJECTION_KEY);
		const hoverZone = ref();
		const virtualListRef = ref();
		const isEmpty = computed(() => !props.nodes.length);
		const isLoading = computed(() => !panel.initialLoaded);
		const menuId = computed(() => `${id.value}-${props.index}`);
		const getActiveNodeIndex = () => {
			let activeNodeId;
			if (panel.expandingNode) {
				const { level, pathNodes } = panel.expandingNode;
				if (props.index < level) activeNodeId = pathNodes[props.index]?.uid;
				else if (props.index === level && panel.checkedNodes.length > 0) activeNodeId = panel.checkedNodes[0]?.pathNodes[props.index]?.uid;
			} else if (panel.checkedNodes.length > 0 && props.index < panel.checkedNodes[0].pathNodes.length) activeNodeId = panel.checkedNodes[0].pathNodes[props.index]?.uid;
			return activeNodeId !== void 0 ? props.nodes.findIndex((node) => node.uid === activeNodeId) : -1;
		};
		const getNodeIndexById = (nodeId) => {
			if (!nodeId) return -1;
			return props.nodes.findIndex((node) => `${menuId.value}-${node.uid}` === nodeId);
		};
		const scrollToItem = (index) => {
			const targetIndex = clamp(index, 0, props.nodes.length - 1);
			virtualListRef.value?.scrollToItem(targetIndex);
		};
		const focusNodeAt = (index) => {
			if (!props.nodes.length) return;
			const targetIndex = clamp(index, 0, props.nodes.length - 1);
			scrollToItem(targetIndex);
			nextTick(() => {
				const node = instance.vnode.el?.querySelector(`#${menuId.value}-${props.nodes[targetIndex].uid}`);
				if (node) focusNode(node);
			});
		};
		const handleExpand = (e) => {
			activeNode = e.target;
		};
		const handleMouseMove = (e) => {
			if (!panel.isHoverMenu || !activeNode || !hoverZone.value) return;
			if (activeNode.contains(e.target)) {
				clearHoverTimer();
				const el = instance.vnode.el;
				const { left } = el.getBoundingClientRect();
				const { offsetWidth, offsetHeight } = el;
				const startX = e.clientX - left;
				const top = activeNode.offsetTop;
				const bottom = top + activeNode.offsetHeight;
				const scrollTop = props.virtualScroll ? virtualListRef.value?.states?.scrollOffset || 0 : el.querySelector(`.${ns.e("wrap")}`)?.scrollTop || 0;
				hoverZone.value.innerHTML = `
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${top} L${offsetWidth} ${scrollTop} V${top} Z" />
          <path style="pointer-events: auto;" fill="transparent" d="M${startX} ${bottom} L${offsetWidth} ${offsetHeight + scrollTop} V${bottom} Z" />
        `;
			} else if (!hoverTimer) hoverTimer = window.setTimeout(clearHoverZone, panel.config.hoverThreshold);
		};
		const clearHoverTimer = () => {
			if (!hoverTimer) return;
			clearTimeout(hoverTimer);
			hoverTimer = void 0;
		};
		const clearHoverZone = () => {
			if (!hoverZone.value) return;
			hoverZone.value.innerHTML = "";
			clearHoverTimer();
		};
		__expose({
			getActiveNodeIndex,
			getNodeIndexById,
			scrollToItem,
			focusNodeAt,
			virtualListRef,
			get $el() {
				return instance.vnode.el;
			}
		});
		return (_ctx, _cache) => {
			return __props.virtualScroll ? (openBlock(), createElementBlock("div", {
				key: menuId.value,
				class: normalizeClass(unref(ns).b()),
				onMousemove: handleMouseMove,
				onMouseleave: clearHoverZone
			}, [
				createVNode(unref(FixedSizeList), {
					ref_key: "virtualListRef",
					ref: virtualListRef,
					height: __props.height,
					"item-size": __props.itemSize,
					data: __props.nodes,
					total: __props.nodes.length,
					"class-name": unref(ns).e("list"),
					"inner-element": "ul",
					"inner-props": {
						role: "menu",
						class: unref(ns).is("empty", isEmpty.value)
					}
				}, {
					default: withCtx(({ data, index: nodeIndex, style }) => [(openBlock(), createBlock(node_default, {
						key: data[nodeIndex].uid,
						node: data[nodeIndex],
						"menu-id": menuId.value,
						style: normalizeStyle(style),
						onExpand: handleExpand
					}, null, 8, [
						"node",
						"menu-id",
						"style"
					]))]),
					_: 1
				}, 8, [
					"height",
					"item-size",
					"data",
					"total",
					"class-name",
					"inner-props"
				]),
				isLoading.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ns).e("empty-text"))
				}, [createVNode(unref(ElIcon), {
					size: 14,
					class: normalizeClass(unref(ns).is("loading"))
				}, {
					default: withCtx(() => [createVNode(unref(loading_default))]),
					_: 1
				}, 8, ["class"]), createTextVNode(" " + toDisplayString(unref(t)("el.cascader.loading")), 1)], 2)) : isEmpty.value ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: normalizeClass(unref(ns).e("empty-text"))
				}, [renderSlot(_ctx.$slots, "empty", {}, () => [createTextVNode(toDisplayString(unref(t)("el.cascader.noData")), 1)])], 2)) : unref(panel)?.isHoverMenu ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [createCommentVNode(" eslint-disable vue/html-self-closing "), (openBlock(), createElementBlock("svg", {
					ref_key: "hoverZone",
					ref: hoverZone,
					class: normalizeClass(unref(ns).e("hover-zone"))
				}, null, 2))], 2112)) : createCommentVNode("v-if", true),
				createCommentVNode(" eslint-enable vue/html-self-closing ")
			], 34)) : (openBlock(), createBlock(unref(ElScrollbar), {
				key: menuId.value,
				tag: "ul",
				role: "menu",
				class: normalizeClass(unref(ns).b()),
				"wrap-class": unref(ns).e("wrap"),
				"view-class": [unref(ns).e("list"), unref(ns).is("empty", isEmpty.value)],
				onMousemove: handleMouseMove,
				onMouseleave: clearHoverZone
			}, {
				default: withCtx(() => [
					(openBlock(true), createElementBlock(Fragment, null, renderList(__props.nodes, (node) => {
						return openBlock(), createBlock(node_default, {
							key: node.uid,
							node,
							"menu-id": menuId.value,
							onExpand: handleExpand
						}, null, 8, ["node", "menu-id"]);
					}), 128)),
					isLoading.value ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(unref(ns).e("empty-text"))
					}, [createVNode(unref(ElIcon), {
						size: 14,
						class: normalizeClass(unref(ns).is("loading"))
					}, {
						default: withCtx(() => [createVNode(unref(loading_default))]),
						_: 1
					}, 8, ["class"]), createTextVNode(" " + toDisplayString(unref(t)("el.cascader.loading")), 1)], 2)) : isEmpty.value ? (openBlock(), createElementBlock("div", {
						key: 1,
						class: normalizeClass(unref(ns).e("empty-text"))
					}, [renderSlot(_ctx.$slots, "empty", {}, () => [createTextVNode(toDisplayString(unref(t)("el.cascader.noData")), 1)])], 2)) : unref(panel)?.isHoverMenu ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [createCommentVNode(" eslint-disable vue/html-self-closing "), (openBlock(), createElementBlock("svg", {
						ref_key: "hoverZone",
						ref: hoverZone,
						class: normalizeClass(unref(ns).e("hover-zone"))
					}, null, 2))], 2112)) : createCommentVNode("v-if", true),
					createCommentVNode(" eslint-enable vue/html-self-closing ")
				]),
				_: 3
			}, 8, [
				"class",
				"wrap-class",
				"view-class"
			]));
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/node.mjs
var uid = 0;
var calculatePathNodes = (node) => {
	const nodes = [node];
	let { parent } = node;
	while (parent) {
		nodes.unshift(parent);
		parent = parent.parent;
	}
	return nodes;
};
var Node = class Node {
	constructor(data, config, parent, root = false) {
		this.data = data;
		this.config = config;
		this.parent = parent;
		this.root = root;
		this.uid = uid++;
		this.checked = false;
		this.indeterminate = false;
		this.loading = false;
		const { value: valueKey, label: labelKey, children: childrenKey } = config;
		const childrenData = data[childrenKey];
		const pathNodes = calculatePathNodes(this);
		this.level = root ? 0 : parent ? parent.level + 1 : 1;
		this.value = data[valueKey];
		this.label = data[labelKey];
		this.pathNodes = pathNodes;
		this.pathValues = pathNodes.map((node) => node.value);
		this.pathLabels = pathNodes.map((node) => node.label);
		this.childrenData = childrenData;
		this.children = (childrenData || []).map((child) => new Node(child, config, this));
		this.loaded = !config.lazy || this.isLeaf || !isEmpty(childrenData);
		this.text = "";
	}
	get isDisabled() {
		const { data, parent, config } = this;
		const { disabled, checkStrictly } = config;
		return (isFunction(disabled) ? disabled(data, this) : !!data[disabled]) || !checkStrictly && !!parent?.isDisabled;
	}
	get isLeaf() {
		const { data, config, childrenData, loaded } = this;
		const { lazy, leaf } = config;
		const isLeaf = isFunction(leaf) ? leaf(data, this) : data[leaf];
		return isUndefined(isLeaf) ? lazy && !loaded ? false : !(isArray(childrenData) && childrenData.length) : !!isLeaf;
	}
	get valueByOption() {
		return this.config.emitPath ? this.pathValues : this.value;
	}
	appendChild(childData) {
		const { childrenData, children } = this;
		const node = new Node(childData, this.config, this);
		if (isArray(childrenData)) childrenData.push(childData);
		else this.childrenData = [childData];
		children.push(node);
		return node;
	}
	calcText(allLevels, separator) {
		const text = allLevels ? this.pathLabels.join(separator) : this.label;
		this.text = text;
		return text;
	}
	broadcast(checked) {
		this.children.forEach((child) => {
			if (child) {
				child.broadcast(checked);
				child.onParentCheck?.(checked);
			}
		});
	}
	emit() {
		const { parent } = this;
		if (parent) {
			parent.onChildCheck?.();
			parent.emit();
		}
	}
	onParentCheck(checked) {
		if (!this.isDisabled) this.setCheckState(checked);
	}
	onChildCheck() {
		const { children } = this;
		const validChildren = children.filter((child) => !child.isDisabled);
		const checked = validChildren.length ? validChildren.every((child) => child.checked) : false;
		this.setCheckState(checked);
	}
	setCheckState(checked) {
		const totalNum = this.children.length;
		const checkedNum = this.children.reduce((c, p) => {
			return c + (p.checked ? 1 : p.indeterminate ? .5 : 0);
		}, 0);
		this.checked = this.loaded && this.children.filter((child) => !child.isDisabled).every((child) => child.loaded && child.checked) && checked;
		this.indeterminate = this.loaded && checkedNum !== totalNum && checkedNum > 0;
	}
	doCheck(checked) {
		if (this.checked === checked) return;
		const { checkStrictly, multiple } = this.config;
		if (checkStrictly || !multiple) this.checked = checked;
		else {
			this.broadcast(checked);
			this.setCheckState(checked);
			this.emit();
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/store.mjs
var flatNodes = (nodes, leafOnly) => {
	return nodes.reduce((res, node) => {
		if (node.isLeaf) res.push(node);
		else {
			!leafOnly && res.push(node);
			res = res.concat(flatNodes(node.children, leafOnly));
		}
		return res;
	}, []);
};
var Store = class {
	constructor(data, config) {
		this.config = config;
		const nodes = (data || []).map((nodeData) => new Node(nodeData, this.config));
		this.nodes = nodes;
		this.allNodes = flatNodes(nodes, false);
		this.leafNodes = flatNodes(nodes, true);
	}
	getNodes() {
		return this.nodes;
	}
	getFlattedNodes(leafOnly) {
		return leafOnly ? this.leafNodes : this.allNodes;
	}
	appendNode(nodeData, parentNode) {
		const node = parentNode ? parentNode.appendChild(nodeData) : new Node(nodeData, this.config);
		if (!parentNode) this.nodes.push(node);
		this.appendAllNodesAndLeafNodes(node);
	}
	appendNodes(nodeDataList, parentNode) {
		if (nodeDataList.length > 0) nodeDataList.forEach((nodeData) => this.appendNode(nodeData, parentNode));
		else parentNode && parentNode.isLeaf && this.leafNodes.push(parentNode);
	}
	appendAllNodesAndLeafNodes(node) {
		this.allNodes.push(node);
		node.isLeaf && this.leafNodes.push(node);
		if (node.children) node.children.forEach((subNode) => {
			this.appendAllNodesAndLeafNodes(subNode);
		});
	}
	getNodeByValue(value, leafOnly = false) {
		if (isPropAbsent(value)) return null;
		return this.getFlattedNodes(leafOnly).find((node) => isEqual$1(node.value, value) || isEqual$1(node.pathValues, value)) || null;
	}
	getSameNode(node) {
		if (!node) return null;
		return this.getFlattedNodes(false).find(({ value, level }) => isEqual$1(node.value, value) && node.level === level) || null;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/src/utils.mjs
var getMenuIndex = (el) => {
	if (!el) return 0;
	const pieces = el.id.split("-");
	return Number(pieces[pieces.length - 2]);
};
var checkNode = (el) => {
	if (!el) return;
	const input = el.querySelector("input");
	if (input) input.click();
	else if (isLeaf(el)) el.click();
};
var sortByOriginalOrder = (oldNodes, newNodes) => {
	const newNodesCopy = newNodes.slice(0);
	const newIds = newNodesCopy.map((node) => node.uid);
	const res = oldNodes.reduce((acc, item) => {
		const index = newIds.indexOf(item.uid);
		if (index > -1) {
			acc.push(item);
			newNodesCopy.splice(index, 1);
			newIds.splice(index, 1);
		}
		return acc;
	}, []);
	res.push(...newNodesCopy);
	return res;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader-panel/index.mjs
var ElCascaderPanel = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElCascaderPanel",
	__name: "index",
	props: cascaderPanelProps,
	emits: cascaderPanelEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		let manualChecked = false;
		const ns = useNamespace("cascader");
		const config = useCascaderConfig(props);
		const slots = useSlots();
		let store;
		const initialLoaded = ref(true);
		const initialLoadedOnce = ref(false);
		const menuList = ref([]);
		const checkedValue = ref();
		const menus = ref([]);
		const expandingNode = ref();
		const checkedNodes = ref([]);
		const isHoverMenu = computed(() => config.value.expandTrigger === "hover");
		const renderLabelFn = computed(() => props.renderLabel || slots.default);
		const virtualScroll = computed(() => props.virtualScroll);
		const itemSize = computed(() => props.itemSize);
		const height = computed(() => props.height);
		const initStore = () => {
			const { options } = props;
			const cfg = config.value;
			manualChecked = false;
			store = new Store(options, cfg);
			menus.value = [store.getNodes()];
			if (cfg.lazy && isEmpty(props.options)) {
				initialLoaded.value = false;
				lazyLoad(void 0, (list) => {
					if (list) {
						store = new Store(list, cfg);
						menus.value = [store.getNodes()];
					}
					initialLoaded.value = true;
					syncCheckedValue(false, true);
				});
			} else syncCheckedValue(false, true);
		};
		const lazyLoad = (node, cb) => {
			const cfg = config.value;
			node = node || new Node({}, cfg, void 0, true);
			node.loading = true;
			const resolve = (dataList) => {
				const _node = node;
				const parent = _node.root ? null : _node;
				_node.loading = false;
				_node.loaded = true;
				_node.childrenData = _node.childrenData || [];
				dataList && store?.appendNodes(dataList, parent);
				dataList && cb?.(dataList);
				if (node.level === 0) initialLoadedOnce.value = true;
			};
			const reject = () => {
				node.loading = false;
				node.loaded = false;
				if (node.level === 0) initialLoaded.value = true;
			};
			cfg.lazyLoad(node, resolve, reject);
		};
		const expandNode = (node, silent) => {
			const { level } = node;
			const newMenus = menus.value.slice(0, level);
			let newExpandingNode;
			if (node.isLeaf) newExpandingNode = node.pathNodes[level - 2];
			else {
				newExpandingNode = node;
				newMenus.push(node.children);
			}
			if (expandingNode.value?.uid !== newExpandingNode?.uid) {
				expandingNode.value = node;
				menus.value = newMenus;
				!silent && emit("expand-change", node?.pathValues || []);
			}
		};
		const handleCheckChange = (node, checked, emitClose = true) => {
			const { checkStrictly, multiple } = config.value;
			const oldNode = checkedNodes.value[0];
			manualChecked = true;
			!multiple && oldNode?.doCheck(false);
			node.doCheck(checked);
			calculateCheckedValue();
			emitClose && !multiple && !checkStrictly && emit("close");
			!emitClose && !multiple && expandParentNode(node);
		};
		const expandParentNode = (node) => {
			if (!node) return;
			node = node.parent;
			expandParentNode(node);
			node && expandNode(node);
		};
		const getFlattedNodes = (leafOnly) => store?.getFlattedNodes(leafOnly);
		const getCheckedNodes = (leafOnly) => {
			return getFlattedNodes(leafOnly)?.filter(({ checked }) => checked !== false);
		};
		const clearCheckedNodes = () => {
			checkedNodes.value.forEach((node) => node.doCheck(false));
			calculateCheckedValue();
			menus.value = menus.value.slice(0, 1);
			expandingNode.value = void 0;
			emit("expand-change", []);
		};
		const calculateCheckedValue = () => {
			const { checkStrictly, multiple } = config.value;
			const oldNodes = checkedNodes.value;
			const nodes = sortByOriginalOrder(oldNodes, getCheckedNodes(!checkStrictly));
			const values = nodes.map((node) => node.valueByOption);
			checkedNodes.value = nodes;
			checkedValue.value = multiple ? values : values[0] ?? null;
		};
		const syncCheckedValue = (loaded = false, forced = false) => {
			const { modelValue } = props;
			const { lazy, multiple, checkStrictly } = config.value;
			const leafOnly = !checkStrictly;
			if (!initialLoaded.value || manualChecked || !forced && isEqual$1(modelValue, checkedValue.value)) return;
			if (lazy && !loaded) {
				const nodes = unique(flattenDeep(castArray(modelValue))).map((val) => store?.getNodeByValue(val)).filter((node) => !!node && !node.loaded && !node.loading);
				if (nodes.length) nodes.forEach((node) => {
					lazyLoad(node, () => syncCheckedValue(false, forced));
				});
				else syncCheckedValue(true, forced);
			} else {
				syncMenuState(unique((multiple ? castArray(modelValue) : [modelValue]).map((val) => store?.getNodeByValue(val, leafOnly))), forced);
				checkedValue.value = cloneDeep(modelValue ?? void 0);
			}
		};
		const syncMenuState = (newCheckedNodes, reserveExpandingState = true) => {
			const { checkStrictly } = config.value;
			const oldNodes = checkedNodes.value;
			const newNodes = newCheckedNodes.filter((node) => !!node && (checkStrictly || node.isLeaf));
			const oldExpandingNode = store?.getSameNode(expandingNode.value);
			const newExpandingNode = reserveExpandingState && oldExpandingNode || newNodes[0];
			if (newExpandingNode) newExpandingNode.pathNodes.forEach((node) => expandNode(node, true));
			else expandingNode.value = void 0;
			oldNodes.forEach((node) => node.doCheck(false));
			reactive(newNodes).forEach((node) => node.doCheck(true));
			checkedNodes.value = newNodes;
			nextTick(scrollToExpandingNode);
		};
		const scrollToExpandingNode = () => {
			if (!isClient) return;
			menuList.value.forEach((menu) => {
				const menuElement = menu?.$el;
				if (menuElement) if (virtualScroll.value) {
					const activeIndex = menu?.getActiveNodeIndex?.();
					if (activeIndex !== void 0 && activeIndex >= 0) menu?.scrollToItem?.(activeIndex);
				} else {
					const container = menuElement.querySelector(`.${ns.namespace.value}-scrollbar__wrap`);
					let activeNode = menuElement.querySelector(`.${ns.b("node")}.in-active-path`);
					if (!activeNode) {
						const activeElements = menuElement.querySelectorAll(`.${ns.b("node")}.${ns.is("active")}`);
						activeNode = activeElements[activeElements.length - 1];
					}
					scrollIntoView(container, activeNode);
				}
			});
		};
		const handleKeyDown = (e) => {
			const target = e.target;
			const code = getEventCode(e);
			switch (code) {
				case EVENT_CODE.up:
				case EVENT_CODE.down: {
					e.preventDefault();
					const distance = code === EVENT_CODE.up ? -1 : 1;
					if (virtualScroll.value) {
						const menuIndex = getMenuIndex(target);
						const menu = menuList.value[menuIndex];
						if (menu) {
							const currentIndex = menu.getNodeIndexById(target.id);
							if (currentIndex >= 0) {
								const nodesInMenu = menus.value[menuIndex] ?? [];
								const nodesCount = nodesInMenu.length;
								let targetIndex = currentIndex + distance;
								while (targetIndex >= 0 && targetIndex < nodesCount) {
									if (!nodesInMenu[targetIndex].isDisabled) {
										menu.focusNodeAt(targetIndex);
										return;
									}
									targetIndex += distance;
								}
							}
						}
					}
					focusNode(getSibling(target, distance, `.${ns.b("node")}[tabindex="-1"]`));
					break;
				}
				case EVENT_CODE.left: {
					e.preventDefault();
					const expandedNode = menuList.value[getMenuIndex(target) - 1]?.$el.querySelector(`.${ns.b("node")}[aria-expanded="true"]`);
					focusNode(expandedNode);
					break;
				}
				case EVENT_CODE.right: {
					e.preventDefault();
					const firstNode = menuList.value[getMenuIndex(target) + 1]?.$el.querySelector(`.${ns.b("node")}[tabindex="-1"]`);
					focusNode(firstNode);
					break;
				}
				case EVENT_CODE.enter:
				case EVENT_CODE.numpadEnter: checkNode(target);
			}
		};
		provide(CASCADER_PANEL_INJECTION_KEY, reactive({
			config,
			expandingNode,
			checkedNodes,
			isHoverMenu,
			initialLoaded,
			renderLabelFn,
			virtualScroll,
			itemSize,
			height,
			lazyLoad,
			expandNode,
			handleCheckChange
		}));
		watch(config, (newVal, oldVal) => {
			if (isEqual$1(newVal, oldVal)) return;
			initStore();
		}, { immediate: true });
		watch(() => props.options, initStore, { deep: true });
		watch(() => props.modelValue, () => {
			manualChecked = false;
			syncCheckedValue();
		}, { deep: true });
		watch(() => checkedValue.value, (val) => {
			if (!isEqual$1(val, props.modelValue)) {
				emit(UPDATE_MODEL_EVENT, val);
				emit(CHANGE_EVENT, val);
			}
		});
		const loadLazyRootNodes = () => {
			if (initialLoadedOnce.value || !initialLoaded.value) return;
			initStore();
		};
		onBeforeUpdate(() => menuList.value = []);
		onMounted(() => !isEmpty(props.modelValue) && syncCheckedValue());
		__expose({
			menuList,
			menus,
			checkedNodes,
			handleKeyDown,
			handleCheckChange,
			getFlattedNodes,
			/**
			* @description get an array of currently selected node,(leafOnly) whether only return the leaf checked nodes, default is `false`
			*/
			getCheckedNodes,
			/**
			* @description clear checked nodes
			*/
			clearCheckedNodes,
			calculateCheckedValue,
			scrollToExpandingNode,
			loadLazyRootNodes
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([unref(ns).b("panel"), unref(ns).is("bordered", __props.border)]),
				onKeydown: handleKeyDown
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(menus.value, (menu, index) => {
				return openBlock(), createBlock(menu_default, {
					key: index,
					ref_for: true,
					ref: (item) => menuList.value[index] = item,
					index,
					nodes: [...menu],
					"virtual-scroll": virtualScroll.value,
					"item-size": itemSize.value,
					height: height.value
				}, {
					empty: withCtx(() => [renderSlot(_ctx.$slots, "empty")]),
					_: 3
				}, 8, [
					"index",
					"nodes",
					"virtual-scroll",
					"item-size",
					"height"
				]);
			}), 128))], 34);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader/src/cascader.mjs
/**
* @deprecated Removed after 3.0.0, Use `CascaderComponentProps` instead.
*/
var cascaderProps = buildProps({
	...CommonProps,
	/**
	* @description size of input
	*/
	size: useSizeProp,
	/**
	* @description placeholder of input
	*/
	placeholder: String,
	/**
	* @description whether Cascader is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether selected value can be cleared
	*/
	clearable: Boolean,
	/**
	* @description custom clear icon component
	*/
	clearIcon: {
		type: iconPropType,
		default: circle_close_default
	},
	/**
	* @description whether the options can be searched
	*/
	filterable: Boolean,
	/**
	* @description customize search logic, the first parameter is `node`, the second is `keyword`, and need return a boolean value indicating whether it hits.
	*/
	filterMethod: {
		type: definePropType(Function),
		default: (node, keyword) => node.text.includes(keyword)
	},
	/**
	* @description option label separator
	*/
	separator: {
		type: String,
		default: " / "
	},
	/**
	* @description whether to display all levels of the selected value in the input
	*/
	showAllLevels: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to collapse tags in multiple selection mode
	*/
	collapseTags: Boolean,
	/**
	* @description The max tags number to be shown. To use this, collapse-tags must be true
	*/
	maxCollapseTags: {
		type: Number,
		default: 1
	},
	/**
	* @description whether show all selected tags when mouse hover text of collapse-tags. To use this, collapse-tags must be true
	*/
	collapseTagsTooltip: Boolean,
	/**
	* @description The max height of collapse tags tooltip, in pixels. To use this, collapse-tags-tooltip must be true
	*/
	maxCollapseTagsTooltipHeight: { type: [String, Number] },
	/**
	* @description debounce delay when typing filter keyword, in milliseconds
	*/
	debounce: {
		type: Number,
		default: 300
	},
	/**
	* @description hook function before filtering with the value to be filtered as its parameter. If `false` is returned or a `Promise` is returned and then is rejected, filtering will be aborted
	*/
	beforeFilter: {
		type: definePropType(Function),
		default: () => true
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
			"bottom",
			"top-start",
			"top",
			"right",
			"left"
		]
	},
	/**
	* @description custom class name for Cascader's dropdown
	*/
	popperClass: useTooltipContentProps.popperClass,
	/**
	* @description custom style for Cascader's dropdown
	*/
	popperStyle: useTooltipContentProps.popperStyle,
	/**
	* @description whether cascader popup is teleported
	*/
	teleported: useTooltipContentProps.teleported,
	/**
	* @description tooltip theme, built-in theme: `dark` / `light`
	*/
	effect: {
		type: definePropType(String),
		default: "light"
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
	* @description when dropdown is inactive and `persistent` is `false`, dropdown will be destroyed
	*/
	persistent: {
		type: Boolean,
		default: true
	},
	/**
	* @description Use `parent` when you want things tidy (like "Entire Collection" instead of listing 100 items)
	* Use `child` when every single item matters (like important settings)
	*/
	showCheckedStrategy: {
		type: String,
		values: ["parent", "child"],
		default: "child"
	},
	/**
	* @description whether to check or uncheck node when clicking on the node
	*/
	checkOnClickNode: Boolean,
	/**
	* @description whether to show the radio or checkbox prefix
	*/
	showPrefix: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether the width of the suggestion panel is the same as the input, if the value is `number`, then the width is fixed
	*/
	fitInputWidth: {
		type: [Boolean, Number],
		default: false
	},
	...useEmptyValuesProps
});
var emitChangeFn = (value) => true;
var cascaderEmits = {
	[UPDATE_MODEL_EVENT]: emitChangeFn,
	[CHANGE_EVENT]: emitChangeFn,
	focus: (evt) => evt instanceof FocusEvent,
	blur: (evt) => evt instanceof FocusEvent,
	clear: () => true,
	visibleChange: (val) => isBoolean(val),
	expandChange: (val) => !!val,
	removeTag: (val) => !!val
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader/src/cascader.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$8 = ["placeholder"];
var _hoisted_2$2 = ["onClick"];
var _hoisted_3 = [
	"id",
	"data-suggestion-index",
	"onClick"
];
var SUGGESTION_ITEM_EXTRA_WIDTH = 34;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/cascader/index.mjs
var ElCascader = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElCascader",
	__name: "cascader",
	props: cascaderProps,
	emits: cascaderEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const popperOptions = { modifiers: [{
			name: "arrowPosition",
			enabled: true,
			phase: "main",
			fn: ({ state }) => {
				const { modifiersData, placement } = state;
				if ([
					"right",
					"left",
					"bottom",
					"top"
				].includes(placement)) return;
				if (modifiersData.arrow) modifiersData.arrow.x = 35;
			},
			requires: ["arrow"]
		}] };
		const props = __props;
		const emit = __emit;
		const attrs = useAttrs();
		const slots = useSlots();
		let inputInitialHeight = 0;
		let pressDeleteCount = 0;
		const nsCascader = useNamespace("cascader");
		const nsInput = useNamespace("input");
		const sizeMapPadding = {
			small: 7,
			default: 11,
			large: 15
		};
		const { t } = useLocale();
		const { formItem } = useFormItem();
		const isDisabled = useFormDisabled();
		const { valueOnClear } = useEmptyValues(props);
		const { isComposing, handleComposition } = useComposition({ afterComposition(event) {
			const text = event.target?.value;
			handleInput(text);
		} });
		const tooltipRef = ref();
		const tagTooltipRef = ref();
		const inputRef = ref();
		const tagWrapper = ref();
		const cascaderPanelRef = ref();
		const suggestionPanel = ref();
		const suggestionVirtualListRef = ref();
		const popperVisible = ref(false);
		const inputHover = ref(false);
		const filtering = ref(false);
		const inputValue = ref("");
		const searchInputValue = ref("");
		const tags = ref([]);
		const suggestions = ref([]);
		const suggestionListWidth = ref("100%");
		const hasCustomSuggestionItemSlot = computed(() => !!slots["suggestion-item"]);
		const clampedSuggestionListHeight = computed(() => clamp(suggestions.value.length * props.itemSize, props.itemSize, props.height));
		const showTagList = computed(() => {
			if (!props.props.multiple) return [];
			return props.collapseTags ? tags.value.slice(0, props.maxCollapseTags) : tags.value;
		});
		const collapseTagList = computed(() => {
			if (!props.props.multiple) return [];
			return props.collapseTags ? tags.value.slice(props.maxCollapseTags) : [];
		});
		const cascaderStyle = computed(() => {
			return attrs.style;
		});
		const inputPlaceholder = computed(() => props.placeholder ?? t("el.cascader.placeholder"));
		const currentPlaceholder = computed(() => searchInputValue.value || tags.value.length > 0 || isComposing.value ? "" : inputPlaceholder.value);
		const realSize = useFormSize();
		const tagSize = computed(() => realSize.value === "small" ? "small" : "default");
		const multiple = computed(() => !!props.props.multiple);
		const readonly = computed(() => !props.filterable || multiple.value);
		const searchKeyword = computed(() => multiple.value ? searchInputValue.value : inputValue.value);
		const checkedNodes = computed(() => cascaderPanelRef.value?.checkedNodes || []);
		const { wrapperRef, isFocused, handleBlur } = useFocusController(inputRef, {
			disabled: isDisabled,
			beforeBlur(event) {
				return tooltipRef.value?.isFocusInsideContent(event) || tagTooltipRef.value?.isFocusInsideContent(event);
			},
			afterBlur() {
				if (props.validateEvent) formItem?.validate?.("blur").catch(NOOP);
			}
		});
		const clearBtnVisible = computed(() => {
			if (!props.clearable || isDisabled.value || filtering.value || !inputHover.value && !isFocused.value) return false;
			return !!checkedNodes.value.length;
		});
		const presentText = computed(() => {
			const { showAllLevels, separator } = props;
			const nodes = checkedNodes.value;
			return nodes.length ? multiple.value ? "" : nodes[0].calcText(showAllLevels, separator) : "";
		});
		const validateState = computed(() => formItem?.validateState || "");
		const checkedValue = computed({
			get() {
				return cloneDeep(props.modelValue);
			},
			set(val) {
				const value = val ?? valueOnClear.value;
				emit(UPDATE_MODEL_EVENT, value);
				emit(CHANGE_EVENT, value);
				if (props.validateEvent) formItem?.validate("change").catch(NOOP);
			}
		});
		const cascaderKls = computed(() => {
			return [
				nsCascader.b(),
				nsCascader.m(realSize.value),
				nsCascader.is("disabled", isDisabled.value),
				attrs.class
			];
		});
		const cascaderIconKls = computed(() => {
			return [
				nsInput.e("icon"),
				"icon-arrow-down",
				nsCascader.is("reverse", popperVisible.value)
			];
		});
		const inputClass = computed(() => nsCascader.is("focus", isFocused.value));
		const contentRef = computed(() => {
			return tooltipRef.value?.popperRef?.contentRef;
		});
		const handleClickOutside = (event) => {
			if (isFocused.value) handleBlur(new FocusEvent("blur", event));
			togglePopperVisible(false);
		};
		const togglePopperVisible = (visible) => {
			if (isDisabled.value) return;
			visible = visible ?? !popperVisible.value;
			if (visible !== popperVisible.value) {
				popperVisible.value = visible;
				inputRef.value?.input?.setAttribute("aria-expanded", `${visible}`);
				if (visible) {
					updatePopperPosition();
					cascaderPanelRef.value && nextTick(cascaderPanelRef.value.scrollToExpandingNode);
				} else if (props.filterable) syncPresentTextValue();
				emit("visibleChange", visible);
			}
		};
		const updatePopperPosition = () => {
			nextTick(() => {
				tooltipRef.value?.updatePopper();
			});
		};
		const hideSuggestionPanel = () => {
			filtering.value = false;
		};
		const genTag = (node) => {
			const { showAllLevels, separator } = props;
			return {
				node,
				key: node.uid,
				text: node.calcText(showAllLevels, separator),
				hitState: false,
				closable: !isDisabled.value && !node.isDisabled
			};
		};
		const deleteTag = (tag) => {
			const node = tag.node;
			node.doCheck(false);
			cascaderPanelRef.value?.calculateCheckedValue();
			emit("removeTag", node.valueByOption);
		};
		const getStrategyCheckedNodes = () => {
			switch (props.showCheckedStrategy) {
				case "child": return checkedNodes.value;
				case "parent": {
					const clickedNodes = getCheckedNodes(false);
					const clickedNodesValue = clickedNodes.map((o) => o.value);
					return clickedNodes.filter((o) => !o.parent || !clickedNodesValue.includes(o.parent.value));
				}
				default: return [];
			}
		};
		const calculatePresentTags = () => {
			if (!multiple.value) return;
			const nodes = getStrategyCheckedNodes();
			const allTags = [];
			nodes.forEach((node) => allTags.push(genTag(node)));
			tags.value = allTags;
		};
		const calculateSuggestions = () => {
			const { filterMethod, showAllLevels, separator } = props;
			const res = cascaderPanelRef.value?.getFlattedNodes(!props.props.checkStrictly)?.filter((node) => {
				if (node.isDisabled) return false;
				node.calcText(showAllLevels, separator);
				return filterMethod(node, searchKeyword.value);
			});
			if (multiple.value) tags.value.forEach((tag) => {
				tag.hitState = false;
			});
			filtering.value = true;
			suggestions.value = res;
			nextTick(() => {
				if (props.virtualScroll && suggestions.value.length > 0) suggestionVirtualListRef.value?.scrollToItem(0);
				updateStyle();
			});
			updatePopperPosition();
		};
		const getSuggestionPanelEl = (selector) => {
			const el = suggestionPanel.value;
			return selector ? el?.querySelector(selector) ?? void 0 : el;
		};
		const focusFirstNode = () => {
			let firstNode;
			if (filtering.value && suggestionPanel.value) firstNode = getSuggestionPanelEl(`.${nsCascader.e("suggestion-item")}`);
			else firstNode = cascaderPanelRef.value?.$el.querySelector(`.${nsCascader.b("node")}[tabindex="-1"]`);
			if (firstNode) {
				firstNode.focus();
				if (!filtering.value && firstNode.getAttribute("aria-haspopup") === "true") firstNode.click();
			}
		};
		const updateSuggestionPanelWidth = (inputWidth) => {
			const suggestionPanelEl = getSuggestionPanelEl();
			if (!suggestionPanelEl) return;
			const panelWidth = isNumber(props.fitInputWidth) ? `${props.fitInputWidth}px` : `${inputWidth}px`;
			const setPanelStyle = (el) => {
				if (props.fitInputWidth !== false) {
					el.style.width = panelWidth;
					el.style.minWidth = "";
				} else {
					el.style.width = "";
					el.style.minWidth = panelWidth;
				}
			};
			setPanelStyle(suggestionPanelEl);
			if (props.virtualScroll) {
				suggestionListWidth.value = props.fitInputWidth !== false ? panelWidth : hasCustomSuggestionItemSlot.value ? `${inputWidth}px` : `${Math.max(inputWidth, calculateSuggestionMaxWidth())}px`;
				return;
			}
			const suggestionList = getSuggestionPanelEl(`.${nsCascader.e("suggestion-list")}`);
			if (suggestionList) setPanelStyle(suggestionList);
		};
		const getTagWrapperLeft = () => {
			if (!slots.prefix) return 0;
			const prefix = inputRef.value?.$el.querySelector(`.${nsInput.e("prefix")}`);
			if (!prefix) return 0;
			const prefixWidth = prefix.getBoundingClientRect().width;
			if (prefixWidth <= 0) return 0;
			return prefixWidth + sizeMapPadding[realSize.value || "default"];
		};
		const updateStyle = () => {
			const inputInner = inputRef.value?.input;
			const inputWrapper = inputRef.value?.$el;
			if (!isClient || !inputInner || !inputWrapper) return;
			if (suggestionPanel.value) updateSuggestionPanelWidth(inputWrapper.getBoundingClientRect().width);
			const tagWrapperEl = tagWrapper.value;
			if (tagWrapperEl) {
				const height = tags.value.length > 0 ? `${Math.max(tagWrapperEl.offsetHeight, inputInitialHeight) - 2}px` : `${inputInitialHeight}px`;
				inputInner.style.height = height;
				tagWrapperEl.style.left = `${getTagWrapperLeft()}px`;
				updatePopperPosition();
			}
		};
		const calculateSuggestionMaxWidth = () => {
			if (hasCustomSuggestionItemSlot.value) return 0;
			if (!suggestions.value.length) return 0;
			const ctx = document.createElement("canvas").getContext("2d");
			if (!ctx) return 0;
			const renderedSuggestion = getSuggestionPanelEl(`.${nsCascader.e("suggestion-item")}`);
			if (!renderedSuggestion || !isClient) return 0;
			const style = getComputedStyle(renderedSuggestion);
			const padding = Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
			ctx.font = `bold ${style.fontSize} ${style.fontFamily}`;
			let maxWidth = 0;
			let hasChecked = false;
			for (const suggestion of suggestions.value) {
				const text = suggestion.text || "";
				const metrics = ctx.measureText(text);
				maxWidth = Math.max(maxWidth, metrics.width);
				if (suggestion.checked && !hasChecked) hasChecked = true;
			}
			return maxWidth + padding + (hasChecked ? SUGGESTION_ITEM_EXTRA_WIDTH : 0);
		};
		const getCheckedNodes = (leafOnly) => {
			return cascaderPanelRef.value?.getCheckedNodes(leafOnly);
		};
		const handleExpandChange = (value) => {
			updatePopperPosition();
			emit("expandChange", value);
		};
		const handleKeyDown = (e) => {
			if (isComposing.value) return;
			switch (getEventCode(e)) {
				case EVENT_CODE.enter:
				case EVENT_CODE.numpadEnter:
					togglePopperVisible();
					break;
				case EVENT_CODE.down:
					togglePopperVisible(true);
					nextTick(focusFirstNode);
					e.preventDefault();
					break;
				case EVENT_CODE.esc:
					if (popperVisible.value === true) {
						e.preventDefault();
						e.stopPropagation();
						togglePopperVisible(false);
					}
					break;
				case EVENT_CODE.tab: togglePopperVisible(false);
			}
		};
		const handleClear = () => {
			cascaderPanelRef.value?.clearCheckedNodes();
			if (!popperVisible.value && props.filterable) syncPresentTextValue();
			togglePopperVisible(false);
			emit("clear");
		};
		const syncPresentTextValue = () => {
			const { value } = presentText;
			inputValue.value = value;
			searchInputValue.value = value;
		};
		const handleSuggestionClick = (node) => {
			const { checked } = node;
			if (multiple.value) cascaderPanelRef.value?.handleCheckChange(node, !checked, false);
			else {
				!checked && cascaderPanelRef.value?.handleCheckChange(node, true, false);
				togglePopperVisible(false);
			}
		};
		const getSuggestionIndexFromTarget = (target) => {
			const indexStr = target.closest("[data-suggestion-index]")?.dataset.suggestionIndex;
			if (!indexStr) return -1;
			const index = Number.parseInt(indexStr, 10);
			if (Number.isNaN(index) || index < 0 || index >= suggestions.value.length) return -1;
			return index;
		};
		const handleSuggestionKeyDown = (e) => {
			const target = e.target;
			const code = getEventCode(e);
			switch (code) {
				case EVENT_CODE.up:
				case EVENT_CODE.down: {
					e.preventDefault();
					const distance = code === EVENT_CODE.up ? -1 : 1;
					if (props.virtualScroll && suggestionVirtualListRef.value) {
						const currentIndex = getSuggestionIndexFromTarget(target);
						if (currentIndex >= 0) {
							const length = suggestions.value.length;
							const targetIndex = (currentIndex + distance + length) % length;
							suggestionVirtualListRef.value.scrollToItem(targetIndex);
							nextTick(() => {
								const targetItem = getSuggestionPanelEl(`#suggestion-${suggestions.value[targetIndex].uid}`);
								targetItem && focusNode(targetItem);
							});
							return;
						}
					}
					focusNode(getSibling(target, distance, `.${nsCascader.e("suggestion-item")}[tabindex="-1"]`));
					break;
				}
				case EVENT_CODE.enter:
				case EVENT_CODE.numpadEnter: target.click();
			}
		};
		const handleDelete = () => {
			const lastTag = tags.value[tags.value.length - 1];
			pressDeleteCount = searchInputValue.value ? 0 : pressDeleteCount + 1;
			if (!lastTag || !pressDeleteCount || props.collapseTags && tags.value.length > 1) return;
			if (lastTag.hitState) deleteTag(lastTag);
			else lastTag.hitState = true;
		};
		const handleFilter = useDebounceFn(() => {
			const { value } = searchKeyword;
			if (!value) return;
			const passed = props.beforeFilter(value);
			if (isPromise(passed)) passed.then(calculateSuggestions).catch(() => {});
			else if (passed !== false) calculateSuggestions();
			else hideSuggestionPanel();
		}, computed(() => props.debounce));
		const handleInput = (val, e) => {
			!popperVisible.value && togglePopperVisible(true);
			if (e?.isComposing) return;
			if (val) handleFilter();
			else {
				const passed = props.beforeFilter("");
				if (isPromise(passed)) passed.catch(() => {});
				hideSuggestionPanel();
			}
		};
		const getInputInnerHeight = (inputInner) => Number.parseFloat(useCssVar(nsInput.cssVarName("input-height"), inputInner).value) - 2;
		const focus = () => {
			inputRef.value?.focus();
		};
		const blur = () => {
			inputRef.value?.blur();
		};
		watch(filtering, updatePopperPosition);
		watch([
			checkedNodes,
			isDisabled,
			() => props.collapseTags,
			() => props.maxCollapseTags
		], calculatePresentTags);
		watch(tags, () => {
			nextTick(() => updateStyle());
		});
		watch(realSize, async () => {
			await nextTick();
			const inputInner = inputRef.value.input;
			inputInitialHeight = getInputInnerHeight(inputInner) || inputInitialHeight;
			updateStyle();
		});
		watch(presentText, syncPresentTextValue, { immediate: true });
		watch(() => popperVisible.value, (val) => {
			if (val && props.props.lazy && props.props.lazyLoad) cascaderPanelRef.value?.loadLazyRootNodes();
		});
		onMounted(() => {
			const inputInner = inputRef.value.input;
			const inputWrapper = inputRef.value.$el;
			const inputInnerHeight = getInputInnerHeight(inputInner);
			inputInitialHeight = inputInner.offsetHeight || inputInnerHeight;
			useResizeObserver(inputWrapper, updateStyle);
		});
		__expose({
			/**
			* @description get an array of currently selected node,(leafOnly) whether only return the leaf checked nodes, default is `false`
			*/
			getCheckedNodes,
			/**
			* @description cascader panel ref
			*/
			cascaderPanelRef,
			/**
			* @description toggle the visible of popper
			*/
			togglePopperVisible,
			/**
			* @description cascader content ref
			*/
			contentRef,
			/**
			* @description selected content text
			*/
			presentText,
			/** @description focus the input element */
			focus,
			/** @description blur the input element */
			blur
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElTooltip), {
				ref_key: "tooltipRef",
				ref: tooltipRef,
				visible: popperVisible.value,
				teleported: __props.teleported,
				"popper-class": [unref(nsCascader).e("dropdown"), __props.popperClass],
				"popper-style": __props.popperStyle,
				"popper-options": popperOptions,
				"fallback-placements": __props.fallbackPlacements,
				"stop-popper-mouse-event": false,
				"gpu-acceleration": false,
				placement: __props.placement,
				transition: `${unref(nsCascader).namespace.value}-zoom-in-top`,
				effect: __props.effect,
				pure: "",
				persistent: __props.persistent,
				onHide: hideSuggestionPanel
			}, {
				default: withCtx(() => [withDirectives((openBlock(), createElementBlock("div", {
					ref_key: "wrapperRef",
					ref: wrapperRef,
					class: normalizeClass(cascaderKls.value),
					style: normalizeStyle(cascaderStyle.value),
					onClick: _cache[8] || (_cache[8] = () => togglePopperVisible(readonly.value ? void 0 : true)),
					onKeydown: handleKeyDown,
					onMouseenter: _cache[9] || (_cache[9] = ($event) => inputHover.value = true),
					onMouseleave: _cache[10] || (_cache[10] = ($event) => inputHover.value = false)
				}, [createVNode(unref(ElInput), {
					ref_key: "inputRef",
					ref: inputRef,
					modelValue: inputValue.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => inputValue.value = $event),
					placeholder: currentPlaceholder.value,
					readonly: readonly.value,
					disabled: unref(isDisabled),
					"validate-event": false,
					size: unref(realSize),
					class: normalizeClass(inputClass.value),
					tabindex: multiple.value && __props.filterable && !unref(isDisabled) ? -1 : void 0,
					onCompositionstart: unref(handleComposition),
					onCompositionupdate: unref(handleComposition),
					onCompositionend: unref(handleComposition),
					onInput: handleInput
				}, createSlots({
					suffix: withCtx(() => [clearBtnVisible.value ? (openBlock(), createBlock(unref(ElIcon), {
						key: "clear",
						class: normalizeClass([unref(nsInput).e("icon"), "icon-circle-close"]),
						onClick: withModifiers(handleClear, ["stop"])
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.clearIcon)))]),
						_: 1
					}, 8, ["class"])) : (openBlock(), createBlock(unref(ElIcon), {
						key: "arrow-down",
						class: normalizeClass(cascaderIconKls.value),
						onClick: _cache[0] || (_cache[0] = withModifiers(($event) => togglePopperVisible(), ["stop"]))
					}, {
						default: withCtx(() => [createVNode(unref(arrow_down_default))]),
						_: 1
					}, 8, ["class"]))]),
					_: 2
				}, [_ctx.$slots.prefix ? {
					name: "prefix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "prefix")]),
					key: "0"
				} : void 0]), 1032, [
					"modelValue",
					"placeholder",
					"readonly",
					"disabled",
					"size",
					"class",
					"tabindex",
					"onCompositionstart",
					"onCompositionupdate",
					"onCompositionend"
				]), multiple.value ? (openBlock(), createElementBlock("div", {
					key: 0,
					ref_key: "tagWrapper",
					ref: tagWrapper,
					class: normalizeClass([unref(nsCascader).e("tags"), unref(nsCascader).is("validate", Boolean(validateState.value))])
				}, [
					renderSlot(_ctx.$slots, "tag", {
						data: tags.value,
						deleteTag
					}, () => [(openBlock(true), createElementBlock(Fragment, null, renderList(showTagList.value, (tag) => {
						return openBlock(), createBlock(unref(ElTag), {
							key: tag.key,
							type: __props.tagType,
							size: tagSize.value,
							effect: __props.tagEffect,
							hit: tag.hitState,
							closable: tag.closable,
							"disable-transitions": "",
							onClose: ($event) => deleteTag(tag)
						}, {
							default: withCtx(() => [createBaseVNode("span", null, toDisplayString(tag.text), 1)]),
							_: 2
						}, 1032, [
							"type",
							"size",
							"effect",
							"hit",
							"closable",
							"onClose"
						]);
					}), 128))]),
					__props.collapseTags && tags.value.length > __props.maxCollapseTags ? (openBlock(), createBlock(unref(ElTooltip), {
						key: 0,
						ref_key: "tagTooltipRef",
						ref: tagTooltipRef,
						disabled: popperVisible.value || !__props.collapseTagsTooltip,
						"fallback-placements": [
							"bottom",
							"top",
							"right",
							"left"
						],
						placement: "bottom",
						"popper-class": __props.popperClass,
						"popper-style": __props.popperStyle,
						effect: __props.effect,
						persistent: __props.persistent
					}, {
						default: withCtx(() => [createVNode(unref(ElTag), {
							closable: false,
							size: tagSize.value,
							type: __props.tagType,
							effect: __props.tagEffect,
							"disable-transitions": ""
						}, {
							default: withCtx(() => [createBaseVNode("span", { class: normalizeClass(unref(nsCascader).e("tags-text")) }, " + " + toDisplayString(tags.value.length - __props.maxCollapseTags), 3)]),
							_: 1
						}, 8, [
							"size",
							"type",
							"effect"
						])]),
						content: withCtx(() => [createVNode(unref(ElScrollbar), { "max-height": __props.maxCollapseTagsTooltipHeight }, {
							default: withCtx(() => [createBaseVNode("div", { class: normalizeClass(unref(nsCascader).e("collapse-tags")) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(collapseTagList.value, (tag, idx) => {
								return openBlock(), createElementBlock("div", {
									key: idx,
									class: normalizeClass(unref(nsCascader).e("collapse-tag"))
								}, [(openBlock(), createBlock(unref(ElTag), {
									key: tag.key,
									class: "in-tooltip",
									type: __props.tagType,
									size: tagSize.value,
									effect: __props.tagEffect,
									hit: tag.hitState,
									closable: tag.closable,
									"disable-transitions": "",
									onClose: ($event) => deleteTag(tag)
								}, {
									default: withCtx(() => [createBaseVNode("span", null, toDisplayString(tag.text), 1)]),
									_: 2
								}, 1032, [
									"type",
									"size",
									"effect",
									"hit",
									"closable",
									"onClose"
								]))], 2);
							}), 128))], 2)]),
							_: 1
						}, 8, ["max-height"])]),
						_: 1
					}, 8, [
						"disabled",
						"popper-class",
						"popper-style",
						"effect",
						"persistent"
					])) : createCommentVNode("v-if", true),
					__props.filterable && !unref(isDisabled) ? withDirectives((openBlock(), createElementBlock("input", {
						key: 1,
						"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => searchInputValue.value = $event),
						type: "text",
						class: normalizeClass(unref(nsCascader).e("search-input")),
						placeholder: presentText.value ? "" : inputPlaceholder.value,
						onInput: _cache[3] || (_cache[3] = (e) => handleInput(searchInputValue.value, e)),
						onClick: _cache[4] || (_cache[4] = withModifiers(($event) => togglePopperVisible(true), ["stop"])),
						onKeydown: withKeys(handleDelete, ["delete"]),
						onCompositionstart: _cache[5] || (_cache[5] = (...args) => unref(handleComposition) && unref(handleComposition)(...args)),
						onCompositionupdate: _cache[6] || (_cache[6] = (...args) => unref(handleComposition) && unref(handleComposition)(...args)),
						onCompositionend: _cache[7] || (_cache[7] = (...args) => unref(handleComposition) && unref(handleComposition)(...args))
					}, null, 42, _hoisted_1$8)), [[vModelText, searchInputValue.value]]) : createCommentVNode("v-if", true)
				], 2)) : createCommentVNode("v-if", true)], 38)), [[
					unref(ClickOutside),
					handleClickOutside,
					contentRef.value
				]])]),
				content: withCtx(() => [
					_ctx.$slots.header ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: normalizeClass(unref(nsCascader).e("header")),
						onClick: _cache[11] || (_cache[11] = withModifiers(() => {}, ["stop"]))
					}, [renderSlot(_ctx.$slots, "header")], 2)) : createCommentVNode("v-if", true),
					withDirectives(createVNode(unref(ElCascaderPanel), {
						ref_key: "cascaderPanelRef",
						ref: cascaderPanelRef,
						modelValue: checkedValue.value,
						"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => checkedValue.value = $event),
						options: __props.options,
						props: props.props,
						border: false,
						"render-label": _ctx.$slots.default,
						"virtual-scroll": __props.virtualScroll,
						"item-size": __props.itemSize,
						height: __props.height,
						onExpandChange: handleExpandChange,
						onClose: _cache[13] || (_cache[13] = ($event) => _ctx.$nextTick(() => togglePopperVisible(false)))
					}, {
						empty: withCtx(() => [renderSlot(_ctx.$slots, "empty")]),
						_: 3
					}, 8, [
						"modelValue",
						"options",
						"props",
						"render-label",
						"virtual-scroll",
						"item-size",
						"height"
					]), [[vShow, !filtering.value]]),
					__props.filterable ? (openBlock(), createElementBlock(Fragment, { key: 1 }, [!__props.virtualScroll ? withDirectives((openBlock(), createBlock(unref(ElScrollbar), {
						key: 0,
						ref: (ref) => suggestionPanel.value = ref?.$el,
						tag: "ul",
						class: normalizeClass(unref(nsCascader).e("suggestion-panel")),
						"wrap-class": unref(nsCascader).e("suggestion-wrap"),
						"view-class": unref(nsCascader).e("suggestion-list"),
						onKeydown: handleSuggestionKeyDown
					}, {
						default: withCtx(() => [suggestions.value.length ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(suggestions.value, (item) => {
							return openBlock(), createElementBlock("li", {
								key: item.uid,
								class: normalizeClass([unref(nsCascader).e("suggestion-item"), unref(nsCascader).is("checked", item.checked)]),
								tabindex: -1,
								onClick: ($event) => handleSuggestionClick(item)
							}, [renderSlot(_ctx.$slots, "suggestion-item", { item }, () => [createBaseVNode("span", null, toDisplayString(item.text), 1), item.checked ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
								default: withCtx(() => [createVNode(unref(check_default))]),
								_: 1
							})) : createCommentVNode("v-if", true)])], 10, _hoisted_2$2);
						}), 128)) : renderSlot(_ctx.$slots, "empty", { key: 1 }, () => [createBaseVNode("li", { class: normalizeClass(unref(nsCascader).e("empty-text")) }, toDisplayString(unref(t)("el.cascader.noMatch")), 3)])]),
						_: 3
					}, 8, [
						"class",
						"wrap-class",
						"view-class"
					])), [[vShow, filtering.value]]) : withDirectives((openBlock(), createElementBlock("div", {
						key: 1,
						ref_key: "suggestionPanel",
						ref: suggestionPanel,
						class: normalizeClass(unref(nsCascader).e("suggestion-panel")),
						onKeydown: handleSuggestionKeyDown
					}, [withDirectives(createVNode(unref(FixedSizeList), {
						ref_key: "suggestionVirtualListRef",
						ref: suggestionVirtualListRef,
						height: clampedSuggestionListHeight.value,
						"item-size": __props.itemSize,
						data: suggestions.value,
						total: suggestions.value.length,
						"class-name": unref(nsCascader).e("suggestion-list"),
						"inner-element": "ul",
						"inner-width": suggestionListWidth.value
					}, {
						default: withCtx(({ data, index, style }) => [(openBlock(), createElementBlock("li", {
							id: `suggestion-${data[index].uid}`,
							key: data[index].uid,
							"data-suggestion-index": index,
							class: normalizeClass([unref(nsCascader).e("suggestion-item"), unref(nsCascader).is("checked", data[index].checked)]),
							tabindex: -1,
							style: normalizeStyle(style),
							onClick: ($event) => handleSuggestionClick(data[index])
						}, [renderSlot(_ctx.$slots, "suggestion-item", { item: data[index] }, () => [createBaseVNode("span", null, toDisplayString(data[index].text), 1), data[index].checked ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
							default: withCtx(() => [createVNode(unref(check_default))]),
							_: 1
						})) : createCommentVNode("v-if", true)])], 14, _hoisted_3))]),
						_: 3
					}, 8, [
						"height",
						"item-size",
						"data",
						"total",
						"class-name",
						"inner-width"
					]), [[vShow, suggestions.value.length]]), !suggestions.value.length ? renderSlot(_ctx.$slots, "empty", { key: 0 }, () => [createBaseVNode("ul", { class: normalizeClass(unref(nsCascader).e("suggestion-list")) }, [createBaseVNode("li", { class: normalizeClass(unref(nsCascader).e("empty-text")) }, toDisplayString(unref(t)("el.cascader.noMatch")), 3)], 2)]) : createCommentVNode("v-if", true)], 34)), [[vShow, filtering.value]])], 64)) : createCommentVNode("v-if", true),
					_ctx.$slots.footer ? (openBlock(), createElementBlock("div", {
						key: 2,
						class: normalizeClass(unref(nsCascader).e("footer")),
						onClick: _cache[14] || (_cache[14] = withModifiers(() => {}, ["stop"]))
					}, [renderSlot(_ctx.$slots, "footer")], 2)) : createCommentVNode("v-if", true)
				]),
				_: 3
			}, 8, [
				"visible",
				"teleported",
				"popper-class",
				"popper-style",
				"fallback-placements",
				"placement",
				"transition",
				"effect",
				"persistent"
			]);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/color-picker-panel.mjs
/**
* @deprecated Removed after 3.0.0, Use `ColorPickerPanelProps` instead.
*/
var colorPickerPanelProps = buildProps({
	/**
	* @description binding value
	*/
	modelValue: {
		type: definePropType(String),
		default: void 0
	},
	/**
	* @description whether the color picker is bordered
	*/
	border: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to display the alpha slider
	*/
	showAlpha: Boolean,
	/**
	* @description color format of v-model
	*/
	colorFormat: { type: definePropType(String) },
	/**
	* @description whether to disable the color picker
	*/
	disabled: Boolean,
	/**
	* @description predefined color options
	*/
	predefine: { type: definePropType(Array) },
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	/**
	* @description class names will be passed to <hue-slider />
	*/
	hueSliderClass: { type: definePropType([
		String,
		Array,
		Object
	]) },
	/**
	* @description styles will be passed to <hue-slider />
	*/
	hueSliderStyle: {
		type: definePropType([
			String,
			Array,
			Object,
			Boolean
		]),
		default: void 0
	}
});
var colorPickerPanelEmits = { [UPDATE_MODEL_EVENT]: (val) => isString(val) || isNil(val) };
var ROOT_COMMON_COLOR_INJECTION_KEY = Symbol("colorCommonPickerKey");
var colorPickerPanelContextKey = Symbol("colorPickerPanelContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/props/slider.mjs
/**
* @deprecated Removed after 3.0.0, Use `AlphaSliderProps` instead.
*/
var alphaSliderProps = buildProps({
	color: {
		type: definePropType(Object),
		required: true
	},
	vertical: Boolean,
	disabled: Boolean
});
/**
* @deprecated Removed after 3.0.0, Use `HueSliderProps` instead.
*/
var hueSliderProps = alphaSliderProps;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/utils/draggable.mjs
var isDragging = false;
function draggable(element, options) {
	if (!isClient) return;
	const moveFn = function(event) {
		options.drag?.(event);
	};
	const upFn = function(event) {
		document.removeEventListener("mousemove", moveFn);
		document.removeEventListener("mouseup", upFn);
		document.removeEventListener("touchmove", moveFn);
		document.removeEventListener("touchend", upFn);
		document.onselectstart = null;
		document.ondragstart = null;
		isDragging = false;
		options.end?.(event);
	};
	const downFn = function(event) {
		if (isDragging) return;
		document.onselectstart = () => false;
		document.ondragstart = () => false;
		document.addEventListener("mousemove", moveFn);
		document.addEventListener("mouseup", upFn);
		document.addEventListener("touchmove", moveFn);
		document.addEventListener("touchend", upFn);
		isDragging = true;
		options.start?.(event);
	};
	element.addEventListener("mousedown", downFn);
	element.addEventListener("touchstart", downFn, { passive: false });
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/composables/use-slider.mjs
var useSlider = (props, { key, minValue, maxValue }) => {
	const instance = getCurrentInstance();
	const thumb = shallowRef();
	const bar = shallowRef();
	const currentValue = computed(() => props.color.get(key));
	function handleClick(event) {
		if (props.disabled) return;
		if (event.target !== thumb.value) handleDrag(event);
		thumb.value?.focus();
	}
	function handleDrag(event) {
		if (!bar.value || !thumb.value || props.disabled) return;
		const rect = instance.vnode.el.getBoundingClientRect();
		const { clientX, clientY } = getClientXY(event);
		let value;
		if (!props.vertical) {
			let left = clientX - rect.left;
			left = Math.max(thumb.value.offsetWidth / 2, left);
			left = Math.min(left, rect.width - thumb.value.offsetWidth / 2);
			value = Math.round((left - thumb.value.offsetWidth / 2) / (rect.width - thumb.value.offsetWidth) * maxValue);
		} else {
			let top = clientY - rect.top;
			top = Math.max(thumb.value.offsetHeight / 2, top);
			top = Math.min(top, rect.height - thumb.value.offsetHeight / 2);
			value = Math.round((top - thumb.value.offsetHeight / 2) / (rect.height - thumb.value.offsetHeight) * maxValue);
		}
		props.color.set(key, value);
	}
	function handleKeydown(event) {
		if (props.disabled) return;
		const { shiftKey } = event;
		const code = getEventCode(event);
		const step = shiftKey ? 10 : 1;
		const reverse = key === "hue" ? -1 : 1;
		let isPreventDefault = true;
		switch (code) {
			case EVENT_CODE.left:
			case EVENT_CODE.down:
				incrementPosition(-step * reverse);
				break;
			case EVENT_CODE.right:
			case EVENT_CODE.up:
				incrementPosition(step * reverse);
				break;
			case EVENT_CODE.home:
				props.color.set(key, key === "hue" ? maxValue : minValue);
				break;
			case EVENT_CODE.end:
				props.color.set(key, key === "hue" ? minValue : maxValue);
				break;
			case EVENT_CODE.pageDown:
				incrementPosition(-4 * reverse);
				break;
			case EVENT_CODE.pageUp:
				incrementPosition(4 * reverse);
				break;
			default: isPreventDefault = false;
		}
		isPreventDefault && event.preventDefault();
	}
	function incrementPosition(step) {
		let next = currentValue.value + step;
		next = next < minValue ? minValue : next > maxValue ? maxValue : next;
		props.color.set(key, next);
	}
	return {
		thumb,
		bar,
		currentValue,
		handleDrag,
		handleClick,
		handleKeydown
	};
};
var useSliderDOM = (props, { namespace, maxValue, bar, thumb, currentValue, handleDrag, getBackground }) => {
	const instance = getCurrentInstance();
	const ns = useNamespace(namespace);
	const thumbLeft = ref(0);
	const thumbTop = ref(0);
	const background = ref();
	function getThumbLeft() {
		if (!thumb.value) return 0;
		if (props.vertical) return 0;
		const el = instance.vnode.el;
		const value = currentValue.value;
		if (!el) return 0;
		return Math.round(value * (el.offsetWidth - thumb.value.offsetWidth / 2) / maxValue);
	}
	function getThumbTop() {
		if (!thumb.value) return 0;
		const el = instance.vnode.el;
		if (!props.vertical) return 0;
		const value = currentValue.value;
		if (!el) return 0;
		return Math.round(value * (el.offsetHeight - thumb.value.offsetHeight / 2) / maxValue);
	}
	function update() {
		thumbLeft.value = getThumbLeft();
		thumbTop.value = getThumbTop();
		background.value = getBackground?.();
	}
	onMounted(() => {
		if (!bar.value || !thumb.value) return;
		const dragConfig = {
			drag: (event) => {
				handleDrag(event);
			},
			end: (event) => {
				handleDrag(event);
			}
		};
		draggable(bar.value, dragConfig);
		draggable(thumb.value, dragConfig);
		update();
	});
	watch(currentValue, () => update());
	watch(() => props.color.value, () => update());
	const rootKls = computed(() => [
		ns.b(),
		ns.is("vertical", props.vertical),
		ns.is("disabled", props.disabled)
	]);
	const barKls = computed(() => ns.e("bar"));
	const thumbKls = computed(() => ns.e("thumb"));
	return {
		rootKls,
		barKls,
		barStyle: computed(() => ({ background: background.value })),
		thumbKls,
		thumbStyle: computed(() => ({
			left: addUnit(thumbLeft.value),
			top: addUnit(thumbTop.value)
		})),
		thumbLeft,
		thumbTop,
		update
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/alpha-slider.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$7 = [
	"aria-label",
	"aria-valuenow",
	"aria-valuetext",
	"aria-orientation",
	"tabindex",
	"aria-disabled"
];
var minValue$1 = 0;
var maxValue$1 = 100;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/alpha-slider.mjs
var alpha_slider_default = /* @__PURE__ */ defineComponent({
	name: "ElColorAlphaSlider",
	__name: "alpha-slider",
	props: alphaSliderProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const { currentValue, bar, thumb, handleDrag, handleClick, handleKeydown } = useSlider(props, {
			key: "alpha",
			minValue: minValue$1,
			maxValue: maxValue$1
		});
		const { rootKls, barKls, barStyle, thumbKls, thumbStyle, update } = useSliderDOM(props, {
			namespace: "color-alpha-slider",
			maxValue: maxValue$1,
			currentValue,
			bar,
			thumb,
			handleDrag,
			getBackground
		});
		const { t } = useLocale();
		const ariaLabel = computed(() => t("el.colorpicker.alphaLabel"));
		const ariaValuetext = computed(() => {
			return t("el.colorpicker.alphaDescription", {
				alpha: currentValue.value,
				color: props.color.value
			});
		});
		function getBackground() {
			if (props.color && props.color.value) {
				const { r, g, b } = props.color.toRgb();
				return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0) 0%, rgba(${r}, ${g}, ${b}, 1) 100%)`;
			}
			return "";
		}
		__expose({
			/**
			* @description update alpha slider manually
			* @type {Function}
			*/
			update,
			/**
			* @description bar element ref
			* @type {HTMLElement}
			*/
			bar,
			/**
			* @description thumb element ref
			* @type {HTMLElement}
			*/
			thumb
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(unref(rootKls)) }, [createBaseVNode("div", {
				ref_key: "bar",
				ref: bar,
				class: normalizeClass(unref(barKls)),
				style: normalizeStyle(unref(barStyle)),
				onClick: _cache[0] || (_cache[0] = (...args) => unref(handleClick) && unref(handleClick)(...args))
			}, null, 6), createBaseVNode("div", {
				ref_key: "thumb",
				ref: thumb,
				class: normalizeClass(unref(thumbKls)),
				style: normalizeStyle(unref(thumbStyle)),
				"aria-label": ariaLabel.value,
				"aria-valuenow": unref(currentValue),
				"aria-valuetext": ariaValuetext.value,
				"aria-orientation": __props.vertical ? "vertical" : "horizontal",
				"aria-valuemin": minValue$1,
				"aria-valuemax": maxValue$1,
				role: "slider",
				tabindex: __props.disabled ? void 0 : 0,
				"aria-disabled": __props.disabled,
				onKeydown: _cache[1] || (_cache[1] = (...args) => unref(handleKeydown) && unref(handleKeydown)(...args))
			}, null, 46, _hoisted_1$7)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/hue-slider.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$6 = [
	"aria-label",
	"aria-valuenow",
	"aria-valuetext",
	"aria-orientation",
	"tabindex",
	"aria-disabled"
];
var minValue = 0;
var maxValue = 360;
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/hue-slider.mjs
var hue_slider_default = /* @__PURE__ */ defineComponent({
	name: "ElColorHueSlider",
	__name: "hue-slider",
	props: hueSliderProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const { currentValue, bar, thumb, handleDrag, handleClick, handleKeydown } = useSlider(props, {
			key: "hue",
			minValue,
			maxValue
		});
		const { rootKls, barKls, thumbKls, thumbStyle, thumbTop, update } = useSliderDOM(props, {
			namespace: "color-hue-slider",
			maxValue,
			currentValue,
			bar,
			thumb,
			handleDrag
		});
		const { t } = useLocale();
		const ariaLabel = computed(() => t("el.colorpicker.hueLabel"));
		const ariaValuetext = computed(() => {
			return t("el.colorpicker.hueDescription", {
				hue: currentValue.value,
				color: props.color.value
			});
		});
		__expose({
			/**
			* @description bar element ref
			*/
			bar,
			/**
			* @description thumb element ref
			*/
			thumb,
			/**
			* @description thumb top position, only for vertical slider
			*/
			thumbTop,
			/**
			* @description update hue slider manually
			*/
			update
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(unref(rootKls)) }, [createBaseVNode("div", {
				ref_key: "bar",
				ref: bar,
				class: normalizeClass(unref(barKls)),
				onClick: _cache[0] || (_cache[0] = (...args) => unref(handleClick) && unref(handleClick)(...args))
			}, null, 2), createBaseVNode("div", {
				ref_key: "thumb",
				ref: thumb,
				class: normalizeClass(unref(thumbKls)),
				style: normalizeStyle(unref(thumbStyle)),
				"aria-label": ariaLabel.value,
				"aria-valuenow": unref(currentValue),
				"aria-valuetext": ariaValuetext.value,
				"aria-orientation": __props.vertical ? "vertical" : "horizontal",
				"aria-valuemin": minValue,
				"aria-valuemax": maxValue,
				role: "slider",
				tabindex: __props.disabled ? void 0 : 0,
				"aria-disabled": __props.disabled,
				onKeydown: _cache[1] || (_cache[1] = (...args) => unref(handleKeydown) && unref(handleKeydown)(...args))
			}, null, 46, _hoisted_1$6)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/props/predefine.mjs
/**
* @deprecated Removed after 3.0.0, Use `PredefineProps` instead.
*/
var predefineProps = buildProps({
	colors: {
		type: definePropType(Array),
		required: true
	},
	color: {
		type: definePropType(Object),
		required: true
	},
	enableAlpha: {
		type: Boolean,
		required: true
	},
	disabled: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/utils/color.mjs
var Color = class {
	constructor(options = {}) {
		this._hue = 0;
		this._saturation = 100;
		this._value = 100;
		this._alpha = 100;
		this._tiny = new TinyColor();
		this._isValid = false;
		this.enableAlpha = false;
		this.format = "";
		this.value = "";
		for (const option in options) if (hasOwn(options, option)) this[option] = options[option];
		if (options.value) this.fromString(options.value);
		else this.doOnChange();
	}
	set(prop, value) {
		if (arguments.length === 1 && typeof prop === "object") {
			for (const p in prop) if (hasOwn(prop, p)) this.set(p, prop[p]);
			return;
		}
		this[`_${prop}`] = value;
		this._isValid = true;
		this.doOnChange();
	}
	get(prop) {
		if ([
			"hue",
			"saturation",
			"value",
			"alpha"
		].includes(prop)) return Math.round(this[`_${prop}`]);
		return this[`_${prop}`];
	}
	toRgb() {
		return this._isValid ? this._tiny.toRgb() : {
			r: 255,
			g: 255,
			b: 255,
			a: 0
		};
	}
	fromString(value) {
		const color = new TinyColor(value);
		this._isValid = color.isValid;
		if (color.isValid) {
			const { h, s, v, a } = color.toHsv();
			this._hue = h;
			this._saturation = s * 100;
			this._value = v * 100;
			this._alpha = a * 100;
		} else {
			this._hue = 0;
			this._saturation = 100;
			this._value = 100;
			this._alpha = 100;
		}
		this.doOnChange();
	}
	clear() {
		this._isValid = false;
		this.value = "";
		this._hue = 0;
		this._saturation = 100;
		this._value = 100;
		this._alpha = 100;
	}
	compare(color) {
		const compareColor = new TinyColor({
			h: color._hue,
			s: color._saturation / 100,
			v: color._value / 100,
			a: color._alpha / 100
		});
		return this._tiny.equals(compareColor);
	}
	doOnChange() {
		const { _hue, _saturation, _value, _alpha, format, enableAlpha } = this;
		let _format = format || (enableAlpha ? "rgb" : "hex");
		if (format === "hex" && enableAlpha) _format = "hex8";
		this._tiny = new TinyColor({
			h: _hue,
			s: _saturation / 100,
			v: _value / 100,
			a: _alpha / 100
		});
		this.value = this._isValid ? this._tiny.toString(_format) : "";
	}
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/composables/use-predefine.mjs
var usePredefine = (props) => {
	const { currentColor } = inject(colorPickerPanelContextKey);
	const rgbaColors = ref(parseColors(props.colors, props.color));
	watch(() => currentColor.value, (val) => {
		const color = new Color({
			value: val,
			enableAlpha: props.enableAlpha
		});
		rgbaColors.value.forEach((item) => {
			item.selected = color.compare(item);
		});
	});
	watchEffect(() => {
		rgbaColors.value = parseColors(props.colors, props.color);
	});
	function handleSelect(index) {
		props.color.fromString(props.colors[index]);
	}
	function parseColors(colors, color) {
		return colors.map((value) => {
			const c = new Color({
				value,
				enableAlpha: props.enableAlpha
			});
			c.selected = c.compare(color);
			return c;
		});
	}
	return {
		rgbaColors,
		handleSelect
	};
};
var usePredefineDOM = (props) => {
	const ns = useNamespace("color-predefine");
	const rootKls = computed(() => [ns.b(), ns.is("disabled", props.disabled)]);
	const colorsKls = computed(() => ns.e("colors"));
	function colorSelectorKls(item) {
		return [
			ns.e("color-selector"),
			ns.is("alpha", item.get("alpha") < 100),
			{ selected: item.selected }
		];
	}
	return {
		rootKls,
		colorsKls,
		colorSelectorKls
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/predefine.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$5 = [
	"disabled",
	"aria-label",
	"onClick"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/predefine.mjs
var predefine_default = /* @__PURE__ */ defineComponent({
	name: "ElColorPredefine",
	__name: "predefine",
	props: predefineProps,
	setup(__props) {
		const props = __props;
		const { rgbaColors, handleSelect } = usePredefine(props);
		const { rootKls, colorsKls, colorSelectorKls } = usePredefineDOM(props);
		const { t } = useLocale();
		const ariaLabel = (value) => {
			return t("el.colorpicker.predefineDescription", { value });
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(unref(rootKls)) }, [createBaseVNode("div", { class: normalizeClass(unref(colorsKls)) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(rgbaColors), (item, index) => {
				return openBlock(), createElementBlock("button", {
					key: __props.colors[index],
					type: "button",
					disabled: __props.disabled,
					"aria-label": ariaLabel(item.value),
					class: normalizeClass(unref(colorSelectorKls)(item)),
					onClick: ($event) => unref(handleSelect)(index)
				}, [createBaseVNode("div", { style: normalizeStyle({ backgroundColor: item.value }) }, null, 4)], 10, _hoisted_1$5);
			}), 128))], 2)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/props/sv-panel.mjs
/**
* @deprecated Removed after 3.0.0, Use `SvPanelProps` instead.
*/
var svPanelProps = buildProps({
	color: {
		type: definePropType(Object),
		required: true
	},
	disabled: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/composables/use-sv-panel.mjs
var useSvPanel = (props) => {
	const instance = getCurrentInstance();
	const cursorRef = ref();
	const cursorTop = ref(0);
	const cursorLeft = ref(0);
	const background = ref("hsl(0, 100%, 50%)");
	const saturation = computed(() => props.color.get("saturation"));
	const brightness = computed(() => props.color.get("value"));
	const hue = computed(() => props.color.get("hue"));
	function handleClick(event) {
		if (props.disabled) return;
		if (event.target !== cursorRef.value) handleDrag(event);
		cursorRef.value?.focus({ preventScroll: true });
	}
	function handleDrag(event) {
		if (props.disabled) return;
		const rect = instance.vnode.el.getBoundingClientRect();
		const { clientX, clientY } = getClientXY(event);
		let left = clientX - rect.left;
		let top = clientY - rect.top;
		left = Math.max(0, left);
		left = Math.min(left, rect.width);
		top = Math.max(0, top);
		top = Math.min(top, rect.height);
		cursorLeft.value = left;
		cursorTop.value = top;
		props.color.set({
			saturation: left / rect.width * 100,
			value: 100 - top / rect.height * 100
		});
	}
	function handleKeydown(event) {
		if (props.disabled) return;
		const { shiftKey } = event;
		const code = getEventCode(event);
		const step = shiftKey ? 10 : 1;
		let isPreventDefault = true;
		switch (code) {
			case EVENT_CODE.left:
				incrementSaturation(-step);
				break;
			case EVENT_CODE.right:
				incrementSaturation(step);
				break;
			case EVENT_CODE.up:
				incrementBrightness(step);
				break;
			case EVENT_CODE.down:
				incrementBrightness(-step);
				break;
			default: isPreventDefault = false;
		}
		isPreventDefault && event.preventDefault();
	}
	function incrementSaturation(step) {
		let next = saturation.value + step;
		next = next < 0 ? 0 : next > 100 ? 100 : next;
		props.color.set("saturation", next);
	}
	function incrementBrightness(step) {
		let next = brightness.value + step;
		next = next < 0 ? 0 : next > 100 ? 100 : next;
		props.color.set("value", next);
	}
	return {
		cursorRef,
		cursorTop,
		cursorLeft,
		background,
		saturation,
		brightness,
		hue,
		handleClick,
		handleDrag,
		handleKeydown
	};
};
var useSvPanelDOM = (props, { cursorTop, cursorLeft, background, handleDrag }) => {
	const instance = getCurrentInstance();
	const ns = useNamespace("color-svpanel");
	function update() {
		const saturation = props.color.get("saturation");
		const brightness = props.color.get("value");
		const { clientWidth: width, clientHeight: height } = instance.vnode.el;
		cursorLeft.value = saturation * width / 100;
		cursorTop.value = (100 - brightness) * height / 100;
		background.value = `hsl(${props.color.get("hue")}, 100%, 50%)`;
	}
	onMounted(() => {
		draggable(instance.vnode.el, {
			drag: (event) => {
				handleDrag(event);
			},
			end: (event) => {
				handleDrag(event);
			}
		});
		update();
	});
	watch([
		() => props.color.get("hue"),
		() => props.color.get("value"),
		() => props.color.value
	], () => update());
	return {
		rootKls: computed(() => ns.b()),
		cursorKls: computed(() => ns.e("cursor")),
		rootStyle: computed(() => ({ backgroundColor: background.value })),
		cursorStyle: computed(() => ({
			top: addUnit(cursorTop.value),
			left: addUnit(cursorLeft.value)
		})),
		update
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/sv-panel.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$4 = [
	"tabindex",
	"aria-disabled",
	"aria-label",
	"aria-valuenow",
	"aria-valuetext"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/components/sv-panel.mjs
var sv_panel_default = /* @__PURE__ */ defineComponent({
	name: "ElSvPanel",
	__name: "sv-panel",
	props: svPanelProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const { cursorRef, cursorTop, cursorLeft, background, saturation, brightness, handleClick, handleDrag, handleKeydown } = useSvPanel(props);
		const { rootKls, cursorKls, rootStyle, cursorStyle, update } = useSvPanelDOM(props, {
			cursorTop,
			cursorLeft,
			background,
			handleDrag
		});
		const { t } = useLocale();
		const ariaLabel = computed(() => t("el.colorpicker.svLabel"));
		const ariaValuetext = computed(() => {
			return t("el.colorpicker.svDescription", {
				saturation: saturation.value,
				brightness: brightness.value,
				color: props.color.value
			});
		});
		__expose({ 
		/**
		* @description update sv panel manually
		*/
update });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(unref(rootKls)),
				style: normalizeStyle(unref(rootStyle)),
				onClick: _cache[1] || (_cache[1] = (...args) => unref(handleClick) && unref(handleClick)(...args))
			}, [createBaseVNode("div", {
				ref_key: "cursorRef",
				ref: cursorRef,
				class: normalizeClass(unref(cursorKls)),
				style: normalizeStyle(unref(cursorStyle)),
				tabindex: __props.disabled ? void 0 : 0,
				"aria-disabled": __props.disabled,
				role: "slider",
				"aria-valuemin": "0,0",
				"aria-valuemax": "100,100",
				"aria-label": ariaLabel.value,
				"aria-valuenow": `${unref(saturation)},${unref(brightness)}`,
				"aria-valuetext": ariaValuetext.value,
				onKeydown: _cache[0] || (_cache[0] = (...args) => unref(handleKeydown) && unref(handleKeydown)(...args))
			}, null, 46, _hoisted_1$4)], 6);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/src/composables/use-common-color.mjs
var useCommonColor = (props, emit) => {
	const color = reactive(new Color({
		enableAlpha: props.showAlpha,
		format: props.colorFormat || "",
		value: props.modelValue
	}));
	watch(() => [props.colorFormat, props.showAlpha], () => {
		color.enableAlpha = props.showAlpha;
		color.format = props.colorFormat || color.format;
		color.doOnChange();
		emit(UPDATE_MODEL_EVENT, color.value);
	});
	return { color };
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker-panel/index.mjs
var ElColorPickerPanel = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElColorPickerPanel",
	__name: "color-picker-panel",
	props: colorPickerPanelProps,
	emits: colorPickerPanelEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("color-picker-panel");
		const { formItem } = useFormItem();
		const disabled = useFormDisabled();
		const hueRef = ref();
		const svRef = ref();
		const alphaRef = ref();
		const inputRef = ref();
		const customInput = ref("");
		const { color } = inject(ROOT_COMMON_COLOR_INJECTION_KEY, () => useCommonColor(props, emit), true);
		function handleConfirm() {
			color.fromString(customInput.value);
			if (color.value !== customInput.value) customInput.value = color.value;
		}
		function handleFocusout() {
			if (props.validateEvent) formItem?.validate?.("blur").catch(NOOP);
		}
		function update() {
			hueRef.value?.update();
			svRef.value?.update();
			alphaRef.value?.update();
		}
		onMounted(() => {
			if (props.modelValue) customInput.value = color.value;
			nextTick(update);
		});
		watch(() => props.modelValue, (newVal) => {
			if (newVal !== color.value) newVal ? color.fromString(newVal) : color.clear();
		});
		watch(() => color.value, (val) => {
			emit(UPDATE_MODEL_EVENT, val);
			customInput.value = val;
			if (props.validateEvent) formItem?.validate("change").catch(NOOP);
		});
		provide(colorPickerPanelContextKey, { currentColor: computed(() => color.value) });
		__expose({
			/**
			* @description current color object
			*/
			color,
			/**
			* @description custom input ref
			*/
			inputRef,
			/**
			* @description update sub components
			*/
			update
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([
					unref(ns).b(),
					unref(ns).is("disabled", unref(disabled)),
					unref(ns).is("border", __props.border)
				]),
				onFocusout: handleFocusout
			}, [
				createBaseVNode("div", { class: normalizeClass(unref(ns).e("wrapper")) }, [createVNode(hue_slider_default, {
					ref_key: "hueRef",
					ref: hueRef,
					color: unref(color),
					vertical: "",
					disabled: unref(disabled),
					class: normalizeClass(["hue-slider", __props.hueSliderClass]),
					style: normalizeStyle(__props.hueSliderStyle)
				}, null, 8, [
					"color",
					"disabled",
					"class",
					"style"
				]), createVNode(sv_panel_default, {
					ref_key: "svRef",
					ref: svRef,
					color: unref(color),
					disabled: unref(disabled)
				}, null, 8, ["color", "disabled"])], 2),
				__props.showAlpha ? (openBlock(), createBlock(alpha_slider_default, {
					key: 0,
					ref_key: "alphaRef",
					ref: alphaRef,
					color: unref(color),
					disabled: unref(disabled)
				}, null, 8, ["color", "disabled"])) : createCommentVNode("v-if", true),
				__props.predefine ? (openBlock(), createBlock(predefine_default, {
					key: 1,
					ref: "predefine",
					"enable-alpha": __props.showAlpha,
					color: unref(color),
					colors: __props.predefine,
					disabled: unref(disabled)
				}, null, 8, [
					"enable-alpha",
					"color",
					"colors",
					"disabled"
				])) : createCommentVNode("v-if", true),
				createBaseVNode("div", { class: normalizeClass(unref(ns).e("footer")) }, [createVNode(unref(ElInput), {
					ref_key: "inputRef",
					ref: inputRef,
					modelValue: customInput.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => customInput.value = $event),
					"validate-event": false,
					size: "small",
					disabled: unref(disabled),
					onChange: handleConfirm
				}, null, 8, ["modelValue", "disabled"]), renderSlot(_ctx.$slots, "footer")], 2)
			], 34);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker/src/color-picker.mjs
/**
* @deprecated Removed after 3.0.0, Use `ColorPickerProps` instead.
*/
var colorPickerProps = buildProps({
	/**
	* @description when color-picker inactive and persistent is false, the color panel will be destroyed
	*/
	persistent: {
		type: Boolean,
		default: true
	},
	/**
	* @description binding value
	*/
	modelValue: {
		type: definePropType(String),
		default: void 0
	},
	/**
	* @description ColorPicker id
	*/
	id: String,
	/**
	* @description whether to display the alpha slider
	*/
	showAlpha: Boolean,
	/**
	* @description color format of v-model
	*/
	colorFormat: { type: definePropType(String) },
	/**
	* @description whether to disable the ColorPicker
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether to show clear button
	*/
	clearable: {
		type: Boolean,
		default: true
	},
	/**
	* @description size of ColorPicker
	*/
	size: useSizeProp,
	/**
	* @description custom class name for ColorPicker's dropdown
	*/
	popperClass: useTooltipContentProps.popperClass,
	/**
	* @description custom style for ColorPicker's dropdown
	*/
	popperStyle: useTooltipContentProps.popperStyle,
	/**
	* @description ColorPicker tabindex
	*/
	tabindex: {
		type: [String, Number],
		default: 0
	},
	/**
	* @description whether color-picker popper is teleported to the body
	*/
	teleported: useTooltipContentProps.teleported,
	/**
	* @description which color-picker panel appends to
	*/
	appendTo: useTooltipContentProps.appendTo,
	/**
	* @description predefined color options
	*/
	predefine: { type: definePropType(Array) },
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	...useEmptyValuesProps,
	...useAriaProps(["ariaLabel"])
});
var colorPickerEmits = {
	[UPDATE_MODEL_EVENT]: (val) => isString(val) || isNil(val),
	[CHANGE_EVENT]: (val) => isString(val) || isNil(val),
	activeChange: (val) => isString(val) || isNil(val),
	focus: (evt) => evt instanceof FocusEvent,
	blur: (evt) => evt instanceof FocusEvent,
	clear: () => true
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker/src/color-picker.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$3 = [
	"id",
	"aria-label",
	"aria-labelledby",
	"aria-description",
	"aria-disabled",
	"tabindex"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/color-picker/index.mjs
var ElColorPicker = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElColorPicker",
	__name: "color-picker",
	props: colorPickerProps,
	emits: colorPickerEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { t } = useLocale();
		const ns = useNamespace("color");
		const { formItem } = useFormItem();
		const colorSize = useFormSize();
		const colorDisabled = useFormDisabled();
		const { valueOnClear, isEmptyValue } = useEmptyValues(props, null);
		const commonColor = useCommonColor(props, emit);
		const { inputId: buttonId, isLabeledByFormItem } = useFormItemInputId(props, { formItemContext: formItem });
		const popper = ref();
		const triggerRef = ref();
		const pickerPanelRef = ref();
		const showPicker = ref(false);
		const showPanelColor = ref(false);
		let shouldActiveChange = true;
		const { isFocused, handleFocus, handleBlur } = useFocusController(triggerRef, {
			disabled: colorDisabled,
			beforeBlur(event) {
				return popper.value?.isFocusInsideContent(event);
			},
			afterBlur() {
				setShowPicker(false);
				resetColor();
				if (props.validateEvent) formItem?.validate?.("blur").catch(NOOP);
			}
		});
		const color = reactiveComputed(() => pickerPanelRef.value?.color ?? commonColor.color);
		const panelProps = computed(() => pick(props, Object.keys(colorPickerPanelProps)));
		const displayedColor = computed(() => {
			if (!props.modelValue && !showPanelColor.value) return "transparent";
			return displayedRgb(color, props.showAlpha);
		});
		const currentColor = computed(() => {
			return !props.modelValue && !showPanelColor.value ? "" : color.value;
		});
		const buttonAriaLabel = computed(() => {
			return !isLabeledByFormItem.value ? props.ariaLabel || t("el.colorpicker.defaultLabel") : void 0;
		});
		const buttonAriaLabelledby = computed(() => {
			return isLabeledByFormItem.value ? formItem?.labelId : void 0;
		});
		const btnKls = computed(() => {
			return [
				ns.b("picker"),
				ns.is("disabled", colorDisabled.value),
				ns.bm("picker", colorSize.value),
				ns.is("focused", isFocused.value)
			];
		});
		function displayedRgb(color, showAlpha) {
			const { r, g, b, a } = color.toRgb();
			return showAlpha ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
		}
		function setShowPicker(value) {
			showPicker.value = value;
		}
		const debounceSetShowPicker = debounce(setShowPicker, 100, { leading: true });
		function show() {
			if (colorDisabled.value) return;
			setShowPicker(true);
		}
		function hide() {
			debounceSetShowPicker(false);
			resetColor();
		}
		function resetColor() {
			nextTick(() => {
				if (props.modelValue) color.fromString(props.modelValue);
				else {
					color.value = "";
					nextTick(() => {
						showPanelColor.value = false;
					});
				}
			});
		}
		function handleTrigger() {
			if (colorDisabled.value) return;
			if (showPicker.value) resetColor();
			debounceSetShowPicker(!showPicker.value);
		}
		function confirmValue() {
			const value = isEmptyValue(color.value) ? valueOnClear.value : color.value;
			emit(UPDATE_MODEL_EVENT, value);
			emit(CHANGE_EVENT, value);
			if (props.validateEvent) formItem?.validate("change").catch(NOOP);
			debounceSetShowPicker(false);
			nextTick(() => {
				const newColor = new Color({
					enableAlpha: props.showAlpha,
					format: props.colorFormat || "",
					value: props.modelValue
				});
				if (!color.compare(newColor)) resetColor();
			});
		}
		function clear() {
			debounceSetShowPicker(false);
			emit(UPDATE_MODEL_EVENT, valueOnClear.value);
			emit(CHANGE_EVENT, valueOnClear.value);
			if (props.modelValue !== valueOnClear.value && props.validateEvent) formItem?.validate("change").catch(NOOP);
			resetColor();
			emit("clear");
		}
		function handleShowTooltip() {
			pickerPanelRef?.value?.inputRef?.focus();
		}
		function handleClickOutside() {
			if (!showPicker.value) return;
			hide();
			isFocused.value && focus();
		}
		function handleEsc(event) {
			event.preventDefault();
			event.stopPropagation();
			setShowPicker(false);
			resetColor();
		}
		function handleKeyDown(event) {
			switch (getEventCode(event)) {
				case EVENT_CODE.enter:
				case EVENT_CODE.numpadEnter:
				case EVENT_CODE.space:
					event.preventDefault();
					event.stopPropagation();
					show();
					break;
				case EVENT_CODE.esc: handleEsc(event);
			}
		}
		function focus() {
			triggerRef.value.focus();
		}
		function blur() {
			triggerRef.value.blur();
		}
		watch(() => currentColor.value, (val) => {
			shouldActiveChange && emit("activeChange", val);
			shouldActiveChange = true;
		});
		watch(() => color.value, () => {
			if (!props.modelValue && !showPanelColor.value) showPanelColor.value = true;
		});
		watch(() => props.modelValue, (newVal) => {
			if (!newVal) showPanelColor.value = false;
			else if (newVal && newVal !== color.value) {
				shouldActiveChange = false;
				color.fromString(newVal);
			}
		});
		watch(() => showPicker.value, () => {
			pickerPanelRef.value && nextTick(pickerPanelRef.value.update);
		});
		provide(ROOT_COMMON_COLOR_INJECTION_KEY, commonColor);
		__expose({
			/**
			* @description current color object
			*/
			color,
			/**
			* @description manually show ColorPicker
			*/
			show,
			/**
			* @description manually hide ColorPicker
			*/
			hide,
			/**
			* @description focus the input element
			*/
			focus,
			/**
			* @description blur the input element
			*/
			blur
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElTooltip), {
				ref_key: "popper",
				ref: popper,
				visible: showPicker.value,
				"show-arrow": false,
				"fallback-placements": [
					"bottom",
					"top",
					"right",
					"left"
				],
				offset: 0,
				"gpu-acceleration": false,
				"popper-class": [unref(ns).be("picker", "panel"), __props.popperClass],
				"popper-style": __props.popperStyle,
				"stop-popper-mouse-event": false,
				pure: "",
				loop: "",
				role: "dialog",
				effect: "light",
				trigger: "click",
				teleported: __props.teleported,
				transition: `${unref(ns).namespace.value}-zoom-in-top`,
				persistent: __props.persistent,
				"append-to": __props.appendTo,
				onShow: handleShowTooltip,
				onHide: _cache[2] || (_cache[2] = ($event) => setShowPicker(false))
			}, {
				content: withCtx(() => [withDirectives((openBlock(), createBlock(unref(ElColorPickerPanel), mergeProps({
					ref_key: "pickerPanelRef",
					ref: pickerPanelRef
				}, panelProps.value, {
					border: false,
					"validate-event": false,
					onKeydown: withKeys(handleEsc, ["esc"])
				}), {
					footer: withCtx(() => [createBaseVNode("div", null, [__props.clearable ? (openBlock(), createBlock(unref(ElButton), {
						key: 0,
						class: normalizeClass(unref(ns).be("footer", "link-btn")),
						text: "",
						size: "small",
						onClick: clear
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(unref(t)("el.colorpicker.clear")), 1)]),
						_: 1
					}, 8, ["class"])) : createCommentVNode("v-if", true), createVNode(unref(ElButton), {
						plain: "",
						size: "small",
						class: normalizeClass(unref(ns).be("footer", "btn")),
						onClick: confirmValue
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(unref(t)("el.colorpicker.confirm")), 1)]),
						_: 1
					}, 8, ["class"])])]),
					_: 1
				}, 16)), [[
					unref(ClickOutside),
					handleClickOutside,
					triggerRef.value
				]])]),
				default: withCtx(() => [createBaseVNode("div", mergeProps({
					id: unref(buttonId),
					ref_key: "triggerRef",
					ref: triggerRef
				}, _ctx.$attrs, {
					class: btnKls.value,
					role: "button",
					"aria-label": buttonAriaLabel.value,
					"aria-labelledby": buttonAriaLabelledby.value,
					"aria-description": unref(t)("el.colorpicker.description", { color: __props.modelValue || "" }),
					"aria-disabled": unref(colorDisabled),
					tabindex: unref(colorDisabled) ? void 0 : __props.tabindex,
					onKeydown: handleKeyDown,
					onFocus: _cache[0] || (_cache[0] = (...args) => unref(handleFocus) && unref(handleFocus)(...args)),
					onBlur: _cache[1] || (_cache[1] = (...args) => unref(handleBlur) && unref(handleBlur)(...args))
				}), [createBaseVNode("div", {
					class: normalizeClass(unref(ns).be("picker", "trigger")),
					onClick: handleTrigger
				}, [createBaseVNode("span", { class: normalizeClass([unref(ns).be("picker", "color"), unref(ns).is("alpha", __props.showAlpha)]) }, [createBaseVNode("span", {
					class: normalizeClass(unref(ns).be("picker", "color-inner")),
					style: normalizeStyle({ backgroundColor: displayedColor.value })
				}, [withDirectives(createVNode(unref(ElIcon), { class: normalizeClass([unref(ns).be("picker", "icon"), unref(ns).is("icon-arrow-down")]) }, {
					default: withCtx(() => [createVNode(unref(arrow_down_default))]),
					_: 1
				}, 8, ["class"]), [[vShow, __props.modelValue || showPanelColor.value]]), withDirectives(createVNode(unref(ElIcon), { class: normalizeClass([unref(ns).be("picker", "empty"), unref(ns).is("icon-close")]) }, {
					default: withCtx(() => [createVNode(unref(close_default))]),
					_: 1
				}, 8, ["class"]), [[vShow, !__props.modelValue && !showPanelColor.value]])], 6)], 2)], 2)], 16, _hoisted_1$3)]),
				_: 1
			}, 8, [
				"visible",
				"popper-class",
				"popper-style",
				"teleported",
				"transition",
				"persistent",
				"append-to"
			]);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/rate/src/rate.mjs
/**
* @deprecated Removed after 3.0.0, Use `RateProps` instead.
*/
var rateProps = buildProps({
	/**
	* @description binding value
	*/
	modelValue: {
		type: Number,
		default: 0
	},
	/**
	* @description native `id` attribute
	*/
	id: {
		type: String,
		default: void 0
	},
	/**
	* @description threshold value between low and medium level. The value itself will be included in low level
	*/
	lowThreshold: {
		type: Number,
		default: 2
	},
	/**
	* @description threshold value between medium and high level. The value itself will be included in high level
	*/
	highThreshold: {
		type: Number,
		default: 4
	},
	/**
	* @description max rating score
	*/
	max: {
		type: Number,
		default: 5
	},
	/**
	* @description colors for icons. If array, it should have 3 elements, each of which corresponds with a score level, else if object, the key should be threshold value between two levels, and the value should be corresponding color
	*/
	colors: {
		type: definePropType([Array, Object]),
		default: () => mutable([
			"",
			"",
			""
		])
	},
	/**
	* @description color of unselected icons
	*/
	voidColor: {
		type: String,
		default: ""
	},
	/**
	* @description color of unselected read-only icons
	*/
	disabledVoidColor: {
		type: String,
		default: ""
	},
	/**
	* @description icon components. If array, it should have 3 elements, each of which corresponds with a score level, else if object, the key should be threshold value between two levels, and the value should be corresponding icon component
	*/
	icons: {
		type: definePropType([Array, Object]),
		default: () => [
			star_filled_default,
			star_filled_default,
			star_filled_default
		]
	},
	/**
	* @description component of unselected icons
	*/
	voidIcon: {
		type: iconPropType,
		default: () => star_default
	},
	/**
	* @description component of unselected read-only icons
	*/
	disabledVoidIcon: {
		type: iconPropType,
		default: () => star_filled_default
	},
	/**
	* @description whether Rate is read-only
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether picking half start is allowed
	*/
	allowHalf: Boolean,
	/**
	* @description whether to display texts
	*/
	showText: Boolean,
	/**
	* @description whether to display current score. show-score and show-text cannot be true at the same time
	*/
	showScore: Boolean,
	/**
	* @description color of texts
	*/
	textColor: {
		type: String,
		default: ""
	},
	/**
	* @description text array
	*/
	texts: {
		type: definePropType(Array),
		default: () => mutable([
			"Extremely bad",
			"Disappointed",
			"Fair",
			"Satisfied",
			"Surprise"
		])
	},
	/**
	* @description score template
	*/
	scoreTemplate: {
		type: String,
		default: "{value}"
	},
	/**
	* @description size of Rate
	*/
	size: useSizeProp,
	/**
	* @description whether value can be reset to `0`
	*/
	clearable: Boolean,
	...useAriaProps(["ariaLabel"])
});
var rateEmits = {
	[CHANGE_EVENT]: (value) => isNumber(value),
	[UPDATE_MODEL_EVENT]: (value) => isNumber(value)
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/rate/src/rate.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$2 = [
	"id",
	"aria-label",
	"aria-labelledby",
	"aria-valuenow",
	"aria-valuetext",
	"aria-valuemax",
	"tabindex",
	"aria-disabled"
];
var _hoisted_2$1 = ["onMousemove", "onClick"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/rate/index.mjs
var ElRate = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElRate",
	__name: "rate",
	props: rateProps,
	emits: rateEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		function getValueFromMap(value, map) {
			const isExcludedObject = (val) => isObject(val);
			const matchedValue = map[Object.keys(map).map((key) => +key).filter((key) => {
				const val = map[key];
				return (isExcludedObject(val) ? val.excluded : false) ? value < key : value <= key;
			}).sort((a, b) => a - b)[0]];
			return isExcludedObject(matchedValue) && matchedValue.value || matchedValue;
		}
		const props = __props;
		const emit = __emit;
		const formItemContext = inject(formItemContextKey, void 0);
		const rateSize = useFormSize();
		const ns = useNamespace("rate");
		const { inputId, isLabeledByFormItem } = useFormItemInputId(props, { formItemContext });
		const currentValue = ref(clamp(props.modelValue, 0, props.max));
		const hoverIndex = ref(-1);
		const pointerAtLeftHalf = ref(true);
		const iconRefs = ref([]);
		const iconClientWidths = computed(() => iconRefs.value.map((icon) => icon.$el.clientWidth));
		const rateClasses = computed(() => [ns.b(), ns.m(rateSize.value)]);
		const rateDisabled = useFormDisabled();
		const rateStyles = computed(() => {
			return ns.cssVarBlock({
				"void-color": props.voidColor,
				"disabled-void-color": props.disabledVoidColor,
				"fill-color": activeColor.value
			});
		});
		const text = computed(() => {
			let result = "";
			if (props.showScore) result = props.scoreTemplate.replace(/\{\s*value\s*\}/, rateDisabled.value ? `${props.modelValue}` : `${currentValue.value}`);
			else if (props.showText) result = props.texts[Math.ceil(currentValue.value) - 1];
			return result;
		});
		const valueDecimal = computed(() => props.modelValue * 100 - Math.floor(props.modelValue) * 100);
		const colorMap = computed(() => isArray(props.colors) ? {
			[props.lowThreshold]: props.colors[0],
			[props.highThreshold]: {
				value: props.colors[1],
				excluded: true
			},
			[props.max]: props.colors[2]
		} : props.colors);
		const activeColor = computed(() => {
			const color = getValueFromMap(currentValue.value, colorMap.value);
			return isObject(color) ? "" : color;
		});
		const decimalStyle = computed(() => {
			let width = "";
			if (rateDisabled.value) width = `${valueDecimal.value}%`;
			else if (props.allowHalf) width = "50%";
			return {
				color: activeColor.value,
				width
			};
		});
		const componentMap = computed(() => {
			let icons = isArray(props.icons) ? [...props.icons] : { ...props.icons };
			icons = markRaw(icons);
			return isArray(icons) ? {
				[props.lowThreshold]: icons[0],
				[props.highThreshold]: {
					value: icons[1],
					excluded: true
				},
				[props.max]: icons[2]
			} : icons;
		});
		const decimalIconComponent = computed(() => getValueFromMap(props.modelValue, componentMap.value));
		const voidComponent = computed(() => rateDisabled.value ? isString(props.disabledVoidIcon) ? props.disabledVoidIcon : markRaw(props.disabledVoidIcon) : isString(props.voidIcon) ? props.voidIcon : markRaw(props.voidIcon));
		const activeComponent = computed(() => getValueFromMap(currentValue.value, componentMap.value));
		function showDecimalIcon(item) {
			const showWhenDisabled = rateDisabled.value && valueDecimal.value > 0 && item - 1 < props.modelValue && item > props.modelValue;
			const showWhenAllowHalf = props.allowHalf && pointerAtLeftHalf.value && item - .5 <= currentValue.value && item > currentValue.value;
			return showWhenDisabled || showWhenAllowHalf;
		}
		function emitValue(value) {
			if (props.clearable && value === props.modelValue) value = 0;
			emit(UPDATE_MODEL_EVENT, value);
			if (props.modelValue !== value) emit(CHANGE_EVENT, value);
		}
		function selectValue(value) {
			if (rateDisabled.value) return;
			if (props.allowHalf && pointerAtLeftHalf.value) emitValue(currentValue.value);
			else emitValue(value);
		}
		function handleKey(e) {
			if (rateDisabled.value) return;
			const code = getEventCode(e);
			const step = props.allowHalf ? .5 : 1;
			let _currentValue = currentValue.value;
			switch (code) {
				case EVENT_CODE.up:
				case EVENT_CODE.right:
					_currentValue += step;
					break;
				case EVENT_CODE.left:
				case EVENT_CODE.down: _currentValue -= step;
			}
			_currentValue = clamp(_currentValue, 0, props.max);
			if (_currentValue === currentValue.value) return;
			e.stopPropagation();
			e.preventDefault();
			emit(UPDATE_MODEL_EVENT, _currentValue);
			emit(CHANGE_EVENT, _currentValue);
			return _currentValue;
		}
		function setCurrentValue(value, event) {
			if (rateDisabled.value) return;
			if (props.allowHalf && event) {
				pointerAtLeftHalf.value = event.offsetX * 2 <= iconClientWidths.value[value - 1];
				currentValue.value = pointerAtLeftHalf.value ? value - .5 : value;
			} else currentValue.value = value;
			hoverIndex.value = value;
		}
		function resetCurrentValue() {
			if (rateDisabled.value) return;
			if (props.allowHalf) pointerAtLeftHalf.value = props.modelValue !== Math.floor(props.modelValue);
			currentValue.value = clamp(props.modelValue, 0, props.max);
			hoverIndex.value = -1;
		}
		watch(() => props.modelValue, (val) => {
			currentValue.value = clamp(val, 0, props.max);
			pointerAtLeftHalf.value = props.modelValue !== Math.floor(props.modelValue);
		});
		if (!props.modelValue) emit(UPDATE_MODEL_EVENT, 0);
		__expose({
			/** @description set current value */
			setCurrentValue,
			/** @description reset current value */
			resetCurrentValue
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				id: unref(inputId),
				class: normalizeClass([rateClasses.value, unref(ns).is("disabled", unref(rateDisabled))]),
				role: "slider",
				"aria-label": !unref(isLabeledByFormItem) ? __props.ariaLabel || "rating" : void 0,
				"aria-labelledby": unref(isLabeledByFormItem) ? unref(formItemContext)?.labelId : void 0,
				"aria-valuenow": currentValue.value,
				"aria-valuetext": text.value || void 0,
				"aria-valuemin": "0",
				"aria-valuemax": __props.max,
				style: normalizeStyle(rateStyles.value),
				tabindex: unref(rateDisabled) ? void 0 : 0,
				"aria-disabled": unref(rateDisabled),
				onKeydown: handleKey
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.max, (item, key) => {
				return openBlock(), createElementBlock("span", {
					key,
					class: normalizeClass(unref(ns).e("item")),
					onMousemove: ($event) => setCurrentValue(item, $event),
					onMouseleave: resetCurrentValue,
					onClick: ($event) => selectValue(item)
				}, [createVNode(unref(ElIcon), {
					ref_for: true,
					ref_key: "iconRefs",
					ref: iconRefs,
					class: normalizeClass([
						unref(ns).e("icon"),
						{ hover: hoverIndex.value === item },
						unref(ns).is("active", item <= currentValue.value),
						unref(ns).is("focus-visible", item === Math.ceil(currentValue.value || 1))
					])
				}, {
					default: withCtx(() => [
						withDirectives((openBlock(), createBlock(resolveDynamicComponent(activeComponent.value), null, null, 512)), [[vShow, !showDecimalIcon(item) && item <= currentValue.value]]),
						withDirectives((openBlock(), createBlock(resolveDynamicComponent(voidComponent.value), null, null, 512)), [[vShow, !showDecimalIcon(item) && item > currentValue.value]]),
						withDirectives((openBlock(), createBlock(resolveDynamicComponent(voidComponent.value), { class: normalizeClass([unref(ns).em("decimal", "box")]) }, null, 8, ["class"])), [[vShow, showDecimalIcon(item)]]),
						withDirectives(createVNode(unref(ElIcon), {
							style: normalizeStyle(decimalStyle.value),
							class: normalizeClass([unref(ns).e("icon"), unref(ns).e("decimal")])
						}, {
							default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(decimalIconComponent.value)))]),
							_: 1
						}, 8, ["style", "class"]), [[vShow, showDecimalIcon(item)]])
					]),
					_: 2
				}, 1032, ["class"])], 42, _hoisted_2$1);
			}), 128)), __props.showText || __props.showScore ? (openBlock(), createElementBlock("span", {
				key: 0,
				class: normalizeClass(unref(ns).e("text")),
				style: normalizeStyle({ color: __props.textColor })
			}, toDisplayString(text.value), 7)) : createCommentVNode("v-if", true)], 46, _hoisted_1$2);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/constants.mjs
var sliderContextKey = Symbol("sliderContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/slider.mjs
var sliderProps = buildProps({
	/**
	* @description binding value
	*/
	modelValue: {
		type: definePropType([Number, Array]),
		default: 0
	},
	id: {
		type: String,
		default: void 0
	},
	/**
	* @description minimum value
	*/
	min: {
		type: Number,
		default: 0
	},
	/**
	* @description maximum value
	*/
	max: {
		type: Number,
		default: 100
	},
	/**
	* @description step size, can be a number or `'mark'` to restrict values to marks. When set to `'mark'`, the `marks` attribute must be set
	*/
	step: {
		type: definePropType([Number, String]),
		default: 1
	},
	/**
	* @description whether to display an input box, works when `range` is false and `step` is not `'mark'`
	*/
	showInput: Boolean,
	/**
	* @description whether to display control buttons when `show-input` is true
	*/
	showInputControls: {
		type: Boolean,
		default: true
	},
	/**
	* @description size of the slider wrapper, will not work in vertical mode
	*/
	size: useSizeProp,
	/**
	* @description size of the input box, when set `size`, the default is the value of `size`
	*/
	inputSize: useSizeProp,
	/**
	* @description whether to display breakpoints
	*/
	showStops: Boolean,
	/**
	* @description whether to display tooltip value
	*/
	showTooltip: {
		type: Boolean,
		default: true
	},
	/**
	* @description format to display tooltip value
	*/
	formatTooltip: {
		type: definePropType(Function),
		default: void 0
	},
	/**
	* @description whether Slider is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether to select a range
	*/
	range: Boolean,
	/**
	* @description vertical mode
	*/
	vertical: Boolean,
	/**
	* @description slider height, required in vertical mode
	*/
	height: String,
	/**
	* @description when `range` is true, screen reader label for the start of the range
	*/
	rangeStartLabel: {
		type: String,
		default: void 0
	},
	/**
	* @description when `range` is true, screen reader label for the end of the range
	*/
	rangeEndLabel: {
		type: String,
		default: void 0
	},
	/**
	* @description format to display the `aria-valuenow` attribute for screen readers
	*/
	formatValueText: {
		type: definePropType(Function),
		default: void 0
	},
	/**
	* @description custom class name for the tooltip
	*/
	tooltipClass: {
		type: String,
		default: void 0
	},
	/**
	* @description position of Tooltip
	*/
	placement: {
		type: String,
		values: Ee,
		default: "top"
	},
	/**
	* @description marks, type of key must be `number` and must in closed interval `[min, max]`, each mark can custom style
	*/
	marks: { type: definePropType(Object) },
	/**
	* @description whether to trigger form validation
	*/
	validateEvent: {
		type: Boolean,
		default: true
	},
	/**
	* @description when slider tooltip inactive and `persistent` is `false` , popconfirm will be destroyed. `persistent` always be `false` when `show-tooltip ` is `false`
	*/
	persistent: {
		type: Boolean,
		default: true
	},
	...useAriaProps(["ariaLabel"])
});
var isValidValue = (value) => isNumber(value) || isArray(value) && value.every(isNumber);
var sliderEmits = {
	[UPDATE_MODEL_EVENT]: isValidValue,
	[INPUT_EVENT]: isValidValue,
	[CHANGE_EVENT]: isValidValue
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/composables/use-lifecycle.mjs
var useLifecycle = (props, initData, resetSize) => {
	const sliderWrapper = ref();
	onMounted(async () => {
		if (props.range) {
			if (isArray(props.modelValue)) {
				initData.firstValue = Math.max(props.min, props.modelValue[0]);
				initData.secondValue = Math.min(props.max, props.modelValue[1]);
			} else {
				initData.firstValue = props.min;
				initData.secondValue = props.max;
			}
			initData.oldValue = [initData.firstValue, initData.secondValue];
		} else {
			if (!isNumber(props.modelValue) || Number.isNaN(props.modelValue)) initData.firstValue = props.min;
			else initData.firstValue = Math.min(props.max, Math.max(props.min, props.modelValue));
			initData.oldValue = initData.firstValue;
		}
		useEventListener(window, "resize", resetSize);
		await nextTick();
		resetSize();
	});
	return { sliderWrapper };
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/composables/use-marks.mjs
var useMarks = (props) => {
	const markList = computed(() => {
		if (!props.marks) return [];
		return Object.keys(props.marks).map(Number.parseFloat).sort((a, b) => a - b).filter((point) => point <= props.max && point >= props.min).map((point) => ({
			point,
			position: (point - props.min) * 100 / (props.max - props.min),
			mark: props.marks[point]
		}));
	});
	watchEffect(() => {
		if (props.step === "mark" && !props.marks) debugWarn("ElSlider", "marks prop must be provided when step is mark");
		if (props.marks) {
			const keys = Object.keys(props.marks);
			const validPoints = markList.value.map((m) => m.point);
			const invalidKeys = keys.filter((key) => {
				const parsed = Number.parseFloat(key);
				return Number.isNaN(parsed) || !validPoints.includes(parsed);
			});
			if (invalidKeys.length > 0) debugWarn("ElSlider", `Some marks keys are invalid (not a number or out of [min, max]): [${invalidKeys.map((k) => `'${k}'`).join(", ")}] and will be ignored.`);
		}
	});
	return markList;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/composables/use-slide.mjs
var useSlide = (props, initData, emit) => {
	const { formItem: elFormItem } = useFormItem();
	const slider = shallowRef();
	const firstButton = ref();
	const secondButton = ref();
	const buttonRefs = {
		firstButton,
		secondButton
	};
	const sliderDisabled = useFormDisabled();
	const minValue = computed(() => {
		return Math.min(initData.firstValue, initData.secondValue);
	});
	const maxValue = computed(() => {
		return Math.max(initData.firstValue, initData.secondValue);
	});
	const barSize = computed(() => {
		return props.range ? `${100 * (maxValue.value - minValue.value) / (props.max - props.min)}%` : `${100 * (initData.firstValue - props.min) / (props.max - props.min)}%`;
	});
	const barStart = computed(() => {
		return props.range ? `${100 * (minValue.value - props.min) / (props.max - props.min)}%` : "0%";
	});
	const runwayStyle = computed(() => {
		return props.vertical ? { height: props.height } : {};
	});
	const barStyle = computed(() => {
		return props.vertical ? {
			height: barSize.value,
			bottom: barStart.value
		} : {
			width: barSize.value,
			left: barStart.value
		};
	});
	const resetSize = () => {
		if (slider.value) initData.sliderSize = slider.value.getBoundingClientRect()[props.vertical ? "height" : "width"];
	};
	const getButtonRefByPercent = (percent) => {
		const targetValue = props.min + percent * (props.max - props.min) / 100;
		if (!props.range) return firstButton;
		let buttonRefName;
		if (Math.abs(minValue.value - targetValue) < Math.abs(maxValue.value - targetValue)) buttonRefName = initData.firstValue < initData.secondValue ? "firstButton" : "secondButton";
		else buttonRefName = initData.firstValue > initData.secondValue ? "firstButton" : "secondButton";
		return buttonRefs[buttonRefName];
	};
	const setPosition = (percent) => {
		const buttonRef = getButtonRefByPercent(percent);
		buttonRef.value.setPosition(percent);
		return buttonRef;
	};
	const setFirstValue = (firstValue) => {
		initData.firstValue = firstValue ?? props.min;
		_emit(props.range ? [minValue.value, maxValue.value] : firstValue ?? props.min);
	};
	const setSecondValue = (secondValue) => {
		initData.secondValue = secondValue;
		if (props.range) _emit([minValue.value, maxValue.value]);
	};
	const _emit = (val) => {
		emit(UPDATE_MODEL_EVENT, val);
		emit(INPUT_EVENT, val);
	};
	const emitChange = async () => {
		await nextTick();
		emit(CHANGE_EVENT, props.range ? [minValue.value, maxValue.value] : props.modelValue);
	};
	const handleSliderPointerEvent = (event) => {
		if (sliderDisabled.value || initData.dragging) return;
		resetSize();
		let newPercent = 0;
		if (props.vertical) {
			const clientY = event.touches?.item(0)?.clientY ?? event.clientY;
			newPercent = (slider.value.getBoundingClientRect().bottom - clientY) / initData.sliderSize * 100;
		} else newPercent = ((event.touches?.item(0)?.clientX ?? event.clientX) - slider.value.getBoundingClientRect().left) / initData.sliderSize * 100;
		if (newPercent < 0 || newPercent > 100) return;
		return setPosition(newPercent);
	};
	const onSliderWrapperPrevent = (event) => {
		if (buttonRefs["firstButton"].value?.dragging || buttonRefs["secondButton"].value?.dragging) event.preventDefault();
	};
	const onSliderDown = async (event) => {
		const buttonRef = handleSliderPointerEvent(event);
		if (buttonRef) {
			await nextTick();
			buttonRef.value.onButtonDown(event);
		}
	};
	const onSliderClick = (event) => {
		if (handleSliderPointerEvent(event)) emitChange();
	};
	const onSliderMarkerDown = (position) => {
		if (sliderDisabled.value || initData.dragging) return;
		if (setPosition(position)) emitChange();
	};
	return {
		elFormItem,
		slider,
		firstButton,
		secondButton,
		sliderDisabled,
		minValue,
		maxValue,
		runwayStyle,
		barStyle,
		resetSize,
		setPosition,
		emitChange,
		onSliderWrapperPrevent,
		onSliderClick,
		onSliderDown,
		onSliderMarkerDown,
		setFirstValue,
		setSecondValue
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/composables/use-stops.mjs
var useStops = (props, initData, minValue, maxValue) => {
	const stops = computed(() => {
		if (!props.showStops || props.min > props.max) return [];
		if (props.step === "mark" || props.step === 0) {
			if (props.step === 0) debugWarn("ElSlider", "step should not be 0.");
			return [];
		}
		const stopCount = Math.ceil((props.max - props.min) / props.step);
		const stepWidth = 100 * props.step / (props.max - props.min);
		const result = Array.from({ length: stopCount - 1 }).map((_, index) => (index + 1) * stepWidth);
		if (props.range) return result.filter((step) => {
			return step < 100 * (minValue.value - props.min) / (props.max - props.min) || step > 100 * (maxValue.value - props.min) / (props.max - props.min);
		});
		else return result.filter((step) => step > 100 * (initData.firstValue - props.min) / (props.max - props.min));
	});
	const getStopStyle = (position) => {
		return props.vertical ? { bottom: `${position}%` } : { left: `${position}%` };
	};
	return {
		stops,
		getStopStyle
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/composables/use-watch.mjs
var useWatch = (props, initData, minValue, maxValue, emit, elFormItem) => {
	const _emit = (val) => {
		emit(UPDATE_MODEL_EVENT, val);
		emit(INPUT_EVENT, val);
	};
	const valueChanged = () => {
		if (props.range) return ![minValue.value, maxValue.value].every((item, index) => item === initData.oldValue[index]);
		else return props.modelValue !== initData.oldValue;
	};
	const setValues = () => {
		if (props.min > props.max) throwError("Slider", "min should not be greater than max.");
		const val = props.modelValue;
		if (props.range && isArray(val)) if (val[1] < props.min) _emit([props.min, props.min]);
		else if (val[0] > props.max) _emit([props.max, props.max]);
		else if (val[0] < props.min) _emit([props.min, val[1]]);
		else if (val[1] > props.max) _emit([val[0], props.max]);
		else {
			initData.firstValue = val[0];
			initData.secondValue = val[1];
			if (valueChanged()) {
				if (props.validateEvent) elFormItem?.validate?.("change").catch(NOOP);
				initData.oldValue = val.slice();
			}
		}
		else if (!props.range && isNumber(val) && !Number.isNaN(val)) if (val < props.min) _emit(props.min);
		else if (val > props.max) _emit(props.max);
		else {
			initData.firstValue = val;
			if (valueChanged()) {
				if (props.validateEvent) elFormItem?.validate?.("change").catch(NOOP);
				initData.oldValue = val;
			}
		}
	};
	setValues();
	watch(() => initData.dragging, (val) => {
		if (!val) setValues();
	});
	watch(() => props.modelValue, (val, oldVal) => {
		if (initData.dragging || isArray(val) && isArray(oldVal) && val.every((item, index) => item === oldVal[index]) && initData.firstValue === val[0] && initData.secondValue === val[1]) return;
		setValues();
	}, { deep: true });
	watch(() => [props.min, props.max], () => {
		setValues();
	});
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/composables/use-slider-button.mjs
var useTooltip = (props, formatTooltip, showTooltip) => {
	const tooltip = ref();
	const tooltipVisible = ref(false);
	const enableFormat = computed(() => {
		return formatTooltip.value instanceof Function;
	});
	return {
		tooltip,
		tooltipVisible,
		formatValue: computed(() => {
			return enableFormat.value && formatTooltip.value(props.modelValue) || props.modelValue;
		}),
		displayTooltip: debounce(() => {
			showTooltip.value && (tooltipVisible.value = true);
		}, 50),
		hideTooltip: debounce(() => {
			showTooltip.value && (tooltipVisible.value = false);
		}, 50)
	};
};
var useSliderButton = (props, initData, emit) => {
	const { disabled, min, max, step, showTooltip, persistent, precision, sliderSize, formatTooltip, emitChange, resetSize, updateDragging, markList } = inject(sliderContextKey);
	const { tooltip, tooltipVisible, formatValue, displayTooltip, hideTooltip } = useTooltip(props, formatTooltip, showTooltip);
	const button = ref();
	const currentPosition = computed(() => {
		return `${(props.modelValue - min.value) / (max.value - min.value) * 100}%`;
	});
	const wrapperStyle = computed(() => {
		return props.vertical ? { bottom: currentPosition.value } : { left: currentPosition.value };
	});
	const shouldMoveToMark = computed(() => {
		return step.value === "mark" && markList.value.length > 0;
	});
	const handleMouseEnter = () => {
		initData.hovering = true;
		displayTooltip();
	};
	const handleMouseLeave = () => {
		initData.hovering = false;
		if (!initData.dragging) hideTooltip();
	};
	const onButtonDown = (event) => {
		if (disabled.value) return;
		event.preventDefault();
		onDragStart(event);
		window.addEventListener("mousemove", onDragging);
		window.addEventListener("touchmove", onDragging);
		window.addEventListener("mouseup", onDragEnd);
		window.addEventListener("touchend", onDragEnd);
		window.addEventListener("contextmenu", onDragEnd);
		button.value.focus();
	};
	const incrementPosition = (amount) => {
		if (disabled.value) return;
		initData.newPosition = Number.parseFloat(currentPosition.value) + amount / (max.value - min.value) * 100;
		setPosition(initData.newPosition);
		emitChange();
	};
	const moveToMark = (amount) => {
		if (disabled.value || !markList.value.length) return;
		const current = props.modelValue;
		const epsilon = Number.EPSILON;
		const stride = Math.abs(amount);
		let target;
		if (amount > 0) {
			const startIndex = markList.value.findIndex((m) => m.point > current + epsilon);
			if (startIndex !== -1) {
				const targetIndex = Math.min(startIndex + stride - 1, markList.value.length - 1);
				target = markList.value[targetIndex].point;
			}
		} else {
			let startIndex = -1;
			for (let i = markList.value.length - 1; i >= 0; i--) if (markList.value[i].point < current - epsilon) {
				startIndex = i;
				break;
			}
			if (startIndex !== -1) {
				const targetIndex = Math.max(startIndex - (stride - 1), 0);
				target = markList.value[targetIndex].point;
			}
		}
		if (target !== void 0 && target !== current) {
			setPosition((target - min.value) / (max.value - min.value) * 100);
			emitChange();
		}
	};
	const onLeftKeyDown = () => {
		if (shouldMoveToMark.value) moveToMark(-1);
		else if (isNumber(step.value)) incrementPosition(-step.value);
	};
	const onRightKeyDown = () => {
		if (shouldMoveToMark.value) moveToMark(1);
		else if (isNumber(step.value)) incrementPosition(step.value);
	};
	const onPageDownKeyDown = () => {
		if (shouldMoveToMark.value) moveToMark(-4);
		else if (isNumber(step.value)) incrementPosition(-step.value * 4);
	};
	const onPageUpKeyDown = () => {
		if (shouldMoveToMark.value) moveToMark(4);
		else if (isNumber(step.value)) incrementPosition(step.value * 4);
	};
	const onHomeKeyDown = () => {
		if (disabled.value) return;
		setPosition(0);
		emitChange();
	};
	const onEndKeyDown = () => {
		if (disabled.value) return;
		setPosition(100);
		emitChange();
	};
	const onKeyDown = (event) => {
		const code = getEventCode(event);
		let isPreventDefault = true;
		switch (code) {
			case EVENT_CODE.left:
			case EVENT_CODE.down:
				onLeftKeyDown();
				break;
			case EVENT_CODE.right:
			case EVENT_CODE.up:
				onRightKeyDown();
				break;
			case EVENT_CODE.home:
				onHomeKeyDown();
				break;
			case EVENT_CODE.end:
				onEndKeyDown();
				break;
			case EVENT_CODE.pageDown:
				onPageDownKeyDown();
				break;
			case EVENT_CODE.pageUp:
				onPageUpKeyDown();
				break;
			default: isPreventDefault = false;
		}
		isPreventDefault && event.preventDefault();
	};
	const getClientXY = (event) => {
		let clientX;
		let clientY;
		if (event.type.startsWith("touch")) {
			clientY = event.touches[0].clientY;
			clientX = event.touches[0].clientX;
		} else {
			clientY = event.clientY;
			clientX = event.clientX;
		}
		return {
			clientX,
			clientY
		};
	};
	const onDragStart = (event) => {
		initData.dragging = true;
		initData.isClick = true;
		const { clientX, clientY } = getClientXY(event);
		if (props.vertical) initData.startY = clientY;
		else initData.startX = clientX;
		initData.startPosition = Number.parseFloat(currentPosition.value);
		initData.newPosition = initData.startPosition;
	};
	const onDragging = (event) => {
		if (initData.dragging) {
			initData.isClick = false;
			displayTooltip();
			resetSize();
			let diff;
			const { clientX, clientY } = getClientXY(event);
			if (props.vertical) {
				initData.currentY = clientY;
				diff = (initData.startY - initData.currentY) / sliderSize.value * 100;
			} else {
				initData.currentX = clientX;
				diff = (initData.currentX - initData.startX) / sliderSize.value * 100;
			}
			initData.newPosition = initData.startPosition + diff;
			setPosition(initData.newPosition);
		}
	};
	const onDragEnd = () => {
		if (initData.dragging) {
			setTimeout(() => {
				initData.dragging = false;
				if (!initData.hovering) hideTooltip();
				if (!initData.isClick) setPosition(initData.newPosition);
				emitChange();
			}, 0);
			window.removeEventListener("mousemove", onDragging);
			window.removeEventListener("touchmove", onDragging);
			window.removeEventListener("mouseup", onDragEnd);
			window.removeEventListener("touchend", onDragEnd);
			window.removeEventListener("contextmenu", onDragEnd);
		}
	};
	const setPosition = async (newPosition) => {
		if (newPosition === null || Number.isNaN(+newPosition)) return;
		newPosition = clamp(newPosition, 0, 100);
		let value;
		if (step.value === "mark") if (markList.value.length === 0) value = newPosition <= 50 ? min.value : max.value;
		else value = markList.value.reduce((prev, curr) => {
			return Math.abs(curr.position - newPosition) < Math.abs(prev.position - newPosition) ? curr : prev;
		}).point;
		else {
			const fullSteps = Math.floor((max.value - min.value) / step.value);
			const fullRangePercentage = fullSteps * step.value / (max.value - min.value) * 100;
			const threshold = fullRangePercentage + (100 - fullRangePercentage) / 2;
			if (newPosition < fullRangePercentage) {
				const valueBetween = fullRangePercentage / fullSteps;
				const steps = Math.round(newPosition / valueBetween);
				value = min.value + steps * step.value;
			} else if (newPosition < threshold) value = min.value + fullSteps * step.value;
			else value = max.value;
			value = Number.parseFloat(value.toFixed(precision.value));
		}
		if (value !== props.modelValue) emit(UPDATE_MODEL_EVENT, value);
		if (!initData.dragging && props.modelValue !== initData.oldValue) initData.oldValue = props.modelValue;
		await nextTick();
		initData.dragging && displayTooltip();
		tooltip.value.updatePopper();
	};
	watch(() => initData.dragging, (val) => {
		updateDragging(val);
	});
	useEventListener(button, "touchstart", onButtonDown, { passive: false });
	return {
		disabled,
		button,
		tooltip,
		tooltipVisible,
		showTooltip,
		persistent,
		wrapperStyle,
		formatValue,
		handleMouseEnter,
		handleMouseLeave,
		onButtonDown,
		onKeyDown,
		setPosition
	};
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/button.mjs
var sliderButtonProps = buildProps({
	modelValue: {
		type: Number,
		default: 0
	},
	vertical: Boolean,
	tooltipClass: String,
	placement: {
		type: String,
		values: Ee,
		default: "top"
	}
});
var sliderButtonEmits = { [UPDATE_MODEL_EVENT]: (value) => isNumber(value) };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/button.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = ["tabindex"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/button2.mjs
var button_default = /* @__PURE__ */ defineComponent({
	name: "ElSliderButton",
	__name: "button",
	props: sliderButtonProps,
	emits: sliderButtonEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("slider");
		const initData = reactive({
			hovering: false,
			dragging: false,
			isClick: false,
			startX: 0,
			currentX: 0,
			startY: 0,
			currentY: 0,
			startPosition: 0,
			newPosition: 0,
			oldValue: props.modelValue
		});
		const tooltipPersistent = computed(() => !showTooltip.value ? false : persistent.value);
		const { disabled, button, tooltip, showTooltip, persistent, tooltipVisible, wrapperStyle, formatValue, handleMouseEnter, handleMouseLeave, onButtonDown, onKeyDown, setPosition } = useSliderButton(props, initData, emit);
		const { hovering, dragging } = toRefs(initData);
		__expose({
			onButtonDown,
			onKeyDown,
			setPosition,
			hovering,
			dragging
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "button",
				ref: button,
				class: normalizeClass([unref(ns).e("button-wrapper"), {
					hover: unref(hovering),
					dragging: unref(dragging)
				}]),
				style: normalizeStyle(unref(wrapperStyle)),
				tabindex: unref(disabled) ? void 0 : 0,
				onMouseenter: _cache[0] || (_cache[0] = (...args) => unref(handleMouseEnter) && unref(handleMouseEnter)(...args)),
				onMouseleave: _cache[1] || (_cache[1] = (...args) => unref(handleMouseLeave) && unref(handleMouseLeave)(...args)),
				onMousedown: _cache[2] || (_cache[2] = (...args) => unref(onButtonDown) && unref(onButtonDown)(...args)),
				onFocus: _cache[3] || (_cache[3] = (...args) => unref(handleMouseEnter) && unref(handleMouseEnter)(...args)),
				onBlur: _cache[4] || (_cache[4] = (...args) => unref(handleMouseLeave) && unref(handleMouseLeave)(...args)),
				onKeydown: _cache[5] || (_cache[5] = (...args) => unref(onKeyDown) && unref(onKeyDown)(...args))
			}, [createVNode(unref(ElTooltip), {
				ref_key: "tooltip",
				ref: tooltip,
				visible: unref(tooltipVisible),
				placement: _ctx.placement,
				"fallback-placements": [
					"top",
					"bottom",
					"right",
					"left"
				],
				"stop-popper-mouse-event": false,
				"popper-class": _ctx.tooltipClass,
				disabled: !unref(showTooltip),
				persistent: tooltipPersistent.value
			}, {
				content: withCtx(() => [createBaseVNode("span", null, toDisplayString(unref(formatValue)), 1)]),
				default: withCtx(() => [createBaseVNode("div", { class: normalizeClass([unref(ns).e("button"), {
					hover: unref(hovering),
					dragging: unref(dragging)
				}]) }, null, 2)]),
				_: 1
			}, 8, [
				"visible",
				"placement",
				"popper-class",
				"disabled",
				"persistent"
			])], 46, _hoisted_1$1);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/marker.mjs
var sliderMarkerProps = buildProps({ mark: {
	type: definePropType([String, Object]),
	default: void 0
} });
var marker_default = defineComponent({
	name: "ElSliderMarker",
	props: sliderMarkerProps,
	setup(props) {
		const ns = useNamespace("slider");
		const label = computed(() => {
			return isString(props.mark) ? props.mark : props.mark.label;
		});
		const style = computed(() => isString(props.mark) ? void 0 : props.mark.style);
		return () => h("div", {
			class: ns.e("marks-text"),
			style: style.value
		}, label.value);
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/src/slider.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"id",
	"role",
	"aria-label",
	"aria-labelledby"
];
var _hoisted_2 = { key: 1 };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/slider/index.mjs
var ElSlider = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElSlider",
	__name: "slider",
	props: sliderProps,
	emits: sliderEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("slider");
		const { t } = useLocale();
		const initData = reactive({
			firstValue: 0,
			secondValue: 0,
			oldValue: 0,
			dragging: false,
			sliderSize: 1
		});
		const { elFormItem, slider, firstButton, secondButton, sliderDisabled, minValue, maxValue, runwayStyle, barStyle, resetSize, emitChange, onSliderWrapperPrevent, onSliderClick, onSliderDown, onSliderMarkerDown, setFirstValue, setSecondValue } = useSlide(props, initData, emit);
		const { stops, getStopStyle } = useStops(props, initData, minValue, maxValue);
		const { inputId, isLabeledByFormItem } = useFormItemInputId(props, { formItemContext: elFormItem });
		const sliderWrapperSize = useFormSize();
		const sliderInputSize = computed(() => props.inputSize || sliderWrapperSize.value);
		const renderInput = computed(() => {
			return props.showInput && !props.range && props.step !== "mark";
		});
		const groupLabel = computed(() => {
			return props.ariaLabel || t("el.slider.defaultLabel", {
				min: props.min,
				max: props.max
			});
		});
		const firstButtonLabel = computed(() => {
			if (props.range) return props.rangeStartLabel || t("el.slider.defaultRangeStartLabel");
			else return groupLabel.value;
		});
		const firstValueText = computed(() => {
			return props.formatValueText ? props.formatValueText(firstValue.value) : `${firstValue.value}`;
		});
		const secondButtonLabel = computed(() => {
			return props.rangeEndLabel || t("el.slider.defaultRangeEndLabel");
		});
		const secondValueText = computed(() => {
			return props.formatValueText ? props.formatValueText(secondValue.value) : `${secondValue.value}`;
		});
		const sliderKls = computed(() => [
			ns.b(),
			ns.m(sliderWrapperSize.value),
			ns.is("vertical", props.vertical),
			{ [ns.m("with-input")]: renderInput.value }
		]);
		const markList = useMarks(props);
		useWatch(props, initData, minValue, maxValue, emit, elFormItem);
		const sliderInputStep = computed(() => {
			return isNumber(props.step) ? props.step : 1;
		});
		const precision = computed(() => {
			const stepValue = isNumber(props.step) ? props.step : 1;
			const precisions = [
				props.min,
				props.max,
				stepValue
			].map((item) => {
				const decimal = `${item}`.split(".")[1];
				return decimal ? decimal.length : 0;
			});
			return Math.max.apply(null, precisions);
		});
		const { sliderWrapper } = useLifecycle(props, initData, resetSize);
		const { firstValue, secondValue, sliderSize } = toRefs(initData);
		const updateDragging = (val) => {
			initData.dragging = val;
		};
		useEventListener(sliderWrapper, "touchstart", onSliderWrapperPrevent, { passive: false });
		useEventListener(sliderWrapper, "touchmove", onSliderWrapperPrevent, { passive: false });
		provide(sliderContextKey, {
			...toRefs(props),
			sliderSize,
			disabled: sliderDisabled,
			precision,
			markList,
			emitChange,
			resetSize,
			updateDragging
		});
		__expose({ onSliderClick });
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				id: _ctx.range ? unref(inputId) : void 0,
				ref_key: "sliderWrapper",
				ref: sliderWrapper,
				class: normalizeClass(sliderKls.value),
				role: _ctx.range ? "group" : void 0,
				"aria-label": _ctx.range && !unref(isLabeledByFormItem) ? groupLabel.value : void 0,
				"aria-labelledby": _ctx.range && unref(isLabeledByFormItem) ? unref(elFormItem)?.labelId : void 0
			}, [createBaseVNode("div", {
				ref_key: "slider",
				ref: slider,
				class: normalizeClass([
					unref(ns).e("runway"),
					{ "show-input": renderInput.value },
					unref(ns).is("disabled", unref(sliderDisabled))
				]),
				style: normalizeStyle(unref(runwayStyle)),
				onMousedown: _cache[0] || (_cache[0] = (...args) => unref(onSliderDown) && unref(onSliderDown)(...args)),
				onTouchstartPassive: _cache[1] || (_cache[1] = (...args) => unref(onSliderDown) && unref(onSliderDown)(...args))
			}, [
				createBaseVNode("div", {
					class: normalizeClass(unref(ns).e("bar")),
					style: normalizeStyle(unref(barStyle))
				}, null, 6),
				createVNode(button_default, {
					id: !_ctx.range ? unref(inputId) : void 0,
					ref_key: "firstButton",
					ref: firstButton,
					"model-value": unref(firstValue),
					vertical: _ctx.vertical,
					"tooltip-class": _ctx.tooltipClass,
					placement: _ctx.placement,
					role: "slider",
					"aria-label": _ctx.range || !unref(isLabeledByFormItem) ? firstButtonLabel.value : void 0,
					"aria-labelledby": !_ctx.range && unref(isLabeledByFormItem) ? unref(elFormItem)?.labelId : void 0,
					"aria-valuemin": _ctx.min,
					"aria-valuemax": _ctx.range ? unref(secondValue) : _ctx.max,
					"aria-valuenow": unref(firstValue),
					"aria-valuetext": firstValueText.value,
					"aria-orientation": _ctx.vertical ? "vertical" : "horizontal",
					"aria-disabled": unref(sliderDisabled),
					"onUpdate:modelValue": unref(setFirstValue)
				}, null, 8, [
					"id",
					"model-value",
					"vertical",
					"tooltip-class",
					"placement",
					"aria-label",
					"aria-labelledby",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuenow",
					"aria-valuetext",
					"aria-orientation",
					"aria-disabled",
					"onUpdate:modelValue"
				]),
				_ctx.range ? (openBlock(), createBlock(button_default, {
					key: 0,
					ref_key: "secondButton",
					ref: secondButton,
					"model-value": unref(secondValue),
					vertical: _ctx.vertical,
					"tooltip-class": _ctx.tooltipClass,
					placement: _ctx.placement,
					role: "slider",
					"aria-label": secondButtonLabel.value,
					"aria-valuemin": unref(firstValue),
					"aria-valuemax": _ctx.max,
					"aria-valuenow": unref(secondValue),
					"aria-valuetext": secondValueText.value,
					"aria-orientation": _ctx.vertical ? "vertical" : "horizontal",
					"aria-disabled": unref(sliderDisabled),
					"onUpdate:modelValue": unref(setSecondValue)
				}, null, 8, [
					"model-value",
					"vertical",
					"tooltip-class",
					"placement",
					"aria-label",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuenow",
					"aria-valuetext",
					"aria-orientation",
					"aria-disabled",
					"onUpdate:modelValue"
				])) : createCommentVNode("v-if", true),
				_ctx.showStops ? (openBlock(), createElementBlock("div", _hoisted_2, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(stops), (item, key) => {
					return openBlock(), createElementBlock("div", {
						key,
						class: normalizeClass(unref(ns).e("stop")),
						style: normalizeStyle(unref(getStopStyle)(item))
					}, null, 6);
				}), 128))])) : createCommentVNode("v-if", true),
				unref(markList).length > 0 ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [createBaseVNode("div", null, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(markList), (item, key) => {
					return openBlock(), createElementBlock("div", {
						key,
						style: normalizeStyle(unref(getStopStyle)(item.position)),
						class: normalizeClass([unref(ns).e("stop"), unref(ns).e("marks-stop")])
					}, null, 6);
				}), 128))]), createBaseVNode("div", { class: normalizeClass(unref(ns).e("marks")) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(markList), (item, key) => {
					return openBlock(), createBlock(unref(marker_default), {
						key,
						mark: item.mark,
						style: normalizeStyle(unref(getStopStyle)(item.position)),
						onMousedown: withModifiers(($event) => unref(onSliderMarkerDown)(item.position), ["stop"])
					}, null, 8, [
						"mark",
						"style",
						"onMousedown"
					]);
				}), 128))], 2)], 64)) : createCommentVNode("v-if", true)
			], 38), renderInput.value ? (openBlock(), createBlock(unref(ElInputNumber), {
				key: 0,
				ref: "input",
				"model-value": unref(firstValue),
				class: normalizeClass(unref(ns).e("input")),
				step: sliderInputStep.value,
				disabled: unref(sliderDisabled),
				controls: _ctx.showInputControls,
				min: _ctx.min,
				max: _ctx.max,
				precision: precision.value,
				size: sliderInputSize.value,
				"onUpdate:modelValue": unref(setFirstValue),
				onChange: unref(emitChange)
			}, null, 8, [
				"model-value",
				"class",
				"step",
				"disabled",
				"controls",
				"min",
				"max",
				"precision",
				"size",
				"onUpdate:modelValue",
				"onChange"
			])) : createCommentVNode("v-if", true)], 10, _hoisted_1);
		};
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-select/src/time-select.mjs
var DEFAULT_START = "09:00";
var DEFAULT_END = "18:00";
var DEFAULT_STEP = "00:30";
/**
* @deprecated Removed after 3.0.0, Use `TimeSelectProps` instead.
*/
var timeSelectProps = buildProps({
	/**
	* @description set format of time
	*/
	format: {
		type: String,
		default: "HH:mm"
	},
	/**
	* @description binding value
	*/
	modelValue: { type: definePropType(String) },
	/**
	* @description whether TimeSelect is disabled
	*/
	disabled: {
		type: Boolean,
		default: void 0
	},
	/**
	* @description whether the input is editable
	*/
	editable: {
		type: Boolean,
		default: true
	},
	/**
	* @description Tooltip theme, built-in theme: `dark` / `light`
	*/
	effect: {
		type: definePropType(String),
		default: "light"
	},
	/**
	* @description whether to show clear button
	*/
	clearable: {
		type: Boolean,
		default: true
	},
	/**
	* @description size of Input
	*/
	size: useSizeProp,
	/**
	* @description placeholder in non-range mode
	*/
	placeholder: String,
	/**
	* @description start time
	*/
	start: {
		type: String,
		default: DEFAULT_START
	},
	/**
	* @description end time
	*/
	end: {
		type: String,
		default: DEFAULT_END
	},
	/**
	* @description time step
	*/
	step: {
		type: String,
		default: DEFAULT_STEP
	},
	/**
	* @description minimum time, any time before this time will be disabled
	*/
	minTime: { type: definePropType(String) },
	/**
	* @description maximum time, any time after this time will be disabled
	*/
	maxTime: { type: definePropType(String) },
	/**
	* @description whether `end` is included in options
	*/
	includeEndTime: Boolean,
	/**
	* @description same as `name` in native input
	*/
	name: String,
	/**
	* @description custom prefix icon component
	*/
	prefixIcon: {
		type: definePropType([String, Object]),
		default: () => clock_default
	},
	/**
	* @description custom clear icon component
	*/
	clearIcon: {
		type: definePropType([String, Object]),
		default: () => circle_close_default
	},
	/**
	* @description custom class name for TimeSelect's dropdown
	*/
	popperClass: {
		type: String,
		default: ""
	},
	/**
	* @description custom style for TimeSelect's dropdown
	*/
	popperStyle: { type: definePropType([String, Object]) },
	...useEmptyValuesProps
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-select/src/utils.mjs
var parseTime = (time) => {
	const values = (time || "").split(":");
	if (values.length >= 2) {
		let hours = Number.parseInt(values[0], 10);
		const minutes = Number.parseInt(values[1], 10);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
		const timeUpper = time.toUpperCase();
		if (timeUpper.includes("AM") && hours === 12) hours = 0;
		else if (timeUpper.includes("PM") && hours !== 12) hours += 12;
		return {
			hours,
			minutes
		};
	}
	return null;
};
var isValidTime = (time) => !!time && time.hours >= 0 && time.minutes >= 0 && !Number.isNaN(time.hours) && !Number.isNaN(time.minutes);
var compareTime = (time1, time2) => {
	const value1 = parseTime(time1);
	if (!value1) return -1;
	const value2 = parseTime(time2);
	if (!value2) return -1;
	const minutes1 = value1.minutes + value1.hours * 60;
	const minutes2 = value2.minutes + value2.hours * 60;
	if (minutes1 === minutes2) return 0;
	return minutes1 > minutes2 ? 1 : -1;
};
var padTime = (time) => {
	return `${time}`.padStart(2, "0");
};
var formatTime = (time) => {
	return `${padTime(time.hours)}:${padTime(time.minutes)}`;
};
var nextTime = (time, step) => {
	const timeValue = parseTime(time);
	if (!timeValue) return "";
	const stepValue = parseTime(step);
	if (!stepValue) return "";
	const next = {
		hours: timeValue.hours,
		minutes: timeValue.minutes
	};
	next.minutes += stepValue.minutes;
	next.hours += stepValue.hours;
	next.hours += Math.floor(next.minutes / 60);
	next.minutes = next.minutes % 60;
	return formatTime(next);
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/time-select/index.mjs
var ElTimeSelect = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElTimeSelect",
	__name: "time-select",
	props: timeSelectProps,
	emits: [
		CHANGE_EVENT,
		"blur",
		"focus",
		"clear",
		UPDATE_MODEL_EVENT
	],
	setup(__props, { expose: __expose }) {
		import_dayjs_min.default.extend(import_customParseFormat.default);
		const { Option: ElOption } = ElSelect;
		const props = __props;
		const nsInput = useNamespace("input");
		const select = ref();
		const _disabled = useFormDisabled();
		const { lang } = useLocale();
		const getValidTimeOrDefault = (value, propName, defaultValue, allowZero = true) => {
			const time = parseTime(value);
			if (!isValidTime(time) || !allowZero && time.hours === 0 && time.minutes === 0) {
				debugWarn("ElTimeSelect", `invalid ${propName}, fallback to default ${propName} (${defaultValue}).`);
				return defaultValue;
			}
			return formatTime(time);
		};
		const value = computed(() => props.modelValue);
		const start = computed(() => getValidTimeOrDefault(props.start, "start", DEFAULT_START));
		const end = computed(() => getValidTimeOrDefault(props.end, "end", DEFAULT_END));
		const minTime = computed(() => {
			const time = parseTime(props.minTime || "");
			return time ? formatTime(time) : null;
		});
		const maxTime = computed(() => {
			const time = parseTime(props.maxTime || "");
			return time ? formatTime(time) : null;
		});
		const step = computed(() => getValidTimeOrDefault(props.step, "step", DEFAULT_STEP, false));
		const items = computed(() => {
			const result = [];
			const push = (formattedValue, rawValue) => {
				result.push({
					value: formattedValue,
					rawValue,
					disabled: compareTime(rawValue, minTime.value || "-1:-1") <= 0 || compareTime(rawValue, maxTime.value || "100:100") >= 0
				});
			};
			let current = start.value;
			while (compareTime(current, end.value) <= 0) {
				push((0, import_dayjs_min.default)(current, "HH:mm").locale(lang.value).format(props.format), current);
				current = nextTime(current, step.value);
			}
			if (props.includeEndTime && result[result.length - 1]?.rawValue !== end.value) push((0, import_dayjs_min.default)(end.value, "HH:mm").locale(lang.value).format(props.format), end.value);
			return result;
		});
		const blur = () => {
			select.value?.blur?.();
		};
		const focus = () => {
			select.value?.focus?.();
		};
		__expose({
			/**
			* @description blur the Input component
			*/
			blur,
			/**
			* @description focus the Input component
			*/
			focus
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElSelect), {
				ref_key: "select",
				ref: select,
				name: __props.name,
				"model-value": value.value,
				disabled: unref(_disabled),
				clearable: __props.clearable,
				"clear-icon": __props.clearIcon,
				size: __props.size,
				effect: __props.effect,
				placeholder: __props.placeholder,
				"default-first-option": "",
				filterable: __props.editable,
				"empty-values": __props.emptyValues,
				"value-on-clear": __props.valueOnClear,
				"popper-class": __props.popperClass,
				"popper-style": __props.popperStyle,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = (event) => _ctx.$emit(unref("update:modelValue"), event)),
				onChange: _cache[1] || (_cache[1] = (event) => _ctx.$emit(unref("change"), event)),
				onBlur: _cache[2] || (_cache[2] = (event) => _ctx.$emit("blur", event)),
				onFocus: _cache[3] || (_cache[3] = (event) => _ctx.$emit("focus", event)),
				onClear: _cache[4] || (_cache[4] = () => _ctx.$emit("clear"))
			}, {
				prefix: withCtx(() => [__props.prefixIcon ? (openBlock(), createBlock(unref(ElIcon), {
					key: 0,
					class: normalizeClass(unref(nsInput).e("prefix-icon"))
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.prefixIcon)))]),
					_: 1
				}, 8, ["class"])) : createCommentVNode("v-if", true)]),
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(items.value, (item) => {
					return openBlock(), createBlock(unref(ElOption), {
						key: item.value,
						label: item.value,
						value: item.value,
						disabled: item.disabled
					}, null, 8, [
						"label",
						"value",
						"disabled"
					]);
				}), 128))]),
				_: 1
			}, 8, [
				"name",
				"model-value",
				"disabled",
				"clearable",
				"clear-icon",
				"size",
				"effect",
				"placeholder",
				"filterable",
				"empty-values",
				"value-on-clear",
				"popper-class",
				"popper-style"
			]);
		};
	}
}));
//#endregion
export { RTL_OFFSET_NAG as C, START_ALIGNMENT as D, SCROLL_EVT as E, ElTimePicker as O, ITEM_RENDER_EVT as S, RTL_OFFSET_POS_DESC as T, virtualizedListProps as _, ElColorPickerPanel as a, CENTERED_ALIGNMENT as b, FixedSizeList as c, useCache as d, getRTLOffsetType as f, virtualizedGridProps as g, isRTL as h, ElColorPicker as i, createList as l, isHorizontal as m, ElSlider as n, ElCascader as o, getScrollDir as p, ElRate as r, ElCascaderPanel as s, ElTimeSelect as t, ScrollBar as u, virtualizedScrollbarProps as v, RTL_OFFSET_POS_ASC as w, FORWARD as x, AUTO_ALIGNMENT as y };
