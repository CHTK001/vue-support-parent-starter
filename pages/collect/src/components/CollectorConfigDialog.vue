<!--
  采集器配置弹窗：变量 / 函数 / 通知三个页签。

  为什么从菜单收进弹窗：这三样都是「配置」，不是「目的地」。用户是带着
  「这个采集器为什么跑不出东西」的问题来的，他要看的是这个采集器的运行，
  而不是先切到变量页再切回来。挂成一级菜单会让人以为它们和采集器平级。

  三个页签直接复用原视图（变量/函数/通知），不为弹窗另写一套表单：
  同一份数据、同一套校验，改一处两处生效。
-->
<script setup lang="ts">
import { ref } from "vue";
import ReDialog from "@repo/ui/re-dialog";
import ReTab from "@repo/ui/re-tab";
import FunctionView from "../views/FunctionView.vue";
import NoticeView from "../views/NoticeView.vue";
import VariableView from "../views/VariableView.vue";

const props = defineProps<{
  modelValue: boolean;
  /** 初始页签：variable | function | notice */
  panel?: string;
}>();

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const TABS = [
  { name: "variable", label: "变量管理" },
  { name: "function", label: "函数库" },
  { name: "notice", label: "执行通知" },
];

/** 外部只传合法页签名，脏值（老书签 / 手改 URL）一律回落到变量页 */
const KNOWN = TABS.map(item => item.name);
const tab = ref(KNOWN.includes(props.panel ?? "") ? (props.panel as string) : "variable");
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    width="1120px"
    top="6vh"
    :title="`采集器配置 · ${TABS.find(item => item.name === tab)?.label || ''}`"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="collector-config">
      <ReTab v-model="tab" :tabs="TABS" variant="capsule">
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
