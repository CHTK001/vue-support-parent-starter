<!--
  /**
   * 虚拟桌面
   *
   * <p>「通过 SSH 模拟桌面」的落点：外观是 Ubuntu 风格的桌面壳（顶栏 + Dock +
   * 可拖拽窗口），数据面全部走平台已有的 SSH / SFTP / 命令执行 / 指标通道，
   * 所以主机不需要额外装桌面环境，也不镜像真实屏幕。</p>
   *
   * <p>桌面是<b>按主机</b>开的：一台主机一个桌面，没有全局主机下拉。
   * 默认入口是主机资产页的右键菜单，打开的是<b>主机资产右侧工作区里的一个页签</b>
   * （与远控 / 文件管理 / 指标监控平级，{@code embedded} 模式 + {@code host-id} 传入主机），
   * 所以关掉页签就留在主机资产，主机上下文不丢，也不会开浏览器新标签页。
   * 只有桌面里的单个窗口可以「在新标签页打开」，那个标签页走
   * {@code /desktop-window/:hostId?only=<app>}（{@code singleKey} 模式），只渲染这一个窗口。</p>
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

  <div
    v-else
    ref="rootRef"
    class="vdesk"
    :class="{ 'vdesk--embed': embedded, 'is-start': startOpen }"
    :style="{ background: wallpaperCss }"
    @contextmenu.prevent="openDeskMenu"
  >
    <!-- 顶栏：这台主机的桌面，不提供主机切换（换主机请回主机资产页重开） -->
    <header class="vdesk__top">
      <button
        type="button"
        class="vdesk__startbtn"
        :class="{ 'is-on': startOpen }"
        title="应用菜单（Ctrl+K）"
        @pointerdown.stop
        @click.stop="toggleStart"
      >
        <ReIcon name="Grid" :size="13" />
      </button>
      <span class="vdesk__host">{{ activeHost?.serverHostName || "未指定主机" }}</span>
      <span v-if="activeHost" class="vdesk__addr">{{ activeHost.serverHostAddress }}</span>
      <span class="vdesk__dot" :class="activeHost?.serverHostOnline === 1 ? 'is-on' : 'is-off'" />
      <span class="vdesk__os">{{ activeHost?.serverHostOsType || "—" }}</span>
      <span class="vdesk__spacer" />
      <span class="vdesk__clock">{{ clock }}</span>
      <button type="button" class="vdesk__act" title="全屏 / 退出全屏" @click="toggleFullscreen">
        <ReIcon name="FullScreen" :size="12" />
      </button>
      <button v-if="!embedded" type="button" class="vdesk__act" title="返回主机资产" @click="leave">
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

    <!-- 桌面快捷方式：与 Dock 同一份应用清单，双击打开（单击只选中） -->
    <div v-if="activeHost" class="vdesk__icons">
      <button
        v-for="a in dockApps"
        :key="a.key"
        type="button"
        class="dicon"
        :class="{ 'is-off': a.off, 'is-sel': iconSel === a.key }"
        :title="a.off ? `${a.hint}（${a.offReason}）` : `${a.hint}\n双击打开`"
        @click.stop="iconSel = a.key"
        @dblclick.stop="openApp(a.key)"
      >
        <ReIcon :name="a.icon" :size="30" class="dicon__ico" />
        <span class="dicon__label">{{ a.label }}</span>
      </button>
    </div>

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
      <span>终端、文件、监控、系统、命令都是对这台主机的真实操作</span>
    </div>

    <!-- 没有带主机进来：桌面是按主机开的，不做全局页 -->
    <div v-if="ready && !activeHost" class="vdesk__empty">
      <ReIcon name="Monitor" :size="38" />
      <b>请先选择一台主机</b>
      <span>虚拟桌面属于具体主机：在主机资产页的右键菜单里打开某一台主机的桌面</span>
      <button v-if="!embedded" type="button" class="vdesk__go" @click="leave">去主机资产</button>
    </div>

    <!-- 加载态 -->
    <div v-if="!ready" class="vdesk__boot">
      <span class="vdesk__boot-dot" />
      正在读取主机…
    </div>

    <!-- 贴边分屏预览：拖窗口到左/右/上边缘时先给出落点，松手才真的贴过去 -->
    <div
      v-if="snapPreview"
      class="vdesk__snap"
      :style="{
        left: `${snapPreview.x}px`,
        top: `${snapPreview.y}px`,
        width: `${snapPreview.w}px`,
        height: `${snapPreview.h}px`,
      }"
    />

    <!-- 任务栏：所有已打开窗口的入口，点当前窗口最小化、点最小化的窗口还原 -->
    <footer v-if="activeHost" class="vdesk__tasks">
      <button type="button" class="vtask is-start" title="应用菜单（Ctrl+K）" @click.stop="toggleStart">
        <ReIcon name="Grid" :size="14" />
      </button>
      <button
        v-for="w in windows"
        :key="w.id"
        type="button"
        class="vtask"
        :class="{ 'is-on': activeId === w.id && !w.min, 'is-min': w.min }"
        :title="w.title"
        @click="taskClick(w)"
      >
        <ReIcon :name="appIcon(w.app)" :size="12" />
        <span class="vtask__label">{{ w.title }}</span>
      </button>
      <span class="vdesk__spacer" />
      <button type="button" class="vtask is-clock" :title="`${dateText} ${clock}`" @click.stop="toggleStart">
        <span class="vtask__clock">{{ clock }}</span>
        <em class="vtask__date">{{ dateText }}</em>
      </button>
    </footer>

    <!-- 应用菜单（开始菜单）：应用、常用动作、壁纸都收在这里 -->
    <template v-if="startOpen && activeHost">
      <div class="vstart-mask" @pointerdown="closeStart" @contextmenu.prevent="closeStart" />
      <section class="vstart" @pointerdown.stop @contextmenu.prevent>
        <header class="vstart__head">
          <span class="vstart__avatar"><ReIcon name="Monitor" :size="16" /></span>
          <div class="vstart__meta">
            <b>{{ activeHost.serverHostName }}</b>
            <span class="mono">{{ activeHost.serverHostAddress }}:{{ activeHost.serverHostPort ?? 22 }}</span>
          </div>
          <span class="vdesk__dot" :class="activeHost.serverHostOnline === 1 ? 'is-on' : 'is-off'" />
        </header>

        <div class="vstart__apps">
          <button
            v-for="a in dockApps"
            :key="a.key"
            type="button"
            class="vstart__app"
            :class="{ 'is-off': a.off }"
            :title="a.off ? a.offReason : a.hint"
            @click="menuApp(a.key)"
          >
            <ReIcon :name="a.icon" :size="18" />
            <span>{{ a.label }}</span>
            <em v-if="a.off">{{ a.offReason }}</em>
          </button>
        </div>

        <div class="vstart__acts">
          <button type="button" class="vstart__act" @click="menuRefresh">
            <ReIcon name="RefreshRight" :size="12" /><span>刷新主机</span>
          </button>
          <button type="button" class="vstart__act" :disabled="!windows.length" @click="menuMinAll">
            <ReIcon name="Minus" :size="12" /><span>全部最小化</span>
          </button>
          <button type="button" class="vstart__act" :disabled="!windows.length" @click="menuCloseAll">
            <ReIcon name="CircleClose" :size="12" /><span>关闭全部</span>
          </button>
          <button type="button" class="vstart__act" @click="menuFullscreen">
            <ReIcon name="FullScreen" :size="12" /><span>全屏</span>
          </button>
        </div>

        <div class="vstart__wp">
          <span class="vstart__wp-label">壁纸</span>
          <button
            v-for="w in WALLPAPERS"
            :key="w.key"
            type="button"
            class="vstart__swatch"
            :class="{ 'is-on': wallpaper === w.key }"
            :style="{ background: w.css }"
            :title="w.label"
            @click="setWallpaper(w.key)"
          />
        </div>

        <footer class="vstart__foot">
          Ctrl+K 菜单 · Alt+Tab 切换窗口 · 窗口拖到边缘分屏
        </footer>
      </section>
    </template>

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
import DesktopSystem from "./apps/DesktopSystem.vue";
import DesktopConsole from "./apps/DesktopConsole.vue";

/** 顶栏高度（窗口拖拽的上边界） */
const TOP_H = 34;
/** Dock 宽度（窗口拖拽的左边界） */
const DOCK_W = 78;
/** 底部任务栏高度（窗口的下边界） */
const TASKBAR_H = 34;
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
  { key: "files", label: "文件", icon: "FolderOpened", w: 980, h: 600, hint: "SFTP 文件管理（三种布局）" },
  { key: "monitor", label: "监控", icon: "Odometer", w: 520, h: 470, hint: "CPU / 内存 / 磁盘 / IO" },
  { key: "system", label: "系统", icon: "InfoFilled", w: 660, h: 560, hint: "主机信息与只读探测" },
  { key: "console", label: "命令", icon: "Promotion", w: 840, h: 540, hint: "执行命令（记入执行日志）" },
];

