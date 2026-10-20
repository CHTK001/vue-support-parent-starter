import { E as createTextVNode, Ht as watch, _ as createBaseVNode, b as createElementBlock, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, rr as toDisplayString, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReTime/utils.ts
/** 把任意输入归一为毫秒时间戳。失败返回 NaN。 */
function toMs(value) {
	if (value === null || value === void 0 || value === "") return NaN;
	if (value instanceof Date) {
		const ms = value.getTime();
		return Number.isFinite(ms) ? ms : NaN;
	}
	if (typeof value === "number") {
		const ms = value < 0xe8d4a51000 ? value * 1e3 : value;
		return Number.isFinite(ms) ? ms : NaN;
	}
	if (typeof value === "string") {
		if (/^-?\d+(\.\d+)?$/.test(value)) return toMs(Number(value));
		const parsed = Date.parse(value);
		return Number.isFinite(parsed) ? parsed : NaN;
	}
	return NaN;
}
/** 数字前补零 */
function pad(n, len = 2) {
	return String(n).padStart(len, "0");
}
/** 内部支持的 token */
var TOKEN_RE = /\[([^\]]+)\]|YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|SSS/g;
/**
* 按 token 格式化日期对象。
* - YYYY: 4 位年；YY: 2 位年
* - MM/M: 月（补零/不补零）
* - DD/D: 日
* - HH/H: 时（24h）
* - mm/m: 分
* - ss/s: 秒
* - SSS: 毫秒
* - \[...\]: 转义原样输出
*/
function formatByPattern(date, pattern) {
	const Y = date.getFullYear();
	const M = date.getMonth() + 1;
	const D = date.getDate();
	const h = date.getHours();
	const m = date.getMinutes();
	const s = date.getSeconds();
	const ms = date.getMilliseconds();
	return pattern.replace(TOKEN_RE, (_, esc) => {
		if (esc !== void 0) return esc;
		switch (_) {
			case "YYYY": return String(Y);
			case "YY": return String(Y).slice(-2);
			case "MM": return pad(M);
			case "M": return String(M);
			case "DD": return pad(D);
			case "D": return String(D);
			case "HH": return pad(h);
			case "H": return String(h);
			case "mm": return pad(m);
			case "m": return String(m);
			case "ss": return pad(s);
			case "s": return String(s);
			case "SSS": return pad(ms, 3);
			default: return _;
		}
	});
}
/** 主格式化入口 */
function formatValue(value, format) {
	const ms = toMs(value);
	if (!Number.isFinite(ms)) return "";
	if (format === "duration") return formatDuration(value);
	if (format === "ms") return String(Math.round(ms));
	const date = new Date(ms);
	switch (format) {
		case "timestamp": return String(ms);
		case "timestamp-s": return String(Math.floor(ms / 1e3));
		case "iso": return date.toISOString();
		case "YYYY-MM-DD HH:mm:ss":
		case "YYYY-MM-DD":
		case "HH:mm:ss":
		case "HH:mm":
		case "YYYY/MM/DD":
		case "YYYY/MM/DD HH:mm:ss": return formatByPattern(date, format);
		default: return formatByPattern(date, format);
	}
}
/**
* 中文相对时间：返回 "3 分钟前" / "刚刚" / "2 天后" 等。
* @param value 目标时间
* @param base 基准时间（默认 now）
*/
function relativeTime(value, base = Date.now()) {
	const ms = toMs(value);
	if (!Number.isFinite(ms)) return "";
	const diff = ms - base;
	const abs = Math.abs(diff);
	const future = diff > 0;
	if (abs < 45e3) return "刚刚";
	if (abs < 6e4) return future ? "即将" : "刚刚";
	for (const u of [
		{
			ms: 31536e6,
			single: "年",
			many: "年"
		},
		{
			ms: 2592e6,
			single: "个月",
			many: "个月"
		},
		{
			ms: 6048e5,
			single: "周",
			many: "周"
		},
		{
			ms: 864e5,
			single: "天",
			many: "天"
		},
		{
			ms: 36e5,
			single: "小时",
			many: "小时"
		},
		{
			ms: 6e4,
			single: "分钟",
			many: "分钟"
		},
		{
			ms: 1e3,
			single: "秒",
			many: "秒"
		}
	]) if (abs >= u.ms) {
		const label = `${Math.floor(abs / u.ms)} ${u.many}`;
		return future ? `${label}后` : `${label}前`;
	}
	return "";
}
/**
* 自动最佳粒度显示时长（毫秒输入）：
*   800  -> "800 毫秒"
*   30000 -> "30 秒"
*   90000 -> "1.5 分钟"
*/
function formatDuration(value) {
	const raw = typeof value === "number" ? value : toMs(value);
	if (!Number.isFinite(raw)) return "";
	const ms = Math.max(0, raw);
	if (ms < 1e3) return `${Math.floor(ms)} 毫秒`;
	const s = ms / 1e3;
	if (s < 60) return `${trimNumber(s)} 秒`;
	const m = s / 60;
	if (m < 60) return `${trimNumber(m)} 分钟`;
	const h = m / 60;
	if (h < 24) return `${trimNumber(h)} 小时`;
	const d = h / 24;
	if (d < 30) return `${trimNumber(d)} 天`;
	return `${trimNumber(d / 30)} 个月`;
}
function trimNumber(n) {
	const rounded = Math.round(n * 100) / 100;
	return String(rounded);
}
//#endregion
//#region ../../packages/ui/src/components/ReTime/ReTime.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-time" };
var _hoisted_2 = ["title"];
var _hoisted_3 = {
	key: 0,
	class: "re-time__relative"
};
//#endregion
//#region ../../packages/ui/src/components/ReTime/ReTime.vue
var ReTime_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReTime",
	inheritAttrs: true,
	__name: "ReTime",
	props: {
		value: { default: void 0 },
		format: { default: "YYYY-MM-DD HH:mm:ss" },
		relative: {
			type: Boolean,
			default: false
		},
		refreshInterval: { default: 3e4 },
		placeholder: { default: "-" },
		base: { default: void 0 }
	},
	setup(__props, { expose: __expose }) {
		/**
		* ReTime —— 时间展示组件
		*
		* 接受任意时间输入（Date / string / number），按 format 输出对应格式。
		* 支持同时展示格式化时间 + 灰色"多久之前"中文相对时间。
		*
		* 用法：
		*   <ReTime :value="1719700000000" format="YYYY-MM-DD HH:mm:ss" />
		*   <ReTime :value="date" :relative="true" />
		*   <ReTime :value="ms" format="duration" />
		*   <ReTime :value="ms" format="ms" />
		*
		* 用 absoluteTime / relativeTime 插槽可自定义主行/副行的渲染。
		*/
		const props = __props;
		/** 主行格式化结果 */
		const display = computed(() => {
			if (props.value === null || props.value === void 0 || props.value === "") return "";
			return formatValue(props.value, props.format);
		});
		/** 副行相对时间 */
		const relText = computed(() => {
			if (!props.relative) return "";
			const base = props.base ?? Date.now();
			return relativeTime(props.value, base);
		});
		/** 触发刷新（用于相对时间随时间流逝） */
		const tick = ref(0);
		let timer = null;
		function startTimer() {
			stopTimer();
			if (!props.relative) return;
			if (!props.refreshInterval || props.refreshInterval <= 0) return;
			timer = setInterval(() => {
				tick.value = Date.now();
			}, props.refreshInterval);
		}
		function stopTimer() {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		}
		watch(() => [
			props.relative,
			props.refreshInterval,
			props.value
		], () => {
			startTimer();
		}, { immediate: true });
		onBeforeUnmount(stopTimer);
		/** 给副行 computed 留个依赖以便 tick 触发刷新 */
		const relTextLive = computed(() => {
			tick.value;
			return relText.value;
		});
		/** 最终展示：无值时显示 placeholder */
		const finalDisplay = computed(() => {
			if (props.value === null || props.value === void 0 || props.value === "" || Number.isNaN(toMs(props.value))) return props.placeholder;
			return display.value;
		});
		/** 供外部校验/格式化复用 */
		const msValue = computed(() => toMs(props.value));
		__expose({
			/** 当前解析后的毫秒时间戳 */
			getMs() {
				return msValue.value;
			},
			/** 当前格式化结果 */
			format() {
				return display.value;
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", _hoisted_1, [createBaseVNode("span", {
				class: "re-time__main",
				title: display.value
			}, [renderSlot(_ctx.$slots, "absoluteTime", {
				value: display.value,
				ms: msValue.value
			}, () => [createTextVNode(toDisplayString(finalDisplay.value), 1)], true)], 8, _hoisted_2), __props.relative && relTextLive.value ? (openBlock(), createElementBlock("span", _hoisted_3, [renderSlot(_ctx.$slots, "relativeTime", { value: relTextLive.value }, () => [createTextVNode(toDisplayString(relTextLive.value), 1)], true)])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-c47675eb"]]);
//#endregion
//#region ../../packages/ui/src/components/ReTime/index.ts
var plugin = { install(app) {
	app.component("ReTime", ReTime_default$1);
} };
var ReTime_default = ReTime_default$1;
//#endregion
export { relativeTime as a, formatValue as i, plugin as n, toMs as o, formatDuration as r, ReTime_default as t };
