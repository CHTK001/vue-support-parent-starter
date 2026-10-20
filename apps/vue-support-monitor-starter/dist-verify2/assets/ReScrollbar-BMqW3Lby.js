import { et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#endregion
//#region ../../packages/ui/src/components/ReScrollbar/src/index.vue
var src_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		/**
		* 滚动条高度
		*/
		height: {
			type: [String, Number],
			default: ""
		},
		/**
		* 滚动条最大高度
		*/
		maxHeight: {
			type: [String, Number],
			default: ""
		},
		/**
		* 是否使用原生滚动条
		*/
		native: {
			type: Boolean,
			default: false
		},
		/**
		* 包装元素的样式
		*/
		wrapStyle: {
			type: [String, Object],
			default: ""
		},
		/**
		* 包装元素的 CSS 类名
		*/
		wrapClass: {
			type: [String, String],
			default: ""
		},
		/**
		* 视图元素的样式
		*/
		viewStyle: {
			type: [String, Object],
			default: ""
		},
		/**
		* 视图元素的 CSS 类名
		*/
		viewClass: {
			type: [String, String],
			default: ""
		},
		/**
		* 是否不响应容器大小变化
		*/
		noresize: {
			type: Boolean,
			default: false
		},
		/**
		* 包装元素的标签名
		*/
		tag: {
			type: String,
			default: "div"
		},
		/**
		* 是否始终显示滚动条
		*/
		always: {
			type: Boolean,
			default: false
		},
		/**
		* 滚动条的最小尺寸
		*/
		minSize: {
			type: Number,
			default: 20
		}
	},
	setup(__props) {
		/**
		* ScScrollbar 滚动条组件
		* 简单封装 Element Plus 的 ElScrollbar，支持主题切换
		*/
		const actualComponent = computed(() => ElScrollbar);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(actualComponent.value), mergeProps({
				class: "sc-scrollbar",
				height: __props.height,
				"max-height": __props.maxHeight,
				native: __props.native,
				"wrap-style": __props.wrapStyle,
				"wrap-class": __props.wrapClass,
				"view-style": __props.viewStyle,
				"view-class": __props.viewClass,
				noresize: __props.noresize,
				tag: __props.tag,
				always: __props.always,
				"min-size": __props.minSize
			}, _ctx.$attrs), {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
				_: 3
			}, 16, [
				"height",
				"max-height",
				"native",
				"wrap-style",
				"wrap-class",
				"view-style",
				"view-class",
				"noresize",
				"tag",
				"always",
				"min-size"
			]);
		};
	}
}), [["__scopeId", "data-v-25680d70"]]);
//#endregion
//#region ../../packages/ui/src/components/ReScrollbar/index.ts
var plugin = { install(app) {
	app.component("ReScrollbar", src_default);
} };
var ReScrollbar_default = src_default;
//#endregion
export { plugin as n, ReScrollbar_default as t };
