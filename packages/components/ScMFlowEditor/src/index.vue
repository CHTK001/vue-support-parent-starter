<template>
  <section class="sc-mflow-editor">
    <aside class="sc-mflow-editor__sidebar thin-scroller">
      <div class="mflow-panel">
        <div class="mflow-panel__head">
          <strong>流程</strong>
          <span>{{ modelValue.flowName }}</span>
        </div>
        <div v-if="entityId !== null && entityId !== undefined" class="mflow-single">
          <strong>{{ modelValue.flowName || entityCode || "当前流程" }}</strong>
          <small>id={{ entityId }}</small>
          <small v-if="entityCode">{{ entityCode }}</small>
        </div>
        <div v-else-if="flowEntries.length" class="mflow-entry-list">
          <button
            v-for="item in flowEntries"
            :key="item.flowCode"
            type="button"
            class="mflow-entry-list__item"
            :class="{ 'is-active': item.flowCode === modelValue.flowCode }"
            @click="handleSelectFlow(item.flowCode)"
          >
            <strong>{{ item.flowName }}</strong>
            <small>{{ item.flowCode }}</small>
          </button>
        </div>
        <div v-else class="mflow-empty">暂无数据</div>
      </div>

      <div class="mflow-panel">
        <div class="mflow-panel__head">
          <strong>节点库</strong>
          <span>{{ palette.length }} 类</span>
        </div>
        <div class="mflow-node-library" :class="`is-${paletteDisplayMode}`">
          <article
            v-for="item in visiblePalette"
            :key="item.kind"
            class="mflow-node-library__item"
            draggable="true"
            @dragstart="handleNodeDragStart(item.kind)"
            @dblclick="handleNodeDoubleClick(item.kind)"
          >
            <div class="mflow-node-library__visual" :style="{ '--item-color': item.color }">
              <img v-if="item.image" :src="item.image" alt="" />
              <IconifyIconOnline v-else :icon="item.icon || 'ri:box-3-line'" />
            </div>
            <div class="mflow-node-library__content">
              <strong>{{ item.title }}</strong>
              <p>{{ item.detail }}</p>
              <small>拖拽或双击投放到右侧画板</small>
            </div>
          </article>
        </div>
      </div>
    </aside>

    <section class="sc-mflow-editor__workspace">
      <header class="mflow-toolbar">
        <div class="mflow-toolbar__title">
          <strong>{{ modelValue.flowName || "编排器" }}</strong>
          <span v-if="displayMessage">{{ displayMessage }}</span>
          <span v-else>点击节点后显示右侧配置</span>
        </div>
        <div class="mflow-toolbar__actions">
          <slot name="toolbar-actions" :save="handleSave" :delete-flow="handleDelete">
            <button type="button" class="mflow-toolbar__icon-btn" title="保存编排" @click="handleSave">
              <IconifyIconOnline icon="ri:save-3-line" />
            </button>
            <button
              v-if="showDeleteAction"
              type="button"
              class="mflow-toolbar__icon-btn is-secondary"
              title="删除编排"
              @click="handleDelete"
            >
              <IconifyIconOnline icon="ri:delete-bin-7-line" />
            </button>
          </slot>
        </div>
      </header>

      <div
        ref="canvasShellRef"
        class="mflow-canvas"
        @click="closeEdgeMenu"
        @contextmenu.self.prevent="closeEdgeMenu"
        @dragover.prevent
        @drop.prevent="handleCanvasDrop"
      >
        <ScFlowEditor
          ref="editorRef"
          v-model="editorData"
          :show-toolbar="true"
          :show-node-panel="false"
          :show-property-panel="false"
          :show-statusbar="true"
          :minimap="true"
          :context-menu="false"
          :auto-arrange="false"
          :fit-view-on-init="true"
          background="dots"
          :zoom="{ min: 0.2, max: 2 }"
          :node-menu-items="[]"
          @data-changed="handleEditorChanged"
          @node-selected="handleNodeSelected"
          @edge-contextmenu="handleEdgeContextMenu"
        >
          <template #toolbar-center>
            <span class="mflow-toolbar__center">{{ modelValue.flowCode || "MFlow" }}</span>
          </template>
          <template #node="nodeProps">
            <slot name="node" v-bind="buildNodeSlotProps(nodeProps)">
              <SpiderNode
                :id="nodeProps.id"
                :data="nodeProps.data"
                :selected="Boolean(nodeProps.selected)"
                :readonly="false"
              />
            </slot>
          </template>
        </ScFlowEditor>
        <div
          v-if="edgeMenu.visible"
          class="mflow-edge-menu"
          :style="{ left: `${edgeMenu.x}px`, top: `${edgeMenu.y}px` }"
        >
          <button type="button" class="mflow-edge-menu__item" @click.stop="removeEdgeByMenu">
            删除连线
          </button>
        </div>
      </div>

      <ScMFlowConfigPanel
        :visible="showConfigPanel"
        :node-meta="selectedNodeMeta"
        :node-title="selectedNodeTitle"
        :node-config="selectedNodeConfig"
        :schema="selectedNodeSchema"
        :update-title="updateSelectedNodeTitle"
        :update-config="updateSelectedNodeField"
        :save-config="saveSelectedNodeConfig"
        :remove-node="removeSelectedNode"
        @close="closeConfigPanel"
      >
        <template #config-panel="slotProps">
          <slot name="config-panel" v-bind="slotProps" />
        </template>
      </ScMFlowConfigPanel>

      <footer class="mflow-status">
        <span>节点 {{ editorData.nodes.length }}</span>
        <span>连接 {{ editorData.connections.length }}</span>
        <span>版本 {{ modelValue.flowVersion }}</span>
        <span>{{ modelValue.flowScope || "PRIVATE" }}</span>
        <span v-if="schemaWarnings.length" class="is-warning">规则告警 {{ schemaWarnings.length }}</span>
      </footer>

      <div v-if="schemaWarnings.length" class="mflow-warnings">
        <strong>规则校验</strong>
        <ul>
          <li v-for="item in schemaWarnings" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { IconifyIconOnline } from "../../ReIcon";
