<template>
  <RouterView />
</template>

<script setup lang="ts">
</script>

<style>
:root {
  color-scheme: light;
  font-family: "Avenir Next", "PingFang SC", "Segoe UI", sans-serif;
}

html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f1e7 0%, #ece2cf 100%);
}

* {
  box-sizing: border-box;
}
</style>
