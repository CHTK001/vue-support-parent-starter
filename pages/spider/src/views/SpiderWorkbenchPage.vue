<template>
  <section class="spider-workbench-page">
    <ScLayout
      v-model="activeTabId"
      class="spider-workbench-layout"
      :left-enabled="true"
      :left-width="360"
      :left-min-width="320"
      :left-max-width="430"
      :main-min-width="720"
      rail-close-button-mode="always"
      :rail-tabs="railTabs"
      @tab-remove="handleRemoveTab($event.name)"
    >
      <template #left>
        <div class="spider-home-column">
          <header class="spider-home-hero">
            <div>
              <span class="spider-eyebrow">Spider / Mission Deck</span>
              <h1>运行中的爬虫</h1>
              <p>左列只盯运行卡片，右侧 Tab 负责高定制编排与执行模式。</p>
            </div>
            <button type="button" class="spider-ghost-button" @click="refreshOverview">
              刷新
            </button>
          </header>

          <section class="spider-metric-grid">
            <article class="spider-metric-card">
              <small>运行中</small>
              <strong>{{ runningCards.length }}</strong>
              <span>当前活跃任务</span>
            </article>
            <article class="spider-metric-card">
              <small>定时绑定</small>
              <strong>{{ scheduledCards.length }}</strong>
              <span>job-starter</span>
            </article>
            <article class="spider-metric-card">
              <small>AI 节点</small>
              <strong>{{ aiEnabledCount }}</strong>
              <span>ai-starter</span>
            </article>
          </section>

          <section class="spider-card-section">
            <div class="spider-section-headline">
              <div>
                <h2>运行任务卡片</h2>
                <p>保留真正需要持续观察的任务，而不是历史大表格。</p>
              </div>
              <span>{{ runningCards.length }} 张</span>
            </div>
            <div v-if="runningCards.length" class="spider-card-stack">
              <article
                v-for="card in runningCards"
                :key="card.id"
                class="spider-task-card"
                :class="{ 'is-focused': activeTabId === card.id }"
                @click="focusTab(card.id)"
              >
                <header class="spider-task-card__header">
                  <div>
                    <strong>{{ card.title }}</strong>
                    <p>{{ card.description }}</p>
                  </div>
                  <span class="spider-state-pill" :class="`is-${card.runtimeState.toLowerCase()}`">
                    {{ runtimeStateLabel(card.runtimeState) }}
                  </span>
                </header>
                <div class="spider-task-card__meta">
                  <span>{{ executionModeLabel(card.executionMode) }}</span>
                  <span>{{ card.jobBinding ? "已绑定 Job" : "手动触发" }}</span>
                  <span>{{ card.aiEnabled ? "AI 已接入" : "AI 关闭" }}</span>
                </div>
                <div class="spider-task-card__stats">
                  <div>
                    <small>最近执行</small>
                    <strong>{{ card.lastRun }}</strong>
                  </div>
                  <div>
                    <small>成功 / 失败</small>
                    <strong>{{ card.successCount }} / {{ card.failCount }}</strong>
                  </div>
                </div>
                <footer class="spider-task-card__actions">
                  <button type="button" class="spider-text-button" @click.stop="focusTab(card.id)">
                    打开编排
                  </button>
                  <button type="button" class="spider-text-button" @click.stop="previewLogs(card.id)">
                    查看日志
                  </button>
                  <button type="button" class="spider-text-button" @click.stop="duplicateTab(card.id)">
                    复制任务
                  </button>
                  <button type="button" class="spider-text-button" @click.stop="toggleRuntime(card.id)">
                    {{ card.runtimeState === "RUNNING" ? "暂停" : "运行" }}
                  </button>
                </footer>
              </article>
            </div>
            <div v-else class="spider-empty-card">
              <strong>当前没有运行中的任务</strong>
              <p>在右侧新增一个 Tab 并完成编排后，这里会自动生成卡片。</p>
            </div>
          </section>

          <section class="spider-card-section">
            <div class="spider-section-headline">
              <div>
                <h2>工作台草稿</h2>
                <p>新建 Tab 先落到草稿区，再推送到运行卡片区。</p>
              </div>
              <span>{{ draftCards.length }} 张</span>
            </div>
            <div class="spider-draft-list">
              <button
                v-for="draft in draftCards"
                :key="draft.id"
                type="button"
                class="spider-draft-card"
                @click="focusTab(draft.id)"
              >
                <strong>{{ draft.title }}</strong>
                <span>{{ executionModeLabel(draft.executionMode) }}</span>
              </button>
              <div v-if="!draftCards.length" class="spider-draft-empty">
                暂无草稿，点击右侧底部按钮即可新增。
              </div>
            </div>
          </section>
        </div>
      </template>

      <template #default>
        <div v-if="activeTab" class="spider-main-stage">
          <header class="spider-main-hero">
            <div>
              <span class="spider-eyebrow">Workbench / {{ activeTab.serial }}</span>
              <h2>{{ activeTab.title }}</h2>
              <p>开始与结束是硬约束，中间节点的输出只允许流向下一个节点输入。</p>
            </div>
            <div class="spider-main-hero__actions">
              <button type="button" class="spider-ghost-button" @click="saveActiveTab">
                {{ activeTab.unsaved ? "保存草稿" : "已保存" }}
              </button>
              <button type="button" class="spider-primary-button" @click="launchActiveTab">
                推到运行卡片
              </button>
            </div>
          </header>

          <section class="spider-command-grid">
            <article class="spider-command-card">
              <small>任务代号</small>
              <strong>{{ activeTab.taskCode }}</strong>
              <span>{{ activeTab.jobBinding ? "Job 已同步" : "等待绑定" }}</span>
            </article>
            <article class="spider-command-card">
              <small>执行模式</small>
              <strong>{{ executionModeLabel(activeTab.executionMode) }}</strong>
              <span>{{ executionModeHint(activeTab) }}</span>
            </article>
            <article class="spider-command-card">
              <small>节点总数</small>
              <strong>{{ activeTab.nodes.length }}</strong>
              <span>固定包含开始 / 结束</span>
            </article>
          </section>

          <div class="spider-stage-grid">
            <section class="spider-panel spider-panel--flow">
              <div class="spider-panel__header">
                <div>
                  <small>Visual Flow</small>
                  <h3>可视化编排</h3>
                </div>
                <div class="spider-flow-tools">
                  <button
                    v-for="template in nodeTemplates"
                    :key="template.kind"
                    type="button"
                    class="spider-node-template"
                    @click="appendNode(template.kind)"
                  >
                    <strong>{{ template.label }}</strong>
                    <span>{{ template.summary }}</span>
                  </button>
                </div>
              </div>

              <div class="spider-flow-board">
                <template v-for="(node, index) in activeTab.nodes" :key="node.id">
                  <button
                    type="button"
                    class="spider-flow-node"
                    :class="[
                      `is-${node.kind.toLowerCase()}`,
                      { 'is-selected': activeNode?.id === node.id, 'is-fixed': node.fixed },
                    ]"
                    @click="selectNode(node.id)"
                  >
                    <span class="spider-flow-node__kind">{{ nodeKindLabel(node.kind) }}</span>
                    <strong>{{ node.label }}</strong>
                    <p>{{ node.summary }}</p>
                    <div class="spider-flow-node__chips">
                      <span>{{ node.inputLabel }}</span>
                      <span>{{ node.outputLabel }}</span>
                    </div>
                    <div v-if="node.aiHints.length" class="spider-flow-node__ai">
                      <small>AI</small>
                      <span>{{ node.aiHints[0] }}</span>
                    </div>
                  </button>
                  <div v-if="index < activeTab.nodes.length - 1" class="spider-flow-connector">
                    <span>上游输出</span>
                    <i />
                    <span>下游输入</span>
                  </div>
                </template>
              </div>

              <div class="spider-flow-guard">
                <article>
                  <strong>开始 / 结束强约束</strong>
                  <p>系统节点不可删除，新增节点默认插入结束节点前。</p>
                </article>
                <article>
                  <strong>单向数据流</strong>
                  <p>当前 UI 只允许上一节点输出传给下一节点输入。</p>
                </article>
              </div>
            </section>

            <aside class="spider-side-stack">
              <section class="spider-panel spider-panel--policy">
                <div class="spider-panel__header">
                  <div>
                    <small>Execution Policy</small>
                    <h3>任务执行模式</h3>
                  </div>
                </div>

                <div class="spider-mode-grid">
                  <button
                    v-for="mode in executionModes"
                    :key="mode.value"
                    type="button"
                    class="spider-mode-card"
                    :class="{ 'is-active': activeTab.executionMode === mode.value }"
                    @click="setExecutionMode(mode.value)"
                  >
                    <strong>{{ mode.label }}</strong>
                    <p>{{ mode.description }}</p>
                  </button>
                </div>

                <div class="spider-policy-form">
                  <label class="spider-form-field">
                    <span>任务名称</span>
                    <input v-model.trim="activeTab.title" type="text" placeholder="例如：资讯入口雷达" />
                  </label>
                  <label class="spider-form-field">
                    <span>入口 URL</span>
                    <input v-model.trim="activeTab.entryUrl" type="text" placeholder="https://target.example.com/feed" />
                  </label>
                  <label class="spider-form-field spider-form-field--full">
                    <span>任务说明</span>
                    <textarea v-model.trim="activeTab.description" rows="3"></textarea>
                  </label>

                  <template v-if="activeTab.executionMode === 'ONCE'">
                    <label class="spider-form-field">
                      <span>触发方式</span>
                      <input value="手动触发立即执行" disabled type="text" />
                    </label>
                    <label class="spider-form-field">
                      <span>并发线程</span>
                      <input v-model.number="activeTab.threadCount" min="1" type="number" />
                    </label>
                  </template>

                  <template v-else-if="activeTab.executionMode === 'REPEAT_N'">
                    <label class="spider-form-field">
                      <span>执行次数</span>
                      <input v-model.number="activeTab.repeatTimes" min="1" type="number" />
                    </label>
                    <label class="spider-form-field">
                      <span>间隔秒数</span>
                      <input v-model.number="activeTab.repeatInterval" min="1" type="number" />
                    </label>
                  </template>

                  <template v-else>
                    <label class="spider-form-field spider-form-field--full">
                      <span>Cron</span>
                      <input v-model.trim="activeTab.cron" type="text" placeholder="0 */15 * * * ?" />
                    </label>
                    <label class="spider-form-field spider-form-field--full">
                      <span>Job 通道</span>
                      <input v-model.trim="activeTab.jobBindingLabel" type="text" placeholder="job-starter / spider" />
                    </label>
                  </template>
                </div>
              </section>

              <section class="spider-panel spider-panel--inspector">
                <div class="spider-panel__header">
                  <div>
                    <small>Node Inspector</small>
                    <h3>{{ activeNode?.label || "节点属性" }}</h3>
                  </div>
                  <button
                    v-if="activeNode && !activeNode.fixed"
                    type="button"
                    class="spider-text-button spider-text-button--danger"
                    @click="removeActiveNode"
                  >
                    删除节点
                  </button>
                </div>

                <template v-if="activeNode">
                  <div class="spider-inspector-shell">
                    <div class="spider-chip-strip">
                      <span>{{ nodeKindLabel(activeNode.kind) }}</span>
                      <span>{{ activeNode.fixed ? "系统节点" : "可配置节点" }}</span>
                      <span>{{ activeNode.aiCapable ? "AI 支持" : "AI 旁路" }}</span>
                    </div>
                    <label class="spider-form-field">
                      <span>节点名称</span>
                      <input v-model.trim="activeNode.label" type="text" />
                    </label>
                    <label class="spider-form-field spider-form-field--full">
                      <span>节点说明</span>
                      <textarea v-model.trim="activeNode.summary" rows="3"></textarea>
                    </label>
                    <label class="spider-form-field">
                      <span>输入数据</span>
                      <input v-model.trim="activeNode.inputLabel" type="text" />
                    </label>
                    <label class="spider-form-field">
                      <span>输出数据</span>
                      <input v-model.trim="activeNode.outputLabel" type="text" />
                    </label>

                    <div class="spider-ai-block" :class="{ 'is-disabled': !activeNode.aiCapable }">
                      <div class="spider-ai-block__head">
                        <strong>AI 助手</strong>
                        <button
                          type="button"
                          class="spider-text-button"
                          :disabled="!activeNode.aiCapable"
                          @click="applyAiPreset"
                        >
                          注入建议
                        </button>
                      </div>
                      <p>
                        {{
                          activeNode.aiCapable
                            ? "下载器、解析器、过滤器、输出器都可直接接入 ai-starter。"
                            : "开始和结束节点不直接调用 AI。"
                        }}
                      </p>
                      <div class="spider-ai-hints">
                        <span v-for="hint in activeNode.aiHints" :key="hint">{{ hint }}</span>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else class="spider-empty-card">
                  <strong>先选择一个节点</strong>
                  <p>右侧会根据节点类型切换参数与 AI 操作面板。</p>
                </div>
              </section>

              <section class="spider-panel spider-panel--runtime">
                <div class="spider-panel__header">
                  <div>
                    <small>Runtime Journal</small>
                    <h3>运行日志</h3>
                  </div>
                  <button type="button" class="spider-text-button" @click="appendLog('INFO', '手动刷新运行日志视图。')">
                    刷新日志
                  </button>
                </div>
                <div class="spider-runtime-list">
                  <article v-for="entry in activeTab.logEntries" :key="entry.id" class="spider-runtime-item">
                    <span class="spider-runtime-item__level" :class="`is-${entry.level.toLowerCase()}`">
                      {{ entry.level }}
                    </span>
                    <div>
                      <strong>{{ entry.message }}</strong>
                      <p>{{ entry.time }}</p>
                    </div>
                  </article>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </template>

      <template #rail-footer>
        <button type="button" class="spider-rail-add" @click="handleAddTab">
          +
        </button>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";

