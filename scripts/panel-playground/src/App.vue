<template>
  <PanelPage />
</template>

<script setup lang="ts">
import PanelPage from "../../../pages/panel/src/index.vue";
</script>

<style>
:root {
  color-scheme: light;
  font-family: "Segoe UI", "PingFang SC", sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #f7faf7 0%, #eef4f2 100%);
}

* {
  box-sizing: border-box;
}
</style>
