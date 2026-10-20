const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-DbHOKzwQ.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-WeOGA_x5.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, Ft as useModel, O as defineAsyncComponent, On as unref, b as createElementBlock, et as mergeProps, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, w as createSlots, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as ElInput } from "./input-Bbhiel27.js";
//#region ../../packages/ui/src/components/ReInput/ReInput.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-input" };
//#endregion
//#region ../../packages/ui/src/components/ReInput/ReInput.vue
var ReInput_default$1 = /* @__PURE__ */ defineComponent({
	name: "ReInput",
	inheritAttrs: true,
	__name: "ReInput",
	props: /*@__PURE__*/ mergeModels({
		layout: { default: "el" },
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
		size: { default: void 0 },
		prefixIcon: { default: "" },
		suffixIcon: { default: "" },
		status: { default: void 0 },
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
	emits: /*@__PURE__*/ mergeModels([
		"clear",
		"input",
		"change"
	], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReInput —— 输入框组件
		*
		* 透传 el-input 全部能力（v-model + 所有 props / slots）。
		* 增强：
		*   - icon：可传 Element Plus PascalCase 名 / Iconify 三方库 / HTTP URL，自动渲染为 prefix / suffix 图标
		*   - status：success / warning / error，用于表单校验态
		*   - formatter / parser：双向格式化（如金额千分位、trim 等）
		*   - layout：布局变体，"el"（默认，el-input）/ "modern"（现代化扁平输入框，异步加载）
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-DbHOKzwQ.js"), __vite__mapDeps([0,1,2,3,4])));
		const emit = __emit;
		const model = useModel(__props, "modelValue");
		const props = __props;
		function onInput(value) {
			if (props.parser) model.value = props.parser(String(value));
			else model.value = value;
			emit("input", model.value);
		}
		/**
		* el 分支的 change 转发：ElInput 失焦 / 回车时 emit change(当前值)。
		*
		* <p>优先报组件自己的 model（parser 处理后的值），事件值仅作兜底——
		* 下游 {@code onHeadArg(val)} 等消费的是「组件当前值」而不是原始输入。</p>
		*
		* @param value ElInput change 携带的原始值
		*/
		function onChangeEl(value) {
			emit("change", model.value ?? value);
		}
		/**
		* modern 分支的 change 转发：Modern 布局不声明 change 事件，
		* 绑到它身上的 onChangeNative 会落进其 $attrs 并被铺到内部原生 input 上，
		* 收到的是原生 Event，值要从 target 上取。
		*
		* @param e 原生 change 事件
		*/
		function onChangeNative(e) {
			const t = e.target;
			emit("change", t ? t.value : model.value);
		}
		/** 点 × 清空：ElInput 会 emit update:model-value("")，这里回写 model 后再把 clear 向外透传。 */
		function onClear() {
			emit("clear");
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [__props.layout === "modern" ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				"model-value": model.value,
				"onUpdate:modelValue": onInput,
				onChange: onChangeNative
			}, _ctx.$attrs, {
				type: __props.type,
				placeholder: __props.placeholder,
				clearable: __props.clearable,
				disabled: __props.disabled,
				readonly: __props.readonly,
				"show-password": __props.showPassword,
				"show-word-limit": __props.showWordLimit,
				maxlength: __props.maxlength,
				minlength: __props.minlength,
				rows: __props.rows,
				autosize: __props.autosize,
				size: __props.size,
				"prefix-icon": __props.prefixIcon,
				"suffix-icon": __props.suffixIcon,
				status: __props.status,
				formatter: __props.formatter,
				parser: __props.parser
			}), createSlots({ _: 2 }, [
				_ctx.$slots.prefix ? {
					name: "prefix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "prefix")]),
					key: "0"
				} : void 0,
				_ctx.$slots.suffix ? {
					name: "suffix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "suffix")]),
					key: "1"
				} : void 0,
				_ctx.$slots.prepend ? {
					name: "prepend",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "prepend")]),
					key: "2"
				} : void 0,
				_ctx.$slots.append ? {
					name: "append",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "append")]),
					key: "3"
				} : void 0
			]), 1040, [
				"model-value",
				"type",
				"placeholder",
				"clearable",
				"disabled",
				"readonly",
				"show-password",
				"show-word-limit",
				"maxlength",
				"minlength",
				"rows",
				"autosize",
				"size",
				"prefix-icon",
				"suffix-icon",
				"status",
				"formatter",
				"parser"
			])) : (openBlock(), createBlock(unref(ElInput), mergeProps({
				key: 1,
				"model-value": __props.formatter ? __props.formatter(model.value) : model.value
			}, _ctx.$attrs, {
				type: __props.type,
				placeholder: __props.placeholder,
				clearable: __props.clearable,
				disabled: __props.disabled,
				readonly: __props.readonly,
				"show-password": __props.showPassword,
				"show-word-limit": __props.showWordLimit,
				maxlength: __props.maxlength,
				minlength: __props.minlength,
				rows: __props.rows,
				autosize: __props.autosize,
				size: __props.size,
				"prefix-icon": __props.prefixIcon || void 0,
				"suffix-icon": __props.suffixIcon || void 0,
				status: __props.status,
				"onUpdate:modelValue": onInput,
				onChange: onChangeEl,
				onClear
			}), createSlots({ _: 2 }, [
				_ctx.$slots.prefix ? {
					name: "prefix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "prefix")]),
					key: "0"
				} : void 0,
				_ctx.$slots.suffix || _ctx.$slots.append ? {
					name: "suffix",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "suffix")]),
					key: "1"
				} : void 0,
				_ctx.$slots.prepend ? {
					name: "prepend",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "prepend")]),
					key: "2"
				} : void 0,
				_ctx.$slots.append ? {
					name: "append",
					fn: withCtx(() => [renderSlot(_ctx.$slots, "append")]),
					key: "3"
				} : void 0
			]), 1040, [
				"model-value",
				"type",
				"placeholder",
				"clearable",
				"disabled",
				"readonly",
				"show-password",
				"show-word-limit",
				"maxlength",
				"minlength",
				"rows",
				"autosize",
				"size",
				"prefix-icon",
				"suffix-icon",
				"status"
			]))]);
		};
	}
});
//#endregion
//#region ../../packages/ui/src/components/ReInput/index.ts
var plugin = { install(app) {
	app.component("ReInput", ReInput_default$1);
} };
var ReInput_default = ReInput_default$1;
//#endregion
export { plugin as n, ReInput_default as t };
