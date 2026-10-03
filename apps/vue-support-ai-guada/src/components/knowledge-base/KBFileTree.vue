<!-- KnowledgeBasePage/KBFileTree.vue -->
<template>
  <div class="pt-0">
    <!-- 面包屑导航-->
    <div v-if="breadcrumbPath.length > 0" class="mb-2 mx-2 py-1.5">
      <div class="flex items-center gap-1 text-sm">
        <button @click="navigateToFolderByPath(null)"
          class="text-[var(--rm-text-secondary)] hover:text-[var(--rm-primary)] transition-colors cursor-pointer">
          {{ t('knowledge.tree.root') }}
        </button>

        <!-- 路径分隔符和各级文件夹-->
        <template v-for="(folder, index) in breadcrumbPath" :key="folder.path">
          <span class="text-[var(--rm-text-disabled)] mx-0.5">></span>
          <button v-if="index !== breadcrumbPath.length - 1" @click="navigateToFolderByPath(folder.path)"
            class="transition-colors cursor-pointer text-[var(--rm-text-secondary)] hover:text-[var(--rm-primary)]">
            {{ folder.displayName }}
          </button>
          <span v-else class="text-[var(--rm-text)] font-semibold">
            {{ folder.displayName }}
          </span>
        </template>
      </div>
    </div>

    <!-- 文件/文件夹列表-->
    <div v-if="isLoading" class="text-center py-8">
      <el-icon class="animate-spin text-[var(--rm-primary)]" size="32">
        <Loading />
      </el-icon>
      <p class="mt-2 text-sm text-[var(--rm-text-secondary)]">{{ t('knowledge.tree.loading') }}</p>
    </div>

    <div v-else-if="visibleItems.length > 0" class="@container">
      <!-- 表头。
           左栏在「文档 + 智能问答」双栏里只有 ~430px 宽，五列固定宽（90+80+120+160）
           加 4 个 16px 间距需要 514px，会把 1fr 的名称列压成 0 宽 —— 文件名完全看不见。
           这里改成按容器宽度自适应：窄时只留「名称 + 状态」，宽了再逐级放出类型/大小/时间。 -->
      <div
        class="grid gap-2 px-3 py-2 border-b border-[var(--rm-border-light)] text-xs font-medium text-[var(--rm-text-secondary)] grid-cols-[minmax(0,1fr)_72px] @[520px]:grid-cols-[minmax(0,1fr)_72px_52px] @[720px]:gap-4 @[720px]:px-4 @[720px]:grid-cols-[minmax(0,1fr)_72px_52px_72px_104px]">
        <div>{{ t('knowledge.tree.colName') }}</div>
        <div>{{ t('knowledge.tree.colStatus') }}</div>
        <div class="hidden @[520px]:block">{{ t('knowledge.tree.colType') }}</div>
        <div class="hidden @[720px]:block">{{ t('knowledge.tree.colSize') }}</div>
        <div class="hidden @[720px]:block">{{ t('knowledge.tree.colModified') }}</div>
      </div>

      <!-- 文件列表 -->
      <div v-for="item in visibleItems" :key="item.id"
        class="file-row grid gap-2 px-3 py-2.5 hover:bg-[var(--rm-bg-subtle)] cursor-pointer transition-colors border-b border-[var(--rm-border-light)] last:border-b-0 grid-cols-[minmax(0,1fr)_72px] @[520px]:grid-cols-[minmax(0,1fr)_72px_52px] @[720px]:gap-4 @[720px]:px-4 @[720px]:grid-cols-[minmax(0,1fr)_72px_52px_72px_104px]"
        @click="handleItemClick(item)" @contextmenu.prevent="handleContextMenu($event, item)">
        <!-- 名称-->
        <div class="flex items-center gap-2 min-w-0">
          <!-- 文件图标 -->
          <el-icon v-if="item.isDirectory" class="text-[var(--rm-warning)] shrink-0" size="18">
            <Folder />
          </el-icon>
          <img v-else :src="getFileIcon(item)" class="w-5 h-5 object-contain shrink-0" alt="file icon" />

          <!-- 名称 -->
          <span class="text-sm text-[var(--rm-text)] truncate" :title="item.displayName">
            {{ item.displayName }}
          </span>
        </div>

        <!-- 状态列 -->
        <div class="flex items-center min-w-0">
          <template v-if="!item.isDirectory">
            <!-- 处理中或等待处理时显示进度百分比 -->
            <LTooltip v-if="(item.processingStatus === 'processing' || item.processingStatus === 'pending') && item.currentStep" 
              :content="item.currentStep" 
              placement="top">
              <el-tag :type="getStatusType(item.processingStatus)" class="truncate max-w-full">
                {{ getStatusDisplayText(item) }}
              </el-tag>
            </LTooltip>
            <!-- 其他状态直接显示 -->
            <el-tag v-else :type="getStatusType(item.processingStatus)">
              {{ getStatusDisplayText(item) }}
            </el-tag>
          </template>
          <span v-else class="text-xs text-[var(--rm-text-disabled)]">-</span>
        </div>

        <!-- 类型-->
        <div class="hidden @[520px]:flex items-center">
          <span class="text-xs text-[var(--rm-text-secondary)]">
            {{ item.isDirectory ? t('knowledge.tree.folder') : (item.fileExtension?.toUpperCase() || '-') }}
          </span>
        </div>

        <!-- 大小-->
        <div class="hidden @[720px]:flex items-center">
          <span v-if="!item.isDirectory" class="text-xs text-[var(--rm-text-secondary)]">
            {{ formatSize(item.fileSize) }}
          </span>
          <span v-else class="text-xs text-[var(--rm-text-disabled)]">-</span>
        </div>

        <!-- 修改时间-->
        <div class="hidden @[720px]:flex items-center">
          <span class="text-xs text-[var(--rm-text-secondary)]">
            {{ formatDate(item.uploadedAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 空文件夹-->
    <div v-else class="text-center py-8 text-[var(--rm-text-secondary)]">
      <p>{{ currentRelativePath ? t('knowledge.tree.folderEmpty') : t('knowledge.tree.empty') }}</p>
    </div>

    <!-- 加载更多指示器 -->
    <div v-if="isLoadingMore" class="text-center py-4">
      <el-icon class="animate-spin text-[var(--rm-primary)]" size="24">
        <Loading />
      </el-icon>
      <p class="mt-2 text-sm text-[var(--rm-text-secondary)]">{{ t('knowledge.tree.loadingMore') }}</p>
    </div>

    <!-- 没有更多数据提示 -->
    <div v-else-if="!hasMore && visibleItems.length > 0" class="text-center py-3 text-[var(--rm-text-disabled)] text-sm">
      <p>{{ t('knowledge.tree.allLoaded') }}</p>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :items="contextMenuItems"
        @close="closeContextMenu"
    />

    <!-- 重命名对话框 -->
    <LDialog v-model="showRenameDialog" :title="t('knowledge.tree.renameTitle')" width="400px" :close-on-click-modal="false" append-to-body>
      <el-input v-model="renameForm.newName" :placeholder="t('knowledge.tree.newNamePlaceholder')" @keyup.enter="confirmRename" />
      <template #footer>
        <ReButton @click="showRenameDialog = false">{{ t('common.cancel') }}</ReButton>
        <ReButton type="primary" @click="confirmRename" :loading="renameLoading">{{ t('common.ok') }}</ReButton>
      </template>
    </LDialog>

    <!-- 移动对话框 -->
    <LDialog v-model="showMoveDialog" :title="t('knowledge.tree.moveTitle')" width="500px" :close-on-click-modal="false" append-to-body>
      <div class="max-h-80 overflow-y-auto">
        <!-- 根目录选项 -->
        <div class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--rm-bg-subtle)] rounded"
          :class="{ 'bg-[var(--rm-primary-light-9)]': selectedTargetFolderId === null }" @click="selectRootDirectory">
          <el-icon>
            <Folder />
          </el-icon>
          <span>{{ t('knowledge.tree.rootDir') }}</span>
        </div>

        <!-- 文件夹树 -->
        <el-tree :data="folderTreeData" :props="{ label: 'displayName', children: 'children' }" node-key="id"
          highlight-current @node-click="selectTargetFolder" class="mt-2">
          <template #default="{ node, data }">
            <span class="flex items-center gap-2">
              <el-icon>
                <Folder />
              </el-icon>
              {{ node.label }}
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <ReButton @click="showMoveDialog = false">{{ t('common.cancel') }}</ReButton>
        <ReButton type="primary" @click="confirmMove" :loading="moveLoading">{{ t('common.ok') }}</ReButton>
      </template>
    </LDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Folder, View, RefreshRight, Delete, Loading, Edit, Position } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { KBFile } from '@/stores/knowledgeBase'
