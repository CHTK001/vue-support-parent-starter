<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from '@repo/core';
import { http, unwrapResult } from '@repo/utils';
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
  testPrometheusHost,
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
  serverHostSshEnabled?: number;
  serverHostRemoteEnabled?: number;
  /**
   * 实时指标（CPU / 内存 / 磁盘使用率，百分比 0-100）。
   *
   * 后端 /ms/server/host 返回的主机行会带这三个字段（详情页与卡片环形图都用它），
   * 但实体声明里没有，导致模板访问时 TS2339。这里显式补上：字段缺失表示
   * 「该主机暂无实时指标」（如手动采集模式），模板按 0 渲染并提示。
   */
  cpuUsage?: number | null;
  memUsage?: number | null;
  diskUsage?: number | null;
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

/** 分组筛选下拉选项：末尾固定追加「+ 添加分组」入口（value=-1 为哨兵值） */
const ADD_GROUP_VALUE = -1;
const groupSelectOptions = computed(() => [
  ...groups.value.map(g => ({ label: g.msServerGroupName, value: g.id })),
  { label: '+ 添加分组', value: ADD_GROUP_VALUE },
]);

/**
 * 分组筛选变更：选中「+ 添加分组」时跳转分组管理页，其余按分组过滤
 */
async function onGroupFilterChange(val: number | null): Promise<void> {
  if (val === ADD_GROUP_VALUE) {
    // 重置筛选值，跳转分组管理页
    filterGroupId.value = null;
    router.push('/server/groups');
    return;
  }
  try {
    const rows = await queryHosts({ groupId: val ?? undefined });
    hosts.value = rows ?? [];
  } catch { /* ignore */ }
}

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

/** Prometheus 凭据校验 loading */
const promTestLoading = ref(false);
/** Prometheus 安装包下载地址（取自 monitor 全局配置） */
const promPkgUrl = ref('');

/** 从 monitor 全局配置读取 Prometheus 安装包下载地址 */
async function loadPrometheusPkgUrl(): Promise<void> {
  try {
    const all = await http().get('/ms/monitor/config').then((r: any) => unwrapResult<Record<string, string>>(r));
    const v = all?.['monitor.prometheus.package.url'];
    promPkgUrl.value = typeof v === 'string' ? v : (v != null ? String(v) : '');
  } catch { /* 未配置时静默 */ }
}

/** Prometheus 凭据校验：测试目标 /metrics 端点连通性 */
async function onTestPrometheus(): Promise<void> {
  if (!configHost.value?.id) return;
  promTestLoading.value = true;
  message.info('正在校验 Prometheus /metrics 端点 …', { duration: 0 });
  try {
    const msg = await testPrometheusHost(configHost.value.id);
    message.closeAll();
    message.success(msg || '校验成功');
  } catch (e) {
    message.closeAll();
    message.error((e as Error).message || '校验失败');
  } finally {
    promTestLoading.value = false;
  }
}

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

onMounted(() => { refresh(); loadStats(); loadPrometheusPkgUrl(); });

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

/** CPU 使用率颜色 */
function cpuColor(v?: number): string {
  const n = Number(v) || 0;
  if (n >= 80) return 'var(--el-color-danger)';
  if (n >= 60) return 'var(--el-color-warning)';
  return 'var(--el-color-success)';
}

/** 内存使用率颜色 */
function memColor(v?: number): string {
  return cpuColor(v);
}

/** 磁盘使用率颜色 */
function diskColor(v?: number): string {
  const n = Number(v) || 0;
  if (n >= 90) return 'var(--el-color-danger)';
  if (n >= 75) return 'var(--el-color-warning)';
  return 'var(--el-color-success)';
}
</script>

