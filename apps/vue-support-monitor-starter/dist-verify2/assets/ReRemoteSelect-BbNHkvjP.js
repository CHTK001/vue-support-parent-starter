const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/src-DvnKlGxV.js","assets/src-CEonioA3.js","assets/rolldown-runtime-CEgmsyvS.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/runtime-dom.esm-bundler-RRl39S3n.js","assets/src-BVnZQO9c.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/event-BIZRdi1l.js","assets/browser-DVA6k_z5.js","assets/dist-DI3cGDuP.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/dist-Clzx2YUA.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/dist-DogtK295.js","assets/icon-C0dIJHSD.js","assets/icon-CKvLDnIU.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/aria-DKP9Ei-1.js","assets/message-BQI5cdKE.js","assets/use-size-BpzpcbJM.js","assets/use-empty-values-B_20a6o3.js","assets/isEqual-BgqgQyvI.js","assets/_baseIsEqual-4zTScXwg.js","assets/_Uint8Array-Cf2dnQh6.js","assets/_arrayPush-DAsStFRE.js","assets/typescript-CMUKtCBO.js","assets/use-global-config-CwtC64sR.js","assets/use-locale-MdBtu2ja.js","assets/use-z-index-Q40Vppe1.js","assets/message-box-CXDJvJwn.js","assets/input-Bbhiel27.js","assets/event-CeZgVnv0.js","assets/raf-Ck-OXP6t.js","assets/use-form-common-props-DzQ9ZY64.js","assets/constants-ntbKDiND.js","assets/use-composition-BHiYKdrO.js","assets/use-aria-VmjVV7Ut.js","assets/pick-BwGnaelS.js","assets/_flatRest-CP5Zoeqo.js","assets/_baseFlatten-D6objHuc.js","assets/hasIn-COufhDdn.js","assets/use-form-item-D-dEMqBj.js","assets/use-id-C2v-tXFq.js","assets/use-draggable-P7Ccy1As.js","assets/clamp--xaQdoQg.js","assets/toNumber-PE_CR5nS.js","assets/overlay-D6Leq3yd.js","assets/scroll-CaaKdoVq.js","assets/focus-trap-B31xXeBw.js","assets/button-CLXz94Uh.js","assets/use-deprecated-qam6HGto.js","assets/validator-PIu3bjQD.js","assets/src-DzQcKxHP.js","assets/src-DDwlSqPX.js","assets/file-viewer-mindmap-DFVq45rQ.js","assets/file-viewer-drawing-DeKTjxNF.js","assets/vue-router-D43uXGPs.js","assets/src-C3nkWua1.css","assets/src-CUe0zRl2.js","assets/pinia-Dz8LpwBD.js","assets/lib-DSELavqH.js","assets/auth-C8MLoNwd.js","assets/ReText-CEXV0N8J.js","assets/text-Dt3_J0ai.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReText-D0uOzYur.css"])))=>i.map(i=>d[i]);
import { $ as mergeModels, $n as normalizeClass, D as createVNode, Ft as useModel, Ht as watch, On as unref, Yt as withDirectives, _ as createBaseVNode, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, tt as nextTick, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { C as withKeys, w as withModifiers, x as vModelText } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { Qn as debounce, t as useDataSource } from "./src-CEonioA3.js";
import { t as ElPopover } from "./popover-BedfGaMS.js";
import "./src-DDwlSqPX.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
/* empty css                     */
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReRemoteSelect/ReRemoteSelect.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = [
	"placeholder",
	"disabled",
	"onKeydown"
];
var _hoisted_2 = { class: "re-remote-select__dropdown" };
var _hoisted_3 = ["placeholder"];
var _hoisted_4 = {
	key: 1,
	class: "re-remote-select__empty"
};
var _hoisted_5 = {
	key: 2,
	class: "re-remote-select__empty"
};
var _hoisted_6 = {
	key: 3,
	class: "re-remote-select__list"
};
var _hoisted_7 = ["onClick"];
var _hoisted_8 = { class: "re-remote-select__opt-label" };
var _hoisted_9 = {
	key: 0,
	class: "re-remote-select__opt-check",
	viewBox: "0 0 20 20",
	fill: "currentColor",
	width: "14",
	height: "14"
};
var _hoisted_10 = [
	"disabled",
	"title",
	"aria-label"
];
//#endregion
//#region ../../packages/ui/src/components/ReRemoteSelect/ReRemoteSelect.vue
var ReRemoteSelect_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReRemoteSelect",
	inheritAttrs: true,
	__name: "ReRemoteSelect",
	props: /*@__PURE__*/ mergeModels({
		url: { default: "" },
		loader: {
			type: Function,
			default: void 0
		},
		params: { default: () => ({}) },
		options: { default: void 0 },
		enableInput: {
			type: Boolean,
			default: true
		},
		filterable: {
			type: Boolean,
			default: true
		},
		clearable: {
			type: Boolean,
			default: true
		},
		disabled: {
			type: Boolean,
			default: false
		},
		placeholder: { default: "请选择" },
		inputPlaceholder: { default: "请输入或选择" },
		size: { default: "default" },
		autoReload: {
			type: Boolean,
			default: true
		},
		syncIcon: { default: "Refresh" },
		syncTooltip: { default: "刷新远程数据" },
		debounceMs: { default: 300 },
		labelKey: { default: "label" },
		valueKey: { default: "value" },
		popoverWidth: { default: 280 }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: /*@__PURE__*/ mergeModels([
		"sync",
		"input-change",
		"search",
		"update:modelValue"
	], ["update:modelValue"]),
	setup(__props, { emit: __emit }) {
		/**
		* ReRemoteSelect —— 远程 + 自定义下拉选择组件
		*
		* 设计要点：
		*   - 视觉整体：左侧 trigger bar（输入 + 选中回显）+ 右侧同步按钮同框内
		*   - 左侧模仿 ReSelect card-dropdown 风格：选中态/输入态 + 下拉弹层
		*   - enableInput 开关：true 时 trigger 内可输入（搜索/自定义值），false 时仅显示
		*   - 同步按钮：loading 旋转 + hover 主色高亮
		*   - 数据源：url（GET 自动重试）/ loader（自定义函数）/ options 静态
		*   - 现代化扁平化：玻璃质感 + 主色聚焦光晕
		*/
		const model = useModel(__props, "modelValue");
		const props = __props;
		const emit = __emit;
		const keyword = ref("");
		const inputDraft = ref("");
		const popoverVisible = ref(false);
		const triggerRef = ref(null);
		function normalize(rows) {
			if (!Array.isArray(rows)) return [];
			return rows.map((r) => {
				if (r == null) return null;
				if (typeof r === "object") {
					const v = r[props.valueKey];
					const l = r[props.labelKey];
					if (v == null || l == null) return null;
					return {
						...r,
						label: String(l),
						value: v
					};
				}
				return {
					label: String(r),
					value: r
				};
			}).filter((x) => x !== null);
		}
		const isRemote = computed(() => Boolean(props.url) || typeof props.loader === "function");
		const sourceRef = computed(() => {
			if (typeof props.loader === "function") return async () => {
				const paramObj = { ...props.params ?? {} };
				if (keyword.value) paramObj.keyword = keyword.value;
				return normalize(await props.loader(paramObj));
			};
			if (props.url) return async () => {
				const qs = new URLSearchParams();
				const paramObj = { ...props.params ?? {} };
				if (keyword.value) paramObj.keyword = keyword.value;
				for (const [k, v] of Object.entries(paramObj)) {
					if (v === void 0 || v == null || v === "") continue;
					qs.set(k, String(v));
				}
				const sep = props.url.includes("?") ? "&" : "?";
				const fullUrl = `${props.url}${qs.toString() ? sep + qs.toString() : ""}`;
				const { getApiHttp } = await __vitePreload(async () => {
					const { getApiHttp } = await import("./src-DvnKlGxV.js");
					return { getApiHttp };
				}, __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71]));
				const body = (await getApiHttp().get(fullUrl)).data;
				if (Array.isArray(body)) return normalize(body);
				if (body && typeof body === "object") {
					const obj = body;
					for (const key of [
						"records",
						"rows",
						"list",
						"items",
						"content",
						"data"
					]) if (Array.isArray(obj[key])) return normalize(obj[key]);
				}
				return [];
			};
			return (props.options ?? []).slice();
		});
		const { loading: dataLoading, data: dataList, reload: dsReload } = useDataSource(sourceRef);
		const debouncedReload = debounce(() => {
			if (isRemote.value) dsReload();
		}, props.debounceMs);
		if (props.autoReload) watch(keyword, () => debouncedReload());
		const options = computed(() => dataList.value ?? []);
		const selectedLabel = computed(() => {
			const v = model.value;
			if (v == null || v === "") return "";
			return options.value.find((o) => o.value === v)?.label ?? String(v);
		});
		/** 显示在 trigger 中的文字（输入框为空时显示选中值；输入框有值时显示输入文字） */
		const triggerText = computed(() => {
			if (props.enableInput) return inputDraft.value || selectedLabel.value || "";
			return selectedLabel.value || "";
		});
		function onSync() {
			if (props.disabled || dataLoading.value) return;
			emit("sync");
			dsReload();
		}
		function onSelectOption(opt) {
			if (opt.disabled) return;
			model.value = opt.value;
			inputDraft.value = "";
			keyword.value = "";
			popoverVisible.value = false;
			emit("update:modelValue", opt.value);
		}
		function onInput(e) {
			const t = e.target;
			inputDraft.value = t.value;
			emit("input-change", t.value);
			keyword.value = t.value;
			if (!popoverVisible.value) popoverVisible.value = true;
		}
		function onClear() {
			model.value = "";
			inputDraft.value = "";
			keyword.value = "";
		}
		function onKeyEnter() {
			const draft = inputDraft.value.trim();
			if (!draft) return;
			const matched = options.value.find((o) => o.label === draft || String(o.value) === draft);
			if (matched) {
				model.value = matched.value;
				emit("update:modelValue", matched.value);
			} else {
				model.value = draft;
				emit("update:modelValue", draft);
			}
			popoverVisible.value = false;
			inputDraft.value = "";
		}
		/** 同步外部 model → inputDraft（仅当用户没在输入时） */
		watch(() => model.value, (v) => {
			if (!inputDraft.value) {}
			if (v == null || v === "") inputDraft.value = "";
		});
		onMounted(() => {
			if (isRemote.value && props.autoReload) nextTick(() => debouncedReload());
		});
		const filterOptions = computed(() => {
			const k = keyword.value.trim().toLowerCase();
			if (!k) return options.value;
			return options.value.filter((o) => String(o.label).toLowerCase().includes(k));
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", mergeProps({
				ref_key: "triggerRef",
				ref: triggerRef,
				class: [
					"re-remote-select",
					`re-remote-select--${__props.size || "default"}`,
					{
						"re-remote-select--input": __props.enableInput,
						"re-remote-select--disabled": __props.disabled,
						"re-remote-select--open": popoverVisible.value,
						"re-remote-select--has-value": !!triggerText.value
					}
				]
			}, _ctx.$attrs), [createVNode(unref(ElPopover), {
				visible: popoverVisible.value,
				"onUpdate:visible": _cache[4] || (_cache[4] = ($event) => popoverVisible.value = $event),
				width: __props.popoverWidth,
				"popper-class": "re-remote-select__popper",
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
					class: "re-remote-select__trigger",
					onClick: _cache[1] || (_cache[1] = withModifiers(() => {}, ["stop"]))
				}, [
					__props.enableInput ? withDirectives((openBlock(), createElementBlock("input", {
						key: 0,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => inputDraft.value = $event),
						placeholder: __props.inputPlaceholder,
						disabled: __props.disabled,
						class: "re-remote-select__input",
						onInput,
						onKeydown: withKeys(withModifiers(onKeyEnter, ["prevent"]), ["enter"])
					}, null, 40, _hoisted_1)), [[vModelText, inputDraft.value]]) : (openBlock(), createElementBlock("span", {
						key: 1,
						class: normalizeClass(["re-remote-select__label", { "is-placeholder": !selectedLabel.value }])
					}, toDisplayString(selectedLabel.value || __props.placeholder), 3)),
					__props.clearable && (triggerText.value || inputDraft.value) ? (openBlock(), createElementBlock("button", {
						key: 2,
						type: "button",
						class: "re-remote-select__clear",
						"aria-label": "清空",
						onClick: withModifiers(onClear, ["stop"])
					}, [..._cache[5] || (_cache[5] = [createBaseVNode("svg", {
						viewBox: "0 0 24 24",
						fill: "currentColor"
					}, [createBaseVNode("path", { d: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" })], -1)])])) : createCommentVNode("", true),
					(openBlock(), createElementBlock("svg", {
						class: normalizeClass(["re-remote-select__arrow", { "re-remote-select__arrow--up": popoverVisible.value }]),
						viewBox: "0 0 20 20",
						fill: "currentColor",
						width: "14",
						height: "14"
					}, [..._cache[6] || (_cache[6] = [createBaseVNode("path", {
						"fill-rule": "evenodd",
						d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
						"clip-rule": "evenodd"
					}, null, -1)])], 2))
				])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_2, [__props.filterable ? withDirectives((openBlock(), createElementBlock("input", {
					key: 0,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => keyword.value = $event),
					class: "re-remote-select__filter",
					placeholder: __props.placeholder,
					onClick: _cache[3] || (_cache[3] = withModifiers(() => {}, ["stop"]))
				}, null, 8, _hoisted_3)), [[vModelText, keyword.value]]) : createCommentVNode("", true), unref(dataLoading) && options.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_4, "加载中…")) : filterOptions.value.length === 0 ? (openBlock(), createElementBlock("div", _hoisted_5, "无匹配项")) : (openBlock(), createElementBlock("ul", _hoisted_6, [(openBlock(true), createElementBlock(Fragment, null, renderList(filterOptions.value, (opt) => {
					return openBlock(), createElementBlock("li", {
						key: String(opt.value),
						class: normalizeClass(["re-remote-select__opt", {
							"is-active": opt.value === model.value,
							"is-disabled": opt.disabled
						}]),
						onClick: ($event) => onSelectOption(opt)
					}, [createBaseVNode("span", _hoisted_8, toDisplayString(opt.label), 1), opt.value === model.value ? (openBlock(), createElementBlock("svg", _hoisted_9, [..._cache[7] || (_cache[7] = [createBaseVNode("path", { d: "M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 111.42-1.42L8 12.59l7.29-7.3a1 1 0 011.414 0z" }, null, -1)])])) : createCommentVNode("", true)], 10, _hoisted_7);
				}), 128))]))])]),
				_: 1
			}, 8, [
				"visible",
				"width",
				"disabled"
			]), createBaseVNode("button", {
				type: "button",
				class: "re-remote-select__sync",
				disabled: __props.disabled || unref(dataLoading),
				title: __props.syncTooltip,
				"aria-label": __props.syncTooltip,
				onClick: withModifiers(onSync, ["stop"])
			}, [createBaseVNode("span", { class: normalizeClass(["re-remote-select__sync-icon", { "is-spinning": unref(dataLoading) }]) }, [createVNode(ReIcon_default, {
				name: __props.syncIcon,
				size: 16
			}, null, 8, ["name"])], 2)], 8, _hoisted_10)], 16);
		};
	}
}), [["__scopeId", "data-v-b83ec780"]]);
//#endregion
//#region ../../packages/ui/src/components/ReRemoteSelect/index.ts
var plugin = { install(app) {
	app.component("ReRemoteSelect", ReRemoteSelect_default$1);
} };
var ReRemoteSelect_default = ReRemoteSelect_default$1;
//#endregion
export { plugin as n, ReRemoteSelect_default as t };
