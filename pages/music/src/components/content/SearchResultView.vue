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
        <ScRadioGroup v-model="env.selectedType" size="small">
          <el-radio-button v-for="type in env.musicTypes" :key="type.musicId" :label="type.musicId">
            {{ type.musicName }}
          </el-radio-button>
        </ScRadioGroup>
      </div>
      <div class="search-result-view__filter-group">
        <span class="search-result-view__filter-label">音乐平台:</span>
        <ScRadioGroup v-model="env.selectedPlatform" size="small">
          <el-radio-button v-for="platform in env.musicPlatforms" :key="platform.musicId" :label="platform.musicId">
            {{ platform.musicName }}
          </el-radio-button>
        </ScRadioGroup>
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
            <ScButton 
              circle
              size="small"
              :type="isFavorite(music) ? 'danger' : 'default'"
              @click="toggleFavorite(music)"
            >
              <IconifyIconOnline :icon="isFavorite(music) ? 'ri:heart-fill' : 'ri:heart-line'" />
            </ScButton>
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
    margin-bottom: 24px;
    padding: 20px;
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }
  
  &__filter-group {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  &__filter-label {
    margin-right: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    width: 90px;
    flex-shrink: 0;
  }
  
  &__results {
    margin-top: 24px;
  }
  
  &__results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--el-border-color-lighter);
  }
  
  &__results-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    
    .search-result-view__keyword {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
  
  &__results-count {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
  
  &__music-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 24px;
  }
  
  &__music-card {
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);
    
    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
      border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
      
      .search-result-view__music-play {
        opacity: 1;
      }
    }
    
    &--active {
      border-color: var(--el-color-primary);
      box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
    }
  }
  
  &__music-cover {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    overflow: hidden;
    cursor: pointer;
    background: var(--el-bg-color-page);
    
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    
    &:hover img {
      transform: scale(1.1);
    }
  }
  
  &__music-play {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: color-mix(in srgb, var(--el-color-primary) 85%, transparent);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
    .iconify {
      font-size: 48px;
      color: #fff;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
    }
  }
  
  &__music-info {
    padding: 16px;
  }
  
  &__music-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
    cursor: pointer;
    transition: color 0.3s ease;
    
    &:hover {
      color: var(--el-color-primary);
    }
  }
  
  &__music-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__music-meta {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }
  
  &__music-platform,
  &__music-type {
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
    color: var(--el-color-primary);
    font-weight: 500;
  }
  
  &__music-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 16px 16px;
    
    :deep(.el-button) {
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }
  
  &__pagination {
    margin-top: 40px;
    display: flex;
    justify-content: center;
  }
  
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    
    &-icon {
      font-size: 80px;
      color: var(--el-text-color-placeholder);
      opacity: 0.5;
      margin-bottom: 20px;
    }
    
    &-text {
      font-size: 16px;
      color: var(--el-text-color-regular);
      margin-bottom: 16px;
      font-weight: 500;
    }
    
    &-tips {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      text-align: left;
      background: var(--el-bg-color-overlay);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);
      
      p {
        margin: 0 0 8px;
        font-weight: 500;
        color: var(--el-text-color-regular);
      }
      
      ul {
        margin: 0;
        padding-left: 20px;
        
        li {
          margin-bottom: 4px;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}
</style>
