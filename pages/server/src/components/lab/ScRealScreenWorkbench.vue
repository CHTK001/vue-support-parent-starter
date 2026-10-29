<script setup lang="ts">
/**
 * 分屏终端工作台（真实连接版）—— 自由画布
 *
 * <p>把主机资产「远程控制」从单屏升级为多屏：右侧画布上多个屏幕并行，
 * 每个屏幕是一台<b>真实主机</b>的终端，复用现有 viewer（SSH 直连 iframe /
 * VNC 直连 noVNC / Guacd 中转 iframe），不是 mock 终端行。</p>
 *
 * <p>能力来源：</p>
 * <ul>
 *   <li>真实主机列表：{@code queryHosts}（与 TerminalView 同一接口）。</li>
 *   <li>连接构建：协议按主机配置/OS 推断，身份默认空（默认凭据），
 *       与 {@code TerminalView.connection} 同款口径。</li>
 *   <li>渲染分支：SSH→ScSshDirectViewer；VNC+DIRECT→ScVncDirectViewer；
 *       其余（RDP/VNC 经 guacd）→ScGuacViewer。</li>
 * </ul>
 *
 * <p>交互：</p>
 * <ul>
 *   <li>右键画布空白 → 从主机列表挑一台，新增一个屏幕；</li>
 *   <li>右键屏幕头 → 拆分（同主机开第二会话）/ 关闭；</li>
 *   <li>拖动屏幕头自由排布（画布版式）。</li>
 * </ul>
 *
 * <p>每屏底部工具条<b>跟着屏幕走</b>：文件 → 该屏主机的 SFTP 抽屉；
 * Docker / 隧道 → 切到对应工作台面板（以该屏主机为上下文）。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref } from "vue";
import { queryHosts } from "../../api";
import ScSshDirectViewer from "../ScSshDirectViewer.vue";
import ScVncDirectViewer from "../ScVncDirectViewer.vue";
import ScGuacViewer from "../ScGuacViewer.vue";
import ScSftpPanel from "../ScSftpPanel.vue";

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

const emit = defineEmits<{
  /** 点 Docker / 隧道工具条：切到对应工作台面板（带主机上下文） */
  (e: "open-panel", panel: "docker" | "tunnel", hostId: number, hostName: string): void;
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
    // 首屏种子：主机到位后自动开屏（仅当画布尚无屏幕时）
    if (!screens.value.length) seedScreens();
    // 启动延迟模拟
    startLatencySimulation();
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}
onMounted(loadHosts);

