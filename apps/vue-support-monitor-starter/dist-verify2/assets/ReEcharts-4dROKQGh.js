import { Ht as watch, b as createElementBlock, ct as onMounted, it as onBeforeUnmount, k as defineComponent, mt as openBlock, nr as normalizeStyle, vn as ref, xn as shallowRef } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as _plugin_vue_export_helper_default } from "./_plugin-vue_export-helper-BOaGB7Aw.js";
import { D as init } from "./echarts-compat-C1tiQKE2.js";
//#region ../../packages/ui/src/components/ReEcharts/colorSpace.ts
/**
* colorSpace — 将现代 CSS 颜色（oklab / oklch / lab / lch）确定性地转换为
* ECharts/ZRender 可稳定解析的 sRGB `rgb()` / `rgba()` 字符串。
*
* 背景：当调色板主色以 `oklab(...)` 提供时，ECharts 在 emphasis（如 tooltip
* trigger:'axis' 的 hover）状态下重新解析颜色会失败并得到 undefined，导致整条
* 折线"消失"。统一在注入主题前归一化为 sRGB 可规避该问题。
*/
var D65_TO_RGB = [
	[
		3.24096994,
		-1.53738318,
		-.49861076
	],
	[
		-.96924364,
		1.8759675,
		.04155506
	],
	[
		.05563008,
		-.20397696,
		1.05697151
	]
];
/** linear-light sRGB -> gamma-encoded sRGB channel (0..255) */
function gammaEncode(c) {
	c = Math.min(1, Math.max(0, c));
	const v = c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055;
	return Math.round(v * 255);
}
function matrix(m, v) {
	return m.map((row) => row.reduce((acc, x, i) => acc + x * v[i], 0));
}
/** OKLab (L,a,b) -> [r,g,b] (0..255) */
function oklabToRgb255(L, a, b) {
	let l = L + .3963377774 * a + .2158037573 * b;
	let m = L - .1055613458 * a - .0638541728 * b;
	let s = L - .0894841775 * a - 1.291485548 * b;
	l **= 3;
	m **= 3;
	s **= 3;
	return matrix(D65_TO_RGB, [
		l,
		m,
		s
	]).map(gammaEncode);
}
var D50_TO_D65 = [
	[
		.9555766,
		-.0230393,
		.0631636
	],
	[
		-.0282895,
		1.0099416,
		.0210077
	],
	[
		.0122982,
		-.020483,
		1.3299098
	]
];
var D50_XN = .96422;
var D50_ZN = .82521;
/** CIE Lab (D50) (L,a,b) -> [r,g,b] (0..255) */
function labToRgb255(L, a, b) {
	const e = .008856;
	const k = 903.3;
	const fy = (L + 16) / 116;
	const fx = a / 500 + fy;
	const fz = fy - b / 200;
	const fx3 = fx ** 3;
	const fy3 = fy ** 3;
	const fz3 = fz ** 3;
	const x = fx3 > e ? fx3 : (116 * fx - 16) / k;
	const y = fy3 > e ? fy3 : L / k;
	const z = fz3 > e ? fz3 : (116 * fz - 16) / k;
	const [X, Y, Z] = matrix(D50_TO_D65, [
		x * D50_XN,
		y,
		z * D50_ZN
	]);
	return matrix(D65_TO_RGB, [
		X,
		Y,
		Z
	]).map(gammaEncode);
}
/** Parse an angle token (deg/rad/grad/turn) to degrees */
function parseAngle(token, fallback) {
	if (token === void 0 || token === "") return fallback;
	const m = token.match(/(-?[\d.]+)(deg|rad|grad|turn)?/);
	if (!m) return fallback;
	const v = parseFloat(m[1]);
	switch (m[2]) {
		case "rad": return v * 180 / Math.PI;
		case "grad": return v * .9;
		case "turn": return v * 360;
		default: return v;
	}
}
function parseAlpha(token) {
	if (token === void 0) return 1;
	token = token.trim();
	if (token.endsWith("%")) return Math.min(1, Math.max(0, parseFloat(token) / 100));
	return Math.min(1, Math.max(0, parseFloat(token)));
}
function formatRgb(rgb, alpha) {
	if (alpha >= 1) return `rgb(${rgb.join(",")})`;
	return `rgba(${rgb.join(",")},${Number(alpha.toFixed(3))})`;
}
/**
* Normalize a CSS color string to sRGB rgb()/rgba().
* Already-compatible values (hex / rgb / rgba / hsl / named) are returned as-is.
*/
function normalizeColor(input) {
	if (!input) return "";
	const c = String(input).trim();
	if (/^(#[a-f0-9]|rgb|rgba|hsl|hsla)/i.test(c)) return c;
	const fn = c.match(/^(oklab|oklch|lab|lch)\(/i);
	if (!fn) return c;
	const func = fn[1].toLowerCase();
	const parts = c.slice(c.indexOf("(") + 1, c.lastIndexOf(")")).split("/").map((s) => s.trim());
	const tokens = parts[0].trim().split(/\s+/);
	const alpha = parseAlpha(parts[1]);
	if (func === "oklab" || func === "oklch") {
		let L = parseFloat(tokens[0]);
		if (tokens[0].includes("%")) L /= 100;
		let a;
		let b;
		if (func === "oklab") {
			a = tokens[1] === void 0 ? 0 : parseFloat(tokens[1]);
			b = tokens[2] === void 0 ? 0 : parseFloat(tokens[2]);
			if (tokens[1] && tokens[1].includes("%")) a = parseFloat(tokens[1]) / 100 * .4;
			if (tokens[2] && tokens[2].includes("%")) b = parseFloat(tokens[2]) / 100 * .4;
		} else {
			const C = tokens[1] === void 0 ? 0 : parseFloat(tokens[1]);
			const h = parseAngle(tokens[2], 0) * Math.PI / 180;
			a = C * Math.cos(h);
			b = C * Math.sin(h);
		}
		return formatRgb(oklabToRgb255(L, a, b), alpha);
	}
	let L = parseFloat(tokens[0]);
	if (tokens[0].includes("%")) L = L / 100 * 100;
	let a;
	let b;
	if (func === "lab") {
		a = tokens[1] === void 0 ? 0 : parseFloat(tokens[1]);
		b = tokens[2] === void 0 ? 0 : parseFloat(tokens[2]);
	} else {
		const C = tokens[1] === void 0 ? 0 : parseFloat(tokens[1]);
		const h = parseAngle(tokens[2], 0) * Math.PI / 180;
		a = C * Math.cos(h);
		b = C * Math.sin(h);
	}
	return formatRgb(labToRgb255(L, a, b), alpha);
}
//#endregion
//#region ../../packages/ui/src/components/ReEcharts/index.vue
var ReEcharts_default$1 = /*#__PURE__*/ _plugin_vue_export_helper_default(/* @__PURE__ */ defineComponent({
	__name: "index",
	props: {
		option: {},
		height: { default: "100%" },
		width: { default: "100%" },
		theme: { default: "light" },
		autoResize: {
			type: Boolean,
			default: true
		},
		notMerge: {
			type: Boolean,
			default: false
		}
	},
	emits: ["ready", "click"],
	setup(__props, { expose: __expose, emit: __emit }) {
		/**
		* ReEcharts —— ECharts 通用组件（精简版）
		*
		* 纯透传 option，自动从 CSS 变量注入主题色（primary/success/warning/danger/info），
		* 适配暗黑模式。ResObserver/ResizeEvent 自动 resize。
		*   <ReEcharts :option="chartOption" />
		*/
		const props = __props;
		const emit = __emit;
		const chartRef = ref(null);
		const chartInstance = shallowRef(null);
		let resizeObserver = null;
		let resizeHandler = null;
		const readCssVar = (name, fallback) => {
			if (typeof window === "undefined") return fallback;
			const root = document.documentElement;
			return getComputedStyle(root).getPropertyValue(name).trim() || fallback;
		};
		const injectTheme = (option) => {
			return {
				color: [
					readCssVar("--el-color-primary", "#409eff"),
					readCssVar("--el-color-success", "#67c23a"),
					readCssVar("--el-color-warning", "#e6a23c"),
					readCssVar("--el-color-danger", "#f56c6c"),
					readCssVar("--el-color-info", "#909399")
				].map(normalizeColor),
				textStyle: { color: props.theme === "dark" ? readCssVar("--el-text-color-primary", "#e5eaf3") : readCssVar("--el-text-color-regular", "#606266") },
				...option
			};
		};
		const init$1 = () => {
			if (!chartRef.value) return;
			chartInstance.value = init(chartRef.value, props.theme);
			chartInstance.value.setOption(injectTheme(props.option), props.notMerge);
			emit("ready", chartInstance.value);
			chartInstance.value.on("click", (params) => emit("click", params));
			if (props.autoResize) {
				resizeHandler = () => chartInstance.value?.resize();
				window.addEventListener("resize", resizeHandler);
				if (typeof ResizeObserver !== "undefined") {
					resizeObserver = new ResizeObserver(() => {
						try {
							chartInstance.value?.resize();
						} catch {}
					});
					resizeObserver.observe(chartRef.value);
				}
				setTimeout(() => chartInstance.value?.resize(), 60);
			}
		};
		const updateOption = () => {
			if (chartInstance.value) chartInstance.value.setOption(injectTheme(props.option), props.notMerge);
		};
		watch(() => props.option, () => updateOption(), { deep: true });
		watch(() => props.theme, () => {
			if (chartInstance.value) {
				chartInstance.value.dispose();
				chartInstance.value = null;
			}
			init$1();
		});
		onMounted(() => init$1());
		onBeforeUnmount(() => {
			if (resizeHandler) {
				window.removeEventListener("resize", resizeHandler);
				resizeHandler = null;
			}
			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
			}
			if (chartInstance.value) {
				chartInstance.value.dispose();
				chartInstance.value = null;
			}
		});
		__expose({
			getInstance: () => chartInstance.value,
			resize: () => chartInstance.value?.resize()
		});
		return (_ctx, _cache) => {
			return openBlock(), createElementBlock("div", {
				ref_key: "chartRef",
				ref: chartRef,
				class: "re-echarts",
				style: normalizeStyle({
					height: __props.height,
					width: __props.width
				})
			}, null, 4);
		};
	}
}), [["__scopeId", "data-v-f1f18dab"]]);
//#endregion
//#region ../../packages/ui/src/components/ReEcharts/index.ts
var plugin = { install(app) {
	app.component("ReEcharts", ReEcharts_default$1);
} };
var ReEcharts_default = ReEcharts_default$1;
//#endregion
export { ReEcharts_default as default, plugin as install };
