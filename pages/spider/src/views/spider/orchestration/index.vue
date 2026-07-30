<template>
  <section v-if="!hasRequestedSpider" class="spider-orchestration-empty">
    <div class="spider-orchestration-empty__card">
      <strong>暂无数据</strong>
      <span>请从爬虫管理卡片点击“编排”进入当前爬虫的专属编排页。</span>
    </div>
  </section>

  <template v-else>
    <div class="spider-theme">
      <!-- Shared toolbar for both default and spider themes -->
      <div class="spider-orchestration-toolbar">
      <div class="spider-orchestration-toolbar__actions">
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="返回" @click="goBack">
          <IconifyIconOnline icon="ri:arrow-left-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="预览执行" @click="handlePreviewRun">
          <IconifyIconOnline icon="ri:search-eye-line" />
        </button>
        <button
          v-if="isExecutionWaiting"
          type="button"
          class="spider-toolbar-btn spider-toolbar-btn--icon spider-toolbar-btn--primary"
          title="人工处理完成后继续执行"
          @click="handleResumeRun"
        >
          <IconifyIconOnline icon="ri:play-list-add-line" />
        </button>
        <button
          v-if="isExecutionActive && !isExecutionWaiting"
          type="button"
          class="spider-toolbar-btn spider-toolbar-btn--icon spider-toolbar-btn--danger"
          title="结束本次运行"
          @click="handleStopRun"
        >
          <IconifyIconOnline icon="ri:stop-circle-line" />
        </button>
        <!-- 有可恢复的上次执行：重新开始 + 继续运行 -->
        <template v-if="!isExecutionActive && canResume">
          <button
            type="button"
            class="spider-toolbar-btn spider-toolbar-btn--primary"
            title="从头开始新的执行，之前的数据不会清除"
            @click="handleRealRun"
          >
            <IconifyIconOnline icon="ri:play-circle-line" />
            <span>重新开始</span>
          </button>
          <button
            type="button"
            class="spider-toolbar-btn spider-toolbar-btn--resume"
            title="从上次中断处恢复执行"
            @click="handleContinueRun"
          >
            <IconifyIconOnline icon="ri:play-list-line" />
            <span>继续运行</span>
          </button>
        </template>
        <!-- 无可恢复执行：单按钮 -->
        <button
          v-if="!isExecutionActive && !canResume"
          type="button"
          class="spider-toolbar-btn spider-toolbar-btn--primary"
          title="运行流程"
          @click="handleRealRun"
        >
          <IconifyIconOnline icon="ri:play-circle-line" />
          <span>开始执行</span>
        </button>
        <button
          v-if="isExecutionActive"
          type="button"
          class="spider-toolbar-btn spider-toolbar-btn--icon"
          :class="{ 'is-active': showLogPanel }"
          title="运行日志"
          @click="showLogPanel = !showLogPanel"
        >
          <IconifyIconOnline icon="ri:file-list-line" />
        </button>
        <button
          v-if="isExecutionActive"
          type="button"
          class="spider-toolbar-btn spider-toolbar-btn--icon"
          title="监控面板"
          @click="showMonitorDialog = true"
        >
          <IconifyIconOnline icon="ri:bar-chart-2-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="保存编排" @click="handleExternalSave">
          <IconifyIconOnline icon="ri:save-3-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="导出编排" @click="handleExportSchema">
          <IconifyIconOnline icon="ri:download-2-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="导入编排" @click="triggerImportSchema">
          <IconifyIconOnline icon="ri:upload-2-line" />
        </button>
        <input
          ref="schemaImportInput"
          type="file"
          accept="application/json,.json"
          class="spider-schema-import-input"
          @change="handleImportSchemaFile"
        />
      </div>
      <div class="spider-orchestration-toolbar__tabs">
        <span class="spider-orchestration-tab is-active">
          人工编排
        </span>
      </div>
      <div v-if="statusMessage" class="spider-orchestration-toolbar__status">
        <span>{{ statusMessage }}</span>
      </div>
    </div>

    <div class="spider-orchestration-canvas">
      <FlowEditor
        mode="edit"
        :nodes="spiderCanvasNodes"
        :edges="spiderCanvasEdges"
        :selected-node-id="selectedNodeId"
        :selected-edge-id="selectedEdgeId"
        edge-type="polyline"
        :interaction-mode="interactionMode"
        @update:interactionMode="interactionMode = $event"
        :palette="flowEditorPalette"
        palette-position="left"
        @node-click="onSpiderCanvasNodeClick"
        @edge-click="onSpiderCanvasEdgeClick"
        @pane-click="onSpiderCanvasPaneClick"
        @node-moved="onSpiderCanvasNodeMoved"
        @node-drop="onNodeDrop"
        @node-remove="onNodeRemove"
        @edge-remove="onEdgeRemove"
        @apply-layout="onApplyLayout"
      >
        <template #property-panel="{ close }">
          <!-- 运行时失败节点错误说明 -->
          <div v-if="selectedNodeErrorMessage" class="spider-node-error-banner">
            <div class="spider-node-error-banner__icon">!</div>
            <div class="spider-node-error-banner__body">
              <strong>执行失败</strong>
              <p>{{ selectedNodeErrorMessage }}</p>
            </div>
          </div>
          <SpiderPageAccessConfigPanel
            v-if="spiderNodeMeta?.kind === 'PAGE_ACCESS'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderUrlParseConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'URL_PARSE'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderConditionConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'CONDITION'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderSubFlowConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'SUB_FLOW'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderDownloaderConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'DOWNLOADER'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderDataParseConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'DATA_PARSE'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderRuntimeManualTaskPanel
            v-else-if="spiderNodeMeta?.kind === 'HUMAN_INTERVENE' && spiderNodeConfig?.derived"
            :task="activeExecution?.spiderManualTasks?.find(item => item.spiderNodeCode === spiderNodeConfig?.sourceNodeCode)!"
            :model-value="manualFormValues[spiderNodeConfig?.sourceNodeCode] || {}"
            @update-field="(fieldKey, value) => updateManualField(spiderNodeConfig?.sourceNodeCode, fieldKey, value)"
            @submit="continueAfter => submitManualTaskForm(activeExecution?.spiderManualTasks?.find(item => item.spiderNodeCode === spiderNodeConfig?.sourceNodeCode)!, continueAfter)"
          />
          <SpiderHumanInterveneConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'HUMAN_INTERVENE'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <SpiderSaveResultConfigPanel
            v-else-if="spiderNodeMeta?.kind === 'SAVE_RESULT' || spiderNodeMeta?.kind === 'ASYNC_SAVE'"
            :node-meta="spiderNodeMeta"
            :node-title="spiderNodeTitle"
            :node-config="spiderNodeConfig"
            :update-title="spiderUpdateTitle"
            :update-config="spiderUpdateConfig"
            :save-config="spiderSaveConfig"
            :remove-node="spiderRemoveNode"
          />
          <div v-else-if="spiderNodeMeta?.kind === 'STRUCTURE'" class="spider-generic-config">
            <label class="spider-generic-config__item">
              <span>节点标题</span>
              <input :value="spiderNodeTitle" type="text" @input="spiderUpdateTitle(($event.target as HTMLInputElement).value)" />
            </label>
            <label class="spider-generic-config__item">
              <span>结构化标识</span>
              <input
                :value="String(spiderNodeConfig.schemaCode || '')"
                type="text"
                placeholder="例如：gitee.explore.project"
                @input="spiderUpdateConfig('schemaCode', ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="spider-generic-config__item">
              <span>目标表名</span>
              <input
                :value="String(spiderNodeConfig.tableName || '')"
                type="text"
                placeholder="例如：gitee_explore_project"
                @input="spiderUpdateConfig('tableName', ($event.target as HTMLInputElement).value)"
              />
            </label>
            <label class="spider-generic-config__item">
              <span>字段模板</span>
              <textarea
                :value="String(spiderNodeConfig.fieldTemplate || '')"
                rows="6"
                placeholder="定义字段名、类型、说明，供结果保存节点选择"
                @input="spiderUpdateConfig('fieldTemplate', ($event.target as HTMLTextAreaElement).value)"
              />
            </label>
            <div class="spider-generic-config__actions">
              <button type="button" class="is-secondary" @click="spiderRemoveNode">删除节点</button>
              <button type="button" @click="spiderSaveConfig">保存配置</button>
            </div>
          </div>
          <div v-else class="spider-generic-config">
            <label class="spider-generic-config__item">
              <span>节点标题</span>
              <input :value="spiderNodeTitle" type="text" @input="spiderUpdateTitle(($event.target as HTMLInputElement).value)" />
            </label>
            <label
              v-for="field in spiderNodeSchema"
              :key="field.field"
              class="spider-generic-config__item"
            >
              <span>{{ field.label }}</span>
              <input
                v-if="field.component === 'input'"
                :value="String(spiderNodeConfig[field.field] ?? '')"
                type="text"
                @input="spiderUpdateConfig(field.field, ($event.target as HTMLInputElement).value)"
              />
              <textarea
                v-else-if="field.component === 'textarea'"
                :value="String(spiderNodeConfig[field.field] ?? '')"
                rows="4"
                @input="spiderUpdateConfig(field.field, ($event.target as HTMLTextAreaElement).value)"
              />
              <input
                v-else-if="field.component === 'number'"
                :value="Number(spiderNodeConfig[field.field] ?? 0)"
                type="number"
                @input="spiderUpdateConfig(field.field, Number(($event.target as HTMLInputElement).value || 0))"
              />
              <label v-else-if="field.component === 'switch'" class="spider-generic-config__switch">
                <input
                  :checked="Boolean(spiderNodeConfig[field.field])"
                  type="checkbox"
                  @change="spiderUpdateConfig(field.field, ($event.target as HTMLInputElement).checked)"
                />
                <em>{{ spiderNodeConfig[field.field] ? '开启' : '关闭' }}</em>
              </label>
              <select
                v-else
                :value="String(spiderNodeConfig[field.field] ?? '')"
                @change="spiderUpdateConfig(field.field, ($event.target as HTMLSelectElement).value)"
              >
                <option
                  v-for="option in field.options || []"
                  :key="String(option.value)"
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
            <div class="spider-generic-config__actions">
              <button type="button" class="is-secondary" @click="spiderRemoveNode">删除节点</button>
              <button type="button" @click="spiderSaveConfig">保存配置</button>
            </div>
          </div>
        </template>
      </FlowEditor>
    </div>

    <section v-if="isReplayReady" class="spider-replay-bar">
      <div class="spider-replay-bar__controls">
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="重头" @click="replayRestart">
          <IconifyIconOnline icon="ri:skip-back-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="上一步" :disabled="replayStep <= 0" @click="replayStepBackward">
          <IconifyIconOnline icon="ri:play-reverse-line" />
        </button>
        <button type="button" class="spider-toolbar-btn" :class="isReplayPlaying ? 'spider-toolbar-btn--danger' : 'spider-toolbar-btn--primary'" :title="isReplayPlaying ? '暂停' : '播放'" @click="replayTogglePlay">
          <IconifyIconOnline :icon="isReplayPlaying ? 'ri:pause-line' : 'ri:play-line'" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="下一步" :disabled="replayStep >= activeEvents.length - 1" @click="replayStepForward">
          <IconifyIconOnline icon="ri:play-forward-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="结束回放" @click="replayStop">
          <IconifyIconOnline icon="ri:skip-forward-line" />
        </button>
        <select v-model="replaySpeed" class="spider-replay-bar__speed">
          <option :value="500">2x</option>
          <option :value="1000">1x</option>
          <option :value="2000">0.5x</option>
          <option :value="4000">0.25x</option>
        </select>
        <span class="spider-replay-bar__step">{{ replayStep >= 0 ? replayStep + 1 : 0 }} / {{ activeEvents.length }}</span>
      </div>
    </section>

    <!-- 监控面板弹窗 -->
    <section v-if="showMonitorDialog" class="spider-monitor-dialog-overlay" @click.self="showMonitorDialog = false">
      <div class="spider-monitor-dialog">
        <header class="spider-monitor-dialog__head">
          <strong>监控面板</strong>
          <button type="button" class="spider-monitor-dialog__close" @click="showMonitorDialog = false">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </header>
        <div class="spider-monitor-dialog__body">
          <SpiderMonitorPanel
            v-if="currentSpiderCode"
            :spider-code="currentSpiderCode"
            :execution-no="activeExecution?.spiderExecutionNo"
            :auto-refresh="true"
          />
        </div>
      </div>
    </section>

    <!-- 运行日志侧边栏 -->
    <Transition name="spider-log-slide">
      <aside v-if="showLogPanel" class="spider-log-panel">
        <header class="spider-log-panel__head">
          <strong>运行日志</strong>
          <button type="button" class="spider-log-panel__close" @click="showLogPanel = false">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </header>
        <div ref="logPanelBodyRef" class="spider-log-panel__body thin-scroller">
          <div v-if="!activeEvents.length" class="spider-log-panel__empty">暂无运行日志</div>
          <div
            v-for="(evt, idx) in activeEvents"
            :key="idx"
            class="spider-log-entry"
            :class="`is-${eventTypeColor(evt.spiderEventType)}`"
          >
            <span class="spider-log-entry__badge">{{ evt.spiderEventType }}</span>
            <span class="spider-log-entry__node">{{ evt.spiderNodeName || evt.spiderNodeCode }}</span>
            <span class="spider-log-entry__msg">{{ evt.spiderMessage }}</span>
          </div>
        </div>
      </aside>
    </Transition>

    <!-- 人工节点静态库弹窗 -->
    <Teleport to="body">
      <div v-if="showHumanStaticLibDialog" class="spider-human-static-overlay" @click.self="showHumanStaticLibDialog = false">
        <section class="spider-human-static-dialog">
          <header class="spider-human-static-dialog__head">
            <strong>人工任务静态库</strong>
            <span>选择预定义的人工处理模板</span>
            <button type="button" class="spider-human-static-dialog__close" @click="showHumanStaticLibDialog = false">
              <IconifyIconOnline icon="ri:close-line" />
            </button>
          </header>
          <div class="spider-human-static-dialog__body">
            <article
              v-for="tpl in humanStaticTemplates"
              :key="tpl.type"
              class="spider-human-static-card"
              :class="{ 'is-selected': humanSelectedTemplate === tpl.type }"
              @click="selectHumanTemplate(tpl)"
            >
              <div class="spider-human-static-card__icon">
                <IconifyIconOnline :icon="tpl.icon" />
              </div>
              <div class="spider-human-static-card__info">
                <strong>{{ tpl.label }}</strong>
                <span>{{ tpl.description }}</span>
              </div>
              <div v-if="humanSelectedTemplate === tpl.type" class="spider-human-static-card__check">
                <IconifyIconOnline icon="ri:check-line" />
              </div>
            </article>
          </div>
          <footer class="spider-human-static-dialog__foot">
            <button type="button" class="spider-human-static-dialog__btn is-secondary" @click="showHumanStaticLibDialog = false">取消</button>
            <button type="button" class="spider-human-static-dialog__btn is-primary" :disabled="!humanSelectedTemplate" @click="confirmHumanTemplate">确认选择</button>
          </footer>
        </section>
      </div>
    </Teleport>

    <!-- 人工处理弹窗（运行时派生节点） -->
    <Teleport to="body">
      <el-dialog
        v-model="showHumanInterveneDialog"
        title="人工处理"
        width="720px"
        :close-on-click-modal="false"
        :destroy-on-close="true"
        top="5vh"
      >
        <SpiderRuntimeManualTaskPanel
          v-if="humanInterveneTask"
          :task="humanInterveneTask"
          :model-value="manualFormValues[humanInterveneTask.spiderNodeCode] || {}"
          @update-field="(fieldKey, value) => updateManualField(humanInterveneTask!.spiderNodeCode, fieldKey, value)"
          @submit="(continueAfter) => submitManualTaskForm(humanInterveneTask!, continueAfter)"
        />
      </el-dialog>
    </Teleport>
  </div>
  </template>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElDialog, ElNotification } from "element-plus";
