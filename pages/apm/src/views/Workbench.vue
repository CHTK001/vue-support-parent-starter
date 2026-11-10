<!--
  APM 单页工作台。

  一个菜单入口 `/apm`，12 个视图收进 `ReTabs` 的页签里：
    · 页面里只有内容 + 底部页签条，不再自带第二条顶栏 ——
      宿主已经有菜单、面包屑和路由页签，再叠一层「APM 标识 + 引擎 + 时钟」
      只会让人以为点进了另一个系统；
    · 引擎/版本/模式由各页自己的抬头与「引擎探测」卡片交代（见 Overview）；
    · 每个页签首次点开才挂载，之后常驻（v-show 保活），切回来不重发请求；
    · 当前页签同步到 URL（`?tab=services`），刷新与分享都能落到同一页；
    · 页签可以弹出成独立窗口（`?tab=x&popout=1`，只渲染那一页、没有页签条）。

  旧地址 `/apm/services` 之类的兼容由 `routes/index.ts` 的重定向负责，
  视图里的跳转因此不需要改一行代码。
-->
<template>
  <div class="apm-shell" :class="{ 'apm-shell--popout': isPopout }">
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
 * <p>页签的「是什么」在 `tabs.ts`，这里只负责三件事：把页签名和 URL 对齐、
 * 让 ReTabs 记住上次停在哪一页、把某个页签弹成独立窗口。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ReTabs from "@repo/ui/re-tabs";
import type { ReTabsItem } from "@repo/ui/re-tabs";
import { APM_DEFAULT_TAB, APM_OPEN_TAB_EVENT, APM_TAB_ACTIVATED_EVENT, APM_TABS, APM_WORKBENCH_ID, findApmTab, stashApmTabContext } from "../tabs";
import type { ApmTabContext } from "../tabs";
import { ROUTE_PREFIX } from "../config";

defineOptions({ name: "ApmWorkbench" });

const route = useRoute();

/**
 * 从地址里取跨页定位上下文（服务名 / 端点 / 实例 / 时间窗 / 链路 / 告警实体）。
 *
 * <p>深链场景：别的模块点「APM 观测」时只能带 URL（例如发布管理的项目右键，
 * 会带 {@code ?tab=services&service=xxx}）。页签视图的 {@code onMounted} 早于
 * 本组件的 {@code onMounted}，所以必须在 setup 阶段就把上下文暂存好，
 * 否则落地页取到的永远是空对象。</p>
 *
 * @returns 有效的上下文；一个字段都没有时返回 null
 */
function contextFromRoute(): ApmTabContext | null {
  const pick = (key: string): string => {
    const raw = route.query[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value == null ? "" : String(value).trim();
  };
  const context: ApmTabContext = {};
  const service = pick("service");
  const endpoint = pick("endpoint");
  const instance = pick("instance");
  const traceId = pick("traceId");
  const entity = pick("entity");
  const minutes = Number(pick("minutes"));
  if (service) context.service = service;
  if (endpoint) context.endpoint = endpoint;
  if (instance) context.instance = instance;
  if (traceId) context.traceId = traceId;
  if (entity) context.entity = entity;
  if (Number.isFinite(minutes) && minutes > 0) context.minutes = minutes;
  return Object.keys(context).length ? context : null;
}

// 只在 setup 里暂存一次：页签内部消费后即清空，切页签不该再触发一次筛选
const bootContext = contextFromRoute();
if (bootContext) {
  stashApmTabContext(bootContext);
}

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
  // 保留除 tab 之外的参数：从服务详情跳过来时会带 service / endpoint / minutes，
  // 切页签不能把它们抹掉，否则刷新一下就丢了筛选条件（要重新选一遍）。
  const mark = location.hash.indexOf("?");
  const search = new URLSearchParams(mark >= 0 ? location.hash.slice(mark + 1) : "");
  search.set("tab", name);
  const hash = `#${ROUTE_PREFIX}?${search.toString()}`;
  if (location.hash === hash) {
    return;
  }
  try {
    window.history.replaceState(window.history.state, "", `${location.pathname}${location.search}${hash}`);
  } catch {
    // 地址栏被浏览器限制改写（极少数嵌入式环境）：记不住位置不影响使用
  }
}

