<template>
  <button class="feature-card" type="button" @click="$emit('click')">
    <div class="feature-media" :style="{ background: accent }">
      <div class="feature-shape"></div>
      <div class="feature-emoji">{{ emoji }}</div>
    </div>
    <div class="feature-body">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  emoji: string;
  accent: string;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
.feature-card {
  display: grid;
  grid-template-rows: 1fr auto;
  width: 100%;
  min-height: 320px;
  padding: 0;
  border: 0;
  border-radius: 28px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow:
    0 18px 50px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow:
      0 28px 70px rgba(15, 23, 42, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }
}

.feature-media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  overflow: hidden;
}

.feature-shape {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.18);
  transform: rotate(18deg);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
}

.feature-emoji {
  position: relative;
  z-index: 1;
  font-size: 72px;
  filter: drop-shadow(0 12px 24px rgba(15, 23, 42, 0.16));
}

.feature-body {
  padding: 24px;

  h3 {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 0;
    line-height: 1.6;
    color: #475569;
    font-size: 14px;
  }
}
</style>
