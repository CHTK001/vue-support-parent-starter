<template>
  <div class="app-shell">
    <header class="top-bar">
      <div class="top-bar-inner">
        <div class="top-bar-left">
          <router-link to="/" class="brand">
            <span class="brand-mark"></span>
            <span class="brand-name">TShark</span>
          </router-link>
          <nav class="top-nav">
            <router-link to="/" class="nav-link" :class="{ active: isActive('/') }">
              捕获
            </router-link>
          </nav>
        </div>
      </div>
    </header>
    <main class="main-area">
      <div class="page-wrap">
        <router-view v-slot="{ Component }">
          <transition name="fade-up" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--el-border-color-light);
}

.top-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.brand-mark {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--el-color-primary));
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--el-text-color-primary);
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  transition: all 0.15s;
}

.nav-link:hover {
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-9);
}

.nav-link.active {
  color: var(--el-text-color-primary);
  background: var(--el-color-primary-light-9);
}

.main-area {
  min-height: calc(100vh - 52px);
}

.page-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px;
}

.fade-up-enter-active {
  transition: all 0.25s ease-out;
}
.fade-up-leave-active {
  transition: all 0.15s ease-in;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
