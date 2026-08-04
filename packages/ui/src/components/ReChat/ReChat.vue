<template>
  <div class="re-chat">
    <!-- 左侧历史会话列表（element-plus-x Conversations） -->
    <aside :class="['re-chat__history', { collapsed: historyCollapsed }]">
      <!-- 顶部：搜索框 -->
      <div class="re-chat__history-search">
        <el-input
          v-model="searchText"
          :prefix-icon="SearchIcon"
          placeholder="搜索会话"
          clearable
        />
      </div>

      <!-- 顶部固定菜单：新对话 / 技能 / 扩展菜单 -->
      <div class="re-chat__history-menu">
        <div
          class="re-chat__menu-item"
          :class="{ 'is-active': activeView === 'chat' && !activeSkill }"
          @click="startNewChat"
        >
          <el-icon><Plus /></el-icon>
          <span>新对话</span>
        </div>
        <div
          class="re-chat__menu-item"
          :class="{ 'is-active': activeView === 'skills' || !!activeSkill }"
          @click="openSkills"
        >
          <el-icon><Lightning /></el-icon>
          <span>技能</span>
        </div>
        <div
          v-for="menu in props.menus"
          :key="menu.key"
          class="re-chat__menu-item"
          @click="onMenuClick(menu)"
        >
          <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
          <span>{{ menu.label }}</span>
        </div>
      </div>

      <!-- 批量删除操作栏（固定顶部） -->
      <div v-if="batchDeleteMode" class="re-chat__batch-bar">
        <span class="re-chat__batch-count">已选 {{ selectedIds.size }} 项</span>
        <el-checkbox :model-value="allSelected" @change="toggleAll">全选</el-checkbox>
        <div class="re-chat__batch-ops">
          <el-button type="danger" size="small" @click="confirmBatchDelete">删除</el-button>
          <el-button size="small" @click="exitBatchDelete">取消</el-button>
        </div>
      </div>

      <!-- 下半区：历史对话列表（动态滚动） -->
      <div class="re-chat__history-body">
        <div class="re-chat__section-title">历史对话</div>
        <Conversations
          v-model:active="activeSessionKey"
          :items="filteredSessionItems"
          :label-max-width="150"
          :show-tooltip="true"
          :groupable="{ sort: groupSort }"
          row-key="id"
          :menu="conversationMenu"
          @change="onSessionChange"
          @menu-command="onSessionMenuCommand"
        >
          <template #groupTitle="{ group }">
            <span class="re-chat__group-title">{{ group.title }}</span>
          </template>
          <template #label="{ item }">
            <div class="re-chat__item-label">
              <el-checkbox
                v-if="batchDeleteMode"
                :model-value="selectedIds.has(Number(item.id))"
                @click.stop
                @change="(v: boolean | string | number) => onToggleSelect(Number(item.id), !!v)"
              />
              <span class="re-chat__item-icon">
                <el-icon><Top v-if="item.pinned" /><ChatDotRound v-else /></el-icon>
              </span>
              <span
                class="re-chat__item-label-text"
                :class="{ 'is-selected': selectedIds.has(Number(item.id)) }"
              >{{ item.label }}</span>
            </div>
          </template>
        </Conversations>
      </div>

      <!-- 底部：折叠开关 -->
      <div class="re-chat__history-footer">
        <div class="re-chat__collapse-btn" @click="historyCollapsed = !historyCollapsed">
          <el-icon>
            <Fold v-if="!historyCollapsed" />
            <Expand v-else />
          </el-icon>
          <span v-if="!historyCollapsed">收起侧边栏</span>
        </div>
      </div>
    </aside>

    <!-- 收缩开关（折叠时显示） -->
    <div v-if="historyCollapsed" class="re-chat__history-toggle" @click="historyCollapsed = false">
      <el-icon><Expand /></el-icon>
    </div>

    <!-- 右侧：聊天区 / 技能中心 -->
    <main class="re-chat__main">
      <!-- 聊天视图 -->
      <template v-if="activeView === 'chat'">
        <div class="re-chat__panel">
          <BubbleList
            :list="bubbleItems"
            :auto-scroll="true"
          />
        </div>
        <div class="re-chat__input">
          <XSender
            ref="senderRef"
            :placeholder="placeholder"
            :loading="loading"
            :disabled="loading"
            variant="updown"
            submit-type="enter"
            @change="onSenderChange"
            @submit="onSubmit"
          >
            <!-- 下层左侧：深度思考 / 智能搜索 -->
            <template #prefix>
              <div class="re-chat__tool-row">
                <button
                  class="re-chat__toggle-btn"
                  :class="{ 'is-active': thinkEnabled }"
                  type="button"
                  @click="thinkEnabled = !thinkEnabled"
                >
                  <el-icon><Lightning /></el-icon>
                  <span>深度思考</span>
                </button>
                <button
                  class="re-chat__toggle-btn"
                  :class="{ 'is-active': searchEnabled }"
                  type="button"
                  @click="searchEnabled = !searchEnabled"
                >
                  <el-icon><SearchIcon /></el-icon>
                  <span>智能搜索</span>
                </button>
              </div>
            </template>
            <!-- 下层右侧：话筒 + 圆形发送按钮 -->
            <template #action-list>
              <div class="re-chat__input-right">
                <el-tooltip content="语音输入" placement="top">
                  <button class="re-chat__mini-btn" type="button" @click="onToolClick('voice')">
                    <el-icon><Microphone /></el-icon>
                  </button>
                </el-tooltip>
                <button
                  class="re-chat__send-btn"
                  type="button"
                  :class="{ 'is-loading': loading, 'is-empty': !loading && inputEmpty }"
                  :disabled="!loading && inputEmpty"
                  :title="loading ? '停止生成' : '发送'"
                  @click="loading ? stop() : onSubmit()"
                >
                  <el-icon v-if="loading" class="is-loading-icon"><Loading /></el-icon>
                  <el-icon v-else><Top /></el-icon>
                </button>
              </div>
            </template>
          </XSender>
        </div>
      </template>

      <!-- 技能中心视图 -->
      <template v-else>
        <div class="re-chat__skills-center">
          <div class="re-chat__skills-header">
            <div class="re-chat__skills-head-left">
              <el-tooltip content="返回对话" placement="bottom">
                <div class="re-chat__skills-back" @click="backToChat">
                  <el-icon><Back /></el-icon>
                </div>
              </el-tooltip>
              <div>
                <div class="re-chat__skills-title-lg">技能中心</div>
                <div class="re-chat__skills-sub">安装并启用技能，为对话赋予专业能力</div>
              </div>
            </div>
          </div>
          <div class="re-chat__skills-grid">
            <div
              v-for="skill in skills"
              :key="skill.key"
              class="re-chat__skill-card"
              :class="{ 'is-installed': installedSkills.has(skill.key), 'is-active': activeSkill?.key === skill.key }"
            >
              <div class="re-chat__skill-card-icon">
                <el-icon><component :is="skill.icon" /></el-icon>
              </div>
              <div class="re-chat__skill-card-body">
                <div class="re-chat__skill-card-name">{{ skill.label }}</div>
                <div class="re-chat__skill-card-desc">{{ skill.description }}</div>
              </div>
              <div class="re-chat__skill-card-actions">
                <template v-if="installedSkills.has(skill.key)">
                  <el-button
                    v-if="activeSkill?.key === skill.key"
                    type="primary"
                    size="small"
                    plain
                    @click="activeSkill = null"
                  >停用</el-button>
                  <el-button v-else type="primary" size="small" @click="installSkill(skill)">启用</el-button>
                </template>
                <el-button v-else size="small" @click="installSkill(skill)">安装</el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * ReChat —— 基于 element-plus-x 的 AI 对话组件
 *
 * 支持：
 *  - 多会话历史（左侧 Conversations 会话列表，可收缩）
 *  - OpenAI / Spring AI 双协议 SSE 流式
 *  - 上下文窗口（contextSize）、模型列表、系统提示词
 *  - 未登录时以浏览器指纹作为匿名用户 ID
 *
 *   <ReChat
 *     :url="'/v1/chat/completions'"
 *     :models="[{ label: 'GPT-4', value: 'gpt-4' }]"
 *     :context-size="20"
 *     :system-prompt="'你是一个助手'"
 *   />
 */
