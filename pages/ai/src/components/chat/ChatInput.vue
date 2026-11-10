<template>
  <div class="w-full flex flex-col items-center">
    <!-- 目标条：输入框上方的会话目标（Issue），激活后随会话推进。
         编辑消息时隐藏：编辑态下「编辑提示条 + 输入框」要拼成一整张卡，
         中间插一条独立的目标条会把卡片连续性切断（实测三段割裂）。 -->
    <GoalBar v-if="!props.editing" :session-id="sessionId == null ? null : String(sessionId)" />
    <!--
      AI 联想的下一步任务：位置在「目标条下方、输入框上方」。
      开关关闭时组件整块不渲染（v-if 在组件内部），不占任何高度。
    -->
    <!-- 编辑消息时不渲染建议面板（避免与编辑条重叠，报障 2.5） -->
    <AiNextTaskPanel v-if="!props.editing" :session-id="sessionId == null ? null : String(sessionId)"
      :dismiss-signal="suggestionDismissSignal" @send-suggestion="onSendSuggestion" />
    <!-- 输入框区域 -->
    <!--
      为什么这里是 .input-area 而不是一组 tailwind 工具类（2026-11-08 实测）：
      基线 createVite 挂了 UnoCSS 的 transformerVariantGroup，它把括号当变体分组符，
      `bg-(--color-input-bg)` 会被改写成 `bg---color-input-bg`，而 Tailwind 编译出来的是
      `.bg-\(--color-input-bg\)` —— 类名对不上，整组「底色 / 边框 / 圆角」全部失效，
      浏览器退回初始值（透明底、1px currentColor 近黑边、0 圆角）。所以：
      这些值一律写进 <style scoped> 的 .input-area 里，模板只留结构类。
    -->
    <div
      class="input-area min-h-15 w-full"
      :class="[styleClass, { 'drag-over': isDragOver }, { 'is-backdrop': backdrop }, { 'input-area--continues-banner': props.editing }]"
      @dragover.prevent @dragenter.prevent="handleDragEnter" @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop">
      <!-- 文件列表显示区域 -->
      <div class="file-list flex flex-wrap gap-2 mb-3" v-if="uploadFiles.length > 0">
        <FileItem v-for="file in uploadFiles" :key="file.id" :name="file.displayName" :type="file.fileType"
          :ext="file.fileExtension" :size="file.fileSize"
          :preview-url="file.fileType === 'image' ? previewUrls.get(file.id) : undefined" closable
          :clickable="!!(file.isPasted && file.originalContent && file.fileType === 'text')"
          :upload-progress="file.uploadProgress" :upload-status="file.uploadStatus" @close="removeFile(file.id)"
          @click="showFilePreview(file)">
        </FileItem>
      </div>

      <!-- 已选知识库 + 附加连接标签显示区域（同一排） -->
      <div class="kb-list flex flex-wrap gap-2 mb-1.5 mx-1.5"
        v-if="selectedKnowledgeBases.length > 0 || selectedAttachmentTags.length > 0">
        <el-tag v-for="kb in selectedKnowledgeBases" :key="`kb-${kb.id}`" closable type="info"
          @close="removeKnowledgeBase(kb.id)" class="text-xs">
          <span class="flex items-center gap-1">
            <el-icon size="14">
              <BookSearch24Regular />
            </el-icon>
            {{ kb.name }}
          </span>
        </el-tag>
        <el-tag v-for="tag in selectedAttachmentTags" :key="`att-${tag.typeId}-${tag.id}`" closable type="info"
          @close="removeAttachmentTag(tag.typeId, tag.id)" class="text-xs">
          <span class="flex items-center gap-1">
            <el-icon size="14">
              <Cloud24Regular />
            </el-icon>
            {{ tag.name }}
          </span>
        </el-tag>
      </div>

      <!-- Tiptap 编辑器（替换 textarea） -->
      <div class="editor-container">
        <template v-if="props.readonly">
          <div class="readonly-placeholder"
            style="min-height: 58px; padding: 0 8px; font-size: var(--size-text-base, 14px); line-height: 1.8; color: var(--el-text-color-placeholder, #a8abb2); display: flex; align-items: center;">
            {{ t('chat.input.readonlyPlaceholder') }}
          </div>
        </template>
        <template v-else>
          <component :is="EditorContent" :editor="editor" class="message-editor" />
          <!-- 命令选择弹窗 -->
          <CommandPicker v-if="commandPickerVisible" ref="commandPickerRef" :visible="commandPickerVisible"
            :items="pickerItems" :query="pickerQuery" :selected-index="selectedIndex"
            :trigger="commandTrigger" @select="selectCommand" @close="closeCommandPicker"
            @update:selected-index="selectedIndex = $event" />
        </template>
      </div>

      <!-- 隐藏的文件输入框 -->
      <input type="file" ref="fileInputRef" style="display: none" multiple
        :accept="getFileExtensionsFromType('TEXT').join(',')" @change="handleFileSelect">
      <input type="file" ref="imageInputRef" style="display: none" multiple
        :accept="getFileExtensionsFromType('IMAGE').join(',')" @change="handleImageSelect">
      <div class="input-actions w-full flex justify-between">
        <div class="tools left-tools flex gap-0.5 items-center">
          <slot name="buttons"></slot>
          <!-- 左侧工具按钮组 -->
          <template v-if="!props.readonly">
            <!-- 「+」= 指令栏入口：附件/图片/知识库与「压缩上下文 / 切换模型」等指令同栏。
                 沿用既有的 CommandPicker（与 / 、@ 同一套 UI 与执行通道），
                 所以这里只是换一份候选集，不另造第三种弹层。 -->
            <LTooltip content="指令与附件" placement="top">
              <button v-if="showButtons.attachmentButton" ref="attachButtonRef" class="tool-btn" aria-label="指令栏：附件与指令" @click.stop="openCommandPickerByButton('plus')">
                <el-icon size="16">
                  <Add24Regular />
                </el-icon>
              </button>
            </LTooltip>
            <AttachmentPopover v-if="showButtons.attachmentButton" v-model:visible="attachPopoverVisible" :anchor-el="attachButtonRef"
              :knowledge-bases="knowledgeBases" :selected-kb-ids="props.config?.knowledgeBaseIds || []"
              :selected-attachments="props.config?.attachments || {}" @select-image="triggerImageInput"
              @select-file="triggerFileInput" @toggle-kb="toggleKnowledgeBaseSelection"
              @toggle-attachment="toggleAttachmentSelection" />

            <!-- 技能按钮（图标+tip）。
                 .skill-btn 只作为「点击外部关闭命令弹层」的判定锚点与窄窗隐藏该入口的钩子保留，
                 视觉一律由 .tool-btn 提供（原先那份 .skill-btn 规则与 .tool-btn 完全重复，已删） -->
            <LTooltip v-if="showButtons.skillButton" content="技能" placement="top">
              <button class="tool-btn skill-btn" aria-label="技能" @click.stop="openCommandPickerByButton('slash')">
                <el-icon size="16">
                  <Wrench24Regular />
                </el-icon>
              </button>
            </LTooltip>

            <!-- MCP 选择按钮（仅管理员；图标+tip） -->
            <LTooltip v-if="admin" content="MCP 工具" placement="top">
              <button ref="mcpButtonRef" class="tool-btn" aria-label="MCP 工具"
                :class="{ 'tool-btn-active': mcpSelectedIds.length }"
                :aria-pressed="!!mcpSelectedIds.length" @click.stop="toggleMcpPopover">
                <el-icon size="16"><PlugConnected20Regular /></el-icon>
              </button>
            </LTooltip>
            <McpSelectorPopover v-if="admin" v-model:visible="mcpPopoverVisible"
              :anchor-el="mcpButtonRef" :selected-ids="mcpSelectedIds" @change="handleMcpChange" />
          </template>
            <!-- 网页搜索开关（图标+tip） -->
            <LTooltip content="在线检索" placement="top">
              <button class="tool-btn" aria-label="在线检索" :class="{ 'tool-btn-active': webSearchEnabled }"
                :aria-pressed="webSearchEnabled" @click.stop="webSearchEnabled = !webSearchEnabled">
                <el-icon size="16"><GlobeShield20Regular /></el-icon>
              </button>
            </LTooltip>

            <!-- 输入优化（图标+tip）：与左组同为纯图标按钮，不再单独挂在右组 -->
            <LTooltip :content="optimizing ? '优化中…' : '优化输入'" placement="top">
              <button class="tool-btn" :aria-label="optimizing ? '优化中…' : '优化输入'"
                :disabled="optimizing || !editor?.getText().trim()" @click.stop="handleOptimize">
                <el-icon size="16" v-if="!optimizing"><Wand20Regular /></el-icon>
                <el-icon size="16" v-else class="is-loading"><SpinnerIos20Filled /></el-icon>
              </button>
            </LTooltip>

            <!-- 目标（Goal）：从「输入框上方的虚线添加入口」收进工具条，图标与目标条同形。
                 未设目标 → 点击弹目标输入框；已设目标 → 点击切换暂停 / 继续。
                 右侧小字是「已用 / 预算」令牌，由 ChatPanel 用会话累计 token 回填。 -->
            <LTooltip :content="goalTooltip" placement="top">
              <button v-if="!props.readonly && !props.editing && sessionId" ref="goalButtonRef" class="tool-btn goal-btn"
                :class="{ 'goal-btn--on': goalRunning, 'goal-btn--paused': goalPaused, 'goal-btn--done': goalDone }"
                :aria-label="goalTooltip" :aria-pressed="goalRunning" @click.stop="onGoalClick">
                <svg class="goal-btn__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="11.4" cy="12.6" r="7.4" />
                  <circle cx="11.4" cy="12.6" r="2.8" />
                  <path d="M15.6 8.4 21 3" />
                  <path d="M21 3h-3.4M21 3v3.4" />
                </svg>
                <span v-if="goal" class="goal-btn__count">{{ goalCounter }}</span>
              </button>
            </LTooltip>
        </div>

        <!-- 右组：模型 + 思考档位合成一个控件（截图里的「✳ 模型名 / 默认」），
             其后是智能体（形态）与发送。整组不带描边胶囊，靠文字与间距分层。 -->
        <div class="right-actions flex items-center">
          <slot name="right-actions-before" />

          <div class="model-chip" :class="{ 'is-open': modelPanelVisible || thinkingLevelPopoverVisible }">
            <LTooltip :content="modelInfoTooltip" placement="top">
              <button ref="modelButtonRef" @click.stop="openModelPanel" class="model-chip__name"
                :class="{ 'is-open': modelButtonExpanded }" :style="{ width: modelButtonWidth }"
                :aria-label="t('chat.input.selectModel')">
                <svg class="model-chip__glyph" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 1c.52 3.36 2.12 4.96 5.48 5.48C10.12 7 8.52 8.6 8 11.96 7.48 8.6 5.88 7 2.52 6.48 5.88 5.96 7.48 4.36 8 1Z"
                    fill="currentColor" />
                </svg>
                <span class="model-chip__text model-name-text">{{ currentModelNameOnly }}</span>
              </button>
            </LTooltip>
            <template v-if="modelReasoningVisible">
              <span class="model-chip__sep" aria-hidden="true">/</span>
              <LTooltip :content="t('chat.input.thinkingLevelTitle')" placement="top">
                <button ref="thinkingLevelButtonRef" class="model-chip__effort" :class="{ 'is-on': thinkingEnabled }"
                  :aria-label="t('chat.input.thinkingLevelTitle')" :aria-pressed="thinkingEnabled"
                  @click.stop="toggleThinkingLevelPopover">{{ currentThinkingValueLabel }}</button>
              </LTooltip>
            </template>
          </div>
          <ThinkingEffortPopover v-if="modelReasoningVisible" v-model:visible="thinkingLevelPopoverVisible"
            :anchor-el="thinkingLevelButtonRef" :options="thinkingLevelOptions" :current-value="currentThinkingValue"
            @select="handleThinkingLevelSelect" />

          <!-- 智能体（形态）：截图里是「橙底人像 + Build」，不带描边胶囊 -->
          <LTooltip v-if="admin" :content="runModeLabel" placement="top">
            <button ref="runModeButtonRef" class="mode-chip"
              :class="currentRunMode === 'plan' ? 'is-plan' : 'is-build'" :aria-label="runModeLabel"
              @click.stop="toggleRunModePopover">
              <span class="mode-chip__badge" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="currentColor" />
                  <circle cx="8" cy="6.2" r="2" fill="#fff" />
                  <path d="M4.4 12.2c.6-1.9 2-2.9 3.6-2.9s3 1 3.6 2.9z" fill="#fff" />
                </svg>
              </span>
              <span class="mode-chip__text">{{ runModeLabel }}</span>
            </button>
          </LTooltip>
          <RunModePopover v-if="admin" v-model:visible="runModePopoverVisible" :anchor-el="runModeButtonRef"
            :current-value="currentRunMode" :options="runModeOptions" @select="handleRunModeChange" />

          <!-- 发送/停止按钮（流式时：无输入=停止，有输入=入队） -->
          <LTooltip v-if="streaming && !inputContent.trim()" :content="t('chat.input.stopGenerating')" placement="top">
            <button class="send-btn stop-btn" :aria-label="t('chat.input.stopGenerating')" @click="abortResponse">
              <el-icon size="16">
                <Stop24Filled />
              </el-icon>
            </button>
          </LTooltip>
          <LTooltip v-else :content="streaming ? t('chat.input.enqueue') : t('chat.input.send')" placement="top">
            <button class="send-btn" :class="{ 'queue-btn': streaming }"
              :aria-label="streaming ? t('chat.input.enqueue') : t('chat.input.send')" @click="sendMessage"
              :disabled="props.readonly || !inputContent.trim() || !props.config?.modelId">
              <svg class="send-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4.4 19.1 12 6 19.6V4.4Z" />
              </svg>
            </button>
          </LTooltip>
        </div>
      </div>

      <!-- 模型选择器弹窗 -->
      <ModelSelectorPanel v-model:visible="modelPanelVisible" :anchor-el="modelButtonRef" :models="models"
        :providers="providers" :current-model-id="props.config?.modelId || null"
        @select="handleModelSelect" @favorite-changed="handleFavoriteChanged" />

      <!-- 粘贴文本预览弹窗（利用 el-dialog 原生滚动） -->
      <ReDialog v-model="previewDialogVisible" :title="t('chat.input.previewTitle', { name: previewFileName })"
        width="640px" :close-on-click-modal="false" destroy-on-close class="pasted-preview-dialog"
        @close="closeFilePreview">
        <pre class="pasted-preview-text">{{ previewContent }}</pre>
      </ReDialog>
    </div>
  </div>
