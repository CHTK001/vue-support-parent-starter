<template>
  <el-aside width="220px" class="category-sidebar">
    <h3 class="sidebar-title">软件分类</h3>
    <el-menu :default-active="activeCategory" class="category-menu" @select="handleSelect">
      <el-menu-item index="all">
        <IconifyIconOnline icon="ep:menu" class="mr-2" />
        全部软件
      </el-menu-item>
      <el-menu-item index="database">
        <IconifyIconOnline :icon="getCategoryIcon('database')" class="mr-2" />
        数据库
      </el-menu-item>
      <el-menu-item index="web_server">
        <IconifyIconOnline :icon="getCategoryIcon('web_server')" class="mr-2" />
        Web服务器
      </el-menu-item>
      <el-menu-item index="development">
        <IconifyIconOnline :icon="getCategoryIcon('development')" class="mr-2" />
        开发工具
      </el-menu-item>
      <el-menu-item index="monitoring">
        <IconifyIconOnline :icon="getCategoryIcon('monitoring')" class="mr-2" />
        监控工具
      </el-menu-item>
      <el-menu-item index="container">
        <IconifyIconOnline :icon="getCategoryIcon('container')" class="mr-2" />
        容器
      </el-menu-item>
      <el-menu-item index="other">
        <IconifyIconOnline :icon="getCategoryIcon('other')" class="mr-2" />
        其他
      </el-menu-item>
      <el-divider />
      <el-menu-item index="installed">
        <IconifyIconOnline icon="ep:check" class="mr-2" />
        已安装
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  activeCategory: {
    type: String,
    default: 'all'
  }
});

const emit = defineEmits(['select']);

// 获取分类图标
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "database":
      return "ep:data-line";
    case "web_server":
      return "ep:connection";
    case "development":
      return "ri:tools-line";
    case "monitoring":
      return "ep:monitor";
    case "container":
      return "ep:box";
    case "other":
      return "ep:more-filled";
    default:
      return "ep:menu";
  }
};

// 处理分类选择
const handleSelect = (index: string) => {
  emit('select', index);
};
</script>

<style lang="scss" scoped>
.category-sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  height: 100%;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  .sidebar-title {
    padding: 20px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .category-menu {
    border-right: none;

    .el-menu-item {
      height: 50px;
      line-height: 50px;

      &.is-active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 500;

        &::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: var(--el-color-primary);
        }
      }

      &:hover:not(.is-active) {
        background-color: var(--el-fill-color-light);
      }
    }
  }
}
</style> 