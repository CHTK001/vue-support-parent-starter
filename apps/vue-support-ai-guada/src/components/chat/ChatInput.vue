<template>
  <div class="w-full flex flex-col items-center">
    <!-- 输入框区域 -->
    <div
      class="input-area p-[12px_8px_10px_8px] min-h-15 w-full bg-(--color-input-bg) border border-(--color-input-border) rounded-(--size-rounded-radius) transition-[border-color,background-color] duration-150"
      :class="[styleClass, { 'drag-over': isDragOver }, { 'bg-(--color-input-bg)': !backdrop }, { 'bg-(--color-input-bg)/60 backdrop-blur-xl ': backdrop }]"
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
            :items="commandsCache[commandTrigger]" :query="pickerQuery" :selected-index="selectedIndex"
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
            <!-- 附件/图片/知识库按钮（放到最左侧） -->
            <button ref="attachButtonRef" class="tool-btn" @click.stop="toggleAttachPopover">
              <el-icon size="16">
                <Add24Regular />
              </el-icon>
            </button>
            <AttachmentPopover v-model:visible="attachPopoverVisible" :anchor-el="attachButtonRef"
              :knowledge-bases="knowledgeBases" :selected-kb-ids="props.config?.knowledgeBaseIds || []"
              :selected-attachments="props.config?.attachments || {}" @select-image="triggerImageInput"
              @select-file="triggerFileInput" @toggle-kb="toggleKnowledgeBaseSelection"
              @toggle-attachment="toggleAttachmentSelection" />

            <!-- 运行模式按钮（仅管理员：Build/Plan，图标+tip） -->
            <LTooltip v-if="admin" :content="runModeLabel" placement="top">
              <button ref="runModeButtonRef" class="tool-btn" @click.stop="toggleRunModePopover">
                <el-icon size="16">
                  <component :is="runModeIcon" class="text-gray-600" />
                </el-icon>
              </button>
            </LTooltip>
            <RunModePopover v-if="admin" v-model:visible="runModePopoverVisible" :anchor-el="runModeButtonRef"
              :current-value="currentRunMode" @select="handleRunModeChange" />
            <el-divider v-if="admin" direction="vertical"></el-divider>

            <!-- 技能按钮（图标+tip） -->
            <LTooltip content="技能" placement="top">
              <button class="tool-btn skill-btn" @click.stop="openCommandPicker('', 'slash')">
                <el-icon size="16">
                  <Wrench24Regular />
                </el-icon>
              </button>
            </LTooltip>

            <!-- MCP 选择按钮（仅管理员；图标+tip） -->
            <LTooltip v-if="admin" content="MCP 工具" placement="top">
              <button ref="mcpButtonRef" class="tool-btn"
                :class="{ 'tool-btn-active': mcpSelectedIds.length }" @click.stop="toggleMcpPopover">
                <el-icon size="16"><PlugConnected20Regular /></el-icon>
              </button>
            </LTooltip>
            <McpSelectorPopover v-if="admin" v-model:visible="mcpPopoverVisible"
              :anchor-el="mcpButtonRef" :selected-ids="mcpSelectedIds" @change="handleMcpChange" />
          </template>
            <!-- 深度思考开关（图标+tip） -->
            <LTooltip content="深度思考" placement="top">
              <button class="tool-btn" :class="{ 'tool-btn-active': thinkingEnabled }"
                @click.stop="thinkingEnabled = !thinkingEnabled">
                <el-icon size="16"><BrainCircuit20Regular /></el-icon>
              </button>
            </LTooltip>
            <!-- 网页搜索开关（图标+tip） -->
            <LTooltip content="在线检索" placement="top">
              <button class="tool-btn" :class="{ 'tool-btn-active': webSearchEnabled }"
                @click.stop="webSearchEnabled = !webSearchEnabled">
                <el-icon size="16"><GlobeShield20Regular /></el-icon>
              </button>
            </LTooltip>
            <!-- 输入优化按钮（图标+tip） -->
            <LTooltip :content="optimizing ? '优化中…' : '优化输入'" placement="top">
              <button class="tool-btn" :disabled="optimizing || !editor?.getText().trim()" @click.stop="handleOptimize">
                <el-icon size="16" v-if="!optimizing"><Wand20Regular /></el-icon>
                <el-icon size="16" v-else class="is-loading"><Loading /></el-icon>
              </button>
            </LTooltip>
        </div>
        <div class="right-actions flex items-center gap-1">
          <slot name="right-actions-before" />
          <!-- 模型选择按钮：悬停显示当前模型信息；宽度为自然宽的 2 倍 -->
          <LTooltip :content="modelInfoTooltip" placement="top">
            <button ref="modelButtonRef" @click.stop="openModelPanel" class="model-selector-btn"
              :class="{ 'is-open': modelButtonExpanded }" :style="{ width: modelButtonWidth }">
              <div class="w-5 h-5 shrink-0 mr-1">
                <Avatar v-if="currentModel" :src="getModelAvatarPath(currentModel.modelName, detectModelProvider(currentModel.modelName)) || undefined"
                  :name="currentModel.modelName" type="assistant" :round="false" class="w-full h-full" />
              </div>
              <span class="text-sm font-medium truncate flex-1 min-w-0"
                style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{
                  currentModelNameOnly }}</span>
              <span v-if="currentThinkingLabel" class="text-xs text-gray-400 shrink-0 ml-1">{{ currentThinkingLabel }}</span>
            </button>
          </LTooltip>
          <!-- 发送/停止按钮（流式时：无输入=停止，有输入=入队） -->
          <LTooltip v-if="streaming && !inputContent.trim()" :content="t('chat.input.stopGenerating')" placement="top">
            <button class="send-btn stop-btn" @click="abortResponse">
              <el-icon size="18">
                <Stop24Filled />
              </el-icon>
            </button>
          </LTooltip>
          <LTooltip v-else :content="streaming ? t('chat.input.enqueue') : t('chat.input.send')" placement="top">
            <button class="send-btn" :class="{ 'queue-btn': streaming }" @click="sendMessage"
              :disabled="props.readonly || !inputContent.trim() || !props.config?.modelId">
              <el-icon size="18">
                <Send24Filled />
              </el-icon>
            </button>
          </LTooltip>
        </div>
      </div>

      <!-- 模型选择器弹窗 -->
      <ModelSelectorPanel v-model:visible="modelPanelVisible" :anchor-el="modelButtonRef" :models="models"
        :providers="providers" :current-model-id="props.config?.modelId || null"
        :thinking-effort-options="thinkingEffortOptions" :thinking-effort-value="localThinkingEffort"
        @select="handleModelSelect" @favorite-changed="handleFavoriteChanged"
        @select-thinking-effort="handleThinkingEffortChange" />

      <!-- 粘贴文本预览弹窗（利用 el-dialog 原生滚动） -->
      <el-dialog v-model="previewDialogVisible" :title="t('chat.input.previewTitle', { name: previewFileName })"
        width="640px" :close-on-click-modal="false" destroy-on-close class="pasted-preview-dialog"
        @close="closeFilePreview">
        <pre class="pasted-preview-text">{{ previewContent }}</pre>
        <template #footer>
          <el-button @click="closeFilePreview">{{ t('common.close') }}</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, watch, computed, nextTick, onUnmounted, onMounted, reactive, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon, ElButton, ElDialog, ElTag, ElMessageBox, ElMessage } from 'element-plus';
