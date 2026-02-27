<template>
  <component
    :is="currentComponent"
    class="sc-scrollbar"
    :height="height"
    :max-height="maxHeight"
    :native="native"
    :wrap-style="wrapStyle"
    :wrap-class="wrapClass"
    :view-style="viewStyle"
    :view-class="viewClass"
    :noresize="noresize"
    :tag="tag"
    :always="always"
    :min-size="minSize"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * ScScrollbar 滚动条组件
 * 简单封装 Element Plus 的 ElScrollbar，支持主题切换
 */
import { ElScrollbar } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import type { PropType } from "vue";

const { currentComponent } = useThemeComponent("ElScrollbar", ElScrollbar);

const props = defineProps({
  /**
   * 滚动条高度
   */
  height: {
    type: [String, Number],
    default: ""
  },
  /**
   * 滚动条最大高度
   */
  maxHeight: {
    type: [String, Number],
    default: ""
  },
  /**
   * 是否使用原生滚动条
   */
  native: {
    type: Boolean,
    default: false
  },
  /**
   * 包装元素的样式
   */
  wrapStyle: {
    type: [String, Object],
    default: ""
  },
  /**
   * 包装元素的 CSS 类名
   */
  wrapClass: {
    type: [String, Array],
    default: ""
  },
  /**
   * 视图元素的样式
   */
  viewStyle: {
    type: [String, Object],
    default: ""
  },
  /**
   * 视图元素的 CSS 类名
   */
  viewClass: {
    type: [String, Array],
    default: ""
  },
  /**
   * 是否不响应容器大小变化
   */
  noresize: {
    type: Boolean,
    default: false
  },
  /**
   * 包装元素的标签名
   */
  tag: {
    type: String,
    default: "div"
  },
  /**
   * 是否始终显示滚动条
   */
  always: {
    type: Boolean,
    default: false
  },
  /**
   * 滚动条的最小尺寸
   */
  minSize: {
    type: Number,
    default: 20
  }
});
</script>

<style scoped>
.sc-scrollbar {
  width: 100%;
}
</style>
