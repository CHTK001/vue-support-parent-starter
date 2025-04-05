<template>
  <el-dialog v-model="visible" title="文件上传" top="10px" width="500px" :close-on-click-modal="false">
    <el-form :model="form" label-width="100px">
      <el-form-item label="目标路径">
        <el-input v-model="form.path" placeholder="请输入文件上传的目标路径，如：/usr/local/app" />
      </el-form-item>
      <el-form-item label="自动解压">
        <el-switch v-model="form.extract" />
        <div class="upload-tip">仅支持zip、tar、tar.gz、tar.bz2格式的压缩文件</div>
      </el-form-item>
      <el-form-item label="覆盖已有文件">
        <el-switch v-model="form.override" />
      </el-form-item>
      <el-form-item label="选择文件">
        <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
          <input ref="fileInputRef" type="file" style="display: none" @change="handleFileSelect" />
          <div class="upload-content">
            <IconifyIconOnline icon="ri:upload-cloud-2-line" class="upload-icon" />
            <div class="upload-text">
              <span>点击上传文件或将文件拖放到此处</span>
              <span class="upload-hint">支持多个文件同时上传</span>
            </div>
          </div>
          <div v-if="selectedFiles.length > 0" class="selected-files">
            <div class="selected-files-title">已选择 {{ selectedFiles.length }} 个文件：</div>
            <div class="selected-file-list">
              <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file-item">
                <span class="selected-file-name">{{ file.name }}</span>
                <span class="selected-file-size">({{ formatFileSize(file.size) }})</span>
                <el-button type="danger" size="small" circle @click.stop="removeFile(index)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" :disabled="selectedFiles.length === 0" @click="upload">开始上传</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineEmits, defineExpose } from "vue";

const emit = defineEmits(["update:visible", "upload", "close"]);

const visible = ref(false);
const form = reactive({
  path: "/home",
  extract: true,
  override: true
});
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const uploading = ref(false);

// 显示对话框
const open = () => {
  visible.value = true;
  selectedFiles.value = [];
  form.path = "/home";
  form.extract = true;
  form.override = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit("close");
};

// 点击触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileSelect = event => {
  const files = event.target.files;
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      selectedFiles.value.push(files[i]);
    }
  }
  // 重置文件输入以允许重新选择相同的文件
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// 处理文件拖放
const handleDrop = event => {
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      selectedFiles.value.push(files[i]);
    }
  }
};

// 移除已选择的文件
const removeFile = index => {
  selectedFiles.value.splice(index, 1);
};

// 格式化文件大小
const formatFileSize = bytes => {
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
};

// 上传文件
const upload = () => {
  if (selectedFiles.value.length === 0) return;
  uploading.value = true;

  // 触发上传事件
  emit("upload", {
    files: selectedFiles.value,
    path: form.path,
    extract: form.extract,
    override: form.override
  });
};

defineExpose({
  open,
  close,
  selectedFiles,
  uploading: {
    get: () => uploading.value,
    set: val => (uploading.value = val)
  }
});
</script>

<style lang="scss" scoped>
.upload-area {
  width: 100%;
  border: 2px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.3s;

  &:hover {
    border-color: var(--el-color-primary);
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;

    .upload-icon {
      font-size: 48px;
      color: var(--el-color-primary);
      margin-bottom: 16px;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
      align-items: center;

      .upload-hint {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 8px;
      }
    }
  }

  .selected-files {
    padding: 16px;
    border-top: 1px dashed var(--el-border-color);

    .selected-files-title {
      margin-bottom: 8px;
      font-weight: 500;
    }

    .selected-file-list {
      max-height: 200px;
      overflow-y: auto;

      .selected-file-item {
        display: flex;
        align-items: center;
        padding: 8px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        &:last-child {
          border-bottom: none;
        }

        .selected-file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .selected-file-size {
          color: var(--el-text-color-secondary);
          margin: 0 8px;
        }
      }
    }
  }
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