import { ref, computed, watch, onUnmounted, markRaw, nextTick } from 'vue';
import {
  Plus,
  Fold,
  Expand,
  Search as SearchIcon,
  MagicStick,
  ChatDotRound,
  Lightning,
  Back,
  Top,
  Edit,
  Delete,
  DeleteFilled,
  Microphone,
  Loading,
} from '@element-plus/icons-vue';
import { Conversations, BubbleList, XSender } from 'vue-element-plus-x';
import 'vue-element-plus-x/styles/index.css';
import { createOpenAiSseClient, createSpringAiSseClient } from '@repo/utils/sse';
import { getUserInfo, ensureFingerprint } from '@repo/utils';
import type { SseClient, OpenAiChunk, SpringAiChunk } from '@repo/utils/types';

defineOptions({ name: 'ReChat' });

/** 会话消息 */
interface ChatMessage {
  id: string;
  content: string;
  isSelf: boolean;
  time: Date;
  status: 'sent' | 'streaming';
}

/** 模型选项 */
interface ChatModel {
  label: string;
  value: string;
  description?: string;
}

/** 顶部扩展菜单项 */
interface ExtraMenu {
  key: string;
  label: string;
  icon?: unknown;
  onClick?: (menu: ExtraMenu) => void;
}

interface Props {
  /** SSE 接口地址（必填） */
  url: string;
  /** 兼容旧名 api-url */
  apiUrl?: string;
  /** 协议格式 */
  protocol?: 'openai' | 'spring-ai';
  /** 当前模型 value */
  model?: string;
  /** 可用模型列表 */
  models?: ChatModel[];
  /** 系统提示词 */
  systemPrompt?: string;
  /** 采样温度 */
  temperature?: number;
  /** 上下文消息数（发往后端的历史条数） */
  contextSize?: number;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 用户 ID */
  userId?: string;
  /** 会话 ID（单会话模式） */
  conversationId?: string;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 输入占位符 */
  placeholder?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 顶部扩展菜单（追加到「新对话」「技能」之后），点击回调返回菜单项 */
  menus?: ExtraMenu[];
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: undefined,
  protocol: 'openai',
  model: undefined,
  models: () => [],
  systemPrompt: undefined,
  temperature: 0.7,
  contextSize: 20,
  headers: () => ({}),
  userId: undefined,
  conversationId: undefined,
  showAvatar: true,
  placeholder: '发消息或按住空格说话...',
  emptyText: '开始新的对话吧',
  menus: () => [],
});

