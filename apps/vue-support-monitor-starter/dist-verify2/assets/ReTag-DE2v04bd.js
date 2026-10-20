import { E as createTextVNode, On as unref, b as createElementBlock, et as mergeProps, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as ElTag } from "./tag-CqzZCxmq.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { t as ReIcon_default } from "./ReIcon-mRxVAA3T.js";
//#endregion
//#region ../../packages/ui/src/components/ReTag/theme/default/ReTag.vue
var ReTag_default = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	name: "ReTag",
	inheritAttrs: true,
	__name: "ReTag",
	props: {
		type: { default: void 0 },
		size: { default: void 0 },
		closable: {
			type: Boolean,
			default: false
		},
		disableTransitions: {
			type: Boolean,
			default: false
		},
		hit: {
			type: Boolean,
			default: false
		},
		color: { default: "" },
		effect: { default: "light" },
		round: {
			type: Boolean,
			default: false
		},
		value: { default: "" },
		map: { default: () => ({}) },
		icon: { default: "" },
		dot: {
			type: Boolean,
			default: false
		},
		dotColor: { default: "" }
	},
	setup(__props) {
		/**
		* ReTag —— 标签组件
		*
		* 透传 el-tag 全部能力，增加 value 颜色映射能力：
		*   <ReTag :value="1" :map="{ 1: { label: '启用', type: 'success' } }" />
		*/
		const props = __props;
		/** 根据 value 匹配映射后的展示 */
		const mapped = computed(() => {
			if (props.value === "" || !props.map) return null;
			const key = String(props.value);
			return props.map[key] ?? null;
		});
		const displayType = computed(() => mapped.value?.type || props.type);
		const displayText = computed(() => mapped.value?.label ?? void 0);
		const displayIcon = computed(() => mapped.value?.icon || props.icon);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(unref(ElTag), mergeProps(_ctx.$attrs, {
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
						class: "re-tag__dot",
						style: normalizeStyle({ background: __props.dotColor || __props.color || "var(--el-color-primary)" })
					}, null, 4)) : createCommentVNode("", true),
					displayIcon.value ? (openBlock(), createBlock(ReIcon_default, {
						key: 1,
						name: displayIcon.value,
						class: "re-tag__icon"
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
			]);
		};
	}
}), [["__scopeId", "data-v-749de843"]]);
//#endregion
export { ReTag_default as default };
