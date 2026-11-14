<!-- components/KBFileUploader.vue -->
<template>
    <div class="">
        <!-- 上传按钮组：ReButton(square) 纯图标方形按钮，内建 el-tooltip；
             无底色、无边框（.kb-btn 幽灵态由详情页统一定义），贴合排列仅留 6px 空隙 -->
        <div class="kb-up-actions">
            <!-- 新建文件夹按钮 -->
            <ReSquareButton layout="square" class="kb-btn" :icon="FolderAdd16Regular" tip="新建文件夹"
                @click="showCreateFolderDialog = true" />

            <!-- 上传文件按钮 -->
            <input ref="fileInputRef" type="file" multiple :accept="ALLOWED_FILE_EXTENSIONS" @change="handleFileSelect"
                class="hidden" />
            <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="UploadFilled" tip="上传文件"
                @click="triggerFileInput" />

            <!-- 上传文件夹按钮 -->
            <input ref="folderInputRef" type="file" webkitdirectory directory multiple @change="handleFolderSelect"
                class="hidden" />
            <ReSquareButton layout="square" class="kb-btn" :icon="FolderOpened" tip="上传文件夹"
                @click="triggerFolderInput" />

            <!-- 新建 Markdown 文档（直接按文本写入，不占上传任务队列） -->
            <ReSquareButton layout="square" class="kb-btn" :icon="DocumentAdd16Regular" tip="新建 Markdown"
                @click="openMarkdownDialog" />

            <!-- 从网页导入（抓取正文落成 Markdown） -->
            <ReSquareButton layout="square" class="kb-btn" :icon="Link" tip="从网页导入"
                @click="openWebDialog" />

            <!-- 上传任务按钮(仅在有任务时显示；角标显示队列数量) -->
            <ReBadge v-if="uploadTasks.length > 0" :value="uploadTasks.length" :max="99" class="kb-up-badge">
                <ReSquareButton layout="square" class="kb-btn" :icon="Upload" tip="上传任务"
                    @click="emit('show-upload-task')" />
            </ReBadge>
        </div>

        <!-- 新建文件夹对话框 -->
        <ReDialog v-model="showCreateFolderDialog" :title="t('knowledge.upload.newFolderTitle')" :width="400" :close-on-click-modal="false">
            <ReInput
                v-model="newFolderName"
                :placeholder="t('knowledge.upload.folderNamePlaceholder')"
                @keyup.enter="confirmCreateFolder"
            />
            <template #footer>
                <ReButton type="default" @click="showCreateFolderDialog = false">{{ t('common.cancel') }}</ReButton>
                <ReButton type="primary" @click="confirmCreateFolder" :loading="createFolderLoading">{{ t('common.ok') }}</ReButton>
            </template>
        </ReDialog>

        <!-- 冲突处理对话框 -->
        <ReDialog v-model="showConflictDialog" :title="t('knowledge.upload.conflictTitle')" :width="600" :close-on-click-modal="false">
            <div class="space-y-4">
                <p class="text-sm text-[var(--rm-text-secondary)]">
                    {{ t('knowledge.upload.conflictDesc') }}
                </p>

                <div class="max-h-80 overflow-y-auto space-y-2">
                    <div v-for="conflict in conflicts" :key="conflict.relativePath"
                        class="flex items-center gap-3 p-3 rounded-[var(--rm-radius-md,8px)] bg-[var(--rm-bg-subtle)] border border-[var(--rm-border-light)]">
                        <el-icon size="20" :class="conflict.type === 'directory' ? 'text-[var(--rm-warning)]' : 'text-[var(--rm-primary)]'">
                            <Folder v-if="conflict.type === 'directory'" />
                            <Document v-else />
                        </el-icon>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-[var(--rm-text)] truncate">
                                {{ conflict.originalName }}
                            </div>
                            <div class="text-xs text-[var(--rm-text-secondary)]">
                                {{ conflict.type === 'directory' ? t('knowledge.upload.conflictDir') : t('knowledge.upload.conflictFile') }}{{ t('knowledge.upload.conflictExists') }}
                            </div>
                            <div v-if="conflictMode === 'keep-both'" class="text-xs text-[var(--rm-success)] mt-1">
                                {{ t('knowledge.upload.conflictRenameTo', { name: conflict.suggestedName }) }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <!-- layout="el"：两行「标题 + 说明」竖排，用原生单选样式，由页面 flex-col gap-3 控制间距 -->
                    <ReRadioGroup v-model="conflictMode" layout="el" class="flex flex-col gap-3">
                        <ReRadio value="overwrite" size="large">
                            <div class="flex flex-col">
                                <span class="font-medium">{{ t('knowledge.upload.conflictOverwrite') }}</span>
                                <span class="text-xs text-[var(--rm-text-secondary)]">{{ t('knowledge.upload.conflictOverwriteDesc') }}</span>
                            </div>
                        </ReRadio>
                        <ReRadio value="keep-both" size="large">
                            <div class="flex flex-col">
                                <span class="font-medium">{{ t('knowledge.upload.conflictKeepBoth') }}</span>
                                <span class="text-xs text-[var(--rm-text-secondary)]">{{ t('knowledge.upload.conflictKeepBothDesc') }}</span>
                            </div>
                        </ReRadio>
                    </ReRadioGroup>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <ReButton type="default" @click="showConflictDialog = false">{{ t('common.cancel') }}</ReButton>
                    <ReButton type="primary" @click="handleConflictConfirm">{{ t('common.ok') }}</ReButton>
                </div>
            </template>
        </ReDialog>

        <!-- 新建 Markdown 文档 -->
        <ReDialog v-model="showMarkdownDialog" title="新建 Markdown 文档" :width="560" :close-on-click-modal="false">
            <div class="flex flex-col gap-3">
                <ReInput v-model="mdName" placeholder="文件名（无需扩展名，自动补 .md）" @keyup.enter="confirmMarkdown" />
                <ReInput
                    v-model="mdContent"
                    type="textarea"
                    :rows="12"
                    placeholder="在此撰写 Markdown 内容，保存后立即入库并可检索"
                />
                <div class="text-xs text-[var(--rm-text-disabled)]">
                    保存位置：{{ props.currentFolderPath || '根目录' }}
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3">
                    <ReButton type="default" @click="showMarkdownDialog = false">{{ t('common.cancel') }}</ReButton>
                    <ReButton type="primary" :loading="savingMarkdown" @click="confirmMarkdown">保存</ReButton>
                </div>
            </template>
        </ReDialog>

        <!-- 从网页导入 -->
        <ReDialog v-model="showWebDialog" title="从网页导入" :width="520" :close-on-click-modal="false">
            <div class="flex flex-col gap-3">
                <ReInput v-model="webUrl" placeholder="https://example.com/article" @keyup.enter="confirmWebImport" />
                <div class="flex items-center gap-2">
                    <span class="text-xs text-[var(--rm-text-secondary)]">最多抓取页数</span>
                    <ReNumberInput v-model="webMaxPages" :min="1" :max="50" controls-position="right" size="small" />
                    <span class="text-xs text-[var(--rm-text-disabled)]">1 = 只抓当前页；&gt;1 按同域链接展开</span>
                </div>
                <ReInput v-model="webDir" placeholder="保存目录（默认 web）" />
                <div class="text-xs text-[var(--rm-text-disabled)]">
                    正文会落成 Markdown 并立即建立索引；仅允许公网地址（内网地址会被拒绝）
                </div>
                <div v-if="webResult" class="text-xs text-[var(--rm-success)]">
                    成功 {{ webResult.added?.length || 0 }} 篇{{ webResult.failed?.length ? '，失败 ' + webResult.failed.length + ' 篇' : '' }}
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-3">
                    <ReButton type="default" @click="showWebDialog = false">{{ t('common.cancel') }}</ReButton>
                    <ReButton type="primary" :loading="importingWeb" @click="confirmWebImport">导入</ReButton>
                </div>
            </template>
        </ReDialog>
    </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Upload, UploadFilled, Folder, FolderOpened, Document, Link } from '@element-plus/icons-vue'
