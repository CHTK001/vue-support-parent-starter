<template>
  <!-- 消息+输入 区域容器：纵向排布「滚动区 + 底部统计条」，统计条常驻不参与滚动 -->
  <div class="flex-1 overflow-hidden w-full relative flex flex-col">
    <!-- 滚动区：父容器改为 flex-col 后，这里必须 flex-1 + min-h-0 才会正确收缩，
         否则内容会把底部统计条顶出可视区（min-h-0 是 flex 子项允许收缩的前提）。 -->
    <ScrollContainer ref="scrollContainerRef" class="flex-1 min-h-0 chat-scroll-container transition-opacity duration-300 px-5"
      :auto-scroll="needScrollToBottom" :aria-label="t('chat.messages')" @scroll="handleScroll">
      <!-- 顶部不再显示「上下文占用」统计条（需求 2026-11-11）。
          这条曾把 token 用量铺在消息列最上方，与底部状态条右侧的上下文入口重复；
          删除后上下文总量的唯一入口是底部状态条，tokenStats 仍透传给统计条与目标计数器。 -->
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
            <WelcomeScreen :session="currentSession" class="flex-1" />
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
              :animate-in="animateIds.includes(turn.user.id)" @delete="deleteMessage" @edit="editMessage"
              @copy="copyMessage" @generate="generateResponse" @regenerate="regenerateResponse"
              @continue="continueResponse"
              @rewind="rewindFromHere" @fork="forkFromHere"
              @resume-confirmation="resumeConfirmation"
              @abort="abortResponse" />
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

          <!-- 上一轮未完成的确认条（2026-11-12）：
               刷新/重启后如果最后一轮只有提问没有回答，说明后端那轮被打断了。
               这时刻意不自动发「继续」，也不自动放队列——同一条命令被重跑一次
               可能是破坏性的（删除、推送、提交）。由用户明确点「继续」才发。 -->
          <Transition name="queue-drawer">
            <div v-if="resumeInterrupted && !editMode"
              class="resume-banner w-[calc(100%-48px)] mx-auto mb-2 px-3 py-2 flex items-center gap-2 rounded-(--size-dialog-rounded-radius) bg-(--el-color-warning-light-9)">
              <svg class="resume-banner__icon shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1.4" />
                <path d="M8 4.8v4.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="8" cy="11.1" r="0.85" fill="currentColor" />
              </svg>
              <span class="resume-banner__text flex-1 min-w-0">{{ t('chat.panel.resumeInterrupted') }}</span>
              <el-button size="small" text @click="handleResumeDismiss">{{ t('chat.panel.resumeDismiss') }}</el-button>
              <el-button size="small" type="primary" plain @click="handleResumeContinue">{{ t('chat.panel.resumeContinue') }}</el-button>
            </div>
          </Transition>

          <!-- 编辑模式提示条：与下方输入框拼成**同一张卡**（同一宽度、只圆上两角、共享底色），
               中间不再插入任何独立块。
               底色不在这里另写一份，而是复用与输入卡完全相同的两组工具类：
               壁纸/毛玻璃场景下输入卡是半透明+背景模糊，提示条若写死实心底色，
               两段就会一段实一段透，比圆角不齐更明显。 -->
          <div v-if="editMode" class="edit-banner w-full flex"
            :class="[{ 'bg-(--color-input-bg)': !hasWallpaper }, { 'bg-(--color-input-bg)/60 backdrop-blur-xl': hasWallpaper }]">
            <!-- px-2 与输入卡 p-[12px_8px_10px_8px] 的左右内边距取齐：
                 提示条文字/取消按钮与下方编辑器首行、+ 按钮落在同一条左右基准线上 -->
            <div class="edit-banner__inner w-full flex items-center px-2 py-2">
              <el-icon size="14" class="edit-banner__icon mr-2 shrink-0">
                <Edit20Regular />
              </el-icon>
              <span class="flex-1 text-sm text-gray-600 dark:text-gray-200">{{ t('chat.panel.editingMessage')
                }}</span>
              <!-- 只留图标：文字去掉后语义只能靠可访问名承担，否则读屏用户听到的是一个无名按钮 -->
              <el-button @click="exitEditMode" class="cancel-edit-btn" plain size="small" :icon="Close"
                :aria-label="t('common.cancel')" :title="t('common.cancel')" />
            </div>
          </div>

          <!-- 子代理面板（编辑模式时隐藏） -->
          <AgentPanel v-if="!editMode" :agent-tabs="props.agentTabs" :active-tab-id="props.activeTabId"
            @switch="emit('switch-agent', $event)" />

          <!-- 模型动作条：输入框上方的「模型此刻在干什么」
               （执行中命令卡可展开；等待用户/思考/生成三种轻量态）。
               答完即整条消失，没有空闲态。
               编辑消息时隐藏，避免与编辑条叠在一起（与 AiNextTaskPanel 同口径）。
               「回到底部」箭头放进动作条内左侧（2026-11-13 用户口径：不再挂在动作条外面）。 -->
          <ModelActionBar v-if="!editMode" :kind="actionBarKind"
            :model-name="actionBarModelName" :card="actionBarCard" :progress="actionBarProgressText"
            :pending="actionBarPending" :retry="actionBarRetry"
            @locate="handleActionBarLocate"
            @approve="handleActionBarApproveAll">
            <template #leading>
              <ScrollToBottomButton inline :show="showScrollToBottomBtn" :is-streaming="shouldButtonBreathe"
                :status="processingStatus" @click="handleScrollToBottomClick" />
            </template>
          </ModelActionBar>

          <div class="w-full flex items-center relative">

            <ChatInput ref="chatInputRef" v-model:value="inputMessage.content" v-model:files="inputMessage.files"
              :session-id="effectiveSessionId" :editing="!!editMode" :character-id="props.session?.characterId != null ? String(props.session.characterId) : ''"
              :config="chatInputConfig" :streaming="isStreaming" :readonly="readonly" mode="chat"
              :backdrop="hasWallpaper" :history="promptHistory" :history-has-more="hasMoreMessages && !!currentSessionId"
              :history-loading-more="isLoadingMore"
              @config-change="handleConfigChange" @send="handleSendMessage" @abort="abortResponse"
              @history-load-more="handleHistoryLoadMore" @toggle-width="handleToggleContentWidth">
              <!-- 会话页的工作目录（2026-11-12 口径修正）：放进输入卡底栏那一行，
                    与 + / 检索 / 优化同排，只显示目录名与「本地 / 远端」，不显示真实路径。
                    弹层复用 WorkspaceSelectorPopover（含「添加项目」与 GitHub 克隆）。 -->
              <template #workspace>
                <SessionWorkspaceButton variant="bar" :workspace-path="currentSession?.workspacePath || null"
                  @change="handleWorkspaceChange" />
              </template>
              <!-- 回到底部箭头已挪到模型动作条行左侧（2026-11-13），本 slot 不再使用 -->
            </ChatInput>
          </div>
        </div>
      </div>
    </ScrollContainer>

    <!-- 会话底部统计条：轮数 / 步数 / 速度 + Token / 缓存命中 + 上下文占用。
         放在滚动区之外（ScrollContainer 之后），保证它常驻不随消息滚动。
         上下文数据从本组件已有的 tokenStats 透传，避免子组件再拉一次 /token-stats。
         宽度必须与消息列、输入区共用 contentMaxWidthStyle：输入区是限宽的，
         统计条若通栏就与它对不齐（用户反馈的割裂感即由此而来）；
         共用之后窄屏与满屏（该样式会在满屏时撤掉限宽）也自动跟着走，无需另写媒体查询。 -->
    <div class="w-full mx-auto" :style="contentMaxWidthStyle">
      <SessionStatsBar :messages="activeMessages" :session-id="effectiveSessionId"
        :context-used="tokenStats?.usedTokens || 0"
        :context-total="tokenStats?.totalTokens || 0" :context-percent="tokenStats?.percentage || 0"
        :context-breakdown="tokenStats?.breakdown || null"
        @open-context="emit('open-context')" />
    </div>

  </div>
  <!-- 记忆管理弹窗 -->
  <ReDialog v-model="memoPanelVisible" :title="t('chat.panel.memoryManagement')" width="560px"
    :close-on-click-modal="false" destroy-on-close class="memo-panel-dialog" append-to-body>
    <MemoPanel v-if="currentSessionId" :session-id="currentSessionId" />
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, defineAsyncComponent, provide } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n()
import { apiService } from "../../services/ApiService";
import { usePopup } from "@/composables/usePopup";
import { useDebounceFn } from "@vueuse/core";
import { useSessionStore } from "../../stores/session";
import { useGoalStore } from "../../stores/goal";
import { useAuthStore } from "../../stores/auth"
import { useLayoutStore } from "@/stores/layout"
import { useWorkspaceStore } from "@/stores/workspace"
import { getCurrentTurns, flattenContentsForTimeline } from "@/utils/messageUtils"
import { getToolActionLabel, getToolIcon, getArgsText } from "@/utils/toolDisplay"
import { loadInputHistory, rememberInput } from "@/utils/inputHistory"
import { useStreamResponse } from "@/composables/useStreamResponse"
import type { InputMessageState, Session, QueuedMessage } from '@/types/session';
import type { Character } from '@/types/character';

