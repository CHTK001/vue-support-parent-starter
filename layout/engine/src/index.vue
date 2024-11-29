<script setup lang="ts">
import "./index.css";
import "animate.css";
import { emitter, findRouteByPath, getParentPaths, usePermissionStoreHook } from "@repo/core";

import { computed, onBeforeMount, ref, h, render, defineAsyncComponent, createApp } from "vue";
import Main from "./components/lay-main/index.vue";
import Content from "./components/lay-content/index.vue";
import { useRouter } from "vue-router";
const router = useRouter();
const path = router.currentRoute.value.path;
const isHome = computed(() => {
  return path == "/" || path == "/home" || !path;
});
const route = computed(() => {
  const menus = usePermissionStoreHook().flatteningRoutes;
  const match = menus.find((item) => item.path == path);
  return match;
});
</script>

<template>
  <div class="overflow-hidden h-full">
    <Main v-if="isHome" class="h-full"></Main>
    <Content v-else :data="route" class="h-full"></Content>
  </div>
</template>
