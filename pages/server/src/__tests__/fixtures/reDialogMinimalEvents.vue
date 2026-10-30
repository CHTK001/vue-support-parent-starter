<template>
  <div id="minimal-events">
    <button id="open" @click="visible = true">开</button>
    <button id="close" @click="visible = false">关</button>
    <ReDialog
      :model-value="visible"
      @update:model-value="visible = $event"
      @open="Events.push('open')"
      @close="Events.push('close')"
      @closed="Events.push('closed')"
      @after-leave="Events.push('afterLeave')"
      @after-enter="Events.push('afterEnter')"
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
import { Events } from "./shared";

const visible = ref(false);
</script>
