<template>
  <!--
    会话底部状态条（常驻，位于输入框下方、会话面板最底部）。

    三段信息，与「会话工作状态」面板同一套数据口径，但只取最需要一眼看到的几项：
    - 左：轮数 / 步数 / 输出速度（TPS）—— 悬停弹出「会话统计」浮层（模型用时、工具用时、TTFT、TPS）
    - 中：累计 Token / 缓存命中率 —— 悬停弹出「Token 用量」浮层（命中率 / 未缓存输入 / 缓存读取 / 输出）
    - 右：上下文占用百分比（环形进度）—— 悬停弹出「上下文已用」浮层（占用条 + token 构成）

    聚合口径统一由 composables/useTurnStats 提供，与 SessionStatusPanel 共用同一份计算，
    避免同一个会话在面板和底部条上显示两个不同的速度（历史上确实差过 30% 以上）。

    任何一项缺数据时显示「—」而不是 0，避免把「没有数据」误读成「速度/命中率为 0」。
  -->
  <div v-if="visible" class="session-stats-bar" role="group" :aria-label="t('chat.runStats.title')"
    :aria-busy="pending ? 'true' : 'false'">
    <!--
      数据还没回来时的骨架态。

      为什么需要：用量只在本轮 finish 之后才随消息落下来，而一条回复从「工作中」
      到出结果可能几十秒。此前这段时间 `visible` 已经是 true（消息在流），但三段
      全是「—」，整条看起来像空的；用户要的是「有东西在动，说明在等数据」，而不是
      什么都看不见。所以这里先铺占位条并做呼吸，宽度按真实文本量级给，
      真数据到达时布局不跳。
    -->
    <template v-if="pending">
      <div class="stats-cluster stats-cluster--hover">
        <el-icon class="stats-icon"><Timer /></el-icon>
        <span class="stats-skeleton stats-skeleton--w-rounds"></span>
        <span class="stats-skeleton stats-skeleton--w-steps"></span>
        <span class="stats-sep">·</span>
        <span class="stats-skeleton stats-skeleton--w-speed"></span>
      </div>
      <div class="stats-cluster stats-cluster--shrink">
        <el-icon class="stats-icon"><DataLine20Regular /></el-icon>
        <span class="stats-skeleton stats-skeleton--w-tokens"></span>
        <span class="stats-sep">·</span>
        <span class="stats-skeleton stats-skeleton--w-cache"></span>
      </div>
      <div class="stats-cluster stats-cluster--right">
        <!-- 等待态：只画底环（占用率还不知道），靠轻微呼吸表示"正在等" -->
        <svg class="stats-ring stats-ring--pending" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
          <circle class="stats-ring__track" cx="10" cy="10" r="8" />
        </svg>
        <span class="stats-skeleton stats-skeleton--w-percent"></span>
      </div>
    </template>

    <!-- 轮次 / 步数 / 速度：悬停看「会话统计」明细（模型用时 / 工具用时 / TTFT / TPS）。
         用 el-popover 而不是 CSS 浮层：本条的父容器 overflow:hidden，绝对定位的浮层会被裁掉，
         而 popover 会 teleport 到 body。 -->
    <el-popover v-else trigger="hover" placement="top-start" :width="236" :show-arrow="true">
      <template #reference>
        <div class="stats-cluster stats-cluster--hover">
          <el-icon class="stats-icon"><Timer /></el-icon>
          <span class="stats-item">{{ t('chat.runStats.rounds', { n: turnCount }) }}</span>
          <!-- 步数只在真的调过工具时出现：纯聊天会话显示「0 步」是噪音 -->
          <span v-if="stats.steps > 0" class="stats-item">{{ t('chat.runStats.steps', { n: stats.steps }) }}</span>
          <span class="stats-sep">·</span>
          <span class="stats-item stats-item--strong">{{ speedText }}</span>
        </div>
      </template>

      <div class="stats-popover">
        <div class="stats-popover__title">{{ t('chat.runStats.title') }}</div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.modelTime') }}</span>
          <span class="stats-popover__value">{{ modelTimeText }}</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.toolTime') }}</span>
          <span class="stats-popover__value">{{ toolTimeText }}</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.ttft') }}</span>
          <span class="stats-popover__value">{{ ttftText }}</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.tps') }}</span>
          <span class="stats-popover__value">{{ speedText }}</span>
        </div>
      </div>
    </el-popover>

    <!-- 累计 Token / 缓存命中：悬停看 Token 用量明细 -->
    <!--
      注意这里**不是** v-else：本组件有三个并列的 popover（轮次/速度、Token/缓存、
      上下文占用），只有第一个是「pending 骨架态」的 v-else，后两个与第一个平级。
      写成 v-else 会让 Vue 报「v-else/v-else-if has no adjacent v-if or v-else-if」
      —— 这是编译期错误，整个包都构建不出来。
    -->
    <el-popover trigger="hover" placement="top-start" :width="272" :show-arrow="true">
      <template #reference>
        <div class="stats-cluster stats-cluster--shrink stats-cluster--hoverable">
          <svg class="stats-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor"
            stroke-width="1.3" stroke-linecap="round" aria-hidden="true">
            <ellipse cx="8" cy="4" rx="5" ry="2.1" />
            <path d="M3 4v4c0 1.16 2.24 2.1 5 2.1s5-.94 5-2.1V4" />
            <path d="M3 8v4c0 1.16 2.24 2.1 5 2.1s5-.94 5-2.1V8" />
          </svg>
          <span class="stats-item">{{ tokensText }}</span>
          <span class="stats-sep">·</span>
          <span class="stats-item">{{ cacheHitText }}</span>
        </div>
      </template>

      <div class="stats-popover">
        <div class="stats-popover__title stats-popover__title--split">
          <span class="stats-popover__title-left">
            <el-icon class="stats-popover__icon"><DataLine20Regular /></el-icon>
            <span>{{ t('chat.runStats.usageTitle') }}</span>
          </span>
          <span class="stats-popover__total">{{ formatFull(stats.total) }} tok</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.cacheRate') }}</span>
          <span class="stats-popover__value">{{ cacheRateShort }}</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.cacheMiss') }}</span>
          <span class="stats-popover__value">{{ formatFull(stats.uncachedInput) }} tok</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.cacheRead') }}</span>
          <span class="stats-popover__value">{{ formatFull(stats.cached) }} tok</span>
        </div>
        <div class="stats-popover__row">
          <span class="stats-popover__label">{{ t('chat.runStats.outputTokens') }}</span>
          <span class="stats-popover__value">{{ formatFull(stats.completion) }} tok</span>
        </div>
      </div>
    </el-popover>

    <!-- 上下文占用：环形 + 百分比。悬停看已用/窗口与 token 构成 -->
    <!-- 与上面两个 popover 平级，不是 v-else（原因见上一处注释） -->
    <el-popover trigger="hover" placement="top-end" :width="272" :show-arrow="true">
      <template #reference>
        <div class="stats-cluster stats-cluster--right stats-cluster--hoverable">
          <!--
            环形进度用 SVG 圆周而不是 conic-gradient：
            conic-gradient + radial mask 挖空出来的环边是**硬边、没有圆头**，
            设计稿要的是「圆头粗弧」（stroke-linecap: round）。颜色仍按危险/警告/正常分档。
          -->
          <svg class="stats-ring" viewBox="0 0 20 20" width="14" height="14" role="img" :aria-label="contextHint">
            <circle class="stats-ring__track" cx="10" cy="10" r="8" />
            <circle v-if="ringArc" class="stats-ring__bar" cx="10" cy="10" r="8" :stroke="ringColor"
              :stroke-dasharray="ringArc" transform="rotate(-90 10 10)" />
          </svg>
          <span class="stats-item">{{ contextPctText }}</span>
        </div>
      </template>

      <div class="stats-popover">
        <div class="stats-popover__title stats-popover__title--split">
          <span class="stats-popover__title-left">
            <span>{{ t('chat.runStats.contextUsed') }}</span>
            <b class="stats-popover__percent">{{ contextPctText }}</b>
          </span>
          <span class="stats-popover__total">{{ contextAmountText }}</span>
        </div>

        <!-- 占用条：与右侧环形同一个百分比，颜色同步分档 -->
        <div class="stats-popover__track">
          <div class="stats-popover__fill" :style="{ width: Math.min(contextPct, 100) + '%', background: ringColor }"></div>
        </div>

        <!-- token 构成：只有后端真的下发了 breakdown 才显示，避免拿 0 冒充「没有占用」 -->
        <div v-if="breakdownRows.length" class="stats-popover__breakdown">
          <div v-for="row in breakdownRows" :key="row.key" class="stats-popover__row">
            <span class="stats-popover__label">
              <i class="stats-popover__swatch" :style="{ background: row.color }"></i>
              {{ row.label }}
            </span>
            <span class="stats-popover__value">{{ formatApprox(row.value) }}</span>
          </div>
        </div>
      </div>
    </el-popover>

    <!--
      链路追踪入口：点开弹框，用关系图把这次运行走了哪几步串起来。

      为什么放在底部状态条：它和「轮数 / 步数 / Token / 上下文」是同一层信息 ——
      都是「这一轮到底怎么跑的」；用户看完速度/命中率，下一步就想知道步骤怎么走的。
      1.0 版起改为**纯图标按钮**：正文指标拥挤，露出「链路追踪」四个字反而喧宾夺主，
      图标（两个节点 + 连线）配 title/aria-label 表达语义，悬停高亮说明可点。
    -->
    <!--
      上下文窗口入口：与「链路追踪」同层，纯图标按钮。
      参考「会话工作状态」的交互：点一下打开主区域的上下文窗口面板，
      悬停浮层仍保留（看已用/窗口与 token 构成），两者不冲突。
    -->
    <button
      type="button"
      class="stats-trace-btn stats-context-btn"
      title="打开上下文窗口"
      aria-label="上下文窗口"
      @click="emit('open-context')"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.3"
        stroke-linejoin="round" aria-hidden="true">
        <rect x="1.5" y="1.5" width="6" height="6" rx="1" />
        <rect x="8.5" y="1.5" width="6" height="3" rx="1" />
        <rect x="8.5" y="5.5" width="2.5" height="2" rx=".7" />
        <rect x="12" y="5.5" width="2.5" height="2" rx=".7" />
        <rect x="1.5" y="8.5" width="6" height="6" rx="1" />
        <rect x="8.5" y="8.5" width="6" height="6" rx="1" />
      </svg>
    </button>

    <button
      type="button"
      class="stats-trace-btn"
      :title="'查看本次运行的链路追踪关系图'"
      aria-label="链路追踪"
      @click="traceVisible = true"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linecap="round" aria-hidden="true">
        <circle cx="3" cy="4" r="1.8" />
        <circle cx="13" cy="12" r="1.8" />
        <path d="M4.6 5.2 11.4 10.8" />
      </svg>
    </button>

    <!-- 弹框挂在状态条内部，避免把会话面板/消息列的模板再撑一层。
         上下文占用一并透传：弹框头部要显示「上下文已用」，且必须与状态条同源，
         否则两处各拉一次 /token-stats 会出现两个数字。 -->
    <TraceFlowDialog v-model="traceVisible" :session-id="sessionId" :live-traces="liveTraces"
      :context-used="contextUsed" :context-total="contextTotal" :context-percent="contextPercent" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timer } from '@element-plus/icons-vue';
