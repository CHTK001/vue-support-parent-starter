<script setup lang="ts">
/**
 * 浏览器式工作台壳层（@pages/debug）
 *
 * <p>「浏览器 + CDP」的宿主壳：顶部是浏览器地址栏与生命周期控件
 * （后退 / 前进 / 重载 / 启动 / 重启 / 停止 / 新建页面 / sw8 注入开关），
 * 下方装配 {@code @pages/cdp} 的 {@link CdpWorkbench} —— 左侧页签式目标栏、
 * 中间实时画面、右侧 / 底部 DevTools 面板（元素 / 控制台 / 网络 / SVG /
 * 性能火焰图 / 应用存储 / 截屏 / 求值抽屉 / 变化监视 / 实时代理会话）。</p>
 *
 * <p>壳层只负责「浏览器级」交互；CDP 的 UI 与客户端全部由
 * {@code @pages/cdp} 自己维护，本组件经模板 ref 读取工作台
 * {@code defineExpose} 出的状态与方法来驱动它，不做二次封装。
 * 键盘快捷键（Ctrl+L 地址栏、F5 / Ctrl+R 重载、Ctrl+` 求值抽屉、
 * 数字 1–7 切换 DevTools 页签）也归壳层，因为它持有了整个窗口的 keydown。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import CdpWorkbench from "@pages/cdp/components/CdpWorkbench.vue";

/** CDP 工作台实例：地址栏与启停控件经它暴露的能力面驱动 */
const wb = ref<InstanceType<typeof CdpWorkbench> | null>(null);

/** 地址栏输入内容；当前选中目标变化时自动回填其地址 */
const navUrl = ref("");

/** 地址栏输入框（Ctrl+L 快捷键聚焦用） */
const navInputRef = ref<HTMLInputElement | null>(null);

watch(
  () => wb.value?.activeTarget?.url ?? "",
  (url) => {
    navUrl.value = url;
    // 目标切换 / 导航完成后收起历史下拉
    navHistoryOpen.value = false;
  },
);

/* ==================== 地址栏历史（localStorage） ==================== */

/** 历史存储键：最近导航的地址，最新在前，最多保留 10 条 */
const NAV_HISTORY_KEY = "debug.nav.history";
const NAV_HISTORY_MAX = 10;

const navHistory = ref<string[]>(readNavHistory());
const navHistoryOpen = ref(false);

/** 读历史：解析失败 / 结构不对时回空表，隐私模式禁用存储也不影响主流程 */
function readNavHistory(): string[] {
  try {
    const raw = localStorage.getItem(NAV_HISTORY_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((u): u is string => typeof u === "string" && !!u).slice(0, NAV_HISTORY_MAX)
      : [];
  } catch {
    return [];
  }
}

/** 记一条导航历史：去重后置顶，超限截断 */
function rememberNavHistory(url: string): void {
  navHistory.value = [url, ...navHistory.value.filter((u) => u !== url)].slice(0, NAV_HISTORY_MAX);
  try {
    localStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(navHistory.value));
  } catch {
    /* 存储不可用就只留在内存里 */
  }
}

/** 清空历史（内存 + localStorage） */
function clearNavHistory(): void {
  navHistory.value = [];
  navHistoryOpen.value = false;
  try {
    localStorage.removeItem(NAV_HISTORY_KEY);
  } catch {
    /* 忽略 */
  }
}

/** 点选一条历史：回填地址并立即导航（mousedown 阶段触发，避开 blur 竞态） */
function pickHistory(url: string): void {
  navHistoryOpen.value = false;
  navUrl.value = url;
  void go();
}

/**
 * 宽容化地址：没写协议的按 https 补全，本机地址按 http 补全，
 * about: / chrome: / data: 等自带协议原样放行。
 */
function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) {
    return "";
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) || /^(about|chrome|devtools|data|blob|file|javascript):/i.test(url)) {
    return url;
  }
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?([/?#].*)?$/i.test(url)) {
    return "http://" + url;
  }
  return "https://" + url;
}

/** 地址栏回车 / 「前往」：导航当前选中的页面目标，成功后记入历史 */
async function go() {
  const url = normalizeUrl(navUrl.value);
  if (!url || !wb.value) {
    return;
  }
  navUrl.value = url;
  const ok = await wb.value.doNavigate(url);
  if (ok) {
    rememberNavHistory(url);
  }
}

/* ==================== 键盘快捷键 ==================== */

