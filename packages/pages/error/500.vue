<script setup lang="ts">
import { computed } from "vue";
import ErrorPage from "./components/ErrorPage.vue";
import { globalSetting } from "@repo/config";

defineOptions({
  name: "500",
});

// 500 使用服务器错误风格（服务器/故障/代码雨）
const errorPageStyle = computed(() => globalSetting.ErrorPageStyle || "servererror");
</script>

<template>
  <ErrorPage code="500" :style="errorPageStyle" />
</template>
