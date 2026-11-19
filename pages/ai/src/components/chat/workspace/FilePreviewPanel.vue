<template>
    <div class="flex flex-col h-full min-h-0 flex-1 bg-(--color-bg)">
        <!-- 标题栏 -->
        <div
            class="shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-2 min-w-0">
                <!-- 预览/源码切换按钮（仅 md 和 html），放在左侧高频操作区 -->
                <div v-if="canTogglePreview"
                    class="flex items-center gap-0.5 bg-gray-100/80 dark:bg-gray-900 rounded-md p-0.5 shrink-0">
                    <button class="preview-mode-btn" :class="{ 'is-active': renderMode === 'rendered' }" :title="t('chat.workspace.preview')"
                        @click="renderMode = 'rendered'">
                        <el-icon :size="16">
                            <Eye20Regular v-if="renderMode !== 'rendered'" />
                            <Eye20Filled v-else />
                        </el-icon>
                    </button>
                    <button class="preview-mode-btn" :class="{ 'is-active': renderMode === 'source' }" :title="t('chat.workspace.source')"
                        @click="renderMode = 'source'">
                        <el-icon :size="16">
                            <Code20Regular v-if="renderMode !== 'source'" />
                            <Code20Filled v-else />
                        </el-icon>
                    </button>
                </div>

                <span class="font-medium text-gray-600 dark:text-gray-400 truncate ml-2">
                    {{ tab.name }}
                </span>
                <div class="flex items-center gap-1 shrink-0">
                    <!-- 在内置浏览器中打开（HTML / SVG）：看渲染效果而不用切源码 -->
                    <button v-if="canOpenInBrowser" class="preview-close-btn"
                        :title="t('chat.workspace.openInBrowser')" @click="handleOpenInBrowser">
                        <el-icon :size="14">
                            <Globe20Regular class="text-gray-500 dark:text-gray-400" />
                        </el-icon>
                    </button>
                    <!-- 手动刷新预览按钮 -->
                    <button class="preview-close-btn" :title="t('chat.workspace.refreshPreview')" @click="handleManualRefresh">
                        <el-icon :size="14">
                            <ArrowClockwise20Regular class="text-gray-500 dark:text-gray-400" />
                        </el-icon>
                    </button>
                    <!-- 编辑/保存：只对文本文件开放；保存带 mtime 乐观锁，AI 期间改过会提示合并 -->
                    <template v-if="canEditFile">
                        <template v-if="!editing">
                            <button class="preview-close-btn" :title="t('chat.workspace.editFile')" @click="startEdit">
                                <el-icon :size="14">
                                    <EditPen />
                                </el-icon>
                            </button>
                        </template>
                        <template v-else>
                            <el-button size="small" type="primary" :loading="saving" :disabled="!editDirty" @click="saveEdit">
                                {{ t('chat.workspace.saveFile') }}
                            </el-button>
                            <el-button size="small" text @click="cancelEdit">
                                {{ t('common.cancel') }}
                            </el-button>
                        </template>
                    </template>
                </div>
            </div>
        </div>

        <div class="flex-1 flex overflow-hidden w-full min-h-0 p-1" @contextmenu.prevent="handleContextMenu($event)">
            <div v-if="previewLoading" class="flex items-center justify-center h-full w-full">
                <el-icon class="is-loading" size="20">
                    <LoadingOutlined />
                </el-icon>
            </div>

            <!-- 图片预览 -->
            <img v-else-if="previewType === 'image' && imagePreviewUrl && !previewError" :src="imagePreviewUrl" @error="onImageError"
                class="image-preview w-full h-full object-contain p-2" :alt="t('chat.workspace.imageAlt')" />

            <!-- 不支持的文件 -->
            <div v-else-if="previewType === 'unsupported' && !previewError"
                class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                    <p class="text-gray-400 dark:text-gray-500 text-sm">{{ t('chat.workspace.unsupportedPreview') }}</p>
                    <el-button v-if="isElectron" @click="handleOpenInExplorerForCurrent" class="mt-3">
                        {{ t('chat.workspace.openInExplorer') }}
                    </el-button>
                </div>
            </div>

            <!-- 错误 / 文本内容 -->
            <template v-else>
                <!-- 文件不存在 -->
                <div v-if="fileNotFound" class="w-full h-full flex items-center justify-center p-4">
                    <div class="text-center">
                        <p class="text-gray-400 dark:text-gray-500 text-sm">{{ t('chat.workspace.fileNotFound') }}</p>
                        <el-button @click="emit('close')" class="mt-3">
                            {{ t('chat.workspace.closeTab') }}
                        </el-button>
                    </div>
                </div>
                <!-- 其他错误 -->
                <div v-else-if="previewError" class="w-full h-full flex items-center justify-center p-4">
                    <div class="text-center">
                        <p class="text-gray-400 dark:text-gray-500 text-sm">{{ previewError }}</p>
                        <el-button v-if="isElectron && previewType === 'unsupported'"
                            @click="handleOpenInExplorerForCurrent" class="mt-3">
                            {{ t('chat.workspace.openInExplorer') }}
                        </el-button>
                    </div>
                </div>
                <template v-else-if="previewType === 'text'">
                    <!--
                      编辑态：直接复用 textarea（不引 Monaco）。
                      保存走 PUT /workspace/file，带读取时的 mtime 做乐观锁。
                    -->
                    <textarea v-if="editing" v-model="draftContent" spellcheck="false" autocomplete="off"
                        class="code-editor w-full h-full resize-none border-0 outline-none p-4 m-0 font-mono text-sm leading-relaxed bg-transparent text-gray-800 dark:text-gray-200" />
                    <!--
                      HTML 预览模式。

                      网页（HTTP）走 srcdoc：预览正文已由 getWorkspaceFile 用鉴权请求头
                      取回，令牌不进入任何 URL。仅 Electron 的 file:// 场景仍用 src，
                      因为那是本地文件、根本不存在服务端鉴权。

                      referrerpolicy="no-referrer" 依然保留 —— 它现在保护的是
                      <base href> 指向的资源请求，而不是令牌。
                    -->
                    <iframe v-if="isHtmlFile && renderMode === 'rendered'"
                        :src="isLocalHtmlPreview ? htmlPreviewSrc : undefined"
                        :srcdoc="isLocalHtmlPreview ? undefined : htmlPreviewSrcDoc"
                        class="w-full border-0" referrerpolicy="no-referrer" style="height: 100%;"
                        sandbox="allow-same-origin allow-scripts" />

                    <!-- Markdown 渲染模式（iframe srcdoc + <base> 让浏览器原生解析相对路径） -->
                    <iframe v-else-if="isMarkdownFile && renderMode === 'rendered'" :srcdoc="markdownSrcDoc"
                        ref="markdownIframeRef" class="w-full border-0" style="height: 100%;background-color: transparent !important;
    color-scheme: light; /* 强制使用浅色模式以确保透明生效 */" allowtransparency="true" sandbox="allow-same-origin allow-scripts" />

                    <!-- 源码高亮（所有文件的 source 模式 + 不支持预览的文本文件） -->
                    <div v-else-if="highlightedCode" class="code-preview-container min-w-full"
                        v-html="highlightedCode" />

                    <!-- 普通文本预览（不支持高亮的文件） -->
                    <pre v-else v-text="fileContent"
                        class="text-sm leading-relaxed whitespace-pre-wrap break-all  text-gray-800 dark:text-gray-200 p-4 m-0 overflow-auto min-h-0 font-mono" />
                </template>
            </template>
        </div>

        <!-- 右键上下文菜单 -->
        <ContextMenu :visible="contextMenuVisible" :x="contextMenuX" :y="contextMenuY"
            :items="contextMenuItems" @close="contextMenuVisible = false" />
    </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