import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'
import { apiService } from '@/services/ApiService'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'
import LTooltip from '@/components/ui/LTooltip.vue'
import LDialog from '@/components/ui/LDialog.vue'
import ReButton from '@/components/re/ReButton.vue'

// 导入文件图标
import fileCodeIcon from '@/assets/file_code.svg'
import fileTxtIcon from '@/assets/file_txt.svg'
import fileWordIcon from '@/assets/file_word.svg'
import fileExcelIcon from '@/assets/file_excel.svg'
import filePptIcon from '@/assets/file_ppt.svg'
import filePdfIcon from '@/assets/file_zip.svg'

interface Props {
  kbId: string  // 知识库ID
  readonly?: boolean  // 只读模式（他人公开库）：不弹写操作菜单
  /**
   * 处理状态分栏过滤：all / indexed / parsing / failed。
   *
   * <p>父组件的「全部 / 已索引 / 解析中 / 失败」按钮改这个值来过滤列表。
   * 目录条目没有处理状态，因此<b>任何分栏下都保留</b>——否则选了「已索引」
   * 就没法进子目录去找未索引的文件了。</p>
   */
  statusFilter?: string
}

/** 状态分栏 → processingStatus 集合。indexed=已建索引，parsing=处理中，failed=失败。 */
const STATUS_GROUPS: Record<string, string[]> = {
  indexed: ['completed'],
  parsing: ['queued', 'uploading', 'uploaded', 'pending', 'processing'],
  failed: ['failed'],
}

