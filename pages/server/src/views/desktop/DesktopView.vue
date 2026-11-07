<!--
  /**
   * 虚拟桌面
   *
   * <p>「通过 SSH 模拟桌面」的落点：外观是 Ubuntu 风格的桌面壳（顶栏 + Dock +
   * 可拖拽窗口），数据面全部走平台已有的 SSH / SFTP / 命令执行 / 指标通道，
   * 所以主机不需要额外装桌面环境，也不镜像真实屏幕。</p>
   *
   * <p>桌面是<b>按主机</b>开的（路由 {@code /desktop/:hostId}）：一台主机一个桌面，
   * 没有全局主机下拉。入口在主机资产页的右键菜单里，换主机就是换桌面。
   * 桌面本身是<b>应用内页签</b>，不进浏览器新标签页；只有单个窗口可以「在新标签页打开」，
   * 那个标签页走 {@code /desktop-window/:hostId?only=<app>}，只渲染这一个窗口。</p>
   *
   * <p>三个刻意的取舍：</p>
   * <ul>
   *   <li>窗口只绑这一台主机：页面里没有「切主机」这种会把已有窗口偷换掉的动作；</li>
   *   <li>最小化只隐藏不销毁：终端是长连接 PTY，销毁等于断线；</li>
   *   <li>不做窗口动画与自由缩放动画：桌面壳的价值在「能用」，不在炫技。</li>
   * </ul>
   */
  -->
