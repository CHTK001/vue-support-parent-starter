<template>
  <div class="sc-number-slider" :class="{ 'sc-number-slider--vertical': vertical }">
    <ScSlider
      v-model="currentValue"
      class="sc-number-slider__slider"
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScSlider from "../../ScSlider/src/index.vue";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: number | number[];
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
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 是否显示输入框
   */
  showInput?: boolean;
  /**
   * 是否显示输入框控制按钮
   */
  showInputControls?: boolean;
  /**
   * 是否显示间断点
   */
  showStops?: boolean;
  /**
   * 是否显示提示信息
   */
  showTooltip?: boolean;
  /**
   * 格式化提示信息
   */
  formatTooltip?: (val: number) => string | number;
  /**
   * 是否为范围选择
   */
  range?: boolean;
  /**
   * 是否垂直模式
   */
  vertical?: boolean;
  /**
   * 垂直模式高度
   */
  height?: string;
  /**
   * 标记点
   */
  marks?: Record<number, string | { style: object; label: string }>;
  /**
   * 防抖延迟
   */
  debounce?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  showInput: false,
  showInputControls: true,
  showStops: false,
  showTooltip: true,
  formatTooltip: undefined,
  range: false,
  vertical: false,
  height: "",
  marks: undefined,
  debounce: 300
});

const emit = defineEmits(["update:modelValue", "change"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const handleChange = (value: number | number[]) => {
  emit("change", value);
};
</script>

<style lang="scss" scoped>
.sc-number-slider {
  width: 100%;
  padding: 8px 12px;

  &__slider {
    width: 100%;

    // 自定义滑块样式
    :deep(.el-slider__runway) {
      height: 6px;
      background: linear-gradient(90deg, var(--el-fill-color-light) 0%, var(--el-fill-color) 100%);
      border-radius: 3px;
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(90deg, var(--el-fill-color) 0%, var(--el-fill-color-dark) 100%);
      }
    }

    :deep(.el-slider__bar) {
      height: 6px;
      background: linear-gradient(90deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
      border-radius: 3px;
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }

    :deep(.el-slider__button-wrapper) {
      .el-slider__button {
        width: 20px;
        height: 20px;
        border: 3px solid var(--el-color-primary);
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.4);
        }
      }
    }

    // Tooltip 样式
    :deep(.el-slider__button-wrapper) {
      .el-tooltip__trigger {
        &:focus-visible {
          outline: none;
        }
      }
    }

    // 标记点样式
    :deep(.el-slider__stop) {
      width: 8px;
      height: 8px;
      background: var(--el-fill-color-darker);
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.3);
      }
    }

    // 标记文字样式
    :deep(.el-slider__marks-text) {
      color: var(--el-text-color-secondary);
      font-size: 12px;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }
    }

    // 输入框样式
    :deep(.el-slider__input) {
      margin-left: 16px;

      .el-input-number {
        .el-input__wrapper {
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  // 垂直模式
  &--vertical {
    width: auto;
    height: 100%;
    padding: 12px 8px;

    .sc-number-slider__slider {
      height: 100%;

      :deep(.el-slider__runway) {
        width: 6px;
        height: 100%;
      }

      :deep(.el-slider__bar) {
        width: 6px;
        background: linear-gradient(180deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      }
    }
  }

  // 禁用状态
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .sc-number-slider__slider {
      :deep(.el-slider__button-wrapper) {
        .el-slider__button {
          cursor: not-allowed;

          &:hover {
            transform: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }
        }
      }
    }
  }
}
</style>
