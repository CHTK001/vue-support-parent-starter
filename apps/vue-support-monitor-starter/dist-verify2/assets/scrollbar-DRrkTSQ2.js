import { $n as normalizeClass, D as createVNode, Hn as isObject, Ht as watch, J as inject, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, gn as reactive, gt as provide, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, nt as onActivated, o as Fragment, pt as onUpdated, qt as withCtx, tt as nextTick, v as createBlock, vn as ref, wn as toRef, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { S as vShow, t as Transition, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { a as throwError, c as definePropType, f as isNumber, i as debugWarn, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { a as isClient } from "./dist-DI3cGDuP.js";
import { h as useResizeObserver, u as useEventListener } from "./dist-Clzx2YUA.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { t as useAriaProps } from "./use-aria-VmjVV7Ut.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { t as isGreaterThan } from "./numbers-I--Pu7qj.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/scrollbar.mjs
/**
* @deprecated Removed after 3.0.0, Use `ScrollbarProps` instead.
*/
var scrollbarProps = buildProps({
	/**
	* @description trigger distance(px)
	*/
	distance: {
		type: Number,
		default: 0
	},
	/**
	* @description height of scrollbar
	*/
	height: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description max height of scrollbar
	*/
	maxHeight: {
		type: [String, Number],
		default: ""
	},
	/**
	* @description whether to use the native scrollbar
	*/
	native: Boolean,
	/**
	* @description style of wrap
	*/
	wrapStyle: {
		type: definePropType([
			String,
			Object,
			Array,
			Boolean
		]),
		default: ""
	},
	/**
	* @description class of wrap
	*/
	wrapClass: {
		type: [String, Array],
		default: ""
	},
	/**
	* @description class of view
	*/
	viewClass: {
		type: [String, Array],
		default: ""
	},
	/**
	* @description style of view
	*/
	viewStyle: {
		type: definePropType([
			String,
			Object,
			Array,
			Boolean
		]),
		default: ""
	},
	/**
	* @description do not respond to container size changes, if the container size does not change, it is better to set it to optimize performance
	*/
	noresize: Boolean,
	/**
	* @description element tag of the view
	*/
	tag: {
		type: String,
		default: "div"
	},
	/**
	* @description always show
	*/
	always: Boolean,
	/**
	* @description minimum size of scrollbar
	*/
	minSize: {
		type: Number,
		default: 20
	},
	/**
	* @description Wrap tabindex
	*/
	tabindex: {
		type: [String, Number],
		default: void 0
	},
	/**
	* @description id of view
	*/
	id: String,
	/**
	* @description role of view
	*/
	role: String,
	...useAriaProps(["ariaLabel", "ariaOrientation"])
});
var scrollbarEmits = {
	"end-reached": (direction) => [
		"left",
		"right",
		"top",
		"bottom"
	].includes(direction),
	scroll: ({ scrollTop, scrollLeft }) => [scrollTop, scrollLeft].every(isNumber)
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/util.mjs
var BAR_MAP = {
	vertical: {
		offset: "offsetHeight",
		scroll: "scrollTop",
		scrollSize: "scrollHeight",
		size: "height",
		key: "vertical",
		axis: "Y",
		client: "clientY",
		direction: "top"
	},
	horizontal: {
		offset: "offsetWidth",
		scroll: "scrollLeft",
		scrollSize: "scrollWidth",
		size: "width",
		key: "horizontal",
		axis: "X",
		client: "clientX",
		direction: "left"
	}
};
var renderThumbStyle = ({ move, size, bar }) => ({
	[bar.size]: size,
	transform: `translate${bar.axis}(${move}%)`
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/thumb.mjs
/**
* @deprecated Removed after 3.0.0, Use `ThumbProps` instead.
*/
var thumbProps = buildProps({
	vertical: Boolean,
	size: String,
	move: Number,
	ratio: {
		type: Number,
		required: true
	},
	always: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/constants.mjs
var scrollbarContextKey = Symbol("scrollbarContextKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/bar.mjs
/**
* @deprecated Removed after 3.0.0, Use `BarProps` instead.
*/
var barProps = buildProps({
	always: {
		type: Boolean,
		default: true
	},
	minSize: {
		type: Number,
		required: true
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/thumb.vue_vue_type_script_setup_true_lang.mjs
var COMPONENT_NAME$1 = "Thumb";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/thumb2.mjs
var thumb_default = /* @__PURE__ */ defineComponent({
	__name: "thumb",
	props: thumbProps,
	setup(__props) {
		const props = __props;
		const scrollbar = inject(scrollbarContextKey);
		const ns = useNamespace("scrollbar");
		if (!scrollbar) throwError(COMPONENT_NAME$1, "can not inject scrollbar context");
		const instance = ref();
		const thumb = ref();
		const thumbState = ref({});
		const visible = ref(false);
		let cursorDown = false;
		let cursorLeave = false;
		let baseScrollHeight = 0;
		let baseScrollWidth = 0;
		let originalOnSelectStart = isClient ? document.onselectstart : null;
		const bar = computed(() => BAR_MAP[props.vertical ? "vertical" : "horizontal"]);
		const thumbStyle = computed(() => renderThumbStyle({
			size: props.size,
			move: props.move,
			bar: bar.value
		}));
		const offsetRatio = computed(() => instance.value[bar.value.offset] ** 2 / scrollbar.wrapElement[bar.value.scrollSize] / props.ratio / thumb.value[bar.value.offset]);
		const clickThumbHandler = (e) => {
			e.stopPropagation();
			if (e.ctrlKey || [1, 2].includes(e.button)) return;
			window.getSelection()?.removeAllRanges();
			startDrag(e);
			const el = e.currentTarget;
			if (!el) return;
			thumbState.value[bar.value.axis] = el[bar.value.offset] - (e[bar.value.client] - el.getBoundingClientRect()[bar.value.direction]);
		};
		const clickTrackHandler = (e) => {
			if (!thumb.value || !instance.value || !scrollbar.wrapElement) return;
			const thumbPositionPercentage = (Math.abs(e.target.getBoundingClientRect()[bar.value.direction] - e[bar.value.client]) - thumb.value[bar.value.offset] / 2) * 100 * offsetRatio.value / instance.value[bar.value.offset];
			scrollbar.wrapElement[bar.value.scroll] = thumbPositionPercentage * scrollbar.wrapElement[bar.value.scrollSize] / 100;
		};
		const startDrag = (e) => {
			e.stopImmediatePropagation();
			cursorDown = true;
			baseScrollHeight = scrollbar.wrapElement.scrollHeight;
			baseScrollWidth = scrollbar.wrapElement.scrollWidth;
			document.addEventListener("mousemove", mouseMoveDocumentHandler);
			document.addEventListener("mouseup", mouseUpDocumentHandler);
			originalOnSelectStart = document.onselectstart;
			document.onselectstart = () => false;
		};
		const mouseMoveDocumentHandler = (e) => {
			if (!instance.value || !thumb.value) return;
			if (cursorDown === false) return;
			const prevPage = thumbState.value[bar.value.axis];
			if (!prevPage) return;
			const thumbPositionPercentage = ((instance.value.getBoundingClientRect()[bar.value.direction] - e[bar.value.client]) * -1 - (thumb.value[bar.value.offset] - prevPage)) * 100 * offsetRatio.value / instance.value[bar.value.offset];
			if (bar.value.scroll === "scrollLeft") scrollbar.wrapElement[bar.value.scroll] = thumbPositionPercentage * baseScrollWidth / 100;
			else scrollbar.wrapElement[bar.value.scroll] = thumbPositionPercentage * baseScrollHeight / 100;
		};
		const mouseUpDocumentHandler = () => {
			cursorDown = false;
			thumbState.value[bar.value.axis] = 0;
			document.removeEventListener("mousemove", mouseMoveDocumentHandler);
			document.removeEventListener("mouseup", mouseUpDocumentHandler);
			restoreOnselectstart();
			if (cursorLeave) visible.value = false;
		};
		const mouseMoveScrollbarHandler = () => {
			cursorLeave = false;
			visible.value = !!props.size;
		};
		const mouseLeaveScrollbarHandler = () => {
			cursorLeave = true;
			visible.value = cursorDown;
		};
		onBeforeUnmount(() => {
			restoreOnselectstart();
			document.removeEventListener("mouseup", mouseUpDocumentHandler);
		});
		const restoreOnselectstart = () => {
			if (document.onselectstart !== originalOnSelectStart) document.onselectstart = originalOnSelectStart;
		};
		useEventListener(toRef(scrollbar, "scrollbarElement"), "mousemove", mouseMoveScrollbarHandler);
		useEventListener(toRef(scrollbar, "scrollbarElement"), "mouseleave", mouseLeaveScrollbarHandler);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(Transition, {
				name: unref(ns).b("fade"),
				persisted: ""
			}, {
				default: withCtx(() => [withDirectives(createBaseVNode("div", {
					ref_key: "instance",
					ref: instance,
					class: normalizeClass([unref(ns).e("bar"), unref(ns).is(bar.value.key)]),
					onMousedown: clickTrackHandler,
					onClick: _cache[0] || (_cache[0] = withModifiers(() => {}, ["stop"]))
				}, [createBaseVNode("div", {
					ref_key: "thumb",
					ref: thumb,
					class: normalizeClass(unref(ns).e("thumb")),
					style: normalizeStyle(thumbStyle.value),
					onMousedown: clickThumbHandler
				}, null, 38)], 34), [[vShow, __props.always || visible.value]])]),
				_: 1
			}, 8, ["name"]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/bar2.mjs
var bar_default = /* @__PURE__ */ defineComponent({
	__name: "bar",
	props: barProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const scrollbar = inject(scrollbarContextKey);
		const moveX = ref(0);
		const moveY = ref(0);
		const sizeWidth = ref("");
		const sizeHeight = ref("");
		const ratioY = ref(1);
		const ratioX = ref(1);
		const handleScroll = (wrap) => {
			if (wrap) {
				const offsetHeight = wrap.offsetHeight - 4;
				const offsetWidth = wrap.offsetWidth - 4;
				moveY.value = wrap.scrollTop * 100 / offsetHeight * ratioY.value;
				moveX.value = wrap.scrollLeft * 100 / offsetWidth * ratioX.value;
			}
		};
		const update = () => {
			const wrap = scrollbar?.wrapElement;
			if (!wrap) return;
			const offsetHeight = wrap.offsetHeight - 4;
			const offsetWidth = wrap.offsetWidth - 4;
			const originalHeight = offsetHeight ** 2 / wrap.scrollHeight;
			const originalWidth = offsetWidth ** 2 / wrap.scrollWidth;
			const height = Math.max(originalHeight, props.minSize);
			const width = Math.max(originalWidth, props.minSize);
			ratioY.value = originalHeight / (offsetHeight - originalHeight) / (height / (offsetHeight - height));
			ratioX.value = originalWidth / (offsetWidth - originalWidth) / (width / (offsetWidth - width));
			sizeHeight.value = height + 4 < offsetHeight ? `${height}px` : "";
			sizeWidth.value = width + 4 < offsetWidth ? `${width}px` : "";
		};
		__expose({
			handleScroll,
			update
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock(Fragment, null, [createVNode(thumb_default, {
				move: moveX.value,
				ratio: ratioX.value,
				size: sizeWidth.value,
				always: __props.always
			}, null, 8, [
				"move",
				"ratio",
				"size",
				"always"
			]), createVNode(thumb_default, {
				move: moveY.value,
				ratio: ratioY.value,
				size: sizeHeight.value,
				vertical: "",
				always: __props.always
			}, null, 8, [
				"move",
				"ratio",
				"size",
				"always"
			])], 64);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/src/scrollbar.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["tabindex"];
var COMPONENT_NAME = "ElScrollbar";
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/scrollbar/index.mjs
var ElScrollbar = withInstall(/* @__PURE__ */ defineComponent({
	name: COMPONENT_NAME,
	__name: "scrollbar",
	props: scrollbarProps,
	emits: scrollbarEmits,
	setup(__props, { expose: __expose, emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const ns = useNamespace("scrollbar");
		let stopResizeObserver = void 0;
		let stopWrapResizeObserver = void 0;
		let stopResizeListener = void 0;
		let wrapScrollTop = 0;
		let wrapScrollLeft = 0;
		let direction = "";
		const distanceScrollState = {
			bottom: false,
			top: false,
			right: false,
			left: false
		};
		const scrollbarRef = ref();
		const wrapRef = ref();
		const resizeRef = ref();
		const barRef = ref();
		const wrapStyle = computed(() => {
			const style = {};
			const height = addUnit(props.height);
			const maxHeight = addUnit(props.maxHeight);
			if (height) style.height = height;
			if (maxHeight) style.maxHeight = maxHeight;
			return [props.wrapStyle, style];
		});
		const wrapKls = computed(() => {
			return [
				props.wrapClass,
				ns.e("wrap"),
				{ [ns.em("wrap", "hidden-default")]: !props.native }
			];
		});
		const resizeKls = computed(() => {
			return [ns.e("view"), props.viewClass];
		});
		const shouldSkipDirection = (direction) => {
			return distanceScrollState[direction] ?? false;
		};
		const DIRECTION_PAIRS = {
			top: "bottom",
			bottom: "top",
			left: "right",
			right: "left"
		};
		const updateTriggerStatus = (arrivedStates) => {
			const oppositeDirection = DIRECTION_PAIRS[direction];
			if (!oppositeDirection) return;
			const arrived = arrivedStates[direction];
			const oppositeArrived = arrivedStates[oppositeDirection];
			if (arrived && !distanceScrollState[direction]) distanceScrollState[direction] = true;
			if (!oppositeArrived && distanceScrollState[oppositeDirection]) distanceScrollState[oppositeDirection] = false;
		};
		const handleScroll = () => {
			if (wrapRef.value) {
				barRef.value?.handleScroll(wrapRef.value);
				const prevTop = wrapScrollTop;
				const prevLeft = wrapScrollLeft;
				wrapScrollTop = wrapRef.value.scrollTop;
				wrapScrollLeft = wrapRef.value.scrollLeft;
				const arrivedStates = {
					bottom: !isGreaterThan(wrapRef.value.scrollHeight - props.distance, wrapRef.value.clientHeight + wrapScrollTop),
					top: wrapScrollTop <= props.distance && prevTop !== 0,
					right: !isGreaterThan(wrapRef.value.scrollWidth - props.distance, wrapRef.value.clientWidth + wrapScrollLeft) && prevLeft !== wrapScrollLeft,
					left: wrapScrollLeft <= props.distance && prevLeft !== 0
				};
				emit("scroll", {
					scrollTop: wrapScrollTop,
					scrollLeft: wrapScrollLeft
				});
				if (prevTop !== wrapScrollTop) direction = wrapScrollTop > prevTop ? "bottom" : "top";
				if (prevLeft !== wrapScrollLeft) direction = wrapScrollLeft > prevLeft ? "right" : "left";
				if (props.distance > 0) {
					if (shouldSkipDirection(direction)) return;
					updateTriggerStatus(arrivedStates);
				}
				if (arrivedStates[direction]) emit("end-reached", direction);
			}
		};
		function scrollTo(arg1, arg2) {
			if (isObject(arg1)) wrapRef.value.scrollTo(arg1);
			else if (isNumber(arg1) && isNumber(arg2)) wrapRef.value.scrollTo(arg1, arg2);
		}
		const setScrollTop = (value) => {
			if (!isNumber(value)) {
				debugWarn(COMPONENT_NAME, "value must be a number");
				return;
			}
			wrapRef.value.scrollTop = value;
		};
		const setScrollLeft = (value) => {
			if (!isNumber(value)) {
				debugWarn(COMPONENT_NAME, "value must be a number");
				return;
			}
			wrapRef.value.scrollLeft = value;
		};
		const update = () => {
			barRef.value?.update();
			distanceScrollState[direction] = false;
			if (wrapRef.value) barRef.value?.handleScroll(wrapRef.value);
		};
		watch(() => props.noresize, (noresize) => {
			if (noresize) {
				stopResizeObserver?.();
				stopWrapResizeObserver?.();
				stopResizeListener?.();
			} else {
				({stop: stopResizeObserver} = useResizeObserver(resizeRef, update));
				({stop: stopWrapResizeObserver} = useResizeObserver(wrapRef, update));
				stopResizeListener = useEventListener("resize", update);
			}
		}, { immediate: true });
		watch(() => [props.maxHeight, props.height], () => {
			if (!props.native) nextTick(() => {
				update();
			});
		});
		provide(scrollbarContextKey, reactive({
			scrollbarElement: scrollbarRef,
			wrapElement: wrapRef
		}));
		onActivated(() => {
			if (wrapRef.value) {
				wrapRef.value.scrollTop = wrapScrollTop;
				wrapRef.value.scrollLeft = wrapScrollLeft;
			}
		});
		onMounted(() => {
			if (!props.native) nextTick(() => {
				update();
			});
		});
		onUpdated(() => update());
		__expose({
			/** @description scrollbar wrap ref */
			wrapRef,
			/** @description update scrollbar state manually */
			update,
			/** @description scrolls to a particular set of coordinates */
			scrollTo,
			/** @description set distance to scroll top */
			setScrollTop,
			/** @description set distance to scroll left */
			setScrollLeft,
			/** @description handle scroll event */
			handleScroll
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "scrollbarRef",
				ref: scrollbarRef,
				class: normalizeClass(unref(ns).b())
			}, [createBaseVNode("div", {
				ref_key: "wrapRef",
				ref: wrapRef,
				class: normalizeClass(wrapKls.value),
				style: normalizeStyle(wrapStyle.value),
				tabindex: __props.tabindex,
				onScroll: handleScroll
			}, [(openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
				id: __props.id,
				ref_key: "resizeRef",
				ref: resizeRef,
				class: normalizeClass(resizeKls.value),
				style: normalizeStyle(__props.viewStyle),
				role: __props.role,
				"aria-label": __props.ariaLabel,
				"aria-orientation": __props.ariaOrientation
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 8, [
				"id",
				"class",
				"style",
				"role",
				"aria-label",
				"aria-orientation"
			]))], 46, _hoisted_1), !__props.native ? (openBlock(), createBlock(bar_default, {
				key: 0,
				ref_key: "barRef",
				ref: barRef,
				always: __props.always,
				"min-size": __props.minSize
			}, null, 8, ["always", "min-size"])) : createCommentVNode("v-if", true)], 2);
		};
	}
}));
//#endregion
export { BAR_MAP as n, scrollbarEmits as r, ElScrollbar as t };
