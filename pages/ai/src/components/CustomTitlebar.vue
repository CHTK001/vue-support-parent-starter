<template>
  <div v-if="isElectron"
    class="custom-titlebar flex items-center justify-between h-8 sidebar-transparent-bg select-none drag-region">
    <!-- 左侧：应用标题 + 菜单按钮 -->
    <TitlebarLeftPanel />

    <!-- 右侧：窗口控制按钮 -->
    <WindowControls />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import WindowControls from './WindowControls.vue'
// 模板里用了 <TitlebarLeftPanel />，此前**漏了 import** —— Vue 解析不到会抛
// "Failed to resolve component: TitlebarLeftPanel" 警告并中断该节点渲染。
import TitlebarLeftPanel from './TitlebarLeftPanel.vue'

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
})
</script>

<style scoped>
.drag-region {
  -webkit-app-region: drag;
}

/* 红色顶条上的窗口控制按钮用标题栏文字色（famicom 下为白），
   hover 在深红高亮背景上同样保持白色。
   CSS 变量沿 DOM 继承穿透子组件，无需 :deep 选择器 */
.custom-titlebar {
  --window-controls-color: var(--titlebar-text-color);
  --window-controls-hover-color: var(--titlebar-text-color);
}
</style>
