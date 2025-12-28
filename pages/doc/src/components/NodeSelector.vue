<template>
  <div class="node-selector">
    <!-- 节点选择下拉框 -->
    <el-select
      v-model="currentNodeId"
      placeholder="选择节点"
      size="small"
      class="node-select"
      @change="handleNodeChange"
    >
      <template #prefix>
        <i class="ri-server-line"></i>
      </template>
      <el-option
        v-for="node in nodes"
        :key="node.id"
        :label="node.name"
        :value="node.id"
      >
        <div class="node-option">
          <span class="node-name">{{ node.name }}</span>
          <el-tag
            v-if="node.status"
            :type="getStatusType(node.status)"
            size="small"
          >
            {{ getStatusLabel(node.status) }}
          </el-tag>
        </div>
      </el-option>
    </el-select>

    <!-- 节点管理按钮 -->
    <el-button
      v-if="showManageButton"
      size="small"
      @click="showManageDialog = true"
    >
      <i class="ri-settings-3-line"></i>
    </el-button>

    <!-- 节点管理对话框 -->
    <sc-dialog
      v-model="showManageDialog"
      title="节点管理"
      width="700px"
    >
      <div class="node-manage">
        <!-- 节点列表 -->
        <el-table :data="editableNodes" border size="small">
          <el-table-column prop="id" label="ID" width="100" />
          <el-table-column prop="name" label="名称" width="150">
            <template #default="{ row, $index }">
              <el-input
                v-model="editableNodes[$index].name"
                size="small"
                placeholder="节点名称"
              />
            </template>
          </el-table-column>
          <el-table-column prop="baseUrl" label="Base URL" min-width="200">
            <template #default="{ row, $index }">
              <el-input
                v-model="editableNodes[$index].baseUrl"
                size="small"
                placeholder="如: http://localhost:8080"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row, $index }">
              <el-button-group size="small">
                <el-button @click="testNode(row)">
                  <i class="ri-pulse-line"></i>
                  测试
                </el-button>
                <el-button
                  type="danger"
                  @click="removeNode($index)"
                  :disabled="editableNodes.length <= 1"
                >
                  <i class="ri-delete-bin-line"></i>
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>

        <!-- 添加节点 -->
        <div class="add-node-section">
          <el-button type="primary" plain @click="addNode">
            <i class="ri-add-line"></i>
            添加节点
          </el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="resetNodes">重置</el-button>
        <el-button @click="showManageDialog = false">取消</el-button>
        <el-button type="primary" @click="saveNodes">保存</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { NodeInfo, NodeStatus } from "../types";
import { DocStorage } from "../storage";

