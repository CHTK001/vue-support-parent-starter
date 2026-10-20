import { $n as normalizeClass, D as createVNode, E as createTextVNode, On as unref, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { m as useCssVars, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElPagination } from "./pagination-DeBPTRrN.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReAlbum/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-album__toolbar"
};
var _hoisted_2 = ["onClick"];
var _hoisted_3 = { class: "re-album__image-wrapper" };
var _hoisted_4 = [
	"src",
	"alt",
	"onClick"
];
var _hoisted_5 = {
	key: 1,
	class: "re-album__placeholder"
};
var _hoisted_6 = {
	key: 3,
	class: "re-album__overlay"
};
var _hoisted_7 = {
	key: 0,
	class: "re-album__info"
};
var _hoisted_8 = { class: "re-album__label" };
var _hoisted_9 = { class: "re-album__uploader" };
var _hoisted_10 = {
	key: 1,
	class: "re-album__footer"
};
//#endregion
//#region ../../packages/ui/src/components/ReAlbum/index.vue
var ReAlbum_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		items: { default: () => [] },
		srcField: { default: "src" },
		labelField: { default: "label" },
		columns: { default: 4 },
		gap: { default: 12 },
		aspectRatio: { default: "1" },
		loading: {
			type: Boolean,
			default: false
		},
		toolbar: {
			type: Boolean,
			default: false
		},
		uploadable: {
			type: Boolean,
			default: false
		},
		selectable: {
			type: Boolean,
			default: false
		},
		showUploadSlot: {
			type: Boolean,
			default: false
		},
		pagination: {
			type: Boolean,
			default: false
		},
		totalPages: { default: 1 },
		currentPage: { default: 1 }
	},
	emits: [
		"item-click",
		"preview",
		"remove",
		"upload",
		"page-change",
		"selection-change"
	],
	setup(__props, { emit: __emit }) {
		useCssVars((_ctx) => ({ "v7a85bf78": _ctx.aspectRatio }));
		const props = __props;
		const emit = __emit;
		const selectMode = ref(false);
		const selectedSet = ref(/* @__PURE__ */ new Set());
		const previewVisible = ref(false);
		const previewIndex = ref(0);
		function getSrc(item) {
			return String(item[props.srcField] ?? item.thumb ?? "");
		}
		function getLabel(item) {
			return String(item[props.labelField] ?? "");
		}
		const previewUrls = computed(() => props.items.map((item) => getSrc(item)).filter(Boolean));
		const gridStyle = computed(() => ({
			display: "grid",
			gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
			gap: `${props.gap}px`
		}));
		function handleItemClick(item, index) {
			if (selectMode.value) {
				const key = item.id ?? index;
				if (selectedSet.value.has(key)) selectedSet.value.delete(key);
				else selectedSet.value.add(key);
				selectedSet.value = new Set(selectedSet.value);
				const selected = props.items.filter((it, i) => selectedSet.value.has(it.id ?? i));
				emit("selection-change", selected);
				return;
			}
			emit("item-click", item, index);
		}
		function handlePreview(item, index) {
			if (previewUrls.value.length === 0) return;
			previewIndex.value = index;
			previewVisible.value = true;
			emit("preview", item, index);
		}
		function handleUpload() {
			emit("upload");
		}
		function handleRemove(item, index) {
			emit("remove", item, index);
		}
		return (_ctx, _cache) => {
			const _component_el_image_viewer = resolveComponent("el-image-viewer");
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-album", { "re-album--loading": __props.loading }]) }, [
				__props.toolbar ? (openBlock(), createElementBlock("div", _hoisted_1, [
					__props.uploadable ? (openBlock(), createBlock(unref(ElButton), {
						key: 0,
						plain: "",
						onClick: handleUpload
					}, {
						default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("上传图片", -1)])]),
						_: 1
					})) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "toolbar-extra", {}, void 0, true),
					_cache[4] || (_cache[4] = createBaseVNode("div", { class: "re-album__spacer" }, null, -1)),
					__props.selectable ? (openBlock(), createBlock(unref(ElSelect), {
						key: 1,
						modelValue: selectMode.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => selectMode.value = $event),
						class: "re-album__select-mode"
					}, {
						default: withCtx(() => [createVNode(unref(ElOption), {
							label: "多选",
							value: true
						}), createVNode(unref(ElOption), {
							label: "预览",
							value: false
						})]),
						_: 1
					}, 8, ["modelValue"])) : createCommentVNode("", true)
				])) : createCommentVNode("", true),
				createBaseVNode("div", {
					class: "re-album__grid",
					style: normalizeStyle(gridStyle.value)
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, index) => {
					return openBlock(), createElementBlock("div", {
						key: item.id ?? index,
						class: normalizeClass(["re-album__item", {
							"re-album__item--selected": selectedSet.value.has(item.id ?? index),
							"re-album__item--selecting": selectMode.value
						}]),
						onClick: ($event) => handleItemClick(item, index)
					}, [
						createBaseVNode("div", _hoisted_3, [
							getSrc(item) ? (openBlock(), createElementBlock("img", {
								key: 0,
								src: getSrc(item),
								alt: getLabel(item),
								class: "re-album__image",
								loading: "lazy",
								onClick: withModifiers(($event) => handlePreview(item, index), ["stop"])
							}, null, 8, _hoisted_4)) : (openBlock(), createElementBlock("div", _hoisted_5, [renderSlot(_ctx.$slots, "placeholder", { item }, () => [_cache[5] || (_cache[5] = createBaseVNode("svg", {
								width: "24",
								height: "24",
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								"stroke-width": "1.5"
							}, [
								createBaseVNode("rect", {
									x: "3",
									y: "3",
									width: "18",
									height: "18",
									rx: "2"
								}),
								createBaseVNode("circle", {
									cx: "8.5",
									cy: "8.5",
									r: "1.5"
								}),
								createBaseVNode("path", { d: "M21 15l-5-5L5 21" })
							], -1))], true)])),
							selectMode.value ? (openBlock(), createElementBlock("div", {
								key: 2,
								class: normalizeClass(["re-album__check", { "is-checked": selectedSet.value.has(item.id ?? index) }])
							}, [..._cache[6] || (_cache[6] = [createBaseVNode("svg", {
								width: "16",
								height: "16",
								viewBox: "0 0 16 16",
								fill: "currentColor"
							}, [createBaseVNode("path", { d: "M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.36 5.14l-4 4a.5.5 0 0 1-.7 0l-2-2a.5.5 0 0 1 .7-.7L7 9.29l3.65-3.65a.5.5 0 0 1 .7.7z" })], -1)])], 2)) : createCommentVNode("", true),
							!selectMode.value ? (openBlock(), createElementBlock("div", _hoisted_6, [renderSlot(_ctx.$slots, "overlay", {
								item,
								index
							}, () => [createVNode(unref(ElButton), {
								circle: "",
								onClick: withModifiers(($event) => handlePreview(item, index), ["stop"])
							}, {
								default: withCtx(() => [..._cache[7] || (_cache[7] = [createBaseVNode("svg", {
									width: "14",
									height: "14",
									viewBox: "0 0 24 24",
									fill: "none",
									stroke: "currentColor",
									"stroke-width": "2"
								}, [createBaseVNode("path", { d: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" })], -1)])]),
								_: 1
							}, 8, ["onClick"])], true)])) : createCommentVNode("", true)
						]),
						getLabel(item) || _ctx.$slots.info ? (openBlock(), createElementBlock("div", _hoisted_7, [renderSlot(_ctx.$slots, "info", {
							item,
							index
						}, () => [createBaseVNode("span", _hoisted_8, toDisplayString(getLabel(item)), 1)], true)])) : createCommentVNode("", true),
						renderSlot(_ctx.$slots, "actions", {
							item,
							index,
							remove: () => handleRemove(item, index)
						}, void 0, true)
					], 10, _hoisted_2);
				}), 128)), __props.showUploadSlot ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "re-album__item re-album__item--uploader",
					onClick: handleUpload
				}, [createBaseVNode("div", _hoisted_9, [renderSlot(_ctx.$slots, "uploader", {}, () => [_cache[8] || (_cache[8] = createBaseVNode("svg", {
					width: "24",
					height: "24",
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "1.5"
				}, [createBaseVNode("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" })], -1)), _cache[9] || (_cache[9] = createBaseVNode("span", null, "上传", -1))], true)])])) : createCommentVNode("", true)], 4),
				__props.pagination ? (openBlock(), createElementBlock("div", _hoisted_10, [__props.totalPages > 1 ? (openBlock(), createBlock(unref(ElPagination), {
					key: 0,
					background: "",
					layout: "prev, pager, next",
					total: __props.totalPages * 10,
					"page-size": 10,
					"current-page": __props.currentPage,
					onCurrentChange: _cache[1] || (_cache[1] = (p) => _ctx.$emit("page-change", p))
				}, null, 8, ["total", "current-page"])) : createCommentVNode("", true)])) : createCommentVNode("", true),
				previewVisible.value ? (openBlock(), createBlock(_component_el_image_viewer, {
					key: 2,
					"url-list": previewUrls.value,
					"initial-index": previewIndex.value,
					onClose: _cache[2] || (_cache[2] = ($event) => previewVisible.value = false)
				}, null, 8, ["url-list", "initial-index"])) : createCommentVNode("", true)
			], 2);
		};
	}
}), [["__scopeId", "data-v-ebe3bbe3"]]);
//#endregion
//#region ../../packages/ui/src/components/ReAlbum/index.ts
var plugin = { install(app) {
	app.component("ReAlbum", ReAlbum_default$1);
} };
var ReAlbum_default = ReAlbum_default$1;
//#endregion
export { ReAlbum_default as default, plugin as install };
