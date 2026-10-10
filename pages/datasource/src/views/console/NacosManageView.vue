<template>
  <div class="dsm tel-page" :class="{ resizing }">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Setting" :size="18" class="dsm-title-icon dsm-nacos-icon" />
        <span class="dsm-title">Nacos 配置中心管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton layout="square" icon="Connection" tip="测试连接" data-testid="dsm-btn-test" :disabled="!source" :loading="testing" @click="testConnection" />
        <ReButton layout="square" icon="Refresh" tip="刷新" data-testid="dsm-btn-refresh" :loading="loading" @click="reloadAll" />
        <ReButton layout="square" type="primary" icon="Plus" tip="新建配置" data-testid="dsm-btn-create" :disabled="!source" @click="openCreate" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="reloadAll" />

    <div class="dsm-body">
      <div class="dsm-sidebar" :style="{ width: leftWidth + 'px' }">
        <!-- 侧栏搜索（Redis 模板）：过滤命名空间，回车或点查询触发重载 -->
        <div class="dsm-search-section">
          <ReInput v-model="sidebarKeyword" placeholder="过滤命名空间" @keyup.enter="reloadAll" />
          <ReButton type="primary" :loading="loading" @click="reloadAll"><template #icon><ReIcon name="Search" size="12" /></template>查询</ReButton>
        </div>
        <!-- 计数条 + 快捷刷新（Redis dsm-view-bar） -->
        <div class="dsm-view-bar">
          <span class="dsm-view-count">{{ filteredNamespaces.length }} 命名空间 · {{ services.length }} 服务</span>
          <span class="dsm-view-spacer" />
          <ReButton layout="square" icon="Refresh" tip="刷新" data-testid="dsm-view-refresh" :loading="loading" @click="reloadAll" />
        </div>
        <div class="dsm-key-list">
          <!-- 顶部细扫描条 = 刷新中 -->
          <div class="dsm-scan-bar" :class="{ 'is-active': loading }" data-testid="dsm-scan-bar"><span /></div>
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Setting" size="14" class="dsm-tree-icon dsm-nacos-icon" />
            <span class="dsm-tree-label">{{ connectionName }}</span>
          </div>
          <div v-if="expandedNodes.has('root')" class="dsm-tree-children">
            <div class="dsm-tree-node" @click="toggleNode('ns')">
              <ReIcon :name="expandedNodes.has('ns') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">命名空间</span>
              <span class="dsm-tree-count">{{ namespaces.length }}</span>
              <span class="dsm-tree-actions" data-testid="dsm-tree-actions" @click.stop>
                <ReButton layout="square" size="small" icon="Plus" tip="新建命名空间" data-testid="dsm-ns-create" @click="openNamespaceDialog('create')" />
                <ReButton layout="square" size="small" icon="Edit" tip="编辑命名空间" data-testid="dsm-ns-edit" :disabled="!canEditNamespace" @click="openNamespaceDialog('edit')" />
                <ReButton layout="square" size="small" type="danger" icon="Delete" tip="删除命名空间" data-testid="dsm-ns-delete" :disabled="!canEditNamespace" @click="removeNamespace" />
              </span>
            </div>
            <div v-if="expandedNodes.has('ns')" class="dsm-tree-children">
              <div
                v-for="ns in filteredNamespaces"
                :key="ns.id"
                class="dsm-tree-node dsm-leaf-node"
                :class="{ active: activeNs === ns.id }"
                @click="selectNs(ns.id)"
                @contextmenu.prevent="onNsContextMenu($event, ns.id)"
              >
                <ReIcon name="Folder" size="12" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ ns.name }}</span>
                <span class="dsm-tree-count">{{ ns.configCount }}</span>
              </div>
              <div v-if="filteredNamespaces.length === 0" class="dsm-tree-node dsm-leaf-node">
                <span class="dsm-tree-label">{{ gap ? "未读取到命名空间" : (sidebarKeyword ? "无匹配命名空间" : "暂无命名空间") }}</span>
              </div>
            </div>
            <div class="dsm-tree-node" :class="{ active: activeView === 'services' }" @click="activeView = 'services'">
              <ReIcon name="Connection" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">服务列表</span>
              <span class="dsm-tree-count">{{ services.length }}</span>
            </div>
            <div class="dsm-tree-node" :class="{ active: activeView === 'clusters' }" @click="activeView = 'clusters'">
              <ReIcon name="OfficeBuilding" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">集群管理</span>
              <span class="dsm-tree-count">{{ clusters.length }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 拖拽调节左右宽度（Redis 同形态） -->
      <div class="dsm-split" :class="{ active: resizing }" title="拖拽调节宽度" @mousedown.prevent="startResize" />

      <div class="dsm-content">
        <!-- 卡片视觉（圆角/透明边框/双层投影）走 re-surface 统一底座 -->
        <div class="dsm-info-card re-surface">
          <div class="dsm-info-row"><span class="dsm-info-label">数据源</span><span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 8848}` : "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">命名空间</span><span class="dsm-info-value">{{ activeNsName }}</span></div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <div class="dsm-info-status">
              <ReTag :type="gap ? 'danger' : 'success'" >{{ gap ? "读取失败" : "正常" }}</ReTag>
              <span class="dsm-info-sub">服务版本 {{ nacosVersion || "未探测" }}</span>
            </div>
          </div>
        </div>

        <div v-if="activeView === 'configs'" class="dsm-section">
          <div class="dsm-section-title">
            配置列表
            <div class="dsm-section-actions">
              <ReInput v-model="searchKeyword" placeholder="按 Data ID 过滤" style="width: 200px" clearable />
            </div>
          </div>
          <ReTable
            v-model:page="configPage"
            v-model:page-size="configPageSize"
            :data="configs"
            :columns="configColumns"
            :loading="loading"
            :total="configTotal"
            :context-menu="configMenu"
            stripe
            border
            height="400px"
            @context-menu-select="onMenuSelect"
          >
            <template #col-actions="{ row }">
              <ReButton text @click="viewConfig(row as unknown as NacosConfig)">查看</ReButton>
              <ReButton text type="primary" @click="editConfig(row as unknown as NacosConfig)">编辑</ReButton>
              <ReButton text type="danger" @click="deleteConfig(row as unknown as NacosConfig)">删除</ReButton>
            </template>
          </ReTable>
        </div>

        <div v-if="activeView === 'services'" class="dsm-section">
          <div class="dsm-section-title">服务列表<span class="dsm-section-hint">点击服务名查看实例</span></div>
          <ReTable :data="services" :columns="serviceColumns" :loading="loading" :pagination="false" stripe border height="400px">
            <template #col-name="{ row }">
              <ReButton text type="primary" @click="openInstances(row as unknown as NacosService)">
                {{ (row as unknown as NacosService).name }}
              </ReButton>
            </template>
          </ReTable>
        </div>

        <div v-if="activeView === 'clusters'" class="dsm-section">
          <div class="dsm-section-title">集群节点</div>
          <ReTable :data="clusters" :columns="clusterColumns" :loading="loading" :pagination="false" stripe border height="400px">
            <template #col-role="{ row }">
              <ReTag :type="(row as unknown as NacosClusterNode).role === 'LEADER' ? 'warning' : 'info'" >
                {{ (row as unknown as NacosClusterNode).role || "—" }}
              </ReTag>
            </template>
            <template #col-status="{ row }">
              <ReTag :type="(row as unknown as NacosClusterNode).status === 'UP' ? 'success' : 'danger'" >
                {{ (row as unknown as NacosClusterNode).status || "—" }}
              </ReTag>
            </template>
            <template #col-leader="{ row }">
              <ReTag v-if="(row as unknown as any).leader" type="warning" ><ReIcon name="Star" size="11" /> Leader</ReTag>
              <span v-else>—</span>
            </template>
          </ReTable>
        </div>
      </div>
    </div>

    <ReDialog v-model="configVisible" :title="dialogTitle" width="700px">
      <div class="dsm-config-form">
        <div class="dsm-form-row">
          <div class="dsm-form-item"><label>Data ID</label><ReInput v-model="form.dataId" :disabled="dialogMode === 'view'" /></div>
          <div class="dsm-form-item"><label>Group</label><ReInput v-model="form.group" :disabled="dialogMode === 'view'" /></div>
        </div>
        <div class="dsm-form-item"><label>配置格式</label>
          <ReSelect v-model="form.format" style="width: 200px" :disabled="dialogMode === 'view'">
            <ReOption label="YAML" value="yaml" /><ReOption label="Properties" value="properties" /><ReOption label="JSON" value="json" /><ReOption label="XML" value="xml" />
          </ReSelect>
        </div>
        <div class="dsm-form-item"><label>配置内容</label>
          <textarea v-model="form.content" class="dsm-config-content" rows="12" :disabled="dialogMode === 'view'" :placeholder="contentHint"></textarea>
        </div>
        <div v-if="dialogMode !== 'view'" class="dsm-form-item">
          <label>Beta 发布目标 IP（留空为全量发布，多个用逗号分隔）</label>
          <ReInput v-model="form.betaIps" placeholder="例如 192.168.1.10,192.168.1.11" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="configVisible = false">关闭</ReButton>
        <ReButton v-if="dialogMode !== 'view'" type="primary" :loading="saving" @click="saveConfig">
          <template #icon><ReIcon name="Check" /></template>{{ dialogMode === "create" ? "创建并发布" : "保存并发布" }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- 命名空间新建/编辑弹窗 -->
    <ReDialog v-model="nsDialogVisible" :title="nsDialogMode === 'create' ? '新建命名空间' : '编辑命名空间'" width="520px">
      <div class="dsm-config-form">
        <div class="dsm-form-item">
          <label>命名空间 ID（新建可留空自动生成）</label>
          <ReInput v-model="nsForm.namespaceId" :disabled="nsDialogMode === 'edit'" placeholder="留空自动生成" />
        </div>
        <div class="dsm-form-item">
          <label>命名空间名称</label>
          <ReInput v-model="nsForm.namespaceName" placeholder="例如 生产环境" />
        </div>
        <div class="dsm-form-item">
          <label>描述</label>
          <textarea v-model="nsForm.namespaceDesc" class="dsm-config-content" rows="2" placeholder="可选" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="nsDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="nsSaving" @click="saveNamespace">
          <template #icon><ReIcon name="Check" /></template>保存
        </ReButton>
      </template>
    </ReDialog>

    <!-- 服务实例管理弹窗 -->
    <ReDialog v-model="instanceVisible" :title="`服务实例 - ${currentService?.name || ''}`" width="860px">
      <ReTable :data="instances" :columns="instanceColumns" :loading="instanceLoading" :pagination="false" stripe border >
        <template #col-healthy="{ row }">
          <ReTag :type="(row as unknown as NacosInstance).healthy ? 'success' : 'danger'" >
            {{ (row as unknown as NacosInstance).healthy ? "健康" : "不健康" }}
          </ReTag>
        </template>
        <template #col-enabled="{ row }">
          <ReTag :type="(row as unknown as NacosInstance).enabled ? 'success' : 'warning'" >
            {{ (row as unknown as NacosInstance).enabled ? "上线" : "下线" }}
          </ReTag>
        </template>
        <template #col-actions="{ row }">
          <ReButton text :type="(row as unknown as NacosInstance).enabled ? 'warning' : 'success'" @click="toggleInstance(row as unknown as NacosInstance)">
            {{ (row as unknown as NacosInstance).enabled ? "下线" : "上线" }}
          </ReButton>
          <ReButton text type="primary" @click="editWeight(row as unknown as NacosInstance)">改权重</ReButton>
          <ReButton text @click="viewMetadata(row as unknown as NacosInstance)">元数据</ReButton>
        </template>
      </ReTable>
    </ReDialog>
    <!-- 命名空间行右键菜单（第九批统一 zk 模板） -->
    <DsmContextMenu
      v-model:visible="nsMenu.visible"
      :x="nsMenu.x"
      :y="nsMenu.y"
      :items="nsMenuItems"
      @select="onNsMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Nacos 配置中心管理页
 *
 * <p>基于「数据源管理」登记的 nacos 数据源，通过后端 nacos 管理接口读取真实的命名空间、配置、
 * 服务与集群节点，配置的查看/新建/编辑/删除/克隆/导出走同一组接口；接口缺失或连接失败时只展示
 * 失败原因，不回落任何演示数据。</p>
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { View, Edit, CopyDocument, Download, Delete } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { ReOption } from "@repo/ui/re-kit";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import DsmContextMenu from "../../components/console/DsmContextMenu.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  deleteNacosConfig,
  fetchNacosClusterNodes,
  fetchNacosConfigDetail,
  fetchNacosConfigs,
  fetchNacosNamespaces,
  fetchNacosServices,
  saveNacosConfig,
  testNacosConnection,
  type NacosClusterNode,
  type NacosConfig,
  type NacosService,
} from "../../api/manageConsoles";
import {
  createNacosNamespace,
  deleteNacosNamespace,
  fetchNacosInstances,
  updateNacosInstance,
  updateNacosNamespace,
  type NacosInstance,
} from "../../api/zkNacosApi";

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 侧栏根节点名称：真实数据源名 */
const connectionName = computed(() => (source.value ? source.value.name : "Nacos 配置中心"));

const expandedNodes = ref(new Set(["root", "ns"]));
/** 选中的命名空间 ID（public 为默认命名空间） */
const activeNs = ref("public");
const activeView = ref<"configs" | "services" | "clusters">("configs");
const loading = ref(false);
/** 侧栏宽度持久化键（nacos 独立于 redis/etcd 等控制台） */
const LEFT_WIDTH_KEY = "nacos-side-width";
/** 侧栏宽度（拖拽调节，记录到 localStorage） */
const leftWidth = ref<number>(Math.min(560, Math.max(260, Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340)));
/** 是否正在拖拽（拖拽中禁用文本选择） */
const resizing = ref(false);

/**
 * 开始拖拽调节左侧宽度（Redis 同形态）。
 *
 * @param e 鼠标按下事件
 */
function startResize(e: MouseEvent): void {
  resizing.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  const onMove = (ev: MouseEvent): void => {
    leftWidth.value = Math.min(560, Math.max(260, startWidth + ev.clientX - startX));
  };
  const onUp = (): void => {
    resizing.value = false;
    localStorage.setItem(LEFT_WIDTH_KEY, String(leftWidth.value));
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}
const saving = ref(false);
const testing = ref(false);
/** 测试连接探测到的 Nacos 版本，未探测为空串 */
const nacosVersion = ref("");
const searchKeyword = ref("");

/** 命名空间行 */
interface NamespaceRow {
  id: string;
  name: string;
  configCount: number;
}

/** ReTable 列定义 */
type Column = { prop: string; label: string; width?: number | string; minWidth?: number; fixed?: boolean | "left" | "right"; slot?: string; formatter?: (row: any) => string };

const namespaces = ref<NamespaceRow[]>([]);
/** 侧栏搜索词：仅过滤命名空间树（配置列表另有 Data ID 过滤框，互不干扰） */
const sidebarKeyword = ref("");
const filteredNamespaces = computed(() => {
  const kw = sidebarKeyword.value.trim().toLowerCase();
  if (!kw) return namespaces.value;
  return namespaces.value.filter(
    ns => String(ns.name || "").toLowerCase().includes(kw) || String(ns.id || "").toLowerCase().includes(kw),
  );
});
const configs = ref<NacosConfig[]>([]);
const services = ref<NacosService[]>([]);
const clusters = ref<NacosClusterNode[]>([]);

const configTotal = ref(0);
const configPage = ref(1);
const configPageSize = ref(10);

const configColumns: Column[] = [
  { prop: "dataId", label: "Data ID", minWidth: 200 },
  { prop: "group", label: "Group", width: 140 },
  { prop: "format", label: "格式", width: 100 },
  { prop: "updatedAt", label: "更新时间", width: 180 },
  { prop: "actions", label: "操作", width: 180, fixed: "right" as const, slot: "actions" },
];
const serviceColumns: Column[] = [
  { prop: "name", label: "服务名", minWidth: 180, slot: "name" },
  { prop: "clusterCount", label: "集群数", width: 100 },
  { prop: "healthyInstanceCount", label: "健康实例", width: 110 },
  { prop: "unhealthyInstanceCount", label: "不健康实例", width: 120 },
  { prop: "triggerFlag", label: "健康检查", width: 110 },
];
const clusterColumns: Column[] = [
  { prop: "ip", label: "节点地址", minWidth: 170 },
  { prop: "port", label: "端口", width: 90 },
  { prop: "status", label: "状态", width: 100, slot: "status" },
  { prop: "role", label: "角色", width: 110, slot: "role" },
  { prop: "leader", label: "Leader", width: 100, slot: "leader" },
  { prop: "weight", label: "权重", width: 90 },
];

const activeNsName = computed(
  () => namespaces.value.find(n => n.id === activeNs.value)?.name || activeNs.value || "public"
);

/** 配置行右键菜单，由 ReTable 内置菜单渲染（第九批统一 zk 样式 + 逐项图标） */
const configMenu = [
  { key: "view", label: "查看配置", icon: View },
  { key: "edit", label: "编辑配置", icon: Edit },
  { key: "clone", label: "克隆配置", icon: CopyDocument },
  { key: "export", label: "导出配置", icon: Download },
  { key: "delete", label: "删除配置", icon: Delete, divided: true },
];

const configVisible = ref(false);
const dialogMode = ref<"view" | "edit" | "create">("view");
const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "新建配置" : dialogMode.value === "edit" ? "编辑配置" : "查看配置"
);
const contentHint = ref("");
const form = reactive({ dataId: "", group: "DEFAULT_GROUP", format: "yaml", content: "", betaIps: "" });

/** 命名空间新建/编辑弹窗状态 */
const nsDialogVisible = ref(false);
const nsDialogMode = ref<"create" | "edit">("create");
const nsSaving = ref(false);
const nsForm = reactive({ namespaceId: "", namespaceName: "", namespaceDesc: "" });

/** 命名空间行右键菜单（第九批统一 zk 模板） */
const nsMenu = reactive({ visible: false, x: 0, y: 0, key: "" });
const nsMenuItems = [
  { key: "copy", label: "复制命名空间 ID", icon: "Document" },
  { key: "edit", label: "编辑命名空间", icon: "Edit" },
  { key: "delete", label: "删除命名空间", icon: "Delete", danger: true, divided: true },
];
/** 打开命名空间行右键菜单 */
function onNsContextMenu(e: MouseEvent, id: string) {
  Object.assign(nsMenu, { visible: true, x: e.clientX, y: e.clientY, key: id });
}
/** 菜单动作分发 */
async function onNsMenuSelect(key: string) {
  const id = nsMenu.key;
  if (!id) return;
  if (key === "copy") {
    try {
      await navigator.clipboard.writeText(id);
      ElMessage.success("已复制命名空间 ID");
    } catch {
      ElMessage.error("复制失败");
    }
    return;
  }
  // 编辑/删除依赖 activeNs 指向该命名空间（右键不等同于选中）
  activeNs.value = id;
  if (key === "edit") openNamespaceDialog("edit");
  if (key === "delete") removeNamespace();
}

/** 公有命名空间不可编辑/删除 */
const canEditNamespace = computed(() => {
  const id = activeNs.value;
  return !!id && id !== "public" && id !== "";
});

/** 实例管理弹窗状态 */
const instanceVisible = ref(false);
const instanceLoading = ref(false);
const instances = ref<NacosInstance[]>([]);
const currentService = ref<NacosService | null>(null);
const instanceColumns: Column[] = [
  { prop: "ip", label: "IP", minWidth: 130 },
  { prop: "port", label: "端口", width: 80 },
  { prop: "weight", label: "权重", width: 80 },
  { prop: "healthy", label: "健康", width: 90, slot: "healthy" },
  { prop: "enabled", label: "状态", width: 90, slot: "enabled" },
  { prop: "ephemeral", label: "临时", width: 80 },
  { prop: "clusterName", label: "集群", width: 110 },
  { prop: "actions", label: "操作", width: 220, fixed: "right", slot: "actions" },
];

/**
 * 加载命名空间列表
 */
async function loadNamespaces() {
  try {
    const data = await fetchNacosNamespaces(datasourceId.value);
    namespaces.value = (data || []).map(n => ({
      id: n.id || n.namespace || "public",
      name: n.name || n.namespace || "public",
      configCount: n.configCount ?? 0,
    }));
    if (namespaces.value.length > 0 && !namespaces.value.some(n => n.id === activeNs.value)) {
      activeNs.value = namespaces.value[0].id;
    }
    ready();
  } catch (e) {
    namespaces.value = [];
    fail(e, "/ms/monitor/nacos/namespaces");
  }
}

/**
 * 分页加载当前命名空间下的配置列表
 */
async function loadConfigs() {
  loading.value = true;
  try {
    const data = await fetchNacosConfigs({
      datasourceId: datasourceId.value,
      namespace: activeNs.value,
      dataId: searchKeyword.value || undefined,
      page: configPage.value,
      pageSize: configPageSize.value,
    });
    configs.value = data?.list || [];
    configTotal.value = data?.total ?? configs.value.length;
    ready();
  } catch (e) {
    configs.value = [];
    configTotal.value = 0;
    fail(e, "/ms/monitor/nacos/configs");
  } finally {
    loading.value = false;
  }
}

/**
 * 加载当前命名空间下的服务列表
 */
async function loadServices() {
  if (!datasourceId.value) return;
  try {
    services.value = (await fetchNacosServices(datasourceId.value, activeNs.value)) || [];
    ready();
  } catch (e) {
    services.value = [];
    fail(e, "/ms/monitor/nacos/services");
  }
}

/**
 * 加载集群节点列表
 */
async function loadClusters() {
  if (!datasourceId.value) return;
  try {
    clusters.value = (await fetchNacosClusterNodes(datasourceId.value)) || [];
    ready();
  } catch (e) {
    clusters.value = [];
    fail(e, "/ms/monitor/nacos/cluster/nodes");
  }
}

/**
 * 重新加载本页全部数据
 */
async function reloadAll() {
  if (!source.value) {
    await bind("nacos");
    if (!source.value) return;
  }
  await Promise.all([loadNamespaces(), loadConfigs(), loadServices(), loadClusters()]);
}

/**
 * 探测当前数据源的 Nacos 连通性并显示版本
 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testNacosConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      nacosVersion.value = result.version || "";
      ready();
      ElMessage.success(result.version ? `连接成功 · Nacos ${result.version}` : "连接成功");
    } else {
      ElMessage.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/nacos/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) expandedNodes.value.delete(key);
  else expandedNodes.value.add(key);
}

/**
 * 切换命名空间
 * @param id 命名空间 ID
 */
function selectNs(id: string) {
  activeNs.value = id;
  configPage.value = 1;
  loadConfigs();
  loadServices();
}

/**
 * 读取配置详情并打开弹窗
 * @param row 配置行
 * @param mode 弹窗模式
 */
async function openConfigDialog(row: NacosConfig, mode: "view" | "edit") {
  dialogMode.value = mode;
  Object.assign(form, { dataId: row.dataId, group: row.group, format: row.format || "yaml", content: "", betaIps: "" });
  contentHint.value = "正在读取配置内容…";
  configVisible.value = true;
  try {
    const detail = await fetchNacosConfigDetail(row.dataId, { datasourceId: datasourceId.value, namespace: activeNs.value, group: row.group });
    form.content = detail?.content ?? "";
    form.format = detail?.format || form.format;
    contentHint.value = "";
    ready();
  } catch (e) {
    contentHint.value = `配置内容读取失败：${String((e as Error)?.message ?? e)}`;
    fail(e, `/ms/monitor/nacos/config?dataId=${row.dataId}`);
  }
}

/**
 * 查看配置
 * @param row 配置行
 */
function viewConfig(row: NacosConfig) {
  void openConfigDialog(row, "view");
}

/**
 * 编辑配置
 * @param row 配置行
 */
function editConfig(row: NacosConfig) {
  void openConfigDialog(row, "edit");
}

/**
 * 打开新建配置弹窗
 */
function openCreate() {
  dialogMode.value = "create";
  Object.assign(form, { dataId: "", group: "DEFAULT_GROUP", format: "yaml", content: "", betaIps: "" });
  contentHint.value = "";
  configVisible.value = true;
}

/**
 * 发布配置（新建或更新）
 */
async function saveConfig() {
  if (!form.dataId.trim()) {
    ElMessage.warning("Data ID 不能为空");
    return;
  }
  if (!form.content.trim()) {
    ElMessage.warning("配置内容不能为空");
    return;
  }
  saving.value = true;
  try {
    await saveNacosConfig({
      datasourceId: datasourceId.value,
      dataId: form.dataId.trim(),
      group: form.group,
      format: form.format,
      namespace: activeNs.value,
      content: form.content,
      betaIps: form.betaIps.trim() || undefined,
    } as any);
    ElMessage.success(form.betaIps.trim() ? "Beta 发布完成" : dialogMode.value === "create" ? "配置已创建" : "配置已发布");
    configVisible.value = false;
    ready();
    await Promise.all([loadConfigs(), loadNamespaces()]);
  } catch (e) {
    fail(e, "/ms/monitor/nacos/config");
  } finally {
    saving.value = false;
  }
}

/**
 * 删除配置
 * @param row 配置行
 */
async function deleteConfig(row: NacosConfig) {
  try {
    await ElMessageBox.confirm(`确定删除配置 ${row.dataId}（${row.group}）吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteNacosConfig(row.dataId, { datasourceId: datasourceId.value, namespace: activeNs.value, group: row.group });
    ElMessage.success("配置已删除");
    ready();
    await Promise.all([loadConfigs(), loadNamespaces()]);
  } catch (e) {
    fail(e, `/ms/monitor/nacos/config?dataId=${row.dataId}`);
  }
}

