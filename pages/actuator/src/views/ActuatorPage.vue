<!--
  Actuator 单页工作台。

  一个菜单入口 `/actuator`，11 个端点收进 `ReTabs` 的页签里：
    · 页面里只有内容 + 底部页签条 —— 宿主已经有菜单、面包屑和路由页签，
      再叠一层顶栏只会让人以为点进了另一个系统；
    · 每个页签首次点开才挂载，之后常驻（v-show 保活），切回来不重发请求；
    · 当前页签同步到地址（`?tab=loggers`），刷新与分享都能落到同一页；
    · 页签是同一页的不同视角，因此不为它们单独开路由（见 routes/index.ts）。
-->
<template>
  <div class="act-shell">
    <div class="act-shell__body">
      <ReTabs
        v-model="active"
        class="act-workbench"
        :id="ACTUATOR_WORKBENCH_ID"
        :tabs="reTabsItems"
        :closable="false"
        size="mini"
        position="bottom"
        empty-text="Actuator 观测台"
      >
        <template #default="{ tab }">
          <div class="act-workbench__view">
            <component :is="tabComponent(tab.name)" v-if="tabComponent(tab.name)" />
          </div>
        </template>
      </ReTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @pages/actuator 单页工作台
 *
 * <p>页签的「是什么」在 `tabs.ts`，这里只负责两件事：把页签名和 URL 对齐、
 * 让 ReTabs 记住上次停在哪一页。</p>
 */
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ReTabs from "@repo/ui/re-tabs";
import type { ReTabsItem } from "@repo/ui/re-tabs";
import {
  ACTUATOR_DEFAULT_TAB,
  ACTUATOR_TAB_ACTIVATED_EVENT,
  ACTUATOR_TABS,
  ACTUATOR_WORKBENCH_ID,
  findActuatorTab,
} from "../tabs";
import { ROUTE_PREFIX } from "../routes";
// 工作台可能被宿主直接嵌入（不经过 @pages/actuator 的路由表），样式必须跟自己走
import "../styles/actuator.css";

defineOptions({ name: "ActuatorWorkbench" });

const route = useRoute();

/** 从 URL 里取合法页签名；不合法（外部输入）一律当作没给 */
function tabFromRoute(): string {
  const raw = route.query.tab;
  const name = Array.isArray(raw) ? raw[0] : raw;
  return findActuatorTab(name) ? String(name) : "";
}

/**
 * 首次打开的页签：优先 URL（深链优先）；URL 没给时留空，
 * 交给 `ReTabs` 用本地记忆恢复 —— 恢复失败再落到默认页签。
 */
const active = ref<string>(tabFromRoute());

/** 传给 ReTabs 的页签项：只给骨架字段，组件本体按 name 查表 */
const reTabsItems: ReTabsItem[] = ACTUATOR_TABS.map((tab) => ({
  name: tab.name,
  label: tab.label,
  icon: tab.icon,
}));

/** 按页签名取视图组件 */
function tabComponent(name: string) {
  return findActuatorTab(name)?.component;
}

/**
 * 把当前页签写回地址栏。
 *
 * <p><strong>为什么不用 `router.replace`</strong>：宿主布局给路由组件挂了
 * `:key="route.fullPath"`，query 一变整页就会重建 —— 页签刚点开、其他面板刚保住的
 * 状态会被一次 URL 同步全部丢掉，正好抵消 `ReTabs` 保活的意义。</p>
 *
 * <p>用 `replaceState` 只改地址不改 router 的当前路由：刷新/分享照样落到同一页
 * （启动时 router 会解析这段 hash），页签切换却不会触发重建；也不往历史里塞 11 条。</p>
 *
 * @param name 目标页签名
 */
function syncUrl(name: string): void {
  if (!name) return;
  // 保留除 tab 之外的参数：深链可能带着过滤条件，切页签不能把它们抹掉
  const mark = location.hash.indexOf("?");
  const search = new URLSearchParams(mark >= 0 ? location.hash.slice(mark + 1) : "");
  search.set("tab", name);
  // q（过滤词）是页签私有状态，归各面板管：切页签时先摘掉，由新前台面板把自己的词写回
  search.delete("q");
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

// 页签变化 → 回填 URL；同时广播「这一页到前台了」，常驻面板据此静默刷新
watch(active, (name) => {
  syncUrl(name);
  window.dispatchEvent(new CustomEvent(ACTUATOR_TAB_ACTIVATED_EVENT, { detail: { tab: name } }));
});

// 外部改地址（手点深链、浏览器前进后退）→ 跟着切页签
watch(
  () => route.query.tab,
  () => {
    const name = tabFromRoute();
    if (name && name !== active.value) {
      active.value = name;
    }
  },
);

/**
 * 首屏兜底：URL 没给页签、本地也没有记忆时落在默认页。
 *
 * <p>子组件的 `onMounted` 先于父组件执行，所以这里读到的 `active` 已经包含
 * `ReTabs` 从 localStorage 恢复出来的结果 —— 有记忆就不会被默认页顶掉。</p>
 */
onMounted(() => {
  if (!active.value) active.value = ACTUATOR_DEFAULT_TAB;
});
</script>
