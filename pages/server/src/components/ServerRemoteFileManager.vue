<template>
  <div
    class="rfm"
    :class="{ 'rfm--drag-over': isDragOver }"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="onDrop"
  >
    <!-- 拖拽遮罩 -->
    <div v-if="isDragOver" class="rfm__drag-mask">
      <div class="rfm__drag-hint">
        <span class="rfm__drag-icon">
          <IconifyIconOnline icon="ri:folder-upload-line" />
        </span>
        <p>松开以上传到 {{ currentPath }}</p>
      </div>
    </div>

    <!-- 左侧文件树 -->
    <aside class="rfm__sidebar">
      <header class="rfm__sidebar-head">
        <p class="rfm__sidebar-kicker">Remote File Hub</p>
        <h4>服务器文件管理</h4>
        <p>当前路径 {{ currentPath }}</p>
      </header>
      <!-- 面包屑 -->
      <div class="rfm__breadcrumb">
        <button
          v-for="(seg, i) in breadcrumbs"
          :key="i"
          class="rfm__breadcrumb-seg"
          :class="{ 'is-last': i === breadcrumbs.length - 1 }"
          @click="navigateTo(seg.path)"
        >{{ seg.label }}</button>
      </div>

      <div class="rfm__sidebar-summary">
        <el-tag effect="plain" round size="small">目录 {{ directoryCount }}</el-tag>
        <el-tag effect="plain" round size="small">文件 {{ fileCount }}</el-tag>
        <el-tag v-if="listKeyword.trim()" effect="plain" round size="small">
          命中 {{ displayEntries.length }}
        </el-tag>
      </div>

      <el-input
        v-model="listKeyword"
        clearable
        size="small"
        placeholder="快速过滤文件名/路径"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>

      <!-- 工具栏 -->
      <div class="rfm__sidebar-toolbar">
        <el-tooltip content="刷新">
          <ScButton circle size="small" @click="loadFiles()">
            <el-icon><Refresh /></el-icon>
          </ScButton>
        </el-tooltip>
        <el-tooltip content="返回上级">
          <ScButton circle size="small" :disabled="currentPath === rootPath" @click="goUp">
            <el-icon><ArrowUp /></el-icon>
          </ScButton>
        </el-tooltip>
        <el-tooltip content="新建目录">
          <ScButton circle size="small" @click="showNewDirDialog = true">
            <el-icon><FolderAdd /></el-icon>
          </ScButton>
        </el-tooltip>
        <el-tooltip content="上传文件">
          <ScButton circle size="small" @click="triggerUpload">
            <el-icon><Upload /></el-icon>
          </ScButton>
        </el-tooltip>
        <el-tooltip content="上传规则">
          <ScButton circle size="small" @click="showUploadOptions = true">
            <el-icon><Setting /></el-icon>
          </ScButton>
        </el-tooltip>
      </div>

      <!-- 文件列表 -->
      <div v-loading="listLoading" class="rfm__file-list thin-scroller">
        <div
          v-for="entry in displayEntries"
          :key="entry.path"
          class="rfm__file-item"
          :class="{
            'is-active': activeEntry?.path === entry.path,
            'is-dir': entry.directory,
          }"
          @click="onEntryClick(entry)"
        >
          <span class="rfm__file-icon">
            <IconifyIconOnline :icon="fileIcon(entry)" />
          </span>
          <div class="rfm__file-meta">
            <template v-if="renamingPath === entry.path">
              <el-input
                v-model="renameValue"
                size="small"
                autofocus
                @keyup.enter="confirmRename(entry)"
                @keyup.esc="renamingPath = ''"
                @click.stop
              />
            </template>
            <template v-else>
              <span class="rfm__file-name">{{ entry.name }}</span>
              <span class="rfm__file-info">{{ formatSize(entry.size) }} · {{ formatTime(entry.lastModified) }}</span>
            </template>
          </div>
          <div class="rfm__file-actions">
            <el-tooltip content="重命名">
              <ScButton circle size="small" @click.stop="startRename(entry)">
                <el-icon><Edit /></el-icon>
              </ScButton>
            </el-tooltip>
            <el-tooltip content="下载" v-if="entry.file">
              <ScButton circle size="small" @click.stop="downloadEntry(entry)">
                <el-icon><Download /></el-icon>
              </ScButton>
            </el-tooltip>
            <el-tooltip content="删除">
              <ScButton circle size="small" type="danger" plain @click.stop="confirmDelete(entry)">
                <el-icon><Delete /></el-icon>
              </ScButton>
            </el-tooltip>
          </div>
        </div>
        <el-empty
          v-if="!listLoading && !displayEntries.length"
          :description="entries.length ? '没有匹配到文件' : '目录为空'"
          :image-size="60"
        />
      </div>

      <!-- 上传进度 -->
      <div v-if="uploadingFiles.length" class="rfm__upload-progress">
        <div v-for="uf in uploadingFiles" :key="uf.name" class="rfm__upload-item">
          <span class="rfm__upload-name">{{ uf.name }}</span>
          <el-progress :percentage="uf.percent" :status="uf.status" size="small" />
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="rfm__content">
      <template v-if="activeEntry && activeEntry.file">
        <div class="rfm__content-header">
          <div>
            <p class="rfm__eyebrow">{{ activeEntry.extension?.toUpperCase() || 'FILE' }}</p>
            <h4 class="rfm__content-title">{{ activeEntry.name }}</h4>
            <p class="rfm__content-meta">{{ formatSize(activeEntry.size) }} · {{ formatTime(activeEntry.lastModified) }}</p>
          </div>
          <div class="rfm__content-actions">
            <el-tag v-if="contentDirty" effect="plain" type="warning" size="small" round>已修改</el-tag>
            <el-tooltip v-if="contentDirty" content="还原修改" placement="top">
              <ScButton circle size="small" plain @click="resetContent">
                <el-icon><Refresh /></el-icon>
              </ScButton>
            </el-tooltip>
            <el-tooltip v-if="contentDirty" content="保存内容" placement="top">
              <ScButton
                circle
                size="small"
                type="primary"
                :loading="saving"
                @click="saveContent"
              >
                <el-icon><Check /></el-icon>
              </ScButton>
            </el-tooltip>
            <el-tooltip content="下载文件" placement="top">
              <ScButton circle size="small" plain @click="downloadEntry(activeEntry)">
                <el-icon><Download /></el-icon>
              </ScButton>
            </el-tooltip>
          </div>
        </div>

        <div v-loading="contentLoading" class="rfm__editor-wrap">
          <!-- 图片预览 -->
          <template v-if="isImage(activeEntry)">
            <div class="rfm__image-preview">
              <img :src="api.downloadFile(activeEntry.path)" :alt="activeEntry.name" />
            </div>
          </template>
          <!-- 文本编辑器 -->
          <template v-else-if="isText(activeEntry)">
            <textarea
              v-model="draftContent"
              class="rfm__editor"
              spellcheck="false"
              @input="contentDirty = true"
            />
          </template>
          <!-- 其他文件信息 -->
          <template v-else>
            <div class="rfm__file-info-panel">
              <div class="rfm__info-row"><span>文件名</span><strong>{{ activeEntry.name }}</strong></div>
              <div class="rfm__info-row"><span>路径</span><strong>{{ activeEntry.path }}</strong></div>
              <div class="rfm__info-row"><span>大小</span><strong>{{ formatSize(activeEntry.size) }}</strong></div>
              <div class="rfm__info-row"><span>修改时间</span><strong>{{ formatTime(activeEntry.lastModified) }}</strong></div>
              <div class="rfm__info-row"><span>扩展名</span><strong>{{ activeEntry.extension || '无' }}</strong></div>
            </div>
          </template>
        </div>
      </template>
      <div v-else class="rfm__empty-state">
        <span class="rfm__empty-icon">
          <IconifyIconOnline icon="ri:file-search-line" />
        </span>
        <h4>从左侧选择一个文件</h4>
        <p>支持文本编辑、图片预览、下载与重命名。</p>
      </div>
    </main>

    <!-- 隐藏上传 input -->
    <input ref="uploadInputRef" type="file" multiple class="rfm__hidden-input" @change="onFileInputChange" />

    <!-- 新建目录对话框 -->
    <ScDialog v-model="showNewDirDialog" title="新建目录" width="400px" append-to-body>
      <el-input v-model="newDirName" placeholder="目录名称" @keyup.enter="createDir" />
      <template #footer>
        <ScButton @click="showNewDirDialog = false">取消</ScButton>
        <ScButton type="primary" :loading="newDirLoading" @click="createDir">创建</ScButton>
      </template>
    </ScDialog>

    <!-- 上传规则配置弹窗 -->
    <ScDialog v-model="showUploadOptions" title="上传规则配置" width="480px" append-to-body>
      <el-form label-width="120px" label-position="left" class="rfm__options-form">
        <el-form-item label="目标目录">
          <el-input v-model="uploadOptions.directory" placeholder="默认当前目录" />
        </el-form-item>
        <el-form-item label="清空目标目录">
          <el-switch v-model="uploadOptions.clearBefore" />
        </el-form-item>
        <template v-if="uploadOptions.clearBefore">
          <el-form-item label="备份原有文件">
            <el-switch v-model="uploadOptions.backupBefore" />
          </el-form-item>
          <el-form-item v-if="uploadOptions.backupBefore" label="备份目录">
            <el-input v-model="uploadOptions.backupDirectory" placeholder="/backup" />
          </el-form-item>
        </template>
        <el-form-item label="自动解压">
          <el-switch v-model="uploadOptions.autoExtract" />
          <span class="rfm__option-hint">支持 zip / tar.gz</span>
        </el-form-item>
        <el-form-item v-if="uploadOptions.autoExtract" label="解压后删除包">
          <el-switch v-model="uploadOptions.deleteArchiveAfterExtract" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ScButton @click="showUploadOptions = false">关闭</ScButton>
        <ScButton type="primary" @click="showUploadOptions = false; triggerUpload()">确认并上传</ScButton>
      </template>
    </ScDialog>
  </div>