</template>


<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  nextTick,
  onUnmounted,
  onMounted,
  reactive,
  type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon, ElButton, ElTag, ElMessageBox } from "element-plus";
import type { Model, ModelProvider } from '@/types/api';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import FileItem from '../ui/FileItem.vue';
import LTooltip from '../ui/LTooltip.vue';
import AttachmentPopover from './chat-input/AttachmentPopover.vue';
import MaxTokensPopover from './chat-input/MaxTokensPopover.vue';
import RunModePopover from './chat-input/RunModePopover.vue';
import type { PromptForm } from '@/services/modules/character.api';
import { resolvePromptFormIcon } from '@/utils/promptFormIcons';

/** 内置兜底形态标识：build 恒存，形态列表取不到时也要有东西可选 */
const FORM_KEY_BUILD = 'build';
import ThinkingEffortPopover from './chat-input/ThinkingEffortPopover.vue';
import ModelSelectorPanel from './chat-input/ModelSelectorPanel.vue';
import GoalBar from './GoalBar.vue';
import AiNextTaskPanel from './AiNextTaskPanel.vue';
import McpSelectorPopover from './chat-input/McpSelectorPopover.vue';
import { CommandNode } from './chat-input/commandNode';
import CommandPicker from './chat-input/CommandPicker.vue';
import { getModelThinkingEfforts, getThinkingEffortLabel, getModelDisplayName, getModelContextWindow } from '@/utils/modelUtils';
import { detectModelProvider } from '@/utils/modelUtils';
import {

  Stop24Filled, BookSearch24Regular, Cloud24Regular,
  Add24Regular, Wrench24Regular, GlobeShield20Regular, Wand20Regular, PlugConnected20Regular,
  // 「优化输入」按钮的加载态：原先写的是 <Loading />，@vicons/fluent 并没有这个导出，
  // 控制台一直报 "Failed to resolve component: Loading"，加载时按钮里是空的。
  SpinnerIos20Filled
} from '@vicons/fluent'
import { usePopup } from '@/composables/usePopup';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { useGoalStore, formatTokenCounter, DEFAULT_GOAL_TOKEN_BUDGET } from '@/stores/goal';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { apiService } from '@/services/ApiService';
import {isAdmin, message} from '@repo/core';
import ReDialog from '@repo/ui/re-dialog';

/** File object managed by ChatInput (created via createFileObject) */
interface ChatFile {
  id: number
  fileName: string
  fileSize: number
  fileExtension: string
  fileType: string
  displayName: string
  file: File
  isPasted: boolean
  originalContent?: string
  uploadProgress: number
  uploadStatus: 'queued' | 'uploading' | 'uploaded' | 'failed' | undefined
  previewUrl?: string
  url?: string
  localPath?: string
}

/** Chat session config passed from parent */
interface ChatConfig {
  modelId?: string | null
  thinkingEffort?: string
  workspacePath?: string | null
  maxTokensLimit?: number | null
  knowledgeBaseIds?: string[]
  runMode?: string
  attachments?: Record<string, string[]>
  defaultThink?: boolean
  defaultSearch?: boolean
  /** 逗号分隔的 MCP Server ID 串（会话级绑定，与 types/session.ts 口径一致） */
  mcpServerIds?: string
}

/** File with optional _originalContent attached by paste handler */
type FileWithContent = File & { _originalContent?: string }

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg') // md = 768px

const { confirm, notify } = usePopup();
const router = useRouter();
const sessionStore = useSessionStore();
const { t } = useI18n()

// 响应式数据
const isInputExpanded = ref(false);
const messageInputRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);
let fileIdCounter = 0;
const focused = ref(false);
const isDragOver = ref(false);
// 模型选择器相关
const models = ref<Model[]>([]);
const providers = ref<ModelProvider[]>([]);
/**
 * 模型列表加载状态。
 *
 * 「加载失败」必须与「确实没有模型」区分开：后者引导用户去模型管理是正确的，
 * 前者静默跳走会让用户以为模型丢了（2026-10-08 实测偶发：/api/providers 瞬时 500
 * → models 恒空 → 按钮退化成「+ 添加模型」→ 点击被硬跳走）。
 */
const modelsLoaded = ref(false);
const modelsLoadFailed = ref(false);
/**
 * 最近一次加载模型列表的真实失败原因（字符串）。
 *
 * 之前这里只有一个 boolean，失败详情只进了 console.error，
 * 弹窗只能临时 new Error('GET /api/providers') 编一个 —— 那个对象不是真实失败原因，
 * 而且类型上也传不进 notify.error（它的 content 形参是 string）。
 * 存字符串既满足类型，也把真实原因带到提示里。
 */
const modelsLoadError = ref("");
// 弹窗触发按钮引用
const modelButtonRef = ref<any>(null);
// Token 上限 popover
const settingsButtonRef = ref<HTMLElement | null>(null);
const settingsPopoverVisible = ref(false);
// 知识库选择器相关
const knowledgeBases = ref<any[]>([]); // 知识库列表
// 附加连接(插件注册的附件类型)相关
const attachmentTypes = ref<Array<{ id: string; label: string; icon: string; pluginId: string; _items?: Array<{ id: string; name: string; description?: string }> }>>([]);

// Tiptap 编辑器相关
const editor = ref<Editor>();
const commandPickerVisible = ref(false);
const pickerQuery = ref('');
const selectedIndex = ref(0);
const commandsCache = reactive<{ slash: any[]; mention: any[]; plus: any[] }>({
  slash: [],
  mention: [],
  // 「+」指令栏的候选集（附件类入口 + 会话级内置指令 + 后端命令），与 slash 分开存，
  // 因为它的语义是「这一个按钮能做什么」，而不是「斜杠命令有哪些」
  plus: [],
});
const commandTrigger = ref<'slash' | 'mention'>('slash');
// 弹层里显示的候选集。plus 是「+」的候选集（附件入口 + 指令 + 同一批后端命令），
// 与 slash / mention 分开存：它的语义是「这个按钮能做什么」，而不是「斜杠命令有哪些」。
const pickerItemSet = ref<'slash' | 'mention' | 'plus'>('slash');
// 弹层是不是由工具条按钮（+ / 技能）打开的。
// 按钮唤起与在编辑器里敲 / 、@ 有两点行为差异，见 selectCommand 与 onBlur 处的注释。
const pickerOpenedByButton = ref(false);
const editorContent = ref('');

// 命令选择弹窗 ref
const commandPickerRef = ref<any>();

// 弹窗面板状态（模型和知识库使用弹窗样式）
const modelPanelVisible = ref(false)
const modelButtonExpanded = ref(false)
const modelButtonWidth = ref<string | undefined>()
const attachPopoverVisible = ref(false)
const attachButtonRef = ref<any>(null)

// 常量定义
const FILE_TYPES: Record<string, { extensions: string[]; type: string }> = {
  TEXT: {
    extensions: [
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
    ],
    type: 'text'
  },
  IMAGE: {
    extensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico',
      '.tif', '.tiff', '.psd', '.ai', '.eps'
    ],
    type: 'image'
  }
};

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp',
  'image/svg+xml': 'svg', 'image/webp': 'webp', 'text/plain': 'txt', 'text/html': 'html',
  'text/css': 'css', 'application/javascript': 'js', 'application/json': 'json',
  'text/csv': 'csv', 'application/xml': 'xml'
};

// 配置
const showButtons = reactive({
  thinkingButton: false,
  webSearchButton: true,
  tokensButton: true,
  /** 附件/指令栏入口（模型 attachment 能力，缺省显） */
  attachmentButton: true,
  /** 技能入口（模型 tool_call 能力，缺省显） */
  skillButton: true,
});

// 图片预览 URL 字典（与 file 对象解耦）
const previewUrls = ref(new Map<number, string>());

const props = defineProps({
  value: { type: String, default: '' },
  files: { type: Array as PropType<ChatFile[]>, default: () => [] },
  streaming: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  // 编辑消息时抑制「AI 建议的下一步」面板：否则它会与编辑条叠在一起（用户报障 2.5）
  editing: { type: Boolean, default: false },
  buttons: { type: Object as PropType<Record<string, boolean>>, default: () => ({}) },
  class: { type: String, default: '' },
  sessionId: { type: [String, Number], default: null },
  characterId: { type: String, default: null },
  // 模式：create 为创建会话模式，chat 为对话模式
  mode: { type: String, default: 'chat' },
  backdrop: { type: Boolean, default: false },
  config: {
    type: Object as PropType<ChatConfig>,
    default: () => ({
      modelId: null,
      thinkingEffort: 'none',
      workspacePath: null,
      maxTokensLimit: null,
      knowledgeBaseIds: [],
    })
  },
});

// 计算属性
const styleClass = computed(() => {
  const classes = [];
  if (isInputExpanded.value) {
    classes.push('expanded');
  }
  // if (props.mode === 'create') {
  if (focused.value) {
    classes.push('shadow-[0_2px_22px_rgba(0,0,0,0.16)] dark:shadow-none');
  } else {
    classes.push('shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-none');
  }
  // }
  return classes.join(' ') + ' ' + props.class;
});

const inputContent = computed({
  get: () => props.value,
  set: (value) => emit('update:value', value)
});

// ===== 会话目标（Goal）=====
// 目标条（GoalBar）只负责展示与暂停/继续；入口收在工具条的靶心按钮里，
// 这样「没有目标时」不再在输入框上方占一整行虚线窄条。
const goalStore = useGoalStore();

/** 当前会话的目标；无会话或未设置时为 null */
const goal = computed(() => goalStore.goalOf(props.sessionId == null ? null : String(props.sessionId)));

const goalRunning = computed(() => goal.value?.state === 'RUNNING' || goal.value?.state === 'PENDING');
const goalPaused = computed(() => goal.value?.state === 'PAUSED');
const goalDone = computed(() => goal.value?.state === 'COMPLETED');

/** 目标计数器：已用 / 预算。已用由 ChatPanel 从会话累计 token 回填（见 stores/goal.syncTokens） */
const goalCounter = computed(() => {
  const current = goal.value;
  if (!current) {
    return '';
  }
  const budget = current.tokenBudget ?? DEFAULT_GOAL_TOKEN_BUDGET;
  return `${formatTokenCounter(current.tokensUsed)}/${formatTokenCounter(budget)}`;
});

/** 靶心按钮的提示：说明当前状态与「点一下会发生什么」 */
const goalTooltip = computed(() => {
  const current = goal.value;
  if (!current) {
    return '添加目标：让 AI 围绕一个目标持续工作';
  }
  const prefix = `目标：${current.title}`;
  if (current.state === 'PAUSED') {
    return `${prefix}（已暂停，点击继续）`;
  }
  if (current.state === 'COMPLETED') {
    return `${prefix}（已完成，点击新建）`;
  }
  if (current.state === 'FAILED' || current.state === 'CANCELED') {
    return `${prefix}（已结束，点击新建）`;
  }
  return `${prefix}（进行中，点击暂停）`;
});

/**
 * 添加目标：与 GoalBar 原先的添加入口同一套文案与校验。
 */
async function promptAddGoal(): Promise<void> {
  const sid = props.sessionId == null ? '' : String(props.sessionId);
  if (!sid) {
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt(
      '描述这次会话要达成的目标，AI 会围绕它持续工作，直到完成或被暂停。',
      '添加目标',
      {
        confirmButtonText: '开始',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：把默认角色改成通用并自测通过',
        inputValidator: (input: string) => (!!input && input.trim().length > 0) || '目标不能为空',
      },
    );
    await goalStore.setGoal(sid, value.trim());
  } catch {
    // 用户取消输入，无需处理
  }
}

/**
 * 点击靶心：无目标 / 已结束 → 新建；进行中 → 暂停；已暂停 → 继续。
 */
async function onGoalClick(): Promise<void> {
  const sid = props.sessionId == null ? '' : String(props.sessionId);
  if (!sid) {
    return;
  }
  const current = goal.value;
  if (!current || current.state === 'COMPLETED' || current.state === 'FAILED' || current.state === 'CANCELED') {
    await promptAddGoal();
    return;
  }
  if (current.state === 'PAUSED') {
    await goalStore.resume(sid);
  } else {
    await goalStore.pause(sid);
  }
}

