<template>
  <div class="page-container">
    <ReImageGen
      api-url="/v1/images/generations"
      :width="512"
      :height="512"
    />
  </div>
</template>

<script setup lang="ts">
import ReImageGen from '@repo/ui/re-image-gen';
</script>

<style scoped>
.page-container {
  height: 100%;
}
</style>