/*
 * 这个图标**不能删**：等待态骨架行与 Token 用量浮层仍在用它
 * （模板 L35 / L110）。上一版为了替换中间那个图标把 import 删了，
 * 结果组件解析失败 → 整个会话页白屏（实测 bodyLen 只有 171）。
 * 主状态条的中间图标已改为内联「数据库堆叠」SVG，与本 import 互不影响。
 */
import { DataLine20Regular } from '@vicons/fluent';
import { useTurnStats } from '@/composables/useTurnStats';
import TraceFlowDialog from './trace/TraceFlowDialog.vue';
import { normalizeLiveTrace, type SessionTrace } from './trace/traceTypes';

const props = defineProps<{
  /** 当前会话的全部消息（activeMessages） */
  messages?: any[];
  /** 会话 id：链路追踪弹框按会话拉 /traces */
  sessionId?: string | number | null;
  /**
   * 上下文占用（已用 Token / 窗口 Token / 占用率）。
   *
   * 由父组件 ChatPanel 传入而不是本组件自己调 useSessionTokenStats：
   * 那个 composable 每次调用都会注册 watcher，组件各调一次就会对同一会话
   * 重复拉两次 /token-stats，白白多一轮请求。
   */
  contextUsed?: number;
  contextTotal?: number;
  contextPercent?: number;
  /**
   * 上下文 token 构成（系统提示 / 摘要 / 用户输入 / 历史消息 / 工具定义）。
   *
   * 后端目前只在 contextStats 里下发「已用 / 窗口」两个数，没有这个分解；
   * 传空则详情卡只显示占用条与总量，不编造分项。
   */
  contextBreakdown?: Record<string, number> | null;
}>();

