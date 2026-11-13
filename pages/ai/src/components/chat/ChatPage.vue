<template>
  <!-- 主体内容（侧边栏已移至 MainLayout） -->
  <div class="chat-page-root flex flex-col h-full w-full" data-page="chat">
    <template v-if="sessionStore.activeSessionId !== 'new-session'">
      <!-- 可拖拽分割区域 -->
      <div class="flex-1 overflow-hidden">
        <LiteSplitpanes :split-size="layoutStore.workspaceFullscreen ? 0 : (layoutStore.workspaceVisible ? workspaceSize : 100)"
          :min-size="layoutStore.workspaceFullscreen ? 0 : 30" :max-size="85" :min-pane2-size="320" @resize="onPaneResize" @resized="onPaneResized">
          <template #pane1>
            <div ref="paneContentRef" class="chat-pane-content" :style="paneContentStyle">
              <!-- 页面标题栏 -->
              <PageHeader :hide-window-controls="layoutStore.workspaceVisible">
                <!-- 会话标题 + 右侧「更多」：点开是会话功能 popover（用户口径 2026-11-13） -->
                <template #title>
                  <span class="chat-title-text" :title="mainSession?.title || ''">{{ mainSession?.title || '' }}</span>
                  <DropdownMenu @command="handleSessionCommand">
                    <button type="button" class="chat-title-more" aria-label="会话功能">
                      <MoreVertOutlined class="w-4 h-4" />
                    </button>
                    <template #dropdown>
                      <DropdownMenuItem command="rename">重命名会话</DropdownMenuItem>
                      <DropdownMenuItem command="copy-id">复制会话 ID</DropdownMenuItem>
                      <DropdownMenuItem command="clear">清空记录</DropdownMenuItem>
                    </template>
                  </DropdownMenu>
                </template>
                <template #actions>
                  <!-- 工作目录切换 -->
                  <LTooltip v-if="mainSession?.id" :content="layoutStore.workspaceVisible ? t('chat.header.closeWorkspace') : t('chat.header.openWorkspace')" placement="bottom">
                  <div ref="workspaceButtonRef" class="header-icon-btn" :class="{ active: layoutStore.workspaceVisible }" role="button" tabindex="0"
                    :aria-label="layoutStore.workspaceVisible ? t('chat.header.closeWorkspace') : t('chat.header.openWorkspace')"
                    :aria-pressed="layoutStore.workspaceVisible"
                    @click="layoutStore.toggleWorkspace()"
                    @mouseenter="onWorkspaceHoverEnter"
                    @mouseleave="onWorkspaceHoverLeave"
                    @keydown.enter.prevent="layoutStore.toggleWorkspace()"
                    @keydown.space.prevent="layoutStore.toggleWorkspace()">
                    <PanelRightExpand20Filled class="w-5 h-5" />
                  </div>
                  </LTooltip>
                  <!-- 悬停预览（用户口径 1.2）：停一下就能看到工作区里有哪些文件，
                       不打开右侧栏；点任意一行或「打开工作区」才真正展开。 -->
                  <WorkspaceHoverCard :visible="workspaceHoverVisible" :anchor-el="workspaceButtonRef"
                    :session-id="mainSession?.id ? String(mainSession.id) : null"
                    @open="openWorkspaceFromHover" @card-enter="cancelWorkspaceHoverClose"
                    @card-leave="onWorkspaceHoverLeave" />
                  <!-- 会话工作状态面板切换 -->
                  <LTooltip v-if="mainSession?.id" content="会话工作状态" placement="bottom">
                  <div class="header-icon-btn" :class="{ active: showStatusPanel }" title="会话工作状态"
                    role="button" tabindex="0" aria-label="会话工作状态" :aria-pressed="showStatusPanel"
                    @click="toggleStatusPanel"
                    @keydown.enter.prevent="toggleStatusPanel">
                    <DataUsage20Filled class="w-5 h-5" />
                  </div>
                  </LTooltip>
                  <!-- 会话执行轨迹 -->
                  <LTooltip v-if="mainSession?.id" content="执行轨迹" placement="bottom">
                  <div class="header-icon-btn" :class="{ active: showTracePanel }" title="执行轨迹"
                    role="button" tabindex="0" aria-label="执行轨迹" :aria-pressed="showTracePanel"
                    @click="toggleTracePanel"
                    @keydown.enter.prevent="toggleTracePanel">
                    <Timeline20Filled class="w-5 h-5" />
                  </div>
                  </LTooltip>
                  <!-- 内置浏览器：新建一张浏览器标签并进入预览（不再只是把工作区目录拉出来） -->
                  <LTooltip v-if="mainSession?.id" content="打开内置浏览器" placement="bottom">
                  <div class="header-icon-btn" :class="{ active: builtinBrowserActive }" title="内置浏览器"
                    role="button" tabindex="0" aria-label="内置浏览器" :aria-pressed="builtinBrowserActive"
                    @click="openBuiltinBrowser"
                    @keydown.enter.prevent="openBuiltinBrowser"
                    @keydown.space.prevent="openBuiltinBrowser">
                    <Globe20Filled class="w-5 h-5" />
                  </div>
                  </LTooltip>
                  <!-- 更多操作下拉菜单 -->
                  <DropdownMenu @command="handleMoreSelect">
                    <div class="header-icon-btn" role="button" tabindex="0"
                      :aria-label="t('chat.header.moreActions')"
                      @keydown.enter.prevent>
                      <MoreVertOutlined class="w-5 h-5" />
                    </div>
                    <template #dropdown>
                      <DropdownMenuItem command="clear">
                        <span class="flex items-center gap-2">
                          <DeleteTwotone class="w-4 h-4" />
                          <span>{{ t('chat.header.clearRecords') }}</span>
                        </span>
                      </DropdownMenuItem>
                    </template>
                  </DropdownMenu>
                </template>
              </PageHeader>

              <!-- 聊天内容区域（含上下文面板） -->
              <div class="chat-content-wrapper" style="flex: 1; display: flex; overflow: hidden;">
                <!-- 会话面板容器 -->
                <div class="chat-panel-container" style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
                  <!-- 会话面板：主会话和子 Agent 共用同一个 ChatPanel，通过 session 切换 -->
                  <!-- 全屏模式下 ChatPanel 通过 Teleport 搬至浮动容器 -->
                  <Teleport :disabled="teleportDisabled" to="#floating-chat">
                    <ChatPanel v-if="chatPanelReady" ref="chatPanelRef" :session="panelSession" :readonly="activeTabId !== 'main'"
                      :hide-header="activeTabId !== 'main'" :agent-tabs="agentTabs" :active-tab-id="activeTabId"
                      @switch-agent="switchTab"
                      @save-settings="handleSaveSessionSettings"
                      @open-session="handleOpenSession"
                      @open-context="openContextPanel"
                      @select-character="handleSelectCharacter" />
                  </Teleport>

                  <!-- 右侧大纲导航。
                       工作目录全屏时 ChatPanel 被 Teleport 进 #floating-chat，本列 pane 宽度被压到 0，
                       预览条的定位基准（.chat-pane-content，contain:layout）跟着塌成 0×0：
                       实测 13 个标记全部落在视口 (0,0)、点不到，同时还会占着 Tab 键的焦点位。
                       全屏下这条导航本就无处安放，直接不渲染。 -->
                  <ChatOutline v-if="mainSession && activeTabId === 'main' && !layoutStore.workspaceFullscreen"
                    :messages="chatPanelRef?.activeMessages || []"
                    :chat-panel-ref="chatPanelRef" @scroll-to-message="handleScrollToMessage" />
                </div>

                <!-- 右侧栏（用户口径 2026-11-13）：执行轨迹与会话状态可以同时打开，
                     竖向排布（轨迹在上、状态在下），左边缘可拖拽调宽。 -->
                <div v-if="showTracePanel || showStatusPanel" class="chat-side-rail"
                  :style="{ width: railWidth + 'px' }">
                  <div class="chat-side-rail__splitter" title="拖动调整宽度" @mousedown.prevent="startRailDrag" />
                  <!-- 执行轨迹 -->
                  <div v-if="showTracePanel && mainSession" class="chat-side-panel chat-side-panel--trace">
                    <TracePanel :key="tracePanelKey" :session-id="mainSession.id" @close="showTracePanel = false" />
                  </div>
                  <!-- 会话工作状态面板 -->
                  <SessionStatusPanel v-if="showStatusPanel && mainSession" class="chat-side-panel--status"
                    :session-id="mainSession.id"
                    :messages="chatPanelRef?.activeMessages || []"
                    @close="showStatusPanel = false" />
                </div>
              </div>
            </div>
          </template>

          <template #pane2>
            <WorkspaceSidebar v-if="layoutStore.workspaceVisible && mainSession" :session-id="mainSession.id"
              @insert-to-input="handleInsertToInput" @insert-snip="handleInsertSnip" />
          </template>
        </LiteSplitpanes>
      </div>
    </template>
    <template v-else>
      <!-- 新建对话头部 -->
      <PageHeader :title="t('chat.welcome.newSession')" />
      <CreateSessionChatPanel @create-session="handleCreateSessionWithMessage" />
    </template>
  </div>




