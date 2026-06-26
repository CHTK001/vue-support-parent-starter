<template>
  <router-link to="/home" class="logo-container">
    <img v-if="logoUrl" :src="logoUrl" class="logo-img" :style="{ width: logoSize, height: logoSize }" alt="logo" />
    <span v-if="!isCollapse" class="logo-title">{{ title }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useKoiGlobalStore } from "../../stores/global";

const props = defineProps<{ isCollapse: boolean; layout: string }>();
const globalStore = useKoiGlobalStore();
const logoUrl = "/src/assets/images/logo/logo.webp";
const logoSize = "34px";
const title = computed(() => "KOI-UI");
</script>

<style scoped>
.logo-container { display: flex; align-items: center; gap: 8px; padding: 12px 8px; text-decoration: none; overflow: hidden; }
.logo-img { flex-shrink: 0; border-radius: 6px; }
.logo-title { font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); white-space: nowrap; }
</style>