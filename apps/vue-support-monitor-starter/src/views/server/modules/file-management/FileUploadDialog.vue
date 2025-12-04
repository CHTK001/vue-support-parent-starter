<template>
  <el-dialog
    v-model="dialogVisible"
    title="文件上传"
    width="70%"
    top="5vh"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    class="file-upload-dialog"
  >
    <div class="upload-container">
      <!-- 上传路径选择 -->
      <div class="upload-path-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
          上传目标路径
        </div>
        <div class="path-input-group">
          <el-input
            v-model="uploadPath"
            placeholder="请输入上传路径，�? /home/user/documents"
            class="path-input"
          >
            <template #prepend>
              <IconifyIconOnline icon="ri:folder-open-line" />
            </template>
          </el-input>
          <el-button @click="selectPath" type="primary">
            <IconifyIconOnline icon="ri:folder-open-line" class="mr-1" />
            选择路径
          </el-button>
        </div>
      </div>

      <!-- 文件上传区域 -->
      <div class="upload-area-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:upload-cloud-line" class="mr-2" />
          选择文件
        </div>

        <!-- 拖拽上传区域 -->
        <div
          class="upload-drop-zone"
          :class="{ 'is-dragover': isDragOver }"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @click="triggerFileSelect"
        >
          <div class="upload-content">
            <IconifyIconOnline
              icon="ri:upload-cloud-2-line"
              class="upload-icon"
            />
            <div class="upload-text">
              <p class="primary-text">点击选择文件或拖拽文件到此处</p>
              <p class="secondary-text">
                支持多文件上传，单个文件最�?{{ maxFileSize }}MB
              </p>
            </div>
          </div>

          <!-- 隐藏的文件输�?-->
          <input
            ref="fileInputRef"
            type="file"
            multiple
            style="display: none"
            @change="handleFileSelect"
          />
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list-section" v-if="fileList.length > 0">
        <div class="section-title">
          <IconifyIconOnline icon="ri:file-list-line" class="mr-2" />
          待上传文�?({{ fileList.length }})
        </div>

        <div class="file-list">
          <div
            v-for="(file, index) in fileList"
            :key="index"
            class="file-item"
            :class="{
              uploading: file.uploading,
              success: file.success,
              error: file.error,
            }"
          >
            <div class="file-info">
              <IconifyIconOnline
                :icon="getFileIcon(file.name)"
                class="file-icon"
              />
              <div class="file-details">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>

            <div class="file-status">
              <div v-if="file.uploading" class="upload-progress">
                <el-progress
                  :percentage="file.progress"
                  :stroke-width="4"
                  :show-text="false"
                />
                <span class="progress-text">{{ file.progress }}%</span>
              </div>
              <div v-else-if="file.success" class="success-status">
                <IconifyIconOnline
                  icon="ri:check-line"
                  class="status-icon success"
                />
                <span>上传成功</span>
              </div>
              <div v-else-if="file.error" class="error-status">
                <IconifyIconOnline
                  icon="ri:close-line"
                  class="status-icon error"
                />
                <span>{{ file.errorMessage || "上传失败" }}</span>
              </div>
              <div v-else class="pending-status">
                <IconifyIconOnline
                  icon="ri:time-line"
                  class="status-icon pending"
                />
                <span>等待上传</span>
              </div>
            </div>

            <div class="file-actions">
              <el-button
                v-if="!file.uploading && !file.success"
                size="small"
                text
                @click="removeFile(index)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传选项 -->
      <div class="upload-options-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:settings-line" class="mr-2" />
          上传选项
        </div>
        <div class="options-content">
          <el-checkbox v-model="overwriteExisting">
            覆盖已存在的文件
          </el-checkbox>
          <el-checkbox v-model="createDirectory"> 自动创建目录 </el-checkbox>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <span v-if="fileList.length > 0" class="file-count">
            �?{{ fileList.length }} 个文件，总大�?
            {{ formatFileSize(totalSize) }}
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="closeDialog">取消</el-button>
          <el-button @click="clearFiles" v-if="fileList.length > 0"
            >清空</el-button
          >
          <el-button
            type="primary"
            @click="startUpload"
            :disabled="fileList.length === 0 || !uploadPath || isUploading"
            :loading="isUploading"
          >
            <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
            {{ isUploading ? "上传�?.." : "开始上�? }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import { uploadFile } from "@/api/server/file-management";

// Props
const props = defineProps<{
  visible: boolean;
  serverId: number;
  currentPath?: string;
}>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  "upload-success": [];
}>();

// 文件项接�?
interface FileItem {
  name: string;
  size: number;
  file: File;
  uploading: boolean;
  progress: number;
  success: boolean;
  error: boolean;
  errorMessage?: string;
}

// 响应式数�?
const uploadPath = ref("");
const fileList = ref<FileItem[]>([]);
const isDragOver = ref(false);
const isUploading = ref(false);
const overwriteExisting = ref(false);
const createDirectory = ref(true);
const maxFileSize = ref(100); // MB

// 组件引用
const fileInputRef = ref<HTMLInputElement>();

// 计算属�?
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => {
    emit("update:visible", value);
    if (!value) {
      resetUpload();
    }
  },
});

