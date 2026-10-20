const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReDialog-Br5G1CNa.js","assets/ReDialog-DZGeR3lw.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/theme-B9R3AFqb.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/src-DzQcKxHP.js","assets/ReButton-XiNbAVqG.js","assets/ReButton-owxlNwDO.js","assets/ReButton-CH6SFZxo.js","assets/tooltip-DEX5DBfd.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/isUndefined-DfHYomSZ.js","assets/dist-Clzx2YUA.js","assets/aria-DKP9Ei-1.js","assets/use-id-C2v-tXFq.js","assets/focus-trap-B31xXeBw.js","assets/use-z-index-Q40Vppe1.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/_baseFlatten-D6objHuc.js","assets/_arrayPush-DAsStFRE.js","assets/hasIn-COufhDdn.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/constants-ntbKDiND.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/button-CLXz94Uh.js","assets/use-size-BpzpcbJM.js","assets/use-deprecated-qam6HGto.js","assets/use-form-common-props-DzQ9ZY64.js","assets/dist-DogtK295.js","assets/icon-C0dIJHSD.js","assets/use-form-item-D-dEMqBj.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReIcon-mRxVAA3T.js","assets/registry-Dp44ioVs.js","assets/ReIcon-B6YUJqdV.css","assets/ReButton-CVtu1Sci.css","assets/ReInput-CgzHFsgl.js","assets/ReInput-CGHpe202.js","assets/input-Bbhiel27.js","assets/event-CeZgVnv0.js","assets/raf-Ck-OXP6t.js","assets/use-composition-BHiYKdrO.js","assets/typescript-CMUKtCBO.js","assets/ReInput-D5IsrmWe.css","assets/ReEmpty-LmtIku4U.js","assets/ReEmpty-DzxmsI1k.js"])))=>i.map(i=>d[i]);
import { $n as normalizeClass, Ct as resolveDirective, D as createVNode, Ht as watch, O as defineAsyncComponent, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { Et as plus_default, I as delete_default, _ as check_default } from "./dist-DogtK295.js";
import { t as ElMessageBox } from "./message-box-CXDJvJwn.js";
import { yt as message } from "./src-CEonioA3.js";
import "./src-DDwlSqPX.js";
import { r as createNoteStore } from "./indexeddb-8Dvu0tZo.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/NoteWidget.vue?vue&type=script&setup=true&name=NoteWidget&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "note-widget__header"
};
var _hoisted_2 = { class: "note-widget__title" };
var _hoisted_3 = {
	key: 0,
	class: "note-widget__count"
};
var _hoisted_4 = { class: "note-widget__actions" };
var _hoisted_5 = { class: "note-widget__body" };
var _hoisted_6 = {
	key: 1,
	class: "note-widget__list"
};
var _hoisted_7 = ["onClick"];
var _hoisted_8 = ["onClick"];
var _hoisted_9 = { class: "note-widget__item-text" };
var _hoisted_10 = { class: "note-widget__item-foot" };
var _hoisted_11 = { class: "note-widget__item-time" };
var _hoisted_12 = { class: "note-widget__colors" };
var _hoisted_13 = ["onClick"];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/NoteWidget.vue
var NoteWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "NoteWidget",
	props: { widget: {} },
	setup(__props) {
		/**
		* 便签 widget（IndexedDB 持久化）
		*
		* 数据：按当前用户 ID 隔离的 IndexedDB 数据库（koi-home-note-{userId}）。
		* 每条便签包含：text / color / createdAt / updatedAt / id。
		*/
		const ReDialog = defineAsyncComponent(() => __vitePreload(() => import("./ReDialog-Br5G1CNa.js").then((m) => m.default), __vite__mapDeps([0,1,2,3,4,5,6])));
		const ReButton = defineAsyncComponent(() => __vitePreload(() => import("./ReButton-XiNbAVqG.js").then((m) => m.default), __vite__mapDeps([7,8,9,5,2,3,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55])));
		const ReInput = defineAsyncComponent(() => __vitePreload(() => import("./ReInput-CgzHFsgl.js").then((m) => m.default), __vite__mapDeps([56,57,5,2,3,58,11,59,39,15,16,17,18,14,20,13,60,41,33,61,21,25,26,27,28,29,30,31,32,42,43,34,35,36,37,44,22,62,63])));
		const ReEmpty = defineAsyncComponent(() => __vitePreload(() => import("./ReEmpty-LmtIku4U.js").then((m) => m.default), __vite__mapDeps([64,65,5,2,3])));
		/** 便签数据 */
		const NOTE_COLORS = [
			"#FDE68A",
			"#BFDBFE",
			"#BBF7D0",
			"#FBCFE8",
			"#E9D5FF",
			"#FED7AA"
		];
		/**
		* 便签外观主题 → 背景 / 边框 / 头部色 / 墨色（低饱和度）。
		*
		* `ink` 仅彩色主题需要：纸底是固定浅色，不随暗色模式变暗，
		* 标题文字若跟随 `--el-text-color-primary`（暗色下为浅色）会降到 1.01:1 完全不可见。
		* default 主题纸底本身是 token，暗色下会一起变暗，故不给 ink，回落到 primary。
		*/
		const THEME_STYLES = {
			default: {
				bg: "var(--el-fill-color-blank)",
				border: "var(--el-border-color-lighter)",
				header: "var(--el-bg-color)"
			},
			yellow: {
				bg: "#FEFCE8",
				border: "#FDE68A",
				header: "#FEF3C7",
				ink: "#3F3A2E"
			},
			blue: {
				bg: "#EFF6FF",
				border: "#BFDBFE",
				header: "#DBEAFE",
				ink: "#1E3A5F"
			},
			green: {
				bg: "#ECFDF5",
				border: "#A7F3D0",
				header: "#D1FAE5",
				ink: "#1F4D3D"
			},
			purple: {
				bg: "#F5F3FF",
				border: "#DDD6FE",
				header: "#EDE9FE",
				ink: "#3F3560"
			},
			peach: {
				bg: "#FFF1F2",
				border: "#FECDD3",
				header: "#FFE4E6",
				ink: "#5C2B33"
			}
		};
		const props = __props;
		const authStore$1 = authStore();
		const userId = computed(() => String(authStore$1.loginUser?.userId ?? authStore$1.loginUser?.id ?? "anonymous"));
		/** 便签外观主题样式（喂给根容器 CSS 变量） */
		const themeStyle = computed(() => {
			const theme = props.widget.noteConfig?.theme ?? "default";
			return THEME_STYLES[theme] ?? THEME_STYLES.default;
		});
		const notes = ref([]);
		const loading = ref(true);
		const errored = ref(false);
		const dialogVisible = ref(false);
		const editing = ref(false);
		const form = ref({
			text: "",
			color: NOTE_COLORS[0]
		});
		function getNoteStore() {
			return createNoteStore(userId.value);
		}
		function load() {
			loading.value = true;
			errored.value = false;
			getNoteStore().getAll().then((list) => {
				notes.value = list.sort((a, b) => b.updatedAt - a.updatedAt);
			}).catch((err) => {
				errored.value = true;
				console.warn("[note-widget] load failed", err);
			}).finally(() => {
				loading.value = false;
			});
		}
		function openAdd() {
			editing.value = false;
			form.value = {
				text: "",
				color: NOTE_COLORS[0]
			};
			dialogVisible.value = true;
		}
		function openEdit(note) {
			editing.value = true;
			form.value = {
				id: note.id,
				text: note.text,
				color: note.color
			};
			dialogVisible.value = true;
		}
		async function save() {
			const text = form.value.text.trim();
			if (!text) {
				message.warning("请输入内容");
				return;
			}
			const now = Date.now();
			const note = {
				id: form.value.id ?? `note_${now}_${Math.random().toString(36).slice(2, 6)}`,
				text,
				color: form.value.color,
				createdAt: editing.value ? notes.value.find((n) => n.id === form.value.id)?.createdAt ?? now : now,
				updatedAt: now
			};
			try {
				await getNoteStore().put(note);
				dialogVisible.value = false;
				load();
				message.success("已保存");
			} catch (err) {
				console.error(err);
				message.error("保存失败");
			}
		}
		async function remove(id) {
			try {
				await ElMessageBox.confirm("确认删除该便签？", "提示", { type: "warning" });
				await getNoteStore().remove(id);
				load();
				message.success("已删除");
			} catch (err) {
				if (err === "cancel") return;
				console.error(err);
				message.error("删除失败");
			}
		}
		function fmtTime(ts) {
			const d = new Date(ts);
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
		}
		function pad(n) {
			return n < 10 ? `0${n}` : String(n);
		}
		onMounted(() => {
			load();
		});
		watch(userId, () => load());
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_form = resolveComponent("el-form");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", {
				class: "note-widget",
				style: normalizeStyle({
					background: themeStyle.value.bg,
					borderColor: themeStyle.value.border,
					"--note-header-bg": themeStyle.value.header,
					"--note-ink": themeStyle.value.ink ?? ""
				})
			}, [
				!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("span", null, toDisplayString(__props.widget.title), 1), notes.value.length ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(notes.value.length) + " 条", 1)) : createCommentVNode("", true)]), createBaseVNode("div", _hoisted_4, [createVNode(unref(ReButton), {
					link: "",
					type: "primary",
					title: "添加便签",
					onClick: openAdd
				}, {
					default: withCtx(() => [createVNode(_component_el_icon, null, {
						default: withCtx(() => [createVNode(unref(plus_default))]),
						_: 1
					})]),
					_: 1
				})])])) : createCommentVNode("", true),
				withDirectives((openBlock(), createElementBlock("div", _hoisted_5, [!loading.value && !notes.value.length ? (openBlock(), createBlock(unref(ReEmpty), {
					key: 0,
					description: "暂无便签，点击右上角添加",
					"image-size": 56
				})) : (openBlock(), createElementBlock("ul", _hoisted_6, [(openBlock(true), createElementBlock(Fragment, null, renderList(notes.value, (note) => {
					return openBlock(), createElementBlock("li", {
						key: note.id,
						class: "note-widget__item",
						onClick: ($event) => openEdit(note)
					}, [
						createBaseVNode("button", {
							type: "button",
							class: "note-widget__item-remove",
							title: "删除便签",
							"aria-label": "删除便签",
							onClick: withModifiers(($event) => remove(note.id), ["stop"])
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(delete_default))]),
							_: 1
						})], 8, _hoisted_8),
						createBaseVNode("div", _hoisted_9, toDisplayString(note.text), 1),
						createBaseVNode("div", _hoisted_10, [createBaseVNode("span", _hoisted_11, toDisplayString(fmtTime(note.updatedAt)), 1), createBaseVNode("span", {
							class: "note-widget__item-color",
							style: normalizeStyle({ background: note.color })
						}, null, 4)])
					], 8, _hoisted_7);
				}), 128))]))])), [[_directive_loading, loading.value]]),
				createVNode(unref(ReDialog), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => dialogVisible.value = $event),
					title: editing.value ? "编辑便签" : "添加便签",
					width: 420,
					"confirm-text": "保存",
					"cancel-text": "取消",
					"destroy-on-close": "",
					"footer-hidden": false,
					onConfirm: save,
					onCancel: _cache[2] || (_cache[2] = ($event) => dialogVisible.value = false)
				}, {
					content: withCtx(() => [createVNode(_component_el_form, {
						model: form.value,
						"label-position": "top",
						size: "default"
					}, {
						default: withCtx(() => [createVNode(_component_el_form_item, {
							label: "内容",
							required: ""
						}, {
							default: withCtx(() => [createVNode(unref(ReInput), {
								modelValue: form.value.text,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.value.text = $event),
								type: "textarea",
								rows: 5,
								maxlength: "500",
								"show-word-limit": "",
								placeholder: "记录点什么…"
							}, null, 8, ["modelValue"])]),
							_: 1
						}), createVNode(_component_el_form_item, { label: "便签颜色" }, {
							default: withCtx(() => [createBaseVNode("div", _hoisted_12, [(openBlock(), createElementBlock(Fragment, null, renderList(NOTE_COLORS, (c) => {
								return createBaseVNode("button", {
									key: c,
									type: "button",
									class: normalizeClass(["note-widget__color", { "is-active": form.value.color === c }]),
									style: normalizeStyle({ background: c }),
									onClick: ($event) => form.value.color = c
								}, [form.value.color === c ? (openBlock(), createBlock(_component_el_icon, { key: 0 }, {
									default: withCtx(() => [createVNode(unref(check_default))]),
									_: 1
								})) : createCommentVNode("", true)], 14, _hoisted_13);
							}), 64))])]),
							_: 1
						})]),
						_: 1
					}, 8, ["model"])]),
					_: 1
				}, 8, ["modelValue", "title"])
			], 4);
		};
	}
}), [["__scopeId", "data-v-4b0327ce"]]);
//#endregion
export { NoteWidget_default as default };
