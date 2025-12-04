<template>
  <div class="directory-tree">
    <!-- 树形控件头部 -->
    <div class="tree-header">
      <div class="header-title">
        <IconifyIconOnline icon="ri:folder-open-line" class="title-icon" />
        <span>目录结构</span>
      </div>
      <div class="header-actions">
        <el-tooltip content="刷新目录" placement="top">
          <el-button
            size="small"
            circle
            @click="refreshTree"
            :loading="isLoading"
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="展开全部" placement="top">
          <el-button
            size="small"
            circle
            @click="expandAll"
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:add-box-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="收起全部" placement="top">
          <el-button
            size="small"
            circle
            @click="collapseAll"
            class="action-btn"
          >
            <IconifyIconOnline icon="ri:subtract-line" />
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 搜索�?-->
    <div class="tree-search">
      <el-input
        v-model="searchText"
        placeholder="搜索目录..."
        clearable
        size="small"
        class="search-input"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
    </div>

    <!-- 快捷路径 -->
    <div class="quick-paths">
      <div class="quick-paths-title">
        <IconifyIconOnline icon="ri:bookmark-line" class="title-icon" />
        <span>快捷访问</span>
      </div>
      <div class="quick-paths-list">
        <div
          v-for="path in quickPaths"
          :key="path.path"
          class="quick-path-item"
          :class="{ active: currentPath === path.path }"
          @click="selectPath(path.path)"
        >
          <IconifyIconOnline :icon="path.icon" class="path-icon" />
          <span class="path-name">{{ path.name }}</span>
        </div>
      </div>
    </div>

    <!-- 目录�?-->
    <div class="tree-container">
      <el-tree
        ref="treeRef"
        :data="filteredTreeData"
        :props="treeProps"
        :load="loadNode"
        :lazy="true"
        :expand-on-click-node="false"
        :highlight-current="true"
        :current-node-key="currentPath"
        node-key="path"
        class="directory-tree-component"
        @node-click="handleNodeClick"
        @node-expand="handleNodeExpand"
        @node-collapse="handleNodeCollapse"
        @node-contextmenu="handleNodeContextMenu"
      >
        <template #default="{ node, data }">
          <div class="tree-node" :class="{ 'is-current': data.path === currentPath }">
            <div class="node-content">
              <div class="node-icon">
                <IconifyIconOnline
                  :icon="getNodeIcon(data, node.expanded)"
                  class="icon"
                  :class="getNodeIconClass(data)"
                />
              </div>
              <div class="node-label">
                <span class="node-name">{{ data.name }}</span>
                <span v-if="data.childCount > 0" class="node-count">({{ data.childCount }})</span>
              </div>
            </div>
            <div class="node-actions" v-if="showNodeActions">
              <el-tooltip content="新建文件�? placement="top">
                <el-button
                  size="small"
                  circle
                  @click.stop="createFolder(data)"
                  class="node-action-btn"
                >
                  <IconifyIconOnline icon="ri:folder-add-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="刷新" placement="top">
                <el-button
                  size="small"
                  circle
                  @click.stop="refreshNode(node, data)"
                  class="node-action-btn"
                >
                  <IconifyIconOnline icon="ri:refresh-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenuRef"
      trigger="contextmenu"
      :teleported="false"
      class="context-menu"
    >
      <div></div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="openInNewTab">
            <IconifyIconOnline icon="ri:external-link-line" class="menu-icon" />
            在新标签页打开
          </el-dropdown-item>
          <el-dropdown-item @click="createFolderInContext">
            <IconifyIconOnline icon="ri:folder-add-line" class="menu-icon" />
            新建文件�?
          </el-dropdown-item>
          <el-dropdown-item @click="refreshNodeInContext">
            <IconifyIconOnline icon="ri:refresh-line" class="menu-icon" />
            刷新
          </el-dropdown-item>
          <el-dropdown-item divided @click="copyPath">
            <IconifyIconOnline icon="ri:file-copy-line" class="menu-icon" />
            复制路径
          </el-dropdown-item>
          <el-dropdown-item @click="showProperties">
            <IconifyIconOnline icon="ri:information-line" class="menu-icon" />
            属�?
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElTree } from 'element-plus'
import type { ElTreeNode } from 'element-plus/es/components/tree/src/model/node'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