import type { Model, ModelProvider } from '@/types/api';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import FileItem from '../ui/FileItem.vue';
import LTooltip from '../ui/LTooltip.vue';
import AttachmentPopover from './chat-input/AttachmentPopover.vue';
import MaxTokensPopover from './chat-input/MaxTokensPopover.vue';
import RunModePopover from './chat-input/RunModePopover.vue';
import ModelSelectorPanel from './chat-input/ModelSelectorPanel.vue';
import McpSelectorPopover from './chat-input/McpSelectorPopover.vue';
import { CommandNode } from './chat-input/commandNode';
import CommandPicker from './chat-input/CommandPicker.vue';
import { getModelThinkingEfforts, getThinkingEffortLabel } from '@/utils/modelUtils';
import Avatar from '../ui/Avatar.vue';
import { getModelAvatarPath } from '@/utils/modelUtils';
import { detectModelProvider } from '@/utils/modelUtils';
import {

  Send24Filled, Stop24Filled, BookSearch24Regular, Cloud24Regular,
  Flash24Regular, ClipboardTask24Regular, Add24Regular, Wrench24Regular, BrainCircuit20Regular, GlobeShield20Regular, Wand20Regular, PlugConnected20Regular
} from '@vicons/fluent'
import { usePopup } from '@/composables/usePopup';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { apiService } from '@/services/ApiService';
import { isAdmin } from '@repo/core';

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

