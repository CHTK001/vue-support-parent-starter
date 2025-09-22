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
  padding: 20px;
  background: linear-gradient(to right, var(--app-primary-lighter), var(--app-primary-lightest));
  border-radius: 8px;
  margin-bottom: 20px;

  &__content {
    margin-bottom: 20px;
  }

  &__title {
    font-size: 24px;
    margin: 0 0 8px;
    color: var(--app-primary-dark);
  }

  &__subtitle {
    font-size: 14px;
    margin: 0;
    color: var(--app-text-secondary);
  }

  &__search {
    margin-bottom: 20px;

    &-input {
      width: 100%;
    }
  }

  &__search-help {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  &__section-title {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--app-text-secondary);

    .iconify {
      margin-right: 5px;
    }
  }

  &__keyword-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__keyword {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
  }
}
</style>
