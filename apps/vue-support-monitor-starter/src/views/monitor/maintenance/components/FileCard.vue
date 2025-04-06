<template>
  <div
    class="file-card"
    :class="{ 'drag-over': isDragOver, disabled: !file.maintenanceFileStatus }"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="onCardClick"
  >
    <div class="file-header">
      <div class="file-icon">
        <IconifyIconOnline :icon="getFileIcon(file.maintenanceFileName)" />
      </div>
      <div class="file-info">
        <div class="file-name" :title="file.maintenanceFileName">{{ file.maintenanceFileName }}</div>
        <div class="file-path" :title="file.maintenanceFilePath || '/'">
          <IconifyIconOnline icon="ri:folder-line" />
          <span>{{ file.maintenanceFilePath || "/" }}</span>
        </div>
      </div>
    </div>

    <div class="file-details">
      <div class="file-meta">
        <div class="file-size">
          <IconifyIconOnline icon="ri:file-size-line" />
          <span>{{ formatFileSize(file.maintenanceFileSize) }}</span>
        </div>
        <div class="file-type">
          <el-tag size="small" :type="getFileTypeColor(file.maintenanceFileType)">
            {{ getFileTypeDisplay(file.maintenanceFileType) }}
          </el-tag>
        </div>
      </div>

      <div class="file-settings">
        <el-tag size="small" :type="file.maintenanceFileOverride ? 'warning' : 'info'" :effect="file.maintenanceFileOverride ? 'light' : 'plain'">
          {{ file.maintenanceFileOverride ? "覆盖" : "不覆盖" }}
        </el-tag>
        <el-tag size="small" :type="file.maintenanceFileStatus ? 'success' : 'danger'">
          {{ file.maintenanceFileStatus ? "启用" : "禁用" }}
        </el-tag>
      </div>
    </div>

    <div class="file-actions">
      <el-button type="success" size="small" @click.stop="onSync">
        <IconifyIconOnline icon="ri:refresh-line" />
        同步
      </el-button>

      <el-dropdown trigger="click" @command="onCommand" @click.stop>
        <el-button size="small">
          <IconifyIconOnline icon="ri:more-line" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="deploy">
              <IconifyIconOnline icon="ri:server-line" />
              部署
            </el-dropdown-item>
            <el-dropdown-item command="replace">
              <IconifyIconOnline icon="ri:upload-line" />
              替换
            </el-dropdown-item>
            <el-dropdown-item command="edit">
              <IconifyIconOnline icon="ri:edit-line" />
              编辑
            </el-dropdown-item>
            <el-dropdown-item command="status">
              <IconifyIconOnline :icon="file.maintenanceFileStatus ? 'ri:forbid-line' : 'ri:check-line'" />
              {{ file.maintenanceFileStatus ? "禁用" : "启用" }}
            </el-dropdown-item>
            <el-dropdown-item command="download">
              <IconifyIconOnline icon="ri:download-line" />
              下载
            </el-dropdown-item>
            <el-dropdown-item command="delete" divided>
              <IconifyIconOnline icon="ri:delete-bin-line" class="text-danger" />
              删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div v-if="isDragOver" class="drag-overlay">
      <div class="overlay-content">
        <IconifyIconOnline icon="ri:upload-cloud-fill" />
        <span>释放鼠标替换此文件</span>
      </div>
    </div>

    <input ref="fileInputRef" type="file" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";
import { ElMessageBox } from "element-plus";

const props = defineProps({
  file: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["sync", "edit", "command", "replace"]);

const fileInputRef = ref(null);
const isDragOver = ref(false);

// 处理拖拽事件
const onDragOver = event => {
  event.preventDefault();
  isDragOver.value = true;
};

const onDragLeave = event => {
  event.preventDefault();
  isDragOver.value = false;
};

const onDrop = event => {
  event.preventDefault();
  isDragOver.value = false;

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    confirmReplace(files[0]);
  }
};

// 处理卡片点击事件
const onCardClick = () => {
  emit("edit", props.file);
};