/** 主机默认协议（与 TerminalView.defaultProtocolOf 同口径） */
function defaultProtocolOf(h: Host): string {
  const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (configured === "SSH" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
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
  return p === "rdp" ? 3389 : 5900;
}

/** 生效远控通道（协议联动）：SSH/VNC 平台自研直连，仅 RDP 必须 guacd 中转；显式 NONE 尊重 */
function remoteModeOf(h: Host): string {
  if (defaultProtocolOf(h) === "rdp") return "GUACD";
  const mode = (h.serverHostRemoteMode ?? "").toUpperCase();
  return mode === "NONE" ? "NONE" : "DIRECT";
}

/* ==================== 屏幕模型 ==================== */

interface Screen {
  id: number;
  hostId: number;
  hostName: string;
  hostAddress: string;
  /** 本会话使用的协议 */
  protocol: string;
  /** 连接延迟等级：low=低延迟(绿) medium=中延迟(黄) high=高延迟(红) offline=离线(灰) */
  latencyLevel: "low" | "medium" | "high" | "offline";
  /** 连接对象（传给 viewer） */
  connection: {
    hostId: number;
    hostName: string;
    address: string;
    protocol: string;
    identityId: number | null;
    targetPort: number;
    mode: string;
  };
}

const screens = ref<Screen[]>([]);
/** 屏幕 id 自增序列（不能用 Date.now()：种子三屏在同一毫秒创建会撞 id，导致画布位置互相覆盖、拖动分不清哪块） */
let screenSeq = 0;
/** 画布坐标（百分比） */
const canvasPos = ref<Record<number, { x: number; y: number; w: number; h: number }>>({});
/** 当前激活的屏幕 id（点击即置顶，管理 z-index 层级） */
const activeScreenId = ref<number | null>(null);
/** z-index 计数器：每次点击递增，确保激活的屏永远在最上层 */
let zCounter = 10;

function buildScreen(h: Host, protocol?: string): Screen {
  const proto = protocol || defaultProtocolOf(h);
  const sid = ++screenSeq;
  return {
    id: sid,
    hostId: h.id,
    hostName: h.serverHostName ?? `#${h.id}`,
    hostAddress: h.serverHostAddress ?? "",
    protocol: proto,
    latencyLevel: h.serverHostOnline === 1 ? "low" : "offline",
    connection: {
      hostId: h.id,
      hostName: `${h.serverHostName} (${h.serverHostAddress})`,
      address: h.serverHostAddress ?? "",
      protocol: proto,
      identityId: null,
      targetPort: remotePortOf(h),
      mode: remoteModeOf(h),
    },
  };
}

/** 屏幕展示名：web-01 (SSH) */
function labelOf(s: Screen): string {
  return `${s.hostName} (${s.protocol.toUpperCase()})`;
}

/** 激活屏幕：点击即置顶，z-index 递增确保永远在最上层 */
function activateScreen(sid: number): void {
  activeScreenId.value = sid;
  zCounter++;
}

/** 默认开三个屏幕：在线优先，其次按列表顺序补齐，去重后取前 3（参考图三屏布局的落地版） */
function seedScreens(): void {
  const ordered = [...hosts.value].sort((a, b) => {
    const ao = a.serverHostOnline === 1 ? 0 : 1;
    const bo = b.serverHostOnline === 1 ? 0 : 1;
    return ao - bo || (a.id - b.id);
  });
  const targets: Host[] = [];
  for (const h of ordered) {
    if (targets.length >= 3) break;
    if (!targets.some((t) => t.id === h.id)) targets.push(h);
  }
  for (const h of targets) {
    const s = buildScreen(h);
    screens.value.push(s);
    const i = screens.value.length - 1;
    canvasPos.value[s.id] = { x: 4 + (i % 3) * 22, y: 8 + (i % 2) * 34, w: 56, h: i % 2 === 0 ? 60 : 40 };
  }
}

function addScreenFromHost(h: Host): void {
  const s = buildScreen(h);
  screens.value.push(s);
  const i = screens.value.length;
  canvasPos.value[s.id] = { x: 30 + (i % 3) * 12, y: 12 + (i % 2) * 26, w: 52, h: 34 };
}

function splitScreen(sid: number): void {
  const src = screens.value.find((s) => s.id === sid);
  if (!src) return;
  const host = hosts.value.find((h) => h.id === src.hostId);
  if (!host) return;
  const s = buildScreen(host, src.protocol);
  screens.value.push(s);
  canvasPos.value[s.id] = {
    x: (canvasPos.value[sid]?.x ?? 30) + 6,
    y: (canvasPos.value[sid]?.y ?? 30) + 6,
    w: canvasPos.value[sid]?.w ?? 52,
    h: canvasPos.value[sid]?.h ?? 34,
  };
}

function removeScreen(sid: number): void {
  screens.value = screens.value.filter((s) => s.id !== sid);
  delete canvasPos.value[sid];
}

/** 连接状态按协议分支（与 TerminalView 模板同款） */
function modeOf(s: Screen): string {
  return s.connection.mode;
}

/** 连接状态指示灯 CSS class */
function connectionStatus(mode: string): string {
  if (mode === "DIRECT") return "is-direct";
  if (mode === "GUACD") return "is-guacd";
  return "is-none";
}

/** 连接状态标签文字 */
function connectionModeLabel(mode: string): string {
  if (mode === "DIRECT") return "直连";
  if (mode === "GUACD") return "Guacd";
  return "无需通道";
}

/* ==================== 延迟色条 ==================== */

/** 延迟等级 → 色条颜色 */
function latencyColor(level: string): string {
  if (level === "low") return "#22c55e";
  if (level === "medium") return "#f59e0b";
  if (level === "high") return "#ef4444";
  return "#6b7280";
}

/** 延迟等级 → 中文标签 */
function latencyLabel(level: string): string {
  if (level === "low") return "低延迟";
  if (level === "medium") return "中延迟";
  if (level === "high") return "高延迟";
  return "离线";
}

/** 延迟等级 → 状态点 class */
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
    for (const s of screens.value) {
      if (s.latencyLevel === "offline") continue;
      const r = Math.random();
      if (r < 0.7) s.latencyLevel = "low";
      else if (r < 0.9) s.latencyLevel = "medium";
      else s.latencyLevel = "high";
    }
  }, 15000);
}

