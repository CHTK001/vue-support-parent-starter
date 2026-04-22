<template>
  <ElTabPane v-for="item in railItems" :key="String(item.name)" :name="item.name">
    <template #label>
      <ScTabsRailTabLabel
        :item="item"
        :rail-closable="railClosable"
        @close="onClose"
      />
    </template>
  </ElTabPane>
</template>

<script setup lang="ts">
import { ElTabPane } from "element-plus";
import ScTabsRailTabLabel from "./ScTabsRailTabLabel.vue";
import type { ScTabsRailItem } from "../types";

defineProps<{
  railClosable: boolean;
  railItems: ScTabsRailItem[];
}>();

const emit = defineEmits<{
  (e: "tab-remove", name: string | number): void;
}>();

const onClose = (name: string | number) => {
  emit("tab-remove", name);
};
</script>
