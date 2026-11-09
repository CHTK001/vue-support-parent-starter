<script setup lang="ts">
/**
 * 分屏终端工作台（真实连接版）—— ReSplitLayout 分栏
 *
 * <p>版式交给 {@code ReSplitLayout}（VS Code 式页签 + 可拖拽分栏），不再是自由画布：
 * <b>一个页签 = 一个终端会话</b>，分屏 = 把页签拆到左 / 右 / 上 / 下。</p>
 *
 * <p>默认只开<b>当前上下文主机</b>一个会话 —— 用户是从某台主机的右键「工作台」
 * 进来的，一进来就看到三台不相干机器的终端既不知道自己在哪台机器上，也白白
 * 抢占 SSH 连接。其它主机由右键菜单按需添加。</p>
 *
 * <p>页签栏由 ReSplitLayout 提供，组件自身不画顶部条；新增主机 / 同主机分屏 /
 * 关闭 / 刷新全部收在右键菜单里。</p>
 *
 * <p>会话保活：面板插槽里把该面板<b>全部</b>页签都渲染出来，用 {@code v-show}
 * 只显示当前页签。若只渲染 activeTab，切页签时 SSH iframe 会被销毁重建，
 * 正在跑的命令与输出全丢。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { message } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
import { getUserInfo } from "@repo/utils";
import {
  createTerminalShare,
  deleteTerminalShare,
  getTerminalShareByRoom,
  listTerminalShares,
  listUsersForPicker,
  queryHosts,
  updateTerminalShareAccess,
  type TerminalShareInfo,
  type TerminalShareVisibility,
} from "../../api";
import ReSplitLayout from "@repo/ui/re-split-layout";
import type { LayoutNode, PanelTab, SplitNode } from "@repo/ui/re-split-layout";
import ScSshDirectViewer from "../ScSshDirectViewer.vue";
import ScVncDirectViewer from "../ScVncDirectViewer.vue";
import ScRdpDirectViewer from "../ScRdpDirectViewer.vue";
import ScGuacViewer from "../ScGuacViewer.vue";
import ScSftpPanel from "../ScSftpPanel.vue";
import ScTerminalSidePanel from "../ScTerminalSidePanel.vue";

/** 主机（与 TerminalView 相同的字段口径） */
interface Host {
  id: number;
  serverHostName?: string;
  serverHostAddress?: string;
  serverHostPort?: number;
  serverHostOnline?: number;
  serverHostOsType?: string;
  serverHostRemoteMode?: string;
  serverHostRemoteProtocol?: string;
  serverHostRemotePort?: number;
}

const props = withDefaults(
  defineProps<{
    /** 上下文主机 id（页签绑定的主机；默认只开这一台） */
    hostId?: number;
    /** 上下文主机名（主机列表未到时先占位） */
    hostName?: string;
  }>(),
  { hostId: 0, hostName: "" },
);

const emit = defineEmits<{
  /** 点 Docker / 隧道 / 服务 / 指标工具条：交给父级开对应工作台页签（带主机上下文） */
  (e: "open-panel", panel: "docker" | "k8s" | "tunnel" | "tunnel-reverse", hostId: number, hostName: string): void;
}>();

/* ==================== 真实主机 ==================== */

const hosts = ref<Host[]>([]);
const loading = ref(false);
const error = ref("");

async function loadHosts(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    hosts.value = ((await queryHosts()) ?? []) as Host[];
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
  if (!sessions.value.length) {
    // 等 ReSplitLayout 挂载出来再灌默认布局（加载态期间它还没渲染）
    await nextTick();
    seedCurrentHost();
  }
}
onMounted(loadHosts);