import { ScFlowEditor, type EditorData } from "../../ScFlowEditor";
import SpiderNode from "../../ScFlowEditor/components/SpiderNode.vue";
import ScMFlowConfigPanel from "./ScMFlowConfigPanel.vue";
import type {
  ScMFlowEntry,
  ScMFlowNodeMeta,
  ScMFlowPaletteItem,
  ScMFlowSchema,
} from "../types";

defineOptions({ name: "ScMFlowEditor" });

const props = withDefaults(defineProps<{
  modelValue: ScMFlowSchema;
  flowEntries?: ScMFlowEntry[];
  palette: ScMFlowPaletteItem[];
  statusMessage?: string;
  entityId?: string | number | null;
  entityCode?: string;
  paletteDisplayMode?: "default" | "icon";
  showDeleteAction?: boolean;
  hiddenPaletteKinds?: string[];
  loadFlow?: (flowCode: string) => Promise<ScMFlowSchema>;
  saveFlow?: (flow: ScMFlowSchema) => Promise<ScMFlowSchema | void>;
  deleteFlow?: (flowCode: string) => Promise<void>;
  validateBeforeSave?: (flow: ScMFlowSchema, context: { editorData: EditorData; metaMap: Record<string, ScMFlowNodeMeta> }) => string | null | Promise<string | null>;
}>(), {
  flowEntries: () => [],
  statusMessage: "",
  entityId: null,
  entityCode: "",
  paletteDisplayMode: "icon",
  showDeleteAction: false,
  hiddenPaletteKinds: () => [],
  loadFlow: undefined,
  saveFlow: undefined,
  deleteFlow: undefined,
  validateBeforeSave: undefined,
});

