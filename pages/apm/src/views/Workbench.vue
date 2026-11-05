<!--
  APM 单页工作台。

  一个菜单入口 `/apm`，12 个视图收进 `ReTabs` 的页签里：
    · 顶部只有一条 shell（标识 / 引擎 / 时钟），页签条压在底部 ——
      页面内容才是主角，导航不该抢视线；
    · 每个页签首次点开才挂载，之后常驻（v-show 保活），切回来不重发请求；
    · 当前页签同步到 URL（`?tab=services`），刷新与分享都能落到同一页；
    · 页签可以弹出成独立窗口（`?tab=x&popout=1`，只渲染那一页、没有页签条）。

  旧地址 `/apm/services` 之类的兼容由 `routes/index.ts` 的重定向负责，
  视图里的跳转因此不需要改一行代码。
-->
<template>
  <div class="apm-shell" :class="{ 'apm-shell--popout': isPopout }">
    <!-- 顶部：这是哪套系统、连的是哪个引擎、现在几点 -->
    <header class="apm-shell__top">
      <div class="apm-shell__brand">
        <span class="apm-shell__mark" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="20" height="20">
            <path d="M5 6.5 L14 4 M5 6.5 L13 15 M14 4 L13 15" class="apm-shell__edge" />
            <circle cx="5" cy="6.5" r="2.2" class="apm-shell__node" />
            <circle cx="14" cy="4" r="1.6" class="apm-shell__node is-dim" />
            <circle cx="13" cy="15" r="2" class="apm-shell__node is-accent" />
          </svg>
        </span>
        <span class="apm-shell__names">
          <strong>APM</strong>
          <em>应用性能观测台</em>
        </span>
      </div>

      <div class="apm-shell__engine">
        <i class="apm-shell__led" :class="ledClass" />
        <span class="apm-shell__engine-name">{{ engineLabel }}</span>
        <template v-if="status?.endpoint">
          <span class="apm-shell__sep">/</span>
          <span class="apm-shell__endpoint">{{ status.endpoint }}</span>
        </template>
        <template v-else-if="status?.mode">
          <span class="apm-shell__sep">/</span>
          <span class="apm-shell__endpoint">{{ status.mode }}</span>
        </template>
      </div>

      <div class="apm-shell__right">
        <span class="apm-shell__pill">{{ activeLabel }}</span>
        <button
          v-if="!isPopout"
          type="button"
          class="apm-shell__icon-btn"
          title="重新探测 APM 引擎"
          aria-label="重新探测 APM 引擎"
          :disabled="probing"
          @click="probe"
        >
          <ReIcon name="Refresh" :size="13" />
        </button>
        <span class="apm-shell__clock">{{ clock }}</span>
      </div>
    </header>

    <!-- 弹出模式：只渲染一个视图，没有页签条 -->
    <div v-if="isPopout && popoutTab" class="apm-shell__body">
      <div class="apm-workbench__view">
        <component :is="popoutTab.component" />
      </div>
    </div>

    <div v-else class="apm-shell__body">
      <ReTabs
        v-model="active"
        class="apm-workbench"
        :id="APM_WORKBENCH_ID"
        :tabs="reTabsItems"
        :closable="false"
        size="mini"
        position="bottom"
        poppable
        empty-text="APM 观测台"
        @popout="openPopout"
      >
        <template #default="{ tab }">
          <div class="apm-workbench__view">
            <component :is="tabComponent(tab.name)" v-if="tabComponent(tab.name)" />
          </div>
        </template>
      </ReTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @pages/apm 单页工作台
 *
 * <p>页签的「是什么」在 `tabs.ts`，这里负责四件事：把页签名和 URL 对齐、
 * 让 ReTabs 记住上次停在哪一页、把某个页签弹成独立窗口、以及给出
 * 全模块共用的那条顶部 shell。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ReIcon from "@repo/ui/re-icon";
import ReTabs from "@repo/ui/re-tabs";
import type { ReTabsItem } from "@repo/ui/re-tabs";
import { APM_DEFAULT_TAB, APM_OPEN_TAB_EVENT, APM_TABS, APM_WORKBENCH_ID, findApmTab } from "../tabs";
import { ROUTE_PREFIX, apmConfig } from "../config";
import { useApmStatus } from "../composables/useApmStatus";

defineOptions({ name: "ApmWorkbench" });

const route = useRoute();
const { status, present, error, ensure, refresh } = useApmStatus();

/** 弹出模式：地址上带 `popout=1` 时只渲染单个视图，不挂页签条 */
const isPopout = computed(() => String(route.query.popout ?? "") === "1");

