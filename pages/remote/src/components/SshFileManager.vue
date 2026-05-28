<template>
  <div class="ssh-file-manager" @dragover.prevent @dragenter.prevent="onDragEnter" @dragleave="onDragLeave" @drop.prevent="onDrop">
    <!-- 路径栏 -->
    <div class="fm-toolbar">
      <div class="fm-path-bar">
        <el-icon class="fm-path-icon"><FolderOpened /></el-icon>
        <el-input v-model="pathInput" size="small" placeholder="/" @keyup.enter="navigateTo(pathInput)" class="fm-path-input" />
        <el-button size="small" :icon="RefreshRight" circle @click="refreshList" title="刷新" />
      </div>
      <div class="fm-actions">
        <el-upload :show-file-list="false" :before-upload="handleFileUpload" multiple>
          <el-button size="small" :icon="Upload" type="primary" plain>上传</el-button>
        </el-upload>
        <el-button size="small" :icon="FolderAdd" plain @click="showMkdirDialog = true" title="新建目录" />
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="fm-file-list" v-loading="loading">
      <!-- 上级目录 -->
      <div class="fm-file-item fm-parent-dir" @dblclick="navigateUp" @click="selectedFile = null">
        <el-icon><Back /></el-icon>
        <span class="fm-file-name">..</span>
        <span class="fm-file-meta">上级目录</span>
      </div>

      <!-- 文件/目录列表 -->
      <div
        v-for="file in sortedFiles"
        :key="file.path"
        class="fm-file-item"
        :class="{ active: selectedFile?.path === file.path, directory: file.directory }"
        @click="selectedFile = file"
        @dblclick="onFileDoubleClick(file)"
        @contextmenu.prevent="showContextMenu($event, file)"
      >
        <el-icon class="fm-file-icon" :class="{ 'is-dir': file.directory }">
          <Folder v-if="file.directory" />
          <Document v-else />
        </el-icon>
        <span class="fm-file-name" :title="file.name">{{ file.name }}</span>
        <span class="fm-file-size">{{ file.directory ? '--' : formatSize(file.size) }}</span>
        <span class="fm-file-perms">{{ file.permissions }}</span>
      </div>

      <div v-if="!loading && files.length === 0" class="fm-empty">空目录</div>

      <!-- 加载更多 -->
      <div v-if="hasMoreFiles" class="fm-load-more">
        <el-button text size="small" type="primary" @click="loadMore">
          加载更多 ({{ displayedCount }}/{{ files.length }})
        </el-button>
      </div>
    </div>

    <!-- 上传/下载进度区 -->
    <div v-if="transfers.size > 0" class="fm-transfers">
      <div v-for="[id, t] in transfers" :key="id" class="fm-transfer-item">
        <div class="fm-transfer-info">
          <el-icon><Upload v-if="t.type === 'upload'" /><Download v-else /></el-icon>
          <span class="fm-transfer-name">{{ t.fileName }}</span>
          <span class="fm-transfer-percent">{{ t.percent }}%</span>
          <div class="fm-transfer-actions">
            <el-button v-if="t.percent < 100 && !t.error && !t.cancelled" text size="small" type="danger" @click="cancelTransfer(id)" title="取消">取消</el-button>
            <el-button v-else text size="small" @click="dismissTransfer(id)" title="关闭">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        <el-progress :percentage="t.percent" :show-text="false" :stroke-width="4" :status="t.error ? 'exception' : t.cancelled ? 'warning' : undefined" />
      </div>
    </div>

    <!-- 拖拽覆盖层 -->
    <div v-if="dragging" class="fm-drop-overlay">
      <el-icon :size="48"><Upload /></el-icon>
      <p>拖拽文件到此处上传</p>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="contextMenu.visible" class="fm-context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
        <div class="fm-ctx-item" @click="onCtxView" v-if="contextMenu.file && !contextMenu.file.directory">
          <el-icon><View /></el-icon> 查看
        </div>
        <div class="fm-ctx-item" @click="onCtxEdit" v-if="contextMenu.file && !contextMenu.file.directory">
          <el-icon><Edit /></el-icon> 编辑
        </div>
        <div class="fm-ctx-item" @click="onCtxDownload" v-if="contextMenu.file && !contextMenu.file.directory">
          <el-icon><Download /></el-icon> 下载
        </div>
        <div class="fm-ctx-item" @click="onCtxRename">
          <el-icon><EditPen /></el-icon> 重命名
        </div>
        <div class="fm-ctx-item fm-ctx-danger" @click="onCtxDelete">
          <el-icon><Delete /></el-icon> 删除
        </div>
      </div>
    </Teleport>

    <!-- 新建目录弹窗 -->
    <el-dialog v-model="showMkdirDialog" title="新建目录" width="360px" append-to-body>
      <el-input v-model="newDirName" placeholder="目录名称" @keyup.enter="confirmMkdir" />
      <template #footer>
        <el-button @click="showMkdirDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMkdir" :disabled="!newDirName.trim()">创建</el-button>
      </template>
    </el-dialog>

    <!-- 内联重命名 Popover -->
    <Teleport to="body">
      <div v-if="showInlineRename" class="fm-inline-rename" :style="inlineRenameStyle" @click.stop>
        <el-input
          ref="inlineRenameInput"
          v-model="inlineRenameValue"
          size="small"
          :placeholder="inlineRenameTarget?.name || ''"
          @keyup.enter="confirmInlineRename"
          @keyup.escape="cancelInlineRename"
          @blur="confirmInlineRename"
          style="width:200px"
        />
      </div>
    </Teleport>

    <!-- 文件编辑器 -->
    <el-dialog v-model="showEditor" :title="'编辑文件: ' + (editorFile?.name || '')" width="70%" append-to-body>
      <div class="fm-editor-toolbar" v-if="editorFile">
        <div class="fm-editor-meta">
          <span class="fm-editor-path">{{ editorFile.path }}</span>
          <el-tag size="small" :type="editorReadOnly ? 'warning' : 'success'" effect="plain">
            {{ editorReadOnly ? '只读' : '可编辑' }}
          </el-tag>
        </div>
        <div class="fm-editor-actions">
          <el-button size="small" @click="toggleEditorMode">
            {{ editorReadOnly ? '启用编辑' : '切换只读' }}
          </el-button>
          <el-button size="small" type="primary" :loading="editorSaving" :disabled="editorReadOnly" @click="saveEditorContent">
            保存
          </el-button>
        </div>
      </div>
      <el-input
        v-model="editorContent"
        type="textarea"
        :rows="24"
        :disabled="editorReadOnly && !editorContent"
        style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px;"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Folder,
  FolderOpened,
  FolderAdd,
  Document,
  Upload,
  Download,
  Delete,
  EditPen,
  RefreshRight,
  Back,
  View,
  Edit,
  CircleCheck,
  Close,
} from "@element-plus/icons-vue";

