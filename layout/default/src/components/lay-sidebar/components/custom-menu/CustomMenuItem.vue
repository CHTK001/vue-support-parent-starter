<script setup lang="ts">
/**
 * 自定义菜单项组件
 * 用 div 替代 el-menu-item，完全控制样式
 */
import { computed, inject, type Ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps<{
  /** 菜单路径，用于导航和激活判断 */
  index: string;
  /** 是否禁用 */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  click: [index: string];
}>();

const router = useRouter();
const route = useRoute();

// 从父组件注入激活路径
const activeIndex = inject<Ref<string>>('activeIndex');

// 判断当前项是否激活
const isActive = computed(() => {
  if (!activeIndex?.value) return false;
  return activeIndex.value === props.index || 
         activeIndex.value.startsWith(props.index + '/');
});

// 点击处理
function handleClick() {
  if (props.disabled) return;
  emit('click', props.index);
  router.push(props.index);
}
</script>

<template>
  <div
    class="custom-menu-item"
    :class="{
      'is-active': isActive,
      'is-disabled': disabled,
    }"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.custom-menu-item {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  color: var(--custom-menu-text-color, var(--el-text-color-primary));
  background: var(--custom-menu-item-bg, transparent);
  
  &:hover:not(.is-disabled) {
    background: var(--custom-menu-item-hover-bg, rgba(var(--el-color-primary-rgb), 0.08));
    color: var(--custom-menu-item-hover-color, var(--el-color-primary));
  }
  
  &.is-active {
    background: var(--custom-menu-item-active-bg, var(--el-color-primary));
    color: var(--custom-menu-item-active-color, #fff);
    font-weight: 600;
    box-shadow: var(--custom-menu-item-active-shadow, 0 2px 8px rgba(var(--el-color-primary-rgb), 0.25));
  }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