import { useI18n } from 'vue-i18n'
import { apiService } from '@/services/ApiService'
import { loadAuthenticatedImage } from '@/utils/authImage'
import { LoadingOutlined } from '@vicons/antd'
import { Eye20Filled, Eye20Regular, Code20Filled, Code20Regular, ArrowClockwise20Regular, Globe20Regular } from '@vicons/fluent'
import { DocumentCopy, Plus, EditPen } from '@element-plus/icons-vue'
import { useStorage } from '@vueuse/core'
import { usePreviewMarkdown, buildMarkdownSrcDoc } from '@/composables/useMarkdown'
import { buildHtmlPreviewSrcDoc, buildHtmlPreviewSrcDocWithAssets } from '@/utils/htmlPreviewSrcDoc'
import { useTheme } from '@/composables/useTheme'
import { useHighlight } from '@/composables/useHighlight'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'
import type { UnifiedTab } from '@/composables/usePreviewTabCache'

interface SelectedFile {
    name: string
    path: string
    extension: string
    size: number
    content: string
    mimeType: string
    /** 读取时的 mtime（毫秒），保存时回传给后端做乐观锁 */
    modifiedAt?: number
}

export interface SnipData {
    path: string
    fileName: string
    startLine?: number
    endLine?: number
    content: string  // base64-encoded (truncated head + notice for large selections)
    label: string
}

const props = defineProps<{
    sessionId: string
    tab: UnifiedTab
    isActive: boolean
    contentVersion: number
    workspacePath: string | null
}>()

const emit = defineEmits<{
    close: []
    'insert-to-input': [path: string]
    'insert-snip': [data: SnipData]
}>()

const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined
const { t } = useI18n()

// ── 预览状态 ──

const selectedFile = ref<SelectedFile | null>(null)
const fileContent = ref('')
const previewLoading = ref(false)
const previewError = ref('')
const fileNotFound = ref(false)
const previewType = ref<'text' | 'image' | 'unsupported' | null>(null)
const imagePreviewUrl = ref('')
const htmlPreviewUrl = ref('')
/** 释放上一张 blob 图片的句柄：object URL 不 revoke 会一直占内存（切文件/卸载都必须 revoke） */
let imagePreviewRevoke: (() => void) | null = null

/**
 * 释放当前 blob 图片并清空预览地址。
 *
 * <p>切换文件、加载出错、组件卸载都必须走这里，否则 object URL 会泄漏 ——
 * 一次会话里翻几十个文件就是几十个 blob 常驻。</p>
 */
