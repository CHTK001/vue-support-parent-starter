<template>
  <div class="hfv">
    <div class="hfv-head">
      <div class="hfv-title">
        <ReIcon name="FolderOpened" :size="18" />
        <span>主机文件</span>
        <span class="hfv-sub">运行本服务的这台机器 · {{ root || '未启用' }}</span>
      </div>
      <div class="hfv-actions">
        <ReButton icon="Refresh" @click="refresh">刷新</ReButton>
        <ReButton type="primary" :loading="uploading" @click="pickFile">
          {{ uploading ? `上传中 ${progress}%` : '上传文件' }}
        </ReButton>
        <input ref="fileInput" type="file" class="hfv-input" @change="onFilePicked" />
      </div>
    </div>

    <div v-if="uploading" class="hfv-progress">
      <div class="hfv-progress__bar" :style="{ width: progress + '%' }"></div>
    </div>

    <div class="hfv-bar">
      <button type="button" class="hfv-link" :disabled="!path" @click="goUp">返回上级</button>
      <span class="hfv-path" :title="path">{{ path ? '/' + path : '/（根目录）' }}</span>
      <span class="hfv-grow"></span>
      <span class="hfv-count">{{ items.length }} 项</span>
    </div>

    <div class="hfv-list">
      <div v-if="loading" class="hfv-empty">加载中…</div>
      <div v-else-if="!items.length" class="hfv-empty">这个目录是空的，右上角可以上传</div>
      <template v-else>
        <div class="hfv-row hfv-row--head">
          <span class="hfv-name">名称</span>
          <span class="hfv-size">大小</span>
          <span class="hfv-md5">MD5</span>
          <span class="hfv-time">修改时间</span>
          <span class="hfv-ops"></span>
        </div>
        <div
          v-for="item in items"
          :key="item.key"
          class="hfv-row"
          :class="{ 'is-dir': item.directory }"
          @click="item.directory ? enter(item) : undefined"
        >
          <span class="hfv-name" :title="item.hostPath || item.key">
            <ReIcon :name="item.directory ? 'Folder' : 'Document'" :size="14" class="hfv-ic" />
            {{ item.name }}
          </span>
          <span class="hfv-size">{{ item.directory ? '—' : formatSize(item.size) }}</span>
          <span class="hfv-md5">
            <span v-if="md5Map[item.key]" class="hfv-md5-val mono" :title="md5Map[item.key]">
              {{ md5Map[item.key] }}
            </span>
            <button
              v-else-if="!item.directory"
              type="button"
              class="hfv-link"
              :disabled="md5Loading[item.key]"
              @click.stop="computeMd5(item)"
            >
              {{ md5Loading[item.key] ? '计算中…' : '计算' }}
            </button>
            <span v-else>—</span>
          </span>
          <span class="hfv-time">{{ formatTime(item.lastModified) }}</span>
          <span class="hfv-ops" @click.stop>
            <button type="button" class="hfv-op" @click="remove(item)">删除</button>
          </span>
        </div>
      </template>
    </div>

    <div class="hfv-foot">
      文件落在文件存储的本地根目录下；升级时可以直接把这里的 jar / tar.gz / zip 选作产物。
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 主机文件页（运行本服务的这台机器）。
 *
 * <p>浏览、上传、删除都以文件存储的本地桶为根：文件物理位置就是
 * {@code base-path/<bucket>/<key>}，后端把 key 还原成主机绝对路径返回，
 * 升级选包时可直接使用。上传复用 filesystem 的分片任务与全局进度 SSE，
 * 本页只在分片返回时做即时估算，避免首帧延迟看起来像卡住。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ReIcon from '@repo/ui/re-icon';
import ReButton from '@repo/ui/re-button';
import { toastError } from '../../utils/errors';
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
} from '../../api/releaseHostFile';

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

/** 已算出的 MD5（按 key 缓存，刷新目录不清：同一文件重复算没意义） */
const md5Map = reactive<Record<string, string>>({});
/** 正在计算的文件 */
const md5Loading = reactive<Record<string, boolean>>({});

/**
 * 按需计算 MD5：大包算一次要几秒，只在用户点的时候跑。
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

onMounted(load);

/** 首次加载：根信息 + 列表 */
async function load() {
  loading.value = true;
  try {
    const cfg = await getReleaseHostFileConfig();
    if (!cfg.enabled) {
      ElMessage.error('文件存储未启用，请先开启 plugin.filesystem.enable');
      return;
    }
    root.value = cfg.root || '';
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
    // 目录在前，同类按名字排：刷新后顺序不跳，找文件不靠眼力
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

/** 返回上级目录 */
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
 * 删除文件（目录不在此删，避免一删一整棵子树）。
 *
 * @param item 条目
 */
async function remove(item: ReleaseHostFileItem) {
  if (item.directory) {
    ElMessage.warning('目录请到文件管理页删除');
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
 * 分片上传：建任务 → 逐片 PUT → 合并。
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
 * 用任务快照更新进度。
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
.hfv {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 2px;
}
.hfv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.hfv-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}
.hfv-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.hfv-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hfv-input {
  display: none;
}
.hfv-progress {
  height: 4px;
  border-radius: 2px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.hfv-progress__bar {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.2s ease;
}
.hfv-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.hfv-link {
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12px;
  cursor: pointer;
}
.hfv-link:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
.hfv-path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfv-grow {
  flex: 1;
}
.hfv-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hfv-list {
  min-height: 320px;
  max-height: calc(100vh - 320px);
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.hfv-empty {
  padding: 60px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.hfv-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.hfv-row--head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.hfv-row.is-dir {
  cursor: pointer;
}
.hfv-row:not(.hfv-row--head):hover {
  background: var(--el-fill-color-light);
}
.hfv-name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfv-ic {
  color: var(--el-color-primary);
}
.hfv-size {
  width: 90px;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.hfv-md5 {
  width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
}
.hfv-md5-val {
  color: var(--el-text-color-regular);
}
.hfv-link {
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 11.5px;
  cursor: pointer;
  padding: 0;
}
.hfv-link:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
.hfv-time {
  width: 140px;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.hfv-ops {
  width: 60px;
  display: flex;
  justify-content: flex-end;
}
.hfv-op {
  border: 1px solid var(--el-border-color);
  background: transparent;
  border-radius: 5px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.hfv-op:hover {
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}
.hfv-foot {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
