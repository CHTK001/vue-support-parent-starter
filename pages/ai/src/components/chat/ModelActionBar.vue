<template>
  <!--
    模型动作条：贴在输入框上方的一行「模型此刻在干什么」。

    形态（优先级从高到低）：
      1. waiting   —— 等待你（未决的 plan_exit 人工确认）：高亮 + 呼吸环 +
                      计划摘要 + 「查看」/「全部批准」（就近处理，不必滚下去找卡片）
      2. executing —— 正在跑工具：pill（含「第 N/M 个工具」）+ 命令卡
                      （命令摘要 + 实时输出 + 耗时 + 停止）
      3. tool-wait —— executing 超过阈值仍无返回：不是本地状态，而是 executing
                      的等待表达（呼吸点 +「正在等待命令返回」，卡与停止保持不变）
      4. retrying  —— 网络抖动，等待重试（琥珀色呼吸点 + 「第几次/上限 + 原因」）
      5. thinking  —— 正在思考
      6. streaming —— 正在生成
      7. idle      —— 已答完、输入框为空：弱提示「轮到你」+ 下一步动作

    数据全部由父级（ChatPanel）从会话轨迹推导后传入，本组件只负责展示与转发
    停止/展开/批准动作，判据集中在会话状态一侧，避免同一状态多处计算分叉。

    展开行为（需求 2026-11-07）：命令卡右侧箭头点开 = 展开完整的
    命令行与执行输出（与时间线里工具行的展开详情同源数据）。
  -->
  <Transition name="mab-slide">
    <div v-if="visible" class="model-action-bar" :class="[`is-${kind}`, { 'is-tool-wait': toolWaiting }]"
      data-testid="model-action-bar">
      <!-- 工具头：一行说清「谁 / 在干什么 / 第几个」，右侧只放当下能做的动作。
           2026-11-08 B 案：原先状态是浮在输入框上方的小胶囊，命令卡是另一个
           独立方块，两者之间还有 6px 空隙与各自边框，读起来是三件不相干的东西。
           现在把状态、命令与建议串成一张独立紧凑卡（中间夹着目标/建议条，两张卡各自独立）。
           状态在左、动作在右、命令与输出在下方同一条竖轴上。 -->
      <div class="mab-head" role="status" aria-live="polite">
        <span class="mab-mark" :class="`is-${markKind}`" aria-hidden="true">
          <span v-if="markKind === 'spin' || markKind === 'think'" class="mab-ring"></span>
          <span v-else-if="markKind === 'wait'" class="mab-pulse"></span>
          <span v-else-if="markKind === 'warn'" class="mab-pulse mab-pulse--warn"></span>
          <el-icon v-else-if="markKind === 'ask'" size="13"><Info12Filled /></el-icon>
          <span v-else class="mab-hollow"></span>
        </span>

        <span class="mab-head__text">{{ pillText }}</span>
        <span v-if="kind === 'executing' && progress" class="mab-head__badge">{{ progress }}</span>

        <span class="mab-head__grow"></span>

        <template v-if="kind === 'executing' && card">
          <span v-if="elapsedText" class="mab-head__elapsed">{{ elapsedText }}</span>
          <!-- 需求 7：卡住的 cmd 支持关闭（终止本轮执行） -->
          <button type="button" class="mab-stop" @click.stop="$emit('stop')">
            {{ t('chat.panel.actionBarStop') }}
          </button>
          <!-- 需求 8：右上角小箭头收起，只留工具头 -->
          <button type="button" class="mab-chev" :aria-label="cardOpen ? t('chat.panel.actionBarCollapse') : t('chat.panel.actionBarExpand')"
            :aria-expanded="cardOpen" @click.stop="cardOpen = !cardOpen">
            <el-icon size="12" class="mab-chev__icon" :class="{ 'is-open': cardOpen }"><ArrowDown12Filled /></el-icon>
          </button>
        </template>
      </div>

      <!-- 命令行：等宽单行 + 悬停见全文；输出直接贴在这条命令下方，不另起卡片 -->
      <div v-if="kind === 'executing' && card" v-show="cardOpen" class="mab-cmd">
        <div class="mab-cmd__head">
          <el-icon size="14" class="mab-cmd__icon"><component :is="card.icon" /></el-icon>
          <span class="mab-cmd__text mono-ellipsis" :title="card.fullCommand">{{ card.summary }}</span>
        </div>
        <!-- 实时输出：工具边跑边把 stdout 推上来，不必等结束也不用去点时间线 -->
        <div v-if="liveOutput !== null" class="mab-cmd__live">
          <pre ref="liveEl" class="mab-cmd__pre">{{ liveOutput || t('chat.panel.actionBarOutputEmpty') }}</pre>
        </div>
        <!-- 展开详情：调用参数全文（与实时输出区分开，参数不会随命令增长） -->
        <div v-if="card.detail && card.detail.trim() && card.detail.trim() !== card.summary.trim()" class="mab-cmd__detail">
          <pre class="mab-cmd__pre">{{ card.detail }}</pre>
        </div>
      </div>

      <!-- 等待用户态：计划摘要 + 就地处理（回复卡片可能不在视口内） -->
      <div v-if="kind === 'waiting'" class="mab-wait">
        <span class="mab-wait__text">{{ waitingSummary }}</span>
        <button type="button" class="mab-link" @click="$emit('locate')">
          {{ t('chat.panel.actionBarViewPlan') }}
        </button>
        <button type="button" class="mab-primary" :disabled="approving" @click="approveAll">
          {{ t('chat.panel.actionBarApproveAll') }}
        </button>
      </div>

      <!-- 空闲态：轮到你 + 下一步动作（AI 联想的建议就地给出，点一下直接发送）。
           没有任何建议、且联想开关关着时不渲染这一行 —— 否则卡片下沿会多出一条空带。 -->
      <div v-else-if="kind === 'idle' && (suggestions.length || suggestionsEnabled)" class="mab-idle">
        <button v-for="s in suggestions" :key="s.title" type="button" class="mab-suggestion"
          :title="s.detail || s.title" @click="$emit('suggestion', s)">
          {{ s.title }}
        </button>
        <button v-if="suggestionsEnabled" type="button" class="mab-suggestion mab-suggestion--refresh"
          :disabled="refreshing" @click="refreshSuggestions">
          {{ refreshing ? t('chat.panel.actionBarSuggesting') : t('chat.panel.actionBarSuggest') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElIcon } from 'element-plus';
import { ArrowDown12Filled, Info12Filled } from '@vicons/fluent';
import { apiService } from '@/services/ApiService';
import type { SessionNextTaskItem } from '@/services/modules/session-next-task.api';

const { t } = useI18n();

/**
 * 卡片数据：由父级组装（含实时耗时文本），本组件不再自行计时。
 * summary 一行截断；fullCommand/detail 展开后可见。
 */
export interface ModelActionCard {
  /** 工具调用 id：同一条命令的流式刷帧 id 不变，用于计时不归零 */
  id?: string;
  /** 动作名（如「Shell Command」「编辑文件」） */
  label: string;
  /** 单行摘要（命令 / 路径） */
  summary: string;
  /** 完整命令（悬停 title + 展开详情用） */
  fullCommand?: string;
  /** 展开后的详情文本（调用参数 + 已有的部分输出） */
  detail?: string;
  /** 实时耗时（如「16秒」），后端未回传 duration 时不显示 */
  elapsedText?: string;
  /** 工具图标组件 */
  icon: any;
  /**
   * 执行中已收到的输出文本。
   * 为 undefined 表示该工具没有增量输出（不是「输出为空」），不渲染输出区；
   * 空字符串表示正在跑但还没有输出，渲染占位。
   */
  liveOutput?: string;
}

/** 待确认的计划项摘要（父级从 confirmationRequest.items 里提炼） */
export interface ModelActionPending {
  replyId: string;
  items: any[];
}

const props = defineProps<{
  /** 当前状态类型；null = 不渲染 */
  kind: 'executing' | 'retrying' | 'thinking' | 'streaming' | 'waiting' | 'idle' | null;
  /** 模型名（如「卡扣-deepseek-v4.1-flash」） */
  modelName?: string;
  /** executing 时的命令卡数据 */
  card?: ModelActionCard | null;
  /** executing 时的「第 N 个工具」进度文本 */
  progress?: string;
  /** waiting 时的待确认请求（就地批准用） */
  pending?: ModelActionPending | null;
  /** retrying 时的重试信息（第几次 / 上限 / 原因） */
  retry?: { attempt?: number; maxRetries?: number; reason?: string } | null;
  /** idle 时的下一步建议 */
  suggestions?: SessionNextTaskItem[];
  /** 本会话是否开启「AI 联想下一步」 */
  suggestionsEnabled?: boolean;
  /** 会话 id：重新联想要用 */
  sessionId?: string | null;
}>();

const emit = defineEmits<{
  stop: [];
  locate: [];
  /** 就地批准：回传给父级走同一条 resumeConfirmation 路径 */
  approve: [replyId: string];
  /** 点了一条下一步建议：作为用户消息发送 */
  suggestion: [item: SessionNextTaskItem];
  /** 重新联想完成（父级据此重读一次状态，避免组件自己持有第二份数据） */
  suggested: [];
}>();

/** 命令卡默认展开：需求「输入框上方要有模型正在进行的动作」，
 *  收起状态只留 pill 会让用户看不到正在跑的命令；用户仍可点箭头收起。 */
const cardOpen = ref(true);

const visible = computed(() => props.kind !== null);

/**
 * 工具头左侧那个小标记的形态。语义与「状态」一一对应，不重复造状态机：
 *   spin  正在执行（环在转 = 在做）
 *   think 正在思考（灰环）
 *   wait  等待命令返回（实心点呼吸 = 在等）
 *   warn  网络重试（琥珀色呼吸点，不是故障）
 *   ask   等你确认（信息图标，需要你动手）
 *   hollow 空闲（空心点，最弱）
 */
const markKind = computed(() => {
  if (props.kind === 'executing') return toolWaiting.value ? 'wait' : 'spin';
  switch (props.kind) {
    case 'thinking':
      return 'think';
    case 'retrying':
      return 'warn';
    case 'waiting':
      return 'ask';
    case 'idle':
      return 'hollow';
    case 'streaming':
      return 'spin';
    default:
      return 'hollow';
  }
});

// ============================================
// 实时耗时：命令卡右侧的「16秒」
// ============================================
//
// 后端只在工具**完成后**的 metadata 里带 duration，执行中拿不到任何时长，
// 所以这里本地计时：进入 executing 或换到另一条命令时归零，之后每秒自增。
// 用工具调用 id 作为「是不是同一条命令」的判据——同一条命令的参数是流式增长的，
// 若用 summary 判断会每帧都以为换了命令，秒数永远停在 0。
const elapsedMs = ref(0);
let startedAt = 0;
let ticker: ReturnType<typeof setInterval> | null = null;

const stopTicker = () => {
  if (ticker !== null) {
    clearInterval(ticker);
    ticker = null;
  }
};

const startTicker = () => {
  stopTicker();
  startedAt = Date.now();
  elapsedMs.value = 0;
  ticker = setInterval(() => {
    elapsedMs.value = Date.now() - startedAt;
  }, 500);
};

watch(
  () => [props.kind, props.card?.id ?? props.card?.summary ?? ''],
  ([kind]) => {
    if (kind === 'executing' && props.card) {
      startTicker();
    } else {
      stopTicker();
    }
  },
  { immediate: true },
);

onBeforeUnmount(stopTicker);

/** 本地时钟优先；父级显式给的 elapsedText（后端已知时长）作为兜底 */
const elapsedText = computed(() => {
  if (props.card?.elapsedText) return props.card.elapsedText;
  if (props.kind !== 'executing') return '';
  const total = Math.max(0, Math.floor(elapsedMs.value / 1000));
  if (total < 60) return t('chat.panel.actionBarElapsed', { s: total });
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${t('chat.panel.actionBarElapsed', { s })}`;
});

// ============================================
// 「AI 等待」：工具已发出、迟迟不返回
// ============================================
//
// 需求 5 的等待语义不挂在 plan_exit 上（那只是一种「等你确认」的等待）。
// 用户最常看到的等待是：命令已经交给系统，输出迟迟不来——这时 AI 实际上
// 什么都不在做，只是在等外部返回。超过阈值就把状态从「正在执行命令」
// 切成「等待命令返回」，视觉上换成呼吸点 + 等待色，命令卡和停止按钮不动
// （需求 7 的「卡住的 cmd 可以关掉」就在这个状态下最常用）。
const TOOL_WAIT_THRESHOLD_MS = 15_000;

const toolWaiting = computed(
  () => props.kind === 'executing' && !!props.card && elapsedMs.value >= TOOL_WAIT_THRESHOLD_MS,
);

/** 实时输出：undefined = 该工具没有增量输出（不渲染输出区） */
const liveOutput = computed<string | null>(() => {
  if (props.kind !== 'executing' || !props.card) return null;
  const txt = props.card.liveOutput;
  if (txt === undefined) return null;
  return txt;
});

// 输出跟到底：用户没往上翻时就钉在最后一行，翻了就不打扰
const liveEl = ref<HTMLElement | null>(null);
watch(liveOutput, () => {
  nextTick(() => {
    const el = liveEl.value;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  });
});

// ============================================
// 重试细节：第几次 / 上限 / 原因
// ============================================
const retrySuffix = computed(() => {
  const r = props.retry;
  if (props.kind !== 'retrying') return '';
  const parts: string[] = [];
  if (r?.attempt && r?.maxRetries) {
    parts.push(t('chat.panel.actionBarRetryAttempt', { attempt: r.attempt, max: r.maxRetries }));
  }
  const reason = retryReasonText(r?.reason);
  if (reason) parts.push(reason);
  return parts.length ? ` ${parts.join('，')}` : '';
});

/** 后端 retryReason 是枚举或自由文本：认识的翻成短句，不认识的照原样显示 */
function retryReasonText(reason?: string): string {
  if (!reason) return '';
  const key = String(reason).toLowerCase();
  if (key.includes('rate') || key.includes('429') || key.includes('limit')) {
    return t('chat.panel.actionBarRetryReasonRateLimit');
  }
  if (key.includes('timeout') || key.includes('timed')) return t('chat.panel.actionBarRetryReasonTimeout');
  if (key.includes('server') || key.includes('5')) return t('chat.panel.actionBarRetryReasonServer');
  if (key.includes('network') || key.includes('connect') || key.includes('socket')) {
    return t('chat.panel.actionBarRetryReasonNetwork');
  }
  return '';
}

// ============================================
// 等你确认：计划摘要 + 就地批准
// ============================================
const waitingSummary = computed(() => {
  const items = props.pending?.items || [];
  const names = items
    .map((it: any) => it?.title || it?.toolName || it?.name)
    .filter((x: any) => typeof x === 'string' && x.trim());
  if (!names.length) return t('chat.panel.actionBarNoPlanItems');
  return t('chat.panel.actionBarPendingItems', { count: names.length });
});

const approving = ref(false);
function approveAll() {
  const replyId = props.pending?.replyId;
  if (!replyId || approving.value) return;
  approving.value = true;
  emit('approve', replyId);
  // 真实终态由父级回传（confirmationRequest.status），这里只防连点
  setTimeout(() => { approving.value = false; }, 1500);
}

// ============================================
// 空闲态：下一步动作（AI 联想建议就地给出）
// ============================================
const suggestions = computed(() => (props.kind === 'idle' ? props.suggestions || [] : []));
const refreshing = ref(false);

async function refreshSuggestions() {
  const sid = props.sessionId;
  if (!sid || refreshing.value) return;
  refreshing.value = true;
  try {
    await apiService.refreshSessionNextTask(String(sid));
    // 只通知、不自己缓存：建议的唯一来源仍是父级的 nextTaskState，
    // 否则刷新后这里的新数据与父级旧数据会各说各话。
    emit('suggested');
  } catch (error) {
    console.error('[ActionBar] 重新联想失败:', error);
  } finally {
    refreshing.value = false;
  }
}

const pillText = computed(() => {
  if (!props.kind) return '';
  const model = props.modelName ? `${props.modelName} ` : '';
  if (toolWaiting.value) return t('chat.panel.actionBarToolWaiting', { model });
  switch (props.kind) {
    case 'executing':
      return t('chat.panel.actionBarExecuting', { model });
    case 'thinking':
      return t('chat.panel.actionBarThinking', { model });
    case 'streaming':
      return t('chat.panel.actionBarStreaming', { model });
    case 'waiting':
      return t('chat.panel.actionBarWaiting', { model });
    case 'retrying':
      return t('chat.panel.actionBarNetworkWaiting', { model }) + retrySuffix.value;
    case 'idle':
      return t('chat.panel.actionBarIdle');
    default:
      return '';
  }
});
</script>

<style scoped>
/* ── 卡片：独立紧凑卡，不与输入卡焊接 ──
   动作条与输入卡之间隔着 GoalBar / AiNextTaskPanel（它们渲染在 ChatInput 内部、
   输入卡上方），中间那层会让「同一张卡」的接缝出现在错误层级上
   （实测：动作条下沿悬空、输入卡上沿被抹平，中间露出一段白色）。
   所以这里做一张独立的卡：整圆角 + 完整描边，与输入卡之间留 6px 呼吸。
   内部结构是「头（状态）→ 身（命令与输出）→ 尾（建议/等确认）」，无间隙。 */
.model-action-bar {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  margin-bottom: 6px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-default, var(--el-border-color-lighter, #e2e9f3));
  border-radius: var(--radius-lg, 12px);
}

/* ── 工具头：一行说清状态 ──
   左边是「标记 + 状态文字 + 第 N 个」；右边只放当下能做的动作（耗时 / 停止 / 收起）。
   高度 34px 与输入卡底栏的 28px 控件同档，不抢正文。 */
.mab-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 8px 0 12px;
  background: var(--bg-elevated, var(--bg-fill, #f8fafc));
  font-size: 12.5px;
  color: var(--text-secondary, var(--el-text-color-secondary));
  user-select: none;
  min-width: 0;
}

.mab-head__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.mab-head__grow {
  flex: 1;
}

/* 「第 N 个工具」：像编号标签，不像另一个状态 */
.mab-head__badge {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--el-radius-xs, 4px);
  border: 1px solid var(--border-default, var(--el-border-color-lighter, #e2e9f3));
  background: var(--bg-container, #fff);
  font-size: 11px;
  line-height: 16px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}

.mab-head__elapsed {
  flex-shrink: 0;
  font-size: 11.5px;
  color: var(--text-tertiary, var(--el-text-color-placeholder));
  font-variant-numeric: tabular-nums;
}

/* ── 状态标记：形态即语义（旋转=在做 / 呼吸=在等 / 图标=需要你动手） ── */
.mab-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.mab-ring {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--el-color-primary);
  border-top-color: transparent;
  animation: mab-spin 0.9s linear infinite;
}

/* 思考：灰色环，比执行的主色环安静一档 */
.mab-mark.is-think .mab-ring {
  border-color: var(--el-text-color-placeholder);
  border-top-color: transparent;
}

.mab-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  animation: mab-wait-dot 1.4s ease-in-out infinite;
}

.mab-mark.is-warn {
  color: var(--el-color-warning);
}

.mab-pulse--warn {
  background: var(--el-color-warning);
}

/* 空闲：空心点 + 更淡的字色，避免每轮结束都像出了故障 */
.mab-hollow {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  opacity: 0.7;
}

.mab-mark.is-ask {
  color: var(--el-color-primary);
}

@keyframes mab-spin {
  to { transform: rotate(360deg); }
}

@keyframes mab-wait-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.72); }
}

/* 需要你动手 / 等外部返回 / 网络重试：整条头换色，一眼区分「等你」与「在做」。
   只改文字与图标色，不改底色 —— 底色一变，整条头就像换了张卡。 */
.model-action-bar.is-waiting .mab-head,
.model-action-bar.is-tool-wait .mab-head {
  color: var(--el-color-primary);
}

.model-action-bar.is-retrying .mab-head {
  color: var(--el-color-warning);
}

.model-action-bar.is-idle .mab-head {
  color: var(--text-tertiary, var(--el-text-color-placeholder));
}

/* ── 停止 / 收起：头右端的两个动作 ── */
.mab-stop {
  flex-shrink: 0;
  height: 22px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 32%, transparent);
  border-radius: var(--el-radius-full, 999px);
  background: var(--bg-container, #fff);
  color: var(--el-color-danger);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.mab-stop:hover {
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--bg-container, #fff));
}

.mab-chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.mab-chev:hover {
  background: var(--bg-container, #fff);
  color: var(--el-text-color-primary);
}

.mab-chev__icon {
  transition: transform 0.18s ease;
}

.mab-chev__icon.is-open {
  transform: rotate(180deg);
}

/* ── 命令行：卡身的第一行 ──
   不再是一个自带边框圆角的「卡中卡」：它就是卡片正文，靠左侧图标与
   等宽字体表明「这是一条命令」。 */
.mab-cmd {
  min-width: 0;
}

.mab-cmd__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
}

.mab-cmd__icon {
  color: var(--text-tertiary, var(--el-text-color-secondary));
  flex-shrink: 0;
  display: inline-flex;
}

/* 命令摘要：等宽字体、单行截断、悬停见全文 */
.mono-ellipsis {
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 12.5px;
  color: var(--text-primary, var(--el-text-color-regular));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

/* 实时输出 / 详情：同一块「代码面」，两者之间不再各画一条分隔线。
   限高滚动并自动跟到最后一行（见脚本里的 watch）。 */
.mab-cmd__live,
.mab-cmd__detail {
  border-top: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef2f8));
  background: var(--bg-elevated, var(--el-fill-color-lighter, #f8fafc));
}

.mab-cmd__pre {
  margin: 0;
  padding: 7px 12px 8px;
  max-height: 160px;
  overflow-y: auto;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-secondary, var(--el-text-color-regular));
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── 等待用户：摘要 + 查看 + 全部批准 ──
   与命令行走同一条左边界（12px），整条卡的下沿，不另起一张卡。 */
.mab-wait {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef2f8));
  background: color-mix(in srgb, var(--el-color-primary) 5%, var(--bg-container, #fff));
  font-size: 12.5px;
  color: var(--text-secondary, var(--el-text-color-secondary));
  min-width: 0;
}

.mab-wait__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 「查看」是文字链，「全部批准」是主操作：两者都不抢工具头里的状态文字 */
.mab-link {
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12.5px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.mab-link:hover {
  text-decoration: underline;
}

.mab-primary {
  flex-shrink: 0;
  height: 22px;
  padding: 0 10px;
  border-radius: var(--el-radius-full, 999px);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  background: var(--bg-container, #fff);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.mab-primary:hover {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--bg-container, #fff));
}

.mab-primary:disabled {
  opacity: 0.5;
  cursor: default;
}

/* ── 空闲态：下一步动作 ──
   建议是「虚线胶囊」——保留虚线是因为它表示「还没发生、点一下才成为你的输入」，
   与实线的可执行按钮区分开；但底色改成白，融进卡片下沿，不再是一堆漂浮标签。 */
.mab-idle {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 9px;
  border-top: 1px solid var(--border-subtle, var(--el-border-color-lighter, #eef2f8));
}

.mab-suggestion {
  max-width: 320px;
  padding: 3px 10px;
  border-radius: var(--el-radius-full, 999px);
  border: 1px dashed var(--border-strong, var(--el-border-color));
  background: var(--bg-container, #fff);
  color: var(--text-secondary, var(--el-text-color-regular));
  font-size: 12.5px;
  line-height: 1.6;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    border-color 0.16s ease,
    color 0.16s ease;
}

.mab-suggestion:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  color: var(--el-color-primary);
}

.mab-suggestion--refresh {
  color: var(--el-text-color-placeholder);
  border-style: solid;
}

.mab-suggestion--refresh:disabled {
  opacity: 0.6;
  cursor: default;
}

/* ── 进出场：轻微上滑淡入，GPU 属性 ── */
.mab-slide-enter-active,
.mab-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mab-slide-enter-from,
.mab-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .mab-slide-enter-active,
  .mab-slide-leave-active {
    transition: none;
  }

  .mab-ring {
    animation: none;
    border-top-color: var(--el-color-primary);
  }

  .mab-mark.is-think .mab-ring {
    border-top-color: var(--el-text-color-placeholder);
  }

  /* 减少动态：呼吸点改成静态实心点，仍能看出「在等」 */
  .mab-pulse {
    animation: none;
    opacity: 0.8;
  }
}
</style>