// 打开 / 切换会话时向后端要一次目标（端点未上线时 store 静默保留本地态）
watch(() => props.sessionId, (sid) => {
  if (sid != null && String(sid)) {
    void goalStore.load(String(sid));
  }
}, { immediate: true });

// Tiptap 编辑器内容同步
watch(editorContent, (val) => {
  if (inputContent.value !== val) {
    inputContent.value = val;
  }
});

/**
 * 将纯文本中的 [/type:name ...] 标记转换为 HTML 标签
 * 供 Tiptap 解析为 Command 节点
 * 支持任意 key="value" 属性对（label, path, start, end, content, head, tail 等）
 */
const parseCommandTags = (text: string): string => {
  if (!text) return text;
  // 匹配 [/type:name key="val" key="val" ...] 或 [@type:name ...]
  return text.replace(
    /\[([\/@])([a-zA-Z][\w\-\/]*):([\w-]+)((?:\s+\w+="[^"]*")*)\s*\]/g,
    (match, prefix, provider, name, attrsStr) => {
      const attrs: Record<string, string> = { label: '' };
      if (attrsStr) {
        const attrRegex = /(\w+)="([^"]*)"/g;
        let m: RegExpExecArray | null;
        while ((m = attrRegex.exec(attrsStr)) !== null) {
          attrs[m[1]] = m[2];
        }
      }
      const displayText = attrs.label || `${prefix}${name}`;
      const dataAttrs = Object.entries(attrs)
        .filter(([k]) => k !== 'label')
        .map(([k, v]) => ` data-${k}="${v}"`)
        .join('');
      return `<span data-type="command" data-provider-id="${provider}" data-name="${name}" data-label="${attrs.label || ''}" data-trigger="${prefix}"${dataAttrs} class="command-badge" contenteditable="false">${displayText}</span>`;
    }
  );
};


/**
 * AI 建议被点中：用户已明确要求「直接作为用户消息发送」，
 * 因此把建议文本填入编辑器后走与发送按钮同一条 sendMessage 路径。
 */
const onSendSuggestion = (text: string) => {
  if (!editor.value || !text.trim()) {
    return
  }
  editor.value.commands.setContent(text.replace(/\n/g, '<br>'), { emitUpdate: false })
  // sendMessage 在下方声明（const 箭头函数）：延迟一拍调用，避免初始化顺序问题
  requestAnimationFrame(() => { void sendMessage() })
}

watch(() => props.value, (val) => {
  if (editor.value && editor.value.getText() !== val) {
    // 将纯文本中的 \n 转换为 <br>，确保 setContent 作为 HTML 解析时保留换行
    const htmlContent = parseCommandTags(val).replace(/\n/g, '<br>');
    editor.value.commands.setContent(htmlContent, { emitUpdate: false });
  }
});

// 管理上传文件列表，自动处理图片预览 URL 的生命周期
const uploadFiles = computed({
  get: () => {
    const files = props.files;

    // 为每个图片文件确保有预览 URL（懒加载）
    files.forEach(file => {
      if (file.fileType === 'image' && !previewUrls.value.has(file.id)) {
        if (file.file) {
          // 本地文件（粘贴/新选择）：用 blob URL 预览
          const previewUrl = URL.createObjectURL(file.file);
          previewUrls.value.set(file.id, previewUrl);
        } else if (file.previewUrl || file.url) {
          // 已上传文件（如编辑消息回填）：直接用后端返回的资源 URL
          previewUrls.value.set(file.id, file.previewUrl || file.url || '');
        }
      }
    });

    // 清理不再存在的文件的预览 URL
    const currentFileIds = new Set(files.map(f => f.id));
    previewUrls.value.forEach((url, fileId) => {
      if (!currentFileIds.has(fileId)) {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
        previewUrls.value.delete(fileId);
      }
    });

    return files;
  },
  set: (newFiles) => {
    // 直接发射更新事件，让父组件处理
    emit('update:files', newFiles);
  }
});

// 当前选中的模型
const currentModel = computed(() => {
  if (props.config?.modelId) {
    const model = models.value.find(m => m.id === props.config.modelId);
    return model;
  }
  return null;
});

// 根据模型特性动态控制按钮显示
watch(() => currentModel.value?.config, (config) => {
  // 思考按钮：当模型支持 thinking 时显示
  showButtons.thinkingButton = config?.features?.includes('thinking') || false;
}, { immediate: true });

// 模型能力开关 → 会话工具栏按钮显隐（attachment/reasoning/tool_call/temperature）
// 后端模型行回传顶层布尔字段；仅显式 false 才隐藏按钮，字段为空（未配置 / 旧数据）
// 保持按钮可见。思考胶囊用 modelReasoningVisible 单独控制。
watch(() => currentModel.value, (model) => {
  if (model?.['attachment'] === false) showButtons.attachmentButton = false;
  if (model?.['tool_call'] === false) showButtons.skillButton = false;
}, { immediate: true });

/** 思考胶囊显隐：仅模型显式声明 reasoning=false 才隐藏；未配置/未知保持可见 */
const modelReasoningVisible = computed(() => currentModel.value?.['reasoning'] !== false);

// 思考强度相关
const localThinkingEffort = ref<string>('none'); // 'none' | 'low' | 'medium' | 'high' | 'max' | ...

// 运行模式相关
const runModeButtonRef = ref<any>(null);
const runModePopoverVisible = ref(false);

const currentRunMode = computed(() => props.config?.runMode || FORM_KEY_BUILD);

/**
 * 可切换的形态列表，来自角色配置（/v2/prompt-forms）。
 *
 * <p>原先这里是写死的 build/plan 两项。现在形态可由用户自定义，切换器必须渲染
 * 后端给的列表，否则用户在角色里新增的形态在这里选不到。</p>
 *
 * <p>取不到时降级为「只有 build」：build 恒存，会话始终有兜底形态可选。</p>
 */
const promptForms = ref<PromptForm[]>([]);
const runModeOptions = computed(() => {
  const list = promptForms.value.length
    ? promptForms.value
    : [{ formKey: FORM_KEY_BUILD, formName: t('chat.input.runModeFormBuild'), formIcon: 'flash', formDescription: t('chat.input.runModeFormBuildDesc') } as PromptForm];
  return list.map(f => ({
    value: f.formKey,
    label: f.formName || f.formKey,
    desc: f.formDescription || '',
    icon: resolvePromptFormIcon(f.formIcon),
  }));
});

/** 当前形态；会话里存的值可能已被角色配置删掉，这时回落到 build */
const activeForm = computed(() =>
  runModeOptions.value.find(o => o.value === currentRunMode.value) || runModeOptions.value[0]
);

const runModeLabel = computed(() => activeForm.value?.label || FORM_KEY_BUILD);

/** 拉取形态列表；失败时保持空数组，由上面的降级分支兜底 */
const loadPromptForms = async () => {
  try {
    const list = await apiService.fetchPromptForms();
    promptForms.value = Array.isArray(list) ? list : [];
  } catch {
    promptForms.value = [];
  }
};

const toggleRunModePopover = () => {
  runModePopoverVisible.value = !runModePopoverVisible.value;
};

const handleRunModeChange = (mode: string) => {
  emit('config-change', { runMode: mode });
};

const thinkingEffortOptions = computed(() => {
  if (!currentModel.value) return [];
  return getModelThinkingEfforts(currentModel.value, providers.value);
});

// 初始化思考强度（从 config 中读取保存的值）
const initThinkingEffort = () => {
  if (props.config?.thinkingEffort) {
    localThinkingEffort.value = props.config.thinkingEffort;
  } else {
    localThinkingEffort.value = 'none';
  }
};

// 获取思考强度的标签（用于按钮显示）
const getThinkingEffortShortLabel = (effort: string) => {
  return getThinkingEffortLabel(effort);
};

// 处理思考强度变更
const handleThinkingEffortChange = (effort: string) => {
  // 更新本地状态
  localThinkingEffort.value = effort;

  // 构建配置变更对象
  const configChanges = {
    thinkingEffort: effort, // 始终发送 effort 值，包括 'none'
  };

  console.log('Thinking effort changed:', configChanges);
  emit('config-change', configChanges);
};

const currentModelNameOnly = computed(() => {
  // 如果没有模型，显示"+添加模型"
  if (!models.value || models.value.length === 0) {
    return '+ 添加模型';
  }
  // 如果没有选中模型，显示"自动"
  const model = currentModel.value;
  if (!model) return '自动';
  // 用户给模型起了别名就优先显示别名（模型管理的别名就是给业务展示用的），
  // 没有别名再回落到去掉命名空间的模型 ID。
  return model.alias || getModelDisplayName(model.modelName);
});

const currentThinkingLabel = computed(() => {
  // 合并入口后：只要思考开启，就在模型按钮上回显当前档位（用户需求 4.2）。
  // 不再依赖 showButtons.thinkingButton——入口本身是常驻的，开启后理应可见。
  if (!thinkingEnabled.value) return '';
  return getThinkingEffortLabel(localThinkingEffort.value);
});

/**
 * 模型名右侧「/ 档位」的文案：**恒有值**。
 *
 * <p>截图里模型名后面永远跟着 `/ 默认`，它是「当前思考档位」而不是「思考是否开启」。
 * 旧实现只在开启时回显，关闭时留空，结果那半段整个消失、`/` 悬空。
 * 关闭态显示「不思考」，语义与下拉首项一致。</p>
 */
const currentThinkingValueLabel = computed(() => getThinkingEffortLabel(currentThinkingValue.value));

const currentModelName = computed(() => {
  const name = currentModelNameOnly.value;
  const effort = currentThinkingLabel.value;
  return effort ? `${name} · ${effort}` : name;
});

// 当前选中的知识库列表（根据 ID 从完整列表中过滤）
/**
 * 输入框模型按钮的悬停信息：模型名 · 提供方 · 思考档位（有则显示）。
 */
const modelInfoTooltip = computed(() => {
  const model = currentModel.value;
  if (!model) {
    return currentModelNameOnly.value;
  }
  const parts: string[] = [model.alias || model.modelName];
  // 有别名时把真实模型 ID 放到第二位，悬停仍能看到到底调的是哪个模型
  if (model.alias && model.alias !== model.modelName) {
    parts.push(model.modelName);
  }
  const provider = detectModelProvider(model.modelName);
  if (provider) {
    parts.push(provider);
  }
  if (currentThinkingLabel.value) {
    parts.push(currentThinkingLabel.value);
  }
  return parts.join(" · ");
});

const selectedKnowledgeBases = computed(() => {
  const kbIds = props.config?.knowledgeBaseIds || [];
  return knowledgeBases.value.filter(kb => kbIds.includes(kb.id));
});

// 当前选中的附加连接标签（根据 ID 从附件类型列表中解析名称）
const selectedAttachmentTags = computed(() => {
  const attachments = props.config?.attachments || {};
  const tags: Array<{ typeId: string; id: string; name: string }> = [];
  for (const [typeId, itemIds] of Object.entries(attachments) as [string, string[]][]) {
    const typeInfo = attachmentTypes.value.find(t => t.id === typeId);
    if (!typeInfo) continue;
    for (const itemId of itemIds) {
      const item = typeInfo._items?.find(i => i.id === itemId);
      if (item) tags.push({ typeId, id: itemId, name: item.name });
    }
  }
  return tags;
});

// 移除单个附加连接标签
const removeAttachmentTag = (typeId: string, itemId: string) => {
  toggleAttachmentSelection(typeId, itemId);
};

// 已选知识库但列表为空时（刷新后），按需加载一次以恢复标签显示
// watch 定义移至 loadKnowledgeBases 之后，避免 immediate 时 TDZ 引用

// Token 上限标签
const maxTokensLabel = computed(() => {
  const v = props.config?.maxTokensLimit;
  if (!v) return t('chat.input.unlimited');
  if (v >= 1000000 && v % 1000000 === 0) return `${v / 1000000}M`;
  if (v >= 1000 && v % 1000 === 0) return `${v / 1000}K`;
  return t('chat.input.custom');
});

// 切换 Token 上限 popover
const toggleSettingsPopover = () => {
  settingsPopoverVisible.value = !settingsPopoverVisible.value;
};

// 处理 Token 上限变更
const handleMaxTokensChange = (val: number | null) => {
  emit('config-change', { maxTokensLimit: val });
};



const getFeatureLabel = (type: string) => {
  switch (type) {
    case 'tools': return t('chat.input.featureTools');
    case 'thinking': return t('chat.input.featureThinking');
    default: return type;
  }
}

const emit = defineEmits([
  'update:value',
  'update:files',
  'send', 'abort', 'files-change',
  'focus', 'blur',
  'update:modelId', 'config-change', 'update:knowledgeBaseIds'
]);

// 工具函数
const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toUpperCase() : 'FILE';
};

const getFileNameWithoutExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
};

const getFileExtensionFromType = (mimeType: string) => {
  return MIME_TO_EXT[mimeType] || mimeType.split('/')[1] || 'file';
};

const isFileType = (file: File, fileType: string) => {
  const fileName = file.name.toLowerCase();
  return FILE_TYPES[fileType].extensions.some(ext => fileName.endsWith(ext));
};

