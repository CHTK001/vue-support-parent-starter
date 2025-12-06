<script setup lang="ts">
import { computed } from "vue";
import ErrorPage from "./components/ErrorPage.vue";
import { globalSetting } from "@repo/config";

defineOptions({
  name: "500",
});

// 从配置获取错误页面风格
const errorPageStyle = computed(() => globalSetting.ErrorPageStyle || "pixel");
</script>

<template>
  <ErrorPage code="500" :style="errorPageStyle" />
</template>