/** 底部状态条向上抛的事件：点「上下文窗口」图标打开主区域面板 */
const emit = defineEmits<{ 'open-context': [] }>();

/** 链路追踪弹框开关 */
const traceVisible = ref(false);

/**
 * WS 实时轨迹：从当前会话消息的 traceLog 里抽出来。
 *
 * <p>用途见 TraceFlowDialog 的 liveTraces 注释 —— 让关系图在流式过程中就能长出来，
 * 而不是等 `/traces` 落库后才看得到。这里做纯抽取 + 归一（normalizeLiveTrace），
 * 不排序也不去重，交给下游统一处理，避免两处各有一套排序规则。</p>
 */
const liveTraces = computed<SessionTrace[]>(() => {
  const out: SessionTrace[] = [];
  for (const msg of props.messages ?? []) {
    for (const content of (msg?.contents ?? [])) {
      const log = (content as any)?.traceLog;
      if (!Array.isArray(log)) continue;
      for (const raw of log) {
        const trace = normalizeLiveTrace(raw);
        if (trace) out.push(trace);
      }
    }
  }
  return out;
});

const { t } = useI18n();

/** 数值兜底：非数字一律按 0，避免聚合时出现 NaN 传播到界面上 */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const list = computed<any[]>(() => (Array.isArray(props.messages) ? props.messages : []));