const getFileExtensionsFromType = (type: string) => {
  return FILE_TYPES[type].extensions;
}

const createFileObject = (file: File, fileType: string, isPasted = false) => {
  const timestamp = Date.now();
  // 检测是否有通过粘贴附加的原始文本内容
  const hasOriginalContent = (file as FileWithContent)._originalContent;

  // Electron 模式下非图片文件：只存本地路径，不上传
  const isImageFile = FILE_TYPES[fileType].type === 'image';
  const electronLocalPath = isElectron && !isImageFile
    ? window.electronAPI?.getPathForFile(file)
    : undefined;

  return {
    id: fileIdCounter++,
    fileName: file.name || `pasted-${fileType.toLowerCase()}-${timestamp}.${getFileExtensionFromType(file.type)}`,
    fileSize: file.size,
    fileExtension: isPasted ? getFileExtensionFromType(file.type) : getFileExtension(file.name),
    fileType: FILE_TYPES[fileType].type,
    displayName: file.name ? getFileNameWithoutExtension(file.name) : `pasted-${fileType.toLowerCase()}-${timestamp}`,
    file: electronLocalPath ? undefined as unknown as File : file,
    // 标记是否为粘贴自动转换的文件
    isPasted: !!hasOriginalContent || isPasted,
    // 粘贴转换的原始文本内容（仅粘贴转文件时有值）
    originalContent: hasOriginalContent || undefined,
    // Electron 本地路径（非图片文件，不上传）
    localPath: electronLocalPath,
    // 新增：上传进度状态
    uploadProgress: 0,
    uploadStatus: undefined, // 'queued' | 'uploading' | 'uploaded' | 'failed'
  };
};

// 打开模型面板
// 底部模型按钮宽度：自适应内容，但收敛在 [MIN, MAX] 之间——
// 太短会让模型名被截断、按钮看着像个小方块；太长会挤占发送按钮。用户需求 4.1。
const MODEL_BUTTON_MIN_WIDTH = 96
const MODEL_BUTTON_MAX_WIDTH = 400
const MODEL_BUTTON_TRANSITION_MS = 200
let modelOpenTimer: ReturnType<typeof setTimeout> | null = null;
let modelCloseTimer: ReturnType<typeof setTimeout> | null = null;

function measureModelButtonNaturalWidth(): number {
  const button = modelButtonRef.value as HTMLElement | null
  if (!button) return MODEL_BUTTON_MIN_WIDTH

  const clone = button.cloneNode(true) as HTMLElement
  clone.classList.remove('is-open')
  clone.style.position = 'fixed'
  clone.style.visibility = 'hidden'
  clone.style.pointerEvents = 'none'
  clone.style.width = 'max-content'
  clone.style.maxWidth = `${MODEL_BUTTON_MAX_WIDTH}px`
  clone.style.left = '-9999px'
  // 名称 span 平时是 flex-1 + min-w-0（flex-basis:0%），对容器固有宽度贡献为 0，
  // 直接量会把宽度算小、把模型名截断。这里临时还原为内容宽，量到真实需要的宽度（用户需求 4.1）。
  const nameEl = clone.querySelector('.model-name-text') as HTMLElement | null
  if (nameEl) {
    nameEl.style.flex = '0 0 auto'
    nameEl.style.minWidth = 'max-content'
    nameEl.style.overflow = 'visible'
  }
  document.body.appendChild(clone)
  const width = Math.min(MODEL_BUTTON_MAX_WIDTH, Math.max(MODEL_BUTTON_MIN_WIDTH, clone.getBoundingClientRect().width))
  clone.remove()
  return width
}

function collapseModelButton() {
  if (modelOpenTimer) {
    clearTimeout(modelOpenTimer)
    modelOpenTimer = null
  }
  if (modelCloseTimer) clearTimeout(modelCloseTimer)

  modelButtonExpanded.value = false
  // 宽度自适应模型名内容，收敛在 [MODEL_BUTTON_MIN_WIDTH, MODEL_BUTTON_MAX_WIDTH]（用户需求 4.1）
  modelButtonWidth.value = `${measureModelButtonNaturalWidth()}px`
  modelCloseTimer = setTimeout(() => {
    // 收起后保持同一自适应宽度，不回落到固定宽度
    modelButtonWidth.value = `${measureModelButtonNaturalWidth()}px`
    modelCloseTimer = null
  }, MODEL_BUTTON_TRANSITION_MS)
}

const openModelPanel = async () => {
  // 列表为空：先重载一次做自愈（首次请求可能还没回来，或上次瞬时失败）。
  if (!models.value || models.value.length === 0) {
    await loadModels();
  }
  if (!models.value || models.value.length === 0) {
    if (modelsLoadFailed.value) {
      // 「加载失败」≠「没有模型」：留在原页如实提示，别把用户静默扔到模型管理页，
      // 否则用户会以为自己的模型丢了（2026-10-08 实测缺陷）。
      notify.error(t('common.error.loadFailed'), modelsLoadError.value || 'unknown');
      return;
    }
    // 确实一个可用模型都没有：引导去模型管理（原有语义）
    window.location.href = '/models';
    return;
  }

  if (modelPanelVisible.value) {
    modelPanelVisible.value = false
    return
  }

  const button = modelButtonRef.value as HTMLElement | null
  if (!button) return

  if (modelOpenTimer) clearTimeout(modelOpenTimer)
  if (modelCloseTimer) {
    clearTimeout(modelCloseTimer)
    modelCloseTimer = null
  }

  // 直接显示弹框，没有动画
  modelPanelVisible.value = true
};

// 外部点击或 ESC 关闭弹窗时，反向收起按钮
watch(modelPanelVisible, (val) => {
  if (!val && modelButtonExpanded.value) {
    collapseModelButton()
  }
})

// 处理模型选择
const handleModelSelect = (modelId: string) => {
  // 找到新模型对象
  const newModel = models.value.find(m => m.id === modelId);
  if (!newModel) {
    console.error('[ChatInput] Model not found:', modelId);
    return;
  }

  // 获取新模型的思考强度选项
  const options = getModelThinkingEfforts(newModel, providers.value);

  // 获取当前选择的思考强度
  const currentEffort = localThinkingEffort.value;

  // 智能迁移逻辑：
  let newThinkingEffort: string;

  if (options.includes(currentEffort)) {
    // 规则1：如果当前值在新选项中仍然有效，保持不变
    newThinkingEffort = currentEffort;
  } else {
    // 规则2：当前值无效，需要重新选择
    const nonOffOptions = options.filter(e => e !== 'none');

    if (currentEffort === 'none') {
      // 原来是 off 但新选项不含 off → 选最小思考档
      newThinkingEffort = nonOffOptions.length > 0 ? nonOffOptions[0] : 'none';
    } else {
      // 原来的非 off 值失效 → 选中间值
      newThinkingEffort = nonOffOptions.length > 0 ? nonOffOptions[Math.floor(nonOffOptions.length / 2)] : 'none';
    }
  }

  // 更新本地思考强度状态
  localThinkingEffort.value = newThinkingEffort;

  // 构建配置变更对象
  const configChanges = {
    modelId: modelId,
    thinkingEffort: newThinkingEffort,
  };

  emit('config-change', configChanges);
};

// 处理收藏状态变化（同步更新本地模型数据）
const handleFavoriteChanged = (modelId: string, isFavorite: boolean) => {
  const model = models.value.find(m => m.id === modelId);
  if (model) {
    model.isFavorite = isFavorite;
  }
};

// 附件弹窗切换
const toggleAttachPopover = async () => {
  if (attachPopoverVisible.value) {
    attachPopoverVisible.value = false;
    return;
  }
  try {
    await loadKnowledgeBases();
  } catch (error) {
    console.error('加载附件列表失败:', error);
  }
  attachPopoverVisible.value = true;
};

// 切换知识库选中状态 - 立即同步到父组件
const toggleKnowledgeBaseSelection = (kbId: string) => {
  const currentKbIds = props.config?.knowledgeBaseIds || [];
  const newKbIds = [...currentKbIds];
  const index = newKbIds.indexOf(kbId);

  if (index === -1) {
    // 添加知识库
    newKbIds.push(kbId);
  } else {
    // 移除知识库
    newKbIds.splice(index, 1);
  }

  // 立即触发配置变更事件
  emit('config-change', { knowledgeBaseIds: newKbIds });
};

// 切换附件选中状态 - 立即同步到父组件
const toggleAttachmentSelection = (typeId: string, itemId: string) => {
  const currentAttachments = { ...(props.config?.attachments || {}) };
  const ids = [...(currentAttachments[typeId] || [])];
  const index = ids.indexOf(itemId);

  if (index === -1) {
    ids.push(itemId);
  } else {
    ids.splice(index, 1);
  }

  if (ids.length === 0) {
    delete currentAttachments[typeId];
  } else {
    currentAttachments[typeId] = ids;
  }

  emit('config-change', { attachments: currentAttachments });
};



// 移除单个知识库
const removeKnowledgeBase = (kbId: string) => {
  const currentKbIds = props.config?.knowledgeBaseIds || [];
  const newKbIds = currentKbIds.filter(id => id !== kbId);

  //  修复：同时触发两个事件
  emit('update:knowledgeBaseIds', newKbIds);  // 更新本地状态
  emit('config-change', { knowledgeBaseIds: newKbIds });  // 通知父组件保存配置
};

/**
 * 加载模型列表（带退避重试）。
 *
 * <p>为什么必须重试：`GET /api/providers` 在服务端瞬时故障（重启 / DB 抖动 / 迁移窗口）
 * 时会 500，旧实现只 `console.error` 就放弃，`models` 从此恒空 → 模型按钮退化成
 * 「+ 添加模型」，点击还被硬跳去模型管理页——用户实测偶发（2026-10-08），
 * 线上也确有 `/api/providers` 500 的时段（升级前）。</p>
 *
 * <p>每次尝试前先清空 `models/providers`：重试若直接 push 会累积重复项。</p>
 */
const loadModels = async () => {
  const MAX_ATTEMPT = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPT; attempt++) {
    try {
      const response = await apiService.fetchModels();
      models.value = [];
      providers.value = [];
      response.items.forEach(provider => {
        // 过滤只保留 mode_type 为 'text' 的模型
        const textModels = provider.models?.filter(model => model.modelType === "text") ?? [];
        // 兜底：后端多数只给 modelName，个别供应商给 model，这里统一兜底。
        // 注意**不能**退回 model.id：id 是复合键 `providerId:modelId`（如
        // `1791352877398:laguna-s-2.1`），当名字显示出来就是「前缀不该显示」的
        // 那个缺陷（用户实测：模型面板/选择器按钮显示 `providerId:modelId`）。
        // 后端行实测字段：id=复合键、model=裸模型名、provider_id；故优先取 model。
        textModels.forEach(model => {
          model.modelName = model.modelName || model.model || model.id;
        });
        models.value.push(...textModels);
        delete provider.models;
        // 只有当该供应商有符合条件的模型时才加入列表
        if (textModels.length > 0) {
          providers.value.push(provider);
        }
      });
      modelsLoaded.value = true;
      modelsLoadFailed.value = false;
      modelsLoadError.value = "";
      if (models.value.length > 0 && !props.config?.modelId) {
        // 如果没有传入 modelId，默认选择第一个
        emit('update:modelId', models.value[0].id);
      }
      return;
    } catch (error) {
      console.error(`获取模型列表失败(第 ${attempt}/${MAX_ATTEMPT} 次):`, error);
      // 留最后一次的真实原因，供弹窗展示（原来只有 console 有，弹窗里只能编一个假的）
      modelsLoadError.value = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_ATTEMPT) {
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
  }
  // 全部尝试失败：如实标记，供「打开模型面板」时区分失败与空
  modelsLoadFailed.value = true;
};

// 加载知识库列表
const loadKnowledgeBases = async () => {
  try {
    const response = await apiService.fetchKnowledgeBases();
    knowledgeBases.value = response.items || [];

    //  新增：自动清理本地存储中的无效知识库ID
    const localKbIds = props.config?.knowledgeBaseIds || [];
    if (localKbIds.length > 0 && knowledgeBases.value.length > 0) {
      // 过滤出有效的知识库ID
      const validKbIds = localKbIds.filter(id =>
        knowledgeBases.value.some(kb => kb.id === id)
      );

      // 如果本地存储中有无效的ID，自动清理它们
      if (validKbIds.length !== localKbIds.length) {
        // 通知父组件更新配置，清除无效的知识库ID
        emit('config-change', { knowledgeBaseIds: validKbIds });
      }
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error);
  }
};

// 加载附件类型（插件 registerAttachmentType 注册，含可选项列表）
const loadAttachmentTypes = async () => {
  try {
    const types = await apiService.getAttachmentTypes();
    const results: typeof attachmentTypes.value = [];
    for (const t of types) {
      let items: Array<{ id: string; name: string; description?: string }> = [];
      try {
        const lists = await apiService.getPluginAttachments(t.pluginId);
        const found = lists.find(l => l.typeId === t.id);
        items = found?.items || [];
      } catch { }
      results.push({ ...t, _items: items });
    }
    attachmentTypes.value = results;
  } catch {
    attachmentTypes.value = [];
  }
};

