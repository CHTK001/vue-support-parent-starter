<template>
  <ScInputNumber v-model="innerValue" :disabled="disabled" :placeholder="placeholder" :controls="controls" :precision="precision" :step="step" :min="min" :max="max" class="sc-number-input" />
</template>

<script setup>
import { computed } from "vue";

/**
 * 组件属性定义
 */
const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: 0,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "请输入数字",
  },
  controls: {
    type: Boolean,
    default: true,
  },
  precision: {
    type: Number,
    default: 0,
  },
  step: {
    type: Number,
    default: 1,
  },
  min: {
    type: Number,
    default: -Infinity,
  },
  max: {
    type: Number,
    default: Infinity,
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 内部值，用于双向绑定
 * 处理字符串和数字类型的转换
 */
const innerValue = computed({
  get: () => {
    // 如果是字符串类型的数字，转换为数字类型
    if (typeof props.modelValue === "string") {
      return Number(props.modelValue) || 0;
    }
    return props.modelValue;
  },
  set: (val) => {
    // 始终以字符串形式返回，保持一致性
    emit("update:modelValue", String(val));
  },
});
</script>

<style lang="scss">
.sc-number-input {
  width: 100%;

  .el-input-number__decrease,
  .el-input-number__increase {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-color: var(--el-border-color-light);

    &:hover {
      color: var(--el-color-primary-dark-1);
    }
  }

  .el-input__wrapper {
    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary);
    }
  }
}
</style>
