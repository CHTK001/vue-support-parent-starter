import { D as createVNode, Ht as watch, L as getCurrentInstance, On as unref, Tn as toRefs, _ as createBaseVNode, b as createElementBlock, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../node_modules/.pnpm/vue3-compare-image@1.2.6_vue@3.5.40_typescript@5.9.3_/node_modules/vue3-compare-image/dist/components/VueCompareImage.vue
var _hoisted_1$1 = ["innerHTML"];
var _hoisted_2 = ["id"];
var _hoisted_3 = ["alt", "src"];
var _hoisted_4 = ["alt", "src"];
var _hoisted_5 = ["innerHTML"];
var _sfc_main = {
	__name: "VueCompareImage",
	props: {
		aspectRatio: {
			type: String,
			required: false,
			default: "wider"
		},
		handle: {
			type: [
				String,
				Number,
				Boolean
			],
			required: false
		},
		handleSize: {
			type: Number,
			required: false,
			default: 40
		},
		hover: {
			type: Boolean,
			required: false,
			default: false
		},
		slideOnClick: {
			type: Boolean,
			required: false,
			default: true
		},
		keyboard: {
			type: Boolean,
			required: false,
			default: false
		},
		keyboardStep: {
			type: Number,
			required: false,
			default: .01
		},
		leftImage: {
			type: String,
			required: true
		},
		leftImageAlt: {
			type: String,
			required: false
		},
		leftImageCss: {
			type: Object,
			required: false
		},
		leftImageLabel: {
			type: String,
			required: false
		},
		onSliderPositionChange: {
			type: Function,
			required: false,
			default: () => {}
		},
		rightImage: {
			type: String,
			required: true
		},
		rightImageAlt: {
			type: String,
			required: false
		},
		rightImageCss: {
			type: Object,
			required: false
		},
		rightImageLabel: {
			type: String,
			required: false
		},
		skeleton: {
			type: [
				String,
				Number,
				Boolean
			],
			required: false
		},
		sliderLineColor: {
			type: String,
			required: false,
			default: "#ffffff"
		},
		sliderLineWidth: {
			type: Number,
			required: false,
			default: 2
		},
		sliderPositionPercentage: {
			type: Number,
			required: false,
			default: .5
		},
		vertical: {
			type: Boolean,
			required: false,
			default: false
		}
	},
	emits: [
		"slideStart",
		"slideEnd",
		"isSliding"
	],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { aspectRatio, leftImage, leftImageAlt, leftImageLabel, leftImageCss, rightImage, rightImageAlt, rightImageLabel, rightImageCss, hover, handle, handleSize, sliderLineWidth, sliderPositionPercentage, skeleton, sliderLineColor, vertical, onSliderPositionChange, slideOnClick, keyboard, keyboardStep } = toRefs(props);
		const componentId = Math.random().toString(36).slice(2, 11);
		const horizontal = computed(() => !vertical.value);
		const containerRef = ref(null);
		const rightImageRef = ref(null);
		const leftImageRef = ref(null);
		const sliderPosition = ref(sliderPositionPercentage.value);
		const containerWidth = ref(0);
		const containerHeight = ref(0);
		const leftImgLoaded = ref(false);
		const rightImgLoaded = ref(false);
		const isSliding = ref(false);
		let resizeObserver = null;
		const allImagesLoaded = computed(() => leftImgLoaded.value && rightImgLoaded.value);
		const rightImageClip = computed(() => sliderPosition.value);
		const leftImageClip = computed(() => 1 - sliderPosition.value);
		const containerStyle = computed(() => {
			return {
				display: "flex",
				height: `${containerHeight.value}px`
			};
		});
		const skeletonStyle = computed(() => {
			return {
				display: "flex",
				height: `${containerHeight.value || 250}px`
			};
		});
		const rightImageStyle = computed(() => {
			return {
				clipPath: horizontal.value ? `inset(0px 0px 0px ${containerWidth.value * rightImageClip.value}px)` : `inset(${containerHeight.value * rightImageClip.value}px 0px 0px 0px)`,
				...rightImageCss.value ?? {}
			};
		});
		const leftImageStyle = computed(() => {
			return {
				clipPath: horizontal.value ? `inset(0px ${containerWidth.value * leftImageClip.value}px 0px 0px)` : `inset(0px 0px ${containerHeight.value * leftImageClip.value}px 0px)`,
				...leftImageCss.value ?? {}
			};
		});
		const sliderStyle = computed(() => {
			return {
				cursor: !hover.value && horizontal.value ? "ew-resize !important" : !hover.value && !horizontal.value ? "ns-resize !important" : void 0,
				flexDirection: horizontal.value ? "column" : "row",
				height: horizontal.value ? "100%" : `${handleSize.value}px`,
				left: horizontal.value ? `${containerWidth.value * sliderPosition.value - handleSize.value / 2}px` : "0",
				top: horizontal.value ? "0" : `${containerHeight.value * sliderPosition.value - handleSize.value / 2}px`,
				width: horizontal.value ? `${handleSize.value}px` : "100%"
			};
		});
		const lineStyle = computed(() => {
			return {
				background: sliderLineColor.value,
				height: horizontal.value ? "100%" : `${sliderLineWidth.value}px`,
				width: horizontal.value ? `${sliderLineWidth.value}px` : "100%"
			};
		});
		const handleDefaultStyle = computed(() => {
			return {
				border: `${sliderLineWidth.value}px solid ${sliderLineColor.value}`,
				height: `${handleSize.value}px`,
				width: `${handleSize.value}px`,
				transform: horizontal.value ? "none" : "rotate(90deg)"
			};
		});
		const leftArrowStyle = computed(() => {
			return {
				border: `inset ${handleSize.value * .15}px rgba(0,0,0,0)`,
				borderRight: `${handleSize.value * .15}px solid ${sliderLineColor.value}`,
				marginLeft: `-${handleSize.value * .25}px`,
				marginRight: `${handleSize.value * .25}px`
			};
		});
		const rightArrowStyle = computed(() => {
			return {
				border: `inset ${handleSize.value * .15}px rgba(0,0,0,0)`,
				borderLeft: `${handleSize.value * .15}px solid ${sliderLineColor.value}`,
				marginRight: `-${handleSize.value * .25}px`
			};
		});
		const leftLabelStyle = computed(() => {
			return {
				left: horizontal.value ? "5%" : "50%",
				opacity: isSliding.value ? 0 : 1,
				top: horizontal.value ? "50%" : "3%",
				transform: horizontal.value ? "translate(0,-50%)" : "translate(-50%, 0)"
			};
		});
		const rightLabelStyle = computed(() => {
			return {
				opacity: isSliding.value ? 0 : 1,
				left: horizontal.value ? "unset" : "50%",
				right: horizontal.value ? "5%" : "unset",
				top: horizontal.value ? "50%" : "unset",
				bottom: horizontal.value ? "unset" : "3%",
				transform: horizontal.value ? "translate(0,-50%)" : "translate(-50%, 0)"
			};
		});
		const leftLabelContainerStyle = computed(() => {
			return { clip: horizontal.value ? `rect(auto, ${containerWidth.value * sliderPosition.value}px, auto, auto)` : `rect(auto, auto, ${containerHeight.value * sliderPosition.value}px, auto)` };
		});
		const rightLabelContainerStyle = computed(() => {
			return { clipPath: horizontal.value ? `inset(0px 0px 0px ${containerWidth.value * rightImageClip.value}px)` : `inset(${containerHeight.value * rightImageClip.value}px 0px 0px 0px)` };
		});
		function handleSliding(event) {
			if (!rightImageRef.value) return;
			const e = event;
			const cursorXfromViewport = e.touches ? e.touches[0].pageX : e.pageX;
			const cursorYfromViewport = e.touches ? e.touches[0].pageY : e.pageY;
			const cursorXfromWindow = cursorXfromViewport - window.pageXOffset;
			const cursorYfromWindow = cursorYfromViewport - window.pageYOffset;
			const imagePosition = rightImageRef.value.getBoundingClientRect();
			let pos = horizontal.value ? cursorXfromWindow - imagePosition.left : cursorYfromWindow - imagePosition.top;
			const minPos = 0 + sliderLineWidth.value / 2;
			const maxPos = horizontal.value ? containerWidth.value - sliderLineWidth.value / 2 : containerHeight.value - sliderLineWidth.value / 2;
			if (pos < minPos) pos = minPos;
			if (pos > maxPos) pos = maxPos;
			sliderPosition.value = horizontal.value ? pos / containerWidth.value : pos / containerHeight.value;
			if (onSliderPositionChange.value) onSliderPositionChange.value(horizontal.value ? pos / containerWidth.value : pos / containerHeight.value);
		}
		function startSliding(e) {
			isSliding.value = true;
			emit("slideStart", sliderPosition.value);
			emit("isSliding", isSliding.value);
			if (!horizontal.value) e.preventDefault();
			else if (!("touches" in e)) e.preventDefault();
			if (slideOnClick.value) handleSliding(e);
			window.addEventListener("mousemove", handleSliding);
			window.addEventListener("touchmove", handleSliding);
			window.addEventListener("mouseup", finishSliding);
			window.addEventListener("touchend", finishSliding);
		}
		function finishSliding() {
			isSliding.value = false;
			emit("slideEnd", sliderPosition.value);
			emit("isSliding", isSliding.value);
			window.removeEventListener("mousemove", handleSliding);
			window.removeEventListener("touchmove", handleSliding);
			window.removeEventListener("mouseup", finishSliding);
			window.removeEventListener("touchend", finishSliding);
		}
		function handleFocusIn() {
			if (keyboard.value) window.addEventListener("keydown", handleKeyDown);
		}
		function handleFocusOut() {
			if (keyboard.value) window.removeEventListener("keydown", handleKeyDown);
		}
		function handleOnClick() {
			if (keyboard.value) window.addEventListener("keydown", handleKeyDown);
		}
		function handleOnClickOutside(event) {
			if (containerRef.value && event.target instanceof Node && !containerRef.value.contains(event.target)) {
				containerRef.value.blur();
				window.removeEventListener("keydown", handleKeyDown);
			}
		}
		function handleKeyDown(e) {
			if (e.key === "ArrowDown" && !horizontal.value) {
				e.preventDefault();
				if (sliderPosition.value + keyboardStep.value > 1) sliderPosition.value = 1;
				else sliderPosition.value += keyboardStep.value;
			} else if (e.key === "ArrowUp" && !horizontal.value) {
				e.preventDefault();
				if (sliderPosition.value - keyboardStep.value < 0) sliderPosition.value = 0;
				else sliderPosition.value -= keyboardStep.value;
			} else if (e.key === "ArrowLeft" && horizontal.value) {
				e.preventDefault();
				if (sliderPosition.value - keyboardStep.value < 0) sliderPosition.value = 0;
				else sliderPosition.value -= keyboardStep.value;
			} else if (e.key === "ArrowRight" && horizontal.value) {
				e.preventDefault();
				if (sliderPosition.value + keyboardStep.value > 1) sliderPosition.value = 1;
				else sliderPosition.value += keyboardStep.value;
			}
		}
		function forceRenderHover() {
			getCurrentInstance()?.proxy?.$forceUpdate();
			const containerElement = containerRef.value;
			if (props.hover) {
				containerElement?.addEventListener("mousemove", startSliding);
				containerElement?.addEventListener("mouseleave", finishSliding);
			} else {
				containerElement?.removeEventListener("mousemove", startSliding);
				containerElement?.removeEventListener("mouseleave", finishSliding);
				containerElement?.addEventListener("mouseup", finishSliding);
				containerElement?.addEventListener("touchend", finishSliding);
			}
		}
		onMounted(() => {
			const containerElement = containerRef.value;
			if (!containerElement) return;
			resizeObserver = new ResizeObserver(([entry]) => {
				const currentContainerWidth = entry.target.getBoundingClientRect().width;
				containerWidth.value = currentContainerWidth;
			});
			resizeObserver.observe(containerElement);
		});
		onMounted(() => {
			const containerElement = containerRef.value;
			if (props.hover) {
				containerElement?.addEventListener("mousemove", startSliding);
				containerElement?.addEventListener("mouseleave", finishSliding);
			}
			window.addEventListener("click", handleOnClickOutside);
		});
		onBeforeUnmount(() => {
			const containerElement = containerRef.value;
			resizeObserver?.disconnect();
			resizeObserver = null;
			containerElement?.removeEventListener("mousemove", startSliding);
			containerElement?.removeEventListener("mouseleave", finishSliding);
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("click", handleOnClickOutside);
			window.removeEventListener("mousemove", handleSliding);
			window.removeEventListener("touchmove", handleSliding);
			window.removeEventListener("mouseup", finishSliding);
			window.removeEventListener("touchend", finishSliding);
		});
		watch(leftImageRef, () => {
			leftImgLoaded.value = false;
			if (leftImageRef.value?.complete) leftImgLoaded.value = true;
		});
		watch(rightImageRef, () => {
			rightImgLoaded.value = false;
			if (rightImageRef.value?.complete) rightImgLoaded.value = true;
		});
		watch(hover, () => {
			forceRenderHover();
		});
		watch([
			() => containerWidth.value,
			() => leftImgLoaded.value,
			() => rightImgLoaded.value
		], () => {
			if (!leftImageRef.value || !rightImageRef.value) return;
			const leftImageWidthHeightRatio = leftImageRef.value.naturalHeight / leftImageRef.value.naturalWidth;
			const rightImageWidthHeightRatio = rightImageRef.value.naturalHeight / rightImageRef.value.naturalWidth;
			const idealWidthHeightRatio = aspectRatio.value === "taller" ? Math.max(leftImageWidthHeightRatio, rightImageWidthHeightRatio) : Math.min(leftImageWidthHeightRatio, rightImageWidthHeightRatio);
			const idealContainerHeight = containerWidth.value * idealWidthHeightRatio;
			containerHeight.value = idealContainerHeight;
		});
		return (_ctx, _cache) => {
			return unref(skeleton) && !allImagesLoaded.value ? (openBlock(), createElementBlock("div", {
				key: 0,
				"data-testid": "skeleton",
				style: normalizeStyle(skeletonStyle.value),
				innerHTML: unref(skeleton)
			}, null, 12, _hoisted_1$1)) : (openBlock(), createElementBlock("div", {
				key: 1,
				id: unref(componentId),
				ref_key: "containerRef",
				ref: containerRef,
				class: "vci--container",
				tabindex: "0",
				"data-testid": "vci-container",
				style: normalizeStyle(containerStyle.value),
				onClick: handleOnClick,
				onTouchstart: startSliding,
				onTouchend: finishSliding,
				onFocusin: handleFocusIn,
				onFocusout: handleFocusOut,
				onMousedown: startSliding,
				onMouseup: finishSliding
			}, [
				createBaseVNode("img", {
					ref_key: "rightImageRef",
					ref: rightImageRef,
					class: "vci--right-image",
					alt: unref(rightImageAlt),
					"data-testid": "right-image",
					src: unref(rightImage),
					style: normalizeStyle(rightImageStyle.value),
					onLoad: _cache[0] || (_cache[0] = ($event) => rightImgLoaded.value = true)
				}, null, 44, _hoisted_3),
				createBaseVNode("img", {
					ref_key: "leftImageRef",
					ref: leftImageRef,
					class: "vci--left-image",
					alt: unref(leftImageAlt),
					"data-testid": "left-image",
					src: unref(leftImage),
					style: normalizeStyle(leftImageStyle.value),
					onLoad: _cache[1] || (_cache[1] = ($event) => leftImgLoaded.value = true)
				}, null, 44, _hoisted_4),
				createBaseVNode("div", {
					class: "vci--slider",
					style: normalizeStyle(sliderStyle.value)
				}, [
					createBaseVNode("div", {
						class: "vci--slider-line",
						style: normalizeStyle(lineStyle.value)
					}, null, 4),
					unref(handle) ? (openBlock(), createElementBlock("div", {
						key: 0,
						class: "vci--custom-handle",
						innerHTML: unref(handle)
					}, null, 8, _hoisted_5)) : (openBlock(), createElementBlock("div", {
						key: 1,
						class: "vci--default-handle",
						style: normalizeStyle(handleDefaultStyle.value)
					}, [createBaseVNode("div", {
						class: "vci--left-arrow",
						style: normalizeStyle(leftArrowStyle.value)
					}, null, 4), createBaseVNode("div", {
						class: "vci--right-arrow",
						style: normalizeStyle(rightArrowStyle.value)
					}, null, 4)], 4)),
					createBaseVNode("div", {
						class: "vci--slider-line",
						style: normalizeStyle(lineStyle.value)
					}, null, 4)
				], 4),
				unref(leftImageLabel) ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: "vci--left-label-container",
					style: normalizeStyle(leftLabelContainerStyle.value)
				}, [createBaseVNode("div", {
					class: "vci--left-label",
					"data-testid": "left-image-label",
					style: normalizeStyle(leftLabelStyle.value)
				}, toDisplayString(unref(leftImageLabel)), 5)], 4)) : createCommentVNode("", true),
				unref(rightImageLabel) ? (openBlock(), createElementBlock("div", {
					key: 1,
					class: "vci--right-label-container",
					style: normalizeStyle(rightLabelContainerStyle.value)
				}, [createBaseVNode("div", {
					class: "vci--right-label",
					"data-testid": "right-image-label",
					style: normalizeStyle(rightLabelStyle.value)
				}, toDisplayString(unref(rightImageLabel)), 5)], 4)) : createCommentVNode("", true)
			], 44, _hoisted_2));
		};
	}
};
//#endregion
//#region ../../packages/ui/src/components/ReImageCompare/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-image-compare" };
//#endregion
//#region ../../packages/ui/src/components/ReImageCompare/index.vue
var ReImageCompare_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		leftImage: {},
		rightImage: {},
		leftLabel: { default: "" },
		rightLabel: { default: "" },
		leftImageCss: { default: () => ({}) },
		rightImageCss: { default: () => ({}) },
		handle: { default: "" },
		slider: { default: "" },
		hover: {
			type: Boolean,
			default: false
		},
		defaultSliderHandle: { default: 50 }
	},
	setup(__props) {
		/**
		* ReImageCompare —— 图片左右对比组件
		*
		* 基于 vue3-compare-image，支持拖拽对比
		*   <ReImageCompare left-image="a.png" right-image="b.png" />
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createVNode(unref(_sfc_main), {
				"left-image": __props.leftImage,
				"left-image-css": __props.leftImageCss,
				"left-image-label": __props.leftLabel,
				"right-image": __props.rightImage,
				"right-image-css": __props.rightImageCss,
				"right-image-label": __props.rightLabel,
				handle: __props.handle,
				slider: __props.slider,
				hover: __props.hover,
				"default-slider-handle": __props.defaultSliderHandle
			}, null, 8, [
				"left-image",
				"left-image-css",
				"left-image-label",
				"right-image",
				"right-image-css",
				"right-image-label",
				"handle",
				"slider",
				"hover",
				"default-slider-handle"
			])]);
		};
	}
}), [["__scopeId", "data-v-4c4c05f9"]]);
//#endregion
//#region ../../packages/ui/src/components/ReImageCompare/index.ts
var plugin = { install(app) {
	app.component("ReImageCompare", ReImageCompare_default$1);
} };
var ReImageCompare_default = ReImageCompare_default$1;
//#endregion
export { ReImageCompare_default as default, plugin as install };
