<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';
import DiscoverView from './content/DiscoverView.vue';
import SearchResultView from './content/SearchResultView.vue';
import FavoritesView from './content/FavoritesView.vue';
import HistoryView from './content/HistoryView.vue';
import PlaylistDetailView from './content/PlaylistDetailView.vue';

defineProps({
  env: Object,
  playMusic: Function,
  toggleFavorite: Function,
  isFavorite: Function,
  loadPlaylistDetail: Function,
  playPlaylist: Function,
  formatTime: Function
});
</script>

<template>
  <div class="music-content">
    <component 
      :is="env.activeTab === 'discover' ? DiscoverView : 
           env.activeTab === 'search' ? SearchResultView :
           env.activeTab === 'favorites' ? FavoritesView :
           env.activeTab === 'history' ? HistoryView :
           env.activeTab === 'playlist-detail' ? PlaylistDetailView : null"
      v-bind="$props"
    />
  </div>
</template>

<style lang="scss" scoped>
.music-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--el-bg-color);
  
  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--el-bg-color-page);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 4px;
    
    &:hover {
      background: var(--el-border-color-darker);
    }
  }
}
</style>