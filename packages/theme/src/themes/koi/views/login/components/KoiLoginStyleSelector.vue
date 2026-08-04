<template>
  <div class="koi-login-style-selector" :class="`cols-${columns}`">
    <div
      v-for="opt in styleOptions"
      :key="opt.value"
      class="style-option"
      :class="{ 'is-active': loginStyle === opt.value }"
      @click="selectStyle(opt.value)"
    >
      <div class="style-option__preview" :class="`style-preview--${opt.preview}`">
        <!-- 臻享双栏 -->
        <div v-if="opt.preview === 'dual'" class="preview-inner">
          <div class="preview-block preview-block--aside"></div>
          <div class="preview-form">
            <span class="preview-line preview-line--title"></span>
            <span class="preview-line"></span>
            <span class="preview-btn"></span>
          </div>
        </div>
        <!-- 动感玻璃 -->
        <div v-else-if="opt.preview === 'glass'" class="preview-inner preview-inner--center">
          <div class="preview-orb preview-orb--1"></div>
          <div class="preview-orb preview-orb--2"></div>
          <div class="preview-card preview-card--glass">
            <span class="preview-line preview-line--title"></span>
            <span class="preview-line"></span>
            <span class="preview-btn"></span>
          </div>
        </div>
        <!-- 滑动登录 -->
        <div v-else-if="opt.preview === 'slide'" class="preview-inner">
          <div class="preview-panel preview-panel--brand"></div>
          <div class="preview-panel preview-panel--form">
            <span class="preview-line preview-line--title"></span>
            <span class="preview-line"></span>
            <span class="preview-btn"></span>
          </div>
        </div>
        <!-- 气泡简约 -->
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
        <!-- 分屏沉浸 -->
        <div v-else-if="opt.preview === 'immersive'" class="preview-inner">
          <div class="preview-block preview-block--immersive"></div>
          <div class="preview-form">
            <span class="preview-line preview-line--title"></span>
            <span class="preview-line"></span>
            <span class="preview-btn"></span>
          </div>
        </div>
        <!-- 经典点阵 -->
        <div v-else-if="opt.preview === 'classic'" class="preview-inner preview-inner--grid">
          <div class="preview-terminal">
            <div class="preview-terminal__dots">
              <span></span><span></span><span></span>
            </div>
            <span class="preview-line"></span>
            <span class="preview-line preview-line--short"></span>
            <span class="preview-btn"></span>
          </div>
        </div>
        <!-- 极简终端 -->
        <div v-else class="preview-inner preview-inner--center">
          <div class="preview-terminal preview-terminal--mono">
            <span class="preview-line"></span>
            <span class="preview-line preview-line--short"></span>
            <span class="preview-btn"></span>
          </div>
        </div>
      </div>

      <div class="style-option__info">
        <span class="style-option__label">{{ opt.label }}</span>
      </div>
      <el-icon v-if="loginStyle === opt.value" class="style-option__check"><Check /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import useGlobalStore from "@repo/pinia/modules/global";
import { loginStyleOptions } from "../loginStyles";

withDefaults(
  defineProps<{
    /** 网格列数（登录页弹层 3 列 / 设置面板 2 列） */
    columns?: number;
  }>(),
  { columns: 2 },
);

const globalStore = useGlobalStore();
const { loginStyle } = storeToRefs(globalStore);
const styleOptions = loginStyleOptions;

/** 选择登录页风格 */
const selectStyle = (value: string) => {
  globalStore.setGlobalState("loginStyle", value);
};
</script>

<style lang="scss" scoped>
.koi-login-style-selector {
  display: grid;
  gap: 8px;

  &.cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .style-option {
    position: relative;
    padding: 6px;
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }

    &:active {
      transform: scale(0.97);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }

    &__preview {
      height: 48px;
      margin-bottom: 5px;
      overflow: hidden;
      border-radius: 6px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);

      .preview-inner {
        display: flex;
        height: 100%;
        padding: 4px;
        box-sizing: border-box;
        gap: 3px;

        &--center {
          align-items: center;
          justify-content: center;
          position: relative;
        }

        &--grid {
          background: repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.04) 6px),
                      repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.04) 6px);
        }
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

        &--title {
          width: 60%;
        }

        &--short {
          width: 40%;
        }
      }

      .preview-btn {
        width: 40%;
        height: 7px;
        margin-top: auto;
        background: var(--el-color-primary, #409eff);
        border-radius: 4px;
      }

      .preview-orb {
        position: absolute;
        border-radius: 50%;
        opacity: 0.4;

        &--1 {
          width: 22px;
          height: 22px;
          background: var(--el-color-primary, #409eff);
          top: 6px;
          left: 8px;
          filter: blur(5px);
        }

        &--2 {
          width: 16px;
          height: 16px;
          background: #a855f7;
          bottom: 6px;
          right: 10px;
          filter: blur(4px);
        }
      }

      .preview-card {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 5px 7px;
        border-radius: 5px;
        width: 55%;

        &--glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        &--center {
          background: #fff;
          border: 1px solid #e4e7ed;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
      }

      .preview-panel {
        flex: 1;
        border-radius: 3px;
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding: 4px;

        &--brand {
          background: linear-gradient(135deg, #c0c4cc, #dcdfe6);
        }

        &--form {
          background: #fff;
          border: 1px solid #e4e7ed;
        }
      }

      .preview-bubble {
        position: absolute;
        border-radius: 50%;
        opacity: 0.3;

        &--1 {
          width: 12px;
          height: 12px;
          background: var(--el-color-primary, #409eff);
          top: 6px;
          left: 14px;
        }

        &--2 {
          width: 8px;
          height: 8px;
          background: #a855f7;
          top: 12px;
          right: 20px;
        }

        &--3 {
          width: 9px;
          height: 9px;
          background: #06b6d4;
          bottom: 8px;
          left: 28px;
        }
      }

      .preview-terminal {
        width: 70%;
        background: #1a1a2e;
        border-radius: 4px;
        padding: 4px 5px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        &--mono {
          width: 55%;
          padding: 6px 7px;
        }

        &__dots {
          display: flex;
          gap: 2px;
          margin-bottom: 2px;

          span {
            width: 4px;
            height: 4px;
            border-radius: 50%;

            &:nth-child(1) { background: #ff5f57; }
            &:nth-child(2) { background: #febc2e; }
            &:nth-child(3) { background: #28c840; }
          }
        }

        .preview-line {
          background: #4a5568;
          height: 3px;
        }

        .preview-btn {
          height: 5px;
          width: 50%;
          margin-top: 2px;
        }
      }
    }

    &__info {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__label {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &__check {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 14px;
      color: var(--el-color-primary);
    }
  }
}
</style>
