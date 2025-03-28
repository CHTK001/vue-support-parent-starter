<template>
  <div class="grid-layout-container animate__animated animate__fadeIn">
    <!-- 添加滚动容器 -->
    <div class="scrollable-container">
      <el-row :gutter="16">
        <!-- 文件网格布局 -->
        <el-col v-for="(row, index) in data" :key="row.absolutePath || index" :xs="24" :sm="12" :md="8" :lg="4" :xl="4"
          class="file-card-wrapper animate__animated animate__fadeInUp" :style="{ animationDelay: index * 0.05 + 's' }">
          <!-- 文件/文件夹卡片 -->
          <el-card :class="[row.directory ? 'folder-card' : 'file-card', 'hover-effect']"
            :body-style="{ padding: '0px' }" shadow="hover" @click="doDetail(row)">
            <!-- 文件图标 -->
            <div class="file-icon-container">
              <img class="file-icon" :src="getIcon(row.suffix)" :alt="row.filename" />
            </div>

            <!-- 文件信息 -->
            <div class="file-info">
              <!-- 文件名称 -->
              <div class="file-name" :title="row.filename">
                {{ row.filename }}
              </div>

              <!-- 文件修改时间 -->
              <div v-if="row.userMetadata.lastModified" class="file-date">
                <IconifyIconOnline icon="ep:calendar" class="info-icon" />
                {{ dateFormat(row.userMetadata.lastModified * 1) }}
              </div>

              <!-- 文件大小 -->
              <div v-if="row.suffix" class="file-size" :title="sizeFormat(row.fileSize)">
                <IconifyIconOnline icon="ep:data-line" class="info-icon" />
                {{ row.fileSize == 0 ? "0KB" : sizeFormat(row.fileSize) }}
              </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="file-actions" v-if="!row.directory">
              <!-- 复制按钮 -->
              <el-tooltip v-if="canPreview" content="复制" placement="top" :show-after="500">
                <el-button circle size="small" @click.stop="doCopy(row)"
                  class="action-button animate__animated animate__fadeIn">
                  <IconifyIconOnline icon="ep:copy-document" />
                </el-button>
              </el-tooltip>

              <!-- 下载按钮 -->
              <el-tooltip v-if="canDownload" content="下载" placement="top" :show-after="500">
                <el-button circle size="small" type="primary" @click.stop="doDownload(row)"
                  class="action-button animate__animated animate__fadeIn">
                  <IconifyIconOnline icon="ep:download" />
                </el-button>
              </el-tooltip>
            </div>

            <!-- 文件夹标识 -->
            <div v-if="row.directory" class="folder-badge">
              <IconifyIconOnline icon="ep:folder-opened" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 引入animate.css动画库 */
@import 'animate.css';

/* 网格布局容器 */
.grid-layout-container {
  height: calc(100vh - 220px);
  /* 调整高度以适应页面布局 */
  padding: 8px;
  transition: all 0.3s ease;
}

/* 滚动容器 */
.scrollable-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  /* 防止滚动条占用内容空间 */

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-primary-light-5);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-primary-light-3);
    }
  }
}

/* 文件卡片包装器 */
.file-card-wrapper {
  margin-bottom: 16px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

/* 文件卡片基础样式 */
.file-card,
.folder-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 8px;
  height: 100%;

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);

    .file-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* 文件夹卡片特殊样式 */
.folder-card {
  background-color: rgba(var(--el-color-primary-rgb), 0.05);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);
}

/* 悬停效果 */
.hover-effect {
  &:hover {
    transform: scale(1.02);
  }
}

/* 文件图标容器 */
.file-icon-container {
  display: flex;
  justify-content: center;
  padding: 16px 0 8px 0;
}

/* 文件图标 */
.file-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  transition: transform 0.3s ease;

  .file-card:hover & {
    transform: scale(1.1);
  }
}

/* 文件信息区域 */
.file-info {
  padding: 8px 16px 16px;
  text-align: center;
}

/* 文件名称 */
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* 文件日期和大小 */
.file-date,
.file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 信息图标 */
.info-icon {
  margin-right: 4px;
  font-size: 14px;
}

/* 文件操作按钮区域 */
.file-actions {
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  padding: 8px;
  gap: 8px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.9) 20%);
  opacity: 0;
  transform: translateY(100%);
  transition: all 0.3s ease;
}

/* 操作按钮 */
.action-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
  }
}

/* 文件夹标识 */
.folder-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--el-color-primary);
  font-size: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .file-card-wrapper {
    margin-bottom: 12px;
  }

  .file-icon {
    width: 48px;
    height: 48px;
  }

  .file-info {
    padding: 8px 12px 12px;
  }
}
</style>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getAssetsImages } from "@repo/config";
import { dateFormat } from "@repo/utils";
import { sizeFormat, normalizePath } from "@repo/config";

export default {
  name: "GridLayout",

  props: {
    // 文件数据列表
    data: {
      type: Array,
      default: () => []
    },
    // 菜单配置
    menu: {
      type: Array,
      default: () => []
    },
    // 父级路径
    parentPath: {
      type: String,
      default: ""
    },
    // 是否可预览
    canPreview: {
      type: Boolean,
      default: false
    },
    // 是否可下载
    canDownload: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    useRenderIcon,
    sizeFormat,
    dateFormat,
    normalizePath,

    /**
     * 获取规范化路径
     * @param {string} path - 原始路径
     * @returns {string} 规范化后的路径
     */
    getPath(path) {
      return this.normalizePath(path);
    },

    /**
     * 处理复制操作
     * @param {Object} row - 文件行数据
     */
    doCopy(row) {
      if (row.directory === true) {
        return;
      }
      if (this.canPreview) {
        this.$emit("copy", row.absolutePath, row);
      }
    },

    /**
     * 处理下载操作
     * @param {Object} row - 文件行数据
     */
    doDownload(row) {
      if (row.directory === true) {
        return;
      }
      if (this.canDownload) {
        this.$emit("download", row.absolutePath, row);
      }
    },

    /**
     * 处理详情查看操作
     * @param {Object} row - 文件行数据
     */
    doDetail(row) {
      if (row.directory !== true) {
        if (this.canPreview) {
          this.$emit("preview", row.absolutePath, row);
        }
        return;
      }

      this.$emit("search", row.absolutePath);
    },

    /**
     * 获取文件图标
     * @param {string} name - 文件后缀名
     * @returns {string} 图标URL
     */
    getIcon(name) {
      return getAssetsImages(!name ? "folder" : name);
    }
  }
};
</script>
