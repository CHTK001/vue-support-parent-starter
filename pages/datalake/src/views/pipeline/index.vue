<template>
  <div class="pipeline-graph-page" :style="{ minHeight: '100%', height: '100%' }">
    <!-- 顶部工具栏 -->
    <div class="graph-toolbar">
      <div class="toolbar-left">
        <button class="btn-primary" @click="handleCreate">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          创建 Pipeline
        </button>
        <input v-model="searchText" placeholder="搜索 Pipeline..." class="form-input" style="width:200px" />
      </div>
      <div class="toolbar-right">
        <span class="panel-badge">总计 <b>{{ filteredList.length }}</b> 个 Pipeline</span>
        <button class="btn-ghost" :class="{ loading }" :disabled="loading" @click="loadData">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>
    </div>

    <!-- 主体：左侧列表 + 右侧编辑器 -->
    <div class="graph-layout">
      <!-- 左侧 Pipeline 列表 -->
      <div class="pipeline-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">流水线列表</span>
          <div class="stats-dots">
            <span class="dot running" title="运行中" />
            <span class="dot stopped" title="已停止" />
          </div>
        </div>
        <div class="sidebar-list">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="pipeline-item"
            :class="{ active: selectedId === item.id }"
            @click="selectPipeline(item)"
          >
            <div class="item-indicator" :class="getLifecycle(item.id).toLowerCase()" />
            <div class="item-info">
              <div class="item-name">{{ item.name || item.id }}</div>
              <div class="item-meta">
                <span>{{ item.nodes?.length || 0 }} 节点</span>
                <span class="dot-sep">·</span>
                <span :class="'status-' + getLifecycle(item.id).toLowerCase()">
                  {{ lifecycleText(item.id) }}
                </span>
              </div>
            </div>
            <div class="item-actions" @click.stop>
              <button
                class="btn-icon"
                :class="getLifecycle(item.id) === 'RUNNING' ? 'btn-warning-icon' : 'btn-success-icon'"
                :title="getLifecycle(item.id) === 'RUNNING' ? '停用' : '启动'"
                @click="handleLifecycle(item.id, getLifecycle(item.id) === 'RUNNING' ? 'stop' : 'start')"
              >
                <svg v-if="getLifecycle(item.id) === 'RUNNING'" viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="none">
                  <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                </svg>
                <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <button class="btn-icon btn-danger-icon" title="删除" @click="handleDeleteClick(item.id)">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
          <div v-if="!filteredList.length" class="sidebar-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.2">
              <circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="19" r="2.5" /><circle cx="19" cy="19" r="2.5" />
              <line x1="12" y1="7.5" x2="5" y2="16.5" /><line x1="12" y1="7.5" x2="19" y2="16.5" /><line x1="7.5" y1="19" x2="16.5" y2="19" />
            </svg>
            <p>暂无 Pipeline</p>
          </div>
        </div>
      </div>

      <!-- 右侧编辑器区域 -->
      <div class="graph-main" style="min-height: 0;">
        <div v-if="!selectedPipeline" class="graph-placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="opacity:0.3">
            <circle cx="12" cy="5" r="2.5" />
            <circle cx="5" cy="19" r="2.5" />
            <circle cx="19" cy="19" r="2.5" />
            <line x1="12" y1="7.5" x2="5" y2="16.5" />
            <line x1="12" y1="7.5" x2="19" y2="16.5" />
            <line x1="7.5" y1="19" x2="16.5" y2="19" />
          </svg>
          <p>请从左侧选择 Pipeline 查看节点流向图</p>
        </div>

        <div v-else class="graph-container">
          <!-- 信息头 -->
          <div class="graph-info-bar">
            <div class="info-left">
              <span class="info-name">{{ selectedPipeline.name || selectedPipeline.id }}</span>
              <span class="panel-badge">v{{ selectedPipeline.version }}</span>
              <span class="state-tag" :class="lifecycleTagType(selectedPipeline.id)">
                {{ lifecycleText(selectedPipeline.id) }}
              </span>
            </div>
            <div class="info-right">
              <span v-if="!isEditing" class="info-desc">{{ selectedPipeline.description || '暂无描述' }}</span>
              <button v-if="!isEditing" class="btn-ghost" @click="openTestDialog">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                测试管线
              </button>
              <button v-if="!isEditing" class="btn-primary" @click="enterEditMode">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                编辑流程
              </button>
              <template v-if="isEditing">
                <span class="edit-hint">编辑模式下拖拽节点、连线调整流程</span>
                <button class="btn-primary" :disabled="saving" @click="saveFlow">
                  {{ saving ? '保存中...' : '保存流程' }}
                </button>
                <button class="btn-ghost" @click="cancelEdit">取消</button>
              </template>
            </div>
          </div>

          <!-- FlowEditor + 配置面板（通过 slot 内嵌） -->
          <div class="graph-wrapper">
            <ScFlowEditor
              :mode="isEditing ? 'edit' : 'preview'"
              :nodes="editorNodes"
              :edges="editorEdges"
              :palette="palette"
              :selected-node-id="selectedNodeId"
              @node-click="onNodeClick"
              @pane-click="onPaneClick"
              @node-drop="onNodeDrop"
              @node-remove="onNodeRemove"
              @edge-remove="onEdgeRemove"
              @edge-create="onEdgeCreate"
              @node-moved="onNodeMoved"
              @apply-layout="onApplyLayout"
            >
              <template #property-panel="{ node, close }">
                <div class="graph-config-panel">
                  <div class="config-panel-header">
                    <span class="config-panel-title">节点配置</span>
                    <el-button size="small" text @click="closeNodeConfig(close)">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </el-button>
                  </div>

                  <div class="config-panel-body">
                    <!-- 节点基本信息 -->
                    <div class="config-section">
                      <div class="config-section-title">基本信息</div>
                      <div class="config-field">
                        <label>节点类型</label>
                        <span class="node-type-badge" :style="{ background: getNodeColor(node.type!) + '22', color: getNodeColor(node.type!), border: '1px solid ' + getNodeColor(node.type!) + '44' }">
                          {{ node.label || node.type }}
                        </span>
                      </div>
                      <div class="config-field">
                        <label>节点 ID</label>
                        <el-input size="small" :model-value="node.id" disabled />
                      </div>
                    </div>

                    <!-- SPI 选择 -->
                    <div v-if="node.kind !== 'sink'" class="config-section">
                      <div class="config-section-title">SPI 实现</div>
                      <div class="config-field">
                        <label>选择实现</label>
                        <el-select
                          v-model="selectedNodeSpi"
                          size="small"
                          placeholder="选择 SPI 实现"
                          style="width: 100%"
                          :disabled="!isEditing"
                          popper-class="pipeline-spi-popper"
                          @change="onSpiChange"
                          @visible-change="onSpiSelectVisibleChange"
                        >
                          <el-option
                            v-for="spi in currentSpis"
                            :key="spi.name"
                            :label="spi.label || spi.name"
                            :value="spi.name"
                          >
                            <div class="spi-option">
                              <div class="spi-option__name">{{ spi.label || spi.name }}</div>
                              <div v-if="spi.describe || spi.detail" class="spi-option__desc">{{ spi.detail || spi.describe }}</div>
                            </div>
                          </el-option>
                          <el-option label="（默认）" value="" />
                        </el-select>
                      </div>
                    </div>

                    <div v-if="node.kind !== 'sink' && node.kind !== 'table-structure'" class="config-section">
                      <div class="config-section-title">
                        {{ node.kind === 'parse' ? '解析映射' : '配置参数' }}
                        <el-button v-if="isEditing" size="small" text @click="addConfigEntry">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </el-button>
                      </div>
                      <div v-if="selectedNode?.kind === 'parse' && configEntries.length === 0" class="config-empty">暂无解析映射</div>
                      <div v-else-if="configEntries.length === 0" class="config-empty">暂无配置</div>
                      <div v-for="(entry, idx) in configEntries" :key="idx" class="config-kv-row">
                        <el-input v-model="entry.key" size="small" :placeholder="node.kind === 'parse' ? '字段名' : '参数名'" :disabled="!isEditing" />
                        <el-input v-model="entry.value" size="small" type="textarea" :rows="entry.value.includes('\n') ? 4 : 1" :placeholder="node.kind === 'parse' ? '类 / 类型' : '值'" :disabled="!isEditing" />
                        <el-button v-if="isEditing" size="small" text @click="removeConfigEntry(idx)">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </el-button>
                      </div>
                    </div>

                    <!-- 脚本编辑器（script 节点专属） -->
                    <div v-if="node.kind === 'script'" class="config-section">
                      <div class="config-section-title">脚本代码</div>
                      <div class="config-field">
                        <label>语言</label>
                        <el-select v-model="scriptLanguage" size="small" style="width: 100%" :disabled="!isEditing">
                          <el-option label="JavaScript (JS)" value="js" />
                          <el-option label="Groovy" value="groovy" />
                          <el-option label="Java" value="java" />
                        </el-select>
                      </div>
                      <div class="config-field">
                        <label>脚本内容</label>
                        <el-input
                          v-model="scriptContent"
                          type="textarea"
                          :rows="10"
                          placeholder="// 使用 envelope 对象操作数据&#10;// envelope.parsed = JSON.parse(envelope.rawPayload);&#10;// envelope.addTrace('处理完成');&#10;return envelope;"
                          :disabled="!isEditing"
                          spellcheck="false"
                        />
                      </div>
                      <div class="script-actions">
                        <button class="btn-ghost" :disabled="scriptTesting" @click="testScript">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          测试脚本
                        </button>
                      </div>
                      <div v-if="scriptTestResult !== null" class="test-result-section">
                        <div class="test-result-header">
                          <span class="state-tag" :class="scriptTestResult.error ? 'danger' : 'success'">
                            {{ scriptTestResult.error ? '执行失败' : '执行成功' }}
                          </span>
                        </div>
                        <pre class="script-result-pre">{{ JSON.stringify(scriptTestResult, null, 2) }}</pre>
                      </div>
                    </div>

                    <!-- 输出 Sink 配置（sink 节点专属） -->
                    <div v-if="node.kind === 'sink'" class="config-section">
                      <div class="config-section-title">输出目标</div>
                      <div class="config-field">
                        <label>Sink SPI</label>
                        <el-select
                          v-model="selectedNodeSinkName"
                          size="small"
                          placeholder="选择 Sink SPI"
                          style="width: 100%"
                          :disabled="!isEditing"
                          popper-class="pipeline-spi-popper"
                          @change="onSinkChange"
                          @visible-change="onSpiSelectVisibleChange"
                        >
                          <el-option
                            v-for="sink in sinkSpis"
                            :key="sink.name"
                            :label="sink.label || sink.name"
                            :value="sink.name"
                          />
                        </el-select>
                      </div>
                    </div>

                    <!-- 表结构定义（table-structure 节点专属） -->
                    <div v-if="node.kind === 'table-structure'" class="config-section">
                      <div class="config-section-title">
                        表字段定义
                        <el-button v-if="isEditing" size="small" text @click="addTableColumn">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </el-button>
                      </div>
                      <div class="config-field">
                        <label>表名</label>
                        <el-input v-model="tableConfig.tableName" size="small" placeholder="请输入表名" :disabled="!isEditing" />
                      </div>
                      <div v-if="tableConfig.columns.length === 0" class="config-empty">暂无字段定义</div>
                      <div v-for="(col, idx) in tableConfig.columns" :key="idx" class="table-column-row">
                        <div class="table-column-header">
                          <span class="table-column-index">#{{ idx + 1 }}</span>
                          <el-button v-if="isEditing" size="small" text @click="removeTableColumn(idx)">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </el-button>
                        </div>
                        <div class="table-column-fields">
                          <el-input v-model="col.name" size="small" placeholder="字段名" :disabled="!isEditing" />
                          <el-select v-model="col.type" size="small" placeholder="类型" :disabled="!isEditing" style="width:100px">
                            <el-option label="VARCHAR" value="VARCHAR" />
                            <el-option label="INT" value="INT" />
                            <el-option label="BIGINT" value="BIGINT" />
                            <el-option label="DOUBLE" value="DOUBLE" />
                            <el-option label="FLOAT" value="FLOAT" />
                            <el-option label="DECIMAL" value="DECIMAL" />
                            <el-option label="BOOLEAN" value="BOOLEAN" />
                            <el-option label="DATE" value="DATE" />
                            <el-option label="DATETIME" value="DATETIME" />
                            <el-option label="TIMESTAMP" value="TIMESTAMP" />
                            <el-option label="TEXT" value="TEXT" />
                            <el-option label="BLOB" value="BLOB" />
                          </el-select>
                          <el-input v-model="col.length" size="small" placeholder="长度" style="width:70px" :disabled="!isEditing" />
                          <el-checkbox v-model="col.nullable" :disabled="!isEditing" size="small">可空</el-checkbox>
                          <el-checkbox v-model="col.primaryKey" :disabled="!isEditing" size="small">主键</el-checkbox>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 底部操作 -->
                  <div v-if="isEditing" class="config-panel-footer">
                    <el-button size="small" type="primary" @click="applyNodeConfig">应用配置</el-button>
                  </div>
                </div>
              </template>
            </ScFlowEditor>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <SaveDialog ref="saveRef" @success="loadData" />

    <!-- 测试管线对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试管线" width="640px" destroy-on-close teleported="false" class="dl-dialog">
      <div class="info-box">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#38bdf8" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>向管线 <b>{{ selectedPipeline?.name }}</b> 同步提交测试数据，返回执行结果。</span>
      </div>
      <el-form label-width="90px">
        <el-form-item label="数据格式">
          <el-radio-group v-model="testForm.formatType">
            <el-radio value="json">JSON</el-radio>
            <el-radio value="text">纯文本</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Payload">
          <el-input
            v-model="testForm.payload"
            type="textarea"
            :rows="8"
            placeholder="输入测试数据..."
          />
        </el-form-item>
      </el-form>
      <!-- 执行结果 -->
      <div v-if="testResult" class="test-result-section">
        <div class="test-result-header">
          <span class="state-tag" :class="testResult.status === 'filtered' ? 'warning' : 'success'">
            {{ testResult.status === 'filtered' ? '已过滤' : '执行成功' }}
          </span>
          <span v-if="testResult.traceId" class="trace-id">traceId: {{ testResult.traceId }}</span>
        </div>
        <pre class="script-result-pre">{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="testDialogVisible = false">关闭</button>
        <button class="btn-primary" :disabled="testLoading" @click="executeTest">
          {{ testLoading ? '执行中...' : '执行测试' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ScFlowEditor, getLfNodeType } from "@repo/components/ScFlowEditor";
import type { FlowEditorNode, FlowEditorEdge, FlowEditorPaletteItem } from "@repo/components/ScFlowEditor";
import {
  fetchPipelineList,
  fetchPipelineById,
  fetchDeletePipeline,
  fetchStartPipeline,
  fetchStopPipeline,
  fetchPipelineStatus,
  fetchUpdatePipeline,
  fetchPipelineSpis,
  fetchSubmitPipeline,
} from "../../api/pipeline";
import { http, type ReturnResult } from "@repo/utils";
import type { PipelineSpiCatalog } from "../../api/pipeline";
import type { ScGraph as ScGraphType, ScGraphNode, PipelineLifecycle } from "../../types";
import SaveDialog from "./save.vue";

defineOptions({ name: "DatalakePipelinePage" });

// ==================== Palette 定义 ====================
const palette: FlowEditorPaletteItem[] = [
  { kind: "source",       title: "数据源",   detail: "外部数据输入",      icon: "ri:database-2-line", color: "#10b981" },
  { kind: "parse",        title: "解析",     detail: "数据格式解析",      icon: "ri:search-eye-line", color: "#3b82f6" },
  { kind: "clean",        title: "清洗",     detail: "数据清洗去噪",      icon: "ri:spider-line",     color: "#8b5cf6" },
  { kind: "standardize",  title: "标准化",   detail: "数据标准化转换",    icon: "ri:flow-chart",      color: "#06b6d4" },
  { kind: "transform",    title: "转换",     detail: "通用数据转换",      icon: "ri:git-branch-line", color: "#f59e0b" },
  { kind: "filter",       title: "过滤",     detail: "条件过滤数据",      icon: "ri:link",            color: "#ef4444" },
  { kind: "enrich",       title: "富化",     detail: "数据补充增强",      icon: "ri:user-heart-line", color: "#ec4899" },
  { kind: "router",       title: "路由",     detail: "条件分支路由",      icon: "ri:global-line",     color: "#f59e0b" },
  { kind: "aggregate",    title: "聚合",     detail: "数据聚合汇总",      icon: "ri:play-circle-line",color: "#14b8a6" },
  { kind: "script",       title: "脚本",     detail: "自定义脚本处理",    icon: "ri:code-line",       color: "#a855f7" },
  { kind: "delay",        title: "延迟",     detail: "数据延迟处理",      icon: "ri:stop-circle-line",color: "#64748b" },
  { kind: "sink",         title: "输出",     detail: "数据输出目标",      icon: "ri:download-2-line", color: "#ef4444" },
  { kind: "table-structure", title: "数据结构", detail: "数据结构定义",    icon: "ri:table-line",      color: "#0ea5e9" },
];

// ==================== 类型映射 ====================
/** 节点类型中文标签 */
const TYPE_LABELS: Record<string, string> = {
  source: "数据源", sink: "输出", filter: "过滤", transform: "转换",
  enrich: "富化", router: "路由", aggregate: "聚合", delay: "延迟",
  parse: "解析", clean: "清洗", standardize: "标准化", script: "脚本",
  "table-structure": "数据结构",
};

/** 后端 type → ScFlowEditor kind (控制节点形状: source→圆形, sink→圆形, router→菱形, 其他→矩形) */
const TYPE_TO_KIND: Record<string, string> = {
  router: "CONDITION",
};

/** Pipeline lifecycle → FlowEditor runtimeStatus */
const LIFECYCLE_TO_RUNTIME: Record<string, string> = {
  RUNNING: "RUNNING",
  PAUSED: "WAIT_MANUAL",
  ERROR: "FAILED",
  RELOADING: "WAITING",
  STOPPED: "PENDING",
};

// ==================== 状态 ====================
const loading = ref(false);
const searchText = ref("");
const list = ref<ScGraphType[]>([]);
const lifecycles = ref<Record<string, PipelineLifecycle>>({});
const selectedId = ref<string>("");
const selectedPipeline = ref<ScGraphType | null>(null);
const saveRef = ref();
// FlowEditor 数据 & 编辑状态
const editorNodes = ref<FlowEditorNode[]>([]);
const editorEdges = ref<FlowEditorEdge[]>([]);
const selectedNodeId = ref<string | null>(null);
const isEditing = ref(false);
const saving = ref(false);
let originalNodesJson: string | null = null;
let originalEdgesJson: string | null = null;

// 脚本编辑器状态
const scriptContent = ref("");
const scriptLanguage = ref("js");
const scriptTesting = ref(false);
const scriptTestResult = ref<any>(null);

// 配置面板状态
const spiCatalog = ref<PipelineSpiCatalog>({});
const selectedNodeSpi = ref("");
const selectedNodeSinkName = ref("");
const configEntries = ref<Array<{ key: string; value: string }>>([]);

const HIDDEN_CONFIG_KEYS = new Set(["script", "scriptType", "tableName", "columns", "jdbcUrl", "url", "username", "password", "driverClassName"]);
const CONFIG_EXCLUDE_KEYS = new Set(["mappings"]);

interface TableColumnDef { name: string; type: string; length: string; nullable: boolean; primaryKey: boolean; }
const tableConfig = reactive<{ tableName: string; columns: TableColumnDef[] }>({
  tableName: "",
  columns: [],
});

// 测试对话框状态
const testDialogVisible = ref(false);
const testLoading = ref(false);
const testResult = ref<any>(null);
const testForm = reactive({
  formatType: "json" as "json" | "text",
  payload: "",
});

/** Node ID → { spi, config, sinkName } 映射，持久化节点配置 */
interface NodeConfigMeta { spi: string; config: Record<string, any>; sinkName?: string; }
const nodeConfigMap = ref<Record<string, NodeConfigMeta>>({});

// ==================== 计算属性 ====================
const filteredList = computed(() => {
  if (!searchText.value) return list.value;
  const q = searchText.value.toLowerCase();
  return list.value.filter(
    (g) => g.id.toLowerCase().includes(q) || g.name?.toLowerCase().includes(q)
  );
});

// 配置面板计算属性
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return editorNodes.value.find((n) => n.id === selectedNodeId.value) || null;
});

