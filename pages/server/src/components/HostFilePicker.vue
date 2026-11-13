<template>
  <el-dialog
    :model-value="modelValue"
    title="从主机文件选择产物"
    width="720px"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @open="onOpen"
  >
    <div class="hfp">
      <div class="hfp-bar">
        <button type="button" class="hfp-link" :disabled="!path" @click="goUp">返回上级</button>
        <span class="hfp-path" :title="path">{{ path ? '/' + path : '/（根目录）' }}</span>
        <span class="hfp-grow"></span>
        <button type="button" class="hfp-btn" :disabled="loading" @click="refresh">刷新</button>
        <button type="button" class="hfp-btn hfp-btn--primary" :disabled="uploading" @click="pickFile">
          {{ uploading ? `上传中 ${progress}%` : '上传' }}
        </button>
        <input ref="fileInput" type="file" class="hfp-input" @change="onFilePicked" />
      </div>

      <div v-if="uploading" class="hfp-progress">
        <div class="hfp-progress__bar" :style="{ width: progress + '%' }"></div>
      </div>

      <div class="hfp-list">
        <div v-if="loading" class="hfp-empty">加载中…</div>
        <div v-else-if="!items.length" class="hfp-empty">这个目录是空的，可以直接上传</div>
        <template v-else>
          <div
            v-for="item in items"
            :key="item.key"
            class="hfp-row"
            :class="{ 'is-dir': item.directory }"
            @click="item.directory ? enter(item) : choose(item)"
          >
            <span class="hfp-name" :title="item.hostPath || item.key">
              {{ item.directory ? '📁' : '📄' }} {{ item.name }}
              <span v-if="md5Map[item.key]" class="hfp-md5 mono" :title="md5Map[item.key]">
                MD5 {{ md5Map[item.key] }}
              </span>
            </span>
            <span class="hfp-size">{{ item.directory ? '' : formatSize(item.size) }}</span>
            <span class="hfp-time">{{ formatTime(item.lastModified) }}</span>
            <span class="hfp-ops" @click.stop>
              <button
                v-if="!item.directory"
                type="button"
                class="hfp-op"
                :disabled="md5Loading[item.key]"
                @click="computeMd5(item)"
              >
                {{ md5Loading[item.key] ? '…' : 'MD5' }}
              </button>
              <button v-if="!item.directory" type="button" class="hfp-op hfp-op--primary" @click="choose(item)">
                选它
              </button>
              <button type="button" class="hfp-op" @click="remove(item)">删除</button>
            </span>
          </div>
        </template>
      </div>

      <div class="hfp-foot">选中后，后端会把文件推到目标主机的 uploads/ 再执行升级。</div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 主机文件选择器（本机 → 升级产物）。
 *
 * <p>浏览的是运行本服务的这台机器的文件存储；选中即把 key 交给父组件，
 * 由升级接口负责 SFTP 投放。上传复用文件存储的分片任务与全局进度 SSE。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { toastError } from '../utils/errors';
import {
  completeUploadTask,
  createUploadTask,
  deleteReleaseHostFile,
  getReleaseHostFileConfig,
  getReleaseHostFileMd5,
  listReleaseHostFiles,
  subscribeUploadTasks,
  uploadTaskChunk,
  type ReleaseHostFileItem,
  type ReleaseUploadTask,
} from '../api/releaseHostFile';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', item: ReleaseHostFileItem): void;
}>();

/** 分片大小：5MB */
const CHUNK_SIZE = 5 * 1024 * 1024;

const root = ref('');
const path = ref('');
const items = ref<ReleaseHostFileItem[]>([]);
const loading = ref(false);
const uploading = ref(false);
const progress = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);
let sse: { close(): void } | null = null;

/** 已算出的 MD5 */
const md5Map = reactive<Record<string, string>>({});
/** 正在计算的文件 */
const md5Loading = reactive<Record<string, boolean>>({});

/**
 * 按需计算 MD5。
 *
 * @param item 文件项
 */
async function computeMd5(item: ReleaseHostFileItem) {
  if (item.directory || md5Loading[item.key]) {
    return;
  }
  md5Loading[item.key] = true;
  try {
    const data = await getReleaseHostFileMd5(item.key);
    md5Map[item.key] = data?.md5 || '';
  } catch (e: any) {
    toastError(e, '计算 MD5 失败');
  } finally {
    md5Loading[item.key] = false;
  }
}

/** 打开时加载根信息 */
async function onOpen() {
  loading.value = true;
  try {
    const cfg = await getReleaseHostFileConfig();
    if (!cfg.enabled) {
      ElMessage.error('文件存储未启用，请先开启 plugin.filesystem.enable');
      return;
    }
    root.value = cfg.root || '';
    path.value = '';
    await refresh();
  } catch (e: any) {
    toastError(e, '加载主机文件失败');
  } finally {
    loading.value = false;
  }
}

