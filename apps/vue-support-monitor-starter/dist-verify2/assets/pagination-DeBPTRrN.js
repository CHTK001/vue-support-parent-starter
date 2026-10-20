import { $n as normalizeClass, B as h, D as createVNode, Ht as watch, J as inject, L as getCurrentInstance, On as unref, Rn as isArray, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, gt as provide, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, vn as ref, wt as resolveDynamicComponent, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { t as CHANGE_EVENT } from "./event-CeZgVnv0.js";
import { i as componentSizes, n as useGlobalSize, r as useSizeProp } from "./use-size-BpzpcbJM.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { c as definePropType, f as isNumber, i as debugWarn, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { t as useDeprecated } from "./use-deprecated-qam6HGto.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { M as d_arrow_right_default, a as arrow_right_default, i as arrow_left_default, j as d_arrow_left_default, xt as more_filled_default } from "./dist-DogtK295.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as mutable } from "./typescript-CMUKtCBO.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/constants.mjs
var elPaginationKey = Symbol("elPaginationKey");
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/prev.mjs
var paginationPrevProps = buildProps({
	disabled: Boolean,
	currentPage: {
		type: Number,
		default: 1
	},
	prevText: { type: String },
	prevIcon: { type: iconPropType }
});
var paginationPrevEmits = { click: (evt) => evt instanceof MouseEvent };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/prev.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$4 = [
	"disabled",
	"aria-label",
	"aria-disabled"
];
var _hoisted_2$2 = { key: 0 };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/prev2.mjs
var prev_default = /* @__PURE__ */ defineComponent({
	name: "ElPaginationPrev",
	__name: "prev",
	props: paginationPrevProps,
	emits: paginationPrevEmits,
	setup(__props) {
		const props = __props;
		const { t } = useLocale();
		const internalDisabled = computed(() => props.disabled || props.currentPage <= 1);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("button", {
				type: "button",
				class: "btn-prev",
				disabled: internalDisabled.value,
				"aria-label": _ctx.prevText || unref(t)("el.pagination.prev"),
				"aria-disabled": internalDisabled.value,
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("click", $event))
			}, [_ctx.prevText ? (openBlock(), createElementBlock("span", _hoisted_2$2, toDisplayString(_ctx.prevText), 1)) : (openBlock(), createBlock(unref(ElIcon), { key: 1 }, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.prevIcon)))]),
				_: 1
			}))], 8, _hoisted_1$4);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/next.mjs
var paginationNextProps = buildProps({
	disabled: Boolean,
	currentPage: {
		type: Number,
		default: 1
	},
	pageCount: {
		type: Number,
		default: 50
	},
	nextText: { type: String },
	nextIcon: { type: iconPropType }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/next.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$3 = [
	"disabled",
	"aria-label",
	"aria-disabled"
];
var _hoisted_2$1 = { key: 0 };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/next2.mjs
var next_default = /* @__PURE__ */ defineComponent({
	name: "ElPaginationNext",
	__name: "next",
	props: paginationNextProps,
	emits: ["click"],
	setup(__props) {
		const props = __props;
		const { t } = useLocale();
		const internalDisabled = computed(() => props.disabled || props.currentPage === props.pageCount || props.pageCount === 0);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("button", {
				type: "button",
				class: "btn-next",
				disabled: internalDisabled.value,
				"aria-label": _ctx.nextText || unref(t)("el.pagination.next"),
				"aria-disabled": internalDisabled.value,
				onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("click", $event))
			}, [_ctx.nextText ? (openBlock(), createElementBlock("span", _hoisted_2$1, toDisplayString(_ctx.nextText), 1)) : (openBlock(), createBlock(unref(ElIcon), { key: 1 }, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(_ctx.nextIcon)))]),
				_: 1
			}))], 8, _hoisted_1$3);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/usePagination.mjs
