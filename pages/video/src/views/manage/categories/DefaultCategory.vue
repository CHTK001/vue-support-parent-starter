<template>
  <div class="video-default">
    <div class="video-default__container">
      <div class="video-default__header">
        <h2 class="video-default__title">热门推荐</h2>
        <el-button type="primary" plain size="small" @click="navigateToAll">查看全部</el-button>
      </div>

      <!-- 热门推荐视频卡片 -->
      <div class="video-default__grid">
        <div v-for="video in recommendedVideos" :key="video.videoId" class="video-default__card" @click="handleVideoClick(video)">
          <div class="video-default__cover">
            <img :src="video.videoCover || placeholderImage" :alt="video.videoName" />
            <div class="video-default__rating" v-if="video.rating">{{ video.rating }}</div>
          </div>
          <div class="video-default__info">
            <div class="video-default__name">{{ video.videoName }}</div>
            <div class="video-default__meta">{{ video.year }} · {{ video.district }}</div>
          </div>
        </div>
      </div>

      <!-- 最新上线 -->
      <div class="video-default__section">
        <div class="video-default__header">
          <h2 class="video-default__title">最新上线</h2>
          <el-button type="primary" plain size="small" @click="navigateToNew">查看全部</el-button>
        </div>

        <div class="video-default__grid">
          <div v-for="video in newVideos" :key="video.videoId" class="video-default__card" @click="handleVideoClick(video)">
            <div class="video-default__cover">
              <img :src="video.videoCover || placeholderImage" :alt="video.videoName" />
              <div class="video-default__rating" v-if="video.rating">{{ video.rating }}</div>
            </div>
            <div class="video-default__info">
              <div class="video-default__name">{{ video.videoName }}</div>
              <div class="video-default__meta">{{ video.year }} · {{ video.district }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { placeholderImage } from "@/view/video/data";
import { mockVideoResults } from "@/view/video/data/categories";
import { getVideoList } from "@/api/video";
import { message } from "@repo/utils";

const router = useRouter();
const recommendedVideos = ref([]);
const newVideos = ref([]);

/**
 * 获取推荐视频
 */
const fetchRecommendedVideos = () => {
  getVideoList({ sortBy: "recommend", pageSize: 6 })
    .then((res) => {
      if (res.code === 0 && res.data) {
        recommendedVideos.value = res.data.list || [];
      } else {
        // 使用模拟数据
        recommendedVideos.value = mockVideoResults.slice(0, 6);
      }
    })
    .catch((error) => {
      console.error("获取推荐视频失败:", error);
      // 使用模拟数据
      recommendedVideos.value = mockVideoResults.slice(0, 6);
    });
};

/**
 * 获取最新视频
 */
const fetchNewVideos = () => {
  getVideoList({ sortBy: "newest", pageSize: 6 })
    .then((res) => {
      if (res.code === 0 && res.data) {
        newVideos.value = res.data.list || [];
      } else {
        // 使用模拟数据
        newVideos.value = mockVideoResults.slice(6, 12);
      }
    })
    .catch((error) => {
      console.error("获取最新视频失败:", error);
      // 使用模拟数据
      newVideos.value = mockVideoResults.slice(6, 12);
    });
};

/**
 * 导航到全部推荐
 */
const navigateToAll = () => {
  router.push({
    path: "/video/search",
    query: {
      sortBy: "recommend",
    },
  });
};

/**
 * 导航到全部最新
 */
const navigateToNew = () => {
  router.push({
    path: "/video/search",
    query: {
      sortBy: "newest",
    },
  });
};

/**
 * 处理视频点击
 */
const handleVideoClick = (video) => {
  router.push({
    path: `/video/detail/${video.videoId}`,
  });
};

// 初始化
onMounted(() => {
  fetchNewVideos();
});
</script>

<style lang="scss" scoped>
.video-default {
  &__container {
    margin-bottom: 24px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    position: relative;
    margin: 0;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -6px;
      width: 40px;
      height: 3px;
      background-color: var(--el-color-primary);
      border-radius: 3px;
    }
  }

  &__section {
    margin-top: 40px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }

  &__card {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    height: 100%;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);

      .video-default__cover img {
        transform: scale(1.1);
      }
    }
  }

  &__cover {
    position: relative;
    height: 0;
    padding-bottom: 140%; /* 海报比例 */
    overflow: hidden;

    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
  }

  &__rating {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #f7ba2a;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    backdrop-filter: blur(4px);
    z-index: 2;
  }

  &__info {
    padding: 14px;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
  }

  &__meta {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

@media (max-width: 768px) {
  .video-default {
    &__grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 15px;
    }

    &__info {
      padding: 10px;
    }

    &__name {
      font-size: 14px;
    }

    &__meta {
      font-size: 12px;
    }
  }
}
</style>