type ExecutionMode = "ONCE" | "REPEAT_N" | "SCHEDULED";
type RuntimeState = "RUNNING" | "PAUSED" | "IDLE" | "DRAFT";
type NodeKind = "START" | "DOWNLOADER" | "PROCESSOR" | "FILTER" | "PIPELINE" | "END";

type RailTab = {
  closable?: boolean;
  label?: string;
  name: string;
  title?: string;
};

type SpiderFlowNodeDraft = {
  aiCapable: boolean;
  aiHints: string[];
  fixed?: boolean;
  id: string;
  inputLabel: string;
  kind: NodeKind;
  label: string;
  outputLabel: string;
  summary: string;
};

type SpiderWorkbenchTab = {
  aiEnabled: boolean;
  cron: string;
  description: string;
  entryUrl: string;
  executionMode: ExecutionMode;
  failCount: number;
  id: string;
  jobBinding: boolean;
  jobBindingLabel: string;
  lastRun: string;
  logEntries: SpiderWorkbenchLogEntry[];
  nodes: SpiderFlowNodeDraft[];
  repeatInterval: number;
  repeatTimes: number;
  runtimeState: RuntimeState;
  selectedNodeId: string;
  serial: string;
  successCount: number;
  taskCode: string;
  threadCount: number;
  title: string;
  unsaved: boolean;
};

