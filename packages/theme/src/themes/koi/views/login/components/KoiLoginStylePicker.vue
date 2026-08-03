<template>
  <div class="koi-login-style-picker">
    <el-popover
      placement="bottom"
      :width="320"
      trigger="hover"
      :offset="8"
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
            </div>
            <div class="style-option__info">
              <span class="style-option__label">{{ opt.label }}</span>
              <span class="style-option__desc">{{ opt.desc }}</span>
            </div>
            <el-icon v-if="loginStyle === opt.value" class="style-option__check"><Check /></el-icon>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { Check, Grid } from "@element-plus/icons-vue";
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;

  .popover-panel {
    padding: 14px;
  }

  .popover-header {
    margin-bottom: 14px;

    .popover-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .popover-desc {
      margin-top: 4px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }

  .popover-body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    max-height: 420px;
    overflow-y: auto;
  }

  .style-option {
    position: relative;
    padding: 8px;
    cursor: pointer;
    background: var(--el-fill-color-lighter, var(--el-bg-color));
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

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
      height: 72px;
      margin-bottom: 8px;
      overflow: hidden;
      border-radius: 8px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);

      .preview-inner {
        display: flex;
        height: 100%;
        padding: 6px;
        box-sizing: border-box;
        gap: 4px;

        &--center {
          align-items: center;
          justify-content: center;
          position: relative;
        }

        &--grid {
          background: repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(0,0,0,0.04) 7px, rgba(0,0,0,0.04) 8px),
                      repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(0,0,0,0.04) 7px, rgba(0,0,0,0.04) 8px);
        }
      }

      /* 双栏 - 侧边栏 */
      .preview-block--aside {
        width: 24%;
        background: #c0c4cc;
        border-radius: 4px;
      }

      /* 分屏沉浸 - 更宽的左侧 */
      .preview-block--immersive {
        width: 45%;
        background: linear-gradient(135deg, #909399, #c0c4cc);
        border-radius: 4px;
      }

      .preview-form {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 4px;
      }

      .preview-line {
        display: block;
        height: 6px;
        background: #909399;
        border-radius: 3px;

        &--title {
          width: 60%;
        }

        &--short {
          width: 40%;
        }
      }

      .preview-btn {
        width: 40%;
        height: 10px;
        margin-top: auto;
        background: var(--el-color-primary, #409eff);
        border-radius: 5px;
      }

      /* 动感玻璃 - 光斑 */
      .preview-orb {
        position: absolute;
        border-radius: 50%;
        opacity: 0.4;

        &--1 {
          width: 30px;
          height: 30px;
          background: var(--el-color-primary, #409eff);
          top: 8px;
          left: 12px;
          filter: blur(6px);
        }

        &--2 {
          width: 22px;
          height: 22px;
          background: #a855f7;
          bottom: 10px;
          right: 16px;
          filter: blur(5px);
        }
      }

      .preview-card {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 10px;
        border-radius: 6px;
        width: 55%;

        &--glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        &--center {
          background: #fff;
          border: 1px solid #e4e7ed;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      }

      /* 滑动登录 - 双面板 */
      .preview-panel {
        flex: 1;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 6px;

        &--brand {
          background: linear-gradient(135deg, #c0c4cc, #dcdfe6);
        }

        &--form {
          background: #fff;
          border: 1px solid #e4e7ed;
        }
      }

      /* 气泡 - 浮动圆 */
      .preview-bubble {
        position: absolute;
        border-radius: 50%;
        opacity: 0.3;

        &--1 {
          width: 16px;
          height: 16px;
          background: var(--el-color-primary, #409eff);
          top: 10px;
          left: 20px;
        }

        &--2 {
          width: 10px;
          height: 10px;
          background: #a855f7;
          top: 18px;
          right: 30px;
        }

        &--3 {
          width: 12px;
          height: 12px;
          background: #06b6d4;
          bottom: 12px;
          left: 40px;
        }
      }

      /* 经典点阵 - 终端面板 */
      .preview-terminal {
        width: 70%;
        background: #1a1a2e;
        border-radius: 4px;
        padding: 5px 7px;
        display: flex;
        flex-direction: column;
        gap: 3px;

        &__dots {
          display: flex;
          gap: 3px;
          margin-bottom: 2px;

          span {
            width: 5px;
            height: 5px;
            border-radius: 50%;

            &:nth-child(1) { background: #ff5f57; }
            &:nth-child(2) { background: #febc2e; }
            &:nth-child(3) { background: #28c840; }
          }
        }

        .preview-line {
          background: #4a5568;
          height: 4px;
        }

        .preview-btn {
          height: 7px;
          width: 50%;
          margin-top: 2px;
        }
      }
    }

    &__info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &__desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &__check {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }
}
</style>
