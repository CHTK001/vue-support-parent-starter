<template>
  <!-- 消息+输入 区域容器 -->
  <div class="flex-1 overflow-hidden w-full relative">
    <ScrollContainer ref="scrollContainerRef" class="h-full chat-scroll-container transition-opacity duration-300 px-5"
      :auto-scroll="needScrollToBottom" :aria-label="t('chat.messages')" @scroll="handleScroll">
      <!-- 初始加载时的骨架屏：仅在消息为空时显示 -->
      <div class="chat-messages w-full mx-auto pt-5 flex-1" :style="contentMaxWidthStyle">
        <template v-if="showSkeleton">
          <div class="absolute inset-0 z-1 overflow-hidden">
            <div class="px-5 mx-auto h-full flex flex-col py-10 " :style="contentMaxWidthStyle">
              <MessageSkeleton :count="2" />
            </div>
          </div>
        </template>
        <template v-else>
          <template v-if="currentSessionId && activeMessages.length === 0 && currentSession?.character">
            <!-- 欢迎页 -->
            <WelcomeScreen
              :session="currentSession"
              :recent-sessions="recentSessions"
              class="flex-1"
              @quick-action="handleQuickAction"
              @open-session="handleOpenSession"
            />
          </template>
          <template v-else>
            <!-- 加载更多历史消息指示器 -->
            <Transition name="fade-slide">
              <div v-if="isLoadingMore" class="w-full py-4 flex items-center justify-center text-gray-400">
                <el-icon class="is-loading mr-2" size="16">
                  <LoadingOutlined />
                </el-icon>
                <span class="text-xs">{{ t('chat.panel.loadingHistory') }}</span>
              </div>
            </Transition>

            <!-- 没有更多消息提示 -->
            <Transition name="fade-slide">
              <div v-if="!isLoadingMore && !hasMoreMessages && activeMessages.length > MESSAGES_PAGE_SIZE"
                class="w-full py-4 text-center text-gray-400 text-xs">
                {{ t('chat.panel.noMoreMessages') }}
              </div>
            </Transition>

            <TurnItem :class="{ 'opacity-0': showSkeleton, 'opacity-100': !showSkeleton }"
              v-for="(turn, index) in visibleTurns" :key="turn.user.id" :turn="turn" :avatar="userAvater"
              :session-id="effectiveSessionId"
              :character-name="currentSession?.character?.title"
              :character-avatar="currentSession?.character?.avatarUrl" :is-last="index === visibleTurns.length - 1"
              :allow-generate="!isStreaming && index === lastUserMessageIndex"
              :animate-in="animateIds.includes(turn.user.id)"
              @delete="deleteMessage" @edit="editMessage"
              @copy="copyMessage" @generate="generateResponse" @regenerate="regenerateResponse"
              @continue="continueResponse"
              @rewind="rewindFromHere" @fork="forkFromHere"
              @quote="handleQuote" @reaction="handleReaction"
              @view-source="handleViewSource" @export-md="handleExportMd"
              @resume-confirmation="resumeConfirmation" />
            <!-- <div class="min-h-60"></div> -->

            <!-- 压缩中状态显示 -->
            <div v-if="sessionStore.sessionIsCompressing(currentSession?.id || '')"
              class="w-full py-8 flex flex-col items-center justify-center text-gray-500">
              <el-icon class="is-loading mb-2" size="24">
                <LoadingOutlined />
              </el-icon>
              <span class="text-sm">{{ t('chat.panel.compressing') }}</span>
            </div>

            <!-- 流式输出状态指示 -->
          </template>
        </template>
      </div>
      <!-- 输入区域 - sticky 底部。
           注意：外壳只负责满屏撑满（left/right 贴滚动区边缘），内部输入框容器仍吃
           contentMaxWidthStyle（窄屏 46.5rem 居中、满屏撑满），与上方消息列同宽。
           外壳 w-full + 内层 maxWidth 的分层，是消息/输入同宽且输入框"置底"的关键。 -->
      <div class="chat-input-area sticky bottom-0 left-0 right-0 z-30 pb-2 w-full">
        <!-- 底部渐变遮罩：撑满滚动区域宽度，位于输入框上方，被输入框遮挡 -->
        <div v-if="!hasWallpaper" class="chat-bottom-fade mx-auto left-0 right-0 bottom-0" :style="contentMaxWidthStyle"></div>
        <div class="mx-auto flex flex-col items-start relative" :style="contentMaxWidthStyle" style="z-index: 1;">

          <!-- 排队消息抽屉：比输入框窄，避开圆角，微透明毛玻璃 -->
          <Transition name="queue-drawer">
            <div v-if="queueLength > 0"
              class="queue-drawer bg-(--color-surface)/80 backdrop-blur-xl rounded-(--size-dialog-rounded-radius) w-[calc(100%-48px)] margin-auto px-0.5 py-0.5 border-radius-6px mx-auto mb-2">
              <QueuedMessages :queue="messageQueue" 
                @edit="handleEditQueued" 
                @remove="handleRemoveQueued" 
                @reorder="handleReorderQueue"
                @sendNow="handleSendNow"
                @moveToFront="handleMoveToFront" />
            </div>
          </Transition>

          <!-- 编辑模式提示条：与下方输入框拼成**同一张卡**（同一宽度、只圆上两角、共享底色），
               中间不再插入任何独立块。原先外层带 px-4，比输入框左右各缩进 16px，
               加上夹在中间的「添加目标」，视觉上碎成三段。 -->
          <div v-if="editMode" class="edit-banner w-full flex">
            <div
              class="edit-banner__inner w-full flex items-center px-4 py-2">
              <el-icon size="14" class="edit-banner__icon mr-2 shrink-0">
                <Edit20Regular />
              </el-icon>
              <span class="flex-1 text-sm text-gray-600 dark:text-[#c5c7cc]">{{ t('chat.panel.editingMessage')
                }}</span>
              <el-button @click="exitEditMode" class="cancel-edit-btn" plain size="small"
                :icon="Dismiss20Regular">
                {{ t('common.cancel') }}
              </el-button>
            </div>
          </div>

          <!-- 子代理面板（编辑模式时隐藏） -->
          <AgentPanel v-if="!editMode" :agent-tabs="props.agentTabs" :active-tab-id="props.activeTabId"
            @switch="emit('switch-agent', $event)" />

          <div class="w-full flex items-center relative">

            <ChatInput ref="chatInputRef" v-model:value="inputMessage.content" v-model:files="inputMessage.files"
              :session-id="effectiveSessionId" :editing="!!editMode" :character-id="props.session?.characterId != null ? String(props.session.characterId) : ''"
              :config="chatInputConfig" :streaming="isStreaming" :readonly="readonly" mode="chat"
              :backdrop="hasWallpaper"
              @config-change="handleConfigChange" @send="handleSendMessage" @abort="abortResponse">
            </ChatInput>
          </div>
        </div>
      </div>
    </ScrollContainer>

    <!-- 回到底部悬浮按钮 -->
    <ScrollToBottomButton :show="showScrollToBottomBtn" :is-streaming="shouldButtonBreathe"
      @click="handleScrollToBottomClick" />
  </div>
  <!-- 记忆管理弹窗 -->
  <LDialog v-model="memoPanelVisible" :title="t('chat.panel.memoryManagement')" width="560px"
    :close-on-click-modal="false" destroy-on-close class="memo-panel-dialog" append-to-body>
    <MemoPanel v-if="currentSessionId" :session-id="currentSessionId" />
  </LDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, defineAsyncComponent, provide } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n()
