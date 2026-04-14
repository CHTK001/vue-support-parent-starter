<template>
  <section
    class="detail-panel"
    :class="{ 'detail-panel--minimized': minimized }"
  >
    <template v-if="minimized">
      <button
        class="mini-track"
        :aria-label="currentTrack ? `查看 ${currentTrack.title} 详情` : '暂无播放歌曲'"
        @click="emit('open-detail')"
      >
        <img v-if="currentTrack" :src="currentTrack.coverUrl" :alt="currentTrack.title" />
        <div v-else class="cover-placeholder">♪</div>
        <div class="mini-track__copy">
          <strong>{{ currentTrack?.title || "等待播放" }}</strong>
          <span>{{ currentTrack?.artist || "选择一首歌开始播放" }}</span>
        </div>
      </button>

      <div class="mini-controls">
        <button class="icon-btn" aria-label="上一首" @click="emit('prev')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6v12" />
            <path d="M18 6L9 12l9 6V6z" />
          </svg>
        </button>

        <button class="icon-btn icon-btn--accent" aria-label="播放或暂停" @click="emit('toggle')">
          <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 6h3v12H8z" />
            <path d="M13 6h3v12h-3z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 6l10 6-10 6V6z" />
          </svg>
        </button>

        <button class="icon-btn" aria-label="下一首" @click="emit('next')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6v12" />
            <path d="M6 6l9 6-9 6V6z" />
          </svg>
        </button>
      </div>

      <div class="mini-actions">
        <button class="icon-btn" aria-label="展开播放器" @click="emit('toggle-minimize')">
          <svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 14V7h7" />
            <path d="M17 10v7h-7" />
            <path d="M14 7 6 15" />
            <path d="m10 17 8-8" />
          </svg>
        </button>
      </div>
    </template>

    <template v-else>
    <button
      class="track-card"
      :aria-label="currentTrack ? `查看 ${currentTrack.title} 详情` : '暂无播放歌曲'"
      @click="emit('open-detail')"
    >
      <img v-if="currentTrack" :src="currentTrack.coverUrl" :alt="currentTrack.title" />
      <div v-else class="cover-placeholder">♪</div>
    </button>

    <div class="player-center">
      <button
        v-if="currentTrack"
        class="lyrics-shortcut"
        type="button"
        @click="emit('open-lyrics')"
      >
        歌词
      </button>

      <MusicTransportControls
        compact
        :is-playing="isPlaying"
        :loop-mode="loopMode"
        :loading="loading"
        @prev="emit('prev')"
        @toggle="emit('toggle')"
        @next="emit('next')"
        @toggle-loop="emit('toggle-loop')"
      />

      <MusicProgressBar
        compact
        :current-time="currentTime"
        :duration="duration"
        :slider-value="sliderValue"
        @preview-seek="emit('preview-seek', $event)"
        @seek="emit('seek', $event)"
      />
    </div>

    <div class="player-side">
      <button
        class="icon-btn"
        :class="{ active: favoriteActive }"
        aria-label="收藏当前歌曲"
        :disabled="!currentTrack"
        @click="emit('toggle-favorite')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.2l-1.15-1.05C5.2 14.08 2 11.15 2 7.55A4.55 4.55 0 0 1 6.55 3 5 5 0 0 1 12 6.1 5 5 0 0 1 17.45 3 4.55 4.55 0 0 1 22 7.55c0 3.6-3.2 6.53-8.85 11.6L12 20.2z"
          />
        </svg>
      </button>

      <button class="icon-btn" aria-label="最小化控制器" @click="emit('toggle-minimize')">
        <svg class="icon-stroke" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 15h12" />
        </svg>
      </button>

      <MusicVolumeControl
        :model-value="volume"
        direction="up"
        @update:model-value="emit('update-volume', $event)"
      />
    </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import MusicVolumeControl from "./MusicVolumeControl.vue";
import MusicProgressBar from "./MusicProgressBar.vue";
import MusicTransportControls from "./MusicTransportControls.vue";
import type {
  MusicLoopMode,
  MusicTrackDetail,
  MusicTrackSummary,
} from "../types";

const props = defineProps<{
  loading: boolean;
  isPlaying: boolean;
  currentTrack: MusicTrackDetail | null;
  currentTrackKey: string;
  favoriteActive: boolean;
  queue: MusicTrackSummary[];
  currentTime: number;
  duration: number;
  sliderValue: number;
  volume: number;
  loopMode: MusicLoopMode;
  minimized?: boolean;
}>();

const emit = defineEmits<{
  (e: "prev"): void;
  (e: "toggle"): void;
  (e: "next"): void;
  (e: "toggle-loop"): void;
  (e: "toggle-favorite"): void;
  (e: "preview-seek", value: number): void;
  (e: "seek", value: number): void;
  (e: "update-volume", value: number): void;
  (e: "play-track", track: MusicTrackSummary, queue: MusicTrackSummary[]): void;
  (e: "open-detail"): void;
  (e: "open-lyrics"): void;
  (e: "toggle-minimize"): void;
}>();
</script>

<style scoped lang="scss">
.detail-panel {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 198px;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--music-stroke);
  border-radius: 28px;
  background: rgba(62, 28, 26, 0.92);
  box-shadow: var(--music-shadow);
  padding: 12px 16px;
  backdrop-filter: blur(18px);
}

.detail-panel--minimized {
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  width: min(620px, calc(100vw - 40px));
  margin-left: auto;
  padding: 10px 12px;
}

.track-card {
  width: 76px;
  height: 76px;
  border: 0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.mini-track {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;
  border: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  cursor: pointer;
  padding: 8px;
  text-align: left;
}

.mini-track img {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  object-fit: cover;
}

.mini-track__copy {
  min-width: 0;
}

.mini-track__copy strong,
.mini-track__copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-track__copy span {
  margin-top: 4px;
  color: var(--music-muted);
  font-size: 12px;
}

.track-card img,
.cover-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.track-card img {
  object-fit: cover;
}

.cover-placeholder {
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  font-size: 24px;
}

.player-center {
  display: grid;
  gap: 10px;
}

.lyrics-shortcut {
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
  padding: 6px 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.player-side {
  display: grid;
  grid-template-columns: 44px 44px 44px;
  gap: 10px;
  align-items: center;
  justify-content: end;
}

.player-side :deep(.volume-control.dir-up .volume-panel) {
  left: auto;
  right: 0;
  transform: none;
}

.mini-controls,
.mini-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: var(--music-text);
  cursor: pointer;
}

.icon-btn--accent {
  background: linear-gradient(135deg, var(--music-accent), var(--music-accent-2));
  color: #4b2518;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.icon-btn svg.icon-stroke {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.icon-btn.active {
  background: rgba(241, 187, 103, 0.18);
  color: var(--music-accent);
}

@media (max-width: 1120px) {
  .detail-panel:not(.detail-panel--minimized) {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 860px) {
  .detail-panel--minimized {
    grid-template-columns: 1fr;
    width: 100%;
  }

  .mini-controls,
  .mini-actions {
    justify-content: space-between;
  }
}
</style>
