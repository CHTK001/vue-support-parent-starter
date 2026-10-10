<template>
  <div class="re-upload-chunk">
    <el-upload
      v-if="!hideTrigger"
      :multiple="multiple"
      :accept="accept"
      :drag="drag"
      :show-file-list="false"
      :before-upload="handleBeforeUpload"
      :disabled="disabled"
    >
      <template v-if="drag" #default>
        <div class="re-upload-chunk__drag-content">
          <el-icon class="re-upload-chunk__drag-icon"><UploadFilled /></el-icon>
          <div class="re-upload-chunk__drag-text">{{ dragText }}</div>
          <div class="re-upload-chunk__drag-hint">{{ dragHint }}</div>
        </div>
      </template>
      <template v-else #default>
        <el-button :disabled="disabled">
          <el-icon style="margin-right: 4px;"><Upload /></el-icon>
          {{ triggerText }}
        </el-button>
      </template>
    </el-upload>

    <ul v-if="internalList.length" class="re-upload-chunk__list">
      <li
        v-for="(item, index) in internalList"
        :key="index"
        class="re-upload-chunk__item"
        :class="`is-${item.status}`"
      >
        <div class="re-upload-chunk__item-info">
          <el-icon class="re-upload-chunk__item-icon"><Document /></el-icon>
          <div class="re-upload-chunk__item-main">
            <div class="re-upload-chunk__item-name">{{ item.name }}</div>
            <div class="re-upload-chunk__item-meta">
              <span>{{ formatSize(item.size) }}</span>
              <span v-if="item.status === 'uploading'">
                {{ item.uploadedChunks || 0 }} / {{ item.totalChunks || 1 }} 分片
                · {{ item.percent || 0 }}%
              </span>
              <span v-else-if="item.status === 'success'">上传成功</span>
              <span v-else-if="item.status === 'fail'" class="re-upload-chunk__item-error">
                {{ item.error || "上传失败" }}
              </span>
              <span v-else-if="item.status === 'cancelled'">已取消</span>
            </div>
            <el-progress
              v-if="item.status === 'uploading'"
              :percentage="item.percent || 0"
              :show-text="false"
              :stroke-width="2"
              class="re-upload-chunk__progress"
            />
          </div>
        </div>
        <div class="re-upload-chunk__item-actions">
          <el-button
            v-if="item.status === 'uploading'"
            link
            type="danger"

            @click="handleCancel(item)"
          >
            取消
          </el-button>
          <el-button
            v-if="item.status === 'fail' || item.status === 'cancelled'"
            link
            type="primary"

            @click="handleRetry(item)"
          >
            重试
          </el-button>
          <el-button
            v-if="item.status === 'success' && item.url"
            link
            type="primary"

            @click="handleCopy(item.url)"
          >
            复制链接
          </el-button>
          <el-button
            link
            type="danger"

            @click="handleRemove(index)"
          >
            删除
          </el-button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/**
 * ReUploadChunk —— 分片上传组件
 *
 * 适配后端分片上传接口：
 *   POST /chunk/create          初始化
 *   POST /chunk/{id}/part       上传分片
 *   POST /chunk/{id}/complete  完成
 *   DELETE /chunk/{id}          取消
 *   GET /chunk/{id}/progress    进度
 *
 *   <ReUploadChunk v-model="files" base-url="/api/filesystem" />
 */
import {http, message} from "@repo/core";
import { ref, shallowRef, watch } from "vue";

import { Upload, UploadFilled, Document } from "@element-plus/icons-vue";
import type { ChunkUploadFile } from "./types";

interface Props {
  /** 双向绑定的文件列表 */
  modelValue?: ChunkUploadFile[];
  /** 分片上传基础地址 */
  baseUrl: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 存储类型 */
  storageType?: string;
  /** 存储桶 */
  bucket?: string;
  /** 分片大小（字节，默认 5MB） */
  chunkSize?: number;
  /** 接收的文件类型 */
  accept?: string;
  /** 多选 */
  multiple?: boolean;
  /** 拖拽 */
  drag?: boolean;
  /** 触发按钮文案 */
  triggerText?: string;
  /** 拖拽文案 */
  dragText?: string;
  /** 拖拽提示 */
  dragHint?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 隐藏自带 trigger（外部自定义） */
  hideTrigger?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  storageType: "local",
  bucket: "default",
  chunkSize: 5 * 1024 * 1024,
  accept: "",
  multiple: false,
  drag: false,
  triggerText: "选择文件",
  dragText: "将文件拖到此处，或点击上传",
  dragHint: "支持大文件分片上传",
});

interface Emits {
  (e: "update:modelValue", value: ChunkUploadFile[]): void;
  (e: "change", value: ChunkUploadFile[]): void;
  (e: "success", file: ChunkUploadFile): void;
  (e: "error", file: ChunkUploadFile, err: unknown): void;
  (e: "progress", file: ChunkUploadFile): void;
}

const emit = defineEmits<Emits>();

/**
 * 内部维护的浅响应式列表，保证修改字段能触发模板更新。
 * 外部 v-model 变化通过 watch 同步进来。
 */
const internalList = shallowRef<ChunkUploadFile[]>([]);

watch(
  () => props.modelValue,
  (val) => {
    internalList.value = [...val];
  },
  { immediate: true, deep: true },
);

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const syncList = () => {
  const snapshot = [...internalList.value];
  internalList.value = snapshot;
  emit("update:modelValue", snapshot);
  emit("change", snapshot);
};

