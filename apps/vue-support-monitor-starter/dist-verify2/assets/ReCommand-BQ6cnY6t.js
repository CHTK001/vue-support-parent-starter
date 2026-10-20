import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { yt as message } from "./src-CEonioA3.js";
import { w as unwrapResult, x as http } from "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { n as listTemplates, t as fillTemplate } from "./templates-CUjg7cUc.js";
//#region ../../packages/ui/src/components/ReCommand/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "rc-toolbar" };
var _hoisted_2 = { class: "rc-label" };
var _hoisted_3 = { class: "rc-tools" };
var _hoisted_4 = { class: "rc-tpl-pop" };
var _hoisted_5 = { class: "rc-tpl-head" };
var _hoisted_6 = {
	key: 0,
	class: "rc-tpl-sub"
};
var _hoisted_7 = {
	key: 1,
	class: "rc-tpl-list"
};
var _hoisted_8 = ["onClick"];
var _hoisted_9 = { class: "rc-tpl-name" };
var _hoisted_10 = { class: "rc-tpl-desc" };
var _hoisted_11 = { class: "rc-tok-pop" };
var _hoisted_12 = ["onClick"];
var _hoisted_13 = [
	"disabled",
	"placeholder",
	"rows",
	"value"
];
//#endregion
//#region ../../packages/ui/src/components/ReCommand/index.vue
var ReCommand_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		modelValue: { default: "" },
		os: { default: "linux" },
		projectType: { default: "" },
		scriptKind: { default: "start" },
		context: { default: () => ({}) },
		label: {},
		rows: { default: 5 },
		placeholder: { default: "请输入命令，或使用模板 / AI 生成" },
		ai: {
			type: Boolean,
			default: true
		},
		disabled: {
			type: Boolean,
			default: false
		},
		capability: { default: "chat" },
		noExpand: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const fallbackLabel = computed(() => os.value === "windows" ? "PowerShell 命令" : "bash 命令");
		const kindIcon = computed(() => ({
			start: "VideoPlay",
			stop: "VideoPause",
			restart: "RefreshRight",
			status: "Aim"
		})[props.scriptKind]);
		function onInput(e) {
			emit("update:modelValue", e.target.value);
		}
		function setValue(v) {
			emit("update:modelValue", v);
		}
		const expandOpen = ref(false);
		const taRef = ref(null);
		const TOKENS = [
			{
				t: "__JVMARGS__",
				d: "变量设置中的 JVM 参数（自动放在 -jar 之前）"
			},
			{
				t: "__ARGS__",
				d: "变量设置中的应用 / 命令参数"
			},
			{
				t: "__ENTRY__",
				d: "主入口名称（套用模板时替换）"
			},
			{
				t: "__PATH__",
				d: "项目路径（套用模板时替换）"
			},
			{
				t: "__LOG__",
				d: "日志文件路径（套用模板时替换）"
			},
			{
				t: "__APPNAME__",
				d: "项目 / 应用名称（套用模板时替换）"
			}
		];
		function insertToken(tk) {
			const ta = taRef.value;
			const s = props.modelValue || "";
			if (!ta) {
				setValue(s + tk);
				return;
			}
			const a = ta.selectionStart ?? s.length;
			const b = ta.selectionEnd ?? s.length;
			const next = s.slice(0, a) + tk + s.slice(b);
			emit("update:modelValue", next);
			nextTick(() => {
				ta.focus();
				const p = a + tk.length;
				ta.setSelectionRange(p, p);
			});
		}
		const tplOpen = ref(false);
		const tplList = computed(() => listTemplates(props.os, props.projectType));
		function applyTpl(t) {
			try {
				setValue(fillTemplate(t, {
					entry: props.context.entry,
					log: props.context.log,
					path: props.context.path,
					appName: props.context.appName
				})[props.scriptKind]);
				tplOpen.value = false;
				message.success("已套用内置模板");
			} catch (e) {
				message.error(e?.message || "模板生成失败");
			}
		}
		async function copy() {
			const text = props.modelValue || "";
			if (!text) {
				message.warning("暂无内容可复制");
				return;
			}
			try {
				await navigator.clipboard.writeText(text);
				message.success("已复制到剪贴板");
			} catch {
				message.error("复制失败");
			}
		}
		function clearCmd() {
			if (props.modelValue) setValue("");
		}
		const modelList = ref([]);
		const aiModel = ref("");
		async function loadModels() {
			if (!props.ai) return;
			try {
				const res = await http().get("/v2/command/models").query({ capability: props.capability });
				const list = unwrapResult(res) || [];
				modelList.value = list;
				if (!list.some((m) => (m.code || m.name) === aiModel.value)) aiModel.value = list.length ? list[0].code || list[0].name : "";
			} catch {
				modelList.value = [];
				aiModel.value = "";
			}
		}
		watch(() => props.capability, loadModels);
		const generating = ref(false);
		let client = null;
		const requirementText = computed(() => {
			const shell = os.value === "windows" ? "PowerShell" : "bash";
			const entry = props.context.entry ? `主入口「${props.context.entry}」` : "";
			const target = [entry, props.context.path ? `项目路径「${props.context.path}」` : ""].filter(Boolean).join("，");
			const suffix = target ? `，${target}` : "";
			switch (props.scriptKind) {
				case "start": return `请生成${shell}「启动」命令${suffix}：后台启动应用、日志重定向到日志文件、写入 pid，命令可重复执行。`;
				case "stop": return `请生成${shell}「停止」命令${entry ? `，针对${entry}` : ""}：优先根据 pid 文件停止，无 pid 时按进程名 / 命令行匹配停止，避免误杀其它进程。`;
				case "status": return `请生成${shell}「状态检测」命令${entry ? `，针对${entry}` : ""}：进程存在则输出 running，否则输出 stopped，只输出这一个词。`;
				default: return `请生成${shell}「重启」命令${suffix}：先优雅停止再启动，pid 与服务名保持一致。`;
			}
		});
		const os = computed(() => props.os);
		function finish() {
			client = null;
			generating.value = false;
		}
		function aiGenerate() {
			if (generating.value) {
				client?.close();
				finish();
				return;
			}
			if (!modelList.value.length) {
				message.warning("暂无可用模型，请先在 AI 设置中配置并启用模型");
				return;
			}
			generating.value = true;
			const payload = {
				os: props.os,
				projectType: props.projectType,
				mainEntry: props.context.entry || "",
				projectPath: props.context.path || "",
				logPath: props.context.log || "",
				appName: props.context.appName || "",
				model: aiModel.value,
				multi: false,
				requirement: requirementText.value
			};
			let acc = "";
			try {
				client = http().post("/v2/command/generate").data(payload).sse({
					reconnect: false,
					onMessage: (e) => {
						const ev = e.data;
						if (!ev || typeof ev !== "object") return;
						if (ev.type === "chunk" && ev.content) {
							acc += ev.content;
							setValue(acc);
						} else if (ev.type === "done") {
							if (ev.full) setValue(ev.full);
							finish();
							message.success("AI 已生成命令，请确认后使用");
						} else if (ev.type === "error") {
							message.error(ev.message || "生成失败");
							finish();
						}
					},
					onError: () => {
						message.error("AI 连接失败");
						finish();
					},
					onClose: () => finish()
				});
			} catch {
				message.error("AI 调用失败");
				finish();
			}
		}
		onBeforeUnmount(() => {
			client?.close();
		});
		loadModels();
		return (_ctx, _cache) => {
			const _component_ReIcon = resolveComponent("ReIcon");
			const _component_ReButton = resolveComponent("ReButton");
			const _component_ReEmpty = resolveComponent("ReEmpty");
			const _component_el_popover = resolveComponent("el-popover");
			const _component_ReOption = resolveComponent("ReOption");
			const _component_ReSelect = resolveComponent("ReSelect");
			const _component_ReCommand = resolveComponent("ReCommand");
			const _component_ReDialog = resolveComponent("ReDialog");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-command", { "is-disabled": __props.disabled }]) }, [
				createBaseVNode("div", _hoisted_1, [
					createBaseVNode("span", _hoisted_2, [createVNode(_component_ReIcon, {
						name: kindIcon.value,
						class: "rc-label-icon"
					}, null, 8, ["name"]), createTextVNode(" " + toDisplayString(__props.label || fallbackLabel.value), 1)]),
					_cache[6] || (_cache[6] = createBaseVNode("span", { class: "rc-spacer" }, null, -1)),
					createBaseVNode("div", _hoisted_3, [
						createVNode(_component_el_popover, {
							visible: tplOpen.value,
							"onUpdate:visible": _cache[0] || (_cache[0] = ($event) => tplOpen.value = $event),
							width: 330,
							placement: "bottom-end",
							trigger: "click"
						}, {
							reference: withCtx(() => [createVNode(_component_ReButton, {
								icon: "Files",
								layout: "square",
								title: "内置模板"
							})]),
							default: withCtx(() => [createBaseVNode("div", _hoisted_4, [createBaseVNode("div", _hoisted_5, [createTextVNode(" 内置模板 · " + toDisplayString(os.value === "windows" ? "PowerShell" : "bash") + " ", 1), !__props.projectType ? (openBlock(), createElementBlock("span", _hoisted_6, "未选类型，仅通用模板")) : createCommentVNode("", true)]), !tplList.value.length ? (openBlock(), createBlock(_component_ReEmpty, {
								key: 0,
								description: "当前条件暂无模板",
								"image-size": 56,
								style: { "padding": "20px 0" }
							})) : (openBlock(), createElementBlock("div", _hoisted_7, [(openBlock(true), createElementBlock(Fragment, null, renderList(tplList.value, (t) => {
								return openBlock(), createElementBlock("div", {
									key: t.id,
									class: "rc-tpl-item",
									onClick: ($event) => applyTpl(t)
								}, [createBaseVNode("div", _hoisted_9, toDisplayString(t.name), 1), createBaseVNode("div", _hoisted_10, toDisplayString(t.desc), 1)], 8, _hoisted_8);
							}), 128))]))])]),
							_: 1
						}, 8, ["visible"]),
						createVNode(_component_el_popover, {
							width: 350,
							placement: "bottom-end",
							trigger: "click"
						}, {
							reference: withCtx(() => [createVNode(_component_ReButton, {
								icon: "Histogram",
								layout: "square",
								title: "插入占位符 / 内置变量"
							})]),
							default: withCtx(() => [createBaseVNode("div", _hoisted_11, [_cache[5] || (_cache[5] = createBaseVNode("div", { class: "rc-tok-head" }, "占位符 · 点击插入到光标处", -1)), (openBlock(), createElementBlock(Fragment, null, renderList(TOKENS, (tk) => {
								return createBaseVNode("div", {
									key: tk.t,
									class: "rc-tok-item",
									onClick: ($event) => insertToken(tk.t)
								}, [createBaseVNode("code", null, toDisplayString(tk.t), 1), createBaseVNode("span", null, toDisplayString(tk.d), 1)], 8, _hoisted_12);
							}), 64))])]),
							_: 1
						}),
						__props.ai && modelList.value.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [createVNode(_component_ReSelect, {
							modelValue: aiModel.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => aiModel.value = $event),
							class: "rc-model",
							style: { width: "150px" },
							placeholder: "选择模型"
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(modelList.value, (m) => {
								return openBlock(), createBlock(_component_ReOption, {
									key: m.id,
									label: m.name,
									value: m.code || m.name
								}, null, 8, ["label", "value"]);
							}), 128))]),
							_: 1
						}, 8, ["modelValue"]), createVNode(_component_ReButton, {
							icon: generating.value ? "Loading" : "ChatDotSquare",
							loading: generating.value,
							layout: "square",
							title: generating.value ? "停止生成" : "AI 生成",
							onClick: aiGenerate
						}, null, 8, [
							"icon",
							"loading",
							"title"
						])], 64)) : createCommentVNode("", true),
						createVNode(_component_ReButton, {
							icon: "CopyDocument",
							layout: "square",
							title: "复制",
							onClick: copy
						}),
						createVNode(_component_ReButton, {
							icon: "Delete",
							layout: "square",
							title: "清空",
							onClick: clearCmd
						}),
						!__props.noExpand ? (openBlock(), createBlock(_component_ReButton, {
							key: 1,
							icon: "FullScreen",
							layout: "square",
							title: "放大编辑",
							onClick: _cache[2] || (_cache[2] = ($event) => expandOpen.value = true)
						})) : createCommentVNode("", true)
					])
				]),
				createBaseVNode("textarea", {
					ref_key: "taRef",
					ref: taRef,
					class: "rc-editor",
					disabled: __props.disabled,
					placeholder: __props.placeholder,
					rows: __props.rows,
					spellcheck: "false",
					value: __props.modelValue,
					onInput
				}, null, 40, _hoisted_13),
				!__props.noExpand ? (openBlock(), createBlock(_component_ReDialog, {
					key: 0,
					modelValue: expandOpen.value,
					"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => expandOpen.value = $event),
					title: __props.label || fallbackLabel.value,
					width: "92%",
					"append-to-body": "",
					"close-on-click-modal": false
				}, {
					default: withCtx(() => [createVNode(_component_ReCommand, {
						"model-value": __props.modelValue,
						os: os.value,
						"project-type": __props.projectType,
						"script-kind": __props.scriptKind,
						context: __props.context,
						label: __props.label,
						rows: 18,
						ai: __props.ai,
						capability: __props.capability,
						"no-expand": "",
						"onUpdate:modelValue": _cache[3] || (_cache[3] = (v) => emit("update:modelValue", v))
					}, null, 8, [
						"model-value",
						"os",
						"project-type",
						"script-kind",
						"context",
						"label",
						"ai",
						"capability"
					])]),
					_: 1
				}, 8, ["modelValue", "title"])) : createCommentVNode("", true)
			], 2);
		};
	}
}), [["__scopeId", "data-v-cedd9c0b"]]);
//#endregion
//#region ../../packages/ui/src/components/ReCommand/index.ts
var plugin = { install(app) {
	app.component("ReCommand", ReCommand_default$1);
} };
var ReCommand_default = ReCommand_default$1;
//#endregion
export { ReCommand_default as default, plugin as install };
