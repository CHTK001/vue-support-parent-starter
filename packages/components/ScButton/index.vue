<script setup lang="ts">
import ScButton from "./src/index.vue";
</script>

<template>
  <ScButton v-bind="$attrs">
    <slot />
  </ScButton>
</template>
