<template>
  <div class="sc-switch">
    <CardLayout 
      v-if="layout === 'card'"
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      @change="handleChange"
    />
    <SliderLayout 
      v-else-if="layout === 'slider'"
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      :active-icon="activeIcon"
      :inactive-icon="inactiveIcon"
      @change="handleChange"
    />
    <el-switch
      v-else
      v-model="currentValue"
      :disabled="disabled"
      :loading="loading"
      :size="size"
      :active-text="activeText"
      :inactive-text="inactiveText"
      :active-value="activeValue"
      :inactive-value="inactiveValue"
      :active-color="activeColor"
      :inactive-color="inactiveColor"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import CardLayout from "./components/CardLayout.vue";
import SliderLayout from "./components/SliderLayout.vue";

const props = defineProps({
  modelValue: {
    type: [Boolean, String, Number],
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  layout: {
    type: String,
    default: "default",
    validator: (val: string) => ["default", "card", "slider"].includes(val)
  },
  size: {
    type: String,
    default: "default",
    validator: (val: string) => ["large", "default", "small"].includes(val)
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
  name: {
    type: String,
    default: ""
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

// 内部值，用于双向绑定
const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit("update:modelValue", val);
  }
});

// 处理变更事件
const handleChange = (val: boolean | string | number) => {
  emit("change", val);
};
</script>

<style lang="scss" scoped>
.sc-switch {
  display: inline-block;
}
</style> 