<template>
  <!--
    会话工作状态面板
    聚合展示当前会话的概要、上下文占用与 token 明细、轮次统计（回答速度/模型耗时/工具耗时/步骤）、
    工具调用明细、上下文来源（技能 / MCP 服务器）以及本次会话修改的文件。数据来源：
    - 上下文：useSessionTokenStats（REST + SSE contextStats），含 breakdown 五分量
    - 会话概要：sessionStore.getSession（模型/创建时间）+ 会话消息聚合（消息数/累计 token/时长）
    - 轮次统计：会话消息聚合（usage / totalDurationMs / toolDurationMs / 工具调用数）
    - 工具调用明细：会话消息的 metadata.toolCalls 按 name 聚合（次数/失败数/占比）
    - 上下文来源：GET /skills、GET /mcp-servers（按启用过滤）
    - 修改的文件：write/edit 工具调用经 useFileChanges 按 filePath 聚合（自带增删行数）
  -->
  <div class="session-status-panel">
    <div class="panel-header">
      <span class="panel-title">
        <span class="title-text">会话</span>
        <span v-if="isWorking" class="working-badge">
          <span class="working-dot"></span>
          工作中
        </span>
      </span>
      <span class="panel-actions">
        <button class="icon-btn" :title="'刷新'" :disabled="loading" @click="refresh">
          <el-icon :class="{ spinning: loading }"><Refresh /></el-icon>
        </button>
        <button class="icon-btn" title="关闭" @click="emit('close')">
          <el-icon><Close /></el-icon>
        </button>
      </span>
    </div>

    <div class="panel-content">
      <!-- 会话概要 -->
      <div class="stat-section">
        <div class="row">
          <span class="label">模型</span>
          <span class="value ellipsis" :title="overview.modelName">{{ overview.modelName || '—' }}</span>
        </div>
        <div class="row">
          <span class="label">消息</span>
          <span class="value">{{ overview.userMessages }} 问 / {{ overview.assistantMessages }} 答</span>
        </div>
        <div class="row">
          <span class="label">会话时长</span>
          <span class="value">{{ overview.durationText }}</span>
        </div>
        <div class="row">
          <span class="label">累计消耗</span>
          <span class="value">{{ overview.totalTokensText }}</span>
        </div>
        <div class="row">
          <span class="label">输入 / 输出</span>
          <span class="value">{{ overview.ioText }}</span>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 上下文 -->
      <div class="stat-section">
        <div class="row">
          <span class="label">上下文</span>
          <span class="value">{{ contextPercentText }}</span>
        </div>
        <div class="progress">
          <div class="progress-fill" :style="{ width: contextPercent + '%', background: progressColor }"></div>
        </div>
        <div class="token-numbers">
          <span>已用 <b>{{ formatTokens(usedTokens) }}</b></span>
          <span>剩余 <b>{{ formatTokens(remainingTokens) }}</b></span>
        </div>

        <!-- token 构成明细：系统提示 / 摘要 / 用户输入 / 历史消息 / 工具定义 -->
        <div v-if="breakdownRows.length" class="breakdown">
          <div v-for="row in breakdownRows" :key="row.key" class="bd-row">
            <span class="bd-label" :title="row.label">{{ row.label }}</span>
            <span class="bd-bar">
              <i :style="{ width: row.percent + '%', background: row.color }"></i>
            </span>
            <span class="bd-value">{{ formatTokens(row.value) }}</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 轮次统计 -->
      <div class="stat-section">
        <div class="section-header" @click="turnsExpanded = !turnsExpanded">
          <span class="section-title">
            <el-icon class="section-icon"><Timer /></el-icon>
            <span>轮次统计</span>
          </span>
          <el-icon class="chevron" :class="{ collapsed: !turnsExpanded }"><ArrowDown /></el-icon>
        </div>
        <div v-show="turnsExpanded" class="section-body">
          <div class="row">
            <span class="label">回答速度</span>
            <span class="value">{{ speedText }}</span>
          </div>
          <div class="row">
            <span class="label">模型耗时</span>
            <span class="value">{{ modelTimeText }}</span>
          </div>
          <div class="row">
            <span class="label">工具耗时</span>
            <span class="value">{{ toolTimeText }}</span>
          </div>
          <div class="row row--clickable" @click="stepsExpanded = !stepsExpanded">
            <span class="label">步骤</span>
            <span class="value step-toggle-value">
              {{ stats.steps }}
              <el-icon class="chevron-inline" :class="{ collapsed: !stepsExpanded }"><ArrowDown /></el-icon>
            </span>
          </div>
          <!-- 步骤明细：按发生顺序的时间线（思考 / 检索 / 工具调用逐步展开） -->
          <div v-show="stepsExpanded" class="step-detail">
            <template v-if="stepItems.length">
              <div v-for="(step, i) in stepItems" :key="step.id" class="step-row" :class="{ 'is-failed': step.failed }">
                <span class="step-index">{{ i + 1 }}</span>
                <el-icon class="step-icon" :style="step.failed ? { color: '#f56c6c' } : undefined">
                  <component :is="step.icon" />
                </el-icon>
                <span class="step-label" :title="step.label">{{ step.label }}</span>
                <span v-if="step.detail" class="step-arg" :title="step.detail">{{ step.detail }}</span>
              </div>
            </template>
            <div v-else class="empty-hint">尚未产生步骤</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 工具调用明细 -->
      <div class="stat-section">
        <div class="section-header" @click="toolsExpanded = !toolsExpanded">
          <span class="section-title">
            <el-icon class="section-icon"><Tools /></el-icon>
            <span>工具调用</span>
          </span>
          <span class="section-side">{{ toolRows.length ? `${stats.steps} 次` : '' }}</span>
          <el-icon class="chevron" :class="{ collapsed: !toolsExpanded }"><ArrowDown /></el-icon>
        </div>
        <div v-show="toolsExpanded" class="section-body">
          <template v-if="toolRows.length">
            <div v-for="row in toolRows" :key="row.name" class="tool-row">
              <span class="tool-name" :title="row.name">{{ row.name }}</span>
              <span class="bd-bar">
                <i :style="{ width: row.percent + '%', background: '#409eff' }"></i>
              </span>
              <span class="bd-value">{{ row.count }} 次</span>
            </div>
            <div v-if="failedToolCount" class="tool-failed">
              {{ failedToolCount }} 次失败
            </div>
          </template>
          <div v-else class="empty-hint">尚未调用工具</div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- 上下文来源 -->
      <div class="stat-section">
        <div class="section-header" @click="sourcesExpanded = !sourcesExpanded">
          <span class="section-title">
            <el-icon class="section-icon"><FolderOpened /></el-icon>
            <span>上下文来源</span>
          </span>
          <span class="section-side">{{ skillCount }} 个技能</span>
          <el-icon class="chevron" :class="{ collapsed: !sourcesExpanded }"><ArrowDown /></el-icon>
        </div>
        <div v-show="sourcesExpanded" class="section-body">
          <div class="row">
            <span class="label">技能</span>
            <span class="value">{{ skillCount }} 个技能</span>
          </div>
          <div class="row">
            <span class="label">MCP 服务器</span>
            <span class="value">{{ mcpCount }}</span>
          </div>
        </div>
      </div>

      <!-- 本次会话修改的文件（来自 write/edit 工具调用，不依赖后端文件树接口） -->
      <template v-if="fileChanges.length > 0">
        <div class="divider"></div>

        <div class="stat-section">
          <div class="section-header" @click="filesExpanded = !filesExpanded">
            <span class="section-title">
              <el-icon class="section-icon"><Document /></el-icon>
              <span>修改的文件</span>
            </span>
            <span class="section-side">{{ fileDiffStatText }}</span>
            <el-icon class="chevron" :class="{ collapsed: !filesExpanded }"><ArrowDown /></el-icon>
          </div>
          <div v-show="filesExpanded" class="section-body">
            <!-- 面板外层已有折叠头，这里让内层列表默认展开，直接看到每个文件的增删行数 -->
            <FileChangesBar :changes="fileChanges" default-expanded @open-diff="openDiffDialog" />
          </div>
        </div>
      </template>
    </div>

    <FileDiffDialog v-model="diffDialogVisible" :entry="activeDiffEntry" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Refresh, Close, ArrowDown, Timer, FolderOpened, Document, Tools } from '@element-plus/icons-vue';