import * as CoreSocket from "@repo/core";
import type { ScMFlowEntry, ScMFlowNodeMeta, ScMFlowPaletteItem, ScMFlowSchema } from "@repo/components/ScFlowEditor";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import {
  spiderNodePalette,
} from "../../../index";
import {
  exportSpiderOrchestrationSchema,
  getSpiderExecutionDetail,
  getSpiderExecutionEvents,
  getSpiderExampleLatest,
  listSpiderExecutionRecords,
  importSpiderOrchestrationSchema,
  previewSpiderExecution,
  getSpiderOrchestrationSchema,
  listSpiderDefinitions,
  runSpiderExecution,
  saveSpiderOrchestrationSchema,
  stopSpiderExecution,
  submitSpiderManualTask,
} from "../../../api/spider";
import type {
  SpiderDefinition,
  SpiderExecutionDetailView,
  SpiderExecutionEventView,
  SpiderFlowSchema,
  SpiderManualTaskView,
  SpiderNodeType,
} from "../../../types/orchestration";
import SpiderConditionConfigPanel from "./config-panels/SpiderConditionConfigPanel.vue";
import SpiderDataParseConfigPanel from "./config-panels/SpiderDataParseConfigPanel.vue";
import SpiderDownloaderConfigPanel from "./config-panels/SpiderDownloaderConfigPanel.vue";
import SpiderHumanInterveneConfigPanel from "./config-panels/SpiderHumanInterveneConfigPanel.vue";
import SpiderRuntimeManualTaskPanel from "./config-panels/SpiderRuntimeManualTaskPanel.vue";
import SpiderPageAccessConfigPanel from "./config-panels/SpiderPageAccessConfigPanel.vue";
import SpiderSaveResultConfigPanel from "./config-panels/SpiderSaveResultConfigPanel.vue";
import SpiderSubFlowConfigPanel from "./config-panels/SpiderSubFlowConfigPanel.vue";
import SpiderUrlParseConfigPanel from "./config-panels/SpiderUrlParseConfigPanel.vue";
import { ScRelationGraph as FlowEditor, getLfNodeType } from "@repo/components/ScRelationGraph";
import SpiderMonitorPanel from "../monitor/SpiderMonitorPanel.vue";
import "./theme/spider-theme.css";

const activeSpiderId = ref<number | null>(null);
const currentSpiderCode = ref("");
const currentSpiderDefinition = ref<SpiderDefinition | null>(null);
const statusMessage = ref("");
const flowEntries = ref<ScMFlowEntry[]>([]);
const hasRequestedSpider = ref(false);
const interactionMode = ref<"free" | "organizer">("free");
const activeExecution = ref<SpiderExecutionDetailView | null>(null);
const activeEvents = ref<SpiderExecutionEventView[]>([]);
const executionPolling = ref<ReturnType<typeof setInterval> | null>(null);
const executionEventSource = ref<EventSource | null>(null);
const socketServiceRef = ref<any>(null);
const socketEventName = "spider:execution:event";
const manualFormValues = ref<Record<string, Record<string, string>>>({});
const showLogPanel = ref(false);
const showMonitorDialog = ref(false);
const showHumanInterveneDialog = ref(false);
const humanInterveneTask = ref<SpiderManualTaskView | null>(null);
const logPanelBodyRef = ref<HTMLElement | null>(null);
const schemaImportInput = ref<HTMLInputElement | null>(null);

/** 人工节点静态库弹窗 */
const showHumanStaticLibDialog = ref(false);
const humanSelectedTemplate = ref<string | null>(null);
const humanClickedNodeId = ref<string | null>(null);
interface HumanStaticTemplate {
  type: string;
  label: string;
  description: string;
  icon: string;
}
const humanStaticTemplates: HumanStaticTemplate[] = [
  { type: "CAPTCHA", label: "验证码识别", description: "识别页面中的验证码图片并填写", icon: "ri:qr-code-line" },
  { type: "LOGIN_CONFIRM", label: "登录确认", description: "确认登录状态或执行登录操作", icon: "ri:login-circle-line" },
  { type: "DATA_REVIEW", label: "数据审核", description: "人工审核 AI 提取的数据是否正确", icon: "ri:file-list-3-line" },
  { type: "MANUAL_CHOOSE", label: "手动选择", description: "从多个选项中手动选择一个", icon: "ri:hand-line" },
  { type: "SCREENSHOT", label: "截图确认", description: "查看页面截图并进行确认操作", icon: "ri:screenshot-line" },
  { type: "NAVIGATE", label: "导航辅助", description: "手动导航到目标页面", icon: "ri:navigation-line" },
];
function selectHumanTemplate(tpl: HumanStaticTemplate) {
  humanSelectedTemplate.value = tpl.type;
}
function confirmHumanTemplate() {
  if (!humanSelectedTemplate.value || !humanClickedNodeId.value) return;
  // 将选中的模板配置写入节点
  const nodeId = humanClickedNodeId.value;
  const flowNode = workingFlow.value.nodes.find(n => n.id === nodeId);
  if (flowNode) {
    flowNode.config = { ...flowNode.config, taskType: humanSelectedTemplate.value };
    handleSaveFlow().catch(() => {});
  }
  showHumanStaticLibDialog.value = false;
  humanSelectedTemplate.value = null;
  humanClickedNodeId.value = null;
}

/** 上次执行状态（用于判断是否支持断点续采） */
const lastExecutionStatus = ref<string | null>(null);

/** 是否有可恢复的上次执行 */
const canResume = computed(() =>
  lastExecutionStatus.value === 'FAILED' || lastExecutionStatus.value === 'STOPPED'
);

const selectedNodeId = ref<string | null>(null);
const selectedEdgeId = ref<string | null>(null);

/** 当前编排类型: AI 或 MANUAL */
const orchestrationType = ref<"AI" | "MANUAL">("MANUAL");

// 人工干预通知（避免重复提醒）
let lastManualTaskCount = 0;


// 逐帧回放状态
const replayStep = ref(-1);
const replaySpeed = ref(1500);
const isReplayPlaying = ref(false);
const replayTimer = ref<ReturnType<typeof setInterval> | null>(null);

const workingFlow = ref<SpiderFlowSchema>({
  spiderDefinitionCode: "",
  spiderFlowVersion: 1,
  spiderFlowName: "",
  spiderFlowScope: "PRIVATE",
  orchestrationType: "AI",
  nodes: [],
  edges: [],
});

/** 缓存子流程 schema，key = SUB_FLOW 节点 id */
const subFlowSchemas = ref<Map<string, SpiderFlowSchema>>(new Map());

const editorTypeMap: Record<SpiderNodeType, ScMFlowPaletteItem["editorType"]> = {
  START: "input",
  PAGE_ACCESS: "process",
  AI_PAGE_ACCESS: "process",
  URL_PARSE: "process",
  DATA_PARSE: "process",
  DOWNLOADER: "process",
  SUB_FLOW: "process",
  HUMAN_INTERVENE: "delay",
  CONDITION: "condition",
  SAVE_RESULT: "process",
  ASYNC_SAVE: "process",
  END: "output",
};

const editorShapeMap: Partial<Record<SpiderNodeType, ScMFlowPaletteItem["shape"]>> = {
  START: "circle",
  END: "circle",
  HUMAN_INTERVENE: "pulse",
  CONDITION: "diamond",
  PAGE_ACCESS: "icon-box",
  AI_PAGE_ACCESS: "icon-box",
  URL_PARSE: "icon-box",
  DATA_PARSE: "icon-box",
  DOWNLOADER: "icon-box",
  SUB_FLOW: "icon-box",
  SAVE_RESULT: "icon-box",
  ASYNC_SAVE: "icon-box",
};

const editorPalette = computed<ScMFlowPaletteItem[]>(() =>
  spiderNodePalette
    .filter(item => {
      if (orchestrationType.value === 'MANUAL') {
        return item.type !== 'HUMAN_INTERVENE';
      }
      return true;
    })
    .map(item => ({
    kind: item.type,
    title: item.title,
    detail: item.detail,
    color: item.color,
    icon: item.icon,
    image: item.image,
    editorType: editorTypeMap[item.type],
    shape: editorShapeMap[item.type],
    ports: item.ports.map(port => ({
      id: port.id,
      label: port.label,
      side: port.side,
    })),
    schema: item.schema.map(field => ({
      field: field.field,
      label: field.label,
      component: field.component,
      required: field.required,
      defaultValue: inferDefaultValue(item.type, field.field, field.component),
      options: field.options,
    })),
  })),
);

const flowEditorPalette = computed(() =>
  spiderNodePalette
    .filter(item => item.type !== 'HUMAN_INTERVENE')
    .map(item => ({
      kind: item.type,
      title: item.title,
      detail: item.detail,
      color: item.color,
      icon: item.icon,
      disabled: item.type === "START" || item.type === "HUMAN_INTERVENE",
    }))
);

