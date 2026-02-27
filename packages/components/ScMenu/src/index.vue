<template>
  <component
    :is="currentComponent"
    class="sc-menu"
    :mode="mode"
    :collapse="collapse"
    :default-active="defaultActive"
    :default-openeds="defaultOpeneds"
    :unique-opened="uniqueOpened"
    :router="router"
    :ellipsis="ellipsis"
    :background-color="backgroundColor"
    :text-color="textColor"
    :active-text-color="activeTextColor"
    @select="handleSelect"
    @open="(index, indexPath) => emit('open', index, indexPath)"
    @close="(index, indexPath) => emit('close', index, indexPath)"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
/**
 * ScMenu 菜单组件
 * 简单封装 Element Plus 的 ElMenu，统一项目内菜单用法
 */
import { ElMenu } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

const { currentComponent } = useThemeComponent("ElMenu", ElMenu);
import type { PropType } from "vue";

const emit = defineEmits<{
  (e: "select", index: string, indexPath: string[], item: unknown, routeResult?: unknown): void;
  (e: "open", index: string, indexPath: string[]): void;
  (e: "close", index: string, indexPath: string[]): void;
}>();

const props = defineProps({
  /**
   * 菜单模式
   */
  mode: {
    type: String as PropType<"horizontal" | "vertical">,
    default: "vertical"
  },
  /**
   * 是否折叠菜单
   */
  collapse: {
    type: Boolean,
    default: false
  },
  /**
   * 默认选中菜单项 index
   */
  defaultActive: {
    type: String,
    default: ""
  },
  /**
   * 默认展开的子菜单 index 列表
   */
  defaultOpeneds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  /**
   * 是否只保持一个子菜单展开
   */
  uniqueOpened: {
    type: Boolean,
    default: false
  },
  /**
   * 是否根据 vue-router 自动跳转
   */
  router: {
    type: Boolean,
    default: false
  },
  /**
   * 是否省略多余的菜单项
   */
  ellipsis: {
    type: Boolean,
    default: true
  },
  /**
   * 背景色
   */
  backgroundColor: {
    type: String,
    default: ""
  },
  /**
   * 文本颜色
   */
  textColor: {
    type: String,
    default: ""
  },
  /**
   * 选中项文本颜色
   */
  activeTextColor: {
    type: String,
    default: ""
  }
});

const handleSelect = (index: string, indexPath: string[], item: unknown, routeResult?: unknown): void => {
  emit("select", index, indexPath, item, routeResult);
};
</script>

<style scoped>
.sc-menu {
  width: 100%;
}
</style>
