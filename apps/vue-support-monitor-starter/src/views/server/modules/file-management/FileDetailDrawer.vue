<template>
  <el-drawer
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
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatBytes } from "@pureadmin/utils";
import dayjs from "dayjs";
import type { FileInfo } from "@/api/file-management";

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
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return "ri:javascript-line";
    case "vue":
      return "ri:vuejs-line";
    case "html":
      return "ri:html5-line";
    case "css":
    case "scss":
    case "sass":
      return "ri:css3-line";
    case "json":
      return "ri:file-code-line";
    case "md":
      return "ri:markdown-line";
    case "txt":
      return "ri:file-text-line";
    case "pdf":
      return "ri:file-pdf-line";
    case "zip":
    case "rar":
    case "7z":
      return "ri:file-zip-line";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
      return "ri:image-line";
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
