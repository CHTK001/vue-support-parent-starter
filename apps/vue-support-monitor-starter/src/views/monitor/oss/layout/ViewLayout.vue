<template>
  <div class="view-layout-container">
    <el-dialog
      v-model="visible"
      top="2%"
      :title="title"
      :destroy-on-close="true"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      width="80%"
      :show-close="false"
      class="modern-dialog animate__animated animate__fadeIn h-[80vh]"
      @close="close"
    >
      <!-- 自定义标题栏 -->
      <template #header>
        <div class="dialog-header">
          <div class="file-info">
            <IconifyIconOnline :icon="getFileIcon()" class="file-icon" />
            <span class="file-name">{{ title }}</span>
          </div>
          <div class="dialog-actions">
            <el-tooltip content="下载文件" placement="bottom">
              <el-button circle size="small" class="action-button" @click="downloadFile">
                <IconifyIconOnline icon="ep:download" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="关闭预览" placement="bottom">
              <el-button circle size="small" type="danger" class="action-button" @click="close">
                <IconifyIconOnline icon="ep:close" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container animate__animated animate__fadeIn">
        <el-skeleton :loading="loading" animated :rows="10" />
        <div class="loading-text">
          <IconifyIconOnline icon="ep:loading" class="loading-icon spin" />
          正在加载文件预览...
        </div>
      </div>

      <!-- iframe预览 -->
      <iframe
        v-if="!fullUrl"
        id="bdIframe"
        ref="Iframe"
        class="preview-iframe animate__animated animate__fadeIn"
        :class="{
          '!h-[67vh]': !loading
        }"
        :src="url + '?data=' + path + '&mediaType=' + mediaType + '&ua=' + fileStorageProtocolUa + '&name=' + name"
        frameborder="0"
        width="100%"
        scrolling="auto"
      />
      <preview v-else class="overflow-auto vesselBox1" :url="path" :ua="fileStorageProtocolUa" :name="name" :mediaType="mediaType" />
    </el-dialog>
  </div>
</template>

