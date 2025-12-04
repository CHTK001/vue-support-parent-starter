<template>
  <el-dialog
    v-model="visible"
    title="文件上传"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="upload-dialog">
      <!-- 拖拽上传区域 -->
      <div
        class="upload-area"
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
            <p class="secondary-text">支持多文件上传，单个文件最大 100MB</p>
          </div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />
      </div>

      <!-- 文件列表 -->
      <div v-if="fileList.length" class="file-list">
        <div class="list-header">
          <span>待上传文件 ({{ fileList.length }})</span>
          <el-button size="small" text @click="clearFiles">
            <IconifyIconOnline icon="ri:delete-bin-line" />
            清空
          </el-button>
        </div>
        <div class="list-content">
          <div v-for="(file, index) in fileList" :key="index" class="file-item">
            <div class="file-info">
              <IconifyIconOnline
                :icon="getFileIcon(file.name)"
                class="file-icon"
              />
              <div class="file-details">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
            <div class="file-actions">
              <el-button
                size="small"
                text
                type="danger"
                @click="removeFile(index)"
              >
                <IconifyIconOnline icon="ri:close-line" />
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传配置 -->
      <div class="upload-config">
        <el-form :model="uploadConfig" label-width="100px" size="small">
          <el-form-item label="并发数">
            <el-input-number
              v-model="uploadConfig.concurrent"
              :min="1"
              :max="5"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="配置信息" v-if="systemConfig">
            <div class="config-info">
              <span class="config-item"
                >分片大小: {{ systemConfig.chunkSize }}MB</span
              >
              <span class="config-item"
                >最大文件: {{ systemConfig.maxFileSize }}MB</span
              >
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="!fileList.length || uploading"
          :loading="uploading"
          @click="startUpload"
        >
          {{ uploading ? "上传中..." : "开始上传" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import SparkMD5 from "spark-md5";
import {
  initChunkUpload,
  uploadChunk,
  checkUploadStatus,
  getFileSystemConfig,
} from "@/api/monitor/filesystem";

// Props & Emits
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "upload-success": [];
}>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const fileInputRef = ref<HTMLInputElement>();
const fileList = ref<File[]>([]);
const isDragOver = ref(false);
const uploading = ref(false);
const systemConfig = ref<FileSystemConfig | null>(null);

// 上传配置
const uploadConfig = reactive({
  concurrent: 2, // 并发数 (默认值)
  retryCount: 3, // 重试次数 (默认值)
});

/**
 * 处理文件选择
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    addFiles(Array.from(target.files));
    target.value = ""; // 清空input，允许重复选择同一文件
  }
};

/**
 * 处理拖拽
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

/**
 * 触发文件选择
 */
const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

/**
 * 添加文件
 */
const addFiles = (files: File[]) => {
  // 检查系统配置是否加载
  if (!systemConfig.value) {
    ElMessage.error("系统配置未加载，请稍后重试");
    return;
  }

  const maxSize = systemConfig.value.maxFileSize * 1024 * 1024; // 转换为字节
  const validFiles = files.filter((file) => {
    if (file.size > maxSize) {
      ElMessage.warning(
        `文件 ${file.name} 超过 ${systemConfig.value!.maxFileSize}MB 限制，已跳过`
      );
      return false;
    }
    return true;
  });

  // 去重
  const existingNames = new Set(fileList.value.map((f) => f.name));
  const newFiles = validFiles.filter((file) => !existingNames.has(file.name));

  if (newFiles.length !== validFiles.length) {
    ElMessage.warning("部分文件已存在，已跳过重复文件");
  }

  fileList.value.push(...newFiles);

  if (newFiles.length > 0) {
    ElMessage.success(`已添加 ${newFiles.length} 个文件`);
  }
};

/**
 * 移除文件
 */
const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
};

/**
 * 清空文件
 */
const clearFiles = () => {
  fileList.value = [];
};

/**
 * 计算文件MD5哈希值
 */
