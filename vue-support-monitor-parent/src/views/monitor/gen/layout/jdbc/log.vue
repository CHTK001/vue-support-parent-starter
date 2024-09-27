<template>
  <div class="h-full">
    <index class="h-full" :data="data" />
  </div>
</template>
<script setup>
import { defineProps } from "vue";
import index from "./log/index.vue";
const props = defineProps({
  data: Object
});
</script>
