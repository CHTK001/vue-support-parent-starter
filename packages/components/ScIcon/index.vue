<script setup lang="ts">
import ScIcon from "./src/index.vue";
</script>

<template>
  <ScIcon v-bind="$attrs">
    <slot />
  </ScIcon>
</template>