// 已选知识库但列表为空时（刷新后），按需加载一次以恢复标签显示
watch(() => props.config?.knowledgeBaseIds, (kbIds) => {
  if (kbIds && kbIds.length > 0 && knowledgeBases.value.length === 0) {
    loadKnowledgeBases();
  }
}, { immediate: true });

// 已选附加连接但类型列表为空时（刷新后），按需加载一次以恢复标签显示
watch(() => props.config?.attachments, (attachments) => {
  if (attachments && Object.keys(attachments).length > 0 && attachmentTypes.value.length === 0) {
    loadAttachmentTypes();
  }
}, { immediate: true });

// 文件处理函数
const checkFileConflict = async (newFileType: string) => {
  const currentFileType = uploadFiles.value[0]?.fileType;
  const conflictType = newFileType === 'image' ? t('common.fileType.file') : t('common.fileType.image');

  if (currentFileType && currentFileType !== newFileType) {
    const confirmed = await confirm(t('chat.input.overwriteTitle', { type: conflictType }), t('chat.input.overwriteConfirmDesc', { type: conflictType }));
    if (!confirmed) return false;

    uploadFiles.value = []; // setter 会自动清理预览 URL
  }
  return true;
};

const processFiles = async (files: File[], fileType: string) => {
  if (files.length === 0) return;

  const normalizedFileType = fileType.toUpperCase();
  if (!(await checkFileConflict(FILE_TYPES[normalizedFileType].type))) return;

  for (const file of files) {
    if (isFileType(file, normalizedFileType)) {
      const fileObj = createFileObject(file, normalizedFileType);
      uploadFiles.value.push(fileObj);
    }
  }
};

// 事件处理函数
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  processFiles(Array.from(target.files ?? []), 'TEXT');
  target.value = '';
};

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  processFiles(Array.from(target.files ?? []), 'IMAGE');
  target.value = '';
};

const handlePaste = async (event: ClipboardEvent) => {
  // 只有输入框被聚焦时才处理粘贴事件
  if (!focused.value) return;

  const clipboardData = event.clipboardData;
  if (!clipboardData?.items) return;

  // 立即阻止默认粘贴行为，避免浏览器自动插入内容
  event.preventDefault();

  const items = Array.from(clipboardData.items);
  let pastedText = '';
  const filesToProcess = [];

  // 提取所有文件项（包括可能的图片）
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) filesToProcess.push(file);
    }
  }

  // 提取文本内容（异步）
  const textItem = items.find(item => item.kind === 'string' && item.type.startsWith('text/'));
  if (textItem) {
    pastedText = await new Promise((resolve) => {
      textItem.getAsString(resolve);
    });
  }

  // Step 3: 判断文本长度并决定如何处理
  const MAX_TEXT_LENGTH = 2000;
  if (pastedText && pastedText.length > MAX_TEXT_LENGTH) {
    // 超长文本 → 转为 .txt 文件
    const blob = new Blob([pastedText], { type: 'text/plain' });
    const file = new File([blob], `pasted_text_${Date.now()}.txt`, { type: 'text/plain' }) as FileWithContent;
    // 在 File 对象上挂载原始文本，供 createFileObject 检测并存储
    file._originalContent = pastedText;
    filesToProcess.push(file);
  } else if (pastedText) {
    // 短文本 → 插入到 Tiptap 编辑器
    if (editor.value) {
      editor.value.chain().focus().insertContent(pastedText).scrollIntoView().run();
    }
  }

  // 处理文件（优先图片，否则文本类文件）
  if (filesToProcess.length > 0) {
    const imageFiles = filesToProcess.filter(file => isFileType(file, 'IMAGE'));
    const textFiles = filesToProcess.filter(file => isFileType(file, 'TEXT'));

    if (imageFiles.length > 0) {
      await processFiles(imageFiles, 'IMAGE');
    } else if (textFiles.length > 0) {
      await processFiles(textFiles, 'TEXT');
    }
    // TODO：如果既不是图片也不是支持的文本类型，会被忽略（可选加提示）
  }
};


// ==================== 拖拽上传 ====================
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;

let dragCounter = 0;

const handleDragEnter = () => {
  dragCounter++;
  isDragOver.value = true;
};

const handleDragLeave = () => {
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isDragOver.value = false;
  }
};

const handleDrop = async (event: DragEvent) => {
  dragCounter = 0;
  isDragOver.value = false;

  const droppedFiles = event.dataTransfer?.files;
  if (!droppedFiles || droppedFiles.length === 0) return;

  const files = Array.from(droppedFiles);
  const imageFiles = files.filter(file => isFileType(file, 'IMAGE'));
  const textFiles = files.filter(file => isFileType(file, 'TEXT'));

  if (imageFiles.length > 0) {
    await processFiles(imageFiles, 'IMAGE');
  }
  if (textFiles.length > 0) {
    await processFiles(textFiles, 'TEXT');
  }
};

// 内容预览相关（粘贴自动转换的文本文件预览）
const previewDialogVisible = ref(false);
const previewContent = ref('');
const previewFileName = ref('');

const showFilePreview = (file: any) => {
  if (!file.isPasted || !file.originalContent) return;
  previewContent.value = file.originalContent;
  previewFileName.value = file.displayName;
  previewDialogVisible.value = true;
};

const closeFilePreview = () => {
  previewDialogVisible.value = false;
  previewContent.value = '';
  previewFileName.value = '';
};

const removeFile = (fileId: number) => {
  const index = uploadFiles.value.findIndex(file => file.id === fileId);
  if (index !== -1) {
    uploadFiles.value.splice(index, 1); // setter 会自动清理预览 URL
  }
};

// UI 交互函数
const triggerFileInput = () => fileInputRef.value?.click();
const triggerImageInput = () => imageInputRef.value?.click();

// 思考等级（合并「深度思考开关」与「推理强度档位」后的单一状态，用户需求 4.2）：
// thinkingEnabled = 是否思考；localThinkingEffort = 具体档位。两者由同一个「思考等级」入口维护。
const thinkingEnabled = ref(false);
const webSearchEnabled = ref(false);

/** 思考等级弹层是否可见 */
const thinkingLevelPopoverVisible = ref(false);
/** 思考等级按钮锚点（弹层定位用） */
const thinkingLevelButtonRef = ref<any>(null);
/** 打开/收起思考等级弹层 */
const toggleThinkingLevelPopover = () => {
  thinkingLevelPopoverVisible.value = !thinkingLevelPopoverVisible.value;
};
/** 档位选项：首位固定「不思考」(none)，其后为模型声明的档位；
 *  模型未声明档位但当前会话/角色支持思考时，给整套通用档位（约定俗成的
 *  default + low/medium/high/max），让滑块始终是多档形态，不会只剩两档。 */
const thinkingLevelOptions = computed(() => {
  const levels = thinkingEffortOptions.value.length
    ? thinkingEffortOptions.value
    : ['default', 'low', 'medium', 'high', 'max'];
  return ['none', ...levels];
});
/** 当前值：关闭思考时统一显示为「不思考」 */
const currentThinkingValue = computed(() => (thinkingEnabled.value ? localThinkingEffort.value : 'none'));
/** 选择档位：none = 关闭思考；其余 = 开启思考并切到该档 */
const handleThinkingLevelSelect = (level: string) => {
  if (level === 'none') {
    thinkingEnabled.value = false;
    // 「不思考」同样要落库：若只在本地关闭，会话里仍存着上次的档位，
    // 刷新后会被判为「已保存档位 = 开启」而错误复现（实测缺陷）。
    handleThinkingEffortChange('none');
    return;
  }
  thinkingEnabled.value = true;
  handleThinkingEffortChange(level);
};

// 模型名 / 思考档位变化时重算按钮宽度，保证自适应宽度始终贴合内容（用户需求 4.1 / 4.2）。
// 必须放在 thinkingEnabled 声明之后：watch 的数组源会立即求值以收集依赖，
// 提前引用会让 currentThinkingLabel 在初始化前访问 thinkingEnabled（TDZ）。
// flush:'post' 让回调在 DOM 更新后再量，避免量到旧文本。
watch([currentModelNameOnly, currentThinkingLabel], () => {
  modelButtonWidth.value = `${measureModelButtonNaturalWidth()}px`
}, { flush: 'post' })

// MCP 工具选择（仅管理员，会话级持久化）
// 响应式管理员标记：组件可能在角色写入前挂载，挂载时再校正一次，避免登录后按钮缺失
const admin = ref(isAdmin());
onMounted(() => { admin.value = isAdmin(); });
const mcpButtonRef = ref<any>(null);
const mcpPopoverVisible = ref(false);
const mcpSelectedIds = computed(() => {
  const v = props.config?.mcpServerIds;
  if (!v) return [];
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
});
function toggleMcpPopover() {
  mcpPopoverVisible.value = !mcpPopoverVisible.value;
}
function handleMcpChange(ids: string[]) {
  emit('config-change', { mcpServerIds: ids.join(',') });
}

// ========== 选中模型后自动补齐模型参数 ==========
//
// 模型信息卡（限制 / 成本 / 能力）与模型列表行的上下文徽标，读的都是
// GET /api/providers 回来的 config + metrics。模型没在模型管理里手填上下文、
// 指标库也还没同步过时这些字段就是空的 —— 用户看到的现象是「选了模型，
// 对话配置（参数）没自动填充」，信息卡里 Context / Output 全是 —。
//
// 这里在模型切换时按模型名去指标端点拉一次快照并**就地回填模型行**，
// 信息卡与徽标立刻有值。三条约束：
//   ① 端点是 @Permission("admin")，非管理员只会 403，故仅管理员触发；
//   ② 每个模型一次会话内只拉一次（成功 / 未收录 / 失败都记为已尝试），
//      避免每次选模型都打一次注定失败的请求；
//   ③ 只读回填，不写库 —— 落库仍归模型管理的「自动获取 / 同步价格」。

/** 已尝试补齐的模型（providerId + 模型名），防重复请求 */
const paramsFilled = new Set<string>();
/** 正在补齐中的模型，防并发重复请求 */
const paramsFilling = new Set<string>();

/** 供应商 id：模型行的 providerId / provider_id，或复合键 id 的前缀 */
const modelProviderIdOf = (m: any): string =>
  String(m?.providerId || m?.provider_id || String(m?.id || '').split(':')[0] || '');
/** 裸模型名：模型行的 modelName / model */
const modelNameOf = (m: any): string => String(m?.modelName || m?.model || '');

/** 宽松正数判断：区分「未填」与 0 */
const isPositive = (v: any): boolean =>
  v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;

/**
 * 是否还缺参数：上下文窗口或单次输出上限任一取不到就补一次。
 *
 * @param m 模型行
 * @returns 缺参数返回 true
 */
const needsModelParams = (m: any): boolean => {
  const cfg = m?.config || {};
  const mt = m?.metrics || {};
  const hasCtx = getModelContextWindow(m) != null;
  const hasOut = isPositive(cfg.maxOutputTokens) || isPositive(m?.max_tokens)
    || isPositive(mt.max_output_tokens);
  return !hasCtx || !hasOut;
};

/**
 * 把指标端点返回的快照就地写回模型行（上下文 / 输出上限 / 价格 / 能力 / 模态）。
 *
 * @param m    模型行（models 列表里的同一个对象，改完信息卡会自动重渲染）
 * @param snap GET /providers/{id}/models/metrics 的 data
 */
const applyMetricSnapshot = (m: any, snap: any) => {
  const num = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const ctx = num(snap.context_window_tokens);
  const out = num(snap.max_output_tokens);
  const cfg: any = m.config && typeof m.config === 'object' ? { ...m.config } : {};
  if (ctx != null) {
    m.context_window = m.context_window ?? ctx;
    if (!num(cfg.contextWindow)) cfg.contextWindow = ctx;
  }
  if (out != null) {
    m.max_tokens = m.max_tokens ?? out;
    if (!num(cfg.maxOutputTokens)) cfg.maxOutputTokens = out;
  }

  // 价格 / 知识截止 / 发布时间：并进 metrics（信息卡「成本」「元数据」两区读它）
  const metrics: Record<string, any> = { ...(m.metrics || {}) };
  for (const key of [
    'context_window_tokens', 'max_output_tokens',
    'price_input_per_musd', 'price_output_per_musd',
    'price_cache_hit_per_musd', 'price_cache_write_per_musd',
    'knowledge_cutoff', 'release_date', 'model_family',
  ]) {
    if (snap[key] !== undefined && snap[key] !== null && snap[key] !== '') {
      metrics[key] = snap[key];
    }
  }
  m.metrics = metrics;

  // 能力 / 特性：信息卡「能力」区读 config.features，模态图标读 input/outputCapabilities
  const caps = new Set<string>(Array.isArray(cfg.capabilities) ? cfg.capabilities : []);
  const feats = new Set<string>(Array.isArray(cfg.features) ? cfg.features : []);
  const flag = (v: any) => v === true || v === 'true' || v === 1;
  if (flag(snap.attachment)) caps.add('attachment');
  if (flag(snap.reasoning)) { caps.add('reasoning'); feats.add('thinking'); }
  if (flag(snap.tool_call)) { caps.add('tool_call'); feats.add('tools'); }
  if (flag(snap.temperature_supported)) caps.add('temperature');
  if (flag(snap.open_weights)) caps.add('open_weights');
  cfg.capabilities = [...caps];
  cfg.features = [...feats];

  const mod = snap.modalities;
  if (mod && typeof mod === 'object') {
    if (Array.isArray(mod.input) && mod.input.length) cfg.inputCapabilities = mod.input;
    if (Array.isArray(mod.output) && mod.output.length) cfg.outputCapabilities = mod.output;
  }
  m.config = cfg;
};