// 轮次 / 步数 / 耗时 / Token / 速度：与 SessionStatusPanel 共用同一份聚合
const stats = useTurnStats(list);

const turnCount = computed(() => stats.value.rounds);

const usedTokens = computed(() => num(props.contextUsed));
const contextPct = computed(() => Math.round(num(props.contextPercent)));

/** 有消息或有上下文统计时才显示：空会话底部不摆一条全 0 的条 */
const visible = computed(() => list.value.length > 0 || usedTokens.value > 0);

/**
 * 是否处于「数据未回来」的等待态。
 *
 * 用量只在本轮 finish 之后才随消息落下来，此前消息已经在流、条也已经在显示，
 * 但三段全是「—」。这时改用骨架 + 呼吸动画，让用户看到「在等数据」而不是一片空白。
 * 只要拿到任何一路数据（会话 token 合计或上下文占用）就退出等待态。
 */
const pending = computed(() => list.value.length > 0 && stats.value.total <= 0 && usedTokens.value <= 0);

/**
 * Token 计数：≥1000 走 K/M。
 *
 * 10 万以内保留一位小数（95.6K），再往上取整（236K）——
 * 底部条只有一行，位数不能随会话变长而无限膨胀。
 */
function formatCount(value: number): string {
  if (value <= 0) return '0';
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m < 100 ? m.toFixed(1) : Math.round(m)}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `${k < 100 ? k.toFixed(1) : Math.round(k)}K`;
  }
  return String(value);
}

/**
 * 毫秒 → 「19.6秒 / 1.8秒」；无数据返回「—」。
 *
 * 一分钟以内保留一位小数（与截图里 19.6 / 37.3 / 1.8 的读法一致），
 * 超过一分钟改成分秒，避免出现「183.4秒」这种要心算的写法。
 */
