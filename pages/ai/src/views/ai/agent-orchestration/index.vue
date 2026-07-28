<template>
  <section class="agent-orchestration-page">
    <!-- 工具栏 -->
    <div class="orchestration-toolbar">
      <div class="orchestration-toolbar__left">
        <button type="button" class="toolbar-btn toolbar-btn--icon" title="返回" @click="goBack">
          <IconifyIconOnline icon="ri:arrow-left-line" />
        </button>
        <span class="toolbar-title">
          Agent 编排 — {{ agentName || "未选择" }}
        </span>
      </div>
      <div class="orchestration-toolbar__right">
        <button type="button" class="toolbar-btn toolbar-btn--primary" :disabled="saving" @click="handleSave">
          <IconifyIconOnline icon="ri:save-3-line" />
          <span>{{ saving ? "保存中…" : "保存编排" }}</span>
        </button>
        <button
          type="button"
          class="toolbar-btn toolbar-btn--success"
          :disabled="!agentName || registering"
          @click="handleRegisterAsModel"
        >
          <IconifyIconOnline icon="ri:cpu-line" />
          <span>{{ registering ? "注册中…" : "注册为模型" }}</span>
        </button>
        <button
          v-if="registeredModels.length > 0"
          type="button"
          class="toolbar-btn"
          @click="showModelsDialog = true"
        >
          <IconifyIconOnline icon="ri:list-check" />
          <span>已注册模型 ({{ registeredModels.length }})</span>
        </button>
      </div>
      <div v-if="statusMessage" class="orchestration-toolbar__status">
        {{ statusMessage }}
      </div>
    </div>

    <!-- 编排画布 -->
    <div class="orchestration-canvas">
      <ScRelationGraph
        mode="edit"
        :nodes="canvasNodes"
        :edges="canvasEdges"
        :palette="paletteItems"
        palette-position="left"
        @node-drop="onNodeDrop"
        @node-remove="onNodeRemove"
        @edge-remove="onEdgeRemove"
        @node-moved="onNodeMoved"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @pane-click="closePropertyPanel"
        @edge-create="onEdgeCreate"
      />
    </div>

    <!-- 已注册模型对话框 -->
    <el-dialog v-model="showModelsDialog" title="已注册的 Agent 模型" width="500px">
      <el-table :data="registeredModels" size="small" empty-text="暂无已注册模型">
        <el-table-column prop="modelName" label="模型名称" min-width="160" />
        <el-table-column prop="agentName" label="Agent 名称" min-width="120" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleUnregisterModel(row.modelName)">
              注销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ScRelationGraph } from "@repo/components/ScRelationGraph";
import type {
  ScRelationGraphNode,
  ScRelationGraphEdge,
  ScRelationGraphPaletteItem,
} from "@repo/components/ScRelationGraph";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import {
  listEnabledAiAgentConfigs,
  getAgentOrchestration,
  saveAgentOrchestration,
  registerAgentAsModel,
  unregisterAgentModel,
  listAgentModels,
  type AiAgentConfig,
  type AgentModelItem,
} from "@/api/ai/agent-config";

const route = useRoute();
const router = useRouter();

// ── 基础状态 ──
const agentName = ref<string>("");
const statusMessage = ref("");
const saving = ref(false);
const registering = ref(false);
const showModelsDialog = ref(false);

// ── 画布数据 ──
const canvasNodes = ref<ScRelationGraphNode[]>([]);
const canvasEdges = ref<ScRelationGraphEdge[]>([]);

// ── 调色板（可用 Agent 列表） ──
const paletteAgents = ref<AiAgentConfig[]>([]);
const paletteItems = computed<ScRelationGraphPaletteItem[]>(() =>
  paletteAgents.value.map(a => ({
    kind: a.sysAiAgentConfigCode || `agent_${a.sysAiAgentConfigId}`,
    title: a.sysAiAgentConfigName || a.sysAiAgentConfigCode || "",
    detail: a.sysAiAgentConfigType || "SINGLE",
    color: "#6366f1",
    icon: "ri:robot-2-line",
  })),
);

// ── 选中节点/边 ──
const selectedNodeId = ref<string | null>(null);
const selectedEdgeId = ref<string | null>(null);

// ── 已注册模型 ──
const registeredModels = ref<AgentModelItem[]>([]);

// ── 加载编排 ──
async function loadOrchestration(name: string) {
  try {
    const res = await getAgentOrchestration(name);
    const orchestration = res.result ?? res.data;
    if (orchestration?.nodes && orchestration.nodes.length > 0) {
      canvasNodes.value = orchestration.nodes.map((n: any) => ({
        id: n.id,
        label: n.label || n.id || "",
        icon: n.icon || "ri:robot-2-line",
        kind: n.kind || "agent",
        position: n.position || { x: 300 + Math.random() * 200, y: 150 + Math.random() * 200 },
      }));
    } else {
      // 默认：至少把 leader Agent 作为中心节点
      canvasNodes.value = [
        {
          id: name,
          label: name,
          icon: "ri:robot-2-line",
          kind: "leader",
          position: { x: 350, y: 250 },
        },
      ];
    }
    if (orchestration?.edges) {
      canvasEdges.value = orchestration.edges.map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || "",
      }));
    } else {
      canvasEdges.value = [];
    }
    statusMessage.value = "";
  } catch {
    statusMessage.value = "加载编排失败，将使用空画布";
    canvasNodes.value = [];
    canvasEdges.value = [];
  }
}

