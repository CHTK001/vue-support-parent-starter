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
import ReTabs, { type ReTabsContextItem, type ReTabsItem } from '@repo/ui/re-tabs';
import { RoomView } from '@pages/room';
import ReDialog from '@repo/ui/re-dialog';
import ScServerFormDrawer from '../components/ScServerFormDrawer.vue';
import ScServerDetailDrawer from '../components/ScServerDetailDrawer.vue';
import ScServerOperLogPanel from '../components/ScServerOperLogPanel.vue';
import { useServiceNodes } from './service/useServiceNodes';
import {
  primaryActionOf,
  stateClassOf,
  type ServiceNodeCard,
} from './service/serviceView';
import type { ServerNodeView } from '../api';
import { copyText } from '../utils/clipboard';
import './service/service-kit.css';

const vm = useServiceNodes();
const route = useRoute();

/** 分布条的悬停说明：分布图没有刻度，悬停要能读到准确数字 */
const distTitle = computed(
  () => `运行 ${vm.statusCounts.running} · 异常 ${vm.statusCounts.error} · 已停止 ${vm.statusCounts.stopped}`,
);

/** 左轨的状态分组 */
const statusTabs = computed<
  Array<{ label: string; value: '' | 'RUNNING' | 'ERROR' | 'STOPPED'; count: number; dot: string }>
>(() => [
  { label: '全部', value: '', count: vm.statusCounts.all, dot: '' },
  { label: '运行中', value: 'RUNNING', count: vm.statusCounts.running, dot: 'is-run' },
  { label: '异常', value: 'ERROR', count: vm.statusCounts.error, dot: 'is-err' },
  { label: '已停止', value: 'STOPPED', count: vm.statusCounts.stopped, dot: 'is-stop' },
]);

/* ==================== 工作区页签 ==================== */

/** 工作区页签类型：节点详情 / 过滤器链 / P2P 房间 */
type WorkKind = 'detail' | 'filter' | 'room';

/** 房间页签固定 name（同一时刻只保留一个房间工作台） */
const ROOM_TAB = 'room';

/** 工作区页签（比 ReTabsItem 多带上下文，便于渲染内容） */
interface WorkTab extends ReTabsItem {
  /** 所属节点 id；房间页签没有节点 */
  nodeId?: number;
  kind: WorkKind;
  /** 房间页签要加入的房间号（来自 ?roomId=，空则停在「创建房间」） */
  roomId?: string;
  /** 房间页签指向的信令节点地址（ROOM 节点的 serverUrl；空则用宿主同端口） */
  serverUrl?: string;
  /** 房间页签来源节点名（展示用，空表示宿主同端口房间） */
  nodeName?: string;
}

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
  return groups;
});

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

/** 最近活动记录 */
interface ActivityItem {
  id: number;
  text: string;
  icon: string;
  nodeId?: number;
  at: number;
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

    <!-- ============ 控制条：一行装下计数、分布、搜索、新增 ============ -->
    <div class="rack__bar">
      <div class="rack__counts">
        <span class="rack__big sv-mono">{{ vm.statusCounts.running }}</span>
        <span class="rack__of sv-mono">/ {{ vm.stats.total }}</span>
        <span class="rack__cap">运行中</span>
      </div>

      <!-- 三段分布：宽度就是占比，为 0 的一段不要渲染，避免留下一条 2px 细线 -->
      <div class="rack__dist" :title="distTitle">
        <span v-if="vm.statusCounts.running" class="rack__seg is-run" :style="{ flex: vm.statusCounts.running }" />
        <span v-if="vm.statusCounts.error" class="rack__seg is-err" :style="{ flex: vm.statusCounts.error }" />
        <span v-if="vm.statusCounts.stopped" class="rack__seg is-stop" :style="{ flex: vm.statusCounts.stopped }" />
        <span v-if="!vm.stats.total" class="rack__seg is-none" />
      </div>