type SpiderWorkbenchLogEntry = {
  id: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  time: string;
};

const executionModes = [
  { value: "ONCE" as ExecutionMode, label: "一次", description: "适合即时抓取和手动排障。" },
  { value: "REPEAT_N" as ExecutionMode, label: "N 次", description: "定义固定次数与间隔，短期波次执行。" },
  { value: "SCHEDULED" as ExecutionMode, label: "定时", description: "接入 job-starter，进入长期调度。" },
];

const nodeTemplates = [
  { kind: "DOWNLOADER" as const, label: "智能下载器", summary: "HTTP / Playwright + AI 反爬建议" },
  { kind: "PROCESSOR" as const, label: "解析器", summary: "字段映射、XPath / CSS 建议" },
  { kind: "FILTER" as const, label: "过滤器", summary: "脏数据清洗与异常样本诊断" },
  { kind: "PIPELINE" as const, label: "输出节点", summary: "落库、投递、归档与 DDL 建议" },
];

let tabSeed = 3;
let nodeSeed = 20;

const workbenchTabs = ref<SpiderWorkbenchTab[]>([
  createSeedTab({
    id: "spider-live-radar",
    serial: "W-01",
    title: "资讯入口雷达",
    taskCode: "SPIDER-RADAR-01",
    runtimeState: "RUNNING",
    executionMode: "SCHEDULED",
    jobBinding: true,
    jobBindingLabel: "job-starter / spider.news",
    description: "每 15 分钟回采资讯入口，AI 负责动态修正下载器与解析器。",
    entryUrl: "https://news.example.com/feed",
    lastRun: "2 分钟前",
    successCount: 238,
    failCount: 6,
    cron: "0 */15 * * * ?",
    threadCount: 4,
    repeatTimes: 3,
    repeatInterval: 90,
    logEntries: [
      createLog("INFO", "调度器已接管本任务，等待下一次 job-starter 触发。"),
      createLog("INFO", "AI 解析器已更新 XPath 兜底规则。"),
      createLog("WARN", "下载器最近一次遇到慢加载，已启用退让重试。"),
    ],
    nodes: [
      createNode("START", { fixed: true, label: "开始", summary: "注入任务上下文与入口 URL。" }),
      createNode("DOWNLOADER", { label: "动态下载器", summary: "Playwright + Header Hint，适配慢加载站点。" }),
      createNode("PROCESSOR", { label: "AI 解析器", summary: "AI 协助生成 XPath、字段映射和回退规则。" }),
      createNode("FILTER", { label: "质量过滤器", summary: "剔除重复内容、脏字段和异常样本。" }),
      createNode("PIPELINE", { label: "结果输出", summary: "落库并回写抓取摘要。" }),
      createNode("END", { fixed: true, label: "结束", summary: "汇总指标并等待下一次调度。" }),
    ],
  }),
  createSeedTab({
    id: "spider-draft-lab",
    serial: "W-02",
    title: "商品详情实验台",
    taskCode: "SPIDER-LAB-02",
    runtimeState: "DRAFT",
    executionMode: "REPEAT_N",
    jobBinding: false,
    jobBindingLabel: "",
    description: "先跑 5 次，观察结构稳定性，再决定是否转正式调度任务。",
    entryUrl: "https://shop.example.com/detail/seed",
    lastRun: "尚未执行",
    successCount: 0,
    failCount: 0,
    cron: "",
    threadCount: 2,
    repeatTimes: 5,
    repeatInterval: 45,
    logEntries: [createLog("INFO", "草稿已创建，等待补充入口 URL 与中间节点。")],
    nodes: [
      createNode("START", { fixed: true, label: "开始", summary: "创建试验批次与抓取窗口。" }),
      createNode("END", { fixed: true, label: "结束", summary: "汇总试验结果，判断是否转正。" }),
    ],
  }),
]);