/** 节点 type → SPI catalog key 映射（后端 key 为复数，前端 kind 为单数） */
const KIND_TO_SPI_KEYS: Record<string, string[]> = {
  source: ["collectors", "collector", "sources", "source"],
  parse: ["parsers", "parser", "parse"],
  clean: ["cleaners", "cleaner", "clean"],
  standardize: ["standardizers", "standardizer", "standardize"],
  transform: ["transforms", "transformers", "transform"],
  filter: ["filters", "filter"],
  enrich: ["enrichers", "enricher", "enrich"],
  router: ["routers", "router"],
  aggregate: ["aggregators", "aggregator", "aggregate"],
  script: ["scripts", "script"],
  delay: ["delays", "delay"],
  sink: ["sinks", "sink"],
  "table-structure": ["schema-providers", "schemaProviders", "schemas", "schema", "table-structures", "tableStructure"],
};

function normalizeSpis(items: any): Array<{ name: string; label?: string; describe?: string; detail?: string }> {
  if (!Array.isArray(items)) return [];
  return items
    .map((s: any) => {
      if (typeof s === "string") return { name: s, label: s };
      return {
        name: s.name || s.spi || s.id || s.value || "",
        label: s.label || s.describe || s.name || s.spi || s.id || s.value || "",
        describe: s.describe || s.description || "",
        detail: s.describeDetail || s.detail || "",
      };
    })
    .filter((s) => s.name || s.label)
    .filter((s) => s.name !== "RealtimeSink");
}

