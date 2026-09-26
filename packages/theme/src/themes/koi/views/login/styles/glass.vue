<template>
  <div class="login-page login-glass w-screen h-screen overflow-hidden flex items-center justify-center relative">
    <!-- 动态光斑背景 -->
    <div class="glass-bg glass-bg--1"></div>
    <div class="glass-bg glass-bg--2"></div>
    <div class="glass-bg glass-bg--3"></div>

    <!-- 网格纹理 -->
    <div class="glass-grid" aria-hidden="true"></div>

    <!-- 居中毛玻璃卡片：品牌只在卡片内出现一次 -->
    <div class="glass-card relative z-10 w-440px max-w-92vw rounded-24px p-40px">
      <div class="glass-card-inner">
        <div class="glass-card-header text-center m-b-36px">
          <div class="glass-card-mark">
            <img class="glass-card-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
          </div>
          <h3 class="text-28px font-800 m-b-8px text-[--el-text-color-primary]">{{ translateConfigText(loginConfig.title) }}</h3>
          <p class="text-14px text-[--el-text-color-regular]">{{ translateConfigText(loginConfig.description) }}</p>
        </div>

        <ReLoginForm :show-mobile-brand="false" :show-header="false" form-class="glass-form" />

        <div class="glass-footer m-t-24px text-center">
          <span v-if="loginConfig.beiAnHao" class="text-12px text-[--el-text-color-secondary]">
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
.login-glass {
  background:
    radial-gradient(ellipse 700px 520px at 80% 15%, rgba(var(--el-color-primary-rgb), 0.18), transparent 70%),
    radial-gradient(600px circle at 15% 85%, rgba(var(--el-color-primary-rgb), 0.14), transparent 65%),
    var(--el-bg-color-page, #f5f6fa);
}

html.dark .login-glass {
  background:
    radial-gradient(ellipse 700px 520px at 80% 15%, rgba(var(--el-color-primary-rgb), 0.28), transparent 70%),
    radial-gradient(600px circle at 15% 85%, rgba(var(--el-color-primary-rgb), 0.22), transparent 65%),
    #08080c;
}

/* 动态光斑 */
.glass-bg {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.45;
  pointer-events: none;
  animation: glass-float 16s infinite ease-in-out;

  &--1 {
    top: -8%;
    right: 5%;
    width: 420px;
    height: 420px;
    background: rgba(var(--el-color-primary-rgb), 0.4);
  }

  &--2 {
    bottom: 8%;
    left: -3%;
    width: 340px;
    height: 340px;
    background: color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-primary-light-5) 45%);
    animation-delay: -5s;
  }

  &--3 {
    top: 42%;
    left: 55%;
    width: 220px;
    height: 220px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, var(--el-color-primary-light-3) 50%);
    animation-delay: -10s;
  }
}

html.dark .glass-bg {
  opacity: 0.28;
}

/* 网格纹理 */
.glass-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.05) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 45%, #000 30%, transparent 100%);
  pointer-events: none;
}

/* 卡片内的品牌标识 */
.glass-card-mark {
  display: flex;
  justify-content: center;
  margin-bottom: 22px;
}

.glass-card-logo {
  display: block;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  object-fit: cover;
  box-shadow: 0 6px 18px rgba(var(--el-color-primary-rgb), 0.28);
}

/* 毛玻璃卡片 */
.glass-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.14),
    0 0 0 1px rgba(var(--el-color-primary-rgb), 0.04);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--el-color-primary), transparent);
    opacity: 0.5;
  }
}

html.dark .glass-card {
  background: rgba(24, 24, 28, 0.72);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.glass-card-inner {
  position: relative;
}

.glass-card-header {
  h3 {
    letter-spacing: 2px;
  }
}

/* 卡片内表单输入框加深 */
.glass-form {
  :deep(.login-input) {
    .el-input__wrapper {
      background: rgba(var(--el-bg-color-rgb), 0.55);
    }
  }
}

.glass-footer {
  opacity: 0.85;
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

@keyframes glass-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-18px, 12px) scale(1.06);
  }
}
</style>

