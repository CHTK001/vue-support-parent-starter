<template>
  <component
    :is="currentComponent"
    class="sc-sub-menu"
    :index="index"
    :disabled="disabled"
    :show-timeout="showTimeout"
    :hide-timeout="hideTimeout"
    :popper-append-to-body="popperAppendToBody"
    :popper-class="popperClass"
    :popper-offset="popperOffset"
    :teleported="teleported"
    v-bind="$attrs"
  >
    <template #title>
      <slot name="title" />
    </template>
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * ScSubMenu 子菜单组件
 * 简单封装 Element Plus 的 ElSubMenu，支持主题切换
 */
import { ElSubMenu } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import type { PropType } from "vue";

const { currentComponent } = useThemeComponent("ElSubMenu", ElSubMenu);

const props = defineProps({
  /**
   * 子菜单的唯一标识
   */
  index: {
    type: String,
    required: true
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 显示延迟时间（毫秒）
   */
  showTimeout: {
    type: Number,
    default: 0
  },
  /**
   * 隐藏延迟时间（毫秒）
   */
  hideTimeout: {
    type: Number,
    default: 0
  },
  /**
   * 是否将弹出菜单追加到 body
   */
  popperAppendToBody: {
    type: Boolean,
    default: true
  },
  /**
   * 弹出菜单的 CSS 类名
   */
  popperClass: {
    type: String,
    default: ""
  },
  /**
   * 弹出菜单的偏移量
   */
  popperOffset: {
    type: Number,
    default: 0
  },
  /**
   * 是否使用 teleport
   */
  teleported: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.sc-sub-menu {
  width: 100%;
}
</style>
