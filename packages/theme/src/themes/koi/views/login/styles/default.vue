<template>
  <div class="login-page w-screen h-screen overflow-hidden" :class="{ 'anim-ready-fallback': animFallback }">
    <el-row class="h-100%">
      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="flex flex-items-center flex-justify-center">
        <div class="login-background w-100% h-100%">
          <!-- 装饰光斑 -->
          <span class="orb orb--1"></span>
          <span class="orb orb--2"></span>
          <span class="orb orb--3"></span>
          <span class="orb orb--4"></span>

          <!-- 网格底纹 -->
          <div class="bg-grid" aria-hidden="true"></div>

          <!-- 噪点纹理 -->
          <div class="bg-grain" aria-hidden="true"></div>

          <!-- 装饰线 -->
          <div class="deco-line deco-line--1" aria-hidden="true"></div>
          <div class="deco-line deco-line--2" aria-hidden="true"></div>

          <!-- 内容层 -->
          <div class="content-layer">
            <!-- 品牌徽章 -->
            <div class="brand-badge flex flex-items-center gap-10px animate-fade-in-up" style="animation-delay: 0s">
              <div class="brand-logo-wrap">
                <img class="brand-logo" :src="fallbackLogoUrl" :alt="loginConfig.brandName" />
              </div>
              <span class="brand-text">{{ translateConfigText(loginConfig.title) }}</span>
            </div>

            <!-- 主视觉卡片 -->
            <div class="hero-card animate-fade-in-up" style="animation-delay: 0.15s">
              <div class="hero-image-wrap">
                <el-image class="hero-image" :src="resolvedImageUrl" :alt="loginConfig.brandName" />
              </div>
            </div>

            <!-- 大标题用「欢迎登录」，平台名已由上方品牌徽标给出，避免同栏重复 -->
            <h2 class="hero-title animate-fade-in-up" style="animation-delay: 0.3s">
              {{ translateConfigText(loginConfig.welcome) }}
            </h2>
            <p class="hero-desc animate-fade-in-up" style="animation-delay: 0.6s">
              {{ translateConfigText(loginConfig.description) }}
            </p>

            <div class="hero-tags flex flex-justify-center gap-8px flex-wrap animate-fade-in-up" style="animation-delay: 0.75s">
              <span class="hero-tag" v-for="tag in defaultTags" :key="tag.text">
                <el-icon :size="13" class="hero-tag-icon"><component :is="ElementPlusIcons[tag.icon]" /></el-icon>
                <span class="hero-tag-text">{{ translateConfigText(tag.text) }}</span>
              </span>
            </div>
          </div>

          <div class="hero-footer animate-fade-in-up" style="animation-delay: 0.9s">
            <span>© 2026 {{ translateConfigText(loginConfig.title) }}</span>
            <span v-if="loginConfig.beiAnHao">
              {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
            </span>
          </div>
        </div>
      </el-col>

      <el-col
        :lg="8"
        :md="12"
        :sm="9"
        :xs="24"
        class="login-form-side flex flex-items-center flex-justify-center flex-col"
      >
        <div class="login-form-panel animate-fade-in-right" style="align-items: stretch;">
          <ReLoginForm show-mobile-brand />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, toRef } from "vue";
import * as ElementPlusIcons from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import fallbackLogoUrl from "@repo/assets/images/logo/logo.svg";
import { translateConfigText } from "@repo/languages";
import ReLoginForm from "../components/ReLoginForm.vue";

const loginConfig = toRef(getConfig(), "login");
const resolvedLogoUrl = computed(() => {
  const custom = loginConfig.value.logoUrl;
  if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) {
    return resolveAssetUrl(custom);
  }
  return fallbackLogoUrl;
});
const resolvedImageUrl = computed(() =>
  loginConfig.value.imageUrl ? resolveAssetUrl(loginConfig.value.imageUrl) : ""
);
/** 内置默认标签，不依赖后端配置避免异常空标签 */
const defaultTags = [
  { icon: "DataAnalysis", text: "高效管理" },
  { icon: "Brush", text: "现代设计" },
  { icon: "Lock", text: "安全可靠" },
];

/**
 * 入场动画兜底：正常环境动画在 0.9s 内播完并保持可见，本兜底无感知；
 * 若动画时间轴被冻结（后台/自动化/异常），最迟 1.3s 强制内容可见，避免登录页永久空白。
 */
const animFallback = ref(false);
onMounted(() => {
  setTimeout(() => {
    animFallback.value = true;
  }, 1300);
});
</script>

<style lang="scss" scoped>
/* ==================== 基础容器 ==================== */
.login-background {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 800px 600px at 80% 20%, rgba(var(--el-color-primary-rgb), 0.18), transparent 60%),
    radial-gradient(600px circle at 20% 80%, color-mix(in srgb, var(--el-color-primary-light-3) 12%, transparent), transparent 65%),
    radial-gradient(500px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.06), transparent 60%),
    var(--el-bg-color-page, #f6f7fb);
}

html.dark .login-background {
  background:
    radial-gradient(ellipse 700px 500px at 80% 15%, rgba(var(--el-color-primary-rgb), 0.3), transparent 60%),
    radial-gradient(500px circle at 20% 85%, color-mix(in srgb, var(--el-color-primary-light-3) 22%, transparent), transparent 65%),
    radial-gradient(400px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.12), transparent 60%),
    #08080e;
}

