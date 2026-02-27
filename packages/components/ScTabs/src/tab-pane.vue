<template>
  <component
    :is="currentComponent || ElTabPane"
    :label="label"
    :name="name"
    :disabled="disabled"
    :lazy="lazy"
    :closable="closable"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScTabPane 标签页面板组件
 * 封装 Element Plus 的 ElTabPane
 * 在 data-skin 为 8bit 时自动切换为像素风标签页面板
 */
import type { PropType } from "vue";
import { ElTabPane } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const props = defineProps({
  /**
   * 选项卡标题
   */
  label: {
    type: String,
    default: ""
  },
  /**
   * 与选项卡绑定值 value 对应的标识符，表示选项卡别名
   */
  name: {
    type: [String, Number],
    default: ""
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 标签是否延迟渲染
   */
  lazy: {
    type: Boolean,
    default: false
  },
  /**
   * 标签是否可关闭
   */
  closable: {
    type: Boolean,
    default: false
  }
});

const { currentComponent } = useThemeComponent("ElTabPane", ElTabPane);
</script>

