<template>
  <div class="turn-wrapper last:min-h-[60vh]" :class="{ 'turn-wrapper--last': isLast, 'animate-in': animateIn }"
    :data-message-id="turn.user?.id">
    <!-- ============================================ -->
    <!-- User 部分 -->
    <!-- ============================================ -->
    <div v-if="turn.user" class="user-section">
      <div class="message-item__wrapper">
        <div class="message-item__card message-item--hover" :title="userTime.full">
          <!-- 用户文本 -->
          <div class="message-item__text break-all whitespace-pre-wrap">
            <template v-if="isSystemMessage">
              <div class="system-message-header">
                <el-icon size="14" class="system-message-icon">
                  <Alert16Regular />
                </el-icon>
                <span class="system-message-label">{{ systemMessageLabel }}</span>
              </div>
              <div class="system-message-divider" />
              <div class="system-message-body">
                <span v-html="userContent"></span>
              </div>
            </template>
            <span v-else v-html="renderSkillBadges(userContent)"></span>
          </div>
        </div>
        <!-- 知识库 -->
        <div class="knowledge-base flex flex-wrap gap-2 mt-3 ml-auto"
          v-if="turn.user.contents?.[0]?.metadata?.referencedKbs?.length > 0">
          <div v-for="kb in turn.user.contents?.[0]?.metadata?.referencedKbs" :key="kb.id">
            <div
              class="knowledge-base-item rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
              <MenuBookOutlined class="w-4 h-4" />
              {{ kb.name }}
            </div>
          </div>
        </div>
        <!-- 文件列表 -->
        <div class="file-list flex flex-wrap gap-2 mt-3 ml-auto"
          v-if="(turn.user.contents?.[0]?.files?.length ?? 0) > 0">
          <FileItem v-for="file, index in turn.user.contents?.[0]?.files" :key="file.id" :name="file.displayName"
            :type="file.fileType" :ext="file.fileExtension" :size="file.fileSize" :preview-url="file.previewUrl"
            :clickable="file.fileType === 'image'" @click="handleImageClick(Number(index))"></FileItem>
        </div>
        <!-- 用户操作按钮 -->
        <MessageActions :is-assistant="false" :is-last="false" :allow-generate="allowGenerate" :content-versions="[]"
          :current-version-index="0" :time-full="userTime.full" :time-friendly="userTime.firendly"
          @copy="emit('copy', turn.user)" @generate="emit('generate', turn.user)" @edit="emit('edit', turn.user)"
          @delete="emit('delete', turn.user)" />
      </div>
    </div>

    <!-- ============================================ -->
    <!-- Assistant 部分（有回复时） -->
    <!-- ============================================ -->
    <template v-if="activeAssistant">
      <div class="assistant-section">
        <div class="text-xs text-gray-400 mb-3">
          <div class="flex items-center">
            <div class="mr-5 flex items-center">
              <Avatar class="w-6 h-6 mr-2.5 relative top-0" :src="characterAvatar || modelAvatarPath" :round="false"
                type="assistant" :name="displayName"></Avatar>
              <span class="text-[1.3em] text-gray-700 dark:text-gray-300 font-medium leading-tight mr-2">{{
                displayName }}</span>
              <span v-if="currentModelName && currentModelName !== 'unknown'" class="text-[1em] text-gray-400 mt-0.5">{{
                currentModelName }}</span>
            </div>
          </div>
        </div>
        <div class="message-item__card message-item--hover" :title="assistantTime.full">
          <!-- 展示分组：content / think / tool -->
          <template v-for="(group, groupIndex) in displayGroups" :key="group.id">
            <template v-if="group.type === 'content'">
              <template v-for="item in group.items" :key="item.id">
                <MarkdownContent class="message-item__text markdown-text" @click="handleClick"
                  :content="item.content || ''" />
              </template>
            </template>
            <div v-else class="process-group">
              <!-- 分组标题 -->
              <div v-if="group.isCollapsible" class="process-group__header text-[14px] group"
                :class="{ 'shimmer-text': isLastActive(groupIndex), 'text-gray-600 dark:text-gray-400': !isLastActive(groupIndex) }"
                @click="toggleGroup(isLastActive(groupIndex) ? 'last-active' : group.id)">
                <template v-for="(parts, _) in [getGroupTitleParts(group, isLastActive(groupIndex))]" :key="_">
                  <span class="relative w-3.75 h-3.75 shrink-0 flex items-center justify-center">
                    <!-- <span class="block w-1 h-1 rounded-3xl bg-gray-400 dark:bg-gray-700/50" v-if="!isLastActive(groupIndex)"></span> -->
                    <component :is="parts.icon" v-if="!isGroupExpanded(group.id)"
                      class="absolute inset-0 w-3.75 h-3.75 transition-opacity duration-200 group-hover:opacity-0 text-gray-500" />
                    <ChevronDown12Regular class="absolute inset-0 w-3.75 h-3.75 transition-all duration-200"
                      :class="isGroupExpanded(group.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                      :style="isGroupExpanded(group.id) ? {} : { transform: 'rotate(-90deg)' }" />
                  </span>
                  <span class="shrink-0 font-medium ml-1.5">{{ parts.action }}</span>
                  <span v-if="parts.args" class="text-sm truncate ml-1.5"
                    :class="{ 'text-gray-400 dark:text-gray-400': !isLastActive(groupIndex) }">{{ parts.args }}</span>
                </template>
              </div>
              <!-- 分组内容 -->
              <div class="process-group__collapsible"
                :class="{ 'is-expanded': isLastActive(groupIndex) ? isGroupExpanded('last-active') : (!group.isCollapsible || isGroupExpanded(group.id)) }">
                <div class="process-group__body">
                  <div class="process-group__body-scroll space-y-2"
                    :class="{ 'py-2': group.isCollapsible, 'no-mask': !group.isCollapsible && !isLastActive(groupIndex) }"
                    :ref="isLastActive(groupIndex) ? setActiveBodyRef : undefined"
                    @scroll="isLastActive(groupIndex) ? onActiveBodyScroll($event) : undefined">
                    <template v-for="item in group.items" :key="item.id">
                      <MessageThinkingSection v-if="item.type === 'think'"
                        :reasoning-content="item.reasoningContent || ''"
                        :is-thinking="item.source.state?.isThinking || false"
                        :is-streaming="item.source.state?.isStreaming || false"
                        :thinking-duration-ms="item.source.thinkingDurationMs ?? item.source.metadata?.thinkingDurationMs"
                        :metadata="item.source.metadata" />
                      <MessageSearchSection v-if="item.type === 'search'"
                        :search-results="item.searchResults || []"
                        :is-searching="item.source.state?.isSearching || false"
                        :search-query="item.searchQuery" />
                      <MessageToolCalls v-if="item.type === 'tool'" :tool-calls="item.toolCalls || []"
                        :tool-responses="item.toolResponses" :content-id="item.source.id"
                        :is-streaming="streamingState.isStreaming" />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 计划批准卡片（plan_exit 人工确认） -->
          <PlanApprovalCard
            v-if="confirmationRequest"
            :request="confirmationRequest"
            @decision="handleConfirmationDecision"
          />

          <!-- 执行日志（agentscope 全量 trace：thinking/输出/轮次/工具/用量/边缘） -->
          <div v-if="allTraceLog.length" class="trace-console">
            <div class="trace-console__header" @click="traceExpanded = !traceExpanded">
              <el-icon size="13" class="trace-console__icon"><CodeOutlined /></el-icon>
              <span class="trace-console__title">执行日志</span>
              <span class="trace-console__count">{{ allTraceLog.length }}</span>
              <el-icon size="12" class="trace-console__chevron" :class="{ 'is-open': traceExpanded }">
                <ChevronDown12Regular />
              </el-icon>
            </div>
            <div v-show="traceExpanded" class="trace-console__body">
              <div v-for="(tr, i) in allTraceLog" :key="i" class="trace-line" :class="'trace-line--' + tr.kind">
                <span class="trace-line__time">{{ formatTraceTime(tr.timestamp) }}</span>
                <span class="trace-line__tag">{{ traceKindLabel(tr.kind) }}</span>
                <span v-if="tr.toolName" class="trace-line__tool">{{ tr.toolName }}</span>
                <span class="trace-line__text">{{ tr.text }}</span>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <el-alert v-if="assistantMetadata?.finishReason === 'error'" :title="t('chat.turn.apiError')" type="error" :closable="false">
            {{ assistantMetadata.errorDetail }}
          </el-alert>

          <!-- 超时提示 -->
          <el-alert v-if="assistantMetadata?.finishReason === 'timeout'" :title="t('chat.turn.requestTimeout')" type="warning" :closable="false">
            {{ assistantMetadata.errorDetail || t('chat.turn.serverNoResponse') }}
          </el-alert>

          <!-- 用户终止提示 -->
          <div v-if="assistantMetadata?.finishReason === 'user_cancel'"
            class="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {{ t('chat.turn.manuallyTerminated') }}
          </div>

          <!-- 继续执行按钮 -->
          <template v-if="assistantMetadata && !streamingState.isStreaming">
            <div v-if="assistantMetadata.finishReason === 'max_iterations_reached'" class="max-iterations-notice mt-3">
              <el-alert type="warning" :closable="false">
                <template #title>
                  <span>{{ t('chat.turn.maxIterationsReached') }}</span>
                </template>
                <div v-if="isLast" class="flex items-center gap-3 mt-2">
                  <el-button type="primary" size="small" @click="emit('continue', activeAssistant)">
                    {{ t('chat.turn.continueExecution') }}
                  </el-button>
                </div>
              </el-alert>
            </div>
            <div v-if="assistantMetadata.finishReason === 'rate_limited'" class="max-iterations-notice mt-3">
              <el-alert type="warning" :closable="false">
                <template #title>
                  <span>{{ assistantMetadata.errorDetail }}</span>
                </template>
                <div v-if="isLast" class="flex items-center gap-3 mt-2">
                  <el-button type="primary" size="small" @click="emit('continue', activeAssistant)">
                    {{ t('chat.turn.continueExecution') }}
                  </el-button>
                </div>
              </el-alert>
            </div>
          </template>
          <!-- 流式期间：三点动画 + 工作中状态 -->
          <div v-if="streamingState.isStreaming" class="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <!-- 三点动画 -->
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <template v-if="assistantMetadata?.retryInfo">
              <span class="text-amber-500 dark:text-amber-400">{{ assistantMetadata.retryInfo.message }}</span>
            </template>
            <template v-else>
              <span v-if="durationText">{{ t('chat.turn.workingWithDuration', { duration: durationText }) }}</span>
              <span v-else>{{ t('chat.turn.working') }}</span>
            </template>
          </div>

          <!-- Token 消耗 -->
          <div v-if="tokenUsage && !streamingState.isStreaming" class="token-usage-section mt-2 flex">
            <div class="flex items-center gap-3 text-xs text-gray-400">
              <el-icon size="13" class="text-gray-400">
                <InsightsTwotone />
              </el-icon>
              <span class="text-gray-500">Tokens:</span>
              <span class="token-item">
                <span class="text-gray-400 dark:text-gray-300 text-xs">Prompt</span>&nbsp;<span
                  class="text-gray-500 dark:text-gray-300">{{ formatTokenNumber(tokenUsage.promptTokens) }}</span>
              </span>
              <span class="token-item">
                <span class="text-gray-400 dark:text-gray-300">Completion</span>&nbsp;<span
                  class="text-gray-500 dark:text-gray-300">{{ formatTokenNumber(tokenUsage.completionTokens) }}</span>
              </span>
              <span class="token-item">
                <span class="text-gray-400 dark:text-gray-300">Total</span>&nbsp;<span
                  class="text-gray-500 dark:text-gray-300">{{
                    formatTokenNumber(tokenUsage.totalTokens) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 文件变更摘要 -->
        <FileChangesBar v-if="!streamingState.isStreaming && fileChanges.length > 0" :changes="fileChanges"
          @open-diff="openDiffDialog" />

        <!-- 操作按钮（含版本切换） -->
        <MessageActions v-if="!streamingState.isStreaming" :is-assistant="true" :is-last="isLast"
          :allow-generate="false" :content-versions="siblingVersions" :current-version-index="currentVersionIndex"
          :time-full="assistantTime.full" :time-friendly="assistantTime.firendly" :duration-text="durationText"
          @copy="emit('copy', activeAssistant)" @regenerate="emit('regenerate', activeAssistant)"
          @switch-version="switchContent" @edit="emit('edit', activeAssistant)"
          @delete="emit('delete', activeAssistant)" />
      </div>
    </template>

    <!-- 图片预览 -->
    <el-image-viewer v-if="showImageViewer" v-model:visible="showImageViewer" :url-list="previewList"
      :initial-index="currentPreViewIndex" @close="showImageViewer = false" :teleported="true" />

    <!-- 文件变更 Diff 弹窗 -->
    <FileDiffDialog v-model="diffDialogVisible" :entry="activeDiffEntry" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, inject } from "vue";
import { ElAlert, ElIcon, ElImageViewer, ElButton } from "element-plus";
import { useI18n } from "vue-i18n";
import { InsightsTwotone, MenuBookOutlined, CodeOutlined } from "@vicons/material";
import { Alert16Regular, BrainCircuit20Regular, Wrench24Filled, ChevronDown12Regular, GlobeShield20Regular } from "@vicons/fluent";
import { Loading, Bottom, Top, Box, InfoFilled } from "@element-plus/icons-vue";
import { FileItem, Avatar } from "../ui";
import { formatTime } from '../../utils';
import { getCurrentTurns, groupContentsForDisplay, type DisplayGroup, type DisplayItem, type Message } from '@/utils/messageUtils';
import { getToolConfig, getToolIcon, resolveToolName as _resolveToolName, getArgsText, countSteps, DEFAULT_CONFIG, type ToolCall } from '@/utils/toolDisplay';
import { getModelDisplayName, getModelAvatarPath } from '@/utils/modelUtils';
import { usePopup } from "../../composables/usePopup";
import MessageThinkingSection from './message-item/MessageThinkingSection.vue';
import MessageSearchSection from './message-item/MessageSearchSection.vue';
import MessageToolCalls from './message-item/MessageToolCalls.vue';
import MessageActions from './message-item/MessageActions.vue';
import FileChangesBar from './message-item/FileChangesBar.vue';
import FileDiffDialog from './message-item/FileDiffDialog.vue';
import PlanApprovalCard from './message-item/PlanApprovalCard.vue';
import { useFileChanges, type FileChangeEntry } from '@/composables/useFileChanges';

const { toast } = usePopup();
const { t } = useI18n();

const props = defineProps<{
  turn: { user: Message; assistants: Message[] };
  isLast: boolean;
  allowGenerate: boolean;
  characterName?: string;
  characterAvatar?: string;
  animateIn?: boolean;
}>();

const emit = defineEmits<{
  switch: [message: Message, versionId: string]
  delete: [message: Message]
  edit: [message: Message]
  copy: [message: Message]
  generate: [message: Message]
  regenerate: [message: Message]
  continue: [message: Message]
  resumeConfirmation: [payload: { replyId: string; confirmed: boolean; items: any[]; feedback?: string }]
}>();

// ============================================
// 内部状态
// ============================================
const showImageViewer = ref(false);
const currentPreViewIndex = ref(0);
const expandedGroups = ref<Set<string>>(new Set());

// 从 ChatPanel 注入锁定滚动方法，展开分组时调用
const lockScrollAnchor = inject<() => void>('lockScrollAnchor', () => { });

// 激活分组内容区 ref，用于自动滚动
const activeBodyRef = ref<HTMLElement | null>(null);
// 标记用户是否手动滚动了
let userScrolledAway = false;

// ref 绑定函数
const setActiveBodyRef = (el: Element | { $el: HTMLElement } | null) => {
  activeBodyRef.value = (el as any)?.$el || (el as HTMLElement) || null;
};

// 用户滚动检测：距底部超过 40px 视为手动滚动
const onActiveBodyScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
  userScrolledAway = !atBottom;
};