/**
 * 当前模型缺参数时，按模型名拉一次指标快照回填。
 *
 * @param m 当前模型行；null（还没选中模型）直接返回
 */
const ensureModelParams = async (m: any) => {
  if (!m) return;
  const providerId = modelProviderIdOf(m);
  const name = modelNameOf(m);
  if (!providerId || !name) return;
  const key = `${providerId}::${name}`;
  if (paramsFilled.has(key) || paramsFilling.has(key)) return;
  if (!needsModelParams(m)) { paramsFilled.add(key); return; }
  if (!admin.value) { paramsFilled.add(key); return; }
  paramsFilling.add(key);
  try {
    const snap: any = await apiService.fetchModelMetrics(providerId, name);
    if (snap && snap.found !== false) {
      applyMetricSnapshot(m, snap);
    }
    paramsFilled.add(key);
  } catch (error) {
    // 403 / 指标源不可达：本次会话不再重试
    paramsFilled.add(key);
    console.debug('[ChatInput] 模型参数补齐跳过:', error);
  } finally {
    paramsFilling.delete(key);
  }
};

// 模型切换即补齐：覆盖「打开会话时的默认模型」与「用户手动选模型」两条路径。
// 只依赖模型 id，回填改的是模型行自身的字段，不会反过来再触发本 watcher。
watch(() => currentModel.value, (m) => { void ensureModelParams(m); }, { immediate: true });

const optimizing = ref(false);
const handleOptimize = async () => {
  const text = editor.value ? editor.value.getText() : "";
  if (!text.trim() || optimizing.value) return;
  optimizing.value = true;
  try {
    const res = await apiService._request("/input/optimize", {
      method: "POST",
      data: { input: text },
    });
    const payload = res?.data ?? res;
    const optimized = payload?.optimized || payload?.optimizedContent;
    if (!optimized || !optimized.trim()) {
      message.warning(t('chat.input.optimizeUnavailable'));
    } else if (optimized.trim() === text.trim()) {
      message.info(t('chat.input.optimizeNoChange'));
    } else if (editor.value) {
      editor.value.commands.setContent(optimized);
    }
  } catch (e) {
    console.warn("优化失败", e);
    message.error(t('chat.input.optimizeFailed'));
  } finally {
    optimizing.value = false;
  }
};

// 从编辑器文档提取发送内容：纯文本（跳过技能徽标，避免 [/skill:...] 序列化文本污染消息）
// 同时收集显式选中的技能名
const extractSendContent = (): { text: string; skillNames: string[] } => {
  if (!editor.value) {
    return { text: inputContent.value, skillNames: [] };
  }
  const blocks: string[] = [];
  const skillNames: string[] = [];
  editor.value.state.doc.forEach((block: any) => {
    let line = '';
    block.descendants((node: any) => {
      const t = node.type.name;
      if (t === 'text') {
        line += node.text || '';
      } else if (t === 'hardBreak') {
        line += '\n';
      } else if (t === 'command') {
        const provider = node.attrs.providerId;
        const name = node.attrs.name;
        if (provider === 'skill' && name && !skillNames.includes(name)) {
          skillNames.push(name);
        }
      }
      return true;
    });
    blocks.push(line);
  });
  return { text: blocks.join('\n'), skillNames };
};

/**
 * 「用户自己发消息」信号：每次自发送 +1，建议面板 watch 到变化就销毁自己。
 *
 * 刻意用单向信号 prop，而不是模板 ref + defineExpose 调子组件方法：
 * 后者在本组件上实测触发 `Maximum recursive updates exceeded in <ChatInput>`，
 * 整个会话页渲染不出来（107/108/146 全白）。信号没有回写，天然不成环。
 */
const suggestionDismissSignal = ref(0);

const sendMessage = async () => {
  const { text: content, skillNames } = extractSendContent();
  if (!content.trim() && uploadFiles.value.length === 0) {
    return;
  }

  // 检查是否有文件正在上传
  const uploadingFiles = uploadFiles.value.filter(f =>
    f.uploadStatus === 'uploading' || f.uploadStatus === 'queued'
  );

  if (uploadingFiles.length > 0) {
    // 弹窗提醒用户选择
    const shouldWait = await showUploadWaitingDialog(uploadingFiles.length);

    if (shouldWait) {
      // 用户选择继续等待,仅关闭弹窗,不执行发送
      // 用户观察上传完成后再次点击发送按钮即可
      return;
    }
    // 用户选择直接发送或关闭弹窗,继续执行下面的发送逻辑
  }

  // 过滤出已上传完成的文件(包括没有上传状态的文件)
  const uploadedFiles = uploadFiles.value.filter(f =>
    f.uploadStatus === 'uploaded' || !f.uploadStatus
  );


  // 用户自己在输入框里发消息 = 明确不采纳当前这批建议 → 通知建议面板销毁自己。
  //
  // 放在这里（而不是 sendMessage 开头）是刻意的：上面几个 return 都是"没真正发出去"
  // 的分支（内容为空、用户选择继续等上传），那些情况下面板该继续留着。
  // 点击建议那条路已由面板自己在 onPick 里销毁，这里多一次信号是无害的。
  suggestionDismissSignal.value += 1;

  // 发送消息(仅包含已上传完成的文件)；content 已剥离技能徽标，skillNames 单独透传
  emit('send', {
    content,
    files: uploadedFiles,
    knowledgeBaseIds: props.config?.knowledgeBaseIds || [],
    think: thinkingEnabled.value,
    search: webSearchEnabled.value,
    skillNames,
    useSkill: skillNames.length > 0,
  });

  // 清空编辑器和文件列表
  editor.value?.chain().clearContent().focus().run();
  uploadFiles.value = [];
};

// 显示上传等待对话框
async function showUploadWaitingDialog(uploadingCount: number): Promise<boolean> {
  try {
    await ElMessageBox.confirm(
      t('chat.input.uploadingDesc', { count: uploadingCount }),
      t('chat.input.uploadingTitle'),
      {
        confirmButtonText: t('chat.input.continueWaiting'),
        cancelButtonText: t('chat.input.sendDirectly'),
        type: 'warning',
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
      }
    );
    return true; // 用户点击"继续等待"
  } catch {
    return false; // 用户点击"直接发送"或关闭弹窗
  }
}


const adjustTextareaHeight = () => {
  const textarea = messageInputRef.value;
  if (!textarea) return;

  textarea.style.height = "auto";
  let height = Math.min(textarea.scrollHeight, 240);
  if (height < 45) height = 45;
  textarea.style.height = height + "px";
  isInputExpanded.value = textarea.scrollHeight > 60;
};

const abortResponse = () => {
  emit('abort')
}


// ==================== 命令选择弹窗（斜杠/艾特） ====================
const openCommandPicker = async (query: string = '', trigger: 'slash' | 'mention' = 'slash') => {
  pickerQuery.value = query;
  selectedIndex.value = 0;
  commandTrigger.value = trigger;
  pickerItemSet.value = trigger;
  pickerOpenedByButton.value = false;
  // 按需加载对应触发方式的命令
  await loadCommands(trigger);
  commandPickerVisible.value = true;
};

/**
 * 由工具条按钮唤起弹层：「+」= 附件入口 + 指令，技能 = 斜杠命令。
 *
 * <p>为什么不另写一套弹层：`/` 已经有带搜索、键盘上下选中的浮层，
 * 再写一个「+ 菜单」就是同一功能的第三种视觉，用户要学两遍。
 *
 * <p>它与在编辑器里敲 / 、@ 只有两点差异，都记在 pickerOpenedByButton 上：
 * 1. 选中条目后不能删「最后一个 / 或 @ 之后的文本」——那是编辑器触发的产物（见 selectCommand）；
 * 2. 编辑器失焦不该关掉它——失焦正是「点了按钮」的副作用（见 onBlur）。
 */
const openCommandPickerByButton = async (set: 'slash' | 'plus') => {
  if (commandPickerVisible.value) {
    closeCommandPicker();
    return;
  }
  pickerQuery.value = '';
  selectedIndex.value = 0;
  // CommandPicker 的 trigger 只影响空状态与图标口径，按 slash 走（与技能按钮原行为一致）
  commandTrigger.value = 'slash';
  pickerItemSet.value = set;
  pickerOpenedByButton.value = true;
  if (set === 'plus') {
    await loadPlusCommands();
  } else {
    await loadCommands('slash');
  }
  commandPickerVisible.value = true;
};

// 弹层渲染的候选集由 pickerItemSet 决定，其余逻辑（过滤、键盘、选中）完全共用
const pickerItems = computed(() =>
  pickerItemSet.value === 'plus' ? commandsCache.plus : commandsCache[pickerItemSet.value]
);

const closeCommandPicker = () => {
  commandPickerVisible.value = false;
  pickerQuery.value = '';
  selectedIndex.value = 0;
};

const checkCommandTrigger = () => {
  if (!editor.value) return;

  const { state } = editor.value;
  const { selection } = state;
  const { $from } = selection;

  const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '\n');

  // 检测 / 触发（斜杠命令）
  const lastSlashIndex = textBefore.lastIndexOf('/');
  if (lastSlashIndex >= 0) {
    const charBeforeSlash = textBefore[lastSlashIndex - 1];
    if (lastSlashIndex === 0 || charBeforeSlash === ' ' || charBeforeSlash === '\n') {
      const query = textBefore.slice(lastSlashIndex + 1);
      if (!query.includes(' ')) {
        openCommandPicker(query, 'slash');
        return;
      }
    }
  }

  // 检测 @ 触发（艾特命令）
  const lastAtIndex = textBefore.lastIndexOf('@');
  if (lastAtIndex >= 0) {
    const charBeforeAt = textBefore[lastAtIndex - 1];
    if (lastAtIndex === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') {
      const query = textBefore.slice(lastAtIndex + 1);
      if (!query.includes(' ')) {
        openCommandPicker(query, 'mention');
        return;
      }
    }
  }

  closeCommandPicker();
};

const handlePickerKeydown = (e: KeyboardEvent) => {
  if (!commandPickerVisible.value || !commandPickerRef.value) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      commandPickerRef.value.moveDown();
      break;
    case 'ArrowUp':
      e.preventDefault();
      commandPickerRef.value.moveUp();
      break;
    case 'Enter':
      e.preventDefault();
      commandPickerRef.value.confirmSelection();
      break;
    case 'Escape':
      e.preventDefault();
      closeCommandPicker();
      break;
  }
};

const selectCommand = (item: any) => {
  if (!editor.value) return;

  // 只有 / 、@ 触发的场景才清理「触发字符及其后的查询文本」。
  // 「+」/技能按钮不是靠编辑器里的触发字符打开的：此时若照删「最后一个 / 或 @ 之后的文本」，
  // 会把用户正在写的内容误删。
  if (!pickerOpenedByButton.value) {
    const { state } = editor.value;
    const { selection } = state;
    const { $from } = selection;

    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '\n');
    const slashIndex = textBefore.lastIndexOf('/');

    // 删除触发字符（/ 或 @）及其后的查询文本
    const triggerIndex = textBefore.lastIndexOf('/');
    const atIndex = textBefore.lastIndexOf('@');
    const delIndex = Math.max(triggerIndex, atIndex);

    if (delIndex >= 0) {
      const from = $from.start() + delIndex;
      const to = $from.pos;
      editor.value.chain().focus().deleteRange({ from, to }).run();
    }
  }

  // 内置命令：执行会话级动作（压缩上下文 / 创建技能 / 新建会话），不插入命令节点
  if (item && item.builtin) {
    closeCommandPicker();
    void runBuiltinCommand(item.builtin);
    return;
  }

  const providerId = item.providerId || 'skill';
  const name = item.name;
  const label = item.label || item.name;
  const trigger = commandTrigger.value === 'mention' ? '@' : '/';

  editor.value
    .chain()
    .focus()
    .insertContent({
      type: 'command',
      attrs: { providerId, name, label, trigger },
    })
    .run();

  closeCommandPicker();
  editorContent.value = editor.value.getText();
};

// ==================== 命令数据加载（按需 + 缓存） ====================

/**
 * 内置命令：不依赖后端命令列表，始终排在 `/` 列表最前。
 *
 * <p>为什么要内置：会话此前只有后端下发的「技能 / MCP 工具」，没有「压缩上下文」
 * 这类会话级动作（用户反馈「会话缺少内置的命令，比如压缩上下文，创建技能等等」）。
 */
const BUILTIN_COMMANDS = [
  {
    name: 'builtin-compress',
    label: '压缩上下文',
    description: '把当前会话历史压缩为摘要，释放上下文窗口',
    builtin: 'compress',
    providerId: 'builtin',
  },
  {
    name: 'builtin-create-skill',
    label: '创建技能',
    description: '打开技能管理，新建一个可复用技能',
    builtin: 'create-skill',
    providerId: 'builtin',
  },
  {
    name: 'builtin-new-session',
    label: '新建会话',
    description: '另起一个会话继续',
    builtin: 'new-session',
    providerId: 'builtin',
  },
];

