<template>
  <aside v-loading="loading" class="detail-panel">
    <section class="now-playing">
      <div v-if="currentTrack" class="cover-frame">
        <img :src="currentTrack.coverUrl" :alt="currentTrack.title" />
      </div>
      <div class="track-focus">
        <p class="focus-kicker">Now Playing</p>
        <h3>{{ currentTrack?.title || "等待播放" }}</h3>
        <span>{{ currentTrack?.artist || "从左侧歌单或搜索结果开始" }}</span>
      </div>
      <div class="control-row">
        <button class="control-btn" @click="emit('prev')">
          <el-icon><Back /></el-icon>
        </button>
        <button class="control-btn major" @click="emit('toggle')">
          <el-icon v-if="!isPlaying"><VideoPlay /></el-icon>
          <el-icon v-else><VideoPause /></el-icon>
        </button>
        <button class="control-btn" @click="emit('next')">
          <el-icon><Right /></el-icon>
        </button>
        <button
          class="control-btn"
          :class="{ marked: favoriteActive }"
          :disabled="!currentTrack"
          @click="emit('toggle-favorite')"
        >
          <el-icon><Star /></el-icon>
        </button>
      </div>
    </section>

    <section class="meter-card">
      <div class="time-row">
        <span>{{ formatClock(currentTime) }}</span>
        <span>{{ formatClock(duration) }}</span>
      </div>
      <el-slider
        :model-value="sliderValue"
        :max="Math.max(duration, 1)"
        :show-tooltip="false"
        @change="emit('seek', $event)"
      />
      <div class="time-row compact">
        <span>音量</span>
        <span>{{ volume }}%</span>
      </div>
      <el-slider
        :model-value="volume"
        :max="100"
        :show-tooltip="false"
        @input="emit('update-volume', $event)"
      />
    </section>

    <section class="lyric-card">
      <div class="section-head">
        <span>歌词</span>
        <span class="section-meta">{{ parsedLyrics.length }} 行</span>
      </div>
      <div ref="lyricsBodyRef" class="lyrics-body">
        <p
          v-for="(line, index) in parsedLyrics"
          :key="`${line.time}-${index}`"
          :data-lyric-index="index"
          :class="{ active: index === activeLyricIndex }"
        >
          {{ line.text }}
        </p>
        <p v-if="!parsedLyrics.length" class="lyric-empty">
          当前歌曲没有歌词数据。
        </p>
      </div>
    </section>

    <section class="queue-card">
      <div class="section-head">
        <span>播放队列</span>
        <span class="section-meta">{{ queue.length }} 首</span>
      </div>
      <div class="queue-list">
        <button
          v-for="item in queue"
          :key="`${item.source}:${item.trackId}`"
          class="queue-item"
          :class="{ active: currentTrackKey === `${item.source}:${item.trackId}` }"
          @click="emit('play-track', item, queue)"
        >
          <strong>{{ item.title }}</strong>
          <span>{{ item.artist }}</span>
        </button>
        <p v-if="!queue.length" class="lyric-empty">播放队列会随歌单或搜索结果更新。</p>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { Back, Right, Star, VideoPause, VideoPlay } from "@element-plus/icons-vue";
import { nextTick, ref, watch } from "vue";
import type { MusicTrackDetail, MusicTrackSummary } from "../types";

interface LyricLine {
  time: number;
  text: string;
}

const props = defineProps<{
  loading: boolean;
  isPlaying: boolean;
  currentTrack: MusicTrackDetail | null;
  currentTrackKey: string;
  favoriteActive: boolean;
  queue: MusicTrackSummary[];
  parsedLyrics: LyricLine[];
  activeLyricIndex: number;
  currentTime: number;
  duration: number;
  sliderValue: number;
  volume: number;
}>();

const emit = defineEmits<{
  (e: "prev"): void;
  (e: "toggle"): void;
  (e: "next"): void;
  (e: "toggle-favorite"): void;
  (e: "seek", value: number): void;
  (e: "update-volume", value: number): void;
  (e: "play-track", track: MusicTrackSummary, queue: MusicTrackSummary[]): void;
}>();

const lyricsBodyRef = ref<HTMLDivElement>();

watch(
  () => props.activeLyricIndex,
  async (index) => {
    if (index < 0) return;
    await nextTick();
    const activeLine = lyricsBodyRef.value?.querySelector<HTMLElement>(
      `[data-lyric-index="${index}"]`,
    );
    activeLine?.scrollIntoView({
      block: "center",
      behavior: props.isPlaying ? "smooth" : "auto",
    });
  },
);

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatClock(seconds: number) {
  return formatDuration(Number.isFinite(seconds) ? seconds : 0);
}
</script>

<style scoped lang="scss">
.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.now-playing,
.meter-card,
.lyric-card,
.queue-card {
  border: 1px solid rgba(20, 32, 42, 0.12);
  border-radius: 28px;
  background: rgba(255, 252, 245, 0.88);
  box-shadow: 0 18px 40px rgba(17, 25, 32, 0.08);
  backdrop-filter: blur(16px);
}

.now-playing {
  padding: 20px;
  background: linear-gradient(180deg, rgba(16, 25, 31, 0.96), rgba(28, 47, 58, 0.94));
  color: #f7efe0;
}

.meter-card,
.lyric-card,
.queue-card {
  padding: 18px;
}

.cover-frame {
  width: 100%;
  max-width: 220px;
  margin: 0 auto;
}

.cover-frame img {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 24px;
  object-fit: cover;
}

.focus-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.track-focus {
  margin-top: 18px;
  text-align: center;
}

.track-focus h3 {
  margin: 0;
  line-height: 1.05;
}

.track-focus span,
.section-meta,
.time-row,
.queue-item span,
.lyric-empty {
  color: #5f6a70;
}

.control-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.control-btn,
.queue-item {
  border: 0;
  cursor: pointer;
  transition: all 0.18s ease;
}

.control-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  color: #f7efe0;
}

.control-btn.major {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(188, 127, 79, 0.92), rgba(222, 165, 103, 0.94));
  color: #1b1714;
}

.control-btn.marked {
  background: rgba(188, 127, 79, 0.3);
}

.section-head,
.time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lyrics-body,
.queue-list {
  margin-top: 12px;
  max-height: 280px;
  overflow: auto;
}

.lyrics-body p,
.lyric-empty {
  margin: 0 0 10px;
  line-height: 1.5;
}

.lyrics-body p.active {
  color: #14202a;
  font-weight: 700;
}

.queue-item {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 16px;
  text-align: left;
  background: rgba(255, 255, 255, 0.7);
}

.queue-item strong,
.queue-item span {
  display: block;
}

.queue-item.active {
  background: linear-gradient(135deg, rgba(188, 127, 79, 0.16), rgba(47, 93, 115, 0.15));
  box-shadow: inset 0 0 0 1px rgba(47, 93, 115, 0.22);
}
</style>
