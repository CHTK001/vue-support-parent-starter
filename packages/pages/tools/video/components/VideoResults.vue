<script setup>
import { defineProps } from 'vue';
import VideoCard from './VideoCard.vue';

defineProps({
  videos: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  keyword: {
    type: String,
    default: ''
  },
  totalResults: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  formatNumber: {
    type: Function,
    required: true
  },
  openVideoLink: {
    type: Function,
    required: true
  },
  changePage: {
    type: Function,
    required: true
  }
});
</script>

<template>
  <div class="video-results">
    <!-- 结果标题 -->
    <div class="video-results__header" v-if="videos.length > 0">
      <h2 class="video-results__title">
        搜索结果: <span class="video-results__keyword">{{ keyword }}</span>
      </h2>
      <div class="video-results__count">共 {{ totalResults }} 条结果</div>
    </div>

    <!-- 加载中 -->
    <div class="video-results__loading" v-if="loading">
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 结果列表 -->
    <div class="video-results__grid" v-else-if="videos.length > 0">
      <div v-for="video in videos" :key="video.monitorVideoId" class="video-results__grid-item">
        <VideoCard 
          :video="video" 
          :formatNumber="formatNumber" 
          :openVideoLink="openVideoLink" 
        />
      </div>
    </div>

    <!-- 无结果提示 -->
    <div class="video-results__empty" v-else-if="keyword && !loading">
      <IconifyIconOnline icon="ri:search-eye-line" class="video-results__empty-icon" />
      <div class="video-results__empty-text">未找到与 "{{ keyword }}" 相关的视频</div>
      <div class="video-results__empty-tips">
        <p>建议：</p>
        <ul>
          <li>检查您的拼写</li>
          <li>尝试使用更通用的关键词</li>
          <li>尝试使用不同的视频类型或平台</li>
        </ul>
      </div>
    </div>

    <!-- 分页 -->
    <div class="video-results__pagination" v-if="videos.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="totalResults"
        @current-change="changePage"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.video-results {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  &__keyword {
    color: var(--el-color-primary);
  }

  &__count {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  &__grid-item {
    height: 100%;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 0;
    text-align: center;
  }

  &__empty-icon {
    font-size: 60px;
    color: var(--el-color-info-light-5);
    margin-bottom: 20px;
  }

  &__empty-text {
    font-size: 18px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-bottom: 15px;
  }

  &__empty-tips {
    color: var(--el-text-color-secondary);
    text-align: left;

    p {
      margin-bottom: 5px;
    }

    ul {
      padding-left: 20px;
    }

    li {
      margin-bottom: 5px;
    }
  }

  &__pagination {
    display: flex;
    justify-content: center;
    margin-top: 30px;
  }
}
</style>