function getCatalogSpis(kind?: string): Array<{ name: string; label?: string }> {
  if (!kind) return [];
  const keys = KIND_TO_SPI_KEYS[kind] || [kind];
  for (const key of keys) {
    const spis = normalizeSpis(spiCatalog.value[key]);
    if (spis.length) return spis;
  }
  return [];
}

async function loadPipelineSpis() {
  const res = await fetchPipelineSpis();
  spiCatalog.value = unwrapResponseData<PipelineSpiCatalog>(res.data) || {};
}

function onSpiSelectVisibleChange(visible: boolean) {
  if (!visible || Object.keys(spiCatalog.value).length > 0) return;
  loadPipelineSpis().catch(() => {});
}

const currentSpis = computed(() => getCatalogSpis(selectedNode.value?.kind));

const sinkSpis = computed(() => getCatalogSpis("sink"));

function stringifyConfigValue(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value, null, 2);
}

function parseConfigValue(value: string): any {
  const text = value.trim();
  if (!text) return "";
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function normalizeConfigEntries(kind: string | undefined, config: Record<string, any>): Array<{ key: string; value: string }> {
  if (kind === "parse" && config?.mappings && typeof config.mappings === "object" && !Array.isArray(config.mappings)) {
    return Object.entries(config.mappings).map(([key, value]) => ({ key, value: stringifyConfigValue(value) }));
  }
  return Object.entries(config || {})
    .filter(([key]) => !HIDDEN_CONFIG_KEYS.has(key) && !CONFIG_EXCLUDE_KEYS.has(key))
    .map(([key, value]) => ({ key, value: stringifyConfigValue(value) }));
}

function buildNodeConfig(kind: string | undefined): Record<string, any> {
  const entries = configEntries.value.filter((entry) => entry.key.trim());
  if (kind === "parse") {
    const mappings: Record<string, any> = {};
    entries.forEach((entry) => { mappings[entry.key.trim()] = parseConfigValue(entry.value); });
    return Object.keys(mappings).length ? { mappings } : {};
  }
  const config: Record<string, any> = {};
  entries.forEach((entry) => { config[entry.key.trim()] = parseConfigValue(entry.value); });
  return config;
}

const getNodeColor = (type: string): string => {
  const colors: Record<string, string> = {
    source: "#10b981", parse: "#3b82f6", clean: "#8b5cf6",
    standardize: "#06b6d4", transform: "#f59e0b", filter: "#ef4444",
    enrich: "#ec4899", router: "#f59e0b", aggregate: "#14b8a6",
    delay: "#64748b", sink: "#ef4444", "table-structure": "#0ea5e9",
  };
  return colors[type] || "#64748b";
};

// ==================== 生命周期辅助 ====================
const getLifecycle = (id: string) => lifecycles.value[id] || "STOPPED";

const lifecycleText = (id: string) => {
  const map: Record<string, string> = {
    RUNNING: "运行中", PAUSED: "已停用", STOPPED: "已停用",
    ERROR: "异常", RELOADING: "重载中",
  };
  return map[getLifecycle(id)] || "未知";
};

const lifecycleTagType = (id: string) => {
  const lc = getLifecycle(id);
  if (lc === "RUNNING") return "success";
  if (lc === "ERROR") return "danger";
  return "info";
};

// ==================== 数据转换 ====================
function getEditorNodeType(kind: string): FlowEditorNode["type"] {
  return getLfNodeType(TYPE_TO_KIND[kind] || kind) as FlowEditorNode["type"];
}

function resolveNodeKind(node: ScGraphNode): string {
  const type = node.type || "";
  if (TYPE_LABELS[type] || type === "table-structure") return type;
  const spi = node.spi || "";
  if (spi === "数据结构" || spi === "table-structure" || spi === "schema-providers") return "table-structure";
  if (spi === "JsonParser" || spi === "CsvParser") return "parse";
  if (spi === "NullFilter" || spi === "SchemaFilter") return "filter";
  if (spi === "TrimCleaner" || spi === "RangeCleaner") return "clean";
  if (spi === "FieldMapperStandardizer" || spi === "TimestampNormalizer") return "standardize";
  if (spi === "JdbcSink" || spi === "LogSink") return "sink";
  if (spi === "WeatherCollector") return "source";
  return type && !type.startsWith("flow-") ? type : "transform";
}

function sanitizeNodeConfig(kind: string, config: Record<string, any>): Record<string, any> {
  if (kind !== "sink") return config || {};
  const sanitized = { ...(config || {}) };
  ["jdbcUrl", "url", "username", "password", "driverClassName"].forEach((key) => delete sanitized[key]);
  return sanitized;
}

/** Pipeline → FlowEditor nodes + edges */
function pipelineToEditor(pipeline: ScGraphType): { nodes: FlowEditorNode[]; edges: FlowEditorEdge[] } {
  if (!pipeline.nodes?.length) return { nodes: [], edges: [] };

  const pipelineNodes = pipeline.nodes.filter((node) => node.spi !== "RealtimeSink");
  const nodes: FlowEditorNode[] = pipelineNodes.map((node, idx) => {
    const kind = resolveNodeKind(node);
    return {
      id: `${pipeline.id}-${idx}`,
      type: getEditorNodeType(kind),
      label: TYPE_LABELS[kind] || node.spi || kind,
      kind,
      position: { x: 100 + idx * 280, y: 220 },
    };
  });

  // 同步 nodeConfigMap
  const configMap: Record<string, NodeConfigMeta> = {};
  pipelineNodes.forEach((node, idx) => {
    const nodeId = `${pipeline.id}-${idx}`;
    const kind = resolveNodeKind(node);
    configMap[nodeId] = {
      spi: node.spi || "",
      config: sanitizeNodeConfig(kind, node.config || {}),
      sinkName: kind === "sink" ? node.spi : undefined,
    };
  });
  nodeConfigMap.value = { ...nodeConfigMap.value, ...configMap };

  const edges: FlowEditorEdge[] = [];
  // 顺序边
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
    });
  }
  // 条件分支边
  pipelineNodes.forEach((node, idx) => {
    if (node.conditions?.length) {
      node.conditions.forEach((cond) => {
        const targetIdx = pipelineNodes.findIndex(
          (n, i) => i !== idx && (cond.target === n.spi || cond.target === resolveNodeKind(n))
        );
        if (targetIdx >= 0) {
          edges.push({
            id: `e-${nodes[idx].id}-${nodes[targetIdx].id}-cond`,
            source: nodes[idx].id,
            target: nodes[targetIdx].id,
            label: cond.when,
          });
        }
      });
    }
  });

  return { nodes, edges };
}

