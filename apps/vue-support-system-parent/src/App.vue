<template>
  <el-config-provider :locale="elementPlusLocale">
    <RouteLoading />
    <router-view :key="$route.fullPath" />
    <ReDialog />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ReDialog } from "@repo/components/ReDialog";
import { ElConfigProvider } from "element-plus";
import { elementPlusLocale } from "@repo/config";
import RouteLoading from "./components/RouteLoading.vue";
</script>
