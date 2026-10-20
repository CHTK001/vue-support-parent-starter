import { $n as normalizeClass, D as createVNode, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, rr as toDisplayString, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { n as useLocale } from "./use-locale-MdBtu2ja.js";
import { r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { n as addUnit } from "./style-D30oR_2q.js";
import { t as useId } from "./use-id-C2v-tXFq.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/empty/src/empty.mjs
/**
* @deprecated Removed after 3.0.0, Use `EmptyProps` instead.
*/
var emptyProps = buildProps({
	/**
	* @description image URL of empty
	*/
	image: {
		type: String,
		default: ""
	},
	/**
	* @description image size (width) of empty
	*/
	imageSize: Number,
	/**
	* @description description of empty
	*/
	description: {
		type: String,
		default: ""
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/empty/src/img-empty.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1$1 = {
	viewBox: "0 0 79 86",
	version: "1.1",
	xmlns: "http://www.w3.org/2000/svg",
	"xmlns:xlink": "http://www.w3.org/1999/xlink"
};
var _hoisted_2$1 = ["id"];
var _hoisted_3 = ["stop-color"];
var _hoisted_4 = ["stop-color"];
var _hoisted_5 = ["id"];
var _hoisted_6 = ["stop-color"];
var _hoisted_7 = ["stop-color"];
var _hoisted_8 = ["id"];
var _hoisted_9 = {
	stroke: "none",
	"stroke-width": "1",
	fill: "none",
	"fill-rule": "evenodd"
};
var _hoisted_10 = { transform: "translate(-1268.000000, -535.000000)" };
var _hoisted_11 = { transform: "translate(1268.000000, 535.000000)" };
var _hoisted_12 = ["fill"];
var _hoisted_13 = ["fill"];
var _hoisted_14 = { transform: "translate(34.500000, 31.500000) scale(-1, 1) rotate(-25.000000) translate(-34.500000, -31.500000) translate(7.000000, 10.000000)" };
var _hoisted_15 = ["fill"];
var _hoisted_16 = ["fill"];
var _hoisted_17 = ["fill"];
var _hoisted_18 = ["fill"];
var _hoisted_19 = ["fill"];
var _hoisted_20 = { transform: "translate(53.000000, 45.000000)" };
var _hoisted_21 = ["fill", "xlink:href"];
var _hoisted_22 = ["fill", "mask"];
var _hoisted_23 = ["fill"];
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/empty/src/img-empty.mjs
var img_empty_default = /* @__PURE__ */ defineComponent({
	name: "ImgEmpty",
	__name: "img-empty",
	setup(__props) {
		const ns = useNamespace("empty");
		const id = useId();
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("svg", _hoisted_1$1, [createBaseVNode("defs", null, [
				createBaseVNode("linearGradient", {
					id: `linearGradient-1-${unref(id)}`,
					x1: "38.8503086%",
					y1: "0%",
					x2: "61.1496914%",
					y2: "100%"
				}, [createBaseVNode("stop", {
					"stop-color": `var(${unref(ns).cssVarBlockName("fill-color-1")})`,
					offset: "0%"
				}, null, 8, _hoisted_3), createBaseVNode("stop", {
					"stop-color": `var(${unref(ns).cssVarBlockName("fill-color-4")})`,
					offset: "100%"
				}, null, 8, _hoisted_4)], 8, _hoisted_2$1),
				createBaseVNode("linearGradient", {
					id: `linearGradient-2-${unref(id)}`,
					x1: "0%",
					y1: "9.5%",
					x2: "100%",
					y2: "90.5%"
				}, [createBaseVNode("stop", {
					"stop-color": `var(${unref(ns).cssVarBlockName("fill-color-1")})`,
					offset: "0%"
				}, null, 8, _hoisted_6), createBaseVNode("stop", {
					"stop-color": `var(${unref(ns).cssVarBlockName("fill-color-6")})`,
					offset: "100%"
				}, null, 8, _hoisted_7)], 8, _hoisted_5),
				createBaseVNode("rect", {
					id: `path-3-${unref(id)}`,
					x: "0",
					y: "0",
					width: "17",
					height: "36"
				}, null, 8, _hoisted_8)
			]), createBaseVNode("g", _hoisted_9, [createBaseVNode("g", _hoisted_10, [createBaseVNode("g", _hoisted_11, [
				createBaseVNode("path", {
					d: "M39.5,86 C61.3152476,86 79,83.9106622 79,81.3333333 C79,78.7560045 57.3152476,78 35.5,78 C13.6847524,78 0,78.7560045 0,81.3333333 C0,83.9106622 17.6847524,86 39.5,86 Z",
					fill: `var(${unref(ns).cssVarBlockName("fill-color-3")})`
				}, null, 8, _hoisted_12),
				createBaseVNode("polygon", {
					fill: `var(${unref(ns).cssVarBlockName("fill-color-7")})`,
					transform: "translate(27.500000, 51.500000) scale(1, -1) translate(-27.500000, -51.500000) ",
					points: "13 58 53 58 42 45 2 45"
				}, null, 8, _hoisted_13),
				createBaseVNode("g", _hoisted_14, [
					createBaseVNode("polygon", {
						fill: `var(${unref(ns).cssVarBlockName("fill-color-7")})`,
						transform: "translate(11.500000, 5.000000) scale(1, -1) translate(-11.500000, -5.000000) ",
						points: "2.84078316e-14 3 18 3 23 7 5 7"
					}, null, 8, _hoisted_15),
					createBaseVNode("polygon", {
						fill: `var(${unref(ns).cssVarBlockName("fill-color-5")})`,
						points: "-3.69149156e-15 7 38 7 38 43 -3.69149156e-15 43"
					}, null, 8, _hoisted_16),
					createBaseVNode("rect", {
						fill: `url(#linearGradient-1-${unref(id)})`,
						transform: "translate(46.500000, 25.000000) scale(-1, 1) translate(-46.500000, -25.000000) ",
						x: "38",
						y: "7",
						width: "17",
						height: "36"
					}, null, 8, _hoisted_17),
					createBaseVNode("polygon", {
						fill: `var(${unref(ns).cssVarBlockName("fill-color-2")})`,
						transform: "translate(39.500000, 3.500000) scale(-1, 1) translate(-39.500000, -3.500000) ",
						points: "24 7 41 7 55 -3.63806207e-12 38 -3.63806207e-12"
					}, null, 8, _hoisted_18)
				]),
				createBaseVNode("rect", {
					fill: `url(#linearGradient-2-${unref(id)})`,
					x: "13",
					y: "45",
					width: "40",
					height: "36"
				}, null, 8, _hoisted_19),
				createBaseVNode("g", _hoisted_20, [createBaseVNode("use", {
					fill: `var(${unref(ns).cssVarBlockName("fill-color-8")})`,
					transform: "translate(8.500000, 18.000000) scale(-1, 1) translate(-8.500000, -18.000000) ",
					"xlink:href": `#path-3-${unref(id)}`
				}, null, 8, _hoisted_21), createBaseVNode("polygon", {
					fill: `var(${unref(ns).cssVarBlockName("fill-color-9")})`,
					mask: `url(#mask-4-${unref(id)})`,
					transform: "translate(12.000000, 9.000000) scale(-1, 1) translate(-12.000000, -9.000000) ",
					points: "7 0 24 0 20 18 7 16.5"
				}, null, 8, _hoisted_22)]),
				createBaseVNode("polygon", {
					fill: `var(${unref(ns).cssVarBlockName("fill-color-2")})`,
					transform: "translate(66.000000, 51.500000) scale(-1, 1) translate(-66.000000, -51.500000) ",
					points: "62 45 79 45 70 58 53 58"
				}, null, 8, _hoisted_23)
			])])])]);
		};
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/empty/src/empty.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["src"];
var _hoisted_2 = { key: 1 };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/empty/index.mjs
var ElEmpty = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElEmpty",
	__name: "empty",
	props: emptyProps,
	setup(__props) {
		const props = __props;
		const { t } = useLocale();
		const ns = useNamespace("empty");
		const emptyDescription = computed(() => props.description || t("el.table.emptyText"));
		const imageStyle = computed(() => ({ width: addUnit(props.imageSize) }));
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", { class: normalizeClass(unref(ns).b()) }, [
				createBaseVNode("div", {
					class: normalizeClass(unref(ns).e("image")),
					style: normalizeStyle(imageStyle.value)
				}, [__props.image ? (openBlock(), createElementBlock("img", {
					key: 0,
					src: __props.image,
					ondragstart: "return false"
				}, null, 8, _hoisted_1)) : renderSlot(_ctx.$slots, "image", { key: 1 }, () => [createVNode(img_empty_default)])], 6),
				createBaseVNode("div", { class: normalizeClass(unref(ns).e("description")) }, [_ctx.$slots.description ? renderSlot(_ctx.$slots, "description", { key: 0 }) : (openBlock(), createElementBlock("p", _hoisted_2, toDisplayString(emptyDescription.value), 1))], 2),
				_ctx.$slots.default ? (openBlock(), createElementBlock("div", {
					key: 0,
					class: normalizeClass(unref(ns).e("bottom"))
				}, [renderSlot(_ctx.$slots, "default")], 2)) : createCommentVNode("v-if", true)
			], 2);
		};
	}
}));
//#endregion
export { ElEmpty as t };
