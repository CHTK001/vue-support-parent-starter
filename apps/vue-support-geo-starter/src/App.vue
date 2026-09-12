<template>
  <div class="geo-shell">
    <header class="geo-header">
      <div class="geo-brand" @click="goWorkspace">
        <div class="geo-logo">
          <el-icon :size="18"><MapLocation /></el-icon>
        </div>
        <div class="geo-title">GeoDownloader</div>
      </div>
      <nav class="geo-nav">
        <el-menu
          mode="horizontal"
          :default-active="activeRoute"
          :ellipsis="false"
          router
          class="geo-menu"
        >
          <el-menu-item index="/workspace">
            <el-icon><Platform /></el-icon>
            工作台
          </el-menu-item>
          <el-menu-item index="/tasks">
            <el-icon><List /></el-icon>
            任务中心
          </el-menu-item>
          <el-menu-item index="/history">
            <el-icon><Clock /></el-icon>
            下载历史
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            设置
          </el-menu-item>
        </el-menu>
      </nav>
      <div class="geo-header-right">
        <el-tag type="info" effect="plain" round>vite + vue3 + leaflet</el-tag>
      </div>
    </header>

    <main class="geo-main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.fullPath" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * GeoDownloader 应用根组件
 *
 * 包含顶部导航栏（工作台/任务中心/下载历史/设置）与主内容路由出口
 * @author CH
 * @since 4.0.0
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { MapLocation, Platform, List, Clock, Setting } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();

const activeRoute = computed(() => route.path);

/** 跳转至工作台页面 */
const goWorkspace = () => {
  router.push("/workspace");
};
</script>

<style lang="scss" scoped>
.geo-shell {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color);
}

.geo-header {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.geo-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.geo-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-5));
  color: #fff;
}

.geo-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.geo-nav {
  flex: 1;
}

.geo-menu {
  border-bottom: none;
}

.geo-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.geo-main {
  flex: 1;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