import { apiService } from "../../services/ApiService";
import { usePopup } from "@/composables/usePopup";
import { useDebounceFn } from "@vueuse/core";
import { useSessionStore } from "../../stores/session";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth"
import { useLayoutStore } from "@/stores/layout"
import { getCurrentTurns } from "@/utils/messageUtils"
import { useStreamResponse } from "@/composables/useStreamResponse"
import type { InputMessageState, Session, QueuedMessage } from '@/types/session';
import type { Character } from '@/types/character';

// 导入新创建的 composables
import { useSessionChat } from '@/composables/useSessionChat'
import { useMessageOperations } from '@/composables/useMessageOperations'
import { useSessionTokenStats } from '@/composables/useSessionTokenStats'

// 组件导入
import TurnItem from "./TurnItem.vue";
import MessageSkeleton from "./MessageSkeleton.vue";
import { ChatInput, ScrollContainer, ScrollToBottomButton } from "../ui";
import WelcomeScreen from './WelcomeScreen.vue';
import QueuedMessages from './QueuedMessages.vue';
const MemoPanel = defineAsyncComponent(() => import("./MemoPanel.vue"));
import { LoadingOutlined } from '@vicons/antd'
import { Edit20Regular, Dismiss20Regular } from '@vicons/fluent'
import AgentPanel from './AgentPanel.vue';
import LTooltip from '../ui/LTooltip.vue';
import LDialog from '@/components/ui/LDialog.vue'


// 消息列 / 输入区宽度：跟随「设置 → 显示」的窄屏/满屏（MainLayout 仅在满屏时
// 注入 --content-max-width: none）。窄屏不下发变量，此处回退 46.5rem = 原
// max-w-186 设计值，保持现状；满屏时 none 撤掉限宽，内容列撑满剩余空间。
const contentMaxWidthStyle = computed(() => ({
  maxWidth: 'var(--content-max-width, 46.5rem)',
}))


// 弹出层工具
const { confirm, editText, toast, notify } = usePopup();
const authStore = useAuthStore()
const sessionStore = useSessionStore();
const router = useRouter();
const layoutStore = useLayoutStore();

// 有壁纸时隐藏底部渐变遮罩（壁纸已有视觉层次，不透明遮罩会像补丁）
const hasWallpaper = computed(() => !!layoutStore.wallpaperUrl);

// 新发送消息动画追踪：只有通过 handleSendMessage 发送的消息才播放入场动画
const animateIds = ref<string[]>([]);
let expectingNewMessage = false;


// 记忆管理弹窗显隐
const memoPanelVisible = ref(false);

// Props & Emits - 类型化
const props = defineProps<{
  session: Session | null;
  sessionId?: string;      // 外部传入的会话 ID（优先级高于 session.id）
  readonly?: boolean;      // 只读模式（子 Agent）
  hideHeader?: boolean;    // 隐藏头部（子 Agent）
  agentTabs?: { id: string; name: string; status: 'running' | 'completed' | 'error'; loaded?: boolean; avatarUrl?: string }[];
  activeTabId?: string;
}>();

const emit = defineEmits<{
  'update:session': [session: Session]
  openSettings: []
  'save-settings': []
  'select-character': [character: Character]  // 切换角色
  'switch-agent': [tabId: string]
  /** 「从此处分叉」成功：请上层跳转到新会话 */
  'open-session': [sessionId: string]
}>();

// 计算属性 - 类型化
const currentSession = computed({
  get: () => props.session,
  set: (session: Session | null) => emit("update:session", session!)
});

const userAvater = computed(() => authStore.user?.avatarUrl);
const currentSessionId = ref<string | null>(null);

// 共享的 Token 统计（useSessionTokenStats 自动监听流状态刷新）
const currentSessionIdRef = computed(() => currentSessionId.value);
useSessionTokenStats(currentSessionIdRef);

/**
 * 有效的会话 ID
 * 优先使用 props.sessionId，其次使用 props.session.id
 */
const effectiveSessionId = computed(() => {
  return props.sessionId || props.session?.id || '';
});
const isLoading = ref(true);
// 使用 useSessionChat composable
const {
  hasGeneratedTitle,
  resetTitleFlag,
  generateTitleIfNeeded
} = useSessionChat(sessionStore, apiService)

// 响应式数据
const scrollContainerRef = ref<any>(null);
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null);
const needScrollToBottom = ref(true);
let scrollTicking = false;
let lastScrollTop = 0;

/**
 * 锁定自动滚动到底部，供子组件通过 inject 调用。
 * 展开思考框/工具调用分组等操作时调用，防止内容高度变化触发自动滚动。
 * 用户下次滚动到底部时自动恢复。
 */
const lockScrollAnchor = () => {
  needScrollToBottom.value = false;
};
provide('lockScrollAnchor', lockScrollAnchor);

// ===== 新增 8 项功能 handler =====

/** #1 引用/回复消息：插入引用标记到输入框并聚焦 */
function handleQuote(messageId: string) {
  chatInputRef.value?.insertText(`@${messageId} `)
  nextTick(() => {
    const el = document.querySelector('.message-editor .ProseMirror') as HTMLElement
    el?.focus()
  })
}

/** #6 Reactions：本地切换状态，TODO 持久化到后端 */
const reactionState = ref<Record<string, { up?: boolean; down?: boolean }>>({})
function handleReaction(messageId: string, type: 'up' | 'down') {
  if (!currentSessionId.value) return
  const state = reactionState.value[messageId] || {}
  if (type === 'up') {
    state.up = !state.up
    if (state.up) state.down = false
  } else {
    state.down = !state.down
    if (state.down) state.up = false
  }
  reactionState.value = { ...reactionState.value, [messageId]: state }
}

/** #3 Markdown 源码查看弹窗 */
const sourceDialog = ref({ visible: false, content: '', messageId: '' })
function handleViewSource(_messageId: string, rawContent: string) {
  sourceDialog.value = { visible: true, content: rawContent || '', messageId: _messageId }
}
function copySourceContent() {
  const text = sourceDialog.value.content
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  })
  toast.success(t('common.copySuccess'))
}

