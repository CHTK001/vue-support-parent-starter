import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Et as plus_default, n as alarm_clock_default, w as close_default } from "./dist-DogtK295.js";
import { er as ElNotification, yt as message } from "./src-CEonioA3.js";
import "./src-DDwlSqPX.js";
import { t as IndexedDBStore } from "./indexeddb-8Dvu0tZo.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
import { r as messageStore } from "./src-CUe0zRl2.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/AlarmWidget.vue?vue&type=script&setup=true&name=AlarmWidget&lang.ts
var _hoisted_1 = { class: "aw" };
var _hoisted_2 = {
	key: 0,
	class: "aw__header"
};
var _hoisted_3 = { class: "aw__title" };
var _hoisted_4 = { class: "aw__body" };
var _hoisted_5 = {
	key: 0,
	class: "aw__empty"
};
var _hoisted_6 = {
	key: 1,
	class: "aw__list"
};
var _hoisted_7 = { class: "aw__item-main" };
var _hoisted_8 = { class: "aw__item-top" };
var _hoisted_9 = { class: "aw__item-title" };
var _hoisted_10 = { class: "aw__item-badge" };
var _hoisted_11 = { class: "aw__item-countdown" };
var _hoisted_12 = { class: "aw__item-actions" };
var _hoisted_13 = [
	"title",
	"aria-label",
	"onClick"
];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/AlarmWidget.vue
var AlarmWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "AlarmWidget",
	props: { widget: {} },
	setup(__props) {
		const authStore$1 = authStore();
		const messageStore$1 = messageStore();
		const userId = computed(() => String(authStore$1.loginUser?.userId ?? authStore$1.loginUser?.id ?? "anonymous"));
		const store = new IndexedDBStore({
			dbName: `koi-home-alarm-${userId.value}`,
			storeName: "alarms",
			keyPath: "id",
			version: 1
		});
		const alarms = ref([]);
		const loading = ref(true);
		const dialogVisible = ref(false);
		const editingId = ref(null);
		const form = reactive({
			title: "",
			time: /* @__PURE__ */ new Date(),
			repeat: "daily",
			repeatCount: 1
		});
		const tick = ref(0);
		let tickTimer = null;
		let worker = null;
		function pad(n) {
			return n < 10 ? "0" + n : String(n);
		}
		function repeatLabel(r) {
			if (r === "daily") return "每天";
			if (r === "weekday") return "工作日";
			return "单次";
		}
		function countdownText(a) {
			if (a.repeat === "once" && a.fired) return "已响铃";
			const now = /* @__PURE__ */ new Date();
			const target = /* @__PURE__ */ new Date();
			target.setHours(a.hour, a.minute, 0, 0);
			if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
			const diff = target.getTime() - now.getTime();
			const h = Math.floor(diff / 36e5);
			const m = Math.floor(diff % 36e5 / 6e4);
			if (h > 0) return "还剩 " + h + " 小时 " + m + " 分钟";
			if (m > 0) return "还剩 " + m + " 分钟";
			return "即将响铃";
		}
		function createWorker() {
			if (worker) return;
			worker = new Worker(new URL(
				/* @vite-ignore */
				"/assets/alarm.worker-C8qAqH16.js",
				"" + import.meta.url
			));
			worker.onmessage = (e) => {
				const msg = e.data;
				if (msg.type === "fire") {
					const content = (msg.title || "闹钟提醒") + " - " + pad(msg.hour) + ":" + pad(msg.minute);
					messageStore$1.push({
						subject: "闹钟提醒",
						content,
						module: "message",
						event: "push",
						sendTime: (/* @__PURE__ */ new Date()).toISOString()
					});
					ElNotification({
						title: "闹钟提醒",
						message: content,
						type: "success",
						duration: 6e3
					});
					if (msg.firedCount != null) {
						const a = alarms.value.find((x) => x.id === msg.id);
						if (a) {
							a.firedCount = msg.firedCount;
							store.put(a).catch(() => void 0);
						}
					}
				} else if (msg.type === "delete") {
					const idx = alarms.value.findIndex((x) => x.id === msg.id);
					if (idx >= 0) alarms.value.splice(idx, 1);
					store.remove(msg.id).catch(() => void 0);
					message.info("闹钟已响铃完毕");
				} else if (msg.type === "disable") {
					const a = alarms.value.find((x) => x.id === msg.id);
					if (a) {
						a.enabled = false;
						if (msg.firedCount != null) a.firedCount = msg.firedCount;
						store.put(a).catch(() => void 0);
						message.info("闹钟已达次数上限，已停用");
					}
				}
			};
		}
		function syncWorker() {
			worker?.postMessage({
				type: "sync",
				list: alarms.value.map((a) => ({ ...a }))
			});
		}
		async function load() {
			loading.value = true;
			try {
				alarms.value = await store.getAll();
				syncWorker();
			} catch (e) {
				console.warn("[alarm] load failed", e);
			} finally {
				loading.value = false;
			}
		}
		async function toggle(id, val) {
			const a = alarms.value.find((x) => x.id === id);
			if (!a) return;
			a.enabled = val;
			await store.put(a);
			syncWorker();
		}
		async function remove(id) {
			alarms.value = alarms.value.filter((x) => x.id !== id);
			await store.remove(id);
			syncWorker();
		}
		function openAdd() {
			editingId.value = null;
			form.title = "";
			form.time = /* @__PURE__ */ new Date();
			form.time.setHours(9, 0, 0, 0);
			form.repeat = "daily";
			form.repeatCount = 1;
			dialogVisible.value = true;
		}
		async function save() {
			const title = form.title.trim();
			if (!title) {
				message.warning("请输入闹钟标题");
				return;
			}
			const hour = form.time.getHours();
			const minute = form.time.getMinutes();
			const now = Date.now();
			const alarm = {
				id: editingId.value ?? `alarm_${now}_${Math.random().toString(36).slice(2, 6)}`,
				title,
				hour,
				minute,
				repeat: form.repeat,
				repeatCount: form.repeatCount,
				enabled: true,
				fired: false
			};
			await store.put(alarm);
			if (editingId.value) {
				const idx = alarms.value.findIndex((x) => x.id === editingId.value);
				if (idx >= 0) alarms.value[idx] = alarm;
			} else alarms.value.push(alarm);
			syncWorker();
			dialogVisible.value = false;
			message.success("已保存");
		}
		onMounted(async () => {
			createWorker();
			await load();
			worker?.postMessage({ type: "start" });
			tickTimer = setInterval(() => {
				tick.value = Date.now();
			}, 1e3);
		});
		onBeforeUnmount(() => {
			worker?.postMessage({ type: "stop" });
			worker?.terminate();
			worker = null;
			if (tickTimer) clearInterval(tickTimer);
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_switch = resolveComponent("el-switch");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_time_picker = resolveComponent("el-time-picker");
			const _component_el_radio = resolveComponent("el-radio");
			const _component_el_radio_group = resolveComponent("el-radio-group");
			const _component_el_option = resolveComponent("el-option");
			const _component_el_select = resolveComponent("el-select");
			const _component_el_form = resolveComponent("el-form");
			const _component_el_button = resolveComponent("el-button");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { class: "aw__title-icon" }, {
					default: withCtx(() => [createVNode(unref(alarm_clock_default))]),
					_: 1
				}), createBaseVNode("span", null, toDisplayString(__props.widget.title), 1)]), createBaseVNode("button", {
					type: "button",
					class: "aw__add",
					title: "添加闹钟",
					"aria-label": "添加闹钟",
					onClick: openAdd
				}, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(plus_default))]),
					_: 1
				})])])) : createCommentVNode("", true),
				withDirectives((openBlock(), createElementBlock("div", _hoisted_4, [!alarms.value.length && !loading.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
					createVNode(_component_el_icon, { size: 28 }, {
						default: withCtx(() => [createVNode(unref(alarm_clock_default))]),
						_: 1
					}),
					_cache[7] || (_cache[7] = createBaseVNode("span", null, "暂无闹钟", -1)),
					createBaseVNode("button", {
						type: "button",
						class: "aw__empty-btn",
						onClick: openAdd
					}, "添加一个")
				])) : (openBlock(), createElementBlock("div", _hoisted_6, [(openBlock(true), createElementBlock(Fragment, null, renderList(alarms.value, (a) => {
					return openBlock(), createElementBlock("div", {
						key: a.id,
						class: normalizeClass(["aw__item", { "aw__item--off": !a.enabled }])
					}, [
						createBaseVNode("div", { class: normalizeClass(["aw__item-time", { "aw__item-time--off": !a.enabled }]) }, toDisplayString(pad(a.hour)) + ":" + toDisplayString(pad(a.minute)), 3),
						createBaseVNode("div", _hoisted_7, [createBaseVNode("div", _hoisted_8, [createBaseVNode("span", _hoisted_9, toDisplayString(a.title), 1), createBaseVNode("span", _hoisted_10, toDisplayString(repeatLabel(a.repeat)), 1)]), createBaseVNode("div", _hoisted_11, toDisplayString(a.enabled ? countdownText(a) : "已停用"), 1)]),
						createBaseVNode("div", _hoisted_12, [createVNode(_component_el_switch, {
							"model-value": a.enabled,
							onChange: ($event) => toggle(a.id, $event === true)
						}, null, 8, ["model-value", "onChange"]), createBaseVNode("button", {
							type: "button",
							class: "aw__item-del",
							title: `删除闹钟 ${a.title}`,
							"aria-label": `删除闹钟 ${a.title}`,
							onClick: ($event) => remove(a.id)
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(close_default))]),
							_: 1
						})], 8, _hoisted_13)])
					], 2);
				}), 128))]))])), [[_directive_loading, loading.value]]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => dialogVisible.value = $event),
					title: editingId.value ? "编辑闹钟" : "添加闹钟",
					width: "400px",
					"close-on-click-modal": false,
					"append-to-body": "",
					onClose: _cache[6] || (_cache[6] = ($event) => dialogVisible.value = false)
				}, {
					footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[4] || (_cache[4] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[11] || (_cache[11] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						onClick: save
					}, {
						default: withCtx(() => [..._cache[12] || (_cache[12] = [createTextVNode("保存", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(_component_el_form, {
						"label-width": "60px",
						"label-position": "left"
					}, {
						default: withCtx(() => [
							createVNode(_component_el_form_item, { label: "标题" }, {
								default: withCtx(() => [createVNode(_component_el_input, {
									modelValue: form.title,
									"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.title = $event),
									maxlength: "20",
									placeholder: "闹钟标题"
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "时间" }, {
								default: withCtx(() => [createVNode(_component_el_time_picker, {
									modelValue: form.time,
									"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.time = $event),
									format: "HH:mm",
									style: { "width": "100%" }
								}, null, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "重复" }, {
								default: withCtx(() => [createVNode(_component_el_radio_group, {
									modelValue: form.repeat,
									"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.repeat = $event)
								}, {
									default: withCtx(() => [
										createVNode(_component_el_radio, { value: "daily" }, {
											default: withCtx(() => [..._cache[8] || (_cache[8] = [createTextVNode("每天", -1)])]),
											_: 1
										}),
										createVNode(_component_el_radio, { value: "weekday" }, {
											default: withCtx(() => [..._cache[9] || (_cache[9] = [createTextVNode("工作日", -1)])]),
											_: 1
										}),
										createVNode(_component_el_radio, { value: "once" }, {
											default: withCtx(() => [..._cache[10] || (_cache[10] = [createTextVNode("单次", -1)])]),
											_: 1
										})
									]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							}),
							createVNode(_component_el_form_item, { label: "次数" }, {
								default: withCtx(() => [createVNode(_component_el_select, {
									modelValue: form.repeatCount,
									"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.repeatCount = $event),
									style: { "width": "100%" }
								}, {
									default: withCtx(() => [
										createVNode(_component_el_option, {
											value: 1,
											label: "1 次"
										}),
										createVNode(_component_el_option, {
											value: 3,
											label: "3 次"
										}),
										createVNode(_component_el_option, {
											value: 5,
											label: "5 次"
										}),
										createVNode(_component_el_option, {
											value: 0,
											label: "无限"
										})
									]),
									_: 1
								}, 8, ["modelValue"])]),
								_: 1
							})
						]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-0a36b84f"]]);
//#endregion
export { AlarmWidget_default as default };
