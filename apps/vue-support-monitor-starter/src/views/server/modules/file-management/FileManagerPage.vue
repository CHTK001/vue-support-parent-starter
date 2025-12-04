<template>
  <div
    class="file-manager-page"
    @dragenter.prevent
    @dragover.prevent
    @drop.prevent
  >
    <!-- 主要内容区域 -->
    <div class="manager-content">
      <!-- 左侧文件�?-->
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

        <!-- 文件树内�?-->
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

      <!-- 分割�?-->
      <div class="splitter" />

      <!-- 右侧文件列表 -->
      <div class="right-panel">
        <!-- 工具�?-->
        <div
          class="list-toolbar"
          style="
            padding: 8px 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          "
        >
          <el-button
            type="primary"
            size="small"
            @click="showUploadDialog = true"
          >
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
        <div
          v-if="detailVisible"
          class="file-detail-panel"
          :class="{ 'panel-visible': detailVisible }"
          :style="{ height: detailVisible ? `${detailPanelHeight}px` : '0px' }"
        >
          <!-- 拖拽手柄 -->
          <div
            class="resize-handle"
            @mousedown="startResize"
            @touchstart="startResize"
          >
            <div class="resize-indicator" />
          </div>

          <div class="detail-header">
            <div class="detail-title">
              <IconifyIconOnline icon="ri:file-info-line" class="mr-2" />
              <span>文件属�?/span>
            </div>
            <el-button
              size="small"
              text
              class="close-detail-btn"
              @click="detailVisible = false"
            >
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </div>
          <div class="detail-content">
            <!-- 上传对话�?-->
            <MultiTargetUploadDialog
              v-model="showUploadDialog"
              :current-path="currentPath"
              :queue-status="queueStatus"
              :enqueue="enqueue"
              :preset-files="presetFiles"
              @success="handleUploadSuccess"
            />

            <MultiTargetDistributeDialog
              v-model="showDistributeDialog"
              :source-server-id="serverId"
              :source-file-path="selectedFile?.path || ''"
              :current-path="currentPath"
              @success="handleDistributeSuccess"
            />

            <!-- 上传队列状�?-->
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
            <FileDetailContent
              :server-id="serverId"
              :file-info="selectedFile"
              @preview="handleFileDetailPreview"
              @download="handleFileDetailDownload"
              @delete="handleFileDetailDelete"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览/编辑对话�?-->
    <FilePreviewDialog
      v-model:visible="previewVisible"
      :server-id="serverId"
      :file-info="selectedFile"
      @file-updated="handleFileUpdated"
    />
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
// 上传对话�?
const showUploadDialog = ref(false);

// 队列状态（与文件系统模块复用）
const {
  queueStatus,
  connect: connectSSE,
  disconnect: disconnectSSE,
  onMessage,
  MESSAGE_TYPE,
} = useFileSystemSSE();
const queueStatusRef = ref();

function handleUploadSuccess() {
  // 上传成功后刷新当前列�?
  fileListRef.value?.refreshList?.();
}

function handleQueueUpdate(list: any[]) {
  // 可选：在页面其他位置同步显示数�?
  console.log("Upload queue updated:", list?.length);
}

