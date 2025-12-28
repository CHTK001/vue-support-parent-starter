<template>
  <sc-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    direction="rtl"
    size="400px"
    :close-on-click-modal="false"
  >
    <div class="file-detail" v-if="fileInfo">
      <!-- 文件图标和名称 -->
      <div class="file-header">
        <div class="file-icon-large">
          <IconifyIconOnline
            :icon="getFileIcon(fileInfo)"
            :class="['icon', { 'folder-icon': fileInfo.isDirectory }]"
          />
        </div>
        <div class="file-name">
          <h3>{{ fileInfo.name }}</h3>
          <p class="file-path">{{ fileInfo.path }}</p>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="detail-section">
        <h4 class="section-title">基本信息</h4>
        <div class="detail-list">
          <div class="detail-item">
            <span class="label">类型:</span>
            <span class="value">{{ fileInfo.isDirectory ? "文件夹" : "文件" }}</span>
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
        <h4 class="section-title">操作</h4>
        <div class="action-buttons">
          <el-button size="small" disabled>
            <IconifyIconOnline icon="ri:download-line" class="mr-1" />
            下载 (开发中)
          </el-button>
          
          <el-button size="small" disabled>
            <IconifyIconOnline icon="ri:edit-line" class="mr-1" />
            重命名 (开发中)
          </el-button>
          
          <el-button size="small" type="danger" disabled>
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            删除 (开发中)
          </el-button>
        </div>
      </div>
    </div>
  </sc-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatBytes } from "@pureadmin/utils";
import dayjs from "dayjs";
import type { FileInfo } from "@/api/server/file-management";

// Props
const props = defineProps<{
  visible: boolean;
  serverId: number;
  fileInfo: FileInfo | null;
}>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 计算属性
const drawerVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const drawerTitle = computed(() => {
  if (!props.fileInfo) return "文件详情";
  return props.fileInfo.isDirectory ? "文件夹详情" : "文件详情";
});

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * 获取文件图标
 */
const getFileIcon = (file: FileInfo) => {
  if (file.isDirectory) {
    return "ri:folder-line";
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    // JavaScript/TypeScript
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return "ri:javascript-line";
    case "vue":
      return "ri:vuejs-line";

    // Web技术
    case "html":
    case "htm":
      return "ri:html5-line";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "ri:css3-line";

    // Java相关
    case "java":
      return "ri:file-code-line";
    case "jar":
    case "war":
    case "ear":
      return "ri:archive-line";
    case "class":
      return "ri:file-code-line";

    // C/C++
    case "c":
    case "cpp":
    case "cc":
    case "cxx":
    case "h":
    case "hpp":
      return "ri:file-code-line";

    // Python
    case "py":
    case "pyc":
    case "pyo":
    case "pyw":
      return "ri:file-code-line";

    // 其他编程语言
    case "php":
    case "go":
    case "rs":
    case "rb":
    case "pl":
    case "sh":
    case "bat":
    case "cmd":
    case "ps1":
      return "ri:file-code-line";

    // 配置文件
    case "json":
    case "xml":
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
    case "conf":
    case "config":
    case "properties":
      return "ri:settings-3-line";

    // 文档
    case "md":
    case "markdown":
      return "ri:markdown-line";
    case "txt":
    case "log":
      return "ri:file-text-line";
    case "pdf":
      return "ri:file-pdf-line";
    case "doc":
    case "docx":
      return "ri:file-word-line";
    case "xls":
    case "xlsx":
      return "ri:file-excel-line";
    case "ppt":
    case "pptx":
      return "ri:file-ppt-line";

    // 压缩文件
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
    case "bz2":
    case "xz":
      return "ri:file-zip-line";

    // 图片
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "bmp":
    case "webp":
    case "ico":
      return "ri:image-line";

    // 音频
    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "ogg":
    case "wma":
      return "ri:music-line";

    // 视频
    case "mp4":
    case "avi":
    case "mkv":
    case "mov":
    case "wmv":
    case "flv":
    case "webm":
      return "ri:video-line";

    // 可执行文件
    case "exe":
    case "msi":
    case "dmg":
    case "deb":
    case "rpm":
    case "app":
      return "ri:install-line";

    // 库文件
    case "dll":
    case "so":
    case "dylib":
    case "lib":
    case "a":
      return "ri:code-box-line";

    // 数据库
    case "db":
    case "sqlite":
    case "sql":
      return "ri:database-line";

    // 字体
    case "ttf":
    case "otf":
    case "woff":
    case "woff2":
    case "eot":
      return "ri:font-size-line";

    default:
      return "ri:file-line";
  }
};
</script>

<style scoped>
.file-detail {
  padding: 0;
}

.file-header {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-extra-light);
}

.file-icon-large {
  margin-right: 16px;
}

.file-icon-large .icon {
  font-size: 48px;
  color: var(--el-color-primary);
}

.file-icon-large .folder-icon {
  color: var(--el-color-warning);
}

.file-name h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.file-path {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.detail-section {
  padding: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.detail-section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.detail-item .value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  text-align: right;
  word-break: break-all;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-buttons .el-button {
  justify-content: flex-start;
}
</style>
