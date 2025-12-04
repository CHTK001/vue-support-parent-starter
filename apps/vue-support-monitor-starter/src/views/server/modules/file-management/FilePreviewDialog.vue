<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="85%"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="file-preview-dialog"
    top="5vh"
  >
    <div class="preview-content" v-loading="loading">
      <!-- 文件信息 -->
      <div class="file-info" v-if="fileInfo">
        <div class="info-item">
          <span class="label">文件�?</span>
          <span class="value">{{ fileInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">大小:</span>
          <span class="value">{{ formatFileSize(fileInfo.size) }}</span>
        </div>
        <div class="info-item">
          <span class="label">修改时间:</span>
          <span class="value">{{ formatTime(fileInfo.modifiedTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">类型:</span>
          <span class="value">{{ getFileType() }}</span>
        </div>
      </div>

      <!-- 文件内容 -->
      <div class="file-content">
        <!-- 文本文件预览 -->
        <div v-if="isTextFile && fileContent !== null" class="text-preview">
          <div class="preview-toolbar">
            <el-button-group size="small">
              <el-button
                :type="viewMode === 'text' ? 'primary' : ''"
                @click="viewMode = 'text'"
              >
                <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
                文本
              </el-button>
              <el-button
                v-if="isCodeFile"
                :type="viewMode === 'code' ? 'primary' : ''"
                @click="viewMode = 'code'"
              >
                <IconifyIconOnline icon="ri:code-line" class="mr-1" />
                代码
              </el-button>
            </el-button-group>
            <div class="toolbar-right">
              <el-button size="small" @click="downloadFile">
                <IconifyIconOnline icon="ri:download-line" class="mr-1" />
                下载
              </el-button>
            </div>
          </div>

          <!-- 文本内容显示 -->
          <div v-if="viewMode === 'text'" class="text-content">
            <pre>{{ fileContent }}</pre>
          </div>

          <!-- 代码高亮显示 -->
          <div v-else-if="viewMode === 'code'" class="code-content">
            <pre><code :class="getLanguageClass()">{{ fileContent }}</code></pre>
          </div>
        </div>

        <!-- 图片文件预览 -->
        <div v-else-if="isImageFile" class="image-preview">
          <div class="preview-toolbar">
            <span class="file-type-label">图片预览</span>
            <div class="toolbar-right">
              <el-button size="small" @click="downloadFile">
                <IconifyIconOnline icon="ri:download-line" class="mr-1" />
                下载
              </el-button>
            </div>
          </div>
          <div class="image-container">
            <img
              :src="getImageUrl()"
              :alt="fileInfo?.name"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>
        </div>

        <!-- 不支持预览的文件 -->
        <div v-else class="unsupported-preview">
          <div class="unsupported-content">
            <IconifyIconOnline icon="ri:file-line" class="unsupported-icon" />
            <p>此文件类型暂不支持预�?/p>
            <p class="file-type-hint">{{ getFileTypeHint() }}</p>
            <div class="unsupported-actions">
              <el-button type="primary" @click="downloadFile">
                <IconifyIconOnline icon="ri:download-line" class="mr-1" />
                下载文件
              </el-button>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-preview">
          <div class="error-content">
            <IconifyIconOnline
              icon="ri:error-warning-line"
              class="error-icon"
            />
            <p>文件预览失败</p>
            <p class="error-message">{{ error }}</p>
            <div class="error-actions">
              <el-button @click="loadFileContent">重试</el-button>
              <el-button type="primary" @click="downloadFile"
                >下载文件</el-button
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
        <el-button
          v-if="isTextFile && fileContent"
          type="primary"
          @click="editFile"
        >
          <IconifyIconOnline icon="ri:edit-line" class="mr-1" />
          编辑
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FileInfo } from "@/api/server/file-management";
import {
    downloadFile as apiDownloadFile,
    previewFile,
} from "@/api/server/file-management";
import { formatBytes } from "@pureadmin/utils";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import { computed, nextTick, ref, watch } from "vue";

// Props
const props = defineProps<{
  visible: boolean;
  serverId: number;
  fileInfo: FileInfo | null;
}>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  "file-updated": [];
}>();

// 响应式数�?
const loading = ref(false);
const fileContent = ref<string | null>(null);
const error = ref<string>("");
const viewMode = ref<"text" | "code">("text");

// 计算属�?
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    emit("update:visible", value);
    if (!value) {
      // 关闭时重置状�?
      fileContent.value = null;
      error.value = "";
      viewMode.value = "text";
    }
  },
});

const dialogTitle = computed(() => {
  if (!props.fileInfo) return "文件预览";
  return `文件预览 - ${props.fileInfo.name}`;
});

