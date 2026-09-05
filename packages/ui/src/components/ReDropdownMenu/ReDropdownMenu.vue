<script setup lang="ts">
/**
 * ReDropdownMenu —— 下拉菜单容器（el-dropdown-menu 薄封装）
 */
import { ElDropdownMenu } from "element-plus";

defineOptions({ name: "ReDropdownMenu", inheritAttrs: true });
</script>

<template>
  <ElDropdownMenu v-bind="$attrs">
    <slot />
  </ElDropdownMenu>
</template>