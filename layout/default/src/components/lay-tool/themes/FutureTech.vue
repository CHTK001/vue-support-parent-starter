<script setup lang="ts">
import BaseTool from "./BaseTool.vue";
</script>

<template>
  <div class="future-tech-tool-wrapper">
    <BaseTool theme-class="future-tech-tool" />
  </div>
</template>

<style lang="scss" scoped>
$ft-gold: #f3d27a;
$ft-gold-bright: #ffe8a3;
$ft-green-deep: #081810;
$ft-green-panel: #0f2418;
$ft-green-panel-hover: #133221;
$ft-green-line: rgba(102, 171, 119, 0.42);

.future-tech-tool-wrapper {
  :deep(.future-tech-tool) {
    .tool-item {

      svg {
        color: $ft-gold !important;
      }

      &:hover {

        svg {
          color: $ft-gold-bright !important;
        }
      }
    }

    .setting-btn {
      font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: $ft-gold !important;
      background: linear-gradient(
        135deg,
        rgba(15, 36, 24, 0.98),
        rgba(8, 24, 16, 0.95)
      ) !important;
      border-color: $ft-green-line !important;
      box-shadow:
        0 12px 26px -22px rgba(0, 0, 0, 0.7),
        inset 0 0 0 1px rgba(243, 210, 122, 0.08) !important;

      svg {
        color: $ft-gold !important;
      }

      &:hover {
        background: linear-gradient(
          135deg,
          rgba(19, 50, 33, 0.98),
          rgba(11, 30, 20, 0.96)
        ) !important;
        border-color: rgba(243, 210, 122, 0.26) !important;
      }
    }

    :deep(.setting-symbol),
    :deep(.sc-text) {
      color: $ft-gold !important;
    }

    .header-clock {
      min-width: 172px;
      font-family: "Rajdhani", "Consolas", "SFMono-Regular", monospace;
      letter-spacing: 0.08em;
      background:
        linear-gradient(135deg, rgba(15, 36, 24, 0.96), rgba(8, 24, 16, 0.92)) !important;
      border-color: $ft-green-line !important;
      box-shadow:
        0 12px 28px -24px rgba(0, 0, 0, 0.74),
        inset 0 0 0 1px rgba(243, 210, 122, 0.06) !important;
    }

    .header-clock-time,
    .header-clock-weekday {
      color: $ft-gold !important;
      text-shadow: none !important;
    }

    .header-clock-weekday {
      color: rgba(243, 210, 122, 0.82) !important;
      letter-spacing: 0.08em;
    }

    .lang-style {
      .lang-icon-wrapper {

        .lang-main-icon {
          color: $ft-gold !important;
        }
      }
    }

    .user-trigger {
      background: rgba(15, 36, 24, 0.94) !important;
      border: 1px solid $ft-green-line !important;
      box-shadow: 0 12px 28px -24px rgba(0, 0, 0, 0.68) !important;

      &:hover {
        background: rgba(19, 50, 33, 0.96) !important;
        border-color: rgba(243, 210, 122, 0.22) !important;
        box-shadow: 0 16px 36px -28px rgba(0, 0, 0, 0.75) !important;
      }

      .avatar-img {
        border-color: rgba(243, 210, 122, 0.4) !important;
        box-shadow: 0 8px 18px -14px rgba(0, 0, 0, 0.66) !important;
      }

      .user-name {
        color: $ft-gold !important;
      }

      .user-role {
        color: rgba(243, 210, 122, 0.68) !important;
      }

      .status-dot {
      }

      .dropdown-arrow-wrapper {
        background: rgba(243, 210, 122, 0.08) !important;

        .dropdown-arrow {
          color: $ft-gold !important;
        }
      }

      &:hover .dropdown-arrow-wrapper {
        background: rgba(243, 210, 122, 0.14) !important;

        .dropdown-arrow {
          color: $ft-gold-bright !important;
        }
      }
    }
  }
}
</style>
