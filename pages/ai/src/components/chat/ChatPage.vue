<template>
  <!-- 主体内容（侧边栏已移至 MainLayout） -->
  <div class="chat-page-root flex flex-col h-full w-full" data-page="chat">
    <template v-if="sessionStore.activeSessionId !== 'new-session'">
      <!-- 可拖拽分割区域 -->
      <div class="flex-1 overflow-hidden">
        <LiteSplitpanes :split-size="layoutStore.workspaceFullscreen ? 0 : (layoutStore.workspaceVisible ? workspaceSize : 100)"
          :min-size="layoutStore.workspaceFullscreen ? 0 : 30" :max-size="85" :min-pane2-size="320" @resize="onPaneResize" @resized="onPaneResized">
          <template #pane1>
            <div ref="paneContentRef" class="chat-pane-content"
              style="height: 100%; display: flex; flex-direction: column;">
              <!-- 页面标题栏 -->
              <PageHeader :title="mainSession?.title || ''" :hide-window-controls="layoutStore.workspaceVisible">
                <template #actions>
                  <!-- 工作目录切换 -->
                  <LTooltip v-if="mainSession?.id" :content="layoutStore.workspaceVisible ? t('chat.header.closeWorkspace') : t('chat.header.openWorkspace')" placement="bottom">
                  <div class="header-icon-btn" :class="{ active: layoutStore.workspaceVisible }" role="button" tabindex="0"
                    :aria-label="layoutStore.workspaceVisible ? t('chat.header.closeWorkspace') : t('chat.header.openWorkspace')"
                    :aria-pressed="layoutStore.workspaceVisible"
                    @click="layoutStore.toggleWorkspace()"
                    @keydown.enter.prevent="layoutStore.toggleWorkspace()"
                    @keydown.space.prevent="layoutStore.toggleWorkspace()">
                    <PanelRightExpand20Filled class="w-5 h-5" />
                  </div>
                  </LTooltip>
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
                  <!-- 内置浏览器：点开工作区（内含浏览器标签），不再加载写死的演示页 -->
                  <LTooltip v-if="mainSession?.id" content="打开工作区与内置浏览器" placement="bottom">
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
                  <!-- 执行轨迹：与对话互斥，占满主区域 -->
                  <TracePanel v-if="showTracePanel && mainSession" :session-id="mainSession.id"
                    @close="showTracePanel = false" />

                  <template v-else>
                    <!-- 会话面板：主会话和子 Agent 共用同一个 ChatPanel，通过 session 切换 -->
                    <!-- 全屏模式下 ChatPanel 通过 Teleport 搬至浮动容器 -->
                    <Teleport :disabled="teleportDisabled" to="#floating-chat">
                      <ChatPanel ref="chatPanelRef" :session="panelSession" :readonly="activeTabId !== 'main'"
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
                  </template>
                </div>

                <!-- 会话工作状态面板 -->
                <SessionStatusPanel
                  v-if="showStatusPanel && mainSession && !showTracePanel"
                  :session-id="mainSession.id"
                  :messages="chatPanelRef?.activeMessages || []"
                  @close="showStatusPanel = false"
                />
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
import { ref, onMounted, onUnmounted, watch, computed, nextTick, defineAsyncComponent, type Ref } from "vue";
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


const ChatOutline = defineAsyncComponent(() => import("./ChatOutline.vue"));
const WorkspaceSidebar = defineAsyncComponent(() => import("./workspace/WorkspaceSidebar.vue"));
const SessionStatusPanel = defineAsyncComponent(() => import("./SessionStatusPanel.vue"));
const TracePanel = defineAsyncComponent(() => import("./trace/TracePanel.vue"));

// 轨迹页签：与「对话」互斥切换主区域。
// 不像工作状态面板那样按会话记忆——轨迹是每次运行后才有意义的内容，
// 记住上次的开合只会让人切回旧会话时莫名其妙看到一个空面板。
const showTracePanel = ref(false);

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
  showTracePanel.value = true;
}

// 会话工作状态面板显示状态
// 显隐按会话记忆：写在后台会话 settings.statusPanelVisible（PUT /v2/sessions/{id}），
// 刷新页面或切走再回来都保持上次的开合，不像 localStorage 那样全局共用一个开关。
const showStatusPanel = ref(false);

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
 * 打开内置浏览器：按需求不再加载写死的「鹈鹕骑车」data URL 演示页，
 * 只把工作区展开并回到目录视图 —— 浏览器标签由工作区内按需创建。
 *
 * 原先 previewUrl(buildPelicanBikeUrl()) 每次都新建一张内嵌浏览器标签并挂上
 * 一份内联 SVG 动画，与会话内容无关，且会强制把工作区带出来（用户报障 3 / 3.1）。
 */
async function openBuiltinBrowser(): Promise<void> {
  if (!mainSession.value) {
    toast.warning(t('chat.panel.noActiveSession'));
    return;
  }
  layoutStore.workspaceVisible = true;
  tabStore.exitPreviewMode();
}

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
const { toast, confirm } = usePopup();
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
// 控制设置模态框的显示与隐藏
// 布局状态
const layoutStore = useLayoutStore();
// 浏览器 webview store（会话切换时同步当前会话 ID）
const browserWebviewStore = useBrowserWebviewStore();
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


const updateSelectedSession = async (sessionId: string) => {
  // vue-router 的可选参数直开 /chat 时给的是空串（不是 undefined），必须一并按「新建会话」处理
  if (!sessionId || sessionId === 'new-session') {
    mainSession.value = null;
    sessionStore.activeSessionId = "new-session";
    tabStore.exitPreviewMode();
    return;
  }
  sessionStore.activeSessionId = sessionId;
  if (sessionId !== mainSession.value?.id) {
    // 切换会话时重置子代理状态到主线程
    activeTabId.value = 'main';
    agentTabs.value = [{ id: 'main', name: t('chat.panel.mainSession'), status: 'completed', loaded: true }];
    subSessions.value = [];
    await fetchSession(sessionId);
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
