import { $n as normalizeClass, Ht as watch, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, rr as toDisplayString, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReCarousel/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["onClick"];
var _hoisted_2 = ["src", "alt"];
var _hoisted_3 = {
	key: 1,
	class: "re-carousel__default"
};
var _hoisted_4 = {
	key: 1,
	class: "re-carousel__indicators"
};
var _hoisted_5 = ["onClick"];
//#endregion
//#region ../../packages/ui/src/components/ReCarousel/index.vue
var ReCarousel_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		items: {},
		modelValue: {},
		interval: { default: 3e3 },
		direction: { default: "horizontal" },
		loop: {
			type: Boolean,
			default: true
		},
		arrow: { default: "hover" },
		indicator: { default: "always" },
		pauseOnHover: {
			type: Boolean,
			default: true
		},
		initialIndex: { default: 0 },
		indicatorPosition: { default: "inside" },
		itemKey: { default: "" },
		onChange: {},
		beforeChange: {}
	},
	emits: ["update:modelValue", "change"],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReCarousel —— 轮播图组件
		*
		* 自实现 CSS transform + transition，无外部依赖
		* 支持自动播放、循环、垂直/水平、箭头/指示器
		*   <ReCarousel :items="images" :interval="3000" />
		*/
		const props = __props;
		const emit = __emit;
		const rootRef = ref(null);
		const activeIndex = ref(props.modelValue ?? props.initialIndex);
		const isHovering = ref(false);
		const slideTransition = ref(true);
		let timer = null;
		const itemsCount = computed(() => props.items.length);
		const displayItems = computed(() => {
			if (!props.loop || itemsCount.value <= 1) return props.items;
			return [
				props.items[itemsCount.value - 1],
				...props.items,
				props.items[0]
			];
		});
		computed(() => props.loop ? 1 : 0);
		const trackOffset = computed(() => props.loop ? -(activeIndex.value + 1) * 100 : -activeIndex.value * 100);
		const trackStyle = computed(() => {
			const transition = slideTransition.value ? `transform ${props.interval && props.interval > 0 ? 500 : 350}ms ease-in-out` : "none";
			return {
				transform: props.direction === "horizontal" ? `translateX(${trackOffset.value}%)` : `translateY(${trackOffset.value}%)`,
				transition,
				display: "flex",
				flexDirection: props.direction === "horizontal" ? "row" : "column",
				width: "100%",
				height: "100%"
			};
		});
		const itemStyle = computed(() => ({
			flex: "0 0 100%",
			width: "100%",
			height: "100%"
		}));
		const indicatorStyle = computed(() => ({}));
		const getItemKey = (item, index) => {
			if (props.itemKey && typeof item === "object" && item !== null) return String(item[props.itemKey] ?? index);
			if (typeof item === "string") return item;
			return String(index);
		};
		const isImage = (item) => {
			if (typeof item === "string") return /^https?:\/\/|^\/|data:image/.test(item) || /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(item);
			return false;
		};
		const getItemAlt = (item, index) => {
			if (typeof item === "object" && item !== null) return String(item.alt ?? `slide-${index}`);
			return `slide-${index}`;
		};
		const realIndex = (displayIndex) => {
			if (!props.loop) return displayIndex;
			if (displayIndex === 0) return itemsCount.value - 1;
			if (displayIndex === itemsCount.value + 1) return 0;
			return displayIndex - 1;
		};
		const goTo = async (targetIndex) => {
			const oldIndex = activeIndex.value;
			if (targetIndex === oldIndex) return;
			if (props.beforeChange) {
				if (!await props.beforeChange(targetIndex, oldIndex)) return;
			}
			activeIndex.value = targetIndex;
			emit("update:modelValue", targetIndex);
			emit("change", targetIndex);
			props.onChange?.(targetIndex);
		};
		const setActive = (index) => {
			goTo(index);
		};
		const handleNext = () => {
			if (itemsCount.value === 0) return;
			let next = activeIndex.value + 1;
			if (next >= itemsCount.value) if (props.loop) next = 0;
			else return;
			goTo(next);
		};
		const handlePrev = () => {
			if (itemsCount.value === 0) return;
			let prev = activeIndex.value - 1;
			if (prev < 0) if (props.loop) prev = itemsCount.value - 1;
			else return;
			goTo(prev);
		};
		const handleItemClick = (item, index) => {
			const real = realIndex(index);
			if (real !== activeIndex.value) setActive(real);
		};
		const handleTransitionEnd = () => {
			if (!props.loop) return;
			if (activeIndex.value === -1) {
				slideTransition.value = false;
				activeIndex.value = itemsCount.value - 1;
				requestAnimationFrame(() => {
					slideTransition.value = true;
				});
			} else if (activeIndex.value === itemsCount.value) {
				slideTransition.value = false;
				activeIndex.value = 0;
				requestAnimationFrame(() => {
					slideTransition.value = true;
				});
			}
		};
		const startTimer = () => {
			if (props.interval <= 0 || itemsCount.value <= 1) return;
			stopTimer();
			timer = window.setInterval(() => {
				if (props.pauseOnHover && isHovering.value) return;
				handleNext();
			}, props.interval);
		};
		const stopTimer = () => {
			if (timer !== null) {
				window.clearInterval(timer);
				timer = null;
			}
		};
		const handleMouseEnter = () => {
			isHovering.value = true;
		};
		const handleMouseLeave = () => {
			isHovering.value = false;
		};
		const handleVisibilityChange = () => {
			if (document.hidden) stopTimer();
			else startTimer();
		};
		watch(() => props.modelValue, (val) => {
			if (val !== void 0 && val !== activeIndex.value) {
				slideTransition.value = true;
				activeIndex.value = val;
			}
		});
		watch(() => props.items, () => {
			slideTransition.value = false;
			activeIndex.value = props.modelValue ?? props.initialIndex;
			requestAnimationFrame(() => {
				slideTransition.value = true;
			});
		}, { deep: true });
		onMounted(() => {
			startTimer();
			document.addEventListener("visibilitychange", handleVisibilityChange);
		});
		onBeforeUnmount(() => {
			stopTimer();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		});
		__expose({
			setActive,
			next: handleNext,
			prev: handlePrev
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "rootRef",
				ref: rootRef,
				class: normalizeClass(["re-carousel", [`re-carousel--${__props.direction}`, { "is-hover": isHovering.value }]]),
				onMouseenter: handleMouseEnter,
				onMouseleave: handleMouseLeave
			}, [
				createBaseVNode("div", {
					class: "re-carousel__track",
					style: normalizeStyle(trackStyle.value),
					onTransitionend: handleTransitionEnd
				}, [(openBlock(true), createElementBlock(Fragment, null, renderList(displayItems.value, (item, index) => {
					return openBlock(), createElementBlock("div", {
						key: getItemKey(item, index),
						class: "re-carousel__item",
						style: normalizeStyle(itemStyle.value),
						onClick: ($event) => handleItemClick(item, index)
					}, [renderSlot(_ctx.$slots, "default", {
						item,
						index: realIndex(index),
						active: realIndex(index) === activeIndex.value
					}, () => [isImage(item) ? (openBlock(), createElementBlock("img", {
						key: 0,
						src: item,
						alt: getItemAlt(item, index),
						class: "re-carousel__img"
					}, null, 8, _hoisted_2)) : (openBlock(), createElementBlock("div", _hoisted_3, toDisplayString(item), 1))], true)], 12, _hoisted_1);
				}), 128))], 36),
				__props.arrow !== "never" ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [__props.arrow === "always" || isHovering.value ? (openBlock(), createElementBlock("button", {
					key: 0,
					class: "re-carousel__arrow re-carousel__arrow--left",
					onClick: handlePrev
				}, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [createBaseVNode("path", {
					d: "M15 18l-6-6 6-6",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)])])) : createCommentVNode("", true), __props.arrow === "always" || isHovering.value ? (openBlock(), createElementBlock("button", {
					key: 1,
					class: "re-carousel__arrow re-carousel__arrow--right",
					onClick: handleNext
				}, [..._cache[1] || (_cache[1] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2"
				}, [createBaseVNode("path", {
					d: "M9 6l6 6-6 6",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				})], -1)])])) : createCommentVNode("", true)], 64)) : createCommentVNode("", true),
				__props.indicator !== "never" && __props.items.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_4, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item, index) => {
					return openBlock(), createElementBlock("button", {
						key: `ind-${getItemKey(item, index)}`,
						class: normalizeClass(["re-carousel__indicator", { "is-active": realIndex(index) === activeIndex.value }]),
						style: normalizeStyle(indicatorStyle.value),
						onClick: ($event) => setActive(realIndex(index))
					}, [renderSlot(_ctx.$slots, "indicator", {
						item,
						index,
						active: realIndex(index) === activeIndex.value
					}, () => [_cache[2] || (_cache[2] = createBaseVNode("span", { class: "re-carousel__indicator-dot" }, null, -1))], true)], 14, _hoisted_5);
				}), 128))])) : createCommentVNode("", true)
			], 34);
		};
	}
}), [["__scopeId", "data-v-786fd9b7"]]);
//#endregion
//#region ../../packages/ui/src/components/ReCarousel/index.ts
var plugin = { install(app) {
	app.component("ReCarousel", ReCarousel_default$1);
} };
var ReCarousel_default = ReCarousel_default$1;
//#endregion
export { ReCarousel_default as default, plugin as install };
