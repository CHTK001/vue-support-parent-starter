<template>
  <div class="sc-boolean-toggle">
    <div
      class="toggle-container"
      :class="{
        'is-active': innerValue === 'true',
        'is-disabled': disabled,
      }"
      @click="toggleValue"
    >
      <div class="toggle-icon">
        <IconifyIconOnline :icon="innerValue === 'true' ? 'ep:check' : 'ep:close'" />
      </div>
      <div class="toggle-text">{{ innerValue === "true" ? "是" : "否" }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * 组件属性定义
 */
const props = defineProps({
  modelValue: {
    type: [String, Boolean],
    default: "false",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 内部值，用于双向绑定
 * 处理字符串和布尔类型的转换
 */
const innerValue = computed({
  get: () => {
    // 如果是布尔类型，转换为字符串
    if (typeof props.modelValue === "boolean") {
      return props.modelValue ? "true" : "false";
    }
    // 确保值为 'true' 或 'false'
    return props.modelValue === "true" ? "true" : "false";
  },
  set: (val) => {
    emit("update:modelValue", val);
  },
});

/**
 * 切换布尔值
 */
const toggleValue = () => {
  if (props.disabled) return;
  innerValue.value = innerValue.value === "true" ? "false" : "true";
};
</script>

<style lang="scss">
.sc-boolean-toggle {
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    border-radius: 8px;
    background-color: var(--el-fill-color-light);
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid var(--el-border-color-lighter);

    &:hover:not(.is-disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &.is-active {
      background-color: var(--el-color-success-light-9);
      border-color: var(--el-color-success-light-5);

      .toggle-icon {
        background-color: var(--el-color-success);
      }

      .toggle-text {
        color: var(--el-color-success);
      }
    }

    &.is-disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .toggle-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: var(--el-color-danger);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      svg {
        font-size: 14px;
        color: var(--el-text-color-primary);
      }
    }

    .toggle-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-color-danger);
      transition: all 0.3s;
    }
  }
}
</style>
