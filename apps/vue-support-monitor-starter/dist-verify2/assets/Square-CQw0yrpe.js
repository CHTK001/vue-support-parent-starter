import { $n as normalizeClass, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, o as Fragment, rr as toDisplayString, v as createBlock, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReSelect/layouts/Square.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = ["title", "onClick"];
var _hoisted_2 = {
	key: 1,
	class: "re-select-square__fallback"
};
var _hoisted_3 = {
	key: 2,
	class: "re-select-square__body"
};
var _hoisted_4 = { class: "re-select-square__label" };
var _hoisted_5 = {
	key: 0,
	class: "re-select-square__desc"
};
var _hoisted_6 = {
	key: 3,
	class: "re-select-square__label"
};
var _hoisted_7 = {
	key: 4,
	class: "re-select-square__check"
};
//#endregion
//#region ../../packages/ui/src/components/ReSelect/layouts/Square.vue
var Square_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "Square",
	props: {
		options: {},
		modelValue: { default: "" },
		multiple: {
			type: Boolean,
			default: false
		},
		size: { default: 22 },
		controlSize: { default: "default" },
		iconOnly: {
			type: Boolean,
			default: true
		},
		compact: {
			type: Boolean,
			default: true
		},
		vertical: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		/**
		* ReSelect Square 布局
		*
		* 横向排列方形按钮，点击切换选中（互斥单选）。
		* 支持两种显示模式（iconOnly）：
		*   - true（默认）：仅显示图标，隐藏文字
		*   - false：图标 + 文字
		* 支持 compact 紧凑模式（默认开启）：
		*   - 紧凑正方形按钮（iconOnly 时固定小宽高）
		*   - 关闭时为大卡片样式（图标在上、文字在下、留白更足）
		* 支持 vertical 竖向档（vertical=true）：一行一档、整行走菜单感底色，选中态是整行高亮 + 右侧对勾。
		* 选项图标通过 ReIcon 渲染，自动支持：
		*   - element-plus PascalCase
		*   - ep:xxx / ri:xxx / mdi:xxx
		*   - iconfont class / uni / svg
		*   - HTTP URL
		* 没有 icon 的选项：横向档取 label 首字占位，竖向档直接显示 label 文字。
		*/
		const props = __props;
		const emit = __emit;
		const displayOptions = computed(() => props.options);
		/** 紧凑模式下图标更小，否则用默认图标尺寸 */
		const iconSize = computed(() => props.compact ? Math.max(16, props.size - 8) : props.size);
		function isSelected(opt) {
			if (props.multiple && Array.isArray(props.modelValue)) return props.modelValue.includes(opt.value);
			return props.modelValue === opt.value;
		}
		function select(opt) {
			if (props.disabled) return;
			if (props.multiple) {
				const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
				const idx = arr.indexOf(opt.value);
				if (idx >= 0) arr.splice(idx, 1);
				else arr.push(opt.value);
				emit("update:modelValue", arr);
			} else emit("update:modelValue", opt.value);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(["re-select-square", [`re-select-square--${__props.controlSize}`, {
				"re-select-square--compact": __props.compact,
				"re-select-square--text": !__props.iconOnly,
				"re-select-square--vertical": __props.vertical
			}]]) }, [(openBlock(true), createElementBlock(Fragment, null, renderList(displayOptions.value, (opt) => {
				return openBlock(), createElementBlock("div", {
					key: String(opt.value),
					class: normalizeClass(["re-select-square__item", { "re-select-square__item--active": isSelected(opt) }]),
					title: opt.label,
					onClick: ($event) => select(opt)
				}, [
					opt.icon ? (openBlock(), createBlock(ReIcon_default, {
						key: 0,
						name: opt.icon,
						size: iconSize.value
					}, null, 8, ["name", "size"])) : createCommentVNode("", true),
					!__props.vertical && !opt.icon ? (openBlock(), createElementBlock("span", _hoisted_2, toDisplayString(String(opt.label).charAt(0)), 1)) : createCommentVNode("", true),
					__props.vertical ? (openBlock(), createElementBlock("div", _hoisted_3, [createBaseVNode("span", _hoisted_4, toDisplayString(opt.label), 1), opt.description ? (openBlock(), createElementBlock("span", _hoisted_5, toDisplayString(opt.description), 1)) : createCommentVNode("", true)])) : !__props.iconOnly ? (openBlock(), createElementBlock("span", _hoisted_6, toDisplayString(opt.label), 1)) : createCommentVNode("", true),
					isSelected(opt) ? (openBlock(), createElementBlock("span", _hoisted_7, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
						viewBox: "0 0 12 12",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2",
						"stroke-linecap": "round",
						"stroke-linejoin": "round"
					}, [createBaseVNode("polyline", { points: "2 6 5 9 10 3" })], -1)])])) : createCommentVNode("", true)
				], 10, _hoisted_1);
			}), 128))], 2);
		};
	}
}), [["__scopeId", "data-v-450133d1"]]);
//#endregion
export { Square_default as default };