const activeTabId = ref(workbenchTabs.value[0]?.id || "");

const railTabs = computed<RailTab[]>(() =>
  workbenchTabs.value.map((tab) => ({
    name: tab.id,
    label: `${tab.serial}${tab.unsaved ? "*" : ""}`,
    title: `${tab.serial} · ${tab.title}${tab.unsaved ? " · 未保存" : ""}`,
    closable: workbenchTabs.value.length > 1,
  })),
);

const activeTab = computed(() =>
  workbenchTabs.value.find((item) => item.id === activeTabId.value),
);

const activeNode = computed(() => {
  if (!activeTab.value) return null;
  return (
    activeTab.value.nodes.find((item) => item.id === activeTab.value?.selectedNodeId) ||
    activeTab.value.nodes[0] ||
    null
  );
});

const runningCards = computed(() =>
  workbenchTabs.value.filter((item) => item.runtimeState !== "DRAFT"),
);

const draftCards = computed(() =>
  workbenchTabs.value.filter((item) => item.runtimeState === "DRAFT"),
);

const scheduledCards = computed(() =>
  workbenchTabs.value.filter((item) => item.executionMode === "SCHEDULED" && item.jobBinding),
);

const aiEnabledCount = computed(() =>
  workbenchTabs.value.reduce((count, tab) => count + tab.nodes.filter((node) => node.aiCapable).length, 0),
);

function createSeedTab(
  payload: Omit<SpiderWorkbenchTab, "aiEnabled" | "selectedNodeId" | "unsaved">,
): SpiderWorkbenchTab {
  return {
    ...payload,
    aiEnabled: payload.nodes.some((node) => node.aiCapable),
    selectedNodeId: payload.nodes[0]?.id || "",
    unsaved: false,
  };
}

