<template>
  <div id="harness">
    <button id="open" @click="visible = true">新增主机</button>
    <HostFormDialog
      v-model="visible"
      :is-edit="false"
      :host="null"
      :identity-options="[]"
      :group-options="[]"
      @open="events.push('open')"
      @close="events.push('close')"
      @closed="events.push('closed')"
      @update:model-value="(v: boolean) => events.push(`mv:${String(v)}`)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import HostFormDialog from "../../views/HostFormDialog.vue";

const visible = ref(false);
const events = ref<string[]>([]);
</script>
