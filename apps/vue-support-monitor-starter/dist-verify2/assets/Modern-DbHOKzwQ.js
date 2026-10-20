import { $ as mergeModels, Ft as useModel, Nt as useAttrs, _ as createBaseVNode, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, rr as toDisplayString, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/ReInput/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "rm-input__prefix"
};
var _hoisted_2 = {
	key: 0,
	class: "rm-input__icon"
};
var _hoisted_3 = [
	"value",
	"placeholder",
	"disabled",
	"readonly",
	"rows",
	"maxlength",
	"minlength"
];
var _hoisted_4 = [
	"type",
	"value",
	"placeholder",
	"disabled",
	"readonly",
	"maxlength",
	"minlength"
];
var _hoisted_5 = { class: "rm-input__suffix" };
var _hoisted_6 = {
	key: 0,
	class: "rm-input__count"
};
var _hoisted_7 = {
	key: 0,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2"
};
var _hoisted_8 = {
	key: 1,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	"stroke-width": "2"
};
//#endregion
//#region ../../packages/ui/src/components/ReInput/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReInputModern",
	inheritAttrs: true,
	__name: "Modern",
	props: /*@__PURE__*/ mergeModels({
		type: { default: "text" },
		placeholder: { default: "" },
		clearable: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		readonly: {
			type: Boolean,
			default: false
		},
		showPassword: {
			type: Boolean,
			default: false
		},
		showWordLimit: {
			type: Boolean,
			default: false
		},
		maxlength: { default: void 0 },
		minlength: { default: void 0 },
		rows: { default: 2 },
		autosize: {
			type: [Boolean, Object],
			default: false
		},
		size: { default: "default" },
		prefixIcon: { default: "" },
		suffixIcon: { default: "" },
		status: { default: "" },
		formatter: {
			type: Function,
			default: void 0
		},
		parser: {
			type: Function,
			default: void 0
		}
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["clear"], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReInput Modern 布局 —— 现代化扁平输入框
		*
		* 设计特点：
		*   - 扁平设计，无 box-shadow
		*   - 1px 细边框，focus 时边框变色
		*   - 大圆角（8px）
		*   - 平滑过渡动画
		*/
		const emit = __emit;
		const model = useModel(__props, "modelValue");
		/**
		* 只把 {@code aria-*} 属性摘出来，单独透传给内层真正的 input / textarea。
		*
		* <p>为什么需要：{@code v-bind="$attrs"} 挂在包裹层 {@code .rm-input-wrap} 上，
		* 于是 {@code aria-label} 落在 div 上 —— 而可访问名只认**表单控件自身**，
		* 落在 div 上对读屏没有任何作用。实测 {@code PolicyRouteTab.vue} 明明写了
		* {@code :aria-label="t('policy.route.filterAria')"}，浏览器仍报
		* {@code missingAccessibleName: true}。</p>
		*
		* <p>为什么只摘 aria-* 而不是把 $attrs 整体再绑一次：class / style 绑两处会重复，
		* 而事件监听器绑两处会**触发两次**（input 上的 keyup 会冒泡到包裹层，
		* 同一个 handler 被调两遍）。aria-* 没有这两类副作用。</p>
		*/
		const attrs = useAttrs();
		const ariaAttrs = computed(() => {
			const out = {};
			for (const key of Object.keys(attrs)) if (key.startsWith("aria-") && attrs[key] != null) out[key] = attrs[key];
			return out;
		});
		const props = __props;
		const focused = ref(false);
		const passwordVisible = ref(false);
		const isTextarea = computed(() => props.type === "textarea");
		const inputType = computed(() => {
			if (props.type === "password" && passwordVisible.value) return "text";
			return props.type;
		});
		const displayValue = computed(() => {
			if (props.formatter) return props.formatter(model.value);
			return model.value ?? "";
		});
		function onInput(e) {
			let val = e.target.value;
			if (props.parser) val = props.parser(val);
			model.value = val;
		}
		function onClear() {
			model.value = "";
			emit("clear");
		}
		function togglePassword() {
			passwordVisible.value = !passwordVisible.value;
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({ class: [
				"rm-input-wrap",
				`rm-input-wrap--${__props.size || "default"}`,
				{
					"rm-input-wrap--focused": focused.value,
					"rm-input-wrap--disabled": __props.disabled,
					"rm-input-wrap--readonly": __props.readonly,
					[`rm-input-wrap--${__props.status}`]: __props.status,
					"rm-input-wrap--textarea": isTextarea.value
				}
			] }, _ctx.$attrs), [
				_ctx.$slots.prefix || __props.prefixIcon ? (openBlock(), createElementBlock("div", _hoisted_1, [renderSlot(_ctx.$slots, "prefix", {}, () => [__props.prefixIcon ? (openBlock(), createElementBlock("span", _hoisted_2, toDisplayString(__props.prefixIcon), 1)) : createCommentVNode("", true)], true)])) : createCommentVNode("", true),
				isTextarea.value ? (openBlock(), createElementBlock("textarea", mergeProps({
					key: 1,
					value: displayValue.value,
					placeholder: __props.placeholder,
					disabled: __props.disabled,
					readonly: __props.readonly,
					rows: __props.rows,
					maxlength: __props.maxlength,
					minlength: __props.minlength,
					class: "rm-input__textarea"
				}, ariaAttrs.value, {
					onInput,
					onFocus: _cache[0] || (_cache[0] = ($event) => focused.value = true),
					onBlur: _cache[1] || (_cache[1] = ($event) => focused.value = false)
				}), null, 16, _hoisted_3)) : (openBlock(), createElementBlock("input", mergeProps({
					key: 2,
					type: inputType.value,
					value: displayValue.value,
					placeholder: __props.placeholder,
					disabled: __props.disabled,
					readonly: __props.readonly,
					maxlength: __props.maxlength,
					minlength: __props.minlength,
					class: "rm-input__inner"
				}, ariaAttrs.value, {
					onInput,
					onFocus: _cache[2] || (_cache[2] = ($event) => focused.value = true),
					onBlur: _cache[3] || (_cache[3] = ($event) => focused.value = false)
				}), null, 16, _hoisted_4)),
				createBaseVNode("div", _hoisted_5, [
					renderSlot(_ctx.$slots, "suffix", {}, void 0, true),
					__props.showWordLimit && __props.maxlength ? (openBlock(), createElementBlock("span", _hoisted_6, toDisplayString(String(model.value ?? "").length) + "/" + toDisplayString(__props.maxlength), 1)) : createCommentVNode("", true),
					__props.showPassword ? (openBlock(), createElementBlock("button", {
						key: 1,
						class: "rm-input__eye",
						type: "button",
						onClick: togglePassword
					}, [!passwordVisible.value ? (openBlock(), createElementBlock("svg", _hoisted_7, [..._cache[4] || (_cache[4] = [createBaseVNode("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }, null, -1), createBaseVNode("circle", {
						cx: "12",
						cy: "12",
						r: "3"
					}, null, -1)])])) : (openBlock(), createElementBlock("svg", _hoisted_8, [..._cache[5] || (_cache[5] = [createBaseVNode("path", { d: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" }, null, -1), createBaseVNode("line", {
						x1: "1",
						y1: "1",
						x2: "23",
						y2: "23"
					}, null, -1)])]))])) : createCommentVNode("", true),
					__props.clearable && model.value ? (openBlock(), createElementBlock("button", {
						key: 2,
						class: "rm-input__clear",
						type: "button",
						onClick: onClear
					}, [..._cache[6] || (_cache[6] = [createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "currentColor"
					}, [createBaseVNode("path", { d: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" })], -1)])])) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "append", {}, void 0, true)
				])
			], 16);
		};
	}
}), [["__scopeId", "data-v-627cc977"]]);
//#endregion
export { Modern_default as default };