import { DocumentAdd16Regular, FolderAdd16Regular } from '@vicons/fluent'

import { useFileUploadStore } from '@/stores/fileUpload'
import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'
import type { UploadTask } from '@/stores/fileUpload'
import type { KBFile } from '@/stores/knowledgeBase'
import ReDialog from '@repo/ui/re-dialog'
import ReSquareButton from '@repo/ui/re-button'
import ReInput from '@repo/ui/re-input'
import ReBadge from '@repo/ui/re-badge'
import ReButton from '@/components/ui/ReButton.vue'
import { knowledgeBaseApi } from '@/services/modules/knowledge-base.api'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'
import { ReRadioGroup, ReRadio } from '@repo/ui/re-kit'

/**
 * 上传冲突信息
 */
interface UploadConflict {
    type: 'file' | 'directory'
    originalName: string          // 原始名称
    suggestedName: string         // 建议的新名称（加时间戳）
    relativePath: string          // 完整相对路径
    existingItem?: KBFile         // 已存在的文件/目录信息
}

interface Props {
    kbId: string
    currentFolderPath?: string | null  // 当前文件夹路径（可选）
    getCurrentFiles?: () => KBFile[]  // 获取当前目录文件列表的函数（可选）
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'uploaded', task: UploadTask): void
    (e: 'show-upload-task'): void  // 新增: 触发显示上传任务弹窗
    (e: 'folder-created'): void  // 新增: 文件夹创建成功事件
}>()

