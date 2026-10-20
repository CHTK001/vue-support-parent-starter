import { $n as normalizeClass, E as createTextVNode, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Dn as IP_LOOKUP_PATH, Nn as isCapabilityPathEnabled, Zt as getApiHttp } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/ui/src/components/ReIpText/ReIpText.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-ip-text__address"
};
var _hoisted_2 = {
	key: 0,
	class: "re-ip-text__loading"
};
var _hoisted_3 = {
	key: 1,
	class: "re-ip-text__addr-text"
};
var _hoisted_4 = { class: "re-ip-text__detail" };
var _hoisted_5 = { class: "re-ip-text__detail-label" };
var _hoisted_6 = { class: "re-ip-text__detail-value" };
var CACHE_PREFIX = "re-ip-lookup-";
var CACHE_TTL = 864e5;
//#endregion
//#region ../../packages/ui/src/components/ReIpText/ReIpText.vue
var ReIpText_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReIpText",
	props: {
		ip: {},
		address: {},
		thirdPartyFix: {
			type: Boolean,
			default: false
		},
		placeholder: {},
		clickable: {
			type: Boolean,
			default: false
		},
		icon: { default: "" }
	},
	setup(__props) {
		/**
		* ReIpText —— IP 地址展示组件
		*
		* 显示 IP 地址 + 归属地，支持缓存和三方查询。
		*
		* 用法：
		*   <ReIpText ip="114.114.114.114" address="中国 江苏 南京" />
		*   <ReIpText ip="114.114.114.114" />
		*   <ReIpText ip="114.114.114.114" :third-party-fix="true" />
		*   <ReIpText ip="114.114.114.114" placeholder="未知位置" />
		*   <ReIpText ip="114.114.114.114" address="南京" icon="location" />
		*   <ReIpText ip="114.114.114.114" :clickable="true" />
		*/
		const props = __props;
		const resolvedAddress = ref("");
		const loading = ref(false);
		const dialogVisible = ref(false);
		const detailData = ref({});
		const hasAddress = computed(() => !!(resolvedAddress.value || props.address));
		/** 判断是否为内网/回环地址 */
		function isInternalIp(ip) {
			if (!ip) return false;
			const v = ip.toLowerCase();
			if (v === "::1" || v === "0:0:0:0:0:0:0:1" || v === "localhost" || v === "0.0.0.0") return true;
			if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb")) return true;
			if (v.startsWith("127.") || v.startsWith("10.") || v.startsWith("192.168.")) return true;
			const m = v.match(/^172\.(\d{1,3})\./);
			if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
			return false;
		}
		const internalIp = computed(() => isInternalIp(props.ip));
		const displayAddress = computed(() => {
			if (props.address) return props.address;
			if (internalIp.value) return "本地网络";
			if (resolvedAddress.value) return resolvedAddress.value;
			return props.placeholder || "";
		});
		const showAddressLine = computed(() => {
			if (displayAddress.value) return true;
			return false;
		});
		computed(() => {
			if (props.icon) return props.icon;
			if (!hasAddress.value) return "globe";
			return "location";
		});
		function readCache(ip) {
			try {
				const raw = localStorage.getItem(CACHE_PREFIX + ip);
				if (!raw) return null;
				const data = JSON.parse(raw);
				if (Date.now() - data.timestamp > CACHE_TTL) return null;
				return data.address;
			} catch {
				return null;
			}
		}
		function writeCache(ip, address) {
			try {
				localStorage.setItem(CACHE_PREFIX + ip, JSON.stringify({
					address,
					timestamp: Date.now()
				}));
			} catch {}
		}
		async function doLookup() {
			if (loading.value || !props.ip) return;
			if (!isCapabilityPathEnabled("/v2/ip/lookup")) return;
			loading.value = true;
			try {
				const data = (await getApiHttp().get(IP_LOOKUP_PATH).query({ ip: props.ip }).then((r) => r.data))?.data;
				if (data) {
					const addr = [
						data.country,
						data.province,
						data.city
					].filter(Boolean).join(" ") + (data.isp ? ` ${data.isp}` : "");
					if (addr) {
						resolvedAddress.value = addr;
						writeCache(props.ip, addr);
					}
				}
			} catch {} finally {
				loading.value = false;
			}
		}
		function resolve() {
			if (props.address) {
				resolvedAddress.value = "";
				return;
			}
			if (isInternalIp(props.ip)) {
				resolvedAddress.value = "";
				return;
			}
			const cached = readCache(props.ip);
			resolvedAddress.value = cached || "";
			if (cached) return;
			if (props.thirdPartyFix) doLookup();
		}
		function handleClick() {
			if (!props.clickable) return;
			const parts = { "IP 地址": props.ip };
			if (displayAddress.value) parts["归属地"] = displayAddress.value;
			if (loading.value) parts["状态"] = "查询中...";
			detailData.value = parts;
			dialogVisible.value = true;
		}
		watch(() => [props.ip, props.address], resolve);
		onMounted(resolve);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [createBaseVNode("span", { class: normalizeClass(["re-ip-text", { "re-ip-text--clickable": __props.clickable }]) }, [createBaseVNode("span", {
				class: "re-ip-text__ip",
				onClick: handleClick
			}, [renderSlot(_ctx.$slots, "ip", { ip: __props.ip }, () => [createTextVNode(toDisplayString(__props.ip), 1)], true)]), showAddressLine.value ? (openBlock(), createElementBlock("span", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("span", _hoisted_2, "查询中...")) : (openBlock(), createElementBlock("span", _hoisted_3, [renderSlot(_ctx.$slots, "address", { address: displayAddress.value }, () => [createTextVNode(toDisplayString(displayAddress.value), 1)], true)]))])) : createCommentVNode("", true)], 2), __props.clickable ? (openBlock(), createBlock(unref(component), {
				key: 0,
				modelValue: dialogVisible.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => dialogVisible.value = $event),
				title: "IP 详情",
				width: "400px",
				"close-on-click-modal": true
			}, {
				default: withCtx(() => [createBaseVNode("div", _hoisted_4, [(openBlock(true), createElementBlock(Fragment, null, renderList(detailData.value, (val, key) => {
					return openBlock(), createElementBlock("div", {
						key,
						class: "re-ip-text__detail-row"
					}, [createBaseVNode("span", _hoisted_5, toDisplayString(key), 1), createBaseVNode("span", _hoisted_6, toDisplayString(val), 1)]);
				}), 128))])]),
				_: 1
			}, 8, ["modelValue"])) : createCommentVNode("", true)], 64);
		};
	}
}), [["__scopeId", "data-v-083bd4ef"]]);
//#endregion
export { ReIpText_default as default };