const { confirm } = usePopup();
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
const commandsCache = reactive<{ slash: any[]; mention: any[] }>({
  slash: [],
  mention: [],
});
const commandTrigger = ref<'slash' | 'mention'>('slash');
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
});

// 图片预览 URL 字典（与 file 对象解耦）
const previewUrls = ref(new Map<number, string>());

const props = defineProps({
  value: { type: String, default: '' },
  files: { type: Array as PropType<ChatFile[]>, default: () => [] },
  streaming: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
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

// 思考强度相关
const localThinkingEffort = ref<string>('none'); // 'none' | 'low' | 'medium' | 'high' | 'max' | ...

// 运行模式相关
const runModeButtonRef = ref<any>(null);
const runModePopoverVisible = ref(false);

const currentRunMode = computed(() => props.config?.runMode === 'plan' ? 'plan' : 'build');
const runModeLabel = computed(() => {
  return currentRunMode.value === 'plan' ? t('chat.input.runModePlan') : t('chat.input.runModeBuild');
});
const runModeIcon = computed(() => {
  return currentRunMode.value === 'plan' ? ClipboardTask24Regular : Flash24Regular;
});

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
  return model ? model.modelName.split("/").pop() : '自动';
});

const currentThinkingLabel = computed(() => {
  if (!showButtons.thinkingButton) return '';
  const effort = localThinkingEffort.value;
  return getThinkingEffortLabel(effort);
});

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
  const parts: string[] = [model.modelName];
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
const MODEL_BUTTON_MAX_WIDTH = 400
const MODEL_BUTTON_TRANSITION_MS = 200
let modelOpenTimer: ReturnType<typeof setTimeout> | null = null;
let modelCloseTimer: ReturnType<typeof setTimeout> | null = null;

function measureModelButtonNaturalWidth(): number {
  const button = modelButtonRef.value as HTMLElement | null
  if (!button) return 80

  const clone = button.cloneNode(true) as HTMLElement
  clone.classList.remove('is-open')
  clone.style.position = 'fixed'
  clone.style.visibility = 'hidden'
  clone.style.pointerEvents = 'none'
  clone.style.width = 'auto'
  clone.style.maxWidth = `${MODEL_BUTTON_MAX_WIDTH}px`
  clone.style.left = '-9999px'
  document.body.appendChild(clone)
  const width = Math.min(MODEL_BUTTON_MAX_WIDTH, Math.max(80, clone.getBoundingClientRect().width))
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
  // 输入框模型名称的宽度：取自然宽的 2 倍（上限见 MODEL_BUTTON_MAX_WIDTH）
  modelButtonWidth.value = `${measureModelButtonNaturalWidth() * 2}px`
  modelCloseTimer = setTimeout(() => {
    // 常驻 2 倍宽（用户要求「选中的宽度增加一倍」）：收起时保持，不回落到自适应窄宽
    modelButtonWidth.value = `${measureModelButtonNaturalWidth() * 2}px`
    modelCloseTimer = null
  }, MODEL_BUTTON_TRANSITION_MS)
}

