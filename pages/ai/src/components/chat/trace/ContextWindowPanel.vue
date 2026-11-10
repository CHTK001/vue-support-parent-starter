<template>
  <!--
    上下文窗口面板。

    数据分工（不编数字）：
      1. 总量 / 占比 / 分类构成：GET /v2/sessions/{id}/token-stats，
         由后端在每次流式结束时落库（usedTokens + effectiveContextWindow + breakdown）。
      2. 条目明细：会话消息（文件读取、工具结果、用户输入、历史消息），
         由 GET /v2/sessions/{id}/messages 还原。
    分类方块图只画 breakdown 真实存在的 5 个键；「文件」「工具结果」是会话内容的
    子集，只在明细页签里展开，不重复计入占比 —— 否则同一段 token 会被算两遍。
  -->
  <div class="cw-panel">
    <header class="cw-head">
      <div class="cw-head-row">
        <span class="cw-title">上下文窗口</span>
        <span class="cw-badge" :class="healthClass">{{ healthLabel }}</span>
        <span class="cw-amount" :title="amountTitle">{{ amountText }}</span>
      </div>
      <div class="cw-head-row cw-head-row--sub">
        <span class="cw-sub" :title="usageTitle">{{ usageText }}</span>
        <span class="cw-sub cw-sub--right" :title="cacheTitle">提示词缓存命中 {{ cacheRateText }}</span>
      </div>
    </header>

    <div v-if="loading && !tokenStats" class="cw-state">读取上下文用量…</div>

    <!-- 分类方块图：每个色块可点击，点一下就把下面明细切到该分类 -->
    <template v-else-if="hasBreakdown || hasWindow">
      <div class="cw-stack" role="group" aria-label="上下文分类构成">
        <button
          v-for="row in catRows"
          :key="row.key"
          type="button"
          class="cw-seg"
          :class="{ 'is-active': activeTab === row.key }"
          :style="{ width: row.share + '%', background: row.color }"
          :title="`${row.label}：${formatTokens(row.value)} token（${formatPercent(row.share)}）`"
          :aria-label="`${row.label}，${formatTokens(row.value)} token`"
          @click="pickTab(activeTab === row.key ? 'all' : row.key)"
        />
        <div
          v-if="freeShare > 0"
          class="cw-seg cw-seg--free"
          :style="{ width: freeShare + '%' }"
          :title="`剩余空间：${formatTokens(remainingTokens)} token`"
        />
      </div>

      <div class="cw-legend">
        <button
          v-for="row in catRows"
          :key="row.key"
          type="button"
          class="cw-chip"
          :class="{ 'is-active': activeTab === row.key }"
          @click="pickTab(activeTab === row.key ? 'all' : row.key)"
        >
          <i class="cw-dot" :style="{ background: row.color }" />
          <span>{{ row.label }}</span>
          <b>{{ formatTokens(row.value) }}</b>
        </button>
        <span v-if="hasWindow" class="cw-chip cw-chip--free">
          <i class="cw-dot cw-dot--free" />
          <span>剩余空间</span>
          <b>{{ formatTokens(remainingTokens) }}</b>
        </span>
      </div>
    </template>

    <div v-else class="cw-state cw-state--empty">
      <p class="cw-state-title">这个会话还没有上下文用量快照</p>
      <p class="cw-state-desc">
        分类占比由后端在每次流式结束时落库。本会话没有快照（模型未登记上下文窗口，或还没有跑完一轮对话），
        因此这里不画分类占比，也不推测数字。下面是会话消息里能还原的内容明细。
      </p>
      <button v-if="loadError" type="button" class="cw-state-action" @click="reload">重试</button>
    </div>

    <p v-if="loadError" class="cw-error">{{ loadError }}</p>

    <section class="cw-detail">
      <header class="cw-detail-head">
        <span class="cw-detail-title">内容明细</span>
        <span class="cw-detail-note">
          即本次发给模型的内容。明细由会话消息还原，token 按后端同一估算口径（字符数 × 1.5）折算，
          与实际请求体可能有差异；「文件」「工具结果」是会话内容的子集，不额外计入上方占比。
        </span>
      </header>

      <div class="cw-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="cw-tab"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-selected="activeTab === tab.key"
          @click="pickTab(tab.key)"
        >
          {{ tab.label }}<em>{{ tab.count }}</em>
        </button>
      </div>

      <div class="cw-rows">
        <div v-for="entry in visibleEntries" :key="entry.id" class="cw-entry">
          <!-- 每个条目都是一颗可点击的行：点开后在下方展开卡片 -->
          <button
            type="button"
            class="cw-row"
            :aria-expanded="expandedId === entry.id"
            @click="toggleEntry(entry.id)"
          >
            <span class="cw-row-icon" :style="{ color: entry.color, borderColor: entry.color }">
              {{ entry.short }}
            </span>
            <span class="cw-row-main">
              <span class="cw-row-title">{{ entry.title }}</span>
              <span class="cw-row-sub">{{ entry.subtitle }}</span>
            </span>
            <span class="cw-row-bar">
              <i :style="{ width: entry.share + '%', background: entry.color }" />
            </span>
            <span class="cw-row-token">
              {{ entry.tokens === null ? '—' : formatTokens(entry.tokens) + ' token' }}
            </span>
            <span class="cw-row-chevron" :class="{ 'is-open': expandedId === entry.id }">›</span>
          </button>

          <div v-if="expandedId === entry.id" class="cw-card">
            <div class="cw-card-head">
              <span class="cw-card-title">
                {{ entry.kind === 'file' ? '文件' : entry.kind === 'tool' ? '工具结果' : '内容' }}
                <span v-if="entry.path" class="cw-card-path" :title="entry.path"> · {{ entry.path }}</span>
                <span v-else> · {{ entry.title }}</span>
              </span>
              <span class="cw-card-token">
                {{ entry.tokens === null ? 'token 未逐条下发' : formatTokens(entry.tokens) + ' token' }}
              </span>
            </div>
            <p class="cw-card-note">{{ entry.note }}</p>
            <div class="cw-card-sub">
              <span v-if="entry.toolName" class="cw-card-tag">{{ entry.toolName }}</span>
              <span v-if="entry.outcome" class="cw-card-tag" :class="{ 'is-failed': entry.outcome !== 'success' }">
                {{ entry.outcome === 'success' ? '成功' : entry.outcome }}
              </span>
              <span class="cw-card-hint">工具结果{{ entry.toolName ? ' · ' + entry.toolName : '' }}</span>
            </div>
            <pre class="cw-code">{{ entry.content || '（该条目没有可展示的正文）' }}</pre>
            <footer class="cw-card-foot">
              <span class="cw-card-count">该分类共 {{ countOf(entry.category) }} 条</span>
              <button type="button" class="cw-card-btn" @click="toggleEntry(entry.id)">收起</button>
            </footer>
          </div>
        </div>

        <div v-if="!visibleEntries.length" class="cw-rows-empty">
          {{ loadingMessages ? '读取会话消息…' : '该分类没有可展开的条目' }}
        </div>
      </div>
    </section>

    <footer class="cw-foot">
      <span class="cw-foot-count">全部条目 · {{ entries.length }}</span>
      <span class="cw-foot-spacer" />
      <!--
        刷新期间必须给出「看得见」的信号：本机后端常在几十毫秒内返回，
        只有 :disabled 的置灰在真实网络下一闪而过，用户与验收脚本都抓不到。
        这里加转圈 + 最短可见时长（见 MIN_LOADING_MS），禁用态因此有确定的可观察特征。
      -->
      <button
        type="button"
        class="cw-foot-btn cw-foot-btn--refresh"
        :class="{ 'is-loading': showLoading }"
        :disabled="showLoading"
        :aria-busy="showLoading"
        @click="reload"
      >
        <span v-if="showLoading" class="cw-spin" aria-hidden="true" />
        <span>刷新</span>
      </button>
      <button type="button" class="cw-foot-btn cw-foot-btn--primary" @click="emit('close')">关闭</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { apiService } from "@/services/ApiService";
