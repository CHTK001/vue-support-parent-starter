<template>
  <section class="spider-orchestration">
    <aside class="spider-orchestration__sidebar">
      <div class="sidebar-panel">
        <div class="sidebar-panel__head">
          <strong>流程</strong>
          <span>{{ activeFlow.spiderFlowName }}</span>
        </div>
        <div class="example-list">
          <button
            v-for="item in exampleFlows"
            :key="item.spiderDefinitionCode"
            type="button"
            class="example-list__item"
            :class="{ 'is-active': item.spiderDefinitionCode === activeFlow.spiderDefinitionCode }"
            @click="loadSchema(item.spiderDefinitionCode)"
          >
            <strong>{{ item.spiderFlowName }}</strong>
            <small>{{ item.spiderDefinitionCode }}</small>
          </button>
        </div>
      </div>

      <div class="sidebar-panel">
        <div class="sidebar-panel__head">
          <strong>节点库</strong>
          <span>{{ spiderNodePalette.length }} 类</span>
        </div>
        <div class="node-library">
          <article
            v-for="item in spiderNodePalette"
            :key="item.type"
            class="node-library__item"
            draggable="true"
            @dragstart="handleNodeDragStart(item.type)"
            @dblclick="handleNodeDoubleClick(item.type)"
          >
            <span class="node-library__tag" :style="{ background: item.color }">{{ item.type }}</span>
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
            <small>拖拽或双击投放到右侧画板</small>
          </article>
        </div>
      </div>

      <div class="sidebar-panel">
        <div class="sidebar-panel__head">
          <strong>规则链路</strong>
          <span>{{ editorData.connections.length }} 条</span>
        </div>
        <ul class="edge-outline">
          <li v-for="item in edgeOutline" :key="item.id">
            <strong>{{ item.label }}</strong>
            <small>{{ item.detail }}</small>
          </li>
        </ul>
      </div>
    </aside>

    <section class="spider-orchestration__workspace">
      <header class="workspace-toolbar">
        <div class="workspace-toolbar__title">
          <strong>{{ activeFlow.spiderFlowName }}</strong>
          <span>左侧节点拖拽或双击投放，右侧点击节点配置</span>
        </div>
        <div class="workspace-toolbar__actions">
          <button type="button" class="is-secondary" @click="resetEditor">重置示例</button>
          <button type="button" class="is-secondary" @click="zoomToFitEditor">适配画布</button>
          <button type="button" class="is-secondary" @click="arrangeEditor">自动布局</button>
          <button type="button" class="is-secondary" @click="saveSchema">保存编排</button>
          <button type="button" @click="emitEditorJson">输出 JSON</button>
        </div>
      </header>

      <div
        ref="canvasShellRef"
        class="workspace-canvas"
        @dragover.prevent
        @drop.prevent="handleCanvasDrop"
      >
        <div class="workspace-canvas__edge-badges">
          <span
            v-for="item in edgeBadges"
            :key="item.id"
            class="edge-badge"
            :style="{ left: `${item.left}px`, top: `${item.top}px` }"
          >
            {{ item.label }}
          </span>
        </div>
        <ScReteEditor
          ref="editorRef"
          v-model="editorData"
          :show-toolbar="true"
          :show-node-panel="false"
          :show-property-panel="false"
          :show-statusbar="true"
          :minimap="true"
          :context-menu="false"
          :auto-arrange="true"
          background="dots"
          :zoom="{ min: 0.2, max: 2 }"
          :node-menu-items="[]"
          @data-changed="handleEditorChanged"
          @node-selected="handleNodeSelected"
        >
          <template #toolbar-center>
            <span class="workspace-toolbar__center">Spider Orchestration</span>
          </template>
        </ScReteEditor>
      </div>

      <footer class="workspace-status">
        <span>节点 {{ editorData.nodes.length }}</span>
        <span>连接 {{ editorData.connections.length }}</span>
        <span>版本 {{ activeFlow.spiderFlowVersion }}</span>
        <span>作用域 {{ activeFlow.spiderFlowScope }}</span>
        <span v-if="schemaWarnings.length" class="is-warning">规则告警 {{ schemaWarnings.length }}</span>
        <span v-if="orchestrationMessage">{{ orchestrationMessage }}</span>
      </footer>

      <div v-if="schemaWarnings.length" class="workspace-warnings">
        <strong>规则校验</strong>
        <ul>
          <li v-for="item in schemaWarnings" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <aside class="spider-orchestration__config">
      <div class="config-panel">
        <div class="config-panel__head">
          <strong>节点配置</strong>
          <span>{{ selectedNodeMeta?.title || "未选中" }}</span>
        </div>

        <template v-if="selectedNodeMeta">
          <div class="config-panel__meta">
            <span>{{ selectedNodeMeta.type }}</span>
            <strong>{{ selectedNodeMeta.title }}</strong>
          </div>

          <div class="config-form">
            <label class="config-form__item">
              <span>节点标题</span>
              <input v-model="selectedNodeTitle" type="text" />
            </label>

            <template v-if="selectedNodeMeta.type === 'PAGE_ACCESS'">
              <label class="config-form__item">
                <span>目标地址</span>
                <input v-model="selectedNodeConfig.targetUrl" type="text" />
              </label>
              <label class="config-form__item">
                <span>访问模式</span>
                <select v-model="selectedNodeConfig.accessMode">
                  <option value="HTTP">HTTP</option>
                  <option value="PLAYWRIGHT">PLAYWRIGHT</option>
                </select>
              </label>
              <label class="config-form__item">
                <span>超时(秒)</span>
                <input v-model.number="selectedNodeConfig.timeoutSeconds" type="number" min="1" />
              </label>
              <label class="config-form__switch">
                <span>需要登录</span>
                <input v-model="selectedNodeConfig.loginRequired" type="checkbox" />
                <em>{{ selectedNodeConfig.loginRequired ? "开启" : "关闭" }}</em>
              </label>
              <label class="config-form__item">
                <span>Cookie JSON</span>
                <textarea v-model="selectedNodeConfig.cookieJson" rows="3" />
              </label>
              <label class="config-form__item">
                <span>Header JSON</span>
                <textarea v-model="selectedNodeConfig.headerJson" rows="3" />
              </label>
              <label class="config-form__item">
                <span>代理引用</span>
                <input v-model="selectedNodeConfig.proxyRef" type="text" />
              </label>
            </template>

            <template v-else-if="selectedNodeMeta.type === 'URL_PARSE'">
              <label class="config-form__item">
                <span>解析模式</span>
                <select v-model="selectedNodeConfig.parseMode">
                  <option value="AUTO_LINKS">AUTO_LINKS</option>
                  <option value="CSS">CSS</option>
                  <option value="XPATH">XPATH</option>
                  <option value="REGEX">REGEX</option>
                  <option value="AI">AI</option>
                </select>
              </label>
              <label class="config-form__item">
                <span>选择器/规则</span>
                <input v-model="selectedNodeConfig.selector" type="text" />
              </label>
              <label class="config-form__item">
                <span>AI 提示</span>
                <textarea v-model="selectedNodeConfig.aiPrompt" rows="4" />
              </label>
              <label class="config-form__item">
                <span>最大抽取数</span>
                <input v-model.number="selectedNodeConfig.collectLimit" type="number" min="1" />
              </label>
              <label class="config-form__switch">
                <span>去重后入队</span>
                <input v-model="selectedNodeConfig.dedupBeforeQueue" type="checkbox" />
                <em>{{ selectedNodeConfig.dedupBeforeQueue ? "开启" : "关闭" }}</em>
              </label>
            </template>

            <template v-else-if="selectedNodeMeta.type === 'DATA_PARSE'">
              <label class="config-form__item">
                <span>解析模式</span>
                <select v-model="selectedNodeConfig.parseMode">
                  <option value="XPATH">XPATH</option>
                  <option value="CSS">CSS</option>
                  <option value="AI">AI</option>
                  <option value="VISUAL">VISUAL</option>
                </select>
              </label>
              <label class="config-form__item">
                <span>字段映射</span>
                <textarea v-model="selectedNodeConfig.fieldMapping" rows="5" />
              </label>
              <label class="config-form__item">
                <span>XPath/CSS/AI 规则</span>
                <textarea v-model="selectedNodeConfig.selector" rows="4" />
              </label>
              <label class="config-form__switch">
                <span>可视化 XPath</span>
                <input v-model="selectedNodeConfig.visualXPathEnabled" type="checkbox" />
                <em>{{ selectedNodeConfig.visualXPathEnabled ? "开启" : "关闭" }}</em>
              </label>
            </template>

            <template v-else-if="selectedNodeMeta.type === 'CONDITION'">
              <label class="config-form__item">
                <span>条件表达式</span>
                <textarea v-model="selectedNodeConfig.expression" rows="4" />
              </label>
              <label class="config-form__item">
                <span>满足分支文案</span>
                <input v-model="selectedNodeConfig.trueLabel" type="text" />
              </label>
              <label class="config-form__item">
                <span>不满足分支文案</span>
                <input v-model="selectedNodeConfig.falseLabel" type="text" />
              </label>
            </template>

            <template v-else-if="selectedNodeMeta.type === 'SUB_FLOW'">
              <label class="config-form__item">
                <span>子流程编码</span>
                <input v-model="selectedNodeConfig.subFlowCode" type="text" />
              </label>
              <label class="config-form__item">
                <span>进入条件</span>
                <textarea v-model="selectedNodeConfig.entryCondition" rows="4" />
              </label>
            </template>

            <template v-else-if="selectedNodeMeta.type === 'HUMAN_INTERVENE'">
              <label class="config-form__item">
                <span>人工任务类型</span>
                <input v-model="selectedNodeConfig.taskType" type="text" />
              </label>
              <label class="config-form__item">
                <span>人工提示文案</span>
                <textarea v-model="selectedNodeConfig.taskPrompt" rows="4" />
              </label>
              <label class="config-form__item">
                <span>通知通道</span>
                <input v-model="selectedNodeConfig.notifyChannel" type="text" />
              </label>
            </template>

            <template v-else-if="selectedNodeMeta.type === 'SAVE_RESULT'">
              <label class="config-form__item">
                <span>结果结构编码</span>
                <input v-model="selectedNodeConfig.schemaCode" type="text" />
              </label>
              <label class="config-form__switch">
                <span>同步业务表</span>
                <input v-model="selectedNodeConfig.syncBusinessTable" type="checkbox" />
                <em>{{ selectedNodeConfig.syncBusinessTable ? "开启" : "关闭" }}</em>
              </label>
            </template>

            <label v-for="field in selectedNodeExtraSchema" :key="field.field" class="config-form__item">
              <span>{{ field.label }}</span>
              <input
                v-if="field.component === 'input'"
                v-model="selectedNodeConfig[field.field]"
                type="text"
              />
              <textarea
                v-else-if="field.component === 'textarea'"
                v-model="selectedNodeConfig[field.field]"
                rows="4"
              />
              <select
                v-else-if="field.component === 'select'"
                v-model="selectedNodeConfig[field.field]"
              >
                <option
                  v-for="option in field.options || []"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <input
                v-else-if="field.component === 'number'"
                v-model.number="selectedNodeConfig[field.field]"
                type="number"
              />
              <label v-else-if="field.component === 'switch'" class="config-form__switch">
                <input
                  v-model="selectedNodeConfig[field.field]"
                  type="checkbox"
                />
                <em>{{ selectedNodeConfig[field.field] ? "开启" : "关闭" }}</em>
              </label>
            </label>
          </div>

          <div class="config-panel__actions">
            <button type="button" class="is-secondary" @click="removeSelectedNode">删除节点</button>
            <button type="button" @click="saveSelectedNodeConfig">保存配置</button>
          </div>
        </template>

        <div v-else class="config-panel__empty">
          点击右侧画板中的节点后，在这里配置节点参数。
        </div>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { ScReteEditor, type EditorData, type NodeTypeName } from "@repo/components/ScReteEditor";