</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch, computed, nextTick, defineAsyncComponent, type Ref } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n()
import { apiService } from "@/services/ApiService";
import { sessionAgentApi } from '@/services/javaApi';
import { useRouter, useRoute } from 'vue-router';
import { usePopup } from "@/composables/usePopup";
import { useSessionStore } from "@/stores/session";
import { useAuthStore } from "@/stores/auth";
import { useLayoutStore } from "@/stores/layout";
import { useBrowserWebviewStore } from "@/stores/browserWebview";
import { useTabStore } from "@/stores/tab";
import { useTitle } from '@/composables/useTitle';
import type { Session } from '@/types/session';
import type { Character } from '@/types/character';
import { LiteSplitpanes } from "../ui";
import ChatPanel from "./ChatPanel.vue";
import CreateSessionChatPanel from "./CreateSessionChatPanel.vue";
/**
 * 子代理 Tab 数据接口
 */
interface AgentTab {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'error';
  loaded?: boolean;
  avatarUrl?: string;  // 角色/团队子Agent的头像
}

// 引入组件
import PageHeader from "@/components/PageHeader.vue";
import LTooltip from "@/components/ui/LTooltip.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import DropdownMenuItem from "@/components/ui/DropdownMenuItem.vue";
import {
  MoreVertOutlined,
  DeleteTwotone,
  // FileDownloadOutlined,
  // FileUploadOutlined
} from "@vicons/material";
import { PanelRightExpand20Filled, DataUsage20Filled, Timeline20Filled, Globe20Filled } from "@vicons/fluent";
import { previewUrl } from "@/utils/workspacePreview";
// 会话 ID 哈希：地址栏不暴露明文会话 ID（用户口径 2026-11-13）
import { sessionHash, isSessionHash } from "@/utils/sessionHash";
import WorkspaceHoverCard from "./workspace/WorkspaceHoverCard.vue";


const ChatOutline = defineAsyncComponent(() => import("./ChatOutline.vue"));
const WorkspaceSidebar = defineAsyncComponent(() => import("./workspace/WorkspaceSidebar.vue"));
const SessionStatusPanel = defineAsyncComponent(() => import("./SessionStatusPanel.vue"));
const TracePanel = defineAsyncComponent(() => import("./trace/TracePanel.vue"));

// 轨迹页签：与「对话」互斥切换主区域。
// 不像工作状态面板那样按会话记忆——轨迹是每次运行后才有意义的内容，
// 记住上次的开合只会让人切回旧会话时莫名其妙看到一个空面板。
const showTracePanel = ref(false);

/**
 * 轨迹面板的"重开"计数：面板内部页签是私有状态（默认「上下文窗口」）。
 * 从底部「上下文窗口」入口进来时，如果面板已经开在「执行轨迹」页签上，
 * 只把显隐置 true 是没有任何变化的——所以递增 key 让它按默认页签重新挂载。
 */
const tracePanelKey = ref(0);

/**
 * 会话执行轨迹面板显隐
 */
function toggleTracePanel() {
  showTracePanel.value = !showTracePanel.value;
}

/**
 * 底部「上下文窗口」图标入口。
 *
 * 打开的是执行轨迹面板（内含「上下文窗口」页签），不是右侧的工作状态抽屉：
 * 抽屉里只有一行百分比，而用户点这个入口想看的是 map + 明细。
 * 轨迹面板默认就落在上下文页签，因此这里只负责把面板打开、把抽屉让开。
 */
function openContextPanel() {
  showStatusPanel.value = false;
  tracePanelKey.value += 1;
  showTracePanel.value = true;
}

