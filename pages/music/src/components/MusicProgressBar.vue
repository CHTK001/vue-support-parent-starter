<template>
  <div class="progress-row" :class="{ 'progress-row--compact': compact }">
    <span>{{ formatClock(currentTime) }}</span>
    <el-slider
      :model-value="sliderValue"
      :max="Math.max(duration, 1)"
      :show-tooltip="false"
      @input="emit('preview-seek', $event)"
      @change="emit('seek', $event)"
    />
    <span>{{ formatClock(duration) }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    currentTime: number;
    duration: number;
    sliderValue: number;
    compact?: boolean;
  }>(),
  {
    compact: false
  }
);

const emit = defineEmits<{
  (e: "preview-seek", value: number): void;
  (e: "seek", value: number): void;
}>();

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}
</script>

<style scoped lang="scss">
.progress-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 12px;
  align-items: center;
  color: var(--music-muted);
  font-size: 12px;
}

.progress-row--compact {
  gap: 10px;
}
</style>
