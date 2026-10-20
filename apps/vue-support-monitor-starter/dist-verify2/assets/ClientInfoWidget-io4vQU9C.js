import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Dt as position_default, Nt as refresh_default, St as odometer_default, ct as lightning_default, k as cpu_default, rt as histogram_default, un as video_play_default, vt as monitor_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as usePerfMonitor } from "./usePerfMonitor-CdYyu0kX.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/ClientInfoWidget.vue?vue&type=script&setup=true&name=ClientInfoWidget&lang.ts
var _hoisted_1 = { class: "ciw" };
var _hoisted_2 = {
	key: 0,
	class: "ciw__header"
};
var _hoisted_3 = { class: "ciw__title" };
var _hoisted_4 = { class: "ciw__body" };
var _hoisted_5 = { class: "ciw__metrics" };
var _hoisted_6 = { class: "ciw__metric" };
var _hoisted_7 = { class: "ciw__metric-icon" };
var _hoisted_8 = { class: "ciw__metric" };
var _hoisted_9 = { class: "ciw__metric-icon" };
var _hoisted_10 = { class: "ciw__metric" };
var _hoisted_11 = { class: "ciw__metric-icon" };
var _hoisted_12 = { class: "ciw__metric" };
var _hoisted_13 = { class: "ciw__metric-icon" };
var _hoisted_14 = { class: "ciw__ip" };
var _hoisted_15 = { class: "ciw__ip-label" };
var _hoisted_16 = { class: "ciw__ip-value" };
var _hoisted_17 = {
	key: 0,
	class: "ciw__ip-text"
};
var _hoisted_18 = {
	key: 1,
	class: "ciw__ip-offline"
};
var _hoisted_19 = {
	key: 2,
	class: "ciw__ip-offline"
};
var _hoisted_20 = ["disabled"];
var _hoisted_21 = { class: "ciw__rows" };
var _hoisted_22 = { class: "ciw__row" };
var _hoisted_23 = { class: "ciw__row-v" };
var _hoisted_24 = { class: "ciw__row" };
var _hoisted_25 = { class: "ciw__row-v" };
var _hoisted_26 = { class: "ciw__row" };
var _hoisted_27 = { class: "ciw__row-v" };
var _hoisted_28 = { class: "ciw__row" };
var _hoisted_29 = { class: "ciw__row-v" };
var _hoisted_30 = { class: "ciw__row" };
var _hoisted_31 = { class: "ciw__row-v" };
var PUBLIC_IP_API = "https://api.ipify.org?format=json";
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/ClientInfoWidget.vue
var ClientInfoWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ClientInfoWidget",
	props: { widget: {} },
	setup(__props) {
		const { data: perf, startAll, stopAll } = usePerfMonitor();
		const publicIp = ref("");
		const ipLoading = ref(false);
		const ipError = ref(false);
		computed(() => {
			if (!perf.fps) return 0;
			return Math.min(100, Math.round(perf.fps / 60 * 100));
		});
		const memPercent = computed(() => {
			if (!perf.memTotal) return 0;
			return Math.min(100, Math.round(perf.memUsed / perf.memTotal * 100));
		});
		const batteryPercent = computed(() => {
			if (perf.batteryLevel == null) return 0;
			return Math.round(perf.batteryLevel * 100);
		});
		const onlineText = computed(() => perf.networkStatus ? "在线" : "离线");
		const batteryColor = computed(() => {
			if (perf.batteryCharging) return "var(--el-color-success)";
			if (batteryPercent.value <= 20) return "var(--el-color-danger)";
			if (batteryPercent.value <= 50) return "var(--el-color-warning)";
			return "var(--el-color-success)";
		});
		function loadColor(v) {
			if (v >= 80) return "var(--el-color-danger)";
			if (v >= 55) return "var(--el-color-warning)";
			return "var(--el-color-success)";
		}
		function healthColor(v) {
			if (v >= 55) return "var(--el-color-success)";
			if (v >= 30) return "var(--el-color-warning)";
			return "var(--el-color-danger)";
		}
		async function fetchPublicIp() {
			ipLoading.value = true;
			ipError.value = false;
			try {
				const res = await fetch(PUBLIC_IP_API, { signal: AbortSignal.timeout(8e3) });
				if (!res.ok) throw new Error("HTTP " + res.status);
				const json = await res.json();
				publicIp.value = json.ip;
			} catch {
				ipError.value = true;
				publicIp.value = "";
			} finally {
				ipLoading.value = false;
			}
		}
		const browser = computed(() => parseUserAgent().browser);
		const os = computed(() => parseUserAgent().os);
		const resolution = computed(() => window.screen.width + " x " + window.screen.height + " (" + window.screen.colorDepth + "bit)");
		const deviceMemoryText = computed(() => {
			const m = navigator.deviceMemory;
			return m ? m + " GB" : "未知";
		});
		const language = computed(() => navigator.language || "未知");
		function parseUserAgent() {
			const ua = navigator.userAgent;
			let browser = "未知浏览器", os = "未知系统";
			if (/Edg\//.test(ua)) browser = "Edge " + (ua.match(/Edg\/([\d.]+)/)?.[1] ?? "");
			else if (/Chrome\//.test(ua)) browser = "Chrome " + (ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "");
			else if (/Firefox\//.test(ua)) browser = "Firefox " + (ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "");
			else if (/Safari\//.test(ua)) browser = "Safari " + (ua.match(/Version\/([\d.]+)/)?.[1] ?? "");
			if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
			else if (/Mac OS X/.test(ua)) os = "macOS " + (ua.match(/Mac OS X ([\d_.]+)/)?.[1]?.replace(/_/g, ".") ?? "");
			else if (/Linux/.test(ua)) os = "Linux";
			else if (/Android/.test(ua)) os = "Android " + (ua.match(/Android ([\d.]+)/)?.[1] ?? "");
			else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
			return {
				browser,
				os
			};
		}
		onMounted(() => {
			startAll();
			fetchPublicIp();
		});
		onBeforeUnmount(() => {
			stopAll();
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { class: "ciw__title-icon" }, {
				default: withCtx(() => [createVNode(unref(monitor_default))]),
				_: 1
			}), createBaseVNode("span", null, toDisplayString(__props.widget.title), 1)]), createBaseVNode("span", { class: normalizeClass(["ciw__status", unref(perf).networkStatus ? "ciw__status--on" : "ciw__status--off"]) }, toDisplayString(onlineText.value), 3)])) : createCommentVNode("", true), createBaseVNode("div", _hoisted_4, [
				createBaseVNode("div", _hoisted_5, [
					createBaseVNode("div", _hoisted_6, [
						createBaseVNode("div", _hoisted_7, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(cpu_default))]),
							_: 1
						})]),
						_cache[0] || (_cache[0] = createBaseVNode("div", { class: "ciw__metric-label" }, "CPU", -1)),
						createBaseVNode("div", {
							class: "ciw__metric-value",
							style: normalizeStyle({ color: loadColor(unref(perf).cpu) })
						}, toDisplayString(unref(perf).cpu) + "%", 5)
					]),
					createBaseVNode("div", _hoisted_8, [
						createBaseVNode("div", _hoisted_9, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(video_play_default))]),
							_: 1
						})]),
						_cache[1] || (_cache[1] = createBaseVNode("div", { class: "ciw__metric-label" }, "FPS", -1)),
						createBaseVNode("div", {
							class: "ciw__metric-value",
							style: normalizeStyle({ color: healthColor(unref(perf).fps) })
						}, toDisplayString(unref(perf).fps), 5)
					]),
					createBaseVNode("div", _hoisted_10, [
						createBaseVNode("div", _hoisted_11, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(odometer_default))]),
							_: 1
						})]),
						_cache[2] || (_cache[2] = createBaseVNode("div", { class: "ciw__metric-label" }, "内存", -1)),
						createBaseVNode("div", {
							class: "ciw__metric-value",
							style: normalizeStyle({ color: loadColor(memPercent.value) })
						}, toDisplayString(unref(perf).memUsed) + "M", 5)
					]),
					createBaseVNode("div", _hoisted_12, [
						createBaseVNode("div", _hoisted_13, [createVNode(_component_el_icon, { style: normalizeStyle({ color: batteryColor.value }) }, {
							default: withCtx(() => [createVNode(unref(histogram_default))]),
							_: 1
						}, 8, ["style"])]),
						_cache[3] || (_cache[3] = createBaseVNode("div", { class: "ciw__metric-label" }, "电池", -1)),
						createBaseVNode("div", {
							class: "ciw__metric-value",
							style: normalizeStyle({ color: batteryColor.value })
						}, [createTextVNode(toDisplayString(batteryPercent.value) + "% ", 1), unref(perf).batteryCharging ? (openBlock(), createBlock(_component_el_icon, {
							key: 0,
							class: "ciw__charge"
						}, {
							default: withCtx(() => [createVNode(unref(lightning_default))]),
							_: 1
						})) : createCommentVNode("", true)], 4)
					])
				]),
				createBaseVNode("div", _hoisted_14, [createBaseVNode("div", _hoisted_15, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(position_default))]),
					_: 1
				}), _cache[4] || (_cache[4] = createTextVNode(" 公网 IP", -1))]), withDirectives((openBlock(), createElementBlock("div", _hoisted_16, [publicIp.value ? (openBlock(), createElementBlock("span", _hoisted_17, toDisplayString(publicIp.value), 1)) : ipError.value ? (openBlock(), createElementBlock("span", _hoisted_18, "获取失败")) : (openBlock(), createElementBlock("span", _hoisted_19, "获取中…")), createBaseVNode("button", {
					type: "button",
					class: "ciw__ip-refresh",
					disabled: ipLoading.value,
					title: "刷新公网 IP",
					"aria-label": "刷新公网 IP",
					onClick: fetchPublicIp
				}, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(refresh_default))]),
					_: 1
				})], 8, _hoisted_20)])), [[_directive_loading, ipLoading.value]])]),
				createBaseVNode("div", _hoisted_21, [
					createBaseVNode("div", _hoisted_22, [_cache[5] || (_cache[5] = createBaseVNode("span", { class: "ciw__row-k" }, "浏览器", -1)), createBaseVNode("span", _hoisted_23, toDisplayString(browser.value), 1)]),
					createBaseVNode("div", _hoisted_24, [_cache[6] || (_cache[6] = createBaseVNode("span", { class: "ciw__row-k" }, "系统", -1)), createBaseVNode("span", _hoisted_25, toDisplayString(os.value), 1)]),
					createBaseVNode("div", _hoisted_26, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "ciw__row-k" }, "分辨率", -1)), createBaseVNode("span", _hoisted_27, toDisplayString(resolution.value), 1)]),
					createBaseVNode("div", _hoisted_28, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "ciw__row-k" }, "设备内存", -1)), createBaseVNode("span", _hoisted_29, toDisplayString(deviceMemoryText.value), 1)]),
					createBaseVNode("div", _hoisted_30, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "ciw__row-k" }, "语言", -1)), createBaseVNode("span", _hoisted_31, toDisplayString(language.value), 1)])
				])
			])]);
		};
	}
}), [["__scopeId", "data-v-2f5fc6ac"]]);
//#endregion
export { ClientInfoWidget_default as default };
