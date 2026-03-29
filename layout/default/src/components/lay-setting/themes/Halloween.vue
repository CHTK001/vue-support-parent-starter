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
    .modern-setting-container {
      --setting-shell-bg: linear-gradient(
        180deg,
        rgba(17, 5, 28, 0.98) 0%,
        rgba(10, 0, 18, 0.98) 100%
      );
      --setting-shell-card-bg: linear-gradient(
        180deg,
        rgba(45, 12, 62, 0.86) 0%,
        rgba(24, 6, 36, 0.9) 100%
      );
      --setting-shell-card-border: rgba(255, 117, 24, 0.18);
      --setting-shell-shadow: 0 28px 48px -40px rgba(255, 117, 24, 0.26);
      --setting-shell-hero-bg: linear-gradient(
        135deg,
        rgba(67, 18, 88, 0.94) 0%,
        rgba(255, 117, 24, 0.12) 100%
      );
      --setting-shell-hero-border: rgba(255, 117, 24, 0.24);
      --setting-shell-chip-bg: rgba(35, 8, 52, 0.64);
      --setting-shell-chip-border: rgba(255, 117, 24, 0.16);
      --setting-shell-nav-bg: rgba(20, 6, 34, 0.7);
      --setting-shell-nav-active-bg: linear-gradient(
        135deg,
        rgba(255, 117, 24, 0.18),
        rgba(155, 89, 182, 0.16)
      );
      --setting-shell-nav-active-text: #ffb36a;
      --setting-shell-muted: rgba(255, 214, 176, 0.72);
      --setting-shell-ink: #fff3de;
      --setting-shell-stage-gap: 12px;
      --setting-shell-card-radius: 24px;
      --setting-shell-card-blur: 12px;
      --setting-shell-divider: rgba(255, 117, 24, 0.24);
      --setting-shell-heading-font:
        "Creepster", "PingFang SC", "Microsoft YaHei", sans-serif;
    }

    .modern-setting-container::before {
      display: block !important;
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(
          circle at 82% 14%,
          rgba(255, 193, 7, 0.18),
          transparent 20%
        ),
        linear-gradient(
          135deg,
          rgba(255, 117, 24, 0.06) 0 2px,
          transparent 2px 24px
        );
      background-size:
        auto,
        24px 24px;
      opacity: 0.7;
      pointer-events: none;
      z-index: 0;
      mask: linear-gradient(180deg, rgba(0, 0, 0, 0.92), transparent 88%);
    }

    .setting-shell-hero,
    .setting-shell-stage {
      position: relative;
      z-index: 1;
    }

    .setting-shell-nav__item {
      border-color: rgba(255, 117, 24, 0.16);
      letter-spacing: 0.04em;
    }

    .setting-shell-stage__item + .setting-shell-stage__item::before {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 117, 24, 0.36),
        transparent
      );
    }

    .theme-setting-shell--halloween .setting-section {
      border-radius: 28px 18px 24px 14px !important;
      background-image:
        linear-gradient(
          180deg,
          rgba(45, 12, 62, 0.9) 0%,
          rgba(24, 6, 36, 0.92) 100%
        ),
        linear-gradient(
          135deg,
          rgba(255, 117, 24, 0.05) 0 2px,
          transparent 2px 28px
        ) !important;
      background-size:
        100% 100%,
        28px 28px !important;
    }

    .right-panel {
      background: linear-gradient(
        180deg,
        rgba(36, 14, 58, 0.98) 0%,
        rgba(20, 6, 34, 0.98) 100%
      ) !important;
      border-left: 2px solid rgba(255, 117, 24, 0.35) !important;
      box-shadow: -2px 0 20px rgba(255, 117, 24, 0.2) !important;

      // 添加万圣节装饰背景
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(
            circle at 20% 30%,
            rgba(255, 117, 24, 0.08),
            transparent 50%
          ),
          radial-gradient(
            circle at 80% 70%,
            rgba(155, 89, 182, 0.08),
            transparent 50%
          );
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
          font-family: "Creepster", "cursive", sans-serif;
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
        background: linear-gradient(
          135deg,
          rgba(58, 5, 69, 0.92),
          rgba(31, 0, 36, 0.9)
        ) !important;
        border-color: rgba(255, 117, 24, 0.35) !important;
        color: #ffb36a !important;

        &:hover {
          background: linear-gradient(
            135deg,
            rgba(255, 117, 24, 0.25),
            rgba(60, 0, 74, 0.6)
          ) !important;
          border-color: rgba(255, 117, 24, 0.5) !important;
          color: #fff1df !important;
          box-shadow: 0 0 15px rgba(255, 117, 24, 0.3);
        }

        &.el-button--primary {
          background: linear-gradient(
            135deg,
            #ff6b35 0%,
            #ff8555 100%
          ) !important;
          border-color: #ff6b35 !important;
          color: #2c003e !important;

          &:hover {
            background: linear-gradient(
              135deg,
              #ff8555 0%,
              #ff9f75 100%
            ) !important;
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
