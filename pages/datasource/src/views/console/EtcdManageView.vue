<template>
  <div class="dsm tel-page" :class="{ resizing }">
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Coin" :size="18" class="dsm-title-icon dsm-etcd-icon" />
        <span class="dsm-title">etcd 配置中心管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton layout="square" tip="测试连接" icon="Connection" data-testid="dsm-btn-test" :disabled="!source" :loading="testing" @click="testConnection" />
        <ReButton layout="square" tip="刷新" icon="Refresh" data-testid="dsm-btn-refresh" :loading="loading" @click="refresh" />
        <ReButton layout="square" tip="新建租约" icon="Timer" data-testid="dsm-btn-lease" :disabled="!source" @click="openLeaseDialog" />
        <ReButton layout="square" type="primary" tip="新建键" icon="Plus" data-testid="dsm-btn-create" :disabled="!source" @click="openCreate" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div class="dsm-body">
      <div class="dsm-sidebar" :style="{ width: leftWidth + 'px' }">
        <!-- 侧栏搜索（Redis 模板）：按目录/键名过滤当前前缀下的条目 -->
        <div class="dsm-search-section">
          <ReInput v-model="prefixFilter" placeholder="过滤目录/键名" clearable @keyup.enter="loadKeys" />
          <ReButton type="primary" :loading="loading" @click="loadKeys"><template #icon><ReIcon name="Search" size="12" /></template>查询</ReButton>
        </div>
        <!-- 计数条 + 快捷刷新（Redis dsm-view-bar） -->
        <div class="dsm-view-bar">
          <span class="dsm-view-count">{{ filteredFolders.length }} 目录 · {{ filteredLeaves.length }} 键</span>
          <span class="dsm-view-spacer" />
          <ReButton layout="square" icon="Refresh" tip="刷新" data-testid="dsm-view-refresh" :loading="loading" @click="loadKeys" />
        </div>
        <div class="dsm-key-list">
          <!-- 顶部细扫描条 = 刷新中（Redis 同形态） -->
          <div class="dsm-scan-bar" :class="{ 'is-active': loading }" data-testid="dsm-scan-bar"><span /></div>
          <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" :class="{ active: activePrefix === '' }" @click="enterPrefix('')">
            <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
            <span class="dsm-tree-label">/ (根)</span>
          </div>
          <div class="dsm-tree-branch">{{ activePrefix || "/" }}</div>
          <div
            v-for="folder in filteredFolders"
            :key="'d:' + folder.path"
            class="dsm-tree-node"
            :class="{ active: activePrefix === folder.path }"
            @click="enterPrefix(folder.path)"
          >
            <ReIcon name="Folder" size="14" class="dsm-tree-icon dsm-tree-folder" />
            <span class="dsm-tree-label">{{ folder.name }}</span>
            <span class="dsm-tree-count">{{ folder.count }}</span>
            <!-- 悬停行操作（Redis 同形态）：复制前缀 / 删除目录下全部键（DeleteRange） -->
            <div class="dsm-row-actions" data-testid="dsm-row-actions" @click.stop>
              <ReButton layout="square" size="small" icon="CopyDocument" tip="复制前缀" data-testid="dsm-row-copy" @click="copyKeyText(folder.path)" />
              <ReButton layout="square" size="small" type="danger" icon="Delete" tip="删除目录下全部键" data-testid="dsm-row-delete-dir" @click="confirmDeletePrefix(folder.path, folder.count)" />
            </div>
          </div>
          <div
            v-for="row in filteredLeaves"
            :key="'k:' + row.key"
            class="dsm-tree-node"
            :class="{ active: activeKey === row.key }"
            @click="selectKey(row.key)"
            @contextmenu.prevent="onKeyContextMenu($event, row.key)"
          >
            <ReIcon name="Document" size="13" class="dsm-tree-icon" />
            <span class="dsm-tree-label">{{ row.name }}</span>
            <span v-if="row.lease" class="dsm-lease-tag" :title="`绑定租约 ${row.lease}`">TTL</span>
            <div class="dsm-row-actions" data-testid="dsm-row-actions" @click.stop>
              <ReButton layout="square" size="small" icon="CopyDocument" tip="复制键名" data-testid="dsm-row-copy" @click="copyKeyText(row.key)" />
              <ReButton layout="square" size="small" icon="Delete" tip="删除键" data-testid="dsm-row-delete" @click="confirmDelete(row.key)" />
            </div>
          </div>
          <div v-if="filteredFolders.length === 0 && filteredLeaves.length === 0" class="dsm-tree-node">
            <span class="dsm-tree-label">{{ gap ? "未读取到键" : (prefixFilter ? "无匹配目录/键" : "该前缀下暂无键") }}</span>
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
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 2379}` : "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">当前前缀</span><span class="dsm-info-value mono">{{ activePrefix || "/" }}</span></div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <ReTag :type="gap ? 'danger' : 'success'">{{ gap ? "读取失败" : "正常" }}</ReTag>
          </div>
          <div class="dsm-info-row"><span class="dsm-info-label">服务端版本</span><span class="dsm-info-value mono">{{ status.version || "未探测" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">当前 revision</span><span class="dsm-info-value mono">{{ status.revision ?? "—" }}</span></div>
        </div>

        <div class="dsm-tabs">
          <div class="dsm-tab" :class="{ active: activeTab === 'keys' }" @click="activeTab = 'keys'">键</div>
          <div class="dsm-tab" :class="{ active: activeTab === 'leases' }" @click="switchTab('leases')">租约</div>
          <div class="dsm-tab" :class="{ active: activeTab === 'cluster' }" @click="switchTab('cluster')">集群</div>
        </div>

        <div v-if="activeTab === 'keys'" class="dsm-section">
          <div class="dsm-section-title">
            键列表 - {{ activePrefix || "/" }}（{{ keys.length }}）
            <div class="dsm-section-actions">
              <ReButton v-if="activePrefix" text @click="enterPrefix(parentOf(activePrefix))"><template #icon><ReIcon name="ArrowUp" size="12" /></template>上一层</ReButton>
              <ReButton text @click="loadKeys"><template #icon><ReIcon name="Refresh" size="12" /></template>刷新</ReButton>
            </div>
          </div>
          <ReTable
            :data="keyRows"
            :columns="keyColumns"
            :loading="loading"
            :pagination="false"
            stripe
            border
            height="360px"
            :context-menu="keyTableMenu"
            @context-menu-select="onKeyTableMenuSelect"
          >
            <template #col-key="{ row }">
              <ReButton text type="primary" @click="selectKey((row as EtcdKeyRow).key)">{{ (row as EtcdKeyRow).key }}</ReButton>
            </template>
            <template #col-lease="{ row }">
              <ReTag v-if="(row as EtcdKeyRow).lease" type="warning">TTL {{ (row as EtcdKeyRow).lease }}</ReTag>
              <span v-else>—</span>
            </template>
            <template #col-actions="{ row }">
              <ReButton text @click="openDetail((row as EtcdKeyRow).key)">查看</ReButton>
              <ReButton text type="primary" @click="openEdit((row as EtcdKeyRow).key)">编辑</ReButton>
              <ReButton text type="danger" @click="confirmDelete((row as EtcdKeyRow).key)">删除</ReButton>
            </template>
          </ReTable>
        </div>

        <div v-if="activeTab === 'keys' && activeKey" class="dsm-section">
          <div class="dsm-section-title">
            键详情 - {{ activeKey }}
            <div class="dsm-section-actions">
              <ReButton text type="primary" :disabled="!detail" @click="openEdit(activeKey)"><template #icon><ReIcon name="Edit" size="12" /></template>编辑</ReButton>
              <ReButton text type="danger" :disabled="!detail" @click="confirmDelete(activeKey)"><template #icon><ReIcon name="Delete" size="12" /></template>删除</ReButton>
            </div>
          </div>
          <template v-if="detail">
            <div class="dsm-node-detail">
              <div class="dsm-detail-row"><span class="dsm-detail-label">创建 revision</span><span class="dsm-detail-value mono">{{ detail.createRevision ?? "—" }}</span></div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">修改 revision</span><span class="dsm-detail-value mono">{{ detail.modRevision ?? "—" }}</span></div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">键版本 (version)</span><span class="dsm-detail-value mono">{{ detail.version ?? "—" }}</span></div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">绑定租约</span><span class="dsm-detail-value mono">{{ detail.lease || "未绑定" }}</span></div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">剩余 TTL</span><span class="dsm-detail-value mono">{{ detail.ttlSeconds == null ? "—" : detail.ttlSeconds + " 秒" }}</span></div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">值长度</span><span class="dsm-detail-value mono">{{ detail.valueLength }} 字节</span></div>
            </div>
            <div class="dsm-data-section">
              <div class="dsm-data-title">值{{ detail.binary ? "（二进制）" : "" }}</div>
              <pre class="dsm-data-content">{{ detail.value }}</pre>
            </div>
          </template>
          <div v-else class="dsm-empty-inline">正在读取…</div>
        </div>

        <div v-if="activeTab === 'leases'" class="dsm-section">
          <div class="dsm-section-title">
            租约（{{ leases.length }}）
            <div class="dsm-section-actions">
              <ReButton text @click="loadLeases"><template #icon><ReIcon name="Refresh" size="12" /></template>刷新</ReButton>
            </div>
          </div>
          <ReTable :data="leases" :columns="leaseColumns" :loading="loading" :pagination="false" stripe border height="360px">
            <template #col-leaseId="{ row }"><span class="mono">{{ (row as EtcdLease).id }}</span></template>
            <template #col-ttl="{ row }">
              <ReTag type="warning">{{ (row as EtcdLease).ttl ?? "—" }} / {{ (row as EtcdLease).grantedTtl ?? "—" }} 秒</ReTag>
            </template>
            <template #col-actions="{ row }">
              <ReButton text @click="showLeaseKeys(row as EtcdLease)">查看键</ReButton>
              <ReButton text type="danger" @click="confirmRevoke(row as EtcdLease)">撤销</ReButton>
            </template>
          </ReTable>
        </div>

        <div v-if="activeTab === 'cluster'" class="dsm-section">
          <div class="dsm-section-title">
            集群成员（{{ members.length }}）
            <div class="dsm-section-actions">
              <ReButton text @click="loadMembers"><template #icon><ReIcon name="Refresh" size="12" /></template>刷新</ReButton>
            </div>
          </div>
          <ReTable :data="members" :columns="memberColumns" :loading="loading" :pagination="false" stripe border height="260px">
            <template #col-memberId="{ row }"><span class="mono">{{ shortId((row as EtcdMember).id) }}</span></template>
            <template #col-role="{ row }">
              <ReTag v-if="(row as EtcdMember).leader" type="warning">Leader</ReTag>
              <span v-else>Follower</span>
            </template>
            <template #col-healthy="{ row }">
              <ReTag :type="(row as EtcdMember).healthy ? 'success' : 'danger'">{{ (row as EtcdMember).healthy ? "健康" : "不可达" }}</ReTag>
            </template>
          </ReTable>
          <div class="dsm-member-detail">
            <div class="dsm-detail-row"><span class="dsm-detail-label">etcd 版本</span><span class="dsm-detail-value mono">{{ status.version || "—" }}</span></div>
            <div class="dsm-detail-row"><span class="dsm-detail-label">leader</span><span class="dsm-detail-value mono">{{ shortId(status.leader) || "—" }}</span></div>
            <div class="dsm-detail-row"><span class="dsm-detail-label">数据文件大小</span><span class="dsm-detail-value mono">{{ formatBytes(status.dbSize) }}</span></div>
            <div class="dsm-detail-row"><span class="dsm-detail-label">实际使用</span><span class="dsm-detail-value mono">{{ formatBytes(status.dbSizeInUse) }}</span></div>
            <div class="dsm-detail-row"><span class="dsm-detail-label">raft index / term</span><span class="dsm-detail-value mono">{{ status.raftIndex ?? "—" }} / {{ status.raftTerm ?? "—" }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 键编辑弹窗 -->
    <ReDialog v-model="keyVisible" :title="keyDialogMode === 'create' ? '新建键' : keyDialogMode === 'edit' ? '编辑键' : '键详情'" width="680px">
      <div class="dsm-node-form">
        <div class="dsm-form-item">
          <label>键名</label>
          <ReInput v-model="form.key" :disabled="keyDialogMode !== 'create'" placeholder="如 /config/app/name" />
          <span class="dsm-form-hint">etcd 的键用 / 分层，请填完整键名（不是前缀）</span>
        </div>
        <div class="dsm-form-item">
          <label>值</label>
          <textarea v-model="form.value" class="dsm-node-data" rows="10" :disabled="keyDialogMode === 'view'" placeholder="UTF-8 文本"></textarea>
        </div>
        <div class="dsm-form-item">
          <label>绑定租约（可选）</label>
          <ReInput v-model="form.lease" :disabled="keyDialogMode === 'view'" placeholder="租约 ID；留空表示不绑定" />
          <span class="dsm-form-hint">绑定租约的键会在租约到期时被自动删除（相当于 ZooKeeper 的临时节点）</span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="keyVisible = false">{{ keyDialogMode === "view" ? "关闭" : "取消" }}</ReButton>
        <ReButton v-if="keyDialogMode !== 'view'" type="primary" :loading="saving" @click="submitKey">
          <template #icon><ReIcon name="Check" /></template>{{ keyDialogMode === "create" ? "创建" : "保存" }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- 授予租约弹窗 -->
    <ReDialog v-model="leaseVisible" title="新建租约" width="440px">
      <div class="dsm-node-form">
        <div class="dsm-form-item">
          <label>TTL（秒）</label>
          <ReInput v-model="leaseTtl" placeholder="如 300" />
          <span class="dsm-form-hint">授予后可用租约 ID 绑定键；到期键自动删除</span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="leaseVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submitLease"><template #icon><ReIcon name="Check" /></template>授予</ReButton>
      </template>
    </ReDialog>
    <!-- 键行右键菜单（第九批统一 zk 模板） -->
    <DsmContextMenu
      v-model:visible="keyMenu.visible"
      :x="keyMenu.x"
      :y="keyMenu.y"
      :items="keyMenuItems"
      @select="onKeyMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * etcd 配置中心管理页
 *
 * <p>基于「数据源管理」登记的 etcd 数据源，读取真实键/租约/集群成员，
 * 走 /ms/monitor/etcd/** 一组接口；接口缺失或连接失败时只展示失败原因，不回落演示数据。</p>
 *
 * <p>键按**前缀**分层浏览：etcd 没有目录概念，这里的"文件夹"是从键名里推导出来的下一级片段，
 * 只为浏览方便，不改变任何键。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { View, EditPen, CopyDocument, Delete } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { copyToClipboard } from "../../utils/clipboard";
import DsmContextMenu from "../../components/console/DsmContextMenu.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  deleteEtcdKey,
  fetchEtcdKey,
  fetchEtcdKeys,
  fetchEtcdLeases,
  fetchEtcdMembers,
  fetchEtcdStatus,
  grantEtcdLease,
  revokeEtcdLease,
  saveEtcdKey,
  testEtcdConnection,
  type EtcdKey,
  type EtcdKeyDetail,
  type EtcdLease,
  type EtcdMember,
  type EtcdStatus,
} from "../../api/etcdManageApi";

defineOptions({ name: "EtcdManageView" });

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 键列表行（附推导出的显示名） */
interface EtcdKeyRow extends EtcdKey {
  [key: string]: unknown;
  name: string;
}

const loading = ref(false);
const testing = ref(false);
const saving = ref(false);
const activeTab = ref<"keys" | "leases" | "cluster">("keys");
/** 当前浏览前缀，空串表示根 */
const activePrefix = ref("");
/** 侧栏目录/键名本地过滤（etcd 按前缀读取，过滤不改变后端查询范围） */
const prefixFilter = ref("");
/** 左侧栏宽度持久化键，避免与 Redis 等控制台冲突 */
const LEFT_WIDTH_KEY = "etcd-side-width";
const leftWidth = ref<number>(Math.min(560, Math.max(260, Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340)));
/** 是否正在拖拽侧栏分隔条 */
const resizing = ref(false);
const activeKey = ref("");
const keys = ref<EtcdKey[]>([]);
const detail = ref<EtcdKeyDetail | null>(null);
const leases = ref<EtcdLease[]>([]);
const members = ref<EtcdMember[]>([]);
const status = ref<EtcdStatus>({});

const keyVisible = ref(false);
const keyDialogMode = ref<"create" | "edit" | "view">("create");
const leaseVisible = ref(false);
const leaseTtl = ref("300");
const form = reactive({ key: "", value: "", lease: "" });

const keyColumns = [
  { prop: "key", label: "键", minWidth: 260, slot: "col-key" },
  { prop: "version", label: "版本", width: 80 },
  { prop: "modRevision", label: "修订号", width: 100 },
  { prop: "lease", label: "租约", width: 120, slot: "col-lease" },
  { prop: "actions", label: "操作", width: 190, fixed: "right" as const, slot: "col-actions" },
];
const leaseColumns = [
  { prop: "id", label: "租约 ID", minWidth: 220, slot: "col-leaseId" },
  { prop: "ttl", label: "剩余 / 授予 TTL", width: 190, slot: "col-ttl" },
  { prop: "keyCount", label: "绑定键数", width: 110 },
  { prop: "actions", label: "操作", width: 190, fixed: "right" as const, slot: "col-actions" },
];
const memberColumns = [
  { prop: "id", label: "成员 ID", minWidth: 180, slot: "col-memberId" },
  { prop: "name", label: "名称", width: 140 },
  { prop: "role", label: "角色", width: 120, slot: "col-role" },
  { prop: "healthy", label: "健康", width: 110, slot: "col-healthy" },
  { prop: "version", label: "版本", width: 110 },
  { prop: "dbSize", label: "数据大小(字节)", width: 140 },
  { prop: "error", label: "失败原因", minWidth: 180 },
];

/** 当前前缀下的键行（显示名 = 前缀之后的第一段） */
const keyRows = computed<EtcdKeyRow[]>(() => keys.value.map(k => ({ ...k, name: displayName(k.key) })));

/** 由键名推导出的下一级"文件夹" */
const folders = computed(() => {
  const map = new Map<string, number>();
  // 拼路径必须以**绝对前缀**为基准：activePrefix 为空时要补 "/"，
  // 否则推导出的是 `ngxacc-ui-x/` 这种缺前导斜杠的路径，点进去查不到任何键（验收抓到的真 bug）。
  const base = activePrefix.value || "/";
  keys.value.forEach(k => {
    const rest = stripPrefix(k.key);
    const idx = rest.indexOf("/");
    if (idx >= 0) {
      const seg = rest.slice(0, idx + 1);
      const path = base.endsWith("/") ? base + seg : base + "/" + seg;
      map.set(path, (map.get(path) || 0) + 1);
    }
  });
  return Array.from(map.entries()).map(([path, count]) => ({ path, name: path.replace(base, ""), count }));
});

/** 当前前缀下的叶子键（不再分层） */
const leafKeys = computed<EtcdKeyRow[]>(() => keyRows.value.filter(r => !stripPrefix(r.key).includes("/")));

/** 目录过滤（过滤词不匹配目录名时隐藏，展示条数由计数条给出） */
const filteredFolders = computed(() => {
  const kw = prefixFilter.value.trim().toLowerCase();
  return kw ? folders.value.filter(f => f.name.toLowerCase().includes(kw)) : folders.value;
});

/** 叶子键过滤 */
const filteredLeaves = computed(() => {
  const kw = prefixFilter.value.trim().toLowerCase();
  return kw ? leafKeys.value.filter(r => r.name.toLowerCase().includes(kw)) : leafKeys.value;
});

/**
 * 开始拖拽侧栏分隔条（Redis 同形态）。
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

/** 键行右键菜单（第九批统一 zk 模板）：侧栏叶子行 + 键列表表格共用一套动作 */
const keyMenu = reactive({ visible: false, x: 0, y: 0, key: "" });
const keyMenuItems = [
  { key: "view", label: "查看详情", icon: "View" },
  { key: "edit", label: "编辑", icon: "Edit" },
  { key: "copy", label: "复制键名", icon: "CopyDocument" },
  { key: "delete", label: "删除", icon: "Delete", danger: true, divided: true },
];
/** 表格行右键（ReTable 内置菜单，图标为组件引用） */
const keyTableMenu = [
  { key: "view", label: "查看详情", icon: View },
  { key: "edit", label: "编辑", icon: EditPen },
  { key: "copy", label: "复制键名", icon: CopyDocument },
  { key: "delete", label: "删除", icon: Delete, divided: true },
];
/** 打开侧栏键行右键菜单 */
function onKeyContextMenu(e: MouseEvent, key: string) {
  Object.assign(keyMenu, { visible: true, x: e.clientX, y: e.clientY, key });
}
/** 复制文本到剪贴板（菜单动作共用） */
function copyKeyText(key: string) {
  void copyToClipboard(key).then(ok => ok ? message.success("已复制键名") : message.error("复制失败"));
}
/** 侧栏菜单分发 */
function onKeyMenuSelect(action: string) {
  const key = keyMenu.key;
  if (!key) return;
  if (action === "view") openDetail(key);
  else if (action === "edit") openEdit(key);
  else if (action === "copy") copyKeyText(key);
  else if (action === "delete") confirmDelete(key);
}
/** 表格菜单分发 */
function onKeyTableMenuSelect(item: { key: string }, ctx: { row: Record<string, unknown> }) {
  const key = String((ctx.row as EtcdKeyRow).key ?? "");
  if (!key) return;
  if (item.key === "view") openDetail(key);
  else if (item.key === "edit") openEdit(key);
  else if (item.key === "copy") copyKeyText(key);
  else if (item.key === "delete") confirmDelete(key);
}

/**
 * 去掉当前前缀，得到剩余部分。
 *
 * <p>前缀为空（或前缀不以 {@code /} 结尾）时，剩余部分会以 {@code /} 开头；直接
 * {@code indexOf("/")} 会得到 0，于是"第一级文件夹"被算成 {@code /}，侧栏会显示成一个
 * 孤零零的斜杠而不是真实的第一段名字（验收时抓到的真 bug）。这里统一先去掉一个前导斜杠。</p>
 *
 * @param key 完整键名
 * @returns 剩余部分（去掉一个前导斜杠）
 */
function stripPrefix(key: string): string {
  const prefix = activePrefix.value;
  const rest = prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key;
  return rest.startsWith("/") ? rest.slice(1) : rest;
}

/**
 * 键在列表里的显示名。
 *
 * @param key 完整键名
 * @returns 显示名
 */
function displayName(key: string): string {
  const rest = stripPrefix(key);
  const idx = rest.indexOf("/");
  return idx >= 0 ? rest.slice(0, idx + 1) : rest;
}

/**
 * 取键的父前缀。
 *
 * @param prefix 当前前缀
 * @returns 父前缀，根返回空串
 */
function parentOf(prefix: string): string {
  if (!prefix) {
    return "";
  }
  const trimmed = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const idx = trimmed.lastIndexOf("/");
  return idx <= 0 ? "" : trimmed.slice(0, idx + 1);
}

/**
 * 加载当前前缀下的键。
 */
async function loadKeys() {
  if (!datasourceId.value) {
    return;
  }
  loading.value = true;
  try {
    keys.value = (await fetchEtcdKeys({ datasourceId: datasourceId.value, prefix: activePrefix.value, limit: 500, keysOnly: true })) || [];
    ready();
  } catch (e) {
    keys.value = [];
    fail(e, "/ms/monitor/etcd/keys");
  } finally {
    loading.value = false;
  }
}

/**
 * 加载服务端状态。
 */
async function loadStatus() {
  if (!datasourceId.value) {
    return;
  }
  try {
    status.value = (await fetchEtcdStatus(datasourceId.value)) || {};
  } catch (e) {
    fail(e, "/ms/monitor/etcd/status");
  }
}

/**
 * 加载租约列表。
 */
async function loadLeases() {
  if (!datasourceId.value) {
    return;
  }
  loading.value = true;
  try {
    leases.value = (await fetchEtcdLeases(datasourceId.value)) || [];
    ready();
  } catch (e) {
    leases.value = [];
    fail(e, "/ms/monitor/etcd/leases");
  } finally {
    loading.value = false;
  }
}

/**
 * 加载集群成员。
 */
async function loadMembers() {
  if (!datasourceId.value) {
    return;
  }
  loading.value = true;
  try {
    members.value = (await fetchEtcdMembers(datasourceId.value)) || [];
    ready();
  } catch (e) {
    members.value = [];
    fail(e, "/ms/monitor/etcd/members");
  } finally {
    loading.value = false;
  }
}

/**
 * 进入某个前缀。
 *
 * @param prefix 目标前缀
 */
async function enterPrefix(prefix: string) {
  activePrefix.value = prefix;
  activeKey.value = "";
  detail.value = null;
  await loadKeys();
}

/**
 * 选中一个键并读取详情。
 *
 * @param key 键名
 */
async function selectKey(key: string) {
  activeKey.value = key;
  detail.value = null;
  try {
    detail.value = await fetchEtcdKey(key, datasourceId.value);
    ready();
  } catch (e) {
    fail(e, `/ms/monitor/etcd/key?key=${key}`);
  }
}

/**
 * 切换页签并按需加载。
 *
 * @param tab 目标页签
 */
async function switchTab(tab: "keys" | "leases" | "cluster") {
  activeTab.value = tab;
  if (tab === "leases") {
    await loadLeases();
  } else if (tab === "cluster") {
    await loadMembers();
    await loadStatus();
  }
}

/** 打开新建键弹窗 */
function openCreate() {
  keyDialogMode.value = "create";
  Object.assign(form, { key: activePrefix.value, value: "", lease: "" });
  keyVisible.value = true;
}

/**
 * 打开编辑键弹窗。
 *
 * @param key 键名
 */
async function openEdit(key: string) {
  keyDialogMode.value = "edit";
  try {
    const d = await fetchEtcdKey(key, datasourceId.value);
    Object.assign(form, { key, value: d.value, lease: d.lease ? String(d.lease) : "" });
    keyVisible.value = true;
  } catch (e) {
    fail(e, `/ms/monitor/etcd/key?key=${key}`);
  }
}

/**
 * 打开只读详情弹窗。
 *
 * @param key 键名
 */
async function openDetail(key: string) {
  keyDialogMode.value = "view";
  try {
    const d = await fetchEtcdKey(key, datasourceId.value);
    Object.assign(form, { key, value: d.value, lease: d.lease ? String(d.lease) : "" });
    keyVisible.value = true;
  } catch (e) {
    fail(e, `/ms/monitor/etcd/key?key=${key}`);
  }
}

/** 提交键写入 */
async function submitKey() {
  const key = form.key.trim();
  if (!key) {
    message.warning("键名不能为空");
    return;
  }
  const lease = Number(form.lease.trim());
  saving.value = true;
  try {
    await saveEtcdKey({
      datasourceId: datasourceId.value,
      key,
      value: form.value,
      lease: Number.isFinite(lease) && lease > 0 ? lease : undefined,
    });
    message.success(keyDialogMode.value === "create" ? "键已创建" : "键已保存");
    keyVisible.value = false;
    ready();
    await loadKeys();
    if (activeKey.value === key) {
      await selectKey(key);
    }
  } catch (e) {
    fail(e, "/ms/monitor/etcd/key");
  } finally {
    saving.value = false;
  }
}

/**
 * 确认并删除键。
 *
 * @param key 键名
 */
async function confirmDelete(key: string) {
  try {
    await ElMessageBox.confirm(`确定删除键 ${key} 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    const deleted = await deleteEtcdKey(key, datasourceId.value, false);
    message.success(`已删除（${deleted} 个）`);
    if (activeKey.value === key) {
      activeKey.value = "";
      detail.value = null;
    }
    ready();
    await loadKeys();
  } catch (e) {
    fail(e, `/ms/monitor/etcd/key?key=${key}`);
  }
}