const emit = defineEmits<{
  (e: 'send', message: ChatMessage): void;
  (e: 'receive', content: string, fullContent: string): void;
  (e: 'complete', message: ChatMessage): void;
  (e: 'error', error: unknown): void;
  /** 顶部扩展菜单点击 */
  (e: 'menu-click', menu: ExtraMenu): void;
  /** 输入框内迷你按钮点击（当前仅「语音」） */
  (e: 'tool-click', tool: string): void;
}>();

/** 实际请求地址 */
const endpoint = computed(() => props.apiUrl ?? props.url);

/* ==================== 历史会话 ==================== */

interface Session {
  id: number;
  title: string;
  /** 是否置顶 */
  pinned: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后活跃时间（用于时间分组） */
  updatedAt: Date;
}

/** 技能项 */
interface Skill {
  key: string;
  label: string;
  icon: unknown;
  description: string;
  prompt: string;
}

const historyCollapsed = ref(false);
const sessions = ref<Session[]>([]);
const currentId = ref<number>(0);
const loading = ref(false);

/** 会话搜索关键字 */
const searchText = ref('');
/** 右侧视图：chat=聊天 / skills=技能中心 */
const activeView = ref<'chat' | 'skills'>('chat');
/** 当前选中的技能 */
const activeSkill = ref<Skill | null>(null);
/** 已安装技能 key 集合 */
const installedSkills = ref<Set<string>>(new Set());
/** 技能列表 */
const skills: Skill[] = [
  { key: 'general', label: '通用助手', icon: MagicStick, description: '日常问答、闲聊、通用任务', prompt: '你是一个乐于助人的 AI 助手。' },
  { key: 'translate', label: '翻译助手', icon: ChatDotRound, description: '中英互译、多语言翻译', prompt: '你是一个专业的翻译助手，将用户输入翻译成英文。' },
  { key: 'code', label: '代码助手', icon: Lightning, description: '编程答疑、代码生成与审查', prompt: '你是一个资深程序员，帮助用户解决编程问题。' },
];

