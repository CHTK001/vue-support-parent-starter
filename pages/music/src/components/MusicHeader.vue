<script setup lang="ts">
defineProps({
  env: Object,
  searchMusic: Function,
  clearSearchHistory: Function,
});
</script>

<template>
  <div class="music-header">
    <div class="music-header__content">
      <h1 class="music-header__title">音乐播放器</h1>
      <p class="music-header__subtitle">发现和享受你喜爱的音乐</p>
    </div>
    <div class="music-header__search">
      <el-input v-model="env.keyword" placeholder="搜索音乐、歌手、专辑..." class="music-header__search-input" @keyup.enter="searchMusic">
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
        <template #append>
          <el-button @click="searchMusic" :loading="env.searchLoading"> 搜索 </el-button>
        </template>
      </el-input>
    </div>

    <!-- 热门搜索和历史 -->
    <div class="music-header__search-help" v-if="!env.searchResults.length">
      <div class="music-header__hot-keywords">
        <div class="music-header__section-title">
          <IconifyIconOnline icon="ri:fire-line" />
          <span>热门搜索</span>
        </div>
        <div class="music-header__keyword-list">
          <el-tag
            v-for="keyword in env.hotKeywords"
            :key="keyword"
            class="music-header__keyword"
            @click="
              env.keyword = keyword;
              searchMusic();
            "
          >
            {{ keyword }}
          </el-tag>
        </div>
      </div>

      <div class="music-header__search-history" v-if="env.searchHistory.length">
        <div class="music-header__section-title">
          <IconifyIconOnline icon="ri:history-line" />
          <span>搜索历史</span>
          <el-button link type="danger" @click="clearSearchHistory"> 清空 </el-button>
        </div>
        <div class="music-header__keyword-list">
          <el-tag
            v-for="keyword in env.searchHistory"
            :key="keyword"
            class="music-header__keyword"
            type="info"
            @click="
              env.keyword = keyword;
              searchMusic();
            "
          >
            {{ keyword }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-header {
  padding: 24px;
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)) 0%,
    color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color)) 100%
  );
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;

  &__content {
    margin-bottom: 20px;
  }

  &__title {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 8px;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__subtitle {
    font-size: 14px;
    margin: 0;
    color: var(--el-text-color-regular);
  }

  &__search {
    margin-bottom: 20px;

    &-input {
      width: 100%;
      
      :deep(.el-input__wrapper) {
        border-radius: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
        
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  &__search-help {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__hot-keywords,
  &__search-history {
    background: var(--el-bg-color-overlay);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
  }

  &__section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-regular);

    .iconify {
      margin-right: 8px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  &__keyword-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__keyword {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 16px;
    
    &:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }
}
</style>
