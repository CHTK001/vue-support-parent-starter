const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-DucHYv87.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/Modern-Ckt-MpB1.css","assets/research-vars-CgbVRiB9.css"])))=>i.map(i=>d[i]);
import { $n as normalizeClass, D as createVNode, E as createTextVNode, Ht as watch, Lt as useSlots, O as defineAsyncComponent, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, S as vShow, t as Transition } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as ElDatePicker } from "./date-picker-D-vMtORE.js";
import { r as ElSelect, t as ElOption } from "./select-0mzxLp1O.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { t as ElTreeSelect } from "./tree-select-BdJvpSDZ.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReSelect_default } from "./ReSelect-BrUGYrlz.js";
import { t as ReButton_default } from "./ReButton-CH6SFZxo.js";
/* empty css                       */
//#region ../../packages/ui/src/components/ReSearch/ReSearchToolbar.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1$1 = { class: "re-search-toolbar" };
var _hoisted_2$1 = {
	key: 0,
	class: "re-search-toolbar__custom"
};
var _hoisted_3$1 = { class: "re-search-toolbar__right" };
//#endregion
//#region ../../packages/ui/src/components/ReSearch/ReSearchToolbar.vue
var ReSearchToolbar_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSearchToolbar",
	inheritAttrs: false,
	__name: "ReSearchToolbar",
	props: {
		filterVisible: {
			type: Boolean,
			default: true
		},
		btnMode: { default: "icon" },
		showToggle: {
			type: Boolean,
			default: false
		},
		showSearch: {
			type: Boolean,
			default: true
		},
		showReset: {
			type: Boolean,
			default: true
		},
		showRefresh: {
			type: Boolean,
			default: false
		},
		showAdd: {
			type: Boolean,
			default: false
		},
		showBatchDelete: {
			type: Boolean,
			default: false
		},
		showBatchSelect: {
			type: Boolean,
			default: false
		},
		searchText: { default: "搜索" },
		resetText: { default: "重置" },
		addText: { default: "新增" },
		batchDeleteText: { default: "批量删除" },
		batchSelectText: { default: "批量勾选" },
		batchDeleteDisabled: {
			type: Boolean,
			default: false
		},
		batchSelectActive: {
			type: Boolean,
			default: false
		},
		batchSelectTextActive: { default: "取消勾选" },
		loading: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"search",
		"reset",
		"batch-delete",
		"batch-select"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReSearchToolbar —— ReSearch 内置操作按钮组
		*
		* 每个按钮均可通过 prop 配置显示 / 隐藏，点击时向上派发对应事件：
		*   - 搜索（search）
		*   - 重置（reset）
		*   - 批量删除（batch-delete）
		*   - 批量勾选（batch-select）
		*
		* 新增 / 刷新 / 显示隐藏过滤区 三个按钮已从组件移除。
		* 全部按钮复用 ReButton 渲染，保持与后台管理 UI 设计语言一致。
		*/
		const slots = useSlots();
		const props = __props;
		const emit = __emit;
		function btnProps() {
			if (props.btnMode === "icon") return {
				layout: "square",
				text: false,
				plain: false
			};
			return {
				layout: "modern",
				text: false,
				plain: false
			};
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", _hoisted_1$1, [slots.toolbar ? (openBlock(), createElementBlock("div", _hoisted_2$1, [renderSlot(_ctx.$slots, "toolbar", {}, void 0, true)])) : createCommentVNode("", true), createBaseVNode("div", _hoisted_3$1, [
				__props.showBatchSelect ? (openBlock(), createBlock(ReButton_default, mergeProps({ key: 0 }, btnProps(), {
					type: __props.batchSelectActive ? "warning" : "",
					icon: __props.batchSelectActive ? "Close" : "Select",
					onClick: _cache[0] || (_cache[0] = ($event) => emit("batch-select"))
				}), {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.batchSelectActive ? __props.batchSelectTextActive : __props.batchSelectText), 1)]),
					_: 1
				}, 16, ["type", "icon"])) : createCommentVNode("", true),
				__props.showBatchDelete ? (openBlock(), createBlock(ReButton_default, mergeProps({ key: 1 }, btnProps(), {
					type: "",
					icon: "Delete",
					disabled: __props.batchDeleteDisabled,
					onClick: _cache[1] || (_cache[1] = ($event) => emit("batch-delete"))
				}), {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.batchDeleteText), 1)]),
					_: 1
				}, 16, ["disabled"])) : createCommentVNode("", true),
				__props.showReset ? (openBlock(), createBlock(ReButton_default, mergeProps({ key: 2 }, btnProps(), {
					type: "",
					icon: "RefreshLeft",
					style: {
						"background": "var(--el-bg-color)",
						"border-color": "var(--el-border-color)",
						"color": "var(--el-text-color-regular)"
					},
					onClick: _cache[2] || (_cache[2] = ($event) => emit("reset"))
				}), {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.resetText), 1)]),
					_: 1
				}, 16)) : createCommentVNode("", true),
				__props.showSearch ? (openBlock(), createBlock(ReButton_default, mergeProps({ key: 3 }, btnProps(), {
					type: "primary",
					icon: "Search",
					loading: __props.loading,
					onClick: _cache[3] || (_cache[3] = ($event) => emit("search"))
				}), {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.searchText), 1)]),
					_: 1
				}, 16, ["loading"])) : createCommentVNode("", true)
			])]);
		};
	}
}), [["__scopeId", "data-v-06b782fe"]]);
//#endregion
//#region ../../packages/ui/src/components/ReSearch/theme/koi/ReSearch.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "koi-search__topbar" };
var _hoisted_2 = { class: "koi-search__badge" };
var _hoisted_3 = { class: "koi-search__body" };
var _hoisted_4 = {
	key: 0,
	class: "koi-search__field-label"
};
var _hoisted_5 = { class: "koi-search__actions" };
var MEASURE_WATCHDOG_MS = 300;
//#endregion
//#region ../../packages/ui/src/components/ReSearch/theme/koi/ReSearch.vue
var ReSearch_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReSearch",
	inheritAttrs: true,
	__name: "ReSearch",
	props: {
		isExpanded: {
			type: Boolean,
			default: false
		},
		showSearch: {
			type: Boolean,
			default: true
		},
		layout: { default: "default" },
		mode: { default: 2 },
		filterMode: { default: "form" },
		bordered: {
			type: Boolean,
			default: false
		},
		showLabel: {
			type: Boolean,
			default: false
		},
		tooltipText: { default: "搜索" },
		padding: { default: "12px 16px" },
		title: { default: "搜索" },
		filterVisible: {
			type: Boolean,
			default: true
		},
		btnMode: { default: "icon" },
		showSearchBtn: {
			type: Boolean,
			default: true
		},
		searchText: { default: "搜索" },
		showResetBtn: {
			type: Boolean,
			default: true
		},
		resetText: { default: "重置" },
		showBatchDeleteBtn: {
			type: Boolean,
			default: false
		},
		batchDeleteText: { default: "批量删除" },
		batchDeleteDisabled: {
			type: Boolean,
			default: false
		},
		showBatchSelectBtn: {
			type: Boolean,
			default: false
		},
		batchSelectText: { default: "批量勾选" },
		batchSelectActive: {
			type: Boolean,
			default: false
		},
		batchSelectTextActive: { default: "取消勾选" },
		loading: {
			type: Boolean,
			default: false
		},
		max: { default: 0 },
		filters: { default: () => [] },
		modelValue: { default: () => ({}) }
	},
	emits: [
		"update:filterVisible",
		"search",
		"reset",
		"batch-delete",
		"batch-select",
		"update:modelValue"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReSearch koi 主题 —— 横向搜索条（按截图重排版）
		*
		*   ┌────────────────────────────────────────────────────────────┐
		*   │ [🔍 搜索]                          展开 ∨                   │   ← topbar
		*   ├────────────────────────────────────────────────────────────┤
		*   │ 登录账号 [____]   用户名称 [____]   手机号 [____]   [搜索][重置] │   ← body
		*   └────────────────────────────────────────────────────────────┘
		*
		* 设计要点：
		*   - 顶部条：徽标（搜索图标 + 标题）在左，字段超宽时的「展开/收起」在右上
		*   - 内容行：字段左对齐（label 叠在 input 上方）、搜索/重置右对齐
		*   - 右上折叠按钮：仅当 hasOverflow（max>0 && item>max）时显示，
		*     控制 localExpanded（点击显示被 max 隐藏的多余字段）
		*   - 工具栏不渲染 新增/刷新/隐藏过滤区 三个按钮（已从组件移除）
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-DucHYv87.js"), __vite__mapDeps([0,1,2,3,4,5,6,7])));
		const slots = useSlots();
		const hasDefaultSlot = computed(() => slots.default && slots.default().length > 0);
		/** 过滤项配置类型 */
		const props = __props;
		const emit = __emit;
		/** 内部过滤值（支持 v-model 双向绑定，未受控时内部维护） */
		const filterValues = ref({ ...props.modelValue });
		/**
		* 上一次的过滤值快照。
		*
		* <p>用来识别「值由非空变空」这一次**清除动作**（点输入框的 X、清空下拉）。
		* 没有它就分不清「用户把条件清掉了」和「用户一直在输入」，也就无法在清空时
		* 立即重查 —— 表现为「输入框清干净了，表格却还停在旧条件上」。</p>
		*/
		let lastSeen = { ...filterValues.value };
		/** 空值判定：undefined / null / 空串 / 空数组都算「没有这个筛选条件」 */
		const isBlank = (v) => v === void 0 || v === null || v === "" || Array.isArray(v) && v.length === 0;
		watch(() => props.modelValue, (v) => {
			filterValues.value = { ...v };
			lastSeen = { ...v };
		}, { deep: true });
		function onFilterInput(key, val) {
			const prev = lastSeen[key];
			filterValues.value[key] = val;
			lastSeen = {
				...lastSeen,
				[key]: val
			};
			emit("update:modelValue", { ...filterValues.value });
			if (isBlank(val) && !isBlank(prev)) emit("search");
		}
		/** 是否有过滤内容（filters prop 或 default slot） */
		const hasFilterContent = computed(() => hasDefaultSlot.value || props.filters && props.filters.length > 0);
		/** 过滤区可见状态（支持 v-model:filterVisible，未受控时内部维护） */
		const localFilterVisible = ref(props.filterVisible);
		watch(() => props.filterVisible, (v) => {
			localFilterVisible.value = v;
		});
		/** 右上角"展开/收起"折叠（仅作用于被 max 隐藏的多余字段） */
		const localExpanded = ref(false);
		const itemSlots = computed(() => slots.default?.() ?? []);
		/** 项数：优先取 filters prop 的长度，否则数 default slot 的子节点 */
		const itemCount = computed(() => {
			const filterCount = props.filters?.length ?? 0;
			return filterCount > 0 ? filterCount : itemSlots.value.length;
		});
		/** 是否有字段被收纳（max 超限 或 容器宽度不足以一行放下全部字段） */
		const hasOverflow = computed(() => props.max > 0 && itemCount.value > props.max || fitCount.value > 0 && itemCount.value > fitCount.value);
		/** 折叠态显示的字段数：受 max 与容器实际可容纳数（fitCount）双重限制 */
		const collapsedLimit = computed(() => {
			if (!hasOverflow.value) return itemCount.value;
			const byMax = props.max > 0 ? props.max : itemCount.value;
			const byFit = fitCount.value > 0 ? fitCount.value : byMax;
			return Math.max(1, Math.min(byMax, byFit));
		});
		/** 折叠态下第 index 个字段是否被隐藏（测量期间全部可见） */
		function isFieldHidden(index) {
			if (measuring.value || !hasOverflow.value || localExpanded.value) return false;
			return index >= collapsedLimit.value;
		}
		function toggleExpand() {
			localExpanded.value = !localExpanded.value;
			lastWidth = -1;
			nextTick(() => measureFit());
		}
		const contentEl = ref(null);
		/** ========== 响应式收纳：测量首行可容纳的字段数 ========== */
		/** 测量看门狗超时（ms）：超时强制复位 measuring，避免字段被永久隐藏 */
		const fitCount = ref(0);
		const measuring = ref(false);
		let resizeObserver = null;
		let measureWatchdog;
		let lastWidth = -1;
		function measureFit() {
			const el = contentEl.value;
			if (!el || !localFilterVisible.value || measuring.value) return;
			const w = el.clientWidth;
			if (w === lastWidth && fitCount.value > 0) return;
			measuring.value = true;
			if (measureWatchdog) clearTimeout(measureWatchdog);
			measureWatchdog = setTimeout(() => {
				measureWatchdog = void 0;
				measuring.value = false;
			}, MEASURE_WATCHDOG_MS);
			nextTick(() => {
				try {
					const items = Array.from(el.children);
					if (items.length === 0) {
						fitCount.value = 0;
						return;
					}
					const top0 = items[0].offsetTop;
					let count = 0;
					for (const it of items) if (it.offsetParent !== null && it.offsetTop <= top0 + 1) count += 1;
					else break;
					fitCount.value = count;
					lastWidth = w;
				} finally {
					if (measureWatchdog) {
						clearTimeout(measureWatchdog);
						measureWatchdog = void 0;
					}
					measuring.value = false;
				}
			});
		}
		/** slot 模式：无法用 class 绑定，直接操作子节点显隐 */
		function applySlotCollapse() {
			if (props.filters && props.filters.length > 0) return;
			const el = contentEl.value;
			if (!el) return;
			Array.from(el.children).forEach((child, i) => {
				const hidden = isFieldHidden(i);
				child.style.display = hidden ? "none" : "";
			});
		}
		watch([
			collapsedLimit,
			hasOverflow,
			localExpanded,
			measuring,
			itemCount
		], applySlotCollapse, { flush: "post" });
		watch([itemCount, () => props.max], () => {
			lastWidth = -1;
			nextTick(() => measureFit());
		});
		watch(localFilterVisible, () => {
			nextTick(() => measureFit());
		});
		onMounted(() => {
			if (typeof ResizeObserver === "undefined") return;
			resizeObserver = new ResizeObserver(() => measureFit());
			if (contentEl.value) resizeObserver.observe(contentEl.value);
			nextTick(() => measureFit());
		});
		onBeforeUnmount(() => {
			resizeObserver?.disconnect();
			resizeObserver = null;
			if (measureWatchdog) {
				clearTimeout(measureWatchdog);
				measureWatchdog = void 0;
			}
			measuring.value = false;
		});
		function resetForm() {
			if (props.filters && props.filters.length > 0) {
				const cleared = {};
				props.filters.forEach((f) => {
					cleared[f.key] = void 0;
				});
				filterValues.value = cleared;
				lastSeen = { ...cleared };
				emit("update:modelValue", { ...cleared });
			}
			nextTick(() => {
				const el = contentEl.value?.querySelector(".el-form");
				if (!el) return;
				el.__vueParentComponent?.exposed?.resetFields?.();
			});
			emit("reset");
		}
		const containerStyle = computed(() => ({ padding: props.padding }));
		/**
		* 过滤项控件的可访问名称。
		*
		* <p>为什么需要：过滤项的标签是**兄弟节点** {@code <span class="koi-search__field-label">}，
		* 既没有 {@code <label for>}，控件上也没有 {@code aria-label} /
		* {@code aria-labelledby}。视觉上看得见标签，读屏却读不到 ——
		* 浏览器实测这些 input 的 {@code missingAccessibleName} 全是 {@code true}，
		* 读屏用户只能听出「编辑框」，不知道该填什么。</p>
		*
		* <p>取 filter.label，取不到就退回 placeholder，保证任何配置下都有名字。
		* Element Plus 的 {@code ElInput} 等把 {@code aria-label} 声明成了正式 prop
		* （{@code useAriaProps} 的 {@code ariaLabel}），会落到内层真正的 input 上，
		* 而不是只停在包裹 div 上。</p>
		*/
		function ariaOf(filter) {
			return filter.label || filter.placeholder || void 0;
		}
		/** 过滤项是否声明了远端数据源（dataSource / url / loader） */
		function isRemoteSelectFilter(filter) {
			return Boolean(filter.url) || typeof filter.loader === "function" || typeof filter.dataSource === "string" || typeof filter.dataSource === "function";
		}
		/** 过滤项生效的远端 url：显式 url 优先，dataSource 为字符串时兜底 */
		function filterUrl(filter) {
			return filter.url || (typeof filter.dataSource === "string" ? filter.dataSource : "");
		}
		/** 过滤项生效的远端加载器：显式 loader 优先，dataSource 为函数时兜底 */
		function filterLoader(filter) {
			return filter.loader || (typeof filter.dataSource === "function" ? filter.dataSource : void 0);
		}
		return (_ctx, _cache) => {
			return __props.layout === "modern" ? (openBlock(), createBlock(unref(ModernLayout), {
				key: 0,
				"is-expanded": __props.isExpanded,
				"show-search": __props.showSearch,
				bordered: __props.bordered,
				mode: __props.mode,
				"show-label": __props.showLabel,
				"tooltip-text": __props.tooltipText,
				padding: __props.padding
			}, {
				footer: withCtx(() => [renderSlot(_ctx.$slots, "footer", {}, void 0, true)]),
				action: withCtx(() => [renderSlot(_ctx.$slots, "action", {}, void 0, true)]),
				default: withCtx(() => [renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
				_: 3
			}, 8, [
				"is-expanded",
				"show-search",
				"bordered",
				"mode",
				"show-label",
				"tooltip-text",
				"padding"
			])) : (openBlock(), createElementBlock("div", {
				key: 1,
				class: normalizeClass(["koi-search", { "koi-search--bordered": __props.bordered }]),
				style: normalizeStyle(containerStyle.value)
			}, [createBaseVNode("div", _hoisted_1, [createBaseVNode("div", _hoisted_2, [_cache[4] || (_cache[4] = createBaseVNode("span", { class: "koi-search__badge-icon" }, [createBaseVNode("svg", {
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2",
				width: "14",
				height: "14"
			}, [createBaseVNode("circle", {
				cx: "11",
				cy: "11",
				r: "7"
			}), createBaseVNode("line", {
				x1: "21",
				y1: "21",
				x2: "16.5",
				y2: "16.5"
			})])], -1)), createBaseVNode("span", null, toDisplayString(__props.title), 1)]), hasOverflow.value ? (openBlock(), createElementBlock("button", {
				key: 0,
				type: "button",
				class: normalizeClass(["koi-search__expand", { "koi-search__expand--expanded": localExpanded.value }]),
				onClick: toggleExpand
			}, [createBaseVNode("span", null, toDisplayString(localExpanded.value ? "收起" : "展开"), 1), _cache[5] || (_cache[5] = createBaseVNode("svg", {
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				"stroke-width": "2",
				width: "12",
				height: "12"
			}, [createBaseVNode("polyline", { points: "6 9 12 15 18 9" })], -1))], 2)) : createCommentVNode("", true)]), withDirectives(createBaseVNode("div", _hoisted_3, [createVNode(Transition, { name: "re-search-collapse" }, {
				default: withCtx(() => [withDirectives(createBaseVNode("div", {
					ref_key: "contentEl",
					ref: contentEl,
					class: normalizeClass(["koi-search__fields", { "koi-search__fields--data": __props.filterMode === "data" }])
				}, [__props.filters && __props.filters.length > 0 ? (openBlock(true), createElementBlock(Fragment, { key: 0 }, renderList(__props.filters, (filter, index) => {
					return openBlock(), createElementBlock("div", {
						key: filter.key,
						class: normalizeClass(["koi-search__field", { "koi-search__field--hidden": isFieldHidden(index) }])
					}, [__props.filterMode === "form" && filter.label ? (openBlock(), createElementBlock("span", _hoisted_4, toDisplayString(filter.label), 1)) : createCommentVNode("", true), !filter.type || filter.type === "input" ? (openBlock(), createBlock(unref(ElInput), mergeProps({
						key: 1,
						modelValue: filterValues.value[filter.key],
						"onUpdate:modelValue": ($event) => filterValues.value[filter.key] = $event,
						placeholder: filter.placeholder || (__props.filterMode === "form" ? "请输入" : filter.label || "请输入"),
						"aria-label": ariaOf(filter),
						clearable: ""
					}, { ref_for: true }, filter.attrs || {}, {
						onInput: (val) => onFilterInput(filter.key, val),
						onKeyup: _cache[0] || (_cache[0] = withKeys(($event) => emit("search"), ["enter"]))
					}), null, 16, [
						"modelValue",
						"onUpdate:modelValue",
						"placeholder",
						"aria-label",
						"onInput"
					])) : filter.type === "select" && isRemoteSelectFilter(filter) ? (openBlock(), createBlock(ReSelect_default, mergeProps({
						key: 2,
						"model-value": filterValues.value[filter.key],
						data: filter.options || [],
						url: filterUrl(filter),
						loader: filterLoader(filter),
						placeholder: filter.placeholder || (__props.filterMode === "form" ? "请选择" : filter.label || "请选择"),
						"aria-label": ariaOf(filter),
						clearable: ""
					}, { ref_for: true }, filter.attrs || {}, { "onUpdate:modelValue": (val) => onFilterInput(filter.key, val) }), null, 16, [
						"model-value",
						"data",
						"url",
						"loader",
						"placeholder",
						"aria-label",
						"onUpdate:modelValue"
					])) : filter.type === "select" ? (openBlock(), createBlock(unref(ElSelect), mergeProps({
						key: 3,
						modelValue: filterValues.value[filter.key],
						"onUpdate:modelValue": ($event) => filterValues.value[filter.key] = $event,
						placeholder: filter.placeholder || (__props.filterMode === "form" ? "请选择" : filter.label || "请选择"),
						"aria-label": ariaOf(filter),
						clearable: ""
					}, { ref_for: true }, filter.attrs || {}, { onChange: (val) => onFilterInput(filter.key, val) }), {
						default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(filter.options || [], (opt) => {
							return openBlock(), createBlock(unref(ElOption), {
								key: opt.value,
								label: opt.label,
								value: opt.value
							}, null, 8, ["label", "value"]);
						}), 128))]),
						_: 2
					}, 1040, [
						"modelValue",
						"onUpdate:modelValue",
						"placeholder",
						"aria-label",
						"onChange"
					])) : filter.type === "square" ? (openBlock(), createBlock(ReSelect_default, mergeProps({
						key: 4,
						"model-value": filterValues.value[filter.key],
						layout: "square",
						data: filter.options || [],
						"aria-label": ariaOf(filter)
					}, { ref_for: true }, filter.attrs || {}, { "onUpdate:modelValue": (val) => onFilterInput(filter.key, val) }), null, 16, [
						"model-value",
						"data",
						"aria-label",
						"onUpdate:modelValue"
					])) : filter.type === "date" ? (openBlock(), createBlock(unref(ElDatePicker), mergeProps({
						key: 5,
						modelValue: filterValues.value[filter.key],
						"onUpdate:modelValue": ($event) => filterValues.value[filter.key] = $event,
						placeholder: filter.placeholder || (__props.filterMode === "form" ? "请选择日期" : filter.label || "请选择日期"),
						"aria-label": ariaOf(filter),
						type: "date",
						"value-format": "YYYY-MM-DD",
						clearable: ""
					}, { ref_for: true }, filter.attrs || {}, { onChange: (val) => onFilterInput(filter.key, val) }), null, 16, [
						"modelValue",
						"onUpdate:modelValue",
						"placeholder",
						"aria-label",
						"onChange"
					])) : filter.type === "daterange" ? (openBlock(), createBlock(unref(ElDatePicker), mergeProps({
						key: 6,
						modelValue: filterValues.value[filter.key],
						"onUpdate:modelValue": ($event) => filterValues.value[filter.key] = $event,
						"start-placeholder": filter.placeholder || "开始日期",
						"end-placeholder": "结束日期",
						"aria-label": ariaOf(filter),
						type: "daterange",
						"value-format": "YYYY-MM-DD",
						clearable: ""
					}, { ref_for: true }, filter.attrs || {}, { onChange: (val) => onFilterInput(filter.key, val) }), null, 16, [
						"modelValue",
						"onUpdate:modelValue",
						"start-placeholder",
						"aria-label",
						"onChange"
					])) : filter.type === "treeselect" ? (openBlock(), createBlock(unref(ElTreeSelect), mergeProps({
						key: 7,
						modelValue: filterValues.value[filter.key],
						"onUpdate:modelValue": ($event) => filterValues.value[filter.key] = $event,
						data: filter.options || [],
						placeholder: filter.placeholder || (__props.filterMode === "form" ? "请选择" : filter.label || "请选择"),
						"aria-label": ariaOf(filter),
						clearable: "",
						"check-strictly": ""
					}, { ref_for: true }, filter.attrs || {}, { onChange: (val) => onFilterInput(filter.key, val) }), null, 16, [
						"modelValue",
						"onUpdate:modelValue",
						"data",
						"placeholder",
						"aria-label",
						"onChange"
					])) : createCommentVNode("", true)], 2);
				}), 128)) : createCommentVNode("", true), renderSlot(_ctx.$slots, "default", {}, void 0, true)], 2), [[vShow, localFilterVisible.value]])]),
				_: 3
			}), createBaseVNode("div", _hoisted_5, [
				__props.showSearchBtn ? withDirectives((openBlock(), createBlock(ReButton_default, {
					key: 0,
					type: "primary",
					icon: "Search",
					"show-text": "",
					loading: __props.loading,
					onClick: _cache[1] || (_cache[1] = ($event) => emit("search"))
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.searchText), 1)]),
					_: 1
				}, 8, ["loading"])), [[vShow, localFilterVisible.value]]) : createCommentVNode("", true),
				__props.showResetBtn ? withDirectives((openBlock(), createBlock(ReButton_default, {
					key: 1,
					icon: "RefreshLeft",
					"show-text": "",
					onClick: resetForm
				}, {
					default: withCtx(() => [createTextVNode(toDisplayString(__props.resetText), 1)]),
					_: 1
				}, 512)), [[vShow, localFilterVisible.value]]) : createCommentVNode("", true),
				withDirectives(createBaseVNode("span", { class: "koi-search__hint" }, toDisplayString(__props.title) + "已收起", 513), [[vShow, !localFilterVisible.value]]),
				__props.showBatchDeleteBtn || __props.showBatchSelectBtn || !!unref(slots).footer ? (openBlock(), createBlock(ReSearchToolbar_default, {
					key: 2,
					"filter-visible": localFilterVisible.value,
					"btn-mode": __props.btnMode,
					"show-toggle": false,
					"show-search": false,
					"show-reset": false,
					"show-refresh": false,
					"show-add": false,
					"show-batch-delete": __props.showBatchDeleteBtn,
					"batch-delete-text": __props.batchDeleteText,
					"batch-delete-disabled": __props.batchDeleteDisabled,
					"show-batch-select": __props.showBatchSelectBtn,
					"batch-select-text": __props.batchSelectText,
					"batch-select-active": __props.batchSelectActive,
					"batch-select-text-active": __props.batchSelectTextActive,
					onBatchDelete: _cache[2] || (_cache[2] = ($event) => emit("batch-delete")),
					onBatchSelect: _cache[3] || (_cache[3] = ($event) => emit("batch-select"))
				}, {
					toolbar: withCtx(() => [renderSlot(_ctx.$slots, "footer", {}, void 0, true)]),
					_: 3
				}, 8, [
					"filter-visible",
					"btn-mode",
					"show-batch-delete",
					"batch-delete-text",
					"batch-delete-disabled",
					"show-batch-select",
					"batch-select-text",
					"batch-select-active",
					"batch-select-text-active"
				])) : createCommentVNode("", true)
			])], 512), [[vShow, hasFilterContent.value]])], 6));
		};
	}
}), [["__scopeId", "data-v-2e42486c"]]);
//#endregion
export { ReSearch_default as default };
