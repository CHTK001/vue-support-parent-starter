<template>
  <div class="sc-number" :class="[`sc-number--${size}`, { 'sc-number--disabled': disabled }]">
    <!-- 滑块布局 -->
    <SliderLayout
      v-if="layout === 'slider'"
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
      :debounce="debounce"
      @change="handleChange"
    />

    <!-- 评分布局 -->
    <RateLayout
      v-else-if="layout === 'rate'"
      v-model="currentValue"
      :max="rateMax"
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
      :show-text="showRateText"
      :show-score="showScore"
      :text-color="textColor"
      :texts="texts"
      :score-template="scoreTemplate"
      :clearable="clearable"
      :size="size"
      @change="handleChange"
    />

    <!-- 步进器布局 -->
    <StepperLayout
      v-else-if="layout === 'stepper'"
      v-model="currentValue"
      :min="min"
      :max="max"
      :step="step"
      :precision="precision"
      :disabled="disabled"
      :size="size"
      :controls-position="controlsPosition"
      :placeholder="placeholder"
      :readonly="readonly"
      :show-value="showValue"
      :value-format="valueFormat"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 进度条布局 -->
    <ProgressLayout
      v-else-if="layout === 'progress'"
      v-model="currentValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :show-input="showInput"
      :show-percentage="showPercentage"
      :percentage-format="percentageFormat"
      :stroke-width="strokeWidth"
      :text-inside="textInside"
      :status="status"
      :color="progressColor"
      :editable="editable"
      @change="handleChange"
    />

    <!-- 圆形布局 -->
    <CircleLayout
      v-else-if="layout === 'circle'"
      v-model="currentValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :size="circleSize"
      :stroke-width="strokeWidth"
      :color="progressColor"
      :show-input="showInput"
      :editable="editable"
      @change="handleChange"
    />

    <!-- 默认布局 (el-input-number) -->
    <DefaultLayout
      v-else
      v-model="currentValue"
      :min="min"
      :max="max"
      :step="step"
      :step-strictly="stepStrictly"
      :precision="precision"
      :disabled="disabled"
      :controls="controls"
      :controls-position="controlsPosition"
      :placeholder="placeholder"
      :size="size"
      :readonly="readonly"
      :name="name"
      :id="id"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ScNumber 数字组件
 * 支持多种布局模式：default、slider、rate、stepper、progress、circle
 * @author CH
 * @date 2025-12-07
 * @version 1.0.0
 */
import { computed, type Component } from "vue";
import DefaultLayout from "./components/DefaultLayout.vue";
import SliderLayout from "./components/SliderLayout.vue";
import RateLayout from "./components/RateLayout.vue";
import StepperLayout from "./components/StepperLayout.vue";
import ProgressLayout from "./components/ProgressLayout.vue";
import CircleLayout from "./components/CircleLayout.vue";

