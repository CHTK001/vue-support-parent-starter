<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * <p>版式：<b>左服务列表 / 右 Tab 工作区</b> 双栏（没有常驻第三栏）。</p>
 * <ul>
 *   <li><b>左栏</b>：服务索引。ReTable 后端分页（{@code GET /server/page}），
 *       单行自定义列承载状态点 / 名称 / 协议·端口 / 过滤器数；右键弹出该服务的动作菜单。</li>
 *   <li><b>右键「配置 ▸」二级菜单</b>：列出<b>该服务实际挂载</b>的 ServerFilter
 *       （来自行数据 {@code filters[]}），点一个就在右侧开一个该过滤器的配置 Tab。</li>
 *   <li><b>右栏</b>：ReTabs 多标签工作区。固定一个「概览」Tab（{@link ScServerDetailDrawer}
 *       的 detail 视图），其余是按需打开的「过滤器配置」Tab（embedded 的 filter 视图）。</li>
 * </ul>
 *
 * <p><b>每个 ServerFilter 的 UI 不是换色</b>：{@link ScFilterConfigPanel} 按
 * {@code components/filters} 注册表分派 —— file-storage 分区开关墙 / service-discovery
 * 路由表 / firewall·ip 名单与限流 / 映射表 / 通用 schema 表单，字段全部来自
 * {@code /server/filters} 下发的 params schema。参数热更新走
 * {@code POST /filters/{i}/params}，由抽屉动作层统一发起，服务不中断。</p>
 *
 * <p><b>真实链路保持不变</b>：取数与启停删改仍只走 {@link useServiceNodes} 门面；
 * 详情 / 配置的所有动作（启停重启、插件热启停、参数热更新、移除插件、复制地址、
 * 深度查看）仍由 {@link ScServerDetailDrawer} 的 embedded 模式承担，本页面只做
 * 「索引 → 页签」的编排，不重造动作层。保留 `/server/page`、`/server/summary`、
 * 4 张统计卡、自动刷新与降级提示、P2P 房间深链、操作日志。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { message } from '@repo/core';
import { useRoute } from 'vue-router';
import ReButton from '@repo/ui/re-button';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import ReDrawer from '@repo/ui/re-drawer';
import ReDialog from '@repo/ui/re-dialog';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn, ReTableContextMenuItem, ReTableContextMenuContext } from '@repo/ui/re-table';
import ReTabs from '@repo/ui/re-tabs';
import type { ReTabsContextItem, ReTabsItem } from '@repo/ui/re-tabs';
import { RoomView } from '@pages/room';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerDetailDrawer from '../components/ScServerDetailDrawer.vue';
import ScServerOperLogPanel from '../components/ScServerOperLogPanel.vue';
import { normalizeFilterType, hasDedicatedFilterPanel } from '../components/filters';
import { copyText } from '../utils/clipboard';
import { deriveStatusMeta } from '../utils/nodeList';
import { listServerNodes, type ServerNodeView, type ServerFilterDescriptor } from '../api';
import { useServiceNodes } from './service/useServiceNodes';

const vm = useServiceNodes();
const route = useRoute();

/* ==================== 左栏：服务列表（ReTable 后端分页） ==================== */

/** ReTable 实例：动作后重取当前页 */
const tableRef = ref<{ reload?: () => Promise<unknown> } | null>(null);

/** 搜索框生效值：输入 320ms 后才进查询条件，避免每敲一个字打一次请求 */
const appliedKeyword = ref('');
/** 搜索防抖计时器 */
let keywordTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => vm.keyword,
  value => {
    if (keywordTimer) clearTimeout(keywordTimer);
    keywordTimer = setTimeout(() => {
      appliedKeyword.value = value.trim();
      keywordTimer = null;
    }, 320);
  },
);

/** 表格查询条件（ReTable 监听它并回到第 1 页重取；page / pageSize 由组件写回） */
const tableParams = computed(() => ({
  keyword: appliedKeyword.value,
  protocol: vm.protocol,
  status: vm.status,
  sort: vm.sort,
}));

const sortOptions = [
  { label: '排序：名称', value: 'name' },
  { label: '排序：端口', value: 'port' },
  { label: '排序：状态', value: 'status' },
];