// 目录节点接口
interface DirectoryNode {
  name: string
  path: string
  isDirectory: boolean
  childCount: number
  size?: number
  modifiedTime?: string
  permissions?: string
  children?: DirectoryNode[]
}

// 快捷路径接口
interface QuickPath {
  name: string
  path: string
  icon: string
}

// Props
interface Props {
  currentPath: string
  showNodeActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentPath: '/',
  showNodeActions: true
})

// Emits
const emit = defineEmits<{
  'path-selected': [path: string]
  'folder-create': [parentPath: string]
  'node-refresh': [path: string]
}>()

// 响应式数�?
const treeRef = ref<InstanceType<typeof ElTree>>()
const contextMenuRef = ref()
const isLoading = ref(false)
const searchText = ref('')
const contextMenuNode = ref<DirectoryNode | null>(null)

const treeData = ref<DirectoryNode[]>([])

// 树形控件配置
const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: DirectoryNode) => !data.isDirectory
}

// 快捷路径
const quickPaths = ref<QuickPath[]>([
  { name: '根目�?, path: '/', icon: 'ri:home-line' },
  { name: '文档', path: '/documents', icon: 'ri:file-text-line' },
  { name: '图片', path: '/images', icon: 'ri:image-line' },
  { name: '视频', path: '/videos', icon: 'ri:video-line' },
  { name: '音频', path: '/audio', icon: 'ri:music-line' },
  { name: '下载', path: '/downloads', icon: 'ri:download-line' },
  { name: '桌面', path: '/desktop', icon: 'ri:computer-line' },
  { name: '回收�?, path: '/trash', icon: 'ri:delete-bin-line' }
])

// 计算属�?
const filteredTreeData = computed(() => {
  if (!searchText.value.trim()) {
    return treeData.value
  }
  
  return filterTreeData(treeData.value, searchText.value.toLowerCase())
})

// 方法
const filterTreeData = (data: DirectoryNode[], searchTerm: string): DirectoryNode[] => {
  return data.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm)
    const hasMatchingChildren = node.children && filterTreeData(node.children, searchTerm).length > 0
    
    if (matchesSearch || hasMatchingChildren) {
      if (node.children) {
        node.children = filterTreeData(node.children, searchTerm)
      }
      return true
    }
    
    return false
  })
}

const loadNode = async (node: ElTreeNode, resolve: (data: DirectoryNode[]) => void) => {
  try {
    if (node.level === 0) {
      // 加载根节�?
      const rootData = await loadDirectoryData('/')
      resolve(rootData)
    } else {
      // 加载子节�?
      const nodeData = node.data as DirectoryNode
      const childData = await loadDirectoryData(nodeData.path)
      resolve(childData)
    }
  } catch (error) {
    console.error('加载目录数据失败:', error)
    ElMessage.error('加载目录失败')
    resolve([])
  }
}

const loadDirectoryData = async (path: string): Promise<DirectoryNode[]> => {
  try {
    // 这里应该调用实际的API获取目录数据
    // const response = await getDirectoryData(path)
    // return response.data
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData: DirectoryNode[] = [
      {
        name: 'documents',
        path: path + '/documents',
        isDirectory: true,
        childCount: 5,
        modifiedTime: '2024-01-15 10:30:00'
      },
      {
        name: 'images',
        path: path + '/images',
        isDirectory: true,
        childCount: 12,
        modifiedTime: '2024-01-14 15:20:00'
      },
      {
        name: 'videos',
        path: path + '/videos',
        isDirectory: true,
        childCount: 3,
        modifiedTime: '2024-01-13 09:45:00'
      },
      {
        name: 'projects',
        path: path + '/projects',
        isDirectory: true,
        childCount: 8,
        modifiedTime: '2024-01-12 14:15:00'
      }
    ]
    
    return mockData
  } catch (error) {
    throw new Error('获取目录数据失败')
  }
}

const getNodeIcon = (data: DirectoryNode, expanded: boolean): string => {
  if (!data.isDirectory) {
    return 'ri:file-line'
  }
  
  // 特殊目录图标
  const specialIcons: Record<string, string> = {
    'documents': 'ri:file-text-line',
    'images': 'ri:image-line',
    'videos': 'ri:video-line',
    'audio': 'ri:music-line',
    'downloads': 'ri:download-line',
    'desktop': 'ri:computer-line',
    'trash': 'ri:delete-bin-line',
    'projects': 'ri:code-box-line'
  }
  
  const specialIcon = specialIcons[data.name.toLowerCase()]
  if (specialIcon) {
    return specialIcon
  }
  
  return expanded ? 'ri:folder-open-line' : 'ri:folder-line'
}