// 页签变化 → 回填 URL；同时广播「这一页到前台了」，常驻面板据此重取数据
watch(active, (name) => {
  syncUrl(name);
  window.dispatchEvent(new CustomEvent(APM_TAB_ACTIVATED_EVENT, { detail: { tab: name } }));
});

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

/**
 * 视图内部要求切页签（总览点一条服务 → 服务页签）。
 *
 * <p>走事件而不是路由：换 query 会让宿主重建整页，页签保活就白做了。</p>
 *
 * <p>detail 兼容两种形态：老调用方直接传页签名字符串；
 * 新调用方传 {@code { tab, context }}，context 暂存后由落地页取走，
 * 于是「点慢服务跳过去」不用再手选一次服务。</p>
 *
 * @param event 自定义事件
 */
function onOpenTab(event: Event): void {
  const detail = (event as CustomEvent<string | { tab: string; context?: ApmTabContext }>).detail;
  const name = typeof detail === "string" ? detail : detail?.tab;
  const context = typeof detail === "string" ? undefined : detail?.context;
  if (!name || !findApmTab(name)) {
    return;
  }
  stashApmTabContext(context);
  active.value = name;
}

/**
 * 首屏兜底：URL 没给页签、本地也没有记忆时落在默认页。
 *
 * <p>子组件的 `onMounted` 先于父组件执行，所以这里读到的 `active` 已经包含
 * `ReTabs` 从 localStorage 恢复出来的结果 —— 有记忆就不会被默认页顶掉。</p>
 */
onMounted(() => {
  if (!active.value) active.value = APM_DEFAULT_TAB;
  window.addEventListener(APM_OPEN_TAB_EVENT, onOpenTab);
});

onBeforeUnmount(() => {
  window.removeEventListener(APM_OPEN_TAB_EVENT, onOpenTab);
});
</script>

<style scoped>
/* ==========================================================================
   工作台外壳（颜色全部取自系统 koi 令牌，html.dark 自动切深浅）
   ========================================================================== */

/* 本地别名：主强调 = koi 品牌紫，与宿主按钮 / 选中态同一色系 */
.apm-shell {
  --apm-sig: var(--brand-500, #6d5dfc);
  --apm-sig-bg: var(--bg-page, var(--el-bg-color-page, #f6f7fb));
  --apm-sig-surface: var(--bg-container, var(--el-bg-color, #fff));
  --apm-sig-line: var(--border-subtle, var(--el-border-color-lighter, #eef0f6));
  --apm-sig-text: var(--text-secondary, var(--el-text-color-regular, #5c6270));
}

/* ==================== 骨架 ==================== */
.apm-shell {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  min-width: 0;
  background: var(--apm-sig-bg);
}

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

/** 每个页签的内容区：高页面自己滚，页签条始终可见。
    底色用宿主页面底色，不加点阵（自造纹理与 koi 卡片语言不搭）。 */
.apm-workbench__view {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: var(--apm-sig-bg);
}

/* ==================== 底部页签：沿用宿主页签语言 ==================== */
.apm-workbench :deep(.re-tabs__bar) {
  flex: none;
  gap: 2px;
  padding: 7px 12px;
  border-top: 1px solid var(--apm-sig-line);
  border-bottom: none;
  background: var(--apm-sig-surface);
}

.apm-workbench :deep(.re-tabs__tab) {
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-sm, 6px);
  border-bottom: 2px solid transparent;
  font-size: 12.5px;
  color: var(--apm-sig-text);
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.apm-workbench :deep(.re-tabs__tab:hover) {
  background: var(--bg-hover, color-mix(in srgb, var(--apm-sig) 6%, transparent));
  color: var(--apm-sig);
}

/* 激活态：与宿主页签一致（品牌紫文字 + 紫底淡染），不加发光 */
.apm-workbench :deep(.re-tabs__tab.is-active) {
  background: color-mix(in srgb, var(--apm-sig) 10%, var(--apm-sig-surface));
  color: var(--apm-sig);
  border-bottom-color: var(--apm-sig);
  font-weight: 600;
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