const toggleGroup = (groupId: string) => {
  const set = expandedGroups.value;
  if (set.has(groupId)) {
    set.delete(groupId);
  } else {
    set.add(groupId);
    if (groupId !== 'last-active') {
      lockScrollAnchor()
    }
  }
};

const isGroupExpanded = (groupId: string): boolean => {
  return expandedGroups.value.has(groupId);
};

// ============================================
// 版本管理
// ============================================
const siblingVersions = computed(() =>
  props.turn.assistants.map((a) => a.id)
);

const activeAssistant = computed(() => {
  const user = props.turn.user;
  const activeId = user?.currentVersionId;
  if (activeId) return props.turn.assistants.find((a) => a.id === activeId);
  return props.turn.assistants[props.turn.assistants.length - 1];
});

const currentVersionIndex = computed(() => {
  if (!activeAssistant.value) return 0;
  return siblingVersions.value.indexOf(activeAssistant.value.id);
});

const switchContent = (direction: 'prev' | 'next') => {
  const currentIndex = currentVersionIndex.value;
  if (currentIndex === -1) return;
  let newIndex: number;
  if (direction === 'prev' && currentIndex > 0) {
    newIndex = currentIndex - 1;
  } else if (direction === 'next' && currentIndex < siblingVersions.value.length - 1) {
    newIndex = currentIndex + 1;
  } else {
    return;
  }
  const targetId = siblingVersions.value[newIndex];
  const targetMsg = props.turn.assistants.find((a) => a.id === targetId);
  if (targetMsg && activeAssistant.value) {
    emit('switch', activeAssistant.value, targetId);
  }
};

