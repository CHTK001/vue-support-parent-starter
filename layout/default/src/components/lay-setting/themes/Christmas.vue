<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="christmas-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="christmas"],
html.theme-christmas {
  .christmas-setting-wrapper {
    .right-panel {
      background:
        linear-gradient(180deg, rgba(17, 70, 28, 0.98) 0%, rgba(10, 45, 18, 0.98) 100%)
        !important;
      border-left: 2px solid rgba(255, 215, 0, 0.3) !important;
      box-shadow: -2px 0 20px rgba(255, 215, 0, 0.15) !important;

      // 添加圣诞装饰背景
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.06), transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(211, 47, 47, 0.06), transparent 50%);
        pointer-events: none;
        z-index: 0;
      }

      .project-configuration {
        border-bottom: 1px solid rgba(255, 215, 0, 0.25) !important;
        position: relative;
        z-index: 1;

        h4 {
          color: #f7de9a !important;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
          font-weight: 700;
        }

        svg {
          color: rgba(255, 215, 0, 0.8) !important;

          &:hover {
            color: #ffd700 !important;
            background: rgba(255, 215, 0, 0.12) !important;
            filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.4));
          }
        }
      }

      .el-divider__text {
        background-color: transparent !important;
        color: rgba(255, 215, 0, 0.75) !important;
        font-weight: 600;
      }

      .el-switch {
        &.is-checked .el-switch__core {
          background-color: #d32f2f !important;
          border-color: #d32f2f !important;
          box-shadow: 0 0 10px rgba(211, 47, 47, 0.4);
        }
        .el-switch__core {
          background-color: rgba(27, 94, 32, 0.6);
          border-color: rgba(255, 215, 0, 0.35);
        }
      }

      .el-button {
        background: linear-gradient(135deg, rgba(27, 94, 32, 0.8), rgba(13, 61, 18, 0.7)) !important;
        border-color: rgba(255, 215, 0, 0.3) !important;
        color: #f7de9a !important;

        &:hover {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(27, 94, 32, 0.9)) !important;
          border-color: rgba(255, 215, 0, 0.5) !important;
          color: #ffffff !important;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.25);
        }

        &.el-button--primary {
          background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%) !important;
          border-color: #d32f2f !important;
          color: #ffffff !important;

          &:hover {
            background: linear-gradient(135deg, #e53935 0%, #d32f2f 100%) !important;
            box-shadow: 0 0 20px rgba(211, 47, 47, 0.5);
          }
        }
      }

      .setting-section {
        background: rgba(27, 94, 32, 0.3) !important;
        border: 1px solid rgba(255, 215, 0, 0.2) !important;
        border-radius: 12px;
        position: relative;
        z-index: 1;

        .section-title {
          color: #f7de9a !important;
          text-shadow: 0 0 6px rgba(255, 215, 0, 0.25);
        }
      }

      .theme-color-item {
        border: 2px solid rgba(255, 215, 0, 0.25) !important;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.15) !important;

        &:hover {
          border-color: rgba(255, 215, 0, 0.5) !important;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3) !important;
          transform: translateY(-2px);
        }

        &.is-selected {
          border-color: #ffd700 !important;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5) !important;
        }
      }
    }
  }
}
</style>
