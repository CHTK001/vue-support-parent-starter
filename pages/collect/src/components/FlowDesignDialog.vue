<!--
  流程设计弹窗：采集器管理里点「流程设计」打开，承载 FlowView 的 embedded 模式。

  为什么设计流程不再占独立菜单：它是采集器的「编辑态」而不是一级目的地。
  独立菜单会让人在列表和设计器之间反复横跳，还要多维护一份 keep-alive 缓存，
  还会让人以为「设计」和「采集器」是两个并列的东西。

  destroy-on-close 必开：设计器是有状态的（当前画布、未保存标记、轮询定时器），
  复用实例会把上一次的草稿带进下一次打开。

  close-on-press-escape 必须显式关掉（ReDialog 默认是 true）：实测在设计器里按一次 Esc，
  整个设计器被卸载（画布 1→0、节点 30→0、面板 1→0，hash 不变），配合 destroy-on-close
  会连未保存的草稿一起销毁。属性面板里的「弹窗配置」与占位弹层也都在 ReDialog 体系内，
  用户想「关掉那个小弹层」按 Esc 时会把整个设计器一起带走。
  设计器改用头部关闭按钮退出；内层弹层仍按 Esc 关闭（只关最内层）。
-->
<script setup lang="ts">
import ReDialog from "@repo/ui/re-dialog";
import FlowView from "../views/FlowView.vue";

const props = defineProps<{
  modelValue: boolean;
  /** 要装载的采集器 ID；null 表示新建空白画布 */
  flowId?: number | null;
  /** 弹窗标题，调用方传采集器名 */
  title?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", flowId: number): void;
}>();
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    fullscreen
    :title="props.title || (props.flowId ? '流程设计' : '新建采集器流程')"
    :destroy-on-close="true"
    :close-on-press-escape="false"
    footer-hidden
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flow-design-dialog">
      <FlowView embedded :flow-id="props.flowId ?? null" @saved="emit('saved', $event)" />
    </div>
  </ReDialog>
</template>

<style scoped>
/* 全屏弹窗里减去标题栏与内边距，剩余高度全部给画布 */
.flow-design-dialog {
  height: calc(100vh - 132px);
  overflow: hidden;
}
.flow-design-dialog :deep(.collect-page) {
  height: 100%;
}
</style>
