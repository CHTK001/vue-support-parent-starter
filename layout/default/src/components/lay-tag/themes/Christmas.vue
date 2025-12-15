<script setup lang="ts">
import BaseTag from './BaseTag.vue';
</script>

<template>
  <div class="christmas-tag-wrapper">
    <BaseTag theme-class="christmas-tag" />
  </div>
</template>

<style lang="scss" scoped>
.christmas-tag-wrapper {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
@use './default.scss';
@use './christmas.css';
</style>
