<template>
  <div class="lc-page w-screen h-screen overflow-y-auto flex items-center justify-center relative">
    <!-- 背景柔光 -->
    <span class="lc-bg lc-bg--1" aria-hidden="true"></span>
    <span class="lc-bg lc-bg--2" aria-hidden="true"></span>
    <div class="lc-grid" aria-hidden="true"></div>

    <div class="lc-card">
      <!-- ============ 左侧蓝色品牌区 ============ -->
      <div class="lc-brand">
        <div class="lc-brand__head">
          <div class="lc-brand__logo">
            <img class="lc-logo-img" :src="resolvedLogoUrl" :alt="brandName" />
          </div>
          <div class="lc-brand__id">
            <div class="lc-brand__name">{{ brandName }}</div>
            <div class="lc-brand__sub">MANAGEMENT PLATFORM</div>
          </div>
        </div>

        <div class="lc-brand__main">
          <h2 class="lc-brand__title">
            {{ $t("menu.login.welcome") }}<br />{{ $t("menu.login.platform") }}
          </h2>
          <p class="lc-brand__desc">{{ $t("menu.login.description") }}</p>

          <div class="lc-pills">
            <span class="lc-pill" v-for="f in features" :key="f.text">
              <el-icon :size="13"><component :is="ElementPlusIcons[f.icon]" /></el-icon>
              <span>{{ f.text }}</span>
            </span>
          </div>
        </div>

        <!-- 玻璃浏览器插画 -->
        <div class="lc-mockup" aria-hidden="true">
          <div class="lc-mockup__bar">
            <span></span><span></span><span></span>
          </div>
          <div class="lc-mockup__body">
            <div class="lc-mockup__side"></div>
            <div class="lc-mockup__content">
              <span class="lc-mockup__wide"></span>
              <span class="lc-mockup__box"></span>
              <span class="lc-mockup__box"></span>
              <span class="lc-mockup__box"></span>
            </div>
          </div>
        </div>

        <div class="lc-brand__foot">© 2026 {{ brandName }} Team</div>
      </div>

      <!-- ============ 右侧白色表单区 ============ -->
      <div class="lc-form">
        <div class="lc-form__head">
          <div class="lc-form__brand">
            <div class="lc-form__logo">
              <img class="lc-logo-img" :src="resolvedLogoUrl" :alt="brandName" />
            </div>
            <span class="lc-form__brandname">{{ brandName }}</span>
          </div>
          <div class="lc-form__tab">
            <span class="lc-form__dot"></span>{{ $t("menu.login.account") }}
          </div>
          <h3 class="lc-form__title">{{ $t("menu.login.in") }}</h3>
          <p class="lc-form__prompt">
            {{ $t("menu.login.form.loginName") }} · {{ $t("menu.login.form.password") }}
          </p>
        </div>

        <div class="lc-form__body">
          <ReLoginForm :show-mobile-brand="false" form-class="lc-form-inner"  :show-header="false" />
        </div>
      </div>
    </div>

    <!-- 底部备案号 -->
    <div v-if="loginConfig.beiAnHao" class="lc-icp">
      {{ $t("menu.login.beiAnHao") }}：{{ loginConfig.beiAnHao }}
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

const loginConfig = toRef(getConfig(), "login");
const brandName = computed(() => translateConfigText(loginConfig.value.title));

const resolvedLogoUrl = computed(() => {
  const custom = loginConfig.value.logoUrl;
  if (custom && typeof custom === "string" && custom.trim() && !custom.includes("null")) {
    return resolveAssetUrl(custom);
  }
  return fallbackLogoUrl;
});

const features = [
  { icon: "Lightning", text: "极速开发体验" },
  { icon: "MagicStick", text: "现代化 UI 设计" },
  { icon: "Lock", text: "企业级安全保障" },
];
</script>

