<template>
  <section class="spider-workbench-page">
    <ScLayout
      v-model="activeRailTab"
      class="spider-layout"
      :left-enabled="false"
      :main-min-width="860"
      rail-close-button-mode="always"
      :rail-tabs="railTabs"
      @tab-remove="handleRemoveTab($event.name)"
    >
      <template #left>
        <aside class="overview-panel">
          <header class="overview-header">
            <div>
              <small>Spider Dashboard</small>
              <h1>任务总览</h1>
            </div>
            <button type="button" @click="refreshOverview">刷新</button>
          </header>
          <div class="kpi-grid">
            <article>
              <small>任务总数</small>
              <strong>{{ summary.taskTotal || 0 }}</strong>
            </article>
            <article>
              <small>定时绑定</small>
              <strong>{{ summary.timerCount || 0 }}</strong>
            </article>
            <article>
              <small>采集总数</small>
              <strong>{{ summary.totalCrawled || 0 }}</strong>
            </article>
            <article>
              <small>URL 汇总</small>
              <strong>{{ summary.totalUrlsCollected || 0 }}</strong>
            </article>
          </div>
          <div class="running-card-list">
            <header>
              <h2>运行卡片</h2>
              <span>{{ runningCards.length }} 项</span>
            </header>
            <button
              v-for="card in runningCards"
              :key="card.taskId"
              type="button"
              class="running-card"
              @click="openTaskById(card.taskId)"
            >
              <strong>{{ card.taskName || `任务-${card.taskId}` }}</strong>
              <span>{{ card.status }} · {{ card.executionType }}</span>
              <small>成功 {{ card.successCount }} / 失败 {{ card.failureCount }}</small>
            </button>
            <div v-if="!runningCards.length" class="empty-box">暂无运行中的任务</div>
          </div>
        </aside>
      </template>

      <template #default>
        <div v-if="!activeWorkspace" class="home-board">
          <h2>Spider 工作台</h2>
          <p>从右侧「+」新建任务，或点击运行卡片进入已有任务。</p>
        </div>

        <div v-else class="workbench-main">
          <header class="workspace-header">
            <div>
              <small>Task #{{ activeWorkspace.taskId }}</small>
              <h2>{{ activeWorkspace.task.taskName || `任务-${activeWorkspace.taskId}` }}</h2>
            </div>
            <div class="workspace-actions">
              <button type="button" @click="saveActiveWorkspace">保存</button>
              <button type="button" @click="handleRunActiveTask">运行</button>
              <button type="button" @click="handlePauseActiveTask">暂停</button>
              <button type="button" @click="handleResumeActiveTask">恢复</button>
              <button type="button" @click="refreshActiveRuntime">刷新运行态</button>
            </div>
          </header>

          <section class="task-meta-grid">
            <label>
              <span>任务名称</span>
              <input v-model="activeWorkspace.task.taskName" placeholder="请输入任务名" />
            </label>
            <label>
              <span>入口 URL</span>
              <input v-model="activeWorkspace.task.entryUrl" placeholder="https://example.com/list" />
            </label>
            <label class="full">
              <span>任务说明</span>
              <textarea v-model="activeWorkspace.task.description" rows="2" />
            </label>
            <label>
              <span>执行类型</span>
              <select v-model="activeWorkspace.task.executionType">
                <option value="ONCE">ONCE</option>
                <option value="REPEAT_N">REPEAT_N</option>
                <option value="SCHEDULED">SCHEDULED</option>
              </select>
            </label>
            <label>
              <span>线程数</span>
              <input
                type="number"
                min="1"
                :value="activeWorkspace.policy.threadCount"
                @input="updatePolicy('threadCount', Number(($event.target as HTMLInputElement).value || 1))"
              />
            </label>
            <template v-if="activeWorkspace.task.executionType === 'REPEAT_N'">
              <label>
                <span>执行次数</span>
                <input
                  type="number"
                  min="1"
                  :value="activeWorkspace.policy.repeatTimes"
                  @input="updatePolicy('repeatTimes', Number(($event.target as HTMLInputElement).value || 1))"
                />
              </label>
              <label>
                <span>间隔秒</span>
                <input
                  type="number"
                  min="1"
                  :value="activeWorkspace.policy.repeatInterval"
                  @input="updatePolicy('repeatInterval', Number(($event.target as HTMLInputElement).value || 1))"
                />
              </label>
            </template>
            <template v-if="activeWorkspace.task.executionType === 'SCHEDULED'">
              <label>
                <span>Cron</span>
                <input :value="activeWorkspace.policy.cron" @input="updatePolicy('cron', ($event.target as HTMLInputElement).value)" />
              </label>
              <label>
                <span>Channel</span>
                <input :value="activeWorkspace.policy.jobChannel" @input="updatePolicy('jobChannel', ($event.target as HTMLInputElement).value)" />
              </label>
            </template>
          </section>

          <section class="progress-strip">
            <div class="progress-head">
              <span>运行通道：{{ runtimeChannel }}</span>
              <span v-if="runtimeError">{{ runtimeError }}</span>
              <span>lay-task：{{ layTaskAvailable ? "可用" : "不可用（降级本地展示）" }}</span>
            </div>
            <div class="progress-track">
              <i :style="{ width: `${progressPercent}%` }" />
            </div>
            <small>{{ progressText }}</small>
          </section>

          <div class="workbench-grid">
            <section class="canvas-panel">
              <div class="canvas-toolbar">
                <div class="node-palette">
                  <button
                    v-for="nodeType in nodePalette"
                    :key="nodeType"
                    type="button"
                    @click="appendNode(nodeType)"
                  >
                    {{ nodeType }}
                  </button>
                </div>
                <button
                  v-if="activeWorkspace.groupSuggestionVisible"
                  type="button"
                  class="accent"
                  @click="applyAutoGroupSuggestion"
                >
                  建议创建登录分组
                </button>
              </div>

              <div class="editor-shell">
                <ScReteEditor
                  ref="editorRef"
                  v-model="activeWorkspace.editorData"
                  :show-node-panel="false"
                  :show-property-panel="false"
                  :show-statusbar="true"
                  :show-toolbar="true"
                  :auto-arrange="true"
                  :context-menu="true"
                  :minimap="true"
                  @data-changed="onEditorDataChanged"
                  @node-selected="onEditorNodeSelected"
                />
                <div class="group-overlay">
                  <SpiderFlowGroup
                    v-for="group in activeWorkspace.flow.groups || []"
                    :key="group.groupId"
                    :group="group"
                    :active="activeWorkspace.activeGroupId === group.groupId"
                    @select="activeWorkspace.activeGroupId = $event"
                    @move="moveGroup"
                  />
                </div>
              </div>
            </section>

            <aside class="side-panel">
              <section class="panel-block">
                <header>
                  <h3>节点属性</h3>
                  <small>{{ selectedNodeType || "未选中节点" }}</small>
                </header>
                <div v-if="selectedNodeId && selectedNodeConfig" class="panel-form">
                  <label>
                    <span>节点标签</span>
                    <input :value="selectedNodeLabel" @input="updateSelectedNodeLabel(($event.target as HTMLInputElement).value)" />
                  </label>
                  <label>
                    <span>节点类型</span>
                    <select :value="selectedNodeType" @change="updateSelectedNodeType(($event.target as HTMLSelectElement).value)">
                      <option v-for="nodeType in nodePalette" :key="nodeType" :value="nodeType">{{ nodeType }}</option>
                    </select>
                  </label>
                  <NodeConditionPanel
                    v-if="selectedNodeType === 'CONDITION'"
                    :model-value="selectedNodeConfig"
                    @update:model-value="updateSelectedNodeConfig"
                  />
                  <NodeErrorHandlerPanel
                    v-else-if="selectedNodeType === 'ERROR_HANDLER'"
                    :model-value="selectedNodeConfig"
                    @update:model-value="updateSelectedNodeConfig"
                  />
                  <NodeDelayPanel
                    v-else-if="selectedNodeType === 'DELAY'"
                    :model-value="selectedNodeConfig"
                    @update:model-value="updateSelectedNodeConfig"
                  />

                  <template v-else-if="selectedNodeType === 'DATA_EXTRACTOR'">
                    <div class="extractor-head">
                      <span>字段规则</span>
                      <button type="button" @click="addExtractorField">新增字段</button>
                    </div>
                    <div class="extractor-field-list">
                      <article
                        v-for="(field, index) in extractorFields"
                        :key="`field-${index}`"
                        :class="{ active: activeWorkspace.extractorFocusIndex === index }"
                        @click="activeWorkspace.extractorFocusIndex = index"
                      >
                        <label>
                          <span>字段名</span>
                          <input :value="field.name" @input="updateExtractorField(index, 'name', ($event.target as HTMLInputElement).value)" />
                        </label>
                        <label>
                          <span>类型</span>
                          <select :value="field.selectorType" @change="updateExtractorField(index, 'selectorType', ($event.target as HTMLSelectElement).value)">
                            <option value="CSS">CSS</option>
                            <option value="XPATH">XPATH</option>
                            <option value="REGEX">REGEX</option>
                            <option value="JSON_PATH">JSON_PATH</option>
                            <option value="AI">AI</option>
                          </select>
                        </label>
                        <label class="full">
                          <span>选择器/描述</span>
                          <input
                            :value="field.selector || field.aiDescription"
                            @input="updateExtractorSelector(index, field.selectorType, ($event.target as HTMLInputElement).value)"
                          />
                        </label>
                        <div class="extractor-row-actions">
                          <button type="button" @click.stop="openSelectorDialog(index)">可视化选取</button>
                          <button type="button" @click.stop="removeExtractorField(index)">删除</button>
                        </div>
                      </article>
                    </div>
                    <div class="extractor-extra">
                      <label>
                        <span>历史 URL</span>
                        <select v-model="activeWorkspace.aiTestUrl">
                          <option value="">使用入口 URL</option>
                          <option v-for="url in crawledUrlOptions" :key="url.value" :value="url.value">{{ url.label }}</option>
                        </select>
                      </label>
                      <button type="button" @click="loadCrawledHistory">刷新历史 URL</button>
                    </div>
                    <div class="extractor-ai-test" v-if="activeExtractorField?.selectorType === 'AI'">
                      <label>
                        <span>AI 提取测试 URL</span>
                        <input v-model="activeWorkspace.aiTestUrl" placeholder="https://example.com/detail" />
                      </label>
                      <button type="button" :disabled="activeWorkspace.aiTestLoading" @click="runAiSelectorTest">
                        {{ activeWorkspace.aiTestLoading ? "测试中..." : "测试 AI 提取" }}
                      </button>
                      <ul>
                        <li v-for="(item, index) in activeWorkspace.aiTestResult" :key="`ai-${index}`">{{ item }}</li>
                        <li v-if="!activeWorkspace.aiTestResult.length">暂无结果</li>
                      </ul>
                    </div>
                  </template>
                  <template v-else>
                    <label class="full">
                      <span>节点配置(JSON)</span>
                      <textarea
                        rows="6"
                        :value="formatJson(selectedNodeConfig)"
                        @input="updateSelectedNodeConfigFromJson(($event.target as HTMLTextAreaElement).value)"
                      />
                    </label>
                  </template>
                </div>
                <div v-else class="empty-box">请选择一个节点进行配置</div>
              </section>

              <section class="panel-block">
                <header>
                  <h3>通知设置</h3>
                </header>
                <SpiderNotificationPanel
                  :model-value="activeWorkspace.notificationConfig"
                  @update:model-value="activeWorkspace.notificationConfig = $event"
                />
              </section>

              <section class="panel-block">
                <header>
                  <h3>任务级 AI 大脑</h3>
                </header>
                <SpiderBrainConfigPanel
                  :model-value="activeWorkspace.brainConfig"
                  :providers="brainProviders"
                  @update:model-value="activeWorkspace.brainConfig = $event"
                  @test="testBrainConnection"
                />
              </section>

              <section class="panel-block">
                <header>
                  <h3>运行日志</h3>
                  <button type="button" @click="refreshActiveRuntime">刷新</button>
                </header>
                <div class="runtime-list">
                  <article v-for="(item, index) in activeWorkspace.runtimeEvents" :key="`event-${index}`">
                    <strong>{{ item.type }}</strong>
                    <p>{{ item.message }}</p>
                    <small>{{ item.time }}</small>
                  </article>
                  <div v-if="!activeWorkspace.runtimeEvents.length" class="empty-box">暂无实时日志</div>
                </div>
              </section>

              <section class="panel-block">
                <header>
                  <h3>钩子日志</h3>
                </header>
                <div class="runtime-list">
                  <article v-for="(item, index) in activeWorkspace.hookLogs" :key="`hook-${index}`">
                    <strong>{{ item.nodeId || item.nodeType || "hook" }}</strong>
                    <p>{{ item.message }}</p>
                  </article>
                  <div v-if="!activeWorkspace.hookLogs.length" class="empty-box">暂无钩子触发记录</div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </template>

      <template #rail-footer>
        <button type="button" class="rail-add" @click="openCreateDialog">+</button>
      </template>
    </ScLayout>

    <div v-if="createDialogVisible" class="dialog-mask" @click.self="createDialogVisible = false">
      <section class="dialog-card">
        <header>
          <h3>新建任务</h3>
        </header>
        <label>
          <span>任务名称</span>
          <input v-model="createForm.taskName" />
        </label>
        <label>
          <span>入口 URL</span>
          <input v-model="createForm.entryUrl" />
        </label>
        <label>
          <span>执行类型</span>
          <select v-model="createForm.executionType">
            <option value="ONCE">ONCE</option>
            <option value="REPEAT_N">REPEAT_N</option>
            <option value="SCHEDULED">SCHEDULED</option>
          </select>
        </label>
        <footer>
          <button type="button" @click="createDialogVisible = false">取消</button>
          <button type="button" @click="confirmCreateTask">创建</button>
        </footer>
      </section>
    </div>

    <div v-if="selectorDialog.visible" class="dialog-mask" @click.self="closeSelectorDialog">
      <section class="selector-dialog">
        <header>
          <h3>可视化选择器</h3>
          <button type="button" @click="closeSelectorDialog">关闭</button>
        </header>
        <iframe :srcdoc="selectorDialog.srcdoc" class="selector-frame" />
        <footer>
          <div>
            <strong>候选选择器：</strong>
            <code>{{ selectorDialog.candidateSelector || "请在预览区点击元素" }}</code>
          </div>
          <button type="button" :disabled="!selectorDialog.candidateSelector" @click="applySelectorCandidate">
            确认应用
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import ScLayout from "@repo/components/ScLayout";
import { ScReteEditor, type EditorData } from "@repo/components/ScReteEditor";
import {
  createTab,
  createTask,
  deleteTab,
  getBrainConfig,
  getCrawledUrls,
  getDashboardSummary,
  getFlow,
  getNodeLogs,
  getRecords,
  getRunningCards,
  getRuntime,
  getTabs,
  getTask,
  pauseTask,
  previewPage,
  runTask,
  saveFlow,
  testAi,
  testSelector,
  updateTask,
  type DashboardSummary,
  type RunningCard,
  type SpiderFlowDefinition,
  type SpiderFlowEdge,
  type SpiderFlowGroup,
  type SpiderFlowNode,
  type SpiderTask,
  type WorkbenchTab,
} from "../api/spider-platform";
import { useSpiderRuntime } from "../composables/useSpiderRuntime";
import SpiderFlowGroupView from "../components/SpiderFlowGroup.vue";
import NodeConditionPanel from "../components/NodeConditionPanel.vue";
import NodeErrorHandlerPanel from "../components/NodeErrorHandlerPanel.vue";
import NodeDelayPanel from "../components/NodeDelayPanel.vue";
import SpiderNotificationPanel from "../components/SpiderNotificationPanel.vue";
import SpiderBrainConfigPanel from "../components/SpiderBrainConfigPanel.vue";

