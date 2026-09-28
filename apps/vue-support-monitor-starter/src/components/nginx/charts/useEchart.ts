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
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import * as echarts from "echarts";

/** 令牌 → 回退色。回退只在令牌缺失（如单测无 DOM）时生效，正常运行读的是令牌值。 */
const FALLBACK: Record<string, string> = {
  "--el-color-primary": "#409eff",
  "--el-color-success": "#67c23a",
  "--el-color-warning": "#e6a23c",
  "--el-color-danger": "#f56c6c",
  "--el-color-info": "#909399",
  "--el-border-color-lighter": "#ebeef5",
  "--el-text-color-secondary": "#909399",
  "--el-text-color-regular": "#606266",
  "--el-bg-color": "#ffffff",
  "--text-primary": "#303133",
  "--text-tertiary": "#909399",
};

/**
 * 读取一个 CSS 变量的当前值。
 *
 * @param token 变量名（带 `--`）
 * @returns 解析后的颜色串；令牌不存在时返回回退色
 */
export function token(token: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return FALLBACK[token] ?? "#888888";
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(token);
  const trimmed = v.trim();
  return trimmed || FALLBACK[token] ?? "#888888";
}

/** 是否深色主题 */
export function isDark(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/** 图表实例的持有者，交给 `useEchart` 统一管理生命周期 */
export type ChartRef = Ref<HTMLElement | undefined> | Ref<HTMLElement | null>;

/** `useEchart` 的返回值 */
export interface EchartHandle {
  /** 图表实例，未挂载/已销毁为 null */
  chart: Ref<echarts.ECharts | null>;
  /** 主动重绘（数据或图例变化后调用） */
  render: () => void;
}

/**
 * 初始化一张图表，并在主题切换 / 窗口缩放时自动重绘。
 *
 * @param elRef  容器 ref
 * @param build  配置工厂，每次重绘都重新调用（这样令牌与新数据都取到最新值）
 * @returns 图表句柄
 */
export function useEchart(elRef: ChartRef, build: () => echarts.EChartsOption): EchartHandle {
  const chart = ref<echarts.ECharts | null>(null);
  let observer: MutationObserver | null = null;
  let ro: ResizeObserver | null = null;

  const render = (): void => {
    if (!chart.value) {
      return;
    }
    // notMerge=true：序列条数会随图例开关变化，合并会让已关闭的序列残留
    chart.value.setOption(build(), true);
  };

  onMounted(() => {
    if (elRef.value) {
      chart.value = echarts.init(elRef.value);
      render();
    }
    // 主题切换：令牌变了必须重建 option，否则暗色下画布还是亮色的坐标轴
    observer = new MutationObserver(render);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", render);
    // 容器自身尺寸变化（侧栏折叠、栅格换行）不会触发 window resize
    if (elRef.value && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => chart.value?.resize());
      ro.observe(elRef.value);
    }
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", render);
    observer?.disconnect();
    ro?.disconnect();
    chart.value?.dispose();
    chart.value = null;
  });

  return { chart, render };
}

/**
 * 按容器实际像素宽度决定 X 轴标签密度。
 *
 * <p>24h 趋势有近 3000 个点，标签全画会糊成一片；ECharts 的 `hideOverlap`
 * 只能去重不能保证可读，这里直接按宽度算间隔。</p>
 *
 * @param count 数据点数量
 * @param widthPx 容器宽度（px）
 * @returns axisLabel 的 interval
 */
export function labelInterval(count: number, widthPx: number): number {
  const slot = 78;
  const fit = Math.max(1, Math.floor(widthPx / slot));
  return Math.max(0, Math.ceil(count / fit) - 1);
}
