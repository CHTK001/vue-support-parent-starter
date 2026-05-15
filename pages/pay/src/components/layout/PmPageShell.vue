<template>
  <section class="pm-page" :class="[pageClass, backgroundClass]">
    <slot />
    <div class="pm-page__feature-trigger">
      <FeatureMenuDrawer />
    </div>
  </section>
</template>

<script setup lang="ts">
import "../../styles";
import FeatureMenuDrawer from "../FeatureMenuDrawer.vue";

defineProps<{
  pageClass?: string;
  backgroundClass?: string;
}>();
</script>

<style scoped>
.pm-page__feature-trigger {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 999;
}
</style>
