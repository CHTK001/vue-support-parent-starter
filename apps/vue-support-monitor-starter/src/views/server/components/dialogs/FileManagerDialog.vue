<template>
  <el-dialog
    v-model="visible"
    :title="`文件管理 - ${serverInfo?.monitorSysGenServerName || '未知服务器'}`"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    class="file-manager-dialog"
    top="5vh"
  >
    <div class="file-manager-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(path, index) in breadcrumbPaths"
              :key="index"
              :class="{ 'is-link': index < breadcrumbPaths.length - 1 }"
              @click="handleBreadcrumbClick(index)"
            >
              {{ path.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="toolbar-right">
          <el-button size="small" @click="handleRefresh">
            <IconifyIconOnline icon="ep:refresh" class="mr-1" />
            刷新
          </el-button>
          
          <el-button size="small" @click="handleCreateFolder" v-if="permissions.canCreateFolder">
            <IconifyIconOnline icon="ri:folder-add-line" class="mr-1" />
            新建文件夹
          </el-button>

          <el-upload
            v-if="permissions.canUpload"
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :data="uploadData"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :show-file-list="false"
            multiple
          >
            <el-button size="small">
              <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
              上传文件
            </el-button>
          </el-upload>

          <el-button
            size="small"
            @click="handleDownloadSelected"
            :disabled="selectedFiles.length === 0 || !permissions.canDownload"
            v-if="permissions.canDownload"
          >
            <IconifyIconOnline icon="ri:download-line" class="mr-1" />
            下载
          </el-button>

          <el-button
            size="small"
            type="danger"
            @click="handleDeleteSelected"
            :disabled="selectedFiles.length === 0 || !permissions.canDelete"
            v-if="permissions.canDelete"
          >
            <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
            删除
          </el-button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list-container">
        <el-table
          v-loading="loading"
          :data="fileList"
          stripe
          @selection-change="handleSelectionChange"
          @row-dblclick="handleRowDoubleClick"
        >
          <el-table-column type="selection" width="55" />
          
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
              <span v-if="!row.isDirectory">{{ formatFileSize(row.size) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="修改时间" width="180" align="center">
            <template #default="{ row }">
              {{ formatDateTime(row.modifiedTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="权限" width="100" align="center">
            <template #default="{ row }">
              <span class="permissions">{{ row.permissions || '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  v-if="!row.isDirectory && permissions.canDownload"
                  size="small"
                  @click="handleDownloadFile(row)"
                >
                  <IconifyIconOnline icon="ri:download-line" />
                </el-button>

                <el-button
                  v-if="permissions.canRename"
                  size="small"
                  @click="handleRenameFile(row)"
                >
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>

                <el-dropdown @command="(cmd) => handleFileAction(cmd, row)">
                  <el-button size="small">
                    <IconifyIconOnline icon="ri:more-line" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-if="!row.isDirectory && permissions.canRead"
                        command="view"
                      >
                        查看
                      </el-dropdown-item>
                      <el-dropdown-item
                        v-if="!row.isDirectory && permissions.canWrite"
                        command="edit"
                      >
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">复制</el-dropdown-item>
                      <el-dropdown-item command="move">移动</el-dropdown-item>
                      <el-dropdown-item command="properties">属性</el-dropdown-item>
                      <el-dropdown-item
                        v-if="permissions.canDelete"
                        command="delete"
                        divided
                      >
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 文件查看/编辑对话框 -->
    <el-dialog
      v-model="fileViewVisible"
      :title="currentFile?.name"
      width="80%"
      append-to-body
      destroy-on-close
    >
      <div v-if="currentFile" class="file-content">
        <div v-if="isImageFile(currentFile)" class="image-viewer">
          <img :src="getFileUrl(currentFile)" alt="图片预览" style="max-width: 100%; max-height: 500px;" />
        </div>
        
        <div v-else-if="isTextFile(currentFile)" class="text-editor">
          <el-input
            v-model="fileContent"
            type="textarea"
            :rows="20"
            :readonly="!editMode"
            placeholder="文件内容"
          />
        </div>
        
        <div v-else class="unsupported-file">
          <el-empty description="不支持预览此类型文件">
            <el-button type="primary" @click="handleDownloadFile(currentFile)">
              下载文件
            </el-button>
          </el-empty>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="fileViewVisible = false">关闭</el-button>
        <el-button v-if="isTextFile(currentFile)" @click="editMode = !editMode">
          {{ editMode ? '取消编辑' : '编辑' }}
        </el-button>
        <el-button v-if="editMode" type="primary" @click="handleSaveFile">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="createFolderVisible"
      title="新建文件夹"
      width="400px"
      append-to-body
    >
      <el-form :model="createFolderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input
            v-model="createFolderForm.name"
            placeholder="请输入文件夹名称"
            @keyup.enter="handleConfirmCreateFolder"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createFolderVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCreateFolder">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import type { ServerInfo } from "@/api/server";
import {
  getServerFiles,
  uploadServerFile,
  downloadServerFile,
  deleteServerFile,
  createServerDirectory,
  readServerFileContent,
  saveServerFileContent,
  renameServerFile
} from "@/api/server";

// Props
const props = defineProps<{
  serverId?: number;
  serverInfo?: ServerInfo;
}>();

// 文件项接口
interface FileItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedTime: string;
  permissions?: string;
}

// 路径项接口
interface PathItem {
  name: string;
  path: string;
}

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const serverInfo = ref<ServerInfo | null>(null);
const currentPath = ref("/");
const fileList = ref<FileItem[]>([]);
const selectedFiles = ref<FileItem[]>([]);

// 权限控制
const permissions = reactive({
  canRead: true,      // 可以查看文件
  canWrite: true,     // 可以编辑文件
  canUpload: true,    // 可以上传文件
  canDownload: true,  // 可以下载文件
  canDelete: true,    // 可以删除文件
  canCreateFolder: true, // 可以创建文件夹
  canRename: true,    // 可以重命名文件
});

// 文件查看/编辑
const fileViewVisible = ref(false);
const currentFile = ref<FileItem | null>(null);
const fileContent = ref("");
const editMode = ref(false);

// 新建文件夹
const createFolderVisible = ref(false);
const createFolderForm = reactive({
  name: "",
});

// 上传相关
const uploadRef = ref();
const uploadUrl = computed(() => `/api/v1/gen/server/upload`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
}));
const uploadData = computed(() => ({
  id: serverInfo.value?.monitorSysGenServerId,
  path: currentPath.value,
}));

// 面包屑路径
const breadcrumbPaths = computed(() => {
  const paths: PathItem[] = [];
  const parts = currentPath.value.split('/').filter(part => part);
  
  paths.push({ name: '根目录', path: '/' });
  
  let currentPathStr = '';
  for (const part of parts) {
    currentPathStr += '/' + part;
    paths.push({ name: part, path: currentPathStr });
  }
  
  return paths;
});

/**
 * 获取文件图标
 */
const getFileIcon = (file: FileItem) => {
  if (file.isDirectory) {
    return "ri:folder-line";
  }
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    txt: "ri:file-text-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    pdf: "ri:file-pdf-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mp3: "ri:music-line",
    wav: "ri:music-line",
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    js: "ri:javascript-line",
    html: "ri:html5-line",
    css: "ri:css3-line",
    json: "ri:file-code-line",
    xml: "ri:file-code-line",
  };
  
  return iconMap[ext || ''] || "ri:file-line";
};

/**
 * 判断是否为图片文件
 */
const isImageFile = (file: FileItem) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '');
};

/**
 * 判断是否为文本文件
 */
const isTextFile = (file: FileItem) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['txt', 'js', 'html', 'css', 'json', 'xml', 'md', 'log', 'conf', 'ini'].includes(ext || '');
};

/**
 * 获取文件URL
 */
const getFileUrl = (file: FileItem) => {
  return `/api/v1/file-manager/download?serverId=${serverInfo.value?.monitorSysGenServerId}&path=${encodeURIComponent(file.path)}`;
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  if (size === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString();
};

/**
 * 检查用户权限
 */
const checkPermissions = () => {
  // 这里可以根据用户角色、服务器配置等来设置权限
  // 暂时使用默认权限，实际项目中应该从后端获取
  const userRole = localStorage.getItem('userRole') || 'user';

  if (userRole === 'admin') {
    // 管理员拥有所有权限
    Object.assign(permissions, {
      canRead: true,
      canWrite: true,
      canUpload: true,
      canDownload: true,
      canDelete: true,
      canCreateFolder: true,
      canRename: true,
    });
  } else if (userRole === 'operator') {
    // 操作员有部分权限
    Object.assign(permissions, {
      canRead: true,
      canWrite: true,
      canUpload: true,
      canDownload: true,
      canDelete: false,
      canCreateFolder: true,
      canRename: false,
    });
  } else {
    // 普通用户只有查看权限
    Object.assign(permissions, {
      canRead: true,
      canWrite: false,
      canUpload: false,
      canDownload: true,
      canDelete: false,
      canCreateFolder: false,
      canRename: false,
    });
  }
};

/**
 * 打开对话框
 */
const open = () => {
  if (props.serverInfo) {
    serverInfo.value = props.serverInfo;
  }

  // 检查权限
  checkPermissions();

  visible.value = true;
  currentPath.value = "/";
  loadFileList();
};

// 监听props变化
watch(() => props.serverInfo, (newServerInfo) => {
  if (newServerInfo) {
    serverInfo.value = newServerInfo;
  }
}, { immediate: true });

// 暴露方法
defineExpose({
  open
});

/**
 * 加载文件列表
 */
const loadFileList = async () => {
  if (!serverInfo.value?.monitorSysGenServerId) return;

  try {
    loading.value = true;

    const res = await getServerFiles(
      String(serverInfo.value.monitorSysGenServerId),
      currentPath.value
    );

    if (res.code === "00000") {
      // 转换API响应数据为FileItem格式
      fileList.value = (res.data || []).map((item: any) => ({
        name: item.name,
        path: item.path || (currentPath.value === '/' ? `/${item.name}` : `${currentPath.value}/${item.name}`),
        size: item.size || 0,
        isDirectory: item.isDirectory || item.type === 'directory',
        modifiedTime: item.modifiedTime || item.lastModified || new Date().toISOString(),
        permissions: item.permissions || (item.isDirectory ? 'drwxr-xr-x' : '-rw-r--r--'),
      }));
    } else {
      message.error(res.msg || "加载文件列表失败");
      fileList.value = [];
    }
  } catch (error) {
    console.error("加载文件列表失败:", error);
    message.error("加载文件列表失败");
    fileList.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 处理面包屑点击
 */
const handleBreadcrumbClick = (index: number) => {
  if (index < breadcrumbPaths.value.length - 1) {
    currentPath.value = breadcrumbPaths.value[index].path;
    loadFileList();
  }
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadFileList();
};

/**
 * 处理文件点击
 */
const handleFileClick = (file: FileItem) => {
  // 单击选中文件
};

/**
 * 处理行双击
 */
const handleRowDoubleClick = (file: FileItem) => {
  if (file.isDirectory) {
    currentPath.value = file.path;
    loadFileList();
  } else {
    handleViewFile(file);
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: FileItem[]) => {
  selectedFiles.value = selection;
};

/**
 * 处理新建文件夹
 */
const handleCreateFolder = () => {
  createFolderForm.name = "";
  createFolderVisible.value = true;
};

/**
 * 处理确认新建文件夹
 */
const handleConfirmCreateFolder = async () => {
  if (!createFolderForm.name.trim()) {
    message.warning("请输入文件夹名称");
    return;
  }

  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return;
  }

  try {
    const folderPath = currentPath.value === '/'
      ? `/${createFolderForm.name}`
      : `${currentPath.value}/${createFolderForm.name}`;

    const res = await createServerDirectory(
      String(serverInfo.value.monitorSysGenServerId),
      folderPath
    );

    if (res.code === "00000") {
      message.success("文件夹创建成功");
      createFolderVisible.value = false;
      loadFileList();
    } else {
      message.error(res.msg || "创建文件夹失败");
    }
  } catch (error) {
    console.error("创建文件夹失败:", error);
    message.error("创建文件夹失败");
  }
};

/**
 * 处理上传前
 */
const handleBeforeUpload = (file: File) => {
  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return false;
  }

  // 检查文件大小限制（例如100MB）
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    message.error(`文件 ${file.name} 大小超过限制（100MB）`);
    return false;
  }

  message.info(`开始上传文件: ${file.name}`);
  return true;
};

/**
 * 处理上传成功
 */
const handleUploadSuccess = (response: any, file: File) => {
  if (response.code === "00000") {
    message.success(`文件 ${file.name} 上传成功`);
    loadFileList();
  } else {
    message.error(response.msg || `文件 ${file.name} 上传失败`);
  }
};

/**
 * 处理上传错误
 */
const handleUploadError = (error: any, file: File) => {
  console.error("文件上传失败:", error);
  message.error(`文件 ${file.name} 上传失败`);
};

/**
 * 处理下载选中文件
 */
const handleDownloadSelected = () => {
  selectedFiles.value.forEach(file => {
    if (!file.isDirectory) {
      handleDownloadFile(file);
    }
  });
};

/**
 * 处理下载文件
 */
const handleDownloadFile = async (file: FileItem) => {
  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return;
  }

  try {
    message.info(`开始下载文件: ${file.name}`);

    const response = await downloadServerFile(
      String(serverInfo.value.monitorSysGenServerId),
      file.path
    );

    // 创建下载链接
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(`文件 ${file.name} 下载成功`);
  } catch (error) {
    console.error("下载文件失败:", error);
    message.error(`文件 ${file.name} 下载失败`);
  }
};

/**
 * 处理删除选中文件
 */
const handleDeleteSelected = async () => {
  if (selectedFiles.value.length === 0) return;

  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件/文件夹吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 批量删除文件
    const deletePromises = selectedFiles.value.map(file =>
      deleteServerFile(
        String(serverInfo.value!.monitorSysGenServerId),
        file.path
      )
    );

    const results = await Promise.allSettled(deletePromises);
    const successCount = results.filter(result =>
      result.status === 'fulfilled' && result.value.code === "00000"
    ).length;

    if (successCount === selectedFiles.value.length) {
      message.success("删除成功");
    } else if (successCount > 0) {
      message.warning(`部分删除成功，成功删除 ${successCount}/${selectedFiles.value.length} 个文件`);
    } else {
      message.error("删除失败");
    }

    loadFileList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除文件失败:", error);
      message.error("删除文件失败");
    }
  }
};