// ============================================
// 展示计算
// ============================================
const turnsCache = computed(() => {
  if (!activeAssistant.value) return [];
  return getCurrentTurns(activeAssistant.value);
});

const displayGroups = computed<DisplayGroup[]>(() => {
  return groupContentsForDisplay(turnsCache.value);
});

// ============================================
// 执行日志（agentscope trace）
// ============================================
const traceExpanded = ref(false);
const allTraceLog = computed(() => {
  const out: any[] = [];
  const msg = activeAssistant.value;
  if (!msg) return out;
  for (const c of msg.contents || []) {
    if (Array.isArray(c.traceLog)) out.push(...c.traceLog);
  }
  return out;
});
// 计划批准请求（plan_exit）：从助手内容 metadata 读取
const confirmationRequest = computed<{ replyId: string; items: any[] } | null>(() => {
  const msg = activeAssistant.value;
  if (!msg) return null;
  for (const c of msg.contents || []) {
    const req = c?.metadata?.confirmationRequest;
    if (req && req.replyId) return req;
  }
  return null;
});

const handleConfirmationDecision = (payload: { replyId: string; confirmed: boolean; feedback?: string }) => {
  emit('resumeConfirmation', {
    replyId: payload.replyId,
    confirmed: payload.confirmed,
    items: confirmationRequest.value?.items || [],
    feedback: payload.feedback,
  });
};

