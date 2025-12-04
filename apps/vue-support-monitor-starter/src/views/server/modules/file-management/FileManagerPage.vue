<template>
  <div class="file-manager-page" @dragenter.prevent @dragover.prevent @drop.prevent>
    <!-- 主要内容区域 -->
    <div class="manager-content">
      <!-- 左侧文件树 -->
      <div class="left-panel">
        <!-- 目录结构头部 -->
        <!-- <div class="tree-header">
          <div class="tree-header-left">
            <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
            <span class="tree-title">目录结构</span>
            <el-tag v-if="serverInfo" size="small" class="ml-2">
              {{ getFileManagementModeText(serverInfo.fileManagementMode) }}
            </el-tag>
          </div>
          <div class="tree-header-right">
            <el-button
              size="small"
              type="danger"
              :icon="useRenderIcon('ri:close-line')"
              circle
              @click="$emit('close')"
              title="关闭"
            />
          </div>
        </div> -->

        <!-- 文件树内容 -->
        <div class="tree-content">
          <FileTree
            ref="fileTreeRef"
            :server-id="serverId"
            :current-path="currentPath"
            @node-click="handleTreeNodeClick"
            @folder-click="handleTreeFolderClick"
            @file-click="handleTreeFileClick"
            @refresh="handleTreeRefresh"
            @drop-upload="handleDropUpload"
          />
        </div>
      </div>

      <!-- 分割线 -->
      <div class="splitter" />

      <!-- 右侧文件列表 -->
      <div class="right-panel">
        <!-- 工具栏 -->
        <div class="list-toolbar" style="padding: 8px 12px; display: flex; justify-content: flex-end; gap: 8px">
          <el-button type="primary" size="small" @click="showUploadDialog = true">
            <IconifyIconOnline icon="ri:upload-cloud-2-line" class="mr-1" />
            上传文件
          </el-button>
        </div>
        <!-- 文件列表区域 -->
        <div class="file-list-container">
          <FileList
            ref="fileListRef"
            :server-id="serverId"
            :current-path="currentPath"
            @path-change="handlePathChange"
            @file-select="handleFileSelect"
            @refresh="handleListRefresh"
            @sync="openDistribute($event)"
            @drop-upload="handleDropUpload"
          />
        </div>

        <!-- 文件详情面板 -->
        <div v-if="detailVisible" class="file-detail-panel" :class="{ 'panel-visible': detailVisible }" :style="{ height: detailVisible ? `${detailPanelHeight}px` : '0px' }">
          <!-- 拖拽手柄 -->
          <div class="resize-handle" @mousedown="startResize" @touchstart="startResize">
            <div class="resize-indicator" />
          </div>

          <div class="detail-header">
            <div class="detail-title">
              <IconifyIconOnline icon="ri:file-info-line" class="mr-2" />
              <span>文件属性</span>
            </div>
            <el-button size="small" text class="close-detail-btn" @click="detailVisible = false">
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </div>
          <div class="detail-content">
            <!-- 上传对话框 -->
            <MultiTargetUploadDialog v-model="showUploadDialog" :current-path="currentPath" :queue-status="queueStatus" :enqueue="enqueue" :preset-files="presetFiles" @success="handleUploadSuccess" />

            <MultiTargetDistributeDialog
              v-model="showDistributeDialog"
              :source-server-id="serverId"
              :source-file-path="selectedFile?.path || ''"
              :current-path="currentPath"
              @success="handleDistributeSuccess"
            />

            <!-- 上传队列状态 -->
            <UploadQueueStatusComponent
              ref="queueStatusRef"
              :queue-status="queueStatus"
              @queue-update="handleQueueUpdate"
              @pause-all="manager.pauseAll()"
              @resume-all="manager.resumeAll()"
              @clear-completed="manager.clearCompleted()"
              @cancel-task="manager.cancelTask($event)"
              @sync-task="handleSyncTask"
            />
            <FileDetailContent :server-id="serverId" :file-info="selectedFile" @preview="handleFileDetailPreview" @download="handleFileDetailDownload" @delete="handleFileDetailDelete" />
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览/编辑对话框 -->
    <FilePreviewDialog v-model:visible="previewVisible" :server-id="serverId" :file-info="selectedFile" @file-updated="handleFileUpdated" />
  </div>
</template>

