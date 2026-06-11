<template>
  <ScPanel
    class="datalake-panel"
    skin="scifi"
    :tech-theme="techTheme"
    :padding="padding"
    :show-header="false"
  >
    <div class="datalake-panel__header">
      <div class="datalake-panel__title">
        <slot name="icon">
          <svg
            v-if="iconPath"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            :stroke="iconColor"
            stroke-width="1.5"
          >
            <path :d="iconPath" />
          </svg>
        </slot>
        <span>{{ title }}</span>
        <slot name="badge" />
      </div>
      <div class="datalake-panel__actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="datalake-panel__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="datalake-panel__footer">
      <slot name="footer" />
    </div>
  </ScPanel>
</template>

<script setup lang="ts">
import { ScPanel } from "@repo/components/ScPanel";

defineOptions({ name: "DatalakePanel" });

withDefaults(
  defineProps<{
    title: string;
    iconPath?: string;
    iconColor?: string;
    techTheme?: "A1" | "A2" | "A3" | "B1" | "B2" | "B3" | "B4" | "DV1" | "DV2" | "DV3" | "DV4" | "DV5" | "DV6" | "DV7" | "DV8" | "DV9";
    padding?: string | number;
  }>(),
  {
    iconColor: "#00ffff",
    techTheme: "A1",
    padding: 0,
  },
);
</script>

<style scoped lang="scss">
.datalake-panel {
  height: 100%;
  min-height: 0;
}

.datalake-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.08);
}

.datalake-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  letter-spacing: 0.03em;
}

.datalake-panel__title span {
  white-space: nowrap;
}

.datalake-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.datalake-panel__body {
  min-height: 0;
}

.datalake-panel__footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 180, 255, 0.08);
}
</style>
