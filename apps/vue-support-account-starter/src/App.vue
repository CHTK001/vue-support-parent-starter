<template>
  <div class="account-app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const activeRoute = computed(() => route.path);
</script>

<style>
.account-app {
  width: 100%;
  height: 100vh;
}
</style>