const formatTraceTime = (ts: number): string => {
  if (!ts) return "";
  const d = new Date(ts);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const traceKindLabel = (kind: string): string => {
  const map: Record<string, string> = {
    agent_start: "启动",
    agent_end: "结束",
    turn: "轮次",
    thinking: "思考",
    text: "输出",
    tool_call: "工具",
    tool_args: "参数",
    tool_result: "结果",
    usage: "用量",
    hint: "提示",
    edge: "等待",
  };
  return map[kind] || kind || "";
};

// 文件变更记录
const { fileChanges } = useFileChanges(turnsCache);
const diffDialogVisible = ref(false);
const activeDiffEntry = ref<FileChangeEntry | null>(null);

const openDiffDialog = (entry: FileChangeEntry) => {
  activeDiffEntry.value = entry;
  diffDialogVisible.value = true;
};

// 激活分组内容更新时自动滚动到底部（用户手动滚动后不干扰）
watch(turnsCache, () => {
  if (!streamingState.value.isStreaming) return;
  nextTick(() => {
    const el = activeBodyRef.value;
    if (!el || userScrolledAway) return;
    el.scrollTop = el.scrollHeight;
  });
}, { deep: true });

// 流式过程中最后一组且需折叠为标题行
const isLastActiveGroup = computed(() => {
  if (!streamingState.value.isStreaming) return null;
  const groups = displayGroups.value;
  if (groups.length === 0) return null;
  const lastGroup = groups[groups.length - 1];
  return lastGroup.type === 'process' ? 'last-active' : null;
});

// 判断当前 group 是否为流式过程中需特殊处理的最后一组
const isLastActive = (groupIndex: number): boolean => {
  if (!isLastActiveGroup.value) return false;
  return groupIndex === displayGroups.value.length - 1;
};
// 统一的分组标题生成：active=true 时显示"正在"，active=false 时显示"已"
// 内部自行判断展开状态，返回 { icon, action, args }
const getGroupTitleParts = (group: DisplayGroup, active: boolean) => {
  const groupId = active ? 'last-active' : group.id;
  const expanded = isGroupExpanded(groupId);
  const items = active ? group.items.slice(-1) : group.items;
  const steps = countSteps(group.items);
  if (expanded) {
    if (active) {
      const currentItemSteps = countSteps(items);
      const completedSteps = steps - currentItemSteps;
      return { icon: Wrench24Filled, action: completedSteps ? t('chat.turn.executingStepsWithCompleted', { n: currentItemSteps, m: completedSteps }) : t('chat.turn.executingSteps', { n: currentItemSteps }), args: '' };
    }
    return { icon: Wrench24Filled, action: t('chat.turn.executedSteps', { n: steps }), args: '' };
  }
  const toolItems = items.filter(i => i.type === 'tool');
  const allToolCalls = toolItems.flatMap(i => i.toolCalls || []);

  // 纯思考/检索（无工具）
  if (allToolCalls.length === 0) {
    const thinkItem = items.find(i => i.type === 'think');
    const searchItem = items.find(i => i.type === 'search');
    const isThinking = thinkItem?.source.state?.isThinking;
    const isSearching = searchItem?.source.state?.isSearching;

    // 正在思考（检索已完成）→ 思考优先
    if (isThinking) {
      const lines = (thinkItem?.reasoningContent || '').split('\n').map(l => l.trim()).filter(Boolean);
      const lastLine = lines[lines.length - 1] || '';
      const preview = lastLine.length > 200 ? lastLine.substring(0, 200) + '...' : lastLine;
      return { icon: BrainCircuit20Regular, action: t('chat.turn.thinkingActive'), args: preview };
    }
    // 正在检索（尚未思考）→ 检索状态
    if (isSearching) {
      const q = searchItem?.searchQuery || '';
      return { icon: GlobeShield20Regular, action: t('chat.turn.searchActive'), args: q };
    }
    // 均已结束：有思考显示思考，否则显示检索
    if (thinkItem) {
      return { icon: BrainCircuit20Regular, action: t('chat.turn.thinkingDone'), args: '' };
    }
    if (searchItem) {
      const n = searchItem.searchResults?.length || 0;
      return { icon: GlobeShield20Regular, action: t('chat.turn.searchDone', { n }), args: '' };
    }
    return { icon: BrainCircuit20Regular, action: t('chat.turn.thinkingDone'), args: '' };
  }

  // 判断是否所有工具同类型
  const refTool = allToolCalls[allToolCalls.length - 1] as ToolCall;
  const allSameType = allToolCalls.every(tc => _resolveToolName(tc as ToolCall) === _resolveToolName(refTool));

  if (allSameType && allToolCalls.length > 1) {
    const config = getToolConfig(refTool);
    const agg = config.aggregate || DEFAULT_CONFIG.aggregate!;
    const text = active ? agg.executing : agg.completed;
    return { icon: getToolIcon(refTool), action: text.replace('{n}', String(allToolCalls.length)), args: '' };
  }

  if (allSameType && allToolCalls.length === 1) {
    const config = getToolConfig(refTool);
    const args = getArgsText(refTool);
    return { icon: getToolIcon(refTool), action: active ? config.text.executing : config.text.completed, args: args || '' };
  }

  // 混合工具 — 通用图标
  return { icon: Wrench24Filled, action: active ? t('chat.turn.executingSteps', { n: countSteps(items) }) : t('chat.turn.executedSteps', { n: steps }), args: '' };
};
// ============================================
const userContent = computed(() => {
  const content = props.turn.user?.contents?.[0];
  return content?.content || '';
});

const userTime = computed(() => {
  const content = props.turn.user?.contents?.[0];
  return {
    firendly: formatTime(content?.createdAt || '', 'friendly'),
    full: formatTime(content?.createdAt || '', 'full'),
  };
});

const isSystemMessage = computed(() => {
  const meta = props.turn.user?.metadata;
  const type = meta?.type;
  return type && type !== 'client';
});

const systemMessageLabel = computed(() => {
  const meta = props.turn.user?.metadata;
  const type = meta?.type || '';
  const name = meta?.subAgentName || '';
  switch (type) {
    case 'scheduler': return t('chat.turn.systemMessageScheduler');
    case 'sub_agent': return t('chat.turn.systemMessageSubAgent');
    default: return t('chat.turn.systemMessage');
  }
});

const renderSkillBadges = (text: string): string => {
  if (!text) return text;
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
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
      return `<span data-type="command" data-provider-id="${provider}" data-name="${name}" data-label="${attrs.label || ''}" data-trigger="${prefix}"${dataAttrs} class="command-badge" style="color: var(--el-color-primary);">${displayText}</span>`;
    }
  );
};