function formatSeconds(ms: number): string {
  if (!ms || ms <= 0) return '—';
  const seconds = ms / 1000;
  if (seconds < 60) {
    return t('chat.runStats.second', { n: seconds.toFixed(1) });
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return t('chat.runStats.minuteSecond', { m: minutes, s: rest });
}

/**
 * 完整整数（千分位）：详情卡里要看到精确值，「143,874,702 tok」。
 * 只在悬浮卡内使用；底栏仍用 formatCount 的 K/M 缩写。
 */
function formatFull(value: number): string {
  return Math.round(num(value)).toLocaleString('en-US');
}

/** 近似值：悬浮卡里的构成用量用 ~755K 这种读法，不摆七位数 */
function formatApprox(value: number): string {
  if (!value || value <= 0) return '—';
  return `~${formatCount(value)}`;
}

const speedText = computed(() => {
  const tps = stats.value.tokensPerSecond;
  if (!tps || tps <= 0) return '—';
  return t('chat.runStats.speed', { n: Math.round(tps) });
});

const tokensText = computed(() => t('chat.runStats.tokens', { n: formatCount(stats.value.total) }));

const cacheHitText = computed(() => {
  const prompt = stats.value.prompt;
  // 没有输入 Token 就无从谈命中率，显示「—」而不是 0%
  if (prompt <= 0) return t('chat.runStats.cacheHitEmpty');
  const percent = Math.min(100, Math.round((stats.value.cached / prompt) * 100));
  return t('chat.runStats.cacheHit', { pct: percent });
});

/**
 * 上下文百分比：窗口未知时显示「—」而不是 0%。
 *
 * 0% 会让用户以为「上下文是空的」，而真相是后端还没有快照（effectiveContextWindow=0）。
 * 底栏与悬浮卡共用这一个文案，避免两处口径不一致。
 */
const contextPctText = computed(() => {
  if (!num(props.contextTotal)) return '—';
  return t('chat.runStats.percent', { pct: contextPct.value });
});

/**
 * 已用 / 窗口：~755K / 1M。
 *
 * <p>窗口未知（模型没配上下文窗口，实测 27/31 个模型如此）时**至少要显示已用**：
 * 原先 `if (!window) return '—'` 会因为一个缺失的分母，把本来已知的分子一起藏掉 ——
 * 用户看到整块「—」，误以为"没有数据"，实际后端给的 usedTokens 是有的。</p>
 */
const contextAmountText = computed(() => {
  const used = usedTokens.value;
  const window = num(props.contextTotal);
  if (!window) {
    return used > 0 ? `${formatApprox(used)} / 窗口未知` : '—';
  }
  return `${formatApprox(used)} / ${formatCount(window)}`;
});

/** Token 用量卡的命中率（纯数字，不带「缓存命中」前缀，因为行首已标） */
const cacheRateShort = computed(() => {
  const prompt = stats.value.prompt;
  if (prompt <= 0) return '—';
  return t('chat.runStats.percent', { pct: Math.min(100, Math.round((stats.value.cached / prompt) * 100)) });
});

/**
 * 上下文 token 构成。
 *
 * 五分量与 SessionStatusPanel 同源同色。
 */
const BREAKDOWN_META = [
  { key: 'systemPrompt', labelKey: 'chat.runStats.bdSystem', color: '#409eff' },
  { key: 'summary', labelKey: 'chat.runStats.bdSummary', color: '#909399' },
  { key: 'userPrompt', labelKey: 'chat.runStats.bdUser', color: '#67c23a' },
  { key: 'history', labelKey: 'chat.runStats.bdHistory', color: '#e6a23c' },
  { key: 'tools', labelKey: 'chat.runStats.bdTools', color: '#f56c6c' },
] as const;

const breakdownRows = computed(() => {
  const breakdown = props.contextBreakdown;
  if (!breakdown) return [];
  return BREAKDOWN_META
    .map((meta) => ({
      key: meta.key,
      label: t(meta.labelKey),
      color: meta.color,
      value: num((breakdown as any)[meta.key]),
    }))
    .filter((row) => row.value > 0);
});

const modelTimeText = computed(() => formatSeconds(stats.value.modelDuration));
const toolTimeText = computed(() => formatSeconds(stats.value.toolDuration));
const ttftText = computed(() => formatSeconds(stats.value.ttftAvg));

const contextHint = computed(() => {
  const used = formatCount(usedTokens.value);
  const window = num(props.contextTotal);
  return window
    ? `${t('chat.runStats.contextUsage')} ${used} / ${formatCount(window)}`
    : `${t('chat.runStats.contextUsage')} ${used}（窗口未配置，去模型管理填上下文窗口）`;
});

/** 环形进度：conic-gradient 直接由占用率驱动，颜色按危险/警告/正常分档 */
const ringColor = computed(() => {
  const percent = Math.max(0, Math.min(100, contextPct.value));
  return percent >= 80
    ? 'var(--el-color-danger)'
    : percent >= 60
      ? 'var(--el-color-warning)'
      : 'var(--el-color-primary)';
});

/** 环形周长（viewBox 20 / r=8）：dasharray 用它换算弧长 */
const RING_CIRCUM = 2 * Math.PI * 8;

/**
 * 弧长 dasharray；**占用率未知时返回空串** → 只画底环、不画弧。
 *
 * <p>窗口未配置时（实测 27/31 个模型如此）百分比本身没有意义，
 * 画一段 0% 的弧等于告诉用户「上下文是空的」。宁可只留一圈底环。</p>
 */
const ringArc = computed(() => {
  if (!num(props.contextTotal)) return '';
  const percent = Math.max(0, Math.min(100, contextPct.value));
  return `${(percent / 100) * RING_CIRCUM} ${RING_CIRCUM}`;
});
</script>

<style scoped>
/* ============================================================================
   令牌口径与同目录聊天组件一致：
   1. 颜色一律走 --el-*（refactor.css 已把 --el-* 映射到主题层，换肤仍生效）
   2. 不加投影：与输入框之间只靠 1px 上分割线区分层次
   3. 圆角、过渡取 --el-radius-* / --el-transition-duration*
   ============================================================================ */

.session-stats-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 18px;
  height: 30px;
  padding: 0 14px;
  /* 不要上边框：这条统计条是常驻的会话状态，不是一块独立分区。
     画一条分界线会把它从对话背景里"切"出来，看起来像页面上多挂了一条东西；
     去掉之后它与对话区同一底色，自然融入（内容与输入框对齐由父容器的限宽负责）。 */
  /* 与对话区同底色（浅色默认主题为白），不额外铺一层灰。
     同样乘 --content-opacity：带壁纸时不能铺一块不透明的底把壁纸盖掉。 */
  background: color-mix(
    in srgb,
    var(--color-chat-bg, var(--el-bg-color)) calc(var(--content-opacity, 1) * 100%),
    transparent
  );
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  user-select: none;
  /* 会话很长时三段信息可能超出可用宽度：宁可整体省略，也不要换行把输入区顶高 */
  overflow: hidden;
}