type SpiderNodeType =
  | "START"
  | "DOWNLOADER"
  | "URL_EXTRACTOR"
  | "DATA_EXTRACTOR"
  | "DETAIL_FETCH"
  | "PROCESSOR"
  | "FILTER"
  | "HUMAN_INPUT"
  | "PIPELINE"
  | "END"
  | "CONDITION"
  | "ERROR_HANDLER"
  | "DELAY"
  | "MERGE"
  | "TRANSFORMER";

type WorkspaceEvent = { type: string; message: string; time: string };

type Workspace = {
  activeGroupId: string;
  aiTestLoading: boolean;
  aiTestResult: string[];
  aiTestUrl: string;
  brainConfig: Record<string, any>;
  crawledUrls: any[];
  editorData: EditorData;
  extractorFocusIndex: number;
  flow: SpiderFlowDefinition;
  groupSuggestionVisible: boolean;
  hookLogs: any[];
  nodeConfigById: Record<string, any>;
  nodeLogs: any[];
  nodeTypeById: Record<string, SpiderNodeType>;
  notificationConfig: Record<string, any>;
  policy: Record<string, any>;
  records: any[];
  runtime: any;
  runtimeEvents: WorkspaceEvent[];
  selectedNodeId: string;
  task: SpiderTask;
  taskId: number;
};