const props = withDefaults(defineProps<Props>(), { readonly: false, statusFilter: 'all' })

const { t } = useI18n()

const emit = defineEmits<{
  view: [file: KBFile]
  retry: [file: KBFile]
  delete: [file: KBFile]
  folderChange: [folderPath: string | null]  // 目录切换事件
  filesLoaded: [files: KBFile[]]  // 文件加载完成事件
}>()

const kbStore = useKnowledgeBaseStore()

/**
 * 当前所在的文件夹ID (null表示根目录)
 */
/**
 * 当前相对路径（核心状态，替代 currentFolderId）
 */
const currentRelativePath = ref<string | null>(null)

/**
 * 当前目录下的文件和文件夹(懒加载)
 */
const currentItems = ref<KBFile[]>([])

/**
 * 按 statusFilter 过滤后的实际渲染列表。
 *
 * <p>「全部」或没有匹配状态时返回原数组本身（同一引用），避免无谓的深拷贝与重渲染。
 * 目录恒保留——它没有 processingStatus，滤掉会让人进不去子目录。</p>
 */
const visibleItems = computed<KBFile[]>(() => {
  const group = STATUS_GROUPS[props.statusFilter || 'all']
  if (!group) {
    return currentItems.value
  }
  return currentItems.value.filter((item) => item.isDirectory || group.includes(item.processingStatus))
})

/**
 * 加载状态
 */
const isLoading = ref(false)

/**
 * 无限滚动相关状态
 */
const currentPage = ref(0) // 当前页码（从0开始）
const pageSize = ref(50) // 每页数量
const hasMore = ref(true) // 是否还有更多数据
const isLoadingMore = ref(false) // 是否正在加载更多

/**
 * 面包屑路径（使用路径而非ID）
 */
const breadcrumbPath = ref<Array<{ path: string; displayName: string }>>([])

/**
 * 右键菜单状态
 */
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  item: null as KBFile | null
})

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const items: ContextMenuItem[] = [
    {
      label: t('knowledge.tree.rename'),
      icon: Edit,
      onClick: handleRenameFromMenu,
    },
    {
      label: t('knowledge.tree.moveTo'),
      icon: Position,
      onClick: handleMoveFromMenu,
    },
  ];
  if (contextMenu.value.item && !contextMenu.value.item.isDirectory) {
    items.push({
      label: t('knowledge.tree.retry'),
      icon: RefreshRight,
      onClick: handleRetryFromMenu,
    });
  }
  items.push({
    label: t('common.delete'),
    icon: Delete,
    onClick: handleDeleteFromMenu,
  });
  return items;
});

/**
 * 重命名表单状态
 */
const showRenameDialog = ref(false)
const renameForm = ref({ newName: '' })
const renameLoading = ref(false)
const renamingFileId = ref<string | null>(null) // 保存正在重命名的文件ID

/**
 * 移动对话框状态
 */
const showMoveDialog = ref(false)
const selectedTargetFolderId = ref<string | null>(null)
const folderTreeData = ref<any[]>([])
const moveLoading = ref(false)
const movingFileId = ref<string | null>(null) // 保存正在移动的文件ID

/**
 * 文件处理轮询相关状态
 */
const POLL_INTERVAL = 3000 // 3 秒轮询间隔
let pollingTimer: ReturnType<typeof setTimeout> | null = null
let pollingFileIds = new Set<string>()

/**
 * 加载指定路径的文件夹内容
 * @param relativePath 相对路径
 * @param isLoadMore 是否为加载更多（追加模式）
 */