/** XSender 实例引用（该组件无 modelValue，需通过实例方法读取输入内容） */
const senderRef = ref<InstanceType<typeof XSender> | null>(null);
/** 输入文本（由 @change 同步，用于发送按钮禁用态判断） */
const inputText = ref('');
/** 输入是否为空 */
const inputEmpty = computed(() => !inputText.value.trim());
/** 深度思考开关 */
const thinkEnabled = ref(false);
/** 智能搜索开关 */
const searchEnabled = ref(false);

/** @change：同步 XSender 最新输入文本 */
function onSenderChange() {
  inputText.value = senderRef.value?.getModelValue()?.text ?? '';
}

/** 各会话消息缓存：sessionId -> ChatMessage[]（ref 包裹，保证响应式） */
const sessionMessages = ref(new Map<number, ChatMessage[]>());
let seed = 0;
let currentClient: SseClient | null = null;

const currentMessages = computed<ChatMessage[]>(() => sessionMessages.value.get(currentId.value) ?? []);

/** Conversations 当前激活会话 key */
const activeSessionKey = computed<string | number | undefined>(() =>
  sessions.value.some((s) => s.id === currentId.value) ? currentId.value : undefined,
);

/* ===== 会话分组（置顶 / 今天 / 昨天 / 近 7 天 / 近 30 天 / 更早） ===== */

const DAY = 24 * 60 * 60 * 1000;

/** 分组标题（用于 groupable 排序） */
function groupOf(s: Session): string {
  if (s.pinned) return '置顶';
  const t = s.updatedAt.getTime();
  const now = Date.now();
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  if (t >= startOfToday) return '今天';
  if (t >= startOfToday - DAY) return '昨天';
  if (t >= startOfToday - 7 * DAY) return '近 7 天';
  if (t >= startOfToday - 30 * DAY) return '近 30 天';
  return '更早';
}

/** 分组排序：置顶 > 今天 > 昨天 > 近 7 天 > 近 30 天 > 更早 */
function groupSort(a: string, b: string) {
  const order = ['置顶', '今天', '昨天', '近 7 天', '近 30 天', '更早'];
  return order.indexOf(a) - order.indexOf(b);
}

/** 会话项列表（过滤搜索 + 分组） */
const filteredSessionItems = computed(() =>
  sessions.value
    .filter((s) => !searchText.value || s.title.toLowerCase().includes(searchText.value.trim().toLowerCase()))
    .map((s) => ({
      id: s.id,
      label: s.title,
      pinned: s.pinned,
      group: groupOf(s),
    })),
);

/** Conversations 自定义菜单：置顶 / 重命名 / 删除 / 批量删除 */
const conversationMenu = computed(() => [
  { label: activeSessionPinned ? '取消置顶' : '置顶', key: 'pin', icon: markRaw(Top), command: 'pin' },
  { label: '重命名', key: 'rename', icon: markRaw(Edit), command: 'rename' },
  { label: '删除', key: 'delete', icon: markRaw(Delete), command: 'delete' },
  { label: '批量删除', key: 'batch-delete', icon: markRaw(DeleteFilled), command: 'batch-delete', divided: true },
]);

/** 当前激活会话是否置顶 */
const activeSessionPinned = computed(() => {
  const cur = sessions.value.find((s) => s.id === currentId.value);
  return cur?.pinned ?? false;
});

/* ===== 批量删除模式 ===== */

const batchDeleteMode = ref(false);
const selectedIds = ref<Set<number>>(new Set());

/** 是否全部选中（基于过滤后的列表） */
const allSelected = computed(() => {
  const ids = filteredSessionItems.value.map((i) => i.id as number);
  return ids.length > 0 && ids.every((id) => selectedIds.value.has(id));
});

function enterBatchDelete() {
  batchDeleteMode.value = true;
  selectedIds.value = new Set();
}

function exitBatchDelete() {
  batchDeleteMode.value = false;
  selectedIds.value = new Set();
}

function onToggleSelect(id: number, checked: boolean) {
  const next = new Set(selectedIds.value);
  if (checked) {
    next.add(id);
  } else {
    next.delete(id);
  }
  selectedIds.value = next;
}

function toggleAll(checked: boolean) {
  const next = new Set<number>();
  if (checked) {
    filteredSessionItems.value.forEach((i) => next.add(i.id as number));
  }
  selectedIds.value = next;
}

