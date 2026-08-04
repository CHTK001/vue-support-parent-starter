<template>
  <div class="login-page login-slide w-screen h-screen overflow-hidden flex items-center justify-center relative">
    <!-- 背景光斑 -->
    <div class="slide-bg slide-bg--1"></div>
    <div class="slide-bg slide-bg--2"></div>
    <div class="slide-bg slide-bg--3"></div>

    <!-- 网格装饰 -->
    <div class="slide-mesh" aria-hidden="true"></div>

    <!-- 品牌标识 -->
    <div class="slide-brand pos-absolute top-8 left-8 flex items-center gap-10px z-10">
      <div class="slide-brand-logo">
        <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
      </div>
      <span class="slide-brand-name text-16px font-700 text-[--el-text-color-primary]">{{ loginConfig.brandName }}</span>
    </div>

    <!-- 居中登录卡片 -->
    <div class="slide-card relative z-10 w-440px max-w-94vw rounded-24px overflow-hidden p-36px">
      <!-- 卡片装饰光斑 -->
      <div class="slide-card-glow slide-card-glow--1"></div>
      <div class="slide-card-glow slide-card-glow--2"></div>

      <div class="relative z-1">
        <KoiLoginForm :show-mobile-brand="false" form-class="slide-form" />

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

.slide-brand {
  &-logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
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
    background: color-mix(in srgb, var(--el-color-primary) 50%, #06b6d4 50%);
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