const SpiderFlowGroup = SpiderFlowGroupView;
const summary = reactive<DashboardSummary>({
  latestTask: {},
  taskTotal: 0,
  timerCount: 0,
  totalCrawled: 0,
  totalUrlsCollected: 0,
});
const runningCards = ref<RunningCard[]>([]);
const taskTabs = ref<WorkbenchTab[]>([]);
const activeRailTab = ref<string | number>("home");
const workspaceMap = reactive<Record<string, Workspace>>({});
const brainProviders = ref<string[]>(["deepseek", "openai", "qwen", "zhipu", "ollama"]);
const editorRef = ref<InstanceType<typeof ScReteEditor>>();

const nodePalette: SpiderNodeType[] = [
  "DOWNLOADER",
  "URL_EXTRACTOR",
  "DATA_EXTRACTOR",
  "DETAIL_FETCH",
  "PROCESSOR",
  "FILTER",
  "HUMAN_INPUT",
  "PIPELINE",
  "CONDITION",
  "ERROR_HANDLER",
  "DELAY",
  "MERGE",
  "TRANSFORMER",
];

const createDialogVisible = ref(false);
const createForm = reactive({
  taskName: "新建爬虫任务",
  entryUrl: "https://example.com",
  executionType: "ONCE" as SpiderTask["executionType"],
});

const selectorDialog = reactive({
  candidateSelector: "",
  fieldIndex: -1,
  srcdoc: "",
  visible: false,
});

const parseJson = (text: any, fallback: Record<string, any> = {}) => {
  if (!text) return { ...fallback };
  if (typeof text === "object") return { ...fallback, ...text };
  try {
    const parsed = JSON.parse(String(text));
    return parsed && typeof parsed === "object" ? { ...fallback, ...parsed } : { ...fallback };
  } catch {
    return { ...fallback };
  }
};

const stringifyJson = (value: any) => JSON.stringify(value || {}, null, 2);

const nowText = () => new Date().toLocaleString("zh-CN", { hour12: false });

