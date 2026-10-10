<!-- KnowledgeBasePage/KBFileItem.vue -->
<template>
  <div
    class="re-surface re-surface--dense re-surface--hover flex flex-col min-w-0 focus-visible:outline-none"
    :class="canView
      ? 'cursor-pointer'
      : 'cursor-not-allowed'"
    @click="handleClick"
  >
    <div class="flex items-center gap-3">
      <!-- 文件图标 -->
      <div class="w-10 h-10 flex items-center justify-center shrink-0">
        <img :src="fileIcon" class="w-8 h-8 object-contain" alt="file icon" />
      </div>

      <!-- 文件信息 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2 mb-0.5">
          <h4 class="text-sm font-medium truncate">{{ file.displayName }}</h4>
          <ReTag :type="statusType" size="small">{{ statusText }}</ReTag>
        </div>
        <p class="text-xs text-[var(--rm-text-secondary)] flex items-center gap-2 flex-wrap">
          <span>{{ formatSize(file.fileSize) }} · {{ file.fileExtension ? file.fileExtension.toUpperCase() : t('knowledge.file.unknown') }}</span>
          <ReTag v-if="isTempTask && file.processingStatus === 'queued'" type="info" size="small">
            {{ t('knowledge.status.queued') }}
          </ReTag>
          <ReTag v-if="isTempTask && file.processingStatus === 'uploading'" type="warning" size="small">
            {{ t('knowledge.status.uploading') }}
          </ReTag>
        </p>
        <!-- 相对路径 -->
        <p v-if="file.relativePath && !file.isDirectory" class="text-xs text-[var(--rm-primary)] mt-0.5 truncate">
          📁 {{ file.relativePath }}
        </p>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="file.processingStatus === 'processing' || file.processingStatus === 'uploading'" class="mt-2">
      <el-progress
        :percentage="file.progressPercentage"
        :stroke-width="3"
        :status="file.processingStatus === 'uploading' ? undefined : 'warning'"
      />
      <p class="text-xs text-[var(--rm-text-secondary)] mt-1">
        {{ file.currentStep || t('knowledge.file.processing') }}
      </p>
    </div>

    <!-- 排队状态提示 -->
    <div v-if="file.processingStatus === 'queued'" class="mt-2">
      <p class="text-xs text-[var(--rm-text-secondary)]">
        {{ file.currentStep || t('knowledge.file.waitUpload') }}
      </p>
    </div>

    <!-- 错误信息 -->
    <div
      v-if="file.processingStatus === 'failed' && file.errorMessage"
      class="mt-2 p-2 rounded-[var(--rm-radius-sm,6px)] text-xs border border-[var(--rm-danger)] bg-[var(--rm-bg-subtle)] text-[var(--rm-danger)]"
    >
      {{ file.errorMessage }}
    </div>

    <!-- 详细信息（已处理完的文件才显示操作） -->
    <div
      v-if="canView"
      class="mt-2 pt-2 border-t border-[var(--rm-border-light)] flex items-center justify-between gap-3 text-xs text-[var(--rm-text-secondary)]"
    >
      <div class="flex gap-3">
        <span v-if="file.totalChunks">{{ file.totalChunks }} {{ t('knowledge.file.chunks') }}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0" @click.stop>
        <ReSquareButton layout="square" size="small" :icon="RefreshRight" :tip="t('knowledge.file.retry')" @click="handleRetry" />
        <ReSquareButton layout="square" size="small" type="danger" :icon="Delete" :tip="t('common.delete')" @click="handleDelete" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 知识库文件条目。
 *
 * <p>风格与系统一致：容器表面用组件库基线 {@code re-surface}（含 hover 态），
 * 标签与按钮用应用本地 koi 封装 {@code ReTag} / {@code ReButton}；
 * 颜色只用 koi 令牌 {@code --rm-*}，原先满屏的硬编码暗色值
 * （{@code dark:bg-[#232428]} / {@code dark:border-[#2e3035]} / {@code dark:text-[#8b8d95]} 等）
 * 已全部移除，暗色改由令牌自动跟随。</p>
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshRight, Delete } from '@element-plus/icons-vue'
import { KBFile } from '@/stores/knowledgeBase'
import ReTag from '@/components/re/ReTag.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReSquareButton from '@repo/ui/re-button'

// 导入所有文件图标
import fileCodeIcon from '@/assets/file_code.svg'
import fileExcelIcon from '@/assets/file_excel.svg'
import fileHtmlIcon from '@/assets/file_html.svg'
import fileMusicIcon from '@/assets/file_music.svg'
import filePptIcon from '@/assets/file_ppt.svg'
import fileTxtIcon from '@/assets/file_txt.svg'
import fileVideoIcon from '@/assets/file_video.svg'
import fileWordIcon from '@/assets/file_word.svg'
import fileZipIcon from '@/assets/file_zip.svg'

/** 组件属性 */
interface Props {
  /** 文件节点 */
  file: KBFile
  /** 是否来自临时上传任务 */
  isTempTask?: boolean
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
  /** 请求预览 */
  view: [file: KBFile]
  /** 请求重新处理 */
  retry: [file: KBFile]
  /** 请求删除 */
  delete: [file: KBFile]
}>()

/** 文件类型到图标的映射 */
const fileIconMap: Record<string, string> = {
  // 代码文件
  'js': fileCodeIcon,
  'ts': fileCodeIcon,
  'vue': fileCodeIcon,
  'py': fileCodeIcon,
  'java': fileCodeIcon,
  'h': fileCodeIcon,
  'hpp': fileCodeIcon,
  'cpp': fileCodeIcon,
  'c': fileCodeIcon,
  'go': fileCodeIcon,
  'rs': fileCodeIcon,
  'php': fileCodeIcon,
  'rb': fileCodeIcon,
  'css': fileCodeIcon,
  'json': fileCodeIcon,
  'xml': fileCodeIcon,
  'sh': fileCodeIcon,
  'yaml': fileCodeIcon,
  'yml': fileCodeIcon,

  // html
  'html': fileHtmlIcon,
  'htm': fileHtmlIcon,

  // 文档文件
  'docx': fileWordIcon,
  'xlsx': fileExcelIcon,
  'csv': fileExcelIcon,
  'ppt': filePptIcon,
  'pptx': filePptIcon,
  'txt': fileTxtIcon,
  'md': fileTxtIcon,
  'markdown': fileTxtIcon,

  // 媒体文件
  'mp3': fileMusicIcon,
  'wav': fileMusicIcon,
  'flac': fileMusicIcon,
  'mp4': fileVideoIcon,
  'avi': fileVideoIcon,
  'mkv': fileVideoIcon,
  'mov': fileVideoIcon,

  // 压缩文件
  'zip': fileZipIcon,
  'rar': fileZipIcon,
  '7z': fileZipIcon,
  'tar': fileZipIcon,
  'gz': fileZipIcon,
}

/** 根据文件扩展名获取图标 */
const fileIcon = computed(() => {
  let ext = ''

  // 方法 1: 从 fileExtension 提取（去掉点号）
  if (props.file.fileExtension) {
    ext = props.file.fileExtension.toLowerCase().replace(/^\./, '')
  }

  // 方法 2: 如果还是空，尝试从 fileType (MIME) 推断
  if (!ext && props.file.fileType) {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'application/json': 'json',
      'application/xml': 'xml',
      'text/xml': 'xml',
      'application/x-python-code': 'py',
      'text/x-python': 'py',
      'text/x-java-source': 'java',
      'text/x-c': 'c',
      'text/x-c++': 'cpp',
      'text/x-go': 'go',
      'text/x-rust': 'rs',
      'text/x-php': 'php',
      'text/x-ruby': 'rb',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip',
      'application/x-rar-compressed': 'rar',
    }
    ext = mimeMap[props.file.fileType] || 'txt'
  }

  // 方法 3: 如果还是空，默认 txt
  if (!ext) {
    ext = 'txt'
  }

  return fileIconMap[ext] || fileTxtIcon
})