function releaseImagePreview(): void {
    if (imagePreviewRevoke) {
        imagePreviewRevoke()
        imagePreviewRevoke = null
    }
    imagePreviewUrl.value = ''
}

onBeforeUnmount(() => {
    releaseImagePreview()
    releaseHtmlPreviewAssets()
})
const htmlPreviewVersion = ref(0)
const fileContentHash = ref('')

// ── 编辑 / 保存 ──

/** 编辑态：只有文本文件可进入，进入时强制切到源码视图 */
const editing = ref(false)
/** 编辑草稿：保存成功前不回写 fileContent，取消即丢弃 */
const draftContent = ref('')
/** 保存中：防重复提交 */
const saving = ref(false)
/** 读取时的 mtime，保存时回传做乐观锁（0 表示不做校验） */
const baseModifiedAt = ref(0)

// 缓存的工作目录绝对路径（用于 Electron file:// URL 拼接）
const cachedWorkspacePath = ref<string | null>(props.workspacePath)

watch(() => props.workspacePath, (val) => {
    if (val) cachedWorkspacePath.value = val
})

// 预览/源码模式（per-file，初始值从全局 localStorage 读取）
const globalDefaultMode = useStorage<'rendered' | 'source'>('filePreviewMode', 'rendered')
const renderMode = ref<'rendered' | 'source'>(globalDefaultMode.value)
watch(renderMode, (mode) => { globalDefaultMode.value = mode })

// Markdown iframe ref
const markdownIframeRef = ref<HTMLIFrameElement | null>(null)

// 懒加载标记
const hasLoaded = ref(false)
const isStale = ref(false)

// ── 右键上下文菜单 ──

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuItems = ref<ContextMenuItem[]>([])

// Markdown iframe 选区文本（由 iframe postMessage 同步）
const iframeSelection = ref('')

// ── 依赖初始化 ──

const { parseMarkdown } = usePreviewMarkdown()
const { highlightCode, getLanguageFromExtension, isTextFile, isImageFile } = useHighlight()

// ── 计算属性 ──

const isHtmlFile = computed(() => {
    if (!selectedFile.value) return false
    const ext = selectedFile.value.extension.toLowerCase()
    return ext === '.html' || ext === '.htm'
})

const isMarkdownFile = computed(() => {
    if (!selectedFile.value) return false
    const ext = selectedFile.value.extension.toLowerCase()
    return ext === '.md' || ext === '.markdown'
})

const canTogglePreview = computed(() => isMarkdownFile.value || isHtmlFile.value)

/** 文本文件才可编辑；图片、不支持预览的文件都不给入口 */
const canEditFile = computed(() => previewType.value === 'text' && !!selectedFile.value)

/** 草稿与已保存内容不一致（保存按钮据此禁用，避免空写） */
const editDirty = computed(() => editing.value && draftContent.value !== fileContent.value)

/** SVG 是图片预览，但同样是「可直接看渲染效果」的文件，给一个内置浏览器入口 */
const isSvgFile = computed(() => {
    if (!selectedFile.value) return false
    return selectedFile.value.extension.toLowerCase() === '.svg'
})

const canOpenInBrowser = computed(() => isHtmlFile.value || isSvgFile.value)

/** Electron file:// 预览：本地文件，无服务端鉴权，仍用 src 加载 */
const isLocalHtmlPreview = computed(
  () => isElectron && window.location.protocol === 'file:',
)

/** 仅 Electron 场景使用；HTTP 场景走 {@link htmlPreviewSrcDoc} */
const htmlPreviewSrc = computed(() => {
    if (!htmlPreviewUrl.value) return ''
    const separator = htmlPreviewUrl.value.includes('?') ? '&' : '?'
    return `${htmlPreviewUrl.value}${separator}_v=${htmlPreviewVersion.value}`
})

/**
 * HTTP 场景的 HTML 预览文档（令牌不进任何 URL）。
 *
 * <p>预览正文早已由 {@code loadFileContent} → {@code getWorkspaceFile}
 * 用鉴权请求头取回并放进 {@code fileContent}，这里再补两件事：</p>
 * <ul>
 *   <li>注入 {@code <base href>}，让 CSS/JS 的相对地址仍落到 {@code html-preview} 下；</li>
 *   <li>把图片/媒体资源换成带鉴权取回的 blob 地址 —— {@code <img>} 这类标签由浏览器
 *       自己发请求、带不上令牌，而服务端鉴权层只把 {@code .js/.css/favicon.ico}
 *       当静态资源放行，不换就是一片裂图。</li>
 * </ul>
 *
 * <p>改写要逐个取回资源，是异步的，所以用 {@code ref} + {@code watch} 而不是 computed；
 * 并发的两次改写用序号丢弃先发后到的旧结果。</p>
 */
const htmlPreviewSrcDoc = ref('')
/** 释放上一份预览文档创建的 blob（切换文件 / 重新加载 / 卸载都必须调用） */
let htmlPreviewAssetsRevoke: (() => void) | null = null
/** 构建序号：晚返回的旧改写结果直接丢弃，避免覆盖新文档 */
let htmlPreviewBuildSeq = 0

/**
 * 释放当前预览文档持有的 blob 地址并清空 srcdoc。
 *
 * <p>与 {@link releaseImagePreview} 同理：不 revoke 会让 blob 随每次预览常驻内存。</p>
 */