<!-- New modernized template: card-grid layout with koi tokens -->
<template>
<div class="host-list sc-page">
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

  <!-- 统计卡片：koi 令牌 + 大数字 + 微趋势 -->
  <ReSkeleton :loading="statsLoading" :rows="2" :count="1" animated>
    <div class="stats-grid">
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <div class="stat-label">资产总数</div>
        <div class="stat-value"><ReCountup :value="hostStats.total" :duration="800" /></div>
        <div class="stat-trend">全部主机</div>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <div class="stat-label">在线</div>
        <div class="stat-value"><ReCountup :value="hostStats.online" :duration="800" /></div>
        <div class="stat-trend is-up">运行正常</div>
      </div>
      <div class="stat-card" style="--accent: var(--status-error)">
        <div class="stat-label">离线</div>
        <div class="stat-value"><ReCountup :value="hostStats.offline" :duration="800" /></div>
        <div class="stat-trend is-down">需要关注</div>
      </div>
      <div class="stat-card" style="--accent: var(--metric-disk)">
        <div class="stat-label">未知</div>
        <div class="stat-value"><ReCountup :value="hostStats.unknown" :duration="800" /></div>
        <div class="stat-trend">等待检测</div>
      </div>
    </div>
  </ReSkeleton>

  <!-- 筛选工具条 -->
  <div class="toolbar page-toolbar">
    <ReInput v-model="keyword" placeholder="搜索名称/编码/地址" clearable prefix-icon="Search" style="width: 240px" @keyup.enter="refresh" />
    <ReSelect v-model="filterGroupId" placeholder="全部分组" clearable :data="groupSelectOptions" style="width: 180px" @change="onGroupFilterChange" />
  </div>

  <div class="batch-bar" v-if="selectedIds.length > 0">
    <span class="batch-info">已选 {{ selectedIds.length }} 台</span>
    <ReButton show-text icon="CircleCheck" type="success" @click="onBatchEnable(true)">批量启用</ReButton>
    <ReButton show-text icon="CircleClose" type="warning" @click="onBatchEnable(false)">批量停用</ReButton>
    <ReButton show-text icon="FolderOpened" @click="onBatchMoveGroup">移动分组</ReButton>
    <ReButton show-text icon="Close" @click="selectedIds = []">清除选择</ReButton>
  </div>

  <!-- 主机卡片网格 -->
  <div class="host-grid">
    <div
      v-for="row in hosts"
      :key="row.id"
      class="host-card"
      :class="{ 'is-offline': row.serverHostOnline === 0, 'is-unknown': row.serverHostOnline !== 1 && row.serverHostOnline !== 0 }"
      style="--status-color: var(--status-success)"
      @click="openDetail(row)"
    >
      <div class="host-card__head">
        <ReStatusIndicator :type="row.serverHostOnline === 1 ? 'success' : row.serverHostOnline === 0 ? 'danger' : 'info'" :pulse="row.serverHostOnline === 1" />
        <span class="host-name">{{ row.serverHostName }}</span>
        <span class="host-addr">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span>
      </div>

      <div class="host-card__metrics">
        <div class="mini-ring" :style="{ '--pct': (row.cpuUsage ?? 0) + '%', '--ring-color': cpuColor(row.cpuUsage ?? 0) }">
          <span class="mini-ring__val">{{ row.cpuUsage ?? 0 }}%</span>
        </div>
        <div class="mini-ring" :style="{ '--pct': (row.memUsage ?? 0) + '%', '--ring-color': memColor(row.memUsage ?? 0) }">
          <span class="mini-ring__val">{{ row.memUsage ?? 0 }}%</span>
        </div>
        <div class="mini-ring" :style="{ '--pct': (row.diskUsage ?? 0) + '%', '--ring-color': diskColor(row.diskUsage ?? 0) }">
          <span class="mini-ring__val">{{ row.diskUsage ?? 0 }}%</span>
        </div>
        <div class="metric-labels">
          <span>CPU</span><span>内存</span><span>磁盘</span>
        </div>
      </div>

      <div class="host-card__tags">
        <ReTag v-for="tag in parseTags(row.serverHostTags)" :key="tag" style="margin-right: 4px; margin-bottom: 4px">{{ tag }}</ReTag>
        <span v-if="!parseTags(row.serverHostTags).length" class="no-tags">无标签</span>
      </div>

      <div class="host-card__ports">
        <span v-if="!parsePorts(row.serverHostPorts).length" class="ports-empty">未扫描</span>
        <ReTag v-for="p in parsePorts(row.serverHostPorts)" :key="p.port" class="port-chip" type="info">{{ portText(p) }}</ReTag>
      </div>

      <div class="host-card__footer">
        <span class="host-group">{{ groupName(row.msServerGroupId) }}</span>
        <span class="host-delay" :class="{ 'is-down': row.serverHostDelayMs != null && row.serverHostDelayMs < 0 }">{{ delayText(row.serverHostDelayMs) }}</span>
      </div>

      <div class="host-card__actions" @click.stop>
        <ReButton show-text icon="View" type="primary" size="small" @click.stop="openDetail(row)">详情</ReButton>
        <ReButton v-if="row.serverHostRemoteEnabled === 1" show-text icon="Connection" type="primary" size="small" @click="onOpenConnect(row)">远控</ReButton>
        <ReButton v-if="row.serverHostSshEnabled === 1" show-text icon="FolderOpened" type="primary" size="small" @click="onOpenSftp(row)">文件</ReButton>
        <ReButton v-if="row.serverHostSshEnabled === 1" show-text icon="Aim" size="small" @click="onTestConnect(row)">测连</ReButton>
        <ReButton v-if="row.serverHostSshEnabled === 1" show-text icon="Search" type="warning" size="small" @click="onScanPorts(row)">扫端口</ReButton>
        <ReButton show-text icon="Edit" size="small" @click="openEdit(row)">编辑</ReButton>
        <ReButton show-text icon="MoreFilled" size="small" @click="openConfig(row)">更多</ReButton>
        <ReButton show-text icon="Delete" type="danger" size="small" @click="onDelete(row)">删除</ReButton>
      </div>
    </div>
  </div>

  <div v-if="!hosts.length && !loading" class="empty-state">
    <ReEmpty description="暂无主机，点击右上角「新增主机」添加" />
  </div>

  <!-- 对话框保持不变 -->
  <ScHostFormDialog v-model="formVisible" :host="editingHost" @submit="onSubmitForm" />
  <ScConnectDialog v-model="connectVisible" :host="connectingHost" :identities="identities" @connect="onConnect" />
  <ScGuacViewer :connection="guacConnection" @close="guacConnection = null" />
  <ReDrawer v-model="sftpVisible" title="SFTP 文件管理" :size="'60%'" direction="rtl" :footer-hidden="true" close-only>
    <template #content><ScSftpPanel :host-id="sftpHostId" /></template>
  </ReDrawer>
  <ReDialog v-model="configVisible" layout="modern" compact :title="`主机配置 - ${configHost?.serverHostName || ''}`" width="520" ok-text="保存" cancel-text="取消" :confirm-loading="cfgSaving" :footer-hidden="false" @confirm="onSaveConfig" @cancel="configVisible = false">
    <ReForm label-position="left" label-width="130px" class="cfg-form">
      <ReDivider content-position="left">在离线检测</ReDivider>
      <ReFormItem label="启用自动检测"><ReSwitch v-model="cfgForm.serverHostOnlineEnabled" :active-value="1" :inactive-value="0" /></ReFormItem>
      <ReFormItem label="检测间隔(秒)"><ReInputNumber v-model="cfgForm.serverHostOnlineInterval" :min="5" :max="86400" style="width: 180px" /></ReFormItem>
      <ReDivider content-position="left">指标采集</ReDivider>
      <ReFormItem label="启用采集"><ReSwitch v-model="cfgForm.serverHostCollectEnabled" :active-value="1" :inactive-value="0" /></ReFormItem>
      <ReFormItem label="采集方式"><ReSelect v-model="cfgForm.serverHostCollectMode" :data="collectModeOptions" style="width: 220px" /></ReFormItem>
      <ReFormItem v-if="cfgForm.serverHostCollectMode === 'PROMETHEUS'" label="Prometheus">
        <div class="prom-actions">
          <ReButton type="primary" :loading="promTestLoading" @click="onTestPrometheus">凭据校验</ReButton>
          <a v-if="promPkgUrl" class="prom-dl" :href="promPkgUrl" target="_blank" rel="noopener">下载 Prometheus 包</a>
          <span v-else class="prom-tip">未配置安装包下载地址（系统配置 → Prometheus → 安装包下载地址）</span>
        </div>
      </ReFormItem>
      <ReFormItem label="采集间隔(秒)"><ReInputNumber v-model="cfgForm.serverHostCollectInterval" :min="10" :max="86400" style="width: 180px" /></ReFormItem>
      <ReDivider content-position="left">延迟检测</ReDivider>
      <ReFormItem label="启用延迟检测"><ReSwitch v-model="cfgForm.serverHostDelayEnabled" :active-value="1" :inactive-value="0" /></ReFormItem>
      <ReFormItem label="检测间隔(秒)"><ReInputNumber v-model="cfgForm.serverHostDelayInterval" :min="5" :max="86400" style="width: 180px" /></ReFormItem>
    </ReForm>
  </ReDialog>
  <ScHostDetail v-model="detailVisible" :host="detailHost" @updated="refresh" />
