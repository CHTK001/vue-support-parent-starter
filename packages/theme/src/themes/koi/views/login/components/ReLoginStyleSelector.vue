<template>
  <div class="koi-login-style-selector" :class="`cols-${columns}`">
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
</template>

<script setup lang="ts">
/**
 * 登录页样式选择器（设置抽屉）
 *
 * 卡片式：预览缩略图（LoginStylePreview）+ 居中名称；
 * 选中态 = 缩略图主色描边 + 名称主色加粗；全部走 koi 令牌（--el-* / --el-radius-*）。
 */
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import useGlobalStore from "@repo/pinia/modules/global";
import { loginStyleOptions } from "../loginStyles";
import LoginStylePreview from "./LoginStylePreview.vue";

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
  gap: 12px;
  padding: 2px;

  &.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* ── 卡片：白底 + 16px 圆角 + 轻投影（对齐设计稿）── */
.style-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  transition:
    transform var(--el-transition-duration, 0.2s) ease,
    border-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;

  &:hover:not(.is-active) {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
    transform: translateY(-2px);
  }

  &:active:not(.is-active) {
    transform: translateY(-2px) scale(0.985);
  }

  /* ── 预览框：16:10 缩略图，选中时主色描边 ── */
  &__preview {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    background: var(--el-fill-color-lighter);
    border: 2px solid transparent;
    border-radius: var(--el-radius-lg, 12px);
    transition: border-color var(--el-transition-duration, 0.2s) ease;
  }

  &__label {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-text-color-primary);
    text-align: center;
    transition: color var(--el-transition-duration, 0.2s) ease;
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--el-border-color-lighter));

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
</style>