const fetchJson = async <T = unknown>(
  url: string,
  init: RequestInit = {},
): Promise<{ code: number; message: string; data: T }> => {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(props.headers ?? {}),
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = await response.json();
  return json;
};

const createTask = async (file: ChunkUploadFile): Promise<{
  uploadId: string;
  totalChunks: number;
  chunkSize: number;
  key: string;
}> => {
  const url = `${props.baseUrl}/chunk/create`;
  const formData = new FormData();
  formData.append("fileName", file.name);
  formData.append("fileSize", String(file.size));
  formData.append("chunkSize", String(props.chunkSize));
  formData.append("storageType", props.storageType);
  formData.append("bucket", props.bucket);
  const result = await fetchJson<{
    uploadId: string;
    totalChunks: number;
    chunkSize: number;
    key: string;
  }>(url, { method: "POST", body: formData });
  if (result.code !== 200) {
    throw new Error(result.message || "初始化分片上传失败");
  }
  return result.data;
};

const uploadPart = async (
  uploadId: string,
  partNumber: number,
  blob: Blob,
): Promise<{ etag: string; partSize: number }> => {
  const url = `${props.baseUrl}/chunk/${uploadId}/part?partNumber=${partNumber}`;
  const formData = new FormData();
  formData.append("file", blob);
  const result = await fetchJson<{ etag: string; partSize: number }>(url, {
    method: "POST",
    body: formData,
  });
  if (result.code !== 200) {
    throw new Error(result.message || "分片上传失败");
  }
  return result.data;
};

const completeTask = async (
  uploadId: string,
): Promise<{ url: string; key: string }> => {
  const url = `${props.baseUrl}/chunk/${uploadId}/complete`;
  const result = await fetchJson<{ url: string; key: string }>(url, {
    method: "POST",
  });
  if (result.code !== 200) {
    throw new Error(result.message || "完成分片上传失败");
  }
  return result.data;
};

const cancelTask = async (uploadId: string): Promise<void> => {
  await http().delete(`${props.baseUrl}/chunk/${uploadId}`).headers(props.headers ?? {});
};

const handleBeforeUpload = (file: File): boolean => {
  addFile(file);
  return false;
};

const addFile = (file: File) => {
  const newList = [...internalList.value];
  newList.push({
    file,
    name: file.name,
    size: file.size,
    status: "pending",
  });
  internalList.value = newList;
  syncList();
  const target = newList[newList.length - 1];
  void startUpload(target);
};

const startUpload = async (file: ChunkUploadFile) => {
  try {
    file.status = "uploading";
    file.percent = 0;
    file.error = undefined;
    syncList();

    const init = await createTask(file);
    file.uploadId = init.uploadId;
    file.totalChunks = init.totalChunks;
    file.chunkSize = init.chunkSize;
    file.key = init.key;
    file.uploadedChunks = 0;
    syncList();

    const total = init.totalChunks;
    for (let partNumber = 1; partNumber <= total; partNumber++) {
      const start = (partNumber - 1) * init.chunkSize;
      const end = Math.min(file.size, start + init.chunkSize);
      const chunk = file.file.slice(start, end);
      await uploadPart(init.uploadId, partNumber, chunk);
      file.uploadedChunks = partNumber;
      file.percent = Math.round((partNumber / total) * 100);
      emit("progress", file);
      syncList();
    }

    const completed = await completeTask(init.uploadId);
    file.url = completed.url;
    file.status = "success";
    file.percent = 100;
    emit("progress", file);
    emit("success", file);
    syncList();
  } catch (err) {
    file.status = "fail";
    file.error = (err as Error).message || "上传失败";
    emit("error", file, err);
    syncList();
  }
};

const handleCancel = async (file: ChunkUploadFile) => {
  if (file.uploadId) {
    try {
      await cancelTask(file.uploadId);
    } catch {
      // 忽略服务端错误，本地状态仍更新
    }
  }
  file.status = "cancelled";
  syncList();
};

const handleRetry = (file: ChunkUploadFile) => {
  void startUpload(file);
};

const handleRemove = (index: number) => {
  const newList = [...internalList.value];
  newList.splice(index, 1);
  internalList.value = newList;
  syncList();
};

const handleCopy = (url: string) => {
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(url);
    message.success("链接已复制");
  }
};

const uploadFile = (file: File) => addFile(file);
defineExpose({ uploadFile });
</script>

<style scoped>
.re-upload-chunk {
  width: 100%;
}

.re-upload-chunk__list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.re-upload-chunk__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  transition: border-color 0.2s;
}

.re-upload-chunk__item.is-success {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}

.re-upload-chunk__item.is-fail {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}

.re-upload-chunk__item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.re-upload-chunk__item-icon {
  font-size: 20px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.re-upload-chunk__item-main {
  flex: 1;
  min-width: 0;
}

.re-upload-chunk__item-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-upload-chunk__item-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  display: flex;
  gap: 8px;
}

.re-upload-chunk__item-error {
  color: var(--el-color-danger);
}

.re-upload-chunk__progress {
  margin-top: 4px;
}

.re-upload-chunk__item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.re-upload-chunk__drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.re-upload-chunk__drag-icon {
  font-size: 48px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.re-upload-chunk__drag-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.re-upload-chunk__drag-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