/**
 * 左栏单行：一个自定义列吃掉整宽，表头隐藏。
 *
 * <p>用 ReTable 而非手写列表，是为了继续吃它成熟的后端分页 / 自动刷新 / 右键菜单
 * 定位能力；单列 + {@code showHeader:false} + {@code compact} 让它在窄左栏里看起来
 * 就是一行行服务卡，不带表格感。</p>
 */
const columns = computed<ReTableColumn[]>(() => [
  { prop: 'svc', label: '服务', slot: 'svc', showOverflowTooltip: false },
]);

/** 行还原成节点视图 */
function rowOf(row: Record<string, unknown>): ServerNodeView {
  return row as unknown as ServerNodeView;
}

function listenText(node: ServerNodeView): string {
  return `${node.host || '0.0.0.0'}:${node.port ?? '-'}`;
}

function backendText(node: ServerNodeView): string {
  const config = node.config || {};
  const host = config.backendHost ?? config.host;
  const port = config.backendPort ?? config.port;
  return host && port ? `${host}:${port}` : '';
}

function endpointText(node: ServerNodeView): string {
  return node.serverUrl || backendText(node) || '-';
}

function statusDotClass(node: ServerNodeView): string {
  const tone = deriveStatusMeta(node).tone;
  return tone === 'success' ? 'is-run' : tone === 'danger' ? 'is-err' : 'is-stop';
}

function isRoomNode(node: ServerNodeView): boolean {
  return String(node.protocol || '').trim().toLowerCase() === 'room';
}

/** 当前在左栏高亮（= 右栏概览对应的服务） */
const selectedId = ref<number | null>(null);

/** 左键点行：切到 / 打开该服务的概览 Tab */
function onRowClick(row: Record<string, unknown>): void {
  const node = rowOf(row);
  selectedId.value = node.id;
  openOverview(node);
}

/* ==================== 右栏：ReTabs 工作区 ==================== */

/** 页签业务类型（比 ReTabsItem 多带服务 / 过滤器上下文） */
type TabKind = 'overview' | 'filter';
interface ServiceTab extends ReTabsItem {
  kind: TabKind;
  nodeId: number;
  nodeName: string;
  /** kind=filter 时：该过滤器在链上的下标（提交参数用） */
  filterIndex?: number;
  /** kind=filter 时：过滤器展示名 / 类型 */
  filterName?: string;
  filterType?: string;
}

/** 页签名：概览按服务、配置按「服务 + 过滤器下标」去重 */
function overviewTabName(nodeId: number): string {
  return `svc:${nodeId}:overview`;
}
function filterTabName(nodeId: number, index: number): string {
  return `svc:${nodeId}:filter:${index}`;
}

const openTabs = ref<ServiceTab[]>([]);
const activeTab = ref('');

/** 插件类型的中文短名 / 图标（菜单与页签共用，来源仍是后端 type） */
const FILTER_META: Record<string, { label: string; icon: string }> = {
  'file-storage': { label: '文件存储', icon: 'FolderOpened' },
  firewall: { label: '防火墙', icon: 'Lock' },
  ip: { label: 'IP 名单', icon: 'Filter' },
  'service-discovery': { label: '服务发现', icon: 'Connection' },
  'url-mapping': { label: 'URL 映射', icon: 'Link' },
  'URL-MAPPING': { label: 'URL 映射', icon: 'Link' },
  'shell-url-mapping': { label: 'Shell 映射', icon: 'Link' },
  'SHELL-URL-MAPPING': { label: 'Shell 映射', icon: 'Link' },
};

/** 过滤器在菜单 / 页签里的展示名 */
function filterLabel(f: ServerFilterDescriptor, index: number): string {
  const t = normalizeFilterType(f.type || f.name);
  return f.name || FILTER_META[t]?.label || t || `过滤器 ${index + 1}`;
}

/** 过滤器分组说明（二级菜单右侧提示） */
function filterHint(f: ServerFilterDescriptor): string {
  const t = normalizeFilterType(f.type || f.name);
  const count = Object.keys(f.params || {}).length;
  const dedicated = hasDedicatedFilterPanel(t) ? '专属界面' : '通用界面';
  return `${t || 'custom'} · ${count} 参 · ${dedicated}`;
}