<script setup lang="ts">
import type { FileInfo } from "@/api/server/file-management";
import { uploadServerFileWithProgress } from "@/api/server/upload";
import { useFileSystemSSE } from "@/composables/useFileSystemSSE";
import UploadQueueStatusComponent from "@/views/file-system/components/UploadQueueStatus.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, onUnmounted, ref, watch } from "vue";
import FileDetailContent from "./FileDetailContent.vue";
import FileList from "./FileList.vue";
import FilePreviewDialog from "./FilePreviewDialog.vue";
import FileTree from "./FileTree.vue";
import MultiTargetDistributeDialog from "./components/MultiTargetDistributeDialog.vue";
import MultiTargetUploadDialog from "./components/MultiTargetUploadDialog.vue";
import { useUploadManager } from "./composables/useUploadManager";
// 上传对话框
const showUploadDialog = ref(false);

// 队列状态（与文件系统模块复用）
const { queueStatus, connect: connectSSE, disconnect: disconnectSSE, onMessage, MESSAGE_TYPE } = useFileSystemSSE();
const queueStatusRef = ref();

function handleUploadSuccess() {
  // 上传成功后刷新当前列表
  fileListRef.value?.refreshList?.();
}

function handleQueueUpdate(list: any[]) {
  // 可选：在页面其他位置同步显示数量
  console.log("Upload queue updated:", list?.length);
}

// 上传管理器（并发/控制）
const manager = useUploadManager({
  concurrency: 3,
  maxRetries: 2,
  queueMap: queueStatus.value
});
const presetFiles = ref<File[]>([]);
function handleSyncTask(fileId: number) {
  const meta = manager.getTaskMeta?.(fileId);
  if (!meta?.file) {
    ElMessage.warning("无法获取原始文件，无法同步");
    return;
  }
  // 预填文件到对话框，用户选择目标服务器/节点后执行
  presetFiles.value = [meta.file];
  showUploadDialog.value = true;
}

// 上传对话框入队方法：供子组件调用
const enqueue = (
  tasks: Array<{
    id: number;
    name: string;
    run: (signal: AbortSignal, onProgress: (p: number) => void) => Promise<void>;
  }>
) => {
  manager.enqueue(tasks as any);
};

// 打开分发对话框（来自文件列表 @sync 事件）
function openDistribute(file: FileInfo) {
  selectedFile.value = file;
  showDistributeDialog.value = true;
}

// 分发完成回调（关闭对话框并刷新列表）
function handleDistributeSuccess() {
  ElMessage.success("同步任务已完成");
  showDistributeDialog.value = false;
  fileListRef.value?.refreshList?.();
}

onMounted(() => {
  connectSSE();
});

onUnmounted(() => {
  disconnectSSE();
});

// Props
const props = defineProps<{
  serverId: number;
  serverInfo?: any;
}>();

// 响应式数据
const currentPath = ref("/");
const selectedFile = ref<FileInfo | null>(null);
const previewVisible = ref(false);
const detailVisible = ref(false);
const showDistributeDialog = ref(false);

// 拖拽调整高度相关
const detailPanelHeight = ref(300); // 默认高度
const isResizing = ref(false);
const minHeight = 150; // 最小高度
const maxHeightRatio = 0.7; // 最大高度占窗口的比例

// 组件引用
const fileTreeRef = ref();
const fileListRef = ref();

/**
 * 获取文件管理模式文本
 */
const getFileManagementModeText = (mode: string) => {
  const modeMap: Record<string, string> = {
    LOCAL: "本地连接",
    SSH: "SSH连接",
    NODE: "NODE客户端",
    API: "API连接",
    NONE: "未启用"
  };
  return modeMap[mode] || mode;
};

/**
 * 处理树节点点击（兼容旧版本）
 */
const handleTreeNodeClick = async (path: string, node: FileInfo) => {
  console.log("FileManagerPage: Tree node clicked", path, node);
  if (node.isDirectory) {
    await handleTreeFolderClick(path, node);
  } else {
    await handleTreeFileClick(path, node);
  }
};

/**
 * 处理树文件夹点击
 */
const handleTreeFolderClick = async (path: string, node: FileInfo) => {
  console.log("FileManagerPage: Tree folder clicked", path, node);

  // 先更新路径
  currentPath.value = path;

  // 等待树的选中状态更新完成
  await fileTreeRef.value?.setCurrentPath(path);

  // 主动加载右侧文件列表
  fileListRef.value?.loadFileList();

  console.log("FileManagerPage: Directory clicked, path updated to:", path);
};

