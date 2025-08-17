<template>
  <div class="file-list">
    <!-- 头部工具栏 -->
    <div class="list-header">
      <!-- 路径导航 -->
      <div class="path-navigation">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="(item, index) in pathItems"
            :key="index"
            :class="{ clickable: index < pathItems.length - 1 }"
            @click="navigateToPath(item.path)"
          >
            {{ item.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 返回上一层按钮 -->
        <el-button
          size="small"
          @click="goBack"
          :disabled="!canGoBack"
          title="返回上一层"
        >
          <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
          返回上一层
        </el-button>

        <!-- 操作按钮 -->
        <el-button size="small" @click="refreshList">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>

        <el-button size="small" @click="createFolder">
          <IconifyIconOnline icon="ri:folder-add-line" class="mr-1" />
          新建文件夹
        </el-button>
      </div>
    </div>

    <!-- 文件列表内容 -->
    <div class="list-content" v-loading="loading">
      <!-- 空状态提示 -->
      <div v-if="!hasLoadedOnce && fileList.length === 0" class="empty-state">
        <IconifyIconOnline icon="ri:folder-open-line" class="empty-icon" />
        <p>请点击左侧文件树节点查看文件列表</p>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table
          :data="fileList"
          @row-dblclick="handleRowDoubleClick"
          @row-contextmenu="handleRowRightClick"
          stripe
          height="100%"
        >
          <el-table-column label="名称" min-width="300">
            <template #default="{ row }">
              <div class="file-item" @click="handleFileClick(row)">
                <IconifyIconOnline
                  :icon="getFileIcon(row)"
                  :class="['file-icon', { 'folder-icon': row.isDirectory }]"
                />
                <span class="file-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="大小" width="120" align="right">
            <template #default="{ row }">
              {{ row.isDirectory ? "-" : formatFileSize(row.size) }}
            </template>
          </el-table-column>

          <el-table-column label="修改时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.modifiedTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-dropdown
                @command="(command) => handleFileAction(command, row)"
              >
                <el-button size="small" text>
                  操作
                  <IconifyIconOnline icon="ri:arrow-down-s-line" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      command="download"
                      v-if="!row.isDirectory"
                    >
                      <IconifyIconOnline icon="ri:download-line" class="mr-1" />
                      下载
                    </el-dropdown-item>
                    <el-dropdown-item command="sync" v-if="!row.isDirectory">
                      <IconifyIconOnline
                        icon="ri:share-forward-line"
                        class="mr-1"
                      />
                      同步
                    </el-dropdown-item>
                    <el-dropdown-item command="rename">
                      <IconifyIconOnline icon="ri:edit-line" class="mr-1" />
                      重命名
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline
                        icon="ri:delete-bin-line"
                        class="mr-1"
                      />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 空状态 -->
      <div v-if="fileList.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:folder-open-line" class="empty-icon" />
        <p>此文件夹为空</p>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
      }"
      @click.stop
    >
      <div class="menu-item" @click="copyFilePath">
        <IconifyIconOnline icon="ri:file-copy-line" class="menu-icon" />
        <span>复制文件路径</span>
      </div>
      <div
        v-if="
          selectedContextFile &&
          !selectedContextFile.isDirectory &&
          isFilePreviewable(selectedContextFile)
        "
        class="menu-item"
        @click="previewFileAction"
      >
        <IconifyIconOnline icon="ri:eye-line" class="menu-icon" />
        <span>预览</span>
      </div>
      <div
        v-if="selectedContextFile && !selectedContextFile.isDirectory"
        class="menu-item"
        @click="downloadFileAction"
      >
        <IconifyIconOnline icon="ri:download-line" class="menu-icon" />
        <span>下载</span>
      </div>
      <div class="menu-item" @click="showFileProperties">
        <IconifyIconOnline icon="ri:file-info-line" class="menu-icon" />
        <span>属性</span>
      </div>
    </div>

    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="createFolderVisible"
      title="新建文件夹"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="createFolderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input
            v-model="createFolderForm.name"
            placeholder="请输入文件夹名称"
            @keyup.enter="confirmCreateFolder"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createFolderVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件预览对话框 -->
    <el-dialog
      draggable
      v-model="previewDialogVisible"
      :title="`文件预览 - ${previewFileInfo?.name || ''}`"
      width="90%"
      top="5vh"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      class="file-preview-dialog"
    >
      <div class="preview-container" v-if="previewFileInfo">
        <iframe
          :src="getPreviewUrl(previewFileInfo)"
          class="preview-iframe min-h-[768px]"
          frameborder="0"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { formatBytes } from "@pureadmin/utils";
import dayjs from "dayjs";
import type { FileInfo } from "@/api/file-management";
import {
  getFileList,
  createDirectory,
  deleteFile,
  renameFile,
  downloadFile,
} from "@/api/file-management";
import { getConfig } from "@repo/config";

// Props
const props = defineProps<{
  serverId: number;
  currentPath: string;
}>();

// Emits
const emit = defineEmits<{
  "path-change": [path: string];
  "file-select": [file: FileInfo];
  refresh: [];
  sync: [file: FileInfo];
}>();

// 响应式数据
const loading = ref(false);
const fileList = ref<FileInfo[]>([]);
const hasLoadedOnce = ref(false); // 标记是否已经加载过一次
const createFolderVisible = ref(false);
const createFolderForm = reactive({
  name: "",
});

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuPosition = reactive({ x: 0, y: 0 });
const selectedContextFile = ref<FileInfo | null>(null);

// 文件预览相关
const previewDialogVisible = ref(false);
const previewFileInfo = ref<FileInfo | null>(null);

// 路径导航
const pathItems = computed(() => {
  const parts = props.currentPath.split("/").filter(Boolean);
  const items = [{ name: "根目录", path: "/" }];

  let currentPath = "";
  parts.forEach((part) => {
    currentPath += `/${part}`;
    items.push({ name: part, path: currentPath });
  });

  return items;
});

// 返回上一层相关
const canGoBack = computed(() => {
  return props.currentPath !== "/" && props.currentPath !== "";
});

/**
 * 返回上一层
 */
const goBack = () => {
  if (!canGoBack.value) return;

  const parts = props.currentPath.split("/").filter(Boolean);
  if (parts.length === 0) return;

  // 移除最后一个路径部分
  parts.pop();

  // 构建父级路径
  const parentPath = parts.length === 0 ? "/" : "/" + parts.join("/");

  console.log("FileList: Going back from", props.currentPath, "to", parentPath);
  emit("path-change", parentPath);
};

/**
 * 加载文件列表
 */
const loadFileList = async () => {
  if (!props.serverId) {
    console.log("FileList: No serverId provided");
    return;
  }

  try {
    loading.value = true;
    console.log(
      "FileList: Loading file list for",
      props.serverId,
      props.currentPath
    );

    const res = await getFileList(props.serverId, props.currentPath);
    console.log("FileList: API response", res);

    if (res.code === "00000" && res.data?.success) {
      fileList.value = res.data.files || [];
      hasLoadedOnce.value = true; // 标记已经加载过一次
      console.log("FileList: File list loaded", fileList.value);
    } else {
      console.error("FileList: API error", res);
      ElMessage.error(res.data?.message || "加载文件列表失败");
      fileList.value = [];
    }
  } catch (error) {
    console.error("FileList: 加载文件列表失败:", error);
    ElMessage.error("加载文件列表失败");
    fileList.value = [];
  } finally {
    loading.value = false;
  }
};

// 移除自动加载逻辑，改为手动触发
// 不再监听路径变化自动加载，只在用户主动点击树节点时加载

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  return formatBytes(size);
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * 获取文件图标
 */
const getFileIcon = (file: FileInfo) => {
  if (file.isDirectory) {
    return "ri:folder-line";
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    // JavaScript/TypeScript
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return "ri:javascript-line";
    case "vue":
      return "ri:vuejs-line";

    // Web技术
    case "html":
    case "htm":
      return "ri:html5-line";
    case "css":
    case "scss":
    case "sass":
    case "less":
      return "ri:css3-line";

    // Java相关
    case "java":
      return "ri:file-code-line";
    case "jar":
    case "war":
    case "ear":
      return "ri:archive-line";
    case "class":
      return "ri:file-code-line";

    // C/C++
    case "c":
    case "cpp":
    case "cc":
    case "cxx":
    case "h":
    case "hpp":
      return "ri:file-code-line";

    // Python
    case "py":
    case "pyc":
    case "pyo":
    case "pyw":
      return "ri:file-code-line";

    // 其他编程语言
    case "php":
    case "go":
    case "rs":
    case "rb":
    case "pl":
    case "sh":
    case "bat":
    case "cmd":
    case "ps1":
      return "ri:file-code-line";

    // 配置文件
    case "json":
    case "xml":
    case "yaml":
    case "yml":
    case "toml":
    case "ini":
    case "conf":
    case "config":
    case "properties":
      return "ri:settings-3-line";

    // 文档
    case "md":
    case "markdown":
      return "ri:markdown-line";
    case "txt":
    case "log":
      return "ri:file-text-line";
    case "pdf":
      return "ri:file-pdf-line";
    case "doc":
    case "docx":
      return "ri:file-word-line";
    case "xls":
    case "xlsx":
      return "ri:file-excel-line";
    case "ppt":
    case "pptx":
      return "ri:file-ppt-line";

    // 压缩文件
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
    case "bz2":
    case "xz":
      return "ri:file-zip-line";

    // 图片
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "bmp":
    case "webp":
    case "ico":
      return "ri:image-line";

    // 音频
    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "ogg":
    case "wma":
      return "ri:music-line";

    // 视频
    case "mp4":
    case "avi":
    case "mkv":
    case "mov":
    case "wmv":
    case "flv":
    case "webm":
      return "ri:video-line";

    // 可执行文件
    case "exe":
    case "msi":
    case "dmg":
    case "deb":
    case "rpm":
    case "app":
      return "ri:install-line";

    // 库文件
    case "dll":
    case "so":
    case "dylib":
    case "lib":
    case "a":
      return "ri:code-box-line";

    // 数据库
    case "db":
    case "sqlite":
    case "sql":
      return "ri:database-line";

    // 字体
    case "ttf":
    case "otf":
    case "woff":
    case "woff2":
    case "eot":
      return "ri:font-size-line";

    default:
      return "ri:file-line";
  }
};

/**
 * 处理文件点击
 */
const handleFileClick = (file: FileInfo) => {
  console.log("FileList: File clicked", file);
  emit("file-select", file);
};

/**
 * 处理文件双击
 */
const handleRowDoubleClick = (file: FileInfo) => {
  console.log("FileList: File double clicked", file);
  if (file.isDirectory) {
    // 双击文件夹：进入文件夹
    emit("path-change", file.path);
  } else {
    // 双击文件：预览文件
    if (isFilePreviewable(file)) {
      previewFileInfo.value = file;
      previewDialogVisible.value = true;
    } else {
      ElMessage.warning("该文件类型不支持预览");
    }
  }
};

/**
 * 处理右键点击
 */
const handleRowRightClick = (
  file: FileInfo,
  _column: any,
  event: MouseEvent
) => {
  event.preventDefault();
  selectedContextFile.value = file;

  // 计算菜单位置
  contextMenuPosition.x = event.clientX;
  contextMenuPosition.y = event.clientY;

  // 显示菜单
  contextMenuVisible.value = true;

  // 添加全局点击事件监听器来隐藏菜单
  const hideMenu = () => {
    contextMenuVisible.value = false;
    document.removeEventListener("click", hideMenu);
  };

  // 延迟添加监听器，避免立即触发
  setTimeout(() => {
    document.addEventListener("click", hideMenu);
  }, 0);
};

/**
 * 复制文件路径
 */
const copyFilePath = async () => {
  if (!selectedContextFile.value) return;

  try {
    await navigator.clipboard.writeText(selectedContextFile.value.path);
    ElMessage.success("文件路径已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    ElMessage.error("复制失败，请手动复制");
  }

  contextMenuVisible.value = false;
};

/**
 * 下载文件
 */
const downloadFileAction = async () => {
  if (!selectedContextFile.value || selectedContextFile.value.isDirectory)
    return;

  try {
    const response = await downloadFile(
      props.serverId,
      selectedContextFile.value.path
    );

    if (response.code === "00000" && response.data?.success) {
      // 处理下载
      const downloadUrl = response.data.data?.downloadUrl;
      if (downloadUrl) {
        // 创建下载链接
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = selectedContextFile.value.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        ElMessage.success("文件下载成功");
      } else {
        ElMessage.error("下载链接获取失败");
      }
    } else {
      ElMessage.error(response.data?.message || "下载失败");
    }
  } catch (error) {
    console.error("下载文件失败:", error);
    ElMessage.error("下载文件失败");
  }

  contextMenuVisible.value = false;
};

/**
 * 预览文件
 */
const previewFileAction = () => {
  if (!selectedContextFile.value || selectedContextFile.value.isDirectory)
    return;

  // 检查文件是否可预览
  if (!isFilePreviewable(selectedContextFile.value)) {
    ElMessage.warning("该文件类型不支持预览");
    contextMenuVisible.value = false;
    return;
  }

  // 设置预览文件信息并显示预览对话框
  previewFileInfo.value = selectedContextFile.value;
  previewDialogVisible.value = true;
  contextMenuVisible.value = false;
};

/**
 * 显示文件属性
 */
const showFileProperties = () => {
  if (!selectedContextFile.value) return;

  emit("file-select", selectedContextFile.value);
  contextMenuVisible.value = false;
};

/**
 * 判断文件是否可预览
 */
const isFilePreviewable = (file: FileInfo) => {
  if (file.isDirectory) return false;

  const fileName = file.name.toLowerCase();
  const ext = fileName.split(".").pop();

  if (!ext) return false;

  // 支持预览的文件格式
  const previewableExtensions = [
    // 图片格式
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "svg",
    "webp",
    "ico",
    // 文本格式
    "txt",
    "md",
    "json",
    "xml",
    "html",
    "htm",
    "css",
    "js",
    "ts",
    "vue",
    "py",
    "java",
    "cpp",
    "c",
    "h",
    "hpp",
    "cs",
    "php",
    "rb",
    "go",
    "rs",
    "yaml",
    "yml",
    "toml",
    "ini",
    "conf",
    "config",
    "log",
    // 文档格式
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
    // 代码文件
    "jsx",
    "tsx",
    "scss",
    "sass",
    "less",
    "stylus",
    "sql",
    "sh",
    "bat",
    "ps1",
  ];

  return previewableExtensions.includes(ext);
};

/**
 * 导航到指定路径
 */
const navigateToPath = (path: string) => {
  console.log("FileList: Navigate to path", path);
  emit("path-change", path);
};

/**
 * 刷新列表
 */
const refreshList = () => {
  console.log("FileList: Refreshing list");
  loadFileList();
  emit("refresh");
};

/**
 * 重置组件状态
 */
const resetState = () => {
  console.log("FileList: Resetting state");
  fileList.value = [];
  hasLoadedOnce.value = false;
};

/**
 * 创建文件夹
 */
const createFolder = () => {
  createFolderForm.name = "";
  createFolderVisible.value = true;
};

/**
 * 确认创建文件夹
 */
const confirmCreateFolder = async () => {
  if (!createFolderForm.name.trim()) {
    ElMessage.warning("请输入文件夹名称");
    return;
  }

  try {
    const folderPath = `${props.currentPath}/${createFolderForm.name}`;
    const res = await createDirectory(props.serverId, folderPath, false);

    if (res.code === "00000" && res.data?.success) {
      ElMessage.success("文件夹创建成功");
      createFolderVisible.value = false;
      loadFileList();
    } else {
      ElMessage.error(res.data?.message || "创建文件夹失败");
    }
  } catch (error) {
    console.error("FileList: 创建文件夹失败:", error);
    ElMessage.error("创建文件夹失败");
  }
};

/**
 * 处理文件操作
 */
const handleFileAction = async (command: string, file: FileInfo) => {
  console.log("FileList: File action", command, file);
  switch (command) {
    case "download":
      ElMessage.info("下载功能开发中");
      break;
    case "sync":
      emit("sync", file);
      break;
    case "rename":
      await renameFileAction(file);
      break;
    case "delete":
      await deleteFileAction(file);
      break;
  }
};

/**
 * 重命名文件
 */
const renameFileAction = async (file: FileInfo) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      "请输入新的文件名",
      "重命名",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: file.name,
      }
    );

    if (newName && newName !== file.name) {
      const res = await renameFile(props.serverId, file.path, newName);

      if (res.code === "00000" && res.data?.success) {
        ElMessage.success("重命名成功");
        loadFileList();
      } else {
        ElMessage.error(res.data?.message || "重命名失败");
      }
    }
  } catch (error) {
    // 用户取消
  }
};