// 文件类型判断
const isTextFile = computed(() => {
  if (!props.fileInfo) return false;
  const ext = getFileExtension();
  const textExts = [
    "txt",
    "md",
    "json",
    "xml",
    "html",
    "css",
    "js",
    "ts",
    "vue",
    "jsx",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "h",
    "hpp",
    "php",
    "rb",
    "go",
    "rs",
    "sh",
    "bat",
    "yml",
    "yaml",
    "ini",
    "conf",
    "log",
    "csv",
    "sql",
    "properties",
    "gitignore",
  ];
  return textExts.includes(ext);
});

const isCodeFile = computed(() => {
  if (!props.fileInfo) return false;
  const ext = getFileExtension();
  const codeExts = [
    "js",
    "ts",
    "vue",
    "jsx",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "h",
    "hpp",
    "php",
    "rb",
    "go",
    "rs",
    "sh",
    "bat",
    "css",
    "html",
    "xml",
    "json",
    "yml",
    "yaml",
  ];
  return codeExts.includes(ext);
});

const isImageFile = computed(() => {
  if (!props.fileInfo) return false;
  const ext = getFileExtension();
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  return imageExts.includes(ext);
});

/**
 * 获取文件扩展�?
 */
const getFileExtension = () => {
  if (!props.fileInfo) return "";
  return props.fileInfo.name.split(".").pop()?.toLowerCase() || "";
};

/**
 * 格式化文件大�?
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 格式化时�?
 */
const formatTime = (time: string) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * 获取文件类型
 */
const getFileType = () => {
  if (!props.fileInfo) return "";
  const ext = getFileExtension();
  if (!ext) return "未知类型";

  const typeMap: Record<string, string> = {
    txt: "文本文件",
    md: "Markdown文档",
    json: "JSON文件",
    xml: "XML文件",
    html: "HTML文档",
    css: "CSS样式�?,
    js: "JavaScript文件",
    ts: "TypeScript文件",
    vue: "Vue组件",
    py: "Python文件",
    java: "Java文件",
    jpg: "JPEG图片",
    jpeg: "JPEG图片",
    png: "PNG图片",
    gif: "GIF图片",
    pdf: "PDF文档",
    doc: "Word文档",
    docx: "Word文档",
    xls: "Excel表格",
    xlsx: "Excel表格",
  };

  return typeMap[ext] || `${ext.toUpperCase()}文件`;
};

/**
 * 获取文件类型提示
 */
const getFileTypeHint = () => {
  if (!props.fileInfo) return "";
  const ext = getFileExtension();

  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
    return "建议下载后使用相应软件打开";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return "压缩文件，请下载后解压查�?;
  }
  if (["exe", "msi", "dmg", "deb", "rpm"].includes(ext)) {
    return "可执行文件，请谨慎下载和运行";
  }

  return "该文件类型暂不支持在线预�?;
};

/**
 * 获取语言类型用于代码高亮
 */
const getLanguageClass = () => {
  const ext = getFileExtension();
  const langMap: Record<string, string> = {
    js: "language-javascript",
    ts: "language-typescript",
    vue: "language-vue",
    jsx: "language-jsx",
    tsx: "language-tsx",
    py: "language-python",
    java: "language-java",
    c: "language-c",
    cpp: "language-cpp",
    php: "language-php",
    rb: "language-ruby",
    go: "language-go",
    rs: "language-rust",
    sh: "language-bash",
    bat: "language-batch",
    css: "language-css",
    html: "language-html",
    xml: "language-xml",
    json: "language-json",
    yml: "language-yaml",
    yaml: "language-yaml",
  };
  return langMap[ext] || "language-text";
};

/**
 * 获取图片URL
 */
const getImageUrl = () => {
  if (!props.fileInfo) return "";
  // 这里应该调用后端API获取图片URL
  // 暂时返回占位�?
  return `/api/file-management/${props.serverId}/preview?path=${encodeURIComponent(props.fileInfo.path)}`;
};

/**
 * 加载文件内容
 */
const loadFileContent = async () => {
  if (!props.fileInfo || !props.serverId) return;

  loading.value = true;
  error.value = "";

  try {
    const response = await previewFile(
      props.serverId,
      props.fileInfo.path,
      "auto",
      10
    );
    if (response.success && response.data) {
      fileContent.value = response.data.content || "";
    } else {
      error.value = response.message || "文件预览失败";
    }
  } catch (err: any) {
    console.error("Preview file error:", err);
    error.value = err.message || "文件预览失败";
  } finally {
    loading.value = false;
  }
};

/**
 * 下载文件
 */