import { useSessionTokenStats } from "@/composables/useSessionTokenStats";

/**
 * 面板只接收会话标识：
 *   - 用量走 useSessionTokenStats（与底部状态条同源，避免同会话两处各拉一次算出两个数）；
 *   - 条目走消息接口，由本组件自己取，父组件不必先渲染对话列表。
 */
const props = defineProps<{ sessionId: string | number }>();
const emit = defineEmits<{ close: [] }>();

const sessionIdRef = computed(() => (props.sessionId ? String(props.sessionId) : null));
const { tokenStats, loading, fetchTokenStats } = useSessionTokenStats(sessionIdRef);

/** 消息：条目明细的唯一来源 */
const messages = ref<any[]>([]);
const loadingMessages = ref(false);
const loadError = ref("");

/**
 * 五个分类与后端 breakdown 的键一一对应。
 *
 * 颜色沿用 --el-* 令牌（refactor.css 已映射到主题层），不写死 hex：
 * 换肤 / 暗色下不会出现一块刺眼的固定色。
 */
const BREAKDOWN_META = [
  { key: "systemPrompt", label: "系统提示词", color: "var(--el-color-primary)", short: "系" },
  { key: "tools", label: "工具定义", color: "var(--el-color-danger)", short: "具" },
  { key: "summary", label: "摘要", color: "var(--el-color-info)", short: "摘" },
  { key: "userPrompt", label: "用户输入", color: "var(--el-color-success)", short: "用" },
  { key: "history", label: "对话消息", color: "var(--el-color-warning)", short: "史" },
] as const;

