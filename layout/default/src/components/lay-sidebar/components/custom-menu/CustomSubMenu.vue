<script setup lang="ts">
/**
 * 自定义子菜单组件
 * 用 div + Teleport 实现弹出效果，完全脱离 Element Plus 样式限制
 */
import { ref, computed, inject, onMounted, onUnmounted, watch, nextTick, type Ref } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  /** 菜单路径 */
  index: string;
  /** 弹出方向：horizontal-横向菜单往下弹，vertical-垂直菜单往右弹 */
  popperDirection?: 'bottom' | 'right';
  /** 是否禁用 */
  disabled?: boolean;
  /** 弹出层额外类名 */
  popperClass?: string;
}>();

const route = useRoute();

// 从父组件注入激活路径
const activeIndex = inject<Ref<string>>('activeIndex');

// 弹出层状态
const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const popperRef = ref<HTMLElement | null>(null);

// 弹出层位置
const popperStyle = ref<Record<string, string>>({});

// 判断当前子菜单是否有激活项
const isActive = computed(() => {
  if (!activeIndex?.value) return false;
  return activeIndex.value.startsWith(props.index);
});

// 计算弹出层位置
function updatePopperPosition() {
  if (!triggerRef.value || !isOpen.value) return;
  
  const rect = triggerRef.value.getBoundingClientRect();
  const direction = props.popperDirection || 'bottom';
  
  if (direction === 'bottom') {
    // 横向菜单：弹出层在下方
    popperStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      minWidth: `${Math.max(rect.width, 180)}px`,
    };
  } else {
    // 垂直菜单：弹出层在右侧
    popperStyle.value = {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.right + 4}px`,
      minWidth: '180px',
    };
  }
}

// 打开弹出层
function openPopper() {
  if (props.disabled) return;
  isOpen.value = true;
  nextTick(() => {
    updatePopperPosition();
  });
}

// 关闭弹出层
function closePopper() {
  isOpen.value = false;
}

// 鼠标进入
function handleMouseEnter() {
  openPopper();
}

// 鼠标离开
function handleMouseLeave(e: MouseEvent) {
  // 检查是否移动到弹出层
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (popperRef.value?.contains(relatedTarget) || triggerRef.value?.contains(relatedTarget)) {
    return;
  }
  closePopper();
}

// 弹出层鼠标离开
function handlePopperMouseLeave(e: MouseEvent) {
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (triggerRef.value?.contains(relatedTarget) || popperRef.value?.contains(relatedTarget)) {
    return;
  }
  closePopper();
}

// 点击外部关闭
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!triggerRef.value?.contains(target) && !popperRef.value?.contains(target)) {
    closePopper();
  }
}

// 监听窗口滚动和resize
function handleScroll() {
  if (isOpen.value) {
    updatePopperPosition();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleScroll);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleScroll);
});
</script>

<template>
  <div
    ref="triggerRef"
    class="custom-sub-menu"
    :class="{
      'is-active': isActive,
      'is-open': isOpen,
      'is-disabled': disabled,
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 触发器：菜单标题 -->
    <div class="custom-sub-menu__title">
      <slot name="title" />
      <span class="custom-sub-menu__icon-arrow">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
          <path fill="currentColor" d="M340.864 149.312a30.592 30.592 0 0 0 0 42.752L652.736 512 340.864 831.872a30.592 30.592 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z" />
        </svg>
      </span>
    </div>
    
    <!-- 弹出层：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <Transition name="custom-popper-fade">
        <div
          v-show="isOpen"
          ref="popperRef"
          class="custom-sub-menu__popper"
          :class="popperClass"
          :style="popperStyle"
          @mouseenter="isOpen = true"
          @mouseleave="handlePopperMouseLeave"
        >
          <div class="custom-sub-menu__content">
            <slot />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.custom-sub-menu {
  position: relative;
  
  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 16px;
    margin: 4px 0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.25s ease;
    color: var(--custom-menu-text-color, var(--el-text-color-primary));
    background: var(--custom-menu-item-bg, transparent);
    
    &:hover {
      background: var(--custom-menu-item-hover-bg, rgba(var(--el-color-primary-rgb), 0.08));
      color: var(--custom-menu-item-hover-color, var(--el-color-primary));
    }
  }
  
  &.is-active > &__title {
    color: var(--custom-menu-sub-active-color, var(--el-color-primary));
    background: var(--custom-menu-sub-active-bg, rgba(var(--el-color-primary-rgb), 0.1));
  }
  
  &__icon-arrow {
    display: flex;
    align-items: center;
    margin-left: 8px;
    transition: transform 0.3s ease;
    transform: rotate(90deg); // 默认向下
  }
  
  &.is-open &__icon-arrow {
    transform: rotate(-90deg); // 展开时向上
  }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    .custom-sub-menu__title {
      cursor: not-allowed;
      
      &:hover {
        background: transparent;
      }
    }
  }
}
</style>

<style lang="scss">
// 弹出层样式（全局，因为 Teleport 到 body）
.custom-sub-menu__popper {
  z-index: 2050;
  background: var(--custom-menu-popper-bg, #fff);
  border: 1px solid var(--custom-menu-popper-border, rgba(0, 0, 0, 0.06));
  border-radius: 12px;
  box-shadow: var(--custom-menu-popper-shadow, 
    0 12px 32px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.1)
  );
  padding: 8px;
  overflow: hidden;
}

.custom-sub-menu__content {
  // 内容区域，子组件会继承这里的样式变量
}

// 弹出动画
.custom-popper-fade-enter-active,
.custom-popper-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.custom-popper-fade-enter-from,
.custom-popper-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