/** #10 导出单条消息为 Markdown 文件 */
function handleExportMd(_messageId: string, rawContent: string) {
  if (!rawContent) return
  const blob = new Blob([rawContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `message-${(_messageId || 'export').slice(-8)}.md`
  a.click()
  URL.revokeObjectURL(url)
}

/** #1 Auto-scroll 锁定：用户向上滚动时暂停 auto-scroll，到底自动恢复 */
const scrollLockRef = ref(false)

// 消息分页加载相关状态
const INITIAL_PAGE_SIZE = 30 // 首次加载消息数量
const MESSAGES_PAGE_SIZE = 15 // 后续每次加载消息数量
const isLoadingMore = ref(false)
const hasMoreMessages = ref(true)
const SCROLL_TOP_THRESHOLD = 80 // 距离顶部多少像素触发加载更多

// 骨架屏智能显示控制
const showSkeleton = ref(false)
let skeletonTimer: ReturnType<typeof setTimeout> | null = null
let skeletonMinDisplayTimer: ReturnType<typeof setTimeout> | null = null
let skeletonShowTime: number = 0 // 记录骨架屏开始显示的时间戳
const SKELETON_MIN_DISPLAY = 500 // 骨架屏最少显示毫秒数

/** 最近的会话列表（用于欢迎页快捷入口，同角色） */
const recentSessions = computed(() =>
  sessionStore.sessionsMap
    ? Array.from((sessionStore as any).sessionsMap.values() || [])
        .filter((s: any) => s.id !== props.sessionId && s.character?.id === props.session?.character?.id)
        .slice(0, 3)
    : [],
)

/** 欢迎页快捷操作：填入输入框并聚焦 */
function handleQuickAction(label: string) {
  chatInputRef.value?.insertText(label)
  nextTick(() => {
    const editorEl = document.querySelector('.message-editor .ProseMirror') as HTMLElement
    editorEl?.focus()
  })
}

/** 欢迎页打开最近会话 */
function handleOpenSession(sessionId: string) {
  router.push(`/chat/${sessionId}`)
}

// 会话切换并发守卫：每次 handleSessionChange 递增，await 后检查是否已被新调用取代
let sessionChangeToken = 0



// 使用 useMessageOperations composable
const {
  inputMessage,
  editMode,
  exitEditMode,
  prepareNewMessage,
  enterEditMode
} = useMessageOperations(sessionStore, apiService, currentSessionId)

// isStreaming 需要在滚动逻辑之前定义
const isStreaming = computed(() => {
  const sessionId = currentSessionId.value;
  return sessionId ? sessionStore.sessionIsStreaming(sessionId) : false;
});

// 队列状态
const messageQueue = computed(() => {
  return currentSessionId.value ? sessionStore.getMessageQueue(currentSessionId.value) : [];
});
const queueLength = computed(() => messageQueue.value.length);

// 滚动管理相关状态和方法
const showScrollToBottomBtn = ref(false)
const shouldButtonBreathe = ref(false)

/**
 * 更新滚动按钮显示状态
 */
const updateScrollButtonVisibility = useDebounceFn(() => {
  const isAtBottom = scrollContainerRef.value?.isAtBottom

  if (isAtBottom) {
    showScrollToBottomBtn.value = false
    shouldButtonBreathe.value = false
    return
  }

  if (isStreaming.value) {
    showScrollToBottomBtn.value = true
    shouldButtonBreathe.value = true
  } else {
    showScrollToBottomBtn.value = false
  }
}, 100)

/**
 * 平滑滚动到底部
 */
function scrollToBottom() {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.smoothScrollToBottom()
  }
}

/**
 * 立即滚动到底部
 */
function immediateScrollToBottom() {
  scrollContainerRef.value?.immediateScrollToBottom()
}


/**
 * 处理滚动事件
 */
function handleScroll(event: any) {
  if (scrollTicking) return;
  scrollTicking = true;

  requestAnimationFrame(() => {
    // 从 ScrollContainer 的滚动元素获取 scrollTop，确保准确性
    const scrollElement = scrollContainerRef.value?.getScrollElement?.();
    const scrollTop = scrollElement?.scrollTop ?? event.target?.scrollTop ?? 0;
    const isAtBottom =
      scrollElement?.scrollHeight - scrollTop - scrollElement?.clientHeight <= 5;

    // 检测是否滚动到顶部附近，触发加载更多历史消息
    if (
      scrollTop < SCROLL_TOP_THRESHOLD &&
      hasMoreMessages.value &&
      !isLoadingMore.value &&
      currentSessionId.value
    ) {
      const earliestId = sessionStore.getEarliestMessageId(currentSessionId.value);
      if (earliestId) {
        // 立即设置标记，防止重复触发
        isLoadingMore.value = true;
        loadMoreMessages(currentSessionId.value, earliestId);
      }
    }

    // 注意，容器变小导致的滚动不应该视为向上滚动
    if (needScrollToBottom.value && lastScrollTop - scrollTop > 10 && !isAtBottom) {
      needScrollToBottom.value = false;
    } else if (!needScrollToBottom.value && isAtBottom) {
      needScrollToBottom.value = true;
    }
    lastScrollTop = scrollTop;
    // 直接用本次滚动的实测 isAtBottom（5px 容差）决定按钮显隐：
    // 原实现走 debounce 里再读一次容器的 isAtBottom，实测会出现「已经在底部了按钮还在」
    // （用户报障 2.2）。这里以本次实测为准，到底即隐藏。
    if (isAtBottom) {
      showScrollToBottomBtn.value = false;
      shouldButtonBreathe.value = false;
    } else if (isStreaming.value) {
      showScrollToBottomBtn.value = true;
      shouldButtonBreathe.value = true;
    } else {
      showScrollToBottomBtn.value = false;
    }
    scrollTicking = false;
  });
}

/**
 * 处理滚动按钮点击
 */
function handleScrollToBottomClick() {
  scrollToBottom()
}

// 监听流式状态变化
watch(() => isStreaming.value, (newVal, oldVal) => {
  shouldButtonBreathe.value = newVal
  updateScrollButtonVisibility()
}, { immediate: true })

const activeMessages = computed({
  get: () => {
    const sessionId = currentSessionId.value;
    return sessionId && !isLoading.value ? sessionStore.getMessages(sessionId) || [] : [];
  },
  set: (value: any[]) => {
    const sessionId = currentSessionId.value;
    if (sessionId) {
      sessionStore.setMessages(sessionId, value);
    }
  }
});

// 最后一条 user 消息的索引，避免每轮 v-for 重复计算
const lastUserMessageIndex = computed(() => {
  const turns = visibleTurns.value;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].user) {
      return i;
    }
  }
  return -1;
});

// ============================================
// 轮次分组：将扁平消息列表按 user 消息分组
// ============================================
const turns = computed(() => {
  const map: Record<string, { user: any; assistants: any[] }> = {};
  const order: string[] = [];
  for (const msg of activeMessages.value) {
    if (msg.role === 'user') {
      map[msg.id] = { user: msg, assistants: [] };
      order.push(msg.id);
    } else if (msg.role === 'assistant' && msg.parentId) {
      if (!map[msg.parentId]) {
        map[msg.parentId] = { user: null, assistants: [] };
        order.push(msg.parentId);
      }
      map[msg.parentId].assistants.push(msg);
    }
  }
  return order.map((id) => map[id]);
});


// 过滤：只保留有 user 消息的组
const visibleTurns = computed(() =>
  turns.value.filter((t) => t.user),
);

// 监听轮次变化：仅 handleSendMessage 发送的新消息才标记动画
watch(() => visibleTurns.value.length, (newLen, oldLen) => {
  if (!expectingNewMessage || newLen <= (oldLen || 0)) return;
  const lastTurn = visibleTurns.value[visibleTurns.value.length - 1];
  if (!lastTurn?.user) return;
  const newId = lastTurn.user.id;
  animateIds.value = [...animateIds.value, newId];
  setTimeout(() => {
    animateIds.value = animateIds.value.filter(id => id !== newId);
  }, 600);
  expectingNewMessage = false;
  nextTick(() => {
    immediateScrollToBottom()
  })
});

const currentModelId = computed({
  get() {
    return currentSession.value?.modelId ?? null;
  },
  set(value: string | null) {
    if (currentSession.value) {
      currentSession.value.modelId = value || '';
      currentSession.value.updatedAt = new Date().toISOString();
      debouncedSaveSession();
    }
  }
});

/**
 * 当前运行模式（Build/Plan），归一化历史值 normal/sandbox：除 plan 外统一为 build
 */
const currentRunMode = computed(() => {
  const runMode = currentSession.value?.settings?.runMode;
  return runMode === 'plan' ? 'plan' : 'build';
});


// ========== ChatInput 配置管理 ==========

/**
 * ChatInput 组件的配置对象（计算属性）
 * 与 handleConfigChange 中的处理逻辑一一对应，方便对照维护
 */