      <!-- 宽度写在包一层的 div 上：ReInput / ReSelect 根节点自带 width:100% -->
      <div class="rack__search">
        <ReInput
          v-model="vm.keyword"
          aria-label="搜索服务"
          placeholder="名称 / 端口 / 报错关键字"
          clearable
          prefix-icon="Search"
        />
      </div>
      <div class="rack__proto">
        <ReSelect
          v-model="vm.protocol"
          aria-label="按协议筛选"
          :data="vm.protocolOptions"
          placeholder="全部协议"
          clearable
        />
      </div>
      <ReButton icon="Connection" show-text tip="打开 P2P 房间工作台" @click="openRoomEntrance">P2P 房间</ReButton>
      <ReButton icon="Plus" layout="square" type="primary" tip="新增服务" @click="vm.openCreate()" />
      <ReButton icon="Refresh" layout="square" tip="刷新" :loading="vm.loading" @click="vm.refresh()" />
    </div>

    <!-- ============ 三栏主体 ============ -->
    <div class="sv-body">
      <!-- ==================== 左侧：服务节点栏 ==================== -->
      <aside class="sv-rail" :class="{ 'is-collapsed': railCollapsed }">
        <!-- 折叠态：只留一条竖条，展开按钮压在底部 -->
        <div v-if="railCollapsed" class="sv-rail-strip">
          <button type="button" class="sv-rail-strip__count" title="展开服务列表" @click="toggleRail">
            <b>{{ vm.visibleCards.length }}</b>
            <span>/{{ vm.cards.length }}</span>
          </button>
          <span class="sv-rail-strip__dots">
            <i class="is-run" :title="`运行中 ${vm.statusCounts.running}`" />
            <i class="is-err" :title="`异常 ${vm.statusCounts.error}`" />
          </span>
          <span class="sv-rail-strip__gap" />
          <button type="button" class="sv-rail-strip__toggle" title="展开服务列表" @click="toggleRail">
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>

        <!-- 展开态：状态页签 -->
        <div v-show="!railCollapsed" class="sv-rail__head">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            type="button"
            class="sv-rail__tab"
            :class="{ 'is-active': vm.status === tab.value }"
            :aria-pressed="vm.status === tab.value"
            @click="vm.status = tab.value"
          >
            <i class="sv-dot" :class="tab.dot" />
            <span class="sv-rail__tab-label">{{ tab.label }}</span>
            <span class="sv-rail__tab-n sv-mono">{{ tab.count }}</span>
          </button>
        </div>

        <!-- 展开态：协议分组列表 -->
        <div v-show="!railCollapsed" class="sv-rail__groups">
          <template v-for="group in protocolGroups" :key="group.key">
            <button
              type="button"
              class="sv-group__head"
              :aria-expanded="!collapsedGroups.has(group.key)"
              @click="toggleGroup(group.key)"
            >
              <ReIcon
                name="ArrowDown"
                :size="12"
                class="sv-group__caret"
                :class="{ 'is-folded': collapsedGroups.has(group.key) }"
              />
              <span class="sv-group__name sv-ellipsis">{{ group.protocolText }}</span>
              <span v-if="group.running" class="sv-group__run" :title="`运行中 ${group.running}`">
                <i class="sv-dot is-run" />{{ group.running }}
              </span>
              <span class="sv-group__n sv-mono">{{ group.cards.length }}</span>
            </button>

            <div v-show="!collapsedGroups.has(group.key)" class="sv-group__list">
              <div
                v-for="card in group.cards"
                :key="card.id"
                class="sv-node"
                :class="{ 'is-active': activeNodeId === card.id, 'is-selected': selectedNodeId === card.id && activeNodeId !== card.id }"
                :title="card.listenText"
                @click="onRowClick(card)"
                @dblclick="onRowDblClick(card)"
                @contextmenu="openCtxMenu($event, card)"
              >
                <i class="sv-dot" :class="stateClassOf(card)" />
                <span class="sv-node__name sv-ellipsis">{{ card.name }}</span>
                <span class="sv-node__port sv-mono">{{ card.portText }}</span>
                <!-- 行内操作：悬停浮出，不占常态宽度 -->
                <span class="sv-node__ops">
                  <button
                    v-if="isRoomCard(card)"
                    type="button"
                    title="打开房间工作台"
                    @click.stop="openRoomFromCard(card)"
                  >
                    <ReIcon name="Connection" :size="13" />
                  </button>
                  <button
                    type="button"
                    :title="primaryLabel(card)"
                    :disabled="vm.actingId === card.id"
                    @click.stop="runPrimary(card)"
                  >
                    <ReIcon :name="primaryIcon(card)" :size="13" />
                  </button>
                  <button type="button" title="查看详情" @click.stop="openTab(card, 'detail')">
                    <ReIcon name="View" :size="13" />
                  </button>
                  <button type="button" title="更多操作" @click.stop="openCtxMenuFromButton($event, card)">
                    <ReIcon name="MoreFilled" :size="13" />
                  </button>
                </span>
              </div>
            </div>
          </template>