const railTabs = computed(() => [
  { closable: false, label: "首页", name: "home", title: "Spider 首页" },
  ...taskTabs.value.map((tab) => ({
    closable: tab.closeable,
    label: tab.title || `任务-${tab.taskId}`,
    name: `task-${tab.id}`,
    title: tab.title || `任务-${tab.taskId}`,
  })),
]);

const activeTaskTab = computed(() =>
  taskTabs.value.find((tab) => `task-${tab.id}` === String(activeRailTab.value)),
);

const activeWorkspace = computed(() => {
  const taskId = activeTaskTab.value?.taskId;
  if (!taskId) return null;
  return workspaceMap[String(taskId)] || null;
});

const activeWorkspaceKey = computed(() => String(activeTaskTab.value?.taskId || ""));
const selectedNodeId = computed(() => activeWorkspace.value?.selectedNodeId || "");
const selectedNodeType = computed(() => {
  if (!activeWorkspace.value || !selectedNodeId.value) return "";
  return activeWorkspace.value.nodeTypeById[selectedNodeId.value] || "";
});
const selectedNodeConfig = computed(() => {
  if (!activeWorkspace.value || !selectedNodeId.value) return null;
  return activeWorkspace.value.nodeConfigById[selectedNodeId.value] || {};
});
const selectedNodeLabel = computed(() => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return "";
  return ws.editorData.nodes.find((node) => node.id === selectedNodeId.value)?.label || "";
});

const extractorFields = computed(() => {
  const config = selectedNodeConfig.value;
  return Array.isArray(config?.fields) ? config.fields : [];
});

const activeExtractorField = computed(() => {
  const ws = activeWorkspace.value;
  if (!ws) return null;
  const index = ws.extractorFocusIndex;
  const fields = extractorFields.value;
  return index >= 0 && index < fields.length ? fields[index] : null;
});

const crawledUrlOptions = computed(() => {
  const ws = activeWorkspace.value;
  if (!ws) return [];
  return ws.crawledUrls.map((item: any) => {
    const value = item.url || ws.task.entryUrl || "";
    const label = item.url
      ? item.url
      : `记录 ${item.recordId || "-"} · 请求数 ${item.totalRequests || 0}`;
    return { label, value };
  });
});

const layTaskAvailable = computed(
  () => Boolean((globalThis as any).layTaskProgress || (globalThis as any).layTask),
);

const runtimeProgress = computed(() => {
  const ws = activeWorkspace.value;
  if (!ws) return { done: 0, total: 0, percent: 0, text: "无运行数据" };
  const done = Number(ws.runtime?.successCount || 0) + Number(ws.runtime?.failureCount || 0);
  const latestRecord = ws.records[0];
  const total = Number(latestRecord?.totalRequests || done || 0);
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : done > 0 ? 100 : 0;
  return { done, total, percent, text: `${done}/${total || "?"}` };
});

const progressPercent = computed(() => runtimeProgress.value.percent);
const progressText = computed(() => `进度 ${runtimeProgress.value.text}`);

const runtimeChannel = ref("idle");
const runtimeError = ref("");

const runtimeBridge = useSpiderRuntime({
  onEvent: (event) => {
    const ws = activeWorkspace.value;
    if (!ws) return;
    runtimeChannel.value = event.channel;
    const payload = event.data && typeof event.data === "object" ? event.data : { message: String(event.data || "") };
    const message = payload.message || JSON.stringify(payload);
    ws.runtimeEvents.unshift({
      type: payload.status ? `${event.type}:${payload.status}` : event.type,
      message,
      time: nowText(),
    });
    ws.runtimeEvents = ws.runtimeEvents.slice(0, 80);
    if (/hook|beforeDownload|afterDownload/i.test(message)) {
      ws.hookLogs.unshift({
        message,
        nodeId: payload.nodeId || "",
      });
      ws.hookLogs = ws.hookLogs.slice(0, 50);
    }
  },
  onSnapshot: (snapshot) => {
    const ws = activeWorkspace.value;
    if (!ws) return;
    ws.runtime = snapshot || {};
  },
});

const flowNodeTypeToEditorType = (nodeType: SpiderNodeType) => {
  if (nodeType === "START") return "input";
  if (nodeType === "END") return "output";
  if (nodeType === "CONDITION") return "condition";
  if (nodeType === "MERGE") return "merge";
  if (nodeType === "DELAY") return "delay";
  return "process";
};

const editorTypeToFlowNodeType = (editorType: string): SpiderNodeType => {
  if (editorType === "input") return "START";
  if (editorType === "output") return "END";
  if (editorType === "condition") return "CONDITION";
  if (editorType === "merge") return "MERGE";
  if (editorType === "delay") return "DELAY";
  return "PROCESSOR";
};

const parseEdgePorts = (edgeId?: string) => {
  const text = String(edgeId || "");
  const mark = "::";
  if (!text.includes(mark)) return { sourceOutput: "output", targetInput: "input" };
  const payload = text.slice(text.lastIndexOf(mark) + mark.length);
  const [sourceOutput, targetInput] = payload.split("->");
  return {
    sourceOutput: sourceOutput || "output",
    targetInput: targetInput || "input",
  };
};

const buildEdgeId = (
  sourceId: string,
  sourceOutput: string,
  targetId: string,
  targetInput: string,
) => `edge-${sourceId}-${targetId}::${sourceOutput}->${targetInput}`;

const formatJson = (value: any) => stringifyJson(value);

