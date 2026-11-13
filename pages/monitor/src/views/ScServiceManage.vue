<script setup lang="ts">
/**
 * 服务管理 —— 协议服务器节点（Server 接口 + ServerFilter 插件）
 *
 * 职责：Server 节点增删改查、启停与热更新、过滤器链编排（编辑抽屉）、
 * 运行态与链路查看（详情 / 过滤器链页签）。
 *
 * 界面形态（「资产管理」式三栏）：左侧按协议分组服务节点，中间是 ReTabs
 * 详情 / 过滤器链 / P2P 房间工作区，右侧是快捷操作、最近活动与统计。服务常常
 * 同时存在几十个，节点名 / 监听端口与状态灯必须在一屏可横扫；而排障时对同一个
 * 节点往往要「详情、链、再改参数」来回切换，工作区页签把这些上下文并排保住。
 *
 * <p>P2P 房间也是 Server 接口的一种能力，因此不单独占菜单：它在工作区里以
 * 页签打开（{@code kind === 'room'}），关闭页签即离开房间并断开 WebSocket。</p>
 *
 * 分层：
 *   - `service/serviceView.ts`     纯函数：后端行 → 展示对象（端口文本、链路、后端地址）
 *   - `service/useServiceNodes.ts` 取数与动作：状态、自动刷新、启停、抽屉开合
 *   - `service/service-kit.css`    与页面无关的原子样式（等宽数字、状态灯、右键菜单）
 *
 * 本页面只读 {@link ServiceNodesVm} 状态并调用 vm 动作，自己不算节点状态：
 * 过滤、统计、协议下拉的口径全在 vm 和 nodeList/serviceView 里单测锁定。
 */
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import { useRoute } from 'vue-router';
import type { ReTabsContextItem, ReTabsItem } from '@repo/ui/re-tabs';
import ReDialog from '@repo/ui/re-dialog';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerOperLogPanel from '../components/ScServerOperLogPanel.vue';
import { useServiceNodes } from './service/useServiceNodes';
import {
  primaryActionOf,
  stateClassOf,
  type ServiceNodeCard,
} from './service/serviceView';
import type { ServerNodeView } from '../api';
import { copyText } from '../utils/clipboard';
import ShellRack from './service/shell/ShellRack.vue';
import type {
  ActivityItem,
  NodeSort,
  SvcShellContext,
  StatusTab,
  WorkKind,
  WorkTab,
} from './service/shell/context';
import './service/service-kit.css';

const vm = useServiceNodes();
const route = useRoute();

/** 分布条的悬停说明：分布图没有刻度，悬停要能读到准确数字 */
const distTitle = computed(
  () => `运行 ${vm.statusCounts.running} · 异常 ${vm.statusCounts.error} · 已停止 ${vm.statusCounts.stopped}`,
);

/** 左轨的状态分组 */
const statusTabs = computed<StatusTab[]>(() => [
  { label: '全部', value: '', count: vm.statusCounts.all, dot: '' },
  { label: '运行中', value: 'RUNNING', count: vm.statusCounts.running, dot: 'is-run' },
  { label: '异常', value: 'ERROR', count: vm.statusCounts.error, dot: 'is-err' },
  { label: '已停止', value: 'STOPPED', count: vm.statusCounts.stopped, dot: 'is-stop' },
]);

/* ==================== 工作区页签 ==================== */

/** 房间页签固定 name（同一时刻只保留一个房间工作台） */
const ROOM_TAB = 'room';

/** 已打开的页签 */
const openTabs = ref<WorkTab[]>([]);
/** 当前激活页签 name */
const activeTab = ref('');
/** 页签刷新代次：作为子组件 key 的一部分，变化即重建内容 */
const tabReloadSeq = reactive<Record<string, number>>({});

/**
 * 取某个页签当前的刷新代次（未刷新过为 0）。
 *
 * @param name 页签 name
 */
function reloadSeqOf(name: string): number {
  return tabReloadSeq[name] ?? 0;
}

/** 按页签 name 回查工作区页签（ReTabs 回传的 tab 不含 nodeId） */
function workTabOf(name: string): WorkTab | undefined {
  return openTabs.value.find(tab => tab.name === name);
}

/** 页签展示类型：模板里 ReTabsItem 没有 kind，回查一次 */
function kindOf(tab: ReTabsItem): WorkKind | undefined {
  return workTabOf(tab.name)?.kind;
}

