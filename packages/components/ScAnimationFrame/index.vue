<template>
  <component
    :is="currentComponent"
    class="sc-animation-frame"
    v-bind="componentProps"
  />
</template>

<script setup lang="ts">
/**
 * ScAnimationFrame 动画帧组件
 * 默认主题使用 img 渲染，8bit 主题使用 PixelUI 的 px-animation-frame
 * 通过 data-skin 统一由主题系统接管，而不是手动读取 document.dataset
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

/**
 * 通过主题系统获取当前主题信息
 * - default 使用原生 img
 * - 8bit 使用 px-animation-frame
 */
const { currentSkin } = useThemeComponent("ElImage");

const isPixelTheme = computed(() => currentSkin.value === "8bit");

const currentComponent = computed(() => {
  if (isPixelTheme.value) {
    return "px-animation-frame";
  }
  return "img";
});

const componentProps = computed(() => {
  if (isPixelTheme.value) {
    return {
      src: props.src,
      stages: props.stages,
      loop: props.loop,
      width: props.width,
      height: props.height,
      draggable: props.draggable,
      overflow: props.overflow
    };
  }

  return {
    src: props.src,
    width: props.width,
    height: props.height,
    draggable: props.draggable
  };
});
</script>

<style scoped>
.sc-animation-frame {
  display: inline-block;
}
</style>


