<template>
  <el-config-provider :locale="currentLocale">
    <router-view :key="$route.fullPath" />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from "element-plus";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { computed } from "vue";

const currentLocale = computed(() => {
  return (window as any).$storage?.locale?.locale === "zh-CN" ? zhCn : en;
});
</script>

