<script setup>
import { computed, inject } from "vue";
import { useRouter } from "vue-router";

// 获取共享状态
const videoStore = inject("videoStore");
const router = useRouter();

// 定义事件
const emit = defineEmits(["back-to-search"]);

// 返回搜索页
const backToSearch = () => {
  emit("back-to-search");
};

// 切换排序方式
const changeSort = (sort) => {
  videoStore.filters.sort = sort;
  videoStore.search();
};

// 切换页码
const changePage = (page) => {
  videoStore.currentPage = page;
  videoStore.search();
};

// 格式化筛选条件显示
const formatFilters = computed(() => {
  const filters = [];

  // 添加分类
  if (videoStore.filters.category && videoStore.filters.category.length > 0) {
    const categoryNames = videoStore.filters.category.map((id) => {
      const category = videoStore.categories.find((c) => c.id === id);
      return category ? category.name : id;
    });
    filters.push(`分类: ${categoryNames.join(", ")}`);
  }

  // 添加年代
  if (videoStore.filters.year && videoStore.filters.year.length > 0) {
    const yearNames = videoStore.filters.year.map((id) => {
      const year = videoStore.years.find((y) => y.id === id);
      return year ? year.name : id;
    });
    filters.push(`年代: ${yearNames.join(", ")}`);
  }

  // 添加地区
  if (videoStore.filters.region && videoStore.filters.region.length > 0) {
    const regionNames = videoStore.filters.region.map((id) => {
      const region = videoStore.regions.find((r) => r.id === id);
      return region ? region.name : id;
    });
    filters.push(`地区: ${regionNames.join(", ")}`);
  }

  // 添加语言
  if (videoStore.filters.language && videoStore.filters.language.length > 0) {
    const languageNames = videoStore.filters.language.map((id) => {
      const language = videoStore.languages.find((l) => l.id === id);
      return language ? language.name : id;
    });
    filters.push(`语言: ${languageNames.join(", ")}`);
  }

  return filters.length > 0 ? filters.join(" | ") : "全部视频";
});

// 获取当前排序名称
const currentSortName = computed(() => {
  const sort = videoStore.sortOptions.find((s) => s.id === videoStore.filters.sort);
  return sort ? sort.name : "最新上线";
});

// 查看视频详情
const viewVideoDetail = (videoId) => {
  router.push({
    name: "VideoDetail",
    params: { id: videoId },
  });
};
</script>

<template>
  <div class="results-page">
    <div class="results-header">
      <div class="header-left">
        <h2 class="results-title">搜索结果</h2>
      </div>
    </div>

    <div class="results-toolbar">
      <div class="sort-options">
        <span class="sort-label">排序: </span>
        <el-radio-group v-model="videoStore.filters.sort" @change="changeSort">
          <el-radio-button v-for="option in videoStore.sortOptions" :key="option.id" :label="option.id">
            {{ option.name }}
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="results-count">
        共找到 <span class="count-highlight">{{ videoStore.totalResults }}</span> 个结果
      </div>
    </div>
    <div v-if="videoStore.loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="videoStore.searchResults.length === 0" class="no-results">
      <i class="el-icon-warning-outline"></i>
      <p>没有找到符合条件的视频，请尝试修改筛选条件</p>
    </div>

    <div v-else class="results-grid">
      <div v-for="video in videoStore.searchResults" :key="video.id" class="video-card" @click="viewVideoDetail(video.id)">
        <div class="video-cover">
          <img :src="video.cover" :alt="video.title" class="cover-image" />
          <div class="video-info-overlay">
            <span class="video-rating"> <i class="el-icon-star-on"></i> {{ video.rating }} </span>
            <span class="video-duration">{{ video.duration }}</span>
          </div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <div class="video-meta">
            <span class="video-year">{{ video.year }}</span>
            <span class="video-type">{{ videoStore.categories.find((c) => c.id === video.type)?.name }}</span>
            <span class="video-region">{{ videoStore.regions.find((r) => r.id === video.region)?.name }}</span>
          </div>
          <div class="video-views"><i class="el-icon-view"></i> {{ videoStore.formatNumber(video.views) }}次播放</div>
        </div>
      </div>
    </div>

    <div class="pagination-container" v-if="videoStore.searchResults.length > 0">
      <el-pagination background layout="prev, pager, next" :total="videoStore.totalResults" :page-size="videoStore.pageSize" :current-page="videoStore.currentPage" @current-change="changePage" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.results-page {
  padding: 40px 20px;
  background: linear-gradient(135deg, #f6f9fc 0%, #e3eeff 100%);
}

.results-header {
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    margin-bottom: 10px;

    .back-button {
      font-size: 14px;
      margin-right: 15px;

      i {
        margin-right: 4px;
      }
    }

    .results-title {
      font-size: 22px;
      margin: 0;
      color: #333;
    }
  }

  .filter-summary {
    display: flex;
    align-items: center;

    .filter-text {
      font-size: 14px;
      color: #666;
      margin-right: 10px;
    }

    .edit-filter {
      font-size: 14px;
      color: #ff6700;
    }
  }
}

.results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .sort-options {
    display: flex;
    align-items: center;

    .sort-label {
      margin-right: 10px;
      font-size: 14px;
      color: #666;
    }
  }

  .results-count {
    font-size: 14px;
    color: #666;

    .count-highlight {
      color: #ff6700;
      font-weight: bold;
    }
  }
}

.loading-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  i {
    font-size: 48px;
    color: #ff6700;
    margin-bottom: 20px;
  }

  p {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
  }
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  .video-card {
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    transition:
      transform 0.3s ease,
      box-shadow 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .video-cover {
      position: relative;
      width: 100%;
      padding-top: 140%; // 10:14 比例
      overflow: hidden;

      .cover-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      &:hover .cover-image {
        transform: scale(1.05);
      }

      .video-info-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        padding: 8px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        color: #fff;
        font-size: 12px;

        .video-rating {
          display: flex;
          align-items: center;

          i {
            color: #ffcc00;
            margin-right: 3px;
          }
        }
      }
    }

    .video-info {
      padding: 12px;

      .video-title {
        font-size: 14px;
        margin: 0 0 8px;
        color: #333;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .video-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #666;
      }

      .video-views {
        font-size: 12px;
        color: #999;

        i {
          margin-right: 3px;
        }
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  margin-bottom: 20px;
}
</style>
