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
      width="85%"
      class="modern-dialog animate__animated animate__fadeIn"
      @close="close"
    >
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container animate__animated animate__fadeIn">
        <el-skeleton :loading="loading" animated :rows="10" />
        <div class="loading-text">
          <IconifyIconOnline icon="ep:loading" class="loading-icon spin" />
          <span>正在加载文件预览...</span>
        </div>
      </div>

      <!-- iframe预览 -->
      <div class="preview-container" :class="{ 'is-loading': loading }">
        <iframe
          v-if="!fullUrl"
          id="bdIframe"
          ref="Iframe"
          class="preview-iframe animate__animated animate__fadeIn"
          :src="url + '?data=' + path + '&mediaType=' + mediaType + '&ua=' + fileStorageProtocolUa + '&name=' + name"
          frameborder="0"
          width="100%"
          scrolling="auto"
        />
        <preview v-else class="preview-component" :url="path" :ua="fileStorageProtocolUa" :name="name" :mediaType="mediaType" />
      </div>
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

    // 在新窗口打开
    openInNewWindow() {
      if (!this.row) return;

      if (this.row.mediaType?.image) {
        window.open(this.getImageUrl(this.row));
        return;
      }

      let url = this.form.fileStorageProtocolName === "HTTP" ? "http://" : "https://";
      url += this.form.fileStorageProtocolHost + ":" + this.form.fileStorageProtocolPort;
      url += "/" + (this.menu.fileStorageBucket.startsWith("/") ? this.menu.fileStorageBucket.substring(1) : this.menu.fileStorageBucket);
      url += this.row.absolutePath.startsWith("/") ? this.row.absolutePath : "/" + this.row.absolutePath;
      url += "?preview";

      window.open(url);
    },

    // 获取图片URL
    getImageUrl(row) {
      let url = this.form.fileStorageProtocolName === "HTTP" ? "http://" : "https://";
      url += this.form.fileStorageProtocolHost + ":" + this.form.fileStorageProtocolPort;
      url += "/" + (this.menu.fileStorageBucket + "/" + row.absolutePath).replace(/\/+/g, "/");
      url += "?preview";
      return url;
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
    },

    // 获取文件元数据
    getFileMeta() {
      if (!this.row) return "";

      const parts = [];

      // 添加文件类型
      if (this.row.suffix) {
        parts.push(this.row.suffix.toUpperCase());
      }

      // 添加文件大小
      if (this.row.fileSize) {
        parts.push(this.row.fileSize);
      }

      // 添加最后修改时间
      if (this.row.userMetadata?.lastModified) {
        const date = new Date(this.row.userMetadata.lastModified * 1);
        parts.push(date.toLocaleDateString());
      }

      return parts.join(" · ");
    }
  }
};
</script>

<style scoped lang="scss">
@import "animate.css";

:deep(.el-dialog) {
  height: 90vh !important;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);

  .el-dialog__body {
    padding: 0;
    height: calc(90vh - 80px);
  }
}
:deep(.preview-container),
.preview-container {
  height: calc(70vh - 80px) !important;
  iframe {
    height: 100% !important;
  }
}
.view-layout-container {
  .file-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .file-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: var(--el-color-primary-light-7);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .file-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .file-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;

    .file-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .dialog-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;

    .action-button {
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .loading-container {
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .loading-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      color: var(--el-text-color-secondary);
      font-size: 16px;

      .loading-icon {
        font-size: 24px;
        color: var(--el-color-primary);
        animation: spin 1.5s infinite linear;
      }
    }
  }

  .preview-container {
    height: 100%;
    width: 100%;
    position: relative;
    background-color: var(--el-fill-color-lighter);

    &.is-loading {
      display: none;
    }
  }

  .preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .preview-component {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .view-layout-container {
    .modern-dialog {
      :deep(.el-dialog) {
        width: 95% !important;
        margin: 10px auto;

        .el-dialog__body {
          height: calc(90vh - 100px);
        }
      }
    }

    .file-icon-wrapper {
      width: 40px;
      height: 40px;

      .file-icon {
        font-size: 20px;
      }
    }

    .file-details {
      .file-name {
        font-size: 16px;
      }
    }
  }
}
</style>
