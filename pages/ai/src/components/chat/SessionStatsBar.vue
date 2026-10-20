<template>
  <!--
    会话底部状态条（常驻，位于输入框下方、会话面板最底部）。

    三段信息，与「会话工作状态」面板同一套数据口径，但只取最需要一眼看到的几项：
    - 左：轮数 / 步数 / 输出速度（TPS）—— 悬停弹出「会话统计」浮层（模型用时、工具用时、TTFT、TPS）
    - 中：累计 Token / 缓存命中率
    - 右：上下文占用百分比（环形进度）

    数据来源（全部来自已有消息与父组件透传的 token 统计，不新增接口）：
    - 轮数：role=user 的消息数
    - 步数：各 content.metadata.toolCalls 数量之和（与 SessionStatusPanel 同口径）
    - 模型用时 / 工具用时：消息的 totalDurationMs - toolDurationMs / toolDurationMs
    - TTFT：usage.firstTokenLatencyMs（后端 finish 事件与历史回读都会带上）
    - 缓存命中：usage.cachedTokens ÷ usage.promptTokens
    - 上下文占用：父组件 ChatPanel 的 useSessionTokenStats 结果（REST + SSE contextStats）

    任何一项缺数据时显示「—」而不是 0，避免把「没有数据」误读成「速度/命中率为 0」。
  -->
  <div v-if="visible" class="session-stats-bar" role="group" :aria-label="t('chat.runStats.title')">
    <!-- 轮次 / 步数 / 速度：悬停看「会话统计」明细（模型用时 / 工具用时 / TTFT / TPS）。
         用 el-popover 而不是 CSS 浮层：本条的父容器 overflow:hidden，绝对定位的浮层会被裁掉，
         而 popover 会 teleport 到 body。明细信息本身在「会话工作状态」面板里也有完整版本，
         这里只做悬停速查，故不额外接管键盘焦点（避免出现一个聚焦后毫无反应的 tab 停靠点）。 -->
    <el-popover trigger="hover" placement="top-start" :width="236" :show-arrow="true">
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

    <!-- 累计 Token / 缓存命中 -->
    <div class="stats-cluster stats-cluster--shrink" :title="cacheHint">
      <el-icon class="stats-icon"><DataLine20Regular /></el-icon>
      <span class="stats-item">{{ tokensText }}</span>
      <span class="stats-sep">·</span>
      <span class="stats-item">{{ cacheHitText }}</span>
    </div>

    <!-- 上下文占用：环形 + 百分比，超过 80% 转危险色 -->
    <div class="stats-cluster stats-cluster--right" :title="contextHint">
      <span class="stats-ring" :style="ringStyle" role="img" :aria-label="contextHint"></span>
      <span class="stats-item">{{ contextText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Timer } from '@element-plus/icons-vue';
import { DataLine20Regular } from '@vicons/fluent';

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
}>();

const { t } = useI18n();

/** 数值兜底：非数字一律按 0，避免聚合时出现 NaN 传播到界面上 */
function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const list = computed<any[]>(() => (Array.isArray(props.messages) ? props.messages : []));

const assistantMessages = computed(() => list.value.filter((msg) => msg?.role === 'assistant'));

const turnCount = computed(() => list.value.filter((msg) => msg?.role === 'user').length);

/**
 * 取一条助手消息的 usage。
 *
 * 历史消息的 usage 在 message.metadata 与 content.metadata 各有一份
 * （见 AiSessionController#messages），优先 message 级；流式期间只落在 content 级，
 * 所以两级都要看，否则「正在跑的会话」底部条会一直空着。
 */
function usageOf(message: any): any {
  const direct = message?.metadata?.usage;
  if (direct) return direct;
  for (const content of message?.contents || []) {
    const nested = content?.metadata?.usage;
    if (nested) return nested;
  }
  return null;
}