// 导入新创建的 composables
import { useSessionChat } from '@/composables/useSessionChat'
import { useMessageOperations } from '@/composables/useMessageOperations'
import { useSessionTokenStats } from '@/composables/useSessionTokenStats'
import { useKbDisplay } from '@/composables/useKbDisplay'

// 组件导入
import TurnItem from "./TurnItem.vue";
import MessageSkeleton from "./MessageSkeleton.vue";
import SessionStatsBar from "./SessionStatsBar.vue";
import { ChatInput, ScrollContainer, ScrollToBottomButton } from "../ui";
import WelcomeScreen from './WelcomeScreen.vue';
import QueuedMessages from './QueuedMessages.vue';
const MemoPanel = defineAsyncComponent(() => import("./MemoPanel.vue"));
import { LoadingOutlined } from '@vicons/antd'
import { Edit20Regular } from '@vicons/fluent'
// 取消编辑是纯图标按钮，用 Element Plus 的 Close 保持与其它 el-button 图标同源
import { Close } from '@element-plus/icons-vue'
import AgentPanel from './AgentPanel.vue';
import LTooltip from '../ui/LTooltip.vue';
import ModelActionBar, { type ModelActionCard, type ModelActionPending } from './ModelActionBar.vue';
import SessionWorkspaceButton from './chat-input/SessionWorkspaceButton.vue';
import ReDialog from '@repo/ui/re-dialog'


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
const layoutStore = useLayoutStore();
const workspaceStore = useWorkspaceStore();

