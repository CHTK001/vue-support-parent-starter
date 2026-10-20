import { $n as normalizeClass, D as createVNode, Hn as isObject, Ht as watch, On as unref, b as createElementBlock, bt as renderList, ct as onMounted, et as mergeProps, k as defineComponent, mt as openBlock, o as Fragment, tr as normalizeProps, v as createBlock, vn as ref, wn as toRef, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as definePropType, f as isNumber, h as isUndefined, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { i as withNoopInstall, t as withInstall } from "./install-CE5IEjzX.js";
import { Tt as picture_filled_default } from "./dist-DogtK295.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-throttle-render/index.mjs
var useThrottleRender = (loading, throttle = 0) => {
	if (throttle === 0) return loading;
	const throttled = ref(isObject(throttle) && Boolean(throttle.initVal));
	let timeoutHandle = null;
	const dispatchThrottling = (timer) => {
		if (isUndefined(timer)) {
			throttled.value = loading.value;
			return;
		}
		if (timeoutHandle) clearTimeout(timeoutHandle);
		timeoutHandle = setTimeout(() => {
			throttled.value = loading.value;
		}, timer);
	};
	const dispatcher = (type) => {
		if (type === "leading") if (isNumber(throttle)) dispatchThrottling(throttle);
		else dispatchThrottling(throttle.leading);
		else if (isObject(throttle)) dispatchThrottling(throttle.trailing);
		else throttled.value = false;
	};
	onMounted(() => dispatcher("leading"));
	watch(() => loading.value, (val) => {
		dispatcher(val ? "leading" : "trailing");
	});
	return throttled;
};
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/skeleton/src/skeleton.mjs
/**
* @deprecated Removed after 3.0.0, Use `SkeletonProps` instead.
*/
var skeletonProps = buildProps({
	/**
	* @description whether showing the animation
	*/
	animated: Boolean,
	/**
	* @description how many fake items to render to the DOM
	*/
	count: {
		type: Number,
		default: 1
	},
	/**
	* @description numbers of the row, only useful when no template slot were given
	*/
	rows: {
		type: Number,
		default: 3
	},
	/**
	* @description whether showing the real DOM
	*/
	loading: {
		type: Boolean,
		default: true
	},
	/**
	* @description rendering delay in milliseconds
	*/
	throttle: { type: definePropType([Number, Object]) }
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/skeleton/src/skeleton-item.mjs
/**
* @deprecated Removed after 3.0.0, Use `SkeletonItemProps` instead.
*/
var skeletonItemProps = buildProps({ 
/**
* @description the current rendering skeleton type
*/
variant: {
	type: String,
	values: [
		"circle",
		"rect",
		"h1",
		"h3",
		"text",
		"caption",
		"p",
		"image",
		"button"
	],
	default: "text"
} });
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/skeleton/src/skeleton-item2.mjs
var skeleton_item_default = /* @__PURE__ */ defineComponent({
	name: "ElSkeletonItem",
	__name: "skeleton-item",
	props: skeletonItemProps,
	setup(__props) {
		const ns = useNamespace("skeleton");
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass([unref(ns).e("item"), unref(ns).e(__props.variant)]) }, [__props.variant === "image" ? (openBlock(), createBlock(unref(picture_filled_default), { key: 0 })) : createCommentVNode("v-if", true)], 2);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/skeleton/index.mjs
var ElSkeleton = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElSkeleton",
	__name: "skeleton",
	props: skeletonProps,
	setup(__props, { expose: __expose }) {
		const props = __props;
		const ns = useNamespace("skeleton");
		const uiLoading = useThrottleRender(toRef(props, "loading"), props.throttle);
		__expose({ 
		/** @description loading state */
uiLoading });
		return (_ctx, _cache) => {
			return unref(uiLoading) ? (openBlock(), createElementBlock("div", mergeProps({
				key: 0,
				class: [unref(ns).b(), unref(ns).is("animated", __props.animated)]
			}, _ctx.$attrs), [(openBlock(true), createElementBlock(Fragment, null, renderList(__props.count, (i) => {
				return openBlock(), createElementBlock(Fragment, { key: i }, [unref(uiLoading) ? renderSlot(_ctx.$slots, "template", { key: i }, () => [createVNode(skeleton_item_default, {
					class: normalizeClass(unref(ns).is("first")),
					variant: "p"
				}, null, 8, ["class"]), (openBlock(true), createElementBlock(Fragment, null, renderList(__props.rows, (item) => {
					return openBlock(), createBlock(skeleton_item_default, {
						key: item,
						class: normalizeClass([unref(ns).e("paragraph"), unref(ns).is("last", item === __props.rows && __props.rows > 1)]),
						variant: "p"
					}, null, 8, ["class"]);
				}), 128))]) : createCommentVNode("v-if", true)], 64);
			}), 128))], 16)) : renderSlot(_ctx.$slots, "default", normalizeProps(mergeProps({ key: 1 }, _ctx.$attrs)));
		};
	}
}), { SkeletonItem: skeleton_item_default });
var ElSkeletonItem = withNoopInstall(skeleton_item_default);
//#endregion
export { ElSkeletonItem as n, ElSkeleton as t };