const spiderCanvasNodes = computed(() => {
  const baseNodes = workingFlow.value.nodes.map(item => ({
    id: item.id,
    type: getLfNodeType(item.type),
    label: item.title,
    icon: item.icon,
    kind: item.type,
    position: item.position,
    runtimeStatus: effectiveNodeRuntimeMap.value[item.id]?.status || "",
    displayInfo: effectiveNodeRuntimeMap.value[item.id]?.displayInfo || "",
    errorMessage: effectiveNodeRuntimeMap.value[item.id]?.errorMessage || "",
    executionRound: effectiveNodeRuntimeMap.value[item.id]?.executionRound || 0,
  }));
  // 展开子流程内部节点
  const subFlowSchemasMap = subFlowSchemas.value;
  const childNodes: any[] = [];
  const subFlowContainerSizes = new Map<string, [number, number]>();
  const subFlowEnvPositions = new Map<string, { x: number; y: number }>();
  // 子节点在 LogicFlow 中的实际占位尺寸（与 FlowEditorNodeDefs.getNodeSize 保持一致）
  function getNodeVisualSize(type: string): [number, number] {
    if (type === "START" || type === "END") return [60, 60];
    if (type === "CONDITION") return [140, 120];
    if (type === "IMAGE") return [200, 160];
    return [210, 60];
  }
  for (const subFlowNode of baseNodes) {
    if (subFlowNode.kind !== "SUB_FLOW") continue;
    const subSchema = subFlowSchemasMap.get(subFlowNode.id);
    if (!subSchema?.nodes?.length) continue;
    // 给子节点 ID 加前缀避免与主流程节点冲突
    const idPrefix = `${subFlowNode.id}_`;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const childNode of subSchema.nodes) {
      const absX = subFlowNode.position.x + childNode.position.x;
      const absY = subFlowNode.position.y + childNode.position.y;
      // 计入子节点自身尺寸（G6 节点以 center 定位）
      const [nodeW, nodeH] = getNodeVisualSize(childNode.type);
      const hw = nodeW / 2, hh = nodeH / 2;
      if (absX - hw < minX) minX = absX - hw;
      if (absY - hh < minY) minY = absY - hh;
      if (absX + hw > maxX) maxX = absX + hw;
      if (absY + hh > maxY) maxY = absY + hh;
      childNodes.push({
        id: idPrefix + childNode.id,
        type: getLfNodeType(childNode.type),
        label: childNode.title,
        icon: childNode.icon,
        kind: childNode.type,
        position: { x: absX, y: absY },
        runtimeStatus: "",
        displayInfo: "",
      });
    }
    // 根据子节点边界计算容器尺寸（含 padding）和容器位置（左上角对齐包围盒）
    const pad = [36, 30, 36, 30]; // 上右下左
    subFlowContainerSizes.set(subFlowNode.id, [
      maxX - minX + pad[1] + pad[3],
      maxY - minY + pad[0] + pad[2],
    ]);
    subFlowEnvPositions.set(subFlowNode.id, {
      x: minX - pad[3],
      y: minY - pad[0],
    });
  }
  // 对 SUB_FLOW 节点，设为容器风格（大尺寸、作为纯背景、位置对齐子节点包围盒）
  const sizedNodes = baseNodes.map(n => {
    if (n.kind !== "SUB_FLOW") return n;
    const sz = subFlowContainerSizes.get(n.id);
    const envPos = subFlowEnvPositions.get(n.id);
    if (!sz || !envPos) return { ...n, containerSize: [260, 100] as [number, number] };
    return { ...n, containerSize: sz, position: { ...envPos } };
  });
  const steps = activeExecution.value?.spiderSteps || [];
  const derivedSteps = steps.filter(item => item.spiderIsDerivedNode === 1);
  const nodeMap = new Map(sizedNodes.map(item => [item.id, item]));
  for (const child of childNodes) {
    nodeMap.set(child.id, child);
  }
  for (const step of derivedSteps) {
    if (nodeMap.has(step.spiderNodeCode)) continue;
    const sourceNode = baseNodes.find(n => n.id === step.spiderSourceNodeCode) || nodeMap.get(step.spiderSourceNodeCode);
    const sourcePos = sourceNode?.position || null;
    nodeMap.set(step.spiderNodeCode, {
      id: step.spiderNodeCode,
      type: getLfNodeType("HUMAN_INTERVENE"),
      label: step.spiderNodeName || "人工派生节点",
      icon: "ri:user-heart-line",
      kind: "HUMAN_INTERVENE",
      position: sourcePos
        ? { x: sourcePos.x + 260, y: sourcePos.y + 140 }
        : { x: 420, y: 240 },
      runtimeStatus: effectiveNodeRuntimeMap.value[step.spiderNodeCode]?.status || "",
    });
  }
  return Array.from(nodeMap.values());
});

const spiderCanvasEdges = computed(() => {
  const steps = activeExecution.value?.spiderSteps || [];
  const stepMap = Object.fromEntries((steps).map(item => [item.spiderNodeCode, item]));
  const traversedEdgeMap = Object.fromEntries((activeExecution.value?.spiderTraversedEdges || []).map(item => [item.edgeId, item]));
  const getRuntime = (sourceId: string, targetId: string) => {
    const edgeKey = workingFlow.value.edges.find(e => e.source === sourceId && e.target === targetId)?.id;
    let visited = false;
    let runtimeStatus = "";
    if (edgeKey && traversedEdgeMap[edgeKey]) {
      visited = traversedEdgeMap[edgeKey].spiderVisited === 1;
      runtimeStatus = traversedEdgeMap[edgeKey].spiderRuntimeStatus || "";
    } else {
      const targetStep = stepMap[targetId];
      visited = Boolean(targetStep?.spiderStartedAt || targetStep?.spiderFinishedAt || targetStep?.spiderStepStatus === "WAIT_MANUAL" || targetStep?.spiderStepStatus === "SUCCESS" || targetStep?.spiderStepStatus === "FAILED");
      runtimeStatus = targetStep?.spiderStepStatus || "";
    }
    // 如果目标节点正在 RUNNING，边缘必须显示为 RUNNING（覆盖 traversedEdgeMap 的 SUCCESS 状态）
    const targetStep = stepMap[targetId];
    if (targetStep?.spiderStepStatus === "RUNNING") {
      runtimeStatus = "RUNNING";
    }
    return { visited, runtimeStatus };
  };
  const edgeTraverseStyle = (sourceId: string, targetId: string) => {
    const { visited, runtimeStatus } = getRuntime(sourceId, targetId);
    if (visited || ["RUNNING", "SUCCESS", "WAIT_MANUAL", "FAILED"].includes(runtimeStatus)) {
      return { animated: true, style: { stroke: "var(--spider-edge-traversed)" } };
    }
    return {};
  };
  // Chain-aware derived node grouping
  const derivedSteps_chain = steps.filter(s =>
    s.spiderIsDerivedNode === 1 && s.spiderSourceNodeCode && s.spiderSourceNodeCode !== s.spiderNodeCode
  );
  function traceRootCode(code: string): string {
    const visited = new Set<string>();
    let current = code;
    while (current && stepMap[current]?.spiderIsDerivedNode === 1 && stepMap[current]?.spiderSourceNodeCode !== current) {
      if (visited.has(current)) break;
      visited.add(current);
      current = stepMap[current].spiderSourceNodeCode;
    }
    return current;
  }
  const chainGroups = new Map<string, any[]>();
  for (const step of derivedSteps_chain) {
    const root = traceRootCode(step.spiderNodeCode);
    if (!chainGroups.has(root)) chainGroups.set(root, []);
    chainGroups.get(root)!.push(step);
  }
  function getSeq(code: string): number {
    const m = code.match(/#derived(?:-(\d+))?$/);
    if (!m) return 1;
    return m[1] ? parseInt(m[1]) : 1;
  }
  for (const [, chain] of chainGroups) {
    chain.sort((a, b) => getSeq(a.spiderNodeCode) - getSeq(b.spiderNodeCode));
  }
  // Build a map of node types for condition edge label derivation
  const nodeTypeMap = new Map(workingFlow.value.nodes.map(n => [n.id, n.type]));
  const getConditionLabel = (sourceId: string, sourceOutput?: string): string => {
    if (nodeTypeMap.get(sourceId) === "CONDITION") {
      return sourceOutput === "true" || sourceOutput === "pass" ? "满足" : "不满足";
    }
    return "";
  };
  // Exclude original edges from sources that have derived nodes
  const allDerivedSourceCodes = new Set(derivedSteps_chain.map(s => s.spiderSourceNodeCode));
  const edges = workingFlow.value.edges
    .filter(item => !allDerivedSourceCodes.has(item.source))
    .map(item => ({
    id: item.id,
    source: item.source,
    target: item.target,
    label: getConditionLabel(item.source, item.sourceOutput),
    ...getRuntime(item.source, item.target),
    ...edgeTraverseStyle(item.source, item.target),
  }));
  const edgeIds = new Set(edges.map(item => item.id));
  // Build chain edges for each derived node group
  for (const [, chain] of chainGroups) {
    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      // In-edge: previous node -> current derived
      const fromCode = i === 0 ? step.spiderSourceNodeCode : chain[i - 1].spiderNodeCode;
      const inEdgeId = `derived-${fromCode}-${step.spiderNodeCode}`;
      if (!edgeIds.has(inEdgeId)) {
        edges.push({
          id: inEdgeId,
          source: fromCode,
          target: step.spiderNodeCode,
          label: "",
          ...getRuntime(fromCode, step.spiderNodeCode),
          ...edgeTraverseStyle(fromCode, step.spiderNodeCode),
        });
        edgeIds.add(inEdgeId);
      }
      // Out-edge: only the LAST node connects to original target
      if (i === chain.length - 1) {
        const root = traceRootCode(step.spiderNodeCode);
        for (const originalEdge of workingFlow.value.edges.filter(e => e.source === root)) {
          if (String(originalEdge.target).includes("#derived")) continue;
          const outEdgeId = `derived-continue-${step.spiderNodeCode}-${originalEdge.target}`;
          if (edgeIds.has(outEdgeId)) continue;
          edges.push({
            id: outEdgeId,
            source: step.spiderNodeCode,
            target: originalEdge.target,
            label: "",
            ...getRuntime(step.spiderNodeCode, originalEdge.target),
            ...edgeTraverseStyle(step.spiderNodeCode, originalEdge.target),
          });
          edgeIds.add(outEdgeId);
        }
      }
    }
  }
  // Add sub-flow internal edges
  const subSchemaMap = subFlowSchemas.value;
  for (const [parentId, subSchema] of subSchemaMap) {
    if (!subSchema?.edges) continue;
    for (const subEdge of subSchema.edges) {
      const subEdgeId = subEdge.id.startsWith("sub-") ? subEdge.id : `sub-${parentId}-${subEdge.id}`;
      if (!edgeIds.has(subEdgeId)) {
        edges.push({
          id: subEdgeId,
          source: `${parentId}_${subEdge.source}`,
          target: `${parentId}_${subEdge.target}`,
          label: "",
          visited: false,
          runtimeStatus: "",
          ...edgeTraverseStyle(`${parentId}_${subEdge.source}`, `${parentId}_${subEdge.target}`),
        });
        edgeIds.add(subEdgeId);
      }
    }
  }
  return edges;
});

function onSpiderCanvasNodeClick(nodeId: string) {
  // SUB_FLOW 容器自身不打开配置面板，避免阻挡子节点交互
  const node = workingFlow.value.nodes.find(n => n.id === nodeId);
  if (node?.type === "SUB_FLOW") return;
  // 运行态派生 HUMAN_INTERVENE 节点弹出人工处理弹窗
  const isDerived = (activeExecution.value?.spiderSteps || []).some(s => s.spiderSourceNodeCode === nodeId && s.spiderIsDerivedNode === 1);
  if (node?.type === "HUMAN_INTERVENE") {
    if (isDerived) {
      const task = activeExecution.value?.spiderManualTasks?.find(item => item.spiderNodeCode === nodeId);
      if (task) {
        humanInterveneTask.value = task;
        showHumanInterveneDialog.value = true;
      }
      // 清除选中状态，避免右侧属性面板与弹窗同时显示
      selectedNodeId.value = null;
      selectedEdgeId.value = null;
      spiderNodeMeta.value = null;
      return;
    }
    // 设计态 HUMAN_INTERVENE 节点弹出静态库弹窗
    selectedEdgeId.value = null;
    selectedNodeId.value = nodeId;
    humanClickedNodeId.value = nodeId;
    humanSelectedTemplate.value = String(node.config?.taskType ?? "") || null;
    showHumanStaticLibDialog.value = true;
    return;
  }
  selectedEdgeId.value = null;
  selectedNodeId.value = nodeId;
  openSpiderConfigPanel(nodeId);
}

function onSpiderCanvasEdgeClick(edgeId: string) {
  selectedNodeId.value = null;
  selectedEdgeId.value = edgeId;
  closeSpiderConfigPanel();
}

function onSpiderCanvasPaneClick() {
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
  closeSpiderConfigPanel();
}

function onSpiderCanvasNodeMoved(payload: { nodeId: string; position: { x: number; y: number } }) {
  const node = workingFlow.value.nodes.find(n => n.id === payload.nodeId);
  if (node) {
    node.position = payload.position;
  }
}