/** FlowEditor nodes + edges → Pipeline 节点数组 */
function editorToPipeline(nodes: FlowEditorNode[], edges: FlowEditorEdge[]): ScGraphNode[] {
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);

  return sorted
    .filter((node) => node.kind !== "START" && node.kind !== "END")
    .map((node) => {
      const pipelineType = node.kind || node.type || "transform";
      const meta = nodeConfigMap.value[node.id];
      const spi = pipelineType === "sink" ? (meta?.sinkName || meta?.spi || "") : (meta?.spi || "");
      const config = meta?.config || {};

      const result: ScGraphNode = {
        type: pipelineType,
        spi,
        config,
      };
      const condEdges = edges.filter((e) => e.source === node.id && e.label);
      if (condEdges.length > 0) {
        result.conditions = condEdges.map((e) => ({
          when: e.label!,
          target: nodes.find((n) => n.id === e.target)?.kind || e.target,
        }));
      }
      return result;
  });
}

/** 为节点附加运行时状态 + tooltip 信息 */
function applyRuntimeStatus(nodes: FlowEditorNode[], lifecycle: PipelineLifecycle): FlowEditorNode[] {
  const status = LIFECYCLE_TO_RUNTIME[lifecycle] || "PENDING";
  return nodes.map((n) => {
    const node: FlowEditorNode = { ...n, runtimeStatus: status };
    if (lifecycle === "RUNNING") {
      node.displayInfo = "运行中";
    } else if (lifecycle === "ERROR") {
      node.errorMessage = "管线异常";
    } else if (lifecycle === "RELOADING") {
      node.displayInfo = "重载中";
    }
    return node;
  });
}

