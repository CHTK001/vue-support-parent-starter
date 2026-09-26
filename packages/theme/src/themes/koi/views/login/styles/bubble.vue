<template>
  <div class="login-page login-bubble">
    <!-- 极光底色：三层柔光叠加，营造空气感 -->
    <div class="bb-bg" aria-hidden="true"></div>

    <!-- 大光斑（bokeh）：慢速漂移，提供景深 -->
    <div class="bb-orbs" aria-hidden="true">
      <span v-for="o in orbs" :key="o.id" class="bb-orb" :class="`bb-orb--${o.id}`"></span>
    </div>

    <!-- 上升气泡：由数据驱动，尺寸/速度/透明度各异，避免机械重复 -->
    <div class="bb-bubbles" aria-hidden="true">
      <span
        v-for="b in bubbles"
        :key="b.id"
        class="bb-bubble"
        :style="{
          left: `${b.left}%`,
          width: `${b.size}px`,
          height: `${b.size}px`,
          opacity: b.opacity,
          animationDuration: `${b.duration}s`,
          animationDelay: `${b.delay}s`,
          '--bb-drift': `${b.drift}px`,
        }"
      ></span>
    </div>

    <main class="bb-shell">
      <!-- 品牌区：标题只此一处，表单内部标题已通过 show-header=false 关闭 -->
      <header class="bb-brand">
        <div class="bb-brand-mark">
          <img class="bb-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
        </div>
        <h1 class="bb-title">{{ translateConfigText(loginConfig.title) }}</h1>
        <p class="bb-desc">{{ translateConfigText(loginConfig.description) }}</p>

        <ul v-if="tags.length" class="bb-tags">
          <li v-for="tag in tags" :key="tag.text" class="bb-tag">
            <el-icon :size="13"><component :is="tag.icon" /></el-icon>
            <span>{{ translateConfigText(tag.text) }}</span>
          </li>
        </ul>
      </header>

      <!-- 表单卡片：毛玻璃 + 顶部渐变高光边 -->
      <section class="bb-card">
        <ReLoginForm :show-mobile-brand="false" :show-header="false" form-class="bb-form" />
      </section>

      <footer v-if="loginConfig.beiAnHao" class="bb-footer">
        <el-icon :size="12"><InfoFilled /></el-icon>
        <span>{{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}</span>
      </footer>
    </main>
  </div>
</template>

<script lang="ts" setup>
/**
 * 气泡简约（bubble）
 *
 * 设计要点：
 *  1. 标题只保留一处 —— 页面自带头部，故 ReLoginForm 传 show-header=false，
 *     避免与内部 .form-header 叠成「平台名 + 账号密码登录」双标题；
 *  2. 气泡由数据驱动（尺寸/速度/透明度/横向漂移各异），并使用负 delay，
 *     首屏即刻有气泡在途，不会出现「空背景 → 慢慢冒泡」的冷场；
 *  3. 卡片改毛玻璃 + 分层投影，配合大光斑形成前后景深。
 */
import { computed, toRef } from "vue";
import * as ElementPlusIcons from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import fallbackLogoUrl from "@repo/assets/images/logo/logo.svg";
import { translateConfigText } from "@repo/languages";
import ReLoginForm from "../components/ReLoginForm.vue";

// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");

/** 品牌 Logo：优先 app.yaml 配置，回退内置 logo */
const resolvedLogoUrl = computed(() => {
  const custom = loginConfig.value.logoUrl;
  if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) {
    return resolveAssetUrl(custom);
  }
  return fallbackLogoUrl;
});

/** 特色标签：后端配置优先，缺省时用内置三项，避免空标签区 */
const tags = computed(() => {
  const configured = loginConfig.value.featureTags;
  if (Array.isArray(configured) && configured.length) {
    return configured.map((text, i) => ({
      icon: (["DataAnalysis", "Brush", "Lock"][i] ?? "DataAnalysis") as keyof typeof ElementPlusIcons,
      text,
    }));
  }
  return [
    { icon: "DataAnalysis" as keyof typeof ElementPlusIcons, text: "高效管理" },
    { icon: "Brush" as keyof typeof ElementPlusIcons, text: "现代设计" },
    { icon: "Lock" as keyof typeof ElementPlusIcons, text: "安全可靠" },
  ];
});

/** 大光斑：少而大，负责景深与色彩重心 */
const orbs = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
];

/** 上升气泡：确定性伪随机，保证每次渲染一致（便于视觉回归对比） */
const bubbles = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  left: ((i * 41) % 97) + ((i * 13) % 5),
  size: 10 + ((i * 13) % 44),
  duration: 17 + ((i * 7) % 15),
  // 负 delay：首屏就有气泡在途
  delay: -((i * 5) % 19),
  opacity: 0.22 + ((i * 11) % 40) / 100,
  drift: (i % 2 ? 1 : -1) * (10 + ((i * 3) % 24)),
}));
</script>

<style lang="scss" scoped>
/* ============ 页面骨架 ============ */
.login-bubble {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color-page, #f5f7fb);
  isolation: isolate;
}

html.dark .login-bubble {
  background: #08080d;
}

/* ============ 极光底色 ============ */
.bb-bg {
  position: absolute;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background:
    radial-gradient(1100px 620px at 12% 8%, rgba(var(--el-color-primary-rgb), 0.16), transparent 62%),
    radial-gradient(900px 560px at 88% 22%, rgba(var(--el-color-primary-rgb), 0.12), transparent 60%),
    radial-gradient(760px 620px at 50% 108%, rgba(var(--el-color-primary-rgb), 0.1), transparent 58%);
}

/* ============ 大光斑（景深） ============ */
.bb-orbs {
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  filter: blur(70px);
}

