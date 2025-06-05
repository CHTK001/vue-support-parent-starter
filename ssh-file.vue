<template>
  <div class="ssh-file-container">
    <!-- 顶部导航栏 -->
    <div class="ssh-file-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">根目录</el-breadcrumb-item>
        <el-breadcrumb-item 
          v-for="(part, index) in pathParts" 
          :key="index" 
          :to="{ path: getPathTo(index) }">
          {{ part }}
        </el-breadcrumb-item>
      </el-breadcrumb>
      
      <div class="ssh-file-actions">
        <el-button-group>
          <el-button type="primary" @click="refreshFiles" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
          <el-button type="success" @click="showUploadDialog">
            <el-icon><Upload /></el-icon> 上传
          </el-button>
          <el-button type="info" @click="showNewFolderDialog">
            <el-icon><FolderAdd /></el-icon> 新建文件夹
          </el-button>
        </el-button-group>
      </div>
    </div>
    
    <!-- 文件搜索和过滤 -->
    <div class="ssh-file-search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索文件..."
        clearable
        prefix-icon="el-icon-search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select v-model="fileTypeFilter" placeholder="文件类型" clearable>
        <el-option label="全部" value="" />
        <el-option label="文件夹" value="directory" />
        <el-option label="文本文件" value="text" />
        <el-option label="图片" value="image" />
        <el-option label="视频" value="video" />
        <el-option label="音频" value="audio" />
        <el-option label="压缩文件" value="archive" />
      </el-select>
    </div>
    
    <!-- 文件列表 -->
    <div class="ssh-file-content" v-loading="loading">
      <el-empty v-if="filteredFiles.length === 0" description="没有找到文件" />
      
      <el-table
        v-else
        :data="filteredFiles"
        style="width: 100%"
        @row-dblclick="handleRowDblClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="名称" min-width="200">
          <template #default="{ row }">
            <div class="file-name-cell">
              <el-icon class="file-icon">
                <component :is="getFileIcon(row)" />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="size" label="大小" width="120">
          <template #default="{ row }">
            {{ row.isDirectory ? '-' : formatFileSize(row.size) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="permissions" label="权限" width="100" />
        
        <el-table-column prop="modifiedTime" label="修改时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.modifiedTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-tooltip content="下载" placement="top" v-if="!row.isDirectory">
                <el-button type="primary" size="small" @click="downloadFile(row)">
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip content="重命名" placement="top">
                <el-button type="info" size="small" @click="showRenameDialog(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" size="small" @click="confirmDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-tooltip content="查看详情" placement="top">
                <el-button size="small" @click="showFileDetails(row)">
                  <el-icon><InfoFilled /></el-icon>
                </el-button>
              </el-tooltip>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 批量操作工具栏 -->
    <div class="ssh-file-batch-actions" v-if="selectedFiles.length > 0">
      <span class="selected-count">已选择 {{ selectedFiles.length }} 项</span>
      <el-button-group>
        <el-button type="primary" @click="batchDownload" :disabled="!canBatchDownload">
          <el-icon><Download /></el-icon> 批量下载
        </el-button>
        <el-button type="danger" @click="batchDelete">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </el-button-group>
    </div>
    
    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="500px"
    >
      <el-upload
        class="ssh-file-uploader"
        drag
        multiple
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            文件将上传到当前目录: {{ currentPath }}
          </div>
        </template>
      </el-upload>
    </el-dialog>
    
    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="newFolderDialogVisible"
      title="新建文件夹"
      width="400px"
    >
      <el-form :model="newFolderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input v-model="newFolderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="newFolderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createNewFolder">创建</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 重命名对话框 -->
    <el-dialog
      v-model="renameDialogVisible"
      title="重命名"
      width="400px"
    >
      <el-form :model="renameForm" label-width="80px">
        <el-form-item label="新名称">
          <el-input v-model="renameForm.newName" placeholder="请输入新名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="renameFile">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 文件详情对话框 -->
    <el-dialog
      v-model="fileDetailsVisible"
      title="文件详情"
      width="500px"
    >
      <div v-if="currentFileDetails" class="file-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="名称">{{ currentFileDetails.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentFileDetails.isDirectory ? '文件夹' : getFileType(currentFileDetails) }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ currentFileDetails.isDirectory ? '-' : formatFileSize(currentFileDetails.size) }}</el-descriptions-item>
          <el-descriptions-item label="权限">{{ currentFileDetails.permissions }}</el-descriptions-item>
          <el-descriptions-item label="所有者">{{ currentFileDetails.owner }}</el-descriptions-item>
          <el-descriptions-item label="修改时间">{{ formatDate(currentFileDetails.modifiedTime) }}</el-descriptions-item>
          <el-descriptions-item label="路径">{{ currentPath + '/' + currentFileDetails.name }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="isPreviewable(currentFileDetails)" class="file-preview">
          <h4>预览</h4>
          <div class="preview-content">
            <img v-if="isImage(currentFileDetails)" :src="getFileUrl(currentFileDetails)" alt="预览图片" />
            <pre v-else-if="isTextFile(currentFileDetails)" class="text-preview">{{ filePreviewContent }}</pre>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Folder, FolderAdd, Document, Picture, Film, Music, 
  Collection, Download, Upload, Delete, Edit, Refresh,
  Search, InfoFilled, UploadFilled
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 状态变量
const loading = ref(false);
const currentPath = ref('/');
const files = ref([]);
const searchQuery = ref('');
const fileTypeFilter = ref('');
const selectedFiles = ref([]);

// 对话框控制
const uploadDialogVisible = ref(false);
const newFolderDialogVisible = ref(false);
const renameDialogVisible = ref(false);
const fileDetailsVisible = ref(false);

// 表单数据
const newFolderForm = ref({ name: '' });
const renameForm = ref({ oldName: '', newName: '', isDirectory: false });
const currentFileDetails = ref(null);
const filePreviewContent = ref('');

// 计算属性
const pathParts = computed(() => {
  return currentPath.value.split('/').filter(part => part !== '');
});

const filteredFiles = computed(() => {
  let result = [...files.value];
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(file => file.name.toLowerCase().includes(query));
  }
  
  // 类型过滤
  if (fileTypeFilter.value) {
    switch (fileTypeFilter.value) {
      case 'directory':
        result = result.filter(file => file.isDirectory);
        break;
      case 'text':
        result = result.filter(file => isTextFile(file));
        break;
      case 'image':
        result = result.filter(file => isImage(file));
        break;
      case 'video':
        result = result.filter(file => isVideo(file));
        break;
      case 'audio':
        result = result.filter(file => isAudio(file));
        break;
      case 'archive':
        result = result.filter(file => isArchive(file));
        break;
    }
  }
  
  // 文件夹优先排序
  return result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
});

const canBatchDownload = computed(() => {
  return selectedFiles.value.every(file => !file.isDirectory);
});

const uploadUrl = computed(() => {
  return `/api/ssh/upload?path=${encodeURIComponent(currentPath.value)}`;
});

const uploadHeaders = computed(() => {
  return {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  };
});

// 方法
const refreshFiles = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里应该是实际的API调用
    // const response = await fetch(`/api/ssh/files?path=${encodeURIComponent(currentPath.value)}`);
    // files.value = await response.json();
    
    // 示例数据
    files.value = [
      { name: '文档', isDirectory: true, size: 0, permissions: 'drwxr-xr-x', owner: 'user', modifiedTime: new Date() },
      { name: '图片', isDirectory: true, size: 0, permissions: 'drwxr-xr-x', owner: 'user', modifiedTime: new Date() },
      { name: '视频', isDirectory: true, size: 0, permissions: 'drwxr-xr-x', owner: 'user', modifiedTime: new Date() },
      { name: 'readme.txt', isDirectory: false, size: 1024, permissions: '-rw-r--r--', owner: 'user', modifiedTime: new Date() },
      { name: 'config.json', isDirectory: false, size: 2048, permissions: '-rw-r--r--', owner: 'user', modifiedTime: new Date() },
      { name: 'screenshot.png', isDirectory: false, size: 1024 * 1024, permissions: '-rw-r--r--', owner: 'user', modifiedTime: new Date() },
      { name: 'presentation.pdf', isDirectory: false, size: 5 * 1024 * 1024, permissions: '-rw-r--r--', owner: 'user', modifiedTime: new Date() },
      { name: 'archive.zip', isDirectory: false, size: 10 * 1024 * 1024, permissions: '-rw-r--r--', owner: 'user', modifiedTime: new Date() },
    ];
    
    ElMessage.success('文件列表已刷新');
  } catch (error) {
    console.error('Failed to refresh files:', error);
    ElMessage.error('刷新文件列表失败');
  } finally {
    loading.value = false;
  }
};

