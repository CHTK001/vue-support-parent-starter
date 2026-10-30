<template>
  <div id="harness">
    <button id="open" @click="visible = true">新增主机</button>
    <HostFormDialog
      v-model="visible"
      :is-edit="false"
      :host="null"
      :identity-options="[]"
      :group-options="[]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import HostFormDialog from "../../views/HostFormDialog.vue";

const visible = ref(false);
</script>
