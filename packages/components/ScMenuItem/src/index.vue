<template>
  <component
    :is="currentComponent"
    class="sc-menu-item"
    :index="index"
    :route="route"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * ScMenuItem 菜单项组件
 * 简单封装 Element Plus 的 ElMenuItem，支持主题切换
 */
import { ElMenuItem } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import type { PropType } from "vue";

const { currentComponent } = useThemeComponent("ElMenuItem", ElMenuItem);

const props = defineProps({
  /**
   * 菜单项的唯一标识
   */
  index: {
    type: String,
    required: true
  },
  /**
   * 路由对象
   */
  route: {
    type: Object as PropType<any>,
    default: null
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.sc-menu-item {
  width: 100%;
}
</style>