/**
 * 打开 / 切到「概览」Tab。
 *
 * @param node 目标服务
 */
function openOverview(node: ServerNodeView): void {
  const name = overviewTabName(node.id);
  const exist = openTabs.value.find(t => t.name === name);
  if (exist) {
    activeTab.value = name;
    return;
  }
  openTabs.value = [
    ...openTabs.value,
    {
      name,
      kind: 'overview',
      nodeId: node.id,
      nodeName: node.name,
      label: node.name,
      hint: '概览',
      icon: 'Monitor',
      closable: false, // 概览是工作区常驻底页，不关
    } as ServiceTab,
  ];
  activeTab.value = name;
}

/**
 * 打开 / 切到某个 ServerFilter 的「配置」Tab。
 *
 * <p>右键「配置 ▸」的子项都落到这里；同名（同服务 + 同过滤器下标）只开一次，
 * 重复点是切过去而不是开副本。</p>
 *
 * @param node   目标服务
 * @param index  过滤器下标
 * @param filter 过滤器描述（来自 /server/page 行数据）
 */
function openFilterTab(node: ServerNodeView, index: number, filter: ServerFilterDescriptor): void {
  const name = filterTabName(node.id, index);
  const exist = openTabs.value.find(t => t.name === name);
  if (exist) {
    activeTab.value = name;
    return;
  }
  const t = normalizeFilterType(filter.type || filter.name);
  openTabs.value = [
    ...openTabs.value,
    {
      name,
      kind: 'filter',
      nodeId: node.id,
      nodeName: node.name,
      filterIndex: index,
      filterName: filterLabel(filter, index),
      filterType: filter.type || filter.name || '',
      label: node.name,
      hint: `配置 · ${filterLabel(filter, index)}`,
      icon: FILTER_META[t]?.icon || 'Setting',
      closable: true,
    } as ServiceTab,
  ];
  activeTab.value = name;
}

/** 关闭单个页签（概览不可关） */
function closeTab(name: string): void {
  const idx = openTabs.value.findIndex(t => t.name === name);
  if (idx < 0 || !openTabs.value[idx].closable) return;
  const rest = openTabs.value.filter(t => t.name !== name);
  openTabs.value = rest;
  if (activeTab.value === name) {
    activeTab.value = rest[Math.max(0, idx - 1)]?.name ?? '';
  }
}

/** 关闭全部：保留每个服务的概览底页？——按「清空」处理，回到空态引导 */
function closeAllTabs(): void {
  openTabs.value = openTabs.value.filter(t => t.kind === 'overview');
  activeTab.value = openTabs.value[0]?.name ?? '';
}

/** 页签右键菜单 */
const tabContextMenu = computed<ReTabsContextItem[]>(() => [
  { key: 'close', label: '关闭当前页签', icon: 'Close' },
  { key: 'close-others', label: '关闭其它配置', icon: 'CircleClose', disabled: openTabs.value.filter(t => t.kind === 'filter').length <= 1 },
  { key: 'close-all', label: '关闭全部配置', icon: 'Delete', divided: true, danger: true },
]);

function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
  const name = payload.tab.name;
  if (payload.key === 'close') closeTab(name);
  else if (payload.key === 'close-others') {
    openTabs.value = openTabs.value.filter(t => t.kind === 'overview' || t.name === name);
    activeTab.value = name;
  } else if (payload.key === 'close-all') closeAllTabs();
}

/** 服务被删除后，把它名下的所有页签一起摘掉，避免残留指向已删节点 */
function dropTabsOf(nodeId: number): void {
  const rest = openTabs.value.filter(t => t.nodeId !== nodeId);
  if (rest.length === openTabs.value.length) return;
  openTabs.value = rest;
  if (!rest.some(t => t.name === activeTab.value)) activeTab.value = rest[rest.length - 1]?.name ?? '';
}

/* ==================== 左栏右键菜单（含「配置 ▸」二级菜单） ==================== */

