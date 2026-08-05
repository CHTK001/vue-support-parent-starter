<template>
  <div
    :class="[
      're-switch-card',
      { 're-switch-card--active': cardActiveBorder && isActive, 're-switch-card--hidden': cardHideSwitch },
    ]"
  >
    <div class="re-switch-card__body">
      <div v-if="title || tip" class="re-switch-card__head">
        <span class="re-switch-card__title">{{ title }}</span>
        <span v-if="sub" class="re-switch-card__sub">{{ sub }}</span>
        <el-tooltip v-if="tip" :content="tip" placement="top">
          <el-icon class="re-switch-card__tip"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
      <p v-if="description" class="re-switch-card__desc">{{ description }}</p>
    </div>
    <ElSwitch v-if="!cardHideSwitch" v-bind="$attrs" v-model="modelValue" />
  </div>
</template>

<script setup lang="ts">
import { ElSwitch } from "element-plus";
import { computed } from "vue";

defineOptions({ name: "CardReSwitch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    title?: string;
    sub?: string;
    tip?: string;
    description?: string;
    cardActiveBorder?: boolean;
    cardHideSwitch?: boolean;
  }>(),
  {
    cardActiveBorder: true,
    cardHideSwitch: false,
  },
);

const { cardActiveBorder, cardHideSwitch } = props;

const modelValue = defineModel<boolean | string | number>({ default: false });
const isActive = computed(() => Boolean(modelValue.value));
</script>

<style lang="scss" scoped>
.re-switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  padding: 14px 16px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  transition:
    border-color 0.25s ease,
    border-width 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.25s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--el-box-shadow-light);
  }

  &--active {
    border: 2px solid var(--el-color-primary);
    padding: 13px 15px;
    background: var(--el-color-primary-light-9);
    box-shadow:
      0 0 0 3px var(--el-color-primary-light-8),
      var(--el-box-shadow-light);

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: var(--el-color-primary);
      border-radius: 0 3px 3px 0;
    }

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 3px var(--el-color-primary-light-7),
        var(--el-box-shadow-light);
    }
  }

  &--hidden {
    gap: 0;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__head {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sub {
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
    letter-spacing: 0.3px;
    padding: 1px 6px;
    background: var(--el-fill-color);
    border-radius: 4px;
    line-height: 1.4;
    align-self: center;
    flex-shrink: 0;
  }

  &__tip {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    cursor: help;
    transition: color 0.2s ease;
    align-self: center;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    white-space: normal;
  }
}
</style>