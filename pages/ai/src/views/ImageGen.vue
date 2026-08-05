<template>
  <div class="ai-view">
    <div class="ai-view__container">
      <ReImageGen
        api-url="/v1/images/generations"
        :width="512"
        :height="512"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReImageGen from '@repo/ui/re-image-gen';
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