/** 主操作：运行中的能停，异常的给重启，其余能启 */
type PrimaryAction = 'start' | 'stop' | 'restart';
function primaryActionOf(node: ServerNodeView): PrimaryAction {
  if (node.status === 'RUNNING') return 'stop';
  if (node.status === 'ERROR') return 'restart';
  return 'start';
}
function primaryLabelOf(node: ServerNodeView): string {
  const a = primaryActionOf(node);
  return a === 'stop' ? '停止服务' : a === 'restart' ? '重启服务' : '启动服务';
}
function runPrimary(node: ServerNodeView): void {
  const a = primaryActionOf(node);
  if (a === 'stop') void vm.stop(node);
  else if (a === 'restart') void vm.restart(node);
  else void vm.start(node);
}

/** 操作日志弹框状态 */
const operLogVisible = ref(false);
const operLogNode = ref<{ id: number; name: string } | null>(null);

async function copyCardText(text: string, ok: string): Promise<void> {
  const copied = await copyText(text);
  if (copied) message.success(ok);
  else message.warning('复制失败，请手动复制');
}

function openOperLog(node: ServerNodeView): void {
  if (!node.id) {
    message.warning('该服务还未保存，暂无可查询的操作日志');
    return;
  }
  operLogNode.value = { id: node.id, name: node.name };
  operLogVisible.value = true;
}

/** P2P 房间抽屉 */
const roomVisible = ref(false);
const roomId = ref('');
const roomServerUrl = ref('');

function openRoom(node: ServerNodeView): void {
  if (node.status !== 'RUNNING') {
    message.warning(`房间节点「${node.name}」未运行，请先启动`);
    return;
  }
  if (!node.serverUrl) {
    message.warning('房间节点没有可用地址（检查监听地址与端口）');
    return;
  }
  roomId.value = '';
  roomServerUrl.value = node.serverUrl;
  roomVisible.value = true;
}

/**
 * 右键菜单命令前缀，用 key 编码「目标 + 动作」：
 *   - 顶层动作：{@code act:<cmd>}
 *   - 配置子项：{@code cfg:<index>}
 * 动态生成函数拿到当次右键的行，所以「配置 ▸」里永远是<b>这台服务</b>挂的过滤器。
 */
function buildContextMenu(ctx: ReTableContextMenuContext): ReTableContextMenuItem[] {
  const node = rowOf(ctx.row);
  const items: ReTableContextMenuItem[] = [
    { key: 'act:primary', label: primaryLabelOf(node), icon: primaryActionOf(node) === 'stop' ? 'VideoPause' : 'VideoPlay' },
    { key: 'act:restart', label: '重启服务', icon: 'RefreshRight' },
    { key: 'act:edit', label: '编辑节点', icon: 'EditPen' },
    { key: 'act:oper-log', label: '操作日志', icon: 'Document' },
    { key: 'act:clone', label: '克隆服务', icon: 'CopyDocument' },
  ];
  if (isRoomNode(node)) {
    items.push({ key: 'act:room', label: 'P2P 房间', icon: 'Share' });
  }
  items.push(
    { key: 'act:copy-name', label: '复制名称', icon: 'DocumentCopy', divided: true },
    { key: 'act:copy-listen', label: '复制监听地址', icon: 'DocumentCopy' },
    { key: 'act:copy-url', label: '复制访问地址', icon: 'DocumentCopy', disabled: !node.serverUrl },
  );

  // 「配置 ▸」二级菜单：逐条列出该服务实际挂载的 ServerFilter
  const filters = node.filters ?? [];
  const configChildren: ReTableContextMenuItem[] = filters.length
    ? filters.map((f, i) => ({
        key: `cfg:${i}`,
        label: `${filterLabel(f, i)}  ·  ${filterHint(f)}`,
        icon: FILTER_META[normalizeFilterType(f.type || f.name)]?.icon || 'Setting',
      }))
    : [{ key: 'cfg:none', label: '该服务未挂载过滤器', disabled: true }];

  items.push({
    key: 'config',
    label: '配置',
    icon: 'Setting',
    divided: true,
    children: configChildren,
  });
  items.push({ key: 'act:delete', label: '删除服务', icon: 'Delete', danger: true, divided: true });
  return items;
}

