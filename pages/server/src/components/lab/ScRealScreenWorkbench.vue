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

function buildScreen(h: Host, protocol?: string): Screen {
  const proto = protocol || defaultProtocolOf(h);
  const sid = ++screenSeq;
  return {
    id: sid,
    hostId: h.id,
    hostName: h.serverHostName ?? `#${h.id}`,
    hostAddress: h.serverHostAddress ?? "",
    protocol: proto,
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
    <div class="scr-head">
      <span class="scr-title">分屏终端 · {{ screens.length }} 屏</span>
      <span class="lb-spacer" />
      <span class="lb-dim" style="font-size: 11px">拖动屏幕头排布 · 右键空白处加屏 / 右键屏幕头操作</span>
      <button
        v-if="ctxHosts.length"
        type="button"
        class="lb-btn"
        title="从主机列表挑一台开新屏"
        @click="openAddMenu($event)"
      >
        <ReIcon name="Plus" :size="11" />新增屏幕
      </button>
      <button type="button" class="lb-btn" title="重新加载主机" :disabled="loading" @click="loadHosts">
        <ReIcon name="RefreshRight" :size="11" />刷新
      </button>
    </div>

    <div v-if="error" class="scr-error">{{ error }}</div>
    <div v-else-if="loading && !hosts.length" class="lb-loading">正在读取主机…</div>

    <div v-else ref="canvasEl" class="scr-canvas" @contextmenu.prevent="onCanvasContext" @click="closeCtx">
      <!-- 画布：真实 viewer 屏幕 -->
      <div
        v-for="s in screens"
        :key="s.id"
        class="scr-window"
        :class="{ 'is-dragging': dragState?.sid === s.id }"
        :style="{ left: canvasPos[s.id]?.x + '%', top: canvasPos[s.id]?.y + '%', width: canvasPos[s.id]?.w + '%', height: canvasPos[s.id]?.h + '%' }"
        @click.stop
      >
        <div
          class="scr-window__head"
          :class="{ 'is-dragging': dragState?.sid === s.id }"
          @mousedown="onHeadDown($event, s.id)"
          @contextmenu.prevent="onScreenContext($event, s.id)"
        >
          <ReIcon name="Rank" :size="11" class="scr-drag" />
          <span class="scr-window__label">{{ labelOf(s) }}</span>
          <span class="scr-window__addr">{{ s.hostAddress }}</span>
          <i class="scr-window__dot" :class="s.connection.mode === 'NONE' ? 'is-none' : ''" :title="`通道 ${s.connection.mode}`" />
          <span class="lb-spacer" />
          <span class="lb-dim" style="font-size: 10.5px">{{ s.connection.mode }}</span>
          <button type="button" class="scr-window__x" title="关闭屏幕" @click="removeScreen(s.id)">
            <ReIcon name="Close" :size="11" />
          </button>
        </div>

        <!-- 真实终端渲染分支（与 TerminalView 同款） -->
        <div class="scr-window__body">
          <ScSshDirectViewer v-if="s.protocol === 'ssh'" :connection="s.connection" hide-close />
          <ScVncDirectViewer v-else-if="s.protocol === 'vnc' && modeOf(s) === 'DIRECT'" :connection="s.connection" hide-close />
          <ScGuacViewer v-else :connection="s.connection" inline />
          <div v-if="s.connection.mode === 'NONE'" class="scr-window__none">
            <ReIcon name="InfoFilled" :size="13" />该主机「无需通道」，请用本机客户端连接
          </div>
        </div>

        <!-- 每屏底部工具条：跟着屏幕走 -->
        <div class="lb-toolbar">
          <button
            v-for="t in TB"
            :key="t.key"
            type="button"
            class="lb-tb-btn"
            :title="`${t.label}（${s.hostName}）`"
            @click="t.key === 'files' ? toggleSftp(s.id) : t.key === 'docker' ? openPanel('docker', s) : t.key === 'tunnel' ? openPanel('tunnel', s) : openPanel(t.key === 'service' ? 'docker' : 'docker', s)"
          >
            <ReIcon :name="t.icon" :size="11" />{{ t.label }}
          </button>
          <span class="lb-tb-sep" />
          <button type="button" class="lb-tb-btn" title="断开重连（重挂 iframe）" @click="removeScreen(s.id)">
            <ReIcon name="RefreshRight" :size="11" />
          </button>
        </div>
      </div>

      <div v-if="!screens.length" class="scr-canvas__empty">
        <b>还没有屏幕</b>
        <span>右键画布空白处，从主机列表挑一台开屏；或点左上角「新增屏幕」。</span>
      </div>
    </div>

    <!-- SFTP 抽屉（每屏自己的文件管理，同时只开一个） -->
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
          <div class="scr-ctx__label">新增屏幕 —— 选择主机</div>
          <template v-if="ctxHosts.length">
            <div v-for="h in ctxHosts.slice(0, 8)" :key="h.id" class="scr-ctx__item" @click="pickHostForNewScreen(h)">
              <ReIcon name="Monitor" :size="12" /><span>{{ h.serverHostName }}</span>
              <span class="lb-dim" style="margin-left:auto;font-size:10.5px">{{ h.serverHostAddress }}</span>
            </div>
          </template>
          <div v-else class="scr-ctx__empty">没有更多主机可选</div>
        </template>
        <template v-else>
          <div class="scr-ctx__item" @click="splitScreen(ctx.screenId!)">
            <ReIcon name="Menu" :size="12" /><span>同主机再开一屏</span>
          </div>
          <div class="scr-ctx__item is-bad" @click="removeScreen(ctx.screenId!)">
            <ReIcon name="Close" :size="12" /><span>关闭该屏幕</span>
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
  gap: 8px;
}
.scr-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.scr-title { font-size: 12.5px; font-weight: 700; }
.scr-error {
  padding: 9px 12px;
  font-size: 12.5px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 8px;
}

.scr-canvas {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background-image:
    linear-gradient(rgba(31, 36, 48, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 36, 48, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.scr-canvas__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 12.5px;
}
.scr-canvas__empty b { color: var(--el-text-color-secondary); }

.scr-window {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  min-height: 160px;
  overflow: hidden;
  background: #111111;
  border: 1px solid #333844;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(17, 17, 20, 0.35);
}
.scr-window__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 8px;
  color: #c6cad3;
  background: #1b1d23;
  border-bottom: 1px solid #2a2d35;
  cursor: grab;
  user-select: none;
  touch-action: none;
}
.scr-window__head:hover { background: #22252d; }
.scr-window__head.is-dragging, .scr-window.is-dragging { cursor: grabbing; }
.scr-window.is-dragging { box-shadow: 0 10px 30px rgba(17, 17, 20, 0.55); z-index: 30; }
.scr-window__label { font-size: 12px; font-weight: 600; color: #e8eaf0; white-space: nowrap; }
.scr-window__addr { font-size: 10.5px; color: #8a909c; }
.scr-window__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-success);
}
.scr-window__dot.is-none { background: var(--el-text-color-placeholder); }
.scr-window__x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: #8a909c;
  background: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.scr-window__x:hover { color: #fff; background: #2a2d35; }
.scr-window__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}
.scr-window__body > :deep(.ssh-wrap),
.scr-window__body > :deep(.guac-wrap--inline),
.scr-window__body > :deep(.vnc-wrap) {
  height: 100%;
  min-height: 0;
}
/* SSH viewer 自带的状态条在此隐藏（屏幕头已含主机信息） */
.scr-window__body > :deep(.ssh-status) { display: none; }
.scr-window__none {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: #111111;
}
.scr-window .lb-toolbar { border-radius: 0 0 10px 10px; }

.scr-ctx-backdrop { position: fixed; inset: 0; z-index: 2000; }
.scr-ctx {
  position: fixed;
  z-index: 2001;
  display: flex;
  flex-direction: column;
  min-width: 210px;
  max-height: 280px;
  overflow: auto;
  padding: 4px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 36, 48, 0.16);
}
.scr-ctx__label {
  padding: 4px 9px;
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--el-text-color-placeholder);
}
.scr-ctx__item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  font-size: 12px;
  color: var(--el-text-color-primary);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.scr-ctx__item:hover { background: var(--el-fill-color-light, #f5f7fa); }
.scr-ctx__item.is-bad { color: var(--el-color-danger); }
.scr-ctx__item.is-bad:hover { background: var(--el-color-danger-light-9); }
.scr-ctx__empty { padding: 8px 9px; font-size: 12px; color: var(--el-text-color-placeholder); }

@media (max-width: 980px) {
  .scr-window { position: static; margin-bottom: 8px; min-width: 0; height: 240px !important; }
}
</style>