// ============================================
// Assistant 部分
// ============================================
const assistantMetadata = computed<Record<string, any> | null>(() => {
  const cache = turnsCache.value;
  const contentMeta = cache.length > 0 ? (cache[cache.length - 1]?.metadata || {}) : {};
  const messageMeta = activeAssistant.value?.metadata || {};
  // Message 级别：finishReason/errorDetail（turn_end 写入）
  // Content 级别：usage/toolCalls 等每轮迭代信息
  return {
    ...contentMeta,
    ...messageMeta,
  };
});

const streamingState = computed(() => ({
  isStreaming: activeAssistant.value?.state?.isStreaming ?? false,
}));

const currentModelName = computed(() => {
  const modelName = assistantMetadata.value?.modelName;
  return modelName ? getModelDisplayName(modelName) : "unknown";
});

const displayName = computed(() => {
  return props.characterName || currentModelName.value;
});

const modelAvatarPath = computed(() => {
  const modelName = assistantMetadata.value?.modelName;
  if (!modelName) return undefined;
  const parts = modelName.split("/");
  const providerName = parts.length > 1 ? parts[0] : undefined;
  return getModelAvatarPath(modelName, providerName) || undefined;
});

const assistantTime = computed(() => {
  const cache = turnsCache.value;
  if (cache.length === 0) {
    return { firendly: '', full: '' };
  }
  return {
    firendly: formatTime(cache[0]?.createdAt || '', 'friendly'),
    full: formatTime(cache[0]?.createdAt || '', 'full'),
  };
});

