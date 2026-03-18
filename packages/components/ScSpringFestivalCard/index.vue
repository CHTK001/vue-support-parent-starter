<template>
  <div class="sc-spring-festival-card" :class="{ 'is-hoverable': hoverable }">
    <div class="card-background" />
    <div class="card-content">
      <slot />
    </div>
    <div class="card-decoration">
      <div class="corner corner-tl" />
      <div class="corner corner-tr" />
      <div class="corner corner-bl" />
      <div class="corner corner-br" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hoverable?: boolean;
}

withDefaults(defineProps<Props>(), {
  hoverable: true
});
</script>

<style scoped lang="scss">
.sc-spring-festival-card {
  position: relative;
  padding: var(--spacing-lg, 16px);
  border-radius: var(--radius-lg, 8px);
  overflow: hidden;
  transition: all var(--transition-base, 0.3s);

  .card-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #dc143c 0%, #ff4500 50%, #ffd700 100%);
    opacity: 0.1;
    transition: opacity var(--transition-base, 0.3s);
  }

  .card-content {
    position: relative;
    z-index: 1;
  }

  .card-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;

    .corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid #ffd700;
      opacity: 0.6;
      transition: all var(--transition-base, 0.3s);

      &.corner-tl {
        top: 0;
        left: 0;
        border-right: none;
        border-bottom: none;
        border-top-left-radius: var(--radius-lg, 8px);
      }

      &.corner-tr {
        top: 0;
        right: 0;
        border-left: none;
        border-bottom: none;
        border-top-right-radius: var(--radius-lg, 8px);
      }

      &.corner-bl {
        bottom: 0;
        left: 0;
        border-right: none;
        border-top: none;
        border-bottom-left-radius: var(--radius-lg, 8px);
      }

      &.corner-br {
        bottom: 0;
        right: 0;
        border-left: none;
        border-top: none;
        border-bottom-right-radius: var(--radius-lg, 8px);
      }
    }
  }

  &.is-hoverable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(220, 20, 60, 0.2);

    .card-background {
      opacity: 0.15;
    }

    .corner {
      opacity: 1;
      border-color: #dc143c;
    }
  }
}

html.dark .sc-spring-festival-card {
  .card-background {
    opacity: 0.15;
  }

  &.is-hoverable:hover {
    .card-background {
      opacity: 0.2;
    }
  }
}
</style>
