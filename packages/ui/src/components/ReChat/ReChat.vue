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
          <el-button type="danger" @click="confirmBatchDelete">删除</el-button>
          <el-button @click="exitBatchDelete">取消</el-button>
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
          :show-built-in-menu="true"
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
              <span
                class="re-chat__item-icon"
                :class="{ 'is-pinned': item.pinned }"
                :title="item.pinned ? '取消置顶' : '置顶'"
                @click.stop="togglePinFromLabel(Number(item.id))"
              >
                <el-icon><Top v-if="item.pinned" /><ChatDotRound v-else /></el-icon>
              </span>
              <span
                class="re-chat__item-label-text"
                :class="{ 'is-selected': selectedIds.has(Number(item.id)) }"
              >{{ item.label }}</span>
            </div>
          </template>
          <template #more-filled="{ item }">
            <span class="re-chat__item-more" @click.stop="pinMenuTarget = Number(item.id)">
              <el-icon><MoreFilled /></el-icon>
            </span>
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
          <!-- 空状态欢迎界面 -->
          <div v-if="currentMessages.length === 0" class="re-chat__welcome">
            <div class="re-chat__welcome-logo">
              <el-icon :size="36"><MagicStick /></el-icon>
            </div>
            <h3 class="re-chat__welcome-title">你好，有什么可以帮你的？</h3>
            <p class="re-chat__welcome-sub">选择下方提示开始对话，或直接输入你的问题</p>
            <div class="re-chat__welcome-prompts">
              <div class="re-chat__prompt-card" @click="sendPrompt('帮我写一份项目计划书')">
                <el-icon><Edit /></el-icon>
                <span>帮我写一份项目计划书</span>
              </div>
              <div class="re-chat__prompt-card" @click="sendPrompt('解释一下什么是机器学习')">
                <el-icon><Cpu /></el-icon>
                <span>解释一下什么是机器学习</span>
              </div>
              <div class="re-chat__prompt-card" @click="sendPrompt('帮我翻译一段英文')">
                <el-icon><ChatDotRound /></el-icon>
                <span>帮我翻译一段英文</span>
              </div>
            </div>
          </div>
          <BubbleList
            v-else
            :list="bubbleItems"
            :auto-scroll="true"
          />
        </div>
        <div class="re-chat__input">
          <div
            v-if="commandVisible && filteredCommands.length"
            class="re-chat__command-panel"
          >
            <div
              v-for="(cmd, idx) in filteredCommands"
              :key="cmd.name"
              class="re-chat__command-item"
              :class="{ 'is-active': commandIndex === idx }"
              @mousedown.prevent="execCommand(cmd)"
            >
              <span class="re-chat__command-icon">
                <el-icon><component :is="cmd.icon" /></el-icon>
              </span>
              <div class="re-chat__command-body">
                <span class="re-chat__command-name">/{{ cmd.name }}</span>
                <span class="re-chat__command-desc">{{ cmd.description }}</span>
              </div>
            </div>
          </div>
          <XSender
            ref="senderRef"
            :placeholder="placeholder"
            :loading="loading"
            :disabled="loading"
            variant="updown"
            submit-type="enter"
            @change="onSenderChange"
            @keydown="onCommandKeydown"
            @submit="onSubmit"
          >
            <!-- 下层左侧：附件 / 模型选择 / 深度思考 / 智能搜索 -->
            <template #prefix>
              <div class="re-chat__tool-row">
                <el-tooltip content="上传附件" placement="top">
                  <button class="re-chat__mini-btn" type="button" @click="onToolClick('attach')">
                    <el-icon><Plus /></el-icon>
                  </button>
                </el-tooltip>
                <el-popover
                  v-if="modelOptions.length"
                  :visible="modelPopoverVisible"
                  :width="240"
                  trigger="click"
                  placement="top-start"
                  @show="modelPopoverVisible = true"
                  @hide="modelPopoverVisible = false"
                >
                  <template #reference>
                    <button class="re-chat__mini-btn re-chat__model-btn" type="button">
                      <el-icon><Cpu /></el-icon>
                      <span>{{ currentModelLabel }}</span>
                      <el-icon class="re-chat__model-arrow"><ArrowDown /></el-icon>
                    </button>
                  </template>
                  <div class="re-chat__model-popover">
                    <div class="re-chat__model-popover-title">选择模型</div>
                    <div
                      v-for="m in modelOptions"
                      :key="m.value"
                      class="re-chat__model-item"
                      :class="{ 'is-active': selectedModel === m.value }"
                      @click="selectModel(m.value)"
                    >
                      <span class="re-chat__model-item-label">{{ m.label }}</span>
                      <el-icon v-if="selectedModel === m.value" class="re-chat__model-item-check"><Check /></el-icon>
                    </div>
                  </div>
                </el-popover>
                <button
                  v-if="capabilitySupport.think"
                  class="re-chat__toggle-btn"
                  :class="{ 'is-active': thinkEnabled }"
                  type="button"
                  @click="thinkEnabled = !thinkEnabled"
                >
                  <el-icon><Lightning /></el-icon>
                  <span>深度思考</span>
                </button>
                <button
                  v-if="capabilitySupport.search"
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
            <!-- 下层右侧：圆形发送按钮 -->
            <template #action-list>
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

                    plain
                    @click="activeSkill = null"
                  >停用</el-button>
                  <el-button v-else type="primary" @click="installSkill(skill)">启用</el-button>
                </template>
                <el-button v-else @click="installSkill(skill)">安装</el-button>
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
  Cpu,
  ArrowDown,
  Check,
  Loading,
  MoreFilled,
} from '@element-plus/icons-vue';
import { Conversations, BubbleList, XSender } from 'vue-element-plus-x';
import 'vue-element-plus-x/styles/index.css';
import { createOpenAiSseClient, createSpringAiSseClient } from '@repo/utils/sse';
import { http } from '@repo/core';
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
  /** 模型能力标签（后端 /v1/models 返回，用于判断是否支持深度思考/智能搜索） */
  capabilities?: string[];
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
  /** 模型列表接口地址（默认取 url 同级 /v1/models） */
  modelsUrl?: string;
  /** 是否根据后端模型能力显示「深度思考」「智能搜索」开关 */
  capabilityGating?: boolean;
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
  /** AI AppKey（OpenAI 协议鉴权），存在时覆盖框架 JWT 作为 Bearer */
  apiKey?: string;
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
  modelsUrl: undefined,
  capabilityGating: true,
  systemPrompt: undefined,
  temperature: 0.7,
  contextSize: 20,
  headers: () => ({}),
  userId: undefined,
  conversationId: undefined,
  showAvatar: true,
  placeholder: '给 AI 发送消息',
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
  updateCommandState();
}

