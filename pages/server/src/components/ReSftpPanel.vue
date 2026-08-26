<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  sftpDelete,
  sftpList,
  sftpMkdir,
  sftpReadContent,
  sftpRename,
  sftpWriteContent,
  sftpDownloadUrl,
  getBookmarks,
  createBookmark,
  delBookmark,
} from '../api';

/**
 * SFTP 文件管理面板
 * 目录浏览 / 文本编辑 / 上传下载 / 目录操作 / 路径书签。
 */

const props = defineProps<{
  /** 目标主机 ID（null 时面板置灰） */
  hostId: number | null;
}>();

/** 文件条目 */
interface FileEntry {
  name: string;
  path?: string;
  directory?: boolean;
  file?: boolean;
  size?: number;
}

/** 当前路径 */
const currentPath = ref('/');

/** 条目列表与加载态 */
const entries = ref<FileEntry[]>([]);
const loading = ref(false);

/** 编辑器状态 */
const editorVisible = ref(false);
const editorPath = ref('');
const editorContent = ref('');
const editorTruncated = ref(false);
const editorSaving = ref(false);

/** 书签列表 */
const bookmarks = ref<Array<{ id: number; msTerminalBookmarkName: string; msTerminalBookmarkPath: string }>>([]);

// 主机切换时重新加载
watch(
  () => props.hostId,
  id => {
    if (id) {
      loadBookmarks();
      go('/');
    } else {
      entries.value = [];
    }
  },
);

onMounted(() => {
  if (props.hostId) {
    loadBookmarks();
    go('/');
  }
});

/**
 * 加载目录内容
 *
 * @param path 目标路径，空则刷新当前目录
 */
