<script setup lang="ts">
/**
 * 文件空间（P2P 文件交换）
 *
 * <p>文件走房间目录（{@code /ms/room/{id}/files}），文件列表由本组件助动，
 * 上传时拉取最新列表。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { downloadBlob } from "@repo/utils";
import { downloadRoomFileBlob, listRoomFiles, uploadRoomFile, type RoomFile } from "../api";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();
const files = ref<RoomFile[]>([]);
const filesLoading = ref(false);
const filesError = ref("");
const keyword = ref("");
const uploading = ref(false);
const uploadPct = ref(0);

/** 搜索防抖定时器 */
let searchTimer: ReturnType<typeof setTimeout> | undefined;

/** 文件大小可读 */
function sizeBytes(n?: number): string {
  if (n == null) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

/** 格式化作空 */
function fmtTime(t?: string): string {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return t;
  }
}

/** 加载文件列表 */
async function loadFiles(): Promise<void> {
  if (!store.roomId) return;
  filesError.value = "";
  filesLoading.value = true;
  try {
    files.value = await listRoomFiles(store.roomId, keyword.value);
  } catch (e: any) {
    filesError.value = e?.message ?? "读取失败";
    files.value = [];
  } finally {
    filesLoading.value = false;
  }
}

/** 搜索输入防抖（300ms）后拉取列表 */
function onSearchInput(): void {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => void loadFiles(), 300);
}

/** 上传文件：multipart 走 axios onUploadProgress，进度实时反映到按钮文案 */
async function onUpload(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (!f) return;
  if (!store.roomId) {
    message.warning("请先加入房间再上传");
    input.value = "";
    return;
  }
  uploading.value = true;
  uploadPct.value = 0;
  try {
    await uploadRoomFile(store.roomId, f, (pct) => (uploadPct.value = pct));
    message.success(`「${f.name}」上传成功`);
    await loadFiles();
  } catch (err: any) {
    message.error(err?.message ?? "上传失败");
  } finally {
    uploading.value = false;
    uploadPct.value = 0;
    input.value = "";
  }
}

/** 下载文件：经统一 http 实例取 Blob（携带鉴权），再触发浏览器落盘 */
async function onDownload(f: RoomFile): Promise<void> {
  try {
    const blob = await downloadRoomFileBlob(f.id);
    downloadBlob(blob, f.name);
  } catch (err: any) {
    message.error(err?.message ?? "下载失败");
  }
}

onBeforeUnmount(() => clearTimeout(searchTimer));

onMounted(() => {
  if (store.roomId) void loadFiles();
});
</script>

<template>
  <div class="rm-workspace">
    <div class="rm-pane rm-pane--full">
      <div class="rm-pane-head">
        <ReIcon name="Folder" :size="14" />
        <b>文件</b>
        <span class="rm-pill">{{ files.length }}</span>
        <span class="rm-spacer" />
        <input
          v-model="keyword"
          class="rm-file-search"
          placeholder="搜索文件名…"
          :disabled="filesLoading"
          @input="onSearchInput"
        />
        <label class="rm-btn" :class="{ 'is-busy': uploading }" :title="uploading ? `上传中 ${uploadPct}%` : '上传文件'">
          {{ uploading ? `上传中 ${uploadPct}%` : "上传" }}
          <input type="file" class="rm-file-input" :disabled="uploading" @change="onUpload" />
        </label>
      </div>

      <div class="rm-pane-body">
        <div v-if="filesLoading && !files.length" v-loading="true" class="rm-loading" />
        <div v-else-if="filesError" class="rm-empty">
          <b>读取失败</b>
          <span>{{ filesError }}</span>
          <button class="rm-btn" @click="loadFiles">重试</button>
        </div>
        <div v-else-if="!files.length" class="rm-empty">
          <b>还没有文件</b>
          <span>{{ keyword ? "没有匹配的文件" : "点击右上角「上传」添加" }}</span>
        </div>
        <ul v-else class="rm-files">
          <li v-for="f in files" :key="f.id" class="rm-file__item">
            <span class="rm-file__name" :title="f.name">{{ f.name }}</span>
            <span class="rm-file__meta">{{ sizeBytes(f.size) }}</span>
            <span class="rm-file__meta">{{ fmtTime(f.uploadedAt) }}</span>
            <button class="rm-btn rm-file__dl" title="下载" @click="onDownload(f)">下载</button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rm-file-search {
  width: 150px;
  height: 24px;
  padding: 0 8px;
  box-sizing: border-box;
  font-size: 12px;
  color: inherit;
  background: var(--el-fill-color-blank, transparent);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  outline: none;
}
.rm-file-search:focus {
  border-color: var(--el-color-primary, #409eff);
}
.rm-btn.is-busy {
  opacity: 0.7;
  pointer-events: none;
}
.rm-file__dl {
  flex: none;
  margin-left: auto;
  padding: 2px 8px;
}
</style>
