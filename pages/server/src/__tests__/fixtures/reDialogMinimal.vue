<template>
  <div id="minimal">
    <button id="open" @click="visible = true">开</button>
    <button id="close" @click="visible = false">关</button>
    <ReDialog
      :model-value="visible"
      @update:model-value="visible = $event"
      @open="log('open')"
      @close="log('close')"
      @closed="log('closed')"
      @after-leave="log('afterLeave')"
      title="弹窗"
      width="880px"
      :height="900"
      :close-on-click-modal="false"
    >
      <div v-show="visible">内容</div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

/** 注意：ReDialog 不从 @repo/ui/re-dialog 本地引入——那里是 defineAsyncComponent
 * 包装的壳（不透传 emit），KoiReDialog 由 installUi 注册到全局后，模板才能收到 open/close/closed */
const visible = ref(false);
const events = ref<string[]>([]);

function log(e: string): void {
  events.value = [...events.value, e];
}
</script>