const chatInputConfig = computed(() => ({
  modelId: currentModelId.value,
  // 思考强度档位：缺省 'none' = 关闭（匹配 ChatInput default 为「不思考」；
  // 之前用 `|| 'default'` 导致新/空会话瞬态点亮思考，加上 watcher 未对称关掉「不思考」——修。
  // 已显式存为 'default'/'low'/'high'/'max' 的如实透传。）
  thinkingEffort: currentSession.value?.settings?.thinkingEffort || 'none',
  maxTokensLimit: currentSession.value?.settings?.maxTokensLimit ?? null,
  knowledgeBaseIds: inputMessage.value?.knowledgeBaseIds || currentSession.value?.settings?.referencedKbs || [],
  workspacePath: currentSession.value?.workspacePath || null,
  runMode: currentRunMode.value,
  attachments: currentSession.value?.settings?.attachments || {},
  mcpServerIds: currentSession.value?.mcpServerIds || '',
}));

onMounted(() => {
  // 附加连接类型由 ChatInput 内部自行加载渲染标签,此处不再维护
});

onUnmounted(() => {
  clearSkeletonTimers();
});

/**
 * 处理 ChatInput 配置变更
 * 与 chatInputConfig 计算属性中的字段一一对应
 */
const handleConfigChange = (config: any) => {
  if (!currentSession.value) return;

  // 处理模型 ID 变更
  if (typeof config.modelId !== 'undefined') {
    currentSession.value.modelId = config.modelId;
    // 异步保存到后端
    if (currentSession.value.id) {
      apiService.updateSession(String(currentSession.value.id), {
        modelId: config.modelId
      }).catch(err => console.error('Failed to save modelId:', err));
    }
  }

  // 处理 Token 上限（会话级别独立配置）
  if (typeof config.maxTokensLimit !== 'undefined') {
    currentSession.value.settings.maxTokensLimit = config.maxTokensLimit;
  }

  // 处理思考强度变更
  if (typeof config.thinkingEffort !== 'undefined') {
    currentSession.value.settings.thinkingEffort = config.thinkingEffort;
  }

  // 处理知识库选择
  if (typeof config.knowledgeBaseIds !== 'undefined') {
    inputMessage.value.knowledgeBaseIds = config.knowledgeBaseIds;
    if (!editMode.value) {
      currentSession.value.settings.referencedKbs = config.knowledgeBaseIds;
    }
  }

  // 处理工作目录路径
  if (typeof config.workspacePath !== 'undefined') {
    currentSession.value.workspacePath = config.workspacePath;
    console.log('保存 workspacePath 到会话:', config.workspacePath);
  }

  // 处理运行模式
  if (typeof config.runMode !== 'undefined') {
    currentSession.value.settings.runMode = config.runMode;
  }

  // 处理附加连接
  if (typeof config.attachments !== 'undefined') {
    currentSession.value.settings.attachments = config.attachments;
  }

  // 处理 MCP 选择（会话级，立即持久化）
  if (typeof config.mcpServerIds !== 'undefined') {
    currentSession.value.mcpServerIds = config.mcpServerIds;
    if (currentSession.value.id) {
      apiService.updateSession(String(currentSession.value.id), {
        mcpServerIds: config.mcpServerIds
      }).catch(err => console.error('Failed to save mcpServerIds:', err));
    }
  }

  debouncedSaveSession();
};

// 防抖函数
const debouncedSaveSession = useDebounceFn(() => {
  emit("save-settings");
}, 100);

// 监听器
watch(() => props.session?.id || props.sessionId, async (newSessionId: string | undefined, oldSessionId: string | undefined) => {
  const newId = newSessionId ?? props.sessionId ?? null;
  const effectiveOldId = oldSessionId ?? null;
  await handleSessionChange(newId, effectiveOldId);
  needScrollToBottom.value = true;
}, { immediate: true });

// 监听流式状态变化，在第一次对话完成后生成标题
watch(() => isStreaming.value, async (newVal, oldVal) => {
  // 当流式状态从 true 变为 false 时（即助手回复完成）
  if (oldVal === true && newVal === false) {
    if (activeMessages.value.length == 2 && !hasGeneratedTitle.value) {
      await generateTitleIfNeeded(currentSessionId.value!, activeMessages.value, currentSession);
    }
    // 自动消费消息队列
    if (currentSessionId.value) {
      const queuedMsg = sessionStore.dequeueMessage(currentSessionId.value);
      if (queuedMsg) {
        console.log('Auto-sending queued message:', queuedMsg);
        await handleSendMessage({
          content: queuedMsg.content,
          files: queuedMsg.files || [],
          knowledgeBaseIds: queuedMsg.knowledgeBaseIds || [],
          skillNames: queuedMsg.skillNames || [],
        });
      }
    }
  }
}, { immediate: true });


/**
  * 加载会话配置和消息（首次加载，只加载最近 N 条）
  */
async function loadSession(sessionId: string) {
  await loadMessages(sessionId, { isInitial: true });
}

/**
 * 加载会话消息
 * @param sessionId - 会话 ID
 * @param options - 加载选项
 *   - isInitial: 是否为首次加载（加载最近 N 条）
 *   - beforeMessageId: 加载此 ID 之前（更早）的消息
 */
async function loadMessages(
  sessionId: string,
  options: { isInitial?: boolean; beforeMessageId?: string } = {},
) {
  const isInitial = options.isInitial ?? true;

  // 初始加载会替换整个消息数组（setMessages），流式输出期间执行会丢失正在输出的消息
  // 加载更多仅 prepend 到头部，与流式的 push/findIndex 互不干扰
  if (isInitial) {
    const sessionState = sessionStore.getSessionState(sessionId);
    if (sessionState.isStreaming) {
      return;
    }
  }

  if (!isInitial) {
    isLoadingMore.value = true;
  }

  try {
    const requestOptions: any = {};
    if (isInitial) {
      // 首次加载：加载最近 INITIAL_PAGE_SIZE 条
      requestOptions.limit = INITIAL_PAGE_SIZE;
    } else if (options.beforeMessageId) {
      // 加载更多：加载指定 ID 之前的更早消息
      requestOptions.limit = MESSAGES_PAGE_SIZE;
      requestOptions.beforeMessageId = options.beforeMessageId;
    }

    const sessionMessages = await apiService.fetchSessionMessages(
      sessionId,
      requestOptions,
    );

    // 处理历史消息的思考时长回填
    sessionMessages.items.forEach(
      (message: { id: string; contents: any[] }) => {
        if (message.contents && Array.isArray(message.contents)) {
          message.contents.forEach((content) => {
            if (content.meta_data?.thinking_duration_ms) {
              content.thinking_duration_ms =
                content.meta_data.thinking_duration_ms;
            }
          });
        }
      },
    );

    if (isInitial) {
      // 首次加载：替换消息列表
      activeMessages.value = sessionMessages.items;
      const pageSize = isInitial ? INITIAL_PAGE_SIZE : MESSAGES_PAGE_SIZE;
      hasMoreMessages.value = sessionMessages.items.length >= pageSize;
    } else {
      // 加载更多：prepend 到列表前部
      if (sessionMessages.items.length > 0) {
        // 记录当前滚动位置（内容高度）
        const scrollElement = scrollContainerRef.value?.getScrollElement?.();
        const oldScrollHeight = scrollElement?.scrollHeight || 0;

        sessionStore.prependMessages(sessionId, sessionMessages.items);

        // 恢复滚动位置，避免跳到顶部
        nextTick(() => {
          const newScrollHeight = scrollElement?.scrollHeight || 0;
          const heightDiff = newScrollHeight - oldScrollHeight;
          if (scrollElement && heightDiff > 0) {
            scrollElement.scrollTop = heightDiff;
          }
        });
      }
      const pageSize = isInitial ? INITIAL_PAGE_SIZE : MESSAGES_PAGE_SIZE;
      hasMoreMessages.value = sessionMessages.items.length >= pageSize;
    }
  } catch (error: any) {
    console.error('加载消息失败:', error);
    notify.error('加载消息失败', error.message);
  } finally {
    isLoadingMore.value = false;
  }
}