const handleRowDblClick = (row) => {
  if (row.isDirectory) {
    navigateToDirectory(row.name);
  } else {
    showFileDetails(row);
  }
};

const navigateToDirectory = (dirName) => {
  if (dirName === '..') {
    // 返回上一级
    const parts = currentPath.value.split('/').filter(part => part !== '');
    parts.pop();
    currentPath.value = '/' + parts.join('/');
  } else {
    // 进入子目录
    currentPath.value = currentPath.value.endsWith('/')
      ? currentPath.value + dirName
      : currentPath.value + '/' + dirName;
  }
  refreshFiles();
};

const getPathTo = (index) => {
  const parts = pathParts.value.slice(0, index + 1);
  return '/' + parts.join('/');
};

const handleSelectionChange = (selection) => {
  selectedFiles.value = selection;
};

const showUploadDialog = () => {
  uploadDialogVisible.value = true;
};

const showNewFolderDialog = () => {
  newFolderForm.value.name = '';
  newFolderDialogVisible.value = true;
};

const showRenameDialog = (file) => {
  renameForm.value = {
    oldName: file.name,
    newName: file.name,
    isDirectory: file.isDirectory
  };
  renameDialogVisible.value = true;
};

const confirmDelete = (file) => {
  ElMessageBox.confirm(
    `确定要删除${file.isDirectory ? '文件夹' : '文件'} "${file.name}" 吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteFile(file);
  }).catch(() => {
    // 取消删除
  });
};

const deleteFile = async (file) => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里应该是实际的API调用
    // await fetch(`/api/ssh/delete`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ path: currentPath.value + '/' + file.name })
    // });
    
    ElMessage.success(`${file.isDirectory ? '文件夹' : '文件'} "${file.name}" 已删除`);
    refreshFiles();
  } catch (error) {
    console.error('Failed to delete file:', error);
    ElMessage.error('删除失败');
  } finally {
    loading.value = false;
  }
};

const batchDelete = () => {
  if (selectedFiles.value.length === 0) return;
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedFiles.value.length} 项吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 这里应该是实际的API调用
      // const filePaths = selectedFiles.value.map(file => currentPath.value + '/' + file.name);
      // await fetch(`/api/ssh/batch-delete`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paths: filePaths })
      // });
      
      ElMessage.success(`已删除 ${selectedFiles.value.length} 项`);
      refreshFiles();
    } catch (error) {
      console.error('Failed to batch delete:', error);
      ElMessage.error('批量删除失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 取消删除
  });
};

const downloadFile = (file) => {
  const fileUrl = getFileUrl(file);
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const batchDownload = async () => {
  if (selectedFiles.value.length === 0) return;
  
  // 对于多文件下载，通常需要服务器创建一个压缩包
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里应该是实际的API调用
    // const filePaths = selectedFiles.value.map(file => currentPath.value + '/' + file.name);
    // const response = await fetch(`/api/ssh/batch-download`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ paths: filePaths })
    // });
    // const blob = await response.blob();
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = 'files.zip';
    // document.body.appendChild(a);
    // a.click();
    // window.URL.revokeObjectURL(url);
    // document.body.removeChild(a);
    
    ElMessage.success('文件已开始下载');
  } catch (error) {
    console.error('Failed to batch download:', error);
    ElMessage.error('批量下载失败');
  } finally {
    loading.value = false;
  }
};

const createNewFolder = async () => {
  if (!newFolderForm.value.name) {
    ElMessage.warning('请输入文件夹名称');
    return;
  }
  
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里应该是实际的API调用
    // await fetch(`/api/ssh/mkdir`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ path: currentPath.value + '/' + newFolderForm.value.name })
    // });
    
    ElMessage.success(`文件夹 "${newFolderForm.value.name}" 已创建`);
    newFolderDialogVisible.value = false;
    refreshFiles();
  } catch (error) {
    console.error('Failed to create folder:', error);
    ElMessage.error('创建文件夹失败');
  } finally {
    loading.value = false;
  }
};

const renameFile = async () => {
  if (!renameForm.value.newName) {
    ElMessage.warning('请输入新名称');
    return;
  }
  
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里应该是实际的API调用
    // await fetch(`/api/ssh/rename`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     oldPath: currentPath.value + '/' + renameForm.value.oldName,
    //     newPath: currentPath.value + '/' + renameForm.value.newName
    //   })
    // });
    
    ElMessage.success(`已重命名为 "${renameForm.value.newName}"`);
    renameDialogVisible.value = false;
    refreshFiles();
  } catch (error) {
    console.error('Failed to rename:', error);
    ElMessage.error('重命名失败');
  } finally {
    loading.value = false;
  }
};

const showFileDetails = async (file) => {
  currentFileDetails.value = file;
  fileDetailsVisible.value = true;
  
  if (isPreviewable(file) && isTextFile(file)) {
    loading.value = true;
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 这里应该是实际的API调用
      // const response = await fetch(`/api/ssh/preview?path=${encodeURIComponent(currentPath.value + '/' + file.name)}`);
      // const text = await response.text();
      
      // 示例预览内容
      filePreviewContent.value = file.name === 'readme.txt' 
        ? '这是一个示例文本文件的内容。\n可以在这里显示文本文件的预览。'
        : file.name === 'config.json'
          ? '{\n  "name": "ssh-file-manager",\n  "version": "1.0.0",\n  "description": "SSH文件管理器"\n}'
          : '无法预览此文件内容';
    } catch (error) {
      console.error('Failed to load preview:', error);
      filePreviewContent.value = '加载预览失败';
    } finally {
      loading.value = false;
    }
  }
};

const handleUploadSuccess = () => {
  ElMessage.success('文件上传成功');
  uploadDialogVisible.value = false;
  refreshFiles();
};

const handleUploadError = () => {
  ElMessage.error('文件上传失败');
};

const beforeUpload = (file) => {
  // 这里可以添加文件大小限制、类型检查等
  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    ElMessage.warning('上传文件大小不能超过 100MB!');
    return false;
  }
  return true;
};

// 工具函数
const formatFileSize = (size) => {
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString();
};

const getFileIcon = (file) => {
  if (file.isDirectory) return Folder;
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
    return Picture;
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return Film;
  } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension)) {
    return Music;
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return Collection;
  } else {
    return Document;
  }
};

const getFileType = (file) => {
  if (file.isDirectory) return '文件夹';
  
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
    return '图片';
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return '视频';
  } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension)) {
    return '音频';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return '压缩文件';
  } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'c', 'cpp'].includes(extension)) {
    return '文本文件';
  } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
    return '文档';
  } else {
    return '文件';
  }
};

const isTextFile = (file) => {
  if (file.isDirectory) return false;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'py', 'java', 'c', 'cpp', 'log', 'ini', 'conf', 'sh', 'bat'].includes(extension);
};

const isImage = (file) => {
  if (file.isDirectory) return false;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);
};

const isVideo = (file) => {
  if (file.isDirectory) return false;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension);
};

const isAudio = (file) => {
  if (file.isDirectory) return false;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension);
};

const isArchive = (file) => {
  if (file.isDirectory) return false;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension);
};

const isPreviewable = (file) => {
  return isTextFile(file) || isImage(file) || isVideo(file) || isAudio(file) || isArchive(file);
};

const getFileUrl = (file) => {
  // 这里应该返回文件的实际URL
  return '';
};
</script> 