<template>
  <!-- 单窗口模式（/desktop-window/:hostId?only=terminal 等）：新标签页里只显示这一个窗口 -->
  <div v-if="singleKey" class="vdesk vdesk--single">
    <div v-if="activeHost" class="vdesk__single">
      <component :is="APP_COMPONENTS[singleKey]" v-bind="propsFor(singleKey, hostId, true)" />
    </div>
    <div v-else-if="ready" class="vdesk__empty">
      <ReIcon name="Monitor" :size="38" />
      <b>请先选择一台主机</b>
      <span>虚拟桌面属于具体主机：在主机资产页的右键菜单里打开某一台主机的桌面</span>
    </div>
    <div v-else class="vdesk__boot">
      <span class="vdesk__boot-dot" />
      正在读取主机…
    </div>
  </div>

  <div v-else ref="rootRef" class="vdesk" @contextmenu.prevent="openDeskMenu">
    <!-- 顶栏：这台主机的桌面，不提供主机切换（换主机请回主机资产页重开） -->
    <header class="vdesk__top">
      <span class="vdesk__host">{{ activeHost?.serverHostName || "未指定主机" }}</span>
      <span v-if="activeHost" class="vdesk__addr">{{ activeHost.serverHostAddress }}</span>
      <span class="vdesk__dot" :class="activeHost?.serverHostOnline === 1 ? 'is-on' : 'is-off'" />
      <span class="vdesk__os">{{ activeHost?.serverHostOsType || "—" }}</span>
      <span class="vdesk__spacer" />
      <span class="vdesk__clock">{{ clock }}</span>
      <button type="button" class="vdesk__act" title="全屏 / 退出全屏" @click="toggleFullscreen">
        <ReIcon name="FullScreen" :size="12" />
      </button>
      <button type="button" class="vdesk__act" title="返回主机资产" @click="leave">
        <ReIcon name="Back" :size="12" />
      </button>
    </header>

    <!-- Dock：只列这台主机真的能用的应用（没有主机就没有 Dock） -->
    <nav v-if="activeHost" class="vdesk__dock">
      <button
        v-for="a in dockApps"
        :key="a.key"
        type="button"
        class="dock"
        :class="{ 'is-running': hasWindow(a.key), 'is-off': a.off }"
        :title="a.off ? `${a.hint}（${a.offReason}）` : a.hint"
        @click="openApp(a.key)"
      >
        <ReIcon :name="a.icon" :size="19" />
        <span class="dock__label">{{ a.label }}</span>
      </button>
      <i class="dock__sep" />
      <button type="button" class="dock" title="重新读取这台主机" @click="reloadHost">
        <ReIcon name="RefreshRight" :size="17" />
        <span class="dock__label">刷新</span>
      </button>
    </nav>

    <!-- 窗口层 -->
    <div class="vdesk__layer">
      <div
        v-for="w in windows"
        :key="w.id"
        v-show="!w.min"
        class="vwin"
        :class="{ 'is-active': activeId === w.id }"
        :style="winStyle(w)"
        @pointerdown="focus(w.id)"
      >
        <div class="vwin__bar" @pointerdown="startDrag($event, w)" @dblclick="toggleMax(w)" @contextmenu.prevent.stop="openWinMenu($event, w)">
          <span class="vwin__title">{{ w.title }}</span>
          <span class="vwin__btns">
            <button type="button" title="在新标签页打开（只显示这个窗口）" @pointerdown.stop @click.stop="popOut(w)">
              <ReIcon name="TopRight" :size="11" />
            </button>
            <button type="button" title="最小化" @pointerdown.stop @click.stop="minimize(w)">
              <ReIcon name="Minus" :size="11" />
            </button>
            <button type="button" :title="w.max ? '还原' : '最大化'" @pointerdown.stop @click.stop="toggleMax(w)">
              <ReIcon :name="w.max ? 'CopyDocument' : 'FullScreen'" :size="11" />
            </button>
            <button type="button" class="is-close" title="关闭" @pointerdown.stop @click.stop="closeWin(w)">
              <ReIcon name="Close" :size="11" />
            </button>
          </span>
        </div>
        <div class="vwin__body">
          <component :is="APP_COMPONENTS[w.app]" v-bind="appProps(w)" />
        </div>
        <span v-if="!w.max" class="vwin__grip" @pointerdown.stop="startResize($event, w)" />
      </div>
    </div>

    <!-- 空桌面提示 -->
    <div v-if="ready && activeHost && !windows.length" class="vdesk__empty">
      <ReIcon name="Monitor" :size="38" />
      <b>从左侧 Dock 打开「{{ activeHost.serverHostName }}」的应用</b>
      <span>终端、文件、监控、命令都是对这台主机的真实操作</span>
    </div>

    <!-- 没有带主机进来：桌面是按主机开的，不做全局页 -->
    <div v-if="ready && !activeHost" class="vdesk__empty">
      <ReIcon name="Monitor" :size="38" />
      <b>请先选择一台主机</b>
      <span>虚拟桌面属于具体主机：在主机资产页的右键菜单里打开某一台主机的桌面</span>
      <button type="button" class="vdesk__go" @click="leave">去主机资产</button>
    </div>

    <!-- 加载态 -->
    <div v-if="!ready" class="vdesk__boot">
      <span class="vdesk__boot-dot" />
      正在读取主机…
    </div>

    <!--
      桌面右键菜单：接管浏览器原生菜单。
      为什么必须自己画：浏览器原生菜单会把桌面壳当成普通网页（出现「另存为 / 检查」），
      用户右键想找的是「开着台机器能做什么」。
    -->
    <Teleport to="body">
      <div v-if="deskMenu.open" class="dctx-mask" @pointerdown="closeDeskMenu" @contextmenu.prevent="closeDeskMenu" />
      <div
        v-if="deskMenu.open"
        class="dctx"
        :style="{ left: `${deskMenu.x}px`, top: `${deskMenu.y}px` }"
        role="menu"
        @contextmenu.prevent
      >
        <div class="dctx__head">
          <b>{{ deskMenu.win ? deskMenu.win.title : activeHost?.serverHostName || "虚拟桌面" }}</b>
          <span v-if="!deskMenu.win && activeHost" class="mono">{{ activeHost.serverHostAddress }}</span>
        </div>

        <template v-if="deskMenu.win">
          <button type="button" class="dctx__item" @click="menuWin('min')">
            <ReIcon name="Minus" :size="13" /><span>最小化</span>
          </button>
          <button type="button" class="dctx__item" @click="menuWin('max')">
            <ReIcon name="FullScreen" :size="13" /><span>{{ deskMenu.win.max ? "还原" : "最大化" }}</span>
          </button>
          <button type="button" class="dctx__item" @click="menuWin('pop')">
            <ReIcon name="TopRight" :size="13" /><span>在新标签页打开</span>
          </button>
          <div class="dctx__sep" />
          <button type="button" class="dctx__item is-danger" @click="menuWin('close')">
            <ReIcon name="Close" :size="13" /><span>关闭窗口</span>
          </button>
        </template>

        <template v-else>
          <button
            v-for="a in dockApps"
            :key="a.key"
            type="button"
            class="dctx__item"
            :class="{ 'is-off': a.off }"
            :title="a.off ? a.offReason : a.hint"
            @click="menuApp(a.key)"
          >
            <ReIcon :name="a.icon" :size="13" /><span>{{ a.label }}</span>
            <em v-if="a.off" class="dctx__off">{{ a.offReason }}</em>
          </button>
          <div class="dctx__sep" />
          <button type="button" class="dctx__item" @click="menuRefresh">
            <ReIcon name="RefreshRight" :size="13" /><span>刷新主机状态</span>
          </button>
          <button type="button" class="dctx__item is-danger" :disabled="!windows.length" @click="menuCloseAll">
            <ReIcon name="CircleClose" :size="13" /><span>关闭所有窗口</span>
          </button>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import useTabsStore from "@repo/pinia/modules/tabs";