/**
 * 打开新建/编辑命名空间弹窗
 * @param mode 弹窗模式
 */
function openNamespaceDialog(mode: "create" | "edit") {
  nsDialogMode.value = mode;
  if (mode === "create") {
    Object.assign(nsForm, { namespaceId: "", namespaceName: "", namespaceDesc: "" });
  } else {
    const ns = namespaces.value.find(n => n.id === activeNs.value);
    Object.assign(nsForm, {
      namespaceId: activeNs.value,
      namespaceName: ns?.name || "",
      namespaceDesc: "",
    });
  }
  nsDialogVisible.value = true;
}

/**
 * 保存命名空间（新建或编辑）
 */
async function saveNamespace() {
  if (!nsForm.namespaceName.trim()) {
    ElMessage.warning("命名空间名称不能为空");
    return;
  }
  nsSaving.value = true;
  try {
    const payload = {
      datasourceId: datasourceId.value,
      namespaceId: nsForm.namespaceId.trim() || undefined,
      namespaceName: nsForm.namespaceName.trim(),
      namespaceDesc: nsForm.namespaceDesc.trim(),
    };
    if (nsDialogMode.value === "create") {
      await createNacosNamespace(payload);
      ElMessage.success("命名空间已创建");
    } else {
      await updateNacosNamespace(payload);
      ElMessage.success("命名空间已更新");
    }
    nsDialogVisible.value = false;
    ready();
    await loadNamespaces();
  } catch (e) {
    fail(e, "/ms/monitor/nacos/namespace");
  } finally {
    nsSaving.value = false;
  }
}