function releaseHtmlPreviewAssets(): void {
    if (htmlPreviewAssetsRevoke) {
        htmlPreviewAssetsRevoke()
        htmlPreviewAssetsRevoke = null
    }
    htmlPreviewSrcDoc.value = ''
}

async function rebuildHtmlPreviewSrcDoc(): Promise<void> {
    const seq = ++htmlPreviewBuildSeq
    releaseHtmlPreviewAssets()
    if (isLocalHtmlPreview.value) return
    if (!isHtmlFile.value) return
    const content = fileContent.value
    if (!content || !props.sessionId) return
    const baseUrl = apiService.getWorkspaceHtmlPreviewBaseUrl(
        props.sessionId,
        selectedFile.value?.path || '',
    )
    try {
        const built = await buildHtmlPreviewSrcDocWithAssets(content, baseUrl, loadAuthenticatedImage)
        if (seq !== htmlPreviewBuildSeq) {
            built.revoke()
            return
        }
        htmlPreviewAssetsRevoke = built.revoke
        htmlPreviewSrcDoc.value = built.html
    } catch (error) {
        console.error('[FilePreviewPanel] HTML 预览资源改写失败，退回纯 base 文档:', error)
        if (seq !== htmlPreviewBuildSeq) return
        htmlPreviewSrcDoc.value = buildHtmlPreviewSrcDoc(content, baseUrl)
    }
}

watch(
    () => [fileContent.value, selectedFile.value?.path, props.sessionId] as const,
    () => { void rebuildHtmlPreviewSrcDoc() },
    { immediate: true },
)

const markdownHtml = computed(() => {
    if (!selectedFile.value || !fileContent.value) return ''
    return parseMarkdown(fileContent.value)
})

const { isDark: isDarkMode } = useTheme()

const markdownSrcDoc = computed(() => {
    if (!markdownHtml.value || !props.sessionId) return ''

    const mdFilePath = (selectedFile.value?.path || '').replace(/\\/g, '/')
    const lastSlashIndex = mdFilePath.lastIndexOf('/')
    const mdFileDir = lastSlashIndex > 0 ? mdFilePath.substring(0, lastSlashIndex) : ''

    let baseUrl: string
    if (isElectron && window.location.protocol === 'file:' && cachedWorkspacePath.value) {
        const separator = cachedWorkspacePath.value.endsWith('/') || cachedWorkspacePath.value.endsWith('\\') ? '' : '/'
        const fullPath = (cachedWorkspacePath.value + separator + mdFileDir).replace(/\\/g, '/')
        const encodedPath = encodeURI(fullPath)
        baseUrl = encodedPath.startsWith('/') ? `file://${encodedPath}/` : `file:///${encodedPath}/`
    } else {
        baseUrl = `/api/v1/sessions/${props.sessionId}/workspace/html-preview/${mdFileDir ? mdFileDir + '/' : ''}`
    }

    return buildMarkdownSrcDoc(markdownHtml.value, baseUrl, isDarkMode.value)
})

const highlightedCode = computed(() => {
    if (!selectedFile.value || !fileContent.value) return ''
    const lang = getLanguageFromExtension(selectedFile.value.extension.toLowerCase())
    if (lang) return highlightCode(fileContent.value, lang)
    return ''
})

// ── 工具方法 ──

function hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return hash.toString(16)
}

// ── 文件加载 ──

async function loadFilePreview(): Promise<void> {
    if (!props.sessionId || props.tab.type !== 'file') return

    const tab = props.tab
    selectedFile.value = {
        name: tab.name!,
        path: tab.path!,
        extension: tab.extension!,
        size: tab.size!,
        content: '',
        mimeType: ''
    }
    previewError.value = ''
    previewLoading.value = false
    fileContentHash.value = ''
    editing.value = false
    draftContent.value = ''
    baseModifiedAt.value = 0
    releaseImagePreview()

    const ext = tab.extension!
    if (isTextFile(ext)) {
        previewType.value = 'text'
        if (isHtmlFile.value) {
            if (isElectron && window.location.protocol === 'file:') {
                await loadHtmlPreviewLocal()
            }
            // HTTP 场景不再设置任何带令牌的 src：正文走 loadFileContent 取回，
            // 由 htmlPreviewSrcDoc 以 srcdoc 渲染。
            await loadFileContent(tab.path!)
        } else if (isMarkdownFile.value) {
            if (isElectron && window.location.protocol === 'file:' && !cachedWorkspacePath.value) {
                try {
                    const resp = await apiService.getWorkspacePath(props.sessionId!)
                    cachedWorkspacePath.value = resp.workspacePath || null
                } catch { /* ignore */ }
            }
            await loadFileContent(tab.path!)
        } else {
            await loadFileContent(tab.path!)
        }
    } else if (isImageFile(ext)) {
        previewType.value = 'image'
        if (isElectron && window.location.protocol === 'file:') {
            await loadImageLocal()
        } else {
            if (tab.size && tab.size > 20 * 1024 * 1024) {
                previewError.value = t('chat.workspace.fileTooLarge')
            } else {
                // <img> 带不了请求头，但**不能**因此把令牌拼进 URL（会进历史 / 日志 / Referer）。
                // 改为带请求头取回 blob，object URL 与令牌无关。
                const rawUrl = apiService.getWorkspaceRawFileUrl(props.sessionId, tab.path!)
                releaseImagePreview()
                const loaded = await loadAuthenticatedImage(rawUrl)
                if (!loaded) {
                    previewError.value = t('chat.workspace.loadImageFailed')
                    previewType.value = null
                    return
                }
                imagePreviewRevoke = loaded.revoke
                imagePreviewUrl.value = loaded.objectUrl
            }
        }
    } else {
        previewType.value = 'unsupported'
    }
}

