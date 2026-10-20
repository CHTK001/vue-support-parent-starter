import { b as createElementBlock, et as mergeProps, k as defineComponent, mt as openBlock, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReForm/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "rm-form__actions"
};
//#endregion
//#region ../../packages/ui/src/components/ReForm/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReFormModern",
	inheritAttrs: true,
	__name: "Modern",
	props: {
		labelWidth: { default: "100px" },
		inline: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	setup(__props) {
		/**
		* ReForm Modern 布局 —— 现代化扁平表单
		*
		* 设计要点：
		*   - 卡片式分组容器（subtle 背景 + 大圆角 + 轻阴影）
		*   - label 升级：字号 + 字重 + 颜色 + 字距 + 必填星号主色化
		*   - 表单项扁平 0 margin，gap 统一控制间距
		*   - focus 态：内容区边框主色化 + 轻光晕
		*   - error 态：红色边框 + 红色浅底 + 圆角错误提示
		*   - disabled 态：灰度 + 禁止光标
		*   - actions 区：subtle 背景分隔 + 圆角按钮容器
		*   - 全量使用 --rm-* 设计令牌，视觉与其他 Modern 组件统一
		*/
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({ class: ["rm-form", {
				"rm-form--inline": __props.inline,
				"rm-form--disabled": __props.disabled
			}] }, _ctx.$attrs), [renderSlot(_ctx.$slots, "default", {}, void 0, true), _ctx.$slots.actions ? (openBlock(), createElementBlock("div", _hoisted_1, [renderSlot(_ctx.$slots, "actions", {}, void 0, true)])) : renderSlot(_ctx.$slots, "actions", {}, void 0, true, 1)], 16);
		};
	}
}), [["__scopeId", "data-v-aeeb9ed4"]]);
//#endregion
export { Modern_default as default };
