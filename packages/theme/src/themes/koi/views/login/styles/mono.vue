<template>
  <div class="login-page login-mono w-screen h-screen overflow-hidden flex items-center justify-center relative">
    <!-- 点阵背景（无网格叠加） -->
    <div class="mono-dots" aria-hidden="true"></div>

    <!-- 左上角品牌 -->
    <div class="mono-brand pos-absolute top-8 left-8 flex items-center gap-10px z-10">
      <div class="mono-brand-logo">
        <img class="login-logo" :src="resolvedLogoUrl" :alt="loginConfig.brandName" />
      </div>
      <span class="mono-brand-name text-16px font-700 text-white/90">{{ translateConfigText(loginConfig.title) }}</span>
    </div>

    <!-- 居中终端面板 -->
    <div class="mono-shell relative z-10 w-520px max-w-94vw rounded-20px overflow-hidden">
      <!-- 终端标题栏 -->
      <div class="mono-shell-bar flex items-center gap-10px px-18px py-12px">
        <span class="mono-dot mono-dot--red"></span>
        <span class="mono-dot mono-dot--yellow"></span>
        <span class="mono-dot mono-dot--green"></span>
        <span class="mono-shell-title ml-14px text-13px font-500">{{ translateConfigText(loginConfig.title) }}</span>
      </div>

      <!-- 终端内容 -->
      <div class="mono-shell-body p-36px">
        <div class="mono-prompt text-14px m-b-28px">
          <span class="mono-prompt-symbol">$</span>
          <span class="ml-8px text-white/50">{{ translateConfigText(loginConfig.welcome) }}</span>
        </div>

        <ReLoginForm :show-mobile-brand="false" form-class="mono-form" />

        <div class="mono-footer m-t-28px flex items-center justify-between text-12px text-white/30">
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
import { translateConfigText } from "@repo/languages";
import ReLoginForm from "../components/ReLoginForm.vue";

// loginConfig 跟随 getConfig().login 响应式变化；loadDefaultSetting() 后自动同步
const loginConfig = toRef(getConfig(), "login");

// 品牌 Logo：支持 app.yaml 配置（本地资源路径或外部 URL）
const resolvedLogoUrl = computed(() => resolveAssetUrl(loginConfig.value.logoUrl));
</script>

<style lang="scss" scoped>
.login-mono {
  background: #000;
}

/* 点阵（更大间距，更明显） */
.mono-dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1.8px, transparent 1.8px);
  background-size: 32px 32px;
  opacity: 0.7;
  pointer-events: none;
}

/* 品牌 */
.mono-brand {
  &-logo {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }
}

/* 终端面板 */
.mono-shell {
  background: #0a0a0a;
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
}

.mono-shell-bar {
  background: #111;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .mono-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;

    &--red { background: #f87171; }
    &--yellow { background: #fbbf24; }
    &--green { background: #34d399; }
  }

  .mono-shell-title {
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 1.5px;
  }
}

.mono-shell-body {
  background: #0a0a0a;
}

.mono-prompt-symbol {
  color: #34d399;
  font-weight: 700;
}

/* 终端风格表单 */
.mono-form {
  :deep(.login-input) {
    .el-input__wrapper {
      border-radius: 8px;
      background: #111;
      border-color: rgba(255, 255, 255, 0.1);
      box-shadow: none;

      &:hover,
      &.is-focus {
        border-color: rgba(255, 255, 255, 0.25);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
      }

      .el-input__inner {
        color: rgba(255, 255, 255, 0.85);
      }

      .el-input__prefix .el-icon {
        color: rgba(255, 255, 255, 0.35);
      }
    }
  }

  :deep(.form-header) {
    h3 {
      color: rgba(255, 255, 255, 0.9) !important;
    }
    p {
      color: rgba(255, 255, 255, 0.4) !important;
    }
  }

  :deep(.login-btn) {
    background: #fff;
    color: #000;
    border-color: #fff;
    font-weight: 700;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.9);
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