/**
 * 处理树文件点击
 */
const handleTreeFileClick = async (path: string, node: FileInfo) => {
  console.log("FileManagerPage: Tree file clicked", path, node);

  // 如果是文件，触发预览
  selectedFile.value = node;
  previewVisible.value = true;
};

/**
 * 处理路径变化
 */
const handlePathChange = async (path: string) => {
  console.log("FileManagerPage: Path changed to", path);
  currentPath.value = path;

  // 同步左侧文件树：展开到新路径并高亮
  try {
    await fileTreeRef.value?.expandToPath(path);
    console.log("FileManagerPage: Tree expanded to path", path);
  } catch (error) {
    console.error("FileManagerPage: Failed to expand tree to path", path, error);
    // 如果展开失败，至少设置当前选中状态
    fileTreeRef.value?.setCurrentPath(path);
  }

  // 主动加载右侧文件列表
  fileListRef.value?.loadFileList();
};

/**
 * 处理文件选择
 */
const handleFileSelect = (file: FileInfo) => {
  console.log("FileManagerPage: File selected", file);
  selectedFile.value = file;

  // 根据文件类型决定操作
  if (file.isDirectory) {
    // 目录：显示详情
    detailVisible.value = true;
  } else {
    // 文件：根据类型决定是否可以预览
    if (isPreviewableFile(file)) {
      previewVisible.value = true;
    } else {
      detailVisible.value = true;
    }
  }
};

/**
 * 判断文件是否可以预览
 */
const isPreviewableFile = (file: FileInfo) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const previewableExts = [
    "txt",
    "md",
    "json",
    "xml",
    "html",
    "css",
    "js",
    "ts",
    "vue",
    "jsx",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "h",
    "hpp",
    "php",
    "rb",
    "go",
    "rs",
    "sh",
    "bat",
    "yml",
    "yaml",
    "ini",
    "conf"
  ];
  return previewableExts.includes(ext || "");
};

/**
 * 处理树刷新
 */
const handleTreeRefresh = () => {
  console.log("FileManagerPage: Tree refreshed");
};

/**
 * 处理列表刷新
 */
const handleListRefresh = () => {
  console.log("FileManagerPage: List refreshed");
};

/**
 * 处理文件更新
 */
const handleFileUpdated = () => {
  // 刷新文件列表
  fileListRef.value?.refreshList();
  ElMessage.success("文件更新成功");
};

/**
 * 处理拖拽上传（来自左树或右列表）
 */
async function handleDropUpload(targetDir: string, files: File[]) {
  if (!props.serverId) {
    ElMessage.warning("请先选择服务器");
    return;
  }
  if (!targetDir) targetDir = currentPath.value || "/";
  if (!targetDir.startsWith("/")) targetDir = "/" + targetDir;

  // 是否覆盖确认
  const { value: overwrite } = await ElMessageBox.confirm(`目标目录: ${targetDir}\n共 ${files.length} 个文件。是否覆盖已存在的同名文件？`, "上传确认", {
    confirmButtonText: "覆盖",
    cancelButtonText: "不覆盖",
    distinguishCancelAndClose: true,
    type: "warning"
  })
    .then(() => ({ value: true }))
    .catch(action => ({ value: action === "confirm" }));

  // 构建上传任务并入队
  const tasks = files.map(file => {
    const id = -Date.now() - Math.floor(Math.random() * 100000);
    const name = `${file.name} @ S:${props.serverId}`;
    return {
      id,
      name,
      meta: { file, target: { type: "SERVER", id: props.serverId }, dirPath: targetDir },
      run: (signal: AbortSignal, onProgress: (p: number) => void) =>
        uploadServerFileWithProgress(
          { serverId: props.serverId, targetPath: targetDir, file, overwrite },
          e => {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            onProgress(percent);
          },
          signal
        ).then(() => void 0)
    };
  });

  manager.enqueue(tasks as any);
  showUploadDialog.value = true; // 打开上传对话框查看进度
}

/**
 * 刷新当前视图
 */
const refreshAll = () => {
  console.log("FileManagerPage: Refreshing current view");
  // 只刷新右侧文件列表，保持左侧树的展开状态
  fileListRef.value?.refreshList();
  // 如果需要刷新树的当前节点，可以调用特定的刷新方法
  // fileTreeRef.value?.refreshCurrentNode();
};

