<template>
  <!--
    会话工作状态面板
    聚合展示当前会话的上下文占用与轮次统计（回答速度/模型耗时/工具耗时/步骤）
    以及上下文来源（技能 / MCP 服务器）。数据来源：
    - 上下文：useSessionTokenStats（REST + SSE contextStats）
    - 轮次统计：会话消息聚合（usage / totalDurationMs / toolDurationMs / 工具调用数）
    - 上下文来源：GET /skills、GET /mcp-servers（按启用过滤）
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
      <!-- 上下文 -->
      <div class="stat-section">
        <div class="row">
          <span class="label">上下文</span>
          <span class="value">{{ contextPercentText }}</span>
        </div>
        <div class="progress">
          <div class="progress-fill" :style="{ width: contextPercent + '%', background: progressColor }"></div>
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
          <div class="row">
            <span class="label">步骤</span>
            <span class="value">{{ stats.steps }}</span>
          </div>
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
            <span class="section-side">{{ fileChanges.length }} 个</span>
            <el-icon class="chevron" :class="{ collapsed: !filesExpanded }"><ArrowDown /></el-icon>
          </div>
          <div v-show="filesExpanded" class="section-body">
            <FileChangesBar :changes="fileChanges" @open-diff="openDiffDialog" />
          </div>
        </div>
      </template>
    </div>

    <FileDiffDialog v-model="diffDialogVisible" :entry="activeDiffEntry" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { Refresh, Close, ArrowDown, Timer, FolderOpened, Document } from '@element-plus/icons-vue';
import { apiService } from '@/services/ApiService';
import { useSessionStore } from '@/stores/session';
import { useSessionTokenStats } from '@/composables/useSessionTokenStats';
import { useFileChanges, type FileChangeEntry } from '@/composables/useFileChanges';
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
const sourcesExpanded = ref(true);
const filesExpanded = ref(true);

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

// 上下文占用
const contextPercent = computed(() => Math.round((tokenStats.value?.percentage || 0) * 10) / 10);
const contextPercentText = computed(() => `${contextPercent.value.toFixed(1)}%`);
const progressColor = computed(() => {
  const pct = contextPercent.value;
  if (pct >= 80) return '#f56c6c';
  if (pct >= 60) return '#e6a23c';
  return '#67c23a';
});

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

// 耗时格式化：<60s → "12s"，否则 "22m42s"
function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

const modelTimeText = computed(() => formatDuration(stats.value.modelDuration));
const toolTimeText = computed(() => formatDuration(stats.value.toolDuration));

// 上下文来源（技能 / MCP 服务器），模块级缓存避免重复请求
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
.session-status-panel {
  width: 280px;
  height: 100%;
  flex-shrink: 0;
  background: var(--color-surface, #fff);
  border-left: 1px solid var(--color-border, #e4e7ed);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border, #e4e7ed);
  background: var(--color-surface, #fff);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #303133);
}

.working-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #67c23a;
}

.working-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67c23a;
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
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-gray, #909399);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-btn:hover {
  background: var(--color-surface-hover, var(--color-sidebar-bg-hover, #f5f7fa));
  color: var(--color-text, #303133);
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
  background: var(--color-border, #e4e7ed);
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}

.label {
  color: var(--color-text-gray, #909399);
}

.value {
  color: var(--color-text, #303133);
  font-weight: 500;
}

.progress {
  width: 100%;
  height: 6px;
  margin-top: 8px;
  border-radius: 3px;
  background: var(--color-border, #e5e7eb);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #303133);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-icon {
  color: var(--color-text-gray, #909399);
}

.section-side {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-gray, #909399);
}

.chevron {
  margin-left: auto;
  color: var(--color-text-gray, #909399);
  transition: transform 0.2s ease;
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
</style>