const ensureWorkspaceLoaded = async (taskId: number) => {
  const key = String(taskId);
  if (workspaceMap[key]) return;

  const [task, flow] = await Promise.all([
    getTask(taskId),
    getFlow(taskId).catch(() => ({ nodes: [], edges: [], groups: [] } as SpiderFlowDefinition)),
  ]);

  const normalizedFlow: SpiderFlowDefinition = {
    edges: [],
    groups: [],
    nodes: [],
    ...(flow || {}),
    edges: Array.isArray(flow?.edges) ? flow.edges : [],
    groups: Array.isArray(flow?.groups) ? flow.groups : [],
    nodes: Array.isArray(flow?.nodes) ? flow.nodes : [],
  };

  const editorData: EditorData = {
    connections: normalizedFlow.edges.map((edge: SpiderFlowEdge) => ({
      sourceId: edge.sourceNodeId,
      targetId: edge.targetNodeId,
      ...parseEdgePorts(edge.edgeId),
    })),
    nodes: normalizedFlow.nodes.map((node: SpiderFlowNode) => ({
      controls: {},
      id: node.nodeId,
      label: node.label || node.nodeId,
      position: {
        x: Number(node.positionX ?? 120),
        y: Number(node.positionY ?? 120),
      },
      type: flowNodeTypeToEditorType(node.nodeType as SpiderNodeType) as any,
    })),
  };

  const nodeTypeById: Record<string, SpiderNodeType> = {};
  const nodeConfigById: Record<string, any> = {};
  normalizedFlow.nodes.forEach((node: SpiderFlowNode) => {
    nodeTypeById[node.nodeId] = String(node.nodeType || "PROCESSOR") as SpiderNodeType;
    nodeConfigById[node.nodeId] = node.config || {};
  });

  const policy = parseJson(task.executionPolicy, {
    cron: "0 */30 * * * ?",
    executionType: task.executionType || "ONCE",
    jobChannel: "default",
    repeatInterval: 60,
    repeatTimes: 3,
    threadCount: 1,
  });
  const notificationConfig = parseJson(policy.notification, {
    channels: ["site"],
    receivers: "",
    triggers: ["onFailure"],
  });
  const brainConfig = parseJson(task.aiProfile, {
    contextWindow: 8192,
    enabled: true,
    model: "deepseek-chat",
    provider: "deepseek",
    temperature: 0.7,
  });

  workspaceMap[key] = reactive({
    activeGroupId: "",
    aiTestLoading: false,
    aiTestResult: [],
    aiTestUrl: task.entryUrl || "",
    brainConfig,
    crawledUrls: [],
    editorData,
    extractorFocusIndex: 0,
    flow: normalizedFlow,
    groupSuggestionVisible: false,
    hookLogs: [],
    nodeConfigById,
    nodeLogs: [],
    nodeTypeById,
    notificationConfig,
    policy,
    records: [],
    runtime: {},
    runtimeEvents: [],
    selectedNodeId: normalizedFlow.nodes[0]?.nodeId || "",
    task,
    taskId,
  } as Workspace);

  detectGroupSuggestion(workspaceMap[key]);
  await refreshWorkspaceRuntime(taskId);
}

const loadTabsAndOverview = async () => {
  const [summaryData, cards, tabs, brainConfig] = await Promise.all([
    getDashboardSummary(),
    getRunningCards(),
    getTabs(),
    getBrainConfig().catch(() => ({ providers: [] })),
  ]);
  Object.assign(summary, summaryData || {});
  runningCards.value = Array.isArray(cards) ? cards : [];
  taskTabs.value = (Array.isArray(tabs) ? tabs : []).filter((tab) => tab.tabType === "TASK");
  const providerList = Array.isArray(brainConfig?.providers)
    ? brainConfig.providers.map((row: any) => row?.name).filter(Boolean)
    : [];
  if (providerList.length) {
    brainProviders.value = providerList;
  }
  if (!taskTabs.value.length) {
    activeRailTab.value = "home";
  } else if (
    !taskTabs.value.find((tab) => `task-${tab.id}` === String(activeRailTab.value))
  ) {
    activeRailTab.value = `task-${taskTabs.value[0].id}`;
  }
};

const refreshOverview = async () => {
  await loadTabsAndOverview();
};

const openTaskById = async (taskId: number) => {
  const target = taskTabs.value.find((tab) => Number(tab.taskId) === Number(taskId));
  if (target) {
    activeRailTab.value = `task-${target.id}`;
    return;
  }
  const tab = await createTab({
    closeable: true,
    tabType: "TASK",
    taskId,
    title: `任务-${taskId}`,
  });
  await loadTabsAndOverview();
  activeRailTab.value = `task-${tab.id}`;
};

const openCreateDialog = () => {
  createDialogVisible.value = true;
};

const confirmCreateTask = async () => {
  const result = await createTask();
  const taskId = Number(result.taskId || 0);
  if (!taskId) {
    throw new Error("创建任务失败：未返回 taskId");
  }

  await updateTask(
    taskId,
    {
      entryUrl: createForm.entryUrl,
      executionType: createForm.executionType,
      taskName: createForm.taskName,
    } as SpiderTask,
    result.flow,
  );

  const tab = await createTab({
    closeable: true,
    tabType: "TASK",
    taskId,
    title: createForm.taskName || `任务-${taskId}`,
  });
  createDialogVisible.value = false;
  await loadTabsAndOverview();
  activeRailTab.value = `task-${tab.id}`;
};

const handleRemoveTab = async (name: string | number) => {
  const key = String(name);
  const tab = taskTabs.value.find((item) => `task-${item.id}` === key);
  if (!tab?.id) return;
  await deleteTab(tab.id);
  delete workspaceMap[String(tab.taskId)];
  await loadTabsAndOverview();
};

const refreshWorkspaceRuntime = async (taskId: number) => {
  const ws = workspaceMap[String(taskId)];
  if (!ws) return;
  const [runtime, records] = await Promise.all([
    getRuntime(taskId).catch(() => ({})),
    getRecords(taskId).catch(() => []),
  ]);
  ws.runtime = runtime || {};
  ws.records = Array.isArray(records) ? records : [];
  const latestRecord = ws.records[0];
  if (latestRecord?.id) {
    const nodeLogs = await getNodeLogs(taskId, Number(latestRecord.id)).catch(() => []);
    ws.nodeLogs = Array.isArray(nodeLogs) ? nodeLogs : [];
    const hookLogs = ws.nodeLogs
      .filter((row: any) => /hook|beforeDownload|afterDownload/i.test(JSON.stringify(row || {})))
      .map((row: any) => ({
        message: row.errorMsg || row.outputSummary || row.inputSummary || "hook",
        nodeId: row.nodeId,
        nodeType: row.nodeType,
      }));
    ws.hookLogs = hookLogs;
  }
};

const refreshActiveRuntime = async () => {
  if (!activeWorkspace.value) return;
  await refreshWorkspaceRuntime(activeWorkspace.value.taskId);
};

const onEditorDataChanged = (data: EditorData) => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  ws.editorData = JSON.parse(JSON.stringify(data));
  syncNodeStateByEditor(ws);
  detectGroupSuggestion(ws);
};

const onEditorNodeSelected = (node: any) => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  ws.selectedNodeId = node?.id || "";
};