// 会话工作状态面板显示状态
// 显隐按会话记忆：写在后台会话 settings.statusPanelVisible（PUT /v2/sessions/{id}），
// 刷新页面或切走再回来都保持上次的开合，不像 localStorage 那样全局共用一个开关。
const showStatusPanel = ref(false);

/* ==== 会话标题右侧「更多」：会话功能菜单（用户口径 2026-11-13）==== */
/** 菜单命令分发：沿用 DropdownMenu，避免在页头槽位里再叠一层浮层定位 */
async function handleSessionCommand(command: string): Promise<void> {
  if (command === 'rename') {
    await renameSession();
    return;
  }
  if (command === 'copy-id') {
    await copySessionId();
    return;
  }
  if (command === 'clear') {
    await clearChatFromMenu();
  }
}

/** 重命名当前会话（标题随列表一起更新） */
async function renameSession(): Promise<void> {
  const session = mainSession.value;
  if (!session) return;
  try {
    const next = await editText('重命名会话', String(session.title || ''));
    const title = String(next || '').trim();
    if (!title || title === session.title) return;
    await apiService.updateSession(session.id, { title });
    session.title = title;
    toast.success('会话已重命名');
  } catch (e: any) {
    // 取消输入不算错误，只有写接口失败才提示
    if (e) toast.error(String(e?.message || e));
  }
}

/** 复制会话 ID：排障、贴日志时最常用的一项 */
async function copySessionId(): Promise<void> {
  const session = mainSession.value;
  if (!session) return;
  try {
    await navigator.clipboard.writeText(String(session.id));
    toast.success('会话 ID 已复制');
  } catch {
    toast.error('复制失败，请手动选择');
  }
}

/** 清空记录：复用原有确认流程，先收起 popover 避免叠层 */
async function clearChatFromMenu(): Promise<void> {
  await clearChat();
}

/* ==== 右侧栏宽度拖拽（用户口径 2026-11-13 5.2）====
   轨迹与状态两个面板共用一个宽度：拖左侧热区，夹在 280..(视口-480)，落 localStorage。 */
const RAIL_WIDTH_KEY = 'ai.chatRailWidth';
/** 默认宽度 470（用户口径 2026-11-13：会话/执行轨迹的默认框再加 50px，原 420） */
const RAIL_DEFAULT_WIDTH = 470;
const railWidth = ref<number>((() => {
  try {
    const saved = Number(localStorage.getItem(RAIL_WIDTH_KEY));
    return Number.isFinite(saved) && saved >= 280 ? saved : RAIL_DEFAULT_WIDTH;
  } catch {
    return RAIL_DEFAULT_WIDTH;
  }
})());
let railDragStart: { x: number; width: number } | null = null;

/**
 * 右侧栏是否占位（轨迹 / 会话状态任一打开）。
 *
 * <p>ChatOutline 是 `position: fixed`，而 `.chat-pane-content` 带 `contain: layout`
 * —— 它成了固定定位的包含块，于是右侧栏一开，大纲导航也跟着「相对整块 pane」定位，
 * 直接压在右侧栏上（用户报障 2026-11-13）。这里把右侧栏宽度做成 CSS 变量下发，
 * 让导航自己让开这一段距离。</p>
 */
const sideRailVisible = computed(() => !!(showTracePanel.value || showStatusPanel.value));
const paneContentStyle = computed(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '--chat-side-rail-width': sideRailVisible.value ? `${railWidth.value}px` : '0px',
}));

function onRailDrag(event: MouseEvent): void {
  if (!railDragStart) return;
  const max = Math.max(320, window.innerWidth - 480);
  const next = railDragStart.width + (railDragStart.x - event.clientX);
  railWidth.value = Math.min(max, Math.max(280, next));
}

function stopRailDrag(): void {
  if (!railDragStart) return;
  railDragStart = null;
  window.removeEventListener('mousemove', onRailDrag);
  window.removeEventListener('mouseup', stopRailDrag);
  document.body.style.cursor = '';
  try {
    localStorage.setItem(RAIL_WIDTH_KEY, String(Math.round(railWidth.value)));
  } catch {
    // 写失败只是少一条宽度记忆
  }
}

function startRailDrag(event: MouseEvent): void {
  railDragStart = { x: event.clientX, width: railWidth.value };
  window.addEventListener('mousemove', onRailDrag);
  window.addEventListener('mouseup', stopRailDrag);
  document.body.style.cursor = 'col-resize';
}

onBeforeUnmount(stopRailDrag);

/**
 * 切换会话工作状态面板，并把新状态记到后台会话
 */
function toggleStatusPanel() {
  showStatusPanel.value = !showStatusPanel.value;
  persistStatusPanel();
}

/**
 * 把面板显隐写回后台会话
 *
 * 失败只告警不打断：显隐属于纯 UI 偏好，写不进去不该影响使用。
 */
function persistStatusPanel() {
  const session = mainSession.value;
  if (!session?.id) return;
  apiService
    .updateSession(session.id, {
      settings: { ...(session.settings || {}), statusPanelVisible: showStatusPanel.value },
    })
    .then(() => {
      // 本地也同步一份，避免下次切换时读到旧值
      session.settings = { ...(session.settings || {}), statusPanelVisible: showStatusPanel.value };
    })
    .catch((error: any) => {
      console.warn('[ChatPage] 会话状态面板显隐写回后台失败:', error);
    });
}

/**
 * 会话切换时按后台记录恢复面板显隐
 */
function restoreStatusPanel(session: Session | null) {
  if (!session?.id) {
    showStatusPanel.value = false;
    return;
  }
  showStatusPanel.value = Boolean(session.settings?.statusPanelVisible);
}

// 子 Agent Tab 状态
const agentTabs = ref<AgentTab[]>([
  { id: 'main', name: t('chat.panel.mainSession'), status: 'completed', loaded: true }
]);
const activeTabId = ref('main');

// 子会话列表（从主会话同步，支持动态增删）
const subSessions = ref<Session[]>([]);

/**
 * 面板当前展示的会话对象
 * - main Tab：使用 mainSession（主会话）
 * - 子 Agent Tab：从 subSessions 中查找对应的子会话
 */
const panelSession = computed(() => {
  if (activeTabId.value === 'main') {
    return mainSession.value;
  }
  // 从子会话列表中查找
  return subSessions.value.find((s) => s.id === activeTabId.value) || null;
});