/** 右键命令分发 */
function onContextMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  const node = rowOf(ctx.row);
  const key = item.key;

  if (key.startsWith('cfg:')) {
    const index = Number(key.slice(4));
    const filter = node.filters?.[index];
    if (Number.isNaN(index) || !filter) return;
    openFilterTab(node, index, filter);
    return;
  }

  const cmd = key.startsWith('act:') ? key.slice(4) : key;
  switch (cmd) {
    case 'primary':
      runPrimary(node);
      break;
    case 'restart':
      void vm.restart(node);
      break;
    case 'edit':
      vm.openEdit(node);
      break;
    case 'oper-log':
      openOperLog(node);
      break;
    case 'clone':
      vm.openClone(node);
      break;
    case 'room':
      openRoom(node);
      break;
    case 'copy-name':
      void copyCardText(node.name, '服务名称已复制');
      break;
    case 'copy-listen':
      void copyCardText(listenText(node), '监听地址已复制');
      break;
    case 'copy-url':
      if (node.serverUrl) void copyCardText(node.serverUrl, '访问地址已复制');
      else message.info('该服务没有访问地址');
      break;
    case 'delete': {
      // 只有真正删成功才摘页签：vm.remove 内含确认框，取消时不会刷新、total 不变。
      // 若像早年那样在点击处无条件 dropTabsOf，用户点「取消」也会丢掉正在调的配置页。
      const totalBefore = vm.summary.total;
      void vm.remove(node).then(() => {
        if (vm.summary.total < totalBefore) {
          dropTabsOf(node.id);
          if (selectedId.value === node.id) selectedId.value = null;
        }
      });
      break;
    }
    default:
      break;
  }
}

/* ==================== 展示口径 ==================== */

const runningPct = computed(() => {
  const total = vm.summary.total;
  return total ? Math.round((vm.summary.running / total) * 100) : 0;
});
const protocolKinds = computed(() => vm.protocolOptions.length);

/** 状态筛选胶囊（左栏顶部，全量口径来自 /server/summary） */
const statusFilters = computed(() => [
  { value: '' as const, label: '全部', count: vm.statusCounts.all, tone: 'is-all' },
  { value: 'RUNNING' as const, label: '运行', count: vm.statusCounts.running, tone: 'is-run' },
  { value: 'ERROR' as const, label: '异常', count: vm.statusCounts.error, tone: 'is-err' },
  { value: 'STOPPED' as const, label: '停止', count: vm.statusCounts.stopped, tone: 'is-stop' },
]);

/* ==================== P2P 深链 ==================== */

let deepLinkHandled = false;
async function openDeepLinkRoom(): Promise<void> {
  const id = String(route.query.roomId ?? '');
  if (!id || deepLinkHandled) return;
  deepLinkHandled = true;
  try {
    const nodes = await listServerNodes();
    const rooms = nodes.filter(isRoomNode);
    const running = rooms.find(node => node.status === 'RUNNING' && !!node.serverUrl);
    if (!running?.serverUrl) {
      message.warning(
        rooms.length
          ? '房间节点未运行：先启动 ROOM 节点'
          : '还没有 ROOM 房间节点：先新建一个协议为 room 的服务',
      );
      return;
    }
    roomId.value = id;
    roomServerUrl.value = running.serverUrl;
    roomVisible.value = true;
  } catch (e) {
    message.error(e instanceof Error ? e.message : '读取 ROOM 节点失败，无法直接进房间');
  }
}

/* ==================== 生命周期 ==================== */

onMounted(() => {
  vm.setRowRefresher(() => {
    void tableRef.value?.reload?.();
  });
  void openDeepLinkRoom();
});

onUnmounted(() => {
  vm.setRowRefresher(null);
  if (keywordTimer) clearTimeout(keywordTimer);
});

function reloadAll(): void {
  void vm.refresh();
}

/** 抽屉动作（启停 / 热更新 / 移除插件）后：刷新摘要 + 当前页 */
function onChanged(): void {
  void vm.refresh();
}

/** 按页签名回查业务字段（ReTabsItem 回传的对象不带 nodeId / filterIndex） */
function tabCtx(name: string): ServiceTab | undefined {
  return openTabs.value.find(t => t.name === name);
}
</script>