/* ==================== 斜杠 / 命令 ==================== */

/** 命令项定义 */
interface SlashCommand {
  name: string;
  description: string;
  icon: unknown;
  /** 是否在命令面板中显示（/help 本身不显示） */
  hidden?: boolean;
  /** 执行函数：返回 false 表示不发送给 AI */
  run: () => boolean | void;
}

/** 命令面板是否可见 */
const commandVisible = ref(false);
/** 当前高亮的命令索引 */
const commandIndex = ref(0);

/** 常用斜杠命令 */
const slashCommands: SlashCommand[] = [
  { name: 'new', description: '开启新对话', icon: Plus, run: () => { startNewChat(); return false; } },
  { name: 'clear', description: '清空当前对话', icon: DeleteFilled, run: () => { handleClear(); return false; } },
  { name: 'skill', description: '打开技能中心', icon: Lightning, run: () => { openSkills(); return false; } },
  { name: 'model', description: '切换模型', icon: Cpu, run: () => { modelPopoverVisible.value = true; return false; } },
  { name: 'think', description: '切换深度思考', icon: Lightning, run: () => { thinkEnabled.value = !thinkEnabled.value; return false; } },
  { name: 'search', description: '切换智能搜索', icon: SearchIcon, run: () => { searchEnabled.value = !searchEnabled.value; return false; } },
  { name: 'help', description: '查看可用命令', icon: MagicStick, run: () => { showCommandHelp(); return false; } },
];

