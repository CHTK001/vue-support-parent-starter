<template>
  <aside class="sc-tabs-rail-layout">
    <ScTabs
      v-model="currentValue"
      layout="rail"
      class="sc-tabs-rail-layout__tabs"
      :rail-close-button-mode="closeButtonMode"
      :rail-items="items"
      :rail-round="round"
      :rail-size="railSize"
      :tab-position="tabPosition"
      @tab-remove="handleTabRemove"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ScTabs } from "@repo/components/ScTabs";
import type { ScTabsRailItem } from "@repo/components/ScTabs";

const props = withDefaults(defineProps<{
  closeButtonMode?: "always" | "hover";
  items: ScTabsRailItem[];
  modelValue: string | number;
  railSize?: "compact" | "normal" | "large";
  round?: boolean;
  tabPosition?: "top" | "right" | "bottom" | "left";
}>(), {
  closeButtonMode: "hover",
  railSize: "normal",
  round: false,
  tabPosition: "left",
});

const emit = defineEmits<{
  (e: "tab-remove", value: string): void;
  (e: "update:modelValue", value: string): void;
}>();

const currentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", String(value));
  },
});

const handleTabRemove = (value: string | number) => {
  emit("tab-remove", String(value));
};
</script>

<style scoped lang="scss">
.sc-tabs-rail-layout {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.sc-tabs-rail-layout__tabs {
  height: 100%;
}
</style>