const { t } = useI18n()

// ==================== 新建 Markdown 文档 ====================
// 直接按文本写入知识库（复用 PUT /bases/{id}/file），不走上传任务队列：
// 这类内容天然是文本，走队列只会让用户多等一次「上传中」。
const showMarkdownDialog = ref(false)
const mdName = ref('')
const mdContent = ref('')
const savingMarkdown = ref(false)

/** 打开新建 Markdown 弹窗（每次重置，避免带入上次内容） */
function openMarkdownDialog() {
    mdName.value = ''
    mdContent.value = ''
    showMarkdownDialog.value = true
}

/** 保存 Markdown：自动补 .md 后缀并写入当前目录 */
async function confirmMarkdown() {
    const base = mdName.value.trim().replace(/\.md$/i, '')
    if (!base) {
        message.warning('请输入文件名')
        return
    }
    if (base.length > 80) {
        message.warning('文件名过长（最多 80 字）')
        return
    }
    savingMarkdown.value = true
    try {
        const file = new File([mdContent.value || ''], `${base}.md`, { type: 'text/markdown' })
        await knowledgeBaseApi.uploadKBFile(props.kbId, file, props.currentFolderPath || null)
        message.success('已保存')
        showMarkdownDialog.value = false
        // 复用「目录已变更」信号刷新文件树（父组件据此 forceReload）
        emit('folder-created')
    } catch (e: any) {
        message.error('保存失败: ' + (e?.message || ''))
    } finally {
        savingMarkdown.value = false
    }
}

// ==================== 从网页导入 ====================
// 抓取正文落成 Markdown 并建立索引；与知识库「来源（URL 抓取）」的区别：
// 那是有状态的长效同步配置，这里是「添加一条」的一次性动作。
const showWebDialog = ref(false)
const webUrl = ref('')
const webMaxPages = ref(1)
const webDir = ref('web')
const importingWeb = ref(false)
const webResult = ref<any>(null)

/** 打开从网页导入弹窗 */
function openWebDialog() {
    webUrl.value = ''
    webMaxPages.value = 1
    webDir.value = 'web'
    webResult.value = null
    showWebDialog.value = true
}