/**
 * 会话是否已就绪（可挂载 ChatPanel / ChatInput）。
 *
 * <p>地址栏哈希反查是异步的（用户口径 2026-11-13）：首屏 mainSession 为 null 的
 * 窗口里若把 ChatInput 挂出来，其「模型列表就绪后无 modelId 就默认选第一个」的
 * 兜底会抢跑，并把错误模型持久化到会话（实测把 379 的 agnes 写成了
 * onnx:paddleocrv6-rec）。所以会话没加载完成前先不挂聊天面板。</p>
 */
const chatPanelReady = computed(() => !!mainSession.value);

/**
 * 处理子 Agent 创建事件（来自 SSE 全局广播）
 *
 * 仅负责新增 Tab，不管理状态。状态由 stream_started/stream_finished 统一处理。
 */
function handleSubAgentCreate(event: any) {
  const payload = event.payload || {};
  const subSessionId = payload.subSessionId;
  const name = payload.name || t('chat.panel.subTask');
  const session = payload.session;
  if (!subSessionId) return;

  const exists = agentTabs.value.find(t => t.id === subSessionId);
  if (!exists) {
    agentTabs.value.push({
      id: subSessionId,
      name,
      status: 'completed',
      loaded: false,
      avatarUrl: session?.avatarUrl || session?.character?.avatarUrl || undefined,
    });
  }

  // 同步加入 subSessions，确保 stream_started 能识别该子 Agent
  const subExists = subSessions.value.find(s => s.id === subSessionId);
  if (!subExists && session) {
    subSessions.value.push(session);
  }
}

/**
 * 处理子 Agent 关闭事件（来自 SSE 全局广播）
 */
function handleSubAgentClosed(event: any) {
  const payload = event.payload || {};
  const subSessionId = payload.subSessionId;
  if (!subSessionId) return;

  // 从 agentTabs 中移除对应的子 Agent
  const index = agentTabs.value.findIndex(t => t.id === subSessionId);
  if (index > -1) {
    agentTabs.value.splice(index, 1);
  }

  // 如果当前激活的是被关闭的子 Agent，切回主线程
  if (activeTabId.value === subSessionId) {
    activeTabId.value = 'main';
  }

  // 从 subSessions 中移除
  const subIndex = subSessions.value.findIndex(s => s.id === subSessionId);
  if (subIndex > -1) {
    subSessions.value.splice(subIndex, 1);
  }
}

/**
 * 处理流开始事件（统一的状态来源）
 *
 * 包括主会话和子 Agent 会话的流开始，根据 sessionId 匹配更新状态。
 */
function handleStreamStarted(event: any) {
  const { sessionId } = event;
  if (!sessionId) return;

  // 更新对应 Tab 状态为 running（子 Agent 按 sessionId 匹配）
  const tab = agentTabs.value.find(t => t.id === sessionId);
  if (tab) {
    tab.status = 'running';
  }
  // 主会话流开始：同步更新 main Tab 状态
  if (sessionId === mainSession.value?.id) {
    const mainTab = agentTabs.value.find(t => t.id === 'main');
    if (mainTab) mainTab.status = 'running';
  }
  // 忽略自身发起的流
  if (event.source === apiService.getClientId()) {
    return;
  }

  // 如果是主会话的流，通知 ChatPanel 订阅流
  if (sessionId === mainSession.value?.id) {
    const chatPanel = chatPanelRef.value;
    if (chatPanel && chatPanel.subscribeToActiveStream) {
      const replaceMessageId = event.payload?.replaceMessageId;
      if (replaceMessageId) {
        const messages = sessionStore.getMessages(sessionId);
        const index = messages.findIndex((m: any) => m.id === replaceMessageId);
        if (index !== -1) {
          messages.splice(index, 1);
        }
      }
      chatPanel.subscribeToActiveStream();
    }
    return;
  }


}

/**
 * 处理流结束事件（统一的状态来源）
 *
 * 根据 reason 判断子 Agent 的最终状态。
 */
function handleStreamFinished(event: any) {
  const { sessionId, payload } = event;
  if (!sessionId) return;

  // 更新对应 Tab 状态（子 Agent 按 sessionId 匹配）
  const tab = agentTabs.value.find(t => t.id === sessionId);
  if (tab) {
    const reason = payload?.reason;
    tab.status = reason === 'completed' ? 'completed' : 'error';
  }
  // 主会话流结束：同步更新 main Tab 状态
  if (sessionId === mainSession.value?.id) {
    const mainTab = agentTabs.value.find(t => t.id === 'main');
    if (mainTab) {
      const reason = payload?.reason;
      mainTab.status = reason === 'completed' ? 'completed' : 'error';
    }
  }
}

/**
 * 切换 Tab
 */
async function switchTab(tabId: string) {
  activeTabId.value = tabId;
}

/**
 * 内置浏览器按钮激活态：当前工作区正显示浏览器窗口
 */
const builtinBrowserActive = computed(() => {
  return browserWebviewStore.activeWindowId !== null
    && (tabStore.activeTabKey?.startsWith('browser:') || false);
});

/**
 * 内置浏览器（用户口径 2026-11-12 第 2 条）：只针对当前会话。
 *
 * <p>规则：本会话已经有存活的浏览器窗口 → 直接激活它；否则读本会话上次的地址，
 * 有地址就按该地址打开；两者都没有就开一张空白页，绝不加载任何演示内容。</p>
 *
 * <p>实现仍走 {@link previewUrl}：内置浏览器是工作区里的 `browser:<id>` 标签，
 * 宿主是 Electron 的 <code>&lt;webview&gt;</code>（不是 CDP）。</p>
 */
async function openBuiltinBrowser(): Promise<void> {
  if (!mainSession.value) {
    toast.warning(t('chat.panel.noActiveSession'));
    return;
  }
  const sid = String(mainSession.value.id);
  // ① 本会话已有窗口：直接切过去（工作区仍要展开，webview 的宿主在那里）
  const mine = browserWebviewStore.allWebviews.filter((wv) => String(wv.metadata?.sessionId || '') === sid);
  if (mine.length) {
    layoutStore.workspaceVisible = true;
    browserWebviewStore.setActive(mine[mine.length - 1].windowId);
    tabStore.enterPreviewMode();
    tabStore.selectTab(`browser:${mine[mine.length - 1].windowId}`);
    return;
  }
  // ② 本会话上次打开过的地址；没有就空白页
  const savedUrl = readBrowserUrl(sid);
  // 工作区关着时走独立浮层宿主，不再为了浏览器把侧栏拉出来（用户口径 2026-11-13）
  await previewUrl(savedUrl || 'about:blank', { standalone: !layoutStore.workspaceVisible });
  if (savedUrl) saveBrowserUrl(sid, savedUrl);
}

