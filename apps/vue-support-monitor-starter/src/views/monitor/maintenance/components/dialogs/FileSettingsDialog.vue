<template>
  <el-dialog v-model="visible" title="文件上传设置" width="500px" :close-on-click-modal="false" :before-close="handleDialogClose">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="目标路径" prop="maintenanceFilePath">
        <el-input v-model="form.maintenanceFilePath" placeholder="请输入文件上传的目标路径，如：/usr/local/app" />
      </el-form-item>
      <el-form-item label="自动解压" prop="maintenanceFileExtract">
        <el-switch v-model="form.maintenanceFileExtract" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
        <div class="form-tip">仅支持zip、tar、tar.gz、tar.bz2格式的压缩文件</div>
      </el-form-item>
      <el-form-item label="覆盖已有文件" prop="maintenanceFileOverride">
        <el-switch v-model="form.maintenanceFileOverride" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
      </el-form-item>
      <el-form-item label="选择文件">
        <div class="selected-files">
          <template v-if="selectedFiles.length > 0">
            <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file-item">
              <IconifyIconOnline :icon="getFileIcon(file.name)" class="file-icon" />
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
              <IconifyIconOnline icon="ri:close-circle-line" class="remove-icon" @click="removeSelectedFile(index)" />
            </div>
          </template>
          <div v-else class="no-files">暂未选择文件</div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="upload" :loading="uploading">开始上传</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, defineEmits, defineExpose } from "vue";

const emit = defineEmits(["update:visible", "upload", "close"]);

const visible = ref(false);
const formRef = ref(null);
const uploading = ref(false);
const selectedFiles = ref([]);

// 表单数据
const form = reactive({
  maintenanceFilePath: "/",
  maintenanceFileExtract: 0,
  maintenanceFileOverride: 0
});

// 表单验证规则
const rules = {
  maintenanceFilePath: [{ required: true, message: "请输入目标路径", trigger: "blur" }]
};

// 打开对话框
const open = files => {
  selectedFiles.value = files || [];
  form.maintenanceFilePath = "/";
  form.maintenanceFileExtract = 0;
  form.maintenanceFileOverride = 0;
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  handleDialogClose();
  emit("close");
};

// 处理对话框关闭
const handleDialogClose = () => {
  selectedFiles.value = [];
  formRef.value?.resetFields();
};

// 移除选择的文件
const removeSelectedFile = index => {
  selectedFiles.value.splice(index, 1);
};

// 格式化文件大小
const formatFileSize = size => {
  if (size === null || size === undefined) return "未知";

  // 将字节转换为更友好的单位
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let formattedSize = size;

  while (formattedSize >= 1024 && i < units.length - 1) {
    formattedSize /= 1024;
    i++;
  }

  return `${formattedSize.toFixed(2)} ${units[i]}`;
};

// 获取文件图标
const getFileIcon = fileName => {
  if (!fileName) return "ri:file-line";

  const ext = fileName.split(".").pop().toLowerCase();

  switch (ext) {
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
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      return "ri:image-line";
    case "zip":
    case "rar":
    case "tar":
    case "gz":
    case "bz2":
      return "ri:file-zip-line";
    case "sh":
    case "bash":
      return "ri:terminal-line";
    case "py":
      return "ri:python-line";
    case "js":
      return "ri:javascript-line";
    case "java":
      return "ri:java-line";
    case "html":
    case "htm":
      return "ri:html5-line";
    case "css":
      return "ri:css3-line";
    default:
      return "ri:file-line";
  }
};

// 上传文件
const upload = () => {
  if (selectedFiles.value.length === 0) {
    return;
  }

  if (formRef.value) {
    formRef.value.validate(valid => {
      if (valid) {
        uploading.value = true;
        // 触发上传事件
        emit("upload", {
          files: selectedFiles.value,
          maintenanceFilePath: form.maintenanceFilePath,
          maintenanceFileExtract: form.maintenanceFileExtract,
          maintenanceFileOverride: form.maintenanceFileOverride
        });
      }
    });
  }
};

defineExpose({
  open,
  close,
  uploading: {
    get: () => uploading.value,
    set: val => (uploading.value = val)
  }
});
</script>

<style lang="scss" scoped>
.selected-files {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;

  .no-files {
    color: var(--el-text-color-secondary);
    padding: 16px;
    text-align: center;
  }

  .selected-file-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    .file-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
    }

    .file-name {
      flex: 1;
      word-break: break-all;
    }

    .file-size {
      color: var(--el-text-color-secondary);
      margin: 0 8px;
    }

    .remove-icon {
      color: var(--el-color-danger);
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
