<template>
  <div class="page-container">
    <div class="gen-wrapper">
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
.page-container {
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f8 50%, #e8ecf6 100%);
  padding: 12px;
  box-sizing: border-box;
}

.gen-wrapper {
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 32px rgba(99, 102, 241, 0.06);
  animation: gen-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes gen-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