import { getHost } from "../../api";
import type { DesktopAppDef, DesktopAppKey, DesktopHost, DesktopWindow } from "./types";
import DesktopTerminal from "./apps/DesktopTerminal.vue";
import DesktopFiles from "./apps/DesktopFiles.vue";
import DesktopMonitor from "./apps/DesktopMonitor.vue";
import DesktopConsole from "./apps/DesktopConsole.vue";

/** 顶栏高度（窗口拖拽的上边界） */
const TOP_H = 34;
/** Dock 宽度（窗口拖拽的左边界） */
const DOCK_W = 78;
/** 窗口最小尺寸 */
const MIN_W = 380;
const MIN_H = 240;

/**
 * Dock 上的应用。
 *
 * <p>桌面是「用 SSH 把一台主机模拟成桌面」，所以这里没有屏幕镜像类的应用：
 * 所有窗口的数据面都是 SSH / SFTP / 命令执行 / 指标，主机不需要额外安装任何东西。</p>
 */
const APPS: DesktopAppDef[] = [
  { key: "terminal", label: "终端", icon: "Monitor", w: 900, h: 540, hint: "SSH 终端（直连 PTY）" },
  { key: "files", label: "文件", icon: "FolderOpened", w: 900, h: 560, hint: "通过 SFTP 浏览远端文件" },
  { key: "monitor", label: "监控", icon: "Odometer", w: 520, h: 470, hint: "CPU / 内存 / 磁盘 / IO" },
  { key: "console", label: "命令", icon: "Promotion", w: 840, h: 540, hint: "执行命令（记入执行日志）" },
];

/** 应用 → 组件 */
const APP_COMPONENTS: Record<DesktopAppKey, Component> = {
  terminal: DesktopTerminal,
  files: DesktopFiles,
  monitor: DesktopMonitor,
  console: DesktopConsole,
};

const route = useRoute();
const router = useRouter();
const tabsStore = useTabsStore();

/** 桌面壳根节点：窗口坐标以它为参照（应用内页签里不是整个视口） */
const rootRef = ref<HTMLElement | null>(null);
/** 桌面可用区域（内容区尺寸，不是 window.innerWidth/innerHeight） */
const viewW = ref(window.innerWidth);
const viewH = ref(window.innerHeight);

/** 这台桌面归属的主机（路由参数，页面里不提供切换） */
const hostId = ref(0);
const host = ref<DesktopHost | null>(null);
const windows = ref<DesktopWindow[]>([]);
const activeId = ref("");
const ready = ref(false);
const clock = ref("");
let zSeed = 10;
let clockTimer: number | undefined;
let resizeObserver: ResizeObserver | undefined;
let seq = 0;

const activeHost = computed(() => host.value);

/**
 * 桌面右键菜单状态。
 *
 * <p>win 为空表示在桌面空白处右键（应用菜单），否则是某个窗口标题栏右键（窗口菜单）。</p>
 */
const deskMenu = ref<{
  open: boolean;
  x: number;
  y: number;
  win: DesktopWindow | null;
}>({ open: false, x: 0, y: 0, win: null });

/**
 * 单窗口模式：路由带 {@code ?only=<app>} 时只渲染这一个桌面窗口。
 *
 * <p>桌面里的每个窗口都能「在新标签页打开」，新标签页只放这一个窗口，
 * 用来把终端 / 文件 / 监控里的某一个单独摆到第二块屏幕上，不再套 Dock 与顶栏。</p>
 */
const singleKey = computed<DesktopAppKey | null>(() => {
  const raw = Array.isArray(route.query.only) ? route.query.only[0] : route.query.only;
  const key = String(raw ?? "").trim();
  return (APPS.some((a) => a.key === key) ? key : null) as DesktopAppKey | null;
});