<script>
import { Base64 } from "js-base64";
import Preview from "../Preview.vue";
export default {
  components: {
    Preview
  },
  data() {
    return {
      url: null,
      path: null,
      row: null,
      menu: null,
      form: null,
      loading: false,
      mediaType: null,
      visible: false,
      title: "预览",
      name: null,
      fullUrl: false,
      fileStorageProtocolUa: null
    };
  },
  methods: {
    setData(path, row, menu, form, fullUrl = false) {
      this.fullUrl = fullUrl;
      this.form = form;
      this.menu = menu;
      this.name = row.filename;
      this.title = row.filename;
      this.row = row;
      this.url = (location.origin + (location.pathname === "/" ? "/index.html" : location.pathname)).replaceAll("index.html", "preview.html");

      const type = Object.keys(row.mediaType).filter(i => row.mediaType[i]);
      if (type.length == 1) {
        this.mediaType = type[0];
      } else {
        this.mediaType = row.mediaType?.image ? "image" : row.suffix;
      }
      this.fileStorageProtocolUa = fullUrl ? form.fileStorageProtocolUa : Base64.encode(form.fileStorageProtocolUa);
      let originUrl =
        form.fileStorageProtocolName.toLowerCase() +
        "://" +
        this.getHost(form) +
        ":" +
        form.fileStorageProtocolPort +
        (menu.fileStorageBucket.startsWith("/") ? menu.fileStorageBucket : "/" + menu.fileStorageBucket) +
        (path.startsWith("/") ? path : "/" + path);
      if (this.isServerRender(row)) {
        originUrl = this.serverRenderUrl(row, originUrl);
      }
      this.path = fullUrl ? path : Base64.encode(originUrl);
      return this;
    },
    isServerRender(row) {
      if (
        row.suffix === "xlsx" ||
        row.suffix === "wps" ||
        row.suffix === "xls" ||
        row.suffix === "csv" ||
        row.suffix === "doc" ||
        row.suffix === "docx" ||
        row.suffix === "avif" ||
        row.suffix === "heic" ||
        row.suffix === "tiff" ||
        row.suffix === "tif" ||
        row.suffix === "md" ||
        row.suffix === "zip" ||
        row.suffix === "tar" ||
        row.suffix === "jar" ||
        row.suffix === "class" ||
        row.suffix === "dcm" ||
        row.suffix === "vsdx" ||
        row.suffix === "eml" ||
        row.suffix === "txt" ||
        row.suffix === "pdf" ||
        row.suffix === "ofd"
      ) {
        this.mediaType = "html";
        return true;
      }
      return false;
    },
    serverRenderUrl(row, originUrl) {
      if (row.suffix === "xlsx" || row.suffix === "wps" || row.suffix === "xls" || row.suffix === "csv" || row.suffix === "doc" || row.suffix === "docx") {
        return originUrl + "?preview/format/pdf/can/html";
      }

      if (row.suffix === "eml") {
        return originUrl + "?preview/format/pdf/can/html";
      }
      if (row.suffix === "doc" || row.suffix === "docx" || row.suffix === "wps" || row.suffix === "vsdx") {
        return originUrl + "?preview/format/pdf/can/html";
      }
      return originUrl + "?preview/can/html";
    },
    getHost(form) {
      const fileStorageProtocolHost = form.fileStorageProtocolHost;
      return "0.0.0.0" == fileStorageProtocolHost ? "127.0.0.1" : fileStorageProtocolHost;
    },
    open(mode = "preview") {
      this.visible = true;
      this.loading = true;

      if (this.fullUrl) {
        // 直接预览组件不需要iframe加载
        setTimeout(() => {
          this.loading = false;
        }, 500);
        return;
      }

      this.iframeLoad();
    },
    close() {
      this.visible = false;
      this.$emit("close");

      // 清理数据
      setTimeout(() => {
        this.path = null;
        this.row = null;
        this.menu = null;
        this.loading = false;
      }, 300);
    },
    // 调用方法
    iframeLoad() {
      this.loading = true;
      this.$nextTick(() => {
        const iframe = this.$refs.Iframe;
        // 兼容处理
        if (iframe?.attachEvent) {
          // IE
          iframe.attachEvent("onload", () => {
            this.loading = false;
          });
        } else {
          // 非IE
          if (iframe) {
            iframe.onload = () => {
              this.loading = false;
            };
          }
        }
      });
    },

    // 下载当前文件
    downloadFile() {
      if (!this.row) return;
      this.$emit("download", this.row.absolutePath, this.row);
    },

    // 获取文件图标
    getFileIcon() {
      if (!this.row) return "ep:document";

      const suffix = this.row.suffix;

      // 根据文件类型返回不同图标
      const iconMap = {
        pdf: "ep:document-copy",
        doc: "ep:document",
        docx: "ep:document",
        xls: "ep:data-line",
        xlsx: "ep:data-line",
        ppt: "ep:data-analysis",
        pptx: "ep:data-analysis",
        jpg: "ep:picture",
        jpeg: "ep:picture",
        png: "ep:picture",
        gif: "ep:picture",
        mp4: "ep:video-play",
        mp3: "ep:headset",
        zip: "ep:folder",
        rar: "ep:folder"
      };

      return iconMap[suffix] || "ep:document";
    }
  }
};
</script>

<style scoped lang="scss">
/* 引入animate.css动画库 */
@import "animate.css";

/* 预览布局容器 */
.view-layout-container {
  position: relative;
}

/* 现代化对话框 */
:deep(.modern-dialog) {
  border-radius: 12px;
  overflow: hidden;

  .el-dialog__header {
    margin: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    height: calc(80vh - 100px) !important;
    padding: 0;
    overflow: hidden;
    position: relative;
  }

  .el-dialog__headerbtn {
    display: none;
  }
}

/* 对话框标题区域 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 70%;

  .file-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  .file-name {
    font-size: 16px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 对话框操作按钮 */
.dialog-actions {
  display: flex;
  gap: 8px;

  .action-button {
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

/* 加载容器 */
.loading-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .loading-text {
    text-align: center;
    margin-top: 20px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .loading-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  .spin {
    animation: spin 1.5s linear infinite;
  }
}

/* 预览iframe */
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background-color: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 预览组件 */
.preview-component {
  height: 100%;
  overflow: auto;
  width: 100%;
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  :deep(.modern-dialog) {
    width: 95% !important;

    .el-dialog__body {
      height: calc(90vh - 100px);
    }
  }

  .file-info .file-name {
    max-width: 200px;
  }
}
:deep(.el-dialog__body) {
  padding: 0 !important;
  height: 98% !important;
}
</style>
