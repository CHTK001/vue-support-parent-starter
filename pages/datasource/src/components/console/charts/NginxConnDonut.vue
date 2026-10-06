<template>
  <div class="ngx-donut">
    <div ref="el" class="ngx-echart" :style="{ height: `${height}px` }" />
    <!-- 圆心用真实 DOM 叠上去而不是 ECharts graphic：
         文本是浏览器渲染的，暗色下抗锯齿正常；且直接吃 CSS 令牌，
         不必为了取色去 getComputedStyle 读一遍再回填到 canvas。 -->
    <div class="ngx-donut-center">
      <b class="ngx-donut-value" :class="{ 'is-zero': total === 0 }">{{ total }}</b>
      <span class="ngx-donut-label">{{ total > 0 ? "活跃连接" : "无活跃连接" }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Nginx 连接状态分布（ECharts 环形图）。
 *
 * <p><strong>为什么环形而不是分段横条</strong>：三种状态是「一个整体的互斥拆分」，
 * 环形能直接把总量和占比同时画出来——圆心放活跃连接总数，环上放三段比例。
 * 原来的 flex 分段条在三者都接近 0 时会退化成三条看不见的 0.001 细线。</p>
 *
 * <p><strong>全 0 的处理</strong>：总活跃连接为 0 是完全正常的状态（空闲实例），
 * 但空环画出来是一片空白，与「数据没取到」无法区分。所以补一整圈中性色的 100% 环，
 * 圆心写「无活跃连接」，让用户一眼看出是「确实没有连接」而不是图挂了。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, ref, watch } from "vue";
import type { EChartsOption } from "echarts";
import { token, useEchart } from "./useEchart";

const props = withDefaults(
  defineProps<{
    /** 正在读取请求头 */
    reading?: number | null;
    /** 正在处理请求 / 返回响应 */
    writing?: number | null;
    /** 空闲等待中 */
    waiting?: number | null;
    /** 画布高度（px） */
    height?: number;
  }>(),
  { reading: 0, writing: 0, waiting: 0, height: 148 },
);

const el = ref<HTMLElement | null>(null);
const elRef = computed(() => el.value);

/** 三段明细，null 归 0：stub_status 缺字段时报「0」比报「—」更贴近真实（确实没有该状态连接） */
const parts = computed(() => [
  { key: "reading", label: "读取", value: Math.max(props.reading ?? 0, 0), token: "--metric-cpu" },
  { key: "writing", label: "处理", value: Math.max(props.writing ?? 0, 0), token: "--status-success" },
  { key: "waiting", label: "等待", value: Math.max(props.waiting ?? 0, 0), token: "--el-color-warning" },
]);

/** 活跃连接总数 = 圆心数字 */
const total = computed(() => parts.value.reduce((sum, p) => sum + p.value, 0));

const build = (): EChartsOption => {
  const subColor = token("--el-text-color-secondary");
  const emptyColor = token("--el-border-color-lighter");

  const data = total.value > 0
    ? parts.value.map(p => ({
        value: p.value,
        name: p.label,
        itemStyle: { color: token(p.token) },
      }))
    : [{ value: 1, name: "无活跃连接", itemStyle: { color: emptyColor } }];

  return {
    tooltip: {
      trigger: "item",
      backgroundColor: token("--el-bg-color-overlay") || token("--el-bg-color"),
      borderColor: token("--el-border-color-lighter"),
      textStyle: { color: token("--el-text-color-primary") || token("--text-primary"), fontSize: 12 },
      formatter: (p: unknown) => {
        const it = p as { name: string; value: number; percent: number };
        if (total.value === 0) {
          return "当前无活跃连接";
        }
        return `${it.name}：<b>${it.value}</b>（${it.percent}%）`;
      },
    },
    series: [
      {
        type: "pie",
        // 内圈留空给圆心文字；中心稍微上移，给下方的「活跃连接」标签腾位置
        radius: ["64%", "84%"],
        center: ["50%", "46%"],
        avoidLabelOverlap: true,
        // 环太薄时标签会挤成一团，收进环内
        label: {
          show: total.value > 0,
          position: "inside",
          color: "#fff",
          fontSize: 11,
          formatter: (p: unknown) => `${(p as { name: string }).name}\n${(p as { value: number }).value}`,
        },
        labelLine: { show: false },
        itemStyle: { borderWidth: 0 },
        emphasis: { scale: true, scaleSize: 4 },
        data,
      },
    ],
    // 圆心区域盖住 tooltip 的触发面会挡住悬浮，这里整体不响应鼠标，
    // 由外层 .ngx-donut-center 的 pointer-events: none 实现
    silent: true,
    // 环形图没有坐标轴，关掉动画避免首帧环从 0 扫一圈
    animationDuration: 420,
    // 空态环是装饰，扫出来没有信息量
    ...(total.value > 0 ? {} : { color: [emptyColor, subColor] }),
  };
};

const { render } = useEchart(elRef, build);

watch(() => [props.reading, props.writing, props.waiting, props.height], render);
</script>

<style scoped lang="scss">
.ngx-donut {
  position: relative;
}

.ngx-echart {
  width: 100%;
  min-height: 80px;
}

.ngx-donut-center {
  position: absolute;
  /* 环心在 50% / 46%，标题在环心下方 11px；这里用 flex 一次居中到位，
     免得两行文字各自算 top 出现错位 */
  top: 46%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;

  /* 必须放行鼠标：否则圆心这几十像素的方块会把环上的 tooltip 触发区吃掉 */
  pointer-events: none;
  line-height: 1.1;
}

.ngx-donut-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary));
  font-variant-numeric: tabular-nums;

  &.is-zero {
    /* 0 是正常状态（空闲实例），不该和「有连接」一样醒目 */
    color: var(--el-text-color-secondary);
  }
}

.ngx-donut-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>