const emit = defineEmits<{
  "update:modelValue": [value: ScMFlowSchema];
  save: [value: ScMFlowSchema];
  export: [value: ScMFlowSchema];
  delete: [flowCode: string];
  "select-flow": [flowCode: string];
}>();

const editorRef = ref<InstanceType<typeof ScFlowEditor>>();
const canvasShellRef = ref<HTMLElement | null>(null);
const editorData = ref<EditorData>({ nodes: [], connections: [] });
const nodeMetaMap = ref<Record<string, ScMFlowNodeMeta>>({});
const draggedNodeKind = ref<string | null>(null);
const selectedNodeId = ref("");
const selectedNodeTitle = ref("");
const selectedNodeConfig = ref<Record<string, any>>({});
const configPanelVisible = ref(false);
const internalMessage = ref("");
const applyingConnectionRules = ref(false);
const syncingFromParent = ref(false);
let pendingModelValue: ScMFlowSchema | null = null;
const currentSignature = ref("");
const edgeMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  edgeId: "",
});
const settlingFromReset = ref(false);

const displayMessage = computed(() => internalMessage.value || props.statusMessage);
const selectedNodeMeta = computed(() => nodeMetaMap.value[selectedNodeId.value] || null);
const showConfigPanel = computed(() => configPanelVisible.value && Boolean(selectedNodeMeta.value));
const paletteByKind = computed<Record<string, ScMFlowPaletteItem>>(() =>
  Object.fromEntries(props.palette.map(item => [item.kind, item])),
);
const visiblePalette = computed(() =>
  props.palette.filter(item => !props.hiddenPaletteKinds.includes(item.kind)),
);
const selectedNodeSchema = computed(() => {
  const meta = selectedNodeMeta.value;
  return meta ? (paletteByKind.value[meta.kind]?.schema || []) : [];
});
const schemaWarnings = computed(() => {
  const warnings: string[] = [];
  const paletteMap = paletteByKind.value;
  const targetPortIds = new Map<string, Set<string>>();
  const sourcePortIds = new Map<string, Set<string>>();
  Object.entries(nodeMetaMap.value).forEach(([id, meta]) => {
    const ports = paletteMap[meta.kind]?.ports || [];
    targetPortIds.set(id, new Set(ports.filter(item => item.side === "left" || item.side === "top").map(item => mapPortId(item.id, "input"))));
    sourcePortIds.set(id, new Set(ports.filter(item => item.side === "right" || item.side === "bottom").map(item => mapPortId(item.id, "output"))));
  });
  for (const edge of editorData.value.connections) {
    const sourceMeta = nodeMetaMap.value[edge.sourceId];
    const targetMeta = nodeMetaMap.value[edge.targetId];
    if (!sourceMeta || !targetMeta) {
      warnings.push(`连接 ${edge.sourceId} -> ${edge.targetId} 存在无效节点`);
      continue;
    }
    if (!sourcePortIds.get(edge.sourceId)?.has(edge.sourceOutput)) {
      warnings.push(`节点 ${sourceMeta.title} 的输出端口 ${edge.sourceOutput} 无效`);
    }
    if (!targetPortIds.get(edge.targetId)?.has(edge.targetInput)) {
      warnings.push(`节点 ${targetMeta.title} 的输入端口 ${edge.targetInput} 无效`);
    }
  }
  return Array.from(new Set(warnings));
});

const mapPortId = (id: string, fallback: string) => {
  if (id === "in") return "input";
  if (id === "out") return "output";
  if (id === "true") return "pass";
  if (id === "false") return "reject";
  return id || fallback;
};

const resolveDefaultSourceOutput = (nodeId: string, flow: ScMFlowSchema) => {
  const node = flow.nodes.find(item => item.id === nodeId);
  const ports = paletteByKind.value[node?.kind || ""]?.ports || [];
  const sourcePort = ports.find(item => item.side === "right" || item.side === "bottom");
  return mapPortId(sourcePort?.id || "", "output");
};

