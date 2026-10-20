import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { At as promotion_default, I as delete_default, an as user_default, h as chat_dot_round_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { n as ElCollapseItem, t as ElCollapse } from "./collapse-DI7bDyZw.js";
import { t as ElEmpty } from "./empty-C7c8XFvh.js";
import { in as http } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReCardTextarea_default } from "./ReCardTextarea-BqLOQMc3.js";
//#region ../../packages/ui/src/components/ReRagChat/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-rag-chat" };
var _hoisted_2 = { class: "re-rag-chat__message-avatar" };
var _hoisted_3 = { class: "re-rag-chat__message-body" };
var _hoisted_4 = ["innerHTML"];
var _hoisted_5 = {
	key: 0,
	class: "re-rag-chat__sources"
};
var _hoisted_6 = { class: "re-rag-chat__source-score" };
var _hoisted_7 = { class: "re-rag-chat__source-content" };
var _hoisted_8 = {
	key: 0,
	class: "re-rag-chat__message is-assistant"
};
var _hoisted_9 = { class: "re-rag-chat__message-avatar" };
var _hoisted_10 = {
	key: 1,
	class: "re-rag-chat__empty"
};
var _hoisted_11 = { class: "re-rag-chat__input" };
var _hoisted_12 = { class: "re-rag-chat__input-options" };
var _hoisted_13 = { class: "re-rag-chat__input-row" };
//#endregion
//#region ../../packages/ui/src/components/ReRagChat/index.vue
var ReRagChat_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		baseUrl: {},
		libraryId: {},
		defaultTopK: { default: 5 },
		defaultThreshold: { default: .7 },
		headers: {},
		initialMessages: {}
	},
	emits: ["send", "receive"],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReRagChat —— RAG 问答组件
		*
		* 适配后端 RAG 接口 /v2/ai/rag/query
		*   <ReRagChat base-url="/v2/ai/rag" library-id="my-lib" />
		*/
		const props = __props;
		const emit = __emit;
		const messages = ref(props.initialMessages ?? []);
		const inputText = ref("");
		const isStreaming = ref(false);
		const messagesRef = ref(null);
		const topK = ref(String(props.defaultTopK));
		const threshold = ref(String(props.defaultThreshold));
		let messageIdCounter = 0;
		const generateId = () => `rag-${Date.now()}-${++messageIdCounter}`;
		const formatMessage = (text) => {
			return text.replace(/\n/g, "<br />");
		};
		const scrollToBottom = () => {
			requestAnimationFrame(() => {
				if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
			});
		};
		const handleSend = async () => {
			const query = inputText.value.trim();
			if (!query || isStreaming.value) return;
			const userMsg = {
				id: generateId(),
				role: "user",
				content: query,
				timestamp: Date.now()
			};
			messages.value.push(userMsg);
			inputText.value = "";
			scrollToBottom();
			emit("send", query);
			isStreaming.value = true;
			try {
				const { data } = await http().post(`${props.baseUrl}/query`).headers(props.headers ?? {}).data({
					query,
					topK: parseInt(topK.value) || props.defaultTopK,
					threshold: parseFloat(threshold.value) || props.defaultThreshold,
					libraryId: props.libraryId
				});
				if (data.code !== 200) throw new Error(data.message || "问答失败");
				const payload = data.data;
				const assistantMsg = {
					id: generateId(),
					role: "assistant",
					content: payload.answer,
					sources: payload.sources,
					timestamp: Date.now()
				};
				messages.value.push(assistantMsg);
				scrollToBottom();
				emit("receive", assistantMsg);
			} catch (e) {
				const errorMsg = {
					id: generateId(),
					role: "assistant",
					content: `问答失败: ${e.message}`,
					timestamp: Date.now()
				};
				messages.value.push(errorMsg);
				scrollToBottom();
			} finally {
				isStreaming.value = false;
			}
		};
		const handleClear = () => {
			messages.value = [];
		};
		__expose({
			clear: handleClear,
			send: handleSend
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", {
				class: "re-rag-chat__messages",
				ref_key: "messagesRef",
				ref: messagesRef
			}, [
				(openBlock(true), createElementBlock(Fragment, null, renderList(messages.value, (msg) => {
					return openBlock(), createElementBlock("div", {
						key: msg.id,
						class: normalizeClass(["re-rag-chat__message", [`is-${msg.role}`]])
					}, [createBaseVNode("div", _hoisted_2, [msg.role === "assistant" ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
						default: withCtx(() => [createVNode(unref(chat_dot_round_default))]),
						_: 1
					})) : (openBlock(), createBlock(unref(ElIcon), { key: 1 }, {
						default: withCtx(() => [createVNode(unref(user_default))]),
						_: 1
					}))]), createBaseVNode("div", _hoisted_3, [createBaseVNode("div", {
						class: "re-rag-chat__message-content",
						innerHTML: formatMessage(msg.content)
					}, null, 8, _hoisted_4), msg.sources && msg.sources.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_5, [createVNode(unref(ElCollapse), null, {
						default: withCtx(() => [createVNode(unref(ElCollapseItem), {
							title: `引用 ${msg.sources.length} 个来源`,
							name: "sources"
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(msg.sources, (src, i) => {
								return openBlock(), createElementBlock("div", {
									key: i,
									class: "re-rag-chat__source"
								}, [createBaseVNode("div", _hoisted_6, toDisplayString((src.score * 100).toFixed(0)) + "% ", 1), createBaseVNode("div", _hoisted_7, toDisplayString(src.content), 1)]);
							}), 128))]),
							_: 2
						}, 1032, ["title"])]),
						_: 2
					}, 1024)])) : createCommentVNode("", true)])], 2);
				}), 128)),
				isStreaming.value ? (openBlock(), createElementBlock("div", _hoisted_8, [createBaseVNode("div", _hoisted_9, [createVNode(unref(ElIcon), null, {
					default: withCtx(() => [createVNode(unref(chat_dot_round_default))]),
					_: 1
				})]), _cache[3] || (_cache[3] = createBaseVNode("div", { class: "re-rag-chat__message-body" }, [createBaseVNode("div", { class: "re-rag-chat__typing" }, [
					createBaseVNode("span"),
					createBaseVNode("span"),
					createBaseVNode("span")
				])], -1))])) : createCommentVNode("", true),
				!messages.value.length && !isStreaming.value ? (openBlock(), createElementBlock("div", _hoisted_10, [createVNode(unref(ElEmpty), { description: "请输入问题，我将基于知识库回答" })])) : createCommentVNode("", true)
			], 512), createBaseVNode("div", _hoisted_11, [createBaseVNode("div", _hoisted_12, [
				createVNode(unref(ElInput), {
					modelValue: topK.value,
					"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => topK.value = $event),
					type: "number",
					style: { "width": "80px" },
					placeholder: "TopK"
				}, null, 8, ["modelValue"]),
				createVNode(unref(ElInput), {
					modelValue: threshold.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => threshold.value = $event),
					type: "number",
					style: { "width": "100px" },
					placeholder: "阈值",
					step: "0.05"
				}, null, 8, ["modelValue"]),
				createVNode(unref(ElButton), {
					disabled: !__props.libraryId,
					onClick: handleClear
				}, {
					default: withCtx(() => [createVNode(unref(ElIcon), null, {
						default: withCtx(() => [createVNode(unref(delete_default))]),
						_: 1
					}), _cache[4] || (_cache[4] = createTextVNode(" 清空 ", -1))]),
					_: 1
				}, 8, ["disabled"])
			]), createBaseVNode("div", _hoisted_13, [createVNode(ReCardTextarea_default, {
				modelValue: inputText.value,
				"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => inputText.value = $event),
				placeholder: "输入问题...",
				rows: 2,
				"submit-on-keydown": true,
				onSubmit: handleSend
			}, null, 8, ["modelValue"]), createVNode(unref(ElButton), {
				type: "primary",
				loading: isStreaming.value,
				disabled: !inputText.value.trim() || isStreaming.value,
				onClick: handleSend
			}, {
				default: withCtx(() => [createVNode(unref(ElIcon), null, {
					default: withCtx(() => [createVNode(unref(promotion_default))]),
					_: 1
				}), _cache[5] || (_cache[5] = createTextVNode(" 发送 ", -1))]),
				_: 1
			}, 8, ["loading", "disabled"])])])]);
		};
	}
}), [["__scopeId", "data-v-34764d73"]]);
//#endregion
//#region ../../packages/ui/src/components/ReRagChat/index.ts
var plugin = { install(app) {
	app.component("ReRagChat", ReRagChat_default$1);
} };
var ReRagChat_default = ReRagChat_default$1;
//#endregion
export { ReRagChat_default as default, plugin as install };