function createLog(level: SpiderWorkbenchLogEntry["level"], message: string): SpiderWorkbenchLogEntry {
  return {
    id: `log-${nodeSeed++}`,
    level,
    message,
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function createNode(kind: NodeKind, overrides: Partial<SpiderFlowNodeDraft> = {}): SpiderFlowNodeDraft {
  const base = nodeBlueprint(kind);
  return {
    ...base,
    ...overrides,
    id: overrides.id || `${kind.toLowerCase()}-${nodeSeed++}`,
  };
}

function nodeBlueprint(kind: NodeKind): SpiderFlowNodeDraft {
  switch (kind) {
    case "START":
      return { id: "start", kind, label: "开始", summary: "注入任务上下文。", inputLabel: "无", outputLabel: "SeedContext", aiCapable: false, aiHints: [], fixed: true };
    case "DOWNLOADER":
      return { id: "downloader", kind, label: "下载器", summary: "取回 HTML、API 或动态渲染内容。", inputLabel: "SeedContext", outputLabel: "RawDocument", aiCapable: true, aiHints: ["请求头建议", "反爬诊断", "失败重试策略"] };
    case "PROCESSOR":
      return { id: "processor", kind, label: "解析器", summary: "字段提取、结构化映射和回退规则。", inputLabel: "RawDocument", outputLabel: "StructuredPayload", aiCapable: true, aiHints: ["XPath 生成", "CSS 兜底", "字段映射建议"] };
    case "FILTER":
      return { id: "filter", kind, label: "过滤器", summary: "去重、清洗和异常样本判断。", inputLabel: "StructuredPayload", outputLabel: "CleanPayload", aiCapable: true, aiHints: ["脏数据诊断", "去重规则建议", "异常字段修复"] };
    case "PIPELINE":
      return { id: "pipeline", kind, label: "输出节点", summary: "落库、推送或归档。", inputLabel: "CleanPayload", outputLabel: "PersistedResult", aiCapable: true, aiHints: ["字段类型推断", "DDL 建议", "输出一致性审查"] };
    case "END":
      return { id: "end", kind, label: "结束", summary: "回写指标，结束一次任务生命周期。", inputLabel: "PersistedResult", outputLabel: "RuntimeSnapshot", aiCapable: false, aiHints: [], fixed: true };
  }
}

function focusTab(id: string) {
  activeTabId.value = id;
}

function handleAddTab() {
  const id = `spider-draft-${tabSeed++}`;
  const index = workbenchTabs.value.length + 1;
  workbenchTabs.value.push(
    createSeedTab({
      id,
      serial: `W-${String(index).padStart(2, "0")}`,
      title: "新建高定爬虫",
      taskCode: `SPIDER-DRAFT-${String(index).padStart(2, "0")}`,
      runtimeState: "DRAFT",
      executionMode: "ONCE",
      jobBinding: false,
      jobBindingLabel: "",
      description: "从开始节点搭起，再决定是否接入 AI 和 Job。",
      entryUrl: "",
      lastRun: "尚未执行",
      successCount: 0,
      failCount: 0,
      cron: "",
      threadCount: 1,
      repeatTimes: 3,
      repeatInterval: 60,
      logEntries: [createLog("INFO", "新工作台已创建，默认只保留开始和结束节点。")],
      nodes: [
        createNode("START", { fixed: true, label: "开始", summary: "定义任务入口与初始上下文。" }),
        createNode("END", { fixed: true, label: "结束", summary: "接收最终结果并收口。" }),
      ],
    }),
  );
  activeTabId.value = id;
}

function handleRemoveTab(name: string | number) {
  const id = String(name);
  const index = workbenchTabs.value.findIndex((item) => item.id === id);
  if (index < 0 || workbenchTabs.value.length === 1) return;
  const tab = workbenchTabs.value[index];
  if (tab?.unsaved && typeof window !== "undefined") {
    const confirmed = window.confirm(`Tab「${tab.title}」仍有未保存修改，确认关闭吗？`);
    if (!confirmed) return;
  }
  workbenchTabs.value.splice(index, 1);
  if (activeTabId.value === id) {
    activeTabId.value = workbenchTabs.value[Math.max(0, index - 1)]?.id || workbenchTabs.value[0]?.id || "";
  }
}

function refreshOverview() {
  workbenchTabs.value = [...workbenchTabs.value];
}

function toggleRuntime(id: string) {
  const tab = workbenchTabs.value.find((item) => item.id === id);
  if (!tab) return;
  tab.runtimeState = tab.runtimeState === "RUNNING" ? "PAUSED" : "RUNNING";
  tab.lastRun = "刚刚";
  tab.unsaved = true;
  appendLog(tab.runtimeState === "RUNNING" ? "INFO" : "WARN", `${tab.title} 已切换为 ${runtimeStateLabel(tab.runtimeState)}。`, tab);
}

function saveActiveTab() {
  if (!activeTab.value) return;
  activeTab.value.unsaved = false;
  appendLog("INFO", "草稿已保存。");
}

function launchActiveTab() {
  if (!activeTab.value) return;
  activeTab.value.runtimeState = "RUNNING";
  activeTab.value.lastRun = "刚刚";
  activeTab.value.jobBinding = activeTab.value.executionMode === "SCHEDULED";
  activeTab.value.aiEnabled = activeTab.value.nodes.some((node) => node.aiCapable);
  activeTab.value.unsaved = false;
  appendLog("INFO", "任务已推送到运行卡片区。");
}

function selectNode(id: string) {
  if (!activeTab.value) return;
  activeTab.value.selectedNodeId = id;
}

function appendNode(kind: Exclude<NodeKind, "START" | "END">) {
  if (!activeTab.value) return;
  const endIndex = activeTab.value.nodes.findIndex((item) => item.kind === "END");
  const template = nodeTemplates.find((item) => item.kind === kind);
  const node = createNode(kind, { label: template?.label || nodeKindLabel(kind), summary: template?.summary || "" });
  activeTab.value.nodes.splice(Math.max(1, endIndex), 0, node);
  activeTab.value.selectedNodeId = node.id;
  activeTab.value.aiEnabled = activeTab.value.nodes.some((item) => item.aiCapable);
  activeTab.value.unsaved = true;
  appendLog("INFO", `已新增${nodeKindLabel(kind)}节点「${node.label}」。`);
}

function removeActiveNode() {
  if (!activeTab.value || !activeNode.value || activeNode.value.fixed) return;
  const removedLabel = activeNode.value.label;
  activeTab.value.nodes = activeTab.value.nodes.filter((item) => item.id !== activeNode.value?.id);
  activeTab.value.selectedNodeId = activeTab.value.nodes[0]?.id || "";
  activeTab.value.aiEnabled = activeTab.value.nodes.some((item) => item.aiCapable);
  activeTab.value.unsaved = true;
  appendLog("WARN", `节点「${removedLabel}」已从编排中移除。`);
}

function setExecutionMode(mode: ExecutionMode) {
  if (!activeTab.value) return;
  activeTab.value.executionMode = mode;
  activeTab.value.jobBinding = mode === "SCHEDULED";
  if (mode !== "SCHEDULED") {
    activeTab.value.cron = "";
    activeTab.value.jobBindingLabel = "";
  }
  activeTab.value.unsaved = true;
  appendLog("INFO", `执行模式已切换为${executionModeLabel(mode)}。`);
}

function applyAiPreset() {
  if (!activeTab.value || !activeNode.value || !activeNode.value.aiCapable) return;
  const presetMap: Record<NodeKind, string> = {
    START: "",
    DOWNLOADER: "AI 已补充 Header Hint、超时退让和动态渲染建议。",
    PROCESSOR: "AI 已生成字段映射与 XPath / CSS 双轨方案。",
    FILTER: "AI 已补充脏数据与重复样本诊断规则。",
    PIPELINE: "AI 已补充字段类型推断与 DDL 草案。",
    END: "",
  };
  activeNode.value.summary = presetMap[activeNode.value.kind] || activeNode.value.summary;
  activeTab.value.unsaved = true;
  appendLog("INFO", `AI 已注入 ${activeNode.value.label} 的节点建议。`);
}

function duplicateTab(id: string) {
  const source = workbenchTabs.value.find((item) => item.id === id);
  if (!source) return;
  const index = workbenchTabs.value.length + 1;
  const clonedId = `spider-duplicate-${tabSeed++}`;
  const clonedNodes = source.nodes.map((node) =>
    createNode(node.kind, {
      ...node,
      fixed: node.fixed,
      aiHints: [...node.aiHints],
      id: `${node.kind.toLowerCase()}-${nodeSeed++}`,
    }),
  );
  workbenchTabs.value.push(
    createSeedTab({
      ...source,
      id: clonedId,
      serial: `W-${String(index).padStart(2, "0")}`,
      title: `${source.title} 副本`,
      taskCode: `${source.taskCode}-COPY`,
      runtimeState: "DRAFT",
      lastRun: "尚未执行",
      successCount: 0,
      failCount: 0,
      logEntries: [createLog("INFO", `已从「${source.title}」复制出新草稿。`)],
      nodes: clonedNodes,
    }),
  );
  activeTabId.value = clonedId;
}

function previewLogs(id: string) {
  focusTab(id);
  appendLog("INFO", "已从任务卡片跳转到运行日志面板。");
}

function appendLog(
  level: SpiderWorkbenchLogEntry["level"],
  message: string,
  tab: SpiderWorkbenchTab | null = activeTab.value || null,
) {
  if (!tab) return;
  tab.logEntries = [createLog(level, message), ...tab.logEntries].slice(0, 8);
}

function runtimeStateLabel(state: RuntimeState) {
  return { RUNNING: "运行中", PAUSED: "已暂停", IDLE: "待命", DRAFT: "草稿" }[state];
}

function executionModeLabel(mode: ExecutionMode) {
  return { ONCE: "一次", REPEAT_N: "N 次", SCHEDULED: "定时" }[mode];
}

function executionModeHint(tab: SpiderWorkbenchTab) {
  if (tab.executionMode === "ONCE") return "手动触发，不创建调度任务。";
  if (tab.executionMode === "REPEAT_N") return `${tab.repeatTimes} 次，每 ${tab.repeatInterval} 秒推进一轮。`;
  return tab.cron ? `${tab.cron} · ${tab.jobBindingLabel || "待绑定 job-starter"}` : "需要填写 cron 并同步到 job-starter。";
}

function nodeKindLabel(kind: NodeKind) {
  return { START: "开始", DOWNLOADER: "下载器", PROCESSOR: "解析器", FILTER: "过滤器", PIPELINE: "输出", END: "结束" }[kind];
}
</script>

<style scoped lang="scss">
.spider-workbench-page {
  min-height: 100%;
  color: #1f2937;
}

.spider-workbench-layout {
  min-height: calc(100vh - 110px);
  background:
    radial-gradient(circle at top left, rgb(12 148 136 / 10%), transparent 34%),
    radial-gradient(circle at bottom right, rgb(184 88 58 / 12%), transparent 28%),
    linear-gradient(180deg, #f7f1e6 0%, #f3ede1 100%);
}

:deep(.sc-layout__left) {
  border-right: 1px solid rgb(148 163 184 / 18%);
  background: linear-gradient(180deg, rgb(253 250 244 / 96%), rgb(247 241 230 / 92%));
}

:deep(.sc-layout__main) {
  background: linear-gradient(180deg, rgb(255 251 245 / 92%), rgb(248 244 237 / 92%));
}

:deep(.sc-layout__rail) {
  border-left: 1px solid rgb(15 118 110 / 10%);
  background: linear-gradient(180deg, #16332f 0%, #102723 100%);
}

:deep(.sc-layout__rail-body) {
  padding-top: 12px;
}

:deep(.sc-layout__rail-footer) {
  border-top: 1px solid rgb(255 255 255 / 10%);
}

.spider-home-column,
.spider-main-stage {
  min-height: 100%;
}

.spider-home-column {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 28px 24px 32px;
}

.spider-main-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px 28px 32px;
}

.spider-home-hero,
.spider-main-hero,
.spider-panel,
.spider-metric-card,
.spider-task-card,
.spider-draft-card,
.spider-command-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 24px;
  background: rgb(255 252 247 / 82%);
  box-shadow: 0 18px 36px rgb(15 23 42 / 8%);
}

.spider-home-hero,
.spider-main-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 24px 22px;
}

.spider-home-hero::after,
.spider-main-hero::after,
.spider-panel::after,
.spider-task-card::after,
.spider-command-card::after {
  position: absolute;
  inset: 0 auto auto 0;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgb(12 148 136 / 12%), transparent 70%);
  content: "";
  pointer-events: none;
}

