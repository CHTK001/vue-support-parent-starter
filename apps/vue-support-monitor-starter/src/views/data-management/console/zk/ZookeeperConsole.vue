<template>
  <ScContainer
    class="zk-console"
    aside-width="300px"
    :resizable="true"
    :min-aside-width="220"
    @contextmenu.prevent
  >
    <!-- 左侧：搜索 + 树 -->
    <template #aside>
      <div class="left-panel">
        <div class="panel-header">
          <IconifyIconOnline icon="ri:node-tree" class="header-icon" />
          <span class="header-title">Zookeeper 节点</span>
        </div>
        <el-input
          v-model="keyword"
          placeholder="搜索节点..."
          clearable
          class="search-input"
          @change="loadRoot"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-tree
          class="tree"
          :data="treeData"
          :props="treeProps"
          :load="loadChildrenLazy"
          lazy
          node-key="path"
          :expand-on-click-node="false"
          @node-click="open"
        >
          <template #default="{ node, data }">
            <IconifyIconOnline
              :icon="getZkNodeIcon(node, data)"
              class="node-icon"
            />
            <span class="node-name">{{ data.name }}</span>
          </template>
        </el-tree>
      </div>
    </template>

    <!-- 主内容区 -->
    <div class="main-panel">
      <!-- 头部工具栏 -->
      <div class="main-header">
        <div class="path-info">
          <IconifyIconOnline icon="ri:route-line" class="path-icon" />
          <span class="path-text">{{ path || "未选择节点" }}</span>
        </div>
        <div class="toolbar">
          <el-button size="small" :disabled="!path" @click="refreshNode">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </el-button>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="main-body">
        <template v-if="path">
          <el-input
            v-model="content"
            type="textarea"
            :rows="30"
            disabled
            readonly
          />
        </template>
        <el-empty v-else description="请选择左侧节点" />
      </div>

      <!-- 状态栏 -->
      <div class="main-footer">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>
  </ScContainer>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import ScContainer from "@repo/components/ScContainer";
import {
  extractArrayFromApi,
  normalizeTreeNode,
} from "@/views/data-management/utils/dataTree";
import {
  getConsoleRoot,
  getConsoleChildren,
  getConsoleNode,
} from "@/api/system-data";

const props = defineProps<{ id: number }>();
const keyword = ref("");
const treeData = ref<any[]>([]);
const treeProps = { label: "name", children: "children", isLeaf: "leaf" };
const path = ref<string | undefined>(undefined);
const content = ref("");
const statusText = ref("");

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value);
  const records = extractArrayFromApi(res?.data);
  treeData.value = records.map(normalizeTreeNode);
}
const loadChildrenLazy = async (
  node: any,
  resolve: (children: any[]) => void
) => {
  if (!node || node.level === 0) return resolve(treeData.value || []);
  const data = node.data || {};
  if (data.leaf === true) return resolve([]);
  const res = await getConsoleChildren(props.id, data.path);
  resolve(extractArrayFromApi(res?.data).map(normalizeTreeNode));
};

function getZkNodeIcon(node: any, data: any): string {
  const level = Number(node?.level || 0);
  if (level === 1) return "ri:server-line";
  return data?.leaf ? "ri:file-2-line" : "ri:folder-2-line";
}

async function open(node: any) {
  path.value = node?.path;
  await refreshNode();
}

async function refreshNode() {
  if (!path.value) return;
  const start = performance.now();
  const res = await getConsoleNode(props.id, path.value);
  content.value = (res?.data?.properties?.data || "") as any;
  content.value = tryPrettyJsonString(content.value);
  const ms = Math.round(performance.now() - start);
  statusText.value = `加载完成，用时 ${ms} ms`;
}
function tryPrettyJsonString(src: string): string {
  const s = (src || "").trim();
  if (!s) return src;
  const first = s[0];
  const last = s[s.length - 1];
  // 粗略判断可能是 JSON 文本
  if ((first === "{" && last === "}") || (first === "[" && last === "]")) {
    try {
      const obj = JSON.parse(s);
      return JSON.stringify(obj, null, 2);
    } catch {
      return src; // 非合法 JSON，原样返回
    }
  }
  return src;
}

onMounted(loadRoot);
</script>
<style scoped lang="scss">
/* Zookeeper 控制台容器 */
.zk-console {
  height: calc(100vh - 16px);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  :deep(.sc-container__aside) {
    background: transparent;
    border: none;
    padding: 8px;
    overflow: visible;
  }

  :deep(.sc-container__main) {
    background: transparent;
    padding: 8px;
    padding-left: 12px;
  }

  :deep(.sc-container__resize-handle--vertical) {
    background: transparent;

    &::before {
      background: #cbd5e1;
    }

    &:hover {
      background: rgba(34, 197, 94, 0.1);

      &::before {
        background: #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
      }
    }
  }
}

/* 左侧面板 */
.left-panel {
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;

  .header-icon {
    font-size: 20px;
    color: #22c55e;
  }

  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
  }
}

/* 搜索框 */
.search-input {
  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
    }
  }
}

/* 树形组件 */
.tree {
  margin-top: 12px;
  flex: 1;
  overflow: auto;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  padding: 8px;

  :deep(.el-tree-node__content) {
    height: 36px;
    border-radius: 8px;
    margin: 2px 0;
    padding: 0 8px;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: #fff;
  }
}

.node-icon {
  margin-right: 6px;
  font-size: 16px;
}

.node-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 主内容面板 */
.main-panel {
  height: 100%;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 头部工具栏 */
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  gap: 16px;
}

.path-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  .path-icon {
    font-size: 18px;
    color: #22c55e;
  }

  .path-text {
    font-size: 13px;
    color: #64748b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 500px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.el-button) {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

/* 内容区 */
.main-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;

  :deep(.el-textarea__inner) {
    flex: 1;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 13px;
    line-height: 1.6;
    background: linear-gradient(180deg, #fafbfc 0%, #f8fafc 100%);
    padding: 16px;

    &:focus {
      border-color: #22c55e;
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
    }
  }
}

/* 底部状态栏 */
.main-footer {
  height: 32px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: #64748b;
  font-size: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* 空状态美化 */
.main-body :deep(.el-empty) {
  padding: 60px 0;

  .el-empty__description {
    color: #94a3b8;
    font-size: 14px;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.left-panel,
.main-panel {
  animation: fadeIn 0.4s ease forwards;
}

.main-panel {
  animation-delay: 0.1s;
}
</style>