/** 页签所属节点 id：模板回查时兜底 null */
function nodeIdOf(tab: ReTabsItem): number | null {
  return workTabOf(tab.name)?.nodeId ?? null;
}

/** 房间页签要加入的房间号 */
function roomIdOf(tab: ReTabsItem): string {
  return workTabOf(tab.name)?.roomId ?? '';
}

/** 房间页签指向的信令节点地址（空则宿主同端口） */
function serverUrlOf(tab: ReTabsItem): string {
  return workTabOf(tab.name)?.serverUrl ?? '';
}

/** 是否为 P2P 房间协议节点（协议编码可能是 ROOM / room） */
function isRoomCard(card: ServiceNodeCard): boolean {
  const code = String(card.protocolCode || '').trim().toLowerCase();
  return code === 'room';
}

/** 找一个运行中、且有可连接地址的 ROOM 节点 */
function findRunningRoom(): ServiceNodeCard | undefined {
  return vm.cards.filter(isRoomCard).find(card => card.status === 'RUNNING' && !!card.url);
}

/** 优先取运行中的 ROOM 节点地址；没有可用的返回空串 */
function resolveRoomUrl(): string {
  return findRunningRoom()?.url ?? '';
}

/** 房间页签标题：带节点名时标出「房间在哪个信令节点上」 */
function roomLabel(roomId: string, nodeName?: string): string {
  const parts = ['P2P 房间'];
  if (roomId) parts.push(roomId);
  if (nodeName) parts.push(`@${nodeName}`);
  return parts.join(' ');
}

/** 节点状态 → ReTabs 状态点 */
function tabStatusOf(card: ServiceNodeCard | undefined): 'online' | 'offline' | 'alarm' | 'unknown' | null {
  if (!card) return null;
  if (card.status === 'RUNNING') return 'online';
  if (card.status === 'ERROR') return 'alarm';
  return 'offline';
}

/**
 * 打开一个功能页签。
 *
 * <p>同一个「节点 + 功能」只开一次：重复点同一个动作是切过去，不是再开副本。
 * 页签名 `${nodeId}:${kind}` 由节点和功能共同构成，详情与过滤器链互不冲突。</p>
 *
 * @param card 目标节点卡片
 * @param kind 功能类型
 */
function openTab(card: ServiceNodeCard, kind: Exclude<WorkKind, 'room'>): void {
  const name = `${card.id}:${kind}`;
  const exist = openTabs.value.find(tab => tab.name === name);
  if (exist) {
    activeTab.value = name;
    return;
  }
  const meta = kind === 'detail'
    ? { label: '详情', icon: 'View' }
    : { label: '过滤器链', icon: 'Filter' };
  const tab: WorkTab = {
    name,
    nodeId: card.id,
    kind,
    label: card.name,
    hint: meta.label,
    icon: meta.icon,
    status: tabStatusOf(card),
    closable: true,
  };
  openTabs.value = [...openTabs.value, tab];
  activeTab.value = name;
  pushActivity(`打开 ${card.name} · ${meta.label}`, meta.icon, card.id);
}

/**
 * 打开 P2P 房间工作区页签。
 *
 * <p>房间是 Server 接口的一种能力，所以入口在实际的服务管理页里而不是菜单：
 * 同一个房间工作台只开一个页签，重复点击只是切过去。房间号取 {@code ?roomId=}，
 * 没有则由用户在工作台里「创建房间」。</p>
 *
 * <p>信令地址来自 ROOM 节点（{@code serverUrl}）：房间节点是独立端口的 WebSocket
 * 服务，页面不能默认连宿主同端口——那个端口上没有房间端点。传空表示沿用当前
 * 页签已指向的节点；两者都空时退回宿主同端口（服务管理与房间同进程部署的老形态）。</p>
 *
 * <p>关闭页签会卸载 {@link RoomView}，它自己会 leave 并断开 WebSocket，不残留连接。</p>
 *
 * @param serverUrl 目标 ROOM 节点地址（空表示沿用/宿主同端口）
 * @param roomIdArg 要加入的房间号（空则读 {@code ?roomId=}）
 * @param nodeName  房间所在节点名（展示用）
 */
