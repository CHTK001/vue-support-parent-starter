<template>
  <!--
    执行轨迹（管理端）
    左侧选会话、右侧看该会话的逐步执行轨迹（思考 / 检索 / 叙述 / 工具调用）。

    数据全部来自现有接口，无需后端新增：
    - 会话列表：GET /v2/sessions（分页 + 关键词）
    - 会话消息：GET /v2/sessions/{id}/messages
    轨迹顺序由 flattenContentsForTimeline(messages.contents) 决定，即原始发生顺序。
  -->
  <div class="trace-page">
    <!-- 左：会话列表 -->
    <aside class="trace-aside">
      <div class="aside-head">
        <span class="aside-title">会话</span>
        <span class="aside-count">{{ total }}</span>
      </div>
      <div class="aside-search">
        <el-input v-model="keyword" size="small" placeholder="搜索会话标题" clearable :prefix-icon="Search16Filled"
          @keyup.enter="reload" @clear="reload" />
      </div>
      <div class="aside-list">
        <div v-if="loadingSessions" class="aside-hint">加载中…</div>
        <template v-else>
          <div v-for="s in sessions" :key="s.id" class="session-item"
            :class="{ 'is-active': s.id === activeSessionId }" @click="selectSession(s.id)">
            <span class="session-title" :title="s.title">{{ s.title || '未命名会话' }}</span>
            <span class="session-meta">{{ formatTime(s.updatedAt || s.createdAt) }}</span>
          </div>
          <div v-if="!sessions.length" class="aside-hint">暂无会话</div>
          <div v-if="hasMore" class="aside-more" @click="loadMore">加载更多</div>
        </template>
      </div>
    </aside>

    <!-- 右：轨迹 -->
    <section class="trace-main">
      <template v-if="activeSessionId">
        <header class="main-head">
          <div class="main-title">
            <el-icon><ClipboardPulse20Filled /></el-icon>
            <span class="title-text" :title="activeSession?.title">{{ activeSession?.title || '未命名会话' }}</span>
          </div>
          <div class="main-stats">
            <span>消息 {{ messageCount }}</span>
            <span class="dot">·</span>
            <span>步骤 {{ stepCount }}</span>
            <span class="dot">·</span>
            <span>工具 {{ toolCallCount }}</span>
          </div>
        </header>

        <div class="main-body">
          <div v-if="loadingMessages" class="main-hint">加载轨迹中…</div>
          <div v-else-if="loadError" class="main-hint is-error">{{ loadError }}</div>
          <ProcessTimeline v-else-if="timelineItems.length" :items="timelineItems" :show-process="true" />
          <div v-else class="main-hint">该会话还没有可展示的执行步骤</div>
        </div>
      </template>
      <div v-else class="main-hint">从左侧选择一个会话查看执行轨迹</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElIcon, ElInput } from 'element-plus';
import { Search16Filled, ClipboardPulse20Filled } from '@vicons/fluent';
import { apiService } from '@/services/ApiService';
import { flattenContentsForTimeline, type DisplayItem } from '@/utils/messageUtils';
import ProcessTimeline from '@/components/chat/message-item/ProcessTimeline.vue';

const PAGE_SIZE = 50;

const sessions = ref<any[]>([]);
const total = ref(0);
const keyword = ref('');
const loadingSessions = ref(false);
let skip = 0;

const activeSessionId = ref<string | null>(null);
const activeMessages = ref<any[]>([]);
const loadingMessages = ref(false);
const loadError = ref('');

const activeSession = computed(() =>
  sessions.value.find((s) => s.id === activeSessionId.value) || null,
);

const hasMore = computed(() => sessions.value.length < total.value);

const messageCount = computed(() => activeMessages.value.length);