/**
 * 确认并删除目录（前缀）下全部键。
 *
 * <p>对应 etcd 的 DeleteRange：后端按前缀删除，目录下的键一次性清空；删除目录就是删除
 * 其前缀下的所有键。删除后若当前选中的键落在该前缀内，需要清掉详情避免展示已删数据。</p>
 *
 * @param path 目录绝对前缀
 * @param count 目录下的键数量（仅用于确认文案）
 */
async function confirmDeletePrefix(path: string, count: number) {
  try {
    await ElMessageBox.confirm(`确定删除目录 ${path} 下全部 ${count} 个键吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    const deleted = await deleteEtcdKey(path, datasourceId.value, true);
    message.success(`已删除（${deleted} 个）`);
    if (activeKey.value.startsWith(path)) {
      activeKey.value = "";
      detail.value = null;
    }
    ready();
    await loadKeys();
  } catch (e) {
    fail(e, "/ms/monitor/etcd/key?prefix=true");
  }
}

/** 打开授予租约弹窗 */
function openLeaseDialog() {
  leaseTtl.value = "300";
  leaseVisible.value = true;
}

/** 提交授予租约 */
async function submitLease() {
  const ttl = Number(leaseTtl.value.trim());
  if (!Number.isFinite(ttl) || ttl <= 0) {
    message.warning("TTL 必须为正整数秒");
    return;
  }
  saving.value = true;
  try {
    const created = await grantEtcdLease({ datasourceId: datasourceId.value, ttl });
    message.success(`租约已授予：${created?.id}`);
    leaseVisible.value = false;
    await switchTab("leases");
  } catch (e) {
    fail(e, "/ms/monitor/etcd/lease");
  } finally {
    saving.value = false;
  }
}

/**
 * 确认并撤销租约。
 *
 * @param lease 租约行
 */
async function confirmRevoke(lease: EtcdLease) {
  try {
    await ElMessageBox.confirm(`确定撤销租约 ${lease.id} 吗？绑定的键会被一并删除。`, "撤销确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await revokeEtcdLease(lease.id, datasourceId.value);
    message.success("租约已撤销");
    await loadLeases();
  } catch (e) {
    fail(e, "/ms/monitor/etcd/lease");
  }
}

/**
 * 查看租约绑定的键。
 *
 * @param lease 租约行
 */
function showLeaseKeys(lease: EtcdLease) {
  message.info(lease.keyCount ? `该租约绑定了 ${lease.keyCount} 个键` : "该租约当前没有绑定键");
}

/** 测试连接 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testEtcdConnection(datasourceId.value);
    if (result?.connected) {
      message.success(`连接成功（etcd ${result.version || "未知版本"}）`);
    } else {
      message.error(result?.message || "连接失败");
    }
    ready();
    await loadStatus();
  } catch (e) {
    fail(e, "/ms/monitor/etcd/test");
  } finally {
    testing.value = false;
  }
}

/** 全量刷新 */
async function refresh() {
  await bind("etcd");
  if (!source.value) {
    return;
  }
  await loadKeys();
  await loadStatus();
  if (activeTab.value === "leases") {
    await loadLeases();
  } else if (activeTab.value === "cluster") {
    await loadMembers();
  }
}

/**
 * 十六进制 ID 缩写（集群 ID 很长，页面只展示前 12 位）。
 *
 * @param id 完整 ID
 * @returns 缩写
 */
function shortId(id?: string | null): string {
  const text = String(id || "");
  return text.length > 12 ? `${text.slice(0, 12)}…` : text;
}

/**
 * 字节数格式化。
 *
 * @param bytes 字节
 * @returns 可读文本
 */
function formatBytes(bytes?: number | null): string {
  if (bytes == null) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

onMounted(refresh);
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; background: var(--bg-fill); }
/* 顶部工具条：视觉（圆角/边框/投影/底色/内距）由模板上的 re-surface 类统一提供
   （16px 圆角、透明边框 + 双层柔光投影），这里只留布局——不再自写一套卡片壳防漂移 */
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-etcd-icon { color: #10b981; }
.dsm-toolbar-right { display: flex; gap: 8px; }
.dsm-body { display: flex; flex: 1; gap: 0; overflow: hidden; }
.dsm.resizing { user-select: none; }
.dsm-split { position: relative; width: 16px; flex-shrink: 0; cursor: col-resize; }
.dsm-split::after { content: ""; position: absolute; top: 0; bottom: 0; left: 6px; width: 4px; border-radius: 2px; background: transparent; transition: background 0.15s; }
.dsm-split:hover::after, .dsm-split.active::after { background: var(--brand-400); }
.dsm-sidebar { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; flex-shrink: 0; display: flex; flex-direction: column; }
.dsm-search-section { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.dsm-search-section > *:first-child { flex: 1; }
.dsm-view-bar { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.dsm-view-bar :deep(.rs-btn) { margin: 0; }
.dsm-view-count { font-size: 12px; color: var(--text-tertiary); }
.dsm-view-spacer { flex: 1; }
.dsm-key-list { flex: 1; min-height: 80px; overflow-y: auto; display: flex; flex-direction: column; }
.dsm-tree { padding: 8px 0; }
/* 键列表顶部扫描条：刷新中走动画（sticky 在滚动容器顶部） */
.dsm-scan-bar { position: sticky; top: 0; z-index: 2; height: 2px; overflow: hidden; background: transparent; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
.dsm-scan-bar.is-active { opacity: 1; }
.dsm-scan-bar span { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brand-500, #409eff), transparent); transform: translateX(-100%); }
.dsm-scan-bar.is-active span { animation: dsm-scan-slide 1s linear infinite; }
@keyframes dsm-scan-slide { to { transform: translateX(350%); } }
.dsm-tree-node { position: relative; display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; background: var(--bg-container); }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-root { font-weight: 600; }
.dsm-tree-branch { padding: 4px 14px 8px; font-size: 11px; color: var(--text-tertiary); font-family: "JetBrains Mono", "Consolas", monospace; word-break: break-all; }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsm-tree-count { font-size: 11px; color: var(--text-tertiary); background: var(--bg-fill); padding: 1px 6px; border-radius: 10px; }
.dsm-lease-tag { font-size: 10px; color: #f59e0b; background: rgba(245, 158, 11, 0.15); padding: 1px 5px; border-radius: 4px; font-weight: 600; }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
/* 顶部信息带：视觉（圆角/边框/投影/底色）由模板上的 re-surface 类统一提供（16px 圆角、
   透明边框 + 双层柔光投影），这里只留网格布局——不再自写一套卡片壳防漂移（surface:check） */
.dsm-info-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.dsm-section { border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); }
.dsm-section-actions { display: flex; gap: 4px; }
.dsm-tabs { display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid var(--border-subtle); }
.dsm-tab { padding: 6px 14px; font-size: 13px; cursor: pointer; color: var(--text-tertiary); border-bottom: 2px solid transparent; transition: all 0.15s; }
.dsm-tab:hover { color: var(--brand-600); }
.dsm-tab.active { color: var(--brand-600); border-bottom-color: var(--brand-500); font-weight: 600; }
.dsm-node-detail { padding: 14px 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-detail-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-detail-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-detail-value { font-size: 13px; color: var(--text-primary); }
.dsm-data-section { padding: 14px 16px; }
.dsm-data-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.dsm-data-content { margin: 0; padding: 12px; background: var(--bg-fill); border-radius: 6px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 12px; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; max-height: 220px; overflow-y: auto; }
.dsm-empty-inline { padding: 16px; color: var(--text-tertiary); font-size: 13px; }
.dsm-member-detail { padding: 14px 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; border-top: 1px solid var(--border-subtle); }
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }
.dsm-node-form { display: flex; flex-direction: column; gap: 14px; }
.dsm-form-item { display: flex; flex-direction: column; gap: 6px; }
.dsm-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.dsm-form-hint { font-size: 12px; line-height: 1.5; color: var(--text-tertiary); }
.dsm-node-data { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-node-data:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
</style>