/** 抓取并入库 */
async function confirmWebImport() {
    const url = webUrl.value.trim()
    if (!/^https?:\/\//i.test(url)) {
        message.warning('请输入 http(s) 开头的网址')
        return
    }
    importingWeb.value = true
    webResult.value = null
    try {
        const res: any = await knowledgeBaseApi.addKnowledgeWebPage(props.kbId, {
            url,
            maxPages: webMaxPages.value,
            path: webDir.value.trim() || 'web',
        })
        webResult.value = res || null
        message.success(`导入完成：成功 ${res?.added?.length || 0} 篇`)
        emit('folder-created')
    } catch (e: any) {
        message.error('导入失败: ' + (e?.message || ''))
    } finally {
        importingWeb.value = false
    }
}

const uploadStore = useFileUploadStore()
const kbStore = useKnowledgeBaseStore()
const fileInputRef = ref<HTMLInputElement>()
const folderInputRef = ref<HTMLInputElement>()  // 新增: 文件夹输入框引用

// 新建文件夹相关状态
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const createFolderLoading = ref(false)

// 冲突处理相关状态
const showConflictDialog = ref(false)
const conflictMode = ref<'overwrite' | 'keep-both'>('keep-both')
const pendingFiles = ref<Array<{ file: File, relativePath: string }>>([])
const conflicts = ref<UploadConflict[]>([])

// 定义允许的文件扩展名(与 ChatInput 保持一致)
const ALLOWED_EXTENSIONS = [
    '.txt', '.md', '.js', '.ts', '.html', '.css', '.json', '.xml', '.csv', '.log',
    '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.sql', '.sh',
    '.bat', '.yml', '.yaml', '.ini', '.conf', '.properties', '.vue', '.toml',
    '.env', '.cfg', '.config', '.reg', '.pem', '.tex', '.rst', '.adoc', '.org',
    '.swift', '.kt', '.scala', '.dart', '.ex', '.r', '.jl', '.ps1', '.vbs', '.fish',
    '.j2', '.ejs', '.hbs', '.lock', '.patch', '.diff', '.ics', '.vcf', '.srt',
    '.proto', '.graphql', '.sol', '.pdf',
    '.docx',  // Word 文档
    '.xlsx',  // Excel 文档
    '.dts', '.dtsi'   // 设备树源文件
]

// HTML input accept 属性格式(逗号分隔)
const ALLOWED_FILE_EXTENSIONS = ALLOWED_EXTENSIONS.join(',')

// ========== Computed ==========
const uploadTasks = computed(() =>
    uploadStore.getTasksByKB(props.kbId)
)

// ========== 工具函数 ==========

/**
 * 生成时间戳后缀（格式：YYYYMMDDHHmm）
 */
function generateTimestampSuffix(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    return `${year}${month}${day}${hour}${minute}`
}

/**
 * 为“都保留”模式生成新名称
 * @param name 原始名称
 * @param isDirectory 是否为目录
 * @returns 重命名后的名称
 */
function renameForKeepBoth(name: string, isDirectory: boolean): string {
    const timestamp = generateTimestampSuffix()
    
    if (isDirectory) {
        return `${name}_${timestamp}`
    } else {
        // 文件：在扩展名前插入时间戳
        const lastDotIndex = name.lastIndexOf('.')
        if (lastDotIndex === -1) {
            return `${name}_${timestamp}`
        }
        const baseName = name.substring(0, lastDotIndex)
        const extension = name.substring(lastDotIndex)
        return `${baseName}_${timestamp}${extension}`
    }
}

/**
 * 检测上传冲突
 * @param filesToUpload 待上传的文件列表
 * @param currentItems 当前目录下的文件/目录列表
 * @returns 冲突列表（已去重）
 */