</template>

<script setup lang="ts">


import { ScButton } from "@repo/components/ScButton";
import { ScDialog } from "@repo/components/ScDialog";
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Check,
  Refresh,
  ArrowUp,
  FolderAdd,
  Upload,
  Setting,
  Edit,
  Download,
  Delete,
} from "@element-plus/icons-vue";
import type { RemoteApi, RemoteFileEntry, RemoteUploadOptions } from "../api/remote";

const props = withDefaults(
  defineProps<{
    api: RemoteApi;
    rootPath?: string;
    title?: string;
  }>(),
  {
    rootPath: "/",
    title: "文件管理",
  }
);

const currentPath = ref(props.rootPath);
const entries = ref<RemoteFileEntry[]>([]);
const listLoading = ref(false);
const activeEntry = ref<RemoteFileEntry | null>(null);
const contentLoading = ref(false);
const draftContent = ref("");
const originalContent = ref("");
const contentDirty = ref(false);
const saving = ref(false);

const isDragOver = ref(false);
const uploadInputRef = ref<HTMLInputElement | null>(null);
const uploadingFiles = ref<Array<{ name: string; percent: number; status?: "success" | "exception" }>>([]);

const showNewDirDialog = ref(false);
const newDirName = ref("");
const newDirLoading = ref(false);