/** 应用 → 组件 */
const APP_COMPONENTS: Record<DesktopAppKey, Component> = {
  terminal: DesktopTerminal,
  files: DesktopFiles,
  monitor: DesktopMonitor,
  system: DesktopSystem,
  console: DesktopConsole,
};

const route = useRoute();
const router = useRouter();
const tabsStore = useTabsStore();

/**
 * 外部传入的主机与嵌入模式。
 *
 * <p>嵌入模式是默认入口：桌面作为「主机资产」工作区里的一个页签渲染，
 * 主机由页签回传的 {@code host-id} 指定，不再读路由参数；独立弹出页
 * （{@code /desktop-window/:hostId?only=<app>}）仍走路由，不传 props。</p>
 */
const props = defineProps<{
  /** 嵌入模式下的主机标识；缺省时回落到路由参数 */
  hostId?: number | null;
  /** 是否嵌在工作区页签里（不是整页独立壳） */
  embedded?: boolean;
}>();

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
 * 桌面壁纸。
 *
 * <p>只是外观，但桌面壳没有壁纸切换会显得像一块面板；四套渐变都压成深色，
 * 保证上面的窗口与文字对比度不变。</p>
 */
const WALLPAPERS = [
  {
    key: "ubuntu",
    label: "Ubuntu 紫",
    css:
      "radial-gradient(1100px 780px at 18% 8%, rgba(122,45,92,0.55) 0%, transparent 62%)," +
      "radial-gradient(900px 680px at 86% 92%, rgba(233,84,32,0.22) 0%, transparent 58%)," +
      "linear-gradient(158deg, #2c0d27 0%, #1b0716 58%, #120510 100%)",
  },
  {
    key: "ocean",
    label: "深海蓝",
    css:
      "radial-gradient(1000px 720px at 12% 6%, rgba(35,110,180,0.5) 0%, transparent 60%)," +
      "radial-gradient(820px 620px at 88% 88%, rgba(72,201,176,0.2) 0%, transparent 56%)," +
      "linear-gradient(160deg, #0b1c2c 0%, #081420 60%, #050b12 100%)",
  },
  {
    key: "forest",
    label: "苔原绿",
    css:
      "radial-gradient(1000px 720px at 16% 10%, rgba(58,130,96,0.45) 0%, transparent 60%)," +
      "radial-gradient(780px 600px at 90% 90%, rgba(180,190,90,0.18) 0%, transparent 55%)," +
      "linear-gradient(158deg, #10221a 0%, #0b1712 60%, #060d09 100%)",
  },
  {
    key: "graphite",
    label: "石墨灰",
    css:
      "radial-gradient(1000px 720px at 20% 8%, rgba(90,94,110,0.4) 0%, transparent 62%)," +
      "radial-gradient(820px 620px at 84% 90%, rgba(233,120,60,0.14) 0%, transparent 56%)," +
      "linear-gradient(158deg, #23232b 0%, #16161c 60%, #0d0d11 100%)",
  },
] as const;

