<template>
  <div class="page-container">
    <ReVideoGen
      api-url="/v1/videos/generations"
    />
  </div>
</template>

<script setup lang="ts">
import ReVideoGen from '@repo/ui/re-video-gen';
</script>

<style scoped>
.page-container {
  height: 100%;
}
</style>
