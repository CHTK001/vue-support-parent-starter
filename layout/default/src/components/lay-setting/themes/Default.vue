<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="default-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="default"],
html.theme-default {
  .default-setting-wrapper {
    .modern-setting-container {
      --setting-shell-bg: linear-gradient(
        180deg,
        rgba(248, 250, 252, 0.96) 0%,
        rgba(241, 245, 249, 0.94) 100%
      );
      --setting-shell-card-bg: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.9) 0%,
        rgba(255, 255, 255, 0.78) 100%
      );
      --setting-shell-card-border: rgba(148, 163, 184, 0.16);
      --setting-shell-shadow: 0 26px 50px -38px rgba(15, 23, 42, 0.22);
      --setting-shell-hero-bg: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.92) 0%,
        rgba(236, 245, 255, 0.94) 42%,
        rgba(241, 245, 249, 0.96) 100%
      );
      --setting-shell-hero-border: rgba(59, 130, 246, 0.14);
      --setting-shell-chip-bg: rgba(255, 255, 255, 0.76);
      --setting-shell-chip-border: rgba(148, 163, 184, 0.16);
      --setting-shell-nav-bg: rgba(255, 255, 255, 0.56);
      --setting-shell-nav-active-bg: linear-gradient(
        135deg,
        rgba(59, 130, 246, 0.14),
        rgba(14, 165, 233, 0.16)
      );
      --setting-shell-nav-active-text: #2563eb;
      --setting-shell-stage-gap: 10px;
      --setting-shell-card-radius: 22px;
      --setting-shell-card-blur: 20px;
      --setting-shell-divider: rgba(191, 219, 254, 0.72);
      --setting-shell-heading-font:
        "Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
    }

    .modern-setting-container::before {
      display: block !important;
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(120deg, rgba(255, 255, 255, 0.44), transparent 38%),
        radial-gradient(
          circle at 82% 14%,
          rgba(59, 130, 246, 0.18),
          transparent 30%
        );
      pointer-events: none;
      z-index: 0;
    }

    .modern-setting-container::after {
      display: block !important;
      content: "";
      position: absolute;
      inset: 20px 16px auto;
      height: 220px;
      border-radius: 30px;
      background-image:
        linear-gradient(
          90deg,
          rgba(148, 163, 184, 0.08) 0 1px,
          transparent 1px 24px
        ),
        linear-gradient(
          180deg,
          rgba(59, 130, 246, 0.06) 0 1px,
          transparent 1px 24px
        );
      background-size: 24px 24px;
      opacity: 0.72;
      pointer-events: none;
      z-index: 0;
      mask: linear-gradient(180deg, rgba(0, 0, 0, 0.92), transparent 88%);
    }

    .setting-shell-hero::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(120deg, rgba(255, 255, 255, 0.52), transparent 40%),
        radial-gradient(
          circle at 85% 20%,
          rgba(59, 130, 246, 0.16),
          transparent 30%
        );
      pointer-events: none;
    }

    .setting-shell-hero,
    .setting-shell-stage {
      position: relative;
      z-index: 1;
    }

    .setting-shell-hero__eyebrow {
      background: linear-gradient(
        135deg,
        rgba(37, 99, 235, 0.1),
        rgba(14, 165, 233, 0.14)
      );
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .setting-shell-chip,
    .setting-shell-hero__status {
      backdrop-filter: blur(12px);
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.8),
        rgba(255, 255, 255, 0.72)
      );
      box-shadow:
        0 18px 28px -28px rgba(15, 23, 42, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .setting-shell-nav__item {
      backdrop-filter: blur(8px);
      border-color: rgba(255, 255, 255, 0.54);
      box-shadow: 0 12px 20px -18px rgba(15, 23, 42, 0.18);
    }

    .setting-shell-nav__item.is-active {
      color: #1d4ed8;
      transform: translateY(-1px);
      box-shadow:
        0 18px 24px -22px rgba(37, 99, 235, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.78);
    }

    .setting-shell-stage__item + .setting-shell-stage__item::before {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(96, 165, 250, 0.34),
        transparent
      );
    }

    .theme-setting-shell--default .setting-section {
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.88) 0%,
        rgba(255, 255, 255, 0.76) 100%
      ) !important;
      box-shadow:
        0 16px 24px -22px rgba(15, 23, 42, 0.18),
        0 1px 0 rgba(191, 219, 254, 0.24),
        inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
    }

    .theme-setting-shell--default .setting-section:hover {
      border-color: rgba(96, 165, 250, 0.26) !important;
      box-shadow:
        0 18px 26px -22px rgba(37, 99, 235, 0.16),
        0 1px 0 rgba(191, 219, 254, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.94) !important;
    }
  }
}
</style>