async function loadFileContent(filePath: string, force = false, skipLoading = false): Promise<void> {
    if (!props.sessionId) return

    if (!skipLoading) {
        previewLoading.value = true
    }
    previewError.value = ''
    fileNotFound.value = false

    try {
        const response = await apiService.getWorkspaceFile(props.sessionId, filePath)

        const newHash = hashString(response.content)

        if (!force && fileContentHash.value && newHash === fileContentHash.value) {
            previewLoading.value = false
            return
        }

        fileContentHash.value = newHash
        selectedFile.value!.content = response.content
        selectedFile.value!.extension = response.extension
        selectedFile.value!.mimeType = response.mimeType
        selectedFile.value!.modifiedAt = response.modifiedAt
        baseModifiedAt.value = response.modifiedAt || 0
        fileContent.value = response.content

        if (isHtmlFile.value && renderMode.value === 'rendered') {
            htmlPreviewVersion.value++
        }
    } catch (error: any) {
        const status = error?.response?.status
        const msg = error?.response?.data?.message || error.message || ''
        if (status === 404 || msg.includes('not found') || msg.includes('does not exist') || msg.includes('ENOENT')) {
            fileNotFound.value = true
        } else if (msg.includes('File too large') || msg.includes('too large')) {
            previewError.value = t('chat.workspace.fileTooLarge')
        } else {
            previewError.value = t('chat.workspace.loadFileFailed')
        }
        console.error('Failed to load file:', error)
    } finally {
        previewLoading.value = false
    }
}

async function loadImageLocal(): Promise<void> {
    try {
        const resp = await apiService.getWorkspacePath(props.sessionId!)
        const absWorkspacePath = resp.workspacePath
        if (!absWorkspacePath) {
            previewError.value = t('chat.workspace.workspacePathError')
            return
        }
        const relativePath = props.tab.path!.replace(/\\/g, '/')
        const separator = absWorkspacePath.endsWith('/') || absWorkspacePath.endsWith('\\') ? '' : '/'
        const fullPath = (absWorkspacePath + separator + relativePath).replace(/\\/g, '/')
        const encodedPath = encodeURI(fullPath)
        const fileUrl = encodedPath.startsWith('/') ? `file://${encodedPath}` : `file:///${encodedPath}`
        imagePreviewUrl.value = fileUrl
    } catch (error: any) {
        previewError.value = t('chat.workspace.loadImageFailed')
        console.error('[FilePreviewPanel] Failed to load image locally:', error)
    }
}

async function loadHtmlPreviewLocal(): Promise<void> {
    try {
        const resp = await apiService.getWorkspacePath(props.sessionId!)
        const absWorkspacePath = resp.workspacePath
        if (!absWorkspacePath) {
            previewError.value = t('chat.workspace.workspacePathError')
            return
        }
        const relativePath = props.tab.path!.replace(/\\/g, '/')
        const separator = absWorkspacePath.endsWith('/') || absWorkspacePath.endsWith('\\') ? '' : '/'
        const fullPath = (absWorkspacePath + separator + relativePath).replace(/\\/g, '/')
        const encodedPath = encodeURI(fullPath)
        const fileUrl = encodedPath.startsWith('/') ? `file://${encodedPath}` : `file:///${encodedPath}`
        htmlPreviewUrl.value = fileUrl
    } catch (error: any) {
        previewError.value = t('chat.workspace.loadHtmlFailed')
        console.error('[FilePreviewPanel] Failed to load HTML locally:', error)
    }
}

// ── 操作方法 ──

function handleManualRefresh(): void {
    if (!selectedFile.value) return
    loadFileContent(selectedFile.value.path, true, false)
}

/**
 * 进入编辑态。
 *
 * <p>Markdown / HTML 默认停在「渲染」视图，编辑器只认源码，这里强制切到源码，
 * 否则用户点编辑看到的还是渲染结果。</p>
 */
function startEdit(): void {
    if (!canEditFile.value) return
    draftContent.value = fileContent.value
    editing.value = true
    renderMode.value = 'source'
}

/** 放弃草稿（保存中不允许取消，避免请求还在飞就把状态清掉） */
function cancelEdit(): void {
    if (saving.value) return
    editing.value = false
    draftContent.value = ''
}

/**
 * 保存草稿。
 *
 * <p>带上读取时的 mtime：期间 AI 或终端改过该文件，后端返回 409，这里只提示
 * 「刷新后合并」，绝不静默覆盖别人的写入。</p>
 */
