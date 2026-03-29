<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="future-tech-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="future-tech"],
html.theme-future-tech {
  .future-tech-setting-wrapper {
    .modern-setting-container {
      --setting-shell-bg: linear-gradient(180deg, #050a1f 0%, #08142f 100%);
      --setting-shell-card-bg: linear-gradient(
        180deg,
        rgba(6, 18, 44, 0.92) 0%,
        rgba(4, 12, 32, 0.88) 100%
      );
      --setting-shell-card-border: rgba(0, 255, 255, 0.2);
      --setting-shell-shadow: 0 28px 54px -42px rgba(0, 255, 255, 0.28);
      --setting-shell-hero-bg: linear-gradient(
        135deg,
        rgba(2, 17, 41, 0.94) 0%,
        rgba(0, 255, 255, 0.08) 100%
      );
      --setting-shell-hero-border: rgba(0, 255, 255, 0.18);
      --setting-shell-chip-bg: rgba(0, 18, 44, 0.62);
      --setting-shell-chip-border: rgba(0, 255, 255, 0.18);
      --setting-shell-nav-bg: rgba(1, 14, 36, 0.72);
      --setting-shell-nav-active-bg: linear-gradient(
        135deg,
        rgba(0, 255, 255, 0.18),
        rgba(0, 122, 255, 0.18)
      );
      --setting-shell-nav-active-text: #7df9ff;
      --setting-shell-muted: rgba(180, 240, 255, 0.7);
      --setting-shell-ink: #e6fbff;
      --setting-shell-stage-gap: 12px;
      --setting-shell-card-radius: 24px;
      --setting-shell-card-blur: 14px;
      --setting-shell-divider: rgba(0, 255, 255, 0.28);
      --setting-shell-heading-font:
        "Rajdhani", "Orbitron", "PingFang SC", sans-serif;
    }

    .modern-setting-container::before {
      display: block !important;
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(
          90deg,
          rgba(0, 255, 255, 0.05) 0 1px,
          transparent 1px 24px
        ),
        linear-gradient(
          180deg,
          rgba(0, 255, 255, 0.05) 0 1px,
          transparent 1px 24px
        );
      background-size: 24px 24px;
      opacity: 0.36;
      pointer-events: none;
      z-index: 0;
      mask: linear-gradient(180deg, rgba(0, 0, 0, 0.94), transparent 90%);
    }

    .setting-shell-hero,
    .setting-shell-stage {
      position: relative;
      z-index: 1;
    }

    .setting-shell-hero::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(120deg, rgba(125, 249, 255, 0.12), transparent 42%),
        radial-gradient(
          circle at 82% 18%,
          rgba(0, 255, 255, 0.18),
          transparent 28%
        );
      pointer-events: none;
    }

    .setting-shell-nav__item {
      border-color: rgba(0, 255, 255, 0.18);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }

    .setting-shell-stage__item + .setting-shell-stage__item::before {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(0, 255, 255, 0.4),
        transparent
      );
    }

    .theme-setting-shell--future-tech .setting-section {
      border-radius: 26px 10px 26px 10px !important;
      background-image:
        linear-gradient(
          180deg,
          rgba(6, 18, 44, 0.96) 0%,
          rgba(4, 12, 32, 0.92) 100%
        ),
        linear-gradient(
          90deg,
          rgba(0, 255, 255, 0.05) 0 1px,
          transparent 1px 18px
        ) !important;
      background-size:
        100% 100%,
        18px 18px !important;
    }
  }

  .right-panel {
    background: linear-gradient(180deg, #050a1f 0%, #0a1a3a 100%) !important;
    border-left: 2px solid rgba(0, 255, 255, 0.4) !important;

    h4 {
      color: #00ffff !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
      font-family: "Rajdhani", "Orbitron", "Consolas", sans-serif;
      letter-spacing: 0.08em;
    }

    svg {
      color: rgba(0, 255, 255, 0.7) !important;

      &:hover {
        color: #00ffff !important;
        background: rgba(0, 255, 255, 0.1) !important;
        filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.8));
      }
    }
  }

  .el-divider__text {
    background-color: transparent !important;
    color: rgba(0, 255, 255, 0.6) !important;
  }

  .el-switch__label {
    color: rgba(0, 255, 255, 0.7) !important;

    &.is-active {
      color: #00ffff !important;
    }
  }

  .el-segmented {
    background: rgba(0, 0, 0, 0.3) !important;
    --el-segmented-item-selected-bg-color: rgba(0, 255, 255, 0.2) !important;
    --el-segmented-item-selected-color: #00ffff !important;
    --el-segmented-item-hover-bg-color: rgba(0, 255, 255, 0.1) !important;
    --el-segmented-item-hover-color: #00ffff !important;
    --el-border-radius-base: 8px;
  }

  .el-switch {
    &.is-checked .el-switch__core {
      background-color: #00ffff !important;
      border-color: #00ffff !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    .el-switch__core {
      background-color: rgba(0, 0, 0, 0.4);
      border-color: rgba(0, 255, 255, 0.4);
    }
  }

  .el-radio-button__inner {
    background: transparent !important;
    border-color: rgba(0, 255, 255, 0.4) !important;
    color: rgba(0, 255, 255, 0.7) !important;
  }
  .el-radio-button__original-radio:checked + .el-radio-button__inner {
    background-color: rgba(0, 255, 255, 0.2) !important;
    border-color: #00ffff !important;
    color: #00ffff !important;
    box-shadow: -1px 0 0 0 #00ffff !important;
  }

  .el-slider {
    --el-slider-main-bg-color: #00ffff;
    --el-slider-runway-bg-color: rgba(0, 255, 255, 0.1);
    .el-slider__button {
      border-color: #00ffff;
    }
  }

  .el-input-number {
    .el-input__wrapper {
      background-color: rgba(0, 0, 0, 0.3) !important;
      box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.3) inset !important;
    }
    .el-input__inner {
      color: rgba(0, 255, 255, 0.9) !important;
    }
    .el-input-number__decrease,
    .el-input-number__increase {
      background: transparent !important;
      color: #00ffff !important;
      border-color: rgba(0, 255, 255, 0.4) !important;
      &:hover {
        color: #4dfdfd !important;
      }
    }
  }

  .el-select {
    --el-select-border-color-hover: #00ffff;
    --el-select-input-focus-border-color: #00ffff;
    .el-input__wrapper {
      background-color: rgba(0, 0, 0, 0.3) !important;
      box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.3) inset !important;
      &.is-focus {
        box-shadow: 0 0 0 1px #00ffff inset !important;
      }
    }
    .el-input__inner {
      color: rgba(0, 255, 255, 0.9) !important;
    }
  }

  .el-input {
    .el-input__wrapper {
      background-color: rgba(0, 0, 0, 0.3) !important;
      box-shadow: 0 0 0 1px rgba(0, 255, 255, 0.3) inset !important;
      &.is-focus {
        box-shadow: 0 0 0 1px #00ffff inset !important;
      }
    }
    .el-input__inner {
      color: rgba(0, 255, 255, 0.9) !important;
    }
  }

  .el-button {
    border-color: rgba(0, 255, 255, 0.4) !important;
    color: rgba(0, 255, 255, 0.7) !important;

    &:hover {
      border-color: #00ffff !important;
      background: rgba(0, 255, 255, 0.1) !important;
      color: #00ffff !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    }

    &.el-button--primary {
      background: rgba(0, 255, 255, 0.2) !important;
      border-color: #00ffff !important;
      color: #00ffff !important;

      &:hover {
        background: rgba(0, 255, 255, 0.3) !important;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
      }
    }
  }

  .setting-section {
    border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
    padding-bottom: 20px;
    margin-bottom: 20px;
    background: rgba(0, 0, 0, 0.2) !important;
    border: 1px solid rgba(0, 255, 255, 0.15) !important;
    border-radius: 12px;
    position: relative;
    z-index: 1;

    .section-title {
      color: #00ffff !important;
      text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
    }
  }

  .theme-color-item {
    border: 2px solid rgba(0, 255, 255, 0.3) !important;
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.2) !important;

    &:hover {
      border-color: rgba(0, 255, 255, 0.6) !important;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.4) !important;
      transform: translateY(-2px);
    }

    &.is-selected {
      border-color: #00ffff !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.5) !important;
    }
  }

  .switch-card-item {
    background: rgba(0, 0, 0, 0.3) !important;
    border: 1px solid rgba(0, 255, 255, 0.3) !important;

    &:hover {
      border-color: rgba(0, 255, 255, 0.6) !important;
      background: rgba(0, 255, 255, 0.1) !important;
    }
  }
}
</style>
