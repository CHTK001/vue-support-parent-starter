<template>
  <div class="mode-layout-container animate__animated animate__fadeIn">
    <!-- 媒体文件网格布局 -->
    <el-row :gutter="24" class="media-grid">
      <el-col
        v-for="(row, index) in data"
        :key="row.absolutePath || index"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="4"
        class="media-item-wrapper animate__animated animate__fadeInLeft"
        :style="{ animationDelay: index * 0.03 + 's' }"
      >
        <!-- 媒体卡片 -->
        <el-card class="media-card" :body-style="{ padding: '0', height: '100%' }" shadow="hover" @click="doDetail(row)">
          <!-- 媒体内容区域 -->
          <div class="media-content">
            <!-- 媒体预览 -->
            <div class="media-preview">
              <!-- 文件夹图标 -->
              <template v-if="!row.suffix">
                <div class="folder-preview">
                  <img class="folder-icon" :src="getIcon(row.suffix)" alt="文件夹" />
                </div>
              </template>

              <!-- 图片预览 -->
              <template v-else-if="row.mediaType?.image">
                <div class="image-preview-container">
                  <img class="image-preview animate__animated animate__fadeIn" :src="getImageUrl(row)" :alt="row.filename" loading="lazy" />
                </div>
              </template>

              <!-- 其他文件图标 -->
              <template v-else>
                <div class="file-preview">
                  <img class="file-icon" :src="getIcon(row.suffix)" :alt="row.filename" />
                </div>
              </template>
            </div>

            <!-- 文件信息层 -->
            <div class="file-info-overlay">
              <!-- 文件名标签 -->
              <div class="filename-tag">
                <el-tooltip :content="row.filename" placement="top" :show-after="500">
                  <span class="filename-text">{{ row.filename }}</span>
                </el-tooltip>

                <!-- 文件大小信息 -->
                <span v-if="row.suffix" class="file-size">
                  {{ row.fileSize == 0 ? "0KB" : sizeFormat(row.fileSize) }}
                </span>
              </div>

              <!-- 文件类型标签 -->
              <div v-if="row.suffix" class="file-type-tag">
                <el-tag size="small" :type="getTagType(row)" effect="light">
                  {{ row.suffix }}
                </el-tag>
              </div>

              <!-- 修改时间信息 -->
              <div v-if="row.userMetadata.lastModified" class="modified-time">
                <IconifyIconOnline icon="ep:calendar" />
                <span>{{ dateFormat(row.userMetadata.lastModified * 1) }}</span>
              </div>
            </div>

            <!-- 操作按钮区域 -->
            <div v-if="!row.directory" class="action-buttons">
              <!-- 复制按钮 -->
              <el-tooltip v-if="canPreview" content="复制地址" placement="top">
                <el-button circle size="small" class="action-button" type="info" @click.stop="doCopy(row)">
                  <IconifyIconOnline icon="ep:copy-document" />
                </el-button>
              </el-tooltip>

              <!-- 预览按钮 -->
              <el-tooltip v-if="canPreview" content="预览" placement="top">
                <el-button circle size="small" type="primary" class="action-button" @click.stop="doOpen(row)">
                  <IconifyIconOnline icon="ep:view" />
                </el-button>
              </el-tooltip>

              <!-- 下载按钮 -->
              <el-tooltip v-if="canDownload" content="下载" placement="top">
                <el-button circle size="small" type="success" class="action-button" @click.stop="doDownload(row)">
                  <IconifyIconOnline icon="ep:download" />
                </el-button>
              </el-tooltip>
            </div>

            <!-- 文件夹标识 -->
            <div v-if="row.directory" class="folder-badge">
              <IconifyIconOnline icon="ep:folder-opened" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getAssetsImages } from "@repo/config";
import { dateFormat } from "@repo/utils";
import { sizeFormat, normalizePath } from "@repo/config";

