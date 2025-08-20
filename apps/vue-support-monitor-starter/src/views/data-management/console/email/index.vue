<template>
  <div class="page"><EmailConsole :id="id" /></div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import EmailConsole from "@/views/data-management/console/email/emailConsole.vue";
const id = computed(() => Number(useRoute().query.id));
</script>
<style scoped>
.page {
  padding: 8px;
  height: 100%;
}
</style>