/** 明细里额外的两个视图：来自会话消息，不属于 breakdown 的独立分类 */
const FILE_COLOR = "var(--el-color-primary-light-3)";
const TOOL_RESULT_COLOR = "var(--el-color-danger-light-3)";

const breakdown = computed<Record<string, number>>(() => {
  const raw = (tokenStats.value?.breakdown || {}) as Record<string, number>;
  const out: Record<string, number> = {};
  for (const meta of BREAKDOWN_META) out[meta.key] = Number(raw[meta.key]) || 0;
  return out;
});

const breakdownSum = computed(() =>
  BREAKDOWN_META.reduce((sum, meta) => sum + (breakdown.value[meta.key] || 0), 0),
);
const hasBreakdown = computed(() => breakdownSum.value > 0);

const usedTokens = computed(() => Number(tokenStats.value?.usedTokens) || 0);
const contextWindow = computed(() => Number(tokenStats.value?.totalTokens) || 0);
const hasWindow = computed(() => contextWindow.value > 0);
const remainingTokens = computed(() => Number(tokenStats.value?.remainingTokens) || 0);
const percent = computed(() => (hasWindow.value ? Math.min(100, Math.max(0, (usedTokens.value / contextWindow.value) * 100)) : 0));

/** 方块图基准：优先真实窗口；窗口未知时按构成合计画相对占比，并明确标注 */
const chartBase = computed(() => (hasWindow.value ? Math.max(contextWindow.value, breakdownSum.value) : breakdownSum.value));

const catRows = computed(() =>
  BREAKDOWN_META.map((meta) => {
    const value = breakdown.value[meta.key] || 0;
    return {
      key: meta.key,
      label: meta.label,
      color: meta.color,
      short: meta.short,
      value,
      share: chartBase.value > 0 ? (value / chartBase.value) * 100 : 0,
    };
  }).filter((row) => row.value > 0),
);

const freeShare = computed(() => {
  if (!hasWindow.value || chartBase.value <= 0) return 0;
  const free = Math.max(0, contextWindow.value - Math.max(usedTokens.value, breakdownSum.value));
  return (free / chartBase.value) * 100;
});

/** 健康徽标：窗口未知不说「健康」，因为分母都没有，健康无从谈起 */
const healthLabel = computed(() => {
  if (!hasWindow.value) return "窗口未登记";
  if (percent.value >= 85) return "接近上限";
  if (percent.value >= 60) return "偏高";
  return "健康";
});
const healthClass = computed(() => {
  if (!hasWindow.value) return "is-unknown";
  if (percent.value >= 85) return "is-danger";
  if (percent.value >= 60) return "is-warning";
  return "is-ok";
});