const props = withDefaults(
  defineProps<{
    /** 节点列表 */
    nodes: NodeInfo[];
    /** 当前节点 ID */
    modelValue?: string;
    /** 是否显示管理按钮 */
    showManageButton?: boolean;
    /** 存储键前缀 */
    storageKeyPrefix?: string;
  }>(),
  {
    showManageButton: true,
    storageKeyPrefix: "api_doc",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", nodeId: string): void;
  (e: "change", node: NodeInfo): void;
  (e: "update:nodes", nodes: NodeInfo[]): void;
}>();

// 内部状态
const currentNodeId = ref<string>("");
const showManageDialog = ref(false);
const editableNodes = ref<NodeInfo[]>([]);

// 状态类型
const getStatusType = (status?: NodeStatus): string => {
  const types: Record<string, string> = {
    online: "success",
    offline: "danger",
    unknown: "info",
  };
  return types[status || "unknown"] || "info";
};

// 状态标签
const getStatusLabel = (status?: NodeStatus): string => {
  const labels: Record<string, string> = {
    online: "在线",
    offline: "离线",
    unknown: "未知",
  };
  return labels[status || "unknown"] || "未知";
};

// 节点变更
const handleNodeChange = (nodeId: string) => {
  const node = props.nodes.find((n) => n.id === nodeId);
  if (node) {
    emit("update:modelValue", nodeId);
    emit("change", node);
    // 保存当前节点选择
    DocStorage.setConfig(`${props.storageKeyPrefix}_current_node`, nodeId);
  }
};

// 添加节点
const addNode = () => {
  const newId = `node_${Date.now()}`;
  editableNodes.value.push({
    id: newId,
    name: `新节点 ${editableNodes.value.length + 1}`,
    baseUrl: "",
    status: "unknown",
  });
};

// 移除节点
const removeNode = (index: number) => {
  editableNodes.value.splice(index, 1);
};

// 测试节点
const testNode = async (node: NodeInfo) => {
  if (!node.baseUrl) {
    ElMessage.warning("请先填写 Base URL");
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${node.baseUrl}/actuator/health`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    const index = editableNodes.value.findIndex((n) => n.id === node.id);
    if (index !== -1) {
      editableNodes.value[index].status = response?.ok ? "online" : "offline";
    }

    if (response?.ok) {
      ElMessage.success(`节点 ${node.name} 连接成功`);
    } else {
      ElMessage.warning(`节点 ${node.name} 连接失败`);
    }
  } catch (error) {
    const index = editableNodes.value.findIndex((n) => n.id === node.id);
    if (index !== -1) {
      editableNodes.value[index].status = "offline";
    }
    ElMessage.error(`节点 ${node.name} 连接超时`);
  }
};

// 重置节点
const resetNodes = () => {
  editableNodes.value = JSON.parse(JSON.stringify(props.nodes));
};

// 保存节点
const saveNodes = async () => {
  // 验证
  for (const node of editableNodes.value) {
    if (!node.name.trim()) {
      ElMessage.warning("节点名称不能为空");
      return;
    }
    if (!node.baseUrl.trim()) {
      ElMessage.warning("Base URL 不能为空");
      return;
    }
  }

  emit("update:nodes", [...editableNodes.value]);

  // 保存到存储
  await DocStorage.setConfig(`${props.storageKeyPrefix}_nodes`, editableNodes.value);

  ElMessage.success("节点配置已保存");
  showManageDialog.value = false;
};

// 加载节点配置
const loadNodes = async () => {
  const savedNodes = await DocStorage.getConfig<NodeInfo[]>(`${props.storageKeyPrefix}_nodes`);
  if (savedNodes && savedNodes.length > 0) {
    emit("update:nodes", savedNodes);
  }

  // 加载当前节点选择
  const savedCurrentNode = await DocStorage.getConfig<string>(`${props.storageKeyPrefix}_current_node`);
  if (savedCurrentNode) {
    currentNodeId.value = savedCurrentNode;
  } else if (props.nodes.length > 0) {
    currentNodeId.value = props.nodes[0].id;
  }
};

// 监听 modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== currentNodeId.value) {
      currentNodeId.value = newValue;
    }
  },
  { immediate: true }
);

// 监听节点列表变化
watch(
  () => props.nodes,
  (newNodes) => {
    editableNodes.value = JSON.parse(JSON.stringify(newNodes));
    // 如果当前节点不在列表中，选择第一个
    if (!newNodes.find((n) => n.id === currentNodeId.value) && newNodes.length > 0) {
      currentNodeId.value = newNodes[0].id;
      handleNodeChange(currentNodeId.value);
    }
  },
  { deep: true, immediate: true }
);

// 监听对话框打开
watch(showManageDialog, (visible) => {
  if (visible) {
    editableNodes.value = JSON.parse(JSON.stringify(props.nodes));
  }
});

// 生命周期
onMounted(() => {
  loadNodes();
});

// 暴露方法
defineExpose({
  loadNodes,
  testNode,
  currentNodeId,
});
</script>

<style lang="scss" scoped>
.node-selector {
  display: flex;
  align-items: center;
  gap: 8px;

  .node-select {
    width: 180px;
  }

  .node-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .node-name {
      flex: 1;
    }
  }
}

.node-manage {
  .add-node-section {
    margin-top: 16px;
    display: flex;
    justify-content: flex-start;
  }
}
</style>