/* ===== 内置浏览器地址：按会话记忆（用户口径 2026-11-12）=====
   只记非空白地址；切会话不会串台，也不会在别的会话里自动打开上一个会话的页面。 */
const BROWSER_URL_KEY = 'ai.builtinBrowser.urlBySession';
function readBrowserUrlMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BROWSER_URL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
function readBrowserUrl(sessionId: string): string {
  const map = readBrowserUrlMap();
  const url = map[sessionId] || '';
  return /^https?:\/\//i.test(url) ? url : '';
}
function saveBrowserUrl(sessionId: string | null | undefined, url: string): void {
  if (!sessionId || !url) return;
  if (!/^https?:\/\//i.test(url)) return; // about:blank / data: 不记
  try {
    const map = readBrowserUrlMap();
    if (map[sessionId] === url) return;
    map[sessionId] = url;
    localStorage.setItem(BROWSER_URL_KEY, JSON.stringify(map));
  } catch {
    // 写失败只是少一条记忆
  }
}
/**
 * 浏览器 webview store。
 *
 * 必须在使用它之前声明：下面的 watch 会「立即求值」getter，
 * 若把 useBrowserWebviewStore() 放到文件后半段，setup 期就会撞上
 * 「Cannot access 'browserWebviewStore' before initialization」的 TDZ 错误。
 */
const browserWebviewStore = useBrowserWebviewStore();

/** 本会话内浏览器地址变化即落盘（地址栏跳转 / 页面内导航都会走这里） */
watch(
  () => browserWebviewStore.allWebviews.map((wv) => `${wv.metadata?.sessionId || ''}=${wv.url}`).join('|'),
  () => {
    const sid = mainSession.value?.id ? String(mainSession.value.id) : '';
    if (!sid) return;
    for (const wv of browserWebviewStore.allWebviews) {
      if (String(wv.metadata?.sessionId || '') === sid) saveBrowserUrl(sid, wv.url);
    }
  },
);

/**
 * 关闭子 Agent Tab
 */
function closeSubAgentTab(tabId: string) {
  const index = agentTabs.value.findIndex(t => t.id === tabId);
  if (index > -1 && tabId !== 'main') {
    agentTabs.value.splice(index, 1);
    if (activeTabId.value === tabId) {
      activeTabId.value = 'main';
    }
  }

  // 同步从 subSessions 中移除
  const subIndex = subSessions.value.findIndex(s => s.id === tabId);
  if (subIndex > -1) {
    subSessions.value.splice(subIndex, 1);
  }
}

// 组合式函数
const { toast, confirm, editText } = usePopup();
const router = useRouter();
const route = useRoute();
const title = useTitle();

// 删除会话确认对话框状态

// 主会话对象（侧边栏选中的根会话），包含会话的基本信息和设置
const mainSession: Ref<Session | null> = ref(null);

// 会话切换时同步浏览器 webview store（隐藏活跃预览，webview 不销毁）
watch(() => mainSession.value?.id, (sessionId) => {
  browserWebviewStore.setCurrentSession(sessionId || null);
});


// 判断是否为 Electron 环境
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// 会话列表组件引用，用于调用组件内部方法
// ChatPanel 组件引用，用于调用组件内部方法
const chatPanelRef = ref<InstanceType<typeof ChatPanel> | null>(null);
const paneContentRef = ref<HTMLElement | null>(null);
// 根据当前模式计算工作目录分割比例
const workspaceSize = computed(() =>
  layoutStore.workspacePreviewMode ? layoutStore.workspacePreviewSplitSize : layoutStore.workspaceSplitSize,
);

/**
 * 工作区分割宽度的「按会话记忆」。
 *
 * <p>用户口径 2026-11-12：拖拽宽度要跟着会话走 —— 一个会话里把工作区拖宽了，
 * 切到别的会话不该把那边也撑宽，切回来时宽度还得是原来那个。</p>
 *
 * <p>存 localStorage（纯本地偏好，不需要跨设备同步），键是会话 id；
 * 只记正式模式的宽度，预览模式的宽度沿用全局值。</p>
 */
const SPLIT_MEMORY_KEY = 'ai.workspaceSplit.bySession';
function readSplitMemory(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SPLIT_MEMORY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
function saveSplitMemory(sessionId: string | number | null | undefined, size: number): void {
  const key = sessionId == null ? '' : String(sessionId);
  if (!key || !Number.isFinite(size) || size <= 0) return;
  try {
    const map = readSplitMemory();
    map[key] = Math.round(size * 10) / 10;
    localStorage.setItem(SPLIT_MEMORY_KEY, JSON.stringify(map));
  } catch {
    // 隐私模式等写失败：只是少一个记忆，不影响当前布局
  }
}
/** 切换会话时把该会话上次拖出来的宽度写回 layoutStore */
watch(() => mainSession.value?.id, (sessionId) => {
  if (sessionId == null) return;
  const saved = readSplitMemory()[String(sessionId)];
  if (saved) layoutStore.setWorkspaceSplitSize(saved);
}, { immediate: true });

/* ===== 工作区悬停预览（1.2）=====
   停 300ms 才弹出（避免鼠标划过一排图标时每个都闪一下），移开后 220ms 收起；
   鼠标进到卡片里就取消收起，否则用户刚要滚动列表它就消失了。 */
const workspaceButtonRef = ref<HTMLElement | null>(null);
const workspaceHoverVisible = ref(false);
let workspaceHoverTimer: ReturnType<typeof setTimeout> | null = null;

function clearWorkspaceHoverTimer(): void {
  if (workspaceHoverTimer) {
    clearTimeout(workspaceHoverTimer);
    workspaceHoverTimer = null;
  }
}
function onWorkspaceHoverEnter(): void {
  clearWorkspaceHoverTimer();
  workspaceHoverTimer = setTimeout(() => {
    workspaceHoverVisible.value = true;
    workspaceHoverTimer = null;
  }, 300);
}
function cancelWorkspaceHoverClose(): void {
  clearWorkspaceHoverTimer();
}
function onWorkspaceHoverLeave(): void {
  clearWorkspaceHoverTimer();
  workspaceHoverTimer = setTimeout(() => {
    workspaceHoverVisible.value = false;
    workspaceHoverTimer = null;
  }, 220);
}
function openWorkspaceFromHover(): void {
  workspaceHoverVisible.value = false;
  layoutStore.workspaceVisible = true;
}
onBeforeUnmount(clearWorkspaceHoverTimer);
// 控制设置模态框的显示与隐藏
// 布局状态
const layoutStore = useLayoutStore();
// 浏览器 webview store 已在文件前半段（watch 之前）声明，避免 TDZ
const tabStore = useTabStore();

// 全屏模式下 Teleport 延迟一帧启用，避免与 pane collapse 同帧触发 moveTeleport 竞态
const teleportDisabled = ref(true);
watch(() => layoutStore.workspaceFullscreen, async (fs) => {
  if (fs) {
    await nextTick();
    teleportDisabled.value = false;
  } else {
    teleportDisabled.value = true;
  }
}, { immediate: true });

// 登录信息
const authStore = useAuthStore();
const sessionStore = useSessionStore();

// SSE 事件监听取消函数
let unsubscribeStreamStarted: (() => void) | null = null;
let unsubscribeStreamFinished: (() => void) | null = null;
let unsubscribeSubAgentCreate: (() => void) | null = null;
let unsubscribeSubAgentClosed: (() => void) | null = null;


// 业务逻辑函数

/**
 * 根据会话 ID 从 API 获取会话详情
 */
const fetchSession = async (sessionId: string) => {
  try {
    const session = await apiService.fetchSession(sessionId);
    mainSession.value = session;
    restoreStatusPanel(session);
    // 切会话时回到对话视图：轨迹页签不做记忆，避免切回旧会话直接看到一个空面板
    showTracePanel.value = false;

    // 恢复子会话 Tab：只认旧的 session.subSessions 字段。
    // 原先还会先打一次 /api/sessions/{id}/sub-sessions，但后端从未实现该端点
    // （实测直连 404），每次打开会话都稳定产生一个 404，且拿不到任何数据 ——
    // 属于「注定失败还要发」的请求，直接去掉。
    // 后端补齐后接回 sessionAgentApi.listSubSessions，契约见 services/javaApi.ts。
    let subs: any[] = (session as any).subSessions || [];
    if (!Array.isArray(subs)) subs = [];
    subSessions.value = subs as Session[];
    if (subSessions.value.length > 0) {
      // 保留 main Tab，重建子 Agent Tabs（状态以 isStreaming 为准）
      const mainTab = agentTabs.value.find(t => t.id === 'main');
      agentTabs.value = [
        mainTab || { id: 'main', name: t('chat.panel.mainSession'), status: 'completed', loaded: true },
        ...subSessions.value.map((sub) => ({
          id: sub.id,
          name: sub.title || t('chat.panel.subTask'),
          status: (sub.isStreaming ? 'running' : 'completed') as 'running' | 'completed' | 'error',
          loaded: true,
        })),
      ];
    }
  } catch (error) {
    console.error('获取会话详情失败:', error);
    toast.error(t('common.error.loadFailed'));
    goChatRoute(null);
  }
};

/**
 * 选择会话，加载会话详情
 */
const goChatRoute = async (sessionId: string | null) => {
  if (sessionId) {
    router.replace({ name: 'Chat', params: { sessionId: sessionId } });
  } else {
    router.replace({ name: 'Chat', params: { sessionId: 'new-session' } });
    mainSession.value = null;
  }
};

/**
 * 「从此处分叉」成功后跳到新会话。
 *
 * 不需要额外刷会话列表：route.params.sessionId 的 watch 会拉取新会话详情
 * 并写入 store（sessionsMap），侧边栏列表是 store 的 computed，会自动出现该会话。
 */
const handleOpenSession = async (sessionId: string) => {
  await goChatRoute(sessionId);
};



function onPaneResize() {
  // 拖拽开始时屏蔽 webview 指针事件（webview 在 MainLayout 层，不在 splitpanes scoped CSS 范围内）
  browserWebviewStore.setDragging(true);
}

function onPaneResized(size: number) {
  // 拖拽结束，恢复 webview 指针事件
  browserWebviewStore.setDragging(false);

  const el = paneContentRef.value;
  if (el) {
    el.style.width = '';
  }

  // 保存工作目录分割位置（根据当前模式分别保存）
  if (layoutStore.workspaceVisible && isElectron) {
    if (layoutStore.workspacePreviewMode) {
      layoutStore.setWorkspacePreviewSplitSize(size);
    } else {
      layoutStore.setWorkspaceSplitSize(size);
    }
    // 用户口径 2026-11-12：拖拽宽度按会话记忆，切回该会话时恢复
    saveSplitMemory(mainSession.value?.id, size);
  }
  console.log('onPaneResized', size);
}

/**
 * 根据会话 ID 更新会话信息
 * 直接更新 sessionStore 中的统一数据源
 */
const updateSessionById = async (sessionId: string, data: any) => {
  const session = sessionStore.getSession(sessionId);
  if (session) {
    // 定义需要更新的字段
    const allowedFields = ['title', 'avatar_url', 'last_message', 'created_at', 'updated_at'];

    // 只复制允许的字段并批量更新
    for (const field of allowedFields) {
      if (field in data) {
        (session as unknown as Record<string, unknown>)[field] = data[field];
      }
    }
  }
};


/**
 * 把路由参数解析成真实会话 ID。
 *
 * 地址栏现在放的是 md5(会话ID)（用户口径 2026-11-13，不暴露明文 ID）。
 * 这里用本地会话表 sessionsMap 反查；直开 URL 时侧栏列表可能还没回来，
 * 短暂等待重试；仍查不到再补拉一次完整会话列表兜底（侧栏默认只装第一页）。
 * 反查不到返回 null，调用方按「会话不存在」落回新建会话。
 */
async function resolveSessionId(routeValue: string): Promise<string | null> {
  if (!routeValue || routeValue === "new-session") return routeValue || null;
  // 兼容：仍是明文 ID（旧书签 / 内部传参）直接用
  if (!isSessionHash(routeValue)) return routeValue;
  const findByHash = (): string | null => {
    for (const s of sessionStore.sessionsMap.values()) {
      if (sessionHash(String(s.id)) === routeValue) return String(s.id);
    }
    return null;
  };
  let id = findByHash();
  if (id) return id;
  for (let i = 0; i < 12 && !id; i++) {
    await new Promise((r) => setTimeout(r, 250));
    id = findByHash();
  }
  if (id) return id;
  try {
    const data: any = await apiService.fetchSessions(0, 500, null);
    for (const s of data?.items || []) sessionStore.setSession(s);
    return findByHash();
  } catch {
    return null;
  }
}

const updateSelectedSession = async (sessionId: string) => {
  // vue-router 的可选参数直开 /chat 时给的是空串（不是 undefined），必须一并按「新建会话」处理
  if (!sessionId || sessionId === 'new-session') {
    mainSession.value = null;
    sessionStore.activeSessionId = "new-session";
    tabStore.exitPreviewMode();
    return;
  }
  // 地址栏是哈希，先反查真实 ID；拿不到就当会话不存在，回新建会话
  const realId = await resolveSessionId(sessionId);
  if (!realId) {
    toast.error(t('common.error.loadFailed'));
    goChatRoute(null);
    return;
  }
  sessionStore.activeSessionId = realId;
  if (realId !== mainSession.value?.id) {
    // 切换会话时重置子代理状态到主线程
    activeTabId.value = 'main';
    agentTabs.value = [{ id: 'main', name: t('chat.panel.mainSession'), status: 'completed', loaded: true }];
    subSessions.value = [];
    await fetchSession(realId);
  }
};


const handleCreateSessionWithMessage = async (session: any, inputMessage: any) => {
  if (!authStore.isAuthenticated)
    return;
  try {
    const response = await apiService.createSession(session)
    // 写入统一数据源，侧边栏通过响应式自动更新
    sessionStore.setSession(response)

    if (inputMessage) {
      inputMessage.isWaiting = true
      sessionStore.setInputMessage(response.id, inputMessage)
    }
    await goChatRoute(response.id);
  } catch (error) {
    console.error('创建对话失败:', error);
    toast.error(t('common.createFailed'));
  }
};
/**
 * 保存会话设置
 * 将当前会话的设置保存到服务器
 */
const handleSaveSessionSettings = async () => {
  try {
    const targetSession = panelSession.value;
    if (targetSession) {
      await apiService.updateSession(targetSession.id, {
        modelId: targetSession.modelId,
        settings: targetSession.settings,
        workspacePath: targetSession.workspacePath
      });
    }
  } catch (error: any) {
    console.error('保存对话设置失败:', error);
  }
};

/**
 * 切换角色
 * 更新会话的 characterId 并刷新本地角色信息
 */
const handleSelectCharacter = async (character: Character) => {
  if (!mainSession.value) return;
  try {
    await apiService.updateSession(mainSession.value.id, { characterId: character.id });
    mainSession.value.character = character;
    mainSession.value.characterId = character.id;
  } catch (error: any) {
    console.error('切换角色失败:', error);
    toast.error(t('common.error.operationFailed'));
  }
};

/**
 * 更多操作菜单选择处理
 */
async function handleMoreSelect(key: string) {
  switch (key) {
    case "clear":
      await clearChat();
      break;
    // case "export":
    //   exportChat();
    //   break;
    // case "import":
    //   await importChat();
    //   break;
  }
}

/**
 * 清空聊天记录
 */
async function clearChat() {
  if (!mainSession.value) {
    toast.error(t('chat.panel.noActiveSession'));
    return;
  }

  if (await confirm(t('chat.panel.clearChatTitle'), t('chat.panel.clearChatDesc'))) {
    try {
      await apiService.clearSessionMessages(mainSession.value.id);
      sessionStore.clearSessionMessages(mainSession.value.id);
      // 重新加载消息列表
      const chatPanel = chatPanelRef.value;
      if (chatPanel && chatPanel.loadMessages) {
        chatPanel.loadMessages(mainSession.value.id);
      }
      toast.success(t('common.operationSuccess'));
    } catch (error) {
      console.error('清空聊天记录失败:', error);
      toast.error(t('common.error.operationFailed'));
    }
  }
}



/**
 * 处理滚动到指定消息
 */
function handleScrollToMessage(messageId: string) {
  const chatPanel = chatPanelRef.value;
  if (chatPanel && chatPanel.scrollToMessage) {
    chatPanel.scrollToMessage(messageId);
  }
}

/**
 * 将路径插入到聊天输入框光标处
 */
function handleInsertToInput(path: string) {
  const chatPanel = chatPanelRef.value;
  if (chatPanel && chatPanel.insertText) {
    chatPanel.insertText(path);
  }
}

/**
 * 将选区 snip 徽标插入到聊天输入框
 */
function handleInsertSnip(data: any) {
  const chatPanel = chatPanelRef.value;
  if (chatPanel && chatPanel.insertBadge) {
    chatPanel.insertBadge(data);
  }
}

// 监听器

// 监听当前会话的变化，更新页面标题
watch(
  () => mainSession,
  (session) => {
    if (session.value) {
      title.value = `${session.value.title}-${t('chat.panel.mainSession')}`;
      updateSessionById(session.value.id, session.value);
    }
  },
  { deep: true }
);

// 监听路由参数中会话 ID 的变化，更新选中的会话
watch(
  () => route.params.sessionId,
  async (newSessionId) => {
    if (!newSessionId) {
      mainSession.value = null;
      goChatRoute(null);
      return;
    }
    const sessionId = Array.isArray(newSessionId) ? newSessionId[0] : newSessionId;
    await updateSelectedSession(sessionId);
  }
);

// 生命周期
onMounted(async () => {
  const sessionId = Array.isArray(route.params.sessionId) ? route.params.sessionId[0] : route.params.sessionId;

  await updateSelectedSession(sessionId);

  // 注册流事件监听（统一的状态来源）
  unsubscribeStreamStarted = apiService.onSessionEvent('stream_started', handleStreamStarted);
  unsubscribeStreamFinished = apiService.onSessionEvent('stream_finished', handleStreamFinished);

  // 注册子 Agent 生命周期事件监听（仅负责增删 Tab）
  unsubscribeSubAgentCreate = apiService.onSessionEvent('sub_agent_create', handleSubAgentCreate);
  unsubscribeSubAgentClosed = apiService.onSessionEvent('sub_agent_closed', handleSubAgentClosed);
});

// 工作目录隐藏时重置预览模式和全屏状态
watch(() => layoutStore.workspaceVisible, (visible) => {
  if (!visible) {
    tabStore.exitPreviewMode();
    layoutStore.workspaceFullscreen = false;
  }
});

// 组件卸载时取消监听
onUnmounted(() => {
  if (unsubscribeStreamStarted) {
    unsubscribeStreamStarted();
    unsubscribeStreamStarted = null;
  }
  if (unsubscribeStreamFinished) {
    unsubscribeStreamFinished();
    unsubscribeStreamFinished = null;
  }
  if (unsubscribeSubAgentCreate) {
    unsubscribeSubAgentCreate();
    unsubscribeSubAgentCreate = null;
  }
  if (unsubscribeSubAgentClosed) {
    unsubscribeSubAgentClosed();
    unsubscribeSubAgentClosed = null;
  }
  // 清理当前会话标记：currentSessionId 表示"用户正在看的会话"，
  // 离开聊天页后不应再命中自动预览等基于该状态的条件
  browserWebviewStore.setCurrentSession(null);
});


</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Splitpanes 自定义样式 - 适配暗色模式 */
:deep(.splitpanes.default-theme .splitpanes__pane) {
  background-color: transparent;
}

:deep(.splitpanes.default-theme .splitpanes__splitter) {
  background-color: var(--el-bg-color);
  position: relative;
  transition: background-color 0.2s ease;
}

:deep(.dark .splitpanes.default-theme .splitpanes__splitter) {
  background-color: var(--el-bg-color);
}

/* 悬停时显示主题色（中等浅色） */
:deep(.splitpanes.default-theme .splitpanes__splitter:hover) {
  background-color: var(--el-color-primary-light-8) !important;
}

/* 移除 Pane 的边框，避免与分割线重叠 */
:deep(.splitpanes.default-theme .splitpanes__pane) {
  background-color: transparent;
  border: none !important;
}

/* 隐藏悬停指示器 */
:deep(.splitpanes.default-theme .splitpanes__splitter:before),
:deep(.splitpanes.default-theme .splitpanes__splitter:after) {
  display: none !important;
}

:deep(.splitpanes.default-theme.splitpanes--vertical .splitpanes__splitter) {
  border-top: 0;
  border-bottom: 0;
  width: 4px !important;
}

/* Splitpanes 过渡动画 */
:deep(.splitpanes__pane) {
  /* transition: width 0.3s ease-out, height 0.3s ease-out; */
  transition: none !important;
  will-change: width;
}

.chat-pane-content {
  contain: layout style;
  /* 底色统一由外层 .chat-page-root 铺，这里保持透明：
     两层都铺会让 color-mix 的半透明叠两次，壁纸透明度设置就不准了。 */
}

/* 消息区最小可用宽度：与 .session-status-panel 的 min-width:150px 配套。
   1024 视口 + 会话工作状态面板打开时，两列合计仍装得下（240 + 177），
   模型 chip（150px）不再被 .chat-panel-container 的 overflow:hidden 裁掉；
   宽视口下消息区本来就更宽，这条 min-width 不会生效，无回归。 */
.chat-panel-container {
  min-width: 240px;
}

/* 对话区底色（默认主题 + 浅色时为白）：标题栏、消息列、输入框都落在这块面上。
   1. 用 --color-chat-bg 而不是 --color-bg —— 后者同时被 html 背景与壁纸透明层使用，
      改它会把整页外壳一起刷白，侧边栏与内容区的层次就没了；
   2. 与 .content-clear-wallpaper 同样乘 --content-opacity，带壁纸时按用户的
      「内容区透明度」设置透出壁纸，不铺一块不透明白把壁纸盖掉；
   3. 放在根节点而不是 .chat-pane-content：新建会话页没有 ChatPanel，
      只有根节点能同时覆盖「会话」与「新建对话」两种状态，切过去不会跳色。 */
.chat-page-root {
  background: color-mix(
    in srgb,
    var(--color-chat-bg, var(--color-bg)) calc(var(--content-opacity, 1) * 100%),
    transparent
  );
}

/* 动效降级：系统开启「减少动态效果」时，路由切换的滑入滑出不再位移。
   逐个列出，不写 `*` / `.chat-pane-content *` 通配，避免掐掉内部组件的合法过渡。
   .slide-right-*-to 的终态（位移+透明）本身就是静态样式，关掉过渡不影响进出结果。 */
@media (prefers-reduced-motion: reduce) {
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: none;
  }

  /* splitpanes 是三方组件、分隔线的 hover 底色过渡在它自己的 DOM 上，
     必须用 :deep() 才够得到；只关这一个属性，不动面板宽度等布局样式。 */
  :deep(.splitpanes.default-theme .splitpanes__splitter) {
    transition: none;
  }
}

/* 键盘焦点可见性：.header-icon-btn 是带 @click 的 div（不是可聚焦控件），
   浏览器不给默认焦点环。指针样式由 PageHeader 的全局样式提供，这里不重复写。 */
.header-icon-btn {
  outline: none;
}

.header-icon-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 会话标题 + 右侧更多（用户口径 2026-11-13） */
.chat-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chat-title-more {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 2px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.chat-title-more:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.chat-title-more[aria-expanded='true'] {
  background: var(--el-fill-color);
}

.session-menu {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px;
}

.session-menu__item {
  width: 100%;
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
}

.session-menu__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.session-menu__item.is-danger {
  color: var(--el-color-danger);
}

/* 右侧栏（执行轨迹 + 会话状态，用户口径 2026-11-13）：
   两个面板竖排可同时打开；左边缘是一条拖拽热区，宽度按像素记忆。 */
.chat-side-rail {
  position: relative;
  flex: none;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 280px;
  overflow: hidden;
  border-left: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}

.chat-side-rail__splitter {
  position: absolute;
  left: -3px;
  top: 0;
  bottom: 0;
  width: 7px;
  z-index: 6;
  cursor: col-resize;
}

.chat-side-rail__splitter::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: transparent;
  transition: background-color 0.15s ease;
}

.chat-side-rail__splitter:hover::after {
  background: var(--el-color-primary);
}

/* 轨迹占上半区；状态面板占下半区，各自滚动，不互相撑高 */
.chat-side-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  border-left: none;
  background: transparent;
}

.chat-side-rail > :deep(.chat-side-panel--status) {
  flex: 0 1 42%;
  max-height: 55%;
  width: 100%;
  border-left: none;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 轨迹面板内部自带底色，覆盖成侧栏底色，避免与相邻面板出现色带 */
.chat-side-panel--trace :deep(.trace-panel) {
  background: transparent;
  width: 100%;
}
</style>

<style>
/* LDialog scoped styles handle dialog body/header/footer — no global overrides needed */

/* 工作目录删除警告弹窗样式 */
.workspace-delete-warning {
  max-width: 500px !important;
}

.workspace-delete-warning .el-message-box__message p,
.workspace-delete-warning .el-message-box__message {
  white-space: normal !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.6 !important;
  text-align: left !important;
  max-width: 100% !important;
}
</style>
