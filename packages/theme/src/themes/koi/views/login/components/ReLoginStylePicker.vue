<template>
  <div class="koi-login-style-picker">
    <el-popover
      placement="bottom-end"
      :width="400"
      trigger="hover"
      :offset="12"
      popper-class="login-style-popover"
      popper-style="padding: 0; border-radius: 16px;"
    >
      <template #reference>
        <div class="style-picker-trigger">
          <el-icon :size="18" class="trigger-icon"><Grid /></el-icon>
        </div>
      </template>

      <div class="popover-panel">
        <div class="popover-header">
          <div class="popover-title">{{ t("menu.login.style") }}</div>
          <div class="popover-desc">{{ t("menu.login.styleDesc") }}</div>
        </div>
        <div class="popover-body">
          <div
            v-for="opt in styleOptions"
            :key="opt.value"
            class="style-card"
            :class="{ 'is-active': loginStyle === opt.value }"
            role="button"
            :aria-pressed="loginStyle === opt.value"
            @click="selectStyle(opt.value)"
          >
            <div class="style-card__preview">
              <LoginStylePreview :type="opt.preview" />
            </div>
            <div class="style-card__label">{{ t(opt.label) }}</div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页样式选择弹层（登录页右上角）
 *
 * 与设置抽屉共用同一套缩略图（LoginStylePreview）与卡片视觉：
 * 预览 + 居中名称，选中态 = 缩略图主色描边 + 名称主色加粗，全部走 koi 令牌。
 */
import { Grid } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@repo/pinia/modules/global";
import { loginStyleOptions } from "../loginStyles";
import LoginStylePreview from "./LoginStylePreview.vue";

const { t } = useI18n();
const globalStore = useGlobalStore();

const { loginStyle } = storeToRefs(globalStore);
const styleOptions = loginStyleOptions;

/** 选择登录页风格 */
const selectStyle = (value: string) => {
  globalStore.setGlobalState("loginStyle", value);
};
</script>

<style lang="scss" scoped>
.koi-login-style-picker {
  display: inline-block;
}

.style-picker-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  cursor: pointer;
  border-radius: var(--el-radius-sm, 6px);
  transition: background-color var(--el-transition-duration, 0.2s) ease;

  .trigger-icon {
    color: var(--el-text-color-primary);
    transition: transform 0.4s ease;
  }

  &:hover {
    background: var(--el-header-icon-hover-bg-color, var(--el-fill-color-light));

    .trigger-icon {
      color: var(--el-color-primary);
      transform: scale(1.05);
    }
  }

  &:active {
    transform: scale(0.94);
  }
}
</style>

<style lang="scss">
.login-style-popover {
  padding: 12px 14px !important;
  background: var(--el-bg-color-overlay) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: var(--el-radius-xl, 16px) !important;
  box-shadow: var(--el-box-shadow-light) !important;

  .popover-header {
    padding: 0 4px 10px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .popover-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .popover-desc {
      margin-top: 4px;
      font-size: 11px;
      line-height: 1.5;
      color: var(--el-text-color-secondary);
    }
  }

  .popover-body {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
  }

  /* 卡片视觉与设置抽屉的选择器保持一致 */
  .style-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-lg, 12px);
    transition:
      transform var(--el-transition-duration, 0.2s) ease,
      border-color var(--el-transition-duration, 0.2s) ease;

    &:hover:not(.is-active) {
      border-color: var(--el-color-primary-light-5);
      transform: translateY(-2px);
    }

    &__preview {
      position: relative;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background: var(--el-fill-color-lighter);
      border: 2px solid transparent;
      border-radius: var(--el-radius-md, 8px);
      transition: border-color var(--el-transition-duration, 0.2s) ease;
    }

    &__label {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    &.is-active {
      .style-card__preview {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
      }

      .style-card__label {
        color: var(--el-color-primary);
        font-weight: 700;
      }
    }
  }
}
</style>