/**
 * 加载更多历史消息
 * @param sessionId - 会话 ID
 * @param beforeMessageId - 从此 ID 之前开始加载
 */
async function loadMoreMessages(sessionId: string, beforeMessageId: string) {
  await loadMessages(sessionId, { isInitial: false, beforeMessageId });
}
/**
 * 处理会话切换
 */
/**
 * 清理骨架屏定时器
 */
function clearSkeletonTimers() {
  if (skeletonTimer) {
    clearTimeout(skeletonTimer)
    skeletonTimer = null
  }
  if (skeletonMinDisplayTimer) {
    clearTimeout(skeletonMinDisplayTimer)
    skeletonMinDisplayTimer = null
  }
}

/**
 * 启动骨架屏延迟显示逻辑
 * 200ms 内加载完成则不显示，超过 200ms 则显示且至少保持 500ms
 */
function startSkeletonDelay() {
  clearSkeletonTimers()
  showSkeleton.value = true
  skeletonShowTime = Date.now() // 记录开始显示的时间戳
}

/**
 * 结束骨架屏显示（遵守最少显示时长）
 * 从开始显示时计时，确保至少显示 500ms
 */
function stopSkeletonDisplay() {
  if (skeletonTimer) {
    clearTimeout(skeletonTimer)
    skeletonTimer = null
  }

  if (!showSkeleton.value) {
    // 骨架屏未显示，直接保持隐藏
    return
  }

  const elapsed = Date.now() - skeletonShowTime
  const remaining = Math.max(SKELETON_MIN_DISPLAY - elapsed, 100)
  console.log('Skeleton remaining time:', remaining, 'ms')
  // 还未满 500ms，延迟剩余时间后再隐藏
  skeletonMinDisplayTimer = setTimeout(() => {
    showSkeleton.value = false
    skeletonMinDisplayTimer = null
  }, remaining)

}

async function handleSessionChange(newSessionId: string | null, oldSessionId: string | null) {
  if (newSessionId === oldSessionId) return;

  resetTitleFlag();
  if (newSessionId === null) {
    currentSessionId.value = null;
    return;
  }
  const token = ++sessionChangeToken;
  isLoading.value = true;
  startSkeletonDelay();
  try {
    lastScrollTop = 0;
    currentSessionId.value = newSessionId;
    await loadSession(newSessionId);
    if (token !== sessionChangeToken) return;
    // 页面加载时一次性检查活跃流（用于刷新后的初始状态同步）
    await checkActiveStreamOnLoad(newSessionId);
    if (token !== sessionChangeToken) return;

    nextTick(() => {
      if (token !== sessionChangeToken) return;
      if (!currentSession.value)
        return;
      if (inputMessage.value?.isWaiting) {
        currentSession.value.settings.referencedKbs = inputMessage.value.knowledgeBaseIds;
        handleSendMessage(inputMessage.value);
      }
    });
  } catch (error) {
    if (token !== sessionChangeToken) return;
    console.error('加载会话失败:', error);
    notify.error('加载会话失败', error.message);
  } finally {
    if (token !== sessionChangeToken) return;
    isLoading.value = false;
    stopSkeletonDisplay();
  }
}

/**
 * 页面加载时一次性检查活跃流
 * 用于刷新后的初始状态同步，后续通过 SSE 事件驱动
 */
async function checkActiveStreamOnLoad(sessionId: string) {
  try {
    const status = await apiService.getStreamStatus(sessionId);
    if (status.isRunning) {
      await subscribeToActiveStream();
    }
  } catch (error) {
    console.error('初始流状态检查失败:', error);
  }
}

// 流式响应处理（委托给 composable 处理，用于 regenerate / continue）
async function handleStreamResponse(
  streamingSessionId: string,
  regenerationMode: any = null,
  assistantMessageId: string | null = null,
  userMessageId?: string | null,
  model?: string | null,
) {
  try {
    const handler = useStreamResponse(sessionStore, apiService)
    await handler.processStream(
      streamingSessionId,
      regenerationMode,
      assistantMessageId,
      userMessageId,
      undefined,
      // 重新回答/继续：必须带上会话模型。不传时后端解析不到模型会回落默认值，
      // 而默认模型无真实凭据时会退化为 MemoryChatClient（“内存模式”模拟回答）。
      model ?? currentModelId.value ?? undefined,
    )
  } catch (error) {
    // 错误已在 composable 中处理，这里只负责显示通知
    if ((error as Error).message.includes('SessionBusyError')) {
      notify.warning(t('chat.panel.sessionBusy'), t('chat.panel.sessionBusyDesc'))
      return
    }
    if (error.name !== 'AbortError') {
      notify.error(t('common.error.unknown'), error.message)
      console.error("请求错误:", error)
    }
  }
}

/**
 * 合并消息创建和流式响应处理
 * 后端会在启动流时自动创建消息
 */
async function handleStreamResponseWithCreate(
  streamingSessionId: string,
  content: string,
  fileIds: string[],
  replaceMessageId: string | null = null,
  knowledgeBaseIds?: string[],
  think?: boolean,
  search?: boolean,
  /** 当前模型 ID；未选中模型时为 null（与 currentModelId 的取值一致） */
  model?: string | null,
  skillNames?: string[],
  characterId?: string | null,
  mcpServerIds?: string,
  mode?: string | null,
) {
  try {
    const handler = useStreamResponse(sessionStore, apiService)
    await handler.processStreamWithCreate(
      streamingSessionId,
      content,
      fileIds,
      replaceMessageId,
      knowledgeBaseIds,
      think,
      search,
      model,
      skillNames,
      characterId,
      mcpServerIds,
      mode,
    )
  } catch (error) {
    if ((error as Error).message.includes('SessionBusyError')) {
      notify.warning(t('chat.panel.sessionBusy'), t('chat.panel.sessionBusyDesc'))
      return
    }
    if (error.name !== 'AbortError') {
      notify.error(t('common.error.unknown'), error.message)
    }
  }
}

// 消息操作方法
function abortResponse() {
  if (currentSessionId.value) {
    apiService.cancelResponse(currentSessionId.value);
  }
}

async function deleteMessage(message: any) {
  try {
    if (
      await confirm(
        t('chat.panel.deleteMessageTitle'),
        message.role === "user"
          ? t('chat.panel.deleteUserMessageDesc')
          : t('chat.panel.deleteAssistantMessageDesc')
      )
    ) {
      // 流式刚产出的消息 id 是前端 UUID（尚未落库、无数据库主键），
      // 后端 DELETE 只接受数字主键（Long.parseLong）：此时跳过后端调用、仅删本地，
      // 否则每次删刚生成的消息都会 500/400 导致界面「删不掉」。
      if (/^\d+$/.test(String(message.id))) {
        await apiService.deleteMessage(message.id);
      }
      if (message.role === "user") {
        const assistantMessage = activeMessages.value.find((msg) => msg.parentId === message.id);
        if (assistantMessage && currentSessionId.value) {
          sessionStore.deleteMessage(currentSessionId.value, assistantMessage.id);
        }
      }
      if (currentSessionId.value) {
        sessionStore.deleteMessage(currentSessionId.value, message.id);
      }
      toast.success(t('common.deleteSuccess'));
    }
  } catch (error) {
    toast.error(t('common.error.deleteFailed'));
    console.error("删除消息失败:", error);
  }
}

function editMessage(message: any) {
  enterEditMode(message)
}

