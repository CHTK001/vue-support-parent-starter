<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="spring-festival-tool-wrapper">
    <BaseTool theme-class="spring-festival-tool" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-tool-wrapper {
  :deep(.spring-festival-tool) {
    // 工具按钮 - 红色背景金色图标
    .tool-item {
      color: #FFD700 !important;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(178, 34, 34, 0.85)) !important;
      border: 2px solid rgba(255, 215, 0, 0.6) !important;
      box-shadow: 
        0 2px 8px rgba(220, 20, 60, 0.4),
        inset 0 1px 2px rgba(255, 215, 0, 0.3) !important;

      svg {
        color: #FFD700 !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
      }

      &:hover {
        background: radial-gradient(circle, rgba(220, 20, 60, 0.95), rgba(139, 0, 0, 0.9)) !important;
        color: #FFF !important;
        border-color: rgba(255, 215, 0, 0.9) !important;
        transform: translateY(-2px) !important;
        box-shadow: 
          0 4px 16px rgba(255, 215, 0, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;

        svg {
          color: #FFF !important;
          filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.6)) !important;
        }
      }

      &:active {
        transform: translateY(0) !important;
      }
    }

    // 福字设置按钮特殊样式
    .fu-setting {
      color: #FFD700 !important;
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.9), rgba(178, 34, 34, 0.85)) !important;
      border: 2px solid rgba(255, 215, 0, 0.6) !important;
      text-shadow: 
        0 0 8px rgba(255, 215, 0, 0.8),
        0 2px 4px rgba(0, 0, 0, 0.5) !important;
      box-shadow: 
        0 2px 8px rgba(220, 20, 60, 0.4),
        inset 0 1px 2px rgba(255, 215, 0, 0.3) !important;

      &:hover {
        background: radial-gradient(circle, rgba(220, 20, 60, 0.95), rgba(139, 0, 0, 0.9)) !important;
        color: #FFF !important;
        border-color: rgba(255, 215, 0, 0.9) !important;
        box-shadow: 
          0 4px 16px rgba(255, 215, 0, 0.5),
          inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;
      }
    }

    // 语言选择触发器
    .lang-style {
      .lang-icon-wrapper {
        background: linear-gradient(135deg, #DC143C, #B22222) !important;
        box-shadow: 0 2px 8px rgba(220, 20, 60, 0.4), 0 0 0 2px rgba(255, 215, 0, 0.3) !important;

        .lang-main-icon {
          color: #FFD700 !important;
        }
      }
    }

    // 用户触发器
    .user-trigger {
      background: linear-gradient(135deg, rgba(139, 0, 0, 0.85), rgba(178, 34, 34, 0.8)) !important;
      border: 2px solid rgba(255, 215, 0, 0.5) !important;
      box-shadow: 0 2px 8px rgba(220, 20, 60, 0.3) !important;

      &:hover {
        background: linear-gradient(135deg, rgba(220, 20, 60, 0.9), rgba(178, 34, 34, 0.85)) !important;
        border-color: rgba(255, 215, 0, 0.7) !important;
        box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4) !important;
      }

      .avatar-img {
        border-color: rgba(255, 215, 0, 0.7) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 215, 0, 0.2) !important;
      }

      .user-name {
        color: #FFD700 !important;
      }

      .user-role {
        color: rgba(255, 215, 0, 0.8) !important;
      }

      .status-dot {
        background: linear-gradient(135deg, #FFD700, #FFA500) !important;
        border-color: rgba(139, 0, 0, 0.9) !important;
        box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3) !important;
      }

      .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(220, 20, 60, 0.2)) !important;

        .dropdown-arrow {
          color: #FFD700 !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(220, 20, 60, 0.3)) !important;

        .dropdown-arrow {
          color: #FFF !important;
        }
      }
    }
  }
}
</style>