function formatTokens(value: number | null | undefined): string {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}
function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

const amountText = computed(() => {
  if (!usedTokens.value && !hasWindow.value) return "—";
  return `${formatTokens(usedTokens.value)} / ${hasWindow.value ? formatTokens(contextWindow.value) : "窗口未知"} token`;
});
const amountTitle = computed(() =>
  hasWindow.value
    ? `已用 ${usedTokens.value} token，窗口 ${contextWindow.value} token`
    : `已用 ${usedTokens.value} token；该模型没有登记上下文窗口`,
);

/** 平均每次请求的输入 token：用助手消息上真实的 usage.promptTokens 求均值 */
const avgRequestTokens = computed(() => {
  const prompts: number[] = [];
  for (const msg of messages.value) {
    if (!msg || msg.role !== "assistant") continue;
    const usage = msg?.metadata?.usage || msg?.contents?.[0]?.metadata?.usage;
    const prompt = Number(usage?.promptTokens) || 0;
    if (prompt > 0) prompts.push(prompt);
  }
  if (!prompts.length) return 0;
  return prompts.reduce((a, b) => a + b, 0) / prompts.length;
});
const requestsLeft = computed(() => {
  if (!hasWindow.value || avgRequestTokens.value <= 0) return null;
  return Math.max(0, Math.floor(remainingTokens.value / avgRequestTokens.value));
});

const usageText = computed(() => {
  if (!hasWindow.value) {
    return usedTokens.value > 0 ? `已用 ${formatTokens(usedTokens.value)}（窗口未登记）` : "窗口未登记";
  }
  const base = `已用 ${formatPercent(percent.value)}`;
  return requestsLeft.value === null ? base : `${base} · 约还能容纳 ${requestsLeft.value} 个请求`;
});
const usageTitle = computed(() =>
  hasWindow.value
    ? `已用 ${usedTokens.value} / ${contextWindow.value} token${avgRequestTokens.value > 0 ? `；按本会话平均每次请求 ${formatTokens(avgRequestTokens.value)} token 估算剩余请求数` : "；没有历史请求用量，不估算剩余请求数"}`
    : "后端未下发 effectiveContextWindow，无法计算占比",
);

/** 提示词缓存命中：usage.cachedTokens（新链路）或 promptCacheHitTokens（兼容字段） */
const cacheStats = computed(() => {
  let prompt = 0;
  let cached = 0;
  for (const msg of messages.value) {
    if (!msg || msg.role !== "assistant") continue;
    const usage = msg?.metadata?.usage || msg?.contents?.[0]?.metadata?.usage;
    if (!usage) continue;
    prompt += Number(usage.promptTokens) || 0;
    cached += Number(usage.cachedTokens ?? usage.promptCacheHitTokens) || 0;
  }
  return { prompt, cached };
});
const cacheRateText = computed(() => {
  if (cacheStats.value.prompt <= 0) return "—";
  const pct = Math.min(100, Math.round((cacheStats.value.cached / cacheStats.value.prompt) * 100));
  return `${pct}%`;
});
const cacheTitle = computed(() =>
  cacheStats.value.prompt > 0
    ? `缓存命中 ${cacheStats.value.cached} / 输入 ${cacheStats.value.prompt} token（会话累计）`
    : "没有可用的输入用量，无法计算缓存命中",
);

/** ============ 条目明细 ============ */

type EntryKind = "system" | "tools" | "summary" | "user" | "history" | "file" | "tool";

interface Entry {
  id: string;
  kind: EntryKind;
  /** 归属页签 */
  category: string;
  title: string;
  subtitle: string;
  /** 逐条 token；null = 后端没有逐条下发，不猜 */
  tokens: number | null;
  share: number;
  color: string;
  short: string;
  path?: string;
  toolName?: string;
  outcome?: string;
  note: string;
  content: string;
}

/** 与后端相同口径：字符数 × 1.5 */
function estimateTokens(text: string): number {
  return text ? Math.round(text.length * 1.5) : 0;
}

function parseArgs(raw: any): Record<string, any> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? raw : null;
}