<template>
  <div class="svm">
    <!-- 降级提示：协议或插件元数据失败时必须出声 -->
    <el-alert
      v-if="vm.notice.show"
      :type="vm.notice.tone"
      :title="vm.notice.text"
      show-icon
      :closable="false"
      class="svm-notice"
    />

    <!-- ============ 第一行：四张统计卡（全量口径，来自 /server/summary） ============ -->
    <section class="svm-stats">
      <article class="svm-stat">
        <i class="svm-stat__accent is-all" aria-hidden="true" />
        <header><span>服务总数</span><b>{{ vm.summary.total }}</b></header>
        <p>{{ protocolKinds }} 种协议</p>
      </article>
      <article class="svm-stat">
        <i class="svm-stat__accent is-run" aria-hidden="true" />
        <header><span>运行中</span><b>{{ vm.summary.running }}</b></header>
        <p>运行占比 {{ runningPct }}%</p>
      </article>
      <article class="svm-stat">
        <i class="svm-stat__accent is-err" aria-hidden="true" />
        <header><span>异常</span><b>{{ vm.summary.error }}</b></header>
        <p>{{ vm.summary.error ? '需要重启排障' : '当前无异常' }}</p>
      </article>
      <article class="svm-stat">
        <i class="svm-stat__accent is-stop" aria-hidden="true" />
        <header><span>已停止</span><b>{{ vm.summary.stopped }}</b></header>
        <p>{{ vm.summary.plugins }} 个过滤器可用</p>
      </article>
    </section>

    <!-- ============ 主体：左服务列表 / 右 Tab 工作区 ============ -->
    <div class="svm-body">
      <!-- 左栏：服务索引 -->
      <aside class="svm-rail">
        <div class="svm-rail__head">
          <span class="svm-rail__title">服务 <em>{{ vm.summary.total }}</em></span>
          <ReButton layout="square" type="primary" icon="Plus" tip="新建服务" @click="vm.openCreate()" />
          <ReButton layout="square" icon="Refresh" tip="刷新" :loading="vm.loading" @click="reloadAll" />
        </div>

        <!-- 工具条：搜索 + 下拉（单行，先压搜索框） -->
        <div class="svm-tools">
          <div class="svm-search">
            <ReInput v-model="vm.keyword" placeholder="名称 / 端口 / 后端 / 报错" clearable />
          </div>
          <ReSelect v-model="vm.protocol" class="svm-pick" placeholder="全部协议" :data="vm.protocolOptions" clearable />
          <ReSelect v-model="vm.sort" class="svm-pick svm-pick--sort" :data="sortOptions" />
          <ReButton v-if="vm.filtered" layout="square" icon="RefreshLeft" tip="清空筛选" @click="vm.resetFilters()" />
        </div>

        <!-- 状态筛选胶囊 -->
        <div class="svm-filters">
          <button
            v-for="item in statusFilters"
            :key="item.value || 'all'"
            type="button"
            class="svm-filter"
            :class="{ on: vm.status === item.value }"
            @click="vm.status = item.value"
          >
            <i class="svm-kpi__dot" :class="item.tone" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <b>{{ item.count }}</b>
          </button>
        </div>

        <!-- 服务列表：ReTable 后端分页 + 右键动态菜单（含「配置 ▸」二级菜单） -->
        <div class="svm-list">
          <ReTable
            ref="tableRef"
            :loader="vm.loadPage"
            :params="tableParams"
            :columns="columns"
            :context-menu="buildContextMenu"
            :settings="{ highlightCurrentRow: true, compact: true }"
            :config="{ toolbar: { enable: false }, search: false, pagination: { pageSize: 20 } }"
            :layout-table="{ showHeader: false, fill: true }"
            row-key="id"
            empty-text="没有命中条件的服务"
            :border="false"
            @row-click="onRowClick"
            @context-menu-select="onContextMenuSelect"
          >
            <template #col-svc="{ row }">
              <div class="svc-row" :class="{ 'is-sel': selectedId === rowOf(row).id }">
                <i class="svm-kpi__dot" :class="statusDotClass(rowOf(row))" aria-hidden="true" />
                <div class="svc-row__main">
                  <div class="svc-row__line">
                    <b class="svc-row__name" :title="rowOf(row).name">{{ rowOf(row).name }}</b>
                    <span class="svc-row__fc" :title="`${rowOf(row).filters?.length ?? 0} 个过滤器`">
                      {{ rowOf(row).filters?.length ?? 0 }}
                    </span>
                  </div>
                  <div class="svc-row__sub">
                    <span>{{ rowOf(row).protocolDesc || rowOf(row).protocol }}</span>
                    <i>·</i>
                    <span class="svm-mono">{{ listenText(rowOf(row)) }}</span>
                  </div>
                  <div class="svc-row__ep svm-mono" :title="endpointText(rowOf(row))">
                    {{ endpointText(rowOf(row)) }}
                  </div>
                </div>
              </div>
            </template>
          </ReTable>
        </div>

        <div class="svm-rail__foot">
          <span class="kbd">右键</span> 服务 → <b>配置 ▸</b> 打开过滤器配置 Tab
        </div>
      </aside>

      <!-- 右栏：ReTabs 多标签工作区 -->
      <section class="svm-work">
        <ReTabs
          v-model="activeTab"
          :tabs="openTabs"
          closable
          show-close-all
          size="small"
          :context-menu="tabContextMenu"
          empty-text="左键点服务看概览；右键「配置 ▸」打开某个 ServerFilter 的配置界面"
          @close="closeTab"
          @close-all="closeAllTabs"
          @context-command="onTabCommand"
        >
          <template #default="{ tab }">
            <!-- 每个页签按 name 回查业务字段（ReTabsItem 不带这些上下文） -->
            <div class="svm-panel">
              <ScServerDetailDrawer
                v-if="tab.name"
                :key="tab.name"
                embedded
                :node-id="tabCtx(tab.name)?.nodeId ?? null"
                :filter-types="vm.filterTypes"
                :initial-view="tabCtx(tab.name)?.kind === 'filter' ? 'filter' : 'detail'"
                :initial-index="tabCtx(tab.name)?.filterIndex ?? 0"
                @changed="onChanged"
                @open-detail-page="vm.openDetailPage"
              />
            </div>
          </template>
        </ReTabs>
      </section>
    </div>

    <!-- 新增 / 编辑 / 克隆：表单抽屉 -->
    <ScServerFormDrawer
      v-model="vm.formVisible"
      :node="vm.editingNode?.id === 0 ? null : vm.editingNode"
      :protocols="vm.protocols"
      :filter-types="vm.filterTypes"
      :existing-names="vm.existingNames"
      :clone-source="vm.editingNode?.id === 0 ? vm.editingNode : null"
      @saved="vm.refresh()"
    />

    <!-- P2P 房间：关闭抽屉即卸载，RoomView 自己 leave 并断开 WebSocket -->
    <ReDrawer v-model="roomVisible" title="P2P 房间" :size="'88%'" :footer-hidden="true" close-only>
      <RoomView :room-id="roomId" :server-url="roomServerUrl" @leave="roomVisible = false" />
    </ReDrawer>

    <!-- 节点操作日志 -->
    <ReDialog
      v-model="operLogVisible"
      width="960px"
      :title="operLogNode ? `操作日志 · ${operLogNode.name}` : '操作日志'"
      :footer-hidden="true"
      destroy-on-close
    >
      <div class="svm-operlog">
        <ScServerOperLogPanel :node-id="operLogNode?.id ?? null" :node-name="operLogNode?.name" />
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* 双栏主体：左栏服务索引 / 右栏 ReTabs 工作区。
   页边距交给宿主（App 的 .main 已有 20/24），这里不叠 padding；段间 10px 与设备资产同档。 */