function onApplyLayout(positions: { nodeId: string; position: { x: number; y: number } }[]) {
  for (const { nodeId, position } of positions) {
    const node = workingFlow.value.nodes.find(n => n.id === nodeId);
    if (node) {
      node.position = position;
    }
  }
}

function onNodeDrop(payload: { kind: string; position: { x: number; y: number } }) {
  const paletteItem = spiderNodePalette.find(p => p.type === payload.kind);
  if (!paletteItem) return;
  const id = `${payload.kind}_${Date.now()}`;
  workingFlow.value.nodes.push({
    id,
    type: payload.kind,
    title: paletteItem.title,
    icon: paletteItem.icon,
    position: payload.position,
    config: {},
  });
}

function onNodeRemove(nodeId: string) {
  workingFlow.value.nodes = workingFlow.value.nodes.filter(n => n.id !== nodeId);
  workingFlow.value.edges = workingFlow.value.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
  if (selectedNodeId.value === nodeId) {
    closeSpiderConfigPanel();
  }
}

function onEdgeRemove(edgeId: string) {
  workingFlow.value.edges = workingFlow.value.edges.filter(e => e.id !== edgeId);
}

// ── Spider theme config panel ──
const spiderNodeMeta = ref<ScMFlowNodeMeta | null>(null);
const spiderNodeTitle = ref("");
const spiderNodeConfig = ref<Record<string, any>>({});

const spiderNodeSchema = computed(() => {
  const meta = spiderNodeMeta.value;
  return meta ? (editorPalette.value.find(p => p.kind === meta.kind)?.schema || []) : [];
});

function openSpiderConfigPanel(nodeId: string) {
  const flowNode = workingFlow.value.nodes.find(n => n.id === nodeId);
  if (flowNode) {
    const paletteItem = editorPalette.value.find(p => p.kind === flowNode.type);
    spiderNodeMeta.value = {
      id: flowNode.id,
      kind: flowNode.type,
      title: flowNode.title,
      config: { ...(flowNode.config || {}) },
      icon: flowNode.icon || paletteItem?.icon,
      image: flowNode.image || paletteItem?.image,
    };
    spiderNodeTitle.value = flowNode.title || "";
    spiderNodeConfig.value = { ...(flowNode.config || {}) };
    return;
  }
  // Then try derived runtime nodes (e.g. HUMAN_INTERVENE added during execution)
  const steps = activeExecution.value?.spiderSteps || [];
  const derivedStep = steps.find(s => s.spiderNodeCode === nodeId && s.spiderIsDerivedNode === 1);
  if (derivedStep) {
    spiderNodeMeta.value = {
      id: derivedStep.spiderNodeCode,
      kind: "HUMAN_INTERVENE",
      title: derivedStep.spiderNodeName || "人工处理",
      config: { derived: true, sourceNodeCode: derivedStep.spiderSourceNodeCode },
      icon: "ri:user-heart-line",
    };
    spiderNodeTitle.value = derivedStep.spiderNodeName || "人工处理";
    spiderNodeConfig.value = { derived: true, sourceNodeCode: derivedStep.spiderSourceNodeCode };
  }
}

function closeSpiderConfigPanel() {
  spiderNodeMeta.value = null;
  selectedNodeId.value = null;
}

function spiderUpdateTitle(value: string) {
  spiderNodeTitle.value = value;
}

function spiderUpdateConfig(field: string, value: unknown) {
  spiderNodeConfig.value = { ...spiderNodeConfig.value, [field]: value };
}

function spiderSaveConfig() {
  const meta = spiderNodeMeta.value;
  if (!meta) return;
  workingFlow.value = {
    ...workingFlow.value,
    nodes: workingFlow.value.nodes.map(n => {
      if (n.id === meta.id) {
        return {
          ...n,
          title: spiderNodeTitle.value || n.title,
          config: { ...spiderNodeConfig.value },
        };
      }
      return n;
    }),
  };
  handleSaveFlow().catch(() => {});
  closeSpiderConfigPanel();
}

function spiderRemoveNode() {
  const meta = spiderNodeMeta.value;
  if (!meta) return;
  workingFlow.value = {
    ...workingFlow.value,
    nodes: workingFlow.value.nodes.filter(n => n.id !== meta.id),
    edges: workingFlow.value.edges.filter(e => e.source !== meta.id && e.target !== meta.id),
  };
  closeSpiderConfigPanel();
}

/** 当前选中的节点是否有执行失败的错误信息 */
const selectedNodeErrorMessage = computed(() => {
  if (!selectedNodeId.value) return "";
  const runtime = nodeRuntimeMap.value[selectedNodeId.value];
  if (runtime?.status === "FAILED" && runtime?.errorMessage) {
    return runtime.errorMessage;
  }
  return "";
});

const nodeRuntimeMap = computed<Record<string, { status: string; displayInfo?: string; errorMessage?: string; executionRound?: number }>>(() => {
  const map: Record<string, { status: string; displayInfo?: string; errorMessage?: string; executionRound?: number }> = {};
  const counter: Record<string, number> = {};
  for (const step of activeExecution.value?.spiderSteps || []) {
    counter[step.spiderNodeCode] = (counter[step.spiderNodeCode] || 0) + 1;
    map[step.spiderNodeCode] = {
      status: step.spiderStepStatus,
      displayInfo: step.spiderDisplayInfo,
      errorMessage: step.spiderErrorMessage,
      executionRound: counter[step.spiderNodeCode],
    };
  }
  return map;
});

const isExecutionActive = computed(() =>
  ["RUNNING", "WAIT_MANUAL", "WAITING"].includes(activeExecution.value?.spiderExecutionStatus || ""),
);

const isExecutionWaiting = computed(() =>
  activeExecution.value?.spiderExecutionStatus === "WAIT_MANUAL",
);

const isReplayReady = computed(() =>
  activeEvents.value.length > 0 && !isExecutionActive.value,
);

const replayNodeStatus = computed(() => {
  const map: Record<string, string> = {};
  if (replayStep.value < 0) return map;
  for (let i = 0; i <= replayStep.value; i++) {
    const evt = activeEvents.value[i];
    if (!evt?.spiderNodeCode) continue;
    switch (evt.spiderEventType) {
      case 'STEP_STARTED': map[evt.spiderNodeCode] = 'RUNNING'; break;
      case 'STEP_SUCCESS': map[evt.spiderNodeCode] = 'SUCCESS'; break;
      case 'STEP_FAILED': map[evt.spiderNodeCode] = 'FAILED'; break;
      case 'STEP_WAIT_MANUAL': map[evt.spiderNodeCode] = 'WAIT_MANUAL'; break;
    }
  }
  return map;
});

const effectiveNodeRuntimeMap = computed(() => {
  if (replayStep.value < 0) return nodeRuntimeMap.value;
  const map: Record<string, { status: string; displayInfo?: string }> = {};
  for (const [code, status] of Object.entries(replayNodeStatus.value)) {
    map[code] = { status };
  }
  return map;
});

function buildRuntimeNodes() {
  const baseNodes = workingFlow.value.nodes.map(item => ({
    id: item.id,
    kind: item.type,
    title: item.title,
    position: item.position,
    config: item.config,
    icon: item.icon,
    image: item.image,
  }));
  const steps = activeExecution.value?.spiderSteps || [];
  const derivedSteps = steps.filter(item => item.spiderIsDerivedNode === 1);
  if (!derivedSteps.length) {
    return baseNodes;
  }
  const nodeMap = new Map(baseNodes.map(item => [item.id, item]));
  // 查找人工任务中的 formFields（AI 运行时生成的字段）
  const manualTaskFields = new Map<string, any[]>();
  for (const task of activeExecution.value?.spiderManualTasks || []) {
    const payload = taskPayload(task);
    if (payload.formFields?.length) {
      manualTaskFields.set(task.spiderNodeCode, payload.formFields);
    }
  }
  for (const step of derivedSteps) {
    if (nodeMap.has(step.spiderNodeCode)) {
      continue;
    }
    const sourceNode = step.spiderSourceNodeCode ? nodeMap.get(step.spiderSourceNodeCode) : null;
    // 优先从 manual task payload 取 AI 生成的 formFields，其次从源节点配置继承
    const derivedFormFields = manualTaskFields.get(step.spiderSourceNodeCode || '')
      ?? (step.spiderInputPayload
        ? (() => { try { const c = JSON.parse(step.spiderInputPayload || '{}'); return c.formFields || []; } catch { return []; } })()
        : []);
    const derivedTaskPrompt = (() => { try { const c = JSON.parse(step.spiderInputPayload || '{}'); return c.taskPrompt || ''; } catch { return ''; } })();
    nodeMap.set(step.spiderNodeCode, {
      id: step.spiderNodeCode,
      kind: "HUMAN_INTERVENE",
      title: step.spiderNodeName || "人工派生节点",
      position: sourceNode
        ? { x: sourceNode.position.x + 260, y: sourceNode.position.y + 140 }
        : { x: 420, y: 240 },
      config: {
        taskType: "DERIVED",
        sourceNodeCode: step.spiderSourceNodeCode,
        derived: true,
        formFields: derivedFormFields,
        taskPrompt: derivedTaskPrompt,
      },
      icon: "ri:user-heart-line",
      image: undefined,
    });
  }
  return Array.from(nodeMap.values());
}

function buildRuntimeEdges(stepStatusOverride?: Record<string, string>) {
  const stepMap = Object.fromEntries((activeExecution.value?.spiderSteps || []).map(item => [item.spiderNodeCode, item]));
  const traversedEdgeMap = Object.fromEntries((activeExecution.value?.spiderTraversedEdges || []).map(item => [item.edgeId, item]));
  const resolveEdgeRuntime = (sourceId: string, targetId: string) => {
    if (stepStatusOverride) {
      const targetStatus = stepStatusOverride[targetId];
      if (targetStatus) {
        return { visited: true, runtimeStatus: targetStatus };
      }
      const sourceStatus = stepStatusOverride[sourceId];
      if (sourceStatus) {
        return { visited: false, runtimeStatus: sourceStatus };
      }
      return { visited: false, runtimeStatus: '' };
    }
    const sourceStep = stepMap[sourceId];
    const targetStep = stepMap[targetId];
    const visited = Boolean(
      targetStep?.spiderStartedAt
      || targetStep?.spiderFinishedAt
      || targetStep?.spiderStepStatus === "WAIT_MANUAL"
      || targetStep?.spiderStepStatus === "SUCCESS"
      || targetStep?.spiderStepStatus === "FAILED",
    );
    const runtimeStatus = targetStep?.spiderStepStatus || "";
    // 如果目标节点正在 RUNNING，边缘必须显示为 RUNNING
    if (targetStep?.spiderStepStatus === "RUNNING") {
      return { visited, runtimeStatus: "RUNNING" };
    }
    return { visited, runtimeStatus };
  };
  const edges = workingFlow.value.edges.map(item => ({
    hidden: false,
    id: item.id,
    source: item.source,
    target: item.target,
    label: item.label,
    sourceOutput: mapPortId(item.sourceOutput),
    targetInput: mapPortId(item.targetInput, "input"),
    ...(stepStatusOverride
      ? resolveEdgeRuntime(item.source, item.target)
      : traversedEdgeMap[item.id]
        ? {
            visited: traversedEdgeMap[item.id].spiderVisited === 1,
            runtimeStatus: traversedEdgeMap[item.id].spiderRuntimeStatus || "",
          }
        : resolveEdgeRuntime(item.source, item.target)),
  }));
  const edgeIds = new Set(edges.map(item => item.id));
  // Chain-aware derived node grouping
  const steps = activeExecution.value?.spiderSteps || [];
  const derivedSteps_r = steps.filter(s =>
    s.spiderIsDerivedNode === 1 && s.spiderSourceNodeCode && s.spiderSourceNodeCode !== s.spiderNodeCode
  );
  function traceRootCode_r(code: string): string {
    const visited = new Set<string>();
    let current = code;
    while (current && stepMap[current]?.spiderIsDerivedNode === 1 && stepMap[current]?.spiderSourceNodeCode !== current) {
      if (visited.has(current)) break;
      visited.add(current);
      current = stepMap[current].spiderSourceNodeCode;
    }
    return current;
  }
  const chainGroups_r = new Map<string, any[]>();
  for (const step of derivedSteps_r) {
    const root = traceRootCode_r(step.spiderNodeCode);
    if (!chainGroups_r.has(root)) chainGroups_r.set(root, []);
    chainGroups_r.get(root)!.push(step);
  }
  function getSeq_r(code: string): number {
    const m = code.match(/#derived(?:-(\d+))?$/);
    if (!m) return 1;
    return m[1] ? parseInt(m[1]) : 1;
  }
  for (const [, chain] of chainGroups_r) {
    chain.sort((a, b) => getSeq_r(a.spiderNodeCode) - getSeq_r(b.spiderNodeCode));
  }
  // Build chain edges for each derived node group
  for (const [, chain] of chainGroups_r) {
    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      // In-edge: previous node -> current derived
      const fromCode = i === 0 ? step.spiderSourceNodeCode : chain[i - 1].spiderNodeCode;
      const inEdgeId = `derived-${fromCode}-${step.spiderNodeCode}`;
      if (edgeIds.has(inEdgeId)) continue;
      edges.push({
        id: inEdgeId,
        source: fromCode,
        target: step.spiderNodeCode,
        label: "人工派生",
        sourceOutput: "output",
        targetInput: "input",
        ...resolveEdgeRuntime(fromCode, step.spiderNodeCode),
      });
      edgeIds.add(inEdgeId);
      // Out-edge: only the LAST node connects to original target
      if (i === chain.length - 1) {
        const root = traceRootCode_r(step.spiderNodeCode);
        for (const originalEdge of workingFlow.value.edges.filter(item => item.source === root)) {
          if (String(originalEdge.target).includes("#derived")) continue;
          const outEdgeId = `derived-continue-${step.spiderNodeCode}-${originalEdge.target}`;
          if (edgeIds.has(outEdgeId)) continue;
          edges.push({
            id: outEdgeId,
            source: step.spiderNodeCode,
            target: originalEdge.target,
            label: originalEdge.label || "人工完成后继续",
            sourceOutput: "output",
            targetInput: mapPortId(originalEdge.targetInput, "input"),
            ...resolveEdgeRuntime(step.spiderNodeCode, originalEdge.target),
          });
          edgeIds.add(outEdgeId);
        }
      }
    }
  }
  const derivedSources = new Set(
    (activeExecution.value?.spiderSteps || [])
      .filter(item => item.spiderIsDerivedNode === 1 && item.spiderSourceNodeCode)
      .map(item => item.spiderSourceNodeCode as string),
  );
  for (const edge of edges) {
    if (
      derivedSources.has(edge.source)
      && !String(edge.id).startsWith("derived-")
      && !String(edge.id).startsWith("derived-continue-")
    ) {
      edge.hidden = true;
    }
  }
  return edges.filter(item => !item.hidden);
}

