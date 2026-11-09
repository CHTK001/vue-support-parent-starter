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
import { nextTick, ref, watch } from 'vue';
import ReIcon from '@repo/ui/re-icon';

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
  }>(),
  {
    source: '',
    notice: '',
    pushOffline: false,
    popup: false,
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
</script>

<template>
  <div class="log-col" :class="{ 'is-popup': popup }">
    <div class="log-col-head">
      <span class="log-col-dot" :class="{ offline: pushOffline }"></span>
      <span class="log-col-title" :title="title">{{ title }}</span>
      <span v-if="source" class="log-col-src" :title="`日志来源：${source}（在项目编辑的「日志」里修改）`">{{ source }}</span>
      <span class="log-col-count">{{ lines.length }} 行</span>
      <span class="log-col-actions">
        <button v-if="!popup" type="button" class="lc-btn" title="在弹窗中打开" @click="emit('popup')">
          <ReIcon name="FullScreen" :size="14" />
        </button>
        <button type="button" class="lc-btn" title="关闭系统日志" @click="emit('close')">
          <ReIcon name="Close" :size="14" />
        </button>
      </span>
    </div>

    <div v-if="notice" class="log-notice">{{ notice }}</div>

    <div ref="boxEl" class="log-container" @scroll="onScroll">
      <div v-for="(line, i) in lines" :key="i" class="log-line">{{ line || ' ' }}</div>
      <div v-if="!lines.length" class="log-tip">等待日志输出…</div>
    </div>

    <div class="log-state" :class="{ paused: !autoScroll }">
      <span class="ls-dot"></span>{{ autoScroll ? '自动滚动' : '已暂停跟随' }}
      <span v-if="pushOffline" class="ls-mode">· 实时推送未连接，快照轮询中</span>
    </div>

    <transition name="ls-fade">
      <div v-if="!autoScroll" class="log-resume" @click="resume">
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
