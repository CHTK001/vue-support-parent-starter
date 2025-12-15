<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="mid-autumn-tool-wrapper">
    <BaseTool theme-class="mid-autumn-tool" />
  </div>
</template>

<style lang="scss" scoped>
// 中秋主题颜色变量
$mid-blue: #1a237e;
$mid-blue-light: #283593;
$mid-gold: #ffd54f;
$mid-gold-light: #ffecb3;
$mid-cyan: #00bcd4;

.mid-autumn-tool-wrapper {
  :deep(.mid-autumn-tool) {
    // 工具按钮 - 深蓝背景金色图标
    .tool-item {
      color: $mid-gold !important;
      background: linear-gradient(135deg, rgba($mid-blue, 0.9), rgba($mid-blue-light, 0.85)) !important;
      border: 2px solid rgba($mid-gold, 0.5) !important;
      box-shadow: 
        0 2px 8px rgba($mid-blue, 0.4),
        inset 0 1px 2px rgba($mid-gold, 0.2) !important;

      svg {
        color: $mid-gold !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
      }

      &:hover {
        background: radial-gradient(circle, rgba($mid-blue-light, 0.95), rgba($mid-blue, 0.9)) !important;
        color: #FFF !important;
        border-color: rgba($mid-gold, 0.8) !important;
        transform: translateY(-2px) !important;
        box-shadow: 
          0 4px 16px rgba($mid-gold, 0.4),
          inset 0 1px 2px rgba(255, 255, 255, 0.2) !important;

        svg {
          color: #FFF !important;
          filter: drop-shadow(0 2px 4px rgba($mid-gold, 0.6)) !important;
        }
      }

      &:active {
        transform: translateY(0) !important;
      }
    }

    // 月亮设置按钮特殊样式
    .fu-setting {
      color: $mid-gold !important;
      background: linear-gradient(135deg, rgba($mid-blue, 0.9), rgba($mid-blue-light, 0.85)) !important;
      border: 2px solid rgba($mid-gold, 0.5) !important;
      text-shadow: 
        0 0 8px rgba($mid-gold, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.5) !important;
      box-shadow: 
        0 2px 8px rgba($mid-blue, 0.4),
        inset 0 1px 2px rgba($mid-gold, 0.2) !important;

      &:hover {
        background: radial-gradient(circle, rgba($mid-blue-light, 0.95), rgba($mid-blue, 0.9)) !important;
        color: #FFF !important;
        border-color: rgba($mid-gold, 0.8) !important;
        box-shadow: 
          0 4px 16px rgba($mid-gold, 0.4),
          inset 0 1px 2px rgba(255, 255, 255, 0.2) !important;
      }
    }

    // 语言选择触发器
    .lang-style {
      .lang-icon-wrapper {
        background: linear-gradient(135deg, $mid-blue, $mid-blue-light) !important;
        box-shadow: 0 2px 8px rgba($mid-blue, 0.4), 0 0 0 2px rgba($mid-gold, 0.2) !important;

        .lang-main-icon {
          color: $mid-gold !important;
        }
      }
    }

    // 用户触发器
    .user-trigger {
      background: linear-gradient(135deg, rgba($mid-blue, 0.85), rgba($mid-blue-light, 0.8)) !important;
      border: 2px solid rgba($mid-gold, 0.4) !important;
      box-shadow: 0 2px 8px rgba($mid-blue, 0.3) !important;

      &:hover {
        background: linear-gradient(135deg, rgba($mid-blue-light, 0.9), rgba($mid-blue, 0.85)) !important;
        border-color: rgba($mid-gold, 0.6) !important;
        box-shadow: 0 4px 16px rgba($mid-gold, 0.3) !important;
      }

      .avatar-img {
        border-color: rgba($mid-gold, 0.6) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba($mid-gold, 0.15) !important;
      }

      .user-name {
        color: $mid-gold !important;
      }

      .user-role {
        color: rgba($mid-gold-light, 0.8) !important;
      }

      .status-dot {
        background: linear-gradient(135deg, $mid-gold, $mid-gold-light) !important;
        border-color: rgba($mid-blue, 0.9) !important;
        box-shadow: 0 0 0 2px rgba($mid-gold, 0.2) !important;
      }

      .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba($mid-gold, 0.15), rgba($mid-blue-light, 0.2)) !important;

        .dropdown-arrow {
          color: $mid-gold !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba($mid-gold, 0.25), rgba($mid-blue-light, 0.3)) !important;

        .dropdown-arrow {
          color: #FFF !important;
        }
      }
    }
  }
}
</style>