// ==================== 操作 ====================
const selectPipeline = (item: ScGraphType) => {
  if (isEditing.value) {
    ElMessage.warning("请先保存或取消当前编辑");
    return;
  }
  selectedId.value = item.id;
  selectedPipeline.value = item;
  const converted = pipelineToEditor(item);
  editorNodes.value = applyRuntimeStatus(converted.nodes, getLifecycle(item.id));
  editorEdges.value = converted.edges;
  selectedNodeId.value = null;
  isEditing.value = false;
};

const unwrapResponseData = <T,>(payload: any): T => (payload?.data ?? payload) as T;

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchPipelineList();
    const pipelines = unwrapResponseData<ScGraphType[]>(data) || [];
    const details = await Promise.allSettled(
      pipelines.map(async (item) => {
        if (item.nodes?.length) return item;
        const detailRes = await fetchPipelineById(item.id);
        const detail = unwrapResponseData<ScGraphType>(detailRes.data) || {} as ScGraphType;
        return { ...detail, ...item, nodes: detail.nodes || item.nodes || [] };
      })
    );
    list.value = details.map((result, index) => result.status === "fulfilled" ? result.value : pipelines[index]);
    const statuses = await Promise.allSettled(
      list.value.map((g) => fetchPipelineStatus(g.id))
    );
    statuses.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value?.data?.lifecycle) {
        lifecycles.value[list.value[i].id] = result.value.data.lifecycle as PipelineLifecycle;
      }
    });
    if (selectedId.value && !list.value.find((g) => g.id === selectedId.value)) {
      selectedId.value = "";
      selectedPipeline.value = null;
      isEditing.value = false;
      editorNodes.value = [];
      editorEdges.value = [];
    } else if (selectedId.value) {
      const updated = list.value.find((g) => g.id === selectedId.value);
      if (updated) {
        selectedPipeline.value = updated;
        if (!isEditing.value) {
          const converted = pipelineToEditor(updated);
          editorNodes.value = applyRuntimeStatus(converted.nodes, getLifecycle(updated.id));
          editorEdges.value = converted.edges;
        } else {
          // 编辑模式下只刷新运行时状态
          const lifecycle = getLifecycle(updated.id);
          if (lifecycle) {
            editorNodes.value = applyRuntimeStatus(editorNodes.value, lifecycle);
          }
        }
      }
    }
  } catch {} finally {
    loading.value = false;
  }
};

const handleCreate = () => saveRef.value?.open();
const handleEdit = (row: ScGraphType) => saveRef.value?.open(row);

const handleDeleteClick = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此 Pipeline？删除后不可恢复。", "确认删除", {
      confirmButtonText: "删除", cancelButtonText: "取消", type: "warning",
    });
    handleDelete(id);
  } catch { /* 取消 */ }
};

const handleDelete = async (id: string) => {
  try {
    await fetchDeletePipeline(id);
    ElMessage.success("删除成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "删除失败");
  }
};

const handleLifecycle = async (id: string, action: string) => {
  try {
    if (action === "start") {
      await fetchStartPipeline(id);
      ElMessage.success("已启动");
    } else {
      await fetchStopPipeline(id);
      ElMessage.success("已停用");
    }
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "操作失败");
  }
};

// ==================== 测试管线 ====================
function openTestDialog() {
  testForm.payload = testForm.formatType === "json"
    ? '{\n  "sensor": "temp-01",\n  "value": 23.5\n}'
    : "";
  testResult.value = null;
  testDialogVisible.value = true;
}

async function executeTest() {
  if (!selectedPipeline.value) return;
  if (!testForm.payload.trim()) {
    ElMessage.warning("请输入测试数据");
    return;
  }
  testLoading.value = true;
  testResult.value = null;
  try {
    let payload: any;
    if (testForm.formatType === "json") {
      try {
        payload = JSON.parse(testForm.payload);
      } catch {
        ElMessage.error("JSON 格式不正确，请检查语法");
        testLoading.value = false;
        return;
      }
    } else {
      payload = testForm.payload;
    }
    const res = await fetchSubmitPipeline(selectedPipeline.value.id, {
      payload,
      formatType: testForm.formatType,
    });
    testResult.value = res.data || res;
    ElMessage.success("测试执行完成");
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || "测试执行失败");
    testResult.value = { error: e?.msg || e?.message || "执行失败" };
  } finally {
    testLoading.value = false;
  }
}

// ==================== FlowEditor 事件 ====================
function onNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId;
  // 从 nodeConfigMap 恢复配置面板状态
  const meta = nodeConfigMap.value[nodeId];
  selectedNodeSpi.value = meta?.spi || "";
  selectedNodeSinkName.value = meta?.sinkName || "";
  configEntries.value = meta?.config ? normalizeConfigEntries(selectedNode.value?.kind, meta.config) : [];
  // 恢复脚本配置
  scriptContent.value = meta?.config?.script || "";
  scriptLanguage.value = meta?.config?.scriptType || "js";
  scriptTestResult.value = null;
  // 恢复表结构配置
  tableConfig.tableName = meta?.config?.tableName || "";
  tableConfig.columns = meta?.config?.columns
    ? JSON.parse(JSON.stringify(meta.config.columns))
    : [];
}