/** 从 URL 里取合法页签名；不合法（外部输入）一律当作没给 */
function tabFromRoute(): string {
  const raw = route.query.tab;
  const name = Array.isArray(raw) ? raw[0] : raw;
  return findApmTab(name) ? String(name) : "";
}

/**
 * 当前页签。
 *
 * <p>URL 带 tab 就用它（深链优先）；不带时留空，交给 `ReTabs` 用本地记忆恢复 ——
 * 恢复失败的兜底是 `onMounted` 里的默认页签。</p>
 */
const active = ref<string>(tabFromRoute());

/** 传给 ReTabs 的页签项：只给骨架字段，组件本体按 name 查表 */
const reTabsItems: ReTabsItem[] = APM_TABS.map(tab => ({
  name: tab.name,
  label: tab.label,
  icon: tab.icon,
}));

/** 按页签名取视图组件 */
function tabComponent(name: string) {
  return findApmTab(name)?.component;
}

/** 弹窗里要渲染的那个视图（不带 tab 时退回默认页） */
const popoutTab = computed(() => findApmTab(tabFromRoute()) ?? findApmTab(APM_DEFAULT_TAB));

/** 顶栏右侧显示当前停在哪一页 */
const activeLabel = computed(() => findApmTab(active.value)?.label ?? "工作台");

/**
 * 把当前页签写回地址栏。
 *
 * <p><strong>为什么不用 `router.replace`</strong>：宿主布局给路由组件挂了
 * `:key="route.fullPath"`，query 一变整页就会重建 —— 页签刚点开、其他面板刚保住的状态
 * 会被一次 URL 同步全部丢掉，正好抵消 `ReTabs` 保活的意义。</p>
 *
 * <p>用 `replaceState` 只改地址不改 router 的当前路由：刷新/分享照样落到同一页
 * （启动时 router 会解析这段 hash），页签切换却不会触发重建；也不往历史里塞 12 条。
 * `replaceState` 不会触发 `hashchange`，因此这次写入不会再回到路由层形成回环。</p>
 *
 * @param name 目标页签名
 */
function syncUrl(name: string): void {
  if (!name) return;
  const hash = `#${ROUTE_PREFIX}?tab=${encodeURIComponent(name)}`;
  if (location.hash === hash) return;
  try {
    window.history.replaceState(window.history.state, "", `${location.pathname}${location.search}${hash}`);
  } catch {
    // 地址栏被浏览器限制改写（极少数嵌入式环境）：记不住位置不影响使用
  }
}

// 页签变化 → 回填 URL
watch(active, (name) => syncUrl(name));

// 外部改地址（旧地址重定向、手点深链）→ 跟着切页签
watch(
  () => route.query.tab,
  () => {
    if (isPopout.value) return;
    const name = tabFromRoute();
    if (name && name !== active.value) active.value = name;
  },
);

/**
 * 把页签弹到独立窗口。
 *
 * <p>地址里带 `tab` 与 `popout=1`：那个窗口只渲染这一页，不会长出第二套页签条。</p>
 *
 * @param name 页签名
 */
function openPopout(name: string): void {
  const url = `${location.origin}${location.pathname}#${ROUTE_PREFIX}?tab=${encodeURIComponent(name)}&popout=1`;
  window.open(url, "_blank", "noopener,width=1440,height=900");
}

/* ==================== 顶栏：引擎状态与时钟 ==================== */

/** 后端是否明确回了「不可用」——和「还没取到」要分开显示 */
const unavailable = computed(() => Boolean(status.value) && !present.value);

/** 状态灯：连上 / 装了连不上 / 请求失败 */
const ledClass = computed(() => {
  if (present.value) return "is-ok";
  if (error.value) return "is-bad";
  if (unavailable.value) return "is-warn";
  return "is-idle";
});

/** 引擎名 + 版本，尽量短：顶栏不是详情面板 */
const engineLabel = computed(() => {
  if (!apmConfig().enable) return "APM 模块已关闭";
  if (error.value) return "状态接口不可达";
  const s = status.value;
  if (!s) return "探测中…";
  if (!s.present) return "未接入 APM";
  return [s.name, s.version].filter((v) => v && v !== "unknown").join(" ") || "APM 已接入";
});

/** 重新探测（手动） */
const probing = ref(false);
async function probe(): Promise<void> {
  probing.value = true;
  try {
    await refresh();
  } finally {
    probing.value = false;
  }
}