async function saveEdit(): Promise<void> {
    if (!selectedFile.value || !props.sessionId || saving.value) return
    if (!editDirty.value) {
        editing.value = false
        draftContent.value = ''
        return
    }
    saving.value = true
    try {
        const resp = await apiService.saveWorkspaceFile(
            props.sessionId,
            selectedFile.value.path,
            draftContent.value,
            baseModifiedAt.value || undefined,
        )
        fileContent.value = draftContent.value
        selectedFile.value.content = draftContent.value
        selectedFile.value.size = resp.size
        selectedFile.value.modifiedAt = resp.modifiedAt
        baseModifiedAt.value = resp.modifiedAt || 0
        fileContentHash.value = hashString(draftContent.value)
        editing.value = false
        draftContent.value = ''
        message.success(t('chat.workspace.saveFileSuccess'))
    } catch (error: any) {
        const status = error?.response?.status
        const msg = error?.response?.data?.message || error?.message || ''
        message.error(status === 409 ? t('chat.workspace.saveFileConflict') : (msg || t('chat.workspace.saveFileFailed')))
        console.error('[FilePreviewPanel] Save failed:', error)
    } finally {
        saving.value = false
    }
}

/**
 * 在内置浏览器中打开当前 HTML / SVG 文件。
 *
 * <p>用 data URL 交给内置浏览器：文件正文已由带鉴权请求头的
 * {@link loadFileContent} 取回，地址里不拼任何令牌；HTML / SVG 都是文本，
 * data URL 足够，也不存在 object URL 在标签未关时被 revoke 的生命周期问题。</p>
 */
async function handleOpenInBrowser(): Promise<void> {
    if (!selectedFile.value || !props.sessionId) return
    let content = fileContent.value
    if (!content) {
        // SVG 走的是图片 blob 预览，正文不在 fileContent 里，这里补读一次
        try {
            const resp = await apiService.getWorkspaceFile(props.sessionId, selectedFile.value.path)
            content = resp.content
        } catch (error) {
            console.error('[FilePreviewPanel] Read file for browser preview failed:', error)
            message.error(t('chat.workspace.loadFileFailed'))
            return
        }
    }
    const mime = isHtmlFile.value ? 'text/html' : 'image/svg+xml'
    const url = `data:${mime};charset=utf-8,${encodeURIComponent(content)}`
    const { previewUrl } = await import('@/utils/workspacePreview')
    await previewUrl(url)
}

function onImageError(event: Event | string): void {
    const src = (typeof event === 'object' && (event as Event).target instanceof HTMLImageElement)
        ? (event.target as HTMLImageElement).getAttribute('src')
        : imagePreviewUrl.value
    console.error('[FilePreviewPanel] Image load failed, URL:', src)
    previewError.value = isElectron ? t('chat.workspace.imageLoadFailed') : t('chat.workspace.fileTooLarge')
}

async function handleOpenInExplorerForCurrent(): Promise<void> {
    if (!selectedFile.value || !props.sessionId || !isElectron) return
    try {
        const resp = await apiService.getWorkspacePath(props.sessionId)
        const wsPath = resp.workspacePath
        if (!wsPath) {
            message.error(t('chat.workspace.workspacePathError'))
            return
        }
        const relativePath = selectedFile.value.path.replace(/\\/g, '/')
        const separator = wsPath.endsWith('/') || wsPath.endsWith('\\') || relativePath.startsWith('/') ? '' : '/'
        let fullPath = wsPath + separator + relativePath
        const lastSep = Math.max(fullPath.lastIndexOf('/'), fullPath.lastIndexOf('\\'))
        if (lastSep > 0) {
            fullPath = fullPath.substring(0, lastSep)
        }
        await window.electronAPI!.openFolder(fullPath)
    } catch (error: any) {
        console.error('[FilePreviewPanel] Open in explorer failed:', error)
        message.error(t('chat.workspace.openFailed'))
    }
}

// ── Markdown iframe 消息处理 ──

function onMarkdownMessage(e: MessageEvent): void {
    if (!e.data || typeof e.data !== 'object') return
    // 仅处理来自当前面板 iframe 的消息
    if (!markdownIframeRef.value || e.source !== markdownIframeRef.value.contentWindow) return

    const data = e.data
    if (data.type === 'md-preview-link' && data.url) {
        import('@/utils/workspacePreview').then(({ openLink }) => openLink(data.url))
    } else if (data.type === 'md-preview-selection') {
        iframeSelection.value = data.text || ''
    } else if (data.type === 'md-preview-contextmenu') {
        // 将 iframe 内坐标转换为父页面坐标
        const rect = markdownIframeRef.value.getBoundingClientRect()
        showContextMenu(rect.left + data.x, rect.top + data.y, data.text || '')
    }
}

// ── 选区提取 + Snip 构建 ──

const MAX_SNIPPET_CONTENT = 2000
const SNIPPET_HEAD = 800

/** UTF-8 安全的 base64 编码 */
function encodeBase64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)))
}

