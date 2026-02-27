<template>
  <sc-dialog
    v-model="visible"
    title="上传文件"
    width="800px"
    destroy-on-close
    :close-on-click-modal="false"
    class="upload-dialog"
  >
    <!-- 上传配置 -->
    <div class="upload-config">
      <ScForm :model="config" label-width="100px" inline>
        <ScFormItem label="目标分组">
          <ScSelect 
            v-model="config.groupId"
            placeholder="选择分组"
            style="width: 160px"
          >
            <ScOption 
              v-for="group in groups"
              :key="group.sysFileSystemGroupId"
              :label="group.sysFileSystemGroupName"
              :value="group.sysFileSystemGroupId"
            />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="上传方式">
          <ScRadioGroup 
            v-model="config.uploadMode"
            :disabled="!setting?.sysFileSystemSettingChunkEnabled"
          >
            <ScRadio value="normal">普通上传</ScRadio>
            <ScRadio value="chunk">分片上传</ScRadio>
          </ScRadioGroup>
        </ScFormItem>
        <ScFormItem 
          v-if="
            config.uploadMode === 'chunk' &&
            setting?.sysFileSystemSettingAutoMergeEnabled
          "
          label="自动合并"
        >
          <ScSwitch v-model="config.autoMerge" />
        </ScFormItem>
      </ScForm>
    </div>

    <!-- 上传区域 -->
    <div
      class="upload-area"
      :class="{ 'is-dragover': isDragover }"
      @dragover.prevent="handleDragover"
      @dragleave.prevent="handleDragleave"
      @drop.prevent="handleDrop"
      @paste="handlePaste"
      @click="triggerFileSelect"
    >
      <input
        ref="fileInputRef"
        type="file"
        multiple
        :accept="acceptTypes"
        style="display: none"
        @change="handleFileSelect"
      />
      <div class="upload-content">
        <IconifyIconOnline
          :icon="isDragover ? 'ri:download-2-line' : 'ri:upload-cloud-2-line'"
          class="upload-icon"
        />
        <div class="upload-text">
          <p class="main-text">拖拽文件到此处，或点击选择文件</p>
          <p class="sub-text">
            支持 Ctrl+V 粘贴 | 单文件最大
            {{ setting?.sysFileSystemSettingMaxFileSizeMb || 1024 }}MB
          </p>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="fileList.length > 0" class="file-list">
      <div class="list-header">
        <span class="file-count">已选择 {{ fileList.length }} 个文件</span>
        <span class="total-size">总大小: {{ formatTotalSize }}</span>
        <ScButton type="danger" link @click="clearFiles">
          <IconifyIconOnline icon="ri:delete-bin-line" />
          清空
        </ScButton>
      </div>

      <div class="file-items">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="file-item"
          :class="`status-${file.status}`"
        >
          <div class="file-preview">
            <img
              v-if="file.previewUrl"
              :src="file.previewUrl"
              class="preview-image"
              @click="showImageEditor(file)"
            />
            <IconifyIconOnline
              v-else
              :icon="getFileIcon(file.file.type)"
              class="preview-icon"
            />
          </div>

          <div class="file-info">
            <div class="file-name">{{ file.file.name }}</div>
            <div class="file-meta">
              <span>{{ formatFileSize(file.file.size) }}</span>
              <span v-if="file.status !== 'pending'" class="file-status">
                {{ getStatusText(file.status) }}
              </span>
            </div>
            <ScProgress 
              v-if="file.status === 'uploading'"
              :percentage="file.progress"
              :stroke-width="4"
              :show-text="false"
            />
          </div>

          <div class="file-actions">
            <ScButton 
              v-if="file.previewUrl"
              type="primary"
              circle
              size="small"
              @click="showImageEditor(file)"
            >
              <IconifyIconOnline icon="ri:crop-line" />
            </ScButton>
            <ScButton 
              v-if="file.status !== 'uploading'"
              type="danger"
              circle
              size="small"
              @click="removeFile(index)"
            >
              <IconifyIconOnline icon="ri:close-line" />
            </ScButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片裁剪对话框 -->
    <ImageCropDialog
      v-model="showCropDialog"
      :image-url="currentCropImage"
      @cropped="handleImageCropped"
    />

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-stats">
          <span v-if="uploadStats.total > 0">
            成功: {{ uploadStats.success }} / 失败: {{ uploadStats.error }} /
            总计: {{ uploadStats.total }}
          </span>
        </div>
        <div class="footer-buttons">
          <ScButton @click="visible = false">取消</ScButton>
          <ScButton 
            type="primary"
            :disabled="fileList.length === 0"
            :loading="isUploading"
            @click="startUpload"
          >
            {{ isUploading ? "上传中..." : "开始上传" }}
          </ScButton>
        </div>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { useConfigStoreHook } from "@repo/core";