const totalDurationMs = computed(() => activeAssistant.value?.totalDurationMs ?? null);

const formatDuration = (ms: number): string => {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rest = Math.floor(s % 60);
  return `${m}m ${rest}s`;
};

const durationText = computed(() => {
  const ms = totalDurationMs.value;
  if (ms === null || ms === undefined) return null;
  return formatDuration(ms);
});

const tokenUsage = computed(() => {
  if (!turnsCache.value || turnsCache.value.length === 0) return null;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  for (const turn of turnsCache.value) {
    const usage = turn?.metadata?.usage;
    if (usage) {
      totalPromptTokens += usage.promptTokens || 0;
      totalCompletionTokens += usage.completionTokens || 0;
      totalTokens += usage.totalTokens || 0;
    }
  }
  if (totalTokens === 0) return null;
  return { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens, totalTokens };
});

const formatTokenNumber = (num: number | null): string => {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

// ============================================
// 图片预览
// ============================================
const previewList = computed(() => {
  const files = props.turn.user?.contents?.[0]?.files || [];
  return files.map((f: any) => f.url || f.previewUrl);
});

const handleImageClick = (index: number) => {
  currentPreViewIndex.value = index;
  showImageViewer.value = true;
};

// 代码复制
const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest('.copy-code-button')) {
    const button = target.closest('.copy-code-button') as HTMLElement;
    const codeBlock = button.closest('.custom-code-block');
    const codeElement = codeBlock?.querySelector('code');
    if (codeElement) {
      navigator.clipboard.writeText(codeElement.textContent).then(() => {
        toast.success(t('chat.turn.codeCopied'));
      }).catch(err => {
        console.error('复制失败:', err);
        toast.error(t('common.copyFailed'));
      });
    }
  }
};
</script>