// 上传管理器（并发/控制�?
const manager = useUploadManager({
  concurrency: 3,
  maxRetries: 2,
  queueMap: queueStatus.value,
});
const presetFiles = ref<File[]>([]);
function handleSyncTask(fileId: number) {
  const meta = manager.getTaskMeta?.(fileId);
  if (!meta?.file) {
    ElMessage.warning("无法获取原始文件，无法同�?);
    return;
  }
  // 预填文件到对话框，用户选择目标服务�?节点后执�?
  presetFiles.value = [meta.file];
  showUploadDialog.value = true;
}

// 上传对话框入队方法：供子组件调用
const enqueue = (
  tasks: Array<{
    id: number;
    name: string;
    run: (
      signal: AbortSignal,
      onProgress: (p: number) => void
    ) => Promise<void>;
  }>
) => {
  manager.enqueue(tasks as any);
};

// 打开分发对话框（来自文件列表 @sync 事件�?
function openDistribute(file: FileInfo) {
  selectedFile.value = file;
  showDistributeDialog.value = true;
}

// 分发完成回调（关闭对话框并刷新列表）
function handleDistributeSuccess() {
  ElMessage.success("同步任务已完�?);
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

// 响应式数�?
const currentPath = ref("/");
const selectedFile = ref<FileInfo | null>(null);
const previewVisible = ref(false);
const detailVisible = ref(false);
const showDistributeDialog = ref(false);

// 拖拽调整高度相关
const detailPanelHeight = ref(300); // 默认高度
const isResizing = ref(false);
const minHeight = 150; // 最小高�?
const maxHeightRatio = 0.7; // 最大高度占窗口的比�?

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
    NODE: "NODE客户�?,
    API: "API连接",
    NONE: "未启�?,
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

  // 先更新路�?
  currentPath.value = path;

  // 等待树的选中状态更新完�?
  await fileTreeRef.value?.setCurrentPath(path);

  // 主动加载右侧文件列表
  fileListRef.value?.loadFileList();

  console.log("FileManagerPage: Directory clicked, path updated to:", path);
};

/**
 * 处理树文件点�?
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

  // 同步左侧文件树：展开到新路径并高�?
  try {
    await fileTreeRef.value?.expandToPath(path);
    console.log("FileManagerPage: Tree expanded to path", path);
  } catch (error) {
    console.error(
      "FileManagerPage: Failed to expand tree to path",
      path,
      error
    );
    // 如果展开失败，至少设置当前选中状�?
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
    // 目录：显示详�?
    detailVisible.value = true;
  } else {
    // 文件：根据类型决定是否可以预�?
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
    "conf",
  ];
  return previewableExts.includes(ext || "");
};

/**
 * 处理树刷�?
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
    ElMessage.warning("请先选择服务�?);
    return;
  }
  if (!targetDir) targetDir = currentPath.value || "/";
  if (!targetDir.startsWith("/")) targetDir = "/" + targetDir;

  // 是否覆盖确认
  const { value: overwrite } = await ElMessageBox.confirm(
    `目标目录: ${targetDir}\n�?${files.length} 个文件。是否覆盖已存在的同名文件？`,
    "上传确认",
    {
      confirmButtonText: "覆盖",
      cancelButtonText: "不覆�?,
      distinguishCancelAndClose: true,
      type: "warning",
    }
  )
    .then(() => ({ value: true }))
    .catch((action) => ({ value: action === "confirm" }));

  // 构建上传任务并入�?
  const tasks = files.map((file) => {
    const id = -Date.now() - Math.floor(Math.random() * 100000);
    const name = `${file.name} @ S:${props.serverId}`;
    return {
      id,
      name,
      meta: {
        file,
        target: { type: "SERVER", id: props.serverId },
        dirPath: targetDir,
      },
      run: (signal: AbortSignal, onProgress: (p: number) => void) =>
        uploadServerFileWithProgress(
          { serverId: props.serverId, targetPath: targetDir, file, overwrite },
          (e) => {
            const percent = e.total
              ? Math.round((e.loaded / e.total) * 100)
              : 0;
            onProgress(percent);
          },
          signal
        ).then(() => void 0),
    };
  });

  manager.enqueue(tasks as any);
  showUploadDialog.value = true; // 打开上传对话框查看进�?
}

/**
 * 刷新当前视图
 */
const refreshAll = () => {
  console.log("FileManagerPage: Refreshing current view");
  // 只刷新右侧文件列表，保持左侧树的展开状�?
  fileListRef.value?.refreshList();
  // 如果需要刷新树的当前节点，可以调用特定的刷新方�?
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
  // 删除成功后关闭详情面�?
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

    const currentY =
      "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
    const deltaY = startY - currentY; // 向上拖拽为正�?
    const newHeight = startHeight + deltaY;

    // 计算最大高�?
    const maxHeight = window.innerHeight * maxHeightRatio;

    // 限制高度范围
    detailPanelHeight.value = Math.max(
      minHeight,
      Math.min(newHeight, maxHeight)
    );
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

  // 添加事件监听�?
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("touchmove", handleMouseMove);
  document.addEventListener("touchend", handleMouseUp);

  // 防止文本选择和设置光标样�?
  document.body.style.userSelect = "none";
  document.body.style.cursor = "row-resize";
};

/**
 * 处理键盘快捷�?
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

  // ESC 关闭对话�?
  if (event.key === "Escape") {
    if (previewVisible.value) {
      previewVisible.value = false;
    } else if (detailVisible.value) {
      detailVisible.value = false;
    }
  }
};

// 监听serverId变化，重置文件列表状�?
watch(
  () => props.serverId,
  (newServerId, oldServerId) => {
    if (newServerId !== oldServerId && fileListRef.value) {
      console.log(
        "FileManagerPage: ServerId changed, resetting file list state"
      );
      fileListRef.value.resetState();
      currentPath.value = "/"; // 重置路径到根目录
    }
  }
);

// 监听serverId变化，刷新文件树
watch(
  () => props.serverId,
  (newServerId) => {
    console.log("FileManagerPage: serverId changed to", newServerId);
    if (newServerId && fileTreeRef.value) {
      // 主动刷新文件�?
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
  // 防止浏览器默认的拖拽打开行为（全局�?
  document.addEventListener("dragover", prevent);
  document.addEventListener("drop", prevent);
  // 存到 window 以便卸载时移�?
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
  },
});
</script>

<style scoped>
.file-manager-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.98) 0%,
    rgba(241, 245, 249, 0.95) 100%
  );
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.manager-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin: 12px;
  gap: 12px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.left-panel {
  width: 300px;
  min-width: 240px;
  max-width: 400px;
  height: 100%;
  flex-shrink: 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  display: flex;
  flex-direction: column;
  border-radius: 16px 0 0 16px;
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
  overflow: hidden;

  /* 装饰性顶部渐变条 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    border-radius: 16px 0 0 0;
  }
}

/* 目录结构头部样式 */
.tree-header {
  height: 56px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.03) 100%
  );
  flex-shrink: 0;
  margin-top: 4px;
}