function detectUploadConflicts(
    filesToUpload: Array<{ file: File, relativePath: string }>,
    currentItems: KBFile[]
): UploadConflict[] {
    const conflicts: UploadConflict[] = []
    const checkedPaths = new Set<string>()  // 用于去重
    
    for (const { file, relativePath } of filesToUpload) {
        // 提取需要检查的名称和路径
        let checkName: string
        let checkPath: string  // 用于去重的键
        let isDirectory = false
        
        if (relativePath.includes('/')) {
            // 文件夹上传：只检查顶级目录
            const parts = relativePath.split('/')
            checkName = parts[0]
            checkPath = checkName  // 用顶级目录名作为键
            isDirectory = true
        } else {
            // 单文件上传：检查文件名
            checkName = relativePath
            checkPath = relativePath  // 用完整路径作为键
            isDirectory = false
        }
        
        // 跳过已检查的路径
        if (checkedPaths.has(checkPath)) {
            continue
        }
        checkedPaths.add(checkPath)
        
        // 检查当前目录是否存在同名项
        const existingItem = currentItems.find(item => 
            item.displayName === checkName && 
            item.isDirectory === isDirectory
        )
        
        if (existingItem) {
            conflicts.push({
                type: isDirectory ? 'directory' : 'file',
                originalName: checkName,
                suggestedName: renameForKeepBoth(checkName, isDirectory),
                relativePath: checkPath,  // 存储检查路径，而非原始文件路径
                existingItem
            })
        }
    }
    
    return conflicts
}

/**
 * 应用冲突解决方案（重命名）
 * @param filesToUpload 待上传的文件列表
 * @param conflicts 冲突列表
 * @param mode 冲突处理模式
 * @returns 处理后的文件列表（包含重命名后的 File 对象）
 */
function applyConflictResolution(
    filesToUpload: Array<{ file: File, relativePath: string }>,
    conflicts: UploadConflict[],
    mode: 'overwrite' | 'keep-both'
): Array<{ file: File, relativePath: string }> {
    console.log('[DEBUG] applyConflictResolution 被调用')
    console.log('[DEBUG] mode:', mode)
    console.log('[DEBUG] conflicts:', conflicts)
    
    if (mode === 'overwrite') {
        console.log('[DEBUG] 覆盖模式，直接返回原文件列表')
        return filesToUpload
    }
    
    // 构建冲突映射：checkPath → newName
    const conflictMap = new Map<string, string>()
    conflicts.forEach(conflict => {
        conflictMap.set(conflict.relativePath, conflict.suggestedName)
        console.log(`[DEBUG] 添加冲突映射: ${conflict.relativePath} → ${conflict.suggestedName}`)
    })
    
    console.log('[DEBUG] conflictMap:', Array.from(conflictMap.entries()))
    
    const result = filesToUpload.map(({ file, relativePath }) => {
        console.log(`[DEBUG] 处理文件: ${relativePath}`)
        
        // 提取检查路径
        let checkPath: string
        let newName: string | null = null
        
        if (relativePath.includes('/')) {
            const parts = relativePath.split('/')
            checkPath = parts[0]
            console.log(`[DEBUG]   → 文件夹，checkPath: ${checkPath}`)
        } else {
            checkPath = relativePath
            console.log(`[DEBUG]   → 单文件，checkPath: ${checkPath}`)
        }
        
        if (conflictMap.has(checkPath)) {
            // 需要重命名
            newName = conflictMap.get(checkPath)!
            console.log(`[DEBUG]   → 检测到冲突，重命名为: ${newName}`)
            
            if (relativePath.includes('/')) {
                // 文件夹：替换顶级目录名
                const parts = relativePath.split('/')
                const oldTopDir = parts[0]
                parts[0] = newName  // 只替换第一层
                const newPath = parts.join('/')
                console.log(`[DEBUG]   → 新路径: ${newPath}`)
                
                // 关键修复:对于文件夹中的文件，不需要修改 File.name
                // 因为后端会根据 relativePath 创建目录结构
                // File.name 保持原样即可
                return { file, relativePath: newPath }
            } else {
                // 单文件：直接使用新名称
                console.log(`[DEBUG]   → 新路径: ${newName}`)
                
                // 关键修复:创建新的 File 对象，使用重命名后的文件名
                const renamedFile = new File([file], newName, { type: file.type })
                return { file: renamedFile, relativePath: newName }
            }
        }
        
        console.log(`[DEBUG]   → 无冲突，保持原路径`)
        return { file, relativePath }
    })
    
    console.log('[DEBUG] applyConflictResolution 完成，返回:', result.map(f => f.relativePath))
    return result
}