/* ==================== 装饰光斑 ==================== */
.orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
}

.orb--1 {
  top: -12%;
  right: 5%;
  width: 380px;
  height: 380px;
  background: rgba(var(--el-color-primary-rgb), 0.42);
  animation: orb-drift-1 16s ease-in-out infinite;
}

.orb--2 {
  bottom: -8%;
  left: 3%;
  width: 320px;
  height: 320px;
  background: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-primary-light-3) 45%);
  animation: orb-drift-2 18s ease-in-out infinite;
}

.orb--3 {
  top: 45%;
  left: 38%;
  width: 240px;
  height: 240px;
  background: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-color-primary-light-5) 50%);
  opacity: 0.6;
  animation: orb-drift-3 20s ease-in-out infinite;
}

.orb--4 {
  top: 18%;
  left: -5%;
  width: 200px;
  height: 200px;
  background: color-mix(in srgb, var(--el-color-primary-light-3) 35%, transparent);
  animation: orb-drift-1 22s ease-in-out infinite reverse;
}

html.dark .orb { opacity: 0.5; }

@keyframes orb-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.08); }
}
@keyframes orb-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-25px, -15px) scale(1.05); }
}
@keyframes orb-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(18px, 12px) scale(1.1); }
}

/* ==================== 网格底纹 ==================== */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.04) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse 80% 65% at 50% 45%, #000 20%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

/* ==================== 噪点纹理 ==================== */
.bg-grain {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.5'/></svg>");
}

/* ==================== 装饰线 ==================== */
.deco-line {
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.3), transparent);
  pointer-events: none;
  z-index: 1;
}

.deco-line--1 {
  top: 30%;
  left: 8%;
  width: 35%;
  animation: line-pulse 5s ease-in-out infinite;
}

.deco-line--2 {
  bottom: 25%;
  right: 10%;
  width: 40%;
  animation: line-pulse 6s ease-in-out infinite 1s;
}

@keyframes line-pulse {
  0%, 100% { opacity: 0.3; transform: scaleX(0.95); }
  50% { opacity: 0.6; transform: scaleX(1); }
}

/* ==================== 内容层 ==================== */
.content-layer {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  padding: 0 48px;
  text-align: center;
}

/* ==================== 品牌徽章 ==================== */
.brand-badge {
  margin-bottom: 28px;
  justify-content: center;
}

.brand-logo-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.15),
    0 0 0 2px rgba(255, 255, 255, 0.4);
  padding: 3px;
  line-height: 0;
}

.brand-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 11px;
  object-fit: cover;
}

.brand-text {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

/* ==================== 主视觉卡片 ==================== */
.hero-card {
  margin-bottom: 36px;
  animation: hero-float 6s ease-in-out infinite;
}

.hero-image-wrap {
  position: relative;
  width: 280px;
  max-width: 520px;
  height: 280px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 20px;
  object-fit: cover;
}

@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ==================== 标题 ==================== */
.hero-title {
  margin: 0 0 12px;
  font-size: 30px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  letter-spacing: 1.5px;
  line-height: 1.3;
}

.hero-desc {
  margin: 0;
  font-size: 15px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
  opacity: 0.85;
}

/* ==================== 标签 ==================== */
.hero-tags {
  margin-top: 28px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  background: rgba(var(--el-color-primary-rgb), 0.07);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.16);
  border-radius: 20px;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  transition: all 0.3s;
  white-space: nowrap;
}

.hero-tag-icon {
  color: var(--el-color-primary);
}

.hero-tag:hover {
  background: rgba(var(--el-color-primary-rgb), 0.14);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
}

html.dark .hero-tag {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

html.dark .hero-tag:hover {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}

/* ==================== 底部版权 ==================== */
.hero-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 24px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  opacity: 0.8;
}

/* ==================== 右侧表单 ==================== */
.login-form-side {
  position: relative;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}

.login-form-side.login-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

html.dark .login-form-side {
  background: #0c0c0c;
  border-left-color: rgba(255, 255, 255, 0.06);
}

.login-form-panel {
  width: 100%;
  max-width: 380px;
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
}

/* ==================== 入场动画 ==================== */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  opacity: 0;
  animation: fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes fade-in-right {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in-right {
  opacity: 0;
  animation: fade-in-right 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* 入场动画兜底：时间轴被冻结/不推进时，强制内容可见，登录页不得永久空白 */
.anim-ready-fallback .animate-fade-in-up,
.anim-ready-fallback .animate-fade-in-right {
  opacity: 1 !important;
  transform: none !important;
  animation: none !important;
}

/* ==================== 响应式 ==================== */
@media (max-width: 1024px) {
  .hero-title { font-size: 24px; }
  .hero-card {
    margin-bottom: 28px;
  }
  .hero-image-wrap {
    width: 240px;
    height: 240px;
  }
}

@media (max-width: 768px) {
  .content-layer {
    padding: 0 24px;
  }
  .hero-image-wrap {
    width: 200px;
    height: 200px;
  }
}
</style>