.spider-main-hero::before,
.spider-home-hero::before {
  position: absolute;
  right: -18px;
  bottom: -24px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(184 88 58 / 14%), transparent 70%);
  content: "";
  pointer-events: none;
}

.spider-eyebrow,
.spider-panel__header small,
.spider-task-card small,
.spider-command-card small {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.spider-home-hero h1,
.spider-main-hero h2 {
  margin: 10px 0 12px;
  color: #18212f;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.05;
}

.spider-home-hero p,
.spider-main-hero p,
.spider-section-headline p,
.spider-empty-card p,
.spider-flow-guard p,
.spider-mode-card p,
.spider-ai-block p,
.spider-runtime-item p {
  margin: 0;
  color: #536172;
  line-height: 1.6;
}

.spider-main-hero__actions,
.spider-home-hero > button {
  z-index: 1;
}

.spider-primary-button,
.spider-ghost-button,
.spider-text-button,
.spider-rail-add,
.spider-mode-card,
.spider-node-template,
.spider-flow-node,
.spider-draft-card {
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.spider-primary-button,
.spider-ghost-button,
.spider-text-button,
.spider-rail-add {
  border: 0;
  cursor: pointer;
}

.spider-primary-button,
.spider-ghost-button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-weight: 700;
}

.spider-primary-button {
  background: linear-gradient(135deg, #115e59, #0f766e);
  color: #f8fafc;
  box-shadow: 0 16px 28px rgb(15 118 110 / 26%);
}

.spider-primary-button:hover,
.spider-ghost-button:hover,
.spider-mode-card:hover,
.spider-node-template:hover,
.spider-flow-node:hover,
.spider-draft-card:hover,
.spider-rail-add:hover {
  transform: translateY(-2px);
}

.spider-ghost-button {
  border: 1px solid rgb(15 118 110 / 18%);
  background: rgb(255 255 255 / 72%);
  color: #134e4a;
}

.spider-text-button {
  padding: 0;
  background: transparent;
  color: #0f766e;
  font-weight: 700;
}

.spider-text-button--danger {
  color: #b45309;
}

.spider-metric-grid,
.spider-command-grid,
.spider-mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.spider-metric-card,
.spider-command-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 18px 16px;
}

.spider-metric-card strong,
.spider-command-card strong {
  color: #18212f;
  font-size: 28px;
  line-height: 1;
}

.spider-metric-card span,
.spider-command-card span,
.spider-task-card__meta span,
.spider-flow-node__chips span,
.spider-chip-strip span,
.spider-ai-hints span {
  color: #607083;
  font-size: 12px;
}

.spider-card-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.spider-section-headline,
.spider-panel__header,
.spider-task-card__header,
.spider-task-card__stats,
.spider-task-card__actions,
.spider-ai-block__head,
.spider-runtime-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.spider-section-headline h2,
.spider-panel__header h3 {
  margin: 6px 0 0;
  color: #18212f;
  font-size: 20px;
}

.spider-section-headline span {
  color: #7c6655;
  font-size: 13px;
  font-weight: 700;
}

.spider-card-stack,
.spider-draft-list,
.spider-side-stack,
.spider-runtime-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spider-task-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  cursor: pointer;
}

