<template>
  <ScOverlayPage
    :model-value="true"
    title="正在播放"
    :subtitle="`${currentTrack.artist} · ${currentTrack.album}`"
    eyebrow="Now Playing"
    theme="music"
    @update:model-value="!$event && emit('close')"
  >
    <section class="detail-stage">
      <div class="detail-art">
        <div class="record-shell" :class="{ spinning: isPlaying }">
          <img :src="currentTrack.coverUrl" :alt="currentTrack.title" />
        </div>

        <div class="detail-meta">
          <p>{{ currentTrack.artist }}</p>
          <h2>{{ currentTrack.title }}</h2>
          <span>{{ currentTrack.album }}</span>
          <small v-if="currentTrack.playCount || currentTrack.commentCount">
            <em v-if="currentTrack.playCount">{{ formatCount(currentTrack.playCount) }} 播放</em>
            <em v-if="currentTrack.commentCount">{{ formatCount(currentTrack.commentCount) }} 评论</em>
          </small>
        </div>
      </div>

      <div class="detail-lyrics">
        <div class="lyrics-head">
          <div>
            <p>歌词</p>
            <h3>逐句同步</h3>
          </div>

          <button class="favorite-btn" :class="{ active: favoriteActive }" @click="emit('toggle-favorite')">
            {{ favoriteActive ? "已喜欢" : "喜欢" }}
          </button>
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
          <p v-if="!parsedLyrics.length" class="lyric-empty">当前歌曲没有歌词。</p>
        </div>

        <div v-if="currentTrack.comments?.length" class="comment-panel">
          <div class="lyrics-head">
            <div>
              <p>评论</p>
              <h3>热门评论</h3>
            </div>
          </div>

          <div class="comment-list">
            <article
              v-for="comment in currentTrack.comments"
              :key="comment.commentId"
              class="comment-item"
            >
              <img v-if="comment.avatar" :src="comment.avatar" :alt="comment.author" />
              <div>
                <strong>{{ comment.author }}</strong>
                <p>{{ comment.content }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </ScOverlayPage>
</template>

<script setup lang="ts">
import ScOverlayPage from "@repo/components/ScOverlayPage";
import { nextTick, ref, watch } from "vue";
import type { MusicLoopMode, MusicTrackDetail } from "../types";

interface LyricLine {
  time: number;
  text: string;
}

const props = defineProps<{
  isPlaying: boolean;
  currentTrack: MusicTrackDetail;
  favoriteActive: boolean;
  parsedLyrics: LyricLine[];
  activeLyricIndex: number;
  currentTime: number;
  duration: number;
  sliderValue: number;
  volume: number;
  loopMode: MusicLoopMode;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "toggle-favorite"): void;
}>();

const lyricsBodyRef = ref<HTMLDivElement>();

watch(
  () => props.activeLyricIndex,
  async index => {
    if (index < 0) return;
    await nextTick();
    const activeLine = lyricsBodyRef.value?.querySelector<HTMLElement>(
      `[data-lyric-index="${index}"]`
    );
    activeLine?.scrollIntoView({
      block: "center",
      behavior: "smooth"
    });
  }
);

function formatCount(value?: number) {
  if (!value) return "0";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return `${value}`;
}
</script>

<style scoped lang="scss">
.detail-stage {
  display: grid;
  grid-template-columns: minmax(320px, 440px) minmax(0, 1fr);
  gap: 36px;
  min-height: calc(100vh - 220px);
  align-items: center;
}

.detail-art {
  display: grid;
  gap: 28px;
  justify-items: center;
}

.record-shell {
  width: min(380px, 78vw);
  aspect-ratio: 1 / 1;
  border-radius: 42px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 50% 44%, rgba(255, 225, 170, 0.18), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  box-shadow: 0 34px 88px rgba(0, 0, 0, 0.28);
}

.record-shell img {
  width: 72%;
  height: 72%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow:
    0 0 0 22px rgba(255, 255, 255, 0.08),
    0 0 0 58px rgba(255, 255, 255, 0.03);
}

.record-shell.spinning img {
  animation: spin 9s linear infinite;
}

.detail-meta {
  text-align: center;
  color: rgba(255, 238, 219, 0.76);
}

.detail-meta p,
.detail-meta span,
.detail-meta small {
  margin: 0;
}

.detail-meta h2 {
  margin: 8px 0;
  color: #fff8ef;
  font-size: 36px;
}

.detail-meta small {
  display: inline-flex;
  gap: 14px;
  margin-top: 14px;
  color: rgba(255, 234, 214, 0.68);
}

.detail-meta em {
  font-style: normal;
}

.detail-lyrics {
  display: grid;
  gap: 18px;
  min-height: 0;
  border: 1px solid rgba(255, 239, 225, 0.08);
  border-radius: 32px;
  background: linear-gradient(180deg, rgba(74, 31, 29, 0.74), rgba(50, 18, 18, 0.82));
  box-shadow: 0 24px 56px rgba(15, 6, 8, 0.2);
  padding: 22px 24px;
  backdrop-filter: blur(18px);
}

.lyrics-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lyrics-head p {
  margin: 0;
  color: rgba(255, 213, 175, 0.72);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.lyrics-head h3 {
  margin: 6px 0 0;
  color: #fff7ee;
  font-size: 28px;
}

.favorite-btn {
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff3e5;
  cursor: pointer;
  padding: 10px 18px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.favorite-btn.active {
  background: rgba(241, 187, 103, 0.18);
  color: var(--music-accent);
}

.lyrics-body {
  min-height: 0;
  max-height: 48vh;
  overflow: auto;
  padding-right: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  padding: 16px 18px 16px 0;
}

.lyrics-body p {
  margin: 0 0 14px;
  color: rgba(255, 236, 221, 0.54);
  font-size: 18px;
  line-height: 1.7;
}

.lyrics-body p.active {
  color: #fff8ef;
  font-size: 24px;
  font-weight: 700;
}

.lyric-empty {
  color: rgba(255, 236, 221, 0.54);
}


.comment-panel {
  display: grid;
  gap: 14px;
}

.comment-list {
  display: grid;
  gap: 12px;
}

.comment-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  padding: 14px;
}

.comment-item img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-item strong {
  color: #fff8ef;
}

.comment-item p {
  margin: 6px 0 0;
  color: rgba(255, 236, 221, 0.72);
  line-height: 1.7;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .detail-stage {
    grid-template-columns: 1fr;
    align-content: start;
  }

  .lyrics-body {
    max-height: none;
  }
}
</style>
