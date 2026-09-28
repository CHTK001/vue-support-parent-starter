<!-- KnowledgeBasePage/KBFileItem.vue -->
<template>
    <div 
        class="file-item group bg-white dark:bg-[#232428] border border-gray-200 dark:border-[#2e3035] rounded-lg px-3 py-2.5 hover:shadow-md transition-all"
        :class="{
            'cursor-pointer': file.processingStatus === 'completed' || file.processingStatus === 'failed',
            'cursor-not-allowed': file.processingStatus !== 'completed' && file.processingStatus !== 'failed'
        }"
        @click="handleClick"
    >
        <div class="flex items-center gap-3">
            <!-- 文件图标 -->
            <div class="w-10 h-10 flex items-center justify-center shrink-0">
                <img :src="fileIcon" class="w-8 h-8 object-contain" alt="file icon" />
            </div>

            <!-- 文件信息 -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-0.5">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-[#e8e9ed] truncate pr-2">
                        {{ file.displayName }}
                    </h4>
                    <el-tag :type="statusType">
                        {{ statusText }}
                    </el-tag>
                </div>
                <p class="text-xs text-gray-500 dark:text-[#8b8d95]">
                    {{ formatSize(file.fileSize) }} · {{ file.fileExtension ? file.fileExtension.toUpperCase() : t('knowledge.file.unknown') }}
                    <span v-if="isTempTask && file.processingStatus === 'queued'" class="ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-[#2a2c30] text-gray-600 dark:text-[#8b8d95] rounded text-xs">{{ t('knowledge.status.queued') }}</span>
                    <span v-if="isTempTask && file.processingStatus === 'uploading'" class="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">{{ t('knowledge.status.uploading') }}</span>
                </p>
                <!-- 显示相对路径(如果有) -->
                <p v-if="file.relativePath && !file.isDirectory" class="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
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
            <p class="text-xs text-gray-500 dark:text-[#8b8d95] mt-1">
                {{ file.currentStep || t('knowledge.file.processing') }}
            </p>
        </div>

        <!-- 排队状态提示 -->
        <div v-if="file.processingStatus === 'queued'" class="mt-2">
            <p class="text-xs text-gray-500 dark:text-[#8b8d95]">
                {{ file.currentStep || t('knowledge.file.waitUpload') }}
            </p>
        </div>

        <!-- 错误信息 -->
        <div v-if="file.processingStatus === 'failed' && file.errorMessage" 
            class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
            {{ file.errorMessage }}
        </div>

        <!-- 详细信息 (可选展开) -->
        <div v-if="file.processingStatus === 'completed' || file.processingStatus === 'failed'" 
            class="mt-2 pt-2 border-t border-gray-100 dark:border-[#2e3035]">
            <div class="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-[#8b8d95]">
                <div class="flex gap-3">
                    <span v-if="file.totalChunks">{{ file.totalChunks }} {{ t('knowledge.file.chunks') }}</span>
                </div>
                <!-- 操作按钮 -->
                <div class="flex items-center gap-1 shrink-0" @click.stop>
                    <el-button link @click="handleRetry">
                        <RefreshRight class="w-3 h-3 mr-1" />
                        {{ t('knowledge.file.retry') }}
                    </el-button>
                    <el-button type="danger" link @click="handleDelete">
                        <Delete class="w-3 h-3 mr-1" />
                        {{ t('common.delete') }}
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshRight, Delete } from '@element-plus/icons-vue'
import { KBFile } from '@/stores/knowledgeBase'

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

interface Props {
    file: KBFile
    isTempTask?: boolean
}

const props = defineProps<Props>()

const { t } = useI18n()

const emit = defineEmits<{
    view: [file: KBFile]
    retry: [file: KBFile]
    delete: [file: KBFile]
}>()

/**
 * 文件类型到图标的映射
 */
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

/**
 * 根据文件扩展名获取图标
 */
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
            'application/x-rar-compressed': 'rar'
        }
        ext = mimeMap[props.file.fileType] || 'txt'
    }

    // 方法 3: 如果还是空，默认 txt
    if (!ext) {
        ext = 'txt'
    }

    return fileIconMap[ext] || fileTxtIcon
})

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

/**
 * 获取状态标签类型
 */
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

/**
 * 获取状态文本
 */
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

/**
 * 处理点击事件
 */
function handleClick() {
    if (props.file.processingStatus === 'completed' || props.file.processingStatus === 'failed') {
        emit('view', props.file)
    }
}

/**
 * 处理重新处理
 */
function handleRetry() {
    emit('retry', props.file)
}

/**
 * 处理删除
 */
function handleDelete() {
    emit('delete', props.file)
}
</script>

<style scoped>
.file-item {
    transition: all 0.2s ease;
}

.file-item:hover {
    /* 悬浮浮起反馈，投影改用令牌 */
    box-shadow: var(--el-box-shadow-light);
}

/* 动效降级：系统开启「减少动态效果」时，文件卡的投影直接落位。
   逐个列出，不写 `*` / `.file-item *` 通配，
   避免把 el-tag / el-progress / el-button 内部 Element Plus 组件的合法过渡一起掐掉。
   本文件只有 transition、没有 animation，hover 投影本身是静态样式，照样生效。 */
@media (prefers-reduced-motion: reduce) {
    .file-item {
        transition: none;
    }
}

/* 键盘焦点可见性：文件卡是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式沿用模板里按 processingStatus 条件挂的 cursor-pointer / cursor-not-allowed，
   这里不重复声明 —— 写死会把「处理中不可点」的状态也显示成手型。
   环的透明度提到 45%（而不是常规的 12%）：卡片暗色态是写死的深底 dark:bg-[#232428]，
   12% 的主色环落在近黑底上几乎不可见，等于没有焦点指示。 */
.file-item {
    outline: none;
}

.file-item:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}
</style>
