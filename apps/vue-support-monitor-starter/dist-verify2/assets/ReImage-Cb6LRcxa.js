import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $n as normalizeClass, Ht as watch, T as createStaticVNode, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as require_viewer } from "./viewer-DkfJs9oL.js";
//#region ../../packages/ui/src/components/ReImage/index.vue?vue&type=script&setup=true&lang.ts
var import_viewer = /* @__PURE__ */ __toESM(require_viewer(), 1);
var _hoisted_1 = ["src", "alt"];
var _hoisted_2 = {
	key: 1,
	class: "re-image__error"
};
var _hoisted_3 = { class: "re-image__error-text" };
var _hoisted_4 = {
	key: 2,
	class: "re-image__loading"
};
//#endregion
//#region ../../packages/ui/src/components/ReImage/index.vue
var ReImage_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		src: {},
		alt: { default: "" },
		width: {},
		height: {},
		radius: {},
		fit: { default: "cover" },
		preview: {
			type: Boolean,
			default: true
		},
		previewList: {},
		lazy: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: true
		},
		fallbackText: { default: "加载失败" }
	},
	setup(__props) {
		/**
		* ReImage —— 图片组件
		*
		* 基于 viewerjs，支持预览、懒加载、错误处理、加载占位
		*   <ReImage src="url" :preview="true" />
		*/
		const props = __props;
		const root = ref(null);
		const loaded = ref(false);
		const error = ref(false);
		let viewerInstance = null;
		const imgStyle = computed(() => ({
			width: typeof props.width === "number" ? `${props.width}px` : props.width ?? "100%",
			height: typeof props.height === "number" ? `${props.height}px` : props.height ?? "auto",
			borderRadius: typeof props.radius === "number" ? `${props.radius}px` : props.radius,
			objectFit: props.fit
		}));
		const handleLoad = () => {
			loaded.value = true;
			error.value = false;
		};
		const handleError = () => {
			loaded.value = false;
			error.value = true;
		};
		const handlePreview = () => {
			if (!props.preview || !root.value) return;
			if (viewerInstance) {
				viewerInstance.show();
				return;
			}
			viewerInstance = new import_viewer.default(root.value, {
				url: (img) => img.src,
				hidden: () => {
					viewerInstance?.destroy();
					viewerInstance = null;
				}
			});
			viewerInstance.show();
		};
		onMounted(() => {
			if (props.lazy && "loading" in HTMLImageElement.prototype) {
				const img = root.value?.querySelector("img");
				if (img) img.loading = "lazy";
			}
		});
		onBeforeUnmount(() => {
			if (viewerInstance) {
				viewerInstance.destroy();
				viewerInstance = null;
			}
		});
		watch(() => props.src, () => {
			loaded.value = false;
			error.value = false;
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "root",
				ref: root,
				class: normalizeClass(["re-image", {
					"is-loaded": loaded.value,
					"is-error": error.value
				}])
			}, [!error.value ? (openBlock(), createElementBlock("img", {
				key: 0,
				src: __props.src,
				alt: __props.alt,
				style: normalizeStyle(imgStyle.value),
				class: normalizeClass(["re-image__img", { "is-clickable": __props.preview }]),
				onLoad: handleLoad,
				onError: handleError,
				onClick: handlePreview
			}, null, 46, _hoisted_1)) : (openBlock(), createElementBlock("div", _hoisted_2, [_cache[0] || (_cache[0] = createStaticVNode("<span class=\"re-image__error-icon\" data-v-519ad9b2><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" data-v-519ad9b2><path d=\"M2 25V3h20v22H2zm2-2h16V5H4v18z\" data-v-519ad9b2></path><path d=\"M7.5 11.5l3-3 3 3 3-3 3 3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" data-v-519ad9b2></path><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\" fill=\"currentColor\" data-v-519ad9b2></circle></svg></span>", 1)), createBaseVNode("span", _hoisted_3, toDisplayString(__props.fallbackText), 1)])), __props.loading && !loaded.value && !error.value ? (openBlock(), createElementBlock("div", _hoisted_4, [..._cache[1] || (_cache[1] = [createBaseVNode("div", { class: "re-image__spinner" }, null, -1)])])) : createCommentVNode("", true)], 2);
		};
	}
}), [["__scopeId", "data-v-519ad9b2"]]);
//#endregion
//#region ../../packages/ui/src/components/ReImage/index.ts
var plugin = { install(app) {
	app.component("ReImage", ReImage_default$1);
} };
var ReImage_default = ReImage_default$1;
//#endregion
export { ReImage_default as default, plugin as install };