          <div v-if="!vm.visibleCards.length" class="sv-rail__empty">
            <ReIcon name="Files" :size="20" />
            <span>{{ vm.filtered ? '没有匹配的服务' : '还没有服务节点' }}</span>
          </div>
        </div>

        <!-- 展开态：底部折叠按钮 -->
        <button v-show="!railCollapsed" type="button" class="sv-rail__foot" title="收起服务列表" @click="toggleRail">
          <ReIcon name="ArrowLeft" :size="12" />
          <span>收起</span>
        </button>
      </aside>

      <!-- ==================== 中间：ReTabs 工作区 ==================== -->
      <section class="sv-work">
        <ReTabs
          v-model="activeTab"
          :tabs="openTabs"
          :context-menu="tabContextMenu"
          empty-text="从左侧选择服务：单击选中，双击或右键打开详情；P2P 房间在 ROOM 节点行点连接图标打开"
          @close="closeTab"
          @context-command="onTabCommand"
        >
          <template #default="{ tab }">
            <!-- 房间工作台：关闭页签即卸载，RoomView 自己 leave + 断开 WebSocket -->
            <RoomView
              v-if="kindOf(tab) === 'room'"
              :key="`${tab.name}:${reloadSeqOf(tab.name)}`"
              :room-id="roomIdOf(tab)"
              :server-url="serverUrlOf(tab)"
              @leave="closeTab(tab.name)"
            />
            <!-- 每个页签独立实例 + key 代次：刷新/重开页签时重建内容 -->
            <ScServerDetailDrawer
              v-else
              :key="`${tab.name}:${reloadSeqOf(tab.name)}`"
              embedded
              :initial-view="kindOf(tab) === 'filter' ? 'filter' : 'detail'"
              :node-id="nodeIdOf(tab)"
              :filter-types="vm.filterTypes"
              @changed="vm.refresh()"
              @open-detail-page="vm.openDetailPage"
            />
          </template>
        </ReTabs>
      </section>

      <!-- ==================== 右侧：快捷面板 ==================== -->
      <aside v-if="dockOpen" class="sv-dock">
        <div class="sv-dock__head">
          <span class="sv-dock__title">快捷面板</span>
          <button type="button" class="sv-dock__fold" title="收起快捷面板" @click="toggleDock">
            <ReIcon name="ArrowRight" :size="12" />
          </button>
        </div>

        <div class="sv-dock__body">
          <!-- 快捷操作 -->
          <div class="sv-dock__sec">
            <div class="sv-dock__sec-title">快捷操作</div>
            <div class="sv-dock__quick">
              <button v-if="activeCard" type="button" class="sv-dock__item" @click="openTab(activeCard, 'detail')">
                <ReIcon name="View" :size="13" />
                <span>查看详情</span>
              </button>
              <button v-if="activeCard" type="button" class="sv-dock__item" @click="openTab(activeCard, 'filter')">
                <ReIcon name="Filter" :size="13" />
                <span>过滤器链</span>
              </button>
              <button
                v-if="activeCard"
                type="button"
                class="sv-dock__item"
                :class="{ 'is-running': primaryActionOf(activeCard) === 'stop' }"
                :disabled="vm.actingId === activeCard.id"
                @click="runPrimary(activeCard)"
              >
                <ReIcon :name="primaryIcon(activeCard)" :size="13" />
                <span>{{ primaryLabel(activeCard) }}</span>
              </button>
              <button type="button" class="sv-dock__item" :disabled="vm.loading" @click="vm.refresh()">
                <ReIcon name="RefreshRight" :size="13" />
                <span>刷新列表</span>
              </button>
              <button type="button" class="sv-dock__item" @click="toggleRail">
                <ReIcon name="DArrowLeft" :size="13" />
                <span>{{ railCollapsed ? '展开服务栏' : '收起服务栏' }}</span>
              </button>
              <button type="button" class="sv-dock__item" @click="vm.openCreate()">
                <ReIcon name="Plus" :size="13" />
                <span>新增服务</span>
              </button>
              <button type="button" class="sv-dock__item" @click="openRoomEntrance">
                <ReIcon name="Connection" :size="13" />
                <span>P2P 房间</span>
              </button>
            </div>
          </div>