const showUploadOptions = ref(false);
const uploadOptions = ref<RemoteUploadOptions>({
  clearBefore: false,
  autoExtract: false,
  deleteArchiveAfterExtract: false,
  backupBefore: false,
  directory: "",
  backupDirectory: "/backup",
});

const renamingPath = ref("");
const renameValue = ref("");
const listKeyword = ref("");

// 面包屑
const breadcrumbs = computed(() => {
  const parts = currentPath.value.split("/").filter(Boolean);
  const crumbs = [{ label: "根目录", path: props.rootPath }];
  let acc = props.rootPath === "/" ? "" : props.rootPath;
  for (const p of parts) {
    acc += `/${p}`;
    crumbs.push({ label: p, path: acc });
  }
  return crumbs;
});

const fileCount = computed(
  () => entries.value.filter((item) => item.file).length,
);

const directoryCount = computed(
  () => entries.value.filter((item) => item.directory).length,
);

const displayEntries = computed(() => {
  const keyword = listKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return entries.value;
  }
  return entries.value.filter((item) => {
    const source = `${item.name || ""} ${item.path || ""}`.toLowerCase();
    return source.includes(keyword);
  });
});

// 加载文件列表
const loadFiles = async () => {
  listLoading.value = true;
  try {
    const res = await props.api.listFiles(currentPath.value);
    if (res.data) {
      entries.value = res.data.sort((a, b) => {
        if (a.directory && !b.directory) return -1;
        if (!a.directory && b.directory) return 1;
        return a.name.localeCompare(b.name);
      });
    }
  } catch (err: any) {
    ElMessage.error(err.message || "加载文件列表失败");
  } finally {
    listLoading.value = false;
  }
};

