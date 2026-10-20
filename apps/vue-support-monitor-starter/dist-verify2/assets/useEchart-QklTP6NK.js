import { Ht as watch, ct as onMounted, it as onBeforeUnmount, xn as shallowRef } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { D as init } from "./echarts-compat-C1tiQKE2.js";
//#region ../../pages/datasource/src/components/console/charts/useEchart.ts
/**
* ECharts 集成通用逻辑（init / resize / 主题切换 / 释放 / 令牌取色）。
*
* <p>抽出来是因为 nginx 控制台要画三张图，逐个复制 init-resize-dispose 只会
* 出现「三处各漏一处 dispose」这种只在切页时累积的内存泄漏。</p>
*
* <p><strong>为什么必须运行时取色</strong>：ECharts 的 canvas 绘图不认识
* {@code var(--el-color-primary)}，它要的是解析后的颜色串。而本项目禁止写死色值，
* 所以只能从计算样式里把令牌读出来。令牌随亮暗主题变化，故每次重绘都重新读，
* 不能只读一次存成常量。</p>
*
* @author CH
* @since 4.0.0
*/
/** 令牌 → 回退色。回退只在令牌缺失（如单测无 DOM）时生效，正常运行读的是令牌值。
*  koi 令牌为主；el 键保留给仍按 Element 变量取色的历史调用方。 */
var FALLBACK = {
	"--brand-500": "#6d5dfc",
	"--brand-400": "#8f83fd",
	"--status-success": "#2fbf71",
	"--status-warning": "#f59e0b",
	"--status-error": "#ff4c4c",
	"--border-subtle": "#eef0f6",
	"--text-primary": "#303133",
	"--text-secondary": "#5c6270",
	"--text-tertiary": "#909399",
	"--bg-container": "#ffffff",
	"--bg-elevated": "#fbfbff",
	"--bg-fill": "#f5f7fa",
	"--metric-cpu": "#3b82f6",
	"--metric-mem": "#8b5cf6",
	"--metric-net": "#06b6d4",
	"--metric-jvm": "#14b8a6",
	"--metric-disk": "#f59e0b",
	"--metric-db": "#0ea5e9",
	"--el-color-primary": "#409eff",
	"--el-color-success": "#67c23a",
	"--el-color-warning": "#e6a23c",
	"--el-color-danger": "#f56c6c",
	"--el-color-info": "#909399",
	"--el-border-color-lighter": "#ebeef5",
	"--el-text-color-secondary": "#909399",
	"--el-text-color-regular": "#606266",
	"--el-bg-color": "#ffffff",
	"--el-bg-color-overlay": "#ffffff",
	"--el-color-white": "#ffffff"
};
/**
* 读取一个 CSS 变量的当前值。
*
* @param token 变量名（带 `--`）
* @returns 解析后的颜色串；令牌不存在时返回回退色
*/
function token(token) {
	if (typeof window === "undefined" || typeof document === "undefined") return FALLBACK[token] ?? "#888888";
	return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || (FALLBACK[token] ?? "#888888");
}
/**
* URL 趋势各序列的取色令牌。
*
* <p>刻意不用色板里的相邻色：那组（--metric-cpu / --status-success 等）是为了
* 「同一张图里 2~3 条粗线」设计的，URL 最多 10 条，相邻色会分不清。
* 这里用一组在浅色与深色下都能互相区分的语义色，并按序号取用、超出长度就循环。</p>
*/
var URL_TREND_COLORS = [
	"--brand-500",
	"--status-warning",
	"--status-success",
	"--status-error",
	"--metric-cpu",
	"--metric-mem",
	"--metric-net",
	"--metric-jvm",
	"--metric-disk",
	"--metric-db"
];
/**
* 初始化一张图表，并在主题切换 / 窗口缩放时自动重绘。
*
* @param elRef  容器 ref
* @param build  配置工厂，每次重绘都重新调用（这样令牌与新数据都取到最新值）
* @returns 图表句柄
*/
function useEchart(elRef, build) {
	/**
	* 图表实例。
	*
	* <p>用 `shallowRef` 而不是 `ref`：`ref` 会对值做深层解包（`UnwrapRef`），
	* 而 `ECharts` 是带私有字段的类，解包后类型被拆散，赋回去就报
	* 「missing _ssr / _zr / _dom / _model and 26 more」。图表实例是外部对象，
	* 本来就不该被深层响应式代理。</p>
	*/
	const chart = shallowRef(null);
	let observer = null;
	let ro = null;
	const render = () => {
		if (!chart.value) return;
		chart.value.setOption(build(), true);
	};
	/** 容器尺寸观察：容器换了节点必须重挂，只看旧节点等于失明 */
	const attachRo = (el) => {
		ro?.disconnect();
		ro = null;
		if (el && typeof ResizeObserver !== "undefined") {
			ro = new ResizeObserver(() => chart.value?.resize());
			ro.observe(el);
		}
	};
	/**
	* （重）建立图表实例。
	*
	* <p>为什么不能只在 onMounted 里 init：容器若是 {@code v-if} 控制（查询面板
	* 切到「范围」模式才出现），挂载时 ref 还是 null，之后元素出现不会再有钩子
	* 通知——图表就永远建不起来。这里补上：ref 变化时按需 init；元素被 v-if
	* 卸载/替换时旧实例绑在已移除的节点上，必须 dispose 重建。</p>
	*/
	const ensureChart = (el) => {
		if (el) {
			if (!chart.value || chart.value.getDom() !== el) {
				chart.value?.dispose();
				chart.value = init(el);
				attachRo(el);
				render();
			}
			return;
		}
		chart.value?.dispose();
		chart.value = null;
		attachRo(null);
	};
	watch(elRef, ensureChart);
	onMounted(() => {
		ensureChart(elRef.value);
		observer = new MutationObserver(render);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"]
		});
		window.addEventListener("resize", render);
	});
	onBeforeUnmount(() => {
		window.removeEventListener("resize", render);
		observer?.disconnect();
		ro?.disconnect();
		chart.value?.dispose();
		chart.value = null;
	});
	return {
		chart,
		render
	};
}
//#endregion
export { token as n, useEchart as r, URL_TREND_COLORS as t };
