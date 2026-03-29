<script setup lang="ts">
import BaseSetting from "./BaseSetting.vue";
</script>

<template>
  <div class="eight-bit-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="8bit"],
html.theme-8bit {
  .eight-bit-setting-wrapper {
    .modern-setting-container {
      --setting-shell-bg: linear-gradient(180deg, #111827 0%, #0f172a 100%);
      --setting-shell-card-bg: #f8fafc;
      --setting-shell-card-border: rgba(15, 23, 42, 0.72);
      --setting-shell-shadow: 6px 6px 0 0 rgba(15, 23, 42, 0.72);
      --setting-shell-hero-bg: linear-gradient(
        135deg,
        #faf089 0%,
        #f472b6 100%
      );
      --setting-shell-hero-border: rgba(15, 23, 42, 0.9);
      --setting-shell-chip-bg: rgba(255, 255, 255, 0.9);
      --setting-shell-chip-border: rgba(15, 23, 42, 0.78);
      --setting-shell-nav-bg: rgba(255, 255, 255, 0.92);
      --setting-shell-nav-active-bg: linear-gradient(135deg, #32cd32, #00bcd4);
      --setting-shell-nav-active-text: #101010;
      --setting-shell-muted: rgba(15, 23, 42, 0.72);
      --setting-shell-ink: #101010;
      --setting-shell-stage-gap: 12px;
      --setting-shell-card-radius: 0px;
      --setting-shell-card-blur: 0px;
      --setting-shell-divider: rgba(255, 255, 255, 0.36);
      --setting-shell-heading-font:
        "Fusion Pixel Zh_hans", "Courier New", monospace;
    }

    .modern-setting-container::before {
      display: block !important;
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.06) 0 2px,
          transparent 2px 20px
        ),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.05) 0 2px,
          transparent 2px 20px
        );
      background-size: 20px 20px;
      opacity: 0.26;
      pointer-events: none;
      z-index: 0;
    }

    .setting-shell-hero,
    .setting-shell-stage {
      position: relative;
      z-index: 1;
    }

    .right-panel {
      image-rendering: pixelated;
    }

    .setting-shell-hero,
    .setting-shell-chip,
    .setting-shell-hero__status,
    .setting-shell-nav__item,
    .setting-shell-skeleton,
    .setting-section {
      border-radius: 0 !important;
      box-shadow: 4px 4px 0 0 rgba(15, 23, 42, 0.72) !important;
    }

    .setting-shell-nav__item.is-active {
      box-shadow: 4px 4px 0 0 rgba(50, 205, 50, 0.45) !important;
    }

    .setting-shell-hero {
      border-width: 2px !important;
      background-image:
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.16) 0 2px,
          transparent 2px
        ),
        linear-gradient(135deg, #faf089 0%, #f472b6 100%) !important;
      background-size:
        18px 18px,
        100% 100% !important;
    }

    .setting-shell-chip,
    .setting-shell-hero__status,
    .setting-shell-nav__item,
    .theme-setting-shell--8bit .setting-section {
      background-image: repeating-linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.92) 0 10px,
        rgba(241, 245, 249, 0.92) 10px 20px
      );
    }

    .setting-shell-nav__item {
      border: 2px solid rgba(15, 23, 42, 0.82);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .setting-shell-stage__item + .setting-shell-stage__item::before {
      background: repeating-linear-gradient(
        90deg,
        transparent 0 10px,
        rgba(255, 255, 255, 0.6) 10px 18px,
        transparent 18px 28px
      );
    }

    .theme-setting-shell--8bit .setting-section {
      outline: 2px solid rgba(15, 23, 42, 0.86);
      outline-offset: -6px;
    }
  }
}
</style>