// ── 加载可用 Agent ──
async function loadPalette() {
  try {
    const res = await listEnabledAiAgentConfigs();
    paletteAgents.value = res.result ?? res.data ?? [];
  } catch {
    paletteAgents.value = [];
  }
}

// ── 加载已注册模型 ──
async function loadRegisteredModels() {
  try {
    const res = await listAgentModels();
    registeredModels.value = res.result ?? res.data ?? [];
  } catch {
    registeredModels.value = [];
  }
}

// ── 保存 ──
async function handleSave() {
  if (!agentName.value) {
    ElMessage.warning("请先指定 Agent 名称");
    return;
  }
  saving.value = true;
  try {
    await saveAgentOrchestration({
      agentName: agentName.value,
      nodes: canvasNodes.value.map(n => ({
        id: n.id,
        label: n.label,
        kind: n.kind || "agent",
        position: n.position,
      })),
      edges: canvasEdges.value.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || "",
      })),
    });
    ElMessage.success("编排配置已保存");
  } catch (e: any) {
    ElMessage.error(`保存失败：${e?.message || "未知错误"}`);
  } finally {
    saving.value = false;
  }
}

// ── 注册为模型 ──
async function handleRegisterAsModel() {
  registering.value = true;
  try {
    await registerAgentAsModel({ agentName: agentName.value });
    ElMessage.success(`Agent "${agentName.value}" 已注册为模型`);
    await loadRegisteredModels();
  } catch (e: any) {
    ElMessage.error(`注册失败：${e?.message || "未知错误"}`);
  } finally {
    registering.value = false;
  }
}

// ── 注销模型 ──
async function handleUnregisterModel(modelName: string) {
  try {
    await unregisterAgentModel(modelName);
    ElMessage.success(`模型 "${modelName}" 已注销`);
    await loadRegisteredModels();
  } catch (e: any) {
    ElMessage.error(`注销失败：${e?.message || "未知错误"}`);
  }
}

// ── 画布事件 ──
function onNodeDrop(payload: { kind: string; position: { x: number; y: number } }) {
  const agent = paletteAgents.value.find(a => a.sysAiAgentConfigCode === payload.kind);
  if (!agent) return;
  const id = agent.sysAiAgentConfigCode || `agent_${Date.now()}`;
  // 去重
  if (canvasNodes.value.some(n => n.id === id)) {
    ElMessage.warning(`Agent "${id}" 已在画布中`);
    return;
  }
  canvasNodes.value.push({
    id,
    label: agent.sysAiAgentConfigName || id,
    icon: "ri:robot-2-line",
    kind: "agent",
    position: payload.position,
  });
}

function onNodeRemove(nodeId: string) {
  canvasNodes.value = canvasNodes.value.filter(n => n.id !== nodeId);
  canvasEdges.value = canvasEdges.value.filter(
    e => e.source !== nodeId && e.target !== nodeId,
  );
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = null;
  }
}

function onEdgeRemove(edgeId: string) {
  canvasEdges.value = canvasEdges.value.filter(e => e.id !== edgeId);
}

function onNodeMoved(payload: { nodeId: string; position: { x: number; y: number } }) {
  const node = canvasNodes.value.find(n => n.id === payload.nodeId);
  if (node) {
    node.position = payload.position;
  }
}

function onNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId;
  selectedEdgeId.value = null;
}

function onEdgeClick(edgeId: string) {
  selectedEdgeId.value = edgeId;
  selectedNodeId.value = null;
}

function closePropertyPanel() {
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
}

function onEdgeCreate(payload: { source: string; target: string }) {
  // 创建新边
  const id = `edge_${payload.source}_${payload.target}_${Date.now()}`;
  if (canvasEdges.value.some(e => e.source === payload.source && e.target === payload.target)) {
    return; // 已存在，不重复创建
  }
  canvasEdges.value.push({ id, source: payload.source, target: payload.target, label: "" });
}

function goBack() {
  router.back();
}

// ── 初始化 ──
onMounted(async () => {
  const name = (route.query.agentName as string) || (route.query.agentCode as string) || "";
  agentName.value = name;

  await Promise.all([loadPalette(), loadRegisteredModels()]);

  if (name) {
    await loadOrchestration(name);
  } else {
    statusMessage.value = "请从 Agent 配置页面选择 Agent 进入编排";
  }
});
</script>

<style scoped lang="scss">
.agent-orchestration-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page, #f5f5f5);
}

.orchestration-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
  flex-wrap: wrap;

  &__left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  &__status {
    width: 100%;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--icon {
    padding: 6px 8px;
    border: none;
    background: transparent;
  }

  &--primary {
    background: var(--el-color-primary);
    color: #fff;
    border-color: var(--el-color-primary);

    &:hover {
      background: var(--el-color-primary-light-3);
    }
  }

  &--success {
    background: var(--el-color-success);
    color: #fff;
    border-color: var(--el-color-success);

    &:hover {
      background: var(--el-color-success-light-3);
    }
  }
}

.orchestration-canvas {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
