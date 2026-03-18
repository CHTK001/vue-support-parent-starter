<script setup lang="ts">
// 侧边栏单个菜单项展示组件
// 封装激活态左侧色条 + hover 样式，供 NavVertical/NavHover 等使用
defineProps<{
  icon?: string | object;   // 图标
  title?: string;           // 菜单标题
  isActive?: boolean;       // 是否激活
  isCollapse?: boolean;     // 是否收缩
  level?: number;           // 层级（影响缩进）
}>();
</script>

<template>
  <div
    :class="[
      'sidebar-menu-item-wrapper',
      { 'is-active': isActive, 'is-collapse': isCollapse }
    ]"
    :style="level && level > 1 ? { paddingLeft: `${(level - 1) * 16 + 20}px` } : {}"
  >
    <!-- 激活态左侧色条 -->
    <span v-if="isActive" class="active-indicator" aria-hidden="true" />

    <!-- 图标插槽 -->
    <span class="menu-icon">
      <slot name="icon" />
    </span>

    <!-- 标题（收缩时隐藏） -->
    <span v-if="!isCollapse" class="menu-title">
      <slot>{{ title }}</slot>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-menu-item-wrapper {
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

  // 激活态
  &.is-active {
    background: rgba(var(--el-color-primary-rgb), 0.1);
    color: var(--el-color-primary);
    font-weight: 500;
  }

  // 收缩态居中
  &.is-collapse {
    justify-content: center;
    padding: 0;
  }
}

// 左侧 3px 激活色条
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
</style>
