<template>
  <PmPageShell page-class="workflow-designer-page">
    <!-- 顶栏：定义选择 + 操作按钮 -->
    <PmSurface title="流程编排" description="可视化拖拽设计审批流程，支持多节点配置与发布管理">
      <template #actions>
        <span style="display: flex; gap: 8px; align-items: center">
          <el-select
            v-model="currentDefId"
            placeholder="选择流程定义..."
            style="width: 240px"
            clearable
            filterable
            @change="onDefSelect"
          >
            <el-option
              v-for="item in defList"
              :key="item.wfDefId"
              :label="item.wfDefName"
              :value="item.wfDefId"
            >
              <span>{{ item.wfDefName }}</span>
              <el-tag
                :type="statusTagType(item.wfDefStatus)"
                effect="plain"
                size="small"
                style="margin-left: 8px"
              >
                {{ statusLabel(item.wfDefStatus) }}
              </el-tag>
            </el-option>
          </el-select>
          <ScButton type="primary" @click="openNewDialog">
            <IconifyIconOnline icon="ri:add-line" style="margin-right: 4px" />新建
          </ScButton>
          <ScButton :disabled="!currentDefId" @click="handleSave">
            <IconifyIconOnline icon="ri:save-line" style="margin-right: 4px" />保存
          </ScButton>
          <ScButton
            type="success"
            :disabled="!canPublish"
            @click="handlePublish"
          >
            <IconifyIconOnline icon="ri:rocket-line" style="margin-right: 4px" />发布
          </ScButton>
          <ScButton
            type="danger"
            :disabled="!currentDefId"
            @click="handleDelete"
          >
            <IconifyIconOnline icon="ri:delete-bin-line" style="margin-right: 4px" />删除
          </ScButton>
        </span>
      </template>
    </PmSurface>

    <!-- 编辑器主体 -->
    <div class="editor-wrapper">
      <ScFlowEditor
        ref="editorRef"
        v-model="editorData"
        :node-menu-items="workflowNodeMenuItems"
        :show-statusbar="true"
        :minimap="true"
        @node-selected="onNodeSelected"
      >
        <!-- 自定义属性面板 -->
        <template #property-panel="{ node }">
          <ScForm label-position="top" size="small">
            <ScFormItem label="节点名称">
              <el-input v-model="editForm.nodeName" @change="syncNodeLabel(node)" />
            </ScFormItem>
            <ScFormItem label="节点类型">
              <el-tag :type="nodeTypeTag(node.data?.nodeType)" effect="plain">
                {{ nodeTypeLabel(node.data?.nodeType) }}
              </el-tag>
            </ScFormItem>

            <!-- START/END 节点无需审批配置 -->
            <template v-if="showApprovalConfig(node.data?.nodeType)">
              <ScFormItem label="处理人类型">
                <el-select v-model="editForm.assigneeType" placeholder="选择处理人类型" @change="syncNodeControls">
                  <el-option
                    v-for="opt in ASSIGNEE_TYPE_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </ScFormItem>
              <ScFormItem
                v-if="editForm.assigneeType && editForm.assigneeType !== 'APPLICANT'"
                :label="assigneePlaceholder"
              >
                <el-input
                  v-model="editForm.assigneeValue"
                  :placeholder="assigneePlaceholder"
                  @change="syncNodeControls"
                />
              </ScFormItem>
              <ScFormItem label="节点配置(JSON)">
                <el-input
                  v-model="editForm.nodeConfig"
                  type="textarea"
                  :rows="3"
                  placeholder="可选高级配置，JSON 格式"
                  @change="syncNodeControls"
                />
              </ScFormItem>
            </template>

            <template v-if="showConditionConfig(node.data?.nodeType)">
              <ScFormItem label="条件表达式">
                <el-input
                  v-model="editForm.nodeConfig"
                  type="textarea"
                  :rows="3"
                  placeholder="例如: amount > 1000"
                  @change="syncNodeControls"
                />
              </ScFormItem>
            </template>
          </ScForm>
        </template>
      </ScFlowEditor>
    </div>

    <!-- 新建流程对话框 -->
    <el-dialog v-model="newDialogVisible" title="新建流程定义" width="480px">
      <ScForm label-position="top" size="small">
        <ScFormItem label="流程名称">
          <el-input v-model="newForm.wfDefName" placeholder="请输入流程名称" />
        </ScFormItem>
        <ScFormItem label="流程编码">
          <el-input v-model="newForm.wfDefCode" placeholder="唯一编码，例如: LEAVE_APPROVAL" />
        </ScFormItem>
        <ScFormItem label="分类">
          <el-input v-model="newForm.wfDefCategory" placeholder="可选，例如: 行政" />
        </ScFormItem>
        <ScFormItem label="备注">
          <el-input
            v-model="newForm.wfDefRemark"
            type="textarea"
            :rows="3"
            placeholder="流程说明"
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="newDialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="confirmNew">确认创建</ScButton>
      </template>
    </el-dialog>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScFlowEditor from "@repo/components-standalone/ScFlowEditor/index.vue";
