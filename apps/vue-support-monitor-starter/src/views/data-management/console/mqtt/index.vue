<template>
  <div class="page">
    <MqttConsole :id="id" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import MqttConsole from "@/views/data-management/console/mqtt/mqttConsole.vue";
const id = computed(() => Number(useRoute().query.id));
</script>
<style scoped>
.page {
  padding: 8px;
  height: 100%;
}
</style>
