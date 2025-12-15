<script setup lang="ts">
import { ref, onBeforeUnmount, watch, computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";
import DefaultTool from "./themes/Default.vue";
import SpringFestivalTool from "./themes/SpringFestival.vue";
import CyberpunkTool from "./themes/Cyberpunk.vue";

const { $storage } = useGlobal<any>();

// 使用 computed 来响应式读取 storage 中的主题值
const storageTheme = computed(() => $storage?.configure?.systemTheme || 'default');
const currentTheme = ref<string>(storageTheme.value);

console.log('🚀 lay-tool 初始主题:', currentTheme.value);

const handleThemeChange = (themeKey: string) => {
  console.log('🎨 lay-tool 收到主题变化:', themeKey);
  currentTheme.value = themeKey;
};

// 监听 emitter 事件
emitter.on("systemThemeChange", handleThemeChange);

// 同时监听 storage 变化作为备用机制
watch(storageTheme, (newTheme) => {
  if (newTheme && newTheme !== currentTheme.value) {
    console.log('🔄 lay-tool 检测到 storage 主题变化:', newTheme);
    currentTheme.value = newTheme;
  }
}, { immediate: false });

// 监听 data-skin 属性变化作为最终保障
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-skin') {
      const newTheme = document.documentElement.getAttribute('data-skin') || 'default';
      if (newTheme !== currentTheme.value) {
        console.log('🔄 lay-tool 检测到 data-skin 属性变化:', newTheme);
        currentTheme.value = newTheme;
      }
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-skin']
});

onBeforeUnmount(() => {
  emitter.off("systemThemeChange", handleThemeChange);
  observer.disconnect();
});
</script>

<template>
  <DefaultTool v-if="currentTheme === 'default'" />
  <SpringFestivalTool v-else-if="currentTheme === 'spring-festival'" />
  <CyberpunkTool v-else-if="currentTheme === 'cyberpunk'" />
  <DefaultTool v-else />
</template>

<style lang="scss">
// 语言下拉菜单样式（全局）
.lang-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 20px;
    border: none;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 8px 20px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    min-width: 240px;
    backdrop-filter: blur(20px);
  }
}

.lang-menu {
  padding: 0 !important;

  .lang-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      var(--el-fill-color-lighter) 0%,
      var(--el-fill-color-light) 100%
    );
  }

  .lang-item {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    padding: 24px !important;
    margin: 8px 10px;
    margin-bottom: 8px;
    border-radius: 14px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.08) 0%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);

      &::before {
        opacity: 1;
      }

      .lang-flag {
        transform: scale(1.1);
      }
    }

    &.active {
      background: linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.12) 0%,
        rgba(var(--el-color-primary-rgb), 0.06) 100%
      );
      border: 1px solid rgba(var(--el-color-primary-rgb), 0.2);

      .lang-name {
        color: var(--el-color-primary);
        font-weight: 600;
      }

      .lang-check {
        animation: check-pop 0.3s ease;
      }
    }

    .lang-item-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .lang-flag {
      font-size: 28px;
      line-height: 1;
      transition: transform 0.3s ease;
    }

    .lang-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .lang-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .lang-desc {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }

    .lang-check {
      font-size: 20px;
      color: var(--el-color-primary);
      filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
    }
  }
}

@keyframes check-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

// 用户下拉菜单样式（全局）
.user-dropdown-popper {
  .el-dropdown-menu {
    padding: 0;
    border-radius: 24px;
    border: none;
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.18),
      0 10px 30px rgba(0, 0, 0, 0.1),
      0 0 0 1px rgba(0, 0, 0, 0.03);
    overflow: hidden;
    min-width: 300px;
    backdrop-filter: blur(20px);
  }
}

.user-menu {
  padding: 0 !important;

  .menu-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 28px 24px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 50%,
      var(--el-color-primary-light-5) 100%
    );
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10zm-20 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z'/%3E%3C/g%3E%3C/svg%3E");
      pointer-events: none;
    }

    .header-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.95);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 4px rgba(255, 255, 255, 0.1);
      transition: transform 0.3s ease;
      &:hover { transform: scale(1.05); }
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .header-name {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .header-status {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;

      &::before {
        content: "";
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3), 0 0 12px rgba(74, 222, 128, 0.6);
        animation: pulse-online 2s infinite;
      }
    }
  }

  .menu-body {
    padding: 14px 10px;
  }

  .menu-item {
    display: flex !important;
    align-items: center;
    gap: 16px;
    margin-bottom: 6px;
    padding: 28px !important;
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.06), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);
      &::before { opacity: 1; }
      .item-icon { transform: scale(1.1) rotate(5deg); }
      .item-arrow { transform: translateX(6px); opacity: 1; color: var(--el-color-primary); }
    }

    .item-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;
    }

    .account-icon {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35), 0 2px 6px rgba(59, 130, 246, 0.2);
    }

    .cache-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35), 0 2px 6px rgba(245, 158, 11, 0.2);
    }

    .item-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .item-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .item-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.3;
    }

    .item-arrow {
      font-size: 20px;
      color: var(--el-text-color-placeholder);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .menu-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-fill-color-lighter), var(--el-fill-color-light));
  }

  .logout-item {
    display: flex !important;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px !important;
    margin: 0;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .logout-icon {
      font-size: 20px;
      transition: transform 0.3s ease;
    }

    &:hover {
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
      transform: scale(1.02);
      &::before { opacity: 1; }
      .logout-icon { color: #ef4444; transform: translateX(-2px); }
    }

    &:active { transform: scale(0.98); }
  }
}

