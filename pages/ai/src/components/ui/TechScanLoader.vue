<template>
  <div class="tech-scan" :class="[`tech-scan--${size}`, { 'tech-scan--inline': inline }]" role="status"
    :aria-label="text || '正在处理'">
    <!-- 双环：外环顺时针 + 内环逆时针，方向相反才有机械扫描的观感；
         圆环两端用 mask 渐隐，避免出现「被截断的半圆」那种廉价感 -->
    <div class="tech-scan__rings" aria-hidden="true">
      <span class="tech-scan__ring tech-scan__ring--outer"></span>
      <span class="tech-scan__ring tech-scan__ring--inner"></span>
      <span class="tech-scan__core"></span>
    </div>
    <!-- 扫描线：从顶部扫到底部并淡出，一次循环 1.6s；与转环节奏不同步，
         叠加起来才像设备在处理，而不是同一个动画重复两遍 -->
    <div class="tech-scan__beam" aria-hidden="true"></div>
    <span v-if="text" class="tech-scan__text">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * 科技感加载指示器。
 *
 * <p>统一人脸识别 / 以图搜图（以及后续其它图片推理页）的加载观感：
 * 双环反向旋转 + 一道扫描线。此前两页各自用 el-icon + is-spin，
 * 转一个朴素的风车图标，与「AI 视觉分析」的语境不匹配。</p>
 *
 * <p>性能上只动 transform / opacity：两者都在合成层完成，不触发
 * layout 与 paint，低端机上也不会掉帧。</p>
 */
const props = withDefaults(
  defineProps<{
    /** 提示文字；不传则只显示动画 */
    text?: string
    /** 尺寸档位 */
    size?: 'sm' | 'md' | 'lg'
    /** 内联模式：跟随文字行高排布，适合放在按钮或标签旁边 */
    inline?: boolean
  }>(),
  { text: '', size: 'md', inline: false },
)
</script>

<style scoped>
.tech-scan {
  --tech-scan-size: 44px;
  --tech-scan-ring: 2px;
  --tech-scan-color: var(--el-color-primary);
  --tech-scan-color-2: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-color-info));
  --tech-scan-glow: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.tech-scan--sm {
  --tech-scan-size: 22px;
  --tech-scan-ring: 1.5px;
  gap: 6px;
}
.tech-scan--lg {
  --tech-scan-size: 64px;
  --tech-scan-ring: 2.5px;
  gap: 14px;
}

.tech-scan--inline {
  flex-direction: row;
  gap: 8px;
}

.tech-scan__rings {
  position: relative;
  width: var(--tech-scan-size);
  height: var(--tech-scan-size);
  flex: none;
}

/* 外环：顺时针。左右两端各让出 90° 缺口，做出「扫描一段就停一下」的观感 */
.tech-scan__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: var(--tech-scan-ring) solid transparent;
  will-change: transform;
}

.tech-scan__ring--outer {
  border-top-color: var(--tech-scan-color);
  border-right-color: color-mix(in srgb, var(--tech-scan-color) 30%, transparent);
  animation: tech-scan-rotate 1.1s linear infinite;
}

.tech-scan__ring--inner {
  inset: calc(var(--tech-scan-ring) * 3);
  border-bottom-color: var(--tech-scan-color-2);
  border-left-color: color-mix(in srgb, var(--tech-scan-color-2) 30%, transparent);
  animation: tech-scan-rotate 0.8s linear infinite reverse;
}

/* 中心实心点：脉冲呼吸，脉动周期取 1.1s 与外环同频，视觉上是一体机 */
.tech-scan__core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--tech-scan-size) * 0.16);
  height: calc(var(--tech-scan-size) * 0.16);
  margin: calc(var(--tech-scan-size) * -0.08) 0 0 calc(var(--tech-scan-size) * -0.08);
  border-radius: 50%;
  background: var(--tech-scan-color);
  box-shadow: 0 0 8px var(--tech-scan-glow);
  animation: tech-scan-pulse 1.1s ease-in-out infinite;
}

/* 扫描线：一道渐隐高光，从顶部扫到底部 */
.tech-scan__beam {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 0;
  height: 45%;
  border-radius: 50%;
  background: linear-gradient(
    to bottom,
    transparent,
    color-mix(in srgb, var(--tech-scan-color) 22%, transparent)
  );
  animation: tech-scan-sweep 1.6s ease-in-out infinite;
  will-change: transform, opacity;
  pointer-events: none;
}

/* 内联模式不画扫描线（它需要相对定位的容器，inline 下没有可扫的区域） */
.tech-scan--inline .tech-scan__beam {
  display: none;
}

.tech-scan__text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.tech-scan--inline .tech-scan__text {
  font-size: inherit;
}

@keyframes tech-scan-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes tech-scan-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.55;
  }
}

@keyframes tech-scan-sweep {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(160%);
    opacity: 0;
  }
}

/* 尊重系统「减少动态效果」：环与扫描线都停住，只留中心点常亮，
   文字与静态环仍能表达「正在处理」，不会变成一片空白 */
@media (prefers-reduced-motion: reduce) {
  .tech-scan__ring,
  .tech-scan__core,
  .tech-scan__beam {
    animation: none;
  }
  .tech-scan__core {
    opacity: 0.8;
  }
  .tech-scan__beam {
    opacity: 0.35;
  }
}
</style>