const totalSize = computed(() => {
  return fileList.value.reduce((total, file) => total + file.size, 0);
});

// 监听当前路径变化
watch(
  () => props.currentPath,
  (newPath) => {
    if (newPath) {
      uploadPath.value = newPath;
    }
  },
  { immediate: true }
);

/**
 * 格式化文件大�?
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 获取文件图标
 */
const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const iconMap: Record<string, string> = {
    // 图片
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    bmp: "ri:image-line",
    svg: "ri:image-line",
    webp: "ri:image-line",

    // 文档
    pdf: "ri:file-pdf-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",

    // 代码
    js: "ri:file-code-line",
    ts: "ri:file-code-line",
    vue: "ri:file-code-line",
    html: "ri:file-code-line",
    css: "ri:file-code-line",
    json: "ri:file-code-line",
    xml: "ri:file-code-line",

    // 压缩�?
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    tar: "ri:file-zip-line",
    gz: "ri:file-zip-line",

    // 文本
    txt: "ri:file-text-line",
    md: "ri:file-text-line",
    log: "ri:file-text-line",

    // 视频
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mov: "ri:video-line",
    wmv: "ri:video-line",

    // 音频
    mp3: "ri:music-line",
    wav: "ri:music-line",
    flac: "ri:music-line",
  };

  return iconMap[ext] || "ri:file-line";
};

/**
 * 触发文件选择
 */
const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

/**
 * 处理文件选择
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (files) {
    addFiles(Array.from(files));
  }
  // 清空input值，允许重复选择同一文件
  target.value = "";
};

/**
 * 处理拖拽悬停
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

/**
 * 处理拖拽离开
 */
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

/**
 * 处理文件拖拽放置
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer?.files;
  if (files) {
    addFiles(Array.from(files));
  }
};
</script>

<style scoped>
.file-upload-dialog {
  --dialog-border-radius: 8px;
}

.file-upload-dialog :deep(.el-dialog) {
  border-radius: var(--dialog-border-radius);
  overflow: hidden;
}

.file-upload-dialog :deep(.el-dialog__header) {
  background: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 16px 20px;
}

.file-upload-dialog :deep(.el-dialog__body) {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.file-upload-dialog :deep(.el-dialog__footer) {
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-light);
  padding: 12px 20px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

/* 路径选择区域 */
.path-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.path-input {
  flex: 1;
}

/* 上传区域 */
.upload-drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-fill-color-lighter);
}

.upload-drop-zone:hover,
.upload-drop-zone.is-dragover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
}

.upload-text .primary-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}

.upload-text .secondary-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}
</style>
