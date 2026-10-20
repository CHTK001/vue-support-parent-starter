const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-ic4RhZ_e.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-CXwOperq.css","assets/modern-vars-DGJCsX_d.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, B as h, D as createVNode, Ft as useModel, O as defineAsyncComponent, On as unref, Rt as useTemplateRef, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as ElDatePicker } from "./date-picker-D-vMtORE.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { O as ElTimePicker, i as ElColorPicker, n as ElSlider, o as ElCascader, r as ElRate, t as ElTimeSelect } from "./time-select-bq4B10oN.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { n as ElFormItem, t as ElForm } from "./form-lTIDC--y.js";
import { r as ElCheckboxGroup, t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { n as ElRadioButton, r as ElRadioGroup } from "./radio-DoZnxNaS.js";
import { n as ElRow, t as ElCol } from "./col-Du_RjTht.js";
import { t as ElInputNumber } from "./input-number-C5-G8rpP.js";
import { t as ElSwitch } from "./switch-CNOkf5eO.js";
import { t as ElTreeSelect } from "./tree-select-BdJvpSDZ.js";
import { t as useDataSource } from "./src-CEonioA3.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReIconSelect_default } from "./ReIconSelect-Dez-DSVO.js";
//#region ../../packages/ui/src/components/ReForm/ReForm.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-form__help"
};
var _hoisted_2 = {
	key: 0,
	class: "re-form__help"
};
var _hoisted_3 = {
	key: 0,
	class: "re-form__help"
};
var _hoisted_4 = {
	key: 0,
	class: "re-form__help"
};
//#endregion
//#region ../../packages/ui/src/components/ReForm/ReForm.vue
var ReForm_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReForm",
	inheritAttrs: true,
	__name: "ReForm",
	props: /*@__PURE__*/ mergeModels({
		layout: { default: "el" },
		fields: { default: () => [] },
		labelWidth: { default: "100px" },
		inline: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		rules: { default: void 0 },
		gutter: { default: 16 }
	}, {
		"modelValue": { default: () => ({}) },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels(["submit", "cancel"], ["update:modelValue"]),
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReForm —— 表单组件
		*
		* 两种用法：
		*   1) 常规：透传 el-form 能力，通过插槽自定义内容
		*   2) Schema：传入 fields 自动渲染（input/select/date/textarea/number/switch 等）
		*
		* 增强：
		*   - 字段 span：栅格列宽（0-24）；>0 时自动启用 el-row/col 布局
		*   - 默认值：field.defaultValue 在挂载时自动写入 model
		*   - 内置 validate() / resetFields() / clearValidate() 暴露给父组件
		*   - actions 插槽：底部操作区（确定/取消等）
		*   - help：字段下方帮助文本
		*   - 支持更多控件类型：slider / rate / color-picker / cascader / tree-select / icon-select
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-ic4RhZ_e.js"), __vite__mapDeps([0,1,2,3,4])));
		const model = useModel(__props, "modelValue");
		const props = __props;
		const emit = __emit;
		/** el-form 引用，用于 expose validate/resetFields 等 */
		const formRef = useTemplateRef("formRef");
		/** 合并 schema 生成的规则与外部规则 */
		const formRules = computed(() => {
			const merged = { ...props.rules ?? {} };
			for (const field of props.fields) {
				if (field.hidden) continue;
				if (field.required) {
					const rule = {
						required: true,
						message: `${field.label ?? field.prop}不能为空`,
						trigger: "blur"
					};
					merged[field.prop] = [
						...merged[field.prop] ?? [],
						...field.rules ?? [],
						rule
					];
				} else if (field.rules) merged[field.prop] = [...merged[field.prop] ?? [], ...field.rules];
			}
			return merged;
		});
		/** 是否启用栅格模式：任意字段 span > 0 即启用 */
		const useGrid = computed(() => props.fields.some((f) => typeof f.span === "number" && f.span > 0));
		/** 挂载时填充默认值 */
		onMounted(() => {
			for (const field of props.fields) {
				if (field.hidden) continue;
				if (field.defaultValue !== void 0 && model.value[field.prop] === void 0) model.value[field.prop] = field.defaultValue;
			}
		});
		/** Select / Radio / Checkbox 等选项字段渲染 */
		const OptionsField = defineComponent({
			name: "ReFormOptionsField",
			inheritAttrs: false,
			props: {
				field: {
					type: Object,
					required: true
				},
				value: { default: void 0 },
				disabled: Boolean,
				type: {
					type: String,
					required: true
				}
			},
			emits: ["update"],
			setup(p, { emit }) {
				const source = computed(() => p.field.dataSource ?? p.field.options ?? []);
				const { data: options, loading } = useDataSource(source);
				return () => {
					const opts = options.value ?? [];
					if (p.type === "select") return h(ElSelect, {
						modelValue: p.value,
						"onUpdate:modelValue": (v) => emit("update", v),
						placeholder: p.field.placeholder ?? "请选择",
						disabled: p.disabled || p.field.disabled,
						loading: loading.value,
						...p.field.attrs ?? {}
					}, () => opts.map((o) => h(ElOption, {
						key: String(o?.value),
						label: o?.label,
						value: o?.value,
						disabled: o?.disabled
					})));
					if (p.type === "checkbox-group") return h(ElCheckboxGroup, {
						modelValue: p.value,
						"onUpdate:modelValue": (v) => emit("update", v),
						disabled: p.disabled || p.field.disabled,
						...p.field.attrs ?? {}
					}, () => opts.map((o) => h(ElCheckbox, {
						key: String(o?.value),
						value: o?.value,
						disabled: o?.disabled
					}, () => o?.label)));
					return h(ElRadioGroup, {
						modelValue: p.value,
						"onUpdate:modelValue": (v) => emit("update", v),
						disabled: p.disabled || p.field.disabled,
						class: "re-form-radio-group",
						...p.field.attrs ?? {}
					}, () => opts.map((o) => h(ElRadioButton, {
						key: String(o?.value),
						value: o?.value,
						disabled: o?.disabled,
						class: "re-form-radio-button"
					}, () => o?.label)));
				};
			}
		});
		/** 字段渲染器 */
		function renderField(field) {
			const value = model.value[field.prop];
			const update = (v) => {
				if (field.format && v !== void 0) v = field.format(v);
				model.value[field.prop] = v;
			};
			if (typeof field.component === "object") return h(field.component, {
				modelValue: value,
				"onUpdate:modelValue": update,
				...field.attrs ?? {}
			});
			switch (field.component ?? "input") {
				case "textarea": return h(ElInput, {
					modelValue: value,
					"onUpdate:modelValue": update,
					type: "textarea",
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "select": return h(OptionsField, {
					field,
					value,
					disabled: props.disabled,
					type: "select",
					onUpdate: update
				});
				case "checkbox": return h(OptionsField, {
					field,
					value,
					disabled: props.disabled,
					type: "checkbox-group",
					onUpdate: update
				});
				case "radio": return h(OptionsField, {
					field,
					value,
					disabled: props.disabled,
					type: "radio-group",
					onUpdate: update
				});
				case "date": return h(ElDatePicker, {
					modelValue: value,
					"onUpdate:modelValue": update,
					type: "date",
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "date-range": return h(ElDatePicker, {
					modelValue: value,
					"onUpdate:modelValue": update,
					type: "daterange",
					startPlaceholder: "开始日期",
					endPlaceholder: "结束日期",
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "datetime": return h(ElDatePicker, {
					modelValue: value,
					"onUpdate:modelValue": update,
					type: "datetime",
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "datetime-range": return h(ElDatePicker, {
					modelValue: value,
					"onUpdate:modelValue": update,
					type: "datetimerange",
					startPlaceholder: "开始时间",
					endPlaceholder: "结束时间",
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "time": return h(ElTimePicker, {
					modelValue: value,
					"onUpdate:modelValue": update,
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "time-select": return h(ElTimeSelect, {
					modelValue: value,
					"onUpdate:modelValue": update,
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "number": return h(ElInputNumber, {
					modelValue: value,
					"onUpdate:modelValue": update,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "switch": return h(ElSwitch, {
					modelValue: value,
					"onUpdate:modelValue": update,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "slider": return h(ElSlider, {
					modelValue: value,
					"onUpdate:modelValue": update,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "rate": return h(ElRate, {
					modelValue: value,
					"onUpdate:modelValue": update,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "color-picker": return h(ElColorPicker, {
					modelValue: value,
					"onUpdate:modelValue": update,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "cascader": return h(ElCascader, {
					modelValue: value,
					"onUpdate:modelValue": update,
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "tree-select": return h(ElTreeSelect, {
					modelValue: value,
					"onUpdate:modelValue": update,
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
				case "icon-select": return h(ReIconSelect_default, {
					modelValue: value,
					"onUpdate:modelValue": update,
					...field.attrs ?? {}
				});
				default: return h(ElInput, {
					modelValue: value,
					"onUpdate:modelValue": update,
					placeholder: field.placeholder,
					disabled: props.disabled || field.disabled,
					...field.attrs ?? {}
				});
			}
		}
		/** 暴露给父组件的方法 */
		__expose({
			/** 校验整个表单；返回 Promise<boolean> */
			async validate() {
				if (!formRef.value) return true;
				try {
					await formRef.value.validate();
					return true;
				} catch {
					return false;
				}
			},
			/** 校验单个字段 */
			validateField(prop) {
				return formRef.value?.validate(prop) ?? Promise.resolve(true);
			},
			/** 重置整个表单 */
			resetFields() {
				formRef.value?.resetFields();
			},
			/** 清除校验态 */
			clearValidate(props) {
				formRef.value?.clearValidate(props);
			},
			/** 提交（触发校验，通过后 emit submit） */
			async submit() {
				const ok = await this.validate();
				if (ok) emit("submit");
				return ok;
			},
			/** 当前表单 model 引用 */
			getModel() {
				return model.value;
			}
		});
		return (_ctx, _cache) => {
			return __props.layout === "modern" ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 0,
				"label-width": __props.labelWidth,
				inline: __props.inline,
				disabled: __props.disabled
			}, _ctx.$attrs), {
				default: withCtx(() => [createVNode(unref(ElForm), {
					ref_key: "formRef",
					ref: formRef,
					model: model.value,
					rules: formRules.value,
					"label-width": __props.labelWidth,
					inline: __props.inline,
					disabled: __props.disabled,
					class: "re-form"
				}, {
					default: withCtx(() => [
						__props.fields.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [useGrid.value ? (openBlock(), createBlock(unref(ElRow), {
							key: 0,
							gutter: __props.gutter
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.fields.filter((f) => !f.hidden), (field) => {
								return openBlock(), createBlock(unref(ElCol), {
									key: field.prop,
									span: field.span ?? 24
								}, {
									default: withCtx(() => [createVNode(unref(ElFormItem), {
										prop: field.prop,
										label: field.label
									}, {
										default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(renderField(field)))), field.help ? (openBlock(), createElementBlock("div", _hoisted_1, toDisplayString(field.help), 1)) : createCommentVNode("", true)]),
										_: 2
									}, 1032, ["prop", "label"])]),
									_: 2
								}, 1032, ["span"]);
							}), 128))]),
							_: 1
						}, 8, ["gutter"])) : (openBlock(true), createElementBlock(Fragment, { key: 1 }, renderList(__props.fields.filter((f) => !f.hidden), (field) => {
							return openBlock(), createBlock(unref(ElFormItem), {
								key: field.prop,
								prop: field.prop,
								label: field.label
							}, {
								default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(renderField(field)))), field.help ? (openBlock(), createElementBlock("div", _hoisted_2, toDisplayString(field.help), 1)) : createCommentVNode("", true)]),
								_: 2
							}, 1032, ["prop", "label"]);
						}), 128))], 64)) : createCommentVNode("", true),
						renderSlot(_ctx.$slots, "default", {}, void 0, true),
						renderSlot(_ctx.$slots, "actions", {
							submit: () => emit("submit"),
							cancel: () => emit("cancel")
						}, void 0, true)
					]),
					_: 3
				}, 8, [
					"model",
					"rules",
					"label-width",
					"inline",
					"disabled"
				])]),
				_: 3
			}, 16, [
				"label-width",
				"inline",
				"disabled"
			])) : (openBlock(), createBlock(unref(ElForm), mergeProps({
				key: 1,
				ref_key: "formRef",
				ref: formRef
			}, _ctx.$attrs, {
				model: model.value,
				rules: formRules.value,
				"label-width": __props.labelWidth,
				inline: __props.inline,
				disabled: __props.disabled,
				class: "re-form"
			}), {
				default: withCtx(() => [
					__props.fields.length ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [useGrid.value ? (openBlock(), createBlock(unref(ElRow), {
						key: 0,
						gutter: __props.gutter
					}, {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.fields.filter((f) => !f.hidden), (field) => {
							return openBlock(), createBlock(unref(ElCol), {
								key: field.prop,
								span: field.span ?? 24
							}, {
								default: withCtx(() => [createVNode(unref(ElFormItem), {
									prop: field.prop,
									label: field.label
								}, {
									default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(renderField(field)))), field.help ? (openBlock(), createElementBlock("div", _hoisted_3, toDisplayString(field.help), 1)) : createCommentVNode("", true)]),
									_: 2
								}, 1032, ["prop", "label"])]),
								_: 2
							}, 1032, ["span"]);
						}), 128))]),
						_: 1
					}, 8, ["gutter"])) : (openBlock(true), createElementBlock(Fragment, { key: 1 }, renderList(__props.fields.filter((f) => !f.hidden), (field) => {
						return openBlock(), createBlock(unref(ElFormItem), {
							key: field.prop,
							prop: field.prop,
							label: field.label
						}, {
							default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(renderField(field)))), field.help ? (openBlock(), createElementBlock("div", _hoisted_4, toDisplayString(field.help), 1)) : createCommentVNode("", true)]),
							_: 2
						}, 1032, ["prop", "label"]);
					}), 128))], 64)) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "default", {}, void 0, true),
					renderSlot(_ctx.$slots, "actions", {
						submit: () => emit("submit"),
						cancel: () => emit("cancel")
					}, void 0, true)
				]),
				_: 3
			}, 16, [
				"model",
				"rules",
				"label-width",
				"inline",
				"disabled"
			]));
		};
	}
}), [["__scopeId", "data-v-7f544c5f"]]);
//#endregion
//#region ../../packages/ui/src/components/ReForm/index.ts
var plugin = { install(app) {
	app.component("ReForm", ReForm_default$1);
} };
var ReForm_default = ReForm_default$1;
//#endregion
export { plugin as n, ReForm_default as t };
