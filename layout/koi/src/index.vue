<template>
  <div>
    <component :is="layoutComponent" />
    <component :is="ThemeConfig" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type Component } from "vue";
import { useScreenStore } from "./hooks/screen/index";
import { useKoiGlobalStore } from "./stores/global";
import type { KoiLayoutType, LayoutComponentMap } from "./types";

import LayoutVertical from "./layouts/LayoutVertical/index.vue";
import LayoutColumns from "./layouts/LayoutColumns/index.vue";
import LayoutClassic from "./layouts/LayoutClassic/index.vue";
import LayoutHorizontal from "./layouts/LayoutHorizontal/index.vue";
import LayoutOptimum from "./layouts/LayoutOptimum/index.vue";
import LayoutMobile from "./layouts/LayoutMobile/index.vue";
import ThemeConfig from "./components/ThemeConfig/index.vue";

const layoutMap: LayoutComponentMap = {
  vertical: LayoutVertical,
  columns: LayoutColumns,
  classic: LayoutClassic,
  horizontal: LayoutHorizontal,
  optimum: LayoutOptimum,
};

const globalStore = useKoiGlobalStore();
const { isMobile } = useScreenStore();

const layout = computed(() => globalStore.layout);
const layoutComponent = computed<Component>(() => {
  if (isMobile.value) return LayoutMobile;
  return layoutMap[layout.value as KoiLayoutType] || LayoutVertical;
});
</script>