const calculateFileMD5 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();

    reader.onload = (e) => {
      try {
        spark.append(e.target?.result as ArrayBuffer);
        const md5Hash = spark.end();
        resolve(md5Hash);
      } catch (error) {
        console.error("计算MD5失败:", error);
        reject(error);
      }
    };

    reader.onerror = () => {
      console.error("读取文件失败");
      reject(new Error("读取文件失败"));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * 开始上传
 */
const startUpload = async () => {
  if (!fileList.value.length) return;

  uploading.value = true;

  try {
    for (const file of fileList.value) {
      await uploadSingleFile(file);
    }

    ElMessage.success("所有文件上传完成");
    emit("upload-success");
    handleClose();
  } catch (error) {
    console.error("上传失败:", error);
    ElMessage.error("上传失败");
  } finally {
    uploading.value = false;
  }
};

/**
 * 上传单个文件
 */
const uploadSingleFile = async (file: File) => {
  // 计算文件MD5
  const fileMd5 = await calculateFileMD5(file);

  // 检查系统配置
  if (!systemConfig.value) {
    throw new Error("系统配置未加载");
  }

  const chunkSize = systemConfig.value.chunkSize * 1024 * 1024; // 转换为字节

  // 初始化分片上传
  const initRes = await initChunkUpload({
    fileName: file.name,
    fileSize: file.size,
    fileMd5,
    chunkSize: chunkSize,
  });

  if (initRes.code !== "00000" || !initRes.data) {
    throw new Error(initRes.msg || "初始化上传失败");
  }

  const { fileId, chunkTotal, exists, message } = initRes.data;

  // 如果文件已存在，直接返回成功
  if (exists) {
    console.log(`文件 ${file.name} 已存在，跳过上传: ${message}`);
    ElMessage.success(`文件 ${file.name} 已存在，无需重复上传`);
    return; // 直接返回，不进行分片上传
  }

  // 分片上传
  const chunks: Promise<void>[] = [];
  for (let i = 0; i < chunkTotal; i++) {
    chunks.push(uploadFileChunk(file, fileId, i, chunkSize));
  }

  // 控制并发数
  await Promise.all(chunks);
};

/**
 * 上传文件分片
 */
const uploadFileChunk = async (
  file: File,
  fileId: number,
  chunkNumber: number,
  chunkSize: number
) => {
  const start = chunkNumber * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  const chunk = file.slice(start, end);

  const formData = new FormData();
  formData.append("fileId", fileId.toString());
  formData.append("chunkNumber", chunkNumber.toString());
  formData.append("file", chunk); // 后端期望的参数名是"file"

  const res = await uploadChunk(formData);
  if (res.code !== "00000") {
    throw new Error(`分片${chunkNumber}上传失败: ${res.message}`);
  }
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 获取文件图标
 */
const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    // 图片
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    webp: "ri:image-line",
    // 视频
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mov: "ri:video-line",
    // 音频
    mp3: "ri:music-line",
    wav: "ri:music-line",
    // 文档
    pdf: "ri:file-pdf-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",
    txt: "ri:file-text-line",
    // 压缩包
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    // 代码
    js: "ri:code-line",
    ts: "ri:code-line",
    vue: "ri:code-line",
    html: "ri:code-line",
    css: "ri:code-line",
    java: "ri:code-line",
    py: "ri:code-line",
  };
  return iconMap[ext || ""] || "ri:file-line";
};

/**
 * 加载系统配置
 */
const loadConfig = async () => {
  try {
    const result = await getFileSystemConfig();
    if (result.code === "00000" && result.data) {
      const config = result.data;
      systemConfig.value = config;
      uploadConfig.concurrent = config.maxConcurrent || 3;
      uploadConfig.retryCount = config.retryCount || 3;
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    ElMessage.error("加载配置失败");
  }
};

/**
 * 处理关闭
 */
const handleClose = () => {
  if (!uploading.value) {
    fileList.value = [];
    visible.value = false;
  }
};

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    loadConfig(); // 打开时加载配置
  } else {
    // 关闭时清理数据
    fileList.value = [];
    uploading.value = false;
  }
});

// 组件挂载时加载配置
onMounted(() => {
  loadConfig();
});
</script>

<style scoped lang="scss">
.upload-dialog {
  .upload-area {
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 20px;

    &:hover,
    &.is-dragover {
      border-color: #409eff;
      background-color: #f0f9ff;
    }

    .upload-content {
      .upload-icon {
        font-size: 48px;
        color: #c0c4cc;
        margin-bottom: 16px;
      }

      .upload-text {
        .primary-text {
          font-size: 16px;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .secondary-text {
          font-size: 14px;
           color: var(--el-text-color-primary);
          margin: 0;
        }
      }
    }
  }

  .file-list {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 20px;

    .list-header {
      padding: 12px 16px;
      background: var(--el-bg-color-overlay);
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }

    .list-content {
      max-height: 200px;
      overflow-y: auto;

      .file-item {
        padding: 12px 16px;
        border-bottom: 1px solid var(--el-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;

        &:last-child {
          border-bottom: none;
        }

        .file-info {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;

          .file-icon {
            font-size: 20px;
            color: #409eff;
            margin-right: 12px;
          }

          .file-details {
            flex: 1;
            min-width: 0;

            .file-name {
              font-size: 14px;
              color: var(--el-text-color-primary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              margin-bottom: 4px;
            }

            .file-size {
              font-size: 12px;
               color: var(--el-text-color-primary);
            }
          }
        }

        .file-actions {
          margin-left: 12px;
        }
      }
    }
  }

  .upload-config {
    background: #f9fafc;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #ebeef5;

    .config-info {
      display: flex;
      gap: 16px;
      align-items: center;

      .config-item {
        padding: 4px 8px;
        background: #e1f3d8;
        color: #67c23a;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
    }
  }
}
</style>