function argsText(raw: any): string {
  const parsed = parseArgs(raw);
  if (parsed) return JSON.stringify(parsed, null, 2);
  return typeof raw === "string" ? raw : "";
}

function basename(p: string): string {
  const parts = String(p).replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] || String(p);
}

/**
 * 文件类工具：命中这些名字才进「文件」页签。
 *
 * 两套命名都要覆盖 —— 早期按旧运行时写的是 {@code read/write/edit/ls}，
 * 而当前 agentscope 运行时实际下发的是 {@code read_files / grep_files /
 * list_files / glob_files} 这类带下划线复数后缀的名字。只保留前者会让真实
 * 会话里所有文件操作都落到「工具结果」，参考设计里「文件 · 路径」的卡片永远出不来。
 */
const FILE_TOOLS = /^(read|view|open|cat|write|edit|apply_patch|create|save|glob|grep|list|search|ls|list_dir)(_files?|_dir)?$/i;

function messageText(msg: any): string {
  const parts: string[] = [];
  for (const content of msg?.contents || []) {
    const text = typeof content?.content === "string" ? content.content : "";
    if (text.trim()) parts.push(text);
  }
  return parts.join("\n\n");
}

const entries = computed<Entry[]>(() => {
  const out: Entry[] = [];

  // ---- 系统提示词 / 工具定义 / 摘要：后端只给合计，没有逐条原文 ----
  const sysValue = breakdown.value.systemPrompt || 0;
  if (sysValue > 0) {
    out.push({
      id: "systemPrompt",
      kind: "system",
      category: "systemPrompt",
      title: "系统提示词",
      subtitle: "由后端按字符数 × 1.5 估算",
      tokens: sysValue,
      share: 0,
      color: "var(--el-color-primary)",
      short: "系",
      note: "系统提示词的正文由后端在请求组装时注入，接口只返回估算后的合计 token，不提供原文，因此这里不展开逐段内容。",
      content: "（后端未下发表全文；合计 token 见上方分类占比）",
    });
  }

  // 工具定义：按会话里真实调用过的工具名聚合；定义体积后端未逐条下发，token 记 —。
  const toolNames = new Map<string, { count: number; args: string[] }>();
  for (const msg of messages.value) {
    for (const content of msg?.contents || []) {
      const calls = content?.metadata?.toolCalls;
      if (!Array.isArray(calls)) continue;
      for (const tc of calls) {
        const name = String(tc?.name || "").trim();
        if (!name) continue;
        const row = toolNames.get(name) || { count: 0, args: [] };
        row.count += 1;
        row.args.push(argsText(tc?.arguments ?? tc?.args).slice(0, 400));
        toolNames.set(name, row);
      }
    }
  }
  const toolValue = breakdown.value.tools || 0;
  for (const [name, row] of [...toolNames.entries()].sort((a, b) => b[1].count - a[1].count)) {
    out.push({
      id: `tool-def-${name}`,
      kind: "tools",
      category: "tools",
      title: name,
      subtitle: `本会话调用 ${row.count} 次`,
      tokens: null,
      share: 0,
      color: "var(--el-color-danger)",
      short: "具",
      note: `工具定义的 schema 由后端序列化后计入上下文（本会话合计 ${formatTokens(toolValue)} token），接口不返回单个工具的定义体积，因此这里只列调用参数。`,
      content: row.args.filter(Boolean).join("\n\n---\n\n"),
    });
  }

  const summaryValue = breakdown.value.summary || 0;
  if (summaryValue > 0) {
    out.push({
      id: "summary",
      kind: "summary",
      category: "summary",
      title: "历史压缩摘要",
      subtitle: "role=system 的压缩产物",
      tokens: summaryValue,
      share: 0,
      color: "var(--el-color-info)",
      short: "摘",
      note: "摘要由会话压缩生成，随请求以 system 消息下发；接口只返回合计 token，不提供摘要正文。",
      content: "（后端未下发摘要正文；合计 token 见上方分类占比）",
    });
  }

  // ---- 会话消息：最后一条 user = 用户输入，其余 = 对话消息 ----
  let lastUserId = "";
  for (let i = messages.value.length - 1; i >= 0; i -= 1) {
    if (messages.value[i]?.role === "user") {
      lastUserId = String(messages.value[i]?.id ?? `i-${i}`);
      break;
    }
  }
  messages.value.forEach((msg, index) => {
    const id = String(msg?.id ?? `m-${index}`);
    const text = messageText(msg);
    if (!text.trim()) return;
    const isUser = msg?.role === "user";
    const isLastUser = isUser && id === lastUserId;
    const tokens = estimateTokens(text);
    out.push({
      id: `msg-${id}`,
      kind: isLastUser ? "user" : "history",
      category: isLastUser ? "userPrompt" : "history",
      title: isLastUser ? "当前用户输入" : isUser ? "用户消息" : "助手回复",
      subtitle: isUser ? "用户消息" : "助手消息",
      tokens,
      share: 0,
      color: isLastUser ? "var(--el-color-success)" : "var(--el-color-warning)",
      short: isLastUser ? "用" : "史",
      note: "会话消息原文，随请求按角色下发。token 为按后端口径（字符数 × 1.5）的估算值。",
      content: text,
    });
  });

  // ---- 工具调用：文件读写进「文件」，其它进「工具结果」 ----
  messages.value.forEach((msg, mi) => {
    for (const [ci, content] of (msg?.contents || []).entries()) {
      const calls = content?.metadata?.toolCalls;
      if (!Array.isArray(calls)) continue;
      for (const [ti, tc] of calls.entries()) {
        const name = String(tc?.name || "").trim();
        if (!name) continue;
        const args = parseArgs(tc?.arguments ?? tc?.args);
        const path = String(args?.file_path || args?.path || args?.filename || "").trim();
        const result = typeof tc?.result === "string" ? tc.result : tc?.result ? JSON.stringify(tc.result, null, 2) : "";
        const body = result || argsText(tc?.arguments ?? tc?.args) || (typeof tc?.arguments === "string" ? tc.arguments : "");
        const isFile = !!path && FILE_TOOLS.test(name);
        const tokens = body ? estimateTokens(body) : null;
        out.push({
          id: `call-${mi}-${ci}-${ti}-${name}`,
          kind: isFile ? "file" : "tool",
          category: isFile ? "files" : "toolResult",
          title: isFile ? basename(path) : name,
          subtitle: `${name}${path ? " · " + path : ""}`,
          tokens,
          share: 0,
          color: isFile ? FILE_COLOR : TOOL_RESULT_COLOR,
          short: isFile ? "件" : "结",
          path: path || undefined,
          toolName: name,
          outcome: tc?.outcome ? String(tc.outcome) : undefined,
          note: isFile
            ? "即工具读取/写入、随后随会话内容一起发给模型的正文。token 为按后端口径（字符数 × 1.5）的估算值。"
            : "即工具返回给模型的内容。token 为按后端口径（字符数 × 1.5）的估算值。",
          content: body,
        });
      }
    }
  });

  // 行内占比条：以当前页签内最大条目为 100%，避免长短条目都挤成一根
  const max = out.reduce((m, e) => Math.max(m, e.tokens || 0), 0);
  for (const entry of out) {
    entry.share = max > 0 && entry.tokens ? Math.max(2, (entry.tokens / max) * 100) : 0;
  }
  return out;
});

