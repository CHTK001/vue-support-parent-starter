<template>
  <div class="koi-login-style-selector" :class="`cols-${columns}`">
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
        <span class="style-option__label">{{ t(opt.label) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@repo/pinia/modules/global";
import { loginStyleOptions } from "../loginStyles";

withDefaults(
  defineProps<{
    columns?: number;
  }>(),
  { columns: 2 },
);

const { t } = useI18n();
const globalStore = useGlobalStore();
const { loginStyle } = storeToRefs(globalStore);
const styleOptions = loginStyleOptions;

const selectStyle = (value: string) => {
  globalStore.setGlobalState("loginStyle", value);
};
</script>

<style lang="scss" scoped>
.koi-login-style-selector {
  display: grid;
  gap: 10px;
  padding: 4px;

  &.cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.cols-3 {
    grid-template-columns: repeat(3, 1fr);
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
      border: 1px solid var(--el-border-color-lighter);
      transition: box-shadow 0.25s ease;
    }

    &__preview .preview-inner {
      display: flex;
      height: 100%;
      padding: 4px;
      box-sizing: border-box;
      gap: 3px;
    }

    &__preview .preview-inner--center {
      align-items: center;
      justify-content: center;
      position: relative;
    }

    &__preview .preview-bubble {
      position: absolute;
      border-radius: 50%;
      opacity: 0.3;
    }
    &__preview .preview-bubble--1 {
      width: 12px; height: 12px;
      background: var(--el-color-primary, #409eff);
      top: 6px; left: 14px;
    }
    &__preview .preview-bubble--2 {
      width: 8px; height: 8px;
      background: #a855f7;
      top: 12px; right: 20px;
    }
    &__preview .preview-bubble--3 {
      width: 9px; height: 9px;
      background: #06b6d4;
      bottom: 8px; left: 28px;
    }

    &__preview .preview-card {
      position: relative; z-index: 1;
      display: flex; flex-direction: column;
      gap: 3px; padding: 5px 7px;
      border-radius: 5px; width: 55%;
      background: #fff;
      border: 1px solid #e4e7ed;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    &__preview .preview-block--aside {
      width: 24%;
      background: #c0c4cc;
      border-radius: 3px;
    }
    &__preview .preview-block--immersive {
      width: 45%;
      background: linear-gradient(135deg, #909399, #c0c4cc);
      border-radius: 3px;
    }
    &__preview .preview-form {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 3px;
    }
    &__preview .preview-line {
      display: block;
      height: 4px;
      background: #909399;
      border-radius: 2px;
    }
    &__preview .preview-line--title {
      width: 60%;
    }
    &__preview .preview-btn {
      width: 40%;
      height: 7px;
      margin-top: auto;
      background: var(--el-color-primary, #409eff);
      border-radius: 4px;
    }

    &__preview .preview-panel {
      flex: 1;
      border-radius: 3px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 4px;
    }
    &__preview .preview-panel--brand {
      background: linear-gradient(135deg, #c0c4cc, #dcdfe6);
    }
    &__preview .preview-panel--form {
      background: #fff;
      border: 1px solid #e4e7ed;
    }

    &__info {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-right: 26px;
    }

    &__label {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      transition: color 0.25s ease;
    }
  }
}
</style>