/**
 * 删除当前命名空间（二次确认）
 */
async function removeNamespace() {
  const id = activeNs.value;
  if (!id || id === "public") return;
  try {
    await ElMessageBox.confirm(`确定删除命名空间 ${id} 吗？其下配置将一并删除，不可恢复！`, "删除命名空间", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteNacosNamespace(id, datasourceId.value);
    ElMessage.success("命名空间已删除");
    ready();
    activeNs.value = "public";
    await loadNamespaces();
    await Promise.all([loadConfigs(), loadServices()]);
  } catch (e) {
    fail(e, "/ms/monitor/nacos/namespace");
  }
}

/**
 * 打开服务实例弹窗并加载实例列表
 * @param service 服务行
 */
async function openInstances(service: NacosService) {
  currentService.value = service;
  instanceVisible.value = true;
  instances.value = [];
  instanceLoading.value = true;
  try {
    instances.value = (await fetchNacosInstances({
      datasourceId: datasourceId.value,
      namespace: activeNs.value,
      serviceName: service.name,
    })) || [];
    ready();
  } catch (e) {
    instances.value = [];
    fail(e, "/ms/monitor/nacos/service/instances");
  } finally {
    instanceLoading.value = false;
  }
}

/**
 * 上下线实例
 * @param inst 实例行
 */
async function toggleInstance(inst: NacosInstance) {
  try {
    await updateNacosInstance({
      datasourceId: datasourceId.value,
      namespace: activeNs.value,
      serviceName: currentService.value?.name || "",
      ip: inst.ip,
      port: inst.port,
      enabled: !inst.enabled,
    });
    ElMessage.success(inst.enabled ? "实例已下线" : "实例已上线");
    ready();
    await openInstances(currentService.value!);
    await loadServices();
  } catch (e) {
    fail(e, "/ms/monitor/nacos/service/instance");
  }
}

/**
 * 弹窗修改实例权重
 * @param inst 实例行
 */
async function editWeight(inst: NacosInstance) {
  let weight = String(inst.weight ?? 1);
  try {
    const input = await ElMessageBox.prompt(`修改 ${inst.ip}:${inst.port} 的权重（0-10000）`, "修改权重", {
      inputValue: weight,
      inputValidator: (v: string) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 0 && n <= 10000 ? true : "权重需为 0-10000 的数字";
      },
    });
    weight = String(input.value || "");
  } catch {
    return;
  }
  try {
    await updateNacosInstance({
      datasourceId: datasourceId.value,
      namespace: activeNs.value,
      serviceName: currentService.value?.name || "",
      ip: inst.ip,
      port: inst.port,
      weight: Number(weight),
    });
    ElMessage.success("权重已更新");
    ready();
    await openInstances(currentService.value!);
  } catch (e) {
    fail(e, "/ms/monitor/nacos/service/instance");
  }
}

