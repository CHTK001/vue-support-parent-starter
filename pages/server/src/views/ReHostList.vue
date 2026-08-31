<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox, ElUpload } from 'element-plus';
import type { UploadFile } from 'element-plus';
import {
  queryHosts,
  getGroups,
  saveHost,
  delHost,
  switchHost,
  testConnectHost,
  getIdentities,
  getHostStats,
  exportHostsUrl,
  importHosts,
  batchUpdateStatus,
  batchMoveGroup,
} from '../api';
import ReHostFormDialog from '../components/ReHostFormDialog.vue';
import ReConnectDialog from '../components/ReConnectDialog.vue';
import ReGuacViewer from '../components/ReGuacViewer.vue';
import ReSftpPanel from '../components/ReSftpPanel.vue';
import ReHostDetail from '../components/ReHostDetail.vue';
import ReSystemSettings from '../components/ReSystemSettings.vue';

/** 主机行 */
interface HostRow {
  id: number;
  serverHostName: string;
  serverHostCode?: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  msServerGroupId?: number | null;
  serverHostTags?: string;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostAgentKey?: string;
}

/** 分组行 */
interface GroupRow {
  id: number;
  msServerGroupName: string;
}

/** 主机列表 */
const hosts = ref<HostRow[]>([]);

/** 分组列表 */
const groups = ref<GroupRow[]>([]);

/** 身份列表（连接对话框用） */
const identities = ref<Array<Record<string, any>>>([]);

/** 资产统计 */
const hostStats = ref({ total: 0, online: 0, offline: 0, unknown: 0 });
const statsLoading = ref(false);

async function loadStats() {
  statsLoading.value = true;
  try {
    hostStats.value = await getHostStats();
  } catch { /* ignore */ }
  finally { statsLoading.value = false; }
}

/** 过滤条件 */
const keyword = ref('');
const filterGroupId = ref<number | null>(null);

/** 加载态 */
const loading = ref(false);

/** 表单对话框 */
const formVisible = ref(false);
const editingHost = ref<HostRow | null>(null);

/** 连接对话框 */
const connectVisible = ref(false);
const connectingHost = ref<HostRow | null>(null);

/** 远控参数（非空即打开 viewer） */
const guacConnection = ref<{
  hostId: number;
  hostName: string;
  protocol: string;
  identityId: number | null;
  targetPort: number | null;
} | null>(null);

/** SFTP 面板抽屉 */
const sftpVisible = ref(false);
const sftpHostId = ref<number | null>(null);

/** 详情抽屉 */
const detailVisible = ref(false);
const detailHost = ref<HostRow | null>(null);

/** 系统设置面板 */
const settingsVisible = ref(false);

function openDetail(row: HostRow) {
  detailHost.value = row;
  detailVisible.value = true;
}

/** 批量操作 */
const selectedIds = ref<number[]>([]);

async function onBatchEnable(enabled: boolean) {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择主机');
    return;
  }
  await ElMessageBox.confirm(`确认${enabled ? '启用' : '停用'}选中的 ${selectedIds.value.length} 台主机?`, '批量操作', { type: 'warning' });
  await batchUpdateStatus(selectedIds.value, enabled);
  ElMessage.success('操作成功');
  selectedIds.value = [];
  refresh();
}

async function onBatchMoveGroup() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择主机');
    return;
  }
  const { value: groupId } = await ElMessageBox.prompt('请输入目标分组ID', '批量移动分组', {
    inputType: 'number',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的分组ID',
  });
  if (groupId) {
    await batchMoveGroup(selectedIds.value, Number(groupId));
    ElMessage.success('已移动');
    selectedIds.value = [];
    refresh();
  }
}

onMounted(() => { refresh(); loadStats(); });

/**
 * 刷新主机与分组数据
 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [hostList, groupList] = await Promise.all([
      queryHosts({ keyword: keyword.value || undefined, groupId: filterGroupId.value ?? undefined }),
      getGroups().catch(() => [] as GroupRow[]),
    ]);
    hosts.value = hostList ?? [];
    groups.value = groupList ?? [];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/**
 * 打开新增表单
 */
function openCreate(): void {
  editingHost.value = null;
  formVisible.value = true;
}

/**
 * 打开编辑表单
 *
 * @param row 主机
 */