/**
 * 当前时刻（每 15 秒刷新一次，分钟精度不需要每秒重排）。
 */
function tickClock(): void {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 路由里的主机标识：优先路径参数，其次兼容旧的 {@code ?hostId=} 链接。
 *
 * @returns 主机标识；没带或非法时为 0
 */
function parseHostId(): number {
  const raw = Array.isArray(route.params.hostId) ? route.params.hostId[0] : route.params.hostId;
  const fromPath = Number(raw);
  if (Number.isFinite(fromPath) && fromPath > 0) return fromPath;
  const fromQuery = Number(route.query.hostId);
  return Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : 0;
}

/**
 * 读取这台主机的台账行（桌面的唯一数据源）。
 */
async function reloadHost(): Promise<void> {
  const id = parseHostId();
  if (!id) {
    host.value = null;
    ready.value = true;
    return;
  }
  try {
    host.value = (await getHost(id)) as DesktopHost;
    hostId.value = id;
  } catch (e) {
    host.value = null;
    ElMessage.error(`主机 ${id} 读取失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    ready.value = true;
  }
}

/**
 * 某台主机的台账行。
 *
 * @param id 主机标识
 */
function hostOf(id: number): DesktopHost | undefined {
  return host.value?.id === id ? host.value : undefined;
}

/**
 * 测量桌面可用区域。
 *
 * <p>桌面是应用内页签里的外壳，盖的是内容区（而不是整个视口），
 * 所以窗口坐标与最大化尺寸必须以根节点尺寸为准。</p>
 *
 * <p>根节点没有尺寸时（被 keep-alive 藏起来、首帧还没布局完）保留上一次的值，
 * 不能按 0 计算，否则从别的页签切回来时窗口会被压到最小。</p>
 *
 * @returns 这次是否测到了有效尺寸
 */
function measure(): boolean {
  const el = rootRef.value;
  const w = el?.clientWidth ?? 0;
  const h = el?.clientHeight ?? 0;
  if (w <= 0 || h <= 0) return false;
  viewW.value = w;
  viewH.value = h;
  return true;
}

/** 这台主机能不能走 SSH 数据面：只看台账开关，不再按「本机采集」一刀切 */
const sshReady = computed(() => {
  const h = host.value;
  if (!h) return false;
  return (h.serverHostSshEnabled ?? 1) !== 0;
});

/**
 * Dock 上真正可用的应用：不可用的照样显示，但降档并说明原因。
 */
const dockApps = computed(() => {
  const h = host.value;
  // 没有主机就没有 Dock：桌面是按主机开的，不做「全局应用栏」
  if (!h) return [];
  const online = h.serverHostOnline === 1;
  return APPS.map((a) => {
    if (a.key === "monitor") return { ...a, off: false, offReason: "" };
    if (!sshReady.value) return { ...a, off: true, offReason: "台账未开启 SSH" };
    return { ...a, off: !online, offReason: online ? "" : "主机离线" };
  });
});

/**
 * 应用不可用的原因（可用时为空串）。
 *
 * @param key 应用标识
 */
function appOffReason(key: DesktopAppKey): string {
  return dockApps.value.find((a) => a.key === key)?.offReason ?? "";
}

/**
 * Dock 上是否已有该应用的窗口。
 *
 * @param key 应用标识
 */
function hasWindow(key: DesktopAppKey): boolean {
  return windows.value.some((w) => w.app === key && w.hostId === hostId.value);
}

/**
 * 打开应用。同主机同应用只开一个窗口，重复点击回到已有窗口。
 *
 * @param key 应用标识
 */
function openApp(key: DesktopAppKey): void {
  const h = host.value;
  if (!h) {
    ElMessage.warning("请先从主机资产页打开某一台主机的虚拟桌面");
    return;
  }
  // 不可用的应用：说清原因，并退到一个一定能开的窗口，别留一个空桌面
  const reason = appOffReason(key);
  if (reason) {
    ElMessage.warning(`${h.serverHostName} 的${APPS.find((a) => a.key === key)?.label ?? "应用"}不可用：${reason}`);
    if (key !== "monitor") openApp("monitor");
    return;
  }
  const exist = windows.value.find((w) => w.app === key && w.hostId === h.id);
  if (exist) {
    exist.min = false;
    focus(exist.id);
    return;
  }
  const def = APPS.find((a) => a.key === key);
  if (!def) return;
  const n = windows.value.length;
  const maxW = Math.max(MIN_W, viewW.value - DOCK_W - 40);
  const maxH = Math.max(MIN_H, viewH.value - TOP_H - 40);
  const w = Math.min(def.w, maxW);
  const hh = Math.min(def.h, maxH);
  const win: DesktopWindow = {
    id: `w${++seq}`,
    app: key,
    hostId: h.id,
    title: `${def.label} · ${h.serverHostName}`,
    x: Math.min(DOCK_W + 14 + (n % 5) * 26, Math.max(DOCK_W + 8, viewW.value - w - 16)),
    y: Math.min(TOP_H + 12 + (n % 5) * 24, Math.max(TOP_H + 8, viewH.value - hh - 16)),
    w,
    h: hh,
    z: ++zSeed,
    min: false,
    max: false,
  };
  windows.value.push(win);
  focus(win.id);
}

/**
 * 聚焦窗口。
 *
 * @param id 窗口标识
 */
function focus(id: string): void {
  activeId.value = id;
  const w = windows.value.find((x) => x.id === id);
  if (w) w.z = ++zSeed;
}

/**
 * 最小化：只隐藏，不销毁（终端 PTY 必须保住）。
 *
 * @param w 窗口
 */
function minimize(w: DesktopWindow): void {
  w.min = true;
  if (activeId.value === w.id) activeId.value = "";
}

/**
 * 关闭并销毁窗口。
 *
 * @param w 窗口
 */
function closeWin(w: DesktopWindow): void {
  windows.value = windows.value.filter((x) => x.id !== w.id);
  if (activeId.value === w.id) activeId.value = "";
}

/**
 * 最大化 / 还原。
 *
 * @param w 窗口
 */
function toggleMax(w: DesktopWindow): void {
  if (w.max) {
    if (w.restore) {
      w.x = w.restore.x;
      w.y = w.restore.y;
      w.w = w.restore.w;
      w.h = w.restore.h;
    }
    w.max = false;
    w.restore = undefined;
    return;
  }
  w.restore = { x: w.x, y: w.y, w: w.w, h: w.h };
  w.max = true;
  w.x = DOCK_W;
  w.y = TOP_H + 6;
  w.w = viewW.value - DOCK_W - 8;
  w.h = viewH.value - TOP_H - 12;
}

/**
 * 窗口内联样式。
 *
 * @param w 窗口
 */
function winStyle(w: DesktopWindow): Record<string, string> {
  return {
    left: `${w.x}px`,
    top: `${w.y}px`,
    width: `${w.w}px`,
    height: `${w.h}px`,
    zIndex: String(w.z),
  };
}

/**
 * 按应用类型给窗口内容传参，避免多余属性落到子组件根节点上。
 *
 * @param key 应用标识
 * @param id 主机标识
 * @param active 窗口是否获得焦点
 */
function propsFor(key: DesktopAppKey, id: number, active: boolean): Record<string, unknown> {
  const h = hostOf(id);
  const base = { hostId: id, active };
  if (key === "terminal") {
    return { ...base, hostName: h?.serverHostName ?? "" };
  }
  if (key === "console") {
    return { ...base, hostName: h?.serverHostName ?? "", osType: h?.serverHostOsType ?? "" };
  }
  return base;
}

/**
 * 窗口内容传参。
 *
 * @param w 窗口
 */
function appProps(w: DesktopWindow): Record<string, unknown> {
  return propsFor(w.app, w.hostId, activeId.value === w.id);
}

/**
 * 在新标签页打开这个窗口：新标签页只显示它自己（{@code ?only=<app>}）。
 *
 * <p>走独立的 {@code /desktop-window/:hostId} 路由（standalone），
 * 所以新标签页里没有侧边栏、页签栏和桌面壳，只有这一个窗口。</p>
 *
 * <p>终端是长连接 PTY，新标签页会自己再建一条会话，和当前窗口互不影响。</p>
 *
 * @param w 窗口
 */
function popOut(w: DesktopWindow): void {
  const url = `${location.origin}${location.pathname}#/desktop-window/${w.hostId}?only=${w.app}`;
  const win = window.open(url, "_blank");
  if (!win) ElMessage.warning("浏览器拦截了弹出窗口，请允许后重试");
  closeDeskMenu();
}

/**
 * 拖拽标题栏移动窗口。
 *
 * @param e 指针事件
 * @param w 窗口
 */
function startDrag(e: PointerEvent, w: DesktopWindow): void {
  if (w.max) return;
  focus(w.id);
  const sx = e.clientX;
  const sy = e.clientY;
  const ox = w.x;
  const oy = w.y;
  const move = (ev: PointerEvent) => {
    w.x = Math.max(DOCK_W + 2, Math.min(ox + ev.clientX - sx, viewW.value - 120));
    w.y = Math.max(TOP_H + 2, Math.min(oy + ev.clientY - sy, viewH.value - 48));
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/**
 * 右下角拖拽改尺寸。
 *
 * @param e 指针事件
 * @param w 窗口
 */
function startResize(e: PointerEvent, w: DesktopWindow): void {
  if (w.max) return;
  focus(w.id);
  const sx = e.clientX;
  const sy = e.clientY;
  const ow = w.w;
  const oh = w.h;
  const move = (ev: PointerEvent) => {
    w.w = Math.max(MIN_W, Math.min(ow + ev.clientX - sx, viewW.value - w.x - 6));
    w.h = Math.max(MIN_H, Math.min(oh + ev.clientY - sy, viewH.value - w.y - 6));
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/**
 * 视口 / 内容区变化时把窗口收回可视区（最大化窗口同步铺满）。
 */
function onViewportResize(): void {
  if (!measure()) return;
  for (const w of windows.value) {
    if (w.max) {
      w.w = viewW.value - DOCK_W - 8;
      w.h = viewH.value - TOP_H - 12;
      continue;
    }
    w.w = Math.min(w.w, Math.max(MIN_W, viewW.value - DOCK_W - 20));
    w.h = Math.min(w.h, Math.max(MIN_H, viewH.value - TOP_H - 20));
    w.x = Math.max(DOCK_W + 2, Math.min(w.x, viewW.value - 120));
    w.y = Math.max(TOP_H + 2, Math.min(w.y, viewH.value - 48));
  }
}

/**
 * 浏览器全屏切换。
 */
function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  } else {
    document.documentElement.requestFullscreen().catch(() => ElMessage.warning("当前浏览器拒绝全屏"));
  }
}

/**
 * 返回主机资产页。
 */
function leave(): void {
  router.push("/assets");
}

/**
 * 进入（或换成）一台主机的桌面：清掉上一台的窗口，再落一个窗口。
 *
 * <p>路由参数变化时组件实例会被复用，所以这里必须自己把窗口清干净，
 * 否则从 {@code /desktop/13} 导航到 {@code /desktop} 会带着上一台主机的窗口。</p>
 */
async function bootHost(): Promise<void> {
  windows.value = [];
  activeId.value = "";
  ready.value = false;
  closeDeskMenu();
  await reloadHost();
  if (!host.value) return;
  syncTabTitle();
  // 单窗口模式：只给 ?only= 指定的那个应用，没有 Dock 也没有其它窗口
  if (singleKey.value) return;
  // 桌面是用 SSH 把主机模拟出来：在线且开着 SSH 就落地给终端，
  // 否则落到监控（监控走平台自己的指标通道，不依赖 SSH）。
  if (host.value.serverHostOnline === 1 && sshReady.value) {
    openApp("terminal");
    return;
  }
  openApp("monitor");
}

/**
 * 把当前页签的标题补上主机名。
 *
 * <p>页签是路由切换时按 {@code meta.title} 建好的，那时还没读到主机；
 * 读完台账再补一次，用户才能在多个主机桌面之间分清哪个是哪个。</p>
 */
function syncTabTitle(): void {
  const name = host.value?.serverHostName;
  if (!name) return;
  const tab = tabsStore.tabList.find((item: { path?: string }) => item.path === route.path) as
    | { title?: string }
    | undefined;
  if (tab) tab.title = `虚拟桌面 · ${name}`;
}

/**
 * 在桌面空白处右键：打开应用菜单。
 *
 * @param e 右键事件（由外层统一 preventDefault，浏览器原生菜单不再出现）
 */
function openDeskMenu(e: MouseEvent): void {
  if (!host.value) return;
  placeDeskMenu(e.clientX, e.clientY, null);
}

/**
 * 在窗口标题栏右键：打开这个窗口的菜单。
 *
 * @param e 右键事件
 * @param w 窗口
 */
function openWinMenu(e: MouseEvent, w: DesktopWindow): void {
  placeDeskMenu(e.clientX, e.clientY, w);
}

/**
 * 摆放右键菜单（贴着鼠标，超出右/下边界时翻转）。
 *
 * @param x 鼠标 clientX
 * @param y 鼠标 clientY
 * @param w 目标窗口；空表示桌面菜单
 */
function placeDeskMenu(x: number, y: number, w: DesktopWindow | null): void {
  const W = 186;
  const H = w ? 150 : 220;
  deskMenu.value = {
    open: true,
    win: w,
    x: Math.max(8, Math.min(x, window.innerWidth - W - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - H - 8)),
  };
}

/** 关闭右键菜单 */
function closeDeskMenu(): void {
  if (deskMenu.value.open) deskMenu.value.open = false;
  deskMenu.value.win = null;
}

/**
 * 桌面右键菜单 → 打开应用。
 *
 * @param key 应用标识
 */
function menuApp(key: DesktopAppKey): void {
  closeDeskMenu();
  openApp(key);
}

/** 桌面右键菜单 → 重新读取主机 */
function menuRefresh(): void {
  closeDeskMenu();
  void reloadHost().then(syncTabTitle);
}

/** 桌面右键菜单 → 关闭所有窗口 */
function menuCloseAll(): void {
  closeDeskMenu();
  windows.value = [];
  activeId.value = "";
}

/**
 * 窗口右键菜单的动作分发。
 *
 * @param action 动作
 */
function menuWin(action: "min" | "max" | "pop" | "close"): void {
  const w = deskMenu.value.win;
  if (!w) return;
  closeDeskMenu();
  if (action === "min") minimize(w);
  else if (action === "max") toggleMax(w);
  else if (action === "pop") popOut(w);
  else closeWin(w);
}

onMounted(async () => {
  tickClock();
  clockTimer = window.setInterval(tickClock, 15000);
  window.addEventListener("resize", onViewportResize);
  await nextTick();
  measure();
  if (rootRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => onViewportResize());
    resizeObserver.observe(rootRef.value);
  }
  await bootHost();
});

// 同一页内换主机（改路径参数）时按新主机重建桌面
watch(
  () => route.fullPath,
  () => {
    if (route.name === "VirtualDesktop" || route.name === "VirtualDesktopWindow") void bootHost();
  },
);

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  window.removeEventListener("resize", onViewportResize);
  resizeObserver?.disconnect();
  resizeObserver = undefined;
});
</script>

<style scoped>
.vdesk {
  /*
    应用内页签：外壳盖住内容区（.main-content 是 position: relative），
    不再 fixed 到整个视口，否则会压住侧边栏与顶部页签栏。
    单窗口弹出页由 .vdesk--single 改回 fixed。
  */
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: var(--font-sans, "Segoe UI", "Microsoft YaHei", system-ui, sans-serif);
  color: #efeaf7;
  user-select: none;
  background:
    radial-gradient(1100px 780px at 18% 8%, rgba(122, 45, 92, 0.55) 0%, transparent 62%),
    radial-gradient(900px 680px at 86% 92%, rgba(233, 84, 32, 0.22) 0%, transparent 58%),
    linear-gradient(158deg, #2c0d27 0%, #1b0716 58%, #120510 100%);
}

/* 单窗口模式（新标签页）：整页只有这一个窗口，不留 Dock / 顶栏 */
.vdesk--single {
  position: fixed;
  display: flex;
  flex-direction: column;
}

.vdesk__single {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ---------- 顶栏 ---------- */
.vdesk__top {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  gap: 10px;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.vdesk__host {
  max-width: 260px;
  overflow: hidden;
  font-size: 11.5px;
  font-weight: 600;
  color: #f2edf8;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vdesk__addr {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  color: #b9b4c2;
}

.vdesk__dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.vdesk__dot.is-on {
  background: #3fbf7f;
  box-shadow: 0 0 0 3px rgba(63, 191, 127, 0.18);
}

.vdesk__dot.is-off {
  background: #8f8a9b;
}

.vdesk__os {
  font-size: 11px;
  color: #b9b4c2;
}

.vdesk__spacer {
  flex: 1;
}

.vdesk__clock {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
  color: #efeaf7;
}

.vdesk__act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 20px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.vdesk__act:hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.35);
  border-color: rgba(233, 84, 32, 0.6);
}

/* ---------- Dock ---------- */
.vdesk__dock {
  position: absolute;
  top: 50%;
  left: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 58px;
  padding: 9px 6px;
  background: rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 16px;
  transform: translateY(-50%);
}

.dock {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  color: #d8d3e0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 11px;
  transition: background 0.14s ease, transform 0.14s ease;
}

.dock:hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.35);
  transform: translateY(-1px);
}

.dock__label {
  font-size: 9.5px;
  line-height: 1;
  color: #b9b4c2;
}

/* 这台主机用不了的应用：照样留在 Dock 上，但降一档并说明原因 */
.dock.is-off {
  opacity: 0.45;
}

.dock.is-running::after {
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 4px;
  height: 4px;
  content: "";
  background: #e95420;
  border-radius: 50%;
  transform: translateX(-50%);
}

.dock__sep {
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.14);
}

