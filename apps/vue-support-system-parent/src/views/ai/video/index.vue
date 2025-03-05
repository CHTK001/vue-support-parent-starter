<script setup>
import { defineAsyncComponent } from "vue";

const Vincent = defineAsyncComponent(() => import("../vincent/index.vue"));
</script>
<template>
  <div>
    <Vincent category="VIDEO" selectedItemLabel="ai-video-generations-selected" type="VIDEO" />
  </div>
</template>
