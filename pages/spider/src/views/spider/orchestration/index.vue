<template>
  <section v-if="!hasRequestedSpider" class="spider-orchestration-empty">
    <div class="spider-orchestration-empty__card">
      <strong>暂无数据</strong>
      <span>请从爬虫管理卡片点击“编排”进入当前爬虫的专属编排页。</span>
    </div>
  </section>

  <template v-else>
    <div :class="{ 'spider-theme': orchestrationTheme === 'spider' }">
      <!-- Shared toolbar for both default and spider themes -->
      <div class="spider-orchestration-toolbar">
      <div class="spider-orchestration-toolbar__actions">
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
        <button
          v-if="!isExecutionActive"
          type="button"
          class="spider-toolbar-btn spider-toolbar-btn--icon spider-toolbar-btn--primary"
          title="运行流程"
          @click="handleRealRun"
        >
          <IconifyIconOnline icon="ri:play-circle-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="AI 生成流程" @click="showAiDialog = true">
          <IconifyIconOnline icon="ri:sparkling-2-line" />
        </button>
        <button type="button" class="spider-toolbar-btn spider-toolbar-btn--icon spider-theme-toggle" :class="{ 'is-active': orchestrationTheme === 'spider' }" title="切换 Spider 主题" @click="orchestrationTheme = orchestrationTheme === 'spider' ? 'default' : 'spider'">
          <IconifyIconOnline icon="ri:pantone-line" />
        </button>
        <button v-if="orchestrationTheme === 'spider'" type="button" class="spider-toolbar-btn spider-toolbar-btn--icon" title="保存编排" @click="handleExternalSave">
          <IconifyIconOnline icon="ri:save-3-line" />
        </button>
      </div>
      <div v-if="statusMessage" class="spider-orchestration-toolbar__status">
        <span>{{ statusMessage }}</span>
      </div>
    </div>

    <div class="spider-orchestration-canvas" :class="{ 'is-spider': orchestrationTheme === 'spider' }">
      <SpiderFlowCanvas
        v-if="orchestrationTheme === 'spider'"
        :nodes="spiderCanvasNodes"
        :edges="spiderCanvasEdges"
        :selected-node-id="selectedNodeId"
        @node-click="onSpiderCanvasNodeClick"
        @pane-click="onSpiderCanvasPaneClick"
      />
      <ScMFlowConfigPanel
        v-if="orchestrationTheme === 'spider'"
        :visible="spiderConfigPanelVisible"
        :node-meta="spiderNodeMeta"
        :node-title="spiderNodeTitle"
        :node-config="spiderNodeConfig"
        :schema="spiderNodeSchema"
        :update-title="spiderUpdateTitle"
        :update-config="spiderUpdateConfig"
        :save-config="spiderSaveConfig"
        :remove-node="spiderRemoveNode"
        @close="closeSpiderConfigPanel"
      >
        <template #config-panel="slotProps">
          <SpiderPageAccessConfigPanel
            v-if="slotProps.nodeMeta?.kind === 'PAGE_ACCESS'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderUrlParseConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'URL_PARSE'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderConditionConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'CONDITION'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderSubFlowConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'SUB_FLOW'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderDownloaderConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'DOWNLOADER'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderDataParseConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'DATA_PARSE'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderRuntimeManualTaskPanel
            v-else-if="slotProps.nodeMeta?.kind === 'HUMAN_INTERVENE' && slotProps.nodeConfig?.derived"
            :task="activeExecution?.spiderManualTasks?.find(item => item.spiderNodeCode === slotProps.nodeConfig?.sourceNodeCode)!"
            :model-value="manualFormValues[slotProps.nodeConfig?.sourceNodeCode] || {}"
            @update-field="(fieldKey, value) => updateManualField(slotProps.nodeConfig?.sourceNodeCode, fieldKey, value)"
            @submit="continueAfter => submitManualTaskForm(activeExecution?.spiderManualTasks?.find(item => item.spiderNodeCode === slotProps.nodeConfig?.sourceNodeCode)!, continueAfter)"
          />
          <SpiderHumanInterveneConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'HUMAN_INTERVENE'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <SpiderSaveResultConfigPanel
            v-else-if="slotProps.nodeMeta?.kind === 'SAVE_RESULT'"
            :node-meta="slotProps.nodeMeta"
            :node-title="slotProps.nodeTitle"
            :node-config="slotProps.nodeConfig"
            :update-title="slotProps.updateTitle"
            :update-config="slotProps.updateConfig"
            :save-config="slotProps.saveConfig"
            :remove-node="slotProps.removeNode"
          />
          <div v-else class="spider-generic-config">
            <label class="spider-generic-config__item">
              <span>节点标题</span>
              <input :value="slotProps.nodeTitle" type="text" @input="slotProps.updateTitle(($event.target as HTMLInputElement).value)" />
            </label>
            <label
              v-for="field in slotProps.schema"
              :key="field.field"
              class="spider-generic-config__item"
            >
              <span>{{ field.label }}</span>
              <input
                v-if="field.component === 'input'"
                :value="String(slotProps.nodeConfig[field.field] ?? '')"
                type="text"
                @input="slotProps.updateConfig(field.field, ($event.target as HTMLInputElement).value)"
              />
              <textarea
                v-else-if="field.component === 'textarea'"
                :value="String(slotProps.nodeConfig[field.field] ?? '')"
                rows="4"
                @input="slotProps.updateConfig(field.field, ($event.target as HTMLTextAreaElement).value)"
              />
              <input
                v-else-if="field.component === 'number'"
                :value="Number(slotProps.nodeConfig[field.field] ?? 0)"
                type="number"
                @input="slotProps.updateConfig(field.field, Number(($event.target as HTMLInputElement).value || 0))"
              />
              <label v-else-if="field.component === 'switch'" class="spider-generic-config__switch">
                <input
                  :checked="Boolean(slotProps.nodeConfig[field.field])"
                  type="checkbox"
                  @change="slotProps.updateConfig(field.field, ($event.target as HTMLInputElement).checked)"
                />
                <em>{{ slotProps.nodeConfig[field.field] ? '开启' : '关闭' }}</em>
              </label>
              <select
                v-else
                :value="String(slotProps.nodeConfig[field.field] ?? '')"
                @change="slotProps.updateConfig(field.field, ($event.target as HTMLSelectElement).value)"
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
              <button type="button" class="is-secondary" @click="slotProps.removeNode">删除节点</button>
              <button type="button" @click="slotProps.saveConfig">保存配置</button>
            </div>
          </div>
        </template>
      </ScMFlowConfigPanel>
      <ScMFlowEditor
        v-else
        :model-value="editorFlow"
        :flow-entries="flowEntries"
        :palette="editorPalette"
        :hidden-palette-kinds="['START', 'HUMAN_INTERVENE']"
        :status-message="statusMessage"
        :entity-id="activeSpiderId"
        :entity-code="currentSpiderCode"
        palette-display-mode="icon"
        :load-flow="handleLoadFlow"
        :save-flow="handleSaveFlow"
        :validate-before-save="validateBeforeSave"
        @update:model-value="handleEditorFlowChange"
        @export="handleExport"
      >

      <template #node="slotProps">
        <SpiderNode
          :id="slotProps.id"
          :data="{
            ...slotProps.data,
            runtimeStatus: effectiveNodeRuntimeMap[slotProps.id]?.status || '',
          }"
          :selected="Boolean(slotProps.selected)"
          :readonly="false"
        />
      </template>

      <template #config-panel="slotProps">
        <SpiderPageAccessConfigPanel
          v-if="slotProps.nodeMeta?.kind === 'PAGE_ACCESS'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderUrlParseConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'URL_PARSE'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderConditionConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'CONDITION'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderSubFlowConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'SUB_FLOW'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderDownloaderConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'DOWNLOADER'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderDataParseConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'DATA_PARSE'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderRuntimeManualTaskPanel
          v-else-if="slotProps.nodeMeta?.kind === 'HUMAN_INTERVENE' && slotProps.nodeConfig?.derived"
          :task="activeExecution?.spiderManualTasks?.find(item => item.spiderNodeCode === slotProps.nodeConfig?.sourceNodeCode)!"
          :model-value="manualFormValues[slotProps.nodeConfig?.sourceNodeCode] || {}"
          @update-field="(fieldKey, value) => updateManualField(slotProps.nodeConfig?.sourceNodeCode, fieldKey, value)"
          @submit="continueAfter => submitManualTaskForm(activeExecution?.spiderManualTasks?.find(item => item.spiderNodeCode === slotProps.nodeConfig?.sourceNodeCode)!, continueAfter)"
        />
        <SpiderHumanInterveneConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'HUMAN_INTERVENE'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <SpiderSaveResultConfigPanel
          v-else-if="slotProps.nodeMeta?.kind === 'SAVE_RESULT'"
          :node-meta="slotProps.nodeMeta"
          :node-title="slotProps.nodeTitle"
          :node-config="slotProps.nodeConfig"
          :update-title="slotProps.updateTitle"
          :update-config="slotProps.updateConfig"
          :save-config="slotProps.saveConfig"
          :remove-node="slotProps.removeNode"
        />
        <div v-else class="spider-generic-config">
          <label class="spider-generic-config__item">
            <span>节点标题</span>
            <input :value="slotProps.nodeTitle" type="text" @input="slotProps.updateTitle(($event.target as HTMLInputElement).value)" />
          </label>
          <label
            v-for="field in slotProps.schema"
            :key="field.field"
            class="spider-generic-config__item"
          >
            <span>{{ field.label }}</span>
            <input
              v-if="field.component === 'input'"
              :value="String(slotProps.nodeConfig[field.field] ?? '')"
              type="text"
              @input="slotProps.updateConfig(field.field, ($event.target as HTMLInputElement).value)"
            />
            <textarea
              v-else-if="field.component === 'textarea'"
              :value="String(slotProps.nodeConfig[field.field] ?? '')"
              rows="4"
              @input="slotProps.updateConfig(field.field, ($event.target as HTMLTextAreaElement).value)"
            />
            <input
              v-else-if="field.component === 'number'"
              :value="Number(slotProps.nodeConfig[field.field] ?? 0)"
              type="number"
              @input="slotProps.updateConfig(field.field, Number(($event.target as HTMLInputElement).value || 0))"
            />
            <label v-else-if="field.component === 'switch'" class="spider-generic-config__switch">
              <input
                :checked="Boolean(slotProps.nodeConfig[field.field])"
                type="checkbox"
                @change="slotProps.updateConfig(field.field, ($event.target as HTMLInputElement).checked)"
              />
              <em>{{ slotProps.nodeConfig[field.field] ? '开启' : '关闭' }}</em>
            </label>
            <select
              v-else
              :value="String(slotProps.nodeConfig[field.field] ?? '')"
              @change="slotProps.updateConfig(field.field, ($event.target as HTMLSelectElement).value)"
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
            <button type="button" class="is-secondary" @click="slotProps.removeNode">删除节点</button>
            <button type="button" @click="slotProps.saveConfig">保存配置</button>
          </div>
        </div>
      </template>
    </ScMFlowEditor>
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

    <!-- AI 生成流程对话框 -->
    <section v-if="showAiDialog" class="spider-ai-dialog-overlay" @click.self="showAiDialog = false">
      <div class="spider-ai-dialog">
        <header class="spider-ai-dialog__head">
          <strong>AI 生成流程</strong>
          <button type="button" class="spider-ai-dialog__close" @click="showAiDialog = false">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </header>
        <div class="spider-ai-dialog__body">
          <p class="spider-ai-dialog__desc">
            AI 将分析目标网站 URL 和您的需求，自动生成完整的爬虫编排流程（节点、配置、连线）。
          </p>
          <div class="spider-ai-dialog__field">
            <label>目标网站 URL</label>
            <input
              v-model="aiEntryUrl"
              type="text"
              placeholder="https://example.com"
              :disabled="aiGenerating"
            />
          </div>
          <div class="spider-ai-dialog__field">
            <label>需求描述（可选）</label>
            <textarea
              v-model="aiUserGoal"
              rows="4"
              placeholder="例如：采集全站所有文章的标题、发布时间和正文内容"
              :disabled="aiGenerating"
            />
          </div>
          <div v-if="aiGenerating" class="spider-ai-dialog__loading">
            <span>AI 正在分析网站并生成流程...</span>
          </div>
        </div>
        <footer class="spider-ai-dialog__foot">
          <button type="button" class="is-secondary" :disabled="aiGenerating" @click="showAiDialog = false">
            取消
          </button>
          <button type="button" class="is-primary" :disabled="aiGenerating || !aiEntryUrl.trim()" @click="handleAiGenerate">
            {{ aiGenerating ? '生成中...' : '开始生成' }}
          </button>
        </footer>
      </div>
    </section>
  </div>
  </template>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElNotification } from "element-plus";