/**
 * 处理文件详情操作
 */
const handleFileDetailPreview = (file: FileInfo) => {
  selectedFile.value = file;
  previewVisible.value = true;
};

const handleFileDetailDownload = (file: FileInfo) => {
  // TODO: 实现文件下载功能
  console.log("Download file:", file);
  ElMessage.info("下载功能开发中...");
};

const handleFileDetailDelete = (file: FileInfo) => {
  // TODO: 实现文件删除功能
  console.log("Delete file:", file);
  ElMessage.info("删除功能开发中...");
  // 删除成功后关闭详情面板
  detailVisible.value = false;
};

/**
 * 拖拽调整面板高度相关方法
 */
const startResize = (event: MouseEvent | TouchEvent) => {
  event.preventDefault();
  isResizing.value = true;

  const startY = "touches" in event ? event.touches[0].clientY : event.clientY;
  const startHeight = detailPanelHeight.value;

  const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
    if (!isResizing.value) return;

    const currentY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
    const deltaY = startY - currentY; // 向上拖拽为正值
    const newHeight = startHeight + deltaY;

    // 计算最大高度
    const maxHeight = window.innerHeight * maxHeightRatio;

    // 限制高度范围
    detailPanelHeight.value = Math.max(minHeight, Math.min(newHeight, maxHeight));
  };

  const handleMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("touchmove", handleMouseMove);
    document.removeEventListener("touchend", handleMouseUp);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  // 添加事件监听器
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("touchmove", handleMouseMove);
  document.addEventListener("touchend", handleMouseUp);

  // 防止文本选择和设置光标样式
  document.body.style.userSelect = "none";
  document.body.style.cursor = "row-resize";
};

/**
 * 处理键盘快捷键
 */
const handleKeydown = (event: KeyboardEvent) => {
  // F5 刷新
  if (event.key === "F5") {
    event.preventDefault();
    refreshAll();
  }

  // Ctrl+R 刷新
  if (event.ctrlKey && event.key === "r") {
    event.preventDefault();
    refreshAll();
  }

  // ESC 关闭对话框
  if (event.key === "Escape") {
    if (previewVisible.value) {
      previewVisible.value = false;
    } else if (detailVisible.value) {
      detailVisible.value = false;
    }
  }
};

// 监听serverId变化，重置文件列表状态
watch(
  () => props.serverId,
  (newServerId, oldServerId) => {
    if (newServerId !== oldServerId && fileListRef.value) {
      console.log("FileManagerPage: ServerId changed, resetting file list state");
      fileListRef.value.resetState();
      currentPath.value = "/"; // 重置路径到根目录
    }
  }
);

// 监听serverId变化，刷新文件树
watch(
  () => props.serverId,
  newServerId => {
    console.log("FileManagerPage: serverId changed to", newServerId);
    if (newServerId && fileTreeRef.value) {
      // 主动刷新文件树
      fileTreeRef.value.refreshTree();
    }
  },
  { immediate: true }
);

// 生命周期
onMounted(() => {
  console.log("FileManagerPage: Mounted with serverId", props.serverId);
  document.addEventListener("keydown", handleKeydown);
  const prevent = (e: DragEvent) => {
    e.preventDefault();
  };
  // 防止浏览器默认的拖拽打开行为（全局）
  document.addEventListener("dragover", prevent);
  document.addEventListener("drop", prevent);
  // 存到 window 以便卸载时移除
  (window as any).__fm_prevent_drag__ = prevent;
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
  const prevent = (window as any).__fm_prevent_drag__ as (e: DragEvent) => void;
  if (prevent) {
    document.removeEventListener("dragover", prevent);
    document.removeEventListener("drop", prevent);
    (window as any).__fm_prevent_drag__ = null;
  }
});

// 暴露方法
defineExpose({
  refreshAll,
  setCurrentPath: (path: string) => {
    currentPath.value = path;
  }
});
</script>

<style scoped>
.file-manager-page {
  height: 100vh; /* 撑满整个视口高度 */
  width: 100vw; /* 撑满整个视口宽度 */
  display: flex;
  flex-direction: column;
   background: var(--el-bg-color-overlay); /* 设置背景为白色 */
  overflow: hidden;
  position: fixed; /* 固定定位确保撑满页面 */
  top: 0;
  left: 0;
  z-index: 1000; /* 确保在最上层 */
}

