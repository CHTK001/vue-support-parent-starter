<template>
  <div class="strategy-standalone-app">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-left">
        <div class="logo">
          <i class="ri-shield-check-fill"></i>
          <span>策略管理中心</span>
        </div>
      </div>
      <nav class="header-nav">
        <router-link to="/limit" class="nav-item" :class="{ active: $route.path === '/limit' }">
          <i class="ri-speed-line"></i>
          <span>限流配置</span>
        </router-link>
        <router-link to="/limit-record" class="nav-item" :class="{ active: $route.path === '/limit-record' }">
          <i class="ri-history-line"></i>
          <span>限流记录</span>
        </router-link>
      </nav>
      <div class="header-right">
        <el-dropdown>
          <el-button text>
            <i class="ri-settings-3-line"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="toggleTheme">
                <i :class="isDark ? 'ri-sun-line' : 'ri-moon-line'"></i>
                {{ isDark ? '浅色模式' : '深色模式' }}
              </el-dropdown-item>
              <el-dropdown-item @click="showAbout = true">
                <i class="ri-information-line"></i>
                关于
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 关于对话框 -->
    <el-dialog v-model="showAbout" title="关于" width="400px">
      <div class="about-content">
        <div class="about-logo">
          <i class="ri-shield-check-fill"></i>
        </div>
        <h2>策略管理中心</h2>
        <p class="version">版本 1.0.0</p>
        <p class="description">
          提供限流、熔断、降级等策略的配置管理功能，
          帮助您保护系统稳定性。
        </p>
        <div class="features">
          <div class="feature-item">
            <i class="ri-speed-line"></i>
            <span>限流配置</span>
          </div>
          <div class="feature-item">
            <i class="ri-history-line"></i>
            <span>限流记录</span>
          </div>
          <div class="feature-item">
            <i class="ri-pulse-line"></i>
            <span>熔断策略</span>
          </div>
          <div class="feature-item">
            <i class="ri-arrow-down-circle-line"></i>
            <span>降级策略</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const isDark = ref(false);
const showAbout = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
};

onMounted(() => {
  // 检测系统主题
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (prefersDark) {
    isDark.value = true;
    document.documentElement.classList.add("dark");
  }
});
</script>

<style lang="scss">
.strategy-standalone-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 24px;
    background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);

    .header-left {
      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        font-size: 18px;
        font-weight: 600;

        i {
          font-size: 24px;
          color: #00d4ff;
        }
      }
    }

    .header-nav {
      display: flex;
      gap: 8px;

      .nav-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.3s ease;

        i {
          font-size: 16px;
        }

        &:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        &.active {
          color: #00d4ff;
          background: rgba(0, 212, 255, 0.15);
        }
      }
    }

    .header-right {
      .el-button {
        color: rgba(255, 255, 255, 0.8);

        &:hover {
          color: #00d4ff;
        }

        i {
          font-size: 20px;
        }
      }
    }
  }

  .app-main {
    flex: 1;
    overflow: auto;
    padding: 20px;
  }
}

// 过渡动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 关于对话框
.about-content {
  text-align: center;
  padding: 20px 0;

  .about-logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
    border-radius: 20px;

    i {
      font-size: 40px;
      color: #00d4ff;
    }
  }

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    color: var(--el-text-color-primary);
  }

  .version {
    margin: 0 0 16px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .description {
    margin: 0 0 24px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--el-fill-color-light);
      border-radius: 8px;

      i {
        font-size: 18px;
        color: #00d4ff;
      }

      span {
        font-size: 13px;
        color: var(--el-text-color-regular);
      }
    }
  }
}
</style>