/** 工具条动作分发 */
function handleToolbarAction(key: string, s: Screen): void {
  if (key === "files") {
    toggleSftp(s.id);
  } else if (key === "docker") {
    openPanel("docker", s);
  } else if (key === "tunnel") {
    openPanel("tunnel", s);
  } else {
    openPanel("docker", s);
  }
}

/* ==================== 每屏工具条 ==================== */

const TB = [
  { key: "files", label: "文件", icon: "FolderOpened" },
  { key: "docker", label: "Docker", icon: "Box" },
  { key: "tunnel", label: "隧道", icon: "Connection" },
  { key: "service", label: "服务", icon: "SetUp" },
  { key: "metric", label: "主机指标", icon: "TrendCharts" },
];

/** 每屏的 SFTP 抽屉开关 */
const sftpFor = ref<Record<number, boolean>>({});
/** 当前打开的 SFTP 屏（用于抽屉标题/内容绑定） */
const sftpScreen = computed<Screen | null>(() => {
  const open = Object.entries(sftpFor.value).find(([, v]) => v);
  return open ? screens.value.find((s) => s.id === Number(open[0])) ?? null : null;
});

function toggleSftp(sid: number): void {
  const next = !sftpFor.value[sid];
  // 同时只开一个抽屉：先把所有关掉，再开目标屏的
  const all: Record<number, boolean> = {};
  for (const s of screens.value) all[s.id] = false;
  if (next) all[sid] = true;
  sftpFor.value = all;
}

/** 关闭 SFTP 抽屉（清空所有屏的开关） */
function closeSftp(): void {
  const all: Record<number, boolean> = {};
  for (const s of screens.value) all[s.id] = false;
  sftpFor.value = all;
}

/** 右键菜单坐标（模板不能直接访问 window，包一层截断避免溢出视口） */
function ctxStyle(): { left: string; top: string } {
  const { x, y } = ctx.value;
  return { left: `${x}px`, top: `${Math.min(y, window.innerHeight - 220)}px` };
}

function openPanel(panel: "docker" | "tunnel", s: Screen): void {
  emit("open-panel", panel, s.hostId, s.hostName);
}

/* ==================== 右键菜单 ==================== */

const ctx = ref<{ x: number; y: number; visible: boolean; screenId: number | null; isCanvas: boolean }>({
  x: 0,
  y: 0,
  visible: false,
  screenId: null,
  isCanvas: false,
});

function onScreenContext(e: MouseEvent, id: number): void {
  e.preventDefault();
  ctx.value = { x: e.clientX, y: e.clientY, visible: true, screenId: id, isCanvas: false };
}
function onCanvasContext(e: MouseEvent): void {
  e.preventDefault();
  ctx.value = { x: e.clientX, y: e.clientY, visible: true, screenId: null, isCanvas: true };
}
function closeCtx(): void {
  ctx.value = { ...ctx.value, visible: false };
}

/** 右键菜单：候选主机（排除已在屏幕上开过的） */
const ctxHosts = computed<Host[]>(() => {
  const used = new Set(screens.value.map((s) => s.hostId));
  return hosts.value.filter((h) => !used.has(h.id));
});