// ========== Methods ==========

/**
 * 触发文件选择
 */
function triggerFileInput() {
    fileInputRef.value?.click()
}

/**
 * 触发文件夹选择
 */
function triggerFolderInput() {
    folderInputRef.value?.click()
}

// 空态主按钮复用同一套选择 + 上传流程：父组件只调这里，不重写上传逻辑
defineExpose({ triggerFileInput, triggerFolderInput })

/**
 * 处理文件选择(普通文件上传)
 */
async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    // 过滤文件,只保留允许的格式
    const filesWithPath = Array.from(input.files)
        .filter(file => {
            const fileName = file.name.toLowerCase()
            const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
            return hasAllowedExtension
        })
        .map(file => {
            // 关键修复:拼接当前文件夹路径
            const relativePath = props.currentFolderPath 
                ? `${props.currentFolderPath}/${file.name}`
                : file.name
            return {
                file,
                relativePath
            }
        })

    // 计算被过滤掉的文件数量
    const filteredCount = input.files.length - filesWithPath.length

    if (filesWithPath.length === 0) {
        message.warning(t('knowledge.upload.unsupportedFormat'))
        input.value = ''
        return
    }

    if (filteredCount > 0) {
        // message.info(`检测到 ${input.files.length} 个文件，其中 ${filteredCount} 个不支持的格式已过滤，将上传 ${filesWithPath.length} 个文件...`)
        console.log(`检测到 ${input.files.length} 个文件，其中 ${filteredCount} 个不支持的格式已过滤，将上传 ${filesWithPath.length} 个文件...`)
    } else {
        // message.info(`检测到 ${filesWithPath.length} 个文件，开始依次上传...`)
        console.log(`检测到 ${filesWithPath.length} 个文件，开始依次上传...`)
    }

    await uploadFilesWithPaths(filesWithPath)

    // 清空input,允许重复选择同一文件
    input.value = ''
}

/**
 * 处理文件夹选择(保留目录结构)
 */
async function handleFolderSelect(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    // 定义允许的文件扩展名(与 ChatInput 保持一致)
    const ALLOWED_EXTENSIONS = [
        '.txt', '.md', '.js', '.ts', '.html', '.css', '.json', '.xml', '.csv', '.log',
        '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.sql', '.sh',
        '.bat', '.yml', '.yaml', '.ini', '.conf', '.properties', '.vue', '.toml',
        '.env', '.cfg', '.config', '.reg', '.pem', '.tex', '.rst', '.adoc', '.org',
        '.swift', '.kt', '.scala', '.dart', '.ex', '.r', '.jl', '.ps1', '.vbs', '.fish',
        '.j2', '.ejs', '.hbs', '.lock', '.patch', '.diff', '.ics', '.vcf', '.srt',
        '.proto', '.graphql', '.sol', '.pdf',
        '.docx',  // Word 文档
        '.xlsx',  // Excel 文档
    ]

    // 过滤文件,只保留允许的格式
    const filesWithPath = Array.from(input.files)
        .filter(file => {
            const fileName = file.name.toLowerCase()
            const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
            return hasAllowedExtension
        })
        .map(file => {
            // 获取浏览器提供的相对路径
            const browserRelativePath = file.webkitRelativePath || file.name
            
            // 关键修复:拼接当前文件夹路径
            const relativePath = props.currentFolderPath
                ? `${props.currentFolderPath}/${browserRelativePath}`
                : browserRelativePath
            
            return {
                file,
                relativePath
            }
        })

    // 计算被过滤掉的文件数量
    const filteredCount = input.files.length - filesWithPath.length

    if (filesWithPath.length === 0) {
        message.warning(t('knowledge.upload.unsupportedFormat'))
        input.value = ''
        return
    }

    if (filteredCount > 0) {
        // message.info(`检测到 ${input.files.length} 个文件，其中 ${filteredCount} 个不支持的格式已过滤，将上传 ${filesWithPath.length} 个文件...`)
        console.log(`检测到 ${input.files.length} 个文件，其中 ${filteredCount} 个不支持的格式已过滤，将上传 ${filesWithPath.length} 个文件...`)
    } else {
        // message.info(`检测到 ${filesWithPath.length} 个文件，开始依次上传...`)
        console.log(`检测到 ${filesWithPath.length} 个文件，开始依次上传...`)
    }

    await uploadFilesWithPaths(filesWithPath)

    // 清空input,允许重复选择同一文件夹
    input.value = ''
}

