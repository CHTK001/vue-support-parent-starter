<script setup lang="ts">
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultDrawer from "./themes/drawer/Default.vue";

// 主题组件映射
const themeComponents = {
  default: DefaultDrawer,
};

const { CurrentComponent } = useThemeComponent(themeComponents, DefaultDrawer);
</script>

<template>
  <component :is="CurrentComponent" />
</template>