async function loadFolderContents(relativePath: string | null, isLoadMore: boolean = false) {
  if (isLoadMore) {
    isLoadingMore.value = true
  } else {
    isLoading.value = true
    // 重置分页状态
    currentPage.value = 0
    hasMore.value = true
  }

  try {
    const skip = currentPage.value * pageSize.value

    // 直接使用路径查询接口
    const response = await apiService.fetchKBFilesByPath(
      props.kbId,
      relativePath,
      skip,
      pageSize.value
    )

    const newItems = (response.items || []).map((file: any) => ({
      id: file.id,
      fileId: file.id,
      knowledgeBaseId: file.knowledgeBaseId,
      fileName: file.fileName,
      displayName: file.displayName,
      fileSize: file.fileSize,
      fileType: file.fileType,
      fileExtension: file.fileExtension,
      contentHash: file.contentHash,
      relativePath: file.relativePath,
      parentFolderId: file.parentFolderId,
      isDirectory: file.isDirectory,
      processingStatus: file.processingStatus,
      progressPercentage: file.progressPercentage,
      currentStep: file.currentStep,
      errorMessage: file.errorMessage,
      uploadedAt: file.uploadedAt,
      processedAt: file.processedAt,
      totalChunks: file.totalChunks,
      totalTokens: file.totalTokens,
      isTempTask: false
    }))

    // 判断是否还有更多数据
    hasMore.value = newItems.length === pageSize.value

    if (isLoadMore) {
      // 追加模式：将新数据添加到现有列表
      currentItems.value.push(...newItems)
    } else {
      // 初始加载模式：替换整个列表
      currentItems.value = newItems
    }

    // 更新面包屑路径（直接从 relativePath 解析）
    updateBreadcrumbPathFromRelativePath(relativePath)

    // 关键修复:数据加载完成后,通知父组件
    emit('filesLoaded', currentItems.value)
    console.log(`[DEBUG] KBFileTree 文件加载完成,共 ${currentItems.value.length} 个文件`)

    // 关键优化:数据加载完成后,自动启动轮询
    await startFileProcessingPolling()

  } catch (error) {
    console.error('加载文件夹内容失败', error)
    if (!isLoadMore) {
      currentItems.value = []
    }
    // 即使出错也通知父组件
    emit('filesLoaded', currentItems.value)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

/**
 * 从 relativePath 直接解析面包屑路径（同步方法，无需API调用）
 */
function updateBreadcrumbPathFromRelativePath(relativePath: string | null) {
  if (!relativePath) {
    breadcrumbPath.value = []
    return
  }

  // 从 relativePath 解析出每一级目录
  // 例如: "docs/api/guide" → [
  //   { path: "docs", displayName: "docs" },
  //   { path: "docs/api", displayName: "api" },
  //   { path: "docs/api/guide", displayName: "guide" }
  // ]
  const pathParts = relativePath.split('/')
  const path: Array<{ path: string; displayName: string }> = []

  let accumulatedPath = ''
  for (let i = 0; i < pathParts.length; i++) {
    const partName = pathParts[i]
    accumulatedPath = accumulatedPath ? `${accumulatedPath}/${partName}` : partName

    path.push({
      path: accumulatedPath,
      displayName: partName
    })
  }

  breadcrumbPath.value = path
}

/**
 * 启动文件处理轮询（组件内部管理）
 */
async function startFileProcessingPolling() {
  // 筛选出 processing/pending 状态的文件
  const processingFiles = currentItems.value.filter(file =>
    file.processingStatus === 'processing' || file.processingStatus === 'pending'
  )

  if (processingFiles.length === 0) {
    console.log('[DEBUG] KBFileTree: 没有需要轮询的文件')
    stopFileProcessingPolling()
    return
  }

  // 关键优化:如果是追加加载,需要将新文件的 ID 添加到现有轮询列表
  // 而不是完全停止并重启轮询
  const newProcessingFileIds = processingFiles
    .filter(file => !pollingFileIds.has(file.id))
    .map(file => file.id)

  if (newProcessingFileIds.length > 0) {
    console.log(`[DEBUG] KBFileTree: 发现 ${newProcessingFileIds.length} 个新文件需要轮询`)
    newProcessingFileIds.forEach(fileId => pollingFileIds.add(fileId))
  }

  // 如果轮询定时器不存在，则启动新的轮询
  if (!pollingTimer && pollingFileIds.size > 0) {
    console.log(`[DEBUG] KBFileTree: 开始轮询 ${pollingFileIds.size} 个文件`)

    const poll = async () => {
      try {

        // 批量获取文件状态
        const responses = await apiService.batchGetFileProcessingStatus(
          props.kbId,
          Array.from(pollingFileIds)
        )

        console.log(`[DEBUG] KBFileTree: 轮询收到 ${responses.length} 个文件的状态更新`)

        // 遍历结果并更新本地状态
        responses.forEach((response: any) => {
          // 更新本地文件状态
          updateFileStatus(response.id, {
            processingStatus: response.processingStatus,
            progressPercentage: response.progressPercentage || 0,
            currentStep: response.currentStep || null,
            errorMessage: response.errorMessage || null,
            totalChunks: response.totalChunks || 0,
            totalTokens: response.totalTokens || 0
          })

          // 如果文件处理完成或失败，从轮询列表中移除
          if (response.processingStatus === 'completed' ||
            response.processingStatus === 'failed') {
            console.log(`[DEBUG] KBFileTree: 文件 ${response.id} 处理${response.processingStatus === 'completed' ? '完成' : '失败'},停止轮询`)
            pollingFileIds.delete(response.id)
          }
        })

        // 如果所有文件都处理完成，停止轮询
        if (pollingFileIds.size === 0) {
          console.log('[DEBUG] KBFileTree: 所有文件处理完成,停止轮询')
          stopFileProcessingPolling()
        }
      } catch (error) {
        console.error(`[DEBUG] KBFileTree: 批量轮询文件状态失败:`, error)
        // 出错时不停止轮询，继续尝试
      }
    }

    // 立即执行一次
    await poll()

    // 定时轮询
    pollingTimer = setInterval(poll, POLL_INTERVAL)
  } else {
    console.log(`[DEBUG] KBFileTree: 轮询已在运行,当前监控 ${pollingFileIds.size} 个文件`)
  }
}

/**
 * 停止文件处理轮询
 */
function stopFileProcessingPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
    console.log('[DEBUG] KBFileTree: 停止轮询')
  }
  pollingFileIds.clear()
}

