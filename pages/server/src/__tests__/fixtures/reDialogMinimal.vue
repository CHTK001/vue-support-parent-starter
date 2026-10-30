<template>
  <div id="minimal">
    <button id="open" @click="visible = true">开</button>
    <ReDialog
      :model-value="visible"
      @update:model-value="visible = $event"
      @open="log('open')"
      @close="log('close')"
      @closed="log('closed')"
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
import ReDialog from "@repo/ui/re-dialog";

const visible = ref(false);
const events = ref<string[]>([]);
function log(e: string): void {
  events.value = [...events.value, e];
}
</script>