.bb-orb {
  position: absolute;
  display: block;
  border-radius: 50%;

  &--1 {
    top: -10%;
    left: 8%;
    width: 340px;
    height: 340px;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.4), transparent 70%);
    animation: bb-drift-a 26s ease-in-out infinite;
  }

  &--2 {
    right: 6%;
    bottom: -12%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.32), transparent 70%);
    animation: bb-drift-b 32s ease-in-out infinite;
  }

  &--3 {
    top: 38%;
    left: 62%;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.22), transparent 72%);
    animation: bb-drift-a 38s ease-in-out infinite reverse;
  }
}

/* ============ 上升气泡 ============ */
.bb-bubbles {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.bb-bubble {
  position: absolute;
  bottom: -140px;
  display: block;
  border-radius: 50%;
  /* 左上高光 + 右下淡出，做出球体体积感 */
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.85), transparent 46%),
    radial-gradient(circle at 62% 72%, rgba(var(--el-color-primary-rgb), 0.55), transparent 68%);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.32);
  box-shadow:
    inset 0 0 12px rgba(255, 255, 255, 0.35),
    0 0 18px rgba(var(--el-color-primary-rgb), 0.16);
  animation-name: bb-rise;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

html.dark .bb-bubble {
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.22), transparent 46%),
    radial-gradient(circle at 62% 72%, rgba(var(--el-color-primary-rgb), 0.62), transparent 68%);
  border-color: rgba(var(--el-color-primary-rgb), 0.42);
  box-shadow:
    inset 0 0 12px rgba(255, 255, 255, 0.1),
    0 0 22px rgba(var(--el-color-primary-rgb), 0.24);
}

/* ============ 内容容器 ============ */
.bb-shell {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 460px;
  padding: 32px 20px;
}

/* ============ 品牌区 ============ */
.bb-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
  animation: bb-rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.bb-brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  box-shadow:
    0 10px 26px rgba(var(--el-color-primary-rgb), 0.22),
    0 2px 6px rgba(0, 0, 0, 0.06);
}

html.dark .bb-brand-mark {
  background: #14141c;
  border-color: rgba(255, 255, 255, 0.1);
}

.bb-logo {
  display: block;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  object-fit: cover;
}

.bb-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.5px;
  color: var(--el-text-color-primary);
}

.bb-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* ============ 特色标签 ============ */
.bb-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 0;
  margin: 18px 0 0;
  list-style: none;
}

.bb-tag {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  border-radius: 999px;
  transition:
    transform 0.25s ease,
    background-color 0.25s ease;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
    transform: translateY(-2px);
  }
}

/* ============ 表单卡片 ============ */
.bb-card {
  position: relative;
  width: 100%;
  padding: 34px 32px 28px;
  overflow: hidden;
  background: color-mix(in srgb, var(--el-bg-color) 78%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 14%, var(--el-border-color-lighter));
  border-radius: 24px;
  backdrop-filter: blur(22px) saturate(150%);
  box-shadow:
    0 24px 60px rgba(var(--el-color-primary-rgb), 0.14),
    0 6px 18px rgba(0, 0, 0, 0.06);
  animation: bb-rise-in 0.7s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;

  /* 顶部渐变高光边，玻璃质感的关键细节 */
  &::before {
    position: absolute;
    top: 0;
    right: 12%;
    left: 12%;
    height: 1px;
    content: "";
    background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.75), transparent);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      0 30px 70px rgba(var(--el-color-primary-rgb), 0.2),
      0 8px 22px rgba(0, 0, 0, 0.08);
  }
}

html.dark .bb-card {
  background: rgba(20, 20, 28, 0.72);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(var(--el-color-primary-rgb), 0.1);
}

/* ============ 页脚 ============ */
.bb-footer {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-top: 22px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  animation: bb-rise-in 0.7s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ============ 表单内部视觉增强 ============ */
.bb-form {
  :deep(.login-input) {
    .el-input__wrapper {
      border-radius: 12px;
      transition:
        box-shadow 0.25s ease,
        background-color 0.25s ease;
    }

    .el-input__wrapper:hover {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    }

    .el-input__wrapper.is-focus {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 55%, transparent);
    }
  }

  :deep(.login-btn) {
    height: 44px;
    border-radius: 12px;
    font-size: 16px;
    box-shadow: 0 10px 22px rgba(var(--el-color-primary-rgb), 0.32);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 28px rgba(var(--el-color-primary-rgb), 0.42);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

/* ============ 动画 ============ */
@keyframes bb-rise {
  0% {
    transform: translate3d(0, 0, 0) scale(0.85);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  88% {
    opacity: 0.75;
  }
  100% {
    transform: translate3d(var(--bb-drift), -108vh, 0) scale(1.2);
    opacity: 0;
  }
}

@keyframes bb-drift-a {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(40px, 26px, 0);
  }
}

@keyframes bb-drift-b {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(-36px, -22px, 0);
  }
}

@keyframes bb-rise-in {
  from {
    transform: translate3d(0, 18px, 0);
    opacity: 0;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

/* ============ 无障碍：尊重减少动效偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .bb-bubble,
  .bb-orb {
    animation: none;
  }

  .bb-bubble {
    opacity: 0.3;
  }

  .bb-brand,
  .bb-card,
  .bb-footer {
    animation: none;
  }

  .bb-card,
  .bb-tag,
  .bb-form :deep(.login-btn) {
    transition: none;
  }
}

/* ============ 窄屏 ============ */
@media (max-width: 640px) {
  .bb-shell {
    padding: 24px 16px;
  }

  .bb-title {
    font-size: 22px;
  }

  .bb-card {
    padding: 26px 20px 22px;
    border-radius: 20px;
  }
}
</style>