import {
  baiduPanExampleFlow,
  giteeExploreExampleFlow,
  giteeMineExampleFlow,
  spiderNodePalette,
} from "../../../index";
import {
  getSpiderOrchestrationSchema,
  listSpiderDefinitions,
  saveSpiderOrchestrationSchema,
} from "../../../api/spider";
import type {
  SpiderDefinition,
  SpiderFlowNode,
  SpiderFlowSchema,
  SpiderNodeConfigSchemaField,
  SpiderNodeType,
} from "../../../types/orchestration";

type SpiderNodeMeta = {
  id: string;
  type: SpiderNodeType;
  title: string;
  config: Record<string, any>;
};

const exampleFlows = ref<Array<Pick<SpiderFlowSchema, "spiderDefinitionCode" | "spiderFlowName">>>([]);
const localFlowFallbackMap: Record<string, SpiderFlowSchema> = {
  "baidu-pan-all-files": baiduPanExampleFlow,
  "gitee-explore-1000-projects": giteeExploreExampleFlow,
  "gitee-my-projects": giteeMineExampleFlow,
};
const activeSpiderId = ref<number | null>(null);

const editorTypeMap: Record<SpiderNodeType, NodeTypeName> = {
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

const editorRef = ref<InstanceType<typeof ScReteEditor>>();
const canvasShellRef = ref<HTMLElement | null>(null);
const activeFlow = ref<SpiderFlowSchema>({
  spiderDefinitionCode: "",
  spiderFlowVersion: 1,
  spiderFlowName: "",
  spiderFlowScope: "PRIVATE",
  nodes: [],
  edges: [],
});
const editorData = ref<EditorData>({ nodes: [], connections: [] });
const draggedNodeType = ref<SpiderNodeType | null>(null);
const nodeMetaMap = ref<Record<string, SpiderNodeMeta>>({});
const selectedNodeId = ref("");
const selectedNodeTitle = ref("");
const selectedNodeConfig = ref<Record<string, any>>({});
const orchestrationMessage = ref("");
const applyingConnectionRules = ref(false);

const selectedNodeMeta = computed(() => nodeMetaMap.value[selectedNodeId.value] || null);
const selectedNodeSchema = computed<SpiderNodeConfigSchemaField[]>(() => {
  const meta = selectedNodeMeta.value;
  if (!meta) {
    return [];
  }
  return spiderNodePalette.find(item => item.type === meta.type)?.schema || [];
});
const selectedNodeExtraSchema = computed(() => {
  const meta = selectedNodeMeta.value;
  if (!meta) {
    return [];
  }
  const handledFields = new Set<string>(["title"]);
  switch (meta.type) {
    case "PAGE_ACCESS":
      ["targetUrl", "accessMode", "timeoutSeconds", "loginRequired", "cookieJson", "headerJson", "proxyRef"].forEach(item => handledFields.add(item));
      break;
    case "URL_PARSE":
      ["parseMode", "selector", "aiPrompt", "collectLimit", "dedupBeforeQueue"].forEach(item => handledFields.add(item));
      break;
    case "DATA_PARSE":
      ["parseMode", "fieldMapping", "selector", "visualXPathEnabled"].forEach(item => handledFields.add(item));
      break;
    case "CONDITION":
      ["expression", "trueLabel", "falseLabel"].forEach(item => handledFields.add(item));
      break;
    case "SUB_FLOW":
      ["subFlowCode", "entryCondition"].forEach(item => handledFields.add(item));
      break;
    case "HUMAN_INTERVENE":
      ["taskType", "taskPrompt", "notifyChannel"].forEach(item => handledFields.add(item));
      break;
    case "SAVE_RESULT":
      ["schemaCode", "syncBusinessTable"].forEach(item => handledFields.add(item));
      break;
    case "START":
      handledFields.add("entryUrl");
      break;
    default:
      break;
  }
  return selectedNodeSchema.value.filter(item => !handledFields.has(item.field));
});
const edgeOutline = computed(() =>
  editorData.value.connections.map((item, index) => {
    const source = nodeMetaMap.value[item.sourceId]?.title || item.sourceId;
    const target = nodeMetaMap.value[item.targetId]?.title || item.targetId;
    const sourceMeta = nodeMetaMap.value[item.sourceId];
    const label = resolveEdgeLabel(item.sourceOutput, sourceMeta, index);
    return {
      id: `${item.sourceId}-${item.targetId}-${index}`,
      label,
      detail: `${source} [${item.sourceOutput}] → ${target} [${item.targetInput}]`,
    };
  }),
);
const edgeBadges = computed(() =>
  editorData.value.connections
    .map((item, index) => {
      const source = editorData.value.nodes.find(node => node.id === item.sourceId);
      const target = editorData.value.nodes.find(node => node.id === item.targetId);
      if (!source || !target) {
        return null;
      }
      const sourceMeta = nodeMetaMap.value[item.sourceId];
      return {
        id: `${item.sourceId}-${item.targetId}-${index}`,
        label: resolveEdgeLabel(item.sourceOutput, sourceMeta, index),
        left: (source.position.x + target.position.x) / 2 + 24,
        top: (source.position.y + target.position.y) / 2 + 6,
      };
    })
    .filter(Boolean) as Array<{ id: string; label: string; left: number; top: number }>,
);
const schemaWarnings = computed(() => {
  const warnings: string[] = [];
  const nodeTypeById = Object.fromEntries(
    Object.values(nodeMetaMap.value).map(item => [item.id, item.type]),
  ) as Record<string, SpiderNodeType>;
  for (const edge of editorData.value.connections) {
    const sourceType = nodeTypeById[edge.sourceId];
    const targetType = nodeTypeById[edge.targetId];
    if (!sourceType || !targetType) {
      warnings.push(`连接 ${edge.sourceId} -> ${edge.targetId} 存在无效节点`);
      continue;
    }
    if (sourceType === "END") {
      warnings.push(`结束节点 ${edge.sourceId} 不能继续输出`);
    }
    if (sourceType === "CONDITION" && !["true", "false"].includes(edge.sourceOutput)) {
      warnings.push(`条件节点 ${edge.sourceId} 只能从 true/false 端口输出`);
    }
    if (sourceType !== "CONDITION" && edge.sourceOutput !== "output") {
      warnings.push(`节点 ${edge.sourceId} 应使用 output 端口输出`);
    }
    if (targetType !== "END" && edge.targetInput !== "input") {
      warnings.push(`节点 ${edge.targetId} 应使用 input 端口接入`);
    }
    if (sourceType === "END") {
      warnings.push(`结束节点 ${edge.sourceId} 不允许作为上游节点`);
    }
  }
  return Array.from(new Set(warnings));
});

const buildNodeControls = (nodeType: SpiderNodeType, config: Record<string, unknown>) => {
  if (nodeType === "CONDITION") {
    return {
      condition: String(config.expression || ""),
      ...config,
    };
  }
  if (nodeType === "HUMAN_INTERVENE") {
    return {
      delay: 1000,
      ...config,
    };
  }
  return { ...config };
};
const resolveEdgeLabel = (
  sourceOutput: string,
  sourceMeta: SpiderNodeMeta | undefined,
  index: number,
) => {
  if (sourceOutput === "true") {
    return String(sourceMeta?.config?.trueLabel || "满足");
  }
  if (sourceOutput === "false") {
    return String(sourceMeta?.config?.falseLabel || "不满足");
  }
  return `链路 ${index + 1}`;
};
const createDefaultConfig = (nodeType: SpiderNodeType): Record<string, any> => {
  switch (nodeType) {
    case "PAGE_ACCESS":
      return {
        accessMode: "HTTP",
        targetUrl: "",
        loginRequired: false,
        timeoutSeconds: 30,
        cookieJson: "",
        headerJson: "",
        proxyRef: "",
      };
    case "URL_PARSE":
      return {
        parseMode: "AUTO_LINKS",
        selector: "",
        aiPrompt: "",
        collectLimit: 1000,
        dedupBeforeQueue: true,
      };
    case "DATA_PARSE":
      return {
        parseMode: "AI",
        fieldMapping: "",
        selector: "",
        visualXPathEnabled: false,
      };
    case "CONDITION":
      return { expression: "", trueLabel: "满足", falseLabel: "不满足" };
    case "SUB_FLOW":
      return { subFlowCode: "", entryCondition: "" };
    case "HUMAN_INTERVENE":
      return { taskType: "CAPTCHA", taskPrompt: "", notifyChannel: "lay-task" };
    case "SAVE_RESULT":
      return { schemaCode: "", syncBusinessTable: false };
    case "START":
      return { entryUrl: "" };
    default:
      return {};
  }
};
const collectConnectionDiagnostics = (connections: EditorData["connections"]) => {
  const warnings: string[] = [];
  const validConnections: EditorData["connections"] = [];
  const nodeTypeById = Object.fromEntries(
    Object.values(nodeMetaMap.value).map(item => [item.id, item.type]),
  ) as Record<string, SpiderNodeType>;

  for (const edge of connections) {
    const sourceType = nodeTypeById[edge.sourceId];
    const targetType = nodeTypeById[edge.targetId];
    let warning = "";

    if (!sourceType || !targetType) {
      warning = `连接 ${edge.sourceId} -> ${edge.targetId} 存在无效节点`;
    } else if (sourceType === "END") {
      warning = `结束节点 ${edge.sourceId} 不能继续输出`;
    } else if (targetType === "START") {
      warning = `开始节点 ${edge.targetId} 不能作为下游节点`;
    } else if (sourceType === "CONDITION" && !["true", "false"].includes(edge.sourceOutput)) {
      warning = `条件节点 ${edge.sourceId} 只能从 true/false 端口输出`;
    } else if (sourceType !== "CONDITION" && edge.sourceOutput !== "output") {
      warning = `节点 ${edge.sourceId} 应使用 output 端口输出`;
    } else if (edge.targetInput !== "input") {
      warning = `节点 ${edge.targetId} 应使用 input 端口接入`;
    }

    if (warning) {
      warnings.push(warning);
      continue;
    }
    validConnections.push(edge);
  }

  return {
    warnings: Array.from(new Set(warnings)),
    validConnections,
  };
};

const seedMetaFromFlow = (flow: SpiderFlowSchema) => {
  const nextMeta: Record<string, SpiderNodeMeta> = {};
  flow.nodes.forEach((item: SpiderFlowNode) => {
    nextMeta[item.id] = {
      id: item.id,
      type: item.type,
      title: item.title,
      config: { ...item.config },
    };
  });
  nodeMetaMap.value = nextMeta;
};

const buildSchemaFromEditor = (): SpiderFlowSchema => {
  const current = editorRef.value?.getData() || editorData.value;
  return {
    spiderDefinitionCode: activeFlow.value.spiderDefinitionCode,
    spiderFlowVersion: activeFlow.value.spiderFlowVersion,
    spiderFlowName: activeFlow.value.spiderFlowName,
    spiderFlowScope: activeFlow.value.spiderFlowScope,
    nodes: current.nodes.map(item => ({
      id: item.id,
      type: nodeMetaMap.value[item.id]?.type || "PAGE_ACCESS",
      title: item.label,
      position: item.position,
      config: nodeMetaMap.value[item.id]?.config || {},
    })),
    edges: current.connections.map((item, index) => ({
      id: `edge-${index + 1}`,
      source: item.sourceId,
      target: item.targetId,
      sourceOutput: item.sourceOutput,
      targetInput: item.targetInput,
      label: resolveEdgeLabel(item.sourceOutput, nodeMetaMap.value[item.sourceId], index),
    })),
  };
};
const patchEditorData = (data: EditorData) => {
  editorData.value.nodes = data.nodes;
  editorData.value.connections = data.connections;
};

function convertFlowToEditorData(flow: SpiderFlowSchema): EditorData {
  return {
    nodes: flow.nodes.map(item => ({
      id: item.id,
      type: editorTypeMap[item.type],
      label: item.title,
      position: item.position,
      controls: buildNodeControls(item.type, item.config),
    })),
    connections: flow.edges.map(item => ({
      sourceId: item.source,
      sourceOutput: item.sourceOutput || resolveSourceOutput(item.source, flow),
      targetId: item.target,
      targetInput: item.targetInput || resolveTargetInput(item.target, flow),
    })),
  };
}

function resolveSourceOutput(nodeId: string, flow: SpiderFlowSchema) {
  const node = flow.nodes.find(item => item.id === nodeId);
  if (node?.type === "CONDITION") {
    return "true";
  }
  return "output";
}

function resolveTargetInput(nodeId: string, flow: SpiderFlowSchema) {
  return "input";
}

const resetEditorData = async (flow: SpiderFlowSchema) => {
  activeFlow.value = flow;
  seedMetaFromFlow(flow);
  editorData.value = convertFlowToEditorData(flow);
  selectedNodeId.value = "";
  selectedNodeTitle.value = "";
  selectedNodeConfig.value = {};
  await nextTick();
  await editorRef.value?.loadData(editorData.value);
  editorRef.value?.zoomToFit();
};

const selectFlow = async (flow: SpiderFlowSchema) => {
  await resetEditorData(flow);
};

const handleNodeDragStart = (nodeType: SpiderNodeType) => {
  draggedNodeType.value = nodeType;
};

const createNodeAtPosition = async (nodeType: SpiderNodeType, position: { x: number; y: number }) => {
  if (!editorRef.value) {
    return;
  }
  const nodePalette = spiderNodePalette.find(item => item.type === nodeType);
  const node = await editorRef.value.addNode(editorTypeMap[nodeType], nodePalette?.title, position);
  if (!node || !nodePalette) {
    return;
  }
  nodeMetaMap.value = {
    ...nodeMetaMap.value,
    [node.id]: {
      id: node.id,
      type: nodeType,
      title: nodePalette.title,
      config: Object.fromEntries(
        nodePalette.schema.map(field => [field.field, field.component === "switch" ? false : ""]),
      ),
    },
  };
  nodeMetaMap.value[node.id].config = {
    ...createDefaultConfig(nodeType),
    ...nodeMetaMap.value[node.id].config,
  };
};

const handleNodeDoubleClick = async (nodeType: SpiderNodeType) => {
  const offset = editorData.value.nodes.length * 18;
  await createNodeAtPosition(nodeType, {
    x: 180 + (offset % 180),
    y: 140 + offset,
  });
};

const handleCanvasDrop = async (event: DragEvent) => {
  if (!draggedNodeType.value || !canvasShellRef.value) {
    return;
  }
  const rect = canvasShellRef.value.getBoundingClientRect();
  await createNodeAtPosition(draggedNodeType.value, {
    x: Math.max(40, event.clientX - rect.left - 120),
    y: Math.max(40, event.clientY - rect.top - 90),
  });
  draggedNodeType.value = null;
};

const handleNodeSelected = (node: { id: string } | null) => {
  selectedNodeId.value = node?.id || "";
  selectedNodeTitle.value = selectedNodeMeta.value?.title || "";
  selectedNodeConfig.value = selectedNodeMeta.value
    ? { ...selectedNodeMeta.value.config }
    : {};
};

const saveSelectedNodeConfig = async () => {
  const meta = selectedNodeMeta.value;
  if (!meta) {
    return;
  }
  nodeMetaMap.value = {
    ...nodeMetaMap.value,
    [meta.id]: {
      ...meta,
      title: selectedNodeTitle.value || meta.title,
      config: { ...selectedNodeConfig.value },
    },
  };
  patchEditorData({
    ...editorData.value,
    nodes: editorData.value.nodes.map(item => item.id === meta.id
      ? {
          ...item,
          label: selectedNodeTitle.value || item.label,
          controls: buildNodeControls(meta.type, selectedNodeConfig.value),
        }
      : item),
  });
  await nextTick();
  await editorRef.value?.loadData(editorData.value);
  orchestrationMessage.value = "节点配置已更新";
};

const removeSelectedNode = async () => {
  const meta = selectedNodeMeta.value;
  if (!meta) {
    return;
  }
  await editorRef.value?.removeNode(meta.id);
  const nextMeta = { ...nodeMetaMap.value };
  delete nextMeta[meta.id];
  nodeMetaMap.value = nextMeta;
  selectedNodeId.value = "";
  selectedNodeTitle.value = "";
  selectedNodeConfig.value = {};
};

const arrangeEditor = async () => {
  await editorRef.value?.arrange();
};

const zoomToFitEditor = () => {
  editorRef.value?.zoomToFit();
};

const resetEditor = async () => {
  await resetEditorData(activeFlow.value);
};

const emitEditorJson = () => {
  console.log("spider-editor-data", buildSchemaFromEditor());
};

const handleEditorChanged = (data: EditorData) => {
  if (applyingConnectionRules.value) {
    patchEditorData(data);
    return;
  }
  const diagnostics = collectConnectionDiagnostics(data.connections);
  if (diagnostics.validConnections.length !== data.connections.length) {
    orchestrationMessage.value = `已移除非法连接：${diagnostics.warnings[0]}`;
    applyingConnectionRules.value = true;
    patchEditorData({
      ...data,
      connections: diagnostics.validConnections,
    });
    nextTick(async () => {
      await editorRef.value?.loadData(editorData.value);
      applyingConnectionRules.value = false;
    });
    return;
  }
  patchEditorData(data);
};

const loadSchema = async (spiderDefinitionCode: string) => {
  try {
    const schema = await getSpiderOrchestrationSchema(spiderDefinitionCode, 1);
    await resetEditorData(schema);
    orchestrationMessage.value = "";
  } catch (error) {
    const fallback = localFlowFallbackMap[spiderDefinitionCode];
    if (fallback) {
      await resetEditorData(fallback);
      orchestrationMessage.value = `编排接口失败，已回退默认规则：${String(error)}`;
      return;
    }
    throw error;
  }
};

const saveSchema = async () => {
  if (schemaWarnings.value.length) {
    orchestrationMessage.value = `保存失败：${schemaWarnings.value[0]}`;
    return;
  }
  orchestrationMessage.value = "保存中...";
  const schema = buildSchemaFromEditor();
  const saved = await saveSpiderOrchestrationSchema(schema);
  await resetEditorData(saved);
  orchestrationMessage.value = "已保存";
};

const loadDefinitionEntries = async (preferredCode?: string | null) => {
  const definitions = await listSpiderDefinitions();
  const filteredDefinitions = activeSpiderId.value !== null
    ? definitions.filter(item => Number(item.spiderId || 0) === activeSpiderId.value)
    : definitions;
  exampleFlows.value = filteredDefinitions.map((item: SpiderDefinition) => ({
    spiderDefinitionCode: item.spiderCode,
    spiderFlowName: item.spiderName,
  }));
  const sourceDefinitions = filteredDefinitions.length ? filteredDefinitions : definitions;
  const currentCode = preferredCode && sourceDefinitions.some(item => item.spiderCode === preferredCode)
    ? preferredCode
    : sourceDefinitions[0]?.spiderCode;
  if (currentCode) {
    await loadSchema(currentCode);
    return;
  }
  orchestrationMessage.value = activeSpiderId.value !== null
    ? `未找到 spiderId=${activeSpiderId.value} 对应的爬虫`
    : "暂无可编排爬虫";
};

onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const spiderId = params.get("spiderId");
  const spiderCode = params.get("spiderCode") || params.get("spiderExample");
  activeSpiderId.value = spiderId ? Number(spiderId) : null;
  await loadDefinitionEntries(spiderCode);
});
</script>