// 导航
const navigateTo = (path: string) => {
  currentPath.value = path;
  activeEntry.value = null;
  loadFiles();
};

const goUp = () => {
  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();
  navigateTo(parts.length ? `/${parts.join("/")}` : props.rootPath);
};

// 点击条目
const onEntryClick = (entry: RemoteFileEntry) => {
  if (entry.directory) {
    navigateTo(entry.path);
  } else {
    activeEntry.value = entry;
    loadFileContent(entry);
  }
};

// 加载文件内容
const loadFileContent = async (entry: RemoteFileEntry) => {
  if (!isText(entry)) return;
  contentLoading.value = true;
  try {
    const res = await props.api.readFileContent(entry.path);
    if (res.data) {
      draftContent.value = res.data.content;
      originalContent.value = res.data.content;
      contentDirty.value = false;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "读取文件失败");
  } finally {
    contentLoading.value = false;
  }
};

// 保存内容
const saveContent = async () => {
  if (!activeEntry.value) return;
  saving.value = true;
  try {
    await props.api.writeFileContent(activeEntry.value.path, draftContent.value);
    originalContent.value = draftContent.value;
    contentDirty.value = false;
    ElMessage.success("保存成功");
  } catch (err: any) {
    ElMessage.error(err.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

const resetContent = () => {
  draftContent.value = originalContent.value;
  contentDirty.value = false;
};

// 文件类型判断
const isImage = (entry: RemoteFileEntry) => {
  const ext = entry.extension?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext || "");
};

const isText = (entry: RemoteFileEntry) => {
  const ext = entry.extension?.toLowerCase();
  return [
    "txt", "md", "json", "xml", "yaml", "yml", "toml", "ini", "conf", "config",
    "js", "ts", "jsx", "tsx", "vue", "py", "java", "go", "rs", "c", "cpp", "h",
    "css", "scss", "sass", "less", "html", "htm", "sh", "bash", "zsh", "sql",
    "log", "env", "gitignore", "dockerfile", "makefile",
  ].includes(ext || "") || !entry.extension;
};

const fileIcon = (entry: RemoteFileEntry) => {
  if (entry.directory) return "ri:folder-2-line";
  const ext = entry.extension?.toLowerCase();
  if (isImage(entry)) return "ri:image-line";
  if (["js", "ts", "jsx", "tsx"].includes(ext || "")) return "ri:code-s-slash-line";
  if (["vue", "html", "htm"].includes(ext || "")) return "ri:layout-5-line";
  if (["json", "xml", "yaml", "yml"].includes(ext || "")) return "ri:file-list-3-line";
  if (["py", "java", "go", "rs", "c", "cpp"].includes(ext || "")) return "ri:terminal-box-line";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext || "")) return "ri:file-zip-line";
  return "ri:file-text-line";
};