const getNodeIconClass = (data: DirectoryNode): string => {
  if (!data.isDirectory) {
    return 'file-icon'
  }
  
  const specialClasses: Record<string, string> = {
    'documents': 'documents-icon',
    'images': 'images-icon',
    'videos': 'videos-icon',
    'audio': 'audio-icon',
    'downloads': 'downloads-icon',
    'desktop': 'desktop-icon',
    'trash': 'trash-icon',
    'projects': 'projects-icon'
  }
  
  return specialClasses[data.name.toLowerCase()] || 'folder-icon'
}

const handleNodeClick = (data: DirectoryNode) => {
  if (data.isDirectory) {
    selectPath(data.path)
  }
}

const handleNodeExpand = (data: DirectoryNode, node: ElTreeNode) => {
  // 节点展开时的处理
}

const handleNodeCollapse = (data: DirectoryNode, node: ElTreeNode) => {
  // 节点收起时的处理
}

const handleNodeContextMenu = (event: MouseEvent, data: DirectoryNode) => {
  event.preventDefault()
  contextMenuNode.value = data
  
  // 显示右键菜单
  nextTick(() => {
    if (contextMenuRef.value) {
      contextMenuRef.value.handleOpen()
    }
  })
}

const selectPath = (path: string) => {
  emit('path-selected', path)
}

const refreshTree = async () => {
  isLoading.value = true
  try {
    // 重新加载整个�?
    const rootData = await loadDirectoryData('/')
    treeData.value = rootData
    
    // 刷新树组�?
    if (treeRef.value) {
      treeRef.value.setData(rootData)
    }
    
    ElMessage.success('目录刷新成功')
  } catch (error) {
    ElMessage.error('刷新目录失败')
  } finally {
    isLoading.value = false
  }
}

const expandAll = () => {
  if (treeRef.value) {
    // 展开所有节�?
    const allNodes = treeRef.value.store.nodesMap
    Object.values(allNodes).forEach((node: any) => {
      if (node.isLeaf === false) {
        node.expand()
      }
    })
  }
}

const collapseAll = () => {
  if (treeRef.value) {
    // 收起所有节�?
    const allNodes = treeRef.value.store.nodesMap
    Object.values(allNodes).forEach((node: any) => {
      if (node.isLeaf === false) {
        node.collapse()
      }
    })
  }
}

const createFolder = (parentData: DirectoryNode) => {
  emit('folder-create', parentData.path)
}

const refreshNode = async (node: ElTreeNode, data: DirectoryNode) => {
  try {
    // 刷新指定节点
    const childData = await loadDirectoryData(data.path)
    node.childNodes = []
    node.loaded = false
    node.expand()
    
    emit('node-refresh', data.path)
    ElMessage.success('节点刷新成功')
  } catch (error) {
    ElMessage.error('刷新节点失败')
  }
}

// 右键菜单操作
const openInNewTab = () => {
  if (contextMenuNode.value) {
    // 在新标签页打开
    window.open(`/file-manager?path=${encodeURIComponent(contextMenuNode.value.path)}`, '_blank')
  }
}

const createFolderInContext = () => {
  if (contextMenuNode.value) {
    createFolder(contextMenuNode.value)
  }
}

const refreshNodeInContext = () => {
  if (contextMenuNode.value && treeRef.value) {
    const node = treeRef.value.getNode(contextMenuNode.value.path)
    if (node) {
      refreshNode(node, contextMenuNode.value)
    }
  }
}

