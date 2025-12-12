<template>
  <el-switch
    v-model="switchValue"
    :disabled="disabled"
    :loading="loading"
    :size="size"
    :width="width"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :active-value="activeValue"
    :inactive-value="inactiveValue"
    :active-color="activeColor"
    :inactive-color="inactiveColor"
    :validate-event="validateEvent"
    :before-change="beforeChange"
    :inline-prompt="inlinePrompt"
    :active-icon="activeIcon"
    :inactive-icon="inactiveIcon"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: "default"
  },
  width: {
    type: [String, Number],
    default: ""
  },
  activeText: {
    type: String,
    default: ""
  },
  inactiveText: {
    type: String,
    default: ""
  },
  activeValue: {
    type: [Boolean, String, Number],
    default: true
  },
  inactiveValue: {
    type: [Boolean, String, Number],
    default: false
  },
  activeColor: {
    type: String,
    default: ""
  },
  inactiveColor: {
    type: String,
    default: ""
  },
  activeIcon: {
    type: String,
    default: ""
  },
  inactiveIcon: {
    type: String,
    default: ""
  },
  inlinePrompt: {
    type: Boolean,
    default: false
  },
  validateEvent: {
    type: Boolean,
    default: true
  },
  beforeChange: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 开关绑定值
const switchValue = ref(props.modelValue);

// 监听modelValue变化同步到switchValue
watch(
  () => props.modelValue,
  newValue => {
    switchValue.value = newValue;
  }
);

// 监听switchValue变化触发update:modelValue
watch(
  () => switchValue.value,
  newValue => {
    emit("update:modelValue", newValue);
  }
);

// 处理状态变化
const handleChange = (value: boolean | string | number) => {
  emit("change", value);
};
</script>
