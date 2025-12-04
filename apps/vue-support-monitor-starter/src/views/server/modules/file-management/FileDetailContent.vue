<template>
  <div class="file-detail-content modern-scrollbar" v-if="fileInfo">
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
import type { FileInfo } from "@/api/server/file-management";
import { ElMessageBox } from "element-plus";
import { computed } from "vue";

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
    // JavaScript/TypeScript
    js: "ri:javascript-line",
    ts: "ri:javascript-line",
    jsx: "ri:javascript-line",
    tsx: "ri:javascript-line",
    vue: "ri:vuejs-line",

    // Web技术
    html: "ri:html5-line",
    htm: "ri:html5-line",
    css: "ri:css3-line",
    scss: "ri:css3-line",
    sass: "ri:css3-line",
    less: "ri:css3-line",

    // Java相关
    java: "ri:file-code-line",
    jar: "ri:archive-line",
    war: "ri:archive-line",
    ear: "ri:archive-line",
    class: "ri:file-code-line",

    // C/C++
    c: "ri:file-code-line",
    cpp: "ri:file-code-line",
    cc: "ri:file-code-line",
    cxx: "ri:file-code-line",
    h: "ri:file-code-line",
    hpp: "ri:file-code-line",

    // Python
    py: "ri:file-code-line",
    pyc: "ri:file-code-line",
    pyo: "ri:file-code-line",
    pyw: "ri:file-code-line",

    // 其他编程语言
    php: "ri:file-code-line",
    go: "ri:file-code-line",
    rs: "ri:file-code-line",
    rb: "ri:file-code-line",
    pl: "ri:file-code-line",
    sh: "ri:file-code-line",
    bat: "ri:file-code-line",
    cmd: "ri:file-code-line",
    ps1: "ri:file-code-line",

    // 配置文件
    json: "ri:settings-3-line",
    xml: "ri:settings-3-line",
    yaml: "ri:settings-3-line",
    yml: "ri:settings-3-line",
    toml: "ri:settings-3-line",
    ini: "ri:settings-3-line",
    conf: "ri:settings-3-line",
    config: "ri:settings-3-line",
    properties: "ri:settings-3-line",

    // 文档
    md: "ri:markdown-line",
    markdown: "ri:markdown-line",
    txt: "ri:file-text-line",
    log: "ri:file-text-line",
    pdf: "ri:file-pdf-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",

    // 压缩文件
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    tar: "ri:file-zip-line",
    gz: "ri:file-zip-line",
    bz2: "ri:file-zip-line",
    xz: "ri:file-zip-line",

    // 图片
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    svg: "ri:image-line",
    bmp: "ri:image-line",
    webp: "ri:image-line",
    ico: "ri:image-line",

    // 音频
    mp3: "ri:music-line",
    wav: "ri:music-line",
    flac: "ri:music-line",
    aac: "ri:music-line",
    ogg: "ri:music-line",
    wma: "ri:music-line",

    // 视频
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mkv: "ri:video-line",
    mov: "ri:video-line",
    wmv: "ri:video-line",
    flv: "ri:video-line",
    webm: "ri:video-line",

    // 可执行文件
    exe: "ri:install-line",
    msi: "ri:install-line",
    dmg: "ri:install-line",
    deb: "ri:install-line",
    rpm: "ri:install-line",
    app: "ri:install-line",

    // 库文件
    dll: "ri:code-box-line",
    so: "ri:code-box-line",
    dylib: "ri:code-box-line",
    lib: "ri:code-box-line",
    a: "ri:code-box-line",

    // 数据库
    db: "ri:database-line",
    sqlite: "ri:database-line",
    sql: "ri:database-line",

    // 字体
    ttf: "ri:font-size-line",
    otf: "ri:font-size-line",
    woff: "ri:font-size-line",
    woff2: "ri:font-size-line",
    eot: "ri:font-size-line",
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
   background: var(--el-bg-color-overlay); /* 设置文件详情内容背景为白色 */
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

/* 统一的细滚动条样式 */
.file-detail-content::-webkit-scrollbar {
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: transparent;
}

.file-detail-content::-webkit-scrollbar-thumb {
  background: rgba(140, 140, 140, 0.3);
  border-radius: 2px;
  box-shadow: inset 0 0 6px rgba(140, 140, 140, 0.3);
}

.file-detail-content::-webkit-scrollbar-thumb:hover {
  background: rgba(140, 140, 140, 0.5);
}

.file-detail-content::-webkit-scrollbar-track {
  background-color: rgba(140, 140, 140, 0);
  border-radius: 2px;
  box-shadow: inset 0 0 6px rgba(140, 140, 140, 0);
}

/* 暗色主题适配 - 强制保持白色背景 */
@media (prefers-color-scheme: dark) {
  .file-detail-content {
    background: #ffffff !important; /* 强制保持白色背景 */
  }
}
</style>