// ── 逐帧回放控制 ──

function startReplayTimer() {
  stopReplayTimer();
  replayTimer.value = setInterval(() => {
    if (replayStep.value >= activeEvents.value.length - 1) {
      stopReplayTimer();
      isReplayPlaying.value = false;
      return;
    }
    replayStep.value++;
  }, replaySpeed.value);
}

function stopReplayTimer() {
  if (replayTimer.value !== null) {
    clearInterval(replayTimer.value);
    replayTimer.value = null;
  }
}

function replayTogglePlay() {
  if (isReplayPlaying.value) {
    isReplayPlaying.value = false;
    stopReplayTimer();
  } else {
    if (replayStep.value < 0 || replayStep.value >= activeEvents.value.length - 1) {
      replayStep.value = 0;
    }
    isReplayPlaying.value = true;
    startReplayTimer();
  }
}

function replayStepForward() {
  if (isReplayPlaying.value) return;
  if (replayStep.value < activeEvents.value.length - 1) {
    replayStep.value++;
  }
}

function replayStepBackward() {
  if (isReplayPlaying.value) return;
  if (replayStep.value > 0) {
    replayStep.value--;
  }
}

function replayRestart() {
  stopReplayTimer();
  isReplayPlaying.value = false;
  replayStep.value = 0;
}

function replayStop() {
  stopReplayTimer();
  isReplayPlaying.value = false;
  replayStep.value = -1;
}

// 速度切换时重启定时器
watch(replaySpeed, () => {
  if (isReplayPlaying.value) {
    startReplayTimer();
  }
});

// 日志面板自动滚动到底部
watch(activeEvents, () => {
  nextTick(() => {
    if (logPanelBodyRef.value) {
      logPanelBodyRef.value.scrollTop = logPanelBodyRef.value.scrollHeight;
    }
  });
}, { deep: true });

// 监听人工任务：当出现 WAIT_MANUAL 时通知用户
watch(
  () => activeExecution.value?.spiderExecutionStatus,
  (status, prevStatus) => {
    if (status === "WAIT_MANUAL" && prevStatus !== "WAIT_MANUAL") {
      const taskCount = activeExecution.value?.spiderManualTasks?.length || 0;
      ElNotification({
        title: "需要人工处理",
        message: `执行器在节点 "${activeExecution.value?.spiderCurrentNodeCode || ""}" 暂停，共 ${taskCount} 个待处理任务`,
        type: "warning",
        duration: 0,
        position: "top-right",
      });
    }
    if ((status === "SUCCESS" || status === "FAILED" || status === "STOPPED") && prevStatus !== status) {
      ElNotification({
        title: status === "SUCCESS" ? "执行完成" : status === "FAILED" ? "执行失败" : "执行已停止",
        message: `执行状态：${status}`,
        type: status === "SUCCESS" ? "success" : "error",
        duration: 4000,
      });
    }
  },
);


// 监听人工任务数量变化（新增任务时提醒 + 自动弹窗）
watch(
  () => activeExecution.value?.spiderManualTasks?.length || 0,
  (count) => {
    if (count > 0 && count > lastManualTaskCount) {
      const newTasks = (activeExecution.value?.spiderManualTasks || []).slice(lastManualTaskCount);
      for (const task of newTasks) {
        const payload = taskPayload(task);
        ElNotification({
          title: `人工任务：${payload.taskTitle || task.spiderTaskType}`,
          message: payload.taskGuide || payload.taskPrompt || "请打开人工任务面板查看详情",
          type: "warning",
          duration: 8000,
        });
      }
      // 自动弹窗显示最新的人工任务
      const latestTask = newTasks[newTasks.length - 1];
      if (latestTask) {
        humanInterveneTask.value = latestTask;
        showHumanInterveneDialog.value = true;
      }
    }
    lastManualTaskCount = count;
  },
);

// 人工任务被消费后自动关闭弹窗
watch(
  () => activeExecution.value?.spiderManualTasks?.map(t => t.spiderNodeCode) || [],
  (taskCodes) => {
    if (showHumanInterveneDialog.value && humanInterveneTask.value && !taskCodes.includes(humanInterveneTask.value.spiderNodeCode)) {
      showHumanInterveneDialog.value = false;
      humanInterveneTask.value = null;
    }
  },
  { deep: true },
);

function inferDefaultValue(nodeType: SpiderNodeType, field: string, component: ScMFlowPaletteItem["schema"][number]["component"]) {
  if (component === "switch") {
    if (field === "dedupBeforeQueue") return true;
    return false;
  }
  if (component === "number") {
    if (field === "timeoutSeconds") return 30;
    if (field === "collectLimit") return 1000;
    if (field === "maxSteps") return 15;
    return 0;
  }
  if (nodeType === "CONDITION" && field === "trueLabel") return "满足";
  if (nodeType === "CONDITION" && field === "falseLabel") return "不满足";
  if (nodeType === "HUMAN_INTERVENE" && field === "taskType") return "CAPTCHA";
  if (nodeType === "HUMAN_INTERVENE" && field === "notifyChannel") return "lay-task";
  if (nodeType === "PAGE_ACCESS" && field === "accessMode") return "HTTP";
  if (nodeType === "URL_PARSE" && field === "parseMode") return "AUTO_LINKS";
  if (nodeType === "DATA_PARSE" && field === "parseMode") return "AI";
  return "";
}

function mapPortId(value?: string, fallback = "output") {
  if (!value) return fallback;
  if (value === "in") return "input";
  if (value === "out") return "output";
  if (value === "true") return "pass";
  if (value === "false") return "reject";
  if (value === "pass") return "pass";
  if (value === "reject") return "reject";
  return value;
}

function eventTypeColor(type: string): string {
  switch (type) {
    case "EXECUTION_STARTED":
    case "STEP_STARTED":
      return "started";
    case "EXECUTION_CREATED":
    case "STEP_SUCCESS":
    case "MANUAL_TASK_SUBMITTED":
      return "success";
    case "STEP_FAILED":
    case "EXECUTION_FAILED":
      return "failed";
    case "STEP_WAIT_MANUAL":
    case "MANUAL_TASK":
      return "wait";
    default:
      return "info";
  }
}

