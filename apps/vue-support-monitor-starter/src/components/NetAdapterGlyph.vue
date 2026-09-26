<template>
  <!-- 网卡类型小图标：颜色由父级 currentColor 决定（在线主色 / 离线禁用色） -->
  <svg
    viewBox="0 0 48 48"
    :width="size"
    :height="size"
    aria-hidden="true"
  >
    <!-- 以太网：RJ45 水晶头（线缆 + 卡扣 + 8 触点） -->
    <template v-if="kind === 'ethernet'">
      <path d="M24 3 V10" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" />
      <path d="M15 12 l-2.6 -5 h23.2 L33 12" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" />
      <rect x="13" y="10" width="22" height="19" rx="2.6" fill="currentColor" opacity="0.12"
        stroke="currentColor" stroke-width="2" />
      <rect x="11.5" y="26" width="25" height="10" rx="2" fill="currentColor" opacity="0.22"
        stroke="currentColor" stroke-width="2" />
      <!-- 8 个金属触点 -->
      <g stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
        <line x1="15" y1="28.4" x2="15" y2="33.6" />
        <line x1="17.9" y1="28.4" x2="17.9" y2="33.6" />
        <line x1="20.7" y1="28.4" x2="20.7" y2="33.6" />
        <line x1="23.6" y1="28.4" x2="23.6" y2="33.6" />
        <line x1="26.4" y1="28.4" x2="26.4" y2="33.6" />
        <line x1="29.3" y1="28.4" x2="29.3" y2="33.6" />
        <line x1="32.1" y1="28.4" x2="32.1" y2="33.6" />
        <line x1="35" y1="28.4" x2="35" y2="33.6" />
      </g>
    </template>

    <!-- Wi-Fi：圆点 + 三条弧线 -->
    <template v-else-if="kind === 'wifi'">
      <path d="M6.5 16 a25 25 0 0 1 35 0" fill="none" stroke="currentColor" stroke-width="2.6"
        stroke-linecap="round" />
      <path d="M11.5 22 a18 18 0 0 1 25 0" fill="none" stroke="currentColor" stroke-width="2.6"
        stroke-linecap="round" />
      <path d="M16.5 28 a11 11 0 0 1 15 0" fill="none" stroke="currentColor" stroke-width="2.6"
        stroke-linecap="round" />
      <circle cx="24" cy="35" r="3.2" fill="currentColor" />
    </template>

    <!-- 回环 / 虚拟网卡：环形箭头 -->
    <template v-else>
      <path d="M14 26 a10 10 0 1 1 2.6 7.4" fill="none" stroke="currentColor" stroke-width="2.6"
        stroke-linecap="round" />
      <path d="M12 27 l2.4 6.2 6 -2.8" fill="none" stroke="currentColor" stroke-width="2.6"
        stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<script setup lang="ts">
/**
 * 网卡类型图标。
 *
 * <p>统一替代原先「板卡 + 锯齿」在小尺寸下像通用图片占位符的内联 SVG：
 * 以太网显示 RJ45 水晶头、无线显示 Wi-Fi 弧线、回环显示环形箭头。</p>
 */
defineOptions({ name: "NetAdapterGlyph" });

withDefaults(
  defineProps<{
    /** 网卡类型：ethernet / wifi / loopback */
    kind?: "ethernet" | "wifi" | "loopback";
    /** 像素尺寸 */
    size?: number;
  }>(),
  { kind: "ethernet", size: 26 }
);
</script>
