<template>
  <div class="file-manager">
    <!-- 头部工具栏 -->
    <div class="file-header">
      <div class="file-info">
        <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
        <span class="file-title">文件管理 - {{ server?.name }}</span>
      </div>
      <div class="file-actions">
        <el-button size="small" @click="refreshFiles">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button size="small" @click="uploadFiles">
          <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
          上传
        </el-button>
        <el-button size="small" @click="createFolder">
          <IconifyIconOnline icon="ri:folder-add-line" class="mr-1" />
          新建文件夹
        </el-button>
        <el-button size="small" @click="$emit('close')">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          关闭
        </el-button>
      </div>
    </div>

    <!-- 路径导航 -->
    <div class="path-navigation">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item @click="navigateToPath('/')">
          <IconifyIconOnline icon="ri:home-line" />
          根目录
        </el-breadcrumb-item>
        <el-breadcrumb-item
          v-for="(path, index) in pathParts"
          :key="index"
          @click="navigateToPath(getPathUpTo(index))"
        >
          {{ path }}
        </el-breadcrumb-item>
      </el-breadcrumb>
      <div class="path-input">
        <el-input
          v-model="currentPath"
          size="small"
          placeholder="输入路径"
          @keyup.enter="navigateToPath(currentPath)"
        >
          <template #append>
            <el-button @click="navigateToPath(currentPath)">
              <IconifyIconOnline icon="ri:arrow-right-line" />
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-content" v-loading="loading">
      <el-table
        :data="files"
        stripe
        size="small"
        height="400"
        @row-dblclick="handleFileDoubleClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="名称" min-width="200">
          <template #default="{ row }">
            <div class="file-item">
              <IconifyIconOnline :icon="getFileIcon(row)" class="file-icon" />
              <span class="file-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="100">
          <template #default="{ row }">
            {{ row.isDirectory ? '-' : formatFileSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="permissions" label="权限" width="100" />
        <el-table-column prop="owner" label="所有者" width="100" />
        <el-table-column prop="modifiedTime" label="修改时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.modifiedTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text @click="downloadFile(row)" v-if="!row.isDirectory">
              <IconifyIconOnline icon="ri:download-line" />
            </el-button>
            <el-button size="small" text @click="editFile(row)" v-if="isTextFile(row)">
              <IconifyIconOnline icon="ri:edit-line" />
            </el-button>
            <el-button size="small" text @click="renameFile(row)">
              <IconifyIconOnline icon="ri:edit-2-line" />
            </el-button>
            <el-button size="small" text @click="deleteFile(row)" type="danger">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedFiles.length > 0">
        <el-button size="small" @click="downloadSelected">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          下载选中 ({{ selectedFiles.length }})
        </el-button>
        <el-button size="small" @click="deleteSelected" type="danger">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          删除选中
        </el-button>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="文件上传" width="500px">
      <el-upload
        drag
        multiple
        :auto-upload="false"
        :on-change="handleFileSelect"
        :file-list="uploadFileList"
        :before-remove="handleFileRemove"
      >
        <IconifyIconOnline icon="ri:upload-cloud-line" class="upload-icon" />
        <div class="upload-text">
          <p>将文件拖拽到此处，或<em>点击上传</em></p>
          <p class="upload-tip">支持多文件上传</p>
        </div>
      </el-upload>
      <div class="upload-progress" v-if="uploading">
        <el-progress :percentage="uploadProgress" :status="uploadStatus" />
        <p>{{ uploadMessage }}</p>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="startUpload" :loading="uploading">
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 文件编辑对话框 -->
    <el-dialog v-model="editDialogVisible" title="文件编辑" width="800px">
      <div class="file-editor">
        <div class="editor-header">
          <span class="file-path">{{ editingFile?.path }}</span>
          <div class="editor-actions">
            <el-button size="small" @click="saveFile" :loading="saving">
              <IconifyIconOnline icon="ri:save-line" class="mr-1" />
              保存
            </el-button>
          </div>
        </div>
        <el-input
          v-model="fileContent"
          type="textarea"
          :rows="20"
          placeholder="文件内容..."
          class="file-textarea"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";

// Props
const props = defineProps<{
  server: any;
}>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 状态
const loading = ref(false);
const currentPath = ref('/');
const files = ref<any[]>([]);
const selectedFiles = ref<any[]>([]);

// 上传相关
const uploadDialogVisible = ref(false);
const uploadFileList = ref<any[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref<'success' | 'exception' | undefined>();
const uploadMessage = ref('');

// 编辑相关
const editDialogVisible = ref(false);
const editingFile = ref<any>(null);
const fileContent = ref('');
const saving = ref(false);

// 计算属性
const pathParts = computed(() => {
  return currentPath.value.split('/').filter(part => part);
});

// 方法
const loadFiles = async (path: string = currentPath.value) => {
  try {
    loading.value = true;
    
    // 模拟加载文件列表
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟文件数据
    const mockFiles = [
      {
        name: '..',
        isDirectory: true,
        size: 0,
        permissions: 'drwxr-xr-x',
        owner: 'root',
        modifiedTime: new Date()
      },
      {
        name: 'home',
        isDirectory: true,
        size: 0,
        permissions: 'drwxr-xr-x',
        owner: 'root',
        modifiedTime: new Date()
      },
      {
        name: 'var',
        isDirectory: true,
        size: 0,
        permissions: 'drwxr-xr-x',
        owner: 'root',
        modifiedTime: new Date()
      },
      {
        name: 'config.txt',
        isDirectory: false,
        size: 1024,
        permissions: '-rw-r--r--',
        owner: 'root',
        modifiedTime: new Date()
      },
      {
        name: 'script.sh',
        isDirectory: false,
        size: 2048,
        permissions: '-rwxr-xr-x',
        owner: 'root',
        modifiedTime: new Date()
      }
    ];
    
    files.value = path === '/' ? mockFiles.slice(1) : mockFiles;
    
  } catch (error) {
    message.error('加载文件列表失败');
    console.error('加载文件列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const refreshFiles = () => {
  loadFiles();
};

const navigateToPath = (path: string) => {
  currentPath.value = path;
  loadFiles(path);
};

const getPathUpTo = (index: number) => {
  return '/' + pathParts.value.slice(0, index + 1).join('/');
};

const handleFileDoubleClick = (file: any) => {
  if (file.isDirectory) {
    if (file.name === '..') {
      // 返回上级目录
      const parts = pathParts.value;
      if (parts.length > 0) {
        parts.pop();
        navigateToPath('/' + parts.join('/'));
      }
    } else {
      // 进入子目录
      const newPath = currentPath.value === '/' 
        ? '/' + file.name 
        : currentPath.value + '/' + file.name;
      navigateToPath(newPath);
    }
  } else {
    // 下载文件
    downloadFile(file);
  }
};

const handleSelectionChange = (selection: any[]) => {
  selectedFiles.value = selection;
};

const getFileIcon = (file: any) => {
  if (file.isDirectory) {
    return file.name === '..' ? 'ri:arrow-up-line' : 'ri:folder-line';
  }
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    txt: 'ri:file-text-line',
    log: 'ri:file-text-line',
    conf: 'ri:file-settings-line',
    config: 'ri:file-settings-line',
    sh: 'ri:terminal-line',
    py: 'ri:file-code-line',
    js: 'ri:file-code-line',
    html: 'ri:file-code-line',
    css: 'ri:file-code-line',
    json: 'ri:file-code-line',
    xml: 'ri:file-code-line',
    zip: 'ri:file-zip-line',
    tar: 'ri:file-zip-line',
    gz: 'ri:file-zip-line',
    jpg: 'ri:image-line',
    jpeg: 'ri:image-line',
    png: 'ri:image-line',
    gif: 'ri:image-line',
    pdf: 'ri:file-pdf-line'
  };
  
  return iconMap[ext || ''] || 'ri:file-line';
};

const isTextFile = (file: any) => {
  if (file.isDirectory) return false;
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  const textExts = ['txt', 'log', 'conf', 'config', 'sh', 'py', 'js', 'html', 'css', 'json', 'xml'];
  return textExts.includes(ext || '');
};

const formatFileSize = (size: number) => {
  if (size === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (time: Date) => {
  return time.toLocaleString();
};

const downloadFile = (file: any) => {
  // TODO: 实现文件下载
  message.success(`开始下载文件: ${file.name}`);
};

const editFile = async (file: any) => {
  try {
    editingFile.value = file;
    editDialogVisible.value = true;
    
    // 模拟加载文件内容
    await new Promise(resolve => setTimeout(resolve, 500));
    fileContent.value = `# 这是文件 ${file.name} 的内容\n# 这里是模拟的文件内容\necho "Hello World"`;
    
  } catch (error) {
    message.error('加载文件内容失败');
  }
};

const saveFile = async () => {
  try {
    saving.value = true;
    
    // 模拟保存文件
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    message.success('文件保存成功');
    editDialogVisible.value = false;
    
  } catch (error) {
    message.error('文件保存失败');
  } finally {
    saving.value = false;
  }
};

const renameFile = async (file: any) => {
  try {
    const { value: newName } = await ElMessageBox.prompt(
      '请输入新的文件名',
      '重命名',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: file.name
      }
    );
    
    if (newName && newName !== file.name) {
      // TODO: 实现文件重命名
      message.success(`文件重命名成功: ${file.name} -> ${newName}`);
      refreshFiles();
    }
  } catch (error) {
    // 用户取消
  }
};

const deleteFile = async (file: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${file.name}" 吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    
    // TODO: 实现文件删除
    message.success(`文件删除成功: ${file.name}`);
    refreshFiles();
    
  } catch (error) {
    // 用户取消
  }
};

const uploadFiles = () => {
  uploadDialogVisible.value = true;
  uploadFileList.value = [];
};

const createFolder = async () => {
  try {
    const { value: folderName } = await ElMessageBox.prompt(
      '请输入文件夹名称',
      '新建文件夹',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    
    if (folderName) {
      // TODO: 实现创建文件夹
      message.success(`文件夹创建成功: ${folderName}`);
      refreshFiles();
    }
  } catch (error) {
    // 用户取消
  }
};

const handleFileSelect = (file: any) => {
  uploadFileList.value.push(file);
};

const handleFileRemove = (file: any) => {
  const index = uploadFileList.value.indexOf(file);
  if (index > -1) {
    uploadFileList.value.splice(index, 1);
  }
};

const startUpload = async () => {
  if (uploadFileList.value.length === 0) {
    message.warning('请选择要上传的文件');
    return;
  }

  try {
    uploading.value = true;
    uploadProgress.value = 0;
    uploadStatus.value = undefined;

    for (let i = 0; i < uploadFileList.value.length; i++) {
      const file = uploadFileList.value[i];
      uploadMessage.value = `正在上传: ${file.name}`;
      
      // 模拟上传进度
      for (let progress = 0; progress <= 100; progress += 10) {
        uploadProgress.value = Math.round(((i * 100) + progress) / uploadFileList.value.length);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    uploadStatus.value = 'success';
    uploadMessage.value = '文件上传完成';
    message.success('文件上传成功');
    
    setTimeout(() => {
      uploadDialogVisible.value = false;
      refreshFiles();
    }, 2000);

  } catch (error) {
    uploadStatus.value = 'exception';
    uploadMessage.value = '文件上传失败';
    message.error('文件上传失败');
  } finally {
    uploading.value = false;
  }
};

const downloadSelected = () => {
  if (selectedFiles.value.length === 0) return;
  
  selectedFiles.value.forEach(file => {
    if (!file.isDirectory) {
      downloadFile(file);
    }
  });
};

const deleteSelected = async () => {
  if (selectedFiles.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    
    // TODO: 实现批量删除
    message.success(`批量删除成功，共删除 ${selectedFiles.value.length} 个文件`);
    refreshFiles();
    
  } catch (error) {
    // 用户取消
  }
};

// 生命周期
onMounted(() => {
  loadFiles();
});
</script>

<style lang="scss" scoped>
.file-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .file-info {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .file-title {
      margin-right: 8px;
    }
  }

  .file-actions {
    display: flex;
    gap: 8px;
  }
}

.path-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--el-fill-color-extra-light);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .path-input {
    width: 300px;
  }

  :deep(.el-breadcrumb__item) {
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.file-content {
  flex: 1;
  padding: 16px;
  overflow: hidden;

  .file-item {
    display: flex;
    align-items: center;

    .file-icon {
      margin-right: 8px;
      font-size: 16px;
      color: var(--el-color-primary);
    }

    .file-name {
      flex: 1;
    }
  }

  .batch-actions {
    margin-top: 16px;
    padding: 12px;
    background-color: var(--el-fill-color-extra-light);
    border-radius: 6px;
    display: flex;
    gap: 8px;
  }
}

.file-editor {
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .file-path {
      font-family: monospace;
      color: var(--el-text-color-secondary);
    }

    .editor-actions {
      display: flex;
      gap: 8px;
    }
  }

  .file-textarea {
    :deep(.el-textarea__inner) {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.4;
    }
  }
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.upload-text {
  p {
    margin: 0;
    color: var(--el-text-color-regular);

    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }

  .upload-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
}

.upload-progress {
  margin-top: 20px;
  text-align: center;

  p {
    margin-top: 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

:deep(.el-table) {
  .el-table__row {
    cursor: pointer;
  }
}
</style>
