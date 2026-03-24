<template>
  <div class="online-finder">
    <ScPopover placement="bottom-start" :width="600" trigger="click" v-model:visible="popoverVisible" :popper-style="{ padding: '12px 0', maxHeight: '80vh', overflow: 'auto' }">
      <template #reference>
        <ScButton type="primary" size="small" :loading="loading">
          <IconifyIconOnline icon="ep:search" />
          搜索资源
        </ScButton>
      </template>

      <!-- 搜索表单 -->
      <div class="search-form p-3">
        <ScInput v-model="searchKeyword" placeholder="输入视频名称" clearable @keyup.enter="handleSearch" class="mb-3">
          <template #append>
            <ScButton @click="handleSearch" :loading="loading">
              <IconifyIconOnline icon="ep:search" />
            </ScButton>
          </template>
        </ScInput>

        <div v-if="loading" class="text-center py-5">
          <div class="loading-icon-wrapper">
            <IconifyIconOnline icon="ep:loading" class="loading-icon" />
          </div>
          <div class="mt-2 text-gray-400">正在搜索资源...</div>
        </div>

        <div v-else-if="!loading && searchResults.length === 0 && hasSearched" class="empty-result-container">
          <div class="empty-result-content">
            <IconifyIconOnline icon="ep:video-camera" class="empty-icon" />
            <div class="empty-text">未找到相关视频资源</div>
          </div>
        </div>

        <!-- 搜索结果列表 -->
        <div v-else-if="!loading && searchResults.length > 0">
          <div class="search-results">
            <div v-for="(item, index) in searchResults" :key="index" class="result-item" @click="handleSelectItem(item)">
              <div class="result-cover">
                <ScImage v-if="item.videoCover" referrerpolicy="no-referrer" :src="item.videoCover" fit="cover" class="w-full h-full">
                  <template #error>
                    <div class="image-placeholder">
                      <IconifyIconOnline icon="ep:picture" />
                    </div>
                  </template>
                </ScImage>
                <div v-else class="image-placeholder">
                  <IconifyIconOnline icon="ep:picture" />
                </div>
                <div v-if="item.videoScore" class="score-badge">{{ item.videoScore }}分</div>
              </div>
              <div class="result-info">
                <div class="result-title">{{ item.videoTitle || item.videoName }}</div>
                <div class="result-meta">
                  <span v-if="item.videoYear">{{ item.videoYear }}年</span>
                  <span v-if="item.videoDistrict">{{ item.videoDistrict }}</span>
                  <span v-if="item.videoDirector">导演: {{ item.videoDirector }}</span>
                </div>
                <div class="result-actors" v-if="item.videoActor">主演: {{ item.videoActor }}</div>
                <div class="flex items-center mt-1">
                  <ScTag size="small" v-if="item.videoType">{{ item.videoType }}</ScTag>
                  <ScTag size="small" type="success" v-if="item.videoQuality" class="ml-2">{{ item.videoQuality }}</ScTag>
                </div>
              </div>
            </div>
          </div>
          <div class="pagination-container text-center mt-3">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20]" :background="true" layout="prev, pager, next, sizes, total" :total="totalResults" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          </div>
        </div>
      </div>
    </ScPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { findOnlineResources } from "../../../../api/online";
import { message } from "@repo/utils";
import type { VideoItem } from "../../../../types/video";

const props = defineProps<{
  keyword?: string;
}>();

const emit = defineEmits<{
  (e: "select", video: VideoItem): void;
}>();

// 搜索相关状态
const popoverVisible = ref(false);
const searchKeyword = ref("怪猴");
const loading = ref(false);
const hasSearched = ref(false);
const searchResults = ref<VideoItem[]>([]);
const totalResults = ref(0);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(5);

// 监听父组件传入的关键词
watch(
  () => props.keyword,
  (newVal) => {
    if (newVal) {
      searchKeyword.value = newVal;
    }
  },
  { immediate: true }
);

// 查找在线资源
const findResources = () => {
  if (!searchKeyword.value.trim()) {
    message("请输入搜索关键词", { type: "warning" });
    return;
  }

  loading.value = true;
  hasSearched.value = true;

  findOnlineResources({
    videoName: searchKeyword.value,
  })
    .then((res) => {
      searchResults.value = res.data || [];
      totalResults.value = res.headers?.total || 0;
      loading.value = false;
    })
    .catch((error) => {
      console.error("搜索视频资源出错:", error);
      message("搜索服务异常", { type: "error" });
      searchResults.value = [];
      loading.value = false;
    });
};

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  findResources();
};

// 处理分页大小变化
const handleSizeChange = () => {
  findResources();
};

// 处理页码变化
const handleCurrentChange = () => {
  findResources();
};

// 处理选择视频
const handleSelectItem = (item: VideoItem) => {
  emit("select", item);
  popoverVisible.value = false;
};
</script>

<style scoped>
.search-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
}

.result-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}

.result-cover {
  width: 100px;
  height: 140px;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.score-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #f7ba2a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.result-info {
  flex: 1;
  padding: 12px;
  overflow: hidden;
}

.result-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 6px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.result-meta span {
  margin-right: 8px;
}

.result-actors {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 加载动画样式 */
.loading-icon-wrapper {
  display: inline-block;
}

.loading-icon {
  font-size: 1.875rem; /* 30px */
  animation: loadingRotate 1.5s linear infinite;
}

@keyframes loadingRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 工具类 */
.p-3 {
  padding: 12px;
}

.mb-3 {
  margin-bottom: 12px;
}

.py-5 {
  padding-top: 20px;
  padding-bottom: 20px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.text-center {
  text-align: center;
}

.text-3xl {
  font-size: 1.875rem; /* 30px */
}

.text-4xl {
  font-size: 2.25rem; /* 36px */
}

.text-gray-400 {
  color: var(--el-text-color-secondary);
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

/* 空结果容器 */
.empty-result-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 180px;
  width: 100%;
}

.empty-result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 2.25rem; /* 36px */
  color: var(--el-text-color-secondary);
  margin-bottom: 0.5rem; /* 8px */
}

.empty-text {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
