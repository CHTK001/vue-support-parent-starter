<template>
  <section class="zk-workspace">
    <ScLayout
      v-model="railTabValue"
      class="zk-layout"
      left-enabled
      :left-width="260"
      :left-min-width="180"
      :left-max-width="380"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- ── 左侧：ZNode 树 ── -->
      <template #left>
        <div class="tree-panel">
          <div class="tree-toolbar">
            <ElInput
              v-model="treeSearch"
              placeholder="搜索节点路径"
              clearable
              size="small"
            >
              <template #prefix><ElIcon><Search /></ElIcon></template>
            </ElInput>
            <ElTooltip content="刷新根节点">
              <ElButton :icon="RefreshRight" circle size="small" :loading="rootLoading" @click="loadRoot" />
            </ElTooltip>
            <ElTooltip content="创建节点">
              <ElButton :icon="Plus" circle size="small" type="primary" @click="openCreateDialog('/')" />
            </ElTooltip>
          </div>

          <ElScrollbar class="tree-scroll">
            <div v-if="rootLoading && !treeNodes.length" class="tree-empty">
              <ElIcon class="is-loading"><Loading /></ElIcon>
              <span>连接中…</span>
            </div>
            <div v-else-if="!treeNodes.length" class="tree-empty">
              <ElEmpty description="根节点为空" :image-size="48" />
            </div>
            <div v-else class="zk-tree">
              <ZkTreeNode
                v-for="node in treeNodes"
                :key="node.path"
                :node="node"
                :active-path="activePath"
                :search="treeSearch"
                @select="selectNode"
                @expand="expandNode"
                @create="openCreateDialog"
                @delete="confirmDelete"
              />
            </div>
          </ElScrollbar>
        </div>
      </template>

      <!-- ── 右侧主内容 ── -->
      <template #default>
        <div class="main-content">

          <!-- 工作区 tab -->
          <template v-if="railTabValue === 'workspace'">
            <div v-if="!activePath" class="empty-workspace">
              <div class="empty-workspace__inner">
                <div class="empty-workspace__icon-wrap">
                  <ElIcon class="empty-workspace__icon"><Share /></ElIcon>
                </div>
                <p class="empty-workspace__title">选择一个 ZNode</p>
                <p class="empty-workspace__sub">从左侧树中点击节点查看数据与元信息</p>
              </div>
            </div>

            <div v-else class="node-panel">
              <!-- 面包屑 + 操作栏 -->
              <div class="node-toolbar">
                <div class="node-toolbar__left">
                  <div class="node-breadcrumb">
                    <span
                      v-for="(seg, idx) in pathSegments"
                      :key="idx"
                      class="node-breadcrumb__item"
                    >
                      <span
                        class="node-breadcrumb__seg"
                        :class="{ 'is-last': idx === pathSegments.length - 1 }"
                      >{{ seg || "/" }}</span>
                      <span v-if="idx < pathSegments.length - 1" class="node-breadcrumb__sep">/</span>
                    </span>
                  </div>
                  <ElTag
                    v-if="nodeStat"
                    size="small"
                    effect="plain"
                    :type="nodeStat.ephemeralOwner !== 0 ? 'warning' : 'info'"
                  >
                    {{ nodeStat.ephemeralOwner !== 0 ? "临时节点" : "持久节点" }}
                  </ElTag>
                </div>
                <div class="node-toolbar__right">
                  <ElTooltip content="创建子节点">
                    <ElButton :icon="Plus" circle size="small" @click="openCreateDialog(activePath)" />
                  </ElTooltip>
                  <ElTooltip content="刷新">
                    <ElButton :icon="RefreshRight" circle size="small" :loading="nodeLoading" @click="loadNodeData" />
                  </ElTooltip>
                  <ElTooltip content="删除节点">
                    <ElButton :icon="Delete" circle size="small" type="danger" @click="confirmDelete(activePath)" />
                  </ElTooltip>
                </div>
              </div>

              <!-- 数据编辑区 -->
              <div class="data-section">
                <div class="data-section__header">
                  <span class="data-section__title">节点数据</span>
                  <div class="data-section__actions">
                    <div class="format-tabs">
                      <button
                        v-for="fmt in formatOptions"
                        :key="fmt.value"
                        class="format-tab"
                        :class="{ 'is-active': dataFormat === fmt.value }"
                        @click="switchFormat(fmt.value)"
                      >{{ fmt.label }}</button>
                    </div>
                    <ElButton
                      size="small"
                      type="primary"
                      :loading="saving"
                      @click="saveNodeData"
                    >
                      <ElIcon><Check /></ElIcon>
                      保存
                    </ElButton>
                  </div>
                </div>

                <div class="data-editor-wrap">
                  <ElInput
                    v-model="editData"
                    type="textarea"
                    :rows="12"
                    :placeholder="dataFormat === 'json' ? '输入 JSON 数据' : '输入节点数据'"
                    class="data-editor"
                    resize="none"
                    spellcheck="false"
                  />
                  <div v-if="dataError" class="data-error">
                    <ElIcon><Warning /></ElIcon>
                    {{ dataError }}
                  </div>
                </div>
              </div>

              <!-- 元信息区 -->
              <div v-if="nodeStat" class="stat-section">
                <div class="stat-section__title">节点元信息</div>
                <div class="stat-grid">
                  <div v-for="item in statItems" :key="item.key" class="stat-item">
                    <span class="stat-item__key">{{ item.label }}</span>
                    <span class="stat-item__val">{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 信息 tab -->
          <template v-else-if="railTabValue === 'info'">
            <div class="info-panel">
              <div class="info-header">
                <span class="info-title">ZooKeeper 连接信息</span>
                <ElButton :icon="RefreshRight" circle size="small" @click="loadConnectionInfo" />
              </div>
              <ElScrollbar class="info-scroll">
                <div v-if="infoLoading" class="info-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else class="info-content">
                  <div class="info-card">
                    <div class="info-card__title">连接状态</div>
                    <div class="info-card__body">
                      <div class="info-row">
                        <span class="info-row__label">状态</span>
                        <span class="info-row__val">
                          <span class="status-dot status-dot--ok" />
                          已连接
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-row__label">Connection ID</span>
                        <span class="info-row__val info-row__val--mono">{{ props.connectionId }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="info-card">
                    <div class="info-card__title">根节点统计</div>
                    <div class="info-card__body">
                      <div class="info-row">
                        <span class="info-row__label">根节点子节点数</span>
                        <span class="info-row__val">{{ treeNodes.length }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-row__label">当前选中路径</span>
                        <span class="info-row__val info-row__val--mono">{{ activePath || "—" }}</span>
                      </div>
                    </div>
                  </div>

                  <div v-if="activePath && nodeStat" class="info-card">
                    <div class="info-card__title">当前节点详情</div>
                    <div class="info-card__body">
                      <div v-for="item in statItems" :key="item.key" class="info-row">
                        <span class="info-row__label">{{ item.label }}</span>
                        <span class="info-row__val info-row__val--mono">{{ item.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>

    <!-- 创建节点对话框 -->
    <ElDialog
      v-model="createDialogVisible"
      title="创建 ZNode"
      width="520px"
      :close-on-click-modal="false"
    >
      <div class="create-form">
        <label class="create-field">
          <span class="create-field__label">父路径</span>
          <ElInput v-model="createForm.parentPath" disabled />
        </label>
        <label class="create-field">
          <span class="create-field__label create-field__label--required">节点名称</span>
          <ElInput v-model="createForm.name" placeholder="例如：config" />
        </label>
        <label class="create-field">
          <span class="create-field__label">节点类型</span>
          <div class="mode-options">
            <button
              v-for="opt in modeOptions"
              :key="opt.value"
              class="mode-option"
              :class="{ 'is-active': createForm.mode === opt.value }"
              @click="createForm.mode = opt.value"
            >
              <span class="mode-option__label">{{ opt.label }}</span>
              <span class="mode-option__desc">{{ opt.desc }}</span>
            </button>
          </div>
        </label>
        <label class="create-field">
          <span class="create-field__label">初始数据（可选）</span>
          <ElInput
            v-model="createForm.data"
            type="textarea"
            :rows="4"
            placeholder="节点初始数据"
            resize="none"
          />
        </label>
        <div v-if="createError" class="create-error">{{ createError }}</div>
      </div>
      <template #footer>
        <ElButton @click="createDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="creating" @click="submitCreate">创建</ElButton>
      </template>
    </ElDialog>

    <!-- 删除确认 -->
    <ElDialog
      v-model="deleteDialogVisible"
      title="删除节点"
      width="420px"
      :close-on-click-modal="false"
    >
      <div class="delete-confirm">
        <div class="delete-confirm__icon">
          <ElIcon><Warning /></ElIcon>
        </div>
        <div class="delete-confirm__body">
          <p>确认删除节点 <code>{{ deletingPath }}</code>？</p>
          <label class="delete-confirm__recursive">
            <ElCheckbox v-model="deleteRecursive" />
            <span>递归删除所有子节点</span>
          </label>
          <p class="delete-confirm__warn">此操作不可恢复！</p>
        </div>
      </div>
      <template #footer>
        <ElButton @click="deleteDialogVisible = false">取消</ElButton>
        <ElButton type="danger" :loading="deleting" @click="submitDelete">删除</ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  Check,
  Delete,
  Loading,
  Plus,
  RefreshRight,
  Search,
  Share,
  Warning,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElMessage,
  ElScrollbar,
  ElTag,
  ElTooltip,
} from "element-plus";
import { computed, markRaw, onMounted, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import { ZkTreeNode } from "./ZkTreeNode.vue";
import {
  closeZookeeperConnection,
  createZookeeperNode,
  deleteZookeeperNode,
  getZookeeperNode,
  lsZookeeperNode,
  setZookeeperNode,
  statZookeeperNode,
  type ZkCreateMode,
  type ZkStatView,
} from "../../api/zookeeper";

const props = defineProps<{ connectionId: string }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs ────────────────────────────────────────────────────────────────
const railTabs = [
  { name: "workspace", title: "工作区", icon: markRaw(Share) },
  { name: "info", title: "连接信息", icon: markRaw(Check) },
];
const railTabValue = ref("workspace");

// ─── ZNode 树 ─────────────────────────────────────────────────────────────────
interface ZkNode {
  name: string;
  path: string;
  expanded: boolean;
  loading: boolean;
  children: ZkNode[];
  hasChildren: boolean;
  loaded: boolean;
}

const treeNodes = ref<ZkNode[]>([]);
const rootLoading = ref(false);
const treeSearch = ref("");

const buildNode = (name: string, parentPath: string): ZkNode => {
  const path = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
  return { name, path, expanded: false, loading: false, children: [], hasChildren: true, loaded: false };
};

const loadRoot = async () => {
  rootLoading.value = true;
  try {
    const res = await lsZookeeperNode(props.connectionId, "/");
    const names: string[] = res?.data ?? [];
    treeNodes.value = names.sort().map((n) => buildNode(n, "/"));
  } catch (e: any) {
    ElMessage.error("加载根节点失败: " + (e?.message ?? ""));
  } finally {
    rootLoading.value = false;
  }
};

const expandNode = async (node: ZkNode) => {
  node.expanded = !node.expanded;
  if (node.expanded && !node.loaded) {
    node.loading = true;
    try {
      const res = await lsZookeeperNode(props.connectionId, node.path);
      const names: string[] = res?.data ?? [];
      node.children = names.sort().map((n) => buildNode(n, node.path));
      node.hasChildren = node.children.length > 0;
      node.loaded = true;
    } catch {
      ElMessage.error(`加载 ${node.path} 子节点失败`);
    } finally {
      node.loading = false;
    }
  }
};

// ─── 选中节点 ─────────────────────────────────────────────────────────────────
const activePath = ref("");
const nodeLoading = ref(false);
const editData = ref("");
const rawData = ref("");
const nodeStat = ref<ZkStatView | null>(null);
const dataFormat = ref<"text" | "json">("text");
const dataError = ref("");
const saving = ref(false);
const infoLoading = ref(false);

const formatOptions = [
  { label: "文本", value: "text" as const },
  { label: "JSON", value: "json" as const },
];

const pathSegments = computed(() => {
  if (!activePath.value || activePath.value === "/") return ["/"];
  return activePath.value.split("/").filter(Boolean);
});

const statItems = computed(() => {
  if (!nodeStat.value) return [];
  const s = nodeStat.value;
  return [
    { key: "version", label: "版本", value: s.version },
    { key: "cversion", label: "子节点版本", value: s.cversion },
    { key: "dataLength", label: "数据长度", value: `${s.dataLength} B` },
    { key: "numChildren", label: "子节点数", value: s.numChildren },
    { key: "ctime", label: "创建时间", value: formatTs(s.ctime) },
    { key: "mtime", label: "修改时间", value: formatTs(s.mtime) },
    { key: "czxid", label: "创建 ZXID", value: s.czxid },
    { key: "mzxid", label: "修改 ZXID", value: s.mzxid },
    { key: "ephemeralOwner", label: "临时节点 Owner", value: s.ephemeralOwner === 0 ? "—" : `0x${s.ephemeralOwner.toString(16)}` },
  ];
});

const selectNode = async (node: ZkNode) => {
  activePath.value = node.path;
  railTabValue.value = "workspace";
  await loadNodeData();
};

const loadNodeData = async () => {
  if (!activePath.value) return;
  nodeLoading.value = true;
  dataError.value = "";
  try {
    const [dataRes, statRes] = await Promise.all([
      getZookeeperNode(props.connectionId, activePath.value),
      statZookeeperNode(props.connectionId, activePath.value),
    ]);
    rawData.value = dataRes?.data ?? "";
    nodeStat.value = statRes?.data ?? null;
    applyFormat(rawData.value);
  } catch (e: any) {
    ElMessage.error("加载节点数据失败: " + (e?.message ?? ""));
  } finally {
    nodeLoading.value = false;
  }
};

const applyFormat = (raw: string) => {
  if (dataFormat.value === "json") {
    try {
      editData.value = JSON.stringify(JSON.parse(raw), null, 2);
      dataError.value = "";
    } catch {
      editData.value = raw;
      dataError.value = "数据不是有效 JSON，已以文本模式显示";
    }
  } else {
    editData.value = raw;
    dataError.value = "";
  }
};

const switchFormat = (fmt: "text" | "json") => {
  dataFormat.value = fmt;
  applyFormat(editData.value || rawData.value);
};

const saveNodeData = async () => {
  dataError.value = "";
  let toSave = editData.value;
  if (dataFormat.value === "json") {
    try {
      JSON.parse(toSave);
    } catch (e: any) {
      dataError.value = "JSON 格式错误: " + e.message;
      return;
    }
  }
  saving.value = true;
  try {
    await setZookeeperNode(props.connectionId, activePath.value, toSave);
    rawData.value = toSave;
    ElMessage.success("保存成功");
    await loadNodeData();
  } catch (e: any) {
    ElMessage.error("保存失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

// ─── 创建节点 ─────────────────────────────────────────────────────────────────
const createDialogVisible = ref(false);
const creating = ref(false);
const createError = ref("");
const createForm = ref({
  parentPath: "/",
  name: "",
  data: "",
  mode: "PERSISTENT" as ZkCreateMode,
});

const modeOptions = [
  { value: "PERSISTENT" as ZkCreateMode, label: "持久", desc: "节点永久存在" },
  { value: "EPHEMERAL" as ZkCreateMode, label: "临时", desc: "会话结束自动删除" },
  { value: "PERSISTENT_SEQUENTIAL" as ZkCreateMode, label: "持久顺序", desc: "自动追加序号" },
  { value: "EPHEMERAL_SEQUENTIAL" as ZkCreateMode, label: "临时顺序", desc: "临时 + 序号" },
];

const openCreateDialog = (parentPath: string) => {
  createForm.value = { parentPath, name: "", data: "", mode: "PERSISTENT" };
  createError.value = "";
  createDialogVisible.value = true;
};

const submitCreate = async () => {
  createError.value = "";
  const name = createForm.value.name.trim();
  if (!name) {
    createError.value = "请输入节点名称";
    return;
  }
  const parent = createForm.value.parentPath;
  const fullPath = parent === "/" ? `/${name}` : `${parent}/${name}`;
  creating.value = true;
  try {
    await createZookeeperNode(props.connectionId, fullPath, createForm.value.data, createForm.value.mode);
    ElMessage.success(`节点 ${fullPath} 创建成功`);
    createDialogVisible.value = false;
    await refreshParentNode(parent);
  } catch (e: any) {
    createError.value = e?.message ?? "创建失败";
  } finally {
    creating.value = false;
  }
};

const refreshParentNode = async (parentPath: string) => {
  if (parentPath === "/") {
    await loadRoot();
    return;
  }
  const findAndRefresh = async (nodes: ZkNode[]): Promise<boolean> => {
    for (const node of nodes) {
      if (node.path === parentPath) {
        node.loaded = false;
        if (node.expanded) {
          node.loading = true;
          try {
            const res = await lsZookeeperNode(props.connectionId, node.path);
            node.children = (res?.data ?? []).sort().map((n) => buildNode(n, node.path));
            node.loaded = true;
          } finally {
            node.loading = false;
          }
        }
        return true;
      }
      if (node.children.length && await findAndRefresh(node.children)) return true;
    }
    return false;
  };
  await findAndRefresh(treeNodes.value);
};

// ─── 删除节点 ─────────────────────────────────────────────────────────────────
const deleteDialogVisible = ref(false);
const deletingPath = ref("");
const deleteRecursive = ref(false);
const deleting = ref(false);

const confirmDelete = (path: string) => {
  deletingPath.value = path;
  deleteRecursive.value = false;
  deleteDialogVisible.value = true;
};

const submitDelete = async () => {
  deleting.value = true;
  try {
    await deleteZookeeperNode(props.connectionId, deletingPath.value, deleteRecursive.value);
    ElMessage.success(`节点 ${deletingPath.value} 已删除`);
    deleteDialogVisible.value = false;
    if (activePath.value === deletingPath.value || activePath.value.startsWith(deletingPath.value + "/")) {
      activePath.value = "";
      nodeStat.value = null;
      editData.value = "";
    }
    const parent = deletingPath.value.substring(0, deletingPath.value.lastIndexOf("/")) || "/";
    await refreshParentNode(parent);
  } catch (e: any) {
    ElMessage.error("删除失败: " + (e?.message ?? ""));
  } finally {
    deleting.value = false;
  }
};

// ─── 连接信息 ─────────────────────────────────────────────────────────────────
const loadConnectionInfo = () => {
  // 连接信息已在模板中直接展示，此处可扩展 ruok/stat 命令
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
const formatTs = (ms: number) => {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("zh-CN", { hour12: false });
};

// 初始化
onMounted(loadRoot);
</script>

<style scoped lang="scss">
.zk-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.zk-layout {
  height: 100%;
  min-height: 0;
}

/* ── 左侧树面板 ── */
.tree-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, #f0f2f9, #e8ecf5);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
    pointer-events: none;
    z-index: 1;
  }
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 10px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.tree-toolbar :deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
}

.tree-scroll {
  flex: 1;
  min-height: 0;
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: #94a3b8;
  font-size: 13px;
}

.zk-tree {
  padding: 6px 0;
}

/* ── ZNode 行（全局样式，因为是动态渲染） ── */
:deep(.zk-node__row) {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding-right: 8px;
  border-radius: 8px;
  margin: 1px 6px;
  cursor: pointer;
  transition: background 0.14s ease;
  color: #334155;
  font-size: 13px;
  position: relative;

  &:hover {
    background: rgba(99, 102, 241, 0.08);

    .zk-node__actions {
      opacity: 1;
    }
  }

  &.is-active {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.14), rgba(99, 102, 241, 0.06));
    color: #4f46e5;
    font-weight: 600;
  }
}

:deep(.zk-node__arrow) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.18s ease;
  cursor: pointer;

  &.is-expanded {
    transform: rotate(90deg);
  }
}

:deep(.zk-node__icon) {
  color: #6366f1;
  font-size: 14px;
  flex-shrink: 0;
}

:deep(.zk-node__name) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

:deep(.zk-node__actions) {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.14s ease;
  flex-shrink: 0;

  .el-button {
    width: 22px;
    height: 22px;
    padding: 0;
  }
}

/* ── 右侧主内容 ── */
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* ── 空状态 ── */
.empty-workspace {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #f0f2f9, #e8ecf5);
}

.empty-workspace__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-workspace__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12));
  border: 1px solid rgba(99, 102, 241, 0.16);
}

.empty-workspace__icon {
  font-size: 32px;
  color: #6366f1;
}

.empty-workspace__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-workspace__sub {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
}

/* ── 节点面板 ── */
.node-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #f0f2f9, #e8ecf5);
}

