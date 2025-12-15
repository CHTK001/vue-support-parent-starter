<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="christmas-tool-wrapper">
    <BaseTool theme-class="christmas-tool" />
  </div>
</template>

<style lang="scss" scoped>
$xmas-green: #1b5e20;
$xmas-green-light: #2e7d32;
$xmas-red: #c62828;
$xmas-red-light: #e53935;
$xmas-gold: #ffd700;
$xmas-white: #ffffff;

.christmas-tool-wrapper {
  :deep(.christmas-tool) {
    // 工具按钮
    .tool-item {
      color: $xmas-gold !important;
      background: linear-gradient(135deg, $xmas-green, $xmas-green-light) !important;
      border: 2px solid rgba($xmas-gold, 0.5) !important;
      box-shadow: 
        0 2px 8px rgba(0, 0, 0, 0.3),
        inset 0 1px 2px rgba($xmas-white, 0.1) !important;

      svg {
        color: $xmas-gold !important;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important;
      }

      &:hover {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        color: $xmas-white !important;
        border-color: $xmas-gold !important;
        transform: translateY(-2px) !important;
        box-shadow: 
          0 4px 16px rgba($xmas-red, 0.4),
          inset 0 1px 2px rgba($xmas-white, 0.2) !important;

        svg {
          color: $xmas-white !important;
        }
      }
    }

    // 圣诞树设置按钮
    .fu-setting {
      color: $xmas-gold !important;
      background: linear-gradient(135deg, $xmas-green, $xmas-green-light) !important;
      border: 2px solid rgba($xmas-gold, 0.5) !important;
      text-shadow: 0 0 8px rgba($xmas-gold, 0.6) !important;

      &:hover {
        background: linear-gradient(135deg, $xmas-red, $xmas-red-light) !important;
        color: $xmas-white !important;
        border-color: $xmas-gold !important;
      }
    }

    // 语言选择器
    .lang-style {
      .lang-icon-wrapper {
        background: linear-gradient(135deg, $xmas-green, $xmas-green-light) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba($xmas-gold, 0.2) !important;

        .lang-main-icon {
          color: $xmas-gold !important;
        }
      }
    }

    // 用户触发器
    .user-trigger {
      background: linear-gradient(135deg, rgba($xmas-green, 0.9), rgba($xmas-green-light, 0.85)) !important;
      border: 2px solid rgba($xmas-gold, 0.4) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;

      &:hover {
        background: linear-gradient(135deg, rgba($xmas-red, 0.9), rgba($xmas-red-light, 0.85)) !important;
        border-color: rgba($xmas-gold, 0.6) !important;
        box-shadow: 0 4px 16px rgba($xmas-red, 0.3) !important;
      }

      .avatar-img {
        border-color: rgba($xmas-gold, 0.6) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
      }

      .user-name {
        color: $xmas-white !important;
      }

      .user-role {
        color: rgba($xmas-white, 0.7) !important;
      }

      .status-dot {
        background: linear-gradient(135deg, $xmas-gold, #ffeb3b) !important;
        border-color: rgba($xmas-green, 0.9) !important;
      }

      .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba($xmas-gold, 0.15), rgba($xmas-green-light, 0.2)) !important;

        .dropdown-arrow {
          color: $xmas-gold !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba($xmas-gold, 0.25), rgba($xmas-red, 0.2)) !important;

        .dropdown-arrow {
          color: $xmas-white !important;
        }
      }
    }
  }
}
</style>
