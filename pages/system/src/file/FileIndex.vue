<template>
  <div class="file-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:folder-upload-line" class="title-icon" />
            文件管理
          </h1>
          <p class="page-subtitle">单机文件上传与管理</p>
        </div>
      </div>
    </div>

    <div class="content-area">
      <!-- 上传配置区域 -->
      <div class="upload-config-section">
        <el-card class="config-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:settings-4-line" class="header-icon" />
              <span>上传配置</span>
            </div>
          </template>
          <el-form :model="uploadConfig" label-width="100px" class="config-form">
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="存储桶">
                  <el-input
                    v-model="uploadConfig.fileBucket"
                    placeholder="请输入存储桶名称"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:archive-line" />
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="OSS类型">
                  <el-select
                    v-model="uploadConfig.ossType"
                    placeholder="请选择OSS类型"
                    style="width: 100%"
                  >
                    <el-option label="本地存储" value="FILESYSTEM" />
                    <el-option label="七牛云" value="QINIU" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="上传方式">
                  <el-radio-group v-model="uploadMode">
                    <el-radio value="normal">普通上传</el-radio>
                    <el-radio value="chunk">分片上传</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </div>

      <!-- 文件上传区域 -->
      <div class="upload-section">
        <el-card class="upload-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" class="header-icon" />
              <span>文件上传</span>
              <div class="header-actions">
                <el-button
                  type="primary"
                  :icon="Upload"
                  :disabled="!canUpload"
                  :loading="uploading"
                  @click="handleUpload"
                >
                  开始上传
                </el-button>
                <el-button :icon="Delete" @click="clearFiles">清空列表</el-button>
              </div>
            </div>
          </template>

          <!-- 拖拽上传区域 -->
          <div
            class="upload-dragger"
            :class="{ 'is-dragover': isDragover }"
            @dragover.prevent="handleDragover"
            @dragleave.prevent="handleDragleave"
            @drop.prevent="handleDrop"
            @click="triggerFileSelect"
          >
            <input
              ref="fileInputRef"
              type="file"
              multiple
              style="display: none"
              @change="handleFileSelect"
            />
            <div class="upload-content">
              <div class="upload-icon-wrapper">
                <IconifyIconOnline
                  :icon="isDragover ? 'ri:download-2-line' : 'ri:upload-cloud-2-line'"
                  class="upload-icon"
                />
              </div>
              <div class="upload-text">
                <p class="main-text">拖拽文件到此处，或点击选择文件</p>
                <p class="sub-text">支持多文件上传，单个文件最大 500MB</p>
              </div>
            </div>
          </div>

          <!-- 文件列表 -->
          <div v-if="fileList.length > 0" class="file-list">
            <div class="list-header">
              <span class="file-count">已选择 {{ fileList.length }} 个文件</span>
              <span class="total-size">总大小: {{ formatFileSize(totalSize) }}</span>
            </div>
            <div class="file-items">
              <div
                v-for="(file, index) in fileList"
                :key="index"
                class="file-item"
                :class="{ 'is-uploading': file.status === 'uploading', 'is-success': file.status === 'success', 'is-error': file.status === 'error' }"
              >
                <div class="file-icon">
                  <IconifyIconOnline :icon="getFileIcon(file.file.type)" />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ file.file.name }}</div>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(file.file.size) }}</span>
                    <span v-if="file.status === 'success'" class="file-status success">
                      <IconifyIconOnline icon="ri:check-line" /> 上传成功
                    </span>
                    <span v-else-if="file.status === 'error'" class="file-status error">
                      <IconifyIconOnline icon="ri:close-line" /> 上传失败
                    </span>
                    <span v-else-if="file.status === 'uploading'" class="file-status uploading">
                      上传中...
                    </span>
                  </div>
                  <!-- 进度条 -->
                  <el-progress
                    v-if="file.status === 'uploading'"
                    :percentage="file.progress || 0"
                    :stroke-width="4"
                    class="file-progress"
                  />
                </div>
                <div class="file-actions">
                  <el-button
                    v-if="file.status !== 'uploading'"
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    @click="removeFile(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 上传历史 -->
      <div class="history-section">
        <el-card class="history-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:history-line" class="header-icon" />
              <span>上传历史</span>
              <div class="header-actions">
                <el-button text type="primary" @click="clearHistory">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  清空历史
                </el-button>
              </div>
            </div>
          </template>
          <div v-if="uploadHistory.length > 0" class="history-list">
            <div
              v-for="(item, index) in uploadHistory"
              :key="index"
              class="history-item"
            >
              <div class="history-icon">
                <IconifyIconOnline :icon="getFileIcon(item.type)" />
              </div>
              <div class="history-info">
                <div class="history-name">{{ item.name }}</div>
                <div class="history-meta">
                  <span>{{ formatFileSize(item.size) }}</span>
                  <span>{{ item.time }}</span>
                </div>
              </div>
              <div class="history-url">
                <el-input
                  v-model="item.url"
                  readonly
                  size="small"
                  class="url-input"
                >
                  <template #append>
                    <el-button :icon="CopyDocument" @click="copyUrl(item.url)" />
                  </template>
                </el-input>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无上传历史" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { IconifyIconOnline } from "@repo/components";