/**
 * 判定错误是否为「后端没有提供该端点」—— 404（未映射路径）或 405（路径存在但不支持该方法）。
 *
 * <p>回退动作据此决定是否降级为逐条删除。**必须同时认 405**：批量回退端点是
 * {@code DELETE /sessions/{id}/messages}，而后端已存在 {@code GET /sessions/{id}/messages}
 * 的映射，Spring 对这种情况返回的是 **405**（"不支持DELETE请求，请使用GET方法"）而不是 404；
 * 只认 404 会让降级分支永远不触发，界面只剩「回退失败」。</p>
 *
 * <p>ApiError 的状态字段在不同版本里出现过 status / statusCode 两种，这里都取一遍。</p>
 *
 * @param error 捕获到的错误
 * @returns 端点缺失（404/405）时为 true
 */
function isEndpointMissing(error: any): boolean {
  const status = error?.statusCode ?? error?.status ?? error?.response?.status
  if (status === 404 || status === 405) {
    return true
  }
  return /404|405|not found|资源不存在|不支持\s*DELETE/i.test(String(error?.message ?? ''))
}

/**
 * 收集「从第 turnIndex 轮起、直到会话末尾」的全部消息 id，按对话顺序。
 *
 * 与确认框的措辞一致（「本轮及之后的全部消息」）：锚点是助手消息时，
 * 该轮的**用户消息也要一起删**，否则会留下没有回复的孤儿提问。
 *
 * 刻意按**轮序号**取，而不是按消息 id 取：实时流式产出的那一轮，前端持有的是本地
 * 消息 id（UUID），而后端删除接口要的是数据库数字主键 —— 按轮序号可以在刷新出
 * 数字主键之后再取，避免拿 UUID 去删（会 404，表现为「点了回退却什么都没删」）。
 *
 * @param turnIndex 起点轮序号（0 起）
 * @returns 需要删除的消息 id 列表；轮序号越界时返回空数组
 */
function collectMessageIdsFromTurn(turnIndex: number): string[] {
  const ids: string[] = []
  const turns = visibleTurns.value as any[]
  if (turnIndex < 0 || turnIndex >= turns.length) {
    return ids
  }
  for (let i = turnIndex; i < turns.length; i++) {
    const user = turns[i]?.user
    if (user?.id && !ids.includes(user.id)) {
      ids.push(user.id)
    }
    for (const assistant of turns[i]?.assistants || []) {
      if (assistant?.id && !ids.includes(assistant.id)) {
        ids.push(assistant.id)
      }
    }
  }
  return ids
}

/**
 * 从此处回退：删除本轮及之后的全部消息。
 *
 * 破坏性操作，故先弹确认框说清影响范围。回退只动对话，
 * 工作目录里已被工具写入的文件不会回滚 —— 这点在确认文案里明确告知，
 * 否则用户会误以为代码也一并还原了。
 *
 * 优先走后端的批量回退端点；后端尚未提供（404）时降级为逐条删除，
 * 见下方 catch 分支的说明。
 */
async function rewindFromHere(message: any) {
  const sessionId = currentSessionId.value
  if (!sessionId || !message?.id) return

  // 预估影响范围：当前轮 + 之后所有轮
  const turnIndex = visibleTurns.value.findIndex((turn: any) =>
    turn.assistants?.some((a: any) => a.id === message.id)
    || turn.user?.id === message.id
  )
  const totalTurns = visibleTurns.value.length
  const affectedTurns = turnIndex >= 0 ? totalTurns - turnIndex : 1

  const confirmed = await confirm(
    t('chat.rewindDialog.title'),
    `${t('chat.rewindDialog.message', { turns: affectedTurns, messages: affectedTurns * 2 })}` +
      `<div style="margin-top:8px;font-size:12px;opacity:.75">${t('chat.rewindDialog.workspaceWarning')}</div>`,
    { type: 'error', confirmText: t('chat.rewindDialog.confirm'), cancelText: t('chat.rewindDialog.cancel') }
  )
  if (!confirmed) return

  try {
    let removedMessages = 0
    try {
      const result = await apiService.rewindSession(sessionId, message.id)
      removedMessages = result?.removedMessages ?? 0
    } catch (error) {
      // 后端尚未提供「按 fromMessageId 批量回退」端点时降级为逐条删除。
      // DELETE /v2/sessions/messages/{id} 是既有可用端点，两者都只动对话、不动工作区，
      // 语义一致；等后端补上批量端点后，这里会自动改走上面那条分支。
      if (!isEndpointMissing(error)) {
        throw error
      }
      // 先刷新一次：实时流式产出的那一轮在前端是本地 id（UUID），删除接口要的是数据库
      // 数字主键；刷新后 visibleTurns 里就是数字主键，按轮序号取才不会打空。
      await loadMessages(sessionId, { isInitial: true })
      const targets = collectMessageIdsFromTurn(turnIndex)
      for (const id of targets) {
        try {
          await apiService.deleteMessage(id)
          removedMessages += 1
        } catch (innerError) {
          // 删用户消息时后端可能已级联删掉对应助手消息，再删会 404 —— 这不算失败
          if (!isEndpointMissing(innerError)) {
            throw innerError
          }
        }
      }
    }
    await loadMessages(sessionId, { isInitial: true })
    toast.success(
      affectedTurns <= 1
        ? t('chat.rewindDialog.successLastTurn')
        : t('chat.rewindDialog.success', { messages: removedMessages })
    )
  } catch (error) {
    console.error('回退失败:', error)
    toast.error(t('chat.rewindDialog.failed'))
  }
}

/**
 * 从此处分叉：把截至这条消息的上下文复制成新会话，原会话保持不变。
 *
 * 分叉点挂在**用户消息**上（见 MessageActions），所以这里的 message 一定是用户轮次：
 *   1. 后端按 messageId 截断复制（parseLongOrNull 只认数字主键，用户消息来自库、
 *      id 必定是主键；助手消息是流式产出的前端 UUID，会直接被判成「缺少分叉点」）。
 *   2. 切到新会话后，把这条消息的正文/附件**填进输入框** —— 上下文已经复制过去了，
 *      这一条就是「接下来要问的那句」，用户可以直接改完再发。
 *
 * 写入输入框必须等会话真正切过去：useMessageOperations 在 currentSessionId 变化时会把
 * inputMessage 重置为空，先写后切会被无声冲掉。
 */
async function forkFromHere(message: any) {
  const sessionId = currentSessionId.value
  if (!sessionId || !message?.id) return

  // 分叉点必须是数字主键。历史数据里可能混进前端 UUID，这时直接给出可读提示，
  // 不要再让后端回一句语焉不详的「缺少分叉点消息 id」。
  if (!/^\d+$/.test(String(message.id))) {
    toast.error(t('chat.forkFailed'))
    return
  }

  // 先把要带到新会话输入框的内容取出来：切会话会清空 inputMessage。
  const anchorContent = message.contents?.[0]?.content ?? ''
  const anchorFiles = Array.isArray(message.contents?.[0]?.files) ? [...message.contents[0].files] : []

  try {
    const result = await apiService.forkSession(sessionId, message.id)
    toast.success(t('chat.forkSuccess', { title: result?.title || '' }))
    // 跳转由 ChatPage 负责（它持有路由与侧边栏刷新），
    // ChatPanel 只负责把新会话 id 抛上去。
    if (!result?.sessionId) return
    emit('open-session', result.sessionId)

    // 等会话切换落地（最多 ~2s），再回填输入框。
    for (let i = 0; i < 40 && currentSessionId.value === sessionId; i++) {
      await new Promise((r) => setTimeout(r, 50))
    }
    if (currentSessionId.value === sessionId) return

    inputMessage.value = {
      content: anchorContent,
      files: anchorFiles,
      knowledgeBaseIds: undefined,
      isWaiting: false,
    }
  } catch (error) {
    console.error('分叉失败:', error)
    toast.error(t('chat.forkFailed'))
  }
}

