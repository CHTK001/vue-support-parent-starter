<template>
  <sc-dialog
    v-model="visibleInner"
    class="firewall-dialog"
    title="防火墙管理"
    width="90vw"
    :close-on-click-modal="false"
    :show-footer="false"
    destroy-on-close
  >
    <FirewallManagementWorkspace
      :server-id="serverId"
      :filter-setting-id="filterSettingId"
      @success="emit('success')"
    />
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ScDialog } from "@repo/components/ScDialog";
import FirewallManagementWorkspace from "./FirewallManagementWorkspace.vue";

const props = defineProps<{
  visible: boolean;
  serverId: number;
  filterSettingId: number;
}>();

const emit = defineEmits<{
  "update:visible": [boolean];
  success: [];
}>();

const visibleInner = ref(false);

watch(
  () => props.visible,
  (value) => {
    visibleInner.value = value;
  },
  { immediate: true },
);

watch(visibleInner, (value) => emit("update:visible", value));
</script>

<style scoped lang="scss">
.firewall-dialog :deep(.el-dialog) {
  width: min(90vw, 1720px) !important;
  max-width: none;
  height: 90vh;
  margin-top: 5vh !important;
  overflow: hidden;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%);
}

.firewall-dialog :deep(.el-dialog__header) {
  padding: 18px 22px 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 249, 255, 0.96) 100%);
  border-bottom: 1px solid rgba(97, 123, 162, 0.18);
}

.firewall-dialog :deep(.el-dialog__title) {
  color: #1f466d;
}

.firewall-dialog :deep(.el-dialog__body) {
  height: calc(90vh - 66px);
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(88, 121, 176, 0.1) 0%, transparent 32%),
    linear-gradient(180deg, #f7fbff 0%, #f1f7ff 100%);
}

@media (max-width: 960px) {
  .firewall-dialog :deep(.el-dialog) {
    width: calc(100vw - 18px) !important;
    height: calc(100vh - 18px);
    margin-top: 9px !important;
  }

  .firewall-dialog :deep(.el-dialog__body) {
    height: calc(100vh - 84px);
    padding: 10px;
  }
}
</style>