/**
 * 处理重命名文件
 */
const handleRenameFile = async (file: FileItem) => {
  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return;
  }

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
      // 构建新路径
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');

      const res = await renameServerFile(
        String(serverInfo.value.monitorSysGenServerId),
        file.path,
        newPath
      );

      if (res.code === "00000") {
        message.success("重命名成功");
        loadFileList();
      } else {
        message.error(res.msg || "重命名失败");
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("重命名文件失败:", error);
      message.error("重命名文件失败");
    }
  }
};

/**
 * 处理文件操作
 */
const handleFileAction = async (command: string, file: FileItem) => {
  switch (command) {
    case "view":
      handleViewFile(file);
      break;
    case "edit":
      handleEditFile(file);
      break;
    case "copy":
      // 复制文件逻辑
      message.info("复制功能开发中");
      break;
    case "move":
      // 移动文件逻辑
      message.info("移动功能开发中");
      break;
    case "properties":
      // 查看属性逻辑
      message.info("属性功能开发中");
      break;
    case "delete":
      await handleDeleteFile(file);
      break;
  }
};

/**
 * 处理查看文件
 */
const handleViewFile = async (file: FileItem) => {
  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return;
  }

  currentFile.value = file;
  editMode.value = false;

  if (isTextFile(file)) {
    try {
      fileContent.value = "// 文件内容加载中...";

      const res = await readServerFileContent(
        String(serverInfo.value.monitorSysGenServerId),
        file.path
      );

      if (res.code === "00000") {
        fileContent.value = res.data || "";
      } else {
        message.error(res.msg || "加载文件内容失败");
        return;
      }
    } catch (error) {
      console.error("加载文件内容失败:", error);
      message.error("加载文件内容失败");
      return;
    }
  }

  fileViewVisible.value = true;
};

