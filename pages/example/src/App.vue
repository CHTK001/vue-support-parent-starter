<template>
  <div class="system-container modern-bg app">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <IconifyIconOnline icon="ri:map-pin-range-line" />
          </div>
          <div class="header-text">
            <h1 class="page-title">ScMap 组件示例</h1>
            <p class="page-subtitle">地图组件功能演示</p>
          </div>
        </div>
        <nav class="header-nav">
          <router-link to="/" class="nav-link">
            <IconifyIconOnline icon="ri:home-line" />
            <span>首页</span>
          </router-link>
          <router-link to="/airline" class="nav-link">
            <IconifyIconOnline icon="ri:flight-takeoff-line" />
            <span>航线示例</span>
          </router-link>
        </nav>
      </div>
    </header>
    <main class="page-content">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
</script>

<style scoped lang="scss">
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.6s ease-out;
}

.page-header {
  position: relative;
  z-index: 10;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 12px;
  font-size: 24px;
  color: white;
  box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.3);
}

.header-text {
  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 4px 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.header-nav {
  display: flex;
  gap: 12px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  text-decoration: none;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }

  &.router-link-active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
}

.page-content {
  flex: 1;
  padding: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

:root.dark {
  .page-header {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(51, 65, 85, 0.5);
  }

  .nav-link {
    &:hover {
      background: rgba(51, 65, 85, 0.5);
    }

    &.router-link-active {
      background: rgba(var(--el-color-primary-rgb), 0.2);
    }
  }
}
</style>
