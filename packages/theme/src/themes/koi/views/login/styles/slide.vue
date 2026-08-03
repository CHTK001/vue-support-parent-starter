<template>
  <div class="login-page login-slide w-screen h-screen overflow-hidden flex items-center justify-center relative">
    <!-- 背景光斑 -->
    <div class="slide-bg slide-bg--1"></div>
    <div class="slide-bg slide-bg--2"></div>

    <!-- 品牌标识 -->
    <div class="slide-brand pos-absolute top-8 left-8 flex items-center gap-10px z-10">
      <div class="slide-brand-logo">
        <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
      </div>
      <span class="slide-brand-name text-16px font-700 text-[--el-text-color-primary]">{{ loginConfig.brandName }}</span>
    </div>

    <!-- 双面板容器 -->
    <div class="slide-shell relative z-10 w-900px max-w-94vw h-560px max-h-90vh rounded-24px overflow-hidden flex shadow-xl">
      <!-- 左面板（品牌展示） -->
      <div class="slide-panel slide-panel--left flex-1 relative overflow-hidden">
        <div class="slide-panel-mesh" aria-hidden="true"></div>
        <div class="slide-panel-content relative z-2 h-full flex flex-col items-center justify-center text-center p-32px">
          <div class="slide-panel-logo m-b-24px">
            <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
          </div>
          <h2 class="slide-panel-title text-30px font-800 text-white m-b-12px">{{ translateConfigText(loginConfig.title) }}</h2>
          <p class="slide-panel-desc text-14px text-white/75 max-w-300px leading-relaxed">
            {{ translateConfigText(loginConfig.description) }}
          </p>
          <div class="slide-panel-tags flex gap-8px m-t-24px flex-wrap flex-justify-center">
            <span class="slide-panel-tag" v-for="tag in loginConfig.featureTags" :key="tag.text">{{ translateConfigText(tag.text) }}</span>
          </div>
        </div>
      </div>

      <!-- 右面板（登录表单） -->
      <div class="slide-panel slide-panel--right flex-1 flex items-center justify-center p-32px relative">
        <div class="slide-form-wrap w-100% max-w-340px">
          <KoiLoginForm :show-mobile-brand="false" form-class="slide-form" />
          <div class="slide-footer m-t-24px text-center text-12px text-[--el-text-color-secondary]">
            <span v-if="loginConfig.beiAnHao">
              {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import { translateConfigText } from "@repo/languages";
import KoiLoginForm from "../components/KoiLoginForm.vue";

// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");

// 品牌 Logo：支持 app.yaml 配置（本地资源路径或外部 URL）
const resolvedLogoUrl = computed(() => resolveAssetUrl(loginConfig.value.logoUrl));
</script>

<style lang="scss" scoped>
.login-slide {
  background:
    radial-gradient(ellipse 600px 450px at 80% 20%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    var(--el-bg-color-page, #f6f7fb);
}

html.dark .login-slide {
  background:
    radial-gradient(ellipse 600px 450px at 80% 20%, rgba(var(--el-color-primary-rgb), 0.22), transparent 70%),
    #08080d;
}

.slide-bg {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.35;
  pointer-events: none;

  &--1 {
    top: -6%;
    right: 5%;
    width: 380px;
    height: 380px;
    background: rgba(var(--el-color-primary-rgb), 0.4);
  }

  &--2 {
    bottom: 8%;
    left: -3%;
    width: 320px;
    height: 320px;
    background: color-mix(in srgb, var(--el-color-primary) 55%, #06b6d4 45%);
  }
}

html.dark .slide-bg {
  opacity: 0.2;
}

.slide-brand {
  &-logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
}

/* 双面板 */
.slide-shell {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}

html.dark .slide-shell {
  background: #0f0f15;
  border-color: rgba(255, 255, 255, 0.08);
}

/* 左面板 */
.slide-panel--left {
  background:
    radial-gradient(ellipse 500px 400px at 70% 15%, rgba(var(--el-color-primary-rgb), 0.6), transparent 70%),
    radial-gradient(400px circle at 20% 85%, rgba(var(--el-color-primary-rgb), 0.4), transparent 65%),
    #0b0b16;
}

html.dark .slide-panel--left {
  background:
    radial-gradient(ellipse 500px 400px at 70% 15%, rgba(var(--el-color-primary-rgb), 0.5), transparent 70%),
    radial-gradient(400px circle at 20% 85%, rgba(var(--el-color-primary-rgb), 0.32), transparent 65%),
    #04040a;
}

.slide-panel-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 75% 65% at 50% 45%, #000 20%, transparent 100%);
}

.slide-panel-logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(255, 255, 255, 0.3);
}

.slide-panel-title {
  letter-spacing: 2px;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

.slide-panel-tag {
  padding: 4px 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
}

/* 右面板 */
.slide-panel--right {
  background: var(--el-bg-color);
}

html.dark .slide-panel--right {
  background: #0f0f15;
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}
</style>
