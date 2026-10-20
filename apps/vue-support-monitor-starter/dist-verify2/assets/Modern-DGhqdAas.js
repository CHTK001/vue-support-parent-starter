import { $ as mergeModels, Ft as useModel, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReInputNumber/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "rm-number__affix rm-number__affix--prefix"
};
var _hoisted_2 = ["disabled"];
var _hoisted_3 = { class: "rm-number__field" };
var _hoisted_4 = [
	"value",
	"placeholder",
	"disabled",
	"readonly"
];
var _hoisted_5 = ["disabled"];
var _hoisted_6 = {
	key: 3,
	class: "rm-number__affix rm-number__affix--suffix"
};
//#endregion
//#region ../../packages/ui/src/components/ReInputNumber/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReInputNumberModern",
	inheritAttrs: true,
	__name: "Modern",
	props: /*@__PURE__*/ mergeModels({
		min: { default: void 0 },
		max: { default: void 0 },
		step: { default: 1 },
		stepStrictly: {
			type: Boolean,
			default: false
		},
		precision: { default: void 0 },
		placeholder: { default: "" },
		disabled: {
			type: Boolean,
			default: false
		},
		readonly: {
			type: Boolean,
			default: false
		},
		controls: {
			type: Boolean,
			default: true
		},
		controlsPosition: { default: "" },
		size: { default: "default" },
		prefix: { default: "" },
		suffix: { default: "" }
	}, {
		"modelValue": { default: void 0 },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* ReInputNumber Modern 布局 —— 现代化扁平数字输入框
		*
		* 设计要点：
		*   - 扁平容器（纯色背景 + 细边框）
		*   - 聚焦时主色边框
		*   - 左右分置加减按钮（hover 纯色高亮，icon 平滑缩放）
		*   - Tabular numerals 让数字对齐
		*   - 深浅色主题自动适配（跟随 Element Plus CSS 变量）
		*   - 支持 min / max / step / precision / 前缀 / 后缀
		*/
		const model = useModel(__props, "modelValue");
		const props = __props;
		const focused = ref(false);
		const draft = ref(void 0);
		/** 夹取到 [min, max] 区间 */
		const clamp = (v) => {
			let n = Number.isNaN(v) ? 0 : v;
			if (props.min !== void 0 && n < props.min) n = props.min;
			if (props.max !== void 0 && n > props.max) n = props.max;
			return n;
		};
		/** 按 precision 四舍五入 */
		const roundPrecision = (v) => {
			if (props.precision === void 0) return v;
			const factor = 10 ** props.precision;
			return Math.round(v * factor) / factor;
		};
		/** 输入框展示值（草稿优先，否则格式化 model） */
		const display = computed(() => {
			if (draft.value !== void 0) return draft.value;
			if (model.value === void 0) return "";
			if (props.precision !== void 0) return model.value.toFixed(props.precision);
			return String(model.value);
		});
		const canMinus = computed(() => {
			if (props.disabled || props.readonly || model.value === void 0) return false;
			const next = model.value - props.step;
			return props.min === void 0 || next >= props.min;
		});
		const canPlus = computed(() => {
			if (props.disabled || props.readonly || model.value === void 0) return false;
			const next = model.value + props.step;
			return props.max === void 0 || next <= props.max;
		});
		/** 提交草稿：合法则回写 model，非法则回显原值 */
		function commit() {
			const raw = draft.value;
			draft.value = void 0;
			if (raw === void 0 || raw === "") return;
			const n = Number(raw);
			if (Number.isNaN(n)) return;
			model.value = roundPrecision(clamp(n));
		}
		/** 步进 */
		function stepBy(dir) {
			if (props.disabled || props.readonly) return;
			const base = model.value ?? 0;
			const next = roundPrecision(clamp(base + dir * props.step));
			model.value = props.stepStrictly ? Math.round(next / props.step) * props.step : next;
			draft.value = void 0;
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({ class: [
				"rm-number",
				`rm-number--${__props.size || "default"}`,
				{
					"rm-number--focused": focused.value,
					"rm-number--disabled": __props.disabled,
					"rm-number--readonly": __props.readonly,
					"rm-number--no-controls": !__props.controls,
					"rm-number--has-prefix": !!__props.prefix,
					"rm-number--has-suffix": !!__props.suffix
				}
			] }, _ctx.$attrs), [
				__props.prefix ? (openBlock(), createElementBlock("span", _hoisted_1, toDisplayString(__props.prefix), 1)) : createCommentVNode("", true),
				__props.controls ? (openBlock(), createElementBlock("button", {
					key: 1,
					type: "button",
					class: "rm-number__step rm-number__step--minus",
					disabled: __props.disabled || __props.readonly || !canMinus.value,
					"aria-label": "减少",
					onClick: _cache[0] || (_cache[0] = ($event) => stepBy(-1))
				}, [..._cache[6] || (_cache[6] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.5",
					"stroke-linecap": "round",
					"stroke-linejoin": "round",
					class: "rm-number__icon"
				}, [createBaseVNode("path", { d: "M5 12h14" })], -1)])], 8, _hoisted_2)) : createCommentVNode("", true),
				createBaseVNode("div", _hoisted_3, [createBaseVNode("input", {
					value: display.value,
					placeholder: __props.placeholder,
					disabled: __props.disabled,
					readonly: __props.readonly,
					type: "text",
					inputmode: "decimal",
					autocomplete: "off",
					spellcheck: "false",
					class: "rm-number__input",
					onInput: _cache[1] || (_cache[1] = (e) => draft.value = e.target.value),
					onFocus: _cache[2] || (_cache[2] = ($event) => focused.value = true),
					onBlur: _cache[3] || (_cache[3] = ($event) => {
						focused.value = false;
						commit();
					}),
					onKeydown: _cache[4] || (_cache[4] = withKeys(withModifiers(($event) => commit(), ["prevent"]), ["enter"]))
				}, null, 40, _hoisted_4)]),
				__props.controls ? (openBlock(), createElementBlock("button", {
					key: 2,
					type: "button",
					class: "rm-number__step rm-number__step--plus",
					disabled: __props.disabled || __props.readonly || !canPlus.value,
					"aria-label": "增加",
					onClick: _cache[5] || (_cache[5] = ($event) => stepBy(1))
				}, [..._cache[7] || (_cache[7] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.5",
					"stroke-linecap": "round",
					"stroke-linejoin": "round",
					class: "rm-number__icon"
				}, [createBaseVNode("path", { d: "M12 5v14M5 12h14" })], -1)])], 8, _hoisted_5)) : createCommentVNode("", true),
				__props.suffix ? (openBlock(), createElementBlock("span", _hoisted_6, toDisplayString(__props.suffix), 1)) : createCommentVNode("", true)
			], 16);
		};
	}
}), [["__scopeId", "data-v-df06f4b4"]]);
//#endregion
export { Modern_default as default };