/**
 * 删除文件
 */
const deleteFileAction = async (file: FileInfo) => {
  try {
    await ElMessageBox.confirm(`确定要删除 "${file.name}" 吗？`, "删除确认", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    const res = await deleteFile(props.serverId, file.path, file.isDirectory);

    if (res.code === "00000" && res.data?.success) {
      ElMessage.success("删除成功");
      loadFileList();
    } else {
      ElMessage.error(res.data?.message || "删除失败");
    }
  } catch (error) {
    // 用户取消
  }
};

/**
 * 获取预览URL
 */
const getPreviewUrl = (file: FileInfo) => {
  if (!file || !props.serverId) return "";

  // 构建预览API URL
  const baseUrl = getConfig().BaseUrl;
  const previewUrl = `${baseUrl}/v1/file-management/preview`;
  const params = new URLSearchParams({
    filePath: file.path,
    serverId: props.serverId.toString(),
    previewType: "auto",
    maxSizeMB: "10",
  });

  return `${previewUrl}?${params.toString()}`;
};

/**
 * iframe加载完成
 */
const onIframeLoad = () => {
  console.log("FileList: Preview iframe loaded");
};

/**
 * iframe加载错误
 */
const onIframeError = () => {
  console.error("FileList: Preview iframe load error");
  ElMessage.error("文件预览加载失败");
};

/**
 * 下载预览文件
 */
const downloadPreviewFile = async () => {
  if (!previewFileInfo.value) return;

  try {
    const response = await downloadFile(
      props.serverId,
      previewFileInfo.value.path
    );

    if (response.code === "00000" && response.data?.success) {
      // 处理下载
      const downloadUrl = response.data.data?.downloadUrl;
      if (downloadUrl) {
        // 创建下载链接
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = previewFileInfo.value.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        ElMessage.success("文件下载开始");
      } else {
        ElMessage.error("获取下载链接失败");
      }
    } else {
      ElMessage.error(response.data?.message || "下载失败");
    }
  } catch (error) {
    console.error("下载文件失败:", error);
    ElMessage.error("下载文件失败");
  }
};

// 暴露方法
defineExpose({
  refreshList,
  loadFileList,
  resetState,
});
</script>

<style scoped>
.file-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff; /* 设置文件列表背景为白色 */
}

