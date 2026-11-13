<script setup lang="ts">
/**
 * ReChart 上下文窗口「画法切换」图标。
 *
 * 需求 4.5：ReChart 此前只有 ViewPane.icon 这个「由调用方自己传组件」的口子，
 * 内置的上下文窗口切换按钮却是纯文字「面积图 / 点阵图」，与截图里的双图标
 * 按钮不一致。这里补一枚可复用的图标组件，由 ReChart 导出，面板与宿主都能用。
 *
 * 只用 currentColor + 主题令牌，不写死颜色；两种形状分别是
 * treemap（大小不等的矩形）与 grid（等大方格）。
 */
withDefaults(defineProps<{
  /** area = 上下文地图（treemap）；grid / dots = 方格（点阵） */
  mode?: 'area' | 'grid' | 'dots';
  size?: number | string;
}>(), { mode: 'area', size: 16 });
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 16 16" fill="none" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg">
    <template v-if="mode === 'area'">
      <rect x="1" y="1" width="6.5" height="8.5" rx="1" fill="currentColor" opacity=".55" />
      <rect x="8.5" y="1" width="6.5" height="4" rx="1" fill="currentColor" opacity=".55" />
      <rect x="8.5" y="6" width="3" height="3.5" rx="1" fill="currentColor" opacity=".55" />
      <rect x="12.5" y="6" width="2.5" height="3.5" rx="1" fill="currentColor" opacity=".55" />
      <rect x="1" y="10.5" width="6.5" height="4.5" rx="1" fill="currentColor" opacity=".55" />
      <rect x="8.5" y="10.5" width="6.5" height="4.5" rx="1" fill="currentColor" opacity=".28"
        stroke="currentColor" stroke-dasharray="1.5 1.5" />
    </template>
    <template v-else>
      <g fill="currentColor" opacity=".55">
        <rect x="1" y="1" width="3" height="3" rx=".7" />
        <rect x="5" y="1" width="3" height="3" rx=".7" />
        <rect x="9" y="1" width="3" height="3" rx=".7" />
        <rect x="13" y="1" width="2" height="3" rx=".7" />
        <rect x="1" y="5" width="3" height="3" rx=".7" />
        <rect x="5" y="5" width="3" height="3" rx=".7" />
        <rect x="9" y="5" width="3" height="3" rx=".7" />
        <rect x="13" y="5" width="2" height="3" rx=".7" />
        <rect x="1" y="9" width="3" height="3" rx=".7" />
        <rect x="5" y="9" width="3" height="3" rx=".7" />
        <rect x="9" y="9" width="3" height="3" rx=".7" />
        <rect x="13" y="9" width="2" height="3" rx=".7" />
        <rect x="1" y="13" width="3" height="2" rx=".7" />
        <rect x="5" y="13" width="3" height="2" rx=".7" />
        <rect x="9" y="13" width="3" height="2" rx=".7" />
        <rect x="13" y="13" width="2" height="2" rx=".7" />
      </g>
      <g fill="currentColor" opacity=".2">
        <rect x="9" y="9" width="3" height="3" rx=".7" />
        <rect x="13" y="9" width="2" height="3" rx=".7" />
        <rect x="1" y="13" width="3" height="2" rx=".7" />
        <rect x="5" y="13" width="3" height="2" rx=".7" />
        <rect x="9" y="13" width="3" height="2" rx=".7" />
        <rect x="13" y="13" width="2" height="2" rx=".7" />
      </g>
    </template>
  </svg>
</template>