.node-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.node-toolbar__left,
.node-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.node-breadcrumb__item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.node-breadcrumb__seg {
  font-size: 13px;
  color: #8b5cf6;
  font-family: "JetBrains Mono", "Fira Code", monospace;

  &.is-last {
    color: #6366f1;
    font-weight: 600;
  }
}

.node-breadcrumb__sep {
  color: #a78bfa;
  font-size: 13px;
}

/* ── 数据编辑区 ── */
.data-section {
  flex-shrink: 0;
  margin: 14px 16px 0;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.04);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
  }
}

.data-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.8);
}

.data-section__title {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

.data-section__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.format-tabs {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.12);
}

.format-tab {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.14s ease;

  &.is-active {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    color: #6366f1;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(99, 102, 241, 0.12);
  }
}

.data-editor-wrap {
  padding: 12px;
}

.data-editor :deep(.el-textarea__inner) {
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 13px;
  line-height: 1.6;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 10px;
  background: #fafbfc;
  color: #1e293b;
  resize: none;
  box-shadow: none;

  &:focus {
    border-color: rgba(99, 102, 241, 0.4);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  }
}

.data-error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  font-size: 12px;
}

/* ── 元信息区 ── */
.stat-section {
  margin: 12px 16px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.04);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
  }
}

.stat-section__title {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.8);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1px;
  background: rgba(148, 163, 184, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.75);
  }
}