function parseExecutorConfig(value?: string) {
  if (!value) return {} as Record<string, any>;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function isDefinitionAiEnabled(definition?: SpiderDefinition | null) {
  if (!definition) return true;
  if (typeof definition.spiderAiEnabled === "boolean") return definition.spiderAiEnabled;
  if (typeof definition.spiderAiEnabled === "number") return definition.spiderAiEnabled !== 0;
  const config = parseExecutorConfig(definition.spiderExecutorConfig);
  if (typeof config.aiEnabled === "boolean") return config.aiEnabled;
  if (typeof config.aiEnabled === "number") return config.aiEnabled !== 0;
  return true;
}

function defaultNodeAiEnabled(node: SpiderFlowSchema["nodes"][number], definitionAiEnabled: boolean) {
  if (!definitionAiEnabled) {
    return false;
  }
  if (node.type === "START" || node.type === "END") {
    return false;
  }
  if (node.type === "DATA_PARSE") {
    const parseMode = String(node.config?.parseMode || "").toUpperCase();
    return !["CSS", "XPATH", "REGEX", "JSON_PATH"].includes(parseMode);
  }
  return true;
}

function applyDefinitionAiDefaults(schema: SpiderFlowSchema, definition?: SpiderDefinition | null): SpiderFlowSchema {
  const definitionAiEnabled = isDefinitionAiEnabled(definition);
  // Extract entryUrl from START node, so PAGE_ACCESS nodes can use it
  const startNode = schema.nodes.find(n => n.type === "START");
  const entryUrl = startNode?.config?.entryUrl || "";
  return {
    ...schema,
    nodes: schema.nodes.map(node => {
      // Always ensure aiEnabled is set
      const hasAiEnabled = node.config && Object.prototype.hasOwnProperty.call(node.config, "aiEnabled");
      const base = {
        ...node,
        config: {
          ...node.config,
          ...(hasAiEnabled ? {} : { aiEnabled: defaultNodeAiEnabled(node, definitionAiEnabled) }),
        },
      };
      // Copy entryUrl from START to PAGE_ACCESS as targetUrl
      if (node.type === "PAGE_ACCESS" && !base.config.targetUrl && entryUrl) {
        base.config.targetUrl = entryUrl;
      }
      // Convert legacy fieldMapping string to fieldMappings array
      if (node.type === "DATA_PARSE") {
        if (typeof base.config.fieldMapping === "string" && !Array.isArray(base.config.fieldMappings)) {
          const fields = base.config.fieldMapping.split(",").map((f: string) => f.trim()).filter(Boolean);
          base.config.fieldMappings = fields.map((f: string) => ({
            pageField: f,
            contextField: f,
            selectorType: "AI",
            selector: "",
          }));
          delete base.config.fieldMapping;
        }
      }
      // Set default schemaCode for SAVE_RESULT from spider definition
      if (node.type === "SAVE_RESULT" && !base.config.schemaCode && definition?.spiderCode) {
        base.config.schemaCode = definition.spiderCode + "_schema";
      }
      if (node.type === "ASYNC_SAVE" && !base.config.schemaCode && definition?.spiderCode) {
        base.config.schemaCode = definition.spiderCode + "_schema";
      }
      return base;
    }),
  };
}

/**
 * 将简单线性流程重构为翻页循环模式：
 *   START → URL_PARSE(项目列表页) → DATA_PARSE → SAVE_RESULT
 *                                           → CONDITION(数量>500)
 *                                              满足 → END
 *                                              不满足 → URL_PARSE(翻页) → DATA_PARSE(循环)
 * 如果流程中已有 CONDITION 节点则跳过。
 */
function restructurePaginationFlow(schema: SpiderFlowSchema): SpiderFlowSchema {
  // 已包含条件判断 → 不做重构
  if (schema.nodes.some(n => n.type === "CONDITION")) return schema;

  const nodes = [...schema.nodes];
  const edges: SpiderFlowEdge[] = [];

  const startNode = nodes.find(n => n.type === "START");
  const urlParseNodes = nodes.filter(n => n.type === "URL_PARSE");
  const dataParseNode = nodes.find(n => n.type === "DATA_PARSE");
  const saveResultNode = nodes.find(n => n.type === "SAVE_RESULT");
  const endNode = nodes.find(n => n.type === "END");

  // 重命名第一个 URL_PARSE 为"项目列表页"
  if (urlParseNodes.length > 0) {
    urlParseNodes[0].title = "项目列表页";
  }

  const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 以 DATA_PARSE 位置为参考放置新节点
  const refPos = dataParseNode?.position || { x: 440, y: 100 };

  // 创建条件判断节点
  const conditionNode: SpiderFlowNode = {
    id: genId("condition"),
    type: "CONDITION",
    title: "数量 > 500",
    position: { x: refPos.x, y: refPos.y + 140 },
    config: {
      condition: "${ctx.count} > 500",
      trueLabel: "满足",
      falseLabel: "不满足",
    },
  };

  // 创建翻页 URL 解析节点
  const paginationNode: SpiderFlowNode = {
    id: genId("url_parse"),
    type: "URL_PARSE",
    title: "翻页",
    position: { x: refPos.x, y: refPos.y + 280 },
    config: {},
  };

  nodes.push(conditionNode, paginationNode);

  const edge = (source: string, target: string, sourceOutput?: string): SpiderFlowEdge => ({
    id: `edge_${source.substring(0, 8)}_${target.substring(0, 8)}`,
    source,
    target,
    ...(sourceOutput ? { sourceOutput } : {}),
  });

  // START → URL_PARSE(项目列表页)
  if (startNode && urlParseNodes[0]) {
    edges.push(edge(startNode.id, urlParseNodes[0].id));
  }

  // URL_PARSE(项目列表页) → DATA_PARSE
  if (urlParseNodes[0] && dataParseNode) {
    edges.push(edge(urlParseNodes[0].id, dataParseNode.id));
  }

  // DATA_PARSE → SAVE_RESULT
  if (dataParseNode && saveResultNode) {
    edges.push(edge(dataParseNode.id, saveResultNode.id));
  }

  // DATA_PARSE → CONDITION
  if (dataParseNode) {
    edges.push(edge(dataParseNode.id, conditionNode.id));
  }

  // CONDITION(满足) → URL_PARSE(翻页) —— 还有更多页，继续翻页
  edges.push(edge(conditionNode.id, paginationNode.id, "pass"));

  // CONDITION(不满足) → END —— 数据够了，结束
  if (conditionNode && endNode) {
    edges.push(edge(conditionNode.id, endNode.id, "reject"));
  }

  // URL_PARSE(翻页) → DATA_PARSE（循环回 DATA_PARSE）
  if (dataParseNode) {
    edges.push(edge(paginationNode.id, dataParseNode.id));
  }

  return { ...schema, nodes, edges };
}

/**
 * 将 API 返回的 snake_case 节点属性映射为标准 camelCase，
 * 确保所有下游消费者（spiderCanvasNodes、click handler 等）
 * 都能通过 n.id / n.type / n.title / n.position 访问。
 * 合成节点（restructurePaginationFlow 创建）已有 id/type，不受影响。
 */
function normalizeSchemaNodes(schema: SpiderFlowSchema): SpiderFlowSchema {
  if (!schema.nodes?.length) return schema;
  return {
    ...schema,
    nodes: schema.nodes.map(node => ({
      ...node,
      id: node.id || (node as any).spiderNodeCode || "",
      type: (node.type || (node as any).spiderNodeType) as SpiderNodeType,
      title: node.title || (node as any).spiderNodeName || "",
      position: node.position || {
        x: (node as any).posX ?? 0,
        y: (node as any).posY ?? 0,
      },
    })),
  };
}

async function loadSchema(spiderDefinitionCode: string) {
  try {
    const rawSchema = await getSpiderOrchestrationSchema(spiderDefinitionCode, 1, orchestrationType.value);
    const schema = normalizeSchemaNodes(rawSchema);
    workingFlow.value = restructurePaginationFlow(applyDefinitionAiDefaults(schema, currentSpiderDefinition.value));
    currentSpiderCode.value = spiderDefinitionCode;
    statusMessage.value = "";
    await loadSubFlowSchemas(schema);
  } catch (error) {
    throw error;
  }
}

/** 切换编排类型（AI / MANUAL），重新加载对应的流程 */
async function switchOrchestrationType(type: "AI" | "MANUAL") {
  if (type === orchestrationType.value) return;
  orchestrationType.value = type;
  if (currentSpiderCode.value) {
    statusMessage.value = type === "AI" ? "切换到 AI 编排" : "切换到人工编排";
    try {
      await loadSchema(currentSpiderCode.value);
    } catch {
      // 如果该类型尚无流程数据，则初始化空流程
      workingFlow.value = {
        spiderDefinitionCode: currentSpiderCode.value,
        spiderFlowVersion: 1,
        spiderFlowName: currentSpiderDefinition.value?.spiderName || currentSpiderCode.value,
        spiderFlowScope: "PRIVATE",
        orchestrationType: type,
        nodes: [],
        edges: [],
      };
      statusMessage.value = type === "AI" ? "已切换到 AI 编排（新建）" : "已切换到人工编排（新建）";
    }
  }
}

async function loadSubFlowSchemas(schema: SpiderFlowSchema) {
  const newCache = new Map<string, SpiderFlowSchema>();
  for (const node of schema.nodes) {
    if (node.type === "SUB_FLOW" && node.config?.subFlowCode) {
      const subCode = String(node.config.subFlowCode);
      let subSchema: SpiderFlowSchema | undefined;
      try {
        const result = await getSpiderOrchestrationSchema(subCode, 1);
        if (result.nodes?.length) {
          subSchema = result;
        }
      } catch {
        // 子流程 schema 不可用，跳过
      }
      if (subSchema) {
        newCache.set(node.id, subSchema);
      }
    }
  }
  subFlowSchemas.value = newCache;
}

function stopExecutionPolling() {
  if (executionPolling.value) {
    clearInterval(executionPolling.value);
    executionPolling.value = null;
  }
}

function stopExecutionEventSource() {
  if (executionEventSource.value) {
    executionEventSource.value.close();
    executionEventSource.value = null;
  }
}

function resolveSocketLike(service: any) {
  if (!service) return null;
  if (typeof service.on === "function" && typeof service.off === "function") return service;
  if (service.socket && typeof service.socket.on === "function" && typeof service.socket.off === "function") return service.socket;
  return null;
}

function resolveSocketService() {
  const injectedSocket = inject<any>("socket", null);
  const injectedSocketService = inject<any>("socketService", null);
  const candidates = [
    resolveSocketLike(injectedSocketService),
    resolveSocketLike(injectedSocket),
  ];
  try {
    if (typeof (CoreSocket as any).useSocketService === "function") {
      candidates.push(resolveSocketLike((CoreSocket as any).useSocketService()));
    }
  } catch {
    // ignore
  }
  try {
    if (typeof (CoreSocket as any).getGlobalSocketService === "function") {
      candidates.push(resolveSocketLike((CoreSocket as any).getGlobalSocketService()));
    }
  } catch {
    // ignore
  }
  return candidates.find(Boolean) || null;
}

function teardownSocketListener() {
  const socket = socketServiceRef.value;
  if (socket && typeof socket.off === "function") {
    socket.off(socketEventName);
  }
  socketServiceRef.value = null;
}

function setupSocketListener() {
  teardownSocketListener();
  const socket = resolveSocketService();
  if (!socket || typeof socket.on !== "function") {
    return false;
  }
  socket.on(socketEventName, (payload: any) => {
    if (!activeExecution.value?.spiderExecutionNo) return;
    if (payload?.spiderExecutionNo !== activeExecution.value.spiderExecutionNo) return;
    pollExecution(activeExecution.value.spiderExecutionNo).catch(() => undefined);
  });
  socketServiceRef.value = socket;
  return true;
}

function setupEventSource(spiderExecutionNo: string) {
  stopExecutionEventSource();
  try {
    const source = new EventSource(`/spider-api/spider/executions/stream?spiderExecutionNo=${encodeURIComponent(spiderExecutionNo)}`);
    source.addEventListener("spider-execution-event", () => {
      pollExecution(spiderExecutionNo).catch(() => undefined);
    });
    source.onerror = () => {
      stopExecutionEventSource();
    };
    executionEventSource.value = source;
    return true;
  } catch {
    stopExecutionEventSource();
    return false;
  }
}

function taskPayload(task: SpiderManualTaskView) {
  try {
    const payload = JSON.parse(task.spiderTaskPayload || "{}");
    return {
      ...payload,
      formFields: Array.isArray(payload.formFields) ? payload.formFields : [],
    };
  } catch {
    return {
      taskTitle: task.spiderTaskType,
      taskPrompt: "",
      taskGuide: "",
      formFields: [],
    };
  }
}

function syncManualForms() {
  const next: Record<string, Record<string, string>> = {};
  for (const task of activeExecution.value?.spiderManualTasks || []) {
    const current = manualFormValues.value[task.spiderNodeCode] || {};
    next[task.spiderNodeCode] = { ...current };
  }
  manualFormValues.value = next;
}

function updateManualField(nodeCode: string, fieldKey: string, value: string) {
  manualFormValues.value = {
    ...manualFormValues.value,
    [nodeCode]: {
      ...(manualFormValues.value[nodeCode] || {}),
      [fieldKey]: value,
    },
  };
}

async function pollExecution(spiderExecutionNo: string) {
  const [detail, events] = await Promise.all([
    getSpiderExecutionDetail(spiderExecutionNo),
    getSpiderExecutionEvents(spiderExecutionNo),
  ]);
  activeExecution.value = detail;
  activeEvents.value = events;
  syncManualForms();
  statusMessage.value = `执行状态：${detail.spiderExecutionStatus}`;
  if (["SUCCESS", "FAILED", "STOPPED"].includes(detail.spiderExecutionStatus)) {
    stopExecutionPolling();
    stopExecutionEventSource();
    teardownSocketListener();
  }
}

async function handlePreviewRun() {
  if (!workingFlow.value.spiderDefinitionCode) return;
  replayStop();
  activeExecution.value = null;
  activeEvents.value = [];
  try {
    const detail = await previewSpiderExecution({
      spiderDefinitionCode: workingFlow.value.spiderDefinitionCode,
      spiderFlowVersion: workingFlow.value.spiderFlowVersion,
      spiderTriggerType: "PREVIEW",
    });
    activeExecution.value = detail;
    manualFormValues.value = {};
    await pollExecution(detail.spiderExecutionNo);
    statusMessage.value = `预览状态：${detail.spiderExecutionStatus}`;
  } catch (error: any) {
    const msg = error?.message || "预览失败，请稍后重试";
    statusMessage.value = `预览失败：${msg}`;
    ElNotification({ title: "预览失败", message: msg, type: "error" });
  }
}

async function handleRealRun() {
  if (activeExecution.value?.spiderExecutionStatus === "RUNNING") {
    ElNotification({
      title: "执行中",
      message: "当前已有执行正在运行，请先结束或等待完成。",
      type: "warning",
    });
    return;
  }
  if (!workingFlow.value.spiderDefinitionCode) return;
  replayStop();
  // 新一轮执行始终从用户原始编排开始，运行态派生节点仅属于上一轮执行记录。
  activeExecution.value = null;
  activeEvents.value = [];
  manualFormValues.value = {};
  statusMessage.value = "正在启动新执行...";
  lastExecutionStatus.value = null;
  try {
    const detail = await runSpiderExecution({
      spiderDefinitionCode: workingFlow.value.spiderDefinitionCode,
      spiderFlowVersion: workingFlow.value.spiderFlowVersion,
      spiderTriggerType: "MANUAL",
      orchestrationType: orchestrationType.value,
    });
    activeExecution.value = detail;
    statusMessage.value = `执行状态：${detail.spiderExecutionStatus}`;
    stopExecutionPolling();
    stopExecutionEventSource();
    teardownSocketListener();
    const hasSocket = setupSocketListener();
    const hasEventSource = hasSocket ? false : setupEventSource(detail.spiderExecutionNo);
    if (!hasSocket && !hasEventSource) {
      executionPolling.value = setInterval(() => {
        pollExecution(detail.spiderExecutionNo).catch(() => undefined);
      }, 2000);
    }
    await pollExecution(detail.spiderExecutionNo);
    ElNotification({
      title: "已启动",
      message: `执行已启动：${detail.spiderExecutionNo}`,
      type: "success",
    });
  } catch (error: any) {
    const msg = error?.message || "系统繁忙，请稍后重试";
    statusMessage.value = `运行失败：${msg}`;
    ElNotification({ title: "运行失败", message: msg, type: "error" });
  }
}

/**
 * 从上次断点处继续执行。
 */
async function handleContinueRun() {
  if (!workingFlow.value.spiderDefinitionCode) return;
  replayStop();
  activeExecution.value = null;
  activeEvents.value = [];
  manualFormValues.value = {};
  statusMessage.value = "正在从断点恢复执行...";
  lastExecutionStatus.value = null;
  try {
    const detail = await runSpiderExecution({
      spiderDefinitionCode: workingFlow.value.spiderDefinitionCode,
      spiderFlowVersion: workingFlow.value.spiderFlowVersion,
      spiderTriggerType: "RESUME",
      orchestrationType: orchestrationType.value,
      spiderContinueFromLast: true,
    });
    activeExecution.value = detail;
    statusMessage.value = `执行状态：${detail.spiderExecutionStatus}`;
    stopExecutionPolling();
    stopExecutionEventSource();
    teardownSocketListener();
    const hasSocket = setupSocketListener();
    const hasEventSource = hasSocket ? false : setupEventSource(detail.spiderExecutionNo);
    if (!hasSocket && !hasEventSource) {
      executionPolling.value = setInterval(() => {
        pollExecution(detail.spiderExecutionNo).catch(() => undefined);
      }, 2000);
    }
    await pollExecution(detail.spiderExecutionNo);
    ElNotification({
      title: "已恢复",
      message: `从断点恢复：${detail.spiderExecutionNo}`,
      type: "success",
    });
  } catch (error: any) {
    const msg = error?.message || "系统繁忙，请稍后重试";
    statusMessage.value = `恢复失败：${msg}`;
    ElNotification({ title: "恢复失败", message: msg, type: "error" });
  }
}

async function handleStopRun() {
  if (!activeExecution.value?.spiderExecutionNo) return;
  try {
    const detail = await stopSpiderExecution(activeExecution.value.spiderExecutionNo);
    activeExecution.value = detail;
    await pollExecution(detail.spiderExecutionNo);
    statusMessage.value = `执行已停止：${detail.spiderExecutionStatus}`;
    lastExecutionStatus.value = 'STOPPED';
  } catch (error: any) {
    const msg = error?.message || "取消失败，请稍后重试";
    statusMessage.value = `取消失败：${msg}`;
    ElNotification({ title: "取消失败", message: msg, type: "error" });
  }
}


async function submitManualTaskForm(task: SpiderManualTaskView, continueAfter: boolean) {
  const values = manualFormValues.value[task.spiderNodeCode] || {};
  const payload = taskPayload(task);
  const missing = (payload.formFields || []).filter((item: any) => item.required && !values[item.fieldKey]);
  if (missing.length) {
    statusMessage.value = `请先填写：${missing[0].label || missing[0].fieldKey}`;
    return;
  }
  statusMessage.value = "正在提交人工处理结果...";
  try {
    const detail = await submitSpiderManualTask({
      spiderExecutionNo: task.spiderExecutionNo,
      spiderNodeCode: task.spiderNodeCode,
      spiderOperatorName: "USER",
      spiderOperatorResult: JSON.stringify(values),
      spiderContinueExecution: continueAfter,
    });
    activeExecution.value = detail;
    if (continueAfter) {
      await pollExecution(detail.spiderExecutionNo);
      ElNotification({
        title: "提交成功",
        message: "人工结果已提交，流程继续执行",
        type: "success",
        duration: 3000,
      });
    } else {
      statusMessage.value = "人工结果已提交，点击「继续」恢复执行";
      ElNotification({
        title: "已提交",
        message: "人工结果已提交，可通过「继续」按钮恢复执行",
        type: "success",
        duration: 3000,
      });
    }
  } catch (error: any) {
    statusMessage.value = `提交失败：${error?.message || String(error)}`;
    ElNotification({
      title: "提交失败",
      message: error?.message || String(error),
      type: "error",
      duration: 5000,
    });
  }
}

async function handleResumeRun() {
  if (!activeExecution.value?.spiderExecutionNo) return;
  if (!activeExecution.value?.spiderManualTasks?.length) return;
  // 如果有未提交的任务，使用最后一个任务的参数恢复执行
  const task = activeExecution.value.spiderManualTasks[activeExecution.value.spiderManualTasks.length - 1];
  const values = manualFormValues.value[task.spiderNodeCode] || {};
  const payload = taskPayload(task);
  const missing = (payload.formFields || []).filter((item: any) => item.required && !values[item.fieldKey]);
  if (missing.length) {
    // 没填写但有已提交的结果也可以继续
  }
  const detail = await submitSpiderManualTask({
    spiderExecutionNo: task.spiderExecutionNo,
    spiderNodeCode: task.spiderNodeCode,
    spiderOperatorName: "USER",
    spiderOperatorResult: JSON.stringify(values),
    spiderContinueExecution: true,
  });
  activeExecution.value = detail;
  await pollExecution(detail.spiderExecutionNo);
  ElNotification({
    title: "继续执行",
    message: "人工处理已恢复，流程继续执行。",
    type: "success",
  });
}

async function handleSaveFlow() {
  statusMessage.value = "保存中...";
  try {
    const saved = await saveSpiderOrchestrationSchema(workingFlow.value);
    workingFlow.value = saved;
    statusMessage.value = "已保存";
  } catch (error: any) {
    const msg = error?.message || "保存失败，请稍后重试";
    statusMessage.value = `保存失败：${msg}`;
    ElNotification({ title: "保存失败", message: msg, type: "error" });
  }
}

async function handleExternalSave() {
  const validationError = validateBeforeSave(workingFlow.value);
  if (validationError) {
    statusMessage.value = validationError;
    return;
  }
  await handleSaveFlow();
}

async function handleExportSchema() {
  if (!workingFlow.value.spiderDefinitionCode) return;
  try {
    const blob = await exportSpiderOrchestrationSchema(
      workingFlow.value.spiderDefinitionCode,
      workingFlow.value.spiderFlowVersion || 1,
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spider-schema-${workingFlow.value.spiderDefinitionCode}-v${workingFlow.value.spiderFlowVersion || 1}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    statusMessage.value = "已导出编排";
  } catch (error: any) {
    const msg = error?.message || "导出失败，请稍后重试";
    statusMessage.value = `导出失败：${msg}`;
    ElNotification({ title: "导出失败", message: msg, type: "error" });
  }
}

function triggerImportSchema() {
  schemaImportInput.value?.click();
}

async function handleImportSchemaFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const saved = await importSpiderOrchestrationSchema(file);
    const normalized = normalizeSchemaNodes(saved);
    workingFlow.value = normalized;
    currentSpiderCode.value = normalized.spiderDefinitionCode || currentSpiderCode.value;
    activeExecution.value = null;
    activeEvents.value = [];
    manualFormValues.value = {};
    lastExecutionStatus.value = null;
    selectedNodeId.value = null;
    selectedEdgeId.value = null;
    const definitions = await listSpiderDefinitions();
    flowEntries.value = definitions.map(item => ({
      flowCode: item.spiderCode,
      flowName: item.spiderName,
    }));
    currentSpiderDefinition.value = definitions.find(item => item.spiderCode === normalized.spiderDefinitionCode) || null;
    statusMessage.value = "已导入编排";
    await loadSubFlowSchemas(normalized);
  } catch (error: any) {
    const msg = error?.message || "导入失败，请稍后重试";
    statusMessage.value = `导入失败：${msg}`;
    ElNotification({ title: "导入失败", message: msg, type: "error" });
  }
}

