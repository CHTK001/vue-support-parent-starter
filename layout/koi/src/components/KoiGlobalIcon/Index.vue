<template>
  <el-icon :size="size">
    <component v-if="comp" :is="comp" />
    <Document v-else />
  </el-icon>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Document } from "@element-plus/icons-vue";
import * as EP from "@element-plus/icons-vue";

const props = withDefaults(defineProps<{
  name?: string;
  size?: number | string;
}>(), {
  name: "Sunny",
  size: "18",
});

const EP_ALIAS: Record<string, string> = {
  "odometer": "Odometer", "setting": "Setting", "menu": "Menu",
  "user": "User", "role": "Flag", "dept": "OfficeBuilding",
  "dict": "Notebook", "feedback": "ChatDotRound",
  "log": "Clock", "config": "Tools", "home": "HomeFilled",
  "dashboard": "DataBoard", "monitor": "Monitor",
  "lock": "Lock", "key": "Key", "search": "Search",
  "bell": "Bell", "message": "Message", "star": "Star",
};

const KOI_MAP: Record<string, string> = {
  "koi-search": "Search", "koi-moon-side": "Moon", "koi-sun-line": "Sunny",
  "koi-refresh-arrow": "RefreshRight", "koi-maximize": "FullScreen",
  "koi-fullscreen-exit": "ScaleToOriginal", "koi-translate": "Switch",
  "koi-setting": "Setting", "koi-arrow-left-right": "Sort",
  "koi-convert-cube": "Grid",
};

const comp = computed(() => {
  let n = props.name || "Sunny";
  // Strip known icon prefixes
  n = n.replace(/^(ep|ri|humbleicons|icon-park-outline|mdi):/, "");
  // Check koi custom icons
  n = KOI_MAP[n] || n;
  // Check EP alias
  n = EP_ALIAS[n] || n;
  // Try to find in EP
  return (EP as any)[n] || null;
});
</script>