import type { EditorData, NodeTypeName, BaseNode } from "@repo/components-standalone/ScFlowEditor/types";
import {
  fetchDefPage,
  fetchDefDetail,
  saveDef,
  publishDef,
  deleteDef,
} from "../../api/workflow";
import type { WfDef, WfDefNode, WfDefEdge, WfDefVO } from "../../types";
import { NODE_TYPE_CONFIG, ASSIGNEE_TYPE_OPTIONS } from "../../types";

// ==================== 类型映射 ====================
const WORKFLOW_TO_EDITOR: Record<string, NodeTypeName> = {
  START: "input",
  END: "output",
  APPROVAL: "process",
  CC: "delay",
  CONDITION: "condition",
};

const EDITOR_TO_WORKFLOW: Record<string, string> = {
  input: "START",
  output: "END",
  process: "APPROVAL",
  delay: "CC",
  condition: "CONDITION",
};

// ==================== 状态 ====================
const defList = ref<WfDef[]>([]);
const currentDefId = ref<number | undefined>(undefined);
const currentDefVO = ref<WfDefVO | null>(null);
const editorData = ref<EditorData>({ nodes: [], connections: [] });
const editorRef = ref<any>(null);
const saving = ref(false);

// 属性编辑表单
const editForm = ref({
  nodeName: "",
  assigneeType: "",
  assigneeValue: "",
  nodeConfig: "",
});

// 新建对话框
const newDialogVisible = ref(false);
const newForm = ref({
  wfDefName: "",
  wfDefCode: "",
  wfDefCategory: "",
  wfDefRemark: "",
});

// ==================== 计算属性 ====================
const canPublish = computed(() => {
  if (!currentDefId.value) return false;
  const def = defList.value.find((d) => d.wfDefId === currentDefId.value);
  return def && (def.wfDefStatus === 0 || def.wfDefStatus === 2);
});

const assigneePlaceholder = computed(() => {
  const opt = ASSIGNEE_TYPE_OPTIONS.find((o) => o.value === editForm.value.assigneeType);
  return opt?.placeholder || "请输入";
});

// ==================== 节点面板菜单 ====================
const workflowNodeMenuItems = [
  { label: "开始", type: "input" as NodeTypeName, icon: "ri:play-circle-line" },
  { label: "结束", type: "output" as NodeTypeName, icon: "ri:stop-circle-line" },
  { label: "审批", type: "process" as NodeTypeName, icon: "ri:user-check-line" },
  { label: "抄送", type: "delay" as NodeTypeName, icon: "ri:mail-send-line" },
  { label: "条件", type: "condition" as NodeTypeName, icon: "ri:git-branch-line" },
];

// ==================== 辅助函数 ====================
function statusTagType(status?: number): string {
  if (status === 1) return "success";
  if (status === 2) return "danger";
  return "info";
}

function statusLabel(status?: number): string {
  if (status === 1) return "已发布";
  if (status === 2) return "已禁用";
  return "草稿";
}

function nodeTypeLabel(type?: string): string {
  const wt = EDITOR_TO_WORKFLOW[type || ""] || type || "";
  return NODE_TYPE_CONFIG[wt as keyof typeof NODE_TYPE_CONFIG]?.label || wt;
}

function nodeTypeTag(type?: string): string {
  const map: Record<string, string> = {
    input: "success",
    output: "warning",
    process: "primary",
    delay: "info",
    condition: "danger",
  };
  return map[type || ""] || "info";
}

function showApprovalConfig(type?: string): boolean {
  return type === "process" || type === "delay"; // APPROVAL or CC
}

function showConditionConfig(type?: string): boolean {
  return type === "condition";
}