.svm {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: var(--bg-page);
}

.svm-notice {
  margin: 0;
}

/* ===== 第一行：四张统计卡 ===== */
.svm-stats {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.svm-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.18s var(--ease-out, ease);

  &:hover { box-shadow: var(--shadow-md); }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 11.5px;
    color: var(--text-secondary);

    b {
      font-size: 20px;
      font-weight: 600;
      line-height: 1.05;
      font-variant-numeric: tabular-nums;
      color: var(--text-primary);
    }
  }

  p {
    margin: 0;
    font-size: 11px;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.svm-stat__accent {
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--pulse-offline);
  &.is-all { background: var(--brand-500); }
  &.is-run { background: var(--pulse-online); }
  &.is-err { background: var(--pulse-alarm); }
}

.svm-body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 10px;
}

/* ===== 左栏：服务索引 ===== */
.svm-rail {
  flex: none;
  width: 268px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.svm-rail__head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);

  .svm-rail__title {
    flex: 1;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);

    em {
      font-style: normal;
      font-size: 11px;
      font-weight: 400;
      color: var(--text-tertiary);
      margin-left: 4px;
      font-variant-numeric: tabular-nums;
    }
  }
}

/* 工具条固定一行：不够先压搜索框，右侧按钮不换行 */
.svm-tools {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 6px;
  flex-wrap: nowrap;
}

