import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { Tt as picture_filled_default, U as download_default, ct as lightning_default, dt as loading_default, pn as warning_filled_default, pt as magic_stick_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElTag } from "./tag-CqzZCxmq.js";
import { n as ElRadioButton, r as ElRadioGroup } from "./radio-DoZnxNaS.js";
import { in as http, yt as message } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReImageGen/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "wan-image-gen" };
var _hoisted_2 = { class: "wan-image-gen__history" };
var _hoisted_3 = { class: "wan-image-gen__history-head" };
var _hoisted_4 = { class: "wan-image-gen__history-body" };
var _hoisted_5 = {
	key: 0,
	class: "wan-image-gen__history-empty"
};
var _hoisted_6 = ["onClick"];
var _hoisted_7 = { class: "wan-image-gen__history-thumb" };
var _hoisted_8 = ["src"];
var _hoisted_9 = {
	key: 1,
	class: "wan-image-gen__thumb-loading"
};
var _hoisted_10 = {
	key: 2,
	class: "wan-image-gen__thumb-failed"
};
var _hoisted_11 = { class: "wan-image-gen__history-info" };
var _hoisted_12 = { class: "wan-image-gen__history-prompt" };
var _hoisted_13 = { class: "wan-image-gen__history-time" };
var _hoisted_14 = { class: "wan-image-gen__canvas" };
var _hoisted_15 = {
	key: 0,
	class: "wan-image-gen__canvas-empty"
};
var _hoisted_16 = {
	key: 1,
	class: "wan-image-gen__canvas-processing"
};
var _hoisted_17 = { class: "wan-image-gen__processing-art" };
var _hoisted_18 = { class: "wan-image-gen__processing-sub" };
var _hoisted_19 = {
	key: 2,
	class: "wan-image-gen__canvas-failed"
};
var _hoisted_20 = { class: "wan-image-gen__failed-sub" };
var _hoisted_21 = {
	key: 3,
	class: "wan-image-gen__canvas-result"
};
var _hoisted_22 = ["src"];
var _hoisted_23 = { class: "wan-image-gen__result-actions" };
var _hoisted_24 = { class: "wan-image-gen__panel" };
var _hoisted_25 = { class: "wan-image-gen__param-group" };
var _hoisted_26 = { class: "wan-image-gen__param-group" };
var _hoisted_27 = { class: "wan-image-gen__ratio-grid" };
var _hoisted_28 = ["onClick"];
var _hoisted_29 = { class: "wan-image-gen__ratio-name" };
var _hoisted_30 = { class: "wan-image-gen__param-group" };
var _hoisted_31 = { class: "wan-image-gen__composer" };
var _hoisted_32 = { class: "wan-image-gen__composer-input" };
var _hoisted_33 = { class: "wan-image-gen__composer-footer" };
var _hoisted_34 = { class: "wan-image-gen__composer-tip" };
//#endregion
//#region ../../packages/ui/src/components/ReImageGen/index.vue
var ReImageGen_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		baseUrl: { default: "/v2/generate" },
		headers: {}
	},
	setup(__props) {
		/**
		* ReImageGen —— 文生图组件（万相风格）
		*
		* 交互模型（异步任务）：
		*   1. 提交 POST /v2/generate/task/image → 返回 taskId
		*   2. 轮询 GET /v2/generate/task/{taskId} → PROCESSING / SUCCESS / FAILED
		*   3. 历史记录 GET /v2/generate/task/list?type=image
		*/
		const props = __props;
		/** 生成任务（与后端 GenerateTask 对齐） */
		const prompt = ref("");
		const model = ref("dall-e-3");
		const size = ref("1024x1024");
		const count = ref(1);
		const generating = ref(false);
		const historyLoading = ref(false);
		const modelOptions = [
			{
				value: "dall-e-3",
				label: "DALL-E 3"
			},
			{
				value: "dall-e-2",
				label: "DALL-E 2"
			},
			{
				value: "stable-diffusion",
				label: "Stable Diffusion"
			}
		];
		const ratioOptions = [
			{
				value: "1024x1024",
				label: "1:1",
				shapeStyle: {
					width: "18px",
					height: "18px"
				}
			},
			{
				value: "1024x768",
				label: "4:3",
				shapeStyle: {
					width: "20px",
					height: "15px"
				}
			},
			{
				value: "768x1024",
				label: "3:4",
				shapeStyle: {
					width: "15px",
					height: "20px"
				}
			},
			{
				value: "1280x720",
				label: "16:9",
				shapeStyle: {
					width: "22px",
					height: "12px"
				}
			}
		];
		const history = ref([]);
		const activeTask = ref(null);
		const timers = /* @__PURE__ */ new Map();
		/** 后端 ReturnResult 成功判定 */
		const isSuccess = (data) => {
			if (data.success === true || data.ok === true) return true;
			if (data.code === void 0) return true;
			const code = String(data.code);
			return code === "00000" || code === "200" || code === "0";
		};
		const statusLabel = (s) => s === "SUCCESS" ? "完成" : s === "FAILED" ? "失败" : "生成中";
		const statusTagType = (s) => s === "SUCCESS" ? "success" : s === "FAILED" ? "danger" : "info";
		function formatTime(t) {
			if (!t) return "";
			return new Date(t).toLocaleString("zh-CN", {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		/** 加载历史记录 */
		async function loadHistory() {
			historyLoading.value = true;
			try {
				const { data } = await http().get(`${props.baseUrl}/task/list`).headers({
					Accept: "application/json",
					...props.headers ?? {}
				}).query({ type: "image" });
				if (!isSuccess(data)) throw new Error(data.message || data.msg || "历史记录加载失败");
				const list = data.data ?? [];
				history.value = list;
				if (list.length > 0 && !activeTask.value) activeTask.value = list[0];
				list.forEach((t) => {
					if (t.status === "PROCESSING") startPolling(t.taskId);
				});
			} catch (e) {
				message.error(e.message);
			} finally {
				historyLoading.value = false;
			}
		}
		/** 提交生成任务 */
		async function handleGenerate() {
			const text = prompt.value.trim();
			if (!text || generating.value) return;
			generating.value = true;
			try {
				const jobs = [];
				for (let i = 0; i < count.value; i++) jobs.push(submitOne(text));
				await Promise.all(jobs);
				await loadHistory();
			} catch (e) {
				message.error(e.message);
			} finally {
				generating.value = false;
			}
		}
		/** 提交单个任务，返回任务对象 */
		async function submitOne(text) {
			const { data } = await http().post(`${props.baseUrl}/task/image`).headers(props.headers ?? {}).data({
				prompt: text,
				model: model.value,
				size: size.value
			});
			if (!isSuccess(data)) throw new Error(data.message || data.msg || "生成失败");
			const task = data.data;
			upsertTask(task);
			if (!activeTask.value) activeTask.value = task;
			startPolling(task.taskId);
			return task;
		}
		/** 启动轮询 */
		function startPolling(taskId) {
			if (timers.has(taskId)) return;
			const timer = window.setInterval(async () => {
				try {
					const { data } = await http().get(`${props.baseUrl}/task/${taskId}`).headers(props.headers ?? {});
					if (!isSuccess(data)) throw new Error(data.message || data.msg || "查询失败");
					const task = data.data;
					upsertTask(task);
					if (task.status !== "PROCESSING") stopPolling(taskId);
				} catch {
					stopPolling(taskId);
				}
			}, 2e3);
			timers.set(taskId, timer);
		}
		function stopPolling(taskId) {
			const timer = timers.get(taskId);
			if (timer) {
				window.clearInterval(timer);
				timers.delete(taskId);
			}
		}
		/** 更新本地任务快照 */
		function upsertTask(task) {
			const idx = history.value.findIndex((t) => t.taskId === task.taskId);
			if (idx >= 0) history.value[idx] = task;
			else history.value.unshift(task);
			if (activeTask.value?.taskId === task.taskId) activeTask.value = task;
		}
		/** 选中历史任务 */
		function selectTask(task) {
			activeTask.value = task;
			if (task.status === "PROCESSING") startPolling(task.taskId);
		}
		/** 失败重试 */
		function retry(task) {
			prompt.value = task.prompt;
			if (task.model) model.value = task.model;
			handleGenerate();
		}
		/** 复用提示词再次生成 */
		function reusePrompt(task) {
			prompt.value = task.prompt;
			if (task.model) model.value = task.model;
		}
		/** 下载结果 */
		function download(url) {
			const a = document.createElement("a");
			a.href = url;
			a.download = `generated-image-${Date.now()}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
		/** Ctrl + Enter 快速生成 */
		function onComposerKeydown(e) {
			if (!(e instanceof KeyboardEvent)) return;
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				handleGenerate();
			}
		}
		loadHistory();
		onBeforeUnmount(() => {
			timers.forEach((t) => window.clearInterval(t));
			timers.clear();
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [
				createBaseVNode("aside", _hoisted_2, [createBaseVNode("div", _hoisted_3, [_cache[7] || (_cache[7] = createBaseVNode("span", { class: "wan-image-gen__history-title" }, "创作历史", -1)), createVNode(unref(ElButton), {
					text: "",
					loading: historyLoading.value,
					onClick: loadHistory
				}, {
					default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode(" 刷新 ", -1)])]),
					_: 1
				}, 8, ["loading"])]), createBaseVNode("div", _hoisted_4, [history.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_5, " 暂无创作记录 ")) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(history.value, (item) => {
					return openBlock(), createElementBlock("div", {
						key: item.taskId,
						class: normalizeClass(["wan-image-gen__history-item", { "is-active": activeTask.value?.taskId === item.taskId }]),
						onClick: ($event) => selectTask(item)
					}, [createBaseVNode("div", _hoisted_7, [item.status === "SUCCESS" && item.resultUrl ? (openBlock(), createElementBlock("img", {
						key: 0,
						src: item.resultUrl,
						alt: ""
					}, null, 8, _hoisted_8)) : item.status === "PROCESSING" ? (openBlock(), createElementBlock("div", _hoisted_9, [createVNode(unref(ElIcon), { class: "is-loading" }, {
						default: withCtx(() => [createVNode(unref(loading_default))]),
						_: 1
					})])) : (openBlock(), createElementBlock("div", _hoisted_10, [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(picture_filled_default))]),
						_: 1
					})])), createVNode(unref(ElTag), {
						type: statusTagType(item.status),
						class: "wan-image-gen__history-status"
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(statusLabel(item.status)), 1)]),
						_: 2
					}, 1032, ["type"])]), createBaseVNode("div", _hoisted_11, [createBaseVNode("div", _hoisted_12, toDisplayString(item.prompt), 1), createBaseVNode("div", _hoisted_13, toDisplayString(formatTime(item.completeTime || item.createTime)), 1)])], 10, _hoisted_6);
				}), 128))])]),
				createBaseVNode("main", _hoisted_14, [!activeTask.value ? (openBlock(), createElementBlock("div", _hoisted_15, [
					createVNode(unref(ElIcon), { class: "wan-image-gen__empty-icon" }, {
						default: withCtx(() => [createVNode(unref(magic_stick_default))]),
						_: 1
					}),
					_cache[8] || (_cache[8] = createBaseVNode("p", { class: "wan-image-gen__empty-title" }, "用一句话描述你想要的画面", -1)),
					_cache[9] || (_cache[9] = createBaseVNode("p", { class: "wan-image-gen__empty-sub" }, "输入提示词并点击生成，AI 将为你绘制图片", -1))
				])) : activeTask.value.status === "PROCESSING" ? (openBlock(), createElementBlock("div", _hoisted_16, [
					createBaseVNode("div", _hoisted_17, [_cache[10] || (_cache[10] = createBaseVNode("div", { class: "wan-image-gen__processing-pulse" }, null, -1)), createVNode(unref(ElIcon), { class: "is-loading wan-image-gen__processing-icon" }, {
						default: withCtx(() => [createVNode(unref(loading_default))]),
						_: 1
					})]),
					_cache[11] || (_cache[11] = createBaseVNode("p", { class: "wan-image-gen__processing-title" }, "正在生成图片…", -1)),
					createBaseVNode("p", _hoisted_18, toDisplayString(activeTask.value.prompt), 1)
				])) : activeTask.value.status === "FAILED" ? (openBlock(), createElementBlock("div", _hoisted_19, [
					createVNode(unref(ElIcon), { class: "wan-image-gen__failed-icon" }, {
						default: withCtx(() => [createVNode(unref(warning_filled_default))]),
						_: 1
					}),
					_cache[13] || (_cache[13] = createBaseVNode("p", { class: "wan-image-gen__failed-title" }, "生成失败", -1)),
					createBaseVNode("p", _hoisted_20, toDisplayString(activeTask.value.errorMessage), 1),
					createVNode(unref(ElButton), { onClick: _cache[0] || (_cache[0] = ($event) => retry(activeTask.value)) }, {
						default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("重试", -1)])]),
						_: 1
					})
				])) : activeTask.value.resultUrl ? (openBlock(), createElementBlock("div", _hoisted_21, [createBaseVNode("img", {
					src: activeTask.value.resultUrl,
					alt: "生成结果",
					class: "wan-image-gen__result-img"
				}, null, 8, _hoisted_22), createBaseVNode("div", _hoisted_23, [createVNode(unref(ElButton), { onClick: _cache[1] || (_cache[1] = ($event) => download(activeTask.value.resultUrl)) }, {
					default: withCtx(() => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(download_default))]),
						_: 1
					}), _cache[14] || (_cache[14] = createTextVNode(" 下载 ", -1))]),
					_: 1
				}), createVNode(unref(ElButton), { onClick: _cache[2] || (_cache[2] = ($event) => reusePrompt(activeTask.value)) }, {
					default: withCtx(() => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(magic_stick_default))]),
						_: 1
					}), _cache[15] || (_cache[15] = createTextVNode(" 再次生成 ", -1))]),
					_: 1
				})])])) : createCommentVNode("", true)]),
				createBaseVNode("aside", _hoisted_24, [
					createBaseVNode("div", _hoisted_25, [_cache[16] || (_cache[16] = createBaseVNode("div", { class: "wan-image-gen__param-label" }, "模型", -1)), createVNode(unref(ElSelect), {
						modelValue: model.value,
						"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => model.value = $event),
						placeholder: "选择模型",
						size: "large"
					}, {
						default: withCtx(() => [(openBlock(), createElementBlock(Fragment, null, renderList(modelOptions, (m) => {
							return createVNode(unref(ElOption), {
								key: m.value,
								value: m.value,
								label: m.label
							}, null, 8, ["value", "label"]);
						}), 64))]),
						_: 1
					}, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_26, [_cache[17] || (_cache[17] = createBaseVNode("div", { class: "wan-image-gen__param-label" }, "比例", -1)), createBaseVNode("div", _hoisted_27, [(openBlock(), createElementBlock(Fragment, null, renderList(ratioOptions, (r) => {
						return createBaseVNode("button", {
							key: r.value,
							type: "button",
							class: normalizeClass(["wan-image-gen__ratio-btn", { "is-active": size.value === r.value }]),
							onClick: ($event) => size.value = r.value
						}, [createBaseVNode("span", {
							class: "wan-image-gen__ratio-shape",
							style: normalizeStyle(r.shapeStyle)
						}, null, 4), createBaseVNode("span", _hoisted_29, toDisplayString(r.label), 1)], 10, _hoisted_28);
					}), 64))])]),
					createBaseVNode("div", _hoisted_30, [_cache[21] || (_cache[21] = createBaseVNode("div", { class: "wan-image-gen__param-label" }, "生成数量", -1)), createVNode(unref(ElRadioGroup), {
						modelValue: count.value,
						"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => count.value = $event)
					}, {
						default: withCtx(() => [
							createVNode(unref(ElRadioButton), { value: 1 }, {
								default: withCtx(() => [..._cache[18] || (_cache[18] = [createTextVNode("1 张", -1)])]),
								_: 1
							}),
							createVNode(unref(ElRadioButton), { value: 2 }, {
								default: withCtx(() => [..._cache[19] || (_cache[19] = [createTextVNode("2 张", -1)])]),
								_: 1
							}),
							createVNode(unref(ElRadioButton), { value: 4 }, {
								default: withCtx(() => [..._cache[20] || (_cache[20] = [createTextVNode("4 张", -1)])]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["modelValue"])]),
					createBaseVNode("div", _hoisted_31, [createBaseVNode("div", _hoisted_32, [createVNode(unref(ElInput), {
						modelValue: prompt.value,
						"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => prompt.value = $event),
						type: "textarea",
						rows: 4,
						maxlength: "500",
						"show-word-limit": "",
						resize: "none",
						placeholder: "描述你想要的画面，例如：一只柯基犬戴着宇航员头盔，漂浮在星空中",
						onKeydown: onComposerKeydown
					}, null, 8, ["modelValue"])]), createBaseVNode("div", _hoisted_33, [createBaseVNode("span", _hoisted_34, [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(lightning_default))]),
						_: 1
					}), _cache[22] || (_cache[22] = createTextVNode(" Ctrl + Enter 快速生成 ", -1))]), createVNode(unref(ElButton), {
						type: "primary",
						size: "large",
						loading: generating.value,
						disabled: !prompt.value.trim(),
						onClick: handleGenerate
					}, {
						default: withCtx(() => [!generating.value ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
							default: withCtx(() => [createVNode(unref(magic_stick_default))]),
							_: 1
						})) : createCommentVNode("", true), createTextVNode(" " + toDisplayString(generating.value ? "生成中" : "生成"), 1)]),
						_: 1
					}, 8, ["loading", "disabled"])])])
				])
			]);
		};
	}
}), [["__scopeId", "data-v-1c2315df"]]);
//#endregion
//#region ../../packages/ui/src/components/ReImageGen/index.ts
var plugin = { install(app) {
	app.component("ReImageGen", ReImageGen_default$1);
} };
var ReImageGen_default = ReImageGen_default$1;
//#endregion
export { ReImageGen_default as default, plugin as install };