import * as CoreSocket from "@repo/core";
import { ScMFlowEditor, ScMFlowConfigPanel } from "@repo/components/ScMFlowEditor";
import type { ScMFlowEntry, ScMFlowPaletteItem, ScMFlowSchema } from "@repo/components/ScMFlowEditor";
import SpiderNode from "@repo/components/ScFlowEditor/components/SpiderNode.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import {
  agentBrowserSmokeTaskFlow,
  baiduPanExampleFlow,
  giteeExploreExampleFlow,
  giteeMineExampleFlow,
  spiderNodePalette,
} from "../../../index";
import {
  aiGenerateFlow,
  getSpiderExecutionDetail,
  getSpiderExecutionEvents,
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
import SpiderFlowCanvas from "./components/SpiderFlowCanvasG6.vue";
import "./theme/spider-theme.css";

const localFlowFallbackMap: Record<string, SpiderFlowSchema> = {
  "agent-browser-smoke-task": agentBrowserSmokeTaskFlow,
  "baidu-pan-all-files": baiduPanExampleFlow,
  "gitee-explore-1000-projects": giteeExploreExampleFlow,
  "gitee-my-projects": giteeMineExampleFlow,
};

const activeSpiderId = ref<number | null>(null);
const currentSpiderCode = ref("");
const currentSpiderDefinition = ref<SpiderDefinition | null>(null);
const statusMessage = ref("");
const flowEntries = ref<ScMFlowEntry[]>([]);
const hasRequestedSpider = ref(false);
const activeExecution = ref<SpiderExecutionDetailView | null>(null);
const activeEvents = ref<SpiderExecutionEventView[]>([]);
const executionPolling = ref<ReturnType<typeof setInterval> | null>(null);
const executionEventSource = ref<EventSource | null>(null);
const socketServiceRef = ref<any>(null);
const socketEventName = "spider:execution:event";
const manualFormValues = ref<Record<string, Record<string, string>>>({});

const orchestrationTheme = ref<"default" | "spider">("default");
const selectedNodeId = ref<string | null>(null);

// 人工干预通知（避免重复提醒）
let lastManualTaskCount = 0;

// AI 生成流程对话框
const showAiDialog = ref(false);
const aiEntryUrl = ref("");
const aiUserGoal = ref("");
const aiGenerating = ref(false);

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
  nodes: [],
  edges: [],
});

