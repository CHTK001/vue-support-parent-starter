<template>
  <div class="sc-halloween-card" :class="{ 'is-hoverable': hoverable }">
    <div class="halloween-card-web-overlay"></div>
    <div class="halloween-card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hoverable?: boolean;
}>();
</script>

<style scoped>
.sc-halloween-card {
  position: relative;
  padding: 20px;
  background: rgba(42, 31, 53, 0.8);
  border: 1px solid rgba(155, 89, 182, 0.3);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sc-halloween-card.is-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(155, 89, 182, 0.3);
  border-color: rgba(255, 107, 53, 0.5);
}

/* 蜘蛛网纹理背景 */
.halloween-card-web-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 20px,
      rgba(155, 89, 182, 0.3) 20px,
      rgba(155, 89, 182, 0.3) 21px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 20px,
      rgba(155, 89, 182, 0.3) 20px,
      rgba(155, 89, 182, 0.3) 21px
    ),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 28px,
      rgba(155, 89, 182, 0.2) 28px,
      rgba(155, 89, 182, 0.2) 29px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 28px,
      rgba(155, 89, 182, 0.2) 28px,
      rgba(155, 89, 182, 0.2) 29px
    );
}

.halloween-card-content {
  position: relative;
  z-index: 1;
}
</style>