/**
 * 查看实例元数据
 * @param inst 实例行
 */
function viewMetadata(inst: NacosInstance) {
  const meta = inst.metadata || {};
  const text = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "(无元数据)";
  ElMessageBox.alert(`<pre style="max-height:300px;overflow:auto">${text}</pre>`, `元数据 - ${inst.ip}:${inst.port}`, {
    dangerouslyUseHTMLString: true,
    confirmButtonText: "关闭",
  });
}

/**
 * 克隆配置：读取源内容后以新的 Data ID 发布
 * @param row 源配置行
 */
async function cloneConfig(row: NacosConfig) {
  let newDataId = "";
  try {
    const input = await ElMessageBox.prompt("请输入克隆后的 Data ID", "克隆配置", {
      inputValue: `${row.dataId}_copy`,
      inputValidator: (v: string) => (v && v.trim() ? true : "Data ID 不能为空"),
    });
    newDataId = String(input.value || "").trim();
  } catch {
    return;
  }
  if (!newDataId || newDataId === row.dataId) return;
  try {
    const detail = await fetchNacosConfigDetail(row.dataId, { datasourceId: datasourceId.value, namespace: activeNs.value, group: row.group });
    await saveNacosConfig({
      datasourceId: datasourceId.value,
      dataId: newDataId,
      group: detail?.group || row.group,
      format: detail?.format || row.format,
      namespace: activeNs.value,
      content: detail?.content ?? "",
    });
    ElMessage.success(`已克隆为 ${newDataId}`);
    ready();
    await loadConfigs();
  } catch (e) {
    fail(e, "/ms/monitor/nacos/config");
  }
}

