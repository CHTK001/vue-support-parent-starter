<script setup lang="ts">
/**
 * ReSwitch —— 卡片式开关组件
 *
 * 封装 el-switch，支持卡片式布局（设置面板常用）：
 *   <ReSwitch title="菜单手风琴" tip="菜单展开[启用-单个/关闭-多个]" v-model="uniqueOpened" />
 *
 * 特性：
 *  - title：左侧小标题
 *  - tip：标题旁的提示图标（tooltip）
 *  - card：卡片式容器（默认开启，false 为纯行内开关）
 *  - 透传 el-switch 全部属性（active-text / inactive-text 等）
 */
import { ElSwitch } from "element-plus";

defineOptions({ name: "ReSwitch", inheritAttrs: true });

const props = defineProps<{
  /** 小标题 */
  title?: string;
  /** 提示文案（标题旁问号图标） */
  tip?: string;
  /** 卡片式容器（默认 true） */
  card?: boolean;
  /** 卡片描述（副标题，可选） */
  description?: string;
}>();

// 卡片式容器默认开启（组件注释约定），解构并应用默认值
const { card = true } = props;

const modelValue = defineModel<boolean | string | number>({ default: false });
</script>

<template>
  <div :class="['re-switch', { 're-switch--card': card }]">
    <div v-if="title || tip" class="re-switch__head">
      <span class="re-switch__title">{{ title }}</span>
      <el-tooltip v-if="tip" :content="tip" placement="top">
        <el-icon class="re-switch__tip"><QuestionFilled /></el-icon>
      </el-tooltip>
      <span v-if="description" class="re-switch__desc">{{ description }}</span>
    </div>
    <ElSwitch v-bind="$attrs" v-model="modelValue" />
  </div>
</template>

<style lang="scss" scoped>
.re-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  box-sizing: border-box;

  &--card {
    padding: 12px;
    background: var(--el-fill-color-blank, var(--el-bg-color));
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--el-border-color));
    }
  }

  &__head {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: 6px;
  }

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tip {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    cursor: help;
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
