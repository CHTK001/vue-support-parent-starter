<template>
  <div class="login-page login-simple w-screen h-screen overflow-hidden relative flex items-center justify-center">
    <!-- 点阵网格背景 -->
    <div class="simple-dots" aria-hidden="true"></div>
    <div class="simple-grid" aria-hidden="true"></div>
    <div class="simple-glow simple-glow--1"></div>
    <div class="simple-glow simple-glow--2"></div>

    <!-- 居中终端面板：品牌只在终端标题栏出现一次，不再另设左上角浮动标识 -->
    <div class="simple-shell relative z-10 w-460px max-w-94vw rounded-16px overflow-hidden">
      <!-- 终端标题栏 -->
      <div class="simple-shell-bar flex items-center gap-8px px-16px py-10px">
        <span class="simple-dot simple-dot--red"></span>
        <span class="simple-dot simple-dot--yellow"></span>
        <span class="simple-dot simple-dot--green"></span>
        <span class="simple-shell-logo">
          <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
        </span>
        <span class="simple-shell-title ml-12px text-12px font-500">{{ translateConfigText(loginConfig.title) }}</span>
      </div>

      <!-- 终端内容 -->
      <div class="simple-shell-body p-32px">
        <div class="simple-prompt text-13px m-b-24px">
          <span class="simple-prompt-symbol">$</span>
          <span class="ml-8px text-[--el-text-color-secondary]">{{ translateConfigText(loginConfig.welcome) }}</span>
        </div>

        <ReLoginForm :show-mobile-brand="false" form-class="simple-form"  :show-header="false" />

        <div class="simple-footer m-t-24px flex items-center justify-between text-12px text-[--el-text-color-secondary]">
          <span>{{ $t("menu.login.account") }}</span>
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
.login-simple {
  background: var(--el-bg-color-page, #f7f8fa);
}

html.dark .login-simple {
  background: #07070c;
}

/* 点阵 */
.simple-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(var(--el-color-primary-rgb), 0.16) 1.5px, transparent 1.5px);
  background-size: 26px 26px;
  opacity: 0.6;
  pointer-events: none;
}

/* 网格 */
.simple-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.06) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 20%, transparent 100%);
  pointer-events: none;
}

/* 光晕 */
.simple-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  pointer-events: none;

  &--1 {
    top: -10%;
    right: 8%;
    width: 380px;
    height: 380px;
    background: rgba(var(--el-color-primary-rgb), 0.5);
  }

  &--2 {
    bottom: -5%;
    left: 10%;
    width: 300px;
    height: 300px;
    background: color-mix(in srgb, var(--el-color-primary) 55%, #22c55e 45%);
    opacity: 0.25;
  }
}

html.dark .simple-glow {
  opacity: 0.2;
}

/* 终端面板 */
.simple-shell {
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}

/* 标题栏内的品牌图标 */
.simple-shell-logo {
  display: block;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  overflow: hidden;
  border-radius: 4px;
}

html.dark .simple-shell {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.simple-shell-bar {
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .simple-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &--red { background: #f87171; }
    &--yellow { background: #fbbf24; }
    &--green { background: #34d399; }
  }

  .simple-shell-title {
    color: var(--el-text-color-secondary);
    letter-spacing: 1px;
  }
}

html.dark .simple-shell-bar {
  background: #15151d;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.simple-shell-body {
  background: var(--el-bg-color);
}

html.dark .simple-shell-body {
  background: #0e0e14;
}

.simple-prompt-symbol {
  color: var(--el-color-success);
  font-weight: 700;
}

/* 终端风格表单：无外边框输入框 */
.simple-form {
  :deep(.login-input) {
    .el-input__wrapper {
      border-radius: 6px;
      background: var(--el-fill-color-blank);
      border-color: var(--el-border-color-lighter);
    }
  }
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}
</style>