const resolveEdgeLabel = (edge: EditorData["connections"][number], index: number) => {
  const meta = nodeMetaMap.value[edge.sourceId];
  const port = paletteByKind.value[meta?.kind || ""]?.ports.find(item => mapPortId(item.id, "output") === edge.sourceOutput);
  return port?.label || `链路 ${index + 1}`;
};

const convertFlowToEditorData = (flow: ScMFlowSchema): EditorData => ({
  nodes: flow.nodes.map(item => {
    const paletteItem = paletteByKind.value[item.kind];
    return {
      id: item.id,
      type: paletteItem?.editorType || "process",
      label: item.title,
      position: item.position,
      controls: { ...item.config },
      shape: paletteItem?.shape,
      icon: item.icon || paletteItem?.icon,
      image: item.image || paletteItem?.image,
      color: paletteItem?.color,
    };
  }),
  connections: flow.edges.map(item => ({
    sourceId: item.source,
    sourceOutput: item.sourceOutput || resolveDefaultSourceOutput(item.source, flow),
    targetId: item.target,
    targetInput: item.targetInput || "input",
  })),
});

const seedMetaFromFlow = (flow: ScMFlowSchema) => {
  const nextMeta: Record<string, ScMFlowNodeMeta> = {};
  flow.nodes.forEach(item => {
    const paletteItem = paletteByKind.value[item.kind];
    nextMeta[item.id] = {
      id: item.id,
      kind: item.kind,
      title: item.title,
      config: { ...item.config },
      icon: item.icon || paletteItem?.icon,
      image: item.image || paletteItem?.image,
    };
  });
  nodeMetaMap.value = nextMeta;
};

const buildSchemaFromEditor = (): ScMFlowSchema => {
  const current = editorRef.value?.getData() || editorData.value;
  return {
    flowCode: props.modelValue.flowCode,
    flowVersion: props.modelValue.flowVersion,
    flowName: props.modelValue.flowName,
    flowScope: props.modelValue.flowScope,
    nodes: current.nodes.map(item => ({
      id: item.id,
      kind: nodeMetaMap.value[item.id]?.kind || "PROCESS",
      title: item.label,
      position: item.position,
      config: nodeMetaMap.value[item.id]?.config || {},
      icon: nodeMetaMap.value[item.id]?.icon,
      image: nodeMetaMap.value[item.id]?.image,
    })),
    edges: current.connections.map((item, index) => ({
      id: `edge-${index + 1}`,
      source: item.sourceId,
      target: item.targetId,
      sourceOutput: item.sourceOutput,
      targetInput: item.targetInput,
      label: resolveEdgeLabel(item, index),
    })),
  };
};

const buildSignature = (flow: ScMFlowSchema) => JSON.stringify(flow);

const isConfigurableNode = (kind?: string) => kind !== "START" && kind !== "END";

const activateNodeConfig = (nodeId: string, visible = true) => {
  if (!nodeId) {
    return;
  }
  const meta = nodeMetaMap.value[nodeId];
  if (!meta) {
    return;
  }
  selectedNodeId.value = nodeId;
  selectedNodeTitle.value = meta.title || "";
  selectedNodeConfig.value = { ...(meta.config || {}) };
  if (visible) {
    configPanelVisible.value = true;
  }
};

const openInitialConfigPanel = () => {
  const firstConfigurableNode = editorData.value.nodes.find(item =>
    isConfigurableNode(nodeMetaMap.value[item.id]?.kind),
  );
  if (firstConfigurableNode) {
    activateNodeConfig(firstConfigurableNode.id, true);
    return;
  }
  if (editorData.value.nodes[0]) {
    activateNodeConfig(editorData.value.nodes[0].id, true);
  }
};

