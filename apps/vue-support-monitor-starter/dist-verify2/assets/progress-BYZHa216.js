import { $n as normalizeClass, Bn as isFunction, Jn as isString, On as unref, _ as createBaseVNode, b as createElementBlock, g as computed, k as defineComponent, mt as openBlock, nr as normalizeStyle, qt as withCtx, rr as toDisplayString, v as createBlock, wt as resolveDynamicComponent, xt as renderSlot, y as createCommentVNode } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { c as definePropType, r as useNamespace, s as buildProps } from "./use-namespace-BksmY6RT.js";
import { t as withInstall } from "./install-CE5IEjzX.js";
import { _ as check_default, b as circle_close_default, pn as warning_filled_default, v as circle_check_default, w as close_default } from "./dist-DogtK295.js";
import { t as ElIcon } from "./icon-CKvLDnIU.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/progress/src/progress.mjs
/**
* @deprecated Removed after 3.0.0, Use `ProgressProps` instead.
*/
var progressProps = buildProps({
	/**
	* @description type of progress bar
	*/
	type: {
		type: String,
		default: "line",
		values: [
			"line",
			"circle",
			"dashboard"
		]
	},
	/**
	* @description percentage, required
	*/
	percentage: {
		type: Number,
		default: 0,
		validator: (val) => val >= 0 && val <= 100
	},
	/**
	* @description the current status of progress bar
	*/
	status: {
		type: String,
		default: "",
		values: [
			"",
			"success",
			"exception",
			"warning"
		]
	},
	/**
	* @description set indeterminate progress
	*/
	indeterminate: Boolean,
	/**
	* @description control the animation duration of indeterminate progress or striped flow progress
	*/
	duration: {
		type: Number,
		default: 3
	},
	/**
	* @description the width of progress bar
	*/
	strokeWidth: {
		type: Number,
		default: 6
	},
	/**
	* @description butt/circle/dashboard type shape at the end path
	*/
	strokeLinecap: {
		type: definePropType(String),
		default: "round"
	},
	/**
	* @description whether to place the percentage inside progress bar, only works when `type` is 'line'
	*/
	textInside: Boolean,
	/**
	* @description the canvas width of circle progress bar
	*/
	width: {
		type: Number,
		default: 126
	},
	/**
	* @description whether to show percentage
	*/
	showText: {
		type: Boolean,
		default: true
	},
	/**
	* @description background color of progress bar. Overrides `status` prop
	*/
	color: {
		type: definePropType([
			String,
			Array,
			Function
		]),
		default: ""
	},
	/**
	* @description stripe over the progress bar's color
	*/
	striped: Boolean,
	/**
	* @description get the stripes to flow
	*/
	stripedFlow: Boolean,
	/**
	* @description custom text format
	*/
	format: {
		type: definePropType(Function),
		default: (percentage) => `${percentage}%`
	}
});
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/progress/src/progress.vue_vue_type_script_setup_true_lang.mjs
var _hoisted_1 = ["aria-valuenow"];
var _hoisted_2 = { viewBox: "0 0 100 100" };
var _hoisted_3 = [
	"d",
	"stroke",
	"stroke-linecap",
	"stroke-width"
];
var _hoisted_4 = [
	"d",
	"stroke",
	"opacity",
	"stroke-linecap",
	"stroke-width"
];
var _hoisted_5 = { key: 0 };
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/components/progress/index.mjs
var ElProgress = withInstall(/* @__PURE__ */ defineComponent({
	name: "ElProgress",
	__name: "progress",
	props: progressProps,
	setup(__props) {
		const STATUS_COLOR_MAP = {
			success: "#13ce66",
			exception: "#ff4949",
			warning: "#e6a23c",
			default: "#20a0ff"
		};
		const props = __props;
		const ns = useNamespace("progress");
		const barStyle = computed(() => {
			const barStyle = {
				width: `${props.percentage}%`,
				animationDuration: `${props.duration}s`
			};
			const color = getCurrentColor(props.percentage);
			if (color.includes("gradient")) barStyle.background = color;
			else barStyle.backgroundColor = color;
			return barStyle;
		});
		const relativeStrokeWidth = computed(() => (props.strokeWidth / props.width * 100).toFixed(1));
		const radius = computed(() => {
			if (["circle", "dashboard"].includes(props.type)) return Number.parseInt(`${50 - Number.parseFloat(relativeStrokeWidth.value) / 2}`, 10);
			return 0;
		});
		const trackPath = computed(() => {
			const r = radius.value;
			const isDashboard = props.type === "dashboard";
			return `
          M 50 50
          m 0 ${isDashboard ? "" : "-"}${r}
          a ${r} ${r} 0 1 1 0 ${isDashboard ? "-" : ""}${r * 2}
          a ${r} ${r} 0 1 1 0 ${isDashboard ? "" : "-"}${r * 2}
          `;
		});
		const perimeter = computed(() => 2 * Math.PI * radius.value);
		const rate = computed(() => props.type === "dashboard" ? .75 : 1);
		const strokeDashoffset = computed(() => {
			return `${-1 * perimeter.value * (1 - rate.value) / 2}px`;
		});
		const trailPathStyle = computed(() => ({
			strokeDasharray: `${perimeter.value * rate.value}px, ${perimeter.value}px`,
			strokeDashoffset: strokeDashoffset.value
		}));
		const circlePathStyle = computed(() => ({
			strokeDasharray: `${perimeter.value * rate.value * (props.percentage / 100)}px, ${perimeter.value}px`,
			strokeDashoffset: strokeDashoffset.value,
			transition: "stroke-dasharray 0.6s ease 0s, stroke 0.6s ease, opacity ease 0.6s"
		}));
		const stroke = computed(() => {
			let ret;
			if (props.color) ret = getCurrentColor(props.percentage);
			else ret = STATUS_COLOR_MAP[props.status] || STATUS_COLOR_MAP.default;
			return ret;
		});
		const statusIcon = computed(() => {
			if (props.status === "warning") return warning_filled_default;
			if (props.type === "line") return props.status === "success" ? circle_check_default : circle_close_default;
			else return props.status === "success" ? check_default : close_default;
		});
		const progressTextSize = computed(() => {
			return props.type === "line" ? 12 + props.strokeWidth * .4 : props.width * .111111 + 2;
		});
		const content = computed(() => props.format(props.percentage));
		function getColors(color) {
			const span = 100 / color.length;
			return color.map((seriesColor, index) => {
				if (isString(seriesColor)) return {
					color: seriesColor,
					percentage: (index + 1) * span
				};
				return seriesColor;
			}).sort((a, b) => a.percentage - b.percentage);
		}
		const getCurrentColor = (percentage) => {
			const { color } = props;
			if (isFunction(color)) return color(percentage);
			else if (isString(color)) return color;
			else {
				const colors = getColors(color);
				for (const color of colors) if (color.percentage > percentage) return color.color;
				return colors[colors.length - 1]?.color;
			}
		};
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				class: normalizeClass([
					unref(ns).b(),
					unref(ns).m(__props.type),
					unref(ns).is(__props.status),
					{
						[unref(ns).m("without-text")]: !__props.showText,
						[unref(ns).m("text-inside")]: __props.textInside
					}
				]),
				role: "progressbar",
				"aria-valuenow": __props.percentage,
				"aria-valuemin": "0",
				"aria-valuemax": "100"
			}, [__props.type === "line" ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(unref(ns).b("bar"))
			}, [createBaseVNode("div", {
				class: normalizeClass(unref(ns).be("bar", "outer")),
				style: normalizeStyle({ height: `${__props.strokeWidth}px` })
			}, [createBaseVNode("div", {
				class: normalizeClass([
					unref(ns).be("bar", "inner"),
					{ [unref(ns).bem("bar", "inner", "indeterminate")]: __props.indeterminate },
					{ [unref(ns).bem("bar", "inner", "striped")]: __props.striped },
					{ [unref(ns).bem("bar", "inner", "striped-flow")]: __props.stripedFlow }
				]),
				style: normalizeStyle(barStyle.value)
			}, [(__props.showText || _ctx.$slots.default) && __props.textInside ? (openBlock(), createElementBlock("div", {
				key: 0,
				class: normalizeClass(unref(ns).be("bar", "innerText"))
			}, [renderSlot(_ctx.$slots, "default", { percentage: __props.percentage }, () => [createBaseVNode("span", null, toDisplayString(content.value), 1)])], 2)) : createCommentVNode("v-if", true)], 6)], 6)], 2)) : (openBlock(), createElementBlock("div", {
				key: 1,
				class: normalizeClass(unref(ns).b("circle")),
				style: normalizeStyle({
					height: `${__props.width}px`,
					width: `${__props.width}px`
				})
			}, [(openBlock(), createElementBlock("svg", _hoisted_2, [createBaseVNode("path", {
				class: normalizeClass(unref(ns).be("circle", "track")),
				d: trackPath.value,
				stroke: `var(${unref(ns).cssVarName("fill-color-light")}, #e5e9f2)`,
				"stroke-linecap": __props.strokeLinecap,
				"stroke-width": relativeStrokeWidth.value,
				fill: "none",
				style: normalizeStyle(trailPathStyle.value)
			}, null, 14, _hoisted_3), createBaseVNode("path", {
				class: normalizeClass(unref(ns).be("circle", "path")),
				d: trackPath.value,
				stroke: stroke.value,
				fill: "none",
				opacity: __props.percentage ? 1 : 0,
				"stroke-linecap": __props.strokeLinecap,
				"stroke-width": relativeStrokeWidth.value,
				style: normalizeStyle(circlePathStyle.value)
			}, null, 14, _hoisted_4)]))], 6)), (__props.showText || _ctx.$slots.default) && !__props.textInside ? (openBlock(), createElementBlock("div", {
				key: 2,
				class: normalizeClass(unref(ns).e("text")),
				style: normalizeStyle({ fontSize: `${progressTextSize.value}px` })
			}, [renderSlot(_ctx.$slots, "default", { percentage: __props.percentage }, () => [!__props.status ? (openBlock(), createElementBlock("span", _hoisted_5, toDisplayString(content.value), 1)) : (openBlock(), createBlock(unref(ElIcon), { key: 1 }, {
				default: withCtx(() => [(openBlock(), createBlock(resolveDynamicComponent(statusIcon.value)))]),
				_: 1
			}))])], 6)) : createCommentVNode("v-if", true)], 10, _hoisted_1);
		};
	}
}));
//#endregion
export { ElProgress as t };
