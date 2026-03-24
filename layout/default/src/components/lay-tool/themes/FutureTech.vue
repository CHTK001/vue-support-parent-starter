<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="future-tech-tool-wrapper">
    <BaseTool theme-class="future-tech-tool" />
  </div>
</template>

<style lang="scss" scoped>
$ft-cyan: #00ffff;
$ft-cyan-light: #4dfdfd;
$ft-bg-dark: #050a1f;
$ft-bg-darker: #0a1a3a;
$ft-border: rgba(0, 255, 255, 0.4);

.future-tech-tool-wrapper {
  :deep(.future-tech-tool) {
    .tool-item {
      color: $ft-cyan !important;
      background: rgba(5, 10, 31, 0.8) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      box-shadow: 
        0 2px 8px rgba(0, 255, 255, 0.2),
        inset 0 1px 2px rgba(0, 255, 255, 0.1) !important;

      svg {
        color: $ft-cyan !important;
        filter: drop-shadow(0 0 4px rgba(0, 255, 255, 0.6)) !important;
      }

      &:hover {
        background: rgba(0, 255, 255, 0.2) !important;
        color: $ft-cyan-light !important;
        border-color: $ft-cyan !important;
        transform: translateY(-2px) !important;
        box-shadow: 
          0 4px 16px rgba(0, 255, 255, 0.4),
          inset 0 1px 2px rgba(0, 255, 255, 0.2) !important;

        svg {
          color: $ft-cyan-light !important;
          filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.9)) !important;
        }
      }
    }

    .fu-setting {
      color: $ft-cyan !important;
      background: rgba(5, 10, 31, 0.8) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.6) !important;

      &:hover {
        background: rgba(0, 255, 255, 0.2) !important;
        color: $ft-cyan-light !important;
        border-color: $ft-cyan !important;
      }
    }

    .lang-style {
      .lang-icon-wrapper {
        background: rgba(5, 10, 31, 0.8) !important;
        box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2), 0 0 0 2px rgba(0, 255, 255, 0.2) !important;

        .lang-main-icon {
          color: $ft-cyan !important;
        }
      }
    }

    .user-trigger {
      background: rgba(5, 10, 31, 0.9) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2) !important;

      &:hover {
        background: rgba(0, 255, 255, 0.15) !important;
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 4px 16px rgba(0, 255, 255, 0.3) !important;
      }

      .avatar-img {
        border-color: rgba(0, 255, 255, 0.6) !important;
        box-shadow: 0 2px 8px rgba(0, 255, 255, 0.3) !important;
      }

      .user-name {
        color: rgba(0, 255, 255, 0.9) !important;
      }

      .user-role {
        color: rgba(0, 255, 255, 0.6) !important;
      }

      .status-dot {
        background: linear-gradient(135deg, $ft-cyan, $ft-cyan-light) !important;
        border-color: rgba(0, 255, 255, 0.9) !important;
      }

      .dropdown-arrow-wrapper {
        background: rgba(0, 255, 255, 0.1) !important;

        .dropdown-arrow {
          color: $ft-cyan !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: rgba(0, 255, 255, 0.2) !important;

        .dropdown-arrow {
          color: $ft-cyan-light !important;
        }
      }
    }
  }
}
</style>