.list-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: #ffffff; /* 设置列表头部背景为白色 */
}

.path-navigation {
  margin-bottom: 12px;
}

.path-navigation .clickable {
  cursor: pointer;
  color: var(--el-color-primary);
}

.path-navigation .clickable:hover {
  text-decoration: underline;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-content {
  flex: 1;
  overflow: hidden;
}

.list-view {
  height: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.file-icon {
  margin-right: 8px;
  font-size: 18px;
  color: var(--el-color-primary);
}

.folder-icon {
  color: var(--el-color-warning);
}

.file-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--el-text-color-placeholder);
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  box-shadow: var(--el-box-shadow-light);
  padding: 4px 0;
  min-width: 140px;
  backdrop-filter: blur(10px);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-primary);
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: var(--el-fill-color-light);
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.menu-item:hover .menu-icon {
  color: var(--el-color-primary);
}

/* 文件预览对话框样式 */
.file-preview-dialog {
  --dialog-border-radius: 8px;
}

.file-preview-dialog :deep(.el-dialog) {
  border-radius: var(--dialog-border-radius);
  overflow: hidden;
}

.file-preview-dialog :deep(.el-dialog__header) {
  background: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 16px 20px;
}

.file-preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 75vh;
  overflow: hidden;
}

.file-preview-dialog :deep(.el-dialog__footer) {
  background: var(--el-fill-color-extra-light);
  border-top: 1px solid var(--el-border-color-light);
  padding: 12px 20px;
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: var(--el-bg-color);
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-preview-dialog :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  .file-preview-dialog :deep(.el-dialog__body) {
    height: 70vh;
  }
}

/* 暗色主题适配 - 强制保持白色背景 */
@media (prefers-color-scheme: dark) {
  .file-list {
    background: #ffffff !important; /* 强制保持白色背景 */
  }

  .list-header {
    background: #ffffff !important; /* 强制保持白色背景 */
  }

  .preview-iframe {
    background: #ffffff !important; /* 强制保持白色背景 */
  }
}
</style>