function openEdit(row: HostRow): void {
  editingHost.value = row;
  formVisible.value = true;
}

/**
 * 表单提交回调
 *
 * @param data 表单数据
 */
async function onSubmitForm(data: Record<string, any>): Promise<void> {
  try {
    await saveHost(data.id ?? null, data);
    ElMessage.success('已保存');
    formVisible.value = false;
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 删除主机
 *
 * @param row 主机
 */
async function onDelete(row: HostRow): Promise<void> {
  await ElMessageBox.confirm(`确认删除主机 ${row.serverHostName}?`, '删除', { type: 'warning' });
  await delHost(row.id);
  ElMessage.success('已删除');
  refresh();
}

/**
 * 启停切换
 *
 * @param row 主机
 */
async function onSwitch(row: HostRow): Promise<void> {
  await switchHost(row.id, row.serverHostStatus === 1 ? false : true);
  refresh();
}

/**
 * 连通性测试
 *
 * @param row 主机
 */
async function onTestConnect(row: HostRow): Promise<void> {
  const message = ElMessage({
    type: 'info',
    message: `正在测试 ${row.serverHostAddress} …`,
    duration: 0,
  });
  try {
    const banner = await testConnectHost(row.id);
    message.close();
    ElMessage.success(`测试成功：${banner}`);
    refresh();
  } catch (e) {
    message.close();
    ElMessage.error((e as Error).message);
  }
}

/**
 * 打开连接配置（远控）
 *
 * @param row 主机
 */
async function onOpenConnect(row: HostRow): Promise<void> {
  if (identities.value.length === 0) {
    identities.value = await getIdentities().catch(() => []);
  }
  connectingHost.value = row;
  connectVisible.value = true;
}

/**
 * 发起远控连接
 *
 * @param params 连接参数
 */
function onConnect(params: {
  hostId: number;
  protocol: string;
  identityId: number | null;
  targetPort: number | null;
}): void {
  guacConnection.value = {
    hostId: params.hostId,
    hostName: connectingHost.value?.serverHostName ?? '',
    protocol: params.protocol,
    identityId: params.identityId,
    targetPort: params.targetPort,
  };
}

/**
 * 打开 SFTP 面板
 *
 * @param row 主机
 */
function onOpenSftp(row: HostRow): void {
  sftpHostId.value = row.id;
  sftpVisible.value = true;
}

/**
 * 分组名称反查
 *
 * @param groupId 分组 ID
 */
function groupName(groupId?: number | null): string {
  return groups.value.find(g => g.id === groupId)?.msServerGroupName ?? '-';
}

/**
 * 标签 JSON 解析
 *
 * @param raw JSON 数组字符串
 */
function parseTags(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function onExport() {
  const url = exportHostsUrl(keyword.value || undefined, filterGroupId.value ?? undefined);
  window.open(url, '_blank');
}

async function onImport(file: UploadFile) {
  try {
    if (!file.raw) return;
    const count = await importHosts(file.raw);
    ElMessage.success(`成功导入 ${count} 条记录`);
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
</script>

<template>
  <div class="host-list">
    <!-- 资产统计 -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ hostStats.total }}</span>
        <span class="stat-label">资产总数</span>
      </div>
      <div class="stat-card success">
        <span class="stat-value">{{ hostStats.online }}</span>
        <span class="stat-label">在线</span>
      </div>
      <div class="stat-card danger">
        <span class="stat-value">{{ hostStats.offline }}</span>
        <span class="stat-label">离线</span>
      </div>
      <div class="stat-card warning">
        <span class="stat-value">{{ hostStats.unknown }}</span>
        <span class="stat-label">未知</span>
      </div>
    </div>
    <!-- 工具条 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索名称/编码/地址"
        clearable
        style="width: 240px"
        @keyup.enter="refresh"
      />
      <el-select
        v-model="filterGroupId"
        placeholder="全部分组"
        clearable
        style="width: 160px"
        @change="queryHosts({ groupId: filterGroupId }).then(r => (hosts = r ?? [])).catch(() => {})"
      >
        <el-option v-for="group in groups" :key="group.id" :value="group.id" :label="group.msServerGroupName" />
      </el-select>
      <el-button type="primary" @click="openCreate">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>
        新增主机
      </el-button>
      <el-button @click="settingsVisible = true">
        <el-icon style="margin-right: 4px"><Setting /></el-icon>
        系统设置
      </el-button>
      <el-button @click="refresh">
        <el-icon style="margin-right: 4px"><Refresh /></el-icon>
        刷新
      </el-button>
      <el-upload
        :show-file-list="false"
        :auto-upload="false"
        accept=".xlsx,.xls"
        @change="onImport"
      >
        <el-button>
          <el-icon style="margin-right: 4px"><Upload /></el-icon>
          导入
        </el-button>
      </el-upload>
      <el-button @click="onExport">
        <el-icon style="margin-right: 4px"><Download /></el-icon>
        导出
      </el-button>
    </div>

    <div class="batch-bar" v-if="selectedIds.length > 0">
      <span class="batch-info">已选 {{ selectedIds.length }} 台</span>
      <el-button size="small" type="success" @click="onBatchEnable(true)">批量启用</el-button>
      <el-button size="small" type="warning" @click="onBatchEnable(false)">批量停用</el-button>
      <el-button size="small" @click="onBatchMoveGroup">移动分组</el-button>
      <el-button size="small" @click="selectedIds = []">清除选择</el-button>
    </div>

    <!-- 主机表格 -->
    <el-table v-loading="loading" :data="hosts" border stripe size="default"
      @selection-change="(rows: any[]) => selectedIds = rows.map((r: any) => r.id)">
      <el-table-column type="selection" width="40" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.serverHostOnline === 1 ? 'success' : row.serverHostOnline === 0 ? 'danger' : 'info'" size="small">
            {{ row.serverHostOnline === 1 ? '在线' : row.serverHostOnline === 0 ? '离线' : '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="serverHostName" label="名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="serverHostAddress" label="地址" min-width="140" show-overflow-tooltip />
      <el-table-column prop="serverHostPort" label="端口" width="70" />
      <el-table-column prop="serverHostOsType" label="系统" width="90" />
      <el-table-column label="分组" width="110">
        <template #default="{ row }">{{ groupName(row.msServerGroupId) }}</template>
      </el-table-column>
      <el-table-column label="标签" min-width="120">
        <template #default="{ row }">
          <el-tag
            v-for="tag in parseTags(row.serverHostTags)"
            :key="tag"
            size="small"
            style="margin-right: 4px"
          >{{ tag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80">
        <template #default="{ row }">
          <el-switch :model-value="row.serverHostStatus === 1" @change="onSwitch(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-tooltip content="详情" placement="top">
            <el-button link type="primary" size="small" @click="openDetail(row)">
              <el-icon><View /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="远控" placement="top">
            <el-button link type="primary" size="small" @click="onOpenConnect(row)">
              <el-icon><Connection /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="文件" placement="top">
            <el-button link type="primary" size="small" @click="onOpenSftp(row)">
              <el-icon><FolderOpened /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="测连" placement="top">
            <el-button link size="small" @click="onTestConnect(row)">
              <el-icon><Aim /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="编辑" placement="top">
            <el-button link size="small" @click="openEdit(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button link type="danger" size="small" @click="onDelete(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单 / 连接 / 远控 / SFTP -->
    <ReHostFormDialog v-model="formVisible" :host="editingHost" @submit="onSubmitForm" />
    <ReConnectDialog v-model="connectVisible" :host="connectingHost" :identities="identities" @connect="onConnect" />
    <ReGuacViewer :connection="guacConnection" @close="guacConnection = null" />

    <el-drawer v-model="sftpVisible" :title="`SFTP 文件管理`" direction="rtl" size="60%" destroy-on-close>
      <ReSftpPanel :host-id="sftpHostId" />
    </el-drawer>

    <ReHostDetail v-model="detailVisible" :host="detailHost" @updated="refresh" />
    <ReSystemSettings v-model="settingsVisible" @saved="refresh" />
  </div>
</template>

<style scoped lang="scss">
.host-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
}
.stat-card.success { border-left: 3px solid var(--el-color-success); }
.stat-card.danger { border-left: 3px solid var(--el-color-danger); }
.stat-card.warning { border-left: 3px solid var(--el-color-warning); }
.stat-value { font-size: 24px; font-weight: 700; color: var(--el-text-color-primary); }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }

.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  border: 1px solid var(--el-color-primary-light-7);
}
.batch-info {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 500;
  margin-right: 8px;
}
</style>