var usePagination = () => inject(elPaginationKey, {});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/sizes.mjs
var paginationSizesProps = buildProps({
	pageSize: {
		type: Number,
		required: true
	},
	pageSizes: {
		type: definePropType(Array),
		default: () => mutable([
			10,
			20,
			30,
			40,
			50,
			100
		])
	},
	popperClass: { type: String },
	popperStyle: { type: definePropType([String, Object]) },
	disabled: Boolean,
	teleported: Boolean,
	size: {
		type: String,
		values: componentSizes
	},
	appendSizeTo: String
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/sizes2.mjs
var sizes_default = /* @__PURE__ */ defineComponent({
	name: "ElPaginationSizes",
	__name: "sizes",
	props: paginationSizesProps,
	emits: ["page-size-change"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const { t } = useLocale();
		const ns = useNamespace("pagination");
		const pagination = usePagination();
		const innerPageSize = ref(props.pageSize);
		watch(() => props.pageSizes, (newVal, oldVal) => {
			if (isEqual(newVal, oldVal)) return;
			if (isArray(newVal)) emit("page-size-change", newVal.includes(props.pageSize) ? props.pageSize : props.pageSizes[0]);
		});
		watch(() => props.pageSize, (newVal) => {
			innerPageSize.value = newVal;
		});
		const innerPageSizes = computed(() => props.pageSizes);
		function handleChange(val) {
			if (val !== innerPageSize.value) {
				innerPageSize.value = val;
				pagination.handleSizeChange?.(Number(val));
			}
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", { class: normalizeClass(unref(ns).e("sizes")) }, [createVNode(unref(ElSelect), {
				"model-value": innerPageSize.value,
				disabled: _ctx.disabled,
				"popper-class": _ctx.popperClass,
				"popper-style": _ctx.popperStyle,
				size: _ctx.size,
				teleported: _ctx.teleported,
				"validate-event": false,
				"append-to": _ctx.appendSizeTo,
				onChange: handleChange
			}, {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(innerPageSizes.value, (item) => {
					return openBlock(), createBlock(unref(ElOption), {
						key: item,
						value: item,
						label: item + unref(t)("el.pagination.pagesize")
					}, null, 8, ["value", "label"]);
				}), 128))]),
				_: 1
			}, 8, [
				"model-value",
				"disabled",
				"popper-class",
				"popper-style",
				"size",
				"teleported",
				"append-to"
			])], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/jumper.mjs