/** 过滤后的命令列表（按输入匹配） */
const filteredCommands = computed(() => {
  const kw = inputText.value.trim().replace(/^\//, '').toLowerCase();
  const list = slashCommands.filter((c) => !c.hidden);
  if (!kw) return list;
  return list.filter((c) => c.name.toLowerCase().includes(kw));
});

/** 根据输入更新命令面板状态 */
function updateCommandState() {
  const text = inputText.value;
  const show = text.startsWith('/') && filteredCommands.value.length > 0;
  commandVisible.value = show;
  if (!show) {
    commandIndex.value = 0;
  } else {
    commandIndex.value = Math.min(commandIndex.value, filteredCommands.value.length - 1);
  }
}

/** 命令面板键盘导航（上/下/回车/Esc） */
function onCommandKeydown(e: KeyboardEvent) {
  if (!commandVisible.value) return;
  const list = filteredCommands.value;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    commandIndex.value = (commandIndex.value + 1) % list.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    commandIndex.value = (commandIndex.value - 1 + list.length) % list.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    execCommand(list[commandIndex.value]);
  } else if (e.key === 'Escape') {
    commandVisible.value = false;
    e.preventDefault();
  }
}

/** 执行命令：返回值控制是否继续发送 */
function execCommand(cmd: SlashCommand) {
  commandVisible.value = false;
  commandIndex.value = 0;
  const shouldSend = cmd.run();
  if (shouldSend === false) {
    // 清空输入框（命令已被消费）
    inputText.value = '';
    senderRef.value?.clear();
  }
}

/** /help：把命令列表作为一条 AI 消息插入 */
function showCommandHelp() {
  const list = slashCommands.map((c) => `/${c.name} - ${c.description}`).join('\n');
  const cmdMsg: ChatMessage = {
    id: `cmd-help-${Date.now()}`,
    content: `可用斜杠命令：\n${list}`,
    isSelf: false,
    time: new Date(),
    status: 'sent',
  };
  const arr = sessionMessages.value.get(currentId.value) ?? [];
  arr.push(cmdMsg);
  sessionMessages.value.set(currentId.value, arr);
}

/* ==================== 模型选择 & 能力开关 ==================== */

/** 模型列表（优先 prop.models，其次从后端 /v1/models 拉取） */
const modelOptions = ref<ChatModel[]>([]);
/** 当前选中模型 value */
const selectedModel = ref('');
/** 模型选择弹层是否可见 */
const modelPopoverVisible = ref(false);
/** 后端模型列表是否已加载成功 */
const modelsLoaded = ref(false);

/** 当前模型显示名 */
const currentModelLabel = computed(() => {
  const hit = modelOptions.value.find((m) => m.value === selectedModel.value);
  return (hit?.label ?? selectedModel.value) || '选择模型';
});

/** 当前模型的能力集合 */
const currentModelCaps = computed(() => {
  const hit = modelOptions.value.find((m) => m.value === selectedModel.value);
  return hit?.capabilities ?? [];
});

/**
 * 能力开关可见性：
 *  - 关闭 capabilityGating 时恒显示（兜底，兼容无能力协议的后端）
 *  - 后端模型列表加载失败（拿不到能力）时也显示（保守策略）
 *  - 仅当能力明确存在时才显示对应开关
 */
const capabilitySupport = computed(() => {
  const enabled = props.capabilityGating !== false;
  if (!enabled || !modelsLoaded.value) {
    return { think: true, search: true };
  }
  const caps = currentModelCaps.value.map((c) => c.toLowerCase());
  return { think: caps.includes('think'), search: caps.includes('search') };
});

/** 选择模型（关闭弹层并同步） */
function selectModel(value: string) {
  selectedModel.value = value;
  modelPopoverVisible.value = false;
  // 重置能力开关，避免在能力不支持的模型上残留开启状态
  if (!capabilitySupport.value.think) {
    thinkEnabled.value = false;
  }
  if (!capabilitySupport.value.search) {
    searchEnabled.value = false;
  }
}

/**
 * 解析后端模型列表接口地址：
 *  props.modelsUrl > url 同级 /v1/models（chat/completions → /models）
 */
function resolveModelsUrl(): string {
  if (props.modelsUrl) return props.modelsUrl;
  const url = endpoint.value;
  if (/\/chat\/completions$/i.test(url)) {
    return url.replace(/\/chat\/completions$/i, '/models');
  }
  if (/\/completions$/i.test(url)) {
    return url.replace(/\/completions$/i, '/models');
  }
  return url.replace(/\/+$/, '') + '/models';
}

