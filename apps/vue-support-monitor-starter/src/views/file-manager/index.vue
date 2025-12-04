<template>
  <div class="file-manager">
    <!-- 页面头部 -->
    <div class="file-manager-header">
      <div class="header-left">
        <h1 class="page-title">
          <IconifyIconOnline icon="ri:folder-open-line" class="title-icon" />
          文件管理器
        </h1>
        <div class="breadcrumb-container">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              :to="index === breadcrumbItems.length - 1 ? undefined : { path: item.path }"
              class="breadcrumb-item"
            >
              <IconifyIconOnline :icon="item.icon" class="breadcrumb-icon" />
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </div>
      <div class="header-right">
        <div class="view-controls">
          <el-tooltip content="列表视图" placement="bottom">
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
              class="view-btn"
            >
              <IconifyIconOnline icon="ri:list-unordered" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="网格视图" placement="bottom">
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
              class="view-btn"
            >
              <IconifyIconOnline icon="ri:grid-line" />
            </el-button>
          </el-tooltip>
        </div>
        <el-button @click="refreshCurrentDirectory" class="action-btn">
          <IconifyIconOnline icon="ri:refresh-line" class="btn-icon" />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="showUploadDialog = true" class="action-btn">
          <IconifyIconOnline icon="ri:upload-cloud-line" class="btn-icon" />
          上传文件
        </el-button>
        <el-button @click="showCreateFolderDialog = true" class="action-btn">
          <IconifyIconOnline icon="ri:folder-add-line" class="btn-icon" />
          新建文件夹
        </el-button>
        <el-divider direction="vertical" />
        <el-button
          :disabled="selectedFiles.length === 0"
          @click="downloadSelected"
          class="action-btn"
        >
          <IconifyIconOnline icon="ri:download-line" class="btn-icon" />
          下载
        </el-button>
        <el-button
          :disabled="selectedFiles.length === 0"
          type="danger"
          @click="deleteSelected"
          class="action-btn"
        >
          <IconifyIconOnline icon="ri:delete-bin-line" class="btn-icon" />
          删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <div class="search-container">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文件和文件夹..."
            clearable
            @input="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
        </div>
        <el-dropdown @command="handleSortChange" class="sort-dropdown">
          <el-button class="action-btn">
            <IconifyIconOnline icon="ri:sort-desc" class="btn-icon" />
            排序
            <IconifyIconOnline icon="ri:arrow-down-s-line" class="dropdown-icon" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="name-asc">
                <IconifyIconOnline icon="ri:sort-asc" class="menu-icon" />
                名称 (A-Z)
              </el-dropdown-item>
              <el-dropdown-item command="name-desc">
                <IconifyIconOnline icon="ri:sort-desc" class="menu-icon" />
                名称 (Z-A)
              </el-dropdown-item>
              <el-dropdown-item command="size-asc">
                <IconifyIconOnline icon="ri:sort-asc" class="menu-icon" />
                大小 (小到大)
              </el-dropdown-item>
              <el-dropdown-item command="size-desc">
                <IconifyIconOnline icon="ri:sort-desc" class="menu-icon" />
                大小 (大到小)
              </el-dropdown-item>
              <el-dropdown-item command="date-asc">
                <IconifyIconOnline icon="ri:sort-asc" class="menu-icon" />
                修改时间 (旧到新)
              </el-dropdown-item>
              <el-dropdown-item command="date-desc">
                <IconifyIconOnline icon="ri:sort-desc" class="menu-icon" />
                修改时间 (新到旧)
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧目录树 -->
      <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3 class="sidebar-title">
            <IconifyIconOnline icon="ri:folder-line" class="sidebar-icon" />
            目录结构
          </h3>
          <el-button
            @click="sidebarCollapsed = !sidebarCollapsed"
            class="collapse-btn"
            size="small"
          >
            <IconifyIconOnline
              :icon="sidebarCollapsed ? 'ri:arrow-right-s-line' : 'ri:arrow-left-s-line'"
            />
          </el-button>
        </div>
        <div class="directory-tree" v-show="!sidebarCollapsed">
          <el-tree
            ref="directoryTreeRef"
            :data="directoryTree"
            :props="treeProps"
            node-key="path"
            :default-expand-all="false"
            :expand-on-click-node="false"
            :highlight-current="true"
            @node-click="handleDirectorySelect"
            @node-expand="handleNodeExpand"
            class="tree-component"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <IconifyIconOnline
                  :icon="data.isDirectory ? 'ri:folder-line' : 'ri:file-line'"
                  class="node-icon"
                />
                <span class="node-label">{{ data.name }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧文件列表 -->
      <div class="content-area">
        <!-- 文件列表头部 -->
        <div class="file-list-header">
          <div class="selection-info">
            <span v-if="selectedFiles.length > 0" class="selection-count">
              已选择 {{ selectedFiles.length }} 个项目
            </span>
            <span v-else class="item-count">
              {{ filteredFiles.length }} 个项目
            </span>
          </div>
          <div class="list-actions">
            <el-button
              v-if="selectedFiles.length > 0"
              @click="clearSelection"
              size="small"
              class="clear-btn"
            >
              取消选择
            </el-button>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="file-list" :class="`view-${viewMode}`">
          <!-- 列表视图 -->
          <div v-if="viewMode === 'list'" class="list-view">
            <el-table
              ref="fileTableRef"
              :data="filteredFiles"
              @selection-change="handleSelectionChange"
              @row-dblclick="handleFileDoubleClick"
              class="file-table"
              empty-text="此文件夹为空"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="名称" min-width="300">
                <template #default="{ row }">
                  <div class="file-name-cell">
                    <IconifyIconOnline
                      :icon="getFileIcon(row)"
                      class="file-icon"
                      :class="getFileIconClass(row)"
                    />
                    <span class="file-name">{{ row.name }}</span>
                    <el-tag v-if="row.isDirectory" size="small" class="dir-tag">
                      文件夹
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="大小" width="120" align="right">
                <template #default="{ row }">
                  <span v-if="!row.isDirectory" class="file-size">
                    {{ formatFileSize(row.size) }}
                  </span>
                  <span v-else class="dir-indicator">--</span>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="120">
                <template #default="{ row }">
                  <span class="file-type">{{ getFileType(row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="修改时间" width="180">
                <template #default="{ row }">
                  <span class="file-date">{{ formatDate(row.lastModified) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <div class="file-actions">
                    <el-button
                      v-if="!row.isDirectory"
                      @click="previewFile(row)"
                      size="small"
                      type="primary"
                      class="action-btn-small"
                    >
                      <IconifyIconOnline icon="ri:eye-line" />
                    </el-button>
                    <el-button
                      @click="downloadFile(row)"
                      size="small"
                      class="action-btn-small"
                    >
                      <IconifyIconOnline icon="ri:download-line" />
                    </el-button>
                    <el-button
                      @click="renameFileValue(row)"
                      size="small"
                      class="action-btn-small"
                    >
                      <IconifyIconOnline icon="ri:edit-line" />
                    </el-button>
                    <el-button
                      @click="deleteFile(row)"
                      size="small"
                      type="danger"
                      class="action-btn-small"
                    >
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 网格视图 -->
          <div v-else class="grid-view">
            <div class="file-grid">
              <div
                v-for="file in filteredFiles"
                :key="file.path"
                class="file-card"
                :class="{ selected: isFileSelected(file) }"
                @click="handleFileClick(file, $event)"
                @dblclick="handleFileDoubleClick(file)"
              >
                <div class="file-card-content">
                  <div class="file-icon-container">
                    <IconifyIconOnline
                      :icon="getFileIcon(file)"
                      class="file-icon-large"
                      :class="getFileIconClass(file)"
                    />
                    <div v-if="isFileSelected(file)" class="selection-overlay">
                      <IconifyIconOnline icon="ri:check-line" class="check-icon" />
                    </div>
                  </div>
                  <div class="file-info">
                    <div class="file-name" :title="file.name">{{ file.name }}</div>
                    <div class="file-meta">
                      <span v-if="!file.isDirectory" class="file-size">
                        {{ formatFileSize(file.size) }}
                      </span>
                      <span v-else class="dir-indicator">文件夹</span>
                    </div>
                  </div>
                </div>
                <div class="file-card-actions">
                  <el-button
                    v-if="!file.isDirectory"
                    @click.stop="previewFile(file)"
                    size="small"
                    type="primary"
                    circle
                    class="card-action-btn"
                  >
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                  <el-button
                    @click.stop="downloadFile(file)"
                    size="small"
                    circle
                    class="card-action-btn"
                  >
                    <IconifyIconOnline icon="ri:download-line" />
                  </el-button>
                  <el-dropdown @command="(command) => handleFileAction(command, file)" trigger="click">
                    <el-button size="small" circle class="card-action-btn">
                      <IconifyIconOnline icon="ri:more-line" />
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="rename">
                          <IconifyIconOnline icon="ri:edit-line" class="menu-icon" />
                          重命名
                        </el-dropdown-item>
                        <el-dropdown-item command="delete" class="danger-item">
                          <IconifyIconOnline icon="ri:delete-bin-line" class="menu-icon" />
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览对话框 -->
    <FilePreviewDialog
      v-model="showPreviewDialog"
      :file="previewFileValue"
      @close="showPreviewDialog = false"
    />

    <!-- 上传文件对话框 -->
    <FileUploadDialog
      v-model="showUploadDialog"
      :current-path="currentPath"
      @upload-success="handleUploadSuccess"
    />

    <!-- 新建文件夹对话框 -->
    <CreateFolderDialog
      v-model="showCreateFolderDialog"
      :current-path="currentPath"
      @folder-created="handleFolderCreated"
    />

    <!-- 重命名对话框 -->
    <RenameDialog
      v-model="showRenameDialog"
      :file="renameFileValue"
      @rename-success="handleRenameSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatBytes } from '@pureadmin/utils'
import dayjs from 'dayjs'

// 组件引入
import FilePreviewDialog from './components/FilePreviewDialog.vue'
import FileUploadDialog from './components/FileUploadDialog.vue'
import CreateFolderDialog from './components/CreateFolderDialog.vue'
import RenameDialog from './components/RenameDialog.vue'

// 类型定义
interface FileItem {
  name: string
  path: string
  size: number
  lastModified: number
  isDirectory: boolean
  extension?: string
  mimeType?: string
}

interface DirectoryNode {
  name: string
  path: string
  isDirectory: boolean
  children?: DirectoryNode[]
}

// 响应式数据
const viewMode = ref<'list' | 'grid'>('list')
const sidebarCollapsed = ref(false)
const currentPath = ref('/')
const searchQuery = ref('')
const selectedFiles = ref<FileItem[]>([])
const files = ref<FileItem[]>([])
const directoryTree = ref<DirectoryNode[]>([])
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 对话框状态
const showPreviewDialog = ref(false)
const showUploadDialog = ref(false)
const showCreateFolderDialog = ref(false)
const showRenameDialog = ref(false)
const previewFileValue = ref<FileItem | null>(null)
const renameFileValue = ref<FileItem | null>(null)

// 引用
const directoryTreeRef = ref()
const fileTableRef = ref()

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: DirectoryNode) => !data.isDirectory
}

// 计算属性
const breadcrumbItems = computed(() => {
  const items = [{ name: '根目录', path: '/', icon: 'ri:home-line' }]
  if (currentPath.value !== '/') {
    const pathParts = currentPath.value.split('/').filter(Boolean)
    let currentPathBuild = ''
    pathParts.forEach(part => {
      currentPathBuild += '/' + part
      items.push({
        name: part,
        path: currentPathBuild,
        icon: 'ri:folder-line'
      })
    })
  }
  return items
})

const filteredFiles = computed(() => {
  let result = [...files.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file => 
      file.name.toLowerCase().includes(query)
    )
  }
  
  // 排序
  result.sort((a, b) => {
    // 文件夹优先
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    
    let comparison = 0
    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'date':
        comparison = a.lastModified - b.lastModified
        break
    }
    
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

// 方法
const loadDirectory = async (path: string) => {
  try {
    // 这里应该调用实际的API
    // const response = await getFileList(path)
    // files.value = response.data
    
    // 模拟数据
    files.value = [
      {
        name: 'documents',
        path: path + '/documents',
        size: 0,
        lastModified: Date.now() - 86400000,
        isDirectory: true
      },
      {
        name: 'image.jpg',
        path: path + '/image.jpg',
        size: 1024000,
        lastModified: Date.now() - 3600000,
        isDirectory: false,
        extension: 'jpg',
        mimeType: 'image/jpeg'
      },
      {
        name: 'document.pdf',
        path: path + '/document.pdf',
        size: 2048000,
        lastModified: Date.now() - 7200000,
        isDirectory: false,
        extension: 'pdf',
        mimeType: 'application/pdf'
      }
    ]
  } catch (error) {
    ElMessage.error('加载目录失败')
    console.error(error)
  }
}

const loadDirectoryTree = async () => {
  try {
    // 这里应该调用实际的API
    // const response = await getDirectoryTree()
    // directoryTree.value = response.data
    
    // 模拟数据
    directoryTree.value = [
      {
        name: '根目录',
        path: '/',
        isDirectory: true,
        children: [
          {
            name: 'documents',
            path: '/documents',
            isDirectory: true,
            children: []
          },
          {
            name: 'images',
            path: '/images',
            isDirectory: true,
            children: []
          }
        ]
      }
    ]
  } catch (error) {
    ElMessage.error('加载目录树失败')
    console.error(error)
  }
}

const refreshCurrentDirectory = () => {
  loadDirectory(currentPath.value)
}

const handleDirectorySelect = (data: DirectoryNode) => {
  if (data.isDirectory) {
    currentPath.value = data.path
    loadDirectory(data.path)
  }
}

const handleNodeExpand = (data: DirectoryNode) => {
  // 懒加载子目录
  if (data.children && data.children.length === 0) {
    // 加载子目录
  }
}

const handleSelectionChange = (selection: FileItem[]) => {
  selectedFiles.value = selection
}

const handleFileClick = (file: FileItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // 多选
    const index = selectedFiles.value.findIndex(f => f.path === file.path)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    } else {
      selectedFiles.value.push(file)
    }
  } else {
    // 单选
    selectedFiles.value = [file]
  }
}

const handleFileDoubleClick = (file: FileItem) => {
  if (file.isDirectory) {
    currentPath.value = file.path
    loadDirectory(file.path)
  } else {
    previewFileValue.value = file
    showPreviewDialog.value = true
  }
}

const isFileSelected = (file: FileItem) => {
  return selectedFiles.value.some(f => f.path === file.path)
}

const clearSelection = () => {
  selectedFiles.value = []
  if (fileTableRef.value) {
    fileTableRef.value.clearSelection()
  }
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleSortChange = (command: string) => {
  const [field, order] = command.split('-')
  sortBy.value = field
  sortOrder.value = order as 'asc' | 'desc'
}

const getFileIcon = (file: FileItem) => {
  if (file.isDirectory) {
    return 'ri:folder-line'
  }
  
  const ext = file.extension?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'ri:image-line'
    case 'pdf':
      return 'ri:file-pdf-line'
    case 'doc':
    case 'docx':
      return 'ri:file-word-line'
    case 'xls':
    case 'xlsx':
      return 'ri:file-excel-line'
    case 'ppt':
    case 'pptx':
      return 'ri:file-ppt-line'
    case 'txt':
    case 'md':
      return 'ri:file-text-line'
    case 'zip':
    case 'rar':
    case '7z':
      return 'ri:file-zip-line'
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'ri:file-music-line'
    case 'mp4':
    case 'avi':
    case 'mkv':
      return 'ri:file-video-line'
    default:
      return 'ri:file-line'
  }
}

const getFileIconClass = (file: FileItem) => {
  if (file.isDirectory) {
    return 'folder-icon'
  }
  
  const ext = file.extension?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'image-icon'
    case 'pdf':
      return 'pdf-icon'
    case 'doc':
    case 'docx':
      return 'word-icon'
    case 'xls':
    case 'xlsx':
      return 'excel-icon'
    case 'ppt':
    case 'pptx':
      return 'ppt-icon'
    default:
      return 'file-icon'
  }
}

const getFileType = (file: FileItem) => {
  if (file.isDirectory) {
    return '文件夹'
  }
  
  const ext = file.extension?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return '图片'
    case 'pdf':
      return 'PDF文档'
    case 'doc':
    case 'docx':
      return 'Word文档'
    case 'xls':
    case 'xlsx':
      return 'Excel表格'
    case 'ppt':
    case 'pptx':
      return 'PowerPoint演示文稿'
    case 'txt':
      return '文本文件'
    case 'md':
      return 'Markdown文档'
    case 'zip':
    case 'rar':
    case '7z':
      return '压缩文件'
    case 'mp3':
    case 'wav':
    case 'flac':
      return '音频文件'
    case 'mp4':
    case 'avi':
    case 'mkv':
      return '视频文件'
    default:
      return file.extension ? `${file.extension.toUpperCase()}文件` : '未知类型'
  }
}

const formatFileSize = (size: number) => {
  return formatBytes(size)
}

const formatDate = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const previewFile = (file: FileItem) => {
  previewFileValue.value = file
  showPreviewDialog.value = true
}

const downloadFile = async (file: FileItem) => {
  try {
    // 这里应该调用实际的下载API
    ElMessage.success(`开始下载 ${file.name}`)
  } catch (error) {
    ElMessage.error('下载失败')
    console.error(error)
  }
}

const downloadSelected = async () => {
  if (selectedFiles.value.length === 0) return
  
  try {
    // 批量下载逻辑
    ElMessage.success(`开始下载 ${selectedFiles.value.length} 个文件`)
  } catch (error) {
    ElMessage.error('批量下载失败')
    console.error(error)
  }
}

const renameFile = (file: FileItem) => {
  renameFileValue.value = file
  showRenameDialog.value = true
}

const deleteFile = async (file: FileItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 "${file.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用实际的删除API
    ElMessage.success('删除成功')
    refreshCurrentDirectory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const deleteSelected = async () => {
  if (selectedFiles.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个项目吗？`,
      '确认批量删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用实际的批量删除API
    ElMessage.success('批量删除成功')
    selectedFiles.value = []
    refreshCurrentDirectory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }
}

const handleFileAction = (command: string, file: FileItem) => {
  switch (command) {
    case 'rename':
      renameFileValue(file)
      break
    case 'delete':
      deleteFile(file)
      break
  }
}

const handleUploadSuccess = () => {
  showUploadDialog.value = false
  refreshCurrentDirectory()
  ElMessage.success('文件上传成功')
}

const handleFolderCreated = () => {
  showCreateFolderDialog.value = false
  refreshCurrentDirectory()
  loadDirectoryTree()
  ElMessage.success('文件夹创建成功')
}

const handleRenameSuccess = () => {
  showRenameDialog.value = false
  refreshCurrentDirectory()
  ElMessage.success('重命名成功')
}

// 监听路径变化
watch(currentPath, (newPath) => {
  loadDirectory(newPath)
})

// 组件挂载
onMounted(() => {
  loadDirectory(currentPath.value)
  loadDirectoryTree()
})
</script>

<style lang="scss" scoped>
.file-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;

  .file-manager-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .page-title {
        display: flex;
        align-items: center;
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #2c3e50;

        .title-icon {
          margin-right: 12px;
          font-size: 28px;
          color: #3498db;
        }
      }

      .breadcrumb-container {
        .breadcrumb-item {
          .breadcrumb-icon {
            margin-right: 4px;
          }
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .view-controls {
        display: flex;
        gap: 4px;
        padding: 4px;
        background: var(--el-bg-color-overlay);
        border-radius: 8px;

        .view-btn {
          border: none;
          background: transparent;
          
          &.el-button--primary {
            background: #3498db;
            color: var(--el-text-color-primary);
          }
        }
      }

      .action-btn {
        .btn-icon {
          margin-right: 6px;
        }
      }
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .action-btn {
        .btn-icon {
          margin-right: 6px;
        }
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-container {
        .search-input {
          width: 300px;
        }
      }

      .sort-dropdown {
        .action-btn {
          .btn-icon {
            margin-right: 6px;
          }

          .dropdown-icon {
            margin-left: 6px;
          }
        }
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;

    .sidebar {
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      border-right: 1px solid rgba(0, 0, 0, 0.1);
      transition: width 0.3s ease;

      &.collapsed {
        width: 60px;
      }

      .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);

        .sidebar-title {
          display: flex;
          align-items: center;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;

          .sidebar-icon {
            margin-right: 8px;
            color: #3498db;
          }
        }

        .collapse-btn {
          border: none;
          background: transparent;
        }
      }

      .directory-tree {
        padding: 16px;
        height: calc(100% - 60px);
        overflow-y: auto;

        .tree-component {
          .tree-node {
            display: flex;
            align-items: center;

            .node-icon {
              margin-right: 8px;
              color: #3498db;
            }

            .node-label {
              font-size: 14px;
              color: #2c3e50;
            }
          }
        }
      }
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.9);
      overflow: hidden;

      .file-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);

        .selection-info {
          .selection-count {
            color: #3498db;
            font-weight: 600;
          }

          .item-count {
            color: #7f8c8d;
          }
        }

        .list-actions {
          .clear-btn {
            color: #e74c3c;
          }
        }
      }

      .file-list {
        flex: 1;
        overflow: hidden;

        &.view-list {
          .list-view {
            height: 100%;
            overflow-y: auto;

            .file-table {
              .file-name-cell {
                display: flex;
                align-items: center;

                .file-icon {
                  margin-right: 12px;
                  font-size: 20px;

                  &.folder-icon {
                    color: #f39c12;
                  }

                  &.image-icon {
                    color: #e74c3c;
                  }

                  &.pdf-icon {
                    color: #e74c3c;
                  }

                  &.word-icon {
                    color: #3498db;
                  }

                  &.excel-icon {
                    color: #27ae60;
                  }

                  &.ppt-icon {
                    color: #e67e22;
                  }

                  &.file-icon {
                    color: #95a5a6;
                  }
                }

                .file-name {
                  font-weight: 500;
                  color: #2c3e50;
                }

                .dir-tag {
                  margin-left: 8px;
                  background: #ecf0f1;
                  color: #7f8c8d;
                  border: none;
                }
              }

              .file-size {
                color: #7f8c8d;
                font-size: 13px;
              }

              .dir-indicator {
                color: #bdc3c7;
                font-size: 13px;
              }

              .file-type {
                color: #7f8c8d;
                font-size: 13px;
              }

              .file-date {
                color: #7f8c8d;
                font-size: 13px;
              }

              .file-actions {
                display: flex;
                gap: 4px;

                .action-btn-small {
                  padding: 4px 8px;
                  font-size: 12px;
                }
              }
            }
          }
        }

        &.view-grid {
          .grid-view {
            height: 100%;
            overflow-y: auto;
            padding: 24px;

            .file-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 20px;

              .file-card {
                position: relative;
                background: var(--el-bg-color-overlay);
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;

                &:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                }

                &.selected {
                  border: 2px solid #3498db;
                  background: var(--el-bg-color-overlay);
                }

                .file-card-content {
                  .file-icon-container {
                    position: relative;
                    text-align: center;
                    margin-bottom: 12px;

                    .file-icon-large {
                      font-size: 48px;

                      &.folder-icon {
                        color: #f39c12;
                      }

                      &.image-icon {
                        color: #e74c3c;
                      }

                      &.pdf-icon {
                        color: #e74c3c;
                      }

                      &.word-icon {
                        color: #3498db;
                      }

                      &.excel-icon {
                        color: #27ae60;
                      }

                      &.ppt-icon {
                        color: #e67e22;
                      }

                      &.file-icon {
                        color: #95a5a6;
                      }
                    }

                    .selection-overlay {
                      position: absolute;
                      top: 0;
                      right: 0;
                      width: 24px;
                      height: 24px;
                      background: #3498db;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;

                      .check-icon {
                        color: var(--el-text-color-primary);
                        font-size: 14px;
                      }
                    }
                  }

                  .file-info {
                    text-align: center;

                    .file-name {
                      font-weight: 500;
                      color: #2c3e50;
                      margin-bottom: 4px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                    }

                    .file-meta {
                      .file-size {
                        color: #7f8c8d;
                        font-size: 12px;
                      }

                      .dir-indicator {
                        color: #7f8c8d;
                        font-size: 12px;
                      }
                    }
                  }
                }

                .file-card-actions {
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  display: flex;
                  gap: 4px;
                  opacity: 0;
                  transition: opacity 0.3s ease;

                  .card-action-btn {
                    width: 28px;
                    height: 28px;
                    padding: 0;
                    font-size: 12px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(5px);
                  }
                }

                &:hover .file-card-actions {
                  opacity: 1;
                }
              }
            }
          }
        }
      }
    }
  }
}

// 下拉菜单样式
.el-dropdown-menu {
  .menu-icon {
    margin-right: 8px;
  }

  .danger-item {
    color: #e74c3c;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .file-manager {
    .file-manager-header {
      flex-direction: column;
      gap: 16px;
      padding: 16px;

      .header-left {
        width: 100%;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
      }
    }

    .toolbar {
      flex-direction: column;
      gap: 16px;
      padding: 16px;

      .toolbar-left,
      .toolbar-right {
        width: 100%;
        justify-content: center;
      }

      .search-container {
        .search-input {
          width: 100%;
        }
      }
    }

    .main-content {
      .sidebar {
        position: absolute;
        z-index: 1000;
        height: 100%;
        
        &.collapsed {
          width: 0;
          overflow: hidden;
        }
      }

      .content-area {
        .file-list {
          &.view-grid {
            .grid-view {
              padding: 16px;

              .file-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 16px;
              }
            }
          }
        }
      }
    }
  }
}
</style>