function openRoomTab(serverUrl?: string, roomIdArg?: string, nodeName?: string): void {
  const roomId = roomIdArg ?? String(route.query.roomId ?? '');
  const target = String(serverUrl ?? '').trim();
  const exist = openTabs.value.find(tab => tab.name === ROOM_TAB);
  if (exist) {
    if (roomId) exist.roomId = roomId;
    if (target) {
      exist.serverUrl = target;
      exist.nodeName = nodeName;
    }
    exist.label = roomLabel(exist.roomId ?? '', exist.nodeName);
    activeTab.value = ROOM_TAB;
    return;
  }
  const tab: WorkTab = {
    name: ROOM_TAB,
    kind: 'room',
    roomId,
    serverUrl: target,
    nodeName,
    label: roomLabel(roomId, nodeName),
    icon: 'Connection',
    closable: true,
  };
  openTabs.value = [...openTabs.value, tab];
  activeTab.value = ROOM_TAB;
  pushActivity('打开 P2P 房间', 'Connection');
}

/**
 * 顶部 / 快捷面板的房间入口：先找一个运行中的 ROOM 节点。
 *
 * <p>没有房间节点时不硬开页签：宿主端口上并没有房间端点，开了只会显示「已断开」，
 * 让人以为功能坏了。这里直接说清楚缺什么。</p>
 */
function openRoomEntrance(): void {
  const roomNodes = vm.cards.filter(isRoomCard);
  const running = findRunningRoom();
  if (running) {
    openRoomTab(running.url, undefined, running.name);
    return;
  }
  if (roomNodes.length) {
    message.warning('房间节点未运行：先在左侧启动 ROOM 节点');
    return;
  }
  message.warning('还没有 ROOM 房间节点：先新建一个协议为 room 的服务');
}

/**
 * 从节点行直接打开房间工作台。
 *
 * <p>只有运行中的节点才开：没监听就没有信令面，连上去必然失败。</p>
 *
 * @param card 房间节点卡片
 */
function openRoomFromCard(card: ServiceNodeCard): void {
  if (card.status !== 'RUNNING') {
    message.warning(`房间节点「${card.name}」未运行，请先启动`);
    return;
  }
  if (!card.url) {
    message.warning('房间节点没有可用地址（检查监听地址与端口）');
    return;
  }
  openRoomTab(card.url, undefined, card.name);
}

/**
 * 关闭页签：若关的是当前页签，自动切到相邻的一个（右优先，其次左）。
 *
 * @param name 页签 name
 */
function closeTab(name: string): void {
  const idx = openTabs.value.findIndex(tab => tab.name === name);
  if (idx < 0) return;
  const rest = openTabs.value.filter(tab => tab.name !== name);
  openTabs.value = rest;
  if (activeTab.value !== name) return;
  const next = rest[idx] ?? rest[idx - 1] ?? rest[0];
  activeTab.value = next?.name ?? '';
}

/** 关闭其它页签（保留目标页签） */
function closeOtherTabs(name: string): void {
  openTabs.value = openTabs.value.filter(tab => tab.name === name);
  activeTab.value = name;
}

/** 关闭右侧页签 */
function closeTabsToRight(name: string): void {
  const idx = openTabs.value.findIndex(tab => tab.name === name);
  if (idx < 0) return;
  openTabs.value = openTabs.value.slice(0, idx + 1);
  activeTab.value = name;
}

/** 关闭全部页签 */
function closeAllTabs(): void {
  openTabs.value = [];
  activeTab.value = '';
}

/** 关闭某个节点的全部页签（节点被删除或右键「关闭该服务页签」） */
function closeNodeTabs(nodeId: number): void {
  const rest = openTabs.value.filter(tab => tab.nodeId !== nodeId);
  const wasActive = activeTab.value;
  openTabs.value = rest;
  if (!rest.some(tab => tab.name === wasActive)) {
    activeTab.value = rest[rest.length - 1]?.name ?? '';
  }
}

/** 页签右键菜单 */
const tabContextMenu = computed<ReTabsContextItem[]>(() => {
  const idx = openTabs.value.findIndex(tab => tab.name === activeTab.value);
  const hasRight = idx >= 0 && idx < openTabs.value.length - 1;
  return [
    { key: 'refresh', label: '刷新当前页签', icon: 'RefreshRight' },
    { key: 'reopen', label: '重新打开（清空状态）', icon: 'Refresh' },
    { key: 'close', label: '关闭当前页签', icon: 'Close', divided: true },
    { key: 'close-others', label: '关闭其它页签', icon: 'CircleClose', disabled: openTabs.value.length <= 1 },
    { key: 'close-right', label: '关闭右侧页签', icon: 'DArrowRight', disabled: !hasRight },
    { key: 'close-all', label: '关闭全部页签', icon: 'Delete', danger: true, divided: true },
  ];
});