/** 从后端拉取模型列表（含 capabilities） */
async function fetchModels() {
  // 优先使用 prop 传入的模型列表（前端已明确给定，不覆盖）
  if (props.models.length) {
    modelOptions.value = [...props.models];
    const initial = props.model || props.models[0]?.value || '';
    selectedModel.value = initial;
    modelsLoaded.value = true;
    return;
  }
  try {
    const { data: json } = await http().get(resolveModelsUrl()).headers({
      Accept: 'application/json',
      ...(props.headers ?? {}),
    }) as { data: { data?: Array<{ id?: string; name?: string; description?: string; capabilities?: string[] }> } };
    const list = (json.data ?? []).map((m) => ({
      value: m.id || m.name || '',
      label: m.name || m.id || '',
      description: m.description,
      capabilities: m.capabilities ?? [],
    }));
    modelOptions.value = list.filter((m) => m.value);
    modelsLoaded.value = true;
    selectedModel.value = props.model || modelOptions.value[0]?.value || '';
  } catch (e) {
    console.warn('[ReChat] 模型列表拉取失败，能力开关采用保守显示策略:', e);
    modelsLoaded.value = false;
  }
}

fetchModels();

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

/** 更多菜单当前指向的会话（点击某会话「更多」时同步，用于菜单文字按目标会话动态变化） */
const pinMenuTarget = ref<number | null>(null);

/** 更多菜单第一条「置顶/取消置顶」基于目标会话，而非当前激活会话 */
const conversationMenu = computed(() => {
  const target = sessions.value.find((s) => s.id === pinMenuTarget.value);
  const pinned = target?.pinned ?? activeSessionPinned;
  return [
    { label: pinned ? '取消置顶' : '置顶', key: 'pin', icon: markRaw(Top), command: 'pin' },
    { label: '重命名', key: 'rename', icon: markRaw(Edit), command: 'rename' },
    { label: '删除', key: 'delete', icon: markRaw(Delete), command: 'delete' },
    { label: '批量删除', key: 'batch-delete', icon: markRaw(DeleteFilled), command: 'batch-delete', divided: true },
  ];
});

/** 点击会话前置顶图标快速切换（按 item 动态，不依赖当前激活会话） */
function togglePinFromLabel(id: number) {
  const target = sessions.value.find((s) => s.id === id);
  if (target) {
    target.pinned = !target.pinned;
  }
}

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

