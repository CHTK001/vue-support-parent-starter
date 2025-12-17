<script setup lang="ts">
/**
 * 自定义菜单容器组件
 * 提供激活状态管理和样式变量
 */
import { computed, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { isAllEmpty } from '@pureadmin/utils';

const props = defineProps<{
  /** 菜单模式：horizontal-横向，vertical-垂直 */
  mode?: 'horizontal' | 'vertical';
  /** 默认激活路径 */
  defaultActive?: string;
  /** 主题类名 */
  themeClass?: string;
}>();

const route = useRoute();

// 计算当前激活路径
const activeIndex = computed(() => {
  if (props.defaultActive) return props.defaultActive;
  return !isAllEmpty(route.meta?.activePath) ? route.meta.activePath as string : route.path;
});

// 提供激活路径给子组件
provide('activeIndex', activeIndex);
provide('menuMode', props.mode || 'horizontal');
</script>

<template>
  <div 
    class="custom-menu"
    :class="[
      `custom-menu--${mode || 'horizontal'}`,
      themeClass
    ]"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.custom-menu {
  display: flex;
  
  &--horizontal {
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }
  
  &--vertical {
    flex-direction: column;
  }
}
</style>
