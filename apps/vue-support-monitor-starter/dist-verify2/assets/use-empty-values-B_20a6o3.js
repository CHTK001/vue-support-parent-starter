import { Bn as isFunction, J as inject, L as getCurrentInstance, Rn as isArray, g as computed, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as definePropType, i as debugWarn, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-empty-values/index.mjs
var emptyValuesContextKey = Symbol("emptyValuesContextKey");
var SCOPE = "use-empty-values";
var DEFAULT_EMPTY_VALUES = [
	"",
	void 0,
	null
];
/**
* @deprecated Removed after 3.0.0, Use `UseEmptyValuesProps` instead.
*/
var useEmptyValuesProps = buildProps({
	/**
	* @description empty values supported by the component
	*/
	emptyValues: Array,
	/**
	* @description return value when cleared, if you want to set `undefined`, use `() => undefined`
	*/
	valueOnClear: {
		type: definePropType([
			String,
			Number,
			Boolean,
			Function
		]),
		default: void 0,
		validator: (val) => {
			val = isFunction(val) ? val() : val;
			if (isArray(val)) return val.every((item) => !item);
			return !val;
		}
	}
});
var useEmptyValues = (props, defaultValue) => {
	const config = getCurrentInstance() ? inject(emptyValuesContextKey, ref({})) : ref({});
	const emptyValues = computed(() => props.emptyValues || config.value.emptyValues || DEFAULT_EMPTY_VALUES);
	const valueOnClear = computed(() => {
		if (isFunction(props.valueOnClear)) return props.valueOnClear();
		else if (props.valueOnClear !== void 0) return props.valueOnClear;
		else if (isFunction(config.value.valueOnClear)) return config.value.valueOnClear();
		else if (config.value.valueOnClear !== void 0) return config.value.valueOnClear;
		return defaultValue !== void 0 ? defaultValue : void 0;
	});
	const isEmptyValue = (value) => {
		let result = true;
		if (isArray(value)) result = emptyValues.value.some((emptyValue) => {
			return isEqual(value, emptyValue);
		});
		else result = emptyValues.value.includes(value);
		return result;
	};
	if (!isEmptyValue(valueOnClear.value)) debugWarn(SCOPE, "value-on-clear should be a value of empty-values");
	return {
		emptyValues,
		valueOnClear,
		isEmptyValue
	};
};
//#endregion
export { useEmptyValues as n, useEmptyValuesProps as r, emptyValuesContextKey as t };
