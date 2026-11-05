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
import { APM_DEFAULT_TAB, APM_OPEN_TAB_EVENT, APM_TABS, APM_WORKBENCH_ID, findApmTab } from "../tabs";
import { ROUTE_PREFIX } from "../config";

defineOptions({ name: "ApmWorkbench" });

const route = useRoute();

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
  window.addEventListener(APM_OPEN_TAB_EVENT, onOpenTab);
});

onBeforeUnmount(() => {
  window.removeEventListener(APM_OPEN_TAB_EVENT, onOpenTab);
});
</script>

<style scoped>
/* ==================== 骨架 ==================== */
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
  /* 画布上两团极淡的主题色光晕：滚动时固定在容器上，
     页面再长也不会退化成一大片死灰 */
  background-color: var(--el-bg-color-page);
  background-image:
    radial-gradient(
      1100px 460px at 6% -8%,
      color-mix(in srgb, var(--el-color-primary) 13%, transparent),
      transparent 68%
    ),
    radial-gradient(
      860px 400px at 98% -6%,
      color-mix(in srgb, var(--el-color-success) 9%, transparent),
      transparent 70%
    );
  background-repeat: no-repeat;
}

/* ==================== 底部页签：灰底上的白色胶囊 ==================== */
.apm-workbench :deep(.re-tabs__bar) {
  flex: none;
  gap: 2px;
  padding: 7px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: none;
  background: var(--el-fill-color-light);
}

.apm-workbench :deep(.re-tabs__tab) {
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.apm-workbench :deep(.re-tabs__tab:hover) {
  background: color-mix(in srgb, var(--el-bg-color) 70%, transparent);
  color: var(--el-color-primary);
}

.apm-workbench :deep(.re-tabs__tab.is-active) {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--el-color-black) 8%, transparent),
    0 8px 18px -12px color-mix(in srgb, var(--el-color-primary) 60%, transparent);
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