import SparkMD5 from "spark-md5";
import {
  uploadFile,
  createUploadTask,
  uploadTaskPart,
  checkInstantUpload,
  findTaskByMd5,
  type SysFileSystemSetting,
  type SysFileSystemGroup,
} from "../../api/file";
import ImageCropDialog from "./ImageCropDialog.vue";

interface FileItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error" | "paused";
  progress: number;
  previewUrl?: string;
  result?: { url?: string };
  /** 文件MD5（用于断点续传） */
  fileMd5?: string;
  /** 任务ID */
  taskId?: string;
  /** 已上传的分片 */
  uploadedParts?: number[];
}

interface Props {
  modelValue: boolean;
  setting?: SysFileSystemSetting;
  groups: SysFileSystemGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  uploaded: [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// 状态
const fileInputRef = ref<HTMLInputElement>();
const isDragover = ref(false);
const isUploading = ref(false);
const fileList = ref<FileItem[]>([]);
const showCropDialog = ref(false);
const currentCropImage = ref("");
const currentCropIndex = ref(-1);

// 配置
const config = reactive({
  groupId: undefined as number | undefined,
  uploadMode: "normal" as "normal" | "chunk",
  autoMerge: true,
  /** 并发数 */
  concurrency: 3,
  /** 是否启用秒传 */
  enableInstantUpload: true,
  /** 是否启用断点续传 */
  enableResume: true,
});

// ConfigStore Socket
const configStore = useConfigStoreHook();
const STORAGE_KEY = "file_upload_progress";

// 统计
const uploadStats = reactive({
  total: 0,
  success: 0,
  error: 0,
});

// 计算属性
const acceptTypes = computed(() => {
  const types = props.setting?.sysFileSystemSettingAllowedTypes;
  if (!types) return "*";
  return types
    .split(",")
    .map((t) => `.${t.trim()}`)
    .join(",");
});

const formatTotalSize = computed(() => {
  const total = fileList.value.reduce((sum, item) => sum + item.file.size, 0);
  return formatFileSize(total);
});

// 方法
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (type: string): string => {
  if (type.startsWith("image/")) return "ri:image-line";
  if (type.startsWith("video/")) return "ri:video-line";
  if (type.startsWith("audio/")) return "ri:music-line";
  if (type.includes("pdf")) return "ri:file-pdf-line";
  if (type.includes("word")) return "ri:file-word-line";
  if (type.includes("excel") || type.includes("sheet"))
    return "ri:file-excel-line";
  if (type.includes("zip") || type.includes("rar")) return "ri:file-zip-line";
  return "ri:file-line";
};

const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: "待上传",
    uploading: "上传中",
    success: "上传成功",
    error: "上传失败",
  };
  return map[status] || "";
};

// 文件选择
const triggerFileSelect = () => fileInputRef.value?.click();

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
  }
  input.value = "";
};

// 拖拽
const handleDragover = () => (isDragover.value = true);
const handleDragleave = () => (isDragover.value = false);
const handleDrop = (event: DragEvent) => {
  isDragover.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
};

