<script setup lang="ts">
/**
 * ProjectLogColumn —— 单项目系统日志列。
 *
 * <p>发布管理页的系统日志既要能「贴在项目管理下方多项目并排看」，又要能
 * 单独弹窗放大看，两种形态的滚动跟随逻辑完全一样。抽成一个组件，
 * 避免同一套 DOM/事件在页面里写两份、日后只改一处。</p>
 *
 * <p>自动滚动状态由组件自己维护（用户在日志里上滚即暂停跟随，回到底部恢复），
 * 通过 `v-model:auto-scroll` 暴露给父组件，父组件不需要关心滚动细节。</p>
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import ReIcon from '@repo/ui/re-icon';
import { http, unwrapResult } from '@repo/utils';

defineOptions({ name: 'ProjectLogColumn' });

const props = withDefaults(
  defineProps<{
    /** 列标题（项目名） */
    title: string;
    /** 日志来源（项目配置的 logPath，悬停可见完整路径） */
    source?: string;
    /** 日志行 */
    lines: string[];
    /** 采集失败等提示（不放进 lines，避免被快照整段替换冲掉） */
    notice?: string;
    /** 实时推送是否掉线（掉线时提示走快照轮询） */
    pushOffline?: boolean;
    /** 是否处于弹窗形态（弹窗里不再显示「弹窗」按钮，高度也改成视口比例） */
    popup?: boolean;
    /** 项目标识：给出后才允许后端检索日志 */
    projectId?: number;
  }>(),
  {
    source: '',
    notice: '',
    pushOffline: false,
    popup: false,
    projectId: 0,
  },
);

const emit = defineEmits<{
  (e: 'popup'): void;
  (e: 'close'): void;
}>();

const autoScroll = defineModel<boolean>('autoScroll', { default: true });

const boxEl = ref<HTMLElement | null>(null);
/** 距底部小于该阈值(px)视为仍贴底，保持自动滚动 */
const STICK_THRESHOLD = 24;