import { Upload, Delete, CopyDocument } from "@element-plus/icons-vue";
import {
  uploadFile,
  createUploadTask,
  uploadTaskPart,
  type SysFileUploadRequest,
  type SysFileUploadTaskRequest,
  type PutObjectResult,
} from "../api/file";
import SparkMD5 from "spark-md5";

/**
 * 文件项接口
 */
interface FileItem {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  result?: PutObjectResult;
}

/**
 * 上传历史接口
 */
interface UploadHistoryItem {
  name: string;
  size: number;
  type: string;
  url: string;
  time: string;
}

// 上传配置
const uploadConfig = reactive<SysFileUploadRequest>({
  fileBucket: "default",
  ossType: "FILESYSTEM",
});

// 上传方式: normal-普通上传, chunk-分片上传
const uploadMode = ref<"normal" | "chunk">("normal");

// 文件列表
const fileList = ref<FileItem[]>([]);

// 上传历史
const uploadHistory = ref<UploadHistoryItem[]>([]);

// 状态
const isDragover = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// 分片大小 5MB
const CHUNK_SIZE = 5 * 1024 * 1024;

/**
 * 计算文件总大小
 */
const totalSize = computed(() => {
  return fileList.value.reduce((sum, item) => sum + item.file.size, 0);
});

/**
 * 是否可以上传
 */
const canUpload = computed(() => {
  return (
    fileList.value.length > 0 &&
    uploadConfig.fileBucket &&
    !uploading.value
  );
});

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 根据文件类型获取图标
 * @param type 文件MIME类型
 * @returns 图标名称
 */
function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "ri:image-line";
  if (type.startsWith("video/")) return "ri:video-line";
  if (type.startsWith("audio/")) return "ri:music-line";
  if (type.includes("pdf")) return "ri:file-pdf-line";
  if (type.includes("word") || type.includes("document"))
    return "ri:file-word-line";
  if (type.includes("excel") || type.includes("sheet"))
    return "ri:file-excel-line";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z"))
    return "ri:file-zip-line";
  return "ri:file-line";
}

/**
 * 触发文件选择
 */
function triggerFileSelect() {
  fileInputRef.value?.click();
}

/**
 * 处理文件选择
 * @param event 事件对象
 */
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
  }
  // 清空input值，允许重复选择相同文件
  input.value = "";
}

/**
 * 处理拖拽悬停
 */
function handleDragover() {
  isDragover.value = true;
}

/**
 * 处理拖拽离开
 */
function handleDragleave() {
  isDragover.value = false;
}

/**
 * 处理拖拽放置
 * @param event 拖拽事件
 */
function handleDrop(event: DragEvent) {
  isDragover.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
}

/**
 * 添加文件到列表
 * @param files 文件数组
 */
function addFiles(files: File[]) {
  const newItems: FileItem[] = files.map((file) => ({
    file,
    status: "pending",
    progress: 0,
  }));
  fileList.value.push(...newItems);
}

/**
 * 移除文件
 * @param index 文件索引
 */
function removeFile(index: number) {
  fileList.value.splice(index, 1);
}

/**
 * 清空文件列表
 */
function clearFiles() {
  fileList.value = [];
}

/**
 * 计算文件MD5
 * @param file 文件对象
 * @returns MD5值
 */
async function calculateMD5(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks for MD5
    let currentChunk = 0;
    const chunks = Math.ceil(file.size / chunkSize);

    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };

    reader.onerror = () => reject(reader.error);

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      reader.readAsArrayBuffer(file.slice(start, end));
    }

    loadNext();
  });
}

/**
 * 普通上传单个文件
 * @param fileItem 文件项
 */
async function uploadSingleFile(fileItem: FileItem) {
  fileItem.status = "uploading";
  fileItem.progress = 0;

  try {
    const result = await uploadFile(
      {
        fileBucket: uploadConfig.fileBucket,
        fileName: fileItem.file.name,
        ossType: uploadConfig.ossType,
      },
      fileItem.file
    );

    if (result.code === 200 && result.data) {
      fileItem.status = "success";
      fileItem.progress = 100;
      fileItem.result = result.data;

      // 添加到上传历史
      uploadHistory.value.unshift({
        name: fileItem.file.name,
        size: fileItem.file.size,
        type: fileItem.file.type,
        url: result.data.url || "",
        time: new Date().toLocaleString(),
      });
    } else {
      fileItem.status = "error";
      ElMessage.error(result.msg || "上传失败");
    }
  } catch (error) {
    fileItem.status = "error";
    ElMessage.error("上传失败");
  }
}

/**
 * 分片上传单个文件
 * @param fileItem 文件项
 */
