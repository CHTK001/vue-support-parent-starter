import { $n as normalizeClass, D as createVNode, E as createTextVNode, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { in as http, yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region src/views/SystemConfigView.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "sc tel-page" };
var _hoisted_2 = { class: "page-header" };
var _hoisted_3 = { class: "page-actions" };
var _hoisted_4 = { class: "sc-grid-2" };
var _hoisted_5 = { class: "sc-card-head" };
var _hoisted_6 = { class: "sc-tile" };
var _hoisted_7 = { class: "sc-tt" };
var _hoisted_8 = { class: "sc-tt-name" };
var _hoisted_9 = { class: "sc-tt-desc" };
var _hoisted_10 = { class: "sc-fields" };
var _hoisted_11 = { class: "sc-label" };
var _hoisted_12 = {
	key: 2,
	class: "sc-hint"
};
var _hoisted_13 = { class: "sc-foot" };
var _hoisted_14 = { class: "sc-consumer" };
var _hoisted_15 = { class: "sip-head" };
var _hoisted_16 = { class: "sc-tile sip-tile" };
var _hoisted_17 = { class: "sip-status" };
var _hoisted_18 = { class: "sip-status-text" };
var _hoisted_19 = { class: "sip-body" };
var _hoisted_20 = { class: "sip-config" };
var _hoisted_21 = { class: "sc-field" };
var _hoisted_22 = { class: "sc-field" };
var _hoisted_23 = { class: "sc-field" };
var _hoisted_24 = { class: "sip-cmds" };
var _hoisted_25 = { class: "cmd-block" };
var _hoisted_26 = { class: "cmd-text" };
var _hoisted_27 = { class: "cmd-block" };
var _hoisted_28 = { class: "cmd-text" };
var _hoisted_29 = { class: "cmd-block" };
var _hoisted_30 = { class: "cmd-text" };
//#endregion
//#region src/views/SystemConfigView.vue
var SystemConfigView_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "SystemConfigView",
	setup(__props) {
		/**
		* 系统配置 —— 系统级（Guacd 远控网关 + SIP 内网穿透）配置
		*/
		const CARDS = [
			{
				key: "guacd",
				title: "guacd",
				desc: "远控隧道守护进程 · 服务端连接",
				icon: "Connection",
				consumer: "GuacdConnectionFactory 动态读取 · 远控隧道建立时生效",
				items: [{
					key: "guacd.host",
					label: "地址",
					type: "text",
					placeholder: "124.221.230.112"
				}, {
					key: "guacd.port",
					label: "端口",
					type: "number",
					placeholder: "4822"
				}]
			},
			{
				key: "guacd-client",
				title: "guacd-client",
				desc: "浏览器侧 WS 隧道网关",
				icon: "Link",
				consumer: "RemoteControlPageController 动态读取 · 生成远控页面时生效",
				items: [{
					key: "guacd.client.host",
					label: "网关地址（host:port）",
					type: "text",
					placeholder: "127.0.0.1:8848",
					hint: "留空 = 同域 location.host"
				}]
			},
			{
				key: "agent",
				title: "Agent 包",
				desc: "监控 Agent 部署包路径与下载",
				icon: "Download",
				consumer: "Agent 部署时从平台下载 · 打包后自动更新",
				items: [{
					key: "agent.package.path",
					label: "Agent 包路径",
					type: "text",
					placeholder: "agent-package/monitor-agent.tar.gz",
					hint: "相对于平台工作目录的 tar.gz 包路径"
				}, {
					key: "prometheus.package.path",
					label: "Prometheus 包路径",
					type: "text",
					placeholder: "prometheus/prometheus.tar.gz",
					hint: "Prometheus 二进制部署包路径"
				}]
			}
		];
		const KEYS = CARDS.flatMap((c) => c.items.map((i) => i.key));
		const FALLBACK = {
			"guacd.host": "124.221.230.112",
			"guacd.port": "4822",
			"guacd.client.host": "127.0.0.1:8848",
			"agent.package.path": "monitor-agent/monitor-agent.tar.gz",
			"prometheus.package.path": "prometheus/prometheus.tar.gz"
		};
		const values = ref({});
		const loading = ref(false);
		const saving = ref(false);
		const sipRunning = ref(false);
		const sipStarting = ref(false);
		const sipForm = ref({
			enabled: false,
			serverHost: "124.221.230.112",
			controlPort: 7822,
			secret: "lvzhou2011"
		});
		const sipCmds = ref({});
		async function load() {
			loading.value = true;
			try {
				const map = await http().get("/ms/server/config/map").then((r) => unwrapResult(r));
				const merged = {};
				for (const k of KEYS) {
					const v = map?.[k];
					merged[k] = v == null ? FALLBACK[k] : String(v);
				}
				values.value = merged;
				const sipCfg = await http().get("/ms/server/sip/config").then((r) => unwrapResult(r));
				sipForm.value.enabled = sipCfg?.["sip.enabled"] === "true";
				sipForm.value.serverHost = sipCfg?.["sip.server.host"] ?? "124.221.230.112";
				sipForm.value.controlPort = sipCfg?.["sip.control.port"] ?? 7822;
				sipForm.value.secret = sipCfg?.["sip.secret"] ?? "lvzhou2011";
				sipRunning.value = sipCfg?.running === true;
				sipCmds.value = await http().get("/ms/server/sip/deploy-cmds").then((r) => unwrapResult(r));
			} catch (e) {
				values.value = { ...FALLBACK };
				message.error(`加载失败：${String(e?.message ?? e)}`);
			} finally {
				loading.value = false;
			}
		}
		async function save() {
			saving.value = true;
			try {
				const payload = {};
				for (const k of KEYS) {
					const v = values.value[k];
					if (v != null && v !== "") payload[k] = String(v);
				}
				await http().post("/ms/server/config").data(payload);
				message.success("系统配置已保存");
			} catch (e) {
				message.error(`保存失败：${String(e?.message ?? e)}`);
			} finally {
				saving.value = false;
			}
		}
		async function toggleSip() {
			sipStarting.value = true;
			try {
				if (sipRunning.value) {
					await http().post("/ms/server/sip/stop");
					sipRunning.value = false;
					sipForm.value.enabled = false;
					message.success("SIP 服务已停止");
				} else {
					await http().post("/ms/server/config").data({
						"sip.enabled": "true",
						"sip.server.host": sipForm.value.serverHost,
						"sip.control.port": String(sipForm.value.controlPort),
						"sip.secret": sipForm.value.secret
					});
					await http().post("/ms/server/sip/start");
					sipRunning.value = true;
					sipForm.value.enabled = true;
					message.success("SIP 服务已启动");
				}
			} catch (e) {
				message.error(`操作失败：${String(e?.message ?? e)}`);
			} finally {
				sipStarting.value = false;
			}
		}
		const clientMode = (c) => {
			const v = c.items.find((i) => i.key === "guacd.client.host");
			if (!v) return "";
			return values.value[v.key]?.trim() ? "自定义网关" : "同域直连";
		};
		onMounted(load);
		return (_ctx, _cache) => {
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReTag = resolveComponent("ReTag");
			const _component_ReInput = resolveComponent("ReInput");
			const _component_ReInputNumber = resolveComponent("ReInputNumber");
			const _component_ReCard = resolveComponent("ReCard");
			const _component_ReSkeleton = resolveComponent("ReSkeleton");
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [_cache[5] || (_cache[5] = createBaseVNode("div", null, [createBaseVNode("h1", { class: "page-title" }, "系统配置"), createBaseVNode("p", { class: "page-desc" }, "远控网关与内网穿透配置 · 保存后即时生效")], -1)), createBaseVNode("div", _hoisted_3, [createVNode(_component_ReButton, {
				icon: "RefreshRight",
				"show-text": true,
				loading: loading.value,
				onClick: load
			}, {
				default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("刷新", -1)])]),
				_: 1
			}, 8, ["loading"]), createVNode(_component_ReButton, {
				icon: "Check",
				"show-text": true,
				type: "primary",
				loading: saving.value,
				onClick: save
			}, {
				default: withCtx(() => [..._cache[4] || (_cache[4] = [createTextVNode("保存", -1)])]),
				_: 1
			}, 8, ["loading"])])]), createVNode(_component_ReSkeleton, {
				loading: loading.value,
				rows: 3,
				animated: ""
			}, {
				default: withCtx(() => [createBaseVNode("div", _hoisted_4, [(openBlock(), createElementBlock(Fragment, null, renderList(CARDS, (c) => {
					return createVNode(_component_ReCard, {
						key: c.key,
						radius: 12,
						shadow: "never",
						class: "sc-card"
					}, {
						header: withCtx(() => [createBaseVNode("div", _hoisted_5, [createBaseVNode("div", _hoisted_6, [createVNode(_component_ReIcon, {
							name: c.icon,
							size: 15
						}, null, 8, ["name"])]), createBaseVNode("div", _hoisted_7, [createBaseVNode("b", _hoisted_8, toDisplayString(c.title), 1), createBaseVNode("span", _hoisted_9, toDisplayString(c.desc), 1)])])]),
						default: withCtx(() => [createBaseVNode("div", _hoisted_10, [(openBlock(true), createElementBlock(Fragment, null, renderList(c.items, (it) => {
							return openBlock(), createElementBlock("label", {
								key: it.key,
								class: "sc-field"
							}, [
								createBaseVNode("span", _hoisted_11, [createTextVNode(toDisplayString(it.label) + " ", 1), it.key === "guacd.client.host" ? (openBlock(), createBlock(_component_ReTag, {
									key: 0,
									type: values.value[it.key]?.trim() ? "primary" : "info",
									effect: "light"
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(clientMode(c)), 1)]),
									_: 2
								}, 1032, ["type"])) : createCommentVNode("", true)]),
								it.type === "text" ? (openBlock(), createBlock(_component_ReInput, {
									key: 0,
									modelValue: values.value[it.key],
									"onUpdate:modelValue": ($event) => values.value[it.key] = $event,
									placeholder: it.placeholder,
									class: "sc-mono",
									style: { "width": "100%" }
								}, null, 8, [
									"modelValue",
									"onUpdate:modelValue",
									"placeholder"
								])) : (openBlock(), createBlock(_component_ReInputNumber, {
									key: 1,
									"model-value": values.value[it.key] === "" || values.value[it.key] == null ? null : Number(values.value[it.key]),
									min: 0,
									max: 65535,
									"controls-position": "right",
									class: "sc-mono",
									style: { "width": "100%" },
									"onUpdate:modelValue": ($event) => values.value[it.key] = $event == null ? "" : String($event)
								}, null, 8, ["model-value", "onUpdate:modelValue"])),
								it.hint ? (openBlock(), createElementBlock("div", _hoisted_12, toDisplayString(it.hint), 1)) : createCommentVNode("", true)
							]);
						}), 128))]), createBaseVNode("div", _hoisted_13, [createBaseVNode("span", _hoisted_14, toDisplayString(c.consumer), 1)])]),
						_: 2
					}, 1024);
				}), 64))]), createVNode(_component_ReCard, {
					radius: 12,
					shadow: "never",
					class: "sip-card"
				}, {
					header: withCtx(() => [createBaseVNode("div", _hoisted_15, [
						createBaseVNode("div", _hoisted_16, [createVNode(_component_ReIcon, {
							name: "Connection",
							size: 16
						})]),
						_cache[6] || (_cache[6] = createBaseVNode("div", { class: "sc-tt" }, [createBaseVNode("b", { class: "sc-tt-name" }, "SIP 内网穿透"), createBaseVNode("span", { class: "sc-tt-desc" }, "Secure Infrastructure Proxy · 打通 guacd 到内网机器（RDP/SSH/VNC）")], -1)),
						createBaseVNode("div", _hoisted_17, [
							createBaseVNode("span", { class: normalizeClass(["sip-dot", sipRunning.value ? "on" : "off"]) }, null, 2),
							createBaseVNode("span", _hoisted_18, toDisplayString(sipRunning.value ? "运行中" : "已停止"), 1),
							createVNode(_component_ReButton, {
								type: sipRunning.value ? "danger" : "success",
								loading: sipStarting.value,
								onClick: toggleSip
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(sipRunning.value ? "停止" : "启动服务"), 1)]),
								_: 1
							}, 8, ["type", "loading"])
						])
					])]),
					default: withCtx(() => [createBaseVNode("div", _hoisted_19, [
						createBaseVNode("div", _hoisted_20, [
							createBaseVNode("label", _hoisted_21, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "sc-label" }, "SIP 服务器地址", -1)), createVNode(_component_ReInput, {
								modelValue: sipForm.value.serverHost,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => sipForm.value.serverHost = $event),
								placeholder: "124.221.230.112",
								class: "sc-mono"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("label", _hoisted_22, [_cache[8] || (_cache[8] = createBaseVNode("span", { class: "sc-label" }, "控制端口", -1)), createVNode(_component_ReInputNumber, {
								modelValue: sipForm.value.controlPort,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => sipForm.value.controlPort = $event),
								min: 1024,
								max: 65535,
								"controls-position": "right",
								class: "sc-mono"
							}, null, 8, ["modelValue"])]),
							createBaseVNode("label", _hoisted_23, [_cache[9] || (_cache[9] = createBaseVNode("span", { class: "sc-label" }, "认证密钥", -1)), createVNode(_component_ReInput, {
								modelValue: sipForm.value.secret,
								"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => sipForm.value.secret = $event),
								placeholder: "lvzhou2011",
								class: "sc-mono"
							}, null, 8, ["modelValue"])])
						]),
						_cache[14] || (_cache[14] = createBaseVNode("div", { class: "sip-deploy" }, [createBaseVNode("div", { class: "deploy-title" }, "部署架构"), createBaseVNode("div", { class: "deploy-flow" }, [
							createBaseVNode("div", { class: "deploy-node" }, [createBaseVNode("div", { class: "deploy-node-title" }, "sip + visit"), createBaseVNode("div", { class: "deploy-node-desc" }, [
								createTextVNode("部署到 guacd 服务器"),
								createBaseVNode("br"),
								createTextVNode("124.221.230.112")
							])]),
							createBaseVNode("div", { class: "deploy-arrow" }, "⟷"),
							createBaseVNode("div", { class: "deploy-node" }, [createBaseVNode("div", { class: "deploy-node-title" }, "provider"), createBaseVNode("div", { class: "deploy-node-desc" }, [
								createTextVNode("部署到目标内网"),
								createBaseVNode("br"),
								createTextVNode("192.168.200.18")
							])])
						])], -1)),
						createBaseVNode("div", _hoisted_24, [
							_cache[13] || (_cache[13] = createBaseVNode("div", { class: "deploy-title" }, "启动命令", -1)),
							createBaseVNode("div", _hoisted_25, [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "cmd-label" }, "server（guacd 服务器）", -1)), createBaseVNode("code", _hoisted_26, toDisplayString(sipCmds.value.server), 1)]),
							createBaseVNode("div", _hoisted_27, [_cache[11] || (_cache[11] = createBaseVNode("div", { class: "cmd-label" }, "visit（guacd 服务器）", -1)), createBaseVNode("code", _hoisted_28, toDisplayString(sipCmds.value.visit), 1)]),
							createBaseVNode("div", _hoisted_29, [_cache[12] || (_cache[12] = createBaseVNode("div", { class: "cmd-label" }, "provider（目标内网机器）", -1)), createBaseVNode("code", _hoisted_30, toDisplayString(sipCmds.value.provider), 1)])
						])
					])]),
					_: 1
				})]),
				_: 1
			}, 8, ["loading"])]);
		};
	}
}), [["__scopeId", "data-v-c0be738e"]]);
//#endregion
export { SystemConfigView_default as default };
