<script setup lang="ts">
import BaseTool from './BaseTool.vue';
</script>

<template>
  <div class="new-year-tool-wrapper">
    <BaseTool theme-class="new-year-tool" />
  </div>
</template>

<style lang="scss" scoped>
// 元旦主题颜色变量
$ice-lightest: #F5FBFF;
$ice-primary: #4EA8DE;
$ice-deep: #2A7AB8;
$frost-purple: #E0E7F5;
$ice-white: #ffffff;

.new-year-tool-wrapper {
  :deep(.new-year-tool) {
    // 工具按钮 - 冰雪风格
    .tool-item {
      color: $ice-deep !important;
      background: linear-gradient(135deg, rgba($ice-white, 0.9), rgba($ice-lightest, 0.85)) !important;
      border: 2px solid rgba($ice-primary, 0.4) !important;
      box-shadow: 
        0 2px 8px rgba($ice-primary, 0.2),
        inset 0 1px 2px rgba($ice-white, 0.6) !important;

      svg {
        color: $ice-deep !important;
        filter: drop-shadow(0 1px 2px rgba($ice-primary, 0.3)) !important;
      }

      &:hover {
        background: linear-gradient(135deg, $ice-primary, $ice-deep) !important;
        color: $ice-white !important;
        border-color: rgba($ice-primary, 0.6) !important;
        transform: translateY(-2px) !important;
        box-shadow: 
          0 4px 16px rgba($ice-primary, 0.35),
          inset 0 1px 2px rgba($ice-white, 0.3) !important;

        svg {
          color: $ice-white !important;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) !important;
        }
      }

      &:active {
        transform: translateY(0) !important;
      }
    }

    // 设置按钮
    .setting-btn {
      color: $ice-deep !important;
      background: linear-gradient(135deg, rgba($ice-white, 0.9), rgba($ice-lightest, 0.85)) !important;
      border: 2px solid rgba($ice-primary, 0.4) !important;

      &:hover {
        background: linear-gradient(135deg, $ice-primary, $ice-deep) !important;
        color: $ice-white !important;
        border-color: rgba($ice-primary, 0.6) !important;
      }
    }

    // 语言选择触发器
    .lang-style {
      .lang-icon-wrapper {
        background: linear-gradient(135deg, $ice-primary, $ice-deep) !important;
        box-shadow: 0 2px 8px rgba($ice-primary, 0.35), 0 0 0 2px rgba($ice-primary, 0.15) !important;

        .lang-main-icon {
          color: $ice-white !important;
        }
      }
    }

    // 用户触发器
    .user-trigger {
      background: linear-gradient(135deg, rgba($ice-white, 0.95), rgba($frost-purple, 0.9)) !important;
      border: 2px solid rgba($ice-primary, 0.3) !important;
      box-shadow: 0 2px 8px rgba($ice-primary, 0.15) !important;

      &:hover {
        background: linear-gradient(135deg, rgba($ice-lightest, 0.98), rgba($ice-white, 0.95)) !important;
        border-color: rgba($ice-primary, 0.5) !important;
        box-shadow: 0 4px 16px rgba($ice-primary, 0.25) !important;
      }

      .avatar-img {
        border-color: rgba($ice-primary, 0.5) !important;
        box-shadow: 0 2px 8px rgba($ice-primary, 0.2), 0 0 0 2px rgba($ice-primary, 0.1) !important;
      }

      .user-name {
        color: $ice-deep !important;
      }

      .user-role {
        color: rgba($ice-deep, 0.7) !important;
      }

      .status-dot {
        background: linear-gradient(135deg, #22c55e, #16a34a) !important;
        border-color: rgba($ice-white, 0.9) !important;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2) !important;
      }

      .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba($ice-primary, 0.1), rgba($frost-purple, 0.2)) !important;

        .dropdown-arrow {
          color: $ice-deep !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: linear-gradient(135deg, rgba($ice-primary, 0.2), rgba($ice-deep, 0.15)) !important;

        .dropdown-arrow {
          color: $ice-primary !important;
        }
      }
    }
  }
}
</style>
