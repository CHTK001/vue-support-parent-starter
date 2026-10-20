import { o as __toESM } from "./rolldown-runtime-CEgmsyvS.js";
import { $n as normalizeClass, Ht as watch, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, gn as reactive, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as require_viewer } from "./viewer-DkfJs9oL.js";
//#region ../../packages/ui/src/components/ReImageGroup/index.vue?vue&type=script&setup=true&lang.ts
var import_viewer = /* @__PURE__ */ __toESM(require_viewer(), 1);
var _hoisted_1 = [
	"src",
	"alt",
	"onLoad",
	"onError",
	"onClick"
];
var _hoisted_2 = {
	key: 2,
	class: "re-image-group__loading"
};
var _hoisted_3 = {
	key: 3,
	class: "re-image-group__error"
};
var _hoisted_4 = { class: "re-image-group__error-text" };
var _hoisted_5 = {
	key: 0,
	class: "re-image-group__empty"
};
//#endregion
//#region ../../packages/ui/src/components/ReImageGroup/index.vue
var ReImageGroup_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		srcList: { default: () => [] },
		previewSrcList: { default: () => [] },
		layout: { default: "grid" },
		columns: { default: 3 },
		gap: { default: 8 },
		radius: { default: 6 },
		rowHeight: { default: 160 },
		fit: { default: "cover" },
		preview: {
			type: Boolean,
			default: true
		},
		lazy: {
			type: Boolean,
			default: true
		},
		rootMargin: { default: "200px" },
		loading: {
			type: Boolean,
			default: true
		},
		fallbackText: { default: "加载失败" },
		emptyText: { default: "暂无图片" }
	},
	setup(__props) {
		/**
		* ReImageGroup —— 图片列表/画廊
		*
		* - 异步懒加载：图片节点首次进入视口才赋值 src，避免一次性加载全部图片
		* - 布局：grid（等高网格） / masonry（按原图比例瀑布流）
		* - 预览：点击调起 viewerjs，传入全量 src-list 作为可切换图集
		*/
		const props = __props;
		const root = ref(null);
		const itemRefs = /* @__PURE__ */ new Map();
		const visibleMap = reactive({});
		const loadingMap = reactive({});
		const loadedMap = reactive({});
		const errorMap = reactive({});
		let observer = null;
		let viewerInstance = null;
		/** 统一输出：字符串 -> { src }, 对象 -> 透传 */
		const normalizedList = computed(() => {
			const fromSrc = (props.srcList ?? []).map(toImageItem);
			if (fromSrc.length) return fromSrc;
			return (props.previewSrcList ?? []).map((s) => ({ src: s }));
		});
		function toImageItem(item) {
			if (typeof item === "string") return { src: item };
			return item;
		}
		function resolveSrc(item) {
			return item.src;
		}
		function resolveAlt(item) {
			return item.alt ?? "";
		}
		/** 占位背景色 = 原图比例（masonry） / 固定高宽比（grid） */
		function placeholderStyle(item) {
			if (props.layout === "masonry" && item.width && item.height) return {
				paddingBottom: `${item.height / item.width * 100}%`,
				borderRadius: `${props.radius}px`
			};
			return {
				height: `${props.rowHeight}px`,
				borderRadius: `${props.radius}px`
			};
		}
		const imgInnerStyle = computed(() => ({
			objectFit: props.fit,
			borderRadius: `${props.radius}px`
		}));
		/** 容器整体样式 */
		const rootStyle = computed(() => ({
			display: "grid",
			gridTemplateColumns: props.layout === "grid" ? `repeat(${Math.max(1, props.columns)}, minmax(0, 1fr))` : `repeat(${Math.max(1, props.columns)}, minmax(0, 1fr))`,
			gridAutoRows: props.layout === "masonry" ? "auto" : `${props.rowHeight}px`,
			columnGap: `${props.gap}px`,
			rowGap: `${props.gap}px`
		}));
		/** masonry 模式按原图比例撑开 */
		function itemStyle(item, _index) {
			if (props.layout === "masonry" && item.width && item.height) return { gridRow: `span ${Math.max(1, Math.round(item.height / 100))}` };
			return {};
		}
		function registerItem(el, index) {
			if (el) itemRefs.set(index, el);
			else itemRefs.delete(index);
		}
		function ensureObserver() {
			if (observer || typeof IntersectionObserver === "undefined") return;
			observer = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					const idxAttr = entry.target.getAttribute("data-idx");
					const idx = idxAttr ? Number(idxAttr) : NaN;
					if (!Number.isFinite(idx)) continue;
					if (entry.isIntersecting) {
						visibleMap[idx] = true;
						loadingMap[idx] = true;
						observer?.unobserve(entry.target);
					}
				}
			}, {
				rootMargin: props.rootMargin,
				threshold: .01
			});
		}
		function observeAll() {
			if (!observer) return;
			itemRefs.forEach((el, idx) => {
				el.setAttribute("data-idx", String(idx));
				observer.observe(el);
			});
		}
		function unobserveAll() {
			observer?.disconnect();
			observer = null;
		}
		function handleLoad(_e, index) {
			loadedMap[index] = true;
			errorMap[index] = false;
			loadingMap[index] = false;
		}
		function handleError(_e, index) {
			loadedMap[index] = false;
			errorMap[index] = true;
			loadingMap[index] = false;
		}
		/** 点击预览：viewerjs 实例化一次，传全量 url 作为可切换图集 */
		function handlePreview(e, index) {
			if (!props.preview) return;
			e.stopPropagation();
			if (viewerInstance) {
				viewerInstance.show();
				viewerInstance.view(index);
				return;
			}
			if (!root.value) return;
			normalizedList.value.map((it) => it.src);
			viewerInstance = new import_viewer.default(root.value, {
				url: (img) => img.src,
				hidden: () => {
					viewerInstance?.destroy();
					viewerInstance = null;
				}
			});
			viewerInstance.show();
			viewerInstance.view(index);
		}
		onMounted(() => {
			if (!props.lazy) {
				normalizedList.value.forEach((_, i) => {
					visibleMap[i] = true;
					loadingMap[i] = true;
				});
				return;
			}
			ensureObserver();
			requestAnimationFrame(observeAll);
		});
		onBeforeUnmount(() => {
			unobserveAll();
			if (viewerInstance) {
				viewerInstance.destroy();
				viewerInstance = null;
			}
		});
		/** 数据变化时重建观察 + 清空旧状态 */
		watch(() => normalizedList.value.length, () => {
			Object.keys(visibleMap).forEach((k) => delete visibleMap[Number(k)]);
			Object.keys(loadingMap).forEach((k) => delete loadingMap[Number(k)]);
			Object.keys(loadedMap).forEach((k) => delete loadedMap[Number(k)]);
			Object.keys(errorMap).forEach((k) => delete errorMap[Number(k)]);
			if (!props.lazy) {
				normalizedList.value.forEach((_, i) => {
					visibleMap[i] = true;
					loadingMap[i] = true;
				});
				return;
			}
			unobserveAll();
			ensureObserver();
			requestAnimationFrame(observeAll);
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "root",
				ref: root,
				class: normalizeClass(["re-image-group", [`re-image-group--${__props.layout}`]]),
				style: normalizeStyle(rootStyle.value)
			}, [(openBlock(true), createElementBlock(Fragment, null, renderList(normalizedList.value, (item, index) => {
				return openBlock(), createElementBlock("div", {
					key: index,
					ref_for: true,
					ref: (el) => registerItem(el, index),
					class: "re-image-group__item",
					style: normalizeStyle(itemStyle(item, index))
				}, [
					!visibleMap[index] ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: "re-image-group__placeholder",
						style: normalizeStyle(placeholderStyle(item))
					}, null, 4)) : (openBlock(), createElementBlock("img", {
						key: 1,
						src: resolveSrc(item),
						alt: resolveAlt(item),
						style: normalizeStyle(imgInnerStyle.value),
						class: normalizeClass(["re-image-group__img", { "is-clickable": __props.preview }]),
						onLoad: (e) => handleLoad(e, index),
						onError: (e) => handleError(e, index),
						onClick: (e) => handlePreview(e, index)
					}, null, 46, _hoisted_1)),
					visibleMap[index] && loadingMap[index] && !loadedMap[index] ? (openBlock(), createElementBlock("div", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("div", { class: "re-image-group__spinner" }, null, -1)])])) : createCommentVNode("", true),
					visibleMap[index] && errorMap[index] ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(__props.fallbackText), 1)])) : createCommentVNode("", true)
				], 4);
			}), 128)), !normalizedList.value.length ? (openBlock(), createElementBlock("div", _hoisted_5, toDisplayString(__props.emptyText), 1)) : createCommentVNode("", true)], 6);
		};
	}
}), [["__scopeId", "data-v-eecfa91b"]]);
//#endregion
//#region ../../packages/ui/src/components/ReImageGroup/index.ts
var plugin = { install(app) {
	app.component("ReImageGroup", ReImageGroup_default$1);
} };
var ReImageGroup_default = ReImageGroup_default$1;
//#endregion
export { ReImageGroup_default as default, plugin as install };