const patchEditorData = (data: EditorData) => {
  editorData.value = {
    nodes: data.nodes,
    connections: data.connections,
  };
};

const resetFromFlow = async (flow: ScMFlowSchema, options?: { fit?: boolean }) => {
  const prevSelectedId = selectedNodeId.value;
  const prevPanelVisible = configPanelVisible.value;
  syncingFromParent.value = true;
  settlingFromReset.value = true;
  seedMetaFromFlow(flow);
  editorData.value = convertFlowToEditorData(flow);
  // Preserve config panel when the selected node still exists in the new flow
  if (prevPanelVisible && prevSelectedId && flow.nodes.some(n => n.id === prevSelectedId)) {
    const meta = nodeMetaMap.value[prevSelectedId];
    if (meta) {
      selectedNodeId.value = prevSelectedId;
      selectedNodeTitle.value = meta.title || "";
      selectedNodeConfig.value = { ...(meta.config || {}) };
      configPanelVisible.value = true;
    } else {
      selectedNodeId.value = "";
      selectedNodeTitle.value = "";
      selectedNodeConfig.value = {};
      configPanelVisible.value = false;
    }
  } else {
    selectedNodeId.value = "";
    selectedNodeTitle.value = "";
    selectedNodeConfig.value = {};
    configPanelVisible.value = false;
  }
  currentSignature.value = buildSignature(flow);
  await nextTick();
  await editorRef.value?.loadData(editorData.value);
  if (options?.fit) {
    editorRef.value?.zoomToFit();
  }
  syncingFromParent.value = false;
  settlingFromReset.value = false;
  // If parent changed modelValue while syncingFromParent was true and the
  // watcher skipped it, resetFromFlow with the pending value now.
  if (pendingModelValue) {
    const pv = pendingModelValue;
    pendingModelValue = null;
    await resetFromFlow(pv);
  }
};

const collectConnectionDiagnostics = (connections: EditorData["connections"]) => {
  const warnings: string[] = [];
  const validConnections: EditorData["connections"] = [];
  const targetPortIds = new Map<string, Set<string>>();
  const sourcePortIds = new Map<string, Set<string>>();
  Object.entries(nodeMetaMap.value).forEach(([id, meta]) => {
    const ports = paletteByKind.value[meta.kind]?.ports || [];
    targetPortIds.set(id, new Set(ports.filter(item => item.side === "left" || item.side === "top").map(item => mapPortId(item.id, "input"))));
    sourcePortIds.set(id, new Set(ports.filter(item => item.side === "right" || item.side === "bottom").map(item => mapPortId(item.id, "output"))));
  });
  for (const edge of connections) {
    if (!sourcePortIds.get(edge.sourceId)?.has(edge.sourceOutput)) {
      warnings.push(`连接 ${edge.sourceId} 的输出端口 ${edge.sourceOutput} 非法`);
      continue;
    }
    if (!targetPortIds.get(edge.targetId)?.has(edge.targetInput)) {
      warnings.push(`连接 ${edge.targetId} 的输入端口 ${edge.targetInput} 非法`);
      continue;
    }
    validConnections.push(edge);
  }
  return { warnings: Array.from(new Set(warnings)), validConnections };
};

const createDefaultConfig = (item: ScMFlowPaletteItem) =>
  Object.fromEntries(item.schema.map(field => [
    field.field,
    field.defaultValue ?? (field.component === "switch" ? false : field.component === "number" ? 0 : ""),
  ]));

const buildNodeSlotProps = (nodeProps: any) => ({
  ...nodeProps,
  nodeMeta: nodeMetaMap.value[nodeProps.id] || null,
});

const handleNodeDragStart = (nodeKind: string) => {
  draggedNodeKind.value = nodeKind;
};

