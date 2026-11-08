<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import {
  sftpDelete,
  sftpList,
  sftpMkdir,
  sftpReadContent,
  sftpRename,
  sftpUpload,
  sftpWriteContent,
  sftpDownloadUrl,
  getBookmarks,
  createBookmark,
  delBookmark,
} from '../api';
import { ElSkeleton, vLoading } from 'element-plus';

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
    message.error((e as Error).message);
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
    message.error((e as Error).message);
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
    message.success('保存成功');
    editorVisible.value = false;
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    editorSaving.value = false;
  }
}

/**
 * 创建目录
 */
async function onMkdir(): Promise<void> {
  if (!props.hostId) return;
  const { value } = await message.prompt('新目录名', '创建目录', '确定', '取消', 'info', { inputValue: 'newdir' });
  const base = currentPath.value.endsWith('/') ? currentPath.value : `${currentPath.value}/`;
  await sftpMkdir(props.hostId, `${base}${value}`);
  message.success('已创建');
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
  await message.confirm(`确认删除 ${entry.name}?`, '删除');
  await sftpDelete(props.hostId, `${base}${entry.name}`, !!entry.directory);
  message.success('已删除');
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
  const { value } = await message.prompt('新名称', '重命名', '确定', '取消', 'info', { inputValue: entry.name });
  await sftpRename(props.hostId, `${base}${entry.name}`, `${base}${value}`);
  message.success('已完成');
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
  try {
    await sftpUpload(props.hostId, currentPath.value, file);
    message.success('上传成功');
    go();
  } catch (e) {
    message.error(`上传失败: ${(e as Error).message}`);
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
    msTerminalBookmarkHostId: props.hostId,
    msTerminalBookmarkName: currentPath.value,
    msTerminalBookmarkPath: currentPath.value,
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
      <ReButton @click="up" :disabled="currentPath === '/'">上级</ReButton>
      <ReInput
        v-model="currentPath"

        style="width: 380px"
        @keyup.enter="go()"
        placeholder="远程路径"
      />
      <ReButton type="primary" @click="go()">刷新</ReButton>
      <ReButton @click="onMkdir">新建目录</ReButton>
      <ReButton @click="addBookmark">收藏路径</ReButton>
      <label class="upload-btn">
        <input type="file" hidden @change="onUpload" />
        <ReButton tag="span">上传到此目录</ReButton>
      </label>
    </div>

    <!-- 书签 -->
    <div v-if="bookmarks.length" class="bookmarks">
      <ReTag
        v-for="bookmark in bookmarks"
        :key="bookmark.id"
        closable

        class="bookmark-tag"
        @click="go(bookmark.msTerminalBookmarkPath)"
        @close="removeBookmark(bookmark.id)"
      >
        {{ bookmark.msTerminalBookmarkName }}
      </ReTag>
    </div>

    <!-- 文件表格：首次加载骨架屏，后续刷新遮罩 -->
    <div class="sftp-table-wrap">
      <el-skeleton v-if="loading && !entries.length" :rows="9" animated class="sftp-skeleton" />
      <ReTable
        v-else
        v-loading="loading"
        element-loading-text="正在读取远程目录…"
        :data="entries"

        border
        empty-text="当前目录为空"
        :layout-table="{ minHeight: 0, height: 'calc(100vh - 320px)' }"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <ReTableColumn label="名称" min-width="240">
          <template #default="{ row }">
            <ReLink type="primary" :underline="false" @click="enter(row)">
              <ReIcon style="margin-right: 4px" :name="row.directory ? 'Folder' : 'Document'" />
              {{ row.name }}
            </ReLink>
          </template>
        </ReTableColumn>
        <ReTableColumn label="类型" width="90">
          <template #default="{ row }">{{ row.directory ? '目录' : '文件' }}</template>
        </ReTableColumn>
        <ReTableColumn label="大小" width="110">
          <template #default="{ row }">{{ row.directory ? '-' : formatSize(row.size) }}</template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="200">
          <template #default="{ row }">
            <ReButton v-if="!row.directory" text @click="openEditor(joint(row.name))">编辑</ReButton>
            <ReButton v-if="!row.directory" text @click="download(row)">下载</ReButton>
            <ReButton text @click="onRename(row)">改名</ReButton>
            <ReButton text type="danger" @click="onDelete(row)">删除</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </div>

    <!-- 文本编辑器 -->
    <ReDialog v-model="editorVisible" :title="editorPath" width="760" :height="560" confirm-text="保存" cancel-text="取消" :footer-hidden="false" @confirm="saveEditor" @cancel="editorVisible = false">
      <ReAlert
        v-if="editorTruncated"
        title="文件过大，仅加载前 1MB 内容；保存将覆盖完整文件，请谨慎操作"
        type="warning"
        :closable="false"
        style="margin-bottom: 8px"
      />
      <ReInput v-model="editorContent" type="textarea" :rows="20" spellcheck="false" />
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.sftp-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius);
  transition: var(--transition-base);
}

.bookmarks {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;

  .bookmark-tag {
    cursor: pointer;
    transition: transform 0.15s var(--ease-out), box-shadow 0.15s var(--ease-out);

    &:hover {
      box-shadow: var(--shadow-card-hover);
    }
  }
}

.upload-btn {
  cursor: pointer;
  display: inline-flex;
}

.sftp-table-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.sftp-skeleton {
  padding: 12px 8px;
}
</style>
