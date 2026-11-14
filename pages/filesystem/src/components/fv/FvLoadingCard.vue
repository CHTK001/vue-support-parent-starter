/**
 * 统一的「正在解析」加载卡片（纯 CSS 动效，无依赖）。
 *
 * <p>设计来源：file-viewer 内置的解析浮层（绿底虚线圆环 + 环绕圆点 + 发光晕影），
 * 但那是渲染器自己的实现，长尾面板（Arrow / Feather / 文本 / 设计稿…）拿不到。
 * 这里用同样的语言做一份公共组件，让所有自研面板的加载态长得一致。</p>
 *
 * <p>三层结构：</p>
 * <ol>
 *   <li>虚线圆环：{@code stroke-dasharray} + 匀速旋转，2.4s 一圈；</li>
 *   <li>两个实心点：绕圆环反向慢转，形成「扫描」感；</li>
 *   <li>背后径向渐变晕影：呼吸式缩放，暗示进程活着。</li>
 * </ol>
 *
 * <p>动画全部走 {@code transform} / {@code opacity}（合成层），不触发重排；
 * {@code prefers-reduced-motion} 下整体停帧，只保留静态圆环。</p>
 */
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 角标文字（扩展名，如 TXT / ARROW / DOCX） */
    badge?: string;
    /** 主标题 */
    title?: string;
    /** 副标题（可空） */
    desc?: string;
    /** 角标配色主题：默认跟随主色 */
    tone?: "primary" | "success" | "warning";
  }>(),
  {
    badge: "",
    title: "正在解析文件内容…",
    desc: "正在整理内容结构并生成预览。",
    tone: "primary",
  },
);

/** 角标文字（超长截断到 6 个字符，避免把圆环撑开） */
const badgeText = computed(() => (props.badge || "").trim().slice(0, 6).toUpperCase());
</script>

<template>
  <div class="fv-loading" :class="`fv-loading--${tone}`" role="status" aria-live="polite">
    <div class="fv-loading__card">
      <div class="fv-loading__glyph">
        <span class="fv-loading__glow" aria-hidden="true" />
        <span class="fv-loading__ring" aria-hidden="true" />
        <span class="fv-loading__dot fv-loading__dot--a" aria-hidden="true" />
        <span class="fv-loading__dot fv-loading__dot--b" aria-hidden="true" />
        <svg class="fv-loading__file" viewBox="0 0 32 40" aria-hidden="true">
          <path
            d="M4 1h16l8 8v30H4z"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M20 1v8h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M9 20h14M9 25h14M9 30h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span v-if="badgeText" class="fv-loading__badge">{{ badgeText }}</span>
      </div>
      <div class="fv-loading__text">
        <p class="fv-loading__eyebrow">文件内容</p>
        <p class="fv-loading__title">{{ title }}</p>
        <p v-if="desc" class="fv-loading__desc">{{ desc }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fv-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  /* 主色用 CSS 变量，主题切换自动跟随 */
  --fv-accent: var(--el-color-primary, #409eff);
  --fv-accent-soft: color-mix(in srgb, var(--fv-accent) 14%, transparent);
  --fv-accent-line: color-mix(in srgb, var(--fv-accent) 55%, transparent);
}

.fv-loading--success {
  --fv-accent: var(--el-color-success, #67c23a);
}

.fv-loading--warning {
  --fv-accent: var(--el-color-warning, #e6a23c);
}

.fv-loading__card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 28px;
  min-width: 320px;
  max-width: 460px;
  border-radius: 14px;
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 6px 24px color-mix(in srgb, var(--el-color-info, #909399) 16%, transparent);
  /* 顶部一道主色高光，呼应渲染器自带浮层 */
  border-top: 2px solid transparent;
  border-image: linear-gradient(90deg, transparent, var(--fv-accent), transparent) 1;
}

.fv-loading__glyph {
  position: relative;
  flex: none;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fv-accent);
}

.fv-loading__glow {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--fv-accent-soft) 0%, transparent 70%);
  animation: fv-breathe 2.4s ease-in-out infinite;
}

.fv-loading__ring {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 1.5px dashed var(--fv-accent-line);
  animation: fv-spin 2.4s linear infinite;
}

.fv-loading__dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--fv-accent);
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
}

.fv-loading__dot--a {
  animation: fv-orbit 3.6s linear infinite;
}

.fv-loading__dot--b {
  animation: fv-orbit 3.6s linear infinite;
  animation-delay: -1.8s;
}

.fv-loading__file {
  width: 30px;
  height: 38px;
}

.fv-loading__badge {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 5px;
  border-radius: 4px;
  background: var(--fv-accent);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 14px;
}

.fv-loading__text {
  min-width: 0;
}

.fv-loading__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--fv-accent);
}

.fv-loading__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
}

.fv-loading__desc {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

@keyframes fv-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fv-orbit {
  from {
    transform: rotate(0deg) translateX(34px) translate(-50%, -50%);
  }
  to {
    transform: rotate(360deg) translateX(34px) translate(-50%, -50%);
  }
}

@keyframes fv-breathe {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fv-loading__ring,
  .fv-loading__dot,
  .fv-loading__glow {
    animation: none;
  }
}
</style>
