<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="spring-festival-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="spring-festival"],
html.theme-spring-festival {
  .spring-festival-setting-wrapper {
    .right-panel {
      background:
        linear-gradient(180deg, rgba(107, 0, 0, 0.98) 0%, rgba(76, 0, 0, 0.98) 100%)
        !important;
      border-left: 2px solid rgba(255, 215, 0, 0.35) !important;
      box-shadow: -2px 0 20px rgba(255, 215, 0, 0.2) !important;

      // 添加春节装饰背景
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle at 20% 30%, rgba(255, 215, 0, 0.08), transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(200, 16, 46, 0.08), transparent 50%);
        pointer-events: none;
        z-index: 0;
      }

      .project-configuration {
        border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
        position: relative;
        z-index: 1;

        h4 {
          color: #ffd700 !important;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
          font-family: "STZhongsong", "STKaiti", "KaiTi", serif;
          font-weight: 700;
        }

        svg {
          color: rgba(255, 215, 0, 0.85) !important;

          &:hover {
            color: #ffd700 !important;
            background: rgba(255, 215, 0, 0.15) !important;
            filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
          }
        }
      }

      .el-divider__text {
        background-color: transparent !important;
        color: rgba(255, 215, 0, 0.8) !important;
        font-weight: 600;
      }

      .el-switch {
        &.is-checked .el-switch__core {
          background-color: #ffd700 !important;
          border-color: #ffd700 !important;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        }
        .el-switch__core {
          background-color: rgba(139, 0, 0, 0.6);
          border-color: rgba(255, 215, 0, 0.4);
        }
      }

      .el-button {
        background: linear-gradient(135deg, rgba(139, 0, 0, 0.8), rgba(107, 0, 0, 0.7)) !important;
        border-color: rgba(255, 215, 0, 0.35) !important;
        color: #ffd700 !important;

        &:hover {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(139, 0, 0, 0.9)) !important;
          border-color: rgba(255, 215, 0, 0.6) !important;
          color: #ffffff !important;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }

        &.el-button--primary {
          background: linear-gradient(135deg, #c8102e 0%, #d33a4f 100%) !important;
          border-color: #c8102e !important;
          color: #ffd700 !important;

          &:hover {
            background: linear-gradient(135deg, #d33a4f 0%, #de6470 100%) !important;
            box-shadow: 0 0 20px rgba(200, 16, 46, 0.5);
          }
        }
      }

      .setting-section {
        background: rgba(139, 0, 0, 0.3) !important;
        border: 1px solid rgba(255, 215, 0, 0.25) !important;
        border-radius: 12px;
        position: relative;
        z-index: 1;

        .section-title {
          color: #ffd700 !important;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
        }
      }

      .theme-color-item {
        border: 2px solid rgba(255, 215, 0, 0.3) !important;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.2) !important;

        &:hover {
          border-color: rgba(255, 215, 0, 0.6) !important;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.4) !important;
          transform: translateY(-2px);
        }

        &.is-selected {
          border-color: #ffd700 !important;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.6) !important;
        }
      }
    }
  }
}
</style>
