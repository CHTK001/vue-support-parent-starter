<template>
  <div class="ai-shell">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    <main class="ai-shell__content">
      <router-view v-slot="{ Component, route: r }">
        <transition name="ai-fade" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * AiShell —— AI 工作台主布局
 *
 * ChatGPT 风格：左侧深色侧边栏 + 右侧主内容区。
 * 侧边栏折叠状态持久化到 localStorage。
 */
import { ref, watch } from 'vue';
import AppSidebar from '../components/AppSidebar.vue';

const STORAGE_KEY = 'ai-shell:sidebar-collapsed';
const sidebarCollapsed = ref(localStorage.getItem(STORAGE_KEY) === '1');

watch(sidebarCollapsed, (val) => {
  localStorage.setItem(STORAGE_KEY, val ? '1' : '0');
});
</script>

<style scoped>
.ai-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--ai-content-bg);
}
.ai-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

/* 路由切换动画 */
.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.ai-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.ai-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
