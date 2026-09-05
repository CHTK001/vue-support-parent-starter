<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
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
import ScHostFormDialog from '../components/ScHostFormDialog.vue';
import ScConnectDialog from '../components/ScConnectDialog.vue';
import ScGuacViewer from '../components/ScGuacViewer.vue';
import ScSftpPanel from '../components/ScSftpPanel.vue';
import ScHostDetail from '../components/ScHostDetail.vue';

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

function openDetail(row: HostRow) {
  detailHost.value = row;
  detailVisible.value = true;
}

/** 批量操作 */
const selectedIds = ref<number[]>([]);

async function onBatchEnable(enabled: boolean) {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择主机');
    return;
  }
  await message.confirm(`确认${enabled ? '启用' : '停用'}选中的 ${selectedIds.value.length} 台主机?`, '批量操作');
  await batchUpdateStatus(selectedIds.value, enabled);
  message.success('操作成功');
  selectedIds.value = [];
  refresh();
}

async function onBatchMoveGroup() {
  if (selectedIds.value.length === 0) {
    message.warning('请先选择主机');
    return;
  }
  const { value: groupId } = await message.prompt('请输入目标分组ID', '批量移动分组', '确定', '取消', 'info', {
    inputType: 'number',
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入有效的分组ID',
  });
  if (groupId) {
    await batchMoveGroup(selectedIds.value, Number(groupId));
    message.success('已移动');
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
    message.error((e as Error).message);
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
    message.success('已保存');
    formVisible.value = false;
    refresh();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/**
 * 删除主机
 *
 * @param row 主机
 */
async function onDelete(row: HostRow): Promise<void> {
  await message.confirm(`确认删除主机 ${row.serverHostName}?`, '删除');
  await delHost(row.id);
  message.success('已删除');
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
    message.success(`测试成功：${banner}`);
    refresh();
  } catch (e) {
    message.close();
    message.error((e as Error).message);
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

async function onImportFile(file: File | undefined) {
  try {
    if (!file) return;
    const count = await importHosts(file);
    message.success(`成功导入 ${count} 条记录`);
    refresh();
  } catch (e) {
    message.error((e as Error).message);
  }
}
</script>

<template>
  <div class="host-list sc-page">
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
      <ReInput
        v-model="keyword"
        placeholder="搜索名称/编码/地址"
        clearable
        prefix-icon="Search"
        style="width: 240px"
        @keyup.enter="refresh"
      />
      <ReSelect
        v-model="filterGroupId"
        placeholder="全部分组"
        clearable
        :data="groups.map(g => ({ label: g.msServerGroupName, value: g.id }))"
        style="width: 160px"
        @change="queryHosts({ groupId: filterGroupId }).then(r => (hosts = r ?? [])).catch(() => {})"
      />
      <ReButton layout="square" icon="Plus" type="primary" size="default" @click="openCreate">新增主机</ReButton>
      <ReButton layout="square" icon="Refresh" @click="refresh">刷新</ReButton>
      <label class="import-btn">
        <input type="file" accept=".xlsx,.xls" hidden @change="(e: Event) => onImportFile((e.target as HTMLInputElement).files?.[0])" />
        <ReButton layout="square" icon="Upload" tag="span">导入</ReButton>
      </label>
      <ReButton layout="square" icon="Download" @click="onExport">导出</ReButton>
    </div>

    <div class="batch-bar" v-if="selectedIds.length > 0">
      <span class="batch-info">已选 {{ selectedIds.length }} 台</span>
      <ReButton layout="square" icon="CircleCheck" type="success" size="small" @click="onBatchEnable(true)">批量启用</ReButton>
      <ReButton layout="square" icon="CircleClose" type="warning" size="small" @click="onBatchEnable(false)">批量停用</ReButton>
      <ReButton layout="square" icon="FolderOpened" size="small" @click="onBatchMoveGroup">移动分组</ReButton>
      <ReButton layout="square" icon="Close" size="small" @click="selectedIds = []">清除选择</ReButton>
    </div>

    <!-- 主机表格 -->
    <ReTable :data="hosts" :loading="loading" border stripe size="default" :pagination="false" :toolbar="false"
      @selection-change="(rows: any[]) => selectedIds = rows.map((r: any) => r.id)">
      <ReTableColumn type="selection" width="40" />
      <ReTableColumn label="状态" width="90">
        <template #default="{ row }">
          <ReTag :type="row.serverHostOnline === 1 ? 'success' : row.serverHostOnline === 0 ? 'danger' : 'info'" size="small">
            {{ row.serverHostOnline === 1 ? '在线' : row.serverHostOnline === 0 ? '离线' : '未知' }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="serverHostName" label="名称" min-width="140" show-overflow-tooltip />
      <ReTableColumn prop="serverHostAddress" label="地址" min-width="140" show-overflow-tooltip />
      <ReTableColumn prop="serverHostPort" label="端口" width="70" />
      <ReTableColumn prop="serverHostOsType" label="系统" width="90" />
      <ReTableColumn label="分组" width="110">
        <template #default="{ row }">{{ groupName(row.msServerGroupId) }}</template>
      </ReTableColumn>
      <ReTableColumn label="标签" min-width="120">
        <template #default="{ row }">
          <ReTag
            v-for="tag in parseTags(row.serverHostTags)"
            :key="tag"
            size="small"
            style="margin-right: 4px"
          >{{ tag }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="启用" width="80">
        <template #default="{ row }">
          <ReSwitch :model-value="row.serverHostStatus === 1" @change="onSwitch(row)" />
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <ReButton layout="square" icon="View" type="primary" size="small" @click="openDetail(row)">详情</ReButton>
          <ReButton layout="square" icon="Connection" type="primary" size="small" @click="onOpenConnect(row)">远控</ReButton>
          <ReButton layout="square" icon="FolderOpened" type="primary" size="small" @click="onOpenSftp(row)">文件</ReButton>
          <ReButton layout="square" icon="Aim" size="small" @click="onTestConnect(row)">测连</ReButton>
          <ReButton layout="square" icon="Edit" size="small" @click="openEdit(row)">编辑</ReButton>
          <ReButton layout="square" icon="Delete" type="danger" size="small" @click="onDelete(row)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <!-- 表单 / 连接 / 远控 / SFTP -->
    <ScHostFormDialog v-model="formVisible" :host="editingHost" @submit="onSubmitForm" />
    <ScConnectDialog v-model="connectVisible" :host="connectingHost" :identities="identities" @connect="onConnect" />
    <ScGuacViewer :connection="guacConnection" @close="guacConnection = null" />

    <ReDrawer v-model="sftpVisible" title="SFTP 文件管理" :size="'60%'" direction="rtl" :footer-hidden="true" close-only>
      <template #content>
        <ScSftpPanel :host-id="sftpHostId" />
      </template>
    </ReDrawer>

    <ScHostDetail v-model="detailVisible" :host="detailHost" @updated="refresh" />
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

.import-btn {
  cursor: pointer;
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
