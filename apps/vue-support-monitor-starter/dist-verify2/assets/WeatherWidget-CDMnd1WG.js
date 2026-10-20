import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, it as onBeforeUnmount, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Xt as sunny_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as useWeather } from "./useWeather-Cgskzzun.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/WeatherWidget.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "ww" };
var _hoisted_2 = {
	key: 0,
	class: "ww__header"
};
var _hoisted_3 = { class: "ww__title" };
var _hoisted_4 = { class: "weather-panel" };
var _hoisted_5 = { class: "source-publish-time" };
var _hoisted_6 = { title: `气象数据源发布时间` };
var _hoisted_7 = { class: "weather-top-wrap" };
var _hoisted_8 = { class: "weather-left" };
var _hoisted_9 = { class: "weather-main-card" };
var _hoisted_10 = { class: "update-time" };
var _hoisted_11 = { class: "sun-track" };
var _hoisted_12 = {
	key: 0,
	class: "sun-icon"
};
var _hoisted_13 = {
	key: 1,
	class: "sun-label sun-rise"
};
var _hoisted_14 = {
	key: 2,
	class: "sun-label sun-set"
};
var _hoisted_15 = { class: "location-name" };
var _hoisted_16 = { class: "now-temp" };
var _hoisted_17 = { class: "meta-grid" };
var _hoisted_18 = { class: "meta-item" };
var _hoisted_19 = { class: "meta-value" };
var _hoisted_20 = { class: "meta-item" };
var _hoisted_21 = { class: "meta-value" };
var _hoisted_22 = { class: "meta-item" };
var _hoisted_23 = { class: "meta-value" };
var _hoisted_24 = { class: "meta-item" };
var _hoisted_25 = { class: "meta-value" };
var _hoisted_26 = { class: "weather-right" };
var _hoisted_27 = { class: "week-forecast-wrap" };
var _hoisted_28 = ["onClick"];
var _hoisted_29 = { class: "week-date" };
var _hoisted_30 = { class: "forecast-block forecast-block--day" };
var _hoisted_31 = { class: "weather-text" };
var _hoisted_32 = { class: "wind-text" };
var _hoisted_33 = { class: "temp-bar" };
var _hoisted_34 = { class: "temp-max" };
var _hoisted_35 = {
	key: 0,
	class: "precip-text"
};
var _hoisted_36 = { class: "forecast-block forecast-block--night" };
var _hoisted_37 = { class: "weather-text" };
var _hoisted_38 = { class: "wind-text" };
var _hoisted_39 = { class: "temp-bar temp-bar-night" };
var _hoisted_40 = { class: "temp-min" };
var _hoisted_41 = {
	key: 0,
	class: "hour-forecast-wrap"
};
var _hoisted_42 = { class: "hour-title" };
var _hoisted_43 = { class: "hour-time" };
var _hoisted_44 = { class: "hour-temp" };
var _hoisted_45 = { class: "hour-wind" };
var _hoisted_46 = {
	key: 1,
	class: "weather-empty"
};
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/WeatherWidget.vue
var WeatherWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "WeatherWidget",
	props: { widget: {} },
	setup(__props) {
		const { weatherCode, temp, feelsLike, humidity, windSpeed, windDir, location, updatedAt, sourcePublishTime, forecast, dayForecast, nightForecast, hourForecast, loading, hasWeather, weatherDesc, fetchWeather, wmoToFluentIcon, windDegToDir } = useWeather();
		const selectedDayIndex = ref(0);
		const hourListEl = ref(null);
		const hourItemEls = ref([]);
		watch(hourForecast, () => {
			if (!hourForecast.value.length) return;
			const nowIdx = hourForecast.value.findIndex((h) => h.isNow);
			nextTick(() => {
				const target = hourItemEls.value[nowIdx] ?? hourItemEls.value[0];
				if (target && hourListEl.value) {
					const parent = hourListEl.value;
					const parentWidth = parent.clientWidth;
					const targetLeft = target.offsetLeft;
					parent.scrollTo({
						left: targetLeft - parentWidth / 2 + target.clientWidth / 2,
						behavior: "smooth"
					});
				}
			});
		}, { immediate: true });
		let timer = null;
		onMounted(() => {
			fetchWeather();
			timer = setInterval(fetchWeather, 6e5);
		});
		onBeforeUnmount(() => {
			if (timer) clearInterval(timer);
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { class: "ww__title-icon" }, {
				default: withCtx(() => [createVNode(unref(sunny_default))]),
				_: 1
			}), createBaseVNode("span", null, toDisplayString(__props.widget.title), 1)])])) : createCommentVNode("", true), withDirectives((openBlock(), createElementBlock("div", _hoisted_4, [unref(hasWeather) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createBaseVNode("div", _hoisted_5, [createBaseVNode("span", _hoisted_6, "发布时间：" + toDisplayString(unref(sourcePublishTime)), 1)]), createBaseVNode("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, [
				createBaseVNode("div", _hoisted_10, [createBaseVNode("span", null, "🕒 " + toDisplayString(unref(updatedAt)) + "更新", 1)]),
				createBaseVNode("div", _hoisted_11, [
					unref(forecast)[0] ? (openBlock(), createElementBlock("div", _hoisted_12, "☀️")) : createCommentVNode("", true),
					_cache[0] || (_cache[0] = createBaseVNode("div", { class: "arc-line" }, null, -1)),
					unref(forecast)[0] ? (openBlock(), createElementBlock("div", _hoisted_13, "日出" + toDisplayString(unref(forecast)[0].sunrise), 1)) : createCommentVNode("", true),
					unref(forecast)[0] ? (openBlock(), createElementBlock("div", _hoisted_14, "日落" + toDisplayString(unref(forecast)[0].sunset), 1)) : createCommentVNode("", true)
				]),
				createBaseVNode("div", _hoisted_15, toDisplayString(unref(location)), 1),
				createBaseVNode("div", _hoisted_16, [createTextVNode(toDisplayString(unref(temp)), 1), _cache[1] || (_cache[1] = createBaseVNode("span", { class: "unit" }, "°C", -1))])
			]), createBaseVNode("div", _hoisted_17, [
				createBaseVNode("div", _hoisted_18, [
					_cache[2] || (_cache[2] = createBaseVNode("span", { class: "meta-icon" }, "💧", -1)),
					_cache[3] || (_cache[3] = createBaseVNode("span", { class: "meta-label" }, "降水量", -1)),
					createBaseVNode("span", _hoisted_19, toDisplayString(unref(forecast)[0]?.precip ?? 0) + "mm", 1)
				]),
				createBaseVNode("div", _hoisted_20, [
					_cache[4] || (_cache[4] = createBaseVNode("span", { class: "meta-icon" }, "🌬️", -1)),
					_cache[5] || (_cache[5] = createBaseVNode("span", { class: "meta-label" }, "风向", -1)),
					createBaseVNode("span", _hoisted_21, toDisplayString(unref(windDir) || "--"), 1)
				]),
				createBaseVNode("div", _hoisted_22, [
					_cache[6] || (_cache[6] = createBaseVNode("span", { class: "meta-icon" }, "💦", -1)),
					_cache[7] || (_cache[7] = createBaseVNode("span", { class: "meta-label" }, "相对湿度", -1)),
					createBaseVNode("span", _hoisted_23, toDisplayString(unref(humidity)) + "%", 1)
				]),
				createBaseVNode("div", _hoisted_24, [
					_cache[8] || (_cache[8] = createBaseVNode("span", { class: "meta-icon" }, "🌡️", -1)),
					_cache[9] || (_cache[9] = createBaseVNode("span", { class: "meta-label" }, "体感温度", -1)),
					createBaseVNode("span", _hoisted_25, toDisplayString(unref(feelsLike)) + "°C", 1)
				])
			])]), createBaseVNode("div", _hoisted_26, [createBaseVNode("div", _hoisted_27, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(dayForecast), (dayItem, idx) => {
				return openBlock(), createElementBlock("div", {
					class: normalizeClass(["week-col", { active: idx === selectedDayIndex.value }]),
					key: idx,
					onClick: ($event) => selectedDayIndex.value = idx
				}, [
					createBaseVNode("div", _hoisted_29, toDisplayString(dayItem.dateText), 1),
					createBaseVNode("div", _hoisted_30, [
						_cache[10] || (_cache[10] = createBaseVNode("span", { class: "forecast-block__label" }, "日间", -1)),
						createVNode(_component_ReIcon, {
							name: unref(wmoToFluentIcon)(dayItem.weatherCode),
							size: "24"
						}, null, 8, ["name"]),
						createBaseVNode("div", _hoisted_31, toDisplayString(dayItem.weatherDesc), 1),
						createBaseVNode("div", _hoisted_32, toDisplayString(dayItem.windDir), 1),
						createBaseVNode("div", _hoisted_33, [createBaseVNode("span", _hoisted_34, toDisplayString(dayItem.tempMax) + "°C", 1)]),
						dayItem.precipProb ? (openBlock(), createElementBlock("div", _hoisted_35, "💧" + toDisplayString(dayItem.precipProb) + "%", 1)) : createCommentVNode("", true)
					]),
					createBaseVNode("div", _hoisted_36, [
						_cache[11] || (_cache[11] = createBaseVNode("span", { class: "forecast-block__label" }, "夜间", -1)),
						createVNode(_component_ReIcon, {
							name: unref(wmoToFluentIcon)(unref(nightForecast)[idx].weatherCode),
							size: "24"
						}, null, 8, ["name"]),
						createBaseVNode("div", _hoisted_37, toDisplayString(unref(nightForecast)[idx].weatherDesc), 1),
						createBaseVNode("div", _hoisted_38, toDisplayString(unref(nightForecast)[idx].windDir), 1),
						createBaseVNode("div", _hoisted_39, [createBaseVNode("span", _hoisted_40, toDisplayString(unref(nightForecast)[idx].tempMin) + "°C", 1)])
					])
				], 10, _hoisted_28);
			}), 128))]), unref(hourForecast).length ? (openBlock(), createElementBlock("div", _hoisted_41, [createBaseVNode("div", _hoisted_42, toDisplayString(unref(dayForecast)[selectedDayIndex.value].dateText) + " 逐小时预报", 1), createBaseVNode("div", {
				class: "hour-list",
				ref_key: "hourListEl",
				ref: hourListEl
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(hourForecast), (h, idx) => {
				return openBlock(), createElementBlock("div", {
					class: normalizeClass(["hour-item", {
						"hour-item--now": h.isNow,
						"hour-item--past": h.isPast
					}]),
					key: h.time,
					ref_for: true,
					ref: (el) => hourItemEls.value[idx] = el
				}, [
					createBaseVNode("div", _hoisted_43, toDisplayString(h.time), 1),
					createVNode(_component_ReIcon, {
						name: unref(wmoToFluentIcon)(h.weatherCode),
						size: "22"
					}, null, 8, ["name"]),
					createBaseVNode("div", _hoisted_44, toDisplayString(h.temp) + "°C", 1),
					createBaseVNode("div", _hoisted_45, toDisplayString(h.windDir), 1)
				], 2);
			}), 128))], 512)])) : createCommentVNode("", true)])])], 64)) : (openBlock(), createElementBlock("div", _hoisted_46, [createVNode(_component_ReIcon, {
				name: "fluent:weather-sunny-24-regular",
				size: "48",
				class: "weather-empty-icon"
			}), _cache[12] || (_cache[12] = createBaseVNode("p", null, "天气数据加载中...", -1))]))])), [[_directive_loading, unref(loading)]])]);
		};
	}
}), [["__scopeId", "data-v-6682ddc8"]]);
//#endregion
export { WeatherWidget_default as default };
