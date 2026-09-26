<template>
  <div class="login-page login-slide w-screen h-screen overflow-hidden flex items-center justify-center relative">
    <!-- 背景光斑 -->
    <div class="slide-bg slide-bg--1"></div>
    <div class="slide-bg slide-bg--2"></div>
    <div class="slide-bg slide-bg--3"></div>

    <!-- 网格装饰 -->
    <div class="slide-mesh" aria-hidden="true"></div>

    <!-- 居中登录卡片：品牌只在卡片内出现一次 -->
    <div class="slide-card relative z-10 w-440px max-w-94vw rounded-24px overflow-hidden p-36px">
      <!-- 卡片装饰光斑 -->
      <div class="slide-card-glow slide-card-glow--1"></div>
      <div class="slide-card-glow slide-card-glow--2"></div>

      <div class="relative z-1">
        <!-- 卡片自带标题，故 ReLoginForm 传 show-header=false，避免双标题 -->
        <div class="slide-card-head">
          <div class="slide-card-mark">
            <img class="slide-card-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
          </div>
          <h3 class="slide-card-title">{{ translateConfigText(loginConfig.title) }}</h3>
          <p class="slide-card-desc">{{ translateConfigText(loginConfig.description) }}</p>
        </div>

        <ReLoginForm :show-mobile-brand="false" :show-header="false" form-class="slide-form" />

        <div class="slide-footer m-t-24px text-center text-12px text-[--el-text-color-secondary]">
          <span v-if="loginConfig.beiAnHao">
            {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import fallbackLogoUrl from "@repo/assets/images/logo/logo.svg";
import { translateConfigText } from "@repo/languages";
import ReLoginForm from "../components/ReLoginForm.vue";

// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");

// 品牌 Logo：支持 app.yaml 配置（本地资源路径或外部 URL），为空时回退内置 logo
const resolvedLogoUrl = computed(() =>
  loginConfig.value.logoUrl ? resolveAssetUrl(loginConfig.value.logoUrl) : fallbackLogoUrl
);
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
    background: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-primary-light-5) 45%);
  }

  &--3 {
    top: 40%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 500px;
    background: radial-gradient(ellipse 500px 400px at 70% 15%, rgba(var(--el-color-primary-rgb), 0.25), transparent 70%);
    filter: blur(80px);
  }
}

html.dark .slide-bg {
  opacity: 0.2;
}

/* 网格装饰 */
.slide-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, #000 20%, transparent 100%);
  pointer-events: none;
}

/* 卡片内的品牌标识 */
.slide-card-mark {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.slide-card-logo {
  display: block;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(var(--el-color-primary-rgb), 0.3);
}

/* 居中卡片 */
.slide-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

html.dark .slide-card {
  background: rgba(15, 15, 21, 0.85);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* 卡片标题区 */
.slide-card-head {
  margin-bottom: 28px;
  text-align: center;
}

.slide-card-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.slide-card-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 卡片内装饰光斑 */
.slide-card-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.3;

  &--1 {
    width: 200px;
    height: 200px;
    top: -60px;
    right: -40px;
    background: rgba(var(--el-color-primary-rgb), 0.4);
    filter: blur(50px);
  }

  &--2 {
    width: 150px;
    height: 150px;
    bottom: -40px;
    left: -30px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-color-primary-light-5) 50%);
    filter: blur(40px);
  }
}

html.dark .slide-card-glow {
  opacity: 0.2;
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}
</style>

