<template>
  <!--
    模型动作条：贴在输入框上方的一行「模型此刻在干什么」。

    形态（优先级从高到低）：
      1. waiting   —— 等待你（未决的 plan_exit 人工确认）：高亮 + 呼吸环 + 「去处理」
      2. executing —— 正在跑工具：pill + 可展开的命令卡（命令摘要 + 耗时 + 停止）
      3. tool-wait —— executing 超过阈值仍无返回：不是本地状态，而是 executing
                      的等待表达（呼吸点 +「正在等待命令返回」，卡与停止保持不变）
      4. retrying  —— 网络抖动，等待重试（琥珀色呼吸点）
      5. thinking  —— 正在思考
      6. streaming —— 正在生成
      7. idle      —— 已答完、输入框为空：弱提示「轮到你」

    数据全部由父级（ChatPanel）从会话轨迹推导后传入，本组件只负责展示与转发
    停止/展开动作，判据集中在会话状态一侧，避免同一状态多处计算分叉。

    展开行为（需求 2026-11-07）：命令卡右侧箭头点开 = 展开完整的
    命令行与执行输出（与时间线里工具行的展开详情同源数据）。
  -->
  <Transition name="mab-slide">
    <div v-if="visible" class="model-action-bar" data-testid="model-action-bar">
      <!-- 左：状态 pill -->
      <div class="mab-pill" :class="{ 'is-waiting': kind === 'waiting', 'is-tool-wait': toolWaiting, 'is-retrying': kind === 'retrying', 'is-idle': kind === 'idle' }" role="status" aria-live="polite">
        <span v-if="kind === 'executing' && !toolWaiting" class="mab-spinner" aria-hidden="true"></span>
        <span v-else-if="kind === 'executing' && toolWaiting" class="mab-waiting-dot" aria-hidden="true"></span>
        <span v-else-if="kind === 'retrying'" class="mab-waiting-dot mab-waiting-dot--warn" aria-hidden="true"></span>
        <el-icon v-else-if="kind === 'waiting'" size="13"><Info12Filled /></el-icon>
        <span v-else-if="kind === 'thinking'" class="mab-spinner mab-spinner--think" aria-hidden="true"></span>
        <span v-else-if="kind === 'idle'" class="mab-idle-dot" aria-hidden="true"></span>
        <span class="mab-pill__text">{{ pillText }}</span>
        <!-- 收起/展开整条（需求 8：右上角小箭头收起，只留 pill） -->
        <button v-if="kind === 'executing' && card" type="button" class="mab-collapse-btn"
          :aria-label="cardOpen ? t('chat.panel.actionBarCollapse') : t('chat.panel.actionBarExpand')"
          :aria-expanded="cardOpen"
          @click.stop="cardOpen = !cardOpen">
          <el-icon size="12" class="mab-collapse-chevron" :class="{ 'is-open': cardOpen }"><ArrowDown12Filled /></el-icon>
        </button>
      </div>

      <!-- 右：执行中的命令卡（默认展开为单行摘要 + 耗时 + 停止；箭头可收起） -->
      <div v-if="kind === 'executing' && card" v-show="cardOpen" class="mab-card">
        <div class="mab-card__head">
          <el-icon size="14" class="mab-card__icon"><component :is="card.icon" /></el-icon>
          <span class="mab-card__cmd mono-ellipsis" :title="card.fullCommand">{{ card.summary }}</span>
          <span v-if="elapsedText" class="mab-card__elapsed">{{ elapsedText }}</span>
          <!-- 需求 7：卡住的 cmd 支持关闭（终止本轮执行） -->
          <button type="button" class="mab-card__stop" @click.stop="$emit('stop')">
            {{ t('chat.panel.actionBarStop') }}
          </button>
        </div>
        <div v-if="card.detail && card.detail.trim() && card.detail.trim() !== card.summary.trim()" class="mab-card__detail">
          <pre class="mab-card__pre">{{ card.detail }}</pre>
        </div>
      </div>

      <!-- 等待用户态：说明 + 行动入口（滚到待确认的计划卡） -->
      <div v-if="kind === 'waiting'" class="mab-waiting-hint">
        <span class="mab-waiting-hint__text">{{ t('chat.panel.actionBarWaitingHint') }}</span>
        <button type="button" class="mab-waiting-hint__action" @click="$emit('locate')">
          {{ t('chat.panel.actionBarGoHandle') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElIcon } from 'element-plus';
import { ArrowDown12Filled, Info12Filled } from '@vicons/fluent';

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
}

const props = defineProps<{
  /** 当前状态类型；null = 不渲染 */
  kind: 'executing' | 'retrying' | 'thinking' | 'streaming' | 'waiting' | 'idle' | null;
  /** 状态文案（已由父级 i18n 化） */
  text?: string;
  /** 模型名（如「卡扣-deepseek-v4.1-flash」） */
  modelName?: string;
  /** executing 时的命令卡数据 */
  card?: ModelActionCard | null;
}>();

