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
import { computed, onMounted, ref } from "vue";
import { listRoomFiles, type RoomFile } from "../api";
import { useRoomStore } from "../stores/room";

const store = useRoomStore();
const files = ref<RoomFile[]>([]);
const filesLoading = ref(false);
const filesError = ref("");
const keyword = ref("");

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

/** 上传文件 */
function upload(e: Event): void {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f || !store.roomId) return;
  // TODO: 实际走 SSE 块上传，上传后拉列表
  loadFiles();
}

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
        <label class="rm-btn">
          上传
          <input type="file" class="rm-file-input" @change="upload" />
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
          <span>通过「上传」开始文件交换</span>
        </div>
        <ul v-else class="rm-files">
          <li v-for="f in files" :key="f.id" class="rm-file__item">
            <span class="rm-file__name" :title="f.name">{{ f.name }}</span>
            <span class="rm-file__meta">{{ sizeBytes(f.size) }}</span>
            <span class="rm-file__meta">{{ fmtTime(f.uploadedAt) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