.svm-search {
  flex: 1 1 90px;
  min-width: 0;
}

.svm-pick {
  flex: 0 1 96px;
  min-width: 82px;
}

.svm-pick--sort {
  flex: 0 1 104px;
  min-width: 94px;
}

/* 状态胶囊：等宽铺一行 */
.svm-filters {
  flex: none;
  display: flex;
  gap: 5px;
  padding: 0 8px 8px;
}

.svm-filter {
  flex: 1 1 0;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 2px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  font: inherit;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;

  b { font-variant-numeric: tabular-nums; color: var(--text-tertiary); }
  &:hover { background: var(--bg-fill); }
  &.on {
    background: var(--brand-50);
    border-color: var(--brand-100);
    color: var(--brand-600);
    font-weight: 600;
    b { color: var(--brand-600); }
  }
}

/* 列表吃满剩余高度；ReTable 内部自带滚动 */
.svm-list {
  flex: 1;
  min-height: 0;
  padding: 0 4px;
  border-top: 1px solid var(--border-subtle);
}

.svm-rail__foot {
  flex: none;
  padding: 7px 10px;
  border-top: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-tertiary);

  b { color: var(--brand-600); }
  .kbd {
    display: inline-block;
    border: 1px solid var(--border-default);
    border-bottom-width: 2px;
    border-radius: 4px;
    padding: 0 5px;
    background: var(--bg-container);
    font-size: 10px;
  }
}

/* 单行服务卡（ReTable 单列自定义插槽） */
.svc-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: context-menu;

  &:hover { background: var(--bg-fill); }
  &.is-sel {
    background: var(--brand-50);
    border-color: var(--brand-100);
  }
}

.svc-row__main {
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}

.svc-row__line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.svc-row__name {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svc-row__fc {
  flex: none;
  min-width: 18px;
  text-align: center;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--brand-600);
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
  border-radius: 5px;
  padding: 0 4px;
}

.svc-row__sub {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 1px;
  font-size: 11px;
  color: var(--text-tertiary);
  i { font-style: normal; }
}

.svc-row__ep {
  margin-top: 1px;
  font-size: 10.5px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.svm-mono {
  font-family: ui-monospace, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

/* 状态点（与统计卡同一套色） */
.svm-kpi__dot {
  flex: none;
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--pulse-offline);
  &.is-all { background: var(--brand-500); }
  &.is-run { background: var(--pulse-online); animation: svm-breathe 1.6s ease-in-out infinite; }
  &.is-err { background: var(--pulse-alarm); animation: svm-blink 0.8s step-start infinite; }
}

@keyframes svm-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(47, 191, 113, 0.35); }
  50% { box-shadow: 0 0 0 4px rgba(47, 191, 113, 0.12); }
}
@keyframes svm-blink { 50% { opacity: 0.35; } }

/* ===== 右栏：ReTabs 工作区 ===== */
.svm-work {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* 每个 Tab 的面板：嵌入抽屉自己带内边距与滚动，这里只给高度参照 */
.svm-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.svm-operlog {
  display: flex;
  flex-direction: column;
  height: 520px;
  min-height: 0;
}

/* ===== 窄屏 ===== */
@media (max-width: 900px) {
  .svm-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .svm-rail { width: 200px; }
  .svm-pick--sort { display: none; }
}
</style>