/**
 * 本机输入历史（按用户分键，见 utils/inputHistory）。
 *
 * <p>与会话消息解耦：用户清空会话后 ↑ 仍能翻到上次发过的内容。登录态是异步
 * 恢复的，用户名可能晚于挂载才就位，所以跟着 user 变化重读一次。</p>
 */
const localInputHistory = ref<string[]>(loadInputHistory(authStore.user?.username))
watch(() => authStore.user?.username, (name) => {
  localInputHistory.value = loadInputHistory(name)
})

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
  /** 底部状态条右侧「上下文窗口」图标：请上层打开主区域面板 */
  'open-context': []
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
const { tokenStats } = useSessionTokenStats(currentSessionIdRef);

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

/**
 * 已做过「重启后恢复队列」判定的会话集合。
 *
 * <p>每次页面加载每个会话只判定一次：来回切会话不会重复发送，
 * 也不会把用户手动留在队列里的消息反复自动发出。</p>
 */
const resumeCheckedSessions = new Set<string>()

/** 上一轮未完成：输入框上方挂确认条，由用户决定是否发「继续」 */
const resumeInterrupted = ref(false)

// 滚动管理相关状态和方法
const showScrollToBottomBtn = ref(false)
const shouldButtonBreathe = ref(false)

/**
 * 更新滚动按钮显示状态
 */