/**
 * 浏览器级快捷键（工作台自身的 Esc 右键菜单等仍归 CdpWorkbench）：
 * Ctrl/⌘+L 聚焦地址栏；F5 / Ctrl/⌘+R 重载当前页面（拦掉浏览器默认刷新）；
 * Ctrl/⌘+` 开关求值抽屉；数字 1–7 切换 DevTools 页签；Esc 收起历史下拉。
 */
function onShellKeydown(e: KeyboardEvent): void {
  const wbv = wb.value;
  if (!wbv) {
    return;
  }
  const mod = e.ctrlKey || e.metaKey;
  if (mod && (e.key === "l" || e.key === "L")) {
    e.preventDefault();
    navInputRef.value?.focus();
    navInputRef.value?.select();
    return;
  }
  if (e.key === "F5" || (mod && (e.key === "r" || e.key === "R"))) {
    e.preventDefault();
    if (wbv.running) {
      void wbv.reloadPage();
    }
    return;
  }
  if (mod && e.key === "`") {
    e.preventDefault();
    wbv.toggleEvaluate();
    return;
  }
  if (e.key === "Escape") {
    navHistoryOpen.value = false;
    return;
  }
  if (/^[1-8]$/.test(e.key) && !mod && !e.altKey) {
    // 输入态不抢数字键
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
      return;
    }
    const name = (wbv.tabNames ?? [])[Number(e.key) - 1];
    if (name) {
      e.preventDefault();
      wbv.setPageTab(name);
    }
  }
}

onMounted(() => window.addEventListener("keydown", onShellKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onShellKeydown));
</script>

<template>
  <div class="debug-page debug-browser">
    <!-- 浏览器地址栏 + 生命周期控件 -->
    <header class="debug-hdr">
      <h2 class="debug-hdr__title">浏览器 + CDP</h2>
      <span :class="['debug-pill', `debug-pill--${wb?.stateTone ?? 'muted'}`]">
        <i class="debug-dot" />{{ wb?.stateLabel ?? "未知" }}
      </span>
      <span
        :class="['debug-pill', wb?.wsConnected && wb?.sseConnected ? 'debug-pill--info' : 'debug-pill--muted']"
        title="WS 指令通道 / SSE 事件流"
      >
        <i class="debug-dot" />通道 {{ wb?.wsConnected ? "WS" : "WS×" }} / {{ wb?.sseConnected ? "SSE" : "SSE×" }}
      </span>
      <span v-if="wb?.status?.port" class="debug-hdr__port">:{{ wb.status.port }}</span>

      <!-- 导航簇：后退 / 前进 / 重载（走 CDP Page.* 指令） -->
      <button
        class="debug-btn debug-btn--sm debug-browser__navbtn"
        :disabled="!wb?.canGoBack"
        :title="wb?.canGoBack ? '后退到上一个页面' : '没有可后退的历史'"
        @click="wb?.goBack()"
      >
        ◀
      </button>
      <button
        class="debug-btn debug-btn--sm debug-browser__navbtn"
        :disabled="!wb?.canGoForward"
        :title="wb?.canGoForward ? '前进到下一个页面' : '没有可前进的历史'"
        @click="wb?.goForward()"
      >
        ▶
      </button>
      <button
        class="debug-btn debug-btn--sm debug-browser__navbtn"
        :disabled="!wb?.running"
        title="重载当前页面（F5 / Ctrl+R）"
        @click="wb?.reloadPage()"
      >
        ⟳
      </button>

      <!-- 地址栏：导航当前选中的页面目标 -->
      <span class="debug-browser__addr">
        <i class="debug-browser__addr-ico" title="当前页面地址">◈</i>
        <input
          ref="navInputRef"
          v-model="navUrl"
          class="debug-browser__addr-input"
          spellcheck="false"
          placeholder="输入地址后回车，导航当前选中的页面"
          @keyup.enter="go"
          @focus="navHistoryOpen = navHistory.length > 0"
          @blur="navHistoryOpen = false"
        />
        <button class="debug-btn debug-btn--sm" :disabled="!navUrl.trim()" title="导航当前选中的页面" @click="go">
          前往
        </button>
        <button class="debug-btn debug-btn--sm" title="重新拉取实时画面" @click="wb?.refreshStage()">↻ 画面</button>

        <!-- 加载进度条：导航 / 重载时细条滑动，loadEventFired 收尾 -->
        <i class="debug-browser__loadbar" :class="{ 'is-loading': wb?.pageLoading }" />

        <!-- 地址历史下拉：聚焦时展示最近导航，一键回填 -->
        <div v-if="navHistoryOpen && navHistory.length" class="debug-browser__hist">
          <div class="debug-browser__hist-hd">
            <span>最近导航</span>
            <button class="debug-browser__hist-clear" title="清空地址历史" @mousedown.prevent="clearNavHistory">
              清空
            </button>
          </div>
          <button
            v-for="url in navHistory"
            :key="url"
            class="debug-browser__hist-item"
            :title="url"
            @mousedown.prevent="pickHistory(url)"
          >
            {{ url }}
          </button>
        </div>
      </span>

      <button
        :class="['debug-btn', 'debug-btn--sm', { 'debug-btn--primary': wb?.sw8Enabled }]"
        title="自动为页面 XHR / fetch 注入 SkyWalking sw8 追踪头"
        @click="wb?.toggleSw8()"
      >
        sw8 {{ wb?.sw8Enabled ? "开" : "关" }}
      </button>
      <span v-if="wb?.changeTagCount" class="debug-pill debug-pill--warn" title="页面变化已输出到控制台">
        <i class="debug-dot" />变化 {{ wb?.changeTagCount }}
      </span>
      <span class="debug-hdr__spacer" />
      <button class="debug-btn" :disabled="wb?.statusLoading" title="刷新浏览器状态与目标列表" @click="wb?.reloadStatus()">
        刷新
      </button>
      <button class="debug-btn" :disabled="!wb?.running" :title="wb?.running ? '' : '浏览器未启动'" @click="wb?.openCreatePage()">
        + 新建页面
      </button>
      <button
        class="debug-btn debug-btn--primary"
        :disabled="wb?.statusLoading"
        :title="wb?.running ? '浏览器状态异常时，点这里做一次自愈重启' : '启动调试浏览器'"
        @click="wb?.startBrowser()"
      >
        {{ wb?.running ? "重启" : "启动" }}
      </button>
      <button
        class="debug-btn debug-btn--danger"
        :disabled="!wb?.running || wb?.statusLoading"
        @click="wb?.stopBrowser()"
      >
        {{ wb?.statusLoading ? "处理中…" : "停止" }}
      </button>
    </header>

    <!-- CDP 工作台：左侧页签目标栏 + 中间实时画面 + 右/底 DevTools 面板 -->
    <CdpWorkbench ref="wb" class="debug-browser__wb" />
  </div>