/**
 * 页签右键命令分发。
 *
 * @param payload.key 命令标识
 * @param payload.tab 触发菜单的页签
 */
function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
  const name = payload.tab.name;
  switch (payload.key) {
    case 'close':
      closeTab(name);
      break;
    case 'close-others':
      closeOtherTabs(name);
      break;
    case 'close-right':
      closeTabsToRight(name);
      break;
    case 'close-all':
      closeAllTabs();
      break;
    case 'refresh':
      tabReloadSeq[name] = reloadSeqOf(name) + 1;
      break;
    case 'reopen': {
      const tab = workTabOf(name);
      if (!tab) break;
      closeTab(name);
      if (tab.kind === 'room') {
        openRoomTab(tab.serverUrl, tab.roomId, tab.nodeName);
        break;
      }
      const card = tab.nodeId == null ? undefined : cardOf(tab.nodeId);
      if (card) openTab(card, tab.kind);
      break;
    }
    default:
      break;
  }
}

/* ==================== 左轨选中与分组 ==================== */

/** 左侧选中的节点（用于右键菜单与无活动页签时的状态） */
const selectedNodeId = ref<number | null>(null);

/** 当前语义节点：有活动页签看活动页签，否则看左侧选中的节点 */
const activeNodeId = computed<number | null>(() => {
  const tab = openTabs.value.find(item => item.name === activeTab.value);
  return tab?.nodeId ?? selectedNodeId.value;
});

/** 按 id 取展示卡片 */
function cardOf(id: number): ServiceNodeCard | undefined {
  return vm.cards.find(card => card.id === id);
}

/** 按卡片取后端行（动作接口要的是后端行） */
function nodeOf(card: ServiceNodeCard): ServerNodeView | undefined {
  return vm.nodes.find(node => node.id === card.id);
}

/** 当前语义节点卡片 */
const activeCard = computed(() =>
  activeNodeId.value == null ? undefined : cardOf(activeNodeId.value),
);

/** 行单击选中；行双击打开详情页签、右键进入操作菜单 */
function onRowClick(card: ServiceNodeCard): void {
  selectedNodeId.value = card.id;
}

function onRowDblClick(card: ServiceNodeCard): void {
  onRowClick(card);
  openTab(card, 'detail');
}

/** 左轨排序口径：名称 / 端口 / 状态（异常在前） */
const sortBy = ref<NodeSort>('name');

/** 切换排序 */
function setSort(value: NodeSort): void {
  sortBy.value = value;
}

/** 状态排序权重：异常最先，其次运行中，最后已停止 */
const STATUS_ORDER: Record<string, number> = { ERROR: 0, RUNNING: 1, STOPPED: 2 };

/** 左轨按协议分组：空协议归入最后的「未分组」 */
const protocolGroups = computed(() => {
  const UNGROUPED = '__ungrouped__';
  const map = new Map<string, ServiceNodeCard[]>();
  for (const card of vm.visibleCards) {
    const key = card.protocolCode || UNGROUPED;
    const list = map.get(key) ?? [];
    list.push(card);
    map.set(key, list);
  }
  const groups = Array.from(map.entries()).map(([key, cards]) => ({
    key,
    protocolText: key === UNGROUPED ? '未分组' : (cards[0]?.protocolText || key),
    cards,
    running: cards.filter(card => card.status === 'RUNNING').length,
  }));
  groups.sort((a, b) => Number(a.key === UNGROUPED) - Number(b.key === UNGROUPED));
  const compare = sortComparator(sortBy.value);
  for (const group of groups) {
    group.cards = [...group.cards].sort(compare);
  }
  return groups;
});

/**
 * 排序比较器。
 *
 * <p>状态排序把异常排在最前：排障时最想知道「哪个出了问题」，按名称排反而要先扫一遍。
 * 名称与端口都走 `localeCompare(..., 'zh-CN', { numeric: true })`，让 `node-2` 排在
 * `node-10` 前面。</p>
 *
 * @param sort 排序口径
 */
