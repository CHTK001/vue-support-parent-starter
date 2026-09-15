<template>
  <div class="re-empty">
    <div class="re-empty-icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </slot>
    </div>
    <p class="re-empty-text">{{ text }}</p>
    <div v-if="$slots.default" class="re-empty-action">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  text: { type: String, default: '暂无数据' },
})
</script>

<style scoped>
.re-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #94a3b8;
}

.re-empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.re-empty-icon svg {
  width: 100%;
  height: 100%;
}

.re-empty-text {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 16px 0;
}

.re-empty-action {
  display: flex;
  gap: 12px;
}
</style>