// 粘贴
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  const files: File[] = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind === "file") {
      const file = items[i].getAsFile();
      if (file) files.push(file);
    }
  }
  if (files.length > 0) {
    addFiles(files);
  }
};

// 添加文件
const addFiles = (files: File[]) => {
  const maxSize =
    (props.setting?.sysFileSystemSettingMaxFileSizeMb || 1024) * 1024 * 1024;

  for (const file of files) {
    if (file.size > maxSize) {
      message(`文件 ${file.name} 超过大小限制`, { type: "warning" });
      continue;
    }

    const item: FileItem = {
      file,
      status: "pending",
      progress: 0,
    };

    // 图片预览
    if (file.type.startsWith("image/")) {
      item.previewUrl = URL.createObjectURL(file);
    }

    fileList.value.push(item);
  }
};

// 移除文件
const removeFile = (index: number) => {
  const item = fileList.value[index];
  if (item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  fileList.value.splice(index, 1);
};

// 清空文件
const clearFiles = () => {
  fileList.value.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  fileList.value = [];
};

// 图片裁剪
const showImageEditor = (file: FileItem) => {
  const index = fileList.value.indexOf(file);
  if (index > -1 && file.previewUrl) {
    currentCropIndex.value = index;
    currentCropImage.value = file.previewUrl;
    showCropDialog.value = true;
  }
};

const handleImageCropped = async (blob: Blob) => {
  if (currentCropIndex.value > -1) {
    const item = fileList.value[currentCropIndex.value];
    const newFile = new File([blob], item.file.name, { type: blob.type });

    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);

    item.file = newFile;
    item.previewUrl = URL.createObjectURL(blob);
  }
};

// 计算 MD5
const calculateMD5 = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const chunkSize = 2 * 1024 * 1024;
    let currentChunk = 0;
    const chunks = Math.ceil(file.size / chunkSize);

    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      currentChunk++;
      if (onProgress) {
        onProgress(Math.round((currentChunk / chunks) * 100));
      }
      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };
    reader.onerror = () => reject(reader.error);

    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    };
    loadNext();
  });
};

// ==================== 进度持久化 ====================
interface PersistedUpload {
  fileName: string;
  fileSize: number;
  fileMd5: string;
  taskId: string;
  uploadedParts: number[];
  totalChunks: number;
  timestamp: number;
}

const saveUploadProgress = (item: FileItem, totalChunks: number) => {
  if (!item.fileMd5 || !item.taskId) return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: Record<string, PersistedUpload> = stored ? JSON.parse(stored) : {};
    data[item.fileMd5] = {
      fileName: item.file.name,
      fileSize: item.file.size,
      fileMd5: item.fileMd5,
      taskId: item.taskId,
      uploadedParts: item.uploadedParts || [],
      totalChunks,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("保存上传进度失败", e);
  }
};

const loadUploadProgress = (fileMd5: string): PersistedUpload | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data: Record<string, PersistedUpload> = JSON.parse(stored);
    const item = data[fileMd5];
    // 24小时内有效
    if (item && Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
      return item;
    }
    return null;
  } catch {
    return null;
  }
};

const clearUploadProgress = (fileMd5: string) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const data: Record<string, PersistedUpload> = JSON.parse(stored);
    delete data[fileMd5];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("清除上传进度失败", e);
  }
};

// ==================== 并发控制 ====================
class ConcurrencyQueue {
  private queue: (() => Promise<void>)[] = [];
  private running = 0;
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  async add(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          await task();
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          this.running--;
          this.runNext();
        }
      };
      this.queue.push(wrappedTask);
      this.runNext();
    });
  }

  private runNext() {
    while (this.running < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        this.running++;
        task();
      }
    }
  }

  setMaxConcurrency(value: number) {
    this.maxConcurrency = value;
  }
}

const chunkQueue = new ConcurrencyQueue(config.concurrency);