function confirmBatchDelete() {
  selectedIds.value.forEach((id) => {
    const index = sessions.value.findIndex((s) => s.id === id);
    if (index !== -1) {
      sessions.value.splice(index, 1);
      sessionMessages.value.delete(id);
    }
  });
  if (currentId.value !== 0 && !sessions.value.some((s) => s.id === currentId.value)) {
    currentId.value = sessions.value[0]?.id ?? 0;
  }
  exitBatchDelete();
}

/** 打开技能中心（右侧切换视图） */
function openSkills() {
  activeView.value = 'skills';
}

/** 安装技能 */
function installSkill(skill: Skill) {
  installedSkills.value = new Set(installedSkills.value).add(skill.key);
  activeSkill.value = skill;
}

/** 卸载技能 */
function uninstallSkill(skill: Skill) {
  const next = new Set(installedSkills.value);
  next.delete(skill.key);
  installedSkills.value = next;
  if (activeSkill.value?.key === skill.key) {
    activeSkill.value = null;
  }
}

/** 顶部扩展菜单点击：优先 prop 回调，否则 emit 给父组件 */
function onMenuClick(menu: ExtraMenu) {
  menu.onClick?.(menu);
  emit('menu-click', menu);
}

/** 返回聊天视图 */
function backToChat() {
  activeView.value = 'chat';
}

/** 输入框内迷你按钮点击（当前仅「附件」），交由父组件处理上传等逻辑 */
function onToolClick(tool: string) {
  emit('tool-click', tool);
}

/** BubbleList 消息项（element-plus-x 格式） */
const bubbleItems = computed(() =>
  currentMessages.value.map((m) => ({
    id: m.id,
    role: m.isSelf ? ('user' as const) : ('assistant' as const),
    placement: m.isSelf ? ('end' as const) : ('start' as const),
    content: m.content,
    loading: m.status === 'streaming' && !m.isSelf,
    shape: 'corner' as const,
    variant: m.isSelf ? ('filled' as const) : ('outlined' as const),
  })),
);

function startNewChat() {
  const id = ++seed;
  const now = new Date();
  sessions.value.push({ id, title: `新会话 ${id}`, pinned: false, createdAt: now, updatedAt: now });
  currentId.value = id;
  sessionMessages.value.set(id, []);
}

function switchSession(id: number) {
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
  currentId.value = id;
  loading.value = false;
}

/** Conversations @change：切换会话 */
function onSessionChange(item: { id?: number } & Record<string, unknown>) {
  const id = Number(item?.id);
  if (Number.isFinite(id)) {
    switchSession(id);
    const target = sessions.value.find((s) => s.id === id);
    if (target) {
      target.updatedAt = new Date();
    }
  }
}

/** Conversations 自定义菜单：pin / rename / delete / batch-delete */
function onSessionMenuCommand(command: unknown, item: { id?: number; label?: string }) {
  const id = Number(item?.id);
  if (command === 'batch-delete') {
    enterBatchDelete();
    return;
  }
  if (!Number.isFinite(id)) return;
  if (command === 'pin') {
    const target = sessions.value.find((s) => s.id === id);
    if (target) {
      target.pinned = !target.pinned;
    }
  } else if (command === 'delete') {
    const index = sessions.value.findIndex((s) => s.id === id);
    if (index !== -1) {
      sessions.value.splice(index, 1);
      sessionMessages.value.delete(id);
    }
    if (currentId.value === id) {
      const next = sessions.value[0];
      currentId.value = next?.id ?? 0;
    }
  } else if (command === 'rename') {
    const target = sessions.value.find((s) => s.id === id);
    if (target) {
      target.title = prompt('请输入新会话名称', target.title) ?? target.title;
    }
  }
}

/* ==================== 发送 & 流式 ==================== */

/**
 * 解析当前用户 ID：
 *  1. 显式传入的 props.userId 优先
 *  2. 已登录：取框架存储的 userInfo 标识（id / userId / userExtId / username）
 *  3. 未登录：用浏览器指纹作为匿名用户 ID（持久化，同一浏览器保持一致）
 */
async function resolveUserId(): Promise<string | undefined> {
  const explicit = props.userId;
  if (explicit) return explicit;

  const info = getUserInfo<Record<string, unknown>>();
  if (info) {
    const id = info.id ?? info.userId ?? info.userExtId ?? info.username;
    if (id != null) return String(id);
  }

  try {
    return await ensureFingerprint();
  } catch {
    return undefined;
  }
}

