import { $n as normalizeClass, D as createVNode, Ht as watch, On as unref, St as resolveComponent, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, tt as nextTick, vn as ref, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { a as arrow_right_default, i as arrow_left_default } from "./dist-DogtK295.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReScrollNav/theme/koi/ReScrollNav.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["disabled", "aria-label"];
var _hoisted_2 = ["disabled", "aria-label"];
//#endregion
//#region ../../packages/ui/src/components/ReScrollNav/theme/koi/ReScrollNav.vue
var ReScrollNav_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReScrollNav",
	inheritAttrs: true,
	__name: "ReScrollNav",
	props: {
		scrollStep: { default: 200 },
		wheelFactor: { default: .5 },
		height: { default: "40px" },
		gap: { default: 6 },
		iconSize: { default: 14 },
		showButtonsWhenOverflow: {
			type: Boolean,
			default: true
		},
		alwaysShowButtons: {
			type: Boolean,
			default: false
		},
		prevAriaLabel: { default: "向左滚动" },
		nextAriaLabel: { default: "向右滚动" },
		activeSelector: { default: "" }
	},
	setup(__props, { expose: __expose }) {
		/**
		* ReScrollNav koi 主题 —— 横向可滚动导航壳层（KoiScrollNav 移植）
		*
		* 与 default 主题保持相同 API，结构独立：手写 viewport 滚动 + 左右翻页按钮，
		* 样式走 el 主题变量，隐藏原生滚动条。
		*/
		const props = __props;
		const viewportRef = ref(null);
		const scrollable = ref(false);
		const canScrollPrev = ref(false);
		const canScrollNext = ref(false);
		let resizeObserver;
		const rootStyle = computed(() => ({ height: props.height }));
		const trackStyle = computed(() => ({ gap: `${props.gap}px` }));
		const showNavButtons = computed(() => props.alwaysShowButtons || props.showButtonsWhenOverflow && scrollable.value);
		const getViewport = () => viewportRef.value;
		const updateScrollState = () => {
			const el = getViewport();
			if (!el) {
				scrollable.value = false;
				canScrollPrev.value = false;
				canScrollNext.value = false;
				return;
			}
			const { scrollLeft, scrollWidth, clientWidth } = el;
			const overflow = scrollWidth - clientWidth > 2;
			scrollable.value = overflow;
			canScrollPrev.value = overflow && scrollLeft > 2;
			canScrollNext.value = overflow && scrollLeft + clientWidth < scrollWidth - 2;
		};
		const scrollByDirection = (direction) => {
			const el = getViewport();
			if (!el) return;
			const delta = direction === "prev" ? -props.scrollStep : props.scrollStep;
			el.scrollBy({
				left: delta,
				behavior: "smooth"
			});
		};
		const scrollToSelector = (selector) => {
			const wrap = getViewport();
			if (!wrap || !selector) return;
			wrap.querySelector(selector)?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "nearest"
			});
		};
		const handleWheel = (e) => {
			const el = getViewport();
			if (!el) return;
			el.scrollLeft += (e.deltaY + e.deltaX) * props.wheelFactor;
			updateScrollState();
		};
		const bindResizeObserver = () => {
			const el = getViewport();
			if (!el || typeof ResizeObserver === "undefined") return;
			resizeObserver?.disconnect();
			resizeObserver = new ResizeObserver(() => updateScrollState());
			resizeObserver.observe(el);
		};
		watch(() => props.activeSelector, (selector) => {
			if (!selector) return;
			nextTick(() => scrollToSelector(selector));
		});
		onMounted(() => {
			nextTick(() => {
				updateScrollState();
				if (props.activeSelector) scrollToSelector(props.activeSelector);
				bindResizeObserver();
			});
		});
		onBeforeUnmount(() => {
			resizeObserver?.disconnect();
		});
		__expose({
			updateScrollState,
			scrollByDirection,
			scrollToSelector,
			scrollable,
			canScrollPrev,
			canScrollNext
		});
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			return openBlock(), createElementBlock("div", {
				class: normalizeClass(["koi-scroll-nav", { "is-scrollable": scrollable.value }]),
				style: normalizeStyle(rootStyle.value)
			}, [
				withDirectives(createBaseVNode("button", {
					type: "button",
					class: normalizeClass(["koi-scroll-nav__btn", { "is-disabled": !canScrollPrev.value }]),
					disabled: !canScrollPrev.value,
					"aria-label": __props.prevAriaLabel,
					onClick: _cache[0] || (_cache[0] = ($event) => scrollByDirection("prev"))
				}, [createVNode(_component_el_icon, { size: __props.iconSize }, {
					default: withCtx(() => [createVNode(unref(arrow_left_default))]),
					_: 1
				}, 8, ["size"])], 10, _hoisted_1), [[vShow, showNavButtons.value]]),
				createBaseVNode("div", {
					ref_key: "viewportRef",
					ref: viewportRef,
					class: "koi-scroll-nav__viewport",
					onScroll: updateScrollState,
					onWheel: withModifiers(handleWheel, ["prevent"])
				}, [createBaseVNode("div", {
					class: "koi-scroll-nav__track",
					style: normalizeStyle(trackStyle.value)
				}, [renderSlot(_ctx.$slots, "default", {}, void 0, true)], 4)], 544),
				withDirectives(createBaseVNode("button", {
					type: "button",
					class: normalizeClass(["koi-scroll-nav__btn", { "is-disabled": !canScrollNext.value }]),
					disabled: !canScrollNext.value,
					"aria-label": __props.nextAriaLabel,
					onClick: _cache[1] || (_cache[1] = ($event) => scrollByDirection("next"))
				}, [createVNode(_component_el_icon, { size: __props.iconSize }, {
					default: withCtx(() => [createVNode(unref(arrow_right_default))]),
					_: 1
				}, 8, ["size"])], 10, _hoisted_2), [[vShow, showNavButtons.value]])
			], 6);
		};
	}
}), [["__scopeId", "data-v-45bac7b4"]]);
//#endregion
export { ReScrollNav_default as default };