const editorTypeMap: Record<SpiderNodeType, ScMFlowPaletteItem["editorType"]> = {
  START: "input",
  PAGE_ACCESS: "process",
  URL_PARSE: "process",
  DATA_PARSE: "process",
  DOWNLOADER: "process",
  SUB_FLOW: "process",
  HUMAN_INTERVENE: "delay",
  CONDITION: "condition",
  SAVE_RESULT: "process",
  END: "output",
};

const editorShapeMap: Partial<Record<SpiderNodeType, ScMFlowPaletteItem["shape"]>> = {
  START: "circle",
  END: "circle",
  HUMAN_INTERVENE: "pulse",
  CONDITION: "diamond",
  PAGE_ACCESS: "icon-box",
  URL_PARSE: "icon-box",
  DATA_PARSE: "icon-box",
  DOWNLOADER: "icon-box",
  SUB_FLOW: "icon-box",
  SAVE_RESULT: "icon-box",
};

const editorPalette = computed<ScMFlowPaletteItem[]>(() =>
  spiderNodePalette.map(item => ({
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

const editorFlow = computed<ScMFlowSchema>(() => ({
  flowCode: workingFlow.value.spiderDefinitionCode,
  flowVersion: workingFlow.value.spiderFlowVersion,
  flowName: workingFlow.value.spiderFlowName,
  flowScope: workingFlow.value.spiderFlowScope,
  nodes: buildRuntimeNodes(),
  edges: buildRuntimeEdges(replayStep.value >= 0 ? replayNodeStatus.value : undefined),
}));

const spiderCanvasNodes = computed(() => {
  const baseNodes = workingFlow.value.nodes.map(item => ({
    id: item.id,
    type: item.type,
    label: item.title,
    icon: item.icon,
    typeLabel: item.type,
    position: item.position,
    runtimeStatus: effectiveNodeRuntimeMap.value[item.id]?.status || "",
  }));
  const steps = activeExecution.value?.spiderSteps || [];
  const derivedSteps = steps.filter(item => item.spiderIsDerivedNode === 1);
  const nodeMap = new Map(baseNodes.map(item => [item.id, item]));
  for (const step of derivedSteps) {
    if (nodeMap.has(step.spiderNodeCode)) continue;
    const sourcePos = baseNodes.find(n => n.id === step.spiderSourceNodeCode)?.position || null;
    nodeMap.set(step.spiderNodeCode, {
      id: step.spiderNodeCode,
      type: "HUMAN_INTERVENE",
      label: step.spiderNodeName || "人工派生节点",
      icon: "ri:user-heart-line",
      typeLabel: "人工处理",
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
    if (edgeKey && traversedEdgeMap[edgeKey]) {
      return { visited: traversedEdgeMap[edgeKey].spiderVisited === 1, runtimeStatus: traversedEdgeMap[edgeKey].spiderRuntimeStatus || "" };
    }
    const targetStep = stepMap[targetId];
    const visited = Boolean(targetStep?.spiderStartedAt || targetStep?.spiderFinishedAt || targetStep?.spiderStepStatus === "WAIT_MANUAL" || targetStep?.spiderStepStatus === "SUCCESS" || targetStep?.spiderStepStatus === "FAILED");
    return { visited, runtimeStatus: targetStep?.spiderStepStatus || stepMap[sourceId]?.spiderStepStatus || "" };
  };
  const edges = workingFlow.value.edges.map(item => ({
    id: item.id,
    source: item.source,
    target: item.target,
    ...getRuntime(item.source, item.target),
  }));
  const edgeIds = new Set(edges.map(item => item.id));
  for (const step of steps) {
    if (step.spiderIsDerivedNode !== 1 || !step.spiderSourceNodeCode) continue;
    if (step.spiderSourceNodeCode === step.spiderNodeCode) continue;
    const edgeId = `derived-${step.spiderSourceNodeCode}-${step.spiderNodeCode}`;
    if (edgeIds.has(edgeId)) continue;
    edges.push({
      id: edgeId,
      source: step.spiderSourceNodeCode,
      target: step.spiderNodeCode,
      ...getRuntime(step.spiderSourceNodeCode, step.spiderNodeCode),
    });
    edgeIds.add(edgeId);
    for (const originalEdge of workingFlow.value.edges.filter(e => e.source === step.spiderSourceNodeCode)) {
      if (originalEdge.target === step.spiderNodeCode) continue;
      const continueEdgeId = `derived-continue-${step.spiderNodeCode}-${originalEdge.target}`;
      if (edgeIds.has(continueEdgeId)) continue;
      edges.push({
        id: continueEdgeId,
        source: step.spiderNodeCode,
        target: originalEdge.target,
        ...getRuntime(step.spiderNodeCode, originalEdge.target),
      });
      edgeIds.add(continueEdgeId);
    }
  }
  return edges;
});


function onSpiderCanvasNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId;
  openSpiderConfigPanel(nodeId);
}

function onSpiderCanvasPaneClick() {
  selectedNodeId.value = null;
  closeSpiderConfigPanel();
}

// ── Spider theme config panel ──
const spiderConfigPanelVisible = ref(false);
const spiderNodeMeta = ref<ScMFlowNodeMeta | null>(null);
const spiderNodeTitle = ref("");
const spiderNodeConfig = ref<Record<string, any>>({});

const spiderNodeSchema = computed(() => {
  const meta = spiderNodeMeta.value;
  return meta ? (editorPalette.value.find(p => p.kind === meta.kind)?.schema || []) : [];
});

function openSpiderConfigPanel(nodeId: string) {
  const flowNode = workingFlow.value.nodes.find(n => n.id === nodeId);
  if (!flowNode) return;
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
  spiderConfigPanelVisible.value = true;
}

function closeSpiderConfigPanel() {
  spiderConfigPanelVisible.value = false;
  spiderNodeMeta.value = null;
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
  handleSaveFlow(editorFlow.value).catch(() => {});
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

const nodeRuntimeMap = computed<Record<string, { status: string }>>(() => {
  const map: Record<string, { status: string }> = {};
  for (const step of activeExecution.value?.spiderSteps || []) {
    map[step.spiderNodeCode] = { status: step.spiderStepStatus };
  }
  return map;
});

const isExecutionActive = computed(() =>
  ["RUNNING", "WAIT_MANUAL"].includes(activeExecution.value?.spiderExecutionStatus || ""),
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
  const map: Record<string, { status: string }> = {};
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
    const runtimeStatus = targetStep?.spiderStepStatus || sourceStep?.spiderStepStatus || "";
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
  for (const step of activeExecution.value?.spiderSteps || []) {
    if (step.spiderIsDerivedNode !== 1 || !step.spiderSourceNodeCode) {
      continue;
    }
    // Skip self-referencing derived steps (source === node)
    if (step.spiderSourceNodeCode === step.spiderNodeCode) {
      continue;
    }
    const edgeId = `derived-${step.spiderSourceNodeCode}-${step.spiderNodeCode}`;
    if (edgeIds.has(edgeId)) {
      continue;
    }
    edges.push({
      id: edgeId,
      source: step.spiderSourceNodeCode,
      target: step.spiderNodeCode,
      label: "人工派生",
      sourceOutput: "output",
      targetInput: "input",
      ...resolveEdgeRuntime(step.spiderSourceNodeCode, step.spiderNodeCode),
    });
    edgeIds.add(edgeId);

    for (const originalEdge of workingFlow.value.edges.filter(item => item.source === step.spiderSourceNodeCode)) {
      // Prevent self-loop: don't create continuation edge back to the derived node itself
      if (originalEdge.target === step.spiderNodeCode) {
        continue;
      }
      // Prevent chaining through other derived nodes
      if (String(originalEdge.target).includes("#derived")) {
        continue;
      }
      const continueEdgeId = `derived-continue-${step.spiderNodeCode}-${originalEdge.target}`;
      if (edgeIds.has(continueEdgeId)) {
        continue;
      }
      edges.push({
        id: continueEdgeId,
        source: step.spiderNodeCode,
        target: originalEdge.target,
        label: originalEdge.label || "人工完成后继续",
        sourceOutput: "output",
        targetInput: mapPortId(originalEdge.targetInput, "input"),
        ...resolveEdgeRuntime(step.spiderNodeCode, originalEdge.target),
      });
      edgeIds.add(continueEdgeId);
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

// AI 对话框打开时自动填入入口 URL
watch(showAiDialog, (open) => {
  if (open && currentSpiderDefinition.value?.spiderEntryUrl) {
    aiEntryUrl.value = currentSpiderDefinition.value.spiderEntryUrl;
  }
});

// 监听人工任务数量变化（新增任务时提醒）
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
    }
    lastManualTaskCount = count;
  },
);

function inferDefaultValue(nodeType: SpiderNodeType, field: string, component: ScMFlowPaletteItem["schema"][number]["component"]) {
  if (component === "switch") {
    if (field === "dedupBeforeQueue") return true;
    return false;
  }
  if (component === "number") {
    if (field === "timeoutSeconds") return 30;
    if (field === "collectLimit") return 1000;
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
      return base;
    }),
  };
}

function toSpiderSchema(flow: ScMFlowSchema): SpiderFlowSchema {
  return applyDefinitionAiDefaults({
    spiderDefinitionCode: flow.flowCode,
    spiderFlowVersion: flow.flowVersion,
    spiderFlowName: flow.flowName,
    spiderFlowScope: (flow.flowScope || "PRIVATE") as "PRIVATE",
    nodes: flow.nodes
      .filter(item => !Boolean((item.config as any)?.derived))
      .map(item => ({
        id: item.id,
        type: item.kind as SpiderNodeType,
        title: item.title,
        position: item.position,
        config: item.config,
        icon: item.icon,
        image: item.image,
      })),
    edges: flow.edges
      .filter(item => !String(item.id || "").startsWith("derived-"))
      .map(item => ({
        id: item.id,
        source: item.source,
        target: item.target,
        label: item.label,
        sourceOutput: mapPortId(item.sourceOutput),
        targetInput: mapPortId(item.targetInput, "input"),
      })),
  }, currentSpiderDefinition.value);
}

function handleEditorFlowChange(flow: ScMFlowSchema) {
  workingFlow.value = applyDefinitionAiDefaults(toSpiderSchema(flow), currentSpiderDefinition.value);
}

async function loadSchema(spiderDefinitionCode: string) {
  try {
    const schema = await getSpiderOrchestrationSchema(spiderDefinitionCode, 1);
    workingFlow.value = applyDefinitionAiDefaults(schema, currentSpiderDefinition.value);
    currentSpiderCode.value = spiderDefinitionCode;
    statusMessage.value = "";
  } catch (error) {
    const fallback = localFlowFallbackMap[spiderDefinitionCode];
    if (fallback) {
      workingFlow.value = applyDefinitionAiDefaults(fallback, currentSpiderDefinition.value);
      currentSpiderCode.value = spiderDefinitionCode;
      statusMessage.value = `编排接口失败，已回退默认规则：${String(error)}`;
      return;
    }
    throw error;
  }
}

function handleExport(flow: ScMFlowSchema) {
  console.log("spider-editor-data", flow);
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
  const detail = await previewSpiderExecution({
    spiderDefinitionCode: workingFlow.value.spiderDefinitionCode,
    spiderFlowVersion: workingFlow.value.spiderFlowVersion,
    spiderTriggerType: "PREVIEW",
  });
  activeExecution.value = detail;
  manualFormValues.value = {};
  await pollExecution(detail.spiderExecutionNo);
  statusMessage.value = `预览状态：${detail.spiderExecutionStatus}`;
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
  const detail = await runSpiderExecution({
    spiderDefinitionCode: workingFlow.value.spiderDefinitionCode,
    spiderFlowVersion: workingFlow.value.spiderFlowVersion,
    spiderTriggerType: "MANUAL",
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
}

async function handleStopRun() {
  if (!activeExecution.value?.spiderExecutionNo) return;
  const detail = await stopSpiderExecution(activeExecution.value.spiderExecutionNo);
  activeExecution.value = detail;
  await pollExecution(detail.spiderExecutionNo);
  statusMessage.value = `执行状态：${detail.spiderExecutionStatus}`;
}

async function handleAiGenerate() {
  const url = aiEntryUrl.value.trim();
  if (!url) return;
  aiGenerating.value = true;
  statusMessage.value = "AI 正在分析网站并生成流程...";
  try {
    const schema = await aiGenerateFlow({
      spiderDefinitionCode: currentSpiderCode.value,
      entryUrl: url,
      userGoal: aiUserGoal.value.trim(),
      spiderFlowName: undefined,
    });
    workingFlow.value = applyDefinitionAiDefaults(schema, currentSpiderDefinition.value);
    showAiDialog.value = false;
    statusMessage.value = "AI 流程生成成功！请检查节点配置后保存。";
  } catch (error: any) {
    statusMessage.value = `AI 生成失败：${error?.message || String(error)}`;
  } finally {
    aiGenerating.value = false;
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

async function handleLoadFlow(flowCode: string) {
  await loadSchema(flowCode);
  return editorFlow.value;
}

async function handleSaveFlow(flow: ScMFlowSchema) {
  statusMessage.value = "保存中...";
  const saved = await saveSpiderOrchestrationSchema(toSpiderSchema(flow));
  workingFlow.value = saved;
  statusMessage.value = "已保存";
  return {
    flowCode: saved.spiderDefinitionCode,
    flowVersion: saved.spiderFlowVersion,
    flowName: saved.spiderFlowName,
    flowScope: saved.spiderFlowScope,
    nodes: saved.nodes.map(item => ({
      id: item.id,
      kind: item.type,
      title: item.title,
      position: item.position,
      config: item.config,
      icon: item.icon,
      image: item.image,
    })),
    edges: saved.edges.map(item => ({
      id: item.id,
      source: item.source,
      target: item.target,
      label: item.label,
      sourceOutput: item.sourceOutput,
      targetInput: item.targetInput,
    })),
  };
}

async function handleExternalSave() {
  const flow = editorFlow.value;
  const validationError = validateBeforeSave(flow);
  if (validationError) {
    statusMessage.value = validationError;
    return;
  }
  await handleSaveFlow(flow);
}

function validateBeforeSave(flow: ScMFlowSchema) {
  const startIds = flow.nodes.filter(item => item.kind === "START").map(item => item.id);
  const endIds = new Set(flow.nodes.filter(item => item.kind === "END").map(item => item.id));
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

const fallbackEntries = (): ScMFlowEntry[] =>
  Object.entries(localFlowFallbackMap).map(([code, flow]) => ({
    flowCode: code,
    flowName: flow.spiderFlowName,
  }));

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
    currentSpiderDefinition.value = preferredCode
      ? null
      : null;
    flowEntries.value = fallbackEntries();
    const fallbackCode = preferredCode && localFlowFallbackMap[preferredCode]
      ? preferredCode
      : flowEntries.value[0]?.flowCode;
    if (fallbackCode) {
      await loadSchema(fallbackCode);
    }
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
});

onBeforeUnmount(() => {
  stopExecutionPolling();
  stopExecutionEventSource();
  teardownSocketListener();
  stopReplayTimer();
});
</script>

<style scoped lang="scss">
.spider-orchestration-empty {
  min-height: calc(100vh - 36px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lay-bg);
  padding: 24px;
}

.spider-orchestration-empty__card {
  width: min(520px, 100%);
  display: grid;
  gap: 10px;
  padding: 28px 32px;
  border: 1px solid var(--lay-border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--lay-surface-bg) 92%, transparent);
  text-align: center;
}

.spider-orchestration-empty__card strong {
  color: var(--lay-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.spider-orchestration-empty__card span {
  color: var(--lay-text-secondary);
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
  color: var(--lay-text-secondary);
  font-size: 12px;
}

.spider-generic-config__item input,
.spider-generic-config__item textarea,
.spider-generic-config__item select {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 94%, transparent);
  color: var(--lay-text-primary);
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
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  color: var(--lay-text-primary);
  cursor: pointer;
}

.spider-generic-config__actions button.is-secondary {
  color: var(--lay-text-secondary);
}

.spider-orchestration-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 12px;
}

.spider-orchestration-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spider-orchestration-toolbar__status {
  font-size: 13px;
  color: var(--spider-text-secondary, #6b7280);
  white-space: nowrap;
}

.spider-orchestration-canvas {
  width: 100%;
  height: calc(100vh - var(--spider-toolbar-height, 160px));
  min-height: 500px;
}

.spider-orchestration-canvas.is-spider {
  position: relative;
  height: calc(100vh - var(--spider-toolbar-height, 160px));
}

.spider-toolbar-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  color: var(--lay-text-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.spider-toolbar-btn--primary {
  border-color: color-mix(in srgb, var(--lay-accent) 24%, var(--lay-border));
  background: color-mix(in srgb, var(--lay-accent) 12%, transparent);
}

.spider-toolbar-btn--icon {
  width: 34px;
  padding: 0;
}

.spider-toolbar-btn--danger {
  border-color: color-mix(in srgb, #ef4444 24%, var(--lay-border));
  background: color-mix(in srgb, #ef4444 10%, transparent);
  color: #b91c1c;
}

.spider-manual-task-board {
  display: grid;
  gap: 12px;
  padding: 0 24px 24px;
  background: var(--lay-bg);
}

.spider-manual-task-board__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-manual-task-board__head strong {
  color: var(--lay-text-primary);
  font-size: 16px;
}

.spider-manual-task-board__head span {
  color: var(--lay-text-placeholder);
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
  border: 1px solid color-mix(in srgb, #eab308 20%, var(--lay-border));
  border-radius: 16px;
  background: color-mix(in srgb, #facc15 8%, var(--lay-surface-bg));
}

.spider-manual-task-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spider-manual-task-card__meta strong {
  color: var(--lay-text-primary);
}

.spider-manual-task-card__meta span {
  font-size: 12px;
  color: #a16207;
}

.spider-manual-task-card > p {
  margin: 0;
  color: var(--lay-text-secondary);
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
  color: var(--lay-text-secondary);
  white-space: nowrap;
}

.spider-manual-task-card__field input {
  width: 100%;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 94%, transparent);
  color: var(--lay-text-primary);
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
  background: var(--lay-bg);
  border-top: 1px solid var(--lay-border);
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
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
  color: var(--lay-text-primary);
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.spider-replay-bar__step {
  color: var(--lay-text-secondary);
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
  background: var(--lay-bg-primary, #fff);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.spider-ai-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--lay-border-color, #e5e7eb);
}

.spider-ai-dialog__head strong {
  font-size: 16px;
  color: var(--lay-text-primary, #1f2937);
}

.spider-ai-dialog__close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--lay-text-secondary, #6b7280);
  cursor: pointer;
  padding: 4px;
}

.spider-ai-dialog__close:hover {
  color: var(--lay-text-primary, #1f2937);
}

.spider-ai-dialog__body {
  padding: 20px;
}

.spider-ai-dialog__desc {
  font-size: 13px;
  color: var(--lay-text-secondary, #6b7280);
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
  color: var(--lay-text-primary, #1f2937);
}

.spider-ai-dialog__field input,
.spider-ai-dialog__field textarea {
  padding: 8px 12px;
  border: 1px solid var(--lay-border-color, #d1d5db);
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  background: var(--lay-bg-secondary, #f9fafb);
  color: var(--lay-text-primary, #1f2937);
  outline: none;
  transition: border-color 0.2s;
}

.spider-ai-dialog__field input:focus,
.spider-ai-dialog__field textarea:focus {
  border-color: var(--lay-color-primary, #6366f1);
  background: var(--lay-bg-primary, #fff);
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
  color: var(--lay-color-primary, #6366f1);
  font-size: 14px;
}

.spider-ai-dialog__loading::before {
  content: "";
  width: 18px;
  height: 18px;
  border: 2px solid var(--lay-color-primary, #6366f1);
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
  border-top: 1px solid var(--lay-border-color, #e5e7eb);
}

.spider-ai-dialog__foot button {
  padding: 7px 18px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid var(--lay-border-color, #d1d5db);
  background: var(--lay-bg-primary, #fff);
  color: var(--lay-text-primary, #1f2937);
  transition: all 0.2s;
}

.spider-ai-dialog__foot button.is-primary {
  background: var(--lay-color-primary, #6366f1);
  color: #fff;
  border-color: var(--lay-color-primary, #6366f1);
}

.spider-ai-dialog__foot button.is-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.spider-ai-dialog__foot button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spider-toolbar-btn.spider-theme-toggle {
  font-size: 16px;
}
.spider-toolbar-btn.spider-theme-toggle.is-active {
  border-color: var(--spider-color-running, #3b82f6);
  background: color-mix(in srgb, var(--spider-color-running, #3b82f6) 12%, transparent);
  color: var(--spider-color-running, #3b82f6);
}

</style>