/**
 * 复制消息内容到剪贴板。
 *
 * 优先用异步剪贴板 API；它在「文档未聚焦 / 非安全上下文 / 无用户手势」时会抛
 * NotAllowedError（实测：用自动化工具打开的标签页不在前台时就是这样）。
 * 此时回落到 textarea + document.execCommand('copy')，让复制在受限环境下也能成功，
 * 而不是直接甩给用户一个「复制失败」。
 *
 * @param message 被点击的消息
 */
async function copyMessage(message: any) {
  try {
    const turns = getCurrentTurns(message)
    const currentContent = turns[turns.length - 1]

    if (!currentContent.content) {
      return
    }
    const text = currentContent.content
    try {
      await navigator.clipboard.writeText(text);
    } catch (clipboardError) {
      // 回落：临时 textarea + execCommand
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (!copied) {
        throw clipboardError
      }
    }
    toast.success(t('common.copySuccess'));
  } catch (error) {
    console.error("复制消息失败:", error);
    toast.error(t('common.copyFailed'));
  }
}

/**
 * 处理发送消息
 * 合并消息创建和流式启动为一个原子操作
 */
async function handleSendMessage(payload?: InputMessageState) {
  const data = payload;
  if (!data || (!data.content?.trim() && !data.files.length)) return;

  try {
    const { content, files, knowledgeBaseIds, think, search, skillNames } = data;

    // 流式进行中：消息入队，等 stream_finished 后自动消费
    if (currentSessionId.value && isStreaming.value) {
      const sid = currentSessionId.value;
      const prepared = await prepareNewMessage(content, files, null, knowledgeBaseIds);
      sessionStore.enqueueMessage(sid, {
        content: prepared.content,
        files: prepared.updatedFiles.filter((f: any) => f.id),
        knowledgeBaseIds: prepared.knowledgeBaseIds,
        skillNames: Array.isArray(skillNames) ? skillNames : [],
      });
      return;
    }

    // 准备消息数据（上传文件等）
    const prepared = await prepareNewMessage(content, files, null, knowledgeBaseIds);

    // 如果是编辑模式，需要处理替换逻辑
    let replaceMessageId: string | undefined = undefined;
    if (editMode.value && editMode.value.message && currentSessionId.value) {
      const rid = editMode.value.message.id;
      replaceMessageId = rid;
      const sid = currentSessionId.value;
      // 删除旧消息及其回答
      sessionStore.deleteMessage(sid, rid);
      const assistantMessage = sessionStore
        .getMessages(sid)
        .find((msg: any) => msg.parentId === rid);
      if (assistantMessage) {
        sessionStore.deleteMessage(sid, assistantMessage.id);
      }
      exitEditMode();
    }

    // 发起流式请求（后端会自动创建消息并启动流）
    if (currentSessionId.value) {
      expectingNewMessage = true;
      handleStreamResponseWithCreate(
        currentSessionId.value,
        prepared.content,
        prepared.fileIds,
        replaceMessageId,
        prepared.knowledgeBaseIds,
        think,
        search,
        currentModelId.value ?? undefined,
        skillNames,
        props.session?.characterId || null,
        currentSession.value?.mcpServerIds || '',
        currentRunMode.value,
      );
    }
  } catch (error: any) {
    notify.error(t('chat.panel.sendMessageFailed'), error.message);
    // 发送失败时由 SSE 事件驱动恢复检测
  }
}

/**
 * 处理队列消息撤回
 */
function handleReorderQueue(fromId: string, toId: string) {
  if (currentSessionId.value) {
    sessionStore.reorderQueue(currentSessionId.value, fromId, toId)
  }
}

function handleSendNow(item: QueuedMessage) {
  if (!currentSessionId.value) return
  // 从队列中移除该消息
  const msg = sessionStore.removeFromQueue(currentSessionId.value, item.id)
  if (msg) {
    // 立即发送
    handleSendMessage({
      content: msg.content,
      files: msg.files || [],
      knowledgeBaseIds: msg.knowledgeBaseIds || [],
      skillNames: msg.skillNames || [],
    })
  }
}

function handleMoveToFront(msgId: string) {
  if (currentSessionId.value) {
    sessionStore.moveToFront(currentSessionId.value, msgId)
  }
}

function handleRemoveQueued(id: string) {
  if (currentSessionId.value) {
    sessionStore.removeQueuedMessage(currentSessionId.value, id);
  }
}

/**
 * 处理队列消息编辑
 */
function handleEditQueued(item: QueuedMessage) {
  if (!currentSessionId.value) return;
  inputMessage.value = {
    content: item.content,
    files: item.files,
    knowledgeBaseIds: item.knowledgeBaseIds,
    isWaiting: false,
  };
  sessionStore.removeQueuedMessage(currentSessionId.value, item.id);
}

/**
 * 进入编辑模式以重新生成消息
 */
function generateResponse(message: any) {
  enterEditMode(message)
}

/**
 * 重新生成响应：**覆盖**而不是追加一版。
 *
 * 原实现走 multi_version，后端会**新建**一条 assistant 消息挂到同一个 parentId 下，
 * 于是同轮出现两条回答，再配一套「上一版/下一版 1/2」箭头来回切。用户要的是
 * 「直接只显示一套」，所以这里先把该轮已有的 assistant 全部删干净（本地 + 服务端），
 * 再让流重新生成一条 —— 无论重生成多少次，库里和界面上都只留一条。
 */
async function regenerateResponse(message: any) {
  const parentId = message.parentId;
  const existingVersions = activeMessages.value.filter(
    (m) => m.parentId === parentId && m.role === "assistant"
  );

  // 先删旧的：流式启动前清场，避免新旧两条同时在场导致重复渲染。
  for (const old of existingVersions) {
    // 流式刚产出的 id 是前端 UUID（未落库），后端 DELETE 只接受数字主键。
    if (/^\d+$/.test(String(old.id))) {
      try {
        await apiService.deleteMessage(old.id);
      } catch {
        // 删不掉不能阻断重新生成：本地已移除，界面上仍只会有一条。
      }
    }
    if (currentSessionId.value) {
      sessionStore.deleteMessage(currentSessionId.value, old.id);
    }
  }
  activeMessages.value = activeMessages.value.filter(
    (m) => !(m.parentId === parentId && m.role === "assistant")
  );

  const userMessage = activeMessages.value.find((m) => m.role === "user" && m.id === parentId);
  if (userMessage) {
    userMessage.currentVersionId = undefined;
  }

  nextTick(() => {
    immediateScrollToBottom();
    if (message.sessionId) {
      handleStreamResponse(message.sessionId, "regenerate", null, parentId || null);
    }
  });
}

/**
 * 计划批准/拒绝（plan_exit 人工确认）：决策回传恢复 Agent
 */
async function resumeConfirmation(payload: { replyId: string; confirmed: boolean; items: any[]; feedback?: string }) {
  const sid = currentSessionId.value;
  if (!sid) return;
  const decisions = (payload.items || []).map((it: any) => ({
    toolCallId: it.toolCallId,
    confirmed: payload.confirmed,
  }));
  try {
    const handler = useStreamResponse(sessionStore, apiService);
    await handler.processResume(sid, {
      replyId: payload.replyId,
      decisions,
      model: currentModelId.value || undefined,
      characterId: props.session?.characterId || null,
      feedback: payload.feedback,
    });
  } catch (error: any) {
    if ((error as Error).message?.includes('SessionBusyError')) {
      notify.warning(t('chat.panel.sessionBusy'), t('chat.panel.sessionBusyDesc'));
      return;
    }
    if ((error as Error).name !== 'AbortError') {
      notify.error(t('common.error.unknown'), error.message);
    }
  }
}

