import { $n as normalizeClass, On as unref, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, qt as withCtx, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { l as isBoolean, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as useDeprecated } from "./use-deprecated-qam6HGto.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { a as iconPropType } from "./icon-C0dIJHSD.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
import { r as useGlobalConfig } from "./use-global-config-CwtC64sR.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/link/src/link.mjs
/**
* @deprecated Removed after 3.0.0, Use `LinkProps` instead.
*/
var linkProps = buildProps({
	/**
	* @description type
	*/
	type: {
		type: String,
		values: [
			"primary",
			"success",
			"warning",
			"info",
			"danger",
			"default"
		],
		default: void 0
	},
	/**
	* @description when underlines should appear
	*/
	underline: {
		type: [Boolean, String],
		values: [
			true,
			false,
			"always",
			"never",
			"hover"
		],
		default: void 0
	},
	/**
	* @description whether the component is disabled
	*/
	disabled: Boolean,
	/**
	* @description same as native hyperlink's `href`
	*/
	href: {
		type: String,
		default: ""
	},
	/**
	* @description same as native hyperlink's `target`
	*/
	target: {
		type: String,
		default: "_self"
	},
	/**
	* @description icon component
	*/
	icon: { type: iconPropType }
});
var linkEmits = { click: (evt) => evt instanceof MouseEvent };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/link/src/link.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["href", "target"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/link/index.mjs
var ElLink = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElLink",
	__name: "link",
	props: linkProps,
	emits: linkEmits,
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const globalConfig = useGlobalConfig("link");
		useDeprecated({
			scope: "el-link",
			from: "The underline option (boolean)",
			replacement: "'always' | 'hover' | 'never'",
			version: "3.0.0",
			ref: "https://element-plus.org/en-US/component/link.html#underline"
		}, computed(() => isBoolean(props.underline)));
		const ns = useNamespace("link");
		const linkKls = computed(() => [
			ns.b(),
			ns.m(props.type ?? globalConfig.value?.type ?? "default"),
			ns.is("disabled", props.disabled),
			ns.is("underline", underline.value === "always"),
			ns.is("hover-underline", underline.value === "hover" && !props.disabled)
		]);
		const underline = computed(() => {
			if (isBoolean(props.underline)) return props.underline ? "hover" : "never";
			else return props.underline ?? globalConfig.value?.underline ?? "hover";
		});
		function handleClick(event) {
			if (!props.disabled) emit("click", event);
		}
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("a", {
				class: normalizeClass(linkKls.value),
				href: __props.disabled || !__props.href ? void 0 : __props.href,
				target: __props.disabled || !__props.href ? void 0 : __props.target,
				onClick: handleClick
			}, [
				__props.icon ? (openBlock(), createBlock(unref(ElIcon), { key: 0 }, {
					default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(__props.icon)))]),
					_: 1
				})) : createCommentVNode("v-if", true),
				_ctx.$slots.default ? (openBlock(), createElementBlock("span", {
					key: 1,
					class: normalizeClass(unref(ns).e("inner"))
				}, [renderSlot(_ctx.$slots, "default")], 2)) : createCommentVNode("v-if", true),
				_ctx.$slots.icon ? renderSlot(_ctx.$slots, "icon", { key: 2 }) : createCommentVNode("v-if", true)
			], 10, _hoisted_1);
		};
	}
}));
//#endregion
export { ElLink as t };