/**
 * 统一上传逻辑(带相对路径)
 */
async function uploadFilesWithPaths(filesWithPath: Array<{ file: File, relativePath: string }>) {
    // 关键修复:上传前检查冲突
    if (props.getCurrentFiles) {
        const currentItems = props.getCurrentFiles()
        const detectedConflicts = detectUploadConflicts(filesWithPath, currentItems)
        
        if (detectedConflicts.length > 0) {
            // 发现冲突，显示对话框让用户选择
            console.log(`[DEBUG] 检测到 ${detectedConflicts.length} 个冲突`)
            conflicts.value = detectedConflicts
            pendingFiles.value = filesWithPath
            showConflictDialog.value = true
            return  // 等待用户选择后再继续
        }
    }
    
    // 没有冲突，直接上传
    await executeUpload(filesWithPath, 'keep-both')
}

/**
 * 执行实际上传
 * @param filesWithPath 文件列表
 * @param mode 冲突处理模式
 */
async function executeUpload(
    filesWithPath: Array<{ file: File, relativePath: string }>,
    mode: 'overwrite' | 'keep-both'
) {
    let successCount = 0
    let failCount = 0

    // 触发显示上传任务弹窗
    emit('show-upload-task')

    for (const { file, relativePath } of filesWithPath) {
        // 验证文件大小
        const maxSize = 1024 * 1024 * 1024 // 1GB
        if (file.size > maxSize) {
            message.warning(t('knowledge.upload.fileTooLarge', { path: relativePath }))
            failCount++
            continue
        }
        // 空文件没有可索引内容：不建上传任务，直接提示并跳过。
        // 放它进去只会入库失败并显示「失败 · 提取文本为空」，用户会误以为解析器/embedding 坏了。
        if (file.size === 0) {
            message.warning(`「${relativePath}」是空文件（0 字节），没有内容可索引，已跳过`)
            failCount++
            continue
        }

        // 目标目录（relativePath 去掉文件名部分），用于当前文件夹 / 文件夹上传
        const dirPart = relativePath.includes('/')
            ? relativePath.slice(0, relativePath.lastIndexOf('/'))
            : ''

        // 建立上传任务以驱动任务弹窗进度
        const task = uploadStore.addUploadTask({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            fileId: 'pending',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type || 'unknown',
            fileExtension: file.name.includes('.') ? file.name.split('.').pop()! : '',
            uploadedAt: new Date().toISOString(),
            processedAt: null,
            knowledgeBaseId: props.kbId,
            rawFile: file,
            relativePath,
            createdAt: Date.now()
        })

        try {
            uploadStore.updateUploadStatus(task.id, {
                status: 'uploading',
                progress: 30,
                currentStep: t('chat.upload.uploading', { pct: 30 })
            })

            // 后端知识库无 multipart 出口：统一走 /api/knowledge 的文本写入
            const node = await knowledgeBaseApi.uploadKBFile(props.kbId, file, dirPart || null)

            uploadStore.updateUploadStatus(task.id, {
                status: 'uploaded',
                progress: 100,
                currentStep: t('chat.upload.completed')
            })
            // addUploadTask 返回的 task 与 store 内为同一引用，直接复用避免对 Map 解包的依赖
            task.fileId = node.id
            task.serverFileRecord = node
            emit('uploaded', task)
            successCount++
        } catch (error: any) {
            console.error(`${relativePath} 上传失败:`, error)
            uploadStore.updateUploadStatus(task.id, {
                status: 'failed',
                errorMessage: error?.message || 'failed'
            })
            message.error(t('knowledge.upload.uploadFailed', { path: relativePath }))
            failCount++
        }
    }
}

