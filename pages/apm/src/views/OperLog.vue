<!--
  APM 操作日志 —— 谁在什么时候改了 APM 设置。

  数据是 monitor 模块落的 ms_apm_oper_log：APM 接口不走 Spring MVC，
  @SysLog 切面拦不到，由 ApmDispatcher 在写操作结束时回调 sink 写入。

  只记写操作（保存设置 / 重新探测）：GET 查询不进时间线，
  否则每次打开页面都记一条，真正要看的那几条会被淹掉。
-->
<template>
  <div class="apm-page apm-oplog-page">
    <ReSectionHead description="APM 设置变更与重新探测的留痕；只记写操作，查询不入账">
      <template #title>操作日志</template>
    </ReSectionHead>

    <div class="apm-card apm-card--flush apm-oplog-page__card">
      <div class="apm-oplog-page__body">
        <ApmOperLogPanel ref="panel" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import ReSectionHead from "@repo/ui/re-section-head";
import { APM_TAB_ACTIVATED_EVENT } from "../tabs";
import ApmOperLogPanel from "../components/ApmOperLogPanel.vue";

/** 本页在 URL 上的页签名，必须与 tabs.ts 里的 name 一致 */
const TAB_NAME = "oper-log";

const panel = ref<InstanceType<typeof ApmOperLogPanel> | null>(null);

/**
 * 切回本页签时重取一次。
 *
 * <p>面板在 ReTabs 里是常驻的（{@code v-show} 切换），不重取就会停在切走前的
 * 旧数据 —— 「改完设置回来看到 0 条」比没有刷新按钮更容易误导人。</p>
 *
 * @param event 工作台广播的页签激活事件
 */
function onTabActivated(event: Event): void {
  const detail = (event as CustomEvent<{ tab?: string }>).detail;
  if (detail?.tab === TAB_NAME) {
    void panel.value?.reload();
  }
}

onMounted(() => window.addEventListener(APM_TAB_ACTIVATED_EVENT, onTabActivated));
onBeforeUnmount(() => window.removeEventListener(APM_TAB_ACTIVATED_EVENT, onTabActivated));
</script>

<style scoped>
/* 页签内容区自己滚，这里让卡片吃掉剩余高度，表格才不会被挤成一条线 */
.apm-oplog-page {
  height: 100%;
  min-height: 0;
}

.apm-oplog-page__card {
  flex: 1 1 auto;
  min-height: 0;
}

.apm-oplog-page__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 0;
  padding: 12px 16px 16px;
}
</style>
