<template>
  <div class="login-page login-split w-screen h-screen overflow-hidden flex">
    <!-- 左屏：品牌沉浸区 -->
    <div class="split-brand flex-1 relative overflow-hidden hidden md:flex flex-col justify-between p-40px">
      <div class="split-brand-mesh" aria-hidden="true"></div>
      <div class="split-brand-glow split-brand-glow--1"></div>
      <div class="split-brand-glow split-brand-glow--2"></div>

      <!-- 品牌头 -->
      <div class="relative z-2 flex items-center gap-12px">
        <div class="split-brand-logo">
          <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
        </div>
        <span class="split-brand-name text-18px font-700 text-white">{{ translateConfigText(loginConfig.title) }}</span>
      </div>

      <!-- 中间宣传语 -->
      <div class="relative z-2">
        <h2 class="split-brand-title text-40px font-800 text-white m-b-20px leading-tight">
          {{ translateConfigText(loginConfig.welcome) }}
        </h2>
        <p class="split-brand-desc text-16px text-white/70 max-w-520px leading-relaxed">
          {{ translateConfigText(loginConfig.description) }}
        </p>
        <div class="split-brand-features flex gap-12px m-t-32px flex-wrap">
          <span class="split-feature" v-for="tag in loginConfig.featureTags" :key="tag.text">
            <el-icon :size="14" class="split-feature-icon"><component :is="ElementPlusIcons[tag.icon]" /></el-icon>
            {{ translateConfigText(tag.text) }}
          </span>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="relative z-2 flex items-center justify-between text-12px text-white/50">
        <span>© 2026 {{ translateConfigText(loginConfig.title) }}</span>
        <span v-if="loginConfig.beiAnHao">
          {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
        </span>
      </div>
    </div>

    <!-- 右屏：登录表单区 -->
    <div class="split-form-side flex-1 flex flex-col items-center justify-center relative p-24px">
      <div class="split-form-wrap w-100% max-w-400px">
        <!-- 移动端品牌 -->
        <div class="split-mobile-brand md:hidden flex items-center justify-center gap-10px m-b-24px">
          <div class="split-brand-logo split-brand-logo--mobile">
            <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
          </div>
          <span class="text-18px font-700 text-[--el-text-color-primary]">{{ translateConfigText(loginConfig.title) }}</span>
        </div>

        <div class="text-center m-b-36px">
          <h3 class="text-28px font-800 m-b-8px text-[--el-text-color-primary]">{{ $t("menu.login.account") }}</h3>
          <p class="text-14px text-[--el-text-color-regular]">
            {{ $t("menu.login.form.loginName") }} / {{ $t("menu.login.form.password") }}
          </p>
        </div>

        <ReLoginForm :show-mobile-brand="false"  :show-header="false" />

        <div class="split-footer m-t-28px text-center text-12px text-[--el-text-color-secondary] md:hidden">
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
import * as ElementPlusIcons from "@element-plus/icons-vue";
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
.login-split {
  background: var(--el-bg-color);
}

/* 左屏 */
.split-brand {
  color: #fff;
  background:
    radial-gradient(ellipse 700px 600px at 80% 15%, rgba(var(--el-color-primary-rgb), 0.55), transparent 70%),
    radial-gradient(600px circle at 15% 90%, rgba(var(--el-color-primary-rgb), 0.4), transparent 65%),
    #0b0b16;
}

html.dark .split-brand {
  background:
    radial-gradient(ellipse 700px 600px at 80% 15%, rgba(var(--el-color-primary-rgb), 0.5), transparent 70%),
    radial-gradient(600px circle at 15% 90%, rgba(var(--el-color-primary-rgb), 0.35), transparent 65%),
    #04040a;
}

.split-brand-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 20%, transparent 100%);
}

.split-brand-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  pointer-events: none;

  &--1 {
    top: 10%;
    right: -5%;
    width: 300px;
    height: 300px;
    background: color-mix(in srgb, var(--el-color-primary) 60%, var(--el-color-primary-light-3) 40%);
  }

  &--2 {
    bottom: 5%;
    left: -3%;
    width: 260px;
    height: 260px;
    background: color-mix(in srgb, var(--el-color-primary) 60%, var(--el-color-primary-light-5) 40%);
  }
}

.split-brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 0 2px rgba(255, 255, 255, 0.25);

  &--mobile {
    width: 40px;
    height: 40px;
  }
}

.split-brand-title {
  letter-spacing: 2px;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
}

.split-feature {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  backdrop-filter: blur(8px);

  &-icon {
    color: var(--el-color-primary-light-5);
  }
}

/* 右屏 */
.split-form-side {
  background: var(--el-bg-color);
}

html.dark .split-form-side {
  background: #0c0c12;
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}
</style>