.stat-item__key {
  font-size: 11px;
  color: #94a3b8;
  letter-spacing: 0.04em;
}

.stat-item__val {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  font-family: "JetBrains Mono", monospace;
}

/* ── 信息面板 ── */
.info-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, #f0f2f9, #e8ecf5);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  flex-shrink: 0;
}

.info-title {
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.info-scroll {
  flex: 1;
  min-height: 0;
}

.info-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #94a3b8;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.info-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
    transform: translateY(-1px);
  }
}

.info-card__title {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.8);
}

.info-card__body {
  padding: 4px 0;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.info-row__label {
  font-size: 12px;
  color: #64748b;
}

.info-row__val {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;

  &.info-row__val--mono {
    font-family: "JetBrains Mono", monospace;
    font-size: 12px;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.status-dot--ok {
    background: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
}

/* ── 创建节点对话框 ── */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.create-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.create-field__label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;

  &.create-field__label--required::after {
    content: " *";
    color: #ef4444;
  }
}

.mode-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.8);
  cursor: pointer;
  transition: all 0.14s ease;
  text-align: left;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.04);
  }

  &.is-active {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.08);
  }
}

.mode-option__label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.mode-option__desc {
  font-size: 11px;
  color: #94a3b8;
}

.create-error {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  font-size: 13px;
}