function pickHostForNewScreen(h: Host): void {
  addScreenFromHost(h);
  closeCtx();
}

/* ==================== 屏幕拖动排布（画布版式） ==================== */

/** 画布元素（拖动换算百分比坐标用） */
const canvasEl = ref<HTMLElement | null>(null);
/** 拖动中的状态：屏幕 id + 起始指针坐标 + 起始百分比坐标 */
const dragState = ref<{ sid: number; startX: number; startY: number; origX: number; origY: number } | null>(null);

/**
 * 按下屏幕头开始拖动。
 *
 * <p>换算口径：指针像素差 → 画布百分比差。拖动过程持续更新 {@code canvasPos[sid]}
 * 的 x/y（百分比），并夹在画布内（不能拖出可视区、不能盖住画布顶部标题）。</p>
 *
 * @param e   指针事件
 * @param sid 屏幕 id
 */
function onHeadDown(e: MouseEvent, sid: number): void {
  // 右键忽略（右键是屏幕头菜单）；点按钮（关闭）不触发拖动
  if (e.button !== 0) return;
  if ((e.target as HTMLElement | null)?.closest("button")) return;
  const pos = canvasPos.value[sid];
  if (!pos) return;
  e.preventDefault();
  dragState.value = { sid, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
  window.addEventListener("mousemove", onHeadMove);
  window.addEventListener("mouseup", onHeadUp);
}

function canvasRect(): { w: number; h: number } {
  const el = canvasEl.value;
  if (!el) return { w: window.innerWidth, h: window.innerHeight };
  const r = el.getBoundingClientRect();
  return { w: r.width, h: r.height };
}

/** 拖动中：更新百分比坐标 */
function onHeadMove(e: MouseEvent): void {
  const d = dragState.value;
  if (!d) return;
  const pos = canvasPos.value[d.sid];
  if (!pos) return;
  const { w, h } = canvasRect();
  if (!w || !h) return;
  const dx = ((e.clientX - d.startX) / w) * 100;
  const dy = ((e.clientY - d.startY) / h) * 100;
  pos.x = clamp(d.origX + dx, 0, Math.max(0, 100 - pos.w));
  pos.y = clamp(d.origY + dy, 0, Math.max(0, 100 - pos.h));
}

/** 结束拖动：清理监听 */
function onHeadUp(): void {
  dragState.value = null;
  window.removeEventListener("mousemove", onHeadMove);
  window.removeEventListener("mouseup", onHeadUp);
}

/** 数值夹取 */
function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * 「新增屏幕」入口：把右键菜单定位到按钮下方（之前硬编码 0,0 导致弹框落到浏览器左上角）。
 *
 * @param e 点击事件
 */
function openAddMenu(e: MouseEvent): void {
  const rect = (e.currentTarget as HTMLElement | null)?.getBoundingClientRect();
  ctx.value = {
    x: rect ? rect.left : 24,
    y: rect ? rect.bottom + 4 : 24,
    visible: true,
    screenId: null,
    isCanvas: true,
  };
}
</script>

<template>
  <div class="scr">
    <!-- 顶部导航栏 -->
    <div class="scr-header">
      <div class="scr-header__left">
        <span class="scr-header__icon">
          <ReIcon name="Grid" :size="14" />
        </span>
        <span class="scr-header__title">分屏终端</span>
        <span class="scr-header__count">{{ screens.length }} 屏</span>
      </div>
      <div class="scr-header__right">
        <span class="scr-header__hint">
          <ReIcon name="Rank" :size="11" />拖动屏幕头排布
        </span>
        <span class="scr-header__divider" />
        <button
          v-if="ctxHosts.length"
          type="button"
          class="scr-btn scr-btn--primary"
          @click="openAddMenu($event)"
        >
          <ReIcon name="Plus" :size="12" />新增屏幕
        </button>
        <button type="button" class="scr-btn" :disabled="loading" @click="loadHosts">
          <ReIcon name="RefreshRight" :size="12" />刷新
        </button>
      </div>
    </div>

    <div v-if="error" class="scr-error">
      <ReIcon name="WarningFilled" :size="14" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="loading && !hosts.length" class="scr-loading-state">
      <el-empty description="正在读取主机列表…" />
    </div>

    <div v-else ref="canvasEl" class="scr-canvas" @contextmenu.prevent="onCanvasContext" @click="closeCtx">
      <!-- 画布网格背景 -->
      <div class="scr-canvas__grid" />

      <!-- 屏幕窗口 -->
      <div
        v-for="s in screens"
        :key="s.id"
        class="scr-window"
        :class="{
          'is-dragging': dragState?.sid === s.id,
          'is-active': activeScreenId === s.id
        }"
        :style="{
          left: canvasPos[s.id]?.x + '%',
          top: canvasPos[s.id]?.y + '%',
          width: canvasPos[s.id]?.w + '%',
          height: canvasPos[s.id]?.h + '%',
          zIndex: activeScreenId === s.id ? zCounter : 10
        }"
        @click.stop="activateScreen(s.id)"
      >
        <!-- 左侧延迟色条 -->
        <div
          class="scr-window__latency-bar"
          :style="{ background: latencyColor(s.latencyLevel) }"
          :title="latencyLabel(s.latencyLevel)"
        />
        <!-- 窗口头部 -->
        <div
          class="scr-window__header"
          :class="{ 'is-dragging': dragState?.sid === s.id }"
          @mousedown="onHeadDown($event, s.id)"
          @contextmenu.prevent="onScreenContext($event, s.id)"
        >
          <div class="scr-window__drag-handle">
            <ReIcon name="Rank" :size="10" />
          </div>
          <div class="scr-window__info">
            <span class="scr-window__name">{{ s.hostName }}</span>
            <span class="scr-window__proto">{{ s.protocol.toUpperCase() }}</span>
          </div>
          <div class="scr-window__status">
            <i class="scr-status-dot" :class="latencyDotClass(s.latencyLevel)" />
            <span class="scr-status-text">{{ latencyLabel(s.latencyLevel) }}</span>
          </div>
          <span class="scr-window__spacer" />
          <button type="button" class="scr-window__close" title="关闭屏幕" @click="removeScreen(s.id)">
            <ReIcon name="Close" :size="12" />
          </button>
        </div>

        <!-- 终端内容区 -->
        <div class="scr-window__content">
          <ScSshDirectViewer v-if="s.protocol === 'ssh'" :connection="s.connection" hide-close />
          <ScVncDirectViewer v-else-if="s.protocol === 'vnc' && modeOf(s) === 'DIRECT'" :connection="s.connection" hide-close />
          <ScGuacViewer v-else :connection="s.connection" inline />
          <div v-if="s.connection.mode === 'NONE'" class="scr-window__placeholder">
            <ReIcon name="InfoFilled" :size="16" />
            <span>该主机无需远程通道，请使用本机客户端连接</span>
          </div>
        </div>

        <!-- 底部工具条 -->
        <div class="scr-toolbar">
          <button
            v-for="t in TB"
            :key="t.key"
            type="button"
            class="scr-tool-btn"
            :title="`${t.label}（${s.hostName}）`"
            @click="handleToolbarAction(t.key, s)"
          >
            <ReIcon :name="t.icon" :size="11" />
            <span>{{ t.label }}</span>
          </button>
          <div class="scr-toolbar__divider" />
          <button type="button" class="scr-tool-btn scr-tool-btn--icon" title="断开重连" @click="removeScreen(s.id)">
            <ReIcon name="RefreshRight" :size="11" />
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!screens.length" class="scr-canvas__empty">
        <div class="scr-empty__icon">
          <ReIcon name="Monitor" :size="32" />
        </div>
        <h3>还没有屏幕</h3>
        <p>右键画布空白处添加主机，或点击左上角「新增屏幕」</p>
      </div>
    </div>

    <!-- SFTP 抽屉 -->
    <ReDrawer
      :model-value="!!sftpScreen"
      :title="sftpScreen ? `文件管理 · ${sftpScreen.hostName}` : '文件管理'"
      direction="rtl"
      size="720px"
      destroy-on-close
      :footer-hidden="true"
      @update:model-value="(v: boolean) => { if (!v) closeSftp(); }"
      @close="closeSftp"
    >
      <template #content>
        <ScSftpPanel v-if="sftpScreen" :key="sftpScreen.id" :host-id="sftpScreen.hostId" />
      </template>
    </ReDrawer>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="ctx.visible" class="scr-ctx-backdrop" @mousedown="closeCtx" @contextmenu.prevent="closeCtx" />
      <div
        v-if="ctx.visible"
        class="scr-ctx"
        :style="ctxStyle()"
        @contextmenu.prevent
      >
        <template v-if="ctx.isCanvas">
          <div class="scr-ctx__label">新增屏幕</div>
          <template v-if="ctxHosts.length">
            <div
              v-for="h in ctxHosts.slice(0, 8)"
              :key="h.id"
              class="scr-ctx__item"
              @click="pickHostForNewScreen(h)"
            >
              <span class="scr-ctx__item-icon">
                <ReIcon name="Monitor" :size="14" />
              </span>
              <div class="scr-ctx__item-info">
                <span class="scr-ctx__item-name">{{ h.serverHostName }}</span>
                <span class="scr-ctx__item-addr">{{ h.serverHostAddress }}</span>
              </div>
            </div>
          </template>
          <div v-else class="scr-ctx__empty">没有更多主机可选</div>
        </template>
        <template v-else>
          <div class="scr-ctx__item" @click="splitScreen(ctx.screenId!)">
            <span class="scr-ctx__item-icon">
              <ReIcon name="Menu" :size="14" />
            </span>
            <span class="scr-ctx__item-name">同主机再开一屏</span>
          </div>
          <div class="scr-ctx__item scr-ctx__item--danger" @click="removeScreen(ctx.screenId!)">
            <span class="scr-ctx__item-icon">
              <ReIcon name="Delete" :size="14" />
            </span>
            <span class="scr-ctx__item-name">关闭该屏幕</span>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.scr {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 10px;
  padding: 12px 14px;
  box-sizing: border-box;
}

