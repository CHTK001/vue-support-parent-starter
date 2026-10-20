<template>
  <div class="tech-loading" role="status" aria-label="加载中">
    <div class="tech-loading-core">
      <span class="tech-loading-ring tech-loading-ring--outer" />
      <span class="tech-loading-ring tech-loading-ring--inner" />
      <span class="tech-loading-dot" />
    </div>
    <div class="tech-loading-beam">
      <span class="tech-loading-beam-scan" />
    </div>
    <p v-if="text" class="tech-loading-text">{{ text }}</p>
    <div v-if="subtext" class="tech-loading-caption">{{ subtext }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 科技感加载动画：用于人脸识别 / 以图搜图的结果浮层。
 *
 * <p>由三部分组成：旋转扫描环（外环+内环+中心点）、窗口扫描光束、底部脉冲文字。
 * 纯 CSS 实现，不依赖额外图标；配色走 CSS 变量，可在图片遮罩上保持高对比。</p>
 */
withDefaults(defineProps<{
  text?: string
  subtext?: string
  /** 遮罩场景下让主色显眼（默认高亮青蓝） */
  accent?: string
}>(), {
  text: '处理中…',
  subtext: '',
  accent: 'var(--el-color-primary)',
})
</script>

<style scoped>
.tech-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-family: var(--el-font-family, inherit);
}
.tech-loading-core {
  position: relative;
  width: 62px;
  height: 62px;
}
.tech-loading-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid transparent;
}
.tech-loading-ring--outer {
  inset: 2px;
  border-top-color: v-bind(accent);
  border-right-color: color-mix(in srgb, v-bind(accent) 45%, transparent);
  animation: tech-spin 1.1s cubic-bezier(0.55, 0, 0.2, 1) infinite;
}
.tech-loading-ring--inner {
  inset: 15px;
  border-bottom-color: v-bind(accent);
  border-left-color: color-mix(in srgb, v-bind(accent) 40%, transparent);
  animation: tech-spin-rev 0.85s linear infinite;
}
.tech-loading-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: v-bind(accent);
  box-shadow: 0 0 14px 2px color-mix(in srgb, v-bind(accent) 75%, transparent);
  animation: tech-pulse 1.2s ease-in-out infinite;
}
.tech-loading-beam {
  position: relative;
  width: 130px;
  height: 3px;
  border-radius: 999px;
  background: color-mix(in srgb, v-bind(accent) 18%, transparent);
  overflow: hidden;
}
.tech-loading-beam-scan {
  position: absolute;
  top: 0;
  left: -35%;
  width: 35%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, v-bind(accent), transparent);
  animation: tech-scan 1.25s ease-in-out infinite;
}
.tech-loading-text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: inherit;
  animation: tech-text 1.8s ease-in-out infinite;
}
.tech-loading-caption {
  font-size: 11.5px;
  letter-spacing: 0.06em;
  opacity: 0.7;
  color: inherit;
}
@keyframes tech-spin {
  to { transform: rotate(360deg); }
}
@keyframes tech-spin-rev {
  to { transform: rotate(-360deg); }
}
@keyframes tech-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.65; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}
@keyframes tech-scan {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(280%); }
}
@keyframes tech-text {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .tech-loading-ring,
  .tech-loading-dot,
  .tech-loading-beam-scan,
  .tech-loading-text {
    animation-duration: 2.8s;
  }
}
</style>