const syncNodeStateByEditor = (ws: Workspace) => {
  const validIds = new Set(ws.editorData.nodes.map((node) => node.id));
  Object.keys(ws.nodeTypeById).forEach((id) => {
    if (!validIds.has(id)) {
      delete ws.nodeTypeById[id];
      delete ws.nodeConfigById[id];
    }
  });
  ws.editorData.nodes.forEach((node) => {
    if (!ws.nodeTypeById[node.id]) {
      ws.nodeTypeById[node.id] = editorTypeToFlowNodeType(node.type as string);
    }
    if (!ws.nodeConfigById[node.id]) {
      ws.nodeConfigById[node.id] = {};
    }
  });
};

const detectGroupSuggestion = (ws: Workspace) => {
  const humanIds = Object.entries(ws.nodeTypeById)
    .filter(([, type]) => type === "HUMAN_INPUT")
    .map(([id]) => id);
  const hasLoginGroup = (ws.flow.groups || []).some((group) =>
    (group.nodeIds || []).some((id) => humanIds.includes(id)),
  );
  ws.groupSuggestionVisible = humanIds.length > 0 && !hasLoginGroup;
};

const appendNode = async (nodeType: SpiderNodeType) => {
  const ws = activeWorkspace.value;
  const editor = editorRef.value;
  if (!ws || !editor) return;
  const editorType = flowNodeTypeToEditorType(nodeType);
  const node = await editor.addNode(editorType as any, nodeType);
  if (!node) return;
  ws.nodeTypeById[node.id] = nodeType;
  ws.nodeConfigById[node.id] = defaultNodeConfig(nodeType);
  ws.selectedNodeId = node.id;
  syncNodeStateByEditor(ws);
  detectGroupSuggestion(ws);
};

const defaultNodeConfig = (nodeType: SpiderNodeType) => {
  if (nodeType === "DATA_EXTRACTOR") {
    return {
      fields: [
        {
          aiDescription: "",
          attribute: "text",
          multi: false,
          name: "title",
          required: true,
          selector: "",
          selectorType: "CSS",
        },
      ],
    };
  }
  if (nodeType === "CONDITION") {
    return { conditionType: "field_compare", field: "status", op: "eq", value: "" };
  }
  if (nodeType === "ERROR_HANDLER") {
    return { maxRetries: 3, retryIntervalMs: 2000, strategy: "retry" };
  }
  if (nodeType === "DELAY") {
    return { fixedDelayMs: 1000, maxDelayMs: 2000, minDelayMs: 300, mode: "fixed" };
  }
  if (nodeType === "HUMAN_INPUT") {
    return {
      inputFieldName: "userInput",
      onTimeout: "fail",
      promptText: "请输入人工确认信息",
      timeoutSeconds: 300,
      waitType: "text_input",
    };
  }
  return {};
};

const applyAutoGroupSuggestion = () => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  const humanIds = Object.entries(ws.nodeTypeById)
    .filter(([, type]) => type === "HUMAN_INPUT")
    .map(([id]) => id);
  if (!humanIds.length) return;

  const related = new Set<string>(humanIds);
  ws.editorData.connections.forEach((edge) => {
    if (humanIds.includes(edge.sourceId) || humanIds.includes(edge.targetId)) {
      related.add(edge.sourceId);
      related.add(edge.targetId);
    }
  });

  const group: SpiderFlowGroup = {
    backgroundColor: "linear-gradient(160deg, rgba(228,165,45,.16), rgba(200,132,28,.1))",
    groupId: `group-login-${Date.now()}`,
    height: 220,
    nodeIds: Array.from(related),
    title: "登录子流程",
    width: 520,
    x: 80,
    y: 80,
  };
  ws.flow.groups = [...(ws.flow.groups || []), group];
  ws.groupSuggestionVisible = false;
};

const moveGroup = ({ groupId, dx, dy }: { groupId: string; dx: number; dy: number }) => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  ws.flow.groups = (ws.flow.groups || []).map((group) => {
    if (group.groupId !== groupId) return group;
    const movedIds = new Set(group.nodeIds || []);
    const nodes = ws.editorData.nodes.map((node) =>
      movedIds.has(node.id)
        ? { ...node, position: { x: node.position.x + dx, y: node.position.y + dy } }
        : node,
    );
    ws.editorData = {
      ...ws.editorData,
      nodes,
    };
    return {
      ...group,
      x: Number(group.x || 0) + dx,
      y: Number(group.y || 0) + dy,
    };
  });
};

const updateSelectedNodeConfig = (value: Record<string, any>) => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  ws.nodeConfigById[selectedNodeId.value] = value || {};
};

const updateSelectedNodeConfigFromJson = (text: string) => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  try {
    ws.nodeConfigById[selectedNodeId.value] = JSON.parse(text || "{}");
  } catch {
    // ignore invalid json in editing
  }
};

const updateSelectedNodeType = (value: string) => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  ws.nodeTypeById[selectedNodeId.value] = value as SpiderNodeType;
  if (!ws.nodeConfigById[selectedNodeId.value]) {
    ws.nodeConfigById[selectedNodeId.value] = defaultNodeConfig(value as SpiderNodeType);
  }
};

const updateSelectedNodeLabel = (label: string) => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  ws.editorData = {
    ...ws.editorData,
    nodes: ws.editorData.nodes.map((node) =>
      node.id === selectedNodeId.value ? { ...node, label } : node,
    ),
  };
};

const addExtractorField = () => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  const config = { ...(ws.nodeConfigById[selectedNodeId.value] || {}) };
  const fields = Array.isArray(config.fields) ? [...config.fields] : [];
  fields.push({
    aiDescription: "",
    attribute: "text",
    multi: false,
    name: `field_${fields.length + 1}`,
    required: false,
    selector: "",
    selectorType: "CSS",
  });
  config.fields = fields;
  ws.nodeConfigById[selectedNodeId.value] = config;
  ws.extractorFocusIndex = fields.length - 1;
};

const removeExtractorField = (index: number) => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  const config = { ...(ws.nodeConfigById[selectedNodeId.value] || {}) };
  const fields = Array.isArray(config.fields) ? [...config.fields] : [];
  fields.splice(index, 1);
  config.fields = fields;
  ws.nodeConfigById[selectedNodeId.value] = config;
  ws.extractorFocusIndex = Math.max(0, index - 1);
};

const updateExtractorField = (index: number, key: string, value: any) => {
  const ws = activeWorkspace.value;
  if (!ws || !selectedNodeId.value) return;
  const config = { ...(ws.nodeConfigById[selectedNodeId.value] || {}) };
  const fields = Array.isArray(config.fields) ? [...config.fields] : [];
  if (!fields[index]) return;
  fields[index] = { ...fields[index], [key]: value };
  config.fields = fields;
  ws.nodeConfigById[selectedNodeId.value] = config;
};