function onPaneClick() {
  selectedNodeId.value = null;
  selectedNodeSpi.value = "";
  selectedNodeSinkName.value = "";
  configEntries.value = [];
  scriptContent.value = "";
  scriptLanguage.value = "js";
  scriptTestResult.value = null;
  tableConfig.tableName = "";
  tableConfig.columns = [];
}

function closeNodeConfig(close?: () => void) {
  close?.();
  onPaneClick();
}

function onApplyLayout(positions: Array<{ nodeId: string; position: { x: number; y: number } }>) {
  for (const p of positions) {
    const node = editorNodes.value.find(n => n.id === p.nodeId);
    if (node) node.position = p.position;
  }
  // 强制触发重新渲染
  editorNodes.value = [...editorNodes.value];
}

function onNodeDrop(payload: { id: string; kind: string; position: { x: number; y: number } }) {
  const id = payload.id || `new-${Date.now()}`;
  const kind = payload.kind;
  editorNodes.value = [...editorNodes.value, {
    id,
    type: getEditorNodeType(kind),
    label: TYPE_LABELS[payload.kind] || payload.kind,
    kind,
    position: { x: payload.position.x, y: payload.position.y },
  }];
  // 自动选中新节点并显示配置面板
  onNodeClick(id);
}

function onNodeRemove(nodeId: string) {
  editorNodes.value = editorNodes.value.filter((n) => n.id !== nodeId);
  editorEdges.value = editorEdges.value.filter((e) => e.source !== nodeId && e.target !== nodeId);
  if (selectedNodeId.value === nodeId) selectedNodeId.value = null;
}

function onEdgeRemove(edgeId: string) {
  editorEdges.value = editorEdges.value.filter((e) => e.id !== edgeId);
}

function onEdgeCreate(payload: { source: string; target: string }) {
  const id = `e-${payload.source}-${payload.target}`;
  if (editorEdges.value.some((e) => e.id === id)) return;
  editorEdges.value = [...editorEdges.value, {
    id,
    source: payload.source,
    target: payload.target,
  }];
}

function onNodeMoved(payload: { nodeId: string; position: { x: number; y: number } }) {
  const node = editorNodes.value.find((n) => n.id === payload.nodeId);
  if (node) node.position = payload.position;
}

// ==================== 配置面板操作 ====================
function onSpiChange(spiName: string) {
  if (!selectedNodeId.value) return;
  nodeConfigMap.value = {
    ...nodeConfigMap.value,
    [selectedNodeId.value]: {
      ...(nodeConfigMap.value[selectedNodeId.value] || { spi: "", config: {} }),
      spi: spiName,
    },
  };
}

function onSinkChange(spiName: string) {
  if (!selectedNodeId.value) return;
  nodeConfigMap.value = {
    ...nodeConfigMap.value,
    [selectedNodeId.value]: {
      ...(nodeConfigMap.value[selectedNodeId.value] || { spi: "", config: {} }),
      spi: spiName,
      sinkName: spiName,
    },
  };
}

function addConfigEntry() {
  configEntries.value = [...configEntries.value, { key: "", value: "" }];
}

function removeConfigEntry(idx: number) {
  configEntries.value = configEntries.value.filter((_, i) => i !== idx);
}

function addTableColumn() {
  tableConfig.columns.push({ name: "", type: "VARCHAR", length: "255", nullable: true, primaryKey: false });
}

function removeTableColumn(idx: number) {
  tableConfig.columns.splice(idx, 1);
}

function applyNodeConfig() {
  if (!selectedNodeId.value) return;
  const node = selectedNode.value;
  const config = buildNodeConfig(node?.kind);
  if (node?.kind === "script" && scriptContent.value) {
    config.script = scriptContent.value;
    config.scriptType = scriptLanguage.value;
  }
  if (node?.kind === "table-structure") {
    config.tableName = tableConfig.tableName;
    config.columns = tableConfig.columns.filter(c => c.name.trim());
  }
  const existing = nodeConfigMap.value[selectedNodeId.value] || { spi: "", config: {} };
  nodeConfigMap.value = {
    ...nodeConfigMap.value,
    [selectedNodeId.value]: {
      ...existing,
      spi: node?.kind === "sink" ? (selectedNodeSinkName.value || selectedNodeSpi.value) : selectedNodeSpi.value,
      config,
      sinkName: node?.kind === "sink" ? selectedNodeSinkName.value || undefined : undefined,
    },
  };
  ElMessage.success("配置已应用");
}

// ==================== 脚本测试 ====================
async function testScript() {
  if (!scriptContent.value.trim()) {
    ElMessage.warning("请输入脚本内容");
    return;
  }
  scriptTesting.value = true;
  scriptTestResult.value = null;
  try {
    const res = await http.request<ReturnResult<any>>("post", "/v2/datalake/script/test", {
      data: {
        script: scriptContent.value,
        scriptType: scriptLanguage.value,
        payload: JSON.stringify({ sensor: "temp-01", value: 23.5, timestamp: Date.now() }),
      },
    });
    scriptTestResult.value = res?.data || res;
    ElMessage.success(scriptTestResult.value?.data?.error ? "脚本执行出错" : "脚本执行成功");
  } catch (e: any) {
    scriptTestResult.value = { error: e?.msg || e?.message || "请求失败" };
  } finally {
    scriptTesting.value = false;
  }
}

// ==================== 编辑操作 ====================
const createDefaultNodes = (): { nodes: FlowEditorNode[]; edges: FlowEditorEdge[] } => {
  const nodes: FlowEditorNode[] = [
    { id: "default-start",  type: "flow-circle",  label: "开始",   kind: "START",    position: { x: 100, y: 220 } },
    { id: "default-source", type: "flow-rect",    label: "数据源", kind: "source",   position: { x: 360, y: 220 } },
    { id: "default-parse",  type: "flow-rect",    label: "解析",   kind: "parse",    position: { x: 620, y: 220 } },
    { id: "default-filter", type: "flow-rect",    label: "过滤",   kind: "filter",   position: { x: 880, y: 220 } },
    { id: "default-sink",   type: "flow-rect",    label: "输出",   kind: "sink",     position: { x: 1140, y: 220 } },
    { id: "default-end",    type: "flow-circle",  label: "结束",   kind: "END",      position: { x: 1400, y: 220 } },
  ];
  const edges: FlowEditorEdge[] = [
    { id: "e-start-source", source: "default-start", target: "default-source" },
    { id: "e-source-parse", source: "default-source", target: "default-parse" },
    { id: "e-parse-filter", source: "default-parse",  target: "default-filter" },
    { id: "e-filter-sink",  source: "default-filter", target: "default-sink" },
    { id: "e-sink-end",     source: "default-sink",   target: "default-end" },
  ];
  return { nodes, edges };
};

