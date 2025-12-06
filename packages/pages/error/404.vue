<script setup lang="ts">
import { computed } from "vue";
import ErrorPage from "./components/ErrorPage.vue";
import { globalSetting } from "@repo/config";

defineOptions({
  name: "404",
});

// 404 使用迷路风格（沙漠/路标/放大镜）
const errorPageStyle = computed(() => globalSetting.ErrorPageStyle || "notfound");
</script>

<template>
  <ErrorPage code="404" :style="errorPageStyle" />
</template>