.manager-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  min-width: 220px;
  max-width: 400px;
  height: 100%;
  flex-shrink: 0;
   background: var(--el-bg-color-overlay); /* 设置左侧面板背景为白色 */
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-light);
}

/* 目录结构头部样式 */
.tree-header {
  height: 50px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-light);
  background: var(--el-fill-color-extra-light);
  flex-shrink: 0;
}

.tree-header-left {
  display: flex;
  align-items: center;
}

.tree-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.tree-header-right {
  display: flex;
  gap: 6px;
}

/* 文件树内容区域 */
.tree-content {
  flex: 1;
  overflow: auto;
}

/* 统一滚动条样式 */
.tree-content::-webkit-scrollbar,
.right-panel::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.tree-content::-webkit-scrollbar-track,
.right-panel::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.tree-content::-webkit-scrollbar-thumb,
.right-panel::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 3px;
  transition: background 0.3s;
}

.tree-content::-webkit-scrollbar-thumb:hover,
.right-panel::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary-light-5);
}

/* 按钮样式优化 */
.tree-header-right .el-button {
  width: 28px;
  height: 28px;
  padding: 0;
  margin-left: 4px;
}

.splitter {
  width: 1px;
  background: var(--el-border-color-light);
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
}

.splitter:hover {
  background: var(--el-color-primary);
}

.splitter::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 0;
  width: 5px;
  height: 100%;
  background: transparent;
}

.right-panel {
  flex: 1;
  height: 100%;
  overflow: hidden;
   background: var(--el-bg-color-overlay); /* 设置右侧面板背景为白色 */
  display: flex;
  flex-direction: column;
}

/* 文件列表容器 */
.file-list-container {
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 文件详情面板 */
.file-detail-panel {
  overflow: hidden;
   background: var(--el-bg-color-overlay); /* 设置文件详情面板背景为白色 */
  border-top: 1px solid var(--el-border-color-light);
  transition: height 0.3s ease;
  position: relative;
}

/* 拖拽手柄 */
.resize-handle {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  cursor: row-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover {
  background: var(--el-color-primary-light-8);
}

.resize-indicator {
  width: 40px;
  height: 2px;
  background: var(--el-border-color-darker);
  border-radius: 1px;
  transition: background 0.2s ease;
}

.resize-handle:hover .resize-indicator {
  background: var(--el-color-primary);
}

/* 详情面板头部 */
.detail-header {
  height: 40px;
  padding: 0 16px;
  margin-top: 3px; /* 为拖拽手柄留出空间 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.detail-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.close-detail-btn {
  width: 24px;
  height: 24px;
  padding: 0;
}

/* 详情面板内容 */
.detail-content {
  height: calc(100% - 43px); /* 减去头部高度和拖拽手柄空间 */
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .manager-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    height: 250px; /* 增加移动端高度 */
    max-width: none;
  }

  .tree-header {
    height: 45px;
    padding: 0 12px;
  }

  .tree-title {
    font-size: 13px;
  }

  .splitter {
    width: 100%;
    height: 1px;
    cursor: row-resize;
  }

  .splitter::before {
    left: 0;
    top: -2px;
    width: 100%;
    height: 5px;
  }

  .right-panel {
    flex: 1;
    width: 100%;
  }

  .file-detail-panel {
    /* 移动端使用固定高度，不支持拖拽调整 */
    height: 250px !important;
  }

  .resize-handle {
    display: none; /* 移动端隐藏拖拽手柄 */
  }

  .detail-header {
    margin-top: 0; /* 移动端不需要为拖拽手柄留空间 */
  }
}

/* 暗色主题适配 - 强制保持白色背景 */
@media (prefers-color-scheme: dark) {
  .file-manager-page {
    background: #ffffff !important; /* 强制保持白色背景 */
  }

  .tree-header {
    background: #ffffff !important; /* 强制保持白色背景 */
    border-bottom-color: var(--el-border-color);
  }

  .left-panel,
  .right-panel,
  .file-detail-panel {
    background: #ffffff !important; /* 强制保持白色背景 */
  }

  .detail-header {
    background: #ffffff !important; /* 强制保持白色背景 */
    border-bottom-color: var(--el-border-color);
  }

  .splitter {
    background: var(--el-border-color);
  }
}
</style>