const updateExtractorSelector = (index: number, selectorType: string, value: string) => {
  if (selectorType === "AI") {
    updateExtractorField(index, "aiDescription", value);
  } else {
    updateExtractorField(index, "selector", value);
  }
};

const loadCrawledHistory = async () => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  ws.crawledUrls = await getCrawledUrls(ws.taskId).catch(() => []);
};

const runAiSelectorTest = async () => {
  const ws = activeWorkspace.value;
  const field = activeExtractorField.value;
  if (!ws || !field) return;
  ws.aiTestLoading = true;
  ws.aiTestResult = [];
  try {
    const url = ws.aiTestUrl || ws.task.entryUrl;
    const selector = field.aiDescription || field.selector || "";
    ws.aiTestResult = await testSelector(url, selector, "AI");
  } finally {
    ws.aiTestLoading = false;
  }
};

const buildSelectorSrcDoc = (html: string, baseUrl: string) => {
  const safeBase = baseUrl ? `<base href="${baseUrl.replaceAll('"', "&quot;")}">` : "";
  const inject = `
<script>
(function () {
  const getSelector = function (el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + el.id;
    const parts = [];
    let current = el;
    while (current && current.nodeType === 1 && parts.length < 6) {
      let part = current.tagName.toLowerCase();
      if (current.classList && current.classList.length) {
        part += "." + Array.from(current.classList).slice(0, 2).join(".");
      } else if (current.parentElement) {
        const same = Array.from(current.parentElement.children).filter(function (item) { return item.tagName === current.tagName; });
        if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(current) + 1) + ")";
      }
      parts.unshift(part);
      current = current.parentElement;
      if (part.indexOf("#") >= 0) break;
    }
    return parts.join(" > ");
  };
  document.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.target;
    if (!target || !target.tagName) return;
    window.parent.postMessage({
      type: "spider-selector-pick",
      selector: getSelector(target)
    }, "*");
  }, true);
})();
<\\/script>`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${safeBase}${inject}`);
  }
  return `<html><head>${safeBase}${inject}</head><body>${html}</body></html>`;
};

const openSelectorDialog = async (fieldIndex: number) => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  selectorDialog.visible = true;
  selectorDialog.fieldIndex = fieldIndex;
  selectorDialog.candidateSelector = "";
  const url = ws.aiTestUrl || ws.task.entryUrl;
  const preview = await previewPage(url, "playwright").catch(() => ({}));
  selectorDialog.srcdoc = buildSelectorSrcDoc(preview?.html || "", preview?.baseUrl || url);
};

const closeSelectorDialog = () => {
  selectorDialog.visible = false;
  selectorDialog.candidateSelector = "";
  selectorDialog.fieldIndex = -1;
  selectorDialog.srcdoc = "";
};

const applySelectorCandidate = () => {
  const ws = activeWorkspace.value;
  if (!ws || selectorDialog.fieldIndex < 0 || !selectorDialog.candidateSelector) return;
  updateExtractorField(selectorDialog.fieldIndex, "selectorType", "CSS");
  updateExtractorField(selectorDialog.fieldIndex, "selector", selectorDialog.candidateSelector);
  closeSelectorDialog();
};

const onSelectorMessage = (event: MessageEvent) => {
  const payload = event.data;
  if (!payload || payload.type !== "spider-selector-pick") return;
  selectorDialog.candidateSelector = payload.selector || "";
};

const updatePolicy = (key: string, value: any) => {
  if (!activeWorkspace.value) return;
  activeWorkspace.value.policy = {
    ...activeWorkspace.value.policy,
    [key]: value,
  };
};

const toFlowPayload = (ws: Workspace): SpiderFlowDefinition => {
  const nodes: SpiderFlowNode[] = ws.editorData.nodes.map((node) => ({
    aiAssistantConfig: undefined,
    config: ws.nodeConfigById[node.id] || {},
    label: node.label,
    nodeId: node.id,
    nodeType: ws.nodeTypeById[node.id] || editorTypeToFlowNodeType(node.type as string),
    positionX: Number(node.position.x || 0),
    positionY: Number(node.position.y || 0),
  }));
  const edges: SpiderFlowEdge[] = ws.editorData.connections.map((edge) => ({
    edgeId: buildEdgeId(edge.sourceId, edge.sourceOutput || "output", edge.targetId, edge.targetInput || "input"),
    sourceNodeId: edge.sourceId,
    targetNodeId: edge.targetId,
  }));
  return {
    ...(ws.flow || {}),
    edges,
    groups: ws.flow.groups || [],
    nodes,
    taskId: ws.taskId,
  };
};

const saveActiveWorkspace = async () => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  const flowPayload = toFlowPayload(ws);
  ws.flow = flowPayload;
  const policy = {
    ...ws.policy,
    executionType: ws.task.executionType,
    notification: ws.notificationConfig,
  };
  ws.task.executionPolicy = stringifyJson(policy);
  ws.task.aiProfile = stringifyJson(ws.brainConfig);
  await updateTask(ws.taskId, ws.task, flowPayload);
  await saveFlow(ws.taskId, flowPayload);
  await refreshOverview();
};

const handleRunActiveTask = async () => {
  if (!activeWorkspace.value) return;
  await runTask(activeWorkspace.value.taskId);
  await refreshActiveRuntime();
};

const handlePauseActiveTask = async () => {
  if (!activeWorkspace.value) return;
  await pauseTask(activeWorkspace.value.taskId);
  await refreshActiveRuntime();
};

const handleResumeActiveTask = async () => {
  if (!activeWorkspace.value) return;
  await resumeTask(activeWorkspace.value.taskId);
  await refreshActiveRuntime();
};

const testBrainConnection = async () => {
  const ws = activeWorkspace.value;
  if (!ws) return;
  const result = await testAi(ws.brainConfig.provider, ws.brainConfig.model, ws.brainConfig.apiKey);
  ws.runtimeEvents.unshift({
    message: result?.message || "测试完成",
    time: nowText(),
    type: "ai-test",
  });
};

watch(
  activeWorkspaceKey,
  async (taskIdText) => {
    runtimeBridge.stop();
    runtimeError.value = "";
    if (!taskIdText) return;
    const taskId = Number(taskIdText);
    if (!taskId) return;
    await ensureWorkspaceLoaded(taskId);
    runtimeBridge.start(taskId);
    runtimeChannel.value = runtimeBridge.channel.value;
    runtimeError.value = runtimeBridge.lastError.value;
  },
  { immediate: true },
);

watch(
  () => runtimeBridge.channel.value,
  (value) => {
    runtimeChannel.value = value;
  },
);

watch(
  () => runtimeBridge.lastError.value,
  (value) => {
    runtimeError.value = value;
  },
);

onMounted(async () => {
  window.addEventListener("message", onSelectorMessage);
  await loadTabsAndOverview();
});

onUnmounted(() => {
  window.removeEventListener("message", onSelectorMessage);
  runtimeBridge.stop();
});
</script>

<style scoped lang="scss">
.spider-workbench-page {
  min-height: 100%;
  color: #22303f;
}

.spider-layout {
  min-height: calc(100vh - 100px);
  background:
    radial-gradient(circle at 4% 2%, rgba(17, 158, 149, 0.15), transparent 26%),
    radial-gradient(circle at 92% 96%, rgba(198, 123, 34, 0.18), transparent 20%),
    linear-gradient(180deg, #f4ede2 0%, #efe8dc 100%);
}

.overview-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.overview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.overview-header h1 {
  margin: 6px 0 0;
  font-size: 22px;
}

.overview-header small {
  color: #0f766e;
  letter-spacing: 0.08em;
}

.overview-header button,
.workspace-actions button,
.canvas-toolbar button,
.panel-block > header button,
.dialog-card footer button {
  border: 0;
  border-radius: 10px;
  padding: 8px 12px;
  background: #115e59;
  color: #fff;
  cursor: pointer;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.kpi-grid article {
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.72);
}

.kpi-grid strong {
  display: block;
  margin-top: 6px;
  font-size: 22px;
}

.running-card-list {
  display: grid;
  gap: 8px;
}

.running-card-list header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.running-card {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 12px;
  padding: 10px;
  text-align: left;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}

.running-card strong {
  display: block;
}

.home-board {
  min-height: 100%;
  display: grid;
  place-content: center;
  gap: 10px;
  text-align: center;
}

.workbench-main {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.74);
}

.workspace-header h2 {
  margin: 4px 0 0;
}

.workspace-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.74);
}

.task-meta-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-meta-grid label.full {
  grid-column: 1 / -1;
}

.task-meta-grid span,
.panel-form span {
  font-size: 12px;
  color: #516071;
}

input,
select,
textarea,
button {
  font: inherit;
}

.task-meta-grid input,
.task-meta-grid select,
.task-meta-grid textarea,
.panel-form input,
.panel-form select,
.panel-form textarea,
.extractor-extra select,
.extractor-extra input,
.dialog-card input,
.dialog-card select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.92);
}

.progress-strip {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.72);
  display: grid;
  gap: 8px;
}

.progress-head {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #516071;
}

.progress-track {
  width: 100%;
  height: 10px;
  background: rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.progress-track i {
  display: block;
  height: 100%;
  background: linear-gradient(135deg, #0f766e, #1a8f86);
  transition: width 0.2s ease;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(380px, 0.9fr);
  gap: 12px;
}

.canvas-panel,
.side-panel .panel-block {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 10px;
}

.node-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.node-palette button {
  border: 1px solid rgba(15, 118, 110, 0.24);
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(15, 118, 110, 0.08);
  color: #0f766e;
}

.canvas-toolbar button.accent {
  background: #8a5a0e;
}

.editor-shell {
  position: relative;
  min-height: 560px;
}

.group-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.group-overlay :deep(.spider-flow-group) {
  pointer-events: auto;
}

.side-panel {
  display: grid;
  gap: 10px;
}

.panel-block {
  padding: 10px;
  display: grid;
  gap: 10px;
}

.panel-block > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.panel-form {
  display: grid;
  gap: 10px;
}

.panel-form label {
  display: grid;
  gap: 6px;
}

.panel-form label.full {
  grid-column: 1 / -1;
}

.extractor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.extractor-field-list {
  display: grid;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
}

.extractor-field-list article {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.extractor-field-list article.active {
  border-color: rgba(15, 118, 110, 0.46);
  box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.18);
}

.extractor-field-list article label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extractor-field-list article label.full {
  grid-column: 1 / -1;
}

.extractor-row-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
}

.extractor-row-actions button {
  border: 1px solid rgba(148, 163, 184, 0.34);
  background: #fff;
  color: #334155;
  border-radius: 8px;
  padding: 6px 10px;
}

.extractor-extra,
.extractor-ai-test {
  display: grid;
  gap: 8px;
}

.extractor-ai-test ul {
  margin: 0;
  padding-left: 18px;
  max-height: 120px;
  overflow: auto;
}

.runtime-list {
  display: grid;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.runtime-list article {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 10px;
  padding: 8px;
  display: grid;
  gap: 4px;
  background: rgba(248, 250, 252, 0.72);
}

.runtime-list p {
  margin: 0;
  color: #536172;
}

.runtime-list small {
  color: #64748b;
}

.rail-add {
  width: 100%;
  min-height: 46px;
  border: 0;
  background: transparent;
  color: #dcfce7;
  font-size: 28px;
  cursor: pointer;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  display: grid;
  place-items: center;
  z-index: 2000;
}

.dialog-card {
  width: min(460px, 94vw);
  border-radius: 14px;
  background: #fff;
  padding: 14px;
  display: grid;
  gap: 10px;
}

.dialog-card label {
  display: grid;
  gap: 6px;
}

.dialog-card span {
  font-size: 12px;
  color: #516071;
}

.dialog-card footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.selector-dialog {
  width: min(1200px, 96vw);
  height: min(820px, 94vh);
  border-radius: 14px;
  background: #fff;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 8px;
  padding: 10px;
}

.selector-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selector-dialog > header button {
  border: 0;
  border-radius: 8px;
  padding: 6px 10px;
  background: #334155;
  color: #fff;
}

.selector-frame {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
}

.selector-dialog footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.selector-dialog code {
  max-width: 680px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-dialog footer button {
  border: 0;
  border-radius: 8px;
  padding: 8px 12px;
  background: #0f766e;
  color: #fff;
}

.empty-box {
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 10px;
  padding: 12px;
  color: #64748b;
}

@media (max-width: 1280px) {
  .workbench-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .workspace-header,
  .task-meta-grid {
    grid-template-columns: 1fr;
  }

  .task-meta-grid {
    grid-template-columns: 1fr;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
