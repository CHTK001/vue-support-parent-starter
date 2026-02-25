<template>
  <div class="server-management-wrapper system-container modern-bg">
    <ServerManagement />
  </div>
</template>

<script setup lang="ts">
import ServerManagement from "./modules/server-management/management.vue";
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.modern-bg {
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: $gradient-bg-1, $gradient-bg-2;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.server-management-wrapper {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

@include respond-to(sm) {
  .server-management-wrapper {
    min-height: 100svh;
  }
}
</style>
