<template>
  <div class="mode-layout-container animate__animated animate__fadeIn">
    <!-- 媒体文件网格布局 -->
    <el-row :gutter="16" class="media-grid">
      <el-col
        v-for="(row, index) in data"
        :key="row.absolutePath || index"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="4"
        :xl="4"
        class="media-item-wrapper animate__animated animate__zoomIn"
        :style="{ animationDelay: index * 0.05 + 's' }"
      >
        <!-- 媒体卡片 -->
        <el-card class="media-card" :body-style="{ padding: '0', height: '100%' }" shadow="hover" @click="doDetail(row)">
          <!-- 媒体内容区域 -->
          <div class="media-content">
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

            <!-- 媒体预览 -->
            <div class="media-preview">
              <!-- 文件夹图标 -->
              <template v-if="!row.suffix">
                <img class="folder-icon" :src="getIcon(row.suffix)" alt="文件夹" />
              </template>

              <!-- 图片预览 -->
              <template v-else-if="row.mediaType?.image">
                <img class="image-preview animate__animated animate__fadeIn" :src="getImageUrl(row)" :alt="row.filename" loading="lazy" />
              </template>

              <!-- 其他文件图标 -->
              <template v-else>
                <img class="file-icon" :src="getIcon(row.suffix)" :alt="row.filename" />
              </template>
            </div>

            <!-- 修改时间信息 -->
            <div v-if="row.userMetadata.lastModified" class="modified-time">
              <IconifyIconOnline icon="ep:calendar" />
              <span>{{ dateFormat(row.userMetadata.lastModified * 1) }}</span>
            </div>

            <!-- 操作按钮区域 -->
            <div v-if="!row.directory" class="action-buttons">
              <!-- 复制按钮 -->
              <el-tooltip v-if="canPreview" content="复制地址" placement="top">
                <el-button circle size="small" class="action-button" @click.stop="doCopy(row)">
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
      type: Array,
      default: () => []
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
    }
  }
};
</script>

<style scoped lang="scss">
/* 引入animate.css动画库 */
@import "animate.css";

/* 布局容器 */
.mode-layout-container {
  padding: 16px;
  min-height: 300px;
}

/* 媒体网格 */
.media-grid {
  margin: 0 -8px;
}

/* 媒体项包装器 */
.media-item-wrapper {
  margin-bottom: 16px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

/* 媒体卡片 */
.media-card {
  height: 250px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);

    .action-buttons {
      opacity: 1;
      transform: translateY(0);
    }

    .folder-icon,
    .file-icon {
      transform: scale(1.1);
    }
  }
}

/* 媒体内容 */
.media-content {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 文件名标签 */
.filename-tag {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  color: white;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 文件名文本 */
.filename-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

/* 文件大小 */
.file-size {
  font-size: 12px;
  opacity: 0.8;
}

/* 媒体预览 */
.media-preview {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 文件夹图标 */
.folder-icon {
  width: 100px;
  height: 100px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

/* 文件图标 */
.file-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

/* 图片预览 */
.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 修改时间信息 */
.modified-time {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 8px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  color: white;
  font-size: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}

/* 操作按钮区域 */
.action-buttons {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 20;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

/* 操作按钮 */
.action-button {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: scale(1.1);
  }
}

/* 文件夹标识 */
.folder-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--el-color-primary);
  font-size: 24px;
  z-index: 15;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .media-card {
    height: 200px;
  }

  .folder-icon,
  .file-icon {
    width: 60px;
    height: 60px;
  }
}
</style>
