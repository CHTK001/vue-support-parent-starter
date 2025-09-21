<template>
  <div class="video-results">
    <div class="video-results__container">
      <div class="video-results__header">
        <div class="video-results__count">
          共找到 <span class="video-results__count-num">{{ totalResults }}</span> 个结果
        </div>
        <div class="video-results__sort">
          <el-radio-group v-model="sortValue" size="small" @change="handleSortChange">
            <el-radio-button label="recommend">推荐</el-radio-button>
            <el-radio-button label="newest">最新上线</el-radio-button>
            <el-radio-button label="videoViews desc">最多播放</el-radio-button>
            <el-radio-button label="videoScore desc">评分最高</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 使用ScTable卡片显示结果 -->
      <ScTable ref="tableRef" layout="card" :page-size="9" :col-size="6" :url="url" :params="tableParams" row-key="videoId" v-loading="loading" @data-loaded="handleDataLoaded">
        <template #default="{ row }">
          <div class="video-results__card" @click="handleVideoClick(row)">
            <div class="video-results__cover">
              <el-image referrerpolicy="no-referrer" v-if="row.videoCover" :src="row.videoCover?.split(',')?.[0]" fit="cover">
                <template #error>
                  <el-image referrerpolicy="no-referrer" v-if="row.videoCover" :src="createCompatibleImageUrl(row.videoCover?.split(',')?.[1], row.videoPlatform)" fit="cover">
                    <div class="no-cover">暂无封面</div>
                  </el-image>
                </template>
              </el-image>
              <div v-else class="video-results__no-cover">暂无封面</div>
              <div class="video-results__rating" v-if="row.videoScore">{{ row.videoScore }}分</div>
              <div class="video-results__views" v-if="row.videoViews">{{ formatViews(row.videoViews) }}次播放</div>
            </div>
            <div class="video-results__info">
              <div class="video-results__name">{{ row.videoTitle || row.videoName }}</div>
              <el-tooltip :content="`${row.videoYear || ''}年 ${row.videoDistrict || ''} ${row.videoLanguage || ''}`" placement="top">
                <div class="video-results__meta">
                  <span v-if="row.videoYear">{{ row.videoYear }}年</span><span v-if="row.videoDistrict">· {{ row.videoDistrict }}</span
                  ><span v-if="row.videoLanguage">· {{ row.videoLanguage }}</span>
                </div>
              </el-tooltip>
              <el-tooltip :content="row.videoType || '未分类'" placement="top">
                <div class="video-results__type" v-if="row.videoType">
                  <el-tag size="small" class="type-tag mx-[1px]" v-for="(item, index) in (row.videoType || '未分类')?.split(',')" :key="index">{{ item }}</el-tag>
                </div>
              </el-tooltip>
            </div>
          </div>
        </template>
      </ScTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getConfig } from "@repo/config";
import { getRandomString } from "@repo/utils";

const config = getConfig();
const ossAddress = getRandomString(config.OssAddress);
// 定义组件属性
const props = defineProps<{
  total?: number;
  sortBy?: string;
  url?: any; // 接口URL
  params?: any; // 接口参数
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: "sort-change", sort: string): void;
  (e: "video-click", video: any): void;
  (e: "data-loaded", data: any): void;
}>();

const router = useRouter();
const tableRef = ref(null);
const loading = ref(false);
const params = ref(props.params || {});
// 总结果数
const totalResults = ref(props.total || 0);

// 内部状态
const sortValue = ref(props.sortBy || "recommend");

// ScTable参数计算属性
const tableParams = computed(() => {
  return {
    ...params.value,
    videoTypes: props.params?.types,
    sortBy: sortValue.value,
    order: sortValue.value,
  };
});

// 监听props变化
watch(
  () => props.params,
  (val) => {
    if (val) params.value = val;
  },
  { immediate: true, deep: true }
);

// 监听props变化
watch(
  () => props.sortBy,
  (val) => {
    if (val) sortValue.value = val;
  },
  { immediate: true, deep: true }
);
const createCompatibleImageUrl = (videoCover, videoPlatform) => {
  if (!videoCover) {
    return null;
  }
  return ossAddress + `/video/${videoCover.replace("cover", "cover/" + videoPlatform)}`;
};

/**
 * 处理数据加载完成事件
 */
const handleDataLoaded = (data: any, total: any) => {
  if (total !== undefined) {
    totalResults.value = total;
  }
  emit("data-loaded", data);
};

/**
 * 格式化播放次数
 * @param views 播放次数
 * @returns 格式化后的字符串
 */
const formatViews = (views: number) => {
  if (views >= 10000) {
    return (views / 10000).toFixed(1) + "万";
  }
  return views.toString();
};

/**
 * 处理排序方式变化
 */
const handleSortChange = () => {
  emit("sort-change", sortValue.value);
  // 刷新表格数据
  if (tableRef.value) {
    tableRef.value.refresh();
  }
};

/**
 * 处理视频点击
 * @param video 视频对象
 */
const handleVideoClick = (video: any) => {
  emit("video-click", video);
  // 导航到详情页
  router.push(`/video/manage/detail?id=${video.videoId}`);
};

/**
 * 刷新表格数据
 * 可以被父组件调用
 */
const refresh = () => {
  if (tableRef.value) {
    nextTick(() => {
      tableRef.value.refresh();
    });
  }
};

// 暴露给父组件的方法
defineExpose({
  refresh,
});
</script>

<style lang="scss" scoped>
.video-results {
  &__container {
    background-color: var(--el-bg-color-overlay);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  &__count {
    font-size: 15px;
    color: var(--el-text-color-regular);

    &-num {
      color: var(--el-color-danger);
      font-weight: 700;
      font-size: 18px;
    }
  }

  &__sort {
    :deep(.el-radio-button__inner) {
      padding: 8px 15px;
      font-size: 14px;
    }
  }

  &__card {
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    background: var(--el-bg-color-overlay);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);

    &:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.16);

      .video-results__cover img,
      .video-results__cover .el-image {
        transform: scale(1.1);
      }
    }
  }

  &__cover {
    position: relative;
    height: 0;
    padding-bottom: 86.7%; /* 海报比例 2:3，更符合电影海报标准 */
    overflow: hidden;

    img,
    .el-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__no-cover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e0e0e0;
     color: var(--el-text-color-primary);
    font-size: 14px;
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

  &__views {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: var(--el-text-color-primary);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 13px;
    backdrop-filter: blur(4px);
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
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type {
    margin-top: 8px;
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    padding: 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;

    .el-tag {
      font-size: 11px;
      padding: 0 6px;
      height: 22px;
      border-radius: 4px;
    }
  }
}

.type-tag {
  background: linear-gradient(135deg, #e6f7ff, #c2e0ff);
  color: #1a365d;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  height: 26px;
  line-height: 26px;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.3px;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-right: 6px;
  margin-bottom: 6px;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      0 6px 12px rgba(0, 0, 0, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    background: linear-gradient(135deg, #c2e0ff, #a3d2ff);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .video-results {
    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    &__sort {
      width: 100%;
      overflow-x: auto;
    }
  }
}
</style>
