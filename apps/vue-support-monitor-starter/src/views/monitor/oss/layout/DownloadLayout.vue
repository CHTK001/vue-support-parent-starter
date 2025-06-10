<template>
  <div class="download-layout-container">
    <el-dialog
      v-model="visible"
      :title="title"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      width="400px"
      class="download-dialog animate__animated animate__fadeIn"
      @close="close"
    >
      <template #header>
        <div class="dialog-header">
          <div class="file-info">
            <div class="file-icon-wrapper">
              <IconifyIconOnline :icon="getFileIcon()" class="file-icon" />
            </div>
            <div class="file-details">
              <h3 class="file-name">{{ name }}</h3>
              <span v-if="row" class="file-meta">{{ getFileMeta() }}</span>
            </div>
          </div>
        </div>
      </template>

      <div class="download-content">
        <el-skeleton animated :loading="loading" :rows="3">
          <template #default>
            <div class="download-status">
              <div v-if="!downloaded" class="download-ready animate__animated animate__pulse animate__infinite">
                <div class="download-icon-wrapper" @click="download">
                  <IconifyIconOnline icon="ep:download" class="download-icon" />
                </div>
                <div class="download-text">点击下载文件</div>
              </div>
              <div v-else class="downloading animate__animated animate__fadeIn">
                <el-progress type="circle" :percentage="downloadProgress" :status="downloadStatus">
                  <template #default="{ percentage }">
                    <span class="progress-text">{{ percentage }}%</span>
                    <span class="progress-label">{{ downloadStatusText }}</span>
                  </template>
                </el-progress>
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button plain @click="close">关闭</el-button>
          <el-button type="primary" :disabled="downloaded" @click="download">
            {{ downloaded ? "已下载" : "下载" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { http } from "@repo/utils";
export default {
  data() {
    return {
      path: null,
      row: null,
      downloaded: false,
      menu: null,
      loading: false,
      mediaType: null,
      visible: false,
      title: "文件下载",
      name: null,
      data: null,
      downloadProgress: 0,
      downloadStatus: "",
      downloadStatusText: "准备下载",
      form: null,
      ua: null
    };
  },
  unmounted() {
    try {
      URL.revokeObjectURL(this.data);
    } catch (error) {}
  },
  methods: {
    useRenderIcon,
    setData(path, row, menu, form, fullUrl = false) {
      this.form = form;
      this.menu = menu;
      this.name = row.filename;
      this.row = row;
      this.ua = form.fileStorageProtocolUa;
      //fileStorageBucket
      this.title = "下载 - " + row.filename;
      const type = Object.keys(row.mediaType).filter(i => row.mediaType[i]);
      if (type.length == 1) {
        this.mediaType = type[0];
      } else {
        this.mediaType = row.suffix;
      }
      this.path = fullUrl
        ? path
        : form.fileStorageProtocolName.toLowerCase() +
          "://" +
          this.getHost(form) +
          ":" +
          form.fileStorageProtocolPort +
          (menu.fileStorageBucket.startsWith("/") ? menu.fileStorageBucket : "/" + menu.fileStorageBucket) +
          (path.startsWith("/") ? path : "/" + path);
      return this;
    },
    getHost(form) {
      const fileStorageProtocolHost = form.fileStorageProtocolHost;
      return "0.0.0.0" == fileStorageProtocolHost ? "127.0.0.1" : fileStorageProtocolHost;
    },
    open(mode = "download") {
      this.visible = true;
      this.downloaded = false;
      this.downloadProgress = 0;
      this.downloadStatus = "";
      this.downloadStatusText = "准备下载";
    },
    close() {
      this.visible = false;
      this.$emit("close");
      this.path = null;
      this.row = null;
      this.menu = null;
      this.downloaded = false;
      this.downloadProgress = 0;
    },
    download() {
      if (this.downloaded) return;

      this.downloaded = true;
      this.downloadStatus = "warning";
      this.downloadStatusText = "下载中";

      // 模拟进度
      const progressInterval = setInterval(() => {
        if (this.downloadProgress < 90) {
          this.downloadProgress += Math.floor(Math.random() * 10) + 1;
        }
      }, 300);

      http
        .get(
          this.path + "?download",
          {},
          {
            headers: {
              "X-User-Agent": this.ua || this.form.fileStorageProtocolUa,
              "X-Download-User-Agent": this.form.fileStorageProtocolDownloadUa
            },
            responseType: "blob",
            onDownloadProgress: progressEvent => {
              if (progressEvent.lengthComputable) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                this.downloadProgress = percentCompleted;
              }
            }
          }
        )
        .then(res => {
          clearInterval(progressInterval);
          this.downloadProgress = 100;
          this.downloadStatus = "success";
          this.downloadStatusText = "下载完成";

          this.data = URL.createObjectURL(res);
          const box = document.createElement("a");
          box.download = this.name;
          box.href = this.data;
          box.click();
        })
        .catch(error => {
          clearInterval(progressInterval);
          this.downloadStatus = "exception";
          this.downloadStatusText = "下载失败";
          this.downloadProgress = 0;
          console.error("下载失败:", error);
        });
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

      return parts.join(" · ");
    }
  }
};
</script>

<style scoped lang="scss">
@import "animate.css";

.download-layout-container {
  .download-dialog {
    :deep(.el-dialog) {
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);

      .el-dialog__header {
        margin: 0;
        padding: 0;
      }

      .el-dialog__body {
        padding: 0;
      }

      .el-dialog__footer {
        padding: 16px 24px;
        border-top: 1px solid var(--el-border-color-light);
        background-color: var(--el-fill-color-lighter);
      }
    }
  }

  .dialog-header {
    padding: 16px 24px;
    background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .file-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .file-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: var(--el-color-primary-light-7);
    display: flex;
    align-items: center;
    justify-content: center;

    .file-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .file-details {
    display: flex;
    flex-direction: column;

    .file-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }

    .file-meta {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }

  .download-content {
    padding: 32px 24px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .download-status {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .download-ready {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .download-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-5));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 16px rgba(var(--el-color-primary-rgb), 0.2);

      &:hover {
        transform: translateY(-5px) scale(1.05);
        box-shadow: 0 12px 24px rgba(var(--el-color-primary-rgb), 0.3);
      }

      .download-icon {
        font-size: 32px;
        color: white;
      }
    }

    .download-text {
      font-size: 16px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
    }
  }

  .downloading {
    :deep(.el-progress) {
      .el-progress__text {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .progress-text {
          font-size: 24px;
          font-weight: bold;
          color: var(--el-color-primary);
        }

        .progress-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .download-layout-container {
    .download-dialog {
      :deep(.el-dialog) {
        width: 90% !important;
        margin: 10px auto;
      }
    }

    .dialog-header {
      padding: 12px;
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
        max-width: 180px;
      }
    }

    .download-content {
      padding: 24px 16px;
    }

    .download-ready {
      .download-icon-wrapper {
        width: 64px;
        height: 64px;

        .download-icon {
          font-size: 28px;
        }
      }
    }
  }
}
</style>
