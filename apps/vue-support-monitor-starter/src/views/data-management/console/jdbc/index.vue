<template>
  <div class="page">
    <JdbcConsole :id="id" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import JdbcConsole from "@/views/data-management/console/jdbc/JdbcConsole.vue.vue";

const route = useRoute();
const id = computed(() => Number(route.query.id));
</script>

<style scoped>
.page {
  padding: 8px;
  height: 100%;
}
</style>