.spider-task-card.is-focused {
  border-color: rgb(15 118 110 / 35%);
  box-shadow: 0 20px 36px rgb(15 118 110 / 14%);
}

.spider-task-card__header strong {
  display: block;
  margin-bottom: 6px;
  color: #18212f;
  font-size: 17px;
}

.spider-task-card__header p {
  margin: 0;
  color: #5b6977;
  line-height: 1.5;
}

.spider-state-pill {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.spider-state-pill.is-running {
  background: rgb(12 148 136 / 12%);
  color: #0f766e;
}

.spider-state-pill.is-paused,
.spider-runtime-item__level.is-warn {
  background: rgb(217 119 6 / 12%);
  color: #b45309;
}

.spider-state-pill.is-idle {
  background: rgb(51 65 85 / 12%);
  color: #475569;
}

.spider-state-pill.is-draft {
  background: rgb(99 102 241 / 10%);
  color: #5b21b6;
}

.spider-task-card__meta,
.spider-task-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.spider-task-card__stats div {
  padding: 12px;
  border-radius: 16px;
  background: rgb(248 250 252 / 86%);
}

.spider-task-card__stats strong {
  display: block;
  margin-top: 4px;
  color: #18212f;
  font-size: 18px;
}

.spider-draft-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px dashed rgb(15 118 110 / 24%);
  border-radius: 18px;
  background: rgb(255 255 255 / 68%);
  color: #1f2937;
  cursor: pointer;
}

.spider-draft-card strong {
  font-size: 15px;
}

.spider-draft-empty,
.spider-empty-card {
  padding: 18px;
  border: 1px dashed rgb(148 163 184 / 35%);
  border-radius: 20px;
  background: rgb(255 255 255 / 56%);
}

.spider-empty-card strong {
  display: block;
  margin-bottom: 8px;
  color: #18212f;
}