const wallpaper = ref<string>(readLocal("vdesk.wallpaper", "ubuntu"));
const wallpaperCss = computed(
  () => (WALLPAPERS.find((w) => w.key === wallpaper.value) ?? WALLPAPERS[0]).css,
);

/** 应用菜单（开始菜单）是否展开 */
const startOpen = ref(false);
/** 桌面上被单击选中的快捷方式 */
const iconSel = ref("");

/** 贴边分屏的落点预览（拖拽过程中显示，松手清空） */
const snapPreview = ref<{ x: number; y: number; w: number; h: number } | null>(null);

/** 日期文案：任务栏与开始菜单都要看得到「今天」 */
const dateText = computed(() => {
  const d = new Date();
  const week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
});

/**
 * 读一个本地偏好（坏值一律回落到默认）。
 *
 * @param key 存储键
 * @param fallback 默认值
 */
function readLocal(key: string, fallback: string): string {
  try {
    const raw = localStorage.getItem(key);
    return raw && WALLPAPERS.some((w) => w.key === raw) ? raw : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 切换壁纸并记住。
 *
 * @param key 壁纸标识
 */
function setWallpaper(key: string): void {
  wallpaper.value = key;
  try {
    localStorage.setItem("vdesk.wallpaper", key);
  } catch {
    /* 隐私模式下写不进去，不影响使用 */
  }
}

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
  // 工作区页签里是完整桌面（Dock + 多窗口），单窗口模式只属于独立弹出页
  if (props.embedded) return null;
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
 * 主机标识：嵌入模式用页签传入的 {@code host-id}，独立页读路由。
 *
 * <p>路由优先取路径参数，其次兼容旧的 {@code ?hostId=} 链接。</p>
 *
 * @returns 主机标识；没带或非法时为 0
 */
function parseHostId(): number {
  const fromProp = Number(props.hostId ?? 0);
  if (Number.isFinite(fromProp) && fromProp > 0) return fromProp;
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
  const maxH = Math.max(MIN_H, viewH.value - TOP_H - TASKBAR_H - 40);
  const w = Math.min(def.w, maxW);
  const hh = Math.min(def.h, maxH);
  const win: DesktopWindow = {
    id: `w${++seq}`,
    app: key,
    hostId: h.id,
    title: `${def.label} · ${h.serverHostName}`,
    x: Math.min(DOCK_W + 14 + (n % 5) * 26, Math.max(DOCK_W + 8, viewW.value - w - 16)),
    y: Math.min(TOP_H + 12 + (n % 5) * 24, Math.max(TOP_H + 8, viewH.value - hh - TASKBAR_H - 16)),
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
  w.h = viewH.value - TOP_H - TASKBAR_H - 12;
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
  if (key === "console" || key === "system") {
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
 * 拖拽标题栏移动窗口；同时探测贴边分屏。
 *
 * <p>分屏只在「真的拖动过」时才触发：单击标题栏只是聚焦，
 * 不能因为鼠标刚好停在窗口边缘就把窗口拉成半屏。</p>
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
  let moved = false;
  let zone: SnapZone = null;
  const move = (ev: PointerEvent) => {
    if (Math.abs(ev.clientX - sx) > 4 || Math.abs(ev.clientY - sy) > 4) moved = true;
    w.x = Math.max(DOCK_W + 2, Math.min(ox + ev.clientX - sx, viewW.value - 120));
    w.y = Math.max(TOP_H + 2, Math.min(oy + ev.clientY - sy, viewH.value - TASKBAR_H - 48));
    zone = moved ? snapZoneOf(ev.clientX, ev.clientY) : null;
    snapPreview.value = zone ? snapRectOf(zone) : null;
  };
  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    snapPreview.value = null;
    if (moved && zone) applySnap(w, zone);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

/** 贴边区域 */
type SnapZone = "left" | "right" | "top" | null;

/**
 * 判断指针落在桌面的哪条边（用桌面根节点的矩形，不是视口）。
 *
 * @param x 指针 clientX
 * @param y 指针 clientY
 */
function snapZoneOf(x: number, y: number): SnapZone {
  const rect = rootRef.value?.getBoundingClientRect();
  if (!rect) return null;
  if (y <= rect.top + 8) return "top";
  if (x <= rect.left + 8) return "left";
  if (x >= rect.right - 8) return "right";
  return null;
}

/**
 * 某一侧的落点矩形。
 *
 * @param zone 贴边区域
 */
function snapRectOf(zone: Exclude<SnapZone, null>): { x: number; y: number; w: number; h: number } {
  const top = TOP_H + 6;
  const bottom = viewH.value - TASKBAR_H - 8;
  const height = Math.max(MIN_H, bottom - top);
  if (zone === "top") {
    return { x: DOCK_W, y: top, w: Math.max(MIN_W, viewW.value - DOCK_W - 8), h: height };
  }
  const width = Math.max(MIN_W, Math.floor((viewW.value - DOCK_W) / 2) - 8);
  return {
    x: zone === "left" ? DOCK_W : viewW.value - width - 6,
    y: top,
    w: width,
    h: height,
  };
}

/**
 * 把窗口贴到指定边缘：上边等于最大化，左右是半屏。
 *
 * @param w 窗口
 * @param zone 贴边区域
 */
function applySnap(w: DesktopWindow, zone: Exclude<SnapZone, null>): void {
  if (zone === "top") {
    if (!w.max) toggleMax(w);
    return;
  }
  if (w.max) toggleMax(w);
  const rect = snapRectOf(zone);
  w.x = rect.x;
  w.y = rect.y;
  w.w = rect.w;
  w.h = rect.h;
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
    w.h = Math.max(MIN_H, Math.min(oh + ev.clientY - sy, viewH.value - w.y - TASKBAR_H - 6));
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
      w.h = viewH.value - TOP_H - TASKBAR_H - 12;
      continue;
    }
    w.w = Math.min(w.w, Math.max(MIN_W, viewW.value - DOCK_W - 20));
    w.h = Math.min(w.h, Math.max(MIN_H, viewH.value - TOP_H - TASKBAR_H - 20));
    w.x = Math.max(DOCK_W + 2, Math.min(w.x, viewW.value - 120));
    w.y = Math.max(TOP_H + 2, Math.min(w.y, viewH.value - TASKBAR_H - 48));
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
  // 工作区页签里没有「返回」这一步：关页签就是返回
  if (props.embedded) return;
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
  // 嵌在工作区页签里时标题由页签自己维护（主机名 + 功能名），不碰顶部页签
  if (props.embedded) return;
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
  closeStart();
  openApp(key);
}

/** 桌面右键菜单 → 重新读取主机 */
function menuRefresh(): void {
  closeDeskMenu();
  closeStart();
  void reloadHost().then(syncTabTitle);
}

/** 桌面右键菜单 → 关闭所有窗口 */
function menuCloseAll(): void {
  closeDeskMenu();
  closeStart();
  windows.value = [];
  activeId.value = "";
  snapPreview.value = null;
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

/**
 * 应用菜单开合（顶栏按钮、任务栏按钮、Ctrl+K 都走这里）。
 */
function toggleStart(): void {
  startOpen.value = !startOpen.value;
  if (startOpen.value) closeDeskMenu();
}

/** 关闭应用菜单 */
function closeStart(): void {
  startOpen.value = false;
}

/**
 * 应用图标名（任务栏用）。
 *
 * @param key 应用标识
 */
function appIcon(key: DesktopAppKey): string {
  return APPS.find((a) => a.key === key)?.icon ?? "Monitor";
}

/**
 * 任务栏点击：当前窗口 → 最小化；最小化的窗口 → 还原并聚焦；其它 → 聚焦。
 *
 * @param w 窗口
 */
function taskClick(w: DesktopWindow): void {
  if (w.min) {
    w.min = false;
    focus(w.id);
    return;
  }
  if (activeId.value === w.id) minimize(w);
  else focus(w.id);
}

/** 最小化所有窗口 */
function minimizeAll(): void {
  windows.value.forEach((w) => {
    w.min = true;
  });
  activeId.value = "";
}

/** 菜单 → 全部最小化 */
function menuMinAll(): void {
  closeStart();
  minimizeAll();
}

/** 菜单 → 全屏 */
function menuFullscreen(): void {
  closeStart();
  toggleFullscreen();
}

/**
 * 桌面是否还在屏幕上。
 *
 * <p>工作区页签切走后只是 v-show 隐藏，如果快捷键还挂着，
 * 用户在别的页签里按 Ctrl+K 会把看不见的菜单打开。</p>
 */
function deskVisible(): boolean {
  const el = rootRef.value;
  return Boolean(el && el.getClientRects().length > 0);
}

/** Alt+Tab：在所有已开窗口里轮换（最小化的先还原） */
function cycleWindows(): void {
  const list = windows.value;
  if (!list.length) return;
  const i = list.findIndex((w) => w.id === activeId.value);
  const next = list[(i + 1) % list.length];
  next.min = false;
  focus(next.id);
}

/**
 * Ctrl+K：桌面在屏幕上时由桌面接管。
 *
 * <p>平台里 Ctrl+K 已经被占了两处：顶栏的全局搜索（ReSearchMenu，
 * 挂在 document 的冒泡阶段）和主机资产页的主机命令面板（同样挂在 document，
 * 但用的是捕获阶段并且会 stopImmediatePropagation）。桌面如果也挂在 document 上，
 * 就只能排在命令面板后面，永远抢不到。</p>
 *
 * <p>所以这里挂在 <b>window 的捕获阶段</b>：window 捕获先于 document 捕获，
 * 命中后立即 stopImmediatePropagation，两个平台浮层都不会再弹。
 * 桌面被切走（v-show 隐藏）后 deskVisible() 为假，Ctrl+K 照旧交还给平台。</p>
 *
 * @param e 键盘事件
 */
function onKeydownCapture(e: KeyboardEvent): void {
  if (e.key.toLowerCase() !== "k") return;
  if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
  if (!deskVisible()) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  toggleStart();
}

/**
 * 桌面快捷键：Alt+Tab 轮换、Esc 收起浮层。
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  if (!deskVisible()) return;
  const key = e.key.toLowerCase();
  if (e.altKey && key === "tab") {
    e.preventDefault();
    cycleWindows();
    return;
  }
  if (key === "escape") {
    closeStart();
    closeDeskMenu();
  }
}

onMounted(async () => {
  tickClock();
  clockTimer = window.setInterval(tickClock, 15000);
  window.addEventListener("resize", onViewportResize);
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("keydown", onKeydownCapture, true);
  await nextTick();
  measure();
  if (rootRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => onViewportResize());
    resizeObserver.observe(rootRef.value);
  }
  await bootHost();
});

// 独立页：路由变化（换主机 / 换 ?only=）时按新主机重建桌面
watch(
  () => route.fullPath,
  () => {
    if (props.embedded) return;
    if (route.name === "VirtualDesktop" || route.name === "VirtualDesktopWindow") void bootHost();
  },
);

// 嵌入页签：只有页签传来的主机变了才重建（一个页签固定服务一台主机）
watch(
  () => props.hostId,
  () => {
    if (!props.embedded) return;
    if (Number(props.hostId ?? 0) > 0) void bootHost();
  },
);

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer);
  window.removeEventListener("resize", onViewportResize);
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("keydown", onKeydownCapture, true);
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

/* 工作区页签模式：桌面是「主机资产」右侧面板里的一个页签，
   高度由 ReTabs 面板的 flex 链给定；不能用 absolute，否则会盖住页签栏与左栏。 */
.vdesk--embed {
  position: relative;
  inset: auto;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
  border-radius: 0;
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

/* 顶栏左侧的应用菜单按钮：和任务栏左下角那颗是同一个动作 */
.vdesk__startbtn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 21px;
  color: #d8d3e0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.vdesk__startbtn:hover,
.vdesk__startbtn.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.45);
  border-color: rgba(233, 84, 32, 0.7);
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

/* ---------- 桌面快捷方式 ---------- */
.vdesk__icons {
  position: absolute;
  top: 50px;
  left: 92px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.dicon {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  width: 66px;
  padding: 7px 4px 6px;
  color: #e6e1ef;
  cursor: default;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.dicon:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dicon.is-sel {
  background: rgba(233, 84, 32, 0.22);
  border-color: rgba(233, 84, 32, 0.5);
}

.dicon.is-off {
  opacity: 0.5;
}

.dicon__ico {
  color: #d9d3e3;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.45));
}

.dicon__label {
  font-size: 10.5px;
  line-height: 1.2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
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

/* ---------- 贴边分屏预览 ---------- */
.vdesk__snap {
  position: absolute;
  z-index: 900;
  pointer-events: none;
  background: rgba(233, 84, 32, 0.14);
  border: 1.5px dashed rgba(233, 84, 32, 0.9);
  border-radius: 8px;
  transition: left 0.07s ease, top 0.07s ease, width 0.07s ease, height 0.07s ease;
}

/* ---------- 任务栏 ---------- */
.vdesk__tasks {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  gap: 4px;
  align-items: center;
  height: 34px;
  padding: 0 8px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.vtask {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  max-width: 190px;
  height: 24px;
  padding: 0 9px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.vtask:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
}

.vtask.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.55);
  border-color: rgba(233, 84, 32, 0.75);
}

.vtask.is-min {
  opacity: 0.62;
}

.vtask__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vtask.is-start {
  justify-content: center;
  width: 28px;
  padding: 0;
}

.vtask.is-clock {
  flex-direction: column;
  gap: 0;
  align-items: flex-end;
  height: 28px;
  padding: 0 8px;
  line-height: 1.15;
  background: transparent;
  border-color: transparent;
}

.vtask.is-clock:hover {
  background: rgba(255, 255, 255, 0.1);
}

.vtask__clock {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
  font-weight: 600;
  color: #efeaf7;
}

.vtask__date {
  font-size: 9.5px;
  font-style: normal;
  color: #9d97ab;
}

/* ---------- 应用菜单（开始菜单） ---------- */
.vstart-mask {
  position: fixed;
  inset: 0;
  z-index: 1001;
}

.vstart {
  position: absolute;
  bottom: 42px;
  left: 10px;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 326px;
  padding: 10px;
  color: #efeaf7;
  background: rgba(26, 16, 24, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 12px;
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
}

.vstart__head {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 4px 4px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.vstart__avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #ffd9c4;
  background: rgba(233, 84, 32, 0.35);
  border-radius: 9px;
}

.vstart__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.vstart__meta b {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vstart__meta .mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: #9d97ab;
}

.vstart__apps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.vstart__app {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 7px 8px;
  font-size: 12px;
  color: #e6e1ef;
  text-align: left;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 7px;
}

.vstart__app:hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.32);
}

.vstart__app.is-off {
  opacity: 0.45;
}

.vstart__app em {
  margin-left: auto;
  overflow: hidden;
  font-size: 9.5px;
  font-style: normal;
  color: rgba(255, 255, 255, 0.45);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vstart__acts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.vstart__act {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px 8px;
  font-size: 11.5px;
  color: #cfc9da;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
}

.vstart__act:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.vstart__act:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.vstart__wp {
  display: flex;
  gap: 7px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.vstart__wp-label {
  font-size: 11px;
  color: #9d97ab;
}

.vstart__swatch {
  width: 30px;
  height: 20px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
}

.vstart__swatch.is-on {
  border-color: #e95420;
  box-shadow: 0 0 0 1px rgba(233, 84, 32, 0.6);
}

.vstart__foot {
  padding-top: 6px;
  font-size: 9.5px;
  color: #6f6a79;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
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