<style lang="scss" scoped>
/* ==================== 页面背景 ==================== */
.lc-page {
  background:
    radial-gradient(900px 600px at 85% 10%, rgba(var(--el-color-primary-rgb), 0.1), transparent 60%),
    radial-gradient(700px 500px at 10% 90%, rgba(var(--el-color-primary-rgb), 0.08), transparent 60%),
    var(--el-bg-color-page, #f4f6fb);
}
html.dark .lc-page {
  background:
    radial-gradient(900px 600px at 85% 10%, rgba(var(--el-color-primary-rgb), 0.16), transparent 60%),
    radial-gradient(700px 500px at 10% 90%, rgba(var(--el-color-primary-rgb), 0.12), transparent 60%),
    #08090d;
}

.lc-bg {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
}
.lc-bg--1 {
  top: -10%;
  right: 2%;
  width: 420px;
  height: 420px;
  background: rgba(var(--el-color-primary-rgb), 0.22);
}
.lc-bg--2 {
  bottom: -12%;
  left: -2%;
  width: 360px;
  height: 360px;
  background: rgba(var(--el-color-primary-rgb), 0.16);
}
.lc-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--el-color-primary-rgb), 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.04) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(ellipse 75% 70% at 50% 50%, #000 25%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

/* ==================== 居中卡片 ==================== */
.lc-card {
  position: relative;
  z-index: 2;
  display: flex;
  width: 960px;
  max-width: 94vw;
  height: 560px;
  max-height: 92vh;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  box-shadow:
    0 30px 80px rgba(15, 23, 60, 0.18),
    0 8px 24px rgba(15, 23, 60, 0.08);
}

/* ==================== 左侧品牌 ==================== */
.lc-brand {
  position: relative;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 32px 34px;
  color: #fff;
  background: linear-gradient(
    155deg,
    color-mix(in srgb, var(--el-color-primary) 78%, #ffffff 22%) 0%,
    var(--el-color-primary) 46%,
    color-mix(in srgb, var(--el-color-primary) 78%, #000000 22%) 100%
  );
}

.lc-brand__head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.lc-brand__logo,
.lc-form__logo {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  padding: 4px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 11px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}
.lc-logo-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 7px;
}
.lc-brand__name {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.5px;
  line-height: 1.2;
}
.lc-brand__sub {
  margin-top: 2px;
  font-size: 10px;
  letter-spacing: 2px;
  opacity: 0.75;
}

.lc-brand__main {
  flex: 1;
}
.lc-brand__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 1px;
}
.lc-brand__desc {
  margin: 14px 0 0;
  font-size: 13px;
  opacity: 0.85;
}

.lc-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}
.lc-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 999px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* 玻璃浏览器插画 */
.lc-mockup {
  align-self: flex-end;
  width: 188px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.lc-mockup__bar {
  display: flex;
  gap: 5px;
  margin-bottom: 9px;
}
.lc-mockup__bar span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
}
.lc-mockup__body {
  display: flex;
  gap: 8px;
}
.lc-mockup__side {
  width: 34px;
  height: 62px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
}
.lc-mockup__content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.lc-mockup__wide {
  grid-column: 1 / -1;
  height: 26px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.26);
}
.lc-mockup__box {
  height: 30px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.18);
}

.lc-brand__foot {
  font-size: 11.5px;
  opacity: 0.8;
}

/* ==================== 右侧表单 ==================== */
.lc-form {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  padding: 28px 38px 24px;
  background: var(--el-bg-color);
}
.lc-form__head {
  text-align: center;
}
.lc-form__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.lc-form__logo {
  width: 36px;
  height: 36px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: none;
}
.lc-form__brandname {
  font-size: 16px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}
.lc-form__tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  padding: 5px 14px;
  font-size: 12.5px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 999px;
}
.lc-form__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.lc-form__title {
  margin: 16px 0 0;
  font-size: 27px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  letter-spacing: 2px;
}
.lc-form__prompt {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.lc-form__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
/* 隐藏 ReLoginForm 自带的重复头部（本页已提供 tab/标题/提示） */
.lc-form__body :deep(.form-header) {
  display: none;
}
.lc-form__body :deep(.koi-login-form) {
  width: 100%;
}
/* 登录按钮：蓝色横向渐变 */
.lc-form__body :deep(.login-btn) {
  border: none;
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);

  &:hover {
    background: linear-gradient(90deg, var(--el-color-primary-light-2) 0%, var(--el-color-primary-light-4) 100%);
  }
}

/* 备案号固定在页面底部 */
.lc-icp {
  position: absolute;
  bottom: 14px;
  left: 0;
  right: 0;
  z-index: 2;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  opacity: 0.8;
}

/* ==================== 响应式：窄屏只留表单 ==================== */
@media (max-width: 860px) {
  .lc-card {
    width: 440px;
    max-width: 94vw;
    height: auto;
    max-height: none;
  }
  .lc-brand {
    display: none;
  }
  .lc-form {
    flex: 1 1 auto;
    padding: 30px 28px;
  }
}
</style>