function scrollToBottom() {
  const el = boxEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

function onScroll() {
  const el = boxEl.value;
  if (!el) return;
  const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
  autoScroll.value = dist < STICK_THRESHOLD;
}

function resume() {
  autoScroll.value = true;
  nextTick(scrollToBottom);
}

/** 新行到达：仅当仍贴底时跟随，用户上滚查看历史不打断 */
watch(
  () => props.lines.length,
  () => {
    if (autoScroll.value) nextTick(scrollToBottom);
  },
);

/** 快照整段替换（长度可能不变）时也要跟随 */
watch(
  () => props.lines,
  () => {
    if (autoScroll.value) nextTick(scrollToBottom);
  },
);

watch(autoScroll, (on) => {
  if (on) nextTick(scrollToBottom);
});

defineExpose({ scrollToBottom });

// ---- 日志检索：本地过滤（当前已加载的行）+ 后端检索（目标主机上检索整份文件） ----
const BASE = '/ms/server/release';
/** 一次检索最多回传的行数，与后端默认一致 */
const SEARCH_MAX_LINES = 500;

interface LogSearchResult {
  keyword: string;
  source: string;
  lines: string[];
  matched: number;
  truncated: boolean;
  elapsedMs: number;
  fileSize: number | null;
}

/** 检索模式：local=只过滤当前视图；remote=下发到项目所在主机检索整份日志 */
type SearchMode = 'local' | 'remote';

const searchOpen = ref(false);
const searchMode = ref<SearchMode>('local');
const searchKeyword = ref('');
const searchMatchCase = ref(false);
const searching = ref(false);
const searchError = ref('');
const searchResult = ref<LogSearchResult | null>(null);
/** 后端检索进行中的实时计时（毫秒），用于「已用」与预计耗时对照 */
const searchElapsedMs = ref(0);
/** 本项目上次后端检索的实测耗时，作为「预计耗时」的依据 */
const lastElapsedMs = ref(0);

/** 检索可用的前提：本地模式看已加载的行；后端模式还要有项目标识 */
const canSearch = computed(() => !!props.projectId);
const keyword = computed(() => searchKeyword.value.trim());

/** 本地模式：关键字非空即生效，随输入实时过滤 */
const localActive = computed(() => searchMode.value === 'local' && keyword.value.length > 0);

/** 本地检索命中的行（带视图内行号，便于与日志对照） */
const localHits = computed<{ no: number; text: string }[]>(() => {
  if (!localActive.value) return [];
  const caseSensitive = searchMatchCase.value;
  const needle = caseSensitive ? keyword.value : keyword.value.toLowerCase();
  const out: { no: number; text: string }[] = [];
  props.lines.forEach((line, i) => {
    const hay = caseSensitive ? line : line.toLowerCase();
    if (hay.includes(needle)) out.push({ no: i + 1, text: line });
  });
  return out;
});

/** 当前是否处于「检索结果」视图（本地过滤或后端结果） */
const searchActive = computed(() => localActive.value || !!searchResult.value);

/** 检索结果区要渲染的行：后端结果本身带文件行号，本地命中补上视图内行号 */
const searchLines = computed<string[]>(() => {
  if (searchResult.value) return searchResult.value.lines;
  return localHits.value.map((h) => `${h.no}: ${h.text}`);
});

/** 预计耗时提示：有实测值就用实测值，没有给一个区间（含超时上限） */
const estimateHint = computed(() => {
  if (lastElapsedMs.value > 0) {
    return `上次实测 ${formatMs(lastElapsedMs.value)}，本次预计接近`;
  }
  return '预计 1~3 秒，日志越大越久（最多等 2 分钟）';
});

let searchTimer: ReturnType<typeof setInterval> | null = null;

function stopSearchTimer() {
  if (searchTimer) {
    clearInterval(searchTimer);
    searchTimer = null;
  }
}

function startSearchTimer() {
  stopSearchTimer();
  const begin = Date.now();
  searchElapsedMs.value = 0;
  searchTimer = setInterval(() => {
    searchElapsedMs.value = Date.now() - begin;
  }, 100);
}

onBeforeUnmount(stopSearchTimer);

/**
 * 毫秒转可读文本。
 *
 * @param ms 毫秒
 * @returns 如 `820 ms` / `2.3 s`
 */
function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 ms';
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

/**
 * 切换检索模式：换模式时清掉另一种模式的结果，避免「本地关键字 + 后端结果」混在一起。
 *
 * @param mode 目标模式
 */
function switchMode(mode: SearchMode) {
  if (searchMode.value === mode) return;
  if (mode === 'remote' && !canSearch.value) return;
  searchMode.value = mode;
  searchResult.value = null;
  searchError.value = '';
}

/**
 * 执行检索：本地模式只是让过滤生效，后端模式下发到目标主机。
 */
async function runSearch() {
  const kw = keyword.value;
  if (!kw) {
    searchError.value = '请输入检索关键字';
    return;
  }
  if (searchMode.value === 'local') {
    // 本地过滤由 computed 驱动，这里只负责清掉上一次的后端结果
    searchResult.value = null;
    searchError.value = '';
    return;
  }
  if (!props.projectId) {
    searchError.value = '缺少项目标识，无法检索';
    return;
  }
  searching.value = true;
  searchError.value = '';
  searchResult.value = null;
  startSearchTimer();
  try {
    const res = await http().get(
      `${BASE}/project/${props.projectId}/log/search?keyword=${encodeURIComponent(kw)}`
        + `&maxLines=${SEARCH_MAX_LINES}&matchCase=${searchMatchCase.value}`,
    );
    searchResult.value = unwrapResult<LogSearchResult>(res);
    const elapsed = Number(searchResult.value?.elapsedMs);
    if (Number.isFinite(elapsed) && elapsed > 0) lastElapsedMs.value = elapsed;
  } catch (e: any) {
    searchResult.value = null;
    searchError.value = e?.response?.data?.msg || e?.message || '检索失败';
  } finally {
    stopSearchTimer();
    searching.value = false;
  }
}

/** 退出检索，回到实时日志 */
function exitSearch() {
  searchKeyword.value = '';
  searchResult.value = null;
  searchError.value = '';
  stopSearchTimer();
  searching.value = false;
  nextTick(() => {
    if (autoScroll.value) scrollToBottom();
  });
}

/**
 * 把命中行按关键字切成三段，用于高亮。
 *
 * @param line 日志行
 * @returns 片段数组（hit=true 的片段渲染成高亮）
 */
function segments(line: string): { text: string; hit: boolean }[] {
  const kw = keyword.value;
  if (!kw) return [{ text: line, hit: false }];
  const caseSensitive = searchMatchCase.value;
  const hay = caseSensitive ? line : line.toLowerCase();
  const needle = caseSensitive ? kw : kw.toLowerCase();
  const out: { text: string; hit: boolean }[] = [];
  let from = 0;
  let index = hay.indexOf(needle);
  while (index >= 0) {
    if (index > from) out.push({ text: line.slice(from, index), hit: false });
    out.push({ text: line.slice(index, index + needle.length), hit: true });
    from = index + needle.length;
    index = hay.indexOf(needle, from);
  }
  if (from < line.length) out.push({ text: line.slice(from), hit: false });
  return out.length ? out : [{ text: line, hit: false }];
}
</script>

<template>
  <div class="log-col" :class="{ 'is-popup': popup }">
    <div class="log-col-head">
      <span class="log-col-dot" :class="{ offline: pushOffline }"></span>
      <span class="log-col-title" :title="title">{{ title }}</span>
      <span v-if="source" class="log-col-src" :title="`日志来源：${source}（在项目编辑的「日志」里修改）`">{{ source }}</span>
      <span class="log-col-count">{{ lines.length }} 行</span>
      <span class="log-col-actions">
        <button
          type="button"
          class="lc-btn"
          :class="{ 'is-on': searchOpen }"
          title="检索日志（在项目所在主机上执行）"
          @click="searchOpen = !searchOpen"
        >
          <ReIcon name="Search" :size="14" />
        </button>
        <button v-if="!popup" type="button" class="lc-btn" title="在弹窗中打开" @click="emit('popup')">
          <ReIcon name="FullScreen" :size="14" />
        </button>
        <button type="button" class="lc-btn" title="关闭系统日志" @click="emit('close')">
          <ReIcon name="Close" :size="14" />
        </button>
      </span>
    </div>

    <div v-if="searchOpen" class="log-search">
      <div class="log-search-mode">
        <button
          type="button"
          class="ls-mode-btn"
          :class="{ 'is-on': searchMode === 'local' }"
          title="只过滤当前已加载的行，输入即出结果"
          @click="switchMode('local')"
        >
          本地
        </button>
        <button
          type="button"
          class="ls-mode-btn"
          :class="{ 'is-on': searchMode === 'remote' }"
          :disabled="!canSearch"
          :title="canSearch ? '在项目所在主机上检索整份日志' : '缺少项目标识，无法后端检索'"
          @click="switchMode('remote')"
        >
          后端
        </button>
      </div>
      <input
        v-model="searchKeyword"
        class="log-search-input"
        :placeholder="searchMode === 'local' ? '过滤当前日志（输入即生效）' : '关键字（字面匹配，非正则）'"
        @keyup.enter="runSearch"
      />
      <label class="log-search-case">
        <input v-model="searchMatchCase" type="checkbox" />区分大小写
      </label>
      <button
        v-if="searchMode === 'remote'"
        type="button"
        class="lc-btn lc-btn--primary"
        :disabled="searching || !canSearch"
        @click="runSearch"
      >
        {{ searching ? '检索中…' : '检索' }}
      </button>
      <button v-if="searchActive" type="button" class="lc-btn" title="清除检索" @click="exitSearch">
        清除
      </button>
    </div>

    <div v-if="searchOpen && searchMode === 'remote'" class="log-search-hint">
      <ReIcon name="Time" :size="12" />
      <span>{{ estimateHint }}</span>
    </div>

    <div v-if="searchError" class="log-search-err">{{ searchError }}</div>

    <div v-if="searching" class="log-search-loading">
      <span class="lsl-spinner"></span>
      <span class="lsl-text">正在主机上检索「{{ keyword }}」… 已用 {{ formatMs(searchElapsedMs) }}</span>
      <span class="lsl-sub">{{ estimateHint }}</span>
    </div>

    <div v-if="notice && !searchActive" class="log-notice">{{ notice }}</div>

    <div ref="boxEl" class="log-container" :class="{ 'is-search': searchActive }" @scroll="onScroll">
      <template v-if="searchActive">
        <div class="log-search-meta">
          <template v-if="searchResult">
            <span>命中 {{ searchResult.matched }} 行 · 主机侧耗时 {{ formatMs(searchResult.elapsedMs) }}</span>
            <span v-if="searchResult.truncated" class="log-search-warn">已截断，仅显示前 {{ SEARCH_MAX_LINES }} 行</span>
            <span class="log-search-src" :title="searchResult.source">{{ searchResult.source }}</span>
          </template>
          <template v-else>
            <span>本地命中 {{ localHits.length }} 行 / 当前 {{ lines.length }} 行</span>
            <span class="log-search-warn">只过滤已加载的内容，更早的日志请切「后端」检索</span>
          </template>
        </div>
        <div v-for="(line, i) in searchLines" :key="'s' + i" class="log-line">
          <template v-for="(seg, j) in segments(line)" :key="j">
            <mark v-if="seg.hit" class="log-hit">{{ seg.text }}</mark>
            <template v-else>{{ seg.text }}</template>
          </template>
        </div>
        <div v-if="!searchLines.length" class="log-tip">没有匹配「{{ keyword }}」的行</div>
      </template>
      <template v-else>
        <div v-for="(line, i) in lines" :key="i" class="log-line">{{ line || ' ' }}</div>
        <div v-if="!lines.length" class="log-tip">等待日志输出…</div>
      </template>
    </div>

    <div v-if="!searchActive" class="log-state" :class="{ paused: !autoScroll }">
      <span class="ls-dot"></span>{{ autoScroll ? '自动滚动' : '已暂停跟随' }}
      <span v-if="pushOffline" class="ls-mode">· 实时推送未连接，快照轮询中</span>
    </div>

    <transition name="ls-fade">
      <div v-if="!autoScroll && !searchActive" class="log-resume" @click="resume">
        <ReIcon name="Bottom" :size="14" />回到底部
      </div>
    </transition>
  </div>
</template>

<style scoped>
.log-col {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 300px;
  height: 100%;
  min-height: 0;
  background: var(--bg-container, #fff);
  border-right: 1px solid var(--border-subtle);
}

.log-col:last-child {
  border-right: none;
}

.log-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding: 7px 10px;
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

.log-col-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fbf71;
  box-shadow: 0 0 0 2px rgba(47, 191, 113, 0.22);
  flex: none;
}

.log-col-dot.offline {
  background: #d29922;
  box-shadow: 0 0 0 2px rgba(210, 153, 34, 0.22);
}

.log-col-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.log-col-count {
  flex: none;
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* 日志来源：配置的 logPath。等宽字体便于扫目录，溢出时省略、悬停看全路径 */
.log-col-src {
  min-width: 0;
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 1px 6px;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-tertiary);
  background: var(--bg-hover, rgba(0, 0, 0, 0.06));
  border-radius: 4px;
  cursor: help;
}

.log-col-actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
}

