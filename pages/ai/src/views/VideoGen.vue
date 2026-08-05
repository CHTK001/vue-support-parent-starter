<template>
  <div class="ai-view">
    <div class="ai-view__container">
      <ReVideoGen
        api-url="/v1/videos/generations"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReVideoGen from '@repo/ui/re-video-gen';
</script>

<style scoped>
.ai-view {
  height: 100%;
  padding: var(--ai-spacing-md);
  box-sizing: border-box;
  overflow: hidden;
}
.ai-view__container {
  height: 100%;
  border-radius: var(--ai-card-radius);
  overflow: hidden;
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
}
</style>