const createNodeAtPosition = async (nodeKind: string, position: { x: number; y: number }) => {
  const item = paletteByKind.value[nodeKind];
  if (!item || !editorRef.value) {
    return;
  }
  const config = createDefaultConfig(item);
  const node = await editorRef.value.addNode(
    item.editorType || "process",
    item.title,
    position,
    item.shape,
    { icon: item.icon, image: item.image, controls: config },
  );
  if (!node) {
    return;
  }
  nodeMetaMap.value = {
    ...nodeMetaMap.value,
    [node.id]: {
      id: node.id,
      kind: item.kind,
      title: item.title,
      config,
      icon: item.icon,
      image: item.image,
    },
  };
  emitUpdatedFlow();
};

const handleNodeDoubleClick = async (nodeKind: string) => {
  const offset = editorData.value.nodes.length * 18;
  await createNodeAtPosition(nodeKind, {
    x: 180 + (offset % 180),
    y: 140 + offset,
  });
};

const handleCanvasDrop = async (event: DragEvent) => {
  if (!draggedNodeKind.value || !canvasShellRef.value) {
    return;
  }
  const rect = canvasShellRef.value.getBoundingClientRect();
  await createNodeAtPosition(draggedNodeKind.value, {
    x: Math.max(40, event.clientX - rect.left - 120),
    y: Math.max(40, event.clientY - rect.top - 90),
  });
  draggedNodeKind.value = null;
};

const handleNodeSelected = (node: { id: string } | null) => {
  if (syncingFromParent.value) {
    console.log('[dbg] handleNodeSelected skipped, syncing');
    return;
  }
  if (!node) {
    console.log('[dbg] closeConfigPanel via handleNodeSelected(null)');
    closeConfigPanel();
    return;
  }
  console.log('[dbg] handleNodeSelected', node.id);
  const meta = nodeMetaMap.value[node.id];
  if (!meta) {
    console.log('[dbg] no meta for node', node.id);
    return;
  }
  selectedNodeId.value = node.id;
  selectedNodeTitle.value = meta.title || '';
  selectedNodeConfig.value = { ...(meta.config || {}) };
  configPanelVisible.value = true;
};

const updateSelectedNodeTitle = (value: string) => {
  selectedNodeTitle.value = value;
};

const updateSelectedNodeField = (field: string, value: unknown) => {
  selectedNodeConfig.value = {
    ...selectedNodeConfig.value,
    [field]: value,
  };
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
          controls: { ...selectedNodeConfig.value },
        }
      : item),
  });
  await nextTick();
  await editorRef.value?.loadData(editorData.value);
  internalMessage.value = "节点配置已更新";
  emitUpdatedFlow();
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
  configPanelVisible.value = false;
  emitUpdatedFlow();
};

let configPanelClosedAt = 0;

const closeConfigPanel = () => {
  configPanelVisible.value = false;
  configPanelClosedAt = Date.now();
};

const closeEdgeMenu = () => {
  edgeMenu.value.visible = false;
  edgeMenu.value.edgeId = "";
};

const handleEdgeContextMenu = (payload: any) => {
  const event = payload?.event;
  const edge = payload?.edge;
  if (!event || !edge?.id || !canvasShellRef.value) {
    return;
  }
  const rect = canvasShellRef.value.getBoundingClientRect();
  edgeMenu.value = {
    visible: true,
    x: Math.max(12, event.clientX - rect.left),
    y: Math.max(12, event.clientY - rect.top),
    edgeId: edge.id,
  };
};

const removeEdgeByMenu = async () => {
  if (!edgeMenu.value.edgeId) {
    return;
  }
  const removed = await editorRef.value?.removeConnection(edgeMenu.value.edgeId);
  closeEdgeMenu();
  if (removed) {
    emitUpdatedFlow();
  }
};

const arrangeEditor = async () => {
  await editorRef.value?.arrange();
  emitUpdatedFlow();
};

const emitUpdatedFlow = () => {
  const nextFlow = buildSchemaFromEditor();
  currentSignature.value = buildSignature(nextFlow);
  emit("update:modelValue", nextFlow);
};