/**
 * 「+」指令栏里的附件类入口。
 *
 * <p>它们只是把原先散在 AttachmentPopover 里的三个入口提到指令栏里，
 * 具体面板仍然复用 AttachmentPopover / 原生文件选择框，没有第二套实现。
 */
const ATTACH_COMMANDS = [
  {
    name: 'plus-attach-image',
    label: '上传图片',
    description: '从本机选择图片添加到本轮消息',
    builtin: 'attach-image',
    providerId: 'builtin',
  },
  {
    name: 'plus-attach-file',
    label: '上传文件',
    description: '从本机选择文件添加到本轮消息',
    builtin: 'attach-file',
    providerId: 'builtin',
  },
  {
    name: 'plus-knowledge-base',
    label: '知识库 / 附加连接',
    description: '选择知识库或已接入的附加数据源',
    builtin: 'knowledge-base',
    providerId: 'builtin',
  },
];

/**
 * 「+」指令栏里不属于 `/` 列表的入口：附件三项 + 切换模型。
 *
 * <p>它们都**不下沉**到 `/` 里 —— `/` 的语义是「技能 / 工具命令」，
 * 混进「上传图片」「切换模型」会让用户以为存在这样一条斜杠命令。
 */
const PLUS_ONLY_COMMANDS = [
  ...ATTACH_COMMANDS,
  {
    name: 'plus-switch-model',
    label: '切换模型',
    description: '打开模型选择面板，为当前会话换一个模型',
    builtin: 'model',
    providerId: 'builtin',
  },
];

/**
 * 「+」指令栏的固定部分：附件入口在前（用户对「+」的既有预期就是加东西），
 * 会话级指令在后。
 *
 * <p>附件三项与 BUILTIN_COMMANDS 都**不是**复制出来的第二份定义：
 * 后者直接引用同一批对象，所以「压缩上下文」这类指令只维护一处。
 */
const PLUS_COMMANDS = [...PLUS_ONLY_COMMANDS, ...BUILTIN_COMMANDS];

/**
 * 执行内置命令。
 *
 * @param kind 内置命令类型（compress / create-skill / new-session / attach-image / attach-file / knowledge-base / model）
 */
async function runBuiltinCommand(kind: string): Promise<void> {
  if (kind === 'attach-image') {
    triggerImageInput();
    return;
  }
  if (kind === 'attach-file') {
    triggerFileInput();
    return;
  }
  if (kind === 'knowledge-base') {
    // 「+」已经不再直接开附件面板，知识库 / 附加连接的入口挪到这里。
    // 面板锚点仍是「+」本身，视觉位置与改动前一致。
    if (!attachPopoverVisible.value) await toggleAttachPopover();
    return;
  }
  if (kind === 'model') {
    // 复用既有的模型选择面板；它自带「没有可用模型」的引导与失败提示
    await openModelPanel();
    return;
  }
  if (kind === 'compress') {
    const sessionId = props.sessionId == null ? '' : String(props.sessionId);
    if (!sessionId) {
      message.warning('当前没有会话，无法压缩上下文');
      return;
    }
    if (sessionStore.sessionIsStreaming(sessionId)) {
      message.warning('会话正在生成中，请稍后再试');
      return;
    }
    try {
      sessionStore.setSessionIsCompressing(sessionId, true);
      const res: any = await apiService.compressSession(sessionId);
      if (res && res.success) {
        message.success('上下文已压缩');
      } else {
        message.warning(res?.message || '未执行压缩');
      }
    } catch (error: any) {
      message.error(error?.message || '压缩失败');
    } finally {
      sessionStore.setSessionIsCompressing(sessionId, false);
    }
    return;
  }
  if (kind === 'create-skill') {
    router.push({ name: 'Skills' });
    return;
  }
  if (kind === 'new-session') {
    router.push({ name: 'Chat', params: { sessionId: 'new-session' } });
  }
}

const loadCommands = async (trigger: 'slash' | 'mention') => {
  try {
    const res = await apiService.fetchCommands(trigger, props.characterId || undefined);
    const remote = res.items || [];
    // 内置命令只挂在 / 列表上（@ 是提及角色 / 工具，语义不同）
    commandsCache[trigger] = trigger === 'slash' ? [...BUILTIN_COMMANDS, ...remote] : remote;
  } catch (error) {
    console.error('获取命令列表失败:', error);
    // 后端命令列表不可用时，内置命令仍然要可用
    if (trigger === 'slash') {
      commandsCache[trigger] = [...BUILTIN_COMMANDS];
    }
  }
};

/**
 * 「+」指令栏的候选集。
 *
 * <p>后端的技能 / MCP 工具从 `/` 的缓存里取（同一份数据不重复请求），
 * 但要先剥掉内置段再拼，否则「压缩上下文」会在栏里出现两次。
 */
const loadPlusCommands = async () => {
  await loadCommands('slash');
  const remoteOnly = (commandsCache.slash || []).filter((item: any) => !item.builtin);
  commandsCache.plus = [...PLUS_COMMANDS, ...remoteOnly];
};


// 编辑器高度自适应
watch(editorContent, () => {
  nextTick(() => {
    const pmEl = document.querySelector('.message-editor .ProseMirror') as HTMLElement | null;
    if (pmEl) {
      pmEl.style.minHeight = '52px';
      pmEl.style.maxHeight = '240px';
      isInputExpanded.value = pmEl.scrollHeight > 60;
    }
  });
});

// 监听思考强度配置变化，同步到本地状态
watch(() => props.config?.thinkingEffort, (newEffort) => {
  if (newEffort !== undefined && newEffort !== localThinkingEffort.value) {
    localThinkingEffort.value = newEffort;
  }
  // 档位是思考开关的唯一持久化事实源：'none' = 关，其余（含 'default'）= 开。
  // 修刷新回显 & 「不思考」被瞬态 'default' 重新点亮两类缺陷。
  if (newEffort === 'none') thinkingEnabled.value = false;
  else if (newEffort) thinkingEnabled.value = true;
}, { immediate: true });

// 角色/会话级默认能力：进入会话时预置深度思考、在线检索开关
watch(() => props.config?.defaultThink, (val) => {
  if (val === true || val === false) {
    // 已保存档位优先：档位在 = 用户开着思考，不能被角色默认关掉
    const savedEffort = props.config?.thinkingEffort;
    const hasSavedEffort = !!savedEffort && savedEffort !== 'none';
    thinkingEnabled.value = val || hasSavedEffort;
    // 开启思考但档位仍是「不思考」时补齐为「默认」，避免按钮态与档位自相矛盾（用户需求 4.2）
    if (thinkingEnabled.value && localThinkingEffort.value === 'none') localThinkingEffort.value = 'default';
  }
}, { immediate: true });
watch(() => props.config?.defaultSearch, (val) => {
  if (val === true || val === false) webSearchEnabled.value = val;
}, { immediate: true });

watch(() => props.buttons, (value) => {
  // 外部传入的按钮配置只影响非模型特性控制的按钮
  Object.keys(showButtons).forEach(key => {
    const k = key as keyof typeof showButtons;
    if (value && k in value) {
      showButtons[k] = value[k];
    }
  });
}, { immediate: true });

// 全局点击事件：点击外部关闭命令弹层
const handleClickOutside = (e: MouseEvent) => {
  if (commandPickerVisible.value) {
    const pickerEl = commandPickerRef.value?.$el as HTMLElement;
    const skillBtn = document.querySelector('.skill-btn') as HTMLElement;
    // 「+」和技能按钮都能唤起弹层：点它们不算「点外部」，
    // 否则弹层会在按钮的 click 处理之前被关掉（表现为点一下没反应）
    const attachBtn = attachButtonRef.value as HTMLElement | null;
    if (pickerEl && !pickerEl.contains(e.target as Node) &&
        skillBtn && !skillBtn.contains(e.target as Node) &&
        attachBtn && !attachBtn.contains(e.target as Node)) {
      closeCommandPicker();
    }
  }
};

onMounted(() => {
  // 模型名称按钮宽度自适应内容（最小 MODEL_BUTTON_MIN_WIDTH，用户需求 4.1）：挂载后量一次自然宽并置位
  nextTick(() => {
    modelButtonWidth.value = `${measureModelButtonNaturalWidth()}px`
  });
  adjustTextareaHeight();
  loadModels();
  loadPromptForms(); // 形态列表来自角色配置，决定徽标文案/图标与切换浮层的选项
  initThinkingEffort(); // 初始化思考强度
  document.addEventListener('click', handleClickOutside);

  // 初始化 Tiptap 编辑器
  try {
    const tiptapEditor = new Editor({
      extensions: [
        StarterKit,
        // 仓库内存在两份 @tiptap/core（app 的 node_modules 与 pnpm store），
        // CommandNode 的 Node<any,any> 与 Editor 期望的 AnyExtension 类型身份不同，
        // 结构完全兼容，这里用 as never 断开模块身份比较。
        CommandNode as never,
        Placeholder.configure({
          placeholder: t('chat.input.editorPlaceholder'),
        }),
      ],
      content: parseCommandTags(props.value || ''),
      editable: true,
      editorProps: {
        handleKeyDown: (_view, event) => {
          // 弹窗打开时拦截键盘事件
          if (commandPickerVisible.value) {
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
              handlePickerKeydown(event);
              return true;
            }
          }
          // Shift+Enter 换行，Enter 发送消息
          if (event.key === 'Enter' && !event.shiftKey) {
            // 与发送按钮相同的禁用条件
            if (props.readonly || !inputContent.value.trim() || !props.config?.modelId) {
              event.preventDefault();
              return true;
            }
            event.preventDefault();
            sendMessage();
            return true;
          }
          // Shift+Enter 允许默认行为（换行）
          if (event.key === 'Enter' && event.shiftKey) {
            return false;
          }
          return false;
        },
        handlePaste: (_view, event) => {
          // 调用自定义粘贴处理，阻止 Tiptap 默认行为
          handlePaste(event);
          return true;
        },
      },
      onUpdate: ({ editor: ed }) => {
        editorContent.value = ed.getText();
        checkCommandTrigger();
        nextTick(() => {
          const pmEl = document.querySelector('.message-editor .ProseMirror') as HTMLElement | null;
          if (pmEl) {
            const height = Math.min(pmEl.scrollHeight, 240);
            pmEl.style.minHeight = '58px';
            pmEl.style.maxHeight = '240px';
            isInputExpanded.value = pmEl.scrollHeight > 60;
            // 自动滚动光标到可见区域（修复 Shift+Enter 换行时光标被遮挡）
            ed.commands.scrollIntoView();
          }
        });
      },
      onFocus: () => {
        focused.value = true;
        emit('focus');
      },
      onBlur: () => {
        focused.value = false;
        emit('blur');
        // 编辑器失焦后要收起 `/` 弹层，否则它会一直挂在输入框上方。
        // 但按钮唤起的弹层不能在这里收：点「+」/技能本身就会让编辑器失焦，
        // 200ms 后这次「失焦」会把刚打开的弹层关掉，表现为「点一下闪一下就没了」。
        // 按钮唤起的弹层统一交给 handleClickOutside 关。
        setTimeout(() => {
          if (pickerOpenedByButton.value) return;
          if (!document.querySelector('.command-picker:hover')) {
            closeCommandPicker();
          }
        }, 200);
      },
    });
    editor.value = tiptapEditor;

    // 将编辑器处理器挂载到 DOM 元素，供全局右键菜单使用（解耦方式）
    const editorEl = document.querySelector('.message-editor') as (HTMLElement & { __editorHandler?: unknown }) | null;
    if (editorEl) {
      editorEl.__editorHandler = {
        getSelectionText: () => {
          return tiptapEditor.state.doc.textBetween(
            tiptapEditor.state.selection.from,
            tiptapEditor.state.selection.to,
            '',
          );
        },
        paste: (text: string) => {
          tiptapEditor.chain().focus().insertContent(text).scrollIntoView().run();
        },
        deleteSelection: () => {
          tiptapEditor.commands.deleteSelection();
        },
        selectAll: () => {
          tiptapEditor.commands.focus();
          tiptapEditor.commands.selectAll();
        },
      };
      editorEl.setAttribute('data-editor-handler', 'true');
    }
  } catch (err) {
    console.error('[ChatInput] Tiptap editor init failed:', err);
  }
});

// 清理事件监听器和预览 URL
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (modelOpenTimer) clearTimeout(modelOpenTimer)
  if (modelCloseTimer) clearTimeout(modelCloseTimer)

  // 销毁编辑器
  if (editor.value) {
    editor.value.destroy();
  }

  // 清理所有预览 URL，防止内存泄漏
  previewUrls.value.forEach((url, fileId) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  previewUrls.value.clear();
});

/**
 * 在光标处插入文本
 */
function insertText(text: string) {
  if (!editor.value || !text) return;
  editor.value.chain().focus().insertContent(text).scrollIntoView().run();
}

/**
 * 插入 snip 选区徽标
 */
function insertBadge(data: {
  path: string;
  fileName: string;
  startLine?: number;
  endLine?: number;
  content: string;
  label: string;
}) {
  if (!editor.value) return;
  editor.value
    .chain()
    .focus()
    .insertContent({
      type: 'command',
      attrs: {
        providerId: 'snip',
        name: 'quote',
        label: data.label,
        trigger: '/',
        path: data.path,
        start: data.startLine ? String(data.startLine) : '',
        end: data.endLine ? String(data.endLine) : '',
        content: data.content,
      },
    })
    .run();
  editorContent.value = editor.value.getText();
}