.spider-stage-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
  gap: 18px;
  align-items: start;
}

.spider-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
}

.spider-flow-tools {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.spider-node-template {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgb(15 118 110 / 16%);
  border-radius: 18px;
  background: rgb(243 250 249 / 88%);
  text-align: left;
  cursor: pointer;
}

.spider-node-template strong,
.spider-flow-node strong,
.spider-runtime-item strong {
  color: #18212f;
}

.spider-node-template span,
.spider-flow-node p,
.spider-runtime-item p {
  color: #607083;
  font-size: 12px;
}

.spider-flow-board {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spider-flow-node {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border: 1px solid rgb(148 163 184 / 20%);
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(255 255 255 / 84%), rgb(247 250 252 / 80%));
  text-align: left;
  cursor: pointer;
}

.spider-flow-node.is-selected {
  border-color: rgb(15 118 110 / 34%);
  box-shadow: 0 16px 30px rgb(15 118 110 / 12%);
}

.spider-flow-node.is-fixed {
  background: linear-gradient(180deg, rgb(242 242 240 / 92%), rgb(234 234 229 / 92%));
}

.spider-flow-node.is-downloader {
  border-left: 4px solid #0f766e;
}

.spider-flow-node.is-processor {
  border-left: 4px solid #2563eb;
}

.spider-flow-node.is-filter {
  border-left: 4px solid #b45309;
}

.spider-flow-node.is-pipeline {
  border-left: 4px solid #7c3aed;
}

.spider-flow-node__kind {
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.spider-flow-node__chips,
.spider-chip-strip,
.spider-ai-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spider-flow-node__chips span,
.spider-chip-strip span,
.spider-ai-hints span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgb(15 118 110 / 8%);
}

.spider-flow-node__ai {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #115e59;
}

.spider-flow-node__ai small {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgb(15 118 110 / 12%);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.spider-flow-connector {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 0 14px;
  color: #687789;
  font-size: 12px;
}

.spider-flow-connector i {
  height: 1px;
  background: linear-gradient(90deg, rgb(15 118 110 / 10%), rgb(15 118 110 / 45%), rgb(15 118 110 / 10%));
}

.spider-flow-guard {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.spider-flow-guard article {
  padding: 16px;
  border-radius: 18px;
  background: rgb(248 250 252 / 72%);
}

.spider-flow-guard strong {
  display: block;
  margin-bottom: 6px;
  color: #18212f;
}

.spider-mode-grid {
  gap: 12px;
}

.spider-mode-card {
  padding: 16px;
  border: 1px solid rgb(148 163 184 / 22%);
  border-radius: 18px;
  background: rgb(255 255 255 / 70%);
  text-align: left;
  cursor: pointer;
}

.spider-mode-card.is-active {
  border-color: rgb(15 118 110 / 34%);
  background: linear-gradient(180deg, rgb(240 253 250 / 96%), rgb(230 247 244 / 92%));
  box-shadow: 0 14px 30px rgb(15 118 110 / 12%);
}

.spider-mode-card strong {
  display: block;
  margin-bottom: 8px;
  color: #18212f;
}

.spider-policy-form,
.spider-inspector-shell {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.spider-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spider-form-field--full {
  grid-column: 1 / -1;
}

.spider-form-field span {
  color: #516071;
  font-size: 13px;
  font-weight: 700;
}

.spider-form-field input,
.spider-form-field textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgb(148 163 184 / 24%);
  border-radius: 16px;
  background: rgb(255 255 255 / 80%);
  color: #18212f;
  font: inherit;
  outline: none;
}

.spider-form-field input:focus,
.spider-form-field textarea:focus {
  border-color: rgb(15 118 110 / 34%);
  box-shadow: 0 0 0 4px rgb(15 118 110 / 10%);
}

.spider-form-field textarea {
  min-height: 94px;
  resize: vertical;
}

.spider-ai-block {
  grid-column: 1 / -1;
  padding: 16px;
  border: 1px solid rgb(15 118 110 / 16%);
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(236 253 245 / 86%), rgb(240 249 255 / 84%));
}

.spider-ai-block.is-disabled {
  opacity: 0.72;
}

.spider-runtime-list {
  max-height: 320px;
  overflow: auto;
}

.spider-runtime-item {
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgb(248 250 252 / 78%);
}

.spider-runtime-item__level {
  flex-shrink: 0;
  min-width: 54px;
  padding: 8px 10px;
  border-radius: 999px;
  color: #0f766e;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.12em;
  background: rgb(15 118 110 / 10%);
}

.spider-runtime-item__level.is-error {
  background: rgb(220 38 38 / 12%);
  color: #b91c1c;
}

.spider-rail-add {
  width: 100%;
  min-height: 52px;
  background: transparent;
  color: #d1fae5;
  font-size: 28px;
  font-weight: 300;
}

@media (width <= 1440px) {
  .spider-stage-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .spider-flow-tools,
  .spider-metric-grid,
  .spider-command-grid,
  .spider-mode-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 960px) {
  .spider-home-hero,
  .spider-main-hero,
  .spider-panel__header,
  .spider-task-card__header,
  .spider-task-card__actions,
  .spider-runtime-item {
    flex-direction: column;
  }

  .spider-main-stage,
  .spider-home-column {
    padding: 20px 18px 24px;
  }

  .spider-policy-form,
  .spider-inspector-shell,
  .spider-task-card__meta,
  .spider-task-card__stats,
  .spider-flow-guard,
  .spider-flow-tools,
  .spider-metric-grid,
  .spider-command-grid,
  .spider-mode-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