const handleEditorChanged = (data: EditorData) => {
  if (syncingFromParent.value || applyingConnectionRules.value || settlingFromReset.value) {
    patchEditorData(data);
    return;
  }
  const diagnostics = collectConnectionDiagnostics(data.connections);
  if (diagnostics.validConnections.length !== data.connections.length) {
    internalMessage.value = `已移除非法连接：${diagnostics.warnings[0]}`;
    applyingConnectionRules.value = true;
    patchEditorData({
      ...data,
      connections: diagnostics.validConnections,
    });
    nextTick(async () => {
      await editorRef.value?.loadData(editorData.value);
      applyingConnectionRules.value = false;
      emitUpdatedFlow();
    });
    return;
  }
  patchEditorData(data);
  emitUpdatedFlow();
};

const validateStartToEnd = (flow: ScMFlowSchema) => {
  const startIds = flow.nodes.filter(item => item.kind === "START").map(item => item.id);
  const endIds = new Set(flow.nodes.filter(item => item.kind === "END").map(item => item.id));
  if (startIds.length !== 1) {
    return "必须且只能包含一个开始节点";
  }
  if (!endIds.size) {
    return "必须至少包含一个结束节点";
  }
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
    if (endIds.has(current)) {
      return null;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    (graph.get(current) || []).forEach(target => queue.push(target));
  }
  return "开始节点必须最终连到结束节点";
};

const handleSave = async () => {
  const flow = buildSchemaFromEditor();
  const validationError = props.validateBeforeSave
    ? await props.validateBeforeSave(flow, { editorData: editorData.value, metaMap: nodeMetaMap.value })
    : validateStartToEnd(flow);
  if (validationError) {
    internalMessage.value = validationError;
    return;
  }
  if (props.saveFlow) {
    internalMessage.value = "保存中...";
    const saved = await props.saveFlow(flow);
    if (saved) {
      await resetFromFlow(saved);
    }
    internalMessage.value = "已保存";
    return;
  }
  emit("save", flow);
};

const handleDelete = async () => {
  const flowCode = props.modelValue.flowCode;
  if (!flowCode) {
    return;
  }
  if (props.deleteFlow) {
    await props.deleteFlow(flowCode);
    return;
  }
  emit("delete", flowCode);
};

const handleSelectFlow = async (flowCode: string) => {
  if (props.loadFlow) {
    const flow = await props.loadFlow(flowCode);
    await resetFromFlow(flow, { fit: true });
    return;
  }
  emit("select-flow", flowCode);
};

watch(
  () => props.modelValue,
  async (value) => {
    const nextSignature = buildSignature(value);
    if (syncingFromParent.value) {
      if (nextSignature !== currentSignature.value) {
        pendingModelValue = value;
      }
      return;
    }
    if (nextSignature === currentSignature.value) {
      return;
    }
    await resetFromFlow(value);
  },
  { immediate: true, deep: true },
);

onBeforeUnmount(() => {});

defineExpose({
  deleteCurrentFlow: handleDelete,
  openInitialConfigPanel,
});
</script>

<style scoped lang="scss">
.sc-mflow-editor {
  height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background: var(--lay-bg);
  position: relative;
}

.sc-mflow-editor__sidebar {
  display: grid;
  gap: 10px;
  padding: 10px;
  background: var(--lay-surface-bg);
  overflow: auto;
}

.sc-mflow-editor__sidebar {
  border-right: 1px solid var(--lay-border);
  grid-template-rows: auto 1fr;
}

.sc-mflow-editor__workspace {
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  position: relative;
}

.mflow-panel {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--lay-border);
  border-radius: 14px;
  background: color-mix(in srgb, var(--lay-surface-bg) 92%, transparent);
}

.mflow-panel__head,
.mflow-toolbar,
.mflow-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.mflow-panel__head strong,
.mflow-toolbar__title strong {
  color: var(--lay-text-primary);
}