// 格式化
const formatSize = (size?: number) => {
  if (!size) return "0 B";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatTime = (time?: number) => {
  if (!time) return "未知";
  return new Date(time).toLocaleString("zh-CN");
};

// 上传
const triggerUpload = () => {
  uploadInputRef.value?.click();
};

const onFileInputChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files) uploadFiles(Array.from(files));
};

const onDrop = (e: DragEvent) => {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (files) uploadFiles(Array.from(files));
};

const uploadFiles = async (files: File[]) => {
  const opts = { ...uploadOptions.value };
  if (!opts.directory) opts.directory = currentPath.value;

  for (const file of files) {
    const uf = { name: file.name, percent: 0 };
    uploadingFiles.value.push(uf);
    try {
      await props.api.uploadFile(file, opts);
      uf.percent = 100;
      uf.status = "success";
      ElMessage.success(`${file.name} 上传成功`);
    } catch (err: any) {
      uf.percent = 100;
      uf.status = "exception";
      ElMessage.error(`${file.name} 上传失败: ${err.message}`);
    }
  }

  setTimeout(() => {
    uploadingFiles.value = [];
    loadFiles();
  }, 2000);
};

// 新建目录
const createDir = async () => {
  if (!newDirName.value.trim()) return;
  newDirLoading.value = true;
  try {
    const path = `${currentPath.value}/${newDirName.value}`.replace(/\/+/g, "/");
    await props.api.createDirectory(path);
    ElMessage.success("创建成功");
    showNewDirDialog.value = false;
    newDirName.value = "";
    loadFiles();
  } catch (err: any) {
    ElMessage.error(err.message || "创建失败");
  } finally {
    newDirLoading.value = false;
  }
};

// 重命名
const startRename = (entry: RemoteFileEntry) => {
  renamingPath.value = entry.path;
  renameValue.value = entry.name;
};

const confirmRename = async (entry: RemoteFileEntry) => {
  if (!renameValue.value.trim() || renameValue.value === entry.name) {
    renamingPath.value = "";
    return;
  }
  try {
    const dir = entry.path.substring(0, entry.path.lastIndexOf("/"));
    const targetPath = `${dir}/${renameValue.value}`.replace(/\/+/g, "/");
    await props.api.renameFile(entry.path, targetPath);
    ElMessage.success("重命名成功");
    renamingPath.value = "";
    loadFiles();
  } catch (err: any) {
    ElMessage.error(err.message || "重命名失败");
  }
};

// 下载
const downloadEntry = (entry: RemoteFileEntry) => {
  window.open(props.api.downloadFile(entry.path), "_blank");
};