/**
 * 导航到指定文件夹（通过路径）
 */
function navigateToFolderByPath(relativePath: string | null) {
  // 直接设置路径，watch 会自动触发 loadFolderContents
  currentRelativePath.value = relativePath
}

/**
 * 处理项目点击
 */
function handleItemClick(item: KBFile) {
  if (item.isDirectory) {
    // 文件夹: 导航到该路径
    currentRelativePath.value = item.relativePath || null
    return
  }
  // 文件: 一律触发预览。
  // 原来这里要求 completed||failed 才 emit('view')，而 api 层又把状态硬编码成 'uploaded'，
  // 两个条件互斥 → 预览永远打不开（用户报的「文件无法预览」就是这个）。
  // 原文预览只依赖「文件存在且是文本」，与是否已建索引无关，所以不设门禁。
  emit('view', item)
}

/**
 * 监听当前文件夹
 */
// 监听当前路径变化，自动加载内容
watch(currentRelativePath, async (newPath) => {
  await loadFolderContents(newPath)
  // 关键修复:通知父组件目录已切换,需要重新轮询
  emit('folderChange', newPath)
}, { immediate: true })

/**
 * 加载更多文件（无限滚动触发）
 */
async function loadMoreFiles() {
  // 如果没有更多数据或正在加载，则不执行
  if (!hasMore.value || isLoadingMore.value || isLoading.value) {
    return
  }

  console.log('[DEBUG] KBFileTree: 加载更多文件')

  // 增加页码
  currentPage.value++

  // 加载下一页数据（追加模式）
  await loadFolderContents(currentRelativePath.value, true)
}

/**
 * 强制重新加载当前目录
 */
async function forceReload() {
  console.log('[DEBUG] KBFileTree 强制重新加载当前目录')
  await loadFolderContents(currentRelativePath.value, false)
}

/**
 * 从本地列表中移除文件（供父组件调用）
 */
function removeFileLocally(fileId: string) {
  const index = currentItems.value.findIndex(item => item.id === fileId)
  if (index !== -1) {
    currentItems.value.splice(index, 1)
    // 关键修复:同时从轮询列表中移除
    pollingFileIds.delete(fileId)
    console.log(`[DEBUG] KBFileTree 本地移除文件: ${fileId}`)
  }
}

/**
 * 更新文件状态（供父组件轮询回调使用）
 */
function updateFileStatus(fileId: string, updates: Partial<KBFile>) {
  const index = currentItems.value.findIndex(item => item.id === fileId)
  if (index !== -1) {
    const updatedItem = { ...currentItems.value[index], ...updates }
    currentItems.value.splice(index, 1, updatedItem)
    console.log(`[DEBUG] KBFileTree 更新文件状态: ${updatedItem.displayName} -> ${updates.processingStatus}`)
  }
}

/**
 * 获取当前目录的所有文件（供父组件查询）
 */
function getCurrentFiles(): KBFile[] {
  return currentItems.value
}

/**
 * 智能插入上传完成的文件（增量更新）
 * @param uploadedFile 上传完成的文件信息
 */