function toggleAll(val: boolean | string | number) {
  const checked = Boolean(val);
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

/** 输入框内迷你按钮点击（当前仅「语音」），交由父组件处理语音输入等逻辑 */
function onToolClick(tool: string) {
  emit('tool-click', tool);
}

/** 欢迎界面提示点击 */
function sendPrompt(text: string) {
  void sendMessage(text);
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

/** 清空当前会话消息 */
function handleClear() {
  sessionMessages.value.set(currentId.value, []);
  if (currentClient) {
    currentClient.close();
    currentClient = null;
  }
  loading.value = false;
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
    currentId.value = id;
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
  const text = senderRef.value?.getModelValue()?.text ?? inputText.value ?? '';
  if (commandVisible.value) {
    const list = filteredCommands.value;
    if (list.length) {
      execCommand(list[commandIndex.value]);
    }
    return;
  }
  // 斜杠命令拦截：输入恰好为 /xxx 时执行命令而不发送
  const trimmed = text.trim();
  if (trimmed.startsWith('/')) {
    const cmd = slashCommands.find((c) => c.name === trimmed.slice(1).trim().toLowerCase());
    if (cmd && !cmd.hidden) {
      execCommand(cmd);
      return;
    }
  }
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
  inputText.value = '';
  // 清空输入框内容
  nextTick(() => {
    senderRef.value?.clear();
  });

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
    // 配置了 AI AppKey 时用其作为 Bearer（OpenAI 协议鉴权）；未配置时不注入 JWT，避免误用框架 token 冒充
    auth: props.apiKey || false,
    body: {
      model: selectedModel.value || props.model || 'gpt-3.5-turbo',
      messages: history,
      stream: true,
      temperature: props.temperature ?? 0.7,
      // 深度思考 / 智能搜索开关，随请求透传后端
      think: thinkEnabled.value,
      search: searchEnabled.value,
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
    // 用户主动停止（AbortError）不算错误，不覆盖已生成内容
    if (err instanceof DOMException && err.name === 'AbortError') {
      assistantMsg.status = 'sent';
      loading.value = false;
      currentClient = null;
      return;
    }
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
      reconnect: false,
      onChunk: (chunk: OpenAiChunk) => {
        handleChunk(chunk.choices?.[0]?.delta?.content || '');
      },
      onEnd: handleEnd,
      onError: handleError,
    });
  } else {
    currentClient = createSpringAiSseClient(endpoint.value, {
      ...baseOptions,
      reconnect: false,
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
  // 将流式中的 AI 消息置为已发送，避免 loading 转圈不消失
  const msgs = sessionMessages.value.get(currentId.value);
  if (msgs) {
    const streaming = msgs.find((m) => m.status === 'streaming' && !m.isSelf);
    if (streaming) {
      streaming.status = 'sent';
    }
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
  background: #fafbfe;
  border-radius: 12px;
}

/* ===== 历史会话面板 ===== */
.re-chat__history {
  width: 270px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color, #f5f7fa);
  border-right: 1px solid var(--el-border-color-lighter, #ebeef5);
  overflow-x: hidden;
  overflow-y: hidden;
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
  padding: 8px 10px 10px;
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
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.re-chat__menu-item:hover {
  background: #f1f3f7;
}
.re-chat__menu-item.is-active {
  background: var(--el-color-primary-light-9, #eef2ff);
  color: var(--el-color-primary, #4f46e5);
  font-weight: 600;
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
  background: var(--el-color-danger-light-9, #fef2f2);
  border-bottom: 1px solid var(--el-color-danger-light-7, #fecdd3);
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
  overflow-x: hidden;
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
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
.re-chat__history-body :deep(.elx-conversations__item) {
  margin: 2px 8px;
  border-radius: 10px;
  transition: all 0.15s ease;
  min-width: 0;
}
.re-chat__history-body :deep(.elx-conversations__item:hover) {
  background: rgba(99, 102, 241, 0.05);
}
.re-chat__history-body :deep(.elx-conversations__item.is-active) {
  background: var(--el-color-primary-light-9, rgba(99, 102, 241, 0.08));
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
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef0f4;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.re-chat__item-icon:hover {
  background: #e0e7ff;
  color: #6366f1;
  transform: scale(1.08);
}
.re-chat__item-icon.is-pinned {
  background: var(--el-color-primary, #6366f1);
  color: #fff;
}
.re-chat__history-body :deep(.elx-conversations__item.is-active) .re-chat__item-icon {
  background: var(--el-color-primary, #6366f1);
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
.re-chat__item-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.re-chat__item-more:hover {
  background: #eef0f4;
  color: #6366f1;
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
  border-radius: 0 12px 12px 0;
}

/* 消息面板 */
.re-chat__panel {
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color, #ffffff);
  overflow: hidden;
  padding: 16px 20px 0;
  box-sizing: border-box;
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
  background: var(--el-color-primary, #6366f1) !important;
  color: #fff !important;
  border: none !important;
  border-radius: 16px 16px 4px 16px !important;
  box-shadow: none;
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

/* ===== 输入区域（XSender updown 布局：上层文本区 + 下层功能按钮） ===== */
.re-chat__input {
  flex-shrink: 0;
  position: relative;
  background: #fff;
  padding: 12px 16px 16px;
}
/* 整体：横向大圆角、浅灰细边框、纯白底色 */
.re-chat__input :deep(.elx-x-sender) {
  box-shadow: none !important;
  border-width: 0;
  background: #fff;
}
.re-chat__input :deep(.elx-x-sender:after),
.re-chat__input :deep(.elx-x-sender:focus-within:after) {
  border-width: 0 !important;
}
.re-chat__input :deep(.elx-x-sender__content) {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.re-chat__input :deep(.elx-x-sender__content:focus-within) {
  border-color: #c7d2fe;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}
/* 上层文本输入区：占输入框上半部分绝大部分空间 */
.re-chat__input :deep(.elx-x-sender__chat-room) {
  min-height: 120px;
  justify-content: center;
  border: none;
  background: #fff;
}
.re-chat__input :deep(.elx-x-sender__chat) {
  font-size: 15px;
  line-height: 26px;
}
.re-chat__input :deep(.elx-x-sender__chat .chat-rich-text) {
  min-height: 120px;
}
/* 下层按钮行 */
.re-chat__input :deep(.elx-x-sender__updown-action-list) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 2px 2px;
}
.re-chat__input :deep(.elx-x-sender__prefix) {
  display: flex;
  align-items: center;
}
.re-chat__input :deep(.elx-x-sender__action-list) {
  display: flex;
  align-items: center;
}

/* 深度思考 / 智能搜索：浅蓝圆角切换按钮（默认色刻意调浅） */
.re-chat__tool-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.re-chat__toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid #eceffe;
  border-radius: 999px;
  background: #f8f9ff;
  font-size: 13px;
  color: #8a8fb8;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.re-chat__toggle-btn .el-icon {
  font-size: 14px;
}
.re-chat__toggle-btn:hover {
  background: #f1f3ff;
  border-color: #dde2ff;
  color: #6d74c9;
}
.re-chat__toggle-btn.is-active {
  background: var(--el-color-primary, #6366f1);
  border-color: var(--el-color-primary, #6366f1);
  color: #fff;
  box-shadow: none;
}

/* 圆形淡紫发送按钮（下层右侧） */
.re-chat__mini-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}
.re-chat__mini-btn:hover {
  background: #eef2ff;
  color: #4f46e5;
}

/* 模型选择按钮：胶囊带文字 */
.re-chat__mini-btn.re-chat__model-btn {
  width: auto;
  gap: 5px;
  padding: 0 10px;
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  color: #6b7280;
}
.re-chat__mini-btn.re-chat__model-btn:hover {
  background: #eef2ff;
  color: #4f46e5;
}
.re-chat__model-btn .el-icon {
  font-size: 14px;
}
.re-chat__model-arrow {
  font-size: 12px;
}

/* 模型选择弹层 */
.re-chat__model-popover {
  max-height: 320px;
  overflow-y: auto;
}
.re-chat__model-popover-title {
  padding: 2px 4px 8px;
  font-size: 12px;
  color: #9ca3af;
}
.re-chat__model-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 8px;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease;
}
.re-chat__model-item:hover {
  background: #f3f4ff;
}
.re-chat__model-item.is-active {
  color: #4f46e5;
  font-weight: 600;
}
.re-chat__model-item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.re-chat__model-item-check {
  flex-shrink: 0;
  font-size: 15px;
}
.re-chat__send-btn {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--el-color-primary, #6366f1);
  color: #fff;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.re-chat__send-btn:hover:not(.is-disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.re-chat__send-btn .el-icon {
  font-size: 16px;
}
.re-chat__send-btn:hover:not(.is-disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(167, 139, 250, 0.45);
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

/* ===== 斜杠命令面板 ===== */
.re-chat__command-panel {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(100% - 4px);
  z-index: 30;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 6px;
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}
.re-chat__command-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.re-chat__command-item.is-active,
.re-chat__command-item:hover {
  background: #f3f4f6;
}
.re-chat__command-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #eef2ff;
  color: #6366f1;
  flex-shrink: 0;
}
.re-chat__command-item.is-active .re-chat__command-icon {
  background: #6366f1;
  color: #fff;
}
.re-chat__command-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.re-chat__command-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.re-chat__command-desc {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: var(--el-bg-color, #ffffff);
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
  border-color: var(--el-color-primary, #6366f1);
  background: var(--el-bg-color, #ffffff);
}
.re-chat__skill-card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary, #6366f1);
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

/* ===== 欢迎界面 ===== */
.re-chat__welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 32px;
  text-align: center;
}
.re-chat__welcome-logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--el-color-primary, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 20px;
  box-shadow: none;
}
.re-chat__welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
}
.re-chat__welcome-sub {
  font-size: 14px;
  color: #9ca3af;
  margin: 0 0 28px;
}
.re-chat__welcome-prompts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  max-width: 640px;
}
.re-chat__prompt-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  user-select: none;
}
.re-chat__prompt-card:hover {
  border-color: var(--el-color-primary-light-7, #c7d2fe);
  background: var(--el-color-primary-light-9, #f5f3ff);
  color: var(--el-color-primary, #4f46e5);
  transform: translateY(-2px);
}
.re-chat__prompt-card .el-icon {
  font-size: 16px;
  color: #6366f1;
}
</style>
