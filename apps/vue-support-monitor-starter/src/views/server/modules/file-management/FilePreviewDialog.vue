<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="80%"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="file-preview-dialog"
  >
    <div class="preview-content" v-loading="loading">
      <!-- 文件信息 -->
      <div class="file-info" v-if="fileInfo">
        <div class="info-item">
          <span class="label">文件名:</span>
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
      </div>

      <!-- 文件内容 -->
      <div class="file-content">
        <!-- 不支持预览的文件 -->
        <div class="unsupported-preview">
          <div class="unsupported-content">
            <IconifyIconOnline icon="ri:file-line" class="unsupported-icon" />
            <p>此文件类型暂不支持预览</p>
            <p>文件预览功能开发中...</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="closeDialog">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
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
  "file-updated": [];
}>();

// 响应式数据
const loading = ref(false);

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const dialogTitle = computed(() => {
  if (!props.fileInfo) return "文件预览";
  return `文件预览 - ${props.fileInfo.name}`;
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
 * 关闭对话框
 */
const closeDialog = () => {
  dialogVisible.value = false;
};
</script>

<style scoped>
.preview-content {
  max-height: 70vh;
  overflow: auto;
}

.file-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.value {
  color: var(--el-text-color-primary);
}

.file-content {
  min-height: 300px;
}

.unsupported-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.unsupported-content {
  text-align: center;
  color: var(--el-text-color-secondary);
}

.unsupported-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--el-text-color-placeholder);
}
</style>