async function go(path?: string): Promise<void> {
  if (!props.hostId) return;
  const target = path ?? currentPath.value;
  loading.value = true;
  try {
    const list = await sftpList(props.hostId, target || '/');
    // 目录优先、名称排序
    entries.value = [...list].sort((a, b) => {
      if (!!a.directory !== !!b.directory) return a.directory ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    });
    currentPath.value = target || '/';
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/**
 * 进入子目录（文件则打开编辑器）
 *
 * @param entry 文件条目
 */
function enter(entry: FileEntry): void {
  const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  const fullPath = `${base}${entry.name}`;
  if (entry.directory) {
    go(fullPath);
  } else {
    openEditor(fullPath);
  }
}

/**
 * 返回上级目录
 */
async function up(): Promise<void> {
  if (currentPath.value === '/') return;
  const parent = currentPath.value.replace(/\/[^/]+\/?$/, '') || '/';
  await go(parent);
}

/**
 * 打开文本编辑器
 *
 * @param path 文件路径
 */
async function openEditor(path: string): Promise<void> {
  if (!props.hostId) return;
  try {
    const result = await sftpReadContent(props.hostId, path);
    editorPath.value = path;
    editorContent.value = result.content ?? '';
    editorTruncated.value = !!result.truncated;
    editorVisible.value = true;
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 保存编辑器内容
 */
async function saveEditor(): Promise<void> {
  if (!props.hostId) return;
  editorSaving.value = true;
  try {
    await sftpWriteContent(props.hostId, editorPath.value, editorContent.value);
    ElMessage.success('保存成功');
    editorVisible.value = false;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    editorSaving.value = false;
  }
}

/**
 * 创建目录
 */
async function onMkdir(): Promise<void> {
  if (!props.hostId) return;
  const { value } = await ElMessageBox.prompt('新目录名', '创建目录', { inputValue: 'newdir' });
  const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  await sftpMkdir(props.hostId, `${base}${value}`);
  ElMessage.success('已创建');
  go();
}

/**
 * 删除条目
 *
 * @param entry 文件条目
 */
async function onDelete(entry: FileEntry): Promise<void> {
  if (!props.hostId) return;
  const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  await ElMessageBox.confirm(`确认删除 ${entry.name}?`, '删除', { type: 'warning' });
  await sftpDelete(props.hostId, `${base}${entry.name}`, !!entry.directory);
  ElMessage.success('已删除');
  go();
}

/**
 * 重命名/移动
 *
 * @param entry 文件条目
 */
async function onRename(entry: FileEntry): Promise<void> {
  if (!props.hostId) return;
  const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  const { value } = await ElMessageBox.prompt('新名称', '重命名', { inputValue: entry.name });
  await sftpRename(props.hostId, `${base}${entry.name}`, `${base}${value}`);
  ElMessage.success('已完成');
  go();
}

/**
 * 触发浏览器下载
 *
 * @param entry 文件条目
 */
function download(entry: FileEntry): void {
  if (!props.hostId) return;
  const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  window.open(sftpDownloadUrl(props.hostId, `${base}${entry.name}`), '_blank');
}

/**
 * 上传选中文件到当前目录
 *
 * @param event input change 事件
 */
async function onUpload(event: Event): Promise<void> {
  if (!props.hostId) return;
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const form = new FormData();
  form.append('file', file);
  const q = `path=${encodeURIComponent(currentPath.value)}`;
  // 复用后端 upload 接口（经代理直连）
  const res = await fetch(`/ms/server/sftp/${props.hostId}/upload?${q}`, { method: 'POST', body: form });
  if (!res.ok) {
    ElMessage.error('上传失败');
  } else {
    ElMessage.success('上传成功');
    go();
  }
  input.value = '';
}

/**
 * 加载书签列表
 */
async function loadBookmarks(): Promise<void> {
  if (!props.hostId) return;
  try {
    bookmarks.value = await getBookmarks(props.hostId);
  } catch {
    bookmarks.value = [];
  }
}

/**
 * 拼接当前目录与文件名为完整路径
 *
 * @param name 文件名
 */
function joint(name: string): string {
  const base = currentPath.value?.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  return `${base}${name}`;
}

/**
 * 人性化字节数展示
 *
 * @param bytes 字节数
 */
function formatSize(bytes?: number): string {
  if (bytes == null) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * 收藏当前目录
 */
async function addBookmark(): Promise<void> {
  if (!props.hostId) return;
  await createBookmark({
    hostId: props.hostId,
    name: currentPath.value,
    path: currentPath.value,
  });
  loadBookmarks();
}

/**
 * 删除书签
 *
 * @param id 书签 ID
 */
async function removeBookmark(id: number): Promise<void> {
  await delBookmark(id);
  loadBookmarks();
}
</script>

<template>
  <div class="sftp-panel" :class="{ disabled: !hostId }">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button size="small" @click="up" :disabled="currentPath === '/'">上级</el-button>
      <el-input
        v-model="currentPath"
        size="small"
        style="width: 380px"
        @keyup.enter="go()"
        placeholder="远程路径"
      />
      <el-button size="small" type="primary" @click="go()">刷新</el-button>
      <el-button size="small" @click="onMkdir">新建目录</el-button>
      <el-button size="small" @click="addBookmark">收藏路径</el-button>
      <label class="upload-btn">
        <input type="file" hidden @change="onUpload" />
        <el-button size="small" tag="span">上传到此目录</el-button>
      </label>
    </div>

    <!-- 书签 -->
    <div v-if="bookmarks.length" class="bookmarks">
      <el-tag
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        closable
        size="small"
        class="bookmark-tag"
        @click="go(bookmark.msTerminalBookmarkPath)"
        @close="removeBookmark(bookmark.id)"
      >
        {{ bookmark.msTerminalBookmarkName }}
      </el-tag>
    </div>

    <!-- 文件表格 -->
    <el-table v-loading="loading" :data="entries" size="small" height="calc(100vh - 320px)" border>
      <el-table-column label="名称" min-width="240">
        <template #default="{ row }">
          <el-link type="primary" :underline="false" @click="enter(row)">
            <el-icon style="margin-right: 4px">
              <Folder v-if="row.directory" />
              <Document v-else />
            </el-icon>
            {{ row.name }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ row.directory ? '目录' : '文件' }}</template>
      </el-table-column>
      <el-table-column label="大小" width="110">
        <template #default="{ row }">{{ row.directory ? '-' : formatSize(row.size) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="!row.directory" link size="small" @click="openEditor(joint(row.name))">编辑</el-button>
          <el-button v-if="!row.directory" link size="small" @click="download(row)">下载</el-button>
          <el-button link size="small" @click="onRename(row)">改名</el-button>
          <el-button link size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 文本编辑器 -->
    <el-dialog v-model="editorVisible" :title="editorPath" width="720px" append-to-body>
      <el-alert
        v-if="editorTruncated"
        title="文件过大，仅加载前 1MB 内容；保存将覆盖完整文件，请谨慎操作"
        type="warning"
        :closable="false"
        style="margin-bottom: 8px"
      />
      <el-input v-model="editorContent" type="textarea" :rows="20" spellcheck="false" />
      <template #footer>
        <el-button @click="editorVisible = false">取消</el-button>
        <el-button type="primary" :loading="editorSaving" @click="saveEditor">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.sftp-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.bookmarks {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .bookmark-tag {
    cursor: pointer;
  }
}

.upload-btn {
  cursor: pointer;
}
</style>
