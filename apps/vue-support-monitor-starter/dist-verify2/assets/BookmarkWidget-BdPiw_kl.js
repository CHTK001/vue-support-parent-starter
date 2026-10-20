import { Ct as resolveDirective, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { E as collection_default, Et as plus_default, lt as link_default, w as close_default } from "./dist-DogtK295.js";
import { yt as message } from "./src-CEonioA3.js";
import "./src-DDwlSqPX.js";
import { t as IndexedDBStore } from "./indexeddb-8Dvu0tZo.js";
import { t as authStore } from "./auth-C8MLoNwd.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as component } from "./ReDialog-DZGeR3lw.js";
//#region ../../packages/theme/src/themes/koi/views/home/widgets/BookmarkWidget.vue?vue&type=script&setup=true&name=BookmarkWidget&lang.ts
var _hoisted_1 = { class: "bw" };
var _hoisted_2 = {
	key: 0,
	class: "bw__header"
};
var _hoisted_3 = { class: "bw__title" };
var _hoisted_4 = { class: "bw__body" };
var _hoisted_5 = {
	key: 0,
	class: "bw__empty"
};
var _hoisted_6 = {
	key: 1,
	class: "bw__grid"
};
var _hoisted_7 = ["onClick"];
var _hoisted_8 = { class: "bw__item-icon" };
var _hoisted_9 = ["src"];
var _hoisted_10 = { class: "bw__item-title" };
var _hoisted_11 = [
	"title",
	"aria-label",
	"onClick"
];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/BookmarkWidget.vue
var BookmarkWidget_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "BookmarkWidget",
	props: { widget: {} },
	setup(__props) {
		const authStore$1 = authStore();
		const userId = computed(() => String(authStore$1.loginUser?.userId ?? authStore$1.loginUser?.id ?? "anonymous"));
		const store = new IndexedDBStore({
			dbName: `koi-home-bookmark-${userId.value}`,
			storeName: "bookmarks",
			keyPath: "id",
			version: 1
		});
		const bookmarks = ref([]);
		const loading = ref(true);
		const dialogVisible = ref(false);
		const editingId = ref(null);
		const form = reactive({
			title: "",
			url: ""
		});
		async function load() {
			loading.value = true;
			try {
				bookmarks.value = await store.getAll();
			} catch (e) {
				console.warn("[bookmark] load failed", e);
			} finally {
				loading.value = false;
			}
		}
		async function remove(id) {
			bookmarks.value = bookmarks.value.filter((x) => x.id !== id);
			await store.remove(id);
		}
		function openUrl(url) {
			if (url) window.open(url, "_blank", "noopener,noreferrer");
		}
		function openAdd() {
			editingId.value = null;
			form.title = "";
			form.url = "";
			dialogVisible.value = true;
		}
		async function save() {
			const title = form.title.trim(), url = form.url.trim();
			if (!title) {
				message.warning("请输入书签名称");
				return;
			}
			if (!url) {
				message.warning("请输入链接地址");
				return;
			}
			const now = Date.now();
			const bm = {
				id: editingId.value ?? `bm_${now}_${Math.random().toString(36).slice(2, 6)}`,
				title,
				url
			};
			await store.put(bm);
			if (editingId.value) {
				const i = bookmarks.value.findIndex((x) => x.id === editingId.value);
				if (i >= 0) bookmarks.value[i] = bm;
			} else bookmarks.value.push(bm);
			dialogVisible.value = false;
			message.success("已保存");
		}
		onMounted(() => load());
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_input = resolveComponent("el-input");
			const _component_el_form_item = resolveComponent("el-form-item");
			const _component_el_form = resolveComponent("el-form");
			const _component_el_button = resolveComponent("el-button");
			const _directive_loading = resolveDirective("loading");
			return openBlock(), createElementBlock("div", _hoisted_1, [
				!__props.widget.hideTitle ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("div", _hoisted_3, [createVNode(_component_el_icon, { class: "bw__title-icon" }, {
					default: withCtx(() => [createVNode(unref(collection_default))]),
					_: 1
				}), createBaseVNode("span", null, toDisplayString(__props.widget.title), 1)]), createBaseVNode("button", {
					type: "button",
					class: "bw__add",
					title: "添加书签",
					"aria-label": "添加书签",
					onClick: openAdd
				}, [createVNode(_component_el_icon, null, {
					default: withCtx(() => [createVNode(unref(plus_default))]),
					_: 1
				})])])) : createCommentVNode("", true),
				withDirectives((openBlock(), createElementBlock("div", _hoisted_4, [!bookmarks.value.length && !loading.value ? (openBlock(), createElementBlock("div", _hoisted_5, [
					createVNode(_component_el_icon, { size: 28 }, {
						default: withCtx(() => [createVNode(unref(collection_default))]),
						_: 1
					}),
					_cache[5] || (_cache[5] = createBaseVNode("span", null, "暂无书签", -1)),
					createBaseVNode("button", {
						type: "button",
						class: "bw__empty-btn",
						onClick: openAdd
					}, "添加一个")
				])) : (openBlock(), createElementBlock("div", _hoisted_6, [(openBlock(true), createElementBlock(Fragment, null, renderList(bookmarks.value, (b) => {
					return openBlock(), createElementBlock("div", {
						key: b.id,
						class: "bw__item",
						onClick: ($event) => openUrl(b.url)
					}, [
						createBaseVNode("div", _hoisted_8, [b.icon ? (openBlock(), createElementBlock("img", {
							key: 0,
							src: b.icon,
							alt: "",
							class: "bw__item-img"
						}, null, 8, _hoisted_9)) : (openBlock(), createBlock(_component_el_icon, {
							key: 1,
							size: 18
						}, {
							default: withCtx(() => [createVNode(unref(link_default))]),
							_: 1
						}))]),
						createBaseVNode("span", _hoisted_10, toDisplayString(b.title), 1),
						createBaseVNode("button", {
							type: "button",
							class: "bw__item-del",
							title: `删除书签 ${b.title}`,
							"aria-label": `删除书签 ${b.title}`,
							onClick: withModifiers(($event) => remove(b.id), ["stop"])
						}, [createVNode(_component_el_icon, null, {
							default: withCtx(() => [createVNode(unref(close_default))]),
							_: 1
						})], 8, _hoisted_11)
					], 8, _hoisted_7);
				}), 128))]))])), [[_directive_loading, loading.value]]),
				createVNode(unref(component), {
					modelValue: dialogVisible.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => dialogVisible.value = $event),
					title: editingId.value ? "编辑书签" : "添加书签",
					width: "420px",
					"close-on-click-modal": false,
					"append-to-body": "",
					onClose: _cache[4] || (_cache[4] = ($event) => dialogVisible.value = false)
				}, {
					footer: withCtx(() => [createVNode(_component_el_button, { onClick: _cache[2] || (_cache[2] = ($event) => dialogVisible.value = false) }, {
						default: withCtx(() => [..._cache[6] || (_cache[6] = [createTextVNode("取消", -1)])]),
						_: 1
					}), createVNode(_component_el_button, {
						type: "primary",
						onClick: save
					}, {
						default: withCtx(() => [..._cache[7] || (_cache[7] = [createTextVNode("保存", -1)])]),
						_: 1
					})]),
					default: withCtx(() => [createVNode(_component_el_form, {
						"label-width": "60px",
						"label-position": "left"
					}, {
						default: withCtx(() => [createVNode(_component_el_form_item, { label: "名称" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.title,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.title = $event),
								maxlength: "20",
								placeholder: "书签名称"
							}, null, 8, ["modelValue"])]),
							_: 1
						}), createVNode(_component_el_form_item, { label: "链接" }, {
							default: withCtx(() => [createVNode(_component_el_input, {
								modelValue: form.url,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.url = $event),
								placeholder: "https://example.com",
								clearable: ""
							}, null, 8, ["modelValue"])]),
							_: 1
						})]),
						_: 1
					})]),
					_: 1
				}, 8, ["modelValue", "title"])
			]);
		};
	}
}), [["__scopeId", "data-v-de8be3dd"]]);
//#endregion
export { BookmarkWidget_default as default };
