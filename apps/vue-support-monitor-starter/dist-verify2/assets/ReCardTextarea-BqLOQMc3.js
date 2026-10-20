import { E as createTextVNode, _ as createBaseVNode, b as createElementBlock, k as defineComponent, mt as openBlock, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReCardTextarea/index.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-card-textarea" };
var _hoisted_2 = { class: "re-card-textarea__card" };
var _hoisted_3 = [
	"value",
	"placeholder",
	"rows",
	"disabled",
	"readonly",
	"maxlength"
];
var _hoisted_4 = {
	key: 0,
	class: "re-card-textarea__desc"
};
//#endregion
//#region ../../packages/ui/src/components/ReCardTextarea/index.vue
var ReCardTextarea_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		modelValue: { default: "" },
		placeholder: { default: "" },
		rows: { default: 3 },
		disabled: {
			type: Boolean,
			default: false
		},
		readonly: {
			type: Boolean,
			default: false
		},
		maxlength: { default: void 0 },
		description: { default: "" },
		submitOnKeydown: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue", "submit"],
	setup(__props, { emit: __emit }) {
		/**
		* ReCardTextarea —— 卡片式多行文本输入框
		*
		* 视觉与 ReSelect 的 CardDropdown 卡片完全统一：
		*   - 圆角弧度一致（10px）
		*   - 边框粗细、浅灰底色、内缩阴影一致
		*   - 去掉右下角拉伸控件（resize: none）
		*   - 内外边距与下拉框卡片一致
		*
		* 用法：
		*   <ReCardTextarea v-model="prompt" placeholder="输入描述..." :rows="3"
		*     description="下方为卡片描述" />
		*/
		const props = __props;
		const emit = __emit;
		function onInput(e) {
			emit("update:modelValue", e.target.value);
		}
		function onKeydown(e) {
			if (props.submitOnKeydown && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
				e.preventDefault();
				emit("submit");
			}
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [createBaseVNode("textarea", {
				class: "re-card-textarea__input",
				value: __props.modelValue,
				placeholder: __props.placeholder,
				rows: __props.rows,
				disabled: __props.disabled,
				readonly: __props.readonly,
				maxlength: __props.maxlength,
				onInput,
				onKeydown
			}, null, 40, _hoisted_3)]), __props.description || _ctx.$slots.description ? (openBlock(), createElementBlock("div", _hoisted_4, [renderSlot(_ctx.$slots, "description", {}, () => [createTextVNode(toDisplayString(__props.description), 1)], true)])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-0777093e"]]);
//#endregion
export { ReCardTextarea_default as t };