// 普通上传
const uploadSingleFile = async (item: FileItem) => {
  item.status = "uploading";
  item.progress = 0;

  try {
    const res = await uploadFile(
      {
        fileBucket: "default",
        fileName: item.file.name,
        ossType: "FILESYSTEM",
      },
      item.file
    );

    if (res.code === 200) {
      item.status = "success";
      item.progress = 100;
      item.result = res.data;
    } else {
      item.status = "error";
      message(res.msg || "上传失败", { type: "error" });
    }
  } catch {
    item.status = "error";
  }
};

// 分片上传（支持秒传、断点续传、并发控制）
const uploadChunkedFile = async (item: FileItem) => {
  item.status = "uploading";
  item.progress = 0;

  try {
    // 计算MD5
    const fileMd5 = await calculateMD5(item.file, (percent) => {
      // MD5计算进度占总进度的10%
      item.progress = Math.round(percent * 0.1);
    });
    item.fileMd5 = fileMd5;

    const fileName = item.file.name;
    const fileType = fileName.substring(fileName.lastIndexOf(".") + 1);
    const chunkSize =
      (props.setting?.sysFileSystemSettingChunkSizeMb || 100) * 1024 * 1024;
    const totalChunks = Math.ceil(item.file.size / chunkSize);

    // 1. 秒传检查
    if (config.enableInstantUpload) {
      const instantRes = await checkInstantUpload({
        fileMd5,
        fileSize: item.file.size,
        fileName,
        fileBucket: "default",
      });
      if (instantRes.code === 200 && instantRes.data?.canInstantUpload) {
        item.status = "success";
        item.progress = 100;
        item.result = { url: instantRes.data.existingFileUrl };
        message("文件秒传成功", { type: "success" });
        return;
      }
    }

    // 2. 断点续传检查
    let taskId: string;
    let uploadedParts: number[] = [];

    if (config.enableResume) {
      // 先检查本地缓存
      const localProgress = loadUploadProgress(fileMd5);
      if (localProgress && localProgress.taskId) {
        // 验证服务端任务是否存在
        const resumeRes = await findTaskByMd5(fileMd5, item.file.size);
        if (resumeRes.code === 200 && resumeRes.data?.taskId) {
          taskId = resumeRes.data.taskId;
          uploadedParts = resumeRes.data.uploadedParts || [];
          item.taskId = taskId;
          item.uploadedParts = uploadedParts;
          message(`检测到未完成任务，已上传 ${uploadedParts.length}/${totalChunks} 分片`, { type: "info" });
        }
      }
    }

    // 3. 创建新任务（如果没有续传任务）
    if (!taskId!) {
      const taskRes = await createUploadTask({
        fileName,
        fileMd5,
        fileType,
        fileBucket: "default",
        ssoType: "FILESYSTEM",
        fileSize: item.file.size,
      });

      if (taskRes.code !== 200 || !taskRes.data) {
        throw new Error(taskRes.msg || "创建任务失败");
      }

      taskId = taskRes.data.taskId;
      item.taskId = taskId;

      // 服务端秒传检查
      if (taskRes.data.url) {
        item.status = "success";
        item.progress = 100;
        item.result = { url: taskRes.data.url };
        clearUploadProgress(fileMd5);
        message("文件秒传成功", { type: "success" });
        return;
      }
    }

    // 4. 并发上传分片
    const uploadedSet = new Set(uploadedParts);
    let completedChunks = uploadedParts.length;
    const baseProgress = 10; // MD5计算占用的10%

    // 创建分片上传任务
    const chunkTasks: Promise<void>[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const partNumber = i + 1;
      
      // 跳过已上传的分片
      if (uploadedSet.has(partNumber)) {
        continue;
      }

      const task = chunkQueue.add(async () => {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, item.file.size);
        const chunk = item.file.slice(start, end);

        const partRes = await uploadTaskPart(
          { taskId, partNumber },
          chunk
        );
        if (partRes.code !== 200) {
          throw new Error(partRes.msg || `分片 ${partNumber} 上传失败`);
        }

        completedChunks++;
        item.uploadedParts = item.uploadedParts || [];
        item.uploadedParts.push(partNumber);
        item.progress = baseProgress + Math.round((completedChunks / totalChunks) * (100 - baseProgress));
        
        // 保存进度
        saveUploadProgress(item, totalChunks);
      });
      
      chunkTasks.push(task);
    }

    // 等待所有分片上传完成
    await Promise.all(chunkTasks);

    // 上传完成，清除进度
    clearUploadProgress(fileMd5);
    item.status = "success";
    item.progress = 100;
  } catch (e: unknown) {
    item.status = "error";
    const errMsg = e instanceof Error ? e.message : "上传失败";
    message(errMsg, { type: "error" });
  }
};

