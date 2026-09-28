<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Share" :size="18" class="dsm-title-icon dsm-zk-icon" />
        <span class="dsm-title">ZooKeeper 注册中心管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton :disabled="!source" :loading="clusterLoading" @click="openCluster"><template #icon><ReIcon name="Monitor" /></template>集群信息</ReButton>
        <ReButton :disabled="!source" :loading="testing" @click="testConnection"><template #icon><ReIcon name="Connection" /></template>测试连接</ReButton>
        <ReButton :loading="loading" @click="refresh"><template #icon><ReIcon name="Refresh" /></template>刷新</ReButton>
        <ReButton type="primary" :disabled="!source" @click="openCreate"><template #icon><ReIcon name="Plus" /></template>新建节点</ReButton>
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div class="dsm-body">
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div
            class="dsm-tree-node dsm-tree-root"
            :class="{ active: activePath === '/' }"
            @click="selectNode('/')"
            @contextmenu.prevent="onNodeContextMenu($event, '/')"
          >
            <ReIcon :name="rootExpanded ? 'ArrowDown' : 'ArrowRight'" size="12" @click.stop="toggleRoot" />
            <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
            <span class="dsm-tree-label">/ (根节点)</span>
          </div>
          <div v-if="rootExpanded" class="dsm-tree-children dsm-tree-flat">
            <div
              v-for="node in treeNodes"
              :key="node.path"
              class="dsm-tree-node"
              :class="{ active: activePath === node.path }"
              :style="{ paddingLeft: `${(node.depth - 1) * 14}px` }"
              @click="selectNode(node.path)"
              @contextmenu.prevent="onNodeContextMenu($event, node.path)"
            >
              <ReIcon
                :name="node.childCount > 0 ? (node.expanded ? 'ArrowDown' : 'ArrowRight') : 'MoreFilled'"
                size="12"
                @click.stop="toggleNode(node)"
              />
              <ReIcon :name="node.ephemeral ? 'Lock' : 'Folder'" size="14" class="dsm-tree-icon" :class="{ 'dsm-ephemeral': node.ephemeral }" />
              <span class="dsm-tree-label">{{ node.name }}</span>
              <span v-if="node.childCount > 0" class="dsm-tree-count">{{ node.childCount }}</span>
              <span v-if="node.ephemeral" class="dsm-ephemeral-tag">E</span>
            </div>
            <div v-if="treeNodes.length === 0" class="dsm-tree-node">
              <span class="dsm-tree-label">{{ gap ? "未读取到子节点" : "根节点下暂无子节点" }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dsm-content">
        <div class="dsm-info-card">
          <div class="dsm-info-row"><span class="dsm-info-label">数据源</span><span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 2181}` : "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">当前路径</span><span class="dsm-info-value mono">{{ activePath || "—" }}</span></div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <ReTag :type="gap ? 'danger' : 'success'" >{{ gap ? "读取失败" : "正常" }}</ReTag>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">服务端版本</span>
            <span class="dsm-info-value mono">{{ zkVersion || "未探测" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">会话 ID</span>
            <span class="dsm-info-value mono">{{ sessionId || "未探测" }}</span>
          </div>
        </div>

        <div v-if="activePath" class="dsm-section">
          <div class="dsm-section-title">
            节点详情 - {{ activePath }}
            <div class="dsm-section-actions">
              <ReButton text @click="loadNodeDetail"><template #icon><ReIcon name="Refresh" size="12" /></template>刷新</ReButton>
              <ReButton text type="primary" :disabled="!nodeDetail" @click="editNode"><template #icon><ReIcon name="Edit" size="12" /></template>编辑数据</ReButton>
              <ReButton text type="danger" :disabled="!nodeDetail" @click="deleteNode()"><template #icon><ReIcon name="Delete" size="12" /></template>删除</ReButton>
            </div>
          </div>

          <template v-if="nodeDetail">
            <div class="dsm-node-detail">
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">节点路径</span>
                <span class="dsm-detail-value mono">{{ nodeDetail.path }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">节点类型</span>
                <ReTag :type="nodeDetail.ephemeral ? 'warning' : 'info'" >
                  {{ nodeDetail.ephemeral ? "临时节点 (Ephemeral)" : "持久节点 (Persistent)" }}
                </ReTag>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">创建时间 (ctime)</span>
                <span class="dsm-detail-value">{{ nodeDetail.createdAt || "—" }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">修改时间 (mtime)</span>
                <span class="dsm-detail-value">{{ nodeDetail.updatedAt || "—" }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">数据版本 (version)</span>
                <span class="dsm-detail-value">{{ nodeDetail.version }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">子节点版本 (cversion)</span>
                <span class="dsm-detail-value">{{ (nodeDetail as ZkNodeDetailFull).cversion ?? 0 }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">ACL 版本 (aversion)</span>
                <span class="dsm-detail-value">{{ (nodeDetail as ZkNodeDetailFull).aversion ?? 0 }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">子节点数 (numChildren)</span>
                <span class="dsm-detail-value">{{ nodeDetail.numChildren }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">数据长度 (dataLength)</span>
                <span class="dsm-detail-value">{{ nodeDetail.dataLength }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">创建 zxid (czxid)</span>
                <span class="dsm-detail-value mono">{{ (nodeDetail as ZkNodeDetailFull).czxid ?? "—" }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">修改 zxid (mzxid)</span>
                <span class="dsm-detail-value mono">{{ (nodeDetail as ZkNodeDetailFull).mzxid ?? "—" }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">子节点 zxid (pzxid)</span>
                <span class="dsm-detail-value mono">{{ (nodeDetail as ZkNodeDetailFull).pzxid ?? "—" }}</span>
              </div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">临时节点会话 (ephemeralOwner)</span>
                <span class="dsm-detail-value mono">{{ nodeDetail.ephemeral ? ((nodeDetail as ZkNodeDetailFull).ephemeralOwner ?? "—") : "0 (持久)" }}</span>
              </div>
            </div>

            <div class="dsm-data-section">
              <div class="dsm-tabs">
                <div class="dsm-tab" :class="{ active: detailTab === 'data' }" @click="detailTab = 'data'">节点数据</div>
                <div class="dsm-tab" :class="{ active: detailTab === 'acl' }" @click="openAcl">ACL</div>
              </div>
              <div v-if="detailTab === 'data'" class="dsm-data-block">
                <div class="dsm-data-title">{{ isJsonData ? "JSON 格式化" : "节点数据 (Data)" }}</div>
                <textarea class="dsm-data-readonly mono" readonly :value="isJsonData ? formattedJson : (nodeDetail.data || '(空)')" rows="8" />
              </div>
              <div v-else class="dsm-data-block">
                <div class="dsm-data-title">ACL 列表</div>
                <ReTable :data="aclList" :columns="aclColumns" :loading="aclLoading" :pagination="false" stripe border >
                  <template #col-perms="{ row }">
                    <ReTag type="info">{{ (row as unknown as ZkNodeAcl).permsText }}</ReTag>
                  </template>
                </ReTable>
              </div>
            </div>
          </template>
          <div v-else class="dsm-data-section">
            <ReEmpty :description="nodeLoading ? '正在读取节点详情…' : gap || '未读取到节点详情'" />
          </div>

          <div v-if="children.length > 0" class="dsm-children-section">
            <div class="dsm-data-title">子节点列表</div>
            <ReTable :data="children" :columns="childColumns" :loading="childLoading" :pagination="false" stripe border >
              <template #col-type="{ row }">
                <ReTag :type="(row as unknown as ZkChildNode).ephemeral ? 'warning' : 'info'" >
                  {{ (row as unknown as ZkChildNode).ephemeral ? "临时" : "持久" }}
                </ReTag>
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
          <span v-if="nodeForm.ephemeral" class="dsm-form-hint">
            临时节点只在管理端复用的那条 ZooKeeper 会话内存活，页面空闲约五分钟后会话回收，节点会随之消失。
          </span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="nodeDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="saveNode">
          <template #icon><ReIcon name="Check" /></template>{{ editing ? "保存" : "创建" }}
        </ReButton>
      </template>
    </ReDialog>

    <ReDialog v-model="clusterVisible" title="ZooKeeper 集群信息（mntr）" width="960px">
      <ReTable :data="clusterList" :columns="clusterColumns" :loading="clusterLoading" :pagination="false" stripe border >
        <template #col-state="{ row }">
          <ReTag :type="(row as unknown as ZkClusterNode).zkServerState === 'leader' ? 'warning' : 'info'" >
            {{ (row as unknown as ZkClusterNode).zkServerState || "—" }}
          </ReTag>
        </template>
        <template #col-error="{ row }">
          <span v-if="(row as unknown as ZkClusterNode).error" class="mono" style="color: #ef4444; font-size: 12px">
            {{ (row as unknown as ZkClusterNode).error }}
          </span>
          <span v-else>—</span>
        </template>
        <template #default="{ row }">
          <tr v-if="(row as unknown as ZkClusterNode).zkServerState === 'leader'" />
        </template>
      </ReTable>
      <div class="dsm-form-hint" style="margin-top: 8px">
        四字命令 mntr 需在服务端 4lw.commands.whitelist 中放开；多节点时 leader 行高亮显示。
      </div>
    </ReDialog>
  </div>

  <!-- 节点右键菜单 -->
  <div
    v-if="nodeContextMenu.visible"
    class="zk-context-menu"
    :style="{ left: nodeContextMenu.x + 'px', top: nodeContextMenu.y + 'px' }"
  >
    <div class="zkm-item" @click="menuSelect('detail')"><ReIcon name="View" size="14" />查看详情</div>
    <div class="zkm-item" @click="menuSelect('copy')"><ReIcon name="Copy" size="14" />复制路径</div>
    <div class="zkm-item" @click="menuSelect('edit')"><ReIcon name="Edit" size="14" />编辑数据</div>
    <div class="zkm-item" @click="menuSelect('child')"><ReIcon name="Plus" size="14" />新建子节点</div>
    <div class="zkm-item" @click="menuSelect('export')"><ReIcon name="Download" size="14" />导出节点</div>
    <div class="zkm-divider"></div>
    <div class="zkm-item zkm-danger" @click="menuSelect('delete')"><ReIcon name="Delete" size="14" />删除节点</div>
    <div class="zkm-item zkm-warning" @click="menuSelect('delete-tree')"><ReIcon name="Delete" size="14" />递归删除（含子节点）</div>
    <div class="zkm-divider"></div>
    <div class="zkm-item" @click="menuSelect('refresh')"><ReIcon name="Refresh" size="14" />刷新</div>
  </div>
</template>

<script setup lang="ts">
/**
 * ZooKeeper 管理页
 *
 * <p>基于「数据源管理」登记的 zookeeper 数据源，通过后端 zookeeper 管理接口按需展开真实节点树，
 * 查看节点详情/子节点并支持创建、改数据、删除与递归删除；接口缺失或连接失败时只展示失败原因，
 * 不回落任何演示数据。</p>
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import MiddlewareGap from "../components/MiddlewareGap.vue";
import { useMiddlewareSource } from "../utils/middlewareSource";
import {
  createZkNode,
  deleteZkNode,
  fetchZkChildren,
  fetchZkNodeDetail,
  fetchZkTree,
  testZookeeperConnection,
  updateZkNode,
  type ZkChildNode,
  type ZkNodeDetail,
} from "../monitorApi";
import {
  deleteZkNodeRecursive,
  fetchZkCluster,
  fetchZkNodeAcl,
  type ZkClusterNode,
  type ZkNodeAcl,
  type ZkNodeDetailFull,
} from "../zkNacosApi";

/** 侧栏扁平树节点 */
interface FlatNode {
  path: string;
  name: string;
  ephemeral: boolean;
  depth: number;
  childCount: number;
  expanded: boolean;
  loaded: boolean;
}

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

const rootExpanded = ref(false);
const treeNodes = ref<FlatNode[]>([]);
const activePath = ref("");
const loading = ref(false);
const testing = ref(false);
const nodeLoading = ref(false);
const childLoading = ref(false);
const saving = ref(false);

const zkVersion = ref("");
const sessionId = ref("");

const nodeDetail = ref<ZkNodeDetail | null>(null);
const children = ref<ZkChildNode[]>([]);

/** 详情页签：数据 / ACL */
const detailTab = ref<"data" | "acl">("data");
const aclList = ref<ZkNodeAcl[]>([]);
const aclLoading = ref(false);

/** 集群信息弹窗 */
const clusterVisible = ref(false);
const clusterLoading = ref(false);
const clusterList = ref<ZkClusterNode[]>([]);

/** 集群节点表格列 */
const clusterColumns = [
  { prop: "host", label: "节点", minWidth: 150, slot: null },
  { prop: "zkVersion", label: "版本", minWidth: 130 },
  { prop: "zkServerState", label: "角色", width: 100, slot: "state" },
  { prop: "zkAvgLatency", label: "平均延迟(ms)", width: 120 },
  { prop: "zkMaxLatency", label: "最大延迟", width: 100 },
  { prop: "zkNumAliveConnections", label: "连接数", width: 90 },
  { prop: "zkOutstandingRequests", label: "堆积请求", width: 90 },
  { prop: "zkZnodeCount", label: "Znode 数", width: 90 },
  { prop: "zkWatchCount", label: "Watch 数", width: 90 },
  { prop: "error", label: "状态", minWidth: 120, slot: "error" },
];

/** ACL 表格列 */
const aclColumns = [
  { prop: "scheme", label: "Scheme", width: 140 },
  { prop: "id", label: "ID", minWidth: 180 },
  { prop: "permsText", label: "权限", width: 220, slot: "perms" },
];

/** 节点数据是否为 JSON */
const isJsonData = computed(() => {
  const raw = (nodeDetail.value?.data || "").trim();
  if (!raw) return false;
  return (raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"));
});

/** JSON 格式化结果，解析失败时回退原文 */
const formattedJson = computed(() => {
  const raw = nodeDetail.value?.data || "";
  if (!isJsonData.value) return raw;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
});

const childColumns = [
  { prop: "name", label: "子节点名称", minWidth: 200 },
  { prop: "ephemeral", label: "类型", width: 120, slot: "type" },
  { prop: "data", label: "数据", minWidth: 200 }
];

const nodeDialogVisible = ref(false);
const editing = ref(false);
const nodeForm = reactive({ path: "", data: "", ephemeral: false });

/**
 * 拼子节点绝对路径
 * @param parent 父路径
 * @param name 子节点名
 * @returns 绝对路径
 */
function childPath(parent: string, name: string): string {
  if (parent === "/") return `/${name}`;
  return `${parent}/${name}`;
}

/**
 * 加载根节点的直接子节点
 */
async function loadRootChildren() {
  loading.value = true;
  try {
    const nodes = (await fetchZkTree(datasourceId.value, "/")) || [];
    treeNodes.value = nodes.map(n => ({
      path: n.path || childPath("/", n.name),
      name: n.name,
      ephemeral: !!n.ephemeral,
      depth: 1,
      childCount: n.childrenCount ?? 0,
      expanded: false,
      loaded: false,
    }));
    rootExpanded.value = true;
    ready();
  } catch (e) {
    treeNodes.value = [];
    fail(e, "/ms/monitor/zookeeper/tree");
  } finally {
    loading.value = false;
  }
}

/**
 * 展开/收起根节点
 */
function toggleRoot() {
  if (rootExpanded.value) {
    rootExpanded.value = false;
    return;
  }
  void loadRootChildren();
}

/**
 * 展开/收起树节点，首次展开时按需拉取子节点
 * @param node 树节点
 */
async function toggleNode(node: FlatNode) {
  if (node.expanded) {
    collapse(node);
    return;
  }
  if (!node.loaded) {
    try {
      const nodes = (await fetchZkTree(datasourceId.value, node.path)) || [];
      node.loaded = true;
      const idx = treeNodes.value.indexOf(node);
      treeNodes.value.splice(
        idx + 1,
        0,
        ...nodes.map(child => ({
          path: child.path || childPath(node.path, child.name),
          name: child.name,
          ephemeral: !!child.ephemeral,
          depth: node.depth + 1,
          childCount: child.childrenCount ?? 0,
          expanded: false,
          loaded: false,
        }))
      );
      ready();
    } catch (e) {
      fail(e, "/ms/monitor/zookeeper/tree");
      return;
    }
  }
  node.expanded = true;
}

/**
 * 收起节点，移除其下所有可见行
 * @param node 树节点
 */
function collapse(node: FlatNode) {
  const idx = treeNodes.value.indexOf(node);
  let end = idx + 1;
  while (end < treeNodes.value.length && treeNodes.value[end].depth > node.depth) end++;
  treeNodes.value.splice(idx + 1, end - idx - 1);
  node.expanded = false;
}

/**
 * 选中节点并加载详情与子节点
 * @param path 节点路径
 */
async function selectNode(path: string) {
  activePath.value = path;
  detailTab.value = "data";
  aclList.value = [];
  void loadNodeDetail();
  void loadChildren();
}

/**
 * 加载当前节点详情
 */
async function loadNodeDetail() {
  if (!activePath.value) return;
  nodeLoading.value = true;
  try {
    nodeDetail.value = await fetchZkNodeDetail(activePath.value, datasourceId.value);
    ready();
  } catch (e) {
    nodeDetail.value = null;
    fail(e, "/ms/monitor/zookeeper/node");
  } finally {
    nodeLoading.value = false;
  }
}

/**
 * 加载当前节点的子节点列表
 */
async function loadChildren() {
  if (!activePath.value) return;
  childLoading.value = true;
  try {
    children.value = (await fetchZkChildren(activePath.value, datasourceId.value)) || [];
    ready();
  } catch (e) {
    children.value = [];
    fail(e, "/ms/monitor/zookeeper/children");
  } finally {
    childLoading.value = false;
  }
}

/**
 * 打开集群信息弹窗并采集 mntr 指标
 */
async function openCluster() {
  clusterVisible.value = true;
  clusterLoading.value = true;
  clusterList.value = [];
  try {
    clusterList.value = (await fetchZkCluster(datasourceId.value)) || [];
    ready();
  } catch (e) {
    clusterList.value = [];
    fail(e, "/ms/monitor/zookeeper/cluster");
  } finally {
    clusterLoading.value = false;
  }
}

/**
 * 打开 ACL 页签并加载节点 ACL 列表
 */
async function openAcl() {
  detailTab.value = "acl";
  if (!activePath.value) return;
  aclLoading.value = true;
  aclList.value = [];
  try {
    aclList.value = (await fetchZkNodeAcl(activePath.value, datasourceId.value)) || [];
    ready();
  } catch (e) {
    aclList.value = [];
    fail(e, "/ms/monitor/zookeeper/node/acl");
  } finally {
    aclLoading.value = false;
  }
}

/**
 * 重新加载数据源、树与当前节点
 */
async function refresh() {
  if (!source.value) {
    await bind("zookeeper");
    if (!source.value) return;
  }
  await loadRootChildren();
  if (activePath.value) {
    await Promise.all([loadNodeDetail(), loadChildren()]);
  }
}

/**
 * 探测当前数据源的 ZooKeeper 连通性，回填服务端版本与会话 ID
 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testZookeeperConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      zkVersion.value = result.version || "";
      sessionId.value = result.sessionId || "";
      ready();
      ElMessage.success(result.version ? `连接成功 · ZooKeeper ${result.version}` : "连接成功");
    } else {
      ElMessage.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/zookeeper/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 打开新建节点弹窗
 */
function openCreate() {
  editing.value = false;
  Object.assign(nodeForm, { path: "", data: "", ephemeral: false });
  nodeDialogVisible.value = true;
}

/**
 * 打开新建子节点弹窗
 * @param parentPath 父路径
 */
function openCreateChild(parentPath: string) {
  editing.value = false;
  Object.assign(nodeForm, { path: childPath(parentPath, "new-node"), data: "", ephemeral: false });
  nodeDialogVisible.value = true;
}

/**
 * 进入编辑数据态
 */
function editNode() {
  if (!nodeDetail.value) return;
  editing.value = true;
  Object.assign(nodeForm, { path: nodeDetail.value.path, data: nodeDetail.value.data || "", ephemeral: nodeDetail.value.ephemeral });
  nodeDialogVisible.value = true;
}

/**
 * 保存节点（创建或改数据）
 */
async function saveNode() {
  const path = nodeForm.path.trim();
  if (!path || (editing.value === false && !path.startsWith("/"))) {
    ElMessage.warning("节点路径需以 / 开头");
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      await updateZkNode({ path, data: nodeForm.data, datasourceId: datasourceId.value });
      ElMessage.success("节点数据已更新");
    } else {
      await createZkNode({ path, data: nodeForm.data, ephemeral: nodeForm.ephemeral, datasourceId: datasourceId.value });
      ElMessage.success("节点已创建");
    }
    nodeDialogVisible.value = false;
    ready();
    activePath.value = path;
    await Promise.all([refresh(), loadNodeDetail(), loadChildren()]);
  } catch (e) {
    fail(e, "/ms/monitor/zookeeper/node");
  } finally {
    saving.value = false;
  }
}

/**
 * 删除节点
 * @param path 节点路径，缺省为当前选中节点
 */
async function deleteNode(path = activePath.value) {
  if (!path) return;
  try {
    await ElMessageBox.confirm(`确定删除节点 ${path} 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteZkNode(path, datasourceId.value);
    ElMessage.success("节点已删除");
    ready();
    if (activePath.value === path) {
      activePath.value = "";
      nodeDetail.value = null;
      children.value = [];
    }
    await loadRootChildren();
  } catch (e) {
    fail(e, "/ms/monitor/zookeeper/node");
  }
}

