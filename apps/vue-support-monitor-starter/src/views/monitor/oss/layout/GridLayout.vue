<template>
  <div class="grid-layout-container animate__animated animate__fadeIn">
    <!-- 添加滚动容器 -->
    <div class="scrollable-container">
      <el-row :gutter="20">
        <!-- 文件网格布局 -->
        <el-col
          v-for="(row, index) in data"
          :key="row.absolutePath || index"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          :xl="3"
          class="file-card-wrapper animate__animated animate__fadeInLeft"
          :style="{ animationDelay: index * 0.03 + 's' }"
        >
          <!-- 文件/文件夹卡片 -->
          <el-card :class="[row.directory ? 'folder-card' : 'file-card', 'hover-effect']" :body-style="{ padding: '0px' }" shadow="hover" @click="doDetail(row)">
            <!-- 文件图标 -->
            <div class="file-icon-container">
              <div class="file-icon-wrapper">
                <img class="file-icon" :src="getIcon(row.suffix)" :alt="row.filename" />
              </div>
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

              <!-- 文件类型标签 -->
              <div v-if="row.suffix" class="file-type">
                <el-tag size="small" :type="getTagType(row)" effect="light">
                  {{ row.suffix }}
                </el-tag>
              </div>
            </div>

            <!-- 操作按钮区域 -->
            <div v-if="!row.directory" class="file-actions">
              <!-- 复制按钮 -->
              <el-tooltip v-if="canPreview" content="复制" placement="top" :show-after="500">
                <el-button circle size="small" type="info" class="action-button animate__animated animate__fadeIn" @click.stop="doCopy(row)">
                  <IconifyIconOnline icon="ep:copy-document" />
                </el-button>
              </el-tooltip>

              <!-- 预览按钮 -->
              <el-tooltip v-if="canPreview" content="预览" placement="top" :show-after="500">
                <el-button circle size="small" type="primary" class="action-button animate__animated animate__fadeIn" @click.stop="doPreview(row)">
                  <IconifyIconOnline icon="ep:view" />
                </el-button>
              </el-tooltip>

              <!-- 下载按钮 -->
              <el-tooltip v-if="canDownload" content="下载" placement="top" :show-after="500">
                <el-button circle size="small" type="success" class="action-button animate__animated animate__fadeIn" @click.stop="doDownload(row)">
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
      type: Object,
      default: () => ({})
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
          this.doPreview(row);
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
    },

    getTagType(row) {
      if (row.directory) return "primary";

      // 根据文件类型返回不同的标签类型
      const fileTypeMap = {
        pdf: "danger",
        doc: "danger",
        docx: "danger",
        xls: "success",
        xlsx: "success",
        ppt: "warning",
        pptx: "warning",
        jpg: "info",
        jpeg: "info",
        png: "info",
        gif: "info",
        mp4: "warning",
        mp3: "warning",
        zip: "info",
        rar: "info"
      };

      return fileTypeMap[row.suffix] || "info";
    },

    doPreview(row) {
      if (row.directory === true) {
        return;
      }
      if (this.canPreview) {
        this.$emit("preview", row.absolutePath, row);
      }
    }
  }
};
</script>

<style scoped lang="scss">
/* 引入animate.css动画库 */
@import "animate.css";

/* 网格布局容器 */
.grid-layout-container {
  height: 100%;
  padding: 0;
  transition: all 0.3s ease;
}

/* 滚动容器 */
.scrollable-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;

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
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

/* 文件卡片基础样式 */
.file-card,
.folder-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 12px;
  height: 100%;
  border: 1px solid transparent;
  border-top-width: 3px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary-light-5);

    .file-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .file-icon-wrapper {
      transform: scale(1.1);
    }
  }
}

/* 文件夹卡片特殊样式 */
.folder-card {
  background-color: rgba(var(--el-color-primary-rgb), 0.05);
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.1);

  &:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.08);
    border-color: rgba(var(--el-color-primary-rgb), 0.2);
  }
}

/* 悬停效果 */
.hover-effect {
  &:hover {
    .file-name {
      color: var(--el-color-primary);
    }
  }
}

/* 文件图标容器 */
.file-icon-container {
  display: flex;
  justify-content: center;
  padding: 24px 0 16px 0;
}

/* 文件图标包装器 */
.file-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--el-color-primary-light-9);
  border-radius: 16px;
  padding: 12px;
  transition: all 0.3s ease;
}

/* 文件图标 */
.file-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

/* 文件信息区域 */
.file-info {
  padding: 12px 16px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 文件名称 */
.file-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: all 0.3s;
}

/* 文件日期和大小 */
.file-date,
.file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 文件类型标签 */
.file-type {
  display: flex;
  justify-content: center;
  margin-top: 4px;

  .el-tag {
    border-radius: 12px;
    padding: 0 10px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 10px;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.05);
    }
  }
}

/* 信息图标 */
.info-icon {
  font-size: 14px;
}

/* 文件操作按钮区域 */
.file-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(4px);
  border-radius: 8px;
  opacity: 0;
  transform: translateX(100%);
  transition: all 0.3s ease;
}

/* 操作按钮 */
.action-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* 文件夹标识 */
.folder-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--el-color-primary);
  font-size: 24px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .scrollable-container {
    padding: 12px;
  }

  .file-card-wrapper {
    margin-bottom: 16px;
  }

  .file-icon-wrapper {
    width: 60px;
    height: 60px;
    padding: 8px;
  }

  .file-icon {
    width: 36px;
    height: 36px;
  }

  .file-info {
    padding: 10px 12px 16px;
    gap: 6px;
  }

  .folder-badge {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}
</style>
