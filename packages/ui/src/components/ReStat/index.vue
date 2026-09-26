<template>
  <!-- re-surface 基类提供圆角/无边框/双层柔光/悬停上浮，与 ReStatCard 同一规格 -->
  <div class="re-stat re-surface re-surface--hover" :class="[`re-stat--${size}`, { 'is-loading': loading }]">
    <div class="re-stat__header">
      <div class="re-stat__title">
        <span v-if="icon" class="re-stat__icon" :style="{ color: iconColor }">
          <component :is="icon" />
        </span>
        <span>{{ title }}</span>
      </div>
      <div v-if="$slots.extra" class="re-stat__extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="re-stat__body">
      <ReCountup
        class="re-stat__value"
        :value="value"
        :decimals="decimals"
        :duration="duration"
        :prefix="prefix"
        :suffix="suffix"
      />
      <ReTrend
        v-if="trend !== undefined && trend !== null"
        :value="trend"
        :reverse-color="reverseTrend"
        class="re-stat__trend"
      />
    </div>
    <div v-if="description || $slots.default" class="re-stat__footer">
      <slot>
        <span class="re-stat__description">{{ description }}</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReStat —— 数据统计卡片
 *
 * 组合 ReCountup + ReTrend + 图标，用于仪表盘/概览页
 *   <ReStat title="访问量" :value="12345" :trend="12.5" />
 */
import type { Component } from "vue";
import ReCountup from "../ReCountup/index.vue";
import ReTrend from "../ReTrend";
// 卡片视觉基线（库级共享，与 ReStatCard 同一规格）
import "../shared/re-surface.css";

interface Props {
  /** 标题 */
  title: string;
  /** 数值 */
  value: number;
  /** 小数位数 */
  decimals?: number;
  /** 数字动画时长 */
  duration?: number;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 趋势百分比（正值上涨，负值下跌） */
  trend?: number;
  /** 趋势颜色反转（金融场景：下跌用绿色） */
  reverseTrend?: boolean;
  /** 描述文字 */
  description?: string;
  /** 图标组件 */
  icon?: Component;
  /** 图标颜色 */
  iconColor?: string;
  /** 尺寸 */
  size?: "small" | "default" | "large";
  /** 加载状态 */
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  decimals: 0,
  duration: 1500,
  reverseTrend: false,
  size: "default",
  loading: false,
});
</script>

<style scoped>
/* 卡片视觉（圆角/边框/投影/悬停）来自库级基线 components/shared/re-surface.css，
   此处只保留本组件独有的排版与尺寸变体，不再各写一套边框+投影。 */
.re-stat {
  /* 内距按 size 变体覆写（基线默认 16px 18px） */
  padding: var(--re-surface-padding);
}

.re-stat.is-loading {
  pointer-events: none;
  opacity: 0.6;
}

.re-stat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.re-stat__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.re-stat__icon {
  display: inline-flex;
  font-size: 16px;
}

.re-stat__body {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.re-stat__value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.re-stat__trend {
  flex-shrink: 0;
}

.re-stat__footer {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.re-stat__description {
  color: var(--el-text-color-placeholder);
}

.re-stat--small {
  padding: 12px;
}

.re-stat--small .re-stat__value {
  font-size: 20px;
}

.re-stat--large {
  padding: 24px;
}

.re-stat--large .re-stat__value {
  font-size: 36px;
}
</style>