/** 主机默认协议（与 TerminalView.defaultProtocolOf 同口径） */
function defaultProtocolOf(h: Host): string {
  const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (configured === "SSH" || configured === "TELNET" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}

/** 生效远控端口（SSH 回落资产接入端口，不再返回 null） */
function remotePortOf(h: Host): number {
  const p = defaultProtocolOf(h);
  const configured = (h.serverHostRemoteProtocol ?? "").toLowerCase();
  if (configured === p && h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
  if (p === "ssh") return h.serverHostPort || 22;
  if (p === "telnet") return h.serverHostPort || 23;
  return p === "rdp" ? 3389 : 5900;
}

/** 生效远控通道（协议联动）：SSH/Telnet/VNC/RDP 平台自研直连；显式 NONE/GUACD 尊重台账 */
function remoteModeOf(h: Host): string {
  const mode = (h.serverHostRemoteMode ?? "").toUpperCase();
  if (mode === "NONE") return "NONE";
  if (mode === "GUACD") return "GUACD";
  return "DIRECT";
}

/* ==================== 会话模型 ==================== */

interface Session {
  /** 页签 id（与布局树里的 tab.id 一致） */
  id: string;
  hostId: number;
  hostName: string;
  hostAddress: string;
  /** 本会话使用的协议 */
  protocol: string;
  /** 连接延迟等级 */
  latencyLevel: "low" | "medium" | "high" | "offline";
  /** 共享记录（未共享为空）：有值时终端接入该房间，按 canWrite 决定可否操作 */
  share?: TerminalShareInfo | null;
  /** 连接对象（传给 viewer） */
  connection: {
    hostId: number;
    hostName: string;
    address: string;
    protocol: string;
    identityId: number | null;
    targetPort: number;
    mode: string;
    /** 共享房间号；有值时接入已有共享会话 */
    roomId?: string | null;
    /** 共享成员显示名 */
    userName?: string | null;
    /** 当前账号用户标识（后端按它判定写权限） */
    userId?: string | null;
    /** 当前账号是否有协同操作权限 */
    writable?: boolean;
  };
}

const sessions = ref<Session[]>([]);
/** 会话 id 自增（不能用 Date.now()：同一毫秒建两个会话会撞 id） */
let sessionSeq = 0;

function buildSession(h: Host, protocol?: string): Session {
  const proto = protocol || defaultProtocolOf(h);
  const sid = `term-${++sessionSeq}`;
  const name = h.serverHostName ?? `#${h.id}`;
  return {
    id: sid,
    hostId: h.id,
    hostName: name,
    hostAddress: h.serverHostAddress ?? "",
    protocol: proto,
    latencyLevel: h.serverHostOnline === 1 ? "low" : "offline",
    connection: {
      hostId: h.id,
      hostName: `${name} (${h.serverHostAddress ?? "-"})`,
      address: h.serverHostAddress ?? "",
      protocol: proto,
      identityId: null,
      targetPort: remotePortOf(h),
      mode: remoteModeOf(h),
    },
  };
}

/** 会话对应页签 */
function tabOf(s: Session): PanelTab {
  return { id: s.id, label: `${s.hostName} · ${s.protocol.toUpperCase()}`, closable: true };
}

/** 页签 id → 会话 */
function sessionOf(tabId: string): Session | null {
  return sessions.value.find((s) => s.id === tabId) ?? null;
}

/** 布局树里所有页签 id（用于清理已关闭会话） */
function collectTabIds(node: LayoutNode, out: string[] = []): string[] {
  if (node.type === "panel") {
    for (const t of node.tabs) out.push(t.id);
    return out;
  }
  for (const child of node.children) collectTabIds(child, out);
  return out;
}

/** 页签所在面板 id */
function panelIdOfTab(node: LayoutNode, tabId: string): string | null {
  if (node.type === "panel") return node.tabs.some((t) => t.id === tabId) ? node.id : null;
  for (const child of node.children) {
    const found = panelIdOfTab(child, tabId);
    if (found) return found;
  }
  return null;
}

/* ==================== 布局 ==================== */

/** 空布局骨架：一个空面板（没有会话时空态浮层接管，分栏骨架先立着） */
function emptyLayout(): SplitNode {
  return {
    type: "split",
    direction: "horizontal",
    children: [{ type: "panel", id: "panel-main", tabs: [], activeTabId: "" }],
    sizes: [100],
  };
}

const splitRef = ref<InstanceType<typeof ReSplitLayout> | null>(null);
/**
 * 布局快照（只读镜像）。
 *
 * <p>真正的布局树在 ReSplitLayout 内部；这里每次操作后拉一份深拷贝，
 * 只用于「页签在哪个面板 / 还有哪些页签」这类查询以及清理已关闭会话。
 * 不把它回灌给组件（回灌会触发 hydrating，把用户正在拖的布局打回快照）。</p>
 */
const layout = ref<SplitNode>(emptyLayout());
const defaultLayout: SplitNode = emptyLayout();

/** 从组件内部拉一份布局快照 */
function syncSnapshot(): void {
  const live = splitRef.value?.layout as SplitNode | undefined;
  if (live && live.type === "split") layout.value = JSON.parse(JSON.stringify(live)) as SplitNode;
}

/** @param next ReSplitLayout 抛出的最新布局树 */
function onLayoutChange(next: SplitNode): void {
  layout.value = JSON.parse(JSON.stringify(next)) as SplitNode;
  // 页签被 × 关掉 / 拖走时，把对应会话一起清掉（否则 SSH 连接与 WebSocket 会留在后台）
  const alive = new Set(collectTabIds(next));
  const kept = sessions.value.filter((s) => alive.has(s.id));
  if (kept.length !== sessions.value.length) sessions.value = kept;
}

/** 当前存在的页签 id 列表 */
function liveTabIds(): string[] {
  return collectTabIds(layout.value);
}

/** 页签所在面板（快照里查） */
function panelOf(tabId: string): string | null {
  return panelIdOfTab(layout.value, tabId);
}

/**
 * 面板里要渲染的页签列表。
 *
 * <p>插槽拿到的是面板节点；这里收敛成「该面板全部页签」，
 * 模板据此把每个会话都挂起来（只显示 activeTab），切换页签时 iframe 不被销毁。</p>
 *
 * @param panel 面板节点（插槽参数）
 * @returns 页签数组；面板异常时给空数组
 */
function panelTabs(panel: unknown): PanelTab[] {
  const p = panel as { tabs?: PanelTab[] } | null;
  return Array.isArray(p?.tabs) ? p.tabs : [];
}

/** 默认只开当前上下文主机一个会话 */
function seedCurrentHost(): void {
  const target = hosts.value.find((h) => h.id === props.hostId);
  if (!target) return;
  const s = buildSession(target);
  sessions.value = [s];
  splitRef.value?.setLayout({
    type: "split",
    direction: "horizontal",
    children: [
      { type: "panel", id: "panel-main", tabs: [tabOf(s)], activeTabId: s.id },
    ],
    sizes: [100],
  });
  syncSnapshot();
}

/** 往锚点页签所在面板追加一个会话；没有锚点时新建单面板布局 */
function addSession(s: Session, anchorTabId?: string): void {
  sessions.value = [...sessions.value, s];
  const anchor = (anchorTabId && panelOf(anchorTabId) ? anchorTabId : liveTabIds()[0]) ?? null;
  if (anchor) {
    splitRef.value?.addTab(anchor, tabOf(s), true);
  } else {
    splitRef.value?.setLayout({
      type: "split",
      direction: "horizontal",
      children: [{ type: "panel", id: "panel-main", tabs: [tabOf(s)], activeTabId: s.id }],
      sizes: [100],
    });
  }
  syncSnapshot();
}

/** 新增主机：挂到指定页签旁边（不拆分） */
function addHostSession(h: Host, anchorTabId?: string): void {
  addSession(buildSession(h), anchorTabId);
  closeCtx();
}

/** 同主机再开一屏：新会话拆到源面板右侧 */
function splitSameHost(tabId: string): void {
  const src = sessionOf(tabId);
  if (!src) return;
  const host = hosts.value.find((h) => h.id === src.hostId);
  if (!host) return;
  const s = buildSession(host, src.protocol);
  const fromPanel = panelOf(tabId);
  sessions.value = [...sessions.value, s];
  if (fromPanel) {
    // splitPanel 的语义是「把页签移出并拆成新面板」：先并入源面板，再拆出去
    splitRef.value?.addTab(tabId, tabOf(s), false);
    splitRef.value?.splitPanel(fromPanel, "horizontal", s.id, "after");
  } else {
    addSession(s, tabId);
  }
  syncSnapshot();
  closeCtx();
}

/** 关闭会话 */
function closeSession(tabId: string): void {
  sessions.value = sessions.value.filter((s) => s.id !== tabId);
  splitRef.value?.removeTab(tabId);
  syncSnapshot();
  closeCtx();
}

/** 关闭其它会话 */
function closeOtherSessions(tabId: string): void {
  for (const id of liveTabIds()) {
    if (id !== tabId) splitRef.value?.removeTab(id);
  }
  sessions.value = sessions.value.filter((s) => s.id === tabId);
  syncSnapshot();
  closeCtx();
}

/* ==================== 共享协同 ==================== */

/** 终端右侧小列面板（片段 / 文件）展开态（任一条会话的工具条图标控制） */
const sidePanelVisible = ref(false);
/** 面板关联的目标会话：谁的工具条打开的，片段就下发给谁的终端 */
const sidePanelSessionId = ref<string>();
const sidePanelSession = computed<Session | null>(() => {
  const id = sidePanelSessionId.value;
  return id ? sessionOf(id) : null;
});

/** 模板里登记的 viewers：页签 id（== 会话 id）→ ScSshDirectViewer */
const viewers = ref<Record<string, any>>({});

/**
 * 模板 ref 回调：把每个会话页签对应的 ScSshDirectViewer 登记到 viewers 里。
 *
 * <p>注意使用形如 `:ref="el => setterViewer(el, tab.id)"` 的函数式 ref，保证在
 * `v-for` 里能准确按页签 id 登记（卸载时 Vue 回传 null，届时清掉映射）。</p>
 *
 * @param el 挂载上来的 viewer（卸载时 Vue 会传 null，届时清掉映射）
 * @param tabId 页签 id（== 会话 id）
 */
function setterViewer(el: any, tabId: string): void {
  if (el) viewers.value[tabId] = el; else delete viewers.value[tabId];
}

/** 片段被双击时，把命令文本下发给当前关联的终端 */
function sendSnippetCommand(command: string): void {
  const s = sidePanelSession.value;
  if (!s) return;
  if (s.protocol !== 'ssh') {
    message.warning(`当前为 ${s.protocol.toUpperCase()} 终端，不支持下发片段：请手动粘贴「${command}」`);
    return;
  }
  const v = viewers.value[s.id];
  if (!v) {
    message.warning('终端画面未挂载，无法下发片段');
    return;
  }
  v.sendCommand(command.trim());
}

/** 切换右侧小列面板：点哪一条会话的工具条，面板就关联哪个终端的 viewer */
function toggleSide(tabId: string): void {
  const id = sidePanelSessionId.value;
  sidePanelSessionId.value = id === tabId ? undefined : tabId;
  sidePanelVisible.value = !!sidePanelSessionId.value;
}

/**
 * 当前登录用户标识。
 *
 * <p>与协同文档同口径：身份由前端显式传给后端（内部登录态功能），
 * 取框架 storage 里的 userInfo，字段优先 sysUserId（与 /v2/user/page 的 userId 一致）。</p>
 */
function currentUserId(): string {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  const id = info.sysUserId ?? info.userId ?? info.id;
  return id == null || id === "" ? "anonymous" : String(id);
}

/** 当前用户显示名（共享成员列表里用） */
function currentUserName(): string {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  const name = info.sysUserNickname ?? info.nickname ?? info.sysUserUsername ?? info.loginName ?? info.username;
  return name == null || name === "" ? currentUserId() : String(name);
}

/** 共享弹框可见 */
const shareVisible = ref(false);
/** 共享弹框作用对象（页签 id） */
const shareTabId = ref("");
/** 共享保存中 */
const shareSaving = ref(false);
/** 可授权用户（打开弹框时才拉，失败降级为空） */
const shareUserOptions = ref<Array<{ userId: string; label: string }>>([]);
let shareUsersLoaded = false;
/** 共享表单 */
const shareForm = ref<{ visibility: TerminalShareVisibility; userIds: string[] }>({
  visibility: "PUBLIC",
  userIds: [],
});

/** 共享弹框对应的会话 */
const shareSession = computed<Session | null>(() => sessionOf(shareTabId.value));

/**
 * 打开「共享」弹框。
 *
 * <p>首次共享时表单默认公开（与协同文档「新建即公开」一致）；已共享则回填
 * 现有可见性与授权用户。</p>
 *
 * @param tabId 页签标识
 */
function openShare(tabId: string): void {
  const s = sessionOf(tabId);
  if (!s) return;
  shareTabId.value = tabId;
  shareForm.value = {
    visibility: s.share?.visibility ?? "PUBLIC",
    userIds: s.share?.allowedUserIds ? [...s.share.allowedUserIds] : [],
  };
  shareVisible.value = true;
  closeCtx();
  void loadShareUsers();
}

/** 拉取可选授权用户（同一会话内只拉一次） */
async function loadShareUsers(): Promise<void> {
  if (shareUsersLoaded) return;
  shareUserOptions.value = await listUsersForPicker();
  shareUsersLoaded = true;
}

/**
 * 保存共享设置（新建或更新）。
 *
 * <p>新建时本地生成房间号 —— 房间号就是「同一条终端会话」的凭据，被邀请方凭它
 * 接入同一条 SSH 连接，而不是另开一条。</p>
 */
async function saveShare(): Promise<void> {
  const s = shareSession.value;
  if (!s) return;
  shareSaving.value = true;
  try {
    const userIds = shareForm.value.visibility === "PRIVATE" ? shareForm.value.userIds : [];
    let share: TerminalShareInfo;
    if (s.share?.shareId) {
      share = await updateTerminalShareAccess(
        s.share.shareId,
        shareForm.value.visibility,
        userIds,
        currentUserId(),
      );
    } else {
      share = await createTerminalShare({
        hostId: s.hostId,
        hostName: s.hostName,
        roomId: `room-${s.id}-${Date.now().toString(36)}`,
        userId: currentUserId(),
        visibility: shareForm.value.visibility,
        userIds,
      });
    }
    applyShare(s.id, share);
    shareVisible.value = false;
    message.success(s.share ? "共享权限已更新" : "已开启共享，被邀请用户可协同操作该终端");
  } catch (e) {
    message.error(e instanceof Error ? e.message : "共享设置失败");
  } finally {
    shareSaving.value = false;
  }
}

/**
 * 勾选 / 取消授权用户。
 *
 * @param userId 用户标识
 */
function toggleShareUser(userId: string): void {
  const list = shareForm.value.userIds;
  shareForm.value = {
    ...shareForm.value,
    userIds: list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId],
  };
}

/**
 * 把共享记录写回会话（终端连接随之更新，接入同一房间）。
 *
 * <p>页签标签由布局树持有，不去改它（改标签要重排布局树，会打断用户正在拖的分栏）；
 * 「共享中」的状态放在会话状态条上，既可见又不影响版式。</p>
 *
 * @param tabId 页签标识
 * @param share 共享记录
 */
function applyShare(tabId: string, share: TerminalShareInfo): void {
  sessions.value = sessions.value.map((s) =>
    s.id === tabId
      ? {
          ...s,
          share,
          connection: {
            ...s.connection,
            roomId: share.roomId,
            userName: currentUserName(),
            userId: currentUserId(),
            writable: share.canWrite,
          },
        }
      : s,
  );
}

/** 共享状态文案（状态条展示） */
function shareLabel(s: Session): string {
  const sh = s.share;
  if (!sh) return "";
  return sh.visibility === "PUBLIC"
    ? "共享中 · 公开"
    : `共享中 · 私有（${sh.allowedUserIds.length} 人）`;
}

/**
 * 取消共享（仅发起者）。
 *
 * <p>取消后本会话退回到独占终端：连接对象去掉 roomId，被邀请方随房间解散断开。</p>
 */
async function cancelShare(): Promise<void> {
  const s = shareSession.value;
  if (!s?.share) return;
  shareSaving.value = true;
  try {
    await deleteTerminalShare(s.share.shareId, currentUserId());
    sessions.value = sessions.value.map((item) =>
      item.id === s.id
        ? {
            ...item,
            share: null,
            connection: { ...item.connection, roomId: null, userName: null, writable: undefined },
          }
        : item,
    );
    shareVisible.value = false;
    message.success("已取消共享，该终端恢复独占");
  } catch (e) {
    message.error(e instanceof Error ? e.message : "取消共享失败");
  } finally {
    shareSaving.value = false;
  }
}

/**
 * 加入别人共享的终端。
 *
 * <p>可见性由后端按当前账号过滤（与协同文档列表同一规则）：<b>公开全员可见；
 * 私有仅发起者与被授权用户可见</b>。列表里能看到的都能协同操作；再按房间号
 * 确认一次 {@code canWrite} 兜住「列表拉完之后权限被改」的时间窗 ——
 * 无权限就明确拒绝，而不是给一个看着能量、实际写不进去的假终端。</p>
 */
async function joinSharedTerminal(): Promise<void> {
  closeCtx();
  const hostId = sessions.value[0]?.hostId ?? props.hostId;
  if (!hostId) {
    message.warning("请先打开一台主机的终端，再加入共享");
    return;
  }
  let list: TerminalShareInfo[] = [];
  try {
    list = (await listTerminalShares(hostId, currentUserId())) ?? [];
  } catch (e) {
    message.error(e instanceof Error ? e.message : "读取共享终端失败");
    return;
  }
  if (!list.length) {
    message.info("当前主机暂无可加入的共享终端");
    return;
  }
  const target = list.find((s) => !s.isOwner) ?? list[0];
  // 加入前再按房间号确认一次权限：列表可能刚被发起者改过（拒绝越权接入）
  let verified = target;
  try {
    verified = await getTerminalShareByRoom(target.roomId, currentUserId());
  } catch (e) {
    message.error(e instanceof Error ? e.message : "该共享终端不存在或已取消");
    return;
  }
  if (!verified.canWrite) {
    message.warning("当前账号没有该终端「共享协同」权限，请联系发起者授权");
    return;
  }
  addSession(buildSharedSession(verified), liveTabIds()[0]);
  message.success(`已加入共享终端（${verified.hostName || "主机"}），可与发起者协同操作`);
}

/**
 * 构造「加入共享」会话。
 *
 * @param share 共享记录
 * @returns 绑定到该房间的会话
 */
function buildSharedSession(share: TerminalShareInfo): Session {
  const host = hosts.value.find((h) => h.id === share.hostId);
  const proto = host ? defaultProtocolOf(host) : "ssh";
  const name = share.hostName || host?.serverHostName || `#${share.hostId}`;
  return {
    id: `term-${++sessionSeq}`,
    hostId: share.hostId,
    hostName: name,
    hostAddress: host?.serverHostAddress ?? "",
    protocol: proto,
    latencyLevel: host?.serverHostOnline === 1 ? "low" : "offline",
    share,
    connection: {
      hostId: share.hostId,
      hostName: `${name} (${host?.serverHostAddress ?? "-"})`,
      address: host?.serverHostAddress ?? "",
      protocol: proto,
      identityId: null,
      targetPort: host ? remotePortOf(host) : 22,
      mode: host ? remoteModeOf(host) : "DIRECT",
      roomId: share.roomId,
      userName: currentUserName(),
      userId: currentUserId(),
      writable: share.canWrite,
    },
  };
}

/* ==================== 延迟色条 ==================== */

function latencyColor(level: string): string {
  if (level === "low") return "#22c55e";
  if (level === "medium") return "#f59e0b";
  if (level === "high") return "#ef4444";
  return "#6b7280";
}

function latencyLabel(level: string): string {
  if (level === "low") return "低延迟";
  if (level === "medium") return "中延迟";
  if (level === "high") return "高延迟";
  return "离线";
}

function latencyDotClass(level: string): string {
  if (level === "low") return "is-direct";
  if (level === "medium") return "is-guacd";
  if (level === "high") return "is-high";
  return "is-none";
}

/** 每 15 秒模拟一次延迟波动（在线主机随机切换 low/medium/high） */
let latencyTimer: ReturnType<typeof setInterval> | null = null;
function startLatencySimulation(): void {
  if (latencyTimer) return;
  latencyTimer = setInterval(() => {
    for (const s of sessions.value) {
      if (s.latencyLevel === "offline") continue;
      const r = Math.random();
      if (r < 0.7) s.latencyLevel = "low";
      else if (r < 0.9) s.latencyLevel = "medium";
      else s.latencyLevel = "high";
    }
  }, 15000);
}
startLatencySimulation();
onBeforeUnmount(() => {
  if (latencyTimer) clearInterval(latencyTimer);
  latencyTimer = null;
});

/* ==================== 工具条 ==================== */

const TB = [
  { key: "files", label: "文件", icon: "FolderOpened" },
  { key: "docker", label: "Docker", icon: "Box" },
  { key: "k8s", label: "K8s", icon: "Coin" },
  { key: "tunnel", label: "隧道", icon: "Connection" },
  { key: "share", label: "共享", icon: "Share" },
];

function handleToolbarAction(key: string, s: Session): void {
  if (key === "files") {
    toggleSftp(s.id);
    return;
  }
  if (key === "share") {
    openShare(s.id);
    return;
  }
  if (key === "k8s") {
    emit("open-panel", "k8s", s.hostId, s.hostName);
    return;
  }
  const panel = key === "tunnel" ? "tunnel" : "docker";
  emit("open-panel", panel, s.hostId, s.hostName);
}

/** 每会话的 SFTP 抽屉开关（同时只开一个） */
const sftpFor = ref<Record<string, boolean>>({});
const sftpSession = computed<Session | null>(() => {
  const open = Object.entries(sftpFor.value).find(([, v]) => v);
  return open ? sessionOf(open[0]) : null;
});

function toggleSftp(sid: string): void {
  const next = !sftpFor.value[sid];
  const all: Record<string, boolean> = {};
  for (const s of sessions.value) all[s.id] = false;
  if (next) all[sid] = true;
  sftpFor.value = all;
}

function closeSftp(): void {
  const all: Record<string, boolean> = {};
  for (const s of sessions.value) all[s.id] = false;
  sftpFor.value = all;
}

/* ==================== 右键菜单 ==================== */

const ctx = ref<{
  x: number;
  y: number;
  visible: boolean;
  tabId: string | null;
  panelId: string | null;
}>({ x: 0, y: 0, visible: false, tabId: null, panelId: null });

/** 右键菜单坐标（截断避免溢出视口） */
function ctxStyle(): { left: string; top: string } {
  const { x, y } = ctx.value;
  const top = Math.min(y, Math.max(0, window.innerHeight - 320));
  const left = Math.min(x, Math.max(0, window.innerWidth - 240));
  return { left: `${left}px`, top: `${top}px` };
}

/**
 * 右键：优先认页签（新增主机挂在它旁边 / 同主机分屏 / 关闭），
 * 其次认面板（新增主机到该面板），最后是画布空白。
 */
function onContextMenu(e: MouseEvent): void {
  e.preventDefault();
  const target = e.target as HTMLElement | null;
  const tabEl = target?.closest<HTMLElement>(".panel-tab");
  const panelEl = target?.closest<HTMLElement>(".layout-panel");
  ctx.value = {
    x: e.clientX,
    y: e.clientY,
    visible: true,
    tabId: tabEl?.dataset.tabId ?? null,
    panelId: panelEl?.dataset.panelId ?? null,
  };
}

function closeCtx(): void {
  ctx.value = { ...ctx.value, visible: false };
}

/** 候选主机（右键「新增主机」里列出全部在线/离线主机，允许同机多开） */
const ctxHosts = computed<Host[]>(() => hosts.value);

/* ==================== 空态 ==================== */

/** 无可渲染会话（未加载出主机 / 主机上下文缺失） */
const isEmpty = computed(() => sessions.value.length === 0);

/** 当前主机（标题提示用） */
const currentHostLabel = computed(() => {
  const s = sessions.value[0];
  return s ? s.hostName : props.hostName || "未绑定主机";
});
</script>

<template>
  <div class="scr" :class="{ 'is-empty': isEmpty }" @contextmenu="onContextMenu" @click="closeCtx">
    <div v-if="error" class="scr-error">
      <ReIcon name="WarningFilled" :size="14" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="loading && !hosts.length" class="scr-loading-state">
      <el-empty description="正在读取主机列表…" />
    </div>

    <template v-else>
        <div class="scr-body">
          <ReSplitLayout
            ref="splitRef"
            class="scr-split"
            :default-layout="defaultLayout"
            @change="onLayoutChange"
          >
            <template #panel="{ activeTab, panel }">
          <div class="scr-panel">
            <!-- 该面板的全部会话都渲染，只显示激活页签：切页签不销毁 SSH -->
            <div
              v-for="tab in panelTabs(panel)"
              :key="tab.id"
              v-show="tab.id === activeTab?.id"
              class="scr-session"
            >
              <template v-if="sessionOf(tab.id)">
                <div class="scr-session__bar">
                  <i class="scr-status-dot" :class="latencyDotClass(sessionOf(tab.id)!.latencyLevel)" />
                  <span class="scr-session__name">{{ sessionOf(tab.id)!.hostName }}</span>
                  <span class="scr-session__proto">{{ sessionOf(tab.id)!.protocol.toUpperCase() }}</span>
                  <span class="scr-session__latency">{{ latencyLabel(sessionOf(tab.id)!.latencyLevel) }}</span>
                  <!-- 共享状态：让别人一眼看出来这条终端是共享中 / 自己是只读 -->
                  <span
                    v-if="sessionOf(tab.id)!.share"
                    class="scr-session__share"
                    :class="{ 'is-readonly': sessionOf(tab.id)!.share!.canWrite === false }"
                    :title="sessionOf(tab.id)!.share!.canWrite === false ? '当前账号无协同操作权限，终端只读' : '共享中，被邀请用户可协同操作'"
                  >
                    <ReIcon :name="sessionOf(tab.id)!.share!.canWrite === false ? 'Lock' : 'Share'" :size="10" />
                    {{ shareLabel(sessionOf(tab.id)!) }}
                  </span>
                  <span class="scr-session__spacer" />
                  <span class="scr-session__addr">{{ sessionOf(tab.id)!.hostAddress }}</span>
                </div>

                <div class="scr-session__content" :style="{ '--latency': latencyColor(sessionOf(tab.id)!.latencyLevel) }">
                  <ScSshDirectViewer
                    v-if="sessionOf(tab.id)!.protocol === 'ssh' || sessionOf(tab.id)!.protocol === 'telnet'"
                    :connection="sessionOf(tab.id)!.connection"
                    hide-close
                    :ref="el => setterViewer(el, tab.id)"
                  />
                  <ScVncDirectViewer
                    v-else-if="sessionOf(tab.id)!.protocol === 'vnc' && sessionOf(tab.id)!.connection.mode === 'DIRECT'"
                    :connection="sessionOf(tab.id)!.connection"
                    hide-close
                  />
                  <ScRdpDirectViewer
                    v-else-if="sessionOf(tab.id)!.protocol === 'rdp' && sessionOf(tab.id)!.connection.mode === 'DIRECT'"
                    :connection="sessionOf(tab.id)!.connection"
                    hide-close
                  />
                  <ScGuacViewer v-else :connection="sessionOf(tab.id)!.connection" inline />
                  <div v-if="sessionOf(tab.id)!.connection.mode === 'NONE'" class="scr-session__placeholder">
                    <ReIcon name="InfoFilled" :size="16" />
                    <span>该主机无需远程通道，请使用本机客户端连接</span>
                  </div>
                </div>

                <div class="scr-toolbar">
                  <button
                    v-for="t in TB"
                    :key="t.key"
                    type="button"
                    class="scr-tool-btn"
                    :title="`${t.label}（${sessionOf(tab.id)!.hostName}）`"
                    @click.stop="handleToolbarAction(t.key, sessionOf(tab.id)!)"
                  >
                    <ReIcon :name="t.icon" :size="11" />
                    <span>{{ t.label }}</span>
                  </button>
                  <button
                    type="button"
                    class="scr-tool-btn"
                    :title="sidePanelVisible && sidePanelSessionId === tab.id ? '收起右侧面板' : '文件与片段（双击下发到终端）'"
                    @click.stop="toggleSide(tab.id)"
                  >
                    <ReIcon :name="sidePanelVisible && sidePanelSessionId === tab.id ? 'Fold' : 'Files'" :size="11" />
                    <span>片段</span>
                  </button>
                  <span class="scr-toolbar__spacer" />
                  <button
                    type="button"
                    class="scr-tool-btn"
                    title="同主机再开一屏（拆到右侧）"
                    @click.stop="splitSameHost(tab.id)"
                  >
                    <ReIcon name="CopyDocument" :size="11" />
                    <span>分屏</span>
                  </button>
                  <button
                    type="button"
                    class="scr-tool-btn"
                    title="关闭该终端"
                    @click.stop="closeSession(tab.id)"
                  >
                    <ReIcon name="Close" :size="11" />
                  </button>
                </div>
              </template>
            </div>
          </div>
        </template>
      </ReSplitLayout>

      <!-- 终端右侧小列面板：文件管理 / 命令片段（按关联的会话下发片段） -->
      <ScTerminalSidePanel
        v-if="sidePanelVisible && sidePanelSession"
        :host-id="sidePanelSession!.hostId"
        :host-name="sidePanelSession!.hostName"
        :visible="sidePanelVisible"
        @update:visible="(v: boolean) => { sidePanelVisible = v; if (!v) sidePanelSessionId = undefined }"
        :on-command="sendSnippetCommand"
      />
      </div>

      <!-- 空态：没有会话时铺在分栏区域上（面板本身没有页签可渲染） -->
      <div v-if="isEmpty" class="scr-empty">
        <div class="scr-empty__icon">
          <ReIcon name="Monitor" :size="30" />
        </div>
        <h3>还没有终端</h3>
        <p>右键此处选择一台主机开始 · 当前上下文：{{ currentHostLabel }}</p>
        <button type="button" class="scr-btn scr-btn--primary" @click.stop="loadHosts">
          <ReIcon name="RefreshRight" :size="12" />重新读取主机
        </button>
      </div>
    </template>

    <!-- SFTP 抽屉 -->
    <ReDrawer
      :model-value="!!sftpSession"
      :title="sftpSession ? `文件管理 · ${sftpSession.hostName}` : '文件管理'"
      direction="rtl"
      size="720px"
      destroy-on-close
      :footer-hidden="true"
      @update:model-value="(v: boolean) => { if (!v) closeSftp(); }"
      @close="closeSftp"
    >
      <template #content>
        <ScSftpPanel v-if="sftpSession" :key="sftpSession.id" :host-id="sftpSession.hostId" />
      </template>
    </ReDrawer>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="ctx.visible" class="scr-ctx-backdrop" @mousedown="closeCtx" @contextmenu.prevent="closeCtx" />
      <div v-if="ctx.visible" class="scr-ctx" :style="ctxStyle()" @contextmenu.prevent>
        <!-- 页签上右键 -->
        <template v-if="ctx.tabId">
          <div class="scr-ctx__label">{{ sessionOf(ctx.tabId)?.hostName ?? "终端" }}</div>
          <div class="scr-ctx__item" @click="openShare(ctx.tabId!)">
            <span class="scr-ctx__item-icon"><ReIcon name="Share" :size="14" /></span>
            <span class="scr-ctx__item-name">{{ sessionOf(ctx.tabId!)?.share ? "共享权限 / 邀请用户" : "共享该终端（邀请用户协同）" }}</span>
          </div>
          <div class="scr-ctx__item" @click="splitSameHost(ctx.tabId!)">
            <span class="scr-ctx__item-icon"><ReIcon name="CopyDocument" :size="14" /></span>
            <span class="scr-ctx__item-name">同主机再开一屏（右侧分栏）</span>
          </div>
          <div class="scr-ctx__item" @click="closeOtherSessions(ctx.tabId!)">
            <span class="scr-ctx__item-icon"><ReIcon name="CircleClose" :size="14" /></span>
            <span class="scr-ctx__item-name">关闭其它终端</span>
          </div>
          <div class="scr-ctx__item scr-ctx__item--danger" @click="closeSession(ctx.tabId!)">
            <span class="scr-ctx__item-icon"><ReIcon name="Delete" :size="14" /></span>
            <span class="scr-ctx__item-name">关闭该终端</span>
          </div>
        </template>

        <!-- 空白 / 面板右键：新增主机 -->
        <template v-else>
          <div class="scr-ctx__label">新增终端</div>
          <template v-if="ctxHosts.length">
            <div
              v-for="h in ctxHosts.slice(0, 10)"
              :key="h.id"
              class="scr-ctx__item"
              @click="addHostSession(h)"
            >
              <span class="scr-ctx__item-icon"><ReIcon name="Monitor" :size="14" /></span>
              <div class="scr-ctx__item-info">
                <span class="scr-ctx__item-name">{{ h.serverHostName }}</span>
                <span class="scr-ctx__item-addr">{{ h.serverHostAddress }} · {{ h.serverHostOnline === 1 ? "在线" : "离线" }}</span>
              </div>
            </div>
          </template>
          <div v-else class="scr-ctx__empty">还没有可用主机</div>
          <div class="scr-ctx__item" @click="joinSharedTerminal()">
            <span class="scr-ctx__item-icon"><ReIcon name="Share" :size="14" /></span>
            <span class="scr-ctx__item-name">加入别人共享的终端</span>
          </div>
          <div class="scr-ctx__item" @click="loadHosts(); closeCtx()">
            <span class="scr-ctx__item-icon"><ReIcon name="RefreshRight" :size="14" /></span>
            <span class="scr-ctx__item-name">刷新主机列表</span>
          </div>
        </template>
      </div>
    </Teleport>

    <!-- 共享终端：邀请用户协同操作（口径与文件协同一致：公开 / 私有 + 授权用户） -->
    <ReDialog
      v-model="shareVisible"
      :title="shareSession?.share ? `共享权限 · ${shareSession?.hostName ?? ''}` : `共享终端 · ${shareSession?.hostName ?? ''}`"
      width="560px"
      confirm-text="保存共享"
      ok-text="保存共享"
      cancel-text="取消"
      :confirm-loading="shareSaving"
      :footer-hidden="false"
      @ok="saveShare"
      @cancel="shareVisible = false"
    >
      <div class="scr-share">
        <div class="scr-share__hint">
          <ReIcon name="InfoFilled" :size="12" />
          <span>共享后，被邀请用户接入的是<strong>同一条 SSH 连接</strong>，可一起操作这台主机的终端。</span>
        </div>

        <div class="scr-share__field">
          <span class="scr-share__label">谁可以使用</span>
          <div class="scr-share__vis">
            <button
              type="button"
              class="scr-share__vis-btn"
              :class="{ 'is-on': shareForm.visibility === 'PUBLIC' }"
              @click="shareForm.visibility = 'PUBLIC'"
            >
              <ReIcon name="Share" :size="12" />
              <span>公开 · 全员可协同操作</span>
            </button>
            <button
              type="button"
              class="scr-share__vis-btn"
              :class="{ 'is-on': shareForm.visibility === 'PRIVATE' }"
              @click="shareForm.visibility = 'PRIVATE'"
            >
              <ReIcon name="Lock" :size="12" />
              <span>私有 · 仅指定用户</span>
            </button>
          </div>
          <span class="scr-share__desc">
            {{ shareForm.visibility === "PUBLIC"
              ? "任何登录用户都能加入这条终端并协同操作。"
              : "只有下面勾选的用户能加入，其余账号打开后为只读（无操作权限）。" }}
          </span>
        </div>

        <div v-if="shareForm.visibility === 'PRIVATE'" class="scr-share__field">
          <span class="scr-share__label">授权用户（{{ shareForm.userIds.length }} 人）</span>
          <div class="scr-share__users">
            <label
              v-for="u in shareUserOptions"
              :key="u.userId"
              class="scr-share__user"
              :class="{ 'is-on': shareForm.userIds.includes(u.userId) }"
            >
              <input
                type="checkbox"
                :checked="shareForm.userIds.includes(u.userId)"
                @change="toggleShareUser(u.userId)"
              />
              <span>{{ u.label }}</span>
            </label>
            <div v-if="!shareUserOptions.length" class="scr-share__empty">暂无可授权用户</div>
          </div>
        </div>

        <div v-if="shareSession?.share" class="scr-share__field">
          <span class="scr-share__label">共享标识</span>
          <div class="scr-share__kv">
            <span>房间</span><code>{{ shareSession.share.roomId }}</code>
            <span>发起者</span><code>{{ shareSession.share.owner }}</code>
            <span>权限</span>
            <code>
              {{ shareSession.share.isOwner ? "我发起的（可改权限 / 取消共享）"
                : shareSession.share.canWrite ? "可协同操作" : "只读（无操作权限）" }}
            </code>
          </div>
          <button
            v-if="shareSession.share.isOwner"
            type="button"
            class="scr-share__danger"
            :disabled="shareSaving"
            @click="cancelShare"
          >
            <ReIcon name="CircleClose" :size="12" />取消共享
          </button>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.scr {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 10px 12px;
  box-sizing: border-box;
}

/* ==================== 分栏骨架 ==================== */
.scr :deep(.re-split-layout) {
  flex: 1;
  min-height: 0;
  background: var(--el-bg-color, #16181d);
  border-radius: 10px;
}
.scr :deep(.panel-tab-bar) {
  background: var(--el-fill-color-light, #1c1f26);
}
.scr-split { flex: 1; min-width: 0; min-height: 0; }

/* ==================== 单个会话 ==================== */
.scr-panel { height: 100%; min-height: 0; display: flex; }
.scr-session {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.scr-session__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  font-size: 11px;
  color: var(--el-text-color-secondary, #8a909c);
  background: var(--el-fill-color-lighter, #191c22);
  border-bottom: 1px solid var(--el-border-color-extra-light, #23262d);
}
.scr-session__name { font-weight: 600; color: var(--el-text-color-primary, #e8eaf0); }
.scr-session__proto {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--el-color-primary, #6d5dfc);
  padding: 1px 5px;
  background: color-mix(in srgb, var(--el-color-primary, #6d5dfc) 15%, transparent);
  border-radius: 4px;
}
.scr-session__latency { font-size: 10px; }
/* 共享状态徽标：共享中 / 只读，与协议徽标区分开 */
.scr-session__share {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--el-color-primary, #6d5dfc);
  background: color-mix(in srgb, var(--el-color-primary, #6d5dfc) 15%, transparent);
  &.is-readonly {
    color: var(--el-color-warning-dark-2, #b45309);
    background: var(--el-color-warning-light-9, rgba(245, 158, 11, 0.15));
  }
}
.scr-session__spacer { flex: 1; }
.scr-session__addr {
  font-size: 10px;
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
}
.scr-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  &.is-direct { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.45); }
  &.is-guacd { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.45); }
  &.is-high { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.45); }
  &.is-none { background: #6b7280; }
}

.scr-session__content {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-left: 3px solid var(--latency, #22c55e);
  background: #0f1115;
}
.scr-session__content > :deep(.ssh-wrap),
.scr-session__content > :deep(.guac-wrap--inline),
.scr-session__content > :deep(.vnc-wrap) {
  height: 100%;
  min-height: 0;
}
.scr-session__content > :deep(.ssh-status) { display: none; }
.scr-session__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  background: #0f1115;
}

/* ==================== 底部工具条 ==================== */
.scr-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
  padding: 3px 6px;
  background: var(--el-fill-color-lighter, #191c22);
  border-top: 1px solid var(--el-border-color-extra-light, #23262d);
}
.scr-toolbar__spacer { flex: 1; }
.scr-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font: inherit;
  font-size: 11px;
  color: var(--el-text-color-secondary, #8a909c);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    color: var(--el-text-color-primary, #e8eaf0);
    background: var(--el-fill-color, rgba(255, 255, 255, 0.06));
  }
}

/* ==================== 错误 / 加载 / 空态 ==================== */
.scr-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: var(--el-color-danger, #ef4444);
  background: color-mix(in srgb, var(--el-color-danger, #ef4444) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger, #ef4444) 30%, transparent);
  border-radius: 10px;
}
.scr-loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.scr-empty {
  position: absolute;
  inset: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  pointer-events: none;
}
.scr-empty > * { pointer-events: auto; }
.scr-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: var(--el-text-color-placeholder, #4a4d55);
  background: var(--el-fill-color-light, rgba(255, 255, 255, 0.04));
  border-radius: 50%;
}
.scr-empty h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular, #8a909c);
}
.scr-empty p {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #6b7280);
}
.scr-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular, #c6cad3);
  background: var(--el-fill-color-light, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--el-border-color, #3a3d45);
  border-radius: 8px;
  cursor: pointer;
  &:hover { color: var(--el-text-color-primary, #fff); }
}
.scr-btn--primary {
  color: #fff;
  background: var(--el-color-primary, #6d5dfc);
  border-color: transparent;
}

/* ==================== 右键菜单 ==================== */
.scr-ctx-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
}
.scr-ctx {
  position: fixed;
  z-index: 2001;
  display: flex;
  flex-direction: column;
  min-width: 220px;
  max-height: 340px;
  overflow: auto;
  padding: 6px;
  background: var(--el-bg-color-overlay, #1f2228);
  border: 1px solid var(--el-border-color, #2d3038);
  border-radius: 10px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}
.scr-ctx__label {
  padding: 6px 10px 8px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-text-color-placeholder, #6b7280);
}
.scr-ctx__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  &:hover { background: var(--el-fill-color, rgba(255, 255, 255, 0.06)); }
}
.scr-ctx__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary, #8a909c);
}
.scr-ctx__item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.scr-ctx__item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary, #e8eaf0);
}
.scr-ctx__item-addr { font-size: 11px; color: var(--el-text-color-placeholder, #6b7280); }
.scr-ctx__item--danger {
  &:hover { background: color-mix(in srgb, var(--el-color-danger, #ef4444) 10%, transparent); }
  .scr-ctx__item-icon, .scr-ctx__item-name { color: var(--el-color-danger, #ef4444); }
}
.scr-ctx__empty {
  padding: 12px;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder, #6b7280);
}

/* ==================== 共享弹框 ==================== */
.scr-share {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 2px;
}
.scr-share__hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 9px 11px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular, #b9bfcc);
  background: var(--el-fill-color-lighter, #191c22);
  border-radius: 8px;
  strong { color: var(--el-text-color-primary, #e8eaf0); }
}
.scr-share__field { display: flex; flex-direction: column; gap: 8px; }
.scr-share__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #e8eaf0);
}
.scr-share__desc { font-size: 11px; line-height: 1.6; color: var(--el-text-color-placeholder, #6b7280); }
.scr-share__vis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.scr-share__vis-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 11px;
  font-size: 12px;
  color: var(--el-text-color-regular, #b9bfcc);
  background: var(--el-fill-color-lighter, #191c22);
  border: 1px solid var(--el-border-color-extra-light, #23262d);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  &.is-on {
    color: var(--el-color-primary, #6d5dfc);
    border-color: var(--el-color-primary, #6d5dfc);
    background: color-mix(in srgb, var(--el-color-primary, #6d5dfc) 12%, transparent);
  }
}
.scr-share__users {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  max-height: 190px;
  overflow: auto;
  padding: 8px;
  background: var(--el-fill-color-lighter, #191c22);
  border: 1px solid var(--el-border-color-extra-light, #23262d);
  border-radius: 8px;
}
.scr-share__user {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  font-size: 12px;
  color: var(--el-text-color-regular, #b9bfcc);
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: var(--el-fill-color, rgba(255, 255, 255, 0.06)); }
  &.is-on { color: var(--el-color-primary, #6d5dfc); }
  input { accent-color: var(--el-color-primary, #6d5dfc); }
}
.scr-share__empty {
  grid-column: 1 / -1;
  padding: 10px;
  font-size: 12px;
  text-align: center;
  color: var(--el-text-color-placeholder, #6b7280);
}
.scr-share__kv {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 6px 10px;
  padding: 9px 11px;
  font-size: 11px;
  color: var(--el-text-color-secondary, #8a909c);
  background: var(--el-fill-color-lighter, #191c22);
  border-radius: 8px;
  code {
    font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
    color: var(--el-text-color-primary, #e8eaf0);
    word-break: break-all;
  }
}
/* 取消共享：发起者操作，用危险色但与「关闭终端」区分（这里是可逆的撤销共享） */
.scr-share__danger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-color-danger, #ef4444);
  background: color-mix(in srgb, var(--el-color-danger, #ef4444) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger, #ef4444) 35%, transparent);
  border-radius: 7px;
  cursor: pointer;
  &:disabled { opacity: 0.55; cursor: not-allowed; }
}
/* 分栏骨架 + 右侧小列面板并排：布局占满剩余宽度，右侧面板固定 300px */
.scr-body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 10px;
}
</style>
