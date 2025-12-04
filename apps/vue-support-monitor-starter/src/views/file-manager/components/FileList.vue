<template>
  <div class="file-list">
    <!-- 文件列表头部 -->
    <div class="list-header">
      <div class="header-info">
        <div class="path-breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbItems"
              :key="index"
              :to="item.path ? { path: '/file-manager', query: { path: item.path } } : undefined"
              class="breadcrumb-item"
            >
              <IconifyIconOnline :icon="item.icon" class="breadcrumb-icon" />
              {{ item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="selection-info" v-if="selectedFiles.length > 0">
          <span class="selection-count">已选择 {{ selectedFiles.length }} �?/span>
          <el-button size="small" @click="clearSelection" class="clear-btn">
            <IconifyIconOnline icon="ri:close-line" />
            清除选择
          </el-button>
        </div>
      </div>
      
      <div class="header-actions">
        <div class="view-controls">
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="list">
              <IconifyIconOnline icon="ri:list-unordered" />
              列表
            </el-radio-button>
            <el-radio-button label="grid">
              <IconifyIconOnline icon="ri:grid-line" />
              网格
            </el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="sort-controls">
          <el-select v-model="sortBy" size="small" style="width: 120px">
            <el-option label="名称" value="name" />
            <el-option label="大小" value="size" />
            <el-option label="类型" value="type" />
            <el-option label="修改时间" value="modifiedTime" />
          </el-select>
          <el-button
            size="small"
            @click="toggleSortOrder"
            class="sort-order-btn"
          >
            <IconifyIconOnline :icon="sortOrder === 'asc' ? 'ri:sort-asc' : 'ri:sort-desc'" />
          </el-button>
        </div>
        
        <el-button size="small" @click="refreshList" :loading="isLoading">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
      </div>
    </div>

    <!-- 文件列表内容 -->
    <div class="list-content" :class="{ 'grid-view': viewMode === 'grid' }">
      <!-- 加载状�?-->
      <div v-if="isLoading" class="loading-container">
        <el-skeleton :rows="8" animated />
      </div>
      
      <!-- 空状�?-->
      <div v-else-if="filteredFiles.length === 0" class="empty-container">
        <div class="empty-content">
          <IconifyIconOnline icon="ri:folder-open-line" class="empty-icon" />
          <h3>此文件夹为空</h3>
          <p>拖拽文件到此处或点击上传按钮添加文件</p>
          <el-button type="primary" @click="$emit('upload-files')">
            <IconifyIconOnline icon="ri:upload-line" />
            上传文件
          </el-button>
        </div>
      </div>
      
      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" class="list-view">
        <el-table
          :data="filteredFiles"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          @row-dblclick="handleRowDoubleClick"
          @row-contextmenu="handleRowContextMenu"
          class="file-table"
          stripe
          highlight-current-row
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="名称" prop="name" min-width="200">
            <template #default="{ row }">
              <div class="file-name-cell">
                <div class="file-icon">
                  <IconifyIconOnline
                    :icon="getFileIcon(row)"
                    class="icon"
                    :class="getFileIconClass(row)"
                  />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ row.name }}</div>
                  <div class="file-path" v-if="row.isDirectory">{{ row.childCount }} �?/div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="大小" prop="size" width="120" sortable>
            <template #default="{ row }">
              <span v-if="!row.isDirectory">{{ formatFileSize(row.size) }}</span>
              <span v-else class="directory-size">--</span>
            </template>
          </el-table-column>
          
          <el-table-column label="类型" prop="type" width="120">
            <template #default="{ row }">
              <el-tag :type="getFileTypeTagType(row.type)" size="small">
                {{ getFileTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="修改时间" prop="modifiedTime" width="180" sortable>
            <template #default="{ row }">
              {{ formatDate(row.modifiedTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="file-actions">
                <el-tooltip content="预览" placement="top">
                  <el-button
                    size="small"
                    circle
                    @click.stop="previewFile(row)"
                    :disabled="!canPreview(row)"
                  >
                    <IconifyIconOnline icon="ri:eye-line" />
                  </el-button>
                </el-tooltip>
                
                <el-tooltip content="下载" placement="top">
                  <el-button
                    size="small"
                    circle
                    @click.stop="downloadFile(row)"
                    :disabled="row.isDirectory"
                  >
                    <IconifyIconOnline icon="ri:download-line" />
                  </el-button>
                </el-tooltip>
                
                <el-tooltip content="重命�? placement="top">
                  <el-button
                    size="small"
                    circle
                    @click.stop="renameFile(row)"
                  >
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                </el-tooltip>
                
                <el-tooltip content="删除" placement="top">
                  <el-button
                    size="small"
                    circle
                    type="danger"
                    @click.stop="deleteFile(row)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </el-tooltip>
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
            :class="{ 
              'selected': selectedFiles.includes(file),
              'is-directory': file.isDirectory
            }"
            @click="handleCardClick(file, $event)"
            @dblclick="handleCardDoubleClick(file)"
            @contextmenu="handleCardContextMenu(file, $event)"
          >
            <div class="card-selection">
              <el-checkbox
                :model-value="selectedFiles.includes(file)"
                @change="handleCardSelection(file, $event)"
                @click.stop
              />
            </div>
            
            <div class="card-content">
              <div class="file-thumbnail">
                <div v-if="file.isDirectory" class="folder-thumbnail">
                  <IconifyIconOnline icon="ri:folder-fill" class="folder-icon" />
                  <span class="folder-count">{{ file.childCount }}</span>
                </div>
                <div v-else-if="isImageFile(file)" class="image-thumbnail">
                  <img :src="getImageThumbnail(file)" :alt="file.name" @error="handleImageError" />
                </div>
                <div v-else class="file-icon-thumbnail">
                  <IconifyIconOnline
                    :icon="getFileIcon(file)"
                    class="file-icon"
                    :class="getFileIconClass(file)"
                  />
                </div>
              </div>
              
              <div class="file-details">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size" v-if="!file.isDirectory">{{ formatFileSize(file.size) }}</span>
                  <span class="file-type">{{ getFileTypeText(file.type) }}</span>
                </div>
                <div class="file-date">{{ formatDate(file.modifiedTime) }}</div>
              </div>
            </div>
            
            <div class="card-actions">
              <el-dropdown trigger="click" @click.stop>
                <el-button size="small" circle class="more-btn">
                  <IconifyIconOnline icon="ri:more-line" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="previewFile(file)" :disabled="!canPreview(file)">
                      <IconifyIconOnline icon="ri:eye-line" class="menu-icon" />
                      预览
                    </el-dropdown-item>
                    <el-dropdown-item @click="downloadFile(file)" :disabled="file.isDirectory">
                      <IconifyIconOnline icon="ri:download-line" class="menu-icon" />
                      下载
                    </el-dropdown-item>
                    <el-dropdown-item @click="renameFile(file)">
                      <IconifyIconOnline icon="ri:edit-line" class="menu-icon" />
                      重命�?
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteFile(file)">
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

    <!-- 分页 -->
    <div class="list-pagination" v-if="totalFiles > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100, 200]"
        :total="totalFiles"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'

// 文件接口
interface FileItem {
  name: string
  path: string
  type: string
  size: number
  isDirectory: boolean
  modifiedTime: string
  childCount?: number
  thumbnail?: string
}

// 面包屑项接口
interface BreadcrumbItem {
  name: string
  path?: string
  icon: string
}

// Props
interface Props {
  currentPath: string
  files: FileItem[]
  isLoading?: boolean
  searchText?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentPath: '/',
  files: () => [],
  isLoading: false,
  searchText: ''
})

// Emits
const emit = defineEmits<{
  'file-select': [file: FileItem]
  'file-open': [file: FileItem]
  'file-preview': [file: FileItem]
  'file-download': [file: FileItem]
  'file-rename': [file: FileItem]
  'file-delete': [file: FileItem]
  'files-select': [files: FileItem[]]
  'upload-files': []
  'refresh': []
}>()

// 响应式数�?
const viewMode = ref<'list' | 'grid'>('list')
const sortBy = ref('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const selectedFiles = ref<FileItem[]>([])
const currentPage = ref(1)
const pageSize = ref(50)

// 计算属�?
const breadcrumbItems = computed((): BreadcrumbItem[] => {
  const pathParts = props.currentPath.split('/').filter(part => part)
  const items: BreadcrumbItem[] = [
    { name: '根目�?, path: '/', icon: 'ri:home-line' }
  ]
  
  let currentPath = ''
  pathParts.forEach(part => {
    currentPath += '/' + part
    items.push({
      name: part,
      path: currentPath,
      icon: 'ri:folder-line'
    })
  })
  
  return items
})

const filteredFiles = computed(() => {
  let files = [...props.files]
  
  // 搜索过滤
  if (props.searchText) {
    const searchTerm = props.searchText.toLowerCase()
    files = files.filter(file => 
      file.name.toLowerCase().includes(searchTerm)
    )
  }
  
  // 排序
  files.sort((a, b) => {
    // 文件夹优�?
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    
    let aValue: any = a[sortBy.value as keyof FileItem]
    let bValue: any = b[sortBy.value as keyof FileItem]
    
    if (sortBy.value === 'size') {
      aValue = a.isDirectory ? 0 : a.size
      bValue = b.isDirectory ? 0 : b.size
    } else if (sortBy.value === 'modifiedTime') {
      aValue = new Date(a.modifiedTime).getTime()
      bValue = new Date(b.modifiedTime).getTime()
    } else {
      aValue = String(aValue).toLowerCase()
      bValue = String(bValue).toLowerCase()
    }
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return files.slice(start, end)
})

const totalFiles = computed(() => {
  let count = props.files.length
  
  if (props.searchText) {
    const searchTerm = props.searchText.toLowerCase()
    count = props.files.filter(file => 
      file.name.toLowerCase().includes(searchTerm)
    ).length
  }
  
  return count
})

// 方法
const getFileIcon = (file: FileItem): string => {
  if (file.isDirectory) {
    return 'ri:folder-fill'
  }
  
  const iconMap: Record<string, string> = {
    image: 'ri:image-fill',
    video: 'ri:video-fill',
    audio: 'ri:music-fill',
    document: 'ri:file-text-fill',
    pdf: 'ri:file-pdf-fill',
    archive: 'ri:file-zip-fill',
    code: 'ri:code-fill',
    text: 'ri:file-text-line',
    unknown: 'ri:file-line'
  }
  
  return iconMap[file.type] || iconMap.unknown
}

const getFileIconClass = (file: FileItem): string => {
  if (file.isDirectory) {
    return 'folder-icon'
  }
  
  const classMap: Record<string, string> = {
    image: 'image-icon',
    video: 'video-icon',
    audio: 'audio-icon',
    document: 'document-icon',
    pdf: 'pdf-icon',
    archive: 'archive-icon',
    code: 'code-icon',
    text: 'text-icon',
    unknown: 'unknown-icon'
  }
  
  return classMap[file.type] || classMap.unknown
}

const getFileTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    folder: '文件�?,
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    pdf: 'PDF',
    archive: '压缩�?,
    code: '代码',
    text: '文本',
    unknown: '未知'
  }
  
  return typeMap[type] || typeMap.unknown
}

const getFileTypeTagType = (type: string): string => {
  const tagTypeMap: Record<string, string> = {
    folder: '',
    image: 'success',
    video: 'danger',
    audio: 'warning',
    document: 'info',
    pdf: 'danger',
    archive: 'warning',
    code: 'success',
    text: 'info',
    unknown: ''
  }
  
  return tagTypeMap[type] || ''
}

const formatFileSize = (size: number): string => {
  if (size === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(size) / Math.log(k))
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (diffDays < 7) {
    return diffDays + '天前'
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const isImageFile = (file: FileItem): boolean => {
  return file.type === 'image'
}

const getImageThumbnail = (file: FileItem): string => {
  // 这里应该返回实际的缩略图URL
  return file.thumbnail || `/api/files/thumbnail?path=${encodeURIComponent(file.path)}`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  
  // 显示默认图标
  const parent = img.parentElement
  if (parent) {
    parent.innerHTML = '<i class="ri-image-line file-icon image-icon"></i>'
  }
}

const canPreview = (file: FileItem): boolean => {
  const previewableTypes = ['image', 'text', 'pdf', 'video', 'audio']
  return previewableTypes.includes(file.type)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const clearSelection = () => {
  selectedFiles.value = []
  emit('files-select', [])
}

const refreshList = () => {
  emit('refresh')
}

// 事件处理
const handleSelectionChange = (selection: FileItem[]) => {
  selectedFiles.value = selection
  emit('files-select', selection)
}

const handleRowClick = (file: FileItem) => {
  emit('file-select', file)
}

const handleRowDoubleClick = (file: FileItem) => {
  emit('file-open', file)
}

const handleRowContextMenu = (file: FileItem, event: Event) => {
  event.preventDefault()
  // 处理右键菜单
}

const handleCardClick = (file: FileItem, event: MouseEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // Ctrl/Cmd + 点击：切换选择
    const index = selectedFiles.value.indexOf(file)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    } else {
      selectedFiles.value.push(file)
    }
  } else if (event.shiftKey && selectedFiles.value.length > 0) {
    // Shift + 点击：范围选择
    const lastSelected = selectedFiles.value[selectedFiles.value.length - 1]
    const lastIndex = filteredFiles.value.indexOf(lastSelected)
    const currentIndex = filteredFiles.value.indexOf(file)
    
    const start = Math.min(lastIndex, currentIndex)
    const end = Math.max(lastIndex, currentIndex)
    
    selectedFiles.value = filteredFiles.value.slice(start, end + 1)
  } else {
    // 普通点击：单�?
    selectedFiles.value = [file]
  }
  
  emit('files-select', selectedFiles.value)
  emit('file-select', file)
}

const handleCardDoubleClick = (file: FileItem) => {
  emit('file-open', file)
}

const handleCardContextMenu = (file: FileItem, event: MouseEvent) => {
  event.preventDefault()
  // 处理右键菜单
}

const handleCardSelection = (file: FileItem, checked: boolean) => {
  if (checked) {
    if (!selectedFiles.value.includes(file)) {
      selectedFiles.value.push(file)
    }
  } else {
    const index = selectedFiles.value.indexOf(file)
    if (index > -1) {
      selectedFiles.value.splice(index, 1)
    }
  }
  
  emit('files-select', selectedFiles.value)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 文件操作
const previewFile = (file: FileItem) => {
  emit('file-preview', file)
}

const downloadFile = (file: FileItem) => {
  emit('file-download', file)
}

const renameFile = (file: FileItem) => {
  emit('file-rename', file)
}

const deleteFile = async (file: FileItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删�?"${file.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    emit('file-delete', file)
  } catch {
    // 用户取消删除
  }
}

// 监听当前路径变化
watch(() => props.currentPath, () => {
  clearSelection()
  currentPage.value = 1
})

// 监听搜索文本变化
watch(() => props.searchText, () => {
  currentPage.value = 1
})
</script>

<style lang="scss" scoped>
.file-list {
  height: 100%;
  display: flex;
  flex-direction: column;
   background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  overflow: hidden;

  .list-header {
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #e4e7ed;

    .header-info {
      margin-bottom: 12px;

      .path-breadcrumb {
        margin-bottom: 8px;

        .breadcrumb-item {
          .breadcrumb-icon {
            margin-right: 4px;
          }
        }
      }

      .selection-info {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #606266;

        .selection-count {
          padding: 4px 8px;
          background: #e1f3d8;
          color: #67c23a;
          border-radius: 4px;
          font-weight: 500;
        }

        .clear-btn {
          height: 24px;
          padding: 0 8px;
        }
      }
    }

    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      .view-controls {
        .el-radio-group {
          .el-radio-button {
            .el-radio-button__inner {
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }
        }
      }

      .sort-controls {
        display: flex;
        align-items: center;
        gap: 8px;

        .sort-order-btn {
          width: 32px;
          height: 32px;
        }
      }
    }
  }

  .list-content {
    flex: 1;
    overflow: auto;

    .loading-container {
      padding: 20px;
    }

    .empty-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;

      .empty-content {
        text-align: center;
         color: var(--el-text-color-primary);

        .empty-icon {
          font-size: 64px;
          color: #c0c4cc;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 500;
        }

        p {
          margin: 0 0 20px 0;
          font-size: 14px;
        }
      }
    }

    .list-view {
      .file-table {
        .file-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;

          .file-icon {
            .icon {
              font-size: 24px;

              &.folder-icon { color: #ffc107; }
              &.image-icon { color: #28a745; }
              &.video-icon { color: #dc3545; }
              &.audio-icon { color: #6f42c1; }
              &.document-icon { color: #007bff; }
              &.pdf-icon { color: #dc3545; }
              &.archive-icon { color: #fd7e14; }
              &.code-icon { color: #20c997; }
              &.text-icon { color: #6c757d; }
              &.unknown-icon { color: #adb5bd; }
            }
          }

          .file-info {
            flex: 1;
            min-width: 0;

            .file-name {
              font-weight: 500;
              color: var(--el-text-color-primary);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .file-path {
              font-size: 12px;
               color: var(--el-text-color-primary);
            }
          }
        }

        .directory-size {
          color: #c0c4cc;
        }

        .file-actions {
          display: flex;
          gap: 4px;
        }
      }
    }

    .grid-view {
      padding: 20px;

      .file-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;

        .file-card {
          position: relative;
           background: var(--el-bg-color-overlay);
          border: 1px solid #e4e7ed;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
            transform: translateY(-2px);

            .card-actions {
              opacity: 1;
            }
          }

          &.selected {
            border-color: #409eff;
            background: #f0f9ff;
          }

          .card-selection {
            position: absolute;
            top: 8px;
            left: 8px;
            z-index: 2;
          }

          .card-content {
            text-align: center;

            .file-thumbnail {
              margin-bottom: 12px;
              height: 80px;
              display: flex;
              align-items: center;
              justify-content: center;

              .folder-thumbnail {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;

                .folder-icon {
                  font-size: 48px;
                  color: #ffc107;
                }

                .folder-count {
                  position: absolute;
                  bottom: -8px;
                  background: var(--el-bg-color-overlay);
                  color: var(--el-text-color-primary);
                  font-size: 10px;
                  padding: 2px 6px;
                  border-radius: 8px;
                  min-width: 16px;
                }
              }

              .image-thumbnail {
                width: 100%;
                height: 100%;
                border-radius: 8px;
                overflow: hidden;

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
              }

              .file-icon-thumbnail {
                .file-icon {
                  font-size: 48px;

                  &.image-icon { color: #28a745; }
                  &.video-icon { color: #dc3545; }
                  &.audio-icon { color: #6f42c1; }
                  &.document-icon { color: #007bff; }
                  &.pdf-icon { color: #dc3545; }
                  &.archive-icon { color: #fd7e14; }
                  &.code-icon { color: #20c997; }
                  &.text-icon { color: #6c757d; }
                  &.unknown-icon { color: #adb5bd; }
                }
              }
            }

            .file-details {
              .file-name {
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .file-meta {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 4px;
                font-size: 12px;
                 color: var(--el-text-color-primary);

                .file-size {
                  background: #f0f2f5;
                  padding: 2px 6px;
                  border-radius: 4px;
                }

                .file-type {
                  background: #e1f3d8;
                  color: #67c23a;
                  padding: 2px 6px;
                  border-radius: 4px;
                }
              }

              .file-date {
                font-size: 11px;
                color: #c0c4cc;
              }
            }
          }

          .card-actions {
            position: absolute;
            top: 8px;
            right: 8px;
            opacity: 0;
            transition: opacity 0.2s ease;

            .more-btn {
              width: 24px;
              height: 24px;
              background: rgba(255, 255, 255, 0.9);
              border: 1px solid #e4e7ed;

              &:hover {
                 background: var(--el-bg-color-overlay);
                border-color: #409eff;
              }
            }

            .menu-icon {
              margin-right: 8px;
            }
          }
        }
      }
    }
  }

  .list-pagination {
    padding: 16px 20px;
    border-top: 1px solid #e4e7ed;
    background: #fafafa;
    display: flex;
    justify-content: center;
  }
}

// 深度选择器修改Element Plus样式
:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #409eff;
  font-weight: 500;
}

:deep(.el-table__row) {
  cursor: pointer;

  &:hover {
    background: var(--el-bg-color-overlay);
  }
}

// 响应式设�?
@media (max-width: 1200px) {
  .file-list {
    .list-content {
      .grid-view {
        .file-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .file-list {
    .list-header {
      padding: 12px 16px;

      .header-actions {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;

        .sort-controls {
          justify-content: space-between;
        }
      }
    }

    .list-content {
      .grid-view {
        padding: 16px;

        .file-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;

          .file-card {
            padding: 12px;

            .card-content {
              .file-thumbnail {
                height: 60px;

                .folder-thumbnail {
                  .folder-icon {
                    font-size: 36px;
                  }
                }

                .file-icon-thumbnail {
                  .file-icon {
                    font-size: 36px;
                  }
                }
              }
            }
          }
        }
      }
    }

    .list-pagination {
      padding: 12px 16px;
    }
  }
}
</style>