defineEmits<{
  stop: [];
  locate: [];
}>();

/** 命令卡默认展开：需求「输入框上方要有模型正在进行的动作」，
 *  收起状态只留 pill 会让用户看不到正在跑的命令；用户仍可点箭头收起。 */
const cardOpen = ref(true);

const visible = computed(() => props.kind !== null);

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
      return t('chat.panel.actionBarNetworkWaiting', { model });
    case 'idle':
      return t('chat.panel.actionBarIdle');
    default:
      return '';
  }
});
</script>

<style scoped>
.model-action-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 4px 6px;
}

/* ── 状态 pill ── */
.mab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  user-select: none;
}

/* 等待用户态：蓝底 + 呼吸光环。
   呼吸环用 ::after 的 transform/opacity 做，不碰 box-shadow（每帧重绘整个 pill 太贵），
   也不改宽度，避免动作条出现时输入框来回跳。 */
.mab-pill.is-waiting {
  position: relative;
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}

.mab-pill.is-waiting::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 1px solid var(--el-color-primary);
  opacity: 0.18;
  pointer-events: none;
  animation: mab-waiting-breathe 2.2s ease-in-out infinite;
}

/* 等待命令返回：同为主色，但不放呼吸环——环是「需要你动手」的信号，
   等外部返回时只靠呼吸点表达，避免与「等你确认」抢注意力。 */
.mab-pill.is-tool-wait {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}

@keyframes mab-waiting-breathe {
  0%, 100% { opacity: 0.12; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.03); }
}

.mab-pill__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── spinner：小圆点旋转（思考/执行共用，色不同） ── */
.mab-spinner {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--el-color-primary);
  border-top-color: transparent;
  animation: mab-spin 0.9s linear infinite;
  flex-shrink: 0;
}

.mab-spinner--think {
  border-color: var(--el-text-color-placeholder);
  border-top-color: transparent;
}

@keyframes mab-spin {
  to { transform: rotate(360deg); }
}

/* 空闲等待：AI 已说完，轮到你。弱化的空心点 + 更淡的字色，
   与「等命令返回」的强呼吸点区分开，避免每轮结束都像出了故障。 */
.mab-pill.is-idle {
  background: transparent;
  border-color: transparent;
  color: var(--el-text-color-placeholder);
}

.mab-idle-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  opacity: 0.7;
  flex-shrink: 0;
}

/* 等待命令返回：实心点呼吸（与 spinner 区分——旋转表示「在做」，呼吸表示「在等」） */
.mab-waiting-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  flex-shrink: 0;
  animation: mab-wait-dot 1.4s ease-in-out infinite;
}

/* 网络重试：琥珀色（不是故障，是在等外部恢复），只呼吸不放光环 */
.mab-pill.is-retrying {
  color: var(--el-color-warning);
  border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
}

.mab-waiting-dot--warn {
  background: var(--el-color-warning);
}

@keyframes mab-wait-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.72); }
}

/* 收起箭头按钮 */
.mab-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.mab-collapse-btn:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.mab-collapse-chevron {
  transition: transform 0.18s ease;
}

.mab-collapse-chevron.is-open {
  transform: rotate(180deg);
}

/* ── 命令卡 ── */
.mab-card {
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}

.mab-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
}

.mab-card__icon {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  display: inline-flex;
}

/* 命令摘要：等宽字体、单行截断、悬停见全文 */
.mono-ellipsis {
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.mab-card__elapsed {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 停止按钮：红字轻按钮（与参考图「停止」一致） */
.mab-card__stop {
  border: none;
  background: transparent;
  color: var(--el-color-danger);
  font-size: 12.5px;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.mab-card__stop:hover {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

/* 展开的详情：等宽 pre，限高可滚 */
.mab-card__detail {
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  padding: 8px 10px;
  background: var(--el-fill-color-lighter, #fafafa);
}

.mab-card__pre {
  margin: 0;
  max-height: 180px;
  overflow-y: auto;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── 等待用户：说明 + 「去处理」 ── */
.mab-waiting-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 2px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  min-width: 0;
}

.mab-waiting-hint__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mab-waiting-hint__action {
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12.5px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.mab-waiting-hint__action:hover {
  text-decoration: underline;
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

  .mab-spinner {
    animation: none;
    border-top-color: var(--el-color-primary);
  }

  .mab-spinner--think {
    border-top-color: var(--el-text-color-placeholder);
  }

  /* 减少动态：呼吸环改成静态描边，仍能看出「在等你」 */
  .mab-pill.is-waiting::after {
    animation: none;
    opacity: 0.35;
  }

  .mab-waiting-dot {
    animation: none;
    opacity: 0.8;
  }
}
</style>
