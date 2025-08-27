<template>
  <div class="page">
    <RedisConsole :id="id" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import RedisConsole from "@/views/data-management/console/redis/RedisConsole.vue";

const route = useRoute();
const id = computed(() => Number(route.query.id));
</script>

<style scoped>
.page {
  padding: 8px;
  height: 100%;
}
</style>