const goBack = () => {
  const searchStr = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
  const params = new URLSearchParams(searchStr);
  const spiderTab = params.get("spiderTab");
  if (spiderTab) {
    // SPA 模式: 切换回 manage 标签
    params.set("spiderTab", "manage");
    params.delete("spiderCode");
    params.delete("spiderId");
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
    window.location.reload();
  } else {
    // 独立页面模式: 跳转到爬虫管理页
    window.location.href = "/spider/manage";
  }
};

function validateBeforeSave(flow: SpiderFlowSchema) {
  const startIds = flow.nodes.filter(item => item.type === "START").map(item => item.id);
  const endIds = new Set(flow.nodes.filter(item => item.type === "END").map(item => item.id));
  if (startIds.length !== 1) return "必须且只能包含一个开始节点";
  if (!endIds.size) return "必须至少包含一个结束节点";
  const graph = new Map<string, string[]>();
  for (const edge of flow.edges) {
    const list = graph.get(edge.source) || [];
    list.push(edge.target);
    graph.set(edge.source, list);
  }
  const queue = [startIds[0]];
  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (endIds.has(current)) return null;
    if (visited.has(current)) continue;
    visited.add(current);
    (graph.get(current) || []).forEach(target => queue.push(target));
  }
  return "开始节点必须最终连到结束节点";
}

async function loadDefinitionEntries(preferredCode?: string | null) {
  if (!hasRequestedSpider.value) {
    flowEntries.value = [];
    currentSpiderCode.value = "";
    statusMessage.value = "暂无数据";
    workingFlow.value = {
      spiderDefinitionCode: "",
      spiderFlowVersion: 1,
      spiderFlowName: "",
      spiderFlowScope: "PRIVATE",
      nodes: [],
      edges: [],
    };
    return;
  }

  let definitions: SpiderDefinition[] = [];
  try {
    definitions = await listSpiderDefinitions();
  } catch {
    currentSpiderDefinition.value = preferredCode ? null : null;
    return;
  }

  const filteredDefinitions = activeSpiderId.value !== null
    ? definitions.filter(item => Number(item.spiderId || 0) === activeSpiderId.value)
    : definitions;
  const sourceDefinitions = filteredDefinitions.length ? filteredDefinitions : (
    preferredCode ? definitions.filter(item => item.spiderCode === preferredCode) : []
  );
  flowEntries.value = sourceDefinitions.map(item => ({
    flowCode: item.spiderCode,
    flowName: item.spiderName,
  }));
  const currentCode = preferredCode && sourceDefinitions.some(item => item.spiderCode === preferredCode)
    ? preferredCode
    : sourceDefinitions[0]?.spiderCode;
  if (currentCode) {
    currentSpiderDefinition.value = sourceDefinitions.find(item => item.spiderCode === currentCode) || null;
    currentSpiderCode.value = currentCode;
    await loadSchema(currentCode);
    return;
  }
  currentSpiderDefinition.value = null;
  statusMessage.value = activeSpiderId.value !== null
    ? `未找到 spiderId=${activeSpiderId.value} 对应的爬虫`
    : "暂无可编排爬虫";
}

onMounted(async () => {
  // 同时支持标准 URL query 和 hash 路由模式（#/path?query）
  const searchStr = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
  const params = new URLSearchParams(searchStr);
  const spiderId = params.get("spiderId");
  const spiderCode = params.get("spiderCode") || params.get("spiderExample") || params.get("code");

  hasRequestedSpider.value = Boolean(spiderId || spiderCode);
  activeSpiderId.value = spiderId ? Number(spiderId) : null;
  await loadDefinitionEntries(spiderCode);

  // 自动检测是否有正在执行或最近完成的运行
  if (workingFlow.value?.spiderDefinitionCode) {
    try {
      const latest = await getSpiderExampleLatest(workingFlow.value.spiderDefinitionCode);
      if (latest) {
        activeExecution.value = latest;
        if (["RUNNING", "WAIT_MANUAL", "WAITING"].includes(latest.spiderExecutionStatus)) {
          statusMessage.value = `执行状态：${latest.spiderExecutionStatus}`;
          const hasSocket = setupSocketListener();
          const hasEventSource = hasSocket ? false : setupEventSource(latest.spiderExecutionNo);
          if (!hasSocket && !hasEventSource) {
            executionPolling.value = setInterval(() => {
              pollExecution(latest.spiderExecutionNo).catch(() => undefined);
            }, 2000);
          }
          await pollExecution(latest.spiderExecutionNo);
        } else {
          statusMessage.value = `上次执行状态：${latest.spiderExecutionStatus}`;
          // 标记是否可断点续采
          if (latest.spiderExecutionStatus === 'FAILED' || latest.spiderExecutionStatus === 'STOPPED') {
            lastExecutionStatus.value = latest.spiderExecutionStatus;
          }
        }
      }
    } catch (e) {
      // 忽略，没有已执行的运行
    }
  }

  // 检测回放模式：加载历史执行数据并在画布上播放动画
  const replayExecutionNo = params.get("replayExecutionNo");
  if (replayExecutionNo && workingFlow.value?.nodes?.length) {
    try {
      const [detail, events] = await Promise.all([
        getSpiderExecutionDetail(replayExecutionNo),
        getSpiderExecutionEvents(replayExecutionNo),
      ]);
      if (detail && events?.length) {
        activeExecution.value = detail;
        activeEvents.value = events;
        // 自动开始回放
        replayStep.value = 0;
        statusMessage.value = `回放模式：${detail.spiderExecutionStatus} · ${events.length} 个事件`;
      }
    } catch (e) {
      statusMessage.value = `回放加载失败：${String(e)}`;
    }
  }
});

onBeforeUnmount(() => {
  stopExecutionPolling();
  stopExecutionEventSource();
  teardownSocketListener();
  stopReplayTimer();
});
</script>

<style scoped lang="scss">
/* ── Runtime error banner in config panel ── */
.spider-node-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 25%, transparent);
}

.spider-node-error-banner__icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: var(--el-bg-color);
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.spider-node-error-banner__body {
  flex: 1;
  min-width: 0;
}