<style scoped lang="scss">
.spider-orchestration {
  height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 320px;
  background: #edf1f5;
}

.spider-orchestration__sidebar,
.spider-orchestration__config {
  display: grid;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  overflow: auto;
}

.spider-orchestration__sidebar {
  border-right: 1px solid #dbe3ee;
  grid-template-rows: auto 1fr;
}

.spider-orchestration__config {
  border-left: 1px solid #dbe3ee;
}

.sidebar-panel,
.workspace-toolbar,
.workspace-status,
.config-panel {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.sidebar-panel,
.config-panel {
  padding: 12px;
}

.sidebar-panel__head,
.config-panel__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;

  strong {
    color: #0f172a;
    font-size: 13px;
  }

  span {
    color: #94a3b8;
    font-size: 11px;
    text-align: right;
  }
}

.example-list,
.node-library,
.config-form {
  display: grid;
  gap: 8px;
}

.example-list__item,
.node-library__item {
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  text-align: left;
}

.example-list__item {
  cursor: pointer;

  &.is-active {
    border-color: #bae6fd;
    background: #f0f9ff;
  }
}

.example-list__item strong,
.node-library__item strong {
  color: #0f172a;
  font-size: 12px;
}

.example-list__item small,
.node-library__item p,
.node-library__item small {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.node-library__item {
  cursor: grab;
}

.node-library__tag {
  display: inline-flex;
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.spider-orchestration__workspace {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 10px;
  padding: 10px;
  min-width: 0;
  min-height: 0;
}

.workspace-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.workspace-toolbar__title {
  display: grid;
  gap: 2px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }

  span {
    color: #64748b;
    font-size: 11px;
  }
}

.workspace-toolbar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    height: 30px;
    padding: 0 12px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #0f172a;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }

  .is-secondary {
    background: #fff;
    color: #334155;
  }
}

