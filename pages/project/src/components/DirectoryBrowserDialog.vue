<template>
  <el-dialog
    v-model="visible"
    title="选择目录"
    width="480px"
    destroy-on-close
    :close-on-click-modal="false"
    class="dir-browser-dialog"
  >
    <div class="dir-browser__body">
      <!-- 错误提示 -->
      <div v-if="errorMsg" class="dir-browser__error">
        <el-alert
          :title="errorMsg"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button size="small" class="dir-browser__retry" @click="retryLoad">
          重试
        </el-button>
      </div>

      <!-- 目录树 -->
      <el-tree
        v-if="!errorMsg"
        :key="treeKey"
        :props="treeProps"
        :load="loadNode"
        lazy
        highlight-current
        class="dir-browser__tree"
        @node-click="handleNodeClick"
      />

      <!-- 已选路径预览 -->
      <div v-if="selectedPath" class="dir-browser__selected">
        <span class="dir-browser__selected-label">已选：</span>
        <span class="dir-browser__selected-path">{{ selectedPath }}</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!selectedPath"
        @click="handleConfirm"
      >
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { createServerProjectApi } from "@pages/server";

interface TreeNode {
  label: string;
  path: string;
  isLeaf: boolean;
}

interface ElTreeNode {
  level: number;
  data: TreeNode;
}

const props = defineProps<{
  connectionId: string;
}>();

const emit = defineEmits<{
  select: [path: string];
}>();

const visible = ref(false);
const errorMsg = ref("");
const selectedPath = ref("");
const treeKey = ref(0);

const treeProps = {
  label: "label",
  isLeaf: "isLeaf",
};

const loadNode = async (
  node: ElTreeNode,
  resolve: (data: TreeNode[]) => void,
) => {
  const path = node.level === 0 ? undefined : node.data.path;

  try {
    const api = createServerProjectApi(props.connectionId);
    const res = await api.listFiles(path);
    const entries = res.data ?? [];

    const dirs = entries
      .filter((e: any) => e.directory)
      .map((e: any) => ({
        label: e.name,
        path: e.path,
        isLeaf: false,
      }));

    resolve(dirs);
  } catch {
    errorMsg.value = "目录加载失败，请检查连接状态";
    resolve([]);
  }
};

const handleNodeClick = (data: TreeNode) => {
  selectedPath.value = data.path;
};

const handleConfirm = () => {
  if (!selectedPath.value) return;
  emit("select", selectedPath.value);
  visible.value = false;
};

const retryLoad = () => {
  errorMsg.value = "";
  treeKey.value++;
};

const open = () => {
  selectedPath.value = "";
  errorMsg.value = "";
  visible.value = true;
};

const close = () => {
  visible.value = false;
};

defineExpose({ open, close });
</script>

<style scoped lang="scss">
.dir-browser__body {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dir-browser__error {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dir-browser__retry {
  align-self: flex-start;
}

.dir-browser__tree {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 8px;
}

.dir-browser__selected {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  font-size: 13px;
}

.dir-browser__selected-label {
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.dir-browser__selected-path {
  color: var(--el-color-primary);
  word-break: break-all;
}
</style>
