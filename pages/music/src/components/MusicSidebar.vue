<template>
  <aside class="nav-panel">
    <section class="profile-card">
      <div class="avatar">M</div>
      <div>
        <p class="profile-kicker">Music Space</p>
        <h2>我的音乐库</h2>
      </div>
    </section>

    <section class="menu-card">
      <button
        class="menu-item"
        :class="{ active: activeSection === 'discover' }"
        @click="emit('change-section', 'discover')"
      >
        <strong>热门推荐</strong>
        <span>热点、热门歌单</span>
      </button>
      <button
        class="menu-item"
        :class="{ active: activeSection === 'moon' }"
        @click="emit('change-section', 'moon')"
      >
        <strong>月馆</strong>
        <span>夜色精选、月下氛围</span>
      </button>
      <button
        class="menu-item"
        :class="{ active: activeSection === 'favorites' }"
        @click="emit('change-section', 'favorites')"
      >
        <strong>我的喜欢</strong>
        <span>{{ favoritesCount }} 首</span>
      </button>
      <button
        class="menu-item"
        :class="{ active: activeSection === 'history' }"
        @click="emit('change-section', 'history')"
      >
        <strong>最近播放</strong>
        <span>{{ historyCount }} 首</span>
      </button>
    </section>

    <section class="menu-card">
      <div class="section-head">
        <span>歌单速达</span>
      </div>
      <button
        v-for="playlist in featuredPlaylists.slice(0, 4)"
        :key="`${playlist.source}:${playlist.playlistId}`"
        class="playlist-shortcut"
        @click="emit('open-playlist', playlist)"
      >
        <img :src="playlist.coverUrl" :alt="playlist.title" />
        <div>
          <strong>{{ playlist.title }}</strong>
          <span>{{ playlist.author }}</span>
        </div>
      </button>
    </section>

    <section class="menu-card now-card">
      <div class="section-head">
        <span>当前播放</span>
      </div>
      <div v-if="currentTrack" class="now-track">
        <img :src="currentTrack.coverUrl" :alt="currentTrack.title" />
        <div>
          <strong>{{ currentTrack.title }}</strong>
          <span>{{ currentTrack.artist }}</span>
        </div>
      </div>
      <p v-else class="now-empty">从右侧列表点一首歌开始播放。</p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type {
  MusicPlaylistSummary,
  MusicSection,
  MusicTrackDetail,
} from "../types";

defineProps<{
  activeSection: MusicSection;
  favoritesCount: number;
  historyCount: number;
  featuredPlaylists: MusicPlaylistSummary[];
  currentTrack: MusicTrackDetail | null;
}>();

const emit = defineEmits<{
  (e: "change-section", section: MusicSection): void;
  (e: "open-playlist", playlist: MusicPlaylistSummary): void;
}>();
</script>

<style scoped lang="scss">
.nav-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 14px;
}

.profile-card,
.menu-card {
  border: 1px solid var(--music-stroke);
  border-radius: 28px;
  background: rgba(64, 28, 30, 0.72);
  box-shadow: var(--music-shadow);
  padding: 16px;
  backdrop-filter: blur(18px);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(255, 214, 145, 0.94), rgba(188, 100, 72, 0.9));
  color: #3e1e16;
  font-weight: 700;
}

.profile-kicker,
.section-head span,
.menu-item span,
.playlist-shortcut span,
.now-track span,
.now-empty {
  color: var(--music-muted);
}

.profile-kicker {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.profile-card h2 {
  margin: 0;
  font-size: 22px;
}

.menu-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item,
.playlist-shortcut {
  width: 100%;
  border: 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--music-text);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.menu-item {
  padding: 14px 16px;
  text-align: left;
}

.menu-item strong,
.menu-item span,
.playlist-shortcut strong,
.playlist-shortcut span,
.now-track strong,
.now-track span {
  display: block;
}

.menu-item.active,
.menu-item:hover,
.playlist-shortcut:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(241, 187, 103, 0.22), rgba(84, 37, 35, 0.92));
  box-shadow: inset 0 0 0 1px rgba(241, 187, 103, 0.26);
}

.playlist-shortcut {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px;
  text-align: left;
}

.playlist-shortcut img,
.now-track img {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  object-fit: cover;
}

.now-card {
  margin-top: auto;
}

.now-track {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.now-empty {
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .nav-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .now-card {
    margin-top: 0;
  }
}
</style>
