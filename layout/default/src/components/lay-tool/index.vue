<script setup lang="ts">
/**
 * lay-tool 组件
 * @description 使用 useThemeComponent Hook 统一管理主题切换
 * @version 2.1.0 - 支持主题组件懒加载
 */
import { defineAsyncComponent } from "vue";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import DefaultTool from "./themes/Default.vue";

// 主题组件映射 - 默认主题静态导入，其他主题懒加载
const themeComponents = {
  'default': DefaultTool,
  
  'future-tech': defineAsyncComponent(() => import("./themes/FutureTech.vue")),
};

// 使用统一的主题切换 Hook
const { CurrentComponent, currentTheme } = useThemeComponent(themeComponents, DefaultTool);
</script>

<template>
  <!-- 工具栏主题切换同样不再依赖 key 触发整体重建 -->
  <component :is="CurrentComponent" />
</template>

<style lang="scss">
// 璇█涓嬫媺鑿滃崟鏍峰紡锛堝叏灞€锛?
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

// 鐢ㄦ埛涓嬫媺鑿滃崟鏍峰紡锛堝叏灞€锛?
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

// ==================== 主题适配 ====================

// 春节主题
$spring-red: #DC143C;
$spring-red-dark: #B22222;
$spring-gold: #FFD700;

html[data-skin="spring-festival"],
html.theme-spring-festival {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: linear-gradient(180deg, $spring-red 0%, $spring-red-dark 100%) !important;
    border: 2px solid $spring-gold !important;
    box-shadow: 0 0 20px rgba($spring-gold, 0.3), 0 20px 60px rgba(0, 0, 0, 0.4) !important;
  }

  .lang-menu {
    .lang-header {
      background: linear-gradient(135deg, rgba($spring-gold, 0.2) 0%, rgba(139, 0, 0, 0.2) 100%) !important;
      border-bottom-color: rgba($spring-gold, 0.4) !important;
      color: $spring-gold !important;
      svg { color: $spring-gold !important; }
    }

    .lang-item {
      background: rgba(139, 0, 0, 0.4) !important;
      border: 1px solid rgba($spring-gold, 0.2) !important;
      .lang-name { color: rgba(255, 255, 255, 0.95) !important; }
      .lang-desc { color: rgba($spring-gold, 0.7) !important; }

      &:hover {
        background: rgba($spring-gold, 0.15) !important;
        border-color: $spring-gold !important;
        .lang-name { color: $spring-gold !important; }
      }

      &.active {
        background: linear-gradient(135deg, rgba($spring-gold, 0.2) 0%, rgba(139, 0, 0, 0.3) 100%) !important;
        border-color: $spring-gold !important;
        .lang-name { color: $spring-gold !important; font-weight: 700; }
        .lang-check { color: $spring-gold !important; }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(135deg, rgba($spring-gold, 0.2) 0%, rgba(139, 0, 0, 0.25) 100%) !important;
      border-bottom: 1px solid rgba($spring-gold, 0.4) !important;
      .header-avatar { border-color: $spring-gold !important; box-shadow: 0 0 15px rgba($spring-gold, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3) !important; }
      .header-name { color: $spring-gold !important; }
      .header-status { color: rgba(255, 255, 255, 0.9) !important; }
    }

    .menu-body {
      background: transparent !important;
    }

    .menu-item {
      background: rgba(139, 0, 0, 0.4) !important;
      border: 1px solid rgba($spring-gold, 0.2) !important;
      .item-title { color: rgba(255, 255, 255, 0.95) !important; }
      .item-desc { color: rgba($spring-gold, 0.7) !important; }
      .account-icon { background: linear-gradient(135deg, $spring-gold, #DAA520) !important; color: $spring-red-dark !important; }
      .cache-icon { background: linear-gradient(135deg, $spring-red, $spring-red-dark) !important; color: #fff !important; box-shadow: 0 6px 16px rgba($spring-red, 0.35) !important; }
      &:hover {
        background: rgba($spring-gold, 0.15) !important;
        border-color: $spring-gold !important;
        .item-title { color: $spring-gold !important; }
        .item-arrow { color: $spring-gold !important; }
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba($spring-gold, 0.1) 0%, rgba(139, 0, 0, 0.15) 100%) !important;
      border-top-color: rgba($spring-gold, 0.4) !important;
    }

    .logout-item {
      background: rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(255, 100, 100, 0.3) !important;
      color: rgba(255, 200, 200, 0.9) !important;
      .logout-icon { color: rgba(255, 200, 200, 0.9) !important; }
      &:hover {
        background: rgba(255, 100, 100, 0.2) !important;
        border-color: rgba(255, 150, 150, 0.5) !important;
        color: #fff !important;
        .logout-icon { color: #fff !important; }
      }
    }
  }
}



// 中秋主题
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;

html[data-skin="mid-autumn"],
html.theme-mid-autumn {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: linear-gradient(180deg, $mid-blue 0%, $mid-blue-light 100%) !important;
    border: 2px solid $mid-gold !important;
    box-shadow: 0 0 20px rgba($mid-gold, 0.3), 0 20px 60px rgba(0, 0, 0, 0.4) !important;
  }

  .lang-menu {
    .lang-header {
      background: linear-gradient(135deg, rgba($mid-gold, 0.2) 0%, rgba($mid-blue, 0.2) 100%) !important;
      border-bottom-color: rgba($mid-gold, 0.4) !important;
      color: $mid-gold !important;
      svg { color: $mid-gold !important; }
    }

    .lang-item {
      background: rgba($mid-blue, 0.4) !important;
      border: 1px solid rgba($mid-gold, 0.2) !important;
      .lang-name { color: rgba(255, 255, 255, 0.95) !important; }
      .lang-desc { color: rgba($mid-gold, 0.7) !important; }

      &:hover {
        background: rgba($mid-gold, 0.15) !important;
        border-color: $mid-gold !important;
        .lang-name { color: $mid-gold !important; }
      }

      &.active {
        background: linear-gradient(135deg, rgba($mid-gold, 0.2) 0%, rgba($mid-blue, 0.3) 100%) !important;
        border-color: $mid-gold !important;
        .lang-name { color: $mid-gold !important; font-weight: 700; }
        .lang-check { color: $mid-gold !important; }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(135deg, rgba($mid-gold, 0.2) 0%, rgba($mid-blue, 0.25) 100%) !important;
      border-bottom: 1px solid rgba($mid-gold, 0.4) !important;
      .header-avatar { border-color: $mid-gold !important; box-shadow: 0 0 15px rgba($mid-gold, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3) !important; }
      .header-name { color: $mid-gold !important; }
      .header-status { color: rgba(255, 255, 255, 0.9) !important; }
    }

    .menu-body {
      background: transparent !important;
    }

    .menu-item {
      background: rgba($mid-blue, 0.4) !important;
      border: 1px solid rgba($mid-gold, 0.2) !important;
      .item-title { color: rgba(255, 255, 255, 0.95) !important; }
      .item-desc { color: rgba($mid-gold, 0.7) !important; }
      .account-icon { background: linear-gradient(135deg, $mid-gold, #ffecb3) !important; color: $mid-blue !important; }
      .cache-icon { background: linear-gradient(135deg, $mid-blue, $mid-blue-light) !important; color: #fff !important; }
      &:hover {
        background: rgba($mid-gold, 0.15) !important;
        border-color: $mid-gold !important;
        .item-title { color: $mid-gold !important; }
        .item-arrow { color: $mid-gold !important; }
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba($mid-gold, 0.1) 0%, rgba($mid-blue, 0.15) 100%) !important;
      border-top-color: rgba($mid-gold, 0.4) !important;
    }

    .logout-item {
      background: rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(255, 100, 100, 0.3) !important;
      color: rgba(255, 200, 200, 0.9) !important;
      .logout-icon { color: rgba(255, 200, 200, 0.9) !important; }
      &:hover {
        background: rgba(255, 100, 100, 0.2) !important;
        color: #fff !important;
        .logout-icon { color: #fff !important; }
      }
    }
  }
}

// 圣诞主题
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-gold: #ffd700;

html[data-skin="christmas"],
html.theme-christmas {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: linear-gradient(180deg, $xmas-green 0%, $xmas-green-light 100%) !important;
    border: 2px solid $xmas-gold !important;
    box-shadow: 0 0 20px rgba($xmas-gold, 0.3), 0 20px 60px rgba(0, 0, 0, 0.4) !important;
  }

  .lang-menu {
    .lang-header {
      background: linear-gradient(135deg, rgba($xmas-gold, 0.2) 0%, rgba($xmas-green, 0.2) 100%) !important;
      border-bottom-color: rgba($xmas-gold, 0.4) !important;
      color: $xmas-gold !important;
      svg { color: $xmas-gold !important; }
    }

    .lang-item {
      background: rgba($xmas-green, 0.4) !important;
      border: 1px solid rgba($xmas-gold, 0.2) !important;
      .lang-name { color: rgba(255, 255, 255, 0.95) !important; }
      .lang-desc { color: rgba($xmas-gold, 0.7) !important; }

      &:hover {
        background: rgba($xmas-gold, 0.15) !important;
        border-color: $xmas-gold !important;
        .lang-name { color: $xmas-gold !important; }
      }

      &.active {
        background: linear-gradient(135deg, rgba($xmas-gold, 0.2) 0%, rgba(198, 40, 40, 0.2) 100%) !important;
        border-color: $xmas-gold !important;
        .lang-name { color: $xmas-gold !important; font-weight: 700; }
        .lang-check { color: $xmas-gold !important; }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(135deg, rgba($xmas-gold, 0.2) 0%, rgba($xmas-red, 0.15) 100%) !important;
      border-bottom: 1px solid rgba($xmas-gold, 0.4) !important;
      .header-avatar { border-color: $xmas-gold !important; box-shadow: 0 0 15px rgba($xmas-gold, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3) !important; }
      .header-name { color: $xmas-gold !important; }
      .header-status { color: rgba(255, 255, 255, 0.9) !important; }
    }

    .menu-body {
      background: transparent !important;
    }

    .menu-item {
      background: rgba($xmas-green, 0.4) !important;
      border: 1px solid rgba($xmas-gold, 0.2) !important;
      .item-title { color: rgba(255, 255, 255, 0.95) !important; }
      .item-desc { color: rgba($xmas-gold, 0.7) !important; }
      .account-icon { background: linear-gradient(135deg, $xmas-gold, #daa520) !important; color: $xmas-green !important; }
      .cache-icon { background: linear-gradient(135deg, $xmas-red, #e53935) !important; color: #fff !important; }
      &:hover {
        background: rgba($xmas-gold, 0.15) !important;
        border-color: $xmas-gold !important;
        .item-title { color: $xmas-gold !important; }
        .item-arrow { color: $xmas-gold !important; }
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba($xmas-gold, 0.1) 0%, rgba($xmas-red, 0.1) 100%) !important;
      border-top-color: rgba($xmas-gold, 0.4) !important;
    }

    .logout-item {
      background: rgba($xmas-red, 0.3) !important;
      border: 1px solid rgba(255, 100, 100, 0.3) !important;
      color: rgba(255, 200, 200, 0.9) !important;
      .logout-icon { color: rgba(255, 200, 200, 0.9) !important; }
      &:hover {
        background: rgba(255, 100, 100, 0.25) !important;
        color: #fff !important;
        .logout-icon { color: #fff !important; }
      }
    }
  }
}

// 元旦主题
$ice-lightest: #F5FBFF;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$frost-purple: #E0E7F5;

html[data-skin="new-year"],
html.theme-new-year {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: linear-gradient(180deg, rgba($ice-lightest, 0.98) 0%, rgba($frost-purple, 0.95) 100%) !important;
    border: 2px solid rgba($ice-primary, 0.4) !important;
    box-shadow: 0 0 20px rgba($ice-primary, 0.2), 0 20px 60px rgba(0, 0, 0, 0.15) !important;
    backdrop-filter: blur(12px);
  }

  .lang-menu {
    .lang-header {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba($ice-lightest, 0.6) 100%) !important;
      border-bottom-color: rgba($ice-primary, 0.3) !important;
      color: $ice-deep !important;
      svg { color: $ice-primary !important; }
    }

    .lang-item {
      background: rgba(255, 255, 255, 0.6) !important;
      border: 1px solid rgba($ice-primary, 0.2) !important;
      .lang-name { color: $ice-deep !important; }
      .lang-desc { color: rgba($ice-deep, 0.7) !important; }

      &:hover {
        background: rgba($ice-primary, 0.1) !important;
        border-color: rgba($ice-primary, 0.4) !important;
        .lang-name { color: $ice-deep !important; }
      }

      &.active {
        background: linear-gradient(135deg, $ice-primary, $ice-deep) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
        .lang-name { color: #fff !important; font-weight: 700; }
        .lang-desc { color: rgba(255, 255, 255, 0.8) !important; }
        .lang-check { color: #fff !important; }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(135deg, $ice-primary 0%, $ice-deep 100%) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
      .header-avatar { border-color: rgba(255, 255, 255, 0.8) !important; box-shadow: 0 0 15px rgba($ice-primary, 0.4), 0 8px 24px rgba(0, 0, 0, 0.2) !important; }
      .header-name { color: #fff !important; }
      .header-status { color: rgba(255, 255, 255, 0.9) !important; }
    }

    .menu-body {
      background: transparent !important;
    }

    .menu-item {
      background: rgba(255, 255, 255, 0.6) !important;
      border: 1px solid rgba($ice-primary, 0.2) !important;
      .item-title { color: #1E5F8C !important; }
      .item-desc { color: rgba($ice-deep, 0.7) !important; }
      .account-icon { background: linear-gradient(135deg, $ice-primary, $ice-deep) !important; color: #fff !important; }
      .cache-icon { background: linear-gradient(135deg, #f59e0b, #d97706) !important; color: #fff !important; }
      &:hover {
        background: rgba($ice-primary, 0.1) !important;
        border-color: rgba($ice-primary, 0.4) !important;
        .item-title { color: $ice-deep !important; }
        .item-arrow { color: $ice-primary !important; }
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba($frost-purple, 0.4) 100%) !important;
      border-top-color: rgba($ice-primary, 0.2) !important;
    }

    .logout-item {
      background: rgba(239, 68, 68, 0.1) !important;
      border: 1px solid rgba(239, 68, 68, 0.2) !important;
      color: #ef4444 !important;
      .logout-icon { color: #ef4444 !important; }
      &:hover {
        background: rgba(239, 68, 68, 0.15) !important;
        border-color: rgba(239, 68, 68, 0.4) !important;
        color: #dc2626 !important;
        .logout-icon { color: #dc2626 !important; }
      }
    }
  }
}

// 万圣节主题
$hw-pumpkin: #ff7518;
$hw-purple: #2c003e;
$hw-purple-dark: #1a0026;
$hw-gold: #ffd180;

html[data-skin="halloween"],
html.theme-halloween {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: linear-gradient(180deg, $hw-purple 0%, $hw-purple-dark 100%) !important;
    border: 2px solid $hw-pumpkin !important;
    box-shadow:
      0 0 20px rgba($hw-pumpkin, 0.4),
      0 20px 60px rgba(0, 0, 0, 0.8) !important;
  }

  .lang-menu {
    .lang-header {
      background: linear-gradient(135deg, rgba($hw-pumpkin, 0.25) 0%, rgba($hw-purple, 0.3) 100%) !important;
      border-bottom-color: rgba($hw-pumpkin, 0.5) !important;
      color: $hw-gold !important;
      svg { color: $hw-gold !important; }
    }

    .lang-item {
      background: rgba($hw-purple, 0.6) !important;
      border: 1px solid rgba($hw-pumpkin, 0.3) !important;
      .lang-name { color: rgba(255, 255, 255, 0.96) !important; }
      .lang-desc { color: rgba($hw-gold, 0.7) !important; }

      &:hover {
        background: rgba($hw-pumpkin, 0.15) !important;
        border-color: $hw-pumpkin !important;
        .lang-name { color: $hw-gold !important; }
      }

      &.active {
        background: linear-gradient(135deg, rgba($hw-pumpkin, 0.25) 0%, rgba($hw-purple-dark, 0.7) 100%) !important;
        border-color: $hw-pumpkin !important;
        .lang-name { color: $hw-gold !important; font-weight: 700; }
        .lang-check { color: $hw-gold !important; }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: linear-gradient(135deg, rgba($hw-pumpkin, 0.25) 0%, rgba($hw-purple, 0.4) 100%) !important;
      border-bottom: 1px solid rgba($hw-pumpkin, 0.5) !important;
      .header-avatar {
        border-color: $hw-pumpkin !important;
        box-shadow:
          0 0 15px rgba($hw-pumpkin, 0.5),
          0 8px 24px rgba(0, 0, 0, 0.4) !important;
      }
      .header-name { color: $hw-gold !important; }
      .header-status { color: rgba(255, 255, 255, 0.9) !important; }
    }

    .menu-body {
      background: transparent !important;
    }

    .menu-item {
      background: rgba($hw-purple, 0.65) !important;
      border: 1px solid rgba($hw-pumpkin, 0.35) !important;
      .item-title { color: rgba(255, 255, 255, 0.96) !important; }
      .item-desc { color: rgba($hw-gold, 0.75) !important; }
      .account-icon {
        background: linear-gradient(135deg, $hw-pumpkin, #ffb74d) !important;
        color: #2b0f33 !important;
      }
      .cache-icon {
        background: linear-gradient(135deg, #4a148c, #7b1fa2) !important;
        color: #fff !important;
      }
      &:hover {
        background: rgba($hw-pumpkin, 0.18) !important;
        border-color: $hw-pumpkin !important;
        .item-title { color: $hw-gold !important; }
        .item-arrow { color: $hw-gold !important; }
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba($hw-pumpkin, 0.15) 0%, rgba($hw-purple, 0.3) 100%) !important;
      border-top-color: rgba($hw-pumpkin, 0.45) !important;
    }

    .logout-item {
      background: rgba(0, 0, 0, 0.45) !important;
      border: 1px solid rgba(255, 120, 120, 0.4) !important;
      color: rgba(255, 220, 220, 0.95) !important;
      .logout-icon { color: rgba(255, 220, 220, 0.95) !important; }
      &:hover {
        background: rgba(255, 120, 120, 0.25) !important;
        border-color: rgba(255, 160, 160, 0.6) !important;
        color: #fff !important;
        .logout-icon { color: #fff !important; }
      }
    }
  }
}

// 未来科技主题
$ft-bg: #050a1f;
$ft-bg-alt: #0a1a3a;
$ft-cyan: #00ffff;

html[data-skin="future-tech"],
html.theme-future-tech {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: radial-gradient(circle at top, rgba($ft-cyan, 0.16), rgba($ft-bg, 0.98)) !important;
    border: 1px solid rgba($ft-cyan, 0.5) !important;
    box-shadow:
      0 0 20px rgba($ft-cyan, 0.45),
      0 20px 60px rgba(0, 0, 0, 0.8) !important;
    backdrop-filter: blur(18px);
  }

  .lang-menu {
    .lang-header {
      background: linear-gradient(135deg, rgba($ft-cyan, 0.2) 0%, rgba($ft-bg-alt, 0.9) 100%) !important;
      border-bottom-color: rgba($ft-cyan, 0.5) !important;
      color: $ft-cyan !important;
      svg { color: $ft-cyan !important; filter: drop-shadow(0 0 8px rgba($ft-cyan, 0.8)); }
    }

    .lang-item {
      background: rgba($ft-bg-alt, 0.9) !important;
      border: 1px solid rgba($ft-cyan, 0.35) !important;
      .lang-name { color: #e6f9ff !important; }
      .lang-desc { color: rgba($ft-cyan, 0.7) !important; }

      &:hover {
        background: linear-gradient(135deg, rgba($ft-cyan, 0.18), rgba($ft-bg-alt, 0.95)) !important;
        border-color: rgba($ft-cyan, 0.65) !important;
        .lang-name { color: $ft-cyan !important; }
      }

      &.active {
        background: linear-gradient(135deg, rgba($ft-cyan, 0.25) 0%, rgba($ft-bg, 0.9) 100%) !important;
        border-color: rgba($ft-cyan, 0.8) !important;
        box-shadow: 0 0 16px rgba($ft-cyan, 0.6) !important;
        .lang-name { color: $ft-cyan !important; font-weight: 700; }
        .lang-check { color: $ft-cyan !important; filter: drop-shadow(0 0 6px rgba($ft-cyan, 0.9)); }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: radial-gradient(circle at top left, rgba($ft-cyan, 0.3), rgba($ft-bg-alt, 0.95)) !important;
      border-bottom: 1px solid rgba($ft-cyan, 0.5) !important;
      .header-avatar {
        border-color: rgba($ft-cyan, 0.8) !important;
        box-shadow:
          0 0 18px rgba($ft-cyan, 0.7),
          0 8px 24px rgba(0, 0, 0, 0.6) !important;
      }
      .header-name {
        color: $ft-cyan !important;
        text-shadow:
          0 0 10px rgba($ft-cyan, 0.9),
          0 0 18px rgba($ft-cyan, 0.5);
      }
      .header-status { color: rgba(200, 240, 255, 0.9) !important; }
    }

    .menu-body {
      background: transparent !important;
    }

    .menu-item {
      background: rgba($ft-bg, 0.95) !important;
      border: 1px solid rgba($ft-cyan, 0.3) !important;
      .item-title { color: #e6f9ff !important; }
      .item-desc { color: rgba($ft-cyan, 0.7) !important; }
      .account-icon {
        background: linear-gradient(135deg, $ft-cyan, #4dfdfd) !important;
        color: #050a1f !important;
      }
      .cache-icon {
        background: linear-gradient(135deg, #7c3aed, #1e40af) !important;
        color: #e6f9ff !important;
      }
      &:hover {
        background: linear-gradient(135deg, rgba($ft-cyan, 0.18), rgba($ft-bg, 0.96)) !important;
        border-color: rgba($ft-cyan, 0.7) !important;
        box-shadow:
          0 0 18px rgba($ft-cyan, 0.6),
          0 8px 24px rgba(0, 0, 0, 0.6) !important;
        .item-title { color: $ft-cyan !important; }
        .item-arrow { color: $ft-cyan !important; }
      }
    }

    .menu-footer {
      background: linear-gradient(135deg, rgba($ft-bg-alt, 0.95), rgba($ft-cyan, 0.16)) !important;
      border-top-color: rgba($ft-cyan, 0.4) !important;
    }

    .logout-item {
      background: rgba(0, 0, 0, 0.6) !important;
      border: 1px solid rgba(239, 68, 68, 0.6) !important;
      color: rgba(255, 220, 220, 0.95) !important;
      .logout-icon { color: rgba(255, 220, 220, 0.95) !important; }
      &:hover {
        background: rgba(239, 68, 68, 0.22) !important;
        border-color: rgba(248, 113, 113, 0.8) !important;
        color: #fff !important;
        .logout-icon { color: #fff !important; }
      }
    }
  }
}

// 像素艺术主题
$pixel-black: #000000;
$pixel-white: #ffffff;
$pixel-gray: #808080;
$pixel-primary: #00ff00;

html[data-skin="8bit"],
html.theme-8bit {
  .lang-dropdown-popper .el-dropdown-menu,
  .user-dropdown-popper .el-dropdown-menu {
    background: $pixel-white !important;
    border: 4px solid $pixel-black !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    image-rendering: pixelated;
  }

  .lang-menu {
    .lang-header {
      background: $pixel-black !important;
      color: $pixel-primary !important;
      border-bottom: 2px solid $pixel-primary !important;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-family: "Press Start 2P", "Pixel CN", monospace;
      svg { color: $pixel-primary !important; }
    }

    .lang-item {
      background: $pixel-white !important;
      border-radius: 0 !important;
      border: 2px solid $pixel-black !important;
      box-shadow: none !important;
      transform: none !important;

      .lang-name {
        color: $pixel-black !important;
        font-family: "Pixel CN", "Press Start 2P", monospace;
      }

      .lang-desc {
        color: $pixel-gray !important;
        font-size: 11px;
      }

      &:hover {
        background: #e5e5e5 !important;
        border-color: $pixel-black !important;
      }

      &.active {
        background: $pixel-primary !important;
        border-color: $pixel-black !important;
        .lang-name { color: $pixel-black !important; font-weight: 700; }
        .lang-check { color: $pixel-black !important; }
      }
    }
  }

  .user-menu {
    .menu-header {
      background: $pixel-black !important;
      border-bottom: 2px solid $pixel-primary !important;
      .header-avatar {
        border-radius: 0 !important;
        border: 3px solid $pixel-primary !important;
        box-shadow: none !important;
      }
      .header-name {
        color: $pixel-primary !important;
        font-family: "Pixel CN", "Press Start 2P", monospace;
      }
      .header-status {
        color: $pixel-white !important;
        font-size: 11px;
      }
    }

    .menu-body {
      background: $pixel-white !important;
    }

    .menu-item {
      background: $pixel-white !important;
      border-radius: 0 !important;
      border: 2px solid $pixel-black !important;
      box-shadow: none !important;
      transform: none !important;

      .item-title {
        color: $pixel-black !important;
        font-family: "Pixel CN", "Press Start 2P", monospace;
      }

      .item-desc {
        color: $pixel-gray !important;
      }

      .item-arrow {
        color: $pixel-black !important;
        opacity: 1 !important;
      }

      &:hover {
        background: #e5e5e5 !important;
        border-color: $pixel-black !important;
      }
    }

    .menu-footer {
      background: $pixel-white !important;
      border-top: 2px solid $pixel-black !important;
    }

    .logout-item {
      background: $pixel-black !important;
      border-radius: 0 !important;
      border: 2px solid $pixel-black !important;
      color: $pixel-primary !important;
      box-shadow: none !important;
      .logout-icon { color: $pixel-primary !important; }
      &:hover {
        background: $pixel-primary !important;
        color: $pixel-black !important;
        .logout-icon { color: $pixel-black !important; }
      }
    }
  }
}
</style>
