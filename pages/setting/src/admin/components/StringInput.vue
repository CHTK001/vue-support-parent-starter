<template>
  <el-input v-model="innerValue" :disabled="disabled" :placeholder="placeholder" clearable class="sc-string-input">
    <template #prefix>
      <IconifyIconOnline icon="ep:document" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * 组件属性定义
 */
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "请输入字符串",
  },
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 内部值，用于双向绑定
 */
const innerValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<style lang="scss">
.sc-string-input {
  .el-input__wrapper {
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary);
    }
  }
}
</style>
