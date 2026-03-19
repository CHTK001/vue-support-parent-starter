<script setup lang="ts">
import BaseTool from "./BaseTool.vue";
</script>

<template>
  <div class="christmas-tool-wrapper">
    <BaseTool theme-class="christmas-tool" />
  </div>
</template>

<style lang="scss" scoped>
.christmas-tool-wrapper {
  :deep(.christmas-tool) {
    .tool-item {
      color: #ffe18a !important;
      background: rgba(17, 70, 28, 0.78) !important;
      border: 1px solid rgba(255, 215, 0, 0.28) !important;

      &:hover {
        color: #fff !important;
        background: rgba(196, 30, 58, 0.22) !important;
        border-color: rgba(255, 215, 0, 0.5) !important;
      }
    }

    .header-clock {
      min-width: 164px;
      font-family: "Georgia", "Times New Roman", serif;
    }

    .header-clock-time,
    .header-clock-weekday {
      color: #ffe18a !important;
      text-shadow: 0 0 8px rgba(255, 225, 138, 0.28);
    }

    .setting-btn {
      color: #ffe18a !important;
      border-color: rgba(255, 215, 0, 0.45) !important;
    }

    :deep(.setting-symbol),
    :deep(.sc-text) {
      color: #ffe18a !important;
    }
  }
}
</style>