.workspace-toolbar__center {
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
}

.workspace-canvas {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.workspace-canvas__edge-badges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.edge-badge {
  position: absolute;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #334155;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  white-space: nowrap;
}

.workspace-canvas :deep(.sc-rete-editor) {
  height: 100%;
  min-height: 0;
  border-radius: 12px;
}

.workspace-status {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 12px;
  color: #64748b;
  font-size: 11px;
}

.config-panel {
  display: grid;
  align-content: start;
  gap: 10px;
}

.config-panel__meta {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 10px;
  background: #f8fafc;

  span {
    color: #0f766e;
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: #0f172a;
    font-size: 13px;
  }
}

.config-form__item {
  display: grid;
  gap: 4px;

  span {
    color: #64748b;
    font-size: 11px;
  }

  input,
  textarea,
  select {
    width: 100%;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    padding: 8px 10px;
    background: #fff;
    color: #0f172a;
    font-size: 12px;
  }
}

.config-form__switch {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    width: 16px;
    height: 16px;
  }

  em {
    font-style: normal;
    color: #475569;
    font-size: 12px;
  }
}

.config-panel__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    height: 30px;
    padding: 0 12px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #0f172a;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }

  .is-secondary {
    background: #fff;
    color: #334155;
  }
}

.config-panel__empty {
  min-height: 160px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

@media (max-width: 980px) {
  .spider-orchestration {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr) auto;
  }

  .spider-orchestration__config {
    border-left: 0;
    border-top: 1px solid #dbe3ee;
  }

  .spider-orchestration__sidebar {
    border-right: 0;
    border-bottom: 1px solid #dbe3ee;
  }

  .workspace-toolbar,
  .workspace-status {
    flex-wrap: wrap;
  }
}
</style>