/**
 * 递归删除节点及其子节点（后端一次性递归删除）
 * @param path 节点路径
 */
async function deleteRecursive(path: string) {
  try {
    await ElMessageBox.confirm(
      `确定递归删除节点 ${path} 及其所有子孙节点吗？此操作不可恢复！`,
      "递归删除确认",
      { type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await deleteZkNodeRecursive(path, datasourceId.value, true);
    ElMessage.success("递归删除完成");
    ready();
    if (activePath.value === path) {
      activePath.value = "";
      nodeDetail.value = null;
      children.value = [];
    }
    await loadRootChildren();
  } catch (e) {
    fail(e, "/ms/monitor/zookeeper/node");
  }
}

/**
 * 导出节点详情与子节点
 * @param path 节点路径
 */
async function exportNode(path: string) {
  try {
    const detail = await fetchZkNodeDetail(path, datasourceId.value);
    const list = (await fetchZkChildren(path, datasourceId.value)) || [];
    const payload = {
      path,
      datasource: source.value?.name ?? "",
      datasourceId: datasourceId.value,
      detail,
      children: list.map(c => ({ name: c.name, path: c.path || childPath(path, c.name), ephemeral: c.ephemeral, data: c.data })),
      exportTime: new Date().toISOString(),
    };
    ready();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zk-${path.replace(/[^a-zA-Z0-9]/g, "_") || "root"}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success("导出成功");
  } catch (e) {
    fail(e, "/ms/monitor/zookeeper/node");
  }
}

// ==================== 右键菜单 ====================
const nodeContextMenu = reactive({ visible: false, x: 0, y: 0, path: "" });

/**
 * 打开右键菜单
 * @param event 原生事件
 * @param path 节点路径
 */
function onNodeContextMenu(event: MouseEvent, path: string) {
  event.preventDefault();
  Object.assign(nodeContextMenu, { visible: true, x: event.clientX, y: event.clientY, path });
}

/**
 * 关闭右键菜单
 */
function closeMenu() {
  nodeContextMenu.visible = false;
}

/**
 * 菜单动作分发
 * @param action 动作键
 */
function menuSelect(action: "detail" | "copy" | "edit" | "child" | "export" | "delete" | "delete-tree" | "refresh") {
  const path = nodeContextMenu.path;
  closeMenu();
  if (!path) return;
  if (action === "detail") {
    selectNode(path);
    return;
  }
  if (action === "copy") {
    navigator.clipboard
      .writeText(path)
      .then(() => ElMessage.success("已复制路径"))
      .catch(() => ElMessage.error("复制失败"));
    return;
  }
  if (action === "edit") {
    selectNode(path);
    editNode();
    return;
  }
  if (action === "child") openCreateChild(path);
  else if (action === "export") void exportNode(path);
  else if (action === "delete") void deleteNode(path);
  else if (action === "delete-tree") void deleteRecursive(path);
  else if (action === "refresh") void refresh();
}

onMounted(async () => {
  window.addEventListener("click", closeMenu);
  await bind("zookeeper");
  if (source.value) {
    await refresh();
    selectNode("/");
  }
});
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
.dsm-tree-flat { padding-left: 4px; }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-ephemeral { color: #f59e0b; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsm-tree-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-fill); padding: 1px 6px; border-radius: 10px; }
.dsm-ephemeral-tag { font-size: 10px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 1px 5px; border-radius: 4px; font-weight: 600; }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.dsm-info-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 14px 16px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); }
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
.dsm-tabs { display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid var(--border-subtle); }
.dsm-tab { padding: 6px 14px; font-size: 13px; cursor: pointer; color: var(--text-tertiary); border-bottom: 2px solid transparent; transition: all 0.15s; }
.dsm-tab:hover { color: var(--brand-600); }
.dsm-tab.active { color: var(--brand-600); border-bottom-color: var(--brand-500); font-weight: 600; }
.dsm-data-block { margin-top: 4px; }
.dsm-data-readonly { width: 100%; padding: 12px; background: var(--bg-fill); border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 12px; color: var(--text-primary); resize: vertical; outline: none; white-space: pre; overflow: auto; min-height: 120px; }
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
.dsm-form-hint { font-size: 12px; line-height: 1.5; color: var(--text-tertiary); }
.dsm-node-data { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-node-data:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
</style>