defineExpose({ insertText, insertBadge, currentModelName });
</script>
<style scoped>
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色走 --el-*。本应用 refactor.css 已把 --el-* 映射到 --color-* 主题层，
      9 套配色换肤时 --el-* 会跟着变。
   2. 已有的纯令牌表达式（--color-primary / --color-sidebar-bg-hover 等，
      无写死兜底）原样保留：它们是应用主题层的真实入口，改写只会引入无谓的
      视觉变化。本次只处理「裸写死的 hex / rgb」与「带冗余 hex 兜底的令牌」。
   3. 卡片 / 容器不加投影；本文件唯一允许的 box-shadow 是键盘焦点环。
   ============================================================================ */

/* 思考按钮激活状态 - 灯泡亮起。原值 #10b981（emerald）取语义更准的成功色令牌 */
.thinking-active {
  color: var(--el-color-success) !important;
  /* 光晕色跟前景同源：原值 rgba(16,185,129,0.5) 即 success 的 50% 透明度 */
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--el-color-success) 50%, transparent));
}

.thinking-active-text {
  color: var(--el-color-success) !important;
  font-weight: 600;
}

/* 输入框区域样式 */
.input-area {
  position: relative;
  z-index: 10;
  /* 卡片改为「填充底 + 细描边」的浅灰面（对齐目标 UI）：
     · 不再用纯白 + 重投影，整张卡靠与页面底色的明度差分层；
     · 底色走 --bg-fill（主题里的填充一档），换肤时跟着走；
     · 圆角收到 --radius-lg(12px)，与下拉面板、动作条同一语言。 */
  padding: 10px 10px 6px;
  background: var(--bg-fill, var(--el-fill-color-light, #f1f5fb));
  border: 1px solid var(--border-default, var(--color-input-border, #e2e9f3));
  border-radius: var(--radius-lg, 12px);
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

/* 聚焦：只提亮描边 + 一圈极淡主色光环。用 box-shadow 而非 outline，
   不会挤压内部布局，也不会在圆角处画成方形。 */
.input-area:focus-within {
  border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--color-input-border, #e2e9f3));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

/* 壁纸场景：半透明 + 背景模糊（与编辑提示条同一口径，两段不会一实一透） */
.input-area.is-backdrop {
  background: color-mix(in srgb, var(--bg-fill, var(--el-fill-color-light, #f1f5fb)) 60%, transparent);
  backdrop-filter: blur(16px);
}

/* 编辑态：与上方「正在编辑消息」提示条拼成同一张卡。
   提示条负责顶部圆角与上/侧边框，本段只留底部圆角与下/侧边框。
   本段必须显式去掉上边框：交界处那条 1px 线由提示条内层画（ChatPanel 的
   .edit-banner__inner），两段都不画交界边，那条线就不会因为负边距或亚像素
   四舍五入在交界处错位、加粗。 */
.input-area--continues-banner {
  border-top-width: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: 0;
  /* 投影必须只向下。0 2px 12px 的模糊上下各漫出 blur/2 = 6px，减去 2px 的下移后
     仍有约 4px 糊在提示条上，在交界处压出一条灰带 —— 这才是「看起来还是两张卡」
     的主因，和宽度/圆角无关。负 spread 把上边界拉回输入卡内，向下那侧几乎不变。
     （2026-11-08：B 案改版后常态已无投影，这条只在编辑态保留，
       保证与提示条拼接处仍然没有灰带。） */
  box-shadow: 0 2px 12px -6px rgb(0 0 0 / 12%);
}

/* 暗色下输入卡本来就没有投影（工具类里的 dark:shadow-none），这里保持同一口径 */
html.dark .input-area--continues-banner {
  box-shadow: none;
}

/* 拖拽悬停高亮 */
.input-area.drag-over {
  border-color: var(--el-color-primary) !important;
  background-color: color-mix(in srgb, var(--el-color-primary) 8%, var(--color-input-bg)) !important;
}

/* Tiptap 编辑器样式 - 模拟 textarea */
:deep(.message-editor .ProseMirror) {
  width: 100%;
  min-height: 44px;
  max-height: 240px;
  border: none;
  resize: none;
  outline: none;
  font-size: var(--size-text-base, 14px);
  line-height: 1.55;
  /* 左右留 4px：卡片自身有 10px 内边距，正文文字落在 14px 处，
     与底栏左组第一个图标（10px + 8px 内边距）视觉上同一条竖线 */
  padding: 0 4px;
  background: transparent;
  overflow-y: auto;
  box-sizing: border-box;
  transition: height var(--el-transition-duration-fast, 0.2s) ease;
  color: inherit;
}

:deep(.message-editor .ProseMirror p) {
  margin: 0;
}

/* Placeholder 灰色提示文案样式 */
:deep(.message-editor .ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--el-text-color-placeholder);
  pointer-events: none;
  height: 0;
}

/* 编辑器容器 */
.editor-container {
  position: relative;
}

/* 命令徽标样式。可点但不可 Tab 聚焦（contenteditable="false"），
   故只给指针与悬停反馈，不挂焦点环 */
:deep(.command-badge) {
  display: inline;
  font-size: 12px;
  line-height: inherit;
  cursor: pointer;
  user-select: none;
  background: var(--el-fill-color-light);
  color: var(--color-text);
  padding: 0 8px;
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  margin-right: 4px;
}

/* 保留旧样式兼容 */
.message-input {
  width: 100%;
  height: auto;
  border: none;
  resize: none;
  outline: none;
  font-size: var(--size-text-base);
  line-height: 1.8;
  padding: 0 8px;
  background: transparent;
  overflow-y: auto;
  box-sizing: border-box;
  transition: height var(--el-transition-duration-fast, 0.2s) ease;
  min-height: 58px;
}


/* 底栏：与卡身同一块底色，不再是一条独立的灰带（目标 UI 里整张卡就是一个面）。
   竖直方向压到 32px 一档：图标 28px 见方 + 上下各 2px，
   右侧三个控件（模型 / 智能体 / 发送）共用同一条基线。

   窄窗兜底（2026-10-09 实测）：≤420px 时左右两组合计超出容器，两组作为整体换行，
   不隐藏任何按钮；右组用 margin-left:auto 保证单行时贴右、换行后仍贴右。 */
.input-actions {
  flex-wrap: wrap;
  row-gap: 4px;
  align-items: center;
  justify-content: flex-start;
  margin: 2px -10px -6px;
  padding: 0 2px 2px;
  min-height: 34px;
}

.left-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  /* 极窄窗兜底：组内按钮也允许换行（正常宽度下不会触发） */
  flex-wrap: wrap;
  row-gap: 4px;
}

:deep(.el-button+.el-button) {
  margin-left: 0;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  /* 配合 .input-actions 的换行：单行时贴右，窄窗换行后仍贴右（space-between
     在换行后的单子项行会退化为靠左） */
  margin-left: auto;
}

.right-tools {
  display: flex;
  align-items: center;
}


/* 工具按钮 - 原生 button
   目标 UI 里左组是三个**无边框、无底色**的纯图标按钮：常态只有图标本身，
   悬停才浮出一层极淡的底色。尺寸 28×28，与右侧模型/智能体/发送同一基线。 */
.tool-btn {
  color: var(--text-tertiary, var(--color-text-gray));
  cursor: pointer;
  font-size: 14px;
  height: 28px;
  min-width: 28px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 8px);
  outline: none;
}

/* 键盘焦点环：28px 的裸 button 默认 outline 太弱，用主色光环代替 */
.tool-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.tool-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 6%, transparent);
  color: var(--text-primary, var(--color-text));
}

.tool-btn:active:not(:disabled) {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 10%, transparent);
}

.tool-btn:disabled {
  cursor: default;
  opacity: 0.45;
}

/* 激活态：主色图标 + 一层主色薄底（原为 Ant Design 蓝阶写死，暗色下刺眼） */
.tool-btn-active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent) !important;
  color: var(--el-color-primary) !important;
}

.tool-btn-active:hover {
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent) !important;
  color: var(--el-color-primary) !important;
}

/* ===== 目标按钮（靶心 + 已用/预算）=====
   颜色与目标条同源：进行中主色、已暂停警示色、已完成成功色；
   计数器始终是低对比灰，只有数字本身要读。 */
.goal-btn__glyph {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.goal-btn__count {
  color: var(--text-tertiary, var(--color-text-gray));
  font-size: 12px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.goal-btn--on {
  color: var(--el-color-primary);
}

.goal-btn--on:hover:not(:disabled) {
  color: var(--el-color-primary);
}

.goal-btn--paused {
  color: var(--el-color-warning, #d97706);
}

.goal-btn--paused:hover:not(:disabled) {
  color: var(--el-color-warning, #d97706);
}

.goal-btn--done {
  color: var(--el-color-success, #3da35d);
}

/* ===== 模型 + 思考档位：一个控件，两段可点 =====
   截图形态：`✳ 模型名 / 默认`。左半段点开模型面板，右半段点开思考档位；
   两段之间是一个 5px 的 `/`，整组没有描边与底色，只在悬停时浮一层极淡的底。 */
.model-chip {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: var(--radius-md, 8px);
  transition: background-color 0.16s ease;
}

.model-chip:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
}

.model-chip.is-open {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 7%, transparent);
}

.model-chip__name {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  min-width: 0;
  max-width: 260px;
  padding: 0 3px 0 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary, var(--color-text));
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  outline: none;
  border-radius: var(--radius-md, 8px) 0 0 var(--radius-md, 8px);
}

.model-chip__name:focus-visible,
.model-chip__effort:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.model-chip__glyph {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: var(--text-secondary, var(--color-text-gray));
}

.model-chip__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.model-chip__sep {
  flex-shrink: 0;
  color: var(--text-tertiary, var(--color-text-gray));
  font-size: 12px;
  line-height: 1;
  user-select: none;
}

.model-chip__effort {
  height: 28px;
  max-width: 120px;
  padding: 0 8px 0 3px;
  border: none;
  background: transparent;
  color: var(--text-tertiary, var(--color-text-gray));
  font-size: 12.5px;
  line-height: 1;
  cursor: pointer;
  outline: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 0 var(--radius-md, 8px) var(--radius-md, 8px) 0;
  transition: color 0.16s ease;
}

.model-chip__effort:hover,
.model-chip__effort.is-on {
  color: var(--text-primary, var(--color-text));
}

/* ===== 智能体（形态） =====
   截图：一个橙色圆形人像徽标 + 形态名，没有描边胶囊。
   徽标颜色按形态区分：构建 = warning（暖橙），规划 = success（青绿），
   其余自定义形态回落主色 —— 与下拉面板里的圆点同源。 */
.mode-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--text-primary, var(--color-text));
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  outline: none;
  transition: background-color 0.16s ease;
  --mode-color: var(--el-color-primary);
}

.mode-chip.is-build {
  --mode-color: var(--el-color-warning, #e6a23c);
}

.mode-chip.is-plan {
  --mode-color: var(--el-color-success, #3da35d);
}

.mode-chip:hover {
  background: color-mix(in srgb, var(--text-primary, #0f172a) 5%, transparent);
}

.mode-chip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--mode-color) 22%, transparent);
}

.mode-chip__badge {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--mode-color);
}

.mode-chip__badge svg {
  width: 100%;
  height: 100%;
}

.mode-chip__text {
  line-height: 1;
  white-space: nowrap;
}

/* 发送按钮 - 原生 button
   截图里它是一个**纯箭头**：没有实心圆底，禁用时是灰色箭头，可用时是主色箭头。
   这里保留 30×30 的点击区（图标 19px），悬停才浮一层主色薄底。 */
.send-btn {
  cursor: pointer;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.16s ease, color 0.16s ease, transform 0.12s ease;
  outline: none;
  flex-shrink: 0;
  margin-left: 2px;
}

.send-glyph {
  width: 19px;
  height: 19px;
  fill: currentColor;
}

.send-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.send-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.9);
}

.send-btn:disabled {
  color: var(--text-tertiary, var(--color-text-gray));
  cursor: not-allowed;
  opacity: 0.6;
}

/* 停止按钮是危险语义：箭头换成方块图标，底色走 danger 的薄底 */
.send-btn.stop-btn {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

.send-btn.stop-btn:hover {
  background: color-mix(in srgb, var(--el-color-danger) 16%, transparent);
}

.send-btn.stop-btn:active {
  transform: scale(0.9);
}

/* 入队态与普通发送同形，只把箭头换成「加号叠加」的语义色 */
.send-btn.queue-btn {
  color: var(--el-color-primary);
}

/* ========== 粘贴文本预览弹窗样式 ========== */

/* 弹窗 body 利用 el-dialog 原生滚动 */
.pasted-preview-dialog :deep(.el-dialog__body) {
  max-height: 65vh;
  overflow-y: auto;
  padding: 16px 20px;
}

.pasted-preview-text {
  margin: 0;
  padding: 16px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Menlo', monospace;
  color: var(--el-text-color-primary);
}

/* 响应式：更窄窗口把技能入口收敛回「+」菜单（沿用原有窄窗策略） */
@media (max-width: 900px) {
  .skill-btn {
    display: none !important;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  :deep(.message-editor .ProseMirror),
  .message-input,
  .tool-btn,
  .send-btn {
    transition: none;
  }
}
</style>
