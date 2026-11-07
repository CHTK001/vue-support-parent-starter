<!--
  /**
   * 虚拟桌面
   *
   * <p>「通过 SSH 模拟桌面」的落点：外观是 Ubuntu 风格的桌面壳（顶栏 + Dock +
   * 可拖拽窗口），数据面全部走平台已有的 SSH / SFTP / 命令执行通道，
   * 所以主机不需要装 VNC、不需要额外桌面环境，Linux / Windows / macOS 都能开。</p>
   *
   * <p>三个刻意的取舍：</p>
   * <ul>
   *   <li>每个窗口只绑打开时那台主机：切顶栏主机不会偷偷把已开的终端换掉；</li>
   *   <li>最小化只隐藏不销毁：终端是长连接 PTY，销毁等于断线；</li>
   *   <li>不做窗口动画与自由缩放动画：桌面壳的价值在「能用」，不在炫技。</li>
   * </ul>
   */
  -->
<template>
  <div class="vdesk">
    <!-- 顶栏 -->
    <header class="vdesk__top">
      <span class="vdesk__brand">虚拟桌面</span>
      <span class="vdesk__sep" />
      <select v-model.number="activeHostId" class="vdesk__sel" @change="onHostChange">
        <option v-if="!hosts.length" :value="0">暂无主机</option>
        <option v-for="h in hosts" :key="h.id" :value="h.id">
          {{ h.serverHostName }} · {{ h.serverHostAddress }}
        </option>
      </select>
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

    <!-- Dock -->
    <nav class="vdesk__dock">
      <button
        v-for="a in APPS"
        :key="a.key"
        type="button"
        class="dock"
        :class="{ 'is-running': hasWindow(a.key), 'is-off': a.key !== 'monitor' && !sshReady(activeHost) }"
        :title="a.key !== 'monitor' && !sshReady(activeHost) ? `${a.hint}（这台主机不支持 SSH）` : a.hint"
        @click="openApp(a.key)"
      >
        <ReIcon :name="a.icon" :size="19" />
        <span class="dock__label">{{ a.label }}</span>
      </button>
      <i class="dock__sep" />
      <button type="button" class="dock" title="刷新主机列表" @click="reloadHosts">
        <ReIcon name="RefreshRight" :size="17" />
        <span class="dock__label">主机</span>
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
        <div class="vwin__bar" @pointerdown="startDrag($event, w)" @dblclick="toggleMax(w)">
          <span class="vwin__title">{{ w.title }}</span>
          <span class="vwin__btns">
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
    <div v-if="ready && !windows.length" class="vdesk__empty">
      <ReIcon name="Monitor" :size="38" />
      <b>选择一台主机，从左侧 Dock 打开应用</b>
      <span>终端、文件、监控、命令都是对这台主机的真实操作</span>
    </div>

    <!-- 加载态 -->
    <div v-if="!ready" class="vdesk__boot">
      <span class="vdesk__boot-dot" />
      正在读取主机列表…
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { queryHosts } from "../../api";
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

/** Dock 上的应用 */
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

const hosts = ref<DesktopHost[]>([]);
const activeHostId = ref(0);
const windows = ref<DesktopWindow[]>([]);
const activeId = ref("");
const ready = ref(false);
const clock = ref("");
let zSeed = 10;
let clockTimer: number | undefined;
let seq = 0;

const activeHost = computed(() => hosts.value.find((h) => h.id === activeHostId.value) ?? null);

/**
 * 当前时刻（每 15 秒刷新一次，分钟精度不需要每秒重排）。
 */
