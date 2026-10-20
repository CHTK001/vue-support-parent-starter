import { _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, o as Fragment, rr as toDisplayString, v as createBlock, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { a as useRouter, i as useRoute } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { v as getHost } from "./api-CRz4q4qT.js";
import { n as ScSshDirectViewer_default, r as ScGuacViewer_default, t as ScVncDirectViewer_default } from "./ScVncDirectViewer-iBrbl4VU.js";
//#region src/views/StandaloneTerminal.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "stand-term" };
var _hoisted_2 = {
	key: 0,
	class: "st-mask"
};
var _hoisted_3 = {
	key: 1,
	class: "st-mask st-err-col"
};
var _hoisted_4 = {
	key: 3,
	class: "st-mask"
};
//#endregion
//#region src/views/StandaloneTerminal.vue
var StandaloneTerminal_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "StandaloneTerminal",
	setup(__props) {
		/**
		* 独立全屏终端 —— 由 TerminalView「弹出独立页面」window.open 打开。
		* 不携带应用外壳（侧栏/顶栏），远控渲染区独占整个浏览器可视范围。
		* 路由 meta.standalone = true，App.vue 据此只渲染 <router-view>。
		* @author CH
		* @since 4.0.0
		*/
		const route = useRoute();
		const router = useRouter();
		const host = ref(null);
		const loading = ref(true);
		const error = ref("");
		const disconnected = ref(false);
		const hostId = computed(() => {
			const v = route.query.hostId;
			const n = Number(Array.isArray(v) ? v[0] : v);
			return Number.isFinite(n) ? n : null;
		});
		const protocol = computed(() => {
			const v = route.query.protocol ?? "";
			const p = (Array.isArray(v) ? v[0] : v).toLowerCase();
			return p === "ssh" || p === "rdp" || p === "vnc" ? p : "";
		});
		const identityId = computed(() => {
			const v = route.query.identityId;
			const n = Number(Array.isArray(v) ? v[0] : v);
			return Number.isFinite(n) ? n : null;
		});
		/** 远控端口：主机配置优先，SSH 回落到接入端口，RDP/VNC 用协议默认 */
		function targetPortOf(h, p) {
			if (h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
			if (p === "ssh") return h.serverHostPort || null;
			return p === "rdp" ? 3389 : 5900;
		}
		const connection = computed(() => {
			const h = host.value;
			if (!h || !protocol.value || disconnected.value) return null;
			const mode = (h.serverHostRemoteMode ?? "").toUpperCase();
			return {
				hostId: h.id,
				hostName: `${h.serverHostName} (${h.serverHostAddress})`,
				address: h.serverHostAddress,
				protocol: protocol.value,
				identityId: identityId.value,
				targetPort: targetPortOf(h, protocol.value),
				mode: mode === "DIRECT" || mode === "NONE" ? mode : "GUACD"
			};
		});
		onMounted(async () => {
			if (hostId.value == null || !protocol.value) {
				error.value = "缺少 hostId / protocol 参数";
				loading.value = false;
				return;
			}
			try {
				const h = await getHost(hostId.value);
				if (!h) error.value = "主机不存在";
				else host.value = {
					id: h.id,
					serverHostName: h.serverHostName,
					serverHostAddress: h.serverHostAddress,
					serverHostPort: h.serverHostPort,
					serverHostOsType: h.serverHostOsType,
					serverHostRemoteProtocol: h.serverHostRemoteProtocol,
					serverHostRemotePort: h.serverHostRemotePort,
					serverHostRemoteMode: h.serverHostRemoteMode
				};
			} catch (e) {
				error.value = String(e?.message ?? e);
			} finally {
				loading.value = false;
			}
		});
		function goBack() {
			router.replace("/terminal");
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [loading.value ? (openBlock(), createElementBlock("div", _hoisted_2, "正在建立连接…")) : error.value ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", null, toDisplayString(error.value), 1), createBaseVNode("button", {
				type: "button",
				class: "st-back",
				onClick: goBack
			}, "返回远程控制")])) : connection.value ? (openBlock(), createElementBlock(Fragment, { key: 2 }, [connection.value.protocol === "ssh" ? (openBlock(), createBlock(ScSshDirectViewer_default, {
				key: 0,
				connection: connection.value,
				onClose: _cache[0] || (_cache[0] = ($event) => disconnected.value = true)
			}, null, 8, ["connection"])) : connection.value.protocol === "vnc" && connection.value.mode === "DIRECT" ? (openBlock(), createBlock(ScVncDirectViewer_default, {
				key: 1,
				connection: connection.value,
				onClose: _cache[1] || (_cache[1] = ($event) => disconnected.value = true)
			}, null, 8, ["connection"])) : (openBlock(), createBlock(ScGuacViewer_default, {
				key: 2,
				connection: connection.value,
				inline: "",
				onClose: _cache[2] || (_cache[2] = ($event) => disconnected.value = true)
			}, null, 8, ["connection"]))], 64)) : (openBlock(), createElementBlock("div", _hoisted_4, [_cache[3] || (_cache[3] = createBaseVNode("span", null, "连接已关闭 · 可关闭此窗口", -1)), createBaseVNode("button", {
				type: "button",
				class: "st-back",
				onClick: goBack
			}, "返回远程控制")]))]);
		};
	}
}), [["__scopeId", "data-v-5c6374a5"]]);
//#endregion
export { StandaloneTerminal_default as default };
