import { $ as mergeModels, $n as normalizeClass, Ft as useModel, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { t as ElPopover } from "./popover-BedfGaMS.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
//#region ../../packages/ui/src/components/ReSelect/layouts/CardDropdown.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-card-select__trigger-label" };
var _hoisted_2 = { class: "re-card-select__dropdown" };
var _hoisted_3 = {
	key: 0,
	class: "re-card-select__title"
};
var _hoisted_4 = {
	key: 1,
	class: "re-card-select__bulk"
};
var _hoisted_5 = {
	key: 2,
	class: "re-card-select__search"
};
var _hoisted_6 = ["placeholder"];
var _hoisted_7 = {
	key: 3,
	class: "re-card-select__loading"
};
var _hoisted_8 = {
	key: 4,
	class: "re-card-select__list"
};
var _hoisted_9 = {
	key: 0,
	class: "re-card-select__group-title"
};
var _hoisted_10 = ["onClick", "title"];
var _hoisted_11 = { class: "re-card-select__option-body" };
var _hoisted_12 = { class: "re-card-select__option-main" };
var _hoisted_13 = ["src"];
var _hoisted_14 = {
	key: 1,
	class: "re-card-select__option-icon re-card-select__option-glyph"
};
var _hoisted_15 = { class: "re-card-select__option-label" };
var _hoisted_16 = {
	key: 0,
	class: "re-card-select__option-desc"
};
var _hoisted_17 = {
	key: 0,
	class: "re-card-select__check",
	viewBox: "0 0 24 24",
	fill: "currentColor",
	width: "24",
	height: "24"
};
var _hoisted_18 = {
	key: 0,
	class: "re-card-select__empty"
};
//#endregion
//#region ../../packages/ui/src/components/ReSelect/layouts/CardDropdown.vue
var CardDropdown_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "CardReSelect",
	inheritAttrs: true,
	__name: "CardDropdown",
	props: /*@__PURE__*/ mergeModels({
		options: { default: () => [] },
		multiple: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
		filterable: {
			type: Boolean,
			default: false
		},
		placeholder: { default: "请选择" },
		title: { default: "" },
		popoverWidth: { default: 300 },
		compact: {
			type: Boolean,
			default: false
		},
		bulkActions: {
			type: Boolean,
			default: false
		},
		controlSize: { default: "default" }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* CardDropdownLayout —— 卡片式下拉选择器布局
		*
		* 整体结构：白色圆角悬浮弹窗 + 底部固定触发栏。
		* 弹窗内纵向排列选项条目：标题 + 描述 + 标签 + 对勾，
		* 高阶/付费模型带高亮底色与功能标签。
		*
		* 用法：
		*   <ReSelect
		*     layout="card-dropdown"
		*     title="模型"
		*     :data="[
		*       { label: 'Seedream 4.5', value: 'sd45', description: '旗舰出图', tag: '升级', premium: true, consumption: '专业出图・4 倍消耗' },
		*       { label: 'GPT-4o', value: 'gpt4o', description: '通用推理' },
		*       { label: 'GPT-3.5', value: 'gpt35', description: '轻量快速' },
		*     ]"
		*     v-model="selected"
		*   />
		*/
		const props = __props;
		const modelValue = useModel(__props, "modelValue");
		const isOpen = ref(false);
		const searchText = ref("");
		const triggerRef = ref(null);
		const measuredWidth = ref(0);
		const popoverWidthReal = computed(() => measuredWidth.value > 0 ? measuredWidth.value : props.popoverWidth);
		let resizeObserver = null;
		function measureTriggerWidth() {
			if (triggerRef.value) measuredWidth.value = triggerRef.value.getBoundingClientRect().width;
		}
		onMounted(() => {
			measureTriggerWidth();
			if (typeof ResizeObserver !== "undefined") {
				resizeObserver = new ResizeObserver(() => measureTriggerWidth());
				if (triggerRef.value) resizeObserver.observe(triggerRef.value);
			}
		});
		onBeforeUnmount(() => {
			resizeObserver?.disconnect();
			resizeObserver = null;
		});
		watch(isOpen, (v) => {
			if (v) {
				nextTick(() => measureTriggerWidth());
				searchText.value = "";
			}
		});
		const selectedSet = computed(() => {
			if (Array.isArray(modelValue.value)) return new Set(modelValue.value);
			if (modelValue.value !== "" && modelValue.value != null) return /* @__PURE__ */ new Set([modelValue.value]);
			return /* @__PURE__ */ new Set();
		});
		function isSelected(opt) {
			return selectedSet.value.has(opt.value);
		}
		function toggle(opt) {
			if (props.disabled || opt.disabled) return;
			if (!props.multiple) {
				modelValue.value = opt.value;
				isOpen.value = false;
				return;
			}
			const cur = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
			const idx = cur.indexOf(opt.value);
			if (idx >= 0) cur.splice(idx, 1);
			else cur.push(opt.value);
			modelValue.value = cur;
		}
		function selectAll() {
			if (props.disabled) return;
			modelValue.value = props.options.filter((o) => !o.disabled).map((o) => o.value);
		}
		function invertSelection() {
			if (props.disabled) return;
			const curSet = new Set(Array.isArray(modelValue.value) ? modelValue.value : []);
			modelValue.value = props.options.filter((o) => o.disabled ? curSet.has(o.value) : !curSet.has(o.value)).map((o) => o.value);
		}
		const filteredOptions = computed(() => {
			if (!searchText.value) return props.options;
			const kw = searchText.value.toLowerCase();
			return props.options.filter((o) => o.label.toLowerCase().includes(kw) || (o.description ?? "").toLowerCase().includes(kw));
		});
		function onSearch() {}
		const groupedOptions = computed(() => {
			const opts = filteredOptions.value;
			if (!opts.some((o) => o.group)) return [{
				label: "",
				items: opts
			}];
			const map = /* @__PURE__ */ new Map();
			const order = [];
			for (const o of opts) {
				const g = o.group ?? "";
				if (!map.has(g)) {
					map.set(g, []);
					order.push(g);
				}
				map.get(g).push(o);
			}
			return order.map((g) => ({
				label: g,
				items: map.get(g)
			}));
		});
		const triggerLabel = computed(() => {
			const list = props.options;
			const v = modelValue.value;
			if (v === null || v === void 0 || v === "") return "";
			if (Array.isArray(v)) return v.map((val) => list.find((o) => o.value === val)?.label ?? "").filter(Boolean).join("、");
			const found = list.find((o) => o.value === v);
			return found ? found.label : "";
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElPopover), {
				visible: isOpen.value,
				"onUpdate:visible": _cache[1] || (_cache[1] = ($event) => isOpen.value = $event),
				width: popoverWidthReal.value,
				"popper-class": "re-card-select__popper",
				placement: "bottom-start",
				"fallback-placements": [
					"top-start",
					"top-end",
					"bottom-end"
				],
				persistent: false,
				disabled: __props.disabled,
				trigger: "click"
			}, {
				reference: withCtx(() => [createBaseVNode("div", {
					ref_key: "triggerRef",
					ref: triggerRef,
					class: normalizeClass(["re-card-select__trigger", [`re-card-select__trigger--${__props.controlSize}`, {
						"re-card-select__trigger--open": isOpen.value,
						"re-card-select__trigger--compact": __props.compact
					}]])
				}, [createBaseVNode("span", _hoisted_1, toDisplayString(triggerLabel.value || __props.placeholder), 1), (openBlock(), createElementBlock("svg", {
					class: normalizeClass(["re-card-select__arrow", { "re-card-select__arrow--up": isOpen.value }]),
					viewBox: "0 0 20 20",
					fill: "currentColor",
					width: "14",
					height: "14"
				}, [..._cache[2] || (_cache[2] = [createBaseVNode("path", {
					"fill-rule": "evenodd",
					d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z",
					"clip-rule": "evenodd"
				}, null, -1)])], 2))], 2)]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_2, [
					renderSlot(_ctx.$slots, "header", {}, void 0, true),
					__props.title ? (openBlock(), createElementBlock("div", _hoisted_3, toDisplayString(__props.title), 1)) : createCommentVNode("", true),
					__props.multiple && __props.bulkActions ? (openBlock(), createElementBlock("div", _hoisted_4, [createBaseVNode("span", {
						class: "re-card-select__bulk-btn",
						onClick: selectAll
					}, "全选"), createBaseVNode("span", {
						class: "re-card-select__bulk-btn",
						onClick: invertSelection
					}, "反选")])) : createCommentVNode("", true),
					__props.filterable ? (openBlock(), createElementBlock("div", _hoisted_5, [withDirectives(createBaseVNode("input", {
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => searchText.value = $event),
						class: "re-card-select__search-input",
						placeholder: __props.placeholder,
						onInput: onSearch
					}, null, 40, _hoisted_6), [[vModelText, searchText.value]])])) : createCommentVNode("", true),
					__props.loading ? (openBlock(), createElementBlock("div", _hoisted_7, [..._cache[3] || (_cache[3] = [createBaseVNode("svg", {
						class: "re-card-select__spinner",
						viewBox: "0 0 24 24",
						fill: "none",
						stroke: "currentColor",
						"stroke-width": "2"
					}, [createBaseVNode("circle", {
						cx: "12",
						cy: "12",
						r: "10",
						opacity: "0.25"
					}), createBaseVNode("path", {
						d: "M12 2a10 10 0 0 1 10 10",
						"stroke-linecap": "round"
					})], -1), createBaseVNode("span", null, "加载中...", -1)])])) : (openBlock(), createElementBlock("div", _hoisted_8, [(openBlock(true), createElementBlock(Fragment, null, renderList(groupedOptions.value, (group, gIdx) => {
						return openBlock(), createElementBlock(Fragment, { key: gIdx }, [group.label ? (openBlock(), createElementBlock("div", _hoisted_9, toDisplayString(group.label), 1)) : createCommentVNode("", true), (openBlock(true), createElementBlock(Fragment, null, renderList(group.items, (opt) => {
							return openBlock(), createElementBlock("div", {
								key: String(opt.value),
								class: normalizeClass(["re-card-select__option", {
									"re-card-select__option--selected": isSelected(opt),
									"re-card-select__option--disabled": opt.disabled
								}]),
								onClick: ($event) => toggle(opt),
								title: opt.tip
							}, [_ctx.$slots.option ? renderSlot(_ctx.$slots, "option", {
								opt,
								selected: isSelected(opt),
								toggle
							}, void 0, true, 0) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [createBaseVNode("div", _hoisted_11, [createBaseVNode("div", _hoisted_12, [
								opt.image ? (openBlock(), createElementBlock("img", {
									key: 0,
									src: opt.image,
									class: "re-card-select__option-icon re-card-select__option-image",
									alt: ""
								}, null, 8, _hoisted_13)) : opt.icon ? (openBlock(), createElementBlock("span", _hoisted_14, toDisplayString(opt.icon), 1)) : createCommentVNode("", true),
								createBaseVNode("span", _hoisted_15, toDisplayString(opt.label), 1),
								opt.tag ? (openBlock(), createElementBlock("span", {
									key: 2,
									class: "re-card-select__option-tag",
									style: normalizeStyle(opt.tagColor ? { background: opt.tagColor } : {})
								}, toDisplayString(opt.tag), 5)) : createCommentVNode("", true)
							]), opt.description ? (openBlock(), createElementBlock("div", _hoisted_16, toDisplayString(opt.description), 1)) : createCommentVNode("", true)]), isSelected(opt) ? (openBlock(), createElementBlock("svg", _hoisted_17, [..._cache[4] || (_cache[4] = [createBaseVNode("path", { d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" }, null, -1)])])) : createCommentVNode("", true)], 64))], 10, _hoisted_10);
						}), 128))], 64);
					}), 128)), filteredOptions.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_18, "暂无匹配选项")) : createCommentVNode("", true)])),
					renderSlot(_ctx.$slots, "footer", {}, void 0, true)
				])]),
				_: 3
			}, 8, [
				"visible",
				"width",
				"disabled"
			]);
		};
	}
}), [["__scopeId", "data-v-9f951ce5"]]);
//#endregion
export { CardDropdown_default as default };
