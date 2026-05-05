<template>
  <section class="pm-page" :class="[pageClass, backgroundClass]">
    <slot />
  </section>
</template>

<script setup lang="ts">
import "../../styles";

defineProps<{
  pageClass?: string;
  backgroundClass?: string;
}>();
</script>
