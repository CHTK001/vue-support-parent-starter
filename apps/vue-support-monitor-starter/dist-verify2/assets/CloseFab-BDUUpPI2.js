const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/ReIcon-BR2mlkM9.js","assets/ReIcon-By12b2Y9.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/rolldown-runtime-CEgmsyvS.js","assets/theme-B9R3AFqb.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/src-DzQcKxHP.js"])))=>i.map(i=>d[i]);
import { D as createVNode, O as defineAsyncComponent, On as unref, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReDialog/CloseFab.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["title"];
//#endregion
//#region ../../packages/ui/src/components/ReDialog/CloseFab.vue
var CloseFab_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReDialogCloseFab",
	__name: "CloseFab",
	props: {
		color: { default: "rgba(0, 0, 0, 0.55)" },
		size: { default: 32 },
		title: { default: "关闭" }
	},
	emits: ["click"],
	setup(__props, { emit: __emit }) {
		/**
		* ReDialogCloseFab —— headless 模式下右上角圆形悬浮关闭按钮
		*
		* 圆心固定在右上角（top: 12px, right: 12px），z-index 高于 header。
		* 支持自定义背景色 / 颜色 / 尺寸。
		*/
		const ReIcon = defineAsyncComponent(() => __vitePreload(() => import("./ReIcon-BR2mlkM9.js").then((m) => m.default), __vite__mapDeps([0,1,2,3,4,5,6])));
		const props = __props;
		const emit = __emit;
		const style = computed(() => ({
			width: `${props.size}px`,
			height: `${props.size}px`,
			color: props.color
		}));
		function onClick(e) {
			emit("click", e);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("button", {
				type: "button",
				class: "re-dialog__close-fab",
				style: normalizeStyle(style.value),
				title: __props.title,
				"aria-label": "关闭弹窗",
				onClick
			}, [createVNode(unref(ReIcon), {
				name: "Close",
				size: Math.floor(__props.size * .55)
			}, null, 8, ["size"])], 12, _hoisted_1);
		};
	}
}), [["__scopeId", "data-v-805472ba"]]);
//#endregion
export { CloseFab_default as t };