async function insertUploadedFile(uploadedFile: KBFile) {
  console.log(`[DEBUG] KBFileTree: 尝试插入文件 ${uploadedFile.displayName}, relativePath: ${uploadedFile.relativePath}`)

  const currentPath = currentRelativePath.value

  // 关键修复:上传完成后状态应为 pending（后端还在处理）
  const fileToInsert: KBFile = {
    ...uploadedFile,
    processingStatus: 'pending',  // 改为 pending
    progressPercentage: 0,
    currentStep: t('knowledge.tree.waitProcess')
  }

  // 情况1: 文件属于当前目录的一级子项
  if (isDirectChildOfCurrentPath(fileToInsert.relativePath, currentPath)) {
    console.log('[DEBUG] KBFileTree: 文件是一级子项，直接插入')

    // 检查是否已存在（避免重复）
    const exists = currentItems.value.some(item => item.id === fileToInsert.id)
    if (!exists) {
      // 关键修复:智能插入位置 - 文件插入到文件列表顶部，但保持目录在上方
      insertItemAtCorrectPosition(fileToInsert)
      console.log(`[DEBUG] KBFileTree: 已插入文件 ${fileToInsert.displayName}`)

      // 关键修复:插入后检查是否需要启动轮询
      if (fileToInsert.processingStatus === 'pending' || fileToInsert.processingStatus === 'processing') {
        console.log('[DEBUG] KBFileTree: 检测到 pending/processing 状态文件，重启轮询')
        await startFileProcessingPolling()
      }
    } else {
      console.log('[DEBUG] KBFileTree: 文件已存在，跳过插入')
    }
    return
  }

  // 情况2: 文件属于当前目录的深层子项，需要创建临时目录
  const tempDirName = getFirstLevelSubdir(fileToInsert.relativePath, currentPath)
  if (tempDirName) {
    console.log(`[DEBUG] KBFileTree: 文件是深层子项，创建临时目录 ${tempDirName}`)

    // 检查临时目录是否已存在
    const dirExists = currentItems.value.some(item =>
      item.isDirectory && item.displayName === tempDirName
    )

    if (!dirExists) {
      // 创建临时目录对象
      const tempDir: KBFile = {
        id: `temp-dir-${tempDirName}-${Date.now()}`,  // 临时ID
        knowledgeBaseId: fileToInsert.knowledgeBaseId,
        fileName: tempDirName,
        displayName: tempDirName,
        fileSize: 0,
        fileType: 'directory',
        fileExtension: '',
        contentHash: '',
        relativePath: currentPath ? `${currentPath}/${tempDirName}` : tempDirName,
        parentFolderId: null,
        isDirectory: true,
        processingStatus: 'completed',
        progressPercentage: 100,
        currentStep: null,
        errorMessage: null,
        uploadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        totalChunks: 0,
        totalTokens: 0
      }

      // 关键修复:目录插入到目录列表顶部
      insertItemAtCorrectPosition(tempDir)
      console.log(`[DEBUG] KBFileTree: 已创建临时目录 ${tempDirName}`)
    } else {
      console.log(`[DEBUG] KBFileTree: 临时目录 ${tempDirName} 已存在，跳过`)
    }
    return
  }

  // 情况3: 文件不属于当前目录，不处理
  console.log('[DEBUG] KBFileTree: 文件不属于当前目录，跳过插入')
}

/**
 * 智能插入项目到正确位置（目录在上方，文件在下方）
 * @param item 要插入的项目
 */
function insertItemAtCorrectPosition(item: KBFile) {
  if (item.isDirectory) {
    // 目录：找到第一个非目录项的位置，插入到它前面
    const firstFileIndex = currentItems.value.findIndex(i => !i.isDirectory)
    if (firstFileIndex === -1) {
      // 没有文件，直接添加到最后
      currentItems.value.push(item)
    } else {
      // 插入到第一个文件之前
      currentItems.value.splice(firstFileIndex, 0, item)
    }
  } else {
    // 文件：找到第一个文件的位置，插入到它前面
    const firstFileIndex = currentItems.value.findIndex(i => !i.isDirectory)
    if (firstFileIndex === -1) {
      // 没有文件，直接添加到最后
      currentItems.value.push(item)
    } else {
      // 插入到第一个文件之前（即文件列表的顶部）
      currentItems.value.splice(firstFileIndex, 0, item)
    }
  }
}

/**
 * 判断文件是否是当前路径的直接子项
 */
function isDirectChildOfCurrentPath(fileRelativePath: string | null | undefined, currentPath: string | null): boolean {
  // 当前在根目录
  if (!currentPath) {
    // 文件也在根目录（relativePath 为 null、空、或不包含 /）
    if (!fileRelativePath || fileRelativePath === '') {
      return true
    }
    // 关键修复:根目录下，只要路径不包含 /，就是直接子项
    return !fileRelativePath.includes('/')
  }

  // 当前在子目录，文件必须是该目录的直接子项
  // 例如: currentPath="a", fileRelativePath="a/file.txt" → true
  //       currentPath="a", fileRelativePath="a/b/file.txt" → false
  if (fileRelativePath) {
    const expectedPrefix = currentPath + '/'
    if (fileRelativePath.startsWith(expectedPrefix)) {
      const remaining = fileRelativePath.substring(expectedPrefix.length)
      // 剩余部分不能包含 / ，说明是直接子项
      return !remaining.includes('/')
    }
  }

  return false
}

/**
 * 获取第一层子目录名称
 * @param fileRelativePath 文件的相对路径
 * @param currentPath 当前目录路径
 * @returns 第一层子目录名称，如果不是深层子项则返回 null
 */
