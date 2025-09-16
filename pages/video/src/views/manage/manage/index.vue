<template>
  <div class="video-manage-page">
    <!-- 条件筛选：类型/年代/地区/语言，与目标布局一致 -->
    <VideoFilter v-model="filters" :autoSearch="true" @filter-change="applyFilters" />

    <!-- 顶部工具栏：关键词搜索 -->
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="请输入关键词" class="toolbar__search" clearable @keyup.enter="applyFilters">
        <template #append>
          <el-button @click="applyFilters">
            <IconifyIconOnline icon="ep:search" />
          </el-button>
        </template>
      </el-input>
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

<style scoped>
.video-manage-page {
  padding: 24px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar__search {
  width: 360px;
}

@media (max-width: 768px) {
  .toolbar__search {
    width: 100%;
  }
}
</style>
