import { $n as normalizeClass, Nt as useAttrs, ct as onMounted, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, pt as onUpdated, qt as withCtx, tt as nextTick, v as createBlock, vn as ref, wt as resolveDynamicComponent, xt as renderSlot } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as componentSizes } from "./use-size-BpzpcbJM.js";
import { h as isUndefined, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as useFormSize } from "./use-form-common-props-DzQ9ZY64.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/text/src/text.mjs
/**
* @deprecated Removed after 3.0.0, Use `TextProps` instead.
*/
var textProps = buildProps({
	/**
	* @description text type
	*/
	type: {
		type: String,
		values: [
			"primary",
			"success",
			"info",
			"warning",
			"danger",
			""
		],
		default: ""
	},
	/**
	* @description text size
	*/
	size: {
		type: String,
		values: componentSizes,
		default: ""
	},
	/**
	* @description render ellipsis
	*/
	truncated: Boolean,
	/**
	* @description maximum lines
	*/
	lineClamp: { type: [String, Number] },
	/**
	* @description custom element tag
	*/
	tag: {
		type: String,
		default: "span"
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/text/index.mjs
var ElText = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElText",
	__name: "text",
	props: textProps,
	setup(__props) {
		const props = __props;
		const attrs = useAttrs();
		const textRef = ref();
		const textSize = useFormSize();
		const ns = useNamespace("text");
		const textKls = computed(() => [
			ns.b(),
			ns.m(props.type),
			ns.m(textSize.value),
			ns.is("truncated", props.truncated),
			ns.is("line-clamp", !isUndefined(props.lineClamp))
		]);
		const bindTitle = async () => {
			await nextTick();
			if (attrs.title) return;
			let shouldAddTitle = false;
			const text = textRef.value?.textContent || "";
			if (props.truncated) {
				const width = textRef.value?.offsetWidth;
				const scrollWidth = textRef.value?.scrollWidth;
				if (width && scrollWidth && scrollWidth > width) shouldAddTitle = true;
			} else if (!isUndefined(props.lineClamp)) {
				const height = textRef.value?.offsetHeight;
				const scrollHeight = textRef.value?.scrollHeight;
				if (height && scrollHeight && scrollHeight > height) shouldAddTitle = true;
			}
			if (shouldAddTitle) textRef.value?.setAttribute("title", text);
			else textRef.value?.removeAttribute("title");
		};
		onMounted(bindTitle);
		onUpdated(bindTitle);
		return (_ctx, _cache) => {
			return openBlock(), createBlock(resolveDynamicComponent(__props.tag), {
				ref_key: "textRef",
				ref: textRef,
				class: normalizeClass(textKls.value),
				style: normalizeStyle({ "-webkit-line-clamp": __props.lineClamp })
			}, {
				default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
				_: 3
			}, 8, ["class", "style"]);
		};
	}
}));
//#endregion
export { ElText as t };