/** 是否可查看/操作（已完成或失败） */
const canView = computed(() =>
  props.file.processingStatus === 'completed' || props.file.processingStatus === 'failed',
)

/**
 * 格式化文件大小。
 *
 * @param bytes 字节数
 * @returns 人类可读大小
 */
function formatSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/** 状态标签类型 */
const statusType = computed(() => {
  const types: Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    'queued': 'info',
    'uploading': 'warning',
    'uploaded': 'success', // 上传完成显示绿色
    'pending': 'info',
    'processing': 'warning',
    'completed': 'success',
    'failed': 'danger',
  }
  return types[props.file.processingStatus] || 'info'
})

/** 状态文本 */
const statusText = computed(() => {
  const texts: Record<string, string> = {
    'queued': t('knowledge.status.queued'),
    'uploading': t('knowledge.status.uploading'),
    'uploaded': t('knowledge.status.uploaded'),
    'pending': t('knowledge.status.pending'),
    'processing': t('knowledge.status.processing'),
    'completed': t('knowledge.status.completed'),
    'failed': t('knowledge.status.failed'),
  }
  return texts[props.file.processingStatus] || props.file.processingStatus
})

/** 处理点击：仅已完成/失败可预览 */
function handleClick() {
  if (canView.value) {
    emit('view', props.file)
  }
}

/** 处理重新处理 */
function handleRetry() {
  emit('retry', props.file)
}

/** 处理删除 */
function handleDelete() {
  emit('delete', props.file)
}
</script>