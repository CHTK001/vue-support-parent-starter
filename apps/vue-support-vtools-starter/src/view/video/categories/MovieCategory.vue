<template>
  <div class="video-movie">
    <!-- 上方筛选区域 -->
    <VideoFilter v-model="filterConditions" :autoSearch="true" @filter-change="handleFilterChange" />

    <!-- 下方结果区域 -->
    <VideoResults :params="queryParams" :url="getVideoList" @sort-change="handleSortChange" @video-click="handleVideoClick" ref="tableRef" />
  </div>
</template>

<script setup lang="ts">
import VideoFilter from "@/view/video/components/VideoFilter.vue";
import VideoResults from "@/view/video/components/VideoResults.vue";
import { computed, ref } from "vue";
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
    category: "mv",
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
</script>

<style lang="scss" scoped>
.video-movie {
  margin-bottom: 24px;
}
</style>
