import { $n as normalizeClass, E as createTextVNode, _ as createBaseVNode, b as createElementBlock, bt as renderList, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, o as Fragment, rr as toDisplayString, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
//#region ../../packages/ui/src/components/RePagination/layouts/Modern.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "rm-pager__total" };
var _hoisted_2 = {
	key: 0,
	class: "rm-pager__sizes"
};
var _hoisted_3 = {
	key: 0,
	class: "rm-pager__size-dropdown"
};
var _hoisted_4 = ["onClick"];
var _hoisted_5 = ["disabled"];
var _hoisted_6 = ["disabled", "onClick"];
var _hoisted_7 = { key: 0 };
var _hoisted_8 = { key: 1 };
var _hoisted_9 = ["disabled"];
//#endregion
//#region ../../packages/ui/src/components/RePagination/layouts/Modern.vue
var Modern_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "RePaginationModern",
	__name: "Modern",
	props: {
		total: {},
		currentPage: { default: 1 },
		pageSize: { default: 10 },
		pageSizes: { default: () => [
			10,
			20,
			50,
			100
		] },
		disabled: {
			type: Boolean,
			default: false
		},
		small: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"update:currentPage",
		"update:pageSize",
		"current-change",
		"size-change",
		"prev-click",
		"next-click"
	],
	setup(__props, { emit: __emit }) {
		/**
		* RePagination Modern 布局 —— 现代化扁平分页
		*
		* 设计要点：
		*   - 极致扁平、hover 主色背景
		*   - 当前页渐变 + 内白色高光 + 主色发光
		*   - size 选择按钮玻璃质感、激活态主色
		*   - chevron 按钮 hover 主色背景 + scale 1.1 反馈
		*   - dropdown 玻璃卡片 + 主色激活
		*/
		const props = __props;
		const emit = __emit;
		const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
		/** 生成页码数组（含省略号占位 -1） */
		const pages = computed(() => {
			const total = totalPages.value;
			const cur = props.currentPage;
			const items = [];
			if (total <= 7) {
				for (let i = 1; i <= total; i++) items.push(i);
				return items;
			}
			items.push(1);
			if (cur > 3) items.push(-1);
			const start = Math.max(2, cur - 1);
			const end = Math.min(total - 1, cur + 1);
			for (let i = start; i <= end; i++) items.push(i);
			if (cur < total - 2) items.push(-1);
			items.push(total);
			return items;
		});
		function goPage(p) {
			if (p < 1 || p > totalPages.value || p === props.currentPage || props.disabled) return;
			emit("update:currentPage", p);
			emit("current-change", p);
		}
		function prev() {
			if (props.currentPage <= 1 || props.disabled) return;
			const p = props.currentPage - 1;
			emit("update:currentPage", p);
			emit("current-change", p);
			emit("prev-click", p);
		}
		function next() {
			if (props.currentPage >= totalPages.value || props.disabled) return;
			const p = props.currentPage + 1;
			emit("update:currentPage", p);
			emit("current-change", p);
			emit("next-click", p);
		}
		const showSizeSelect = ref(false);
		function onSizeChange(size) {
			emit("update:pageSize", size);
			emit("size-change", size);
			if (props.currentPage !== 1) {
				emit("update:currentPage", 1);
				emit("current-change", 1);
			}
			showSizeSelect.value = false;
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("nav", mergeProps({ class: ["rm-pager", {
				"rm-pager--small": __props.small,
				"rm-pager--disabled": __props.disabled
			}] }, _ctx.$attrs), [
				createBaseVNode("span", _hoisted_1, "共 " + toDisplayString(__props.total) + " 条", 1),
				__props.pageSizes.length > 0 ? (openBlock(), createElementBlock("div", _hoisted_2, [createBaseVNode("button", {
					class: "rm-pager__size-btn",
					type: "button",
					onClick: _cache[0] || (_cache[0] = ($event) => showSizeSelect.value = !showSizeSelect.value)
				}, [createTextVNode(toDisplayString(__props.pageSize) + " 条/页 ", 1), _cache[1] || (_cache[1] = createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("polyline", { points: "6 9 12 15 18 9" })], -1))]), showSizeSelect.value ? (openBlock(), createElementBlock("div", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.pageSizes, (s) => {
					return openBlock(), createElementBlock("button", {
						key: s,
						class: normalizeClass(["rm-pager__size-option", { "rm-pager__size-option--active": __props.pageSize === s }]),
						type: "button",
						onClick: ($event) => onSizeChange(s)
					}, toDisplayString(s) + " 条/页", 11, _hoisted_4);
				}), 128))])) : createCommentVNode("", true)])) : createCommentVNode("", true),
				createBaseVNode("button", {
					class: "rm-pager__btn rm-pager__btn--nav",
					type: "button",
					disabled: __props.currentPage <= 1 || __props.disabled,
					"aria-label": "上一页",
					onClick: prev
				}, [..._cache[2] || (_cache[2] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("polyline", { points: "15 18 9 12 15 6" })], -1)])], 8, _hoisted_5),
				(openBlock(true), createElementBlock(Fragment, null, renderList(pages.value, (p, idx) => {
					return openBlock(), createElementBlock("button", {
						key: idx,
						class: normalizeClass(["rm-pager__btn", {
							"rm-pager__btn--active": p === __props.currentPage,
							"rm-pager__btn--ellipsis": p === -1
						}]),
						disabled: p === -1 || __props.disabled,
						type: "button",
						onClick: ($event) => p !== -1 ? goPage(p) : void 0
					}, [p === -1 ? (openBlock(), createElementBlock("span", _hoisted_7, "···")) : (openBlock(), createElementBlock("span", _hoisted_8, toDisplayString(p), 1))], 10, _hoisted_6);
				}), 128)),
				createBaseVNode("button", {
					class: "rm-pager__btn rm-pager__btn--nav",
					type: "button",
					disabled: __props.currentPage >= totalPages.value || __props.disabled,
					"aria-label": "下一页",
					onClick: next
				}, [..._cache[3] || (_cache[3] = [createBaseVNode("svg", {
					viewBox: "0 0 24 24",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2.2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("polyline", { points: "9 18 15 12 9 6" })], -1)])], 8, _hoisted_9)
			], 16);
		};
	}
}), [["__scopeId", "data-v-78f2102c"]]);
//#endregion
export { Modern_default as default };