function onSubmit() {
  const text = inputModel.value?.text ?? '';
  void sendMessage(text);
}

async function sendMessage(text: string) {
  const content = text.trim();
  if (!content || loading.value) return;

  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }

  const list = sessionMessages.value.get(currentId.value) ?? [];
  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    content,
    isSelf: true,
    time: new Date(),
    status: 'sent',
  };
  list.push(userMsg);
  emit('send', userMsg);

  const assistantMsg: ChatMessage = {
    id: `assistant-${Date.now()}`,
    content: '',
    isSelf: false,
    time: new Date(),
    status: 'streaming',
  };
  list.push(assistantMsg);
  sessionMessages.value.set(currentId.value, list);
  loading.value = true;
  inputModel.value = { html: '', text: '' };

  // 构造上下文（最近 contextSize 条非系统消息 + 系统提示词，技能选中时优先用技能 prompt）
  const systemPrompt = activeSkill.value?.prompt ?? props.systemPrompt;
  const history = list
    .filter((m) => m.content && m.id !== assistantMsg.id)
    .slice(-props.contextSize)
    .map((m) => ({ role: m.isSelf ? 'user' : 'assistant', content: m.content }));
  if (systemPrompt) {
    history.unshift({ role: 'system', content: systemPrompt });
  }

  const userId = await resolveUserId();

  const baseOptions = {
    headers: props.headers,
    body: {
      model: selectedModel.value || 'gpt-3.5-turbo',
      messages: history,
      stream: true,
      temperature: props.temperature ?? 0.7,
      ...(userId ? { user: userId } : {}),
    },
  };

  const handleChunk = (content: string) => {
    if (!content) return;
    assistantMsg.content += content;
    emit('receive', content, assistantMsg.content);
    sessionMessages.value.set(currentId.value, [...list]);
  };

  const handleEnd = (fullContent: string) => {
    assistantMsg.content = fullContent;
    assistantMsg.status = 'sent';
    emit('complete', assistantMsg);
    sessionMessages.value.set(currentId.value, [...list]);
    loading.value = false;
    currentClient = null;
  };

  const handleError = (err: unknown) => {
    assistantMsg.content = '[错误] ' + ((err as Error)?.message || '未知错误');
    assistantMsg.status = 'sent';
    emit('error', err);
    sessionMessages.value.set(currentId.value, [...list]);
    loading.value = false;
    currentClient = null;
  };

  if (props.protocol === 'openai') {
    currentClient = createOpenAiSseClient(endpoint.value, {
      ...baseOptions,
      onChunk: (chunk: OpenAiChunk) => {
        handleChunk(chunk.choices?.[0]?.delta?.content || '');
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  } else {
    currentClient = createSpringAiSseClient(endpoint.value, {
      ...baseOptions,
      onChunk: (chunk: SpringAiChunk) => {
        handleChunk(chunk.content || '');
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  }
}

function stop() {
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
  loading.value = false;
}

onUnmounted(() => {
  stop();
});

/* ==================== 单会话模式（conversationId） ==================== */

watch(
  () => props.conversationId,
  (id) => {
    if (id) {
      startNewChat();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
/* ===== 根容器 ===== */
.re-chat {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 0;
  overflow: hidden;
  background: #fff;
}

/* ===== 历史会话面板 ===== */
.re-chat__history {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fbfcfe;
  border-right: 1px solid #ebeef5;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.re-chat__history.collapsed {
  width: 0;
  border: none;
}

/* 顶部搜索框 */
.re-chat__history-search {
  padding: 14px 12px 8px;
  flex-shrink: 0;
}
.re-chat__history-search :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 8px 12px;
  background: #f1f3f7;
  box-shadow: none;
}
.re-chat__history-search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #6366f1 inset;
  background: #fff;
}
.re-chat__history-search :deep(.el-input__inner) {
  font-size: 14px;
}

/* 顶部固定菜单（新对话 / 技能 / 扩展） */
.re-chat__history-menu {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f1f4;
}
.re-chat__menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.re-chat__menu-item:hover {
  background: #f1f3f7;
}
.re-chat__menu-item.is-active {
  background: linear-gradient(135deg, #eef2ff, #e8edff);
  color: #4f46e5;
  font-weight: 500;
}
.re-chat__menu-item .el-icon {
  font-size: 16px;
}

/* 批量删除操作栏 */
.re-chat__batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fef2f2, #fff1f2);
  border-bottom: 1px solid #fecdd3;
  flex-shrink: 0;
}
.re-chat__batch-count {
  font-size: 12px;
  color: #e11d48;
  font-weight: 500;
}
.re-chat__batch-ops {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

/* 下半区：历史对话列表 */
.re-chat__history-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.re-chat__section-title {
  padding: 14px 16px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  flex-shrink: 0;
}
.re-chat__history-body :deep(.elx-conversations) {
  flex: 1;
  min-height: 0;
}
/* Conversations 会话项增强 */
.re-chat__history-body :deep(.elx-conversations__item) {
  margin: 2px 8px;
  border-radius: 10px;
  transition: all 0.15s ease;
}
.re-chat__history-body :deep(.elx-conversations__item:hover) {
  background: rgba(99, 102, 241, 0.05);
}
.re-chat__history-body :deep(.elx-conversations__item.is-active) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.04));
}
.re-chat__group-title {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.re-chat__item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.re-chat__item-label .el-checkbox {
  margin-right: 2px;
}
/* 圆形气泡前置图标 */
.re-chat__item-icon {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef0f4;
  color: #6b7280;
  font-size: 13px;
}
.re-chat__history-body :deep(.elx-conversations__item.is-active) .re-chat__item-icon {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
}
.re-chat__item-label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s ease;
}
.re-chat__item-label-text.is-selected {
  color: #6366f1;
  font-weight: 500;
}

/* ===== 底部折叠 ===== */
.re-chat__history-footer {
  flex-shrink: 0;
  padding: 10px 12px;
  border-top: 1px solid #f0f1f4;
}
.re-chat__collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.re-chat__collapse-btn:hover {
  background: #f1f3f7;
  color: #4f46e5;
}

/* ===== 收缩开关 ===== */
.re-chat__history-toggle {
  width: 24px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  border-radius: 0 12px 12px 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-left: none;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s ease;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
}
.re-chat__history-toggle:hover {
  color: #6366f1;
  background: #f5f3ff;
}

/* ===== 聊天主区域 ===== */
.re-chat__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* 消息面板 */
.re-chat__panel {
  flex: 1;
  min-height: 0;
  background: linear-gradient(180deg, #fafbfd 0%, #fff 120px);
  overflow: hidden;
}
.re-chat__panel :deep(.elx-bubble-list),
.re-chat__panel :deep(.elx-bubble-list__list) {
  height: 100%;
  min-height: 0;
}

/* 气泡动画 */
.re-chat__panel :deep(.elx-bubble-list__item) {
  animation: bubble-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes bubble-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户气泡（右侧） */
.re-chat__panel :deep(.elx-bubble-list__item--end .elx-bubble-list__content) {
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 16px 16px 4px 16px !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
  padding: 10px 16px !important;
  font-size: 14px;
  line-height: 1.7;
}

/* AI 气泡（左侧） */
.re-chat__panel :deep(.elx-bubble-list__item--start .elx-bubble-list__content) {
  background: #f3f4f6 !important;
  color: #1f2937 !important;
  border: 1px solid #e5e7eb !important;
  border-radius: 16px 16px 16px 4px !important;
  padding: 10px 16px !important;
  font-size: 14px;
  line-height: 1.7;
}

/* ===== 输入区域（XSender，长圆角浅蓝细边框、白底、高度翻倍） ===== */
.re-chat__input {
  flex-shrink: 0;
  background: #fff;
  padding: 12px 16px 16px;
}
/* 去掉 XSender 根元素自带的阴影与伪元素边框，避免与 content 边框叠加成两层 */
.re-chat__input :deep(.elx-x-sender) {
  box-shadow: none !important;
  border-width: 0;
}
.re-chat__input :deep(.elx-x-sender:after),
.re-chat__input :deep(.elx-x-sender:focus-within:after) {
  border-width: 0 !important;
}
.re-chat__input :deep(.elx-x-sender__content) {
  border-radius: 16px;
  border: 1.5px solid #cfe0fa;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.re-chat__input :deep(.elx-x-sender__content:focus-within) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}
.re-chat__input :deep(.elx-x-sender__content) {
  position: relative;
  padding-block: 10px;
  padding-inline: 12px;
}
.re-chat__input :deep(.elx-x-sender__chat-room) {
  min-height: 104px;
  justify-content: center;
  border: none;
  background: #fff;
}
.re-chat__input :deep(.elx-x-sender__chat) {
  font-size: 14px;
  line-height: 24px;
}
.re-chat__input :deep(.elx-x-sender__chat .chat-rich-text) {
  min-height: 104px;
}

/* 输入框左侧迷你按钮（附件 / 模型） */
.re-chat__input :deep(.elx-x-sender__prefix) {
  display: flex;
  align-items: center;
  height: 44px;
  margin-right: 8px;
}
.re-chat__input-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.re-chat__mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 9px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.re-chat__mini-btn:hover {
  background: #eef2ff;
  color: #4f46e5;
}
.re-chat__mini-btn .el-icon {
  font-size: 15px;
}
.re-chat__model-arrow {
  font-size: 12px !important;
  transition: transform 0.2s ease;
}
.re-chat__mini-btn:focus-within .re-chat__model-arrow,
.re-chat__model-btn.is-active .re-chat__model-arrow {
  transform: rotate(180deg);
}

/* 模型 popover */
.re-chat__model-popover-title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  padding: 2px 4px 8px;
}
.re-chat__model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
}
.re-chat__model-item:hover {
  background: #eef2ff;
}
.re-chat__model-item.is-active {
  color: #4f46e5;
  font-weight: 600;
  background: linear-gradient(135deg, #eef2ff, #e8edff);
}
.re-chat__model-item-check {
  font-size: 14px;
  color: #4f46e5;
}

/* 输入框右侧圆形发送按钮 */
.re-chat__input :deep(.elx-x-sender__action-list) {
  display: flex;
  align-items: center;
  height: 44px;
  margin-left: 8px;
}
.re-chat__send-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
  transition: all 0.2s ease;
}
.re-chat__send-btn .el-icon {
  font-size: 16px;
}
.re-chat__send-btn:hover:not(.is-disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}
.re-chat__send-btn.is-disabled,
.re-chat__send-btn.is-empty {
  background: #d1d5db;
  box-shadow: none;
  cursor: not-allowed;
}
.re-chat__send-btn.is-loading {
  cursor: pointer;
}
.re-chat__send-btn .is-loading-icon {
  animation: re-chat-spin 0.8s linear infinite;
}
@keyframes re-chat-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ===== 滚动条美化 ===== */
.re-chat__history-body::-webkit-scrollbar,
.re-chat__panel :deep(.elx-bubble-list__list::-webkit-scrollbar) {
  width: 4px;
}
.re-chat__history-body::-webkit-scrollbar-track,
.re-chat__panel :deep(.elx-bubble-list__list::-webkit-scrollbar-track) {
  background: transparent;
}
.re-chat__history-body::-webkit-scrollbar-thumb,
.re-chat__panel :deep(.elx-bubble-list__list::-webkit-scrollbar-thumb) {
  background: #d1d5db;
  border-radius: 4px;
}
.re-chat__history-body::-webkit-scrollbar-thumb:hover,
.re-chat__panel :deep(.elx-bubble-list__list::-webkit-scrollbar-thumb:hover) {
  background: #9ca3af;
}

/* ===== 技能中心 ===== */
.re-chat__skills-center {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px;
  background: linear-gradient(180deg, #fafbfe 0%, #fff 160px);
}
.re-chat__skills-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}
.re-chat__skills-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.re-chat__skills-back {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #6b7280;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}
.re-chat__skills-back:hover {
  color: #4f46e5;
  border-color: #c7d2fe;
  background: #eef2ff;
}
.re-chat__skills-title-lg {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}
.re-chat__skills-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #9ca3af;
}
.re-chat__skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.re-chat__skill-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}
.re-chat__skill-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
}
.re-chat__skill-card.is-installed {
  border-color: #c7d2fe;
}
.re-chat__skill-card.is-active {
  border-color: #6366f1;
  background: linear-gradient(135deg, #f5f3ff, #fff);
}
.re-chat__skill-card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  font-size: 20px;
}
.re-chat__skill-card-body {
  flex: 1;
  min-width: 0;
}
.re-chat__skill-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}
.re-chat__skill-card-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chat__skill-card-actions {
  flex-shrink: 0;
}
</style>