var paginationJumperProps = buildProps({ size: {
	type: String,
	values: componentSizes
} });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/jumper.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$2 = ["disabled"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/jumper2.mjs
var jumper_default = /* @__PURE__ */ defineComponent({
	name: "ElPaginationJumper",
	__name: "jumper",
	props: paginationJumperProps,
	setup(__props) {
		const { t } = useLocale();
		const ns = useNamespace("pagination");
		const { pageCount, disabled, currentPage, changeEvent } = usePagination();
		const userInput = ref();
		const innerValue = computed(() => userInput.value ?? currentPage?.value);
		function handleInput(val) {
			userInput.value = val ? +val : "";
		}
		function handleChange(val) {
			val = Math.trunc(+val);
			changeEvent?.(val);
			userInput.value = void 0;
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", {
				class: normalizeClass(unref(ns).e("jump")),
				disabled: unref(disabled)
			}, [
				createBaseVNode("span", { class: normalizeClass([unref(ns).e("goto")]) }, toDisplayString(unref(t)("el.pagination.goto")), 3),
				createVNode(unref(ElInput), {
					size: _ctx.size,
					class: normalizeClass([unref(ns).e("editor"), unref(ns).is("in-pagination")]),
					min: 1,
					max: unref(pageCount),
					disabled: unref(disabled),
					"model-value": innerValue.value,
					"validate-event": false,
					"aria-label": unref(t)("el.pagination.page"),
					type: "number",
					"onUpdate:modelValue": handleInput,
					onChange: handleChange
				}, null, 8, [
					"size",
					"class",
					"max",
					"disabled",
					"model-value",
					"aria-label"
				]),
				createBaseVNode("span", { class: normalizeClass([unref(ns).e("classifier")]) }, toDisplayString(unref(t)("el.pagination.pageClassifier")), 3)
			], 10, _hoisted_1$2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/total.mjs
var paginationTotalProps = buildProps({ total: {
	type: Number,
	default: 1e3
} });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/total.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = ["disabled"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/total2.mjs
var total_default = /* @__PURE__ */ defineComponent({
	name: "ElPaginationTotal",
	__name: "total",
	props: paginationTotalProps,
	setup(__props) {
		const { t } = useLocale();
		const ns = useNamespace("pagination");
		const { disabled } = usePagination();
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", {
				class: normalizeClass(unref(ns).e("total")),
				disabled: unref(disabled)
			}, toDisplayString(unref(t)("el.pagination.total", { total: _ctx.total })), 11, _hoisted_1$1);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/pager.mjs
var paginationPagerProps = buildProps({
	currentPage: {
		type: Number,
		default: 1
	},
	pageCount: {
		type: Number,
		required: true
	},
	pagerCount: {
		type: Number,
		default: 7
	},
	disabled: Boolean
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/pager.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = [
	"aria-current",
	"aria-label",
	"tabindex"
];
var _hoisted_2 = ["tabindex", "aria-label"];
var _hoisted_3 = [
	"aria-current",
	"aria-label",
	"tabindex"
];
var _hoisted_4 = ["tabindex", "aria-label"];
var _hoisted_5 = [
	"aria-current",
	"aria-label",
	"tabindex"
];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/components/pager2.mjs
var pager_default = /* @__PURE__ */ defineComponent({
	name: "ElPaginationPager",
	__name: "pager",
	props: paginationPagerProps,
	emits: [CHANGE_EVENT],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const nsPager = useNamespace("pager");
		const nsIcon = useNamespace("icon");
		const { t } = useLocale();
		const showPrevMore = ref(false);
		const showNextMore = ref(false);
		const quickPrevHover = ref(false);
		const quickNextHover = ref(false);
		const quickPrevFocus = ref(false);
		const quickNextFocus = ref(false);
		const pagers = computed(() => {
			const pagerCount = props.pagerCount;
			const halfPagerCount = (pagerCount - 1) / 2;
			const currentPage = Number(props.currentPage);
			const pageCount = Number(props.pageCount);
			let showPrevMore = false;
			let showNextMore = false;
			if (pageCount > pagerCount) {
				if (currentPage > pagerCount - halfPagerCount) showPrevMore = true;
				if (currentPage < pageCount - halfPagerCount) showNextMore = true;
			}
			const array = [];
			if (showPrevMore && !showNextMore) {
				const startPage = pageCount - (pagerCount - 2);
				for (let i = startPage; i < pageCount; i++) array.push(i);
			} else if (!showPrevMore && showNextMore) for (let i = 2; i < pagerCount; i++) array.push(i);
			else if (showPrevMore && showNextMore) {
				const offset = Math.floor(pagerCount / 2) - 1;
				for (let i = currentPage - offset; i <= currentPage + offset; i++) array.push(i);
			} else for (let i = 2; i < pageCount; i++) array.push(i);
			return array;
		});
		const prevMoreKls = computed(() => [
			"more",
			"btn-quickprev",
			nsIcon.b(),
			nsPager.is("disabled", props.disabled)
		]);
		const nextMoreKls = computed(() => [
			"more",
			"btn-quicknext",
			nsIcon.b(),
			nsPager.is("disabled", props.disabled)
		]);
		const tabindex = computed(() => props.disabled ? -1 : 0);
		watch(() => [
			props.pageCount,
			props.pagerCount,
			props.currentPage
		], ([pageCount, pagerCount, currentPage]) => {
			const halfPagerCount = (pagerCount - 1) / 2;
			let showPrev = false;
			let showNext = false;
			if (pageCount > pagerCount) {
				showPrev = currentPage > pagerCount - halfPagerCount;
				showNext = currentPage < pageCount - halfPagerCount;
			}
			quickPrevHover.value &&= showPrev;
			quickNextHover.value &&= showNext;
			showPrevMore.value = showPrev;
			showNextMore.value = showNext;
		}, { immediate: true });
		function onMouseEnter(forward = false) {
			if (props.disabled) return;
			if (forward) quickPrevHover.value = true;
			else quickNextHover.value = true;
		}
		function onFocus(forward = false) {
			if (forward) quickPrevFocus.value = true;
			else quickNextFocus.value = true;
		}
		function onEnter(e) {
			const target = e.target;
			if (target.tagName.toLowerCase() === "li" && Array.from(target.classList).includes("number")) {
				const newPage = Number(target.textContent);
				if (newPage !== props.currentPage) emit(CHANGE_EVENT, newPage);
			} else if (target.tagName.toLowerCase() === "li" && Array.from(target.classList).includes("more")) onPagerClick(e);
		}
		function onPagerClick(event) {
			const target = event.target;
			if (target.tagName.toLowerCase() === "ul" || props.disabled) return;
			let newPage = Number(target.textContent);
			const pageCount = props.pageCount;
			const currentPage = props.currentPage;
			const pagerCountOffset = props.pagerCount - 2;
			if (target.className.includes("more")) {
				if (target.className.includes("quickprev")) newPage = currentPage - pagerCountOffset;
				else if (target.className.includes("quicknext")) newPage = currentPage + pagerCountOffset;
			}
			if (!Number.isNaN(+newPage)) {
				if (newPage < 1) newPage = 1;
				if (newPage > pageCount) newPage = pageCount;
			}
			if (newPage !== currentPage) emit(CHANGE_EVENT, newPage);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("ul", {
				class: normalizeClass(unref(nsPager).b()),
				onClick: onPagerClick,
				onKeyup: withKeys(onEnter, ["enter"])
			}, [
				_ctx.pageCount > 0 ? (openBlock(), createElementBlock("li", {
					key: 0,
					class: normalizeClass([[unref(nsPager).is("active", _ctx.currentPage === 1), unref(nsPager).is("disabled", _ctx.disabled)], "number"]),
					"aria-current": _ctx.currentPage === 1,
					"aria-label": unref(t)("el.pagination.currentPage", { pager: 1 }),
					tabindex: tabindex.value
				}, " 1 ", 10, _hoisted_1)) : createCommentVNode("v-if", true),
				showPrevMore.value ? (openBlock(), createElementBlock("li", {
					key: 1,
					class: normalizeClass(prevMoreKls.value),
					tabindex: tabindex.value,
					"aria-label": unref(t)("el.pagination.prevPages", { pager: _ctx.pagerCount - 2 }),
					onMouseenter: _cache[0] || (_cache[0] = ($event) => onMouseEnter(true)),
					onMouseleave: _cache[1] || (_cache[1] = ($event) => quickPrevHover.value = false),
					onFocus: _cache[2] || (_cache[2] = ($event) => onFocus(true)),
					onBlur: _cache[3] || (_cache[3] = ($event) => quickPrevFocus.value = false)
				}, [(quickPrevHover.value || quickPrevFocus.value) && !_ctx.disabled ? (openBlock(), createBlock(unref(d_arrow_left_default), { key: 0 })) : (openBlock(), createBlock(unref(more_filled_default), { key: 1 }))], 42, _hoisted_2)) : createCommentVNode("v-if", true),
				(openBlock(true), createElementBlock(Fragment, null, renderList(pagers.value, (pager) => {
					return openBlock(), createElementBlock("li", {
						key: pager,
						class: normalizeClass([[unref(nsPager).is("active", _ctx.currentPage === pager), unref(nsPager).is("disabled", _ctx.disabled)], "number"]),
						"aria-current": _ctx.currentPage === pager,
						"aria-label": unref(t)("el.pagination.currentPage", { pager }),
						tabindex: tabindex.value
					}, toDisplayString(pager), 11, _hoisted_3);
				}), 128)),
				showNextMore.value ? (openBlock(), createElementBlock("li", {
					key: 2,
					class: normalizeClass(nextMoreKls.value),
					tabindex: tabindex.value,
					"aria-label": unref(t)("el.pagination.nextPages", { pager: _ctx.pagerCount - 2 }),
					onMouseenter: _cache[4] || (_cache[4] = ($event) => onMouseEnter()),
					onMouseleave: _cache[5] || (_cache[5] = ($event) => quickNextHover.value = false),
					onFocus: _cache[6] || (_cache[6] = ($event) => onFocus()),
					onBlur: _cache[7] || (_cache[7] = ($event) => quickNextFocus.value = false)
				}, [(quickNextHover.value || quickNextFocus.value) && !_ctx.disabled ? (openBlock(), createBlock(unref(d_arrow_right_default), { key: 0 })) : (openBlock(), createBlock(unref(more_filled_default), { key: 1 }))], 42, _hoisted_4)) : createCommentVNode("v-if", true),
				_ctx.pageCount > 1 ? (openBlock(), createElementBlock("li", {
					key: 3,
					class: normalizeClass([[unref(nsPager).is("active", _ctx.currentPage === _ctx.pageCount), unref(nsPager).is("disabled", _ctx.disabled)], "number"]),
					"aria-current": _ctx.currentPage === _ctx.pageCount,
					"aria-label": unref(t)("el.pagination.currentPage", { pager: _ctx.pageCount }),
					tabindex: tabindex.value
				}, toDisplayString(_ctx.pageCount), 11, _hoisted_5)) : createCommentVNode("v-if", true)
			], 34);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/src/pagination.mjs
/**
* It it user's responsibility to guarantee that the value of props.total... is number
* (same as pageSize, defaultPageSize, currentPage, defaultCurrentPage, pageCount)
* Otherwise we can reasonable infer that the corresponding field is absent
*/
var isAbsent = (v) => typeof v !== "number";
var paginationProps = buildProps({
	/**
	* @description options of item count per page
	*/
	pageSize: Number,
	/**
	* @description default initial value of page size, not setting is the same as setting 10
	*/
	defaultPageSize: Number,
	/**
	* @description total item count
	*/
	total: Number,
	/**
	* @description total page count. Set either `total` or `page-count` and pages will be displayed; if you need `page-sizes`, `total` is required
	*/
	pageCount: Number,
	/**
	* @description number of pagers. Pagination collapses when the total page count exceeds this value
	*/
	pagerCount: {
		type: Number,
		validator: (value) => {
			return isNumber(value) && Math.trunc(value) === value && value > 4 && value < 22 && value % 2 === 1;
		},
		default: 7
	},
	/**
	* @description current page number
	*/
	currentPage: Number,
	/**
	* @description default initial value of current-page, not setting is the same as setting 1
	*/
	defaultCurrentPage: Number,
	/**
	* @description layout of Pagination, elements separated with a comma
	*/
	layout: {
		type: String,
		default: [
			"prev",
			"pager",
			"next",
			"jumper",
			"->",
			"total"
		].join(", ")
	},
	/**
	* @description item count of each page
	*/
	pageSizes: {
		type: definePropType(Array),
		default: () => mutable([
			10,
			20,
			30,
			40,
			50,
			100
		])
	},
	/**
	* @description custom class name for the page size Select's dropdown
	*/
	popperClass: {
		type: String,
		default: ""
	},
	/**
	* @description custom style for the page size Select's dropdown
	*/
	popperStyle: { type: definePropType([String, Object]) },
	/**
	* @description text for the prev button
	*/
	prevText: {
		type: String,
		default: ""
	},
	/**
	* @description icon for the prev button, higher priority of `prev-text`
	*/
	prevIcon: {
		type: iconPropType,
		default: () => arrow_left_default
	},
	/**
	* @description text for the next button
	*/
	nextText: {
		type: String,
		default: ""
	},
	/**
	* @description icon for the next button, higher priority of `next-text`
	*/
	nextIcon: {
		type: iconPropType,
		default: () => arrow_right_default
	},
	/**
	* @description whether Pagination size is teleported to body
	*/
	teleported: {
		type: Boolean,
		default: true
	},
	/**
	* @description whether to use small pagination
	*/
	small: Boolean,
	/**
	* @description set page size
	*/
	size: useSizeProp,
	/**
	* @description whether the buttons have a background color
	*/
	background: Boolean,
	/**
	* @description whether Pagination is disabled
	*/
	disabled: Boolean,
	/**
	* @description whether to hide when there's only one page
	*/
	hideOnSinglePage: Boolean,
	/**
	* @description which element the size dropdown appends to.
	*/
	appendSizeTo: String
});
var paginationEmits = {
	"update:current-page": (val) => isNumber(val),
	"update:page-size": (val) => isNumber(val),
	"size-change": (val) => isNumber(val),
	change: (currentPage, pageSize) => isNumber(currentPage) && isNumber(pageSize),
	"current-change": (val) => isNumber(val),
	"prev-click": (val) => isNumber(val),
	"next-click": (val) => isNumber(val)
};
var componentName = "ElPagination";
var pagination_default = defineComponent({
	name: componentName,
	props: paginationProps,
	emits: paginationEmits,
	setup(props, { emit, slots }) {
		const { t } = useLocale();
		const ns = useNamespace("pagination");
		const vnodeProps = getCurrentInstance().vnode.props || {};
		const _globalSize = useGlobalSize();
		const _size = computed(() => props.small ? "small" : props.size ?? _globalSize.value);
		useDeprecated({
			from: "small",
			replacement: "size",
			version: "3.0.0",
			scope: "el-pagination",
			ref: "https://element-plus.org/zh-CN/component/pagination.html"
		}, computed(() => !!props.small));
		const hasCurrentPageListener = "onUpdate:currentPage" in vnodeProps || "onUpdate:current-page" in vnodeProps || "onCurrentChange" in vnodeProps;
		const hasPageSizeListener = "onUpdate:pageSize" in vnodeProps || "onUpdate:page-size" in vnodeProps || "onSizeChange" in vnodeProps;
		const assertValidUsage = computed(() => {
			if (isAbsent(props.total) && isAbsent(props.pageCount)) return false;
			if (!isAbsent(props.currentPage) && !hasCurrentPageListener) return false;
			if (props.layout.includes("sizes")) {
				if (!isAbsent(props.pageCount)) {
					if (!hasPageSizeListener) return false;
				} else if (!isAbsent(props.total)) {
					if (!isAbsent(props.pageSize)) {
						if (!hasPageSizeListener) return false;
					}
				}
			}
			return true;
		});
		const innerPageSize = ref(isAbsent(props.defaultPageSize) ? 10 : props.defaultPageSize);
		const innerCurrentPage = ref(isAbsent(props.defaultCurrentPage) ? 1 : props.defaultCurrentPage);
		const pageSizeBridge = computed({
			get() {
				return isAbsent(props.pageSize) ? innerPageSize.value : props.pageSize;
			},
			set(v) {
				if (isAbsent(props.pageSize)) innerPageSize.value = v;
				if (hasPageSizeListener) {
					emit("update:page-size", v);
					emit("size-change", v);
				}
			}
		});
		const pageCountBridge = computed(() => {
			let pageCount = 0;
			if (!isAbsent(props.pageCount)) pageCount = props.pageCount;
			else if (!isAbsent(props.total)) pageCount = Math.max(1, Math.ceil(props.total / pageSizeBridge.value));
			return pageCount;
		});
		const currentPageBridge = computed({
			get() {
				return isAbsent(props.currentPage) ? innerCurrentPage.value : props.currentPage;
			},
			set(v) {
				let newCurrentPage = v;
				if (v < 1) newCurrentPage = 1;
				else if (v > pageCountBridge.value) newCurrentPage = pageCountBridge.value;
				if (isAbsent(props.currentPage)) innerCurrentPage.value = newCurrentPage;
				if (hasCurrentPageListener) {
					emit("update:current-page", newCurrentPage);
					emit("current-change", newCurrentPage);
				}
			}
		});
		watch(pageCountBridge, (val) => {
			if (currentPageBridge.value > val) currentPageBridge.value = val;
		});
		watch([currentPageBridge, pageSizeBridge], (value) => {
			emit(CHANGE_EVENT, ...value);
		}, { flush: "post" });
		function handleCurrentChange(val) {
			currentPageBridge.value = val;
		}
		function handleSizeChange(val) {
			pageSizeBridge.value = val;
			const newPageCount = pageCountBridge.value;
			if (currentPageBridge.value > newPageCount) currentPageBridge.value = newPageCount;
		}
		function prev() {
			if (props.disabled) return;
			currentPageBridge.value -= 1;
			emit("prev-click", currentPageBridge.value);
		}
		function next() {
			if (props.disabled) return;
			currentPageBridge.value += 1;
			emit("next-click", currentPageBridge.value);
		}
		function addClass(element, cls) {
			if (element) {
				if (!element.props) element.props = {};
				element.props.class = [element.props.class, cls].join(" ");
			}
		}
		provide(elPaginationKey, {
			pageCount: pageCountBridge,
			disabled: computed(() => props.disabled),
			currentPage: currentPageBridge,
			changeEvent: handleCurrentChange,
			handleSizeChange
		});
		return () => {
			if (!assertValidUsage.value) {
				debugWarn(componentName, t("el.pagination.deprecationWarning"));
				return null;
			}
			if (!props.layout) return null;
			if (props.hideOnSinglePage && pageCountBridge.value <= 1) return null;
			const rootChildren = [];
			const rightWrapperChildren = [];
			const rightWrapperRoot = h("div", { class: ns.e("rightwrapper") }, rightWrapperChildren);
			const TEMPLATE_MAP = {
				prev: h(prev_default, {
					disabled: props.disabled,
					currentPage: currentPageBridge.value,
					prevText: props.prevText,
					prevIcon: props.prevIcon,
					onClick: prev
				}),
				jumper: h(jumper_default, { size: _size.value }),
				pager: h(pager_default, {
					currentPage: currentPageBridge.value,
					pageCount: pageCountBridge.value,
					pagerCount: props.pagerCount,
					onChange: handleCurrentChange,
					disabled: props.disabled
				}),
				next: h(next_default, {
					disabled: props.disabled,
					currentPage: currentPageBridge.value,
					pageCount: pageCountBridge.value,
					nextText: props.nextText,
					nextIcon: props.nextIcon,
					onClick: next
				}),
				sizes: h(sizes_default, {
					pageSize: pageSizeBridge.value,
					pageSizes: props.pageSizes,
					popperClass: props.popperClass,
					popperStyle: props.popperStyle,
					disabled: props.disabled,
					teleported: props.teleported,
					size: _size.value,
					appendSizeTo: props.appendSizeTo
				}),
				slot: slots?.default?.() ?? null,
				total: h(total_default, { total: isAbsent(props.total) ? 0 : props.total })
			};
			const components = props.layout.split(",").map((item) => item.trim());
			let haveRightWrapper = false;
			components.forEach((c) => {
				if (c === "->") {
					haveRightWrapper = true;
					return;
				}
				if (!haveRightWrapper) rootChildren.push(TEMPLATE_MAP[c]);
				else rightWrapperChildren.push(TEMPLATE_MAP[c]);
			});
			addClass(rootChildren[0], ns.is("first"));
			addClass(rootChildren[rootChildren.length - 1], ns.is("last"));
			if (haveRightWrapper && rightWrapperChildren.length > 0) {
				addClass(rightWrapperChildren[0], ns.is("first"));
				addClass(rightWrapperChildren[rightWrapperChildren.length - 1], ns.is("last"));
				rootChildren.push(rightWrapperRoot);
			}
			return h("div", { class: [
				ns.b(),
				ns.is("background", props.background),
				ns.m(_size.value)
			] }, rootChildren);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/pagination/index.mjs
var ElPagination = withInstall(pagination_default);
//#endregion
export { ElPagination as t };