/* ==================== 顶部导航栏 ==================== */
.scr-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #1a1d24 0%, #252830 100%);
  border: 1px solid #2d3038;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.scr-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.scr-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #6d5dfc;
  background: rgba(109, 93, 252, 0.15);
  border-radius: 8px;
}
.scr-header__title {
  font-size: 14px;
  font-weight: 700;
  color: #e8eaf0;
}
.scr-header__count {
  font-size: 11px;
  color: #8a909c;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}
.scr-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.scr-header__hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #8a909c;
}
.scr-header__divider {
  width: 1px;
  height: 18px;
  background: #3a3d45;
}
.scr-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #c6cad3;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid #3a3d45;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: #4a4d55;
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.scr-btn--primary {
  color: #fff;
  background: linear-gradient(135deg, #6d5dfc 0%, #8b7dff 100%);
  border-color: transparent;
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c6eff 0%, #9c8eff 100%);
    box-shadow: 0 4px 12px rgba(109, 93, 252, 0.3);
  }
}

/* ==================== 错误和加载状态 ==================== */
.scr-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
}
.scr-loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ==================== 画布 ==================== */
.scr-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #0f1115;
  border: 1px solid #2d3038;
  border-radius: 12px;
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.2);
}
.scr-canvas__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

/* ==================== 空状态 ==================== */
.scr-canvas__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}
.scr-empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  color: #4a4d55;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
}
.scr-canvas__empty h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #8a909c;
}
.scr-canvas__empty p {
  margin: 0;
  font-size: 13px;
  color: #5a5d65;
}