/* ---------- 窗口 ---------- */
.vdesk__layer {
  position: absolute;
  inset: 0;
}

.vwin {
  position: absolute;
  display: flex;
  flex-direction: column;
  min-width: 380px;
  min-height: 240px;
  overflow: hidden;
  background: #16141c;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 10px;
  box-shadow: 0 22px 56px rgba(0, 0, 0, 0.55);
}

.vwin.is-active {
  border-color: rgba(233, 84, 32, 0.55);
  box-shadow: 0 26px 68px rgba(0, 0, 0, 0.66), 0 0 0 1px rgba(233, 84, 32, 0.35);
}

.vwin__bar {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  height: 30px;
  padding: 0 8px 0 10px;
  cursor: move;
  background: linear-gradient(#3a3440, #2a2530);
  border-bottom: 1px solid rgba(0, 0, 0, 0.35);
}

.vwin.is-active .vwin__bar {
  background: linear-gradient(#453a4d, #2f2836);
}

.vwin__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 11.5px;
  color: #ded8e6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vwin__btns {
  display: flex;
  flex: none;
  gap: 4px;
}

.vwin__btns button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 18px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

.vwin__btns button:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.vwin__btns button.is-close:hover {
  background: #d33a2c;
  border-color: #d33a2c;
}

.vwin__body {
  position: relative;
  flex: 1;
  min-height: 0;
}

.vwin__grip {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
}

.vwin__grip::after {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 6px;
  height: 6px;
  content: "";
  border-right: 1.5px solid rgba(255, 255, 255, 0.35);
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.35);
}

