<template>
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ep:video-camera" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">视频管理</h2>
          <p class="page-header-desc">管理和浏览视频资源</p>
        </div>
      </div>
    </div>

    <!-- 条件筛选：类型/年代/地区/语言，与目标布局一致 -->
    <div class="filter-section">
      <VideoFilter v-model="filters" :autoSearch="true" @filter-change="applyFilters" />
    </div>

    <!-- 顶部工具栏：关键词搜索 -->
    <div class="toolbar">
      <ScInput 
        v-model="keyword" 
        placeholder="请输入关键词搜索视频..." 
        class="toolbar__search" 
        clearable 
        @keyup.enter="applyFilters"
        size="large"
      >
        <template #prefix>
          <IconifyIconOnline icon="ep:search" />
        </template>
        <template #append>
          <ScButton type="primary" @click="applyFilters">
            <IconifyIconOnline icon="ep:search" />
            搜索
          </ScButton>
        </template>
      </ScInput>
    </div>

    <!-- 结果区：海报网格卡片，内置排序切换，与目标截图交互一致 -->
    <VideoResults ref="resultsRef" :url="getVideoList" :params="requestParams" :sort-by="sortBy" @sort-change="onSortChange" @video-click="onVideoClick" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { getVideoList } from "../../../api/video";
import VideoFilter from "../components/VideoFilter.vue";
import VideoResults from "../components/VideoResults.vue";

// 关键词
const keyword = ref("");
// 排序（与 VideoResults 内置的排序值保持一致）
const sortBy = ref("recommend");

// 筛选器双向绑定的值
const filters = reactive({
  types: ["全部"],
  years: ["全部"],
  districts: ["全部"],
  languages: ["全部"],
});

// 归一化多选（包含“全部”时返回 undefined）
const normalize = (arr: string[]) => {
  if (!arr || arr.length === 0 || arr.includes("全部")) return undefined;
  return arr.join(",");
};

// 提交到后端的查询参数
const requestParams = computed(() => ({
  keyword: keyword.value || undefined,
  videoType: normalize(filters.types),
  videoYear: normalize(filters.years),
  videoDistrict: normalize(filters.districts),
  videoLanguage: normalize(filters.languages),
  order: sortBy.value,
}));

const resultsRef = ref();
const router = useRouter();

// 触发刷新
const applyFilters = () => {
  resultsRef.value?.refresh?.();
};

const onSortChange = (val: string) => {
  sortBy.value = val;
  resultsRef.value?.refresh?.();
};

const onVideoClick = (video: any) => {
  // 进入详情
  router.push(`/video/manage/detail?id=${video.videoId}`);
};
</script>

<style scoped lang="scss">
/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.page-header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.filter-section {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.toolbar__search {
  width: 480px;
  max-width: 100%;
}

.toolbar__search :deep(.el-input__wrapper) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.toolbar__search :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);
}

.toolbar__search :deep(.el-input-group__append) {
  .el-button {
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
    transition: all 0.3s ease;
  }

  .el-button:hover {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }

  .page-header-icon {
    font-size: 36px;
  }

  .page-header-title {
    font-size: 20px;
  }

  .toolbar {
    padding: 16px;
  }

  .toolbar__search {
    width: 100%;
  }
}
</style>