// 开始上传
const startUpload = async () => {
  if (fileList.value.length === 0) return;

  isUploading.value = true;
  uploadStats.total = fileList.value.length;
  uploadStats.success = 0;
  uploadStats.error = 0;

  const pending = fileList.value.filter((f) => f.status === "pending");

  for (const item of pending) {
    if (
      config.uploadMode === "chunk" &&
      props.setting?.sysFileSystemSettingChunkEnabled
    ) {
      await uploadChunkedFile(item);
    } else {
      await uploadSingleFile(item);
    }

    if (item.status === "success") {
      uploadStats.success++;
    } else if (item.status === "error") {
      uploadStats.error++;
    }
  }

  isUploading.value = false;

  if (uploadStats.success > 0) {
    message(`成功上传 ${uploadStats.success} 个文件`, { type: "success" });
    emit("uploaded");
  }
  if (uploadStats.error > 0) {
    message(`${uploadStats.error} 个文件上传失败`, { type: "warning" });
  }
};

// 监听关闭清理
watch(visible, (val) => {
  if (!val) {
    clearFiles();
    uploadStats.total = 0;
    uploadStats.success = 0;
    uploadStats.error = 0;
  }
});

// Socket监听上传进度
onMounted(() => {
  // 监听服务端推送的上传进度
  const socket = configStore.getSocket();
  if (socket) {
    socket.on("service:file:upload:progress", (data: {
      taskId: string;
      progress: number;
      status: string;
      message?: string;
    }) => {
      // 查找对应的文件项
      const item = fileList.value.find(f => f.taskId === data.taskId);
      if (item) {
        if (data.status === "completed") {
          item.status = "success";
          item.progress = 100;
        } else if (data.status === "error") {
          item.status = "error";
          message(data.message || "服务端处理失败", { type: "error" });
        } else if (data.status === "merging") {
          // 合并中状态
          item.progress = Math.max(item.progress, 95);
        }
      }
    });
  }
});

onUnmounted(() => {
  // 移除监听
  const socket = configStore.getSocket();
  if (socket) {
    socket.off("service:file:upload:progress");
  }
});
</script>

<style lang="scss" scoped>
.upload-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.upload-config {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.upload-area {
  border: 2px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 48px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-fill-color-lighter);

  &:hover,
  &.is-dragover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .upload-icon {
    font-size: 48px;
    color: var(--el-color-primary);
  }

  .main-text {
    margin: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .sub-text {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.file-list {
  margin-top: 20px;

  .list-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .file-items {
    max-height: 300px;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-bottom: 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px solid transparent;

    &.status-success {
      border-color: var(--el-color-success-light-5);
      background: var(--el-color-success-light-9);
    }

    &.status-error {
      border-color: var(--el-color-danger-light-5);
      background: var(--el-color-danger-light-9);
    }

    &.status-uploading {
      border-color: var(--el-color-primary-light-5);
    }
  }

  .file-preview {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color-light);
    flex-shrink: 0;

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      cursor: pointer;
    }

    .preview-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .file-info {
    flex: 1;
    min-width: 0;

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .file-status {
        color: var(--el-color-primary);
      }
    }
  }

  .file-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-stats {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .footer-buttons {
    display: flex;
    gap: 12px;
  }
}
</style>