const updateScrollButtonVisibility = useDebounceFn(() => {
  // 以容器实测几何判定，不能读 ScrollContainer 的 isAtBottom：
  // 那个 ref 既没有随滚动更新、也没有 expose，读到的永远是 undefined，
  // 于是「流式一开始就显示按钮」——用户明明停在底部也看到箭头（2026-11-14 报障）。
  const el = scrollContainerRef.value?.getScrollElement?.()
  const atBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight <= 5

  if (atBottom) {
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

/**
 * 最后一条助手轨迹里「此刻正在发生」的那一项。
 *
 * 只判断每组轨迹的**最后一项**：更早的步骤都已经结束，往回找不可能找到在跑的东西，
 * 反而会把「上一轮早已完成的工具」误报成进行中。
 * 数据来源是消息自带的 toolCalls / reasoning 状态，不新拉接口。
 */
const currentProcessItem = computed<{ kind: 'tool'; tool: any } | { kind: 'think' } | null>(() => {
  const list = visibleTurns.value || [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const assistants = (list[i] as any)?.assistants || [];
    for (let j = assistants.length - 1; j >= 0; j -= 1) {
      const items = flattenContentsForTimeline(getCurrentTurns(assistants[j]));
      const item = items[items.length - 1];
      if (!item) continue;
      if (item.type === 'tool') {
        const running = (item.toolCalls || []).filter((tc: any) => !tc.outcome);
        if (running.length) {
          return { kind: 'tool', tool: running[running.length - 1] };
        }
      } else if (item.type === 'think' && (item as any).source?.state?.isThinking) {
        return { kind: 'think' };
      }
      return null;
    }
  }
  return null;
});

/**
 * 回到底部按钮上的「当前在做什么」（用户要求 2026-10-24）。
 *
 * 优先级：压缩 > 正在跑的工具 > 思考。
 * 「正在生成」按需求去掉：它与输入框上方的模型动作条重复，且生成态本身
 * 由流式光标表达，不必在回到底部按钮上再写一遍。
 */
const processingStatus = computed(() => {
  const sessionId = currentSessionId.value;
  if (sessionId && sessionStore.sessionIsCompressing(sessionId)) {
    return t('chat.panel.statusCompressing');
  }
  const current = currentProcessItem.value;
  if (current?.kind === 'tool') {
    return t('chat.panel.statusRunningTool', { action: getToolActionLabel(current.tool) });
  }
  if (current?.kind === 'think') {
    return t('chat.panel.statusThinking');
  }
  return '';
});

// ============================================
// 模型动作条（输入框上方）：从会话轨迹派生形态
// ============================================

/** 取某回合里用户当时选中的那条回复（与 TurnItem.activeAssistant 同口径） */
function activeAssistantOf(turn: any): any | null {
  const assistants = turn?.assistants || [];
  const activeId = turn?.user?.currentVersionId;
  if (activeId) {
    const hit = assistants.find((a: any) => a.id === activeId);
    if (hit) return hit;
  }
  return assistants[assistants.length - 1] || null;
}

/**
 * 网络重试：流式过程中后端回报 retry（连接抖动 / 限流），此时 AI 没有在思考，
 * 只是在等网络。useStreamResponse 把 retryInfo 写进内容 metadata，内容恢复后清除，
 * 所以「存在 retryInfo」就是当时的等待信号，不需要额外状态机。
 */
/**
 * 待确认的计划（waiting 形态的数据源）。
 *
 * 只取**最后一个回合**里最近一条未决的 confirmationRequest：更早回合的确认
 * 都已被后续回合超越；已决（approved/rejected）的不算等待。
 * 独立成 computed 是为了让动作条能就地「全部批准」，不必滚到计划卡片。
 */
const actionBarPending = computed<ModelActionPending | null>(() => {
  const list = visibleTurns.value || [];
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const assistants = (list[i] as any)?.assistants || [];
    // 该回合内从新到旧扫：挂起时确认请求可能不在最后一条空壳助手消息上
    for (let j = assistants.length - 1; j >= 0; j -= 1) {
      const contents = assistants[j]?.contents || [];
      for (let k = contents.length - 1; k >= 0; k -= 1) {
        const req = contents[k]?.metadata?.confirmationRequest;
        const resolved = req?.status === 'approved' || req?.status === 'rejected';
        if (req && req.replyId && !resolved) {
          return { replyId: req.replyId, items: req.items || [] };
        }
      }
    }
    break;
  }
  return null;
});

const actionBarRetrying = computed(() => actionBarRetry.value !== null);

/**
 * 网络重试：流式过程中后端回报 retry（连接抖动 / 限流），此时 AI 没有在思考，
 * 只是在等网络。useStreamResponse 把 retryInfo 写进内容 metadata，内容恢复后清除，
 * 所以「存在 retryInfo」就是当时的等待信号，不需要额外状态机。
 */
const actionBarRetry = computed<{ attempt?: number; maxRetries?: number; reason?: string } | null>(() => {
  if (!isStreaming.value) return null;
  const list = visibleTurns.value || [];
  const active = activeAssistantOf(list[list.length - 1]);
  for (const c of active?.contents || []) {
    const info = c?.metadata?.retryInfo;
    if (info) {
      return {
        attempt: info.attempt,
        maxRetries: info.maxRetries,
        reason: info.reason || info.message,
      };
    }
  }
  return null;
});

/**
 * 执行进度：本轮已开过几个工具。
 *
 * 后端不下发「一共几个工具」（模型跑到哪算哪），所以只报「第 N 个」这种诚实口径，
 * 不假装成带百分比的进度条。
 */
const actionBarProgressText = computed(() => {
  if (actionBarKind.value !== 'executing') return '';
  const list = visibleTurns.value || [];
  const active = activeAssistantOf(list[list.length - 1]);
  let total = 0;
  for (const c of active?.contents || []) {
    // 两条通道都要算：
    //  · toolIteration 是 trace/智能体路径的累计序号（useStreamResponse 逐次 +1）；
    //  · toolCalls 是经典 tool_call 事件收集到的调用列表（该路径不写 toolIteration）。
    // 只认前者时，经典路径下永远拿不到序号，动作条就少了「第 N 个工具」。
    const iterations = Number(c?.metadata?.toolIteration) || 0;
    const calls = Array.isArray(c?.metadata?.toolCalls) ? c.metadata.toolCalls.length : 0;
    total = Math.max(total, iterations, calls);
  }
  if (total <= 1) return '';
  return t('chat.panel.actionBarToolIndex', { index: total });
});

/**
 * 动作条形态：executing（跑工具，带命令卡）/ retrying（等网络重试）/
 * thinking / streaming / waiting（等你确认）/ null。
 *
 * waiting 的来源是**未决**的 plan_exit 人工确认：确认后 confirmationRequest
 * 仍留在 metadata 里，只是多了 status: 'approved' | 'rejected'（持久化终态）。
 * 只判断 replyId 会让动作条在用户点完确认后一直挂着「等待」，恢复失败时永久显示。
 *
 * waiting 优先于 executing：挂起时轮次不再推进，最后一个「过程项」会永远停在
 * 工具行上（该工具其实早已返回），不先看确认请求就会误报「正在执行命令」。
 *
 * 没有 idle：答完就是 null，整条不渲染（用户 2026-11-12：已作答就不要显示了）。
 */
const actionBarKind = computed<'executing' | 'retrying' | 'thinking' | 'streaming' | 'waiting' | null>(() => {
  if (actionBarPending.value) return 'waiting';
  const current = currentProcessItem.value;  if (current?.kind === 'tool') return 'executing';
  // 网络重试期间同样「什么都没在做」，必须在 thinking 之前拦下
  if (actionBarRetrying.value) return 'retrying';
  if (current?.kind === 'think') return 'thinking';
  if (isStreaming.value) return 'streaming';
  return null;
});

/**
 * 会话累计执行统计（回答速度 / 模型耗时 / 工具耗时），供动作条在空闲态展示。
 *
 * 口径与 SessionStatusPanel 一致：只聚合助手消息上的 usage / totalDurationMs /
 * toolDurationMs，缺失的项不臆造（例如旧消息没有 totalDurationMs 就不显示该项）。
 */
const actionBarSessionStats = computed(() => {
  let modelMs = 0;
  let toolMs = 0;
  let completion = 0;
  let answers = 0;
  for (const turn of visibleTurns.value || []) {
    for (const m of turn?.assistants || []) {
      const mm = Number(m?.totalDurationMs)
      if (Number.isFinite(mm) && mm > 0) modelMs += mm
      const tm = Number(m?.toolDurationMs)
      if (Number.isFinite(tm) && tm > 0) toolMs += tm
      const usage = (m?.contents || []).map((c: any) => c?.metadata?.usage).find(Boolean)
      if (usage) {
        completion += Number(usage.completionTokens || usage.outputTokens || 0)
        answers += 1
      }
    }
  }
  return { modelMs, toolMs, answers, completion }
});

/**
 * 把会话累计令牌同步给「目标」计数器。
 *
 * <p>口径：优先用后端 token-stats 的累计 prompt + completion（刷新后仍有）；
 * 后端没给累计值（0）时退回本地按消息汇总的 completion。
 * 目标创建时的会话总量会被 store 记成基线，计数器显示的是「目标开始之后」的消耗。</p>
 */
const goalStore = useGoalStore();

watch(
  () => {
    const sid = effectiveSessionId.value;
    const stats = tokenStats.value;
    const fromStats = (Number(stats?.promptTokens) || 0) + (Number(stats?.completionTokens) || 0);
    const total = fromStats > 0 ? fromStats : actionBarSessionStats.value.completion;
    // 把目标 id 也放进依赖：新建目标时令牌总量没变，但基线必须立刻采一次，
    // 否则第一条回复到达时才会记基线，那一条的消耗就被吞掉了。
    const goal = sid == null ? null : goalStore.goalOf(String(sid));
    return [sid, total, goal?.id ?? null] as const;
  },
  ([sid, tokens]) => {
    if (sid == null || !String(sid)) {
      return;
    }
    goalStore.syncTokens(String(sid), Number(tokens) || 0);
  },
  { immediate: true },
);

/** 动作条里的模型名：与 ChatInput 模型按钮同源（该组件已加载模型目录并做了去命名空间显示） */
const actionBarModelName = computed(() => chatInputRef.value?.currentModelName || '');

/** executing 态的命令卡数据：摘要一行 + 实时输出 + 展开详情（参数全文） */
const actionBarCard = computed<ModelActionCard | null>(() => {
  const current = currentProcessItem.value;
  if (current?.kind !== 'tool') return null;
  const tool = current.tool;
  const args = getArgsText(tool);
  // 增量输出（trace 的 tool_result 片段）由 useStreamResponse 累加到 tool.result；
  // undefined 表示这个工具根本不产流（如写文件），不渲染输出区；空串表示在等首字节。
  const rawResult = (tool as any)?.result;
  return {
    id: tool?.id ? String(tool.id) : undefined,
    label: getToolActionLabel(tool),
    summary: args || getToolActionLabel(tool),
    fullCommand: args,
    detail: args || undefined,
    elapsedText: '',
    icon: getToolIcon(tool),
    liveOutput: typeof rawResult === 'string' ? rawResult : undefined,
  };
});

/** 动作条上「全部批准」：与计划卡片同一条恢复链路（resumeConfirmation） */
function handleActionBarApproveAll(replyId: string) {
  const items = actionBarPending.value?.items || []
  void resumeConfirmation({ replyId, confirmed: true, items })
}

/**
 * 等待态「去处理」：把待确认的计划卡滚进视野。
 *
 * 卡片固定渲染在最后一个回合的尾部，滚到底部即可命中；不用 querySelector
 * 按类名找——PlanApprovalCard 是异步组件，类名一改这里就静默失效。
 */
function handleActionBarLocate() {
  nextTick(() => scrollToBottom());
}


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
  // 后台标签页不自动发排队消息：回到前台时补一次判定（见 onPageVisible）
  document.addEventListener('visibilitychange', onPageVisible)
});