.spider-node-error-banner__body strong {
  display: block;
  font-size: 12px;
  color: var(--el-color-danger);
  margin-bottom: 4px;
}

.spider-node-error-banner__body p {
  margin: 0;
  font-size: 11px;
  color: var(--el-color-danger-dark-2);
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.spider-schema-import-input {
  display: none;
}

.spider-orchestration-empty {
  min-height: calc(100vh - 36px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  padding: 24px;
}

.spider-orchestration-empty__card {
  width: min(520px, 100%);
  display: grid;
  gap: 10px;
  padding: 28px 32px;
  border: 1px solid var(--el-border-color);
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color-bg) 92%, transparent);
  text-align: center;
}

.spider-orchestration-empty__card strong {
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.spider-orchestration-empty__card span {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.spider-generic-config {
  display: grid;
  gap: 12px;
}

.spider-generic-config__item {
  display: grid;
  gap: 8px;
}

.spider-generic-config__item > span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.spider-generic-config__item input,
.spider-generic-config__item textarea,
.spider-generic-config__item select {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 86%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 94%, transparent);
  color: var(--el-text-color-primary);
  outline: none;
}

.spider-generic-config__switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spider-generic-config__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.spider-generic-config__actions button {
  height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.spider-generic-config__actions button.is-secondary {
  color: var(--el-text-color-secondary);
}

.spider-orchestration-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 12px;
  background: var(--el-bg-color-bg);
  border-bottom: 1px solid var(--el-border-color);
}

.spider-orchestration-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spider-orchestration-toolbar__status {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.spider-orchestration-toolbar__tabs {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--el-bg-color-alt);
  border-radius: 8px;
  padding: 3px;
  margin: 0 8px;
}

.spider-orchestration-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  line-height: 1.4;
}

.spider-orchestration-tab:hover {
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}

.spider-orchestration-tab.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 1px 3px var(--el-box-shadow-light, rgba(0, 0, 0, 0.08));
  font-weight: 600;
}

.spider-orchestration-canvas {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.spider-theme {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

.spider-toolbar-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  background: color-mix(in srgb, var(--el-bg-color) 80%, transparent);
  color: var(--el-text-color-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  font-size: 13px;
  white-space: nowrap;
}

.spider-toolbar-btn--primary {
  border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.spider-toolbar-btn--resume {
  border-color: color-mix(in srgb, var(--el-color-warning) 24%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  color: var(--el-color-warning-dark-2);
}

.spider-toolbar-btn--icon {
  width: 34px;
  padding: 0;
}

.spider-toolbar-btn--danger {
  border-color: color-mix(in srgb, var(--el-color-danger) 24%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  color: var(--el-color-danger);
}

.spider-toolbar-btn.is-active {
  border-color: color-mix(in srgb, var(--el-color-primary) 24%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
}

.spider-manual-task-board {
  display: grid;
  gap: 12px;
  padding: 0 24px 24px;
  background: var(--el-bg-color);
}

.spider-manual-task-board__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-manual-task-board__head strong {
  color: var(--el-text-color-primary);
  font-size: 16px;
}

.spider-manual-task-board__head span {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.spider-manual-task-board__list {
  display: grid;
  gap: 12px;
}

.spider-manual-task-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 20%, var(--el-border-color));
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-color-warning) 8%, var(--el-bg-color-bg));
}

.spider-manual-task-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-manual-task-card__meta strong {
  color: var(--el-text-color-primary);
}

.spider-manual-task-card__meta span {
  font-size: 12px;
  color: var(--el-color-warning);
}

.spider-manual-task-card > p {
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.spider-manual-task-card__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.spider-manual-task-card__field {
  display: grid;
  gap: 8px;
}

.spider-manual-task-card__field span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.spider-manual-task-card__field input {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 86%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 94%, transparent);
  color: var(--el-text-color-primary);
  outline: none;
}

.spider-manual-task-card__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .spider-manual-task-card__fields {
    grid-template-columns: 1fr;
  }
}

.spider-replay-bar {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color);
}

.spider-replay-bar__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spider-replay-bar__speed {
  height: 34px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  color: var(--el-text-color-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.spider-replay-bar__step {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  min-width: 70px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
/* AI 生成对话框 */
.spider-ai-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 3100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.spider-ai-dialog {
  width: 520px;
  max-width: 90vw;
  background: var(--el-bg-color-primary, var(--el-bg-color));
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.spider-ai-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-color, var(--el-border-color-lighter));
}

.spider-ai-dialog__head strong {
  font-size: 16px;
  color: var(--el-text-color-primary, var(--el-text-color-primary));
}

.spider-ai-dialog__close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--el-text-color-secondary, var(--el-text-color-secondary));
  cursor: pointer;
  padding: 4px;
}

.spider-ai-dialog__close:hover {
  color: var(--el-text-color-primary, var(--el-text-color-primary));
}

.spider-ai-dialog__body {
  padding: 20px;
}

.spider-ai-dialog__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary, var(--el-text-color-secondary));
  margin: 0 0 16px;
  line-height: 1.5;
}

.spider-ai-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.spider-ai-dialog__field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary, var(--el-text-color-primary));
}

.spider-ai-dialog__field input,
.spider-ai-dialog__field textarea {
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-color, var(--el-border-color));
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: var(--el-bg-color-secondary, var(--el-bg-color-page));
  color: var(--el-text-color-primary, var(--el-text-color-primary));
  outline: none;
  transition: border-color 0.2s;
}

.spider-ai-dialog__field input:focus,
.spider-ai-dialog__field textarea:focus {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color-primary, var(--el-bg-color));
}

.spider-ai-dialog__field input:disabled,
.spider-ai-dialog__field textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spider-ai-dialog__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  color: var(--el-color-primary);
  font-size: 14px;
}

.spider-ai-dialog__loading::before {
  content: "";
  width: 18px;
  height: 18px;
  border: 2px solid var(--el-color-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spider-ai-spin 0.8s linear infinite;
}

@keyframes spider-ai-spin {
  to { transform: rotate(360deg); }
}

.spider-ai-dialog__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-color, var(--el-border-color-lighter));
}

.spider-ai-dialog__foot button {
  padding: 7px 18px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-color, var(--el-border-color));
  background: var(--el-bg-color-primary, var(--el-bg-color));
  color: var(--el-text-color-primary, var(--el-text-color-primary));
  transition: all 0.2s;
}

.spider-ai-dialog__foot button.is-primary {
  background: var(--el-color-primary);
  color: var(--el-bg-color);
  border-color: var(--el-color-primary);
}

.spider-ai-dialog__foot button.is-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.spider-ai-dialog__foot button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


/* ── Monitor dialog ── */
.spider-monitor-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 3100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.spider-monitor-dialog {
  width: 90vw;
  max-width: 1100px;
  max-height: 85vh;
  background: var(--el-bg-color-primary, var(--el-bg-color));
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.spider-monitor-dialog__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-light, rgba(0,0,0,0.08));
}
.spider-monitor-dialog__head strong { font-size: 15px; }
.spider-monitor-dialog__close {
  display: grid; place-items: center; width: 28px; height: 28px;
  border: none; border-radius: 6px; background: transparent;
  color: var(--el-text-color-secondary); cursor: pointer; font-size: 18px;
}
.spider-monitor-dialog__close:hover { background: rgba(0,0,0,0.06); }
.spider-monitor-dialog__body {
  flex: 1; overflow-y: auto; padding: 18px;
}

/* ── Log sidebar panel ── */
.spider-log-panel {
  position: fixed;
  top: 58px;
  right: 0;
  width: 400px;
  height: calc(100vh - 58px);
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
  z-index: 2999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.spider-log-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.spider-log-panel__head strong {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.spider-log-panel__close {
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.spider-log-panel__close:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  color: var(--el-color-primary);
}

.spider-log-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.spider-log-panel__empty {
  text-align: center;
  padding: 48px 16px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* ── Log entry ── */
.spider-log-entry {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 16px;
  font-size: 12px;
  line-height: 1.5;
  border-left: 3px solid transparent;
  transition: background 0.15s;
  font-family: ui-monospace, "Cascadia Code", "Fira Code", "Consolas", monospace;
}

.spider-log-entry:hover {
  background: color-mix(in srgb, var(--el-bg-color) 96%, transparent);
}

.spider-log-entry__badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--el-border-color) 50%, transparent);
  color: var(--el-text-color-placeholder);
  text-transform: lowercase;
}

.spider-log-entry__node {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.spider-log-entry__msg {
  color: var(--el-text-color-primary);
  min-width: 0;
  flex: 1;
  word-break: break-word;
}

/* Color variants */
.spider-log-entry.is-started {
  border-left-color: var(--el-color-primary);
}
.spider-log-entry.is-started .spider-log-entry__badge {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary-dark-2);
}

.spider-log-entry.is-success {
  border-left-color: var(--el-color-success);
}
.spider-log-entry.is-success .spider-log-entry__badge {
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
  color: var(--el-color-success);
}

.spider-log-entry.is-failed {
  border-left-color: var(--el-color-danger);
}
.spider-log-entry.is-failed .spider-log-entry__badge {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  color: var(--el-color-danger);
}

.spider-log-entry.is-wait {
  border-left-color: var(--el-color-warning);
}
.spider-log-entry.is-wait .spider-log-entry__badge {
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
  color: var(--el-color-warning-dark-2);
}

.spider-log-entry.is-info {
  border-left-color: var(--el-border-color);
}
.spider-log-entry.is-info .spider-log-entry__badge {
  background: color-mix(in srgb, var(--el-border-color) 50%, transparent);
  color: var(--el-text-color-placeholder);
}

/* ── Slide transition ── */
.spider-log-slide-enter-active,
.spider-log-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.spider-log-slide-enter-from,
.spider-log-slide-leave-to {
  transform: translateX(100%);
}

/* ── 人工节点静态库弹窗 ── */
.spider-human-static-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}
.spider-human-static-dialog {
  width: min(520px, 92vw);
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  overflow: hidden;
}
.spider-human-static-dialog__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px 12px;
  border-bottom: 1px solid var(--el-border-color-light, var(--el-border-color-lighter));
}
.spider-human-static-dialog__head strong {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary, var(--el-text-color-primary));
}
.spider-human-static-dialog__head span {
  font-size: 12px;
  color: var(--el-text-color-secondary, var(--el-text-color-secondary));
  flex: 1;
}
.spider-human-static-dialog__close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-secondary, var(--el-text-color-secondary));
  cursor: pointer;
  font-size: 16px;
  transition: background 0.15s;
}
.spider-human-static-dialog__close:hover {
  background: var(--el-fill-color-light, var(--el-fill-color-light));
}
.spider-human-static-dialog__body {
  padding: 16px 22px;
  display: grid;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
}
.spider-human-static-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid var(--el-border-color-light, var(--el-border-color-lighter));
  background: var(--el-bg-color, var(--el-bg-color));
  cursor: pointer;
  transition: all 0.15s;
}
.spider-human-static-card:hover {
  border-color: var(--el-color-primary, var(--el-text-color-primary));
  background: color-mix(in srgb, var(--el-color-primary, var(--el-text-color-primary)) 4%, var(--el-bg-color, var(--el-bg-color)));
}
.spider-human-static-card.is-selected {
  border-color: var(--el-color-primary, var(--el-text-color-primary));
  background: color-mix(in srgb, var(--el-color-primary, var(--el-text-color-primary)) 8%, var(--el-bg-color, var(--el-bg-color)));
}
.spider-human-static-card__icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-color-primary, var(--el-text-color-primary)) 10%, transparent);
  color: var(--el-color-primary, var(--el-text-color-primary));
  font-size: 18px;
  flex-shrink: 0;
}
.spider-human-static-card__info {
  flex: 1;
  min-width: 0;
}
.spider-human-static-card__info strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, var(--el-text-color-primary));
  margin-bottom: 2px;
}
.spider-human-static-card__info span {
  font-size: 11px;
  color: var(--el-text-color-secondary, var(--el-text-color-secondary));
}
.spider-human-static-card__check {
  color: var(--el-color-primary, var(--el-text-color-primary));
  font-size: 18px;
}
.spider-human-static-dialog__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 22px 18px;
}
.spider-human-static-dialog__btn {
  height: 36px;
  padding: 0 20px;
  border-radius: 10px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.spider-human-static-dialog__btn.is-secondary {
  background: var(--el-fill-color-light, var(--el-fill-color-light));
  color: var(--el-text-color-secondary, var(--el-text-color-secondary));
}
.spider-human-static-dialog__btn.is-primary {
  background: var(--el-color-primary, var(--el-text-color-primary));
  color: var(--el-bg-color);
}
.spider-human-static-dialog__btn.is-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.spider-human-static-dialog__btn.is-primary:not(:disabled):hover {
  opacity: 0.9;
}

</style>