.lc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.lc-btn:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--text-primary);
}

.lc-btn.is-on {
  background: rgba(109, 93, 252, 0.14);
  color: var(--brand-500, #6d5dfc);
}

.lc-btn--primary {
  width: auto;
  padding: 0 10px;
  font-size: 12px;
  color: #fff;
  background: var(--brand-500, #6d5dfc);
}

.lc-btn--primary:hover {
  color: #fff;
  background: var(--brand-600, #5b4be0);
}

.lc-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ===== 日志检索 ===== */
.log-search {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

.log-search-input {
  flex: 1;
  min-width: 0;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  outline: none;
}

.log-search-input:focus {
  border-color: var(--brand-500, #6d5dfc);
}

.log-search-case {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-size: 11.5px;
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: pointer;
}

/* 本地 / 后端模式切换：紧贴在输入框左侧，字号与按钮保持一致 */
.log-search-mode {
  flex: none;
  display: inline-flex;
  padding: 1px;
  gap: 1px;
  background: var(--bg-hover, rgba(0, 0, 0, 0.06));
  border-radius: 6px;
}

.ls-mode-btn {
  padding: 3px 9px;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.ls-mode-btn:hover {
  color: var(--text-primary);
}

.ls-mode-btn.is-on {
  color: var(--brand-500, #6d5dfc);
  background: var(--bg-container, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
}

.ls-mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 预计耗时提示：只有后端检索模式出现 */
.log-search-hint {
  flex: none;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px 5px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* 后端检索进行中的动画条：计时 + 预计耗时，避免大文件看起来像卡死 */
.log-search-loading {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

.lsl-spinner {
  flex: none;
  width: 13px;
  height: 13px;
  border: 2px solid rgba(109, 93, 252, 0.25);
  border-top-color: var(--brand-500, #6d5dfc);
  border-radius: 50%;
  animation: lsl-spin 0.8s linear infinite;
}

.lsl-text {
  font-variant-numeric: tabular-nums;
}

.lsl-sub {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

@keyframes lsl-spin {
  to {
    transform: rotate(360deg);
  }
}

.log-search-err {
  flex: none;
  margin: 6px 8px 0;
  padding: 6px 10px;
  font-size: 12px;
  color: #f85149;
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.35);
  border-radius: 6px;
}

.log-search-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.14);
  font-size: 11.5px;
  color: #8b949e;
}

.log-search-warn {
  color: #d29922;
}

.log-search-src {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
}

.log-hit {
  color: #ffd166;
  background: rgba(210, 153, 34, 0.35);
  border-radius: 2px;
}

.log-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: var(--terminal-bg, #0d1117);
  padding: 10px 12px;
}

.log-col.is-popup {
  height: auto;
  border-right: none;
}

.log-col.is-popup .log-container {
  flex: none;
  height: 60vh;
  min-height: 320px;
  border-radius: 8px;
}

.log-line {
  color: #c9d1d9;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-tip {
  margin-top: 8px;
  color: #6e7681;
  font-size: 12px;
}

.log-notice {
  flex: none;
  margin: 6px 8px 0;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #d29922;
  background: rgba(210, 153, 34, 0.1);
  border: 1px solid rgba(210, 153, 34, 0.35);
  border-radius: 6px;
}

.log-state {
  position: absolute;
  top: 42px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 11.5px;
  color: #c9d1d9;
  background: rgba(13, 17, 23, 0.72);
  border: 1px solid rgba(110, 118, 129, 0.4);
  border-radius: 999px;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

.log-state .ls-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fbf71;
  box-shadow: 0 0 0 2px rgba(47, 191, 113, 0.25);
}

.log-state.paused {
  color: #d29922;
  border-color: rgba(210, 153, 34, 0.5);
}

.log-state.paused .ls-dot {
  background: #d29922;
  box-shadow: 0 0 0 2px rgba(210, 153, 34, 0.25);
}

.log-state .ls-mode {
  color: #8b949e;
}

.log-resume {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 12.5px;
  color: #fff;
  background: var(--brand-500, #6d5dfc);
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: background 0.15s;
}

.log-resume:hover {
  background: var(--brand-600, #5a4bd9);
}

.ls-fade-enter-active,
.ls-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.ls-fade-enter-from,
.ls-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>