/* ── 删除确认 ── */
.delete-confirm {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.delete-confirm__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  font-size: 22px;
  flex-shrink: 0;
}

.delete-confirm__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;

  p {
    margin: 0;
    font-size: 14px;
    color: #1e293b;

    code {
      font-family: "JetBrains Mono", monospace;
      font-size: 13px;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.1);
      color: #4f46e5;
    }
  }
}

.delete-confirm__recursive {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.delete-confirm__warn {
  font-size: 12px;
  color: #ef4444 !important;
}

/* ── Dark Mode ── */
:global(html.dark) {
  .tree-panel {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));

    &::after {
      background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
    }
  }

  .tree-toolbar {
    background: rgba(15, 23, 42, 0.7);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }

  .tree-toolbar :deep(.el-input__wrapper) {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.15);
  }

  .tree-empty { color: #64748b; }

  :deep(.zk-node__row) {
    color: #cbd5e1;

    &:hover { background: rgba(99, 102, 241, 0.12); }
    &.is-active {
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1));
      color: #a5b4fc;
    }
  }

  :deep(.zk-node__arrow) { color: #64748b; }
  :deep(.zk-node__icon) { color: #818cf8; }
  :deep(.zk-node__name) { color: #e2e8f0; }

  .empty-workspace {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(20, 30, 48, 0.85));
  }

  .empty-workspace__title {
    background: linear-gradient(135deg, #818cf8, #a78bfa, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .empty-workspace__sub { color: #64748b; }

  .empty-workspace__icon-wrap {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(139, 92, 246, 0.18));
    border-color: rgba(99, 102, 241, 0.25);
  }

  .node-panel {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));
  }

  .node-toolbar {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }

  .node-breadcrumb__seg {
    color: #a78bfa;
    &.is-last { color: #a5b4fc; }
  }

  .node-breadcrumb__sep { color: #7c3aed; }

  .data-section {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(8px);
    border-color: rgba(148, 163, 184, 0.1);
    box-shadow: 0 1px 3px rgba(99, 102, 241, 0.06);
  }

  .data-section__header {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }

  .data-section__title { color: #a5b4fc; }

  .format-tabs { background: rgba(148, 163, 184, 0.1); }

  .format-tab {
    color: #64748b;
    &.is-active {
      background: rgba(15, 23, 42, 0.8);
      color: #a5b4fc;
    }
  }

  .data-editor :deep(.el-textarea__inner) {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.15);
    color: #e2e8f0;

    &:focus {
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }

  .stat-section {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(8px);
    border-color: rgba(148, 163, 184, 0.1);
    box-shadow: 0 1px 3px rgba(99, 102, 241, 0.06);
  }

  .stat-section__title {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    border-bottom-color: rgba(148, 163, 184, 0.1);
    color: #a5b4fc;
  }

  .stat-grid { background: rgba(148, 163, 184, 0.06); }
  .stat-item {
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
  }
  .stat-item__key { color: #64748b; }
  .stat-item__val { color: #e2e8f0; }

  .info-panel {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(20, 30, 48, 0.84));
  }

  .info-header {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    border-bottom-color: rgba(148, 163, 184, 0.1);
  }

  .info-title {
    background: linear-gradient(135deg, #818cf8, #a78bfa, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .info-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(8px);
    border-color: rgba(148, 163, 184, 0.1);
    box-shadow: 0 1px 3px rgba(99, 102, 241, 0.06);
  }

  .info-card__title {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    border-bottom-color: rgba(148, 163, 184, 0.1);
    color: #a5b4fc;
  }

  .info-row { border-bottom-color: rgba(148, 163, 184, 0.06); }
  .info-row__label { color: #64748b; }
  .info-row__val { color: #e2e8f0; }

  .create-field__label { color: #e2e8f0; }

  .mode-option {
    background: rgba(15, 23, 42, 0.5);
    border-color: rgba(148, 163, 184, 0.15);

    &:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.08);
    }

    &.is-active {
      border-color: #818cf8;
      background: rgba(99, 102, 241, 0.14);
    }
  }

  .mode-option__label { color: #e2e8f0; }
  .mode-option__desc { color: #64748b; }
}
</style>

