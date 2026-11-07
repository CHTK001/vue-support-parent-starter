<template>
  <div class="koi-login-type-picker">
    <div class="login-type-cards" role="radiogroup">
      <button
        v-for="item in options"
        :key="item.type"
        type="button"
        class="login-type-card"
        :class="{ 'is-active': modelValue === item.type }"
        role="radio"
        :aria-checked="modelValue === item.type"
        :disabled="disabled"
        @click="select(item.type)"
      >
        <span class="login-type-card__icon">
          <el-icon :size="20"><component :is="resolveIcon(item.icon)" /></el-icon>
        </span>
        <span class="login-type-card__text">
          <span class="login-type-card__title">{{ translate(item.title) }}</span>
          <span v-if="item.description" class="login-type-card__desc">{{ translate(item.description) }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录类型选择卡片（登录页表单顶部）
 *
 * <p>登录类型来自 app.yaml 的 {@code loginConfig.types} 数组，数组顺序即卡片顺序。
 * 选中项决定登录请求发往哪个后端地址（{@link LoginTypeConfig.baseUrl}）。</p>
 *
 * <p><b>只有一个类型时不渲染</b>：由调用方用 {@code v-if="loginTypes.length > 1"} 控制，
 * 组件本身不做隐藏，避免 watch/焦点逻辑在空 DOM 上跑。</p>
 */
import { computed } from "vue";
import { User, OfficeBuilding, Monitor, Setting, Grid } from "@element-plus/icons-vue";
import type { Component } from "vue";
import { getConfig } from "@repo/config";
import type { LoginTypeConfig } from "@repo/config";
import { translateConfigText } from "@repo/languages";

const props = withDefaults(
  defineProps<{
    /** 当前选中的类型标识 */
    modelValue: string;
    /** 提交中：禁止切换，避免请求发到旧地址 */
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

/** 图标名 → 组件。与 yaml 里能写的图标名一一对应，未命中的回落 Grid */
const ICONS: Record<string, Component> = {
  User,
  OfficeBuilding,
  Monitor,
  Setting,
  Grid,
};

const options = computed<LoginTypeConfig[]>(() => {
  const types = getConfig().login?.types;
  return Array.isArray(types) && types.length ? types : [];
});

const resolveIcon = (name?: string): Component => (name && ICONS[name]) || Grid;

/** 标题/描述允许写成 i18n key，也允许直接写中文 */
const translate = (text?: string): string => (text ? translateConfigText(text) : "");

const select = (type: string) => {
  if (props.disabled || type === props.modelValue) return;
  emit("update:modelValue", type);
};
</script>

<style lang="scss" scoped>
.koi-login-type-picker {
  width: 100%;
  margin-bottom: 20px;
}

.login-type-cards {
  display: grid;
  // 卡片数不定：两列自适应，1 项时自动占满（调用方已保证 >1 才渲染）
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 10px;
}

.login-type-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition:
    border-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease,
    transform var(--el-transition-duration, 0.2s) ease;

  &:hover:not(:disabled):not(.is-active) {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: var(--el-radius-md, 8px);
    transition: color var(--el-transition-duration, 0.2s) ease;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc {
    overflow: hidden;
    font-size: 11px;
    line-height: 1.3;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);

    .login-type-card__icon {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    }

    .login-type-card__title {
      color: var(--el-color-primary);
      font-weight: 700;
    }
  }
}
</style>