interface RemoteFile {
  name: string;
  path: string;
  size: number;
  directory: boolean;
  permissions: string;
  modifyTime: number;
}

interface TransferState {
  type: "upload" | "download";
  fileName: string;
  percent: number;
  total: number;
  received: number;
  chunks?: ArrayBuffer[];
  error?: boolean;
  cancelled?: boolean;
  dismissed?: boolean;
}

const props = defineProps<{
  sessionId: string | null;
  connectionState: string;
  sendFileOp: (sessionId: string, action: string, params?: Record<string, any>) => void;
}>();

const emit = defineEmits<{
  navigate: [path: string];
}>();

// ============ 状态 ============

const currentPath = ref("/");
const pathInput = ref("/");
const files = ref<RemoteFile[]>([]);
const loading = ref(false);
const selectedFile = ref<RemoteFile | null>(null);
const dragging = ref(false);

// 传输进度
const transfers = ref<Map<string, TransferState>>(new Map());

// 右键菜单
const contextMenu = ref({ visible: false, x: 0, y: 0, file: null as RemoteFile | null });

// 弹窗
const showMkdirDialog = ref(false);
const newDirName = ref("");

// 加载更多
const displayLimit = ref(100);
const totalFileCount = ref(0);

// 文件编辑器
const showEditor = ref(false);
const editorFile = ref<RemoteFile | null>(null);
const editorContent = ref("");
const editorSaving = ref(false);
const editorReadOnly = ref(true);

// 内联重命名
const showInlineRename = ref(false);
const inlineRenameValue = ref("");
const inlineRenameTarget = ref<RemoteFile | null>(null);
const inlineRenameInput = ref<HTMLElement>();

