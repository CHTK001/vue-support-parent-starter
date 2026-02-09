<template>
  <div
    class="sc-card-input"
    :class="{
      'is-disabled': disabled,
      [`sc-card-input--${size}`]: size
    }"
  >
    <div
      v-for="option in options"
      :key="String(option.value)"
      class="sc-card-input__item"
      :class="{
        'is-active': modelValue === option.value,
        'is-disabled': option.disabled || disabled
      }"
      @click="handleSelect(option)"
    >
      <div class="sc-card-input__content">
        <div v-if="option.icon" class="sc-card-input__icon">
          <IconifyIconOnline :icon="option.icon" />
        </div>
        <div class="sc-card-input__label">{{ option.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import { IconifyIconOnline } from "@repo/components/ReIcon";

export interface CardOption {
  label: string
  value: string | number
  icon?: string
  disabled?: boolean
}

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default',
    validator: (val: string) => ['small', 'default', 'large'].includes(val)
  },
  options: {
    type: Array as PropType<CardOption[]>,
    default: () => []
  },
  activeColor: {
    type: String,
    default: ''
  },
  inactiveColor: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleSelect = (option: CardOption) => {
  if (option.disabled || props.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
}
</script>

<style lang="scss" scoped>
.sc-card-input {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  &__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--el-border-color);
    background-color: var(--el-fill-color-blank);
    cursor: pointer;
    transition: all 0.3s;

    &:hover:not(.is-disabled) {
      border-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.6;
      color: var(--el-text-color-disabled);
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    font-size: 24px;
  }

  &__label {
    font-size: 14px;
    line-height: 1.4;
    text-align: center;
  }

  // 尺寸变体
  &--small {
    .sc-card-input__item {
      min-width: 60px;
      padding: 8px;
    }

    .sc-card-input__icon {
      font-size: 18px;
    }

    .sc-card-input__label {
      font-size: 12px;
    }
  }

  &--large {
    .sc-card-input__item {
      min-width: 100px;
      padding: 16px;
    }

    .sc-card-input__icon {
      font-size: 32px;
    }

    .sc-card-input__label {
      font-size: 16px;
    }
  }
}
</style> 