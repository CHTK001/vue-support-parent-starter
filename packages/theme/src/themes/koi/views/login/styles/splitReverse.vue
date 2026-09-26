<template>
  <div class="login-page login-split-reverse w-screen h-screen overflow-hidden flex">
    <!-- 左屏：登录表单区 -->
    <div class="lsr-form-side flex-1 flex flex-col items-center justify-center relative p-24px">
      <div class="lsr-form-wrap w-100% max-w-400px">
        <!-- 移动端品牌（右屏隐藏时的兜底） -->
        <div class="lsr-mobile-brand md:hidden flex items-center justify-center gap-10px m-b-24px">
          <div class="lsr-logo lsr-logo--mobile">
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

        <div class="lsr-footer m-t-28px text-center text-12px text-[--el-text-color-secondary] md:hidden">
          <span v-if="loginConfig.beiAnHao">
            {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
          </span>
        </div>
      </div>
    </div>

    <!-- 右屏：品牌沉浸区（主色渐变，与「现代立体 / 简单双栏」同一蓝色体系） -->
    <div class="lsr-brand flex-1 relative overflow-hidden hidden md:flex flex-col justify-between p-40px">
      <div class="lsr-brand-mesh" aria-hidden="true"></div>
      <div class="lsr-brand-glow lsr-brand-glow--1"></div>
      <div class="lsr-brand-glow lsr-brand-glow--2"></div>

      <!-- 品牌头 -->
      <div class="relative z-2 flex items-center gap-12px">
        <div class="lsr-logo">
          <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
        </div>
        <span class="text-18px font-700 text-white">{{ translateConfigText(loginConfig.title) }}</span>
      </div>

      <!-- 中间宣传语 -->
      <div class="relative z-2">
        <h2 class="lsr-title text-40px font-800 text-white m-b-20px leading-tight">
          {{ translateConfigText(loginConfig.welcome) }}
        </h2>
        <p class="text-16px text-white/75 max-w-520px leading-relaxed">
          {{ translateConfigText(loginConfig.description) }}
        </p>
        <div class="flex gap-12px m-t-32px flex-wrap">
          <span class="lsr-feature" v-for="tag in loginConfig.featureTags" :key="tag.text">
            <el-icon :size="14" class="lsr-feature-icon"><component :is="ElementPlusIcons[tag.icon]" /></el-icon>
            {{ translateConfigText(tag.text) }}
          </span>
        </div>
      </div>

      <!-- 底部版权 -->
      <div class="relative z-2 flex items-center justify-between text-12px text-white/60">
        <span>© 2026 {{ translateConfigText(loginConfig.title) }}</span>
        <span v-if="loginConfig.beiAnHao">
          {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
        </span>
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
.login-split-reverse {
  background: var(--el-bg-color);
}

/* 左屏：表单 */
.lsr-form-side {
  background: var(--el-bg-color);
}

html.dark .lsr-form-side {
  background: #0c0c12;
}

/* 右屏：品牌沉浸（主色渐变 + 柔光 + 网格） */
.lsr-brand {
  color: #fff;
  background:
    radial-gradient(ellipse 620px 560px at 20% 20%, color-mix(in srgb, var(--el-color-white) 24%, transparent), transparent 70%),
    radial-gradient(560px circle at 85% 85%, color-mix(in srgb, var(--el-color-white) 16%, transparent), transparent 65%),
    linear-gradient(155deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
}

.lsr-brand-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--el-color-white) 8%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--el-color-white) 8%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 20%, transparent 100%);
}

.lsr-brand-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  pointer-events: none;

  &--1 {
    top: 8%;
    right: -6%;
    width: 300px;
    height: 300px;
    background: color-mix(in srgb, var(--el-color-white) 40%, transparent);
  }

  &--2 {
    bottom: 4%;
    left: -4%;
    width: 260px;
    height: 260px;
    background: color-mix(in srgb, var(--el-color-primary-light-5) 70%, transparent);
  }
}

.lsr-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.24),
    0 0 0 2px rgba(255, 255, 255, 0.3);

  &--mobile {
    width: 40px;
    height: 40px;
  }
}

.lsr-title {
  letter-spacing: 2px;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.28);
}

.lsr-feature {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  background: color-mix(in srgb, var(--el-color-white) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-white) 22%, transparent);
  border-radius: var(--el-radius-full, 9999px);
  backdrop-filter: blur(8px);
}

.lsr-feature-icon {
  color: color-mix(in srgb, var(--el-color-white) 88%, transparent);
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}
</style>
