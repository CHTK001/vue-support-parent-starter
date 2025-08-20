<template>
  <div class="page"><GraphConsole :id="id" /></div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import GraphConsole from "@/views/data-management/console/graph/graphConsole.vue";
const id = computed(() => Number(useRoute().query.id));
</script>
<style scoped>
.page {
  padding: 8px;
  height: 100%;
}
</style>
