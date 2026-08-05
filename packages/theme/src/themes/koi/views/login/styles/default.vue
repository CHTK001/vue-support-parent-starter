<template>
  <div class="login-page w-screen h-screen overflow-hidden">
    <el-row class="h-100%">
      <el-col :lg="16" :md="12" :sm="15" :xs="0" class="flex flex-items-center flex-justify-center">
        <div class="login-background w-100% h-100%">
          <!-- 动态装饰光斑 -->
          <div class="bg-shape bg-shape--1"></div>
          <div class="bg-shape bg-shape--2"></div>
          <div class="bg-shape bg-shape--3"></div>

          <!-- 毛玻璃覆盖层 -->
          <div class="glass-overlay"></div>

          <!-- 内容层 -->
          <div class="pos-absolute text-center select-none transition-all transition-ease transition-500 content-layer">
            <div class="brand-badge flex flex-items-center flex-justify-center gap-10px m-b-32px <md:hidden">
              <div class="login-logo-wrap login-logo-wrap--brand">
                <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
              </div>
              <span class="brand-text text-18px font-700">{{ loginConfig.brandName }}</span>
            </div>
            <el-image
              class="w-260px max-w-500px h-260px m-b-40px animate-float-picture <md:hidden <lg:h-320px <lg:max-w-400px"
              :src="resolvedImageUrl"
            />
            <div class="welcome-title text-2xl font-700 m-b-12px text-center <lg:text-xl <md:hidden">
              {{ $t(loginConfig.welcome) }}
            </div>
            <div class="welcome-subtitle text-28px font-800 m-b-16px text-center <lg:text-22px <md:hidden">
              {{ $t(loginConfig.title) }}
            </div>
            <div class="welcome-desc text-16px font-400 text-center max-w-420px mx-auto leading-relaxed <md:hidden">
              {{ $t(loginConfig.description) }}
            </div>
            <div class="feature-tags flex flex-justify-center gap-12px m-t-32px flex-wrap <md:hidden">
              <span class="feature-tag" v-for="tag in loginConfig.featureTags" :key="tag.text">
                <el-icon :size="14" class="feature-tag-icon"><component :is="ElementPlusIcons[tag.icon]" /></el-icon>
                {{ translateConfigText(tag.text) }}
              </span>
            </div>
          </div>

          <!-- 备案号 -->
          <div v-if="loginConfig.beiAnHao" class="bei-an-hao select-none <md:hidden">
            <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank"
              >{{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}</a
            >
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
        <div class="login-form-panel w-100% flex flex-col flex-items-center">
          <KoiLoginForm show-mobile-brand />

          <!-- 备案号 - 小屏 -->
          <div v-if="loginConfig.beiAnHao" class="bei-an-hao select-none lg:hidden md:hidden">
            <a class="text-[--el-text-color-primary]" href="https://beian.miit.gov.cn/" target="_blank"
              >{{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}</a
            >
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import { computed, toRef } from "vue";
import * as ElementPlusIcons from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import { resolveAssetUrl } from "@repo/assets";
import { translateConfigText } from "@repo/languages";
import KoiLoginForm from "../components/KoiLoginForm.vue";

// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");

// 品牌 Logo：配置值可能为本地资源路径（/assets/...）或外部 URL，统一解析
const resolvedLogoUrl = computed(() => resolveAssetUrl(loginConfig.value.logoUrl));

// 左侧大图：配置值可能为本地资源路径（/assets/...）或外部 URL，统一解析
const resolvedImageUrl = computed(() => resolveAssetUrl(loginConfig.value.imageUrl));
</script>

<style lang="scss" scoped>
/** 备案号 */
.bei-an-hao {
  position: absolute !important;
  bottom: 0 !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  font-size: 12px;
  font-weight: normal;
  text-align: center;
  z-index: 10 !important;
  white-space: nowrap;
  padding-bottom: 10px;
  width: 100%;
}

.bei-an-hao a {
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }
}

/* 左侧背景 */
.login-background {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.10), transparent 65%),
    radial-gradient(350px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.08), transparent 60%),
    var(--el-bg-color-page, #F8F8F8);
}

html.dark .login-background {
  background:
    radial-gradient(ellipse 600px 450px at 85% 20%, rgba(var(--el-color-primary-rgb), 0.25), transparent 70%),
    radial-gradient(500px circle at 25% 80%, rgba(var(--el-color-primary-rgb), 0.20), transparent 65%),
    radial-gradient(350px circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.15), transparent 60%),
    #03020c;
}

/* 动态光斑 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  pointer-events: none;
  animation: bg-float 18s infinite ease-in-out;
  z-index: 0;

  &--1 {
    top: -5%;
    left: 10%;
    width: 400px;
    height: 400px;
    background: rgba(var(--el-color-primary-rgb), 0.35);
  }

  &--2 {
    bottom: 5%;
    right: 5%;
    width: 300px;
    height: 300px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, #a855f7 50%);
    animation-delay: -6s;
  }

  &--3 {
    top: 40%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: color-mix(in srgb, var(--el-color-primary) 50%, #06b6d4 50%);
    animation-delay: -12s;
  }
}

html.dark .bg-shape {
  opacity: 0.3;
}

/* 毛玻璃覆盖层 */
.glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-right: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 1;
  pointer-events: none;
}

html.dark .glass-overlay {
  background: rgba(0, 0, 0, 0.25);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

/* 内容层 */
.content-layer {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  padding: 0 40px;
  text-align: center;
}

.login-logo-wrap {
  flex-shrink: 0;
  overflow: hidden;
  line-height: 0;

  &--brand {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.22),
      0 0 0 2px rgba(255, 255, 255, 0.35);
  }

  &--mobile {
    width: 40px;
    height: 40px;
    padding: 2px;
    border-radius: 10px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.14);
  }
}

.login-logo {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;

  .login-logo-wrap--brand & {
    border-radius: 12px;
  }
}

.brand-text {
  color: var(--el-text-color-primary);
}

.welcome-title {
  color: var(--el-text-color-regular);
  letter-spacing: 2px;
}

.welcome-subtitle {
  color: var(--el-text-color-primary);
}

.welcome-desc {
  color: var(--el-text-color-regular);
  opacity: 0.85;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  background: rgba(var(--el-color-primary-rgb), 0.08);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.15);
  border-radius: 20px;
  backdrop-filter: blur(8px);
  transition: all 0.3s;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.15);
    transform: translateY(-2px);
  }
}

.feature-tag-icon {
  color: var(--el-color-primary);
}

html.dark .feature-tag {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 右侧表单区 */
.login-form-side {
  position: relative;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}

/* 覆盖 el-col-* 的 display:block，确保右侧表单垂直水平居中 */
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

html.dark {
  .login-logo-wrap--brand {
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.3),
      0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  .login-logo-wrap--mobile {
    background: #fff;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
}

.login-form-panel {
  padding: 40px 24px;
}

.animate-float-picture {
  animation: float-picture 5s ease-in-out infinite;
  filter: drop-shadow(0 20px 40px rgba(var(--el-color-primary-rgb), 0.15));
}

@keyframes float-picture {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16px);
  }
}

@keyframes bg-float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(15px, -10px) scale(1.05);
  }
}
</style>
