<script setup lang="ts">
import { computed } from "vue";
import ErrorPage from "./components/ErrorPage.vue";
import { globalSetting } from "@repo/config";

defineOptions({
  name: "403",
});

// 403 使用禁止访问风格（锁/禁止标志）
const errorPageStyle = computed(() => globalSetting.ErrorPageStyle || "forbidden");
</script>

<template>
  <ErrorPage code="403" :style="errorPageStyle" />
</template>
