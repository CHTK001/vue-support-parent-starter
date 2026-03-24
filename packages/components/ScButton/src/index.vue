<template>
  <component
    :is="currentComponent || ElButton"
    :size="size"
    :type="type"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :round="round"
    :circle="circle"
    :loading="loading"
    :loading-icon="loadingIcon"
    :disabled="disabled"
    :icon="icon"
    :autofocus="autofocus"
    :native-type="nativeType"
    :auto-insert-space="autoInsertSpace"
    :color="color"
    :dark="dark"
    :tag="tag"
    @click="handleClick"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScButton 按钮组件
 * 封装 Element Plus Button 与 PixelUI PxButton
 * 在 data-skin 为 8bit 时自动切换为像素风按钮
 * @author CH
 * @version 1.0.0
 * @since 2026-02-26
 */
import { computed } from "vue";
import type { PropType, Component } from "vue";
import { ElButton } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

type ButtonType = "" | "default" | "primary" | "success" | "warning" | "info" | "danger" | "text";
type ButtonSize = "" | "large" | "default" | "small";
type ButtonNativeType = "button" | "submit" | "reset";

const props = defineProps({
  /**
   * 按钮尺寸
   */
  size: {
    type: String as PropType<ButtonSize>,
    default: ""
  },
  /**
   * 按钮类型
   */
  type: {
    type: String as PropType<ButtonType>,
    default: ""
  },
  /**
   * 是否为朴素按钮
   */
  plain: {
    type: Boolean,
    default: false
  },
  /**
   * 是否为文字按钮
   */
  text: {
    type: Boolean,
    default: false
  },
  /**
   * 是否显示文字按钮背景颜色
   */
  bg: {
    type: Boolean,
    default: false
  },
  /**
   * 是否为链接按钮
   */
  link: {
    type: Boolean,
    default: false
  },
  /**
   * 是否为圆角按钮
   */
  round: {
    type: Boolean,
    default: false
  },
  /**
   * 是否为圆形按钮
   */
  circle: {
    type: Boolean,
    default: false
  },
  /**
   * 是否为加载中状态
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * 自定义加载中图标
   */
  loadingIcon: {
    type: [String, Object] as PropType<string | Component>,
    default: undefined
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 图标组件
   */
  icon: {
    type: [String, Object] as PropType<string | Component>,
    default: ""
  },
  /**
   * 是否默认聚焦
   */
  autofocus: {
    type: Boolean,
    default: false
  },
  /**
   * 原生 type 属性
   */
  nativeType: {
    type: String as PropType<ButtonNativeType>,
    default: "button"
  },
  /**
   * 自动在两个中文字符之间插入空格
   */
  autoInsertSpace: {
    type: Boolean,
    default: undefined
  },
  /**
   * 自定义按钮颜色
   */
  color: {
    type: String,
    default: ""
  },
  /**
   * dark 模式
   */
  dark: {
    type: Boolean,
    default: false
  },
  /**
   * 自定义元素标签
   */
  tag: {
    type: [String, Object] as PropType<string | Component>,
    default: "button"
  }
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

/**
 * 使用 PixelUI 条件导入
 * 自动管理 CSS 加载/卸载，并提供 PxButton 组件条件导入
 */
const { currentComponent } = useThemeComponent("ElButton");

/**
 * 当前实际渲染的组件
 * 像素主题下使用 PxButton，否则使用 ElButton
 */


/**
 * 点击事件透传
 */
const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped>
/* 这里暂不做强样式覆盖，由外部主题控制 */
</style>
