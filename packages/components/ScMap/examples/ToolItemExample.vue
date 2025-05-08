<!--
  ToolItem组件新增属性使用示例
  - activeIcon: 激活状态图标
  - className: 自定义样式类名（red-btn、gray-btn）
-->
<template>
  <div class="tool-item-example">
    <h2>ToolItem组件新增属性示例</h2>
    
    <div class="example-section">
      <h3>1. activeIcon 示例</h3>
      <p>当工具激活时使用activeIcon，未激活时使用icon</p>
      <div class="toolbar-container">
        <ScMap 
          :height="300" 
          :toolbarConfig="activeIconToolbarConfig"
          :center="[39.908, 116.397]"
          :zoom="10"
        />
      </div>
    </div>
    
    <div class="example-section">
      <h3>2. className 样式示例</h3>
      <p>展示不同颜色样式：默认蓝色、红色(red-btn)、灰色(gray-btn)</p>
      <div class="toolbar-container">
        <ScMap 
          :height="300" 
          :toolbarConfig="classNameToolbarConfig"
          :center="[39.908, 116.397]"
          :zoom="10"
        />
      </div>
    </div>
    
    <div class="example-section">
      <h3>3. 组合使用示例</h3>
      <p>activeIcon和className组合使用效果</p>
      <div class="toolbar-container">
        <ScMap 
          :height="300" 
          :toolbarConfig="combinedToolbarConfig"
          :center="[39.908, 116.397]"
          :zoom="10"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ScMap } from '@repo/components';

// 示例图标（这里使用普通SVG字符串，实际使用时请替换为您的图标）
const DEFAULT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
const ACTIVE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88a9.947 9.947 0 0 1 12.28 0C16.43 19.18 14.03 20 12 20z"/></svg>';

const DELETE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';
const SETTINGS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
const SEARCH_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';

// 1. activeIcon 示例配置
const activeIconToolbarConfig = ref({
  position: 'top-left',
  direction: 'horizontal',
  size: 36,
  items: [
    {
      id: 'tool1',
      name: '工具1',
      icon: DEFAULT_ICON,
      activeIcon: ACTIVE_ICON,
      tooltip: '普通图标和激活图标不同'
    },
    {
      id: 'tool2',
      name: '工具2',
      icon: DEFAULT_ICON,
      tooltip: '无激活图标'
    }
  ]
});

// 2. className 样式示例配置
const classNameToolbarConfig = ref({
  position: 'top-left',
  direction: 'horizontal',
  size: 36,
  items: [
    {
      id: 'blue',
      name: '蓝色按钮',
      icon: DEFAULT_ICON,
      tooltip: '默认蓝色样式'
    },
    {
      id: 'red',
      name: '红色按钮',
      icon: DELETE_ICON,
      className: 'red-btn',
      tooltip: '红色样式'
    },
    {
      id: 'gray',
      name: '灰色按钮',
      icon: SETTINGS_ICON,
      className: 'gray-btn',
      tooltip: '灰色样式'
    }
  ]
});

// 3. 组合使用示例配置
const combinedToolbarConfig = ref({
  position: 'top-left',
  direction: 'horizontal',
  size: 36,
  items: [
    {
      id: 'blue-active',
      name: '蓝色激活',
      icon: DEFAULT_ICON,
      activeIcon: ACTIVE_ICON,
      tooltip: '默认蓝色+激活图标'
    },
    {
      id: 'red-active',
      name: '红色激活',
      icon: DELETE_ICON,
      activeIcon: ACTIVE_ICON,
      className: 'red-btn',
      tooltip: '红色+激活图标'
    },
    {
      id: 'gray-active',
      name: '灰色激活',
      icon: SETTINGS_ICON,
      activeIcon: ACTIVE_ICON,
      className: 'gray-btn',
      tooltip: '灰色+激活图标'
    },
    {
      id: 'search',
      name: '搜索',
      icon: SEARCH_ICON,
      activeIcon: ACTIVE_ICON,
      tooltip: '默认蓝色+激活图标'
    }
  ]
});
</script>

<style scoped>
.tool-item-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
  border: 1px solid #eee;
  padding: 20px;
  border-radius: 8px;
}

.toolbar-container {
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

h3 {
  margin-bottom: 10px;
  color: #555;
}

p {
  margin-bottom: 15px;
  color: #666;
}
</style> 