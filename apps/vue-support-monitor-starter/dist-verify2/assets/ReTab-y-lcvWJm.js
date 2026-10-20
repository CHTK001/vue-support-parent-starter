import { $n as normalizeClass, D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, bt as renderList, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, o as Fragment, qt as withCtx, rr as toDisplayString, v as createBlock, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { n as ElTabs, t as ElTabPane } from "./tabs-BrnjuAVT.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReTab/ReTab.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-tab-capsule__nav" };
var _hoisted_2 = ["onClick"];
var _hoisted_3 = {
	key: 1,
	class: "re-tab-capsule__label"
};
var _hoisted_4 = {
	key: 0,
	class: "re-tab-capsule__panel"
};
var _hoisted_5 = { class: "re-tab-koi__nav" };
var _hoisted_6 = ["onClick"];
var _hoisted_7 = {
	key: 1,
	class: "re-tab-koi__label"
};
var _hoisted_8 = {
	key: 0,
	class: "re-tab-koi__panel"
};
var _hoisted_9 = { class: "re-tab-icon__nav" };
var _hoisted_10 = ["title", "onClick"];
var _hoisted_11 = { class: "re-tab-icon__tile" };
var _hoisted_12 = {
	key: 0,
	class: "re-tab-icon__label"
};
var _hoisted_13 = ["title"];
var _hoisted_14 = {
	key: 0,
	class: "re-tab-icon__panel"
};
var _hoisted_15 = { class: "re-tab-underline__nav" };
var _hoisted_16 = ["onClick"];
var _hoisted_17 = {
	key: 1,
	class: "re-tab-underline__label"
};
var _hoisted_18 = {
	key: 2,
	class: "re-tab-underline__badge"
};
var _hoisted_19 = {
	key: 0,
	class: "re-tab-underline__panel"
};
var _hoisted_20 = { class: "re-tab__label" };
var _hoisted_21 = { key: 1 };
//#endregion
//#region ../../packages/ui/src/components/ReTab/ReTab.vue
var ReTab_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReTab",
	inheritAttrs: true,
	__name: "ReTab",
	props: {
		tabs: { default: () => [] },
		modelValue: { default: "" },
		type: { default: "" },
		closable: {
			type: Boolean,
			default: false
		},
		stretch: {
			type: Boolean,
			default: false
		},
		variant: { default: "capsule" },
		tabPosition: { default: "top" },
		collapsed: {
			type: Boolean,
			default: false
		},
		collapsible: {
			type: Boolean,
			default: false
		},
		navOnly: {
			type: Boolean,
			default: false
		}
	},
	emits: [
		"update:modelValue",
		"update:collapsed",
		"tab-change",
		"tab-click",
		"tab-remove"
	],
	setup(__props, { emit: __emit }) {
		/**
		* ReTab —— 标签页组件
		*
		* 默认布局 capsule（胶囊式分段选项卡）——即主题配置抽屉顶部那一套页签：
		* 浅灰白底盘 + 白底激活项 + 图标文字均分，亮暗色自动适配。写法与旧默认一致：
		*   <ReTab :tabs="[{ name: 'appearance', label: '外观', icon: 'Brush' }]">
		*     <template #appearance>...</template>
		*   </ReTab>
		*
		* 需要 element-plus 原生 el-tabs 样式时显式传 variant="element"
		* （历史写法 variant="default" 仍按原生 el-tabs 兼容，见下方模板末尾分支）。
		*/
		const props = __props;
		const emit = __emit;
		/** el-tabs 使用的 modelValue */
		const activeName = computed({
			get: () => props.modelValue,
			set: (value) => {
				emit("update:modelValue", value);
				emit("tab-change", value);
			}
		});
		/** capsule / koi / icon 布局：点击页签项 */
		const handleItemClick = (tab) => {
			if (tab.disabled) return;
			activeName.value = tab.name;
			emit("tab-click", { name: tab.name });
		};
		/** icon 布局：收起时仅保留当前激活项（非全部收起） */
		const visibleTabs = computed(() => props.variant === "icon" && props.collapsed ? props.tabs.filter((tab) => tab.name === props.modelValue) : props.tabs);
		/** icon 布局：收起按钮图标（按方向指向展开侧） */
		const toggleIcon = computed(() => {
			if (props.tabPosition === "right") return props.collapsed ? "ArrowLeft" : "ArrowRight";
			if (props.tabPosition === "left") return props.collapsed ? "ArrowRight" : "ArrowLeft";
			return props.collapsed ? "ArrowDown" : "ArrowUp";
		});
		function toggleCollapsed() {
			emit("update:collapsed", !props.collapsed);
		}
		return (_ctx, _cache) => {
			return __props.variant === "capsule" ? (openBlock(), createElementBlock("div", mergeProps({
				key: 0,
				class: ["re-tab re-tab--capsule", { "is-stretch": __props.stretch }]
			}, _ctx.$attrs), [createBaseVNode("div", _hoisted_1, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock("div", {
					key: tab.name,
					class: normalizeClass(["re-tab-capsule__item", {
						"is-active": activeName.value === tab.name,
						"is-disabled": tab.disabled
					}]),
					onClick: ($event) => handleItemClick(tab)
				}, [tab.icon ? (openBlock(), createBlock(ReIcon_default, {
					key: 0,
					name: tab.icon,
					class: "re-tab-capsule__icon"
				}, null, 8, ["name"])) : createCommentVNode("", true), tab.label ? (openBlock(), createElementBlock("span", _hoisted_3, toDisplayString(tab.label), 1)) : createCommentVNode("", true)], 10, _hoisted_2);
			}), 128))]), !__props.navOnly ? (openBlock(), createElementBlock("div", _hoisted_4, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock(Fragment, { key: tab.name }, [activeName.value === tab.name ? renderSlot(_ctx.$slots, tab.name, {}, void 0, true, 0) : createCommentVNode("", true)], 64);
			}), 128))])) : createCommentVNode("", true)], 16)) : __props.variant === "koi" ? (openBlock(), createElementBlock("div", mergeProps({
				key: 1,
				class: ["re-tab re-tab--koi", [`re-tab--koi-${__props.tabPosition}`, { "is-stretch": __props.stretch }]]
			}, _ctx.$attrs), [createBaseVNode("div", _hoisted_5, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock("div", {
					key: tab.name,
					class: normalizeClass(["re-tab-koi__item", {
						"is-active": activeName.value === tab.name,
						"is-disabled": tab.disabled
					}]),
					onClick: ($event) => handleItemClick(tab)
				}, [tab.icon ? (openBlock(), createBlock(ReIcon_default, {
					key: 0,
					name: tab.icon,
					class: "re-tab-koi__icon"
				}, null, 8, ["name"])) : createCommentVNode("", true), tab.label ? (openBlock(), createElementBlock("span", _hoisted_7, toDisplayString(tab.label), 1)) : createCommentVNode("", true)], 10, _hoisted_6);
			}), 128))]), !__props.navOnly ? (openBlock(), createElementBlock("div", _hoisted_8, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock(Fragment, { key: tab.name }, [activeName.value === tab.name ? renderSlot(_ctx.$slots, tab.name, {}, void 0, true, 0) : createCommentVNode("", true)], 64);
			}), 128))])) : createCommentVNode("", true)], 16)) : __props.variant === "icon" ? (openBlock(), createElementBlock("div", mergeProps({
				key: 2,
				class: ["re-tab re-tab--icon", [`re-tab--icon-${__props.tabPosition}`, {
					"is-collapsed": __props.collapsed,
					"is-stretch": __props.stretch
				}]]
			}, _ctx.$attrs), [createBaseVNode("div", _hoisted_9, [(openBlock(true), createElementBlock(Fragment, null, renderList(visibleTabs.value, (tab) => {
				return openBlock(), createElementBlock("div", {
					key: tab.name,
					class: normalizeClass(["re-tab-icon__item", {
						"is-active": activeName.value === tab.name,
						"is-disabled": tab.disabled
					}]),
					title: tab.label,
					onClick: ($event) => handleItemClick(tab)
				}, [createBaseVNode("span", _hoisted_11, [tab.icon ? (openBlock(), createBlock(ReIcon_default, {
					key: 0,
					name: tab.icon,
					class: "re-tab-icon__icon"
				}, null, 8, ["name"])) : createCommentVNode("", true)]), !__props.collapsed && tab.label ? (openBlock(), createElementBlock("span", _hoisted_12, toDisplayString(tab.label), 1)) : createCommentVNode("", true)], 10, _hoisted_10);
			}), 128)), __props.collapsible ? (openBlock(), createElementBlock("button", {
				key: 0,
				type: "button",
				class: "re-tab-icon__toggle",
				title: __props.collapsed ? "展开" : "收起",
				onClick: toggleCollapsed
			}, [createVNode(ReIcon_default, { name: toggleIcon.value }, null, 8, ["name"])], 8, _hoisted_13)) : createCommentVNode("", true)]), !__props.navOnly ? (openBlock(), createElementBlock("div", _hoisted_14, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock(Fragment, { key: tab.name }, [activeName.value === tab.name ? renderSlot(_ctx.$slots, tab.name, {}, void 0, true, 0) : createCommentVNode("", true)], 64);
			}), 128))])) : createCommentVNode("", true)], 16)) : __props.variant === "underline" ? (openBlock(), createElementBlock("div", mergeProps({
				key: 3,
				class: ["re-tab re-tab--underline", { "is-stretch": __props.stretch }]
			}, _ctx.$attrs), [createBaseVNode("div", _hoisted_15, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock("div", {
					key: tab.name,
					class: normalizeClass(["re-tab-underline__item", {
						"is-active": activeName.value === tab.name,
						"is-disabled": tab.disabled
					}]),
					onClick: ($event) => handleItemClick(tab)
				}, [
					tab.icon ? (openBlock(), createBlock(ReIcon_default, {
						key: 0,
						name: tab.icon,
						class: "re-tab-underline__icon"
					}, null, 8, ["name"])) : createCommentVNode("", true),
					tab.label ? (openBlock(), createElementBlock("span", _hoisted_17, toDisplayString(tab.label), 1)) : createCommentVNode("", true),
					tab.badge !== void 0 && tab.badge !== null && tab.badge !== "" ? (openBlock(), createElementBlock("span", _hoisted_18, toDisplayString(tab.badge), 1)) : createCommentVNode("", true)
				], 10, _hoisted_16);
			}), 128))]), !__props.navOnly ? (openBlock(), createElementBlock("div", _hoisted_19, [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
				return openBlock(), createElementBlock(Fragment, { key: tab.name }, [activeName.value === tab.name ? renderSlot(_ctx.$slots, tab.name, {}, void 0, true, 0) : createCommentVNode("", true)], 64);
			}), 128))])) : createCommentVNode("", true)], 16)) : (openBlock(), createBlock(unref(ElTabs), mergeProps({ key: 4 }, _ctx.$attrs, {
				modelValue: activeName.value,
				"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => activeName.value = $event),
				type: __props.type,
				closable: __props.closable,
				stretch: __props.stretch,
				class: "re-tab",
				onTabClick: _cache[1] || (_cache[1] = (pane) => emit("tab-click", pane)),
				onTabRemove: _cache[2] || (_cache[2] = (name) => emit("tab-remove", String(name)))
			}), {
				default: withCtx(() => [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.tabs, (tab) => {
					return openBlock(), createBlock(unref(ElTabPane), {
						key: tab.name,
						name: tab.name,
						label: tab.label,
						closable: tab.closable,
						disabled: tab.disabled
					}, {
						label: withCtx(() => [createBaseVNode("span", _hoisted_20, [tab.icon ? (openBlock(), createBlock(ReIcon_default, {
							key: 0,
							name: tab.icon,
							class: "re-tab__icon"
						}, null, 8, ["name"])) : createCommentVNode("", true), tab.label ? (openBlock(), createElementBlock("span", _hoisted_21, toDisplayString(tab.label), 1)) : createCommentVNode("", true)])]),
						default: withCtx(() => [renderSlot(_ctx.$slots, tab.name, {}, void 0, true), renderSlot(_ctx.$slots, "default", {}, void 0, true)]),
						_: 2
					}, 1032, [
						"name",
						"label",
						"closable",
						"disabled"
					]);
				}), 128))]),
				_: 3
			}, 16, [
				"modelValue",
				"type",
				"closable",
				"stretch"
			]));
		};
	}
}), [["__scopeId", "data-v-5c0e7d8e"]]);
//#endregion
//#region ../../packages/ui/src/components/ReTab/index.ts
var plugin = { install(app) {
	app.component("ReTab", ReTab_default$1);
} };
var ReTab_default = ReTab_default$1;
//#endregion
export { plugin as n, ReTab_default as t };
