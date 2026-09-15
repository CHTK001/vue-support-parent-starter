<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
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
  scanPorts,
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
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  serverHostCollectEnabled?: number;
  serverHostCollectMode?: string;
  serverHostCollectInterval?: number;
  serverHostDelayEnabled?: number;
  serverHostDelayInterval?: number;
  serverHostDelayMs?: number | null;
  serverHostPorts?: string;
  serverHostLastPortScanTime?: string;
}

/** 采集方式选项 */
const collectModeOptions = [
  { label: '定时 SSH 采集', value: 'SCHEDULED' },
  { label: 'Agent 主动上报', value: 'AGENT' },
  { label: 'HTTP 接口拉取', value: 'HTTP' },
  { label: 'Prometheus 拉取', value: 'PROMETHEUS' },
];

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

const router = useRouter();

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

/** 更多配置弹窗状态 */
const configVisible = ref(false);
const configHost = ref<HostRow | null>(null);
const cfgForm = reactive({
  serverHostOnlineEnabled: 1,
  serverHostOnlineInterval: 60,
  serverHostCollectEnabled: 0,
  serverHostCollectMode: 'SCHEDULED',
  serverHostCollectInterval: 3600,
  serverHostDelayEnabled: 0,
  serverHostDelayInterval: 60,
});
const cfgSaving = ref(false);

function openDetail(row: HostRow) {
  // 独立新窗口打开主机监控页，不受主应用 router/tab 控制
  const url = `${location.pathname}#/host/${row.id}`;
  window.open(url, `host-detail-${row.id}`, 'width=1280,height=860,resizable=yes,scrollbars=yes');
}

/** 打开更多配置弹窗并回填当前主机配置 */
function openConfig(row: HostRow) {
  configHost.value = row;
  cfgForm.serverHostOnlineEnabled = row.serverHostOnlineEnabled ?? 1;
  cfgForm.serverHostOnlineInterval = row.serverHostOnlineInterval ?? 60;
  cfgForm.serverHostCollectEnabled = row.serverHostCollectEnabled ?? 0;
  cfgForm.serverHostCollectMode = row.serverHostCollectMode || 'SCHEDULED';
  cfgForm.serverHostCollectInterval = row.serverHostCollectInterval ?? 3600;
  cfgForm.serverHostDelayEnabled = row.serverHostDelayEnabled ?? 0;
  cfgForm.serverHostDelayInterval = row.serverHostDelayInterval ?? 60;
  configVisible.value = true;
}

/** 保存更多配置 */
async function onSaveConfig(): Promise<void> {
  if (!configHost.value?.id) return;
  cfgSaving.value = true;
  try {
    await saveHost(configHost.value.id, {
      serverHostOnlineEnabled: cfgForm.serverHostOnlineEnabled,
      serverHostOnlineInterval: cfgForm.serverHostOnlineInterval,
      serverHostCollectEnabled: cfgForm.serverHostCollectEnabled,
      serverHostCollectMode: cfgForm.serverHostCollectMode,
      serverHostCollectInterval: cfgForm.serverHostCollectInterval,
      serverHostDelayEnabled: cfgForm.serverHostDelayEnabled,
      serverHostDelayInterval: cfgForm.serverHostDelayInterval,
    });
    message.success('主机配置已保存，检测/采集已动态调整');
    configVisible.value = false;
    refresh();
  } catch (e) {
    message.error((e as Error).message || '保存失败');
  } finally {
    cfgSaving.value = false;
  }
}

/** 延迟毫秒展示（-1 表示不可达） */
function delayText(ms?: number | null): string {
  if (ms == null) return '未检测';
  if (ms < 0) return '不可达';
  return `${ms} ms`;
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
  message.info(`正在测试 ${row.serverHostAddress} …`, { duration: 0 });
  try {
    const banner = await testConnectHost(row.id);
    message.closeAll();
    message.success(`测试成功：${banner}`);
    refresh();
  } catch (e) {
    message.closeAll();
    message.error((e as Error).message);
  }
}

/**
 * 端口扫描（依赖本机 nmap）
 *
 * @param row 主机
 */
async function onScanPorts(row: HostRow): Promise<void> {
  message.info(`正在扫描 ${row.serverHostAddress} 端口，全量扫描可能需要几分钟 …`, { duration: 0 });
  try {
    const updated = await scanPorts(row.id);
    message.closeAll();
    message.success(updated?.msg || '端口扫描完成');
    refresh();
  } catch (e) {
    message.closeAll();
    message.error((e as Error).message);
  }
}

/**
 * 打开连接配置（远控）
 *
 * @param row 主机
 */
