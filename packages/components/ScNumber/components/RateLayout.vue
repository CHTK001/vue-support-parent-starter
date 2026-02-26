<template>
  <div class="sc-number-rate" :class="[`sc-number-rate--${size}`]">
    <ScRate
      v-model="currentValue"
      class="sc-number-rate__rate"
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
      :clearable="clearable"
      :size="size"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import ScRate from "../../ScRate/src/index.vue";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: number;
  /**
   * 最大分值
   */
  max?: number;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 是否允许半选
   */
  allowHalf?: boolean;
  /**
   * 低分和中等分数的界限值
   */
  lowThreshold?: number;
  /**
   * 高分和中等分数的界限值
   */
  highThreshold?: number;
  /**
   * 图标颜色数组
   */
  colors?: string[] | Record<number, string>;
  /**
   * 未选中时图标颜色
   */
  voidColor?: string;
  /**
   * 禁用时未选中图标颜色
   */
  disabledVoidColor?: string;
  /**
   * 图标数组
   */
  icons?: (string | Component)[] | Record<number, string | Component>;
  /**
   * 未选中时图标
   */
  voidIcon?: string | Component;
  /**
   * 禁用时未选中图标
   */
  disabledVoidIcon?: string | Component;
  /**
   * 是否显示文本
   */
  showText?: boolean;
  /**
   * 是否显示分数
   */
  showScore?: boolean;
  /**
   * 文本颜色
   */
  textColor?: string;
  /**
   * 辅助文字数组
   */
  texts?: string[];
  /**
   * 分数显示模板
   */
  scoreTemplate?: string;
  /**
   * 是否可以重置
   */
  clearable?: boolean;
  /**
   * 尺寸
   */
  size?: "large" | "default" | "small";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  max: 5,
  disabled: false,
  allowHalf: false,
  lowThreshold: 2,
  highThreshold: 4,
  colors: () => ["#F7BA2A", "#F7BA2A", "#F7BA2A"],
  voidColor: "#C6D1DE",
  disabledVoidColor: "#EFF2F7",
  icons: undefined,
  voidIcon: undefined,
  disabledVoidIcon: undefined,
  showText: false,
  showScore: false,
  textColor: "#1F2D3D",
  texts: () => ["极差", "失望", "一般", "满意", "惊喜"],
  scoreTemplate: "{value}",
  clearable: false,
  size: "default"
});

const emit = defineEmits(["update:modelValue", "change"]);

const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const handleChange = (value: number) => {
  emit("change", value);
};
</script>

<style lang="scss" scoped>
.sc-number-rate {
  display: inline-flex;
  align-items: center;

  &__rate {
    // 自定义评分图标样式
    :deep(.el-rate__icon) {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: scale(1.2) rotate(-5deg);
      }

      &:active {
        transform: scale(0.9);
      }
    }

    // 添加波纹效果
    :deep(.el-rate__item) {
      position: relative;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(var(--el-color-primary-rgb), 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: all 0.4s ease;
      }

      &:active::after {
        width: 100%;
        height: 100%;
        opacity: 0;
      }
    }

    // 文本样式
    :deep(.el-rate__text) {
      margin-left: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  // 尺寸变体
  &--large {
    .sc-number-rate__rate {
      :deep(.el-rate__icon) {
        font-size: 28px;
        margin-right: 8px;
      }

      :deep(.el-rate__text) {
        font-size: 16px;
      }
    }
  }

  &--default {
    .sc-number-rate__rate {
      :deep(.el-rate__icon) {
        font-size: 20px;
        margin-right: 6px;
      }

      :deep(.el-rate__text) {
        font-size: 14px;
      }
    }
  }

  &--small {
    .sc-number-rate__rate {
      :deep(.el-rate__icon) {
        font-size: 16px;
        margin-right: 4px;
      }

      :deep(.el-rate__text) {
        font-size: 12px;
      }
    }
  }

  // 禁用状态
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .sc-number-rate__rate {
      :deep(.el-rate__icon) {
        cursor: not-allowed;

        &:hover {
          transform: none;
        }
      }
    }
  }
}
</style>
