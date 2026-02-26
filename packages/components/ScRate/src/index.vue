<template>
  <component
    :is="currentComponent || ElRate"
    v-model="currentValue"
    :max="max"
    :disabled="disabled"
    :allow-half="allowHalf"
    :low-threshold="lowThreshold"
    :high-threshold="highThreshold"
    :colors="colors"
    :void-color="voidColor"
    :disabled-void-color="disabledVoidColor"
    :icons="icons"
    :void-icon="voidIcon"
    :disabled-void-icon="disabledVoidIcon"
    :show-text="showText"
    :show-score="showScore"
    :text-color="textColor"
    :texts="texts"
    :score-template="scoreTemplate"
    :size="size"
    :clearable="clearable"
    :id="id"
    :label="label"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
/**
 * ScRate 评分组件
 * 封装 Element Plus Rate 与 PixelUI PxRate
 * 在 data-skin 为 8bit 时自动切换为像素风评分组件
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElRate } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 5
  },
  disabled: {
    type: Boolean,
    default: false
  },
  allowHalf: {
    type: Boolean,
    default: false
  },
  lowThreshold: {
    type: Number,
    default: 2
  },
  highThreshold: {
    type: Number,
    default: 4
  },
  colors: {
    type: [Array, Object] as PropType<string[] | Record<number, string>>,
    default: undefined
  },
  voidColor: {
    type: String,
    default: ""
  },
  disabledVoidColor: {
    type: String,
    default: ""
  },
  icons: {
    type: [Array, Object] as PropType<string[] | Record<number, string>>,
    default: undefined
  },
  voidIcon: {
    type: [String, Object],
    default: ""
  },
  disabledVoidIcon: {
    type: [String, Object],
    default: ""
  },
  showText: {
    type: Boolean,
    default: false
  },
  showScore: {
    type: Boolean,
    default: false
  },
  textColor: {
    type: String,
    default: ""
  },
  texts: {
    type: Array as PropType<string[]>,
    default: undefined
  },
  scoreTemplate: {
    type: String,
    default: "{value}"
  },
  size: {
    type: String as PropType<"" | "large" | "default" | "small">,
    default: "default"
  },
  clearable: {
    type: Boolean,
    default: false
  },
  id: {
    type: String,
    default: undefined
  },
  label: {
    type: String,
    default: undefined
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

const { currentComponent } = useThemeComponent("ElRate");



const handleChange = (val: number) => {
  emit("change", val);
};
</script>