const openModelPanel = () => {
  // 如果没有模型，直接跳转到模型管理页面
  if (!models.value || models.value.length === 0) {
    window.location.href = '/models'
    return
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

// 加载模型列表
const loadModels = async () => {
  try {
    const response = await apiService.fetchModels();
    response.items.forEach(provider => {
      // 过滤只保留 mode_type 为 'text' 的模型
      const textModels = provider.models?.filter(model => model.modelType === "text") ?? [];
      // 兜底：后端多数只给 modelName，个别供应商给 model，这里统一兜底
      textModels.forEach(model => {
        model.modelName = model.modelName || model.id;
      });
      models.value.push(...textModels);
      delete provider.models;
      // 只有当该供应商有符合条件的模型时才加入列表
      if (textModels.length > 0) {
        providers.value.push(provider);
      }
    });
    if (models.value.length > 0 && !props.config?.modelId) {
      // 如果没有传入 modelId，默认选择第一个
      emit('update:modelId', models.value[0].id);
    }
  } catch (error) {
    console.error('获取模型列表失败:', error);
  }
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

// 深度思考/网页搜索开关
const thinkingEnabled = ref(false);
const webSearchEnabled = ref(false);

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
      ElMessage.warning(t('chat.input.optimizeUnavailable'));
    } else if (optimized.trim() === text.trim()) {
      ElMessage.info(t('chat.input.optimizeNoChange'));
    } else if (editor.value) {
      editor.value.commands.setContent(optimized);
    }
  } catch (e) {
    console.warn("优化失败", e);
    ElMessage.error(t('chat.input.optimizeFailed'));
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
  // 按需加载对应触发方式的命令
  await loadCommands(trigger);
  commandPickerVisible.value = true;
};

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
const loadCommands = async (trigger: 'slash' | 'mention') => {
  try {
    const res = await apiService.fetchCommands(trigger, props.characterId || undefined);
    commandsCache[trigger] = res.items || [];
  } catch (error) {
    console.error('获取命令列表失败:', error);
  }
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
}, { immediate: true });

