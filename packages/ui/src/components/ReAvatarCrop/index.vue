<template>
  <el-upload
    :class="['re-avatar-crop', { 'is-disabled': disabled }]"
    :action="action"
    :headers="headers"
    :data="data"
    :name="name"
    :show-file-list="false"
    :accept="accept"
    :before-upload="handleBeforeUpload"
    :on-success="handleUploadSuccess"
    :on-error="handleUploadError"
    :disabled="disabled"
  >
    <template #default>
      <div class="re-avatar-crop__trigger">
        <slot :url="modelValue">
          <div v-if="modelValue" class="re-avatar-crop__preview">
            <img :src="modelValue" :alt="alt" />
            <div class="re-avatar-crop__mask">
              <span class="re-avatar-crop__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7h4l2-3h6l2 3h4v13H3V7z" stroke-linejoin="round" />
                  <circle cx="12" cy="13" r="4" />
                  <path d="M9.5 13.5l2 2 3.5-3.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="re-avatar-crop__text">{{ triggerText }}</span>
            </div>
          </div>
          <div v-else class="re-avatar-crop__placeholder">
            <span class="re-avatar-crop__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7h4l2-3h6l2 3h4v13H3V7z" stroke-linejoin="round" />
                <circle cx="12" cy="13" r="4" />
                <path d="M9.5 13.5l2 2 3.5-3.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="re-avatar-crop__text">{{ triggerText }}</span>
          </div>
        </slot>
      </div>
    </template>
  </el-upload>

  <ReDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="640px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    append-to-body
    destroy-on-close
    class="re-avatar-crop__dialog"
  >
    <div class="re-avatar-crop__wrap">
      <ReCropper
        v-if="dialogVisible"
        ref="cropperRef"
        :src="sourceUrl"
        :compress="compress"
        :aspect-ratio="aspectRatio"
      />
    </div>
    <template #footer>
      <div class="re-avatar-crop__footer">
        <span class="re-avatar-crop__hint">{{ hintText }}</span>
        <div class="re-avatar-crop__actions">
          <el-button @click="handleCancel">{{ cancelText }}</el-button>
          <el-button type="primary" :loading="uploading" @click="handleConfirm">
            {{ confirmText }}
          </el-button>
        </div>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
/**
 * ReAvatarCrop —— 头像裁剪上传组件
 *
 * 基于 Element Plus Upload + ReCropper，支持裁剪后上传/预览
 *   <ReAvatarCrop v-model="avatar" :action="'/api/upload'" />
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";
import ReCropper from "../ReCropper/index.vue";
import ReDialog from "../ReDialog";

interface Props {
  /** 双向绑定的图片 URL */
  modelValue?: string;
  /** 上传地址 */
  action: string;
  /** 上传请求头 */
  headers?: Record<string, string>;
  /** 上传额外参数 */
  data?: Record<string, unknown>;
  /** 上传字段名 */
  name?: string;
  /** 接收的文件类型 */
  accept?: string;
  /** 裁剪宽高比，默认 1（正方形） */
  aspectRatio?: number;
  /** 压缩质量 0-1 */
  compress?: number;
  /** 输出格式 */
  outputType?: string;
  /** 输出文件名 */
  fileName?: string;
  /** 触发按钮文案 */
  triggerText?: string;
  /** 弹窗标题 */
  dialogTitle?: string;
  /** 弹窗提示 */
  hintText?: string;
  /** 取消按钮文案 */
  cancelText?: string;
  /** 确认按钮文案 */
  confirmText?: string;
  /** alt */
  alt?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 文件大小限制 (MB) */
  maxSize?: number;
  /** 上传成功后从 response 提取 URL 的字段路径（如 'data.url'） */
  responseUrlPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: 1,
  compress: 0.92,
  outputType: "image/jpeg",
  fileName: "avatar.jpg",
  triggerText: "上传头像",
  dialogTitle: "裁剪头像",
  hintText: "拖动图片调整位置，滚轮缩放",
  cancelText: "取消",
  confirmText: "确定上传",
  accept: "image/*",
  name: "file",
  maxSize: 5,
  responseUrlPath: "data.url",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
  (e: "success", response: unknown, url: string): void;
  (e: "error", err: unknown): void;
  (e: "crop", blob: Blob): void;
}>();

