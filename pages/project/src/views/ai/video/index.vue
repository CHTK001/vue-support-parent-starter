<script setup>
import { defineAsyncComponent } from "vue";

const Generation = defineAsyncComponent(() => import("../generation/index.vue"));
</script>
<template>
  <div>
    <Generation category="VIDEO" selectedItemLabel="ai-video-generations-selected" type="VIDEO" />
  </div>
</template>