const tabs = computed(() => {
  const list: Array<{ key: string; label: string; count: number }> = [
    { key: "all", label: "全部", count: entries.value.length },
    ...BREAKDOWN_META.map((meta) => ({
      key: meta.key,
      label: meta.label,
      count: entries.value.filter((e) => e.category === meta.key).length,
    })),
    { key: "files", label: "文件", count: entries.value.filter((e) => e.category === "files").length },
    { key: "toolResult", label: "工具结果", count: entries.value.filter((e) => e.category === "toolResult").length },
  ];
  // 没有条目的分类不出现：空页签会让人以为「点了就能看到东西」
  return list.filter((tab) => tab.count > 0);
});

const activeTab = ref("all");
const visibleEntries = computed(() =>
  activeTab.value === "all" ? entries.value : entries.value.filter((e) => e.category === activeTab.value),
);

function countOf(category: string): number {
  return entries.value.filter((e) => e.category === category).length;
}

const expandedId = ref<string | null>(null);
function toggleEntry(id: string) {
  expandedId.value = expandedId.value === id ? null : id;
}
function pickTab(key: string) {
  activeTab.value = key;
  expandedId.value = null;
}

async function loadMessages() {
  const sid = sessionIdRef.value;
  if (!sid) {
    messages.value = [];
    return;
  }
  loadingMessages.value = true;
  try {
    const res: any = await apiService.fetchSessionMessages(sid, { limit: 200 });
    const items = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data?.items) ? res.data.items : [];
    messages.value = items;
    loadError.value = "";
  } catch (error: any) {
    messages.value = [];
    loadError.value = `会话消息读取失败：${error instanceof Error ? error.message : String(error)}`;
  } finally {
    loadingMessages.value = false;
  }
}

