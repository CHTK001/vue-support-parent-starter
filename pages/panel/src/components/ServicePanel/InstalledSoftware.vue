<template>
  <div class="installed-software">
    <div class="cards-toolbar">
      <ElInput
        v-model="searchQuery"
        placeholder="搜索已安装软件..."
        clearable
        style="width: 220px"
      />
      <ElSelect v-model="statusFilter" placeholder="全部状态" clearable style="width: 130px">
        <ElOption label="运行中" value="running" />
        <ElOption label="已停止" value="stopped" />
        <ElOption label="未安装" value="uninstalled" />
      </ElSelect>
      <ElButton :loading="loading" circle @click="$emit('refresh')">
        <IconifyIconOnline icon="ep:refresh" />
      </ElButton>
    </div>

    <div v-if="loading && bindings.length === 0" class="installed-loading">
      <ElSkeleton :rows="3" animated />
    </div>

    <div v-else-if="filteredBindings.length === 0" class="installed-empty">
      <ElEmpty :description="bindings.length === 0 ? '暂无已安装软件' : '没有匹配的软件，试试其他搜索条件'">
        <ElButton v-if="bindings.length === 0" type="primary" @click="$emit('install', undefined)">
          安装第一个软件
        </ElButton>
      </ElEmpty>
    </div>

    <div v-else class="cards-grid">
      <SoftwareCard
        v-for="b in filteredBindings"
        :key="b.sysProjectContainerSoftwareBindingId"
        :binding="b"
        :action-loading="actionLoading === b.sysProjectContainerSoftwareBindingId"
        :last-error="bindingErrors[b.sysProjectContainerSoftwareBindingId || 0]"
        @install="(binding: any) => $emit('install', binding)"
        @start="(binding: any) => $emit('start', binding)"
        @stop="(binding: any) => $emit('stop', binding)"
        @restart="(binding: any) => $emit('restart', binding)"
        @diagnose="(binding: any) => $emit('diagnose', binding)"
        @reinstall="(binding: any) => $emit('reinstall', binding)"
        @edit-config="(binding: any) => $emit('edit-config', binding)"
        @uninstall="(binding: any) => $emit('uninstall', binding)"
        @open-panel="(binding: any) => $emit('open-panel', binding)"
        @ai-analyze="(binding: any) => $emit('ai-analyze', binding)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElButton, ElEmpty, ElInput, ElOption, ElSelect, ElSkeleton } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareCard from "./SoftwareCard.vue";
import type { SoftwareBinding } from "../../api/software";

const props = defineProps<{
  bindings: SoftwareBinding[];
  loading: boolean;
  actionLoading: number | null;
  bindingErrors: Record<number, string>;
}>();

defineEmits<{
  install: [binding: SoftwareBinding];
  start: [binding: SoftwareBinding];
  stop: [binding: SoftwareBinding];
  restart: [binding: SoftwareBinding];
  diagnose: [binding: SoftwareBinding];
  reinstall: [binding: SoftwareBinding];
  "edit-config": [binding: SoftwareBinding];
  uninstall: [binding: SoftwareBinding];
  "open-panel": [binding: SoftwareBinding];
  "ai-analyze": [binding: SoftwareBinding];
  refresh: [];
}>();

const searchQuery = ref("");
const statusFilter = ref("");

const filteredBindings = computed(() => {
  let list = props.bindings;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (b) =>
        b.softwareName?.toLowerCase().includes(q) ||
        b.softwareCode?.toLowerCase().includes(q),
    );
  }
  if (statusFilter.value === "running") {
    list = list.filter((b) => b.runtimeStatus === "RUNNING");
  } else if (statusFilter.value === "stopped") {
    list = list.filter((b) => b.runtimeStatus === "STOPPED" && b.installStatus === "SUCCESS");
  } else if (statusFilter.value === "uninstalled") {
    list = list.filter((b) => b.installStatus !== "SUCCESS");
  }
  return list;
});
</script>

<style scoped>
.installed-software {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.cards-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
}
.installed-loading {
  padding: 20px;
}
.installed-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
