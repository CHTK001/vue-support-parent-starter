<template>
  <div class="koi-login-style-picker">
    <el-popover
      placement="bottom-end"
      :width="360"
      trigger="click"
      :show-arrow="false"
      :offset="8"
      popper-class="login-style-popover"
      popper-style="padding: 0; border-radius: 14px;"
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
              <div class="preview-inner">
                <div class="preview-block preview-block--aside"></div>
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
  .popover-panel {
    padding: 16px;
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
      }

      .preview-block--aside {
        width: 24%;
        background: #c0c4cc;
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
      }

      .preview-btn {
        width: 40%;
        height: 10px;
        margin-top: auto;
        background: var(--el-color-primary, #409eff);
        border-radius: 5px;
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
