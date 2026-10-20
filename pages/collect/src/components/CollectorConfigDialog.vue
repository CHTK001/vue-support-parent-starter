<!--
  采集器全局配置弹窗：全局配置 / 变量 / 函数 / 通知四个页签。

  唯一入口在采集器管理页的顶部工具栏（「全局配置」下拉），不在任何一行里：
  这四样都是平台级配置，逐行挂入口会让人以为「这条采集器有自己的一套变量」。
  原先挂在操作列「设置」按钮与「更多」里的入口已收掉。

  为什么做成弹窗而不是独立菜单：这些是「配置」，不是「目的地」。用户是带着
  「这个采集器为什么跑不出东西」的问题来的，他要看的是这个采集器的运行，
  而不是先切到变量页再切回来。挂成一级菜单会让人以为它们和采集器平级。

  三个业务页签直接复用原视图（变量/函数/通知），不为弹窗另写一套表单：
  同一份数据、同一套校验，改一处两处生效。

  全局配置放首位：操作列定义是「谁能吃到」的公共配置，六个列表共用一份，
  不该藏在某个业务页签里。
-->
<script setup lang="ts">
import { ref, watch } from "vue";
import ReDialog from "@repo/ui/re-dialog";
import ReTab from "@repo/ui/re-tab";
import CollectActionConfig from "./CollectActionConfig.vue";
import FunctionView from "../views/FunctionView.vue";
import NoticeView from "../views/NoticeView.vue";
import VariableView from "../views/VariableView.vue";

const props = defineProps<{
  modelValue: boolean;
  /** 初始页签：global | variable | function | notice */
  panel?: string;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const TABS = [
  { name: "global", label: "全局配置" },
  { name: "variable", label: "变量管理" },
  { name: "function", label: "函数库" },
  { name: "notice", label: "执行通知" },
];

/** 外部只传合法页签名，脏值（老书签 / 手改 URL）一律回落到全局配置页 */
const KNOWN = TABS.map(item => item.name);

/**
 * 把外部传入的页签名收敛成合法值。
 *
 * @param panel 外部页签名，允许为 undefined 或历史遗留的脏值
 * @return 合法页签名；脏值统一回落到 global
 */
function resolvePanel(panel?: string): string {
  return KNOWN.includes(panel ?? "") ? (panel as string) : "global";
}

const tab = ref(resolvePanel(props.panel));

/**
 * 页签必须跟随外部入口走，不能只在 setup 里求值一次。
 *
 * 本组件被 CollectorView 常驻挂载（模板上没有 v-if），setup 只执行一次。
 * 若初始化后就不再读 props.panel，后续 openConfig(panel) 与
 * /collect/xxx?panel=xxx 深链改了 panel 也不生效，四个入口会一起落回
 * 首次挂载时的 variable。
 *
 * 连带 modelValue 一起监听：只盯 panel 变化不够。用户手动切过页签后
 * panel 可能与上次入口同值而 watch 不触发，此时重新打开应当以本次入口
 * 为准，否则会出现「点函数库却落回上次手选的执行通知」。
 */
watch(
  () => [props.panel, props.modelValue] as const,
  ([panel, open]) => {
    if (open) {
      tab.value = resolvePanel(panel);
    }
  },
);
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    width="min(1200px, 96vw)"
    top="10px"
    :title="`采集器配置 · ${TABS.find(item => item.name === tab)?.label || ''}`"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="collector-config">
      <ReTab v-model="tab" :tabs="TABS" variant="capsule">
        <template #global>
          <CollectActionConfig />
        </template>
        <template #variable>
          <VariableView />
        </template>
        <template #function>
          <FunctionView />
        </template>
        <template #notice>
          <NoticeView />
        </template>
      </ReTab>
    </div>
  </ReDialog>
</template>

<style scoped>
.collector-config {
  height: calc(100vh - 220px);
  overflow: auto;
}
</style>