/** 轨迹项：按发生顺序拍平每条助手消息的内容 */
const timelineItems = computed<DisplayItem[]>(() => {
  const out: DisplayItem[] = [];
  for (const msg of activeMessages.value) {
    if (!msg || msg.role !== 'assistant') continue;
    out.push(...flattenContentsForTimeline(msg.contents || []));
  }
  return out;
});

const toolCallCount = computed(() => {
  let n = 0;
  for (const item of timelineItems.value) {
    if (item.type === 'tool') n += item.toolCalls?.length || 0;
  }
  return n;
});

/** 步骤数：思考 / 检索 / 每次工具调用各算一步 */
const stepCount = computed(() => {
  let n = 0;
  for (const item of timelineItems.value) {
    if (item.type === 'tool') n += item.toolCalls?.length || 0;
    else if (item.type === 'think' || item.type === 'search') n += 1;
  }
  return n;
});

/** 兼容 {"items": [...]} 与裸数组两种返回 */
function pickList(res: any): any[] {
  if (Array.isArray(res)) return res;
  return res?.items || res?.data?.items || [];
}

async function loadSessions(reset = false) {
  if (loadingSessions.value) return;
  loadingSessions.value = true;
  try {
    if (reset) {
      skip = 0;
      sessions.value = [];
    }
    const res: any = await apiService.fetchSessions(
      skip,
      PAGE_SIZE,
      undefined,
      keyword.value || undefined,
    );
    const list = pickList(res);
    sessions.value = reset ? list : [...sessions.value, ...list];
    total.value = res?.total ?? res?.data?.total ?? sessions.value.length;
    skip = sessions.value.length;
  } catch (error) {
    console.error('[SessionTrace] 加载会话列表失败:', error);
  } finally {
    loadingSessions.value = false;
  }
}

function reload() {
  loadSessions(true);
}

function loadMore() {
  loadSessions(false);
}

async function selectSession(sessionId: string) {
  activeSessionId.value = sessionId;
  activeMessages.value = [];
  loadError.value = '';
  loadingMessages.value = true;
  try {
    const res: any = await apiService.fetchSessionMessages(sessionId);
    activeMessages.value = pickList(res);
  } catch (error: any) {
    console.error('[SessionTrace] 加载会话消息失败:', error);
    loadError.value = '加载消息失败，请稍后重试';
  } finally {
    loadingMessages.value = false;
  }
}

/** 时间戳兼容：后端给的是毫秒时间戳字符串 */
function formatTime(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  const ms = /^\d+$/.test(text) ? Number(text) : new Date(text).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

onMounted(() => {
  loadSessions(true);
});
</script>

<style scoped>
.trace-page {
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-bg, #fff);
}

/* ---------- 左侧会话列表 ---------- */
.trace-aside {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border, #e4e7ed);
  overflow: hidden;
}

.aside-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #303133);
}

.aside-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-gray, #909399);
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

.aside-search {
  padding: 0 12px 8px;
}

.aside-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;
}

.session-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.session-item:hover {
  background: var(--color-surface-hover, var(--color-sidebar-bg-hover, #f5f7fa));
}

.session-item.is-active {
  background: var(--color-surface-hover, var(--color-sidebar-bg-hover, #f5f7fa));
}

.session-title {
  font-size: 13px;
  color: var(--color-text, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-meta {
  font-size: 11px;
  color: var(--color-text-gray, #909399);
}

.aside-hint,
.main-hint {
  padding: 12px;
  font-size: 12px;
  color: var(--color-text-gray, #909399);
  text-align: center;
}

.aside-more {
  padding: 8px;
  font-size: 12px;
  text-align: center;
  color: #409eff;
  cursor: pointer;
}

/* ---------- 右侧轨迹 ---------- */
.trace-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--color-border, #e4e7ed);
}

.main-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #303133);
}

.main-title .title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-stats {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-gray, #909399);
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
}

.main-stats .dot {
  opacity: 0.5;
}

.main-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 18px 24px;
}

.main-hint.is-error {
  color: #f56c6c;
}
</style>
