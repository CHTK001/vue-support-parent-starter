<template>
  <div>
    <component :is="layoutComponent" />
    <component :is="ThemeConfig" />
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from "vue";
import { useKoiGlobalStore } from "./stores/global";
import type { KoiLayoutType, LayoutComponentMap } from "./types";

import LayoutVertical from "./layouts/LayoutVertical/index.vue";
import ThemeConfig from "./components/ThemeConfig/index.vue";

const layoutMap: LayoutComponentMap = {
  vertical: LayoutVertical,
  columns: LayoutVertical,
  classic: LayoutVertical,
  horizontal: LayoutVertical,
  optimum: LayoutVertical,
};

const globalStore = useKoiGlobalStore();
const layout = computed(() => globalStore.layout);
const layoutComponent = computed<Component>(() => {
  return layoutMap[layout.value as KoiLayoutType] || LayoutVertical;
});
</script>
