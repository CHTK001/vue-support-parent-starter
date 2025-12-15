<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="cyberpunk-tool-wrapper">
    <BaseTool theme-class="cyberpunk-tool" />
  </div>
</template>

<style lang="scss" scoped>
$cyan: #00ffff;
$magenta: #ff00ff;
$glassBg: rgba(10, 14, 25, 0.7);
$glassBorder: rgba(0, 255, 255, 0.25);
$glassBorderHover: rgba(0, 255, 255, 0.45);
$shadowCyan: 0 8px 24px rgba(0, 255, 255, 0.18);

.cyberpunk-tool-wrapper {
  :deep(.cyberpunk-tool) {
    // 工具按钮 - 霓虹风格
    .tool-item {
      background: rgba(0, 0, 0, 0.55) !important;
      border: 1px solid $glassBorder !important;
      color: $cyan !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 10px rgba(0, 255, 255, 0.18) !important;
      transition: all 0.25s ease !important;

      svg {
        color: $cyan !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.4)) !important;
      }

      &:hover {
        background: rgba(0, 0, 0, 0.7) !important;
        border-color: $glassBorderHover !important;
        color: $cyan !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), 0 0 18px rgba(0, 255, 255, 0.28) !important;
        transform: translateY(-2px) !important;

        svg {
          color: $cyan !important;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.6) !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6)) !important;
        }
      }

      &:active {
        transform: translateY(0) !important;
      }
    }

    // 设置按钮 - 赛博风格图标
    .setting-btn {
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.08), rgba(255, 0, 255, 0.08)) !important;
      border: 1px solid $glassBorder !important;
      color: $cyan !important;

      &:hover {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.16), rgba(255, 0, 255, 0.16)) !important;
        border-color: $glassBorderHover !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3), 0 0 30px rgba(255, 0, 255, 0.2) !important;

        :deep(svg) {
          color: $cyan !important;
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.8)) !important;
        }
      }
    }

    // 语言选择触发器
    .lang-style {
      .lang-icon-wrapper {
        background: radial-gradient(circle at 30% 30%, rgba(0, 255, 255, 0.9), rgba(255, 0, 255, 0.7) 60%, rgba(0, 0, 0, 0.9)) !important;
        box-shadow: 0 4px 16px rgba(0, 255, 255, 0.35), 0 0 12px rgba(255, 0, 255, 0.25) !important;

        .lang-main-icon {
          color: #fff !important;
          filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6)) !important;
        }
      }
    }

    // 用户触发器
    .user-trigger {
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.65), rgba(10, 14, 25, 0.7)) !important;
      border: 1px solid $glassBorder !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 255, 0.15) !important;
      transition: all 0.25s ease !important;

      &:hover {
        border-color: $glassBorderHover !important;
        box-shadow: $shadowCyan !important;
      }

      .avatar-img {
        border-color: rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35), 0 0 12px rgba(0, 255, 255, 0.25) !important;
      }

      .user-name {
        color: #fff !important;
        text-shadow: 0 0 8px rgba(0, 255, 255, 0.3) !important;
      }

      .user-role {
        color: rgba(0, 255, 255, 0.8) !important;
      }

      .status-dot {
        background: linear-gradient(135deg, #00ffa3, #00d084) !important;
        border-color: rgba(0, 0, 0, 0.8) !important;
        box-shadow: 0 0 0 2px rgba(0, 255, 163, 0.2), 0 0 10px rgba(0, 255, 163, 0.5) !important;
      }

      .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1)) !important;
        border: 1px solid rgba(0, 255, 255, 0.2) !important;

        .dropdown-arrow {
          color: $cyan !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2)) !important;
        border-color: rgba(0, 255, 255, 0.4) !important;
        box-shadow: 0 0 10px rgba(0, 255, 255, 0.3) !important;

        .dropdown-arrow {
          color: #fff !important;
        }
      }
    }

    .user-dropdown:focus-within .dropdown-arrow-wrapper {
      background: linear-gradient(135deg, $cyan, $magenta) !important;
      border-color: transparent !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3) !important;

      .dropdown-arrow {
        color: #0a0d14 !important;
      }
    }
  }
}
</style>
