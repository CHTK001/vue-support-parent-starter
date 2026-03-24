<template>
  <div
    class="sc-select-visual-card"
    :class="[
      `sc-select-visual-card--${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading
      }
    ]"
  >
    <!-- 图标区域 -->
    <div v-if="icon" class="sc-select-visual-card__icon">
      <IconifyIconOnline :icon="icon" />
    </div>

    <!-- 内容区域 -->
    <div class="sc-select-visual-card__content">
      <div class="sc-select-visual-card__label">{{ label }}</div>
      <div v-if="description" class="sc-select-visual-card__desc">{{ description }}</div>
    </div>

    <!-- 操作区域 -->
    <div class="sc-select-visual-card__action">
      <el-select
        v-model="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :size="size === 'large' ? 'default' : 'small'"
        :clearable="clearable"
        style="width: 120px"
        @change="handleChange"
      >
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

interface OptionItem {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

const props = defineProps<{
  modelValue: string | number | boolean;
  options: OptionItem[];
  label?: string;
  description?: string;
  icon?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: "large" | "default" | "small";
  clearable?: boolean;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const handleChange = (val: any) => {
  emit("change", val);
};
</script>

<style lang="scss" scoped>
.sc-select-visual-card {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: all 0.3s;
  margin-bottom: 12px;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-light);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 12px;
    border-radius: 8px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 18px;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.2;
  }

  &__action {
    margin-left: 16px;
  }

  &--small {
    padding: 8px 12px;
    
    .sc-select-visual-card__icon {
      width: 24px;
      height: 24px;
      font-size: 14px;
      border-radius: 6px;
    }
    
    .sc-select-visual-card__label {
      font-size: 13px;
    }
  }

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--el-fill-color-light);
  }
}
</style>