.stats-cluster {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 中间那段（Token / 缓存命中）允许被压缩省略：它是最长的，也是三者里最不紧急的 */
.stats-cluster--shrink {
  flex-shrink: 1;
  overflow: hidden;
}

/* 悬停浮层入口：做成一颗浅底胶囊，明确它是「可以悬停看明细」的独立控件，
   而右侧两组是纯读数的状态文本，两者视觉层级不同。 */
.stats-cluster--hover {
  padding: 3px 8px;
  margin-left: -8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  cursor: default;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.stats-cluster--hover:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
}

.stats-cluster--right {
  margin-left: auto;
}

/* 中间与右侧两组也接了悬浮卡：给同样的悬停反馈，否则鼠标移上去毫无反应，
   用户不会想到「这里也能看明细」 */
.stats-cluster--hoverable {
  padding: 3px 6px;
  border-radius: var(--el-radius-sm, 6px);
  cursor: default;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.stats-cluster--hoverable:hover {
  background: var(--el-fill-color-light);
}

.stats-icon {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stats-item {
  font-variant-numeric: tabular-nums;
}

/* 可省略的那段里的文字：超出时打点，而不是把整条栏撑出滚动 */
.stats-cluster--shrink .stats-item {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 速度是这条栏里唯一的「结论值」，加粗一档让它先被读到 */
.stats-item--strong {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

/*
  链路追踪入口：低调的描边图标按钮，不抢三段数据的主视觉。
  与状态条同高（22px），hover 才出现底色 —— 常驻但不喧宾夺主。
*/
.stats-trace-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  margin-left: 6px;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-gray, var(--el-text-color-secondary));
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.stats-trace-btn:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  color: var(--el-color-primary);
}

/* 动效降级：只关本按钮自己的 transition，不影响 Element Plus 组件内部过渡 */
@media (prefers-reduced-motion: reduce) {
  .stats-trace-btn {
    transition: none;
  }
}

.stats-sep {
  opacity: 0.45;
}

/* ============================================================================
   等待态骨架
   ----------------------------------------------------------------------------
   数据没回来时占位。宽度按真实文本量级给（轮数/步数/速度/Tok/缓存/百分比），
   真数据到达后条宽变化很小，不会出现「先很窄、突然撑开」的跳动。
   动画只动 background-position，不触发布局与重绘，CPU 开销可忽略。
   ========================================================================== */
.stats-skeleton {
  display: inline-block;
  height: 10px;
  border-radius: var(--el-radius-full, 9999px);
  /* 高光从左扫到右：三段灰阶渐变 + 超宽背景，靠位移产生流动感 */
  background: linear-gradient(
    90deg,
    var(--el-fill-color-light) 25%,
    var(--el-fill-color) 37%,
    var(--el-fill-color-light) 63%
  );
  background-size: 400% 100%;
  animation: stats-shimmer 1.4s ease infinite;
}

.stats-skeleton--w-rounds  { width: 44px; }
.stats-skeleton--w-steps   { width: 34px; }
.stats-skeleton--w-speed   { width: 58px; }
.stats-skeleton--w-tokens  { width: 62px; }
.stats-skeleton--w-cache   { width: 78px; }
.stats-skeleton--w-percent { width: 26px; }

@keyframes stats-shimmer {
  0%   { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* 等待态的环形：不画弧（占用率还不知道），只留底环，靠轻微呼吸表示「正在等」 */
.stats-ring--pending {
  animation: stats-pulse 1.4s ease-in-out infinite;
}

@keyframes stats-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

/*
  14px 环形进度（SVG）：底环 + 圆头弧。

  设计稿的关键特征是「圆头粗弧」（stroke-linecap: round）—— conic-gradient 做不到圆头，
  边也是硬的，所以从「渐变 + radial mask 挖空」换成 SVG 圆周。
  viewBox 20、r=8、实际渲染 14px ⇒ 壁厚 = 3.2 × (14/20) ≈ 2.2px。
*/
.stats-ring {
  display: inline-block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  /* 与同行 12px 文字视觉居中对齐 */
  vertical-align: -1px;
}

.stats-ring__track {
  fill: none;
  stroke: var(--el-fill-color);
  stroke-width: 3.2;
}

.stats-ring__bar {
  fill: none;
  stroke-width: 3.2;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

/* 动效降级：呼吸与弧长过渡都停，但环的形状本身仍然可见 */
@media (prefers-reduced-motion: reduce) {
  .stats-ring--pending {
    animation: none;
  }

  .stats-ring__bar {
    transition: none;
  }
}

/* 浮层内容：标签左、数值右，等宽数字避免两行数字左右跳动 */
.stats-popover {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stats-popover__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-bottom: 2px;
}

/* 标题行左右分列：左边标题（可带百分比/图标），右边总量。
   下方压一条分割线，把「总览」和「分项」分开。 */
.stats-popover__title--split {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 6px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.stats-popover__title-left {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

.stats-popover__icon {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 标题后的百分比：数值本身要更醒目，字号抬一档 */
.stats-popover__percent {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

/* 右上角总量：等宽数字，避免不同位数时右边缘抖动 */
.stats-popover__total {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 上下文占用条：细条，颜色与环形同步 */
.stats-popover__track {
  height: 5px;
  margin: 2px 0 4px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}

.stats-popover__fill {
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  transition: width var(--el-transition-duration, 0.3s) ease;
}

/* 构成明细与上方分项之间留一点呼吸，避免两段表格看起来是一张长表 */
.stats-popover__breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
}

/* 构成色块：与 SessionStatusPanel 的配色一一对应 */
.stats-popover__swatch {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 2px;
  flex-shrink: 0;
  vertical-align: baseline;
}

.stats-popover__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.stats-popover__label {
  flex-shrink: 0;
}

.stats-popover__value {
  color: var(--el-text-color-primary);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .stats-cluster--hover,
  .stats-cluster--hoverable {
    transition: none;
  }
  .stats-popover__fill {
    transition: none;
  }
  /* 减少动态效果：停掉扫光与呼吸，骨架改为静止的浅灰块。
     静止块仍能表达「这里在等数据」，不会退回成什么都没有。 */
  .stats-skeleton {
    animation: none;
    background: var(--el-fill-color-light);
  }
  .stats-ring--pending {
    animation: none;
    opacity: 0.7;
  }
}
</style>
