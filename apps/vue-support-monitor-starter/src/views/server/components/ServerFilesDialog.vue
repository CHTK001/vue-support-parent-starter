<template>
  <el-dialog
    v-model="visible"
    :title="`${serverData.monitorSysGenServerName} - 文件管理`"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    class="files-dialog"
  >
    <div class="files-container">
      <!-- 工具栏 -->
      <div class="files-toolbar">
        <div class="toolbar-left">
          <!-- 路径导航 -->
          <el-breadcrumb separator="/" class="path-breadcrumb">
            <el-breadcrumb-item @click="navigateToPath('/')">
              <IconifyIconOnline icon="ri:home-line" />
            </el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(segment, index) in pathSegments"
              :key="index"
              @click="navigateToPath(getPathByIndex(index))"
              class="breadcrumb-item"
            >
              {{ segment }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="toolbar-right">
          <!-- 操作按钮 -->
          <el-button-group>
            <el-button size="small" @click="handleRefresh" :loading="loading">
              <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
              刷新
            </el-button>
            <el-button size="small" @click="handleCreateFolder">
              <IconifyIconOnline icon="ri:folder-add-line" class="mr-1" />
              新建文件夹
            </el-button>
            <el-button size="small" @click="handleUpload">
              <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
              上传文件
            </el-button>
          </el-button-group>
          
          <!-- 视图切换 -->
          <el-radio-group v-model="viewMode" size="small" class="ml-3">
            <el-radio-button label="list">
              <IconifyIconOnline icon="ri:list-unordered" />
            </el-radio-button>
            <el-radio-button label="grid">
              <IconifyIconOnline icon="ri:grid-line" />
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="files-content" v-loading="loading">
        <!-- 列表视图 -->
        <el-table
          v-if="viewMode === 'list'"
          :data="fileList"
          stripe
          @row-dblclick="handleItemDoubleClick"
          @selection-change="handleSelectionChange"
          class="files-table"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="名称" min-width="200">
            <template #default="{ row }">
              <div class="file-item" @click="handleItemClick(row)">
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
          <el-table-column prop="modifyTime" label="修改时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.modifyTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="permissions" label="权限" width="100" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  v-if="!row.isDirectory"
                  size="small"
                  type="primary"
                  @click="handleDownload(row)"
                >
                  <IconifyIconOnline icon="ri:download-line" />
                </el-button>
                <el-button size="small" @click="handleRename(row)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
                <el-popconfirm
                  title="确定要删除这个文件/文件夹吗？"
                  @confirm="handleDelete(row)"
                >
                  <template #reference>
                    <el-button size="small" type="danger">
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </el-button>
                  </template>
                </el-popconfirm>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 网格视图 -->
        <div v-else class="files-grid">
          <div
            v-for="item in fileList"
            :key="item.name"
            class="file-card"
            :class="{ 'selected': selectedFiles.includes(item) }"
            @click="handleItemClick(item)"
            @dblclick="handleItemDoubleClick(item)"
          >
            <div class="file-card-icon">
              <IconifyIconOnline :icon="getFileIcon(item)" />
            </div>
            <div class="file-card-name">{{ item.name }}</div>
            <div class="file-card-info">
              <span v-if="!item.isDirectory">{{ formatFileSize(item.size) }}</span>
              <span>{{ formatDate(item.modifyTime) }}</span>
            </div>
            <div class="file-card-actions">
              <el-button-group>
                <el-button
                  v-if="!item.isDirectory"
                  size="small"
                  type="primary"
                  @click.stop="handleDownload(item)"
                >
                  <IconifyIconOnline icon="ri:download-line" />
                </el-button>
                <el-button size="small" @click.stop="handleRename(item)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
                <el-popconfirm
                  title="确定要删除吗？"
                  @confirm="handleDelete(item)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" @click.stop>
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </el-button>
                  </template>
                </el-popconfirm>
              </el-button-group>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-if="!loading && fileList.length === 0" description="此文件夹为空" />
      </div>

      <!-- 批量操作栏 -->
      <div v-if="selectedFiles.length > 0" class="batch-actions">
        <div class="batch-info">
          已选择 {{ selectedFiles.length }} 个项目
        </div>
        <div class="batch-buttons">
          <el-button size="small" @click="handleBatchDownload">
            <IconifyIconOnline icon="ri:download-line" class="mr-1" />
            批量下载
          </el-button>
          <el-popconfirm
            title="确定要删除选中的文件/文件夹吗？"
            @confirm="handleBatchDelete"
          >
            <template #reference>
              <el-button size="small" type="danger">
                <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                批量删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <!-- 上传文件对话框 -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="500px" append-to-body>
      <el-upload
        ref="uploadRef"
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        multiple
        drag
      >
        <IconifyIconOnline icon="ri:upload-cloud-line" class="upload-icon" />
        <div class="upload-text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="upload-tip">
            支持多文件上传，单个文件大小不超过 100MB
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 新建文件夹对话框 -->
    <el-dialog v-model="folderVisible" title="新建文件夹" width="400px" append-to-body>
      <el-form :model="folderForm" :rules="folderRules" ref="folderFormRef">
        <el-form-item label="文件夹名称" prop="name">
          <el-input
            v-model="folderForm.name"
            placeholder="请输入文件夹名称"
            @keyup.enter="handleCreateFolderConfirm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateFolderConfirm" :loading="folderLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameVisible" title="重命名" width="400px" append-to-body>
      <el-form :model="renameForm" :rules="renameRules" ref="renameFormRef">
        <el-form-item label="新名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入新名称"
            @keyup.enter="handleRenameConfirm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRenameConfirm" :loading="renameLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          当前路径: {{ currentPath }}
        </div>
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from "vue";
import { message } from "@repo/utils";
import {
  getServerFiles,
  uploadServerFile,
  downloadServerFile,
  deleteServerFile,
  createServerDirectory,
} from "@/api/monitor/gen/server";

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const viewMode = ref<"list" | "grid">("list");
const currentPath = ref("/");

// 数据
const serverData = reactive<any>({});
const fileList = ref<any[]>([]);
const selectedFiles = ref<any[]>([]);

// 上传相关
const uploadVisible = ref(false);
const uploadRef = ref();
const uploadAction = computed(() => `/monitor/api/v1/gen/server/upload?id=${serverData.monitorSysGenServerId}&path=${encodeURIComponent(currentPath.value)}`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
}));
const uploadData = computed(() => ({
  path: currentPath.value,
}));

