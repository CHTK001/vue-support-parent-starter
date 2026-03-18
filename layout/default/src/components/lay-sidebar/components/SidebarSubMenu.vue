<script setup lang="ts">
import { ref } from "vue";

// 侧边栏子菜单折叠组件
// 封装展开/收起动画，供 NavVertical 等使用
defineProps<{
  title?: string;           // 子菜单标题
  icon?: string | object;   // 图标
  isActive?: boolean;       // 子菜单内是否有激活项
  isCollapse?: boolean;     // 侧边栏是否收缩
  level?: number;           // 层级
}>();

const expanded = ref(false);

const toggle = () => {
  expanded.value = !expanded.value;
};
</script>

<template>
  <div class="sidebar-sub-menu">
    <!-- 子菜单标题行 -->
    <div
      :class="['sub-menu-title', { 'has-active': isActive, 'is-collapse': isCollapse }]"
      @click="toggle"
    >
      <!-- 左侧激活色条（子菜单内有激活项时显示） -->
      <span v-if="isActive && !isCollapse" class="active-indicator" aria-hidden="true" />

      <span class="menu-icon">
        <slot name="icon" />
      </span>

      <span v-if="!isCollapse" class="menu-title">
        <slot name="title">{{ title }}</slot>
      </span>

      <!-- 展开箭头 -->
      <span v-if="!isCollapse" :class="['expand-arrow', { 'is-expanded': expanded }]" aria-hidden="true">
        <IconifyIconOnline icon="ep:arrow-right" />
      </span>
    </div>

    <!-- 子菜单内容（展开/收起动画） -->
    <Transition name="sub-menu-slide">
      <div v-if="expanded && !isCollapse" class="sub-menu-content">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-sub-menu {
  width: 100%;
}

.sub-menu-title {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  overflow: hidden;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.06);
    color: var(--el-color-primary);
  }

  // 子菜单内有激活项时，标题行高亮
  &.has-active {
    color: var(--el-color-primary);
    font-weight: 500;
  }

  // 收缩态居中
  &.is-collapse {
    justify-content: center;
    padding: 0;
  }
}

// 左侧激活色条
.active-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--el-color-primary);
  border-radius: 0 3px 3px 0;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 16px;
}

.menu-title {
  flex: 1;
  margin-left: 8px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expand-arrow {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: transform 0.25s ease;
  flex-shrink: 0;

  &.is-expanded {
    transform: rotate(90deg);
  }
}

// 子菜单展开/收起动画
.sub-menu-content {
  overflow: hidden;
}

.sub-menu-slide-enter-active,
.sub-menu-slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 600px;
  opacity: 1;
}

.sub-menu-slide-enter-from,
.sub-menu-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