const enterEditMode = () => {
  if (editorNodes.value.length === 0) {
    const defaults = createDefaultNodes();
    editorNodes.value = defaults.nodes;
    editorEdges.value = defaults.edges;
  }
  originalNodesJson = JSON.stringify(editorNodes.value);
  originalEdgesJson = JSON.stringify(editorEdges.value);
  isEditing.value = true;
};

const cancelEdit = () => {
  if (originalNodesJson) {
    editorNodes.value = JSON.parse(originalNodesJson);
  }
  if (originalEdgesJson) {
    editorEdges.value = JSON.parse(originalEdgesJson);
  }
  isEditing.value = false;
  originalNodesJson = null;
  originalEdgesJson = null;
};

const saveFlow = async () => {
  if (!selectedPipeline.value) return;
  saving.value = true;
  try {
    const nodes = editorToPipeline(editorNodes.value, editorEdges.value);
    const payload: Partial<ScGraphType> = {
      id: selectedPipeline.value.id,
      name: selectedPipeline.value.name,
      version: selectedPipeline.value.version,
      description: selectedPipeline.value.description,
      nodes,
    };
    await fetchUpdatePipeline(payload);
    ElMessage.success("流程已保存");

    // 更新本地状态
    selectedPipeline.value = { ...selectedPipeline.value, nodes };
    const listItem = list.value.find((g) => g.id === selectedPipeline.value!.id);
    if (listItem) listItem.nodes = nodes;

    isEditing.value = false;
    originalNodesJson = null;
    originalEdgesJson = null;
  } catch (e: any) {
    ElMessage.error(e?.msg || "保存失败");
  } finally {
    saving.value = false;
  }
};

// ==================== 生命周期 ====================
onMounted(() => {
  loadData();
  loadPipelineSpis().catch(() => {});
});
</script>

<style scoped lang="scss">
.pipeline-graph-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  animation: fadeIn 0.35s ease;
  font-family: "Space Mono", "Courier New", monospace;
}
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== 工具栏 ===== */
.graph-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;

  .toolbar-left, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

/* ===== 布局 ===== */
.graph-layout {
  flex: 1;
  height: 100%;
  display: flex;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

/* ===== 通用组件 ===== */
.btn-ghost, .btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(11, 16, 32, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 11px;
  color: #cbd5e1;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover { border-color: rgba(148, 163, 184, 0.35); color: #e2e8f0; background: rgba(11, 16, 32, 0.9); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &.loading svg { animation: spin 1s linear infinite; }
}

.btn-primary {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.32);
  color: #e0f2fe;

  &:hover { background: rgba(56, 189, 248, 0.28); border-color: rgba(56, 189, 248, 0.5); color: #f0f9ff; }
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(11, 16, 32, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { border-color: rgba(148, 163, 184, 0.35); color: #e2e8f0; }
}
.btn-success-icon:hover { border-color: rgba(34, 197, 94, 0.3); color: #86efac; }
.btn-warning-icon:hover { border-color: rgba(245, 158, 11, 0.3); color: #fbbf24; }
.btn-danger-icon:hover { border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; }

.panel-badge {
  font-size: 10px;
  color: #5a6478;
  background: rgba(0, 180, 255, 0.06);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 10px;
  padding: 0 8px;
  font-family: "Space Mono", monospace;
  display: inline-flex;
  align-items: center;
  height: 20px;
}

.state-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;

  &.success { color: #22c55e; background: rgba(34, 197, 94, 0.08); }
  &.danger { color: #ef4444; background: rgba(239, 68, 68, 0.08); }
  &.warning { color: #f59e0b; background: rgba(245, 158, 11, 0.08); }
  &.info { color: #94a3b8; background: rgba(148, 163, 184, 0.08); }
}

.form-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #e2e8f0;
  font-family: "Space Mono", monospace;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus { border-color: rgba(0, 180, 255, 0.25); }
  &::placeholder { color: rgba(255, 255, 255, 0.2); }
}

/* ===== 左侧边栏 ===== */
.pipeline-sidebar {
  width: 300px;
  height: 100%;
  min-height: 0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--dl-surface, rgba(12, 22, 44, 0.85));
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--dl-border, rgba(0, 180, 255, 0.06));

    .sidebar-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--dl-text-dim, #94a3b8);
      letter-spacing: 0.03em;
    }
    .stats-dots {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      &.running { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.4); }
      &.stopped { background: #5a6478; }
    }
  }

  .sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: rgba(0, 180, 255, 0.1); border-radius: 2px; }
  }
}

.pipeline-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  border: 1px solid transparent;

  &:hover {
    background: rgba(0, 180, 255, 0.03);
    border-color: rgba(0, 180, 255, 0.08);
  }
  &.active {
    background: rgba(56, 189, 248, 0.06);
    border-color: rgba(56, 189, 248, 0.15);
  }

  .item-indicator {
    width: 4px;
    height: 32px;
    border-radius: 2px;
    flex-shrink: 0;

    &.running { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
    &.stopped { background: #5a6478; }
    &.error { background: #ef4444; }
    &.reloading { background: #3b82f6; }
  }

  .item-info {
    flex: 1;
    min-width: 0;

    .item-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--dl-text, #e2e8f0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-meta {
      font-size: 11px;
      color: var(--dl-text-mute, #5a6478);
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 4px;

      .dot-sep { opacity: 0.3; }
      .status-running { color: #22c55e; }
      .status-stopped { color: #5a6478; }
      .status-error { color: #ef4444; }
    }
  }

  .item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .item-actions {
    opacity: 1;
  }
}

.sidebar-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 200px;
  color: rgba(255, 255, 255, 0.15);
  font-size: 13px;
}

/* ===== 右侧主区域 ===== */
.graph-main {
  flex: 1;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.graph-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--dl-text-mute, #5a6478);

  p {
    font-size: 14px;
    margin: 0;
  }
}

.graph-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.graph-info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--dl-border, rgba(0, 180, 255, 0.06));
  flex-shrink: 0;

  .info-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--dl-text, #e2e8f0);
    }
  }
  .info-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-desc {
      font-size: 12px;
      color: var(--dl-text-dim, #94a3b8);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .edit-hint {
      font-size: 12px;
      color: var(--dl-accent, #38bdf8);
      opacity: 0.6;
    }
  }
}

.graph-wrapper {
  flex: 1;
  min-height: 0;
}

/* ===== 节点配置面板 ===== */
.graph-config-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.config-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--dl-border, rgba(0, 180, 255, 0.06));
  flex-shrink: 0;
}

.config-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--dl-text, #e2e8f0);
}

