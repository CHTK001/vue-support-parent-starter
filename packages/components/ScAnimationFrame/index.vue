<template>
  <img
    class="sc-animation-frame"
    :class="{ 'is-8bit': isEightBitTheme }"
    v-bind="componentProps"
  />
</template>

<script setup lang="ts">
/**
 * ScAnimationFrame 动画帧组件
 * 8bit 主题改为纯 SCSS 方案后统一回落到原生 img，
 * 通过样式保持像素化显示，不再依赖第三方组件包。
 */
import { computed } from "vue";
import type { PropType } from "vue";
import { useThemeComponent } from "../hooks/useThemeComponent";

type AnimationFrameType = "loop" | "once";

interface AnimationFrameStage {
  start: number;
  end: number;
  type: AnimationFrameType;
}

const props = defineProps({
  /**
   * 图片地址
   */
  src: {
    type: String,
    required: true
  },
  /**
   * 动画帧控制器
   */
  stages: {
    type: Array as PropType<AnimationFrameStage[]>,
    default: () => []
  },
  /**
   * 是否启用循环播放
   */
  loop: {
    type: Boolean,
    default: false
  },
  /**
   * 图片宽度
   */
  width: {
    type: Number,
    default: 320
  },
  /**
   * 图片高度
   */
  height: {
    type: Number,
    default: 320
  },
  /**
   * 是否可拖拽
   */
  draggable: {
    type: Boolean,
    default: true
  },
  /**
   * 拖动范围是否可超出可视区域
   */
  overflow: {
    type: Boolean,
    default: false
  }
});

const { currentSkin } = useThemeComponent("ElImage");

const isEightBitTheme = computed(() => currentSkin.value === "8bit");

const componentProps = computed(() => {
  return {
    src: props.src,
    width: props.width,
    height: props.height,
    draggable: props.draggable,
    alt: ""
  };
});
</script>

<style scoped>
.sc-animation-frame {
  display: inline-block;
  object-fit: contain;
}

.sc-animation-frame.is-8bit {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