.tree-header-left {
  display: flex;
  align-items: center;

  .iconify {
    font-size: 20px;
    color: #667eea;
    padding: 6px;
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.1) 0%,
      rgba(118, 75, 162, 0.08) 100%
    );
    border-radius: 8px;
  }
}

.tree-title {
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tree-header-right {
  display: flex;
  gap: 8px;

  .el-button {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

/* 文件树内容区�?*/
.tree-content {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

/* 统一滚动条样�?*/
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
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(102, 126, 234, 0.2) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: all 0.3s ease;
}

.splitter:hover {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  width: 3px;
}

.splitter::before {
  content: "";
  position: absolute;
  left: -4px;
  top: 0;
  width: 10px;
  height: 100%;
  background: transparent;
}

.right-panel {
  flex: 1;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  display: flex;
  flex-direction: column;
  border-radius: 0 16px 16px 0;
  backdrop-filter: blur(10px);
  position: relative;

  /* 装饰性顶部渐变条 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #764ba2 0%, #f093fb 50%, #f5576c 100%);
    border-radius: 0 16px 0 0;
    z-index: 1;
  }
}

/* 工具栏美�?*/
.list-toolbar {
  padding: 12px 16px !important;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.03) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  margin-top: 4px;

  .el-button {
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.3s ease;

    &.el-button--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        background: linear-gradient(135deg, #7c8ff0 0%, #8b5fb8 100%);
      }
    }
  }
}

/* 文件列表容器 */
.file-list-container {
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
  padding: 8px;
}

/* 文件详情面板 */
.file-detail-panel {
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  transition: height 0.3s ease;
  position: relative;
  border-radius: 12px 12px 0 0;
  margin: 0 8px;
}

/* 拖拽手柄 */
.resize-handle {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 8px;
  cursor: row-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px 12px 0 0;
  transition: all 0.2s ease;
}

.resize-handle:hover {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.08) 100%
  );
}

.resize-indicator {
  width: 50px;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: all 0.2s ease;
  opacity: 0.5;
}

.resize-handle:hover .resize-indicator {
  opacity: 1;
  width: 60px;
}

/* 详情面板头部 */
.detail-header {
  height: 44px;
  padding: 0 20px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.03) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  flex-shrink: 0;
  border-radius: 12px 12px 0 0;
}

.detail-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  .iconify {
    margin-right: 8px;
    font-size: 18px;
    color: #667eea;
  }
}

.close-detail-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}

/* 详情面板内容 */
.detail-content {
  height: calc(100% - 48px);
  overflow: hidden;
  padding: 12px;
}

/* 响应式设�?*/
@media (max-width: 768px) {
  .manager-content {
    flex-direction: column;
    margin: 8px;
    gap: 8px;
    border-radius: 12px;
  }

  .left-panel {
    width: 100%;
    height: 280px;
    max-width: none;
    border-radius: 12px 12px 0 0;

    &::before {
      border-radius: 12px 12px 0 0;
    }
  }

  .tree-header {
    height: 48px;
    padding: 0 16px;
  }

  .tree-title {
    font-size: 14px;
  }

  .splitter {
    width: 100%;
    height: 2px;
    cursor: row-resize;
    background: linear-gradient(
      90deg,
      rgba(102, 126, 234, 0.2) 0%,
      rgba(118, 75, 162, 0.1) 100%
    );
  }

  .splitter::before {
    left: 0;
    top: -4px;
    width: 100%;
    height: 10px;
  }

  .right-panel {
    flex: 1;
    width: 100%;
    border-radius: 0 0 12px 12px;

    &::before {
      display: none;
    }
  }

  .file-detail-panel {
    height: 250px !important;
    margin: 0 4px;
    border-radius: 8px 8px 0 0;
  }

  .resize-handle {
    display: none;
  }

  .detail-header {
    margin-top: 0;
    border-radius: 8px 8px 0 0;
  }
}
</style>