/**
 * 导出配置内容到本地文件
 * @param row 配置行
 */
async function exportConfig(row: NacosConfig) {
  let content = "";
  try {
    const detail = await fetchNacosConfigDetail(row.dataId, { datasourceId: datasourceId.value, namespace: activeNs.value, group: row.group });
    content = detail?.content ?? "";
    ready();
  } catch (e) {
    fail(e, `/ms/monitor/nacos/config?dataId=${row.dataId}`);
    return;
  }
  const extMap: Record<string, string> = { yaml: "yml", properties: "properties", json: "json", xml: "xml" };
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nacos-${row.group}-${row.dataId}.${extMap[row.format || ""] || "txt"}`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success("导出成功");
}

/**
 * 右键菜单动作分发
 * @param item 菜单项
 * @param ctx 菜单上下文
 */
function onMenuSelect(item: { key: string }, ctx: { row: Record<string, unknown> }) {
  const row = ctx.row as unknown as NacosConfig;
  if (item.key === "view") viewConfig(row);
  else if (item.key === "edit") editConfig(row);
  else if (item.key === "clone") void cloneConfig(row);
  else if (item.key === "export") void exportConfig(row);
  else if (item.key === "delete") void deleteConfig(row);
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchKeyword, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    configPage.value = 1;
    void loadConfigs();
  }, 300);
});

watch([configPage, configPageSize], () => {
  void loadConfigs();
});

onMounted(async () => {
  await bind("nacos");
  if (source.value) {
    await reloadAll();
  }
});
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; }
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-nacos-icon { color: #fbbf24; }
.dsm-toolbar-right { display: flex; gap: 8px; }
.dsm-body { display: flex; flex: 1; gap: 0; overflow: hidden; }
.dsm.resizing { user-select: none; }
.dsm-split { position: relative; width: 16px; flex-shrink: 0; cursor: col-resize; }
.dsm-split::after { content: ""; position: absolute; top: 0; bottom: 0; left: 6px; width: 4px; border-radius: 2px; background: transparent; transition: background 0.15s; }
.dsm-split:hover::after, .dsm-split.active::after { background: var(--brand-400); }
.dsm-sidebar {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.dsm-search-section { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-search-section > *:first-child { flex: 1; }
.dsm-view-bar { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-view-count { font-size: 12px; color: var(--text-tertiary); }
.dsm-view-spacer { flex: 1; }
.dsm-key-list { flex: 1; padding: 6px 0; min-height: 80px; overflow-y: auto; }
.dsm-scan-bar { position: sticky; top: 0; z-index: 2; height: 2px; overflow: hidden; background: transparent; opacity: 0; transition: opacity 0.15s; }
.dsm-scan-bar.is-active { opacity: 1; }
.dsm-scan-bar span { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brand-500, #409eff), transparent); transform: translateX(-100%); }
.dsm-scan-bar.is-active span { animation: dsm-scan-slide 1s linear infinite; }
@keyframes dsm-scan-slide { to { transform: translateX(350%); } }
.dsm-tree { padding: 8px 0; }
.dsm-tree-node { position: relative; display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-root { font-weight: 600; }
.dsm-tree-children { padding-left: 16px; }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsm-tree-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-fill); padding: 1px 6px; border-radius: 10px; }
/* 行操作：悬停出现的方形图标条（与 Redis .dsm-row-actions 同形态） */
.dsm-tree-actions {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  align-items: center;
  gap: 2px;
  padding-left: 18px;
  background: inherit;
}
.dsm-tree-node:hover .dsm-tree-actions { display: inline-flex; }
.dsm-tree-actions :deep(.rs-btn) { margin: 0; }
.dsm-section-hint { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
/* 顶部信息带：视觉（圆角/边框/投影/底色）由模板上的 re-surface 类统一提供（16px 圆角、
   透明边框 + 双层柔光投影），这里只留网格布局——不再自写一套卡片壳防漂移（surface:check） */
.dsm-info-card { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.dsm-info-status { display: flex; align-items: center; gap: 8px; }
.dsm-info-sub { font-size: 12px; color: var(--text-tertiary); }
.dsm-section { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }
.dsm-section-actions { display: flex; gap: 8px; }
.dsm-config-form { display: flex; flex-direction: column; gap: 14px; }
.dsm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dsm-form-item { display: flex; flex-direction: column; gap: 6px; }
.dsm-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.dsm-config-content { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-config-content:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
</style>