// 上传计数器
let uploadCounter = 0;

// 拖拽计数器（解决子元素 dragenter/dragleave 闪烁问题）
let dragCounter = 0;

// ============ 排序 ============

const sortedFiles = computed(() => {
  const sorted = [...files.value].sort((a, b) => {
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return sorted.slice(0, displayLimit.value);
});

const hasMoreFiles = computed(() => {
  return files.value.length > displayLimit.value;
});

const displayedCount = computed(() => {
  return Math.min(displayLimit.value, files.value.length);
});

function loadMore() {
  displayLimit.value += 100;
}

// ============ 方法 ============

function refreshList() {
  if (!props.sessionId) return;
  loading.value = true;
  props.sendFileOp(props.sessionId, "list", { path: currentPath.value });
}

function navigateTo(path: string) {
  if (!path || !props.sessionId) return;
  const normalized = path.startsWith("/") ? path : "/" + path;
  currentPath.value = normalized;
  pathInput.value = normalized;
  loading.value = true;
  props.sendFileOp(props.sessionId, "list", { path: normalized });
}

function navigateUp() {
  const parts = currentPath.value.split("/").filter(Boolean);
  parts.pop();
  navigateTo("/" + parts.join("/") || "/");
}

function onFileDoubleClick(file: RemoteFile) {
  if (file.directory) {
    navigateTo(file.path);
  } else {
    onCtxDownloadFile(file);
  }
}

// ============ 上传 ============

function handleFileUpload(file: File): boolean {
  if (!props.sessionId) return false;
  startUpload(file);
  return false; // 阻止 el-upload 默认行为
}

function startUpload(file: File) {
  const uploadId = `upload-${++uploadCounter}`;
  transfers.value.set(uploadId, {
    type: "upload",
    fileName: file.name,
    percent: 0,
    total: file.size,
    received: 0,
  });

  // 通知 Agent 准备接收
  props.sendFileOp(props.sessionId!, "upload_init", {
    path: currentPath.value,
    fileName: file.name,
    fileSize: file.size,
  });

  // 等 Agent 返回 uploadId 后再发 chunk（通过 handleFileOpResult 处理）
  // 暂存 file 引用，upload_init 响应后发送
  pendingUploads.set(file.name + ":" + file.size, { file, uploadId, transferKey: uploadId });
}

// 暂存待上传文件（等待 Agent 返回 uploadId）
const pendingUploads = new Map<string, { file: File; uploadId: string; transferKey: string }>();

/** 取消传输 */
function cancelTransfer(id: string) {
  const t = transfers.value.get(id);
  if (!t) return;
  t.cancelled = true;
  if (t.type === "upload") {
    // 清理 pending uploads 中匹配的条目
    for (const [key, pending] of pendingUploads) {
      if (pending.transferKey === id || pending.file.name === t.fileName) {
        pendingUploads.delete(key);
        break;
      }
    }
  }
  ElMessage.info(`已取消: ${t.fileName}`);
}

/** 关闭传输条目（已完成/已取消的） */
function dismissTransfer(id: string) {
  transfers.value.delete(id);
}

async function sendUploadChunks(agentUploadId: string, file: File, transferKey: string) {
  const CHUNK = 256 * 1024; // 256KB
  const totalChunks = Math.ceil(file.size / CHUNK);
  const transfer = transfers.value.get(transferKey);
  if (!transfer) return;

  for (let i = 0; i < totalChunks; i++) {
    // 检查是否已取消
    const current = transfers.value.get(transferKey);
    if (!current || current.cancelled) {
      // 通知 Agent 取消上传
      props.sendFileOp(props.sessionId!, "upload_cancel", { uploadId: agentUploadId });
      return;
    }

    const start = i * CHUNK;
    const end = Math.min(start + CHUNK, file.size);
    const slice = file.slice(start, end);
    const arrayBuffer = await slice.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    props.sendFileOp(props.sessionId!, "upload_chunk", {
      uploadId: agentUploadId,
      chunkIndex: i,
      data: base64,
    });

    // 更新进度
    current.received = end;
    current.percent = Math.round((end / file.size) * 100);

    // 短暂延迟避免拥塞
    if (i < totalChunks - 1) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  // 检查是否已取消后再通知完成
  const finalTransfer = transfers.value.get(transferKey);
  if (finalTransfer && !finalTransfer.cancelled) {
    props.sendFileOp(props.sessionId!, "upload_complete", { uploadId: agentUploadId });
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ============ 下载 ============

function onCtxDownloadFile(file: RemoteFile) {
  if (!props.sessionId || file.directory) return;
  const downloadId = `download-${Date.now()}`;
  transfers.value.set(downloadId, {
    type: "download",
    fileName: file.name,
    percent: 0,
    total: file.size,
    received: 0,
    chunks: [],
  });
  props.sendFileOp(props.sessionId, "download", { path: file.path, fileName: file.name });
}

// ============ 删除 ============

function onCtxDeleteFile(file: RemoteFile) {
  if (!props.sessionId) return;
  ElMessageBox.confirm(`确定删除 "${file.name}"？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  }).then(() => {
    props.sendFileOp(props.sessionId!, "delete", { path: file.path });
  }).catch(() => {});
}

// ============ 新建目录 ============

function confirmMkdir() {
  if (!props.sessionId || !newDirName.value.trim()) return;
  const dirPath = currentPath.value.endsWith("/")
    ? currentPath.value + newDirName.value.trim()
    : currentPath.value + "/" + newDirName.value.trim();
  props.sendFileOp(props.sessionId, "mkdir", { path: dirPath });
  showMkdirDialog.value = false;
  newDirName.value = "";
}

// ============ 内联重命名 ============

const inlineRenameStyle = ref({ left: '0px', top: '0px' });

function onCtxRenameFile(file: RemoteFile, x?: number, y?: number) {
  inlineRenameTarget.value = file;
  inlineRenameValue.value = file.name;
  inlineRenameStyle.value = {
    left: (x || contextMenu.value.x) + 'px',
    top: (y || contextMenu.value.y) + 'px',
  };
  showInlineRename.value = true;
  nextTick(() => {
    const inputEl = inlineRenameInput.value;
    if (inputEl && typeof inputEl === 'object' && 'focus' in inputEl) {
      (inputEl as any).focus?.();
    }
  });
}

function confirmInlineRename() {
  if (!props.sessionId || !inlineRenameTarget.value || !inlineRenameValue.value.trim()) {
    cancelInlineRename();
    return;
  }
  const oldPath = inlineRenameTarget.value.path;
  const parentDir = oldPath.substring(0, oldPath.lastIndexOf("/"));
  const newPath = parentDir + "/" + inlineRenameValue.value.trim();
  if (newPath === oldPath) {
    cancelInlineRename();
    return;
  }
  props.sendFileOp(props.sessionId, "rename", { oldPath, newPath });
  showInlineRename.value = false;
  inlineRenameTarget.value = null;
}

function cancelInlineRename() {
  showInlineRename.value = false;
  inlineRenameTarget.value = null;
}

// ============ 文件查看/编辑 ============

function onCtxViewFile(file: RemoteFile) {
  if (file.directory) return;
  editorReadOnly.value = true;
  editorFile.value = file;
  editorContent.value = "";
  showEditor.value = true;
  // 请求文件内容
  props.sendFileOp(props.sessionId!, "read", { path: file.path });
}

function onCtxEditFile(file: RemoteFile) {
  if (file.directory) return;
  editorReadOnly.value = false;
  editorFile.value = file;
  editorContent.value = "";
  showEditor.value = true;
  // 请求文件内容
  props.sendFileOp(props.sessionId!, "read", { path: file.path });
}

function toggleEditorMode() {
  editorReadOnly.value = !editorReadOnly.value;
}

function saveEditorContent() {
  if (!props.sessionId || !editorFile.value || editorReadOnly.value) return;
  editorSaving.value = true;
  props.sendFileOp(props.sessionId, "write", {
    path: editorFile.value.path,
    content: editorContent.value,
  });
}

// ============ 右键菜单 ============

function showContextMenu(e: MouseEvent, file: RemoteFile) {
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, file };
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

function onCtxDownload() {
  if (contextMenu.value.file) onCtxDownloadFile(contextMenu.value.file);
  hideContextMenu();
}

function onCtxRename() {
  if (contextMenu.value.file) onCtxRenameFile(contextMenu.value.file);
  hideContextMenu();
}

function onCtxDelete() {
  if (contextMenu.value.file) onCtxDeleteFile(contextMenu.value.file);
  hideContextMenu();
}

function onCtxView() {
  if (contextMenu.value.file) onCtxViewFile(contextMenu.value.file);
  hideContextMenu();
}

function onCtxEdit() {
  if (contextMenu.value.file) onCtxEditFile(contextMenu.value.file);
  hideContextMenu();
}

// ============ 拖拽上传 ============

function onDragEnter(_e: DragEvent) {
  dragCounter++;
  dragging.value = true;
}

function onDragLeave(_e: DragEvent) {
  dragCounter--;
  if (dragCounter <= 0) {
    dragging.value = false;
    dragCounter = 0;
  }
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  dragCounter = 0;
  const droppedFiles = e.dataTransfer?.files;
  if (!droppedFiles || !props.sessionId) return;
  for (let i = 0; i < droppedFiles.length; i++) {
    startUpload(droppedFiles[i]);
  }
}

// ============ 工具函数 ============

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

// ============ 处理 Agent 回调 ============

function handleFileOpResult(_sessionId: string, data: Record<string, any>) {
  const action = data.action as string;

  switch (action) {
    case "list":
      if (data.files) {
        files.value = data.files as RemoteFile[];
        currentPath.value = data.path as string;
        pathInput.value = data.path as string;
      }
      loading.value = false;
      break;

    case "pwd":
      if (data.path) {
        currentPath.value = data.path as string;
        pathInput.value = data.path as string;
        refreshList();
      }
      break;

    case "upload_init": {
      // Agent 分配了 uploadId，开始发送 chunk
      const agentUploadId = data.uploadId as string;
      const remotePath = data.remotePath as string;
      // 找到匹配的 pending upload
      for (const [key, pending] of pendingUploads) {
        if (remotePath.endsWith(pending.file.name) || key.includes(pending.file.name)) {
          pendingUploads.delete(key);
          sendUploadChunks(agentUploadId, pending.file, pending.transferKey);
          break;
        }
      }
      break;
    }

    case "upload_complete": {
      const remoteName = (data.remotePath as string || "").split("/").pop() || "";
      for (const [key, t] of transfers.value) {
        if (t.type === "upload" && t.fileName === remoteName) {
          t.percent = 100;
          setTimeout(() => transfers.value.delete(key), 2000);
          break;
        }
      }
      ElMessage.success("上传成功: " + remoteName);
      refreshList();
      break;
    }

    case "download_complete": {
      const did = data.downloadId as string;
      const fileName = data.fileName as string;
      // 查找匹配的下载传输
      for (const [key, t] of transfers.value) {
        if (t.type === "download" && t.fileName === fileName && t.chunks) {
          t.percent = 100;
          // 合并 chunk 并下载
          const blob = new Blob(t.chunks);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setTimeout(() => transfers.value.delete(key), 2000);
          break;
        }
      }
      ElMessage.success("下载完成: " + fileName);
      break;
    }

    case "delete":
      ElMessage.success("已删除: " + (data.path || "").split("/").pop());
      refreshList();
      break;

    case "mkdir":
      ElMessage.success("目录已创建");
      refreshList();
      break;

    case "rename":
      ElMessage.success("重命名成功");
      refreshList();
      break;

    case "read":
      if (data.content !== undefined) {
        editorContent.value = data.content as string;
        editorSaving.value = false;
      }
      if (data.error) {
        ElMessage.error("读取文件失败: " + data.error);
        showEditor.value = false;
      }
      break;

    case "write":
      editorSaving.value = false;
      if (data.error) {
        ElMessage.error("保存失败: " + data.error);
      } else {
        ElMessage.success("文件已保存");
      }
      break;

    case "upload_progress":
      for (const [, t] of transfers.value) {
        if (t.type === "upload" && t.percent < 100) {
          t.received = (data.received as number) || t.received;
          t.total = (data.total as number) || t.total;
          t.percent = t.total > 0 ? Math.round((t.received / t.total) * 100) : 0;
          break;
        }
      }
      break;

    case "download_progress": {
      const fileName = data.fileName as string;
      const chunkData = data.data as string;
      const chunkIndex = data.chunkIndex as number;
      const totalChunks = data.totalChunks as number;

      for (const [, t] of transfers.value) {
        if (t.type === "download" && t.fileName === fileName) {
          if (!t.chunks) t.chunks = [];
          const binary = atob(chunkData);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          t.chunks[chunkIndex] = bytes.buffer;
          t.received += bytes.length;
          t.percent = Math.round(((chunkIndex + 1) / totalChunks) * 100);
          break;
        }
      }
      break;
    }

    default:
      if (data.error) {
        ElMessage.error("操作失败: " + data.error);
        loading.value = false;
      }
  }
}

// ============ pwd 联动 ============

// 连接后自动加载
watch(
  () => props.connectionState,
  (state) => {
    if (state === "connected" && props.sessionId) {
      // 延迟加载，等待 SSH 连接稳定
      setTimeout(() => {
        props.sendFileOp(props.sessionId!, "pwd");
      }, 1000);
    }
  },
  { immediate: true }
);

// 监听终端 cd 命令（通过父组件调用 notifyCd）
function notifyCd(path: string) {
  navigateTo(path);
}

// 点击外部关闭右键菜单
function handleGlobalClick() {
  hideContextMenu();
}

onMounted(() => {
  document.addEventListener("click", handleGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener("click", handleGlobalClick);
});

// 批量上传（供父组件拖拽调用）
function startUploadFiles(files: File[]) {
  if (!props.sessionId) return;
  for (const file of files) {
    startUpload(file);
  }
}

// 暴露 notifyCd
defineExpose({ handleFileOpResult, refreshList, navigateTo, notifyCd, startUploadFiles });
</script>

<style scoped>
.ssh-file-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  font-size: 13px;
  background: var(--el-bg-color);
}

/* 工具栏 */
.fm-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.fm-path-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.fm-path-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.fm-path-input {
  flex: 1;
}

.fm-actions {
  display: flex;
  gap: 6px;
}

/* 文件列表 */
.fm-file-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.fm-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.fm-file-item:hover {
  background: var(--el-fill-color-light);
}

.fm-file-item.active {
  background: var(--el-color-primary-light-9);
}

.fm-file-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.fm-file-icon.is-dir {
  color: var(--el-color-primary);
}

.fm-file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.fm-file-size {
  width: 70px;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.fm-file-perms {
  width: 80px;
  text-align: right;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-family: monospace;
  flex-shrink: 0;
}

.fm-parent-dir {
  color: var(--el-text-color-secondary);
}

.fm-empty {
  text-align: center;
  color: var(--el-text-color-placeholder);
  padding: 32px 0;
}

/* 传输进度 */
.fm-transfers {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px 12px;
  max-height: 160px;
  overflow-y: auto;
  flex-shrink: 0;
}

.fm-transfer-item {
  margin-bottom: 6px;
}

.fm-transfer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  font-size: 12px;
}

.fm-transfer-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-transfer-percent {
  color: var(--el-color-primary);
  font-weight: 500;
}
.fm-transfer-actions {
  flex-shrink: 0;
}

/* 拖拽覆盖 */
.fm-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  border: 2px dashed var(--el-color-primary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 20;
  color: var(--el-color-primary);
}

.fm-drop-overlay p {
  font-size: 14px;
  margin: 0;
}

/* 右键菜单 */
.fm-context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: var(--el-box-shadow-light);
  min-width: 140px;
}

.fm-ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.fm-ctx-item:hover {
  background: var(--el-fill-color-light);
}

.fm-ctx-danger {
  color: var(--el-color-danger);
}

/* 细滚动条 */
.fm-file-list::-webkit-scrollbar { width: 5px; height: 5px; }
.fm-file-list::-webkit-scrollbar-track { background: transparent; }
.fm-file-list::-webkit-scrollbar-thumb { background: var(--el-border-color-lighter); border-radius: 3px; }
.fm-file-list::-webkit-scrollbar-thumb:hover { background: var(--el-border-color); }

/* 加载更多 */
.fm-load-more {
  text-align: center;
  padding: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

/* 内联重命名 */
.fm-inline-rename {
  position: fixed;
  z-index: 99999;
  background: var(--el-bg-color);
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
  padding: 4px;
  box-shadow: var(--el-box-shadow);
}

/* 文件编辑器 */
.fm-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.fm-editor-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fm-editor-path {
  font-family: monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.fm-editor-actions {
  display: flex;
  gap: 8px;
}
</style>