/** 从高亮代码选区中提取行号和原始文本（保留缩进） */
function getCodeSelectionInfo(selection: Selection): { start?: number; end?: number; text?: string } {
    if (!selection.rangeCount || selection.isCollapsed) return {}
    const range = selection.getRangeAt(0)

    function findLineEl(node: Node): HTMLElement | null {
        let el = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement
        while (el && !el.classList?.contains('line')) {
            el = el.parentElement
        }
        return el
    }

    const startLineEl = findLineEl(range.startContainer)
    const endLineEl = findLineEl(range.endContainer)

    let start: number | undefined
    let end: number | undefined

    if (startLineEl) {
        const startText = startLineEl.querySelector('.line-num')?.textContent
        const endText = endLineEl?.querySelector('.line-num')?.textContent
        if (startText) {
            start = parseInt(startText)
            end = endText ? parseInt(endText) : start
        }
    }

    // 提取选区文本：遍历 .line-content 元素的 textContent 以保留原始缩进
    const container = startLineEl?.parentElement // .code-lines
    if (container) {
        const allLines = container.querySelectorAll(':scope > .line')
        const lines: string[] = []
        allLines.forEach((lineEl) => {
            const lineNum = lineEl.querySelector('.line-num')?.textContent
            if (!lineNum) return
            const num = parseInt(lineNum)
            const content = lineEl.querySelector('.line-content')?.textContent || ''
            const inRange = start && end
                ? (num >= Math.min(start, end) && num <= Math.max(start, end))
                : false
            if (inRange) lines.push(content)
        })
        if (lines.length > 0) {
            return { start, end, text: lines.join('\n') }
        }
    }

    // Fallback: 通过偏移量在 <pre> 中计算行号
    const preEl = (range.startContainer as HTMLElement).closest?.('pre')
        || range.startContainer.parentElement?.closest('pre')
    if (preEl) {
        const preRange = document.createRange()
        preRange.selectNodeContents(preEl)
        preRange.setEnd(range.startContainer, range.startOffset)
        const beforeText = preRange.toString()
        const startLine = beforeText.split('\n').length
        const selectedText = selection.toString()
        const endLine = startLine + selectedText.split('\n').length - 1
        return { start: startLine, end: endLine, text: selectedText }
    }

    return {}
}

/** 构造 SnipData */
function buildSnipData(selectedText: string, startLine?: number, endLine?: number): SnipData | null {
    if (!selectedFile.value) return null

    const path = selectedFile.value.path.replace(/\\/g, '/')
    const fileName = selectedFile.value.name
    const rangeLabel = startLine && endLine
        ? (startLine === endLine ? `L${startLine}` : `L${startLine}-L${endLine}`)
        : (startLine ? `L${startLine}` : '')
    const label = rangeLabel ? `${path}:${rangeLabel}` : path

    let payload: string
    if (selectedText.length <= MAX_SNIPPET_CONTENT) {
        payload = selectedText
    } else {
        const head = selectedText.substring(0, SNIPPET_HEAD)
        const fileRef = `file:${path}${rangeLabel ? `:${rangeLabel}` : ''}`
        payload = `${head}\n\n<system_reminder>The selected text has been truncated. If you need the full content, read the file at ${fileRef}.</system_reminder>`
    }

    const data: SnipData = {
        path,
        fileName,
        label,
        content: encodeBase64(payload),
    }

    if (startLine) data.startLine = startLine
    if (endLine) data.endLine = endLine

    return data
}

/** 显示右键上下文菜单 */
function showContextMenu(x: number, y: number, selectedText: string, startLine?: number, endLine?: number) {
    const hasSelection = selectedText.trim().length > 0
    const items: ContextMenuItem[] = []

    if (hasSelection) {
        items.push({
            label: t('chat.workspace.addSelectionToSession'),
            icon: DocumentCopy,
            onClick: () => {
                const snip = buildSnipData(selectedText, startLine, endLine)
                if (snip) emit('insert-snip', snip)
            },
        })
        items.push({
            label: t('chat.workspace.addFileToSession'),
            icon: Plus,
            divider: true,
            onClick: () => {
                if (selectedFile.value) emit('insert-to-input', selectedFile.value.path)
            },
        })
    } else {
        items.push({
            label: t('chat.workspace.addFileToSession'),
            icon: Plus,
            onClick: () => {
                if (selectedFile.value) emit('insert-to-input', selectedFile.value.path)
            },
        })
    }

    contextMenuItems.value = items
    contextMenuX.value = x
    contextMenuY.value = y
    contextMenuVisible.value = true
}

/** 右键事件处理（代码预览 / 纯文本预览） */
function handleContextMenu(event: MouseEvent) {
    const selection = window.getSelection()
    const selectedText = selection?.toString() || ''

    if (selectedText.trim()) {
        const info = getCodeSelectionInfo(selection!)
        const text = info.text || selectedText
        showContextMenu(event.clientX, event.clientY, text, info.start, info.end)
    } else {
        // Markdown iframe 的右键由 postMessage 触发，不走这里
        // 非选区右键仍可添加文件
        showContextMenu(event.clientX, event.clientY, '')
    }
}

// ── 生命周期 ──