</div>
</template>

<style scoped lang="scss">
.host-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.stat-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 6px;
}
.stat-trend {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.stat-trend.is-up { color: var(--status-success); }
.stat-trend.is-down { color: var(--status-error); }

/* ===== 筛选工具条 ===== */
.page-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===== 批量操作条 ===== */
.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: color-mix(in srgb, var(--brand-500) 6%, transparent);
  border-radius: var(--radius-lg);
  border: 1px solid color-mix(in srgb, var(--brand-500) 15%, transparent);
  animation: batch-in 0.2s var(--ease-out) both;
}
.batch-info {
  font-size: 12px;
  color: var(--brand-500);
  font-weight: 600;
  margin-right: 8px;
}
@keyframes batch-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}

/* ===== 主机卡片网格 ===== */
.host-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.host-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  border-left: 3px solid var(--status-color, var(--status-success));
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out), border-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.host-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--border-default);
}
.host-card.is-offline {
  opacity: 0.65;
  border-left-color: var(--pulse-offline);
}
.host-card.is-unknown {
  border-left-color: var(--pulse-unknown);
}

.host-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.host-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.host-addr {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ===== 迷你环图 ===== */
.host-card__metrics {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mini-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: conic-gradient(var(--ring-color) var(--pct), var(--bg-fill) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.3s var(--ease-out);
}
.mini-ring__val {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.metric-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  color: var(--text-tertiary);
  font-weight: 500;
}

/* ===== 标签 & 端口 ===== */
.host-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 20px;
}
.no-tags {
  font-size: 11px;
  color: var(--text-tertiary);
  font-style: italic;
}
.host-card__ports {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-height: 20px;
}
.ports-empty {
  font-size: 11px;
  color: var(--text-tertiary);
}
.port-chip {
  font-size: 11px !important;
  border-radius: var(--radius-sm) !important;
}

/* ===== 卡片底部 ===== */
.host-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}
.host-group {
  font-weight: 500;
  color: var(--text-secondary);
}
.host-delay {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.host-delay.is-down { color: var(--status-error); }

/* ===== 操作按钮组 ===== */
.host-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 4px;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

/* ===== 延迟色 ===== */
.delay-cell {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  &.is-fast { color: var(--status-success); font-weight: 500; }
  &.is-slow { color: var(--status-warning); }
  &.is-down { color: var(--status-error); font-weight: 500; }
  &.is-info { color: var(--text-tertiary); }
}

/* ===== 旧 mini-bar（保留兼容） ===== */
.mini-bar-wrap { display: flex; align-items: center; gap: 6px; }
.mini-bar { width: 48px; height: 4px; background: var(--bg-fill); border-radius: 2px; overflow: hidden; }
.mini-bar__fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
.mini-bar__val { font-size: 11px; font-variant-numeric: tabular-nums; min-width: 30px; }

/* ===== 配置表单 ===== */
.cfg-form :deep(.el-form-item) { margin-bottom: 14px; }
.prom-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.prom-dl { font-size: 13px; color: var(--brand-500); text-decoration: none; }
.prom-dl:hover { text-decoration: underline; }
.prom-dl:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-sm); }
.prom-tip { font-size: 12px; color: var(--text-tertiary); }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .host-grid { grid-template-columns: 1fr; }
  .host-card__metrics { gap: 8px; }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .batch-bar, .host-card, .stat-card { animation: none; transition: none; }
}
</style>
