<template>
  <el-dialog
    v-model="visible"
    title="文件管理"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    class="file-manager-dialog"
    top="5vh"
  >
    <div class="file-manager-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <!-- 路径导航 -->
        <div class="path-navigation">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item @click="navigateToPath('/')">
              <IconifyIconOnline icon="ri:home-line" />
              根目录
            </el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(segment, index) in pathSegments"
              :key="index"
              @click="navigateToPath(getPathUpTo(index))"
            >
              {{ segment }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 操作按钮 -->
        <div class="toolbar-actions">
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
      <div class="file-list-container" v-loading="loading">
        <el-table
          :data="fileList"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleRowDoubleClick"
          height="400"
          stripe
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="名称" min-width="200">
            <template #default="{ row }">
              <div class="file-item">
                <IconifyIconOnline 
                  :icon="getFileIcon(row)" 
                  :class="['file-icon', { 'folder-icon': row.isDirectory }]"
                />
                <span class="file-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="大小" width="100">
            <template #default="{ row }">
              {{ row.isDirectory ? '-' : formatFileSize(row.size) }}
            </template>
          </el-table-column>
          
          <el-table-column label="修改时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.lastModified) }}
            </template>
          </el-table-column>
          
          <el-table-column label="权限" width="100">
            <template #default="{ row }">
              {{ row.permissions || '-' }}
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

    <!-- 文件编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑文件 - ${editingFile?.name}`"
      width="80%"
      append-to-body
    >
      <el-input
        v-model="fileContent"
        type="textarea"
        :rows="20"
        placeholder="文件内容"
      />
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFile" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="`预览文件 - ${previewFile?.name}`"
      width="80%"
      append-to-body
    >
      <div class="file-preview">
        <!-- 图片预览 -->
        <div v-if="isImageFile(previewFile)" class="image-preview">
          <img :src="getFilePreviewUrl(previewFile)" alt="图片预览" />
        </div>
        
        <!-- 文本预览 -->
        <div v-else-if="isTextFile(previewFile)" class="text-preview">
          <pre>{{ previewContent }}</pre>
        </div>
        
        <!-- 其他文件类型 -->
        <div v-else class="unsupported-preview">
          <el-empty description="不支持预览此文件类型" />
        </div>
      </div>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <span class="file-count">
          共 {{ fileList.length }} 个项目
          <span v-if="selectedFiles.length > 0">
            ，已选择 {{ selectedFiles.length }} 个
          </span>
        </span>
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { message } from '@repo/utils';
import { ElMessageBox } from 'element-plus';
import type { UploadInstance } from 'element-plus';
import { useFileManager } from '../composables/useFileManager';
import type { FileItem, FilePermissions } from '../../../shared/types/file';

// Props
const props = defineProps<{
  serverId?: number;
  serverInfo?: any;
}>();

// 组合式函数
const {
  loading,
  fileList,
  currentPath,
  selectedFiles,
  permissions,
  loadFileList,
  createDirectory,
  uploadFile,
  downloadFile,
  deleteFile,
  renameFile,
  readFileContent,
  saveFileContent,
  checkPermissions
} = useFileManager();

// 响应式状态
const visible = ref(false);
const editDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const saving = ref(false);
const fileContent = ref('');
const previewContent = ref('');
const editingFile = ref<FileItem | null>(null);
const previewFile = ref<FileItem | null>(null);

// 上传相关
const uploadRef = ref<UploadInstance>();
const uploadUrl = computed(() => `/api/v1/gen/server/upload-file`);
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
}));
const uploadData = computed(() => ({
  serverId: props.serverId,
  path: currentPath.value
}));

// 路径相关
const pathSegments = computed(() => {
  return currentPath.value.split('/').filter(segment => segment);
});

/**
 * 获取文件图标
 */
const getFileIcon = (file: FileItem) => {
  if (file.isDirectory) {
    return 'ri:folder-line';
  }
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    // 图片
    jpg: 'ri:image-line',
    jpeg: 'ri:image-line',
    png: 'ri:image-line',
    gif: 'ri:image-line',
    svg: 'ri:image-line',
    
    // 文档
    txt: 'ri:file-text-line',
    md: 'ri:markdown-line',
    pdf: 'ri:file-pdf-line',
    doc: 'ri:file-word-line',
    docx: 'ri:file-word-line',
    xls: 'ri:file-excel-line',
    xlsx: 'ri:file-excel-line',
    ppt: 'ri:file-ppt-line',
    pptx: 'ri:file-ppt-line',
    
    // 代码
    js: 'ri:file-code-line',
    ts: 'ri:file-code-line',
    vue: 'ri:vuejs-line',
    html: 'ri:html5-line',
    css: 'ri:css3-line',
    json: 'ri:file-code-line',
    xml: 'ri:file-code-line',
    
    // 压缩包
    zip: 'ri:file-zip-line',
    rar: 'ri:file-zip-line',
    '7z': 'ri:file-zip-line',
    tar: 'ri:file-zip-line',
    gz: 'ri:file-zip-line',
    
    // 其他
    log: 'ri:file-list-line',
    conf: 'ri:settings-line',
    config: 'ri:settings-line',
  };
  
  return iconMap[ext || ''] || 'ri:file-line';
};

/**
 * 格式化文件大小
 */
const formatFileSize = (size: number) => {
  if (size === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化时间
 */
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

/**
 * 导航到指定路径
 */
const navigateToPath = (path: string) => {
  currentPath.value = path;
  loadFileList(props.serverId!, path);
};

/**
 * 获取路径到指定索引
 */
const getPathUpTo = (index: number) => {
  return '/' + pathSegments.value.slice(0, index + 1).join('/');
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: FileItem[]) => {
  selectedFiles.value = selection;
};

/**
 * 处理行双击
 */
const handleRowDoubleClick = (row: FileItem) => {
  if (row.isDirectory) {
    navigateToPath(row.path);
  } else {
    handleFileAction('view', row);
  }
};

/**
 * 处理文件操作
 */
const handleFileAction = async (command: string, file: FileItem) => {
  switch (command) {
    case 'view':
      await handleViewFile(file);
      break;
    case 'edit':
      await handleEditFile(file);
      break;
    case 'delete':
      await handleDeleteFile(file);
      break;
    case 'copy':
      message.info('复制功能开发中');
      break;
    case 'move':
      message.info('移动功能开发中');
      break;
    case 'properties':
      message.info('属性功能开发中');
      break;
  }
};

/**
 * 查看文件
 */
const handleViewFile = async (file: FileItem) => {
  if (!permissions.canRead) {
    message.error('没有查看权限');
    return;
  }
  
  try {
    previewFile.value = file;
    
    if (isTextFile(file)) {
      const content = await readFileContent(props.serverId!, file.path);
      previewContent.value = content || '';
    }
    
    previewDialogVisible.value = true;
  } catch (error) {
    console.error('查看文件失败:', error);
    message.error('查看文件失败');
  }
};

/**
 * 编辑文件
 */
const handleEditFile = async (file: FileItem) => {
  if (!permissions.canWrite) {
    message.error('没有编辑权限');
    return;
  }
  
  if (!isTextFile(file)) {
    message.error('只能编辑文本文件');
    return;
  }
  
  try {
    editingFile.value = file;
    const content = await readFileContent(props.serverId!, file.path);
    fileContent.value = content || '';
    editDialogVisible.value = true;
  } catch (error) {
    console.error('读取文件失败:', error);
    message.error('读取文件失败');
  }
};

/**
 * 保存文件
 */
const handleSaveFile = async () => {
  if (!editingFile.value || !props.serverId) return;
  
  try {
    saving.value = true;
    await saveFileContent(props.serverId, editingFile.value.path, fileContent.value);
    message.success('文件保存成功');
    editDialogVisible.value = false;
  } catch (error) {
    console.error('保存文件失败:', error);
    message.error('保存文件失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 判断是否为图片文件
 */
const isImageFile = (file: FileItem | null) => {
  if (!file) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '');
};

/**
 * 判断是否为文本文件
 */
const isTextFile = (file: FileItem | null) => {
  if (!file) return false;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'vue', 'log', 'conf', 'config', 'yml', 'yaml'].includes(ext || '');
};

/**
 * 获取文件预览URL
 */
const getFilePreviewUrl = (file: FileItem | null) => {
  if (!file || !props.serverId) return '';
  return `/api/v1/gen/server/preview-file?serverId=${props.serverId}&path=${encodeURIComponent(file.path)}`;
};

/**
 * 创建文件夹
 */
const handleCreateFolder = async () => {
  try {
    const { value: folderName } = await ElMessageBox.prompt(
      '请输入文件夹名称',
      '新建文件夹',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^[^\\/:*?"<>|]+$/,
        inputErrorMessage: '文件夹名称不能包含特殊字符'
      }
    );
    
    if (folderName && props.serverId) {
      const folderPath = currentPath.value === '/' 
        ? `/${folderName}` 
        : `${currentPath.value}/${folderName}`;
      
      await createDirectory(props.serverId, folderPath);
      await loadFileList(props.serverId, currentPath.value);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建文件夹失败:', error);
      message.error('创建文件夹失败');
    }
  }
};

/**
 * 重命名文件
 */
const handleRenameFile = async (file: FileItem) => {
  if (!permissions.canRename) {
    message.error('没有重命名权限');
    return;
  }
  
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的文件名',
      '重命名',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: file.name,
      }
    );
    
    if (newName && newName !== file.name && props.serverId) {
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = newName;
      const newPath = pathParts.join('/');
      
      await renameFile(props.serverId, file.path, newPath);
      await loadFileList(props.serverId, currentPath.value);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重命名文件失败:', error);
      message.error('重命名文件失败');
    }
  }
};

/**
 * 删除文件
 */
const handleDeleteFile = async (file: FileItem) => {
  if (!permissions.canDelete) {
    message.error('没有删除权限');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${file.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    if (props.serverId) {
      await deleteFile(props.serverId, file.path);
      await loadFileList(props.serverId, currentPath.value);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error);
      message.error('删除文件失败');
    }
  }
};

/**
 * 下载文件
 */
const handleDownloadFile = async (file: FileItem) => {
  if (!permissions.canDownload) {
    message.error('没有下载权限');
    return;
  }
  
  if (props.serverId) {
    await downloadFile(props.serverId, file.path);
  }
};

/**
 * 下载选中文件
 */
const handleDownloadSelected = async () => {
  if (selectedFiles.value.length === 0) return;
  
  for (const file of selectedFiles.value) {
    if (!file.isDirectory) {
      await handleDownloadFile(file);
    }
  }
};

/**
 * 删除选中文件
 */
const handleDeleteSelected = async () => {
  if (selectedFiles.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件/文件夹吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    if (props.serverId) {
      for (const file of selectedFiles.value) {
        await deleteFile(props.serverId, file.path);
      }
      await loadFileList(props.serverId, currentPath.value);
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error);
      message.error('删除文件失败');
    }
  }
};

/**
 * 上传前检查
 */
const handleBeforeUpload = (file: File) => {
  if (!permissions.canUpload) {
    message.error('没有上传权限');
    return false;
  }
  
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    message.error('文件大小不能超过100MB');
    return false;
  }
  
  return true;
};

/**
 * 上传成功
 */
const handleUploadSuccess = (response: any) => {
  if (response.code === '00000') {
    message.success('文件上传成功');
    if (props.serverId) {
      loadFileList(props.serverId, currentPath.value);
    }
  } else {
    message.error(response.msg || '文件上传失败');
  }
};

/**
 * 上传失败
 */
const handleUploadError = (error: any) => {
  console.error('文件上传失败:', error);
  message.error('文件上传失败');
};

/**
 * 打开对话框
 */
const open = () => {
  if (props.serverId) {
    checkPermissions();
    visible.value = true;
    currentPath.value = '/';
    loadFileList(props.serverId, '/');
  }
};

// 暴露方法
defineExpose({
  open
});
</script>

<style scoped lang="scss">
.file-manager-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.file-manager-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  
  .path-navigation {
    flex: 1;
    
    :deep(.el-breadcrumb__item) {
      cursor: pointer;
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
  
  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
}

.file-list-container {
  flex: 1;
  overflow: hidden;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .file-icon {
    font-size: 16px;
    color: var(--el-text-color-regular);
    
    &.folder-icon {
      color: var(--el-color-warning);
    }
  }
  
  .file-name {
    flex: 1;
  }
}

.file-preview {
  .image-preview {
    text-align: center;
    
    img {
      max-width: 100%;
      max-height: 500px;
      object-fit: contain;
    }
  }
  
  .text-preview {
    pre {
      background: var(--el-fill-color-light);
      padding: 16px;
      border-radius: 4px;
      max-height: 500px;
      overflow: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
  
  .unsupported-preview {
    text-align: center;
    padding: 40px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  
  .file-count {
    color: var(--el-text-color-regular);
    font-size: 14px;
  }
}
</style>