const dialogVisible = ref(false);
const sourceUrl = ref("");
const cropperRef = ref<InstanceType<typeof ReCropper> | null>(null);
const uploading = ref(false);

const handleBeforeUpload = (file: File): boolean => {
  if (file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`);
    return false;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    sourceUrl.value = e.target?.result as string;
    dialogVisible.value = true;
  };
  reader.readAsDataURL(file);
  return false;
};

const handleCancel = () => {
  dialogVisible.value = false;
  sourceUrl.value = "";
};

const handleConfirm = async () => {
  if (!cropperRef.value) return;
  cropperRef.value.getCropFile(
    async (blob: Blob) => {
      emit("crop", blob);
      uploading.value = true;
      try {
        const formData = new FormData();
        const file = new File([blob], props.fileName, { type: props.outputType });
        formData.append(props.name, file);
        if (props.data) {
          Object.entries(props.data).forEach(([key, value]) => {
            formData.append(key, String(value));
          });
        }
        const response = await fetch(props.action, {
          method: "POST",
          headers: props.headers ?? {},
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }
        const result = await response.json();
        const url = extractUrl(result);
        emit("update:modelValue", url);
        emit("change", url);
        emit("success", result, url);
        dialogVisible.value = false;
        sourceUrl.value = "";
      } catch (err) {
        emit("error", err);
        ElMessage.error("上传失败");
      } finally {
        uploading.value = false;
      }
    },
    props.outputType,
  );
};

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

const handleUploadSuccess = (response: unknown) => {
  const url = extractUrl(response);
  if (url) {
    emit("update:modelValue", url);
    emit("change", url);
    emit("success", response, url);
  }
};

const handleUploadError = (err: unknown) => {
  emit("error", err);
  ElMessage.error("上传失败");
};
</script>

<style scoped>
.re-avatar-crop :deep(.el-upload) {
  display: inline-block;
}

.re-avatar-crop__trigger {
  display: inline-block;
  cursor: pointer;
}

.re-avatar-crop.is-disabled .re-avatar-crop__trigger {
  cursor: not-allowed;
  opacity: 0.6;
}

.re-avatar-crop__placeholder,
.re-avatar-crop__preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, background-color 0.2s;
  overflow: hidden;
}

.re-avatar-crop__trigger:hover .re-avatar-crop__placeholder,
.re-avatar-crop__trigger:hover .re-avatar-crop__preview {
  border-color: var(--el-color-primary);
}

.re-avatar-crop__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.re-avatar-crop__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.re-avatar-crop__trigger:hover .re-avatar-crop__mask {
  opacity: 1;
}

.re-avatar-crop__icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
}

.re-avatar-crop__icon svg {
  width: 100%;
  height: 100%;
}

.re-avatar-crop__text {
  font-size: 12px;
}

.re-avatar-crop__wrap {
  width: 100%;
  height: 400px;
}

.re-avatar-crop__wrap :deep(.re-cropper) {
  height: 100%;
  width: 100%;
  display: flex;
}

.re-avatar-crop__wrap :deep(.re-cropper__img) {
  flex: 1;
  height: 100%;
  background: var(--el-fill-color-light);
}

.re-avatar-crop__wrap :deep(.re-cropper__preview) {
  width: 200px;
  height: 200px;
  margin-left: 20px;
  flex-shrink: 0;
}

.re-avatar-crop__wrap :deep(.re-cropper__preview__img) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.re-avatar-crop__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.re-avatar-crop__hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.re-avatar-crop__actions {
  display: flex;
  gap: 8px;
}
</style>