/** 顶栏时钟：秒级，只为了让这块面板看起来是「活的」 */
const clock = ref("");
let clockTimer: ReturnType<typeof setInterval> | null = null;

function tick(): void {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  clock.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 视图内部要求切页签（总览点一条服务 → 服务页签）。
 *
 * <p>走事件而不是路由：换 query 会让宿主重建整页，页签保活就白做了。</p>
 *
 * @param event 自定义事件，detail 是页签名
 */
function onOpenTab(event: Event): void {
  const name = (event as CustomEvent<string>).detail;
  if (findApmTab(name)) active.value = name;
}

/**
 * 首屏兜底：URL 没给页签、本地也没有记忆时落在默认页。
 *
 * <p>子组件的 `onMounted` 先于父组件执行，所以这里读到的 `active` 已经包含
 * `ReTabs` 从 localStorage 恢复出来的结果 —— 有记忆就不会被默认页顶掉。</p>
 */
onMounted(() => {
  if (!active.value) active.value = APM_DEFAULT_TAB;
  // 顶栏要显示引擎，页面本身也要它；两边共用同一份缓存，这里先探一次
  if (apmConfig().enable) ensure();
  window.addEventListener(APM_OPEN_TAB_EVENT, onOpenTab);
  tick();
  clockTimer = setInterval(tick, 1000);
});

onBeforeUnmount(() => {
  window.removeEventListener(APM_OPEN_TAB_EVENT, onOpenTab);
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = null;
});
</script>

<style scoped>
/* ==================== shell ==================== */
.apm-shell {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  min-width: 0;
  background: var(--el-bg-color-page);
}

/* 顶栏：一整条，左侧标识、中间引擎、右侧状态与时钟 */
.apm-shell__top {
  display: flex;
  flex: none;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.apm-shell__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

.apm-shell__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.apm-shell__mark svg {
  display: block;
}

.apm-shell__edge {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 1;
  opacity: 0.55;
}

.apm-shell__node {
  fill: var(--el-bg-color);
  stroke: var(--el-color-primary);
  stroke-width: 1.4;
}

.apm-shell__node.is-dim {
  stroke: var(--el-text-color-placeholder);
}

.apm-shell__node.is-accent {
  fill: var(--el-color-primary);
  stroke: var(--el-color-primary);
}

.apm-shell__names {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.apm-shell__names strong {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--el-text-color-primary);
}

.apm-shell__names em {
  font-style: normal;
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.apm-shell__engine {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.apm-shell__led {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.apm-shell__led.is-ok {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px var(--el-color-success-light-9);
}

.apm-shell__led.is-warn {
  background: var(--el-color-warning);
}

.apm-shell__led.is-bad {
  background: var(--el-color-danger);
}

.apm-shell__engine-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apm-shell__sep {
  color: var(--el-text-color-placeholder);
}

.apm-shell__endpoint {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-placeholder);
}

.apm-shell__right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex: none;
}

.apm-shell__pill {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 10.5px;
  font-weight: 600;
  white-space: nowrap;
}

.apm-shell__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.apm-shell__icon-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.apm-shell__icon-btn:disabled {
  cursor: progress;
  opacity: 0.5;
}

.apm-shell__clock {
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

/* ==================== 内容区 ==================== */
.apm-shell__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.apm-workbench {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
}

/* 弹出模式只有一个视图，它就是这个窗口的全部内容 */
.apm-shell--popout .apm-shell__body {
  flex: 1 1 auto;
}

/** 每个页签的内容区：高页面自己滚，页签条始终可见 */
.apm-workbench__view {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: var(--el-bg-color-page);
}

/* ==================== 底部页签：胶囊导航 ==================== */
.apm-workbench :deep(.re-tabs__bar) {
  flex: none;
  gap: 2px;
  padding: 6px 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: none;
  background: var(--el-bg-color);
}

.apm-workbench :deep(.re-tabs__tab) {
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.apm-workbench :deep(.re-tabs__tab:hover) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.apm-workbench :deep(.re-tabs__tab.is-active) {
  background: var(--el-text-color-primary);
  color: var(--el-bg-color);
}

.apm-workbench :deep(.re-tabs__tab.is-active .re-tabs__icon) {
  color: inherit;
}

/* 底栏里「弹出」按钮只在悬停时出现，避免 12 个 × 关闭图标把条变吵 */
.apm-workbench :deep(.re-tabs__popout) {
  width: 14px;
  height: 14px;
  color: inherit;
}

.apm-workbench :deep(.re-tabs__tab.is-active .re-tabs__popout) {
  opacity: 0.55;
}
</style>