// 同步按钮点击
const onSync = event => {
  event.stopPropagation();
  emit("sync", props.file);
};

// 处理下拉菜单命令
const onCommand = command => {
  if (command === "replace") {
    fileInputRef.value?.click();
  } else {
    emit("command", command, props.file);
  }
};

// 处理文件选择
const handleFileChange = event => {
  const files = event.target.files;
  if (files.length > 0) {
    confirmReplace(files[0]);
  }

  // 重置文件输入以允许重复选择同一文件
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// 确认替换文件
const confirmReplace = file => {
  ElMessageBox.confirm(`确定要用文件 "${file.name}" 替换当前文件 "${props.file.maintenanceFileName}" 吗？`, "替换确认", {
    confirmButtonText: "确认替换",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      emit("replace", props.file.maintenanceFileId, file);
    })
    .catch(() => {
      // 用户取消替换操作
    });
};

// 获取文件图标
const getFileIcon = (fileName = "") => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // 根据文件扩展名返回对应的图标
  switch (extension) {
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return "ri:file-zip-line";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "bmp":
      return "ri:image-line";
    case "mp4":
    case "avi":
    case "mov":
    case "wmv":
    case "flv":
      return "ri:video-line";
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
    case "txt":
    case "log":
      return "ri:file-text-line";
    case "html":
    case "htm":
      return "ri:html5-line";
    case "css":
      return "ri:css3-line";
    case "js":
    case "mjs":
    case "cjs":
      return "ri:javascript-line";
    case "java":
      return "ri:terminal-box-line";
    case "xml":
    case "svg":
      return "ri:file-code-line";
    case "sh":
    case "bat":
    case "cmd":
      return "ri:terminal-line";
    case "json":
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
      return "ri:settings-3-line";
    default:
      return "ri:file-line";
  }
};

// 获取文件类型颜色
const getFileTypeColor = fileType => {
  if (!fileType) return "info";

  switch (fileType.toLowerCase()) {
    case "image":
    case "img":
      return "success";
    case "video":
      return "danger";
    case "audio":
      return "warning";
    case "document":
    case "doc":
      return "primary";
    case "archive":
    case "zip":
      return "warning";
    case "executable":
    case "exe":
      return "danger";
    case "script":
      return "info";
    default:
      return "info";
  }
};

// 获取文件类型显示文本
const getFileTypeDisplay = fileType => {
  if (!fileType) return "未知";

  switch (fileType.toLowerCase()) {
    case "image":
    case "img":
      return "图片";
    case "video":
      return "视频";
    case "audio":
      return "音频";
    case "document":
    case "doc":
      return "文档";
    case "archive":
    case "zip":
      return "压缩包";
    case "executable":
    case "exe":
      return "可执行文件";
    case "script":
      return "脚本";
    default:
      return fileType;
  }
};

// 格式化文件大小
const formatFileSize = size => {
  if (size === null || size === undefined) return "未知";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let fileSize = size;
  let unitIndex = 0;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
};
</script>

<style lang="scss" scoped>
.file-card {
  position: relative;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }

  &.drag-over {
    border: 2px dashed var(--el-color-primary);
    background-color: rgba(var(--el-color-primary-rgb), 0.05);
  }

  &.disabled {
    opacity: 0.7;
    background-color: #f8f8f8;
  }

  .file-header {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;

    .file-icon {
      font-size: 32px;
      margin-right: 12px;
      color: var(--el-color-primary);
    }

    .file-info {
      flex: 1;
      min-width: 0;

      .file-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
        line-height: 1.3;
        word-break: break-word;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-path {
        display: flex;
        align-items: center;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        gap: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .file-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 12px;

    .file-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .file-size {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .file-settings {
      display: flex;
      gap: 6px;
    }
  }

  .file-actions {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
  }

  .drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;

    .overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: var(--el-color-primary);

      .iconify {
        font-size: 36px;
        margin-bottom: 8px;
      }

      span {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}
</style>
 