const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Modern-n0Zw_kz5.js","assets/runtime-core.esm-bundler-DDQHILLo.js","assets/icon-CKvLDnIU.js","assets/use-namespace-BksmY6RT.js","assets/_baseSet-CMSvwkCM.js","assets/isObject-CBh4bHyD.js","assets/_baseGet-DmmfCxUg.js","assets/style-D30oR_2q.js","assets/objects-BYkkqs6t.js","assets/get-cR0zxN0m.js","assets/dist-DI3cGDuP.js","assets/aria-DKP9Ei-1.js","assets/install-CE5IEjzX.js","assets/isPlainObject-CmtvaEIG.js","assets/_plugin-vue_export-helper-BOaGB7Aw.js","assets/ReIcon-mRxVAA3T.js","assets/dist-DogtK295.js","assets/rolldown-runtime-CEgmsyvS.js","assets/registry-Dp44ioVs.js","assets/file-viewer-3d-ijA7B-Qe.js","assets/ReIcon-B6YUJqdV.css","assets/Modern-D2jc7mKf.css","assets/modern-vars-DGJCsX_d.css","assets/Square-Efrv1lvN.js","assets/Square-C0F_0YDn.css"])))=>i.map(i=>d[i]);
import { D as createVNode, J as inject, Lt as useSlots, Nt as useAttrs, O as defineAsyncComponent, On as unref, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { ud as __vitePreload } from "./file-viewer-3d-ijA7B-Qe.js";
import { t as ElTooltip } from "./tooltip-DEX5DBfd.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { t as ElButton } from "./button-CLXz94Uh.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReButton/auth.ts
/** 全局权限函数注入 key */
var RE_AUTH_KEY = Symbol("ReButtonAuth");
//#endregion
//#region ../../packages/ui/src/components/ReButton/ReButton.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = {
	key: 0,
	class: "re-button__tip-wrap"
};
var _hoisted_2 = {
	key: 3,
	class: "re-button__tip-wrap"
};
//#endregion
//#region ../../packages/ui/src/components/ReButton/ReButton.vue
var ReButton_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReButton",
	inheritAttrs: false,
	__name: "ReButton",
	props: {
		layout: { default: "el" },
		type: { default: void 0 },
		size: { default: void 0 },
		plain: {
			type: Boolean,
			default: false
		},
		round: {
			type: Boolean,
			default: false
		},
		circle: {
			type: Boolean,
			default: false
		},
		loading: {
			type: Boolean,
			default: false
		},
		disabled: {
			type: Boolean,
			default: false
		},
		icon: { default: "" },
		link: {
			type: Boolean,
			default: false
		},
		text: {
			type: Boolean,
			default: false
		},
		bg: {
			type: Boolean,
			default: false
		},
		nativeType: { default: "button" },
		auth: { default: "" },
		debounce: { default: 0 },
		showText: {
			type: Boolean,
			default: void 0
		},
		tip: { default: void 0 },
		iconSize: { default: 32 },
		decorative: {
			type: Boolean,
			default: false
		}
	},
	emits: ["click"],
	setup(__props, { emit: __emit }) {
		/**
		* ReButton —— 按钮组件
		*
		* 透传 el-button 全部 props / emits / slots。
		* 增强能力：
		*   - icon：可传 Element Plus PascalCase 名 / Iconify 三方库字符串 / HTTP URL，
		*           自动用 ReIcon 渲染（无需手动包 ReIcon）；
		*           也支持具名插槽 <template #icon> 手动放任意图标（插槽优先于 icon 属性）
		*   - auth：传入权限标识，配合全局权限函数（provide 注入）控制显隐
		*   - click 自动防抖：传 `debounce` 时，300ms 内多次点击只触发一次
		*   - layout：布局变体，"el"（默认，el-button）/ "modern"（现代化扁平按钮，异步加载）/ "square"（正方形图标按钮，异步加载）
		*   - showText：默认 undefined=自动（有插槽文字就显示，没有则仅图标+tooltip）；
		*                显式 false=强制仅图标+tooltip（文字只做悬浮提示）；显式 true=强制显示文字
		*   - iconSize：按钮宽高（默认 32px，仅 iconOnly 时生效）
		* 维护约束：模板必须保持单根，v-if/v-else-if 分支之间不得放顶层注释 ——
		*   dev 下编译器会保留注释并把条件链拆成多根 Fragment，$el 不再是按钮元素，
		*   外层 el-popconfirm / el-tooltip 便解析不到触发元素（确认框弹不出来）。
		*
		* 维护约束（2026-09-30 补充）：**每个分支解析到的根都必须是真实元素**，
		*   因此禁止把 ElTooltip / ElPopover 这类组件放在分支最外层当根。
		*   它们自身的根是 ElPopper（fragment），Vue 会判定「组件根节点不是元素」，
		*   导致挂在 <ReButton> 上的指令（v-admin / v-superadmin / v-role / v-perm / v-menu）
		*   拿不到真实元素而**静默失效**（实测：{@code v-admin} 的 display:none 根本没执行，
		*   非管理员能看到管理员专属按钮），并且每次渲染刷一条
		*   "Runtime directive used on component with non-element root node" 警告。
		*   需要 tooltip 时，把它放进布局组件内部（见 layouts/Square.vue 的 tip prop），
		*   或改用原生 title。
		*
		* 【square 布局注意】"square" 是纯图标正方形按钮，不允许带文字：
		*   - 传入的文字不会渲染到按钮上，仅作为 tooltip 悬浮提示与 aria-label 辅助信息
		*   - 需要"图标 + 文字"展示时，请使用默认 layout（带 show-text）或 modern 布局
		*
		* 用法：
		*   <ReButton icon="Search" type="primary" @click="onSearch">查询</ReButton>
		*   <ReButton icon="Plus" show-text type="primary">新增用户</ReButton>   <!-- 图标+文字 -->
		*   <ReButton icon="Refresh" class="icon-only" @click="reload" />          <!-- 纯图标 -->
		*   <ReButton layout="square" icon="Refresh" @click="reload" />            <!-- 纯图标正方形，文字仅做 tooltip -->
		*   <ReButton layout="square" icon="Delete" type="danger" tip="删除这条记录" @click="remove" />
		*                                                                       <!-- 操作列推荐写法：square + tip -->
		*   <ReButton auth="user:add" type="primary">新增用户</ReButton>
		*   <ReButton layout="modern" type="primary">现代按钮</ReButton>
		*/
		const ModernLayout = defineAsyncComponent(() => __vitePreload(() => import("./Modern-n0Zw_kz5.js"), __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22])));
		/** Square 布局组件（按需异步加载） */
		const SquareLayout = defineAsyncComponent(() => __vitePreload(() => import("./Square-Efrv1lvN.js"), __vite__mapDeps([23,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,24,22])));
		const props = __props;
		const emit = __emit;
		const slots = useSlots();
		/** 插槽文字（square 布局下只作提示语用，不渲染到按钮上） */
		const slotText = computed(() => {
			const nodes = slots.default?.();
			if (!nodes || nodes.length === 0) return "";
			return nodes.map((n) => typeof n === "string" ? n : typeof n.children === "string" ? n.children : "").join("").trim();
		});
		/** 原生 title（未声明为 prop，落在 $attrs 里）作为最后回落 */
		const attrs = useAttrs();
		const attrTitle = computed(() => {
			const t = attrs.title;
			return typeof t === "string" ? t : "";
		});
		/**
		* 提示语文本：tip 优先，其次插槽文字，最后原生 title。
		*
		* 之前 labelText 只看插槽，导致「square + title=…」这种写法在有插槽时
		* 会用错提示语（插槽优先于 title）；加上 tip 后调用方可显式指定，
		* 且三者优先级明确可预期。
		*/
		const labelText = computed(() => {
			if (props.tip != null && props.tip.trim() !== "") return props.tip.trim();
			if (slotText.value !== "") return slotText.value;
			return attrTitle.value;
		});
		/**
		* 纯图标按钮：有 icon 且（无文字内容 或 显式 showText=false）
		* ⚠️ 这里不能用 `!props.showText` —— showText 默认是 undefined（自动），
		*    那样会让所有带 icon 的按钮都变成 icon-only，把插槽文字吞成 tooltip。
		*/
		const iconOnly = computed(() => Boolean(props.icon) && (labelText.value.trim() === "" || props.showText === false));
		/** 图标是组件对象时直接渲染组件，字符串走 ReIcon */
		const iconIsComponent = computed(() => typeof props.icon !== "string" && props.icon != null);
		const iconName = computed(() => typeof props.icon === "string" ? props.icon : "");
		/** 全局权限函数 */
		const authFn = inject(RE_AUTH_KEY, null);
		/** 是否显示按钮 */
		const visible = computed(() => {
			if (!props.auth) return true;
			if (!authFn) return true;
			return authFn(props.auth);
		});
		/** 防抖控制 */
		let lastClick = 0;
		function onClick(e) {
			if (props.disabled || props.loading) return;
			if (props.debounce > 0) {
				const now = Date.now();
				if (now - lastClick < props.debounce) return;
				lastClick = now;
			}
			emit("click", e);
		}
		return (_ctx, _cache) => {
			return __props.layout === "square" && visible.value && labelText.value && !__props.decorative ? (openBlock(), createElementBlock("span", _hoisted_1, [createVNode(unref(ElTooltip), {
				content: labelText.value,
				placement: "top"
			}, {
				default: withCtx(() => [createVNode(unref(SquareLayout), mergeProps({
					type: __props.type,
					size: __props.size,
					plain: __props.plain,
					loading: __props.loading,
					disabled: __props.disabled,
					icon: __props.icon,
					"native-type": __props.nativeType,
					"aria-label": labelText.value
				}, _ctx.$attrs, { onClick }), null, 16, [
					"type",
					"size",
					"plain",
					"loading",
					"disabled",
					"icon",
					"native-type",
					"aria-label"
				])]),
				_: 1
			}, 8, ["content"])])) : __props.layout === "square" && visible.value ? (openBlock(), createBlock(unref(SquareLayout), mergeProps({
				key: 1,
				type: __props.type,
				size: __props.size,
				plain: __props.plain,
				loading: __props.loading,
				disabled: __props.disabled,
				icon: __props.icon,
				"native-type": __props.nativeType,
				decorative: __props.decorative
			}, _ctx.$attrs, { onClick }), null, 16, [
				"type",
				"size",
				"plain",
				"loading",
				"disabled",
				"icon",
				"native-type",
				"decorative"
			])) : __props.layout === "modern" && visible.value ? (openBlock(), createBlock(unref(ModernLayout), mergeProps({
				key: 2,
				type: __props.type,
				size: __props.size,
				plain: __props.plain,
				round: __props.round,
				circle: __props.circle,
				loading: __props.loading,
				disabled: __props.disabled,
				icon: __props.icon,
				link: __props.link,
				text: __props.text,
				bg: __props.bg,
				"native-type": __props.nativeType
			}, _ctx.$attrs, { onClick }), {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"type",
				"size",
				"plain",
				"round",
				"circle",
				"loading",
				"disabled",
				"icon",
				"link",
				"text",
				"bg",
				"native-type"
			])) : visible.value && iconOnly.value && props.showText === false && labelText.value ? (openBlock(), createElementBlock("span", _hoisted_2, [createVNode(unref(ElTooltip), {
				content: labelText.value,
				placement: "top"
			}, {
				default: withCtx(() => [createVNode(unref(ElButton), mergeProps({
					type: __props.type,
					size: __props.size,
					plain: __props.plain,
					round: __props.round,
					circle: __props.circle,
					loading: __props.loading,
					disabled: __props.disabled,
					link: __props.link,
					text: __props.text,
					bg: __props.bg,
					"native-type": __props.nativeType,
					"aria-label": labelText.value,
					style: iconOnly.value ? {
						width: props.iconSize + "px",
						height: props.iconSize + "px"
					} : void 0,
					class: { "re-button--icon-only": iconOnly.value }
				}, _ctx.$attrs, { onClick }), {
					default: withCtx(() => [renderSlot(_ctx.$slots, "icon", {}, () => [__props.icon && !iconIsComponent.value ? (openBlock(), createBlock(ReIcon_default, {
						key: 0,
						name: iconName.value,
						class: "re-button__icon"
					}, null, 8, ["name"])) : iconIsComponent.value ? (openBlock(), createBlock(unref(ElIcon), {
						key: 1,
						class: "re-button__icon"
					}, {
						default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
						_: 1
					})) : createCommentVNode("", true)])]),
					_: 3
				}, 16, [
					"type",
					"size",
					"plain",
					"round",
					"circle",
					"loading",
					"disabled",
					"link",
					"text",
					"bg",
					"native-type",
					"aria-label",
					"style",
					"class"
				])]),
				_: 3
			}, 8, ["content"])])) : visible.value ? (openBlock(), createBlock(unref(ElButton), mergeProps({
				key: 4,
				type: __props.type,
				size: __props.size,
				plain: __props.plain,
				round: __props.round,
				circle: __props.circle,
				loading: __props.loading,
				disabled: __props.disabled,
				link: __props.link,
				text: __props.text,
				bg: __props.bg,
				"native-type": __props.nativeType,
				class: { "re-button--icon-only": iconOnly.value }
			}, _ctx.$attrs, { onClick }), {
				default: withCtx(() => [renderSlot(_ctx.$slots, "icon", {}, () => [__props.icon && !iconIsComponent.value ? (openBlock(), createBlock(ReIcon_default, {
					key: 0,
					name: iconName.value,
					class: "re-button__icon"
				}, null, 8, ["name"])) : iconIsComponent.value ? (openBlock(), createBlock(unref(ElIcon), {
					key: 1,
					class: "re-button__icon"
				}, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
					_: 1
				})) : createCommentVNode("", true)]), renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 16, [
				"type",
				"size",
				"plain",
				"round",
				"circle",
				"loading",
				"disabled",
				"link",
				"text",
				"bg",
				"native-type",
				"class"
			])) : createCommentVNode("", true);
		};
	}
}), [["__scopeId", "data-v-a4b4f382"]]);
//#endregion
export { ReButton_default as t };