/**
 * 处理编辑文件
 */
const handleEditFile = (file: FileItem) => {
  handleViewFile(file);
  editMode.value = true;
};

/**
 * 处理保存文件
 */
const handleSaveFile = async () => {
  if (!currentFile.value || !serverInfo.value?.monitorSysGenServerId) {
    message.error("文件信息或服务器信息不完整");
    return;
  }

  try {
    const res = await saveServerFileContent(
      String(serverInfo.value.monitorSysGenServerId),
      currentFile.value.path,
      fileContent.value
    );

    if (res.code === "00000") {
      message.success("文件保存成功");
      editMode.value = false;
    } else {
      message.error(res.msg || "保存文件失败");
    }
  } catch (error) {
    console.error("保存文件失败:", error);
    message.error("保存文件失败");
  }
};

/**
 * 处理删除文件
 */
const handleDeleteFile = async (file: FileItem) => {
  if (!serverInfo.value?.monitorSysGenServerId) {
    message.error("服务器信息不完整");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除 "${file.name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const res = await deleteServerFile(
      String(serverInfo.value.monitorSysGenServerId),
      file.path
    );

    if (res.code === "00000") {
      message.success("删除成功");
      loadFileList();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除文件失败:", error);
      message.error("删除文件失败");
    }
  }
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style scoped lang="scss">
.file-manager-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.file-manager-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;

  .toolbar-left {
    flex: 1;

    :deep(.el-breadcrumb__item) {
      &.is-link {
        cursor: pointer;

        .el-breadcrumb__inner {
          color: #409eff;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.file-list-container {
  flex: 1;
  overflow: hidden;

  .file-item {
    display: flex;
    align-items: center;
    cursor: pointer;

    .file-icon {
      margin-right: 8px;
      font-size: 16px;
      color: #909399;

      &.folder-icon {
        color: #409eff;
      }
    }

    .file-name {
      flex: 1;
    }
  }

  .permissions {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #909399;
  }

  .text-muted {
    color: #c0c4cc;
  }
}

.file-content {
  .image-viewer {
    text-align: center;
    padding: 20px;
  }

  .text-editor {
    :deep(.el-textarea__inner) {
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
  }

  .unsupported-file {
    padding: 40px;
    text-align: center;
  }
}
</style>