/**
 * 会话级聚合：
 * - modelDuration = 总耗时 - 工具执行耗时（工具等待不是模型生成时间）
 * - 解码窗口 = modelDuration - Σ首字耗时（prefill 与网络往返不算解码）
 * - tps = 输出 Token ÷ 解码窗口，与后端 AiUsage#tokensPerSecond 同口径
 * - ttft 取有值的消息求平均（部分供应商不回传首字耗时，不能按 0 计入）
 *
 * 历史消息的 toolDurationMs 不落库（只有流式期间采集），所以老会话的
 * 「模型用时」会包含工具耗时、TPS 也会偏低；这是数据缺失而不是算错，
 * 刷新前刚跑完的会话（本次流式）不受影响。
 */
const stats = computed(() => {
  let prompt = 0;
  let completion = 0;
  let total = 0;
  let cached = 0;
  let duration = 0;
  let toolDuration = 0;
  let ttftSum = 0;
  let ttftCount = 0;
  let steps = 0;

  for (const message of assistantMessages.value) {
    const usage = usageOf(message);
    if (usage) {
      const p = num(usage.promptTokens);
      const c = num(usage.completionTokens);
      prompt += p;
      completion += c;
      total += num(usage.totalTokens) || p + c;
      // 缓存命中字段：新链路是 cachedTokens，历史/兼容字段是 promptCacheHitTokens
      cached += num(usage.cachedTokens ?? usage.promptCacheHitTokens);

      const ttft = num(usage.firstTokenLatencyMs ?? usage.firstTokenLatency);
      if (ttft > 0) {
        ttftSum += ttft;
        ttftCount += 1;
      }
    }

    duration += num(message?.totalDurationMs);
    toolDuration += num(message?.toolDurationMs);

    for (const content of message?.contents || []) {
      steps += num(content?.metadata?.toolCalls?.length);
    }
  }

  const modelDuration = Math.max(0, duration - toolDuration);
  // 每条消息都有自己的首字等待，故按 Σttft 扣减（不是按平均值扣一次）
  const decodeWindow = Math.max(0, modelDuration - ttftSum);
  const tokensPerSecond = decodeWindow > 0 ? completion / (decodeWindow / 1000) : 0;

  return {
    prompt,
    completion,
    total,
    cached,
    steps,
    modelDuration,
    toolDuration,
    tokensPerSecond,
    ttftAvg: ttftCount > 0 ? ttftSum / ttftCount : 0,
  };
});

const usedTokens = computed(() => num(props.contextUsed));
const contextPct = computed(() => Math.round(num(props.contextPercent)));

/** 有消息或有上下文统计时才显示：空会话底部不摆一条全 0 的条 */
const visible = computed(() => list.value.length > 0 || usedTokens.value > 0);

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

const contextText = computed(() => t('chat.runStats.percent', { pct: contextPct.value }));

const modelTimeText = computed(() => formatSeconds(stats.value.modelDuration));
const toolTimeText = computed(() => formatSeconds(stats.value.toolDuration));
const ttftText = computed(() => formatSeconds(stats.value.ttftAvg));

const cacheHint = computed(
  () => `${t('chat.runStats.promptTokens')} ${stats.value.prompt} / ${t('chat.runStats.cachedTokens')} ${stats.value.cached}`,
);

const contextHint = computed(
  () => `${t('chat.runStats.contextUsage')} ${formatCount(usedTokens.value)} / ${formatCount(num(props.contextTotal))}`,
);

/** 环形进度：conic-gradient 直接由占用率驱动，颜色按危险/警告/正常分档 */
const ringStyle = computed(() => {
  const percent = Math.max(0, Math.min(100, contextPct.value));
  const color = percent >= 80
    ? 'var(--el-color-danger)'
    : percent >= 60
      ? 'var(--el-color-warning)'
      : 'var(--el-color-primary)';
  return {
    background: `conic-gradient(${color} ${percent}%, var(--el-fill-color) ${percent}% 100%)`,
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

/* 悬停浮层入口：做成一颗浅底胶囊，明确它是「可以点/悬停看明细」的独立控件，
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
  .stats-cluster--hover {
    transition: none;
  }
}
</style>
