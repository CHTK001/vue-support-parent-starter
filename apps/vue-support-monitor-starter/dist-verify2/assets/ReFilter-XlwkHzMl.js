import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, On as unref, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { w as withModifiers } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElDatePicker } from "./date-picker-D-vMtORE.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { Bt as search_default, Ht as setting_default, Nt as refresh_default, o as arrow_up_default, r as arrow_down_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { n as ElFormItem, t as ElForm } from "./form-lTIDC--y.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElCheckbox } from "./checkbox-FhkQL8S5.js";
import { n as ElRow, t as ElCol } from "./col-Du_RjTht.js";
import { t as ElDrawer } from "./drawer-CBwadwVQ.js";
import { t as ElInputNumber } from "./input-number-C5-G8rpP.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-BrUGYrlz.js";
//#region ../../packages/ui/src/components/ReFilter/ReFilter.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-filter" };
//#endregion
//#region ../../packages/ui/src/components/ReFilter/ReFilter.vue
var ReFilter_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReFilter",
	inheritAttrs: true,
	__name: "ReFilter",
	props: {
		items: { default: () => [] },
		columns: { default: 4 },
		collapsible: {
			type: Boolean,
			default: true
		},
		expanded: {
			type: Boolean,
			default: false
		},
		showActions: {
			type: Boolean,
			default: true
		},
		searchText: { default: "查询" },
		resetText: { default: "重置" },
		drawerEnabled: {
			type: Boolean,
			default: false
		},
		drawerTitle: { default: "高级筛选" },
		drawerSize: { default: "480" }
	},
	emits: [
		"search",
		"reset",
		"change"
	],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReFilter —— 筛选组件
		*
		* 支持：
		*   - 水平筛选栏，一行显示多个筛选条件
		*   - "展开更多"按钮，折叠/展开额外筛选条件
		*   - 抽屉模式（高级筛选），自定义条件布局
		*   - 自动重置/查询操作
		*
		* 用法：
		*   <ReFilter
		*     :items="[
		*       { prop: 'name', label: '名称', type: 'input' },
		*       { prop: 'status', label: '状态', type: 'select', options: [...] },
		*       { prop: 'date', label: '日期', type: 'daterange', always: false },
		*     ]"
		*     @search="onSearch"
		*     @reset="onReset"
		*   />
		*/
		const props = __props;
		const emit = __emit;
		/** 表单数据 */
		const formData = ref({});
		/** 动态表单值按 ElSelect 的 model-value 类型收窄 */
		function selectModel(prop) {
			return formData.value[prop];
		}
		/** 动态表单值按 ElDatePicker 的 model-value 类型收窄 */
		function dateModel(prop) {
			return formData.value[prop];
		}
		/** 筛选项是否声明了远端数据源（dataSource / url / loader） */
		function isRemoteSelect(item) {
			return Boolean(item.url) || typeof item.loader === "function" || typeof item.dataSource === "string" || typeof item.dataSource === "function";
		}
		/** 筛选项生效的远端 url：显式 url 优先，dataSource 为字符串时兜底 */
		function filterUrl(item) {
			return item.url || (typeof item.dataSource === "string" ? item.dataSource : "");
		}
		/** 筛选项生效的远端加载器：显式 loader 优先，dataSource 为函数时兜底 */
		function filterLoader(item) {
			return item.loader || (typeof item.dataSource === "function" ? item.dataSource : void 0);
		}
		/** 展开状态 */
		const isExpanded = ref(props.expanded);
		/** 抽屉可见性 */
		const drawerVisible = ref(false);
		/** 初始化默认值 */
		function initDefaults() {
			const data = {};
			for (const item of props.items) if (item.defaultValue !== void 0) data[item.prop] = item.defaultValue;
			else switch (item.type) {
				case "checkbox":
					data[item.prop] = false;
					break;
				case "number":
					data[item.prop] = void 0;
					break;
				case "daterange":
					data[item.prop] = null;
					break;
				case "select":
					data[item.prop] = item.multiple ? [] : "";
					break;
				default: data[item.prop] = "";
			}
			formData.value = data;
		}
		watch(() => props.items, () => initDefaults(), {
			immediate: true,
			deep: true
		});
		/** 始终显示的项（always=true 或前一行的项） */
		const alwaysItems = computed(() => props.items.filter((item) => item.always));
		computed(() => props.columns);
		/** 折叠时显示的项（始终显示的 + 第一行内的非 always 项） */
		const collapsedItems = computed(() => {
			const always = alwaysItems.value;
			const remaining = props.columns - always.length - 1;
			const others = props.items.filter((item) => !item.always);
			return [...always, ...others.slice(0, Math.max(0, remaining))];
		});
		/** 当前显示的项 */
		const visibleItems = computed(() => {
			if (!props.collapsible || isExpanded.value) return props.items;
			return collapsedItems.value;
		});
		/** 是否有被折叠的项 */
		const hasCollapsedItems = computed(() => {
			if (!props.collapsible) return false;
			return props.items.length > collapsedItems.value.length;
		});
		/** 计算每个 item 的栅格 span */
		function getItemSpan(item) {
			if (item.span) return item.span;
			return Math.floor(24 / props.columns);
		}
		/** 值变化 */
		function onValueChange(prop, value) {
			formData.value = {
				...formData.value,
				[prop]: value
			};
			emit("change", prop, value);
		}
		/** 查询 */
		function onSearch() {
			emit("search", { ...formData.value });
		}
		/** 重置 */
		function onReset() {
			initDefaults();
			emit("reset");
		}
		/** 打开抽屉 */
		function openDrawer() {
			drawerVisible.value = true;
		}
		/** 抽屉内应用 */
		function onDrawerApply() {
			drawerVisible.value = false;
			emit("search", { ...formData.value });
		}
		/** 暴露方法 */
		__expose({
			getValues: () => ({ ...formData.value }),
			reset: onReset,
			setValues: (values) => {
				formData.value = {
					...formData.value,
					...values
				};
			}
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1, [createVNode(unref(ElForm), {
				model: formData.value,
				inline: "",
				class: "re-filter__form",
				onSubmit: _cache[1] || (_cache[1] = withModifiers(() => {}, ["prevent"]))
			}, {
				default: withCtx(() => [createVNode(unref(ElRow), {
					gutter: 16,
					align: "middle"
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(visibleItems.value, (item) => {
						return openBlock(), createBlock(unref(ElCol), {
							key: item.prop,
							span: getItemSpan(item)
						}, {
							default: withCtx(() => [createVNode(unref(ElFormItem), {
								label: item.label,
								class: "re-filter__item"
							}, {
								default: withCtx(() => [item.type === "slot" ? renderSlot(_ctx.$slots, item.prop, {
									value: formData.value[item.prop],
									onChange: (v) => onValueChange(item.prop, v)
								}, void 0, true, 0) : item.type === "input" || !item.type ? (openBlock(), createBlock(unref(ElInput), {
									key: 1,
									"model-value": formData.value[item.prop] ?? "",
									placeholder: item.placeholder || `请输入${item.label}`,
									clearable: item.clearable !== false,
									disabled: item.disabled,
									"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
								}, null, 8, [
									"model-value",
									"placeholder",
									"clearable",
									"disabled",
									"onUpdate:modelValue"
								])) : item.type === "select" && isRemoteSelect(item) ? (openBlock(), createBlock(ReSelect_default, {
									key: 2,
									"model-value": selectModel(item.prop),
									data: item.options ?? [],
									url: filterUrl(item),
									loader: filterLoader(item),
									placeholder: item.placeholder || `请选择${item.label}`,
									clearable: item.clearable !== false,
									multiple: item.multiple,
									disabled: item.disabled,
									"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
								}, null, 8, [
									"model-value",
									"data",
									"url",
									"loader",
									"placeholder",
									"clearable",
									"multiple",
									"disabled",
									"onUpdate:modelValue"
								])) : item.type === "select" ? (openBlock(), createBlock(unref(ElSelect), {
									key: 3,
									"model-value": selectModel(item.prop),
									placeholder: item.placeholder || `请选择${item.label}`,
									clearable: item.clearable !== false,
									multiple: item.multiple,
									disabled: item.disabled,
									"collapse-tags": "",
									"collapse-tags-tooltip": "",
									"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
								}, {
									default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(item.options ?? [], (opt) => {
										return openBlock(), createBlock(unref(ElOption), {
											key: String(opt.value),
											label: opt.label,
											value: opt.value
										}, null, 8, ["label", "value"]);
									}), 128))]),
									_: 2
								}, 1032, [
									"model-value",
									"placeholder",
									"clearable",
									"multiple",
									"disabled",
									"onUpdate:modelValue"
								])) : item.type === "date" ? (openBlock(), createBlock(unref(ElDatePicker), {
									key: 4,
									"model-value": dateModel(item.prop),
									placeholder: item.placeholder || `请选择${item.label}`,
									clearable: item.clearable !== false,
									disabled: item.disabled,
									type: "date",
									"value-format": "YYYY-MM-DD",
									"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
								}, null, 8, [
									"model-value",
									"placeholder",
									"clearable",
									"disabled",
									"onUpdate:modelValue"
								])) : item.type === "daterange" ? (openBlock(), createBlock(unref(ElDatePicker), {
									key: 5,
									"model-value": dateModel(item.prop),
									"start-placeholder": "开始日期",
									"end-placeholder": "结束日期",
									clearable: item.clearable !== false,
									disabled: item.disabled,
									type: "daterange",
									"value-format": "YYYY-MM-DD",
									"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
								}, null, 8, [
									"model-value",
									"clearable",
									"disabled",
									"onUpdate:modelValue"
								])) : item.type === "checkbox" ? (openBlock(), createBlock(unref(ElCheckbox), {
									key: 6,
									"model-value": formData.value[item.prop],
									disabled: item.disabled,
									"onUpdate:modelValue": (v) => onValueChange(item.prop, !!v)
								}, {
									default: withCtx(() => [createTextVNode(toDisplayString(item.placeholder || item.label), 1)]),
									_: 2
								}, 1032, [
									"model-value",
									"disabled",
									"onUpdate:modelValue"
								])) : item.type === "number" ? (openBlock(), createBlock(unref(ElInputNumber), {
									key: 7,
									"model-value": formData.value[item.prop],
									placeholder: item.placeholder || `请输入${item.label}`,
									disabled: item.disabled,
									"controls-position": "right",
									"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
								}, null, 8, [
									"model-value",
									"placeholder",
									"disabled",
									"onUpdate:modelValue"
								])) : createCommentVNode("", true)]),
								_: 2
							}, 1032, ["label"])]),
							_: 2
						}, 1032, ["span"]);
					}), 128)), __props.showActions ? (openBlock(), createBlock(unref(ElCol), {
						key: 0,
						span: getItemSpan({
							prop: "",
							label: ""
						}),
						class: "re-filter__actions"
					}, {
						default: withCtx(() => [
							createVNode(unref(ElButton), {
								type: "primary",
								icon: unref(search_default),
								onClick: onSearch
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(__props.searchText), 1)]),
								_: 1
							}, 8, ["icon"]),
							createVNode(unref(ElButton), {
								icon: unref(refresh_default),
								onClick: onReset
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(__props.resetText), 1)]),
								_: 1
							}, 8, ["icon"]),
							hasCollapsedItems.value ? (openBlock(), createBlock(unref(ElButton), {
								key: 0,
								text: "",
								type: "primary",
								onClick: _cache[0] || (_cache[0] = ($event) => isExpanded.value = !isExpanded.value)
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(isExpanded.value ? "收起" : "更多") + " ", 1), createVNode(unref(ElIcon), { class: normalizeClass(["re-filter__expand-icon", { "is-expanded": isExpanded.value }]) }, {
									default: withCtx(() => [!isExpanded.value ? (openBlock(), createBlock(unref(arrow_down_default), { key: 0 })) : (openBlock(), createBlock(unref(arrow_up_default), { key: 1 }))]),
									_: 1
								}, 8, ["class"])]),
								_: 1
							})) : createCommentVNode("", true),
							__props.drawerEnabled ? (openBlock(), createBlock(unref(ElButton), {
								key: 1,
								icon: unref(setting_default),
								text: "",
								onClick: openDrawer
							}, {
								default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode(" 高级 ", -1)])]),
								_: 1
							}, 8, ["icon"])) : createCommentVNode("", true)
						]),
						_: 1
					}, 8, ["span"])) : createCommentVNode("", true)]),
					_: 3
				})]),
				_: 3
			}, 8, ["model"]), __props.drawerEnabled ? (openBlock(), createBlock(unref(ElDrawer), {
				key: 0,
				modelValue: drawerVisible.value,
				"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => drawerVisible.value = $event),
				title: __props.drawerTitle,
				size: __props.drawerSize,
				direction: "rtl",
				"destroy-on-close": false
			}, {
				footer: withCtx(() => [createVNode(unref(ElButton), { onClick: onReset }, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.resetText), 1)]),
					_: 1
				}), createVNode(unref(ElButton), {
					type: "primary",
					onClick: onDrawerApply
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.searchText), 1)]),
					_: 1
				})]),
				default: withCtx(() => [createVNode(unref(ElForm), {
					model: formData.value,
					"label-position": "top",
					class: "re-filter__drawer-form"
				}, {
					default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.items, (item) => {
						return openBlock(), createBlock(unref(ElFormItem), {
							key: item.prop,
							label: item.label
						}, {
							default: withCtx(() => [item.type === "slot" ? renderSlot(_ctx.$slots, `drawer-${item.prop}`, {
								value: formData.value[item.prop],
								onChange: (v) => onValueChange(item.prop, v)
							}, void 0, true, 0) : item.type === "input" || !item.type ? (openBlock(), createBlock(unref(ElInput), {
								key: 1,
								"model-value": formData.value[item.prop] ?? "",
								placeholder: item.placeholder || `请输入${item.label}`,
								clearable: item.clearable !== false,
								disabled: item.disabled,
								"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
							}, null, 8, [
								"model-value",
								"placeholder",
								"clearable",
								"disabled",
								"onUpdate:modelValue"
							])) : item.type === "select" && isRemoteSelect(item) ? (openBlock(), createBlock(ReSelect_default, {
								key: 2,
								"model-value": selectModel(item.prop),
								data: item.options ?? [],
								url: filterUrl(item),
								loader: filterLoader(item),
								placeholder: item.placeholder || `请选择${item.label}`,
								clearable: item.clearable !== false,
								multiple: item.multiple,
								disabled: item.disabled,
								style: { "width": "100%" },
								"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
							}, null, 8, [
								"model-value",
								"data",
								"url",
								"loader",
								"placeholder",
								"clearable",
								"multiple",
								"disabled",
								"onUpdate:modelValue"
							])) : item.type === "select" ? (openBlock(), createBlock(unref(ElSelect), {
								key: 3,
								"model-value": selectModel(item.prop),
								placeholder: item.placeholder || `请选择${item.label}`,
								clearable: item.clearable !== false,
								multiple: item.multiple,
								disabled: item.disabled,
								"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
							}, {
								default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(item.options ?? [], (opt) => {
									return openBlock(), createBlock(unref(ElOption), {
										key: String(opt.value),
										label: opt.label,
										value: opt.value
									}, null, 8, ["label", "value"]);
								}), 128))]),
								_: 2
							}, 1032, [
								"model-value",
								"placeholder",
								"clearable",
								"multiple",
								"disabled",
								"onUpdate:modelValue"
							])) : item.type === "date" ? (openBlock(), createBlock(unref(ElDatePicker), {
								key: 4,
								"model-value": dateModel(item.prop),
								placeholder: item.placeholder || `请选择${item.label}`,
								clearable: item.clearable !== false,
								disabled: item.disabled,
								type: "date",
								"value-format": "YYYY-MM-DD",
								style: { "width": "100%" },
								"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
							}, null, 8, [
								"model-value",
								"placeholder",
								"clearable",
								"disabled",
								"onUpdate:modelValue"
							])) : item.type === "daterange" ? (openBlock(), createBlock(unref(ElDatePicker), {
								key: 5,
								"model-value": dateModel(item.prop),
								"start-placeholder": "开始日期",
								"end-placeholder": "结束日期",
								clearable: item.clearable !== false,
								disabled: item.disabled,
								type: "daterange",
								"value-format": "YYYY-MM-DD",
								style: { "width": "100%" },
								"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
							}, null, 8, [
								"model-value",
								"clearable",
								"disabled",
								"onUpdate:modelValue"
							])) : item.type === "checkbox" ? (openBlock(), createBlock(unref(ElCheckbox), {
								key: 6,
								"model-value": formData.value[item.prop],
								disabled: item.disabled,
								"onUpdate:modelValue": (v) => onValueChange(item.prop, !!v)
							}, {
								default: withCtx(() => [createTextVNode(toDisplayString(item.placeholder || item.label), 1)]),
								_: 2
							}, 1032, [
								"model-value",
								"disabled",
								"onUpdate:modelValue"
							])) : item.type === "number" ? (openBlock(), createBlock(unref(ElInputNumber), {
								key: 7,
								"model-value": formData.value[item.prop],
								placeholder: item.placeholder || `请输入${item.label}`,
								disabled: item.disabled,
								style: { "width": "100%" },
								"controls-position": "right",
								"onUpdate:modelValue": (v) => onValueChange(item.prop, v)
							}, null, 8, [
								"model-value",
								"placeholder",
								"disabled",
								"onUpdate:modelValue"
							])) : createCommentVNode("", true)]),
							_: 2
						}, 1032, ["label"]);
					}), 128))]),
					_: 3
				}, 8, ["model"])]),
				_: 3
			}, 8, [
				"modelValue",
				"title",
				"size"
			])) : createCommentVNode("", true)]);
		};
	}
}), [["__scopeId", "data-v-6e870511"]]);
//#endregion
//#region ../../packages/ui/src/components/ReFilter/index.ts
var plugin = { install(app) {
	app.component("ReFilter", ReFilter_default$1);
} };
var ReFilter_default = ReFilter_default$1;
//#endregion
export { ReFilter_default as default, plugin as install };
