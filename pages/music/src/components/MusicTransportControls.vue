<template>
  <div class="transport" :class="{ 'transport--compact': compact }">
    <button
      type="button"
      class="transport-btn"
      :class="{ active: loopMode !== 'all' }"
      :aria-label="loopLabel"
      @click="emit('toggle-loop')"
    >
      <svg v-if="loopMode === 'random'" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h3l4 5 4-5h5" />
        <path d="m17 7 3 0-2.2-2.2" />
        <path d="M4 17h5l4-5 3.5 4.4H20" />
        <path d="m17 17 3 0-2.2 2.2" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8h11l-2.8-2.8" />
        <path d="M19 16H8l2.8 2.8" />
        <path d="M18.5 8l2.5 2.5-2.5 2.5" />
        <path d="M5.5 16L3 13.5 5.5 11" />
      </svg>
      <span v-if="loopMode === 'one'" class="loop-one">1</span>
      <span v-else-if="loopMode === 'random'" class="loop-random">R</span>
    </button>

    <button type="button" class="transport-btn" aria-label="上一首" @click="emit('prev')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6v12" />
        <path d="M18 6L9 12l9 6V6z" />
      </svg>
    </button>

    <button type="button" class="transport-btn transport-btn--major" aria-label="播放或暂停" @click="emit('toggle')">
      <span v-if="loading" class="loading-spinner" />
      <svg v-else-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6h3v12H8z" />
        <path d="M13 6h3v12h-3z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6l10 6-10 6V6z" />
      </svg>
    </button>

    <button type="button" class="transport-btn" aria-label="下一首" @click="emit('next')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 6v12" />
        <path d="M6 6l9 6-9 6V6z" />
      </svg>
    </button>

    <button
      v-if="showLyricsButton"
      type="button"
      class="transport-btn transport-btn--lyric"
      aria-label="歌词详情"
      @click="emit('open-lyrics')"
    >
      词
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MusicLoopMode } from "../types";

const props = withDefaults(
  defineProps<{
    isPlaying: boolean;
    loopMode: MusicLoopMode;
    loading?: boolean;
    compact?: boolean;
    showLyricsButton?: boolean;
  }>(),
  {
    loading: false,
    compact: false,
    showLyricsButton: false
  }
);

const emit = defineEmits<{
  (e: "prev"): void;
  (e: "toggle"): void;
  (e: "next"): void;
  (e: "toggle-loop"): void;
  (e: "open-lyrics"): void;
}>();

const loopLabel = computed(() => {
  if (props.loopMode === "one") return "单曲循环";
  if (props.loopMode === "random") return "随机播放";
  return "列表循环";
});
</script>

<style scoped lang="scss">
.transport {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.transport--compact {
  gap: 8px;
}

.transport-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.transport-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.12);
}

.transport-btn svg {
  width: 19px;
  height: 19px;
  fill: currentColor;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.transport-btn.active {
  background: rgba(241, 187, 103, 0.18);
  color: var(--music-accent);
}

.transport-btn--major {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--music-accent), var(--music-accent-2));
  color: #4b2518;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.22);
}

.transport-btn--major:hover {
  transform: none;
  background: linear-gradient(135deg, var(--music-accent), var(--music-accent-2));
}

.transport-btn--major svg {
  width: 21px;
  height: 21px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(58, 30, 22, 0.24);
  border-top-color: #4b2518;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.transport-btn--lyric {
  width: auto;
  min-width: 44px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.transport--compact .transport-btn {
  width: 40px;
  height: 40px;
}

.transport--compact .transport-btn--major {
  width: 50px;
  height: 50px;
}

.transport--compact .transport-btn--lyric {
  min-width: 40px;
  padding: 0 12px;
}

.loop-one {
  position: absolute;
  right: 7px;
  bottom: 6px;
  font-size: 11px;
  font-weight: 700;
}

.loop-random {
  position: absolute;
  right: 7px;
  bottom: 6px;
  font-size: 10px;
  font-weight: 700;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