function onOpenConnect(row: HostRow): void {
  // 跳转到远程控制页，右侧主区域直接渲染远控终端（master-detail 布局）
  router.push({ path: '/terminal', query: { hostId: String(row.id) } });
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

/** 端口扫描结果项 */
interface PortItem {
  port: string;
  protocol?: string;
  service?: string;
}

/**
 * 端口扫描 JSON 解析
 *
 * @param raw JSON 数组字符串
 */
function parsePorts(raw?: string): PortItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * 端口展示文案：22/tcp ssh
 *
 * @param item 端口项
 */
function portText(item: PortItem): string {
  const parts = [`${item.port}${item.protocol ? '/' + item.protocol : ''}`];
  if (item.service) parts.push(item.service);
  return parts.join(' ');
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
    <!-- 页面头部 + 主操作 -->
    <ReSectionHead class="page-head" title="主机资产" description="服务器台账、启停管理、远控与文件分发">
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" size="default" @click="openCreate">新增主机</ReButton>
        <ReButton show-text icon="Refresh" @click="refresh">刷新</ReButton>
        <label class="import-btn">
          <input type="file" accept=".xlsx,.xls" hidden @change="(e: Event) => onImportFile((e.target as HTMLInputElement).files?.[0])" />
          <ReButton show-text icon="Upload" tag="span">导入</ReButton>
        </label>
        <ReButton show-text icon="Download" @click="onExport">导出</ReButton>
      </template>
    </ReSectionHead>

    <!-- 资产统计 -->
    <ReSkeleton :loading="statsLoading" :rows="2" :count="1" animated>
      <div class="stats-grid">
        <ReStatCard title="资产总数" :value="hostStats.total" icon-color="var(--metric-cpu)">
          <template #icon><Monitor /></template>
          <template #value><ReCountup :value="hostStats.total" :duration="800" /></template>
        </ReStatCard>
        <ReStatCard title="在线" :value="hostStats.online" icon-color="var(--status-success)">
          <template #icon><CircleCheckFilled /></template>
          <template #value><ReCountup :value="hostStats.online" :duration="800" /></template>
        </ReStatCard>
        <ReStatCard title="离线" :value="hostStats.offline" icon-color="var(--status-error)">
          <template #icon><CircleCloseFilled /></template>
          <template #value><ReCountup :value="hostStats.offline" :duration="800" /></template>
        </ReStatCard>
        <ReStatCard title="未知" :value="hostStats.unknown" icon-color="var(--metric-disk)">
          <template #icon><QuestionFilled /></template>
          <template #value><ReCountup :value="hostStats.unknown" :duration="800" /></template>
        </ReStatCard>
      </div>
    </ReSkeleton>

    <!-- 筛选工具条 -->
    <div class="toolbar page-toolbar">
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
    </div>

    <div class="batch-bar" v-if="selectedIds.length > 0">
      <span class="batch-info">已选 {{ selectedIds.length }} 台</span>
      <ReButton show-text icon="CircleCheck" type="success" size="small" @click="onBatchEnable(true)">批量启用</ReButton>
      <ReButton show-text icon="CircleClose" type="warning" size="small" @click="onBatchEnable(false)">批量停用</ReButton>
      <ReButton show-text icon="FolderOpened" size="small" @click="onBatchMoveGroup">移动分组</ReButton>
      <ReButton show-text icon="Close" size="small" @click="selectedIds = []">清除选择</ReButton>
    </div>

    <!-- 主机表格 -->
    <ReTable :data="hosts" :loading="loading" border stripe size="default" :pagination="false" :toolbar="false"
      empty-text="暂无主机，点击右上角「新增主机」添加"
      @row-click="openDetail"
      @selection-change="(rows: any[]) => selectedIds = rows.map((r: any) => r.id)">
      <ReTableColumn type="selection" width="40" />
      <ReTableColumn label="状态" width="90">
        <template #default="{ row }">
          <span class="status-cell">
            <ReStatusIndicator
              :type="row.serverHostOnline === 1 ? 'success' : row.serverHostOnline === 0 ? 'danger' : 'info'"
              :pulse="row.serverHostOnline === 1"
            />
            {{ row.serverHostOnline === 1 ? '在线' : row.serverHostOnline === 0 ? '离线' : '未知' }}
          </span>
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
          <span @click.stop><ReSwitch :model-value="row.serverHostStatus === 1" @change="onSwitch(row)" /></span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="延迟" width="100">
        <template #default="{ row }">
          <span
            :class="[
              'delay-cell',
              row.serverHostDelayMs === null || row.serverHostDelayMs === undefined
                ? 'is-info'
                : row.serverHostDelayMs < 0 ? 'is-down' : row.serverHostDelayMs <= 50 ? 'is-fast' : 'is-slow'
            ]"
          >{{ delayText(row.serverHostDelayMs) }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="端口" min-width="160">
        <template #default="{ row }">
          <span v-if="!parsePorts(row.serverHostPorts).length" class="ports-empty">未扫描</span>
          <div v-else class="ports-wrap">
            <ReTag
              v-for="p in parsePorts(row.serverHostPorts)"
              :key="p.port"
              size="small"
              type="info"
              style="margin-right: 4px; margin-bottom: 4px"
            >{{ portText(p) }}</ReTag>
          </div>
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="380" fixed="right">
        <template #default="{ row }">
          <span @click.stop>
          <ReButton show-text icon="View" type="primary" size="small" @click="openDetail(row)">详情</ReButton>
          <ReButton show-text icon="Connection" type="primary" size="small" @click="onOpenConnect(row)">远控</ReButton>
          <ReButton show-text icon="FolderOpened" type="primary" size="small" @click="onOpenSftp(row)">文件</ReButton>
          <ReButton show-text icon="Aim" size="small" @click="onTestConnect(row)">测连</ReButton>
          <ReButton show-text icon="Search" type="warning" size="small" @click="onScanPorts(row)">扫端口</ReButton>
          <ReButton show-text icon="Edit" size="small" @click="openEdit(row)">编辑</ReButton>
          <ReButton show-text icon="MoreFilled" size="small" @click="openConfig(row)">更多</ReButton>
          <ReButton show-text icon="Delete" type="danger" size="small" @click="onDelete(row)">删除</ReButton>
          </span>
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

    <!-- 主机更多配置：在离线 / 指标采集 / 延迟检测 -->
    <ReDialog
      v-model="configVisible"
      layout="modern"
      compact
      :title="`主机配置 - ${configHost?.serverHostName || ''}`"
      width="520"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="cfgSaving"
      @confirm="onSaveConfig"
      @cancel="configVisible = false"
    >
      <ReForm label-position="left" label-width="130px" class="cfg-form">
        <ReDivider content-position="left">在离线检测</ReDivider>
        <ReFormItem label="启用自动检测">
          <ReSwitch v-model="cfgForm.serverHostOnlineEnabled" :active-value="1" :inactive-value="0" />
        </ReFormItem>
        <ReFormItem label="检测间隔(秒)">
          <ReInputNumber v-model="cfgForm.serverHostOnlineInterval" :min="5" :max="86400" style="width: 180px" />
        </ReFormItem>

        <ReDivider content-position="left">指标采集</ReDivider>
        <ReFormItem label="启用采集">
          <ReSwitch v-model="cfgForm.serverHostCollectEnabled" :active-value="1" :inactive-value="0" />
        </ReFormItem>
        <ReFormItem label="采集方式">
          <ReSelect v-model="cfgForm.serverHostCollectMode" :data="collectModeOptions" style="width: 220px" />
        </ReFormItem>
        <ReFormItem label="采集间隔(秒)">
          <ReInputNumber v-model="cfgForm.serverHostCollectInterval" :min="10" :max="86400" style="width: 180px" />
        </ReFormItem>

        <ReDivider content-position="left">延迟检测</ReDivider>
        <ReFormItem label="启用延迟检测">
          <ReSwitch v-model="cfgForm.serverHostDelayEnabled" :active-value="1" :inactive-value="0" />
        </ReFormItem>
        <ReFormItem label="检测间隔(秒)">
          <ReInputNumber v-model="cfgForm.serverHostDelayInterval" :min="5" :max="86400" style="width: 180px" />
        </ReFormItem>
      </ReForm>
    </ReDialog>

    <ScHostDetail v-model="detailVisible" :host="detailHost" @updated="refresh" />
  </div>
</template>

 <style scoped lang="scss">
.host-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.import-btn {
  cursor: pointer;
  display: inline-flex;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: color-mix(in srgb, var(--brand-500) 6%, transparent);
  border-radius: var(--border-radius);
  border: 1px solid color-mix(in srgb, var(--brand-500) 15%, transparent);
  animation: batch-in 0.2s var(--ease-out) both;
}
.batch-info {
  font-size: 12px;
  color: var(--brand-500);
  font-weight: 500;
  margin-right: 8px;
}

.delay-cell {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  &.is-fast { color: var(--status-success, #67c23a); font-weight: 500; }
  &.is-slow { color: var(--status-warning, #e6a23c); }
  &.is-down { color: var(--status-error, #f56c6c); font-weight: 500; }
  &.is-info { color: var(--text-tertiary, #909399); }
}

.ports-wrap {
  display: flex;
  flex-wrap: wrap;
  line-height: 1.4;
}

.ports-empty {
  color: var(--text-tertiary, #909399);
  font-size: 12px;
}

.cfg-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

@keyframes batch-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
</style>
