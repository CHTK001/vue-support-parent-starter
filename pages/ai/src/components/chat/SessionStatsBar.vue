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
        <span class="stats-ring stats-ring--pending"></span>
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
    <el-popover v-else trigger="hover" placement="top-start" :width="272" :show-arrow="true">
      <template #reference>
        <div class="stats-cluster stats-cluster--shrink stats-cluster--hoverable">
          <el-icon class="stats-icon"><DataLine20Regular /></el-icon>
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
    <el-popover v-else trigger="hover" placement="top-end" :width="272" :show-arrow="true">
      <template #reference>
        <div class="stats-cluster stats-cluster--right stats-cluster--hoverable">
          <span class="stats-ring" :style="ringStyle" role="img" :aria-label="contextHint"></span>
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timer } from '@element-plus/icons-vue';
import { DataLine20Regular } from '@vicons/fluent';
import { useTurnStats } from '@/composables/useTurnStats';

const props = defineProps<{
  /** 当前会话的全部消息（activeMessages） */
  messages?: any[];
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

/** 已用 / 窗口：~755K / 1M */
const contextAmountText = computed(() => {
  const window = num(props.contextTotal);
  if (!window) return '—';
  return `${formatApprox(usedTokens.value)} / ${formatCount(window)}`;
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

const contextHint = computed(
  () => `${t('chat.runStats.contextUsage')} ${formatCount(usedTokens.value)} / ${formatCount(num(props.contextTotal))}`,
);

/** 环形进度：conic-gradient 直接由占用率驱动，颜色按危险/警告/正常分档 */
const ringColor = computed(() => {
  const percent = Math.max(0, Math.min(100, contextPct.value));
  return percent >= 80
    ? 'var(--el-color-danger)'
    : percent >= 60
      ? 'var(--el-color-warning)'
      : 'var(--el-color-primary)';
});

const ringStyle = computed(() => {
  const percent = Math.max(0, Math.min(100, contextPct.value));
  return {
    background: `conic-gradient(${ringColor.value} ${percent}%, var(--el-fill-color) ${percent}% 100%)`,
  };
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
  border-top: 1px solid var(--el-border-color-lighter);
  /* 与对话区同底色（浅色默认主题为白），只靠上边框分隔，不额外铺一层灰。
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

/* 等待态的环形：不画 conic-gradient（占用率还不知道），只留一圈淡淡的底，
   配合轻微呼吸表示「正在等」。 */
.stats-ring--pending {
  background: var(--el-fill-color);
  animation: stats-pulse 1.4s ease-in-out infinite;
}

@keyframes stats-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

/* 12px 环形进度：外层 conic-gradient 由内联 style 给色。
   挖空用 mask 而不是「叠一个内圈色块」—— 内圈色块必须知道背后是什么底色，
   而这条栏的底色是半透明的（乘了 --content-opacity），叠色块会在壁纸下露出灰芯。 */
.stats-ring {
  display: inline-block;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border-radius: var(--el-radius-full, 9999px);
  -webkit-mask: radial-gradient(closest-side, transparent 58%, #000 60%);
  mask: radial-gradient(closest-side, transparent 58%, #000 60%);
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
