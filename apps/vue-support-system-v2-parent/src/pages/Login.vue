<template>
  <!-- 登录页 - 主题/样式由 @layout/koi 提供，API 集成由 @repo/core 接管 -->
  <KoiLoginPage
    title="系统管理"
    subtitle="基于 KOI-UI 的新一代管理平台"
    redirect-path="/dashboard"
  />
</template>

<script setup lang="ts">
import KoiLoginPage from "@layout/koi/pages/LoginPage.vue";
</script>