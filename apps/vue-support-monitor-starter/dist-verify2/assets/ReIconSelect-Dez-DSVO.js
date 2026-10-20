import { $ as mergeModels, D as createVNode, E as createTextVNode, Ft as useModel, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, o as Fragment, qt as withCtx, v as createBlock, vn as ref, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElInput } from "./input-Bbhiel27.js";
import { n as ElTabs, t as ElTabPane } from "./tabs-BrnjuAVT.js";
import { t as ElScrollbar } from "./scrollbar-DRrkTSQ2.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as ElEmpty } from "./empty-C7c8XFvh.js";
import { t as ElPagination } from "./pagination-DeBPTRrN.js";
import { t as ElPopover } from "./popover-BedfGaMS.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import "./registry-Dp44ioVs.js";
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
import { n as defaultIconTabs, t as defaultIconSets } from "./iconData-CY3P-cWq.js";
//#region ../../packages/ui/src/components/ReIconSelect/theme/default/ReIconSelect.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	type: "button",
	class: "re-icon-select__trigger",
	"aria-label": "选择图标"
};
var _hoisted_2 = {
	key: 1,
	class: "re-icon-select__placeholder"
};
var _hoisted_3 = { class: "re-icon-select__grid" };
var _hoisted_4 = ["title", "onClick"];
var _hoisted_5 = { class: "re-icon-select__footer" };
//#endregion
//#region ../../packages/ui/src/components/ReIconSelect/theme/default/ReIconSelect.vue
var ReIconSelect_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReIconSelect",
	inheritAttrs: true,
	__name: "ReIconSelect",
	props: /*@__PURE__*/ mergeModels({
		pageSize: { default: 35 },
		tabs: { default: () => defaultIconTabs },
		icons: { default: () => defaultIconSets },
		placeholder: { default: "请选择图标" },
		popoverWidth: { default: 350 },
		popoverHeight: { default: 220 }
	}, {
		"modelValue": { default: "" },
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* ReIconSelect —— 图标选择器
		*
		* 支持多个图标库（默认 ep / ri / mdi），可通过 props 注入自定义集合。
		* v-model 绑定值为 "prefix:name"，如 "ri:home-line"。
		*
		* 用法：
		*   <ReIconSelect v-model="icon" />
		*   <ReIconSelect v-model="icon" :tabs="[{label:'业务',prefix:'biz:'}]" :icons="{ 'biz:': ['user','role'] }" />
		*/
		const props = __props;
		const model = useModel(__props, "modelValue");
		/** 当前激活的 prefix */
		const currentPrefix = ref("ep:");
		/** 搜索关键词 */
		const filterValue = ref("");
		/** 当前页 */
		const currentPage = ref(1);
		/** 解析初始值（首次打开 popover 时定位图标所在页） */
		function parseValue() {
			const v = model.value;
			if (!v) {
				currentPrefix.value = props.tabs[0]?.prefix ?? "ep:";
				return;
			}
			const idx = v.indexOf(":");
			if (idx > 0) currentPrefix.value = v.substring(0, idx + 1);
		}
		/** 当前 prefix 下的全部图标名 */
		const currentList = computed(() => props.icons[currentPrefix.value] ?? []);
		/** 过滤 + 分页后的当前页图标 */
		const pageList = computed(() => {
			const kw = filterValue.value.trim().toLowerCase();
			const filtered = kw ? currentList.value.filter((i) => i.toLowerCase().includes(kw)) : currentList.value;
			const start = (currentPage.value - 1) * props.pageSize;
			return filtered.slice(start, start + props.pageSize);
		});
		/** 过滤后总条数 */
		const filteredTotal = computed(() => {
			const kw = filterValue.value.trim().toLowerCase();
			return kw ? currentList.value.filter((i) => i.toLowerCase().includes(kw)).length : currentList.value.length;
		});
		/** 选中样式 */
		function iconItemStyle(name) {
			if (model.value === resolveIconName(name)) return {
				borderColor: "var(--el-color-primary)",
				color: "var(--el-color-primary)"
			};
		}
		/**
		* 把列表项还原成完整图标名。
		* 动画图标（`anim:` 前缀）的列表项本身就是完整名（`anim:<lib>:<icon>`），
		* 其它前缀仍是 `prefix + 短名`。
		*/
		function resolveIconName(name) {
			return currentPrefix.value === "anim:" ? name : currentPrefix.value + name;
		}
		function onChangeIcon(name) {
			model.value = resolveIconName(name);
		}
		function onClear() {
			model.value = "";
		}
		function onBeforeEnter() {
			parseValue();
			if (!model.value) {
				currentPage.value = 1;
				return;
			}
			const name = model.value.substring(model.value.indexOf(":") + 1);
			const idx = currentList.value.findIndex((i) => i === name);
			if (idx >= 0) currentPage.value = Math.ceil((idx + 1) / props.pageSize);
			else currentPage.value = 1;
		}
		function onAfterLeave() {
			filterValue.value = "";
		}
		function onTabChange(prefix) {
			currentPrefix.value = prefix;
			currentPage.value = 1;
		}
		watch(filterValue, () => {
			currentPage.value = 1;
		});
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElInput), {
				modelValue: model.value,
				"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => model.value = $event),
				readonly: "",
				placeholder: __props.placeholder,
				clearable: "",
				onClear
			}, {
				append: withCtx(() => [createVNode(unref(ElPopover), {
					width: __props.popoverWidth,
					trigger: "click",
					onBeforeEnter,
					onAfterLeave
				}, {
					reference: withCtx(() => [createBaseVNode("button", _hoisted_1, [model.value ? (openBlock(), createBlock(ReIcon_default, {
						key: 0,
						name: model.value,
						size: 16
					}, null, 8, ["name"])) : (openBlock(), createElementBlock("span", _hoisted_2, "图标"))])]),
					default: withCtx(() => [
						createVNode(unref(ElInput), {
							modelValue: filterValue.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => filterValue.value = $event),
							class: "re-icon-select__search",
							placeholder: "搜索图标",
							clearable: ""
						}, null, 8, ["modelValue"]),
						createVNode(unref(ElTabs), {
							"model-value": currentPrefix.value,
							onTabChange
						}, {
							default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
								return openBlock(), createBlock(unref(ElTabPane), {
									key: tab.prefix,
									label: tab.label,
									name: tab.prefix
								}, {
									default: withCtx(() => [createVNode(unref(ElScrollbar), { height: __props.popoverHeight }, {
										default: withCtx(() => [createBaseVNode("ul", _hoisted_3, [(openBlock(true), createElementBlock(Fragment, null, renderList(pageList.value, (name) => {
											return openBlock(), createElementBlock("li", {
												key: name,
												title: name,
												class: "re-icon-select__item",
												style: normalizeStyle(iconItemStyle(name)),
												onClick: ($event) => onChangeIcon(name)
											}, [createVNode(ReIcon_default, {
												name: resolveIconName(name),
												size: 20
											}, null, 8, ["name"])], 12, _hoisted_4);
										}), 128))]), pageList.value.length === 0 ? (openBlock(), createBlock(unref(ElEmpty), {
											key: 0,
											description: `${filterValue.value} 图标不存在`,
											"image-size": 60
										}, null, 8, ["description"])) : createCommentVNode("", true)]),
										_: 1
									}, 8, ["height"])]),
									_: 1
								}, 8, ["label", "name"]);
							}), 128))]),
							_: 1
						}, 8, ["model-value"]),
						createBaseVNode("div", _hoisted_5, [createVNode(unref(ElPagination), {
							class: "re-icon-select__pager",
							total: filteredTotal.value,
							"current-page": currentPage.value,
							"page-size": __props.pageSize,
							"pager-count": 5,
							layout: "pager",
							background: "",
							onCurrentChange: _cache[1] || (_cache[1] = (p) => currentPage.value = p)
						}, null, 8, [
							"total",
							"current-page",
							"page-size"
						]), createVNode(unref(ElButton), {
							type: "danger",
							text: "",
							bg: "",
							onClick: onClear
						}, {
							default: withCtx(() => [..._cache[3] || (_cache[3] = [createTextVNode("清空", -1)])]),
							_: 1
						})])
					]),
					_: 1
				}, 8, ["width"])]),
				_: 1
			}, 8, ["modelValue", "placeholder"]);
		};
	}
}), [["__scopeId", "data-v-96910559"]]);
//#endregion
export { ReIconSelect_default as t };