@keyframes pulse-online {
  0%, 100% { box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3), 0 0 12px rgba(74, 222, 128, 0.6); }
  50% { box-shadow: 0 0 0 5px rgba(74, 222, 128, 0.15), 0 0 16px rgba(74, 222, 128, 0.4); }
}

// 深色模式适配
html.dark {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
  }

  .lang-menu .lang-header {
    background: var(--el-fill-color-dark);
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
    }
    .menu-footer {
      background: var(--el-fill-color-dark);
    }
  }
}

// ==================== 赛博朋克主题下拉样式 ====================
html[data-skin="cyberpunk"] {
  // 赛博朋克颜色变量
  $cyber-cyan: #00ffff;
  $cyber-magenta: #ff00ff;
  $cyber-dark: #0a0a12;
  $cyber-dark-light: #12121f;
  $cyber-glass: rgba(10, 10, 18, 0.95);
  $cyber-border: rgba(0, 255, 255, 0.3);

  // 语言下拉菜单 - 赛博朋克主题
  .lang-dropdown-popper {
    .el-dropdown-menu {
      background: $cyber-glass !important;
      border: 1px solid $cyber-border !important;
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.2),
        0 0 60px rgba(255, 0, 255, 0.1),
        0 20px 60px rgba(0, 0, 0, 0.5) !important;
      border-radius: 12px !important;
      overflow: hidden;
      position: relative;

      // 扫描线效果
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 255, 255, 0.02) 2px,
          rgba(0, 255, 255, 0.02) 4px
        );
        pointer-events: none;
        z-index: 0;
      }
    }
  }

  .lang-menu {
    background: transparent !important;

    .lang-header {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%) !important;
      border-bottom: 1px solid $cyber-border !important;
      color: $cyber-cyan !important;
      position: relative;
      z-index: 1;

      // 底部霓虹线
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, $cyber-cyan 30%, $cyber-magenta 50%, $cyber-cyan 70%, transparent);
      }

      svg {
        color: $cyber-cyan !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6));
      }
    }

    .lang-item {
      background: rgba(10, 10, 18, 0.6) !important;
      border: 1px solid rgba(0, 255, 255, 0.15) !important;
      margin: 8px 10px !important;
      border-radius: 8px !important;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease !important;

      &::before {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%) !important;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.3),
          inset 0 0 15px rgba(0, 255, 255, 0.05) !important;
        transform: translateX(4px) !important;

        .lang-name {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
      }

      &.active {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(255, 0, 255, 0.1) 100%) !important;
        border: 1px solid $cyber-cyan !important;
        box-shadow:
          0 0 20px rgba(0, 255, 255, 0.3),
          0 0 40px rgba(255, 0, 255, 0.15) !important;

        .lang-name {
          color: $cyber-cyan !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.8);
          font-weight: 700 !important;
        }

        .lang-check {
          color: $cyber-cyan !important;
          filter: drop-shadow(0 0 6px rgba(0, 255, 255, 0.8)) !important;
        }
      }

      .lang-flag {
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.3));
      }

      .lang-name {
        color: $cyber-cyan !important;
        font-family: 'Rajdhani', 'Roboto', sans-serif;
        letter-spacing: 0.5px;
      }

      .lang-desc {
        color: rgba(0, 255, 255, 0.6) !important;
      }
    }
  }

  // 用户下拉菜单 - 赛博朋克主题
  .user-dropdown-popper {
    .el-dropdown-menu {
      background: $cyber-glass !important;
      border: 1px solid $cyber-border !important;
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.2),
        0 0 60px rgba(255, 0, 255, 0.1),
        0 25px 80px rgba(0, 0, 0, 0.5) !important;
      border-radius: 16px !important;
      overflow: hidden;
      position: relative;

      // 扫描线效果
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 255, 255, 0.02) 2px,
          rgba(0, 255, 255, 0.02) 4px
        );
        pointer-events: none;
        z-index: 0;
      }
    }
  }

  .user-menu {
    background: transparent !important;

    .menu-header {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(255, 0, 255, 0.1) 100%) !important;
      border-bottom: 1px solid $cyber-border;
      position: relative;
      z-index: 1;

      // 底部霓虹线
      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, $cyber-cyan 20%, $cyber-magenta 50%, $cyber-cyan 80%, transparent);
        animation: cyber-header-glow 2s ease-in-out infinite;
      }

      // 网格背景
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 20px 20px;
        pointer-events: none;
      }

      .header-avatar {
        border-color: $cyber-cyan !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.4),
          0 0 30px rgba(255, 0, 255, 0.2),
          0 8px 24px rgba(0, 0, 0, 0.4) !important;

        &:hover {
          box-shadow:
            0 0 20px rgba(0, 255, 255, 0.6),
            0 0 40px rgba(255, 0, 255, 0.3),
            0 8px 24px rgba(0, 0, 0, 0.4) !important;
        }
      }

      .header-name {
        color: #fff !important;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        font-family: 'Orbitron', 'Rajdhani', monospace;
        letter-spacing: 1px;
      }

      .header-status {
        color: $cyber-cyan !important;

        &::before {
          background: linear-gradient(135deg, $cyber-cyan, #00ffa3) !important;
          box-shadow:
            0 0 0 3px rgba(0, 255, 255, 0.2),
            0 0 15px rgba(0, 255, 255, 0.6) !important;
          animation: cyber-status-pulse 2s infinite;
        }
      }
    }

    .menu-body {
      position: relative;
      z-index: 1;
    }

    .menu-item {
      background: rgba(10, 10, 18, 0.6) !important;
      border: 1px solid rgba(0, 255, 255, 0.15) !important;
      margin: 6px 10px !important;
      border-radius: 10px !important;
      transition: all 0.3s ease !important;

      &::before {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.05) 100%) !important;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.1) !important;
        border-color: $cyber-cyan !important;
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.3),
          inset 0 0 15px rgba(0, 255, 255, 0.05) !important;
        transform: translateX(4px) !important;

        .item-title {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }

        .item-arrow {
          color: $cyber-cyan !important;
          filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6));
        }
      }

      .item-icon {
        box-shadow:
          0 0 15px rgba(0, 255, 255, 0.3),
          0 6px 16px rgba(0, 0, 0, 0.3) !important;
      }

      .account-icon {
        background: linear-gradient(135deg, $cyber-cyan, rgba(0, 200, 255, 0.8)) !important;
        color: $cyber-dark !important;
      }

      .cache-icon {
        background: linear-gradient(135deg, $cyber-magenta, rgba(255, 100, 200, 0.8)) !important;
        color: $cyber-dark !important;
      }

      .item-title {
        color: $cyber-cyan !important;
        font-family: 'Rajdhani', 'Roboto', sans-serif;
        letter-spacing: 0.5px;
      }

      .item-desc {
        color: rgba(0, 255, 255, 0.6) !important;
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.03) 100%) !important;
      border-top: 1px solid $cyber-border !important;
      position: relative;
      z-index: 1;

      // 顶部霓虹线
      &::before {
        content: '';
        position: absolute;
        top: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, $cyber-cyan 30%, $cyber-magenta 50%, $cyber-cyan 70%, transparent);
      }
    }

    .logout-item {
      background: rgba(10, 10, 18, 0.6) !important;
      border: 1px solid rgba(255, 50, 100, 0.3) !important;
      color: rgba(255, 100, 150, 0.9) !important;
      border-radius: 10px !important;

      &::before {
        background: linear-gradient(135deg, rgba(255, 50, 100, 0.15) 0%, rgba(255, 0, 100, 0.1) 100%) !important;
      }

      .logout-icon {
        color: rgba(255, 100, 150, 0.9) !important;
        filter: drop-shadow(0 0 4px rgba(255, 50, 100, 0.5));
      }

      &:hover {
        background: rgba(255, 50, 100, 0.15) !important;
        border-color: rgba(255, 50, 100, 0.6) !important;
        color: #ff6b9d !important;
        box-shadow:
          0 0 15px rgba(255, 50, 100, 0.3),
          inset 0 0 15px rgba(255, 50, 100, 0.05) !important;
        transform: scale(1.02) !important;

        .logout-icon {
          color: #ff6b9d !important;
          filter: drop-shadow(0 0 8px rgba(255, 50, 100, 0.8)) !important;
        }
      }
    }
  }
}

// 赛博朋克主题动画
@keyframes cyber-header-glow {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
    filter: brightness(1.3);
  }
}

@keyframes cyber-status-pulse {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.2), 0 0 15px rgba(0, 255, 255, 0.6);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(0, 255, 255, 0.1), 0 0 25px rgba(0, 255, 255, 0.4);
  }
}
</style>