function sortComparator(sort: NodeSort): (a: ServiceNodeCard, b: ServiceNodeCard) => number {
  if (sort === 'status') {
    return (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      || a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
  }
  if (sort === 'port') {
    return (a, b) => (a.port ?? 0) - (b.port ?? 0);
  }
  return (a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
}

/** 折叠的协议组 key */
const collapsedGroups = ref<Set<string>>(new Set());

/** 收起 / 展开协议组 */
function toggleGroup(key: string): void {
  const next = new Set(collapsedGroups.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  collapsedGroups.value = next;
}

/* ==================== 节点右键菜单 ==================== */

/** 节点右键菜单状态 */
const ctxMenu = reactive<{ visible: boolean; x: number; y: number; card: ServiceNodeCard | null }>({
  visible: false,
  x: 0,
  y: 0,
  card: null,
});

/* ==================== 操作日志弹框 ==================== */

/** 操作日志弹框是否可见 */
const operLogVisible = ref(false);
/** 当前查看日志的节点（关闭弹框后仍保留，避免关闭动画期间标题闪空） */
const operLogNode = ref<{ id: number; name: string } | null>(null);

/**
 * 打开节点操作日志。
 *
 * <p>只对已持久化的节点开放：{@code node_id} 是非空列，而新建时 id 在响应体里，
 * 页面上的临时卡片还没有可查询的主键。</p>
 *
 * @param card 目标节点卡片
 */
function openOperLog(card: ServiceNodeCard): void {
  if (!card.id) {
    message.warning('该服务还未保存，暂无可查询的操作日志');
    return;
  }
  operLogNode.value = { id: card.id, name: card.name };
  operLogVisible.value = true;
}

/** 菜单估算尺寸（仅在菜单尚未挂载、量不到真实高度时兜底） */
const CTX_MENU_W = 220;
const CTX_MENU_H = 340;
const ctxMenuEl = ref<HTMLElement | null>(null);

/**
 * 打开节点右键菜单。
 *
 * @param x    视口横坐标
 * @param y    视口纵坐标
 * @param card 目标节点
 */
async function openCtxMenuAt(x: number, y: number, card: ServiceNodeCard): Promise<void> {
  selectedNodeId.value = card.id;
  ctxMenu.card = card;
  ctxMenu.x = Math.max(8, x);
  ctxMenu.y = Math.max(8, y);
  ctxMenu.visible = true;
  await nextTick();
  const el = ctxMenuEl.value;
  if (!el) return;
  const w = el.offsetWidth || CTX_MENU_W;
  const h = el.offsetHeight || CTX_MENU_H;
  let nx = x;
  let ny = y;
  if (nx + w > window.innerWidth - 8) nx = window.innerWidth - w - 8;
  if (ny + h > window.innerHeight - 8) ny = window.innerHeight - h - 8;
  ctxMenu.x = Math.max(8, nx);
  ctxMenu.y = Math.max(8, ny);
}

/** 右键行：打开菜单并选中该节点 */
function openCtxMenu(event: MouseEvent, card: ServiceNodeCard): void {
  event.preventDefault();
  event.stopPropagation();
  void openCtxMenuAt(event.clientX, event.clientY, card);
}

/** 行内「更多」按钮：锚点落在按钮左下角，避免菜单盖住当前行 */
async function openCtxMenuFromButton(event: MouseEvent, card: ServiceNodeCard): Promise<void> {
  event.preventDefault();
  event.stopPropagation();
  const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
  await openCtxMenuAt(r.left, r.bottom + 4, card);
}

/** 关闭节点右键菜单 */
function closeCtxMenu(): void {
  ctxMenu.visible = false;
  ctxMenu.card = null;
}

/**
 * 节点右键命令分发。
 *
 * @param cmd 命令标识
 */
function ctxCommand(cmd: string): void {
  const card = ctxMenu.card;
  closeCtxMenu();
  if (!card) return;
  switch (cmd) {
    case 'primary':
      runPrimary(card);
      break;
    case 'detail':
      openTab(card, 'detail');
      break;
    case 'room':
      openRoomFromCard(card);
      break;
    case 'filter':
      openTab(card, 'filter');
      break;
    case 'edit':
      if (nodeOf(card)) vm.openEdit(nodeOf(card)!);
      break;
    case 'clone':
      if (nodeOf(card)) vm.openClone(nodeOf(card)!);
      break;
    case 'copy-name':
      void copyCardText(card.name, '服务名称已复制');
      break;
    case 'copy-listen':
      void copyCardText(card.listenText, '监听地址已复制');
      break;
    case 'copy-url': {
      if (!card.url) {
        message.info('该服务没有访问地址');
        break;
      }
      void copyCardText(card.url, '访问地址已复制');
      break;
    }
    case 'close-tabs':
      closeNodeTabs(card.id);
      break;
    case 'oper-log':
      openOperLog(card);
      break;
    case 'delete':
      if (nodeOf(card)) void vm.remove(nodeOf(card)!);
      break;
    default:
      break;
  }
}

/**
 * 复制卡片文本，成功与否都在页面这一层给 toast。
 *
 * @param text 文本
 * @param ok   成功提示
 */
async function copyCardText(text: string, ok: string): Promise<void> {
  const copied = await copyText(text);
  if (copied) message.success(ok);
  else message.warning('复制失败，请手动复制');
}

/* ==================== 行内操作 / 主操作 ==================== */

/**
 * 主操作：运行中的能停，其余能启；异常的给重启。
 *
 * @param card 展示数据
 */
function runPrimary(card: ServiceNodeCard): void {
  const node = nodeOf(card);
  if (!node) return;
  const action = primaryActionOf(card);
  if (action === 'stop') void vm.stop(node);
  else if (action === 'restart') void vm.restart(node);
  else void vm.start(node);
}

/** 主操作的文案 */
function primaryLabel(card: ServiceNodeCard): string {
  const action = primaryActionOf(card);
  return action === 'stop' ? '停止' : action === 'restart' ? '重启' : '启动';
}

/** 主操作的图标 */
function primaryIcon(card: ServiceNodeCard): string {
  const action = primaryActionOf(card);
  if (action === 'stop') return 'VideoPause';
  if (action === 'restart') return 'Refresh';
  return 'VideoPlay';
}

/* ==================== 右 Dock：快捷操作 / 最近活动 / 统计 ==================== */

/** Dock 是否展开（宽屏默认展开，用户手动收起后记住） */
const dockOpen = ref(localStorage.getItem('assets-dock-open') !== '0');

/** 展开/收起右 Dock */
function toggleDock(): void {
  dockOpen.value = !dockOpen.value;
  localStorage.setItem('assets-dock-open', dockOpen.value ? '1' : '0');
}

/** 左栏是否折叠（折叠后只留一条竖条） */
const railCollapsed = ref(localStorage.getItem('assets-rail-collapsed') === '1');

/** 展开/收起左栏 */
function toggleRail(): void {
  railCollapsed.value = !railCollapsed.value;
  localStorage.setItem('assets-rail-collapsed', railCollapsed.value ? '1' : '0');
}

/** 最近活动（最新的在前，最多 12 条） */
const activities = ref<ActivityItem[]>([]);
let activitySeq = 0;

function pushActivity(text: string, icon = 'Clock', nodeId?: number): void {
  activities.value = [
    { id: ++activitySeq, text, icon, nodeId, at: Date.now() },
    ...activities.value,
  ].slice(0, 12);
}

/** 清空最近活动 */
function clearActivities(): void {
  activities.value = [];
}

/** 相对时间文案（刚刚 / 3 分钟前 / 2 小时前） */
function timeAgo(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return '刚刚';
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return `${Math.floor(s / 86400)} 天前`;
}

/** 点击最近活动：回到那个节点的左轨上下文 */
function gotoActivity(item: ActivityItem): void {
  if (item.nodeId == null) return;
  const card = cardOf(item.nodeId);
  if (card) selectedNodeId.value = card.id;
}

/** 当前页签数（Dock 统计用） */
const tabCount = computed(() => openTabs.value.length);

/* ==================== 外壳：页面状态交给三栏工作台 ==================== */

/** 页签切换：ReTabs 只回传 name，写回页面状态 */
function setActiveTab(name: string): void {
  activeTab.value = name;
}

/**
 * 交给外壳的上下文：ref 原样传进去，由 {@code reactive()} 解包。
 * 这样外壳读写的就是页面同一份状态，不存在「外壳里改了、页面没变」的两份。
 */
const shellCtx = reactive({
  vm,
  statusTabs,
  distTitle,
  protocolGroups,
  collapsedGroups,
  toggleGroup,
  sortBy,
  setSort,
  selectedNodeId,
  activeNodeId,
  activeCard,
  onRowClick,
  onRowDblClick,
  runPrimary,
  primaryLabel,
  primaryIcon,
  stateClassOf,
  openCtxMenuFromButton,
  openOperLog,
  openTabs,
  activeTab,
  setActiveTab,
  tabContextMenu,
  onTabCommand,
  closeTab,
  kindOf,
  nodeIdOf,
  roomIdOf,
  serverUrlOf,
  reloadSeqOf,
  openTab,
  openRoomTab,
  openRoomEntrance,
  openRoomFromCard,
  isRoomCard,
  railCollapsed,
  toggleRail,
  dockOpen,
  toggleDock,
  activities,
  clearActivities,
  timeAgo,
  gotoActivity,
  tabCount,
}) as unknown as SvcShellContext;

/* ==================== 自动刷新后同步页签 ==================== */

/**
 * 节点列表刷新后同步工作区。
 *
 * <p>刷新只应修补页签的 label / 状态点，绝不能把用户打开着的页签重建丢掉；
 * 已删除节点对应的页签自动关闭，激活页签被删时按「右优先、其次左」选相邻页签。
 * 左侧已被删的选中节点也一并清掉，避免状态条指向一个不存在的服务。</p>
 */
watch(
  () => vm.nodes,
  list => {
    const alive = new Set(list.map(node => node.id));
    const prevIdx = openTabs.value.findIndex(tab => tab.name === activeTab.value);
    const kept: WorkTab[] = [];
    for (const tab of openTabs.value) {
      // 房间页签不挂在任何节点上，节点列表刷新与它无关
      if (tab.kind === 'room') {
        kept.push(tab);
        continue;
      }
      if (tab.nodeId == null || !alive.has(tab.nodeId)) continue;
      const card = cardOf(tab.nodeId);
      tab.label = card?.name ?? tab.label;
      tab.status = tabStatusOf(card);
      kept.push(tab);
    }
    openTabs.value = kept;
    if (!kept.some(tab => tab.name === activeTab.value)) {
      const next = kept[prevIdx] ?? kept[prevIdx - 1] ?? kept[0];
      activeTab.value = next?.name ?? '';
    }
    if (selectedNodeId.value != null && !alive.has(selectedNodeId.value)) {
      selectedNodeId.value = null;
    }
  },
);

/* ==================== 房间深链 ==================== */

/** 深链页签是否已处理过（`?roomId=` 只开一次，之后交给用户） */
let deepLinkHandled = false;

/**
 * 用 `?roomId=` 直接打开房间工作台。
 *
 * <p>必须在节点列表落地之后再开：房间信令跑在 ROOM 节点自己的端口上，节点还没
 * 取回来时 {@link resolveRoomUrl} 是空串，页签会连到宿主端口，症状是永远
 * 「连接中」/「未加入」。没有可用的房间节点时不硬开页签，直接说明原因。</p>
 */
function openDeepLinkRoom(): void {
  const roomId = String(route.query.roomId ?? '');
  if (!roomId || deepLinkHandled) return;
  // 节点列表还没回来（首轮取数中），等 watch 再试
  if (vm.loading && !vm.cards.length) return;
  deepLinkHandled = true;
  const running = findRunningRoom();
  if (!running) {
    message.warning(vm.cards.some(isRoomCard)
      ? '房间节点未运行：先在左侧启动 ROOM 节点'
      : '还没有 ROOM 房间节点：先新建一个协议为 room 的服务');
    return;
  }
  openRoomTab(running.url, roomId, running.name);
}

onMounted(openDeepLinkRoom);

/** 首轮节点列表落地后再处理深链 */
watch(() => vm.cards.length, () => openDeepLinkRoom());

/** 地址栏房间号变化时同步到已打开的房间页签 */
watch(
  () => String(route.query.roomId ?? ''),
  (roomId) => {
    const tab = openTabs.value.find(item => item.name === ROOM_TAB);
    if (!tab) return;
    tab.roomId = roomId;
    tab.label = roomLabel(roomId, tab.nodeName);
  },
);
</script>

<template>
  <div class="service-manage">
    <!-- 降级提示：协议或插件元数据失败时必须出声，否则用户只看到「协议下拉是空的」，
         无从判断是故障还是没权限 -->
    <el-alert
      v-if="vm.notice.show"
      :type="vm.notice.tone"
      :title="vm.notice.text"
      show-icon
      :closable="false"
      class="load-notice"
    />

    <!-- 三栏工作台：左栏清单 / 中间工作区 / 右侧检查器，共用同一份状态与动作 -->
    <ShellRack :ctx="shellCtx" />

    <!-- 新增 / 编辑 / 克隆：表单抽屉（与旧页契约一致） -->
    <ScServerFormDrawer
      v-model="vm.formVisible"
      :node="vm.editingNode?.id === 0 ? null : vm.editingNode"
      :protocols="vm.protocols"
      :filter-types="vm.filterTypes"
      :existing-names="vm.existingNames"
      :clone-source="vm.editingNode?.id === 0 ? vm.editingNode : null"
      @saved="vm.refresh()"
    />

    <!-- 节点操作日志：右键菜单进入，只读分页 -->
    <ReDialog
      v-model="operLogVisible"
      width="960px"
      :title="operLogNode ? `操作日志 · ${operLogNode.name}` : '操作日志'"
      :footer-hidden="true"
      destroy-on-close
    >
      <div class="sv-operlog-wrap">
        <ScServerOperLogPanel
          :node-id="operLogNode?.id ?? null"
          :node-name="operLogNode?.name"
        />
      </div>
    </ReDialog>
    <!-- 节点右键菜单：Teleport 到 body，样式走 kit 里的全局 sv-ctx-* -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.visible"
        class="sv-ctx-backdrop"
        @mousedown="closeCtxMenu"
        @contextmenu.prevent="closeCtxMenu"
      />
      <div
        v-if="ctxMenu.visible && ctxMenu.card"
        ref="ctxMenuEl"
        class="sv-ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        role="menu"
        @contextmenu.prevent
      >
        <div class="sv-ctx-head">
          <b :title="ctxMenu.card.name">{{ ctxMenu.card.name }}</b>
          <span class="sv-mono">{{ ctxMenu.card.listenText }}</span>
        </div>

        <div class="sv-ctx-item" @click="ctxCommand('primary')">
          <ReIcon :name="primaryIcon(ctxMenu.card)" />
          <span>{{ primaryLabel(ctxMenu.card) }}</span>
        </div>
        <div v-if="isRoomCard(ctxMenu.card)" class="sv-ctx-item" @click="ctxCommand('room')">
          <ReIcon name="Connection" />
          <span>打开房间工作台</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('detail')">
          <ReIcon name="View" />
          <span>查看详情</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('oper-log')">
          <ReIcon name="Document" />
          <span>操作日志</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('filter')">
          <ReIcon name="Filter" />
          <span>过滤器链</span>
        </div>

        <div class="sv-ctx-sep" />
        <div class="sv-ctx-item" @click="ctxCommand('edit')">
          <ReIcon name="EditPen" />
          <span>编辑服务</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('clone')">
          <ReIcon name="CopyDocument" />
          <span>克隆服务</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('close-tabs')">
          <ReIcon name="CircleClose" />
          <span>关闭该服务页签</span>
        </div>

        <div class="sv-ctx-sep" />
        <div class="sv-ctx-label">复制</div>
        <div class="sv-ctx-item" @click="ctxCommand('copy-name')">
          <ReIcon name="Document" />
          <span>复制名称</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('copy-listen')">
          <ReIcon name="Link" />
          <span>复制监听地址</span>
        </div>
        <div class="sv-ctx-item" @click="ctxCommand('copy-url')">
          <ReIcon name="Share" />
          <span>复制访问地址</span>
        </div>

        <div class="sv-ctx-sep" />
        <div class="sv-ctx-item is-danger" @click="ctxCommand('delete')">
          <ReIcon name="Delete" />
          <span>删除服务</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.service-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.load-notice {
  flex: none;
  margin: 0;
}

/* 操作日志弹框：面板内部按 100% 高铺开，ReTable 的高度才有参照 */
.sv-operlog-wrap {
  display: flex;
  flex-direction: column;
  height: 520px;
  min-height: 0;
}

/* ============ 外壳外框 ============ */
.service-manage :deep(> *) {
  min-height: 0;
}

/* ============ 窄屏 ============ */
@media (max-width: 1180px) {
  .service-manage {
    gap: 8px;
  }
}
</style>