/**
 * 从断点继续执行（恢复工具调用）
 */
function continueResponse(message: any) {
  const assistantMessage = activeMessages.value.find(m => m.id === message.id);
  if (assistantMessage) {
    assistantMessage.state = { isStreaming: true };
  }

  nextTick(() => {
    immediateScrollToBottom();
    if (message.sessionId) {
      // resume 模式需要传递 userMessageId（通过 parentId 获取）
      const userMessageId = message.parentId || null;
      handleStreamResponse(message.sessionId, "resume", message.id, userMessageId);
    }
  });
}





/**
 * 订阅活跃流
 * 当检测到会话有正在进行的流式输出时调用（如刷新页面后重连或多窗口打开）
 */
async function subscribeToActiveStream() {
  if (!currentSessionId.value || isStreaming.value) return;

  // 设置流式状态
  sessionStore.setSessionIsStreaming(currentSessionId.value, true);

  // 以订阅模式启动流式响应（用于刷新重连/多窗口观察）
  // 不能 await：该 Promise 会持续到整个 SSE 流结束，否则页面加载态无法结束。
  void handleStreamResponseAsSubscriber(currentSessionId.value);
}

/**
 * 以订阅者身份处理流式响应（不发起新聊天，只观察已有流）
 */
async function handleStreamResponseAsSubscriber(
  streamingSessionId: string,
) {
  try {
    // 从后往前查找最后一个有 contents 的消息，用于后端过滤已完成的 content
    // 注意：最后一条消息可能是刚创建的空助手消息（contents 为空），
    // 此时需要向前回溯，否则 lastContentId 为 null 会导致整个 eventBuffer 被重放，
    // 包括 user_message 事件，从而造成用户消息重复。
    const messages = sessionStore.getMessages(streamingSessionId);
    let lastContentId: string | null = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].contents?.length > 0) {
        lastContentId = messages[i].contents[messages[i].contents.length - 1].id;
        break;
      }
    }

    const handler = useStreamResponse(sessionStore, apiService)
    await handler.processStream(
      streamingSessionId,
      'subscribe',
      null,
      null,
      lastContentId,
    );
  } catch (error) {
    // 订阅模式下无活跃流的错误可以静默忽略
    if ((error as Error).message?.includes("NO_ACTIVE_STREAM")) {
      sessionStore.setSessionIsStreaming(streamingSessionId, false);
      return;
    }
    if ((error as Error).name !== "AbortError") {
      console.error("订阅流失败:", error);
    }
  }
}

// 将方法暴露给父组件
defineExpose({
  sendMessage: handleSendMessage,
  loadMessages,
  activeMessages,
  scrollToMessage,
  subscribeToActiveStream,
  getScrollElement: () => scrollContainerRef.value?.getScrollElement?.() || null, // 提供获取滚动元素的方法
  insertText: (text: string) => chatInputRef.value?.insertText(text),
  insertBadge: (data: any) => chatInputRef.value?.insertBadge(data),
});

/**
 * 滚动到指定消息
 */
function scrollToMessage(messageId: string) {
  // 使用外层容器作为滚动上下文
  const container = scrollContainerRef.value?.getScrollElement?.() || null;

  if (!container) {
    console.warn('[ChatPanel] 未找到滚动容器')
    return
  }

  // 在容器中查找目标消息元素
  const targetElement = container.querySelector(`[data-message-id="${messageId}"]`)
  if (targetElement) {
    // 使用容器级滚动，避免 scrollIntoView 导致整个页面位移
    const targetTop = targetElement.offsetTop
    container.scrollTo({
      top: targetTop,
      behavior: 'smooth'
    })
  } else {
    console.warn(`[ChatPanel] 未找到消息元素: ${messageId}`)
  }
}

</script>

<style scoped>
.chat-scroll-container {
  will-change: transform;
  transform: translateZ(0);
  contain: layout style paint;
}

.queue-drawer {
  border: 1px solid var(--color-surface-border);
}

/* ===== 编辑模式提示条 =====
   设计目标：提示条与下方输入框是**同一张卡**的头部，而不是浮在输入框上方的独立条。
   做法 —— 与 .input-area 共享宽度、边框、圆角与底色，只保留顶部圆角；
        收起自身下边框，让两段的边框在交界处连成一条线。
   改动前：外层 px-4 让它比输入框窄 16px，且中间的「添加目标」把卡片切成三段。 */
.edit-banner {
  /* 顶部圆角与输入框一致（--size-rounded-radius 由主题统一给值） */
  border-radius: var(--size-rounded-radius, 16px) var(--size-rounded-radius, 16px) 0 0;
  border: 1px solid var(--color-input-border, var(--el-border-color));
  /* 只保留三边：下边框交给输入框，避免交界处出现双线 */
  border-bottom: none;
  background: var(--color-input-bg);
  /* 与输入卡之间不留缝 */
  margin-bottom: -1px;
  overflow: hidden;
}

.edit-banner__inner {
  /* 高度与输入框内首行工具条接近，视觉重量不喧宾夺主 */
  min-height: 40px;
}

.edit-banner__icon {
  color: var(--el-color-warning, #e6a23c);
}

.cancel-edit-btn {
  /* 取消是高频操作，但不应比主操作更醒目 */
  --el-button-text-color: var(--color-text-gray);
}

.cancel-edit-btn:hover {
  --el-button-hover-text-color: var(--el-color-primary);
}

/* 抽屉过渡动画 */
.queue-drawer-enter-active,
.queue-drawer-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.queue-drawer-enter-from,
.queue-drawer-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.queue-drawer-enter-to,
.queue-drawer-leave-from {
  opacity: 1;
  max-height: 400px;
}

/* 底部渐变遮罩：底部25px完全隐藏，上方渐变过渡 */
.chat-bottom-fade {
  position: absolute;
  height: 48px;
  pointer-events: none;
  background: linear-gradient(to top, var(--color-bg) 25px, transparent 48px);
}

/* 加载指示器淡入淡出 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}


/* 为消息列表容器添加更强的隔离 */
:deep(.scroll-container > div) {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* 确保消息项也使用隔离 */
:deep(.message-item) {
  contain: layout style;
}

/* 编辑模式提示条样式 */
.edit-mode-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  /* 提示条是行而非卡片，去掉原 0 2px 8px rgba(230,162,60,.1) 装饰投影 */
  transition: all 0.3s ease;
}

/* 悬浮浮起反馈，是本段唯一保留的投影，收敛为单层令牌 */
.edit-mode-banner:hover {
  box-shadow: var(--el-box-shadow-light);
}

/* 工具栏按钮：与 ChatInputToolbar 保持样式一致 */
.workspace-btn {
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 14px;
  height: 22px;
  padding: 0 3px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

/* 动效降级：系统开启「减少动态效果」时，抽屉展开、提示条淡入、工具栏按钮
   全部改为瞬间切换。逐个列出，不写 `*` / `.chat-panel *` 通配，
   避免把 ScrollContainer / MessageItem 内部 Element Plus 组件的合法过渡一起掐掉。
   抽屉的展开终态（max-height: 400px / opacity: 1）与提示条的 hover 投影
   都是静态声明，停掉过渡后照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .queue-drawer-enter-active,
  .queue-drawer-leave-active,
  .fade-slide-enter-active,
  .fade-slide-leave-active,
  .edit-mode-banner,
  .workspace-btn {
    transition: none;
  }
}
</style>