/**
 * 处理冲突确认
 */
async function handleConflictConfirm() {
    showConflictDialog.value = false
    
    console.log('[DEBUG] ===== 开始处理冲突 =====')
    console.log('[DEBUG] 冲突列表:', conflicts.value)
    console.log('[DEBUG] 待处理文件:', pendingFiles.value.map(f => f.relativePath))
    console.log('[DEBUG] 用户选择的模式:', conflictMode.value)
    
    // 应用冲突解决方案
    const resolvedFiles = applyConflictResolution(
        pendingFiles.value,
        conflicts.value,
        conflictMode.value
    )
    
    console.log('[DEBUG] 重命名后的文件:', resolvedFiles.map(f => f.relativePath))
    console.log('[DEBUG] 冲突处理模式:', conflictMode.value)
    console.log('[DEBUG] 重命名后的文件数:', resolvedFiles.length)
    
    // 执行上传
    await executeUpload(resolvedFiles, conflictMode.value)
    
    // 清空状态
    pendingFiles.value = []
    conflicts.value = []
}

/**
 * 确认创建文件夹
 */
async function confirmCreateFolder() {
    if (!newFolderName.value || !newFolderName.value.trim()) {
        message.warning(t('knowledge.upload.folderNameEmpty'))
        return
    }

    // 前端验证
    const validation = validateFileName(newFolderName.value.trim())
    if (!validation.valid) {
        message.warning(validation.message)
        return
    }

    createFolderLoading.value = true
    try {
        // 需要将 currentFolderPath 转换为 parentFolderId
        // 这里暂时传 null，让后端根据 relativePath 计算
        await kbStore.createFolder(
            props.kbId,
            newFolderName.value.trim(),
            null, // TODO: 需要根据 currentFolderPath 获取 parentFolderId
        )
        
        message.success(t('knowledge.upload.folderCreateSuccess'))
        showCreateFolderDialog.value = false
        newFolderName.value = ''
        
        // 通知父组件刷新
        emit('folder-created')
    } catch (error: any) {
        message.error(error.message || t('knowledge.upload.folderCreateFailed'))
    } finally {
        createFolderLoading.value = false
    }
}

/**
 * 验证文件或文件夹名称
 */
function validateFileName(name: string): { valid: boolean; message?: string } {
    if (!name || name.trim() === '') {
        return { valid: false, message: t('knowledge.upload.nameEmpty') }
    }

    if (name.length > 255) {
        return { valid: false, message: t('knowledge.upload.nameTooLong') }
    }

    // 不允许的字符：/ \ : * ? " < > | 以及控制字符
    const invalidChars = /[\\/:*?"<>|\x00-\x1f\x7f]/
    if (invalidChars.test(name)) {
        return { 
            valid: false, 
            message: t('knowledge.upload.nameInvalidChars')
        }
    }

    // Windows 保留名称检查
    const reservedNames = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
    ]
    if (reservedNames.includes(name.toUpperCase())) {
        return { valid: false, message: t('knowledge.upload.nameReserved', { name }) }
    }

    // 不允许以空格或点号开头/结尾
    if (name.startsWith(' ') || name.endsWith(' ') || 
        name.startsWith('.') || name.endsWith('.')) {
        return { valid: false, message: t('knowledge.upload.nameStartEnd') }
    }

    return { valid: true }
}

// ========== Lifecycle ==========
onUnmounted(() => {
    // 组件卸载时的清理工作(如需要)
})
</script>

<style scoped>
/* 按钮组：方形图标按钮贴近排列，仅留 6px 空隙。
   `.kb-btn` 只是这些按钮的语义钩子（本页内多处复用），当前没有专属样式，
   外观完全由 ReSquareButton 自身决定——别照着类名去找不存在的规则。 */
.kb-up-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

/* 上传任务角标：贴着按钮右上角，不撑大占位 */
.kb-up-badge {
    display: inline-flex;
    vertical-align: middle;
}
</style>
