<template>
  <!-- 根据 data-skin 自动切换主题组件 -->
  <component
    :is="currentComponent || ElSlider"
    v-model="currentValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :show-input="showInput"
    :show-input-controls="showInputControls"
    :show-stops="showStops"
    :show-tooltip="showTooltip"
    :format-tooltip="formatTooltip"
    :range="range"
    :vertical="vertical"
    :height="height"
    :marks="marks"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
/**
 * ScSlider 滑块组件
 * 封装 Element Plus Slider，支持多主题切换
 *
 * 主题系统 V2.0：
 * - 配置驱动：新增主题只需修改 themeConfig.ts
 * - 多主题支持：8bit, Material, Fluent 等
 * - 自动切换：根据 data-skin 自动加载对应主题组件
 *
 * 设计目标：
 * - 对外 API 完全兼容 el-slider，便于无痛替换
 * - 内部根据全局 data-skin 自动切换主题组件
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { ElSlider } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type SliderValue = number | [number, number];

const props = defineProps({
  /**
   * 绑定值
   */
  modelValue: {
    type: [Number, Array] as PropType<SliderValue>,
    default: 0
  },
  /**
   * 最小值
   */
  min: {
    type: Number,
    default: 0
  },
  /**
   * 最大值
   */
  max: {
    type: Number,
    default: 100
  },
  /**
   * 步长
   */
  step: {
    type: Number,
    default: 1
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 是否显示输入框
   */
  showInput: {
    type: Boolean,
    default: false
  },
  /**
   * 是否显示输入框控制按钮
   */
  showInputControls: {
    type: Boolean,
    default: true
  },
  /**
   * 是否显示间断点
   */
  showStops: {
    type: Boolean,
    default: false
  },
  /**
   * 是否显示 tooltip
   */
  showTooltip: {
    type: Boolean,
    default: true
  },
  /**
   * 格式化 tooltip 文本
   */
  formatTooltip: {
    type: Function as PropType<(value: number) => string>,
    default: undefined
  },
  /**
   * 是否为范围选择
   */
  range: {
    type: Boolean,
    default: false
  },
  /**
   * 是否垂直模式
   */
  vertical: {
    type: Boolean,
    default: false
  },
  /**
   * 垂直模式高度
   */
  height: {
    type: String,
    default: ""
  },
  /**
   * 自定义标记
   */
  marks: {
    type: Object as PropType<Record<number, string>>,
    default: undefined
  }
});

const emit = defineEmits<{
  (e: "update:modelValue", value: SliderValue): void;
  (e: "change", value: SliderValue): void;
}>();

/**
 * 当前绑定值，支持 v-model
 */
const currentValue = computed<SliderValue>({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  }
});

/**
 * 使用主题组件系统 V2.0
 * 自动根据 data-skin 加载对应主题的 Slider 组件
 * - data-skin="8bit" → PxSlider (PixelUI)
 * - data-skin="material" → MdSlider (Material Design)
 * - data-skin="fluent" → FlSlider (Fluent Design)
 * - 无 data-skin → ElSlider (Element Plus)
 */
const { currentComponent } = useThemeComponent("ElSlider");

/**
 * 变更事件透传
 */
const handleChange = (value: SliderValue) => {
  emit("change", value);
};
</script>

<style scoped>
/* 这里暂不做强样式覆盖，由外部主题控制 */
</style>