const downloadFile = async () => {
  if (!props.fileInfo || !props.serverId) return;

  try {
    const response = await apiDownloadFile(props.serverId, props.fileInfo.path);
    if (response.success && response.data?.downloadUrl) {
      // 创建下载链接
      const link = document.createElement("a");
      link.href = response.data.downloadUrl;
      link.download = props.fileInfo.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      ElMessage.success("文件下载开�?);
    } else {
      ElMessage.error(response.message || "文件下载失败");
    }
  } catch (err: any) {
    console.error("Download file error:", err);
    ElMessage.error(err.message || "文件下载失败");
  }
};

/**
 * 编辑文件
 */
const editFile = () => {
  ElMessage.info("文件编辑功能开发中...");
  // TODO: 实现文件编辑功能
};

/**
 * 图片加载成功
 */
const onImageLoad = () => {
  console.log("Image loaded successfully");
};

/**
 * 图片加载失败
 */
const onImageError = () => {
  error.value = "图片加载失败";
};

/**
 * 关闭对话�?
 */
const closeDialog = () => {
  dialogVisible.value = false;
};

// 监听对话框显示状态，自动加载文件内容
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.fileInfo) {
      await nextTick();
      if (isTextFile.value) {
        await loadFileContent();
      }
    }
  },
  { immediate: true }
);

// 监听文件信息变化
watch(
  () => props.fileInfo,
  async (newFileInfo) => {
    if (newFileInfo && props.visible) {
      fileContent.value = null;
      error.value = "";
      if (isTextFile.value) {
        await loadFileContent();
      }
    }
  }
);
</script>

<style scoped>
.file-preview-dialog {
  --dialog-border-radius: 8px;
}

.file-preview-dialog :deep(.el-dialog) {
  border-radius: var(--dialog-border-radius);
  overflow: hidden;
}

.file-preview-dialog :deep(.el-dialog__header) {
  background: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 16px 20px;
}

.file-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.file-preview-dialog :deep(.el-dialog__footer) {
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-light);
  padding: 12px 20px;
}

.preview-content {
  max-height: 75vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  background: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  min-width: 70px;
}

.value {
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family);
}

.file-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 工具栏样�?*/
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
   background: var(--el-bg-color-overlay); /* 设置工具栏背景为白色 */
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.file-type-label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

/* 文本预览样式 */
.text-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.text-content,
.code-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
   background: var(--el-bg-color-overlay); /* 设置代码内容背景为白�?*/
}

.text-content pre,
.code-content pre {
  margin: 0;
  padding: 0;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--el-text-color-primary);
  background: transparent;
}

.code-content pre code {
  display: block;
  padding: 16px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}

/* 图片预览样式 */
.image-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--el-fill-color-lighter);
  overflow: auto;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 不支持预览的文件样式 */
.unsupported-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--el-fill-color-lighter);
}

.unsupported-content {
  text-align: center;
  color: var(--el-text-color-secondary);
  max-width: 400px;
}

.unsupported-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: var(--el-text-color-placeholder);
}

.file-type-hint {
  margin: 12px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.unsupported-actions {
  margin-top: 20px;
}

/* 错误预览样式 */
.error-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--el-fill-color-lighter);
}

.error-content {
  text-align: center;
  color: var(--el-text-color-secondary);
  max-width: 400px;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: var(--el-color-danger);
}

.error-message {
  margin: 12px 0;
  font-size: 14px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--el-color-danger-light-7);
}

.error-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 对话框底部样�?*/
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滚动条样�?*/
.text-content::-webkit-scrollbar,
.code-content::-webkit-scrollbar,
.image-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.text-content::-webkit-scrollbar-track,
.code-content::-webkit-scrollbar-track,
.image-container::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.text-content::-webkit-scrollbar-thumb,
.code-content::-webkit-scrollbar-thumb,
.image-container::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 3px;
  transition: background 0.3s;
}

.text-content::-webkit-scrollbar-thumb:hover,
.code-content::-webkit-scrollbar-thumb:hover,
.image-container::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary-light-5);
}

/* 响应式设�?*/
@media (max-width: 768px) {
  .file-preview-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .preview-content {
    max-height: 80vh;
  }

  .file-info {
    padding: 12px 16px;
    gap: 12px;
  }

  .preview-toolbar {
    padding: 8px 16px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: center;
  }

  .text-content,
  .code-content {
    padding: 16px;
  }

  .text-content pre,
  .code-content pre {
    font-size: 12px;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .code-content pre code {
    background: var(--el-bg-color-page);
    border-color: var(--el-border-color);
  }

  .image-container img {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }
}

/* 暗色主题适配 - 强制保持白色背景 */
@media (prefers-color-scheme: dark) {
  .preview-toolbar {
    background: #ffffff !important; /* 强制保持白色背景 */
  }

  .code-content {
    background: #ffffff !important; /* 强制保持白色背景 */
  }
}
</style>
