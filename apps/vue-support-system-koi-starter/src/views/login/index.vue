<template>
  <div class="login-page">
    <LoginPage />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { getConfig } from "@repo/config";

const theme = getConfig()?.theme || "koi";
const LoginPage = defineAsyncComponent({
  loader: () => import(`@pages/login/themes/${theme}/index.vue`),
  suspensible: false,
  delay: 0,
});
</script>

<style scoped>
.login-page {
  height: 100vh;
  background-color: var(--el-bg-color);
}
</style>