.mflow-panel__head strong,
.mflow-single strong,
.mflow-entry-list__item strong {
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mflow-panel__head span,
.mflow-toolbar__title span,
.mflow-status span,
.mflow-single small,
.mflow-entry-list__item small,
.mflow-node-library__content small,
.mflow-config__empty {
  color: var(--lay-text-placeholder);
}

.mflow-entry-list,
.mflow-node-library {
  display: grid;
  gap: 10px;
}

.mflow-entry-list__item,
.mflow-node-library__item {
  border: 1px solid var(--lay-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--lay-bg) 86%, transparent);
  cursor: pointer;
  transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease;
}

.mflow-entry-list__item:hover,
.mflow-node-library__item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--lay-accent) 24%, transparent);
  box-shadow: 0 10px 26px rgba(0, 0, 0, .08);
}

.mflow-entry-list__item {
  padding: 12px;
  text-align: left;
}

.mflow-entry-list__item.is-active {
  border-color: color-mix(in srgb, var(--lay-accent) 34%, transparent);
  background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
}

.mflow-empty {
  padding: 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--lay-bg) 88%, transparent);
  color: var(--lay-text-placeholder);
  text-align: center;
}

.mflow-single {
  display: grid;
  gap: 4px;
}

.mflow-node-library.is-default .mflow-node-library__item,
.mflow-node-library.is-icon .mflow-node-library__item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 12px;
  align-items: start;
}

.mflow-node-library__visual {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--item-color) 18%, var(--lay-bg));
  color: var(--item-color);
  font-size: 18px;
  flex-shrink: 0;
}

.mflow-node-library__visual img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.mflow-node-library__content {
  display: grid;
  gap: 4px;
}

.mflow-node-library__content p {
  margin: 0;
  font-size: 12px;
  color: var(--lay-text-secondary);
}

.mflow-toolbar {
  padding: 10px 14px;
  border-bottom: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
}

.mflow-toolbar__title {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.mflow-toolbar__title strong {
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mflow-toolbar__title span {
  font-size: 12px;
  line-height: 1.2;
}

.mflow-toolbar__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mflow-toolbar__actions button,
.mflow-config__actions button {
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 90%, transparent);
  color: var(--lay-text-primary);
  cursor: pointer;
}

.mflow-toolbar__icon-btn {
  width: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.mflow-toolbar__actions button.is-secondary,
.mflow-config__actions button.is-secondary {
  color: var(--lay-text-secondary);
}

.mflow-toolbar__center {
  font-size: 11px;
  font-weight: 600;
  color: var(--lay-text-secondary);
  white-space: nowrap;
}

.mflow-canvas {
  min-width: 0;
  min-height: 0;
  position: relative;
}

.mflow-edge-menu {
  position: absolute;
  z-index: 30;
  min-width: 120px;
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--lay-accent) 18%, var(--lay-border));
  border-radius: 12px;
  background: color-mix(in srgb, var(--lay-surface-bg) 96%, transparent);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.16);
}

.mflow-edge-menu__item {
  width: 100%;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  text-align: left;
  padding: 0 10px;
}

.mflow-edge-menu__item:hover {
  background: color-mix(in srgb, #ef4444 10%, transparent);
}

.mflow-status {
  padding: 10px 16px;
  border-top: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  flex-wrap: wrap;
}

.mflow-status .is-warning {
  color: #f59e0b;
}

.mflow-warnings {
  padding: 12px 16px;
  border-top: 1px solid var(--lay-border);
  background: color-mix(in srgb, #f59e0b 6%, var(--lay-surface-bg));
}

.mflow-warnings ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

@media (max-width: 1440px) {
  .sc-mflow-editor {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 1200px) {
  .sc-mflow-editor {
    height: auto;
    grid-template-columns: 1fr;
  }
}
</style>
