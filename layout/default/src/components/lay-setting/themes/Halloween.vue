<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="halloween-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="halloween"],
html.theme-halloween {
  .halloween-setting-wrapper {
    .right-panel {
      background:
        linear-gradient(180deg, rgba(36, 14, 58, 0.98) 0%, rgba(20, 6, 34, 0.98) 100%)
        !important;
      border-left: 2px solid rgba(255, 117, 24, 0.35) !important;
      box-shadow: -2px 0 20px rgba(255, 117, 24, 0.2) !important;

      // 添加万圣节装饰背景
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle at 20% 30%, rgba(255, 117, 24, 0.08), transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(155, 89, 182, 0.08), transparent 50%);
        pointer-events: none;
        z-index: 0;
      }

      .project-configuration {
        border-bottom: 1px solid rgba(255, 117, 24, 0.25) !important;
        position: relative;
        z-index: 1;

        h4 {
          color: #ff7518 !important;
          text-shadow: 0 0 8px rgba(255, 117, 24, 0.4);
          font-family: 'Creepster', 'cursive', sans-serif;
        }

        svg {
          color: rgba(255, 117, 24, 0.8) !important;

          &:hover {
            color: #76ff03 !important;
            background: rgba(255, 117, 24, 0.15) !important;
            filter: drop-shadow(0 0 8px rgba(255, 117, 24, 0.6));
          }
        }
      }

      .el-divider__text {
        background-color: transparent !important;
        color: rgba(255, 117, 24, 0.7) !important;
        font-weight: 600;
      }

      .el-switch {
        &.is-checked .el-switch__core {
          background-color: #ff7518 !important;
          border-color: #ff7518 !important;
          box-shadow: 0 0 10px rgba(255, 117, 24, 0.4);
        }
        .el-switch__core {
          background-color: rgba(44, 0, 62, 0.6);
          border-color: rgba(255, 117, 24, 0.4);
        }
      }

      .el-button {
        background: linear-gradient(135deg, rgba(58, 5, 69, 0.92), rgba(31, 0, 36, 0.9)) !important;
        border-color: rgba(255, 117, 24, 0.35) !important;
        color: #ffb36a !important;

        &:hover {
          background: linear-gradient(135deg, rgba(255, 117, 24, 0.25), rgba(60, 0, 74, 0.6)) !important;
          border-color: rgba(255, 117, 24, 0.5) !important;
          color: #fff1df !important;
          box-shadow: 0 0 15px rgba(255, 117, 24, 0.3);
        }

        &.el-button--primary {
          background: linear-gradient(135deg, #ff6b35 0%, #ff8555 100%) !important;
          border-color: #ff6b35 !important;
          color: #2c003e !important;

          &:hover {
            background: linear-gradient(135deg, #ff8555 0%, #ff9f75 100%) !important;
            box-shadow: 0 0 20px rgba(255, 107, 53, 0.5);
          }
        }
      }

      .setting-section {
        background: rgba(44, 0, 62, 0.3) !important;
        border: 1px solid rgba(255, 117, 24, 0.2) !important;
        border-radius: 12px;
        position: relative;
        z-index: 1;

        .section-title {
          color: #ff7518 !important;
          text-shadow: 0 0 5px rgba(255, 117, 24, 0.3);
        }
      }

      .theme-color-item {
        border: 2px solid rgba(255, 117, 24, 0.3) !important;
        box-shadow: 0 0 8px rgba(255, 117, 24, 0.2) !important;

        &:hover {
          border-color: rgba(255, 117, 24, 0.6) !important;
          box-shadow: 0 0 15px rgba(255, 117, 24, 0.4) !important;
          transform: translateY(-2px);
        }

        &.is-selected {
          border-color: #ff7518 !important;
          box-shadow: 0 0 20px rgba(255, 117, 24, 0.6) !important;
        }
      }
    }
  }
}
</style>
