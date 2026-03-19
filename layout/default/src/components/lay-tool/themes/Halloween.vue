<script setup lang="ts">
import BaseTool from "./BaseTool.vue";
</script>

<template>
  <div class="halloween-tool-wrapper">
    <BaseTool theme-class="halloween-tool" />
  </div>
</template>

<style lang="scss" scoped>
.halloween-tool-wrapper {
  :deep(.halloween-tool) {
    .tool-item {
      color: #ff9a3d !important;
      background: rgba(36, 14, 58, 0.78) !important;
      border: 1px solid rgba(255, 117, 24, 0.35) !important;

      &:hover {
        color: #ffd6b0 !important;
        background: rgba(255, 117, 24, 0.18) !important;
        border-color: rgba(255, 117, 24, 0.55) !important;
      }
    }

    .header-clock {
      min-width: 164px;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
    }

    .header-clock-time,
    .header-clock-weekday {
      color: #ff9a3d !important;
      text-shadow: 0 0 8px rgba(255, 117, 24, 0.3);
    }

    .setting-btn {
      color: #ff9a3d !important;
      border-color: rgba(255, 117, 24, 0.45) !important;
    }

    :deep(.setting-symbol),
    :deep(.sc-text) {
      color: #ff9a3d !important;
    }
  }
}
</style>
