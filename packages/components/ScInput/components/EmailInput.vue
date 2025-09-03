<template>
  <el-autocomplete
    v-model="currentValue"
    class="sc-email-input"
    type="email"
    v-bind="$attrs"
    :fetch-suggestions="queryEmail"
    :trigger-on-focus="false"
    @update:modelValue="handleUpdate"
    @change="handleChange"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
    @select="handleSelect"
  >
    <template #prefix v-if="showPrefix">
      <IconifyIconOnline :icon="prefixIcon || defaultPrefixIcon" class="sc-email-input__prefix-icon" />
    </template>
    <template v-for="(_, name) in $slots" v-if="name !== 'prefix'" #[name]="slotData" :key="name">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </el-autocomplete>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { queryEmail } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getDefaultIcon } from "../defaultIcons";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string;
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 最大输入长度
   */
  maxlength?: string | number;
  /**
   * 是否显示输入字数统计
   */
  showWordLimit?: boolean;
  /**
   * 输入框尺寸
   */
  size?: "large" | "default" | "small";
  /**
   * 输入框前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 输入框后缀图标
   */
  suffixIcon?: string;
  /**
   * 是否可清空
   */
  clearable?: boolean;
  /**
   * 自动获取焦点
   */
  autofocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "请输入邮箱地址",
  disabled: false,
  maxlength: undefined,
  showWordLimit: false,
  size: "default",
  prefixIcon: "",
  showPrefix: true,
  suffixIcon: "",
  clearable: true,
  autofocus: false
});

const emit = defineEmits(["update:modelValue", "change", "input", "focus", "blur", "clear", "select"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 默认前缀图标
const defaultPrefixIcon = computed(() => getDefaultIcon("email"));

/**
 * 处理值更新事件
 */
const handleUpdate = (value: string) => {
  emit("update:modelValue", value);
};

/**
 * 处理change事件
 */
const handleChange = (value: string) => {
  emit("change", value);
};

/**
 * 处理input事件
 */
const handleInput = (value: string) => {
  emit("input", value);
};

/**
 * 处理focus事件
 */
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

/**
 * 处理blur事件
 */
const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};

/**
 * 处理clear事件
 */
const handleClear = () => {
  emit("clear");
};

/**
 * 处理select事件
 */
const handleSelect = (item: any) => {
  emit("select", item);
};
</script>

<style lang="scss" scoped>
.sc-email-input {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 现代化的邮箱输入框样式
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }

    &.is-focus {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      transform: translateY(-2px);
    }
  }

  // 悬停效果
  &:hover {
    transform: translateY(-1px);
  }

  // 聚焦状态
  &:focus-within {
    transform: translateY(-2px);
  }

  // 禁用状态
  &.is-disabled {
    opacity: 0.6;
    transform: none !important;

    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      transform: none !important;
    }
  }

  &__prefix-icon {
    color: var(--el-text-color-placeholder);
    font-size: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      color: var(--el-color-primary);
      transform: scale(1.1);
    }
  }
}

// 自动完成下拉面板美化
:deep(.el-autocomplete-suggestion) {
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-lighter);
  backdrop-filter: blur(8px);

  .el-autocomplete-suggestion__list {
    .el-autocomplete-suggestion__item {
      border-radius: 6px;
      margin: 2px 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
      }

      &.highlighted {
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
        color: white;
        font-weight: 600;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-email-input {
    &:hover,
    &:focus-within {
      transform: none;
    }

    :deep(.el-input__wrapper) {
      &:hover,
      &.is-focus {
        transform: none;
      }
    }
  }
}
</style>