function getFirstLevelSubdir(fileRelativePath: string | null | undefined, currentPath: string | null): string | null {
  if (!fileRelativePath) return null

  // 当前在根目录的情况
  if (!currentPath) {
    // 文件路径包含 / ，说明在子目录中
    if (fileRelativePath.includes('/')) {
      const parts = fileRelativePath.split('/')
      return parts[0]  // 返回第一层目录名
    }
    // 文件在根目录，不需要创建目录
    return null
  }

  // 当前在子目录的情况
  const expectedPrefix = currentPath + '/'
  if (!fileRelativePath.startsWith(expectedPrefix)) return null

  const remaining = fileRelativePath.substring(expectedPrefix.length)
  const parts = remaining.split('/')

  // 如果只有一层，说明是直接子项，不需要创建目录
  if (parts.length <= 1) return null

  // 返回第一层目录名
  return parts[0]
}

// 暴露方法给父组件
defineExpose({
  forceReload,
  removeFileLocally,
  updateFileStatus,
  getCurrentFiles,
  insertUploadedFile,  // 新增:智能插入上传完成的文件
  getCurrentFolderPath: () => currentRelativePath.value,
  loadMoreFiles,  // 新增:加载更多文件（用于无限滚动）
  startFileProcessingPolling  // 新增:手动启动轮询（用于重新处理等场景）
})

/**
 * 获取文件图标
 */
function getFileIcon(file: KBFile): string {
  const ext = file.fileExtension?.toLowerCase() || ''

  const iconMap: Record<string, string> = {
    'pdf': filePdfIcon,
    'docx': fileWordIcon,
    'xlsx': fileExcelIcon,
    'ppt': filePptIcon,
    'pptx': filePptIcon,
    'txt': fileTxtIcon,
    'md': fileTxtIcon,
    'js': fileCodeIcon,
    'ts': fileCodeIcon,
    'py': fileCodeIcon,
    'java': fileCodeIcon,
  }

  return iconMap[ext] || fileTxtIcon
}

/**
 * 格式化文件大小。
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
}

/**
 * 获取状态类型。
 */
function getStatusType(status: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  const types: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    'pending': 'info',
    'processing': 'warning',
    'completed': 'success',
    'failed': 'danger',
  }
  return types[status] || 'info'
}

/**
 * 获取状态显示文本（包含详细进度信息）
 */
function getStatusDisplayText(item: KBFile): string {
  // 如果正在处理或等待处理且有进度百分比，显示百分比
  if ((item.processingStatus === 'processing' || item.processingStatus === 'pending') && 
      item.progressPercentage !== undefined && item.progressPercentage !== null) {
    return `${item.progressPercentage}%`
  }
  
  // 否则返回基本状态文本
  return getStatusText(item.processingStatus)
}

/**
 * 获取状态
 */
function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    'pending': t('knowledge.status.pending'),
    'processing': t('knowledge.status.processing'),
    'completed': t('knowledge.status.completed'),
    'failed': t('knowledge.status.failed'),
  }
  return texts[status] || status
}


/**
 * 格式化日期。
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 处理右键菜单
 */
function handleContextMenu(event: MouseEvent, item: KBFile) {
  event.preventDefault()
  // 只读公开库：不提供重命名/移动/重试/删除等写操作菜单
  if (props.readonly) {
    return
  }
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    item
  }
}

/**
 * 从重命名菜单触发
 */
function handleRenameFromMenu() {
  if (contextMenu.value.item) {
    renamingFileId.value = contextMenu.value.item.id // 保存文件ID
    renameForm.value.newName = contextMenu.value.item.displayName
    showRenameDialog.value = true
  }
  closeContextMenu()
}

/**
 * 验证文件或文件夹名称
 */
function validateFileName(name: string): { valid: boolean; message?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, message: t('knowledge.tree.nameEmpty') }
  }

  if (name.length > 255) {
    return { valid: false, message: t('knowledge.tree.nameTooLong') }
  }

  // 不允许的字符：/ \ : * ? " < > | 以及控制字符
  const invalidChars = /[\\/:*?"<>|\x00-\x1f\x7f]/
  if (invalidChars.test(name)) {
    return {
      valid: false,
      message: t('knowledge.tree.nameInvalidChars')
    }
  }

  // Windows 保留名称检查
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ]
  if (reservedNames.includes(name.toUpperCase())) {
    return { valid: false, message: t('knowledge.tree.nameReserved', { name }) }
  }

  // 不允许以空格或点号开头/结尾
  if (name.startsWith(' ') || name.endsWith(' ') ||
    name.startsWith('.') || name.endsWith('.')) {
    return { valid: false, message: t('knowledge.tree.nameStartEnd') }
  }

  return { valid: true }
}

/**
 * 确认重命名
 */