onMounted(() => {
    window.addEventListener('message', onMarkdownMessage)
    if (props.isActive) {
        hasLoaded.value = true
        loadFilePreview()
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('message', onMarkdownMessage)
})

// ── Watch：懒加载 + 文件变更 ──

watch(() => props.isActive, async (active) => {
    if (!active) return

    if (!hasLoaded.value) {
        hasLoaded.value = true
        await loadFilePreview()
    } else if (isStale.value) {
        isStale.value = false
        // 编辑中不覆盖草稿：等保存或取消后再刷新
        if (editing.value) return
        await loadFileContent(props.tab.path!, false, true)
    }
})

watch(() => props.contentVersion, (newVer, oldVer) => {
    if (oldVer === 0 || newVer <= oldVer) return
    // 编辑中遇到外部改动（AI/终端写盘）只标记 stale，不动用户草稿
    if (editing.value) {
        isStale.value = true
        return
    }
    if (props.isActive) {
        loadFileContent(props.tab.path!, false, true)
    } else {
        isStale.value = true
    }
})
</script>

<style>
.code-editor {
    tab-size: 4;
    -moz-tab-size: 4;
}

.code-preview-container pre code.hljs {
    color: var(--color-text, #333) !important;
    background-color: transparent !important;
}

.code-preview-container pre {
    margin: 0;
    padding: 0;
    overflow: visible;
}

.code-preview-container code.hljs {
    overflow: visible;
}

/* per-line 布局：每行 flex row，行号 sticky 固定 + 代码折行 */
.code-lines {
    display: flex;
    flex-direction: column;
}

.line {
    display: flex;
    align-items: stretch;
    min-height: 1.5em;
}

.line-num {
    display: flex;
    flex-shrink: 0;
    align-self: stretch;
    box-sizing: content-box;
    user-select: none;
    text-align: right;
    padding-right: 0.75em;
    color: #9ca3af;
    font-variant-numeric: tabular-nums;
    border-right: 1px solid #e5e7eb;
    /* sticky 固定行号：横向滚动时钉在左侧 */
    position: sticky;
    left: 0;
    z-index: 1;
    /* 背景色防止代码透过行号显示 */
    background: var(--color-bg, #fff);
}

.dark .line-num {
    color: #4b5563;
    border-right-color: #374151;
    background: var(--color-bg, #222);
}

.line-content {
    white-space: pre-wrap;
    word-break: break-all;
    padding-left: 1em;
    min-width: 800px;
}
</style>

<style scoped>
/* ============================================================================
   令牌口径（仅本 <style scoped> 块）：
   1. 上面那个非 scoped 的 <style> 块是给 v-html 注入的高亮 DOM 用的，
      属于「语法高亮配色」，按口径要求整体保留原样，不做任何令牌化。
   2. 本块里 var(--color-sidebar-bg-hover) 在 refactor.css 中并不存在，
      整条 background 声明因 var() 无法解析而被丢弃 —— 也就是说两个按钮
      的 hover 底色一直没有生效。改用 --el-fill-color-light 后才真的能悬停变色。
   3. 两个按钮原本写了 outline: none 却没有任何替代焦点样式，键盘用户完全看不到焦点，
      本轮补 :focus-visible 主色光环。
   ============================================================================ */
.code-preview-container {
    overflow-y: auto;
    overflow-x: auto;
    flex: 1;
    min-width: 0;
    min-height: 0;
    background-color: transparent;
}

/* 预览/源码模式切换按钮 */
.preview-mode-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    /* 原值 4px → xs 档 */
    border-radius: var(--el-radius-xs, 4px);
    cursor: pointer;
    background: transparent;
    /* 原值 var(--color-text-gray) → 次级文字色令牌 */
    color: var(--el-text-color-secondary);
    transition:
        background-color var(--el-transition-duration-fast, 0.2s) ease,
        color var(--el-transition-duration-fast, 0.2s) ease;
    outline: none;
}

/* 键盘焦点环：24px 的小图标按钮上默认 outline 太弱 */
.preview-mode-btn:focus-visible,
.preview-close-btn:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.preview-mode-btn:hover {
    background: var(--el-fill-color-light);
}

.preview-mode-btn.is-active {
    /* 原值 var(--color-text) → 主文字色令牌 */
    color: var(--el-text-color-primary);
    /* 原值 var(--color-bg) → 页面底色令牌（分段控件的「选中」需要比槽底更亮） */
    background: var(--el-bg-color);
    /* 分段控件选中指示：极浅投影 + 1px 描边，属允许的「选中」标识而非卡片投影 */
    box-shadow: 0 1px 2px color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
}

/* 关闭预览按钮 */
.preview-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    /* 原值 4px → xs 档 */
    border-radius: var(--el-radius-xs, 4px);
    cursor: pointer;
    background: transparent;
    /* 原值 var(--color-text) → 主文字色令牌 */
    color: var(--el-text-color-primary);
    transition:
        background-color var(--el-transition-duration-fast, 0.2s) ease,
        color var(--el-transition-duration-fast, 0.2s) ease;
    outline: none;
}

.preview-close-btn:hover {
    background: var(--el-fill-color-light);
}

/* 尊重系统「减少动态效果」偏好。
   「源码」选中态靠底色 + 极浅投影表达，关掉过渡后仍然可辨。 */
@media (prefers-reduced-motion: reduce) {
    .preview-mode-btn,
    .preview-close-btn {
        transition: none;
    }
}
</style>