// ==================== WfDefVO ↔ EditorData 转换 ====================
function defToEditorData(vo: WfDefVO): EditorData {
  const nodeIdMap: Record<number, string> = {};
  let idCounter = 0;

  const nodes = (vo.nodes || []).map((n) => {
    idCounter++;
    const uid = `wf_node_${idCounter}`;
    nodeIdMap[n.wfDefNodeId || idCounter] = uid;
    const editorType = WORKFLOW_TO_EDITOR[n.nodeType] || "process";
    return {
      id: uid,
      type: editorType,
      label: n.nodeName,
      position: n._position || { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      shape: (editorType === "input" || editorType === "output" ? "circle" :
              editorType === "condition" ? "diamond" : undefined) as any,
      icon: NODE_TYPE_CONFIG[n.nodeType]?.icon,
      controls: {
        wfDefNodeId: n.wfDefNodeId,
        nodeType: n.nodeType,
        assigneeType: n.assigneeType,
        assigneeValue: n.assigneeValue,
        nodeConfig: n.nodeConfig,
      },
    };
  });

  const connections = (vo.edges || []).map((e) => ({
    sourceId: nodeIdMap[e.sourceNodeId] || e.sourceNodeId.toString(),
    sourceOutput: "output",
    targetId: nodeIdMap[e.targetNodeId] || e.targetNodeId.toString(),
    targetInput: "input",
  }));

  return { nodes, connections };
}

function editorDataToDef(data: EditorData, defId: number): { nodes: WfDefNode[]; edges: WfDefEdge[] } {
  const reverseMap: Record<string, number> = {};
  let sort = 0;

  const nodes: WfDefNode[] = data.nodes.map((n) => {
    sort++;
    const ctrl = n.controls || {};
    const existingId = ctrl.wfDefNodeId;
    if (existingId && typeof existingId === "number") {
      reverseMap[n.id] = existingId;
    }
    const workflowType = EDITOR_TO_WORKFLOW[n.type] || "APPROVAL";
    return {
      wfDefNodeId: existingId || undefined,
      wfDefId: defId,
      nodeName: n.label,
      nodeType: workflowType as any,
      assigneeType: ctrl.assigneeType || "",
      assigneeValue: ctrl.assigneeValue || "",
      nodeConfig: ctrl.nodeConfig || "",
      nodeSort: sort,
      _position: n.position,
    };
  });

  const edges: WfDefEdge[] = data.connections.map((c, idx) => {
    const sourceNode = data.nodes.find((n) => n.id === c.sourceId);
    const targetNode = data.nodes.find((n) => n.id === c.targetId);
    const sourceIdx = sourceNode ? data.nodes.indexOf(sourceNode) : idx;
    const targetIdx = targetNode ? data.nodes.indexOf(targetNode) : idx + 1;
    return {
      sourceNodeId: reverseMap[c.sourceId] || sourceIdx + 1,
      targetNodeId: reverseMap[c.targetId] || targetIdx + 1,
    };
  });

  return { nodes, edges };
}

// ==================== 加载定义列表 ====================
async function loadDefList() {
  try {
    const res = await fetchDefPage({ page: 1, pageSize: 999 });
    if (res.code === 200) {
      defList.value = res.data?.records || res.data || [];
    }
  } catch {
    ElMessage.error("加载流程定义列表失败");
  }
}

// ==================== 选择定义 ====================
async function onDefSelect(defId: number | undefined) {
  if (!defId) {
    currentDefVO.value = null;
    editorData.value = { nodes: [], connections: [] };
    return;
  }
  try {
    const res = await fetchDefDetail(defId);
    if (res.code === 200 && res.data) {
      currentDefVO.value = res.data;
      editorData.value = defToEditorData(res.data);
    }
  } catch {
    ElMessage.error("加载流程定义详情失败");
  }
}

// ==================== 保存 ====================
async function handleSave() {
  if (!currentDefId.value) {
    ElMessage.warning("请先选择或创建一个流程定义");
    return;
  }
  const def = defList.value.find((d) => d.wfDefId === currentDefId.value);
  if (!def) return;

  const { nodes, edges } = editorDataToDef(editorData.value, currentDefId.value);
  if (nodes.length === 0) {
    ElMessage.warning("画布为空，请添加至少一个节点");
    return;
  }

  saving.value = true;
  try {
    const vo: WfDefVO = {
      ...def,
      wfDefId: currentDefId.value,
      nodes,
      edges,
    };
    const res = await saveDef(vo);
    if (res.code === 200) {
      ElMessage.success("保存成功");
      await loadDefList();
      // 刷新当前详情以同步 ID
      await onDefSelect(currentDefId.value);
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } catch {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
}

// ==================== 发布 ====================
async function handlePublish() {
  if (!currentDefId.value) return;
  try {
    await ElMessageBox.confirm("确认发布该流程定义？发布后可用作发起审批。", "发布确认", { type: "info" });
    const res = await publishDef(currentDefId.value);
    if (res.code === 200) {
      ElMessage.success("发布成功");
      await loadDefList();
    } else {
      ElMessage.error(res.msg || "发布失败");
    }
  } catch {
    // cancel or error
  }
}

// ==================== 删除 ====================
async function handleDelete() {
  if (!currentDefId.value) return;
  try {
    await ElMessageBox.confirm("确认删除该流程定义？此操作不可恢复。", "删除确认", { type: "warning" });
    const res = await deleteDef(currentDefId.value);
    if (res.code === 200) {
      ElMessage.success("删除成功");
      currentDefId.value = undefined;
      currentDefVO.value = null;
      editorData.value = { nodes: [], connections: [] };
      await loadDefList();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch {
    // cancel or error
  }
}

// ==================== 新建 ====================
function openNewDialog() {
  newForm.value = { wfDefName: "", wfDefCode: "", wfDefCategory: "", wfDefRemark: "" };
  newDialogVisible.value = true;
}

async function confirmNew() {
  if (!newForm.value.wfDefName || !newForm.value.wfDefCode) {
    ElMessage.warning("流程名称和编码为必填项");
    return;
  }
  saving.value = true;
  try {
    const vo: WfDefVO = {
      wfDefName: newForm.value.wfDefName,
      wfDefCode: newForm.value.wfDefCode,
      wfDefCategory: newForm.value.wfDefCategory || undefined,
      wfDefRemark: newForm.value.wfDefRemark || undefined,
      nodes: [
        {
          nodeName: "开始",
          nodeType: "START",
          nodeSort: 1,
          _position: { x: 50, y: 200 },
        },
        {
          nodeName: "结束",
          nodeType: "END",
          nodeSort: 2,
          _position: { x: 600, y: 200 },
        },
      ],
      edges: [],
    };
    const res = await saveDef(vo);
    if (res.code === 200 && res.data) {
      ElMessage.success("创建成功");
      newDialogVisible.value = false;
      await loadDefList();
      currentDefId.value = (res.data as any)?.wfDefId || (res.data as any)?.id;
      await onDefSelect(currentDefId.value);
    } else {
      ElMessage.error(res.msg || "创建失败");
    }
  } catch {
    ElMessage.error("创建失败");
  } finally {
    saving.value = false;
  }
}

// ==================== 节点选中 ====================
function onNodeSelected(node: BaseNode | null) {
  if (!node) {
    editForm.value = { nodeName: "", assigneeType: "", assigneeValue: "", nodeConfig: "" };
    return;
  }
  const ctrl = node.data?.controls || {};
  editForm.value = {
    nodeName: node.label || "",
    assigneeType: ctrl.assigneeType || "",
    assigneeValue: ctrl.assigneeValue || "",
    nodeConfig: ctrl.nodeConfig || "",
  };
}

// ==================== 同步节点属性 ====================
function syncNodeLabel(node: any) {
  if (!node) return;
  node.label = editForm.value.nodeName;
  // trigger update
  if (editorRef.value) {
    const data = editorRef.value.getData();
    editorData.value = { ...data };
  }
}

function syncNodeControls() {
  if (!editorRef.value) return;
  const data = editorRef.value.getData();
  const selected = editorRef.value.selectedNode;
  if (!selected?.value) return;

  const nodeId = selected.value.id;
  const node = data.nodes.find((n: any) => n.id === nodeId);
  if (node) {
    node.controls = {
      ...(node.controls || {}),
      assigneeType: editForm.value.assigneeType,
      assigneeValue: editForm.value.assigneeValue,
      nodeConfig: editForm.value.nodeConfig,
    };
    node.label = editForm.value.nodeName;
  }
  editorData.value = { ...data };
}

// ==================== 初始化 ====================
onMounted(() => {
  loadDefList();
});
</script>

<style scoped lang="scss">
.workflow-designer-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-wrapper {
  flex: 1;
  min-height: 0;
  margin-top: 12px;
}
</style>
