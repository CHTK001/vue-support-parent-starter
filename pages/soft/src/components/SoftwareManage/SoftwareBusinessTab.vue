<template>
  <div class="software-business-tab">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "SoftwareBusinessTab",
});
</script>

<style scoped lang="scss">
.software-business-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
