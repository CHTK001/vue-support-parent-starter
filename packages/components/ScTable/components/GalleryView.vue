<!--
 * GalleryView 画廊/相册布局视图
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <div class="sc-table-gallery" :style="{ height: height }">
    <!-- 画廊容器 -->
    <div v-if="tableData.length > 0" class="gallery-container" :style="containerStyle">
      <div
        v-for="(item, index) in tableData"
        :key="item[rowKey] || index"
        class="gallery-item"
        :class="{ 'is-selected': selectedItems.includes(item[rowKey] || index) }"
        @click="handleItemClick(item, index)"
      >
        <!-- 序号徽章 -->
        <div v-if="showIndex" class="gallery-index-badge">{{ index + 1 }}</div>

        <!-- 自定义内容 -->
        <slot :row="item" :index="index">
          <!-- 图片区域 -->
          <div class="gallery-image">
            <el-image :src="getImageUrl(item)" :preview-src-list="previewable ? getPreviewList() : []" :initial-index="index" fit="cover" lazy>
              <template #error>
                <div class="image-error">
                  <IconifyIconOnline icon="ep:picture" />
                </div>
              </template>
              <template #placeholder>
                <div class="image-loading">
                  <IconifyIconOnline icon="ep:loading" class="is-loading" />
                </div>
              </template>
            </el-image>

            <!-- 悬浮遮罩 -->
            <div class="gallery-overlay">
              <div class="overlay-actions">
                <el-button v-if="previewable" circle size="small" @click.stop="handlePreview(item, index)">
                  <IconifyIconOnline icon="ep:zoom-in" />
                </el-button>
                <el-button v-if="downloadable" circle size="small" @click.stop="handleDownload(item)">
                  <IconifyIconOnline icon="ep:download" />
                </el-button>
                <slot name="actions" :row="item" :index="index" />
              </div>
            </div>

            <!-- 选择框 -->
            <div v-if="selectable" class="gallery-checkbox" @click.stop>
              <el-checkbox v-model="selectedItems" :value="item[rowKey] || index" />
            </div>
          </div>

          <!-- 信息区域 -->
          <div v-if="showInfo" class="gallery-info">
            <div class="gallery-title" :title="getTitle(item)">{{ getTitle(item) }}</div>
            <div v-if="getDesc(item)" class="gallery-desc">{{ getDesc(item) }}</div>
          </div>
        </slot>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="gallery-empty">
      <slot name="empty">
        <el-empty :description="emptyText" :image-size="100" />
      </slot>
    </div>

    <!-- 加载更多 -->
    <div v-if="paginationType === 'scroll' && tableData.length > 0" class="gallery-load-more">
      <el-button v-if="hasMore" :loading="loading" type="primary" link @click="$emit('load-more')">加载更多</el-button>
      <span v-else class="no-more">没有更多了</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

defineOptions({
  name: "GalleryView"
});

const props = defineProps({
  tableData: { type: Array, default: () => [] },
  userColumn: { type: Array, default: () => [] },
  rowKey: { type: String, default: "id" },
  height: { type: [String, Number], default: "auto" },
  emptyText: { type: String, default: "暂无数据" },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  paginationType: { type: String, default: "default" },
  colSize: { type: Number, default: 4 },
  gap: { type: Number, default: 16 },
  // 画廊特有配置
  imageField: { type: String, default: "image" },
  titleField: { type: String, default: "title" },
  descField: { type: String, default: "desc" },
  previewable: { type: Boolean, default: true },
  downloadable: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  showInfo: { type: Boolean, default: true },
  showIndex: { type: Boolean, default: false },
  aspectRatio: { type: String, default: "1/1" }
});

const emit = defineEmits(["row-click", "load-more", "selection-change", "preview", "download"]);

const selectedItems = ref<(string | number)[]>([]);

/**
 * 容器样式
 */
const containerStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.colSize}, 1fr)`,
  gap: `${props.gap}px`
}));

/**
 * 是否有更多数据
 */
const hasMore = computed(() => {
  return props.tableData.length < props.total;
});

/**
 * 获取图片 URL
 */
function getImageUrl(item: Record<string, any>): string {
  return item[props.imageField] || "";
}

/**
 * 获取标题
 */
function getTitle(item: Record<string, any>): string {
  return item[props.titleField] || "";
}

/**
 * 获取描述
 */
function getDesc(item: Record<string, any>): string {
  return item[props.descField] || "";
}

/**
 * 获取预览列表
 */
function getPreviewList(): string[] {
  return props.tableData.map((item: any) => getImageUrl(item)).filter(Boolean);
}

/**
 * 处理项点击
 */
function handleItemClick(row: Record<string, any>, index: number): void {
  emit("row-click", row, index);
}

/**
 * 处理预览
 */
function handlePreview(row: Record<string, any>, index: number): void {
  emit("preview", row, index);
}

/**
 * 处理下载
 */
function handleDownload(row: Record<string, any>): void {
  emit("download", row);
}
</script>

<style lang="scss" scoped>
.sc-table-gallery {
  padding: 16px;
  overflow: auto;

  .gallery-container {
    display: grid;
  }

  .gallery-item {
    border-radius: 8px;
    overflow: hidden;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      .gallery-overlay {
        opacity: 1;
      }
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
    }
  }

  .gallery-image {
    position: relative;
    aspect-ratio: v-bind(aspectRatio);
    overflow: hidden;

    :deep(.el-image) {
      width: 100%;
      height: 100%;
    }

    .image-error,
    .image-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 32px;
    }

    .is-loading {
      animation: rotate 1s linear infinite;
    }
  }

  .gallery-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;

    .overlay-actions {
      display: flex;
      gap: 8px;

      .el-button {
        background: rgba(255, 255, 255, 0.9);
        border: none;

        &:hover {
          background: #fff;
        }
      }
    }
  }

  .gallery-index-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .gallery-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
  }

  .gallery-info {
    padding: 12px;

    .gallery-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gallery-desc {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .gallery-empty {
    padding: 40px;
    text-align: center;
  }

  .gallery-load-more {
    text-align: center;
    padding: 16px;
    grid-column: 1 / -1;

    .no-more {
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