/**
 * 刷新反馈的最短可见时长。
 *
 * 本机后端常在几十毫秒内返回，只靠请求期间的置灰 + 转圈，用户什么都看不到，
 * 体验上等于「点了没反应」，验收脚本也只能靠人为延迟才抓得到这个状态。
 * 这里给一次刷新兜一个下限：请求更慢时按真实时长走，请求更快时补足到 400ms，
 * 不额外发请求、不改数据，只是让「正在刷新」这件事真的可见。
 */
const MIN_LOADING_MS = 400;
const loadingFloor = ref(false);
const showLoading = computed(() => loading.value || loadingFloor.value);
let floorTimer: ReturnType<typeof setTimeout> | null = null;

function holdLoadingFloor() {
  if (floorTimer) clearTimeout(floorTimer);
  loadingFloor.value = true;
  floorTimer = setTimeout(() => {
    loadingFloor.value = false;
    floorTimer = null;
  }, MIN_LOADING_MS);
}

onBeforeUnmount(() => {
  if (floorTimer) clearTimeout(floorTimer);
});

function reload() {
  expandedId.value = null;
  holdLoadingFloor();
  void fetchTokenStats();
  void loadMessages();
}

onMounted(reload);
watch(sessionIdRef, () => {
  activeTab.value = "all";
  reload();
});
</script>

<style scoped>
/* 令牌口径与同目录聊天组件一致：颜色走 --el-*，圆角/过渡走 --el-radius-* / --el-transition-duration-* */
.cw-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 12px;
}

