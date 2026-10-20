import { $ as mergeModels, D as createVNode, Ft as useModel, Ht as watch, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, vn as ref, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElPopover } from "./popover-BedfGaMS.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReButton_default } from "./ReButton-CH6SFZxo.js";
//#region ../../packages/ui/src/components/ReSwitch/layouts/Popover.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "re-switch-popover__trigger" };
var _hoisted_2 = {
	key: 0,
	class: "re-switch-popover__check",
	"aria-hidden": "true"
};
var _hoisted_3 = { class: "re-switch-popover__panel" };
//#endregion
//#region ../../packages/ui/src/components/ReSwitch/layouts/Popover.vue
var Popover_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "PopoverReSwitch",
	inheritAttrs: true,
	__name: "Popover",
	props: /*@__PURE__*/ mergeModels({
		title: { default: "" },
		icon: { default: "" },
		activeIcon: { default: "" },
		inactiveIcon: { default: "" },
		disabled: {
			type: Boolean,
			default: false
		},
		size: { default: "default" },
		placement: { default: "bottom-end" },
		popoverWidth: { default: 196 },
		popoverPadding: { default: 0 }
	}, {
		"modelValue": {
			type: [
				Boolean,
				String,
				Number
			],
			default: false
		},
		"modelModifiers": {}
	}),
	emits: ["update:modelValue"],
	setup(__props) {
		/**
		* PopoverReSwitch —— 纯方形按钮触发 + 浮层取值的开关布局
		*
		* 与其它 ReSwitch 布局的区别：触发器不是「点一下就翻状态」的开关，而是一枚**纯入口**，
		* 状态由浮层里的内容（档位菜单、下拉、数字输入……）来改。适合「同一个开关有若干档」的场景 ——
		* 例如表格的自动刷新间隔：关闭 / 每 5 秒 / 每 30 秒，档位本身即状态。
		*
		* <p><b>结构</b>：触发器是 {@code ReButton layout="square"}（与工具栏其它方块按钮同尺寸），
		* 点开是**无边框**浮层 —— 面板自身不画分隔线，浮层外壳去描边，选中态只靠底色 + 右侧对勾表达，
		* 避免窄浮层里出现一串框。</p>
		*
		* <p><b>状态判定</b>：{@code 0 / "" / false} 视为「关」，其余一律视为「开」。
		* 这样布尔开关、字符串 id、毫秒间隔三种模型值共用一套判定，不必为每种模型各配一个 activeValue。</p>
		*
		* <p><b>选中即收起</b>：模型值变化会自动关闭浮层（值只可能由面板内容改动，
		* 触发器是纯入口不会自己翻状态），这是「选完即生效」的常规预期。</p>
		*
		* <p><b>无障碍</b>：本布局是纯图标按钮，{@code title} 既是 tooltip 也是按钮的可访问名
		* （经 ReButton 落到 aria-label），<b>务必传入含状态文案的 title</b>，否则读屏只会报「按钮」；
		* 浮层内容由使用方保证有可读文本。角标为纯装饰，已 aria-hidden。</p>
		*
		* <p><b>无边框与内距</b>：浮层外壳去描边，内距由 {@code popoverPadding} 控制（默认 8px，
		* 档位多的场景可调到 10~12），两者写在同一段非 scoped CSS 里，弹层 teleport 到 body 仍能生效。</p>
		*
		* <p><b>约定</b>：{@code disabled} 时触发器置灰，浮层的 trigger 置空数组（不绑任何触发事件，
		* 彻底点不开）。Element Plus 的 trigger 类型里没有 manual，传空数组才是合法写法。
		* 开启时向 ReButton 传 {@code type="primary"}，方块按钮转主色，与右上角角标一起表达亮灭
		* （2026-09-28 实测 type 生效：关闭态 {@code rs-btn--default} / rgb(92,98,112)，
		* 点亮态 {@code rs-btn--primary} / rgb(41,146,255)）。</p>
		*
		* 用法：
		*   <ReSwitch
		*     layout="popover"
		*     icon="Timer"
		*     :title="ms > 0 ? `自动刷新中：每 ${ms / 1000} 秒` : '自动刷新：已关闭'"
		*     :popover-padding="10"
		*     v-model="ms"
		*   >
		*     <ReSelect v-model="ms" layout="square" vertical :data="options" />
		*   </ReSwitch>
		*/
		const props = __props;
		const model = useModel(__props, "modelValue");
		/** 浮层显隐 */
		const visible = ref(false);
		/**
		* 是否点亮：0 / "" / false 视为「关」，其余视为「开」。
		*
		* 三种模型值（布尔 / 字符串 id / 毫秒间隔）共用这一条规则，
		* 调用方不必为每种模型单独配 activeValue。
		*/
		const isActive = computed(() => {
			const v = model.value;
			if (typeof v === "number") return v > 0;
			if (typeof v === "string") return v !== "" && v !== "0";
			return v === true;
		});
		/** 触发器图标：按状态取专属图标，缺省回退到通用 icon */
		const triggerIcon = computed(() => {
			return (isActive.value ? props.activeIcon : props.inactiveIcon) || props.icon;
		});
		/**
		* 浮层外壳的内距：经 popper-style 下发 CSS 变量，而不是内联 padding。
		*
		* <p>为什么不直接写内联 padding：去描边（border: none !important）只能放在非 scoped 的
		* CSS 里（弹层 teleport 到 body），若内距走内联、描边走 CSS，同一个外壳的属性就分成了两处，
		* 以后改样式容易只改一处。内距改走变量后，「去描边 + 内距」两条规则都在同一段 CSS 里，
		* 内联只负责喂一个数值。</p>
		*/
		const popperStyle = computed(() => ({ "--re-switch-popover-padding": `${props.popoverPadding}px` }));
		/** 关闭浮层（也作为 #close 插槽参数交给使用方） */
		function close() {
			visible.value = false;
		}
		/**
		* 浮层显隐回写。
		*
		* @param v Element Plus 抛出的目标显隐态
		*/
		function onVisibleChange(v) {
			visible.value = v;
		}
		watch(model, close);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElPopover), {
				visible: visible.value,
				placement: __props.placement,
				width: __props.popoverWidth,
				trigger: __props.disabled ? [] : "click",
				persistent: false,
				"popper-class": "re-switch-popover",
				"popper-style": popperStyle.value,
				"onUpdate:visible": onVisibleChange
			}, {
				reference: withCtx(() => [createBaseVNode("span", _hoisted_1, [createVNode(ReButton_default, {
					layout: "square",
					icon: triggerIcon.value,
					tip: __props.title,
					type: isActive.value ? "primary" : "",
					size: __props.size,
					disabled: __props.disabled
				}, null, 8, [
					"icon",
					"tip",
					"type",
					"size",
					"disabled"
				]), isActive.value ? (openBlock(), createElementBlock("span", _hoisted_2, [..._cache[0] || (_cache[0] = [createBaseVNode("svg", {
					viewBox: "0 0 12 12",
					fill: "none",
					stroke: "currentColor",
					"stroke-width": "2",
					"stroke-linecap": "round",
					"stroke-linejoin": "round"
				}, [createBaseVNode("polyline", { points: "2 6 5 9 10 3" })], -1)])])) : createCommentVNode("", true)])]),
				default: withCtx(() => [createBaseVNode("div", _hoisted_3, [renderSlot(_ctx.$slots, "default", {
					active: isActive.value,
					close
				}, void 0, true)])]),
				_: 3
			}, 8, [
				"visible",
				"placement",
				"width",
				"trigger",
				"popper-style"
			]);
		};
	}
}), [["__scopeId", "data-v-f07b8045"]]);
//#endregion
export { Popover_default as default };
