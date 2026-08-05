<template>
  <div class="koi-login-style-picker">
    <el-popover
      placement="bottom-end"
      :width="400"
      trigger="hover"
      :offset="12"
      popper-class="login-style-popover"
      popper-style="padding: 0; border-radius: 10px;"
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
            class="style-option"
            :class="{ 'is-active': loginStyle === opt.value }"
            @click="selectStyle(opt.value)"
          >
            <div class="style-option__badge" :class="{ 'is-active': loginStyle === opt.value }"></div>
            <div class="style-option__preview" :class="`style-preview--${opt.preview}`">
              <div v-if="opt.preview === 'dual'" class="preview-inner">
                <div class="preview-block preview-block--aside"></div>
                <div class="preview-form">
                  <span class="preview-line preview-line--title"></span>
                  <span class="preview-line"></span>
                  <span class="preview-btn"></span>
                </div>
              </div>
              <div v-else-if="opt.preview === 'center'" class="preview-inner preview-inner--center">
                <div class="preview-bubble preview-bubble--1"></div>
                <div class="preview-bubble preview-bubble--2"></div>
                <div class="preview-bubble preview-bubble--3"></div>
                <div class="preview-card preview-card--center">
                  <span class="preview-line preview-line--title"></span>
                  <span class="preview-line"></span>
                  <span class="preview-btn"></span>
                </div>
              </div>
              <div v-else-if="opt.preview === 'immersive'" class="preview-inner">
                <div class="preview-block preview-block--immersive"></div>
                <div class="preview-form">
                  <span class="preview-line preview-line--title"></span>
                  <span class="preview-line"></span>
                  <span class="preview-btn"></span>
                </div>
              </div>
            </div>
            <div class="style-option__info">
              <span class="style-option__label">{{ opt.label }}</span>
              <span class="style-option__desc">{{ opt.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { Grid } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@repo/pinia/modules/global";
import { loginStyleOptions } from "../loginStyles";

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
  border-radius: 6px;
  transition: all 0.5s ease;

  .trigger-icon {
    color: var(--el-text-color-primary);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);

    .trigger-icon {
      transform: scale(1.05);
    }
  }

  &:active {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(0.94);

    .trigger-icon {
      transform: scale(0.9);
    }
  }
}

html.dark {
  .style-picker-trigger {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>

<style lang="scss">
.login-style-popover {
  padding: 12px 14px !important;
  border-radius: 12px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--el-border-color-lighter) !important;

  .popover-header {
    padding: 0 4px 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 12px;

    .popover-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .popover-desc {
      margin-top: 4px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      line-height: 1.5;
    }
  }

  .popover-body {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
  }

  .style-option {
    position: relative;
    padding: 10px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    transition:
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.2s ease,
      background-color 0.25s ease;

    &:hover:not(.is-active) {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-10, var(--el-fill-color));
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.1);
    }

    &:active:not(.is-active) {
      transform: translateY(-2px) scale(0.98);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: linear-gradient(135deg, var(--el-color-primary-light-10, var(--el-color-primary-light-9)) 0%, var(--el-bg-color) 60%);
      box-shadow:
        0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1),
        0 4px 16px rgba(var(--el-color-primary-rgb), 0.18);
      transform: translateY(-2px);
      cursor: not-allowed;

      .style-option__label {
        color: var(--el-color-primary);
        font-weight: 700;
      }

      .style-option__preview {
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
      }
    }

    &__badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 0;
      height: 0;
      opacity: 0;
      border-radius: 50%;
      background: var(--el-color-primary);
      transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      z-index: 5;
      box-shadow: 0 2px 6px rgba(var(--el-color-primary-rgb), 0.3);
    }

    &__badge::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 7px;
      height: 4px;
      border: 2px solid #fff;
      border-top: none;
      border-right: none;
      transform: translate(-50%, -60%) rotate(-45deg);
      opacity: 0;
      transition: opacity 0.2s ease 0.15s;
    }

    &.is-active &__badge {
      width: 22px;
      height: 22px;
      opacity: 1;
      &::after {
        opacity: 1;
      }
    }

    &__preview {
      height: 56px;
      margin-bottom: 8px;
      overflow: hidden;
      border-radius: 6px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
      transition: box-shadow 0.25s ease;
      border: 1px solid var(--el-border-color-lighter);
    }

    html.dark &__preview {
      background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .preview-inner {
      display: flex;
      height: 100%;
      padding: 4px;
      box-sizing: border-box;
      gap: 3px;
    }

    .preview-inner--center {
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .preview-block--aside {
      width: 24%;
      background: #c0c4cc;
      border-radius: 3px;
    }
    .preview-block--immersive {
      width: 45%;
      background: linear-gradient(135deg, #909399, #c0c4cc);
      border-radius: 3px;
    }
    .preview-form {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 3px;
    }
    .preview-line {
      display: block;
      height: 4px;
      background: #909399;
      border-radius: 2px;
    }
    .preview-line--title {
      width: 60%;
    }
    .preview-btn {
      width: 40%;
      height: 7px;
      margin-top: auto;
      background: var(--el-color-primary, #409eff);
      border-radius: 4px;
    }

    .preview-bubble {
      position: absolute;
      border-radius: 50%;
      opacity: 0.3;
    }
    .preview-bubble--1 {
      width: 12px; height: 12px;
      background: var(--el-color-primary, #409eff);
      top: 6px; left: 14px;
    }
    .preview-bubble--2 {
      width: 8px; height: 8px;
      background: #a855f7;
      top: 12px; right: 20px;
    }
    .preview-bubble--3 {
      width: 9px; height: 9px;
      background: #06b6d4;
      bottom: 8px; left: 28px;
    }

    .preview-card {
      position: relative; z-index: 1;
      display: flex; flex-direction: column;
      gap: 3px; padding: 5px 7px;
      border-radius: 5px; width: 55%;
      background: #fff;
      border: 1px solid #e4e7ed;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .preview-panel {
      flex: 1;
      border-radius: 3px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 4px;
    }
    .preview-panel--brand {
      background: linear-gradient(135deg, #c0c4cc, #dcdfe6);
    }
    .preview-panel--form {
      background: #fff;
      border: 1px solid #e4e7ed;
    }

    &__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-right: 26px;
    }

    &__label {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      transition: color 0.25s ease;
    }

    &__desc {
      font-size: 10px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