/** 刷新当前目录 */
async function refresh() {
  loading.value = true;
  try {
    const data = await listReleaseHostFiles(path.value);
    const list = data?.items || [];
    items.value = list.slice().sort((a, b) => {
      if (a.directory !== b.directory) {
        return a.directory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (e: any) {
    toastError(e, '加载目录失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 进入子目录。
 *
 * @param item 目录项
 */
async function enter(item: ReleaseHostFileItem) {
  path.value = item.key;
  await refresh();
}

/** 返回上级 */
async function goUp() {
  if (!path.value) {
    return;
  }
  const trimmed = path.value.replace(/\/+$/, '');
  const idx = trimmed.lastIndexOf('/');
  path.value = idx > 0 ? trimmed.slice(0, idx) : '';
  await refresh();
}

/**
 * 选中文件。
 *
 * @param item 文件项
 */
function choose(item: ReleaseHostFileItem) {
  if (!item.hostPath) {
    ElMessage.error('后端未返回主机路径，无法作为升级产物');
    return;
  }
  emit('select', item);
  emit('update:modelValue', false);
}

/**
 * 删除文件。
 *
 * @param item 条目
 */
async function remove(item: ReleaseHostFileItem) {
  if (item.directory) {
    ElMessage.warning('目录请到主机文件页删除');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除「${item.name}」吗？`, '删除文件', { type: 'warning' });
  } catch {
    return;
  }
  try {
    await deleteReleaseHostFile(item.key);
    ElMessage.success('已删除');
    await refresh();
  } catch (e: any) {
    toastError(e, '删除失败');
  }
}

/** 打开文件选择器 */
function pickFile() {
  fileInput.value?.click();
}

/**
 * 分片上传。
 *
 * @param e input change
 */
async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) {
    return;
  }
  uploading.value = true;
  progress.value = 0;
  let taskId = '';
  try {
    const task = await createUploadTask(file.name, file.size, CHUNK_SIZE);
    taskId = String(task?.taskId || '');
    if (!taskId) {
      throw new Error('未返回 taskId');
    }
    sse?.close();
    sse = subscribeUploadTasks((t) => {
      if (t.taskId === taskId) {
        applyProgress(t);
      }
    });
    const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    for (let i = 0; i < total; i++) {
      const blob = file.slice(i * CHUNK_SIZE, Math.min(file.size, (i + 1) * CHUNK_SIZE));
      const snap = await uploadTaskChunk(taskId, i, blob);
      if (snap) {
        applyProgress(snap);
      } else {
        progress.value = Math.round(((i + 1) / total) * 100);
      }
    }
    await completeUploadTask(taskId);
    progress.value = 100;
    ElMessage.success(`已上传：${file.name}`);
    await refresh();
  } catch (err: any) {
    toastError(err, '上传失败');
  } finally {
    uploading.value = false;
    sse?.close();
    sse = null;
  }
}

/**
 * 更新进度。
 *
 * @param task 任务快照
 */
function applyProgress(task: ReleaseUploadTask | undefined) {
  if (!task || !task.totalSize) {
    return;
  }
  const done = Number(task.receivedBytes || 0);
  progress.value = Math.min(100, Math.round((done / Number(task.totalSize)) * 100));
}

/** 字节数转可读大小 */
function formatSize(size: number) {
  if (!size) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/** 时间戳转本地时间 */
function formatTime(ts?: number) {
  if (!ts) {
    return '—';
  }
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

onBeforeUnmount(() => sse?.close());
</script>

<style scoped>
.hfp {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hfp-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.hfp-link {
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
}
.hfp-link:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
.hfp-btn {
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.hfp-btn--primary {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;
}
.hfp-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.hfp-path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 340px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfp-grow {
  flex: 1;
}
.hfp-input {
  display: none;
}
.hfp-progress {
  height: 4px;
  border-radius: 2px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.hfp-progress__bar {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.2s ease;
}
.hfp-list {
  min-height: 260px;
  max-height: 420px;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.hfp-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.hfp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.hfp-row.is-dir {
  cursor: pointer;
}
.hfp-row:hover {
  background: var(--el-fill-color-light);
}
.hfp-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfp-md5 {
  margin-left: 6px;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
.hfp-size {
  width: 90px;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.hfp-time {
  width: 128px;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.hfp-ops {
  display: flex;
  gap: 6px;
}
.hfp-op {
  border: 1px solid var(--el-border-color);
  background: transparent;
  border-radius: 5px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.hfp-op--primary {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.hfp-foot {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
