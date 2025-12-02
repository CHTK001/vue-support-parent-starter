<template>
  <div class="video-movie">
    <!-- 上方筛选区域 -->
    <VideoFilter
      v-model="filterConditions"
      :autoSearch="true"
      @filter-change="handleFilterChange"
    />

    <!-- 下方结果区域 -->
    <VideoResults
      :params="queryParams"
      :sortBy="queryParams.sortBy"
      :url="getVideoList"
      @sort-change="handleSortChange"
      @video-click="handleVideoClick"
      ref="tableRef"
    />
  </div>
</template>

<script setup lang="ts">
import VideoFilter from "@/view/video/components/VideoFilter.vue";
import VideoResults from "@/view/video/components/VideoResults.vue";
import { computed, nextTick, defineExpose, ref } from "vue";
import { useRouter } from "vue-router";
import { getVideoList } from "@/api/video";
const router = useRouter();

// 筛选条件
const filterConditions = ref({
  types: ["全部"],
  years: ["全部"],
  districts: ["全部"],
  languages: ["全部"],
});

// 排序方式
const sortBy = ref("recommend");

// 表格引用
const tableRef = ref(null);

/**
 * 计算查询参数
 */
const queryParams = computed(() => {
  const params: Record<string, any> = {
    category: "TV",
    sortBy: sortBy.value,
  };

  // 添加筛选条件
  if (!filterConditions.value.types.includes("all")) {
    params.types = filterConditions.value.types.join(",");
  }

  if (!filterConditions.value.years.includes("all")) {
    params.years = filterConditions.value.years.join(",");
  }

  if (!filterConditions.value.districts.includes("all")) {
    params.districts = filterConditions.value.districts.join(",");
  }

  if (!filterConditions.value.languages.includes("all")) {
    params.languages = filterConditions.value.languages.join(",");
  }

  return params;
});

/**
 * 处理筛选条件变化
 */
const handleFilterChange = () => {
  // 筛选条件变化时刷新结果
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

/**
 * 处理排序变更
 */
const handleSortChange = (newSortBy: string) => {
  sortBy.value = newSortBy;
};

/**
 * 处理视频点击
 */
const handleVideoClick = (video: any) => {
  router.push({
    path: `/video/detail/${video.videoId}`,
  });
};

const refresh = async () => {
  if (tableRef.value) {
    await tableRef.value.refresh();
  }
};
defineExpose({
  refresh,
});
</script>

<style lang="scss" scoped>
.video-movie {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 12px;
  min-height: 100vh;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-info-rgb), 0.05) 0%,
      rgba(var(--el-color-primary-rgb), 0.05) 100%
    );
    border-radius: 12px 12px 0 0;
    pointer-events: none;
  }
}
</style>