.cw-head {
  padding: 12px 16px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.cw-head-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cw-head-row--sub {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.cw-title {
  font-size: 14px;
  font-weight: 600;
}

.cw-badge {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 16px;
  border: 1px solid transparent;
  white-space: nowrap;
}
.cw-badge.is-ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.cw-badge.is-warning {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 14%, transparent);
}
.cw-badge.is-danger {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}
.cw-badge.is-unknown {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.cw-amount {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.cw-sub {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cw-sub--right {
  margin-left: auto;
  padding-left: 12px;
}

.cw-stack {
  display: flex;
  gap: 2px;
  height: 18px;
  margin: 12px 16px 0;
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}

.cw-seg {
  border: 0;
  padding: 0;
  min-width: 3px;
  cursor: pointer;
  transition: filter var(--el-transition-duration-fast, 0.2s) ease;
}
.cw-seg:hover {
  filter: brightness(1.12);
}
.cw-seg.is-active {
  box-shadow: inset 0 0 0 2px var(--el-text-color-primary);
}
.cw-seg--free {
  cursor: default;
  /* 剩余空间用斜纹，不占实色：避免被误读成又一种「已用内容」 */
  background: repeating-linear-gradient(
    135deg,
    var(--el-fill-color) 0 4px,
    var(--el-fill-color-dark, var(--el-fill-color-darker)) 4px 8px
  );
}
.cw-seg--free:hover {
  filter: none;
}

.cw-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 16px 12px;
}

.cw-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 11px;
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.cw-chip:hover {
  border-color: var(--el-border-color);
  background: var(--el-fill-color);
}
.cw-chip.is-active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.cw-chip b {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.cw-chip--free {
  cursor: default;
}
.cw-chip--free:hover {
  border-color: var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.cw-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: 0 0 auto;
}
.cw-dot--free {
  background: repeating-linear-gradient(
    135deg,
    var(--el-fill-color) 0 2px,
    var(--el-fill-color-dark, var(--el-fill-color-darker)) 2px 4px
  );
  border: 1px solid var(--el-border-color-lighter);
}

.cw-state {
  padding: 28px 20px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.cw-state--empty {
  text-align: left;
  padding: 20px;
  margin: 12px 16px 0;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-fill-color-lighter);
}
.cw-state-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.cw-state-desc {
  margin: 0;
  line-height: 1.7;
}
.cw-state-action {
  margin-top: 10px;
  padding: 3px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.cw-error {
  margin: 8px 16px 0;
  color: var(--el-color-danger);
  font-size: 11px;
}

.cw-detail {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 4px;
}

.cw-detail-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 16px 6px;
  min-width: 0;
}
.cw-detail-title {
  font-weight: 600;
  white-space: nowrap;
}
.cw-detail-note {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
  min-width: 0;
}

.cw-tabs {
  display: flex;
  gap: 4px;
  padding: 0 16px 8px;
  overflow-x: auto;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.cw-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}
.cw-tab:hover {
  background: var(--el-fill-color-light);
}
.cw-tab.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.cw-tab em {
  font-style: normal;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.cw-rows {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 16px 12px;
}

.cw-entry + .cw-entry {
  border-top: 1px dashed var(--el-border-color-lighter);
}

.cw-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 4px;
  border: 0;
  border-radius: var(--el-radius-sm, 4px);
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.cw-row:hover {
  background: var(--el-fill-color-light);
}
.cw-row:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -1px;
}

.cw-row-icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border: 1px solid currentColor;
  border-radius: 4px;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}
.cw-row-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1 1 220px;
}
.cw-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cw-row-sub {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cw-row-bar {
  flex: 0 0 96px;
  height: 4px;
  border-radius: 2px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.cw-row-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
}
.cw-row-token {
  flex: 0 0 88px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.cw-row-chevron {
  flex: 0 0 12px;
  color: var(--el-text-color-secondary);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
}
.cw-row-chevron.is-open {
  transform: rotate(90deg);
}

.cw-rows-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
}

/* 展开卡片：与参考图一致 —— 卡片头（文件/工具结果 + token）、说明行、正文代码块、底部工具条 */
.cw-card {
  margin: 2px 0 10px 26px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-fill-color-lighter);
  overflow: hidden;
}
.cw-card-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 8px 10px 4px;
  min-width: 0;
}
.cw-card-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}
.cw-card-path {
  font-weight: 400;
  color: var(--el-text-color-regular);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
}
.cw-card-token {
  margin-left: auto;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}
.cw-card-note {
  margin: 0;
  padding: 0 10px 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
}
.cw-card-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px 6px;
}
.cw-card-tag {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-fill-color-dark, var(--el-fill-color-darker));
  color: var(--el-text-color-regular);
  font-size: 10px;
  line-height: 16px;
}
.cw-card-tag.is-failed {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.cw-card-hint {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}
.cw-code {
  margin: 0;
  max-height: 320px;
  overflow: auto;
  padding: 10px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--el-text-color-regular);
}
.cw-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
}
.cw-card-count {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.cw-card-btn {
  margin-left: auto;
  padding: 2px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 11px;
  cursor: pointer;
}

.cw-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
}
.cw-foot-spacer {
  flex: 1;
}
.cw-foot-btn {
  padding: 3px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.cw-foot-btn:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}
.cw-foot-btn--primary {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white, #fff);
}
.cw-foot-btn--primary:hover {
  color: var(--el-color-white, #fff);
  filter: brightness(1.06);
}
.cw-foot-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 刷新按钮：加载中的转圈。只用 opacity 表达状态不行 —— 本机请求太快，
   真实网络下用户看不到任何「正在刷新」的迹象。 */
.cw-foot-btn--refresh {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.cw-spin {
  width: 10px;
  height: 10px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cw-spin 0.7s linear infinite;
}
@keyframes cw-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
