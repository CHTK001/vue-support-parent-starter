<template>
  <div class="file-detail-content" v-if="fileInfo">
    <!-- 文件图标和名称 -->
    <div class="file-header">
      <div class="file-icon-large">
        <IconifyIconOnline
          :icon="getFileIcon(fileInfo)"
          :class="['icon', { 'folder-icon': fileInfo.isDirectory }]"
        />
      </div>
      <div class="file-name">
        <h4>{{ fileInfo.name }}</h4>
        <p class="file-path">{{ fileInfo.path }}</p>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="detail-section">
      <h5 class="section-title">基本信息</h5>
      <div class="detail-list">
        <div class="detail-item">
          <span class="label">类型:</span>
          <span class="value">{{
            fileInfo.isDirectory ? "文件夹" : "文件"
          }}</span>
        </div>
        <div class="detail-item" v-if="!fileInfo.isDirectory">
          <span class="label">大小:</span>
          <span class="value">{{ formatFileSize(fileInfo.size) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">修改时间:</span>
          <span class="value">{{ formatTime(fileInfo.modifiedTime) }}</span>
        </div>
        <div class="detail-item" v-if="fileInfo.permissions">
          <span class="label">权限:</span>
          <span class="value">{{ fileInfo.permissions }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="detail-section">
      <h5 class="section-title">操作</h5>
      <div class="action-buttons">
        <el-button
          size="small"
          v-if="!fileInfo.isDirectory && isPreviewable"
          @click="handlePreview"
          type="primary"
        >
          <IconifyIconOnline icon="ri:eye-line" class="mr-1" />
          预览
        </el-button>
        <el-button size="small" @click="handleDownload">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          下载
        </el-button>
        <el-button size="small" type="danger" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          删除
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FileInfo } from "@/api/file-management";

// Props
const props = defineProps<{
  serverId: number;
  fileInfo?: FileInfo | null;
}>();

// Emits
const emit = defineEmits<{
  preview: [file: FileInfo];
  download: [file: FileInfo];
  delete: [file: FileInfo];
}>();

/**
 * 判断文件是否可以预览
 */
const isPreviewable = computed(() => {
  if (!props.fileInfo || props.fileInfo.isDirectory) {
    return false;
  }

  const fileName = props.fileInfo.name.toLowerCase();
  const ext = fileName.split(".").pop();

  if (!ext) return false;

  // 支持预览的文件格式
  const previewableExtensions = [
    // 图片格式
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "svg",
    "webp",
    "ico",
    // 文本格式
    "txt",
    "md",
    "json",
    "xml",
    "html",
    "htm",
    "css",
    "js",
    "ts",
    "vue",
    "py",
    "java",
    "cpp",
    "c",
    "h",
    "hpp",
    "cs",
    "php",
    "rb",
    "go",
    "rs",
    "yaml",
    "yml",
    "toml",
    "ini",
    "conf",
    "config",
    "log",
    // 文档格式
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    // 代码文件
    "jsx",
    "tsx",
    "scss",
    "sass",
    "less",
    "stylus",
    "sql",
    "sh",
    "bat",
    "ps1",
  ];

  return previewableExtensions.includes(ext);
});

/**
 * 获取文件图标
 */
const getFileIcon = (file: FileInfo) => {
  if (file.isDirectory) {
    return "ri:folder-fill";
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    // 图片
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    bmp: "ri:image-line",
    svg: "ri:image-line",
    // 文档
    txt: "ri:file-text-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    pdf: "ri:file-pdf-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",
    // 代码
    js: "ri:file-code-line",
    ts: "ri:file-code-line",
    html: "ri:file-code-line",
    css: "ri:file-code-line",
    java: "ri:file-code-line",
    py: "ri:file-code-line",
    cpp: "ri:file-code-line",
    c: "ri:file-code-line",
    // 压缩包
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    tar: "ri:file-zip-line",
    gz: "ri:file-zip-line",
    // 音频
    mp3: "ri:music-line",
    wav: "ri:music-line",
    flac: "ri:music-line",
    // 视频
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mkv: "ri:video-line",
    mov: "ri:video-line",
  };

  return iconMap[ext || ""] || "ri:file-line";
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化时间
 */
const formatTime = (timeStr: string) => {
  if (!timeStr) return "-";
  try {
    const date = new Date(timeStr);
    return date.toLocaleString("zh-CN");
  } catch {
    return timeStr;
  }
};

/**
 * 处理预览
 */
const handlePreview = () => {
  if (props.fileInfo) {
    emit("preview", props.fileInfo);
  }
};

/**
 * 处理下载
 */
const handleDownload = () => {
  if (props.fileInfo) {
    emit("download", props.fileInfo);
  }
};

/**
 * 处理删除
 */
const handleDelete = async () => {
  if (!props.fileInfo) return;

  try {
    await ElMessageBox.confirm(
      `确定要删除 "${props.fileInfo.name}" 吗？`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      }
    );

    emit("delete", props.fileInfo);
  } catch {
    // 用户取消
  }
};
</script>

<style scoped>
.file-detail-content {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background: #ffffff; /* 设置文件详情内容背景为白色 */
}

.file-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.file-icon-large {
  margin-right: 12px;
}

.file-icon-large .icon {
  font-size: 32px;
  color: var(--el-color-primary);
}

.file-icon-large .folder-icon {
  color: var(--el-color-warning);
}

.file-name h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.file-path {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.detail-item .label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.detail-item .value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-align: right;
  word-break: break-all;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 80px;
}

/* 滚动条样式 */
.file-detail-content::-webkit-scrollbar {
  width: 4px;
}

.file-detail-content::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 2px;
}

.file-detail-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 2px;
}

.file-detail-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary-light-5);
}

/* 暗色主题适配 - 强制保持白色背景 */
@media (prefers-color-scheme: dark) {
  .file-detail-content {
    background: #ffffff !important; /* 强制保持白色背景 */
  }
}
</style>
