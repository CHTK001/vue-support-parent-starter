<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Share" :size="18" class="dsm-title-icon dsm-zk-icon" />
        <span class="dsm-title">ZooKeeper 注册中心管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton size="small" @click="refresh"><template #icon><ReIcon name="Refresh" /></template>刷新</ReButton>
        <ReButton size="small" type="primary" @click="openCreate"><template #icon><ReIcon name="Plus" /></template>新建节点</ReButton>
      </div>
    </div>

    <div class="dsm-body">
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('/')">
            <ReIcon :name="expandedNodes.has('/') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
            <span class="dsm-tree-label">/ (根节点)</span>
          </div>
          <div v-if="expandedNodes.has('/')" class="dsm-tree-children">
            <template v-for="node in treeNodes" :key="node.path">
              <div class="dsm-tree-node" :class="{ active: activePath === node.path }" @click="selectNode(node.path)">
                <ReIcon :name="node.children && node.children.length > 0 ? (expandedNodes.has(node.path) ? 'ArrowDown' : 'ArrowRight') : 'MoreFilled'" size="12" @click.stop="toggleNode(node.path)" />
                <ReIcon :name="node.ephemeral ? 'Lock' : 'Folder'" size="14" class="dsm-tree-icon" :class="{ 'dsm-ephemeral': node.ephemeral }" />
                <span class="dsm-tree-label">{{ node.name }}</span>
                <span v-if="node.ephemeral" class="dsm-ephemeral-tag">E</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="dsm-content">
        <div class="dsm-info-card">
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value">{{ connectionInfo.host }}:{{ connectionInfo.port }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">会话 ID</span><span class="dsm-info-value">0x{{ sessionId }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">版本</span><span class="dsm-info-value">ZooKeeper {{ connectionInfo.version }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">状态</span><ReTag type="success" size="small">已连接</ReTag></div>
        </div>

        <div class="dsm-section" v-if="activePath">
          <div class="dsm-section-title">
            节点详情 - {{ activePath }}
            <div class="dsm-section-actions">
              <ReButton size="small" text @click="refreshNode"><template #icon><ReIcon name="Refresh" size="12" /></template>刷新</ReButton>
              <ReButton size="small" text type="primary" @click="editNode"><template #icon><ReIcon name="Edit" size="12" /></template>编辑数据</ReButton>
              <ReButton size="small" text type="danger" @click="deleteNode"><template #icon><ReIcon name="Delete" size="12" /></template>删除</ReButton>
            </div>
          </div>

          <div class="dsm-node-detail">
            <div class="dsm-detail-row">
              <span class="dsm-detail-label">节点路径</span>
              <span class="dsm-detail-value mono">{{ activePath }}</span>
            </div>
            <div class="dsm-detail-row">
              <span class="dsm-detail-label">节点类型</span>
              <ReTag :type="nodeDetail.ephemeral ? 'warning' : 'info'" size="small">{{ nodeDetail.ephemeral ? '临时节点 (Ephemeral)' : '持久节点 (Persistent)' }}</ReTag>
            </div>
            <div class="dsm-detail-row">
              <span class="dsm-detail-label">创建时间 (czxid)</span>
              <span class="dsm-detail-value">{{ nodeDetail.createdAt }}</span>
            </div>
            <div class="dsm-detail-row">
              <span class="dsm-detail-label">修改时间 (mzxid)</span>
              <span class="dsm-detail-value">{{ nodeDetail.updatedAt }}</span>
            </div>
            <div class="dsm-detail-row">
              <span class="dsm-detail-label">数据版本 (version)</span>
              <span class="dsm-detail-value">{{ nodeDetail.version }}</span>
            </div>
            <div class="dsm-detail-row">
              <span class="dsm-detail-label">子节点数 (numChildren)</span>
              <span class="dsm-detail-value">{{ nodeDetail.numChildren }}</span>
            </div>
          </div>

          <div class="dsm-data-section">
            <div class="dsm-data-title">节点数据 (Data)</div>
            <pre class="dsm-data-content">{{ nodeDetail.data || '(空)' }}</pre>
          </div>

          <div class="dsm-children-section" v-if="children.length > 0">
            <div class="dsm-data-title">子节点列表</div>
            <ReTable :data="children" :columns="childColumns" stripe border size="small">
              <template #col-type="{ row }">
                <ReTag :type="row.ephemeral ? 'warning' : 'info'" size="small">{{ row.ephemeral ? '临时' : '持久' }}</ReTag>
              </template>
            </ReTable>
          </div>
        </div>

        <div v-if="!activePath" class="dsm-empty">
          <ReIcon name="FolderOpened" size="48" class="dsm-empty-icon" />
          <p>从左侧选择节点查看详情</p>
        </div>
      </div>
    </div>

    <ReDialog v-model="nodeDialogVisible" :title="editing ? '编辑节点数据' : '新建节点'" width="600px">
      <div class="dsm-node-form">
        <div v-if="!editing" class="dsm-form-item">
          <label>节点路径</label>
          <ReInput v-model="nodeForm.path" placeholder="/services/my-service" />
        </div>
        <div class="dsm-form-item">
          <label>节点数据</label>
          <textarea v-model="nodeForm.data" class="dsm-node-data" rows="8" placeholder="输入节点数据..."></textarea>
        </div>
        <div v-if="!editing" class="dsm-form-item">
          <label>节点类型</label>
          <ReSwitch v-model="nodeForm.ephemeral" active-text="临时节点" inactive-text="持久节点" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="nodeDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="saveNode"><template #icon><ReIcon name="Check" /></template>{{ editing ? '保存' : '创建' }}</ReButton>
      </template>
    </ReDialog>
  </div>

  <!-- 节点右键菜单 -->
  <div
    v-if="nodeContextMenu.visible"
    class="zk-context-menu"
    :style="{ left: nodeContextMenu.x + 'px', top: nodeContextMenu.y + 'px' }"
    @click="nodeContextMenu.visible = false"
  >
    <div class="zkm-item" @click="selectNode(nodeContextMenu.path)">
      <ReIcon name="View" size="14" />查看详情
    </div>
    <div class="zkm-item" @click="onCopyPath(nodeContextMenu.path)">
      <ReIcon name="Copy" size="14" />复制路径
    </div>
    <div class="zkm-item" @click="onEditNodeData(nodeContextMenu.path)">
      <ReIcon name="Edit" size="14" />编辑数据
    </div>
    <div class="zkm-item" @click="onAddChildNode(nodeContextMenu.path)">
      <ReIcon name="Plus" size="14" />新建子节点
    </div>
    <div class="zkm-item" @click="onExportNode(nodeContextMenu.path)">
      <ReIcon name="Download" size="14" />导出节点
    </div>
    <div class="zkm-divider"></div>
    <div class="zkm-item zkm-danger" @click="onDeleteNode(nodeContextMenu.path)">
      <ReIcon name="Delete" size="14" />删除节点
    </div>
    <div class="zkm-item zkm-warning" @click="onDeleteRecursive(nodeContextMenu.path)">
      <ReIcon name="Delete" size="14" />递归删除（含子节点）
    </div>
    <div class="zkm-item" @click="refresh">
      <ReIcon name="Refresh" size="14" />刷新
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ZooKeeper 管理页
 *
 * 提供 ZooKeeper 注册中心的节点树浏览、节点增删改查与连接测试。
 * @author CH
 * @since 4.0.0
 */
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const connectionInfo = reactive({ host: "127.0.0.1", port: 2181, version: "3.9" });
const sessionId = ref("100001234567890");
const expandedNodes = ref(new Set(["/"]));
const activePath = ref("");
const loading = ref(false);

const treeNodes = ref([
  { path: "/services", name: "services", ephemeral: false, children: [] },
  { path: "/config", name: "config", ephemeral: false, children: [] },
  { path: "/registry", name: "registry", ephemeral: false, children: [] },
  { path: "/zookeeper", name: "zookeeper", ephemeral: false, children: [] },
  { path: "/locks", name: "locks", ephemeral: false, children: [] },
]);

const nodeDetail = reactive({
  path: "",
  ephemeral: false,
  createdAt: "2024-01-10 09:00:00",
  updatedAt: "2024-01-15 10:30:00",
  version: 5,
  numChildren: 3,
  data: '{\n  "host": "10.0.0.1",\n  "port": 8080,\n  "status": "UP"\n}',
});

const children = ref([
  { name: "provider-001", ephemeral: true, data: "10.0.0.1:8080" },
  { name: "provider-002", ephemeral: true, data: "10.0.0.2:8080" },
  { name: "provider-003", ephemeral: true, data: "10.0.0.3:8080" },
]);

const childColumns = [
  { prop: "name", label: "子节点名称", minWidth: 200 },
  { prop: "ephemeral", label: "类型", width: 120, slot: "type" },
  { prop: "data", label: "数据", minWidth: 200 },
];

const nodeDialogVisible = ref(false);
const editing = ref(false);
const nodeForm = reactive({ path: "", data: "", ephemeral: false });

/**
 * 展开/收起树节点
 * @param path 节点路径
 */
// ==================== 右键菜单 ====================
const nodeContextMenu = ref({ visible: false, x: 0, y: 0, path: "" });

const onNodeContextMenu = (e: MouseEvent, path: string) => {
  nodeContextMenu.value = { visible: true, x: e.clientX, y: e.clientY, path };
};

if (typeof window !== "undefined") {
  window.addEventListener("click", () => {
    nodeContextMenu.value.visible = false;
  });
}

const onCopyPath = (path: string) => {
  navigator.clipboard.writeText(path).then(() => {
    ElMessage.success("已复制路径");
  }).catch(() => {
    ElMessage.error("复制失败");
  });
};

const onEditNodeData = (path: string) => {
  selectNode(path);
  editNode();
};

const onAddChildNode = (parentPath: string) => {
  editing.value = false;
  nodeForm.value = { path: parentPath === "/" ? "/new-node" : parentPath + "/new-node", data: "" };
  nodeDialogVisible.value = true;
};

const onExportNode = async (path: string) => {
  try {
    const detail = await fetchZkNodeDetail(path);
    const children = await fetchZkChildren(path);
    const exportData = {
      path,
      data: detail?.data,
      stat: detail?.stat,
      children: children.map((c: any) => c.path || c.name),
      exportTime: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zk-${path.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error(`导出失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const onDeleteNode = (path: string) => {
  selectNode(path);
  deleteNode();
};

const onDeleteRecursive = async (path: string) => {
  try {
    await ElMessageBox.confirm(`确定递归删除节点 "${path}" 及其所有子节点吗？此操作不可恢复！`, "递归删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    // 递归删除：先获取所有子节点，然后从叶子节点开始删除
    const deleteRecursive = async (p: string): Promise<void> => {
      const children = await fetchZkChildren(p);
      for (const child of children) {
        const childPath = p === "/" ? "/" + (child.path || child.name) : p + "/" + (child.path || child.name);
        await deleteRecursive(childPath);
      }
      await deleteZkNode(p);
    };
    await deleteRecursive(path);
    ElMessage.success("递归删除成功");
    refresh();
    if (activePath.value === path) {
      activePath.value = null;
      nodeDetail.value = null;
    }
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

function toggleNode(path: string) {
  if (expandedNodes.value.has(path)) expandedNodes.value.delete(path);
  else expandedNodes.value.add(path);
}

/**
 * 选中节点加载详情
 * @param path 节点路径
 */
function selectNode(path: string) {
  activePath.value = path;
  nodeDetail.path = path;
  if (path === "/services") {
    nodeDetail.numChildren = 3;
    children.value = [
      { name: "monitor-service", ephemeral: true, data: "10.0.0.1:8080" },
      { name: "gateway-service", ephemeral: true, data: "10.0.0.2:8080" },
      { name: "auth-service", ephemeral: true, data: "10.0.0.3:8080" },
    ];
  }
}

/**
 * 刷新节点详情
 */
function refreshNode() {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 300);
}

/**
 * 进入节点编辑态
 */
function editNode() {
  editing.value = true;
  nodeForm.path = activePath.value;
  nodeForm.data = nodeDetail.data;
  nodeDialogVisible.value = true;
}

/**
 * 打开新建节点弹窗
 */
function openCreate() {
  editing.value = false;
  nodeForm.path = "";
  nodeForm.data = "";
  nodeForm.ephemeral = false;
  nodeDialogVisible.value = true;
}

/**
 * 保存节点
 */
function saveNode() {
  if (editing.value) {
    nodeDetail.data = nodeForm.data;
    nodeDetail.version++;
    nodeDetail.updatedAt = new Date().toLocaleString();
  }
  nodeDialogVisible.value = false;
}

/**
 * 删除节点
 */
function deleteNode() {
  if (confirm(`确定删除节点 ${activePath.value} 吗？`)) {
    activePath.value = "";
  }
}

/**
 * 刷新节点树
 */
function refresh() {
  loading.value = true;
  setTimeout(() => { loading.value = false; }, 500);
}

onMounted(() => {});
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; }
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-zk-icon { color: #fb923c; }
.dsm-toolbar-right { display: flex; gap: 8px; }
.dsm-body { display: flex; flex: 1; gap: 16px; overflow: hidden; }
.dsm-sidebar { width: 280px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow-y: auto; flex-shrink: 0; }
.dsm-tree { padding: 8px 0; }
.dsm-tree-node { display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-root { font-weight: 600; }
.dsm-tree-children { padding-left: 16px; }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-ephemeral { color: #f59e0b; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); }
.dsm-ephemeral-tag { font-size: 10px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 1px 5px; border-radius: 4px; font-weight: 600; }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.dsm-info-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.dsm-section { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }
.dsm-section-actions { display: flex; gap: 4px; }
.dsm-node-detail { padding: 14px 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-detail-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-detail-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-detail-value { font-size: 13px; color: var(--text-primary); }
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }
.dsm-data-section { padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
.dsm-data-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.dsm-data-content { margin: 0; padding: 12px; background: var(--bg-fill); border-radius: 6px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 12px; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
.dsm-children-section { padding: 14px 16px; }
.dsm-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--text-tertiary); }
.dsm-empty-icon { opacity: 0.3; }

/* 右键菜单 */
.zk-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: var(--bg-container, #ffffff);
  border: 1px solid var(--border-default, rgba(148, 163, 184, 0.3));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
  padding: 4px;
}
.zkm-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary, #1e293b);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}
.zkm-item:hover { background: var(--bg-hover, #f1f5f9); }
.zkm-item.zkm-danger { color: #ef4444; }
.zkm-item.zkm-danger:hover { background: rgba(239, 68, 68, 0.1); }
.zkm-item.zkm-warning { color: #f59e0b; }
.zkm-item.zkm-warning:hover { background: rgba(245, 158, 11, 0.1); }
.zkm-divider {
  height: 1px;
  margin: 4px 8px;
  background: var(--border-subtle, rgba(148, 163, 184, 0.2));
}
.dsm-node-form { display: flex; flex-direction: column; gap: 14px; }
.dsm-form-item { display: flex; flex-direction: column; gap: 6px; }
.dsm-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.dsm-node-data { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-node-data:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
</style>
