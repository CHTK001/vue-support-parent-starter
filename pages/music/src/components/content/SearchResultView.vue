<script setup lang="ts">
import { IconifyIconOnline } from '@iconify/vue';

defineProps({
  env: Object,
  playMusic: Function,
  toggleFavorite: Function,
  isFavorite: Function,
});
</script>

<template>
  <div class="search-result-view">
    <!-- 筛选条件 -->
    <div class="search-result-view__filters">
      <div class="search-result-view__filter-group">
        <span class="search-result-view__filter-label">音乐类型:</span>
        <el-radio-group v-model="env.selectedType" size="small">
          <el-radio-button v-for="type in env.musicTypes" :key="type.musicId" :label="type.musicId">
            {{ type.musicName }}
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="search-result-view__filter-group">
        <span class="search-result-view__filter-label">音乐平台:</span>
        <el-radio-group v-model="env.selectedPlatform" size="small">
          <el-radio-button v-for="platform in env.musicPlatforms" :key="platform.musicId" :label="platform.musicId">
            {{ platform.musicName }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div class="search-result-view__results" v-if="env.searchResults.length">
      <div class="search-result-view__results-header">
        <h2 class="search-result-view__results-title">
          搜索结果: <span class="search-result-view__keyword">{{ env.keyword }}</span>
        </h2>
        <div class="search-result-view__results-count">共 {{ env.searchTotal }} 条结果</div>
      </div>

      <!-- 搜索结果列表 -->
      <div class="search-result-view__music-grid">
        <div
          v-for="music in env.searchResults"
          :key="music.musicId"
          class="search-result-view__music-card"
          :class="{ 'search-result-view__music-card--active': env.currentMusic?.musicId === music.musicId }"
        >
          <div class="search-result-view__music-cover" @click="playMusic(music)">
            <img :src="music.musicCover" :alt="music.musicTitle" />
            <div class="search-result-view__music-play">
              <IconifyIconOnline :icon="env.currentMusic?.musicId === music.musicId && env.isPlaying ? 'ri:pause-fill' : 'ri:play-fill'" />
            </div>
          </div>
          <div class="search-result-view__music-info">
            <div class="search-result-view__music-title" @click="playMusic(music)">{{ music.musicTitle }}</div>
            <div class="search-result-view__music-artist">{{ music.musicArtist }}</div>
            <div class="search-result-view__music-meta">
              <span class="search-result-view__music-platform">{{ music.musicPlatform }}</span>
              <span class="search-result-view__music-type">{{ music.musicType }}</span>
            </div>
          </div>
          <div class="search-result-view__music-actions">
            <el-button
              circle
              size="small"
              :type="isFavorite(music) ? 'danger' : 'default'"
              @click="toggleFavorite(music)"
            >
              <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="search-result-view__pagination">
        <el-pagination
          v-model:current-page="env.currentPage"
          :page-size="env.pageSize"
          layout="prev, pager, next"
          :total="env.searchTotal"
          @current-change="searchMusic"
        />
      </div>
    </div>

    <!-- 无结果提示 -->
    <div class="search-result-view__empty" v-else-if="env.keyword && !env.searchLoading">
      <IconifyIconOnline icon="ri:search-eye-line" class="search-result-view__empty-icon" />
      <div class="search-result-view__empty-text">未找到与 "{{ env.keyword }}" 相关的音乐</div>
      <div class="search-result-view__empty-tips">
        <p>建议：</p>
        <ul>
          <li>检查您的拼写</li>
          <li>尝试使用更通用的关键词</li>
          <li>尝试使用歌手名或专辑名搜索</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-result-view {
  &__filters {
    margin-bottom: 20px;
    padding: 15px;
    background-color: var(--app-bg-primary);
    border-radius: 8px;
  }
  
  &__filter-group {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__filter-label {
    margin-right: 10px;
    font-size: 14px;
    color: var(--app-text-secondary);
    width: 80px;
  }
  
  &__title {
    font-size: 20px;
    margin-bottom: 20px;
    font-weight: 500;
  }
  
  &__result-count {
    font-size: 14px;
    color: var(--app-text-secondary);
    font-weight: normal;
  }
  
  &__music-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
  
  &__music-card {
    background-color: var(--app-bg-overlay);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--app-shadow-sm);
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: var(--app-shadow-sm);
      
      .search-result-view__music-play {
        opacity: 1;
      }
    }
  }
  
  &__music-cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    overflow: hidden;
    cursor: pointer;
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  &__music-play {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--app-shadow);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.3s;
    
    .iconify {
      font-size: 40px;
      color: var(--app-text-primary);
    }
  }
  
  &__music-info {
    padding: 12px;
  }
  
  &__music-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__music-artist {
    font-size: 12px;
    color: var(--app-text-secondary);
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__music-meta {
    display: flex;
    gap: 5px;
  }
  
  &__music-platform,
  &__music-type {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background-color: var(--app-primary-lightest);
    color: var(--app-primary);
  }
  
  &__music-actions {
    display: flex;
    justify-content: space-between;
    padding: 0 12px 12px;
  }
  
  &__pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
  }
}
</style>
