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
<<<<<<< HEAD
      color: $ft-gold !important;
      background:
        linear-gradient(135deg, rgba(15, 36, 24, 0.96), rgba(8, 24, 16, 0.92)) !important;
      border: 1px solid $ft-green-line !important;
      box-shadow:
        0 10px 24px -20px rgba(0, 0, 0, 0.65),
        inset 0 0 0 1px rgba(243, 210, 122, 0.06) !important;
      font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;

      &::before {
        opacity: 0;
      }
=======
      color: $ft-cyan !important;
      background: rgba(5, 10, 31, 0.8) !important;
      border: 2px solid rgba(0, 255, 255, 0.4) !important;
      box-shadow:
        0 2px 8px rgba(0, 255, 255, 0.2),
        inset 0 1px 2px rgba(0, 255, 255, 0.1) !important;
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126

      svg {
        color: $ft-gold !important;
      }

      &:hover {
<<<<<<< HEAD
        background:
          linear-gradient(135deg, rgba(19, 50, 33, 0.98), rgba(11, 30, 20, 0.96)) !important;
        color: $ft-gold-bright !important;
        border-color: rgba(243, 210, 122, 0.24) !important;
        transform: translateY(-1px) !important;
        box-shadow:
          0 14px 32px -24px rgba(0, 0, 0, 0.72),
          inset 0 0 0 1px rgba(243, 210, 122, 0.08) !important;
=======
        background: rgba(0, 255, 255, 0.2) !important;
        color: $ft-cyan-light !important;
        border-color: $ft-cyan !important;
        transform: translateY(-2px) !important;
        box-shadow:
          0 4px 16px rgba(0, 255, 255, 0.4),
          inset 0 1px 2px rgba(0, 255, 255, 0.2) !important;
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126

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
<<<<<<< HEAD
        background: rgba(15, 36, 24, 0.9) !important;
        box-shadow: 0 8px 18px -16px rgba(0, 0, 0, 0.62), 0 0 0 1px rgba(102, 171, 119, 0.28) !important;
=======
        background: rgba(5, 10, 31, 0.8) !important;
        box-shadow:
          0 2px 8px rgba(0, 255, 255, 0.2),
          0 0 0 2px rgba(0, 255, 255, 0.2) !important;
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126

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
<<<<<<< HEAD
        background: linear-gradient(135deg, #5f9b67, #8ebf79) !important;
        border-color: rgba(243, 210, 122, 0.78) !important;
=======
        background: linear-gradient(
          135deg,
          $ft-cyan,
          $ft-cyan-light
        ) !important;
        border-color: rgba(0, 255, 255, 0.9) !important;
>>>>>>> 0b6528f1dfbf32db414a1a5d12846317583de126
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
