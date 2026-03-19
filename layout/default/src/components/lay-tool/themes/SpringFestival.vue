<script setup lang="ts">
import BaseTool from "./BaseTool.vue";
</script>

<template>
  <div class="spring-festival-tool-wrapper">
    <BaseTool theme-class="spring-festival-tool" />
  </div>
</template>

<style lang="scss" scoped>
.spring-festival-tool-wrapper {
  :deep(.spring-festival-tool) {
    .tool-item {
      color: #ffd700 !important;
      background: rgba(107, 0, 0, 0.78) !important;
      border: 1px solid rgba(255, 215, 0, 0.35) !important;
      box-shadow:
        0 2px 10px rgba(200, 16, 46, 0.18),
        inset 0 1px 0 rgba(255, 215, 0, 0.18) !important;

      &:hover {
        color: #fff3b0 !important;
        background: rgba(200, 16, 46, 0.4) !important;
        border-color: rgba(255, 215, 0, 0.55) !important;
      }
    }

    .header-clock {
      min-width: 164px;
      font-family: "Times New Roman", "STKaiti", "KaiTi", serif;
    }

    .header-clock-time,
    .header-clock-weekday {
      color: #ffd700 !important;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.25);
    }

    .header-clock-weekday {
      font-family: "STKaiti", "KaiTi", serif;
      letter-spacing: 0.04em;
    }

    .setting-btn {
      font-family: "STKaiti", "KaiTi", serif;
      color: #ffd700 !important;
      border-color: rgba(255, 215, 0, 0.45) !important;
    }

    :deep(.setting-symbol),
    :deep(.sc-text) {
      color: #ffd700 !important;
    }
  }
}
</style>