<style scoped>
/* 三点打字动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #9ca3af;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 消息卡片悬停效果 */
.message-item--hover {
  position: relative;
  transition: box-shadow 0.2s ease;
}

.message-item--hover:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.turn-wrapper {
  width: 100%;
  margin-top: 20px;
  margin-bottom: 25px;
  contain: layout style;
  transition: opacity 0.3s ease;
}

.turn-wrapper.animate-in {
  animation: turn-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes turn-enter {
  from {
    opacity: 0;
    transform: translateY(120px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}


/* 消息卡片 */
.message-item__card {
  font-size: var(--size-text-base);
  max-width: 100%;
}

/* 用户消息气泡 */
.user-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-section .message-item__card {

  background-color: var(--color-bubble-user-bg);

  color: var(--color-bubble-user-text);

  padding: 5px 12px;

  border-radius: 16px;

  border: 1px solid var(--color-bubble-user-border);

}

.user-section .message-item__wrapper {
  align-items: flex-end;
  max-width: 80%;
}

/* 助手消息气泡 */
.assistant-section {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.assistant-section .message-item__card {
  background: var(--color-bubble-assitant-bg);
  color: var(--color-bubble-assitant-text);
  margin-right: auto;
  width: 100%;
  padding: 0;
  box-shadow: none;
  border: none;
}

.assistant-section .message-item__card strong {
  color: var(--color-bubble-assitant-text-strong);
}

.assistant-section .message-item__wrapper {
  align-items: flex-start;
  width: 100%;
}

/* 消息文本 */
.message-item__text {
  line-height: calc(var(--size-text-base) * 1.6);
  color: inherit;
  max-width: 100%;
  vertical-align: middle;
  font-size: var(--size-text-base);
}

.user-section .message-item__text {
  margin: 0;
}

.assistant-section .message-item__text {
  margin-bottom: 8px;
}

.message-item__wrapper {
  padding: 8px 0;
}

/* 系统消息 */
.system-message-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.system-message-icon {
  color: var(--el-color-warning);
}

.system-message-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.system-message-divider {
  height: 1px;
  background-color: var(--el-border-color-lighter);
  margin: 8px 0;
}

.system-message-body {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

/* 中间处理过程分组 */
.process-group {
  margin: 12px 0 12px 0;
}

.process-group:first-child {
  margin-top: 0;
}

.process-group__header {
  display: flex;
  align-items: center;
  max-width: 100%;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
}

:deep(.process-group__body .process-section:last-child .process-timeline) {
  display: none;
}

.process-group__header:hover {
  color: var(--el-text-color-primary);
}

.process-group__title {
  line-height: 1.4;
  min-width: 0;
}

/* 流式过程中的文字波纹效果（action + args 一起波纹） */
.shimmer-text {
  background: linear-gradient(90deg,
      var(--shimmer-base, #a8aab3) 0%,
      var(--shimmer-base, #a8aab3) 25%,
      var(--shimmer-highlight, #ffffff) 50%,
      var(--shimmer-base, #a8aab3) 75%,
      var(--shimmer-base, #a8aab3) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-slide 1.5s linear infinite;
}

@keyframes shimmer-slide {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

.process-group__collapsible {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.process-group__collapsible.is-expanded {
  grid-template-rows: 1fr;
}

.process-group__body {
  min-height: 0;
  overflow: hidden;
}

.process-group__body-scroll {
  overflow-y: auto;
  max-height: 400px;
  /* 真实遮罩渐变（不叠加背景色，壁纸不受影响） */
  -webkit-mask-image: linear-gradient(to bottom,
      transparent 0,
      black 16px,
      black calc(100% - 16px),
      transparent 100%);
  mask-image: linear-gradient(to bottom,
      transparent 0,
      black 16px,
      black calc(100% - 16px),
      transparent 100%);
}

/* 不可折叠的分组（单项内容）不需要遮罩和滚动限制 */
.process-group__body-scroll.no-mask {
  -webkit-mask-image: none;
  mask-image: none;
  max-height: none;
  overflow: visible;
}

/* 知识库 */
.knowledge-base-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Token 消耗 */
.token-usage-section {
  padding: 4px 0;
  animation: fadeIn 0.3s ease;
}

.dark .token-usage-section {
  opacity: 0.8;
}

.token-item {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  white-space: nowrap;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.max-iterations-notice {
  margin-top: 12px;
}
.token-arrow { display: inline-flex; align-items: center; }
.token-arrow-input { color: #52c41a; }
.token-arrow-output { color: #722ed1; }
.token-arrow-cache { color: #1677ff; }
.token-info-icon { color: var(--el-text-color-secondary); }
.token-popover { min-width: 160px; }
.token-popover-title { font-weight: 600; margin-bottom: 6px; }
.token-popover-row { display: flex; align-items: center; gap: 6px; justify-content: space-between; padding: 2px 0; font-size: 12px; }
.token-popover-val { font-weight: 500; }
.token-popover-divider { border-top: 1px solid var(--el-border-color); margin: 4px 0; }
.token-popover-total { font-weight: 600; }

/* 执行日志控制台 */
.trace-console {
  margin: 8px 0 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-blank);
}
.trace-console__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  color: var(--el-text-color-regular);
  transition: background-color 0.2s ease;
}
.trace-console__header:hover { background: var(--el-fill-color-light); }
.trace-console__icon { color: var(--el-text-color-secondary); }
.trace-console__title { font-size: 12px; font-weight: 500; }
.trace-console__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 9px;
  padding: 0 7px;
  line-height: 16px;
}
.trace-console__chevron {
  margin-left: auto;
  color: var(--el-text-color-secondary);
  transition: transform 0.25s ease;
  transform: rotate(-90deg);
}
.trace-console__chevron.is-open { transform: rotate(0deg); }
.trace-console__body {
  max-height: 280px;
  overflow-y: auto;
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 6px 10px;
  font-family: var(--el-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11.5px;
  line-height: 1.7;
}
.trace-line { display: flex; align-items: baseline; gap: 8px; white-space: pre-wrap; word-break: break-word; }
.trace-line__time { color: var(--el-text-color-placeholder); flex-shrink: 0; }
.trace-line__tag {
  flex-shrink: 0;
  min-width: 30px;
  color: var(--el-color-info);
}
.trace-line__tool { flex-shrink: 0; color: var(--el-color-primary); }
.trace-line__text { color: var(--el-text-color-regular); }
.trace-line--thinking .trace-line__tag { color: var(--el-color-primary); }
.trace-line--tool_call .trace-line__tag,
.trace-line--tool_args .trace-line__tag,
.trace-line--tool_result .trace-line__tag { color: var(--el-color-success); }
.trace-line--usage .trace-line__tag { color: var(--el-color-warning); }
.trace-line--edge .trace-line__tag { color: var(--el-color-danger); }
</style>
<style>
@import "@/assets/markdown.css";
@import 'highlight.js/styles/foundation.css';
.token-arrow { display: inline-flex; align-items: center; }
.token-arrow-input { color: #52c41a; }
.token-arrow-output { color: #722ed1; }
.token-arrow-cache { color: #1677ff; }
.token-info-icon { color: var(--el-text-color-secondary); }
.token-popover { min-width: 160px; }
.token-popover-title { font-weight: 600; margin-bottom: 6px; }
.token-popover-row { display: flex; align-items: center; gap: 6px; justify-content: space-between; padding: 2px 0; font-size: 12px; }
.token-popover-val { font-weight: 500; }
.token-popover-divider { border-top: 1px solid var(--el-border-color); margin: 4px 0; }
.token-popover-total { font-weight: 600; }
</style>