function tickClock(): void {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 主机列表（顶栏下拉与 Dock 的共用数据源）。
 */
async function reloadHosts(): Promise<void> {
  try {
    const list = (await queryHosts({})) ?? [];
    hosts.value = list as DesktopHost[];
    if (!hosts.value.some((h) => h.id === activeHostId.value)) {
      activeHostId.value = hosts.value[0]?.id ?? 0;
    }
  } catch (e) {
    ElMessage.error(`主机列表加载失败：${String((e as Error)?.message ?? e)}`);
    hosts.value = [];
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
  return hosts.value.find((h) => h.id === id);
}

/**
 * 顶栏切主机：已开窗口保留（各自绑着原主机），只影响之后新开的应用。
 */
function onHostChange(): void {
  const h = activeHost.value;
  if (h) ElMessage.success(`当前主机：${h.serverHostName}`);
}

/**
 * Dock 上是否已有该应用的窗口（当前主机）。
 *
 * @param key 应用标识
 */
function hasWindow(key: DesktopAppKey): boolean {
  return windows.value.some((w) => w.app === key && w.hostId === activeHostId.value);
}

/**
 * 这台主机能不能走 SSH 数据面。
 *
 * <p>终端 / 文件 / 命令三条通道都建立在 SSH 之上。后端对
 * {@code serverHostCollectMode=LOCAL} 的主机（平台自身）会直接拒绝，
 * 这里提前判掉，避免用户点开一个只剩报错的窗口。</p>
 *
 * @param h 主机
 */
function sshReady(h: DesktopHost | null | undefined): boolean {
  if (!h || h.serverHostOnline !== 1) return false;
  return String(h.serverHostCollectMode ?? "").toUpperCase() !== "LOCAL";
}

/**
 * 打开应用。同主机同应用只开一个窗口，重复点击回到已有窗口。
 *
 * @param key 应用标识
 */
function openApp(key: DesktopAppKey): void {
  const host = activeHost.value;
  if (!host) {
    ElMessage.warning("请先在顶栏选择一台主机");
    return;
  }
  // 非 SSH 应用（监控）永远可开；其余三条通道没有 SSH 就是空窗
  if (key !== "monitor" && !sshReady(host)) {
    ElMessage.warning("这台主机不支持 SSH（本机采集），已改为打开监控");
    openApp("monitor");
    return;
  }
  const exist = windows.value.find((w) => w.app === key && w.hostId === host.id);
  if (exist) {
    exist.min = false;
    focus(exist.id);
    return;
  }
  const def = APPS.find((a) => a.key === key);
  if (!def) return;
  const n = windows.value.length;
  const maxW = Math.max(MIN_W, window.innerWidth - DOCK_W - 40);
  const maxH = Math.max(MIN_H, window.innerHeight - TOP_H - 40);
  const w = Math.min(def.w, maxW);
  const h = Math.min(def.h, maxH);
  const win: DesktopWindow = {
    id: `w${++seq}`,
    app: key,
    hostId: host.id,
    title: `${def.label} · ${host.serverHostName}`,
    x: Math.min(DOCK_W + 14 + (n % 5) * 26, Math.max(DOCK_W + 8, window.innerWidth - w - 16)),
    y: Math.min(TOP_H + 12 + (n % 5) * 24, Math.max(TOP_H + 8, window.innerHeight - h - 16)),
    w,
    h,
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
  w.w = window.innerWidth - DOCK_W - 8;
  w.h = window.innerHeight - TOP_H - 12;
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
 * @param w 窗口
 */
function appProps(w: DesktopWindow): Record<string, unknown> {
  const h = hostOf(w.hostId);
  const base = { hostId: w.hostId, active: activeId.value === w.id };
  if (w.app === "terminal") {
    return { ...base, hostName: h?.serverHostName ?? "" };
  }
  if (w.app === "console") {
    return { ...base, hostName: h?.serverHostName ?? "", osType: h?.serverHostOsType ?? "" };
  }
  return base;
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
    w.x = Math.max(DOCK_W + 2, Math.min(ox + ev.clientX - sx, window.innerWidth - 120));
    w.y = Math.max(TOP_H + 2, Math.min(oy + ev.clientY - sy, window.innerHeight - 48));
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
    w.w = Math.max(MIN_W, Math.min(ow + ev.clientX - sx, window.innerWidth - w.x - 6));
    w.h = Math.max(MIN_H, Math.min(oh + ev.clientY - sy, window.innerHeight - w.y - 6));
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/**
 * 视口变化时把窗口收回可视区（最大化窗口同步铺满）。
 */
function onViewportResize(): void {
  for (const w of windows.value) {
    if (w.max) {
      w.w = window.innerWidth - DOCK_W - 8;
      w.h = window.innerHeight - TOP_H - 12;
      continue;
    }
    w.w = Math.min(w.w, Math.max(MIN_W, window.innerWidth - DOCK_W - 20));
    w.h = Math.min(w.h, Math.max(MIN_H, window.innerHeight - TOP_H - 20));
    w.x = Math.max(DOCK_W + 2, Math.min(w.x, window.innerWidth - 120));
    w.y = Math.max(TOP_H + 2, Math.min(w.y, window.innerHeight - 48));
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

onMounted(async () => {
  tickClock();
  clockTimer = window.setInterval(tickClock, 15000);
  window.addEventListener("resize", onViewportResize);
  await reloadHosts();
  const q = Number(route.query.hostId);
  const picked =
    hosts.value.find((h) => h.id === q) ??
    hosts.value.find((h) => h.serverHostOnline === 1) ??
    hosts.value[0];
  if (picked) {
    activeHostId.value = picked.id;
    // 落地就给一个窗口：能走 SSH 的先给终端（一眼判断连不连得上），
    // 不能走 SSH 的（平台自身）直接给监控，别让人先撞一次“不支持 SSH”。
    if (picked.serverHostOnline === 1) {
      openApp(sshReady(picked) ? "terminal" : "monitor");
    }
  }
});

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  window.removeEventListener("resize", onViewportResize);
});
</script>

<style scoped>
.vdesk {
  position: fixed;
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

.vdesk__brand {
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #fff;
}

.vdesk__sep {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.18);
}

.vdesk__sel {
  max-width: 320px;
  height: 22px;
  padding: 0 6px;
  font-size: 11.5px;
  color: #e6e1ef;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  outline: none;
}

.vdesk__sel option {
  color: #1b0716;
  background: #fff;
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

/* 没有 SSH 的主机：终端 / 文件 / 命令点了也只会提示，视觉上先降一档 */
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
</style>
