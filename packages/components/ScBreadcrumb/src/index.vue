<template>
  <component :is="currentComponent || ElBreadcrumb" :separator="separator" :separator-class="separatorClass">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScBreadcrumb 面包屑组件
 * 封装 Element Plus Breadcrumb
 * 支持根据 data-skin 切换主题化组件样式
 */
import { computed } from "vue";
import { ElBreadcrumb } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";

defineProps({
  separator: {
    type: String,
    default: "/"
  },
  separatorClass: {
    type: String,
    default: ""
  }
});

const { currentComponent } = useThemeComponent("ElBreadcrumb");
</script>
