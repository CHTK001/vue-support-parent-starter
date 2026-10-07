<template>
  <!-- 无点 / 全是断点时不渲染：留一个空盒子会让卡片高度随数据有无跳动 -->
  <svg
    v-if="segments.length"
    class="ngx-spark"
    :style="{ '--k': `var(${token})` }"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    preserveAspectRatio="none"
    role="presentation"
  >
    <!-- 面积只是让曲线不悬空，不承载数值信息，故不参与无障碍朗读 -->
    <polygon
      v-for="(seg, i) in fills"
      :key="`f${i}`"
      class="ngx-spark-fill"
      :points="seg"
    />
    <polyline
      v-for="(seg, i) in segments"
      :key="`l${i}`"
      class="ngx-spark-line"
      :points="seg"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * KPI 卡里的迷你趋势线（sparkline）。
 *
 * <p><strong>为什么不用 ECharts</strong>：KPI 卡上的这条线只有几十像素高、没有坐标轴、
 * 不需要 tooltip，ECharts 的 init/resize/dispose 全套在这个尺寸上纯属浪费
 * （同页四张卡就是四个实例）。这里直接输出 SVG path，颜色走 CSS 令牌，
 * 亮暗主题自动跟随，连 MutationObserver 都不用挂。</p>
 *
 * <p><strong>null 是断点而不是 0</strong>：worker 重启后 nginx 计数器归零，
 * 后端把该点置 null。直接连过去会把「换了 worker」画成「流量暴跌」，
 * 所以这里按 null 切成多段折线，段与段之间不连。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 序列值；null 表示断点 */
    values: Array<number | null>;
    /** 线条颜色的 CSS 变量名（带 `--`），默认主色 */
    token?: string;
  }>(),
  { token: "--metric-cpu" },
);

/** viewBox 宽高固定，CSS 负责把它拉到卡片实际宽度 */
const WIDTH = 96;
const HEIGHT = 30;

/**
 * 降采样到固定点数。
 *
 * <p>24h 窗口可能有上千个点，逐点画进 96 单位的 viewBox 只会糊成一条锯齿；
 * 按等间隔抽样到 48 点足够看出形状，也把重排成本压到常数级。</p>
 *
 * @param values 原始序列
 * @returns 抽样后的序列（长度 ≤ max）
 */
function downsample(values: Array<number | null>, max: number): Array<number | null> {
  if (values.length <= max) {
    return values;
  }
  const step = values.length / max;
  return Array.from({ length: max }, (_, i) => values[Math.floor(i * step)]);
}

/** 有效点（排除 null），用于算极值 */
const valid = computed(() => props.values.filter((v): v is number => v != null));

/**
 * 折线段：按 null 断开后，每段输出一个 `x,y x,y ...` 串。
 *
 * @returns 每段的多边形点串
 */
const segments = computed(() => {
  const pts = downsample(props.values, 48);
  if (!pts.length) {
    return [] as string[];
  }
  const nums = pts.filter((v): v is number => v != null);
  if (!nums.length) {
    return [] as string[];
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  // 恒定序列（max === min）会让除零得到 NaN，此时画在中线
  const span = max - min || 1;
  const pad = 3;
  const usable = HEIGHT - pad * 2;
  const dx = pts.length > 1 ? WIDTH / (pts.length - 1) : 0;
  const out: string[] = [];
  let cur: string[] = [];
  pts.forEach((v, i) => {
    if (v == null) {
      if (cur.length) {
        out.push(cur.join(" "));
        cur = [];
      }
      return;
    }
    const x = (i * dx).toFixed(2);
    const y = (HEIGHT - pad - ((v - min) / span) * usable).toFixed(2);
    cur.push(`${x},${y}`);
  });
  if (cur.length) {
    out.push(cur.join(" "));
  }
  return out;
});

/**
 * 面积多边形：把每段折线补到基线。
 *
 * <p>只画折线会让线悬在卡片中间、缺少「量」的感觉；补一层 12% 的同色面积后，
 * 走势的起伏一眼可见，又不会盖住卡片文字。</p>
 */
const fills = computed(() => {
  const pts = downsample(props.values, 48);
  if (!pts.length || !pts.some(v => v != null)) {
    return [] as string[];
  }
  const nums = pts.filter((v): v is number => v != null);
  if (!nums.length) {
    return [] as string[];
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pad = 3;
  const usable = HEIGHT - pad * 2;
  const dx = pts.length > 1 ? WIDTH / (pts.length - 1) : 0;
  const out: string[] = [];
  let cur: Array<[number, number]> = [];
  const flush = () => {
    if (cur.length < 2) {
      cur = [];
      return;
    }
    const xs = cur.map(p => `${p[0]},${p[1]}`);
    out.push(`0,${HEIGHT} ${xs.join(" ")} ${cur[cur.length - 1][0]},${HEIGHT}`);
    cur = [];
  };
  pts.forEach((v, i) => {
    if (v == null) {
      flush();
      return;
    }
    cur.push([i * dx, HEIGHT - pad - ((v - min) / span) * usable]);
  });
  flush();
  return out;
});
</script>

<style scoped lang="scss">
/* 颜色只认令牌：--k 由父级传入令牌名，亮暗主题自动跟随 */
.ngx-spark {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ngx-spark-line {
  fill: none;
  stroke: var(--k);
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.ngx-spark-fill {
  fill: color-mix(in srgb, var(--k) 14%, transparent);
  stroke: none;
}
</style>