<template>
  <div class="re-upload" :class="[`re-upload--${type}`, { 'is-disabled': disabled }]">
    <el-upload
      :action="action"
      :headers="headers"
      :data="data"
      :name="name"
      :multiple="multiple"
      :accept="accept"
      :drag="drag"
      :list-type="listType"
      :show-file-list="showFileList"
      :limit="limit"
      :before-upload="handleBeforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :disabled="disabled"
      :file-list="fileList"
      v-bind="$attrs"
    >
      <template v-if="type === 'image' && !drag" #default>
        <div class="re-upload__image-trigger">
          <el-icon class="re-upload__image-icon">
            <Plus />
          </el-icon>
          <span class="re-upload__image-text">{{ triggerText }}</span>
        </div>
      </template>
      <template v-else-if="drag" #default>
        <div class="re-upload__drag-content">
          <el-icon class="re-upload__drag-icon">
            <UploadFilled />
          </el-icon>
          <div class="re-upload__drag-text">{{ dragText }}</div>
          <div class="re-upload__drag-hint">{{ dragHint }}</div>
        </div>
      </template>
      <template v-else #default>
        <el-button :disabled="disabled">
          <el-icon style="margin-right: 4px;"><Upload /></el-icon>
          {{ triggerText }}
        </el-button>
      </template>

      <template v-if="type === 'image' && !drag" #tip>
        <div class="re-upload__tip">{{ tipText }}</div>
      </template>
    </el-upload>

    <ReDialog
      v-model="previewVisible"
      :title="previewTitle"
      width="600px"
      append-to-body
    >
      <img v-if="previewUrl" :src="previewUrl" class="re-upload__preview-img" />
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * ReUpload —— 通用上传组件
 *
 * 基于 Element Plus Upload，支持拖拽/图片列表/多文件/限制
 *   <ReUpload v-model="files" :action="'/api/upload'" :type="'image'" />
 */
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Upload, UploadFilled } from "@element-plus/icons-vue";
import ReDialog from "../ReDialog";

interface UploadFileItem {
  name: string;
  url: string;
  uid?: string | number;
  status?: "ready" | "uploading" | "success" | "fail";
  response?: unknown;
  raw?: File;
}
export type { UploadFileItem };

interface Props {
  /** 双向绑定的文件列表 */
  modelValue?: UploadFileItem[];
  /** 上传地址 */
  action: string;
  /** 上传请求头 */
  headers?: Record<string, string>;
  /** 上传额外参数 */
  data?: Record<string, unknown>;
  /** 上传字段名 */
  name?: string;
  /** 文件类型 */
  accept?: string;
  /** 类型：image/普通 */
  type?: "image" | "default";
  /** 拖拽上传 */
  drag?: boolean;
  /** 是否多选 */
  multiple?: boolean;
  /** 文件列表类型 */
  listType?: "text" | "picture" | "picture-card";
  /** 是否显示文件列表 */
  showFileList?: boolean;
  /** 文件数量限制 */
  limit?: number;
  /** 文件大小限制 (MB) */
  maxSize?: number;
  /** 触发按钮文案 */
  triggerText?: string;
  /** 拖拽区域文案 */
  dragText?: string;
  /** 拖拽提示 */
  dragHint?: string;
  /** 提示文字 */
  tipText?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 响应中 URL 字段路径 */
  responseUrlPath?: string;
  /** 文件名 */
  fileName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  type: "default",
  drag: false,
  multiple: false,
  accept: "",
  listType: "text",
  showFileList: true,
  limit: undefined,
  maxSize: 10,
  triggerText: "点击上传",
  dragText: "将文件拖到此处，或点击上传",
  dragHint: "支持单个或批量上传",
  tipText: "",
  name: "file",
  responseUrlPath: "data.url",
  fileName: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: UploadFileItem[]): void;
  (e: "change", value: UploadFileItem[]): void;
  (e: "success", response: unknown, file: UploadFileItem, list: UploadFileItem[]): void;
  (e: "error", err: unknown, file: UploadFileItem): void;
  (e: "exceed", files: File[], list: UploadFileItem[]): void;
  (e: "remove", file: UploadFileItem, list: UploadFileItem[]): void;
}>();

const previewVisible = ref(false);
const previewUrl = ref("");
const previewTitle = ref("");

const fileList = computed<UploadFileItem[]>({
  get: () => props.modelValue,
  set: (val) => {
    emit("update:modelValue", val);
    emit("change", val);
  },
});

const extractUrl = (obj: unknown): string => {
  if (typeof obj === "string") return obj;
  if (!obj || typeof obj !== "object") return "";
  const path = props.responseUrlPath.split(".");
  let current: any = obj;
  for (const key of path) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return "";
    }
  }
  return typeof current === "string" ? current : "";
};

const handleBeforeUpload = (file: File): boolean => {
  if (file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
    return false;
  }
  return true;
};

const handleSuccess = (response: unknown, file: UploadFileItem) => {
  const url = extractUrl(response);
  if (url) {
    file.url = url;
  }
  emit("success", response, file, fileList.value);
  emit("update:modelValue", fileList.value);
  emit("change", fileList.value);
};

const handleError = (err: unknown, file: UploadFileItem) => {
  emit("error", err, file);
  ElMessage.error(`${file.name} 上传失败`);
};

const handleExceed = (files: File[]) => {
  emit("exceed", files, fileList.value);
  ElMessage.warning(`文件数量超出限制`);
};

const handleRemove = (file: UploadFileItem, list: UploadFileItem[]) => {
  emit("remove", file, list);
  emit("update:modelValue", list);
  emit("change", list);
};

const handlePreview = (file: UploadFileItem) => {
  if (props.type === "image" || /\.(jpe?g|png|gif|webp|svg|bmp)$/i.test(file.name)) {
    previewUrl.value = file.url;
    previewTitle.value = file.name;
    previewVisible.value = true;
  } else {
    window.open(file.url);
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val !== fileList.value) {
      fileList.value = val;
    }
  },
  { deep: true },
);
</script>

<style scoped>
.re-upload {
  width: 100%;
}

.re-upload__image-trigger {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-blank);
  border-radius: var(--el-border-radius-base);
}

.re-upload__image-icon {
  font-size: 28px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.re-upload__image-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-upload__tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.re-upload__drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.re-upload__drag-icon {
  font-size: 48px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.re-upload__drag-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.re-upload__drag-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-upload__preview-img {
  width: 100%;
  display: block;
}

.re-upload.is-disabled :deep(.el-upload) {
  cursor: not-allowed;
}
</style>