const copyPath = () => {
  if (contextMenuNode.value) {
    navigator.clipboard.writeText(contextMenuNode.value.path).then(() => {
      ElMessage.success('路径已复制到剪贴�?)
    }).catch(() => {
      ElMessage.error('复制路径失败')
    })
  }
}

const showProperties = () => {
  if (contextMenuNode.value) {
    // 显示属性对话框
    ElMessage.info('属性功能开发中...')
  }
}

// 监听当前路径变化
watch(() => props.currentPath, (newPath) => {
  if (treeRef.value) {
    treeRef.value.setCurrentKey(newPath)
  }
})

// 组件挂载
onMounted(() => {
  // 初始化加载根目录
  refreshTree()
})
</script>

<style lang="scss" scoped>
.directory-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
   background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  overflow: hidden;

  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: var(--el-text-color-primary);

    .header-title {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 16px;

      .title-icon {
        margin-right: 8px;
        font-size: 18px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;

      .action-btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: var(--el-text-color-primary);
        width: 32px;
        height: 32px;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  .tree-search {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;

    .search-input {
      .el-input__wrapper {
        border-radius: 20px;
      }
    }
  }

  .quick-paths {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;

    .quick-paths-title {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-weight: 600;
      color: #606266;
      font-size: 14px;

      .title-icon {
        margin-right: 6px;
        color: #409eff;
      }
    }

    .quick-paths-list {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .quick-path-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;

        &:hover {
          background: var(--el-bg-color-overlay);
        }

        &.active {
          background: #e1f3d8;
          color: #67c23a;

          .path-icon {
            color: #67c23a;
          }
        }

        .path-icon {
          margin-right: 8px;
          font-size: 16px;
           color: var(--el-text-color-primary);
        }

        .path-name {
          flex: 1;
        }
      }
    }
  }

  .tree-container {
    flex: 1;
    overflow: auto;
    padding: 8px;

    .directory-tree-component {
      .tree-node {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--el-bg-color-overlay);

          .node-actions {
            opacity: 1;
          }
        }

        &.is-current {
          background: #e1f3d8;
          color: #67c23a;

          .node-icon .icon {
            color: #67c23a;
          }
        }

        .node-content {
          display: flex;
          align-items: center;
          flex: 1;

          .node-icon {
            margin-right: 8px;

            .icon {
              font-size: 18px;
              transition: color 0.2s ease;

              &.folder-icon { color: #ffc107; }
              &.documents-icon { color: #007bff; }
              &.images-icon { color: #28a745; }
              &.videos-icon { color: #dc3545; }
              &.audio-icon { color: #6f42c1; }
              &.downloads-icon { color: #17a2b8; }
              &.desktop-icon { color: #6c757d; }
              &.trash-icon { color: #dc3545; }
              &.projects-icon { color: #20c997; }
              &.file-icon { color: #adb5bd; }
            }
          }

          .node-label {
            display: flex;
            align-items: center;
            gap: 6px;

            .node-name {
              font-weight: 500;
            }

            .node-count {
              font-size: 12px;
               color: var(--el-text-color-primary);
              background: #f0f2f5;
              padding: 2px 6px;
              border-radius: 10px;
            }
          }
        }

        .node-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;

          .node-action-btn {
            width: 24px;
            height: 24px;
            background: rgba(64, 158, 255, 0.1);
            border: 1px solid rgba(64, 158, 255, 0.2);
            color: #409eff;

            &:hover {
              background: rgba(64, 158, 255, 0.2);
              border-color: rgba(64, 158, 255, 0.4);
            }
          }
        }
      }
    }
  }

  .context-menu {
    .menu-icon {
      margin-right: 8px;
    }
  }
}

// 深度选择器修改Element Plus样式
:deep(.el-tree-node__content) {
  padding: 0 !important;
  height: auto !important;
}

:deep(.el-tree-node__expand-icon) {
  padding: 6px;
  color: #c0c4cc;

  &.is-leaf {
    color: transparent;
  }
}

:deep(.el-tree-node__label) {
  font-weight: normal;
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background: transparent;
}

:deep(.el-tree-node__content:hover) {
  background: transparent;
}

// 响应式设�?
@media (max-width: 768px) {
  .directory-tree {
    .tree-header {
      padding: 12px;

      .header-title {
        font-size: 14px;
      }

      .header-actions {
        gap: 4px;

        .action-btn {
          width: 28px;
          height: 28px;
        }
      }
    }

    .tree-search {
      padding: 12px;
    }

    .quick-paths {
      padding: 12px;

      .quick-paths-list {
        .quick-path-item {
          padding: 6px 8px;
          font-size: 13px;

          .path-icon {
            font-size: 14px;
          }
        }
      }
    }

    .tree-container {
      .directory-tree-component {
        .tree-node {
          .node-content {
            .node-icon {
              .icon {
                font-size: 16px;
              }
            }

            .node-label {
              .node-name {
                font-size: 14px;
              }

              .node-count {
                font-size: 11px;
              }
            }
          }

          .node-actions {
            .node-action-btn {
              width: 20px;
              height: 20px;
            }
          }
        }
      }
    }
  }
}
</style>