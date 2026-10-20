import { $n as normalizeClass, D as createVNode, Ht as watch, St as resolveComponent, _ as createBaseVNode, b as createElementBlock, bt as renderList, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReTagFilter/theme/koi/ReTagFilter.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "koi-tag-filter" };
var _hoisted_2 = { class: "koi-tag-filter__title" };
var _hoisted_3 = {
	key: 0,
	class: "koi-tag-filter__empty"
};
var _hoisted_4 = { class: "koi-tag-filter__list" };
var _hoisted_5 = ["onClick"];
//#endregion
//#region ../../packages/ui/src/components/ReTagFilter/theme/koi/ReTagFilter.vue
var ReTagFilter_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReTagFilter",
	inheritAttrs: true,
	__name: "ReTagFilter",
	props: {
		data: { default: () => [] },
		defaultValues: { default: () => ({}) }
	},
	emits: ["change"],
	setup(__props, { emit: __emit }) {
		/**
		* ReTagFilter koi 主题 —— 多组筛选标签组件（KoiTagFilter 移植）
		*
		* 样式走主题令牌（--theme-* 变量），与 default 保持相同 API。
		*/
		const props = __props;
		const selected = ref({});
		watch(() => props.defaultValues, () => {
			props.data.forEach((item) => {
				selected.value[item.key] = item.multiple ? props.defaultValues[item.key] ?? [""] : props.defaultValues[item.key] ?? "";
			});
		}, {
			deep: true,
			immediate: true
		});
		const emit = __emit;
		function select(item, option) {
			if (!item.multiple) {
				if (selected.value[item.key] !== option.value) selected.value[item.key] = option.value;
			} else {
				const arr = selected.value[item.key] ?? [];
				if (item.options[0].value === option.value) selected.value[item.key] = [option.value];
				else if (arr.includes(option.value)) {
					const idx = arr.findIndex((s) => s === option.value);
					arr.splice(idx, 1);
					if (arr.length === 0) selected.value[item.key] = [item.options[0].value];
				} else {
					arr.push(option.value);
					if (arr.indexOf(item.options[0].value) > 0) arr.splice(0, 1);
				}
			}
			emit("change", selected.value);
		}
		return (_ctx, _cache) => {
			const _component_el_icon = resolveComponent("el-icon");
			const _component_el_scrollbar = resolveComponent("el-scrollbar");
			return openBlock(), createElementBlock("div", _hoisted_1, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.data, (item) => {
				return openBlock(), createElementBlock("div", {
					key: item.key,
					class: "koi-tag-filter__group"
				}, [
					createBaseVNode("span", _hoisted_2, toDisplayString(item.title) + "：", 1),
					!item.options.length ? (openBlock(), createElementBlock("span", _hoisted_3, "暂无数据 ~")) : createCommentVNode("", true),
					createVNode(_component_el_scrollbar, null, {
						default: withCtx(() => [createBaseVNode("ul", _hoisted_4, [(openBlock(true), createElementBlock(Fragment, null, renderList(item.options, (option) => {
							return openBlock(), createElementBlock("li", {
								key: option.value,
								class: normalizeClass({ "is-active": option.value === selected.value[item.key] || Array.isArray(selected.value[item.key]) && selected.value[item.key].includes(option.value) }),
								onClick: ($event) => select(item, option)
							}, [renderSlot(_ctx.$slots, "default", { row: option }, () => [option.icon ? (openBlock(), createBlock(_component_el_icon, { key: 0 }, {
								default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(option.icon)))]),
								_: 2
							}, 1024)) : createCommentVNode("", true), createBaseVNode("span", null, toDisplayString(option.label), 1)], true)], 10, _hoisted_5);
						}), 128))])]),
						_: 2
					}, 1024)
				]);
			}), 128))]);
		};
	}
}), [["__scopeId", "data-v-6a8cedd6"]]);
//#endregion
export { ReTagFilter_default as default };