import { BrainCircuit20Regular, Search16Filled } from '@vicons/fluent';
import { apiService } from '@/services/ApiService';
import { useSessionStore } from '@/stores/session';
import { useSessionTokenStats } from '@/composables/useSessionTokenStats';
import { useFileChanges, type FileChangeEntry } from '@/composables/useFileChanges';
import { flattenContentsForTimeline } from '@/utils/messageUtils';
import { getToolIcon, getToolConfig, getArgsText, resolveToolName } from '@/utils/toolDisplay';
import FileChangesBar from './message-item/FileChangesBar.vue';
import FileDiffDialog from './message-item/FileDiffDialog.vue';

const props = defineProps<{
  sessionId?: string;
  messages?: any[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const sessionStore = useSessionStore();

const sessionIdRef = computed(() => props.sessionId || null);
const { tokenStats, loading, fetchTokenStats } = useSessionTokenStats(sessionIdRef);

// 工作中状态（与侧边栏/流状态一致）
const isWorking = computed(() =>
  sessionIdRef.value ? sessionStore.sessionIsStreaming(sessionIdRef.value) : false,
);

// 折叠状态（默认展开）
const turnsExpanded = ref(true);
const toolsExpanded = ref(true);
const sourcesExpanded = ref(true);
const filesExpanded = ref(true);
const stepsExpanded = ref(false);

// 会话级文件变更：把整会话消息的 contents 摊平后交给 useFileChanges，
// 由它按 filePath 聚合并用 diffLines 算增删行（与单条消息内的展示同一套逻辑）
const allContents = computed<any[]>(() => {
  const list: any[] = [];
  for (const msg of props.messages || []) {
    for (const content of msg?.contents || []) {
      list.push(content);
    }
  }
  return list;
});
const { fileChanges } = useFileChanges(allContents as any);

// Diff 弹窗
const diffDialogVisible = ref(false);
const activeDiffEntry = ref<FileChangeEntry | null>(null);

function openDiffDialog(entry: FileChangeEntry) {
  activeDiffEntry.value = entry;
  diffDialogVisible.value = true;
}

// ============ 通用格式化 ============

/**
 * token 数格式化：超过 1000 走 k/M，避免在 280px 面板里挤爆。
 */
function formatTokens(n: number): string {
  const value = Number(n) || 0;
  if (value <= 0) return '0';
  if (value < 1000) return String(value);
  if (value < 1000 * 1000) {
    const k = value / 1000;
    return `${k < 10 ? k.toFixed(1) : Math.round(k)}k`;
  }
  const m = value / (1000 * 1000);
  return `${m < 10 ? m.toFixed(1) : Math.round(m)}M`;
}

/**
 * 时长格式化（单次耗时用）：<60s → "12s"，否则 "22m42s"
 */
function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

/**
 * 跨度格式化（会话时长用，跨度可能到小时/天，故与单次耗时分开）
 */
function formatSpan(ms: number): string {
  if (!ms || ms <= 0) return '—';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return '不到 1 分钟';
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest ? `${hours} 小时 ${rest} 分` : `${hours} 小时`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} 天 ${restHours} 小时` : `${days} 天`;
}

/**
 * 时间 → 毫秒时间戳；解析不了返回 0。
 *
 * 注意后端返回的 createdAt / updatedAt 是**毫秒时间戳的字符串**
 * （形如 "1790523862000"），不是 ISO 串。直接丢给 new Date() 会得到
 * Invalid Date，导致会话时长恒为 0，所以必须先识别纯数字。
 */
function toTime(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);
  const parsed = new Date(text).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * 从 modelId 截出模型名：取最后一个冒号之后的部分。
 * modelId 形如 "<providerId>:<modelName>"，没有冒号时原样返回。
 */
function modelNameFromId(modelId?: string | null): string {
  if (!modelId) return '';
  const text = String(modelId);
  const colon = text.lastIndexOf(':');
  return colon >= 0 ? text.slice(colon + 1) : text;
}

// ============ 会话概要 ============

const currentSession = computed(() =>
  props.sessionId ? sessionStore.getSession(props.sessionId) : undefined,
);

const overview = computed(() => {
  const messages = props.messages || [];

  let userMessages = 0;
  let assistantMessages = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  for (const msg of messages) {
    if (!msg) continue;
    if (msg.role === 'user') userMessages += 1;
    if (msg.role !== 'assistant') continue;
    assistantMessages += 1;

    const usage = msg.metadata?.usage;
    if (!usage) continue;
    const p = usage.promptTokens || 0;
    const c = usage.completionTokens || 0;
    promptTokens += p;
    completionTokens += c;
    // 后端给了 total 就用它，否则自行相加
    totalTokens += usage.totalTokens || p + c;
  }

  const created = toTime(currentSession.value?.createdAt);
  const ended = toTime(currentSession.value?.lastActiveAt || currentSession.value?.updatedAt);
  const duration = created && ended && ended > created ? ended - created : 0;

  // modelId 形如 "<providerId>:<modelName>"（如 "1790518072240:agnes-3.0-flash"），
  // 会话详情并不返回 model 对象，故这里从 modelId 截出可读名兜底。
  const modelName =
    currentSession.value?.model?.modelName
    || tokenStats.value?.modelName
    || modelNameFromId(currentSession.value?.modelId);

  return {
    modelName,
    userMessages,
    assistantMessages,
    durationText: formatSpan(duration),
    totalTokensText: totalTokens > 0 ? formatTokens(totalTokens) : '—',
    ioText:
      promptTokens || completionTokens
        ? `${formatTokens(promptTokens)} / ${formatTokens(completionTokens)}`
        : '—',
  };
});

// ============ 上下文占用与 token 明细 ============

const usedTokens = computed(() => tokenStats.value?.usedTokens || 0);
const remainingTokens = computed(() => tokenStats.value?.remainingTokens || 0);
const contextPercent = computed(() => Math.round((tokenStats.value?.percentage || 0) * 10) / 10);
const contextPercentText = computed(() => `${contextPercent.value.toFixed(1)}%`);
const progressColor = computed(() => {
  const pct = contextPercent.value;
  if (pct >= 80) return '#f56c6c';
  if (pct >= 60) return '#e6a23c';
  return '#67c23a';
});

/**
 * token 构成的五个分量，各自占已用 token 的比例。
 * 数据来自 useSessionTokenStats 的 breakdown，后端随 contextStats 一起下发。
 */
const BREAKDOWN_META = [
  { key: 'systemPrompt', label: '系统提示', color: '#409eff' },
  { key: 'summary', label: '摘要', color: '#909399' },
  { key: 'userPrompt', label: '用户输入', color: '#67c23a' },
  { key: 'history', label: '历史消息', color: '#e6a23c' },
  { key: 'tools', label: '工具定义', color: '#f56c6c' },
] as const;

const breakdownRows = computed(() => {
  const breakdown = tokenStats.value?.breakdown;
  if (!breakdown) return [];

  const raw = BREAKDOWN_META
    .map((meta) => ({ ...meta, value: (breakdown as any)[meta.key] || 0 }))
    .filter((r) => r.value > 0);

  // 分量之和未必等于 usedTokens（后端可能还有未归类的部分），
  // 故以分量之和为分母，保证占比之和为 100%，条形长度才不失真。
  const sum = raw.reduce((acc, r) => acc + r.value, 0);
  return raw.map((r) => ({
    ...r,
    percent: sum > 0 ? Math.round((r.value / sum) * 1000) / 10 : 0,
  }));
});

// ============ 轮次统计 ============

/**
 * 从当前会话消息聚合的轮次统计
 * - completion：输出 token 合计（用于回答速度）
 * - duration：助手消息总耗时合计
 * - toolDuration：工具执行耗时合计（流式期间采集，历史消息缺失时为 0）
 * - steps：工具调用步数合计
 */
const stats = computed(() => {
  let completion = 0;
  let duration = 0;
  let toolDuration = 0;
  let steps = 0;

  for (const msg of props.messages || []) {
    if (!msg || msg.role !== 'assistant') continue;

    const usage = msg.metadata?.usage;
    if (usage) completion += usage.completionTokens || 0;

    duration += msg.totalDurationMs || 0;
    toolDuration += msg.toolDurationMs || 0;

    for (const content of msg.contents || []) {
      steps += content?.metadata?.toolCalls?.length || 0;
    }
  }

  // 模型耗时 = 总耗时 - 工具执行耗时（不低于 0）
  const modelDuration = Math.max(0, duration - toolDuration);
  const tokensPerSecond = duration > 0 ? completion / (duration / 1000) : 0;

  return { completion, duration, toolDuration, modelDuration, steps, tokensPerSecond };
});

// 回答速度（tok/s）
const speedText = computed(() => {
  const tps = stats.value.tokensPerSecond;
  if (!tps || tps <= 0) return '—';
  return `~${Math.round(tps)} tok/s`;
});

const modelTimeText = computed(() => formatDuration(stats.value.modelDuration));
const toolTimeText = computed(() => formatDuration(stats.value.toolDuration));

// ============ 步骤明细（按发生顺序的时间线） ============

/**
 * 会话级步骤时间线：把每条助手消息的 contents 按发生顺序拍平，
 * 只取「过程」项（思考 / 检索 / 工具调用），跳过正文。
 *
 * 与「工具调用」区块的区别：那边是按工具名聚合的次数统计，
 * 这里是**有序的逐步列表**，能看清 Agent 先想了什么、再调了什么。
 *
 * 说明：后端未下发逐步耗时（traceLog 恒为空），故每行只给名称与参数摘要。
 */
const stepItems = computed(() => {
  const out: Array<{
    id: string;
    icon: any;
    label: string;
    detail: string;
    failed: boolean;
  }> = [];

  for (const msg of props.messages || []) {
    if (!msg || msg.role !== 'assistant') continue;

    for (const item of flattenContentsForTimeline(msg.contents || [])) {
      if (item.type === 'think') {
        const text = (item.reasoningContent || '').replace(/\s+/g, ' ').trim();
        out.push({
          id: item.id,
          icon: BrainCircuit20Regular,
          label: '思考',
          detail: text.length > 72 ? `${text.slice(0, 72)}…` : text,
          failed: false,
        });
      } else if (item.type === 'search') {
        out.push({
          id: item.id,
          icon: Search16Filled,
          label: '检索',
          detail: item.searchQuery || '',
          failed: false,
        });
      } else if (item.type === 'tool') {
        for (const [tcIndex, tc] of (item.toolCalls || []).entries()) {
          const name = resolveToolName(tc);
          const failed = !!tc.outcome && tc.outcome !== 'success';
          const config = getToolConfig(tc);
          out.push({
            id: `${item.id}-${tc.index ?? tcIndex}`,
            icon: getToolIcon(tc),
            label: name || config.text.completed || '工具',
            detail: getArgsText(tc) || '',
            failed,
          });
        }
      }
    }
  }

  return out;
});

// ============ 工具调用明细 ============

/**
 * 按工具名聚合调用次数。
 *
 * 注意：只能给出「次数 / 失败数 / 占比」，**给不出单个工具的耗时** ——
 * 后端 SSE 的 toolCallsResponse 只有 outcome，没有 duration，
 * 且 trace 事件后端目前完全没发（traceLog 恒为空），
 * 所以耗时只能在消息级聚合（见 stats.toolDuration）。
 */
const toolRows = computed(() => {
  const counter = new Map<string, { count: number; failed: number }>();
  let total = 0;

  for (const msg of props.messages || []) {
    for (const content of msg?.contents || []) {
      const toolCalls = content?.metadata?.toolCalls;
      if (!Array.isArray(toolCalls)) continue;

      for (const tc of toolCalls) {
        const name = tc?.name;
        if (!name) continue;
        let row = counter.get(name);
        if (!row) {
          row = { count: 0, failed: 0 };
          counter.set(name, row);
        }
        row.count += 1;
        if (tc.outcome && tc.outcome !== 'success') row.failed += 1;
        total += 1;
      }
    }
  }

  return Array.from(counter.entries())
    .map(([name, row]) => ({
      name,
      count: row.count,
      failed: row.failed,
      percent: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});

const failedToolCount = computed(() =>
  toolRows.value.reduce((sum, r) => sum + r.failed, 0),
);

// ============ 修改的文件 ============

const fileDiffStatText = computed(() => {
  let added = 0;
  let removed = 0;
  for (const entry of fileChanges.value) {
    added += entry.totalAdded;
    removed += entry.totalRemoved;
  }
  return `+${added} −${removed}`;
});

// ============ 上下文来源（技能 / MCP 服务器） ============

const skillCount = ref(0);
const mcpCount = ref(0);
let sourcesLoaded = false;

async function loadSources(force = false) {
  if (sourcesLoaded && !force) return;
  try {
    const skills: any = await apiService.fetchSkills();
    const skillList = Array.isArray(skills) ? skills : (skills?.items || []);
    skillCount.value = skillList.filter((s: any) => s?.enabled !== false).length;
    sourcesLoaded = true;
  } catch (error) {
    console.warn('[SessionStatusPanel] 加载技能数量失败:', error);
  }
  try {
    const servers: any = await apiService.getMcpServers();
    const serverList = Array.isArray(servers) ? servers : (servers?.items || []);
    mcpCount.value = serverList.filter((s: any) => !!s?.enabled).length;
    sourcesLoaded = true;
  } catch (error) {
    console.warn('[SessionStatusPanel] 加载 MCP 服务器数量失败:', error);
  }
}

async function refresh() {
  await Promise.all([fetchTokenStats(), loadSources(true)]);
}

watch(() => props.sessionId, () => {
  if (props.sessionId) loadSources();
}, { immediate: true });

onMounted(() => {
  if (props.sessionId) fetchTokenStats();
});
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色一律走 --el-*。本应用 refactor.css 已把 --el-* 映射到 --color-* 主题层
      （--el-bg-color-overlay → var(--color-surface)、--el-text-color-primary →
      var(--color-text)、--el-color-primary → var(--color-primary)），所以
      public/themes 下 9 套配色（y2k / 蒸汽朋克 / 赛博朋克 …）换肤时依然生效，
      不必再自己写 var(--color-*, #写死兜底)。
   2. 卡片 / 容器一律不加投影（koi 规约）：层次靠 1px 分隔线与留白表达。
      本文件唯一允许的 box-shadow 是键盘焦点环。
   3. 圆角、过渡时长统一取 --el-radius-* / --el-transition-duration 令牌。
   ============================================================================ */

/* 面板容器：靠左侧 1px 分割线与消息区区分层次，不用投影 */
.session-status-panel {
  width: 280px;
  height: 100%;
  flex-shrink: 0;
  background: var(--el-bg-color-overlay);
  border-left: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 「工作中」是运行中语义（成功态），不是普通正文色 */
.working-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--el-color-success);
}

.working-dot {
  width: 6px;
  height: 6px;
  /* 原值 50%（圆形）；6px 圆点用 full 令牌与 50% 视觉等价，且不再留魔法值 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-success);
  animation: working-pulse 1.2s ease-in-out infinite;
}

@keyframes working-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 键盘焦点环：24px 的小图标按钮上浏览器默认 outline 几乎看不清，改用主色光环 */
.icon-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.icon-btn:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.icon-btn:disabled {
  cursor: default;
  opacity: 0.6;
}

.icon-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.stat-section {
  display: flex;
  flex-direction: column;
}

.divider {
  height: 1px;
  margin: 12px 0;
  background: var(--el-border-color-lighter);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.label {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  text-align: right;
  min-width: 0;
}

/* 长模型名等在 280px 面板里必须截断，否则会把整行撑开 */
.value.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 进度槽：语义是「底槽填充」而非描边，故取 --el-fill-color（原值 #e5e7eb） */
.progress {
  width: 100%;
  height: 6px;
  margin-top: 8px;
  /* 原值 3px，恰为 6px 槽高的一半即胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}

/* 填充色由模板内联 style 给出（progressColor 按占用率取 危险/警告/成功），
   这里只负责形状与动效，故不写死颜色 */
.progress-fill {
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  transition: width var(--el-transition-duration-fast, 0.2s) ease;
}

/* 已用 / 剩余 具体数字 */
.token-numbers {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.token-numbers b {
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

/* token 构成明细：标签 / 占比条 / 数值 三列 */
.breakdown {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.bd-row,
.tool-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 11px;
}

.bd-label,
.tool-name {
  width: 48px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

.tool-name {
  width: 64px;
  color: var(--el-text-color-primary);
}

/* 占比条底槽：同 .progress，取填充色令牌 */
.bd-bar {
  flex: 1;
  min-width: 20px;
  height: 5px;
  /* 原值 3px（略大于半高），视觉上仍是胶囊，取 full 档 */
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}

.bd-bar i {
  display: block;
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  transition: width var(--el-transition-duration-fast, 0.2s) ease;
}

.bd-value {
  width: 40px;
  flex-shrink: 0;
  text-align: right;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  color: var(--el-text-color-primary);
}

.tool-failed {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-color-danger);
}

.empty-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 可点击的折叠头（div + @click，不是 button）：光标与焦点环都要自己给 */
.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  cursor: pointer;
  user-select: none;
  outline: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-header:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-icon {
  color: var(--el-text-color-secondary);
}

.section-side {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

.chevron {
  margin-left: auto;
  color: var(--el-text-color-secondary);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

.section-side + .chevron {
  margin-left: 0;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.section-body {
  margin-top: 6px;
}

/* ============ 步骤明细 ============ */

.row--clickable {
  cursor: pointer;
  user-select: none;
  outline: none;
}

.row--clickable:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.step-toggle-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chevron-inline {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}

.chevron-inline.collapsed {
  transform: rotate(-90deg);
}

.step-detail {
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
  max-height: 260px;
  overflow-y: auto;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
  font-size: 11px;
  min-width: 0;
}

.step-index {
  width: 18px;
  flex-shrink: 0;
  text-align: right;
  color: var(--el-text-color-secondary);
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  opacity: 0.7;
}

.step-icon {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 失败态图标：此处令牌化后会被模板里的内联 :style 覆盖（那里仍写死色），
   保留本规则是为了将来去掉内联样式时颜色已是对的 */
.step-row.is-failed .step-icon {
  color: var(--el-color-danger);
}

.step-label {
  flex-shrink: 0;
  max-width: 84px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.step-arg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

/* 尊重系统「减少动态效果」偏好：脉冲 / 旋转属纯装饰，一律关掉 */
@media (prefers-reduced-motion: reduce) {
  .working-dot,
  .icon-btn .spinning {
    animation: none;
  }
  .icon-btn,
  .progress-fill,
  .bd-bar i,
  .chevron,
  .chevron-inline {
    transition: none;
  }
}
</style>
