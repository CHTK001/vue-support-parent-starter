<template>
  <div class="video-container">
    <div class="module-nav">
      <div
        class="nav-item"
        :class="{ active: activePath === '/video/search' }"
        @click="navigate('/video/search')"
      >
        <IconifyIconOnline icon="ep:search" :size="24" />
        <span>视频搜索</span>
      </div>
      <div
        class="nav-item"
        :class="{ active: activePath === '/video/manage' }"
        @click="navigate('/video/manage')"
      >
        <IconifyIconOnline icon="ep:video-camera" :size="24" />
        <span>视频管理</span>
      </div>
      <div
        class="nav-item"
        :class="{ active: activePath === '/video/sync' }"
        @click="navigate('/video/sync')"
      >
        <IconifyIconOnline icon="ep:connection" :size="24" />
        <span>同步管理</span>
      </div>
    </div>
    
    <div class="module-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const activePath = computed(() => {
  const path = route.path;
  if (path.startsWith('/video/search')) return '/video/search';
  if (path.startsWith('/video/manage')) return '/video/manage';
  if (path.startsWith('/video/sync')) return '/video/sync';
  return path;
});

// 页面挂载时检查当前路径，如果是/video则默认导航到视频搜索页面
onMounted(() => {
  if (route.path === '/video') {
    router.replace('/video/search');
  }
});

// 导航方法
const navigate = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.video-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.module-nav {
  display: flex;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.3s;
  gap: 8px;
  border-bottom: 2px solid transparent;
}

.nav-item:hover {
  color: var(--el-color-primary);
}

.nav-item.active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}

.module-content {
  flex: 1;
  overflow: auto;
  background-color: var(--el-bg-color-page);
}
</style> 