export default {
  name: "ModeLayout",

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
    // 表单数据
    form: {
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
     * 获取图片URL
     * @param {Object} row - 文件行数据
     * @returns {string} 图片URL
     */
    getImageUrl(row) {
      let url = this.form.fileStorageProtocolName === "HTTP" ? "http://" : "https://";
      url += this.form.fileStorageProtocolHost + ":" + this.form.fileStorageProtocolPort;
      url += "/" + normalizePath(this.menu.fileStorageBucket + "/" + row.absolutePath);
      url += "?preview";
      if (row.suffix == "avif" || row.suffix == "heic" || row.suffix == "nef") {
        url += "/format/jpeg";
      }
      return url;
    },

    /**
     * 打开文件预览
     * @param {Object} row - 文件行数据
     */
    doOpen(row) {
      if (row.mediaType?.image) {
        window.open(this.getImageUrl(row));
        return;
      }
      window.open(this.getUrl(row));
    },

    /**
     * 获取文件URL
     * @param {Object} row - 文件行数据
     * @returns {string} 文件URL
     */
    getUrl(row) {
      let url = this.form.fileStorageProtocolName === "HTTP" ? "http://" : "https://";
      url += this.form.fileStorageProtocolHost + ":" + this.form.fileStorageProtocolPort;
      url += "/" + normalizePath(this.menu.fileStorageBucket + "/" + row.absolutePath);
      url += "?preview";
      if (row.suffix === "csv") {
        url += "/can/deny";
      } else {
        url += "/can/html";
      }
      if (row.suffix == "vsdx" || row.suffix == "vsd") {
        url += "/format/jpeg";
      } else if (row.suffix == "doc" || row.suffix == "docx") {
        url += "/format/pdf";
      }
      return url;
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
    },

    /**
     * 获取标签类型
     * @param {Object} row - 文件行数据
     * @returns {string} 标签类型
     */
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
    }
  }
};
</script>

<style lang="scss" scoped>
/* 引入animate.css动画库 */
@import "animate.css";

/* 模式布局容器 */
.mode-layout-container {
  padding: 16px;
  height: calc(100vh - 250px);
  overflow-y: auto;

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

/* 媒体网格 */
.media-grid {
  margin: 0;
}

/* 媒体项包装器 */
.media-item-wrapper {
  margin-bottom: 24px;
}

/* 媒体卡片 */
.media-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  border-top-width: 3px;
  height: 100%;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    border-color: var(--el-color-primary-light-5);

    .file-info-overlay {
      opacity: 1;
      transform: translateY(0);
    }

    .action-buttons {
      opacity: 1;
      transform: translateY(0);
    }

    .folder-preview,
    .file-preview {
      transform: scale(1.05);
    }

    .image-preview {
      transform: scale(1.05);
    }
  }
}

/* 媒体内容 */
.media-content {
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* 媒体预览 */
.media-preview {
  width: 100%;
  height: 240px;
  position: relative;
  overflow: hidden;
  background-color: var(--el-fill-color-lighter);
}

/* 文件夹预览 */
.folder-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
  transition: all 0.3s ease;

  .folder-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }
}

/* 图片预览容器 */
.image-preview-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 图片预览 */
.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

/* 文件预览 */
.file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--el-fill-color), var(--el-fill-color-lighter));
  transition: all 0.3s ease;

  .file-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }
}

/* 文件信息覆盖层 */
.file-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 16px;
  color: white;
  opacity: 0.8;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

/* 文件名标签 */
.filename-tag {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .filename-text {
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .file-size {
    font-size: 12px;
    opacity: 0.8;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

/* 文件类型标签 */
.file-type-tag {
  margin-bottom: 8px;

  .el-tag {
    border-radius: 12px;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

/* 修改时间信息 */
.modified-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.8;

  .icon {
    font-size: 14px;
  }
}

/* 操作按钮区域 */
.action-buttons {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
}

/* 操作按钮 */
.action-button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* 文件夹标识 */
.folder-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: var(--el-color-primary);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .mode-layout-container {
    padding: 12px;
    height: calc(100vh - 280px);
  }

  .media-item-wrapper {
    margin-bottom: 16px;
  }

  .media-preview {
    height: 180px;
  }

  .folder-preview,
  .file-preview {
    .folder-icon,
    .file-icon {
      width: 60px;
      height: 60px;
    }
  }

  .file-info-overlay {
    padding: 12px;
  }

  .filename-tag {
    .filename-text {
      font-size: 14px;
    }
  }

  .action-buttons {
    top: 8px;
    right: 8px;
  }

  .action-button {
    width: 32px;
    height: 32px;
  }

  .folder-badge {
    width: 32px;
    height: 32px;
  }
}
</style>