/* ---------- 空桌面 / 加载 ---------- */
.vdesk__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.vdesk__empty b {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.vdesk__empty span {
  font-size: 11.5px;
}

/* 没带主机时给一个回主机的出口；容器本身 pointer-events:none，按钮要自己收回 */
.vdesk__go {
  margin-top: 4px;
  padding: 4px 12px;
  font-size: 11.5px;
  color: #fff;
  cursor: pointer;
  pointer-events: auto;
  background: rgba(233, 84, 32, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
}

.vdesk__go:hover {
  background: #e95420;
}

.vdesk__boot {
  position: absolute;
  right: 0;
  bottom: 14px;
  left: 0;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.6);
}

.vdesk__boot-dot {
  width: 6px;
  height: 6px;
  background: #e95420;
  border-radius: 50%;
  animation: vdesk-pulse 1.1s ease-in-out infinite;
}

@keyframes vdesk-pulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.85);
  }

  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

/* ---------- 桌面右键菜单（替代浏览器原生菜单） ---------- */
.dctx-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.dctx {
  position: fixed;
  z-index: 3001;
  min-width: 176px;
  max-width: 260px;
  padding: 5px;
  color: #efeaf7;
  background: rgba(30, 13, 26, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(18px);
}

.dctx__head {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px 7px;
  margin: -5px -5px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dctx__head b {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dctx__head .mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.5);
}

.dctx__item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  color: #efeaf7;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

.dctx__item:hover {
  background: rgba(233, 84, 32, 0.32);
}

.dctx__item:disabled {
  color: rgba(255, 255, 255, 0.35);
  cursor: not-allowed;
  background: transparent;
}

.dctx__item.is-danger {
  color: #ff8e8e;
}

.dctx__item.is-off {
  color: rgba(255, 255, 255, 0.45);
}

.dctx__item span {
  flex: none;
}

.dctx__off {
  margin-left: auto;
  overflow: hidden;
  font-size: 10.5px;
  font-style: normal;
  color: rgba(255, 255, 255, 0.4);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dctx__sep {
  height: 1px;
  margin: 4px 2px;
  background: rgba(255, 255, 255, 0.1);
}
</style>