export type NumberLayout = "default" | "slider" | "rate" | "stepper" | "progress" | "circle";
export type NumberSize = "large" | "default" | "small";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: number | number[];
  /**
   * 布局模式
   * - default: 默认 el-input-number
   * - slider: 滑块布局
   * - rate: 评分布局
   * - stepper: 现代步进器布局
   * - progress: 进度条布局
   * - circle: 圆形进度布局
   */
  layout?: NumberLayout;
  /**
   * 尺寸
   */
  size?: NumberSize;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 占位文本
   */
  placeholder?: string;
  /**
   * 是否只读
   */
  readonly?: boolean;
  /**
   * 原生 name 属性
   */
  name?: string;
  /**
   * 原生 id 属性
   */
  id?: string;

  // ========== 通用数字属性 ==========
  /**
   * 最小值
   */
  min?: number;
  /**
   * 最大值
   */
  max?: number;
  /**
   * 步长
   */
  step?: number;
  /**
   * 数值精度
   */
  precision?: number;

  // ========== default 布局属性 ==========
  /**
   * 是否只能输入步长的倍数
   */
  stepStrictly?: boolean;
  /**
   * 是否使用控制按钮
   */
  controls?: boolean;
  /**
   * 控制按钮位置
   */
  controlsPosition?: "" | "right";

  // ========== slider 布局属性 ==========
  /**
   * 是否显示输入框（slider）
   */
  showInput?: boolean;
  /**
   * 是否显示输入框控制按钮（slider）
   */
  showInputControls?: boolean;
  /**
   * 是否显示间断点（slider）
   */
  showStops?: boolean;
  /**
   * 是否显示提示信息（slider）
   */
  showTooltip?: boolean;
  /**
   * 格式化提示信息（slider）
   */
  formatTooltip?: (val: number) => string | number;
  /**
   * 是否为范围选择（slider）
   */
  range?: boolean;
  /**
   * 是否垂直模式（slider）
   */
  vertical?: boolean;
  /**
   * 垂直模式高度（slider）
   */
  height?: string;
  /**
   * 标记点（slider）
   */
  marks?: Record<number, string | { style: object; label: string }>;
  /**
   * 防抖延迟（slider）
   */
  debounce?: number;

  // ========== rate 布局属性 ==========
  /**
   * 评分最大值
   */
  rateMax?: number;
  /**
   * 是否允许半选（rate）
   */
  allowHalf?: boolean;
  /**
   * 低分和中等分数的界限值（rate）
   */
  lowThreshold?: number;
  /**
   * 高分和中等分数的界限值（rate）
   */
  highThreshold?: number;
  /**
   * 图标颜色数组（rate）
   */
  colors?: string[] | Record<number, string>;
  /**
   * 未选中时图标颜色（rate）
   */
  voidColor?: string;
  /**
   * 禁用时未选中图标颜色（rate）
   */
  disabledVoidColor?: string;
  /**
   * 图标数组（rate）
   */
  icons?: (string | Component)[] | Record<number, string | Component>;
  /**
   * 未选中时图标（rate）
   */
  voidIcon?: string | Component;
  /**
   * 禁用时未选中图标（rate）
   */
  disabledVoidIcon?: string | Component;
  /**
   * 是否显示文本（rate）
   */
  showRateText?: boolean;
  /**
   * 是否显示分数（rate）
   */
  showScore?: boolean;
  /**
   * 文本颜色（rate）
   */
  textColor?: string;
  /**
   * 辅助文字数组（rate）
   */
  texts?: string[];
  /**
   * 分数显示模板（rate）
   */
  scoreTemplate?: string;
  /**
   * 是否可以重置（rate）
   */
  clearable?: boolean;

  // ========== stepper 布局属性 ==========
  /**
   * 是否显示数值（stepper）
   */
  showValue?: boolean;
  /**
   * 数值格式化函数（stepper）
   */
  valueFormat?: (val: number) => string;

  // ========== progress 布局属性 ==========
  /**
   * 是否显示百分比（progress）
   */
  showPercentage?: boolean;
  /**
   * 百分比格式化函数（progress）
   */
  percentageFormat?: (val: number) => string;
  /**
   * 进度条宽度（progress）
   */
  strokeWidth?: number;
  /**
   * 百分比是否在进度条内（progress）
   */
  textInside?: boolean;
  /**
   * 进度条状态（progress）
   */
  status?: "" | "success" | "exception" | "warning";
  /**
   * 进度条颜色（progress/circle）
   */
  progressColor?: string | string[] | ((percentage: number) => string);
  /**
   * 是否可编辑（progress/circle）
   */
  editable?: boolean;

  // ========== circle 布局属性 ==========
  /**
   * 圆形进度条大小（circle）
   */
  circleSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  layout: "default",
  size: "default",
  disabled: false,
  placeholder: "",
  readonly: false,
  name: "",
  id: "",

  // 通用数字属性
  min: -Infinity,
  max: Infinity,
  step: 1,
  precision: undefined,

  // default 布局属性
  stepStrictly: false,
  controls: true,
  controlsPosition: "",

  // slider 布局属性
  showInput: false,
  showInputControls: true,
  showStops: false,
  showTooltip: true,
  formatTooltip: undefined,
  range: false,
  vertical: false,
  height: "",
  marks: undefined,
  debounce: 300,

  // rate 布局属性
  rateMax: 5,
  allowHalf: false,
  lowThreshold: 2,
  highThreshold: 4,
  colors: () => ["#F7BA2A", "#F7BA2A", "#F7BA2A"],
  voidColor: "#C6D1DE",
  disabledVoidColor: "#EFF2F7",
  icons: undefined,
  voidIcon: undefined,
  disabledVoidIcon: undefined,
  showRateText: false,
  showScore: false,
  textColor: "#1F2D3D",
  texts: () => ["极差", "失望", "一般", "满意", "惊喜"],
  scoreTemplate: "{value}",
  clearable: false,

  // stepper 布局属性
  showValue: true,
  valueFormat: undefined,

  // progress 布局属性
  showPercentage: true,
  percentageFormat: undefined,
  strokeWidth: 6,
  textInside: false,
  status: "",
  progressColor: "",
  editable: true,

  // circle 布局属性
  circleSize: 126
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur"]);

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
const handleChange = (val: number | number[]) => {
  emit("change", val);
};

// 处理焦点事件
const handleFocus = (event: FocusEvent) => {
  emit("focus", event);
};

// 处理失焦事件
const handleBlur = (event: FocusEvent) => {
  emit("blur", event);
};
</script>

<style lang="scss" scoped>
.sc-number {
  display: inline-flex;
  align-items: center;
  width: 100%;

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--large {
    font-size: 16px;
  }

  &--default {
    font-size: 14px;
  }

  &--small {
    font-size: 12px;
  }
}
</style>
