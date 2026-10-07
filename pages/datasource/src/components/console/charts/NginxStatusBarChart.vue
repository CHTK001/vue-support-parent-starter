<template>
  <div ref="el" class="ngx-echart" :style="{ height: `${height}px` }" />
</template>

<script setup lang="ts">
/**
 * 访问日志状态码分布（ECharts 横向条形图）。
 *
 * <p><strong>为什么用条形而不是饼图</strong>：这里要读的是「2xx 占九成、5xx 占 0.1%」
 * 这种量级差异。饼图里 0.1% 的扇区肉眼不可见，而横条按比例画长度，
 * 再配合右侧数值标注，小占比也读得出来。</p>
 *
 * <p><strong>按 hits 而不是 pct 画长度</strong>：后端已算好 `pct`（占已解析行数），
 * 直接用即可；x 轴设成 `max: 100` 让「占比」这个语义在轴上直接可见，
 * 不用再让用户心算条长和满格的比例。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import type { NginxTopStatus } from "../../../api/nginx/api";
import { token, useEchart } from "./useEchart";

const props = withDefaults(
  defineProps<{
    /** 状态码类别条目 */
    items: NginxTopStatus[];
    /** 画布高度（px） */
    height?: number;
  }>(),
  { height: 132 },
);

/**
 * 类别 → 令牌名。
 *
 * <p>走状态令牌而不是固定色：亮暗主题下各自有对应色，硬编码会让暗色下这行刺眼。</p>
 */
function tokenOf(category: string): string {
  if (category.startsWith("2")) {
    return "--status-success";
  }
  if (category.startsWith("3")) {
    return "--metric-cpu";
  }
  if (category.startsWith("4")) {
    return "--status-warning";
  }
  if (category.startsWith("5")) {
    return "--status-error";
  }
  return "--el-text-color-secondary";
}

const el = ref<HTMLElement | null>(null);
const elRef = computed(() => el.value);

const build = (): EChartsOption => {
  const axisColor = token("--el-text-color-secondary");
  const splitColor = token("--el-border-color-lighter");

  // 倒序：ECharts 类目轴自下而上排，反过来让 2xx 落在顶部，符合阅读顺序
  const cats = props.items.map(i => i.category).reverse();
  const values = props.items.map(i => i.pct).reverse();
  const hits = props.items.map(i => i.hits).reverse();
  const colors = props.items.map(i => token(tokenOf(i.category))).reverse();

  return {
    grid: { top: 6, right: 52, bottom: 4, left: 4, containLabel: true },
    tooltip: {
      trigger: "item",
      backgroundColor: token("--el-bg-color-overlay") || token("--el-bg-color"),
      borderColor: splitColor,
      textStyle: { color: token("--el-text-color-primary") || token("--text-primary"), fontSize: 12 },
      formatter: (p: unknown) => {
        const it = p as { dataIndex: number };
        const name = cats[it.dataIndex];
        return `${name}：<b>${values[it.dataIndex]}%</b>（${hits[it.dataIndex]} 次）`;
      },
    },
    xAxis: {
      type: "value",
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: cats,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: axisColor, fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
        barWidth: 10,
        // 极小占比也要留一丝可见宽度，否则「有 1 次 5xx」和「没有 5xx」看起来一样
        itemStyle: { borderRadius: 3 },
        label: {
          show: true,
          position: "right",
          distance: 6,
          color: axisColor,
          fontSize: 11,
          formatter: (p: unknown) => `${(p as { value: number }).value}%`,
        },
      },
    ],
  };
};

const { render } = useEchart(elRef, build);

watch(() => [props.items, props.height], render, { deep: true });
</script>

<style scoped lang="scss">
.ngx-echart {
  width: 100%;
  min-height: 60px;
}
</style>