async function confirmRename() {
  console.log('[DEBUG] 确认重命名:', {
    newName: renameForm.value.newName,
    fileId: renamingFileId.value,
  })

  if (!renameForm.value.newName || !renamingFileId.value) {
    console.warn('[DEBUG] 重命名参数无效')
    return
  }

  // 前端验证
  const validation = validateFileName(renameForm.value.newName)
  if (!validation.valid) {
    ElMessage.warning(validation.message)
    return
  }

  renameLoading.value = true
  try {
    await kbStore.renameFile(
      props.kbId,
      renamingFileId.value,
      renameForm.value.newName,
    )
    ElMessage.success(t('common.renameSuccess'))
    showRenameDialog.value = false

    // 刷新当前目录
    await loadFolderContents(currentRelativePath.value)
  } catch (error: any) {
    console.error('[DEBUG] 重命名失败:', error)
    ElMessage.error(error.message || t('common.renameFailed'))
  } finally {
    renameLoading.value = false
  }
}

/**
 * 从移动菜单触发
 */
async function handleMoveFromMenu() {
  if (!contextMenu.value.item) {
    return
  }

  movingFileId.value = contextMenu.value.item.id // 保存文件ID
  // 加载文件夹树
  await loadFolderTree()
  showMoveDialog.value = true
  closeContextMenu()
}

/**
 * 加载文件夹树（用于移动选择）
 */
async function loadFolderTree() {
  try {

    // 获取所有文件夹（递归）
    const response = await apiService.fetchKBFiles(props.kbId, 0, 1000)
    const allItems = response.items || []

    // 过滤出文件夹，并构建树形结构
    const folders = allItems.filter((item: any) => item.isDirectory)
    folderTreeData.value = buildFolderTree(folders)
  } catch (error) {
    console.error('加载文件夹树失败:', error)
    folderTreeData.value = []
  }
}

/**
 * 构建文件夹树
 */
function buildFolderTree(folders: any[]): any[] {
  const folderMap = new Map<string, any>()
  const rootFolders: any[] = []

  // 创建映射
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      id: folder.id,
      displayName: folder.displayName,
      relativePath: folder.relativePath,
      children: [],
    })
  })

  // 构建树
  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!
    if (folder.parentFolderId && folderMap.has(folder.parentFolderId)) {
      const parent = folderMap.get(folder.parentFolderId)!
      parent.children.push(node)
    } else {
      rootFolders.push(node)
    }
  })

  return rootFolders
}

/**
 * 选择目标文件夹
 */
function selectTargetFolder(data: any) {
  selectedTargetFolderId.value = data.id
}

/**
 * 选择根目录
 */
function selectRootDirectory() {
  selectedTargetFolderId.value = null
}

/**
 * 确认移动
 */
async function confirmMove() {
  console.log('[DEBUG] 确认移动:', {
    fileId: movingFileId.value,
    targetParentFolderId: selectedTargetFolderId.value,
  })

  if (!movingFileId.value) {
    console.warn('[DEBUG] 移动参数无效')
    return
  }

  moveLoading.value = true
  try {
    await kbStore.moveFile(
      props.kbId,
      movingFileId.value,
      selectedTargetFolderId.value,
    )
    ElMessage.success(t('knowledge.tree.moveSuccess'))
    showMoveDialog.value = false

    // 刷新当前目录
    await loadFolderContents(currentRelativePath.value)
  } catch (error: any) {
    console.error('[DEBUG] 移动失败:', error)
    ElMessage.error(error.message || t('knowledge.tree.moveFailed'))
  } finally {
    moveLoading.value = false
  }
}

/**
 * 从菜单重新处理。
 */
function handleRetryFromMenu() {
  if (contextMenu.value.item) {
    emit('retry', contextMenu.value.item)
  }
  closeContextMenu()
}

/**
 * 从菜单删除。
 */
function handleDeleteFromMenu() {
  if (contextMenu.value.item) {
    emit('delete', contextMenu.value.item)
  }
  closeContextMenu()
}

/**
 * 关闭右键菜单
 */
function closeContextMenu() {
  contextMenu.value.visible = false
  contextMenu.value.item = null
}

// 点击其他地方关闭菜单
if (typeof window !== 'undefined') {
  window.addEventListener('click', closeContextMenu)
}

// 组件卸载时清理轮询定时器
onUnmounted(() => {
  console.log('[DEBUG] KBFileTree 组件销毁,清理轮询定时器')
  stopFileProcessingPolling()
})
</script>

<style scoped>
.node-content:hover {
  background-color: color-mix(in srgb, var(--rm-text) 4%, transparent);
}

/* 键盘焦点可见性：文件/文件夹行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式沿用模板里已有的 cursor-pointer，不重复声明。
   环的透明度提到 45%（而不是常规的 12%）：行本身透明，实际底色来自父容器的
   dark:bg-[#232428] 写死深底，12% 的主色环落在近黑底上几乎不可见。 */
.file-row {
  outline: none;
}

.file-row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rm-primary) 45%, transparent);
}
</style>
