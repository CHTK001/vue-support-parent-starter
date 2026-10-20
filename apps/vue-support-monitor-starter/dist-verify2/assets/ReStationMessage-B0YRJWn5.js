import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { Nt as refresh_default, c as bell_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { Pn as getStationMessageAdapter, er as ElNotification, yt as message } from "./src-CEonioA3.js";
import { r as storeToRefs } from "./pinia-Dz8LpwBD.js";
import { r as messageStore } from "./src-CUe0zRl2.js";
import { a as useRouter } from "./vue-router-D43uXGPs.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReStationMessage/ReStationMessage.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-station-message-trigger-wrap" };
var _hoisted_2 = { class: "re-station-message-trigger hover:bg-[--el-header-icon-hover-bg-color] koi-icon w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-scale-i" };
var _hoisted_3 = { class: "re-station-message-panel" };
var _hoisted_4 = { class: "re-station-message-panel__header" };
var _hoisted_5 = { class: "re-station-message-panel__title" };
var _hoisted_6 = { class: "re-station-message-panel__actions" };
var _hoisted_7 = { class: "re-station-message-panel__body" };
var _hoisted_8 = {
	key: 0,
	class: "re-station-message-panel__empty"
};
var _hoisted_9 = { class: "empty-icon" };
var _hoisted_10 = {
	key: 0,
	class: "empty-hint"
};
var _hoisted_11 = {
	key: 1,
	class: "re-station-message-panel__list"
};
var _hoisted_12 = ["onClick", "onKeydown"];
var _hoisted_13 = { class: "re-station-message-item__row" };
var _hoisted_14 = { class: "re-station-message-item__subject" };
var _hoisted_15 = {
	key: 0,
	class: "unread-dot"
};
var _hoisted_16 = { class: "re-station-message-item__time" };
var _hoisted_17 = { class: "re-station-message-item__content" };
var _hoisted_18 = {
	key: 0,
	class: "re-station-message-panel__footer"
};
//#endregion
//#region ../../packages/ui/src/components/ReStationMessage/ReStationMessage.vue
var ReStationMessage_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "ReStationMessage",
	props: {
		title: { default: "站内消息" },
		width: { default: 340 }
	},
	setup(__props) {
		const messageStore$1 = messageStore();
		const { messages, unread, latest } = storeToRefs(messageStore$1);
		const loading = ref(false);
		const popoverVisible = ref(false);
		/** 标记是否已加载过历史（避免每次打开面板都重新请求） */
		const historyLoaded = ref(false);
		let initialized = false;
		watch(latest, (msg) => {
			if (!msg) return;
			if (!initialized) {
				initialized = true;
				return;
			}
			ElNotification({
				title: msg.subject || "站内消息",
				message: msg.content || "",
				type: "info",
				duration: 4e3
			});
		}, { deep: false });
		onMounted(() => {
			if (getStationMessageAdapter() && !messageStore$1.initialized) loadMessages();
		});
		/** 拉取历史 + 刷新未读 */
		async function loadMessages(force = false) {
			if (!getStationMessageAdapter()) return;
			if (!force && historyLoaded.value) return;
			loading.value = true;
			try {
				await Promise.all([messageStore$1.loadHistory(), messageStore$1.refreshUnread()]);
				historyLoaded.value = true;
			} finally {
				loading.value = false;
			}
		}
		/** 面板显示时：仅首次加载历史与未读（后续靠手动同步按钮 / Socket） */
		async function handleShow() {
			if (!getStationMessageAdapter()) return;
			await loadMessages();
		}
		/** 手动同步按钮：强制重新拉取历史与未读 */
		async function handleSync() {
			await loadMessages(true);
			message.success("已同步");
		}
		/** 全部已读 */
		async function handleMarkAllRead() {
			await messageStore$1.markAllRead();
			message.success("已全部标记为已读");
		}
		/** 判断消息是否未读：后端字段 readStatus（0 未读 / 1 已读），兼容 isRead */
		function isUnread(message) {
			const msg = message ?? {};
			if (typeof msg.readStatus === "number") return msg.readStatus !== 1;
			return msg.isRead !== true;
		}
		const router = useRouter();
		/** 点击消息项：标记该消息（及更早）已读；有跳转链接则路由跳转，否则弹出完整详情 */
		async function handleItemClick(msg) {
			if (msg.id !== void 0) await messageStore$1.markAllRead(msg.id);
			if (msg.url && msg.url.trim()) {
				popoverVisible.value = false;
				let target = msg.url.trim();
				if (/^https?:\/\//i.test(target)) {
					window.open(target, "_blank", "noopener");
					return;
				}
				if (target.startsWith("/system/")) target = target.slice(7);
				try {
					await router.push(target);
				} catch {}
				return;
			}
			popoverVisible.value = false;
			await ElMessageBox.alert(msg.content || "暂无内容", msg.subject || "站内消息", { confirmButtonText: "关闭" });
		}
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_badge = resolveComponent("el-badge");
			const _component_el_button = resolveComponent("el-button");
			const _component_el_popover = resolveComponent("el-popover");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createBlock(_component_el_popover, {
				visible: popoverVisible.value,
				"onUpdate:visible": _cache[0] || (_cache[0] = ($event) => popoverVisible.value = $event),
				ref: "popoverRef",
				placement: "bottom-end",
				width: __props.width,
				trigger: "click",
				"show-arrow": false,
				offset: 10,
				"popper-style": "border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); padding: 0;",
				onShow: handleShow
			}, {
				reference: withCtx(() => [createBaseVNode("div", _hoisted_1, [createVNode(_component_el_badge, {
					value: unref(unread),
					hidden: unref(unread) === 0,
					max: 99,
					class: "re-station-message-badge"
				}, {
					default: withCtx(() => [createBaseVNode("div", _hoisted_2, [createVNode(_component_el_icon, { size: 18 }, {
						default: withCtx(() => [createVNode(unref(bell_default))]),
						_: 1
					})])]),
					_: 1
				}, 8, ["value", "hidden"])])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_3, [
					createBaseVNode("div", _hoisted_4, [createBaseVNode("span", _hoisted_5, toDisplayString(__props.title), 1), createBaseVNode("div", _hoisted_6, [createVNode(_component_el_button, {
						link: "",
						type: "primary",
						loading: loading.value,
						onClick: handleSync
					}, {
						default: withCtx(() => [createVNode(_component_el_icon, { size: 14 }, {
							default: withCtx(() => [createVNode(unref(refresh_default))]),
							_: 1
						})]),
						_: 1
					}, 8, ["loading"]), unref(unread) > 0 ? (openBlock(), createBlock(_component_el_button, {
						key: 0,
						link: "",
						type: "primary",
						onClick: handleMarkAllRead
					}, {
						default: withCtx(() => [..._cache[1] || (_cache[1] = [createTextVNode(" 全部已读 ", -1)])]),
						_: 1
					})) : createCommentVNode("", true)])]),
					withDirectives((openBlock(), createElementBlock("div", _hoisted_7, [unref(messages).length === 0 ? (openBlock(), createElementBlock("div", _hoisted_8, [
						createBaseVNode("div", _hoisted_9, [createVNode(_component_el_icon, { size: 36 }, {
							default: withCtx(() => [createVNode(unref(bell_default))]),
							_: 1
						})]),
						_cache[2] || (_cache[2] = createBaseVNode("div", { class: "empty-text" }, "暂无站内消息", -1)),
						!loading.value ? (openBlock(), createElementBlock("div", _hoisted_10, "点击右上\"同步\"按钮拉取最新消息")) : createCommentVNode("", true)
					])) : (openBlock(), createElementBlock("div", _hoisted_11, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(messages), (msg, index) => {
						return openBlock(), createElementBlock("div", {
							key: index,
							class: normalizeClass(["re-station-message-item", { "re-station-message-item--unread": isUnread(msg) }]),
							role: "button",
							tabindex: "0",
							onClick: ($event) => handleItemClick(msg),
							onKeydown: withKeys(withModifiers(($event) => handleItemClick(msg), ["prevent"]), ["enter"])
						}, [createBaseVNode("div", _hoisted_13, [createBaseVNode("span", _hoisted_14, [isUnread(msg) ? (openBlock(), createElementBlock("span", _hoisted_15)) : createCommentVNode("", true), createTextVNode(" " + toDisplayString(msg.subject || "站内消息"), 1)]), createBaseVNode("span", _hoisted_16, toDisplayString(msg.sendTime), 1)]), createBaseVNode("div", _hoisted_17, toDisplayString(msg.content), 1)], 42, _hoisted_12);
					}), 128))]))])), [[_directive_loading, loading.value]]),
					unref(messages).length > 0 ? (openBlock(), createElementBlock("div", _hoisted_18, [createVNode(_component_el_button, {
						link: "",
						type: "primary",
						onClick: handleMarkAllRead
					}, {
						default: withCtx(() => [createTextVNode(toDisplayString(unref(unread) > 0 ? `${unref(unread)}条未读，标记全部已读` : "全部已读"), 1)]),
						_: 1
					})])) : createCommentVNode("", true)
				])]),
				_: 1
			}, 8, ["visible", "width"]);
		};
	}
}), [["__scopeId", "data-v-4e7048be"]]);
//#endregion
//#region ../../packages/ui/src/components/ReStationMessage/index.ts
var plugin = { install(app) {
	app.component("ReStationMessage", ReStationMessage_default$1);
} };
var ReStationMessage_default = ReStationMessage_default$1;
//#endregion
export { plugin as n, ReStationMessage_default as t };