.config-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--dl-text-dim, #94a3b8);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-field label {
  font-size: 10px;
  color: var(--dl-text-mute, #5a6478);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.config-empty {
  font-size: 11px;
  color: var(--dl-text-mute, #5a6478);
  text-align: center;
  padding: 12px 0;
}

.config-kv-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-panel-footer {
  padding: 10px 12px;
  border-top: 1px solid var(--dl-border, rgba(0, 180, 255, 0.06));
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.node-type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 4px;
  width: fit-content;
}

/* ===== 脚本编辑器 ===== */
.script-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.script-result-pre {
  max-height: 200px;
  overflow: auto;
  padding: 8px;
  background: rgba(6, 10, 20, 0.6);
  border-radius: 4px;
  font-family: "Fira Code", "Cascadia Code", "Consolas", monospace;
  font-size: 11px;
  color: #a5d6ff;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ===== 测试结果面板 ===== */
.test-result-section {
  margin-top: 12px;
  padding: 12px;
  background: rgba(6, 10, 20, 0.8);
  border-radius: 6px;
  border: 1px solid var(--dl-border, rgba(0, 180, 255, 0.08));
}

.test-result-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .trace-id {
    font-size: 11px;
    color: var(--dl-text-mute, #5a6478);
    font-family: "Space Mono", monospace;
  }
}

/* ===== 表结构编辑器 ===== */
.table-column-row {
  background: rgba(0, 180, 255, 0.03);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

.table-column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.table-column-index {
  font-size: 10px;
  font-weight: 600;
  color: var(--dl-text-mute, #5a6478);
}

.table-column-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* ===== info-box (替代 el-alert) ===== */
.info-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(56, 189, 248, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.08);
  border-radius: 6px;
  font-size: 12px;
  color: var(--dl-text-dim, #94a3b8);
  margin-bottom: 16px;

  b { color: var(--dl-text, #e2e8f0); }
}

/* ===== :deep() 覆盖 ElPlus 组件（config panel 和 test dialog 内） ===== */

/* --- el-input (disabled) --- */
:deep(.el-input.is-disabled .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(0, 180, 255, 0.06) !important;
  box-shadow: none !important;
}
:deep(.el-input.is-disabled .el-input__inner) {
  color: #5a6478 !important;
  -webkit-text-fill-color: #5a6478 !important;
}

/* --- el-input (normal) --- */
:deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(0, 180, 255, 0.1) !important;
  box-shadow: none !important;
  border-radius: 6px !important;
  padding: 0 8px !important;
}
:deep(.el-input__inner) {
  color: #e2e8f0 !important;
  font-family: "Space Mono", monospace !important;
  font-size: 12px !important;
}
:deep(.el-input__wrapper:hover) {
  border-color: rgba(0, 180, 255, 0.2) !important;
}

/* --- el-textarea --- */
:deep(.el-textarea__inner) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(0, 180, 255, 0.1) !important;
  box-shadow: none !important;
  border-radius: 6px !important;
  color: #e2e8f0 !important;
  font-family: "Fira Code", "Cascadia Code", "Consolas", monospace !important;
  font-size: 12px !important;
}
:deep(.el-textarea__inner:focus) {
  border-color: rgba(0, 180, 255, 0.25) !important;
}

/* --- el-select --- */
:deep(.el-select .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(0, 180, 255, 0.1) !important;
}

/* --- el-select-dropdown --- */
:deep(.el-select-dropdown) {
  background: #0b1020 !important;
  border: 1px solid rgba(0, 180, 255, 0.15) !important;
  border-radius: 6px !important;
}
:deep(.el-select-dropdown__item) {
  color: #94a3b8 !important;
  font-size: 12px !important;
}
:deep(.el-select-dropdown__item.hover) {
  background: rgba(56, 189, 248, 0.08) !important;
  color: #e2e8f0 !important;
}
:deep(.el-select-dropdown__item.selected) {
  color: #38bdf8 !important;
  font-weight: 600 !important;
}

/* --- el-checkbox --- */
:deep(.el-checkbox__label) {
  color: var(--dl-text-dim, #94a3b8) !important;
  font-size: 11px !important;
}
:deep(.el-checkbox__input .el-checkbox__inner) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(0, 180, 255, 0.15) !important;
}
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #38bdf8 !important;
  border-color: #38bdf8 !important;
}
:deep(.el-checkbox.is-disabled .el-checkbox__label) {
  color: #5a6478 !important;
}

/* --- el-button inside config panel --- */
:deep(.el-button) {
  font-family: "Space Mono", monospace !important;
}
:deep(.el-button--small) {
  font-size: 11px !important;
}
:deep(.el-button.is-text) {
  color: #94a3b8 !important;
  border: none !important;
}
:deep(.el-button.is-text:hover) {
  color: #38bdf8 !important;
  background: rgba(56, 189, 248, 0.08) !important;
}
:deep(.el-button--primary) {
  background: rgba(56, 189, 248, 0.1) !important;
  border: 1px solid rgba(56, 189, 248, 0.2) !important;
  color: #38bdf8 !important;
}
:deep(.el-button--primary:hover) {
  background: rgba(56, 189, 248, 0.18) !important;
  border-color: rgba(56, 189, 248, 0.35) !important;
}

/* ===== 测试对话框 (el-dialog) ===== */
:deep(.el-dialog) {
  background: #0b1020 !important;
  border: 1px solid rgba(0, 180, 255, 0.2) !important;
  border-radius: 8px !important;
  box-shadow: 0 0 40px rgba(0, 180, 255, 0.08) !important;
}
:deep(.el-dialog__header) {
  padding: 14px 18px !important;
  border-bottom: 1px solid rgba(0, 180, 255, 0.06) !important;
  margin: 0 !important;
}
:deep(.el-dialog__title) {
  color: var(--dl-text, #e2e8f0) !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  font-family: "Space Mono", monospace !important;
}
:deep(.el-dialog__headerbtn) {
  color: #5a6478 !important;
}
:deep(.el-dialog__headerbtn:hover) {
  color: #ef4444 !important;
}
:deep(.el-dialog__body) {
  padding: 18px !important;
  color: #e2e8f0 !important;
}
:deep(.el-dialog__footer) {
  padding: 12px 18px !important;
  border-top: 1px solid rgba(0, 180, 255, 0.06) !important;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* --- el-form inside dialog --- */
:deep(.el-form-item__label) {
  color: var(--dl-text-dim, #94a3b8) !important;
  font-size: 11px !important;
  font-family: "Space Mono", monospace !important;
}

/* --- el-radio-group / el-radio --- */
:deep(.el-radio__label) {
  color: var(--dl-text-dim, #94a3b8) !important;
  font-size: 12px !important;
}
:deep(.el-radio__input .el-radio__inner) {
  background: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(0, 180, 255, 0.15) !important;
}
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: #38bdf8 !important;
  border-color: #38bdf8 !important;
}
:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #e2e8f0 !important;
}

/* --- el-button inside dialog footer --- */
:deep(.el-dialog__footer .el-button) {
  font-size: 11px !important;
  font-family: "Space Mono", monospace !important;
}
:deep(.el-dialog__footer .el-button--primary) {
  background: rgba(56, 189, 248, 0.1) !important;
  border: 1px solid rgba(56, 189, 248, 0.2) !important;
  color: #38bdf8 !important;
}
:deep(.el-dialog__footer .el-button--primary:hover) {
  background: rgba(56, 189, 248, 0.18) !important;
  border-color: rgba(56, 189, 248, 0.35) !important;
}
</style>