// 角色/会话级默认能力：进入会话时预置深度思考、在线检索开关
watch(() => props.config?.defaultThink, (val) => {
  if (val === true || val === false) thinkingEnabled.value = val;
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

// 全局点击事件：点击外部关闭技能弹层
const handleClickOutside = (e: MouseEvent) => {
  if (commandPickerVisible.value) {
    const pickerEl = commandPickerRef.value?.$el as HTMLElement;
    const skillBtn = document.querySelector('.skill-btn') as HTMLElement;
    if (pickerEl && !pickerEl.contains(e.target as Node) && 
        skillBtn && !skillBtn.contains(e.target as Node)) {
      closeCommandPicker();
    }
  }
};

onMounted(() => {
  // 模型名称按钮常驻 2 倍宽（用户要求「选中的宽度增加一倍」）：挂载后量一次自然宽并置位
  nextTick(() => {
    modelButtonWidth.value = `${measureModelButtonNaturalWidth() * 2}px`
  });
  adjustTextareaHeight();
  loadModels();
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
        setTimeout(() => {
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

defineExpose({ insertText, insertBadge });
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
}

/* 拖拽悬停高亮 */
.input-area.drag-over {
  border-color: var(--el-color-primary) !important;
  background-color: color-mix(in srgb, var(--el-color-primary) 8%, var(--color-input-bg)) !important;
}

/* Tiptap 编辑器样式 - 模拟 textarea */
:deep(.message-editor .ProseMirror) {
  width: 100%;
  min-height: 52px;
  max-height: 240px;
  border: none;
  resize: none;
  outline: none;
  font-size: var(--size-text-base, 14px);
  line-height: calc(var(--size-text-base) * 1.6);
  padding: 0 8px;
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


.left-tools {
  display: flex;
  align-items: center;
}

:deep(.el-button+.el-button) {
  margin-left: 0;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.right-tools {
  display: flex;
  align-items: center;
}


/* 工具按钮 - 原生 button */
.tool-btn {
  color: var(--color-text-gray);
  cursor: pointer;
  font-size: 14px;
  height: 28px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all var(--el-transition-duration-fast, 0.2s);
  background: transparent;
  border: none;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  outline: none;
}

/* 键盘焦点环：28px 的裸 button 默认 outline 太弱，用主色光环代替 */
.tool-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.tool-btn:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-text);
}

.tool-btn:active {
  background: var(--color-sidebar-bg-active);
}

/* 激活态原用 Ant Design 蓝阶（#e6f7ff / #bae7ff / #1890ff）写死，
   暗色下浅蓝底会刺眼。改为「主色 + 透明度」派生：
   浅色下仍是淡蓝底，暗色下自动变成暗底，等于顺手修掉了暗色模式缺陷 */
.tool-btn-active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent) !important;
  color: var(--el-color-primary) !important;
}

.tool-btn-active:hover {
  background: color-mix(in srgb, var(--el-color-primary) 14%, transparent) !important;
  color: var(--el-color-primary) !important;
}

/* 模型选择器按钮 - 原生 button */
/* 响应式：窗口太窄时隐藏按钮文字 */
@media (max-width: 1100px) {
  .btn-label {
    display: none;
  }
}

/* 响应式：更窄窗口隐藏技能/深度思考/在线检索按钮，收敛到 + 菜单 */
@media (max-width: 900px) {
  .skill-btn,
  .thinking-toggle,
  .search-toggle {
    display: none !important;
  }
}

/* 技能按钮 */
.skill-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.model-selector-btn {
  cursor: pointer;
  height: 28px;
  padding: 0 8px;
  border: none;
  /* 原值 16px → xl 档（胶囊按钮） */
  border-radius: var(--el-radius-xl, 16px);
  background-color: transparent;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  overflow: hidden;
  outline: none;
  font-size: 12px;
}

.model-selector-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.model-selector-btn:hover {
  background: var(--color-sidebar-bg-hover);
  color: var(--color-text);
}

.model-selector-btn:active {
  background: var(--color-sidebar-bg-active);
}

.model-selector-btn.is-open {
  background: var(--color-sidebar-bg-active);
}

/* 发送按钮 - 原生 button */
.send-btn {
  cursor: pointer;
  width: 28px;
  height: 28px;
  border: none;
  /* 原值 50%（圆形）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--el-transition-duration-fast, 0.2s);
  outline: none;
  flex-shrink: 0;
}

.send-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.send-btn:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.send-btn:active:not(:disabled) {
  background-color: var(--color-primary-active);
  transform: scale(0.92);
}

.send-btn:disabled {
  background-color: var(--color-text-disabled);
  cursor: not-allowed;
  /* 禁用态可读性：主题色系的禁用底色只是"淡化的主题色"（如涂鸦本的
     米色、蒸汽朋克的黄铜色），看不出"关"。降不透明度 + 去饱和，
     任何主题下都能一眼区分 */
  opacity: 0.45;
  filter: saturate(0.4);
}

/* 停止按钮是危险语义：改用 danger 三档派生 hover / active
   （原值 #f56c6c / #f78989 / #e64242 分别对应 base / light-3 / dark-2） */
.send-btn.stop-btn {
  background-color: var(--el-color-danger);
  color: var(--el-color-white);
}

.send-btn.stop-btn:hover {
  background-color: var(--el-color-danger-light-3);
}

.send-btn.stop-btn:active {
  background-color: var(--el-color-danger-dark-2);
}

.send-btn.queue-btn {
  background-color: var(--color-primary);
  position: relative;
}

.send-btn.queue-btn:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
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
