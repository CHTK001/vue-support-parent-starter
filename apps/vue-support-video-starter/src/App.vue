<script setup lang="ts">
// 根组件：站点导航 + 路由视图
import SiteHeader from "@/components/SiteHeader.vue";
</script>

<template>
  <SiteHeader />
  <router-view />
</template>