onUnmounted(() => {
  clearSkeletonTimers();
  document.removeEventListener('visibilitychange', onPageVisible)
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
    const session = currentSession.value;
    const nextPath = config.workspacePath || null;
    const previousPath = session.workspacePath || null;
    if (nextPath !== previousPath) {
      // 先改内存让按钮/提示立刻回显，再落库；失败时回滚，避免「显示项目 A、实际跑在 B」
      session.workspacePath = nextPath;
      const sessionId = session.id ? String(session.id) : null;
      if (!sessionId) {
        workspaceStore.bumpRootRevision();
      } else {
        apiService.updateSession(sessionId, { workspacePath: nextPath })
          .then(() => {
            // 服务端已接受：侧栏按新根重载（文件树、预览、SSE 根都跟着它走）
            workspaceStore.bumpRootRevision();
          })
          .catch((err: any) => {
            const target = currentSession.value;
            if (target && String(target.id) === sessionId) {
              target.workspacePath = previousPath;
              workspaceStore.bumpRootRevision();
            }
            notify.error(t('chat.panel.workspaceSaveFailed'), err?.message);
          });
      }
    }
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

/**
 * 会话页切换工作目录。
 *
 * <p>入口是输入行左组的 SessionWorkspaceButton；这里只做转发，内存同步、落库与
 * 失败回滚都收在 {@link handleConfigChange} 里，避免两条路径各写一份。</p>
 *
 * @param workspacePath 新目录；null 表示回到「自动创建」（账号 agent 目录）
 */
const handleWorkspaceChange = (workspacePath: string | null) => {
  handleConfigChange({ workspacePath });
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
 * 历史提示条目（输入框按 ↑ 打开）：本机输入历史 + 当前会话<b>已加载</b>的用户提问。
 *
 * <p>2026-11-14 起本机历史（localStorage，见 utils/inputHistory）排在最前：
 * 用户清空会话消息后仍能翻到上次输入。此前只读消息列表，删消息历史即空。
 * 会话消息部分随加载/删除实时变化，作为补充分列在后面；同一文本只保留一条。</p>
 */
const promptHistory = computed(() => {
  const items: Array<{ id: string; text: string }> = []
  const seen = new Set<string>()
  for (const text of localInputHistory.value) {
    const value = text.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    items.push({ id: `local-${items.length}`, text: value })
  }
  const fromMessages: Array<{ id: string; text: string }> = []
  for (const msg of activeMessages.value) {
    if (msg.role !== 'user') continue
    const text = String(msg.contents?.[0]?.content ?? '').trim()
    if (!text || seen.has(text)) continue
    seen.add(text)
    fromMessages.push({ id: String(msg.id), text })
  }
  // 会话消息最新在前：↑ 打开后先看到刚问过的那句
  return items.concat(fromMessages.reverse())
})

/**
 * 历史浮层的「加载更多提示」：复用消息列表的上一页加载。
 *
 * <p>加载完的条目会经 activeMessages 自动出现在历史里，这里不必再合并一次。
 * 立即置 isLoadingMore 与滚动加载同口径，防止连点重复请求。</p>
 */
function handleHistoryLoadMore(): void {
  const sessionId = currentSessionId.value
  if (!sessionId || isLoadingMore.value || !hasMoreMessages.value) return
  const earliestId = sessionStore.getEarliestMessageId(sessionId)
  if (!earliestId) return
  isLoadingMore.value = true
  void loadMoreMessages(sessionId, earliestId)
}

/**
 * 空输入框按 ←/→：切换内容区宽度（用户口径 2026-11-12）。
 *
 * <p>口径与「设置 → 显示 → 内容区宽度」完全一致，走 {@link useKbDisplay} 的
 * 单例状态 + 落库，所以快捷键、设置页、其他页面（设置中心 / 知识库问答栏）
 * 看到的是同一个值，不会出现「按了键只有会话页变宽」。</p>
 *
 * @param width narrow = 输入框宽度，full = 满屏
 */
const { askWidth, setKbAskWidth } = useKbDisplay()
function handleToggleContentWidth(width: 'narrow' | 'full'): void {
  if (askWidth.value === width) return
  void setKbAskWidth(width)
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
  // 切换会话时先收掉上一个会话的「上一轮未完成」确认条
  resumeInterrupted.value = false;
  try {
    lastScrollTop = 0;
    currentSessionId.value = newSessionId;
    await loadSession(newSessionId);
    if (token !== sessionChangeToken) return;
    // 页面加载时一次性检查活跃流（用于刷新后的初始状态同步）
    await checkActiveStreamOnLoad(newSessionId);
    if (token !== sessionChangeToken) return;

    // 刷新/重启后恢复排队消息（每个会话每次页面加载只判定一次）。
    // 有待发的首条输入时不抢跑：那一轮结束后队列会按原有逻辑自动消费。
    if (!inputMessage.value?.isWaiting) {
      await resumeQueuedMessagesOnLoad(newSessionId);
      if (token !== sessionChangeToken) return;
    }

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

/**
 * 判断会话最后一轮是否没有收尾（提问在、回答不在）。
 *
 * <p>判据用消息顺序而不是 parentId：历史消息序列化后 parentId 不一定回传，
 * 而「最后一条 user 之后是否还有 assistant」在任何数据源下都成立。</p>
 *
 * @param sessionId 会话 ID
 * @returns 最后一轮只有用户提问、没有助手回复时为 true
 */
function isLastTurnUnfinished(sessionId: string): boolean {
  const messages = sessionStore.getMessages(sessionId) || []
  let lastUserIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') { lastUserIdx = i; break }
  }
  if (lastUserIdx === -1) return false
  return !messages.slice(lastUserIdx + 1).some((m: any) => m?.role === 'assistant')
}

/**
 * 重启/刷新后恢复排队消息（用户需求 2026-11-12）。
 *
 * <p>三条规则：</p>
 * <ol>
 *   <li>后端那轮还在跑（isRunning）→ 什么都不发，挂回流等它自己结束；</li>
 *   <li>上一轮被打断（只有提问没有回答）→ 不自动发，挂确认条让用户选「继续」/「忽略」；</li>
 *   <li>上一轮正常结束且队列非空 → 发出队列第一条。</li>
 * </ol>
 *
 * <p>只在前台标签页自动发：后台标签页替用户扣一轮 token 不可接受。</p>
 *
 * @param sessionId 会话 ID
 */
async function resumeQueuedMessagesOnLoad(sessionId: string) {
  if (resumeCheckedSessions.has(sessionId)) return
  if (sessionStore.getMessageQueue(sessionId).length === 0) return
  // 后台标签页不判定、也不标记已判定：等用户回到前台再走一次（见 onPageVisible），
  // 否则「后台打开 → 永远不消费」会变成无声的死队列。
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
  resumeCheckedSessions.add(sessionId)
  resumeInterrupted.value = false

  let running = false
  try {
    const status = await apiService.getStreamStatus(sessionId)
    running = !!status?.isRunning
  } catch (error) {
    // 状态判不出来就不动队列：自动发错一轮的代价，远高于晚发
    console.error('恢复排队消息时查询流状态失败:', error)
    return
  }
  // 后端还在跑：等 stream_finished，现有的流式监听会消费队列
  if (running) return

  // 会话 ID 可能在 await 期间被切走
  if (currentSessionId.value !== sessionId) return

  if (isLastTurnUnfinished(sessionId)) {
    resumeInterrupted.value = true
    return
  }

  const first = sessionStore.claimFirstQueuedMessage(sessionId)
  if (!first) return
  await handleSendMessage({
    content: first.content,
    files: first.files || [],
    knowledgeBaseIds: first.knowledgeBaseIds || [],
    skillNames: first.skillNames || [],
  })
}

/** 确认条「继续」：把「继续」作为一条真实用户消息发出去 */
async function handleResumeContinue() {
  if (!currentSessionId.value) return
  resumeInterrupted.value = false
  await handleSendMessage({
    content: t('chat.panel.resumeContinueMessage'),
    files: [],
    knowledgeBaseIds: [],
  })
}

/** 确认条「忽略」：本次不自动发，队列原样保留，用户可在抽屉里手动发 */
function handleResumeDismiss() {
  resumeInterrupted.value = false
}

/**
 * 页面回到前台：补一次队列恢复判定。
 *
 * <p>被判定跳过的情况只有一种——加载时页面在后台（浏览器切走了标签页）。
 * 用户回来后立刻补上，避免队列静默卡住。</p>
 */
function onPageVisible() {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const sid = currentSessionId.value
  if (sid) void resumeQueuedMessagesOnLoad(sid)
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
  if (!data || (!data.content?.trim() && !(data.files?.length))) return;

  // 本机输入历史先落一条：即使随后发送失败、或用户事后清空会话消息，
  // ↑ 历史提示也还能翻到这次输入。
  rememberInput(data.content ?? '', authStore.user?.username)
  localInputHistory.value = loadInputHistory(authStore.user?.username)

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

/* ===== 「上一轮未完成」确认条 =====
   与输入框同宽、浅警示底；文字走正文色而不是警示色，避免整条看起来像报错。
   文字允许换行（窄窗下按钮会把文字挤成两行，截断会丢掉「排队消息已暂停」这层意思）。 */
.resume-banner {
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 28%, transparent);
}

.resume-banner__icon {
  width: 14px;
  height: 14px;
  color: var(--el-color-warning);
}

.resume-banner__text {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--color-text, var(--el-text-color-primary));
}

/* ===== 编辑模式提示条 =====
   设计目标：提示条是「提示条 + 输入卡」这**一整张卡**的头部，而不是浮在输入框上方的独立条。
   做法 —— 与 .input-area 共用宽度、边框色、圆角半径与底色，只保留顶部圆角。
   交界处不再由两段各画一条边去「对齐」：那种做法要靠 margin-bottom: -1px 把输入卡
   上边框拽上来当分隔线，圆角、内边距、边框色任一处不同就会露出破绽。
   改成两段都不画交界边，那条 1px 线由提示条内层 .edit-banner__inner 独占，
   位置永远精确，也不再需要负边距。
   改动前：外层 px-4 让它比输入框窄 16px，且中间的「添加目标」把卡片切成三段。 */
.edit-banner {
  /* 顶部圆角与输入框一致（--size-rounded-radius 由主题统一给值） */
  border-radius: var(--size-rounded-radius, 16px) var(--size-rounded-radius, 16px) 0 0;
  border: 1px solid var(--color-input-border, var(--el-border-color));
  border-bottom: none;
  overflow: hidden;
}

.edit-banner__inner {
  /* 交界处的 1px 分隔线挂在内层：提示条自身对外仍是「没有下边框」，
     于是「提示条无下边框」+「输入卡无上边框」+「交界处仍有一条线」可以同时成立 */
  border-bottom: 1px solid var(--color-input-border, var(--el-border-color));
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

/* 底部渐变遮罩：底部25px完全隐藏，上方渐变过渡。
   取对话区底色令牌而不是 --color-bg —— 对话区改成白底后，
   用页面底色会在白底上拖出一条淡蓝渐变带。
   模板已有 v-if="!hasWallpaper"：壁纸场景下对话区是半透明层，
   这里的纯色渐变会显成一块补丁，故不在此处再做处理。 */
.chat-bottom-fade {
  position: absolute;
  height: 48px;
  pointer-events: none;
  background: linear-gradient(to top, var(--color-chat-bg, var(--color-bg)) 25px, transparent 48px);
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