</template>

<style scoped>
/* 导航簇按钮：固定宽度，箭头不随字体抖动 */
.debug-browser__navbtn {
  flex: 0 0 auto;
  width: 30px;
  padding: 0;
  text-align: center;
}

/* 浏览器地址栏（omnibox）：占据头部中部，圆角胶囊 */
.debug-browser__addr {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
  min-width: 220px;
  max-width: 640px;
  padding: 3px 6px 3px 10px;
  background: var(--bg-layout);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  transition: border-color 0.15s ease;
}
.debug-browser__addr:focus-within {
  border-color: var(--brand-500);
}
.debug-browser__addr-ico {
  font-style: normal;
  font-size: 12px;
  color: var(--text-tertiary);
}
.debug-browser__addr-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 22px;
}
.debug-browser__addr-input::placeholder {
  color: var(--text-quaternary, #c0c4cc);
}

/* 加载进度条：贴着地址栏胶囊内缘的细条，导航 / 重载期间来回滑动 */
.debug-browser__loadbar {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 1px;
  height: 2px;
  border-radius: 2px;
  overflow: hidden;
  pointer-events: none;
}
.debug-browser__loadbar.is-loading::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  border-radius: 2px;
  background: var(--brand-500, #409eff);
  animation: debug-loadbar-slide 1s ease-in-out infinite;
}
@keyframes debug-loadbar-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}

/* 地址历史下拉：贴着胶囊下方弹出 */
.debug-browser__hist {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  overflow: hidden;
}
.debug-browser__hist-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  font-size: 11px;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}
.debug-browser__hist-clear {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 11px;
  color: var(--text-tertiary);
  cursor: pointer;
}
.debug-browser__hist-clear:hover {
  color: var(--brand-500);
}
.debug-browser__hist-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 12px;
  line-height: 18px;
  color: var(--text-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.debug-browser__hist-item:hover {
  background: var(--bg-layout);
}

/* 工作台填满地址栏以下的全部空间（覆盖 .debug-page 自带的 height:100%） */
.debug-browser__wb {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
}
</style>