          <!-- 最近活动 -->
          <div class="sv-dock__sec">
            <div class="sv-dock__sec-title">
              最近活动
              <button v-if="activities.length" type="button" class="sv-dock__more" @click="clearActivities">清空</button>
            </div>
            <div v-if="activities.length" class="sv-dock__act">
              <button
                v-for="it in activities"
                :key="it.id"
                type="button"
                class="sv-dock__act-item"
                :class="{ 'is-link': it.nodeId != null }"
                :title="it.text"
                @click="gotoActivity(it)"
              >
                <ReIcon :name="it.icon" :size="13" />
                <span class="sv-dock__act-text sv-ellipsis">{{ it.text }}</span>
                <span class="sv-dock__act-time">{{ timeAgo(it.at) }}</span>
              </button>
            </div>
            <div v-else class="sv-dock__empty">操作记录会显示在这里</div>
          </div>

          <!-- 统计 -->
          <div class="sv-dock__sec">
            <div class="sv-dock__sec-title">节点统计</div>
            <div class="sv-dock__stats">
              <div class="sv-dock__stat">
                <span>服务总数</span>
                <b class="sv-mono">{{ vm.stats.total }}</b>
              </div>
              <div class="sv-dock__stat">
                <span>运行中</span>
                <b class="sv-mono is-run">{{ vm.stats.running }}</b>
              </div>
              <div class="sv-dock__stat">
                <span>异常</span>
                <b class="sv-mono is-err">{{ vm.stats.error }}</b>
              </div>
              <div class="sv-dock__stat">
                <span>已停止</span>
                <b class="sv-mono">{{ vm.stats.stopped }}</b>
              </div>
              <div class="sv-dock__stat">
                <span>已挂插件</span>
                <b class="sv-mono">{{ vm.stats.plugins }}</b>
              </div>
              <div class="sv-dock__stat">
                <span>工作区页签</span>
                <b class="sv-mono">{{ tabCount }}</b>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Dock 收起态：右缘一条竖条 -->
      <button v-else type="button" class="sv-dock-fold" title="展开快捷面板" @click="toggleDock">
        <ReIcon name="ArrowLeft" :size="13" />
      </button>
    </div>

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

/* ============ 控制条 ============ */
.rack__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.rack__counts {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex: none;
}

.rack__big {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.rack__of {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.rack__cap {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.rack__dist {
  display: flex;
  gap: 2px;
  flex: 1 1 120px;
  max-width: 260px;
  min-width: 80px;
  height: 6px;
}

.rack__seg {
  min-width: 2px;
  border-radius: 3px;
  transition: flex 240ms ease-out;
}

.rack__seg.is-run {
  background: var(--status-success, var(--el-color-success));
}

.rack__seg.is-err {
  background: var(--status-error, var(--el-color-danger));
}

.rack__seg.is-stop {
  background: var(--el-border-color);
}

.rack__seg.is-none {
  flex: 1;
  background: var(--el-fill-color);
}

.rack__search {
  flex: none;
  width: 240px;
  margin-left: auto;
}

.rack__proto {
  flex: none;
  width: 190px;
}

/* ============ 三栏主体 ============ */
.sv-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ==================== 左轨 ==================== */
.sv-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 264px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: width 0.18s ease;
}

/* 折叠态：264px → 44px，中间工作区净增 220px */
.sv-rail.is-collapsed {
  width: 44px;
}

.sv-rail-strip {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;
}

.sv-rail-strip__count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.sv-rail-strip__count b {
  font-size: 16px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.sv-rail-strip__dots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sv-rail-strip__dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.sv-rail-strip__dots i.is-run {
  background: var(--status-success, var(--el-color-success));
}

.sv-rail-strip__dots i.is-err {
  background: var(--status-error, var(--el-color-danger));
}

.sv-rail-strip__gap {
  flex: 1 1 auto;
}

.sv-rail-strip__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.sv-rail-strip__toggle:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

/* 状态页签 */
.sv-rail__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 6px 2px;
  flex: none;
}

.sv-rail__tab {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 0;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  text-align: left;
}

.sv-rail__tab:hover {
  background: var(--el-fill-color-light);
}

.sv-rail__tab.is-active {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
}

.sv-rail__tab:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -1px;
}

.sv-rail__tab-label {
  flex: 1 1 auto;
}

.sv-rail__tab-n {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.sv-rail__tab.is-active .sv-rail__tab-n {
  color: var(--el-color-primary);
}

/* 协议分组列表 */
.sv-rail__groups {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 2px 6px 6px;
}

.sv-group__head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
}

.sv-group__head:hover {
  background: var(--el-fill-color-light);
}

.sv-group__caret {
  flex: none;
  color: var(--el-text-color-placeholder);
  transition: transform 0.15s ease;
}

.sv-group__caret.is-folded {
  transform: rotate(-90deg);
}

.sv-group__name {
  flex: 1 1 auto;
  font-weight: 600;
}

.sv-group__run {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.sv-group__n {
  flex: none;
  min-width: 16px;
  text-align: right;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.sv-group__list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: 14px;
  margin-left: 6px;
  border-left: 1px solid var(--el-border-color-lighter);
}

/* 服务行 */
.sv-node {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid transparent;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.sv-node:hover {
  background: var(--el-fill-color-light);
}

.sv-node.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.sv-node.is-selected {
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
}

.sv-node__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sv-node__port {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* 行内操作：常态不占位，悬停时覆盖在行右端 */
.sv-node__ops {
  position: absolute;
  top: 50%;
  right: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
  opacity: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border-radius: var(--el-radius-sm, 4px);
  transform: translateY(-50%);
  transition: opacity 0.12s ease;
}

.sv-node:hover .sv-node__ops,
.sv-node:focus-within .sv-node__ops {
  opacity: 1;
  pointer-events: auto;
}

.sv-node__ops button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
}

.sv-node__ops button:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.sv-node__ops button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.sv-rail__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 左轨底部折叠按钮 */
.sv-rail__foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: none;
  margin: auto 6px 6px;
  padding: 7px 8px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: none;
  border-top: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
}

.sv-rail__foot:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

/* ==================== 中间：ReTabs 工作区 ==================== */
.sv-work {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* ==================== 右 Dock ==================== */
.sv-dock {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 212px;
  min-height: 0;
  overflow-y: auto;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.sv-dock__head {
  display: flex;
  flex: none;
  align-items: center;
  padding: 10px 10px 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sv-dock__title {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.sv-dock__fold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.sv-dock__fold:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.sv-dock__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 10px 12px;
}

.sv-dock__sec {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sv-dock__sec-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder);
}

.sv-dock__more {
  padding: 0;
  border: none;
  background: transparent;
  font-size: 11px;
  color: var(--el-color-primary);
  cursor: pointer;
}

.sv-dock__more:hover {
  opacity: 0.8;
}

/* 快捷操作：两列小格，窄屏回退单列 */
.sv-dock__quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
}

.sv-dock__item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
}

.sv-dock__item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.sv-dock__item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* 最近活动 */
.sv-dock__act {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sv-dock__act-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 6px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  cursor: default;
}

.sv-dock__act-item.is-link {
  cursor: pointer;
}

.sv-dock__act-item.is-link:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.sv-dock__act-text {
  flex: 1 1 auto;
}

.sv-dock__act-time {
  flex: none;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

.sv-dock__empty {
  padding: 4px 6px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* 节点统计 */
.sv-dock__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 10px;
}

.sv-dock__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.sv-dock__stat b {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sv-dock__stat b.is-run {
  color: var(--status-success, var(--el-color-success));
}

.sv-dock__stat b.is-err {
  color: var(--status-error, var(--el-color-danger));
}

/* Dock 收起态：右缘一条竖条 */
.sv-dock-fold {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  width: 36px;
  color: var(--el-text-color-placeholder);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
}

.sv-dock-fold:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}

/* ============ 窄屏 ============ */
@media (max-width: 1180px) {
  .sv-dock {
    width: 172px;
  }

  .sv-dock__quick {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .sv-rail {
    width: 220px;
  }
}

@media (max-width: 860px) {
  .rack__dist {
    display: none;
  }

  .sv-dock,
  .sv-dock-fold {
    display: none;
  }
}
</style>