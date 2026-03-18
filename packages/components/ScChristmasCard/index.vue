<template>
  <div class="sc-christmas-card" :class="{ 'is-hoverable': hoverable }">
    <div class="christmas-card-snow-overlay"></div>
    <div class="christmas-card-content">
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
.sc-christmas-card {
  position: relative;
  padding: 20px;
  background: rgba(26, 47, 47, 0.8);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.sc-christmas-card.is-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
  border-color: rgba(196, 30, 58, 0.5);
}

/* 雪花纹理背景 */
.christmas-card-snow-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.15;
  background-image: radial-gradient(
      circle at 10% 20%,
      rgba(255, 255, 255, 0.8) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 30% 40%,
      rgba(255, 255, 255, 0.6) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 50% 60%,
      rgba(255, 255, 255, 0.7) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 70% 30%,
      rgba(255, 255, 255, 0.5) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 90% 70%,
      rgba(255, 255, 255, 0.8) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 20% 80%,
      rgba(255, 255, 255, 0.6) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 60% 90%,
      rgba(255, 255, 255, 0.7) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 80% 50%,
      rgba(255, 255, 255, 0.5) 1px,
      transparent 1px
    );
  background-size: 100% 100%;
  animation: snow-drift 20s linear infinite;
}

.christmas-card-content {
  position: relative;
  z-index: 1;
}

@keyframes snow-drift {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 0% 100%;
  }
}
</style>
