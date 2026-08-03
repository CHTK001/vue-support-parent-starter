<template>
  <div class="login-page login-bubble w-screen h-screen overflow-hidden flex items-center justify-center relative">
    <!-- 气泡背景 -->
    <div class="bubble-layer" aria-hidden="true">
      <span v-for="i in 14" :key="i" class="bubble" :class="`bubble--${i}`"></span>
    </div>

    <!-- 渐变背景 -->
    <div class="bubble-bg"></div>

    <!-- 品牌标识（左上角） -->
    <div class="bubble-brand pos-absolute top-8 left-8 flex items-center gap-10px z-10">
      <div class="bubble-brand-logo">
        <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
      </div>
      <span class="bubble-brand-name text-16px font-700 text-[--el-text-color-primary]">{{ loginConfig.brandName }}</span>
    </div>

    <!-- 轻量卡片 -->
    <div class="bubble-card relative z-10 w-400px max-w-92vw rounded-20px p-36px">
      <div class="bubble-card-header text-center m-b-32px">
        <div class="bubble-mobile-brand flex items-center justify-center gap-10px m-b-20px md:hidden">
          <div class="bubble-brand-logo bubble-brand-logo--mobile">
            <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
          </div>
        </div>
        <h3 class="text-26px font-700 m-b-8px text-[--el-text-color-primary]">{{ translateConfigText(loginConfig.title) }}</h3>
        <p class="text-14px text-[--el-text-color-regular]">{{ translateConfigText(loginConfig.description) }}</p>
      </div>

      <KoiLoginForm :show-mobile-brand="false" />

      <div class="bubble-footer m-t-24px text-center">
        <span v-if="loginConfig.beiAnHao" class="text-12px text-[--el-text-color-secondary]">
          {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
        </span>
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
.login-bubble {
  background: var(--el-bg-color-page, #f6f7fb);
}

html.dark .login-bubble {
  background: #0a0a0f;
}

.bubble-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 600px 400px at 75% 20%, rgba(var(--el-color-primary-rgb), 0.1), transparent 70%),
    radial-gradient(500px circle at 20% 80%, rgba(var(--el-color-primary-rgb), 0.08), transparent 65%);
  pointer-events: none;
}

/* 气泡层 */
.bubble-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bubble {
  position: absolute;
  bottom: -120px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(var(--el-color-primary-rgb), 0.32),
    rgba(var(--el-color-primary-rgb), 0.05) 65%
  );
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.18);
  opacity: 0;
  animation: bubble-rise 14s linear infinite;

  &--1 { left: 6%;  width: 46px; height: 46px; animation-delay: 0s; }
  &--2 { left: 14%; width: 26px; height: 26px; animation-delay: 2s; }
  &--3 { left: 24%; width: 60px; height: 60px; animation-delay: 5s; }
  &--4 { left: 33%; width: 20px; height: 20px; animation-delay: 1s; }
  &--5 { left: 42%; width: 40px; height: 40px; animation-delay: 7s; }
  &--6 { left: 51%; width: 30px; height: 30px; animation-delay: 3.5s; }
  &--7 { left: 60%; width: 56px; height: 56px; animation-delay: 9s; }
  &--8 { left: 68%; width: 24px; height: 24px; animation-delay: 4.5s; }
  &--9 { left: 76%; width: 48px; height: 48px; animation-delay: 6s; }
  &--10 { left: 84%; width: 28px; height: 28px; animation-delay: 11s; }
  &--11 { left: 90%; width: 52px; height: 52px; animation-delay: 2.5s; }
  &--12 { left: 96%; width: 22px; height: 22px; animation-delay: 8s; }
  &--13 { left: 50%; width: 16px; height: 16px; animation-delay: 12s; }
  &--14 { left: 30%; width: 14px; height: 14px; animation-delay: 10s; }
}

html.dark .bubble {
  background: radial-gradient(
    circle at 30% 30%,
    rgba(var(--el-color-primary-rgb), 0.4),
    rgba(var(--el-color-primary-rgb), 0.06) 65%
  );
  border-color: rgba(var(--el-color-primary-rgb), 0.24);
}

/* 品牌 */
.bubble-brand {
  &-logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);

    &--mobile {
      width: 38px;
      height: 38px;
    }
  }
}

/* 轻量卡片 */
.bubble-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

html.dark .bubble-card {
  background: #121218;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}

.bubble-footer {
  opacity: 0.85;
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

@keyframes bubble-rise {
  0% {
    transform: translateY(0) scale(0.9);
    opacity: 0;
  }
  10% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-110vh) scale(1.15);
    opacity: 0;
  }
}
</style>