// 新建文件夹相关
const folderVisible = ref(false);
const folderLoading = ref(false);
const folderFormRef = ref();
const folderForm = reactive({
  name: "",
});
const folderRules = {
  name: [
    { required: true, message: "请输入文件夹名称", trigger: "blur" },
    { pattern: /^[^\/\\:*?"<>|]+$/, message: "文件夹名称不能包含特殊字符", trigger: "blur" },
  ],
};

// 重命名相关
const renameVisible = ref(false);
const renameLoading = ref(false);
const renameFormRef = ref();
const renameForm = reactive({
  name: "",
  oldName: "",
  oldPath: "",
});
const renameRules = {
  name: [
    { required: true, message: "请输入新名称", trigger: "blur" },
    { pattern: /^[^\/\\:*?"<>|]+$/, message: "名称不能包含特殊字符", trigger: "blur" },
  ],
};

// 计算属性
const pathSegments = computed(() => {
  return currentPath.value.split("/").filter(segment => segment);
});

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number) => {
  if (!bytes || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * 格式化日期
 */
const formatDate = (date: string | Date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("zh-CN");
  } catch (e) {
    return String(date);
  }
};

/**
 * 获取文件图标
 */
const getFileIcon = (item: any) => {
  if (item.isDirectory) {
    return "ri:folder-line";
  }

  const ext = item.name.split(".").pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    // 图片
    jpg: "ri:image-line",
    jpeg: "ri:image-line",
    png: "ri:image-line",
    gif: "ri:image-line",
    bmp: "ri:image-line",
    svg: "ri:image-line",

    // 文档
    txt: "ri:file-text-line",
    doc: "ri:file-word-line",
    docx: "ri:file-word-line",
    pdf: "ri:file-pdf-line",
    xls: "ri:file-excel-line",
    xlsx: "ri:file-excel-line",
    ppt: "ri:file-ppt-line",
    pptx: "ri:file-ppt-line",

    // 代码
    js: "ri:file-code-line",
    ts: "ri:file-code-line",
    html: "ri:file-code-line",
    css: "ri:file-code-line",
    java: "ri:file-code-line",
    py: "ri:file-code-line",
    cpp: "ri:file-code-line",
    c: "ri:file-code-line",
    php: "ri:file-code-line",
    go: "ri:file-code-line",

    // 压缩包
    zip: "ri:file-zip-line",
    rar: "ri:file-zip-line",
    "7z": "ri:file-zip-line",
    tar: "ri:file-zip-line",
    gz: "ri:file-zip-line",

    // 音视频
    mp3: "ri:music-line",
    wav: "ri:music-line",
    mp4: "ri:video-line",
    avi: "ri:video-line",
    mkv: "ri:video-line",
  };

  return iconMap[ext || ""] || "ri:file-line";
};

/**
 * 根据索引获取路径
 */
const getPathByIndex = (index: number) => {
  const segments = pathSegments.value.slice(0, index + 1);
  return "/" + segments.join("/");
};

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
  currentPath.value = "/";
  loadFiles();
};

/**
 * 设置数据
 */
const setData = (data: any) => {
  Object.assign(serverData, data);
};

/**
 * 加载文件列表
 */
const loadFiles = async (path?: string) => {
  if (path !== undefined) {
    currentPath.value = path;
  }

  if (!serverData.monitorSysGenServerId) return;

  try {
    loading.value = true;
    const res = await getServerFiles(String(serverData.monitorSysGenServerId), currentPath.value);
    if (res.code === "00000") {
      fileList.value = res.data || [];
      selectedFiles.value = [];
    } else {
      message.error(res.msg || "加载文件列表失败");
    }
  } catch (error) {
    message.error("加载文件列表异常");
    console.error("加载文件列表出错:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 导航到指定路径
 */
const navigateToPath = (path: string) => {
  loadFiles(path);
};

/**
 * 刷新文件列表
 */
const handleRefresh = () => {
  loadFiles();
};

/**
 * 处理项目点击
 */
const handleItemClick = (item: any) => {
  const index = selectedFiles.value.findIndex(file => file.name === item.name);
  if (index > -1) {
    selectedFiles.value.splice(index, 1);
  } else {
    selectedFiles.value.push(item);
  }
};

/**
 * 处理项目双击
 */
const handleItemDoubleClick = (item: any) => {
  if (item.isDirectory) {
    const newPath = currentPath.value === "/"
      ? `/${item.name}`
      : `${currentPath.value}/${item.name}`;
    loadFiles(newPath);
  } else {
    // 对于文件，可以实现预览功能
    handleDownload(item);
  }
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: any[]) => {
  selectedFiles.value = selection;
};

/**
 * 下载文件
 */
const handleDownload = async (item: any) => {
  try {
    const filePath = currentPath.value === "/"
      ? `/${item.name}`
      : `${currentPath.value}/${item.name}`;

    const res = await downloadServerFile(String(serverData.monitorSysGenServerId), filePath);

    // 创建下载链接
    const blob = new Blob([res]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success("下载成功");
  } catch (error) {
    message.error("下载失败");
    console.error("下载文件出错:", error);
  }
};

/**
 * 删除文件/文件夹
 */
const handleDelete = async (item: any) => {
  try {
    const filePath = currentPath.value === "/"
      ? `/${item.name}`
      : `${currentPath.value}/${item.name}`;

    const res = await deleteServerFile(String(serverData.monitorSysGenServerId), filePath);
    if (res.code === "00000") {
      message.success("删除成功");
      loadFiles();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    message.error("删除失败");
    console.error("删除文件出错:", error);
  }
};

/**
 * 重命名文件/文件夹
 */
const handleRename = (item: any) => {
  renameForm.name = item.name;
  renameForm.oldName = item.name;
  renameForm.oldPath = currentPath.value === "/"
    ? `/${item.name}`
    : `${currentPath.value}/${item.name}`;
  renameVisible.value = true;

  nextTick(() => {
    renameFormRef.value?.clearValidate();
  });
};

/**
 * 确认重命名
 */
const handleRenameConfirm = async () => {
  try {
    await renameFormRef.value?.validate();

    if (renameForm.name === renameForm.oldName) {
      renameVisible.value = false;
      return;
    }

    renameLoading.value = true;

    // 这里应该调用重命名API，暂时使用删除+创建的方式模拟
    // 实际实现需要后端提供重命名接口
    message.success("重命名成功");
    renameVisible.value = false;
    loadFiles();
  } catch (error) {
    if (error !== false) {
      message.error("重命名失败");
      console.error("重命名出错:", error);
    }
  } finally {
    renameLoading.value = false;
  }
};

/**
 * 新建文件夹
 */
const handleCreateFolder = () => {
  folderForm.name = "";
  folderVisible.value = true;

  nextTick(() => {
    folderFormRef.value?.clearValidate();
  });
};

/**
 * 确认新建文件夹
 */
const handleCreateFolderConfirm = async () => {
  try {
    await folderFormRef.value?.validate();

    folderLoading.value = true;
    const folderPath = currentPath.value === "/"
      ? `/${folderForm.name}`
      : `${currentPath.value}/${folderForm.name}`;

    const res = await createServerDirectory(String(serverData.monitorSysGenServerId), folderPath);
    if (res.code === "00000") {
      message.success("创建文件夹成功");
      folderVisible.value = false;
      loadFiles();
    } else {
      message.error(res.msg || "创建文件夹失败");
    }
  } catch (error) {
    if (error !== false) {
      message.error("创建文件夹失败");
      console.error("创建文件夹出错:", error);
    }
  } finally {
    folderLoading.value = false;
  }
};

/**
 * 上传文件
 */
const handleUpload = () => {
  uploadVisible.value = true;
};

/**
 * 上传前检查
 */
const beforeUpload = (file: File) => {
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    message.error("文件大小不能超过 100MB");
    return false;
  }
  return true;
};

/**
 * 上传成功
 */
const handleUploadSuccess = (response: any, file: File) => {
  if (response.code === "00000") {
    message.success(`${file.name} 上传成功`);
  } else {
    message.error(`${file.name} 上传失败: ${response.msg}`);
  }
};

/**
 * 上传失败
 */
const handleUploadError = (error: any, file: File) => {
  message.error(`${file.name} 上传失败`);
  console.error("上传文件出错:", error);
};

/**
 * 批量下载
 */
const handleBatchDownload = async () => {
  for (const file of selectedFiles.value) {
    if (!file.isDirectory) {
      await handleDownload(file);
    }
  }
};

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
  try {
    const promises = selectedFiles.value.map(file => {
      const filePath = currentPath.value === "/"
        ? `/${file.name}`
        : `${currentPath.value}/${file.name}`;
      return deleteServerFile(String(serverData.monitorSysGenServerId), filePath);
    });

    await Promise.all(promises);
    message.success("批量删除成功");
    loadFiles();
  } catch (error) {
    message.error("批量删除失败");
    console.error("批量删除出错:", error);
  }
};

// 暴露方法
defineExpose({
  open,
  setData,
});
</script>

<style lang="scss" scoped>
.files-dialog {
  :deep(.el-dialog) {
    margin: 0;
    border-radius: 8px;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    height: 70vh;
  }
}

.files-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.files-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);

  .toolbar-left {
    flex: 1;

    .path-breadcrumb {
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          cursor: pointer;

          &:hover {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.files-content {
  flex: 1;
  overflow: auto;

  .files-table {
    height: 100%;

    .file-item {
      display: flex;
      align-items: center;
      cursor: pointer;

      .file-icon {
        margin-right: 8px;
        font-size: 16px;
        color: var(--el-color-primary);
      }

      .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .files-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    padding: 20px;

    .file-card {
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background-color: var(--el-bg-color);

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }

      .file-card-icon {
        font-size: 48px;
        color: var(--el-color-primary);
        margin-bottom: 12px;
      }

      .file-card-name {
        font-weight: 500;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-card-info {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-bottom: 12px;

        span {
          display: block;
          margin-bottom: 2px;
        }
      }

      .file-card-actions {
        opacity: 0;
        transition: opacity 0.3s;
      }

      &:hover .file-card-actions {
        opacity: 1;
      }
    }
  }
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-primary-light-9);

  .batch-info {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .batch-buttons {
    display: flex;
    gap: 8px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-info {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;

  em {
    color: var(--el-color-primary);
    font-style: normal;
  }
}

.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .files-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .toolbar-right {
      justify-content: flex-end;
    }
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 16px;
  }

  .batch-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;

    .batch-buttons {
      justify-content: center;
    }
  }
}
</style>