async function uploadChunkedFile(fileItem: FileItem) {
  fileItem.status = "uploading";
  fileItem.progress = 0;

  try {
    // 计算文件MD5
    const fileMd5 = await calculateMD5(fileItem.file);

    // 获取文件扩展名
    const fileName = fileItem.file.name;
    const fileType = fileName.substring(fileName.lastIndexOf(".") + 1);

    // 创建分片任务
    const taskRequest: SysFileUploadTaskRequest = {
      fileName: fileName,
      fileMd5: fileMd5,
      fileType: fileType,
      fileBucket: uploadConfig.fileBucket,
      ssoType: uploadConfig.ossType,
      fileSize: fileItem.file.size,
    };

    const taskResult = await createUploadTask(taskRequest);

    if (taskResult.code !== 200 || !taskResult.data) {
      throw new Error(taskResult.msg || "创建上传任务失败");
    }

    const taskId = taskResult.data.taskId;

    // 如果已经有URL，说明文件已存在（秒传）
    if (taskResult.data.url) {
      fileItem.status = "success";
      fileItem.progress = 100;
      fileItem.result = { url: taskResult.data.url, name: fileName };

      uploadHistory.value.unshift({
        name: fileName,
        size: fileItem.file.size,
        type: fileItem.file.type,
        url: taskResult.data.url,
        time: new Date().toLocaleString(),
      });

      ElMessage.success("文件秒传成功");
      return;
    }

    // 分片上传
    const totalChunks = Math.ceil(fileItem.file.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileItem.file.size);
      const chunk = fileItem.file.slice(start, end);

      const partResult = await uploadTaskPart(
        {
          taskId: taskId,
          partNumber: i + 1,
        },
        chunk
      );

      if (partResult.code !== 200) {
        throw new Error(partResult.msg || `分片 ${i + 1} 上传失败`);
      }

      // 更新进度
      fileItem.progress = Math.round(((i + 1) / totalChunks) * 100);
    }

    fileItem.status = "success";
    fileItem.progress = 100;

    // 添加到上传历史
    uploadHistory.value.unshift({
      name: fileName,
      size: fileItem.file.size,
      type: fileItem.file.type,
      url: taskResult.data.url || "",
      time: new Date().toLocaleString(),
    });
  } catch (error: any) {
    fileItem.status = "error";
    ElMessage.error(error.message || "上传失败");
  }
}

/**
 * 处理上传
 */
async function handleUpload() {
  if (!canUpload.value) return;

  uploading.value = true;

  const pendingFiles = fileList.value.filter(
    (item) => item.status === "pending"
  );

  for (const fileItem of pendingFiles) {
    if (uploadMode.value === "chunk") {
      await uploadChunkedFile(fileItem);
    } else {
      await uploadSingleFile(fileItem);
    }
  }

  uploading.value = false;

  const successCount = fileList.value.filter(
    (item) => item.status === "success"
  ).length;
  const errorCount = fileList.value.filter(
    (item) => item.status === "error"
  ).length;

  if (successCount > 0) {
    ElMessage.success(`成功上传 ${successCount} 个文件`);
  }
  if (errorCount > 0) {
    ElMessage.warning(`${errorCount} 个文件上传失败`);
  }
}

/**
 * 复制URL到剪贴板
 * @param url URL地址
 */
async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.error("复制失败");
  }
}

/**
 * 清空上传历史
 */
function clearHistory() {
  uploadHistory.value = [];
  ElMessage.success("已清空上传历史");
}
</script>

<style lang="scss" scoped>
.file-management {
  padding: 0;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;

  .title-icon {
    font-size: 36px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 16px;
  margin: 0;
}

.content-area {
  padding: 0 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;

  .header-icon {
    font-size: 20px;
    color: var(--el-color-primary);
  }

  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 12px;
  }
}

.config-card,
.upload-card,
.history-card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.config-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.upload-dragger {
  border: 2px dashed var(--el-border-color);
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-fill-color-lighter);

  &:hover,
  &.is-dragover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);

    .upload-icon-wrapper {
      transform: scale(1.1);
      background: var(--el-color-primary);

      .upload-icon {
        color: #fff;
      }
    }
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--el-color-primary-light-8);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.upload-icon {
  font-size: 40px;
  color: var(--el-color-primary);
  transition: all 0.3s ease;
}

.upload-text {
  .main-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
  }

  .sub-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.file-list {
  margin-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-uploading {
    border-color: var(--el-color-primary-light-5);
  }

  &.is-success {
    border-color: var(--el-color-success-light-5);
    background: var(--el-color-success-light-9);
  }

  &.is-error {
    border-color: var(--el-color-danger-light-5);
    background: var(--el-color-danger-light-9);
  }
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: var(--el-color-primary-light-8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-status {
  display: flex;
  align-items: center;
  gap: 4px;

  &.success {
    color: var(--el-color-success);
  }

  &.error {
    color: var(--el-color-danger);
  }

  &.uploading {
    color: var(--el-color-primary);
  }
}

.file-progress {
  margin-top: 8px;
}

.file-actions {
  flex-shrink: 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--el-color-success-light-8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--el-color-success);
  flex-shrink: 0;
}

.history-info {
  flex: 0 0 200px;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-meta {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.history-url {
  flex: 1;
  min-width: 0;

  .url-input {
    :deep(.el-input__inner) {
      font-size: 12px;
    }
  }
}
</style>
