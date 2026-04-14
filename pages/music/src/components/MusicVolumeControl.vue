<template>
  <div
    class="volume-control"
    :class="[`dir-${direction}`, `axis-${axis}`, { open: persistent || expanded }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <button class="volume-trigger" type="button" aria-label="音量" @click="toggleMute">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 10h4l5-4v12l-5-4H5z" />
        <path v-if="modelValue > 0" d="M16 9a4 4 0 0 1 0 6" />
        <path v-if="modelValue > 48" d="M18.7 6.5a8 8 0 0 1 0 11" />
      </svg>
    </button>

    <div class="volume-panel">
      <input
        class="volume-slider"
        :class="`volume-slider--${axis}`"
        type="range"
        min="0"
        max="100"
        :value="modelValue"
        @input="onInput"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    direction?: "up" | "down" | "left" | "right";
    orientation?: "auto" | "vertical" | "horizontal";
    persistent?: boolean;
  }>(),
  {
    direction: "up",
    orientation: "auto",
    persistent: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const expanded = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const axis = computed(() => {
  if (props.orientation !== "auto") {
    return props.orientation;
  }
  return props.direction === "up" || props.direction === "down" ? "vertical" : "horizontal";
});

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", Number(target.value));
  expanded.value = true;
  scheduleHide();
}

function toggleMute() {
  emit("update:modelValue", props.modelValue > 0 ? 0 : 68);
  expanded.value = true;
  scheduleHide();
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
}

function scheduleHide(delay = 1200) {
  if (props.persistent) return;
  clearHideTimer();
  hideTimer = setTimeout(() => {
    expanded.value = false;
  }, delay);
}

function handleMouseEnter() {
  clearHideTimer();
  expanded.value = true;
}

function handleMouseLeave() {
  scheduleHide(180);
}

onBeforeUnmount(() => clearHideTimer());
</script>

<style scoped lang="scss">
.volume-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.volume-trigger {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
}

.volume-trigger svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.volume-panel {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms ease;
}

.volume-control.open .volume-panel {
  opacity: 1;
  pointer-events: auto;
}

.axis-horizontal .volume-panel {
  width: 138px;
  height: 44px;
  padding: 0 12px;
}

.axis-horizontal .volume-slider {
  width: 100%;
}

.axis-vertical .volume-panel {
  width: 44px;
  height: 138px;
  padding: 12px 0;
}

.axis-vertical .volume-slider {
  width: 104px;
}

.volume-slider {
  margin: 0;
  accent-color: var(--music-accent);
}

.volume-slider--vertical {
  transform: rotate(-90deg);
  transform-origin: center;
}

.dir-right .volume-panel {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.dir-left .volume-panel {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.dir-up .volume-panel {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.dir-down .volume-panel {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}
</style>
