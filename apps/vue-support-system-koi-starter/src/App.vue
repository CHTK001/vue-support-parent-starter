<template>
  <router-view />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";

const error = ref<string | null>(null);

onErrorCaptured((err) => {
  const msg = String(err);
  error.value = msg;
  console.error("[App.vue] Error captured:", err);
  return false;
});
</script>