// 删除
const confirmDelete = async (entry: RemoteFileEntry) => {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${entry.directory ? "目录" : "文件"} "${entry.name}" 吗？`,
      "删除确认",
      { type: "warning" }
    );
    await props.api.deleteFile(entry.path, entry.directory);
    ElMessage.success("删除成功");
    if (activeEntry.value?.path === entry.path) activeEntry.value = null;
    loadFiles();
  } catch {
    // 用户取消
  }
};

// 初始化
watch(() => props.rootPath, (val) => {
  currentPath.value = val;
  loadFiles();
}, { immediate: true });
</script>

<style scoped lang="scss">
.rfm {
  --rfm-border: rgba(148, 163, 184, 0.18);
  --rfm-strong: #0f172a;
  --rfm-muted: #64748b;
  --rfm-accent: #0ea5e9;
  position: relative;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  height: 100%;
  min-height: 600px;
  padding: 18px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 36%),
    radial-gradient(circle at bottom right, rgba(245, 158, 11, 0.08), transparent 32%),
    linear-gradient(145deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96));
  border: 1px solid var(--rfm-border);
  box-shadow:
    0 18px 36px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.rfm--drag-over {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
}

.rfm__drag-mask {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: rgba(14, 165, 233, 0.12);
  border-radius: 24px;
  backdrop-filter: blur(4px);
}

.rfm__drag-hint {
  text-align: center;
  color: #0284c7;
  font-weight: 600;
}

.rfm__drag-icon {
  font-size: 48px;
  line-height: 1;
  display: block;
  margin-bottom: 12px;
}

.rfm__sidebar {
  display: grid;
  grid-template-rows: auto auto auto auto auto 1fr auto;
  gap: 12px;
  padding: 18px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 28%),
    rgba(255, 255, 255, 0.92);
  border: 1px solid var(--rfm-border);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.rfm__sidebar-head {
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.rfm__sidebar-kicker {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0284c7;
  font-weight: 700;
}

.rfm__sidebar-head h4 {
  margin: 0;
  color: var(--rfm-strong);
}

.rfm__sidebar-head p {
  margin: 0;
  color: var(--rfm-muted);
  font-size: 12px;
}

.rfm__breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.rfm__sidebar-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rfm__breadcrumb-seg {
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(14, 165, 233, 0.08);
  color: #0284c7;
  font-size: 12px;
  font-weight: 500;
  border: 0;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(14, 165, 233, 0.16);
  }

  &.is-last {
    background: #0ea5e9;
    color: #fff;
    cursor: default;
  }

  &:not(:last-child)::after {
    content: "/";
    margin-left: 8px;
    color: #94a3b8;
  }
}

.rfm__sidebar-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(248, 250, 252, 0.86);
}

.rfm__file-list {
  display: grid;
  gap: 6px;
  align-content: start;
  overflow-y: auto;
  max-height: 100%;
}

.rfm__file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.12);
  cursor: pointer;
  transition: all 0.2s;

  &:hover,
  &.is-active {
    background: rgba(255, 255, 255, 0.98);
    border-color: rgba(14, 165, 233, 0.3);
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  &.is-dir {
    font-weight: 500;
  }
}

.rfm__file-icon {
  font-size: 18px;
  color: #0369a1;
  line-height: 1;
  flex-shrink: 0;
}

.rfm__file-meta {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.rfm__file-name {
  font-size: 13px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfm__file-info {
  font-size: 11px;
  color: #94a3b8;
}

.rfm__file-actions {
  display: flex;
  gap: 4px;
  opacity: 0.25;
  transition: opacity 0.2s;

  .rfm__file-item:hover & {
    opacity: 1;
  }
}

.rfm__upload-progress {
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.rfm__upload-item {
  display: grid;
  gap: 6px;
  margin-bottom: 8px;
}

.rfm__upload-name {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfm__content {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  padding: 20px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 28%),
    linear-gradient(150deg, #0f172a 0%, #111827 40%, #020617 100%);
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.32);
}

.rfm__content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.rfm__eyebrow {
  margin: 0 0 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0ea5e9;
}

.rfm__content-title {
  margin: 0;
  color: #f1f5f9;
  font-size: 16px;
}

.rfm__content-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.rfm__content-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.rfm__editor-wrap {
  min-height: 0;
  overflow: hidden;
}

.rfm__editor {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 16px;
  border: 0;
  border-radius: 12px;
  background: #1e293b;
  color: #e2e8f0;
  font-family: "Fira Code", "Consolas", monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3);
  }
}

.rfm__image-preview {
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;

  img {
    max-width: 100%;
    max-height: 500px;
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
}

.rfm__file-info-panel {
  display: grid;
  gap: 12px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.rfm__info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  color: #cbd5e1;
  font-size: 13px;

  strong {
    color: #f1f5f9;
  }
}

.rfm__empty-state {
  display: grid;
  place-items: center;
  text-align: center;
  color: #94a3b8;
  padding: 60px 20px;
}

.rfm__empty-state h4 {
  margin: 0;
  color: #e2e8f0;
}

.rfm__empty-state p {
  margin: 8px 0 0;
  color: #94a3b8;
}

.rfm__empty-icon {
  font-size: 64px;
  line-height: 1;
  display: block;
  margin-bottom: 16px;
  color: #0369a1;
  opacity: 0.4;
}

.rfm__hidden-input {
  display: none;
}

.rfm__options-form {
  .el-form-item {
    margin-bottom: 18px;
  }
}

.rfm__option-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .rfm {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
</style>