/* ==================== 屏幕窗口 ==================== */
.scr-window {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  min-height: 160px;
  overflow: hidden;
  background: #181b21;
  border: 1px solid #2d3038;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.2s, border-color 0.2s;
  &:hover {
    border-color: #3a3d45;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  &.is-active {
    border-color: #6d5dfc;
    box-shadow: 0 12px 36px rgba(109, 93, 252, 0.25);
  }
  &.is-dragging {
    border-color: #6d5dfc;
    box-shadow: 0 16px 48px rgba(109, 93, 252, 0.35);
    cursor: grabbing;
  }
}

/* ==================== 左侧延迟色条 ==================== */
.scr-window__latency-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  z-index: 5;
  border-radius: 12px 0 0 12px;
  transition: background 0.3s ease;
}

/* ==================== 窗口头部 ==================== */
.scr-window__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 12px;
  background: linear-gradient(180deg, #1f2228 0%, #181b21 100%);
  border-bottom: 1px solid #2d3038;
  cursor: grab;
  user-select: none;
  touch-action: none;
  &:hover { background: linear-gradient(180deg, #252830 0%, #1f2228 100%); }
  &.is-dragging { cursor: grabbing; }
}
.scr-window__drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a4d55;
  &:hover { color: #6a6d75; }
}
.scr-window__info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.scr-window__name {
  font-size: 12.5px;
  font-weight: 600;
  color: #e8eaf0;
  white-space: nowrap;
}
.scr-window__proto {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #6d5dfc;
  padding: 2px 6px;
  background: rgba(109, 93, 252, 0.15);
  border-radius: 4px;
}
.scr-window__status {
  display: flex;
  align-items: center;
  gap: 5px;
}
.scr-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  &.is-direct { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
  &.is-guacd { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
  &.is-high { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
  &.is-none { background: #6b7280; }
}
.scr-status-text {
  font-size: 10px;
  color: #8a909c;
}
.scr-window__spacer { flex: 1; }
.scr-window__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: #6a6d75;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
}

/* ==================== 终端内容区 ==================== */
.scr-window__content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: #0f1115;
}
.scr-window__content > :deep(.ssh-wrap),
.scr-window__content > :deep(.guac-wrap--inline),
.scr-window__content > :deep(.vnc-wrap) {
  height: 100%;
  min-height: 0;
}
.scr-window__content > :deep(.ssh-status) { display: none; }
.scr-window__placeholder {
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
  padding: 4px 8px;
  background: linear-gradient(180deg, #181b21 0%, #1f2228 100%);
  border-top: 1px solid #2d3038;
  border-radius: 0 0 12px 12px;
}
.scr-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font: inherit;
  font-size: 11px;
  color: #8a909c;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    color: #e8eaf0;
    background: rgba(255, 255, 255, 0.06);
  }
}
.scr-tool-btn--icon {
  padding: 4px 6px;
}
.scr-toolbar__divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: #3a3d45;
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
  max-height: 300px;
  overflow: auto;
  padding: 6px;
  background: #1f2228;
  border: 1px solid #2d3038;
  border-radius: 10px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
}
.scr-ctx__label {
  padding: 6px 10px 8px;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}
.scr-ctx__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
}
.scr-ctx__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a909c;
  &:hover { color: #e8eaf0; }
}
.scr-ctx__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.scr-ctx__item-name {
  font-size: 13px;
  font-weight: 500;
  color: #e8eaf0;
}
.scr-ctx__item-addr {
  font-size: 11px;
  color: #6b7280;
}
.scr-ctx__item--danger {
  &:hover { background: rgba(239, 68, 68, 0.1); }
  .scr-ctx__item-icon, .scr-ctx__item-name { color: #ef4444; }
}
.scr-ctx__empty {
  padding: 12px;
  font-size: 12px;
  text-align: center;
  color: #6b7280;
}

/* ==================== 响应式 ==================== */
@media (max-width: 980px) {
  .scr-window {
    position: static;
    margin-bottom: 10px;
    min-width: 0;
    height: 240px !important;
  }
  .scr-header {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>