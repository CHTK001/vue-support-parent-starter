import { $n as normalizeClass, E as createTextVNode, On as unref, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElTag } from "./tag-CqzZCxmq.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#region ../../packages/ui/src/components/ReTag/theme/koi/ReTag.vue?vue&type=script&setup=true&lang.ts
var _hoisted_1 = { class: "koi-tag" };
//#endregion
//#region ../../packages/ui/src/components/ReTag/theme/koi/ReTag.vue
var ReTag_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReTag",
	inheritAttrs: false,
	__name: "ReTag",
	props: {
		tagOptions: { default: () => [] },
		value: { default: "" },
		map: { default: void 0 },
		type: { default: void 0 },
		size: { default: "default" },
		closable: {
			type: Boolean,
			default: false
		},
		effect: { default: "light" },
		round: {
			type: Boolean,
			default: false
		},
		disableTransitions: {
			type: Boolean,
			default: true
		},
		hit: {
			type: Boolean,
			default: false
		},
		color: { default: "" },
		icon: { default: "" },
		dot: {
			type: Boolean,
			default: false
		},
		dotColor: { default: "" }
	},
	setup(__props) {
		/**
		* ReTag koi 主题 —— 标签组件（KoiTag 移植）
		*
		* 契约必须与 default 主题对齐（ReTag 是按主题切换的组件，调用方代码不变）：
		*   <ReTag :type="'success'">{{ text }}</ReTag>
		*   <ReTag :value="1" :map="{ 1: { label: '启用', type: 'success' } }" />
		* koi 额外支持字典直出：tagOptions + value，命中 dictClass 时渲染自定义 div。
		*
		* 注意：早期实现只渲染 `matched` 命中的分支且**没有兜底分支**，
		* 导致全仓（server/system/project 等）所有按 default 契约书写的标签
		* 在 koi 主题下渲染为空白标签（内容与 type 全部丢失）。
		*/
		const props = __props;
		/** 当前命中的字典选项 */
		const matched = computed(() => props.tagOptions.find((o) => props.value != null && String(props.value) === String(o.dictValue)));
		/** map 映射命中（对齐 default 主题） */
		const mapped = computed(() => {
			if (props.value === "" || !props.map) return null;
			return props.map[String(props.value)] ?? null;
		});
		/** 最终 el-tag 类型：字典 > map > type */
		const displayType = computed(() => matched.value?.dictTag || mapped.value?.type || props.type || void 0);
		/** 最终文案：字典 > map；均无则由默认插槽提供 */
		const displayText = computed(() => matched.value?.dictLabel ?? mapped.value?.label ?? void 0);
		/** 最终图标：字典 > map > 显式 icon */
		const displayIcon = computed(() => matched.value?.icon || mapped.value?.icon || props.icon);
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("span", _hoisted_1, [matched.value?.dictClass ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(["koi-tag__custom", matched.value.dictClass])
			}, [
				__props.dot ? (openBlock(), createElementBlock("span", {
					key: 0,
					class: "koi-tag__dot",
					style: normalizeStyle({ background: __props.dotColor || __props.color || "var(--el-color-primary)" })
				}, null, 4)) : createCommentVNode("", true),
				displayIcon.value ? (openBlock(), createBlock(ReIcon_default, {
					key: 1,
					name: displayIcon.value,
					class: "koi-tag__icon"
				}, null, 8, ["name"])) : createCommentVNode("", true),
				createTextVNode(" " + toDisplayString(matched.value.dictLabel || "ERROR"), 1)
			], 2)) : (openBlock(), createBlock(unref(ElTag), mergeProps({ key: 1 }, _ctx.$attrs, {
				type: displayType.value,
				size: __props.size,
				closable: __props.closable,
				"disable-transitions": __props.disableTransitions,
				hit: __props.hit,
				color: __props.color,
				effect: __props.effect,
				round: __props.round
			}), {
				default: withCtx(() => [
					__props.dot ? (openBlock(), createElementBlock("span", {
						key: 0,
						class: "koi-tag__dot",
						style: normalizeStyle({ background: __props.dotColor || __props.color || "var(--el-color-primary)" })
					}, null, 4)) : createCommentVNode("", true),
					displayIcon.value ? (openBlock(), createBlock(ReIcon_default, {
						key: 1,
						name: displayIcon.value,
						class: "koi-tag__icon"
					}, null, 8, ["name"])) : createCommentVNode("", true),
					renderSlot(_ctx.$slots, "default", {}, () => [createTextVNode(toDisplayString(displayText.value), 1)], true)
				]),
				_: 3
			}, 16, [
				"type",
				"size",
				"closable",
				"disable-transitions",
				"hit",
				"color",
				"effect",
				"round"
			]))]);
		};
	}
}), [["__scopeId", "data-v-a61edaf9"]]);
//#endregion
export { ReTag_default as default };
